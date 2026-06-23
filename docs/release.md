# Release Process

`ha_yeelight_dashboard` is a frontend-only Home Assistant dashboard strategy. It is released as a HACS Dashboard/Plugin resource from the GitHub repository; it is not published to npm, so `package.json` may stay `private: true`.

## Version Cadence

- Use SemVer tags such as `v0.1.0`.
- Use `0.x` while the dashboard strategy, editor, and generated recipes are still being hardened with real Home Assistant installs.
- Cut a patch release for HA validation fixes, editor save fixes, card interaction fixes, or HACS packaging corrections.
- Cut a minor release for new product-card families, new generated views, or strategy/editor capabilities.
- Reserve `1.0.0` for the first version whose strategy/editor/card catalog is stable enough for broad end-user installation.

## Pre-Release Checks

Run from the repository root:

```bash
npm run lint
npm test
npm run build
npm run test:browser
npm run validate:release
```

When a local authenticated Home Assistant instance is available, also run:

```bash
HA_LIVE_URL=http://localhost:18124 \
HA_LIVE_USERNAME=<user> \
HA_LIVE_PASSWORD=<password> \
HA_LIVE_MIN_STATES=1 \
npm run test:live

HA_LIVE_URL=http://localhost:18124 \
HA_LIVE_USERNAME=<user> \
HA_LIVE_PASSWORD=<password> \
HA_LIVE_MIN_STATES=1 \
HA_LIVE_DASHBOARD_PATH=/lovelace \
npm run test:ha-resource
```

`test:ha-resource` must verify that `/local/ha_yeelight_dashboard.js` hashes exactly to `dist/ha_yeelight_dashboard.js`.

## GitHub And HACS Steps

1. Ensure `CHANGELOG.md` has a dated section for the release version.
2. Ensure `dist/ha_yeelight_dashboard.js` is built locally and matches the version being tagged. `dist/` is ignored in Git, so the built file must be uploaded as a GitHub Release asset.
3. Keep `.github/workflows/validate.yml` passing with HACS category `plugin`; this is the category HACS uses for frontend dashboard resources.
4. Commit only the dashboard repository changes; do not include unrelated parent repository work.
5. Tag the commit as `v<version>`.
6. Push the branch and tag to GitHub.
7. Let `.github/workflows/release.yml` create/update the GitHub Release, or manually create a GitHub Release from the tag and upload `dist/ha_yeelight_dashboard.js` as the release asset named `ha_yeelight_dashboard.js`. Do not upload a zip file.
8. After GitHub indexes the release, install or update through HACS and verify the resource URL:

```yaml
url: /hacsfiles/ha_yeelight_dashboard/ha_yeelight_dashboard.js
type: module
```

Installation registers the frontend resource and Community Dashboard strategy. It does not automatically create a Home Assistant dashboard for the user.

## HACS Default Store

Before submitting to the HACS default repository list, verify this repository works as a custom HACS repository and that the HACS GitHub Action passes. Submit the repository under the `plugin` category with:

```text
Yeelight/ha_yeelight_dashboard
```
