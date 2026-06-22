import type { HomeAssistant } from "../types";
import { localize } from "../i18n";
import { normalizeEntity } from "./entity-model";
import type { NormalizedEntity } from "./types";

export type EntityAction = "toggle" | "activate" | "press";
export type NavigationTarget = {
  viewPath: string;
  nativePath?: string;
};

const TOGGLE_DOMAINS = new Set(["light", "switch", "fan"]);
const DASHBOARD_VIEW_PATHS = new Set(["overview", "lighting", "areas", "scenes", "environment", "media", "health", "floorplan"]);

export function fireMoreInfo(host: HTMLElement, entityId: string): void {
  host.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
}

export function navigateToDashboardView(viewPath: string): void {
  const target = new URL(window.location.href);
  const segments = target.pathname.split("/").filter(Boolean);
  if (segments.length > 1 || DASHBOARD_VIEW_PATHS.has(segments[segments.length - 1])) {
    segments[segments.length - 1] = viewPath;
  } else {
    segments.push(viewPath);
  }
  target.pathname = `/${segments.join("/")}`;
  window.history.pushState(null, "", `${target.pathname}${target.search}${target.hash}`);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}

export function navigateToTarget(target: NavigationTarget): void {
  if (target.nativePath) {
    navigateToNativePath(target.nativePath);
    return;
  }
  navigateToDashboardView(target.viewPath);
}

export function navigateToNativePath(path: string): void {
  const target = new URL(path, window.location.origin);
  window.history.pushState(null, "", `${target.pathname}${target.search}${target.hash}`);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}

export function areaNativePath(areaId: string): string {
  return `/home/areas-${encodeURIComponent(areaId)}?historyBack=1`;
}

export async function executeEntityAction(
  hass: HomeAssistant | undefined,
  entityId: string,
  action: EntityAction
): Promise<void> {
  const entity = ensureWritable(hass, entityId);
  if (action === "toggle") {
    if (!TOGGLE_DOMAINS.has(entity.domain)) throw new Error(localize(hass, "error.unsupported_action"));
    return call(hass, entity.domain, entity.state === "on" ? "turn_off" : "turn_on", entity.entityId);
  }
  if (action === "activate" && (entity.domain === "scene" || entity.domain === "script" || entity.domain === "automation")) {
    return call(hass, entity.domain, entity.domain === "automation" ? "trigger" : "turn_on", entity.entityId);
  }
  if (action === "press" && entity.domain === "button") return call(hass, "button", "press", entity.entityId);
  throw new Error(localize(hass, "error.unsupported_action"));
}

export async function turnOffLights(hass: HomeAssistant | undefined, entityIds: string[]): Promise<number> {
  const writableLights = entityIds
    .map((entityId) => normalizeEntity(hass, entityId))
    .filter((entity): entity is NormalizedEntity => !!entity && entity.domain === "light" && entity.available && !entity.readOnly && entity.state === "on");
  for (const entity of writableLights) {
    await call(hass, "light", "turn_off", entity.entityId);
  }
  return writableLights.length;
}

export function actionFor(entity: NormalizedEntity): EntityAction | "" {
  if (["light", "switch", "fan"].includes(entity.domain)) return "toggle";
  if (["scene", "script", "automation"].includes(entity.domain)) return "activate";
  if (entity.domain === "button") return "press";
  return "";
}

export function actionLabel(hass: HomeAssistant | undefined, entity: NormalizedEntity, action: EntityAction): string {
  if (action === "activate") return localize(hass, "action.activate");
  if (action === "press") return localize(hass, "action.press");
  return entity.state === "on" ? localize(hass, "action.turn_off") : localize(hass, "action.turn_on");
}

function ensureWritable(hass: HomeAssistant | undefined, entityId: string): NormalizedEntity {
  if (!hass || hass.connected === false) throw new Error(localize(hass, "error.not_connected"));
  const entity = normalizeEntity(hass, entityId);
  if (!entity) throw new Error(localize(hass, "error.entity_missing"));
  if (!entity.available || entity.readOnly) throw new Error(localize(hass, "error.entity_unavailable"));
  return entity;
}

async function call(hass: HomeAssistant | undefined, domain: string, service: string, entityId: string): Promise<void> {
  if (!hass?.callService) throw new Error(localize(hass, "error.not_connected"));
  await hass.callService(domain, service, { entity_id: entityId });
}
