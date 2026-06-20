import type { DashboardCardKind } from "./types";

export type DashboardCardGridOptions = {
  columns: number;
  rows: number;
};

const GRID_OPTIONS: Record<DashboardCardKind, DashboardCardGridOptions> = {
  hero: { columns: 12, rows: 9 },
  light: { columns: 12, rows: 8 },
  rooms: { columns: 12, rows: 9 },
  room: { columns: 12, rows: 6 },
  routines: { columns: 12, rows: 5 },
  health: { columns: 12, rows: 6 }
};

export function gridOptionsForKind(kind: DashboardCardKind): DashboardCardGridOptions {
  return GRID_OPTIONS[kind];
}
