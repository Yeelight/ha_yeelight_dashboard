import { html, nothing, type TemplateResult } from "lit";

import { localize, stateText, type TranslationKey } from "../i18n";
import { actionFor, actionLabel, fireMoreInfo, type EntityAction } from "./actions";
import { preferMeaningfulEntities } from "./entity-priority";
import type { DashboardCardSummary, HomeAssistant, NormalizedEntity } from "./types";

export type OperationsRenderHost = HTMLElement & {
  hass?: HomeAssistant;
  runEntityAction(entity: NormalizedEntity, action: EntityAction): Promise<void>;
};

export function renderPowerBoard(host: OperationsRenderHost, summary: DashboardCardSummary, subtype: string | undefined, limit: number, showActions: boolean): TemplateResult {
  const entities = powerEntities(summary.entities, subtype).slice(0, limit);
  if (!entities.length) return empty(host, "empty.no_power");
  const primary = entities[0];
  const action = showActions ? actionFor(primary) : "";
  const load = loadSnapshot(host, entities);
  return html`
    <div class=${`ops-board power-board subtype-${subtype || "socket"}`}>
      <div class="ops-feature power-feature">
        <button class="ops-main" type="button" @click=${() => fireMoreInfo(host, primary.entityId)}>
          <span class="ops-icon"><ha-icon .icon=${primary.icon}></ha-icon></span>
          <span class="ops-copy">
            <small>${localize(host.hass, subtype === "electricity" ? "label.electricity_focus" : "label.socket_focus")}</small>
            <strong>${primary.name}</strong>
            <span>${readingText(host.hass, primary)}</span>
          </span>
        </button>
        ${action
          ? html`<button class="ops-action" type="button" ?disabled=${!primary.available || primary.readOnly} @click=${() => host.runEntityAction(primary, action)}>
              ${actionLabel(host.hass, primary, action)}
            </button>`
          : nothing}
      </div>
      ${load.length ? html`<div class="ops-insights">${load.map((item) => renderInsight(host, item))}</div>` : nothing}
      <div class="ops-grid">${entities.slice(1, limit).map((entity) => renderOpsReading(host, entity))}</div>
    </div>
  `;
}

export function renderEnergyBoard(host: OperationsRenderHost, summary: DashboardCardSummary, subtype: string | undefined, limit: number): TemplateResult {
  const entities = preferMeaningfulEntities(energyEntities(summary.entities)).slice(0, limit);
  if (!entities.length) return empty(host, "empty.no_energy");
  const primary = entities[0];
  const insights = energyInsights(host, entities);
  return html`
    <div class=${`ops-board energy-board subtype-${subtype || "summary"}`}>
      <button class="ops-feature energy-feature" type="button" @click=${() => fireMoreInfo(host, primary.entityId)}>
        <span class="ops-icon"><ha-icon .icon=${primary.icon}></ha-icon></span>
        <span class="ops-copy">
          <small>${localize(host.hass, subtype === "insights" ? "label.energy_insights" : "label.energy_focus")}</small>
          <strong>${primary.name}</strong>
          <span>${readingText(host.hass, primary)}</span>
        </span>
      </button>
      ${insights.length ? html`<div class="ops-insights energy-insights">${insights.map((item) => renderInsight(host, item))}</div>` : nothing}
      <div class="ops-grid">${entities.slice(1, limit).map((entity) => renderOpsReading(host, entity))}</div>
    </div>
  `;
}

export function renderInfrastructureBoard(host: OperationsRenderHost, summary: DashboardCardSummary, subtype: string | undefined, limit: number): TemplateResult {
  const entities = preferMeaningfulEntities(infrastructureEntities(summary.entities, subtype)).slice(0, limit);
  if (!entities.length) return empty(host, "empty.no_infrastructure");
  const primary = entities[0];
  const groups = infrastructureGroups(host, entities);
  return html`
    <div class=${`ops-board infrastructure-board subtype-${subtype || "server"}`}>
      <button class="ops-feature infrastructure-feature" type="button" @click=${() => fireMoreInfo(host, primary.entityId)}>
        <span class="ops-icon"><ha-icon .icon=${primary.icon}></ha-icon></span>
        <span class="ops-copy">
          <small>${infrastructureLabel(host.hass, subtype)}</small>
          <strong>${primary.name}</strong>
          <span>${readingText(host.hass, primary)}</span>
        </span>
      </button>
      <div class="ops-insights infrastructure-insights">${groups.map((item) => renderInsight(host, item))}</div>
      <div class="ops-grid">${entities.slice(1, limit).map((entity) => renderOpsReading(host, entity))}</div>
    </div>
  `;
}

type Insight = {
  icon: string;
  label: string;
  value: string | number;
  tone?: "ok" | "warn";
  entityId?: string;
};

function renderInsight(host: OperationsRenderHost, item: Insight): TemplateResult {
  const content = html`
    <ha-icon .icon=${item.icon}></ha-icon>
    <strong>${item.value}</strong>
    <small>${item.label}</small>
  `;
  if (!item.entityId) return html`<span class=${item.tone || ""}>${content}</span>`;
  return html`
    <button class=${`ops-insight-link ${item.tone || ""}`} type="button" @click=${() => fireMoreInfo(host, item.entityId!)}>
      ${content}
    </button>
  `;
}

