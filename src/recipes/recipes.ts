import type { DashboardContext } from "../model/context";
import { localize } from "../i18n";
import type { LovelaceCardConfig, LovelaceSectionConfig } from "../types";
import {
  areaSummaries,
  areaSummary,
  cameraEntities,
  domainEntities,
  environmentEntities,
  featuredAreaEntities,
  infrastructureEntities,
  mediaEntities,
  populatedAreas,
  presenceEntities,
  routineEntities,
  securityEntities,
  visibleAreaEntities,
  waterEntities
} from "./entity-groups";
import {
  areaProductCards,
  dashboardCard,
  environmentProductCards,
  healthProductCards,
  healthUtilityProductCards,
  mediaProductCards,
  mediaUtilityProductCards,
  optionalDashboardCard,
  phaseAOverviewCards,
  routineProductCards
} from "./product-cards";
import {
  AREA_NATIVE_LEGACY_WIDGETS,
  ENVIRONMENT_NATIVE_LEGACY_WIDGETS,
  FOUNDATION_NATIVE_LEGACY_WIDGETS,
  HEALTH_NATIVE_LEGACY_WIDGETS,
  LIGHTING_NATIVE_LEGACY_WIDGETS,
  MEDIA_NATIVE_LEGACY_WIDGETS,
  ROUTINE_NATIVE_LEGACY_WIDGETS,
  areaNativeCards,
  environmentNativeCards,
  healthNativeCards,
  lightingNativeCards,
  mediaNativeCards,
  routineNativeCards,
  routineNativeEntities,
  tiles
} from "./native-cards";

export type RecipeTarget = "overview" | "lighting" | "areas" | "routines" | "environment" | "media" | "health";

export type DashboardRecipe = {
  id: string;
  target: RecipeTarget;
  priority: number;
  sourceLegacyWidgets: string[];
  match(context: DashboardContext): boolean;
  build(context: DashboardContext): LovelaceSectionConfig[];
};

