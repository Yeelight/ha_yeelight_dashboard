import { LitElement, html, nothing, type TemplateResult } from "lit";

import { localize, stateText } from "../i18n";
import { summarizeEntities } from "./entity-model";
import { actionFor, actionLabel, executeEntityAction, fireMoreInfo, turnOffLights, type EntityAction } from "./actions";
import { gridOptionsForConfig } from "./grid-options";
import { iconForKind, metricsFor } from "./card-meta";
import { normalizeDashboardCardConfig, visibleLimit, type NormalizedDashboardCardConfig } from "./config";
import { renderDevicesBoard, renderEnvironmentBoard, renderRoutinesBoard } from "./internal-card-product";
import type {
  DashboardAreaSummary,
  DashboardCardKind,
  DashboardCardSummary,
  HomeAssistant,
  NormalizedEntity
} from "./types";
import { dashboardCardStyles } from "./styles";

export type { DashboardCardKind } from "./types";

export function createDashboardCardClass(kind: DashboardCardKind): typeof YeelightDashboardBaseCard {
  return class extends YeelightDashboardBaseCard {
    protected override kind = kind;
  };
}

export class YeelightDashboardBaseCard extends LitElement {
  static override styles = dashboardCardStyles;
  protected kind: DashboardCardKind = "hero";
  protected config: NormalizedDashboardCardConfig = normalizeDashboardCardConfig({ type: "custom:yeelight-dashboard-hero-card" });
  private _hass?: HomeAssistant;
  private feedback = "";

  setConfig(config: Partial<NormalizedDashboardCardConfig>): void {
    this.config = normalizeDashboardCardConfig(config);
  }

