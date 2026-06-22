import { html, type TemplateResult } from "lit";

import { localize, type TranslationKey } from "../i18n";
import type { DashboardCardConfig, HomeAssistant } from "./types";
import { DISPLAY_PRESETS, displayPresetPatch, isDisplayPresetActive, type DashboardDisplayPreset } from "./card-editor-presets";

type PresetPatchHandler = (patch: Partial<DashboardCardConfig>) => void;

export function renderDisplayPresetPanel(
  hass: HomeAssistant | undefined,
  config: DashboardCardConfig,
  onPatch: PresetPatchHandler
): TemplateResult {
  return html`
    <div class="display-presets" aria-label=${localize(hass, "editor.display_preset")}>
      <div class="display-presets-head">
        <strong>${localize(hass, "editor.display_preset")}</strong>
        <span>${localize(hass, "editor.display_preset_hint")}</span>
      </div>
      <div class="display-preset-options">
        ${DISPLAY_PRESETS.map((preset) => renderDisplayPreset(hass, config, preset, onPatch))}
      </div>
    </div>
  `;
}

function renderDisplayPreset(
  hass: HomeAssistant | undefined,
  config: DashboardCardConfig,
  preset: DashboardDisplayPreset,
  onPatch: PresetPatchHandler
): TemplateResult {
  const active = isDisplayPresetActive(config, preset);
  return html`
    <button
      class=${active ? "display-preset active" : "display-preset"}
      type="button"
      data-display-preset=${preset.key}
      aria-pressed=${active ? "true" : "false"}
      @click=${() => onPatch(displayPresetPatch(preset))}
    >
      <span class="display-preset-title">
        <strong>${localize(hass, `editor.display_preset.${preset.key}` as TranslationKey)}</strong>
        <span>${localize(hass, active ? "editor.display_preset_current" : "editor.display_preset_apply")}</span>
      </span>
      <span class="display-preset-desc">${localize(hass, `editor.display_preset_desc.${preset.key}` as TranslationKey)}</span>
      <span class="display-preset-facts">
        ${renderFact(hass, "editor.display_preset_fact.items", formatItemLimit(hass, preset.config.item_limit))}
        ${renderFact(hass, "editor.display_preset_fact.metrics", booleanLabel(hass, preset.config.show_metrics))}
        ${renderFact(hass, "editor.display_preset_fact.actions", booleanLabel(hass, preset.config.show_actions))}
        ${renderFact(hass, "editor.display_preset_fact.area_summaries", booleanLabel(hass, preset.config.show_area_summaries))}
        ${renderFact(hass, "editor.display_preset_fact.density", localize(hass, `editor.density.${preset.config.density}` as TranslationKey))}
        ${renderFact(hass, "editor.display_preset_fact.variant", localize(hass, `editor.variant.${preset.config.variant}` as TranslationKey))}
      </span>
    </button>
  `;
}

function renderFact(hass: HomeAssistant | undefined, labelKey: TranslationKey, value: string): TemplateResult {
  return html`
    <span class="display-preset-fact">
      <span>${localize(hass, labelKey)}</span>
      <strong>${value}</strong>
    </span>
  `;
}

function formatItemLimit(hass: HomeAssistant | undefined, itemLimit: number | undefined): string {
  return itemLimit === undefined ? localize(hass, "editor.display_preset_fact.items_auto") : String(itemLimit);
}

function booleanLabel(hass: HomeAssistant | undefined, value: boolean | undefined): string {
  return localize(hass, value ? "editor.display_preset_on" : "editor.display_preset_off");
}
