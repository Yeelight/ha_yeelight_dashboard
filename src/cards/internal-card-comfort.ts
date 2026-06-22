import { html, nothing, type TemplateResult } from "lit";

import { localize, stateText, type TranslationKey } from "../i18n";
import { actionFor, actionLabel, fireMoreInfo, type EntityAction } from "./actions";
import { preferMeaningfulEntities } from "./entity-priority";
import type { DashboardCardSummary, HomeAssistant, NormalizedEntity } from "./types";

export type ComfortRenderHost = HTMLElement & {
  hass?: HomeAssistant;
  runEntityAction(entity: NormalizedEntity, action: EntityAction): Promise<void>;
};

export function renderClimateBoard(host: ComfortRenderHost, summary: DashboardCardSummary, subtype: string | undefined, limit: number): TemplateResult {
  const entities = climateEntities(summary.entities, subtype).slice(0, limit);
  if (!entities.length) return empty(host, "empty.no_climate");
  const primary = entities[0];
  return html`
    <div class=${`comfort-board climate-board subtype-${subtype || "overview"}`}>
      <button class="comfort-feature climate-feature" type="button" @click=${() => fireMoreInfo(host, primary.entityId)}>
        <span class="comfort-gauge">
          <ha-icon .icon=${primary.icon}></ha-icon>
          <strong>${primaryValue(host.hass, primary)}</strong>
        </span>
        <span class="comfort-copy">
          <small>${localize(host.hass, "label.comfort_focus")}</small>
          <strong>${primary.name}</strong>
          <span>${climateDetail(host.hass, primary)}</span>
        </span>
      </button>
      <div class="comfort-grid">${entities.slice(1, limit).map((entity) => renderComfortReading(host, entity))}</div>
    </div>
  `;
}

export function renderAirBoard(host: ComfortRenderHost, summary: DashboardCardSummary, subtype: string | undefined, limit: number, showActions: boolean): TemplateResult {
  const entities = airEntities(summary.entities, subtype).slice(0, limit);
  if (!entities.length) return empty(host, "empty.no_air");
  const primary = entities[0];
  const action = showActions ? actionFor(primary) : "";
  return html`
    <div class=${`comfort-board air-board subtype-${subtype || "fan"}`}>
      <div class="comfort-feature air-feature">
        <button class="comfort-main" type="button" @click=${() => fireMoreInfo(host, primary.entityId)}>
          <span class="comfort-gauge">
            <ha-icon .icon=${primary.icon}></ha-icon>
            <strong>${primaryValue(host.hass, primary)}</strong>
          </span>
          <span class="comfort-copy">
            <small>${localize(host.hass, subtype === "humidifier" ? "label.humidity_focus" : "label.air_focus")}</small>
            <strong>${primary.name}</strong>
            <span>${stateText(host.hass, primary.state)}</span>
          </span>
        </button>
        ${action
          ? html`<button class="comfort-action" type="button" ?disabled=${!primary.available || primary.readOnly} @click=${() => host.runEntityAction(primary, action)}>
              ${actionLabel(host.hass, primary, action)}
            </button>`
          : nothing}
      </div>
      <div class="comfort-grid">${entities.slice(1, limit).map((entity) => renderComfortReading(host, entity))}</div>
    </div>
  `;
}

export function renderWaterBoard(host: ComfortRenderHost, summary: DashboardCardSummary, limit: number): TemplateResult {
  const entities = preferMeaningfulEntities(waterEntities(summary.entities)).slice(0, limit);
  if (!entities.length) return empty(host, "empty.no_water");
  const primary = entities[0];
  return html`
    <div class="comfort-board water-board subtype-purifier">
      <button class="comfort-feature water-feature" type="button" @click=${() => fireMoreInfo(host, primary.entityId)}>
        <span class="comfort-gauge">
          <ha-icon .icon=${primary.icon}></ha-icon>
          <strong>${primaryValue(host.hass, primary)}</strong>
        </span>
        <span class="comfort-copy">
          <small>${localize(host.hass, "label.water_focus")}</small>
          <strong>${primary.name}</strong>
          <span>${waterDetail(host.hass, primary)}</span>
        </span>
      </button>
      <div class="comfort-grid">${entities.slice(1, limit).map((entity) => renderComfortReading(host, entity))}</div>
    </div>
  `;
}

