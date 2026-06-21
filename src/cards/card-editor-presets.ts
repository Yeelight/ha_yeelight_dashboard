import type { DashboardCardConfig } from "./types";
import { cardDefinitionFromType } from "./card-definitions";
import { gridOptionsForKind } from "./grid-options";
import type { DashboardCardKind } from "./types";

export const GRID_SIZE_PRESETS = [
  { key: "default", grid_options: undefined },
  { key: "compact", grid_options: { columns: 6, rows: 4 } },
  { key: "half", grid_options: { columns: 6, rows: 6 } },
  { key: "wide", grid_options: { columns: 12, rows: 5 } },
  { key: "feature", grid_options: { columns: 12, rows: 9 } }
] as const;

const DISPLAY_FIELDS = ["item_limit", "show_metrics", "show_actions", "show_area_summaries", "density", "variant"] as const;

export type DashboardDisplayPreset = {
  key: "standard" | "simple" | "dense" | "focus" | "status";
  config: Pick<DashboardCardConfig, (typeof DISPLAY_FIELDS)[number]>;
};

export const DISPLAY_PRESETS: DashboardDisplayPreset[] = [
  {
    key: "standard",
    config: {
      item_limit: undefined,
      show_metrics: true,
      show_actions: true,
      show_area_summaries: true,
      density: "comfortable",
      variant: "standard"
    }
  },
  {
    key: "simple",
    config: {
      item_limit: 2,
      show_metrics: true,
      show_actions: true,
      show_area_summaries: false,
      density: "comfortable",
      variant: "standard"
    }
  },
  {
    key: "dense",
    config: {
      item_limit: 4,
      show_metrics: true,
      show_actions: true,
      show_area_summaries: false,
      density: "compact",
      variant: "compact"
    }
  },
  {
    key: "focus",
    config: {
      item_limit: 1,
      show_metrics: false,
      show_actions: true,
      show_area_summaries: false,
      density: "comfortable",
      variant: "panel"
    }
  },
  {
    key: "status",
    config: {
      item_limit: 3,
      show_metrics: true,
      show_actions: false,
      show_area_summaries: true,
      density: "compact",
      variant: "standard"
    }
  }
];

export function displayPresetPatch(preset: DashboardDisplayPreset): Partial<DashboardCardConfig> {
  return { ...preset.config };
}

export function isDisplayPresetActive(config: DashboardCardConfig, preset: DashboardDisplayPreset): boolean {
  return DISPLAY_FIELDS.every((field) => config[field] === preset.config[field]);
}

const CARD_TYPE_RECOMMENDED_DISPLAY: Record<DashboardCardKind, DashboardDisplayPreset["config"]> = {
  hero: { item_limit: undefined, show_metrics: true, show_actions: true, show_area_summaries: true, density: "comfortable", variant: "panel" },
  status: { item_limit: 3, show_metrics: true, show_actions: false, show_area_summaries: true, density: "compact", variant: "standard" },
  notice: { item_limit: 4, show_metrics: true, show_actions: true, show_area_summaries: false, density: "compact", variant: "standard" },
  light: { item_limit: 6, show_metrics: true, show_actions: true, show_area_summaries: false, density: "comfortable", variant: "standard" },
  rooms: { item_limit: 6, show_metrics: true, show_actions: true, show_area_summaries: true, density: "comfortable", variant: "standard" },
  room: { item_limit: 6, show_metrics: true, show_actions: true, show_area_summaries: false, density: "comfortable", variant: "standard" },
  devices: { item_limit: 6, show_metrics: true, show_actions: true, show_area_summaries: true, density: "comfortable", variant: "standard" },
  routines: { item_limit: 6, show_metrics: false, show_actions: true, show_area_summaries: false, density: "compact", variant: "compact" },
  environment: { item_limit: 6, show_metrics: true, show_actions: true, show_area_summaries: false, density: "comfortable", variant: "standard" },
  ecosystem: { item_limit: 5, show_metrics: true, show_actions: true, show_area_summaries: true, density: "compact", variant: "standard" },
  health: { item_limit: 6, show_metrics: true, show_actions: true, show_area_summaries: true, density: "compact", variant: "standard" }
};

export function recommendedCardSetupPatch(type: string): Partial<DashboardCardConfig> {
  const kind = cardDefinitionFromType(type)?.kind ?? "hero";
  return {
    type,
    grid_options: { ...gridOptionsForKind(kind) },
    ...CARD_TYPE_RECOMMENDED_DISPLAY[kind]
  };
}
