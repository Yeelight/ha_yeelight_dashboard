import { describe, expect, it } from "vitest";

import { entitySuggestion, stubConfig } from "../src/cards/card-defaults";
import { DASHBOARD_CARD_DEFINITIONS } from "../src/cards/card-definitions";
import { buildEntityOptions, defaultDomainForCard, isRecommendedEntityForCard, recommendedDomainsForCard } from "../src/cards/entity-picker";
import { entity, hass } from "./fixtures";

describe("subtype-aware entity recommendations", () => {
  it("narrows recommended domains when a beginner chooses a semantic subtype", () => {
    expect(recommendedDomainsForCard("custom:yeelight-dashboard-routines-card", "scripts")).toEqual(["script"]);
    expect(recommendedDomainsForCard("custom:yeelight-dashboard-routines-card", "automations")).toEqual(["automation"]);
    expect(recommendedDomainsForCard("custom:yeelight-dashboard-air-card", "humidifier")).toEqual(["humidifier", "sensor", "binary_sensor"]);
    expect(recommendedDomainsForCard("custom:yeelight-dashboard-security-card", "lock")).toEqual(["lock"]);
    expect(recommendedDomainsForCard("custom:yeelight-dashboard-presence-card", "people")).toEqual(["person"]);
    expect(recommendedDomainsForCard("custom:yeelight-dashboard-media-card", "remote")).toEqual(["remote"]);
    expect(recommendedDomainsForCard("custom:yeelight-dashboard-power-card", "electricity")).toEqual(["sensor"]);
  });

  it("uses subtype when ranking editor entity options and default domain", () => {
    const ha = hass({
      "fan.ceiling": entity("fan.ceiling", "on", { friendly_name: "Ceiling Fan" }),
      "humidifier.room": entity("humidifier.room", "off", { friendly_name: "Room Humidifier" }),
      "sensor.humidity": entity("sensor.humidity", "50", { friendly_name: "Room Humidity", device_class: "humidity" })
    });
    const config = { type: "custom:yeelight-dashboard-air-card", subtype: "humidifier" };
    const options = buildEntityOptions(ha, config);
    expect(options[0]).toMatchObject({ entityId: "humidifier.room", recommended: true });
    expect(options.find((option) => option.entityId === "fan.ceiling")?.recommended).toBe(false);
    expect(defaultDomainForCard(config, options)).toBe("humidifier");
  });

  it("keeps manual picker suggestions focused for strict legacy subtypes", () => {
    const ha = hass({
      "alarm_control_panel.home": entity("alarm_control_panel.home", "armed_home", { friendly_name: "Home Alarm" }),
      "lock.front": entity("lock.front", "locked", { friendly_name: "Front Lock" }),
      "person.dong": entity("person.dong", "home", { friendly_name: "Dong" }),
      "device_tracker.phone": entity("device_tracker.phone", "home", { friendly_name: "Phone" }),
      "sensor.server_cpu": entity("sensor.server_cpu", "30", { friendly_name: "Server CPU" }),
      "sensor.router_wan": entity("sensor.router_wan", "online", { friendly_name: "Router WAN" })
    });

    expect(isRecommendedEntityForCard(ha, "custom:yeelight-dashboard-security-card", "lock.front", "lock")).toBe(true);
    expect(isRecommendedEntityForCard(ha, "custom:yeelight-dashboard-security-card", "alarm_control_panel.home", "lock")).toBe(false);
    expect(isRecommendedEntityForCard(ha, "custom:yeelight-dashboard-presence-card", "person.dong", "people")).toBe(true);
    expect(isRecommendedEntityForCard(ha, "custom:yeelight-dashboard-presence-card", "device_tracker.phone", "people")).toBe(false);
    expect(isRecommendedEntityForCard(ha, "custom:yeelight-dashboard-infrastructure-card", "sensor.router_wan", "router")).toBe(true);
    expect(isRecommendedEntityForCard(ha, "custom:yeelight-dashboard-infrastructure-card", "sensor.server_cpu", "router")).toBe(false);
  });

  it("uses subtype-aware suggestions for Home Assistant card picker stubs", () => {
    const definition = DASHBOARD_CARD_DEFINITIONS.find((item) => item.kind === "air");
    if (!definition) throw new Error("air definition missing");
    const ha = hass({
      "fan.ceiling": entity("fan.ceiling", "on", { friendly_name: "Ceiling Fan" }),
      "humidifier.room": entity("humidifier.room", "off", { friendly_name: "Room Humidifier" })
    });

    expect(stubConfig(definition, ha)).toMatchObject({
      type: "custom:yeelight-dashboard-air-card",
      subtype: "fan",
      entities: ["fan.ceiling"]
    });
  });

  it("picks the most specific subtype when Home Assistant suggests a card from one entity", () => {
    const definitions = Object.fromEntries(DASHBOARD_CARD_DEFINITIONS.map((definition) => [definition.kind, definition]));
    const ha = hass({
      "humidifier.room": entity("humidifier.room", "off", { friendly_name: "Room Humidifier" }),
      "lock.front": entity("lock.front", "locked", { friendly_name: "Front Lock" }),
      "remote.tv": entity("remote.tv", "on", { friendly_name: "TV Remote" }),
      "sensor.router_wan": entity("sensor.router_wan", "online", { friendly_name: "Router WAN" })
    });

    expect(entitySuggestion(ha, "humidifier.room", definitions.air)?.config).toMatchObject({ subtype: "humidifier", entities: ["humidifier.room"] });
    expect(entitySuggestion(ha, "lock.front", definitions.security)?.config).toMatchObject({ subtype: "lock", entities: ["lock.front"] });
    expect(entitySuggestion(ha, "remote.tv", definitions.media)?.config).toMatchObject({ subtype: "remote", entities: ["remote.tv"] });
    expect(entitySuggestion(ha, "sensor.router_wan", definitions.infrastructure)?.config).toMatchObject({ subtype: "router", entities: ["sensor.router_wan"] });
  });
});
