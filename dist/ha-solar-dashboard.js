const CARD_TYPE = "ha-solar-dashboard-card";
const CARD_EDITOR_TYPE = "ha-solar-dashboard-card-editor";
const REPOSITORY_IMAGE_BASE =
  "https://raw.githubusercontent.com/404GamerNotFound/ha-solar-dashboard/main/images";

const WEATHER_IMAGE_SUFFIXES = {
  sunny: ["sunny"],
  clear: ["sunny"],
  "clear-night": ["clear"],
  partlycloudy: ["cloudy"],
  cloudy: ["cloudy"],
  fog: ["cloudy", "fog"],
  rainy: ["rainy"],
  pouring: ["rainy"],
  "lightning-rainy": ["rainy", "thunderstorm"],
  snowy: ["snowy", "snow", "winter"],
  snowy_rainy: ["snowy", "snow", "rainy"],
  "snowy-rainy": ["snowy", "snow", "rainy"],
  hail: ["hail"],
  lightning: ["thunderstorm"],
  windy: ["wind"],
  windy_variant: ["wind", "cloudy"],
  "windy-variant": ["wind", "cloudy"],
};

const ENERGY_RANGE_OPTIONS = [
  { key: "live", labelKey: "range.live", label: "Live" },
  { key: "1h", labelKey: "range.1h", label: "1h" },
  { key: "24h", labelKey: "range.24h", label: "24h" },
  { key: "month", labelKey: "range.month", label: "1 month" },
  { key: "year", labelKey: "range.year", label: "1 year" },
  { key: "total", labelKey: "range.total", label: "Total" },
];

const VIEW_MODE_OPTIONS = [
  { key: "house", labelKey: "view.house", label: "House View" },
  { key: "advisor", labelKey: "view.advisor", label: "Advisor Dashboard" },
];

const I18N = {
  en: {
    "aria.energyRangeSelector": "Select value range",
    "aria.houseSelector": "Select house",
    "aria.viewSelector": "Select dashboard view",
    "card.defaultTitle": "Energy Flow",
    "card.defaultTimeLabel": "Live",
    "advisor.action": "Action",
    "advisor.autarky": "Autarky",
    "advisor.batteryIdle": "Battery is not charging while surplus is exported. Check battery limits or charge mode.",
    "advisor.batteryLow": "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible.",
    "advisor.batteryNearlyFull": "Battery is nearly full, so additional PV is likely to be exported.",
    "advisor.batteryStatus": "Battery",
    "advisor.checkSensors": "Check unavailable or missing sensors so the energy balance stays reliable.",
    "advisor.configureConsumption": "Add a house consumption sensor to improve autarky and load analysis.",
    "advisor.configureGrid": "Add grid import/export sensors for better advice about surplus and grid draw.",
    "advisor.configurePvTotal": "Add PV total power or roof/shed PV sensors to improve production analysis.",
    "advisor.consumption": "Load",
    "advisor.evChargingGrid": "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended.",
    "advisor.evChargingPv": "EV charging is currently covered well by PV or stored energy.",
    "advisor.exporting": "Exporting surplus",
    "advisor.grid": "Grid",
    "advisor.headlineExport": "PV surplus is available",
    "advisor.headlineImport": "Grid import is active",
    "advisor.headlineNeutral": "Energy flow is balanced",
    "advisor.headlineSetup": "More sensors unlock better advice",
    "advisor.headlineWarning": "Energy setup needs attention",
    "advisor.highLoad": "Current load is high compared with PV production. Check large consumers if this is unexpected.",
    "advisor.importing": "Importing",
    "advisor.lowPv": "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors.",
    "advisor.noAdvice": "No urgent action right now.",
    "advisor.appliances": "Appliances",
    "advisor.panelTitle": "Energy Advisor",
    "advisor.pv": "PV",
    "advisor.recommendations": "Recommendations",
    "advisor.runAppliance": "Run a flexible household appliance now if it is waiting.",
    "advisor.selfConsumption": "Self-use",
    "advisor.selfSufficient": "Self-sufficient",
    "advisor.startEvCharging": "Start or increase EV charging while surplus is available.",
    "advisor.status": "Status",
    "advisor.suggestionCountOne": "{count} suggestion",
    "advisor.suggestionCount": "{count} suggestions",
    "advisor.surplus": "Surplus",
    "advisor.surplusGeneral": "PV surplus is available. Prioritize flexible loads while export is active.",
    "advisor.unknown": "Unknown",
    "advisor.useHeatPump": "Use heat pump boost or preheat hot water while PV surplus is available.",
    "advisor.wallbox": "EV",
    "editor.showViewSelector": "Show House/Advisor view selector",
    "chart.close": "Close",
    "chart.empty": "No history data found",
    "chart.error": "History could not be loaded",
    "chart.loading": "Loading history…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Last {hours} hours",
    "editor.customDayImage": "Custom Day Image",
    "editor.customImage": "Custom Image",
    "editor.batteryChargeEntity": "Battery charge entity",
    "editor.batteryDischargeEntity": "Battery discharge entity",
    "editor.batteryFlowEntity": "Battery flow entity (+/-)",
    "editor.batteryTemperatureEntity": "Battery temperature entity",
    "editor.entity": "Entity",
    "editor.entityPlaceholder": "{label} entity",
    "editor.energy1hEntity": "1h kWh entity",
    "editor.energy24hEntity": "24h kWh entity",
    "editor.energyCounterEntity": "kWh counter entity",
    "editor.energyMonthEntity": "1 month kWh entity",
    "editor.energyRangeOverride": "Optional direct period sensors",
    "editor.energyYearEntity": "1 year kWh entity",
    "editor.energyTotalEntity": "Total kWh entity",
    "editor.liveEntity": "Live entity",
    "editor.houseType": "House Type",
    "editor.hudBoxOpacity": "HUD box opacity",
    "editor.hudBoxScale": "HUD box scale",
    "editor.importExportEntity": "Import/Export Entity",
    "editor.importExportSignedEntity": "Signed import/export entity (+/-)",
    "editor.importPowerEntity": "Import entity",
    "editor.exportPowerEntity": "Export entity",
    "editor.importExportLabels": "Import/Export labels",
    "editor.importLabel": "Import label",
    "editor.exportLabel": "Export label",
    "editor.neutralLabel": "Self-sufficient label",
    "editor.kpiAdd": "Add tile",
    "editor.kpiColor": "Color",
    "editor.kpiColumns": "Tile width",
    "editor.kpiEntity": "KPI entity",
    "editor.kpiLabel": "KPI label",
    "editor.kpiPosition": "Tile position",
    "editor.kpiRemove": "Remove",
    "editor.kpiStaticValue": "Static value",
    "editor.labelHideDesktop": "Hide on desktop",
    "editor.labelHideMobile": "Hide on phones",
    "editor.labelOptions": "Label display",
    "editor.labelShowFooter": "Show label in footer KPIs",
    "editor.labelShowImage": "Show label in image",
    "editor.maxPowerKw": "Max power (kW/kWp)",
    "editor.optionalDayImage": "Optional daylight image",
    "editor.powerDecimals": "Power decimals",
    "editor.powerDisplayMode": "Power display mode",
    "editor.rawMode": "Raw value + configured unit",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.advisorMaxSuggestions": "Advisor suggestions",
    "editor.overlayEnable": "Show {label}",
    "editor.overlayLabel": "Label",
    "editor.overlayOrientation": "Orientation",
    "editor.overlayOrientationLeft": "Left side",
    "editor.overlayOrientationRight": "Right side",
    "editor.overlayPeriod": "Period",
    "editor.overlaySize": "Size",
    "editor.period1h": "1 hour",
    "editor.period24h": "24 hours",
    "editor.period30m": "30 minutes",
    "editor.phaseEntity": "Phase entity",
    "editor.pvForecastTodayEntity": "Forecast today entity",
    "editor.pvLabels": "PV labels",
    "editor.pvPeakTodayEntity": "Peak today entity",
    "editor.pvPowerLabel": "Power label",
    "editor.pvTodayEnergyEntity": "Generated today entity",
    "editor.remainingChargeTimeEntity": "Remaining charge time entity",
    "editor.vehicleSocEntity": "Vehicle SoC entity",
    "editor.sectionBoxes": "Boxes, live/kWh entities, unit, and position",
    "editor.sectionKpis": "Custom KPI tiles",
    "editor.sectionOverlays": "Image overlays",
    "editor.showBox": "Show {label}",
    "editor.showEnergyRangeSelector": "Show Live/1h/24h/month/year/total selector",
    "editor.showHouseSelector": "Show house selector",
    "editor.showGridStatusTile": "Show grid status tile",
    "editor.showLiveLabel": "Show live label",
    "editor.showMetricTiles": "Show metric boxes below image",
    "editor.showPowerFlows": "Show animated power flows",
    "editor.showStatusLabel": "Show image status label",
    "editor.showTitle": "Show title",
    "editor.showWeatherStatus": "Show current weather in status label",
    "editor.timeLabel": "Time Label",
    "editor.title": "Title",
    "editor.unit": "Unit",
    "editor.viewMode": "Default view",
    "editor.weatherEntity": "Weather Entity",
    "editor.setupWizard": "Setup wizard",
    "editor.setupIntro": "Helps with the first setup by suggesting sensors for PV, battery, inverter, EV charger, grid, consumption, weather, and kWh counters.",
    "editor.setupHelp": "Review the suggestions before applying them. Use \"Fill empty fields\" for a safe first pass or \"Replace detected fields\" when you want to overwrite existing detected assignments.",
    "editor.setupEntityCount": "{count} entities available",
    "editor.setupNoEntities": "Open this editor in Home Assistant so entities can be detected.",
    "editor.setupFillEmpty": "Fill empty fields",
    "editor.setupReplaceAll": "Replace detected fields",
    "editor.setupSuggestions": "Detected suggestions",
    "editor.setupNoSuggestions": "No strong entity matches found yet.",
    "editor.setupApplyOne": "Use",
    "editor.setupCurrent": "Current",
    "editor.setupSuggested": "Suggested",
    "editor.setupConfidence": "{score}% match",
    "editor.setupApplied": "Applied {count} suggestion(s).",
    "editor.setupApplyNone": "No empty fields were changed.",
    "editor.xPosition": "X Position",
    "editor.yPosition": "Y Position",
    "flow.charge": "Incoming",
    "flow.discharge": "Outgoing",
    "house.apartment_building": "Apartment Building",
    "house.apartment_building_balcony_solar": "Apartment Building Balcony Solar",
    "house.bungalow": "Bungalow",
    "house.city_villa": "City Villa",
    "house.city_villa_pitched_roof": "City Villa with Pitched Roof",
    "house.duplex_house": "Duplex House",
    "house.single_family_home": "Single Family Home",
    "house.terraced_middle_house": "Terraced Middle House",
    "metrics.battery_level": "Battery",
    "metrics.grid_status": "Grid",
    "metrics.house_consumption_power": "Consumption",
    "metrics.import_export_power": "Import/Export",
    "metrics.inverter_power": "Inverter",
    "metrics.pv_power": "PV Power",
    "metrics.pv_roof_power": "Roof PV",
    "metrics.pv_shed_power": "Shed PV",
    "metrics.pv_total_power": "PV Total",
    "metrics.wallbox_power": "EV Charger",
    "metrics.wallbox2_power": "EV Charger 2",
    "overlay.heatpump": "Heat pump",
    "overlay.smoke": "Gas",
    "phase.auto": "Auto",
    "phase.many": "{count} phases",
    "phase.one": "1 phase",
    "pvLabel.forecastToday": "Forecast today",
    "pvLabel.peakToday": "Peak today",
    "pvLabel.power": "Power",
    "pvLabel.todayEnergy": "Generated today",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Live",
    "range.month": "1 month",
    "range.total": "Total",
    "range.year": "1 year",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Last updated: {time}",
    "status.selfSufficient": "Self-sufficient",
    "status.weather": "Weather: {weather}",
    "tooltip.entity": "Entity",
    "tooltip.flow": "Flow",
    "tooltip.load": "Utilization",
    "tooltip.max": "Maximum",
    "tooltip.phases": "Phases",
    "tooltip.raw": "Raw value",
    "tooltip.remainingChargeTime": "Remaining charge time",
    "tooltip.status": "Status",
    "tooltip.temperature": "Temperature",
    "tooltip.updated": "Updated",
    "tooltip.value": "Value",
    "tooltip.vehicleSoc": "Vehicle SoC",
    "value.remainingChargeTime": "{value} left",
    "value.temperature": "Temp {value}",
    "view.advisor": "Advisor Dashboard",
    "view.house": "House View",
    "weather.clear": "Clear",
    "weather.clear-night": "Clear",
    "weather.cloudy": "Cloudy",
    "weather.fog": "Fog",
    "weather.hail": "Hail",
    "weather.lightning": "Thunderstorm",
    "weather.lightning-rainy": "Thunderstorm rain",
    "weather.partlycloudy": "Partly cloudy",
    "weather.pouring": "Pouring",
    "weather.rainy": "Rainy",
    "weather.snowy": "Snowy",
    "weather.snowy-rainy": "Sleet",
    "weather.sunny": "Sunny",
    "weather.windy": "Windy",
    "weather.windy-variant": "Windy/cloudy",
    "warning.batteryLow": "Battery low",
    "warning.sensorMissing": "Entity not found",
    "warning.sensorOffline": "Sensor offline",
    "warning.sensorUnavailable": "Sensor unavailable",
  },
  de: {
    "aria.energyRangeSelector": "Wertebereich auswählen",
    "aria.houseSelector": "Haus auswählen",
    "aria.viewSelector": "Dashboard-Ansicht auswählen",
    "card.defaultTitle": "Energiefluss",
    "card.defaultTimeLabel": "Live",
    "advisor.action": "Aktion",
    "advisor.autarky": "Autarkie",
    "advisor.batteryIdle": "Die Batterie lädt nicht, obwohl Überschuss eingespeist wird. Prüfe Batterielimits oder den Lademodus.",
    "advisor.batteryLow": "Der Batteriestand ist niedrig. Behalte die Reserve im Blick und vermeide flexible Verbraucher, wenn möglich.",
    "advisor.batteryNearlyFull": "Die Batterie ist fast voll, zusätzlicher PV-Ertrag wird wahrscheinlich eingespeist.",
    "advisor.batteryStatus": "Batterie",
    "advisor.checkSensors": "Prüfe nicht verfügbare oder fehlende Sensoren, damit die Energiebilanz zuverlässig bleibt.",
    "advisor.configureConsumption": "Füge einen Hausverbrauchs-Sensor hinzu, um Autarkie und Lastanalyse zu verbessern.",
    "advisor.configureGrid": "Füge Import-/Export-Sensoren hinzu, damit Überschuss und Netzbezug besser bewertet werden können.",
    "advisor.configurePvTotal": "Füge PV-Gesamtleistung oder Dach-/Schuppen-PV-Sensoren hinzu, um die Erzeugungsanalyse zu verbessern.",
    "advisor.consumption": "Last",
    "advisor.evChargingGrid": "Die Wallbox lädt, während Netzbezug aktiv ist. Reduziere die Ladeleistung oder warte auf mehr PV, falls das nicht gewollt ist.",
    "advisor.evChargingPv": "Die Wallbox wird aktuell gut durch PV oder gespeicherte Energie gedeckt.",
    "advisor.exporting": "Einspeisung",
    "advisor.grid": "Netz",
    "advisor.headlineExport": "PV-Überschuss ist verfügbar",
    "advisor.headlineImport": "Netzbezug ist aktiv",
    "advisor.headlineNeutral": "Der Energiefluss ist ausgeglichen",
    "advisor.headlineSetup": "Mehr Sensoren schalten bessere Hinweise frei",
    "advisor.headlineWarning": "Die Energiekonfiguration braucht Aufmerksamkeit",
    "advisor.highLoad": "Die aktuelle Last ist im Vergleich zur PV-Erzeugung hoch. Prüfe große Verbraucher, falls das unerwartet ist.",
    "advisor.importing": "Netzbezug",
    "advisor.lowPv": "Die PV-Produktion ist trotz Tageslicht niedrig. Wenn das Wetter klar ist, prüfe Wechselrichter oder PV-Sensoren.",
    "advisor.noAdvice": "Aktuell besteht kein dringender Handlungsbedarf.",
    "advisor.appliances": "Haushalt",
    "advisor.panelTitle": "Energy Advisor",
    "advisor.pv": "PV",
    "advisor.recommendations": "Empfehlungen",
    "advisor.runAppliance": "Starte jetzt einen wartenden flexiblen Haushaltsverbraucher.",
    "advisor.selfConsumption": "Eigenverbrauch",
    "advisor.selfSufficient": "Autark",
    "advisor.startEvCharging": "Starte oder erhöhe die Wallbox-Ladung, solange Überschuss verfügbar ist.",
    "advisor.status": "Status",
    "advisor.suggestionCountOne": "{count} Hinweis",
    "advisor.suggestionCount": "{count} Hinweise",
    "advisor.surplus": "Überschuss",
    "advisor.surplusGeneral": "PV-Überschuss ist verfügbar. Priorisiere flexible Verbraucher, solange eingespeist wird.",
    "advisor.unknown": "Unbekannt",
    "advisor.useHeatPump": "Nutze Wärmepumpen-Boost oder Warmwasser-Vorheizen, solange PV-Überschuss verfügbar ist.",
    "advisor.wallbox": "Wallbox",
    "editor.showViewSelector": "Haus-/Advisor-Ansichtsauswahl anzeigen",
    "chart.close": "Schließen",
    "chart.empty": "Keine Verlaufsdaten gefunden",
    "chart.error": "Verlauf konnte nicht geladen werden",
    "chart.loading": "Verlauf wird geladen…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Letzte {hours} Stunden",
    "editor.customDayImage": "Eigenes Tagbild",
    "editor.customImage": "Eigenes Bild",
    "editor.batteryChargeEntity": "Batterie-Lade-Entität",
    "editor.batteryDischargeEntity": "Batterie-Entlade-Entität",
    "editor.batteryFlowEntity": "Batteriefluss-Entität (+/-)",
    "editor.batteryTemperatureEntity": "Batterie-Temperatur-Entität",
    "editor.entity": "Entität",
    "editor.entityPlaceholder": "{label} Entität",
    "editor.energy1hEntity": "1h-kWh-Entität",
    "editor.energy24hEntity": "24h-kWh-Entität",
    "editor.energyCounterEntity": "kWh-Zähler-Entität",
    "editor.energyMonthEntity": "1 Monat-kWh-Entität",
    "editor.energyRangeOverride": "Optionale direkte Zeitraum-Sensoren",
    "editor.energyYearEntity": "1 Jahr-kWh-Entität",
    "editor.energyTotalEntity": "Gesamt-kWh-Entität",
    "editor.liveEntity": "Live-Entität",
    "editor.houseType": "Haustyp",
    "editor.hudBoxOpacity": "HUD-Box-Deckkraft",
    "editor.hudBoxScale": "HUD-Box-Skalierung",
    "editor.importExportEntity": "Import-/Export-Entität",
    "editor.importExportSignedEntity": "Import-/Export-Entität mit Vorzeichen (+/-)",
    "editor.importPowerEntity": "Bezugs-Entität",
    "editor.exportPowerEntity": "Einspeise-Entität",
    "editor.importExportLabels": "Import-/Export-Labels",
    "editor.importLabel": "Bezugs-Label",
    "editor.exportLabel": "Einspeise-Label",
    "editor.neutralLabel": "Autark-Label",
    "editor.kpiAdd": "Kachel hinzufügen",
    "editor.kpiColor": "Farbe",
    "editor.kpiColumns": "Kachelbreite",
    "editor.kpiEntity": "KPI-Entität",
    "editor.kpiLabel": "KPI-Label",
    "editor.kpiPosition": "Kachelposition",
    "editor.kpiRemove": "Entfernen",
    "editor.kpiStaticValue": "Fester Wert",
    "editor.labelHideDesktop": "Auf PC ausblenden",
    "editor.labelHideMobile": "Auf Handys ausblenden",
    "editor.labelOptions": "Label-Anzeige",
    "editor.labelShowFooter": "Label in den KPIs im Footer anzeigen",
    "editor.labelShowImage": "Label im Bild anzeigen",
    "editor.maxPowerKw": "Maximalleistung (kW/kWp)",
    "editor.optionalDayImage": "Optionales Tagesbild",
    "editor.powerDecimals": "Leistungs-Nachkommastellen",
    "editor.powerDisplayMode": "Leistungsanzeige",
    "editor.rawMode": "Rohwert + konfigurierte Einheit",
    "editor.auto": "Auto",
    "editor.autoWKw": "Automatisch W/kW",
    "editor.advisorMaxSuggestions": "Advisor-Hinweise",
    "editor.overlayEnable": "{label} anzeigen",
    "editor.overlayLabel": "Label",
    "editor.overlayOrientation": "Ausrichtung",
    "editor.overlayOrientationLeft": "Links am Haus",
    "editor.overlayOrientationRight": "Rechts am Haus",
    "editor.overlayPeriod": "Zeitraum",
    "editor.overlaySize": "Größe",
    "editor.period1h": "1 Stunde",
    "editor.period24h": "24 Stunden",
    "editor.period30m": "30 Minuten",
    "editor.phaseEntity": "Phasen-Entität",
    "editor.pvForecastTodayEntity": "Prognose-heute-Entität",
    "editor.pvLabels": "PV-Labels",
    "editor.pvPeakTodayEntity": "Peak-heute-Entität",
    "editor.pvPowerLabel": "Leistungs-Label",
    "editor.pvTodayEnergyEntity": "Heute-erzeugt-Entität",
    "editor.remainingChargeTimeEntity": "Verbleibende Ladezeit-Entität",
    "editor.vehicleSocEntity": "Auto-SoC-Entität",
    "editor.sectionBoxes": "Boxen, Live-/kWh-Entitäten, Einheit und Position",
    "editor.sectionKpis": "Eigene KPI-Kacheln",
    "editor.sectionOverlays": "Bild-Overlays",
    "editor.showBox": "{label} anzeigen",
    "editor.showEnergyRangeSelector": "Live-/1h-/24h-/Monat-/Jahr-/Gesamt-Auswahl anzeigen",
    "editor.showHouseSelector": "Hausauswahl anzeigen",
    "editor.showGridStatusTile": "Netzstatus-Kachel anzeigen",
    "editor.showLiveLabel": "Live-Label anzeigen",
    "editor.showMetricTiles": "Messwertboxen unter dem Bild anzeigen",
    "editor.showPowerFlows": "Animierte Stromflüsse anzeigen",
    "editor.showStatusLabel": "Statuslabel im Bild anzeigen",
    "editor.showTitle": "Titel anzeigen",
    "editor.showWeatherStatus": "Aktuelles Wetter im Statuslabel anzeigen",
    "editor.timeLabel": "Zeitlabel",
    "editor.title": "Titel",
    "editor.unit": "Einheit",
    "editor.viewMode": "Standardansicht",
    "editor.weatherEntity": "Wetter-Entität",
    "editor.setupWizard": "Einrichtungs-Assistent",
    "editor.setupIntro": "Hilft bei der Ersteinrichtung, indem passende Sensoren für PV, Batterie, Wechselrichter, Wallbox, Netz, Verbrauch, Wetter und kWh-Zähler vorgeschlagen werden.",
    "editor.setupHelp": "Prüfe die Vorschläge vor dem Übernehmen. \"Leere Felder füllen\" ist der sichere erste Schritt, \"Erkannte Felder ersetzen\" überschreibt vorhandene erkannte Zuordnungen.",
    "editor.setupEntityCount": "{count} Entitäten verfügbar",
    "editor.setupNoEntities": "Öffne diesen Editor in Home Assistant, damit Entitäten erkannt werden können.",
    "editor.setupFillEmpty": "Leere Felder füllen",
    "editor.setupReplaceAll": "Erkannte Felder ersetzen",
    "editor.setupSuggestions": "Erkannte Vorschläge",
    "editor.setupNoSuggestions": "Noch keine sicheren Entitäts-Treffer gefunden.",
    "editor.setupApplyOne": "Übernehmen",
    "editor.setupCurrent": "Aktuell",
    "editor.setupSuggested": "Vorschlag",
    "editor.setupConfidence": "{score}% Treffer",
    "editor.setupApplied": "{count} Vorschlag/Vorschläge übernommen.",
    "editor.setupApplyNone": "Keine leeren Felder wurden geändert.",
    "editor.xPosition": "X-Position",
    "editor.yPosition": "Y-Position",
    "flow.charge": "Eingehend",
    "flow.discharge": "Ausgehend",
    "house.apartment_building": "Mehrfamilienhaus",
    "house.apartment_building_balcony_solar": "Mehrfamilienhaus Balkonsolar",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Stadtvilla",
    "house.city_villa_pitched_roof": "Stadtvilla mit Satteldach",
    "house.duplex_house": "Doppelhaus",
    "house.single_family_home": "Einfamilienhaus",
    "house.terraced_middle_house": "Reihenmittelhaus",
    "metrics.battery_level": "Batterie",
    "metrics.grid_status": "Netz",
    "metrics.house_consumption_power": "Verbrauch",
    "metrics.import_export_power": "Import/Export",
    "metrics.inverter_power": "Wechselrichter",
    "metrics.pv_power": "PV-Leistung",
    "metrics.pv_roof_power": "PV Dach",
    "metrics.pv_shed_power": "PV Schuppen",
    "metrics.pv_total_power": "PV Gesamt",
    "metrics.wallbox_power": "Wallbox",
    "metrics.wallbox2_power": "Wallbox 2",
    "overlay.heatpump": "Wärmepumpe",
    "overlay.smoke": "Gas",
    "phase.auto": "Auto",
    "phase.many": "{count} Phasen",
    "phase.one": "1 Phase",
    "pvLabel.forecastToday": "Prognose heute",
    "pvLabel.peakToday": "Peak heute",
    "pvLabel.power": "Leistung",
    "pvLabel.todayEnergy": "Heute erzeugt",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Live",
    "range.month": "1 Monat",
    "range.total": "Gesamt",
    "range.year": "1 Jahr",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Zuletzt aktualisiert: {time}",
    "status.selfSufficient": "Autark",
    "status.weather": "Wetter: {weather}",
    "tooltip.entity": "Entität",
    "tooltip.flow": "Fluss",
    "tooltip.load": "Auslastung",
    "tooltip.max": "Maximum",
    "tooltip.phases": "Phasen",
    "tooltip.raw": "Rohwert",
    "tooltip.remainingChargeTime": "Verbleibende Ladezeit",
    "tooltip.status": "Status",
    "tooltip.temperature": "Temperatur",
    "tooltip.updated": "Aktualisiert",
    "tooltip.value": "Wert",
    "tooltip.vehicleSoc": "Auto SoC",
    "value.remainingChargeTime": "Noch {value}",
    "value.temperature": "Temp {value}",
    "view.advisor": "Advisor Dashboard",
    "view.house": "Hausansicht",
    "weather.clear": "Klar",
    "weather.clear-night": "Klar",
    "weather.cloudy": "Bewölkt",
    "weather.fog": "Nebel",
    "weather.hail": "Hagel",
    "weather.lightning": "Gewitter",
    "weather.lightning-rainy": "Gewitterregen",
    "weather.partlycloudy": "Teilweise bewölkt",
    "weather.pouring": "Starkregen",
    "weather.rainy": "Regnerisch",
    "weather.snowy": "Schnee",
    "weather.snowy-rainy": "Schneeregen",
    "weather.sunny": "Sonnig",
    "weather.windy": "Windig",
    "weather.windy-variant": "Windig/bewölkt",
    "warning.batteryLow": "Batterie niedrig",
    "warning.sensorMissing": "Entität nicht gefunden",
    "warning.sensorOffline": "Sensor offline",
    "warning.sensorUnavailable": "Sensor nicht verfügbar",
  },
  es: {
    "aria.energyRangeSelector": "Seleccionar rango de valores",
    "aria.houseSelector": "Seleccionar casa",
    "card.defaultTitle": "Flujo de energía",
    "card.defaultTimeLabel": "En vivo",
    "chart.close": "Cerrar",
    "chart.empty": "No se encontraron datos históricos",
    "chart.error": "No se pudo cargar el historial",
    "chart.loading": "Cargando historial…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Últimas {hours} horas",
    "editor.customDayImage": "Imagen diurna personalizada",
    "editor.customImage": "Imagen personalizada",
    "editor.batteryChargeEntity": "Entidad de carga de batería",
    "editor.batteryDischargeEntity": "Entidad de descarga de batería",
    "editor.batteryFlowEntity": "Entidad de flujo de batería (+/-)",
    "editor.batteryTemperatureEntity": "Entidad de temperatura de batería",
    "editor.entity": "Entidad",
    "editor.entityPlaceholder": "Entidad de {label}",
    "editor.energy1hEntity": "Entidad kWh 1h",
    "editor.energy24hEntity": "Entidad kWh 24h",
    "editor.energyCounterEntity": "Entidad contador kWh",
    "editor.energyMonthEntity": "Entidad kWh 1 mes",
    "editor.energyRangeOverride": "Sensores directos de periodo opcionales",
    "editor.energyYearEntity": "Entidad kWh 1 año",
    "editor.energyTotalEntity": "Entidad kWh total",
    "editor.liveEntity": "Entidad en vivo",
    "editor.houseType": "Tipo de casa",
    "editor.hudBoxOpacity": "Opacidad de cajas HUD",
    "editor.hudBoxScale": "Escala de cajas HUD",
    "editor.importExportEntity": "Entidad de importación/exportación",
    "editor.importExportSignedEntity": "Entidad importación/exportación con signo (+/-)",
    "editor.importPowerEntity": "Entidad de importación",
    "editor.exportPowerEntity": "Entidad de exportación",
    "editor.importExportLabels": "Etiquetas de importación/exportación",
    "editor.importLabel": "Etiqueta de importación",
    "editor.exportLabel": "Etiqueta de exportación",
    "editor.neutralLabel": "Etiqueta de autosuficiencia",
    "editor.kpiAdd": "Añadir mosaico",
    "editor.kpiColor": "Color",
    "editor.kpiColumns": "Ancho del mosaico",
    "editor.kpiEntity": "Entidad KPI",
    "editor.kpiLabel": "Etiqueta KPI",
    "editor.kpiPosition": "Posición del mosaico",
    "editor.kpiRemove": "Eliminar",
    "editor.kpiStaticValue": "Valor fijo",
    "editor.maxPowerKw": "Potencia máxima (kW/kWp)",
    "editor.optionalDayImage": "Imagen diurna opcional",
    "editor.powerDecimals": "Decimales de potencia",
    "editor.powerDisplayMode": "Modo de potencia",
    "editor.rawMode": "Valor bruto + unidad configurada",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.overlayEnable": "Mostrar {label}",
    "editor.overlayLabel": "Etiqueta",
    "editor.overlayOrientation": "Orientación",
    "editor.overlayOrientationLeft": "Lado izquierdo",
    "editor.overlayOrientationRight": "Lado derecho",
    "editor.overlayPeriod": "Periodo",
    "editor.overlaySize": "Tamaño",
    "editor.period1h": "1 hora",
    "editor.period24h": "24 horas",
    "editor.period30m": "30 minutos",
    "editor.phaseEntity": "Entidad de fases",
    "editor.remainingChargeTimeEntity": "Entidad de tiempo de carga restante",
    "editor.vehicleSocEntity": "Entidad SoC del vehículo",
    "editor.sectionBoxes": "Cajas, entidades en vivo/kWh, unidad y posición",
    "editor.sectionKpis": "Mosaicos KPI personalizados",
    "editor.sectionOverlays": "Superposiciones de imagen",
    "editor.showBox": "Mostrar {label}",
    "editor.showEnergyRangeSelector": "Mostrar selector en vivo/1h/24h/mes/año/total",
    "editor.showHouseSelector": "Mostrar selector de casa",
    "editor.showGridStatusTile": "Mostrar mosaico de red",
    "editor.showLiveLabel": "Mostrar etiqueta en vivo",
    "editor.showMetricTiles": "Mostrar cajas de métricas bajo la imagen",
    "editor.showPowerFlows": "Mostrar flujos de energía animados",
    "editor.showStatusLabel": "Mostrar etiqueta de estado en la imagen",
    "editor.showTitle": "Mostrar título",
    "editor.showWeatherStatus": "Mostrar clima actual en la etiqueta de estado",
    "editor.timeLabel": "Etiqueta de tiempo",
    "editor.title": "Título",
    "editor.unit": "Unidad",
    "editor.weatherEntity": "Entidad meteorológica",
    "editor.xPosition": "Posición X",
    "editor.yPosition": "Posición Y",
    "flow.charge": "Entrante",
    "flow.discharge": "Saliente",
    "house.apartment_building": "Edificio de apartamentos",
    "house.apartment_building_balcony_solar": "Edificio de apartamentos con solar de balcón",
    "house.bungalow": "Bungaló",
    "house.city_villa": "Villa urbana",
    "house.city_villa_pitched_roof": "Villa urbana con tejado inclinado",
    "house.duplex_house": "Casa dúplex",
    "house.single_family_home": "Casa unifamiliar",
    "house.terraced_middle_house": "Casa adosada central",
    "metrics.battery_level": "Batería",
    "metrics.grid_status": "Red",
    "metrics.house_consumption_power": "Consumo",
    "metrics.import_export_power": "Importación/exportación",
    "metrics.inverter_power": "Inversor",
    "metrics.pv_power": "Potencia FV",
    "metrics.pv_roof_power": "FV tejado",
    "metrics.pv_shed_power": "FV cobertizo",
    "metrics.pv_total_power": "FV total",
    "metrics.wallbox_power": "Cargador VE",
    "metrics.wallbox2_power": "Cargador VE 2",
    "overlay.heatpump": "Bomba de calor",
    "overlay.smoke": "Gas",
    "phase.auto": "Auto",
    "phase.many": "{count} fases",
    "phase.one": "1 fase",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "En vivo",
    "range.month": "1 mes",
    "range.total": "Total",
    "range.year": "1 año",
    "status.export": "Exportación",
    "status.import": "Importación",
    "status.lastUpdated": "Última actualización: {time}",
    "status.selfSufficient": "Autosuficiente",
    "status.weather": "Clima: {weather}",
    "tooltip.entity": "Entidad",
    "tooltip.flow": "Flujo",
    "tooltip.load": "Utilización",
    "tooltip.max": "Máximo",
    "tooltip.phases": "Fases",
    "tooltip.raw": "Valor bruto",
    "tooltip.remainingChargeTime": "Tiempo de carga restante",
    "tooltip.status": "Estado",
    "tooltip.temperature": "Temperatura",
    "tooltip.updated": "Actualizado",
    "tooltip.value": "Valor",
    "tooltip.vehicleSoc": "SoC del vehículo",
    "value.remainingChargeTime": "Quedan {value}",
    "value.temperature": "Temp {value}",
    "weather.clear": "Despejado",
    "weather.clear-night": "Despejado",
    "weather.cloudy": "Nublado",
    "weather.fog": "Niebla",
    "weather.hail": "Granizo",
    "weather.lightning": "Tormenta",
    "weather.lightning-rainy": "Tormenta con lluvia",
    "weather.partlycloudy": "Parcialmente nublado",
    "weather.pouring": "Lluvia intensa",
    "weather.rainy": "Lluvia",
    "weather.snowy": "Nieve",
    "weather.snowy-rainy": "Aguanieve",
    "weather.sunny": "Soleado",
    "weather.windy": "Ventoso",
    "weather.windy-variant": "Ventoso/nublado",
    "warning.batteryLow": "Batería baja",
    "warning.sensorMissing": "Entidad no encontrada",
    "warning.sensorOffline": "Sensor sin conexión",
    "warning.sensorUnavailable": "Sensor no disponible",
  },
  fr: {
    "aria.energyRangeSelector": "Sélectionner la période de valeur",
    "aria.houseSelector": "Sélectionner une maison",
    "card.defaultTitle": "Flux d'énergie",
    "card.defaultTimeLabel": "En direct",
    "chart.close": "Fermer",
    "chart.empty": "Aucune donnée historique trouvée",
    "chart.error": "Impossible de charger l'historique",
    "chart.loading": "Chargement de l'historique…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Dernières {hours} heures",
    "editor.customDayImage": "Image de jour personnalisée",
    "editor.customImage": "Image personnalisée",
    "editor.batteryChargeEntity": "Entité de charge batterie",
    "editor.batteryDischargeEntity": "Entité de décharge batterie",
    "editor.batteryFlowEntity": "Entité de flux batterie (+/-)",
    "editor.batteryTemperatureEntity": "Entité température batterie",
    "editor.entity": "Entité",
    "editor.entityPlaceholder": "Entité {label}",
    "editor.energy1hEntity": "Entité kWh 1h",
    "editor.energy24hEntity": "Entité kWh 24h",
    "editor.energyCounterEntity": "Entité compteur kWh",
    "editor.energyMonthEntity": "Entité kWh 1 mois",
    "editor.energyRangeOverride": "Capteurs de période directs optionnels",
    "editor.energyYearEntity": "Entité kWh 1 an",
    "editor.energyTotalEntity": "Entité kWh total",
    "editor.liveEntity": "Entité directe",
    "editor.houseType": "Type de maison",
    "editor.hudBoxOpacity": "Opacité des boîtes HUD",
    "editor.hudBoxScale": "Échelle des boîtes HUD",
    "editor.importExportEntity": "Entité import/export",
    "editor.importExportSignedEntity": "Entité import/export signée (+/-)",
    "editor.importPowerEntity": "Entité import",
    "editor.exportPowerEntity": "Entité export",
    "editor.importExportLabels": "Libellés import/export",
    "editor.importLabel": "Libellé import",
    "editor.exportLabel": "Libellé export",
    "editor.neutralLabel": "Libellé autonomie",
    "editor.kpiAdd": "Ajouter une tuile",
    "editor.kpiColor": "Couleur",
    "editor.kpiColumns": "Largeur de tuile",
    "editor.kpiEntity": "Entité KPI",
    "editor.kpiLabel": "Libellé KPI",
    "editor.kpiPosition": "Position de tuile",
    "editor.kpiRemove": "Supprimer",
    "editor.kpiStaticValue": "Valeur fixe",
    "editor.maxPowerKw": "Puissance max. (kW/kWp)",
    "editor.optionalDayImage": "Image de jour optionnelle",
    "editor.powerDecimals": "Décimales de puissance",
    "editor.powerDisplayMode": "Mode d'affichage de la puissance",
    "editor.rawMode": "Valeur brute + unité configurée",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.overlayEnable": "Afficher {label}",
    "editor.overlayLabel": "Libellé",
    "editor.overlayOrientation": "Orientation",
    "editor.overlayOrientationLeft": "Côté gauche",
    "editor.overlayOrientationRight": "Côté droit",
    "editor.overlayPeriod": "Période",
    "editor.overlaySize": "Taille",
    "editor.period1h": "1 heure",
    "editor.period24h": "24 heures",
    "editor.period30m": "30 minutes",
    "editor.phaseEntity": "Entité phases",
    "editor.remainingChargeTimeEntity": "Entité temps de charge restant",
    "editor.vehicleSocEntity": "Entité SoC véhicule",
    "editor.sectionBoxes": "Boîtes, entités directes/kWh, unité et position",
    "editor.sectionKpis": "Tuiles KPI personnalisées",
    "editor.sectionOverlays": "Superpositions d'image",
    "editor.showBox": "Afficher {label}",
    "editor.showEnergyRangeSelector": "Afficher le sélecteur direct/1h/24h/mois/an/total",
    "editor.showHouseSelector": "Afficher le sélecteur de maison",
    "editor.showGridStatusTile": "Afficher la tuile réseau",
    "editor.showLiveLabel": "Afficher le libellé en direct",
    "editor.showMetricTiles": "Afficher les boîtes de mesure sous l'image",
    "editor.showPowerFlows": "Afficher les flux d'énergie animés",
    "editor.showStatusLabel": "Afficher le libellé d'état dans l'image",
    "editor.showTitle": "Afficher le titre",
    "editor.showWeatherStatus": "Afficher la météo actuelle dans le libellé d'état",
    "editor.timeLabel": "Libellé de temps",
    "editor.title": "Titre",
    "editor.unit": "Unité",
    "editor.weatherEntity": "Entité météo",
    "editor.xPosition": "Position X",
    "editor.yPosition": "Position Y",
    "flow.charge": "Entrant",
    "flow.discharge": "Sortant",
    "house.apartment_building": "Immeuble d'appartements",
    "house.apartment_building_balcony_solar": "Immeuble avec solaire de balcon",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Villa urbaine",
    "house.city_villa_pitched_roof": "Villa urbaine avec toit incliné",
    "house.duplex_house": "Maison duplex",
    "house.single_family_home": "Maison individuelle",
    "house.terraced_middle_house": "Maison mitoyenne centrale",
    "metrics.battery_level": "Batterie",
    "metrics.grid_status": "Réseau",
    "metrics.house_consumption_power": "Consommation",
    "metrics.import_export_power": "Import/export",
    "metrics.inverter_power": "Onduleur",
    "metrics.pv_power": "Puissance PV",
    "metrics.pv_roof_power": "PV toiture",
    "metrics.pv_shed_power": "PV abri",
    "metrics.pv_total_power": "PV total",
    "metrics.wallbox_power": "Chargeur VE",
    "metrics.wallbox2_power": "Chargeur VE 2",
    "overlay.heatpump": "Pompe à chaleur",
    "overlay.smoke": "Gaz",
    "phase.auto": "Auto",
    "phase.many": "{count} phases",
    "phase.one": "1 phase",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Direct",
    "range.month": "1 mois",
    "range.total": "Total",
    "range.year": "1 an",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Dernière mise à jour : {time}",
    "status.selfSufficient": "Autonome",
    "status.weather": "Météo : {weather}",
    "tooltip.entity": "Entité",
    "tooltip.flow": "Flux",
    "tooltip.load": "Utilisation",
    "tooltip.max": "Maximum",
    "tooltip.phases": "Phases",
    "tooltip.raw": "Valeur brute",
    "tooltip.remainingChargeTime": "Temps de charge restant",
    "tooltip.status": "État",
    "tooltip.temperature": "Température",
    "tooltip.updated": "Mis à jour",
    "tooltip.value": "Valeur",
    "tooltip.vehicleSoc": "SoC véhicule",
    "value.remainingChargeTime": "{value} restant",
    "value.temperature": "Temp {value}",
    "weather.clear": "Dégagé",
    "weather.clear-night": "Dégagé",
    "weather.cloudy": "Nuageux",
    "weather.fog": "Brouillard",
    "weather.hail": "Grêle",
    "weather.lightning": "Orage",
    "weather.lightning-rainy": "Orage avec pluie",
    "weather.partlycloudy": "Partiellement nuageux",
    "weather.pouring": "Forte pluie",
    "weather.rainy": "Pluvieux",
    "weather.snowy": "Neige",
    "weather.snowy-rainy": "Neige fondue",
    "weather.sunny": "Ensoleillé",
    "weather.windy": "Venteux",
    "weather.windy-variant": "Venteux/nuageux",
    "warning.batteryLow": "Batterie faible",
    "warning.sensorMissing": "Entité introuvable",
    "warning.sensorOffline": "Capteur hors ligne",
    "warning.sensorUnavailable": "Capteur indisponible",
  },
  pl: {
    "aria.energyRangeSelector": "Wybierz zakres wartości",
    "aria.houseSelector": "Wybierz dom",
    "card.defaultTitle": "Przepływ energii",
    "card.defaultTimeLabel": "Na żywo",
    "chart.close": "Zamknij",
    "chart.empty": "Nie znaleziono danych historii",
    "chart.error": "Nie udało się wczytać historii",
    "chart.loading": "Ładowanie historii…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Ostatnie {hours} godzin",
    "editor.customDayImage": "Własny obraz dzienny",
    "editor.customImage": "Własny obraz",
    "editor.batteryChargeEntity": "Encja ładowania baterii",
    "editor.batteryDischargeEntity": "Encja rozładowania baterii",
    "editor.batteryFlowEntity": "Encja przepływu baterii (+/-)",
    "editor.batteryTemperatureEntity": "Encja temperatury baterii",
    "editor.entity": "Encja",
    "editor.entityPlaceholder": "Encja {label}",
    "editor.energy1hEntity": "Encja kWh 1h",
    "editor.energy24hEntity": "Encja kWh 24h",
    "editor.energyCounterEntity": "Encja licznika kWh",
    "editor.energyMonthEntity": "Encja kWh 1 miesiąc",
    "editor.energyRangeOverride": "Opcjonalne bezpośrednie sensory okresów",
    "editor.energyYearEntity": "Encja kWh 1 rok",
    "editor.energyTotalEntity": "Łączna encja kWh",
    "editor.liveEntity": "Encja na żywo",
    "editor.houseType": "Typ domu",
    "editor.hudBoxOpacity": "Przezroczystość pól HUD",
    "editor.hudBoxScale": "Skala pól HUD",
    "editor.importExportEntity": "Encja importu/eksportu",
    "editor.importExportSignedEntity": "Encja importu/eksportu ze znakiem (+/-)",
    "editor.importPowerEntity": "Encja importu",
    "editor.exportPowerEntity": "Encja eksportu",
    "editor.importExportLabels": "Etykiety importu/eksportu",
    "editor.importLabel": "Etykieta importu",
    "editor.exportLabel": "Etykieta eksportu",
    "editor.neutralLabel": "Etykieta samowystarczalności",
    "editor.kpiAdd": "Dodaj kafelek",
    "editor.kpiColor": "Kolor",
    "editor.kpiColumns": "Szerokość kafelka",
    "editor.kpiEntity": "Encja KPI",
    "editor.kpiLabel": "Etykieta KPI",
    "editor.kpiPosition": "Pozycja kafelka",
    "editor.kpiRemove": "Usuń",
    "editor.kpiStaticValue": "Stała wartość",
    "editor.maxPowerKw": "Maks. moc (kW/kWp)",
    "editor.optionalDayImage": "Opcjonalny obraz dzienny",
    "editor.powerDecimals": "Miejsca dziesiętne mocy",
    "editor.powerDisplayMode": "Tryb wyświetlania mocy",
    "editor.rawMode": "Wartość surowa + skonfigurowana jednostka",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.overlayEnable": "Pokaż {label}",
    "editor.overlayLabel": "Etykieta",
    "editor.overlayOrientation": "Orientacja",
    "editor.overlayOrientationLeft": "Lewa strona",
    "editor.overlayOrientationRight": "Prawa strona",
    "editor.overlayPeriod": "Okres",
    "editor.overlaySize": "Rozmiar",
    "editor.period1h": "1 godzina",
    "editor.period24h": "24 godziny",
    "editor.period30m": "30 minut",
    "editor.phaseEntity": "Encja faz",
    "editor.remainingChargeTimeEntity": "Encja pozostałego czasu ładowania",
    "editor.vehicleSocEntity": "Encja SoC pojazdu",
    "editor.sectionBoxes": "Pola, encje na żywo/kWh, jednostka i pozycja",
    "editor.sectionKpis": "Własne kafelki KPI",
    "editor.sectionOverlays": "Nakładki obrazu",
    "editor.showBox": "Pokaż {label}",
    "editor.showEnergyRangeSelector": "Pokaż wybór na żywo/1h/24h/miesiąc/rok/łącznie",
    "editor.showHouseSelector": "Pokaż wybór domu",
    "editor.showGridStatusTile": "Pokaż kafelek sieci",
    "editor.showLiveLabel": "Pokaż etykietę na żywo",
    "editor.showMetricTiles": "Pokaż pola metryk pod obrazem",
    "editor.showPowerFlows": "Pokaż animowane przepływy energii",
    "editor.showStatusLabel": "Pokaż etykietę statusu na obrazie",
    "editor.showTitle": "Pokaż tytuł",
    "editor.showWeatherStatus": "Pokaż aktualną pogodę w etykiecie statusu",
    "editor.timeLabel": "Etykieta czasu",
    "editor.title": "Tytuł",
    "editor.unit": "Jednostka",
    "editor.weatherEntity": "Encja pogody",
    "editor.xPosition": "Pozycja X",
    "editor.yPosition": "Pozycja Y",
    "flow.charge": "Przychodzące",
    "flow.discharge": "Wychodzące",
    "house.apartment_building": "Budynek wielorodzinny",
    "house.apartment_building_balcony_solar": "Budynek wielorodzinny z fotowoltaiką balkonową",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Willa miejska",
    "house.city_villa_pitched_roof": "Willa miejska z dachem spadzistym",
    "house.duplex_house": "Dom bliźniaczy",
    "house.single_family_home": "Dom jednorodzinny",
    "house.terraced_middle_house": "Środkowy dom szeregowy",
    "metrics.battery_level": "Bateria",
    "metrics.grid_status": "Sieć",
    "metrics.house_consumption_power": "Zużycie",
    "metrics.import_export_power": "Import/eksport",
    "metrics.inverter_power": "Falownik",
    "metrics.pv_power": "Moc PV",
    "metrics.pv_roof_power": "PV dach",
    "metrics.pv_shed_power": "PV szopa",
    "metrics.pv_total_power": "PV łącznie",
    "metrics.wallbox_power": "Ładowarka EV",
    "metrics.wallbox2_power": "Ładowarka EV 2",
    "overlay.heatpump": "Pompa ciepła",
    "overlay.smoke": "Gaz",
    "phase.auto": "Auto",
    "phase.many": "{count} fazy",
    "phase.one": "1 faza",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Na żywo",
    "range.month": "1 miesiąc",
    "range.total": "Łącznie",
    "range.year": "1 rok",
    "status.export": "Eksport",
    "status.import": "Import",
    "status.lastUpdated": "Ostatnia aktualizacja: {time}",
    "status.selfSufficient": "Samowystarczalny",
    "status.weather": "Pogoda: {weather}",
    "tooltip.entity": "Encja",
    "tooltip.flow": "Przepływ",
    "tooltip.load": "Wykorzystanie",
    "tooltip.max": "Maksimum",
    "tooltip.phases": "Fazy",
    "tooltip.raw": "Wartość surowa",
    "tooltip.remainingChargeTime": "Pozostały czas ładowania",
    "tooltip.status": "Status",
    "tooltip.temperature": "Temperatura",
    "tooltip.updated": "Zaktualizowano",
    "tooltip.value": "Wartość",
    "tooltip.vehicleSoc": "SoC pojazdu",
    "value.remainingChargeTime": "Pozostało {value}",
    "value.temperature": "Temp {value}",
    "weather.clear": "Bezchmurnie",
    "weather.clear-night": "Bezchmurnie",
    "weather.cloudy": "Pochmurno",
    "weather.fog": "Mgła",
    "weather.hail": "Grad",
    "weather.lightning": "Burza",
    "weather.lightning-rainy": "Burza z deszczem",
    "weather.partlycloudy": "Częściowe zachmurzenie",
    "weather.pouring": "Ulewa",
    "weather.rainy": "Deszczowo",
    "weather.snowy": "Śnieg",
    "weather.snowy-rainy": "Deszcz ze śniegiem",
    "weather.sunny": "Słonecznie",
    "weather.windy": "Wietrznie",
    "weather.windy-variant": "Wietrznie/pochmurno",
    "warning.batteryLow": "Niski poziom baterii",
    "warning.sensorMissing": "Nie znaleziono encji",
    "warning.sensorOffline": "Sensor offline",
    "warning.sensorUnavailable": "Sensor niedostępny",
  },
};

