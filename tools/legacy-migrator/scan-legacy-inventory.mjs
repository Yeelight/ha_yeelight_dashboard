#!/usr/bin/env node

import { mkdirSync } from "node:fs";
import { relative } from "node:path";

import { CATALOG_FILE, NATIVE_TYPES_FILE, OUTPUT_DIR, REPO_ROOT } from "./paths.mjs";
import { readText, writeJson, writeMarkdown } from "./fs-utils.mjs";
import { parseCatalogWidgets, parseNativeSpecs } from "./legacy-parsers.mjs";
import { buildWidgetMap } from "./widget-map.mjs";
import { buildReport } from "./report-builder.mjs";
import {
  scanAssets,
  scanBackendContracts,
  scanLegacyFiles,
  scanPackages,
  scanResources,
} from "./source-scanner.mjs";
import {
  renderAssetsMap,
  renderGallery,
  renderLayoutMap,
  renderMigrationReport,
} from "./render-inventory.mjs";

main();

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const widgets = parseCatalogWidgets(readText(CATALOG_FILE));
  const nativeSpecs = parseNativeSpecs(readText(NATIVE_TYPES_FILE));
  const resourceInventory = scanResources();
  const packageInventory = scanPackages();
  const assetInventory = scanAssets();
  const backendInventory = scanBackendContracts();
  const fileInventory = scanLegacyFiles();
  const widgetMap = buildWidgetMap(widgets, nativeSpecs);
  const report = buildReport({
    widgets,
    nativeSpecs,
    widgetMap,
    resourceInventory,
    packageInventory,
    assetInventory,
    backendInventory,
    fileInventory,
  });

  writeJson("legacy-widget-map.json", widgetMap);
  writeJson("legacy-report.json", report);
  writeMarkdown("legacy-card-gallery.md", renderGallery(widgetMap, report));
  writeMarkdown("legacy-layout-map.md", renderLayoutMap(widgetMap, report));
  writeMarkdown("legacy-assets-map.md", renderAssetsMap(assetInventory, report));
  writeMarkdown("legacy-migration-report.md", renderMigrationReport(report));

  console.log(`Wrote legacy inventory to ${relative(REPO_ROOT, OUTPUT_DIR)}`);
  console.log(
    `Widgets: ${report.summary.widgets.total}, native wrappers: ${report.summary.widgets.native}, assets: ${report.summary.assets.total}`,
  );
}