export const RECIPES: DashboardRecipe[] = [
  {
    id: "overview-core",
    target: "overview",
    priority: 10,
    sourceLegacyWidgets: ["hero", "panel-hero", "time-card", "daily-quote-card", "status", "notice", "rooms", "favorite-lights", "quick-scenes", "ecosystem", "health", ...FOUNDATION_NATIVE_LEGACY_WIDGETS],
    match: () => true,
    build: (context) => [
      section(localize(context.hass, "section.home"), [
        dashboardCard(context, "hero", context.entities, "overview.hero", { subtype: "panel", area_summaries: areaSummaries(context) }),
        dashboardCard(context, "status", context.entities, "overview.status", { area_summaries: areaSummaries(context) })
      ]),
      section(localize(context.hass, "section.control"), [
        dashboardCard(context, "light", domainEntities(context, "light"), "overview.lights", { subtype: "favorites" }),
        dashboardCard(context, "rooms", context.entities, "overview.rooms", { subtype: "overview", area_summaries: areaSummaries(context) })
      ]),
      section(localize(context.hass, "section.operations"), [
        dashboardCard(context, "routines", routineEntities(context), "overview.routines", { subtype: "quick" }),
        dashboardCard(context, "notice", context.entities, "overview.notice"),
        ...phaseAOverviewCards(context),
        dashboardCard(context, "ecosystem", context.entities, "overview.ecosystem", { area_summaries: areaSummaries(context) }),
        dashboardCard(context, "health", context.entities, "overview.health")
      ])
    ]
  },
  {
    id: "lighting-native",
    target: "lighting",
    priority: 20,
    sourceLegacyWidgets: ["favorite-lights", "light-status-card", "light-overview-card", "light-devices", ...LIGHTING_NATIVE_LEGACY_WIDGETS],
    match: (context) => domainEntities(context, "light").length > 0,
    build: (context) => [
      section(localize(context.hass, "section.lighting"), lightingProductCards(context)),
      ...optionalSections(localize(context.hass, "section.native_controls"), lightingNativeCards(context).slice(0, 2))
    ]
  },
  {
    id: "areas-product",
    target: "areas",
    priority: 30,
    sourceLegacyWidgets: ["rooms", "room-card", "room-devices", "devices", "device-list", "device-single", "universal-card", ...AREA_NATIVE_LEGACY_WIDGETS],
    match: (context) => context.index.areas.length > 0,
    build: (context) => [
      section(localize(context.hass, "section.devices"), [
        ...areaProductCards(context),
        dashboardCard(context, "rooms", context.entities, "areas.rooms", { subtype: "overview", area_summaries: areaSummaries(context) })
      ]),
      ...optionalSections(localize(context.hass, "section.native_controls"), areaNativeCards(context)),
      ...populatedAreas(context).slice(0, 8).map((area) =>
        section(area.name, [
          dashboardCard(context, "room", visibleAreaEntities(context, area.area_id), `area.${area.area_id}.summary`, {
            title: area.name,
            subtype: "devices",
            area_summaries: [areaSummary(context, area.area_id, area.name)]
          }),
          ...tiles(featuredAreaEntities(context, area.area_id).slice(0, 8))
        ])
      )
    ]
  },
  {
    id: "routines-product",
    target: "routines",
    priority: 40,
    sourceLegacyWidgets: ["quick-scenes", "scene-list", "quick-command-card", "script-panel", "automations", "schedule", "scene-single-card", "automation-single-card", "script-single-card", "button-card", "panel-actions", ...ROUTINE_NATIVE_LEGACY_WIDGETS],
    match: (context) => routineEntities(context).length > 0 || routineNativeEntities(context).length > 0,
    build: (context) => routineSections(context)
  },
  {
    id: "environment-product",
    target: "environment",
    priority: 50,
    sourceLegacyWidgets: ["weather", "weather-card", "sensor-card", "illuminance-card", "climate", "climate-card", "fan-card", "humidifier-card", "water-purifier-card", "socket-card", "electricity-card", "energy", "insights", ...ENVIRONMENT_NATIVE_LEGACY_WIDGETS],
    match: (context) => environmentEntities(context).length > 0,
    build: (context) => [
      section(localize(context.hass, "section.environment"), [...environmentProductCards(context), ...optionalDashboardCard(context, "water", waterEntities(context), "environment.water", { subtype: "purifier" })]),
      ...optionalSections(localize(context.hass, "section.native_controls"), environmentNativeCards(context))
    ]
  },
  {
    id: "media-native",
    target: "media",
    priority: 60,
    sourceLegacyWidgets: ["media", "media-player-card", "max-player-card", "broadcast-radio-card", "voice-assistant-card", "remote-card", "cameras", "camera-card", "camera-wall-card", "image", "image-carousel", ...MEDIA_NATIVE_LEGACY_WIDGETS],
    match: (context) => mediaEntities(context).length > 0 || cameraEntities(context).length > 0,
    build: (context) => [
      section(localize(context.hass, "section.media"), [...mediaProductCards(context), ...mediaUtilityProductCards(context)]),
      ...optionalSections(localize(context.hass, "section.cameras"), [
        ...optionalDashboardCard(context, "camera", cameraEntities(context), "media.cameras", { subtype: "overview" }),
        ...optionalDashboardCard(context, "camera", cameraEntities(context).slice(0, 1), "media.camera_single", { subtype: "single" }),
        ...optionalDashboardCard(context, "cameraWall", cameraEntities(context), "media.camera_wall", { subtype: "wall" })
      ]),
      ...optionalSections(localize(context.hass, "section.native_controls"), mediaNativeCards(context))
    ]
  },
  {
    id: "health-native",
    target: "health",
    priority: 70,
    sourceLegacyWidgets: [
      "ecosystem",
      "health",
      "updates-card",
      "repairs-backup-card",
      "iot-network-card",
      "events",
      "history",
      "text-note",
      "security",
      "alarm-card",
      "lock-card",
      "binary-sensor-card",
      "motion-card",
      "people",
      "family-card",
      "device-tracker-card",
      "server-card",
      "router-card",
      "nas-card",
      "pve-card",
      "server-devices",
      "pve-devices",
      ...HEALTH_NATIVE_LEGACY_WIDGETS
    ],
    match: () => true,
    build: (context) => [
      section(localize(context.hass, "section.health"), [
        dashboardCard(context, "ecosystem", context.entities, "health.ecosystem", { area_summaries: areaSummaries(context) }),
        dashboardCard(context, "notice", context.entities, "health.notices"),
        ...optionalDashboardCard(context, "security", securityEntities(context), "health.security", { subtype: "overview" }),
        ...optionalDashboardCard(context, "presence", presenceEntities(context), "health.presence", { subtype: "motion" }),
        ...optionalDashboardCard(context, "infrastructure", infrastructureEntities(context), "health.infrastructure", { subtype: "server" }),
        dashboardCard(context, "health", context.entities, "health.summary", { subtype: "overview" })
      ]),
      ...optionalSections(localize(context.hass, "section.security_presence"), healthProductCards(context)),
      ...optionalSections(localize(context.hass, "section.notes"), healthUtilityProductCards(context)),
      ...optionalSections(localize(context.hass, "section.native_controls"), healthNativeCards(context))
    ]
  }
];

