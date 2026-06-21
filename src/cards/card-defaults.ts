import { localize, type TranslationKey } from "../i18n";
import { recommendedCardSetupPatch } from "./card-editor-presets";
import type { DashboardCardDefinition } from "./card-definitions";
import { recommendedDomainsForCard } from "./entity-picker";
import type { DashboardCardConfig, HomeAssistant } from "./types";

export function stubConfig(definition: DashboardCardDefinition, hass?: HomeAssistant): DashboardCardConfig {
  const entityId = findSuggestedEntity(hass, definition);
  return {
    type: definition.type,
    title: localize(hass, `card.${definition.kind}.title` as TranslationKey),
    ...recommendedCardSetupPatch(definition.type),
    ...(entityId ? { entities: [entityId] } : {})
  };
}

export function entitySuggestion(hass: HomeAssistant | undefined, entityId: string, definition: DashboardCardDefinition): { label: string; config: DashboardCardConfig } | null {
  if (!hass?.states?.[entityId] || !recommendedDomainsForCard(definition.type).includes(domainOf(entityId))) {
    return null;
  }
  return {
    label: localize(hass, `editor.card_type.${definition.kind}` as TranslationKey),
    config: { ...stubConfig(definition, hass), entities: [entityId] }
  };
}

function findSuggestedEntity(hass: HomeAssistant | undefined, definition: DashboardCardDefinition): string | undefined {
  const domains = recommendedDomainsForCard(definition.type);
  return Object.keys(hass?.states || {}).find((entityId) => domains.includes(domainOf(entityId)));
}

function domainOf(entityId: string): string {
  return entityId.split(".")[0] || "";
}
