import { html, type TemplateResult } from "lit";

import { localize } from "../i18n";
import { DASHBOARD_CARD_DEFINITIONS } from "./card-definitions";
import type { DashboardCardConfig, DashboardCardKind, HomeAssistant } from "./types";

type FormSchema = Array<Record<string, unknown>>;
type EditorPatch = Partial<DashboardCardConfig>;

export function contentFormDataFields(config: DashboardCardConfig): Record<string, unknown> {
  return {
    content: config.content,
    image_url: config.image_url,
    image_urls_text: config.image_urls?.join("\n"),
    url: config.url
  };
}

export function contentFormSchemaFields(type: string | undefined): FormSchema {
  const kind = cardKind(type);
  if (kind === "note" || kind === "panelActions") {
    return [{ name: "content", selector: { text: { multiline: true } } }];
  }
  if (kind === "image") {
    return [
      {
        type: "grid",
        name: "",
        schema: [
          { name: "image_url", selector: { text: {} } },
          { name: "url", selector: { text: {} } }
        ]
      },
      { name: "content", selector: { text: { multiline: true } } },
      { name: "image_urls_text", selector: { text: { multiline: true } } }
    ];
  }
  return [];
}

export function contentPatchFields(value: Record<string, unknown>, has: (value: Record<string, unknown>, key: string) => boolean): EditorPatch {
  return {
    ...(has(value, "content") ? { content: asString(value.content) } : {}),
    ...(has(value, "image_url") ? { image_url: asString(value.image_url) } : {}),
    ...(has(value, "image_urls_text") ? { image_urls: asStringList(value.image_urls_text) } : {}),
    ...(has(value, "url") ? { url: asString(value.url) } : {})
  };
}

export function contentHelper(hass: HomeAssistant | undefined, type: string | undefined, name: string): string {
  const kind = cardKind(type);
  if (name === "content") {
    if (kind === "image") return localize(hass, "editor.image_content_hint");
    if (kind === "note") return localize(hass, "editor.note_content_hint");
    if (kind === "panelActions") return localize(hass, "editor.panel_actions_content_hint");
    return localize(hass, "editor.content_hint");
  }
  if (name === "image_url") return localize(hass, "editor.image_url_hint");
  if (name === "image_urls_text") return localize(hass, "editor.image_urls_hint");
  if (name === "url") return localize(hass, "editor.url_hint");
  return "";
}

export function renderNativeContentFields(hass: HomeAssistant | undefined, config: DashboardCardConfig, onPatch: (patch: EditorPatch) => void): TemplateResult | "" {
  const kind = cardKind(config.type);
  if (kind === "note" || kind === "panelActions") {
    return html`
      <label>
        <span>${localize(hass, "editor.content")}</span>
        <textarea .value=${config.content || ""} @input=${(event: Event) => onPatch({ content: (event.target as HTMLTextAreaElement).value })}></textarea>
        <span class="hint">${localize(hass, kind === "note" ? "editor.note_content_hint" : "editor.panel_actions_content_hint")}</span>
      </label>
    `;
  }
  if (kind === "image") {
    return html`
      <label>
        <span>${localize(hass, "editor.image_url")}</span>
        <input .value=${config.image_url || ""} @input=${(event: Event) => onPatch({ image_url: (event.target as HTMLInputElement).value })} />
        <span class="hint">${localize(hass, "editor.image_url_hint")}</span>
      </label>
      <label>
        <span>${localize(hass, "editor.content")}</span>
        <textarea .value=${config.content || ""} @input=${(event: Event) => onPatch({ content: (event.target as HTMLTextAreaElement).value })}></textarea>
        <span class="hint">${localize(hass, "editor.image_content_hint")}</span>
      </label>
      <label>
        <span>${localize(hass, "editor.image_urls")}</span>
        <textarea .value=${(config.image_urls || []).join("\n")} @change=${(event: Event) => onPatch({ image_urls: asStringList((event.target as HTMLTextAreaElement).value) || [] })}></textarea>
        <span class="hint">${localize(hass, "editor.image_urls_hint")}</span>
      </label>
      <label>
        <span>${localize(hass, "editor.url")}</span>
        <input .value=${config.url || ""} @input=${(event: Event) => onPatch({ url: (event.target as HTMLInputElement).value })} />
        <span class="hint">${localize(hass, "editor.url_hint")}</span>
      </label>
    `;
  }
  return "";
}

export function renderImageSourceEditor(hass: HomeAssistant | undefined, config: DashboardCardConfig, onPatch: (patch: EditorPatch) => void): TemplateResult | "" {
  if (cardKind(config.type) !== "image") return "";
  const rows = imageSourceRows(config);
  return html`
    <div class="image-source-editor">
      <div class="image-source-head">
        <strong>${localize(hass, "editor.image_sources")}</strong>
        <span>${localize(hass, "editor.image_sources_hint")}</span>
      </div>
      ${rows.length
        ? html`
            <div class="image-source-list">
              ${rows.map((row, index) => renderImageSourceRow(hass, rows, row, index, onPatch))}
            </div>
          `
        : html`<div class="image-source-empty">${localize(hass, "editor.image_source_empty")}</div>`}
      ${renderImageSourceAdd(hass, rows, onPatch)}
    </div>
  `;
}

