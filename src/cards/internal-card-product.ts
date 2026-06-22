import { html, nothing, type TemplateResult } from "lit";

import { localize, stateText, type TranslationKey } from "../i18n";
import { actionFor, actionLabel, fireMoreInfo, navigateToTarget, type EntityAction } from "./actions";
import { preferMeaningfulEntities } from "./entity-priority";
import type { DashboardAreaSummary, DashboardCardSummary, HomeAssistant, NormalizedEntity } from "./types";

export type ProductRenderHost = HTMLElement & {
  hass?: HomeAssistant;
  runEntityAction(entity: NormalizedEntity, action: EntityAction): Promise<void>;
};

export function renderDevicesBoard(
  host: ProductRenderHost,
  summary: DashboardCardSummary,
  areas: DashboardAreaSummary[],
  limit: number,
  showActions: boolean,
  renderAreaPill: (area: DashboardAreaSummary) => TemplateResult,
  subtype?: string
): TemplateResult {
  const source = [
    ...summary.controllable,
    ...summary.entities.filter((entity) => !summary.controllable.includes(entity) && !summary.routines.includes(entity))
  ];
  const devices = focusDevices(source, subtype).slice(0, subtype === "single" ? 1 : limit);
  if (!devices.length && !areas.length) return html`<div class="empty">${localize(host.hass, "empty.no_entities")}</div>`;
  const primary = primaryDevice(devices);
  return html`
    <div class="devices-board">
      ${areas.length ? html`<div class="area-strip compact-strip">${areas.slice(0, 3).map(renderAreaPill)}</div>` : nothing}
      ${primary ? renderDeviceFeature(host, primary, showActions) : nothing}
      ${devices.length ? renderDeviceLanes(host, devices) : nothing}
      ${devices.length ? html`<div class=${subtype === "list" ? "entity-list compact" : "device-grid"}>${devices.map((entity) => renderDeviceRow(host, entity, showActions))}</div>` : nothing}
    </div>
  `;
}

export function renderRoutinesBoard(
  host: ProductRenderHost,
  summary: DashboardCardSummary,
  limit: number,
  showActions: boolean,
  renderActionTile: (entity: NormalizedEntity) => TemplateResult,
  subtype?: string
): TemplateResult {
  const routines = focusRoutines(summary.routines, subtype);
  if (!routines.length) return html`<div class="empty">${localize(host.hass, "empty.no_routines")}</div>`;
  if (isSingleRoutineSubtype(subtype)) {
    return html`
      <div class="section-label">${routineLabel(host.hass, subtype)}</div>
      <div class="routine-board single">${renderRoutineFeature(host, routines[0], showActions)}</div>
    `;
  }
  const tiles = routines.slice(1, limit);
  return html`
    <div class="section-label">${routineLabel(host.hass, subtype)}</div>
    <div class="routine-board">
      <div class="routine-feature">${renderRoutineFeature(host, routines[0], showActions)}</div>
      ${renderRoutineChips(host, routines)}
      ${tiles.length ? html`<div class="quick-grid routine-grid">${tiles.map(renderActionTile)}</div>` : nothing}
    </div>
  `;
}

export function renderEnvironmentBoard(host: ProductRenderHost, summary: DashboardCardSummary, limit: number, subtype?: string): TemplateResult {
  const climate = summary.entities.filter((entity) => ["weather", "climate", "fan", "humidifier"].includes(entity.domain));
  const sensors = summary.entities.filter((entity) => ["sensor", "binary_sensor"].includes(entity.domain));
  if (subtype === "weather") {
    return renderEnvironmentFocus(host, focusEnvironment([...climate, ...sensors], subtype).slice(0, limit), "label.weather_focus");
  }
  if (subtype === "illuminance") {
    return renderEnvironmentFocus(host, focusEnvironment(sensors, subtype).slice(0, limit), "label.illuminance_focus");
  }
  if (subtype === "sensors") {
    return renderEnvironmentFocus(host, sensors.slice(0, limit), "label.sensor_focus");
  }
  const primary = [...preferMeaningfulEntities(climate), ...preferMeaningfulEntities(sensors)].slice(0, limit);
  if (!primary.length) return html`<div class="empty">${localize(host.hass, "empty.no_environment")}</div>`;
  return html`
    <div class="environment-board">
      <div class="environment-feature">${renderEnvironmentFeature(host, primary[0])}</div>
      ${renderEnvironmentZones(host, primary)}
      <div class="environment-grid">${primary.slice(1, 5).map((entity) => renderEnvironmentStat(host, entity))}</div>
    </div>
  `;
}

