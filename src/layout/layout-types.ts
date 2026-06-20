import type { LovelaceCardConfig } from "../types";

export type CanvasLayoutBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  z?: number;
};

export type CanvasLayoutOverride = Partial<CanvasLayoutBox>;

export type CanvasLayoutOptions = {
  columns?: number;
  rowHeight?: number;
  gap?: number;
  overrides?: Record<string, CanvasLayoutOverride>;
};

export type CanvasCardConfig = LovelaceCardConfig & {
  view_layout: CanvasLayoutBox & {
    key: string;
  };
};
