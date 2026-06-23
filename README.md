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
| `ha_yeelight_dashboard` | Product-style generated dashboard, strategy editor, recipes, internal dashboard cards, and legacy-derived product subtypes. |

## Current MVP

- Registers `ll-strategy-dashboard-yeelight-dashboard`.
- Registers `window.customStrategies` metadata for the HA 2026.5+ Community dashboards picker.
- Generates HA `sections` views for Overview, Lighting, Areas, Scenes, Environment, Media, and Health.
- Supports `layout_mode: canvas` through `custom:yeelight-dashboard-canvas-view`; Home Assistant still creates and owns card elements, while the view arranges them from card-level `view_layout` data and exposes visual move/resize controls.
- Reads Area, Floor, Device, Entity, and Label registries through standard `hass.callWS`.
- Reads live state from `hass.states`.
- Identifies Yeelight entities through `entityRegistry.platform === "yeelight_pro"` or device metadata, never through friendly-name keywords.
- Provides product composite cards such as `custom:yeelight-dashboard-hero-card`, `status-card`, `notice-card`, `light-card`, `rooms-card`, `room-card`, `devices-card`, `routines-card`, `environment-card`, `climate-card`, `air-card`, `water-card`, `power-card`, `energy-card`, `infrastructure-card`, `media-card`, `camera-card`, `camera-wall-card`, `security-card`, `presence-card`, `panel-actions-card`, `image-card`, `note-card`, `ecosystem-card`, and `health-card`; they register HA visual editors through `window.customCards` for take-control/manual editing, but remain dashboard-focused and do not replace the lightweight `ha_yeelight_cards` package.
- Migrates high-value legacy widgets as card `subtype` modes instead of reintroducing the old runtime. This includes the original core modes such as panel hero, time, daily quote, favorite lights, light status, device list/single, quick scenes, scripts, automations, weather, illuminance, updates, events and history, plus the media/camera/security/presence/climate/air/water/power/energy/infrastructure/panel-actions/image/note families.
- Every migrated product subtype is exposed through the HA visual card editor, with localized labels, recommended entity domains, grid sizing, display presets, HA's right-side card preview, and a compact section-size preview. HA-native media, camera, weather, sensor, area, cover, vacuum, calendar, todo, logbook, map, history and energy capabilities remain native recipes where appropriate.
- The old generated inventory was used for migration and is no longer shipped; coverage is now locked by subtype and recipe tests.

## Installation

`ha_yeelight_dashboard` is a frontend dashboard strategy. Installing the resource registers the strategy and dashboard cards, but it does not create a dashboard automatically. Create one Yeelight dashboard after the resource is loaded; from that point the strategy generates views and cards from the current Home Assistant registries and `hass.states`.

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

First use on Home Assistant 2026.5+:

1. Install the resource through HACS or add the manual resource above.
2. Reload the browser so HA loads the module.
3. Go to dashboards, create a new dashboard, and choose `Yeelight Dashboard` under `Community dashboards`.
4. Use the Strategy Editor to choose the profile, theme, scope, visible views, area selection, and `sections` or `canvas` layout.

YAML fallback:

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

Default `sections` dashboards use Home Assistant's native section editing, drag ordering, and card sizing. For closer-to-freeform positioning, use `layout_mode: canvas` or the Panel profile. Managed Canvas keeps the dashboard generated while preserving layout freedom: every generated card gets a stable key, a visible move handle, a resize handle, and numeric `x/y/w/h/z` controls. Layout Studio copies a complete JSON snippet; use `Import copied Canvas layout` in the Strategy Editor, or edit `layout_overrides` manually:

```json
{
  "layout_mode": "canvas",
  "layout_overrides": {
    "overview": {
      "overview.hero": { "x": 0, "y": 0, "w": 12, "h": 4 }
    }
  }
}
```

On Home Assistant 2026.5+, the strategy is also exposed in the new dashboard dialog under Community dashboards after the resource is loaded.

The default profile uses the `Yeelight Minimal` theme from `ha_yeelight_themes`. The dashboard remains usable without the theme package; Home Assistant will fall back to the active/default theme variables, and the Strategy Editor shows a notice when the selected Yeelight theme is not available.

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

## License

MIT License
