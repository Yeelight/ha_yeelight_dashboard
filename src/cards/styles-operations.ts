import { css } from "lit";

export const dashboardCardOperationsStyles = css`
  .ops-board,
  .ops-grid {
    display: grid;
    gap: 8px;
  }

  .ops-feature {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: stretch;
    gap: 8px;
    min-width: 0;
    padding: 10px;
    border: 1px solid color-mix(in srgb, var(--yd-accent) 18%, var(--yd-border));
    border-radius: 8px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 10%, transparent), transparent 70%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .energy-feature,
  .infrastructure-feature {
    grid-template-columns: auto minmax(0, 1fr);
    width: 100%;
    min-height: 98px;
    text-align: left;
    cursor: pointer;
  }

  .ops-main {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  .ops-icon {
    display: grid;
    place-items: center;
    width: 52px;
    min-height: 52px;
    border-radius: 8px;
    color: var(--yd-accent);
    background: color-mix(in srgb, var(--yd-accent) 10%, var(--yd-surface));
    border: 1px solid color-mix(in srgb, var(--yd-accent) 20%, transparent);
  }

  .ops-copy {
    display: grid;
    align-content: center;
    gap: 4px;
    min-width: 0;
  }

  .ops-copy small {
    color: var(--yd-accent);
    font-size: 12px;
    font-weight: 700;
  }

  .ops-copy strong {
    color: var(--primary-text-color, #212121);
    font-size: 17px;
    line-height: 1.15;
  }

  .ops-copy span {
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
  }

  .ops-copy small,
  .ops-copy strong,
  .ops-copy span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ops-action {
    align-self: center;
    min-height: 36px;
    border: 1px solid color-mix(in srgb, var(--yd-accent) 28%, var(--yd-border));
    border-radius: 8px;
    padding: 0 12px;
    background: color-mix(in srgb, var(--yd-accent) 9%, var(--yd-surface));
    color: var(--yd-accent);
    cursor: pointer;
    font: inherit;
    font-weight: 650;
    white-space: nowrap;
  }

  .ops-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ops-insights {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .ops-insights span,
  .ops-insight-link {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "icon value"
      "icon label";
    align-items: center;
    gap: 2px 8px;
    min-width: 0;
    min-height: 62px;
    padding: 10px;
    border: 1px solid var(--yd-border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
    color: inherit;
    font: inherit;
  }

  .ops-insights ha-icon {
    grid-area: icon;
    color: var(--yd-accent);
  }

  .ops-insights strong {
    grid-area: value;
    min-width: 0;
    overflow: hidden;
    color: var(--primary-text-color, #212121);
    font-size: 17px;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ops-insights small {
    grid-area: label;
    min-width: 0;
    overflow: hidden;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ops-insights .ok ha-icon {
    color: var(--success-color, #0f9d58);
  }

  .ops-insights .warn ha-icon {
    color: var(--warning-color, #f29900);
  }

  .ops-reading {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "icon value"
      "icon label";
    align-items: center;
    gap: 2px 9px;
    min-width: 0;
    min-height: 62px;
    padding: 10px;
    border: 1px solid var(--yd-border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
    color: var(--primary-text-color, #212121);
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  .ops-reading ha-icon {
    grid-area: icon;
    color: var(--yd-accent);
  }

  .ops-reading strong {
    grid-area: value;
    color: var(--primary-text-color, #212121);
    font-size: 16px;
    line-height: 1.1;
  }

  .ops-reading span {
    grid-area: label;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
  }

  .ops-reading strong,
  .ops-reading span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ops-reading.muted {
    opacity: 0.68;
  }

  @container (max-width: 420px) {
    .ops-feature,
    .ops-main,
    .energy-feature,
    .infrastructure-feature {
      grid-template-columns: minmax(0, 1fr);
    }

    .ops-action {
      width: 100%;
    }

    .ops-grid {
      grid-template-columns: 1fr;
    }

    .ops-insights {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;