  set hass(value: HomeAssistant | undefined) {
    this._hass = value;
    this.requestUpdate();
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  getCardSize(): number {
    return this.gridOptions().rows;
  }

  getGridOptions(): Record<string, number> {
    return this.gridOptions();
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("yeelight-dashboard-card-editor");
  }

  protected override render(): TemplateResult {
    const summary = summarizeEntities(this.hass, this.config.entities || []);
    const areas = this.config.show_area_summaries ? this.areaSummaries() : [];
    const title = this.config.title || localize(this.hass, `card.${this.kind}.title`);
    return html`
      <ha-card>
        <div class=${`card ${this.kind} density-${this.config.density} variant-${this.config.variant}`} aria-label=${title}>
          ${this.renderHeader(title)} ${this.renderMetrics(summary, areas)} ${this.renderBody(summary, areas)}
          ${this.feedback ? html`<div class="feedback" role="status">${this.feedback}</div>` : nothing}
        </div>
      </ha-card>
    `;
  }

  private renderHeader(title: string): TemplateResult {
    return html`
      <header class="header">
        <div class="title-row">
          <span class="header-icon"><ha-icon .icon=${iconForKind(this.kind)}></ha-icon></span>
          <div>
            <h2 class="title">${title}</h2>
            <p class="subtitle">${this.config.subtitle || localize(this.hass, `card.${this.kind}.subtitle`)}</p>
          </div>
        </div>
        ${this.config.show_actions && (this.kind === "hero" || this.kind === "light")
          ? html`<button class="primary-action" @click=${this.turnOffAllLights}>${localize(this.hass, "action.turn_off_all")}</button>`
          : nothing}
      </header>
    `;
  }

  private renderMetrics(summary: DashboardCardSummary, areas: DashboardAreaSummary[]): TemplateResult | typeof nothing {
    if (!this.config.show_metrics) return nothing;
    const metrics = metricsFor(this.hass, this.kind, summary, areas);
    return html`
      <div class=${`metrics count-${metrics.length}`}>
        ${metrics.map(({ value, label, tone }) => html`<div class=${`metric ${tone}`}><strong>${value}</strong><span>${label}</span></div>`)}
      </div>
    `;
  }

  private renderBody(summary: DashboardCardSummary, areas: DashboardAreaSummary[]): TemplateResult {
    if (!summary.entities.length) {
      if (this.kind === "rooms" && areas.length) return this.renderRooms(areas);
      return html`<div class="empty">${localize(this.hass, this.kind === "light" ? "empty.no_lights" : "empty.no_entities")}</div>`;
    }
    if (this.kind === "hero") return this.renderHero(summary, areas);
    if (this.kind === "status") return this.renderStatus(summary, areas);
    if (this.kind === "notice") return this.renderNotice(summary);
    if (this.kind === "light") return this.renderLights(summary);
    if (this.kind === "rooms") return this.renderRooms(areas);
    if (this.kind === "room") return this.renderRoom(summary, areas[0]);
    if (this.kind === "devices") return renderDevicesBoard(this, summary, areas, this.limit(5), this.config.show_actions, (area) => this.renderAreaPill(area));
    if (this.kind === "routines") return renderRoutinesBoard(this, summary, this.limit(5), this.config.show_actions, (entity) => this.renderActionTile(entity));
    if (this.kind === "environment") return renderEnvironmentBoard(this, summary, this.limit(6));
    if (this.kind === "ecosystem") return this.renderEcosystem(summary, areas);
    return this.renderHealth(summary);
  }

  private renderHero(summary: DashboardCardSummary, areas: DashboardAreaSummary[]): TemplateResult {
    const limit = this.limit(4);
    const headline = summary.activeLights.length
      ? `${summary.activeLights.length} ${localize(this.hass, "metric.lights_on")}`
      : localize(this.hass, "empty.no_active_lights");
    return html`
      <div class="hero-board">
        <div class="hero-copy">
          <span class="hero-kicker">Yeelight / Home Assistant</span>
          <strong>${headline}</strong>
          <span>${summary.controllable.length} ${localize(this.hass, "metric.controls")} · ${summary.routines.length} ${localize(this.hass, "metric.routines")}</span>
        </div>
        ${areas.length ? html`<div class="area-strip">${areas.slice(0, limit).map((area) => this.renderAreaPill(area))}</div>` : nothing}
        ${summary.routines.length ? html`<div class="quick-grid hero-actions">${summary.routines.slice(0, Math.min(limit, 4)).map((entity) => this.renderActionTile(entity))}</div>` : nothing}
      </div>
    `;
  }

  private renderStatus(summary: DashboardCardSummary, areas: DashboardAreaSummary[]): TemplateResult {
    const topAreas = areas.slice(0, this.limit(3));
    const controlGroups = [
      { icon: "mdi:lightbulb-group", label: localize(this.hass, "metric.lights"), value: summary.lights.length },
      { icon: "mdi:gesture-tap-button", label: localize(this.hass, "metric.routines"), value: summary.routines.length },
      { icon: "mdi:tune-variant", label: localize(this.hass, "metric.controls"), value: summary.controllable.length }
    ];
    return html`
      <div class="status-board">
        <div class="status-groups">${controlGroups.map((group) => this.renderStatusGroup(group.icon, group.label, group.value))}</div>
        ${topAreas.length ? html`<div class="area-strip compact-strip">${topAreas.map((area) => this.renderAreaPill(area))}</div>` : nothing}
      </div>
    `;
  }

  private renderNotice(summary: DashboardCardSummary): TemplateResult {
    const notices = summary.issues.slice(0, this.limit(3));
    if (!notices.length) {
      return html`
        <div class="health-ok">
          <ha-icon icon="mdi:check-circle-outline"></ha-icon>
          <span>${localize(this.hass, "empty.no_issues")}</span>
        </div>
      `;
    }
    return html`
      <div class="section-label">${localize(this.hass, "label.issue_list")}</div>
      <div class="entity-list compact">${notices.map((entity) => this.renderEntityRow(entity))}</div>
    `;
  }

  private renderLights(summary: DashboardCardSummary): TemplateResult {
    if (!summary.lights.length) return html`<div class="empty">${localize(this.hass, "empty.no_lights")}</div>`;
    const lights = [...summary.activeLights, ...summary.lights.filter((entity) => entity.state !== "on")].slice(0, this.limit(2));
    return html`
      <div class="section-label">${localize(this.hass, "label.active_lights")}</div>
      <div class="tile-grid">${lights.map((entity) => this.renderEntityTile(entity))}</div>
    `;
  }

  private renderRooms(areas: DashboardAreaSummary[]): TemplateResult {
    if (!areas.length) return html`<div class="empty">${localize(this.hass, "empty.no_rooms")}</div>`;
    return html`
      <div class="section-label">${localize(this.hass, "label.favorite_rooms")}</div>
      <div class="room-grid">${areas.slice(0, this.limit(2)).map((area) => this.renderAreaCard(area))}</div>
    `;
  }

  private renderRoom(summary: DashboardCardSummary, area?: DashboardAreaSummary): TemplateResult {
    const featured = [...summary.activeLights, ...summary.routines, ...summary.controllable.filter((entity) => entity.domain !== "light")].slice(0, this.limit(3));
    return html`
      ${area ? html`<div class="room-hero">${this.renderAreaPill(area)}</div>` : nothing}
      ${featured.length
        ? html`<div class="entity-list compact">${featured.map((entity) => this.renderEntityRow(entity))}</div>`
        : html`<div class="empty">${localize(this.hass, "empty.no_entities")}</div>`}
    `;
  }

  private renderEcosystem(summary: DashboardCardSummary, areas: DashboardAreaSummary[]): TemplateResult {
    const groups = [
      { icon: "mdi:home-group", label: localize(this.hass, "metric.rooms"), value: areas.length },
      { icon: "mdi:checkbox-marked-circle-outline", label: localize(this.hass, "metric.online"), value: summary.online.length },
      { icon: "mdi:alert-circle-outline", label: localize(this.hass, "metric.issues"), value: summary.issues.length }
    ];
    const focusAreas = areas.slice(0, this.limit(2));
    return html`
      <div class="ecosystem-board">
        <div class="status-groups">${groups.map((group) => this.renderStatusGroup(group.icon, group.label, group.value))}</div>
        ${focusAreas.length ? html`<div class="room-grid">${focusAreas.map((area) => this.renderAreaCard(area))}</div>` : nothing}
      </div>
    `;
  }

  private renderHealth(summary: DashboardCardSummary): TemplateResult {
    const issues = summary.issues.slice(0, this.limit(2));
    if (!issues.length) {
      return html`
        <div class="health-ok">
          <ha-icon icon="mdi:check-circle-outline"></ha-icon>
          <span>${localize(this.hass, "empty.no_issues")}</span>
        </div>
      `;
    }
    return html`
      <div class="section-label">${localize(this.hass, "label.issue_list")}</div>
      <div class="entity-list compact">${issues.map((entity) => this.renderEntityRow(entity))}</div>
    `;
  }

  private renderStatusGroup(icon: string, label: string, value: number): TemplateResult {
    return html`
      <div class="status-group">
        <ha-icon .icon=${icon}></ha-icon>
        <strong>${value}</strong>
        <span>${label}</span>
      </div>
    `;
  }

  private renderAreaCard(area: DashboardAreaSummary): TemplateResult {
    const progress = area.lightCount ? Math.round((area.activeLightCount / area.lightCount) * 100) : 0;
    return html`
      <div class=${`area-card ${area.issueCount ? "warning" : ""}`} style=${`--area-progress:${progress}%`}>
        <div class="area-card-head">
          <strong>${area.name}</strong>
          ${area.issueCount ? html`<span>${area.issueCount}</span>` : nothing}
        </div>
        <div class="area-card-stats">
          <span>${area.activeLightCount}/${area.lightCount} ${localize(this.hass, "metric.lights")}</span>
          <span>${area.entityCount} ${localize(this.hass, "metric.entities")}</span>
        </div>
        <div class="area-progress" aria-hidden="true"><span></span></div>
      </div>
    `;
  }

  private renderAreaPill(area: DashboardAreaSummary): TemplateResult {
    return html`
      <div class="area-pill">
        <strong>${area.name}</strong>
        <span>${area.activeLightCount} ${localize(this.hass, "metric.lights_on")} · ${area.entityCount} ${localize(this.hass, "metric.entities")}</span>
      </div>
    `;
  }

  private renderEntityTile(entity: NormalizedEntity): TemplateResult {
    const action = this.config.show_actions ? actionFor(entity) : "";
    return html`
      <div class=${`entity-tile ${entity.state === "on" ? "active" : ""} ${entity.available ? "" : "muted"}`}>
        <button class="tile-icon" aria-label=${localize(this.hass, "action.more_info")} @click=${() => fireMoreInfo(this, entity.entityId)}>
          <ha-icon .icon=${entity.icon}></ha-icon>
        </button>
        <div class="entity-text">
          <strong>${entity.name}</strong>
          <span>${stateText(this.hass, entity.state)}</span>
        </div>
        ${action
          ? html`<button class="chip-action" ?disabled=${!entity.available || entity.readOnly} @click=${() => this.runEntityAction(entity, action)}>${actionLabel(this.hass, entity, action)}</button>`
          : nothing}
      </div>
    `;
  }

  private renderActionTile(entity: NormalizedEntity): TemplateResult {
    const action = this.config.show_actions ? actionFor(entity) : "";
    if (!action) return this.renderEntityRow(entity);
    return html`
      <button class="action-tile" ?disabled=${!entity.available || entity.readOnly} @click=${() => this.runEntityAction(entity, action)}>
        <ha-icon .icon=${entity.icon}></ha-icon>
        <strong>${entity.name}</strong>
        <span>${actionLabel(this.hass, entity, action)}</span>
      </button>
    `;
  }

  private renderEntityRow(entity: NormalizedEntity): TemplateResult {
    const action = this.config.show_actions ? actionFor(entity) : "";
    return html`
      <div class=${`entity-row ${entity.available ? "" : "muted"}`}>
        <button class="icon-button" aria-label=${localize(this.hass, "action.more_info")} @click=${() => fireMoreInfo(this, entity.entityId)}>
          <ha-icon .icon=${entity.icon}></ha-icon>
        </button>
        <div class="entity-text">
          <strong>${entity.name}</strong>
          <span>${stateText(this.hass, entity.state)}</span>
        </div>
        ${action
          ? html`<button class="text-action" ?disabled=${!entity.available || entity.readOnly} @click=${() => this.runEntityAction(entity, action)}>${actionLabel(this.hass, entity, action)}</button>`
          : nothing}
      </div>
    `;
  }

  private areaSummaries(): DashboardAreaSummary[] {
    return Array.isArray(this.config.area_summaries) ? this.config.area_summaries : [];
  }

  private limit(fallback: number): number {
    return visibleLimit(this.config, fallback);
  }

  private gridOptions(): Record<string, number> {
    return gridOptionsForConfig(this.kind, this.config.grid_options);
  }

  private turnOffAllLights = async (): Promise<void> => {
    await this.withFeedback(async () => {
      await turnOffLights(this.hass, this.config.entities || []);
    });
  };

  async runEntityAction(entity: NormalizedEntity, action: EntityAction): Promise<void> {
    await this.withFeedback(() => executeEntityAction(this.hass, entity.entityId, action));
  }

  private async withFeedback(action: () => Promise<unknown>): Promise<void> {
    try {
      await action();
      this.feedback = "";
    } catch (error) {
      this.feedback = error instanceof Error ? error.message : String(error);
    }
    this.requestUpdate();
  }
}
