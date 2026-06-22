import { html, type TemplateResult } from "lit";

import { localize, type TranslationKey } from "../i18n";
import { DASHBOARD_CARD_DEFINITIONS } from "./card-definitions";
import { renderCardTypeControl } from "./card-editor-card-type";
import { contentFormDataFields, contentFormSchemaFields, contentHelper, contentPatchFields, renderImageSourceEditor, renderNativeContentFields } from "./card-editor-content-fields";
import { renderNoteContentEditor } from "./card-editor-note-content";
import { renderPanelActionsContentEditor } from "./card-editor-panel-actions-content";
import { subtypeOptionsForType } from "./card-subtypes";
import { recommendedDomainsForCard } from "./entity-picker";
import type { DashboardCardConfig, HomeAssistant } from "./types";

type FormValue = Record<string, unknown>;
type FormSchema = Array<Record<string, unknown>>;
type EditorPatch = Partial<DashboardCardConfig>;

const FORM_LABELS: Record<string, TranslationKey> = {
  type: "editor.card_type",
  subtype: "editor.subtype",
  title: "editor.title",
  subtitle: "editor.subtitle",
  content: "editor.content",
  image_url: "editor.image_url",
  image_urls_text: "editor.image_urls",
  url: "editor.url",
  item_limit: "editor.item_limit",
  grid_columns: "editor.grid_columns",
  grid_rows: "editor.grid_rows",
  density: "editor.density",
  variant: "editor.variant",
  show_metrics: "editor.show_metrics",
  show_actions: "editor.show_actions",
  show_area_summaries: "editor.show_area_summaries"
};

export function renderContentForm(
  hass: HomeAssistant | undefined,
  config: DashboardCardConfig,
  onPatch: (patch: EditorPatch) => void,
  onRecommend: () => void
): TemplateResult {
  if (customElements.get("ha-form")) {
    return html`
      ${renderHaForm(hass, contentFormData(config), contentFormSchema(hass, config), (value) => onPatch(contentPatch(value)), (schema) => helperFor(hass, schema, config))}
      ${renderImageSourceEditor(hass, config, onPatch)}
      ${renderNoteContentEditor(hass, config, onPatch)}
      ${renderPanelActionsContentEditor(hass, config, onPatch)}
      ${renderCardTypeControl(hass, config, (type) => onPatch({ type }), onRecommend, { compact: true })}
    `;
  }
  return html`
    ${renderCardTypeControl(hass, config, (type) => onPatch({ type }), onRecommend)}
    ${renderNativeSubtypeSelect(hass, config, onPatch)}
    <label>
      <span>${localize(hass, "editor.title")}</span>
      <input .value=${config.title || ""} @input=${(event: Event) => onPatch({ title: (event.target as HTMLInputElement).value })} />
    </label>
    <label>
      <span>${localize(hass, "editor.subtitle")}</span>
      <input .value=${config.subtitle || ""} @input=${(event: Event) => onPatch({ subtitle: (event.target as HTMLInputElement).value })} />
    </label>
    ${renderNativeContentFields(hass, config, onPatch)}
    ${renderImageSourceEditor(hass, config, onPatch)}
    ${renderNoteContentEditor(hass, config, onPatch)}
    ${renderPanelActionsContentEditor(hass, config, onPatch)}
    <label>
      <span>${localize(hass, "editor.entities")}</span>
      <textarea .value=${(config.entities || []).join("\n")} @change=${(event: Event) => onPatch({ entities: (event.target as HTMLTextAreaElement).value.split(/\s+/).filter(Boolean) })}></textarea>
      <span class="hint">${localize(hass, "editor.entities_hint")}</span>
    </label>
  `;
}

