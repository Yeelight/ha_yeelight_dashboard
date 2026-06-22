import { html, type TemplateResult } from "lit";

import { localize, type TranslationKey } from "../i18n";
import type { DashboardCardConfig, HomeAssistant } from "./types";

type EditorPatch = Partial<DashboardCardConfig>;
type NoteLineKind = "plain" | "todo" | "done";

type NoteRow = {
  kind: NoteLineKind;
  text: string;
};

type NoteContent = {
  title: string;
  rows: NoteRow[];
};

const NOTE_KIND_PREFIX: Record<NoteLineKind, string> = {
  plain: "- ",
  todo: "[ ] ",
  done: "[x] "
};

export function renderNoteContentEditor(hass: HomeAssistant | undefined, config: DashboardCardConfig, onPatch: (patch: EditorPatch) => void): TemplateResult | "" {
  if (!config.type.endsWith("yeelight-dashboard-note-card")) return "";
  const note = parseNoteContent(config.content);
  return html`
    <div class="note-content-editor">
      <div class="note-content-head">
        <strong>${localize(hass, "editor.note_items")}</strong>
        <span>${localize(hass, "editor.note_items_hint")}</span>
      </div>
      <label class="note-content-title">
        <span>${localize(hass, "editor.note_title")}</span>
        <input
          .value=${note.title}
          placeholder=${localize(hass, "editor.note_title_placeholder")}
          @change=${(event: Event) => updateNoteTitle(hass, note, (event.target as HTMLInputElement).value, onPatch)}
        />
      </label>
      ${note.rows.length
        ? html`<div class="note-content-list">${note.rows.map((row, index) => renderNoteRow(hass, note, row, index, onPatch))}</div>`
        : html`<div class="note-content-empty">${localize(hass, "editor.note_empty")}</div>`}
      ${renderNoteAdd(hass, note, onPatch)}
    </div>
  `;
}

function renderNoteRow(hass: HomeAssistant | undefined, note: NoteContent, row: NoteRow, index: number, onPatch: (patch: EditorPatch) => void): TemplateResult {
  return html`
    <div class="note-content-row">
      <label>
        <span>${localize(hass, "editor.note_item_kind")}</span>
        <select .value=${row.kind} @change=${(event: Event) => updateNoteRow(hass, note, index, { kind: (event.target as HTMLSelectElement).value as NoteLineKind }, onPatch)}>
          ${renderKindOptions(hass, row.kind)}
        </select>
      </label>
      <label>
        <span>${localize(hass, "editor.note_item_text")}</span>
        <input
          data-note-row-text
          .value=${row.text}
          placeholder=${localize(hass, "editor.note_item_placeholder")}
          @change=${(event: Event) => updateNoteRow(hass, note, index, { text: (event.target as HTMLInputElement).value }, onPatch)}
        />
      </label>
      <div class="note-content-actions">
        <button type="button" ?disabled=${index === 0} @click=${() => moveNoteRow(hass, note, index, -1, onPatch)}>${localize(hass, "editor.note_move_up")}</button>
        <button type="button" ?disabled=${index === note.rows.length - 1} @click=${() => moveNoteRow(hass, note, index, 1, onPatch)}>${localize(hass, "editor.note_move_down")}</button>
        <button class="remove-button" type="button" @click=${() => removeNoteRow(hass, note, index, onPatch)}>${localize(hass, "editor.note_remove")}</button>
      </div>
    </div>
  `;
}

function renderNoteAdd(hass: HomeAssistant | undefined, note: NoteContent, onPatch: (patch: EditorPatch) => void): TemplateResult {
  return html`
    <div class="note-content-add">
      <select data-note-kind>${renderKindOptions(hass, "todo")}</select>
      <input data-note-text placeholder=${localize(hass, "editor.note_new_placeholder")} />
      <button type="button" @click=${(event: Event) => addNoteRow(hass, event, note, onPatch)}>${localize(hass, "editor.note_add")}</button>
    </div>
  `;
}

function renderKindOptions(hass: HomeAssistant | undefined, active: NoteLineKind): TemplateResult[] {
  return (["plain", "todo", "done"] as NoteLineKind[]).map(
    (kind) => html`<option value=${kind} .selected=${kind === active}>${localize(hass, `editor.note_kind.${kind}` as TranslationKey)}</option>`
  );
}

function parseNoteContent(content: string | undefined): NoteContent {
  const lines = (content || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    title: cleanNoteText(lines[0] || ""),
    rows: lines.slice(1).map(parseNoteRow)
  };
}

function parseNoteRow(line: string): NoteRow {
  if (/^(?:[-*]\s+)?\[[xX]\]\s+/.test(line)) return { kind: "done", text: cleanNoteText(line) };
  if (/^(?:[-*]\s+)?\[\s\]\s+/.test(line)) return { kind: "todo", text: cleanNoteText(line) };
  return { kind: "plain", text: cleanNoteText(line) };
}

function cleanNoteText(line: string): string {
  return line.replace(/^[-*]\s+\[[ xX]\]\s+/, "").replace(/^[-*]\s+/, "").replace(/^\[[ xX]\]\s+/, "").trim();
}

function serializeNoteContent(hass: HomeAssistant | undefined, note: NoteContent): string {
  const title = note.title.trim() || (note.rows.length ? localize(hass, "editor.note_default_title") : "");
  return [title, ...note.rows.map(serializeNoteRow)].filter(Boolean).join("\n");
}

function serializeNoteRow(row: NoteRow): string {
  const text = row.text.trim();
  return text ? `${NOTE_KIND_PREFIX[row.kind]}${text}` : "";
}

function notePatch(hass: HomeAssistant | undefined, note: NoteContent): EditorPatch {
  return { content: serializeNoteContent(hass, note) };
}

function updateNoteTitle(hass: HomeAssistant | undefined, note: NoteContent, title: string, onPatch: (patch: EditorPatch) => void): void {
  onPatch(notePatch(hass, { ...note, title }));
}

function updateNoteRow(hass: HomeAssistant | undefined, note: NoteContent, index: number, patch: Partial<NoteRow>, onPatch: (patch: EditorPatch) => void): void {
  const next = note.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
  onPatch(notePatch(hass, { ...note, rows: next }));
}

function moveNoteRow(hass: HomeAssistant | undefined, note: NoteContent, index: number, direction: -1 | 1, onPatch: (patch: EditorPatch) => void): void {
  const target = index + direction;
  if (target < 0 || target >= note.rows.length) return;
  const next = [...note.rows];
  [next[index], next[target]] = [next[target], next[index]];
  onPatch(notePatch(hass, { ...note, rows: next }));
}

function removeNoteRow(hass: HomeAssistant | undefined, note: NoteContent, index: number, onPatch: (patch: EditorPatch) => void): void {
  onPatch(notePatch(hass, { ...note, rows: note.rows.filter((_, rowIndex) => rowIndex !== index) }));
}

function addNoteRow(hass: HomeAssistant | undefined, event: Event, note: NoteContent, onPatch: (patch: EditorPatch) => void): void {
  const container = (event.currentTarget as HTMLElement).closest(".note-content-add");
  const kind = (container?.querySelector<HTMLSelectElement>("[data-note-kind]")?.value || "todo") as NoteLineKind;
  const text = container?.querySelector<HTMLInputElement>("[data-note-text]")?.value.trim() || "";
  if (!text) return;
  onPatch(notePatch(hass, { ...note, rows: [...note.rows, { kind, text }] }));
}
