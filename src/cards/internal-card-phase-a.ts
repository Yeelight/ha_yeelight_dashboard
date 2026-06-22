import { html, nothing, type TemplateResult } from "lit";

import { localize, stateText } from "../i18n";
import { fireMoreInfo } from "./actions";
import type { DashboardCardSummary, HomeAssistant, NormalizedEntity } from "./types";

export type PhaseARenderHost = HTMLElement & {
  hass?: HomeAssistant;
};

export function renderMediaBoard(host: PhaseARenderHost, summary: DashboardCardSummary, subtype: string | undefined, limit: number): TemplateResult {
  const media = pickByDomain(summary.entities, ["media_player", "remote"]).slice(0, limit);
  if (!media.length) return empty(host, "empty.no_media");
  const primary = media[0];
  const stats = mediaStats(host, media);
  return html`
    <div class=${`media-board subtype-${subtype || "hub"}`}>
      <button class="media-feature" type="button" @click=${() => fireMoreInfo(host, primary.entityId)}>
        <span class=${`media-art ${entityPicture(primary) ? "has-image" : ""}`}>
          ${entityPicture(primary) ? html`<img src=${entityPicture(primary)} alt=${primary.name} loading="lazy" />` : html`<ha-icon .icon=${primary.icon}></ha-icon>`}
        </span>
        <span class="media-copy">
          <span>${mediaKicker(host, subtype, primary)}</span>
          <strong>${mediaTitle(primary) || primary.name}</strong>
          <small>${mediaDetail(host, primary)}</small>
        </span>
      </button>
      <div class="media-context">
        ${stats.map((item) => html`<span><ha-icon .icon=${item.icon}></ha-icon><strong>${item.value}</strong><small>${item.label}</small></span>`)}
      </div>
      <div class="media-list">${media.slice(1, limit).map((entity) => renderCompactStatus(host, entity, "media-row"))}</div>
      ${renderSubtypeChips(host, subtype, ["hub", "player", "max-player", "broadcast", "voice", "remote"])}
    </div>
  `;
}

export function renderCameraBoard(host: PhaseARenderHost, summary: DashboardCardSummary, subtype: string | undefined, limit: number): TemplateResult {
  const cameras = pickByDomain(summary.entities, ["camera"]).slice(0, limit);
  if (!cameras.length) return empty(host, "empty.no_cameras");
  const [primary, ...rest] = cameras;
  return html`
    <div class=${`camera-board subtype-${subtype || "overview"}`}>
      <button class="camera-feature" type="button" @click=${() => fireMoreInfo(host, primary.entityId)}>
        <span class="camera-preview">
          <img src=${cameraProxyUrl(primary)} alt=${primary.name} loading="lazy" />
          <span><ha-icon .icon=${primary.icon}></ha-icon>${stateText(host.hass, primary.state)}</span>
        </span>
        <span class="camera-copy">
          <strong>${primary.name}</strong>
          <small>${cameraDetail(host, primary)}</small>
        </span>
      </button>
      ${rest.length ? html`<div class="camera-strip">${rest.slice(0, Math.max(0, limit - 1)).map((entity) => renderCameraThumb(host, entity))}</div>` : nothing}
    </div>
  `;
}

export function renderCameraWallBoard(host: PhaseARenderHost, summary: DashboardCardSummary, limit: number): TemplateResult {
  const cameras = pickByDomain(summary.entities, ["camera"]).slice(0, limit);
  if (!cameras.length) return empty(host, "empty.no_cameras");
  return html`<div class="camera-wall-grid">${cameras.map((entity) => renderCameraThumb(host, entity, true))}</div>`;
}

export function renderSecurityBoard(host: PhaseARenderHost, summary: DashboardCardSummary, subtype: string | undefined, limit: number): TemplateResult {
  const security = securityEntities(summary.entities, subtype).slice(0, limit);
  if (!security.length) return empty(host, "empty.no_security");
  const primary = security[0];
  const groups = securityGroups(host, security);
  return html`
    <div class=${`security-board subtype-${subtype || "overview"}`}>
      <button class=${`security-feature ${securityTone(primary)}`} type="button" @click=${() => fireMoreInfo(host, primary.entityId)}>
        <ha-icon .icon=${primary.icon}></ha-icon>
        <span>
          <small>${localize(host.hass, "label.security_focus")}</small>
          <strong>${primary.name}</strong>
          <em>${stateText(host.hass, primary.state)}</em>
        </span>
      </button>
      <div class="security-groups">
        ${groups.map((group) => html`<span class=${group.tone}><ha-icon .icon=${group.icon}></ha-icon><strong>${group.value}</strong><small>${group.label}</small></span>`)}
      </div>
      <div class="status-list">${security.slice(1, limit).map((entity) => renderCompactStatus(host, entity, "security-row"))}</div>
    </div>
  `;
}

