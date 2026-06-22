import { css } from "lit";

export const cardEditorDisplayPresetStyles = css`
  .display-presets {
    display: grid;
    gap: 10px;
    margin-bottom: 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 10px;
    background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 64%, transparent);
  }

  .display-presets-head {
    display: grid;
    gap: 3px;
  }

  .display-presets-head strong {
    color: var(--primary-text-color, #212121);
    font-size: 13px;
  }

  .display-presets-head span {
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
  }

  .display-preset-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
    gap: 8px;
  }

  .display-preset {
    display: grid;
    align-content: start;
    gap: 8px;
    min-height: 168px;
    padding: 10px;
    text-align: start;
    background: var(--card-background-color, #fff);
  }

  .display-preset.active {
    border-color: var(--primary-color, #03a9f4);
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 10%, var(--card-background-color, #fff));
    box-shadow: inset 3px 0 0 var(--primary-color, #03a9f4);
  }

  .display-preset-title {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  .display-preset-title strong,
  .display-preset-title span,
  .display-preset-desc,
  .display-preset-fact span,
  .display-preset-fact strong {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .display-preset-title strong {
    color: var(--primary-text-color, #212121);
    font-size: 13px;
  }

  .display-preset-title span {
    color: var(--primary-color, #03a9f4);
    font-size: 11px;
    font-weight: 650;
  }

  .display-preset-desc {
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
    line-height: 1.35;
  }

  .display-preset-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .display-preset-fact {
    display: grid;
    gap: 2px;
    min-width: 0;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 62%, transparent);
    border-radius: 7px;
    padding: 6px;
    background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 58%, transparent);
  }

  .display-preset-fact span {
    color: var(--secondary-text-color, #727272);
    font-size: 10px;
  }

  .display-preset-fact strong {
    color: var(--primary-text-color, #212121);
    font-size: 12px;
  }

  @media (max-width: 520px) {
    .display-preset-options,
    .display-preset-facts {
      grid-template-columns: 1fr;
    }

    .display-preset {
      min-height: 0;
    }
  }
`;
