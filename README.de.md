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
- Konfigurierbare Entitäten und eigene Labels für PV, Batterie, Wechselrichter, Wallbox, Wasserzähler, Gesamtleistung und Import/Export
- Optionaler Umschalter oben für Live-, 1h-, 24h-, Monats-, Jahres- und Gesamtwerte über separate kWh-Zähler je Leistungsbox
- Optionale zweite Wallbox-Entität, standardmäßig deaktiviert und automatisch neben der ersten Wallbox positioniert
- Optionale Verbrauchs-Kachel für den Hausverbrauch
- Optionale Wasserzähler-Box mit Anzeige in `m³`, frei definierbarer Entität, Label, Position und Einheit
- Automatische Leistungsanzeige in `W` bis `999 W` und ab `1000 W` in `kW` mit zwei Nachkommastellen
- Einzelne HUD- und Übersichtsboxen können ausgeblendet werden
- Dynamische Farben und Glow-Zustände je Tile über konfigurierbare Grenzwerte, z. B. grün bei hoher PV-Leistung oder orange bei Netzbezug
- Batterie-Ladezustand als kompakter Balken in Batterie-HUD und Batterie-Kachel
- Dezente Batteriefluss-Anzeige im Bild und in der Batterie-Kachel mit grünem Pfeil nach unten beim Laden/Eingang und rotem Pfeil nach oben beim Entladen/Ausgang; die Anzeige folgt der Entitätseinheit, also `W`/`kW` bei Leistungssensoren und `kWh` bei Energiesensoren
- Optionale Batterie-Min-/Max-SoC-Entitäten fließen ins Advisor Dashboard ein, damit Reserve und Ladeziel berücksichtigt werden; zu lange volle Hausbatterien zwischen 90 und 100% werden hervorgehoben
- Advisor-Diagnosen für veraltete Sensorwerte, hohen Netzbezug trotz voller Batterie, Batterie-Temperaturlimits, sehr tiefen SoC, häufige Tageszyklen und gleichzeitige Import-/Exportwerte bei getrennten Netzsensoren
- Animierte Stromfluss-Linien zwischen den vorhandenen Bildelementen, basierend auf den konfigurierten HUD-Positionen ohne Anpassung der Bilddateien
- Optionale Gas- und Wärmepumpen-Overlays mit eigener Aktivierung, frei definierbarem Label, Entität, Position, Größe und Ausrichtung der Wärmepumpe; Gas kann einen Zählerverbrauch für 30 Minuten, 1 Stunde oder 24 Stunden anzeigen
- PV, Wechselrichter und Wallbox können Auslastungsbalken anhand konfigurierbarer kW/kWp-Maximalwerte anzeigen
- Optionale Import-/Export-Box im Bild, standardmäßig unten rechts beim Stromkabel positioniert, plus Netzstatus-Kachel mit Bezug, Einspeisung oder Autarkie; unterstützt einen Vorzeichen-Sensor oder getrennte Bezugs-/Einspeise-Sensoren
- Optionale Auto-Entitäten für Max-/Ziel-SoC, verbunden/eingesteckt und Laden aktiviert steuern die Advisor-Empfehlungen, damit kein Ladevorschlag erscheint, wenn das Auto schon am Ziel-SoC ist; länger hohe Auto-SoC-Werte über 80%/90% lösen priorisierte Batteriepflege-Hinweise aus
- Tooltips pro Wert mit Entität, Rohwert, formatiertem Wert und Aktualisierungszeit
- Klick auf entity-basierte Boxen und Kacheln öffnet ein 24/48-Stunden-Verlaufsdiagramm aus Home-Assistant-History-Daten
- Eigenes Advisor Dashboard mit Live-Status, PV-/Netz-/Last-/Batterie-Kennzahlen, eigenen KPI-Werten, Autarkie-/Eigenverbrauchsschätzung, Sensor-Diagnosen und mehreren priorisierten Empfehlungen bei Überschuss, Netzbezug, Batteriestand, Wallbox-Laden, Wärmepumpe, flexiblen Haushaltsverbrauchern und auffälliger PV-/Lastsituation
- Warnzustände für nicht verfügbare/offline Sensoren und niedrigen Batteriestand
- Frei definierbare KPI-Kacheln unter dem Bild, z. B. CO₂ gespart heute, Autarkiegrad oder spezifischer Ertrag
- Variante `apartment_building_balcony_solar` für Balkonsolar mit PV-Leistung, Batterie und Wechselrichter
- Dezentes Statuslabel im Bild mit letzter Aktualisierung und optionalem Wetterstatus
- Optionale Wetterbilder per `weather_entity`, zum Beispiel `_sunny`, `_rainy`, `_cloudy`, `_snowy` oder `_thunderstorm`
- UI- und Editor-Labels folgen automatisch der Home-Assistant-Sprache (`en`, `de`, `es`, `fr`, `pl`)
- Optionale Ansichtsauswahl oben in der Karte für `Hausansicht` oder `Advisor Dashboard`
- In der Home-Assistant-Kartenauswahl mit Preview registriert

## Installation (HACS)

1. Repository in HACS als **Custom repository** mit Typ **Dashboard** hinzufügen.
2. **HA Solar Dashboard Card** installieren.
3. Home Assistant neu starten (oder Ressourcen neu laden).
4. Karte in Lovelace hinzufügen.

> Detaillierte Konfigurationsoptionen finden Sie in der englischen Standard-README: [README.md](README.md)
