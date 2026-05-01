# HA Solar Dashboard Card

A custom Home Assistant Lovelace card for HACS that renders a modern PV/energy overview inspired by the provided design.

## Features

- Dark glass-style dashboard card
- Top KPIs: grid, solar, home
- Simple animated energy flow lines
- Bottom status chips for grid and solar power
- Optional time-range badge (e.g. `Today`)

## Installation (HACS)

1. Add this repository as a **Custom repository** in HACS with type **Dashboard**.
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
title: Energy
time_label: Today
entities:
  grid_energy: sensor.grid_energy_today
  solar_energy: sensor.solar_energy_today
  home_energy: sensor.home_energy_today
  grid_power: sensor.grid_power
  solar_power: sensor.solar_power
units:
  energy: kWh
  power: W
```

## Card options

- `title` (string, default: `Energy`)
- `time_label` (string, default: `Today`)
- `entities.grid_energy` (entity id)
- `entities.solar_energy` (entity id)
- `entities.home_energy` (entity id)
- `entities.grid_power` (entity id)
- `entities.solar_power` (entity id)
- `units.energy` (string, default: `kWh`)
- `units.power` (string, default: `W`)

## Notes

This card intentionally focuses on the first visual dashboard section (energy + flow) from your reference image, with a clean and lightweight implementation.
