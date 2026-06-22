import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { DASHBOARD_CARD_DEFINITIONS } from "../src/cards/card-definitions";
import { CARD_SUBTYPES } from "../src/cards/card-subtypes";
import type { DashboardCardKind } from "../src/cards/types";
import { NATIVE_RECIPE_LEGACY_WIDGETS } from "../src/recipes/native-cards";
import { RECIPES } from "../src/recipes/recipes";

type LegacyWidget = {
  legacy_id: string;
  target: string;
  replacement_kind: string;
};

describe("legacy product card migration coverage", () => {
  it("maps every dashboard product legacy widget to an editor subtype on the target card", () => {
    const widgets = Object.values(readLegacyWidgetMap()).filter((widget) => widget.replacement_kind === "dashboard_internal_card");
    const subtypeIndex = buildSubtypeIndex();
    const definitionsByKind = new Map(DASHBOARD_CARD_DEFINITIONS.map((definition) => [definition.kind, definition]));

    const missing = widgets.filter((widget) => {
      const subtype = subtypeIndex.get(widget.legacy_id);
      return !subtype || definitionsByKind.get(subtype.kind)?.type !== widget.target;
    });

    expect(missing.map((widget) => widget.legacy_id)).toEqual([]);
  });

  it("keeps every dashboard product legacy widget visible in recipe source coverage", () => {
    const productLegacyIds = Object.values(readLegacyWidgetMap())
      .filter((widget) => widget.replacement_kind === "dashboard_internal_card")
      .map((widget) => widget.legacy_id)
      .sort();
    const recipeSources = new Set(RECIPES.flatMap((recipe) => recipe.sourceLegacyWidgets));
    const missing = productLegacyIds.filter((legacyId) => !recipeSources.has(legacyId));

    expect(missing).toEqual([]);
  });

  it("keeps every native-wrapper legacy widget visible in HA-native recipe coverage", () => {
    const nativeLegacyIds = Object.values(readLegacyWidgetMap())
      .filter((widget) => widget.replacement_kind === "ha_native_card_recipe")
      .map((widget) => widget.legacy_id)
      .sort();
    const recipeSources = RECIPES.flatMap((recipe) => recipe.sourceLegacyWidgets);
    const missing = nativeLegacyIds.filter((legacyId) => !recipeSources.includes(legacyId));
    const extraNativeSources = NATIVE_RECIPE_LEGACY_WIDGETS.filter((legacyId) => !nativeLegacyIds.includes(legacyId));
    const duplicateNativeSources = NATIVE_RECIPE_LEGACY_WIDGETS.filter((legacyId, index) => NATIVE_RECIPE_LEGACY_WIDGETS.indexOf(legacyId) !== index);

    expect(missing).toEqual([]);
    expect(extraNativeSources).toEqual([]);
    expect(duplicateNativeSources).toEqual([]);
  });
});

function readLegacyWidgetMap(): Record<string, LegacyWidget> {
  return JSON.parse(readFileSync("docs/legacy-inventory/legacy-widget-map.json", "utf8")) as Record<string, LegacyWidget>;
}

function buildSubtypeIndex(): Map<string, { kind: DashboardCardKind; subtype: string }> {
  const index = new Map<string, { kind: DashboardCardKind; subtype: string }>();
  for (const [kind, subtypes] of Object.entries(CARD_SUBTYPES) as Array<[DashboardCardKind, NonNullable<(typeof CARD_SUBTYPES)[DashboardCardKind]>]>) {
    for (const subtype of subtypes) {
      for (const legacyId of subtype.legacyIds) {
        index.set(legacyId, { kind, subtype: subtype.value });
      }
    }
  }
  return index;
}