export function renderLayoutForm(hass: HomeAssistant | undefined, config: DashboardCardConfig, onPatch: (patch: EditorPatch) => void): TemplateResult {
  if (customElements.get("ha-form")) {
    return renderHaForm(hass, layoutFormData(config), layoutFormSchema(hass), (value) => onPatch(layoutPatch(value, config)));
  }
  return html`
    <div class="grid">
      <label>
        <span>${localize(hass, "editor.item_limit")}</span>
        <input type="number" min="1" max="24" .value=${config.item_limit === undefined ? "" : String(config.item_limit)} @change=${(event: Event) => onPatch({ item_limit: valueAsNumber(event) })} />
      </label>
      <label>
        <span>${localize(hass, "editor.grid_columns")}</span>
        <input type="number" min="2" max="12" .value=${config.grid_options?.columns === undefined ? "" : String(config.grid_options.columns)} @change=${(event: Event) => onPatch(gridPatch(config, "columns", valueAsNumber(event)))} />
      </label>
      <label>
        <span>${localize(hass, "editor.grid_rows")}</span>
        <input type="number" min="1" max="12" .value=${config.grid_options?.rows === undefined ? "" : String(config.grid_options.rows)} @change=${(event: Event) => onPatch(gridPatch(config, "rows", valueAsNumber(event)))} />
      </label>
      ${renderNativeSelect(hass, config, "density", ["comfortable", "compact"], onPatch)}
      ${renderNativeSelect(hass, config, "variant", ["standard", "compact", "panel"], onPatch)}
    </div>
  `;
}

export function renderVisibilityForm(hass: HomeAssistant | undefined, config: DashboardCardConfig, onPatch: (patch: EditorPatch) => void): TemplateResult {
  if (customElements.get("ha-form")) {
    return renderHaForm(hass, visibilityFormData(config), visibilityFormSchema(), (value) => onPatch(visibilityPatch(value)));
  }
  return html`
    ${renderNativeCheckbox(hass, config, "show_metrics", onPatch)}
    ${renderNativeCheckbox(hass, config, "show_actions", onPatch)}
    ${renderNativeCheckbox(hass, config, "show_area_summaries", onPatch)}
  `;
}

export function loadCardEditorHaComponents(): void {
  if (!customElements.get("ha-form")) {
    (customElements.get("hui-tile-card") as { getConfigElement?: () => unknown } | undefined)?.getConfigElement?.();
  }
}

function renderHaForm(
  hass: HomeAssistant | undefined,
  data: FormValue,
  schema: FormSchema,
  onValue: (value: FormValue) => void,
  computeHelper: (schema: Record<string, unknown>) => string = () => ""
): TemplateResult {
  return html`
    <ha-form
      .hass=${hass}
      .data=${data}
      .schema=${schema}
      .computeLabel=${(item: Record<string, unknown>) => labelFor(hass, item)}
      .computeHelper=${computeHelper}
      @value-changed=${(event: CustomEvent<{ value?: FormValue }>) => onValue(event.detail.value || {})}
    ></ha-form>
  `;
}

function contentFormData(config: DashboardCardConfig): FormValue {
  return pickDefined({
    type: config.type,
    subtype: config.subtype,
    title: config.title,
    subtitle: config.subtitle,
    ...contentFormDataFields(config)
  });
}

function layoutFormData(config: DashboardCardConfig): FormValue {
  return pickDefined({
    item_limit: config.item_limit,
    grid_columns: config.grid_options?.columns,
    grid_rows: config.grid_options?.rows,
    density: config.density,
    variant: config.variant
  });
}

function visibilityFormData(config: DashboardCardConfig): FormValue {
  return pickDefined({
    show_metrics: config.show_metrics,
    show_actions: config.show_actions,
    show_area_summaries: config.show_area_summaries
  });
}

