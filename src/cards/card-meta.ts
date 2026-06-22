import { localize } from "../i18n";
import type { DashboardAreaSummary, DashboardCardKind, DashboardCardSummary, HomeAssistant } from "./types";
import type { NavigationTarget } from "./actions";

export type MetricViewPath = "lighting" | "areas" | "scenes" | "environment" | "media" | "health";
export type MetricAction = ({ type: "navigate" } & NavigationTarget) | { type: "more-info" };
export type Metric = { value: number; label: string; tone: "neutral" | "hot" | "ok" | "warn"; entities?: string[]; action?: MetricAction };

const NAVIGATE: Record<MetricViewPath, { type: "navigate" } & NavigationTarget> = {
  lighting: { type: "navigate", viewPath: "lighting", nativePath: "/light?historyBack=1" },
  areas: { type: "navigate", viewPath: "areas", nativePath: "/config/areas/dashboard?historyBack=1" },
  scenes: { type: "navigate", viewPath: "scenes", nativePath: "/config/scene/dashboard?historyBack=1" },
  environment: { type: "navigate", viewPath: "environment", nativePath: "/history?historyBack=1" },
  media: { type: "navigate", viewPath: "media", nativePath: "/media-browser?historyBack=1" },
  health: { type: "navigate", viewPath: "health", nativePath: "/config/repairs?historyBack=1" }
};

