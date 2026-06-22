import { LitElement, html, type TemplateResult } from "lit";

import {
  AREA_MODE_OPTIONS,
  LAYOUT_OPTIONS,
  PROFILE_OPTIONS,
  SCOPE_OPTIONS,
  THEME_OPTIONS,
  VIEW_OPTIONS,
  normalizeConfig
} from "./config";
import type { DashboardLayoutOverride, DashboardLayoutOverrides, DashboardViewKey, HomeAssistant, YeelightDashboardConfig } from "../types";
import { localize, type TranslationKey } from "../i18n";
import { strategyEditorStyles } from "./editor.styles";
import {
  buildLayoutOverrides,
  defaultKeyForView,
  defaultLayoutDraft,
  draftFromOverrides,
  parseLayoutOverrides,
  removeLayoutOverride,
  renderLayoutOverridesEditor,
  type LayoutOverrideDraft
} from "./layout-overrides-editor";
import { renderProfilePresetsEditor } from "./profile-presets-editor";

export class YeelightDashboardStrategyEditor extends LitElement {
  static override styles = strategyEditorStyles;

  private config = normalizeConfig();
  private _hass?: HomeAssistant;
  private layoutError = "";
  private layoutMessage = "";
  private layoutDraft: LayoutOverrideDraft = defaultLayoutDraft();

  setConfig(config: Partial<YeelightDashboardConfig>): void {
    this.config = normalizeConfig(config);
    this.layoutDraft = draftFromOverrides(this.config.layout_overrides, this.layoutDraft);
    this.requestUpdate();
  }

