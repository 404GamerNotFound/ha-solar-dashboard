# HA Solar Dashboard Card (Deutsch)

Eine benutzerdefinierte Home-Assistant-Lovelace-Karte für HACS mit moderner PV-/Energieübersicht auf Basis eines Hausbildes.

## Screenshots

![Haus-Dashboard mit PV, Batterie, Netz, Gas, Wallbox und Umgebungskacheln](images/readme/dashboard-house-view.webp)

<table>
  <tr>
    <td><img src="images/readme/advisor-dashboard.webp" width="260" alt="Energy Advisor Dashboard"></td>
    <td><img src="images/readme/charts-dashboard.webp" width="260" alt="Charts Dashboard"></td>
    <td><img src="images/readme/records-dashboard.webp" width="260" alt="Rekorde Dashboard"></td>
  </tr>
  <tr>
    <td align="center">Advisor</td>
    <td align="center">Charts</td>
    <td align="center">Rekorde</td>
  </tr>
</table>

## Kurzüberblick

- Bildbasiertes Lovelace-Dashboard für PV, Batterie, Wechselrichter, Netz, E-Auto, Garten, Grundriss, Advisor, Charts und Rekorde.
- Integrierter Editor mit Setup-Assistent, Entitätsvorschlägen, Layout-Steuerung und Regionalprofilen.
- EU-/US-taugliche Voreinstellungen über `region_profile` und `unit_system`, inklusive `$`-Prefix, `gal`, `°F`, `in`, `psi`, `gal/min` und `mi`.
- Mehrsprachige Karten- und Editor-Labels für `en`, `de`, `es`, `fr` und `pl`.

## Funktionen

- Hintergrundbild (Haus/PV-Design)
- Automatischer Tag-/Nachtbildwechsel über `sun.sun` (`*_day.png` bei Tag)
- Overlay-Widgets auf frei positionierbaren Punkten
- Wählbare Hauslayouts aus dem `images`-Ordner
- Variante `terraced_middle_house` mit Tag-/Nachtbild
- Variante `bungalow` mit Tag-/Nachtbild
- Konfigurierbare Entitäten und eigene Labels für PV, Batterie, Wechselrichter, Wallbox, Wasserzähler, Gesamtleistung und Import/Export
- Mehrere Wechselrichter können wie PV-Dach-Strings zusammengefasst oder einzeln angezeigt werden; der bestehende Wechselrichter ist automatisch Wechselrichter 1
- Optionaler Umschalter oben für Live-, 1h-, 24h-, Monats-, Jahres- und Gesamtwerte über separate kWh-Zähler je Leistungsbox
- Optionale zweite Wallbox-Entität, standardmäßig deaktiviert und automatisch neben der ersten Wallbox positioniert
- Optionale Verbrauchs-Kachel für den Hausverbrauch
- Optionale Wasserzähler-Box mit Anzeige in `m³`, `L` oder `gal`, frei definierbarer Entität, Label, Position und Einheit
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
- Währungsformatierung über `currency_position: auto | prefix | suffix`; typische Prefix-Symbole wie `$` werden bei `auto` vor den Betrag gesetzt
- Konfigurierbare Grenzwerte für hohe und kritische Netzspannung über `grid_voltage_warning_threshold` und `grid_voltage_critical_threshold`
- Optionale Auto-Entitäten für Max-/Ziel-SoC, verbunden/eingesteckt und Laden aktiviert steuern die Advisor-Empfehlungen, damit kein Ladevorschlag erscheint, wenn das Auto schon am Ziel-SoC ist; länger hohe Auto-SoC-Werte über 80%/90% lösen priorisierte Batteriepflege-Hinweise aus
- Optionaler EVCC-Lademodus-Schalter im E-Auto-Dashboard für Aus, PV, Min+PV und Schnell über `electric_vehicle.entities.mode_control`
- Regionalprofil für EU-/US-Setups über `region_profile` und `unit_system`, inklusive `$`-Prefix, `gal`, `°F`, `in`, `psi`, `gal/min` und `mi`; Gartenwerte und E-Auto-Reichweite werden in die Ziel-Einheiten umgerechnet
- Optionaler `electric_vehicle.evcc_loadpoint`-Slug für marq24/ha-evcc; typische Loadpoint- und Site-Entitäten wie Ladeleistung, PV-Regelgrund, Netzleistung, Hausakku-SoC und Einspeise-Puffer werden daraus automatisch erkannt
- Jede EVCC-Entität kann über `electric_vehicle.display.<key>.image` und `.tile` getrennt für Bild-Badge und Kachel unter dem Bild ein-/ausgeblendet oder nur mobil/nur Desktop angezeigt werden; `.tile_position` steuert die Kachelreihenfolge
- E-Auto- und Gartenansicht unterstützen eigene Tag-/Nachtbilder über `electric_vehicle.day_image`/`night_image` und `garden.day_image`/`night_image`
- Garten-Dashboard mit konfigurierbaren Bewässerungszonen (`garden.zones[]`) inklusive Bildmarker, Zonen-Kacheln, Plantext/Plan-Entität und sicherem More-Info-Standard statt versehentlichem Direkt-Toggle
- Manuelle Gartenaktionen (`garden.manual_actions[]`) können Script-/Button-Entitäten mit optionalem Bestätigungstext als Kacheln anzeigen
- Die Bild-Badges im E-Auto- und Garten-Dashboard können über `positions.*.left` und `positions.*.top` im Layout-Editor frei positioniert werden
- Der Einrichtungs-Assistent erscheint zusätzlich kontextbezogen auf Energie-, Geräte-, E-Auto-, Garten- und Advisor-Seite und übernimmt dort nur Vorschläge für die jeweilige Seite
- Tooltips pro Wert mit Entität, Rohwert, formatiertem Wert und Aktualisierungszeit
- Klick auf entity-basierte Boxen und Kacheln öffnet ein 24/48-Stunden-Verlaufsdiagramm aus Home-Assistant-History-Daten
- Eigenes Advisor Dashboard mit Live-Status, PV-/Netz-/Last-/Batterie-Kennzahlen, eigenen KPI-Werten, Autarkie-/Eigenverbrauchsschätzung, Sensor-Diagnosen und mehreren priorisierten Empfehlungen bei Überschuss, Netzbezug, Batteriestand, Wallbox-Laden, Wärmepumpe, flexiblen Haushaltsverbrauchern und auffälliger PV-/Lastsituation
- Warnzustände für nicht verfügbare/offline Sensoren und niedrigen Batteriestand
- Frei definierbare KPI-Kacheln unter dem Bild, z. B. CO₂ gespart heute, Autarkiegrad oder spezifischer Ertrag
- Eigene Umgebungs-Kachelebene für Sensorwerte wie Innentemperatur, Warmwasser, Außentemperatur, Luftdruck oder Luftqualität; standardmäßig wird die Einheit der Entität verwendet
- Variante `apartment_building_balcony_solar` für Balkonsolar mit PV-Leistung, Batterie und Wechselrichter
- Dezentes Statuslabel im Bild mit letzter Aktualisierung und optionalem Wetterstatus
- Optionale Wetterbilder per `weather_entity`, zum Beispiel `_sunny`, `_rainy`, `_cloudy`, `_snowy` oder `_thunderstorm`
- UI- und Editor-Labels folgen automatisch der Home-Assistant-Sprache (`en`, `de`, `es`, `fr`, `pl`)
- Optionale Ansichtsauswahl oben in der Karte für `Hausansicht`, `E-Auto`, `Garten`, `Grundriss`, `Advisor`, `Charts` und `Rekorde`; die Bereiche können im Editor ein- und ausgeblendet werden
- In der Home-Assistant-Kartenauswahl mit Preview registriert

