import type { HassEntity, HomeAssistant } from "../types";

export type DashboardCardKind =
  | "hero"
  | "status"
  | "notice"
  | "light"
  | "rooms"
  | "room"
  | "devices"
  | "routines"
  | "environment"
  | "ecosystem"
  | "health";

export type DashboardCardGridOptions = {
  columns: number;
  rows: number;
};

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
  subtitle?: string;
  entities?: string[];
  area_summaries?: DashboardAreaSummary[];
  density?: "comfortable" | "compact";
  item_limit?: number;
  show_metrics?: boolean;
  show_actions?: boolean;
  show_area_summaries?: boolean;
  variant?: "standard" | "compact" | "panel";
  grid_options?: Partial<DashboardCardGridOptions>;
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
