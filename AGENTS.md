# AGENTS.md – HA Solar Dashboard Card

Home-Assistant-Lovelace-Karte (`custom:ha-solar-dashboard-card`), verteilt über HACS als **Dashboard-Plugin**.
Repo: https://github.com/404GamerNotFound/ha-solar-dashboard

## Struktur
- `src/` – Einstiegspunkte (`ha-solar-dashboard.js`, `ha-solar-dashboard-editor.js`)
- `modules/` – Fachlogik (Batterien, Wallbox, Advisor, Editor-Schema …)
- `styles/`, `i18n/` (de, en, es, fr, pl, pt …), `images/` (PNG-Originale + WebP)
- **Generiert** (nicht von Hand ändern, `npm run build`):
  - `ha-solar-dashboard.js` – HACS-Einstieg, ein einzelnes Bundle inkl. eingebettetem Editor
  - `ha-solar-dashboard-editor.js` – eigenständiges Editor-Bundle (Fallback)
- `scripts/` – `build.mjs`, `release-assets.mjs`, `generate-webp.mjs`, `add-i18n-key.mjs`
- `tests/` – `validate-hacs-package.mjs`, `release-assets.mjs`, `domain-logic.mjs`

## Befehle (Node >= 20)
- `npm run build` – Bundles aus `src/`, `modules/`, `styles/`, `i18n/` erzeugen
- `npm test` – HACS-Paketprüfung + Release-Asset-Tests + Logiktests
- `npm run optimize-images` – WebP zu jedem PNG erzeugen (Pflicht für Releases)
- `npm run i18n:add-key` – neuen Übersetzungsschlüssel in allen Sprachen anlegen
- Hinweis: `validate-hacs-package.mjs` prüft gegen den Ordnernamen – der Checkout muss `ha-solar-dashboard` heißen.

## HACS – wichtige Regeln
- `hacs.json` → `filename: ha-solar-dashboard.js` (muss zum Repo-Namen passen), kein `zip_release`.
- **Kein `dist/`-Ordner!** HACS bevorzugt `dist/ha-solar-dashboard.js` vor der Datei im Root, wenn
  das Release kein passendes Asset hat. Ein Stub dort wird statt des echten Bundles installiert →
  „Custom element doesn't exist: ha-solar-dashboard-card“ (Fehler in v2.3.10/v2.3.11).
- Hat ein Release Assets, lädt HACS **nur** diese (Bundle + WebP-Bilder). Gesamtgröße < 100 MiB.

## Release-Ablauf
1. Version in `package.json` erhöhen, `npm run build` (setzt `HA_SOLAR_DASHBOARD_VERSION`/`_BUILD`).
2. `npm test` muss grün sein.
3. Commit, Tag `v<version>` **genau passend zu package.json** pushen – sonst bricht
   `.github/workflows/release.yml` bei „Verify release version“ ab und das Release bleibt ohne Assets.
4. Fehlende Assets nachträglich: Workflow „HACS Release Asset Repair“ mit dem Tag starten.

## Konventionen
- Kommunikation/Doku primär Deutsch, README zusätzlich Englisch.
- Neue UI-Texte immer in allen `i18n/`-Sprachen anlegen.
