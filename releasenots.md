# Release Notes — Custom Rain Images & Gas Overlay Controls

[![Stars](https://img.shields.io/github/stars/404GamerNotFound/ha-solar-dashboard?style=for-the-badge&logo=github&logoColor=white&label=Stars&color=blue)](https://github.com/404GamerNotFound/ha-solar-dashboard/stargazers)
[![Sponsors](https://img.shields.io/github/sponsors/404GamerNotFound?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/404GamerNotFound)
[![PayPal](https://img.shields.io/badge/PayPal-ME-blue?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/paypalme/TonyBrueser)
[![Revolut](https://img.shields.io/badge/Revolut-ME-blue?style=for-the-badge&logo=Revolut&logoColor=white)](https://revolut.me/tony1995)

## Summary

This release adds explicit custom rain images for day and night and repairs the gas/smoke overlay. Gas values can now remain visible without rendering the smoke graphic. Existing configurations remain compatible; all new settings are optional.

## Custom Rain Images

The card now offers direct fields for separate rainy night and rainy day house images. Configure them in the editor or with the following YAML:

~~~yaml
weather_entity: weather.home
image: /local/solar/house_night.png
day_image: /local/solar/house_day.png
rain_image: /local/solar/house_night_rainy.png
day_rain_image: /local/solar/house_day_rainy.png
~~~

- `rain_image` is preferred for rainy nighttime conditions.
- `day_rain_image` is preferred during daylight.
- Rain-related states such as `rainy`, `pouring`, and `lightning-rainy` use the configured rain images first.
- The existing `_rainy` filename convention remains as a fallback, followed by normal custom and bundled images.
- A single configured rain image can be used as the fallback for the other time of day.

Fixes #38.

## Gas Overlay Without Smoke

The bundled smoke asset now has a clean transparent background in both PNG and WebP formats. The gas reading can be displayed independently of the smoke graphic:

~~~yaml
image_overlays:
  smoke:
    enabled: true
    show_image: false
    entity: sensor.zaehlerstand_2
    period: 1h
~~~

- `enabled: true` keeps the gas reading and dashboard tile active.
- `show_image: false` hides only the visual smoke overlay.
- The on-image Gas badge and footer tile remain available according to their label-visibility settings.
- The editor now exposes a dedicated **Show image** control for image overlays.

Fixes #37.

## Technical Changes

- Added explicit custom rain-image resolution with day/night-aware fallback ordering.
- Added regression coverage for custom rain images and rendering gas values without an image element.
- Replaced the smoke image assets with transparent PNG and WebP variants.
- Added the `image_overlays.<overlay>.show_image` setting, defaulting to `true` for compatibility.
- Updated English, German, Spanish, French, and Polish editor translations.
- Updated English and German documentation.
- Regenerated the HACS distributable bundles:
  - `ha-solar-dashboard.js`
  - `ha-solar-dashboard-editor.js`

## Compatibility

- Existing weather-image suffixes and custom house images continue to work unchanged.
- Existing smoke and heat-pump overlays continue to show their images unless `show_image` is explicitly set to `false`.
- No migration is required.
- No known breaking changes.

## Validation

- `npm run build`
- `npm test`
- JavaScript syntax validation passed.
- HACS package validation passed.
- Domain logic tests passed.

## Support

If you enjoy the project, you can support its continued development through [GitHub Sponsors](https://github.com/sponsors/404GamerNotFound), [PayPal](https://www.paypal.com/paypalme/TonyBrueser), or [Revolut](https://revolut.me/tony1995).

**Full Changelog**: https://github.com/404GamerNotFound/ha-solar-dashboard/compare/v2.3.8...v2.3.9
