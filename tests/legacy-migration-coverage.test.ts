import { describe, expect, it } from "vitest";

import { DASHBOARD_CARD_DEFINITIONS } from "../src/cards/card-definitions";
import { CARD_SUBTYPES } from "../src/cards/card-subtypes";
import type { DashboardCardKind } from "../src/cards/types";
import { NATIVE_RECIPE_LEGACY_WIDGETS } from "../src/recipes/native-cards";
import { RECIPES } from "../src/recipes/recipes";

describe("legacy product card migration coverage", () => {
  it("keeps every legacy subtype on a registered dashboard card", () => {
    const definitionKinds = new Set(DASHBOARD_CARD_DEFINITIONS.map((definition) => definition.kind));
    const missingKinds = Object.keys(CARD_SUBTYPES).filter((kind) => !definitionKinds.has(kind as DashboardCardKind));
    const emptyLegacyIds = subtypeEntries().filter((entry) => !entry.subtype.legacyIds.length);

    expect(missingKinds).toEqual([]);
    expect(emptyLegacyIds).toEqual([]);
  });

  it("keeps every dashboard product legacy subtype visible in recipe source coverage", () => {
    const productLegacyIds = subtypeEntries()
      .flatMap((entry) => entry.subtype.legacyIds)
      .sort();
    const recipeSources = new Set(RECIPES.flatMap((recipe) => recipe.sourceLegacyWidgets));
    const missing = productLegacyIds.filter((legacyId) => !recipeSources.has(legacyId));

    expect(missing).toEqual([]);
  });

  it("keeps every native-wrapper legacy widget visible in HA-native recipe coverage", () => {
    const productLegacyIds = new Set(subtypeEntries().flatMap((entry) => entry.subtype.legacyIds));
    const nativeLegacyIds = NATIVE_RECIPE_LEGACY_WIDGETS.filter((legacyId) => !productLegacyIds.has(legacyId)).sort();
    const recipeSources = RECIPES.flatMap((recipe) => recipe.sourceLegacyWidgets);
    const missing = nativeLegacyIds.filter((legacyId) => !recipeSources.includes(legacyId));
    const duplicateNativeSources = NATIVE_RECIPE_LEGACY_WIDGETS.filter((legacyId, index) => NATIVE_RECIPE_LEGACY_WIDGETS.indexOf(legacyId) !== index);

    expect(missing).toEqual([]);
    expect(duplicateNativeSources).toEqual([]);
  });
});

function subtypeEntries(): Array<{
  kind: DashboardCardKind;
  subtype: NonNullable<(typeof CARD_SUBTYPES)[DashboardCardKind]>[number];
}> {
  const entries: Array<{
    kind: DashboardCardKind;
    subtype: NonNullable<(typeof CARD_SUBTYPES)[DashboardCardKind]>[number];
  }> = [];
  for (const [kind, subtypes] of Object.entries(CARD_SUBTYPES) as Array<[DashboardCardKind, NonNullable<(typeof CARD_SUBTYPES)[DashboardCardKind]>]>) {
    for (const subtype of subtypes) {
      entries.push({ kind, subtype });
    }
  }
  return entries;
}
