import type { NormalizedEntity } from "./types";

export function preferMeaningfulEntities(entities: NormalizedEntity[]): NormalizedEntity[] {
  return [...entities].sort((a, b) => entityQuality(b) - entityQuality(a));
}

function entityQuality(entity: NormalizedEntity): number {
  const hasNumericValue = Number.isFinite(Number(entity.state));
  const hasKnownState = entity.state !== "unknown" && entity.state !== "unavailable";
  return (entity.available ? 4 : 0) + (hasKnownState ? 3 : 0) + (hasNumericValue ? 2 : 0) + (entity.domain !== "binary_sensor" ? 1 : 0);
}
