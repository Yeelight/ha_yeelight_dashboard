import { describe, expect, it } from "vitest";

import { STRATEGY_CONFIG_TYPE, normalizeConfig } from "../src/strategy/config";

describe("strategy config", () => {
  it("keeps the HA strategy YAML type in normalized config", () => {
    expect(normalizeConfig()).toMatchObject({ type: STRATEGY_CONFIG_TYPE });
    expect(normalizeConfig({ type: "wrong", profile: "lighting" } as Parameters<typeof normalizeConfig>[0])).toMatchObject({
      type: STRATEGY_CONFIG_TYPE,
      profile: "lighting"
    });
  });

  it("applies profile defaults without losing explicit overrides", () => {
    expect(normalizeConfig({ profile: "panel" })).toMatchObject({
      theme: "Yeelight Panel",
      layout_mode: "canvas",
      views: { health: false }
    });
    expect(normalizeConfig({ profile: "lighting" })).toMatchObject({
      scope: "yeelight_only",
      preferences: { show_non_yeelight_entities: false, scene_limit: 6 },
      views: { media: false }
    });
    expect(normalizeConfig({ profile: "panel", layout_mode: "sections", views: { health: true } } as Parameters<typeof normalizeConfig>[0])).toMatchObject({
      layout_mode: "sections",
      views: { health: true }
    });
  });

  it("normalizes selected areas and preference values", () => {
    const config = normalizeConfig({
      selected_areas: ["living", "living", "", 5 as unknown as string],
      preferences: { density: "invalid", show_offline: "yes", scene_limit: 99 }
    } as unknown as Parameters<typeof normalizeConfig>[0]);

    expect(config.selected_areas).toEqual(["living"]);
    expect(config.preferences).toMatchObject({ density: "comfortable", show_offline: true, scene_limit: 24 });
  });

  it("normalizes managed canvas layout overrides", () => {
    const config = normalizeConfig({
      layout_overrides: {
        overview: {
          "overview.hero": { x: 0.4, y: 1.6, w: 12, h: 3, z: "2" },
          empty: {},
          invalid: { x: "nope" }
        },
        unknown: {
          ignored: { x: 1 }
        }
      }
    } as unknown as Parameters<typeof normalizeConfig>[0]);

    expect(config.layout_overrides).toEqual({
      overview: {
        "overview.hero": { x: 0, y: 2, w: 12, h: 3, z: 2 }
      }
    });
  });
});
