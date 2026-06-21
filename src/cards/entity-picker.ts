import { cardDefinitionFromType } from "./card-definitions";
import type { DashboardCardConfig, HomeAssistant } from "./types";

export const ENTITY_PICKER_LIMIT = 50;

const CARD_DOMAIN_HINTS: Record<string, string[]> = {
  hero: ["light", "switch", "scene", "script", "button", "sensor", "binary_sensor"],
  light: ["light"],
  room: ["light", "switch", "cover", "climate", "fan", "sensor", "binary_sensor"],
  rooms: ["light", "switch", "cover", "climate", "fan", "sensor", "binary_sensor"],
  devices: ["light", "switch", "cover", "climate", "fan", "sensor", "binary_sensor"],
  routines: ["scene", "script", "automation", "button"],
  environment: ["weather", "climate", "fan", "humidifier", "sensor", "binary_sensor"],
  notice: ["update", "repair", "binary_sensor", "sensor"],
  ecosystem: ["light", "switch", "sensor", "binary_sensor", "update"],
  health: ["update", "sensor", "binary_sensor", "button"],
  status: ["light", "switch", "cover", "climate", "fan", "scene", "script", "automation", "button"]
};

export type EntityOption = {
  entityId: string;
  name: string;
  domain: string;
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
  const recommended = new Set(recommendedDomainsForCard(config.type));
  return Object.values(hass?.states || {})
    .map((state) => {
      const entityId = state.entity_id;
      const domain = entityId.split(".")[0] || "";
      const name = typeof state.attributes.friendly_name === "string" && state.attributes.friendly_name ? state.attributes.friendly_name : entityId;
      return { entityId, name, domain, recommended: recommended.has(domain) };
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
  const recommended = recommendedDomainsForCard(config.type);
  if (!recommended.length) return "";
  const availableDomains = new Set(options.map((option) => option.domain));
  return recommended.find((domain) => availableDomains.has(domain)) || "";
}

export function recommendedDomainsForCard(type: string | undefined): string[] {
  const kind = cardDefinitionFromType(type)?.kind;
  return kind ? CARD_DOMAIN_HINTS[kind] || [] : [];
}

function domainsForOptions(options: EntityOption[]): string[] {
  return [...new Set(options.map((option) => option.domain).filter(Boolean))].sort();
}

function compareEntityOptions(a: EntityOption, b: EntityOption): number {
  if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
  return a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name) || a.entityId.localeCompare(b.entityId);
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase();
}
