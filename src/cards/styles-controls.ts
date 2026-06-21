import { css } from "lit";

export const dashboardCardControlStyles = css`
  .icon-button,
  .tile-icon,
  .chip-action,
  .action-tile,
  .text-action,
  .primary-action {
    min-height: 36px;
    border: 1px solid color-mix(in srgb, var(--yd-border) 80%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--yd-surface-muted) 82%, var(--yd-surface));
    color: var(--primary-text-color, #212121);
    cursor: pointer;
    font: inherit;
    transition:
      border-color 120ms ease,
      background 120ms ease,
      transform 120ms ease;
  }

  .icon-button {
    display: grid;
    place-items: center;
    width: 36px;
    padding: 0;
  }

  .tile-icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
  }

  .text-action,
  .chip-action,
  .primary-action {
    padding: 0 12px;
    white-space: nowrap;
  }

  .chip-action {
    grid-column: 1 / -1;
    justify-self: stretch;
  }

  .primary-action {
    color: var(--yd-accent);
    background: color-mix(in srgb, var(--yd-accent) 10%, transparent);
    border-color: color-mix(in srgb, var(--yd-accent) 24%, var(--yd-border));
    font-weight: 650;
  }

  .variant-panel .icon-button,
  .variant-panel .tile-icon,
  .variant-panel .chip-action,
  .variant-panel .text-action,
  .variant-panel .primary-action {
    min-height: 42px;
  }

  .icon-button:hover,
  .tile-icon:hover,
  .chip-action:hover,
  .text-action:hover,
  .primary-action:hover {
    border-color: color-mix(in srgb, var(--yd-accent) 34%, var(--yd-border));
    background: color-mix(in srgb, var(--yd-accent) 8%, var(--yd-surface));
    transform: translateY(-1px);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  button:focus-visible {
    outline: 2px solid var(--yd-accent);
    outline-offset: 2px;
  }

  .feedback {
    border-radius: 8px;
    padding: 8px 10px;
    color: var(--error-color, #db4437);
    background: color-mix(in srgb, var(--error-color, #db4437) 10%, transparent);
    font-size: 13px;
  }

  @container (max-width: 460px) {
    .header,
    .entity-row {
      grid-template-columns: minmax(0, 1fr);
    }

    .area-strip,
    .room-grid,
    .tile-grid,
    .quick-grid,
    .status-groups,
    .compact-strip {
      grid-template-columns: 1fr;
    }

    .icon-button,
    .tile-icon,
    .chip-action,
    .text-action,
    .primary-action {
      width: 100%;
    }
  }
`;