## Eigene Bilder und Wettervarianten

Eigene Bilder legst du in Home Assistant unter `/config/www/` ab und trägst sie in der Karte als `/local/...` ein. Beispiel:

```yaml
weather_entity: weather.home
image: /local/solar/house_night.png
day_image: /local/solar/house_day.png
```

Die Dateien müssen dann tatsächlich hier liegen:

```text
/config/www/solar/house_night.png
/config/www/solar/house_day.png
/config/www/solar/house_night_rainy.png
/config/www/solar/house_day_rainy.png
```

Wenn `weather_entity` z. B. `rainy` meldet und es Tag ist, versucht die Karte zuerst `/local/solar/house_day_rainy.png`, dann `/local/solar/house_night_rainy.png`, danach `/local/solar/house_day.png` und zuletzt `/local/solar/house_night.png`. Wenn keine eigene Datei geladen werden kann, fällt die Karte weiterhin auf die mitgelieferten Standardbilder zurück.

## Installation (HACS)

1. Repository in HACS als **Custom repository** mit Typ **Dashboard** hinzufügen.
2. **HA Solar Dashboard Card** installieren.
3. Home Assistant neu starten (oder Ressourcen neu laden).
4. Karte in Lovelace hinzufügen.

## Regionalprofile und Einheiten

Mit `region_profile` setzt du schnell passende Voreinstellungen für EU- oder US-Installationen. Mit `unit_system` steuerst du nur das Einheitensystem. Einzelne explizit gesetzte Optionen gewinnen immer gegenüber dem Profil.

```yaml
# Europäische/metrische Voreinstellungen
region_profile: eu
unit_system: auto
```

```yaml
# US-Voreinstellungen
region_profile: us
unit_system: auto
```

Beim US-Profil setzt die Karte Geldwerte mit `$` vor den Betrag und nutzt für passende Anzeigen US-Einheiten wie Gallonen, Fahrenheit, Inch, PSI, Gallonen pro Minute und Meilen. Einzelne Einheiten kannst du weiterhin überschreiben:

```yaml
region_profile: us
units:
  water_meter: gal
  temperature: °F
  precipitation: in
  pressure: psi
  flow: gal/min
  distance: mi
```

Die Netzspannungs-Grenzwerte sind bewusst nicht Teil des Regionalprofils. US-Installationen können 120 V, 240 V oder Split-Phase-Werte liefern. Setze `grid_voltage_warning_threshold` und `grid_voltage_critical_threshold` deshalb passend zu deiner Anlage.

> Detaillierte Konfigurationsoptionen finden Sie in der englischen Standard-README: [README.md](README.md)
