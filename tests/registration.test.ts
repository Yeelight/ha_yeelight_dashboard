import { beforeAll, describe, expect, it } from "vitest";

import { DASHBOARD_CARD_TAGS } from "../src/cards/register";
import { EDITOR_TAG, STRATEGY_TAG, STRATEGY_TYPE } from "../src/strategy/config";
import { CANVAS_VIEW_TAG } from "../src/views/canvas-view";
import { entity, hass } from "./fixtures";
import "../src/index";

describe("registration", () => {
  beforeAll(() => {
    if (!customElements.get("ha-form")) {
      customElements.define("ha-form", class extends HTMLElement {});
    }
  });

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
      expect(meta?.preview).toBe(true);
      expect(String(meta?.name)).toMatch(/^易来仪表盘 · /);
      expect(String(meta?.description)).toContain("可视化配置");
      expect((meta?.getConfigElement as () => HTMLElement)().tagName.toLowerCase()).toBe("yeelight-dashboard-card-editor");
      expect((meta?.getStubConfig as (hass?: unknown) => Record<string, unknown>)(ha).type).toBe(`custom:${tag}`);
      expect(elementClass.getConfigElement?.().tagName.toLowerCase()).toBe("yeelight-dashboard-card-editor");
      expect(elementClass.getStubConfig?.(ha).type).toBe(`custom:${tag}`);
    }
  });

  it("uses card metadata type as the default visual editor config", async () => {
    const meta = window.customCards?.find((item) => item.type === "yeelight-dashboard-image-card") as { getConfigElement?: () => HTMLElement } | undefined;
    const editor = meta?.getConfigElement?.() as (HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    }) | undefined;
    expect(editor).toBeTruthy();
    if (!editor) return;
    editor.hass = hass({ "camera.door": entity("camera.door", "streaming", { friendly_name: "Door Camera" }) });
    document.body.append(editor);
    await editor.updateComplete;
    const form = editor.shadowRoot.querySelector<HTMLElement & { data?: Record<string, unknown>; schema?: Array<Record<string, unknown>> }>("ha-form");
    expect(form?.data?.type).toBe("custom:yeelight-dashboard-image-card");
    expect(flatten(form?.schema || []).map((item) => item.name)).toEqual(expect.arrayContaining(["image_url", "content", "image_urls_text", "url"]));
    expect(editor.shadowRoot.querySelector("yeelight-dashboard-card-editor-preview")).toBeNull();
  });

  it("exposes utility card content fields from card metadata editors", async () => {
    const meta = window.customCards?.find((item) => item.type === "yeelight-dashboard-panel-actions-card") as { getConfigElement?: () => HTMLElement } | undefined;
    const editor = meta?.getConfigElement?.() as (HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    }) | undefined;
    expect(editor).toBeTruthy();
    if (!editor) return;
    editor.hass = hass({ "scene.movie": entity("scene.movie", "off", { friendly_name: "Movie" }) });
    document.body.append(editor);
    await editor.updateComplete;
    const form = editor.shadowRoot.querySelector<HTMLElement & { data?: Record<string, unknown>; schema?: Array<Record<string, unknown>>; computeHelper?: (item: Record<string, unknown>) => string }>("ha-form");
    expect(form?.data?.type).toBe("custom:yeelight-dashboard-panel-actions-card");
    expect(flatten(form?.schema || []).map((item) => item.name)).toEqual(expect.arrayContaining(["type", "subtype", "title", "subtitle", "content"]));
    expect(form?.computeHelper?.({ name: "content" })).toContain("快捷操作说明");
  });
});

function flatten(schema: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return schema.flatMap((item) => (Array.isArray(item.schema) ? flatten(item.schema as Array<Record<string, unknown>>) : [item]));
}
