import { describe, expect, it } from "vitest";

import { buildRegistryIndex } from "../src/model/registry";
import { entity, hass } from "./fixtures";

describe("registry index", () => {
  it("uses registry platform and device metadata without friendly-name heuristics", () => {
    const ha = hass(
      {
        "light.named_like_yeelight": entity("light.named_like_yeelight", "on", { friendly_name: "Yeelight fake" }),
        "light.real": entity("light.real", "on")
      },
      {
        devices: [{ id: "device-1", manufacturer: "Yeelight" }],
        entities: [
          { entity_id: "light.named_like_yeelight", platform: "mqtt" },
          { entity_id: "light.real", platform: "yeelight_pro", device_id: "device-1" }
        ]
      }
    );
    const index = buildRegistryIndex(ha, {
      areas: [],
      floors: [],
      labels: [],
      devices: [{ id: "device-1", manufacturer: "Yeelight" }],
      entities: [
        { entity_id: "light.named_like_yeelight", platform: "mqtt" },
        { entity_id: "light.real", platform: "yeelight_pro", device_id: "device-1" }
      ]
    });
    expect(index.yeelightEntities).toEqual(["light.real"]);
  });
});
