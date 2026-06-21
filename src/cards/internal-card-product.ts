import { html, nothing, type TemplateResult } from "lit";

import { localize, stateText } from "../i18n";
import { actionFor, actionLabel, fireMoreInfo, type EntityAction } from "./actions";
import type { DashboardAreaSummary, DashboardCardSummary, HomeAssistant, NormalizedEntity } from "./types";

export type ProductRenderHost = HTMLElement & {
  hass?: HomeAssistant;
  runEntityAction(entity: NormalizedEntity, action: EntityAction): Promise<void>;
};

export function renderDevicesBoard(
  host: ProductRenderHost,
  summary: DashboardCardSummary,
  areas: DashboardAreaSummary[],
  limit: number,
  showActions: boolean,
  renderAreaPill: (area: DashboardAreaSummary) => TemplateResult
): TemplateResult {
  const devices = [
    ...summary.controllable,
    ...summary.entities.filter((entity) => !summary.controllable.includes(entity) && !summary.routines.includes(entity))
  ].slice(0, limit);
  if (!devices.length && !areas.length) return html`<div class="empty">${localize(host.hass, "empty.no_entities")}</div>`;
  return html`
    <div class="devices-board">
      ${areas.length ? html`<div class="area-strip compact-strip">${areas.slice(0, 3).map(renderAreaPill)}</div>` : nothing}
      ${devices.length ? html`<div class="entity-list compact">${devices.map((entity) => renderDeviceRow(host, entity, showActions))}</div>` : nothing}
    </div>
  `;
}

export function renderRoutinesBoard(
  host: ProductRenderHost,
  summary: DashboardCardSummary,
  limit: number,
  showActions: boolean,
  renderActionTile: (entity: NormalizedEntity) => TemplateResult
): TemplateResult {
  if (!summary.routines.length) return html`<div class="empty">${localize(host.hass, "empty.no_routines")}</div>`;
  return html`
    <div class="section-label">${localize(host.hass, "label.quick_actions")}</div>
    <div class="routine-board">
      <div class="routine-feature">${renderRoutineFeature(host, summary.routines[0], showActions)}</div>
      <div class="quick-grid routine-grid">${summary.routines.slice(1, limit).map(renderActionTile)}</div>
    </div>
  `;
}

export function renderEnvironmentBoard(host: ProductRenderHost, summary: DashboardCardSummary, limit: number): TemplateResult {
  const climate = summary.entities.filter((entity) => ["weather", "climate", "fan", "humidifier"].includes(entity.domain));
  const sensors = summary.entities.filter((entity) => ["sensor", "binary_sensor"].includes(entity.domain));
  const primary = [...climate, ...sensors].slice(0, limit);
  if (!primary.length) return html`<div class="empty">${localize(host.hass, "empty.no_environment")}</div>`;
  return html`
    <div class="environment-board">
      <div class="environment-feature">${renderEnvironmentFeature(host.hass, primary[0])}</div>
      <div class="environment-grid">${primary.slice(1, 5).map((entity) => renderEnvironmentStat(host.hass, entity))}</div>
    </div>
  `;
}

function renderRoutineFeature(host: ProductRenderHost, entity: NormalizedEntity, showActions: boolean): TemplateResult {
  const action = showActions ? actionFor(entity) : "";
  return html`
    <button class="routine-hero-action" ?disabled=${!action || !entity.available || entity.readOnly} @click=${() => action && host.runEntityAction(entity, action)}>
      <ha-icon .icon=${entity.icon}></ha-icon>
      <span>${localize(host.hass, "label.featured_scene")}</span>
      <strong>${entity.name}</strong>
      <small>${action ? actionLabel(host.hass, entity, action) : stateText(host.hass, entity.state)}</small>
    </button>
  `;
}

function renderDeviceRow(host: ProductRenderHost, entity: NormalizedEntity, showActions: boolean): TemplateResult {
  const action = showActions ? actionFor(entity) : "";
  return html`
    <div class=${`device-row ${entity.available ? "" : "muted"}`}>
      <button class="icon-button" aria-label=${localize(host.hass, "action.more_info")} @click=${() => fireMoreInfo(host, entity.entityId)}>
        <ha-icon .icon=${entity.icon}></ha-icon>
      </button>
      <div class="entity-text">
        <strong>${entity.name}</strong>
        <span>${entity.domain} · ${stateText(host.hass, entity.state)}</span>
      </div>
      ${action
        ? html`<button class="text-action" ?disabled=${!entity.available || entity.readOnly} @click=${() => host.runEntityAction(entity, action)}>${actionLabel(host.hass, entity, action)}</button>`
        : nothing}
    </div>
  `;
}

function renderEnvironmentFeature(hass: HomeAssistant | undefined, entity: NormalizedEntity): TemplateResult {
  return html`
    <div class="environment-primary">
      <ha-icon .icon=${entity.icon}></ha-icon>
      <div>
        <span>${localize(hass, "label.primary_environment")}</span>
        <strong>${entity.name}</strong>
        <small>${stateText(hass, entity.state)}</small>
      </div>
    </div>
  `;
}

function renderEnvironmentStat(hass: HomeAssistant | undefined, entity: NormalizedEntity): TemplateResult {
  return html`
    <div class=${`environment-stat ${entity.available ? "" : "muted"}`}>
      <ha-icon .icon=${entity.icon}></ha-icon>
      <strong>${stateText(hass, entity.state)}</strong>
      <span>${entity.name}</span>
    </div>
  `;
}