export function renderPresenceBoard(host: PhaseARenderHost, summary: DashboardCardSummary, subtype: string | undefined, limit: number): TemplateResult {
  const presence = presenceEntities(summary.entities, subtype).slice(0, limit);
  if (!presence.length) return empty(host, "empty.no_presence");
  const people = presence.filter((entity) => entity.domain === "person" || entity.domain === "device_tracker");
  const sensors = presence.filter((entity) => !people.includes(entity));
  const groups = presenceGroups(host, presence);
  return html`
    <div class=${`presence-board subtype-${subtype || "motion"}`}>
      <div class="presence-summary">
        ${groups.map((group) => html`<span class=${group.tone}><ha-icon .icon=${group.icon}></ha-icon><strong>${group.value}</strong><small>${group.label}</small></span>`)}
      </div>
      ${people.length ? html`<div class="presence-people">${people.slice(0, 3).map((entity) => renderPresencePerson(host, entity))}</div>` : nothing}
      ${sensors.length ? html`<div class="status-list">${sensors.slice(0, limit).map((entity) => renderCompactStatus(host, entity, "presence-row"))}</div>` : nothing}
    </div>
  `;
}

function renderCameraThumb(host: PhaseARenderHost, entity: NormalizedEntity, large = false): TemplateResult {
  return html`
    <button class=${large ? "camera-thumb large" : "camera-thumb"} type="button" @click=${() => fireMoreInfo(host, entity.entityId)}>
      <span class="camera-thumb-frame">
        <img src=${cameraProxyUrl(entity)} alt=${entity.name} loading="lazy" />
        <ha-icon .icon=${entity.icon}></ha-icon>
      </span>
      <span>${entity.name}</span>
      <small>${stateText(host.hass, entity.state)}</small>
    </button>
  `;
}

function renderCompactStatus(host: PhaseARenderHost, entity: NormalizedEntity, className: string): TemplateResult {
  return html`
    <button class=${`${className} compact-status ${entity.available ? "" : "muted"}`} type="button" @click=${() => fireMoreInfo(host, entity.entityId)}>
      <ha-icon .icon=${entity.icon}></ha-icon>
      <span>
        <strong>${entity.name}</strong>
        <small>${stateText(host.hass, entity.state)}</small>
      </span>
    </button>
  `;
}

function renderPresencePerson(host: PhaseARenderHost, entity: NormalizedEntity): TemplateResult {
  return html`
    <button class="presence-person" type="button" @click=${() => fireMoreInfo(host, entity.entityId)}>
      <ha-icon .icon=${entity.icon}></ha-icon>
      <span>
        <strong>${entity.name}</strong>
        <small>${stateText(host.hass, entity.state)}</small>
      </span>
    </button>
  `;
}

function renderSubtypeChips(host: PhaseARenderHost, subtype: string | undefined, values: string[]): TemplateResult {
  return html`
    <div class="subtype-chips">
      ${values.map((value) => html`<span class=${subtype === value ? "active" : ""}>${localize(host.hass, `editor.subtype.${value}` as Parameters<typeof localize>[1])}</span>`)}
    </div>
  `;
}

function pickByDomain(entities: NormalizedEntity[], domains: string[]): NormalizedEntity[] {
  return entities.filter((entity) => domains.includes(entity.domain));
}

function securityEntities(entities: NormalizedEntity[], subtype: string | undefined): NormalizedEntity[] {
  if (subtype === "alarm") return pickByDomain(entities, ["alarm_control_panel"]);
  if (subtype === "lock") return pickByDomain(entities, ["lock"]);
  if (subtype === "binary-sensor") return pickSecuritySensors(entities);
  return [...pickByDomain(entities, ["alarm_control_panel", "lock"]), ...pickSecuritySensors(entities)];
}

function pickSecuritySensors(entities: NormalizedEntity[]): NormalizedEntity[] {
  return entities.filter((entity) => ["binary_sensor", "sensor"].includes(entity.domain));
}

function presenceEntities(entities: NormalizedEntity[], subtype: string | undefined): NormalizedEntity[] {
  if (subtype === "people" || subtype === "family") return pickByDomain(entities, ["person", "device_tracker"]);
  if (subtype === "tracker") return pickByDomain(entities, ["device_tracker"]);
  return entities.filter((entity) => ["person", "device_tracker", "binary_sensor", "sensor"].includes(entity.domain));
}

