import { describe, expect, it } from "vitest";

import { DASHBOARD_CARD_TAGS } from "../src/cards/register";
import { EDITOR_TAG, STRATEGY_TAG, STRATEGY_TYPE } from "../src/strategy/config";
import { CANVAS_VIEW_TAG } from "../src/views/canvas-view";
import { entity, hass } from "./fixtures";
import "../src/index";

describe("registration", () => {
  it("registers the dashboard strategy, editor and editable product cards", () => {
    expect(customElements.get(STRATEGY_TAG)).toBeTruthy();
    expect(customElements.get(EDITOR_TAG)).toBeTruthy();
    expect(customElements.get(CANVAS_VIEW_TAG)).toBeTruthy();
    for (const tag of DASHBOARD_CARD_TAGS) {
      expect(customElements.get(tag)).toBeTruthy();
    }
    expect(window.customStrategies?.some((item) => item.type === STRATEGY_TYPE && item.strategyType === "dashboard")).toBe(true);
    expect(window.customCards?.filter((item) => String(item.type).startsWith("yeelight-dashboard-")).map((item) => item.type)).toEqual(DASHBOARD_CARD_TAGS);
    const strategy = customElements.get(STRATEGY_TAG) as typeof import("../src/strategy/dashboard-strategy").YeelightDashboardStrategy;
    expect(strategy.getCreateSuggestions()).toEqual({ title: "Yeelight Dashboard", icon: "mdi:view-dashboard" });
  });

  it("exposes the HA visual editor contract on dashboard card metadata and classes", () => {
    const ha = hass({ "light.office": entity("light.office", "on", { friendly_name: "Office" }) });
    for (const tag of DASHBOARD_CARD_TAGS) {
      const meta = window.customCards?.find((item) => item.type === tag);
      const elementClass = customElements.get(tag) as CustomElementConstructor & {
        getConfigElement?: () => HTMLElement;
        getStubConfig?: (hass?: unknown) => Record<string, unknown>;
      };
      expect(meta?.getConfigElement).toBeTypeOf("function");
      expect(meta?.getStubConfig).toBeTypeOf("function");
      expect(String(meta?.name)).toMatch(/^易来仪表盘 · /);
      expect(String(meta?.description)).toContain("可视化配置");
      expect((meta?.getConfigElement as () => HTMLElement)().tagName.toLowerCase()).toBe("yeelight-dashboard-card-editor");
      expect((meta?.getStubConfig as (hass?: unknown) => Record<string, unknown>)(ha).type).toBe(`custom:${tag}`);
      expect(elementClass.getConfigElement?.().tagName.toLowerCase()).toBe("yeelight-dashboard-card-editor");
      expect(elementClass.getStubConfig?.(ha).type).toBe(`custom:${tag}`);
    }
  });
});
