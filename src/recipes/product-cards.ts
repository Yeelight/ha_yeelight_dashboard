import type { DashboardContext } from "../model/context";
import type { DashboardCardKind } from "../cards/types";
import type { LovelaceCardConfig } from "../types";
import { gridOptionsForKind } from "../cards/grid-options";
import { localize, type TranslationKey } from "../i18n";
import { EN } from "../i18n/translations-en";
import { areaSummaries, cameraEntities, deviceEntities, domainEntities, mediaEntities, noteEntities, presenceEntities, routineEntities, securityEntities } from "./entity-groups";
import {
  airSubtypeEntities,
  climateSubtypeEntities,
  deviceSubtypeEntities,
  energySubtypeEntities,
  environmentSubtypeEntities,
  healthSubtypeEntities,
  infrastructureSubtypeEntities,
  mediaSubtypeEntities,
  powerSubtypeEntities,
  presenceSubtypeEntities,
  routineSubtypeEntities,
  securitySubtypeEntities
} from "./semantic-filters";

export function dashboardCard(context: DashboardContext, kind: DashboardCardKind, entities: string[], layoutKey: string, config: Record<string, unknown> = {}): LovelaceCardConfig {
  const tagKind = kind.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  const copy = RECIPE_COPY[layoutKey];
  return {
    type: `custom:yeelight-dashboard-${tagKind}-card`,
    title: copy?.titleKey ? localize(context.hass, copy.titleKey) : subtypeTitle(context, kind, config.subtype),
    subtitle: copy?.subtitleKey ? localize(context.hass, copy.subtitleKey) : undefined,
    entities,
    ...config,
    view_layout: { key: layoutKey },
    grid_options: gridOptionsForKind(kind)
  };
}

export function optionalDashboardCard(context: DashboardContext, kind: DashboardCardKind, entities: string[], layoutKey: string, config: Record<string, unknown> = {}): LovelaceCardConfig[] {
  return entities.length ? [dashboardCard(context, kind, entities, layoutKey, config)] : [];
}

export function areaProductCards(context: DashboardContext): LovelaceCardConfig[] {
  return [
    dashboardCard(context, "devices", deviceEntities(context), "areas.devices", { subtype: "activity", area_summaries: areaSummaries(context) }),
    ...optionalDashboardCard(context, "devices", deviceSubtypeEntities(context, "list"), "areas.devices_list", { subtype: "list", area_summaries: areaSummaries(context) }),
    ...optionalDashboardCard(context, "devices", deviceSubtypeEntities(context, "universal"), "areas.devices_universal", { subtype: "universal", area_summaries: areaSummaries(context) }),
    ...optionalDashboardCard(context, "devices", deviceSubtypeEntities(context, "single"), "areas.device_focus", { subtype: "single", area_summaries: areaSummaries(context) })
  ];
}

export function routineProductCards(context: DashboardContext): LovelaceCardConfig[] {
  const cards = [
    ...optionalDashboardCard(context, "routines", routineEntities(context), "routines.summary", { subtype: "list" }),
    ...optionalDashboardCard(context, "routines", routineSubtypeEntities(context, "quick"), "routines.quick", { subtype: "quick" }),
    ...optionalDashboardCard(context, "routines", routineSubtypeEntities(context, "commands"), "routines.commands", { subtype: "commands" }),
    ...optionalDashboardCard(context, "routines", routineSubtypeEntities(context, "scripts"), "routines.scripts", { subtype: "scripts" }),
    ...optionalDashboardCard(context, "routines", routineSubtypeEntities(context, "automations"), "routines.automations", { subtype: "automations" }),
    ...optionalDashboardCard(context, "routines", routineSubtypeEntities(context, "schedule"), "routines.schedule", { subtype: "schedule" }),
    ...optionalDashboardCard(context, "routines", routineSubtypeEntities(context, "button"), "routines.buttons", { subtype: "button" })
  ];
  return context.config.profile === "advanced" ? uniqueEntitySetCards(cards) : cards.slice(0, 1);
}

