import { LitElement, html, nothing, type TemplateResult } from "lit";

import { localize, stateText } from "../i18n";
import { summarizeEntities } from "./entity-model";
import { actionFor, actionLabel, executeEntityAction, fireMoreInfo, turnOffLights, type EntityAction } from "./actions";
import { gridOptionsForConfig } from "./grid-options";
import { iconForKind, metricsFor } from "./card-meta";
import { normalizeDashboardCardConfig, visibleLimit, type NormalizedDashboardCardConfig } from "./config";
import { renderAreaCard, renderAreaPill, renderStatusGroup } from "./internal-card-areas";
import { renderAirBoard, renderClimateBoard, renderWaterBoard } from "./internal-card-comfort";
import { renderMetric } from "./internal-card-metrics";
import { renderEnergyBoard, renderInfrastructureBoard, renderPowerBoard } from "./internal-card-operations";
import { renderCameraBoard, renderCameraWallBoard, renderMediaBoard, renderPresenceBoard, renderSecurityBoard } from "./internal-card-phase-a";
import { renderHealthBoard } from "./internal-card-health";
import { renderDevicesBoard, renderEnvironmentBoard, renderRoutinesBoard } from "./internal-card-product";
import { renderImageBoard, renderNoteBoard, renderPanelActionsBoard } from "./internal-card-utility";
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
    const subtypeClass = this.config.subtype ? ` subtype-${this.config.subtype.replace(/[^a-z0-9-]/gi, "-")}` : "";
    return html`
      <ha-card>
        <div class=${`card ${this.kind} density-${this.config.density} variant-${this.config.variant}${subtypeClass}`} aria-label=${title}>
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
    return html`<div class=${`metrics count-${metrics.length}`}>${metrics.map((metric) => renderMetric(this, this.hass, metric))}</div>`;
  }

  private renderBody(summary: DashboardCardSummary, areas: DashboardAreaSummary[]): TemplateResult {
    if (!summary.entities.length) {
      if (this.kind === "rooms" && areas.length) return this.renderRooms(areas);
      if (this.kind === "media") return renderMediaBoard(this, summary, this.config.subtype, this.limit(5));
      if (this.kind === "camera") return renderCameraBoard(this, summary, this.config.subtype, this.limit(4));
      if (this.kind === "cameraWall") return renderCameraWallBoard(this, summary, this.limit(6));
      if (this.kind === "climate") return renderClimateBoard(this, summary, this.config.subtype, this.limit(5));
      if (this.kind === "air") return renderAirBoard(this, summary, this.config.subtype, this.limit(5), this.config.show_actions);
      if (this.kind === "water") return renderWaterBoard(this, summary, this.limit(5));
      if (this.kind === "power") return renderPowerBoard(this, summary, this.config.subtype, this.limit(5), this.config.show_actions);
      if (this.kind === "energy") return renderEnergyBoard(this, summary, this.config.subtype, this.limit(5));
      if (this.kind === "infrastructure") return renderInfrastructureBoard(this, summary, this.config.subtype, this.limit(5));
      if (this.kind === "security") return renderSecurityBoard(this, summary, this.config.subtype, this.limit(5));
      if (this.kind === "presence") return renderPresenceBoard(this, summary, this.config.subtype, this.limit(5));
      if (this.kind === "panelActions") return renderPanelActionsBoard(this, summary, this.limit(6), this.config.show_actions, this.config);
      if (this.kind === "image") return renderImageBoard(this, summary, this.config.subtype, this.config, this.limit(6));
      if (this.kind === "note") return renderNoteBoard(this, summary, this.config, this.limit(4));
      if (this.kind === "health") return renderHealthBoard(this, summary, this.config.subtype, this.limit(4), (entity) => this.renderEntityRow(entity));
      return html`<div class="empty">${localize(this.hass, this.kind === "light" ? "empty.no_lights" : "empty.no_entities")}</div>`;
    }
    if (this.kind === "hero") return this.renderHero(summary, areas);
    if (this.kind === "status") return this.renderStatus(summary, areas);
    if (this.kind === "notice") return this.renderNotice(summary);
    if (this.kind === "light") return this.renderLights(summary);
    if (this.kind === "rooms") return this.renderRooms(areas);
    if (this.kind === "room") return this.renderRoom(summary, areas[0]);
    if (this.kind === "devices") return renderDevicesBoard(this, summary, areas, this.limit(5), this.config.show_actions, (area) => this.renderAreaPill(area), this.config.subtype);
    if (this.kind === "routines") return renderRoutinesBoard(this, summary, this.limit(5), this.config.show_actions, (entity) => this.renderActionTile(entity), this.config.subtype);
    if (this.kind === "environment") return renderEnvironmentBoard(this, summary, this.limit(6), this.config.subtype);
    if (this.kind === "media") return renderMediaBoard(this, summary, this.config.subtype, this.limit(5));
    if (this.kind === "camera") return renderCameraBoard(this, summary, this.config.subtype, this.limit(4));
    if (this.kind === "cameraWall") return renderCameraWallBoard(this, summary, this.limit(6));
    if (this.kind === "climate") return renderClimateBoard(this, summary, this.config.subtype, this.limit(5));
    if (this.kind === "air") return renderAirBoard(this, summary, this.config.subtype, this.limit(5), this.config.show_actions);
    if (this.kind === "water") return renderWaterBoard(this, summary, this.limit(5));
    if (this.kind === "power") return renderPowerBoard(this, summary, this.config.subtype, this.limit(5), this.config.show_actions);
    if (this.kind === "energy") return renderEnergyBoard(this, summary, this.config.subtype, this.limit(5));
    if (this.kind === "infrastructure") return renderInfrastructureBoard(this, summary, this.config.subtype, this.limit(5));
    if (this.kind === "security") return renderSecurityBoard(this, summary, this.config.subtype, this.limit(5));
    if (this.kind === "presence") return renderPresenceBoard(this, summary, this.config.subtype, this.limit(5));
    if (this.kind === "panelActions") return renderPanelActionsBoard(this, summary, this.limit(6), this.config.show_actions, this.config);
    if (this.kind === "image") return renderImageBoard(this, summary, this.config.subtype, this.config, this.limit(6));
    if (this.kind === "note") return renderNoteBoard(this, summary, this.config, this.limit(4));
    if (this.kind === "ecosystem") return this.renderEcosystem(summary, areas);
    return renderHealthBoard(this, summary, this.config.subtype, this.limit(4), (entity) => this.renderEntityRow(entity));
  }

  private renderHero(summary: DashboardCardSummary, areas: DashboardAreaSummary[]): TemplateResult {
    if (this.config.subtype === "time") {
      const locale = this.hass?.locale?.language || "zh-CN";
      const now = new Date();
      return html`
        <div class="hero-board">
          <div class="hero-copy">
            <span class="hero-kicker">${localize(this.hass, "label.home_time")}</span>
            <strong>${now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</strong>
            <span>${now.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" })}</span>
          </div>
        ${areas.length ? html`<div class="area-strip">${areas.slice(0, this.limit(4)).map((area) => this.renderAreaPill(area))}</div>` : nothing}
        </div>
      `;
    }
    if (this.config.subtype === "quote") {
      return html`
        <div class="hero-board">
          <div class="hero-copy">
            <span class="hero-kicker">${localize(this.hass, "label.daily_quote")}</span>
            <strong>${this.config.content || localize(this.hass, "label.daily_quote_default")}</strong>
            <span>${summary.activeLights.length} ${localize(this.hass, "metric.lights_on")} · ${summary.issues.length} ${localize(this.hass, "metric.issues")}</span>
          </div>
          ${summary.routines.length ? html`<div class="quick-grid hero-actions">${summary.routines.slice(0, this.limit(3)).map((entity) => this.renderActionTile(entity))}</div>` : nothing}
        </div>
      `;
    }
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
      { icon: "mdi:lightbulb-group", label: localize(this.hass, "metric.lights"), value: summary.lights.length, target: { viewPath: "lighting", nativePath: "/light?historyBack=1" } },
      { icon: "mdi:gesture-tap-button", label: localize(this.hass, "metric.routines"), value: summary.routines.length, target: { viewPath: "scenes", nativePath: "/config/scene/dashboard?historyBack=1" } },
      { icon: "mdi:tune-variant", label: localize(this.hass, "metric.controls"), value: summary.controllable.length, target: { viewPath: "areas", nativePath: "/config/entities?historyBack=1" } }
    ];
    return html`
      <div class="status-board">
        <div class="status-groups">${controlGroups.map((group) => renderStatusGroup(this.hass, group.icon, group.label, group.value, group.target))}</div>
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
    const allLights = [...summary.activeLights, ...summary.lights.filter((entity) => entity.state !== "on")];
    const lights = allLights.slice(0, this.limit(this.config.subtype === "status" ? 4 : 2));
    if (this.config.subtype === "status") {
      return html`
        <div class="section-label">${localize(this.hass, "label.light_status")}</div>
        <div class="entity-list compact">${lights.map((entity) => this.renderEntityRow(entity))}</div>
      `;
    }
    if (this.config.subtype === "devices") {
      return html`
        <div class="section-label">${localize(this.hass, "label.light_devices")}</div>
        <div class="entity-list compact">${allLights.slice(0, this.limit(8)).map((entity) => this.renderEntityRow(entity))}</div>
      `;
    }
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
      { icon: "mdi:home-group", label: localize(this.hass, "metric.rooms"), value: areas.length, target: { viewPath: "areas", nativePath: "/config/areas/dashboard?historyBack=1" } },
      { icon: "mdi:checkbox-marked-circle-outline", label: localize(this.hass, "metric.online"), value: summary.online.length, target: { viewPath: "health", nativePath: "/config/entities?historyBack=1" } },
      { icon: "mdi:alert-circle-outline", label: localize(this.hass, "metric.issues"), value: summary.issues.length, target: { viewPath: "health", nativePath: "/config/repairs?historyBack=1" } }
    ];
    const focusAreas = areas.slice(0, this.limit(2));
    return html`
      <div class="ecosystem-board">
        <div class="status-groups">${groups.map((group) => renderStatusGroup(this.hass, group.icon, group.label, group.value, group.target))}</div>
        ${focusAreas.length ? html`<div class="room-grid">${focusAreas.map((area) => this.renderAreaCard(area))}</div>` : nothing}
      </div>
    `;
  }

  private renderAreaCard(area: DashboardAreaSummary): TemplateResult {
    return renderAreaCard(this.hass, area);
  }

  private renderAreaPill(area: DashboardAreaSummary): TemplateResult {
    return renderAreaPill(this.hass, area);
  }

  private renderEntityTile(entity: NormalizedEntity): TemplateResult {
    const action = this.config.show_actions ? actionFor(entity) : "";
    return html`
      <div class=${`entity-tile ${entity.state === "on" ? "active" : ""} ${entity.available ? "" : "muted"}`}>
        <button class="entity-main entity-tile-main" type="button" aria-label=${`${entity.name} · ${localize(this.hass, "action.more_info")}`} @click=${() => fireMoreInfo(this, entity.entityId)}>
          <ha-icon .icon=${entity.icon}></ha-icon>
          <span>
            <strong>${entity.name}</strong>
            <small>${stateText(this.hass, entity.state)}</small>
          </span>
        </button>
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
      <div class=${`action-tile domain-${entity.domain} ${entity.available ? "" : "muted"}`}>
        <button class="action-tile-main" type="button" @click=${() => fireMoreInfo(this, entity.entityId)}>
          <ha-icon .icon=${entity.icon}></ha-icon>
          <strong>${entity.name}</strong>
          <span>${stateText(this.hass, entity.state)}</span>
        </button>
        <button class="action-tile-run" type="button" ?disabled=${!entity.available || entity.readOnly} @click=${() => this.runEntityAction(entity, action)}>
          ${actionLabel(this.hass, entity, action)}
        </button>
      </div>
    `;
  }

  private renderEntityRow(entity: NormalizedEntity): TemplateResult {
    const action = this.config.show_actions ? actionFor(entity) : "";
    return html`
      <div class=${`entity-row ${entity.available ? "" : "muted"}`}>
        <button class="entity-main entity-row-main" type="button" aria-label=${`${entity.name} · ${localize(this.hass, "action.more_info")}`} @click=${() => fireMoreInfo(this, entity.entityId)}>
          <ha-icon .icon=${entity.icon}></ha-icon>
          <span>
            <strong>${entity.name}</strong>
            <small>${stateText(this.hass, entity.state)}</small>
          </span>
        </button>
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
