import { html, type TemplateResult } from "lit";

import { localize } from "../i18n";
import type { DashboardCardConfig, HomeAssistant } from "./types";

type EditorPatch = Partial<DashboardCardConfig>;

type PanelActionContent = {
  title: string;
  details: string[];
};

export function renderPanelActionsContentEditor(hass: HomeAssistant | undefined, config: DashboardCardConfig, onPatch: (patch: EditorPatch) => void): TemplateResult | "" {
  if (!config.type.endsWith("yeelight-dashboard-panel-actions-card")) return "";
  const content = parsePanelActionContent(config.content);
  return html`
    <div class="panel-action-content-editor">
      <div class="panel-action-content-head">
        <strong>${localize(hass, "editor.panel_actions_note")}</strong>
        <span>${localize(hass, "editor.panel_actions_note_hint")}</span>
      </div>
      <label class="panel-action-title">
        <span>${localize(hass, "editor.panel_actions_note_title")}</span>
        <input
          .value=${content.title}
          placeholder=${localize(hass, "editor.panel_actions_note_title_placeholder")}
          @change=${(event: Event) => updatePanelActionTitle(hass, content, (event.target as HTMLInputElement).value, onPatch)}
        />
      </label>
      ${content.details.length
        ? html`<div class="panel-action-content-list">${content.details.map((detail, index) => renderPanelActionDetail(hass, content, detail, index, onPatch))}</div>`
        : html`<div class="panel-action-content-empty">${localize(hass, "editor.panel_actions_note_empty")}</div>`}
      ${renderPanelActionDetailAdd(hass, content, onPatch)}
    </div>
  `;
}

function renderPanelActionDetail(hass: HomeAssistant | undefined, content: PanelActionContent, detail: string, index: number, onPatch: (patch: EditorPatch) => void): TemplateResult {
  return html`
    <div class="panel-action-content-row">
      <label>
        <span>${localize(hass, "editor.panel_actions_note_detail")}</span>
        <input
          data-panel-action-detail
          .value=${detail}
          placeholder=${localize(hass, "editor.panel_actions_note_detail_placeholder")}
          @change=${(event: Event) => updatePanelActionDetail(hass, content, index, (event.target as HTMLInputElement).value, onPatch)}
        />
      </label>
      <div class="panel-action-content-actions">
        <button type="button" ?disabled=${index === 0} @click=${() => movePanelActionDetail(hass, content, index, -1, onPatch)}>${localize(hass, "editor.panel_actions_note_move_up")}</button>
        <button type="button" ?disabled=${index === content.details.length - 1} @click=${() => movePanelActionDetail(hass, content, index, 1, onPatch)}>${localize(hass, "editor.panel_actions_note_move_down")}</button>
        <button class="remove-button" type="button" @click=${() => removePanelActionDetail(hass, content, index, onPatch)}>${localize(hass, "editor.panel_actions_note_remove")}</button>
      </div>
    </div>
  `;
}

function renderPanelActionDetailAdd(hass: HomeAssistant | undefined, content: PanelActionContent, onPatch: (patch: EditorPatch) => void): TemplateResult {
  return html`
    <div class="panel-action-content-add">
      <input data-panel-action-new-detail placeholder=${localize(hass, "editor.panel_actions_note_new_placeholder")} />
      <button type="button" @click=${(event: Event) => addPanelActionDetail(hass, event, content, onPatch)}>${localize(hass, "editor.panel_actions_note_add")}</button>
    </div>
  `;
}

function parsePanelActionContent(value: string | undefined): PanelActionContent {
  const lines = (value || "").split(/\r?\n/).map(cleanLine).filter(Boolean);
  return {
    title: lines[0] || "",
    details: lines.slice(1)
  };
}

function cleanLine(value: string): string {
  return value.replace(/^[-*]\s+/, "").trim();
}

function serializePanelActionContent(hass: HomeAssistant | undefined, content: PanelActionContent): string {
  const title = content.title.trim() || (content.details.length ? localize(hass, "editor.panel_actions_note_default_title") : "");
  return [title, ...content.details.map((detail) => `- ${detail.trim()}`)].filter(Boolean).join("\n");
}

function panelActionPatch(hass: HomeAssistant | undefined, content: PanelActionContent): EditorPatch {
  return { content: serializePanelActionContent(hass, content) };
}

function updatePanelActionTitle(hass: HomeAssistant | undefined, content: PanelActionContent, title: string, onPatch: (patch: EditorPatch) => void): void {
  onPatch(panelActionPatch(hass, { ...content, title }));
}

function updatePanelActionDetail(hass: HomeAssistant | undefined, content: PanelActionContent, index: number, detail: string, onPatch: (patch: EditorPatch) => void): void {
  const details = content.details.map((item, itemIndex) => (itemIndex === index ? detail : item));
  onPatch(panelActionPatch(hass, { ...content, details }));
}

function movePanelActionDetail(hass: HomeAssistant | undefined, content: PanelActionContent, index: number, direction: -1 | 1, onPatch: (patch: EditorPatch) => void): void {
  const target = index + direction;
  if (target < 0 || target >= content.details.length) return;
  const details = [...content.details];
  [details[index], details[target]] = [details[target], details[index]];
  onPatch(panelActionPatch(hass, { ...content, details }));
}

function removePanelActionDetail(hass: HomeAssistant | undefined, content: PanelActionContent, index: number, onPatch: (patch: EditorPatch) => void): void {
  onPatch(panelActionPatch(hass, { ...content, details: content.details.filter((_, itemIndex) => itemIndex !== index) }));
}

function addPanelActionDetail(hass: HomeAssistant | undefined, event: Event, content: PanelActionContent, onPatch: (patch: EditorPatch) => void): void {
  const container = (event.currentTarget as HTMLElement).closest(".panel-action-content-add");
  const detail = container?.querySelector<HTMLInputElement>("[data-panel-action-new-detail]")?.value.trim() || "";
  if (!detail) return;
  onPatch(panelActionPatch(hass, { ...content, details: [...content.details, detail] }));
}
