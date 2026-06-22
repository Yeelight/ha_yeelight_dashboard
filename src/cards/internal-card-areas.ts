import { html, nothing, type TemplateResult } from "lit";

import { localize } from "../i18n";
import { areaNativePath, navigateToTarget, type NavigationTarget } from "./actions";
import type { DashboardAreaSummary, HomeAssistant } from "./types";

export function renderStatusGroup(hass: HomeAssistant | undefined, icon: string, label: string, value: number, target?: NavigationTarget): TemplateResult {
  const content = html`
    <ha-icon .icon=${icon}></ha-icon>
    <strong>${value}</strong>
    <span>${label}</span>
  `;
  if (target) {
    return html`
      <button
        class="status-group status-group-link"
        type="button"
        data-view-path=${target.viewPath}
        data-native-path=${target.nativePath || ""}
        aria-label=${`${label} · ${localize(hass, "action.open_view")}`}
        @click=${() => navigateToTarget(target)}
      >
        ${content}
      </button>
    `;
  }
  return html`<div class="status-group">${content}</div>`;
}

export function renderAreaCard(hass: HomeAssistant | undefined, area: DashboardAreaSummary): TemplateResult {
  const progress = area.lightCount ? Math.round((area.activeLightCount / area.lightCount) * 100) : 0;
  const target = areaTarget(area);
  return html`
    <button
      class=${`area-card area-card-link ${area.issueCount ? "warning" : ""}`}
      type="button"
      data-view-path=${target.viewPath}
      data-native-path=${target.nativePath || ""}
      style=${`--area-progress:${progress}%`}
      aria-label=${`${area.name} · ${localize(hass, "action.open_view")}`}
      @click=${() => navigateToTarget(target)}
    >
      <div class="area-card-head">
        <strong>${area.name}</strong>
        ${area.issueCount ? html`<span>${area.issueCount}</span>` : nothing}
      </div>
      <div class="area-card-stats">
        <span>${area.activeLightCount}/${area.lightCount} ${localize(hass, "metric.lights")}</span>
        <span>${area.entityCount} ${localize(hass, "metric.entities")}</span>
      </div>
      <div class="area-progress" aria-hidden="true"><span></span></div>
    </button>
  `;
}

export function renderAreaPill(hass: HomeAssistant | undefined, area: DashboardAreaSummary): TemplateResult {
  const target = areaTarget(area);
  return html`
    <button
      class="area-pill area-pill-link"
      type="button"
      data-view-path=${target.viewPath}
      data-native-path=${target.nativePath || ""}
      aria-label=${`${area.name} · ${localize(hass, "action.open_view")}`}
      @click=${() => navigateToTarget(target)}
    >
      <strong>${area.name}</strong>
      <span>${area.activeLightCount} ${localize(hass, "metric.lights_on")} · ${area.entityCount} ${localize(hass, "metric.entities")}</span>
    </button>
  `;
}

function areaTarget(area: DashboardAreaSummary): NavigationTarget {
  return {
    viewPath: "areas",
    nativePath: area.areaId ? areaNativePath(area.areaId) : "/config/areas/dashboard?historyBack=1"
  };
}
