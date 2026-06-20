import { LitElement, css, html, type TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";

import type { HomeAssistant, LovelaceCardConfig, LovelaceViewConfig } from "../types";
import type { CanvasLayoutBox } from "../layout/layout-types";
import { layoutFromPointerDelta, normalizeCanvasBox, type CanvasGridMetrics, type CanvasPointerMode } from "../layout/canvas-pointer";

export const CANVAS_VIEW_TAG = "yeelight-dashboard-canvas-view";

type LovelaceCardElement = HTMLElement & {
  getCardSize?: () => number;
};

type CanvasLayoutEntry = CanvasLayoutBox & {
  key: string;
};

type ActivePointer = {
  pointerId: number;
  key: string;
  mode: CanvasPointerMode;
  startX: number;
  startY: number;
  origin: CanvasLayoutEntry;
  metrics: CanvasGridMetrics;
};

export class YeelightDashboardCanvasView extends LitElement {
  static override properties = {
    cards: { attribute: false },
    badges: { attribute: false },
    hass: { attribute: false },
    lovelace: { attribute: false },
    index: { attribute: false }
  };

  static override styles = css`
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

  cards?: LovelaceCardElement[];
  badges?: HTMLElement[];
  hass?: HomeAssistant;
  lovelace?: unknown;
  index?: number;

  private config: LovelaceViewConfig = { title: "Yeelight Canvas", path: "yeelight-canvas", cards: [] };
  private activeKey = "";
  private pointer?: ActivePointer;
  private studioFeedback = "";

  setConfig(config: LovelaceViewConfig): void {
    this.config = { ...config, cards: Array.isArray(config.cards) ? config.cards : [] };
    this.requestUpdate();
  }

  protected override render(): TemplateResult {
    const cards = this.cards || [];
    if (!cards.length) {
      return html`<div class="empty">No matching cards yet.</div>`;
    }
    return html`
      ${this.layoutStudioEnabled() ? this.renderLayoutStudio() : ""}
      <div class="canvas" style=${styleMap(this.config.style || {})}>${cards.map((card, index) => this.renderCard(card, index))}</div>
    `;
  }

  private renderCard(card: LovelaceCardElement, index: number): TemplateResult {
    const layout = this.layoutFor(index);
    const editing = this.layoutStudioEnabled();
    const active = this.activeKey === layout.key;
    return html`
      <div
        class=${`slot ${editing ? "editing" : ""} ${active ? "active" : ""} ${this.pointer?.key === layout.key ? "dragging" : ""}`}
        style=${styleMap(slotStyle(layout))}
        data-layout-key=${layout.key}
        @click=${() => this.selectLayout(layout.key)}
      >
        ${card} ${editing ? this.renderSlotToolbar(layout) : ""}
      </div>
    `;
  }

  private layoutFor(index: number): CanvasLayoutEntry {
    return this.layoutEntryFor(index);
  }

  private layoutEntryFor(index: number): CanvasLayoutEntry {
    const config = this.config.cards?.[index];
    return readViewLayout(config) || fallbackLayout(config, index);
  }

  private renderLayoutStudio(): TemplateResult {
    const layouts = (this.config.cards || []).map((_, index) => this.layoutEntryFor(index));
    const current = layouts.find((layout) => layout.key === this.activeKey) || layouts[0];
    if (!current) return html``;
    return html`
      <div class="studio">
        <div class="studio-head">
          <span class="studio-title"><ha-icon icon="mdi:gesture-tap-button"></ha-icon>Layout Studio</span>
          <span class="studio-actions">
            ${this.studioFeedback ? html`<span class="studio-feedback">${this.studioFeedback}</span>` : ""}
            <button class="studio-copy" title="Copy layout overrides" aria-label="Copy layout overrides" @click=${this.copyOverrides}>
              <ha-icon icon="mdi:content-copy"></ha-icon>
            </button>
          </span>
        </div>
        <div class="studio-grid">
          <label>
            Card
            <select @change=${(event: Event) => this.selectLayout((event.target as HTMLSelectElement).value)}>
              ${layouts.map((layout) => html`<option value=${layout.key} ?selected=${layout.key === current.key}>${layout.key}</option>`)}
            </select>
          </label>
          ${(["x", "y", "w", "h", "z"] as const).map(
            (key) => html`
              <label>
                ${key}
                <input
                  type="number"
                  .value=${String(current[key] ?? 0)}
                  @change=${(event: Event) => this.updateLayout(current.key, key, (event.target as HTMLInputElement).value)}
                />
              </label>
            `
          )}
        </div>
        <details>
          <summary><ha-icon icon="mdi:code-json"></ha-icon>Overrides</summary>
          <textarea readonly .value=${JSON.stringify({ [this.config.path]: this.layoutOverrides() }, null, 2)}></textarea>
        </details>
      </div>
    `;
  }

  private renderSlotToolbar(layout: CanvasLayoutEntry): TemplateResult {
    return html`
      <div class="slot-toolbar" aria-label="Layout controls">
        <button
          class="drag-handle"
          title="Move card"
          aria-label="Move card"
          @pointerdown=${(event: PointerEvent) => this.startPointerEdit(event, layout.key, "move")}
        >
          <ha-icon icon="mdi:drag"></ha-icon>
        </button>
        <span class="slot-key">${layout.key}</span>
        <button
          class="resize-handle"
          title="Resize card"
          aria-label="Resize card"
          @pointerdown=${(event: PointerEvent) => this.startPointerEdit(event, layout.key, "resize")}
        >
          <ha-icon icon="mdi:arrow-bottom-right"></ha-icon>
        </button>
      </div>
    `;
  }

  private layoutStudioEnabled(): boolean {
    const lovelace = this.lovelace as { editMode?: unknown } | undefined;
    return Boolean(lovelace?.editMode || this.config.layout_studio);
  }

  private selectLayout(key: string): void {
    this.activeKey = key;
    this.requestUpdate();
  }

  private updateLayout(key: string, field: keyof CanvasLayoutBox, value: string): void {
    const number = Math.round(Number(value));
    if (!Number.isFinite(number)) return;
    this.commitLayout(key, { ...this.layoutEntryByKey(key), [field]: number, key });
  }

  private layoutOverrides(): Record<string, CanvasLayoutBox> {
    const overrides: Record<string, CanvasLayoutBox> = {};
    for (const card of this.config.cards || []) {
      const layout = readViewLayout(card);
      if (layout) overrides[layout.key] = { x: layout.x, y: layout.y, w: layout.w, h: layout.h, z: layout.z };
    }
    return overrides;
  }

  private startPointerEdit(event: PointerEvent, key: string, mode: CanvasPointerMode): void {
    if (event.button !== 0) return;
    const origin = this.layoutEntryByKey(key);
    const canvas = this.shadowRoot?.querySelector<HTMLElement>(".canvas");
    if (!canvas) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.activeKey = key;
    this.pointer = {
      pointerId: event.pointerId,
      key,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      origin,
      metrics: gridMetrics(canvas)
    };
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.finishPointerEdit);
    window.addEventListener("pointercancel", this.finishPointerEdit);
    this.requestUpdate();
  }

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.pointer || event.pointerId !== this.pointer.pointerId) return;
    event.preventDefault();
    const next = layoutFromPointerDelta(
      this.pointer.origin,
      event.clientX - this.pointer.startX,
      event.clientY - this.pointer.startY,
      this.pointer.metrics,
      this.pointer.mode
    );
    this.commitLayout(this.pointer.key, { ...next, key: this.pointer.key });
  };

  private finishPointerEdit = (event: PointerEvent): void => {
    if (!this.pointer || event.pointerId !== this.pointer.pointerId) return;
    this.pointer = undefined;
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.finishPointerEdit);
    window.removeEventListener("pointercancel", this.finishPointerEdit);
    this.requestUpdate();
  };

  private layoutEntryByKey(key: string): CanvasLayoutEntry {
    const layouts = (this.config.cards || []).map((_, index) => this.layoutEntryFor(index));
    return layouts.find((layout) => layout.key === key) || layouts[0] || { key, x: 0, y: 0, w: 1, h: 1 };
  }

  private commitLayout(key: string, next: CanvasLayoutEntry): void {
    const columns = this.canvasColumns();
    const normalized = { ...normalizeCanvasBox(next, columns), key };
    const cards = (this.config.cards || []).map((card, index) => {
      const layout = this.layoutEntryFor(index);
      if (layout.key !== key) return card;
      return {
        ...card,
        view_layout: normalized
      };
    });
    this.config = { ...this.config, cards };
    this.activeKey = key;
    this.dispatchLayoutChange(key);
    this.requestUpdate();
  }

  private dispatchLayoutChange(key: string): void {
    this.dispatchEvent(
      new CustomEvent("yeelight-layout-overrides-changed", {
        bubbles: true,
        composed: true,
        detail: { view: this.config.path, key, override: this.layoutOverrides()[key], overrides: this.layoutOverrides() }
      })
    );
  }

  private copyOverrides = async (): Promise<void> => {
    const payload = JSON.stringify({ [this.config.path]: this.layoutOverrides() }, null, 2);
    try {
      await navigator.clipboard?.writeText(payload);
      this.studioFeedback = "Copied";
    } catch {
      this.studioFeedback = payload;
    }
    this.requestUpdate();
  };

  private canvasColumns(): number {
    const value = this.config.style?.["--yeelight-canvas-columns"];
    return clampInt(value, 1, 24, 12);
  }
}

function readViewLayout(card: LovelaceCardConfig | undefined): CanvasLayoutEntry | undefined {
  const layout = card?.view_layout;
  if (!layout || typeof layout !== "object") return undefined;
  const candidate = layout as Partial<CanvasLayoutEntry>;
  const key = typeof candidate.key === "string" && candidate.key.trim() ? candidate.key.trim() : "";
  const x = toFinite(candidate.x);
  const y = toFinite(candidate.y);
  const w = toFinite(candidate.w);
  const h = toFinite(candidate.h);
  if (x === undefined || y === undefined || w === undefined || h === undefined) return undefined;
  return { key, x, y, w, h, z: toFinite(candidate.z) };
}

function fallbackLayout(card: LovelaceCardConfig | undefined, index: number): CanvasLayoutEntry {
  const options = card?.grid_options as { columns?: unknown; rows?: unknown } | undefined;
  const w = clampInt(options?.columns, 2, 12, 6);
  const h = clampInt(options?.rows, 1, 12, 2);
  return { key: `card.${index}`, x: 0, y: index * h, w, h };
}

function slotStyle(layout: CanvasLayoutBox): Record<string, string> {
  return {
    gridColumn: `${Math.floor(layout.x) + 1} / span ${Math.max(1, Math.floor(layout.w))}`,
    gridRow: `${Math.floor(layout.y) + 1} / span ${Math.max(1, Math.floor(layout.h))}`,
    zIndex: String(Math.floor(layout.z ?? 0))
  };
}

function gridMetrics(canvas: HTMLElement): CanvasGridMetrics {
  const styles = getComputedStyle(canvas);
  const columns = readGridColumnCount(styles);
  const rowHeight = parseFloat(styles.getPropertyValue("grid-auto-rows")) || 72;
  const gap = parseFloat(styles.columnGap || styles.gap) || 12;
  const width = canvas.getBoundingClientRect().width;
  const columnWidth = columns > 0 ? (width - gap * Math.max(0, columns - 1)) / columns : width;
  return { columns: Math.max(1, columns), columnWidth, rowHeight, gap };
}

function readGridColumnCount(styles: CSSStyleDeclaration): number {
  const customColumns = Number(styles.getPropertyValue("--yeelight-canvas-columns"));
  if (Number.isFinite(customColumns) && customColumns > 0) return Math.floor(customColumns);
  const trimmed = styles.getPropertyValue("grid-template-columns").trim();
  if (!trimmed || trimmed === "none") return 12;
  const repeat = trimmed.match(/^repeat\((\d+),/);
  if (repeat) return Number(repeat[1]);
  return trimmed.split(/\s+/).length;
}

function toFinite(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
