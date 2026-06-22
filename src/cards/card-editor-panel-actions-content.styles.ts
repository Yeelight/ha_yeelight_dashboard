import { css } from "lit";

export const cardEditorPanelActionsContentStyles = css`
  .panel-action-content-editor {
    display: grid;
    gap: 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 10px;
    background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 58%, transparent);
  }

  .panel-action-content-head,
  .panel-action-content-empty {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .panel-action-content-head strong {
    color: var(--primary-text-color, #212121);
    font-size: 13px;
  }

  .panel-action-title {
    display: grid;
    gap: 6px;
  }

  .panel-action-content-list {
    display: grid;
    gap: 8px;
  }

  .panel-action-content-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: end;
    min-width: 0;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 8px;
    background: var(--card-background-color, #fff);
  }

  .panel-action-content-actions,
  .panel-action-content-add {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-content: center;
    justify-content: end;
    min-width: 0;
  }

  .panel-action-content-actions button {
    min-height: 32px;
    padding-inline: 9px;
  }

  .panel-action-content-add {
    justify-content: stretch;
  }

  .panel-action-content-add input {
    flex: 1 1 220px;
  }

  @media (max-width: 520px) {
    .panel-action-content-row {
      grid-template-columns: 1fr;
    }

    .panel-action-content-actions {
      justify-content: start;
    }
  }
`;
