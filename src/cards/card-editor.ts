import { LitElement, html, type TemplateResult } from "lit";
import { live } from "lit/directives/live.js";

import { localize, type TranslationKey } from "../i18n";
import { renderSelectedEntities } from "./card-editor-entities";
import { loadCardEditorHaComponents, renderContentForm, renderLayoutForm, renderVisibilityForm } from "./card-editor-form";
import { DISPLAY_PRESETS, GRID_SIZE_PRESETS, displayPresetPatch, isDisplayPresetActive, recommendedCardSetupPatch } from "./card-editor-presets";
import { cardEditorStyles } from "./card-editor.styles";
import { normalizeDashboardCardConfig } from "./config";
import { buildEntityOptions, defaultDomainForCard, filterEntityOptions, recommendedDomainsForCard, type EntityPickerResult } from "./entity-picker";
import { gridOptionsForConfig, kindFromCardType } from "./grid-options";
import { syncSelectValues } from "./select-sync";
import type { DashboardCardConfig, HomeAssistant } from "./types";

const SELECTED_ENTITY_COLLAPSED_LIMIT = 5;

export class YeelightDashboardCardEditor extends LitElement {
  static override styles = cardEditorStyles;

  private config = normalizeDashboardCardConfig({ type: "custom:yeelight-dashboard-hero-card" });
  private _hass?: HomeAssistant;
  private entitySearch = "";
  private entityDomainFilter: string | undefined;
  private draggingEntityId: string | undefined;
  private selectedEntitiesExpanded = false;

  override connectedCallback(): void {
    super.connectedCallback();
    loadCardEditorHaComponents();
  }

  setConfig(config: DashboardCardConfig): void {
    this.config = normalizeDashboardCardConfig(config);
    this.requestUpdate();
  }

  set hass(value: HomeAssistant | undefined) {
    this._hass = value;
    this.requestUpdate();
  }

  protected override render(): TemplateResult {
    const entityOptions = buildEntityOptions(this._hass, this.config);
    const entityDomain = this.activeEntityDomain(entityOptions);
    const pickerResult = filterEntityOptions(entityOptions, {
      query: this.entitySearch,
      domain: entityDomain,
      selected: this.config.entities
    });
    return html`
      <div class="editor">
        <fieldset>
          <legend>${localize(this._hass, "editor.card.content")}</legend>
          ${renderContentForm(this._hass, this.config, this.commitPatch, this.applyRecommendedCardSetup)}
          ${entityOptions.length ? this.renderEntityPicker(pickerResult, entityDomain) : ""}
          ${renderSelectedEntities(this._hass, this.config.entities, entityOptions, this.draggingEntityId, {
            onClear: this.clearEntities,
            onCleanMissing: () => this.cleanMissingEntities(entityOptions),
            onDragStart: (event, entityId) => this.startEntityDrag(event, entityId),
            onDragEnd: this.endEntityDrag,
            onDragOver: (event) => this.allowEntityDrop(event),
            onDrop: (event, entityId) => this.dropEntity(event, entityId),
            onMove: (entityId, direction) => this.moveEntity(entityId, direction),
            onRemove: (entityId) => this.removeEntity(entityId),
            onSortRecommended: () => this.sortEntitiesByRecommendation(entityOptions)
          }, {
            expanded: this.selectedEntitiesExpanded,
            visibleLimit: SELECTED_ENTITY_COLLAPSED_LIMIT,
            onToggleExpanded: this.toggleSelectedEntitiesExpanded
          })}
        </fieldset>
        <fieldset>
          <legend>${localize(this._hass, "editor.card.layout")}</legend>
          ${renderLayoutForm(this._hass, this.config, this.commitPatch)}
          ${this.renderGridPreview()}
          <div class="preset-bar" aria-label=${localize(this._hass, "editor.grid_preset")}>
            <span>${localize(this._hass, "editor.grid_preset")}</span>
            <div class="preset-actions">
              ${GRID_SIZE_PRESETS.map(
                (preset) => html`
                  <button class=${this.isGridPresetActive(preset.grid_options) ? "active" : ""} type="button" @click=${() => this.applyGridPreset(preset.grid_options)}>
                    ${localize(this._hass, `editor.grid_preset.${preset.key}` as TranslationKey)}
                  </button>
                `
              )}
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>${localize(this._hass, "editor.card.visibility")}</legend>
          ${renderVisibilityForm(this._hass, this.config, this.commitPatch)}
          <div class="preset-bar" aria-label=${localize(this._hass, "editor.display_preset")}>
            <span>${localize(this._hass, "editor.display_preset")}</span>
            <div class="preset-actions">
              ${DISPLAY_PRESETS.map(
                (preset) => html`
                  <button class=${isDisplayPresetActive(this.config, preset) ? "active" : ""} type="button" @click=${() => this.commit(displayPresetPatch(preset))}>
                    ${localize(this._hass, `editor.display_preset.${preset.key}` as TranslationKey)}
                  </button>
                `
              )}
            </div>
          </div>
        </fieldset>
        <yeelight-dashboard-card-editor-preview .config=${this.config} .hass=${this._hass}></yeelight-dashboard-card-editor-preview>
      </div>
    `;
  }

