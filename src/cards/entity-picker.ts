import { cardDefinitionFromType } from "./card-definitions";
import type { DashboardCardConfig, DashboardCardKind, HomeAssistant } from "./types";

export const ENTITY_PICKER_LIMIT = 50;

const CARD_DOMAIN_HINTS: Record<string, string[]> = {
  hero: ["light", "switch", "scene", "script", "button", "sensor", "binary_sensor"],
  light: ["light"],
  room: ["light", "switch", "cover", "climate", "fan", "sensor", "binary_sensor"],
  rooms: ["light", "switch", "cover", "climate", "fan", "sensor", "binary_sensor"],
  devices: ["light", "switch", "cover", "climate", "fan", "humidifier", "media_player", "remote", "sensor", "binary_sensor"],
  routines: ["scene", "script", "automation", "button", "schedule"],
  environment: ["weather", "climate", "fan", "humidifier", "sensor", "binary_sensor"],
  climate: ["climate", "weather", "sensor"],
  air: ["fan", "humidifier", "sensor", "binary_sensor"],
  water: ["sensor", "binary_sensor"],
  power: ["switch", "sensor"],
  energy: ["sensor"],
  infrastructure: ["sensor", "binary_sensor", "update"],
  media: ["media_player", "remote"],
  camera: ["camera"],
  cameraWall: ["camera"],
  security: ["alarm_control_panel", "lock", "binary_sensor", "sensor"],
  presence: ["person", "device_tracker", "binary_sensor", "sensor"],
  panelActions: ["scene", "script", "automation", "button", "light", "switch", "fan"],
  image: ["camera"],
  note: ["sensor", "binary_sensor", "update"],
  notice: ["update", "repair", "binary_sensor", "sensor"],
  ecosystem: ["light", "switch", "sensor", "binary_sensor", "update"],
  health: ["update", "sensor", "binary_sensor", "button", "event", "calendar", "todo"],
  status: ["light", "switch", "cover", "climate", "fan", "scene", "script", "automation", "button"]
};

export type EntityOption = {
  entityId: string;
  name: string;
  domain: string;
  deviceClass: string;
  recommended: boolean;
};

export type EntityPickerFilters = {
  query: string;
  domain: string;
  selected: string[];
};

export type EntityPickerResult = {
  options: EntityOption[];
  total: number;
  filteredTotal: number;
  shown: number;
  domains: string[];
};

export function buildEntityOptions(hass: HomeAssistant | undefined, config: DashboardCardConfig): EntityOption[] {
  const kind = cardDefinitionFromType(config.type)?.kind;
  const subtype = config.subtype;
  return Object.values(hass?.states || {})
    .map((state) => {
      const entityId = state.entity_id;
      const domain = entityId.split(".")[0] || "";
      const name = typeof state.attributes.friendly_name === "string" && state.attributes.friendly_name ? state.attributes.friendly_name : entityId;
      const deviceClass = typeof state.attributes.device_class === "string" ? state.attributes.device_class : "";
      return { entityId, name, domain, deviceClass, recommended: isRecommendedEntityForKind(kind, { entityId, name, domain, deviceClass }, subtype) };
    })
    .sort(compareEntityOptions);
}

export function filterEntityOptions(
  options: EntityOption[],
  filters: EntityPickerFilters,
  limit = ENTITY_PICKER_LIMIT
): EntityPickerResult {
  const selected = new Set(filters.selected);
  const query = normalizeText(filters.query);
  const domainFilter = filters.domain;
  const filtered = options.filter((option) => {
    if (selected.has(option.entityId)) return false;
    if (domainFilter && option.domain !== domainFilter) return false;
    if (!query) return true;
    return normalizeText(`${option.name} ${option.entityId}`).includes(query);
  });
  return {
    options: filtered.slice(0, limit),
    total: options.length,
    filteredTotal: filtered.length,
    shown: Math.min(filtered.length, limit),
    domains: domainsForOptions(options)
  };
}

export function defaultDomainForCard(config: DashboardCardConfig, options: EntityOption[]): string {
  const recommended = recommendedDomainsForCard(config.type, config.subtype);
  if (!recommended.length) return "";
  const availableDomains = new Set(options.map((option) => option.domain));
  return recommended.find((domain) => availableDomains.has(domain)) || "";
}

export function recommendedDomainsForCard(type: string | undefined, subtype?: string): string[] {
  const kind = cardDefinitionFromType(type)?.kind;
  return kind ? domainsForKind(kind, subtype) : [];
}

