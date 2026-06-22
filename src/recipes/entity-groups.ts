import type { DashboardAreaSummary } from "../cards/types";
import type { DashboardContext } from "../model/context";
import { domainOf, entityName, isAvailable } from "../model/registry";

export function domainEntities(context: DashboardContext, domain: string): string[] {
  return context.entities.filter((entityId) => domainOf(entityId) === domain && shouldShow(context, entityId));
}

export function routineEntities(context: DashboardContext): string[] {
  return ["scene", "script", "automation", "button", "schedule"].flatMap((domain) => domainEntities(context, domain));
}

export function deviceEntities(context: DashboardContext): string[] {
  return ["light", "switch", "cover", "vacuum", "climate", "fan", "humidifier", "media_player", "remote", "lock", "sensor", "binary_sensor"].flatMap((domain) =>
    domainEntities(context, domain)
  );
}

export function environmentEntities(context: DashboardContext): string[] {
  return ["weather", "climate", "fan", "humidifier", "sensor", "binary_sensor"].flatMap((domain) => domainEntities(context, domain));
}

export function climateEntities(context: DashboardContext): string[] {
  return ["climate", "weather", "sensor"].flatMap((domain) => domainEntities(context, domain)).filter((entity) => isClimateEntity(context, entity));
}

export function airEntities(context: DashboardContext): string[] {
  return ["fan", "humidifier", "sensor", "binary_sensor"].flatMap((domain) => domainEntities(context, domain)).filter((entity) => isAirEntity(context, entity));
}

export function waterEntities(context: DashboardContext): string[] {
  return ["sensor", "binary_sensor"].flatMap((domain) => domainEntities(context, domain)).filter((entity) => isWaterEntity(context, entity));
}

export function powerEntities(context: DashboardContext): string[] {
  return ["switch", "sensor"].flatMap((domain) => domainEntities(context, domain)).filter((entity) => isPowerEntity(context, entity));
}

export function energyEntities(context: DashboardContext): string[] {
  return domainEntities(context, "sensor").filter((entity) => isEnergyEntity(context, entity));
}

export function infrastructureEntities(context: DashboardContext): string[] {
  return ["sensor", "binary_sensor", "update"].flatMap((domain) => domainEntities(context, domain)).filter((entity) => isInfrastructureEntity(context, entity));
}

export function mediaEntities(context: DashboardContext): string[] {
  return ["media_player", "remote"].flatMap((domain) => domainEntities(context, domain));
}

export function cameraEntities(context: DashboardContext): string[] {
  return domainEntities(context, "camera");
}

export function noteEntities(context: DashboardContext): string[] {
  return ["sensor", "binary_sensor", "update"].flatMap((domain) => domainEntities(context, domain)).filter((entity) => isNoteEntity(context, entity));
}

export function coverEntities(context: DashboardContext): string[] {
  return domainEntities(context, "cover");
}

export function vacuumEntities(context: DashboardContext): string[] {
  return domainEntities(context, "vacuum");
}

export function mapEntities(context: DashboardContext): string[] {
  return ["person", "device_tracker"].flatMap((domain) => domainEntities(context, domain));
}

export function securityEntities(context: DashboardContext): string[] {
  return ["alarm_control_panel", "lock", "binary_sensor", "sensor"].flatMap((domain) => domainEntities(context, domain)).filter((entity) => isSecurityEntity(context, entity));
}

export function presenceEntities(context: DashboardContext): string[] {
  return ["person", "device_tracker", "binary_sensor", "sensor"].flatMap((domain) => domainEntities(context, domain)).filter((entity) => isPresenceEntity(context, entity));
}

export function populatedAreas(context: DashboardContext): typeof context.index.areas {
  const areas = visibleAreas(context).filter((area) => visibleAreaEntities(context, area.area_id).length > 0);
  return areas.length ? areas : visibleAreas(context);
}

export function visibleAreaEntities(context: DashboardContext, areaId: string): string[] {
  const allowed = new Set(context.entities);
  return (context.index.entitiesByArea.get(areaId) || []).filter((entity) => allowed.has(entity));
}

export function featuredAreaEntities(context: DashboardContext, areaId: string): string[] {
  return visibleAreaEntities(context, areaId).sort((a, b) => entityRank(a) - entityRank(b));
}

export function areaSummaries(context: DashboardContext): DashboardAreaSummary[] {
  return populatedAreas(context)
    .map((area) => areaSummary(context, area.area_id, area.name))
    .sort((a, b) => b.activeLightCount - a.activeLightCount || b.entityCount - a.entityCount || a.name.localeCompare(b.name))
    .slice(0, 6);
}

