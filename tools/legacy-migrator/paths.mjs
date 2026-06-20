import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

export const DASHBOARD_ROOT = resolve(SCRIPT_DIR, "../..");
export const REPO_ROOT = resolve(DASHBOARD_ROOT, "../..");
export const OUTPUT_DIR = resolve(DASHBOARD_ROOT, "docs/legacy-inventory");
export const LEGACY_CONFIG_DIR = resolve(REPO_ROOT, "config");
export const LEGACY_COMPONENT_DIR = resolve(
  REPO_ROOT,
  "custom_components/yeelight_dashboard",
);
export const CATALOG_FILE = resolve(
  LEGACY_CONFIG_DIR,
  "www/yeelight/widgets/panel/catalog.js",
);
export const NATIVE_TYPES_FILE = resolve(
  LEGACY_CONFIG_DIR,
  "www/yeelight/widgets/panel/native-types.js",
);
