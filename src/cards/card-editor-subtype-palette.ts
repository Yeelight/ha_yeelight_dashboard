import { html, type TemplateResult } from "lit";

import { localize, type TranslationKey } from "../i18n";
import { cardDefinitionFromType } from "./card-definitions";
import { recommendedCardSetupPatch } from "./card-editor-presets";
import { subtypeOptionsForType } from "./card-subtypes";
import { recommendedDomainsForCard } from "./entity-picker";
import type { DashboardCardConfig, HomeAssistant } from "./types";

export function renderSubtypePalette(
  hass: HomeAssistant | undefined,
  config: DashboardCardConfig,
  onPatch: (patch: Partial<DashboardCardConfig>) => void
): TemplateResult | "" {
  const options = subtypeOptionsForType(config.type);
  if (options.length <= 1) return "";
  const activeSubtype = config.subtype || options[0]?.value || "";
  const definition = cardDefinitionFromType(config.type);
  return html`
    <div class="subtype-palette" aria-label=${localize(hass, "editor.subtype")}>
      <div class="subtype-palette-head">
        <span>${localize(hass, "editor.subtype_palette")}</span>
        <small>${localize(hass, "editor.subtype_palette_hint")}</small>
      </div>
      <div class="subtype-options">
        ${options.map((option) => {
          const active = option.value === activeSubtype;
          return html`
            <button class=${active ? "active" : ""} type="button" @click=${() => onPatch(recommendedCardSetupPatch(config.type, option.value))}>
              <strong>${localize(hass, `editor.subtype.${option.value}` as TranslationKey)}</strong>
              <small>${legacyCoverageLabel(hass, option.legacyIds.length)}</small>
              ${definition
                ? html`<em>${localize(hass, "editor.subtype_domain_summary", { domains: recommendedDomainsForCard(config.type, option.value).join(", ") || "-" })}</em>`
                : ""}
            </button>
          `;
        })}
      </div>
    </div>
  `;
}

function legacyCoverageLabel(hass: HomeAssistant | undefined, count: number): string {
  return localize(hass, "editor.subtype_legacy_count", { count });
}
