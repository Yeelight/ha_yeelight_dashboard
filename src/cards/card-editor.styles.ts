import { css } from "lit";

export const cardEditorStyles = css`
  :host {
    display: block;
    color: var(--primary-text-color, #212121);
  }

  .editor {
    display: grid;
    gap: 14px;
  }

  fieldset,
  label {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  fieldset {
    margin: 0;
    padding: 12px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 8px;
  }

  legend,
  span,
  .hint,
  .entity-count {
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
  }

  .hint.warning {
    color: var(--warning-color, #8a5a00);
  }

  input,
  select,
  textarea {
    min-width: 0;
    min-height: 36px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 8px;
    padding: 0 10px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #212121);
    font: inherit;
  }

  textarea {
    min-height: 92px;
    padding-block: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    resize: vertical;
  }

  .checkbox {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 8px;
  }

  .checkbox input {
    inline-size: 18px;
    min-height: 18px;
    padding: 0;
  }

  .grid,
  .entity-tools {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
  }

  .preset-bar {
    display: grid;
    gap: 8px;
    margin-bottom: 10px;
  }

  .grid-preview {
    display: grid;
    gap: 8px;
    margin-bottom: 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 10px;
    background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 68%, transparent);
  }

  .grid-preview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .grid-preview-head strong {
    color: var(--primary-text-color, #212121);
    font-size: 13px;
  }

  .grid-preview-track {
    min-height: 46px;
    border-radius: 7px;
    padding: 4px;
    background-image: repeating-linear-gradient(
      to right,
      color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 62%, transparent) 0 1px,
      transparent 1px calc(100% / 12)
    );
    background-color: var(--card-background-color, #fff);
    overflow: hidden;
  }

  .grid-preview-track span {
    display: block;
    inline-size: calc((100% / 12) * var(--preview-columns));
    block-size: clamp(18px, calc(var(--preview-rows) * 5px), 60px);
    border-radius: 6px;
    background: linear-gradient(135deg, var(--primary-color, #03a9f4), color-mix(in srgb, var(--primary-color, #03a9f4) 44%, #fff));
    box-shadow: 0 6px 16px color-mix(in srgb, var(--primary-color, #03a9f4) 22%, transparent);
  }

  .preset-actions,
  .domain-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .domain-chips {
    align-items: center;
    margin-top: 2px;
    padding-bottom: 2px;
  }

  .domain-chips span {
    flex-basis: 100%;
  }

  .preset-actions button,
  .domain-chips button {
    min-height: 32px;
    padding-inline: 10px;
  }

  .preset-actions button.active,
  .domain-chips button.active {
    border-color: var(--primary-color, #03a9f4);
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, var(--card-background-color, #fff));
    color: var(--primary-color, #03a9f4);
    font-weight: 650;
  }

  .card-type-control {
    display: grid;
    gap: 8px;
  }

  .card-type-summary {
    display: grid;
    gap: 4px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 9px 10px;
    background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 74%, transparent);
  }

  .card-type-summary small {
    color: var(--secondary-text-color, #727272);
  }

  .card-type-summary button {
    justify-self: start;
    min-height: 32px;
  }

  .entity-picker {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 8px;
    align-items: end;
  }

  .entity-list {
    display: grid;
    gap: 6px;
  }

  .entity-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  .entity-list-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    gap: 6px;
  }

  .entity-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
    min-width: 0;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 8px 10px;
    background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 72%, transparent);
  }

  .entity-row.dragging {
    border-color: var(--primary-color, #03a9f4);
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 10%, var(--secondary-background-color, #f5f5f5));
  }

  .entity-row.missing {
    border-color: color-mix(in srgb, var(--warning-color, #8a5a00) 46%, var(--divider-color, rgba(0, 0, 0, 0.12)));
    background: color-mix(in srgb, var(--warning-color, #8a5a00) 8%, var(--secondary-background-color, #f5f5f5));
  }

  .entity-row strong,
  .entity-row small {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entity-row small {
    color: var(--secondary-text-color, #727272);
  }

  .entity-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    gap: 6px;
  }

  .entity-expand {
    justify-self: start;
    min-height: 32px;
  }

  .drag-button {
    inline-size: 36px;
    padding: 0;
    touch-action: none;
  }

  .drag-button ha-icon {
    display: block;
    inline-size: 20px;
    block-size: 20px;
    margin: auto;
    color: var(--secondary-text-color, #727272);
    pointer-events: none;
  }

  button {
    min-height: 36px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 8px;
    padding: 0 12px;
    background: var(--secondary-background-color, #f5f5f5);
    color: var(--primary-text-color, #212121);
    cursor: pointer;
    font: inherit;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.54;
  }

  .remove-button {
    color: var(--error-color, #ba1a1a);
    background: color-mix(in srgb, var(--error-color, #ba1a1a) 8%, transparent);
  }

  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  button:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }

  @media (max-width: 520px) {
    .entity-picker,
    .entity-row {
      grid-template-columns: 1fr;
    }

    .entity-actions {
      justify-content: start;
    }

    .entity-list-header {
      align-items: stretch;
      flex-direction: column;
    }

    .entity-list-actions {
      justify-content: start;
    }
  }
`;
