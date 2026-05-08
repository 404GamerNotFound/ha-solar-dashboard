# HA Solar Dashboard Card

A custom Home Assistant Lovelace card for HACS that renders a modern PV/energy overview with an image-based layout.

## Example

![HA Solar Dashboard Card example](https://raw.githubusercontent.com/404GamerNotFound/ha-solar-dashboard/main/example.png)

## Features

- Hero background image (your house/pv design)
- Automatic day image variants via `sun.sun`: day uses `*_tag.png`, night uses the standard image
- Overlay widgets placed on matching points in the image
- Selectable house layouts from the `images` folder:
  - `home`
  - `doppelhaus`
  - `mehrfamilienhaus`
  - `stadtvilla`
  - `stadtvilla2`
- Configurable entities for:
  - PV Dach (roof PV)
  - PV Schuppen (shed PV)
  - Batterie
  - Wechselrichter Leistung
  - Wallbox Leistung
  - PV Gesamt (summary tile below the image)
- Individual boxes can be hidden when a device is not present, for example no Wallbox
- Custom standard and daylight images
- Free X/Y positioning for every overlay box
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
house: home
show_house_selector: true
entities:
  pv_roof_power: sensor.pv_dach_leistung
  pv_shed_power: sensor.pv_schuppen_leistung
  battery_level: sensor.batterie_soc
  inverter_power: sensor.wechselrichter_leistung
  wallbox_power: sensor.wallbox_leistung
  pv_total_power: sensor.pv_gesamt_leistung
visible_boxes:
  wallbox_power: false
positions:
  pv_roof_power:
    left: 64
    top: 28
image: /local/solar/haus_nacht.png
day_image: /local/solar/haus_tag.png
units:
  power: auto
  battery: "%"
power_display_mode: auto_kw
power_decimals: 2
```

## Card options

- `title` (string, default: `Energy Flow`)
- `time_label` (string, default: `Live`)
- `house` (string, default: `home`; options: `home`, `doppelhaus`, `mehrfamilienhaus`, `stadtvilla`, `stadtvilla2`)
- `show_title` (boolean, default: `true`; shows/hides the title)
- `show_time_label` (boolean, default: `true`; shows/hides the live label)
- `show_house_selector` (boolean, default: `true`)
- `show_metric_tiles` (boolean, default: `true`; shows/hides the summary boxes below the image)
- `daylight_entity` (string, default: `sun.sun`; uses `_tag` images during the day and standard images before sunrise/after sunset)
- `image` (string, optional custom standard/night image; supports `/local/...` or `https://...`)
- `day_image` (string, optional custom daylight image used when `daylight_entity` indicates daylight)
- `visible_boxes.<entity_key>` (boolean, default: `true`; set to `false` to hide one overlay box and its summary tile)
- `boxes.<entity_key>` (boolean, legacy alias for `visible_boxes.<entity_key>`)
- `positions.<entity_key>.left` / `positions.<entity_key>.top` (number, optional percentage overrides from `4` to `96`)
- `entities.pv_roof_power` (entity id)
- `entities.pv_shed_power` (entity id)
- `entities.pv_total_power` (entity id; shown as `PV Gesamt` in the summary boxes below the image)
- `entities.battery_level` (entity id)
- `entities.inverter_power` (entity id)
- `entities.wallbox_power` (entity id)
- `units.power` (string, default: `auto`; power values are shown in `W` below `1000 W` and in `kW` with two decimals from `1000 W`)
- `units.battery` (string, default: `%`)
- `units.<entity_key>` (string, optional; overrides the unit for a single metric, for example `units.wallbox_power: W`)
- `power_display_mode` (string, default: `auto_kw`; options: `raw`, `auto_kw`)
- `power_decimals` (number, default: `2`; used for kW values in `auto_kw` mode, range: `0`-`3`)

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

When publishing a GitHub release, attach `ha-solar-dashboard.js` as a release asset. The included Release workflow does this automatically for tag pushes and published releases. If a release already exists without the asset, run the workflow manually with that tag.

The `homeassistant` value in `hacs.json` must be a plain minimum version such as `2023.8.0`, not a comparator expression like `>=2023.8.0`.
