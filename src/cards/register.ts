import { createDashboardCardClass, type DashboardCardKind } from "./internal-card";
import { YeelightDashboardCardEditor } from "./card-editor";

export const CARD_EDITOR_TAG = "yeelight-dashboard-card-editor";

const CARD_DEFINITIONS: Array<{ tag: string; kind: DashboardCardKind }> = [
  { tag: "yeelight-dashboard-hero-card", kind: "hero" },
  { tag: "yeelight-dashboard-light-card", kind: "light" },
  { tag: "yeelight-dashboard-rooms-card", kind: "rooms" },
  { tag: "yeelight-dashboard-room-card", kind: "room" },
  { tag: "yeelight-dashboard-routines-card", kind: "routines" },
  { tag: "yeelight-dashboard-health-card", kind: "health" }
];

export function registerDashboardCards(): void {
  if (!customElements.get(CARD_EDITOR_TAG)) {
    customElements.define(CARD_EDITOR_TAG, YeelightDashboardCardEditor);
  }
  for (const definition of CARD_DEFINITIONS) {
    if (!customElements.get(definition.tag)) {
      customElements.define(definition.tag, createDashboardCardClass(definition.kind));
    }
  }
}

export const DASHBOARD_CARD_TAGS = CARD_DEFINITIONS.map((definition) => definition.tag);
