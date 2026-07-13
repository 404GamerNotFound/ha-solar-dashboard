# Release Notes – Multiple Battery Support

## Summary

This release adds support for multiple home battery storage systems to the HA Solar Dashboard. The currently configured battery remains available automatically as **Battery 1**. Additional batteries can be added directly below it in the visual editor, named individually, and configured with their own Home Assistant entities.

## Highlights

- Added support for multiple home batteries
- Existing battery configuration is automatically used as Battery 1
- Additional batteries can be added and removed in the visual editor
- Each additional battery supports its own sensor entities
- Separate image elements, tiles, and power-flow values for every battery
- Fully backward-compatible with existing configurations

## New Battery Configuration

The following entities can be configured for each additional battery:

- State of charge (SoC)
- Signed battery power flow
- Battery voltage
- Separate charging power
- Separate discharging power
- Minimum or reserve SoC
- Maximum or target SoC
- Battery temperature
- Daily battery cycles

Similar to the existing PV string configuration, every additional battery has its own configuration block with a customizable name and a button for removing the entry.

## Display and Calculations

- Every battery is displayed as a separate element on the house image and as a separate dashboard tile.
- Every additional battery can be positioned independently in the visual layout editor.
- Each battery displays the value of its own SoC sensor.
- Charging and discharging power is calculated and displayed separately for each battery.
- Positive signed power values continue to represent charging, while negative values represent discharging.
- When separate charging and discharging sensors are configured, the currently active power flow is used.
- Unavailable or invalid sensor values only affect the corresponding battery element.

## Technical Changes

- Added a normalized `batteries` configuration list for additional battery storage systems
- Added normalization support for alternative and legacy field names
- Added editor actions for adding and removing batteries
- Extended editor configuration tracking to include additional battery entities
- Added dynamic image and tile metrics for additional batteries
- Added independent layout positions and power-flow calculations for every battery
- Added translations for English, German, Spanish, French, and Polish
- Regenerated distributable bundles:
  - `ha-solar-dashboard.js`
  - `ha-solar-dashboard-editor.js`

## Compatibility

- Existing configurations do not require migration.
- Existing `entities.battery_*` entries remain unchanged and represent Battery 1.
- Additional batteries are optional and are stored in the new `batteries` list.
- Without additional batteries, the dashboard behaves exactly as before.
- No known breaking changes.

## Validation

- JavaScript build passed
- HACS package validation passed
- Domain logic tests passed
- Whitespace and patch validation passed
