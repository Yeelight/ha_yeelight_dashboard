import { html, nothing, type TemplateResult } from "lit";

import { localize, stateText, type TranslationKey } from "../i18n";
import { actionFor, actionLabel, fireMoreInfo, type EntityAction } from "./actions";
import type { DashboardCardSummary, HomeAssistant, NormalizedEntity } from "./types";

export type UtilityRenderHost = HTMLElement & {
  hass?: HomeAssistant;
  runEntityAction(entity: NormalizedEntity, action: EntityAction): Promise<void>;
};

export type UtilityContentConfig = {
  content?: string;
  image_url?: string;
  image_urls?: string[];
  url?: string;
};

export function renderPanelActionsBoard(host: UtilityRenderHost, summary: DashboardCardSummary, limit: number, showActions: boolean, config: UtilityContentConfig = {}): TemplateResult {
  const actions = panelActionEntities(summary.entities).slice(0, limit);
  const note = noteParts(config.content);
  if (!actions.length) {
    return note.lines.length
      ? html`<div class="utility-board panel-actions-board">${renderPanelActionNote(host, note)}${empty(host, "empty.no_panel_actions")}</div>`
      : empty(host, "empty.no_panel_actions");
  }
  const primary = actions[0];
  const primaryAction = actionFor(primary);
  const grouped = actionGroups(host.hass, actions);
  return html`
    <div class="utility-board panel-actions-board">
      <div class=${`panel-action-feature domain-${primary.domain} ${primary.available ? "" : "muted"}`}>
        <button class="panel-action-main" type="button" @click=${() => fireMoreInfo(host, primary.entityId)}>
          <ha-icon .icon=${primary.icon}></ha-icon>
          <span>
            <small>${localize(host.hass, "label.featured_action")}</small>
            <strong>${primary.name}</strong>
          </span>
        </button>
        ${primaryAction
          ? html`
              <button
                class="panel-action-run"
                type="button"
                ?disabled=${!showActions || !primary.available || primary.readOnly}
                @click=${() => host.runEntityAction(primary, primaryAction)}
              >
                ${actionLabel(host.hass, primary, primaryAction)}
              </button>
            `
          : html`<em>${stateText(host.hass, primary.state)}</em>`}
      </div>
      <div class="panel-action-chips">${grouped.map((group) => renderActionGroup(host, group))}</div>
      ${note.lines.length ? renderPanelActionNote(host, note) : nothing}
      <div class="panel-actions-grid">
        ${actions.slice(1).map((entity) => renderPanelAction(host, entity, showActions))}
      </div>
    </div>
  `;
}

export function renderImageBoard(host: UtilityRenderHost, summary: DashboardCardSummary, subtype: string | undefined, config: UtilityContentConfig, limit: number): TemplateResult {
  const images = imageSources(host.hass, summary.entities, config, limit);
  if (!images.length) return empty(host, "empty.no_images");
  const primary = images[0];
  const rest = images.slice(1, limit);
  const caption = imageCaption(host.hass, config, primary);
  const carousel = subtype === "carousel" && images.length > 1;
  const content = html`
    <span class="image-frame">
      <img src=${primary.url} alt=${primary.label} loading="lazy" />
      ${carousel
        ? html`<span class="image-progress"><i style=${`--image-progress:${Math.max(12, Math.round(100 / images.length))}%`}></i></span>`
        : nothing}
    </span>
    <span class="image-caption">
      <strong>${caption.title}</strong>
      <small>${caption.detail}</small>
    </span>
  `;
  return html`
    <div class=${`utility-board image-board subtype-${subtype || "single"}`}>
      ${carousel ? html`<div class="image-counter">${localize(host.hass, "label.carousel")} · 1/${images.length}</div>` : nothing}
      ${primary.entityId
        ? html`<button class="image-feature" type="button" @click=${() => fireMoreInfo(host, primary.entityId!)}>${content}</button>`
        : config.url
          ? html`<a class="image-feature" href=${config.url} target="_blank" rel="noreferrer">${content}</a>`
          : html`<div class="image-feature">${content}</div>`}
      ${rest.length ? html`<div class="image-strip">${rest.map((item) => renderImageThumb(host, item, config.url))}</div>` : nothing}
      ${carousel ? html`<div class="image-dots" aria-hidden="true">${images.map((_, index) => html`<span class=${index === 0 ? "active" : ""}></span>`)}</div>` : nothing}
    </div>
  `;
}