export function isRecommendedEntityForCard(hass: HomeAssistant | undefined, type: string | undefined, entityId: string, subtype?: string): boolean {
  const state = hass?.states?.[entityId];
  if (!state) return false;
  const kind = cardDefinitionFromType(type)?.kind;
  const domain = entityId.split(".")[0] || "";
  const name = typeof state.attributes.friendly_name === "string" && state.attributes.friendly_name ? state.attributes.friendly_name : entityId;
  const deviceClass = typeof state.attributes.device_class === "string" ? state.attributes.device_class : "";
  return isRecommendedEntityForKind(kind, { entityId, name, domain, deviceClass }, subtype);
}

function domainsForKind(kind: DashboardCardKind, subtype?: string): string[] {
  if (kind === "routines") {
    if (subtype === "scripts") return ["script"];
    if (subtype === "automations") return ["automation"];
    if (subtype === "schedule") return ["schedule"];
    if (subtype === "button") return ["button"];
    if (subtype === "commands") return ["scene", "script", "button"];
  }
  if (kind === "environment") {
    if (subtype === "weather") return ["weather", "sensor"];
    if (subtype === "sensors" || subtype === "illuminance") return ["sensor", "binary_sensor"];
  }
  if (kind === "climate" && subtype === "single") return ["climate"];
  if (kind === "air") {
    if (subtype === "humidifier") return ["humidifier", "sensor", "binary_sensor"];
    return ["fan", "sensor", "binary_sensor", "humidifier"];
  }
  if (kind === "power" && subtype === "electricity") return ["sensor"];
  if (kind === "media") {
    if (subtype === "remote") return ["remote"];
    if (subtype === "player" || subtype === "max-player" || subtype === "broadcast" || subtype === "voice") return ["media_player"];
  }
  if (kind === "security") {
    if (subtype === "alarm") return ["alarm_control_panel"];
    if (subtype === "lock") return ["lock"];
    if (subtype === "binary-sensor") return ["binary_sensor", "sensor"];
  }
  if (kind === "presence") {
    if (subtype === "people") return ["person"];
    if (subtype === "family") return ["person", "device_tracker"];
    if (subtype === "tracker") return ["device_tracker"];
    if (subtype === "motion") return ["binary_sensor", "sensor"];
  }
  if (kind === "health") {
    if (subtype === "updates") return ["update"];
    if (subtype === "events") return ["event", "calendar", "todo"];
    if (subtype === "history") return ["sensor"];
  }
  return CARD_DOMAIN_HINTS[kind] || [];
}

function domainsForOptions(options: EntityOption[]): string[] {
  return [...new Set(options.map((option) => option.domain).filter(Boolean))].sort();
}

function compareEntityOptions(a: EntityOption, b: EntityOption): number {
  if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
  return a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name) || a.entityId.localeCompare(b.entityId);
}