export function environmentProductCards(context: DashboardContext): LovelaceCardConfig[] {
  const cards = [
    dashboardCard(context, "environment", environmentSubtypeEntities(context, "overview"), "environment.summary", { subtype: "overview" }),
    ...optionalDashboardCard(context, "environment", environmentSubtypeEntities(context, "weather"), "environment.weather", { subtype: "weather" }),
    ...optionalDashboardCard(context, "environment", environmentSubtypeEntities(context, "sensors"), "environment.sensors", { subtype: "sensors" }),
    ...optionalDashboardCard(context, "environment", environmentSubtypeEntities(context, "illuminance"), "environment.illuminance", { subtype: "illuminance" }),
    ...optionalDashboardCard(context, "climate", climateSubtypeEntities(context, "overview"), "environment.climate", { subtype: "overview" }),
    ...optionalDashboardCard(context, "climate", climateSubtypeEntities(context, "single"), "environment.climate_single", { subtype: "single" }),
    ...optionalDashboardCard(context, "air", airSubtypeEntities(context, "fan"), "environment.air", { subtype: "fan" }),
    ...optionalDashboardCard(context, "air", airSubtypeEntities(context, "humidifier"), "environment.humidifier", { subtype: "humidifier" }),
    ...optionalDashboardCard(context, "power", powerSubtypeEntities(context, "socket"), "environment.power", { subtype: "socket" }),
    ...optionalDashboardCard(context, "power", powerSubtypeEntities(context, "electricity"), "environment.electricity", { subtype: "electricity" }),
    ...optionalDashboardCard(context, "energy", energySubtypeEntities(context, "summary"), "environment.energy", { subtype: "summary" }),
    ...optionalDashboardCard(context, "energy", energySubtypeEntities(context, "insights"), "environment.energy_insights", { subtype: "insights" })
  ];
  if (context.config.profile === "advanced") return cards;
  return uniqueEntitySetCards(preferCards(cards, [
    "environment.summary",
    "environment.air",
    "environment.power",
    "environment.energy",
    "environment.illuminance",
    "environment.water"
  ]).filter((card) => shouldShowStandardEnvironmentCard(context, card)), false);
}

export function mediaProductCards(context: DashboardContext): LovelaceCardConfig[] {
  return [
    ...optionalDashboardCard(context, "media", mediaSubtypeEntities(context, "hub"), "media.hub", { subtype: "hub" }),
    ...optionalDashboardCard(context, "media", mediaSubtypeEntities(context, "max-player"), "media.max_player", { subtype: "max-player" }),
    ...optionalDashboardCard(context, "media", mediaSubtypeEntities(context, "player"), "media.players", { subtype: "player" }),
    ...optionalDashboardCard(context, "media", mediaSubtypeEntities(context, "broadcast"), "media.broadcast", { subtype: "broadcast" }),
    ...optionalDashboardCard(context, "media", mediaSubtypeEntities(context, "voice"), "media.voice", { subtype: "voice" }),
    ...optionalDashboardCard(context, "media", mediaSubtypeEntities(context, "remote"), "media.remotes", { subtype: "remote" })
  ];
}

export function healthProductCards(context: DashboardContext): LovelaceCardConfig[] {
  return [
    ...optionalDashboardCard(context, "security", securitySubtypeEntities(context, "alarm"), "health.security_alarm", { subtype: "alarm" }),
    ...optionalDashboardCard(context, "security", securitySubtypeEntities(context, "lock"), "health.security_lock", { subtype: "lock" }),
    ...optionalDashboardCard(context, "security", securitySubtypeEntities(context, "binary-sensor"), "health.security_sensors", { subtype: "binary-sensor" }),
    ...optionalDashboardCard(context, "presence", presenceSubtypeEntities(context, "family"), "health.presence_family", { subtype: "family" }),
    ...optionalDashboardCard(context, "presence", presenceSubtypeEntities(context, "people"), "health.presence_people", { subtype: "people" }),
    ...optionalDashboardCard(context, "presence", presenceSubtypeEntities(context, "tracker"), "health.presence_tracker", { subtype: "tracker" }),
    ...optionalDashboardCard(context, "infrastructure", infrastructureSubtypeEntities(context, "router"), "health.infrastructure_router", { subtype: "router" }),
    ...optionalDashboardCard(context, "infrastructure", infrastructureSubtypeEntities(context, "nas"), "health.infrastructure_nas", { subtype: "nas" }),
    ...optionalDashboardCard(context, "infrastructure", infrastructureSubtypeEntities(context, "pve"), "health.infrastructure_pve", { subtype: "pve" }),
    ...optionalDashboardCard(context, "infrastructure", infrastructureSubtypeEntities(context, "server-list"), "health.infrastructure_server_list", { subtype: "server-list" }),
    ...optionalDashboardCard(context, "infrastructure", infrastructureSubtypeEntities(context, "pve-list"), "health.infrastructure_pve_list", { subtype: "pve-list" }),
    ...optionalDashboardCard(context, "health", healthSubtypeEntities(context, "updates"), "health.updates", { subtype: "updates" }),
    ...optionalDashboardCard(context, "health", healthSubtypeEntities(context, "repairs-backup"), "health.repairs_backup", { subtype: "repairs-backup" }),
    ...optionalDashboardCard(context, "health", healthSubtypeEntities(context, "network"), "health.network", { subtype: "network" }),
    ...optionalDashboardCard(context, "health", healthSubtypeEntities(context, "events"), "health.events", { subtype: "events" }),
    ...optionalDashboardCard(context, "health", healthSubtypeEntities(context, "history"), "health.history_product", { subtype: "history" })
  ];
}

