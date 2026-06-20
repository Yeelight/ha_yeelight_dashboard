import { describe, expect, it } from "vitest";

import { DASHBOARD_CARD_TAGS } from "../src/cards/register";
import { EDITOR_TAG, STRATEGY_TAG, STRATEGY_TYPE } from "../src/strategy/config";
import { CANVAS_VIEW_TAG } from "../src/views/canvas-view";
import "../src/index";

describe("registration", () => {
  it("registers the dashboard strategy, editor and internal cards", () => {
    expect(customElements.get(STRATEGY_TAG)).toBeTruthy();
    expect(customElements.get(EDITOR_TAG)).toBeTruthy();
    expect(customElements.get(CANVAS_VIEW_TAG)).toBeTruthy();
    for (const tag of DASHBOARD_CARD_TAGS) {
      expect(customElements.get(tag)).toBeTruthy();
    }
    expect(window.customStrategies?.some((item) => item.type === STRATEGY_TYPE && item.strategyType === "dashboard")).toBe(true);
    expect(window.customCards?.some((item) => String(item.type).startsWith("yeelight-dashboard-"))).not.toBe(true);
    const strategy = customElements.get(STRATEGY_TAG) as typeof import("../src/strategy/dashboard-strategy").YeelightDashboardStrategy;
    expect(strategy.getCreateSuggestions()).toEqual({ title: "Yeelight Dashboard", icon: "mdi:view-dashboard" });
  });
});
