import type { DashboardCardGridOptions, DashboardCardKind } from "./types";
import { cardDefinitionFromType } from "./card-definitions";

const GRID_OPTIONS: Record<DashboardCardKind, DashboardCardGridOptions> = {
  hero: { columns: 12, rows: 9 },
  status: { columns: 12, rows: 5 },
  notice: { columns: 12, rows: 5 },
  light: { columns: 12, rows: 8 },
  rooms: { columns: 12, rows: 9 },
  room: { columns: 12, rows: 6 },
  devices: { columns: 12, rows: 7 },
  routines: { columns: 12, rows: 5 },
  environment: { columns: 12, rows: 7 },
  climate: { columns: 12, rows: 7 },
  air: { columns: 12, rows: 6 },
  water: { columns: 12, rows: 6 },
  power: { columns: 12, rows: 6 },
  energy: { columns: 12, rows: 6 },
  infrastructure: { columns: 12, rows: 6 },
  media: { columns: 12, rows: 7 },
  camera: { columns: 12, rows: 7 },
  cameraWall: { columns: 12, rows: 8 },
  security: { columns: 12, rows: 6 },
  presence: { columns: 12, rows: 6 },
  panelActions: { columns: 12, rows: 4 },
  image: { columns: 12, rows: 6 },
  note: { columns: 12, rows: 4 },
  ecosystem: { columns: 12, rows: 7 },
  health: { columns: 12, rows: 6 }
};

export function gridOptionsForKind(kind: DashboardCardKind): DashboardCardGridOptions {
  return GRID_OPTIONS[kind];
}

export function kindFromCardType(type: unknown): DashboardCardKind {
  return cardDefinitionFromType(type)?.kind ?? "hero";
}

export function gridOptionsForConfig(
  kind: DashboardCardKind,
  gridOptions: unknown
): DashboardCardGridOptions {
  const fallback = gridOptionsForKind(kind);
  const override = normalizeGridOptionsOverride(gridOptions);
  return {
    columns: override?.columns ?? fallback.columns,
    rows: override?.rows ?? fallback.rows
  };
}

export function normalizeGridOptionsOverride(value: unknown): Partial<DashboardCardGridOptions> | undefined {
  const columns = optionalClampedNumber(readOption(value, "columns"), 2, 12);
  const rows = optionalClampedNumber(readOption(value, "rows"), 1, 12);
  if (columns === undefined && rows === undefined) return undefined;
  return {
    ...(columns === undefined ? {} : { columns }),
    ...(rows === undefined ? {} : { rows })
  };
}

function readOption(value: unknown, key: keyof DashboardCardGridOptions): unknown {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Partial<Record<keyof DashboardCardGridOptions, unknown>>)[key] : undefined;
}

function optionalClampedNumber(value: unknown, min: number, max: number): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) return undefined;
  return Math.min(max, Math.max(min, Math.round(number)));
}
