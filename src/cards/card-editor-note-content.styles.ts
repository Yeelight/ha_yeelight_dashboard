import { css } from "lit";

export const cardEditorNoteContentStyles = css`
  .note-content-editor {
    display: grid;
    gap: 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 10px;
    background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 58%, transparent);
  }

  .note-content-head,
  .note-content-empty {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .note-content-head strong {
    color: var(--primary-text-color, #212121);
    font-size: 13px;
  }

  .note-content-title {
    display: grid;
    gap: 6px;
  }

  .note-content-list {
    display: grid;
    gap: 8px;
  }

  .note-content-row {
    display: grid;
    grid-template-columns: minmax(110px, 0.35fr) minmax(0, 1fr) auto;
    gap: 8px;
    align-items: end;
    min-width: 0;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 8px;
    background: var(--card-background-color, #fff);
  }

  .note-content-actions,
  .note-content-add {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-content: center;
    justify-content: end;
    min-width: 0;
  }

  .note-content-actions button {
    min-height: 32px;
    padding-inline: 9px;
  }

  .note-content-add {
    justify-content: stretch;
  }

  .note-content-add select {
    flex: 0 1 150px;
  }

  .note-content-add input {
    flex: 1 1 220px;
  }

  @media (max-width: 520px) {
    .note-content-row {
      grid-template-columns: 1fr;
    }

    .note-content-actions {
      justify-content: start;
    }
  }
`;