function mediaKicker(host: PhaseARenderHost, subtype: string | undefined, entity: NormalizedEntity): string {
  if (subtype === "broadcast") return localize(host.hass, "label.broadcast");
  if (subtype === "voice") return localize(host.hass, "label.voice_assistant");
  if (subtype === "remote" || entity.domain === "remote") return localize(host.hass, "label.remote_control");
  return localize(host.hass, "label.now_playing");
}

function mediaDetail(host: PhaseARenderHost, entity: NormalizedEntity): string {
  const source = firstString(entity.attributes.source, entity.attributes.app_name);
  const volume = volumeText(entity);
  return [stateText(host.hass, entity.state), source, volume].filter(Boolean).join(" · ");
}

function securityTone(entity: NormalizedEntity): string {
  return attentionState(entity) ? "warn" : "ok";
}

function firstString(...values: unknown[]): string {
  return values.find((value): value is string => typeof value === "string" && !!value.trim()) || "";
}

function mediaTitle(entity: NormalizedEntity): string {
  return firstString(entity.attributes.media_title, entity.attributes.media_artist, entity.attributes.app_name);
}

function entityPicture(entity: NormalizedEntity): string {
  return firstString(entity.attributes.entity_picture);
}

function volumeText(entity: NormalizedEntity): string {
  const volume = entity.attributes.volume_level;
  return typeof volume === "number" ? `${Math.round(volume * 100)}%` : "";
}

function mediaStats(host: PhaseARenderHost, entities: NormalizedEntity[]): Array<{ icon: string; label: string; value: number }> {
  return [
    { icon: "mdi:play-circle-outline", label: localize(host.hass, "metric.players"), value: entities.filter((entity) => entity.domain === "media_player").length },
    { icon: "mdi:speaker-wireless", label: localize(host.hass, "metric.playing"), value: entities.filter((entity) => entity.state === "playing").length },
    { icon: "mdi:remote", label: localize(host.hass, "metric.remotes"), value: entities.filter((entity) => entity.domain === "remote").length }
  ];
}

function cameraProxyUrl(entity: NormalizedEntity): string {
  const token = firstString(entity.attributes.access_token);
  return `/api/camera_proxy/${entity.entityId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

function cameraDetail(host: PhaseARenderHost, entity: NormalizedEntity): string {
  const brand = firstString(entity.attributes.brand, entity.attributes.model_name, entity.attributes.friendly_name);
  return brand && brand !== entity.name ? `${stateText(host.hass, entity.state)} · ${brand}` : stateText(host.hass, entity.state);
}

function securityGroups(host: PhaseARenderHost, entities: NormalizedEntity[]): Array<{ icon: string; label: string; value: number; tone: string }> {
  const alarms = entities.filter((entity) => entity.domain === "alarm_control_panel");
  const locks = entities.filter((entity) => entity.domain === "lock");
  const sensors = entities.filter((entity) => entity.domain === "binary_sensor" || entity.domain === "sensor");
  return [
    { icon: "mdi:shield-home", label: localize(host.hass, "metric.alarms"), value: alarms.length, tone: alarms.some(attentionState) ? "warn" : "ok" },
    { icon: "mdi:lock", label: localize(host.hass, "metric.locks"), value: locks.length, tone: locks.some(attentionState) ? "warn" : "ok" },
    { icon: "mdi:shield-alert-outline", label: localize(host.hass, "metric.sensors"), value: sensors.length, tone: sensors.some(attentionState) ? "warn" : "ok" }
  ];
}

function presenceGroups(host: PhaseARenderHost, entities: NormalizedEntity[]): Array<{ icon: string; label: string; value: number; tone: string }> {
  const people = entities.filter((entity) => entity.domain === "person" || entity.domain === "device_tracker");
  const home = people.filter((entity) => entity.state === "home");
  const motion = entities.filter((entity) => entity.domain === "binary_sensor" || entity.domain === "sensor");
  return [
    { icon: "mdi:home-account", label: localize(host.hass, "metric.home"), value: home.length, tone: home.length ? "ok" : "" },
    { icon: "mdi:account-arrow-right", label: localize(host.hass, "metric.away"), value: Math.max(0, people.length - home.length), tone: "" },
    { icon: "mdi:motion-sensor", label: localize(host.hass, "metric.motion"), value: motion.filter(attentionState).length, tone: motion.some(attentionState) ? "warn" : "ok" }
  ];
}

function attentionState(entity: NormalizedEntity): boolean {
  return ["unlocked", "open", "triggered", "on", "detected", "problem"].includes(entity.state);
}

function empty(host: PhaseARenderHost, key: Parameters<typeof localize>[1]): TemplateResult {
  return html`<div class="empty">${localize(host.hass, key)}</div>`;
}
