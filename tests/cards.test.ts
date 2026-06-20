import { describe, expect, it } from "vitest";

import "../src/index";
import { entity, hass, type ServiceCall } from "./fixtures";

describe("internal cards", () => {
  it("exposes HA custom card sizing APIs", () => {
    const element = document.createElement("yeelight-dashboard-hero-card") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      getCardSize: () => number;
      getGridOptions: () => Record<string, number>;
    };
    element.setConfig({ type: "custom:yeelight-dashboard-hero-card", entities: ["light.office"] });
    expect(element.getCardSize()).toBe(9);
    expect(element.getGridOptions()).toEqual({ columns: 12, rows: 9 });
  });

  it("renders product metrics and runs safe light actions", async () => {
    const calls: ServiceCall[] = [];
    const element = document.createElement("yeelight-dashboard-light-card") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    element.setConfig({ type: "custom:yeelight-dashboard-light-card", entities: ["light.ceiling"] });
    element.hass = hass({ "light.ceiling": entity("light.ceiling", "on", { friendly_name: "Ceiling" }) }, {}, calls);
    document.body.append(element);
    await element.updateComplete;
    expect(element.shadowRoot.textContent).toContain("灯光总览");
    element.shadowRoot.querySelector<HTMLButtonElement>(".chip-action")!.click();
    expect(calls).toEqual([{ domain: "light", service: "turn_off", data: { entity_id: "light.ceiling" } }]);
  });

  it("renders room summaries without repeating entity rows", async () => {
    const element = document.createElement("yeelight-dashboard-rooms-card") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    element.setConfig({
      type: "custom:yeelight-dashboard-rooms-card",
      entities: ["light.living"],
      area_summaries: [{ areaId: "living", name: "客厅", entityCount: 12, lightCount: 5, activeLightCount: 2, routineCount: 1, issueCount: 0 }]
    });
    element.hass = hass({ "light.living": entity("light.living", "on", { friendly_name: "Living" }) });
    document.body.append(element);
    await element.updateComplete;
    expect(element.shadowRoot.textContent).toContain("客厅");
    expect(element.shadowRoot.querySelectorAll(".area-card")).toHaveLength(1);
    expect(element.shadowRoot.querySelector(".entity-row")).toBeNull();
  });

  it("provides a working take-control editor", async () => {
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:yeelight-dashboard-hero-card", title: "Old" });
    document.body.append(editor);
    await editor.updateComplete;
    const eventPromise = new Promise<CustomEvent>((resolve) => editor.addEventListener("config-changed", (event) => resolve(event as CustomEvent), { once: true }));
    const input = editor.shadowRoot.querySelector("input")!;
    input.value = "New";
    input.dispatchEvent(new Event("input"));
    expect((await eventPromise).detail.config.title).toBe("New");
  });
});
