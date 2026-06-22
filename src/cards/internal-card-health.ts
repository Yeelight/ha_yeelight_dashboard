import { html, nothing, type TemplateResult } from "lit";

import { localize, stateText, type TranslationKey } from "../i18n";
import type { DashboardCardSummary, HomeAssistant, NormalizedEntity } from "./types";

type HealthRenderHost = HTMLElement & { hass?: HomeAssistant };

type HealthGroup = {
  key: string;
  icon: string;
  labelKey: TranslationKey;
  entities: NormalizedEntity[];
  tone: "ok" | "warn" | "neutral";
};

export function renderHealthBoard(
  host: HealthRenderHost,
  summary: DashboardCardSummary,
  subtype: string | undefined,
  limit: number,
  renderEntityRow: (entity: NormalizedEntity) => TemplateResult
): TemplateResult {
  const focus = healthFocusEntities(summary, subtype).slice(0, Math.max(1, limit));
  const groups = visibleHealthGroups(healthGroups(summary), subtype);
  if (!focus.length && !summary.entities.length) return renderHealthyState(host);
  return html`
    <div class="health-board">
      ${renderHealthHero(host, summary)}
      ${groups.some((group) => group.entities.length)
        ? html`<div class="health-groups">${groups.filter((group) => group.entities.length).map((group) => renderHealthGroup(host, group))}</div>`
        : nothing}
      ${focus.length
        ? html`
            <div class="section-label">${localize(host.hass, healthFocusLabel(subtype))}</div>
            <div class="entity-list compact health-focus-list">${focus.map(renderEntityRow)}</div>
          `
        : nothing}
    </div>
  `;
}

function renderHealthHero(host: HealthRenderHost, summary: DashboardCardSummary): TemplateResult {
  const issueCount = summary.issues.length;
  const tone = issueCount ? "warn" : "ok";
  return html`
    <div class=${`health-hero ${tone}`}>
      <ha-icon .icon=${issueCount ? "mdi:alert-circle-outline" : "mdi:check-circle-outline"}></ha-icon>
      <span>
        <strong>${issueCount ? localize(host.hass, "label.health_attention") : localize(host.hass, "label.health_ready")}</strong>
        <small>${summary.online.length} ${localize(host.hass, "metric.online")} · ${summary.updates.length} ${localize(host.hass, "metric.updates")}</small>
      </span>
    </div>
  `;
}

function renderHealthyState(host: HealthRenderHost): TemplateResult {
  return html`
    <div class="health-board">
      <div class="health-ok">
        <ha-icon icon="mdi:check-circle-outline"></ha-icon>
        <span>${localize(host.hass, "empty.no_issues")}</span>
      </div>
    </div>
  `;
}

function renderHealthGroup(host: HealthRenderHost, group: HealthGroup): TemplateResult {
  return html`
    <div class=${`health-group ${group.tone}`}>
      <ha-icon .icon=${group.icon}></ha-icon>
      <span>
        <strong>${group.entities.length}</strong>
        <small>${localize(host.hass, group.labelKey)}</small>
      </span>
      ${group.entities[0] ? html`<em>${group.entities[0].name} · ${stateText(host.hass, group.entities[0].state)}</em>` : nothing}
    </div>
  `;
}

function healthGroups(summary: DashboardCardSummary): HealthGroup[] {
  return [
    { key: "issues", icon: "mdi:alert-circle-outline", labelKey: "label.issue_list", entities: summary.issues, tone: summary.issues.length ? "warn" : "ok" },
    { key: "updates", icon: "mdi:update", labelKey: "label.updates_focus", entities: summary.entities.filter((entity) => entity.domain === "update"), tone: "neutral" },
    { key: "network", icon: "mdi:lan", labelKey: "label.network_focus", entities: networkEntities(summary.entities), tone: "neutral" },
    { key: "events", icon: "mdi:calendar-alert", labelKey: "label.events_focus", entities: eventEntities(summary.entities), tone: "neutral" }
  ];
}

function visibleHealthGroups(groups: HealthGroup[], subtype: string | undefined): HealthGroup[] {
  if (subtype === "updates") return groups.filter((group) => group.key === "issues" || group.key === "updates");
  if (subtype === "repairs-backup") return groups.filter((group) => group.key === "issues");
  if (subtype === "network") return groups.filter((group) => group.key === "network");
  if (subtype === "events") return groups.filter((group) => group.key === "events");
  if (subtype === "history") return [];
  return groups;
}

function healthFocusEntities(summary: DashboardCardSummary, subtype: string | undefined): NormalizedEntity[] {
  if (subtype === "updates") return summary.entities.filter((entity) => entity.domain === "update");
  if (subtype === "repairs-backup") return uniqueEntities([...summary.issues, ...summary.entities.filter((entity) => hasEntityText(entity, /\b(repair|backup|problem|issue|restore|修复|备份)\b/i))]);
  if (subtype === "network") return networkEntities(summary.entities);
  if (subtype === "events") return eventEntities(summary.entities);
  if (subtype === "history") return summary.entities.filter((entity) => entity.domain === "sensor");
  return summary.issues.length ? summary.issues : uniqueEntities([...summary.updates, ...summary.unknown]);
}

function healthFocusLabel(subtype: string | undefined): TranslationKey {
  if (subtype === "updates") return "label.updates_focus";
  if (subtype === "repairs-backup") return "label.repairs_focus";
  if (subtype === "network") return "label.network_focus";
  if (subtype === "events") return "label.events_focus";
  if (subtype === "history") return "label.history_focus";
  return "label.issue_list";
}

function networkEntities(entities: NormalizedEntity[]): NormalizedEntity[] {
  return entities.filter((entity) => hasEntityText(entity, /\b(router|gateway|network|wan|lan|wifi|zigbee|thread|matter|iot|路由|网关|网络)\b/i));
}

function eventEntities(entities: NormalizedEntity[]): NormalizedEntity[] {
  return entities.filter((entity) => ["event", "calendar", "todo"].includes(entity.domain));
}

function uniqueEntities(entities: NormalizedEntity[]): NormalizedEntity[] {
  const seen = new Set<string>();
  return entities.filter((entity) => {
    if (seen.has(entity.entityId)) return false;
    seen.add(entity.entityId);
    return true;
  });
}

function hasEntityText(entity: NormalizedEntity, pattern: RegExp): boolean {
  return pattern.test(`${entity.name} ${entity.entityId} ${entity.state} ${String(entity.attributes.device_class || "")}`);
}
