import type {
  AreaRegistryEntry,
  DeviceRegistryEntry,
  EntityRegistryEntry,
  HassEntity,
  HomeAssistant
} from "../src/types";

export type RegistryFixture = {
  areas?: AreaRegistryEntry[];
  devices?: DeviceRegistryEntry[];
  entities?: EntityRegistryEntry[];
};

export type ServiceCall = {
  domain: string;
  service: string;
  data?: Record<string, unknown>;
};

export function entity(entity_id: string, state = "off", attributes: Record<string, unknown> = {}): HassEntity {
  return { entity_id, state, attributes: { friendly_name: entity_id, ...attributes } };
}

export function hass(states: Record<string, HassEntity>, registry: RegistryFixture = {}, calls: ServiceCall[] = []): HomeAssistant {
  return {
    states,
    areas: registry.areas || [],
    connected: true,
    locale: { language: "zh-Hans" },
    callService: async (domain, service, data) => {
      calls.push({ domain, service, data });
    },
    callWS: async <T = unknown>(message: Record<string, unknown>) => response<T>(message.type, registry)
  };
}

function response<T>(type: unknown, registry: RegistryFixture): T {
  if (type === "config/area_registry/list") return (registry.areas || []) as T;
  if (type === "config/device_registry/list") return (registry.devices || []) as T;
  if (type === "config/entity_registry/list") return (registry.entities || []) as T;
  if (type === "config/floor_registry/list" || type === "config/label_registry/list") return [] as T;
  return [] as T;
}
