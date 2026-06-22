import { css } from "lit";

export const cardEditorImageSourceStyles = css`
  .image-source-editor {
    display: grid;
    gap: 10px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 10px;
    background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 58%, transparent);
  }

  .image-source-head,
  .image-source-empty {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .image-source-head strong {
    color: var(--primary-text-color, #212121);
    font-size: 13px;
  }

  .image-source-list {
    display: grid;
    gap: 8px;
  }

  .image-source-row {
    display: grid;
    grid-template-columns: 74px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: stretch;
    min-width: 0;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 72%, transparent);
    border-radius: 8px;
    padding: 8px;
    background: var(--card-background-color, #fff);
  }

  .image-source-preview {
    display: grid;
    place-items: center;
    min-height: 70px;
    overflow: hidden;
    border-radius: 7px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 8%, var(--secondary-background-color, #f5f5f5));
  }

  .image-source-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-source-preview ha-icon {
    color: var(--secondary-text-color, #727272);
  }

  .image-source-fields {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.9fr);
    gap: 8px;
    min-width: 0;
  }

  .image-source-actions,
  .image-source-add {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-content: center;
    justify-content: end;
    min-width: 0;
  }

  .image-source-actions button {
    min-height: 32px;
    padding-inline: 9px;
  }

  .image-source-add {
    justify-content: stretch;
  }

  .image-source-add input {
    flex: 1 1 180px;
  }

  @media (max-width: 520px) {
    .image-source-row,
    .image-source-fields {
      grid-template-columns: 1fr;
    }
  }
`;
