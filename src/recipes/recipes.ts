import type { DashboardContext } from "../model/context";
import { domainOf, entityName, isAvailable } from "../model/registry";
import { gridOptionsForKind } from "../cards/grid-options";
import { localize } from "../i18n";
import type { DashboardAreaSummary, DashboardCardKind } from "../cards/types";
import type { LovelaceCardConfig, LovelaceSectionConfig } from "../types";

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
    sourceLegacyWidgets: ["hero", "status", "notice", "rooms", "favorite-lights", "quick-scenes", "ecosystem", "health"],
    match: () => true,
    build: (context) => [
      section(localize(context.hass, "section.home"), [
        dashboardCard(context, "hero", context.entities, "overview.hero", { area_summaries: areaSummaries(context) }),
        dashboardCard(context, "status", context.entities, "overview.status", { area_summaries: areaSummaries(context) })
      ]),
      section(localize(context.hass, "section.control"), [
        dashboardCard(context, "light", domainEntities(context, "light"), "overview.lights"),
        dashboardCard(context, "rooms", context.entities, "overview.rooms", { area_summaries: areaSummaries(context) })
      ]),
      section(localize(context.hass, "section.operations"), [
        dashboardCard(context, "routines", routineEntities(context), "overview.routines"),
        dashboardCard(context, "notice", context.entities, "overview.notice"),
        dashboardCard(context, "ecosystem", context.entities, "overview.ecosystem", { area_summaries: areaSummaries(context) }),
        dashboardCard(context, "health", context.entities, "overview.health")
      ])
    ]
  },
  {
    id: "lighting-native",
    target: "lighting",
    priority: 20,
    sourceLegacyWidgets: ["favorite-lights", "light-status-card", "light-overview-card", "light-devices"],
    match: (context) => domainEntities(context, "light").length > 0,
    build: (context) => [section(localize(context.hass, "section.lighting"), [dashboardCard(context, "light", domainEntities(context, "light"), "lighting.overview"), ...tiles(domainEntities(context, "light").slice(0, 12))])]
  },
  {
    id: "areas-product",
    target: "areas",
    priority: 30,
    sourceLegacyWidgets: ["rooms", "room-card", "room-devices", "devices", "device-list", "device-single", "universal-card"],
    match: (context) => context.index.areas.length > 0,
    build: (context) => [
      section(localize(context.hass, "section.devices"), [
        dashboardCard(context, "devices", deviceEntities(context), "areas.devices", { area_summaries: areaSummaries(context) }),
        dashboardCard(context, "rooms", context.entities, "areas.rooms", { area_summaries: areaSummaries(context) })
      ]),
      ...populatedAreas(context).slice(0, 8).map((area) =>
        section(area.name, [
          dashboardCard(context, "room", visibleAreaEntities(context, area.area_id), `area.${area.area_id}.summary`, {
            title: area.name,
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
    sourceLegacyWidgets: ["quick-scenes", "scene-list", "quick-command-card", "script-panel", "automations", "scene-single-card", "automation-single-card", "script-single-card", "button-card"],
    match: (context) => routineEntities(context).length > 0,
    build: (context) => [
      section(localize(context.hass, "section.routines"), [
        dashboardCard(context, "routines", routineEntities(context), "routines.summary"),
        ...routineEntities(context).slice(0, context.config.preferences.scene_limit).map(entityButton)
      ])
    ]
  },
  {
    id: "environment-product",
    target: "environment",
    priority: 50,
    sourceLegacyWidgets: ["sensor-card", "illuminance-card", "weather-card", "climate-card", "fan-card", "humidifier-card", "water-purifier-card"],
    match: (context) => environmentEntities(context).length > 0,
    build: (context) => [
      section(localize(context.hass, "section.environment"), [
        dashboardCard(context, "environment", environmentEntities(context), "environment.summary"),
        ...weatherCards(domainEntities(context, "weather").slice(0, 2)),
        ...tiles(["climate", "fan", "humidifier", "sensor", "binary_sensor"].flatMap((domain) => domainEntities(context, domain)).slice(0, 12))
      ])
    ]
  },
  {
    id: "media-native",
    target: "media",
    priority: 60,
    sourceLegacyWidgets: ["media", "media-player-card", "broadcast-radio-card", "remote-card"],
    match: (context) => domainEntities(context, "media_player").length > 0,
    build: (context) => [section(localize(context.hass, "section.media"), domainEntities(context, "media_player").slice(0, 6).map((entity) => ({ type: "media-control", entity })))]
  },
  {
    id: "health-native",
    target: "health",
    priority: 70,
    sourceLegacyWidgets: ["ecosystem", "health", "updates-card", "repairs-backup-card", "events", "history"],
    match: () => true,
    build: (context) => [
      section(localize(context.hass, "section.health"), [
        dashboardCard(context, "ecosystem", context.entities, "health.ecosystem", { area_summaries: areaSummaries(context) }),
        dashboardCard(context, "notice", context.entities, "health.notices"),
        dashboardCard(context, "health", context.entities, "health.summary"),
        ...tiles([...domainEntities(context, "update"), ...context.index.unassignedEntities.filter((entity) => context.entities.includes(entity)).slice(0, 8)]),
        ...calendarCards(domainEntities(context, "calendar").slice(0, 2)),
        ...todoCards(domainEntities(context, "todo").slice(0, 2)),
        ...historyCards(domainEntities(context, "sensor").slice(0, 4))
      ])
    ]
  }
];

export function buildRecipeSections(target: RecipeTarget, context: DashboardContext): LovelaceSectionConfig[] {
  return RECIPES.filter((recipe) => recipe.target === target && recipe.match(context))
    .sort((a, b) => a.priority - b.priority)
    .flatMap((recipe) => recipe.build(context));
}

function dashboardCard(context: DashboardContext, kind: DashboardCardKind, entities: string[], layoutKey: string, config: Record<string, unknown> = {}): LovelaceCardConfig {
  return {
    type: `custom:yeelight-dashboard-${kind}-card`,
    title: localize(context.hass, `card.${kind}.title`),
    entities,
    ...config,
    view_layout: { key: layoutKey },
    grid_options: gridOptionsForKind(kind)
  };
}

function section(title: string, cards: LovelaceCardConfig[]): LovelaceSectionConfig {
  return { type: "grid", title, cards: cards.length ? cards : [emptyCard(title)] };
}

function tiles(entities: string[]): LovelaceCardConfig[] {
  return entities.map((entity) => ({ type: "tile", entity, view_layout: { key: `entity.${entity}` }, grid_options: { columns: 3, rows: 1 } }));
}

function entityButton(entity: string): LovelaceCardConfig {
  return { type: "button", entity, name: entity.split(".")[1], view_layout: { key: `routine.${entity}` }, grid_options: { columns: 3, rows: 2 } };
}

function weatherCards(entities: string[]): LovelaceCardConfig[] {
  return entities.map((entity) => ({
    type: "weather-forecast",
    entity,
    view_layout: { key: `weather.${entity}` },
    grid_options: { columns: 6, rows: 3 }
  }));
}

function calendarCards(entities: string[]): LovelaceCardConfig[] {
  return entities.map((entity) => ({
    type: "calendar",
    entities: [entity],
    view_layout: { key: `calendar.${entity}` },
    grid_options: { columns: 6, rows: 3 }
  }));
}

function todoCards(entities: string[]): LovelaceCardConfig[] {
  return entities.map((entity) => ({
    type: "todo-list",
    entity,
    view_layout: { key: `todo.${entity}` },
    grid_options: { columns: 6, rows: 3 }
  }));
}

function historyCards(entities: string[]): LovelaceCardConfig[] {
  if (!entities.length) return [];
  return [
    {
      type: "history-graph",
      entities,
      view_layout: { key: "health.history" },
      grid_options: { columns: 6, rows: 3 }
    },
    {
      type: "statistics-graph",
      entities,
      view_layout: { key: "health.statistics" },
      grid_options: { columns: 6, rows: 3 }
    }
  ];
}

function emptyCard(title: string): LovelaceCardConfig {
  return { type: "markdown", content: `### ${title}\nNo matching entities yet.` };
}

function domainEntities(context: DashboardContext, domain: string): string[] {
  return context.entities.filter((entityId) => domainOf(entityId) === domain && shouldShow(context, entityId));
}

function routineEntities(context: DashboardContext): string[] {
  return ["scene", "script", "automation", "button"].flatMap((domain) => domainEntities(context, domain));
}

function deviceEntities(context: DashboardContext): string[] {
  return ["light", "switch", "cover", "climate", "fan", "humidifier", "media_player", "lock", "sensor", "binary_sensor"].flatMap((domain) =>
    domainEntities(context, domain)
  );
}

function environmentEntities(context: DashboardContext): string[] {
  return ["weather", "climate", "fan", "humidifier", "sensor", "binary_sensor"].flatMap((domain) => domainEntities(context, domain));
}

function shouldShow(context: DashboardContext, entityId: string): boolean {
  return context.config.preferences.show_offline || isAvailable(context.hass?.states[entityId]);
}

function visibleAreas(context: DashboardContext): typeof context.index.areas {
  if (context.config.area_mode !== "selected" || !context.config.selected_areas.length) return context.index.areas;
  const selected = new Set(context.config.selected_areas);
  return context.index.areas.filter((area) => selected.has(area.area_id));
}

function populatedAreas(context: DashboardContext): typeof context.index.areas {
  const areas = visibleAreas(context).filter((area) => visibleAreaEntities(context, area.area_id).length > 0);
  return areas.length ? areas : visibleAreas(context);
}

function visibleAreaEntities(context: DashboardContext, areaId: string): string[] {
  const allowed = new Set(context.entities);
  return (context.index.entitiesByArea.get(areaId) || []).filter((entity) => allowed.has(entity));
}

function featuredAreaEntities(context: DashboardContext, areaId: string): string[] {
  return visibleAreaEntities(context, areaId).sort((a, b) => entityRank(a) - entityRank(b));
}

function entityRank(entityId: string): number {
  return (
    {
      light: 0,
      scene: 1,
      script: 2,
      automation: 3,
      button: 4,
      switch: 5,
      fan: 6,
      climate: 7,
      cover: 8,
      sensor: 9,
      binary_sensor: 10,
      update: 11
    }[domainOf(entityId)] ?? 20
  );
}

function areaSummaries(context: DashboardContext): DashboardAreaSummary[] {
  return populatedAreas(context)
    .map((area) => areaSummary(context, area.area_id, area.name))
    .sort((a, b) => b.activeLightCount - a.activeLightCount || b.entityCount - a.entityCount || a.name.localeCompare(b.name))
    .slice(0, 6);
}

function areaSummary(context: DashboardContext, areaId: string, name: string): DashboardAreaSummary {
  const entities = visibleAreaEntities(context, areaId).filter((entity) => shouldShow(context, entity));
  const lights = entities.filter((entity) => domainOf(entity) === "light");
  const routines = entities.filter((entity) => ["scene", "script", "automation", "button"].includes(domainOf(entity)));
  const issues = entities.filter((entity) => context.hass?.states[entity]?.state === "unavailable" || (domainOf(entity) === "update" && context.hass?.states[entity]?.state === "on"));
  return {
    areaId,
    name,
    entityCount: entities.length,
    lightCount: lights.length,
    activeLightCount: lights.filter((entity) => context.hass?.states[entity]?.state === "on").length,
    routineCount: routines.length,
    issueCount: issues.length
  };
}

export function entityTitle(context: DashboardContext, entityId: string): string {
  return entityName(context.hass?.states[entityId]);
}
