import type { HassEntity, HomeAssistant } from "../types";

export type DashboardCardKind = "hero" | "light" | "rooms" | "room" | "routines" | "health";

export type DashboardAreaSummary = {
  areaId: string;
  name: string;
  entityCount: number;
  lightCount: number;
  activeLightCount: number;
  routineCount: number;
  issueCount: number;
};

export type DashboardCardConfig = {
  type: string;
  title?: string;
  entities?: string[];
  area_summaries?: DashboardAreaSummary[];
};

export type NormalizedEntity = {
  entityId: string;
  domain: string;
  state: string;
  name: string;
  icon: string;
  available: boolean;
  readOnly: boolean;
  attributes: Record<string, unknown>;
};

export type DashboardCardSummary = {
  entities: NormalizedEntity[];
  lights: NormalizedEntity[];
  activeLights: NormalizedEntity[];
  routines: NormalizedEntity[];
  controllable: NormalizedEntity[];
  updates: NormalizedEntity[];
  unknown: NormalizedEntity[];
  issues: NormalizedEntity[];
  unavailable: NormalizedEntity[];
  online: NormalizedEntity[];
};

export type CardActionHost = HTMLElement & { hass?: HomeAssistant };

export type { HassEntity, HomeAssistant };