export function buildRecipeSections(target: RecipeTarget, context: DashboardContext): LovelaceSectionConfig[] {
  return RECIPES.filter((recipe) => recipe.target === target && recipe.match(context))
    .sort((a, b) => a.priority - b.priority)
    .flatMap((recipe) => recipe.build(context));
}

function section(title: string, cards: LovelaceCardConfig[]): LovelaceSectionConfig {
  return { type: "grid", title, cards: cards.length ? cards : [emptyCard(title)] };
}

function optionalSections(title: string, cards: LovelaceCardConfig[]): LovelaceSectionConfig[] {
  return cards.length ? [section(title, cards)] : [];
}

function routineSections(context: DashboardContext): LovelaceSectionConfig[] {
  const routines = routineEntities(context);
  const productCards = [
    ...optionalDashboardCard(context, "panelActions", routines, "routines.panel_actions", { subtype: "standard" }),
    ...(context.config.profile === "advanced" ? routineProductCards(context) : [])
  ];
  return [
    ...optionalSections(localize(context.hass, "section.routines"), productCards),
    ...optionalSections(localize(context.hass, "section.native_controls"), routineNativeCards(context, "routines"))
  ];
}

function lightingProductCards(context: DashboardContext): LovelaceCardConfig[] {
  const lights = domainEntities(context, "light");
  const areaCards = areaSummaries(context).length
    ? [dashboardCard(context, "rooms", context.entities, "lighting.rooms", { subtype: "overview", area_summaries: areaSummaries(context), item_limit: 6 })]
    : [];
  const cards = [
    dashboardCard(context, "light", lights, "lighting.overview", { subtype: "overview", item_limit: 4, show_area_summaries: true, area_summaries: areaSummaries(context) }),
    dashboardCard(context, "light", lights, "lighting.status", { subtype: "status", item_limit: 8, density: "compact" }),
    dashboardCard(context, "light", lights, "lighting.devices", { subtype: "devices", item_limit: 10, density: "compact" }),
    ...areaCards
  ];
  if (context.config.profile === "advanced" || context.config.profile === "lighting") return cards;
  return cards.filter((card) => layoutKey(card) !== "lighting.devices");
}

function layoutKey(card: LovelaceCardConfig): string {
  return String((card.view_layout as { key?: unknown } | undefined)?.key || "");
}

function emptyCard(title: string): LovelaceCardConfig {
  return { type: "markdown", content: `### ${title}\nNo matching entities yet.` };
}
