import type { DashboardCardKind } from "./types";

export type DashboardCardDefinition = {
  type: string;
  tag: string;
  kind: DashboardCardKind;
  icon: string;
};

export const DASHBOARD_CARD_DEFINITIONS: DashboardCardDefinition[] = [
  define("hero", "yeelight-dashboard-hero-card", "mdi:home-lightbulb"),
  define("status", "yeelight-dashboard-status-card", "mdi:view-dashboard-outline"),
  define("notice", "yeelight-dashboard-notice-card", "mdi:bell-badge-outline"),
  define("light", "yeelight-dashboard-light-card", "mdi:lightbulb-group"),
  define("rooms", "yeelight-dashboard-rooms-card", "mdi:floor-plan"),
  define("room", "yeelight-dashboard-room-card", "mdi:home-variant"),
  define("devices", "yeelight-dashboard-devices-card", "mdi:devices"),
  define("routines", "yeelight-dashboard-routines-card", "mdi:movie-open-play"),
  define("environment", "yeelight-dashboard-environment-card", "mdi:home-thermometer-outline"),
  define("climate", "yeelight-dashboard-climate-card", "mdi:thermostat-auto"),
  define("air", "yeelight-dashboard-air-card", "mdi:air-filter"),
  define("water", "yeelight-dashboard-water-card", "mdi:water-pump"),
  define("power", "yeelight-dashboard-power-card", "mdi:power-plug"),
  define("energy", "yeelight-dashboard-energy-card", "mdi:transmission-tower"),
  define("infrastructure", "yeelight-dashboard-infrastructure-card", "mdi:server-network"),
  define("media", "yeelight-dashboard-media-card", "mdi:play-box-multiple-outline"),
  define("camera", "yeelight-dashboard-camera-card", "mdi:cctv"),
  define("cameraWall", "yeelight-dashboard-camera-wall-card", "mdi:view-grid-outline"),
  define("security", "yeelight-dashboard-security-card", "mdi:shield-home-outline"),
  define("presence", "yeelight-dashboard-presence-card", "mdi:account-location-outline"),
  define("panelActions", "yeelight-dashboard-panel-actions-card", "mdi:view-dashboard-edit-outline"),
  define("image", "yeelight-dashboard-image-card", "mdi:image-multiple-outline"),
  define("note", "yeelight-dashboard-note-card", "mdi:note-text-outline"),
  define("ecosystem", "yeelight-dashboard-ecosystem-card", "mdi:lan-connect"),
  define("health", "yeelight-dashboard-health-card", "mdi:heart-pulse")
];

const DEFINITION_BY_TYPE = new Map(DASHBOARD_CARD_DEFINITIONS.map((definition) => [definition.type, definition]));
const DEFINITION_BY_TAG = new Map(DASHBOARD_CARD_DEFINITIONS.map((definition) => [definition.tag, definition]));

export function cardDefinitionFromType(type: unknown): DashboardCardDefinition | undefined {
  return typeof type === "string" ? DEFINITION_BY_TYPE.get(type) : undefined;
}

export function cardDefinitionFromTag(tag: unknown): DashboardCardDefinition | undefined {
  return typeof tag === "string" ? DEFINITION_BY_TAG.get(tag) : undefined;
}

export function fallbackCardDefinition(): DashboardCardDefinition {
  return DASHBOARD_CARD_DEFINITIONS[0];
}

function define(kind: DashboardCardKind, tag: string, icon: string): DashboardCardDefinition {
  return { type: `custom:${tag}`, tag, kind, icon };
}
