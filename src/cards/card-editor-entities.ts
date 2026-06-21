import { html, type TemplateResult } from "lit";

import { localize } from "../i18n";
import type { EntityOption } from "./entity-picker";
import type { HomeAssistant } from "./types";

type SelectedEntityHandlers = {
  onClear: () => void;
  onCleanMissing: () => void;
  onDragStart: (event: DragEvent, entityId: string) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent) => void;
  onDrop: (event: DragEvent, entityId: string) => void;
  onMove: (entityId: string, direction: -1 | 1) => void;
  onRemove: (entityId: string) => void;
  onSortRecommended: () => void;
};

type SelectedEntityRenderOptions = {
  expanded: boolean;
  visibleLimit: number;
  onToggleExpanded: () => void;
};

export function renderSelectedEntities(
  hass: HomeAssistant | undefined,
  entities: string[],
  options: EntityOption[],
  draggingEntityId: string | undefined,
  handlers: SelectedEntityHandlers,
  renderOptions: SelectedEntityRenderOptions
): TemplateResult {
  const optionMap = new Map(options.map((option) => [option.entityId, option]));
  const missingEntities = entities.filter((entityId) => !optionMap.has(entityId));
  const visibleEntities = renderOptions.expanded ? entities : entities.slice(0, renderOptions.visibleLimit);
  const hiddenCount = Math.max(0, entities.length - visibleEntities.length);
  return html`
    <div class="entity-list" aria-label=${localize(hass, "editor.entity_selected")}>
      <div class="entity-list-header">
        <span>${localize(hass, "editor.entity_selected_summary", { count: entities.length })}</span>
        <div class="entity-list-actions">
          <button type="button" ?disabled=${entities.length < 2} @click=${handlers.onSortRecommended}>${localize(hass, "editor.entity_sort_recommended")}</button>
          <button type="button" ?disabled=${!missingEntities.length} @click=${handlers.onCleanMissing}>${localize(hass, "editor.entity_clean_missing")}</button>
          <button type="button" ?disabled=${!entities.length} @click=${handlers.onClear}>${localize(hass, "editor.entity_clear")}</button>
        </div>
      </div>
      ${missingEntities.length
        ? html`<span class="hint warning">${localize(hass, "editor.entity_missing_hint", { count: missingEntities.length })}</span>`
        : ""}
      ${entities.length
        ? html`
            ${visibleEntities.map((entityId) => renderSelectedEntityRow(hass, entities, optionMap, draggingEntityId, handlers, entityId))}
            ${hiddenCount
              ? html`
                  <button class="entity-expand" type="button" @click=${renderOptions.onToggleExpanded}>
                    ${localize(hass, "editor.entity_show_more", { count: hiddenCount })}
                  </button>
                `
              : entities.length > renderOptions.visibleLimit
                ? html`
                    <button class="entity-expand" type="button" @click=${renderOptions.onToggleExpanded}>
                      ${localize(hass, "editor.entity_show_less")}
                    </button>
                  `
                : ""}
          `
        : html`<span class="hint">${localize(hass, "editor.entity_empty")}</span>`}
    </div>
  `;
}

function renderSelectedEntityRow(
  hass: HomeAssistant | undefined,
  entities: string[],
  optionMap: Map<string, EntityOption>,
  draggingEntityId: string | undefined,
  handlers: SelectedEntityHandlers,
  entityId: string
): TemplateResult {
  const option = optionMap.get(entityId);
  const index = entities.indexOf(entityId);
  return html`
    <div
      class=${`entity-row ${draggingEntityId === entityId ? "dragging" : ""} ${option ? "" : "missing"}`}
      data-entity-id=${entityId}
      @dragover=${handlers.onDragOver}
      @drop=${(event: DragEvent) => handlers.onDrop(event, entityId)}
    >
      <button
        class="drag-button"
        type="button"
        draggable="true"
        aria-label=${localize(hass, "editor.entity_drag")}
        title=${localize(hass, "editor.entity_drag")}
        @dragstart=${(event: DragEvent) => handlers.onDragStart(event, entityId)}
        @dragend=${handlers.onDragEnd}
      >
        <ha-icon icon="mdi:drag"></ha-icon>
      </button>
      <div>
        <strong>${option?.name || entityId}</strong>
        <small>${option ? entityId : localize(hass, "editor.entity_missing")}</small>
      </div>
      <div class="entity-actions">
        <button type="button" ?disabled=${index === 0} @click=${() => handlers.onMove(entityId, -1)}>${localize(hass, "editor.entity_move_up")}</button>
        <button type="button" ?disabled=${index === entities.length - 1} @click=${() => handlers.onMove(entityId, 1)}>${localize(hass, "editor.entity_move_down")}</button>
        <button class="remove-button" type="button" @click=${() => handlers.onRemove(entityId)}>${localize(hass, "editor.entity_remove")}</button>
      </div>
    </div>
  `;
}
