import { LitElement, html, type TemplateResult } from "lit";

import { localize } from "../i18n";
import type { DashboardCardConfig, HomeAssistant } from "./types";

export class YeelightDashboardCardEditor extends LitElement {
  private config: DashboardCardConfig = { type: "custom:yeelight-dashboard-hero-card", entities: [] };
  private _hass?: HomeAssistant;

  setConfig(config: DashboardCardConfig): void {
    this.config = { ...config, entities: Array.isArray(config.entities) ? config.entities : [] };
    this.requestUpdate();
  }

  set hass(value: HomeAssistant | undefined) {
    this._hass = value;
    this.requestUpdate();
  }

  protected override render(): TemplateResult {
    return html`
      <label>
        <span>${localize(this._hass, "editor.title")}</span>
        <input .value=${this.config.title || ""} @input=${this.updateTitle} />
      </label>
    `;
  }

  private updateTitle = (event: Event): void => {
    this.config = { ...this.config, title: (event.target as HTMLInputElement).value };
    this.dispatchEvent(new CustomEvent("config-changed", { bubbles: true, composed: true, detail: { config: this.config } }));
  };
}