const SUPPORTED_LANGUAGES = Object.keys(I18N);

function languageFromHass(hass) {
  const rawLanguage = hass?.locale?.language
    || hass?.language
    || hass?.selectedLanguage
    || globalThis.navigator?.language
    || "en";
  const language = String(rawLanguage).toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(language) ? language : "en";
}

function translate(language, key, replacements = {}, fallback = "") {
  const dictionary = I18N[language] || I18N.en;
  const template = dictionary[key] ?? I18N.en[key] ?? fallback ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_match, name) => replacements[name] ?? "");
}

const HOUSE_VARIANTS = {
  single_family_home: {
    label: "Single Family Home",
    folder: "single_family_home",
    file: "single_family_home.png",
    dayFile: "single_family_home_day.png",
    fallbackFiles: ["single_family_home_legacy.png"],
    positions: {
      pv_roof_power: { left: 64, top: 28 },
      pv_shed_power: { left: 14, top: 80 },
      battery_level: { left: 49, top: 66 },
      inverter_power: { left: 53, top: 72 },
      wallbox_power: { left: 23, top: 57 },
      import_export_power: { left: 82, top: 83 },
    },
  },
  duplex_house: {
    label: "Duplex House",
    folder: "duplex_house",
    file: "duplex_house.png",
    dayFile: "duplex_house_day.png",
    positions: {
      pv_roof_power: { left: 46, top: 23 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 49, top: 73 },
      inverter_power: { left: 37, top: 56 },
      wallbox_power: { left: 27, top: 66 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  terraced_middle_house: {
    label: "Terraced Middle House",
    folder: "terraced_middle_house",
    file: "terraced_middle_house.png",
    dayFile: "terraced_middle_house_day.png",
    positions: {
      pv_roof_power: { left: 48, top: 18 },
      pv_shed_power: { left: 80, top: 76 },
      battery_level: { left: 33, top: 61 },
      inverter_power: { left: 34, top: 51 },
      wallbox_power: { left: 44, top: 66 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  apartment_building: {
    label: "Apartment Building",
    folder: "apartment_building",
    file: "apartment_building.png",
    dayFile: "apartment_building_day.png",
    positions: {
      pv_roof_power: { left: 53, top: 17 },
      pv_shed_power: { left: 16, top: 81 },
      battery_level: { left: 35, top: 65 },
      inverter_power: { left: 35, top: 72 },
      wallbox_power: { left: 21, top: 59 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  apartment_building_balcony_solar: {
    label: "Apartment Building Balcony Solar",
    folder: "apartment_building_balcony_solar",
    file: "apartment_building_balcony_solar.png",
    dayFile: "apartment_building_balcony_solar_day.png",
    positions: {
      battery_level: { left: 42, top: 70 },
      inverter_power: { left: 52, top: 58 },
      pv_total_power: { left: 62, top: 58 },
      import_export_power: { left: 82, top: 82 },
    },
    visible_boxes: {
      pv_roof_power: false,
      pv_shed_power: false,
      wallbox_power: false,
      wallbox2_power: false,
      import_export_power: true,
      battery_level: true,
      inverter_power: true,
      pv_total_power: true,
    },
    labels: {
      pv_total_power: "PV Power",
    },
    labelKeys: {
      pv_total_power: "metrics.pv_power",
    },
  },
  bungalow: {
    label: "Bungalow",
    folder: "bungalow",
    file: "bungalow.png",
    dayFile: "bungalow_day.png",
    positions: {
      pv_roof_power: { left: 51, top: 29 },
      pv_shed_power: { left: 16, top: 80 },
      battery_level: { left: 40, top: 66 },
      inverter_power: { left: 54, top: 69 },
      wallbox_power: { left: 25, top: 59 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  city_villa: {
    label: "City Villa",
    folder: "city_villa",
    file: "city_villa.png",
    dayFile: "city_villa_day.png",
    positions: {
      pv_roof_power: { left: 55, top: 16 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 43, top: 71 },
      inverter_power: { left: 58, top: 58 },
      wallbox_power: { left: 25, top: 57 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  city_villa_pitched_roof: {
    label: "City Villa with Pitched Roof",
    folder: "city_villa_pitched_roof",
    file: "city_villa_pitched_roof.png",
    dayFile: "city_villa_pitched_roof_day.png",
    positions: {
      pv_roof_power: { left: 58, top: 18 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 41, top: 66 },
      inverter_power: { left: 55, top: 56 },
      wallbox_power: { left: 25, top: 60 },
      import_export_power: { left: 82, top: 82 },
    },
  },
};

const DEFAULT_IMAGE_OVERLAYS = {
  single_family_home: {
    smoke: { left: 58, top: 18, width: 9 },
    heatpump: { left: 82, top: 63, width: 11, orientation: "right" },
  },
  duplex_house: {
    smoke: { left: 52, top: 18, width: 9 },
    heatpump: { left: 78, top: 66, width: 11, orientation: "right" },
  },
  terraced_middle_house: {
    smoke: { left: 51, top: 16, width: 8 },
    heatpump: { left: 66, top: 68, width: 10, orientation: "left" },
  },
  apartment_building: {
    smoke: { left: 52, top: 13, width: 8 },
    heatpump: { left: 79, top: 68, width: 10, orientation: "right" },
  },
  apartment_building_balcony_solar: {
    smoke: { left: 50, top: 13, width: 8 },
    heatpump: { left: 76, top: 70, width: 10, orientation: "right" },
  },
  bungalow: {
    smoke: { left: 50, top: 25, width: 8 },
    heatpump: { left: 79, top: 66, width: 11, orientation: "right" },
  },
  city_villa: {
    smoke: { left: 55, top: 15, width: 8 },
    heatpump: { left: 79, top: 65, width: 10, orientation: "right" },
  },
  city_villa_pitched_roof: {
    smoke: { left: 56, top: 18, width: 8 },
    heatpump: { left: 78, top: 65, width: 10, orientation: "right" },
  },
};

const IMAGE_OVERLAY_KEYS = ["smoke", "heatpump"];

const OVERLAY_TILE_METRICS = [
  { key: "overlay_smoke", label: "Gas", labelKey: "overlay.smoke", color: "yellow", unit: "overlay", overlay: "smoke", tileOrder: 7 },
  { key: "overlay_heatpump", label: "Heat pump", labelKey: "overlay.heatpump", color: "blue", unit: "overlay", overlay: "heatpump", tileOrder: 8 },
];

const METRICS = [
  { key: "pv_roof_power", label: "Roof PV", unit: "power", color: "yellow" },
  { key: "pv_shed_power", label: "Shed PV", unit: "power", color: "yellow" },
  { key: "battery_level", label: "Battery", unit: "battery", color: "green" },
  { key: "inverter_power", label: "Inverter", unit: "power", color: "blue" },
  { key: "wallbox_power", label: "EV Charger", unit: "power", color: "blue" },
  { key: "wallbox2_power", label: "EV Charger 2", unit: "power", color: "blue", optional: true },
  { key: "import_export_power", label: "Import/Export", unit: "power", color: "blue", optional: true, tile: false },
];

const PV_LABELS = [
  { suffix: "today_energy", labelKey: "pvLabel.todayEnergy", editorKey: "editor.pvTodayEnergyEntity", source: "entity", unit: "energy" },
  { suffix: "forecast_today", labelKey: "pvLabel.forecastToday", editorKey: "editor.pvForecastTodayEntity", source: "entity", unit: "energy" },
  { suffix: "peak_today", labelKey: "pvLabel.peakToday", editorKey: "editor.pvPeakTodayEntity", source: "entity", unit: "power" },
];

const TILE_METRICS = [
  ...METRICS,
  { key: "pv_total_power", label: "PV Total", unit: "power", color: "yellow", hud: false },
  { key: "house_consumption_power", label: "Consumption", unit: "power", color: "blue", hud: false, optional: true, tileOrder: 6 },
];

const STATUS_METRIC = { key: "import_export_power", label: "Import/Export", unit: "power", color: "blue" };
const GRID_STATUS_METRIC = {
  ...STATUS_METRIC,
  key: "grid_status",
  sourceKey: "import_export_power",
  label: "Grid",
  labelKey: "metrics.grid_status",
  gridStatus: true,
  hud: false,
  tileOrder: 90,
};

const DEFAULT_TILE_COLOR_RULES = {
  pv_roof_power: [
    { above: 3000, color: "#34d399", glow: true },
    { above: 1000, color: "#ffc233" },
    { below: 100, color: "#9ba3b8" },
  ],
  pv_shed_power: [
    { above: 3000, color: "#34d399", glow: true },
    { above: 1000, color: "#ffc233" },
    { below: 100, color: "#9ba3b8" },
  ],
  pv_total_power: [
    { above: 3000, color: "#34d399", glow: true },
    { above: 1000, color: "#ffc233" },
    { below: 100, color: "#9ba3b8" },
  ],
  battery_level: [
    { below: 20, color: "#f87171", glow: true },
    { below: 50, color: "#fb923c" },
    { above: 80, color: "#34d399" },
  ],
  import_export_power: [
    { gt: 25, color: "#fb923c", glow: true },
    { lt: -25, color: "#34d399", glow: true },
  ],
};

const STATIC_METRIC_COLORS = {
  yellow: "#ffc233",
  blue: "#1f8fff",
  green: "#34d399",
};

const MINUTE_MS = 60 * 1000;
const MAX_HISTORY_CACHE_ENTRIES = 48;
const MAX_COUNTER_CACHE_ENTRIES = 72;

function numericState(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const normalized = String(value ?? "").trim().replace(/,/g, ".");
  if (!normalized || ["unknown", "unavailable", "offline", "none", "null"].includes(normalized.toLowerCase())) return undefined;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

function adjacentWallboxPosition(basePosition = {}) {
  const baseLeft = Number(basePosition.left);
  const baseTop = Number(basePosition.top);
  const left = Number.isFinite(baseLeft) ? baseLeft : 50;
  const top = Number.isFinite(baseTop) ? baseTop : 50;
  const direction = left > 84 ? -1 : 1;
  return {
    left: Math.min(96, Math.max(4, left + direction * 9)),
    top: Math.min(96, Math.max(4, top)),
  };
}

function normalizeHouse(value) {
  if (!value) return undefined;
  const normalized = String(value).toLowerCase().trim().replace(/[\s_]+/g, "-");
  const aliases = {
    home: "single_family_home",
    modern: "single_family_home",
    einfamilienhaus: "single_family_home",
    "single-family-home": "single_family_home",
    doppelhaus: "duplex_house",
    "doppel-haus": "duplex_house",
    duplex: "duplex_house",
    "duplex-house": "duplex_house",
    reihenhaus: "terraced_middle_house",
    "reihen-haus": "terraced_middle_house",
    reihenmittelhaus: "terraced_middle_house",
    "reihen-mittelhaus": "terraced_middle_house",
    "reihen-mittel-haus": "terraced_middle_house",
    "terraced-house": "terraced_middle_house",
    "terraced-middle-house": "terraced_middle_house",
    mfh: "apartment_building",
    mehrfamilienhaus: "apartment_building",
    "mehr-familienhaus": "apartment_building",
    "mehrfamilien-haus": "apartment_building",
    "apartment-building": "apartment_building",
    "mehrfamilienhaus-balkonsolar": "apartment_building_balcony_solar",
    "mehr-familienhaus-balkonsolar": "apartment_building_balcony_solar",
    "mehrfamilienhaus-balkon-solar": "apartment_building_balcony_solar",
    "mehr-familienhaus-balkon-solar": "apartment_building_balcony_solar",
    balkonsolar: "apartment_building_balcony_solar",
    "balcony-solar": "apartment_building_balcony_solar",
    "apartment-building-balcony-solar": "apartment_building_balcony_solar",
    bungalow: "bungalow",
    "bungalow-house": "bungalow",
    villa: "city_villa",
    stadtvilla: "city_villa",
    "stadt-villa": "city_villa",
    "city-villa": "city_villa",
    stadtvilla_2: "city_villa_pitched_roof",
    "stadtvilla-2": "city_villa_pitched_roof",
    "stadtvilla-ohne-flachdach": "city_villa_pitched_roof",
    stadtvilla_dach: "city_villa_pitched_roof",
    "stadtvilla-dach": "city_villa_pitched_roof",
    "city-villa-pitched-roof": "city_villa_pitched_roof",
  };
  const key = aliases[normalized] || normalized;
  return HOUSE_VARIANTS[key] ? key : undefined;
}

class HaSolarDashboardCard extends HTMLElement {
  connectedCallback() {
    this._isCardConnected = true;
    if (this.config && this.shadowRoot) this._updateReadings();
  }

  disconnectedCallback() {
    this._isCardConnected = false;
    this._asyncRequestToken = (this._asyncRequestToken || 0) + 1;
    this._energyRangeLoading?.clear();
    this._overlayConsumptionLoading?.clear();
  }

  static getConfigElement() {
    return document.createElement(CARD_EDITOR_TYPE);
  }

  static getStubConfig() {
    return {
      type: `custom:${CARD_TYPE}`,
      title: "Solar Dashboard",
      time_label: "Live",
      house: "single_family_home",
      view_mode: "house",
      show_title: true,
      show_time_label: true,
      show_view_selector: true,
      show_house_selector: true,
      show_energy_range_selector: false,
      show_metric_tiles: true,
      show_power_flows: false,
      show_status_label: true,
      show_weather_status: false,
      show_grid_status_tile: true,
      hud_box_opacity: 0.65,
      hud_box_scale: 1,
      battery_low_threshold: 20,
      grid_neutral_threshold: 25,
      advisor_surplus_threshold: 250,
      advisor_import_threshold: 250,
      advisor_high_load_threshold: 3000,
      advisor_max_suggestions: 8,
      chart_hours: 24,
      max_power_kw: {
        pv_roof_power: 10,
        pv_shed_power: 3,
        pv_total_power: 13,
        inverter_power: 10,
        wallbox_power: 11,
        wallbox2_power: 11,
        import_export_power: 10,
      },
      dynamic_tile_colors: true,
      daylight_entity: "sun.sun",
      weather_entity: "",
      labels: {},
      label_visibility: {},
      energy_entities: {},
      tile_color_rules: DEFAULT_TILE_COLOR_RULES,
      custom_kpis: [],
      image_overlays: {
        smoke: { enabled: false, entity: "", period: "1h" },
        heatpump: { enabled: false, entity: "" },
      },
      visible_boxes: {
        pv_roof_power: true,
        pv_shed_power: true,
        battery_level: true,
        inverter_power: true,
        wallbox_power: true,
        wallbox2_power: false,
        import_export_power: true,
      },
      entities: {
        pv_roof_power: "sensor.pv_roof_power",
        pv_roof_power_today_energy: "",
        pv_roof_power_forecast_today: "",
        pv_roof_power_peak_today: "",
        pv_shed_power: "sensor.pv_shed_power",
        pv_shed_power_today_energy: "",
        pv_shed_power_forecast_today: "",
        pv_shed_power_peak_today: "",
        battery_level: "sensor.battery_level",
        battery_flow_power: "",
        battery_charge_power: "",
        battery_discharge_power: "",
        battery_temperature: "",
        inverter_power: "sensor.wechselrichter_power",
        wallbox_power: "sensor.wallbox_power",
        wallbox_phase: "",
        wallbox_soc: "",
        wallbox_remaining_time: "",
        wallbox2_power: "",
        wallbox2_phase: "",
        wallbox2_soc: "",
        wallbox2_remaining_time: "",
        pv_total_power: "sensor.pv_total_power",
        pv_total_power_today_energy: "",
        pv_total_power_forecast_today: "",
        pv_total_power_peak_today: "",
        import_export_power: "sensor.grid_power",
        import_power: "",
        export_power: "",
      },
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");

    this._asyncRequestToken = (this._asyncRequestToken || 0) + 1;
    this._energyRangeLoading?.clear();
    this._overlayConsumptionLoading?.clear();

    const house = this._normalizeHouse(config.house || config.variant || config.image_variant) || "single_family_home";
    const energyRange = this._normalizeEnergyRange(config.energy_range) || "live";
    const viewMode = this._normalizeViewMode(config.view_mode || config.mode || config.default_view) || "house";
    this._hasCustomTitle = Object.prototype.hasOwnProperty.call(config, "title");
    this._hasCustomTimeLabel = Object.prototype.hasOwnProperty.call(config, "time_label");

    this.config = {
      title: "Energy Flow",
      time_label: "Live",
      house,
      view_mode: viewMode,
      show_title: true,
      show_time_label: true,
      show_view_selector: true,
      show_house_selector: true,
      show_energy_range_selector: false,
      show_metric_tiles: true,
      show_power_flows: false,
      show_status_label: true,
      show_weather_status: false,
      show_grid_status_tile: true,
      hud_box_opacity: 0.65,
      hud_box_scale: 1,
      battery_low_threshold: 20,
      grid_neutral_threshold: 25,
      advisor_surplus_threshold: 250,
      advisor_import_threshold: 250,
      advisor_high_load_threshold: 3000,
      advisor_max_suggestions: 8,
      chart_hours: 24,
      daylight_entity: "sun.sun",
      weather_entity: "",
      dynamic_tile_colors: true,
      power_display_mode: "auto_kw",
      power_decimals: 2,
      energy_range: energyRange,
      units: { power: "auto", battery: "%" },
      entities: {},
      positions: {},
      visible_boxes: {},
      max_power_kw: {},
      labels: {},
      label_visibility: {},
      energy_entities: {},
      image_overlays: {},
      tile_color_rules: {},
      custom_kpis: [],
      ...config,
      house,
      view_mode: viewMode,
      energy_range: energyRange,
      units: {
        power: "auto",
        battery: "%",
        ...(config.units || {}),
      },
      entities: {
        ...(config.entities || {}),
      },
      positions: {
        ...(config.positions || {}),
      },
      visible_boxes: {
        ...(config.visible_boxes || config.boxes || {}),
      },
      max_power_kw: {
        ...(config.max_power_kw || {}),
      },
      labels: {
        ...(config.metric_labels || {}),
        ...(config.labels || {}),
      },
      label_visibility: {
        ...(config.label_display || {}),
        ...(config.label_visibility || {}),
      },
      energy_entities: {
        ...(config.energy_counters || {}),
        ...(config.energy_entities || {}),
      },
      image_overlays: {
        smoke: {
          ...((config.overlays || {}).smoke || {}),
          ...((config.image_overlays || {}).smoke || {}),
        },
        heatpump: {
          ...((config.overlays || {}).heatpump || {}),
          ...((config.image_overlays || {}).heatpump || {}),
        },
      },
      tile_color_rules: {
        ...DEFAULT_TILE_COLOR_RULES,
        ...(config.tile_color_rules || config.color_rules || {}),
      },
      custom_kpis: this._normalizeCustomKpis(config.custom_kpis || config.kpis || []),
    };
    delete this.config.show_energy_advisor;

    this.config.hud_box_opacity = this._clampNumber(this.config.hud_box_opacity, 0.65, 0, 1);
    this.config.hud_box_scale = this._clampNumber(this.config.hud_box_scale, 1, 0.6, 1.8);
    this.config.power_decimals = this._clampNumber(this.config.power_decimals, 2, 0, 3);
    this.config.battery_low_threshold = this._clampNumber(this.config.battery_low_threshold, 20, 0, 100);
    this.config.grid_neutral_threshold = this._clampNumber(this.config.grid_neutral_threshold, 25, 0, 1000000);
    this.config.advisor_surplus_threshold = this._clampNumber(this.config.advisor_surplus_threshold, 250, 0, 1000000);
    this.config.advisor_import_threshold = this._clampNumber(this.config.advisor_import_threshold, 250, 0, 1000000);
    this.config.advisor_high_load_threshold = this._clampNumber(this.config.advisor_high_load_threshold, 3000, 0, 1000000);
    this.config.advisor_max_suggestions = Math.round(this._clampNumber(this.config.advisor_max_suggestions, 8, 1, 12));
    this.config.chart_hours = [24, 48].includes(Number(this.config.chart_hours)) ? Number(this.config.chart_hours) : 24;
    this._chartHours = this._chartHours || this.config.chart_hours;
    this._historyCache = this._historyCache || new Map();
    this._overlayConsumptionCache = this._overlayConsumptionCache || new Map();
    this._overlayConsumptionLoading = this._overlayConsumptionLoading || new Set();
    this._energyRangeCache = this._energyRangeCache || new Map();
    this._energyRangeLoading = this._energyRangeLoading || new Set();

    this._selectedHouse = house;
    this._selectedEnergyRange = this._normalizeEnergyRange(this._selectedEnergyRange || this.config.energy_range) || "live";
    this._selectedViewMode = this._normalizeViewMode(this._selectedViewMode || this.config.view_mode) || "house";

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this._renderCardShell(this._layoutState());
  }

  set hass(hass) {
    const previousLanguage = this._lastLanguage || this._language();
    const previousImageKey = this._lastImageKey || this._imageStateKey();
    this._hass = hass;
    if (!this.config || !this.shadowRoot) return;

    const nextLanguage = this._language();
    const nextImageKey = this._imageStateKey();
    if (this.shadowRoot && (previousImageKey !== nextImageKey || previousLanguage !== nextLanguage)) {
      this._renderCardShell(this._layoutState());
      return;
    }
    this._updateReadings();
  }

  getCardSize() {
    return 6;
  }

  _language() {
    return languageFromHass(this._hass);
  }

  _t(key, replacements = {}, fallback = "") {
    return translate(this._language(), key, replacements, fallback);
  }

  _displayTitle() {
    return this._hasCustomTitle ? this.config.title : this._t("card.defaultTitle", {}, this.config.title);
  }

  _displayTimeLabel() {
    return this._hasCustomTimeLabel ? this.config.time_label : this._t("card.defaultTimeLabel", {}, this.config.time_label);
  }

  _houseLabel(key, variant = HOUSE_VARIANTS[key]) {
    return this._t(`house.${key}`, {}, variant?.label || key);
  }

  _normalizeHouse(value) {
    return normalizeHouse(value);
  }

  _normalizeEnergyRange(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "hour" || normalized === "hourly" || normalized === "1hr" || normalized === "60m") return "1h";
    if (normalized === "day" || normalized === "today" || normalized === "daily" || normalized === "24hr") return "24h";
    if (normalized === "monthly") return "month";
    if (normalized === "yearly") return "year";
    if (normalized === "all" || normalized === "overall" || normalized === "lifetime") return "total";
    return ENERGY_RANGE_OPTIONS.some((option) => option.key === normalized) ? normalized : undefined;
  }

  _normalizeViewMode(value) {
    const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "_");
    const aliases = {
      home: "house",
      haus: "house",
      house_view: "house",
      building: "house",
      advisor_dashboard: "advisor",
      advisor_view: "advisor",
      adviser: "advisor",
      adviser_dashboard: "advisor",
      energy_advisor: "advisor",
    };
    const key = aliases[normalized] || normalized;
    return VIEW_MODE_OPTIONS.some((option) => option.key === key) ? key : undefined;
  }

  _currentViewMode() {
    return this._normalizeViewMode(this._selectedViewMode || this.config?.view_mode) || "house";
  }

  _currentEnergyRange() {
    return this._normalizeEnergyRange(this._selectedEnergyRange || this.config?.energy_range) || "live";
  }

  _energyEntityConfig(key) {
    const config = this.config.energy_entities?.[key];
    if (!config) return {};
    if (typeof config === "string") return { entity: config };
    return typeof config === "object" ? config : {};
  }

  _metricEnergySource(metric, range = this._currentEnergyRange()) {
    if (!metric || metric.overlay || metric.customKpi || metric.gridStatus || metric.unit !== "power") return "";
    const normalizedRange = this._normalizeEnergyRange(range);
    if (!normalizedRange || normalizedRange === "live") return "";
    const config = this._energyEntityConfig(metric.key);
    const counterEntityId = config.entity || config.counter || config.kwh_entity || config.kwh || config.meter || "";
    if (counterEntityId) return { entityId: counterEntityId, mode: normalizedRange === "total" ? "direct" : "counter", range: normalizedRange };
    return "";
  }

  _metricEnergyEntityId(metric, range = this._currentEnergyRange()) {
    return this._metricEnergySource(metric, range)?.entityId || "";
  }

  _isMetricEnergyMode(metric) {
    return this._currentEnergyRange() !== "live" && Boolean(this._metricEnergyEntityId(metric));
  }

  _getEntityValue(entityId, fallback = "0") {
    const entity = this._getEntity(entityId);
    if (!entity) return fallback;
    return entity.state;
  }

  _getEntity(entityId) {
    if (!entityId) return undefined;
    return this._hass?.states?.[entityId];
  }

  _getEntityUnit(entityId) {
    return this._getEntity(entityId)?.attributes?.unit_of_measurement;
  }

  _getEntityLastUpdated(entityId) {
    const entity = this._getEntity(entityId);
    return entity?.last_updated || entity?.last_changed;
  }

  _gridSignedEntityId() {
    return this.config.entities?.import_export_power || "";
  }

  _gridImportEntityId() {
    const aliases = ["import_power", "grid_import_power", "import_export_import_power"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _gridExportEntityId() {
    const aliases = ["export_power", "grid_export_power", "import_export_export_power"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _hasGridPowerSource() {
    return Boolean(this._gridSignedEntityId() || this._gridImportEntityId() || this._gridExportEntityId());
  }

  _gridPrimaryEntityId() {
    return this._gridSignedEntityId() || this._gridImportEntityId() || this._gridExportEntityId();
  }

  _metricEntityId(metric) {
    if (metric.overlay) return this.config.image_overlays?.[metric.overlay]?.entity || "";
    if (metric.customKpi) return metric.customKpi.entity || "";
    if ((metric.sourceKey || metric.key) === "import_export_power") return this._gridPrimaryEntityId();
    if (!metric.gridStatus && this._currentEnergyRange() !== "live" && metric.unit === "power") return this._metricEnergyEntityId(metric);
    return this.config.entities?.[metric.sourceKey || metric.key] || "";
  }

  _formatValue(value) {
    const normalized = String(value ?? "").toLowerCase();
    if (
      value === undefined
      || value === null
      || normalized === "unknown"
      || normalized === "unavailable"
      || normalized === "offline"
    ) return "—";
    return value;
  }

  _unitForMetric(metric) {
    if (metric.overlay) return this.config.image_overlays?.[metric.overlay]?.unit || "auto";
    if (metric.customKpi) return metric.customKpi.unit;
    const metricUnit = this.config.units?.[metric.key];
    if (metricUnit !== undefined && String(metricUnit).trim() !== "") return metricUnit;
    return this.config.units?.[metric.unit];
  }

  _formatReading(metric) {
    if (metric.gridStatus) return this._formatGridStatusReading();
    if (metric.overlay) return this._formatOverlayReading(metric.overlay);
    if (metric.customKpi) return this._formatCustomKpiValue(metric.customKpi);
    if (metric.key === "import_export_power") return this._formatGridValueReading();
    if (this._currentEnergyRange() !== "live" && metric.unit === "power") {
      return this._formatEnergyRangeReading(metric);
    }
    const entityId = this.config.entities[metric.sourceKey || metric.key];
    const value = this._getEntityValue(entityId, entityId ? undefined : "0");
    const unit = this._unitForMetric(metric);
    const entityUnit = this._getEntityUnit(entityId);
    if (metric.unit === "power") return this._formatPowerValue(value, unit, entityUnit);
    return this._formatWithUnit(value, unit);
  }

  _normalizeCustomKpis(kpis) {
    if (!Array.isArray(kpis)) return [];
    return kpis
      .map((kpi, index) => {
        if (!kpi || typeof kpi !== "object") return undefined;
        const id = String(kpi.id || kpi.key || `kpi_${index + 1}`).trim().replace(/[^\w-]/g, "_");
        const label = String(kpi.label || kpi.name || `KPI ${index + 1}`).trim();
        const position = this._clampNumber(kpi.position ?? kpi.order ?? 100 + index, 100 + index, 0, 999);
        const columns = Math.round(this._clampNumber(kpi.columns ?? kpi.span ?? 1, 1, 1, 6));
        return {
          id,
          label,
          entity: String(kpi.entity || kpi.entity_id || "").trim(),
          value: kpi.value ?? "",
          unit: kpi.unit ?? "auto",
          position,
          columns,
          color: this._safeCssColor(kpi.color, "#1f8fff"),
          glow: kpi.glow,
          visible: kpi.visible !== false,
        };
      })
      .filter(Boolean);
  }

  _customKpiMetrics() {
    return (this.config.custom_kpis || [])
      .filter((kpi) => kpi.visible !== false)
      .map((kpi, index) => ({
        key: `custom_kpis.${kpi.id || index}`,
        label: kpi.label,
        unit: "custom",
        color: "blue",
        accentColor: kpi.color,
        customKpi: kpi,
        tileOrder: kpi.position ?? 100 + index,
        tileColumns: kpi.columns ?? 1,
      }));
  }

  _formatRoundedCustomValue(value) {
    const normalized = String(value ?? "").trim().replace(",", ".");
    if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) return String(value);
    const number = Number(normalized);
    if (!Number.isFinite(number)) return String(value);
    const decimals = Math.round(this._clampNumber(this.config.power_decimals, 2, 0, 3));
    return number
      .toFixed(decimals)
      .replace(/(\.\d*?)0+$/, "$1")
      .replace(/\.$/, "");
  }

  _formatCustomKpiValue(kpi) {
    const hasEntity = Boolean(kpi.entity);
    const rawValue = hasEntity ? this._getEntityValue(kpi.entity, undefined) : kpi.value;
    const value = this._formatValue(rawValue);
    if (value === "—") return value;
    const roundedValue = this._formatRoundedCustomValue(value);

    const entityUnit = hasEntity ? this._getEntityUnit(kpi.entity) : "";
    const configuredUnit = String(kpi.unit ?? "auto").trim();
    if (!configuredUnit || configuredUnit.toLowerCase() === "none") return String(roundedValue);
    if (configuredUnit.toLowerCase() === "auto") return entityUnit ? `${roundedValue} ${entityUnit}` : String(roundedValue);
    return `${roundedValue} ${configuredUnit}`;
  }

  _formatRelativeTime(dateString) {
    const timestamp = Date.parse(dateString || "");
    if (!Number.isFinite(timestamp)) return "";
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    const format = (value, unit) => {
      try {
        return new Intl.RelativeTimeFormat(this._language(), { numeric: "always" }).format(-value, unit);
      } catch (_err) {
        return new Intl.RelativeTimeFormat("en", { numeric: "always" }).format(-value, unit);
      }
    };
    if (seconds < 60) return format(seconds, "second");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return format(minutes, "minute");
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return format(hours, "hour");
    const days = Math.floor(hours / 24);
    return format(days, "day");
  }

  _latestEntityUpdate() {
    const timestamps = Object.values(this.config.entities || {})
      .map((entityId) => Date.parse(this._getEntityLastUpdated(entityId) || ""))
      .filter(Number.isFinite);
    if (timestamps.length === 0) return "";
    return new Date(Math.max(...timestamps)).toISOString();
  }

  _gridNeutralThreshold() {
    return this._clampNumber(this.config.grid_neutral_threshold, 25, 0, 1000000);
  }

  _configuredLabel(key, fallback) {
    const customLabel = this.config.labels?.[key];
    if (customLabel !== undefined && String(customLabel).trim() !== "") return String(customLabel).trim();
    return fallback;
  }

  _gridStatusLabel(kind) {
    if (kind === "import") return this._configuredLabel("import_export_import", this._t("status.import"));
    if (kind === "export") return this._configuredLabel("import_export_export", this._t("status.export"));
    if (kind === "neutral") return this._configuredLabel("import_export_neutral", this._t("status.selfSufficient"));
    return "";
  }

  _gridSignedFlowInfo() {
    const entityId = this._gridSignedEntityId();
    if (!entityId) return undefined;
    const rawValue = this._getEntityValue(entityId, undefined);
    const value = this._formatValue(rawValue);
    if (value === "—") {
      const warning = this._metricWarning(GRID_STATUS_METRIC);
      return { kind: "unavailable", label: warning?.label || this._t("warning.sensorUnavailable"), value: "—" };
    }

    const entityUnit = this._getEntityUnit(entityId);
    const watts = this._valueAsWatts(rawValue, entityUnit);
    const unit = this.config.units?.import_export_power || "auto";
    if (!Number.isFinite(watts)) {
      const formattedValue = this._isEnergyUnit(entityUnit)
        ? this._formatEnergyValue(rawValue, entityUnit, unit === "auto" ? "kWh" : unit)
        : this._formatPowerValue(rawValue, unit, entityUnit);
      return { kind: "unknown", label: String(value), value: formattedValue };
    }
    return { kind: "flow", watts, unit };
  }

  _gridSplitFlowInfo() {
    const importEntityId = this._gridImportEntityId();
    const exportEntityId = this._gridExportEntityId();
    if (!importEntityId && !exportEntityId) return undefined;

    const importValue = this._entityFlowValue(importEntityId);
    const exportValue = this._entityFlowValue(exportEntityId);
    if (!importValue && !exportValue) {
      const warning = this._metricWarning(GRID_STATUS_METRIC);
      return { kind: "unavailable", label: warning?.label || this._t("warning.sensorUnavailable"), value: "—" };
    }

    const importWatts = Math.abs(importValue?.kind === "energy" ? importValue.amount * 1000 : importValue?.amount || 0);
    const exportWatts = Math.abs(exportValue?.kind === "energy" ? exportValue.amount * 1000 : exportValue?.amount || 0);
    return {
      kind: "flow",
      watts: importWatts - exportWatts,
      unit: this.config.units?.import_export_power || this.config.units?.power || "auto",
    };
  }

  _gridFlowInfo() {
    return this._gridSignedFlowInfo() || this._gridSplitFlowInfo();
  }

  _gridStatusFromFlowInfo(info) {
    if (!info) return { kind: "none", label: "", value: "" };
    if (info.kind !== "flow") return info;
    const watts = info.watts;
    const unit = info.unit || "auto";
    const magnitude = Math.abs(watts);
    if (magnitude <= this._gridNeutralThreshold()) {
      return { kind: "neutral", label: this._gridStatusLabel("neutral"), value: this._formatPowerValue(0, unit, "W") };
    }

    const directionKind = watts < 0 ? "export" : "import";
    const direction = this._gridStatusLabel(directionKind);
    const formattedValue = this._formatPowerValue(magnitude, unit, "W");
    return { kind: directionKind, label: direction, value: formattedValue };
  }

  _gridStatusInfo() {
    return this._gridStatusFromFlowInfo(this._gridFlowInfo());
  }

  _formatGridStatusReading() {
    const status = this._gridStatusInfo();
    if (!status.label) return "—";
    if (status.kind === "neutral") return status.label;
    if (status.value && status.value !== "—") return `${status.label} ${status.value}`;
    return status.label;
  }

  _formatGridValueReading() {
    const status = this._gridStatusInfo();
    if (!status.label) return "—";
    return status.value || "—";
  }

  _formatImportExportStatus() {
    const status = this._gridStatusInfo();
    if (!status.label || status.kind === "unavailable") return "";
    if (status.kind === "neutral") return status.label;
    return `${status.label}: ${status.value}`;
  }

  _statusLabel() {
    const updatedAt = this._formatRelativeTime(this._latestEntityUpdate());
    const weather = this.config.show_weather_status ? this._formatWeatherStatus() : "";
    const importExport = this._formatImportExportStatus();
    return [
      updatedAt ? this._t("status.lastUpdated", { time: updatedAt }) : "",
      weather,
      importExport,
    ].filter(Boolean).join(" / ");
  }

  _formatWeatherStatus() {
    const state = this._weatherState();
    if (!state) return "";
    const weather = this._t(`weather.${state}`, {}, state.replace(/-/g, " "));
    return this._t("status.weather", { weather });
  }

  _formatWithUnit(rawValue, unit) {
    const value = this._formatValue(rawValue);
    if (value === "—") return value;
    if (unit === undefined || unit === null || String(unit).trim() === "") return value;
    return `${value} ${unit}`;
  }

  _normalizeUnit(unit) {
    return String(unit || "").trim().toLowerCase();
  }

  _isEnergyUnit(unit) {
    return ["wh", "kwh", "mwh"].includes(this._normalizeUnit(unit));
  }

  _isPowerUnit(unit) {
    return ["w", "kw", "mw"].includes(this._normalizeUnit(unit));
  }

  _valueAsWatts(value, unit) {
    const numericValue = numericState(value);
    if (!Number.isFinite(numericValue)) return undefined;
    const normalizedUnit = this._normalizeUnit(unit);
    if (normalizedUnit === "kw") return numericValue * 1000;
    if (normalizedUnit === "mw") return numericValue * 1000000;
    return numericValue;
  }

  _valueAsKwh(value, unit) {
    const numericValue = numericState(value);
    if (!Number.isFinite(numericValue)) return undefined;
    const normalizedUnit = this._normalizeUnit(unit);
    if (normalizedUnit === "wh") return numericValue / 1000;
    if (normalizedUnit === "mwh") return numericValue * 1000;
    return numericValue;
  }

  _formatEnergyValue(rawValue, entityUnit, targetUnit = "kWh") {
    const value = this._formatValue(rawValue);
    if (value === "—") return value;
    const normalizedTargetUnit = this._normalizeUnit(targetUnit);
    if (normalizedTargetUnit === "kwh") {
      const kwhValue = this._valueAsKwh(rawValue, entityUnit);
      if (kwhValue !== undefined) return `${kwhValue.toFixed(this.config.power_decimals)} kWh`;
    }
    return `${value} ${targetUnit || entityUnit || "kWh"}`;
  }

  _energyRangeMinutes(range) {
    const normalizedRange = this._normalizeEnergyRange(range);
    if (normalizedRange === "1h") return 60;
    if (normalizedRange === "24h") return 1440;
    if (normalizedRange === "month") return 30 * 24 * 60;
    if (normalizedRange === "year") return 365 * 24 * 60;
    return undefined;
  }

  _cacheBucketMsForMinutes(minutes) {
    if (!Number.isFinite(minutes) || minutes <= 60) return MINUTE_MS;
    if (minutes <= 24 * 60) return 5 * MINUTE_MS;
    if (minutes <= 31 * 24 * 60) return 30 * MINUTE_MS;
    return 6 * 60 * MINUTE_MS;
  }

  _cacheBucket(bucketMs = MINUTE_MS) {
    return Math.floor(Date.now() / bucketMs);
  }

  _setCacheEntry(cache, key, value, maxEntries) {
    if (!cache) return;
    if (cache.has(key)) cache.delete(key);
    cache.set(key, value);
    while (cache.size > maxEntries) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey === undefined) break;
      cache.delete(oldestKey);
    }
  }

  _isActiveRequest(token) {
    return token === (this._asyncRequestToken || 0);
  }

  _updateReadingsIfReady() {
    if (!this.config || !this.shadowRoot || !this._isCardConnected) return;
    this._updateReadings();
  }

  _energyRangeCacheKey(entityId, range) {
    const bucket = this._cacheBucket(this._cacheBucketMsForMinutes(this._energyRangeMinutes(range)));
    return `${entityId}|${range}|${bucket}`;
  }

  _energyRangeConsumptionInfo(metric) {
    const range = this._currentEnergyRange();
    const source = this._metricEnergySource(metric, range);
    if (!source?.entityId) return undefined;
    if (source.mode === "direct" || range === "total") {
      const value = this._getEntityValue(source.entityId, undefined);
      const amount = this._valueAsKwh(value, this._getEntityUnit(source.entityId));
      return {
        amount,
        unit: this._getEntityUnit(source.entityId) || "kWh",
        entityId: source.entityId,
        mode: "direct",
      };
    }

    const minutes = this._energyRangeMinutes(range);
    if (!Number.isFinite(minutes)) return undefined;
    if (this._hass?.states && !this._getEntity(source.entityId)) {
      return { error: true, amount: undefined, unit: "kWh", entityId: source.entityId, mode: "counter" };
    }

    const key = this._energyRangeCacheKey(source.entityId, range);
    const cached = this._energyRangeCache?.get(key);
    if (cached) return cached;
    this._requestEnergyRangeConsumption(source.entityId, minutes, key);
    return { loading: true, amount: undefined, unit: this._getEntityUnit(source.entityId) || "kWh", entityId: source.entityId, mode: "counter" };
  }

  _requestEnergyRangeConsumption(entityId, minutes, key) {
    if (!this._hass?.callApi || this._energyRangeLoading?.has(key)) return;
    const requestToken = this._asyncRequestToken || 0;
    this._energyRangeLoading.add(key);
    this._loadCounterConsumption(entityId, minutes, "kWh")
      .then((info) => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._energyRangeCache, key, { ...info, entityId, mode: "counter" }, MAX_COUNTER_CACHE_ENTRIES);
      })
      .catch(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._energyRangeCache, key, { error: true, amount: undefined, unit: this._getEntityUnit(entityId) || "kWh", entityId, mode: "counter" }, MAX_COUNTER_CACHE_ENTRIES);
      })
      .finally(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._energyRangeLoading?.delete(key);
        this._updateReadingsIfReady();
      });
  }

  _formatEnergyRangeReading(metric) {
    const info = this._energyRangeConsumptionInfo(metric);
    if (!info) return "—";
    if (info.loading) return "…";
    if (info.error || !Number.isFinite(info.amount)) return "—";
    return this._formatEnergyValue(info.amount, "kWh", "kWh");
  }

  _formatPowerValue(rawValue, unit, entityUnit) {
    const value = this._formatValue(rawValue);
    if (value === "—") return value;
    const decimals = Math.round(this._clampNumber(this.config.power_decimals, 2, 0, 3));

    const normalizedUnit = this._normalizeUnit(unit);
    const normalizedEntityUnit = this._normalizeUnit(entityUnit);

    if (this._isEnergyUnit(normalizedEntityUnit)) {
      if (!unit || normalizedUnit === "auto" || this._isPowerUnit(normalizedUnit)) {
        return this._formatEnergyValue(rawValue, entityUnit);
      }
      if (this._isEnergyUnit(normalizedUnit)) return this._formatEnergyValue(rawValue, entityUnit, unit);
    }

    if (normalizedUnit === "kwh") return this._formatEnergyValue(rawValue, entityUnit, "kWh");
    if (normalizedUnit === "w") {
      const wattValue = this._valueAsWatts(rawValue, entityUnit);
      return `${wattValue === undefined ? value : wattValue.toFixed(decimals)} W`;
    }
    if (normalizedUnit === "kw") {
      const wattValue = this._valueAsWatts(rawValue, entityUnit);
      if (wattValue === undefined) return `${value} kW`;
      return `${(wattValue / 1000).toFixed(decimals)} kW`;
    }
    if (unit && normalizedUnit !== "auto") return `${value} ${unit}`;

    const numericValue = this._isPowerUnit(normalizedEntityUnit)
      ? this._valueAsWatts(rawValue, entityUnit)
      : Number(rawValue);
    if (!Number.isFinite(numericValue)) return `${value} W`;

    const mode = this.config.power_display_mode || "auto_kw";
    if (mode === "auto_kw" && Math.abs(numericValue) >= 1000) {
      const kwValue = numericValue / 1000;
      return `${kwValue.toFixed(decimals)} kW`;
    }

    return `${numericValue.toFixed(decimals)} W`;
  }

  _metricNumericValue(metric) {
    if (metric.overlay) {
      if (metric.overlay === "smoke") return this._overlayGasConsumptionInfo()?.amount;
      const entityId = this.config.image_overlays?.heatpump?.entity;
      const value = this._getEntityValue(entityId, undefined);
      const number = numericState(value);
      return Number.isFinite(number) ? number : undefined;
    }
    if (metric.customKpi) {
      const kpi = metric.customKpi;
      const rawValue = kpi.entity ? this._getEntityValue(kpi.entity, undefined) : kpi.value;
      const number = numericState(rawValue);
      return Number.isFinite(number) ? number : undefined;
    }
    if ((metric.sourceKey || metric.key) === "import_export_power") {
      const flowInfo = this._gridFlowInfo();
      return Number.isFinite(flowInfo?.watts) ? flowInfo.watts : undefined;
    }
    if (this._currentEnergyRange() !== "live" && metric.unit === "power") {
      const info = this._energyRangeConsumptionInfo(metric);
      return Number.isFinite(info?.amount) ? info.amount : undefined;
    }
    const entityId = this._metricEntityId(metric);
    const value = this._getEntityValue(entityId, undefined);
    if (value === undefined || value === null || value === "unknown" || value === "unavailable") return undefined;
    const entityUnit = this._getEntityUnit(entityId);
    if (this._isMetricEnergyMode(metric)) return this._valueAsKwh(value, entityUnit);
    if (metric.unit === "power") return this._valueAsWatts(value, entityUnit);
    const number = numericState(value);
    return Number.isFinite(number) ? number : undefined;
  }

  _batteryPercent(metric) {
    if (metric.key !== "battery_level") return undefined;
    const value = this._metricNumericValue(metric);
    if (!Number.isFinite(value)) return undefined;
    return Math.min(100, Math.max(0, value));
  }

  _parsePowerLimitWatts(rawValue, defaultUnit = "kw") {
    if (rawValue === undefined || rawValue === null || rawValue === "") return undefined;
    if (typeof rawValue === "number") {
      if (!Number.isFinite(rawValue) || rawValue <= 0) return undefined;
      return defaultUnit === "w" ? rawValue : rawValue * 1000;
    }

    const normalized = String(rawValue).trim().toLowerCase().replace(",", ".");
    const match = normalized.match(/^(-?\d+(?:\.\d+)?)\s*(kwp|kw|w)?$/);
    if (!match) return undefined;
    const number = Number(match[1]);
    if (!Number.isFinite(number) || number <= 0) return undefined;
    const unit = match[2] || defaultUnit;
    return unit === "w" ? number : number * 1000;
  }

  _maxPowerWatts(metric) {
    if (!metric || metric.unit !== "power") return undefined;
    const key = metric.key;
    const fromKw = this.config.max_power_kw?.[key];
    if (fromKw !== undefined && fromKw !== "") return this._parsePowerLimitWatts(fromKw, "kw");
    const fromW = this.config.max_power_w?.[key];
    if (fromW !== undefined && fromW !== "") return this._parsePowerLimitWatts(fromW, "w");
    const legacy = this.config.max_power?.[key];
    return this._parsePowerLimitWatts(legacy, "kw");
  }

  _meterPercent(metric) {
    if (this._currentEnergyRange() !== "live" && metric.unit === "power") return undefined;
    const batteryPercent = this._batteryPercent(metric);
    if (batteryPercent !== undefined) return batteryPercent;

    const maxPowerWatts = this._maxPowerWatts(metric);
    if (!Number.isFinite(maxPowerWatts) || maxPowerWatts <= 0) return undefined;
    const value = Math.abs(this._metricNumericValue(metric) ?? 0);
    return Math.min(100, Math.max(0, (value / maxPowerWatts) * 100));
  }

  _meterTooltip(metric) {
    const percent = this._meterPercent(metric);
    if (percent === undefined) return "";
    const maxPowerWatts = this._maxPowerWatts(metric);
    if (Number.isFinite(maxPowerWatts)) {
      return `${this._t("tooltip.load")}: ${percent.toFixed(0)}%\n${this._t("tooltip.max")}: ${this._formatPowerValue(maxPowerWatts, "kW", "W")}`;
    }
    return `${this._t("tooltip.load")}: ${percent.toFixed(0)}%`;
  }

  _renderMetricMeter(metric) {
    const percent = this._meterPercent(metric);
    if (percent === undefined) return "";
    return `<div class="metric-meter" data-meter="${this._escape(metric.key)}" title="${this._escape(this._meterTooltip(metric))}" aria-hidden="true"><span style="width:${percent.toFixed(0)}%"></span></div>`;
  }

  _entityFlowValue(entityId) {
    const value = this._getEntityValue(entityId, undefined);
    if (value === undefined || value === null || value === "unknown" || value === "unavailable") return undefined;
    const entityUnit = this._getEntityUnit(entityId);
    if (this._isEnergyUnit(entityUnit)) {
      const kwhValue = this._valueAsKwh(value, entityUnit);
      return Number.isFinite(kwhValue)
        ? { amount: kwhValue, kind: "energy", unit: "kWh" }
        : undefined;
    }
    const wattValue = this._valueAsWatts(value, entityUnit);
    return Number.isFinite(wattValue)
      ? { amount: wattValue, kind: "power", unit: "W" }
      : undefined;
  }

  _batteryFlowInfo() {
    const signedEntityId = this.config.entities?.battery_flow_power;
    const signedValue = this._entityFlowValue(signedEntityId);
    if (signedValue && signedValue.amount !== 0) {
      return {
        direction: signedValue.amount > 0 ? "charge" : "discharge",
        entityId: signedEntityId,
        amount: Math.abs(signedValue.amount),
        kind: signedValue.kind,
        unit: signedValue.unit,
      };
    }

    const chargeEntityId = this.config.entities?.battery_charge_power;
    const dischargeEntityId = this.config.entities?.battery_discharge_power;
    const chargeValue = this._entityFlowValue(chargeEntityId);
    const dischargeValue = this._entityFlowValue(dischargeEntityId);
    const chargeAmount = Math.max(0, chargeValue?.amount || 0);
    const dischargeAmount = Math.max(0, dischargeValue?.amount || 0);
    if (chargeAmount <= 0 && dischargeAmount <= 0) return undefined;

    return chargeAmount >= dischargeAmount
      ? { direction: "charge", entityId: chargeEntityId, amount: chargeAmount, kind: chargeValue?.kind || "power", unit: chargeValue?.unit || "W" }
      : { direction: "discharge", entityId: dischargeEntityId, amount: dischargeAmount, kind: dischargeValue?.kind || "power", unit: dischargeValue?.unit || "W" };
  }

  _formatBatteryFlowValue(info = this._batteryFlowInfo()) {
    if (!info || !Number.isFinite(info.amount) || info.amount <= 0) return "";
    if (info.kind === "energy") {
      const unit = this.config.units?.battery_flow_power;
      const targetUnit = unit && this._isEnergyUnit(unit) ? unit : "kWh";
      return this._formatEnergyValue(info.amount, "kWh", targetUnit);
    }
    const unit = this.config.units?.battery_flow_power || this.config.units?.power || "auto";
    return this._formatPowerValue(info.amount, unit, "W");
  }

  _overlayPeriodMinutes(key = "smoke") {
    const config = this.config.image_overlays?.[key] || {};
    const raw = config.period_minutes ?? config.minutes ?? config.period ?? "1h";
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(1, raw);
    const normalized = String(raw).trim().toLowerCase();
    if (normalized === "30m" || normalized === "30min" || normalized === "30") return 30;
    if (normalized === "24h" || normalized === "24") return 1440;
    return 60;
  }

  _overlayPeriodValue(key = "smoke") {
    const minutes = this._overlayPeriodMinutes(key);
    if (minutes <= 30) return "30m";
    if (minutes >= 1440) return "24h";
    return "1h";
  }

  _overlayConsumptionCacheKey(entityId, minutes) {
    const bucket = this._cacheBucket(this._cacheBucketMsForMinutes(minutes));
    return `${entityId}|${minutes}|${bucket}`;
  }

  _overlayGasConsumptionInfo() {
    const config = this.config.image_overlays?.smoke || {};
    const entityId = config.entity;
    if (!entityId) return undefined;
    if (this._hass?.states && !this._getEntity(entityId)) {
      return { error: true, amount: undefined, unit: "m³" };
    }

    const minutes = this._overlayPeriodMinutes("smoke");
    const key = this._overlayConsumptionCacheKey(entityId, minutes);
    const cached = this._overlayConsumptionCache?.get(key);
    if (cached) return cached;
    this._requestOverlayGasConsumption(entityId, minutes, key);
    return { loading: true, amount: undefined, unit: this._getEntityUnit(entityId) || "m³" };
  }

  _requestOverlayGasConsumption(entityId, minutes, key) {
    if (!this._hass?.callApi || this._overlayConsumptionLoading?.has(key)) return;
    const requestToken = this._asyncRequestToken || 0;
    this._overlayConsumptionLoading.add(key);
    this._loadCounterConsumption(entityId, minutes)
      .then((info) => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._overlayConsumptionCache, key, info, MAX_COUNTER_CACHE_ENTRIES);
      })
      .catch(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._overlayConsumptionCache, key, { error: true, amount: undefined, unit: this._getEntityUnit(entityId) || "m³" }, MAX_COUNTER_CACHE_ENTRIES);
      })
      .finally(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._overlayConsumptionLoading?.delete(key);
        this._updateReadingsIfReady();
      });
  }

  async _loadCounterConsumption(entityId, minutes, defaultUnit = "m³") {
    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60 * 1000);
    const query = [
      `filter_entity_id=${encodeURIComponent(entityId)}`,
      `end_time=${encodeURIComponent(end.toISOString())}`,
      "significant_changes_only=0",
    ].join("&");
    const history = await this._hass.callApi("GET", `history/period/${start.toISOString()}?${query}`);
    const states = (Array.isArray(history?.[0]) ? history[0] : [])
      .map((entry) => ({
        value: numericState(entry?.state ?? entry?.s),
        unit: entry?.attributes?.unit_of_measurement || this._getEntityUnit(entityId) || defaultUnit,
        time: Date.parse(entry?.last_changed || entry?.last_updated || entry?.lu || ""),
      }))
      .filter((entry) => Number.isFinite(entry.value) && Number.isFinite(entry.time))
      .sort((a, b) => a.time - b.time);
    const currentValue = numericState(this._getEntityValue(entityId, undefined));
    const latestState = states.length > 0 ? states[states.length - 1] : undefined;
    const endValue = Number.isFinite(currentValue) ? currentValue : latestState?.value;
    const startValue = states[0]?.value;
    const amount = Number.isFinite(endValue) && Number.isFinite(startValue)
      ? Math.max(0, endValue - startValue)
      : undefined;
    return { amount, unit: latestState?.unit || this._getEntityUnit(entityId) || defaultUnit };
  }

  _formatGasConsumptionValue() {
    const info = this._overlayGasConsumptionInfo();
    if (!info) return "";
    if (info.loading) return "…";
    if (!Number.isFinite(info.amount)) return "—";
    const value = info.amount >= 10 ? info.amount.toFixed(1) : info.amount.toFixed(2);
    return `${value} ${info.unit || "m³"}`;
  }

  _formatOverlayHeatpumpValue() {
    const entityId = this.config.image_overlays?.heatpump?.entity;
    if (!entityId) return "";
    const value = this._getEntityValue(entityId, undefined);
    const formatted = this._formatValue(value);
    if (formatted === "—") return formatted;
    const entityUnit = this._getEntityUnit(entityId);
    const unit = this.config.image_overlays?.heatpump?.unit || "auto";
    if (this._isEnergyUnit(entityUnit)) {
      const targetUnit = unit && this._isEnergyUnit(unit) ? unit : "kWh";
      return this._formatEnergyValue(value, entityUnit, targetUnit);
    }
    if (this._isPowerUnit(entityUnit)) return this._formatPowerValue(value, unit, entityUnit);
    return entityUnit ? `${formatted} ${entityUnit}` : String(formatted);
  }

  _formatOverlayReading(key) {
    if (key === "smoke") return this._formatGasConsumptionValue() || "—";
    if (key === "heatpump") return this._formatOverlayHeatpumpValue() || "—";
    return "—";
  }

  _overlayLabel(key) {
    const customLabel = this.config.image_overlays?.[key]?.label;
    if (customLabel !== undefined && String(customLabel).trim() !== "") return String(customLabel).trim();
    return this._t(`overlay.${key}`, {}, key);
  }

  _customMetricLabel(key) {
    const customLabel = this.config.labels?.[key];
    if (customLabel !== undefined && String(customLabel).trim() !== "") return String(customLabel).trim();
    return "";
  }

  _batteryFlowDirectionLabel(direction) {
    return direction === "charge"
      ? this._t("flow.charge", {}, "Incoming")
      : this._t("flow.discharge", {}, "Outgoing");
  }

  _renderBatteryFlow(metric, { showLabel = false, placement = showLabel ? "footer" : "image" } = {}) {
    if (metric.key !== "battery_level") return "";
    if (this._currentEnergyRange() !== "live") return "";
    if (!this._showLabelIn("battery_flow_power", placement)) return "";
    const info = this._batteryFlowInfo();
    const value = this._formatBatteryFlowValue(info);
    if (!info || !value) return "";
    const arrow = info.direction === "charge" ? "↓" : "↑";
    const directionLabel = this._batteryFlowDirectionLabel(info.direction);
    const label = `${directionLabel}: ${value}`;
    return `
      <div class="battery-flow ${info.direction}${showLabel ? " with-label" : ""}${this._labelVisibilityClass("battery_flow_power")}" data-battery-flow title="${this._escape(label)}" aria-label="${this._escape(label)}">
        ${showLabel ? `<span class="battery-flow-label" data-battery-flow-label>${this._escape(directionLabel)}</span>` : ""}
        <span class="battery-flow-arrow">${this._escape(arrow)}</span>
        <span data-battery-flow-value>${this._escape(value)}</span>
      </div>
    `;
  }

  _batteryTemperatureEntityId() {
    const aliases = ["battery_temperature", "battery_temp", "battery_level_temperature"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _formatTemperatureLabel(rawValue, entityUnit = "°C") {
    const normalized = String(rawValue ?? "").trim().toLowerCase();
    if (!normalized || ["unknown", "unavailable", "none", "null", "offline"].includes(normalized)) return "";
    const numericValue = Number(String(rawValue).replace(",", "."));
    const unit = entityUnit || "°C";
    const value = Number.isFinite(numericValue)
      ? `${Math.abs(numericValue) >= 100 || Number.isInteger(numericValue) ? numericValue.toFixed(0) : numericValue.toFixed(1)} ${unit}`
      : `${String(rawValue).trim()}${unit && !String(rawValue).includes(unit) ? ` ${unit}` : ""}`;
    return this._t("value.temperature", { value }, `Temp ${value}`);
  }

  _batteryTemperatureLabel() {
    const entityId = this._batteryTemperatureEntityId();
    if (!entityId) return "";
    return this._formatTemperatureLabel(this._getEntityValue(entityId, undefined), this._getEntityUnit(entityId) || "°C");
  }

  _renderBatteryTemperature(metric, { placement = "footer" } = {}) {
    if (metric.key !== "battery_level" || !this._batteryTemperatureEntityId()) return "";
    if (!this._showLabelIn("battery_temperature", placement)) return "";
    const label = this._batteryTemperatureLabel();
    const tooltip = `${this._t("tooltip.temperature", {}, "Temperature")}: ${label}`;
    return `
      <span class="temp-badge${this._labelVisibilityClass("battery_temperature")}" data-battery-temperature title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _renderBatteryMetaRow(metric, { showFlowLabel = true, placement = showFlowLabel ? "footer" : "image" } = {}) {
    const metaHtml = [
      this._renderBatteryFlow(metric, { showLabel: showFlowLabel, placement }),
      this._renderBatteryTemperature(metric, { placement }),
    ].filter(Boolean).join("");
    return metaHtml ? `<div class="meta-row">${metaHtml}</div>` : "";
  }

  _isPvMetric(metric) {
    return ["pv_roof_power", "pv_shed_power", "pv_total_power"].includes(metric?.key);
  }

  _pvLabelKey(metric, label) {
    return `${metric.key}_${label.suffix}`;
  }

  _pvLabelEntityId(metric, label) {
    if (label.source !== "entity") return "";
    return this.config.entities?.[this._pvLabelKey(metric, label)] || "";
  }

  _formatPvLabelEntityValue(entityId, unit) {
    if (!entityId) return "";
    const rawValue = this._getEntityValue(entityId, undefined);
    const formatted = this._formatValue(rawValue);
    if (formatted === "—") return formatted;
    const entityUnit = this._getEntityUnit(entityId);
    if (unit === "energy") {
      const targetUnit = this._isEnergyUnit(entityUnit) ? "kWh" : entityUnit || "kWh";
      return this._formatEnergyValue(rawValue, entityUnit, targetUnit);
    }
    if (unit === "power") return this._formatPowerValue(rawValue, this.config.units?.power || "auto", entityUnit);
    return entityUnit ? `${formatted} ${entityUnit}` : String(formatted);
  }

  _pvLabelText(metric, label) {
    const title = this._t(label.labelKey, {}, label.suffix);
    const value = label.source === "metric"
      ? this._formatReading(metric)
      : this._formatPvLabelEntityValue(this._pvLabelEntityId(metric, label), label.unit);
    return value && value !== "—" ? `${title}: ${value}` : "";
  }

  _renderPvLabel(metric, label, { placement = "footer" } = {}) {
    if (!this._isPvMetric(metric)) return "";
    const key = this._pvLabelKey(metric, label);
    if (!this._showLabelIn(key, placement)) return "";
    if (label.source === "entity" && !this._pvLabelEntityId(metric, label)) return "";
    const text = this._pvLabelText(metric, label);
    const tooltip = text || this._t(label.labelKey, {}, label.suffix);
    return `
      <span class="pv-badge${this._labelVisibilityClass(key)}" data-pv-label="${this._escape(key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${text ? "" : "display:none"}">${this._escape(text)}</span>
    `;
  }

  _renderPvMetaRow(metric, { placement = "footer" } = {}) {
    if (!this._isPvMetric(metric)) return "";
    const metaHtml = PV_LABELS
      .map((label) => this._renderPvLabel(metric, label, { placement }))
      .filter(Boolean)
      .join("");
    return metaHtml ? `<div class="meta-row">${metaHtml}</div>` : "";
  }

  _wallboxPhaseEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_phase";
    if (metric?.key === "wallbox2_power") return "wallbox2_phase";
    return "";
  }

  _wallboxPhaseEntityId(metric) {
    const entityKey = this._wallboxPhaseEntityKey(metric);
    if (!entityKey) return "";
    const aliases = entityKey === "wallbox2_phase"
      ? ["wallbox2_phase", "wallbox2_phases", "wallbox2_power_phase"]
      : ["wallbox_phase", "wallbox_phases", "wallbox_power_phase"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _wallboxPhaseLabel(metric) {
    const entityId = this._wallboxPhaseEntityId(metric);
    if (!entityId) return "";
    const rawValue = this._getEntityValue(entityId, undefined);
    const normalized = String(rawValue ?? "").trim().toLowerCase();
    if (!normalized || ["unknown", "unavailable", "none", "null", "offline"].includes(normalized)) return "";
    if (["auto", "automatic", "automatisch"].includes(normalized)) return this._t("phase.auto", {}, "Auto");
    const numberMatch = normalized.match(/\b([123])\b/) || normalized.match(/^([123])\s*(?:p|phase|phasen|fazy|fases)?$/);
    const phaseCount = numberMatch ? Number(numberMatch[1]) : Number(normalized);
    if (phaseCount === 1) return this._t("phase.one", {}, "1 phase");
    if (phaseCount === 2 || phaseCount === 3) return this._t("phase.many", { count: phaseCount }, `${phaseCount} phases`);
    return String(rawValue).trim();
  }

  _renderWallboxPhase(metric, { placement = "footer" } = {}) {
    if (!this._wallboxPhaseEntityId(metric)) return "";
    const entityKey = this._wallboxPhaseEntityKey(metric);
    if (!this._showLabelIn(entityKey, placement)) return "";
    const label = this._wallboxPhaseLabel(metric);
    const tooltip = `${this._t("tooltip.phases", {}, "Phases")}: ${label}`;
    return `
      <span class="phase-badge${this._labelVisibilityClass(entityKey)}" data-phase="${this._escape(metric.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _wallboxSocEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_soc";
    if (metric?.key === "wallbox2_power") return "wallbox2_soc";
    return "";
  }

  _wallboxSocEntityId(metric) {
    const entityKey = this._wallboxSocEntityKey(metric);
    if (!entityKey) return "";
    const aliases = entityKey === "wallbox2_soc"
      ? ["wallbox2_soc", "wallbox2_vehicle_soc", "wallbox2_car_soc", "wallbox2_power_soc"]
      : ["wallbox_soc", "wallbox_vehicle_soc", "wallbox_car_soc", "wallbox_power_soc"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _wallboxSocLabel(metric) {
    const entityId = this._wallboxSocEntityId(metric);
    if (!entityId) return "";
    const rawValue = this._getEntityValue(entityId, undefined);
    const normalized = String(rawValue ?? "").trim().toLowerCase();
    if (!normalized || ["unknown", "unavailable", "none", "null", "offline"].includes(normalized)) return "";
    const numericValue = Number(String(rawValue).replace(",", "."));
    const entityUnit = this._getEntityUnit(entityId);
    const value = Number.isFinite(numericValue)
      ? `${Math.round(Math.max(0, Math.min(100, numericValue)))}%`
      : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
    return `Auto ${value}`;
  }

  _renderWallboxSoc(metric, { placement = "footer" } = {}) {
    if (!this._wallboxSocEntityId(metric)) return "";
    const entityKey = this._wallboxSocEntityKey(metric);
    if (!this._showLabelIn(entityKey, placement)) return "";
    const label = this._wallboxSocLabel(metric);
    const tooltip = `${this._t("tooltip.vehicleSoc", {}, "Vehicle SoC")}: ${label}`;
    return `
      <span class="soc-badge${this._labelVisibilityClass(entityKey)}" data-vehicle-soc="${this._escape(metric.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _wallboxRemainingTimeEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_remaining_time";
    if (metric?.key === "wallbox2_power") return "wallbox2_remaining_time";
    return "";
  }

  _wallboxRemainingTimeEntityId(metric) {
    const entityKey = this._wallboxRemainingTimeEntityKey(metric);
    if (!entityKey) return "";
    const aliases = entityKey === "wallbox2_remaining_time"
      ? ["wallbox2_remaining_time", "wallbox2_charge_time", "wallbox2_charging_time_left", "wallbox2_power_remaining_time"]
      : ["wallbox_remaining_time", "wallbox_charge_time", "wallbox_charging_time_left", "wallbox_power_remaining_time"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _formatDurationMinutes(minutes) {
    if (!Number.isFinite(minutes) || minutes <= 0) return "";
    const rounded = Math.max(1, Math.round(minutes));
    const hours = Math.floor(rounded / 60);
    const restMinutes = rounded % 60;
    if (hours <= 0) return `${restMinutes}min`;
    if (restMinutes <= 0) return `${hours}h`;
    return `${hours}h ${restMinutes}m`;
  }

  _formatRemainingChargeTimeValue(rawValue, entityUnit = "") {
    const raw = String(rawValue ?? "").trim();
    const normalized = raw.toLowerCase();
    if (!normalized || ["unknown", "unavailable", "none", "null", "offline"].includes(normalized)) return "";

    const durationMatch = normalized.match(/^(\d{1,3}):([0-5]\d)(?::([0-5]\d))?$/);
    if (durationMatch) {
      const first = Number(durationMatch[1]);
      const second = Number(durationMatch[2]);
      const third = durationMatch[3] !== undefined ? Number(durationMatch[3]) : undefined;
      const minutes = third === undefined ? first * 60 + second : first * 60 + second + third / 60;
      return this._formatDurationMinutes(minutes);
    }

    if (/[a-z]{3,}:\/\//i.test(raw) || /\d{4}-\d{2}-\d{2}/.test(raw)) {
      const timestamp = Date.parse(raw);
      const minutes = (timestamp - Date.now()) / 60000;
      const formatted = this._formatDurationMinutes(minutes);
      if (formatted) return formatted;
    }

    const numericValue = Number(raw.replace(",", "."));
    if (Number.isFinite(numericValue)) {
      const unit = String(entityUnit || "").trim().toLowerCase();
      if (unit.includes("h") || unit.includes("std") || unit.includes("hour") || unit.includes("stunde")) return this._formatDurationMinutes(numericValue * 60);
      if (unit.includes("min") || unit === "m") return this._formatDurationMinutes(numericValue);
      if (unit.includes("s") && !unit.includes("stunden")) return this._formatDurationMinutes(numericValue / 60);
      return numericValue > 24 ? this._formatDurationMinutes(numericValue) : this._formatDurationMinutes(numericValue * 60);
    }

    return raw;
  }

  _wallboxIsCharging(metric) {
    const entityId = this.config.entities?.[metric?.key];
    if (!entityId) return false;
    const watts = this._valueAsWatts(this._getEntityValue(entityId, undefined), this._getEntityUnit(entityId));
    const threshold = this._clampNumber(this.config.wallbox_charging_threshold, 25, 0, 1000000);
    return Number.isFinite(watts) && watts > threshold;
  }

  _wallboxRemainingTimeLabel(metric) {
    if (!this._wallboxIsCharging(metric)) return "";
    const entityId = this._wallboxRemainingTimeEntityId(metric);
    if (!entityId) return "";
    const value = this._formatRemainingChargeTimeValue(this._getEntityValue(entityId, undefined), this._getEntityUnit(entityId));
    return value ? this._t("value.remainingChargeTime", { value }, `${value} left`) : "";
  }

  _renderWallboxRemainingTime(metric, { placement = "footer" } = {}) {
    if (!this._wallboxRemainingTimeEntityId(metric)) return "";
    const entityKey = this._wallboxRemainingTimeEntityKey(metric);
    if (!this._showLabelIn(entityKey, placement)) return "";
    const label = this._wallboxRemainingTimeLabel(metric);
    const tooltip = `${this._t("tooltip.remainingChargeTime", {}, "Remaining charge time")}: ${label}`;
    return `
      <span class="time-badge${this._labelVisibilityClass(entityKey)}" data-remaining-charge-time="${this._escape(metric.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _renderWallboxPhaseRow(metric, { placement = "footer" } = {}) {
    const metaHtml = [
      this._renderWallboxPhase(metric, { placement }),
      this._renderWallboxSoc(metric, { placement }),
      this._renderWallboxRemainingTime(metric, { placement }),
    ].filter(Boolean).join("");
    return metaHtml ? `<div class="meta-row">${metaHtml}</div>` : "";
  }

  _formatLocalDateTime(dateString) {
    const timestamp = Date.parse(dateString || "");
    if (!Number.isFinite(timestamp)) return "";
    try {
      return new Intl.DateTimeFormat(this._language(), {
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date(timestamp));
    } catch (_err) {
      return new Date(timestamp).toLocaleString();
    }
  }

  _metricWarning(metric) {
    if ((metric.sourceKey || metric.key) === "import_export_power") {
      const signedEntityId = this._gridSignedEntityId();
      const entityIds = signedEntityId
        ? [signedEntityId]
        : [this._gridImportEntityId(), this._gridExportEntityId()].filter(Boolean);
      if (entityIds.length === 0) return undefined;
      const entities = entityIds.map((entityId) => this._getEntity(entityId)).filter(Boolean);
      if (this._hass?.states && entities.length === 0) return { type: "missing", label: this._t("warning.sensorMissing") };
      const states = entities.map((entity) => String(entity?.state || "").toLowerCase().trim());
      if (states.length > 0 && states.every((state) => state === "unavailable" || state === "unknown")) {
        return { type: "unavailable", label: this._t("warning.sensorUnavailable") };
      }
      if (states.length > 0 && states.every((state) => state === "offline")) {
        return { type: "offline", label: this._t("warning.sensorOffline") };
      }
      return undefined;
    }

    const entityId = this._metricEntityId(metric);
    const entity = this._getEntity(entityId);
    if (entityId && this._hass?.states && !entity) {
      return { type: "missing", label: this._t("warning.sensorMissing") };
    }

    const state = String(entity?.state || "").toLowerCase().trim();
    if (state === "unavailable" || state === "unknown") {
      return { type: "unavailable", label: this._t("warning.sensorUnavailable") };
    }
    if (state === "offline" || (metric.key === "inverter_power" && state === "off")) {
      return { type: "offline", label: this._t("warning.sensorOffline") };
    }

    if (metric.key === "battery_level") {
      const value = this._metricNumericValue(metric);
      if (Number.isFinite(value) && value <= this.config.battery_low_threshold) {
        return { type: "battery-low", label: this._t("warning.batteryLow") };
      }
    }

    return undefined;
  }

  _metricStateClass(metric) {
    return this._metricWarning(metric) ? " is-warning" : "";
  }

  _metricTooltip(metric, variant) {
    const entityId = this._metricEntityId(metric);
    const entity = this._getEntity(entityId);
    const warning = this._metricWarning(metric);
    const rawValue = entity
      ? entity.state
      : metric.customKpi && !entityId
        ? metric.customKpi.value
        : undefined;
    const entityUnit = entityId ? this._getEntityUnit(entityId) : "";
    const updatedAt = entityId ? this._formatLocalDateTime(this._getEntityLastUpdated(entityId)) : "";
    const rawLabel = rawValue !== undefined && rawValue !== ""
      ? `${this._t("tooltip.raw")}: ${rawValue}${entityUnit ? ` ${entityUnit}` : ""}`
      : "";

    return [
      this._metricLabel(metric, variant),
      entityId ? `${this._t("tooltip.entity")}: ${entityId}` : "",
      `${this._t("tooltip.value")}: ${this._formatReading(metric)}`,
      rawLabel,
      this._meterTooltip(metric),
      metric.key === "battery_level" && this._formatBatteryFlowValue()
        ? `${this._t("tooltip.flow")}: ${this._formatBatteryFlowValue()}`
        : "",
      metric.key === "battery_level" && this._batteryTemperatureLabel()
        ? `${this._t("tooltip.temperature", {}, "Temperature")}: ${this._batteryTemperatureLabel()}`
        : "",
      this._wallboxPhaseLabel(metric) ? `${this._t("tooltip.phases", {}, "Phases")}: ${this._wallboxPhaseLabel(metric)}` : "",
      this._wallboxSocLabel(metric) ? `${this._t("tooltip.vehicleSoc", {}, "Vehicle SoC")}: ${this._wallboxSocLabel(metric)}` : "",
      this._wallboxRemainingTimeLabel(metric) ? `${this._t("tooltip.remainingChargeTime", {}, "Remaining charge time")}: ${this._wallboxRemainingTimeLabel(metric)}` : "",
      updatedAt ? `${this._t("tooltip.updated")}: ${updatedAt}` : "",
      warning ? `${this._t("tooltip.status")}: ${warning.label}` : "",
    ].filter(Boolean).join("\n");
  }

  _allChartMetrics(variant = this._currentVariant || this._layoutState().variant) {
    return [
      ...this._visibleHudMetrics(variant),
      ...this._visibleTileMetrics(variant),
    ].filter((metric, index, metrics) => {
      if (!this._metricEntityId(metric)) return false;
      return metrics.findIndex((item) => item.key === metric.key) === index;
    });
  }

  _chartMetric(metricKey) {
    return this._allChartMetrics().find((metric) => metric.key === metricKey);
  }

  _historyCacheKey(entityId, hours) {
    const bucket = this._cacheBucket(MINUTE_MS);
    return `${entityId}|${hours}|${bucket}`;
  }

  async _openChart(metricKey, hours = this._chartHours || this.config.chart_hours || 24) {
    const metric = this._chartMetric(metricKey);
    if (!metric) return;
    const entityId = this._metricEntityId(metric);
    if (!entityId) return;
    const requestToken = this._asyncRequestToken || 0;

    this._chartHours = [24, 48].includes(Number(hours)) ? Number(hours) : 24;
    this._activeChart = {
      metricKey,
      hours: this._chartHours,
      loading: true,
      error: "",
      points: [],
    };
    this._renderCardShell(this._layoutState());

    try {
      const points = await this._loadHistoryPoints(metric, entityId, this._chartHours);
      if (!this._isActiveRequest(requestToken) || !this._activeChart || this._activeChart.metricKey !== metricKey || this._activeChart.hours !== this._chartHours) return;
      this._activeChart = {
        ...this._activeChart,
        loading: false,
        error: "",
        points,
      };
    } catch (_err) {
      if (!this._isActiveRequest(requestToken) || !this._activeChart || this._activeChart.metricKey !== metricKey) return;
      this._activeChart = {
        ...this._activeChart,
        loading: false,
        error: this._t("chart.error"),
        points: [],
      };
    }

    if (this._isActiveRequest(requestToken) && this.shadowRoot) this._renderCardShell(this._layoutState());
  }

  _closeChart() {
    this._activeChart = undefined;
    this._renderCardShell(this._layoutState());
  }

  async _loadHistoryPoints(metric, entityId, hours) {
    if (!this._hass?.callApi) throw new Error("Home Assistant history API is unavailable");
    const cacheKey = this._historyCacheKey(entityId, hours);
    const cached = this._historyCache.get(cacheKey);
    if (cached) return cached;

    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    const query = [
      `filter_entity_id=${encodeURIComponent(entityId)}`,
      `end_time=${encodeURIComponent(end.toISOString())}`,
      "significant_changes_only=0",
    ].join("&");
    const path = `history/period/${start.toISOString()}?${query}`;
    const history = await this._hass.callApi("GET", path);
    const states = Array.isArray(history?.[0]) ? history[0] : [];
    const points = states
      .map((entry) => this._historyPoint(metric, entry))
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    this._setCacheEntry(this._historyCache, cacheKey, points, MAX_HISTORY_CACHE_ENTRIES);
    return points;
  }

  _historyPoint(metric, entry) {
    if (!entry || typeof entry !== "object") return undefined;
    const rawValue = entry.state ?? entry.s;
    const value = this._formatValue(rawValue);
    if (value === "—") return undefined;
    const entityUnit = entry.attributes?.unit_of_measurement || this._getEntityUnit(this._metricEntityId(metric));
    const numericValue = this._isMetricEnergyMode(metric)
      ? this._valueAsKwh(rawValue, entityUnit)
      : metric.unit === "power" || (metric.overlay === "heatpump" && this._isPowerUnit(entityUnit))
      ? this._valueAsWatts(rawValue, entityUnit)
      : numericState(rawValue);
    if (!Number.isFinite(numericValue)) return undefined;
    const rawTime = entry.last_changed || entry.last_updated || entry.lu;
    const time = Date.parse(rawTime || "");
    if (!Number.isFinite(time)) return undefined;
    return { time, value: numericValue };
  }

  _formatChartValue(value, metric) {
    if (this._isMetricEnergyMode(metric)) return this._formatEnergyValue(value, "kWh", "kWh");
    if (metric.overlay === "heatpump") {
      const entityUnit = this._getEntityUnit(this._metricEntityId(metric));
      if (this._isPowerUnit(entityUnit)) return this._formatPowerValue(value, "auto", "W");
      if (this._isEnergyUnit(entityUnit)) return this._formatEnergyValue(value, entityUnit, "kWh");
    }
    if (metric.overlay === "smoke") {
      const unit = this._getEntityUnit(this._metricEntityId(metric)) || "m³";
      return `${Number(value).toFixed(2)} ${unit}`;
    }
    if (metric.unit === "power") return this._formatPowerValue(value, this._unitForMetric(metric), "W");
    if (metric.key === "battery_level") return this._formatWithUnit(Math.round(value), this._unitForMetric(metric));
    const unit = this._unitForMetric(metric);
    return this._formatWithUnit(Number(value.toFixed(2)), unit === "auto" ? this._getEntityUnit(this._metricEntityId(metric)) : unit);
  }

  _formatChartTime(timestamp) {
    try {
      return new Intl.DateTimeFormat(this._language(), { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
    } catch (_err) {
      return new Date(timestamp).toLocaleTimeString();
    }
  }

  _chartPath(points, min, max, start, end, width, height, padding) {
    const range = max - min || 1;
    return points.map((point) => {
      const x = padding.left + ((point.time - start) / Math.max(1, end - start)) * (width - padding.left - padding.right);
      const y = padding.top + (1 - ((point.value - min) / range)) * (height - padding.top - padding.bottom);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }

  _renderChartSvg(metric, chart) {
    const points = chart.points || [];
    if (chart.loading) return `<div class="chart-message">${this._escape(this._t("chart.loading"))}</div>`;
    if (chart.error) return `<div class="chart-message is-error">${this._escape(chart.error)}</div>`;
    if (points.length < 2) return `<div class="chart-message">${this._escape(this._t("chart.empty"))}</div>`;

    const width = 720;
    const height = 260;
    const padding = { top: 22, right: 22, bottom: 36, left: 58 };
    const values = points.map((point) => point.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const pad = Math.max((rawMax - rawMin) * 0.12, rawMax === rawMin ? Math.abs(rawMax || 1) * 0.1 : 0);
    const min = rawMin === rawMax ? rawMin - pad : rawMin - pad;
    const max = rawMin === rawMax ? rawMax + pad : rawMax + pad;
    const start = Date.now() - chart.hours * 60 * 60 * 1000;
    const end = Date.now();
    const line = this._chartPath(points, min, max, start, end, width, height, padding);
    const latest = points[points.length - 1];
    const zeroY = min < 0 && max > 0
      ? padding.top + (1 - ((0 - min) / (max - min))) * (height - padding.top - padding.bottom)
      : undefined;

    return `
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${this._escape(this._metricLabel(metric, this._currentVariant))}">
        <line class="chart-gridline" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"></line>
        <line class="chart-gridline" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"></line>
        <line class="chart-gridline soft" x1="${padding.left}" y1="${padding.top + (height - padding.top - padding.bottom) / 2}" x2="${width - padding.right}" y2="${padding.top + (height - padding.top - padding.bottom) / 2}"></line>
        ${zeroY ? `<line class="chart-zero" x1="${padding.left}" y1="${zeroY.toFixed(1)}" x2="${width - padding.right}" y2="${zeroY.toFixed(1)}"></line>` : ""}
        <polyline class="chart-line" points="${this._escape(line)}"></polyline>
        <circle class="chart-dot" cx="${this._escape(line.split(" ").at(-1)?.split(",")[0] || padding.left)}" cy="${this._escape(line.split(" ").at(-1)?.split(",")[1] || padding.top)}" r="4"></circle>
        <text class="chart-label" x="${padding.left}" y="16">${this._escape(this._formatChartValue(max, metric))}</text>
        <text class="chart-label" x="${padding.left}" y="${height - 8}">${this._escape(this._formatChartTime(start))}</text>
        <text class="chart-label end" x="${width - padding.right}" y="${height - 8}">${this._escape(this._formatChartTime(end))}</text>
        <text class="chart-current" x="${width - padding.right}" y="16">${this._escape(this._formatChartValue(latest.value, metric))}</text>
      </svg>
    `;
  }

  _renderChartOverlay() {
    if (!this._activeChart) return "";
    const metric = this._chartMetric(this._activeChart.metricKey);
    if (!metric) return "";
    const entityId = this._metricEntityId(metric);
    const title = this._metricLabel(metric, this._currentVariant);
    const hours = this._activeChart.hours;
    const rangeButton = (value) => `
      <button type="button" class="chart-range${hours === value ? " active" : ""}" data-chart-hours="${value}">${this._escape(this._t(`chart.range${value}`))}</button>
    `;

    return `
      <div class="chart-backdrop" data-chart-close></div>
      <div class="chart-dialog" role="dialog" aria-modal="true" aria-label="${this._escape(title)}" style="${this._escape(this._accentStyle(metric))}">
        <div class="chart-head">
          <div class="chart-title">
            <strong>${this._escape(title)}</strong>
            <span>${this._escape(this._t("chart.subtitle", { hours }))}${entityId ? ` / ${this._escape(entityId)}` : ""}</span>
          </div>
          <div class="chart-actions">
            ${rangeButton(24)}
            ${rangeButton(48)}
            <button type="button" class="chart-close" data-chart-close aria-label="${this._escape(this._t("chart.close"))}">×</button>
          </div>
        </div>
        <div class="chart-body">
          ${this._renderChartSvg(metric, this._activeChart)}
        </div>
      </div>
    `;
  }

  _ruleMatches(rule, value) {
    if (!rule || value === undefined) return false;
    const checks = [
      ["above", (actual, threshold) => actual >= threshold],
      ["min", (actual, threshold) => actual >= threshold],
      ["gte", (actual, threshold) => actual >= threshold],
      ["below", (actual, threshold) => actual <= threshold],
      ["max", (actual, threshold) => actual <= threshold],
      ["lte", (actual, threshold) => actual <= threshold],
      ["gt", (actual, threshold) => actual > threshold],
      ["lt", (actual, threshold) => actual < threshold],
      ["equals", (actual, threshold) => actual === threshold],
    ];
    const explicitChecks = checks.filter(([key]) => rule[key] !== undefined);
    if (explicitChecks.length > 0) {
      return explicitChecks.every(([key, compare]) => {
        const threshold = Number(rule[key]);
        return Number.isFinite(threshold) && compare(value, threshold);
      });
    }
    if (rule.threshold === undefined) return false;
    const threshold = Number(rule.threshold);
    if (!Number.isFinite(threshold)) return false;
    const operator = String(rule.operator || ">=").trim();
    if (operator === ">" || operator === "above") return value > threshold;
    if (operator === "<" || operator === "below") return value < threshold;
    if (operator === "<=" || operator === "lte" || operator === "max") return value <= threshold;
    if (operator === "=" || operator === "==" || operator === "===" || operator === "equals") return value === threshold;
    return value >= threshold;
  }

  _safeCssColor(color, fallback = "") {
    const value = String(color || "").trim();
    if (!value) return fallback;
    if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
    if (/^(rgb|rgba|hsl|hsla)\([\d\s.,%/-]+\)$/i.test(value)) return value;
    if (/^var\(--[\w-]+\)$/i.test(value)) return value;
    if (/^[a-z]+$/i.test(value)) return value;
    return fallback;
  }

  _hexToRgba(color, alpha = 0.36) {
    const hex = String(color || "").trim();
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
    if (!match) return color || "transparent";
    const raw = match[1].length === 3
      ? match[1].split("").map((char) => char + char).join("")
      : match[1];
    const red = parseInt(raw.slice(0, 2), 16);
    const green = parseInt(raw.slice(2, 4), 16);
    const blue = parseInt(raw.slice(4, 6), 16);
    return `rgba(${red},${green},${blue},${alpha})`;
  }

  _metricAccent(metric) {
    const fallbackColor = metric.accentColor || STATIC_METRIC_COLORS[metric.color] || "var(--text-main)";
    if (this._currentEnergyRange() !== "live" && metric.unit === "power") {
      return { color: fallbackColor, glow: "transparent" };
    }
    if (this.config.dynamic_tile_colors === false) {
      return { color: fallbackColor, glow: "transparent" };
    }

    const rules = this.config.tile_color_rules?.[metric.sourceKey || metric.key];
    const normalizedRules = Array.isArray(rules) ? rules : [];
    const value = this._metricNumericValue(metric);
    const matchedRule = normalizedRules.find((rule) => this._ruleMatches(rule, value));
    const color = this._safeCssColor(matchedRule?.color, fallbackColor);
    const glowValue = matchedRule?.glow ?? metric.customKpi?.glow;
    const glow = glowValue === true
      ? this._hexToRgba(color, 0.34)
      : this._safeCssColor(glowValue, "transparent");

    return { color, glow };
  }

  _accentStyle(metric) {
    const accent = this._metricAccent(metric);
    return `--tile-accent:${accent.color};--tile-glow:${accent.glow};`;
  }

  _labelVisibility(key) {
    const configured = this.config.label_visibility?.[key] || {};
    return {
      image: configured.image !== false,
      footer: configured.footer !== false && configured.kpi !== false,
      hideMobile: configured.hide_mobile === true || configured.mobile === false,
      hideDesktop: configured.hide_desktop === true || configured.desktop === false,
    };
  }

  _labelVisibilityClass(key) {
    const visibility = this._labelVisibility(key);
    return [
      visibility.hideMobile ? " hide-mobile" : "",
      visibility.hideDesktop ? " hide-desktop" : "",
    ].join("");
  }

  _showLabelIn(key, placement) {
    const visibility = this._labelVisibility(key);
    return placement === "footer" ? visibility.footer : visibility.image;
  }

  _metricEnabled(metric, variant) {
    if (metric.overlay) return this.config.image_overlays?.[metric.overlay]?.enabled === true;
    if (metric.customKpi) return metric.customKpi.visible !== false;
    const configured = this.config.visible_boxes?.[metric.key];
    if (configured !== undefined) return configured !== false;
    if (metric.key === "import_export_power") return this._hasGridPowerSource();
    if (metric.optional && !this.config.entities?.[metric.key]) return false;
    return variant?.visible_boxes?.[metric.key] !== false;
  }

  _metricVisible(metric, variant) {
    return this._metricEnabled(metric, variant);
  }

  _visibleMetrics(variant, metrics = TILE_METRICS) {
    return metrics.filter((metric) => this._metricEnabled(metric, variant));
  }

  _showGridStatusTile() {
    return (
      this.config.show_grid_status_tile !== false
      && this._hasGridPowerSource()
      && this.config.visible_boxes?.import_export_power !== false
    );
  }

  _visibleTileMetrics(variant) {
    return [
      ...this._visibleMetrics(variant)
        .filter((metric) => metric.tile !== false)
        .map((metric, index) => ({
          ...metric,
          tileOrder: metric.tileOrder ?? index,
          tileColumns: metric.tileColumns ?? 1,
        })),
      ...this._visibleOverlayMetrics(),
      ...(this._showGridStatusTile() ? [GRID_STATUS_METRIC] : []),
      ...this._customKpiMetrics(),
    ].sort((a, b) => (a.tileOrder ?? 0) - (b.tileOrder ?? 0));
  }

  _visibleOverlayMetrics() {
    return OVERLAY_TILE_METRICS
      .filter((metric) => this.config.image_overlays?.[metric.overlay]?.enabled === true)
      .filter((metric) => this._labelVisibility(metric.key).footer)
      .map((metric) => ({ ...metric, tileColumns: 1 }));
  }

  _visibleHudMetrics(variant) {
    return this._visibleMetrics(variant).filter((metric) => {
      if (metric.hud !== false) return true;
      return Boolean(variant?.positions?.[metric.key]) || this.config.visible_boxes?.[metric.key] === true;
    });
  }

  _metricLabel(metric, variant) {
    if (metric.overlay) return this._overlayLabel(metric.overlay);
    if (metric.customKpi) return metric.customKpi.label || metric.label;
    if (metric.key === "import_export_power") {
      const status = this._gridStatusInfo();
      if (["import", "export", "neutral"].includes(status.kind) && status.label) return status.label;
    }
    const customLabel = this._customMetricLabel(metric.key);
    if (customLabel) return customLabel;
    if (metric.labelKey) return this._t(metric.labelKey, {}, metric.label);
    if (variant?.labelKeys?.[metric.key]) return this._t(variant.labelKeys[metric.key], {}, variant?.labels?.[metric.key] || metric.label);
    if (variant?.labels?.[metric.key]) return this._t(`metrics.${metric.key}`, {}, variant.labels[metric.key]);
    return this._t(`metrics.${metric.key}`, {}, metric.label);
  }

  _weatherState() {
    const entityId = this.config?.weather_entity;
    if (!entityId) return "";
    return String(this._hass?.states?.[entityId]?.state || "").toLowerCase().trim().replace(/\s+/g, "-");
  }

  _weatherSuffixes() {
    return WEATHER_IMAGE_SUFFIXES[this._weatherState()] || [];
  }

  _imageStateKey() {
    return `${this._isDaylight()}|${this._weatherState()}|${this.config?.image || ""}|${this.config?.day_image || ""}`;
  }

  _imageWithSuffix(file, suffix) {
    if (!file || !suffix) return "";
    const dotIndex = file.lastIndexOf(".");
    if (dotIndex < 0) return `${file}_${suffix}`;
    return `${file.slice(0, dotIndex)}_${suffix}${file.slice(dotIndex)}`;
  }

  _weatherImageFiles(variant, isDaylight) {
    const primaryFile = isDaylight && variant.dayFile ? variant.dayFile : variant.file;
    const fallbackFile = isDaylight ? variant.file : variant.dayFile;
    const weatherFiles = this._weatherSuffixes().flatMap((suffix) => [
      this._imageWithSuffix(primaryFile, suffix),
      this._imageWithSuffix(fallbackFile, suffix),
    ]);
    return [
      ...weatherFiles,
      primaryFile,
      ...(fallbackFile && fallbackFile !== primaryFile ? [fallbackFile] : []),
      ...(variant.fallbackFiles || []),
    ].filter(Boolean);
  }

  _imagePath(variant, file) {
    if (!file || file.includes("/")) return file;
    return variant?.folder ? `${variant.folder}/${file}` : file;
  }

  _variantImage(variant) {
    const files = this._weatherImageFiles(variant, this._isDaylight())
      .map((file) => this._imagePath(variant, file));
    const urls = [...new Set(files.flatMap((file) => [
      this._localImageUrl(file),
      this._remoteImageUrl(file),
    ]).filter(Boolean))];
    const [primaryUrl, ...fallbackUrls] = urls;
    return {
      src: primaryUrl,
      fallbacks: fallbackUrls,
    };
  }

  _remoteImageUrl(file) {
    return `${REPOSITORY_IMAGE_BASE}/${file}`;
  }

  _localImageUrl(file) {
    try {
      return new URL(`images/${file}`, import.meta.url).href;
    } catch (_err) {
      return "";
    }
  }

  _metricPosition(variant, key) {
    if (key === "wallbox2_power") {
      const configured = this.config.positions[key];
      if (configured?.left !== undefined || configured?.top !== undefined) {
        return {
          ...adjacentWallboxPosition({
            ...(variant.positions.wallbox_power || {}),
            ...(this.config.positions.wallbox_power || {}),
          }),
          ...configured,
        };
      }
      return adjacentWallboxPosition({
        ...(variant.positions.wallbox_power || {}),
        ...(this.config.positions.wallbox_power || {}),
      });
    }

    return {
      ...(variant.positions[key] || {}),
      ...(this.config.positions[key] || {}),
    };
  }

  _toPercent(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(96, Math.max(4, number)) : fallback;
  }

  _clampNumber(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  _isDaylight() {
    const entityId = this.config?.daylight_entity || "sun.sun";
    const entity = this._hass?.states?.[entityId];
    const state = String(entity?.state || "").toLowerCase();
    if (["above_horizon", "above horizon", "on"].includes(state) || state.includes("über dem horizont")) return true;
    if (["below_horizon", "below horizon", "off"].includes(state) || state.includes("unter dem horizont")) return false;

    const elevation = Number(entity?.attributes?.elevation);
    if (Number.isFinite(elevation)) return elevation > -0.833;

    const nextRising = Date.parse(entity?.attributes?.next_rising || "");
    const nextSetting = Date.parse(entity?.attributes?.next_setting || "");
    if (Number.isFinite(nextRising) && Number.isFinite(nextSetting)) return nextSetting < nextRising;

    return false;
  }

  _layoutState() {
    const activeHouse = this._normalizeHouse(this._selectedHouse) || this.config.house;
    const variant = HOUSE_VARIANTS[activeHouse] || HOUSE_VARIANTS.single_family_home;
    const variantImage = this._variantImage(variant);
    const customImage = this._isDaylight() && this.config.day_image ? this.config.day_image : this.config.image;
    const imageSrc = customImage || variantImage.src;
    const imageFallbacks = customImage ? [variantImage.src, ...(variantImage.fallbacks || [])] : variantImage.fallbacks;

    return { activeHouse, variant, imageSrc, imageFallbacks };
  }

  _escape(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  _renderHouseSelector(activeHouse) {
    if (!this.config.show_house_selector) return "";

    const options = Object.entries(HOUSE_VARIANTS)
      .map(([key, variant]) => {
        const selected = key === activeHouse ? " selected" : "";
        return `<option value="${key}"${selected}>${this._escape(this._houseLabel(key, variant))}</option>`;
      })
      .join("");

    return `<select class="house-select" aria-label="${this._escape(this._t("aria.houseSelector"))}">${options}</select>`;
  }

  _renderViewSelector() {
    if (this.config.show_view_selector !== true) return "";
    const activeView = this._currentViewMode();
    const buttons = VIEW_MODE_OPTIONS
      .map((option) => {
        const active = option.key === activeView;
        const label = this._t(option.labelKey, {}, option.label);
        return `
          <button
            class="view-mode-button${active ? " active" : ""}"
            type="button"
            data-view-mode="${this._escape(option.key)}"
            aria-pressed="${active ? "true" : "false"}"
            title="${this._escape(label)}"
          >${this._escape(label)}</button>
        `;
      })
      .join("");

    return `<div class="view-mode-toggle" role="group" aria-label="${this._escape(this._t("aria.viewSelector", {}, "Select dashboard view"))}">${buttons}</div>`;
  }

  _renderEnergyRangeSelector() {
    if (this.config.show_energy_range_selector !== true) return "";
    const activeRange = this._currentEnergyRange();
    const options = ENERGY_RANGE_OPTIONS
      .map((option) => {
        const selected = option.key === activeRange ? " selected" : "";
        return `<option value="${option.key}"${selected}>${this._escape(this._t(option.labelKey, {}, option.label))}</option>`;
      })
      .join("");

    return `<select class="energy-range-select" aria-label="${this._escape(this._t("aria.energyRangeSelector"))}">${options}</select>`;
  }

  _overlayDefault(activeHouse, key) {
    return DEFAULT_IMAGE_OVERLAYS[activeHouse]?.[key]
      || DEFAULT_IMAGE_OVERLAYS.single_family_home[key]
      || {};
  }

  _overlayConfig(activeHouse, key) {
    return {
      ...this._overlayDefault(activeHouse, key),
      ...(this.config.image_overlays?.[key] || {}),
    };
  }

  _overlayNumber(value, fallback, min, max) {
    return this._clampNumber(value, fallback, min, max);
  }

  _overlayAssetUrls(key) {
    const file = `${key}.png`;
    const urls = [this._remoteImageUrl(file)];
    try {
      urls.push(new URL(file, import.meta.url).href);
    } catch (_err) {
      // no local root fallback
    }
    try {
      urls.push(new URL(`images/${file}`, import.meta.url).href);
    } catch (_err) {
      // no local images fallback
    }
    return [...new Set(urls.filter(Boolean))];
  }

  _renderImageOverlays(activeHouse) {
    return IMAGE_OVERLAY_KEYS.map((key) => {
      const config = this._overlayConfig(activeHouse, key);
      if (config.enabled !== true) return "";
      const left = this._overlayNumber(config.left, this._overlayDefault(activeHouse, key).left ?? 50, 0, 100);
      const top = this._overlayNumber(config.top, this._overlayDefault(activeHouse, key).top ?? 50, 0, 100);
      const width = this._overlayNumber(config.width ?? config.size, this._overlayDefault(activeHouse, key).width ?? 12, 2, 60);
      const orientation = String(config.orientation || "right").toLowerCase() === "left" ? "left" : "right";
      const label = this._overlayLabel(key);
      const scaleX = key === "heatpump" && orientation === "left" ? -1 : 1;
      const translateY = key === "smoke" ? "-100%" : "-50%";
      const style = [
        `left:${left}%`,
        `top:${top}%`,
        `width:${width}%`,
        `--overlay-scale-x:${scaleX}`,
        `--overlay-translate-y:${translateY}`,
      ].join(";");
      const [src, ...fallbacks] = this._overlayAssetUrls(key);
      const reading = this._formatOverlayReading(key);
      const visibilityKey = `overlay_${key}`;
      const readingHtml = this.config.image_overlays?.[key]?.entity && this._labelVisibility(visibilityKey).image
        ? `<div class="overlay-reading${this._labelVisibilityClass(visibilityKey)}"><span class="overlay-reading-label" data-overlay-label="${this._escape(key)}">${this._escape(label)}</span><span class="overlay-reading-value" data-overlay-value="${this._escape(key)}">${this._escape(reading)}</span></div>`
        : "";
      return `
        <div class="image-overlay-wrap image-overlay-wrap-${this._escape(key)}" style="${this._escape(style)}">
          <img class="image-overlay image-overlay-${this._escape(key)}" src="${this._escape(src)}" data-fallbacks="${this._escape(fallbacks.join("|"))}" alt="${this._escape(label)}" loading="lazy" />
          ${readingHtml}
        </div>
      `;
    }).join("");
  }

  _renderMetric(metric, variant) {
    if (!this._metricVisible(metric, variant)) return "";

    const position = this._metricPosition(variant, metric.key);
    const left = this._toPercent(position.left, 50);
    const top = this._toPercent(position.top, 50);
    const tooltip = this._metricTooltip(metric, variant);
    const warning = this._metricWarning(metric);

    return `
      <div class="metric${this._metricStateClass(metric)}" data-accent-key="${metric.key}" data-metric="${metric.key}" data-tooltip-key="${metric.key}" data-chart-key="${this._escape(this._metricEntityId(metric) ? metric.key : "")}" data-warning="${this._escape(warning?.label || "")}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="left: ${left}%; top: ${top}%; ${this._escape(this._accentStyle(metric))}">
        <div class="label" data-label="${metric.key}">${this._escape(this._metricLabel(metric, variant))}</div>
        <div class="value-row">
          <div class="value" data-value="${metric.key}">${this._escape(this._formatReading(metric))}</div>
        </div>
        ${this._renderPvMetaRow(metric, { placement: "image" })}
        ${this._renderBatteryMetaRow(metric, { showFlowLabel: false, placement: "image" })}
        ${this._renderWallboxPhaseRow(metric, { placement: "image" })}
        ${this._renderMetricMeter(metric)}
      </div>
    `;
  }

  _flowMetric(key) {
    return TILE_METRICS.find((metric) => metric.key === key)
      || METRICS.find((metric) => metric.key === key)
      || (key === STATUS_METRIC.key ? STATUS_METRIC : undefined);
  }

  _hasFlowPosition(variant, key) {
    if (key === "wallbox2_power") {
      return Boolean(
        variant?.positions?.wallbox2_power
        || this.config.positions?.wallbox2_power
        || variant?.positions?.wallbox_power
        || this.config.positions?.wallbox_power
      );
    }
    return Boolean(variant?.positions?.[key] || this.config.positions?.[key]);
  }

  _flowAnchor(variant, key, { allowHidden = false } = {}) {
    if (key === "grid") {
      const inverterAnchor = this._flowAnchor(variant, "inverter_power", { allowHidden: true });
      if (!inverterAnchor) return undefined;
      return {
        left: inverterAnchor.left < 50 ? 4 : 96,
        top: this._toPercent(inverterAnchor.top, 50),
      };
    }

    const metric = this._flowMetric(key);
    if (metric && !allowHidden && !this._metricVisible(metric, variant)) return undefined;
    if (!this._hasFlowPosition(variant, key)) return undefined;

    const position = this._metricPosition(variant, key);
    return {
      left: this._toPercent(position.left, 50),
      top: this._toPercent(position.top, 50),
    };
  }

  _flowWattsForKey(key) {
    if (key === "import_export_power") {
      const flowInfo = this._gridFlowInfo();
      return Number.isFinite(flowInfo?.watts) ? flowInfo.watts : undefined;
    }
    const entityId = this.config.entities?.[key];
    if (!entityId) return undefined;
    const value = this._getEntityValue(entityId, undefined);
    if (value === undefined || value === null || value === "unknown" || value === "unavailable") return undefined;
    const watts = this._valueAsWatts(value, this._getEntityUnit(entityId));
    return Number.isFinite(watts) ? watts : undefined;
  }

  _flowVisual(magnitude) {
    const strength = Math.min(1, Math.max(0.3, Math.log10(Math.abs(magnitude) + 10) / 4));
    const opacity = 0.28 + strength * 0.52;
    const width = 0.24 + strength * 0.5;
    return {
      baseWidth: `${(width * 2).toFixed(2)}px`,
      pulseWidth: `${(width * 3).toFixed(2)}px`,
      opacity: opacity.toFixed(2),
      baseOpacity: (opacity * 0.34).toFixed(2),
      reducedOpacity: (opacity * 0.5).toFixed(2),
      speed: (1.85 - strength * 0.55).toFixed(2),
    };
  }

  _flowPath(from, to, index) {
    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const distance = Math.hypot(dx, dy) || 1;
    const bendIndex = (index % 5) - 2;
    const bend = Math.min(8, Math.max(2.5, distance * 0.12)) * bendIndex * 0.36;
    const middleX = (from.left + to.left) / 2 + (-dy / distance) * bend;
    const middleY = (from.top + to.top) / 2 + (dx / distance) * bend;
    return `M ${from.left.toFixed(2)} ${from.top.toFixed(2)} Q ${middleX.toFixed(2)} ${middleY.toFixed(2)} ${to.left.toFixed(2)} ${to.top.toFixed(2)}`;
  }

  _renderEnergyFlows(variant) {
    if (this.config.show_power_flows !== true) return "";
    const threshold = this._gridNeutralThreshold();
    const flows = [];
    const addFlow = (fromKey, toKey, magnitude, color) => {
      const value = Math.abs(Number(magnitude));
      if (!Number.isFinite(value) || value <= threshold) return;
      const from = this._flowAnchor(variant, fromKey, { allowHidden: fromKey === "inverter_power" });
      const to = this._flowAnchor(variant, toKey, { allowHidden: toKey === "inverter_power" });
      if (!from || !to) return;
      if (Math.abs(from.left - to.left) < 0.5 && Math.abs(from.top - to.top) < 0.5) return;
      flows.push({ from, to, magnitude: value, color });
    };

    let pvFlows = 0;
    ["pv_roof_power", "pv_shed_power"].forEach((key) => {
      const before = flows.length;
      addFlow(key, "inverter_power", this._flowWattsForKey(key), "#ffc233");
      if (flows.length > before) pvFlows += 1;
    });
    if (pvFlows === 0) addFlow("pv_total_power", "inverter_power", this._flowWattsForKey("pv_total_power"), "#ffc233");

    const batteryFlow = this._batteryFlowInfo();
    if (batteryFlow?.direction === "charge") {
      addFlow("inverter_power", "battery_level", batteryFlow.kind === "energy" ? batteryFlow.amount * 1000 : batteryFlow.amount, "#34d399");
    } else if (batteryFlow?.direction === "discharge") {
      addFlow("battery_level", "inverter_power", batteryFlow.kind === "energy" ? batteryFlow.amount * 1000 : batteryFlow.amount, "#f87171");
    }

    addFlow("inverter_power", "wallbox_power", this._flowWattsForKey("wallbox_power"), "#1f8fff");
    addFlow("inverter_power", "wallbox2_power", this._flowWattsForKey("wallbox2_power"), "#60a5fa");
    addFlow("inverter_power", "house_consumption_power", this._flowWattsForKey("house_consumption_power"), "#93c5fd");

    const gridWatts = this._flowWattsForKey("import_export_power");
    if (Number.isFinite(gridWatts) && Math.abs(gridWatts) > threshold) {
      if (gridWatts > 0) addFlow("grid", "inverter_power", gridWatts, "#fb923c");
      else addFlow("inverter_power", "grid", gridWatts, "#34d399");
    }

    if (flows.length === 0) return "";
    const paths = flows.map((flow, index) => {
      const visual = this._flowVisual(flow.magnitude);
      const style = [
        `--flow-color:${flow.color}`,
        `--flow-base-width:${visual.baseWidth}`,
        `--flow-pulse-width:${visual.pulseWidth}`,
        `--flow-opacity:${visual.opacity}`,
        `--flow-base-opacity:${visual.baseOpacity}`,
        `--flow-reduced-opacity:${visual.reducedOpacity}`,
        `--flow-speed:${visual.speed}s`,
        `--flow-delay:${(-index * 0.22).toFixed(2)}s`,
      ].join(";");
      const path = this._flowPath(flow.from, flow.to, index);
      return `
        <g class="flow-group" style="${this._escape(style)}">
          <path class="flow-line-base" pathLength="100" d="${this._escape(path)}"></path>
          <path class="flow-line-pulse" pathLength="100" d="${this._escape(path)}"></path>
        </g>
      `;
    }).join("");

    return `
      <svg class="flow-overlay" data-flow-overlay viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="ha-solar-flow-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.15" result="blur"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="blur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
        </defs>
        ${paths}
      </svg>
    `;
  }

  _positiveWattsForKey(key) {
    const watts = this._flowWattsForKey(key);
    return Number.isFinite(watts) ? Math.max(0, watts) : undefined;
  }

  _advisorSnapshot() {
    const pvTotal = this._positiveWattsForKey("pv_total_power");
    const pvParts = ["pv_roof_power", "pv_shed_power"]
      .map((key) => this._positiveWattsForKey(key))
      .filter(Number.isFinite);
    const pvWatts = Number.isFinite(pvTotal)
      ? pvTotal
      : pvParts.length > 0
        ? pvParts.reduce((sum, value) => sum + value, 0)
        : undefined;
    const gridInfo = this._gridFlowInfo();
    const gridWatts = Number.isFinite(gridInfo?.watts) ? gridInfo.watts : undefined;
    const importWatts = Number.isFinite(gridWatts) ? Math.max(0, gridWatts) : undefined;
    const exportWatts = Number.isFinite(gridWatts) ? Math.max(0, -gridWatts) : undefined;
    const houseWatts = this._positiveWattsForKey("house_consumption_power");
    const wallboxWatts = ["wallbox_power", "wallbox2_power"]
      .map((key) => this._positiveWattsForKey(key))
      .filter(Number.isFinite)
      .reduce((sum, value) => sum + value, 0);
    const hasWallbox = ["wallbox_power", "wallbox2_power"].some((key) => Boolean(this.config.entities?.[key]));
    const batteryMetric = TILE_METRICS.find((metric) => metric.key === "battery_level") || { key: "battery_level", unit: "battery" };
    const batteryPercent = this._batteryPercent(batteryMetric);
    const batteryFlow = this._batteryFlowInfo();
    const batteryFlowWatts = batteryFlow?.kind === "energy" ? batteryFlow.amount * 1000 : batteryFlow?.amount;
    const batteryChargeWatts = batteryFlow?.direction === "charge" && Number.isFinite(batteryFlowWatts) ? batteryFlowWatts : 0;
    const batteryDischargeWatts = batteryFlow?.direction === "discharge" && Number.isFinite(batteryFlowWatts) ? batteryFlowWatts : 0;
    const loadWatts = Number.isFinite(houseWatts)
      ? houseWatts
      : wallboxWatts > 0
        ? wallboxWatts
        : undefined;
    const selfConsumptionPercent = Number.isFinite(pvWatts) && pvWatts > 0 && Number.isFinite(exportWatts)
      ? this._clampNumber(((pvWatts - exportWatts) / pvWatts) * 100, 0, 0, 100)
      : undefined;
    const autarkyPercent = Number.isFinite(loadWatts) && loadWatts > 0 && Number.isFinite(importWatts)
      ? this._clampNumber(((loadWatts - importWatts) / loadWatts) * 100, 0, 0, 100)
      : undefined;

    return {
      pvWatts,
      gridWatts,
      importWatts,
      exportWatts,
      houseWatts,
      wallboxWatts,
      hasWallbox,
      batteryPercent,
      batteryFlow,
      batteryChargeWatts,
      batteryDischargeWatts,
      loadWatts,
      selfConsumptionPercent,
      autarkyPercent,
      hasPv: Number.isFinite(pvWatts),
      hasGrid: Number.isFinite(gridWatts),
      hasLoad: Number.isFinite(loadWatts),
    };
  }

  _advisorWarnings() {
    const variant = this._currentVariant || this._layoutState().variant;
    const metrics = [
      ...this._visibleMetrics(variant),
      ...this._visibleTileMetrics(variant).filter((metric) => metric.customKpi),
      ...(this._showGridStatusTile() ? [GRID_STATUS_METRIC] : []),
      ...this._visibleOverlayMetrics(),
    ];
    return metrics.filter((metric, index, list) => list.findIndex((item) => item.key === metric.key) === index)
      .map((metric) => {
        const warning = this._metricWarning(metric);
        if (!warning) return undefined;
        return {
          type: "warning",
          priority: 100,
          title: this._metricLabel(metric, this._currentVariant),
          text: warning.label,
          diagnostic: true,
        };
      })
      .filter(Boolean);
  }

  _advisorSuggestionLimit() {
    return Math.round(this._clampNumber(this.config.advisor_max_suggestions, 8, 1, 12));
  }

  _advisorItems(snapshot = this._advisorSnapshot(), { maxItems = this._advisorSuggestionLimit() } = {}) {
    const items = [...this._advisorWarnings()];
    const add = (type, priority, title, text, value = "") => {
      items.push({ type, priority, title, text, value });
    };
    const itemLimit = Math.round(this._clampNumber(maxItems, this._advisorSuggestionLimit(), 1, 12));
    const surplusThreshold = this._clampNumber(this.config.advisor_surplus_threshold, 250, 0, 1000000);
    const importThreshold = this._clampNumber(this.config.advisor_import_threshold, 250, 0, 1000000);
    const highLoadThreshold = this._clampNumber(this.config.advisor_high_load_threshold, 3000, 0, 1000000);
    const lowBatteryThreshold = this._clampNumber(this.config.battery_low_threshold, 20, 0, 100);

    if (!snapshot.hasPv) {
      add("setup", 62, this._t("advisor.pv", {}, "PV"), this._t("advisor.configurePvTotal", {}, "Add PV total power or roof/shed PV sensors to improve production analysis."));
    }
    if (!snapshot.hasGrid) {
      add("setup", 61, this._t("advisor.grid", {}, "Grid"), this._t("advisor.configureGrid", {}, "Add grid import/export sensors for better advice about surplus and grid draw."));
    }
    if (!snapshot.hasLoad) {
      add("setup", 38, this._t("advisor.consumption", {}, "Load"), this._t("advisor.configureConsumption", {}, "Add a house consumption sensor to improve autarky and load analysis."));
    }

    if (items.some((item) => item.type === "warning")) {
      add("warning", 95, this._t("advisor.status", {}, "Status"), this._t("advisor.checkSensors", {}, "Check unavailable or missing sensors so the energy balance stays reliable."));
    }

    if (Number.isFinite(snapshot.exportWatts) && snapshot.exportWatts > surplusThreshold) {
      const value = this._formatPowerValue(snapshot.exportWatts, this.config.units?.power || "auto", "W");
      add("opportunity", 88, this._t("advisor.surplus", {}, "Surplus"), this._t("advisor.surplusGeneral", {}, "PV surplus is available. Prioritize flexible loads while export is active."), value);
      if (snapshot.hasWallbox && snapshot.wallboxWatts <= surplusThreshold) {
        add("opportunity", 82, this._t("advisor.wallbox", {}, "EV"), this._t("advisor.startEvCharging", {}, "Start or increase EV charging while surplus is available."), value);
      }
      if (this.config.image_overlays?.heatpump?.enabled === true || this.config.image_overlays?.heatpump?.entity) {
        add("opportunity", 74, this._overlayLabel("heatpump"), this._t("advisor.useHeatPump", {}, "Use heat pump boost or preheat hot water while PV surplus is available."), value);
      }
      if (Number.isFinite(snapshot.batteryPercent) && snapshot.batteryPercent >= 92) {
        add("info", 70, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryNearlyFull", {}, "Battery is nearly full, so additional PV is likely to be exported."), `${Math.round(snapshot.batteryPercent)}%`);
      } else if (snapshot.batteryFlow?.direction !== "charge" && (this.config.entities?.battery_flow_power || this.config.entities?.battery_charge_power)) {
        add("info", 64, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryIdle", {}, "Battery is not charging while surplus is exported. Check battery limits or charge mode."));
      }
      add("opportunity", 60, this._t("advisor.appliances", {}, "Appliances"), this._t("advisor.runAppliance", {}, "Run a flexible household appliance now if it is waiting."), value);
    }

    if (Number.isFinite(snapshot.importWatts) && snapshot.importWatts > importThreshold) {
      const value = this._formatPowerValue(snapshot.importWatts, this.config.units?.power || "auto", "W");
      add("warning", 86, this._t("advisor.grid", {}, "Grid"), this._t("advisor.headlineImport", {}, "Grid import is active"), value);
      if (snapshot.wallboxWatts > importThreshold) {
        add("warning", 80, this._t("advisor.wallbox", {}, "EV"), this._t("advisor.evChargingGrid", {}, "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended."), this._formatPowerValue(snapshot.wallboxWatts, this.config.units?.power || "auto", "W"));
      }
      if (Number.isFinite(snapshot.loadWatts) && snapshot.loadWatts > highLoadThreshold) {
        add("info", 58, this._t("advisor.consumption", {}, "Load"), this._t("advisor.highLoad", {}, "Current load is high compared with PV production. Check large consumers if this is unexpected."), this._formatPowerValue(snapshot.loadWatts, this.config.units?.power || "auto", "W"));
      }
    }

    if (Number.isFinite(snapshot.batteryPercent) && snapshot.batteryPercent <= lowBatteryThreshold) {
      add("warning", 78, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryLow", {}, "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible."), `${Math.round(snapshot.batteryPercent)}%`);
    }

    if (
      this._isDaylight()
      && Number.isFinite(snapshot.pvWatts)
      && snapshot.pvWatts <= Math.max(100, surplusThreshold * 0.5)
      && !["rainy", "pouring", "snowy", "snowy-rainy", "fog"].includes(this._weatherState())
    ) {
      add("info", 46, this._t("advisor.pv", {}, "PV"), this._t("advisor.lowPv", {}, "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors."), this._formatPowerValue(snapshot.pvWatts, this.config.units?.power || "auto", "W"));
    }

    if (
      snapshot.wallboxWatts > importThreshold
      && (!Number.isFinite(snapshot.importWatts) || snapshot.importWatts <= importThreshold)
    ) {
      add("success", 42, this._t("advisor.wallbox", {}, "EV"), this._t("advisor.evChargingPv", {}, "EV charging is currently covered well by PV or stored energy."), this._formatPowerValue(snapshot.wallboxWatts, this.config.units?.power || "auto", "W"));
    }

    if (items.length === 0) {
      add("success", 10, this._t("advisor.status", {}, "Status"), this._t("advisor.noAdvice", {}, "No urgent action right now."));
    }

    return items.sort((a, b) => b.priority - a.priority).slice(0, itemLimit);
  }

  _advisorStatus(snapshot = this._advisorSnapshot(), items = this._advisorItems(snapshot)) {
    const hasDiagnosticWarning = items.some((item) => item.diagnostic === true);
    const hasSetup = items.some((item) => item.type === "setup");
    const surplusThreshold = this._clampNumber(this.config.advisor_surplus_threshold, 250, 0, 1000000);
    const importThreshold = this._clampNumber(this.config.advisor_import_threshold, 250, 0, 1000000);
    if (hasDiagnosticWarning) return { type: "warning", label: this._t("advisor.headlineWarning", {}, "Energy setup needs attention") };
    if (Number.isFinite(snapshot.exportWatts) && snapshot.exportWatts > surplusThreshold) {
      return { type: "opportunity", label: this._t("advisor.headlineExport", {}, "PV surplus is available") };
    }
    if (Number.isFinite(snapshot.importWatts) && snapshot.importWatts > importThreshold) {
      return { type: "warning", label: this._t("advisor.headlineImport", {}, "Grid import is active") };
    }
    if (hasSetup) return { type: "setup", label: this._t("advisor.headlineSetup", {}, "More sensors unlock better advice") };
    return { type: "success", label: this._t("advisor.headlineNeutral", {}, "Energy flow is balanced") };
  }

  _advisorMetricValue(value, formatter) {
    return Number.isFinite(value) ? formatter(value) : this._t("advisor.unknown", {}, "Unknown");
  }

  _renderEnergyAdvisor({ dashboard = false } = {}) {
    if (!dashboard) return "";
    const snapshot = this._advisorSnapshot();
    const items = this._advisorItems(snapshot, { maxItems: this._advisorSuggestionLimit() });
    const status = this._advisorStatus(snapshot, items);
    const powerFormatter = (value) => this._formatPowerValue(value, this.config.units?.power || "auto", "W");
    const percentFormatter = (value) => `${Math.round(value)}%`;
    const gridStatus = Number.isFinite(snapshot.gridWatts)
      ? snapshot.gridWatts > this._gridNeutralThreshold()
        ? `${this._t("advisor.importing", {}, "Importing")} ${powerFormatter(snapshot.importWatts)}`
        : snapshot.gridWatts < -this._gridNeutralThreshold()
          ? `${this._t("advisor.exporting", {}, "Exporting surplus")} ${powerFormatter(snapshot.exportWatts)}`
          : this._t("advisor.selfSufficient", {}, "Self-sufficient")
      : this._t("advisor.unknown", {}, "Unknown");
    const metrics = [
      [this._t("advisor.pv", {}, "PV"), this._advisorMetricValue(snapshot.pvWatts, powerFormatter)],
      [this._t("advisor.grid", {}, "Grid"), gridStatus],
      [this._t("advisor.batteryStatus", {}, "Battery"), Number.isFinite(snapshot.batteryPercent) ? `${Math.round(snapshot.batteryPercent)}%` : this._formatBatteryFlowValue(snapshot.batteryFlow) || this._t("advisor.unknown", {}, "Unknown")],
      [this._t("advisor.consumption", {}, "Load"), this._advisorMetricValue(snapshot.loadWatts, powerFormatter)],
      [this._t("advisor.selfConsumption", {}, "Self-use"), this._advisorMetricValue(snapshot.selfConsumptionPercent, percentFormatter)],
      [this._t("advisor.autarky", {}, "Autarky"), this._advisorMetricValue(snapshot.autarkyPercent, percentFormatter)],
      ...this._customKpiMetrics().map((metric) => [this._metricLabel(metric), this._formatReading(metric), this._accentStyle(metric)]),
    ];
    const metricHtml = metrics.map(([label, value, style = ""]) => `
      <div class="advisor-metric" style="${this._escape(style)}">
        <span>${this._escape(label)}</span>
        <strong>${this._escape(value)}</strong>
      </div>
    `).join("");
    const itemHtml = items.map((item) => `
      <div class="advisor-item advisor-${this._escape(item.type)}">
        <div class="advisor-item-head">
          <strong>${this._escape(item.title)}</strong>
          ${item.value ? `<span>${this._escape(item.value)}</span>` : ""}
        </div>
        <div class="advisor-item-text">${this._escape(item.text)}</div>
      </div>
    `).join("");

    return `
      <section class="advisor advisor-${this._escape(status.type)}${dashboard ? " advisor-dashboard" : ""}" data-energy-advisor>
        <div class="advisor-head">
          <div>
            <div class="advisor-label">${this._escape(this._t("advisor.panelTitle", {}, "Energy Advisor"))}</div>
            <div class="advisor-title" data-advisor-title>${this._escape(status.label)}</div>
          </div>
          <div class="advisor-state">${this._escape(this._t("advisor.status", {}, "Status"))}</div>
        </div>
        <div class="advisor-items-head">
          <span>${this._escape(this._t("advisor.recommendations", {}, "Recommendations"))}</span>
          <strong>${this._escape(items.length === 1
            ? this._t("advisor.suggestionCountOne", { count: items.length }, `${items.length} suggestion`)
            : this._t("advisor.suggestionCount", { count: items.length }, `${items.length} suggestions`))}</strong>
        </div>
        <div class="advisor-items" data-advisor-items>${itemHtml}</div>
        <div class="advisor-metrics" data-advisor-metrics>${metricHtml}</div>
      </section>
    `;
  }

  _tileStyle(metric) {
    const columns = Math.round(this._clampNumber(metric.tileColumns ?? 1, 1, 1, 6));
    const mobileColumns = Math.min(columns, 2);
    return `${this._accentStyle(metric)} order:${Number(metric.tileOrder ?? 0)}; --tile-columns:${columns}; --tile-mobile-columns:${mobileColumns};`;
  }

  _attachControls() {
    const viewModeButtons = Array.from(this.shadowRoot.querySelectorAll("[data-view-mode]"));
    if (viewModeButtons.length > 0) {
      const switchViewMode = (nextViewMode, event) => {
        event?.preventDefault();
        event?.stopPropagation();
        if (!nextViewMode || nextViewMode === this._currentViewMode()) return;
        this._selectedViewMode = nextViewMode;
        this._renderCardShell(this._layoutState());
        const activeButton = this.shadowRoot.querySelector(`[data-view-mode="${this._escape(nextViewMode)}"]`);
        try {
          activeButton?.focus({ preventScroll: true });
        } catch (_err) {
          activeButton?.focus();
        }
      };

      viewModeButtons.forEach((button, index) => {
        ["pointerdown", "mousedown", "touchstart"].forEach((eventName) => {
          button.addEventListener(eventName, (event) => event.stopPropagation());
        });
        button.addEventListener("click", (event) => {
          switchViewMode(this._normalizeViewMode(event.currentTarget.dataset.viewMode), event);
        });
        button.addEventListener("keydown", (event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          const nextIndex = event.key === "Home"
            ? 0
            : event.key === "End"
              ? viewModeButtons.length - 1
              : event.key === "ArrowLeft"
                ? (index - 1 + viewModeButtons.length) % viewModeButtons.length
                : (index + 1) % viewModeButtons.length;
          switchViewMode(this._normalizeViewMode(viewModeButtons[nextIndex].dataset.viewMode), event);
        });
      });
    }

    const select = this.shadowRoot.querySelector(".house-select");
    if (select) {
      select.addEventListener("change", (event) => {
        const nextHouse = this._normalizeHouse(event.target.value);
        if (!nextHouse || nextHouse === this._selectedHouse) return;
        this._selectedHouse = nextHouse;
        this._renderCardShell(this._layoutState());
      });
    }

    const energyRangeSelect = this.shadowRoot.querySelector(".energy-range-select");
    if (energyRangeSelect) {
      energyRangeSelect.addEventListener("change", (event) => {
        const nextRange = this._normalizeEnergyRange(event.target.value);
        if (!nextRange || nextRange === this._currentEnergyRange()) return;
        this._selectedEnergyRange = nextRange;
        this._renderCardShell(this._layoutState());
      });
    }

    const image = this.shadowRoot.querySelector(".scene-image");
    if (image) {
      image.addEventListener("error", () => this._applyImageFallback(image));
      if (image.complete && image.naturalWidth === 0) this._applyImageFallback(image);
    }

    this.shadowRoot.querySelectorAll(".image-overlay").forEach((overlay) => {
      overlay.addEventListener("error", () => this._applyImageFallback(overlay));
      if (overlay.complete && overlay.naturalWidth === 0) this._applyImageFallback(overlay);
    });

    this.shadowRoot.querySelectorAll("[data-chart-key]").forEach((element) => {
      const metricKey = element.dataset.chartKey;
      if (!metricKey) return;
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._openChart(metricKey);
      });
    });

    this.shadowRoot.querySelectorAll("[data-chart-hours]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const metricKey = this._activeChart?.metricKey;
        if (!metricKey) return;
        this._openChart(metricKey, Number(event.currentTarget.dataset.chartHours));
      });
    });

    this.shadowRoot.querySelectorAll("[data-chart-close]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._closeChart();
      });
    });
  }

  _applyImageFallback(image) {
    const fallbacks = (image.dataset.fallbacks || "").split("|").filter(Boolean);
    while (fallbacks.length > 0) {
      const fallback = fallbacks.shift();
      if (!fallback || image.src === fallback) continue;
      image.dataset.fallbacks = fallbacks.join("|");
      window.setTimeout(() => {
        image.src = fallback;
      }, 0);
      return;
    }
    image.dataset.fallbacks = "";
    image.style.display = "none";
  }

  _renderCardShell(state) {
    this._lastImageKey = this._imageStateKey();
    this._lastLanguage = this._language();
    this._currentVariant = state.variant;
    const activeView = this._currentViewMode();
    const visibleHudMetrics = this._visibleHudMetrics(state.variant);
    const visibleTileMetrics = this._visibleTileMetrics(state.variant);
    const metricHtml = visibleHudMetrics.map((metric) => this._renderMetric(metric, state.variant)).join("");
    const imageOverlayHtml = this._renderImageOverlays(state.activeHouse);
    const flowHtml = this._renderEnergyFlows(state.variant);
    const advisorHtml = activeView === "advisor" ? this._renderEnergyAdvisor({ dashboard: true }) : "";
    const statusLabel = this._statusLabel();
    const statusHtml = this.config.show_status_label !== false
      ? `<div class="scene-status" data-accent-key="${STATUS_METRIC.key}" data-status-label style="${this._escape(this._accentStyle(STATUS_METRIC))}">${this._escape(statusLabel)}</div>`
      : "";
    const headerHtml = [
      this.config.show_title !== false ? `<div class="title">${this._escape(this._displayTitle())}</div>` : "",
      this._renderViewSelector(),
      activeView === "house" ? this._renderHouseSelector(state.activeHouse) : "",
      activeView === "house" ? this._renderEnergyRangeSelector() : "",
      this.config.show_time_label !== false ? `<div class="badge">${this._escape(this._displayTimeLabel())}</div>` : "",
    ].filter(Boolean).join("");
    const gridHtml = visibleTileMetrics.map((metric) => {
      const tooltip = this._metricTooltip(metric, state.variant);
      const warning = this._metricWarning(metric);
      const visibilityClass = metric.overlay ? this._labelVisibilityClass(metric.key) : "";
      const valueHtml = metric.key === "battery_level"
        ? `
          <div class="tile-value-row">
            <div class="num" data-value="${metric.key}">${this._escape(this._formatReading(metric))}</div>
          </div>
          ${this._renderBatteryMetaRow(metric, { placement: "footer" })}
        `
        : this._wallboxPhaseEntityKey(metric)
        ? `
          <div class="num" data-value="${metric.key}">${this._escape(this._formatReading(metric))}</div>
          ${this._renderWallboxPhaseRow(metric, { placement: "footer" })}
        `
        : this._isPvMetric(metric)
        ? `
          <div class="num" data-value="${metric.key}">${this._escape(this._formatReading(metric))}</div>
          ${this._renderPvMetaRow(metric, { placement: "footer" })}
        `
        : `<div class="num" data-value="${metric.key}">${this._escape(this._formatReading(metric))}</div>`;
      return `
        <div class="tile${this._metricStateClass(metric)}${visibilityClass}" data-accent-key="${metric.key}" data-tile="${metric.key}" data-tooltip-key="${metric.key}" data-chart-key="${this._escape(this._metricEntityId(metric) ? metric.key : "")}" data-warning="${this._escape(warning?.label || "")}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${this._escape(this._tileStyle(metric))}">
          <div class="name" data-label="${metric.key}">${this._escape(this._metricLabel(metric, state.variant))}</div>
          ${valueHtml}
          ${this._renderMetricMeter(metric)}
        </div>
      `;
    }).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; --text-main:#f3f6ff; --text-muted:#9ba3b8; --glass-soft:rgba(255,255,255,.08); --accent-yellow:#ffc233; --accent-blue:#1f8fff; --accent-green:#34d399; --hud-box-opacity:${this.config.hud_box_opacity}; --hud-box-scale:${this.config.hud_box_scale}; --hud-box-bg:rgba(8,16,38,var(--hud-box-opacity)); }
        ha-card { border-radius:18px; overflow:hidden; background:radial-gradient(110% 80% at 15% 0%, #232b44 0%, #111727 70%); color:var(--text-main); box-shadow:0 18px 45px rgba(0,0,0,.55); padding:16px; font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
        .header { display:grid; grid-template-columns:minmax(0,1fr) auto auto auto; align-items:center; gap:10px; margin-bottom:12px; }
        .title { min-width:0; overflow-wrap:anywhere; font-size:1.28rem; font-weight:700; line-height:1.2; }
        .badge,.house-select,.energy-range-select,.view-mode-toggle { background:var(--glass-soft); border:1px solid rgba(255,255,255,.2); border-radius:8px; color:var(--text-main); font:inherit; font-size:.88rem; min-height:34px; }
        .badge { display:inline-flex; align-items:center; padding:0 10px; white-space:nowrap; }
        .house-select,.energy-range-select { max-width:170px; padding:0 30px 0 10px; }
        .energy-range-select { max-width:110px; }
        .view-mode-toggle { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); width:clamp(224px,24vw,292px); max-width:100%; padding:2px; box-sizing:border-box; gap:2px; }
        .view-mode-button { min-width:0; min-height:28px; border:0; border-radius:6px; background:transparent; color:var(--text-muted); cursor:pointer; font:inherit; font-size:.82rem; font-weight:800; line-height:1.1; padding:0 10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .view-mode-button.active { background:linear-gradient(135deg,rgba(31,143,255,.5),rgba(52,211,153,.22)); color:#fff; box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),0 4px 12px rgba(31,143,255,.22); }
        .view-mode-button:focus-visible { outline:2px solid rgba(147,197,253,.95); outline-offset:1px; }
        .scene { position:relative; aspect-ratio:91/64; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,.1); margin-bottom:12px; background:#101626; }
        .scene-image { display:block; width:100%; height:100%; object-fit:cover; filter:saturate(1.03) contrast(1.03); }
        .image-overlay-wrap { position:absolute; z-index:1; width:10%; transform:translate(-50%,var(--overlay-translate-y,-50%)); transform-origin:center bottom; pointer-events:none; user-select:none; }
        .image-overlay { display:block; width:100%; height:auto; transform:scaleX(var(--overlay-scale-x,1)); transform-origin:center bottom; filter:drop-shadow(0 8px 12px rgba(0,0,0,.24)); }
        .image-overlay-smoke { opacity:.78; filter:blur(.15px); mix-blend-mode:screen; }
        .overlay-reading { position:absolute; left:calc(100% + 7px); top:50%; transform:translateY(-50%); display:grid; gap:1px; min-width:64px; max-width:118px; border-radius:9px; border:1px solid color-mix(in srgb,var(--tile-accent,#f3f6ff) 42%,rgba(255,255,255,.2)); background:rgba(8,16,38,.72); color:var(--tile-accent,#f3f6ff); font-size:.76rem; line-height:1.15; font-weight:800; padding:5px 7px; box-shadow:0 8px 20px rgba(0,0,0,.28); backdrop-filter:blur(4px); overflow-wrap:anywhere; }
        .overlay-reading-label { color:var(--text-muted); font-size:.64rem; font-weight:700; }
        .overlay-reading-value { color:var(--tile-accent,#f3f6ff); }
        .image-overlay-wrap-smoke .overlay-reading { --tile-accent:#ffc233; left:68%; top:88%; }
        .image-overlay-wrap-heatpump .overlay-reading { --tile-accent:#1f8fff; }
        .flow-overlay { position:absolute; inset:0; z-index:2; width:100%; height:100%; pointer-events:none; overflow:visible; mix-blend-mode:screen; }
        .flow-line-base,.flow-line-pulse { fill:none; stroke:var(--flow-color); vector-effect:non-scaling-stroke; }
        .flow-line-base { stroke-width:var(--flow-base-width); opacity:var(--flow-base-opacity); stroke-linecap:round; }
        .flow-line-pulse { stroke-width:var(--flow-pulse-width); opacity:var(--flow-opacity); stroke-linecap:round; stroke-dasharray:1 8; stroke-dashoffset:0; filter:url(#ha-solar-flow-glow); animation:flow-move var(--flow-speed) linear infinite; animation-delay:var(--flow-delay); }
        @keyframes flow-move { from { stroke-dashoffset:0; } to { stroke-dashoffset:-100; } }
        @media (prefers-reduced-motion:reduce){ .flow-line-pulse{animation:none;stroke-dashoffset:0;opacity:var(--flow-reduced-opacity);} }
        .metric { --tile-accent:var(--text-main); --tile-glow:transparent; position:absolute; z-index:3; width:clamp(82px,15%,118px); transform:translate(-50%,-50%) scale(var(--hud-box-scale)); transform-origin:center center; background:linear-gradient(135deg,var(--hud-box-bg),rgba(8,16,38,calc(var(--hud-box-opacity) * .82))); border:1px solid color-mix(in srgb,var(--tile-accent) 48%,rgba(255,255,255,.18)); backdrop-filter:blur(4px); border-radius:10px; padding:7px 9px; box-shadow:0 8px 24px rgba(0,0,0,.35),0 0 22px var(--tile-glow); pointer-events:auto; cursor:pointer; box-sizing:border-box; }
        .metric .label,.tile .name { color:var(--text-muted); font-size:.74rem; line-height:1.2; }
        .metric .value-row { display:flex; align-items:center; gap:5px; min-width:0; max-width:100%; }
        .tile .tile-value-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; min-width:0; max-width:100%; margin-top:2px; }
        .metric .value,.tile .num { color:var(--tile-accent); font-size:.92rem; font-weight:700; line-height:1.25; overflow-wrap:anywhere; }
        .metric-meter { width:100%; height:5px; margin-top:6px; overflow:hidden; border-radius:999px; background:rgba(255,255,255,.16); box-shadow:inset 0 0 0 1px rgba(255,255,255,.08); }
        .metric-meter span { display:block; height:100%; width:0; border-radius:inherit; background:linear-gradient(90deg,color-mix(in srgb,var(--tile-accent) 64%,#fff),var(--tile-accent)); box-shadow:0 0 10px color-mix(in srgb,var(--tile-accent) 62%,transparent); transition:width .28s ease; }
        .battery-flow { display:inline-flex; align-items:center; gap:3px; flex:0 1 auto; min-width:0; max-width:62px; border-radius:999px; padding:2px 5px; background:rgba(255,255,255,.1); font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(255,255,255,.08); overflow:hidden; white-space:nowrap; }
        .battery-flow.charge { color:#34d399; }
        .battery-flow.discharge { color:#f87171; }
        .battery-flow.with-label { max-width:100%; flex-wrap:wrap; white-space:normal; padding:3px 6px; font-size:.64rem; }
        .battery-flow-arrow { flex:0 0 auto; font-size:.78rem; line-height:1; }
        .battery-flow-label { min-width:0; overflow:hidden; text-overflow:ellipsis; }
        [data-battery-flow-value] { min-width:0; overflow:hidden; text-overflow:ellipsis; }
        .meta-row { display:flex; align-items:center; gap:4px; flex-wrap:wrap; min-width:0; max-width:100%; margin-top:3px; }
        .phase-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:72px; border-radius:999px; padding:2px 5px; background:rgba(31,143,255,.14); color:#93c5fd; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(147,197,253,.2); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .phase-badge:empty { display:none; }
        .soc-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:82px; border-radius:999px; padding:2px 5px; background:rgba(52,211,153,.14); color:#86efac; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(134,239,172,.2); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .soc-badge:empty { display:none; }
        .temp-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:86px; border-radius:999px; padding:2px 5px; background:rgba(251,146,60,.14); color:#fdba74; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(253,186,116,.22); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .temp-badge:empty { display:none; }
        .time-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:96px; border-radius:999px; padding:2px 5px; background:rgba(255,255,255,.1); color:#dbeafe; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(219,234,254,.18); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .time-badge:empty { display:none; }
        .pv-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:100%; border-radius:999px; padding:2px 5px; background:rgba(255,194,51,.14); color:#fde68a; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(253,230,138,.22); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .pv-badge:empty { display:none; }
        .metric.is-warning,.tile.is-warning { border-color:color-mix(in srgb,#f87171 74%,rgba(255,255,255,.18)); box-shadow:0 8px 24px rgba(0,0,0,.35),0 0 18px rgba(248,113,113,.32),0 0 22px var(--tile-glow); }
        .metric[data-warning]:not([data-warning=""])::after,.tile[data-warning]:not([data-warning=""])::after { content:"!"; position:absolute; top:5px; right:6px; width:16px; height:16px; display:grid; place-items:center; border-radius:999px; background:#f87171; color:#1b1020; font-size:.66rem; font-weight:900; line-height:1; box-shadow:0 0 14px rgba(248,113,113,.42); }
        .scene-status { --tile-accent:rgba(243,246,255,.86); --tile-glow:transparent; position:absolute; z-index:3; right:10px; bottom:10px; max-width:calc(100% - 20px); background:rgba(8,16,38,.62); border:1px solid color-mix(in srgb,var(--tile-accent) 34%,rgba(255,255,255,.14)); border-radius:8px; color:rgba(243,246,255,.86); font-size:.72rem; line-height:1.25; padding:5px 8px; backdrop-filter:blur(4px); box-shadow:0 8px 18px rgba(0,0,0,.28),0 0 18px var(--tile-glow); pointer-events:none; overflow-wrap:anywhere; }
        .scene-status:empty { display:none; }
        .grid { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:8px; }
        .tile { --tile-accent:var(--text-main); --tile-glow:transparent; --tile-columns:1; --tile-mobile-columns:1; position:relative; grid-column:span var(--tile-columns); background:linear-gradient(135deg,rgba(12,20,38,.78),rgba(12,20,38,.62)); border:1px solid color-mix(in srgb,var(--tile-accent) 34%,rgba(255,255,255,.08)); border-radius:8px; padding:10px; min-width:0; cursor:pointer; box-shadow:inset 3px 0 0 var(--tile-accent),0 8px 20px rgba(0,0,0,.18),0 0 20px var(--tile-glow); }
        .advisor { --advisor-accent:#93c5fd; display:grid; gap:10px; margin-top:12px; padding:12px; border-radius:8px; border:1px solid color-mix(in srgb,var(--advisor-accent) 36%,rgba(255,255,255,.1)); background:linear-gradient(135deg,rgba(15,23,42,.76),rgba(8,13,28,.68)); box-shadow:inset 3px 0 0 var(--advisor-accent),0 10px 24px rgba(0,0,0,.18); }
        .advisor-dashboard { margin-top:0; min-height:320px; align-content:start; }
        .advisor-warning { --advisor-accent:#fb923c; }
        .advisor-opportunity { --advisor-accent:#34d399; }
        .advisor-success { --advisor-accent:#34d399; }
        .advisor-setup { --advisor-accent:#93c5fd; }
        .advisor-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; min-width:0; }
        .advisor-label,.advisor-state { color:var(--text-muted); font-size:.72rem; line-height:1.2; font-weight:700; text-transform:uppercase; letter-spacing:0; }
        .advisor-title { color:var(--advisor-accent); font-size:1rem; line-height:1.25; font-weight:800; overflow-wrap:anywhere; }
        .advisor-state { flex:0 0 auto; border-radius:999px; padding:4px 7px; background:color-mix(in srgb,var(--advisor-accent) 14%,rgba(255,255,255,.08)); color:var(--advisor-accent); text-transform:none; }
        .advisor-metrics { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:6px; min-width:0; }
        .advisor-metric { --tile-accent:var(--text-main); --tile-glow:transparent; display:grid; gap:2px; min-width:0; padding:7px 8px; border-radius:8px; background:rgba(255,255,255,.06); box-shadow:inset 0 0 0 1px rgba(255,255,255,.07),0 0 16px var(--tile-glow); }
        .advisor-metric span { color:var(--text-muted); font-size:.68rem; line-height:1.15; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .advisor-metric strong { color:var(--tile-accent,var(--text-main)); font-size:.82rem; line-height:1.2; overflow-wrap:anywhere; }
        .advisor-items-head { display:flex; align-items:center; justify-content:space-between; gap:10px; min-width:0; color:var(--text-muted); font-size:.72rem; line-height:1.2; font-weight:800; text-transform:uppercase; letter-spacing:0; }
        .advisor-items-head strong { flex:0 0 auto; border-radius:999px; padding:4px 7px; background:rgba(255,255,255,.08); color:var(--text-main); font-size:.7rem; line-height:1.1; text-transform:none; }
        .advisor-items { display:grid; grid-template-columns:minmax(0,1fr); gap:8px; min-width:0; }
        .advisor-item { --item-accent:#93c5fd; display:grid; gap:4px; min-width:0; padding:9px; border-radius:8px; background:rgba(255,255,255,.055); border:1px solid color-mix(in srgb,var(--item-accent) 28%,rgba(255,255,255,.08)); box-shadow:inset 2px 0 0 var(--item-accent); }
        .advisor-item.advisor-warning { --item-accent:#fb923c; }
        .advisor-item.advisor-opportunity { --item-accent:#34d399; }
        .advisor-item.advisor-success { --item-accent:#34d399; }
        .advisor-item.advisor-setup { --item-accent:#93c5fd; }
        .advisor-item.advisor-info { --item-accent:#facc15; }
        .advisor-item-head { display:flex; align-items:center; justify-content:space-between; gap:8px; min-width:0; }
        .advisor-item-head strong { color:var(--item-accent); font-size:.82rem; line-height:1.2; overflow-wrap:anywhere; }
        .advisor-item-head span { flex:0 0 auto; color:var(--text-main); font-size:.74rem; font-weight:800; line-height:1.1; border-radius:999px; padding:3px 6px; background:rgba(255,255,255,.08); }
        .advisor-item-text { color:rgba(243,246,255,.86); font-size:.78rem; line-height:1.35; overflow-wrap:anywhere; }
        .chart-backdrop { position:fixed; inset:0; z-index:1000; background:rgba(2,6,18,.58); backdrop-filter:blur(3px); }
        .chart-dialog { --tile-accent:#1f8fff; --tile-glow:transparent; position:fixed; z-index:1001; left:50%; top:50%; width:min(760px,calc(100vw - 28px)); max-height:calc(100vh - 32px); transform:translate(-50%,-50%); overflow:hidden; border-radius:14px; border:1px solid color-mix(in srgb,var(--tile-accent) 34%,rgba(255,255,255,.18)); background:linear-gradient(135deg,rgba(15,24,45,.98),rgba(8,14,28,.98)); box-shadow:0 24px 70px rgba(0,0,0,.62),0 0 26px var(--tile-glow); color:var(--text-main); }
        .chart-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:14px 14px 10px; border-bottom:1px solid rgba(255,255,255,.1); }
        .chart-title { display:grid; gap:3px; min-width:0; }
        .chart-title strong { color:var(--tile-accent); font-size:1rem; line-height:1.2; overflow-wrap:anywhere; }
        .chart-title span { color:var(--text-muted); font-size:.78rem; line-height:1.25; overflow-wrap:anywhere; }
        .chart-actions { display:flex; align-items:center; gap:6px; flex:0 0 auto; }
        .chart-range,.chart-close { min-width:34px; height:32px; border-radius:8px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.08); color:var(--text-main); font:inherit; font-size:.78rem; cursor:pointer; }
        .chart-range.active { background:color-mix(in srgb,var(--tile-accent) 24%,rgba(255,255,255,.08)); border-color:color-mix(in srgb,var(--tile-accent) 56%,rgba(255,255,255,.16)); color:#fff; }
        .chart-close { font-size:1.2rem; line-height:1; }
        .chart-body { padding:12px 14px 14px; min-height:260px; display:grid; place-items:center; }
        .chart-message { min-height:220px; display:grid; place-items:center; color:var(--text-muted); text-align:center; font-size:.92rem; }
        .chart-message.is-error { color:#fca5a5; }
        .chart-svg { display:block; width:100%; height:auto; min-height:220px; overflow:visible; }
        .chart-gridline { stroke:rgba(255,255,255,.18); stroke-width:1; }
        .chart-gridline.soft { stroke:rgba(255,255,255,.08); }
        .chart-zero { stroke:rgba(255,255,255,.28); stroke-dasharray:4 5; stroke-width:1; }
        .chart-line { fill:none; stroke:var(--tile-accent); stroke-width:3; stroke-linecap:round; stroke-linejoin:round; filter:drop-shadow(0 0 8px var(--tile-glow)); }
        .chart-dot { fill:var(--tile-accent); stroke:#fff; stroke-width:2; }
        .chart-label,.chart-current { fill:var(--text-muted); font-size:12px; }
        .chart-current { fill:var(--tile-accent); text-anchor:end; font-weight:700; }
        .chart-label.end { text-anchor:end; }
        @media (max-width:700px){ .hide-mobile{display:none!important;} .header{grid-template-columns:minmax(0,1fr);align-items:stretch;} .badge,.house-select,.energy-range-select,.view-mode-toggle{width:100%;max-width:none;} .metric{width:clamp(68px,18%,96px);padding:5px 7px;} .metric .label{font-size:.62rem;} .metric .value{font-size:.76rem;} .grid{grid-template-columns:repeat(2,minmax(0,1fr));} .tile{grid-column:span var(--tile-mobile-columns);} .advisor-head{display:grid;} .advisor-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}.advisor-items{grid-template-columns:minmax(0,1fr);} .chart-head{display:grid;} .chart-actions{justify-content:end;} }
        @media (min-width:701px){ .hide-desktop{display:none!important;} }
      </style>
      <ha-card>
        ${headerHtml ? `<div class="header">${headerHtml}</div>` : ""}
        ${activeView === "advisor"
          ? advisorHtml
          : `
            <div class="scene"><img class="scene-image" src="${this._escape(state.imageSrc)}" data-fallbacks="${this._escape((state.imageFallbacks || []).join("|"))}" alt="${this._escape(this._houseLabel(state.activeHouse, state.variant))}" />${imageOverlayHtml}${flowHtml}${metricHtml}${statusHtml}</div>
            ${this.config.show_metric_tiles !== false ? `<div class="grid">${gridHtml}</div>` : ""}
          `}
      </ha-card>
      ${this._renderChartOverlay()}
    `;

    this._attachControls();
  }

  _updateReadings() {
    const variant = this._currentVariant || this._layoutState().variant;
    const liveMetrics = [
      ...TILE_METRICS,
      ...this._visibleOverlayMetrics(),
      ...(this._showGridStatusTile() ? [GRID_STATUS_METRIC] : []),
      ...this._customKpiMetrics(),
    ];

    liveMetrics.forEach((metric) => {
      const reading = this._formatReading(metric);
      const label = this._metricLabel(metric, variant);
      this.shadowRoot.querySelectorAll(`[data-label="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== label) element.textContent = label;
      });
      this.shadowRoot.querySelectorAll(`[data-value="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== reading) element.textContent = reading;
      });
      const accent = this._metricAccent(metric);
      this.shadowRoot.querySelectorAll(`[data-accent-key="${metric.key}"]`).forEach((element) => {
        element.style.setProperty("--tile-accent", accent.color);
        element.style.setProperty("--tile-glow", accent.glow);
      });
      const warning = this._metricWarning(metric);
      const tooltip = this._metricTooltip(metric, variant);
      this.shadowRoot.querySelectorAll(`[data-tooltip-key="${metric.key}"]`).forEach((element) => {
        element.classList.toggle("is-warning", Boolean(warning));
        element.dataset.warning = warning?.label || "";
        element.setAttribute("title", tooltip);
        element.setAttribute("aria-label", tooltip);
      });
      const meterPercent = this._meterPercent(metric);
      this.shadowRoot.querySelectorAll(`[data-meter="${metric.key}"]`).forEach((element) => {
        element.setAttribute("title", this._meterTooltip(metric));
      });
      this.shadowRoot.querySelectorAll(`[data-meter="${metric.key}"] span`).forEach((element) => {
        element.style.width = `${(meterPercent ?? 0).toFixed(0)}%`;
      });
      const phaseLabel = this._wallboxPhaseLabel(metric);
      const phaseTitle = phaseLabel ? `${this._t("tooltip.phases", {}, "Phases")}: ${phaseLabel}` : "";
      this.shadowRoot.querySelectorAll(`[data-phase="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== phaseLabel) element.textContent = phaseLabel;
        element.style.display = phaseLabel ? "inline-flex" : "none";
        element.setAttribute("title", phaseTitle);
        element.setAttribute("aria-label", phaseTitle);
      });
      const socLabel = this._wallboxSocLabel(metric);
      const socTitle = socLabel ? `${this._t("tooltip.vehicleSoc", {}, "Vehicle SoC")}: ${socLabel}` : "";
      this.shadowRoot.querySelectorAll(`[data-vehicle-soc="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== socLabel) element.textContent = socLabel;
        element.style.display = socLabel ? "inline-flex" : "none";
        element.setAttribute("title", socTitle);
        element.setAttribute("aria-label", socTitle);
      });
      const remainingTimeLabel = this._wallboxRemainingTimeLabel(metric);
      const remainingTimeTitle = remainingTimeLabel ? `${this._t("tooltip.remainingChargeTime", {}, "Remaining charge time")}: ${remainingTimeLabel}` : "";
      this.shadowRoot.querySelectorAll(`[data-remaining-charge-time="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== remainingTimeLabel) element.textContent = remainingTimeLabel;
        element.style.display = remainingTimeLabel ? "inline-flex" : "none";
        element.setAttribute("title", remainingTimeTitle);
        element.setAttribute("aria-label", remainingTimeTitle);
      });
      if (this._isPvMetric(metric)) {
        PV_LABELS.forEach((label) => {
          const key = this._pvLabelKey(metric, label);
          const text = this._pvLabelText(metric, label);
          this.shadowRoot.querySelectorAll(`[data-pv-label="${key}"]`).forEach((element) => {
            if (element.textContent !== text) element.textContent = text;
            element.style.display = text ? "inline-flex" : "none";
            element.setAttribute("title", text);
            element.setAttribute("aria-label", text);
          });
        });
      }
      if (metric.key === "battery_level") {
        const temperatureLabel = this._batteryTemperatureLabel();
        const temperatureTitle = temperatureLabel ? `${this._t("tooltip.temperature", {}, "Temperature")}: ${temperatureLabel}` : "";
        this.shadowRoot.querySelectorAll("[data-battery-temperature]").forEach((element) => {
          if (element.textContent !== temperatureLabel) element.textContent = temperatureLabel;
          element.style.display = temperatureLabel ? "inline-flex" : "none";
          element.setAttribute("title", temperatureTitle);
          element.setAttribute("aria-label", temperatureTitle);
        });
        const flowInfo = this._batteryFlowInfo();
        const flowValue = this._formatBatteryFlowValue(flowInfo);
        this.shadowRoot.querySelectorAll("[data-battery-flow]").forEach((element) => {
          element.classList.toggle("charge", flowInfo?.direction === "charge");
          element.classList.toggle("discharge", flowInfo?.direction === "discharge");
          element.style.display = flowValue ? "inline-flex" : "none";
          const directionLabel = flowInfo ? this._batteryFlowDirectionLabel(flowInfo.direction) : "";
          element.setAttribute("title", flowValue ? `${directionLabel}: ${flowValue}` : "");
          element.setAttribute("aria-label", flowValue ? `${directionLabel}: ${flowValue}` : "");
        });
        this.shadowRoot.querySelectorAll("[data-battery-flow-label]").forEach((element) => {
          element.textContent = flowInfo ? this._batteryFlowDirectionLabel(flowInfo.direction) : "";
        });
        this.shadowRoot.querySelectorAll(".battery-flow-arrow").forEach((element) => {
          element.textContent = flowInfo?.direction === "charge" ? "↓" : "↑";
        });
        this.shadowRoot.querySelectorAll("[data-battery-flow-value]").forEach((element) => {
          element.textContent = flowValue;
        });
      }
    });
    IMAGE_OVERLAY_KEYS.forEach((key) => {
      const reading = this._formatOverlayReading(key);
      const label = this._overlayLabel(key);
      this.shadowRoot.querySelectorAll(`[data-overlay-label="${key}"]`).forEach((element) => {
        if (element.textContent !== label) element.textContent = label;
      });
      this.shadowRoot.querySelectorAll(`[data-overlay-value="${key}"]`).forEach((element) => {
        if (element.textContent !== reading) element.textContent = reading;
      });
    });
    const nextFlowHtml = this._renderEnergyFlows(variant);
    const flowOverlay = this.shadowRoot.querySelector("[data-flow-overlay]");
    if (flowOverlay && nextFlowHtml && flowOverlay.outerHTML !== nextFlowHtml.trim()) {
      flowOverlay.outerHTML = nextFlowHtml;
    } else if (flowOverlay && !nextFlowHtml) {
      flowOverlay.remove();
    } else if (!flowOverlay && nextFlowHtml) {
      this.shadowRoot.querySelector(".scene-image")?.insertAdjacentHTML("afterend", nextFlowHtml);
    }
    const statusAccent = this._metricAccent(STATUS_METRIC);
    this.shadowRoot.querySelectorAll(`[data-accent-key="${STATUS_METRIC.key}"]`).forEach((element) => {
      element.style.setProperty("--tile-accent", statusAccent.color);
      element.style.setProperty("--tile-glow", statusAccent.glow);
    });
    const statusElement = this.shadowRoot.querySelector("[data-status-label]");
    if (statusElement) {
      const statusLabel = this._statusLabel();
      if (statusElement.textContent !== statusLabel) statusElement.textContent = statusLabel;
    }
    const activeView = this._currentViewMode();
    const nextAdvisorHtml = activeView === "advisor" ? this._renderEnergyAdvisor({ dashboard: true }) : "";
    const advisorElement = this.shadowRoot.querySelector("[data-energy-advisor]");
    if (advisorElement && nextAdvisorHtml) {
      advisorElement.outerHTML = nextAdvisorHtml.trim();
    } else if (advisorElement && !nextAdvisorHtml) {
      advisorElement.remove();
    } else if (!advisorElement && nextAdvisorHtml) {
      this.shadowRoot.querySelector("ha-card")?.insertAdjacentHTML("beforeend", nextAdvisorHtml);
    }
  }

  renderCard() {
    if (!this.config || !this.shadowRoot) return;
    this._renderCardShell(this._layoutState());
  }
}

class HaSolarDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = {
      entities: {},
      units: {},
      positions: {},
      max_power_kw: {},
      labels: {},
      label_visibility: {},
      energy_entities: {},
      image_overlays: {},
      custom_kpis: [],
      ...config,
      image_overlays: {
        smoke: {
          ...(((config || {}).overlays || {}).smoke || {}),
          ...(((config || {}).image_overlays || {}).smoke || {}),
        },
        heatpump: {
          ...(((config || {}).overlays || {}).heatpump || {}),
          ...(((config || {}).image_overlays || {}).heatpump || {}),
        },
      },
      labels: { ...((config || {}).metric_labels || {}), ...((config || {}).labels || {}) },
      label_visibility: { ...((config || {}).label_display || {}), ...((config || {}).label_visibility || {}) },
      energy_entities: { ...((config || {}).energy_counters || {}), ...((config || {}).energy_entities || {}) },
      visible_boxes: { ...((config || {}).boxes || {}), ...((config || {}).visible_boxes || {}) },
      custom_kpis: Array.isArray((config || {}).custom_kpis || (config || {}).kpis)
        ? [...(((config || {}).custom_kpis || (config || {}).kpis))]
        : [],
    };
    delete this._config.show_energy_advisor;
    this._render();
  }

  set hass(hass) {
    const previousLanguage = this._language();
    const hadEntityOptions = this._entityOptions().length > 0;
    this._hass = hass;
    const nextLanguage = this._language();
    const hasEntityOptions = this._entityOptions().length > 0;
    if (!this._rendered || (!hadEntityOptions && hasEntityOptions) || previousLanguage !== nextLanguage) {
      this._render();
    }
  }

  _language() {
    return languageFromHass(this._hass);
  }

  _t(key, replacements = {}, fallback = "") {
    return translate(this._language(), key, replacements, fallback);
  }

  _houseLabel(key, variant = HOUSE_VARIANTS[key]) {
    return this._t(`house.${key}`, {}, variant?.label || key);
  }

  _normalizeHouse(value) {
    return normalizeHouse(value);
  }

  _normalizeViewMode(value) {
    const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "_");
    const aliases = {
      home: "house",
      haus: "house",
      house_view: "house",
      building: "house",
      advisor_dashboard: "advisor",
      advisor_view: "advisor",
      adviser: "advisor",
      adviser_dashboard: "advisor",
      energy_advisor: "advisor",
    };
    const key = aliases[normalized] || normalized;
    return VIEW_MODE_OPTIONS.some((option) => option.key === key) ? key : undefined;
  }

  _onInput(path, value, isCheckbox = false) {
    const next = this._cloneConfig(this._config || {});
    delete next.show_energy_advisor;
    const parts = path.split(".");
    const lastPart = parts[parts.length - 1];
    const numericFields = new Set(["hud_box_opacity", "hud_box_scale", "power_decimals", "advisor_max_suggestions"]);
    const numericProps = new Set(["left", "top", "width", "position", "columns"]);
    const shouldBeNumeric = numericFields.has(path) || numericProps.has(lastPart) || parts[0] === "max_power_kw";
    const nextValue = isCheckbox ? Boolean(value) : shouldBeNumeric ? Number(value) : value;
    this._setPath(next, parts, nextValue);
    this._config = next;
    this._dispatchConfig(next);
    if (path === "house") this._render();
  }

  _setPath(target, parts, value) {
    let cursor = target;
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const nextPart = parts[index + 1];
      const key = Array.isArray(cursor) ? Number(part) : part;
      if (isLast) {
        cursor[key] = value;
        return;
      }
      if (cursor[key] === undefined || cursor[key] === null || typeof cursor[key] !== "object") {
        cursor[key] = Number.isInteger(Number(nextPart)) ? [] : {};
      }
      cursor = cursor[key];
    });
  }

  _dispatchConfig(config = this._config) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config },
      }),
    );
  }

  _addCustomKpi() {
    const next = this._cloneConfig(this._config || {});
    next.custom_kpis = Array.isArray(next.custom_kpis) ? next.custom_kpis : [];
    next.custom_kpis.push({
      id: `kpi_${Date.now()}`,
      label: "New KPI",
      entity: "",
      value: "",
      unit: "auto",
      position: 100 + next.custom_kpis.length,
      columns: 1,
      color: "#1f8fff",
    });
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _removeCustomKpi(index) {
    const next = this._cloneConfig(this._config || {});
    next.custom_kpis = Array.isArray(next.custom_kpis) ? next.custom_kpis : [];
    next.custom_kpis.splice(index, 1);
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _cloneConfig(config) {
    return JSON.parse(JSON.stringify(config));
  }

  _entityOptions() {
    return Object.keys(this._hass?.states || {}).sort();
  }

  _entityCatalog() {
    return Object.entries(this._hass?.states || {}).map(([entityId, stateObj]) => {
      const attributes = stateObj?.attributes || {};
      const domain = entityId.split(".")[0] || "";
      const name = attributes.friendly_name || attributes.name || entityId;
      const unit = attributes.unit_of_measurement || "";
      const deviceClass = attributes.device_class || "";
      const stateClass = attributes.state_class || "";
      const haystack = this._normalizeSearchText([
        entityId,
        name,
        unit,
        deviceClass,
        stateClass,
        attributes.integration,
        attributes.manufacturer,
        attributes.model,
      ].filter(Boolean).join(" "));
      return { entityId, stateObj, attributes, domain, name, unit, deviceClass, stateClass, haystack };
    });
  }

  _normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9%°]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  _searchMatches(haystack, term) {
    const normalized = this._normalizeSearchText(term);
    if (!normalized) return false;
    return haystack.includes(normalized);
  }

  _pathValue(target, path) {
    return path.split(".").reduce((cursor, part) => {
      if (cursor === undefined || cursor === null) return undefined;
      return cursor[part];
    }, target);
  }

  _isPlaceholderEntity(path, value) {
    const placeholders = {
      "entities.pv_roof_power": "sensor.pv_roof_power",
      "entities.pv_shed_power": "sensor.pv_shed_power",
      "entities.battery_level": "sensor.battery_level",
      "entities.inverter_power": "sensor.wechselrichter_power",
      "entities.wallbox_power": "sensor.wallbox_power",
      "entities.pv_total_power": "sensor.pv_total_power",
      "entities.import_export_power": "sensor.grid_power",
    };
    return placeholders[path] && String(value || "").trim() === placeholders[path];
  }

  _entityLabelForPath(path) {
    const key = path.split(".").pop();
    const metric = TILE_METRICS.find((item) => item.key === key);
    if (metric) return this._metricLabel(metric);
    const labels = {
      weather_entity: this._t("editor.weatherEntity", {}, "Weather Entity"),
      battery_flow_power: this._t("editor.batteryFlowEntity", {}, "Battery flow entity (+/-)"),
      battery_charge_power: this._t("editor.batteryChargeEntity", {}, "Battery charge entity"),
      battery_discharge_power: this._t("editor.batteryDischargeEntity", {}, "Battery discharge entity"),
      battery_temperature: this._t("editor.batteryTemperatureEntity", {}, "Battery temperature entity"),
      import_power: this._t("editor.importPowerEntity", {}, "Import entity"),
      export_power: this._t("editor.exportPowerEntity", {}, "Export entity"),
      wallbox_phase: this._t("editor.phaseEntity", {}, "Phase entity"),
      wallbox_soc: this._t("editor.vehicleSocEntity", {}, "Vehicle SoC entity"),
      wallbox_remaining_time: this._t("editor.remainingChargeTimeEntity", {}, "Remaining charge time entity"),
      wallbox2_phase: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.phaseEntity", {}, "Phase entity")}`,
      wallbox2_soc: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.vehicleSocEntity", {}, "Vehicle SoC entity")}`,
      wallbox2_remaining_time: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.remainingChargeTimeEntity", {}, "Remaining charge time entity")}`,
    };
    if (labels[key]) return labels[key];
    const energyMatch = path.match(/^energy_entities\.([^.]+)\.entity$/);
    if (energyMatch) {
      const energyMetric = TILE_METRICS.find((item) => item.key === energyMatch[1]);
      return `${this._metricLabel(energyMetric || { key: energyMatch[1], label: energyMatch[1] })} ${this._t("editor.energyCounterEntity", {}, "kWh counter entity")}`;
    }
    return key || path;
  }

  _autoDetectTargets() {
    const powerTarget = {
      domains: ["sensor"],
      deviceClasses: ["power"],
      units: ["w", "kw"],
      include: [{ terms: ["power", "leistung"], weight: 14 }],
    };
    const energyTarget = {
      domains: ["sensor"],
      deviceClasses: ["energy"],
      units: ["wh", "kwh", "mwh"],
      include: [{ terms: ["energy", "energie", "kwh", "yield", "ertrag", "total", "gesamt"], weight: 16 }],
    };
    const pvTerms = { terms: ["pv", "solar", "photovoltaic", "photovoltaik"], weight: 36 };
    const gridTerms = { terms: ["grid", "netz", "meter", "utility", "power meter", "smart meter"], weight: 28 };
    const wallboxTerms = { terms: ["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], weight: 34 };
    const batteryTerms = { terms: ["battery", "batterie", "speicher", "akku"], weight: 34 };

    return [
      { path: "weather_entity", domains: ["weather"], include: [{ terms: ["weather", "wetter", "home", "haus"], weight: 14 }], threshold: 35 },
      { path: "entities.pv_roof_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["roof", "dach", "rooftop"]], include: [pvTerms, { terms: ["roof", "dach", "rooftop"], weight: 24 }, ...powerTarget.include], exclude: ["shed", "garage", "carport", "schuppen", "total", "gesamt", "forecast", "prognose"], threshold: 60 },
      { path: "entities.pv_shed_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["shed", "garage", "carport", "schuppen", "balkon", "balcony"]], include: [pvTerms, { terms: ["shed", "garage", "carport", "schuppen", "balkon", "balcony"], weight: 28 }, ...powerTarget.include], exclude: ["roof", "dach", "total", "gesamt", "forecast", "prognose"], threshold: 62 },
      { path: "entities.pv_total_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["total", "gesamt", "sum", "summe", "all", "anlage"]], block: ["forecast", "prognose", "today", "heute", "daily"], include: [pvTerms, { terms: ["total", "gesamt", "sum", "summe", "all", "anlage"], weight: 28 }, ...powerTarget.include], exclude: ["forecast", "prognose", "today", "heute", "daily"], threshold: 60 },
      { path: "entities.pv_roof_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"]], include: [pvTerms, ...powerTarget.include], exclude: ["shed", "garage", "carport", "schuppen", "total", "gesamt", "forecast", "prognose", "today", "heute", "daily"], threshold: 70 },
      { path: "entities.pv_total_power_today_energy", ...energyTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["today", "heute", "daily", "day", "tag"]], include: [pvTerms, { terms: ["today", "heute", "daily", "day", "tag"], weight: 30 }, ...energyTarget.include], exclude: ["forecast", "prognose"], threshold: 62 },
      { path: "energy_entities.pv_total_power.entity", ...energyTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"]], block: ["power", "leistung", "today", "heute", "daily", "day", "tag", "forecast", "prognose"], include: [pvTerms, { terms: ["total", "gesamt", "lifetime", "counter", "zaehler"], weight: 22 }, ...energyTarget.include], exclude: ["today", "heute", "daily", "forecast", "prognose"], threshold: 58 },
      { path: "entities.battery_level", domains: ["sensor"], deviceClasses: ["battery"], units: ["%"], required: [["battery", "batterie", "speicher", "akku"], ["soc", "level", "stand", "charge", "ladestand"]], include: [batteryTerms, { terms: ["soc", "level", "stand", "charge", "ladestand"], weight: 34 }], exclude: ["power", "leistung", "temp", "temperature", "temperatur", "flow", "fluss"], threshold: 58 },
      { path: "entities.battery_flow_power", ...powerTarget, required: [["battery", "batterie", "speicher", "akku"]], include: [batteryTerms, { terms: ["power", "leistung", "flow", "fluss", "charge discharge", "laden entladen"], weight: 26 }], exclude: ["soc", "level", "stand", "temperature", "temperatur", "temp"], threshold: 58 },
      { path: "entities.battery_charge_power", ...powerTarget, required: [["battery", "batterie", "speicher", "akku"], ["charge", "charging", "laden", "ladeleistung"]], include: [batteryTerms, { terms: ["charge", "charging", "laden", "ladeleistung"], weight: 30 }], exclude: ["discharge", "entladen", "entlade", "soc", "temperature", "temperatur"], threshold: 62 },
      { path: "entities.battery_discharge_power", ...powerTarget, required: [["battery", "batterie", "speicher", "akku"], ["discharge", "discharging", "entladen", "entladeleistung"]], include: [batteryTerms, { terms: ["discharge", "discharging", "entladen", "entladeleistung"], weight: 30 }], exclude: ["charge", "charging", "laden", "ladeleistung", "soc", "temperature", "temperatur"], threshold: 62 },
      { path: "entities.battery_temperature", domains: ["sensor"], deviceClasses: ["temperature"], units: ["°c", "c"], required: [["battery", "batterie", "speicher", "akku"], ["temperature", "temperatur", "temp"]], include: [batteryTerms, { terms: ["temperature", "temperatur", "temp"], weight: 30 }], exclude: ["power", "leistung", "soc"], threshold: 58 },
      { path: "entities.inverter_power", ...powerTarget, required: [["inverter", "wechselrichter", "wr"]], include: [{ terms: ["inverter", "wechselrichter", "wr"], weight: 38 }, ...powerTarget.include], exclude: ["battery", "batterie", "soc", "temperature"], threshold: 56 },
      { path: "entities.wallbox_power", ...powerTarget, required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"]], include: [wallboxTerms, ...powerTarget.include], exclude: ["2", "second", "zweite", "two", "phase", "phasen", "soc", "remaining", "time", "zeit", "energy", "kwh"], threshold: 56 },
      { path: "entities.wallbox_phase", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["phase", "phases", "phasen"]], include: [wallboxTerms, { terms: ["phase", "phases", "phasen"], weight: 34 }], exclude: ["power", "leistung", "energy", "kwh"], threshold: 58 },
      { path: "entities.wallbox_soc", domains: ["sensor"], units: ["%"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"]], include: [wallboxTerms, { terms: ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"], weight: 30 }], exclude: ["power", "leistung", "phase", "phasen"], threshold: 58 },
      { path: "entities.wallbox_remaining_time", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"]], include: [wallboxTerms, { terms: ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"], weight: 30 }], exclude: ["power", "leistung", "phase", "soc"], threshold: 58 },
      { path: "entities.wallbox2_power", ...powerTarget, required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 22 }, ...powerTarget.include], exclude: ["phase", "phasen", "soc", "remaining", "time", "zeit", "energy", "kwh"], threshold: 62 },
      { path: "entities.wallbox2_phase", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["phase", "phases", "phasen"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["phase", "phases", "phasen"], weight: 34 }], exclude: ["power", "leistung", "energy", "kwh"], threshold: 64 },
      { path: "entities.wallbox2_soc", domains: ["sensor"], units: ["%"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"], weight: 30 }], exclude: ["power", "leistung", "phase", "phasen"], threshold: 64 },
      { path: "entities.wallbox2_remaining_time", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"], weight: 30 }], exclude: ["power", "leistung", "phase", "soc"], threshold: 64 },
      { path: "entities.import_export_power", ...powerTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"], ["import export", "bezug einspeisung", "net", "saldo", "balance", "signed"]], include: [gridTerms, { terms: ["import export", "bezug einspeisung", "net", "saldo", "balance", "signed"], weight: 28 }, ...powerTarget.include], exclude: ["energy", "kwh", "total"], threshold: 58 },
      { path: "entities.import_power", ...powerTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"], ["import", "bezug", "purchase", "verbrauch netz", "from grid"]], include: [gridTerms, { terms: ["import", "bezug", "purchase", "verbrauch netz", "from grid"], weight: 32 }], exclude: ["export", "einspeis", "feed", "energy", "kwh"], threshold: 62 },
      { path: "entities.export_power", ...powerTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"], ["export", "einspeis", "feed", "feedin", "to grid"]], include: [gridTerms, { terms: ["export", "einspeis", "feed", "feedin", "to grid"], weight: 32 }], exclude: ["import", "bezug", "purchase", "energy", "kwh"], threshold: 62 },
      { path: "entities.house_consumption_power", ...powerTarget, required: [["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"]], include: [{ terms: ["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"], weight: 34 }, ...powerTarget.include], exclude: ["grid", "netz", "battery", "batterie", "pv", "solar", "wallbox"], threshold: 56 },
      { path: "energy_entities.house_consumption_power.entity", ...energyTarget, required: [["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"]], block: ["power", "leistung"], include: [{ terms: ["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"], weight: 32 }, ...energyTarget.include], exclude: ["grid", "netz", "battery", "batterie", "pv", "solar", "wallbox"], threshold: 58 },
    ];
  }

  _scoreEntityForTarget(entity, target) {
    if (target.required?.some((terms) => !(terms || []).some((term) => this._searchMatches(entity.haystack, term)))) {
      return 0;
    }
    if (target.block?.some((term) => this._searchMatches(entity.haystack, term))) return 0;
    let score = 0;
    if (target.domains?.includes(entity.domain)) score += 24;
    else if (target.domains?.length) score -= 18;

    const deviceClass = this._normalizeSearchText(entity.deviceClass);
    if (target.deviceClasses?.some((item) => this._normalizeSearchText(item) === deviceClass)) score += 28;
    else if (target.deviceClasses?.length && deviceClass) score -= 10;

    const unit = this._normalizeSearchText(entity.unit);
    if (target.units?.some((item) => unit === this._normalizeSearchText(item))) score += 22;
    else if (target.units?.length && unit) score -= 5;

    (target.include || []).forEach((group) => {
      const terms = Array.isArray(group) ? group : group.terms;
      const weight = Array.isArray(group) ? 16 : group.weight || 16;
      if ((terms || []).some((term) => this._searchMatches(entity.haystack, term))) score += weight;
    });
    (target.exclude || []).forEach((term) => {
      if (this._searchMatches(entity.haystack, term)) score -= 40;
    });

    if (entity.stateObj?.state && !["unknown", "unavailable", "none"].includes(String(entity.stateObj.state).toLowerCase())) score += 6;
    return Math.max(0, Math.min(100, score));
  }

  _autoDetectSuggestions() {
    const catalog = this._entityCatalog();
    if (catalog.length === 0) return [];
    const usedEntityIds = new Set();
    const usedPaths = new Set();
    return this._autoDetectTargets().map((target) => {
      if (usedPaths.has(target.path)) return null;
      const candidates = catalog
        .filter((entity) => !usedEntityIds.has(entity.entityId) || target.path.includes("energy_entities"))
        .map((entity) => ({ entity, score: this._scoreEntityForTarget(entity, target) }))
        .filter((candidate) => candidate.score >= (target.threshold || 50))
        .sort((a, b) => b.score - a.score || a.entity.entityId.localeCompare(b.entity.entityId));
      const best = candidates[0];
      if (!best) return null;
      if (!target.path.includes("energy_entities")) usedEntityIds.add(best.entity.entityId);
      const current = this._pathValue(this._config || {}, target.path) || "";
      usedPaths.add(target.path);
      return {
        path: target.path,
        label: this._entityLabelForPath(target.path),
        entityId: best.entity.entityId,
        score: best.score,
        current,
        name: best.entity.name,
      };
    }).filter(Boolean);
  }

  _applyAutoDetection(mode = "fill", onePath = "") {
    const suggestions = this._autoDetectSuggestions().filter((suggestion) => !onePath || suggestion.path === onePath);
    const next = this._cloneConfig(this._config || {});
    let changed = 0;
    suggestions.forEach((suggestion) => {
      const current = this._pathValue(next, suggestion.path);
      const hasCurrent = current !== undefined && current !== null && String(current).trim() !== "";
      if (mode === "fill" && hasCurrent && !this._isPlaceholderEntity(suggestion.path, current) && !onePath) return;
      if (onePath && hasCurrent && String(current) === suggestion.entityId) return;
      this._setPath(next, suggestion.path.split("."), suggestion.entityId);
      if (suggestion.path === "entities.wallbox2_power") this._setPath(next, ["visible_boxes", "wallbox2_power"], true);
      if (suggestion.path === "entities.import_export_power" || suggestion.path === "entities.import_power" || suggestion.path === "entities.export_power") {
        this._setPath(next, ["visible_boxes", "import_export_power"], true);
        next.show_grid_status_tile = true;
      }
      changed += 1;
    });
    this._config = next;
    this._wizardMessage = changed > 0
      ? this._t("editor.setupApplied", { count: changed }, `Applied ${changed} suggestion(s).`)
      : this._t("editor.setupApplyNone", {}, "No empty fields were changed.");
    if (changed > 0) this._dispatchConfig(next);
    this._render();
  }

  _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  _renderEntityInput(metric) {
    if (metric.key === "import_export_power") {
      return `
        <label>${this._escape(this._t("editor.importExportSignedEntity", {}, "Signed import/export entity (+/-)"))}
          <input data-path="entities.import_export_power" list="ha-solar-dashboard-entities" placeholder="sensor.grid_power" value="${this._escape(this._config?.entities?.import_export_power || "")}" autocomplete="off" />
        </label>
        <label>${this._escape(this._t("editor.importPowerEntity", {}, "Import entity"))}
          <input data-path="entities.import_power" list="ha-solar-dashboard-entities" placeholder="sensor.grid_import_power" value="${this._escape(this._config?.entities?.import_power || "")}" autocomplete="off" />
        </label>
        <label>${this._escape(this._t("editor.exportPowerEntity", {}, "Export entity"))}
          <input data-path="entities.export_power" list="ha-solar-dashboard-entities" placeholder="sensor.grid_export_power" value="${this._escape(this._config?.entities?.export_power || "")}" autocomplete="off" />
        </label>
      `;
    }
    const selected = this._config?.entities?.[metric.key] || "";
    const label = this._metricLabel(metric);
    const fieldLabel = metric.unit === "power" ? this._t("editor.liveEntity") : this._t("editor.entity");
    return `
      <label>${this._escape(fieldLabel)}
        <input data-path="entities.${metric.key}" list="ha-solar-dashboard-entities" placeholder="${this._escape(this._t("editor.entityPlaceholder", { label }))}" value="${this._escape(selected)}" autocomplete="off" />
      </label>
    `;
  }

  _defaultMetricLabel(metric) {
    const variant = this._houseVariant();
    if (variant.labelKeys?.[metric.key]) return this._t(variant.labelKeys[metric.key], {}, variant.labels?.[metric.key] || metric.label);
    if (variant.labels?.[metric.key]) return this._t(`metrics.${metric.key}`, {}, variant.labels[metric.key]);
    return this._t(`metrics.${metric.key}`, {}, metric.label);
  }

  _renderLabelInput(metric) {
    const value = this._config.labels?.[metric.key] || "";
    return `
      <label>${this._escape(this._t("editor.overlayLabel"))}
        <input data-path="labels.${metric.key}" placeholder="${this._escape(this._defaultMetricLabel(metric))}" value="${this._escape(value)}" />
      </label>
    `;
  }

  _renderImportExportLabelInputs(metric) {
    if (metric.key !== "import_export_power") return "";
    const labelFields = [
      ["import_export_import", "editor.importLabel", this._t("status.import", {}, "Import")],
      ["import_export_export", "editor.exportLabel", this._t("status.export", {}, "Export")],
      ["import_export_neutral", "editor.neutralLabel", this._t("status.selfSufficient", {}, "Self-sufficient")],
    ].map(([key, labelKey, placeholder]) => {
      const value = this._config.labels?.[key] || "";
      return `
        <label>${this._escape(this._t(labelKey, {}, placeholder))}
          <input data-path="labels.${key}" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" />
        </label>
      `;
    }).join("");
    return `
      <details class="pv-labels">
        <summary>${this._escape(this._t("editor.importExportLabels", {}, "Import/Export labels"))}</summary>
        <div class="details-grid">${labelFields}</div>
      </details>
    `;
  }

  _labelVisibility(key) {
    const configured = this._config.label_visibility?.[key] || {};
    return {
      image: configured.image !== false,
      footer: configured.footer !== false && configured.kpi !== false,
      hideMobile: configured.hide_mobile === true || configured.mobile === false,
      hideDesktop: configured.hide_desktop === true || configured.desktop === false,
    };
  }

  _renderLabelVisibilityOptions(key) {
    const visibility = this._labelVisibility(key);
    const isOpen = this._openLabelOptions?.has(key);
    return `
      <details class="label-options" data-label-options="${this._escape(key)}"${isOpen ? " open" : ""}>
        <summary>${this._escape(this._t("editor.labelOptions", {}, "Label display"))}</summary>
        <div class="checkbox-grid">
          <label class="inline"><input type="checkbox" data-path="label_visibility.${key}.image" ${visibility.image ? "checked" : ""}/> ${this._escape(this._t("editor.labelShowImage", {}, "Show label in image"))}</label>
          <label class="inline"><input type="checkbox" data-path="label_visibility.${key}.footer" ${visibility.footer ? "checked" : ""}/> ${this._escape(this._t("editor.labelShowFooter", {}, "Show label in footer KPIs"))}</label>
          <label class="inline"><input type="checkbox" data-path="label_visibility.${key}.hide_mobile" ${visibility.hideMobile ? "checked" : ""}/> ${this._escape(this._t("editor.labelHideMobile", {}, "Hide on phones"))}</label>
          <label class="inline"><input type="checkbox" data-path="label_visibility.${key}.hide_desktop" ${visibility.hideDesktop ? "checked" : ""}/> ${this._escape(this._t("editor.labelHideDesktop", {}, "Hide on desktop"))}</label>
        </div>
      </details>
    `;
  }

  _energyEntityConfig(metric) {
    const config = this._config.energy_entities?.[metric.key];
    if (!config) return {};
    if (typeof config === "string") return { entity: config };
    return typeof config === "object" ? config : {};
  }

  _renderEnergyEntityInputs(metric) {
    if (metric.unit !== "power") return "";
    const config = this._energyEntityConfig(metric);
    const counterValue = config.entity || config.counter || config.kwh_entity || config.kwh || config.meter || "";

    return `
      <label>${this._escape(this._t("editor.energyCounterEntity"))}
        <input data-path="energy_entities.${metric.key}.entity" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(metric.key)}_energy_total" value="${this._escape(counterValue)}" autocomplete="off" />
      </label>
    `;
  }

  _isPvMetric(metric) {
    return ["pv_roof_power", "pv_shed_power", "pv_total_power"].includes(metric?.key);
  }

  _pvLabelKey(metric, label) {
    return `${metric.key}_${label.suffix}`;
  }

  _renderPvLabelInputs(metric) {
    if (!this._isPvMetric(metric)) return "";
    const fieldHtml = PV_LABELS.map((label) => {
      const key = this._pvLabelKey(metric, label);
      if (label.source === "metric") {
        return `
          <div class="label-entity-block">
            <div class="label-entity-title">${this._escape(this._t(label.editorKey, {}, "Power label"))}</div>
            ${this._renderLabelVisibilityOptions(key)}
          </div>
        `;
      }
      const value = this._config.entities?.[key] || "";
      return `
        <label>${this._escape(this._t(label.editorKey, {}, label.suffix))}
          <input data-path="entities.${key}" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(key)}" value="${this._escape(value)}" autocomplete="off" />
        </label>
        ${this._renderLabelVisibilityOptions(key)}
      `;
    }).join("");
    return `
      <details class="pv-labels" open>
        <summary>${this._escape(this._t("editor.pvLabels", {}, "PV labels"))}</summary>
        <div class="details-grid">${fieldHtml}</div>
      </details>
    `;
  }

  _wallboxPhaseEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_phase";
    if (metric?.key === "wallbox2_power") return "wallbox2_phase";
    return "";
  }

  _renderWallboxPhaseInput(metric) {
    const entityKey = this._wallboxPhaseEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "sensor.wallbox_2_phases"
      : "sensor.wallbox_phases";
    return `
      <label>${this._escape(this._t("editor.phaseEntity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions(entityKey)}
    `;
  }

  _wallboxSocEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_soc";
    if (metric?.key === "wallbox2_power") return "wallbox2_soc";
    return "";
  }

  _renderWallboxSocInput(metric) {
    const entityKey = this._wallboxSocEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "sensor.wallbox_2_vehicle_soc"
      : "sensor.wallbox_vehicle_soc";
    return `
      <label>${this._escape(this._t("editor.vehicleSocEntity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions(entityKey)}
    `;
  }

  _wallboxRemainingTimeEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_remaining_time";
    if (metric?.key === "wallbox2_power") return "wallbox2_remaining_time";
    return "";
  }

  _renderWallboxRemainingTimeInput(metric) {
    const entityKey = this._wallboxRemainingTimeEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "sensor.wallbox_2_remaining_time"
      : "sensor.wallbox_remaining_time";
    return `
      <label>${this._escape(this._t("editor.remainingChargeTimeEntity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions(entityKey)}
    `;
  }

  _unitValue(metric) {
    const metricUnit = this._config?.units?.[metric.key];
    if (metricUnit !== undefined && String(metricUnit).trim() !== "") return String(metricUnit);
    if (metric.unit === "power") return String(this._config?.units?.power || "auto");
    return String(this._config?.units?.[metric.unit] || "");
  }

  _renderUnitSelect(metric) {
    const selected = this._unitValue(metric);
    const baseOptions = metric.unit === "power"
      ? [
        ["auto", this._t("editor.auto")],
        ["W", "W"],
        ["kW", "kW"],
        ["kWh", "kWh"],
      ]
      : [["%", "%"]];
    const hasSelected = baseOptions.some(([value]) => value.toLowerCase() === selected.toLowerCase());
    const options = [
      ...(hasSelected || !selected ? [] : [[selected, selected]]),
      ...baseOptions,
    ].map(([value, label]) => {
      const isSelected = value.toLowerCase() === selected.toLowerCase();
      return `<option value="${this._escape(value)}"${isSelected ? " selected" : ""}>${this._escape(label)}</option>`;
    }).join("");

    return `
      <label>${this._escape(this._t("editor.unit"))}
        <select data-path="units.${metric.key}">
          ${options}
        </select>
      </label>
    `;
  }

  _maxPowerKwValue(metric) {
    const value = this._config?.max_power_kw?.[metric.key];
    if (value !== undefined && value !== null && value !== "") return value;
    return "";
  }

  _renderMaxPowerInput(metric) {
    if (metric.unit !== "power") return "";
    const value = this._maxPowerKwValue(metric);
    return `
      <label>${this._escape(this._t("editor.maxPowerKw"))}
        <input type="number" min="0" step="0.1" data-path="max_power_kw.${metric.key}" placeholder="11" value="${this._escape(value)}" />
      </label>
    `;
  }

  _renderBatteryFlowInputs(metric) {
    if (metric.key !== "battery_level") return "";
    return `
      <label>${this._escape(this._t("editor.batteryFlowEntity"))}
        <input data-path="entities.battery_flow_power" list="ha-solar-dashboard-entities" placeholder="sensor.battery_power" value="${this._escape(this._config.entities?.battery_flow_power || "")}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions("battery_flow_power")}
      <label>${this._escape(this._t("editor.batteryChargeEntity"))}
        <input data-path="entities.battery_charge_power" list="ha-solar-dashboard-entities" placeholder="sensor.battery_charge_power" value="${this._escape(this._config.entities?.battery_charge_power || "")}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.batteryDischargeEntity"))}
        <input data-path="entities.battery_discharge_power" list="ha-solar-dashboard-entities" placeholder="sensor.battery_discharge_power" value="${this._escape(this._config.entities?.battery_discharge_power || "")}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.batteryTemperatureEntity"))}
        <input data-path="entities.battery_temperature" list="ha-solar-dashboard-entities" placeholder="sensor.battery_temperature" value="${this._escape(this._config.entities?.battery_temperature || "")}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions("battery_temperature")}
    `;
  }

  _houseVariant() {
    const house = this._normalizeHouse(this._config.house) || "single_family_home";
    return HOUSE_VARIANTS[house] || HOUSE_VARIANTS.single_family_home;
  }

  _metricVisible(metric) {
    const configured = this._config.visible_boxes?.[metric.key];
    if (configured !== undefined) return configured !== false;
    if (metric.optional && !this._config.entities?.[metric.key]) return false;
    return this._houseVariant().visible_boxes?.[metric.key] !== false;
  }

  _metricLabel(metric) {
    if (metric.overlay) return this._overlayLabel(metric.overlay);
    const customLabel = this._config.labels?.[metric.key];
    if (customLabel !== undefined && String(customLabel).trim() !== "") return String(customLabel).trim();
    return this._defaultMetricLabel(metric);
  }

  _metricPosition(metric) {
    const variant = this._houseVariant();
    if (metric.key === "wallbox2_power") {
      const configured = this._config.positions?.wallbox2_power || {};
      const base = {
        ...(variant.positions.wallbox_power || {}),
        ...(this._config.positions?.wallbox_power || {}),
      };
      return configured.left !== undefined || configured.top !== undefined
        ? { ...adjacentWallboxPosition(base), ...configured }
        : adjacentWallboxPosition(base);
    }
    return {
      ...(variant.positions[metric.key] || {}),
      ...(this._config.positions?.[metric.key] || {}),
    };
  }

  _renderBoxField(metric) {
    const position = this._metricPosition(metric);
    const left = Number.isFinite(Number(position.left)) ? Number(position.left) : 50;
    const top = Number.isFinite(Number(position.top)) ? Number(position.top) : 50;
    const visible = this._metricVisible(metric);

    return `
      <div class="box-field">
        <label class="inline"><input type="checkbox" data-path="visible_boxes.${metric.key}" ${visible ? "checked" : ""}/> ${this._escape(this._t("editor.showBox", { label: this._metricLabel(metric) }))}</label>
        ${this._renderLabelInput(metric)}
        ${this._renderImportExportLabelInputs(metric)}
        ${this._renderEntityInput(metric)}
        ${this._renderPvLabelInputs(metric)}
        ${this._renderEnergyEntityInputs(metric)}
        ${this._renderWallboxPhaseInput(metric)}
        ${this._renderWallboxSocInput(metric)}
        ${this._renderWallboxRemainingTimeInput(metric)}
        ${this._renderUnitSelect(metric)}
        ${this._renderBatteryFlowInputs(metric)}
        ${this._renderMaxPowerInput(metric)}
        <label>${this._escape(this._t("editor.xPosition"))} (${this._escape(left)})
          <input type="range" min="4" max="96" step="1" data-path="positions.${metric.key}.left" value="${this._escape(left)}" />
        </label>
        <label>${this._escape(this._t("editor.yPosition"))} (${this._escape(top)})
          <input type="range" min="4" max="96" step="1" data-path="positions.${metric.key}.top" value="${this._escape(top)}" />
        </label>
      </div>
    `;
  }

  _overlayDefault(key) {
    const house = this._normalizeHouse(this._config.house) || "single_family_home";
    return DEFAULT_IMAGE_OVERLAYS[house]?.[key]
      || DEFAULT_IMAGE_OVERLAYS.single_family_home[key]
      || {};
  }

  _overlayConfig(key) {
    return {
      ...this._overlayDefault(key),
      ...(this._config.image_overlays?.[key] || {}),
    };
  }

  _overlayLabel(key) {
    const customLabel = this._config.image_overlays?.[key]?.label;
    if (customLabel !== undefined && String(customLabel).trim() !== "") return String(customLabel).trim();
    return this._t(`overlay.${key}`, {}, key);
  }

  _overlayPeriodValue(key = "smoke") {
    const config = this._overlayConfig(key);
    const raw = config.period_minutes ?? config.minutes ?? config.period ?? "1h";
    const normalized = String(raw).trim().toLowerCase();
    if (normalized === "30m" || normalized === "30min" || normalized === "30") return "30m";
    if (normalized === "24h" || normalized === "24") return "24h";
    return "1h";
  }

  _renderOverlayField(key) {
    const config = this._overlayConfig(key);
    const label = this._overlayLabel(key);
    const defaultLabel = this._t(`overlay.${key}`, {}, key);
    const enabled = config.enabled === true;
    const left = Number.isFinite(Number(config.left)) ? Number(config.left) : 50;
    const top = Number.isFinite(Number(config.top)) ? Number(config.top) : 50;
    const width = Number.isFinite(Number(config.width ?? config.size)) ? Number(config.width ?? config.size) : 12;
    const orientation = String(config.orientation || "right").toLowerCase() === "left" ? "left" : "right";
    const orientationHtml = key === "heatpump"
      ? `
        <label>${this._escape(this._t("editor.overlayOrientation"))}
          <select data-path="image_overlays.${key}.orientation">
            <option value="right"${orientation === "right" ? " selected" : ""}>${this._escape(this._t("editor.overlayOrientationRight"))}</option>
            <option value="left"${orientation === "left" ? " selected" : ""}>${this._escape(this._t("editor.overlayOrientationLeft"))}</option>
          </select>
        </label>
      `
      : "";
    const entity = this._config.image_overlays?.[key]?.entity || "";
    const entityHtml = `
      <label>${this._escape(this._t("editor.entity"))}
        <input data-path="image_overlays.${key}.entity" list="ha-solar-dashboard-entities" placeholder="${key === "smoke" ? "sensor.zaehlerstand_2" : "sensor.heatpump_power"}" value="${this._escape(entity)}" autocomplete="off" />
      </label>
    `;
    const period = this._overlayPeriodValue(key);
    const periodHtml = key === "smoke"
      ? `
        <label>${this._escape(this._t("editor.overlayPeriod"))}
          <select data-path="image_overlays.${key}.period">
            <option value="30m"${period === "30m" ? " selected" : ""}>${this._escape(this._t("editor.period30m"))}</option>
            <option value="1h"${period === "1h" ? " selected" : ""}>${this._escape(this._t("editor.period1h"))}</option>
            <option value="24h"${period === "24h" ? " selected" : ""}>${this._escape(this._t("editor.period24h"))}</option>
          </select>
        </label>
      `
      : "";

    return `
      <div class="box-field">
        <label class="inline"><input type="checkbox" data-path="image_overlays.${key}.enabled" ${enabled ? "checked" : ""}/> ${this._escape(this._t("editor.overlayEnable", { label }))}</label>
        <label>${this._escape(this._t("editor.overlayLabel"))}
          <input data-path="image_overlays.${key}.label" placeholder="${this._escape(defaultLabel)}" value="${this._escape(this._config.image_overlays?.[key]?.label || "")}" />
        </label>
        ${entityHtml}
        ${this._renderLabelVisibilityOptions(`overlay_${key}`)}
        ${periodHtml}
        <label>${this._escape(this._t("editor.xPosition"))} (${this._escape(left)})
          <input type="range" min="0" max="100" step="1" data-path="image_overlays.${key}.left" value="${this._escape(left)}" />
        </label>
        <label>${this._escape(this._t("editor.yPosition"))} (${this._escape(top)})
          <input type="range" min="0" max="100" step="1" data-path="image_overlays.${key}.top" value="${this._escape(top)}" />
        </label>
        <label>${this._escape(this._t("editor.overlaySize"))} (${this._escape(width)})
          <input type="range" min="2" max="60" step="1" data-path="image_overlays.${key}.width" value="${this._escape(width)}" />
        </label>
        ${orientationHtml}
      </div>
    `;
  }

  _renderCustomKpiField(kpi, index) {
    const label = kpi?.label || "";
    const entity = kpi?.entity || kpi?.entity_id || "";
    const value = kpi?.value ?? "";
    const unit = kpi?.unit ?? "auto";
    const position = Number.isFinite(Number(kpi?.position ?? kpi?.order)) ? Number(kpi.position ?? kpi.order) : 100 + index;
    const columns = Number.isFinite(Number(kpi?.columns ?? kpi?.span)) ? Number(kpi.columns ?? kpi.span) : 1;
    const color = kpi?.color || "#1f8fff";

    return `
      <div class="box-field kpi-field">
        <div class="kpi-head">
          <strong>${this._escape(label || `KPI ${index + 1}`)}</strong>
          <button type="button" data-action="remove-kpi" data-index="${this._escape(index)}">${this._escape(this._t("editor.kpiRemove"))}</button>
        </div>
        <label>${this._escape(this._t("editor.kpiLabel"))}
          <input data-path="custom_kpis.${index}.label" value="${this._escape(label)}" />
        </label>
        <label>${this._escape(this._t("editor.kpiEntity"))}
          <input data-path="custom_kpis.${index}.entity" list="ha-solar-dashboard-entities" placeholder="sensor.autarky" value="${this._escape(entity)}" autocomplete="off" />
        </label>
        <label>${this._escape(this._t("editor.kpiStaticValue"))}
          <input data-path="custom_kpis.${index}.value" placeholder="42" value="${this._escape(value)}" />
        </label>
        <label>${this._escape(this._t("editor.unit"))}
          <input data-path="custom_kpis.${index}.unit" placeholder="auto, %, kg, kWh/kWp" value="${this._escape(unit)}" />
        </label>
        <label>${this._escape(this._t("editor.kpiPosition"))} (${this._escape(position)})
          <input type="number" min="0" max="999" step="1" data-path="custom_kpis.${index}.position" value="${this._escape(position)}" />
        </label>
        <label>${this._escape(this._t("editor.kpiColumns"))} (${this._escape(columns)})
          <input type="range" min="1" max="6" step="1" data-path="custom_kpis.${index}.columns" value="${this._escape(columns)}" />
        </label>
        <label>${this._escape(this._t("editor.kpiColor"))}
          <input data-path="custom_kpis.${index}.color" placeholder="#1f8fff" value="${this._escape(color)}" />
        </label>
      </div>
    `;
  }

  _renderSetupWizard() {
    const entityCount = this._entityOptions().length;
    const suggestions = this._autoDetectSuggestions();
    const suggestionRows = suggestions.map((suggestion) => {
      const current = suggestion.current ? `
        <div class="wizard-current">
          <span>${this._escape(this._t("editor.setupCurrent", {}, "Current"))}</span>
          <code>${this._escape(suggestion.current)}</code>
        </div>
      ` : "";
      return `
        <div class="wizard-suggestion">
          <div class="wizard-suggestion-main">
            <strong>${this._escape(suggestion.label)}</strong>
            <code>${this._escape(suggestion.entityId)}</code>
            ${current}
          </div>
          <div class="wizard-suggestion-side">
            <span>${this._escape(this._t("editor.setupConfidence", { score: suggestion.score }, `${suggestion.score}% match`))}</span>
            <button type="button" data-action="apply-suggestion" data-path="${this._escape(suggestion.path)}">${this._escape(this._t("editor.setupApplyOne", {}, "Use"))}</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <details class="setup-wizard" data-setup-wizard${this._setupWizardOpen ? " open" : ""}>
        <summary>${this._escape(this._t("editor.setupWizard", {}, "Setup wizard"))}</summary>
        <div class="wizard-body">
          <p>${this._escape(this._t("editor.setupIntro", {}, "Detect likely Home Assistant entities and fill the card configuration."))}</p>
          <p>${this._escape(this._t("editor.setupHelp", {}, "Review the suggestions before applying them. Use Fill empty fields for a safe first pass or Replace detected fields when you want to overwrite existing detected assignments."))}</p>
          <div class="wizard-status">
            ${entityCount > 0
              ? this._escape(this._t("editor.setupEntityCount", { count: entityCount }, `${entityCount} entities available`))
              : this._escape(this._t("editor.setupNoEntities", {}, "Open this editor in Home Assistant so entities can be detected."))}
          </div>
          <div class="wizard-actions">
            <button type="button" data-action="auto-detect" data-mode="fill" ${entityCount === 0 || suggestions.length === 0 ? "disabled" : ""}>${this._escape(this._t("editor.setupFillEmpty", {}, "Fill empty fields"))}</button>
            <button type="button" data-action="auto-detect" data-mode="replace" ${entityCount === 0 || suggestions.length === 0 ? "disabled" : ""}>${this._escape(this._t("editor.setupReplaceAll", {}, "Replace detected fields"))}</button>
          </div>
          ${this._wizardMessage ? `<div class="wizard-message">${this._escape(this._wizardMessage)}</div>` : ""}
          <div class="wizard-suggestions-title">${this._escape(this._t("editor.setupSuggestions", {}, "Detected suggestions"))}</div>
          <div class="wizard-suggestions">
            ${suggestionRows || `<div class="wizard-empty">${this._escape(this._t("editor.setupNoSuggestions", {}, "No strong entity matches found yet."))}</div>`}
          </div>
        </div>
      </details>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const house = this._normalizeHouse(this._config.house) || "single_family_home";
    const houseOptions = Object.entries(HOUSE_VARIANTS)
      .map(([key, value]) => `<option value="${this._escape(key)}"${key === house ? " selected" : ""}>${this._escape(this._houseLabel(key, value))}</option>`)
      .join("");
    const viewMode = this._normalizeViewMode(this._config.view_mode) || "house";
    const viewModeOptions = VIEW_MODE_OPTIONS
      .map((option) => `<option value="${this._escape(option.key)}"${option.key === viewMode ? " selected" : ""}>${this._escape(this._t(option.labelKey, {}, option.label))}</option>`)
      .join("");
    const entityOptions = this._entityOptions()
      .map((entityId) => `<option value="${this._escape(entityId)}"></option>`)
      .join("");
    const customKpis = Array.isArray(this._config.custom_kpis) ? this._config.custom_kpis : [];
    const customKpiFields = customKpis.map((kpi, index) => this._renderCustomKpiField(kpi, index)).join("");
    const overlayFields = IMAGE_OVERLAY_KEYS.map((key) => this._renderOverlayField(key)).join("");

    this.shadowRoot.innerHTML = `
      <style>
        .editor{display:grid;gap:12px;font-family:system-ui,sans-serif;min-width:0;max-width:100%;overflow:hidden;color:var(--primary-text-color,#e5e7eb)}
        label{display:grid;gap:4px;font-size:13px;min-width:0;max-width:100%;color:var(--primary-text-color,#e5e7eb)}
        input,select,button{box-sizing:border-box;min-width:0;max-width:100%;padding:8px;border:1px solid var(--divider-color,#4b5563);border-radius:8px;text-overflow:ellipsis;color:var(--primary-text-color,#e5e7eb)}
        input,select{width:100%}
        input,select{background:var(--input-fill-color,rgba(255,255,255,.04))}
        button{width:auto;background:var(--secondary-background-color,rgba(255,255,255,.08));cursor:pointer}
        button:hover:not(:disabled){border-color:var(--primary-color,#1f8fff)}
        .grid{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;min-width:0}
        .section-title{font-size:13px;font-weight:700;margin-top:4px;color:var(--primary-text-color,#e5e7eb)}
        .box-field{display:grid;gap:8px;min-width:0;box-sizing:border-box;padding:10px;border:1px solid var(--divider-color,#4b5563);border-radius:8px;background:var(--card-background-color,rgba(17,24,39,.72))}
        .checkbox-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
        details{display:grid;gap:8px;min-width:0}
        .pv-labels{padding:8px;border:1px solid var(--divider-color,#4b5563);border-radius:8px}
        .label-options{margin-top:-2px}
        .label-options .checkbox-grid{margin-top:8px}
        .label-entity-block{display:grid;gap:6px;min-width:0}
        .label-entity-title{font-size:13px;color:inherit}
        summary{cursor:pointer;font-size:13px;font-weight:600;color:var(--primary-text-color,#e5e7eb)}
        .details-grid{display:grid;gap:8px;margin-top:8px;min-width:0}
        .kpi-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;min-width:0}
        .kpi-head strong{min-width:0;overflow-wrap:anywhere}
        .inline{display:flex;align-items:center;gap:8px}
        .inline input{width:auto;min-width:auto;padding:0}
        .setup-wizard{padding:10px;border:1px solid color-mix(in srgb,var(--primary-color,#1f8fff) 42%,var(--divider-color,#4b5563));border-radius:8px;background:color-mix(in srgb,var(--primary-color,#1f8fff) 8%,var(--card-background-color,#111827));box-shadow:inset 3px 0 0 var(--primary-color,#1f8fff)}
        .setup-wizard summary{font-weight:700;font-size:14px}
        .wizard-body{display:grid;gap:10px;margin-top:10px;min-width:0}
        .wizard-body p{margin:0;font-size:13px;line-height:1.4;color:var(--secondary-text-color,#9ca3af)}
        .wizard-status,.wizard-empty{font-size:12px;color:var(--secondary-text-color,#9ca3af)}
        .wizard-message{font-size:12px;padding:8px;border-radius:8px;background:rgba(52,211,153,.14);color:#34d399}
        .wizard-actions{display:flex;flex-wrap:wrap;gap:8px}
        .wizard-actions button:disabled,.wizard-suggestion button:disabled{opacity:.55;cursor:not-allowed}
        .wizard-actions button,.wizard-suggestion button{border-color:color-mix(in srgb,var(--primary-color,#1f8fff) 45%,var(--divider-color,#4b5563));background:color-mix(in srgb,var(--primary-color,#1f8fff) 14%,var(--card-background-color,#111827));color:var(--primary-text-color,#e5e7eb);font-weight:600}
        .wizard-suggestions-title{font-size:13px;font-weight:700;color:var(--primary-text-color,#e5e7eb)}
        .wizard-suggestions{display:grid;gap:8px;min-width:0}
        .wizard-suggestion{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px;border:1px solid var(--divider-color,#4b5563);border-radius:8px;background:var(--secondary-background-color,rgba(31,41,55,.72));min-width:0}
        .wizard-suggestion-main{display:grid;gap:4px;min-width:0}
        .wizard-suggestion-main strong{font-size:13px;overflow-wrap:anywhere;color:var(--primary-text-color,#f3f4f6)}
        .wizard-suggestion code,.wizard-current code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;overflow-wrap:anywhere;white-space:normal;color:var(--secondary-text-color,#cbd5e1)}
        .wizard-current{display:grid;gap:2px;color:var(--secondary-text-color,#9ca3af);font-size:12px;min-width:0}
        .wizard-suggestion-side{display:grid;justify-items:end;gap:6px;font-size:12px;color:var(--secondary-text-color,#9ca3af);white-space:nowrap}
        @media (max-width:700px){.checkbox-grid{grid-template-columns:minmax(0,1fr)}}
        @media (max-width:700px){.wizard-suggestion{grid-template-columns:minmax(0,1fr)}.wizard-suggestion-side{justify-items:start;white-space:normal}}
      </style>
      <div class="editor">
        <datalist id="ha-solar-dashboard-entities">${entityOptions}</datalist>
        ${this._renderSetupWizard()}
        <label>${this._escape(this._t("editor.title"))} <input data-path="title" value="${this._escape(this._config.title || "")}" /></label>
        <label>${this._escape(this._t("editor.timeLabel"))} <input data-path="time_label" value="${this._escape(this._config.time_label || "")}" /></label>
        <label>${this._escape(this._t("editor.viewMode", {}, "Default view"))} <select data-path="view_mode">${viewModeOptions}</select></label>
        <label>${this._escape(this._t("editor.advisorMaxSuggestions", {}, "Advisor suggestions"))} (${this._escape(Number(this._config.advisor_max_suggestions ?? 8).toFixed(0))})
          <input type="range" min="1" max="12" step="1" data-path="advisor_max_suggestions" value="${this._escape(this._config.advisor_max_suggestions ?? 8)}" />
        </label>
        <label>${this._escape(this._t("editor.houseType"))} <select data-path="house">${houseOptions}</select></label>
        <label>${this._escape(this._t("editor.customImage"))} <input data-path="image" placeholder="/local/solar/single_family_home/single_family_home.png or https://..." value="${this._escape(this._config.image || "")}" /></label>
        <label>${this._escape(this._t("editor.customDayImage"))} <input data-path="day_image" placeholder="${this._escape(this._t("editor.optionalDayImage"))}" value="${this._escape(this._config.day_image || "")}" /></label>
        <label>${this._escape(this._t("editor.weatherEntity"))}
          <input data-path="weather_entity" list="ha-solar-dashboard-entities" placeholder="weather.home" value="${this._escape(this._config.weather_entity || "")}" autocomplete="off" />
        </label>
        <label><input type="checkbox" data-path="show_title" ${this._config.show_title !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showTitle"))}</label>
        <label><input type="checkbox" data-path="show_time_label" ${this._config.show_time_label !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showLiveLabel"))}</label>
        <label><input type="checkbox" data-path="show_view_selector" ${this._config.show_view_selector !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showViewSelector", {}, "Show House/Advisor view selector"))}</label>
        <label><input type="checkbox" data-path="show_house_selector" ${this._config.show_house_selector !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showHouseSelector"))}</label>
        <label><input type="checkbox" data-path="show_energy_range_selector" ${this._config.show_energy_range_selector === true ? "checked" : ""}/> ${this._escape(this._t("editor.showEnergyRangeSelector"))}</label>
        <label><input type="checkbox" data-path="show_metric_tiles" ${this._config.show_metric_tiles !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showMetricTiles"))}</label>
        <label><input type="checkbox" data-path="show_power_flows" ${this._config.show_power_flows === true ? "checked" : ""}/> ${this._escape(this._t("editor.showPowerFlows"))}</label>
        <label><input type="checkbox" data-path="show_grid_status_tile" ${this._config.show_grid_status_tile !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showGridStatusTile"))}</label>
        <label><input type="checkbox" data-path="show_status_label" ${this._config.show_status_label !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showStatusLabel"))}</label>
        <label><input type="checkbox" data-path="show_weather_status" ${this._config.show_weather_status === true ? "checked" : ""}/> ${this._escape(this._t("editor.showWeatherStatus"))}</label>
        <label>${this._escape(this._t("editor.hudBoxOpacity"))} (${this._escape((Number(this._config.hud_box_opacity ?? 0.65)).toFixed(2))})
          <input type="range" min="0" max="1" step="0.05" data-path="hud_box_opacity" value="${this._escape(this._config.hud_box_opacity ?? 0.65)}" />
        </label>
        <label>${this._escape(this._t("editor.hudBoxScale"))} (${this._escape((Number(this._config.hud_box_scale ?? 1)).toFixed(2))})
          <input type="range" min="0.6" max="1.8" step="0.05" data-path="hud_box_scale" value="${this._escape(this._config.hud_box_scale ?? 1)}" />
        </label>
        <label>${this._escape(this._t("editor.powerDisplayMode"))}
          <select data-path="power_display_mode">
            <option value="raw"${this._config.power_display_mode === "raw" ? " selected" : ""}>${this._escape(this._t("editor.rawMode"))}</option>
            <option value="auto_kw"${(this._config.power_display_mode || "auto_kw") === "auto_kw" ? " selected" : ""}>${this._escape(this._t("editor.autoWKw"))}</option>
          </select>
        </label>
        <label>${this._escape(this._t("editor.powerDecimals"))} (${this._escape(Number(this._config.power_decimals ?? 2).toFixed(0))})
          <input type="range" min="0" max="3" step="1" data-path="power_decimals" value="${this._escape(this._config.power_decimals ?? 2)}" />
        </label>
        <div class="section-title">${this._escape(this._t("editor.sectionBoxes"))}</div>
        <div class="grid">${TILE_METRICS.map((metric) => this._renderBoxField(metric)).join("")}</div>
        <div class="section-title">${this._escape(this._t("editor.sectionOverlays"))}</div>
        <div class="grid">${overlayFields}</div>
        <div class="section-title">${this._escape(this._t("editor.sectionKpis"))}</div>
        <div class="grid">${customKpiFields}</div>
        <button type="button" data-action="add-kpi">${this._escape(this._t("editor.kpiAdd"))}</button>
      </div>
    `;

    this.shadowRoot.querySelectorAll("input,select").forEach((element) => {
      element.addEventListener("change", (event) => {
        const target = event.target;
        const path = target.dataset.path;
        if (!path) return;
        const isCheckbox = target.type === "checkbox";
        const value = isCheckbox ? target.checked : target.value;
        this._onInput(path, value, isCheckbox);
      });
    });
    this.shadowRoot.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const target = event.currentTarget;
        if (target.dataset.action === "add-kpi") this._addCustomKpi();
        if (target.dataset.action === "remove-kpi") this._removeCustomKpi(Number(target.dataset.index));
        if (target.dataset.action === "auto-detect") this._applyAutoDetection(target.dataset.mode || "fill");
        if (target.dataset.action === "apply-suggestion") this._applyAutoDetection("replace", target.dataset.path || "");
      });
    });
    const setupWizard = this.shadowRoot.querySelector("details[data-setup-wizard]");
    if (setupWizard) {
      setupWizard.addEventListener("toggle", (event) => {
        this._setupWizardOpen = event.currentTarget.open;
      });
    }
    this.shadowRoot.querySelectorAll("details[data-label-options]").forEach((details) => {
      details.addEventListener("toggle", (event) => {
        const key = event.currentTarget.dataset.labelOptions;
        if (!key) return;
        this._openLabelOptions = this._openLabelOptions || new Set();
        if (event.currentTarget.open) this._openLabelOptions.add(key);
        else this._openLabelOptions.delete(key);
      });
    });

    this._rendered = true;
  }
}

function upgradeCustomElement(type, elementClass) {
  const existingClass = customElements.get(type);
  if (!existingClass) {
    customElements.define(type, elementClass);
    return;
  }

  Object.getOwnPropertyNames(elementClass.prototype).forEach((name) => {
    if (name === "constructor") return;
    Object.defineProperty(existingClass.prototype, name, Object.getOwnPropertyDescriptor(elementClass.prototype, name));
  });

  Object.getOwnPropertyNames(elementClass).forEach((name) => {
    if (["length", "name", "prototype"].includes(name)) return;
    Object.defineProperty(existingClass, name, Object.getOwnPropertyDescriptor(elementClass, name));
  });
}

upgradeCustomElement(CARD_TYPE, HaSolarDashboardCard);
upgradeCustomElement(CARD_EDITOR_TYPE, HaSolarDashboardCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: "HA Solar Dashboard Card",
    description: "PV energy overview dashboard card",
    preview: true,
    documentationURL: "https://github.com/404GamerNotFound/ha-solar-dashboard",
  });
}
