import { basename, extname, relative, resolve } from "node:path";

import {
  fileExists,
  readText,
  sizeBytes,
  walk,
} from "./fs-utils.mjs";
import {
  LEGACY_COMPONENT_DIR,
  LEGACY_CONFIG_DIR,
  REPO_ROOT,
} from "./paths.mjs";

export function scanResources() {
  const ui = readText(resolve(LEGACY_CONFIG_DIR, "ui-lovelace.yaml"));
  const dashboard = readText(resolve(LEGACY_CONFIG_DIR, "lovelace/dashboard.yaml"));
  const resources = [...ui.matchAll(/-\s+url:\s+([^\n]+)\n\s+type:\s+([^\n]+)/g)].map(
    (match) => ({
      url: match[1].trim(),
      type: match[2].trim(),
      migration: match[1].includes("yeelight-panel.js")
        ? "replace_with_dist_ha_yeelight_dashboard_js"
        : match[1].includes("/community/")
          ? "do_not_require_for_new_dashboard"
          : "review",
    }),
  );
  const views = [
    ...dashboard.matchAll(/-\s+title:\s+([^\n]+)\n\s+path:\s+([^\n]+)\n\s+icon:\s+([^\n]+)/g),
  ].map((match) => ({
    title: match[1].trim(),
    path: match[2].trim(),
    icon: match[3].trim(),
    migration: viewMigration(match[2].trim()),
  }));
  return { resources, views };
}

function viewMigration(path) {
  return {
    home: "Overview",
    rooms: "Area views",
    floorplan: "Optional Floorplan/Canvas",
    scenes: "Scenes & Routines",
    automations: "Scenes & Routines",
    devices: "Area views / Device cluster",
    media: "Media auto view",
    schedule: "Scenes & Routines",
    ecosystem: "Health",
    "global-config": "Strategy Editor",
    panel: "Panel profile",
  }[path] || "review";
}

export function scanPackages() {
  const files = [
    "yeelight_ui.yaml",
    "yeelight_seed.yaml",
    "yeelight_onboarding.yaml",
    "yeelight_schedule.yaml",
  ];
  return files.map((file) => {
    const path = resolve(LEGACY_CONFIG_DIR, "packages", file);
    const source = readText(path);
    return {
      file: `config/packages/${file}`,
      domains: countYamlDomains(source),
      entity_prefixes: [
        ...new Set(
          [...source.matchAll(/\b(yl_[a-z0-9_]+|yeelight_seed_[a-z0-9_]+)/g)].map(
            (match) => match[1].split("_").slice(0, 2).join("_"),
          ),
        ),
      ].sort(),
      migration: packageMigration(file),
    };
  });
}

function countYamlDomains(source) {
  const domains = {};
  for (const match of source.matchAll(/^([a-z_]+):\s*$/gm)) {
    domains[match[1]] = (domains[match[1]] || 0) + 1;
  }
  return domains;
}

function packageMigration(file) {
  if (file === "yeelight_ui.yaml") {
    return "split_theme_selector_demo_helpers_and_forbid_external_rest_dependencies";
  }
  if (file === "yeelight_seed.yaml") return "test_fixture_and_recipe_seed_reference";
  if (file === "yeelight_onboarding.yaml") return "strategy_editor_onboarding_reference";
  if (file === "yeelight_schedule.yaml") return "routines_recipe_reference";
  return "review";
}

export function scanAssets() {
  const assetRoot = resolve(LEGACY_CONFIG_DIR, "www/yeelight/assets");
  const files = walk(assetRoot).filter((file) => isAsset(file));
  const byKind = {};
  const entries = files.map((file) => {
    const rel = relative(REPO_ROOT, file);
    const kind = assetKind(file);
    byKind[kind] = (byKind[kind] || 0) + 1;
    return {
      file: rel,
      kind,
      extension: extname(file).slice(1).toLowerCase(),
      migration: assetMigration(kind, file),
    };
  });
  return { entries, byKind, total: entries.length };
}

function isAsset(file) {
  return [".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(
    extname(file).toLowerCase(),
  );
}