function renderOpsReading(host: OperationsRenderHost, entity: NormalizedEntity): TemplateResult {
  return html`
    <button class=${`ops-reading ${entity.available ? "" : "muted"}`} type="button" @click=${() => fireMoreInfo(host, entity.entityId)}>
      <ha-icon .icon=${entity.icon}></ha-icon>
      <strong>${readingValue(host.hass, entity)}</strong>
      <span>${entity.name}</span>
    </button>
  `;
}

function powerEntities(entities: NormalizedEntity[], subtype: string | undefined): NormalizedEntity[] {
  if (subtype === "electricity") return preferMeaningfulEntities(entities.filter((entity) => entity.domain === "sensor"));
  return [...preferMeaningfulEntities(entities.filter((entity) => entity.domain === "switch")), ...preferMeaningfulEntities(entities.filter((entity) => entity.domain === "sensor"))];
}

function energyEntities(entities: NormalizedEntity[]): NormalizedEntity[] {
  return entities.filter((entity) => entity.domain === "sensor");
}

function infrastructureEntities(entities: NormalizedEntity[], subtype: string | undefined): NormalizedEntity[] {
  const text = (entity: NormalizedEntity) => `${entity.name} ${entity.entityId}`;
  if (subtype === "router") return entities.filter((entity) => /\b(router|gateway|wan|lan|wifi|network)\b/i.test(text(entity)));
  if (subtype === "nas") return entities.filter((entity) => /\b(nas|synology|qnap|storage|disk)\b/i.test(text(entity)));
  if (subtype === "pve" || subtype === "pve-list") return entities.filter((entity) => /\b(pve|proxmox|vm|lxc)\b/i.test(text(entity)));
  if (subtype === "server" || subtype === "server-list") return entities.filter((entity) => /\b(server|host|cpu|memory|disk|uptime)\b/i.test(text(entity)));
  return entities;
}

function loadSnapshot(host: OperationsRenderHost, entities: NormalizedEntity[]): Insight[] {
  const sensors = entities.filter((entity) => entity.domain === "sensor");
  return [
    bestSensor(host, sensors, /\b(power|watt|功率)\b/i, "mdi:flash", "label.power_now"),
    bestSensor(host, sensors, /\b(voltage|volt|电压)\b/i, "mdi:sine-wave", "label.voltage"),
    bestSensor(host, sensors, /\b(current|amp|电流)\b/i, "mdi:current-ac", "label.current")
  ].filter((item): item is Insight => !!item);
}

function energyInsights(host: OperationsRenderHost, entities: NormalizedEntity[]): Insight[] {
  return [
    bestSensor(host, entities, /\b(energy|kwh|电量|能耗)\b/i, "mdi:counter", "label.energy_total"),
    bestSensor(host, entities, /\b(solar|pv|光伏|太阳能)\b/i, "mdi:solar-power-variant", "label.solar"),
    bestSensor(host, entities, /\b(grid|utility|meter|电网)\b/i, "mdi:transmission-tower", "label.grid")
  ].filter((item): item is Insight => !!item);
}

function infrastructureGroups(host: OperationsRenderHost, entities: NormalizedEntity[]): Insight[] {
  const issues = entities.filter((entity) => !entity.available || entity.state === "unavailable" || entity.state === "unknown");
  return [
    { icon: "mdi:server", label: localize(host.hass, "metric.nodes"), value: entities.length, entityId: entities[0]?.entityId },
    { icon: "mdi:check-network-outline", label: localize(host.hass, "metric.online"), value: entities.filter((entity) => entity.available).length, tone: "ok", entityId: entities.find((entity) => entity.available)?.entityId },
    { icon: "mdi:alert-circle-outline", label: localize(host.hass, "metric.issues"), value: issues.length, tone: issues.length ? "warn" : undefined, entityId: issues[0]?.entityId }
  ];
}

function bestSensor(host: OperationsRenderHost, entities: NormalizedEntity[], pattern: RegExp, icon: string, labelKey: TranslationKey): Insight | undefined {
  const entity = entities.find((item) => item.domain === "sensor" && pattern.test(`${item.name} ${item.entityId} ${item.attributes.device_class || ""} ${item.attributes.unit_of_measurement || ""}`));
  return entity ? { icon, label: localize(host.hass, labelKey), value: readingValue(host.hass, entity), tone: entity.available ? undefined : "warn", entityId: entity.entityId } : undefined;
}

function readingText(hass: HomeAssistant | undefined, entity: NormalizedEntity): string {
  if (entity.domain === "sensor") return readingValue(hass, entity);
  return stateText(hass, entity.state);
}

function readingValue(hass: HomeAssistant | undefined, entity: NormalizedEntity): string {
  const unit = typeof entity.attributes.unit_of_measurement === "string" ? entity.attributes.unit_of_measurement : "";
  if (entity.state === "unknown" || entity.state === "unavailable") return stateText(hass, entity.state);
  return entity.domain === "sensor" && unit ? `${entity.state}${unit}` : stateText(hass, entity.state);
}

function infrastructureLabel(hass: HomeAssistant | undefined, subtype: string | undefined): string {
  const key = subtype === "router" ? "label.network_focus" : subtype === "nas" ? "label.storage_focus" : subtype === "pve" || subtype === "pve-list" ? "label.pve_focus" : "label.infrastructure_focus";
  return localize(hass, key);
}

function empty(host: OperationsRenderHost, key: TranslationKey): TemplateResult {
  return html`<div class="empty">${localize(host.hass, key)}</div>`;
}
