import { describe, expect, it } from "vitest";

import { buildCanvasCards } from "../src/layout/canvas-layout";

describe("canvas layout", () => {
  it("converts section cards into stable view_layout boxes", () => {
    const [hero, light] = buildCanvasCards(
      [
        {
          title: "Home",
          cards: [
            { type: "custom:yeelight-dashboard-hero-card", view_layout: { key: "overview.hero" }, grid_options: { columns: 12, rows: 3 } },
            { type: "custom:yeelight-dashboard-light-card", view_layout: { key: "overview.lights" }, grid_options: { columns: 6, rows: 2 } }
          ]
        }
      ],
      { overrides: { "overview.hero": { x: 0, y: 0, w: 12, h: 3 } } }
    );

    expect(hero.view_layout).toEqual({ key: "overview.hero", x: 0, y: 0, w: 12, h: 3, z: 0 });
    expect(light.view_layout).toMatchObject({ key: "overview.lights", x: 0, y: 3, w: 6, h: 2 });
  });

  it("packs automatic cards into open grid space", () => {
    const cards = buildCanvasCards([
      {
        cards: [
          { type: "tile", view_layout: { key: "entity.light.a" }, grid_options: { columns: 6, rows: 2 } },
          { type: "tile", view_layout: { key: "entity.light.b" }, grid_options: { columns: 6, rows: 2 } }
        ]
      }
    ]);

    expect(cards[0].view_layout).toMatchObject({ x: 0, y: 0, w: 6, h: 2 });
    expect(cards[1].view_layout).toMatchObject({ x: 6, y: 0, w: 6, h: 2 });
  });

  it("moves colliding override boxes down instead of overlapping", () => {
    const cards = buildCanvasCards(
      [
        {
          cards: [
            { type: "tile", view_layout: { key: "entity.light.a" }, grid_options: { columns: 6, rows: 2 } },
            { type: "tile", view_layout: { key: "entity.light.b" }, grid_options: { columns: 6, rows: 2 } }
          ]
        }
      ],
      {
        overrides: {
          "entity.light.a": { x: 0, y: 0 },
          "entity.light.b": { x: 0, y: 0 }
        }
      }
    );

    expect(cards[0].view_layout).toMatchObject({ x: 0, y: 0, w: 6, h: 2 });
    expect(cards[1].view_layout).toMatchObject({ x: 0, y: 2, w: 6, h: 2 });
  });
});
