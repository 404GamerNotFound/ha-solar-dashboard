# Release Notes - Configuration UI Redesign

## Summary

This release redesigns the card configuration editor to make complex setups easier to scan, navigate, and maintain. No configuration options were removed; the existing editor bindings and Home Assistant config update flow remain intact.

## What Changed

- Reworked the editor into a clearer two-column layout with a persistent section navigation and a main workspace.
- Added a compact overview header showing the active section, configured values, configured items, and missing entities.
- Grouped energy-related configuration into logical sections:
  - Solar and inverter
  - Storage and charging
  - Grid and consumption
- Converted long configuration blocks into collapsible sections for:
  - Energy boxes
  - Image overlays
  - Environment sensors
  - Additional large consumers
  - Custom KPI tiles
- Added per-block status summaries so users can quickly see configured, hidden, advanced, or missing values before opening a section.
- Improved responsive behavior for smaller editor dialogs and mobile-sized screens.
- Reduced visual density with more consistent spacing, card headers, field grids, and status badges.

## Technical Details

- Added editor helpers for persisted open/closed section state and configuration status aggregation.
- Added metric grouping logic in the editor renderer without changing the existing metric model.
- Preserved all existing `data-path` and `data-action` bindings so the current configuration update behavior continues to work.
- Updated the standalone editor bundle path to receive `htmlTag` and `rawHtml` explicitly through the editor factory, matching the embedded card bundle behavior.
- Regenerated the distributable bundles:
  - `ha-solar-dashboard.js`
  - `ha-solar-dashboard-editor.js`

## Compatibility

- Breaking changes: none.
- Existing YAML/card configurations remain compatible.
- Existing editor functionality is retained and reorganized only at the UI layer.

## Validation

- `npm run build`
- `npm test`
- HACS package validation passed.
- Domain logic tests passed.
- Additional render sanity check confirmed that the generated editor bundle registers and renders the new overview, shell layout, metric groups, and collapsible configuration sections.
