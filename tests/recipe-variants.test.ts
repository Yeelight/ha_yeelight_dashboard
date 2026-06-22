import { describe, expect, it } from "vitest";

import { YeelightDashboardStrategy } from "../src/strategy/dashboard-strategy";
import type { LovelaceCardConfig, LovelaceDashboardConfig } from "../src/types";
import { entity, hass } from "./fixtures";

describe("dashboard recipe variants", () => {
  it("generates editable product-card variants for legacy-rich dashboard pages", async () => {
    const ha = hass(
      {
        "light.living": entity("light.living", "on", { friendly_name: "Living Light" }),
        "switch.wall_plug": entity("switch.wall_plug", "on", { friendly_name: "Wall Plug" }),
        "cover.curtain": entity("cover.curtain", "open", { friendly_name: "Living Curtain" }),
        "vacuum.cleaner": entity("vacuum.cleaner", "docked", { friendly_name: "Cleaner" }),
        "scene.movie": entity("scene.movie", "off", { friendly_name: "Movie" }),
        "script.goodnight": entity("script.goodnight", "off", { friendly_name: "Good Night" }),
        "automation.away": entity("automation.away", "on", { friendly_name: "Away Automation" }),
        "button.find": entity("button.find", "off", { friendly_name: "Find Remote" }),
        "schedule.wake": entity("schedule.wake", "on", { friendly_name: "Wake Schedule" }),
        "weather.home": entity("weather.home", "sunny", { friendly_name: "Home Weather" }),
        "climate.living": entity("climate.living", "cool", { friendly_name: "Living AC" }),
        "fan.ceiling": entity("fan.ceiling", "on", { friendly_name: "Ceiling Fan" }),
        "humidifier.room": entity("humidifier.room", "off", { friendly_name: "Room Humidifier" }),
        "sensor.lux": entity("sensor.lux", "410", { friendly_name: "Living Illuminance", device_class: "illuminance", unit_of_measurement: "lx" }),
        "sensor.temperature": entity("sensor.temperature", "24", { friendly_name: "Temperature", device_class: "temperature", unit_of_measurement: "°C" }),
        "sensor.plug_power": entity("sensor.plug_power", "42", { friendly_name: "Plug Power", device_class: "power", unit_of_measurement: "W" }),
        "sensor.home_energy": entity("sensor.home_energy", "12.5", { friendly_name: "Home Energy", device_class: "energy", unit_of_measurement: "kWh" }),
        "media_player.speaker": entity("media_player.speaker", "playing", { friendly_name: "Speaker", media_title: "Morning Mix" }),
        "media_player.broadcast": entity("media_player.broadcast", "playing", { friendly_name: "Broadcast Radio" }),
        "media_player.voice": entity("media_player.voice", "idle", { friendly_name: "Voice Assistant" }),
        "remote.tv": entity("remote.tv", "on", { friendly_name: "TV Remote" }),
        "camera.door": entity("camera.door", "streaming", { friendly_name: "Door Camera" }),
        "alarm_control_panel.home": entity("alarm_control_panel.home", "armed_home", { friendly_name: "Home Alarm" }),
        "lock.front": entity("lock.front", "locked", { friendly_name: "Front Lock" }),
        "binary_sensor.front_door": entity("binary_sensor.front_door", "off", { friendly_name: "Front Door", device_class: "door" }),
        "person.dong": entity("person.dong", "home", { friendly_name: "Dong" }),
        "device_tracker.phone": entity("device_tracker.phone", "home", { friendly_name: "Phone" }),
        "sensor.server_cpu": entity("sensor.server_cpu", "32", { friendly_name: "Server CPU", unit_of_measurement: "%" }),
        "sensor.router_wan": entity("sensor.router_wan", "online", { friendly_name: "Router WAN" }),
        "sensor.nas_disk": entity("sensor.nas_disk", "62", { friendly_name: "NAS Disk", unit_of_measurement: "%" }),
        "sensor.pve_cpu": entity("sensor.pve_cpu", "18", { friendly_name: "PVE CPU", unit_of_measurement: "%" }),
        "update.gateway": entity("update.gateway", "on", { friendly_name: "Gateway Update" }),
        "binary_sensor.backup_problem": entity("binary_sensor.backup_problem", "on", { friendly_name: "Backup Problem", device_class: "problem" }),
        "event.doorbell": entity("event.doorbell", "2026-06-21T10:00:00", { friendly_name: "Doorbell Event" })
      },
      {
        areas: [{ area_id: "living", name: "Living Room" }],
        devices: [{ id: "device-living", area_id: "living", manufacturer: "Yeelight" }],
        entities: [
          "light.living",
          "switch.wall_plug",
          "cover.curtain",
          "vacuum.cleaner",
          "scene.movie",
          "script.goodnight",
          "automation.away",
          "button.find",
          "schedule.wake",
          "weather.home",
          "climate.living",
          "fan.ceiling",
          "humidifier.room",
          "sensor.lux",
          "sensor.temperature",
          "sensor.plug_power",
          "sensor.home_energy",
          "media_player.speaker",
          "media_player.broadcast",
          "media_player.voice",
          "remote.tv",
          "camera.door",
          "alarm_control_panel.home",
          "lock.front",
          "binary_sensor.front_door",
          "person.dong",
          "device_tracker.phone",
          "sensor.server_cpu",
          "sensor.router_wan",
          "sensor.nas_disk",
          "sensor.pve_cpu",
          "update.gateway",
          "binary_sensor.backup_problem",
          "event.doorbell"
        ].map((entity_id) => ({ entity_id, platform: "demo", device_id: "device-living" }))
      }
    );

    const dashboard = await YeelightDashboardStrategy.generate(
      { profile: "advanced", scope: "all_area_devices", views: { environment: true, media: true, health: true } } as Parameters<typeof YeelightDashboardStrategy.generate>[0],
      ha
    );

    expect(subtypes(cardsFor(dashboard, "areas"), "custom:yeelight-dashboard-devices-card")).toEqual(expect.arrayContaining(["activity", "list", "universal", "single"]));
    expect(subtypes(cardsFor(dashboard, "scenes"), "custom:yeelight-dashboard-routines-card")).toEqual(
      expect.arrayContaining(["list", "commands", "scripts", "automations", "schedule", "button"])
    );
    expect(subtypes(cardsFor(dashboard, "scenes"), "custom:yeelight-dashboard-routines-card")).not.toContain("quick");
    expect(subtypes(cardsFor(dashboard, "environment"), "custom:yeelight-dashboard-environment-card")).toEqual(expect.arrayContaining(["overview", "weather", "sensors", "illuminance"]));
    expect(subtypes(cardsFor(dashboard, "environment"), "custom:yeelight-dashboard-air-card")).toEqual(expect.arrayContaining(["fan", "humidifier"]));
    expect(subtypes(cardsFor(dashboard, "environment"), "custom:yeelight-dashboard-power-card")).toEqual(expect.arrayContaining(["socket", "electricity"]));
    expect(subtypes(cardsFor(dashboard, "environment"), "custom:yeelight-dashboard-energy-card")).toEqual(expect.arrayContaining(["summary", "insights"]));
    expect(subtypes(cardsFor(dashboard, "media"), "custom:yeelight-dashboard-media-card")).toEqual(expect.arrayContaining(["hub", "player", "max-player", "broadcast", "voice", "remote"]));
    expect(subtypes(cardsFor(dashboard, "media"), "custom:yeelight-dashboard-camera-card")).toEqual(expect.arrayContaining(["overview", "single"]));
    expect(subtypes(cardsFor(dashboard, "health"), "custom:yeelight-dashboard-security-card")).toEqual(expect.arrayContaining(["overview", "alarm", "lock", "binary-sensor"]));
    expect(subtypes(cardsFor(dashboard, "health"), "custom:yeelight-dashboard-presence-card")).toEqual(expect.arrayContaining(["motion", "people", "family", "tracker"]));
    expect(subtypes(cardsFor(dashboard, "health"), "custom:yeelight-dashboard-infrastructure-card")).toEqual(expect.arrayContaining(["server", "router", "nas", "pve", "server-list", "pve-list"]));
    expect(subtypes(cardsFor(dashboard, "health"), "custom:yeelight-dashboard-health-card")).toEqual(expect.arrayContaining(["overview", "updates", "repairs-backup", "network", "events", "history"]));
  });
});

function cardsFor(dashboard: LovelaceDashboardConfig, path: string): LovelaceCardConfig[] {
  return dashboard.views.find((view) => view.path === path)?.sections?.flatMap((section) => section.cards) || [];
}

function subtypes(cards: LovelaceCardConfig[], type: string): string[] {
  return cards.filter((card) => card.type === type).map((card) => String(card.subtype || ""));
}
