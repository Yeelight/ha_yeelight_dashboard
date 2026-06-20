import { LitElement, html, nothing, type TemplateResult } from "lit";

import { localize, stateText } from "../i18n";
import { summarizeEntities } from "./entity-model";
import { executeEntityAction, fireMoreInfo, turnOffLights } from "./actions";
import { gridOptionsForKind } from "./grid-options";
import type {
  DashboardAreaSummary,
  DashboardCardConfig,
  DashboardCardKind,
  DashboardCardSummary,
  HomeAssistant,
  NormalizedEntity
} from "./types";
import { dashboardCardStyles } from "./styles";

type Metric = { value: number; label: string; tone: "neutral" | "hot" | "ok" | "warn" };
type EntityAction = "toggle" | "activate" | "press";

export type { DashboardCardKind } from "./types";

export function createDashboardCardClass(kind: DashboardCardKind): typeof YeelightDashboardBaseCard {
  return class extends YeelightDashboardBaseCard {
    protected override kind = kind;
  };
}

export class YeelightDashboardBaseCard extends LitElement {
  static override styles = dashboardCardStyles;
  protected kind: DashboardCardKind = "hero";
  protected config: DashboardCardConfig = { type: "custom:yeelight-dashboard-hero-card", entities: [] };
  private _hass?: HomeAssistant;
  private feedback = "";

  setConfig(config: DashboardCardConfig): void {
    this.config = {
      ...config,
      entities: Array.isArray(config.entities) ? config.entities : [],
      area_summaries: Array.isArray(config.area_summaries) ? config.area_summaries : []
    };
  }

