# HA Solar Dashboard Card (Deutsch)

Eine benutzerdefinierte Home-Assistant-Lovelace-Karte für HACS mit moderner PV-/Energieübersicht auf Basis eines Hausbildes.

## Beispiel

![HA Solar Dashboard Card example](images/home.png)

## Funktionen

- Hintergrundbild (Haus/PV-Design)
- Automatischer Tag-/Nachtbildwechsel über `sun.sun` (`*_tag.png` bei Tag)
- Overlay-Widgets auf frei positionierbaren Punkten
- Wählbare Hauslayouts aus dem `images`-Ordner
- Konfigurierbare Entitäten für PV, Batterie, Wechselrichter, Wallbox und Gesamtleistung
- Einzelne Boxen können ausgeblendet werden

## Installation (HACS)

1. Repository in HACS als **Custom repository** mit Typ **Dashboard** hinzufügen.
2. **HA Solar Dashboard Card** installieren.
3. Home Assistant neu starten (oder Ressourcen neu laden).
4. Karte in Lovelace hinzufügen.

> Detaillierte Konfigurationsoptionen finden Sie in der englischen Standard-README: [README.md](README.md)