function primaryDevice(devices: NormalizedEntity[]): NormalizedEntity | undefined {
  return devices.find((entity) => !entity.available || entity.state === "unavailable" || entity.state === "unknown") || devices.find(isActiveDevice) || devices[0];
}

function focusDevices(devices: NormalizedEntity[], subtype: string | undefined): NormalizedEntity[] {
  if (subtype === "single") return devices;
  if (subtype === "universal") return devices.filter((entity) => entity.available);
  if (subtype === "activity") return [...devices.filter((entity) => entity.state === "on"), ...devices.filter((entity) => entity.state !== "on")];
  return devices;
}

function focusRoutines(routines: NormalizedEntity[], subtype: string | undefined): NormalizedEntity[] {
  if (subtype === "scripts") return routines.filter((entity) => entity.domain === "script");
  if (subtype === "automations") return routines.filter((entity) => entity.domain === "automation");
  if (subtype === "button") return routines.filter((entity) => entity.domain === "button");
  if (subtype === "schedule") return routines.filter((entity) => entity.domain === "schedule");
  if (subtype === "scene-single") return routines.filter((entity) => entity.domain === "scene");
  if (subtype === "automation-single") return routines.filter((entity) => entity.domain === "automation");
  if (subtype === "script-single") return routines.filter((entity) => entity.domain === "script");
  return routines;
}

function isSingleRoutineSubtype(subtype: string | undefined): boolean {
  return subtype === "scene-single" || subtype === "automation-single" || subtype === "script-single";
}

function routineLabel(hass: HomeAssistant | undefined, subtype: string | undefined): string {
  if (subtype === "scripts") return localize(hass, "label.script_actions");
  if (subtype === "automations") return localize(hass, "label.automation_actions");
  if (subtype === "button") return localize(hass, "label.button_actions");
  if (subtype === "schedule") return localize(hass, "label.schedule_actions");
  if (subtype === "commands") return localize(hass, "label.command_actions");
  return localize(hass, "label.quick_actions");
}

function renderDeviceFeature(host: ProductRenderHost, entity: NormalizedEntity, showActions: boolean): TemplateResult {
  const action = showActions ? actionFor(entity) : "";
  return html`
    <div class=${`device-feature ${entity.available ? "" : "muted"}`}>
      <button class="device-feature-main" type="button" @click=${() => fireMoreInfo(host, entity.entityId)}>
        <ha-icon .icon=${entity.icon}></ha-icon>
        <span>
          <small>${localize(host.hass, "label.device_focus")}</small>
          <strong>${entity.name}</strong>
          <em>${entity.domain} · ${stateText(host.hass, entity.state)}</em>
        </span>
      </button>
      ${action
        ? html`<button class="device-feature-action" ?disabled=${!entity.available || entity.readOnly} @click=${() => host.runEntityAction(entity, action)}>${actionLabel(host.hass, entity, action)}</button>`
        : nothing}
    </div>
  `;
}

function renderDeviceLanes(host: ProductRenderHost, devices: NormalizedEntity[]): TemplateResult {
  const lanes = [
    { icon: "mdi:flash-outline", labelKey: "label.active_devices" as TranslationKey, entities: devices.filter(isActiveDevice), tone: "hot" },
    { icon: "mdi:alert-circle-outline", labelKey: "label.attention_devices" as TranslationKey, entities: devices.filter((entity) => !entity.available || entity.state === "unknown"), tone: "warn" },
    { icon: "mdi:tune-variant", labelKey: "label.controllable_devices" as TranslationKey, entities: devices.filter((entity) => !!actionFor(entity)), tone: "ok" }
  ];
  return html`
    <div class="device-lanes">
      ${lanes.map(
        (lane) => html`
          <div class=${`device-lane ${lane.tone}`}>
            <ha-icon .icon=${lane.icon}></ha-icon>
            <strong>${lane.entities.length}</strong>
            <span>${localize(host.hass, lane.labelKey)}</span>
          </div>
        `
      )}
    </div>
  `;
}

