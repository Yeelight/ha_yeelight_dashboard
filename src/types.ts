export type DashboardProfile = "standard" | "lighting" | "panel" | "advanced";
export type DashboardScope = "yeelight_only" | "yeelight_and_area" | "all_area_devices";
export type LayoutMode = "sections" | "canvas";
export type AreaMode = "auto" | "selected";
export type DashboardViewKey =
  | "overview"
  | "lighting"
  | "areas"
  | "routines"
  | "environment"
  | "media"
  | "health"
  | "floorplan";

export type DashboardLayoutOverride = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  z?: number;
};

export type DashboardLayoutOverrides = Record<string, Record<string, DashboardLayoutOverride>>;

export type YeelightDashboardConfig = {
  type?: string;
  schema_version: 1;
  profile: DashboardProfile;
  theme: string;
  scope: DashboardScope;
  layout_mode: LayoutMode;
  area_mode: AreaMode;
  selected_areas: string[];
  views: Record<DashboardViewKey, boolean | "auto">;
  preferences: {
    density: "comfortable" | "compact";
    show_offline: boolean;
    show_non_yeelight_entities: boolean;
    scene_limit: number;
  };
  labels: {
    featured: string;
    hidden: string;
  };
  layout_overrides?: DashboardLayoutOverrides;
};

export type HassEntity = {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
};

export type HomeAssistant = {
  states: Record<string, HassEntity>;
  areas?: AreaRegistryEntry[];
  connected?: boolean;
  locale?: { language?: string };
  themes?: { themes?: Record<string, unknown> };
  callService?: (domain: string, service: string, data?: Record<string, unknown>) => Promise<unknown>;
  callWS?: <T = unknown>(message: Record<string, unknown>) => Promise<T>;
};

export type AreaRegistryEntry = {
  area_id: string;
  name: string;
  icon?: string | null;
  floor_id?: string | null;
};

export type DeviceRegistryEntry = {
  id: string;
  area_id?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  name?: string | null;
  name_by_user?: string | null;
};

export type EntityRegistryEntry = {
  entity_id: string;
  platform?: string;
  device_id?: string | null;
  area_id?: string | null;
  labels?: string[];
  disabled_by?: string | null;
  hidden_by?: string | null;
  entity_category?: string | null;
  device_class?: string | null;
};

export type RegistryData = {
  areas: AreaRegistryEntry[];
  devices: DeviceRegistryEntry[];
  entities: EntityRegistryEntry[];
  floors: Array<Record<string, unknown>>;
  labels: Array<Record<string, unknown>>;
  error?: string;
};

export type LovelaceCardConfig = Record<string, unknown> & { type: string };
export type LovelaceSectionConfig = { type?: string; title?: string; cards: LovelaceCardConfig[] };
export type LovelaceViewConfig = {
  title: string;
  path: string;
  icon?: string;
  type?: string;
  theme?: string;
  sections?: LovelaceSectionConfig[];
  cards?: LovelaceCardConfig[];
  style?: Record<string, string>;
  subview?: boolean;
  layout_studio?: boolean;
};
export type LovelaceDashboardConfig = { views: LovelaceViewConfig[] };

export type DashboardCustomStrategy = {
  type: string;
  strategyType: "dashboard" | "view";
  name: string;
  description?: string;
  documentationURL?: string;
};

declare global {
  interface Window {
    customStrategies?: DashboardCustomStrategy[];
    customCards?: Array<Record<string, unknown>>;
  }
}
