# Release Notes — Multiple Battery Fixes

[![Stars](https://img.shields.io/github/stars/404GamerNotFound/ha-solar-dashboard?style=for-the-badge&logo=github&logoColor=white&label=Stars&color=blue)](https://github.com/404GamerNotFound/ha-solar-dashboard/stargazers)
[![Sponsors](https://img.shields.io/github/sponsors/404GamerNotFound?style=for-the-badge&logo=github&logoColor=white&label=Sponsors&color=blue)](https://github.com/sponsors/404GamerNotFound)
[![PayPal](https://img.shields.io/badge/PayPal-ME-blue?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/paypalme/TonyBrueser)
[![Revolut](https://img.shields.io/badge/Revolut-ME-blue?style=for-the-badge&logo=revolut&logoColor=white)](https://revolut.me/tony1995)

## Summary

This release fixes incorrect power-flow readings and unstable layout positions when multiple home batteries are configured. Each battery keeps its own readings and a unique internal identity, while system-wide calculations continue to use the combined net flow.

## Independent Battery Readings

- Battery 1 now displays only its own charging or discharging power, instead of the net power of all configured batteries.
- Additional batteries retain their own independent power-flow readings.
- A missing or unavailable Battery 1 power sensor no longer causes another battery's power to appear on its tile.
- Simultaneous charging and discharging remain visible per battery, even when their combined net flow is zero.

## Stable Battery Layout

- Unset positions stay unset across repeated editor and dashboard normalization. They no longer turn into 4% coordinates and stack battery boxes in the upper-left corner.
- Batteries with identical names or colliding sanitized IDs receive unique internal IDs, keeping DOM updates and position lookups separate.
- Hiding another battery no longer changes the configuration index used for automatic positioning.
- Automatic horizontal positions are capped at the supported image boundary in the dashboard and editor.

## Technical Changes

- Made battery-coordinate normalization preserve empty, null, and omitted values while clamping explicit numeric positions.
- Added deterministic ID collision handling that reserves existing IDs before generating suffixes.
- Separated per-battery power sensor lookup and rendering from system-wide net-flow aggregation.
- Based automatic position lookup on the complete normalized battery configuration.
- Added regression coverage for normalization round trips, colliding IDs, opposing flows, W/kW conversion, unavailable sensors, and hidden-battery positioning.
- Updated the technical multi-battery documentation and regenerated both HACS bundles.
- Updated the package and runtime version to `2.3.10`.

## Compatibility

- Existing primary and additional battery configurations remain supported.
- System-wide battery net-flow calculations remain available.
- No configuration migration is required.
- Positions previously saved explicitly as 4% cannot be distinguished from intentional positions. Adjust those positions in the editor if needed.

## Validation

- `npm run build`
- `npm test` — HACS package validation and domain logic tests
- `node scripts/build.mjs --check`
- `git diff --check`
- No live Home Assistant installation test was performed.

## Support

If you enjoy the project, you can support its continued development through [GitHub Sponsors](https://github.com/sponsors/404GamerNotFound), [PayPal](https://www.paypal.com/paypalme/TonyBrueser), or [Revolut](https://revolut.me/tony1995).

**Full Changelog**: https://github.com/404GamerNotFound/ha-solar-dashboard/compare/v2.3.9...v2.3.10
