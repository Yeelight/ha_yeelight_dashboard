import type { DashboardContext } from "../model/context";
import { domainOf } from "../model/registry";
import {
  airEntities,
  climateEntities,
  deviceEntities,
  domainEntities,
  energyEntities,
  environmentEntities,
  infrastructureEntities,
  mediaEntities,
  powerEntities,
  presenceEntities,
  routineEntities,
  securityEntities
} from "./entity-groups";

const ACTIONABLE_DEVICE_DOMAINS = new Set(["light", "switch", "cover", "vacuum", "climate", "fan", "humidifier", "media_player", "remote", "lock"]);

export function deviceSubtypeEntities(context: DashboardContext, subtype: "list" | "single" | "universal"): string[] {
  const entities = deviceEntities(context);
  if (subtype === "single") return entities.slice(0, 1);
  if (subtype === "universal") return entities.filter((entity) => ACTIONABLE_DEVICE_DOMAINS.has(domainOf(entity)));
  return entities;
}

export function routineSubtypeEntities(context: DashboardContext, subtype: "quick" | "commands" | "scripts" | "automations" | "schedule" | "button"): string[] {
  if (subtype === "scripts") return domainEntities(context, "script");
  if (subtype === "automations") return domainEntities(context, "automation");
  if (subtype === "schedule") return domainEntities(context, "schedule");
  if (subtype === "button") return domainEntities(context, "button");
  if (subtype === "commands") return entitiesForDomains(context, ["scene", "script", "button"]);
  return routineEntities(context);
}

export function environmentSubtypeEntities(context: DashboardContext, subtype: "overview" | "weather" | "sensors" | "illuminance"): string[] {
  if (subtype === "weather") return environmentEntities(context).filter((entity) => domainOf(entity) === "weather" || matchesEntity(context, entity, /\b(weather|forecast|temperature|humidity|气象|天气)\b/i));
  if (subtype === "sensors") return entitiesForDomains(context, ["sensor", "binary_sensor"]);
  if (subtype === "illuminance") return entitiesForDomains(context, ["sensor", "binary_sensor"]).filter((entity) => matchesEntity(context, entity, /\b(illuminance|lux|lx|light level|brightness|照度)\b/i));
  return environmentEntities(context);
}

export function climateSubtypeEntities(context: DashboardContext, subtype: "overview" | "single"): string[] {
  if (subtype === "single") return domainEntities(context, "climate");
  return climateEntities(context);
}

export function airSubtypeEntities(context: DashboardContext, subtype: "fan" | "humidifier"): string[] {
  if (subtype === "humidifier") return uniqueEntities([...domainEntities(context, "humidifier"), ...airEntities(context).filter((entity) => matchesEntity(context, entity, /\b(humidifier|humidity|湿度|加湿)\b/i))]);
  return airEntities(context);
}

export function powerSubtypeEntities(context: DashboardContext, subtype: "socket" | "electricity"): string[] {
  const entities = powerEntities(context);
  if (subtype === "electricity") return entities.filter((entity) => domainOf(entity) === "sensor");
  return entities;
}

export function energySubtypeEntities(context: DashboardContext, subtype: "summary" | "insights"): string[] {
  const entities = energyEntities(context);
  if (subtype === "insights") return entities.filter((entity) => matchesEntity(context, entity, /\b(energy|power|electric|solar|grid|gas|utility|consumption|carbon|kwh|watt|电|能耗)\b/i));
  return entities;
}

export function mediaSubtypeEntities(context: DashboardContext, subtype: "hub" | "player" | "max-player" | "broadcast" | "voice" | "remote"): string[] {
  const players = domainEntities(context, "media_player");
  if (subtype === "player") return domainEntities(context, "media_player");
  if (subtype === "max-player") return players.filter((entity) => hasMediaDetail(context, entity)).slice(0, 1);
  if (subtype === "broadcast") return mediaEntities(context).filter((entity) => matchesEntity(context, entity, /\b(broadcast|radio|announcement|tts|广播|播报|电台)\b/i));
  if (subtype === "voice") return mediaEntities(context).filter((entity) => matchesEntity(context, entity, /\b(voice|assistant|assist|microphone|语音|助手)\b/i));
  if (subtype === "remote") return domainEntities(context, "remote");
  return mediaEntities(context);
}

