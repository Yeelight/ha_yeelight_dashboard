import { describe, expect, it } from "vitest";

import { YeelightDashboardStrategy } from "../src/strategy/dashboard-strategy";
import type { LovelaceCardConfig } from "../src/types";
import { hass, entity } from "./fixtures";

describe("dashboard strategy", () => {
  it("generates HA sections from registry and hass states", async () => {
    const ha = hass(
      {
        "light.ceiling": entity("light.ceiling", "on"),
        "cover.curtain": entity("cover.curtain", "open"),
        "vacuum.cleaner": entity("vacuum.cleaner", "docked"),
        "scene.movie": entity("scene.movie"),
        "update.gateway": entity("update.gateway", "on")
      },
      {
        areas: [{ area_id: "living", name: "Living Room" }],
        devices: [{ id: "device-1", area_id: "living", manufacturer: "Yeelight" }],
        entities: [
          { entity_id: "light.ceiling", platform: "yeelight_pro", device_id: "device-1" },
          { entity_id: "cover.curtain", platform: "yeelight_pro", device_id: "device-1" },
          { entity_id: "vacuum.cleaner", platform: "yeelight_pro", device_id: "device-1" },
          { entity_id: "scene.movie", platform: "yeelight_pro", device_id: "device-1" },
          { entity_id: "update.gateway", platform: "yeelight_pro", device_id: "device-1" }
        ]
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate({}, ha);
    expect(dashboard.views.map((view) => view.title)).toEqual(["总览", "灯光", "设备", "场景", "健康"]);
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
    expect(overviewSections.map((section) => section.title)).toEqual(["家庭", "控制", "运营"]);
    expect(overviewCards).toHaveLength(8);
    expect(overviewCards.map((card) => card.type)).toContain("custom:yeelight-dashboard-status-card");
    expect(overviewCards.map((card) => card.type)).toContain("custom:yeelight-dashboard-notice-card");
    expect(overviewCards.map((card) => card.type)).toContain("custom:yeelight-dashboard-ecosystem-card");
    expect(overviewCards.map((card) => card.type)).toContain("custom:yeelight-dashboard-routines-card");
    expect(overviewCards.find((card) => card.type === "custom:yeelight-dashboard-hero-card")?.grid_options).toEqual({ columns: 12, rows: 9 });
    expect(overviewCards.find((card) => card.type === "custom:yeelight-dashboard-hero-card")?.subtype).toBe("panel");
    expect(overviewCards.find((card) => card.type === "custom:yeelight-dashboard-light-card")?.subtype).toBe("favorites");
    expect(overviewCards.find((card) => card.type === "custom:yeelight-dashboard-routines-card")?.subtype).toBe("quick");
    expect(overviewCards.find((card) => card.type === "custom:yeelight-dashboard-status-card")?.grid_options).toEqual({ columns: 12, rows: 5 });
    expect(overviewCards.find((card) => card.type === "custom:yeelight-dashboard-light-card")?.grid_options).toEqual({ columns: 12, rows: 8 });
    expect(overviewCards.find((card) => card.type === "custom:yeelight-dashboard-rooms-card")?.area_summaries).toMatchObject([
      { areaId: "living", name: "Living Room", activeLightCount: 1 }
    ]);
    const areas = dashboard.views.find((view) => view.path === "areas")!;
    const areaCards = areas.sections?.flatMap((section) => section.cards) || [];
    expect(areas.title).toBe("设备");
    expect(areas.sections?.map((section) => section.title)).toEqual(["设备与房间", "HA 标准卡片", "Living Room"]);
    expect(areaCards.map((card) => card.type)).toContain("custom:yeelight-dashboard-devices-card");
    expect(areaCards.find((card) => card.type === "custom:yeelight-dashboard-devices-card")?.subtype).toBe("activity");
    expect(areaCards).toEqual(expect.arrayContaining([expect.objectContaining({ type: "area", area: "living" })]));
    expect(areaCards).toEqual(expect.arrayContaining([expect.objectContaining({ type: "tile", entity: "cover.curtain" })]));
    expect(areaCards).toEqual(expect.arrayContaining([expect.objectContaining({ type: "tile", entity: "vacuum.cleaner" })]));
    const routines = dashboard.views.find((view) => view.path === "scenes")!;
    expect(routines.title).toBe("场景");
    expect(routines.sections?.map((section) => section.title)).toEqual(["场景与例程"]);
    expect(routines.sections?.[0].cards[0].type).toBe("custom:yeelight-dashboard-panel-actions-card");
    expect(routines.sections?.[0].cards.some((card) => card.type === "custom:yeelight-dashboard-routines-card")).toBe(false);
    const lighting = dashboard.views.find((view) => view.path === "lighting")!;
    expect(
      (lighting.sections?.flatMap((section) => section.cards) || []).filter((card) => card.type === "custom:yeelight-dashboard-light-card").map(layoutKey)
    ).toEqual(["lighting.overview", "lighting.status"]);
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
    expect(overview.cards?.[1].view_layout).toMatchObject({ key: "overview.status" });
    expect(overview.cards?.[2].view_layout).toMatchObject({ key: "overview.lights", x: 0, w: 6, h: 2 });
    expect(Number((overview.cards?.[2].view_layout as { y?: number } | undefined)?.y)).toBeGreaterThanOrEqual(4);
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

  it("generates Phase A product cards for media, cameras, security and presence", async () => {
    const ha = hass(
      {
        "media_player.speaker": entity("media_player.speaker", "playing"),
        "remote.tv": entity("remote.tv", "on"),
        "camera.door": entity("camera.door", "streaming"),
        "alarm_control_panel.home": entity("alarm_control_panel.home", "armed_home"),
        "lock.front": entity("lock.front", "locked"),
        "binary_sensor.motion": entity("binary_sensor.motion", "on", { device_class: "motion" })
      },
      {
        entities: [
          { entity_id: "media_player.speaker", platform: "demo" },
          { entity_id: "remote.tv", platform: "demo" },
          { entity_id: "camera.door", platform: "demo" },
          { entity_id: "alarm_control_panel.home", platform: "demo" },
          { entity_id: "lock.front", platform: "demo" },
          { entity_id: "binary_sensor.motion", platform: "demo", device_class: "motion" }
        ]
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate({ scope: "all_area_devices", views: { media: true, health: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0], ha);
    const json = JSON.stringify(dashboard);
    const media = dashboard.views.find((view) => view.path === "media")!;
    expect(media.sections?.map((section) => section.title)).toEqual(["媒体", "摄像与看护", "HA 标准卡片"]);
    const mediaCards = media.sections?.flatMap((section) => section.cards) || [];
    expect(mediaCards.map((card) => card.type)).toEqual(
      expect.arrayContaining(["custom:yeelight-dashboard-media-card", "custom:yeelight-dashboard-camera-card", "custom:yeelight-dashboard-camera-wall-card"])
    );
    expect(mediaCards.find((card) => card.type === "custom:yeelight-dashboard-media-card")?.subtype).toBe("hub");
    expect(mediaCards.find((card) => card.type === "custom:yeelight-dashboard-camera-wall-card")?.grid_options).toEqual({ columns: 12, rows: 8 });
    expect(json).toContain("custom:yeelight-dashboard-security-card");
    expect(json).toContain("custom:yeelight-dashboard-presence-card");
    expect(json).toContain('"type":"media-control"');
  });

  it("generates native recipes for weather, calendar, todo and history views", async () => {
    const ha = hass(
      {
        "weather.home": entity("weather.home", "sunny"),
        "climate.living": entity("climate.living", "cool"),
        "fan.ceiling": entity("fan.ceiling", "on"),
        "humidifier.bedroom": entity("humidifier.bedroom", "off"),
        "sensor.water_filter": entity("sensor.water_filter", "80", { friendly_name: "Water Filter" }),
        "switch.wall_plug": entity("switch.wall_plug", "on", { friendly_name: "Wall Plug" }),
        "sensor.plug_power": entity("sensor.plug_power", "42", { friendly_name: "Plug Power", device_class: "power" }),
        "sensor.home_energy": entity("sensor.home_energy", "12", { friendly_name: "Home Energy", device_class: "energy" }),
        "sensor.server_cpu": entity("sensor.server_cpu", "32", { friendly_name: "Server CPU" }),
        "calendar.family": entity("calendar.family", "on"),
        "todo.shopping": entity("todo.shopping", "0"),
        "person.dong": entity("person.dong", "home"),
        "device_tracker.phone": entity("device_tracker.phone", "home"),
        "binary_sensor.front_door": entity("binary_sensor.front_door", "off", { device_class: "door" }),
        "sensor.temperature": entity("sensor.temperature", "24")
      },
      {
        entities: [
          { entity_id: "weather.home", platform: "demo" },
          { entity_id: "climate.living", platform: "demo" },
          { entity_id: "fan.ceiling", platform: "demo" },
          { entity_id: "humidifier.bedroom", platform: "demo" },
          { entity_id: "sensor.water_filter", platform: "demo" },
          { entity_id: "switch.wall_plug", platform: "demo" },
          { entity_id: "sensor.plug_power", platform: "demo", device_class: "power" },
          { entity_id: "sensor.home_energy", platform: "demo", device_class: "energy" },
          { entity_id: "sensor.server_cpu", platform: "demo" },
          { entity_id: "calendar.family", platform: "demo" },
          { entity_id: "todo.shopping", platform: "demo" },
          { entity_id: "person.dong", platform: "demo" },
          { entity_id: "device_tracker.phone", platform: "demo" },
          { entity_id: "binary_sensor.front_door", platform: "demo", device_class: "door" },
          { entity_id: "sensor.temperature", platform: "yeelight_pro" }
        ]
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate(
      { scope: "all_area_devices", views: { environment: true, health: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0],
      ha
    );
    const json = JSON.stringify(dashboard);
    const environment = dashboard.views.find((view) => view.path === "environment")!;
    const environmentSections = environment.sections || [];
    const environmentCards = environmentSections[0]?.cards || [];
    const environmentNativeCards = environmentSections.find((section) => section.title === "HA 标准卡片")?.cards || [];
    expect(environment.title).toBe("环境");
    expect(environmentSections.map((section) => section.title)).toEqual(["环境", "HA 标准卡片"]);
    expect(environmentCards[0].type).toBe("custom:yeelight-dashboard-environment-card");
    expect(environmentCards[0].subtype).toBe("overview");
    expect(environmentCards.map((card) => card.type)).toEqual(
      expect.arrayContaining([
        "custom:yeelight-dashboard-air-card",
        "custom:yeelight-dashboard-water-card",
        "custom:yeelight-dashboard-power-card",
        "custom:yeelight-dashboard-energy-card"
      ])
    );
    expect(environmentCards.map((card) => card.type)).not.toContain("custom:yeelight-dashboard-climate-card");
    expect(environmentCards.find((card) => card.type === "custom:yeelight-dashboard-air-card")?.subtype).toBe("fan");
    expect(environmentCards.find((card) => card.type === "custom:yeelight-dashboard-water-card")?.grid_options).toEqual({ columns: 12, rows: 6 });
    expect(environmentCards.find((card) => card.type === "custom:yeelight-dashboard-power-card")?.subtype).toBe("socket");
    expect(environmentCards.find((card) => card.type === "custom:yeelight-dashboard-energy-card")?.grid_options).toEqual({ columns: 12, rows: 6 });
    expect(environmentNativeCards.map((card) => card.type)).toEqual(expect.arrayContaining(["thermostat", "humidifier", "gauge", "sensor"]));
    expect(environmentNativeCards.map((card) => card.type)).not.toContain("tile");
    const health = dashboard.views.find((view) => view.path === "health")!;
    const healthSections = health.sections || [];
    const healthCards = healthSections[0]?.cards || [];
    const healthNativeCards = healthSections.find((section) => section.title === "HA 标准卡片")?.cards || [];
    expect(healthSections.map((section) => section.title)).toEqual(["健康", "安防与在家", "HA 标准卡片"]);
    expect(healthCards.map((card) => card.type)).toContain("custom:yeelight-dashboard-infrastructure-card");
    expect(json).toContain('"type":"weather-forecast"');
    expect(json).toContain('"type":"calendar"');
    expect(json).toContain('"type":"todo-list"');
    expect(json).toContain('"type":"logbook"');
    expect(json).toContain('"type":"map"');
    expect(json).toContain('"type":"history-graph"');
    expect(json).toContain('"type":"statistics-graph"');
    expect(json).toContain('"type":"entities"');
    expect(json).toContain('"type":"glance"');
    expect(healthNativeCards.find((card) => card.type === "logbook")?.entities).toEqual(expect.arrayContaining(["binary_sensor.front_door"]));
    expect(healthNativeCards.find((card) => card.type === "map")?.entities).toEqual(expect.arrayContaining(["person.dong", "device_tracker.phone"]));
  });

  it("generates Phase D panel actions without forcing image or note content cards", async () => {
    const ha = hass(
      {
        "scene.movie": entity("scene.movie", "off"),
        "script.clean": entity("script.clean", "off"),
        "button.find": entity("button.find", "off")
      },
      {
        entities: [
          { entity_id: "scene.movie", platform: "demo" },
          { entity_id: "script.clean", platform: "demo" },
          { entity_id: "button.find", platform: "demo" }
        ]
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate({ scope: "all_area_devices", views: { routines: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0], ha);
    const routines = dashboard.views.find((view) => view.path === "scenes")!;
    const cards = routines.sections?.flatMap((section) => section.cards) || [];
    expect(cards.find((card) => card.type === "custom:yeelight-dashboard-panel-actions-card")).toMatchObject({
      subtype: "standard",
      grid_options: { columns: 12, rows: 4 }
    });
    expect(JSON.stringify(dashboard)).not.toContain("custom:yeelight-dashboard-image-card");
    expect(JSON.stringify(dashboard)).not.toContain("custom:yeelight-dashboard-note-card");
  });

  it("keeps standard scenes and environment pages focused instead of duplicating every subtype", async () => {
    const ha = hass(
      {
        "scene.movie": entity("scene.movie", "off"),
        "script.clean": entity("script.clean", "off"),
        "button.find": entity("button.find", "off"),
        "weather.home": entity("weather.home", "sunny"),
        "climate.living": entity("climate.living", "cool"),
        "fan.ceiling": entity("fan.ceiling", "on"),
        "sensor.plug_power": entity("sensor.plug_power", "42", { device_class: "power", unit_of_measurement: "W" }),
        "sensor.energy": entity("sensor.energy", "12", { device_class: "energy", unit_of_measurement: "kWh" }),
        "sensor.lux": entity("sensor.lux", "410", { device_class: "illuminance", unit_of_measurement: "lx" })
      },
      {
        entities: [
          "scene.movie",
          "script.clean",
          "button.find",
          "weather.home",
          "climate.living",
          "fan.ceiling",
          "sensor.plug_power",
          "sensor.energy",
          "sensor.lux"
        ].map((entity_id) => ({ entity_id, platform: "demo" }))
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate({ scope: "all_area_devices", views: { environment: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0], ha);
    const sceneCards = dashboard.views.find((view) => view.path === "scenes")?.sections?.flatMap((section) => section.cards) || [];
    const environmentCards = dashboard.views.find((view) => view.path === "environment")?.sections?.flatMap((section) => section.cards) || [];

    expect(sceneCards.filter((card) => card.type === "custom:yeelight-dashboard-panel-actions-card")).toHaveLength(1);
    expect(sceneCards.filter((card) => card.type === "custom:yeelight-dashboard-routines-card")).toHaveLength(0);
    expect(environmentCards.filter((card) => String(card.type).startsWith("custom:yeelight-dashboard-"))).toHaveLength(4);
    expect(subtypes(environmentCards, "custom:yeelight-dashboard-environment-card")).toEqual(["overview", "illuminance"]);
    expect(subtypes(environmentCards, "custom:yeelight-dashboard-climate-card")).toEqual([]);
    expect(subtypes(environmentCards, "custom:yeelight-dashboard-power-card")).toEqual(["socket"]);
    expect(subtypes(environmentCards, "custom:yeelight-dashboard-energy-card")).toEqual([]);
  });

  it("deduplicates advanced scene cards when subtype filters resolve to the same entity set", async () => {
    const ha = hass(
      {
        "button.find": entity("button.find", "off")
      },
      {
        entities: [{ entity_id: "button.find", platform: "demo" }]
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate({ profile: "advanced", scope: "all_area_devices", views: { routines: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0], ha);
    const sceneCards = dashboard.views.find((view) => view.path === "scenes")?.sections?.flatMap((section) => section.cards) || [];

    expect(subtypes(sceneCards, "custom:yeelight-dashboard-routines-card")).toEqual(["list"]);
  });

  it("hides all-unknown environment detail cards in standard profile", async () => {
    const ha = hass(
      {
        "climate.living": entity("climate.living", "cool"),
        "sensor.air_unknown": entity("sensor.air_unknown", "unknown", { friendly_name: "Air PM25", device_class: "pm25", unit_of_measurement: "%" }),
        "sensor.power_unknown": entity("sensor.power_unknown", "unknown", { friendly_name: "Plug Power", device_class: "power", unit_of_measurement: "W" }),
        "sensor.energy_unknown": entity("sensor.energy_unknown", "unknown", { friendly_name: "Home Energy", device_class: "energy", unit_of_measurement: "kWh" })
      },
      {
        entities: ["climate.living", "sensor.air_unknown", "sensor.power_unknown", "sensor.energy_unknown"].map((entity_id) => ({ entity_id, platform: "demo" }))
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate({ scope: "all_area_devices", views: { environment: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0], ha);
    const environmentCards = dashboard.views.find((view) => view.path === "environment")?.sections?.flatMap((section) => section.cards) || [];

    expect(subtypes(environmentCards, "custom:yeelight-dashboard-environment-card")).toEqual(["overview"]);
    expect(environmentCards.some((card) => card.type === "custom:yeelight-dashboard-air-card")).toBe(false);
    expect(environmentCards.some((card) => card.type === "custom:yeelight-dashboard-power-card")).toBe(false);
    expect(environmentCards.some((card) => card.type === "custom:yeelight-dashboard-energy-card")).toBe(false);
  });

  it("deduplicates standard environment cards when climate detail repeats the overview entity set", async () => {
    const ha = hass(
      {
        "weather.home": entity("weather.home", "sunny"),
        "sensor.temperature": entity("sensor.temperature", "24", { device_class: "temperature", unit_of_measurement: "°C" })
      },
      {
        entities: [
          { entity_id: "weather.home", platform: "demo" },
          { entity_id: "sensor.temperature", platform: "demo", device_class: "temperature" }
        ]
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate({ scope: "all_area_devices", views: { environment: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0], ha);
    const environmentCards = dashboard.views.find((view) => view.path === "environment")?.sections?.flatMap((section) => section.cards) || [];

    expect(environmentCards.filter((card) => String(card.type).startsWith("custom:yeelight-dashboard-")).map((card) => [card.type, card.subtype])).toEqual([
      ["custom:yeelight-dashboard-environment-card", "overview"]
    ]);
  });

  it("generates Phase D image and note cards only when matching content sources exist", async () => {
    const ha = hass(
      {
        "camera.door": entity("camera.door", "streaming", { friendly_name: "Door Camera" }),
        "camera.yard": entity("camera.yard", "idle", { friendly_name: "Yard Camera" }),
        "sensor.family_note": entity("sensor.family_note", "ok", { friendly_name: "Family Reminder Note" }),
        "sensor.random": entity("sensor.random", "42", { friendly_name: "Random Sensor" })
      },
      {
        entities: [
          { entity_id: "camera.door", platform: "demo" },
          { entity_id: "camera.yard", platform: "demo" },
          { entity_id: "sensor.family_note", platform: "demo" },
          { entity_id: "sensor.random", platform: "demo" }
        ]
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate({ scope: "all_area_devices", views: { media: true, health: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0], ha);
    const mediaCards = dashboard.views.find((view) => view.path === "media")?.sections?.flatMap((section) => section.cards) || [];
    const healthCards = dashboard.views.find((view) => view.path === "health")?.sections?.flatMap((section) => section.cards) || [];

    expect(mediaCards.find((card) => card.type === "custom:yeelight-dashboard-image-card")).toMatchObject({
      subtype: "carousel",
      entities: ["camera.door", "camera.yard"],
      grid_options: { columns: 12, rows: 6 }
    });
    expect(healthCards.find((card) => card.type === "custom:yeelight-dashboard-note-card")).toMatchObject({
      subtype: "standard",
      entities: ["sensor.family_note"],
      grid_options: { columns: 12, rows: 4 }
    });
    expect(JSON.stringify(healthCards.find((card) => card.type === "custom:yeelight-dashboard-note-card"))).not.toContain("sensor.random");
  });

  it("generates native routine cards without empty product cards when only calendar and todo exist", async () => {
    const ha = hass(
      {
        "calendar.family": entity("calendar.family", "on"),
        "todo.shopping": entity("todo.shopping", "0")
      },
      {
        entities: [
          { entity_id: "calendar.family", platform: "demo" },
          { entity_id: "todo.shopping", platform: "demo" }
        ]
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate({ scope: "all_area_devices", views: { routines: "auto" } } as Parameters<typeof YeelightDashboardStrategy.generate>[0], ha);
    const routines = dashboard.views.find((view) => view.path === "scenes")!;
    const cards = routines.sections?.flatMap((section) => section.cards) || [];

    expect(cards.map((card) => card.type)).toEqual(["calendar", "todo-list"]);
    expect(cards[0]).toMatchObject({ entities: ["calendar.family"] });
    expect(cards[1]).toMatchObject({ entity: "todo.shopping" });
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

function subtypes(cards: LovelaceCardConfig[], type: string): string[] {
  return cards.filter((card) => card.type === type).map((card) => String(card.subtype || ""));
}

function layoutKey(card: LovelaceCardConfig): string {
  return String((card.view_layout as { key?: unknown } | undefined)?.key || "");
}
