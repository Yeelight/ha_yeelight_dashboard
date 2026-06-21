import { css } from "lit";

export const dashboardCardContentStyles = css`
  .hero-board,
  .entity-list,
  .status-board,
  .devices-board,
  .routine-board,
  .environment-board,
  .ecosystem-board {
    display: grid;
    gap: 8px;
  }

  .hero-copy {
    display: grid;
    gap: 4px;
    padding: 14px;
    border-radius: 8px;
    color: var(--primary-text-color, #212121);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 10%, transparent), transparent 64%),
      color-mix(in srgb, var(--yd-surface) 88%, transparent);
    border: 1px solid color-mix(in srgb, var(--yd-accent) 14%, var(--yd-border));
  }

  .hero-copy strong {
    font-size: 26px;
    line-height: 1.1;
  }

  .hero-kicker {
    color: var(--yd-accent);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
  }

  .hero-copy span,
  .section-label,
  .area-card-stats,
  .health-ok {
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
  }

  .section-label {
    font-weight: 650;
    letter-spacing: 0;
  }

  .area-strip,
  .room-grid,
  .tile-grid,
  .quick-grid,
  .status-groups {
    display: grid;
    gap: 8px;
  }

  .area-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .room-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quick-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .routine-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .environment-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .status-groups {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .compact-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .area-pill,
  .area-card,
  .entity-tile,
  .action-tile,
  .device-row,
  .routine-hero-action,
  .environment-primary,
  .environment-stat,
  .status-group,
  .health-ok {
    min-width: 0;
    padding: 10px;
  }

  .density-compact .area-pill,
  .density-compact .area-card,
  .density-compact .entity-tile,
  .density-compact .action-tile,
  .density-compact .device-row,
  .density-compact .routine-hero-action,
  .density-compact .environment-primary,
  .density-compact .environment-stat,
  .density-compact .status-group,
  .density-compact .health-ok {
    padding: 8px;
  }

  .variant-panel .area-pill,
  .variant-panel .area-card,
  .variant-panel .entity-tile,
  .variant-panel .action-tile,
  .variant-panel .device-row,
  .variant-panel .routine-hero-action,
  .variant-panel .environment-primary,
  .variant-panel .environment-stat,
  .variant-panel .status-group,
  .variant-panel .health-ok {
    min-height: 84px;
  }

  .status-group {
    display: grid;
    align-content: center;
    justify-items: start;
    gap: 4px;
    min-height: 82px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 6%, transparent), transparent 62%),
      color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  .status-group ha-icon {
    color: var(--yd-accent);
  }

  .status-group strong {
    color: var(--primary-text-color, #212121);
    font-size: 22px;
    line-height: 1;
  }

  .status-group span {
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
  }

  .area-card,
  .entity-tile,
  .action-tile,
  .device-row,
  .environment-stat {
    min-height: 70px;
  }

  .area-card {
    display: grid;
    align-content: space-between;
    gap: 8px;
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 4%, transparent), transparent 58%),
      color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  .area-card.warning {
    border-color: color-mix(in srgb, var(--warning-color, #f29900) 38%, var(--divider-color, rgba(0, 0, 0, 0.12)));
  }

  .area-card-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
  }

  .area-card-head span {
    min-width: 22px;
    border-radius: 999px;
    padding: 2px 7px;
    text-align: center;
    color: var(--warning-color, #f29900);
    background: color-mix(in srgb, var(--warning-color, #f29900) 10%, transparent);
  }

  .area-card-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .area-progress {
    height: 4px;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 50%, transparent);
  }

  .area-progress span {
    display: block;
    width: var(--area-progress, 0%);
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--yd-accent), color-mix(in srgb, var(--yd-accent) 52%, white));
  }

  .area-pill {
    display: grid;
    gap: 3px;
  }

  .entity-tile {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px 10px;
    align-items: center;
    position: relative;
  }

  .entity-tile.active,
  .action-tile:not(:disabled):hover {
    border-color: color-mix(in srgb, var(--yd-accent) 45%, var(--yd-border));
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 7%, transparent), transparent 70%),
      color-mix(in srgb, var(--yd-accent) 3%, var(--yd-surface-muted));
  }

  .entity-tile:hover,
  .area-card:hover,
  .area-pill:hover {
    border-color: color-mix(in srgb, var(--yd-accent) 28%, var(--yd-border));
  }

  .action-tile {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    align-items: center;
    justify-items: start;
    gap: 6px;
    text-align: left;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--yd-surface) 54%, transparent);
  }

  .variant-compact .subtitle,
  .variant-compact .section-label {
    display: none;
  }

  .action-tile ha-icon {
    color: var(--yd-accent);
  }

  .action-tile strong,
  .action-tile span,
  .area-pill strong,
  .area-pill span,
  .area-card-head strong,
  .entity-tile strong,
  .entity-tile span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .health-ok {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    color: var(--success-color, #0f9d58);
    background: color-mix(in srgb, var(--success-color, #0f9d58) 8%, var(--yd-surface-muted));
  }

  .entity-row {
    grid-template-columns: auto minmax(0, 1fr) auto;
    padding: 8px;
    background: color-mix(in srgb, var(--yd-surface-muted) 84%, transparent);
  }

  .entity-list.compact {
    gap: 6px;
  }

  .entity-row.muted {
    opacity: 0.68;
  }
`;