function isRecommendedEntityForKind(
  kind: DashboardCardKind | undefined,
  option: Pick<EntityOption, "entityId" | "name" | "domain" | "deviceClass">,
  subtype?: string
): boolean {
  if (!kind) return false;
  const domains = domainsForKind(kind, subtype);
  if (!domains.includes(option.domain)) return false;
  const text = `${option.name} ${option.entityId}`;
  if (kind === "routines") {
    if (subtype === "scripts") return option.domain === "script";
    if (subtype === "automations") return option.domain === "automation";
    if (subtype === "schedule") return option.domain === "schedule";
    if (subtype === "button") return option.domain === "button";
    if (subtype === "commands") return ["scene", "script", "button"].includes(option.domain);
  }
  if (kind === "presence") {
    if (subtype === "people") return option.domain === "person";
    if (subtype === "family") return option.domain === "person" || option.domain === "device_tracker";
    if (subtype === "tracker") return option.domain === "device_tracker";
    if (option.domain === "person" || option.domain === "device_tracker") return true;
    return hasDeviceClass(option, ["motion", "occupancy", "presence"]) || /\b(motion|occupancy|presence|people|person|family|home)\b/i.test(text);
  }
  if (kind === "security") {
    if (subtype === "alarm") return option.domain === "alarm_control_panel";
    if (subtype === "lock") return option.domain === "lock";
    if (option.domain === "alarm_control_panel" || option.domain === "lock") return true;
    return hasDeviceClass(option, ["door", "window", "opening", "lock", "safety", "tamper", "smoke", "gas", "problem"]) || /\b(door|window|lock|alarm|security|smoke|gas|tamper)\b/i.test(text);
  }
  if (kind === "climate") {
    if (subtype === "single") return option.domain === "climate";
    if (option.domain === "climate" || option.domain === "weather") return true;
    return hasDeviceClass(option, ["temperature", "humidity"]) || /\b(temp|temperature|humidity|climate|thermostat|comfort)\b/i.test(text);
  }
  if (kind === "air") {
    if (subtype === "humidifier" && option.domain === "fan") return false;
    if (subtype === "fan" && option.domain === "humidifier") return false;
    if (option.domain === "fan" || option.domain === "humidifier") return true;
    return hasDeviceClass(option, ["humidity", "pm1", "pm10", "pm25", "volatile_organic_compounds", "carbon_dioxide"]) || /\b(air|aqi|pm2?5|pm10|co2|voc|humidity|humidifier|fan|hepa)\b/i.test(text);
  }
  if (kind === "water") {
    return hasDeviceClass(option, ["moisture", "water", "problem"]) || /\b(water|purifier|filter|tds|tank|quality|leak|flow)\b/i.test(text);
  }
  if (kind === "power") {
    if (subtype === "electricity" && option.domain === "switch") return false;
    if (option.domain === "switch") return /\b(socket|plug|outlet|power|energy|wall\s*switch|插座|墙插)\b/i.test(text);
    return hasDeviceClass(option, ["power", "energy", "voltage", "current", "battery"]) || /\b(power|energy|electric|voltage|current|watt|kwh|battery)\b/i.test(text);
  }
  if (kind === "energy") {
    return hasDeviceClass(option, ["power", "energy", "monetary", "gas", "water"]) || /\b(energy|power|electric|solar|grid|gas|water|utility|consumption|carbon|kwh|watt)\b/i.test(text);
  }
  if (kind === "infrastructure") {
    if (subtype === "router") return /\b(router|gateway|wan|lan|wifi|network)\b/i.test(text);
    if (subtype === "nas") return /\b(nas|synology|qnap|storage|disk)\b/i.test(text);
    if (subtype === "pve" || subtype === "pve-list") return /\b(pve|proxmox|vm|lxc)\b/i.test(text);
    if (subtype === "server" || subtype === "server-list") return /\b(server|host|cpu|memory|disk|uptime)\b/i.test(text);
    return hasDeviceClass(option, ["power", "energy", "data_rate", "data_size", "duration", "problem", "update"]) || /\b(server|router|gateway|nas|pve|proxmox|synology|qnap|cpu|memory|disk|storage|network|wan|lan|wifi|uptime|ping|host)\b/i.test(text);
  }
  if (kind === "panelActions") {
    if (["scene", "script", "automation", "button"].includes(option.domain)) return true;
    return /\b(favorite|quick|scene|routine|action|shortcut|常用|快捷|场景)\b/i.test(text);
  }
  if (kind === "image") {
    return option.domain === "camera";
  }
  if (kind === "note") {
    return option.domain === "update" || hasDeviceClass(option, ["problem"]) || /\b(note|memo|notice|reminder|issue|status|备注|提醒)\b/i.test(text);
  }
  if (kind === "environment") {
    if (subtype === "weather") return option.domain === "weather" || /\b(weather|forecast|temperature|humidity|气象|天气)\b/i.test(text);
    if (subtype === "illuminance") return hasDeviceClass(option, ["illuminance"]) || /\b(illuminance|lux|lx|light level|brightness|照度)\b/i.test(text);
    if (subtype === "sensors") return option.domain === "sensor" || option.domain === "binary_sensor";
    if (option.domain === "weather" || option.domain === "climate" || option.domain === "fan" || option.domain === "humidifier") return true;
    return (
      hasDeviceClass(option, ["temperature", "humidity", "illuminance", "pm1", "pm10", "pm25", "carbon_dioxide", "volatile_organic_compounds"]) ||
      /\b(weather|temp|temperature|humidity|illuminance|lux|lx|air|comfort|forecast|照度)\b/i.test(text)
    );
  }
  if (kind === "health") {
    if (subtype === "updates") return option.domain === "update";
    if (subtype === "events") return ["event", "calendar", "todo"].includes(option.domain);
    if (subtype === "history") return option.domain === "sensor";
    if (subtype === "repairs-backup") return hasDeviceClass(option, ["problem", "update"]) || /\b(repair|backup|problem|issue|restore)\b/i.test(text);
    if (subtype === "network") return /\b(update|repair|backup|problem|issue|network|router|gateway|event|history|health)\b/i.test(text);
    if (option.domain === "update" || option.domain === "event" || option.domain === "calendar" || option.domain === "todo") return true;
    return hasDeviceClass(option, ["problem", "update"]) || /\b(update|repair|backup|problem|issue|network|router|gateway|event|history|health)\b/i.test(text);
  }
  if (kind === "media") {
    if (subtype === "remote") return option.domain === "remote";
    if (subtype === "max-player" || subtype === "player") return option.domain === "media_player";
    if (subtype === "broadcast") return option.domain === "media_player" && /\b(broadcast|radio|announcement|tts|广播|播报|电台)\b/i.test(text);
    if (subtype === "voice") return option.domain === "media_player" && /\b(voice|assistant|assist|microphone|语音|助手)\b/i.test(text);
  }
  return true;
}

function hasDeviceClass(option: Pick<EntityOption, "deviceClass">, values: string[]): boolean {
  return values.includes(option.deviceClass);
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase();
}