function assetKind(file) {
  const name = basename(file).toLowerCase();
  if (file.includes("/avatars/")) return "avatar";
  if (name.includes("room-")) return "room";
  if (name.includes("scene-")) return "scene";
  if (name.includes("floorplan")) return "floorplan";
  if (name.includes("hero")) return "hero";
  if (name.includes("control-panel")) return "panel";
  if (name.includes("ecosystem")) return "ecosystem";
  return "general";
}

function assetMigration(kind, file) {
  if (kind === "floorplan") return "floorplan_profile_asset_candidate";
  if (kind === "room") return "room_cover_asset_candidate";
  if (kind === "scene") return "scene_cover_asset_candidate";
  if (kind === "hero" || kind === "panel") return "profile_hero_asset_candidate";
  if (kind === "avatar") return "legacy_gallery_only";
  if (basename(file).startsWith("gpt-")) return "review_generated_asset_quality_and_rights";
  return "review";
}

export function scanBackendContracts() {
  const files = [
    "const.py",
    "__init__.py",
    "storage.py",
    "websocket.py",
    "upload.py",
    "manifest.json",
    "tests/test_storage.py",
    "tests/test_upload.py",
  ];
  return files.map((file) => {
    const path = resolve(LEGACY_COMPONENT_DIR, file);
    const source = readText(path);
    return {
      file: `custom_components/yeelight_dashboard/${file}`,
      exists: fileExists(path),
      contracts: backendContractsFor(file, source),
      migration: backendMigrationFor(file),
    };
  });
}

function backendContractsFor(file, source) {
  const contracts = [];
  if (source.includes("yeelight_dashboard/config/get")) contracts.push("ws_config_get");
  if (source.includes("yeelight_dashboard/config/save")) contracts.push("ws_config_save");
  if (source.includes("UPLOAD_MAX_BYTES")) contracts.push("upload_max_bytes_3mb");
  if (source.includes("require_admin") || source.includes("is_admin")) {
    contracts.push("admin_only");
  }
  if (source.includes("data:image")) contracts.push("drop_data_image_urls");
  if (source.includes("/api/") || source.includes("authsig")) {
    contracts.push("drop_transient_api_urls");
  }
  if (source.includes("mediaItems")) contracts.push("media_items_sanitized");
  if (source.includes("iconOverrides")) contracts.push("icon_overrides_sanitized");
  if (source.includes("Store(")) contracts.push("ha_storage_store");
  if (file.endsWith(".json")) contracts.push("ha_manifest");
  return contracts;
}

function backendMigrationFor(file) {
  if (file === "storage.py") return "legacy_import_source_and_sanitizer_reference";
  if (file === "websocket.py") return "legacy_import_export_endpoint_reference";
  if (file === "upload.py") return "optional_asset_upload_reference";
  if (file.startsWith("tests/")) return "safety_contract_reference";
  if (file === "manifest.json") return "optional_companion_or_remove_from_frontend_plugin_path";
  return "review";
}

export function scanLegacyFiles() {
  const roots = [resolve(LEGACY_CONFIG_DIR, "www/yeelight"), LEGACY_COMPONENT_DIR];
  const entries = [];
  for (const root of roots) {
    for (const file of walk(root)) {
      const rel = relative(REPO_ROOT, file);
      entries.push({
        file: rel,
        extension: extname(file).slice(1).toLowerCase() || "none",
        size_bytes: sizeBytes(file),
        category: fileCategory(rel),
      });
    }
  }
  return entries;
}

function fileCategory(rel) {
  if (rel.includes("/assets/")) return "asset";
  if (rel.includes("/widgets/")) return "widget";
  if (rel.includes("/styles/")) return "style";
  if (rel.includes("/runtime/")) return "runtime";
  if (rel.includes("/data/")) return "data";
  if (rel.includes("/views/")) return "view";
  if (rel.includes("/integrations/")) return "integration-wrapper";
  if (rel.includes("custom_components/yeelight_dashboard/tests/")) return "backend-test";
  if (rel.includes("custom_components/yeelight_dashboard/")) return "backend";
  return "other";
}
