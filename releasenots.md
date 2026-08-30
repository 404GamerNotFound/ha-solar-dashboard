# Release Notes — Dashboard Configuration and Sensor Fixes

[![Stars](https://img.shields.io/github/stars/404GamerNotFound/vserver-ssh-stats?style=for-the-badge&logo=github&logoColor=white&label=Stars&color=blue)](https://github.com/404GamerNotFound/vserver-ssh-stats/stargazers)
[![Sponsors](https://img.shields.io/github/sponsors/404GamerNotFound?style=for-the-badge&logo=github&logoColor=white&label=Sponsors&color=blue)](https://github.com/sponsors/404GamerNotFound)
[![PayPal](https://img.shields.io/badge/PayPal-ME-blue?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/paypalme/TonyBrueser)
[![Revolut](https://img.shields.io/badge/Revolut-ME-blue?style=for-the-badge&logo=revolut&logoColor=white)](https://revolut.me/tony1995)

## Summary

This release improves configuration flexibility for the built-in house image, signed battery sensors, battery temperature sensors, and grid-cost calculations. Existing configurations remain compatible; all new settings are optional.

## Garage Roof Solar Array

- Added `show_garage_solar_array` (default: `true`).
- Set it to `false` to hide the decorative PV-module overlay on the garage roof of the built-in single-family-home image.
- The editor now provides a **Show garage solar panels** option in the general display settings.

```yaml
show_garage_solar_array: false
```

## Reversed Signed Battery Flow

- Added `battery_flow_inverted` for the primary signed battery-flow sensor.
- Added `batteries[].flow_inverted` for every additional battery.
- When enabled, a positive signed value is treated as discharging and a negative signed value as charging.
- Separate charge and discharge sensors are unchanged.

```yaml
battery_flow_inverted: true

batteries:
  - label: Garage battery
    level_entity: sensor.garage_battery_soc
    flow_power_entity: sensor.garage_battery_power
    flow_inverted: true
```

## Fahrenheit Battery Temperatures

- Battery-temperature readings now use both `unit_of_measurement` and `native_unit_of_measurement`.
- Fahrenheit source sensors are correctly interpreted, converted internally for Advisor thresholds, and rendered in the configured target unit.
- `units.temperature` controls the displayed temperature unit for battery badges and Advisor values.

```yaml
units:
  temperature: "°F"
```

## Dynamic Electricity Prices and Signed Grid Power

- Added the electricity-price sensor to the grid-cost settings in the editor.
- `entities.electricity_price` accepts the current import price per kWh, for example from Tibber or aWATTar.
- A numeric sensor state takes priority over `grid_import_price`; an unavailable or non-numeric state falls back to the fixed price.
- Dynamic-price cost labels explicitly state that the amount is calculated at the current tariff.
- Documented the existing signed-grid configuration: `entities.import_export_power` uses positive values for grid import and negative values for feed-in. It has priority over separate import and export sensors.

```yaml
entities:
  # Positive = grid import, negative = feed-in
  import_export_power: sensor.grid_power
  # Current price per kWh
  electricity_price: sensor.electricity_price

# Used when the price sensor is unavailable or non-numeric
grid_import_price: 0.32
grid_export_price: 0.082
```

## Technical Changes

- Extended grid-price resolution with a dynamic, validated sensor value and fixed-price fallback.
- Added a distinct translated cost label for the current tariff in English, German, Spanish, French, and Polish.
- Moved electricity-price configuration and automatic editor routing from the Advisor area to the Energy/Grid Cost area.
- Added tests for dynamic-price precedence, fallback behavior, and the current-rate finance label.
- Updated the documentation and regenerated both HACS distributable bundles:
  - `ha-solar-dashboard.js`
  - `ha-solar-dashboard-editor.js`

## Validation

- `npm test`
- `npm run build -- --check`
- HACS package validation passed.
- Domain logic tests passed.
