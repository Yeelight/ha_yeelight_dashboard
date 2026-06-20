import type { DashboardContext } from "../model/context";
import { buildCanvasCards, canvasStyle } from "../layout/canvas-layout";
import type { CanvasLayoutOverride } from "../layout/layout-types";
import { buildRecipeSections, type RecipeTarget } from "../recipes/recipes";
import type { LovelaceViewConfig } from "../types";
import { CANVAS_VIEW_TAG } from "./canvas-view";

const VIEW_META: Record<RecipeTarget, { title: string; path: string; icon: string }> = {
  overview: { title: "Overview", path: "overview", icon: "mdi:view-dashboard" },
  lighting: { title: "Lighting", path: "lighting", icon: "mdi:lightbulb-group" },
  areas: { title: "Areas", path: "areas", icon: "mdi:floor-plan" },
  routines: { title: "Scenes", path: "scenes", icon: "mdi:movie-open-play" },
  environment: { title: "Environment", path: "environment", icon: "mdi:thermometer" },
  media: { title: "Media", path: "media", icon: "mdi:play-network" },
  health: { title: "Health", path: "health", icon: "mdi:heart-pulse" }
};

export function buildSectionsViews(context: DashboardContext): LovelaceViewConfig[] {
  const order: RecipeTarget[] = ["overview", "lighting", "areas", "routines", "environment", "media", "health"];
  return order
    .filter((target) => shouldIncludeView(context, target))
    .map((target) => {
      const meta = VIEW_META[target];
      const sections = buildRecipeSections(target, context);
      if (context.config.layout_mode === "canvas") {
        return {
          ...meta,
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
        ...meta,
        type: "sections",
        theme: context.config.theme,
        sections: sections.length ? sections : [{ type: "grid", title: meta.title, cards: [{ type: "markdown", content: `### ${meta.title}\nNo matching entities yet.` }] }]
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