  set hass(value: HomeAssistant | undefined) {
    this._hass = value;
    this.requestUpdate();
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  getCardSize(): number {
    return gridOptionsForKind(this.kind).rows;
  }

  getGridOptions(): Record<string, number> {
    return gridOptionsForKind(this.kind);
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("yeelight-dashboard-card-editor");
  }

  protected override render(): TemplateResult {
    const summary = summarizeEntities(this.hass, this.config.entities || []);
    const areas = this.areaSummaries();
    const title = this.config.title || localize(this.hass, `card.${this.kind}.title`);
    return html`
      <ha-card>
        <div class=${`card ${this.kind}`} aria-label=${title}>
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
            <p class="subtitle">${localize(this.hass, `card.${this.kind}.subtitle`)}</p>
          </div>
        </div>
        ${this.kind === "hero" || this.kind === "light"
          ? html`<button class="primary-action" @click=${this.turnOffAllLights}>${localize(this.hass, "action.turn_off_all")}</button>`
          : nothing}
      </header>
    `;
  }

  private renderMetrics(summary: DashboardCardSummary, areas: DashboardAreaSummary[]): TemplateResult {
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
    if (this.kind === "light") return this.renderLights(summary);
    if (this.kind === "rooms") return this.renderRooms(areas);
    if (this.kind === "room") return this.renderRoom(summary, areas[0]);
    if (this.kind === "routines") return this.renderRoutines(summary);
    return this.renderHealth(summary);
  }

  private renderHero(summary: DashboardCardSummary, areas: DashboardAreaSummary[]): TemplateResult {
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
        ${areas.length ? html`<div class="area-strip">${areas.slice(0, 4).map((area) => this.renderAreaPill(area))}</div>` : nothing}
        ${summary.routines.length ? html`<div class="quick-grid hero-actions">${summary.routines.slice(0, 1).map((entity) => this.renderActionTile(entity))}</div>` : nothing}
      </div>
    `;
  }

  private renderLights(summary: DashboardCardSummary): TemplateResult {
    if (!summary.lights.length) return html`<div class="empty">${localize(this.hass, "empty.no_lights")}</div>`;
    const lights = [...summary.activeLights, ...summary.lights.filter((entity) => entity.state !== "on")].slice(0, 2);
    return html`
      <div class="section-label">${localize(this.hass, "label.active_lights")}</div>
      <div class="tile-grid">${lights.map((entity) => this.renderEntityTile(entity))}</div>
    `;
  }

  private renderRooms(areas: DashboardAreaSummary[]): TemplateResult {
    if (!areas.length) return html`<div class="empty">${localize(this.hass, "empty.no_rooms")}</div>`;
    return html`
      <div class="section-label">${localize(this.hass, "label.favorite_rooms")}</div>
      <div class="room-grid">${areas.slice(0, 2).map((area) => this.renderAreaCard(area))}</div>
    `;
  }

  private renderRoom(summary: DashboardCardSummary, area?: DashboardAreaSummary): TemplateResult {
    const featured = [...summary.activeLights, ...summary.routines, ...summary.controllable.filter((entity) => entity.domain !== "light")].slice(0, 3);
    return html`
      ${area ? html`<div class="room-hero">${this.renderAreaPill(area)}</div>` : nothing}
      ${featured.length
        ? html`<div class="entity-list compact">${featured.map((entity) => this.renderEntityRow(entity))}</div>`
        : html`<div class="empty">${localize(this.hass, "empty.no_entities")}</div>`}
    `;
  }

  private renderRoutines(summary: DashboardCardSummary): TemplateResult {
    if (!summary.routines.length) return html`<div class="empty">${localize(this.hass, "empty.no_routines")}</div>`;
    return html`
      <div class="section-label">${localize(this.hass, "label.quick_actions")}</div>
      <div class="quick-grid">${summary.routines.slice(0, 2).map((entity) => this.renderActionTile(entity))}</div>
    `;
  }

  private renderHealth(summary: DashboardCardSummary): TemplateResult {
    const issues = summary.issues.slice(0, 2);
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
    const action = actionFor(entity);
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
          ? html`<button class="chip-action" ?disabled=${!entity.available || entity.readOnly} @click=${() => this.runAction(entity, action)}>${actionLabel(this.hass, entity, action)}</button>`
          : nothing}
      </div>
    `;
  }

  private renderActionTile(entity: NormalizedEntity): TemplateResult {
    const action = actionFor(entity);
    if (!action) return this.renderEntityTile(entity);
    return html`
      <button class="action-tile" ?disabled=${!entity.available || entity.readOnly} @click=${() => this.runAction(entity, action)}>
        <ha-icon .icon=${entity.icon}></ha-icon>
        <strong>${entity.name}</strong>
        <span>${actionLabel(this.hass, entity, action)}</span>
      </button>
    `;
  }

  private renderEntityRow(entity: NormalizedEntity): TemplateResult {
    const action = actionFor(entity);
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
          ? html`<button class="text-action" ?disabled=${!entity.available || entity.readOnly} @click=${() => this.runAction(entity, action)}>${actionLabel(this.hass, entity, action)}</button>`
          : nothing}
      </div>
    `;
  }

  private areaSummaries(): DashboardAreaSummary[] {
    return Array.isArray(this.config.area_summaries) ? this.config.area_summaries : [];
  }

  private turnOffAllLights = async (): Promise<void> => {
    await this.withFeedback(async () => {
      await turnOffLights(this.hass, this.config.entities || []);
    });
  };

  private async runAction(entity: NormalizedEntity, action: EntityAction): Promise<void> {
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

function actionFor(entity: NormalizedEntity): EntityAction | "" {
  if (["light", "switch", "fan"].includes(entity.domain)) return "toggle";
  if (["scene", "script", "automation"].includes(entity.domain)) return "activate";
  if (entity.domain === "button") return "press";
  return "";
}

function actionLabel(hass: HomeAssistant | undefined, entity: NormalizedEntity, action: EntityAction): string {
  if (action === "activate") return localize(hass, "action.activate");
  if (action === "press") return localize(hass, "action.press");
  return entity.state === "on" ? localize(hass, "action.turn_off") : localize(hass, "action.turn_on");
}

function iconForKind(kind: DashboardCardKind): string {
  return (
    {
      hero: "mdi:home-lightbulb",
      light: "mdi:lightbulb-group",
      rooms: "mdi:floor-plan",
      room: "mdi:home-variant",
      routines: "mdi:movie-open-play",
      health: "mdi:heart-pulse"
    }[kind] ?? "mdi:view-dashboard"
  );
}

function metricsFor(hass: HomeAssistant | undefined, kind: DashboardCardKind, summary: DashboardCardSummary, areas: DashboardAreaSummary[]): Metric[] {
  const areaIssues = areas.reduce((count, area) => count + area.issueCount, 0);
  const totalAreaEntities = areas.reduce((count, area) => count + area.entityCount, 0);
  if (kind === "health") {
    return [
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "ok" },
      { value: summary.unknown.length, label: localize(hass, "metric.unknown"), tone: "neutral" },
      { value: summary.entities.length, label: localize(hass, "metric.entities"), tone: "neutral" }
    ];
  }
  if (kind === "rooms" || kind === "room") {
    return [
      { value: areas.length, label: localize(hass, "metric.rooms"), tone: "neutral" },
      { value: totalAreaEntities || summary.entities.length, label: localize(hass, "metric.entities"), tone: "ok" },
      { value: areaIssues || summary.issues.length, label: localize(hass, "metric.issues"), tone: areaIssues || summary.issues.length ? "warn" : "neutral" }
    ];
  }
  if (kind === "routines") {
    return [
      { value: summary.routines.length, label: localize(hass, "metric.routines"), tone: "ok" },
      { value: summary.entities.filter((entity) => entity.domain === "scene").length, label: localize(hass, "metric.scenes"), tone: "neutral" },
      { value: summary.entities.filter((entity) => entity.domain === "button").length, label: localize(hass, "action.press"), tone: "neutral" }
    ];
  }
  if (kind === "hero") {
    return [
      { value: summary.entities.length, label: localize(hass, "metric.entities"), tone: "neutral" },
      { value: summary.activeLights.length, label: localize(hass, "metric.lights_on"), tone: "hot" },
      { value: areas.length, label: localize(hass, "metric.rooms"), tone: "ok" },
      { value: summary.issues.length, label: localize(hass, "metric.issues"), tone: summary.issues.length ? "warn" : "neutral" }
    ];
  }
  return [
    { value: summary.activeLights.length, label: localize(hass, "metric.lights_on"), tone: "hot" },
    { value: summary.lights.length, label: localize(hass, "metric.lights"), tone: "neutral" },
    { value: summary.controllable.length, label: localize(hass, "metric.controls"), tone: "ok" }
  ];
}
