import { describe, expect, it } from "vitest";

import { YeelightDashboardStrategy } from "../src/strategy/dashboard-strategy";
import { entity, hass } from "./fixtures";

describe("native dashboard recipes", () => {
  it("generates safe HA-native cards for legacy native wrappers without rewrapping them", async () => {
    const ha = hass(
      {
        "light.ceiling": entity("light.ceiling", "on"),
        "switch.wall_plug": entity("switch.wall_plug", "on", { friendly_name: "Wall Plug" }),
        "cover.curtain": entity("cover.curtain", "open"),
        "vacuum.cleaner": entity("vacuum.cleaner", "docked"),
        "weather.home": entity("weather.home", "sunny"),
        "climate.living": entity("climate.living", "heat"),
        "humidifier.bedroom": entity("humidifier.bedroom", "on"),
        "sensor.battery": entity("sensor.battery", "78", { device_class: "battery", unit_of_measurement: "%" }),
        "sensor.temperature": entity("sensor.temperature", "24", { device_class: "temperature", unit_of_measurement: "°C" }),
        "media_player.speaker": entity("media_player.speaker", "playing"),
        "camera.door": entity("camera.door", "streaming"),
        "alarm_control_panel.home": entity("alarm_control_panel.home", "armed_home"),
        "calendar.family": entity("calendar.family", "on"),
        "todo.shopping": entity("todo.shopping", "0")
      },
      {
        areas: [{ area_id: "living", name: "Living Room" }],
        devices: [{ id: "device-living", area_id: "living", manufacturer: "Yeelight" }],
        entities: [
          "light.ceiling",
          "switch.wall_plug",
          "cover.curtain",
          "vacuum.cleaner",
          "weather.home",
          "climate.living",
          "humidifier.bedroom",
          "sensor.battery",
          "sensor.temperature",
          "media_player.speaker",
          "camera.door",
          "alarm_control_panel.home",
          "calendar.family",
          "todo.shopping"
        ].map((entity_id) => ({ entity_id, platform: "demo", device_id: "device-living" }))
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate(
      { scope: "all_area_devices", views: { environment: true, media: true, health: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0],
      ha
    );

    expect(typesFor(dashboard, "lighting")).toEqual(expect.arrayContaining(["custom:yeelight-dashboard-light-card", "custom:yeelight-dashboard-rooms-card", "light"]));
    expect(typesFor(dashboard, "lighting")).not.toContain("tile");
    expect(typesFor(dashboard, "areas")).toEqual(expect.arrayContaining(["area", "entities", "glance", "tile"]));
    expect(typesFor(dashboard, "environment")).toEqual(expect.arrayContaining(["weather-forecast", "thermostat", "humidifier", "gauge", "sensor"]));
    expect(typesFor(dashboard, "environment")).not.toContain("tile");
    expect(typesFor(dashboard, "media")).toEqual(expect.arrayContaining(["media-control", "picture-entity"]));
    expect(typesFor(dashboard, "health")).toEqual(expect.arrayContaining(["alarm-panel", "calendar", "todo-list", "entities", "glance"]));
    const areaCards = cardsFor(dashboard, "areas");
    expect(areaCards.find((card) => card.type === "area" && card.area === "living")).toMatchObject({
      navigation_path: "/home/areas-living?historyBack=1",
      tap_action: { action: "navigate", navigation_path: "/home/areas-living?historyBack=1" }
    });
    expect(areaCards.find((card) => card.type === "tile" && card.entity === "cover.curtain")).toMatchObject({
      tap_action: { action: "more-info" }
    });
    const lightingCards = cardsFor(dashboard, "lighting");
    expect(lightingCards.find((card) => card.type === "light" && card.entity === "light.ceiling")).toMatchObject({
      tap_action: { action: "more-info" }
    });
    const mediaCards = cardsFor(dashboard, "media");
    expect(mediaCards.find((card) => card.type === "picture-entity" && card.entity === "camera.door")).toMatchObject({
      tap_action: { action: "more-info" }
    });
    const allNativeCards = dashboard.views.flatMap((view) => view.sections?.flatMap((section) => section.cards || []) || []).filter((card) => !String(card.type || "").startsWith("custom:"));
    const entityNativeCards = allNativeCards.filter((card) => card.entity || Array.isArray(card.entities));
    expect(entityNativeCards.length).toBeGreaterThan(0);
    expect(entityNativeCards.every((card) => hasMoreInfoTapAction(card))).toBe(true);
    expect(JSON.stringify(dashboard)).not.toContain("custom:webrtc-camera");
    expect(JSON.stringify(dashboard)).not.toContain("config/www/yeelight");
  });

  it("does not create native gauges for non-numeric sensor states", async () => {
    const ha = hass(
      {
        "sensor.percent_unknown": entity("sensor.percent_unknown", "unknown", { device_class: "battery", unit_of_measurement: "%" }),
        "sensor.numeric_power": entity("sensor.numeric_power", "42", { device_class: "power", unit_of_measurement: "W" })
      },
      {
        entities: ["sensor.percent_unknown", "sensor.numeric_power"].map((entity_id) => ({ entity_id, platform: "demo" }))
      }
    );
    const dashboard = await YeelightDashboardStrategy.generate({ scope: "all_area_devices", views: { environment: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0], ha);
    const cards = dashboard.views.find((view) => view.path === "environment")?.sections?.flatMap((section) => section.cards) || [];
    const gauge = cards.find((card) => card.type === "gauge");

    expect(gauge?.entity).toBe("sensor.numeric_power");
  });
});

function typesFor(dashboard: Awaited<ReturnType<typeof YeelightDashboardStrategy.generate>>, path: string): string[] {
  return cardsFor(dashboard, path).map((card) => card.type);
}

function cardsFor(dashboard: Awaited<ReturnType<typeof YeelightDashboardStrategy.generate>>, path: string) {
  return dashboard.views.find((view) => view.path === path)?.sections?.flatMap((section) => section.cards) || [];
}

function hasMoreInfoTapAction(card: Record<string, unknown>): boolean {
  const action = card.tap_action as { action?: string } | undefined;
  return action?.action === "more-info";
}
