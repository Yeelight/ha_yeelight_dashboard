import { css } from "lit";

export const dashboardCardUtilityStyles = css`
  .utility-board {
    display: grid;
    gap: 8px;
  }

  .panel-actions-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .panel-action,
  .panel-action-feature,
  .utility-row,
  .image-feature,
  .image-thumb,
  .note-content {
    min-width: 0;
    border: 1px solid var(--yd-border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  .panel-action,
  .panel-action-feature,
  .utility-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    min-height: 64px;
    padding: 10px;
    text-align: left;
    color: inherit;
  }

  .panel-action-feature {
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 76px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-action-tone, var(--yd-accent)) 12%, transparent), transparent 68%),
      color-mix(in srgb, var(--yd-surface-muted) 86%, transparent);
  }

  .panel-action {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .panel-action-main {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    min-width: 0;
    width: 100%;
    border: 0;
    padding: 0;
    color: inherit;
    background: transparent;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .panel-action-run {
    justify-self: end;
    max-width: 112px;
    min-height: 32px;
    border: 1px solid color-mix(in srgb, var(--yd-action-tone, var(--yd-accent)) 24%, var(--yd-border));
    border-radius: 8px;
    padding: 0 10px;
    color: var(--yd-action-tone, var(--yd-accent));
    background: color-mix(in srgb, var(--yd-action-tone, var(--yd-accent)) 9%, transparent);
    font: inherit;
    font-size: 12px;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  .panel-action.domain-scene,
  .panel-action-feature.domain-scene {
    --yd-action-tone: var(--yd-accent);
  }

  .panel-action.domain-script,
  .panel-action-feature.domain-script {
    --yd-action-tone: #5e7ce2;
  }

  .panel-action.domain-automation,
  .panel-action-feature.domain-automation {
    --yd-action-tone: #00a37a;
  }

  .panel-action.domain-button,
  .panel-action-feature.domain-button {
    --yd-action-tone: var(--primary-color, #1976d2);
  }

  .panel-action.domain-light,
  .panel-action-feature.domain-light {
    --yd-action-tone: var(--yl-warm, #f6a400);
  }

  .panel-action.domain-switch,
  .panel-action-feature.domain-switch,
  .panel-action.domain-fan,
  .panel-action-feature.domain-fan {
    --yd-action-tone: #0086c9;
  }

  .panel-action-feature em {
    max-width: 96px;
    padding: 5px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--yd-action-tone, var(--yd-accent)) 12%, transparent);
    color: var(--yd-action-tone, var(--yd-accent));
    font-size: 12px;
    font-style: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .density-compact .panel-action,
  .density-compact .panel-action-feature,
  .density-compact .utility-row,
  .density-compact .note-content {
    padding: 8px;
  }

  .panel-action ha-icon,
  .panel-action-feature ha-icon,
  .utility-row ha-icon {
    color: var(--yd-action-tone, var(--yd-accent));
  }

  .panel-action span,
  .panel-action-feature span,
  .utility-row span,
  .image-caption {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .panel-action strong,
  .panel-action small,
  .panel-action-feature strong,
  .panel-action-feature small,
  .utility-row strong,
  .utility-row small,
  .image-caption strong,
  .image-caption small,
  .image-thumb span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .panel-action small,
  .panel-action-feature small,
  .utility-row small,
  .image-caption small {
    color: var(--secondary-text-color, #727272);
  }

  .panel-action:hover,
  .panel-action-feature:hover,
  .utility-row:hover,
  .image-feature:hover,
  .image-thumb:hover {
    border-color: color-mix(in srgb, var(--yd-accent) 40%, var(--yd-border));
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 6%, transparent), transparent 72%),
      color-mix(in srgb, var(--yd-surface-muted) 82%, transparent);
  }

  .panel-action-main:hover strong,
  .panel-action-main:focus-visible strong {
    color: var(--yd-action-tone, var(--yd-accent));
  }

  .panel-action-run:hover {
    border-color: color-mix(in srgb, var(--yd-action-tone, var(--yd-accent)) 42%, var(--yd-border));
    background: color-mix(in srgb, var(--yd-action-tone, var(--yd-accent)) 13%, transparent);
  }

  .panel-action-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
  }

  .panel-action-chips span,
  .panel-action-chip-link {
    display: inline-grid;
    grid-auto-flow: column;
    align-items: center;
    gap: 4px;
    min-width: 0;
    padding: 5px 8px;
    border: 1px solid var(--yd-border);
    border-radius: 999px;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
  }

  .panel-action-chips ha-icon {
    width: 14px;
    height: 14px;
    color: var(--yd-accent);
  }

  .panel-action-note {
    display: grid;
    gap: 3px;
    min-width: 0;
    padding: 10px;
    border: 1px dashed color-mix(in srgb, var(--yd-accent) 32%, var(--yd-border));
    border-radius: 8px;
    background: color-mix(in srgb, var(--yd-accent) 6%, transparent);
  }

  .panel-action-note span {
    color: var(--yd-accent);
    font-size: 12px;
    font-weight: 700;
  }

  .panel-action-note strong,
  .panel-action-note small {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .panel-action-note small {
    color: var(--secondary-text-color, #727272);
  }

  .image-feature,
  .image-thumb {
    display: grid;
    padding: 0;
    overflow: hidden;
    color: inherit;
    text-align: left;
    text-decoration: none;
  }

  .image-feature {
    min-height: 210px;
    position: relative;
  }

  .image-frame {
    position: relative;
    display: block;
    aspect-ratio: 16 / 8;
    min-height: 160px;
    overflow: hidden;
    background: color-mix(in srgb, var(--yd-accent) 8%, var(--yd-surface-muted));
  }

  .image-counter {
    justify-self: start;
    padding: 5px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--yd-accent) 12%, transparent);
    color: var(--yd-accent);
    font-size: 12px;
    font-weight: 600;
  }

  .image-progress {
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 10px;
    height: 3px;
    border-radius: 999px;
    background: color-mix(in srgb, black 24%, transparent);
    overflow: hidden;
  }

  .image-progress i {
    display: block;
    width: var(--image-progress);
    height: 100%;
    border-radius: inherit;
    background: var(--yd-accent);
  }

  .image-frame img,
  .image-thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-caption {
    padding: 10px;
  }

  .image-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .image-dots {
    display: flex;
    justify-content: center;
    gap: 5px;
    min-height: 8px;
  }

  .image-dots span {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--secondary-text-color, #727272) 34%, transparent);
  }

  .image-dots span.active {
    width: 18px;
    background: var(--yd-accent);
  }

  .image-thumb {
    grid-template-rows: 74px auto;
  }

  .image-thumb span {
    padding: 7px 8px;
    color: var(--secondary-text-color, #727272);
    font-size: 12px;
  }

  .note-content {
    display: grid;
    gap: 6px;
    padding: 12px;
    white-space: pre-wrap;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--yd-accent) 5%, transparent), transparent 64%),
      color-mix(in srgb, var(--yd-surface-muted) 88%, transparent);
  }

  .note-content > strong {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 16px;
  }

  .note-kicker {
    color: var(--yd-accent);
    font-size: 12px;
    font-weight: 700;
  }

  .note-lines {
    display: grid;
    gap: 5px;
  }

  .note-content p {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr);
    align-items: start;
    gap: 5px;
    margin: 0;
    line-height: 1.45;
  }

  .note-content p ha-icon {
    width: 18px;
    height: 18px;
    color: var(--yd-accent);
  }

  .note-content p span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .note-content p.done {
    color: var(--secondary-text-color, #727272);
  }

  .note-content p.done span {
    text-decoration: line-through;
    text-decoration-thickness: 1px;
  }

  .note-summary {
    display: inline-grid;
    grid-auto-flow: column;
    justify-content: start;
    align-items: center;
    gap: 5px;
    min-width: 0;
    margin-top: 2px;
    padding: 5px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--yd-accent) 10%, transparent);
    color: var(--yd-accent);
    font-size: 12px;
    font-weight: 700;
  }

  .note-summary ha-icon {
    width: 14px;
    height: 14px;
  }

  .note-content.muted {
    color: var(--secondary-text-color, #727272);
  }

  .note-links {
    display: grid;
    gap: 8px;
  }

  @container (max-width: 430px) {
    .panel-actions-grid,
    .image-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;
