import { describe, expect, it } from "vitest";

import { executeEntityAction, turnOffLights } from "../src/cards/actions";
import { entity, hass, type ServiceCall } from "./fixtures";

describe("dashboard card actions", () => {
  it("turns off only currently writable active lights", async () => {
    const calls: ServiceCall[] = [];
    const ha = hass(
      {
        "light.on": entity("light.on", "on"),
        "light.off": entity("light.off", "off"),
        "light.bad": entity("light.bad", "unavailable")
      },
      {},
      calls
    );
    const count = await turnOffLights(ha, ["light.on", "light.off", "light.bad"]);
    expect(count).toBe(1);
    expect(calls).toEqual([{ domain: "light", service: "turn_off", data: { entity_id: "light.on" } }]);
  });

  it("rejects unavailable write actions before calling services", async () => {
    const calls: ServiceCall[] = [];
    const ha = hass({ "light.bad": entity("light.bad", "unknown") }, {}, calls);
    await expect(executeEntityAction(ha, "light.bad", "toggle")).rejects.toThrow("实体当前不可写");
    expect(calls).toEqual([]);
  });

  it("uses standard HA services for routines and buttons", async () => {
    const calls: ServiceCall[] = [];
    const ha = hass({ "scene.movie": entity("scene.movie"), "button.sync": entity("button.sync", "unknown") }, {}, calls);
    await executeEntityAction(ha, "scene.movie", "activate");
    await executeEntityAction(ha, "button.sync", "press");
    expect(calls).toEqual([
      { domain: "scene", service: "turn_on", data: { entity_id: "scene.movie" } },
      { domain: "button", service: "press", data: { entity_id: "button.sync" } }
    ]);
  });
});
