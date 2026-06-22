import { css } from "lit";

export const strategyEditorStyles = css`
  :host {
    display: block;
    container-type: inline-size;
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

  button.active {
    border-color: var(--primary-color, #03a9f4);
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 14%, var(--secondary-background-color, #f5f5f5));
  }

  button:disabled {
    cursor: default;
    opacity: 0.5;
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

  .profile-presets {
    gap: 10px;
  }

  .profile-presets-hint {
    margin: 0;
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
    line-height: 1.45;
  }

  .profile-preset-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .profile-preset {
    display: grid;
    gap: 10px;
    min-height: 0;
    padding: 12px;
    text-align: start;
  }

  .profile-preset-head {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .profile-preset-head strong {
    color: var(--primary-text-color, #212121);
    font-size: 15px;
  }

  .profile-preset-head span {
    line-height: 1.45;
  }

  .profile-preset-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .profile-preset-fact {
    display: grid;
    gap: 2px;
    min-width: 0;
    border-radius: 6px;
    padding: 7px 8px;
    background: color-mix(in srgb, var(--card-background-color, #fff) 76%, var(--secondary-background-color, #f5f5f5));
  }

  .profile-preset-fact strong {
    overflow: hidden;
    color: var(--primary-text-color, #212121);
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-preset-action {
    justify-self: start;
    border-radius: 999px;
    padding: 4px 8px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 10%, transparent);
    color: var(--primary-text-color, #212121);
    font-size: 12px;
  }

  .layout-visual {
    display: grid;
    gap: 12px;
  }

  .layout-visual-head {
    display: grid;
    gap: 4px;
  }

  .layout-visual-head strong {
    color: var(--primary-text-color, #212121);
    font-size: 14px;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(64px, 1fr));
    gap: 10px;
  }

  .layout-grid label {
    gap: 4px;
  }

  .layout-grid .wide {
    grid-column: span 3;
  }

  .layout-presets,
  .layout-footprint {
    display: grid;
    gap: 8px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 10px;
    background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 58%, transparent);
  }

  .layout-presets div {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .layout-footprint-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
  }

  .layout-footprint-head strong {
    overflow: hidden;
    color: var(--primary-text-color, #212121);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .layout-footprint-track {
    min-height: 44px;
    border-radius: 8px;
    padding: 4px;
    background-color: var(--card-background-color, #fff);
    background-image: repeating-linear-gradient(
      to right,
      color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 62%, transparent) 0 1px,
      transparent 1px calc(100% / 12)
    );
    overflow: hidden;
  }

  .layout-footprint-track span {
    display: block;
    margin-inline-start: calc((100% / 12) * var(--layout-x));
    inline-size: calc((100% / 12) * var(--layout-w));
    block-size: clamp(18px, calc(var(--layout-h) * 7px), 92px);
    border-radius: 7px;
    background: linear-gradient(135deg, var(--primary-color, #03a9f4), color-mix(in srgb, var(--primary-color, #03a9f4) 42%, #fff));
    box-shadow: 0 6px 16px color-mix(in srgb, var(--primary-color, #03a9f4) 20%, transparent);
  }

  .layout-existing {
    display: grid;
    gap: 8px;
  }

  .layout-existing div {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  details {
    display: grid;
    gap: 10px;
  }

  summary {
    cursor: pointer;
    color: var(--primary-text-color, #212121);
    font-size: 13px;
  }

  @container (max-width: 520px) {
    .profile-preset-grid,
    .profile-preset-facts {
      grid-template-columns: 1fr;
    }

    .layout-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .layout-grid .wide {
      grid-column: 1 / -1;
    }
  }
`;
