# HA Solar Dashboard Card

A custom Home Assistant Lovelace card for HACS that renders a modern PV/energy overview with an image-based layout.

## Example

![HA Solar Dashboard Card example](https://raw.githubusercontent.com/404GamerNotFound/ha-solar-dashboard/main/example2.png)

## Features

- Hero background image (your house/pv design)
- Automatic day image variants via `sun.sun`: day uses `*_day.png`, night uses the standard image
- Overlay widgets placed on matching points in the image
- Selectable house layouts from the `images` folder:
  - `single_family_home`
  - `duplex_house`
  - `terraced_middle_house`
  - `apartment_building`
  - `apartment_building_balcony_solar`
  - `bungalow`
  - `city_villa`
  - `city_villa_pitched_roof`
- Configurable entities for:
  - Roof PV
  - Shed PV
  - Battery
  - Inverter power
  - EV charger power
  - PV Total (summary tile below the image)
- Individual HUD and summary boxes can be hidden when a device is not present, for example no Wallbox
- Custom standard and daylight images
- Free X/Y positioning for every overlay box
- Localized card and editor labels based on the Home Assistant language (`en`, `de`, `es`, `fr`, `pl`)
- Dark glass style matching the provided design

## Installation (HACS)

1. Add this repository as a **Custom repository** in HACS with type **Dashboard**. HACS calls Lovelace cards "Dashboard" in the UI.
2. Install **HA Solar Dashboard Card**.
3. Restart Home Assistant (or reload resources).
4. Add the card in Lovelace.

## Lovelace resource (if needed)

```yaml
url: /hacsfiles/ha-solar-dashboard/ha-solar-dashboard.js
type: module
```

## Example configuration

```yaml
type: custom:ha-solar-dashboard-card
title: Solar Dashboard
time_label: Live
house: single_family_home
show_house_selector: true
entities:
  pv_roof_power: sensor.pv_dach_leistung
  pv_shed_power: sensor.pv_schuppen_leistung
  battery_level: sensor.batterie_soc
  inverter_power: sensor.wechselrichter_leistung
  wallbox_power: sensor.wallbox_leistung
  pv_total_power: sensor.pv_gesamt_leistung
  import_export_power: sensor.netzbezug_einspeisung
visible_boxes:
  wallbox_power: false
positions:
  pv_roof_power:
    left: 64
    top: 28
weather_entity: weather.home
image: /local/solar/house_night.png
day_image: /local/solar/house_day.png
units:
  power: auto
  battery: "%"
power_display_mode: auto_kw
power_decimals: 2
```

## Card options

- `title` (string, default: `Energy Flow`)
- `time_label` (string, default: `Live`)
- `house` (string, default: `single_family_home`; options: `single_family_home`, `duplex_house`, `terraced_middle_house`, `apartment_building`, `apartment_building_balcony_solar`, `bungalow`, `city_villa`, `city_villa_pitched_roof`; legacy German values are still accepted as aliases)
- `show_title` (boolean, default: `true`; shows/hides the title)
- `show_time_label` (boolean, default: `true`; shows/hides the live label)
- `show_house_selector` (boolean, default: `true`)
- `show_metric_tiles` (boolean, default: `true`; shows/hides the summary boxes below the image)
- `show_status_label` (boolean, default: `true`; shows/hides the subtle bottom-right image label with last update and optional import/export)
- `show_weather_status` (boolean, default: `false`; adds the current weather state to the bottom-right status label)
- `daylight_entity` (string, default: `sun.sun`; uses `_day` images during the day and standard images before sunrise/after sunset)
- `weather_entity` (string, optional; uses weather-specific image suffixes when present, for example `_sunny`, `_rainy`, `_cloudy`, `_snowy`, `_thunderstorm`)
- `image` (string, optional custom standard/night image; supports `/local/...` or `https://...`)
- `day_image` (string, optional custom daylight image used when `daylight_entity` indicates daylight)
- `visible_boxes.<entity_key>` (boolean, default: `true`; set to `false` to hide one HUD box and its summary tile; supported keys are `pv_roof_power`, `pv_shed_power`, `pv_total_power`, `battery_level`, `inverter_power`, and `wallbox_power`)
- `boxes.<entity_key>` (boolean, legacy alias for `visible_boxes.<entity_key>`)
- `positions.<entity_key>.left` / `positions.<entity_key>.top` (number, optional percentage overrides from `4` to `96`)
- `entities.pv_roof_power` (entity id)
- `entities.pv_shed_power` (entity id)
- `entities.pv_total_power` (entity id; shown as `PV Total` in the summary boxes below the image)
- `entities.battery_level` (entity id)
- `entities.inverter_power` (entity id)
- `entities.wallbox_power` (entity id)
- `entities.import_export_power` (entity id, optional; positive values are shown as `Import`, negative values as `Export`)
- `units.power` (string, default: `auto`; power values are shown in `W` below `1000 W` and in `kW` with two decimals from `1000 W`)
- `units.battery` (string, default: `%`)
- `units.<entity_key>` (string, optional; overrides the unit for a single metric, for example `units.wallbox_power: W`; `auto` respects Home Assistant units such as `W`, `kW`, and `kWh`)
- `power_display_mode` (string, default: `auto_kw`; options: `raw`, `auto_kw`)
- `power_decimals` (number, default: `2`; used for kW values in `auto_kw` mode, range: `0`-`3`)

The card automatically follows the active Home Assistant language for built-in UI labels, status text, weather labels, and editor labels. Supported languages are English, German, Spanish, French, and Polish. Configuration keys, entity keys, and image file names remain English for compatibility and maintainability.

## Image naming scheme

Built-in images are grouped by house key and use English file names so the card stays easy to maintain for an open-source audience.

- Standard/night image: `<house>/<house>.png`, for example `single_family_home/single_family_home.png`
- Day image: `<house>/<house>_day.png`, for example `single_family_home/single_family_home_day.png`
- Weather image: `<house>/<base>_<weather_suffix>.png`, for example `single_family_home/single_family_home_day_sunny.png`

When `weather_entity` is configured, the card tries weather-specific files first and falls back automatically when a file does not exist. During daylight it tries `<house>/<house>_day_<weather_suffix>.png`, then `<house>/<house>_<weather_suffix>.png`, then the normal day and standard images. At night the same logic starts with `<house>/<house>_<weather_suffix>.png` and then falls back to the day weather image.

## Built-in image overview

The previews below are intentionally small so the README stays lightweight while still showing the available variants.

### `single_family_home`

<table>
  <tr>
    <th>Variant</th>
    <th>File</th>
    <th>Preview</th>
  </tr>
  <tr>
    <td>Standard/night</td>
    <td><code>single_family_home.png</code></td>
    <td><img src="images/single_family_home/single_family_home.png" width="96" alt="single_family_home"></td>
  </tr>
  <tr>
    <td>Day</td>
    <td><code>single_family_home_day.png</code></td>
    <td><img src="images/single_family_home/single_family_home_day.png" width="96" alt="single_family_home_day"></td>
  </tr>
  <tr>
    <td>Sunny day</td>
    <td><code>single_family_home_day_sunny.png</code></td>
    <td><img src="images/single_family_home/single_family_home_day_sunny.png" width="96" alt="single_family_home_day_sunny"></td>
  </tr>
  <tr>
    <td>Cloudy day</td>
    <td><code>single_family_home_day_cloudy.png</code></td>
    <td><img src="images/single_family_home/single_family_home_day_cloudy.png" width="96" alt="single_family_home_day_cloudy"></td>
  </tr>
  <tr>
    <td>Cloudy standard/night</td>
    <td><code>single_family_home_cloudy.png</code></td>
    <td><img src="images/single_family_home/single_family_home_cloudy.png" width="96" alt="single_family_home_cloudy"></td>
  </tr>
  <tr>
    <td>Rainy day</td>
    <td><code>single_family_home_day_rainy.png</code></td>
    <td><img src="images/single_family_home/single_family_home_day_rainy.png" width="96" alt="single_family_home_day_rainy"></td>
  </tr>
  <tr>
    <td>Rainy standard/night</td>
    <td><code>single_family_home_rainy.png</code></td>
    <td><img src="images/single_family_home/single_family_home_rainy.png" width="96" alt="single_family_home_rainy"></td>
  </tr>
  <tr>
    <td>Thunderstorm day</td>
    <td><code>single_family_home_day_thunderstorm.png</code></td>
    <td><img src="images/single_family_home/single_family_home_day_thunderstorm.png" width="96" alt="single_family_home_day_thunderstorm"></td>
  </tr>
  <tr>
    <td>Thunderstorm standard/night</td>
    <td><code>single_family_home_thunderstorm.png</code></td>
    <td><img src="images/single_family_home/single_family_home_thunderstorm.png" width="96" alt="single_family_home_thunderstorm"></td>
  </tr>
  <tr>
    <td>Snowy day</td>
    <td><code>single_family_home_day_snowy.png</code></td>
    <td><img src="images/single_family_home/single_family_home_day_snowy.png" width="96" alt="single_family_home_day_snowy"></td>
  </tr>
  <tr>
    <td>Snowy standard/night</td>
    <td><code>single_family_home_snowy.png</code></td>
    <td><img src="images/single_family_home/single_family_home_snowy.png" width="96" alt="single_family_home_snowy"></td>
  </tr>
  <tr>
    <td>Snow standard/night</td>
    <td><code>single_family_home_snow.png</code></td>
    <td><img src="images/single_family_home/single_family_home_snow.png" width="96" alt="single_family_home_snow"></td>
  </tr>
  <tr>
    <td>Winter day</td>
    <td><code>single_family_home_day_winter.png</code></td>
    <td><img src="images/single_family_home/single_family_home_day_winter.png" width="96" alt="single_family_home_day_winter"></td>
  </tr>
  <tr>
    <td>Hail day</td>
    <td><code>single_family_home_day_hail.png</code></td>
    <td><img src="images/single_family_home/single_family_home_day_hail.png" width="96" alt="single_family_home_day_hail"></td>
  </tr>
  <tr>
    <td>Legacy standard/night</td>
    <td><code>single_family_home_legacy.png</code></td>
    <td><img src="images/single_family_home/single_family_home_legacy.png" width="96" alt="single_family_home_legacy"></td>
  </tr>
  <tr>
    <td>Legacy day</td>
    <td><code>single_family_home_legacy_day.png</code></td>
    <td><img src="images/single_family_home/single_family_home_legacy_day.png" width="96" alt="single_family_home_legacy_day"></td>
  </tr>
</table>

### Other shipped house images

<table>
  <tr>
    <th>House key</th>
    <th>Standard/night</th>
    <th>Day</th>
    <th>Weather/extra</th>
  </tr>
  <tr>
    <td><code>duplex_house</code></td>
    <td><img src="images/duplex_house/duplex_house.png" width="86" alt="duplex_house"><br><code>duplex_house.png</code></td>
    <td><img src="images/duplex_house/duplex_house_day.png" width="86" alt="duplex_house_day"><br><code>duplex_house_day.png</code></td>
    <td><img src="images/duplex_house/duplex_house_day_cloudy.png" width="86" alt="duplex_house_day_cloudy"><br><code>duplex_house_day_cloudy.png</code></td>
  </tr>
  <tr>
    <td><code>terraced_middle_house</code></td>
    <td><img src="images/terraced_middle_house/terraced_middle_house.png" width="86" alt="terraced_middle_house"><br><code>terraced_middle_house.png</code></td>
    <td><img src="images/terraced_middle_house/terraced_middle_house_day.png" width="86" alt="terraced_middle_house_day"><br><code>terraced_middle_house_day.png</code></td>
    <td>-</td>
  </tr>
  <tr>
    <td><code>apartment_building</code></td>
    <td><img src="images/apartment_building/apartment_building.png" width="86" alt="apartment_building"><br><code>apartment_building.png</code></td>
    <td><img src="images/apartment_building/apartment_building_day.png" width="86" alt="apartment_building_day"><br><code>apartment_building_day.png</code></td>
    <td>-</td>
  </tr>
  <tr>
    <td><code>apartment_building_balcony_solar</code></td>
    <td><img src="images/apartment_building_balcony_solar/apartment_building_balcony_solar.png" width="86" alt="apartment_building_balcony_solar"><br><code>apartment_building_balcony_solar.png</code></td>
    <td><img src="images/apartment_building_balcony_solar/apartment_building_balcony_solar_day.png" width="86" alt="apartment_building_balcony_solar_day"><br><code>apartment_building_balcony_solar_day.png</code></td>
    <td>-</td>
  </tr>
  <tr>
    <td><code>city_villa</code></td>
    <td><img src="images/city_villa/city_villa.png" width="86" alt="city_villa"><br><code>city_villa.png</code></td>
    <td><img src="images/city_villa/city_villa_day.png" width="86" alt="city_villa_day"><br><code>city_villa_day.png</code></td>
    <td>-</td>
  </tr>
  <tr>
    <td><code>city_villa_pitched_roof</code></td>
    <td><img src="images/city_villa_pitched_roof/city_villa_pitched_roof.png" width="86" alt="city_villa_pitched_roof"><br><code>city_villa_pitched_roof.png</code></td>
    <td><img src="images/city_villa_pitched_roof/city_villa_pitched_roof_day.png" width="86" alt="city_villa_pitched_roof_day"><br><code>city_villa_pitched_roof_day.png</code></td>
    <td><code>clear</code>, <code>cloudy</code>, <code>fog</code>, <code>rainy</code>, <code>thunderstorm</code>, <code>snow</code>, <code>snowy</code>, <code>winter</code>, <code>hail</code>, <code>wind</code>, plus day variants for <code>cloudy</code>, <code>fog</code>, <code>rainy</code>, <code>thunderstorm</code>, <code>snowy</code>, <code>hail</code>, <code>sunny</code></td>
  </tr>
  <tr>
    <td><code>bungalow</code></td>
    <td><img src="images/bungalow/bungalow.png" width="86" alt="bungalow"><br><code>bungalow.png</code></td>
    <td><img src="images/bungalow/bungalow_day.png" width="86" alt="bungalow_day"><br><code>bungalow_day.png</code></td>
    <td>-</td>
  </tr>
</table>

Current weather suffixes:

| Home Assistant weather state | Tried suffixes |
| --- | --- |
| `sunny`, `clear` | `sunny` |
| `clear-night` | `clear` |
| `partlycloudy`, `cloudy` | `cloudy` |
| `fog` | `cloudy`, `fog` |
| `rainy`, `pouring` | `rainy` |
| `lightning-rainy` | `rainy`, `thunderstorm` |
| `snowy` | `snowy`, `snow`, `winter` |
| `snowy-rainy`, `snowy_rainy` | `snowy`, `snow`, `rainy` |
| `hail` | `hail` |
| `lightning` | `thunderstorm` |
| `windy` | `wind` |
| `windy-variant`, `windy_variant` | `wind`, `cloudy` |

## Validation

Run the local package checks before pushing or releasing:

```bash
npm test
```

The CI workflow runs the same checks on pull requests and pushes to `main`. The HACS validation workflow runs `hacs/action` with `category: plugin`, including a daily scheduled run so future HACS validation changes are caught early.

Hassfest is included as a guarded workflow for future integration files, but it only runs when `custom_components/**` exists. Dashboard cards are validated through the HACS plugin action instead.

## Troubleshooting HACS install

If HACS shows an "Unknown error" while downloading, make sure you selected repository type **Dashboard**. If you previously added it as a different type, remove the failed entry in HACS and add it again as Dashboard before retrying.

This repository ships the HACS entry file in `dist/ha-solar-dashboard.js` and declares `ha-solar-dashboard.js` in `hacs.json`. The filename must match the repository name (`ha-solar-dashboard`) so HACS can identify it as a valid Dashboard plugin. Do not enable `zip_release` for this repository: HACS only supports that mode for integrations, not Dashboard plugins. For Dashboard plugins, HACS scans `dist/` first, then the latest release, then the repository root, and downloads the matching JavaScript file.

When publishing a GitHub release, attach `ha-solar-dashboard.js` and every `dist/images/**/*.png` file as release assets. The included Release workflow does this automatically for tag pushes and published releases by flattening the uniquely named image files into release assets. If a release already exists without the image assets, run the `HACS Release Asset Repair` workflow with that tag, for example `v1.0.8`.

The `homeassistant` value in `hacs.json` must be a plain minimum version such as `2023.8.0`, not a comparator expression like `>=2023.8.0`.
