import { css } from "lit";

export const strategyEditorStyles = css`
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
  span {
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
  }

  select,
  input,
  textarea {
    min-height: 36px;
    min-width: 0;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 8px;
    padding: 0 10px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #212121);
    font: inherit;
  }

  textarea {
    min-height: 120px;
    padding-block: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    resize: vertical;
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

  button:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }

  .error {
    color: var(--error-color, #ba1a1a);
  }

  .success {
    color: var(--success-color, #0f9d58);
  }

  .notice {
    border-radius: 8px;
    padding: 8px 10px;
    color: var(--primary-text-color, #212121);
    background: color-mix(in srgb, var(--warning-color, #fbbc04) 16%, transparent);
    font-size: 13px;
  }

  .check-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px 12px;
  }

  .checkbox {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 8px;
  }

  .checkbox input {
    min-height: 18px;
    inline-size: 18px;
    padding: 0;
  }

  .inline-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`;
