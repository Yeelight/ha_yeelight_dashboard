import { css } from "lit";

export const dashboardCardBaseStyles = css`
  :host {
    display: block;
    height: 100%;
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
    display: block;
    box-sizing: border-box;
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
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    gap: 13px;
    box-sizing: border-box;
    min-width: 0;
    height: 100%;
    min-height: 0;
    overflow: hidden;
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

  .card.climate {
    --yd-accent: #0086c9;
  }

  .card.air {
    --yd-accent: #00a37a;
  }

  .card.water {
    --yd-accent: #0d8bd8;
  }

  .card.power {
    --yd-accent: #f29900;
  }

  .card.energy {
    --yd-accent: #7cb342;
  }

  .card.infrastructure {
    --yd-accent: #5e7ce2;
  }

  .card.media {
    --yd-accent: #4b7bec;
  }

  .card.camera,
  .card.cameraWall {
    --yd-accent: #44546a;
  }

  .card.security {
    --yd-accent: #d35400;
  }

  .card.presence {
    --yd-accent: #0f9d8a;
  }

  .card.panelActions {
    --yd-accent: #7a64d6;
  }

  .card.image {
    --yd-accent: #2f7dcd;
  }

  .card.note {
    --yd-accent: #8a6d3b;
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
  .metric small,
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
  .device-feature,
  .device-lane,
  .routine-type-chips button,
  .routine-type-chips span,
  .environment-zones button,
  .environment-zone,
  .health-hero,
  .health-group,
  .area-card,
  .area-pill,
  .entity-tile,
  .action-tile,
    .routine-hero-action,
    .environment-primary,
    .environment-stat,
    .media-feature,
    .media-row,
    .camera-feature,
    .camera-thumb,
    .security-feature,
    .security-row,
    .presence-row,
    .presence-person,
    .status-group,
    .health-ok {
    border: 1px solid var(--yd-border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  .metric {
    display: block;
    min-width: 0;
    width: 100%;
    padding: 9px 10px;
    border-color: color-mix(in srgb, var(--yd-border) 84%, transparent);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--yd-surface) 96%, white), color-mix(in srgb, var(--yd-surface-muted) 64%, transparent));
    color: inherit;
    font: inherit;
    text-align: left;
  }

  .density-compact .metric {
    padding: 7px 8px;
  }

  .metric strong,
  .metric span,
  .metric small,
  .entity-text strong,
  .entity-text span {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .metric small {
    margin-top: 5px;
    color: color-mix(in srgb, var(--yd-accent) 70%, var(--secondary-text-color, #727272));
    font-size: 11px;
    font-weight: 650;
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
