import { LitElement, css, html, type TemplateResult } from "lit";

import { localize } from "../i18n";
import { cardDefinitionFromType, fallbackCardDefinition } from "./card-definitions";
import { normalizeDashboardCardConfig, type NormalizedDashboardCardConfig } from "./config";
import type { DashboardCardConfig, HomeAssistant } from "./types";

export const CARD_EDITOR_PREVIEW_TAG = "yeelight-dashboard-card-editor-preview";

export class YeelightDashboardCardEditorPreview extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .preview {
      display: grid;
      gap: 8px;
      border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
      border-radius: 8px;
      padding: 10px;
      background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 70%, transparent);
    }

    .preview-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      color: var(--secondary-text-color, #727272);
      font-size: 13px;
    }

    .preview-head strong {
      color: var(--primary-text-color, #212121);
      font-size: 13px;
    }

    .readonly {
      border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 70%, transparent);
      border-radius: 999px;
      padding: 3px 8px;
      background: var(--card-background-color, #fff);
      white-space: nowrap;
    }

    .preview-slot {
      display: block;
      min-width: 0;
      pointer-events: none;
    }
  `;

  private _config: NormalizedDashboardCardConfig = normalizeDashboardCardConfig();
  private _hass?: HomeAssistant;

  set config(value: DashboardCardConfig | undefined) {
    this._config = normalizeDashboardCardConfig(value || {});
    this.requestUpdate();
  }

  get config(): NormalizedDashboardCardConfig {
    return this._config;
  }

  set hass(value: HomeAssistant | undefined) {
    this._hass = value;
    this.requestUpdate();
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  protected override updated(): void {
    this.syncPreviewCard();
  }

  protected override render(): TemplateResult {
    return html`
      <div class="preview" aria-label=${localize(this._hass, "editor.card.preview")}>
        <div class="preview-head">
          <strong>${localize(this._hass, "editor.card.preview")}</strong>
          <span class="readonly">${localize(this._hass, "editor.preview_readonly")}</span>
        </div>
        <div class="preview-slot"></div>
      </div>
    `;
  }

  private syncPreviewCard(): void {
    const slot = this.renderRoot.querySelector<HTMLElement>(".preview-slot");
    if (!slot) return;
    const tag = cardTagFromType(this._config.type);
    let card = slot.firstElementChild as (HTMLElement & { setConfig?: (config: DashboardCardConfig) => void; hass?: HomeAssistant }) | null;
    if (!card || card.localName !== tag) {
      card = document.createElement(tag) as typeof card;
      if (!card) return;
      slot.replaceChildren(card);
    }
    card?.setConfig?.(this._config);
    if (card) card.hass = this._hass;
  }
}

function cardTagFromType(type: unknown): string {
  return cardDefinitionFromType(type)?.tag ?? fallbackCardDefinition().tag;
}
