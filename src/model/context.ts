import type { HomeAssistant, YeelightDashboardConfig } from "../types";
import { areaIdForEntity, buildRegistryIndex, loadRegistry, selectableEntities, type RegistryIndex } from "./registry";

export type DashboardContext = {
  hass?: HomeAssistant;
  config: YeelightDashboardConfig;
  index: RegistryIndex;
  entities: string[];
};

export async function createDashboardContext(
  hass: HomeAssistant | undefined,
  config: YeelightDashboardConfig
): Promise<DashboardContext> {
  const registry = await loadRegistry(hass);
  const index = buildRegistryIndex(hass, registry);
  return {
    hass,
    config,
    index,
    entities: filterSelectedAreas(selectableEntities(hass, index, config.scope), index, config)
  };
}

function filterSelectedAreas(entities: string[], index: RegistryIndex, config: YeelightDashboardConfig): string[] {
  if (config.area_mode !== "selected" || !config.selected_areas.length) return entities;
  const selected = new Set(config.selected_areas);
  return entities.filter((entityId) => selected.has(areaIdForEntity(index.entitiesById.get(entityId), index.devicesById) || ""));
}
