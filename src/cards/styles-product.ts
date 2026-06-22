import { css } from "lit";

export const dashboardCardProductStyles = css`
  .routine-hero-action {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: stretch;
    gap: 8px;
    width: 100%;
    min-height: 104px;
    padding: 14px;
    text-align: left;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 12%, transparent), transparent 68%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .routine-feature-main {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "icon label"
      "icon title"
      "icon state";
    align-items: center;
    gap: 2px 12px;
    min-width: 0;
    min-height: 72px;
    border: 0;
    background: transparent;
  }

  .routine-feature-action,
  .routine-feature-state {
    align-self: center;
    min-width: 78px;
    padding: 0 12px;
    white-space: nowrap;
  }

  .routine-feature-state {
    display: inline-grid;
    place-items: center;
    min-height: 36px;
    border-radius: 8px;
    color: var(--secondary-text-color, #727272);
    background: color-mix(in srgb, var(--yd-surface-muted) 78%, transparent);
    font-size: 13px;
  }

  .routine-feature-main ha-icon,
  .environment-primary ha-icon,
  .environment-stat ha-icon,
  .media-art ha-icon,
  .compact-status ha-icon,
  .camera-feature ha-icon,
  .camera-thumb ha-icon,
  .security-feature ha-icon,
  .presence-person ha-icon {
    color: var(--yd-accent);
  }

  .routine-feature-main span,
  .environment-primary span {
    color: var(--yd-accent);
    font-size: 12px;
    font-weight: 700;
  }

  .routine-feature-main strong,
  .environment-primary strong {
    color: var(--primary-text-color, #212121);
    font-size: 18px;
    line-height: 1.15;
  }

  .routine-feature-main small,
  .environment-primary small {
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
    font-style: normal;
  }

  .device-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: color-mix(in srgb, var(--yd-surface-muted) 84%, transparent);
  }

  .device-row.muted,
  .environment-stat.muted {
    opacity: 0.68;
  }

  .environment-primary {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-height: 106px;
    padding: 14px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 11%, transparent), transparent 70%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .environment-stat {
    display: grid;
    align-content: center;
    justify-items: start;
    gap: 5px;
    padding: 10px;
    background: color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  .environment-stat strong {
    color: var(--primary-text-color, #212121);
    font-size: 18px;
    line-height: 1.1;
  }

  .environment-stat span {
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
  }

  .routine-feature-main strong,
  .routine-feature-main span,
  .routine-feature-main small,
  .environment-primary strong,
  .environment-primary span,
  .environment-primary small,
  .environment-stat strong,
  .environment-stat span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .media-feature,
  .camera-feature,
  .security-feature,
  .presence-person,
  .compact-status,
  .camera-thumb {
    display: grid;
    align-items: center;
    width: 100%;
    min-width: 0;
    text-align: left;
    cursor: pointer;
  }

  .media-feature {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    min-height: 112px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 12%, transparent), transparent 68%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .media-art {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--yd-accent) 10%, var(--yd-surface-muted));
  }

  .media-copy,
  .camera-copy,
  .security-feature span,
  .presence-person span,
  .compact-status span {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .media-copy > span,
  .security-feature small {
    color: var(--yd-accent);
    font-size: 12px;
    font-weight: 700;
  }

  .media-copy strong,
  .camera-copy strong,
  .security-feature strong,
  .presence-person strong,
  .compact-status strong,
  .camera-thumb span {
    min-width: 0;
    overflow: hidden;
    color: var(--primary-text-color, #212121);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .media-copy small,
  .camera-copy small,
  .security-feature em,
  .presence-person small,
  .compact-status small,
  .camera-thumb small {
    min-width: 0;
    overflow: hidden;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
    font-style: normal;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .media-list,
  .status-list,
  .camera-strip,
  .presence-people,
  .subtype-chips {
    display: grid;
    gap: 8px;
  }

  .media-list:empty {
    display: none;
  }

  .compact-status {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 10px;
    min-height: 56px;
    background: color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  .compact-status.muted {
    opacity: 0.68;
  }

  .subtype-chips {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .subtype-chips span {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--yd-border);
    border-radius: 999px;
    padding: 5px 7px;
    color: var(--secondary-text-color, #727272);
    background: color-mix(in srgb, var(--yd-surface-muted) 78%, transparent);
    font-size: 11px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .subtype-chips span.active {
    color: var(--yd-accent);
    border-color: color-mix(in srgb, var(--yd-accent) 35%, var(--yd-border));
    background: color-mix(in srgb, var(--yd-accent) 8%, var(--yd-surface-muted));
  }

  .camera-feature {
    grid-template-rows: minmax(112px, auto) auto;
    overflow: hidden;
    padding: 0;
    background: color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .camera-preview {
    display: grid;
    place-items: center;
    min-height: 112px;
    color: var(--yd-accent);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 15%, transparent), transparent 66%),
      color-mix(in srgb, var(--secondary-background-color, #f3f3f3) 78%, var(--yd-surface));
  }

  .camera-preview small {
    align-self: end;
    margin: 0 0 10px;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
  }

  .camera-copy {
    padding: 10px;
  }

  .camera-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .camera-wall-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .camera-thumb {
    grid-template-rows: auto minmax(0, 1fr) auto;
    justify-items: start;
    min-height: 92px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 8%, transparent), transparent 66%),
      color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  .camera-thumb.large {
    min-height: 112px;
  }

  .security-feature {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    min-height: 92px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 10%, transparent), transparent 70%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .security-feature.ok {
    --yd-accent: var(--success-color, #0f9d58);
  }

  .security-feature.warn {
    --yd-accent: var(--warning-color, #f29900);
  }

  .presence-people {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .presence-person {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 10px;
    min-height: 78px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 8%, transparent), transparent 68%),
      color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  @container (max-width: 420px) {
    .subtype-chips,
    .camera-strip,
    .camera-wall-grid,
    .presence-people {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;