function renderComfortReading(host: ComfortRenderHost, entity: NormalizedEntity): TemplateResult {
  return html`
    <button class=${`comfort-reading ${entity.available ? "" : "muted"}`} type="button" @click=${() => fireMoreInfo(host, entity.entityId)}>
      <ha-icon .icon=${entity.icon}></ha-icon>
      <strong>${primaryValue(host.hass, entity)}</strong>
      <span>${entity.name}</span>
    </button>
  `;
}

function climateEntities(entities: NormalizedEntity[], subtype: string | undefined): NormalizedEntity[] {
  if (subtype === "single") return pickByDomain(entities, ["climate"]);
  return [...preferMeaningfulEntities(pickByDomain(entities, ["climate", "weather"])), ...preferMeaningfulEntities(entities.filter(isClimateReading))];
}

function airEntities(entities: NormalizedEntity[], subtype: string | undefined): NormalizedEntity[] {
  if (subtype === "humidifier") return [...preferMeaningfulEntities(pickByDomain(entities, ["humidifier"])), ...preferMeaningfulEntities(entities.filter(isHumidityOrAirReading))];
  return [...preferMeaningfulEntities(pickByDomain(entities, ["fan"])), ...preferMeaningfulEntities(entities.filter(isHumidityOrAirReading)), ...preferMeaningfulEntities(pickByDomain(entities, ["humidifier"]))];
}

function waterEntities(entities: NormalizedEntity[]): NormalizedEntity[] {
  return entities.filter((entity) => entity.domain === "sensor" || entity.domain === "binary_sensor");
}

function renderValue(value: unknown, unit: unknown): string {
  if (typeof value === "number" || typeof value === "string") return `${value}${unitText(unit)}`;
  return "";
}

function primaryValue(hass: HomeAssistant | undefined, entity: NormalizedEntity): string {
  const temperature = renderValue(entity.attributes.current_temperature, entity.attributes.temperature_unit || entity.attributes.unit_of_measurement);
  if (temperature) return temperature;
  if (entity.domain === "weather" && typeof entity.attributes.temperature !== "undefined") {
    return renderValue(entity.attributes.temperature, entity.attributes.temperature_unit || entity.attributes.unit_of_measurement);
  }
  return entity.domain === "sensor" ? sensorValue(hass, entity) : stateText(hass, entity.state);
}

function climateDetail(hass: HomeAssistant | undefined, entity: NormalizedEntity): string {
  const target = renderValue(entity.attributes.temperature, entity.attributes.temperature_unit || entity.attributes.unit_of_measurement);
  if (target) return `${localize(hass, "label.target_temperature")} ${target}`;
  return stateText(hass, entity.state);
}

function waterDetail(hass: HomeAssistant | undefined, entity: NormalizedEntity): string {
  if (entity.state === "on") return localize(hass, "label.water_attention");
  return stateText(hass, entity.state);
}

function sensorValue(hass: HomeAssistant | undefined, entity: NormalizedEntity): string {
  const unit = unitText(entity.attributes.unit_of_measurement);
  if (entity.state === "unknown" || entity.state === "unavailable") return stateText(hass, entity.state);
  return unit ? `${entity.state}${unit}` : stateText(hass, entity.state);
}

function unitText(unit: unknown): string {
  return typeof unit === "string" ? unit : "";
}

function isClimateReading(entity: NormalizedEntity): boolean {
  return entity.domain === "sensor" && (hasDeviceClass(entity, ["temperature", "humidity"]) || hasText(entity, /\b(temp|temperature|humidity|comfort|climate)\b/i));
}

function isHumidityOrAirReading(entity: NormalizedEntity): boolean {
  if (entity.domain !== "sensor" && entity.domain !== "binary_sensor") return false;
  return hasDeviceClass(entity, ["humidity", "pm1", "pm10", "pm25", "volatile_organic_compounds", "carbon_dioxide"]) || hasText(entity, /\b(air|aqi|pm2?5|pm10|co2|voc|humidity|hepa)\b/i);
}

function hasDeviceClass(entity: NormalizedEntity, values: string[]): boolean {
  return values.includes(String(entity.attributes.device_class || ""));
}

function hasText(entity: NormalizedEntity, pattern: RegExp): boolean {
  return pattern.test(`${entity.name} ${entity.entityId}`);
}

function pickByDomain(entities: NormalizedEntity[], domains: string[]): NormalizedEntity[] {
  return entities.filter((entity) => domains.includes(entity.domain));
}

function empty(host: ComfortRenderHost, key: TranslationKey): TemplateResult {
  return html`<div class="empty">${localize(host.hass, key)}</div>`;
}
