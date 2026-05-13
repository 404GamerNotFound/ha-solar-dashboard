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

const I18N = {
  en: {
    "aria.houseSelector": "Select house",
    "card.defaultTitle": "Energy Flow",
    "card.defaultTimeLabel": "Live",
    "editor.customDayImage": "Custom Day Image",
    "editor.customImage": "Custom Image",
    "editor.entity": "Entity",
    "editor.entityPlaceholder": "{label} entity",
    "editor.houseType": "House Type",
    "editor.hudBoxOpacity": "HUD box opacity",
    "editor.hudBoxScale": "HUD box scale",
    "editor.importExportEntity": "Import/Export Entity",
    "editor.kpiAdd": "Add tile",
    "editor.kpiColor": "Color",
    "editor.kpiColumns": "Tile width",
    "editor.kpiEntity": "KPI entity",
    "editor.kpiLabel": "KPI label",
    "editor.kpiPosition": "Tile position",
    "editor.kpiRemove": "Remove",
    "editor.kpiStaticValue": "Static value",
    "editor.optionalDayImage": "Optional daylight image",
    "editor.powerDecimals": "Power decimals",
    "editor.powerDisplayMode": "Power display mode",
    "editor.rawMode": "Raw value + configured unit",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.sectionBoxes": "Boxes, Entity, Unit, and Position",
    "editor.sectionKpis": "Custom KPI tiles",
    "editor.showBox": "Show {label}",
    "editor.showHouseSelector": "Show house selector",
    "editor.showLiveLabel": "Show live label",
    "editor.showMetricTiles": "Show metric boxes below image",
    "editor.showStatusLabel": "Show image status label",
    "editor.showTitle": "Show title",
    "editor.showWeatherStatus": "Show current weather in status label",
    "editor.timeLabel": "Time Label",
    "editor.title": "Title",
    "editor.unit": "Unit",
    "editor.weatherEntity": "Weather Entity",
    "editor.xPosition": "X Position",
    "editor.yPosition": "Y Position",
    "house.apartment_building": "Apartment Building",
    "house.apartment_building_balcony_solar": "Apartment Building Balcony Solar",
    "house.bungalow": "Bungalow",
    "house.city_villa": "City Villa",
    "house.city_villa_pitched_roof": "City Villa with Pitched Roof",
    "house.duplex_house": "Duplex House",
    "house.single_family_home": "Single Family Home",
    "house.terraced_middle_house": "Terraced Middle House",
    "metrics.battery_level": "Battery",
    "metrics.import_export_power": "Import/Export",
    "metrics.inverter_power": "Inverter",
    "metrics.pv_power": "PV Power",
    "metrics.pv_roof_power": "Roof PV",
    "metrics.pv_shed_power": "Shed PV",
    "metrics.pv_total_power": "PV Total",
    "metrics.wallbox_power": "EV Charger",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Last updated: {time}",
    "status.weather": "Weather: {weather}",
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
  },
  de: {
    "aria.houseSelector": "Haus auswählen",
    "card.defaultTitle": "Energiefluss",
    "card.defaultTimeLabel": "Live",
    "editor.customDayImage": "Eigenes Tagbild",
    "editor.customImage": "Eigenes Bild",
    "editor.entity": "Entität",
    "editor.entityPlaceholder": "{label} Entität",
    "editor.houseType": "Haustyp",
    "editor.hudBoxOpacity": "HUD-Box-Deckkraft",
    "editor.hudBoxScale": "HUD-Box-Skalierung",
    "editor.importExportEntity": "Import-/Export-Entität",
    "editor.kpiAdd": "Kachel hinzufügen",
    "editor.kpiColor": "Farbe",
    "editor.kpiColumns": "Kachelbreite",
    "editor.kpiEntity": "KPI-Entität",
    "editor.kpiLabel": "KPI-Label",
    "editor.kpiPosition": "Kachelposition",
    "editor.kpiRemove": "Entfernen",
    "editor.kpiStaticValue": "Fester Wert",
    "editor.optionalDayImage": "Optionales Tagesbild",
    "editor.powerDecimals": "Leistungs-Nachkommastellen",
    "editor.powerDisplayMode": "Leistungsanzeige",
    "editor.rawMode": "Rohwert + konfigurierte Einheit",
    "editor.auto": "Auto",
    "editor.autoWKw": "Automatisch W/kW",
    "editor.sectionBoxes": "Boxen, Entität, Einheit und Position",
    "editor.sectionKpis": "Eigene KPI-Kacheln",
    "editor.showBox": "{label} anzeigen",
    "editor.showHouseSelector": "Hausauswahl anzeigen",
    "editor.showLiveLabel": "Live-Label anzeigen",
    "editor.showMetricTiles": "Messwertboxen unter dem Bild anzeigen",
    "editor.showStatusLabel": "Statuslabel im Bild anzeigen",
    "editor.showTitle": "Titel anzeigen",
    "editor.showWeatherStatus": "Aktuelles Wetter im Statuslabel anzeigen",
    "editor.timeLabel": "Zeitlabel",
    "editor.title": "Titel",
    "editor.unit": "Einheit",
    "editor.weatherEntity": "Wetter-Entität",
    "editor.xPosition": "X-Position",
    "editor.yPosition": "Y-Position",
    "house.apartment_building": "Mehrfamilienhaus",
    "house.apartment_building_balcony_solar": "Mehrfamilienhaus Balkonsolar",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Stadtvilla",
    "house.city_villa_pitched_roof": "Stadtvilla mit Satteldach",
    "house.duplex_house": "Doppelhaus",
    "house.single_family_home": "Einfamilienhaus",
    "house.terraced_middle_house": "Reihenmittelhaus",
    "metrics.battery_level": "Batterie",
    "metrics.import_export_power": "Import/Export",
    "metrics.inverter_power": "Wechselrichter",
    "metrics.pv_power": "PV-Leistung",
    "metrics.pv_roof_power": "PV Dach",
    "metrics.pv_shed_power": "PV Schuppen",
    "metrics.pv_total_power": "PV Gesamt",
    "metrics.wallbox_power": "Wallbox",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Zuletzt aktualisiert: {time}",
    "status.weather": "Wetter: {weather}",
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
  },
  es: {
    "aria.houseSelector": "Seleccionar casa",
    "card.defaultTitle": "Flujo de energía",
    "card.defaultTimeLabel": "En vivo",
    "editor.customDayImage": "Imagen diurna personalizada",
    "editor.customImage": "Imagen personalizada",
    "editor.entity": "Entidad",
    "editor.entityPlaceholder": "Entidad de {label}",
    "editor.houseType": "Tipo de casa",
    "editor.hudBoxOpacity": "Opacidad de cajas HUD",
    "editor.hudBoxScale": "Escala de cajas HUD",
    "editor.importExportEntity": "Entidad de importación/exportación",
    "editor.kpiAdd": "Añadir mosaico",
    "editor.kpiColor": "Color",
    "editor.kpiColumns": "Ancho del mosaico",
    "editor.kpiEntity": "Entidad KPI",
    "editor.kpiLabel": "Etiqueta KPI",
    "editor.kpiPosition": "Posición del mosaico",
    "editor.kpiRemove": "Eliminar",
    "editor.kpiStaticValue": "Valor fijo",
    "editor.optionalDayImage": "Imagen diurna opcional",
    "editor.powerDecimals": "Decimales de potencia",
    "editor.powerDisplayMode": "Modo de potencia",
    "editor.rawMode": "Valor bruto + unidad configurada",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.sectionBoxes": "Cajas, entidad, unidad y posición",
    "editor.sectionKpis": "Mosaicos KPI personalizados",
    "editor.showBox": "Mostrar {label}",
    "editor.showHouseSelector": "Mostrar selector de casa",
    "editor.showLiveLabel": "Mostrar etiqueta en vivo",
    "editor.showMetricTiles": "Mostrar cajas de métricas bajo la imagen",
    "editor.showStatusLabel": "Mostrar etiqueta de estado en la imagen",
    "editor.showTitle": "Mostrar título",
    "editor.showWeatherStatus": "Mostrar clima actual en la etiqueta de estado",
    "editor.timeLabel": "Etiqueta de tiempo",
    "editor.title": "Título",
    "editor.unit": "Unidad",
    "editor.weatherEntity": "Entidad meteorológica",
    "editor.xPosition": "Posición X",
    "editor.yPosition": "Posición Y",
    "house.apartment_building": "Edificio de apartamentos",
    "house.apartment_building_balcony_solar": "Edificio de apartamentos con solar de balcón",
    "house.bungalow": "Bungaló",
    "house.city_villa": "Villa urbana",
    "house.city_villa_pitched_roof": "Villa urbana con tejado inclinado",
    "house.duplex_house": "Casa dúplex",
    "house.single_family_home": "Casa unifamiliar",
    "house.terraced_middle_house": "Casa adosada central",
    "metrics.battery_level": "Batería",
    "metrics.import_export_power": "Importación/exportación",
    "metrics.inverter_power": "Inversor",
    "metrics.pv_power": "Potencia FV",
    "metrics.pv_roof_power": "FV tejado",
    "metrics.pv_shed_power": "FV cobertizo",
    "metrics.pv_total_power": "FV total",
    "metrics.wallbox_power": "Cargador VE",
    "status.export": "Exportación",
    "status.import": "Importación",
    "status.lastUpdated": "Última actualización: {time}",
    "status.weather": "Clima: {weather}",
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
  },
  fr: {
    "aria.houseSelector": "Sélectionner une maison",
    "card.defaultTitle": "Flux d'énergie",
    "card.defaultTimeLabel": "En direct",
    "editor.customDayImage": "Image de jour personnalisée",
    "editor.customImage": "Image personnalisée",
    "editor.entity": "Entité",
    "editor.entityPlaceholder": "Entité {label}",
    "editor.houseType": "Type de maison",
    "editor.hudBoxOpacity": "Opacité des boîtes HUD",
    "editor.hudBoxScale": "Échelle des boîtes HUD",
    "editor.importExportEntity": "Entité import/export",
    "editor.kpiAdd": "Ajouter une tuile",
    "editor.kpiColor": "Couleur",
    "editor.kpiColumns": "Largeur de tuile",
    "editor.kpiEntity": "Entité KPI",
    "editor.kpiLabel": "Libellé KPI",
    "editor.kpiPosition": "Position de tuile",
    "editor.kpiRemove": "Supprimer",
    "editor.kpiStaticValue": "Valeur fixe",
    "editor.optionalDayImage": "Image de jour optionnelle",
    "editor.powerDecimals": "Décimales de puissance",
    "editor.powerDisplayMode": "Mode d'affichage de la puissance",
    "editor.rawMode": "Valeur brute + unité configurée",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.sectionBoxes": "Boîtes, entité, unité et position",
    "editor.sectionKpis": "Tuiles KPI personnalisées",
    "editor.showBox": "Afficher {label}",
    "editor.showHouseSelector": "Afficher le sélecteur de maison",
    "editor.showLiveLabel": "Afficher le libellé en direct",
    "editor.showMetricTiles": "Afficher les boîtes de mesure sous l'image",
    "editor.showStatusLabel": "Afficher le libellé d'état dans l'image",
    "editor.showTitle": "Afficher le titre",
    "editor.showWeatherStatus": "Afficher la météo actuelle dans le libellé d'état",
    "editor.timeLabel": "Libellé de temps",
    "editor.title": "Titre",
    "editor.unit": "Unité",
    "editor.weatherEntity": "Entité météo",
    "editor.xPosition": "Position X",
    "editor.yPosition": "Position Y",
    "house.apartment_building": "Immeuble d'appartements",
    "house.apartment_building_balcony_solar": "Immeuble avec solaire de balcon",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Villa urbaine",
    "house.city_villa_pitched_roof": "Villa urbaine avec toit incliné",
    "house.duplex_house": "Maison duplex",
    "house.single_family_home": "Maison individuelle",
    "house.terraced_middle_house": "Maison mitoyenne centrale",
    "metrics.battery_level": "Batterie",
    "metrics.import_export_power": "Import/export",
    "metrics.inverter_power": "Onduleur",
    "metrics.pv_power": "Puissance PV",
    "metrics.pv_roof_power": "PV toiture",
    "metrics.pv_shed_power": "PV abri",
    "metrics.pv_total_power": "PV total",
    "metrics.wallbox_power": "Chargeur VE",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Dernière mise à jour : {time}",
    "status.weather": "Météo : {weather}",
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
  },
  pl: {
    "aria.houseSelector": "Wybierz dom",
    "card.defaultTitle": "Przepływ energii",
    "card.defaultTimeLabel": "Na żywo",
    "editor.customDayImage": "Własny obraz dzienny",
    "editor.customImage": "Własny obraz",
    "editor.entity": "Encja",
    "editor.entityPlaceholder": "Encja {label}",
    "editor.houseType": "Typ domu",
    "editor.hudBoxOpacity": "Przezroczystość pól HUD",
    "editor.hudBoxScale": "Skala pól HUD",
    "editor.importExportEntity": "Encja importu/eksportu",
    "editor.kpiAdd": "Dodaj kafelek",
    "editor.kpiColor": "Kolor",
    "editor.kpiColumns": "Szerokość kafelka",
    "editor.kpiEntity": "Encja KPI",
    "editor.kpiLabel": "Etykieta KPI",
    "editor.kpiPosition": "Pozycja kafelka",
    "editor.kpiRemove": "Usuń",
    "editor.kpiStaticValue": "Stała wartość",
    "editor.optionalDayImage": "Opcjonalny obraz dzienny",
    "editor.powerDecimals": "Miejsca dziesiętne mocy",
    "editor.powerDisplayMode": "Tryb wyświetlania mocy",
    "editor.rawMode": "Wartość surowa + skonfigurowana jednostka",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.sectionBoxes": "Pola, encja, jednostka i pozycja",
    "editor.sectionKpis": "Własne kafelki KPI",
    "editor.showBox": "Pokaż {label}",
    "editor.showHouseSelector": "Pokaż wybór domu",
    "editor.showLiveLabel": "Pokaż etykietę na żywo",
    "editor.showMetricTiles": "Pokaż pola metryk pod obrazem",
    "editor.showStatusLabel": "Pokaż etykietę statusu na obrazie",
    "editor.showTitle": "Pokaż tytuł",
    "editor.showWeatherStatus": "Pokaż aktualną pogodę w etykiecie statusu",
    "editor.timeLabel": "Etykieta czasu",
    "editor.title": "Tytuł",
    "editor.unit": "Jednostka",
    "editor.weatherEntity": "Encja pogody",
    "editor.xPosition": "Pozycja X",
    "editor.yPosition": "Pozycja Y",
    "house.apartment_building": "Budynek wielorodzinny",
    "house.apartment_building_balcony_solar": "Budynek wielorodzinny z fotowoltaiką balkonową",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Willa miejska",
    "house.city_villa_pitched_roof": "Willa miejska z dachem spadzistym",
    "house.duplex_house": "Dom bliźniaczy",
    "house.single_family_home": "Dom jednorodzinny",
    "house.terraced_middle_house": "Środkowy dom szeregowy",
    "metrics.battery_level": "Bateria",
    "metrics.import_export_power": "Import/eksport",
    "metrics.inverter_power": "Falownik",
    "metrics.pv_power": "Moc PV",
    "metrics.pv_roof_power": "PV dach",
    "metrics.pv_shed_power": "PV szopa",
    "metrics.pv_total_power": "PV łącznie",
    "metrics.wallbox_power": "Ładowarka EV",
    "status.export": "Eksport",
    "status.import": "Import",
    "status.lastUpdated": "Ostatnia aktualizacja: {time}",
    "status.weather": "Pogoda: {weather}",
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
    },
    visible_boxes: {
      pv_roof_power: false,
      pv_shed_power: false,
      wallbox_power: false,
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
    },
  },
};