export function mediaUtilityProductCards(context: DashboardContext): LovelaceCardConfig[] {
  const cameras = cameraEntities(context);
  return optionalDashboardCard(context, "image", cameras, "media.image_carousel", { subtype: cameras.length > 1 ? "carousel" : "single" });
}

export function healthUtilityProductCards(context: DashboardContext): LovelaceCardConfig[] {
  return optionalDashboardCard(context, "note", noteEntities(context), "health.note", { subtype: "standard" });
}

export function phaseAOverviewCards(context: DashboardContext): LovelaceCardConfig[] {
  return [
    ...optionalDashboardCard(context, "security", securityEntities(context), "overview.security", { subtype: "overview" }),
    ...optionalDashboardCard(context, "presence", presenceEntities(context), "overview.presence", { subtype: "motion" })
  ];
}

function preferCards(cards: LovelaceCardConfig[], layoutKeys: string[]): LovelaceCardConfig[] {
  const byKey = new Map(cards.map((card) => [layoutKey(card), card]));
  const preferred = layoutKeys.map((key) => byKey.get(key)).filter((card): card is LovelaceCardConfig => !!card);
  return preferred.length ? preferred : cards.slice(0, 4);
}

function uniqueEntitySetCards(cards: LovelaceCardConfig[], includeType = true): LovelaceCardConfig[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    const entities = Array.isArray(card.entities) ? card.entities.filter((entity): entity is string => typeof entity === "string").sort() : [];
    const key = `${includeType ? card.type : "any"}:${entities.join("|")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shouldShowStandardEnvironmentCard(context: DashboardContext, card: LovelaceCardConfig): boolean {
  if (layoutKey(card) === "environment.summary") return true;
  const entities = Array.isArray(card.entities) ? card.entities : [];
  return entities.some((entityId) => typeof entityId === "string" && hasKnownState(context, entityId));
}

function hasKnownState(context: DashboardContext, entityId: string): boolean {
  const state = context.hass?.states[entityId]?.state;
  return typeof state === "string" && state !== "unknown" && state !== "unavailable";
}

function layoutKey(card: LovelaceCardConfig): string {
  return String((card.view_layout as { key?: unknown } | undefined)?.key || "");
}

type RecipeCopy = {
  titleKey: TranslationKey;
  subtitleKey?: TranslationKey;
};

const RECIPE_COPY: Record<string, RecipeCopy> = {
  "lighting.overview": { titleKey: "recipe.lighting.overview.title", subtitleKey: "recipe.lighting.overview.subtitle" },
  "lighting.status": { titleKey: "recipe.lighting.status.title", subtitleKey: "recipe.lighting.status.subtitle" },
  "lighting.devices": { titleKey: "recipe.lighting.devices.title", subtitleKey: "recipe.lighting.devices.subtitle" },
  "lighting.rooms": { titleKey: "recipe.lighting.rooms.title", subtitleKey: "recipe.lighting.rooms.subtitle" },
  "routines.panel_actions": { titleKey: "recipe.routines.panel_actions.title", subtitleKey: "recipe.routines.panel_actions.subtitle" },
  "routines.summary": { titleKey: "recipe.routines.summary.title", subtitleKey: "recipe.routines.summary.subtitle" },
  "environment.summary": { titleKey: "recipe.environment.summary.title", subtitleKey: "recipe.environment.summary.subtitle" },
  "environment.climate": { titleKey: "recipe.environment.climate.title", subtitleKey: "recipe.environment.climate.subtitle" },
  "environment.air": { titleKey: "recipe.environment.air.title", subtitleKey: "recipe.environment.air.subtitle" },
  "environment.power": { titleKey: "recipe.environment.power.title", subtitleKey: "recipe.environment.power.subtitle" },
  "environment.energy": { titleKey: "recipe.environment.energy.title", subtitleKey: "recipe.environment.energy.subtitle" },
  "environment.illuminance": { titleKey: "recipe.environment.illuminance.title", subtitleKey: "recipe.environment.illuminance.subtitle" }
};

function subtypeTitle(context: DashboardContext, kind: DashboardCardKind, subtypeValue: unknown): string {
  const subtype = typeof subtypeValue === "string" ? subtypeValue : "";
  if (!subtype) return localize(context.hass, `card.${kind}.title`);
  const key = knownTranslationKey(`editor.subtype.${subtype}`);
  return key ? `${localize(context.hass, `card.${kind}.title`)} · ${localize(context.hass, key)}` : localize(context.hass, `card.${kind}.title`);
}

function knownTranslationKey(key: string): TranslationKey | undefined {
  return key in EN ? (key as TranslationKey) : undefined;
}
