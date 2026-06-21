import { css } from "lit";

export const dashboardCardProductStyles = css`
  .routine-hero-action {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "icon label"
      "icon title"
      "icon action";
    align-items: center;
    gap: 2px 12px;
    width: 100%;
    min-height: 104px;
    padding: 14px;
    text-align: left;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 12%, transparent), transparent 68%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .routine-hero-action ha-icon,
  .environment-primary ha-icon,
  .environment-stat ha-icon {
    color: var(--yd-accent);
  }

  .routine-hero-action span,
  .environment-primary span {
    color: var(--yd-accent);
    font-size: 12px;
    font-weight: 700;
  }

  .routine-hero-action strong,
  .environment-primary strong {
    color: var(--primary-text-color, #212121);
    font-size: 18px;
    line-height: 1.15;
  }

  .routine-hero-action small,
  .environment-primary small {
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
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

  .routine-hero-action strong,
  .routine-hero-action span,
  .routine-hero-action small,
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
`;
