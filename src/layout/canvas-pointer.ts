import type { CanvasLayoutBox } from "./layout-types";

export type CanvasPointerMode = "move" | "resize";

export type CanvasGridMetrics = {
  columns: number;
  columnWidth: number;
  rowHeight: number;
  gap: number;
};

const MAX_ROW_SPAN = 24;

export function layoutFromPointerDelta(
  layout: CanvasLayoutBox,
  deltaX: number,
  deltaY: number,
  metrics: CanvasGridMetrics,
  mode: CanvasPointerMode
): CanvasLayoutBox {
  const columnDelta = Math.round(deltaX / Math.max(1, metrics.columnWidth + metrics.gap));
  const rowDelta = Math.round(deltaY / Math.max(1, metrics.rowHeight + metrics.gap));
  if (mode === "resize") {
    return normalizeCanvasBox(
      {
        ...layout,
        w: layout.w + columnDelta,
        h: layout.h + rowDelta
      },
      metrics.columns
    );
  }
  return normalizeCanvasBox(
    {
      ...layout,
      x: layout.x + columnDelta,
      y: layout.y + rowDelta
    },
    metrics.columns
  );
}

export function normalizeCanvasBox(layout: CanvasLayoutBox, columns: number): CanvasLayoutBox {
  const safeColumns = clampInt(columns, 1, 24, 12);
  const w = clampInt(layout.w, 1, safeColumns, Math.min(6, safeColumns));
  const h = clampInt(layout.h, 1, MAX_ROW_SPAN, 2);
  return {
    ...layout,
    x: clampInt(layout.x, 0, Math.max(0, safeColumns - w), 0),
    y: Math.max(0, Math.floor(layout.y)),
    w,
    h,
    z: Number.isFinite(Number(layout.z)) ? Math.floor(Number(layout.z)) : layout.z
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
