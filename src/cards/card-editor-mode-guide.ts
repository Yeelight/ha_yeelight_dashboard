import { html, type TemplateResult } from "lit";

import { localize, type TranslationKey } from "../i18n";
import { cardDefinitionFromType } from "./card-definitions";
import { recommendedCardSetupPatch } from "./card-editor-presets";
import { recommendedEntitiesForMode } from "./card-editor-recommended-entities";
import { subtypeOptionsForType } from "./card-subtypes";
import { recommendedDomainsForCard, type EntityOption } from "./entity-picker";
import { gridOptionsForConfig } from "./grid-options";
import type { DashboardCardConfig, HomeAssistant } from "./types";

type EditorPatch = Partial<DashboardCardConfig>;

export function renderModeGuide(
  hass: HomeAssistant | undefined,
  config: DashboardCardConfig,
  entityOptions: EntityOption[],
  onPatch: (patch: EditorPatch) => void,
  onAddRecommendedEntities: (entityIds: string[]) => void
): TemplateResult | "" {
  const definition = cardDefinitionFromType(config.type);
  const subtypes = subtypeOptionsForType(config.type);
  if (!definition || !subtypes.length) return "";
  const activeSubtype = config.subtype || subtypes[0]?.value || "";
  const subtype = subtypes.find((option) => option.value === activeSubtype) || subtypes[0];
  const domains = recommendedDomainsForCard(config.type, subtype.value);
  const selected = new Set(config.entities || []);
  const availableRecommended = entityOptions.filter((option) => option.recommended && !selected.has(option.entityId)).length;
  const addableRecommendedEntities = recommendedEntitiesForMode(config, entityOptions);
  const addableRecommendedIds = addableRecommendedEntities.map((option) => option.entityId);
  const addButtonLabel = addableRecommendedIds.length
    ? localize(hass, "editor.mode_guide_add_entities", { count: addableRecommendedIds.length })
    : localize(hass, availableRecommended ? "editor.mode_guide_entities_full" : "editor.mode_guide_no_entities");
  const setup = recommendedCardSetupPatch(config.type, subtype.value);
  const grid = gridOptionsForConfig(definition.kind, setup.grid_options);
  return html`
    <div class="mode-guide" aria-label=${localize(hass, "editor.mode_guide")}>
      <div class="mode-guide-head">
        <span>${localize(hass, "editor.mode_guide")}</span>
        <strong>${localize(hass, `editor.subtype.${subtype.value}` as TranslationKey)}</strong>
        <small>${localize(hass, `editor.card_type_hint.${definition.kind}` as TranslationKey)}</small>
      </div>
      <div class="mode-guide-facts">
        ${renderFact(hass, "editor.mode_guide_legacy", localize(hass, "editor.subtype_legacy_count", { count: subtype.legacyIds.length }))}
        ${renderFact(hass, "editor.mode_guide_domains", domains.join(", ") || "-")}
        ${renderFact(hass, "editor.mode_guide_layout", localize(hass, "editor.grid_preview_size", { columns: grid.columns, rows: grid.rows }))}
        ${renderFact(hass, "editor.mode_guide_entities", localize(hass, "editor.mode_guide_entity_count", { selected: selected.size, available: availableRecommended }))}
      </div>
      <div class="mode-guide-actions">
        <button type="button" @click=${() => onPatch(setup)}>${localize(hass, "editor.mode_guide_apply")}</button>
        <button type="button" ?disabled=${!addableRecommendedIds.length} @click=${() => onAddRecommendedEntities(addableRecommendedIds)}>
          ${addButtonLabel}
        </button>
      </div>
      ${renderRecommendedEntityBundle(hass, addableRecommendedEntities, onAddRecommendedEntities)}
      <span class="hint">${localize(hass, "editor.mode_guide_safe_actions")}</span>
    </div>
  `;
}

function renderFact(hass: HomeAssistant | undefined, labelKey: TranslationKey, value: string): TemplateResult {
  return html`
    <div class="mode-guide-fact">
      <span>${localize(hass, labelKey)}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderRecommendedEntityBundle(
  hass: HomeAssistant | undefined,
  entities: EntityOption[],
  onAddRecommendedEntities: (entityIds: string[]) => void
): TemplateResult | "" {
  if (!entities.length) return "";
  return html`
    <div class="mode-guide-entities" aria-label=${localize(hass, "editor.mode_guide_entity_bundle")}>
      <div class="mode-guide-entities-head">
        <span>${localize(hass, "editor.mode_guide_entity_bundle")}</span>
        <small>${localize(hass, "editor.mode_guide_entity_bundle_hint")}</small>
      </div>
      <div class="mode-guide-entity-list">
        ${entities.map(
          (entity) => html`
            <div class="mode-guide-entity">
              <div>
                <strong>${entity.name}</strong>
                <small>${entity.entityId}</small>
              </div>
              <span>${entity.deviceClass || entity.domain}</span>
              <button type="button" @click=${() => onAddRecommendedEntities([entity.entityId])}>${localize(hass, "editor.mode_guide_add_one")}</button>
            </div>
          `
        )}
      </div>
    </div>
  `;
}
