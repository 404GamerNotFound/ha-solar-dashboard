# Release Notes - EV, Garden & Navigation

## Summary

This release introduces two fully redesigned dashboard areas and a refreshed navigation experience for the HA Solar Dashboard Card. The EV area has been rebuilt around evcc/EVCC workflows, while the new Garden area covers irrigation, weather, mower status, and garden devices. The main card tab design has also been reworked for a cleaner and more responsive layout.

## Highlights

- Fully redesigned EV dashboard area
- Fully redesigned Garden dashboard area
- Updated tab navigation and responsive header layout
- Page-specific setup wizard in the editor
- More control over which values appear on images and as tiles

## EV / EVCC

- Added a new standalone EV dashboard area.
- Added evcc loadpoint configuration via `electric_vehicle.evcc_loadpoint` and `electric_vehicle.evcc_prefix`.
- Added automatic mapping for common marq24/ha-evcc entities, including charge power, charge mode, PV status, grid power, and home battery values.
- Added EVCC charge mode controls for Off, PV, Min+PV, and Fast.
- Added new EVCC site and loadpoint values, including:
  - Vehicle status, connected state, and charging state
  - Vehicle SoC, target SoC, and range
  - Charge power, charge current, and session energy
  - Grid power, PV power, and home consumption
  - Home battery SoC, home battery power, and battery discharge control
- Added per-entity EVCC display settings:
  - Show or hide as a badge on the vehicle image
  - Show or hide as a tile below the image
  - Show on mobile only, desktop only, or both
  - Configure tile order
  - Configure image badge position
- Added custom day and night images for the EV area.

## Garden

- Added a new standalone Garden dashboard area.
- Added support for garden status, weather, soil values, water values, mower status, and garden devices.
- Added configurable irrigation zones via `garden.zones[]`.
- Irrigation zones can be shown as markers on the garden image and as tiles below the image.
- Added manual garden actions via `garden.manual_actions[]`, such as script, button, or switch actions.
- Safer default behavior: zone clicks open Home Assistant More Info instead of toggling directly.
- Optional direct toggling per zone via `toggle: true`.
- Added custom day and night images for the Garden area.

## Navigation & Design

- Reworked the tab navigation and stretched it across the full card width.
- Tabs show both icon and title when enough space is available.
- Tabs automatically fall back to icon-only mode on narrow layouts.
- The title is shown at the top.
- Tabs are shown below the title.
- The Live/time-range selector and house selector are shown below the tabs.
- Improved responsive behavior for narrow dashboard and editor views.

## Setup Wizard

- The global setup wizard remains available on the Setup tab.
- Added page-specific setup wizards for:
  - Energy
  - Devices
  - EV
  - Garden
  - Advisor
- Suggestions are filtered per page and only applied to the current area.
- Suggestions that exactly match an already configured entity are no longer shown.

## Technical Changes

- Added normalization for `electric_vehicle.display.<key>` with the modes `hidden`, `mobile`, `desktop`, and `both`.
- Extended the EVCC entity model with loadpoint, site, and control entities.
- Added new rendering logic for EVCC badges, EVCC tiles, and device-specific visibility.
- Extended the layout editor so all EVCC definitions can be positioned as image badges.
- Added Garden normalization for zones, manual actions, and image variants.
- Added Home Assistant interactions for:
  - Opening More Info
  - Toggling entities
  - Triggering service/button actions
- Added scope filtering to the setup wizard per editor page.
- Rebuilt the main card header and tab layout structure.
- Extended i18n files for the new editor and dashboard labels.
- Regenerated distributable bundles:
  - `ha-solar-dashboard.js`
  - `ha-solar-dashboard-editor.js`

## Compatibility

- Existing configurations remain compatible.
- No known breaking changes.
- The existing house view, energy tiles, and previous wallbox entities are preserved.
- The new EV and Garden features are optional and can be configured incrementally.

## Validation

- `npm run build`
- `npm test`
- HACS package validation passed
- Domain logic tests passed

