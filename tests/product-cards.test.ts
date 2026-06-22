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
    expect(devices.shadowRoot.textContent).toContain("设备重点");
    expect(devices.shadowRoot.querySelector(".device-feature")).not.toBeNull();
    expect(devices.shadowRoot.querySelectorAll(".device-lane")).toHaveLength(3);
    expect(devices.shadowRoot.querySelectorAll(".device-row")).toHaveLength(2);

    const routines = document.createElement("yeelight-dashboard-routines-card") as TestDashboardCard;
    routines.setConfig({ type: "custom:yeelight-dashboard-routines-card", entities: ["scene.movie"] });
    routines.hass = hass(states);
    document.body.append(routines);
    await routines.updateComplete;
    expect(routines.shadowRoot.textContent).toContain("推荐操作");
    expect(routines.shadowRoot.querySelector(".routine-hero-action")).not.toBeNull();
    expect(routines.shadowRoot.querySelector(".routine-hero-action")?.className).toContain("domain-scene");
    expect(routines.shadowRoot.querySelector(".routine-feature-main")).not.toBeNull();
    expect(routines.shadowRoot.querySelectorAll(".routine-type-chips button, .routine-type-chips span")).toHaveLength(4);

    const environment = document.createElement("yeelight-dashboard-environment-card") as TestDashboardCard;
    environment.setConfig({ type: "custom:yeelight-dashboard-environment-card", entities: ["weather.home", "sensor.temperature"] });
    environment.hass = hass(states);
    document.body.append(environment);
    await environment.updateComplete;
    expect(environment.shadowRoot.textContent).toContain("环境舒适");
    expect(environment.shadowRoot.textContent).toContain("主要读数");
    expect(environment.shadowRoot.querySelector(".environment-primary strong")?.textContent).toBe("晴");
    expect(environment.shadowRoot.querySelector(".environment-primary small")?.textContent).toBe("Home Weather");
    expect(environment.shadowRoot.querySelectorAll(".environment-zone")).toHaveLength(4);
    expect(environment.shadowRoot.querySelector(".environment-stat")).not.toBeNull();
  });

  it("opens HA more-info from concrete entity bodies and readings", async () => {
    const events: string[] = [];
    const states = {
      "light.living": entity("light.living", "on", { friendly_name: "Living Light" }),
      "scene.movie": entity("scene.movie", "off", { friendly_name: "Movie" }),
      "weather.home": entity("weather.home", "sunny", { friendly_name: "Home Weather" }),
      "sensor.temperature": entity("sensor.temperature", "24", { friendly_name: "Temperature", device_class: "temperature" })
    };
    const capture = (event: Event) => events.push((event as CustomEvent<{ entityId: string }>).detail.entityId);

    const light = document.createElement("yeelight-dashboard-light-card") as TestDashboardCard;
    light.setConfig({ type: "custom:yeelight-dashboard-light-card", entities: ["light.living"] });
    light.hass = hass(states);
    light.addEventListener("hass-more-info", capture);
    document.body.append(light);
    await light.updateComplete;
    light.shadowRoot.querySelector<HTMLButtonElement>(".entity-tile-main")!.click();

    const hero = document.createElement("yeelight-dashboard-hero-card") as TestDashboardCard;
    hero.setConfig({ type: "custom:yeelight-dashboard-hero-card", entities: ["scene.movie"], show_metrics: false });
    hero.hass = hass(states);
    hero.addEventListener("hass-more-info", capture);
    document.body.append(hero);
    await hero.updateComplete;
    hero.shadowRoot.querySelector<HTMLButtonElement>(".action-tile-main")!.click();

    const routines = document.createElement("yeelight-dashboard-routines-card") as TestDashboardCard;
    routines.setConfig({ type: "custom:yeelight-dashboard-routines-card", entities: ["scene.movie"] });
    routines.hass = hass(states);
    routines.addEventListener("hass-more-info", capture);
    document.body.append(routines);
    await routines.updateComplete;
    routines.shadowRoot.querySelector<HTMLButtonElement>(".routine-feature-main")!.click();

    const environment = document.createElement("yeelight-dashboard-environment-card") as TestDashboardCard;
    environment.setConfig({ type: "custom:yeelight-dashboard-environment-card", entities: ["weather.home", "sensor.temperature"] });
    environment.hass = hass(states);
    environment.addEventListener("hass-more-info", capture);
    document.body.append(environment);
    await environment.updateComplete;
    environment.shadowRoot.querySelector<HTMLButtonElement>(".environment-primary")!.click();
    environment.shadowRoot.querySelector<HTMLButtonElement>(".environment-stat")!.click();

    expect(events).toEqual(["light.living", "scene.movie", "scene.movie", "weather.home", "sensor.temperature"]);
  });

  it("navigates aggregate controls to HA native pages instead of opening entity details", async () => {
    const moreInfoEvents: string[] = [];
    const navigationEvents: string[] = [];
    const states = {
      "light.living": entity("light.living", "on", { friendly_name: "Living Light" }),
      "light.hall": entity("light.hall", "on", { friendly_name: "Hall Light" }),
      "switch.plug": entity("switch.plug", "off", { friendly_name: "Plug" }),
      "scene.movie": entity("scene.movie", "off", { friendly_name: "Movie" }),
      "button.find": entity("button.find", "off", { friendly_name: "Find Button" }),
      "sensor.temperature": entity("sensor.temperature", "24", { friendly_name: "Temperature" })
    };
    const captureNavigation = () => navigationEvents.push(`${window.location.pathname}${window.location.search}`);
    window.addEventListener("location-changed", captureNavigation);
    window.history.replaceState(null, "", "/yeelight-dashboard-codex-74317479/overview?edit=1");

    try {
      const light = document.createElement("yeelight-dashboard-light-card") as TestDashboardCard;
      light.setConfig({ type: "custom:yeelight-dashboard-light-card", entities: ["light.living", "light.hall"] });
      light.hass = hass(states);
      light.addEventListener("hass-more-info", (event) => moreInfoEvents.push((event as CustomEvent<{ entityId: string }>).detail.entityId));
      document.body.append(light);
      await light.updateComplete;
      const lightMetric = light.shadowRoot.querySelector<HTMLButtonElement>(".metric-link.hot")!;
      expect(lightMetric.textContent).not.toContain("打开页面");
      expect(lightMetric.getAttribute("data-native-path")).toBe("/light?historyBack=1");
      lightMetric.click();

      const rooms = document.createElement("yeelight-dashboard-rooms-card") as TestDashboardCard;
      rooms.setConfig({
        type: "custom:yeelight-dashboard-rooms-card",
        entities: ["light.living", "switch.plug"],
        area_summaries: [{ areaId: "living", name: "客厅", entityCount: 2, lightCount: 1, activeLightCount: 1, routineCount: 0, issueCount: 0 }]
      });
      rooms.hass = hass(states);
      rooms.addEventListener("hass-more-info", (event) => moreInfoEvents.push((event as CustomEvent<{ entityId: string }>).detail.entityId));
      document.body.append(rooms);
      await rooms.updateComplete;
      const roomMetric = rooms.shadowRoot.querySelector<HTMLButtonElement>(".metric-link[data-view-path='areas']")!;
      const roomCard = rooms.shadowRoot.querySelector<HTMLButtonElement>(".area-card-link[data-view-path='areas']")!;
      expect(roomMetric.getAttribute("data-native-path")).toBe("/config/areas/dashboard?historyBack=1");
      expect(roomCard.getAttribute("data-native-path")).toBe("/home/areas-living?historyBack=1");
      roomMetric.click();
      roomCard.click();

      const devices = document.createElement("yeelight-dashboard-devices-card") as TestDashboardCard;
      devices.setConfig({
        type: "custom:yeelight-dashboard-devices-card",
        entities: ["light.living", "switch.plug"],
        area_summaries: [{ areaId: "living", name: "客厅", entityCount: 2, lightCount: 1, activeLightCount: 1, routineCount: 0, issueCount: 0 }]
      });
      devices.hass = hass(states);
      devices.addEventListener("hass-more-info", (event) => moreInfoEvents.push((event as CustomEvent<{ entityId: string }>).detail.entityId));
      document.body.append(devices);
      await devices.updateComplete;
      const devicesMetric = devices.shadowRoot.querySelector<HTMLButtonElement>(".metric-link[data-native-path='/config/entities?historyBack=1']")!;
      const areaPill = devices.shadowRoot.querySelector<HTMLButtonElement>(".area-pill-link[data-view-path='areas']")!;
      expect(devicesMetric.getAttribute("data-native-path")).toBe("/config/entities?historyBack=1");
      expect(areaPill.getAttribute("data-native-path")).toBe("/home/areas-living?historyBack=1");
      devicesMetric.click();
      areaPill.click();

      const routines = document.createElement("yeelight-dashboard-routines-card") as TestDashboardCard;
      routines.setConfig({ type: "custom:yeelight-dashboard-routines-card", entities: ["scene.movie", "button.find"] });
      routines.hass = hass(states);
      routines.addEventListener("hass-more-info", (event) => moreInfoEvents.push((event as CustomEvent<{ entityId: string }>).detail.entityId));
      document.body.append(routines);
      await routines.updateComplete;
      const routineMetric = routines.shadowRoot.querySelector<HTMLButtonElement>(".metric-link[data-native-path='/config/entities?historyBack=1']")!;
      const routineChip = routines.shadowRoot.querySelector<HTMLButtonElement>(".routine-chip-link[data-native-path='/config/scene/dashboard?historyBack=1']")!;
      const buttonChip = routines.shadowRoot.querySelector<HTMLButtonElement>(".routine-chip-link[data-native-path='/config/entities?historyBack=1']")!;
      expect(routineMetric.getAttribute("data-native-path")).toBe("/config/entities?historyBack=1");
      expect(routineChip.getAttribute("data-native-path")).toBe("/config/scene/dashboard?historyBack=1");
      expect(buttonChip.getAttribute("data-native-path")).toBe("/config/entities?historyBack=1");
      routineMetric.click();
      routineChip.click();
      buttonChip.click();

      const environment = document.createElement("yeelight-dashboard-environment-card") as TestDashboardCard;
      environment.setConfig({ type: "custom:yeelight-dashboard-environment-card", entities: ["weather.home", "sensor.temperature"] });
      environment.hass = hass(states);
      environment.addEventListener("hass-more-info", (event) => moreInfoEvents.push((event as CustomEvent<{ entityId: string }>).detail.entityId));
      document.body.append(environment);
      await environment.updateComplete;
      const environmentMetric = environment.shadowRoot.querySelector<HTMLButtonElement>(".metric-link[data-view-path='environment']")!;
      const environmentZone = environment.shadowRoot.querySelector<HTMLButtonElement>(".environment-zone-link[data-view-path='environment']")!;
      expect(environmentMetric.getAttribute("data-native-path")).toBe("/history?historyBack=1");
      expect(environmentZone.getAttribute("data-native-path")).toBe("/history?historyBack=1");
      environmentMetric.click();
      environmentZone.click();
    } finally {
      window.removeEventListener("location-changed", captureNavigation);
      window.history.replaceState(null, "", "/");
    }

    expect(moreInfoEvents).toEqual([]);
    expect(navigationEvents).toEqual([
      "/light?historyBack=1",
      "/config/areas/dashboard?historyBack=1",
      "/home/areas-living?historyBack=1",
      "/config/entities?historyBack=1",
      "/home/areas-living?historyBack=1",
      "/config/entities?historyBack=1",
      "/config/scene/dashboard?historyBack=1",
      "/config/entities?historyBack=1",
      "/history?historyBack=1",
      "/history?historyBack=1"
    ]);
  });

  it("renders legacy core subtypes as visible card modes", async () => {
    const states = {
      "light.living": entity("light.living", "on", { friendly_name: "Living Light" }),
      "light.hall": entity("light.hall", "off", { friendly_name: "Hall Light" }),
      "scene.movie": entity("scene.movie", "off", { friendly_name: "Movie Scene" }),
      "script.goodnight": entity("script.goodnight", "off", { friendly_name: "Good Night Script" }),
      "automation.away": entity("automation.away", "on", { friendly_name: "Away Automation" }),
      "button.find": entity("button.find", "off", { friendly_name: "Find Button" }),
      "schedule.wake": entity("schedule.wake", "on", { friendly_name: "Wake Schedule" }),
      "weather.home": entity("weather.home", "sunny", { friendly_name: "Home Weather" }),
      "sensor.lux": entity("sensor.lux", "420", { friendly_name: "Living Illuminance", device_class: "illuminance", unit_of_measurement: "lx" }),
      "sensor.temperature": entity("sensor.temperature", "24", { friendly_name: "Temperature", device_class: "temperature", unit_of_measurement: "°C" }),
      "update.gateway": entity("update.gateway", "on", { friendly_name: "Gateway Update" }),
      "event.doorbell": entity("event.doorbell", "2026-06-21T10:00:00", { friendly_name: "Doorbell Event" }),
      "sensor.history": entity("sensor.history", "12", { friendly_name: "History Sensor" })
    };

    const heroTime = document.createElement("yeelight-dashboard-hero-card") as TestDashboardCard;
    heroTime.setConfig({ type: "custom:yeelight-dashboard-hero-card", subtype: "time", entities: ["light.living"] });
    heroTime.hass = hass(states);
    document.body.append(heroTime);
    await heroTime.updateComplete;
    expect(heroTime.shadowRoot.textContent).toContain("家庭时间");
    expect(heroTime.shadowRoot.querySelector(".card")?.className).toContain("subtype-time");

    const heroQuote = document.createElement("yeelight-dashboard-hero-card") as TestDashboardCard;
    heroQuote.setConfig({ type: "custom:yeelight-dashboard-hero-card", subtype: "quote", content: "欢迎回家", entities: ["scene.movie"] });
    heroQuote.hass = hass(states);
    document.body.append(heroQuote);
    await heroQuote.updateComplete;
    expect(heroQuote.shadowRoot.textContent).toContain("每日提示");
    expect(heroQuote.shadowRoot.textContent).toContain("欢迎回家");

    const lightStatus = document.createElement("yeelight-dashboard-light-card") as TestDashboardCard;
    lightStatus.setConfig({ type: "custom:yeelight-dashboard-light-card", subtype: "status", entities: ["light.living", "light.hall"] });
    lightStatus.hass = hass(states);
    document.body.append(lightStatus);
    await lightStatus.updateComplete;
    expect(lightStatus.shadowRoot.textContent).toContain("灯光状态");
    expect(lightStatus.shadowRoot.querySelectorAll(".entity-row")).toHaveLength(2);

    const routines = document.createElement("yeelight-dashboard-routines-card") as TestDashboardCard;
    routines.setConfig({
      type: "custom:yeelight-dashboard-routines-card",
      subtype: "scripts",
      entities: ["scene.movie", "script.goodnight", "automation.away", "button.find"]
    });
    routines.hass = hass(states);
    document.body.append(routines);
    await routines.updateComplete;
    expect(routines.shadowRoot.textContent).toContain("脚本操作");
    expect(routines.shadowRoot.textContent).toContain("Good Night Script");
    expect(routines.shadowRoot.textContent).not.toContain("Movie Scene");

    const schedule = document.createElement("yeelight-dashboard-routines-card") as TestDashboardCard;
    schedule.setConfig({
      type: "custom:yeelight-dashboard-routines-card",
      subtype: "schedule",
      entities: ["scene.movie", "schedule.wake"]
    });
    schedule.hass = hass(states);
    document.body.append(schedule);
    await schedule.updateComplete;
    expect(schedule.shadowRoot.textContent).toContain("计划操作");
    expect(schedule.shadowRoot.textContent).toContain("Wake Schedule");
    expect(schedule.shadowRoot.querySelector(".routine-hero-action")?.className).toContain("routine-disabled");

    const illuminance = document.createElement("yeelight-dashboard-environment-card") as TestDashboardCard;
    illuminance.setConfig({ type: "custom:yeelight-dashboard-environment-card", subtype: "illuminance", entities: ["weather.home", "sensor.lux", "sensor.temperature"] });
    illuminance.hass = hass(states);
    document.body.append(illuminance);
    await illuminance.updateComplete;
    expect(illuminance.shadowRoot.textContent).toContain("照度重点");
    expect(illuminance.shadowRoot.textContent).toContain("Living Illuminance");
    expect(illuminance.shadowRoot.textContent).not.toContain("Temperature");

    const healthUpdates = document.createElement("yeelight-dashboard-health-card") as TestDashboardCard;
    healthUpdates.setConfig({ type: "custom:yeelight-dashboard-health-card", subtype: "updates", entities: ["update.gateway", "event.doorbell", "sensor.history"] });
    healthUpdates.hass = hass(states);
    document.body.append(healthUpdates);
    await healthUpdates.updateComplete;
    expect(healthUpdates.shadowRoot.textContent).toContain("更新");
    expect(healthUpdates.shadowRoot.textContent).toContain("Gateway Update");
    expect(healthUpdates.shadowRoot.textContent).not.toContain("Doorbell Event");
    expect(healthUpdates.shadowRoot.querySelector(".health-hero")).not.toBeNull();
    expect(healthUpdates.shadowRoot.querySelector(".health-group")).not.toBeNull();
  });

  it("renders migrated media, camera, security and presence card families", async () => {
    const states = {
      "media_player.living": entity("media_player.living", "playing", { friendly_name: "Living Speaker", media_title: "Morning Radio" }),
      "remote.tv": entity("remote.tv", "on", { friendly_name: "TV Remote" }),
      "camera.door": entity("camera.door", "streaming", { friendly_name: "Door Camera" }),
      "camera.yard": entity("camera.yard", "idle", { friendly_name: "Yard Camera" }),
      "alarm_control_panel.home": entity("alarm_control_panel.home", "armed_home", { friendly_name: "Home Alarm" }),
      "lock.front": entity("lock.front", "locked", { friendly_name: "Front Door" }),
      "person.alice": entity("person.alice", "home", { friendly_name: "Alice" }),
      "binary_sensor.motion": entity("binary_sensor.motion", "on", { friendly_name: "Hall Motion", device_class: "motion" })
    };

    const media = document.createElement("yeelight-dashboard-media-card") as TestDashboardCard;
    media.setConfig({ type: "custom:yeelight-dashboard-media-card", subtype: "broadcast", entities: ["media_player.living", "remote.tv"] });
    media.hass = hass(states);
    document.body.append(media);
    await media.updateComplete;
    expect(media.shadowRoot.textContent).toContain("影音媒体");
    expect(media.shadowRoot.textContent).toContain("全屋广播");
    expect(media.shadowRoot.textContent).toContain("Morning Radio");
    expect(media.shadowRoot.querySelector(".media-feature")).not.toBeNull();
    expect(media.shadowRoot.querySelectorAll(".media-context span")).toHaveLength(3);

    const camera = document.createElement("yeelight-dashboard-camera-card") as TestDashboardCard;
    camera.setConfig({ type: "custom:yeelight-dashboard-camera-card", entities: ["camera.door", "camera.yard"] });
    camera.hass = hass(states);
    document.body.append(camera);
    await camera.updateComplete;
    expect(camera.shadowRoot.textContent).toContain("摄像头");
    expect(camera.shadowRoot.querySelector(".camera-feature")).not.toBeNull();
    expect(camera.shadowRoot.querySelector<HTMLImageElement>(".camera-preview img")?.getAttribute("src")).toBe("/api/camera_proxy/camera.door");

    const wall = document.createElement("yeelight-dashboard-camera-wall-card") as TestDashboardCard;
    wall.setConfig({ type: "custom:yeelight-dashboard-camera-wall-card", entities: ["camera.door", "camera.yard"] });
    wall.hass = hass(states);
    document.body.append(wall);
    await wall.updateComplete;
    expect(wall.shadowRoot.textContent).toContain("摄像头墙");
    expect(wall.shadowRoot.querySelectorAll(".camera-thumb")).toHaveLength(2);
    expect(wall.shadowRoot.querySelectorAll(".camera-thumb-frame img")).toHaveLength(2);

    const security = document.createElement("yeelight-dashboard-security-card") as TestDashboardCard;
    security.setConfig({ type: "custom:yeelight-dashboard-security-card", subtype: "lock", entities: ["alarm_control_panel.home", "lock.front"] });
    security.hass = hass(states);
    document.body.append(security);
    await security.updateComplete;
    expect(security.shadowRoot.textContent).toContain("安防状态");
    expect(security.shadowRoot.textContent).toContain("Front Door");
    expect(security.shadowRoot.querySelector(".security-feature")).not.toBeNull();
    expect(security.shadowRoot.querySelectorAll(".security-groups span")).toHaveLength(3);

    const presence = document.createElement("yeelight-dashboard-presence-card") as TestDashboardCard;
    presence.setConfig({ type: "custom:yeelight-dashboard-presence-card", entities: ["person.alice", "binary_sensor.motion"] });
    presence.hass = hass(states);
    document.body.append(presence);
    await presence.updateComplete;
    expect(presence.shadowRoot.textContent).toContain("人员存在");
    expect(presence.shadowRoot.textContent).toContain("Alice");
    expect(presence.shadowRoot.querySelector(".presence-person")).not.toBeNull();
    expect(presence.shadowRoot.querySelectorAll(".presence-summary span")).toHaveLength(3);
  });

  it("renders migrated climate, air and water card families with safe actions", async () => {
    const calls: Array<{ domain: string; service: string; data?: Record<string, unknown> }> = [];
    const states = {
      "climate.living": entity("climate.living", "cool", { friendly_name: "Living AC", current_temperature: 25, temperature: 24, temperature_unit: "°C" }),
      "sensor.humidity": entity("sensor.humidity", "48", { friendly_name: "Humidity", device_class: "humidity", unit_of_measurement: "%" }),
      "fan.ceiling": entity("fan.ceiling", "on", { friendly_name: "Ceiling Fan" }),
      "humidifier.room": entity("humidifier.room", "off", { friendly_name: "Humidifier" }),
      "sensor.air_quality": entity("sensor.air_quality", "22", { friendly_name: "Air PM25", device_class: "pm25" }),
      "sensor.water_filter": entity("sensor.water_filter", "83", { friendly_name: "Water Filter", unit_of_measurement: "%" }),
      "binary_sensor.water_leak": entity("binary_sensor.water_leak", "off", { friendly_name: "Water Leak", device_class: "moisture" })
    };

    const climate = document.createElement("yeelight-dashboard-climate-card") as TestDashboardCard;
    climate.setConfig({ type: "custom:yeelight-dashboard-climate-card", entities: ["climate.living", "sensor.humidity"] });
    climate.hass = hass(states);
    document.body.append(climate);
    await climate.updateComplete;
    expect(climate.shadowRoot.textContent).toContain("温控舒适");
    expect(climate.shadowRoot.textContent).toContain("Living AC");
    expect(climate.shadowRoot.textContent).toContain("目标 24°C");
    expect(climate.shadowRoot.querySelector(".climate-feature")).not.toBeNull();

    const air = document.createElement("yeelight-dashboard-air-card") as TestDashboardCard;
    air.setConfig({ type: "custom:yeelight-dashboard-air-card", subtype: "fan", entities: ["fan.ceiling", "humidifier.room", "sensor.air_quality"] });
    air.hass = hass(states, {}, calls);
    document.body.append(air);
    await air.updateComplete;
    expect(air.shadowRoot.textContent).toContain("空气舒适");
    expect(air.shadowRoot.textContent).toContain("Ceiling Fan");
    expect(air.shadowRoot.querySelector(".comfort-action")).not.toBeNull();
    air.shadowRoot.querySelector<HTMLButtonElement>(".comfort-action")!.click();
    expect(calls).toEqual([{ domain: "fan", service: "turn_off", data: { entity_id: "fan.ceiling" } }]);

    const humidifier = document.createElement("yeelight-dashboard-air-card") as TestDashboardCard;
    humidifier.setConfig({ type: "custom:yeelight-dashboard-air-card", subtype: "humidifier", entities: ["humidifier.room", "sensor.humidity"] });
    humidifier.hass = hass(states);
    document.body.append(humidifier);
    await humidifier.updateComplete;
    expect(humidifier.shadowRoot.textContent).toContain("湿度重点");
    expect(humidifier.shadowRoot.querySelector(".comfort-action")).toBeNull();

    const water = document.createElement("yeelight-dashboard-water-card") as TestDashboardCard;
    water.setConfig({ type: "custom:yeelight-dashboard-water-card", entities: ["sensor.water_filter", "binary_sensor.water_leak"] });
    water.hass = hass(states);
    document.body.append(water);
    await water.updateComplete;
    expect(water.shadowRoot.textContent).toContain("净水状态");
    expect(water.shadowRoot.textContent).toContain("Water Filter");
    expect(water.shadowRoot.querySelector(".water-feature")).not.toBeNull();
  });

  it("renders migrated power, energy and infrastructure card families", async () => {
    const calls: Array<{ domain: string; service: string; data?: Record<string, unknown> }> = [];
    const states = {
      "switch.wall_plug": entity("switch.wall_plug", "on", { friendly_name: "Wall Plug" }),
      "sensor.plug_power": entity("sensor.plug_power", "42", { friendly_name: "Plug Power", device_class: "power", unit_of_measurement: "W" }),
      "sensor.plug_voltage": entity("sensor.plug_voltage", "220", { friendly_name: "Plug Voltage", device_class: "voltage", unit_of_measurement: "V" }),
      "sensor.home_energy": entity("sensor.home_energy", "12.5", { friendly_name: "Home Energy", device_class: "energy", unit_of_measurement: "kWh" }),
      "sensor.solar_power": entity("sensor.solar_power", "1.8", { friendly_name: "Solar Power", device_class: "power", unit_of_measurement: "kW" }),
      "sensor.server_cpu": entity("sensor.server_cpu", "32", { friendly_name: "Server CPU", unit_of_measurement: "%" }),
      "binary_sensor.router_wan": entity("binary_sensor.router_wan", "on", { friendly_name: "Router WAN" })
    };

    const power = document.createElement("yeelight-dashboard-power-card") as TestDashboardCard;
    power.setConfig({ type: "custom:yeelight-dashboard-power-card", subtype: "socket", entities: ["switch.wall_plug", "sensor.plug_power", "sensor.plug_voltage"] });
    power.hass = hass(states, {}, calls);
    document.body.append(power);
    await power.updateComplete;
    expect(power.shadowRoot.textContent).toContain("电源插座");
    expect(power.shadowRoot.textContent).toContain("Wall Plug");
    expect(power.shadowRoot.textContent).toContain("实时功率");
    expect(power.shadowRoot.querySelectorAll(".ops-insights span, .ops-insight-link")).toHaveLength(2);
    const opened: string[] = [];
    power.addEventListener("hass-more-info", (event) => opened.push((event as CustomEvent<{ entityId: string }>).detail.entityId));
    power.shadowRoot.querySelector<HTMLButtonElement>(".ops-insight-link")!.click();
    expect(opened).toEqual(["sensor.plug_power"]);
    power.shadowRoot.querySelector<HTMLButtonElement>(".ops-action")!.click();
    expect(calls).toEqual([{ domain: "switch", service: "turn_off", data: { entity_id: "switch.wall_plug" } }]);

    const energy = document.createElement("yeelight-dashboard-energy-card") as TestDashboardCard;
    energy.setConfig({ type: "custom:yeelight-dashboard-energy-card", subtype: "insights", entities: ["sensor.home_energy", "sensor.plug_power", "sensor.solar_power"] });
    energy.hass = hass(states);
    document.body.append(energy);
    await energy.updateComplete;
    expect(energy.shadowRoot.textContent).toContain("能源洞察");
    expect(energy.shadowRoot.textContent).toContain("Home Energy");
    expect(energy.shadowRoot.querySelector(".energy-feature")).not.toBeNull();
    expect(energy.shadowRoot.textContent).toContain("累计电量");
    expect(energy.shadowRoot.querySelectorAll(".energy-insights span, .energy-insights .ops-insight-link")).toHaveLength(2);

    const infrastructure = document.createElement("yeelight-dashboard-infrastructure-card") as TestDashboardCard;
    infrastructure.setConfig({ type: "custom:yeelight-dashboard-infrastructure-card", subtype: "server", entities: ["sensor.server_cpu", "binary_sensor.router_wan"] });
    infrastructure.hass = hass(states);
    document.body.append(infrastructure);
    await infrastructure.updateComplete;
    expect(infrastructure.shadowRoot.textContent).toContain("基础设施");
    expect(infrastructure.shadowRoot.textContent).toContain("Server CPU");
    expect(infrastructure.shadowRoot.textContent).toContain("在线");
    expect(infrastructure.shadowRoot.textContent).not.toContain("online");
    expect(infrastructure.shadowRoot.querySelector(".infrastructure-feature")).not.toBeNull();
    expect(infrastructure.shadowRoot.querySelectorAll(".infrastructure-insights span, .infrastructure-insights .ops-insight-link")).toHaveLength(3);
  });

  it("renders migrated panel actions, image and note card families", async () => {
    const calls: Array<{ domain: string; service: string; data?: Record<string, unknown> }> = [];
    const states = {
      "scene.movie": entity("scene.movie", "off", { friendly_name: "Movie Scene" }),
      "button.doorbell": entity("button.doorbell", "off", { friendly_name: "Doorbell" }),
      "camera.door": entity("camera.door", "streaming", { friendly_name: "Door Camera" }),
      "sensor.status": entity("sensor.status", "ok", { friendly_name: "Status Note" })
    };

    const panelActions = document.createElement("yeelight-dashboard-panel-actions-card") as TestDashboardCard;
    panelActions.setConfig({ type: "custom:yeelight-dashboard-panel-actions-card", content: "回家动作\n适合入户后一键执行", entities: ["scene.movie", "button.doorbell"] });
    panelActions.hass = hass(states, {}, calls);
    document.body.append(panelActions);
    await panelActions.updateComplete;
    expect(panelActions.shadowRoot.textContent).toContain("面板快捷操作");
    expect(panelActions.shadowRoot.textContent).toContain("操作说明");
    expect(panelActions.shadowRoot.textContent).toContain("回家动作");
    expect(panelActions.shadowRoot.textContent).toContain("适合入户后一键执行");
    expect(panelActions.shadowRoot.querySelector(".panel-action-feature")).not.toBeNull();
    expect(panelActions.shadowRoot.querySelector(".panel-action-feature")?.className).toContain("domain-scene");
    expect(panelActions.shadowRoot.querySelector(".panel-action")?.className).toContain("domain-button");
    expect(panelActions.shadowRoot.querySelector(".panel-action-note")).not.toBeNull();
    expect(panelActions.shadowRoot.querySelectorAll(".panel-action")).toHaveLength(1);
    expect(panelActions.shadowRoot.querySelectorAll(".panel-action-chips span, .panel-action-chip-link")).toHaveLength(2);
    const actionDetails: string[] = [];
    panelActions.addEventListener("hass-more-info", (event) => actionDetails.push((event as CustomEvent<{ entityId: string }>).detail.entityId));
    panelActions.shadowRoot.querySelector<HTMLButtonElement>(".panel-action-chip-link")!.click();
    panelActions.shadowRoot.querySelector<HTMLButtonElement>(".panel-action-feature .panel-action-main")!.click();
    panelActions.shadowRoot.querySelector<HTMLButtonElement>(".panel-action .panel-action-main")!.click();
    expect(actionDetails).toEqual(["scene.movie", "scene.movie", "button.doorbell"]);
    panelActions.shadowRoot.querySelector<HTMLButtonElement>(".panel-action-feature .panel-action-run")!.click();
    expect(calls).toEqual([{ domain: "scene", service: "turn_on", data: { entity_id: "scene.movie" } }]);

    const panelActionsDraft = document.createElement("yeelight-dashboard-panel-actions-card") as TestDashboardCard;
    panelActionsDraft.setConfig({ type: "custom:yeelight-dashboard-panel-actions-card", content: "睡前快捷\n选择实体后即可执行" });
    panelActionsDraft.hass = hass(states);
    document.body.append(panelActionsDraft);
    await panelActionsDraft.updateComplete;
    expect(panelActionsDraft.shadowRoot.textContent).toContain("睡前快捷");
    expect(panelActionsDraft.shadowRoot.textContent).toContain("当前范围暂无可支持的快捷操作。");
    expect(panelActionsDraft.shadowRoot.querySelector(".panel-action-note")).not.toBeNull();

    const imageCard = document.createElement("yeelight-dashboard-image-card") as TestDashboardCard;
    imageCard.setConfig({
      type: "custom:yeelight-dashboard-image-card",
      subtype: "carousel",
      image_url: "/local/cover.jpg",
      image_urls: ["/local/second.jpg | 晚安模式"],
      content: "客厅相册\n今日精选",
      entities: ["camera.door"],
      url: "/lovelace/cameras"
    });
    imageCard.hass = hass(states);
    document.body.append(imageCard);
    await imageCard.updateComplete;
    expect(imageCard.shadowRoot.textContent).toContain("图片展示");
    expect(imageCard.shadowRoot.textContent).toContain("轮播 · 1/3");
    expect(imageCard.shadowRoot.textContent).toContain("客厅相册");
    expect(imageCard.shadowRoot.textContent).toContain("今日精选");
    expect(imageCard.shadowRoot.textContent).toContain("晚安模式");
    expect(imageCard.shadowRoot.querySelector(".image-feature")).not.toBeNull();
    expect(imageCard.shadowRoot.querySelectorAll(".image-thumb")).toHaveLength(2);
    expect(imageCard.shadowRoot.querySelectorAll(".image-dots span")).toHaveLength(3);

    const note = document.createElement("yeelight-dashboard-note-card") as TestDashboardCard;
    note.setConfig({ type: "custom:yeelight-dashboard-note-card", content: "回家模式\n- 检查门锁\n- [x] 打开玄关灯\n[ ] 关闭窗帘", entities: ["sensor.status"] });
    note.hass = hass(states);
    document.body.append(note);
    await note.updateComplete;
    expect(note.shadowRoot.textContent).toContain("便签备注");
    expect(note.shadowRoot.textContent).toContain("回家模式");
    expect(note.shadowRoot.textContent).toContain("检查门锁");
    expect(note.shadowRoot.textContent).toContain("打开玄关灯");
    expect(note.shadowRoot.textContent).toContain("关闭窗帘");
    expect(note.shadowRoot.textContent).toContain("已完成 1/2");
    expect(note.shadowRoot.textContent).toContain("Status Note");
    expect(note.shadowRoot.querySelector(".note-content")).not.toBeNull();
    expect(note.shadowRoot.querySelectorAll(".note-lines p")).toHaveLength(3);
    expect(note.shadowRoot.querySelectorAll(".note-lines p")[1]?.className).toBe("done");
    expect(note.shadowRoot.querySelector(".note-summary")).not.toBeNull();
    const noteIcons = note.shadowRoot.querySelectorAll(".note-lines ha-icon");
    expect((noteIcons[0] as HTMLElement & { icon?: string })?.icon).toBe("mdi:circle-small");
    expect((noteIcons[1] as HTMLElement & { icon?: string })?.icon).toBe("mdi:check-circle");
    expect((noteIcons[2] as HTMLElement & { icon?: string })?.icon).toBe("mdi:checkbox-blank-circle-outline");
  });
});
