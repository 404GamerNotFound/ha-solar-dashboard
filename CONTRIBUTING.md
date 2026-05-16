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

The main card source is `ha-solar-dashboard.js`. The packaged HACS file is `dist/ha-solar-dashboard.js`.

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
