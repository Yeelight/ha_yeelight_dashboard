import { html, type TemplateResult } from "lit";

import { localize, type TranslationKey } from "../i18n";
import type { DashboardLayoutOverride, DashboardLayoutOverrides, DashboardViewKey, HomeAssistant } from "../types";
import { VIEW_OPTIONS } from "./config";

export type LayoutOverrideDraft = DashboardLayoutOverride & {
  view: DashboardViewKey;
  key: string;
};

export type LayoutOverrideEditorCallbacks = {
  onViewChange: (view: DashboardViewKey) => void;
  onKeyChange: (key: string) => void;
  onFieldChange: (field: keyof DashboardLayoutOverride, value: string) => void;
  onPreset: (preset: DashboardLayoutOverride) => void;
  onUseExisting: (view: DashboardViewKey, key: string) => void;
  onApply: () => void;
  onRemove: () => void;
  onJsonChange: (value: string) => void;
  onImport: () => void;
  onClear: () => void;
};

export type LayoutOverrideStatus = {
  error: string;
  message: string;
};

const DEFAULT_LAYOUT_KEYS: Partial<Record<DashboardViewKey, string[]>> = {
  overview: ["overview.hero", "overview.status", "overview.lights", "overview.rooms", "overview.routines", "overview.notice", "overview.ecosystem", "overview.health"],
  lighting: ["lighting.overview", "lighting.status", "lighting.devices", "lighting.rooms", "lighting.native.light"],
  areas: ["areas.devices", "areas.devices_list", "areas.devices_universal", "areas.device_focus", "areas.rooms"],
  routines: ["routines.panel_actions", "routines.summary", "routines.quick", "routines.commands", "routines.scripts", "routines.automations"],
  environment: ["environment.summary", "environment.climate", "environment.air", "environment.power", "environment.energy", "environment.water"],
  media: ["media.hub", "media.players", "media.cameras", "media.camera_single", "media.camera_wall", "media.image_carousel"],
  health: ["health.ecosystem", "health.notices", "health.security", "health.presence", "health.infrastructure", "health.summary"]
};

const LAYOUT_PRESETS = [
  { key: "top", box: { x: 0, y: 0, w: 12, h: 4, z: 0 } },
  { key: "left", box: { x: 0, y: 0, w: 6, h: 4, z: 0 } },
  { key: "right", box: { x: 6, y: 0, w: 6, h: 4, z: 0 } },
  { key: "wide", box: { x: 0, y: 0, w: 12, h: 6, z: 0 } },
  { key: "compact", box: { x: 0, y: 0, w: 6, h: 3, z: 0 } }
] as const;

export function defaultLayoutDraft(view: DashboardViewKey = "overview"): LayoutOverrideDraft {
  return { view, key: defaultKeyForView(view), x: 0, y: 0, w: 12, h: 4, z: 0 };
}

export function draftFromOverrides(overrides: DashboardLayoutOverrides | undefined, current: LayoutOverrideDraft): LayoutOverrideDraft {
  const view = VIEW_OPTIONS.includes(current.view) ? current.view : "overview";
  const key = current.key.trim() || defaultKeyForView(view);
  const box = overrides?.[view]?.[key];
  return { ...defaultLayoutDraft(view), key, ...(box || current) };
}

export function defaultKeyForView(view: DashboardViewKey): string {
  return DEFAULT_LAYOUT_KEYS[view]?.[0] || "overview.hero";
}

export function parseLayoutOverrides(value: string): DashboardLayoutOverrides {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid layout overrides");
  }
  const object = parsed as Record<string, unknown>;
  if (object.layout_overrides && typeof object.layout_overrides === "object" && !Array.isArray(object.layout_overrides)) {
    return object.layout_overrides as DashboardLayoutOverrides;
  }
  const strategy = object.strategy as Record<string, unknown> | undefined;
  if (strategy?.layout_overrides && typeof strategy.layout_overrides === "object" && !Array.isArray(strategy.layout_overrides)) {
    return strategy.layout_overrides as DashboardLayoutOverrides;
  }
  return object as DashboardLayoutOverrides;
}

