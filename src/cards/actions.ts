import type { HomeAssistant } from "../types";
import { localize } from "../i18n";
import { normalizeEntity } from "./entity-model";
import type { NormalizedEntity } from "./types";

const TOGGLE_DOMAINS = new Set(["light", "switch", "fan"]);

export function fireMoreInfo(host: HTMLElement, entityId: string): void {
  host.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
}

export async function executeEntityAction(
  hass: HomeAssistant | undefined,
  entityId: string,
  action: "toggle" | "activate" | "press"
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
