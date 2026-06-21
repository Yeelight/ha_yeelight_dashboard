import { resolve } from "node:path";

import { fileExists } from "./fs-utils.mjs";
import { REPO_ROOT } from "./paths.mjs";

const REBUILD_WIDGETS = new Map([
  ["hero", ["custom:yeelight-dashboard-hero-card", "standard"]],
  ["panel-hero", ["custom:yeelight-dashboard-hero-card", "panel"]],
  ["notice", ["custom:yeelight-dashboard-notice-card", "standard"]],
  ["status", ["custom:yeelight-dashboard-status-card", "standard"]],
  ["time-card", ["custom:yeelight-dashboard-hero-card", "time"]],
  ["daily-quote-card", ["custom:yeelight-dashboard-hero-card", "quote"]],
  ["favorite-lights", ["custom:yeelight-dashboard-light-card", "favorites"]],
  ["light-status-card", ["custom:yeelight-dashboard-light-card", "status"]],
  ["light-overview-card", ["custom:yeelight-dashboard-light-card", "overview"]],
  ["light-devices", ["custom:yeelight-dashboard-light-card", "devices"]],
  ["rooms", ["custom:yeelight-dashboard-rooms-card", "overview"]],
  ["room-card", ["custom:yeelight-dashboard-room-card", "single"]],
  ["room-devices", ["custom:yeelight-dashboard-room-card", "devices"]],
  ["quick-scenes", ["custom:yeelight-dashboard-routines-card", "quick"]],
  ["scene-list", ["custom:yeelight-dashboard-routines-card", "list"]],
  ["quick-command-card", ["custom:yeelight-dashboard-routines-card", "commands"]],
  ["script-panel", ["custom:yeelight-dashboard-routines-card", "scripts"]],
  ["schedule", ["custom:yeelight-dashboard-routines-card", "schedule"]],
  ["automations", ["custom:yeelight-dashboard-routines-card", "automations"]],
  ["scene-single-card", ["custom:yeelight-dashboard-routines-card", "scene-single"]],
  ["automation-single-card", ["custom:yeelight-dashboard-routines-card", "automation-single"]],
  ["script-single-card", ["custom:yeelight-dashboard-routines-card", "script-single"]],
  ["button-card", ["custom:yeelight-dashboard-routines-card", "button"]],
  ["devices", ["custom:yeelight-dashboard-devices-card", "activity"]],
  ["device-list", ["custom:yeelight-dashboard-devices-card", "list"]],
  ["device-single", ["custom:yeelight-dashboard-devices-card", "single"]],
  ["universal-card", ["custom:yeelight-dashboard-devices-card", "universal"]],
  ["socket-card", ["custom:yeelight-dashboard-power-card", "socket"]],
  ["electricity-card", ["custom:yeelight-dashboard-power-card", "electricity"]],
  ["energy", ["custom:yeelight-dashboard-energy-card", "summary"]],
  ["insights", ["custom:yeelight-dashboard-energy-card", "insights"]],
  ["sensor-card", ["custom:yeelight-dashboard-environment-card", "sensors"]],
  ["illuminance-card", ["custom:yeelight-dashboard-environment-card", "illuminance"]],
  ["weather-card", ["custom:yeelight-dashboard-environment-card", "weather"]],
  ["weather", ["custom:yeelight-dashboard-environment-card", "overview"]],
  ["climate", ["custom:yeelight-dashboard-climate-card", "overview"]],
  ["climate-card", ["custom:yeelight-dashboard-climate-card", "single"]],
  ["fan-card", ["custom:yeelight-dashboard-air-card", "fan"]],
  ["humidifier-card", ["custom:yeelight-dashboard-air-card", "humidifier"]],
  ["water-purifier-card", ["custom:yeelight-dashboard-water-card", "purifier"]],
  ["security", ["custom:yeelight-dashboard-security-card", "overview"]],
  ["alarm-card", ["custom:yeelight-dashboard-security-card", "alarm"]],
  ["lock-card", ["custom:yeelight-dashboard-security-card", "lock"]],
  ["motion-card", ["custom:yeelight-dashboard-presence-card", "motion"]],
  ["binary-sensor-card", ["custom:yeelight-dashboard-security-card", "binary-sensor"]],
  ["people", ["custom:yeelight-dashboard-presence-card", "people"]],
  ["family-card", ["custom:yeelight-dashboard-presence-card", "family"]],
  ["device-tracker-card", ["custom:yeelight-dashboard-presence-card", "tracker"]],
  ["media", ["custom:yeelight-dashboard-media-card", "hub"]],
  ["media-player-card", ["custom:yeelight-dashboard-media-card", "player"]],
  ["max-player-card", ["custom:yeelight-dashboard-media-card", "max-player"]],
  ["broadcast-radio-card", ["custom:yeelight-dashboard-media-card", "broadcast"]],
  ["voice-assistant-card", ["custom:yeelight-dashboard-media-card", "voice"]],
  ["remote-card", ["custom:yeelight-dashboard-media-card", "remote"]],
  ["cameras", ["custom:yeelight-dashboard-camera-card", "overview"]],
  ["camera-card", ["custom:yeelight-dashboard-camera-card", "single"]],
  ["camera-wall-card", ["custom:yeelight-dashboard-camera-wall-card", "wall"]],
  ["ecosystem", ["custom:yeelight-dashboard-ecosystem-card", "standard"]],
  ["health", ["custom:yeelight-dashboard-health-card", "overview"]],
  ["updates-card", ["custom:yeelight-dashboard-health-card", "updates"]],
  ["repairs-backup-card", ["custom:yeelight-dashboard-health-card", "repairs-backup"]],
  ["iot-network-card", ["custom:yeelight-dashboard-health-card", "network"]],
  ["events", ["custom:yeelight-dashboard-health-card", "events"]],
  ["history", ["custom:yeelight-dashboard-health-card", "history"]],
  ["panel-actions", ["custom:yeelight-dashboard-panel-actions-card", "standard"]],
  ["image-carousel", ["custom:yeelight-dashboard-image-card", "carousel"]],
  ["image", ["custom:yeelight-dashboard-image-card", "single"]],
  ["text-note", ["custom:yeelight-dashboard-note-card", "standard"]],
  ["server-card", ["custom:yeelight-dashboard-infrastructure-card", "server"]],
  ["router-card", ["custom:yeelight-dashboard-infrastructure-card", "router"]],
  ["nas-card", ["custom:yeelight-dashboard-infrastructure-card", "nas"]],
  ["pve-card", ["custom:yeelight-dashboard-infrastructure-card", "pve"]],
  ["server-devices", ["custom:yeelight-dashboard-infrastructure-card", "server-list"]],
  ["pve-devices", ["custom:yeelight-dashboard-infrastructure-card", "pve-list"]],
]);

