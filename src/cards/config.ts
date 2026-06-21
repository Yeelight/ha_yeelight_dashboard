import type { DashboardAreaSummary, DashboardCardConfig } from "./types";
import { normalizeGridOptionsOverride } from "./grid-options";

export type NormalizedDashboardCardConfig = DashboardCardConfig & {
  entities: string[];
  area_summaries: DashboardAreaSummary[];
  density: "comfortable" | "compact";
  show_metrics: boolean;
  show_actions: boolean;
  show_area_summaries: boolean;
  variant: "standard" | "compact" | "panel";
  grid_options?: NonNullable<DashboardCardConfig["grid_options"]>;
};

export function normalizeDashboardCardConfig(config: Partial<DashboardCardConfig> = {}): NormalizedDashboardCardConfig {
  return {
    ...config,
    type: typeof config.type === "string" && config.type ? config.type : "custom:yeelight-dashboard-hero-card",
    title: typeof config.title === "string" ? config.title : undefined,
    subtitle: typeof config.subtitle === "string" ? config.subtitle : undefined,
    entities: uniqueStrings(config.entities),
    area_summaries: Array.isArray(config.area_summaries) ? config.area_summaries : [],
    density: enumValue(config.density, ["comfortable", "compact"], "comfortable"),
    item_limit: optionalClampedNumber(config.item_limit, 1, 24),
    show_metrics: booleanValue(config.show_metrics, true),
    show_actions: booleanValue(config.show_actions, true),
    show_area_summaries: booleanValue(config.show_area_summaries, true),
    variant: enumValue(config.variant, ["standard", "compact", "panel"], "standard"),
    grid_options: normalizeGridOptionsOverride(config.grid_options)
  };
}

export function visibleLimit(config: DashboardCardConfig, fallback: number): number {
  return optionalClampedNumber(config.item_limit, 1, 24) ?? fallback;
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))];
}

function enumValue<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && options.includes(value as T) ? (value as T) : fallback;
}

function optionalClampedNumber(value: unknown, min: number, max: number): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) return undefined;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}