export function renderNoteBoard(host: UtilityRenderHost, summary: DashboardCardSummary, config: UtilityContentConfig, limit: number): TemplateResult {
  const note = noteParts(config.content);
  const linked = summary.entities.slice(0, limit);
  if (!note.lines.length && !linked.length) return empty(host, "empty.no_note");
  return html`
    <div class="utility-board note-board">
      ${note.lines.length
        ? html`
            <div class="note-content">
              <span class="note-kicker">${localize(host.hass, "label.note")}</span>
              <strong>${note.title}</strong>
              <div class="note-lines">${note.body.map((line) => html`<p class=${taskState(line)}><ha-icon .icon=${lineIcon(line)}></ha-icon><span>${cleanLine(line)}</span></p>`)}</div>
              ${note.tasks.total
                ? html`
                    <div class="note-summary">
                      <ha-icon .icon=${"mdi:format-list-checks"}></ha-icon>
                      <span>${localize(host.hass, "label.note_tasks", { done: note.tasks.done, total: note.tasks.total })}</span>
                    </div>
                  `
                : nothing}
            </div>
          `
        : html`<div class="note-content muted"><p>${localize(host.hass, "empty.no_note_content")}</p></div>`}
      ${linked.length ? html`<div class="note-links">${linked.map((entity) => renderLinkedEntity(host, entity))}</div>` : nothing}
    </div>
  `;
}

function renderPanelAction(host: UtilityRenderHost, entity: NormalizedEntity, showActions: boolean): TemplateResult {
  const action = showActions ? actionFor(entity) : "";
  const disabled = !entity.available || entity.readOnly || !action;
  if (!action) return renderLinkedEntity(host, entity);
  return html`
    <div class=${`panel-action domain-${entity.domain} ${entity.available ? "" : "muted"}`}>
      <button class="panel-action-main" type="button" @click=${() => fireMoreInfo(host, entity.entityId)}>
        <ha-icon .icon=${entity.icon}></ha-icon>
        <span>
          <strong>${entity.name}</strong>
          <small>${stateText(host.hass, entity.state)}</small>
        </span>
      </button>
      <button class="panel-action-run" type="button" ?disabled=${disabled} @click=${() => host.runEntityAction(entity, action)}>${actionLabel(host.hass, entity, action)}</button>
    </div>
  `;
}

function renderPanelActionNote(host: UtilityRenderHost, note: NoteParts): TemplateResult {
  return html`
    <div class="panel-action-note">
      <span>${localize(host.hass, "label.action_note")}</span>
      <strong>${note.title}</strong>
      ${note.body.length ? html`<small>${note.body.map(cleanLine).join(" · ")}</small>` : nothing}
    </div>
  `;
}

function renderLinkedEntity(host: UtilityRenderHost, entity: NormalizedEntity): TemplateResult {
  return html`
    <button class=${`utility-row ${entity.available ? "" : "muted"}`} type="button" @click=${() => fireMoreInfo(host, entity.entityId)}>
      <ha-icon .icon=${entity.icon}></ha-icon>
      <span>
        <strong>${entity.name}</strong>
        <small>${stateText(host.hass, entity.state)}</small>
      </span>
    </button>
  `;
}

function renderImageThumb(host: UtilityRenderHost, item: ImageSource, link: string | undefined): TemplateResult {
  const thumb = html`
    <img src=${item.url} alt=${item.label} loading="lazy" />
    <span>${item.label}</span>
  `;
  if (item.entityId) {
    return html`<button class="image-thumb" type="button" @click=${() => fireMoreInfo(host, item.entityId!)}>${thumb}</button>`;
  }
  if (link) return html`<a class="image-thumb" href=${link} target="_blank" rel="noreferrer">${thumb}</a>`;
  return html`<div class="image-thumb">${thumb}</div>`;
}

type ImageSource = {
  url: string;
  label: string;
  detail: string;
  entityId?: string;
};

function imageSources(hass: HomeAssistant | undefined, entities: NormalizedEntity[], config: UtilityContentConfig, limit: number): ImageSource[] {
  const captions = contentLines(config.content);
  const manual = [...(config.image_url ? [config.image_url] : []), ...(config.image_urls || [])].map((url, index) => imageSourceFromLine(hass, url, index === 0 ? captions[0] : captions[index + 1], index));
  const cameraImages = entities
    .filter((entity) => entity.domain === "camera")
    .map((entity) => ({
      url: `/api/camera_proxy/${entity.entityId}`,
      label: entity.name,
      detail: stateText(hass, entity.state),
      entityId: entity.entityId
    }));
  return [...manual, ...cameraImages].filter((item) => validUrl(item.url)).slice(0, limit);
}

