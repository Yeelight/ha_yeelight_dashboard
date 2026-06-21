import { localizeLanguage, type TranslationKey } from "../i18n";
import { createDashboardCardClass } from "./internal-card";
import { YeelightDashboardCardEditor } from "./card-editor";
import { CARD_EDITOR_PREVIEW_TAG, YeelightDashboardCardEditorPreview } from "./card-editor-preview";
import { DASHBOARD_CARD_DEFINITIONS, type DashboardCardDefinition } from "./card-definitions";
import { entitySuggestion, stubConfig } from "./card-defaults";
import type { HomeAssistant } from "./types";

export const CARD_EDITOR_TAG = "yeelight-dashboard-card-editor";
const DOCUMENTATION_URL = "https://github.com/Yeelight/ha_yeelight_dashboard";

export function registerDashboardCards(): void {
  if (!customElements.get(CARD_EDITOR_TAG)) {
    customElements.define(CARD_EDITOR_TAG, YeelightDashboardCardEditor);
  }
  if (!customElements.get(CARD_EDITOR_PREVIEW_TAG)) {
    customElements.define(CARD_EDITOR_PREVIEW_TAG, YeelightDashboardCardEditorPreview);
  }
  for (const definition of DASHBOARD_CARD_DEFINITIONS) {
    if (!customElements.get(definition.tag)) {
      customElements.define(definition.tag, createDashboardCardClass(definition.kind));
    }
    patchRegisteredCardClass(definition);
  }
  registerCustomCards();
}

export const DASHBOARD_CARD_TAGS = DASHBOARD_CARD_DEFINITIONS.map((definition) => definition.tag);

function createEditorElement(definition: DashboardCardDefinition): HTMLElement {
  const editor = document.createElement(CARD_EDITOR_TAG) as HTMLElement & { cardType?: string };
  editor.cardType = definition.type;
  return editor;
}

function patchRegisteredCardClass(definition: DashboardCardDefinition): void {
  const elementClass = customElements.get(definition.tag) as
    | (CustomElementConstructor & {
        getConfigElement?: () => HTMLElement;
        getStubConfig?: (hass?: HomeAssistant) => Record<string, unknown>;
      })
    | undefined;
  if (!elementClass) return;
  Object.defineProperties(elementClass, {
    getConfigElement: { configurable: true, value: () => createEditorElement(definition) },
    getStubConfig: { configurable: true, value: (hass?: HomeAssistant) => stubConfig(definition, hass) }
  });
}

function registerCustomCards(): void {
  const cards = window.customCards ?? (window.customCards = []);
  const tags = new Set(DASHBOARD_CARD_DEFINITIONS.map((definition) => definition.tag));
  for (let index = cards.length - 1; index >= 0; index -= 1) {
    const item = cards[index];
    if (typeof item?.type === "string" && tags.has(item.type)) {
      cards.splice(index, 1);
    }
  }
  for (const definition of DASHBOARD_CARD_DEFINITIONS) {
    const localizedName = cardPickerName(definition);
    cards.push({
      type: definition.tag,
      name: localizedName,
      description: localizeLanguage(undefined, "editor.card_picker_description"),
      preview: true,
      documentationURL: DOCUMENTATION_URL,
      getStubConfig: (hass?: HomeAssistant) => stubConfig(definition, hass),
      getConfigElement: () => createEditorElement(definition),
      getEntitySuggestion: (hass: HomeAssistant, entityId: string) => entitySuggestion(hass, entityId, definition)
    });
  }
}

function cardPickerName(definition: DashboardCardDefinition): string {
  const name = localizeLanguage(undefined, `editor.card_type.${definition.kind}` as TranslationKey);
  return localizeLanguage(undefined, "editor.card_picker_name", { name });
}
