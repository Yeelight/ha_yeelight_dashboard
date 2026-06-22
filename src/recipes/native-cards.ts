import { localize } from "../i18n";
import type { DashboardContext } from "../model/context";
import { domainOf } from "../model/registry";
import type { LovelaceCardConfig } from "../types";
import {
  cameraEntities,
  coverEntities,
  deviceEntities,
  domainEntities,
  environmentEntities,
  mapEntities,
  populatedAreas,
  securityEntities,
  vacuumEntities
} from "./entity-groups";

export const FOUNDATION_NATIVE_LEGACY_WIDGETS = [
  "native-card",
  "ha-entities-card",
  "ha-entity-card",
  "ha-button-card",
  "ha-entity-button-card",
  "ha-tile-card",
  "ha-glance-card",
  "ha-markdown-card",
  "ha-iframe-card",
  "ha-entity-filter-card",
  "ha-conditional-card",
  "ha-grid-card",
  "ha-horizontal-stack-card",
  "ha-vertical-stack-card",
  "ha-toggle-group-card",
  "ha-heading-card",
  "ha-clock-card",
  "ha-shortcut-card",
  "ha-empty-state-card",
  "ha-home-summary-card"
];

export const LIGHTING_NATIVE_LEGACY_WIDGETS = ["ha-light-card"];

export const AREA_NATIVE_LEGACY_WIDGETS = ["switch-devices", "cover-devices", "curtain-card", "sensor-devices", "vacuum", "ha-area-card"];

export const ROUTINE_NATIVE_LEGACY_WIDGETS = ["todos", "calendar", "ha-calendar-card", "ha-todo-card", "ha-shopping-list-card"];

export const ENVIRONMENT_NATIVE_LEGACY_WIDGETS = [
  "ha-weather-card",
  "ha-gauge-card",
  "ha-sensor-card",
  "ha-statistic-card",
  "ha-thermostat-card",
  "ha-humidifier-native-card",
  "ha-plant-status-card",
  "ha-energy-date-selection-card",
  "ha-energy-distribution-card",
  "ha-energy-devices-graph-card",
  "ha-energy-devices-detail-graph-card",
  "ha-energy-grid-neutrality-gauge-card",
  "ha-energy-grid-balance-card",
  "ha-energy-solar-consumed-gauge-card",
  "ha-energy-self-sufficiency-gauge-card",
  "ha-energy-solar-graph-card",
  "ha-energy-sources-table-card",
  "ha-energy-usage-graph-card",
  "ha-energy-gas-graph-card",
  "ha-energy-water-graph-card",
  "ha-energy-carbon-consumed-gauge-card",
  "ha-energy-compare-card",
  "ha-energy-sankey-card",
  "ha-water-sankey-card",
  "ha-water-flow-sankey-card",
  "ha-power-sources-graph-card",
  "ha-power-sankey-card"
];

export const MEDIA_NATIVE_LEGACY_WIDGETS = [
  "ha-media-card",
  "ha-picture-card",
  "ha-camera-card",
  "ha-picture-glance-card",
  "ha-picture-elements-card",
  "webrtc-camera-card"
];

export const HEALTH_NATIVE_LEGACY_WIDGETS = [
  "ha-statistics-card",
  "ha-history-card",
  "ha-logbook-card",
  "ha-map-card",
  "ha-alarm-panel-card",
  "ha-repairs-card",
  "ha-updates-card",
  "ha-discovered-devices-card",
  "ha-distribution-card"
];

export const NATIVE_RECIPE_LEGACY_WIDGETS = [
  ...FOUNDATION_NATIVE_LEGACY_WIDGETS,
  ...LIGHTING_NATIVE_LEGACY_WIDGETS,
  ...AREA_NATIVE_LEGACY_WIDGETS,
  ...ROUTINE_NATIVE_LEGACY_WIDGETS,
  ...ENVIRONMENT_NATIVE_LEGACY_WIDGETS,
  ...MEDIA_NATIVE_LEGACY_WIDGETS,
  ...HEALTH_NATIVE_LEGACY_WIDGETS
];

export function tiles(entities: string[], keyPrefix = "entity"): LovelaceCardConfig[] {
  return entities.map((entity) => ({
    type: "tile",
    entity,
    tap_action: moreInfoAction(),
    view_layout: { key: `${keyPrefix}.${entity}` },
    grid_options: { columns: 3, rows: 1 }
  }));
}