export function buildLayoutOverrides(overrides: DashboardLayoutOverrides | undefined, draft: LayoutOverrideDraft): DashboardLayoutOverrides | undefined {
  const key = draft.key.trim();
  if (!key) return undefined;
  return {
    ...(overrides || {}),
    [draft.view]: {
      ...(overrides?.[draft.view] || {}),
      [key]: {
        x: numberOrZero(draft.x),
        y: numberOrZero(draft.y),
        w: clampNumber(draft.w, 1, 24, 12),
        h: clampNumber(draft.h, 1, 24, 4),
        z: numberOrZero(draft.z)
      }
    }
  };
}

export function removeLayoutOverride(overrides: DashboardLayoutOverrides | undefined, draft: LayoutOverrideDraft): DashboardLayoutOverrides | undefined {
  const viewOverrides = { ...(overrides?.[draft.view] || {}) };
  delete viewOverrides[draft.key];
  const next: DashboardLayoutOverrides = { ...(overrides || {}) };
  if (Object.keys(viewOverrides).length) next[draft.view] = viewOverrides;
  else delete next[draft.view];
  return Object.keys(next).length ? next : undefined;
}

export function renderLayoutOverridesEditor(
  hass: HomeAssistant | undefined,
  overrides: DashboardLayoutOverrides | undefined,
  draft: LayoutOverrideDraft,
  status: LayoutOverrideStatus,
  callbacks: LayoutOverrideEditorCallbacks
): TemplateResult {
  const keys = keyOptions(overrides, draft.view, draft.key);
  const existing = existingOverrideKeys(overrides);
  const hasCurrentOverride = Boolean(overrides?.[draft.view]?.[draft.key]);
  return html`
    <fieldset>
      <legend>${localize(hass, "editor.strategy.layout_overrides")}</legend>
      <div class="layout-visual">
        <div class="layout-visual-head">
          <strong>${localize(hass, "editor.strategy.layout_visual")}</strong>
          <span>${localize(hass, "editor.strategy.layout_visual_help")}</span>
        </div>
        <div class="layout-grid">
          <label>
            <span>${localize(hass, "editor.strategy.layout_view")}</span>
            <select @change=${(event: Event) => callbacks.onViewChange((event.target as HTMLSelectElement).value as DashboardViewKey)}>
              ${VIEW_OPTIONS.map((view) => html`<option value=${view} ?selected=${view === draft.view}>${localize(hass, `editor.strategy.view.${view}` as TranslationKey)}</option>`)}
            </select>
          </label>
          <label>
            <span>${localize(hass, "editor.strategy.layout_card_key")}</span>
            <select @change=${(event: Event) => callbacks.onKeyChange((event.target as HTMLSelectElement).value)}>
              ${keys.map((key) => html`<option value=${key} ?selected=${key === draft.key}>${key}</option>`)}
            </select>
          </label>
          <label class="wide">
            <span>${localize(hass, "editor.strategy.layout_custom_key")}</span>
            <input .value=${draft.key} @input=${(event: Event) => callbacks.onKeyChange((event.target as HTMLInputElement).value)} />
          </label>
          ${layoutNumberField(hass, "x", draft.x, callbacks)}
          ${layoutNumberField(hass, "y", draft.y, callbacks)}
          ${layoutNumberField(hass, "w", draft.w, callbacks)}
          ${layoutNumberField(hass, "h", draft.h, callbacks)}
          ${layoutNumberField(hass, "z", draft.z, callbacks)}
        </div>
        <div class="layout-presets" aria-label=${localize(hass, "editor.strategy.layout_presets")}>
          <span>${localize(hass, "editor.strategy.layout_presets")}</span>
          <div>
            ${LAYOUT_PRESETS.map(
              (preset) => html`
                <button type="button" class=${isPresetActive(draft, preset.box) ? "active" : ""} @click=${() => callbacks.onPreset(preset.box)}>
                  ${localize(hass, `editor.strategy.layout_preset.${preset.key}` as TranslationKey)}
                </button>
              `
            )}
          </div>
        </div>
        ${renderFootprintPreview(hass, draft)}
        <div class="inline-actions">
          <button type="button" @click=${callbacks.onApply}>${localize(hass, "editor.strategy.apply_layout")}</button>
          <button type="button" ?disabled=${!hasCurrentOverride} @click=${callbacks.onRemove}>${localize(hass, "editor.strategy.remove_card_layout")}</button>
        </div>
        ${existing.length
          ? html`
              <div class="layout-existing">
                <span>${localize(hass, "editor.strategy.existing_layouts")}</span>
                <div>
                  ${existing.map(
                    (item) => html`
                      <button type="button" class=${item.view === draft.view && item.key === draft.key ? "active" : ""} @click=${() => callbacks.onUseExisting(item.view, item.key)}>
                        ${item.view} · ${item.key}
                      </button>
                    `
                  )}
                </div>
              </div>
            `
          : html`<span>${localize(hass, "editor.strategy.no_layouts")}</span>`}
      </div>
      <details>
        <summary>${localize(hass, "editor.strategy.advanced_json")}</summary>
        <label>
          <span>${localize(hass, "editor.strategy.managed_canvas_json")}</span>
          <textarea .value=${JSON.stringify(overrides || {}, null, 2)} @change=${(event: Event) => callbacks.onJsonChange((event.target as HTMLTextAreaElement).value)}></textarea>
        </label>
        <div class="inline-actions">
          <button type="button" @click=${callbacks.onImport}>${localize(hass, "editor.strategy.import_canvas_layout")}</button>
          <button type="button" @click=${callbacks.onClear}>${localize(hass, "editor.strategy.reset_layout")}</button>
        </div>
      </details>
      ${status.error ? html`<span class="error">${status.error}</span>` : status.message ? html`<span class="success">${status.message}</span>` : html`<span>${localize(hass, "editor.strategy.layout_help")}</span>`}
    </fieldset>
  `;
}

