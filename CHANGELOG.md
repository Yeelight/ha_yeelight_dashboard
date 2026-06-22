# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-06-22

### Added
- Home Assistant Community Dashboard Strategy registration through `window.customStrategies`.
- HA-native generated `sections` and managed `canvas` dashboard modes.
- Yeelight product dashboard cards with HA visual editor support.
- Legacy widget migration inventory and subtype-based product card mapping.
- Release validation for frontend-only HACS resource packaging, documentation, and live-smoke entry points.

### Changed
- Document first-use behavior explicitly: installation registers the frontend resource but does not auto-create a Home Assistant dashboard.
- Document the optional `ha_yeelight_themes` dependency and default theme fallback behavior.
- Product-card aggregate controls now prefer stable Home Assistant native routes such as entity registry, area dashboard, scene dashboard, lighting, security, history, media browser, and repairs.
- Product-card entity rows, titles, and body areas now open Home Assistant native more-info dialogs instead of limiting details to icon-only clicks.

### Fixed
- Strategy Editor `config-changed` events now preserve `strategy.type: custom:yeelight-dashboard`, avoiding Home Assistant's "No type provided" validation error after visual edits.
- Live resource smoke now checks the installed `/local/ha_yeelight_dashboard.js` hash against the built `dist/` bundle before validating Lovelace resource registration.

### Removed
- Removed outdated backend panel/API release notes that do not apply to this frontend-only dashboard strategy package.