function renderRoutineChips(host: ProductRenderHost, routines: NormalizedEntity[]): TemplateResult {
  const chips = [
    {
      icon: "mdi:movie-open-play",
      labelKey: "metric.scenes" as TranslationKey,
      entities: routines.filter((entity) => entity.domain === "scene"),
      target: { viewPath: "scenes", nativePath: "/config/scene/dashboard?historyBack=1" }
    },
    {
      icon: "mdi:script-text",
      labelKey: "label.script_actions" as TranslationKey,
      entities: routines.filter((entity) => entity.domain === "script"),
      target: { viewPath: "scenes", nativePath: "/config/entities?historyBack=1" }
    },
    {
      icon: "mdi:robot",
      labelKey: "label.automation_actions" as TranslationKey,
      entities: routines.filter((entity) => entity.domain === "automation"),
      target: { viewPath: "scenes", nativePath: "/config/entities?historyBack=1" }
    },
    {
      icon: "mdi:button-pointer",
      labelKey: "label.button_actions" as TranslationKey,
      entities: routines.filter((entity) => entity.domain === "button"),
      target: { viewPath: "scenes", nativePath: "/config/entities?historyBack=1" }
    }
  ];
  return html`
    <div class="routine-type-chips">
      ${chips.map(
        (chip) => html`
          ${chip.entities[0]
            ? html`
                <button
                  class=${chip.entities.length ? "active routine-chip-link" : "routine-chip-link"}
                  type="button"
                  data-view-path=${chip.target.viewPath}
                  data-native-path=${chip.target.nativePath}
                  aria-label=${`${localize(host.hass, chip.labelKey)} · ${localize(host.hass, "action.open_view")}`}
                  @click=${() => navigateToTarget(chip.target)}
                >
                  <ha-icon .icon=${chip.icon}></ha-icon>
                  <strong>${chip.entities.length}</strong>
                  <small>${localize(host.hass, chip.labelKey)}</small>
                </button>
              `
            : html`
                <span>
                  <ha-icon .icon=${chip.icon}></ha-icon>
                  <strong>${chip.entities.length}</strong>
                  <small>${localize(host.hass, chip.labelKey)}</small>
                </span>
              `}
        `
      )}
    </div>
  `;
}

function renderEnvironmentZones(host: ProductRenderHost, entities: NormalizedEntity[]): TemplateResult {
  const target = { viewPath: "environment", nativePath: "/history?historyBack=1" };
  const zones = [
    { icon: "mdi:weather-partly-cloudy", labelKey: "label.weather_focus" as TranslationKey, entities: entities.filter((entity) => entity.domain === "weather") },
    { icon: "mdi:thermometer-water", labelKey: "label.comfort_focus" as TranslationKey, entities: entities.filter(isComfortReading) },
    { icon: "mdi:air-filter", labelKey: "label.air_focus" as TranslationKey, entities: entities.filter(isAirReading) },
    { icon: "mdi:white-balance-sunny", labelKey: "label.illuminance_focus" as TranslationKey, entities: entities.filter(isIlluminanceReading) }
  ];
  return html`
    <div class="environment-zones">
      ${zones.map(
        (zone) => html`
          ${zone.entities[0]
            ? html`
                <button
                  class=${zone.entities.length ? "environment-zone active environment-zone-link" : "environment-zone-link"}
                  type="button"
                  data-view-path=${target.viewPath}
                  data-native-path=${target.nativePath}
                  aria-label=${`${localize(host.hass, zone.labelKey)} · ${localize(host.hass, "action.open_view")}`}
                  @click=${() => navigateToTarget(target)}
                >
                  <ha-icon .icon=${zone.icon}></ha-icon>
                  <strong>${zone.entities.length}</strong>
                  <span>${localize(host.hass, zone.labelKey)}</span>
                </button>
              `
            : html`
                <span class="environment-zone">
                  <ha-icon .icon=${zone.icon}></ha-icon>
                  <strong>${zone.entities.length}</strong>
                  <span>${localize(host.hass, zone.labelKey)}</span>
                </span>
              `}
        `
      )}
    </div>
  `;
}

function focusEnvironment(entities: NormalizedEntity[], subtype: string | undefined): NormalizedEntity[] {
  if (subtype === "weather") return entities.filter((entity) => entity.domain === "weather" || hasEntityText(entity, /\b(weather|temperature|humidity|forecast)\b/i));
  if (subtype === "illuminance") return entities.filter((entity) => hasEntityText(entity, /\b(illuminance|lux|lx|light level|brightness|照度)\b/i));
  return entities;
}

