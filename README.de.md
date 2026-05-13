# HA Solar Dashboard Card (Deutsch)

Eine benutzerdefinierte Home-Assistant-Lovelace-Karte für HACS mit moderner PV-/Energieübersicht auf Basis eines Hausbildes.

## Beispiel

![HA Solar Dashboard Card example](images/single_family_home/single_family_home.png)

## Funktionen

- Hintergrundbild (Haus/PV-Design)
- Automatischer Tag-/Nachtbildwechsel über `sun.sun` (`*_day.png` bei Tag)
- Overlay-Widgets auf frei positionierbaren Punkten
- Wählbare Hauslayouts aus dem `images`-Ordner
- Variante `terraced_middle_house` mit Tag-/Nachtbild
- Variante `bungalow` mit Tag-/Nachtbild
- Konfigurierbare Entitäten für PV, Batterie, Wechselrichter, Wallbox und Gesamtleistung
- Automatische Leistungsanzeige in `W` bis `999 W` und ab `1000 W` in `kW` mit zwei Nachkommastellen
- Einzelne HUD- und Übersichtsboxen können ausgeblendet werden
- Dynamische Farben und Glow-Zustände je Tile über konfigurierbare Grenzwerte, z. B. grün bei hoher PV-Leistung oder orange bei Netzbezug
- Frei definierbare KPI-Kacheln unter dem Bild, z. B. CO₂ gespart heute, Autarkiegrad oder spezifischer Ertrag
- Variante `apartment_building_balcony_solar` für Balkonsolar mit PV-Leistung, Batterie und Wechselrichter
- Dezentes Statuslabel im Bild mit letzter Aktualisierung und optionalem Import-/Exportwert
- Optionale Wetterbilder per `weather_entity`, zum Beispiel `_sunny`, `_rainy`, `_cloudy`, `_snowy` oder `_thunderstorm`
- UI- und Editor-Labels folgen automatisch der Home-Assistant-Sprache (`en`, `de`, `es`, `fr`, `pl`)

## Installation (HACS)

1. Repository in HACS als **Custom repository** mit Typ **Dashboard** hinzufügen.
2. **HA Solar Dashboard Card** installieren.
3. Home Assistant neu starten (oder Ressourcen neu laden).
4. Karte in Lovelace hinzufügen.

> Detaillierte Konfigurationsoptionen finden Sie in der englischen Standard-README: [README.md](README.md)
