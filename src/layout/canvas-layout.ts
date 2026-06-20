import type { LovelaceCardConfig, LovelaceSectionConfig } from "../types";
import type { CanvasCardConfig, CanvasLayoutBox, CanvasLayoutOptions, CanvasLayoutOverride } from "./layout-types";

const DEFAULT_COLUMNS = 12;
const DEFAULT_ROW_HEIGHT = 72;
const DEFAULT_GAP = 12;

export function buildCanvasCards(sections: LovelaceSectionConfig[], options: CanvasLayoutOptions = {}): CanvasCardConfig[] {
  const columns = clampInt(options.columns, 4, 24, DEFAULT_COLUMNS);
  const cards = sections.flatMap((section) => section.cards);
  const occupied: CanvasLayoutBox[] = [];

  return cards.map((card, index) => {
    const key = semanticKey(card, index);
    const size = sizeForCard(card, columns);
    const override = options.overrides?.[key];
    const box = override ? placeBox(occupied, mergeOverride(size, override), columns) : findOpenBox(occupied, size, columns);
    occupied.push(box);
    return {
      ...card,
      view_layout: { ...box, key }
    };
  });
}

export function canvasStyle(options: CanvasLayoutOptions = {}): Record<string, string> {
  return {
    "--yeelight-canvas-columns": String(clampInt(options.columns, 4, 24, DEFAULT_COLUMNS)),
    "--yeelight-canvas-row-height": `${clampInt(options.rowHeight, 48, 160, DEFAULT_ROW_HEIGHT)}px`,
    "--yeelight-canvas-gap": `${clampInt(options.gap, 4, 32, DEFAULT_GAP)}px`
  };
}

function placeBox(occupied: CanvasLayoutBox[], requested: CanvasLayoutBox, columns: number): CanvasLayoutBox {
  const w = clampInt(requested.w, 1, columns, Math.min(columns, DEFAULT_COLUMNS));
  const h = clampInt(requested.h, 1, 12, 2);
  const x = clampInt(requested.x, 0, Math.max(0, columns - w), 0);
  let y = Math.max(0, Math.floor(requested.y));
  const candidate = { ...requested, x, y, w, h };

  while (occupied.some((box) => intersects(box, candidate))) {
    y += 1;
    candidate.y = y;
  }
  return candidate;
}

function findOpenBox(occupied: CanvasLayoutBox[], size: CanvasLayoutBox, columns: number): CanvasLayoutBox {
  const w = clampInt(size.w, 1, columns, 6);
  const h = clampInt(size.h, 1, 12, 2);
  for (let y = 0; y < 200; y += 1) {
    for (let x = 0; x <= columns - w; x += 1) {
      const candidate = { x, y, w, h, z: size.z };
      if (!occupied.some((box) => intersects(box, candidate))) return candidate;
    }
  }
  return { x: 0, y: occupied.reduce((max, box) => Math.max(max, box.y + box.h), 0), w, h, z: size.z };
}

function sizeForCard(card: LovelaceCardConfig, columns: number): CanvasLayoutBox {
  const options = readGridOptions(card);
  return {
    x: 0,
    y: 0,
    w: clampInt(options.columns, 2, columns, card.type.includes("hero") ? columns : 6),
    h: clampInt(options.rows, 1, 12, card.type.includes("hero") ? 3 : 2)
  };
}

function readGridOptions(card: LovelaceCardConfig): { columns?: unknown; rows?: unknown } {
  const value = card.grid_options;
  return value && typeof value === "object" ? (value as { columns?: unknown; rows?: unknown }) : {};
}

function mergeOverride(size: CanvasLayoutBox, override: CanvasLayoutOverride | undefined): CanvasLayoutBox {
  return {
    x: numeric(override?.x, size.x),
    y: numeric(override?.y, size.y),
    w: numeric(override?.w, size.w),
    h: numeric(override?.h, size.h),
    z: numeric(override?.z, size.z ?? 0)
  };
}

function semanticKey(card: LovelaceCardConfig, index: number): string {
  const viewLayout = card.view_layout;
  if (viewLayout && typeof viewLayout === "object" && typeof (viewLayout as { key?: unknown }).key === "string") {
    const key = (viewLayout as { key: string }).key.trim();
    if (key) return key;
  }
  const title = typeof card.title === "string" ? card.title : "";
  const entity = typeof card.entity === "string" ? card.entity : "";
  const type = card.type.replace(/^custom:/, "");
  return [type, title || entity || index].join(":").toLowerCase().replace(/[^a-z0-9_.:-]+/g, "-");
}

function intersects(a: CanvasLayoutBox, b: CanvasLayoutBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function numeric(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