function renderEnvironmentFocus(host: ProductRenderHost, entities: NormalizedEntity[], labelKey: "label.weather_focus" | "label.illuminance_focus" | "label.sensor_focus"): TemplateResult {
  if (!entities.length) return html`<div class="empty">${localize(host.hass, "empty.no_environment")}</div>`;
  return html`
    <div class="section-label">${localize(host.hass, labelKey)}</div>
    <div class="environment-grid focus">${entities.map((entity) => renderEnvironmentStat(host, entity))}</div>
  `;
}

function renderRoutineFeature(host: ProductRenderHost, entity: NormalizedEntity, showActions: boolean): TemplateResult {
  const action = showActions ? actionFor(entity) : "";
  const disabled = !action || !entity.available || entity.readOnly;
  return html`
    <div class=${`routine-hero-action domain-${entity.domain} ${disabled ? "routine-disabled" : ""}`}>
      <button class="routine-feature-main" type="button" @click=${() => fireMoreInfo(host, entity.entityId)}>
        <ha-icon .icon=${entity.icon}></ha-icon>
        <span>${localize(host.hass, "label.featured_action")}</span>
        <strong>${entity.name}</strong>
        <small>${stateText(host.hass, entity.state)}</small>
      </button>
      ${action
        ? html`<button class="routine-feature-action" type="button" ?disabled=${disabled} @click=${() => host.runEntityAction(entity, action)}>${actionLabel(host.hass, entity, action)}</button>`
        : html`<span class="routine-feature-state">${stateText(host.hass, entity.state)}</span>`}
    </div>
  `;
}

function renderDeviceRow(host: ProductRenderHost, entity: NormalizedEntity, showActions: boolean): TemplateResult {
  const action = showActions ? actionFor(entity) : "";
  return html`
    <div class=${`device-row ${entity.available ? "" : "muted"}`}>
      <button class="entity-main entity-row-main" type="button" aria-label=${`${entity.name} · ${localize(host.hass, "action.more_info")}`} @click=${() => fireMoreInfo(host, entity.entityId)}>
        <ha-icon .icon=${entity.icon}></ha-icon>
        <span>
          <strong>${entity.name}</strong>
          <small>${entity.domain} · ${stateText(host.hass, entity.state)}</small>
        </span>
      </button>
      ${action
        ? html`<button class="text-action" ?disabled=${!entity.available || entity.readOnly} @click=${() => host.runEntityAction(entity, action)}>${actionLabel(host.hass, entity, action)}</button>`
        : nothing}
    </div>
  `;
}

function renderEnvironmentFeature(host: ProductRenderHost, entity: NormalizedEntity): TemplateResult {
  return html`
    <button class="environment-primary" type="button" @click=${() => fireMoreInfo(host, entity.entityId)}>
      <ha-icon .icon=${entity.icon}></ha-icon>
      <div>
        <span>${localize(host.hass, "label.primary_environment")}</span>
        <strong>${stateText(host.hass, entity.state)}</strong>
        <small>${entity.name}</small>
      </div>
    </button>
  `;
}

function renderEnvironmentStat(host: ProductRenderHost, entity: NormalizedEntity): TemplateResult {
  return html`
    <button class=${`environment-stat ${entity.available ? "" : "muted"}`} type="button" @click=${() => fireMoreInfo(host, entity.entityId)}>
      <ha-icon .icon=${entity.icon}></ha-icon>
      <strong>${stateText(host.hass, entity.state)}</strong>
      <span>${entity.name}</span>
    </button>
  `;
}

function hasEntityText(entity: NormalizedEntity, pattern: RegExp): boolean {
  return pattern.test(`${entity.name} ${entity.entityId} ${entity.state} ${String(entity.attributes.device_class || "")} ${String(entity.attributes.unit_of_measurement || "")}`);
}

function isActiveDevice(entity: NormalizedEntity): boolean {
  return ["on", "open", "playing", "home", "armed_home", "cool", "heat", "heating"].includes(entity.state);
}

function isComfortReading(entity: NormalizedEntity): boolean {
  return hasEntityText(entity, /\b(temperature|humidity|thermostat|climate|comfort|温度|湿度)\b/i);
}

function isAirReading(entity: NormalizedEntity): boolean {
  return hasEntityText(entity, /\b(pm25|pm2\.5|co2|voc|air|aqi|空气)\b/i);
}

function isIlluminanceReading(entity: NormalizedEntity): boolean {
  return hasEntityText(entity, /\b(illuminance|lux|lx|light level|brightness|照度)\b/i);
}
