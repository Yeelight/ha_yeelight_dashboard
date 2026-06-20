import type {
  AreaMode,
  DashboardLayoutOverride,
  DashboardLayoutOverrides,
  DashboardProfile,
  DashboardScope,
  DashboardViewKey,
  LayoutMode,
  YeelightDashboardConfig
} from "../types";

export const STRATEGY_TYPE = "yeelight-dashboard";
export const STRATEGY_TAG = "ll-strategy-dashboard-yeelight-dashboard";
export const EDITOR_TAG = "yeelight-dashboard-strategy-editor";

const DEFAULT_VIEWS: Record<DashboardViewKey, boolean | "auto"> = {
  overview: true,
  lighting: true,
  areas: true,
  routines: true,
  environment: "auto",
  media: "auto",
  health: true,
  floorplan: false
};

const PROFILE_DEFAULTS: Record<
  DashboardProfile,
  Partial<Pick<YeelightDashboardConfig, "theme" | "scope" | "layout_mode">> & {
    views?: Partial<Record<DashboardViewKey, boolean | "auto">>;
    preferences?: Partial<YeelightDashboardConfig["preferences"]>;
  }
> = {
  standard: {
    theme: "Yeelight Minimal",
    scope: "yeelight_and_area",
    layout_mode: "sections"
  },
  lighting: {
    theme: "Yeelight Light",
    scope: "yeelight_only",
    layout_mode: "sections",
    views: { areas: true, environment: false, media: false },
    preferences: { show_non_yeelight_entities: false, scene_limit: 6 }
  },
  panel: {
    theme: "Yeelight Panel",
    scope: "yeelight_and_area",
    layout_mode: "canvas",
    views: { health: false, media: false },
    preferences: { density: "compact", scene_limit: 6 }
  },
  advanced: {
    theme: "Yeelight Minimal",
    scope: "all_area_devices",
    layout_mode: "sections",
    views: { environment: true, media: "auto", health: true },
    preferences: { show_non_yeelight_entities: true, scene_limit: 12 }
  }
};

export function defaultConfig(): YeelightDashboardConfig {
  const profileDefaults = PROFILE_DEFAULTS.standard;
  return {
    schema_version: 1,
    profile: "standard",
    theme: profileDefaults.theme || "Yeelight Minimal",
    scope: profileDefaults.scope || "yeelight_and_area",
    layout_mode: profileDefaults.layout_mode || "sections",
    area_mode: "auto",
    selected_areas: [],
    views: { ...DEFAULT_VIEWS },
    preferences: {
      density: "comfortable",
      show_offline: true,
      show_non_yeelight_entities: true,
      scene_limit: 8
    },
    labels: {
      featured: "",
      hidden: ""
    }
  };
}

export function normalizeConfig(input?: Partial<YeelightDashboardConfig>): YeelightDashboardConfig {
  const base = defaultConfig();
  const profile = enumValue(input?.profile, ["standard", "lighting", "panel", "advanced"], base.profile);
  const profileDefaults = PROFILE_DEFAULTS[profile];
  const defaultPreferences = { ...base.preferences, ...(profileDefaults.preferences || {}) };
  return {
    ...base,
    ...input,
    schema_version: 1,
    profile,
    theme: String(input?.theme || profileDefaults.theme || base.theme),
    scope: enumValue(input?.scope, ["yeelight_only", "yeelight_and_area", "all_area_devices"], profileDefaults.scope || base.scope),
    layout_mode: enumValue(input?.layout_mode, ["sections", "canvas"], profileDefaults.layout_mode || base.layout_mode),
    area_mode: enumValue(input?.area_mode, ["auto", "selected"], base.area_mode),
    selected_areas: uniqueStrings(input?.selected_areas),
    views: { ...base.views, ...(profileDefaults.views || {}), ...(input?.views || {}) },
    preferences: {
      ...defaultPreferences,
      ...(input?.preferences || {}),
      density: enumValue(input?.preferences?.density, ["comfortable", "compact"], defaultPreferences.density),
      show_offline: booleanValue(input?.preferences?.show_offline, defaultPreferences.show_offline),
      show_non_yeelight_entities: booleanValue(
        input?.preferences?.show_non_yeelight_entities,
        defaultPreferences.show_non_yeelight_entities
      ),
      scene_limit: clampNumber(input?.preferences?.scene_limit, 1, 24, defaultPreferences.scene_limit)
    },
    labels: { ...base.labels, ...(input?.labels || {}) },
    layout_overrides: normalizeLayoutOverrides(input?.layout_overrides)
  };
}

function enumValue<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function uniqueStrings(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))] : [];
}

function normalizeLayoutOverrides(value: unknown): DashboardLayoutOverrides | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const normalized: DashboardLayoutOverrides = {};
  for (const [view, cards] of Object.entries(value)) {
    if (!VIEW_OPTIONS.includes(view as DashboardViewKey) || !cards || typeof cards !== "object" || Array.isArray(cards)) continue;
    const viewOverrides: Record<string, DashboardLayoutOverride> = {};
    for (const [key, override] of Object.entries(cards)) {
      if (!key.trim() || !override || typeof override !== "object" || Array.isArray(override)) continue;
      const box = normalizeBox(override as Record<string, unknown>);
      if (Object.keys(box).length) viewOverrides[key] = box;
    }
    if (Object.keys(viewOverrides).length) normalized[view] = viewOverrides;
  }
  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeBox(value: Record<string, unknown>): DashboardLayoutOverride {
  const box: DashboardLayoutOverride = {};
  for (const key of ["x", "y", "w", "h", "z"] as const) {
    const number = Number(value[key]);
    if (Number.isFinite(number)) box[key] = Math.round(number);
  }
  return box;
}

export const PROFILE_OPTIONS: DashboardProfile[] = ["standard", "lighting", "panel", "advanced"];
export const SCOPE_OPTIONS: DashboardScope[] = ["yeelight_only", "yeelight_and_area", "all_area_devices"];
export const LAYOUT_OPTIONS: LayoutMode[] = ["sections", "canvas"];
export const AREA_MODE_OPTIONS: AreaMode[] = ["auto", "selected"];
export const VIEW_OPTIONS: DashboardViewKey[] = ["overview", "lighting", "areas", "routines", "environment", "media", "health"];
export const THEME_OPTIONS = [
  "Yeelight Minimal",
  "Yeelight Light",
  "Yeelight Dark",
  "Yeelight Panel",
  "Yeelight Classic Light",
  "Yeelight Classic Dark"
];
