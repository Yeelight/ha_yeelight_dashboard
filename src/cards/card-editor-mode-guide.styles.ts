import { css } from "lit";

export const cardEditorModeGuideStyles = css`
  .mode-guide {
    display: grid;
    gap: 10px;
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 28%, var(--divider-color, rgba(0, 0, 0, 0.12)));
    border-radius: 8px;
    padding: 10px;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--primary-color, #03a9f4) 9%, var(--card-background-color, #fff)),
      color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 68%, transparent)
    );
  }

  .mode-guide-head {
    display: grid;
    gap: 3px;
  }

  .mode-guide-head strong {
    color: var(--primary-text-color, #212121);
    font-size: 14px;
  }

  .mode-guide-head small {
    color: var(--secondary-text-color, #727272);
    line-height: 1.45;
  }

  .mode-guide-facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(138px, 1fr));
    gap: 8px;
  }

  .mode-guide-fact {
    display: grid;
    gap: 3px;
    min-width: 0;
    border-radius: 8px;
    padding: 8px;
    background: color-mix(in srgb, var(--card-background-color, #fff) 76%, transparent);
  }

  .mode-guide-fact strong {
    min-width: 0;
    overflow: hidden;
    color: var(--primary-text-color, #212121);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mode-guide-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mode-guide-entities {
    display: grid;
    gap: 8px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 9px;
    background: color-mix(in srgb, var(--card-background-color, #fff) 82%, transparent);
  }

  .mode-guide-entities-head {
    display: grid;
    gap: 2px;
  }

  .mode-guide-entities-head small {
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
    line-height: 1.45;
  }

  .mode-guide-entity-list {
    display: grid;
    gap: 6px;
  }

  .mode-guide-entity {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 8px;
    align-items: center;
    min-width: 0;
    border-radius: 8px;
    padding: 8px;
    background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 62%, transparent);
  }

  .mode-guide-entity div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .mode-guide-entity strong,
  .mode-guide-entity small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mode-guide-entity strong {
    color: var(--primary-text-color, #212121);
    font-size: 13px;
  }

  .mode-guide-entity small,
  .mode-guide-entity span {
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
  }

  .mode-guide-entity button {
    min-height: 32px;
    padding-inline: 10px;
  }

  @media (max-width: 520px) {
    .mode-guide-entity {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .mode-guide-entity span {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
`;