function contentFormSchema(hass: HomeAssistant | undefined, config: DashboardCardConfig): FormSchema {
  const subtypeOptions = subtypeOptionsForType(config.type);
  const subtypeSchema = subtypeOptions.length
    ? [
        {
          name: "subtype",
          selector: selectSelector(subtypeOptions.map((option) => option.value), (value) => localize(hass, `editor.subtype.${value}` as TranslationKey))
        }
      ]
    : [];
  return [
    {
      name: "type",
      selector: {
        select: {
          mode: "dropdown",
          options: DASHBOARD_CARD_DEFINITIONS.map((definition) => ({
            value: definition.type,
            label: localize(hass, `editor.card_type.${definition.kind}` as TranslationKey)
          }))
        }
      }
    },
    ...subtypeSchema,
    {
      type: "grid",
      name: "",
      schema: [
        { name: "title", selector: { text: {} } },
        { name: "subtitle", selector: { text: {} } }
      ]
    },
    ...contentFormSchemaFields(config.type)
  ];
}

function layoutFormSchema(hass: HomeAssistant | undefined): FormSchema {
  return [
    {
      type: "grid",
      name: "",
      schema: [
        { name: "item_limit", selector: { number: { min: 1, max: 24, mode: "box" } } },
        { name: "density", selector: selectSelector(["comfortable", "compact"], (value) => localize(hass, `editor.density.${value}` as TranslationKey)) },
        { name: "variant", selector: selectSelector(["standard", "compact", "panel"], (value) => localize(hass, `editor.variant.${value}` as TranslationKey)) }
      ]
    },
    {
      type: "grid",
      name: "",
      schema: [
        { name: "grid_columns", selector: { number: { min: 2, max: 12, mode: "box" } } },
        { name: "grid_rows", selector: { number: { min: 1, max: 12, mode: "box" } } }
      ]
    }
  ];
}

function visibilityFormSchema(): FormSchema {
  return [
    {
      type: "grid",
      name: "",
      schema: [
        { name: "show_metrics", selector: { boolean: {} } },
        { name: "show_actions", selector: { boolean: {} } },
        { name: "show_area_summaries", selector: { boolean: {} } }
      ]
    }
  ];
}

function contentPatch(value: FormValue): EditorPatch {
  return cleanPatch({
    ...(has(value, "type") ? { type: asString(value.type) } : {}),
    ...(has(value, "subtype") ? { subtype: asString(value.subtype) } : {}),
    ...(has(value, "title") ? { title: asString(value.title) } : {}),
    ...(has(value, "subtitle") ? { subtitle: asString(value.subtitle) } : {}),
    ...contentPatchFields(value, has)
  });
}

function layoutPatch(value: FormValue, config: DashboardCardConfig): EditorPatch {
  const patch: EditorPatch = cleanPatch({
    ...(has(value, "item_limit") ? { item_limit: asOptionalNumber(value.item_limit) } : {}),
    ...(has(value, "density") ? { density: asDensity(value.density) } : {}),
    ...(has(value, "variant") ? { variant: asVariant(value.variant) } : {})
  });
  if (has(value, "grid_columns") || has(value, "grid_rows")) {
    const gridOptions = { ...(config.grid_options || {}) };
    if (has(value, "grid_columns")) setOptionalNumber(gridOptions, "columns", value.grid_columns);
    if (has(value, "grid_rows")) setOptionalNumber(gridOptions, "rows", value.grid_rows);
    patch.grid_options = Object.keys(gridOptions).length ? gridOptions : undefined;
  }
  return patch;
}

function visibilityPatch(value: FormValue): EditorPatch {
  return cleanPatch({
    ...(has(value, "show_metrics") ? { show_metrics: asBoolean(value.show_metrics) } : {}),
    ...(has(value, "show_actions") ? { show_actions: asBoolean(value.show_actions) } : {}),
    ...(has(value, "show_area_summaries") ? { show_area_summaries: asBoolean(value.show_area_summaries) } : {})
  });
}

function labelFor(hass: HomeAssistant | undefined, schema: Record<string, unknown>): string {
  const name = typeof schema.name === "string" ? schema.name : "";
  const key = FORM_LABELS[name];
  return key ? localize(hass, key) : name;
}

