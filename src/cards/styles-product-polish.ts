import { css } from "lit";

export const dashboardCardProductPolishStyles = css`
  .device-feature ha-icon,
  .device-lane ha-icon,
  .routine-type-chips ha-icon,
  .environment-zone ha-icon,
  .media-context ha-icon,
  .security-groups ha-icon,
  .presence-summary ha-icon,
  .health-hero ha-icon,
  .health-group ha-icon {
    color: var(--yd-accent);
  }

  .device-feature small {
    color: var(--yd-accent);
    font-size: 12px;
    font-weight: 700;
  }

  .device-feature strong {
    color: var(--primary-text-color, #212121);
    font-size: 18px;
    line-height: 1.15;
  }

  .device-feature em {
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
    font-style: normal;
  }

  .device-feature {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: stretch;
    gap: 10px;
    min-height: 96px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 12%, transparent), transparent 70%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .device-feature.muted {
    opacity: 0.7;
  }

  .device-feature-main {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-width: 0;
    border: 0;
    padding: 0;
    color: inherit;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  .device-feature-main > span {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .device-feature-action {
    align-self: center;
    min-height: 40px;
    border: 1px solid color-mix(in srgb, var(--yd-accent) 25%, var(--yd-border));
    border-radius: 8px;
    padding: 0 12px;
    color: var(--yd-accent);
    background: color-mix(in srgb, var(--yd-accent) 9%, transparent);
    font: inherit;
    font-weight: 650;
    white-space: nowrap;
    cursor: pointer;
  }

  .device-lanes,
  .routine-type-chips,
  .environment-zones,
  .health-groups {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .routine-type-chips,
  .environment-zones,
  .health-groups {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .device-lane,
  .routine-type-chips button,
  .routine-type-chips span,
  .environment-zones button,
  .environment-zone,
  .health-group {
    display: grid;
    align-content: center;
    justify-items: start;
    gap: 4px;
    min-width: 0;
    min-height: 72px;
    background: color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  .device-lane strong,
  .routine-type-chips button strong,
  .routine-type-chips strong,
  .environment-zones button strong,
  .environment-zone strong,
  .health-group strong {
    color: var(--primary-text-color, #212121);
    font-size: 20px;
    line-height: 1;
  }

  .device-lane span,
  .routine-type-chips button small,
  .routine-type-chips small,
  .environment-zones button span,
  .environment-zone span,
  .health-group small,
  .health-group em {
    min-width: 0;
    overflow: hidden;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
    font-style: normal;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .device-lane.hot ha-icon {
    color: var(--yl-warm, #f5a623);
  }

  .device-lane.ok ha-icon,
  .health-hero.ok ha-icon,
  .health-group.ok ha-icon {
    color: var(--success-color, #0f9d58);
  }

  .device-lane.warn ha-icon,
  .health-hero.warn ha-icon,
  .health-group.warn ha-icon {
    color: var(--warning-color, #f29900);
  }

  .routine-hero-action.domain-scene {
    --yd-routine-tone: var(--yd-accent);
  }

  .routine-hero-action.domain-script {
    --yd-routine-tone: #5e7ce2;
  }

  .routine-hero-action.domain-automation {
    --yd-routine-tone: #00a37a;
  }

  .routine-hero-action.domain-button,
  .routine-hero-action.domain-schedule {
    --yd-routine-tone: var(--primary-color, #1976d2);
  }

  .routine-hero-action {
    border-color: color-mix(in srgb, var(--yd-routine-tone, var(--yd-accent)) 24%, var(--yd-border));
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-routine-tone, var(--yd-accent)) 13%, transparent), transparent 68%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .routine-feature-main ha-icon,
  .routine-feature-main span {
    color: var(--yd-routine-tone, var(--yd-accent));
  }

  .routine-feature-action {
    color: var(--yd-routine-tone, var(--yd-accent));
    border-color: color-mix(in srgb, var(--yd-routine-tone, var(--yd-accent)) 26%, var(--yd-border));
    background: color-mix(in srgb, var(--yd-routine-tone, var(--yd-accent)) 10%, transparent);
    font-weight: 650;
  }

  .routine-disabled {
    opacity: 0.76;
  }

  .routine-type-chips button,
  .environment-zones button {
    color: inherit;
    font: inherit;
    text-align: left;
  }

  .routine-type-chips span.active,
  .routine-type-chips button.active,
  .environment-zones button.active,
  .environment-zone.active {
    border-color: color-mix(in srgb, var(--yd-accent) 28%, var(--yd-border));
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 7%, transparent), transparent 70%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .device-feature strong,
  .device-feature small,
  .device-feature em,
  .health-hero strong,
  .health-hero small {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .health-hero {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-height: 84px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 10%, transparent), transparent 70%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .health-hero.warn {
    --yd-accent: var(--warning-color, #f29900);
  }

  .health-hero.ok {
    --yd-accent: var(--success-color, #0f9d58);
  }

  .health-hero span {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .health-hero strong {
    color: var(--primary-text-color, #212121);
    font-size: 18px;
    line-height: 1.15;
  }

  .health-hero small {
    color: var(--secondary-text-color, #727272);
    font-size: 13px;
  }

  .health-group {
    min-height: 84px;
  }

  .media-context,
  .security-groups,
  .presence-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .media-context span,
  .security-groups span,
  .presence-summary span {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "icon value"
      "icon label";
    align-items: center;
    gap: 2px 8px;
    min-width: 0;
    min-height: 60px;
    padding: 9px;
    border: 1px solid var(--yd-border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  .media-context ha-icon,
  .security-groups ha-icon,
  .presence-summary ha-icon {
    grid-area: icon;
  }

  .media-context strong,
  .security-groups strong,
  .presence-summary strong {
    grid-area: value;
    color: var(--primary-text-color, #212121);
    font-size: 18px;
    line-height: 1.05;
  }

  .media-context small,
  .security-groups small,
  .presence-summary small {
    grid-area: label;
    min-width: 0;
    overflow: hidden;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .security-groups .warn ha-icon,
  .presence-summary .warn ha-icon {
    color: var(--warning-color, #f29900);
  }

  .security-groups .ok ha-icon,
  .presence-summary .ok ha-icon {
    color: var(--success-color, #0f9d58);
  }

  .media-art {
    overflow: hidden;
  }

  .media-art img,
  .camera-preview img,
  .camera-thumb-frame img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .media-art.has-image {
    background: color-mix(in srgb, var(--yd-accent) 6%, #000);
  }

  .camera-preview {
    position: relative;
    overflow: hidden;
  }

  .camera-preview img {
    position: absolute;
    inset: 0;
  }

  .camera-preview > ha-icon {
    z-index: 1;
  }

  .camera-preview > span {
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 10px;
    display: inline-grid;
    grid-auto-flow: column;
    justify-content: start;
    align-items: center;
    gap: 5px;
    max-width: calc(100% - 20px);
    padding: 5px 8px;
    border-radius: 999px;
    color: white;
    background: color-mix(in srgb, black 52%, transparent);
    font-size: 12px;
  }

  .camera-preview > span ha-icon {
    width: 14px;
    height: 14px;
    color: currentColor;
  }

  .camera-thumb-frame {
    position: relative;
    display: block;
    width: 100%;
    min-height: 58px;
    overflow: hidden;
    border-radius: 6px;
    background: color-mix(in srgb, var(--yd-accent) 9%, var(--yd-surface-muted));
  }

  .camera-thumb-frame ha-icon {
    position: absolute;
    left: 8px;
    bottom: 8px;
    width: 18px;
    height: 18px;
    padding: 4px;
    border-radius: 999px;
    color: white;
    background: color-mix(in srgb, black 48%, transparent);
  }

  @container (max-width: 420px) {
    .device-lanes,
    .routine-type-chips,
    .environment-zones,
    .media-context,
    .security-groups,
    .presence-summary,
    .health-groups {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .device-feature {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;
