import { LitElement, css, html, type TemplateResult } from "lit";

import {
  AREA_MODE_OPTIONS,
  LAYOUT_OPTIONS,
  PROFILE_OPTIONS,
  SCOPE_OPTIONS,
  THEME_OPTIONS,
  VIEW_OPTIONS,
  normalizeConfig
} from "./config";
import type { DashboardLayoutOverrides, DashboardViewKey, HomeAssistant, YeelightDashboardConfig } from "../types";

export class YeelightDashboardStrategyEditor extends LitElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--primary-text-color, #212121);
    }

    .editor {
      display: grid;
      gap: 14px;
    }

    fieldset,
    label {
      display: grid;
      gap: 6px;
      min-width: 0;
    }

    fieldset {
      margin: 0;
      padding: 12px;
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      border-radius: 8px;
    }

    legend,
    span {
      color: var(--secondary-text-color, #727272);
      font-size: 13px;
    }

    select,
    input,
    textarea {
      min-height: 36px;
      min-width: 0;
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      border-radius: 8px;
      padding: 0 10px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      font: inherit;
    }

    textarea {
      min-height: 120px;
      padding-block: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      resize: vertical;
    }

    .error {
      color: var(--error-color, #ba1a1a);
    }

    .notice {
      border-radius: 8px;
      padding: 8px 10px;
      color: var(--primary-text-color, #212121);
      background: color-mix(in srgb, var(--warning-color, #fbbc04) 16%, transparent);
      font-size: 13px;
    }

    .check-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px 12px;
    }

    .checkbox {
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: 8px;
    }

    .checkbox input {
      min-height: 18px;
      inline-size: 18px;
      padding: 0;
    }
  `;

  private config = normalizeConfig();
  private _hass?: HomeAssistant;
  private layoutError = "";

  setConfig(config: Partial<YeelightDashboardConfig>): void {
    this.config = normalizeConfig(config);
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
        ${this.renderSelect("Profile", "profile", PROFILE_OPTIONS)}
        ${this.renderSelect("Theme", "theme", THEME_OPTIONS)}
        ${this.renderThemeNotice()}
        ${this.renderSelect("Scope", "scope", SCOPE_OPTIONS)}
        ${this.renderSelect("Layout", "layout_mode", LAYOUT_OPTIONS)}
        ${this.renderSelect("Areas", "area_mode", AREA_MODE_OPTIONS)}
        ${this.renderAreas()}
        ${this.renderViews()}
        ${this.renderPreferences()}
        ${this.renderLayoutOverrides()}
      </div>
    `;
  }

  private renderSelect(label: string, key: keyof YeelightDashboardConfig, options: string[]): TemplateResult {
    const current = String(this.config[key]);
    return html`
      <label>
        <span>${label}</span>
        <select @change=${(event: Event) => this.updateValue(key, (event.target as HTMLSelectElement).value)}>
          ${options.map((option) => html`<option value=${option} ?selected=${option === current}>${option}</option>`)}
        </select>
      </label>
    `;
  }

  private renderThemeNotice(): TemplateResult {
    if (themeAvailable(this.hass, this.config.theme) !== false) return html``;
    return html`
      <div class="notice">
        Yeelight Themes are not currently exposed by Home Assistant. The dashboard will keep working with HA theme fallbacks.
      </div>
    `;
  }

  private updateValue(key: keyof YeelightDashboardConfig, value: string): void {
    if (key === "profile") {
      this.commit({
        profile: value as YeelightDashboardConfig["profile"],
        area_mode: this.config.area_mode,
        selected_areas: this.config.selected_areas,
        labels: this.config.labels,
        layout_overrides: this.config.layout_overrides
      });
      return;
    }
    this.commit({ ...this.config, [key]: value });
  }

  private renderAreas(): TemplateResult {
    const areas = registryAreas(this.hass);
    if (this.config.area_mode !== "selected" || !areas.length) return html``;
    const selected = new Set(this.config.selected_areas);
    return html`
      <fieldset>
        <legend>Selected Areas</legend>
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
        <legend>Views</legend>
        <div class="check-grid">
          ${VIEW_OPTIONS.map(
            (view) => html`
              <label class="checkbox">
                <input
                  type="checkbox"
                  .checked=${this.config.views[view] !== false}
                  @change=${(event: Event) => this.updateView(view, (event.target as HTMLInputElement).checked)}
                />
                <span>${view}</span>
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
        <legend>Preferences</legend>
        ${this.renderPreferenceSelect("Density", "density", ["comfortable", "compact"])}
        ${this.renderPreferenceNumber("Scene limit", "scene_limit", 1, 24)}
        ${this.renderPreferenceCheckbox("Show offline", "show_offline")}
        ${this.renderPreferenceCheckbox("Show non-Yeelight", "show_non_yeelight_entities")}
      </fieldset>
    `;
  }

  private renderLayoutOverrides(): TemplateResult {
    if (this.config.layout_mode !== "canvas") return html``;
    return html`
      <fieldset>
        <legend>Layout overrides</legend>
        <label>
          <span>Managed Canvas JSON</span>
          <textarea
            .value=${JSON.stringify(this.config.layout_overrides || {}, null, 2)}
            @change=${(event: Event) => this.updateLayoutOverrides((event.target as HTMLTextAreaElement).value)}
          ></textarea>
        </label>
        ${this.layoutError ? html`<span class="error">${this.layoutError}</span>` : html`<span>Use stable card keys exported by Canvas edit mode.</span>`}
      </fieldset>
    `;
  }

  private renderPreferenceSelect(keyLabel: string, key: keyof YeelightDashboardConfig["preferences"], options: string[]): TemplateResult {
    const current = String(this.config.preferences[key]);
    return html`
      <label>
        <span>${keyLabel}</span>
        <select @change=${(event: Event) => this.updatePreference(key, (event.target as HTMLSelectElement).value)}>
          ${options.map((option) => html`<option value=${option} ?selected=${option === current}>${option}</option>`)}
        </select>
      </label>
    `;
  }

  private renderPreferenceNumber(keyLabel: string, key: keyof YeelightDashboardConfig["preferences"], min: number, max: number): TemplateResult {
    return html`
      <label>
        <span>${keyLabel}</span>
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

  private renderPreferenceCheckbox(keyLabel: string, key: keyof YeelightDashboardConfig["preferences"]): TemplateResult {
    return html`
      <label class="checkbox">
        <input
          type="checkbox"
          .checked=${Boolean(this.config.preferences[key])}
          @change=${(event: Event) => this.updatePreference(key, (event.target as HTMLInputElement).checked)}
        />
        <span>${keyLabel}</span>
      </label>
    `;
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

  private updateLayoutOverrides(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) {
      this.layoutError = "";
      this.commit({ ...this.config, layout_overrides: undefined });
      return;
    }
    try {
      const parsed = JSON.parse(trimmed) as DashboardLayoutOverrides;
      this.layoutError = "";
      this.commit({ ...this.config, layout_overrides: parsed });
    } catch {
      this.layoutError = "Invalid JSON";
      this.requestUpdate();
    }
  }

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