const NATIVE_RECIPE_BY_ID = new Set([
  "switch-devices",
  "cover-devices",
  "curtain-card",
  "sensor-devices",
  "vacuum",
  "todos",
  "calendar",
  "divider",
  "spacer",
]);

export function buildWidgetMap(widgets, nativeSpecs) {
  const nativeWidgetIds = new Set(nativeSpecs.map((spec) => spec.widgetId));
  const map = {};
  for (const widget of widgets) {
    const nativeSpec = nativeSpecs.find(
      (spec) => spec.widgetId === widget.id || spec.type === widget.options.nativeCardType,
    );
    const target = classifyWidget(widget, nativeWidgetIds, nativeSpec);
    map[widget.id] = {
      legacy_id: widget.id,
      title: widget.title,
      type: widget.type,
      group: widget.options.group || "core",
      source: widget.source,
      default_enabled: widget.options.enabled !== false,
      legacy_size: widget.size,
      legacy_layout: widget.layout,
      legacy_order: widget.order,
      status: target.status,
      target: target.target,
      variant: target.variant || "",
      replacement_kind: target.replacementKind,
      source_files: target.sourceFiles,
      reason: target.notes,
      notes: target.notes,
    };
    if (nativeSpec) {
      map[widget.id].native_type = nativeSpec.type;
      map[widget.id].native_binding = nativeSpec.binding;
    }
  }
  if (!map["native-card"]) {
    map["native-card"] = syntheticNativeWidget({
      type: "entities",
      label: "中枢卡",
      widgetId: "native-card",
      size: "medium",
      layout: "compact",
      binding: "multi",
    });
  }
  for (const spec of nativeSpecs) {
    if (map[spec.widgetId]) continue;
    map[spec.widgetId] = syntheticNativeWidget(spec);
  }
  return map;
}

