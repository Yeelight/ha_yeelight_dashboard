import { domainOf, isAvailable } from "../model/registry";
import type { DashboardCardSummary, NormalizedEntity } from "./types";
import type { HassEntity, HomeAssistant } from "../types";

const READ_ONLY_DOMAINS = new Set(["sensor", "binary_sensor", "event", "update", "weather", "camera", "person", "device_tracker", "alarm_control_panel", "lock", "schedule"]);
const ACTION_DOMAINS = new Set(["scene", "button"]);
const CONTROL_DOMAINS = new Set(["light", "switch", "fan", "cover", "climate", "humidifier", "media_player", "remote", "lock"]);

export function normalizeEntity(hass: HomeAssistant | undefined, entityId: string | undefined): NormalizedEntity | undefined {
  if (!hass || !entityId) return undefined;
  const stateObj = hass.states[entityId];
  if (!stateObj) return undefined;
  const domain = domainOf(entityId);
  return {
    entityId,
    domain,
    state: stateObj.state,
    name: entityName(stateObj),
    icon: iconFor(stateObj, domain),
    available: hass.connected !== false && (isAvailable(stateObj) || ACTION_DOMAINS.has(domain)),
    readOnly: READ_ONLY_DOMAINS.has(domain),
    attributes: stateObj.attributes ?? {}
  };
}

export function summarizeEntities(hass: HomeAssistant | undefined, entityIds: string[]): DashboardCardSummary {
  const entities = entityIds.map((entityId) => normalizeEntity(hass, entityId)).filter((entity): entity is NormalizedEntity => !!entity);
  const lights = entities.filter((entity) => entity.domain === "light");
  const unavailable = entities.filter((entity) => entity.state === "unavailable");
  const unknown = entities.filter((entity) => entity.state === "unknown");
  const updates = entities.filter((entity) => entity.domain === "update" && entity.state === "on");
  return {
    entities,
    lights,
    activeLights: lights.filter((entity) => entity.state === "on"),
    routines: entities.filter((entity) => ["scene", "script", "automation", "button", "schedule"].includes(entity.domain)),
    controllable: entities.filter((entity) => CONTROL_DOMAINS.has(entity.domain)),
    updates,
    unknown,
    issues: uniqueEntities([...unavailable, ...updates]),
    unavailable,
    online: entities.filter((entity) => entity.available)
  };
}

export function actionableEntities(summary: DashboardCardSummary): NormalizedEntity[] {
  return [...summary.activeLights, ...summary.routines, ...summary.unavailable].slice(0, 6);
}

function uniqueEntities(entities: NormalizedEntity[]): NormalizedEntity[] {
  const seen = new Set<string>();
  return entities.filter((entity) => {
    if (seen.has(entity.entityId)) return false;
    seen.add(entity.entityId);
    return true;
  });
}

function entityName(stateObj: HassEntity): string {
  const name = stateObj.attributes?.friendly_name;
  return typeof name === "string" && name.trim() ? name : stateObj.entity_id;
}

function iconFor(stateObj: HassEntity, domain: string): string {
  if (typeof stateObj.attributes?.icon === "string" && stateObj.attributes.icon) return stateObj.attributes.icon;
  return (
    {
      light: "mdi:lightbulb",
      switch: "mdi:toggle-switch",
      cover: "mdi:curtains",
      climate: "mdi:thermostat",
      fan: "mdi:fan",
      humidifier: "mdi:air-humidifier",
      weather: "mdi:weather-partly-cloudy",
      sensor: "mdi:gauge",
      binary_sensor: "mdi:checkbox-marked-circle-outline",
      event: "mdi:calendar-alert",
      scene: "mdi:movie-open-play",
      script: "mdi:script-text",
      automation: "mdi:robot",
      button: "mdi:button-pointer",
      schedule: "mdi:calendar-clock",
      update: "mdi:update",
      media_player: "mdi:play-circle",
      remote: "mdi:remote",
      camera: "mdi:cctv",
      alarm_control_panel: "mdi:shield-home",
      lock: "mdi:lock",
      person: "mdi:account",
      device_tracker: "mdi:crosshairs-gps"
    }[domain] ?? "mdi:devices"
  );
}
