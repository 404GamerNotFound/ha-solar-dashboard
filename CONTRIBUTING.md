# Contributing

Thanks for helping improve HA Solar Dashboard Card. This project is a custom Home Assistant Lovelace card distributed through HACS.

## Before You Start

- Check existing issues and pull requests to avoid duplicate work.
- For large changes, open an issue first so the scope can be discussed.
- Keep pull requests focused on one fix or feature.
- Do not include personal Home Assistant entity IDs, secrets, tokens, or private URLs in screenshots, logs, or examples.

## Development Setup

Requirements:

- Node.js 20 or newer
- A local clone of this repository

Install dependencies if the project gains any in the future:

```sh
npm install
```

Run validation:

```sh
npm test
```

This currently runs the HACS/package validation script in `tests/validate-hacs-package.mjs`.

## Working on the Card

The maintainable source lives in `src/`, `modules/`, `styles/`, `i18n/`, and `images/`. The root files `ha-solar-dashboard.js` and `ha-solar-dashboard-editor.js` are generated HACS bundles; update them with `npm run build` after changing source files. `dist/ha-solar-dashboard.js` is only a small compatibility loader.

Shared configuration defaults live in `modules/config-schema.js`. History cache lifecycle and counter-history calculations live in `modules/history-service.js`; use those helpers instead of adding ad hoc cache maps or Home Assistant history parsing to the card class. Domain logic that can be tested without Home Assistant should live in a focused module under `modules/`, for example grid flow and grid finance helpers, with coverage in `tests/domain-logic.mjs`.

For new translation keys, prefer `npm run i18n:add-key -- <key> <en> <de> <es> <fr> <pl>` so all supported dictionaries stay aligned before running `npm test`.

When changing user-facing behavior, please check:

- Default card rendering still works.
- Optional entities can be omitted without breaking the card.
- Existing YAML examples remain valid or are updated.
- Localized labels stay consistent across supported languages where applicable.
- HACS metadata remains valid.

## Pull Request Checklist

Before opening a pull request:

- Run `npm test`.
- Update `README.md` or localized README files when configuration or behavior changes.
- Add or update examples when new options are introduced.
- Keep generated or distribution files in sync if your change affects them.
- Describe how you tested the change.

## Commit Style

Use clear, direct commit messages. Examples:

- `Fix battery flow badge for split sensors`
- `Add heat pump overlay configuration`
- `Update HACS validation checks`

No specific commit convention is required.

## Reporting Bugs

Please include:

- Home Assistant version
- HACS version, if relevant
- Browser and device type
- Card version or commit
- Minimal card YAML that reproduces the issue
- Browser console errors, if any
- Screenshots or screen recordings when layout is involved

## Requesting Features

Feature requests are welcome. Describe the use case, the expected behavior, and how the feature should interact with existing card options.
