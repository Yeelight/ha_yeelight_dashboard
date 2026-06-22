import { html, type TemplateResult } from "lit";

import { PROFILE_OPTIONS, VIEW_OPTIONS, normalizeConfig } from "./config";
import { localize, type TranslationKey } from "../i18n";
import type { DashboardProfile, HomeAssistant, YeelightDashboardConfig } from "../types";

export type ProfilePresetEditorCallbacks = {
  onApplyProfile: (profile: DashboardProfile) => void;
};

export function renderProfilePresetsEditor(
  hass: HomeAssistant | undefined,
  config: YeelightDashboardConfig,
  callbacks: ProfilePresetEditorCallbacks
): TemplateResult {
  return html`
    <fieldset class="profile-presets">
      <legend>${localize(hass, "editor.strategy.profile_presets")}</legend>
      <p class="profile-presets-hint">${localize(hass, "editor.strategy.profile_presets_hint")}</p>
      <div class="profile-preset-grid">
        ${PROFILE_OPTIONS.map((profile) => renderProfilePreset(hass, config, profile, callbacks))}
      </div>
    </fieldset>
  `;
}

function renderProfilePreset(
  hass: HomeAssistant | undefined,
  config: YeelightDashboardConfig,
  profile: DashboardProfile,
  callbacks: ProfilePresetEditorCallbacks
): TemplateResult {
  const preview = normalizeConfig({ profile });
  const active = config.profile === profile;
  return html`
    <button
      type="button"
      class=${active ? "profile-preset active" : "profile-preset"}
      data-profile=${profile}
      aria-pressed=${active ? "true" : "false"}
      @click=${() => callbacks.onApplyProfile(profile)}
    >
      <span class="profile-preset-head">
        <strong>${localize(hass, `editor.strategy.profile.${profile}` as TranslationKey)}</strong>
        <span>${localize(hass, `editor.strategy.profile_hint.${profile}` as TranslationKey)}</span>
      </span>
      <span class="profile-preset-facts">
        ${renderFact(hass, "editor.strategy.profile_fact_theme", preview.theme)}
        ${renderFact(hass, "editor.strategy.profile_fact_scope", localize(hass, `editor.strategy.scope.${preview.scope}` as TranslationKey))}
        ${renderFact(hass, "editor.strategy.profile_fact_layout", localize(hass, `editor.strategy.layout.${preview.layout_mode}` as TranslationKey))}
        ${renderFact(hass, "editor.strategy.profile_fact_views", viewSummary(hass, preview))}
      </span>
      <span class="profile-preset-action">
        ${localize(hass, active ? "editor.strategy.profile_current" : "editor.strategy.profile_apply")}
      </span>
    </button>
  `;
}

function renderFact(hass: HomeAssistant | undefined, labelKey: TranslationKey, value: string): TemplateResult {
  return html`
    <span class="profile-preset-fact">
      <span>${localize(hass, labelKey)}</span>
      <strong>${value}</strong>
    </span>
  `;
}

function viewSummary(hass: HomeAssistant | undefined, config: YeelightDashboardConfig): string {
  const views = VIEW_OPTIONS.filter((view) => config.views[view] !== false).map((view) => localize(hass, `editor.strategy.view.${view}` as TranslationKey));
  const visible = views.slice(0, 3).join(" / ");
  const extra = views.length - 3;
  return extra > 0 ? localize(hass, "editor.strategy.profile_views_more", { views: visible, count: extra }) : visible;
}
