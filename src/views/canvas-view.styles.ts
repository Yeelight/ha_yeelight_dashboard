import { css } from "lit";

export const canvasViewStyles = css`
  :host {
    display: block;
    min-width: 0;
    container-type: inline-size;
  }

  .canvas {
    display: grid;
    grid-template-columns: repeat(var(--yeelight-canvas-columns, 12), minmax(0, 1fr));
    grid-auto-rows: var(--yeelight-canvas-row-height, 72px);
    gap: var(--yeelight-canvas-gap, 12px);
    align-items: stretch;
    padding: var(--yeelight-canvas-padding, 0);
    position: relative;
  }

  .slot {
    position: relative;
    min-width: 0;
    min-height: 0;
    border-radius: var(--ha-card-border-radius, 8px);
  }

  .slot > :not(.slot-toolbar) {
    display: block;
    height: 100%;
  }

  .slot.editing {
    outline: 1px dashed color-mix(in srgb, var(--primary-color, #03a9f4) 46%, transparent);
    outline-offset: 2px;
  }

  .slot.active {
    outline-style: solid;
    outline-width: 2px;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary-color, #03a9f4) 12%, transparent);
  }

  .slot.dragging {
    opacity: 0.9;
  }

  .slot-toolbar {
    position: absolute;
    inset-block-start: -10px;
    inset-inline-end: 8px;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 70%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--ha-card-background, #fff) 94%, transparent);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    opacity: 0.84;
    pointer-events: auto;
    transition: opacity 120ms ease;
  }

  .slot.editing:hover .slot-toolbar,
  .slot.active .slot-toolbar,
  .slot.dragging .slot-toolbar {
    opacity: 1;
  }

  .drag-handle,
  .resize-handle {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 7px;
    background: color-mix(in srgb, var(--secondary-background-color, #f5f5f5) 86%, var(--ha-card-background, #fff));
    color: var(--primary-text-color, #212121);
    cursor: grab;
    touch-action: none;
  }

  .resize-handle {
    cursor: nwse-resize;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .slot-key {
    max-width: min(22cqw, 180px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-inline: 4px 8px;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
    font-weight: 650;
  }

  .studio {
    display: grid;
    gap: 8px;
    margin-block-end: 12px;
    padding: 10px 12px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: var(--ha-card-border-radius, 8px);
    background: color-mix(in srgb, var(--card-background-color, #fff) 92%, var(--secondary-background-color, #f5f5f5));
  }

  .studio-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
  }

  .studio-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--primary-text-color, #212121);
    font-weight: 700;
  }

  details {
    display: grid;
    gap: 8px;
  }

  summary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    color: var(--primary-color, #03a9f4);
    cursor: pointer;
    font-size: 12px;
    font-weight: 650;
  }

  .studio-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .studio-copy {
    display: grid;
    place-items: center;
    width: 32px;
    min-width: 32px;
    height: 32px;
    min-height: 32px;
    border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 70%, transparent);
    border-radius: 8px;
    background: var(--card-background-color, #fff);
    color: var(--primary-color, #03a9f4);
    cursor: pointer;
  }

  .studio-feedback {
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
  }

  .studio-grid {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) repeat(5, minmax(54px, 72px));
    gap: 8px;
    align-items: end;
  }

  label {
    display: grid;
    gap: 4px;
    min-width: 0;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
  }

  select,
  input,
  textarea {
    min-height: 34px;
    min-width: 0;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 8px;
    padding: 0 8px;
    background: var(--secondary-background-color, #f5f5f5);
    color: var(--primary-text-color, #212121);
    font: inherit;
  }

  textarea {
    min-height: 96px;
    padding-block: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    resize: vertical;
  }

  .empty {
    color: var(--secondary-text-color, #727272);
    padding: 16px;
  }

  @container (max-width: 720px) {
    .canvas {
      display: grid;
      grid-template-columns: 1fr;
      grid-auto-rows: auto;
    }

    .slot {
      grid-column: 1 / -1 !important;
      grid-row: auto !important;
      min-height: 0;
    }

    .studio {
      display: none;
    }
  }
`;