function renderFootprintPreview(hass: HomeAssistant | undefined, draft: LayoutOverrideDraft): TemplateResult {
  const x = clampNumber(draft.x, 0, 23, 0);
  const y = clampNumber(draft.y, 0, 23, 0);
  const w = clampNumber(draft.w, 1, 24, 12);
  const h = clampNumber(draft.h, 1, 24, 4);
  return html`
    <div class="layout-footprint" aria-label=${localize(hass, "editor.strategy.layout_preview")}>
      <div class="layout-footprint-head">
        <span>${localize(hass, "editor.strategy.layout_preview")}</span>
        <strong>${localize(hass, "editor.strategy.layout_preview_size", { x, y, w, h })}</strong>
      </div>
      <div class="layout-footprint-track" aria-hidden="true">
        <span style=${`--layout-x:${Math.min(x, 11)}; --layout-w:${Math.min(w, 12)}; --layout-h:${h}`}></span>
      </div>
    </div>
  `;
}

function layoutNumberField(
  hass: HomeAssistant | undefined,
  field: keyof DashboardLayoutOverride,
  value: number | undefined,
  callbacks: LayoutOverrideEditorCallbacks
): TemplateResult {
  return html`
    <label>
      <span>${localize(hass, `editor.strategy.layout_${field}` as TranslationKey)}</span>
      <input type="number" .value=${value === undefined ? "" : String(value)} @change=${(event: Event) => callbacks.onFieldChange(field, (event.target as HTMLInputElement).value)} />
    </label>
  `;
}

function keyOptions(overrides: DashboardLayoutOverrides | undefined, view: DashboardViewKey, currentKey: string): string[] {
  return uniqueStrings([...(DEFAULT_LAYOUT_KEYS[view] || []), ...Object.keys(overrides?.[view] || {}), currentKey]);
}

function existingOverrideKeys(overrides: DashboardLayoutOverrides | undefined): Array<{ view: DashboardViewKey; key: string }> {
  if (!overrides) return [];
  return VIEW_OPTIONS.flatMap((view) => Object.keys(overrides[view] || {}).map((key) => ({ view, key })));
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function isPresetActive(draft: LayoutOverrideDraft, preset: DashboardLayoutOverride): boolean {
  return draft.x === preset.x && draft.y === preset.y && draft.w === preset.w && draft.h === preset.h && draft.z === preset.z;
}

function numberOrZero(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : 0;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}
