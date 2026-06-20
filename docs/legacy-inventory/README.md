# Yeelight Dashboard Legacy Inventory

This directory records the migration inventory for the legacy implementation under:

- `config/`
- `custom_components/yeelight_dashboard/`

Regenerate the inventory from the monorepo root:

```bash
node "extensions/ha_yeelight_dashboard/tools/legacy-migrator/scan-legacy-inventory.mjs"
```

Generated files:

- `legacy-widget-map.json`: per-widget migration target and status.
- `legacy-report.json`: machine-readable scan summary for widgets, Lovelace resources, packages, assets, backend contracts, and files.
- `legacy-card-gallery.md`: human-readable legacy card/widget gallery.
- `legacy-layout-map.md`: legacy Grid/Free layout migration map.
- `legacy-assets-map.md`: static asset migration map.
- `legacy-migration-report.md`: summary report for review.

The first generated inventory is intentionally conservative. It proves coverage and prevents silent loss of legacy work; later implementation tasks can refine individual targets after visual and runtime review.
