# Legacy Editor Subtypes

This file is the manual companion to the generated legacy inventory. It records legacy card modes that are now user-selectable in the Home Assistant visual card editor.

## Product Card Subtypes

| New card | Visual editor subtypes | Legacy widgets covered |
| --- | --- | --- |
| `custom:yeelight-dashboard-hero-card` | `standard`, `panel`, `time`, `quote` | `hero`, `panel-hero`, `time-card`, `daily-quote-card` |
| `custom:yeelight-dashboard-status-card` | `standard` | `status` |
| `custom:yeelight-dashboard-notice-card` | `standard` | `notice` |
| `custom:yeelight-dashboard-light-card` | `favorites`, `status`, `overview`, `devices` | `favorite-lights`, `light-status-card`, `light-overview-card`, `light-devices` |
| `custom:yeelight-dashboard-room-card` | `single`, `devices` | `room-card`, `room-devices` |
| `custom:yeelight-dashboard-devices-card` | `activity`, `list`, `single`, `universal` | `devices`, `device-list`, `device-single`, `universal-card` |
| `custom:yeelight-dashboard-routines-card` | `quick`, `list`, `commands`, `scripts`, `schedule`, `automations`, `scene-single`, `automation-single`, `script-single`, `button` | `quick-scenes`, `scene-list`, `quick-command-card`, `script-panel`, `schedule`, `automations`, `scene-single-card`, `automation-single-card`, `script-single-card`, `button-card` |
| `custom:yeelight-dashboard-environment-card` | `overview`, `weather`, `sensors`, `illuminance` | `weather`, `weather-card`, `sensor-card`, `illuminance-card` |
| `custom:yeelight-dashboard-health-card` | `overview`, `updates`, `repairs-backup`, `network`, `events`, `history` | `health`, `updates-card`, `repairs-backup-card`, `iot-network-card`, `events`, `history` |

Phase A-D families are also exposed in the same editor through subtype selectors:

| New card | Visual editor subtypes | Legacy widgets covered |
| --- | --- | --- |
| `custom:yeelight-dashboard-media-card` | `hub`, `player`, `max-player`, `broadcast`, `voice`, `remote` | `media`, `media-player-card`, `max-player-card`, `broadcast-radio-card`, `voice-assistant-card`, `remote-card` |
| `custom:yeelight-dashboard-camera-card` | `overview`, `single` | `cameras`, `camera-card` |
| `custom:yeelight-dashboard-camera-wall-card` | `wall` | `camera-wall-card` |
| `custom:yeelight-dashboard-security-card` | `overview`, `alarm`, `lock`, `binary-sensor` | `security`, `alarm-card`, `lock-card`, `binary-sensor-card` |
| `custom:yeelight-dashboard-presence-card` | `motion`, `people`, `family`, `tracker` | `motion-card`, `people`, `family-card`, `device-tracker-card` |
| `custom:yeelight-dashboard-climate-card` | `overview`, `single` | `climate`, `climate-card` |
| `custom:yeelight-dashboard-air-card` | `fan`, `humidifier` | `fan-card`, `humidifier-card` |
| `custom:yeelight-dashboard-water-card` | `purifier` | `water-purifier-card` |
| `custom:yeelight-dashboard-power-card` | `socket`, `electricity` | `socket-card`, `electricity-card` |
| `custom:yeelight-dashboard-energy-card` | `summary`, `insights` | `energy`, `insights` |
| `custom:yeelight-dashboard-infrastructure-card` | `server`, `router`, `nas`, `pve`, `server-list`, `pve-list` | `server-card`, `router-card`, `nas-card`, `pve-card`, `server-devices`, `pve-devices` |
| `custom:yeelight-dashboard-panel-actions-card` | `standard` | `panel-actions` |
| `custom:yeelight-dashboard-image-card` | `single`, `carousel` | `image`, `image-carousel` |
| `custom:yeelight-dashboard-note-card` | `standard` | `text-note` |

## Visual Editor Experience

Each migrated subtype is exposed through the Home Assistant card configuration dialog, not only through YAML:

- The HA `ha-form` content group includes card type, subtype, title, subtitle, and subtype-specific content fields.
- The subtype palette shows the localized mode name plus the legacy widget IDs that were migrated into that mode.
- The mode guide explains the migrated source, recommended entity domains, recommended Sections size, selected/recommended entity counts, and safe action boundary.
- The mode guide can add the current mode's recommended entities in one click, capped by the card's visible item count so beginner users do not accidentally overfill the card.
- Applying a mode preset also applies the recommended subtype, display density, visible item count, and `grid_options`, while preserving the user's selected entities and custom text fields.
- Entity picking remains scoped by subtype-specific domains and semantic filters so HA's picker does not become a noisy list of unrelated entities.

## Native Recipe Boundary

The following legacy widgets intentionally stay HA-native recipe output rather than Yeelight dashboard product cards:

- `switch-devices`, `cover-devices`, `curtain-card`, `sensor-devices`, `vacuum`
- `todos`, `calendar`
- old `ha-*` native card wrappers such as `ha-entities-card`, `ha-weather-card`, `ha-calendar-card`, `ha-history-card`, and energy-native cards

Reason: these are primarily Home Assistant native domain/card capabilities. Rewrapping them as custom Yeelight elements would reduce HA compatibility and duplicate HA's built-in editor.

Current recipe coverage:

- Overview source metadata carries generic old HA layout/content wrappers such as `ha-entities-card`, `ha-tile-card`, `ha-grid-card`, `ha-heading-card`, and `ha-empty-state-card`; these are represented by generated Sections, HA native cards, and empty-state markdown rather than new Yeelight wrappers.
- Lighting view emits native `light` cards and `tile` cards next to the Yeelight lighting product card.
- Areas view emits native `area`, `entities`, `glance`, and `tile` cards for area/device native wrappers, cover/curtain widgets, sensors, switches, and vacuum entities.
- Routines view emits native `calendar` and `todo-list` cards even when no scene/script/automation entities exist.
- Environment view emits native `weather-forecast`, `thermostat`, `humidifier`, `gauge`, `sensor`, and `tile` cards alongside Yeelight environment/product cards.
- Media view emits native `media-control` and `picture-entity` cards; WebRTC and picture-elements legacy wrappers remain intentionally native/optional instead of becoming bundled runtime dependencies.
- Health view emits `text-note` as a `note` product card only when note/reminder-style entities are present, so empty content cards are not forced into generated dashboards.
- Health view emits native `alarm-panel`, `calendar`, `todo-list`, `logbook`, `map`, `history-graph`, `statistics-graph`, `entities`, and `glance` cards when matching entities exist.

`tests/legacy-migration-coverage.test.ts` locks the source mapping for all 145 legacy widgets: dashboard product widgets must map to editor subtypes, and HA-native wrappers must remain present in recipe source coverage.