  private renderEntityPicker(result: EntityPickerResult, activeDomain: string): TemplateResult {
    const firstAvailable = result.options[0];
    const recommendedDomains = recommendedDomainsForCard(this.config.type).filter((domain) => result.domains.includes(domain));
    const visibleDomains = this.visibleDomainOptions(result.domains, recommendedDomains, activeDomain);
    return html`
      <div class="entity-tools">
        <label>
          <span>${localize(this._hass, "editor.entity_search")}</span>
          <input .value=${this.entitySearch} @input=${this.updateEntitySearch} placeholder=${localize(this._hass, "editor.entity_search_placeholder")} />
        </label>
        ${this.renderDomainSelect(visibleDomains, activeDomain)}
      </div>
      <div class="domain-chips" aria-label=${localize(this._hass, "editor.entity_browser")}>
        <button class=${activeDomain ? "" : "active"} type="button" @click=${() => this.setEntityDomain("")}>${localize(this._hass, "editor.entity_domain_all")}</button>
        ${recommendedDomains.length
          ? html`
              <span>${localize(this._hass, "editor.entity_domain_recommended")}</span>
              ${recommendedDomains.map(
                (domain) => html`
                  <button class=${activeDomain === domain ? "active" : ""} type="button" @click=${() => this.setEntityDomain(domain)}>
                    ${this.domainLabel(domain)}
                  </button>
                `
              )}
            `
          : ""}
      </div>
      <div class="entity-picker">
        <label>
          <span>${localize(this._hass, "editor.entity_picker")}</span>
          <select id="entity-picker" data-value=${firstAvailable?.entityId || ""} .value=${live(firstAvailable?.entityId || "")} ?disabled=${!firstAvailable}>
            ${result.options.map((option) => html`<option value=${option.entityId} .selected=${option.entityId === firstAvailable?.entityId}>${option.name} (${option.entityId})</option>`)}
          </select>
        </label>
        <button type="button" ?disabled=${!firstAvailable} @click=${this.addSelectedEntity}>${localize(this._hass, "editor.entity_add")}</button>
        <button type="button" ?disabled=${!result.options.length} @click=${() => this.addVisibleEntities(result.options.map((option) => option.entityId))}>
          ${localize(this._hass, "editor.entity_add_visible")}
        </button>
      </div>
      <span class="entity-count">
        ${localize(this._hass, "editor.entity_count", {
          shown: result.shown,
          filtered: result.filteredTotal,
          total: result.total
        })}
      </span>
      ${result.filteredTotal > result.shown ? html`<span class="hint">${localize(this._hass, "editor.entity_limit_hint")}</span>` : ""}
      ${!result.filteredTotal ? html`<span class="hint">${localize(this._hass, "editor.entity_no_match")}</span>` : ""}
    `;
  }

  private renderDomainSelect(domains: string[], activeDomain: string): TemplateResult {
    return html`
      <label>
        <span>${localize(this._hass, "editor.entity_domain")}</span>
        <select data-value=${activeDomain} .value=${live(activeDomain)} @change=${this.updateEntityDomain}>
          <option value="" .selected=${!activeDomain}>${localize(this._hass, "editor.entity_domain_all")}</option>
          ${domains.map((domain) => html`<option value=${domain} .selected=${domain === activeDomain}>${this.domainLabel(domain)}</option>`)}
        </select>
      </label>
    `;
  }

  private visibleDomainOptions(domains: string[], recommendedDomains: string[], activeDomain: string): string[] {
    if (!recommendedDomains.length) return domains;
    const visible = new Set(recommendedDomains);
    if (activeDomain) visible.add(activeDomain);
    return domains.filter((domain) => visible.has(domain));
  }

  private renderGridPreview(): TemplateResult {
    const options = this.currentGridOptions();
    return html`
      <div class="grid-preview" aria-label=${localize(this._hass, "editor.grid_preview")}>
        <div class="grid-preview-head">
          <span>${localize(this._hass, "editor.grid_preview")}</span>
          <strong>${localize(this._hass, "editor.grid_preview_size", { columns: options.columns, rows: options.rows })}</strong>
        </div>
        <div class="grid-preview-track" aria-hidden="true">
          <span style=${`--preview-columns:${options.columns}; --preview-rows:${options.rows}`}></span>
        </div>
      </div>
    `;
  }

  private applyRecommendedCardSetup = (): void => {
    this.commit(recommendedCardSetupPatch(this.config.type));
  };

  private commitPatch = (patch: Partial<DashboardCardConfig>): void => {
    if (patch.type && patch.type !== this.config.type) {
      this.entityDomainFilter = undefined;
    }
    this.commit(patch);
  };