function syntheticNativeWidget(spec) {
  return {
    legacy_id: spec.widgetId,
    title: `${spec.label}卡`,
    type: "native-card",
    group: "native",
    source: "ha",
    default_enabled: false,
    legacy_size: spec.size || "medium",
    legacy_layout: spec.layout || "compact",
    legacy_order: 300,
    status: "native_recipe",
    target: spec.type || "nativeCardConfig",
    variant: "",
    replacement_kind: "ha_native_card_recipe",
    source_files: ["config/www/yeelight/widgets/panel/native-types.js"],
    reason: "由旧 nativeWidgets() 动态生成的 HA 原生卡包装器；新版提取为 Recipe 或原生 Lovelace 配置，不保留包装运行时。",
    notes: "由旧 nativeWidgets() 动态生成的 HA 原生卡包装器；新版提取为 Recipe 或原生 Lovelace 配置，不保留包装运行时。",
    native_type: spec.type || "",
    native_binding: spec.binding || "",
  };
}

function classifyWidget(widget, nativeWidgetIds, nativeSpec) {
  if (widget.type === "native-card" || nativeWidgetIds.has(widget.id)) {
    return {
      status: "native_recipe",
      target: nativeSpec ? nativeSpec.type : "nativeCardConfig",
      replacementKind: "ha_native_card_recipe",
      sourceFiles: ["config/www/yeelight/widgets/panel/native-types.js"],
      notes: "旧原生卡包装器不作为新版独立 Web Component 保留；提取原生 Lovelace 配置或生成 Recipe。",
    };
  }
  if (REBUILD_WIDGETS.has(widget.id)) {
    const [target, variant] = REBUILD_WIDGETS.get(widget.id);
    return {
      status: widget.id.includes("-") ? "merge_as_variant" : "rebuild",
      target,
      variant,
      replacementKind: "dashboard_internal_card",
      sourceFiles: sourceFilesForWidget(widget),
      notes: "具备 Dashboard 产品价值，进入专属卡片家族或 variant。",
    };
  }
  if (NATIVE_RECIPE_BY_ID.has(widget.id) || widget.type === "domain-devices") {
    return {
      status: "native_recipe",
      target: recipeTargetForWidget(widget),
      replacementKind: "ha_native_card_recipe",
      sourceFiles: sourceFilesForWidget(widget),
      notes: "主要表达 HA 原生 domain/section 能力，优先转为 Recipe。",
    };
  }
  if (widget.type === "utility") {
    return {
      status: widget.id === "spacer" || widget.id === "divider" ? "native_recipe" : "rebuild",
      target:
        widget.id === "spacer" || widget.id === "divider"
          ? "section/heading/layout"
          : "custom:yeelight-dashboard-utility-card",
      variant: widget.options.utilityKind || "",
      replacementKind: "utility_or_section",
      sourceFiles: sourceFilesForWidget(widget),
      notes: "视觉辅助能力保留，但优先使用 HA Section/Heading 替代纯布局占位。",
    };
  }
  return {
    status: "legacy_only",
    target: "manual-review",
    replacementKind: "requires_product_decision",
    sourceFiles: sourceFilesForWidget(widget),
    notes: "静态规则未能自动归类，需要在下一轮人工确认是否重建、转 Recipe 或退役。",
  };
}

function recipeTargetForWidget(widget) {
  const domain =
    widget.options.domainFilter || widget.options.sourceFilter || widget.id.replace(/-devices$/, "");
  if (widget.id === "curtain-card") return "area.cover";
  if (widget.id === "todos") return "todo-list";
  if (widget.id === "calendar") return "calendar";
  if (widget.id === "divider") return "heading";
  if (widget.id === "spacer") return "sections-layout";
  return `area.${domain}`;
}

function sourceFilesForWidget(widget) {
  const files = ["config/www/yeelight/widgets/panel/catalog.js"];
  const safeId = widget.id.replace(/[^a-z0-9-]/gi, "");
  const styleFile = `config/www/yeelight/styles/panel/${safeId}-overrides.js`;
  if (fileExists(resolve(REPO_ROOT, styleFile))) files.push(styleFile);
  return files;
}
