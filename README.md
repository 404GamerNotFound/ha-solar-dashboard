# HA Solar Dashboard Card

A custom Home Assistant Lovelace card for HACS that renders a modern PV/energy overview with an image-based layout.

## Example

![HA Solar Dashboard Card example](https://raw.githubusercontent.com/404GamerNotFound/ha-solar-dashboard/main/example4.png)

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
  - Battery charge/discharge flow (signed or split entities)
  - Inverter power
  - EV charger power
  - Optional second EV charger power
  - PV Total (summary tile below the image)
  - Optional house consumption power
- Individual HUD and summary boxes can be hidden when a device is not present, for example no Wallbox
- Dynamic tile colors and glow states based on configurable thresholds, for example green for high PV production or orange while importing from the grid
- Battery state of charge is visualized with a compact fill meter in the battery HUD and tile
- Optional battery flow badge on the image and battery summary tile: green down arrow for charging/incoming, red up arrow for discharging/outgoing; the badge follows the entity unit, so power sensors show `W`/`kW` and energy sensors show `kWh`
- Optional battery temperature badge on the battery HUD and tile
- Animated power flow overlay between the existing image elements, using the configured HUD positions without changing the image files
- Optional smoke and heat pump image overlays with per-element enable, position, size, and heat pump orientation controls
- PV, inverter, and EV charger values can show utilization bars based on configurable kW/kWp maxima
- Optional second EV charger entity, disabled by default and positioned automatically next to the first EV charger
- Optional EV charger phase badges from separate phase entities (`Auto`, `1`, `2`, or `3`)
- Optional EV vehicle SoC badges shown next to the EV charger phase badges
- Optional remaining EV charge time badge, shown only while the EV charger is actively charging
- Optional grid status tile showing import, export, or self-sufficient operation from the import/export entity
- Hover tooltips on values show the linked entity, raw state, formatted value, and update time
- Clickable entity boxes and tiles open a 24/48 hour history chart using Home Assistant history data
- Warning states highlight unavailable/offline sensors and low battery levels
- Configurable KPI tiles below the image, including custom labels, entities or static values, units, color, sort position, and tile width
- Custom standard and daylight images
- Free X/Y positioning for every overlay box
- Localized card and editor labels based on the Home Assistant language (`en`, `de`, `es`, `fr`, `pl`)
- Registered for Home Assistant's card picker with a live preview
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
  # Option A: one signed entity; positive = charging, negative = discharging
  battery_flow_power: sensor.batterie_leistung
  # Option B: separate entities; used when the signed entity is empty
  battery_charge_power: sensor.batterie_ladeleistung
  battery_discharge_power: sensor.batterie_entladeleistung
  battery_temperature: sensor.batterie_temperatur
  inverter_power: sensor.wechselrichter_leistung
  wallbox_power: sensor.wallbox_leistung
  wallbox_phase: sensor.wallbox_phasen
  wallbox_soc: sensor.wallbox_auto_soc
  wallbox_remaining_time: sensor.wallbox_verbleibende_ladezeit
  wallbox2_power: sensor.wallbox_2_leistung
  wallbox2_phase: sensor.wallbox_2_phasen
  wallbox2_soc: sensor.wallbox_2_auto_soc
  wallbox2_remaining_time: sensor.wallbox_2_verbleibende_ladezeit
  pv_total_power: sensor.pv_gesamt_leistung
  house_consumption_power: sensor.hausverbrauch_leistung
  import_export_power: sensor.netzbezug_einspeisung
visible_boxes:
  wallbox_power: false
  wallbox2_power: false
labels:
  pv_roof_power: PV Dach
  battery_level: Speicher
  wallbox_power: Wallbox Garage
energy_entities:
  pv_roof_power:
    entity: sensor.pv_dach_energy_total
  house_consumption_power:
    entity: sensor.house_consumption_total
show_grid_status_tile: true
show_power_flows: false
image_overlays:
  smoke:
    enabled: false
    label: Gas
    entity: sensor.zaehlerstand_2
    period: 1h
    left: 58
    top: 18
    width: 9
  heatpump:
    enabled: false
    label: Heat pump
    entity: sensor.heatpump_power
    left: 82
    top: 63
    width: 11
    orientation: right
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
grid_neutral_threshold: 25
battery_low_threshold: 20
chart_hours: 24
max_power_kw:
  pv_roof_power: 10
  pv_shed_power: 3
  pv_total_power: 13
  inverter_power: 10
  wallbox_power: 11
  wallbox2_power: 11
dynamic_tile_colors: true
tile_color_rules:
  pv_total_power:
    - above: 3000
      color: "#34d399"
      glow: true
    - above: 1000
      color: "#ffc233"
    - below: 100
      color: "#9ba3b8"
  import_export_power:
    - gt: 25
      color: "#fb923c"
      glow: true
    - lt: -25
      color: "#34d399"
      glow: true
custom_kpis:
  - label: CO2 saved today
    entity: sensor.co2_saved_today
    unit: kg
    position: 100
    columns: 2
    color: "#34d399"
  - label: Autarky
    entity: sensor.autarky_degree
    unit: "%"
    position: 101
    columns: 1
    color: "#ffc233"
  - label: Specific yield
    entity: sensor.specific_yield
    unit: kWh/kWp
    position: 102
    columns: 2
    color: "#1f8fff"
```

## Card options

- `title` (string, default: `Energy Flow`)
- `time_label` (string, default: `Live`)
- `house` (string, default: `single_family_home`; options: `single_family_home`, `duplex_house`, `terraced_middle_house`, `apartment_building`, `apartment_building_balcony_solar`, `bungalow`, `city_villa`, `city_villa_pitched_roof`; legacy German values are still accepted as aliases)
- `show_title` (boolean, default: `true`; shows/hides the title)
- `show_time_label` (boolean, default: `true`; shows/hides the live label)
- `show_house_selector` (boolean, default: `true`)
- `show_energy_range_selector` (boolean, default: `false`; shows the `Live` / `1h` / `24h` / `1 month` / `1 year` / `Total` selector in the header when enabled)
- `show_metric_tiles` (boolean, default: `true`; shows/hides the summary boxes below the image)
- `show_status_label` (boolean, default: `true`; shows/hides the subtle bottom-right image label with last update and optional import/export)
- `show_weather_status` (boolean, default: `false`; adds the current weather state to the bottom-right status label)
- `show_grid_status_tile` (boolean, default: `true`; shows a grid status tile when `entities.import_export_power` is configured)
- `show_power_flows` (boolean, default: `false`; shows animated SVG power flow lines between configured image/HUD positions when enabled)
- `image_overlays.smoke.enabled` / `image_overlays.heatpump.enabled` (boolean, default: `false`; shows the smoke or heat pump overlay on the house image)
- `image_overlays.<overlay>.label` (string, optional; custom label shown in the image badge and bottom tile, for example `Gas` or `Wärmepumpe`)
- `image_overlays.smoke.entity` (entity id, optional; cumulative gas meter used to show consumption for the selected period)
- `image_overlays.smoke.period` (string, default: `1h`; supported values: `30m`, `1h`, `24h`)
- `image_overlays.heatpump.entity` (entity id, optional; power or energy sensor shown next to the heat pump and in the bottom tile)
- `image_overlays.<overlay>.left` / `image_overlays.<overlay>.top` (number, optional percentage position for `smoke` or `heatpump`)
- `image_overlays.<overlay>.width` (number, optional percentage width for `smoke` or `heatpump`)
- `image_overlays.heatpump.orientation` (string, default: `right`; use `left` or `right` to mirror the heat pump toward the matching side of the house)
- `daylight_entity` (string, default: `sun.sun`; uses `_day` images during the day and standard images before sunrise/after sunset)
- `weather_entity` (string, optional; uses weather-specific image suffixes when present, for example `_sunny`, `_rainy`, `_cloudy`, `_snowy`, `_thunderstorm`)
- `image` (string, optional custom standard/night image; supports `/local/...` or `https://...`)
- `day_image` (string, optional custom daylight image used when `daylight_entity` indicates daylight)
- `visible_boxes.<entity_key>` (boolean, default: `true`; set to `false` to hide one HUD box and its summary tile; supported keys are `pv_roof_power`, `pv_shed_power`, `pv_total_power`, `house_consumption_power`, `battery_level`, `inverter_power`, `wallbox_power`, and `wallbox2_power`)
- `boxes.<entity_key>` (boolean, legacy alias for `visible_boxes.<entity_key>`)
- `labels.<entity_key>` (string, optional; custom label for HUD boxes and summary tiles, for example `PV Dach`, `Speicher` or `Wallbox Garage`)
- `energy_entities.<entity_key>.entity` (entity id, optional; cumulative kWh counter used like the gas meter: `1h`, `24h`, `1 month`, and `1 year` are calculated from Home Assistant history, while `Total` shows the current counter value)
- `positions.<entity_key>.left` / `positions.<entity_key>.top` (number, optional percentage overrides from `4` to `96`)
- `entities.pv_roof_power` (entity id)
- `entities.pv_shed_power` (entity id)
- `entities.pv_total_power` (entity id; shown as `PV Total` in the summary boxes below the image)
- `entities.house_consumption_power` (entity id, optional; shown as `Consumption` in the summary boxes below the image)
- `entities.battery_level` (entity id)
- `entities.battery_flow_power` (entity id, optional; signed battery power or energy shown on the battery HUD, positive values mean charging/incoming and negative values mean discharging/outgoing; the badge follows the entity unit)
- `entities.battery_charge_power` / `entities.battery_discharge_power` (entity ids, optional; separate incoming/outgoing battery power or energy values, used when `battery_flow_power` is not configured; the badge follows the entity unit)
- `entities.battery_temperature` (entity id, optional; battery temperature badge shown on the battery HUD and tile)
- `entities.inverter_power` (entity id)
- `entities.wallbox_power` (entity id)
- `entities.wallbox_phase` (entity id, optional; state can be `Auto`, `1`, `2`, or `3` and is shown as a compact phase badge on the Wallbox HUD and tile)
- `entities.wallbox_soc` (entity id, optional; vehicle battery SoC shown as a compact `Auto 78%` badge next to the Wallbox phase badge)
- `entities.wallbox_remaining_time` (entity id, optional; remaining charge time badge shown next to the Wallbox phase/SoC badges only while `wallbox_power` is charging)
- `entities.wallbox2_power` (entity id, optional; second EV charger, hidden by default and auto-positioned next to `wallbox_power` unless `positions.wallbox2_power` is set)
- `entities.wallbox2_phase` (entity id, optional; phase badge for the second EV charger)
- `entities.wallbox2_soc` (entity id, optional; vehicle battery SoC badge for the second EV charger)
- `entities.wallbox2_remaining_time` (entity id, optional; remaining charge time badge for the second EV charger)
- `entities.import_export_power` (entity id, optional; positive values are shown as `Import`, negative values as `Export`)
- `units.power` (string, default: `auto`; power values are shown in `W` below `1000 W` and in `kW` with two decimals from `1000 W`)
- `units.battery` (string, default: `%`)
- `units.<entity_key>` (string, optional; overrides the unit for a single metric, for example `units.wallbox_power: W`; `auto` respects Home Assistant units such as `W`, `kW`, and `kWh`)
- `power_display_mode` (string, default: `auto_kw`; options: `raw`, `auto_kw`)
- `power_decimals` (number, default: `2`; used for kW values in `auto_kw` mode, range: `0`-`3`)
- `grid_neutral_threshold` (number, default: `25`; watt threshold below which the grid tile shows self-sufficient/autark operation)
- `battery_low_threshold` (number, default: `20`; battery percentage at or below which the battery tile is highlighted as a warning)
- `chart_hours` (number, default: `24`; initial range for the click-to-open history chart, supported values: `24` or `48`)
- `max_power_kw.<entity_key>` (number/string, optional; enables a utilization bar for power metrics based on max kW/kWp, for example `max_power_kw.wallbox_power: 11`)
- `dynamic_tile_colors` (boolean, default: `true`; enables threshold-based accent colors and glow states for HUD boxes, summary tiles, and the import/export status label)
- `tile_color_rules.<entity_key>[]` (array, optional; first matching rule wins; supported keys include the visible box keys plus `import_export_power`)
- `tile_color_rules.<entity_key>[].color` (CSS color, for example `#34d399`, `orange`, `rgb(251,146,60)`, or `var(--my-color)`)
- `tile_color_rules.<entity_key>[].glow` (boolean or CSS color, optional; `true` derives a soft glow from `color`)
- Rule thresholds can use `above`, `below`, `min`, `max`, `gte`, `lte`, `gt`, `lt`, `equals`, or `threshold` with `operator`. Power values are evaluated in watts, even when the entity reports `kW`.
- `custom_kpis[]` (array, optional; adds free KPI tiles below the image alongside the built-in summary tiles)
- `custom_kpis[].label` (string; tile title)
- `custom_kpis[].entity` (entity id, optional; used as the tile value when set)
- `custom_kpis[].value` (string/number, optional; static fallback value when no entity is set)
- `custom_kpis[].unit` (string, default: `auto`; `auto` uses the entity unit, `none` hides the unit)
- `custom_kpis[].position` (number, default: after built-in tiles; controls tile order in the bottom grid)
- `custom_kpis[].columns` (number, default: `1`, range: `1`-`6`; controls tile width on desktop, capped to `2` on mobile)
- `custom_kpis[].color` (CSS color, default: `#1f8fff`)
- `kpis[]` (legacy-friendly alias for `custom_kpis[]`)

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
