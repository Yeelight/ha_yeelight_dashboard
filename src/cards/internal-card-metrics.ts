import { html, type TemplateResult } from "lit";

import { localize } from "../i18n";
import { fireMoreInfo, navigateToTarget } from "./actions";
import type { Metric } from "./card-meta";
import type { HomeAssistant } from "./types";

const metricCursorByHost = new WeakMap<HTMLElement, Map<string, number>>();

export function renderMetric(host: HTMLElement, hass: HomeAssistant | undefined, metric: Metric): TemplateResult {
  const entities = [...new Set(metric.entities || [])];
  const entityId = entities[0];
  const action = metric.action || (entityId ? { type: "more-info" as const } : undefined);
  const hint = metricHint(hass, metric, entities.length);
  const content = html`<strong>${metric.value}</strong><span>${metric.label}</span>${hint ? html`<small>${hint}</small>` : ""}`;
  if (action?.type === "navigate") {
    return html`
      <button
        class=${`metric metric-link ${metric.tone}`}
        type="button"
        data-view-path=${action.viewPath}
        data-native-path=${action.nativePath || ""}
        aria-label=${`${metric.label} · ${localize(hass, "action.open_view")}`}
        @click=${() => navigateToTarget(action)}
      >
        ${content}
      </button>
    `;
  }
  if (!entityId) return html`<div class=${`metric ${metric.tone}`}>${content}</div>`;
  return html`
    <button
      class=${`metric metric-link ${metric.tone}`}
      type="button"
      data-entity-id=${entityId}
      aria-label=${`${metric.label} · ${localize(hass, "action.more_info")}`}
      @click=${() => fireMoreInfo(host, nextMetricEntity(host, metric.label, entities))}
    >
      ${content}
    </button>
  `;
}

function nextMetricEntity(host: HTMLElement, label: string, entities: string[]): string {
  if (entities.length <= 1) return entities[0];
  let cursors = metricCursorByHost.get(host);
  if (!cursors) {
    cursors = new Map();
    metricCursorByHost.set(host, cursors);
  }
  const key = `${label}:${entities.join("|")}`;
  const index = cursors.get(key) || 0;
  cursors.set(key, (index + 1) % entities.length);
  return entities[index];
}

function metricHint(hass: HomeAssistant | undefined, metric: Metric, count: number): string {
  if (metric.action?.type === "navigate") return "";
  return count > 1 ? localize(hass, "label.metric_details_count", { count }) : localize(hass, "action.more_info");
}
