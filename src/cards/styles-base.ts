import { css } from "lit";

export const dashboardCardBaseStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    font-family: var(--paper-font-body1_-_font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
    --yd-accent: var(--yl-accent, var(--primary-color, #1976d2));
    --yd-accent-soft: color-mix(in srgb, var(--yd-accent) 9%, transparent);
    --yd-surface: var(--yl-surface, var(--ha-card-background, var(--card-background-color, #fff)));
    --yd-surface-muted: color-mix(in srgb, var(--secondary-background-color, #f3f3f3) 74%, var(--yd-surface));
    --yd-border: color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    --yd-shadow: var(--yl-card-shadow, 0 6px 22px rgba(18, 24, 38, 0.075));
  }

  ha-card {
    height: 100%;
    overflow: hidden;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--yd-surface) 96%, white), var(--yd-surface)),
      var(--yd-surface);
    color: var(--primary-text-color, #212121);
    border-radius: var(--yl-radius-card, var(--ha-card-border-radius, 8px));
    border: 1px solid var(--yd-border);
    box-shadow: var(--yd-shadow);
  }

  .card {
    display: grid;
    gap: 13px;
    min-width: 0;
    min-height: 100%;
    padding: 15px;
    position: relative;
    isolation: isolate;
  }

  .card.density-compact {
    gap: 9px;
    padding: 12px;
  }

  .card.variant-panel {
    gap: 16px;
    padding: 18px;
  }

  .card::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 4%, transparent), transparent 46%),
      linear-gradient(180deg, transparent, color-mix(in srgb, var(--yd-surface-muted) 16%, transparent));
  }

  .card.hero {
    --yd-accent: var(--yl-warm, #f6a400);
    gap: 16px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 6%, transparent), transparent 44%),
      linear-gradient(90deg, color-mix(in srgb, var(--secondary-background-color, #f3f3f3) 78%, transparent), transparent);
  }

  .card.light {
    --yd-accent: var(--yl-warm, #f6a400);
  }

  .card.status {
    --yd-accent: #2f7dcd;
  }

  .card.notice {
    --yd-accent: var(--warning-color, #f29900);
  }

  .card.rooms,
  .card.room {
    --yd-accent: #20a67a;
  }

  .card.devices {
    --yd-accent: #2276d2;
  }

  .card.routines {
    --yd-accent: #7a64d6;
  }

  .card.environment {
    --yd-accent: #00a1a7;
  }

  .card.health {
    --yd-accent: var(--success-color, #0f9d58);
  }

  .card.ecosystem {
    --yd-accent: #00897b;
  }

  .header,
  .entity-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .title-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .header-icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    color: var(--yd-accent);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 18%, transparent), color-mix(in srgb, var(--yd-accent) 6%, transparent)),
      var(--yd-surface-muted);
    border: 1px solid color-mix(in srgb, var(--yd-accent) 22%, transparent);
  }

  .title,
  .subtitle {
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .title {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.25;
  }

  .variant-panel .title {
    font-size: 18px;
  }

  .subtitle,
  .metric span,
  .entity-text span,
  .empty {
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .metrics.count-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .metric,
  .entity-row,
  .device-row,
  .area-card,
  .area-pill,
  .entity-tile,
  .action-tile,
  .routine-hero-action,
  .environment-primary,
  .environment-stat,
  .status-group,
  .health-ok {
    border: 1px solid var(--yd-border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  .metric {
    min-width: 0;
    padding: 9px 10px;
    border-color: color-mix(in srgb, var(--yd-border) 84%, transparent);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--yd-surface) 96%, white), color-mix(in srgb, var(--yd-surface-muted) 64%, transparent));
  }

  .density-compact .metric {
    padding: 7px 8px;
  }

  .metric strong,
  .metric span,
  .entity-text strong,
  .entity-text span {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .metric strong {
    color: var(--yd-accent);
    font-size: 22px;
    line-height: 1.05;
  }

  .metric.hot strong {
    color: var(--yl-warm, #f5a623);
  }

  .metric.ok strong {
    color: var(--success-color, #0f9d58);
  }

  .metric.warn strong {
    color: var(--warning-color, #f29900);
  }
`;
