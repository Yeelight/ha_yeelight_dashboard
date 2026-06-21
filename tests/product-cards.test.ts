import { describe, expect, it } from "vitest";

import "../src/index";
import { entity, hass } from "./fixtures";

type TestDashboardCard = HTMLElement & {
  setConfig: (config: Record<string, unknown>) => void;
  hass: unknown;
  updateComplete: Promise<boolean>;
  shadowRoot: ShadowRoot;
};

describe("product dashboard cards", () => {
  it("renders devices, routines and environment product cards", async () => {
    const states = {
      "light.living": entity("light.living", "on", { friendly_name: "Living Light" }),
      "switch.plug": entity("switch.plug", "off", { friendly_name: "Plug" }),
      "scene.movie": entity("scene.movie", "off", { friendly_name: "Movie" }),
      "weather.home": entity("weather.home", "sunny", { friendly_name: "Home Weather" }),
      "sensor.temperature": entity("sensor.temperature", "24", { friendly_name: "Temperature" })
    };
    const devices = document.createElement("yeelight-dashboard-devices-card") as TestDashboardCard;
    devices.setConfig({
      type: "custom:yeelight-dashboard-devices-card",
      entities: ["light.living", "switch.plug"],
      area_summaries: [{ areaId: "living", name: "客厅", entityCount: 2, lightCount: 1, activeLightCount: 1, routineCount: 0, issueCount: 0 }]
    });
    devices.hass = hass(states);
    document.body.append(devices);
    await devices.updateComplete;
    expect(devices.shadowRoot.textContent).toContain("设备总览");
    expect(devices.shadowRoot.querySelectorAll(".device-row")).toHaveLength(2);

    const routines = document.createElement("yeelight-dashboard-routines-card") as TestDashboardCard;
    routines.setConfig({ type: "custom:yeelight-dashboard-routines-card", entities: ["scene.movie"] });
    routines.hass = hass(states);
    document.body.append(routines);
    await routines.updateComplete;
    expect(routines.shadowRoot.textContent).toContain("推荐场景");
    expect(routines.shadowRoot.querySelector(".routine-hero-action")).not.toBeNull();

    const environment = document.createElement("yeelight-dashboard-environment-card") as TestDashboardCard;
    environment.setConfig({ type: "custom:yeelight-dashboard-environment-card", entities: ["weather.home", "sensor.temperature"] });
    environment.hass = hass(states);
    document.body.append(environment);
    await environment.updateComplete;
    expect(environment.shadowRoot.textContent).toContain("环境舒适");
    expect(environment.shadowRoot.textContent).toContain("主要读数");
    expect(environment.shadowRoot.querySelector(".environment-stat")).not.toBeNull();
  });
});
