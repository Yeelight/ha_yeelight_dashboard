import { localize } from "../i18n";
import type { DashboardAreaSummary, DashboardCardKind, DashboardCardSummary, HomeAssistant } from "./types";

export type Metric = { value: number; label: string; tone: "neutral" | "hot" | "ok" | "warn" };

export function iconForKind(kind: DashboardCardKind): string {
  return (
    {
      hero: "mdi:home-lightbulb",
      status: "mdi:view-dashboard-outline",
      notice: "mdi:bell-badge-outline",
      light: "mdi:lightbulb-group",
      rooms: "mdi:floor-plan",
      room: "mdi:home-variant",
      devices: "mdi:devices",
      routines: "mdi:movie-open-play",
      environment: "mdi:home-thermometer-outline",
      ecosystem: "mdi:lan-connect",
      health: "mdi:heart-pulse"
    }[kind] ?? "mdi:view-dashboard"
  );
}

export function metricsFor(hass: HomeAssistant | undefined, kind: DashboardCardKind, summary: DashboardCardSummary, areas: DashboardAreaSummary[]): Metric[] {
  const areaIssues = areas.reduce((count, area) => count + area.issueCount, 0);
  const totalAreaEntities = areas.reduce((count, area) => count + area.entityCount, 0);
  if (kind === "health" || kind === "notice") {
    if (kind === "notice") {
      return [
        { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "ok" },
        { value: summary.unavailable.length, label: localize(hass, "metric.unavailable"), tone: summary.unavailable.length ? "warn" : "neutral" },
        { value: summary.updates.length, label: localize(hass, "metric.updates"), tone: summary.updates.length ? "warn" : "neutral" }
      ];
    }
    return [
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "ok" },
      { value: summary.unknown.length, label: localize(hass, "metric.unknown"), tone: "neutral" },
      { value: summary.entities.length, label: localize(hass, "metric.entities"), tone: "neutral" }
    ];
  }
  if (kind === "status") {
    return [
      { value: summary.activeLights.length, label: localize(hass, "metric.lights_on"), tone: "hot" },
      { value: summary.online.length, label: localize(hass, "metric.online"), tone: "ok" },
      { value: summary.unavailable.length, label: localize(hass, "metric.unavailable"), tone: summary.unavailable.length ? "warn" : "neutral" }
    ];
  }
  if (kind === "ecosystem") {
    return [
      { value: summary.entities.length, label: localize(hass, "metric.entities"), tone: "neutral" },
      { value: areas.length, label: localize(hass, "metric.rooms"), tone: "ok" },
      { value: summary.controllable.length, label: localize(hass, "metric.controls"), tone: "hot" },
      { value: areaIssues || summary.issues.length, label: localize(hass, "metric.issues"), tone: areaIssues || summary.issues.length ? "warn" : "neutral" }
    ];
  }
  if (kind === "devices") {
    return [
      { value: summary.entities.length, label: localize(hass, "metric.devices"), tone: "neutral" },
      { value: summary.controllable.length, label: localize(hass, "metric.controls"), tone: "ok" },
      { value: summary.online.length, label: localize(hass, "metric.online"), tone: "hot" },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "neutral" }
    ];
  }
  if (kind === "environment") {
    return [
      { value: summary.entities.filter((entity) => entity.domain === "climate").length, label: localize(hass, "metric.climate"), tone: "hot" },
      { value: summary.entities.filter((entity) => entity.domain === "sensor").length, label: localize(hass, "metric.sensors"), tone: "neutral" },
      { value: summary.controllable.length, label: localize(hass, "metric.controls"), tone: "ok" },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "neutral" }
    ];
  }
  if (kind === "rooms" || kind === "room") {
    return [
      { value: areas.length, label: localize(hass, "metric.rooms"), tone: "neutral" },
      { value: totalAreaEntities || summary.entities.length, label: localize(hass, "metric.entities"), tone: "ok" },
      { value: areaIssues || summary.issues.length, label: localize(hass, "metric.issues"), tone: areaIssues || summary.issues.length ? "warn" : "neutral" }
    ];
  }
  if (kind === "routines") {
    return [
      { value: summary.routines.length, label: localize(hass, "metric.routines"), tone: "ok" },
      { value: summary.entities.filter((entity) => entity.domain === "scene").length, label: localize(hass, "metric.scenes"), tone: "neutral" },
      { value: summary.entities.filter((entity) => entity.domain === "button").length, label: localize(hass, "action.press"), tone: "neutral" }
    ];
  }
  if (kind === "hero") {
    return [
      { value: summary.entities.length, label: localize(hass, "metric.entities"), tone: "neutral" },
      { value: summary.activeLights.length, label: localize(hass, "metric.lights_on"), tone: "hot" },
      { value: areas.length, label: localize(hass, "metric.rooms"), tone: "ok" },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "neutral" }
    ];
  }
  return [
    { value: summary.activeLights.length, label: localize(hass, "metric.lights_on"), tone: "hot" },
    { value: summary.lights.length, label: localize(hass, "metric.lights"), tone: "neutral" },
    { value: summary.controllable.length, label: localize(hass, "metric.controls"), tone: "ok" }
  ];
}
