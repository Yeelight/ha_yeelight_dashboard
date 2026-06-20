import type {
  AreaRegistryEntry,
  DeviceRegistryEntry,
  EntityRegistryEntry,
  HassEntity,
  HomeAssistant,
  RegistryData
} from "../types";

const EMPTY_REGISTRY: RegistryData = { areas: [], devices: [], entities: [], floors: [], labels: [] };

export type RegistryIndex = RegistryData & {
  devicesById: Map<string, DeviceRegistryEntry>;
  entitiesById: Map<string, EntityRegistryEntry>;
  entitiesByArea: Map<string, string[]>;
  entitiesByDomain: Map<string, string[]>;
  yeelightEntities: string[];
  unassignedEntities: string[];
};

let cachedPromise: Promise<RegistryData> | undefined;
let cachedHass: HomeAssistant | undefined;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

export async function loadRegistry(hass?: HomeAssistant): Promise<RegistryData> {
  if (!hass?.callWS) return EMPTY_REGISTRY;
  const now = Date.now();
  if (cachedPromise && cachedHass === hass && now - cachedAt < CACHE_TTL_MS) return cachedPromise;
  cachedHass = hass;
  cachedAt = now;
  cachedPromise = Promise.all([
    safeCallWS<AreaRegistryEntry[]>(hass, "config/area_registry/list"),
    safeCallWS<Record<string, unknown>[]>(hass, "config/floor_registry/list"),
    safeCallWS<DeviceRegistryEntry[]>(hass, "config/device_registry/list"),
    safeCallWS<EntityRegistryEntry[]>(hass, "config/entity_registry/list"),
    safeCallWS<Record<string, unknown>[]>(hass, "config/label_registry/list")
  ])
    .then(([areas, floors, devices, entities, labels]) => ({ areas, floors, devices, entities, labels }))
    .catch((error: Error) => ({ ...EMPTY_REGISTRY, error: error.message }));
  return cachedPromise;
}

async function safeCallWS<T>(hass: HomeAssistant, type: string): Promise<T> {
  try {
    return await hass.callWS!<T>({ type });
  } catch {
    return [] as T;
  }
}

export function buildRegistryIndex(hass: HomeAssistant | undefined, registry: RegistryData): RegistryIndex {
  const devicesById = new Map(registry.devices.map((device) => [device.id, device]));
  const entitiesById = new Map(registry.entities.map((entity) => [entity.entity_id, entity]));
  const entitiesByArea = new Map<string, string[]>();
  const entitiesByDomain = new Map<string, string[]>();
  const yeelightEntities: string[] = [];
  const unassignedEntities: string[] = [];

  for (const entityId of Object.keys(hass?.states || {})) {
    const registryEntity = entitiesById.get(entityId);
    if (registryEntity?.disabled_by || registryEntity?.hidden_by) continue;
    const areaId = areaIdForEntity(registryEntity, devicesById);
    const domain = domainOf(entityId);
    pushMap(entitiesByDomain, domain, entityId);
    if (areaId) pushMap(entitiesByArea, areaId, entityId);
    else unassignedEntities.push(entityId);
    if (isYeelightEntity(registryEntity, devicesById.get(registryEntity?.device_id || ""))) {
      yeelightEntities.push(entityId);
    }
  }

  return {
    ...registry,
    devicesById,
    entitiesById,
    entitiesByArea,
    entitiesByDomain,
    yeelightEntities,
    unassignedEntities
  };
}

export function selectableEntities(hass: HomeAssistant | undefined, index: RegistryIndex, scope: string): string[] {
  const all = Object.keys(hass?.states || {}).filter((entityId) => !index.entitiesById.get(entityId)?.disabled_by);
  if (scope === "yeelight_only") return index.yeelightEntities;
  if (scope === "yeelight_and_area") {
    const areaEntities = [...index.entitiesByArea.values()].flat();
    return unique([...index.yeelightEntities, ...areaEntities]);
  }
  return all;
}

export function entityName(entity?: HassEntity): string {
  const name = entity?.attributes.friendly_name;
  return typeof name === "string" ? name : entity?.entity_id || "";
}

export function domainOf(entityId: string): string {
  return entityId.split(".")[0] || "";
}

export function areaIdForEntity(
  entity: EntityRegistryEntry | undefined,
  devicesById: Map<string, DeviceRegistryEntry>
): string | null {
  return entity?.area_id || devicesById.get(entity?.device_id || "")?.area_id || null;
}

export function isAvailable(entity?: HassEntity): boolean {
  return !!entity && entity.state !== "unavailable" && entity.state !== "unknown";
}

function isYeelightEntity(entity: EntityRegistryEntry | undefined, device: DeviceRegistryEntry | undefined): boolean {
  if (entity?.platform === "yeelight_pro") return true;
  const text = [device?.manufacturer, device?.model, device?.name, device?.name_by_user].filter(Boolean).join(" ");
  return /\b(yeelight|lucore)\b/i.test(text);
}

function pushMap(map: Map<string, string[]>, key: string, value: string): void {
  const values = map.get(key) || [];
  values.push(value);
  map.set(key, values);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
