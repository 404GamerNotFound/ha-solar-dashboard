# HA Solar Dashboard Card

A custom Home Assistant Lovelace card for HACS that renders a modern PV/energy overview with an image-based layout.

## Features

- Hero background image (your house/pv design)
- Overlay widgets placed on matching points in the image
- Configurable entities for:
  - PV Dach (roof PV)
  - PV Schuppen (shed PV)
  - Batterie
  - Wechselrichter Leistung
  - Wallbox Leistung
- Dark glass style matching the provided design

## Installation (HACS)

1. Add this repository as a **Custom repository** in HACS with type **Plugin** (this is the correct HACS type for Lovelace custom cards).
2. Install **HA Solar Dashboard Card**.
3. Restart Home Assistant (or reload resources).
4. Add the card in Lovelace.

## Lovelace resource (if needed)

```yaml
url: /hacsfiles/ha-solar-dashboard/ha-solar-dashboard-card.js
type: module
```

## Example configuration

```yaml
type: custom:ha-solar-dashboard-card
title: Solar Dashboard
time_label: Live
image: /local/images/home.png
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
- `image` (string, default: `/local/images/home.png`)
- `entities.pv_roof_power` (entity id)
- `entities.pv_shed_power` (entity id)
- `entities.battery_level` (entity id)
- `entities.inverter_power` (entity id)
- `entities.wallbox_power` (entity id)
- `units.power` (string, default: `W`)
- `units.battery` (string, default: `%`)

## Troubleshooting HACS install

If HACS shows an "Unknown error" while downloading, make sure you selected repository type **Plugin**. If you previously added it as Dashboard, remove the failed entry in HACS and add it again as Plugin before retrying.
This repository ships the card file directly at the repository root (`ha-solar-dashboard-card.js`), which is required by HACS frontend installs.