  set hass(value: HomeAssistant | undefined) {
    this._hass = value;
    this.requestUpdate();
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  protected override render(): TemplateResult {
    return html`
      <div class="editor">
        ${renderProfilePresetsEditor(this.hass, this.config, { onApplyProfile: this.applyProfile })}
        ${this.renderSelect("editor.strategy.profile", "profile", PROFILE_OPTIONS)}
        ${this.renderSelect("editor.strategy.theme", "theme", THEME_OPTIONS)}
        ${this.renderThemeNotice()}
        ${this.renderSelect("editor.strategy.scope", "scope", SCOPE_OPTIONS)}
        ${this.renderSelect("editor.strategy.layout", "layout_mode", LAYOUT_OPTIONS)}
        ${this.renderSelect("editor.strategy.areas", "area_mode", AREA_MODE_OPTIONS)}
        ${this.renderAreas()}
        ${this.renderViews()}
        ${this.renderPreferences()}
        ${this.renderLayoutOverrides()}
      </div>
    `;
  }

  private renderSelect(labelKey: TranslationKey, key: keyof YeelightDashboardConfig, options: string[]): TemplateResult {
    const current = String(this.config[key]);
    return html`
      <label>
        <span>${localize(this.hass, labelKey)}</span>
        <select @change=${(event: Event) => this.updateValue(key, (event.target as HTMLSelectElement).value)}>
          ${options.map((option) => html`<option value=${option} ?selected=${option === current}>${this.optionLabel(key, option)}</option>`)}
        </select>
      </label>
    `;
  }

  private renderThemeNotice(): TemplateResult {
    if (themeAvailable(this.hass, this.config.theme) !== false) return html``;
    return html` <div class="notice">${localize(this.hass, "editor.strategy.theme_missing")}</div> `;
  }

  private updateValue(key: keyof YeelightDashboardConfig, value: string): void {
    if (key === "profile") {
      this.applyProfile(value as YeelightDashboardConfig["profile"]);
      return;
    }
    this.commit({ ...this.config, [key]: value });
  }

  private applyProfile = (profile: YeelightDashboardConfig["profile"]): void => {
    this.commit({
      profile,
      area_mode: this.config.area_mode,
      selected_areas: this.config.selected_areas,
      labels: this.config.labels,
      layout_overrides: this.config.layout_overrides
    });
  };

  private renderAreas(): TemplateResult {
    const areas = registryAreas(this.hass);
    if (this.config.area_mode !== "selected" || !areas.length) return html``;
    const selected = new Set(this.config.selected_areas);
    return html`
      <fieldset>
        <legend>${localize(this.hass, "editor.strategy.selected_areas")}</legend>
        <div class="check-grid">
          ${areas.map(
            (area) => html`
              <label class="checkbox">
                <input
                  type="checkbox"
                  .checked=${selected.has(area.area_id)}
                  @change=${(event: Event) => this.updateArea(area.area_id, (event.target as HTMLInputElement).checked)}
                />
                <span>${area.name}</span>
              </label>
            `
          )}
        </div>
      </fieldset>
    `;
  }

  private renderViews(): TemplateResult {
    return html`
      <fieldset>
        <legend>${localize(this.hass, "editor.strategy.views")}</legend>
        <div class="check-grid">
          ${VIEW_OPTIONS.map(
            (view) => html`
              <label class="checkbox">
                <input
                  type="checkbox"
                  .checked=${this.config.views[view] !== false}
                  @change=${(event: Event) => this.updateView(view, (event.target as HTMLInputElement).checked)}
                />
                <span>${localize(this.hass, `editor.strategy.view.${view}` as TranslationKey)}</span>
              </label>
            `
          )}
        </div>
      </fieldset>
    `;
  }

  private renderPreferences(): TemplateResult {
    return html`
      <fieldset>
        <legend>${localize(this.hass, "editor.strategy.preferences")}</legend>
        ${this.renderPreferenceSelect("editor.density", "density", ["comfortable", "compact"])}
        ${this.renderPreferenceNumber("editor.strategy.scene_limit", "scene_limit", 1, 24)}
        ${this.renderPreferenceCheckbox("editor.strategy.show_offline", "show_offline")}
        ${this.renderPreferenceCheckbox("editor.strategy.show_non_yeelight", "show_non_yeelight_entities")}
      </fieldset>
    `;
  }

  private renderLayoutOverrides(): TemplateResult {
    if (this.config.layout_mode !== "canvas") return html``;
    return renderLayoutOverridesEditor(
      this.hass,
      this.config.layout_overrides,
      this.layoutDraft,
      { error: this.layoutError, message: this.layoutMessage },
      {
        onViewChange: this.updateLayoutDraftView,
        onKeyChange: this.updateLayoutDraftKey,
        onFieldChange: this.updateLayoutDraftField,
        onPreset: this.applyLayoutPreset,
        onUseExisting: this.useExistingLayoutOverride,
        onApply: this.applyLayoutDraft,
        onRemove: this.removeLayoutDraft,
        onJsonChange: this.updateLayoutOverrides,
        onImport: this.importLayoutOverridesFromClipboard,
        onClear: this.clearLayoutOverrides
      }
    );
  }

  private renderPreferenceSelect(labelKey: TranslationKey, key: keyof YeelightDashboardConfig["preferences"], options: string[]): TemplateResult {
    const current = String(this.config.preferences[key]);
    return html`
      <label>
        <span>${localize(this.hass, labelKey)}</span>
        <select @change=${(event: Event) => this.updatePreference(key, (event.target as HTMLSelectElement).value)}>
          ${options.map((option) => html`<option value=${option} ?selected=${option === current}>${this.optionLabel(key, option)}</option>`)}
        </select>
      </label>
    `;
  }

  private renderPreferenceNumber(labelKey: TranslationKey, key: keyof YeelightDashboardConfig["preferences"], min: number, max: number): TemplateResult {
    return html`
      <label>
        <span>${localize(this.hass, labelKey)}</span>
        <input
          type="number"
          min=${min}
          max=${max}
          .value=${String(this.config.preferences[key])}
          @change=${(event: Event) => this.updatePreference(key, Number((event.target as HTMLInputElement).value))}
        />
      </label>
    `;
  }

  private renderPreferenceCheckbox(labelKey: TranslationKey, key: keyof YeelightDashboardConfig["preferences"]): TemplateResult {
    return html`
      <label class="checkbox">
        <input
          type="checkbox"
          .checked=${Boolean(this.config.preferences[key])}
          @change=${(event: Event) => this.updatePreference(key, (event.target as HTMLInputElement).checked)}
        />
        <span>${localize(this.hass, labelKey)}</span>
      </label>
    `;
  }

  private optionLabel(key: keyof YeelightDashboardConfig | keyof YeelightDashboardConfig["preferences"], option: string): string {
    if (key === "theme") return option;
    const map: Partial<Record<string, string>> = {
      profile: `editor.strategy.profile.${option}`,
      scope: `editor.strategy.scope.${option}`,
      layout_mode: `editor.strategy.layout.${option}`,
      area_mode: `editor.strategy.area.${option}`,
      density: `editor.density.${option}`
    };
    const keyPath = map[String(key)];
    return keyPath ? localize(this.hass, keyPath as TranslationKey) : option;
  }

  private updateArea(areaId: string, enabled: boolean): void {
    const next = new Set(this.config.selected_areas);
    if (enabled) next.add(areaId);
    else next.delete(areaId);
    this.commit({ ...this.config, selected_areas: [...next] });
  }

  private updateView(view: DashboardViewKey, enabled: boolean): void {
    this.commit({ ...this.config, views: { ...this.config.views, [view]: enabled } });
  }

  private updatePreference(key: keyof YeelightDashboardConfig["preferences"], value: string | number | boolean): void {
    this.commit({ ...this.config, preferences: { ...this.config.preferences, [key]: value } });
  }

  private updateLayoutDraftView = (view: DashboardViewKey): void => {
    const key = this.config.layout_overrides?.[view]?.[this.layoutDraft.key] ? this.layoutDraft.key : defaultKeyForView(view);
    this.layoutDraft = draftFromOverrides(this.config.layout_overrides, { ...defaultLayoutDraft(view), key });
    this.layoutMessage = "";
    this.layoutError = "";
    this.requestUpdate();
  };

  private updateLayoutDraftKey = (key: string): void => {
    this.layoutDraft = draftFromOverrides(this.config.layout_overrides, { ...this.layoutDraft, key });
    this.layoutMessage = "";
    this.layoutError = "";
    this.requestUpdate();
  };

  private updateLayoutDraftField = (field: keyof LayoutOverrideDraft, value: string): void => {
    if (field === "view" || field === "key") return;
    const number = Number(value);
    this.layoutDraft = { ...this.layoutDraft, [field]: Number.isFinite(number) ? Math.round(number) : undefined };
    this.layoutMessage = "";
    this.layoutError = "";
    this.requestUpdate();
  };

  private applyLayoutPreset = (preset: DashboardLayoutOverride): void => {
    this.layoutDraft = { ...this.layoutDraft, ...preset };
    this.layoutMessage = "";
    this.layoutError = "";
    this.requestUpdate();
  };

  private useExistingLayoutOverride = (view: DashboardViewKey, key: string): void => {
    this.layoutDraft = draftFromOverrides(this.config.layout_overrides, { ...defaultLayoutDraft(view), key });
    this.layoutMessage = "";
    this.layoutError = "";
    this.requestUpdate();
  };

  private applyLayoutDraft = (): void => {
    const key = this.layoutDraft.key.trim();
    if (!key) {
      this.layoutError = localize(this.hass, "editor.strategy.layout_key_required");
      this.layoutMessage = "";
      this.requestUpdate();
      return;
    }
    const next = buildLayoutOverrides(this.config.layout_overrides, this.layoutDraft);
    this.layoutDraft = { ...this.layoutDraft, key };
    this.layoutError = "";
    this.layoutMessage = localize(this.hass, "editor.strategy.layout_applied");
    this.commit({ ...this.config, layout_overrides: next });
  };

  private removeLayoutDraft = (): void => {
    this.layoutError = "";
    this.layoutMessage = localize(this.hass, "editor.strategy.layout_removed");
    this.commit({ ...this.config, layout_overrides: removeLayoutOverride(this.config.layout_overrides, this.layoutDraft) });
  };

  private updateLayoutOverrides = (value: string): void => {
    const trimmed = value.trim();
    if (!trimmed) {
      this.layoutError = "";
      this.layoutMessage = "";
      this.commit({ ...this.config, layout_overrides: undefined });
      return;
    }
    try {
      const parsed = parseLayoutOverrides(trimmed);
      this.layoutError = "";
      this.layoutMessage = "";
      this.layoutDraft = draftFromOverrides(parsed, this.layoutDraft);
      this.commit({ ...this.config, layout_overrides: parsed });
    } catch {
      this.layoutError = localize(this.hass, "editor.strategy.invalid_json");
      this.layoutMessage = "";
      this.requestUpdate();
    }
  };

  private importLayoutOverridesFromClipboard = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard?.readText();
      if (!text?.trim()) {
        this.layoutError = localize(this.hass, "editor.strategy.clipboard_empty");
        this.layoutMessage = "";
        this.requestUpdate();
        return;
      }
      const parsed = parseLayoutOverrides(text);
      this.layoutError = "";
      this.layoutMessage = localize(this.hass, "editor.strategy.layout_imported");
      this.layoutDraft = draftFromOverrides(parsed, this.layoutDraft);
      this.commit({ ...this.config, layout_overrides: parsed });
    } catch {
      this.layoutError = localize(this.hass, "editor.strategy.layout_import_failed");
      this.layoutMessage = "";
      this.requestUpdate();
    }
  };

  private clearLayoutOverrides = (): void => {
    this.layoutError = "";
    this.layoutMessage = localize(this.hass, "editor.strategy.layout_reset");
    this.layoutDraft = defaultLayoutDraft(this.layoutDraft.view);
    this.commit({ ...this.config, layout_overrides: undefined });
  };

  private commit(config: Partial<YeelightDashboardConfig>): void {
    this.config = normalizeConfig(config);
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config: this.config }
      })
    );
    this.requestUpdate();
  }
}

function registryAreas(hass: HomeAssistant | undefined): Array<{ area_id: string; name: string }> {
  const areas = hass?.areas;
  return Array.isArray(areas)
    ? areas.filter((area): area is { area_id: string; name: string } => typeof area.area_id === "string" && typeof area.name === "string")
    : [];
}

function themeAvailable(hass: HomeAssistant | undefined, theme: string): boolean | undefined {
  const themes = hass?.themes?.themes;
  if (!themes || typeof themes !== "object" || !Object.keys(themes).length) return undefined;
  return Object.prototype.hasOwnProperty.call(themes, theme);
}
