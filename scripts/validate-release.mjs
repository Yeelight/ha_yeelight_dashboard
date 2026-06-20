import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const expectedFile = "ha_yeelight_dashboard.js";
const hacs = JSON.parse(readFileSync(join(root, "hacs.json"), "utf8"));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const readme = readFileSync(join(root, "README.md"), "utf8");
const readmeZh = readFileSync(join(root, "README_zh.md"), "utf8");
const viteConfig = readFileSync(join(root, "vite.config.ts"), "utf8");
const distFiles = existsSync(join(root, "dist")) ? readdirSync(join(root, "dist")).filter((file) => !file.startsWith(".")) : [];
const failures = [];

expect(hacs.filename === expectedFile, "hacs.json filename must match the built dashboard resource.");
expect(hacs.content_in_root === false, "hacs.json content_in_root must stay false for dist/ release layout.");
expect(!("zip_release" in hacs), "hacs.json must not use zip_release for a frontend resource plugin.");
expect(!existsSync(join(root, "custom_components")), "frontend dashboard plugin must not ship custom_components/.");
expect(packageJson.scripts?.build === "vite build", "package.json build script must run vite build.");
expect(packageJson.scripts?.["test:browser"], "package.json must keep browser smoke validation.");
expect(packageJson.scripts?.["test:live"], "package.json must keep optional live HA smoke validation.");
expect(viteConfig.includes("codeSplitting: false"), "vite.config.ts must keep single-file release output.");
expect(distFiles.length === 1 && distFiles[0] === expectedFile, `dist/ must contain only ${expectedFile}.`);
expect(readme.includes(`/hacsfiles/ha_yeelight_dashboard/${expectedFile}`), "README.md must document the HACS resource URL.");
expect(readme.includes(`/local/${expectedFile}`), "README.md must document the manual local resource URL.");
expect(readmeZh.includes(`/hacsfiles/ha_yeelight_dashboard/${expectedFile}`), "README_zh.md must document the HACS resource URL.");
expect(readmeZh.includes(`/local/${expectedFile}`), "README_zh.md must document the manual local resource URL.");
expect(readme.includes("HA_LIVE_DASHBOARD_PATH"), "README.md must document Lovelace dashboard path override for resource smoke.");
expect(readme.includes("HA_LIVE_RESOURCE_TIMEOUT_MS"), "README.md must document resource fetch timeout for live smoke.");
expect(readmeZh.includes("HA_LIVE_DASHBOARD_PATH"), "README_zh.md must document Lovelace dashboard path override for resource smoke.");
expect(readmeZh.includes("HA_LIVE_RESOURCE_TIMEOUT_MS"), "README_zh.md must document resource fetch timeout for live smoke.");

if (failures.length) {
  throw new Error(`release validation failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
}

console.log(JSON.stringify({ ok: true, file: expectedFile, distFiles }));

function expect(condition, message) {
  if (!condition) failures.push(message);
}
