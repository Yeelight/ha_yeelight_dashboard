import { localize, type TranslationKey } from "../i18n";
import { recommendedCardSetupPatch } from "./card-editor-presets";
import type { DashboardCardDefinition } from "./card-definitions";
import { subtypeOptionsForKind } from "./card-subtypes";
import { isRecommendedEntityForCard, recommendedDomainsForCard } from "./entity-picker";
import type { DashboardCardConfig, HomeAssistant } from "./types";

export function stubConfig(definition: DashboardCardDefinition, hass?: HomeAssistant): DashboardCardConfig {
  const setup = recommendedCardSetupPatch(definition.type);
  const entityId = findSuggestedEntity(hass, definition, setup.subtype);
  return {
    type: definition.type,
    title: localize(hass, `card.${definition.kind}.title` as TranslationKey),
    ...setup,
    ...(entityId ? { entities: [entityId] } : {})
  };
}

export function entitySuggestion(hass: HomeAssistant | undefined, entityId: string, definition: DashboardCardDefinition): { label: string; config: DashboardCardConfig } | null {
  const subtype = suggestedSubtypeForEntity(hass, entityId, definition);
  if (!hass?.states?.[entityId] || (!subtype && !isRecommendedEntityForCard(hass, definition.type, entityId))) {
    return null;
  }
  return {
    label: localize(hass, `editor.card_type.${definition.kind}` as TranslationKey),
    config: { ...stubConfig(definition, hass), ...(subtype ? { subtype } : {}), entities: [entityId] }
  };
}

function findSuggestedEntity(hass: HomeAssistant | undefined, definition: DashboardCardDefinition, subtype: string | undefined): string | undefined {
  const domains = recommendedDomainsForCard(definition.type, subtype);
  return Object.keys(hass?.states || {}).find((entityId) => domains.includes(domainOf(entityId)) && isRecommendedEntityForCard(hass, definition.type, entityId, subtype));
}

function suggestedSubtypeForEntity(hass: HomeAssistant | undefined, entityId: string, definition: DashboardCardDefinition): string | undefined {
  const options = prioritizeSpecificSubtypes(subtypeOptionsForKind(definition.kind).map((option) => option.value));
  return options.find((subtype) => isRecommendedEntityForCard(hass, definition.type, entityId, subtype));
}

function prioritizeSpecificSubtypes(values: string[]): string[] {
  const broad = new Set(["overview", "hub", "summary", "standard", "activity", "favorites", "panel"]);
  return [...values.filter((value) => !broad.has(value)), ...values.filter((value) => broad.has(value))];
}

function domainOf(entityId: string): string {
  return entityId.split(".")[0] || "";
}