export function lightingNativeCards(context: DashboardContext): LovelaceCardConfig[] {
  return domainEntities(context, "light")
    .slice(0, 2)
    .map((entity) => ({
      type: "light",
      entity,
      tap_action: moreInfoAction(),
      view_layout: { key: `lighting.native.light.${entity}` },
      grid_options: { columns: 6, rows: 3 }
    }));
}

export function areaNativeCards(context: DashboardContext): LovelaceCardConfig[] {
  const devices = deviceEntities(context).slice(0, 8);
  return [
    ...populatedAreas(context)
      .slice(0, 4)
      .map((area) => ({
        type: "area",
        area: area.area_id,
        navigation_path: areaPath(area.area_id),
        tap_action: navigateAction(areaPath(area.area_id)),
        view_layout: { key: `area.native.${area.area_id}` },
        grid_options: { columns: 6, rows: 3 }
      })),
    ...nativeEntitySummaryCards(context, devices, "areas"),
    ...tiles([...coverEntities(context), ...vacuumEntities(context)].slice(0, 12), "areas.native")
  ];
}

export function routineNativeEntities(context: DashboardContext): string[] {
  return [...domainEntities(context, "calendar"), ...domainEntities(context, "todo")];
}

export function routineNativeCards(context: DashboardContext, keyPrefix = "routines"): LovelaceCardConfig[] {
  return [
    ...calendarCards(domainEntities(context, "calendar").slice(0, 2), keyPrefix),
    ...todoCards(domainEntities(context, "todo").slice(0, 2), keyPrefix)
  ];
}

export function environmentNativeCards(context: DashboardContext): LovelaceCardConfig[] {
  const sensors = domainEntities(context, "sensor");
  const numericSensors = sensors.filter((entity) => isNumericState(context, entity));
  const gaugeSensor = numericSensors.find((entity) => isPercentSensor(context, entity)) || numericSensors[0];
  const lineSensor = numericSensors.find((entity) => entity !== gaugeSensor) || gaugeSensor;
  return [
    ...weatherCards(domainEntities(context, "weather").slice(0, 2)),
    ...domainEntities(context, "climate")
      .slice(0, 2)
      .map((entity) => ({ type: "thermostat", entity, tap_action: moreInfoAction(), view_layout: { key: `environment.thermostat.${entity}` }, grid_options: { columns: 6, rows: 3 } })),
    ...domainEntities(context, "humidifier")
      .slice(0, 2)
      .map((entity) => ({ type: "humidifier", entity, tap_action: moreInfoAction(), view_layout: { key: `environment.humidifier.${entity}` }, grid_options: { columns: 6, rows: 3 } })),
    ...optionalEntityCard(gaugeSensor, (entity) => ({
      type: "gauge",
      entity,
      min: 0,
      max: isPercentSensor(context, entity) ? 100 : Number(context.hass?.states[entity]?.state) || 100,
      tap_action: moreInfoAction(),
      view_layout: { key: `environment.gauge.${entity}` },
      grid_options: { columns: 3, rows: 3 }
    })),
    ...optionalEntityCard(lineSensor, (entity) => ({ type: "sensor", entity, graph: "line", tap_action: moreInfoAction(), view_layout: { key: `environment.sensor.${entity}` }, grid_options: { columns: 3, rows: 2 } }))
  ];
}

export function mediaNativeCards(context: DashboardContext): LovelaceCardConfig[] {
  return [
    ...domainEntities(context, "media_player")
      .slice(0, 4)
      .map((entity) => ({ type: "media-control", entity, tap_action: moreInfoAction(), view_layout: { key: `media.native.${entity}` }, grid_options: { columns: 6, rows: 3 } })),
    ...cameraEntities(context)
      .slice(0, 2)
      .map((entity) => ({ type: "picture-entity", entity, camera_view: "auto", tap_action: moreInfoAction(), view_layout: { key: `media.native.camera.${entity}` }, grid_options: { columns: 6, rows: 4 } }))
  ];
}

export function healthNativeCards(context: DashboardContext): LovelaceCardConfig[] {
  return [
    ...tiles([...domainEntities(context, "update"), ...context.index.unassignedEntities.filter((entity) => context.entities.includes(entity)).slice(0, 8)], "health.entity"),
    ...routineNativeCards(context, "health"),
    ...alarmPanelCards(context),
    ...logbookCards(healthActivityEntities(context).slice(0, 8)),
    ...mapCards(mapEntities(context).slice(0, 8)),
    ...historyCards(domainEntities(context, "sensor").slice(0, 4)),
    ...nativeEntitySummaryCards(context, [...domainEntities(context, "update"), ...environmentEntities(context)].slice(0, 8), "health")
  ];
}

