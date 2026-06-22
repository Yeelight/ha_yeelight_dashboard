import { css } from "lit";

export const dashboardCardComfortStyles = css`
  .comfort-board,
  .comfort-grid {
    display: grid;
    gap: 8px;
  }

  .comfort-feature {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: stretch;
    gap: 8px;
    min-width: 0;
    padding: 10px;
    border: 1px solid color-mix(in srgb, var(--yd-accent) 18%, var(--yd-border));
    border-radius: 8px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 11%, transparent), transparent 68%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .climate-feature,
  .water-feature {
    grid-template-columns: auto minmax(0, 1fr);
    width: 100%;
    min-height: 112px;
    text-align: left;
    cursor: pointer;
  }

  .comfort-main {
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

  .comfort-gauge {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 5px;
    width: 82px;
    min-height: 74px;
    border-radius: 8px;
    color: var(--yd-accent);
    background: color-mix(in srgb, var(--yd-accent) 10%, var(--yd-surface));
    border: 1px solid color-mix(in srgb, var(--yd-accent) 20%, transparent);
  }

  .comfort-gauge strong {
    max-width: 74px;
    overflow: hidden;
    color: var(--primary-text-color, #212121);
    font-size: 15px;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .comfort-copy {
    display: grid;
    align-content: center;
    gap: 4px;
    min-width: 0;
  }

  .comfort-copy small {
    color: var(--yd-accent);
    font-size: 12px;
    font-weight: 700;
  }

  .comfort-copy strong {
    color: var(--primary-text-color, #212121);
    font-size: 18px;
    line-height: 1.15;
  }

  .comfort-copy span {
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
  }

  .comfort-copy small,
  .comfort-copy strong,
  .comfort-copy span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .comfort-action {
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

  .comfort-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .comfort-reading {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "icon value"
      "icon label";
    align-items: center;
    gap: 2px 9px;
    min-width: 0;
    min-height: 66px;
    padding: 10px;
    border: 1px solid var(--yd-border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
    color: var(--primary-text-color, #212121);
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  .comfort-reading ha-icon {
    grid-area: icon;
    color: var(--yd-accent);
  }

  .comfort-reading strong {
    grid-area: value;
    color: var(--primary-text-color, #212121);
    font-size: 17px;
    line-height: 1.1;
  }

  .comfort-reading span {
    grid-area: label;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
  }

  .comfort-reading strong,
  .comfort-reading span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .comfort-reading.muted {
    opacity: 0.68;
  }

  @container (max-width: 420px) {
    .comfort-feature,
    .comfort-main,
    .climate-feature,
    .water-feature {
      grid-template-columns: minmax(0, 1fr);
    }

    .comfort-action {
      width: 100%;
    }

    .comfort-grid {
      grid-template-columns: 1fr;
    }
  }
`;