function helperFor(hass: HomeAssistant | undefined, schema: Record<string, unknown>, config: DashboardCardConfig): string {
  if (schema.name === "type") return localize(hass, "editor.card_type_domains", { domains: recommendedDomainsForCard(config.type, config.subtype).join(", ") || "-" });
  if (schema.name === "subtype") return localize(hass, "editor.subtype_hint");
  if (typeof schema.name === "string") return contentHelper(hass, config.type, schema.name);
  return "";
}

function pickDefined(value: FormValue): FormValue {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function cleanPatch<T extends Record<string, unknown>>(patch: T): T {
  return Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, value === "" ? undefined : value])) as T;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  if (value === "" || value === undefined || value === null) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asDensity(value: unknown): DashboardCardConfig["density"] | undefined {
  return value === "comfortable" || value === "compact" ? value : undefined;
}

function asVariant(value: unknown): DashboardCardConfig["variant"] | undefined {
  return value === "standard" || value === "compact" || value === "panel" ? value : undefined;
}

function valueAsNumber(event: Event): number | undefined {
  return asOptionalNumber((event.target as HTMLInputElement).value);
}

function gridPatch(config: DashboardCardConfig, key: "columns" | "rows", value: number | undefined): EditorPatch {
  const gridOptions = { ...(config.grid_options || {}) };
  if (value === undefined) {
    delete gridOptions[key];
  } else {
    gridOptions[key] = value;
  }
  return { grid_options: Object.keys(gridOptions).length ? gridOptions : undefined };
}

function setOptionalNumber(target: Partial<NonNullable<DashboardCardConfig["grid_options"]>>, key: "columns" | "rows", value: unknown): void {
  const number = asOptionalNumber(value);
  if (number === undefined) {
    delete target[key];
    return;
  }
  target[key] = number;
}

function has(value: FormValue, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function selectSelector(values: string[], labelForValue: (value: string) => string): Record<string, unknown> {
  return {
    select: {
      mode: "dropdown",
      options: values.map((value) => ({ value, label: labelForValue(value) }))
    }
  };
}

function renderNativeSelect(
  hass: HomeAssistant | undefined,
  config: DashboardCardConfig,
  key: "density" | "variant",
  values: string[],
  onPatch: (patch: EditorPatch) => void
): TemplateResult {
  return html`
    <label>
      <span>${localize(hass, FORM_LABELS[key])}</span>
      <select .value=${config[key] || ""} @change=${(event: Event) => onPatch({ [key]: (event.target as HTMLSelectElement).value })}>
        ${values.map((value) => html`<option value=${value} .selected=${config[key] === value}>${localize(hass, `editor.${key}.${value}` as TranslationKey)}</option>`)}
      </select>
    </label>
  `;
}

function renderNativeSubtypeSelect(hass: HomeAssistant | undefined, config: DashboardCardConfig, onPatch: (patch: EditorPatch) => void): TemplateResult | "" {
  const options = subtypeOptionsForType(config.type);
  if (!options.length) return "";
  return html`
    <label>
      <span>${localize(hass, "editor.subtype")}</span>
      <select .value=${config.subtype || ""} @change=${(event: Event) => onPatch({ subtype: (event.target as HTMLSelectElement).value })}>
        ${options.map((option) => html`<option value=${option.value} .selected=${config.subtype === option.value}>${localize(hass, `editor.subtype.${option.value}` as TranslationKey)}</option>`)}
      </select>
      <span class="hint">${localize(hass, "editor.subtype_hint")}</span>
    </label>
  `;
}

function renderNativeCheckbox(
  hass: HomeAssistant | undefined,
  config: DashboardCardConfig,
  key: "show_metrics" | "show_actions" | "show_area_summaries",
  onPatch: (patch: EditorPatch) => void
): TemplateResult {
  return html`
    <label class="checkbox">
      <input type="checkbox" .checked=${Boolean(config[key])} @change=${(event: Event) => onPatch({ [key]: (event.target as HTMLInputElement).checked })} />
      <span>${localize(hass, FORM_LABELS[key])}</span>
    </label>
  `;
}
