import { registerDashboardCards } from "./cards/register";
import { YeelightDashboardStrategy } from "./strategy/dashboard-strategy";
import { EDITOR_TAG, STRATEGY_TAG, STRATEGY_TYPE } from "./strategy/config";
import { YeelightDashboardStrategyEditor } from "./strategy/editor";
import { CANVAS_VIEW_TAG, YeelightDashboardCanvasView } from "./views/canvas-view";

register();

function register(): void {
  if (!customElements.get(EDITOR_TAG)) {
    customElements.define(EDITOR_TAG, YeelightDashboardStrategyEditor);
  }
  if (!customElements.get(STRATEGY_TAG)) {
    customElements.define(STRATEGY_TAG, YeelightDashboardStrategy);
  }
  if (!customElements.get(CANVAS_VIEW_TAG)) {
    customElements.define(CANVAS_VIEW_TAG, YeelightDashboardCanvasView);
  }
  registerDashboardCards();
  registerCommunityDashboard();
  console.info(
    "%c YEELIGHT DASHBOARD %c Strategy ",
    "color:white;background:#111;padding:2px 4px;border-radius:4px 0 0 4px",
    "color:white;background:#1976d2;padding:2px 4px;border-radius:0 4px 4px 0"
  );
}

function registerCommunityDashboard(): void {
  const strategies = window.customStrategies ?? (window.customStrategies = []);
  const existingIndex = strategies.findIndex(
    (strategy) => strategy.type === STRATEGY_TYPE && strategy.strategyType === "dashboard"
  );
  const metadata = {
    type: STRATEGY_TYPE,
    strategyType: "dashboard" as const,
    name: "Yeelight Dashboard",
    description: "A complete HA-native Yeelight home dashboard generated from registries and states.",
    documentationURL: "https://github.com/Yeelight/ha_yeelight_dashboard"
  };
  if (existingIndex >= 0) strategies[existingIndex] = metadata;
  else strategies.push(metadata);
}

export { YeelightDashboardStrategy };