function nativeEntitySummaryCards(context: DashboardContext, entities: string[], keyPrefix: string): LovelaceCardConfig[] {
  if (!entities.length) return [];
  const title = localize(context.hass, keyPrefix === "areas" ? "section.devices" : "section.health");
  return [
    { type: "entities", title, entities, tap_action: moreInfoAction(), view_layout: { key: `${keyPrefix}.native.entities` }, grid_options: { columns: 6, rows: 4 } },
    { type: "glance", title, entities: entities.slice(0, 6), tap_action: moreInfoAction(), view_layout: { key: `${keyPrefix}.native.glance` }, grid_options: { columns: 6, rows: 3 } }
  ];
}

function weatherCards(entities: string[]): LovelaceCardConfig[] {
  return entities.map((entity) => ({
    type: "weather-forecast",
    entity,
    tap_action: moreInfoAction(),
    view_layout: { key: `weather.${entity}` },
    grid_options: { columns: 6, rows: 3 }
  }));
}

function calendarCards(entities: string[], keyPrefix: string): LovelaceCardConfig[] {
  return entities.map((entity) => ({
    type: "calendar",
    entities: [entity],
    tap_action: moreInfoAction(),
    view_layout: { key: `${keyPrefix}.calendar.${entity}` },
    grid_options: { columns: 6, rows: 3 }
  }));
}

function todoCards(entities: string[], keyPrefix: string): LovelaceCardConfig[] {
  return entities.map((entity) => ({
    type: "todo-list",
    entity,
    tap_action: moreInfoAction(),
    view_layout: { key: `${keyPrefix}.todo.${entity}` },
    grid_options: { columns: 6, rows: 3 }
  }));
}

function alarmPanelCards(context: DashboardContext): LovelaceCardConfig[] {
  return domainEntities(context, "alarm_control_panel")
    .slice(0, 1)
    .map((entity) => ({ type: "alarm-panel", entity, tap_action: moreInfoAction(), view_layout: { key: `health.alarm.${entity}` }, grid_options: { columns: 6, rows: 3 } }));
}

function logbookCards(entities: string[]): LovelaceCardConfig[] {
  if (!entities.length) return [];
  return [
    {
      type: "logbook",
      entities,
      hours_to_show: 24,
      tap_action: moreInfoAction(),
      view_layout: { key: "health.logbook" },
      grid_options: { columns: 6, rows: 4 }
    }
  ];
}

function mapCards(entities: string[]): LovelaceCardConfig[] {
  if (!entities.length) return [];
  return [
    {
      type: "map",
      entities,
      hours_to_show: 12,
      default_zoom: 14,
      tap_action: moreInfoAction(),
      view_layout: { key: "health.map" },
      grid_options: { columns: 6, rows: 4 }
    }
  ];
}

function historyCards(entities: string[]): LovelaceCardConfig[] {
  if (!entities.length) return [];
  return [
    {
      type: "history-graph",
      entities,
      tap_action: moreInfoAction(),
      view_layout: { key: "health.history" },
      grid_options: { columns: 6, rows: 3 }
    },
    {
      type: "statistics-graph",
      entities,
      tap_action: moreInfoAction(),
      view_layout: { key: "health.statistics" },
      grid_options: { columns: 6, rows: 3 }
    }
  ];
}

function healthActivityEntities(context: DashboardContext): string[] {
  return [
    ...domainEntities(context, "update"),
    ...domainEntities(context, "automation"),
    ...domainEntities(context, "scene"),
    ...securityEntities(context)
  ];
}

function optionalEntityCard(entity: string | undefined, build: (entity: string) => LovelaceCardConfig): LovelaceCardConfig[] {
  return entity ? [build(entity)] : [];
}

function isPercentSensor(context: DashboardContext, entityId: string): boolean {
  const attributes = context.hass?.states[entityId]?.attributes || {};
  return attributes.unit_of_measurement === "%" || /\b(battery|humidity)\b/i.test(String(attributes.device_class || ""));
}

function isNumericState(context: DashboardContext, entityId: string): boolean {
  return domainOf(entityId) === "sensor" && Number.isFinite(Number(context.hass?.states[entityId]?.state));
}

function moreInfoAction(): Record<string, string> {
  return { action: "more-info" };
}

function navigateAction(path: string): Record<string, string> {
  return { action: "navigate", navigation_path: path };
}

function areaPath(areaId: string): string {
  return `/home/areas-${encodeURIComponent(areaId)}?historyBack=1`;
}