  private updateEntitySearch = (event: Event): void => {
    this.entitySearch = (event.target as HTMLInputElement).value;
    this.requestUpdate();
  };

  private updateEntityDomain = (event: Event): void => {
    this.setEntityDomain((event.target as HTMLSelectElement).value);
  };

  private setEntityDomain(domain: string): void {
    this.entityDomainFilter = domain;
    this.requestUpdate();
  }

  private toggleSelectedEntitiesExpanded = (): void => {
    this.selectedEntitiesExpanded = !this.selectedEntitiesExpanded;
    this.requestUpdate();
  };

  private addSelectedEntity = (): void => {
    const select = this.renderRoot.querySelector<HTMLSelectElement>("#entity-picker");
    const entityId = select?.value;
    if (!entityId || this.config.entities.includes(entityId)) return;
    this.commit({ entities: [...this.config.entities, entityId] });
  };

  private addVisibleEntities(entityIds: string[]): void {
    const entities = [...this.config.entities];
    const selected = new Set(entities);
    for (const entityId of entityIds) {
      if (selected.has(entityId)) continue;
      selected.add(entityId);
      entities.push(entityId);
    }
    if (entities.length === this.config.entities.length) return;
    this.commit({ entities });
  }

  private clearEntities = (): void => {
    if (!this.config.entities.length) return;
    this.commit({ entities: [] });
  };

  private cleanMissingEntities(options: ReturnType<typeof buildEntityOptions>): void {
    const available = new Set(options.map((option) => option.entityId));
    const entities = this.config.entities.filter((entityId) => available.has(entityId));
    if (entities.length === this.config.entities.length) return;
    this.commit({ entities });
  }

  private sortEntitiesByRecommendation(options: ReturnType<typeof buildEntityOptions>): void {
    const order = new Map(options.map((option, index) => [option.entityId, index]));
    const entities = this.config.entities
      .map((entityId, index) => ({ entityId, index, rank: order.get(entityId) ?? Number.MAX_SAFE_INTEGER }))
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map((item) => item.entityId);
    if (entities.every((entityId, index) => entityId === this.config.entities[index])) return;
    this.commit({ entities });
  }

  private removeEntity(entityId: string): void {
    this.commit({ entities: this.config.entities.filter((item) => item !== entityId) });
  }

  private moveEntity(entityId: string, direction: -1 | 1): void {
    const from = this.config.entities.indexOf(entityId);
    const to = from + direction;
    this.reorderEntity(from, to);
  }

  private startEntityDrag(event: DragEvent, entityId: string): void {
    this.draggingEntityId = entityId;
    event.dataTransfer?.setData("text/plain", entityId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    this.requestUpdate();
  }

  private allowEntityDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  }

  private dropEntity(event: DragEvent, targetEntityId: string): void {
    event.preventDefault();
    const sourceEntityId = this.draggingEntityId || event.dataTransfer?.getData("text/plain");
    this.draggingEntityId = undefined;
    const changed = this.reorderEntity(this.config.entities.indexOf(sourceEntityId || ""), this.config.entities.indexOf(targetEntityId));
    if (!changed) this.requestUpdate();
  }

  private endEntityDrag = (): void => {
    this.draggingEntityId = undefined;
    this.requestUpdate();
  };

  private reorderEntity(from: number, to: number): boolean {
    if (from < 0 || to < 0 || to >= this.config.entities.length || from === to) return false;
    const entities = [...this.config.entities];
    const [entityId] = entities.splice(from, 1);
    entities.splice(to, 0, entityId);
    this.commit({ entities });
    return true;
  }

  private applyGridPreset(gridOptions: DashboardCardConfig["grid_options"]): void {
    this.commit({ grid_options: gridOptions ? { ...gridOptions } : undefined });
  }

  private isGridPresetActive(gridOptions: DashboardCardConfig["grid_options"]): boolean {
    const current = this.config.grid_options || {};
    const preset = gridOptions || {};
    return (current.columns ?? "") === (preset.columns ?? "") && (current.rows ?? "") === (preset.rows ?? "");
  }

  private currentGridOptions(): { columns: number; rows: number } {
    return gridOptionsForConfig(kindFromCardType(this.config.type), this.config.grid_options);
  }

  private commit(patch: Partial<DashboardCardConfig>): void {
    this.config = normalizeDashboardCardConfig({ ...this.config, ...patch });
    this.dispatchEvent(new CustomEvent("config-changed", { bubbles: true, composed: true, detail: { config: this.config } }));
    this.requestUpdate();
  };

  private activeEntityDomain(options: ReturnType<typeof buildEntityOptions>): string {
    const domain = this.entityDomainFilter === undefined ? defaultDomainForCard(this.config, options) : this.entityDomainFilter;
    if (!domain) return "";
    return options.some((option) => option.domain === domain) ? domain : "";
  }

  private domainLabel(domain: string): string {
    return localize(this._hass, "editor.entity_domain_value", { domain });
  }

  protected override updated(): void {
    syncSelectValues(this.renderRoot);
  }
}
