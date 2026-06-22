import { recommendedCardSetupPatch } from "./card-editor-presets";
import type { EntityOption } from "./entity-picker";
import type { DashboardCardConfig } from "./types";

const FALLBACK_RECOMMENDED_ENTITY_LIMIT = 6;

export function recommendedEntitiesForMode(config: DashboardCardConfig, options: EntityOption[]): EntityOption[] {
  const selected = new Set(config.entities || []);
  const setup = recommendedCardSetupPatch(config.type, config.subtype);
  const targetCount = config.item_limit ?? setup.item_limit ?? FALLBACK_RECOMMENDED_ENTITY_LIMIT;
  const remainingSlots = Math.max(0, targetCount - selected.size);
  if (!remainingSlots) return [];
  return options.filter((option) => option.recommended && !selected.has(option.entityId)).slice(0, remainingSlots);
}

export function recommendedEntityIdsForMode(config: DashboardCardConfig, options: EntityOption[]): string[] {
  return recommendedEntitiesForMode(config, options).map((option) => option.entityId);
}
