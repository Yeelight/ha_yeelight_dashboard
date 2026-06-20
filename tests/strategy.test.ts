import { describe, expect, it } from "vitest";

import { YeelightDashboardStrategy } from "../src/strategy/dashboard-strategy";
import { hass, entity } from "./fixtures";

describe("dashboard strategy", () => {
  it("generates HA sections from registry and hass states", async () => {
    const ha = hass(
      {
        "light.ceiling": entity("light.ceiling", "on"),
        "scene.movie": entity("scene.movie"),
        "update.gateway": entity("update.gateway", "on")
      },
      {
        areas: [{ area_id: "living", name: "Living Room" }],
        devices: [{ id: "device-1", area_id: "living", manufacturer: "Yeelight" }],
        entities: [
          { entity_id: "light.ceiling", platform: "yeelight_pro", device_id: "device-1" },
          { entity_id: "scene.movie", platform: "yeelight_pro", device_id: "device-1" },
          { entity_id: "update.gateway", platform: "yeelight_pro", device_id: "device-1" }
        ]
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate({}, ha);
    expect(dashboard.views.map((view) => view.path)).toEqual([
      "overview",
      "lighting",
      "areas",
      "scenes",
      "health"
    ]);
    expect(dashboard.views.every((view) => view.type === "sections")).toBe(true);
    const overviewSections = dashboard.views[0].sections || [];
    const overviewCards = overviewSections.flatMap((section) => section.cards);
    expect(overviewSections.map((section) => section.title)).toEqual(["Home", "Control", "Operations"]);
    expect(overviewCards.map((card) => card.type)).toContain("custom:yeelight-dashboard-routines-card");
    expect(overviewCards.find((card) => card.type === "custom:yeelight-dashboard-hero-card")?.grid_options).toEqual({ columns: 12, rows: 9 });
    expect(overviewCards.find((card) => card.type === "custom:yeelight-dashboard-light-card")?.grid_options).toEqual({ columns: 12, rows: 8 });
    expect(overviewCards.find((card) => card.type === "custom:yeelight-dashboard-rooms-card")?.area_summaries).toMatchObject([
      { areaId: "living", name: "Living Room", activeLightCount: 1 }
    ]);
    expect(JSON.stringify(dashboard)).not.toContain("ha_yeelight_cards");
    expect(JSON.stringify(dashboard)).not.toContain("config/www/yeelight");
  });

  it("generates HA custom canvas views with card view_layout when requested", async () => {
    const ha = hass(
      {
        "light.ceiling": entity("light.ceiling", "on"),
        "scene.movie": entity("scene.movie")
      },
      {
        areas: [{ area_id: "living", name: "Living Room" }],
        devices: [{ id: "device-1", area_id: "living", manufacturer: "Yeelight" }],
        entities: [
          { entity_id: "light.ceiling", platform: "yeelight_pro", device_id: "device-1" },
          { entity_id: "scene.movie", platform: "yeelight_pro", device_id: "device-1" }
        ]
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate(
      {
        layout_mode: "canvas",
        layout_overrides: {
          overview: {
            "overview.hero": { x: 0, y: 0, w: 12, h: 4 },
            "overview.lights": { x: 0, y: 4, w: 6, h: 2 }
          }
        }
      },
      ha
    );

    const overview = dashboard.views.find((view) => view.path === "overview")!;
    expect(overview.type).toBe("custom:yeelight-dashboard-canvas-view");
    expect(overview.layout_studio).toBe(true);
    expect(overview.sections).toBeUndefined();
    expect(overview.cards?.[0].view_layout).toMatchObject({ key: "overview.hero", x: 0, y: 0, w: 12, h: 4 });
    expect(overview.cards?.[1].view_layout).toMatchObject({ key: "overview.lights", x: 0, y: 4, w: 6, h: 2 });
  });

  it("applies profile defaults and selected area filtering", async () => {
    const ha = hass(
      {
        "light.living": entity("light.living", "on"),
        "light.bedroom": entity("light.bedroom", "on"),
        "media_player.speaker": entity("media_player.speaker", "on")
      },
      {
        areas: [
          { area_id: "living", name: "Living Room" },
          { area_id: "bedroom", name: "Bedroom" }
        ],
        devices: [
          { id: "device-living", area_id: "living", manufacturer: "Yeelight" },
          { id: "device-bedroom", area_id: "bedroom", manufacturer: "Yeelight" },
          { id: "device-speaker", area_id: "living", manufacturer: "Other" }
        ],
        entities: [
          { entity_id: "light.living", platform: "yeelight_pro", device_id: "device-living" },
          { entity_id: "light.bedroom", platform: "yeelight_pro", device_id: "device-bedroom" },
          { entity_id: "media_player.speaker", platform: "other", device_id: "device-speaker" }
        ]
      }
    );

    const panel = await YeelightDashboardStrategy.generate({ profile: "panel" }, ha);
    expect(panel.views.every((view) => view.type === "custom:yeelight-dashboard-canvas-view")).toBe(true);
    expect(panel.views.some((view) => view.path === "health")).toBe(false);

    const lighting = await YeelightDashboardStrategy.generate({ profile: "lighting" }, ha);
    expect(lighting.views.some((view) => view.path === "media")).toBe(false);

    const selected = await YeelightDashboardStrategy.generate(
      { area_mode: "selected", selected_areas: ["living"], scope: "all_area_devices" },
      ha
    );
    expect(JSON.stringify(selected)).toContain("light.living");
    expect(JSON.stringify(selected)).not.toContain("light.bedroom");
  });

  it("generates native recipes for weather, calendar, todo and history views", async () => {
    const ha = hass(
      {
        "weather.home": entity("weather.home", "sunny"),
        "calendar.family": entity("calendar.family", "on"),
        "todo.shopping": entity("todo.shopping", "0"),
        "sensor.temperature": entity("sensor.temperature", "24")
      },
      {
        entities: [
          { entity_id: "weather.home", platform: "demo" },
          { entity_id: "calendar.family", platform: "demo" },
          { entity_id: "todo.shopping", platform: "demo" },
          { entity_id: "sensor.temperature", platform: "yeelight_pro" }
        ]
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate(
      { scope: "all_area_devices", views: { environment: true, health: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0],
      ha
    );
    const json = JSON.stringify(dashboard);
    expect(json).toContain('"type":"weather-forecast"');
    expect(json).toContain('"type":"calendar"');
    expect(json).toContain('"type":"todo-list"');
    expect(json).toContain('"type":"history-graph"');
    expect(json).toContain('"type":"statistics-graph"');
  });

  it("does not depend on ha_yeelight_cards even when that card pack is installed", async () => {
    window.customCards = [
      {
        type: "yeelight-light-card",
        name: "Yeelight Light Card",
        preview: true
      }
    ];
    const ha = hass(
      {
        "light.ceiling": entity("light.ceiling", "on")
      },
      {
        devices: [{ id: "device-1", manufacturer: "Yeelight" }],
        entities: [{ entity_id: "light.ceiling", platform: "yeelight_pro", device_id: "device-1" }]
      }
    );

    const dashboard = await YeelightDashboardStrategy.generate({}, ha);
    const json = JSON.stringify(dashboard);

    expect(json).toContain("custom:yeelight-dashboard-light-card");
    expect(json).not.toContain("ha_yeelight_cards");
    expect(json).not.toContain("custom:yeelight-light-card");
  });
});