export function areaSummary(context: DashboardContext, areaId: string, name: string): DashboardAreaSummary {
  const entities = visibleAreaEntities(context, areaId).filter((entity) => shouldShow(context, entity));
  const lights = entities.filter((entity) => domainOf(entity) === "light");
  const routines = entities.filter((entity) => ["scene", "script", "automation", "button", "schedule"].includes(domainOf(entity)));
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

function shouldShow(context: DashboardContext, entityId: string): boolean {
  return context.config.preferences.show_offline || isAvailable(context.hass?.states[entityId]);
}

function visibleAreas(context: DashboardContext): typeof context.index.areas {
  if (context.config.area_mode !== "selected" || !context.config.selected_areas.length) return context.index.areas;
  const selected = new Set(context.config.selected_areas);
  return context.index.areas.filter((area) => selected.has(area.area_id));
}

function entityRank(entityId: string): number {
  return (
    {
      light: 0,
      scene: 1,
      script: 2,
      automation: 3,
      button: 4,
      schedule: 4.5,
      switch: 5,
      fan: 6,
      climate: 7,
      cover: 8,
      vacuum: 9,
      media_player: 10,
      remote: 11,
      camera: 12,
      alarm_control_panel: 13,
      lock: 14,
      sensor: 15,
      binary_sensor: 16,
      person: 17,
      device_tracker: 18,
      update: 19
    }[domainOf(entityId)] ?? 20
  );
}

function isSecurityEntity(context: DashboardContext, entityId: string): boolean {
  const domain = domainOf(entityId);
  if (domain === "alarm_control_panel" || domain === "lock") return true;
  return /\b(door|window|lock|alarm|security|smoke|gas|tamper|opening)\b/i.test(entityText(context, entityId));
}

function isPresenceEntity(context: DashboardContext, entityId: string): boolean {
  const domain = domainOf(entityId);
  if (domain === "person" || domain === "device_tracker") return true;
  return /\b(motion|occupancy|presence|people|person|family|home)\b/i.test(entityText(context, entityId));
}

function isClimateEntity(context: DashboardContext, entityId: string): boolean {
  const domain = domainOf(entityId);
  if (domain === "climate" || domain === "weather") return true;
  return /\b(temp|temperature|humidity|climate|thermostat|comfort)\b/i.test(entityText(context, entityId));
}

function isAirEntity(context: DashboardContext, entityId: string): boolean {
  const domain = domainOf(entityId);
  if (domain === "fan" || domain === "humidifier") return true;
  return /\b(air|aqi|pm2?5|pm10|co2|voc|humidity|humidifier|fan|hepa)\b/i.test(entityText(context, entityId));
}

function isWaterEntity(context: DashboardContext, entityId: string): boolean {
  return /\b(water|purifier|filter|tds|tank|quality|leak|flow)\b/i.test(entityText(context, entityId));
}

function isPowerEntity(context: DashboardContext, entityId: string): boolean {
  const domain = domainOf(entityId);
  const text = entityText(context, entityId);
  if (domain === "switch") return /\b(socket|plug|outlet|power|energy|wall\s*switch|插座|墙插)\b/i.test(text);
  return /\b(power|energy|electric|voltage|current|watt|kwh|battery)\b/i.test(text);
}

function isEnergyEntity(context: DashboardContext, entityId: string): boolean {
  return /\b(energy|power|electric|solar|grid|gas|water|utility|consumption|carbon|kwh|watt)\b/i.test(entityText(context, entityId));
}

function isInfrastructureEntity(context: DashboardContext, entityId: string): boolean {
  return /\b(server|router|gateway|nas|pve|proxmox|synology|qnap|cpu|memory|disk|storage|network|wan|lan|wifi|uptime|ping|host)\b/i.test(entityText(context, entityId));
}

function isNoteEntity(context: DashboardContext, entityId: string): boolean {
  return /\b(note|memo|notice|reminder|checklist|todo note|备注|提醒|便签|备忘)\b/i.test(entityText(context, entityId));
}

function entityText(context: DashboardContext, entityId: string): string {
  const registry = context.index.entitiesById.get(entityId);
  const state = context.hass?.states[entityId];
  return [entityId, registry?.device_class, state?.attributes.device_class, entityName(state)].filter(Boolean).join(" ");
}
