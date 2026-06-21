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
