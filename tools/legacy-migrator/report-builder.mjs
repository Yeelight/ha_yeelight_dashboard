import { countBy } from "./fs-utils.mjs";

export function buildReport({
  widgets,
  nativeSpecs,
  widgetMap,
  resourceInventory,
  packageInventory,
  assetInventory,
  backendInventory,
  fileInventory,
}) {
  const mappedWidgets = Object.values(widgetMap);
  const statusCounts = countBy(mappedWidgets, (item) => item.status);
  const groupCounts = countBy(mappedWidgets, (item) => item.group);
  const fileCategoryCounts = countBy(fileInventory, (item) => item.category);
  const native = mappedWidgets.filter((item) => item.type === "native-card").length;
  const nonNative = mappedWidgets.length - native;

  return {
    generated_at: new Date().toISOString(),
    source_roots: ["config", "custom_components/yeelight_dashboard"],
    summary: {
      widgets: {
        total: Object.keys(widgetMap).length,
        catalog_entries: widgets.length,
        native,
        non_native: nonNative,
        status_counts: statusCounts,
        group_counts: groupCounts,
      },
      native_specs: {
        total: nativeSpecs.length,
        custom_specs: nativeSpecs.filter((spec) => spec.custom).length,
      },
      lovelace: {
        resources: resourceInventory.resources.length,
        views: resourceInventory.views.length,
        external_community_resources: resourceInventory.resources.filter((item) =>
          item.url.includes("/community/"),
        ).length,
      },
      packages: packageInventory.map((item) => ({
        file: item.file,
        domains: item.domains,
        migration: item.migration,
      })),
      assets: {
        total: assetInventory.total,
        by_kind: assetInventory.byKind,
      },
      files: {
        total: fileInventory.length,
        by_category: fileCategoryCounts,
      },
    },
    lovelace: resourceInventory,
    backend: backendInventory,
    package_inventory: packageInventory,
    asset_inventory: assetInventory,
    file_inventory: fileInventory,
  };
}
