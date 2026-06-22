import { html, type TemplateResult } from "lit";
import { live } from "lit/directives/live.js";

import { localize, type TranslationKey } from "../i18n";
import { DASHBOARD_CARD_DEFINITIONS } from "./card-definitions";
import { recommendedDomainsForCard } from "./entity-picker";
import type { DashboardCardConfig, HomeAssistant } from "./types";

export function renderCardTypeControl(
  hass: HomeAssistant | undefined,
  config: DashboardCardConfig,
  onChange: (type: string) => void,
  onRecommend: () => void,
  options: { compact?: boolean } = {}
): TemplateResult {
  return html`
    <div class=${options.compact ? "card-type-control compact" : "card-type-control"}>
      ${options.compact
        ? ""
        : html`
            <label>
              <span>${localize(hass, "editor.card_type")}</span>
              <select data-value=${config.type} .value=${live(config.type)} @change=${(event: Event) => onChange((event.target as HTMLSelectElement).value)}>
                ${DASHBOARD_CARD_DEFINITIONS.map(
                  (definition) => html`
                    <option value=${definition.type} .selected=${config.type === definition.type}>
                      ${localize(hass, `editor.card_type.${definition.kind}` as TranslationKey)}
                    </option>
                  `
                )}
              </select>
            </label>
          `}
      <div class="card-type-summary">
        <span>${localize(hass, cardTypeHintKey(config.type))}</span>
        <small>${localize(hass, "editor.card_type_domains", { domains: recommendedDomainsForCard(config.type, config.subtype).join(", ") || "-" })}</small>
        <button type="button" @click=${onRecommend}>${localize(hass, "editor.card_type_recommend")}</button>
      </div>
    </div>
  `;
}

function cardTypeHintKey(type: string): TranslationKey {
  const definition = DASHBOARD_CARD_DEFINITIONS.find((item) => item.type === type);
  return `editor.card_type_hint.${definition?.kind || "hero"}` as TranslationKey;
}
