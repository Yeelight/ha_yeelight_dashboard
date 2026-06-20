import { createDashboardContext } from "../model/context";
import type { HomeAssistant, LovelaceDashboardConfig, YeelightDashboardConfig } from "../types";
import { buildSectionsViews } from "../views/sections-builder";
import { EDITOR_TAG, normalizeConfig } from "./config";

export class YeelightDashboardStrategy extends HTMLElement {
  static configRequired = false;

  static getCreateSuggestions(): { title: string; icon: string } {
    return {
      title: "Yeelight Dashboard",
      icon: "mdi:view-dashboard"
    };
  }

  static getConfigElement(): HTMLElement {
    return document.createElement(EDITOR_TAG);
  }

  static async generate(
    config: Partial<YeelightDashboardConfig> = {},
    hass?: HomeAssistant
  ): Promise<LovelaceDashboardConfig> {
    const normalized = normalizeConfig(config);
    const context = await createDashboardContext(hass, normalized);
    return { views: buildSectionsViews(context) };
  }
}