const ENTITIES_NAVIGATE: MetricAction = { type: "navigate", viewPath: "areas", nativePath: "/config/entities?historyBack=1" };
const SECURITY_NAVIGATE: MetricAction = { type: "navigate", viewPath: "health", nativePath: "/security?historyBack=1" };
const PEOPLE_NAVIGATE: MetricAction = { type: "navigate", viewPath: "health", nativePath: "/map?historyBack=1" };

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
      climate: "mdi:thermostat-auto",
      air: "mdi:air-filter",
      water: "mdi:water-pump",
      power: "mdi:power-plug",
      energy: "mdi:transmission-tower",
      infrastructure: "mdi:server-network",
      media: "mdi:play-box-multiple-outline",
      camera: "mdi:cctv",
      cameraWall: "mdi:view-grid-outline",
      security: "mdi:shield-home-outline",
      presence: "mdi:account-location-outline",
      panelActions: "mdi:view-dashboard-edit-outline",
      image: "mdi:image-multiple-outline",
      note: "mdi:note-text-outline",
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
        { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "ok", entities: ids(summary.issues), action: NAVIGATE.health },
        { value: summary.unavailable.length, label: localize(hass, "metric.unavailable"), tone: summary.unavailable.length ? "warn" : "neutral", entities: ids(summary.unavailable), action: NAVIGATE.health },
        { value: summary.updates.length, label: localize(hass, "metric.updates"), tone: summary.updates.length ? "warn" : "neutral", entities: ids(summary.updates), action: NAVIGATE.health }
      ];
    }
    return [
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "ok", entities: ids(summary.issues), action: NAVIGATE.health },
      { value: summary.unknown.length, label: localize(hass, "metric.unknown"), tone: "neutral", entities: ids(summary.unknown), action: NAVIGATE.health },
      { value: summary.entities.length, label: localize(hass, "metric.entities"), tone: "neutral", entities: ids(summary.entities), action: ENTITIES_NAVIGATE }
    ];
  }
  if (kind === "status") {
    return [
      { value: summary.activeLights.length, label: localize(hass, "metric.lights_on"), tone: "hot", entities: ids(summary.activeLights), action: NAVIGATE.lighting },
      { value: summary.online.length, label: localize(hass, "metric.online"), tone: "ok", entities: ids(summary.online), action: ENTITIES_NAVIGATE },
      { value: summary.unavailable.length, label: localize(hass, "metric.unavailable"), tone: summary.unavailable.length ? "warn" : "neutral", entities: ids(summary.unavailable), action: NAVIGATE.health }
    ];
  }
  if (kind === "ecosystem") {
    return [
      { value: summary.entities.length, label: localize(hass, "metric.entities"), tone: "neutral", entities: ids(summary.entities), action: ENTITIES_NAVIGATE },
      { value: areas.length, label: localize(hass, "metric.rooms"), tone: "ok", action: NAVIGATE.areas },
      { value: summary.controllable.length, label: localize(hass, "metric.controls"), tone: "hot", entities: ids(summary.controllable), action: ENTITIES_NAVIGATE },
      { value: areaIssues || summary.issues.length, label: localize(hass, "metric.issues"), tone: areaIssues || summary.issues.length ? "warn" : "neutral", entities: ids(summary.issues), action: NAVIGATE.health }
    ];
  }
  if (kind === "devices") {
    return [
      { value: summary.entities.length, label: localize(hass, "metric.devices"), tone: "neutral", entities: ids(summary.entities), action: ENTITIES_NAVIGATE },
      { value: summary.controllable.length, label: localize(hass, "metric.controls"), tone: "ok", entities: ids(summary.controllable), action: ENTITIES_NAVIGATE },
      { value: summary.online.length, label: localize(hass, "metric.online"), tone: "hot", entities: ids(summary.online), action: ENTITIES_NAVIGATE },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "neutral", entities: ids(summary.issues), action: NAVIGATE.health }
    ];
  }
  if (kind === "environment") {
    return [
      { value: byDomain(summary, "climate").length, label: localize(hass, "metric.climate"), tone: "hot", entities: ids(byDomain(summary, "climate")), action: NAVIGATE.environment },
      { value: byDomain(summary, "sensor").length, label: localize(hass, "metric.sensors"), tone: "neutral", entities: ids(byDomain(summary, "sensor")), action: NAVIGATE.environment },
      { value: summary.controllable.length, label: localize(hass, "metric.controls"), tone: "ok", entities: ids(summary.controllable), action: ENTITIES_NAVIGATE },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "neutral", entities: ids(summary.issues), action: NAVIGATE.health }
    ];
  }
  if (kind === "climate") {
    return [
      { value: byDomain(summary, "climate").length, label: localize(hass, "metric.climate"), tone: "hot", entities: ids(byDomain(summary, "climate")), action: NAVIGATE.environment },
      { value: byDomain(summary, "weather").length, label: localize(hass, "metric.weather"), tone: "neutral", entities: ids(byDomain(summary, "weather")), action: NAVIGATE.environment },
      { value: byDomain(summary, "sensor").length, label: localize(hass, "metric.sensors"), tone: "ok", entities: ids(byDomain(summary, "sensor")), action: NAVIGATE.environment }
    ];
  }
  if (kind === "air") {
    return [
      { value: byDomain(summary, "fan").length, label: localize(hass, "metric.fans"), tone: "hot", entities: ids(byDomain(summary, "fan")), action: NAVIGATE.environment },
      { value: byDomain(summary, "humidifier").length, label: localize(hass, "metric.humidifiers"), tone: "neutral", entities: ids(byDomain(summary, "humidifier")), action: NAVIGATE.environment },
      { value: byDomain(summary, "sensor").length, label: localize(hass, "metric.readings"), tone: "ok", entities: ids(byDomain(summary, "sensor")), action: NAVIGATE.environment }
    ];
  }
  if (kind === "water") {
    return [
      { value: byDomain(summary, "sensor").length, label: localize(hass, "metric.readings"), tone: "neutral", entities: ids(byDomain(summary, "sensor")), action: NAVIGATE.environment },
      { value: byDomain(summary, "binary_sensor").length, label: localize(hass, "metric.sensors"), tone: "ok", entities: ids(byDomain(summary, "binary_sensor")), action: NAVIGATE.environment },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "neutral", entities: ids(summary.issues), action: NAVIGATE.health }
    ];
  }
  if (kind === "power") {
    return [
      { value: byDomain(summary, "switch").length, label: localize(hass, "metric.switches"), tone: "hot", entities: ids(byDomain(summary, "switch")), action: NAVIGATE.environment },
      { value: byDomain(summary, "sensor").length, label: localize(hass, "metric.readings"), tone: "neutral", entities: ids(byDomain(summary, "sensor")), action: NAVIGATE.environment },
      { value: summary.controllable.length, label: localize(hass, "metric.controls"), tone: "ok", entities: ids(summary.controllable), action: ENTITIES_NAVIGATE }
    ];
  }
  if (kind === "energy") {
    return [
      { value: byDomain(summary, "sensor").length, label: localize(hass, "metric.readings"), tone: "hot", entities: ids(byDomain(summary, "sensor")), action: NAVIGATE.environment },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "neutral", entities: ids(summary.issues), action: NAVIGATE.health },
      { value: summary.online.length, label: localize(hass, "metric.online"), tone: "ok", entities: ids(summary.online), action: NAVIGATE.environment }
    ];
  }
  if (kind === "infrastructure") {
    return [
      { value: summary.entities.length, label: localize(hass, "metric.nodes"), tone: "neutral", entities: ids(summary.entities), action: NAVIGATE.health },
      { value: summary.online.length, label: localize(hass, "metric.online"), tone: "ok", entities: ids(summary.online), action: NAVIGATE.health },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "neutral", entities: ids(summary.issues), action: NAVIGATE.health }
    ];
  }
  if (kind === "media") {
    return [
      { value: byDomain(summary, "media_player").length, label: localize(hass, "metric.players"), tone: "hot", entities: ids(byDomain(summary, "media_player")), action: NAVIGATE.media },
      { value: byDomain(summary, "remote").length, label: localize(hass, "metric.remotes"), tone: "neutral", entities: ids(byDomain(summary, "remote")), action: NAVIGATE.media },
      { value: summary.online.length, label: localize(hass, "metric.online"), tone: "ok", entities: ids(summary.online), action: NAVIGATE.media }
    ];
  }
  if (kind === "camera" || kind === "cameraWall") {
    return [
      { value: byDomain(summary, "camera").length, label: localize(hass, "metric.cameras"), tone: "hot", entities: ids(byDomain(summary, "camera")), action: NAVIGATE.media },
      { value: summary.online.length, label: localize(hass, "metric.online"), tone: "ok", entities: ids(summary.online), action: NAVIGATE.media },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "neutral", entities: ids(summary.issues), action: NAVIGATE.health }
    ];
  }
  if (kind === "security") {
    return [
      { value: byDomain(summary, "alarm_control_panel").length, label: localize(hass, "metric.alarms"), tone: "warn", entities: ids(byDomain(summary, "alarm_control_panel")), action: SECURITY_NAVIGATE },
      { value: byDomain(summary, "lock").length, label: localize(hass, "metric.locks"), tone: "neutral", entities: ids(byDomain(summary, "lock")), action: SECURITY_NAVIGATE },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "ok", entities: ids(summary.issues), action: NAVIGATE.health }
    ];
  }
  if (kind === "presence") {
    return [
      { value: byDomain(summary, "person").length, label: localize(hass, "metric.people"), tone: "hot", entities: ids(byDomain(summary, "person")), action: PEOPLE_NAVIGATE },
      { value: byDomain(summary, "device_tracker").length, label: localize(hass, "metric.trackers"), tone: "neutral", entities: ids(byDomain(summary, "device_tracker")), action: PEOPLE_NAVIGATE },
      { value: summary.online.length, label: localize(hass, "metric.online"), tone: "ok", entities: ids(summary.online), action: NAVIGATE.health }
    ];
  }
  if (kind === "panelActions") {
    return [
      { value: summary.routines.length, label: localize(hass, "metric.routines"), tone: "hot", entities: ids(summary.routines), action: ENTITIES_NAVIGATE },
      { value: summary.controllable.length, label: localize(hass, "metric.controls"), tone: "ok", entities: ids(summary.controllable), action: ENTITIES_NAVIGATE },
      { value: summary.entities.length, label: localize(hass, "metric.entities"), tone: "neutral", entities: ids(summary.entities), action: ENTITIES_NAVIGATE }
    ];
  }
  if (kind === "image") {
    return [
      { value: byDomain(summary, "camera").length, label: localize(hass, "metric.cameras"), tone: "hot", entities: ids(byDomain(summary, "camera")), action: NAVIGATE.media },
      { value: summary.entities.length, label: localize(hass, "metric.entities"), tone: "neutral", entities: ids(summary.entities), action: ENTITIES_NAVIGATE },
      { value: summary.online.length, label: localize(hass, "metric.online"), tone: "ok", entities: ids(summary.online), action: NAVIGATE.media }
    ];
  }
  if (kind === "note") {
    return [
      { value: summary.entities.length, label: localize(hass, "metric.entities"), tone: "neutral", entities: ids(summary.entities), action: ENTITIES_NAVIGATE },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "ok", entities: ids(summary.issues), action: NAVIGATE.health },
      { value: summary.online.length, label: localize(hass, "metric.online"), tone: "ok", entities: ids(summary.online), action: ENTITIES_NAVIGATE }
    ];
  }
  if (kind === "rooms" || kind === "room") {
    return [
      { value: areas.length, label: localize(hass, "metric.rooms"), tone: "neutral", action: NAVIGATE.areas },
      { value: totalAreaEntities || summary.entities.length, label: localize(hass, "metric.entities"), tone: "ok", entities: ids(summary.entities), action: ENTITIES_NAVIGATE },
      { value: areaIssues || summary.issues.length, label: localize(hass, "metric.issues"), tone: areaIssues || summary.issues.length ? "warn" : "neutral", entities: ids(summary.issues), action: NAVIGATE.health }
    ];
  }
  if (kind === "routines") {
    return [
      { value: summary.routines.length, label: localize(hass, "metric.routines"), tone: "ok", entities: ids(summary.routines), action: ENTITIES_NAVIGATE },
      { value: byDomain(summary, "scene").length, label: localize(hass, "metric.scenes"), tone: "neutral", entities: ids(byDomain(summary, "scene")), action: NAVIGATE.scenes },
      { value: byDomain(summary, "button").length, label: localize(hass, "action.press"), tone: "neutral", entities: ids(byDomain(summary, "button")), action: ENTITIES_NAVIGATE }
    ];
  }
  if (kind === "hero") {
    return [
      { value: summary.entities.length, label: localize(hass, "metric.entities"), tone: "neutral", entities: ids(summary.entities), action: ENTITIES_NAVIGATE },
      { value: summary.activeLights.length, label: localize(hass, "metric.lights_on"), tone: "hot", entities: ids(summary.activeLights), action: NAVIGATE.lighting },
      { value: areas.length, label: localize(hass, "metric.rooms"), tone: "ok", action: NAVIGATE.areas },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "neutral", entities: ids(summary.issues), action: NAVIGATE.health }
    ];
  }
  return [
    { value: summary.activeLights.length, label: localize(hass, "metric.lights_on"), tone: "hot", entities: ids(summary.activeLights), action: NAVIGATE.lighting },
    { value: summary.lights.length, label: localize(hass, "metric.lights"), tone: "neutral", entities: ids(summary.lights), action: NAVIGATE.lighting },
    { value: summary.controllable.length, label: localize(hass, "metric.controls"), tone: "ok", entities: ids(summary.controllable), action: ENTITIES_NAVIGATE }
  ];
}

function ids(entities: DashboardCardSummary["entities"]): string[] {
  return entities.map((entity) => entity.entityId);
}

function byDomain(summary: DashboardCardSummary, domain: string): DashboardCardSummary["entities"] {
  return summary.entities.filter((entity) => entity.domain === domain);
}
