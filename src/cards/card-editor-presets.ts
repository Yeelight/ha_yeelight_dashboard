import type { DashboardCardConfig } from "./types";
import { cardDefinitionFromType } from "./card-definitions";
import { defaultSubtypeForKind, normalizeSubtype } from "./card-subtypes";
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
  climate: { item_limit: 5, show_metrics: true, show_actions: false, show_area_summaries: false, density: "comfortable", variant: "standard" },
  air: { item_limit: 5, show_metrics: true, show_actions: true, show_area_summaries: false, density: "comfortable", variant: "standard" },
  water: { item_limit: 5, show_metrics: true, show_actions: false, show_area_summaries: false, density: "comfortable", variant: "standard" },
  power: { item_limit: 5, show_metrics: true, show_actions: true, show_area_summaries: false, density: "comfortable", variant: "standard" },
  energy: { item_limit: 5, show_metrics: true, show_actions: false, show_area_summaries: false, density: "comfortable", variant: "standard" },
  infrastructure: { item_limit: 5, show_metrics: true, show_actions: false, show_area_summaries: false, density: "compact", variant: "standard" },
  media: { item_limit: 5, show_metrics: true, show_actions: false, show_area_summaries: false, density: "comfortable", variant: "standard" },
  camera: { item_limit: 4, show_metrics: true, show_actions: false, show_area_summaries: false, density: "comfortable", variant: "standard" },
  cameraWall: { item_limit: 6, show_metrics: true, show_actions: false, show_area_summaries: false, density: "compact", variant: "panel" },
  security: { item_limit: 5, show_metrics: true, show_actions: false, show_area_summaries: false, density: "compact", variant: "standard" },
  presence: { item_limit: 5, show_metrics: true, show_actions: false, show_area_summaries: false, density: "comfortable", variant: "standard" },
  panelActions: { item_limit: 6, show_metrics: false, show_actions: true, show_area_summaries: false, density: "compact", variant: "panel" },
  image: { item_limit: 4, show_metrics: false, show_actions: false, show_area_summaries: false, density: "comfortable", variant: "standard" },
  note: { item_limit: 4, show_metrics: false, show_actions: false, show_area_summaries: false, density: "comfortable", variant: "standard" },
  ecosystem: { item_limit: 5, show_metrics: true, show_actions: true, show_area_summaries: true, density: "compact", variant: "standard" },
  health: { item_limit: 6, show_metrics: true, show_actions: true, show_area_summaries: true, density: "compact", variant: "standard" }
};

const SUBTYPE_RECOMMENDED_DISPLAY: Partial<Record<DashboardCardKind, Record<string, Partial<DashboardDisplayPreset["config"]>>>> = {
  hero: {
    time: { item_limit: 4, show_metrics: false, show_actions: true, show_area_summaries: true, variant: "panel" },
    quote: { item_limit: 3, show_metrics: false, show_actions: true, show_area_summaries: true, variant: "panel" }
  },
  media: {
    broadcast: { item_limit: 3, show_metrics: true, show_actions: false, density: "compact" },
    voice: { item_limit: 3, show_metrics: true, show_actions: false, density: "compact" },
    remote: { item_limit: 4, show_metrics: true, show_actions: false, density: "compact" }
  },
  camera: {
    single: { item_limit: 1, show_metrics: true, show_actions: false, variant: "panel" }
  },
  cameraWall: {
    wall: { item_limit: 6, show_metrics: true, show_actions: false, density: "compact", variant: "panel" }
  },
  panelActions: {
    standard: { item_limit: 6, show_metrics: false, show_actions: true, density: "compact", variant: "panel" }
  },
  image: {
    single: { item_limit: 1, show_metrics: false, show_actions: false },
    carousel: { item_limit: 6, show_metrics: false, show_actions: false }
  },
  note: {
    standard: { item_limit: 4, show_metrics: false, show_actions: false }
  }
};

export function recommendedCardSetupPatch(type: string, subtype?: string): Partial<DashboardCardConfig> {
  const kind = cardDefinitionFromType(type)?.kind ?? "hero";
  const activeSubtype = subtype ? normalizeSubtype(kind, subtype) : defaultSubtypeForKind(kind);
  return {
    type,
    subtype: activeSubtype,
    grid_options: { ...gridOptionsForKind(kind) },
    ...recommendedDisplayFor(kind, activeSubtype)
  };
}

function recommendedDisplayFor(kind: DashboardCardKind, subtype: string | undefined): DashboardDisplayPreset["config"] {
  return {
    ...CARD_TYPE_RECOMMENDED_DISPLAY[kind],
    ...(subtype ? SUBTYPE_RECOMMENDED_DISPLAY[kind]?.[subtype] : {})
  };
}
