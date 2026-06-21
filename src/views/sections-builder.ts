import type { DashboardContext } from "../model/context";
import { buildCanvasCards, canvasStyle } from "../layout/canvas-layout";
import type { CanvasLayoutOverride } from "../layout/layout-types";
import { buildRecipeSections, type RecipeTarget } from "../recipes/recipes";
import { localize, type TranslationKey } from "../i18n";
import type { LovelaceViewConfig } from "../types";
import { CANVAS_VIEW_TAG } from "./canvas-view";

const VIEW_META: Record<RecipeTarget, { titleKey: TranslationKey; path: string; icon: string }> = {
  overview: { titleKey: "view.overview", path: "overview", icon: "mdi:view-dashboard" },
  lighting: { titleKey: "view.lighting", path: "lighting", icon: "mdi:lightbulb-group" },
  areas: { titleKey: "view.areas", path: "areas", icon: "mdi:floor-plan" },
  routines: { titleKey: "view.routines", path: "scenes", icon: "mdi:movie-open-play" },
  environment: { titleKey: "view.environment", path: "environment", icon: "mdi:thermometer" },
  media: { titleKey: "view.media", path: "media", icon: "mdi:play-network" },
  health: { titleKey: "view.health", path: "health", icon: "mdi:heart-pulse" }
};

export function buildSectionsViews(context: DashboardContext): LovelaceViewConfig[] {
  const order: RecipeTarget[] = ["overview", "lighting", "areas", "routines", "environment", "media", "health"];
  return order
    .filter((target) => shouldIncludeView(context, target))
    .map((target) => {
      const meta = VIEW_META[target];
      const sections = buildRecipeSections(target, context);
      const title = localize(context.hass, meta.titleKey);
      if (context.config.layout_mode === "canvas") {
        return {
          title,
          path: meta.path,
          icon: meta.icon,
          type: `custom:${CANVAS_VIEW_TAG}`,
          theme: context.config.theme,
          layout_studio: true,
          cards: buildCanvasCards(sections, {
            overrides: readLayoutOverrides(context, target)
          }),
          style: canvasStyle()
        };
      }
      return {
        title,
        path: meta.path,
        icon: meta.icon,
        type: "sections",
        theme: context.config.theme,
        sections: sections.length ? sections : [{ type: "grid", title, cards: [{ type: "markdown", content: `### ${title}\n${localize(context.hass, "empty.no_entities")}` }] }]
      };
    });
}

function shouldIncludeView(context: DashboardContext, target: RecipeTarget): boolean {
  const configured = context.config.views[target === "routines" ? "routines" : target];
  if (configured === false) return false;
  if (configured === true) return true;
  return buildRecipeSections(target, context).length > 0;
}

function readLayoutOverrides(context: DashboardContext, target: RecipeTarget): Record<string, CanvasLayoutOverride> | undefined {
  const overrides = context.config.layout_overrides?.[target];
  return overrides && typeof overrides === "object" && !Array.isArray(overrides)
    ? (overrides as Record<string, CanvasLayoutOverride>)
    : undefined;
}