export function securitySubtypeEntities(context: DashboardContext, subtype: "overview" | "alarm" | "lock" | "binary-sensor"): string[] {
  const entities = securityEntities(context);
  if (subtype === "alarm") return entities.filter((entity) => domainOf(entity) === "alarm_control_panel");
  if (subtype === "lock") return entities.filter((entity) => domainOf(entity) === "lock");
  if (subtype === "binary-sensor") return entities.filter((entity) => domainOf(entity) === "binary_sensor" || domainOf(entity) === "sensor");
  return entities;
}

export function presenceSubtypeEntities(context: DashboardContext, subtype: "motion" | "people" | "family" | "tracker"): string[] {
  const entities = presenceEntities(context);
  if (subtype === "people") return entities.filter((entity) => domainOf(entity) === "person");
  if (subtype === "family") return entities.filter((entity) => domainOf(entity) === "person" || domainOf(entity) === "device_tracker");
  if (subtype === "tracker") return entities.filter((entity) => domainOf(entity) === "device_tracker");
  return entities.filter((entity) => domainOf(entity) === "binary_sensor" || domainOf(entity) === "sensor");
}

export function infrastructureSubtypeEntities(context: DashboardContext, subtype: "server" | "router" | "nas" | "pve" | "server-list" | "pve-list"): string[] {
  const entities = infrastructureEntities(context);
  if (subtype === "router") return entities.filter((entity) => matchesEntity(context, entity, /\b(router|gateway|wan|lan|wifi|network|路由|网关|网络)\b/i));
  if (subtype === "nas") return entities.filter((entity) => matchesEntity(context, entity, /\b(nas|synology|qnap|storage|disk|存储)\b/i));
  if (subtype === "pve" || subtype === "pve-list") return entities.filter((entity) => matchesEntity(context, entity, /\b(pve|proxmox|vm|lxc|虚拟机)\b/i));
  return entities.filter((entity) => matchesEntity(context, entity, /\b(server|host|cpu|memory|disk|uptime|服务器|主机)\b/i));
}

export function healthSubtypeEntities(context: DashboardContext, subtype: "updates" | "repairs-backup" | "network" | "events" | "history"): string[] {
  if (subtype === "updates") return domainEntities(context, "update");
  if (subtype === "repairs-backup") return entitiesForDomains(context, ["update", "sensor", "binary_sensor"]).filter((entity) => matchesEntity(context, entity, /\b(repair|backup|problem|issue|restore|修复|备份|故障)\b/i));
  if (subtype === "events") return entitiesForDomains(context, ["event", "calendar", "todo"]);
  if (subtype === "history") return domainEntities(context, "sensor");
  return uniqueEntities([...infrastructureSubtypeEntities(context, "router"), ...domainEntities(context, "update").filter((entity) => matchesEntity(context, entity, /\b(gateway|router|network|iot|网关|网络)\b/i))]);
}

export function entitiesForDomains(context: DashboardContext, domains: string[]): string[] {
  return domains.flatMap((domain) => domainEntities(context, domain));
}

function matchesEntity(context: DashboardContext, entityId: string, pattern: RegExp): boolean {
  const registry = context.index.entitiesById.get(entityId);
  const state = context.hass?.states[entityId];
  return pattern.test([entityId, registry?.device_class, state?.attributes.device_class, state?.attributes.friendly_name, state?.attributes.unit_of_measurement].filter(Boolean).join(" "));
}

function hasMediaDetail(context: DashboardContext, entityId: string): boolean {
  const state = context.hass?.states[entityId];
  return state?.state === "playing" && [state.attributes.media_title, state.attributes.media_artist, state.attributes.source].some((value) => typeof value === "string" && !!value.trim());
}

function uniqueEntities(entities: string[]): string[] {
  return [...new Set(entities)];
}