const METRICS = [
  { key: "pv_roof_power", label: "Roof PV", unit: "power", color: "yellow" },
  { key: "pv_shed_power", label: "Shed PV", unit: "power", color: "yellow" },
  { key: "battery_level", label: "Battery", unit: "battery", color: "green" },
  { key: "inverter_power", label: "Inverter", unit: "power", color: "blue" },
  { key: "wallbox_power", label: "EV Charger", unit: "power", color: "blue" },
];

const TILE_METRICS = [
  ...METRICS,
  { key: "pv_total_power", label: "PV Total", unit: "power", color: "yellow", hud: false },
];

const STATUS_METRIC = { key: "import_export_power", label: "Import/Export", unit: "power", color: "blue" };

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
    { above: 0, color: "#fb923c", glow: true },
    { below: 0, color: "#34d399", glow: true },
  ],
};

const STATIC_METRIC_COLORS = {
  yellow: "#ffc233",
  blue: "#1f8fff",
  green: "#34d399",
};

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
  static getConfigElement() {
    return document.createElement(CARD_EDITOR_TYPE);
  }

  static getStubConfig() {
    return {
      type: `custom:${CARD_TYPE}`,
      title: "Solar Dashboard",
      time_label: "Live",
      house: "single_family_home",
      show_title: true,
      show_time_label: true,
      show_house_selector: true,
      show_metric_tiles: true,
      show_status_label: true,
      show_weather_status: false,
      hud_box_opacity: 0.65,
      hud_box_scale: 1,
      dynamic_tile_colors: true,
      daylight_entity: "sun.sun",
      weather_entity: "",
      tile_color_rules: DEFAULT_TILE_COLOR_RULES,
      custom_kpis: [],
      visible_boxes: {
        pv_roof_power: true,
        pv_shed_power: true,
        battery_level: true,
        inverter_power: true,
        wallbox_power: true,
      },
      entities: {
        pv_roof_power: "sensor.pv_roof_power",
        pv_shed_power: "sensor.pv_shed_power",
        battery_level: "sensor.battery_level",
        inverter_power: "sensor.wechselrichter_power",
        wallbox_power: "sensor.wallbox_power",
        pv_total_power: "sensor.pv_total_power",
        import_export_power: "",
      },
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");

    const house = this._normalizeHouse(config.house || config.variant || config.image_variant) || "single_family_home";
    this._hasCustomTitle = Object.prototype.hasOwnProperty.call(config, "title");
    this._hasCustomTimeLabel = Object.prototype.hasOwnProperty.call(config, "time_label");

    this.config = {
      title: "Energy Flow",
      time_label: "Live",
      house,
      show_title: true,
      show_time_label: true,
      show_house_selector: true,
      show_metric_tiles: true,
      show_status_label: true,
      show_weather_status: false,
      hud_box_opacity: 0.65,
      hud_box_scale: 1,
      daylight_entity: "sun.sun",
      weather_entity: "",
      dynamic_tile_colors: true,
      power_display_mode: "auto_kw",
      power_decimals: 2,
      units: { power: "auto", battery: "%" },
      entities: {},
      positions: {},
      visible_boxes: {},
      tile_color_rules: {},
      custom_kpis: [],
      ...config,
      house,
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
      tile_color_rules: {
        ...DEFAULT_TILE_COLOR_RULES,
        ...(config.tile_color_rules || config.color_rules || {}),
      },
      custom_kpis: this._normalizeCustomKpis(config.custom_kpis || config.kpis || []),
    };

    this.config.hud_box_opacity = this._clampNumber(this.config.hud_box_opacity, 0.65, 0, 1);
    this.config.hud_box_scale = this._clampNumber(this.config.hud_box_scale, 1, 0.6, 1.8);
    this.config.power_decimals = this._clampNumber(this.config.power_decimals, 2, 0, 3);

    this._selectedHouse = house;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this._renderCardShell(this._layoutState());
  }

  set hass(hass) {
    const previousLanguage = this._lastLanguage || this._language();
    const previousImageKey = this._lastImageKey || this._imageStateKey();
    this._hass = hass;
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

  _getEntityValue(entityId, fallback = "0") {
    if (!entityId || !this._hass?.states?.[entityId]) return fallback;
    return this._hass.states[entityId].state;
  }

  _getEntityUnit(entityId) {
    return this._hass?.states?.[entityId]?.attributes?.unit_of_measurement;
  }

  _getEntityLastUpdated(entityId) {
    return this._hass?.states?.[entityId]?.last_updated || this._hass?.states?.[entityId]?.last_changed;
  }

  _formatValue(value) {
    if (value === undefined || value === null || value === "unknown" || value === "unavailable") return "—";
    return value;
  }

  _unitForMetric(metric) {
    if (metric.customKpi) return metric.customKpi.unit;
    const metricUnit = this.config.units?.[metric.key];
    if (metricUnit !== undefined && String(metricUnit).trim() !== "") return metricUnit;
    return this.config.units?.[metric.unit];
  }

  _formatReading(metric) {
    if (metric.customKpi) return this._formatCustomKpiValue(metric.customKpi);
    const entityId = this.config.entities[metric.key];
    const value = this._getEntityValue(entityId, "0");
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

  _formatCustomKpiValue(kpi) {
    const hasEntity = Boolean(kpi.entity);
    const rawValue = hasEntity ? this._getEntityValue(kpi.entity, undefined) : kpi.value;
    const value = this._formatValue(rawValue);
    if (value === "—") return value;

    const entityUnit = hasEntity ? this._getEntityUnit(kpi.entity) : "";
    const configuredUnit = String(kpi.unit ?? "auto").trim();
    if (!configuredUnit || configuredUnit.toLowerCase() === "none") return String(value);
    if (configuredUnit.toLowerCase() === "auto") return entityUnit ? `${value} ${entityUnit}` : String(value);
    return `${value} ${configuredUnit}`;
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

  _formatImportExportStatus() {
    const entityId = this.config.entities?.import_export_power;
    if (!entityId) return "";
    const rawValue = this._getEntityValue(entityId, undefined);
    const value = this._formatValue(rawValue);
    if (value === "—") return "";

    const numericValue = Number(rawValue);
    const direction = Number.isFinite(numericValue) && numericValue < 0
      ? this._t("status.export")
      : this._t("status.import");
    const positiveValue = Number.isFinite(numericValue) ? Math.abs(numericValue) : rawValue;
    const entityUnit = this._getEntityUnit(entityId);
    const unit = this.config.units?.import_export_power || "auto";
    const formattedValue = this._isEnergyUnit(entityUnit)
      ? this._formatEnergyValue(positiveValue, entityUnit, unit === "auto" ? "kWh" : unit)
      : this._formatPowerValue(positiveValue, unit, entityUnit);
    return `${direction}: ${formattedValue}`;
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
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return undefined;
    const normalizedUnit = this._normalizeUnit(unit);
    if (normalizedUnit === "kw") return numericValue * 1000;
    if (normalizedUnit === "mw") return numericValue * 1000000;
    return numericValue;
  }

  _valueAsKwh(value, unit) {
    const numericValue = Number(value);
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

  _formatPowerValue(rawValue, unit, entityUnit) {
    const value = this._formatValue(rawValue);
    if (value === "—") return value;

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
      return `${wattValue === undefined ? value : wattValue.toFixed(0)} W`;
    }
    if (normalizedUnit === "kw") {
      const wattValue = this._valueAsWatts(rawValue, entityUnit);
      if (wattValue === undefined) return `${value} kW`;
      return `${(wattValue / 1000).toFixed(this.config.power_decimals)} kW`;
    }
    if (unit && normalizedUnit !== "auto") return `${value} ${unit}`;

    const numericValue = this._isPowerUnit(normalizedEntityUnit)
      ? this._valueAsWatts(rawValue, entityUnit)
      : Number(rawValue);
    if (!Number.isFinite(numericValue)) return `${value} W`;

    const mode = this.config.power_display_mode || "auto_kw";
    if (mode === "auto_kw" && Math.abs(numericValue) >= 1000) {
      const kwValue = numericValue / 1000;
      return `${kwValue.toFixed(this.config.power_decimals)} kW`;
    }

    return `${value} W`;
  }

  _metricNumericValue(metric) {
    if (metric.customKpi) {
      const kpi = metric.customKpi;
      const rawValue = kpi.entity ? this._getEntityValue(kpi.entity, undefined) : kpi.value;
      const number = Number(rawValue);
      return Number.isFinite(number) ? number : undefined;
    }
    const entityId = this.config.entities?.[metric.key];
    const value = this._getEntityValue(entityId, undefined);
    if (value === undefined || value === null || value === "unknown" || value === "unavailable") return undefined;
    const entityUnit = this._getEntityUnit(entityId);
    if (metric.unit === "power") return this._valueAsWatts(value, entityUnit);
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
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
    if (this.config.dynamic_tile_colors === false) {
      return { color: fallbackColor, glow: "transparent" };
    }

    const rules = this.config.tile_color_rules?.[metric.key];
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

  _metricVisible(metric, variant) {
    if (metric.customKpi) return metric.customKpi.visible !== false;
    const configured = this.config.visible_boxes?.[metric.key];
    if (configured !== undefined) return configured !== false;
    return variant?.visible_boxes?.[metric.key] !== false;
  }

  _visibleMetrics(variant, metrics = TILE_METRICS) {
    return metrics.filter((metric) => this._metricVisible(metric, variant));
  }

  _visibleTileMetrics(variant) {
    return [
      ...this._visibleMetrics(variant).map((metric, index) => ({
        ...metric,
        tileOrder: metric.tileOrder ?? index,
        tileColumns: metric.tileColumns ?? 1,
      })),
      ...this._customKpiMetrics(),
    ].sort((a, b) => (a.tileOrder ?? 0) - (b.tileOrder ?? 0));
  }

  _visibleHudMetrics(variant) {
    return this._visibleMetrics(variant).filter((metric) => {
      if (metric.hud !== false) return true;
      return Boolean(variant?.positions?.[metric.key]) || this.config.visible_boxes?.[metric.key] === true;
    });
  }

  _metricLabel(metric, variant) {
    if (metric.customKpi) return metric.customKpi.label || metric.label;
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
      this._remoteImageUrl(file),
      this._localImageUrl(file),
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

  _renderMetric(metric, variant) {
    if (!this._metricVisible(metric, variant)) return "";

    const position = this._metricPosition(variant, metric.key);
    const left = this._toPercent(position.left, 50);
    const top = this._toPercent(position.top, 50);

    return `
      <div class="metric" data-accent-key="${metric.key}" data-metric="${metric.key}" style="left: ${left}%; top: ${top}%; ${this._escape(this._accentStyle(metric))}">
        <div class="label">${this._escape(this._metricLabel(metric, variant))}</div>
        <div class="value" data-value="${metric.key}">${this._escape(this._formatReading(metric))}</div>
      </div>
    `;
  }

  _tileStyle(metric) {
    const columns = Math.round(this._clampNumber(metric.tileColumns ?? 1, 1, 1, 6));
    const mobileColumns = Math.min(columns, 2);
    return `${this._accentStyle(metric)} order:${Number(metric.tileOrder ?? 0)}; --tile-columns:${columns}; --tile-mobile-columns:${mobileColumns};`;
  }

  _attachControls() {
    const select = this.shadowRoot.querySelector(".house-select");
    if (select) {
      select.addEventListener("change", (event) => {
        const nextHouse = this._normalizeHouse(event.target.value);
        if (!nextHouse || nextHouse === this._selectedHouse) return;
        this._selectedHouse = nextHouse;
        this._renderCardShell(this._layoutState());
      });
    }

    const image = this.shadowRoot.querySelector(".scene-image");
    if (image) {
      image.addEventListener("error", () => this._applyImageFallback(image));
      if (image.complete && image.naturalWidth === 0) this._applyImageFallback(image);
    }
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
    const visibleHudMetrics = this._visibleHudMetrics(state.variant);
    const visibleTileMetrics = this._visibleTileMetrics(state.variant);
    const metricHtml = visibleHudMetrics.map((metric) => this._renderMetric(metric, state.variant)).join("");
    const statusLabel = this._statusLabel();
    const statusHtml = this.config.show_status_label !== false
      ? `<div class="scene-status" data-accent-key="${STATUS_METRIC.key}" data-status-label style="${this._escape(this._accentStyle(STATUS_METRIC))}">${this._escape(statusLabel)}</div>`
      : "";
    const headerHtml = [
      this.config.show_title !== false ? `<div class="title">${this._escape(this._displayTitle())}</div>` : "",
      this._renderHouseSelector(state.activeHouse),
      this.config.show_time_label !== false ? `<div class="badge">${this._escape(this._displayTimeLabel())}</div>` : "",
    ].filter(Boolean).join("");
    const gridHtml = visibleTileMetrics.map(
      (metric) => `
        <div class="tile" data-accent-key="${metric.key}" data-tile="${metric.key}" style="${this._escape(this._tileStyle(metric))}">
          <div class="name">${this._escape(this._metricLabel(metric, state.variant))}</div>
          <div class="num" data-value="${metric.key}">${this._escape(this._formatReading(metric))}</div>
        </div>
      `,
    ).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; --text-main:#f3f6ff; --text-muted:#9ba3b8; --glass-soft:rgba(255,255,255,.08); --accent-yellow:#ffc233; --accent-blue:#1f8fff; --accent-green:#34d399; --hud-box-opacity:${this.config.hud_box_opacity}; --hud-box-scale:${this.config.hud_box_scale}; --hud-box-bg:rgba(8,16,38,var(--hud-box-opacity)); }
        ha-card { border-radius:18px; overflow:hidden; background:radial-gradient(110% 80% at 15% 0%, #232b44 0%, #111727 70%); color:var(--text-main); box-shadow:0 18px 45px rgba(0,0,0,.55); padding:16px; font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
        .header { display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:center; gap:10px; margin-bottom:12px; }
        .title { min-width:0; overflow-wrap:anywhere; font-size:1.28rem; font-weight:700; line-height:1.2; }
        .badge,.house-select { background:var(--glass-soft); border:1px solid rgba(255,255,255,.2); border-radius:8px; color:var(--text-main); font:inherit; font-size:.88rem; min-height:34px; }
        .badge { display:inline-flex; align-items:center; padding:0 10px; white-space:nowrap; }
        .house-select { max-width:140px; padding:0 30px 0 10px; }
        .scene { position:relative; aspect-ratio:91/64; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,.1); margin-bottom:12px; background:#101626; }
        .scene-image { display:block; width:100%; height:100%; object-fit:cover; filter:saturate(1.03) contrast(1.03); }
        .metric { --tile-accent:var(--text-main); --tile-glow:transparent; position:absolute; width:clamp(82px,15%,118px); transform:translate(-50%,-50%) scale(var(--hud-box-scale)); transform-origin:center center; background:linear-gradient(135deg,var(--hud-box-bg),rgba(8,16,38,calc(var(--hud-box-opacity) * .82))); border:1px solid color-mix(in srgb,var(--tile-accent) 48%,rgba(255,255,255,.18)); backdrop-filter:blur(4px); border-radius:10px; padding:7px 9px; box-shadow:0 8px 24px rgba(0,0,0,.35),0 0 22px var(--tile-glow); pointer-events:none; box-sizing:border-box; }
        .metric .label,.tile .name { color:var(--text-muted); font-size:.74rem; line-height:1.2; }
        .metric .value,.tile .num { color:var(--tile-accent); font-size:.92rem; font-weight:700; line-height:1.25; overflow-wrap:anywhere; }
        .scene-status { --tile-accent:rgba(243,246,255,.86); --tile-glow:transparent; position:absolute; right:10px; bottom:10px; max-width:calc(100% - 20px); background:rgba(8,16,38,.62); border:1px solid color-mix(in srgb,var(--tile-accent) 34%,rgba(255,255,255,.14)); border-radius:8px; color:rgba(243,246,255,.86); font-size:.72rem; line-height:1.25; padding:5px 8px; backdrop-filter:blur(4px); box-shadow:0 8px 18px rgba(0,0,0,.28),0 0 18px var(--tile-glow); pointer-events:none; overflow-wrap:anywhere; }
        .scene-status:empty { display:none; }
        .grid { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:8px; }
        .tile { --tile-accent:var(--text-main); --tile-glow:transparent; --tile-columns:1; --tile-mobile-columns:1; grid-column:span var(--tile-columns); background:linear-gradient(135deg,rgba(12,20,38,.78),rgba(12,20,38,.62)); border:1px solid color-mix(in srgb,var(--tile-accent) 34%,rgba(255,255,255,.08)); border-radius:8px; padding:10px; min-width:0; box-shadow:inset 3px 0 0 var(--tile-accent),0 8px 20px rgba(0,0,0,.18),0 0 20px var(--tile-glow); }
        @media (max-width:700px){ .header{grid-template-columns:minmax(0,1fr);align-items:stretch;} .badge,.house-select{width:100%;} .metric{width:clamp(68px,18%,96px);padding:5px 7px;} .metric .label{font-size:.62rem;} .metric .value{font-size:.76rem;} .grid{grid-template-columns:repeat(2,minmax(0,1fr));} .tile{grid-column:span var(--tile-mobile-columns);} }
      </style>
      <ha-card>
        ${headerHtml ? `<div class="header">${headerHtml}</div>` : ""}
        <div class="scene"><img class="scene-image" src="${this._escape(state.imageSrc)}" data-fallbacks="${this._escape((state.imageFallbacks || []).join("|"))}" alt="${this._escape(this._houseLabel(state.activeHouse, state.variant))}" />${metricHtml}${statusHtml}</div>
        ${this.config.show_metric_tiles !== false ? `<div class="grid">${gridHtml}</div>` : ""}
      </ha-card>
    `;

    this._attachControls();
  }

  _updateReadings() {
    [...TILE_METRICS, ...this._customKpiMetrics()].forEach((metric) => {
      const reading = this._formatReading(metric);
      this.shadowRoot.querySelectorAll(`[data-value="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== reading) element.textContent = reading;
      });
      const accent = this._metricAccent(metric);
      this.shadowRoot.querySelectorAll(`[data-accent-key="${metric.key}"]`).forEach((element) => {
        element.style.setProperty("--tile-accent", accent.color);
        element.style.setProperty("--tile-glow", accent.glow);
      });
    });
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
      custom_kpis: [],
      ...config,
      visible_boxes: { ...((config || {}).boxes || {}), ...((config || {}).visible_boxes || {}) },
      custom_kpis: Array.isArray((config || {}).custom_kpis || (config || {}).kpis)
        ? [...(((config || {}).custom_kpis || (config || {}).kpis))]
        : [],
    };
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

  _onInput(path, value, isCheckbox = false) {
    const next = this._cloneConfig(this._config || {});
    const parts = path.split(".");
    const lastPart = parts[parts.length - 1];
    const numericFields = new Set(["hud_box_opacity", "hud_box_scale", "power_decimals"]);
    const numericProps = new Set(["left", "top", "position", "columns"]);
    const shouldBeNumeric = numericFields.has(path) || numericProps.has(lastPart);
    const nextValue = isCheckbox ? Boolean(value) : shouldBeNumeric ? Number(value) : value;
    this._setPath(next, parts, nextValue);
    this._config = next;
    this._dispatchConfig(next);
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
      if (cursor[key] === undefined || cursor[key] === null) {
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

  _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  _renderEntityInput(metric) {
    const selected = this._config?.entities?.[metric.key] || "";
    const label = this._metricLabel(metric);
    return `
      <label>${this._escape(this._t("editor.entity"))}
        <input data-path="entities.${metric.key}" list="ha-solar-dashboard-entities" placeholder="${this._escape(this._t("editor.entityPlaceholder", { label }))}" value="${this._escape(selected)}" autocomplete="off" />
      </label>
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

  _houseVariant() {
    const house = this._normalizeHouse(this._config.house) || "single_family_home";
    return HOUSE_VARIANTS[house] || HOUSE_VARIANTS.single_family_home;
  }

  _metricVisible(metric) {
    const configured = this._config.visible_boxes?.[metric.key];
    if (configured !== undefined) return configured !== false;
    return this._houseVariant().visible_boxes?.[metric.key] !== false;
  }

  _metricLabel(metric) {
    const variant = this._houseVariant();
    if (variant.labelKeys?.[metric.key]) return this._t(variant.labelKeys[metric.key], {}, variant.labels?.[metric.key] || metric.label);
    if (variant.labels?.[metric.key]) return this._t(`metrics.${metric.key}`, {}, variant.labels[metric.key]);
    return this._t(`metrics.${metric.key}`, {}, metric.label);
  }

  _metricPosition(metric) {
    const variant = this._houseVariant();
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
        ${this._renderEntityInput(metric)}
        ${this._renderUnitSelect(metric)}
        <label>${this._escape(this._t("editor.xPosition"))} (${this._escape(left)})
          <input type="range" min="4" max="96" step="1" data-path="positions.${metric.key}.left" value="${this._escape(left)}" />
        </label>
        <label>${this._escape(this._t("editor.yPosition"))} (${this._escape(top)})
          <input type="range" min="4" max="96" step="1" data-path="positions.${metric.key}.top" value="${this._escape(top)}" />
        </label>
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

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const house = this._normalizeHouse(this._config.house) || "single_family_home";
    const houseOptions = Object.entries(HOUSE_VARIANTS)
      .map(([key, value]) => `<option value="${this._escape(key)}"${key === house ? " selected" : ""}>${this._escape(this._houseLabel(key, value))}</option>`)
      .join("");
    const entityOptions = this._entityOptions()
      .map((entityId) => `<option value="${this._escape(entityId)}"></option>`)
      .join("");
    const customKpis = Array.isArray(this._config.custom_kpis) ? this._config.custom_kpis : [];
    const customKpiFields = customKpis.map((kpi, index) => this._renderCustomKpiField(kpi, index)).join("");

    this.shadowRoot.innerHTML = `
      <style>
        .editor{display:grid;gap:12px;font-family:system-ui,sans-serif;min-width:0;max-width:100%;overflow:hidden}
        label{display:grid;gap:4px;font-size:13px;min-width:0;max-width:100%}
        input,select,button{box-sizing:border-box;min-width:0;max-width:100%;padding:8px;border:1px solid #bbb;border-radius:8px;text-overflow:ellipsis}
        input,select{width:100%}
        button{width:auto;background:#f7f7f7;cursor:pointer}
        .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;min-width:0}
        .section-title{font-size:13px;font-weight:700;margin-top:4px}
        .box-field{display:grid;gap:8px;min-width:0;box-sizing:border-box;padding:10px;border:1px solid #ddd;border-radius:8px}
        .kpi-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;min-width:0}
        .kpi-head strong{min-width:0;overflow-wrap:anywhere}
        .inline{display:flex;align-items:center;gap:8px}
        .inline input{width:auto;min-width:auto;padding:0}
        @media (max-width:700px){.grid{grid-template-columns:minmax(0,1fr)}}
      </style>
      <div class="editor">
        <label>${this._escape(this._t("editor.title"))} <input data-path="title" value="${this._escape(this._config.title || "")}" /></label>
        <label>${this._escape(this._t("editor.timeLabel"))} <input data-path="time_label" value="${this._escape(this._config.time_label || "")}" /></label>
        <label>${this._escape(this._t("editor.houseType"))} <select data-path="house">${houseOptions}</select></label>
        <label>${this._escape(this._t("editor.customImage"))} <input data-path="image" placeholder="/local/solar/single_family_home/single_family_home.png or https://..." value="${this._escape(this._config.image || "")}" /></label>
        <label>${this._escape(this._t("editor.customDayImage"))} <input data-path="day_image" placeholder="${this._escape(this._t("editor.optionalDayImage"))}" value="${this._escape(this._config.day_image || "")}" /></label>
        <label>${this._escape(this._t("editor.weatherEntity"))}
          <input data-path="weather_entity" list="ha-solar-dashboard-entities" placeholder="weather.home" value="${this._escape(this._config.weather_entity || "")}" autocomplete="off" />
        </label>
        <label><input type="checkbox" data-path="show_title" ${this._config.show_title !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showTitle"))}</label>
        <label><input type="checkbox" data-path="show_time_label" ${this._config.show_time_label !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showLiveLabel"))}</label>
        <label><input type="checkbox" data-path="show_house_selector" ${this._config.show_house_selector !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showHouseSelector"))}</label>
        <label><input type="checkbox" data-path="show_metric_tiles" ${this._config.show_metric_tiles !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showMetricTiles"))}</label>
        <label><input type="checkbox" data-path="show_status_label" ${this._config.show_status_label !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showStatusLabel"))}</label>
        <label><input type="checkbox" data-path="show_weather_status" ${this._config.show_weather_status === true ? "checked" : ""}/> ${this._escape(this._t("editor.showWeatherStatus"))}</label>
        <label>${this._escape(this._t("editor.importExportEntity"))}
          <input data-path="entities.import_export_power" list="ha-solar-dashboard-entities" placeholder="sensor.grid_power" value="${this._escape(this._config.entities?.import_export_power || "")}" autocomplete="off" />
        </label>
        ${this._renderUnitSelect({ key: "import_export_power", label: "Import/Export", unit: "power" })}
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
        <datalist id="ha-solar-dashboard-entities">${entityOptions}</datalist>
        <div class="section-title">${this._escape(this._t("editor.sectionBoxes"))}</div>
        <div class="grid">${TILE_METRICS.map((metric) => this._renderBoxField(metric)).join("")}</div>
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
      });
    });

    this._rendered = true;
  }
}

if (!customElements.get(CARD_TYPE)) customElements.define(CARD_TYPE, HaSolarDashboardCard);
if (!customElements.get(CARD_EDITOR_TYPE)) customElements.define(CARD_EDITOR_TYPE, HaSolarDashboardCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: "HA Solar Dashboard Card",
    description: "PV energy overview dashboard card",
  });
}