function panelActionEntities(entities: NormalizedEntity[]): NormalizedEntity[] {
  return entities.filter((entity) => ["scene", "script", "automation", "button", "light", "switch", "fan"].includes(entity.domain));
}

function actionGroups(hass: HomeAssistant | undefined, entities: NormalizedEntity[]): Array<{ icon: string; label: string; count: number; entityId?: string }> {
  const groups = [
    { domains: ["scene"], icon: "mdi:movie-open-play", labelKey: "label.action_scenes" },
    { domains: ["script", "automation"], icon: "mdi:script-text-play-outline", labelKey: "label.action_automations" },
    { domains: ["button"], icon: "mdi:gesture-tap-button", labelKey: "label.action_buttons" },
    { domains: ["light", "switch", "fan"], icon: "mdi:toggle-switch-outline", labelKey: "label.action_toggles" }
  ];
  return groups
    .map((group) => {
      const matched = entities.filter((entity) => group.domains.includes(entity.domain));
      return { icon: group.icon, label: localize(hass, group.labelKey as TranslationKey), count: matched.length, entityId: matched[0]?.entityId };
    })
    .filter((group) => group.count > 0);
}

function renderActionGroup(host: UtilityRenderHost, group: { icon: string; label: string; count: number; entityId?: string }): TemplateResult {
  const content = html`<ha-icon .icon=${group.icon}></ha-icon>${group.count} ${group.label}`;
  if (!group.entityId) return html`<span>${content}</span>`;
  return html`
    <button class="panel-action-chip-link" type="button" @click=${() => fireMoreInfo(host, group.entityId!)}>
      ${content}
    </button>
  `;
}

function imageCaption(hass: HomeAssistant | undefined, config: UtilityContentConfig, primary: ImageSource): { title: string; detail: string } {
  const lines = contentLines(config.content);
  return {
    title: lines[0] || primary.label,
    detail: lines[1] || primary.detail || localize(hass, "label.image")
  };
}

function imageSourceFromLine(hass: HomeAssistant | undefined, url: string, title: string | undefined, index: number): ImageSource {
  const [sourceUrl, inlineTitle] = url.split("|").map((item) => item.trim());
  return {
    url: sourceUrl,
    label: inlineTitle || title || (index === 0 ? localize(hass, "label.image") : `${localize(hass, "label.image")} ${index + 1}`),
    detail: sourceUrl
  };
}

type NoteParts = { title: string; body: string[]; lines: string[]; tasks: { done: number; total: number } };

function noteParts(content: string | undefined): NoteParts {
  const lines = contentLines(content);
  const body = lines.slice(1);
  return {
    title: cleanLine(lines[0] || ""),
    body,
    lines,
    tasks: taskStats(body)
  };
}

function contentLines(content: string | undefined): string[] {
  return (content || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function cleanLine(line: string): string {
  return line.replace(/^[-*]\s+/, "").replace(/^\[[ xX]\]\s+/, "").replace(/^[-*]\s+\[[ xX]\]\s+/, "");
}

function lineIcon(line: string): string {
  if (taskState(line) === "done") return "mdi:check-circle";
  if (taskState(line) === "todo") return "mdi:checkbox-blank-circle-outline";
  return "mdi:circle-small";
}

function taskState(line: string): "done" | "todo" | "" {
  if (/^(?:[-*]\s+)?\[[xX]\]\s+/.test(line)) return "done";
  if (/^(?:[-*]\s+)?\[\s\]\s+/.test(line)) return "todo";
  return "";
}

function taskStats(lines: string[]): { done: number; total: number } {
  const states = lines.map(taskState).filter(Boolean);
  return {
    done: states.filter((state) => state === "done").length,
    total: states.length
  };
}

function validUrl(value: string): boolean {
  return /^(https?:\/\/|\/local\/|\/api\/|\/hacsfiles\/)/i.test(value);
}

function empty(host: UtilityRenderHost, key: TranslationKey): TemplateResult {
  return html`<div class="empty">${localize(host.hass, key)}</div>`;
}
