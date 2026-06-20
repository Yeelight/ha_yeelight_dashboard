# Yeelight Dashboard

[English](README.md) | [中文](README_zh.md)

Yeelight Dashboard is a Home Assistant Community Dashboard Strategy that generates a complete HA-native Yeelight home dashboard from standard Home Assistant registries and `hass.states`.

It is not a backend device integration, not a runtime dependency on `ha_yeelight_cards`, and not a direct port of the legacy panel runtime.

## Positioning

| Project | Responsibility |
| --- | --- |
| `ha_yeelight_pro` | Yeelight device integration, HA entities, services, and device capabilities. |
| `ha_yeelight_themes` | Yeelight visual tokens and HA theme variables. Recommended, not required. |
| `ha_yeelight_cards` | Lightweight Lovelace cards for manual HA dashboard users. Not required by this dashboard. |
| `ha_yeelight_dashboard` | Product-style generated dashboard, strategy editor, recipes, internal dashboard cards, and legacy migration inventory. |

## Current MVP

- Registers `ll-strategy-dashboard-yeelight-dashboard`.
- Registers `window.customStrategies` metadata for the HA 2026.5+ Community dashboards picker.
- Generates HA `sections` views for Overview, Lighting, Areas, Scenes, Environment, Media, and Health.
- Supports `layout_mode: canvas` through `custom:yeelight-dashboard-canvas-view`; Home Assistant still creates and owns card elements, while the view arranges them from card-level `view_layout` data and exposes visual move/resize controls.
- Reads Area, Floor, Device, Entity, and Label registries through standard `hass.callWS`.
- Reads live state from `hass.states`.
- Identifies Yeelight entities through `entityRegistry.platform === "yeelight_pro"` or device metadata, never through friendly-name keywords.
- Provides internal dashboard cards such as `custom:yeelight-dashboard-hero-card`, `custom:yeelight-dashboard-light-card`, `custom:yeelight-dashboard-room-card`, and `custom:yeelight-dashboard-health-card`.
- Keeps a generated legacy inventory under `docs/legacy-inventory/`.

## Installation

Install the built frontend resource:

```yaml
url: /hacsfiles/ha_yeelight_dashboard/ha_yeelight_dashboard.js
type: module
```

Manual resource path:

```yaml
url: /local/ha_yeelight_dashboard.js
type: module
```

Then create a dashboard with:

```yaml
strategy:
  type: custom:yeelight-dashboard
```

Optional canvas layout mode:

```yaml
strategy:
  type: custom:yeelight-dashboard
  layout_mode: canvas
```

Default `sections` dashboards use Home Assistant's native section editing, drag ordering, and card sizing. For closer-to-freeform positioning, use `layout_mode: canvas` or the Panel profile. Managed Canvas keeps the dashboard generated while preserving layout freedom: every generated card gets a stable key, a visible move handle, a resize handle, and numeric `x/y/w/h/z` controls. Copy the Layout Studio overrides into the strategy editor's `layout_overrides` field to persist those placements:

```yaml
strategy:
  type: custom:yeelight-dashboard
  layout_mode: canvas
  layout_overrides:
    overview:
      overview.hero:
        x: 0
        y: 0
        w: 12
        h: 4
```

On Home Assistant 2026.5+, the strategy is also exposed in the new dashboard dialog under Community dashboards after the resource is loaded.

## Development

```bash
npm install
npm run lint
npm run test
npm run build
npm run test:browser
```

The release bundle is `dist/ha_yeelight_dashboard.js`.

Optional authenticated live Home Assistant smoke:

```bash
HA_LIVE_URL=http://localhost:18124 \
HA_LIVE_STORAGE_STATE=/absolute/path/to/storage-state.json \
npm run test:live
```

Or with one-shot credentials:

```bash
HA_LIVE_URL=http://localhost:18124 \
HA_LIVE_USERNAME=your-user \
HA_LIVE_PASSWORD=your-password \
HA_LIVE_SCREENSHOT=output/playwright/ha-live-smoke.png \
npm run test:live
```

Without `HA_LIVE_URL`, or without both `HA_LIVE_STORAGE_STATE` and credentials, `test:live` exits as a documented skip. The live smoke injects the built bundle into an authenticated HA page and calls the dashboard strategy from `document.querySelector("home-assistant").hass`; it does not create dashboards, call services, or write HA configuration.

After installing the built file into HA as `/config/www/ha_yeelight_dashboard.js` and registering it as a Lovelace resource, verify the real resource path with:

```bash
HA_LIVE_URL=http://localhost:18124 \
HA_LIVE_USERNAME=your-user \
HA_LIVE_PASSWORD=your-password \
npm run test:ha-resource
```

`test:ha-resource` checks that `/local/ha_yeelight_dashboard.js` hashes exactly to `dist/ha_yeelight_dashboard.js`, then opens the Lovelace dashboard path and waits for HA itself to load the resource and expose `window.customStrategies`. It defaults to `/lovelace`; set `HA_LIVE_DASHBOARD_PATH` if your dashboard uses another URL path. Opening the HA 2026 `/home` route is not enough, because that route does not load Lovelace resources.

Both live smoke scripts wait for at least one `hass.states` entry before generating by default. Use `HA_LIVE_MIN_STATES=0` only for intentional empty-state fixtures, `HA_LIVE_TIMEOUT_MS` to tune slow browser navigation, and `HA_LIVE_RESOURCE_TIMEOUT_MS` to tune the upfront `/local/...` resource fetch timeout.

## Legacy Inventory

Regenerate the legacy inventory from the monorepo root:

```bash
node "extensions/ha_yeelight_dashboard/tools/legacy-migrator/scan-legacy-inventory.mjs"
```

The inventory covers the old local implementation under `config/` and `custom_components/yeelight_dashboard/`.

## License

MIT License
