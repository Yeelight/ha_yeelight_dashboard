import { cardDefinitionFromType } from "./card-definitions";
import type { DashboardCardKind } from "./types";

export type DashboardCardSubtype = {
  value: string;
  legacyIds: string[];
};

export const CARD_SUBTYPES: Partial<Record<DashboardCardKind, DashboardCardSubtype[]>> = {
  hero: [
    { value: "standard", legacyIds: ["hero"] },
    { value: "panel", legacyIds: ["panel-hero"] },
    { value: "time", legacyIds: ["time-card"] },
    { value: "quote", legacyIds: ["daily-quote-card"] }
  ],
  status: [{ value: "standard", legacyIds: ["status"] }],
  notice: [{ value: "standard", legacyIds: ["notice"] }],
  light: [
    { value: "favorites", legacyIds: ["favorite-lights"] },
    { value: "status", legacyIds: ["light-status-card"] },
    { value: "overview", legacyIds: ["light-overview-card"] },
    { value: "devices", legacyIds: ["light-devices"] }
  ],
  rooms: [{ value: "overview", legacyIds: ["rooms"] }],
  room: [
    { value: "single", legacyIds: ["room-card"] },
    { value: "devices", legacyIds: ["room-devices"] }
  ],
  devices: [
    { value: "activity", legacyIds: ["devices"] },
    { value: "list", legacyIds: ["device-list"] },
    { value: "single", legacyIds: ["device-single"] },
    { value: "universal", legacyIds: ["universal-card"] }
  ],
  routines: [
    { value: "quick", legacyIds: ["quick-scenes"] },
    { value: "list", legacyIds: ["scene-list"] },
    { value: "commands", legacyIds: ["quick-command-card"] },
    { value: "scripts", legacyIds: ["script-panel"] },
    { value: "schedule", legacyIds: ["schedule"] },
    { value: "automations", legacyIds: ["automations"] },
    { value: "scene-single", legacyIds: ["scene-single-card"] },
    { value: "automation-single", legacyIds: ["automation-single-card"] },
    { value: "script-single", legacyIds: ["script-single-card"] },
    { value: "button", legacyIds: ["button-card"] }
  ],
  environment: [
    { value: "overview", legacyIds: ["weather"] },
    { value: "weather", legacyIds: ["weather-card"] },
    { value: "sensors", legacyIds: ["sensor-card"] },
    { value: "illuminance", legacyIds: ["illuminance-card"] }
  ],
  media: [
    { value: "hub", legacyIds: ["media"] },
    { value: "player", legacyIds: ["media-player-card"] },
    { value: "max-player", legacyIds: ["max-player-card"] },
    { value: "broadcast", legacyIds: ["broadcast-radio-card"] },
    { value: "voice", legacyIds: ["voice-assistant-card"] },
    { value: "remote", legacyIds: ["remote-card"] }
  ],
  camera: [
    { value: "overview", legacyIds: ["cameras"] },
    { value: "single", legacyIds: ["camera-card"] }
  ],
  cameraWall: [{ value: "wall", legacyIds: ["camera-wall-card"] }],
  climate: [
    { value: "overview", legacyIds: ["climate"] },
    { value: "single", legacyIds: ["climate-card"] }
  ],
  air: [
    { value: "fan", legacyIds: ["fan-card"] },
    { value: "humidifier", legacyIds: ["humidifier-card"] }
  ],
  water: [{ value: "purifier", legacyIds: ["water-purifier-card"] }],
  power: [
    { value: "socket", legacyIds: ["socket-card"] },
    { value: "electricity", legacyIds: ["electricity-card"] }
  ],
  energy: [
    { value: "summary", legacyIds: ["energy"] },
    { value: "insights", legacyIds: ["insights"] }
  ],
  infrastructure: [
    { value: "server", legacyIds: ["server-card"] },
    { value: "router", legacyIds: ["router-card"] },
    { value: "nas", legacyIds: ["nas-card"] },
    { value: "pve", legacyIds: ["pve-card"] },
    { value: "server-list", legacyIds: ["server-devices"] },
    { value: "pve-list", legacyIds: ["pve-devices"] }
  ],
  security: [
    { value: "overview", legacyIds: ["security"] },
    { value: "alarm", legacyIds: ["alarm-card"] },
    { value: "lock", legacyIds: ["lock-card"] },
    { value: "binary-sensor", legacyIds: ["binary-sensor-card"] }
  ],
  presence: [
    { value: "motion", legacyIds: ["motion-card"] },
    { value: "people", legacyIds: ["people"] },
    { value: "family", legacyIds: ["family-card"] },
    { value: "tracker", legacyIds: ["device-tracker-card"] }
  ],
  panelActions: [{ value: "standard", legacyIds: ["panel-actions"] }],
  image: [
    { value: "single", legacyIds: ["image"] },
    { value: "carousel", legacyIds: ["image-carousel"] }
  ],
  note: [{ value: "standard", legacyIds: ["text-note"] }],
  ecosystem: [{ value: "standard", legacyIds: ["ecosystem"] }],
  health: [
    { value: "overview", legacyIds: ["health"] },
    { value: "updates", legacyIds: ["updates-card"] },
    { value: "repairs-backup", legacyIds: ["repairs-backup-card"] },
    { value: "network", legacyIds: ["iot-network-card"] },
    { value: "events", legacyIds: ["events"] },
    { value: "history", legacyIds: ["history"] }
  ]
};

export function subtypeOptionsForKind(kind: DashboardCardKind): DashboardCardSubtype[] {
  return CARD_SUBTYPES[kind] || [];
}

export function subtypeOptionsForType(type: string | undefined): DashboardCardSubtype[] {
  const kind = cardDefinitionFromType(type)?.kind;
  return kind ? subtypeOptionsForKind(kind) : [];
}

export function defaultSubtypeForKind(kind: DashboardCardKind): string | undefined {
  return subtypeOptionsForKind(kind)[0]?.value;
}

export function normalizeSubtype(kind: DashboardCardKind, value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return defaultSubtypeForKind(kind);
  const allowed = new Set(subtypeOptionsForKind(kind).map((item) => item.value));
  if (!allowed.size) return undefined;
  return allowed.has(value) ? value : defaultSubtypeForKind(kind);
}
