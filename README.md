# HA Solar Dashboard Card

A custom Home Assistant Lovelace card for HACS that renders a modern PV/energy overview with an image-based layout.

## Features

- Hero background image (your house/pv design)
- Overlay widgets placed on matching points in the image
- Selectable house layouts from the `images` folder:
  - `home`
  - `doppelhaus`
  - `stadtvilla`
  - `stadtvilla2`
- Configurable entities for:
  - PV Dach (roof PV)
  - PV Schuppen (shed PV)
  - Batterie
  - Wechselrichter Leistung
  - Wallbox Leistung
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
units:
  power: W
  battery: "%"
```

## Card options

- `title` (string, default: `Energy Flow`)
- `time_label` (string, default: `Live`)
- `house` (string, default: `home`; options: `home`, `doppelhaus`, `stadtvilla`, `stadtvilla2`)
- `show_house_selector` (boolean, default: `true`)
- `image` (string, optional custom image override)
- `positions.<entity_key>.left` / `positions.<entity_key>.top` (number, optional percentage overrides)
- `entities.pv_roof_power` (entity id)
- `entities.pv_shed_power` (entity id)
- `entities.battery_level` (entity id)
- `entities.inverter_power` (entity id)
- `entities.wallbox_power` (entity id)
- `units.power` (string, default: `W`)
- `units.battery` (string, default: `%`)

## Troubleshooting HACS install

If HACS shows an "Unknown error" while downloading, make sure you selected repository type **Dashboard**. If you previously added it as a different type, remove the failed entry in HACS and add it again as Dashboard before retrying.

This repository ships the HACS entry file in `dist/ha-solar-dashboard.js` and declares `ha-solar-dashboard.js` in `hacs.json`. The filename must match the repository name (`ha-solar-dashboard`) so HACS can identify it as a valid Dashboard plugin. Do not enable `zip_release` for this repository: HACS only supports that mode for integrations, not Dashboard plugins. For Dashboard plugins, HACS scans `dist/` first, then the latest release, then the repository root, and downloads the matching JavaScript file.

When publishing a GitHub release, attach `ha-solar-dashboard.js` as a release asset. The included Release workflow does this automatically for tag pushes and published releases. If a release already exists without the asset, run the workflow manually with that tag.

The `homeassistant` value in `hacs.json` must be a plain minimum version such as `2023.8.0`, not a comparator expression like `>=2023.8.0`.