function renderImageSourceRow(hass: HomeAssistant | undefined, rows: ImageSourceRow[], row: ImageSourceRow, index: number, onPatch: (patch: EditorPatch) => void): TemplateResult {
  const label = index === 0 ? localize(hass, "editor.image_source_cover") : localize(hass, "editor.image_source_item", { index });
  return html`
    <div class="image-source-row">
      <span class="image-source-preview">${row.url ? html`<img src=${row.url} alt=${row.title || label} loading="lazy" />` : html`<ha-icon .icon=${"mdi:image-outline"}></ha-icon>`}</span>
      <div class="image-source-fields">
        <label>
          <span>${label}</span>
          <input
            .value=${row.url}
            placeholder=${localize(hass, "editor.image_source_url_placeholder")}
            @change=${(event: Event) => updateImageSource(rows, index, { url: (event.target as HTMLInputElement).value }, onPatch)}
          />
        </label>
        <label>
          <span>${localize(hass, "editor.image_source_title")}</span>
          <input
            .value=${row.title}
            placeholder=${localize(hass, "editor.image_source_title_placeholder")}
            @change=${(event: Event) => updateImageSource(rows, index, { title: (event.target as HTMLInputElement).value }, onPatch)}
          />
        </label>
      </div>
      <div class="image-source-actions">
        <button type="button" ?disabled=${index === 0} @click=${() => moveImageSource(rows, index, -1, onPatch)}>${localize(hass, "editor.image_source_move_up")}</button>
        <button type="button" ?disabled=${index === rows.length - 1} @click=${() => moveImageSource(rows, index, 1, onPatch)}>${localize(hass, "editor.image_source_move_down")}</button>
        <button class="remove-button" type="button" @click=${() => removeImageSource(rows, index, onPatch)}>${localize(hass, "editor.image_source_remove")}</button>
      </div>
    </div>
  `;
}

function renderImageSourceAdd(hass: HomeAssistant | undefined, rows: ImageSourceRow[], onPatch: (patch: EditorPatch) => void): TemplateResult {
  return html`
    <div class="image-source-add">
      <input data-image-source-url placeholder=${localize(hass, "editor.image_source_new_url_placeholder")} />
      <input data-image-source-title placeholder=${localize(hass, "editor.image_source_new_title_placeholder")} />
      <button type="button" @click=${(event: Event) => addImageSource(event, rows, onPatch)}>${localize(hass, "editor.image_source_add")}</button>
    </div>
  `;
}

function cardKind(type: string | undefined): DashboardCardKind | undefined {
  return DASHBOARD_CARD_DEFINITIONS.find((definition) => definition.type === type)?.kind;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asStringList(value: unknown): string[] | undefined {
  if (typeof value !== "string") return undefined;
  return [...new Set(value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))];
}

type ImageSourceRow = {
  url: string;
  title: string;
};

function imageSourceRows(config: DashboardCardConfig): ImageSourceRow[] {
  return [config.image_url, ...(config.image_urls || [])].filter((item): item is string => Boolean(item)).map(parseImageSourceRow);
}

function parseImageSourceRow(value: string): ImageSourceRow {
  const [url = "", ...titleParts] = value.split("|");
  return {
    url: url.trim(),
    title: titleParts.join("|").trim()
  };
}

function serializeImageSourceRow(row: ImageSourceRow): string {
  const url = row.url.trim();
  const title = row.title.trim();
  return title ? `${url} | ${title}` : url;
}

function imagePatchFromRows(rows: ImageSourceRow[]): EditorPatch {
  const values = rows.map(serializeImageSourceRow).filter(Boolean);
  return {
    image_url: values[0],
    image_urls: values.slice(1)
  };
}

function updateImageSource(rows: ImageSourceRow[], index: number, patch: Partial<ImageSourceRow>, onPatch: (patch: EditorPatch) => void): void {
  const next = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
  onPatch(imagePatchFromRows(next));
}

function moveImageSource(rows: ImageSourceRow[], index: number, direction: -1 | 1, onPatch: (patch: EditorPatch) => void): void {
  const target = index + direction;
  if (target < 0 || target >= rows.length) return;
  const next = [...rows];
  [next[index], next[target]] = [next[target], next[index]];
  onPatch(imagePatchFromRows(next));
}

function removeImageSource(rows: ImageSourceRow[], index: number, onPatch: (patch: EditorPatch) => void): void {
  onPatch(imagePatchFromRows(rows.filter((_, rowIndex) => rowIndex !== index)));
}

function addImageSource(event: Event, rows: ImageSourceRow[], onPatch: (patch: EditorPatch) => void): void {
  const container = (event.currentTarget as HTMLElement).closest(".image-source-add");
  const url = container?.querySelector<HTMLInputElement>("[data-image-source-url]")?.value.trim() || "";
  const title = container?.querySelector<HTMLInputElement>("[data-image-source-title]")?.value.trim() || "";
  if (!url) return;
  onPatch(imagePatchFromRows([...rows, { url, title }]));
}
