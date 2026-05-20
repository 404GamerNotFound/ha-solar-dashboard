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

const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["en", "de", "es", "fr", "pl"];
const I18N = {};
const I18N_LOADS = new Map();

function translationUrl(language) {
  return new URL(`i18n/${language}.json`, import.meta.url).href;
}

function loadTranslation(language) {
  const normalizedLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
  if (I18N[normalizedLanguage]) return Promise.resolve(I18N[normalizedLanguage]);
  if (I18N_LOADS.has(normalizedLanguage)) return I18N_LOADS.get(normalizedLanguage);
  if (typeof fetch !== "function") {
    I18N[normalizedLanguage] = {};
    return Promise.resolve(I18N[normalizedLanguage]);
  }
  const request = fetch(translationUrl(normalizedLanguage))
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((dictionary) => {
      I18N[normalizedLanguage] = dictionary && typeof dictionary === "object" ? dictionary : {};
      return I18N[normalizedLanguage];
    })
    .catch((error) => {
      console.warn(`HA Solar Dashboard: could not load i18n/${normalizedLanguage}.json`, error);
      I18N[normalizedLanguage] = {};
      return I18N[normalizedLanguage];
    });
  I18N_LOADS.set(normalizedLanguage, request);
  return request;
}

function ensureTranslations(language, callback) {
  const normalizedLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
  const languages = [...new Set([DEFAULT_LANGUAGE, normalizedLanguage])];
  return Promise.all(languages.map((item) => loadTranslation(item))).then(() => callback?.());
}

function languageFromHass(hass) {
  const rawLanguage = hass?.locale?.language
    || hass?.language
    || hass?.selectedLanguage
    || globalThis.navigator?.language
    || DEFAULT_LANGUAGE;
  const language = String(rawLanguage).toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
}

function translate(language, key, replacements = {}, fallback = "") {
  const dictionary = I18N[language] || {};
  const fallbackDictionary = I18N[DEFAULT_LANGUAGE] || {};
  const template = dictionary[key] ?? fallbackDictionary[key] ?? fallback ?? key;
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

const LARGE_CONSUMER_DEFINITIONS = [
  { id: "washing_machine", labelKey: "consumer.washing_machine", label: "Washing machine", color: "#34d399", maxPowerKw: 2.2 },
  { id: "dishwasher", labelKey: "consumer.dishwasher", label: "Dishwasher", color: "#38bdf8", maxPowerKw: 2.0 },
  { id: "space_heater", labelKey: "consumer.space_heater", label: "Fan heater", color: "#fb923c", maxPowerKw: 2.0 },
  { id: "dryer", labelKey: "consumer.dryer", label: "Dryer", color: "#facc15", maxPowerKw: 2.8 },
  { id: "dhw_heatpump", labelKey: "consumer.dhw_heatpump", label: "Domestic hot water heat pump", color: "#60a5fa", maxPowerKw: 0.8 },
];

const LEGACY_LARGE_CONSUMER_DEFINITIONS = new Map([
  ["custom_1", { id: "custom_1", labelKey: "consumer.custom", label: "Custom", color: "#a78bfa", maxPowerKw: "", custom: true }],
]);

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

function normalizeConfigId(value, fallback) {
  const id = String(value || fallback || "").trim().replace(/[^\w-]+/g, "_");
  return id || String(fallback || "item").replace(/[^\w-]+/g, "_");
}

function clampConfigNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function safeConfigColor(color, fallback = "#1f8fff") {
  const value = String(color || "").trim();
  if (!value) return fallback;
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
  if (/^(rgb|rgba|hsl|hsla)\([\d\s.,%/-]+\)$/i.test(value)) return value;
  if (/^var\(--[\w-]+\)$/i.test(value)) return value;
  if (/^[a-z]+$/i.test(value)) return value;
  return fallback;
}

function normalizeLargeConsumerConfig(raw, index, definition) {
  const source = raw && typeof raw === "object" ? raw : {};
  const id = normalizeConfigId(source.id || source.key || source.type, definition?.id || `consumer_${index + 1}`);
  const maxPowerSource = source.max_power_kw ?? source.maxPowerKw ?? source.max_power ?? definition?.maxPowerKw ?? "";
  const maxPowerKw = maxPowerSource === "" || maxPowerSource === undefined || maxPowerSource === null
    ? ""
    : clampConfigNumber(maxPowerSource, "", 0, 1000);
  return {
    id,
    type: String(source.type || definition?.id || id).trim(),
    labelKey: definition?.labelKey || "",
    defaultLabel: definition?.label || `Consumer ${index + 1}`,
    label: String(source.label || source.name || "").trim(),
    power_entity: String(source.power_entity || source.powerEntity || source.entity || source.entity_id || source.power || "").trim(),
    voltage_entity: String(source.voltage_entity || source.voltageEntity || source.voltage || "").trim(),
    energy_entity: String(source.energy_entity || source.energyEntity || source.kwh_entity || source.energy || source.counter || source.meter || "").trim(),
    max_power_kw: maxPowerKw,
    position: clampConfigNumber(source.position ?? source.order ?? 200 + index, 200 + index, 0, 999),
    columns: Math.round(clampConfigNumber(source.columns ?? source.span ?? 1, 1, 1, 6)),
    color: safeConfigColor(source.color, definition?.color || "#1f8fff"),
    custom: source.custom === true || definition?.custom === true || !definition,
    visible: source.enabled === false ? false : source.visible !== false,
  };
}

function normalizeLargeConsumers(consumers) {
  const rawList = Array.isArray(consumers)
    ? consumers
    : consumers && typeof consumers === "object"
      ? Object.entries(consumers).map(([id, value]) => (
        value && typeof value === "object" ? { id, ...value } : { id, power_entity: value }
      ))
      : [];
  const definitionIds = new Set(LARGE_CONSUMER_DEFINITIONS.map((definition) => definition.id));
  const rawById = new Map();
  rawList.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const fallbackId = item.type || `consumer_${index + 1}`;
    rawById.set(normalizeConfigId(item.id || item.key || item.type, fallbackId), item);
  });
  const defaultConsumers = LARGE_CONSUMER_DEFINITIONS.map((definition, index) => (
    normalizeLargeConsumerConfig(rawById.get(definition.id) || {}, index, definition)
  ));
  const extraConsumers = rawList
    .map((item, index) => ({ item, id: normalizeConfigId(item?.id || item?.key || item?.type, `consumer_${index + 1}`) }))
    .filter(({ item, id }) => item && typeof item === "object" && !definitionIds.has(id))
    .map(({ item, id }, index) => normalizeLargeConsumerConfig(item, LARGE_CONSUMER_DEFINITIONS.length + index, LEGACY_LARGE_CONSUMER_DEFINITIONS.get(id)));
  return [...defaultConsumers, ...extraConsumers];
}

function normalizePvRoofStringDisplay(value) {
  const normalized = String(value || "sum").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    add: "sum",
    added: "sum",
    summed: "sum",
    total: "sum",
    zusammen: "sum",
    summe: "sum",
    liste: "values",
    list: "values",
    split: "values",
    separate: "values",
    values_inline: "values",
    highest: "dominant",
    max: "dominant",
    dominant_value: "dominant",
    high_low: "dominant",
    strongest: "dominant",
    staerkster: "dominant",
    stärkster: "dominant",
  };
  const key = aliases[normalized] || normalized;
  return ["sum", "values", "dominant"].includes(key) ? key : "sum";
}

function normalizePvRoofStringConfig(raw, index) {
  const source = raw && typeof raw === "object" ? raw : { power_entity: raw };
  const id = normalizeConfigId(source.id || source.key || source.name || source.label, `string_${index + 2}`);
  const maxPowerSource = source.max_power_kw ?? source.maxPowerKw ?? source.max_power ?? source.maxPower ?? "";
  const maxPowerKw = maxPowerSource === "" || maxPowerSource === undefined || maxPowerSource === null
    ? ""
    : clampConfigNumber(maxPowerSource, "", 0, 1000);
  return {
    id,
    label: String(source.label || source.name || `String ${index + 2}`).trim(),
    power_entity: String(source.power_entity || source.powerEntity || source.entity || source.entity_id || source.power || "").trim(),
    energy_entity: String(source.energy_entity || source.energyEntity || source.kwh_entity || source.kwh || source.energy || source.counter || source.meter || "").trim(),
    max_power_kw: maxPowerKw,
    visible: source.enabled === false ? false : source.visible !== false,
  };
}

function normalizePvRoofStrings(strings) {
  const rawList = Array.isArray(strings)
    ? strings
    : strings && typeof strings === "object"
      ? Object.entries(strings).map(([id, value]) => (
        value && typeof value === "object" ? { id, ...value } : { id, power_entity: value }
      ))
      : [];
  return rawList
    .map((item, index) => normalizePvRoofStringConfig(item, index))
    .filter((item) => item.visible !== false || item.power_entity || item.energy_entity || item.label);
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
    if (this.config && this.shadowRoot) {
      this._ensureTranslationsForRender();
      this._updateReadings();
      this._syncAdvisorRefreshTimer(this._currentViewMode() === "advisor");
    }
  }

  disconnectedCallback() {
    this._isCardConnected = false;
    this._asyncRequestToken = (this._asyncRequestToken || 0) + 1;
    this._energyRangeLoading?.clear();
    this._overlayConsumptionLoading?.clear();
    this._stopAdvisorRefreshTimer();
  }

  static getConfigElement() {
    return document.createElement(CARD_EDITOR_TYPE);
  }

  static getStubConfig() {
    return {
      type: `custom:${CARD_TYPE}`,
      title: "Solar Dashboard",
      house: "single_family_home",
      view_mode: "house",
      show_title: true,
      show_view_selector: true,
      show_house_selector: true,
      show_energy_range_selector: false,
      show_metric_tiles: true,
      show_large_consumers: true,
      show_power_flows: false,
      show_status_label: true,
      show_weather_status: false,
      show_grid_status_tile: true,
      pv_roof_string_display: "sum",
      hud_box_opacity: 0.65,
      hud_box_scale: 1,
      battery_low_threshold: 20,
      grid_neutral_threshold: 25,
      grid_voltage_warning_threshold: 245,
      grid_voltage_critical_threshold: 253,
      advisor_surplus_threshold: 250,
      advisor_import_threshold: 250,
      advisor_high_load_threshold: 3000,
      advisor_ev_surplus_threshold: 1500,
      advisor_max_suggestions: 8,
      advisor_stale_sensor_warning_minutes: 30,
      advisor_stale_sensor_critical_minutes: 1440,
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
      large_consumers: normalizeLargeConsumers([]),
      pv_roof_strings: [],
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
        battery_min_soc: "",
        battery_max_soc: "",
        battery_flow_power: "",
        battery_flow_power_voltage: "",
        battery_charge_power: "",
        battery_discharge_power: "",
        battery_temperature: "",
        battery_cycles_today: "",
        inverter_power: "sensor.wechselrichter_power",
        inverter_power_voltage: "",
        inverter_power_voltage_l1: "",
        inverter_power_voltage_l2: "",
        inverter_power_voltage_l3: "",
        wallbox_power: "sensor.wallbox_power",
        wallbox_power_voltage: "",
        wallbox_phase: "",
        wallbox_phase_action: "",
        wallbox_phase_remaining: "",
        wallbox_soc: "",
        wallbox_max_soc: "",
        wallbox_connected: "",
        wallbox_charging_enabled: "",
        wallbox_remaining_time: "",
        wallbox2_power: "",
        wallbox2_power_voltage: "",
        wallbox2_phase: "",
        wallbox2_phase_action: "",
        wallbox2_phase_remaining: "",
        wallbox2_soc: "",
        wallbox2_max_soc: "",
        wallbox2_connected: "",
        wallbox2_charging_enabled: "",
        wallbox2_remaining_time: "",
        electricity_price: "",
        pv_total_power: "sensor.pv_total_power",
        pv_total_power_voltage: "",
        pv_total_power_today_energy: "",
        pv_total_power_forecast_today: "",
        pv_total_power_peak_today: "",
        import_export_power: "sensor.grid_power",
        import_export_power_voltage: "",
        import_power: "",
        export_power: "",
        pv_roof_power_voltage: "",
        pv_shed_power_voltage: "",
        house_consumption_power_voltage: "",
      },
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");

    this._asyncRequestToken = (this._asyncRequestToken || 0) + 1;
    this._energyRangeLoading?.clear();
    this._overlayConsumptionLoading?.clear();
    this._advisorConditionSince = new Map();

    const house = this._normalizeHouse(config.house || config.variant || config.image_variant) || "single_family_home";
    const energyRange = this._normalizeEnergyRange(config.energy_range) || "live";
    const viewMode = this._normalizeViewMode(config.view_mode || config.mode || config.default_view) || "house";
    this._hasCustomTitle = Object.prototype.hasOwnProperty.call(config, "title");

    this.config = {
      title: "Energy Flow",
      house,
      view_mode: viewMode,
      show_title: true,
      show_view_selector: true,
      show_house_selector: true,
      show_energy_range_selector: false,
      show_metric_tiles: true,
      show_large_consumers: true,
      show_power_flows: false,
      show_status_label: true,
      show_weather_status: false,
      show_grid_status_tile: true,
      hud_box_opacity: 0.65,
      hud_box_scale: 1,
      battery_low_threshold: 20,
      grid_neutral_threshold: 25,
      grid_voltage_warning_threshold: 245,
      grid_voltage_critical_threshold: 253,
      advisor_surplus_threshold: 250,
      advisor_import_threshold: 250,
      advisor_high_load_threshold: 3000,
      advisor_ev_surplus_threshold: 1500,
      advisor_max_suggestions: 8,
      advisor_stale_sensor_warning_minutes: 30,
      advisor_stale_sensor_critical_minutes: 1440,
      chart_hours: 24,
      daylight_entity: "sun.sun",
      weather_entity: "",
      dynamic_tile_colors: true,
      pv_roof_string_display: "sum",
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
      large_consumers: [],
      pv_roof_strings: [],
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
      large_consumers: normalizeLargeConsumers(config.large_consumers || config.large_consumers_config || []),
      pv_roof_strings: normalizePvRoofStrings(config.pv_roof_strings || config.pv_roof_string_config || []),
      pv_roof_string_display: normalizePvRoofStringDisplay(config.pv_roof_string_display || config.pv_roof_display || "sum"),
    };
    delete this.config.show_energy_advisor;

    this.config.hud_box_opacity = this._clampNumber(this.config.hud_box_opacity, 0.65, 0, 1);
    this.config.hud_box_scale = this._clampNumber(this.config.hud_box_scale, 1, 0.6, 1.8);
    this.config.power_decimals = this._clampNumber(this.config.power_decimals, 2, 0, 3);
    this.config.battery_low_threshold = this._clampNumber(this.config.battery_low_threshold, 20, 0, 100);
    this.config.grid_neutral_threshold = this._clampNumber(this.config.grid_neutral_threshold, 25, 0, 1000000);
    this.config.grid_voltage_warning_threshold = this._clampNumber(this.config.grid_voltage_warning_threshold, 245, 0, 1000);
    this.config.grid_voltage_critical_threshold = this._clampNumber(this.config.grid_voltage_critical_threshold, 253, this.config.grid_voltage_warning_threshold, 1000);
    this.config.advisor_surplus_threshold = this._clampNumber(this.config.advisor_surplus_threshold, 250, 0, 1000000);
    this.config.advisor_import_threshold = this._clampNumber(this.config.advisor_import_threshold, 250, 0, 1000000);
    this.config.advisor_high_load_threshold = this._clampNumber(this.config.advisor_high_load_threshold, 3000, 0, 1000000);
    this.config.advisor_ev_surplus_threshold = this._clampNumber(this.config.advisor_ev_surplus_threshold, 1500, 0, 1000000);
    this.config.advisor_max_suggestions = Math.round(this._clampNumber(this.config.advisor_max_suggestions, 8, 1, 12));
    this.config.advisor_stale_sensor_warning_minutes = this._clampNumber(this.config.advisor_stale_sensor_warning_minutes, 30, 1, 10080);
    this.config.advisor_stale_sensor_critical_minutes = this._clampNumber(this.config.advisor_stale_sensor_critical_minutes, 1440, Math.max(1440, this.config.advisor_stale_sensor_warning_minutes), 20160);
    this.config.pv_roof_string_display = normalizePvRoofStringDisplay(this.config.pv_roof_string_display);
    this.config.pv_roof_strings = normalizePvRoofStrings(this.config.pv_roof_strings || []);
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
    this._ensureTranslationsForRender();
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
      this._ensureTranslationsForRender();
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

  _ensureTranslationsForRender() {
    const language = this._language();
    ensureTranslations(language, () => {
      if (!this.config || !this.shadowRoot || this._language() !== language) return;
      this._renderCardShell(this._layoutState());
    });
  }

  _displayTitle() {
    return this._hasCustomTitle ? this.config.title : this._t("card.defaultTitle", {}, this.config.title);
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
    if (metric.largeConsumer) {
      const counterEntityId = this._largeConsumerEnergyEntityId(metric);
      return counterEntityId ? { entityId: counterEntityId, mode: normalizedRange === "total" ? "direct" : "counter", range: normalizedRange } : "";
    }
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

  _getEntityLastChangedMs(entityId) {
    const rawTimestamp = this._getEntity(entityId)?.last_changed;
    const timestamp = Date.parse(rawTimestamp || "");
    return Number.isFinite(timestamp) ? timestamp : undefined;
  }

  _entityAgeMinutes(entityId) {
    const timestamp = Date.parse(this._getEntityLastUpdated(entityId) || "");
    return Number.isFinite(timestamp) ? Math.max(0, (Date.now() - timestamp) / 60000) : undefined;
  }

  _trackedConditionMinutes(key, active, sinceHintMs) {
    if (!this._advisorConditionSince) this._advisorConditionSince = new Map();
    if (!key || !active) {
      if (key) this._advisorConditionSince.delete(key);
      return undefined;
    }

    const now = Date.now();
    const hintedSince = Number.isFinite(sinceHintMs) && sinceHintMs > 0 && sinceHintMs <= now
      ? sinceHintMs
      : undefined;
    const existingSince = this._advisorConditionSince.get(key);
    const since = Number.isFinite(existingSince)
      ? Math.min(existingSince, hintedSince ?? existingSince)
      : hintedSince ?? now;
    this._advisorConditionSince.set(key, since);
    return Math.max(0, (now - since) / 60000);
  }

  _stopAdvisorRefreshTimer() {
    if (!this._advisorRefreshTimer) return;
    window.clearInterval(this._advisorRefreshTimer);
    this._advisorRefreshTimer = undefined;
  }

  _syncAdvisorRefreshTimer(active) {
    if (!active || !this._isCardConnected) {
      this._stopAdvisorRefreshTimer();
      return;
    }
    if (this._advisorRefreshTimer) return;
    this._advisorRefreshTimer = window.setInterval(() => {
      if (!this._isCardConnected || this._currentViewMode() !== "advisor") {
        this._stopAdvisorRefreshTimer();
        return;
      }
      this._updateReadings();
    }, 60000);
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
    if (metric.largeConsumer) {
      if (this._currentEnergyRange() !== "live" && metric.unit === "power") return this._metricEnergyEntityId(metric);
      return this._largeConsumerPowerEntityId(metric);
    }
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
    if (metric.largeConsumer) return metric.largeConsumer.unit || this.config.units?.power || "auto";
    const metricUnit = this.config.units?.[metric.key];
    if (metricUnit !== undefined && String(metricUnit).trim() !== "") return metricUnit;
    return this.config.units?.[metric.unit];
  }

  _isPvRoofMetric(metric) {
    return (metric?.sourceKey || metric?.key) === "pv_roof_power";
  }

  _pvRoofStringDisplayMode() {
    return normalizePvRoofStringDisplay(this.config.pv_roof_string_display);
  }

  _pvRoofBaseEnergyEntityId() {
    const config = this._energyEntityConfig("pv_roof_power");
    return String(config.entity || config.counter || config.kwh_entity || config.kwh || config.meter || "").trim();
  }

  _pvRoofStringEntries() {
    const baseMaxPower = this._parsePowerLimitWatts(this.config.max_power_kw?.pv_roof_power, "kw")
      || this._parsePowerLimitWatts(this.config.max_power_w?.pv_roof_power, "w")
      || this._parsePowerLimitWatts(this.config.max_power?.pv_roof_power, "kw");
    const baseEntry = {
      id: "string_1",
      label: "String 1",
      powerEntityId: this.config.entities?.pv_roof_power || "",
      energyEntityId: this._pvRoofBaseEnergyEntityId(),
      maxPowerWatts: baseMaxPower,
      base: true,
      visible: true,
    };
    const extraEntries = normalizePvRoofStrings(this.config.pv_roof_strings || [])
      .filter((string) => string.visible !== false)
      .map((string, index) => ({
        id: string.id || `string_${index + 2}`,
        label: string.label || `String ${index + 2}`,
        powerEntityId: string.power_entity || "",
        energyEntityId: string.energy_entity || "",
        maxPowerWatts: this._parsePowerLimitWatts(string.max_power_kw, "kw"),
        base: false,
        visible: true,
      }))
      .filter((entry) => entry.powerEntityId || entry.energyEntityId || entry.maxPowerWatts);
    return [baseEntry, ...extraEntries];
  }

  _hasAdditionalPvRoofStrings() {
    return this._pvRoofStringEntries().some((entry) => !entry.base && (entry.powerEntityId || entry.energyEntityId));
  }

  _pvRoofStringEntryPowerWatts(entry) {
    if (!entry?.powerEntityId) return undefined;
    const watts = this._valueAsWatts(this._getEntityValue(entry.powerEntityId, undefined), this._getEntityUnit(entry.powerEntityId));
    return Number.isFinite(watts) ? Math.max(0, watts) : undefined;
  }

  _pvRoofStringPowerParts() {
    return this._pvRoofStringEntries()
      .filter((entry) => entry.powerEntityId || !entry.base)
      .map((entry) => {
        const watts = this._pvRoofStringEntryPowerWatts(entry);
        return {
          ...entry,
          amount: watts,
          formatted: Number.isFinite(watts) ? this._formatPowerValue(watts, this.config.units?.power || "auto", "W") : "—",
        };
      })
      .filter((part) => part.powerEntityId || !part.base);
  }

  _pvRoofStringPowerWatts() {
    if (!this._hasAdditionalPvRoofStrings()) return undefined;
    const values = this._pvRoofStringPowerParts()
      .map((part) => part.amount)
      .filter(Number.isFinite);
    if (values.length === 0) return undefined;
    return values.reduce((sum, value) => sum + value, 0);
  }

  _pvRoofStringMaxPowerWatts() {
    if (!this._hasAdditionalPvRoofStrings()) return undefined;
    const maxValues = this._pvRoofStringEntries()
      .map((entry) => entry.maxPowerWatts)
      .filter((value) => Number.isFinite(value) && value > 0);
    if (maxValues.length === 0) return undefined;
    return maxValues.reduce((sum, value) => sum + value, 0);
  }

  _pvRoofStringEnergyParts() {
    const range = this._currentEnergyRange();
    if (range === "live") return [];
    return this._pvRoofStringEntries()
      .filter((entry) => entry.energyEntityId || !entry.base)
      .map((entry) => {
        const info = entry.energyEntityId
          ? this._energyRangeConsumptionInfoForSource({
            entityId: entry.energyEntityId,
            mode: range === "total" ? "direct" : "counter",
            range,
          })
          : undefined;
        return {
          ...entry,
          amount: info?.amount,
          loading: info?.loading,
          error: info?.error,
          formatted: info?.loading
            ? "…"
            : Number.isFinite(info?.amount)
              ? this._formatEnergyValue(info.amount, "kWh", "kWh")
              : "—",
        };
      })
      .filter((part) => part.energyEntityId || !part.base);
  }

  _pvRoofStringReadingParts(metric) {
    if (!this._isPvRoofMetric(metric) || !this._hasAdditionalPvRoofStrings()) return [];
    return this._currentEnergyRange() === "live"
      ? this._pvRoofStringPowerParts()
      : this._pvRoofStringEnergyParts();
  }

  _formatPvRoofStringReading(metric) {
    const parts = this._pvRoofStringReadingParts(metric);
    if (parts.length === 0) return "";
    if (parts.some((part) => part.loading)) return "…";
    const values = parts.map((part) => part.amount).filter(Number.isFinite);
    if (this._pvRoofStringDisplayMode() !== "sum") {
      return parts.map((part) => part.formatted).join(" / ");
    }
    if (values.length === 0) return "—";
    const total = values.reduce((sum, value) => sum + value, 0);
    return this._currentEnergyRange() === "live"
      ? this._formatPowerValue(total, this.config.units?.power || "auto", "W")
      : this._formatEnergyValue(total, "kWh", "kWh");
  }

  _renderMetricValueHtml(metric) {
    const parts = this._pvRoofStringReadingParts(metric);
    const mode = this._pvRoofStringDisplayMode();
    if (parts.length === 0 || mode === "sum") return this._escape(this._formatReading(metric));
    const orderedParts = mode === "dominant"
      ? [...parts].sort((a, b) => (Number.isFinite(b.amount) ? b.amount : -Infinity) - (Number.isFinite(a.amount) ? a.amount : -Infinity))
      : parts;
    const valueHtml = orderedParts.map((part, index) => {
      const className = mode === "dominant" && index > 0 ? "value-part value-secondary" : "value-part";
      return `<span class="${className}" title="${this._escape(part.label || "")}">${this._escape(part.formatted)}</span>`;
    }).join(`<span class="value-separator">/</span>`);
    return `<span class="value-combo value-combo-${this._escape(mode)}">${valueHtml}</span>`;
  }

  _formatReading(metric) {
    if (metric.gridStatus) return this._formatGridStatusReading();
    if (metric.overlay) return this._formatOverlayReading(metric.overlay);
    if (metric.customKpi) return this._formatCustomKpiValue(metric.customKpi);
    if (metric.key === "import_export_power") return this._formatGridValueReading();
    if (this._isPvRoofMetric(metric)) {
      const stringReading = this._formatPvRoofStringReading(metric);
      if (stringReading) return stringReading;
    }
    if (this._currentEnergyRange() !== "live" && metric.unit === "power") {
      return this._formatEnergyRangeReading(metric);
    }
    const entityId = this._metricEntityId(metric);
    const fallbackValue = entityId ? undefined : metric.largeConsumer ? "" : "0";
    const value = this._getEntityValue(entityId, fallbackValue);
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

  _largeConsumerLabel(consumer, index = 0) {
    const configured = String(consumer?.label || "").trim();
    if (configured) return configured;
    if (consumer?.labelKey) return this._t(consumer.labelKey, {}, consumer.defaultLabel || `Consumer ${index + 1}`);
    return this._t(`consumer.${consumer?.type || consumer?.id}`, {}, consumer?.defaultLabel || `Consumer ${index + 1}`);
  }

  _largeConsumerHasEntity(consumer) {
    return Boolean(consumer?.power_entity || consumer?.energy_entity);
  }

  _largeConsumerMetrics() {
    return (this.config.large_consumers || [])
      .filter((consumer) => consumer?.visible !== false && this._largeConsumerHasEntity(consumer))
      .map((consumer, index) => ({
        key: `large_consumers.${consumer.id || index}`,
        label: this._largeConsumerLabel(consumer, index),
        unit: "power",
        color: "blue",
        accentColor: consumer.color,
        largeConsumer: consumer,
        hud: false,
        tileOrder: consumer.position ?? 200 + index,
        tileColumns: consumer.columns ?? 1,
      }))
      .sort((a, b) => (a.tileOrder ?? 0) - (b.tileOrder ?? 0));
  }

  _largeConsumerPowerEntityId(metricOrConsumer) {
    return metricOrConsumer?.largeConsumer?.power_entity || metricOrConsumer?.power_entity || "";
  }

  _largeConsumerEnergyEntityId(metricOrConsumer) {
    return metricOrConsumer?.largeConsumer?.energy_entity || metricOrConsumer?.energy_entity || "";
  }

  _largeConsumerVoltageEntityId(metricOrConsumer) {
    return metricOrConsumer?.largeConsumer?.voltage_entity || metricOrConsumer?.voltage_entity || "";
  }

  _metricVoltageEntityKey(metric) {
    if (!metric || metric.unit !== "power") return "";
    if (metric.largeConsumer) return "";
    return `${metric.sourceKey || metric.key}_voltage`;
  }

  _metricVoltagePhaseDefinitions(metric) {
    const key = metric?.sourceKey || metric?.key;
    if (key !== "inverter_power") return [];
    return [
      { key: "inverter_power_voltage_l1", phase: "L1" },
      { key: "inverter_power_voltage_l2", phase: "L2" },
      { key: "inverter_power_voltage_l3", phase: "L3" },
    ];
  }

  _metricVoltageEntityDefinitions(metric) {
    if (!metric || metric.unit !== "power") return [];
    if (metric.largeConsumer) {
      return [{
        key: `large_consumers.${metric.largeConsumer.id || metric.key}.voltage`,
        entityId: this._largeConsumerVoltageEntityId(metric),
        phase: "",
      }];
    }
    const key = metric.sourceKey || metric.key;
    const baseKey = this._metricVoltageEntityKey(metric);
    const aliases = [
      baseKey,
      `${key}_volt`,
      `${key}_volts`,
    ];
    if (key === "import_export_power") aliases.push("grid_voltage", "voltage", "netzspannung");
    if (key === "house_consumption_power") aliases.push("house_voltage", "home_voltage");
    return [
      {
        key: baseKey,
        entityId: aliases.map((alias) => this.config.entities?.[alias]).find(Boolean) || "",
        phase: "",
      },
      ...this._metricVoltagePhaseDefinitions(metric).map((definition) => ({
        ...definition,
        entityId: this.config.entities?.[definition.key] || "",
      })),
    ];
  }

  _metricVoltageEntityId(metric) {
    return this._metricVoltageEntityDefinitions(metric).map((definition) => definition.entityId).find(Boolean) || "";
  }

  _metricVoltageEntries(metric, variant = this._currentVariant || this._layoutState().variant) {
    if (!metric || metric.unit !== "power") return [];
    const baseLabel = this._metricLabel(metric, variant);
    const seen = new Set();
    const entries = [];
    this._metricVoltageEntityDefinitions(metric).forEach((definition) => {
      if (!definition.entityId || seen.has(definition.entityId)) return;
      seen.add(definition.entityId);
      const entity = this._getEntity(definition.entityId);
      const value = this._formatVoltageValue(entity?.state, entity?.attributes?.unit_of_measurement || "V");
      if (value === "—") return;
      const volts = this._valueAsVolts(entity?.state, entity?.attributes?.unit_of_measurement || "V");
      entries.push({
        ...definition,
        metric,
        entityId: definition.entityId,
        volts,
        label: definition.phase ? `${baseLabel} ${definition.phase}` : baseLabel,
        value,
        displayValue: definition.phase ? `${definition.phase} ${value}` : value,
      });
    });
    return entries;
  }

  _metricVoltageLabel(metric) {
    return this._metricVoltageEntries(metric)
      .map((entry) => entry.displayValue)
      .filter(Boolean)
      .join(" / ");
  }

  _voltageSensorEntries() {
    const variant = this._currentVariant || this._layoutState().variant;
    const batteryVoltageEntityId = this._batteryVoltageEntityId();
    const batteryMetric = TILE_METRICS.find((metric) => metric.key === "battery_level") || { key: "battery_level", label: "Battery", unit: "battery" };
    const metrics = [
      ...this._visibleMetrics(variant),
      ...this._largeConsumerMetrics(),
      ...(this._hasGridPowerSource() ? [STATUS_METRIC] : []),
    ];
    const seen = new Set();
    const entries = metrics
      .flatMap((metric) => this._metricVoltageEntries(metric, variant))
      .map((entry) => {
        if (!entry.entityId || seen.has(entry.entityId) || !Number.isFinite(entry.volts)) return undefined;
        seen.add(entry.entityId);
        return entry;
      })
      .filter(Boolean);
    if (batteryVoltageEntityId && !seen.has(batteryVoltageEntityId)) {
      const entity = this._getEntity(batteryVoltageEntityId);
      const volts = this._valueAsVolts(entity?.state, entity?.attributes?.unit_of_measurement || "V");
      if (Number.isFinite(volts)) {
        return [
          ...entries,
          {
            metric: batteryMetric,
            entityId: batteryVoltageEntityId,
            volts,
            label: this._metricLabel(batteryMetric, variant),
            value: this._formatVoltageValue(entity.state, entity.attributes?.unit_of_measurement || "V"),
          },
        ];
      }
    }
    return entries;
  }

  _gridVoltageAlert() {
    const entries = this._voltageSensorEntries();
    const highest = entries.sort((a, b) => b.volts - a.volts)[0];
    if (!highest) return undefined;
    const warningThreshold = this._clampNumber(this.config.grid_voltage_warning_threshold, 245, 0, 1000);
    const criticalThreshold = this._clampNumber(this.config.grid_voltage_critical_threshold, 253, warningThreshold, 1000);
    if (highest.volts >= criticalThreshold) {
      return {
        ...highest,
        type: "critical",
        label: this._t("warning.gridVoltageCritical", {}, "Grid voltage much too high"),
      };
    }
    if (highest.volts >= warningThreshold) {
      return {
        ...highest,
        type: "warning",
        label: this._t("warning.gridVoltageHigh", {}, "High grid voltage"),
      };
    }
    return undefined;
  }

  _renderVoltageMetaRow(metric, { placement = "footer" } = {}) {
    if (!metric || metric.unit !== "power") return "";
    const entries = this._metricVoltageEntries(metric)
      .filter((entry) => this._showLabelIn(entry.key, placement));
    if (entries.length === 0) return "";
    const badges = entries.map((entry) => {
      const tooltip = `${this._t("tooltip.voltage", {}, "Voltage")}: ${entry.label} ${entry.value}`;
      return `<span class="voltage-badge${this._labelVisibilityClass(entry.key, placement)}" data-voltage="${this._escape(metric.key)}" data-voltage-key="${this._escape(entry.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}">${this._escape(entry.displayValue)}</span>`;
    }).join("");
    return `
      <div class="meta-row voltage-meta-row">
        ${badges}
      </div>
    `;
  }

  _largeConsumerPowerWatts(metricOrConsumer) {
    const entityId = this._largeConsumerPowerEntityId(metricOrConsumer);
    if (!entityId) return undefined;
    const value = this._getEntityValue(entityId, undefined);
    const watts = this._valueAsWatts(value, this._getEntityUnit(entityId));
    return Number.isFinite(watts) ? Math.max(0, watts) : undefined;
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
    const largeConsumerEntities = (this.config.large_consumers || [])
      .flatMap((consumer) => [consumer.power_entity, consumer.voltage_entity, consumer.energy_entity])
      .filter(Boolean);
    const pvRoofStringEntities = normalizePvRoofStrings(this.config.pv_roof_strings || [])
      .flatMap((string) => [string.power_entity, string.energy_entity])
      .filter(Boolean);
    const timestamps = [
      ...Object.values(this.config.entities || {}),
      ...largeConsumerEntities,
      ...pvRoofStringEntities,
    ]
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

  _gridSplitPowerDetails() {
    const importEntityId = this._gridImportEntityId();
    const exportEntityId = this._gridExportEntityId();
    if (!importEntityId || !exportEntityId) return undefined;
    const importValue = this._entityFlowValue(importEntityId);
    const exportValue = this._entityFlowValue(exportEntityId);
    return {
      importEntityId,
      exportEntityId,
      importWatts: Math.abs(importValue?.kind === "energy" ? importValue.amount * 1000 : importValue?.amount || 0),
      exportWatts: Math.abs(exportValue?.kind === "energy" ? exportValue.amount * 1000 : exportValue?.amount || 0),
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
    return [
      updatedAt ? this._t("status.lastUpdated", { time: updatedAt }) : "",
      weather,
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

  _valueAsVolts(value, unit) {
    const numericValue = numericState(value);
    if (!Number.isFinite(numericValue)) return undefined;
    const normalizedUnit = this._normalizeUnit(unit);
    if (normalizedUnit === "kv") return numericValue * 1000;
    if (normalizedUnit === "mv") return numericValue / 1000;
    return numericValue;
  }

  _formatVoltageValue(rawValue, entityUnit = "V") {
    const value = this._formatValue(rawValue);
    if (value === "—") return value;
    const volts = this._valueAsVolts(rawValue, entityUnit);
    if (!Number.isFinite(volts)) return entityUnit ? `${value} ${entityUnit}` : String(value);
    const decimals = Math.abs(volts) >= 100 || Number.isInteger(volts) ? 0 : 1;
    return `${volts.toFixed(decimals)} V`;
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

  _energyRangeConsumptionInfoForSource(source) {
    const range = this._normalizeEnergyRange(source?.range) || this._currentEnergyRange();
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

  _energyRangeConsumptionInfo(metric) {
    const range = this._currentEnergyRange();
    return this._energyRangeConsumptionInfoForSource(this._metricEnergySource(metric, range));
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
    if (metric.largeConsumer) {
      if (this._currentEnergyRange() !== "live") {
        const info = this._energyRangeConsumptionInfo(metric);
        return Number.isFinite(info?.amount) ? info.amount : undefined;
      }
      return this._largeConsumerPowerWatts(metric);
    }
    if ((metric.sourceKey || metric.key) === "import_export_power") {
      const flowInfo = this._gridFlowInfo();
      return Number.isFinite(flowInfo?.watts) ? flowInfo.watts : undefined;
    }
    if (this._isPvRoofMetric(metric)) {
      if (this._currentEnergyRange() !== "live") {
        const values = this._pvRoofStringEnergyParts()
          .map((part) => part.amount)
          .filter(Number.isFinite);
        if (values.length > 0) return values.reduce((sum, value) => sum + value, 0);
      } else {
        const watts = this._pvRoofStringPowerWatts();
        if (Number.isFinite(watts)) return watts;
      }
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

  _batterySocEntityId() {
    return this.config.entities?.battery_level || "";
  }

  _batteryMinSocEntityId() {
    const aliases = ["battery_min_soc", "battery_minimum_soc", "battery_reserve_soc", "battery_backup_reserve", "battery_level_min_soc"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _batteryMaxSocEntityId() {
    const aliases = ["battery_max_soc", "battery_maximum_soc", "battery_target_soc", "battery_soc_limit", "battery_charge_limit", "battery_level_max_soc"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _batteryMinSocPercent() {
    return this._numericPercentFromEntity(this._batteryMinSocEntityId());
  }

  _batteryMaxSocPercent() {
    return this._numericPercentFromEntity(this._batteryMaxSocEntityId());
  }

  _batteryCyclesTodayEntityId() {
    const aliases = ["battery_cycles_today", "battery_full_cycles_today", "battery_daily_cycles", "battery_cycles_day"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _batteryCyclesToday() {
    const entityId = this._batteryCyclesTodayEntityId();
    if (!entityId) return undefined;
    const value = numericState(this._getEntityValue(entityId, undefined));
    return Number.isFinite(value) ? Math.max(0, value) : undefined;
  }

  _batteryReserveThreshold() {
    return this._batteryMinSocPercent() ?? this._clampNumber(this.config.battery_low_threshold, 20, 0, 100);
  }

  _batteryFullThreshold() {
    return this._batteryMaxSocPercent() ?? 92;
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
    if (metric.largeConsumer) return this._parsePowerLimitWatts(metric.largeConsumer.max_power_kw, "kw");
    if (this._isPvRoofMetric(metric)) {
      const stringMaxPower = this._pvRoofStringMaxPowerWatts();
      if (Number.isFinite(stringMaxPower)) return stringMaxPower;
    }
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
      <div class="battery-flow ${info.direction}${showLabel ? " with-label" : ""}${this._labelVisibilityClass("battery_flow_power", placement)}" data-battery-flow title="${this._escape(label)}" aria-label="${this._escape(label)}">
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

  _batteryVoltageEntityId() {
    const aliases = ["battery_flow_power_voltage", "battery_voltage", "battery_level_voltage"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _batteryVoltageLabel() {
    const entityId = this._batteryVoltageEntityId();
    if (!entityId) return "";
    const label = this._formatVoltageValue(this._getEntityValue(entityId, undefined), this._getEntityUnit(entityId) || "V");
    return label === "—" ? "" : label;
  }

  _renderBatteryVoltage(metric, { placement = "footer" } = {}) {
    if (metric.key !== "battery_level" || !this._batteryVoltageEntityId()) return "";
    const key = "battery_flow_power_voltage";
    if (!this._showLabelIn(key, placement)) return "";
    const label = this._batteryVoltageLabel();
    const tooltip = `${this._t("tooltip.voltage", {}, "Voltage")}: ${label}`;
    return `
      <span class="voltage-badge${this._labelVisibilityClass(key, placement)}" data-battery-voltage title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _batteryTemperatureCelsius() {
    const entityId = this._batteryTemperatureEntityId();
    if (!entityId) return undefined;
    const value = numericState(this._getEntityValue(entityId, undefined));
    if (!Number.isFinite(value)) return undefined;
    const unit = String(this._getEntityUnit(entityId) || "°C").trim().toLowerCase();
    if (unit.includes("°f") || unit === "f" || unit.includes("fahrenheit")) return (value - 32) * (5 / 9);
    return value;
  }

  _renderBatteryTemperature(metric, { placement = "footer" } = {}) {
    if (metric.key !== "battery_level" || !this._batteryTemperatureEntityId()) return "";
    if (!this._showLabelIn("battery_temperature", placement)) return "";
    const label = this._batteryTemperatureLabel();
    const tooltip = `${this._t("tooltip.temperature", {}, "Temperature")}: ${label}`;
    return `
      <span class="temp-badge${this._labelVisibilityClass("battery_temperature", placement)}" data-battery-temperature title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _renderBatteryMetaRow(metric, { showFlowLabel = true, placement = showFlowLabel ? "footer" : "image" } = {}) {
    const metaHtml = [
      this._renderBatteryFlow(metric, { showLabel: showFlowLabel, placement }),
      this._renderBatteryTemperature(metric, { placement }),
      this._renderBatteryVoltage(metric, { placement }),
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
      <span class="pv-badge${this._labelVisibilityClass(key, placement)}" data-pv-label="${this._escape(key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${text ? "" : "display:none"}">${this._escape(text)}</span>
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
      <span class="phase-badge${this._labelVisibilityClass(entityKey, placement)}" data-phase="${this._escape(metric.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
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

  _numericPercentFromEntity(entityId) {
    if (!entityId) return undefined;
    const rawValue = this._getEntityValue(entityId, undefined);
    const normalized = String(rawValue ?? "").trim().toLowerCase();
    if (!normalized || ["unknown", "unavailable", "none", "null", "offline"].includes(normalized)) return undefined;
    const numericValue = Number(String(rawValue).replace(",", ".").replace("%", ""));
    if (!Number.isFinite(numericValue)) return undefined;
    return Math.max(0, Math.min(100, numericValue));
  }

  _wallboxSocPercent(metric) {
    return this._numericPercentFromEntity(this._wallboxSocEntityId(metric));
  }

  _wallboxMaxSocEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_max_soc";
    if (metric?.key === "wallbox2_power") return "wallbox2_max_soc";
    return "";
  }

  _wallboxMaxSocEntityId(metric) {
    const entityKey = this._wallboxMaxSocEntityKey(metric);
    if (!entityKey) return "";
    const aliases = entityKey === "wallbox2_max_soc"
      ? ["wallbox2_max_soc", "wallbox2_target_soc", "wallbox2_soc_limit", "wallbox2_charge_limit", "wallbox2_vehicle_max_soc", "wallbox2_car_max_soc"]
      : ["wallbox_max_soc", "wallbox_target_soc", "wallbox_soc_limit", "wallbox_charge_limit", "wallbox_vehicle_max_soc", "wallbox_car_max_soc"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _wallboxMaxSocPercent(metric) {
    return this._numericPercentFromEntity(this._wallboxMaxSocEntityId(metric));
  }

  _stateAsBoolean(rawValue) {
    const normalized = String(rawValue ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (!normalized || ["unknown", "unavailable", "none", "null", "offline"].includes(normalized)) return undefined;
    if (["on", "true", "1", "yes", "ja", "connected", "plugged", "plugged_in", "home", "enabled", "active", "ready", "verbunden", "eingesteckt", "angeschlossen", "freigegeben", "aktiviert"].includes(normalized)) return true;
    if (["off", "false", "0", "no", "nein", "disconnected", "unplugged", "not_connected", "away", "disabled", "inactive", "nicht_verbunden", "ausgesteckt", "getrennt", "gesperrt", "deaktiviert"].includes(normalized)) return false;
    return undefined;
  }

  _wallboxBooleanEntityState(entityId) {
    if (!entityId) return undefined;
    const direct = this._stateAsBoolean(this._getEntityValue(entityId, undefined));
    if (direct !== undefined) return direct;
    const entity = this._hass?.states?.[entityId];
    return this._stateAsBoolean(entity?.state);
  }

  _wallboxConnectedEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_connected";
    if (metric?.key === "wallbox2_power") return "wallbox2_connected";
    return "";
  }

  _wallboxConnectedEntityId(metric) {
    const entityKey = this._wallboxConnectedEntityKey(metric);
    if (!entityKey) return "";
    const aliases = entityKey === "wallbox2_connected"
      ? ["wallbox2_connected", "wallbox2_plugged_in", "wallbox2_vehicle_connected", "wallbox2_car_connected", "wallbox2_cable_connected"]
      : ["wallbox_connected", "wallbox_plugged_in", "wallbox_vehicle_connected", "wallbox_car_connected", "wallbox_cable_connected"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _wallboxConnectedState(metric) {
    return this._wallboxBooleanEntityState(this._wallboxConnectedEntityId(metric));
  }

  _wallboxChargingEnabledEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_charging_enabled";
    if (metric?.key === "wallbox2_power") return "wallbox2_charging_enabled";
    return "";
  }

  _wallboxChargingEnabledEntityId(metric) {
    const entityKey = this._wallboxChargingEnabledEntityKey(metric);
    if (!entityKey) return "";
    const aliases = entityKey === "wallbox2_charging_enabled"
      ? ["wallbox2_charging_enabled", "wallbox2_charge_enabled", "wallbox2_charging_allowed", "wallbox2_enable_charging", "wallbox2_charger_enabled"]
      : ["wallbox_charging_enabled", "wallbox_charge_enabled", "wallbox_charging_allowed", "wallbox_enable_charging", "wallbox_charger_enabled"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _wallboxChargingEnabledState(metric) {
    return this._wallboxBooleanEntityState(this._wallboxChargingEnabledEntityId(metric));
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
      <span class="soc-badge${this._labelVisibilityClass(entityKey, placement)}" data-vehicle-soc="${this._escape(metric.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
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

  _formatDurationSeconds(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return "";
    const rounded = Math.max(1, Math.round(seconds));
    if (rounded < 60) return `${rounded}s`;
    const minutes = Math.floor(rounded / 60);
    const restSeconds = rounded % 60;
    if (minutes < 60) return restSeconds > 0 ? `${minutes}min ${restSeconds}s` : `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    if (restMinutes <= 0) return `${hours}h`;
    return `${hours}h ${restMinutes}m`;
  }

  _wallboxPhaseActionEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_phase_action";
    if (metric?.key === "wallbox2_power") return "wallbox2_phase_action";
    return "";
  }

  _wallboxPhaseRemainingEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_phase_remaining";
    if (metric?.key === "wallbox2_power") return "wallbox2_phase_remaining";
    return "";
  }

  _wallboxPhaseActionEntityId(metric) {
    const entityKey = this._wallboxPhaseActionEntityKey(metric);
    if (!entityKey) return "";
    const aliases = entityKey === "wallbox2_phase_action"
      ? ["wallbox2_phase_action", "wallbox2_phase_action_value", "wallbox2_power_phase_action"]
      : ["wallbox_phase_action", "wallbox_phase_action_value", "wallbox_power_phase_action"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _wallboxPhaseRemainingEntityId(metric) {
    const entityKey = this._wallboxPhaseRemainingEntityKey(metric);
    if (!entityKey) return "";
    const aliases = entityKey === "wallbox2_phase_remaining"
      ? ["wallbox2_phase_remaining", "wallbox2_phase_remaining_seconds", "wallbox2_power_phase_remaining"]
      : ["wallbox_phase_remaining", "wallbox_phase_remaining_seconds", "wallbox_power_phase_remaining"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _wallboxPhaseActionText(metric) {
    const entityId = this._wallboxPhaseActionEntityId(metric);
    if (!entityId) return "";
    const raw = String(this._getEntityValue(entityId, "") ?? "").trim();
    const normalized = raw.toLowerCase();
    if (!normalized || ["unknown", "unavailable", "none", "null", "offline", "-keine-", "keine", "no action"].includes(normalized)) return "";
    return raw;
  }

  _wallboxPhaseRemainingSeconds(metric) {
    const entityId = this._wallboxPhaseRemainingEntityId(metric);
    if (!entityId) return undefined;
    const rawValue = this._getEntityValue(entityId, undefined);
    const value = numericState(rawValue);
    if (!Number.isFinite(value)) return undefined;
    const unit = String(this._getEntityUnit(entityId) || "").trim().toLowerCase();
    if (unit.includes("h") || unit.includes("std") || unit.includes("hour") || unit.includes("stunde")) return value * 3600;
    if (unit.includes("min") || unit === "m") return value * 60;
    return value;
  }

  _wallboxPhaseActionInfo(metric) {
    const action = this._wallboxPhaseActionText(metric);
    if (!action) return undefined;
    const seconds = this._wallboxPhaseRemainingSeconds(metric);
    const duration = Number.isFinite(seconds) ? this._formatDurationSeconds(seconds) : "";
    return {
      action,
      seconds,
      duration,
      actionEntityId: this._wallboxPhaseActionEntityId(metric),
      remainingEntityId: this._wallboxPhaseRemainingEntityId(metric),
      label: duration
        ? this._t("value.phaseChangeIn", { action, duration }, `${action} in ${duration}`)
        : action,
    };
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
      <span class="time-badge${this._labelVisibilityClass(entityKey, placement)}" data-remaining-charge-time="${this._escape(metric.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _renderWallboxPhaseAction(metric, { placement = "footer" } = {}) {
    if (placement !== "footer" || !this._wallboxPhaseActionEntityId(metric)) return "";
    const info = this._wallboxPhaseActionInfo(metric);
    const tooltip = info?.label ? `${this._t("tooltip.phaseChange", {}, "Upcoming phase change")}: ${info.label}` : "";
    return `
      <span class="phase-action-badge" data-phase-action="${this._escape(metric.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${info?.label ? "" : "display:none"}">${this._escape(info?.label || "")}</span>
    `;
  }

  _renderWallboxPhaseRow(metric, { placement = "footer" } = {}) {
    const metaHtml = [
      this._renderWallboxPhase(metric, { placement }),
      this._renderWallboxSoc(metric, { placement }),
      this._renderWallboxRemainingTime(metric, { placement }),
      this._renderWallboxPhaseAction(metric, { placement }),
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
      if (Number.isFinite(value) && value <= this._batteryReserveThreshold()) {
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
      metric.key === "battery_level" && this._batteryVoltageLabel()
        ? `${this._t("tooltip.voltage", {}, "Voltage")}: ${this._batteryVoltageLabel()}`
        : "",
      this._wallboxPhaseLabel(metric) ? `${this._t("tooltip.phases", {}, "Phases")}: ${this._wallboxPhaseLabel(metric)}` : "",
      this._wallboxSocLabel(metric) ? `${this._t("tooltip.vehicleSoc", {}, "Vehicle SoC")}: ${this._wallboxSocLabel(metric)}` : "",
      this._wallboxRemainingTimeLabel(metric) ? `${this._t("tooltip.remainingChargeTime", {}, "Remaining charge time")}: ${this._wallboxRemainingTimeLabel(metric)}` : "",
      this._wallboxPhaseActionInfo(metric)?.label ? `${this._t("tooltip.phaseChange", {}, "Upcoming phase change")}: ${this._wallboxPhaseActionInfo(metric).label}` : "",
      this._metricVoltageLabel(metric) ? `${this._t("tooltip.voltage", {}, "Voltage")}: ${this._metricVoltageLabel(metric)}` : "",
      updatedAt ? `${this._t("tooltip.updated")}: ${updatedAt}` : "",
      warning ? `${this._t("tooltip.status")}: ${warning.label}` : "",
    ].filter(Boolean).join("\n");
  }

  _allChartMetrics(variant = this._currentVariant || this._layoutState().variant) {
    return [
      ...this._visibleHudMetrics(variant),
      ...this._visibleTileMetrics(variant),
      ...this._largeConsumerMetrics(),
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

  _labelVisibilityClass(key, placement = "image") {
    const visibility = this._labelVisibility(key);
    return [
      placement === "footer" ? "" : visibility.hideMobile ? " hide-mobile" : "",
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
    if (metric.largeConsumer) return metric.label || this._largeConsumerLabel(metric.largeConsumer);
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
        ? `<div class="overlay-reading${this._labelVisibilityClass(visibilityKey, "image")}"><span class="overlay-reading-label" data-overlay-label="${this._escape(key)}">${this._escape(label)}</span><span class="overlay-reading-value" data-overlay-value="${this._escape(key)}">${this._escape(reading)}</span></div>`
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
          <div class="value" data-value="${metric.key}">${this._renderMetricValueHtml(metric)}</div>
        </div>
        ${this._renderPvMetaRow(metric, { placement: "image" })}
        ${this._renderBatteryMetaRow(metric, { showFlowLabel: false, placement: "image" })}
        ${this._renderWallboxPhaseRow(metric, { placement: "image" })}
        ${this._renderVoltageMetaRow(metric, { placement: "image" })}
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
    if (key === "pv_roof_power") {
      const stringWatts = this._pvRoofStringPowerWatts();
      if (Number.isFinite(stringWatts)) return stringWatts;
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
      const gridAnchorKey = this._flowAnchor(variant, "import_export_power") ? "import_export_power" : "grid";
      if (gridWatts > 0) addFlow(gridAnchorKey, "inverter_power", gridWatts, "#fb923c");
      else addFlow("inverter_power", gridAnchorKey, gridWatts, "#34d399");
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

  _wallboxAdvisorDetails() {
    return ["wallbox_power", "wallbox2_power"].map((key) => {
      const metric = TILE_METRICS.find((item) => item.key === key) || { key, label: key, unit: "power" };
      const entityId = this.config.entities?.[key] || "";
      const watts = this._positiveWattsForKey(key);
      const socEntityId = this._wallboxSocEntityId(metric);
      const maxSocEntityId = this._wallboxMaxSocEntityId(metric);
      const socPercent = this._numericPercentFromEntity(socEntityId);
      const maxSocPercent = this._wallboxMaxSocPercent(metric);
      const socLastChangedMs = this._getEntityLastChangedMs(socEntityId);
      const socAbove80Minutes = this._trackedConditionMinutes(
        `${key}:soc-above-80`,
        Number.isFinite(socPercent) && socPercent > 80,
        socLastChangedMs,
      );
      const socAbove90Minutes = this._trackedConditionMinutes(
        `${key}:soc-above-90`,
        Number.isFinite(socPercent) && socPercent > 90,
        socLastChangedMs,
      );
      return {
        key,
        metric,
        entityId,
        socEntityId,
        maxSocEntityId,
        hasPowerEntity: Boolean(entityId),
        label: this._metricLabel(metric, this._currentVariant),
        watts: Number.isFinite(watts) ? watts : 0,
        phaseAction: this._wallboxPhaseActionInfo(metric),
        socPercent,
        maxSocPercent,
        socAbove80Minutes,
        socAbove90Minutes,
        targetReached: Number.isFinite(socPercent) && Number.isFinite(maxSocPercent) && socPercent >= maxSocPercent - 0.5,
        connected: this._wallboxConnectedState(metric),
        chargingEnabled: this._wallboxChargingEnabledState(metric),
      };
    }).filter((wallbox) => wallbox.hasPowerEntity);
  }

  _largeConsumerAdvisorDetails() {
    return (this.config.large_consumers || [])
      .map((consumer, index) => {
        const label = this._largeConsumerLabel(consumer, index);
        const watts = this._largeConsumerPowerWatts(consumer);
        const maxPowerWatts = this._parsePowerLimitWatts(consumer.max_power_kw, "kw");
        return {
          id: consumer.id || `consumer_${index + 1}`,
          label,
          powerEntityId: consumer.power_entity || "",
          energyEntityId: consumer.energy_entity || "",
          watts: Number.isFinite(watts) ? watts : 0,
          maxPowerWatts,
          configured: consumer.visible !== false && this._largeConsumerHasEntity(consumer),
          active: Number.isFinite(watts) && watts >= 100,
        };
      })
      .filter((consumer) => consumer.configured);
  }

  _pvRoofStringAdvisorDetails() {
    if (!this._hasAdditionalPvRoofStrings()) return [];
    return this._pvRoofStringEntries()
      .map((entry, index) => {
        const watts = this._pvRoofStringEntryPowerWatts(entry);
        return {
          id: entry.id || `string_${index + 1}`,
          label: entry.label || `String ${index + 1}`,
          powerEntityId: entry.powerEntityId || "",
          energyEntityId: entry.energyEntityId || "",
          watts: Number.isFinite(watts) ? watts : undefined,
          maxPowerWatts: entry.maxPowerWatts,
          configured: Boolean(entry.powerEntityId || entry.energyEntityId),
        };
      })
      .filter((entry) => entry.configured);
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
    const gridSplitPower = this._gridSplitPowerDetails();
    const gridWatts = Number.isFinite(gridInfo?.watts) ? gridInfo.watts : undefined;
    const importWatts = Number.isFinite(gridWatts) ? Math.max(0, gridWatts) : undefined;
    const exportWatts = Number.isFinite(gridWatts) ? Math.max(0, -gridWatts) : undefined;
    const houseWatts = this._positiveWattsForKey("house_consumption_power");
    const wallboxWatts = ["wallbox_power", "wallbox2_power"]
      .map((key) => this._positiveWattsForKey(key))
      .filter(Number.isFinite)
      .reduce((sum, value) => sum + value, 0);
    const wallboxes = this._wallboxAdvisorDetails();
    const hasWallbox = ["wallbox_power", "wallbox2_power"].some((key) => Boolean(this.config.entities?.[key]));
    const largeConsumers = this._largeConsumerAdvisorDetails();
    const largeConsumerWatts = largeConsumers.reduce((sum, consumer) => sum + (Number.isFinite(consumer.watts) ? consumer.watts : 0), 0);
    const pvRoofStrings = this._pvRoofStringAdvisorDetails();
    const batteryMetric = TILE_METRICS.find((metric) => metric.key === "battery_level") || { key: "battery_level", unit: "battery" };
    const batteryPercent = this._batteryPercent(batteryMetric);
    const batterySocEntityId = this._batterySocEntityId();
    const batteryMinSocPercent = this._batteryMinSocPercent();
    const batteryMaxSocPercent = this._batteryMaxSocPercent();
    const batteryReserveThreshold = this._batteryReserveThreshold();
    const batteryFullThreshold = this._batteryFullThreshold();
    const batteryTemperatureCelsius = this._batteryTemperatureCelsius();
    const batteryCyclesToday = this._batteryCyclesToday();
    const batteryHighSocMinutes = this._trackedConditionMinutes(
      "battery:soc-90-100",
      Number.isFinite(batteryPercent) && batteryPercent >= 90 && batteryPercent <= 100,
      this._getEntityLastChangedMs(batterySocEntityId),
    );
    const batteryFlow = this._batteryFlowInfo();
    const batteryFlowWatts = batteryFlow?.kind === "energy" ? batteryFlow.amount * 1000 : batteryFlow?.amount;
    const batteryChargeWatts = batteryFlow?.direction === "charge" && Number.isFinite(batteryFlowWatts) ? batteryFlowWatts : 0;
    const batteryDischargeWatts = batteryFlow?.direction === "discharge" && Number.isFinite(batteryFlowWatts) ? batteryFlowWatts : 0;
    const loadWatts = Number.isFinite(houseWatts)
      ? houseWatts
      : wallboxWatts + largeConsumerWatts > 0
        ? wallboxWatts + largeConsumerWatts
        : undefined;
    const selfConsumptionPercent = Number.isFinite(pvWatts) && pvWatts > 0 && Number.isFinite(exportWatts)
      ? this._clampNumber(((pvWatts - exportWatts) / pvWatts) * 100, 0, 0, 100)
      : undefined;
    const autarkyPercent = Number.isFinite(loadWatts) && loadWatts > 0 && Number.isFinite(importWatts)
      ? this._clampNumber(((loadWatts - importWatts) / loadWatts) * 100, 0, 0, 100)
      : undefined;
    const electricityPriceEntityId = this.config.entities?.electricity_price || "";
    const electricityPrice = electricityPriceEntityId ? numericState(this._getEntityValue(electricityPriceEntityId, undefined)) : undefined;
    const weatherState = this._weatherState();

    return {
      pvWatts,
      gridWatts,
      gridSplitPower,
      importWatts,
      exportWatts,
      houseWatts,
      wallboxWatts,
      wallboxes,
      hasWallbox,
      largeConsumers,
      largeConsumerWatts,
      pvRoofStrings,
      batteryPercent,
      batterySocEntityId,
      batteryMinSocPercent,
      batteryMaxSocPercent,
      batteryReserveThreshold,
      batteryFullThreshold,
      batteryTemperatureCelsius,
      batteryCyclesToday,
      batteryHighSocMinutes,
      batteryFlow,
      batteryChargeWatts,
      batteryDischargeWatts,
      loadWatts,
      selfConsumptionPercent,
      autarkyPercent,
      electricityPrice,
      electricityPriceUnit: electricityPriceEntityId ? this._getEntityUnit(electricityPriceEntityId) : "",
      electricityPriceEntityId,
      weatherState,
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
      ...this._largeConsumerMetrics(),
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

  _entityDisplayName(entityId, fallback = "") {
    const entity = this._getEntity(entityId);
    const friendlyName = entity?.attributes?.friendly_name;
    if (friendlyName) return String(friendlyName);
    return fallback || String(entityId || "").replace(/^sensor\./, "").replace(/_/g, " ");
  }

  _advisorSensorCandidates() {
    const candidates = [];
    const add = (entityId, label = "", dynamic = false, options = {}) => {
      if (!entityId || typeof entityId !== "string") return;
      if (!dynamic) return;
      candidates.push({ entityId, label: label || this._entityDisplayName(entityId), ...options });
    };

    const dynamicPowerEntityKeys = new Set([
      "pv_roof_power",
      "pv_shed_power",
      "pv_total_power",
      "house_consumption_power",
      "battery_flow_power",
      "battery_charge_power",
      "battery_discharge_power",
      "inverter_power",
      "wallbox_power",
      "wallbox2_power",
      "import_export_power",
      "import_power",
      "export_power",
    ]);
    const dynamicStateEntityKeys = new Set(["battery_level", "battery_temperature"]);

    Object.entries(this.config.entities || {}).forEach(([key, entityId]) => {
      const isDynamicPower = dynamicPowerEntityKeys.has(key);
      add(entityId, this._entityLabelForPath?.(`entities.${key}`) || key, isDynamicPower || dynamicStateEntityKeys.has(key), {
        key,
        minActiveWatts: isDynamicPower ? 100 : undefined,
        staleWarningMinutes: key === "battery_temperature" ? 300 : undefined,
        staleCriticalMinutes: key === "battery_temperature" ? 600 : undefined,
      });
    });
    Object.entries(this.config.image_overlays || {}).forEach(([key, config]) => {
      add(config?.entity, this._overlayLabel(key), key === "heatpump");
    });
    (this.config.large_consumers || []).forEach((consumer, index) => {
      if (consumer?.visible === false) return;
      add(consumer.power_entity, this._largeConsumerLabel(consumer, index), true, {
        key: `large_consumers.${consumer.id || index}`,
        minActiveWatts: 100,
      });
    });
    this._pvRoofStringEntries().forEach((entry, index) => {
      if (entry.base || !entry.powerEntityId) return;
      add(entry.powerEntityId, entry.label || `String ${index + 1}`, true, {
        key: `pv_roof_strings.${entry.id || index}`,
        minActiveWatts: 100,
      });
    });

    const seen = new Set();
    return candidates
      .filter((candidate) => {
        if (!candidate.entityId || seen.has(candidate.entityId)) return false;
        seen.add(candidate.entityId);
        return true;
      });
  }

  _advisorStaleSensorIsActive(candidate) {
    if (!Number.isFinite(candidate?.minActiveWatts)) return true;
    const value = this._getEntityValue(candidate.entityId, undefined);
    const watts = this._valueAsWatts(value, this._getEntityUnit(candidate.entityId));
    return Number.isFinite(watts) && Math.abs(watts) >= candidate.minActiveWatts;
  }

  _advisorStaleSensorIsExpectedStatic(candidate) {
    if (candidate?.key !== "battery_level") return false;
    const batteryMetric = TILE_METRICS.find((metric) => metric.key === "battery_level") || { key: "battery_level", unit: "battery" };
    const percent = this._batteryPercent(batteryMetric);
    if (!Number.isFinite(percent)) return false;
    const minSoc = this._batteryMinSocPercent();
    const maxSoc = this._batteryMaxSocPercent();
    return (
      Number.isFinite(maxSoc) && percent >= maxSoc - 0.5
    ) || (
      Number.isFinite(minSoc) && percent <= minSoc + 0.5
    );
  }

  _advisorStaleSensorItem() {
    const warningMinutes = this._clampNumber(this.config.advisor_stale_sensor_warning_minutes, 30, 1, 10080);
    const criticalMinutes = this._clampNumber(this.config.advisor_stale_sensor_critical_minutes, 1440, Math.max(1440, warningMinutes), 20160);
    const stale = this._advisorSensorCandidates()
      .map((candidate) => {
        const entity = this._getEntity(candidate.entityId);
        if (!entity) return undefined;
        const state = String(entity.state || "").toLowerCase().trim();
        if (["unknown", "unavailable", "offline"].includes(state)) return undefined;
        if (!this._advisorStaleSensorIsActive(candidate)) return undefined;
        if (this._advisorStaleSensorIsExpectedStatic(candidate)) return undefined;
        const ageMinutes = this._entityAgeMinutes(candidate.entityId);
        const candidateWarningMinutes = this._clampNumber(candidate.staleWarningMinutes, warningMinutes, warningMinutes, 10080);
        const candidateCriticalMinutes = Math.max(criticalMinutes, this._clampNumber(candidate.staleCriticalMinutes, criticalMinutes, candidateWarningMinutes, 20160));
        if (!Number.isFinite(ageMinutes) || ageMinutes < candidateWarningMinutes) return undefined;
        return {
          ...candidate,
          label: this._entityDisplayName(candidate.entityId, candidate.label),
          ageMinutes,
          critical: ageMinutes >= candidateCriticalMinutes,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.ageMinutes - a.ageMinutes);
    if (stale.length === 0) return undefined;

    const critical = stale.some((item) => item.critical);
    const top = stale[0];
    const duration = this._formatDurationMinutes(top.ageMinutes);
    const details = stale.slice(0, 4)
      .map((item) => `${item.label}: ${this._formatDurationMinutes(item.ageMinutes)}`);
    return stale.length === 1
      ? {
        id: `sensor-stale:${top.entityId}`,
        type: critical ? "critical" : "info",
        priority: critical ? 98 : 90,
        title: this._t("advisor.sensors", {}, "Sensors"),
        text: this._t("advisor.sensorStaleOne", { name: top.label, duration }, `${top.label} has not updated for ${duration}.`),
        value: duration,
        reason: this._t("advisor.reasonSensor", {}, "A configured entity is stale, unavailable, or inconsistent."),
        diagnostic: true,
      }
      : {
        id: `sensor-stale:${stale.map((item) => item.entityId).join("|")}`,
        type: critical ? "critical" : "info",
        priority: critical ? 98 : 90,
        title: this._t("advisor.sensors", {}, "Sensors"),
        text: this._t("advisor.sensorStaleMany", { count: stale.length }, `${stale.length} sensors have not updated recently.`),
        value: duration,
        reason: this._t("advisor.reasonSensor", {}, "A configured entity is stale, unavailable, or inconsistent."),
        details,
        diagnostic: true,
      };
  }

  _advisorTypeRank(type) {
    const ranks = {
      critical: 4,
      warning: 3,
      info: 2,
      setup: 2,
      opportunity: 1,
      success: 0,
    };
    return ranks[type] ?? 2;
  }

  _sortAdvisorItems(items) {
    return [...items].sort((a, b) => (
      this._advisorTypeRank(b.type) - this._advisorTypeRank(a.type)
    ) || ((b.priority ?? 0) - (a.priority ?? 0)));
  }

  _advisorTypeLabel(type) {
    const labels = {
      critical: this._t("advisor.priorityCritical", {}, "Critical"),
      warning: this._t("advisor.priorityWarning", {}, "Warning"),
      info: this._t("advisor.priorityInfo", {}, "Info"),
      setup: this._t("advisor.prioritySetup", {}, "Setup"),
      opportunity: this._t("advisor.priorityOpportunity", {}, "Chance"),
      success: this._t("advisor.prioritySuccess", {}, "OK"),
    };
    return labels[type] || labels.info;
  }

  _advisorWindowLabel(windowKey) {
    const labels = {
      now: this._t("advisor.windowNow", {}, "Now"),
      next_2h: this._t("advisor.windowNext2h", {}, "Next 2h"),
      anytime: this._t("advisor.windowAnytime", {}, "Anytime"),
    };
    return labels[windowKey] || labels.now;
  }

  _advisorDismissStorageKey() {
    const dashboardKey = String(this.config.title || this.config.house || CARD_TYPE).replace(/[^\w-]+/g, "_").slice(0, 80);
    return `${CARD_TYPE}:advisor-dismissed:${dashboardKey}`;
  }

  _advisorTodayKey() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  }

  _advisorDismissKey(item) {
    if (item.id) return String(item.id);
    return [item.type, item.title, item.text]
      .map((part) => String(part ?? "").replace(/[^\w-]+/g, "_"))
      .join("__")
      .slice(0, 180);
  }

  _advisorDismissedMap() {
    try {
      const parsed = JSON.parse(window.localStorage?.getItem(this._advisorDismissStorageKey()) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (_err) {
      return {};
    }
  }

  _isAdvisorItemDismissed(item) {
    const dismissed = this._advisorDismissedMap();
    return dismissed[this._advisorDismissKey(item)] === this._advisorTodayKey();
  }

  _dismissAdvisorItem(key) {
    if (!key) return;
    try {
      const today = this._advisorTodayKey();
      const dismissed = this._advisorDismissedMap();
      Object.keys(dismissed).forEach((entryKey) => {
        if (dismissed[entryKey] !== today) delete dismissed[entryKey];
      });
      dismissed[key] = today;
      window.localStorage?.setItem(this._advisorDismissStorageKey(), JSON.stringify(dismissed));
    } catch (_err) {
      // localStorage can be blocked in strict browser contexts; the Advisor still works without dismissals.
    }
    this._renderCardShell(this._layoutState());
  }

  _formatAdvisorPrice(snapshot) {
    if (!Number.isFinite(snapshot.electricityPrice)) return "";
    const unit = snapshot.electricityPriceUnit || "";
    return `${snapshot.electricityPrice.toLocaleString(this._language(), { maximumFractionDigits: 4 })}${unit ? ` ${unit}` : ""}`;
  }

  _advisorSignalDetails(snapshot, topics = []) {
    const powerFormatter = (value) => this._formatPowerValue(value, this.config.units?.power || "auto", "W");
    const topicSet = new Set(topics);
    const includeAll = topicSet.size === 0;
    const details = [];
    const add = (topic, label, value) => {
      if (!includeAll && !topicSet.has(topic)) return;
      if (value === undefined || value === null || value === "") return;
      details.push(`${label}: ${value}`);
    };
    add("pv", this._t("advisor.pv", {}, "PV"), Number.isFinite(snapshot.pvWatts) ? powerFormatter(snapshot.pvWatts) : "");
    add("surplus", this._t("advisor.exporting", {}, "Exporting surplus"), Number.isFinite(snapshot.exportWatts) ? powerFormatter(snapshot.exportWatts) : "");
    add("grid", this._t("advisor.importing", {}, "Importing"), Number.isFinite(snapshot.importWatts) ? powerFormatter(snapshot.importWatts) : "");
    add("battery", this._t("advisor.batteryStatus", {}, "Battery"), Number.isFinite(snapshot.batteryPercent) ? `${Math.round(snapshot.batteryPercent)}%` : "");
    add("weather", this._t("advisor.weather", {}, "Weather"), snapshot.weatherState ? this._t(`weather.${snapshot.weatherState}`, {}, snapshot.weatherState) : "");
    add("price", this._t("advisor.electricityPrice", {}, "Electricity price"), this._formatAdvisorPrice(snapshot));
    if (topicSet.has("wallbox")) {
      (snapshot.wallboxes || []).forEach((wallbox) => {
        const wallboxValue = [
          Number.isFinite(wallbox.watts) ? powerFormatter(wallbox.watts) : "",
          Number.isFinite(wallbox.socPercent) ? `${Math.round(wallbox.socPercent)}%` : "",
          wallbox.connected === false ? this._t("advisor.evPlugIn", {}, "Plug in the vehicle to use PV surplus for charging.") : "",
          wallbox.chargingEnabled === false ? this._t("advisor.evEnableCharging", {}, "Charging is currently disabled. Enable charging if you want to use the PV surplus.") : "",
        ].filter(Boolean).join(" / ");
        if (wallboxValue) details.push(`${wallbox.label}: ${wallboxValue}`);
      });
    }
    return [...new Set(details)];
  }

  _advisorSuggestionLimit() {
    return Math.round(this._clampNumber(this.config.advisor_max_suggestions, 8, 1, 12));
  }

  _advisorItems(snapshot = this._advisorSnapshot(), { maxItems = this._advisorSuggestionLimit() } = {}) {
    const items = [...this._advisorWarnings()];
    const add = (type, priority, title, text, value = "", extra = {}) => {
      items.push({ type, priority, title, text, value, window: "now", signals: [], ...extra });
    };
    const itemLimit = Math.round(this._clampNumber(maxItems, this._advisorSuggestionLimit(), 1, 12));
    const surplusThreshold = this._clampNumber(this.config.advisor_surplus_threshold, 250, 0, 1000000);
    const importThreshold = this._clampNumber(this.config.advisor_import_threshold, 250, 0, 1000000);
    const highLoadThreshold = this._clampNumber(this.config.advisor_high_load_threshold, 3000, 0, 1000000);
    const evSurplusThreshold = this._clampNumber(this.config.advisor_ev_surplus_threshold, 1500, 0, 1000000);
    const lowBatteryThreshold = Number.isFinite(snapshot.batteryReserveThreshold)
      ? snapshot.batteryReserveThreshold
      : this._clampNumber(this.config.battery_low_threshold, 20, 0, 100);
    const fullBatteryThreshold = Number.isFinite(snapshot.batteryFullThreshold) ? snapshot.batteryFullThreshold : 92;
    const deepBatteryThreshold = Math.min(10, lowBatteryThreshold);
    const voltageAlert = this._gridVoltageAlert();
    if (voltageAlert) {
      add(voltageAlert.type, voltageAlert.type === "critical" ? 99 : 94, this._t("advisor.grid", {}, "Grid"), voltageAlert.label, voltageAlert.value, {
        id: `voltage:${voltageAlert.entityId}`,
        diagnostic: true,
        reason: this._t("advisor.reasonSensor", {}, "A configured entity is stale, unavailable, or inconsistent."),
        signals: this._advisorSignalDetails(snapshot, ["grid", "pv", "battery", "price"]),
        details: [`${voltageAlert.label}: ${voltageAlert.value}`, `${voltageAlert.metric ? this._metricLabel(voltageAlert.metric, this._currentVariant) : voltageAlert.entityId}: ${voltageAlert.entityId}`],
      });
    }
    const staleSensorItem = this._advisorStaleSensorItem();
    if (staleSensorItem) items.push(staleSensorItem);

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
      add("warning", 95, this._t("advisor.status", {}, "Status"), this._t("advisor.checkSensors", {}, "Check unavailable or missing sensors so the energy balance stays reliable."), "", {
        id: "advisor:sensor-check",
        reason: this._t("advisor.reasonSensor", {}, "A configured entity is stale, unavailable, or inconsistent."),
        signals: this._advisorSignalDetails(snapshot, ["pv", "grid", "battery"]),
      });
    }

    if (
      Number.isFinite(snapshot.gridSplitPower?.importWatts)
      && Number.isFinite(snapshot.gridSplitPower?.exportWatts)
      && snapshot.gridSplitPower.importWatts > importThreshold
      && snapshot.gridSplitPower.exportWatts > surplusThreshold
    ) {
      const value = `${this._formatPowerValue(snapshot.gridSplitPower.importWatts, this.config.units?.power || "auto", "W")} / ${this._formatPowerValue(snapshot.gridSplitPower.exportWatts, this.config.units?.power || "auto", "W")}`;
      add("critical", 96, this._t("advisor.grid", {}, "Grid"), this._t("advisor.gridImportExportSimultaneous", {}, "Import and export sensors report power at the same time. Check whether the split grid sensors are mapped correctly."), value, {
        id: "grid:import-export-simultaneous",
        reason: this._t("advisor.reasonSensor", {}, "A configured entity is stale, unavailable, or inconsistent."),
        signals: this._advisorSignalDetails(snapshot, ["grid", "pv"]),
      });
    }

    if (Number.isFinite(snapshot.batteryTemperatureCelsius)) {
      const tempValue = `${snapshot.batteryTemperatureCelsius.toFixed(Math.abs(snapshot.batteryTemperatureCelsius) >= 100 || Number.isInteger(snapshot.batteryTemperatureCelsius) ? 0 : 1)} °C`;
      if (snapshot.batteryTemperatureCelsius <= 0 || snapshot.batteryTemperatureCelsius >= 55) {
        add("critical", 94, this._t("advisor.batteryStatus", {}, "Battery"), snapshot.batteryTemperatureCelsius <= 0
          ? this._t("advisor.batteryTemperatureLow", {}, "House battery temperature is low. Charging power may be limited and battery stress can increase.")
          : this._t("advisor.batteryTemperatureHigh", {}, "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits."), tempValue);
      } else if (snapshot.batteryTemperatureCelsius <= 5 || snapshot.batteryTemperatureCelsius >= 45) {
        add("info", 83, this._t("advisor.batteryStatus", {}, "Battery"), snapshot.batteryTemperatureCelsius <= 5
          ? this._t("advisor.batteryTemperatureLow", {}, "House battery temperature is low. Charging power may be limited and battery stress can increase.")
          : this._t("advisor.batteryTemperatureHigh", {}, "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits."), tempValue);
      }
    }

    if (Number.isFinite(snapshot.batteryCyclesToday) && snapshot.batteryCyclesToday >= 2) {
      add(snapshot.batteryCyclesToday >= 3 ? "critical" : "info", snapshot.batteryCyclesToday >= 3 ? 92 : 81, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryCyclesHigh", {}, "House battery has completed several full cycles today. Frequent cycling can age the battery faster."), snapshot.batteryCyclesToday.toFixed(snapshot.batteryCyclesToday % 1 === 0 ? 0 : 1));
    }

    if (Number.isFinite(snapshot.batteryPercent) && snapshot.batteryPercent <= deepBatteryThreshold) {
      add("critical", 93, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryDeepSoc", {}, "House battery SoC is very low. Protect the reserve and avoid additional flexible loads."), `${Math.round(snapshot.batteryPercent)}%`);
    }

    (snapshot.wallboxes || []).forEach((wallbox) => {
      if (!Number.isFinite(wallbox.socPercent)) return;
      const value90 = `${Math.round(wallbox.socPercent)}% - ${this._formatDurationMinutes(wallbox.socAbove90Minutes)}`;
      const value80 = `${Math.round(wallbox.socPercent)}% - ${this._formatDurationMinutes(wallbox.socAbove80Minutes)}`;
      if (Number.isFinite(wallbox.socAbove90Minutes) && wallbox.socAbove90Minutes >= 60) {
        add("critical", 97, wallbox.label, this._t("advisor.evSocAbove90Long", {}, "Vehicle SoC is above 90% for more than 60 minutes. Stop charging or lower the target SoC if the car will stay parked."), value90);
      } else if (Number.isFinite(wallbox.socAbove80Minutes) && wallbox.socAbove80Minutes >= 120) {
        add("info", 89, wallbox.label, this._t("advisor.evSocAbove80Long", {}, "Vehicle SoC is above 80% for more than 120 minutes. This can stress the battery if it stays there too long."), value80);
      }
    });

    (snapshot.wallboxes || []).forEach((wallbox) => {
      const phaseAction = wallbox.phaseAction;
      if (!phaseAction?.action) return;
      const value = phaseAction.duration ? `${phaseAction.action} / ${phaseAction.duration}` : phaseAction.action;
      const duration = phaseAction.duration || this._t("value.soon", {}, "soon");
      const nextWindowSeconds = 2 * 60 * 60;
      add("info", 83, wallbox.label, this._t("advisor.evPhaseChangeScheduled", { action: phaseAction.action, duration }, `${phaseAction.action} in ${duration} if the PV situation does not change.`), value, {
        id: `wallbox:phase:${wallbox.key}:${phaseAction.action}`,
        window: Number.isFinite(phaseAction.seconds) && phaseAction.seconds <= nextWindowSeconds ? "next_2h" : "now",
        reason: this._t("advisor.reasonPhaseChange", {}, "EVCC reports a planned phase change inside the next window."),
        signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "grid", "wallbox", "weather"]),
        details: [
          phaseAction.actionEntityId ? `${this._t("editor.phaseActionEntity", {}, "Upcoming phase action entity")}: ${phaseAction.actionEntityId}` : "",
          phaseAction.remainingEntityId ? `${this._t("editor.phaseRemainingEntity", {}, "Phase action remaining seconds entity")}: ${phaseAction.remainingEntityId}` : "",
        ].filter(Boolean),
      });
    });

    if (Number.isFinite(snapshot.batteryHighSocMinutes) && snapshot.batteryHighSocMinutes >= 120) {
      const value = `${Math.round(snapshot.batteryPercent)}% - ${this._formatDurationMinutes(snapshot.batteryHighSocMinutes)}`;
      add("info", 87, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryHighSocLong", {}, "House battery has been between 90 and 100% for more than 120 minutes. Batteries should not stay that full for too long."), value);
    }

    if (Number.isFinite(snapshot.exportWatts) && snapshot.exportWatts > surplusThreshold) {
      const value = this._formatPowerValue(snapshot.exportWatts, this.config.units?.power || "auto", "W");
      const idleWallboxes = (snapshot.wallboxes || []).filter((wallbox) => wallbox.watts <= surplusThreshold);
      const wallboxTitle = (wallboxes) => wallboxes.length === 1 ? wallboxes[0].label : this._t("advisor.wallbox", {}, "EV");
      add("opportunity", 88, this._t("advisor.surplus", {}, "Surplus"), this._t("advisor.surplusGeneral", {}, "PV surplus is available. Prioritize flexible loads while export is active."), value, {
        id: "surplus:general",
        reason: this._t("advisor.reasonSurplus", { threshold: this._formatPowerValue(surplusThreshold, this.config.units?.power || "auto", "W") }, "PV surplus is above the configured surplus threshold."),
        signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "battery", "weather", "price"]),
      });
      const largeConsumerCandidates = (snapshot.largeConsumers || [])
        .filter((consumer) => !consumer.active && consumer.powerEntityId)
        .filter((consumer) => Number.isFinite(consumer.maxPowerWatts)
          ? consumer.maxPowerWatts <= snapshot.exportWatts + surplusThreshold
          : snapshot.exportWatts >= highLoadThreshold);
      if (largeConsumerCandidates.length > 0) {
        const names = largeConsumerCandidates.slice(0, 3).map((consumer) => consumer.label).join(", ");
        add("opportunity", 78, this._t("consumer.sectionTitle", {}, "Additional Large Consumers"), this._t("advisor.largeConsumerSurplus", { names }, `PV surplus can cover ${names}. Start a ready large consumer while export is active.`), value, {
          id: `large-consumer:surplus:${names}`,
          reason: this._t("advisor.reasonLargeConsumer", {}, "The available PV surplus can cover the configured consumer limit."),
          signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "battery", "weather", "price"]),
          details: largeConsumerCandidates.slice(0, 4).map((consumer) => [
            consumer.label,
            Number.isFinite(consumer.maxPowerWatts) ? this._formatPowerValue(consumer.maxPowerWatts, this.config.units?.power || "auto", "W") : "",
          ].filter(Boolean).join(": ")),
        });
      }
      const chargeableWallboxes = idleWallboxes.filter((wallbox) => !wallbox.targetReached && wallbox.connected !== false && wallbox.chargingEnabled !== false && snapshot.exportWatts >= evSurplusThreshold);
      if (chargeableWallboxes.length > 0) {
        add("opportunity", 82, wallboxTitle(chargeableWallboxes), this._t("advisor.startEvCharging", {}, "Start or increase EV charging while surplus is available."), value, {
          id: `wallbox:start:${chargeableWallboxes.map((wallbox) => wallbox.key).join("-")}`,
          reason: this._t("advisor.reasonEvSurplus", { threshold: this._formatPowerValue(evSurplusThreshold, this.config.units?.power || "auto", "W") }, "PV surplus is above the configured EV threshold."),
          signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "battery", "wallbox", "weather", "price"]),
        });
      }
      const disconnectedWallboxes = idleWallboxes.filter((wallbox) => !wallbox.targetReached && wallbox.connected === false && snapshot.exportWatts >= evSurplusThreshold);
      if (disconnectedWallboxes.length > 0) {
        add("opportunity", 79, wallboxTitle(disconnectedWallboxes), this._t("advisor.evPlugIn", {}, "Plug in the vehicle to use PV surplus for charging."), value, {
          id: `wallbox:plugin:${disconnectedWallboxes.map((wallbox) => wallbox.key).join("-")}`,
          reason: this._t("advisor.reasonEvSurplus", { threshold: this._formatPowerValue(evSurplusThreshold, this.config.units?.power || "auto", "W") }, "PV surplus is above the configured EV threshold."),
          signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "battery", "wallbox", "weather", "price"]),
        });
      }
      const disabledWallboxes = idleWallboxes.filter((wallbox) => !wallbox.targetReached && wallbox.connected !== false && wallbox.chargingEnabled === false && snapshot.exportWatts >= evSurplusThreshold);
      if (disabledWallboxes.length > 0) {
        add("info", 76, wallboxTitle(disabledWallboxes), this._t("advisor.evEnableCharging", {}, "Charging is currently disabled. Enable charging if you want to use the PV surplus."), value, {
          id: `wallbox:enable:${disabledWallboxes.map((wallbox) => wallbox.key).join("-")}`,
          reason: this._t("advisor.reasonEvSurplus", { threshold: this._formatPowerValue(evSurplusThreshold, this.config.units?.power || "auto", "W") }, "PV surplus is above the configured EV threshold."),
          signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "battery", "wallbox", "weather", "price"]),
        });
      }
      const targetReachedWallboxes = idleWallboxes.filter((wallbox) => wallbox.targetReached);
      if (targetReachedWallboxes.length > 0) {
        const targetValue = targetReachedWallboxes.length === 1 && Number.isFinite(targetReachedWallboxes[0].maxSocPercent)
          ? `${Math.round(targetReachedWallboxes[0].socPercent)} / ${Math.round(targetReachedWallboxes[0].maxSocPercent)}%`
          : value;
        add("info", 72, wallboxTitle(targetReachedWallboxes), this._t("advisor.evTargetReached", {}, "Vehicle is already at the configured target SoC. Use surplus for another flexible load."), targetValue);
      }
      if (this.config.image_overlays?.heatpump?.enabled === true || this.config.image_overlays?.heatpump?.entity) {
        add("opportunity", 74, this._overlayLabel("heatpump"), this._t("advisor.useHeatPump", {}, "Use heat pump boost or preheat hot water while PV surplus is available."), value);
      }
      if (Number.isFinite(snapshot.batteryPercent) && snapshot.batteryPercent >= fullBatteryThreshold - 0.5) {
        const value = Number.isFinite(snapshot.batteryMaxSocPercent)
          ? `${Math.round(snapshot.batteryPercent)} / ${Math.round(snapshot.batteryMaxSocPercent)}%`
          : `${Math.round(snapshot.batteryPercent)}%`;
        add("info", 70, this._t("advisor.batteryStatus", {}, "Battery"), Number.isFinite(snapshot.batteryMaxSocPercent)
          ? this._t("advisor.batteryMaxReached", {}, "Battery is at the configured max SoC. Additional PV is likely to be exported.")
          : this._t("advisor.batteryNearlyFull", {}, "Battery is nearly full, so additional PV is likely to be exported."), value);
      } else if (snapshot.batteryFlow?.direction !== "charge" && (this.config.entities?.battery_flow_power || this.config.entities?.battery_charge_power)) {
        add("info", 64, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryIdle", {}, "Battery is not charging while surplus is exported. Check battery limits or charge mode."));
      }
      add("opportunity", 60, this._t("advisor.appliances", {}, "Appliances"), this._t("advisor.runAppliance", {}, "Run a flexible household appliance now if it is waiting."), value);
    }

    if (Number.isFinite(snapshot.importWatts) && snapshot.importWatts > importThreshold) {
      const value = this._formatPowerValue(snapshot.importWatts, this.config.units?.power || "auto", "W");
      add("warning", 86, this._t("advisor.grid", {}, "Grid"), this._t("advisor.headlineImport", {}, "Grid import is active"), value, {
        id: "grid:import-active",
        reason: this._t("advisor.reasonGridImport", { threshold: this._formatPowerValue(importThreshold, this.config.units?.power || "auto", "W") }, "Grid import is above the configured import threshold."),
        signals: this._advisorSignalDetails(snapshot, ["grid", "pv", "battery", "price"]),
      });
      if (Number.isFinite(snapshot.batteryPercent) && snapshot.batteryPercent >= fullBatteryThreshold - 0.5) {
        const batteryValue = `${value} / ${Math.round(snapshot.batteryPercent)}%`;
        add(snapshot.importWatts > highLoadThreshold ? "critical" : "warning", snapshot.importWatts > highLoadThreshold ? 91 : 85, this._t("advisor.grid", {}, "Grid"), this._t("advisor.gridImportFullBattery", {}, "Grid import is high although the house battery is full. Check discharge limits, backup reserve, or battery mode."), batteryValue);
      }
      const activeWallboxes = (snapshot.wallboxes || []).filter((wallbox) => wallbox.watts > importThreshold);
      const targetReachedCharging = activeWallboxes.filter((wallbox) => wallbox.targetReached);
      const gridChargingWallboxes = activeWallboxes.filter((wallbox) => !wallbox.targetReached);
      if (targetReachedCharging.length > 0) {
        const targetValue = targetReachedCharging.length === 1 && Number.isFinite(targetReachedCharging[0].maxSocPercent)
          ? `${Math.round(targetReachedCharging[0].socPercent)} / ${Math.round(targetReachedCharging[0].maxSocPercent)}%`
          : this._formatPowerValue(targetReachedCharging.reduce((sum, wallbox) => sum + wallbox.watts, 0), this.config.units?.power || "auto", "W");
        add("warning", 84, targetReachedCharging.length === 1 ? targetReachedCharging[0].label : this._t("advisor.wallbox", {}, "EV"), this._t("advisor.evTargetReachedGrid", {}, "Vehicle is at target SoC while the charger is still drawing power. Check the charge limit or stop charging."), targetValue);
      }
      if (gridChargingWallboxes.length > 0) {
        add("warning", 80, gridChargingWallboxes.length === 1 ? gridChargingWallboxes[0].label : this._t("advisor.wallbox", {}, "EV"), this._t("advisor.evChargingGrid", {}, "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended."), this._formatPowerValue(gridChargingWallboxes.reduce((sum, wallbox) => sum + wallbox.watts, 0), this.config.units?.power || "auto", "W"));
      }
      const activeLargeConsumers = (snapshot.largeConsumers || []).filter((consumer) => consumer.active);
      if (activeLargeConsumers.length > 0) {
        const largeConsumerWatts = activeLargeConsumers.reduce((sum, consumer) => sum + consumer.watts, 0);
        const names = activeLargeConsumers.slice(0, 3).map((consumer) => consumer.label).join(", ");
        add(snapshot.importWatts > highLoadThreshold || largeConsumerWatts > highLoadThreshold ? "critical" : "warning", snapshot.importWatts > highLoadThreshold ? 89 : 82, this._t("consumer.sectionTitle", {}, "Additional Large Consumers"), this._t("advisor.largeConsumerGrid", { names }, `${names} currently draw power while grid import is active.`), this._formatPowerValue(largeConsumerWatts, this.config.units?.power || "auto", "W"), {
          details: activeLargeConsumers.slice(0, 4).map((consumer) => `${consumer.label}: ${this._formatPowerValue(consumer.watts, this.config.units?.power || "auto", "W")}`),
        });
      }
      if (Number.isFinite(snapshot.loadWatts) && snapshot.loadWatts > highLoadThreshold) {
        add("info", 58, this._t("advisor.consumption", {}, "Load"), this._t("advisor.highLoad", {}, "Current load is high compared with PV production. Check large consumers if this is unexpected."), this._formatPowerValue(snapshot.loadWatts, this.config.units?.power || "auto", "W"));
      }
    }

    if (Number.isFinite(snapshot.batteryPercent) && snapshot.batteryPercent <= lowBatteryThreshold && snapshot.batteryPercent > deepBatteryThreshold) {
      const reserveValue = Number.isFinite(snapshot.batteryMinSocPercent)
        ? `${Math.round(snapshot.batteryPercent)} / ${Math.round(snapshot.batteryMinSocPercent)}%`
        : `${Math.round(snapshot.batteryPercent)}%`;
      if (snapshot.batteryFlow?.direction === "discharge") {
        add("warning", 84, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryReserveDischarging", {}, "Battery is at or below reserve SoC and still discharging. Check min SoC or backup reserve settings."), reserveValue);
      }
      add("warning", 78, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryLow", {}, "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible."), reserveValue);
    }

    if (
      this._isDaylight()
      && Number.isFinite(snapshot.pvWatts)
      && snapshot.pvWatts <= Math.max(100, surplusThreshold * 0.5)
      && !["rainy", "pouring", "snowy", "snowy-rainy", "fog"].includes(this._weatherState())
    ) {
      add("info", 46, this._t("advisor.pv", {}, "PV"), this._t("advisor.lowPv", {}, "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors."), this._formatPowerValue(snapshot.pvWatts, this.config.units?.power || "auto", "W"));
    }

    const pvCoveredWallboxWatts = (snapshot.wallboxes || [])
      .filter((wallbox) => wallbox.watts > importThreshold && !wallbox.targetReached)
      .reduce((sum, wallbox) => sum + wallbox.watts, 0);
    if (
      pvCoveredWallboxWatts > importThreshold
      && (!Number.isFinite(snapshot.importWatts) || snapshot.importWatts <= importThreshold)
    ) {
      add("success", 42, this._t("advisor.wallbox", {}, "EV"), this._t("advisor.evChargingPv", {}, "EV charging is currently covered well by PV or stored energy."), this._formatPowerValue(pvCoveredWallboxWatts, this.config.units?.power || "auto", "W"));
    }

    const pvCoveredLargeConsumerWatts = (snapshot.largeConsumers || [])
      .filter((consumer) => consumer.active)
      .reduce((sum, consumer) => sum + consumer.watts, 0);
    if (
      pvCoveredLargeConsumerWatts > importThreshold
      && (!Number.isFinite(snapshot.importWatts) || snapshot.importWatts <= importThreshold)
    ) {
      add("success", 41, this._t("consumer.sectionTitle", {}, "Additional Large Consumers"), this._t("advisor.largeConsumerCovered", {}, "Large consumers are running without relevant grid import."), this._formatPowerValue(pvCoveredLargeConsumerWatts, this.config.units?.power || "auto", "W"));
    }

    let visibleItems = items.filter((item) => !this._isAdvisorItemDismissed(item));
    if (visibleItems.length === 0) {
      add("success", 10, this._t("advisor.status", {}, "Status"), this._t("advisor.noAdvice", {}, "No urgent action right now."));
      visibleItems = items.filter((item) => !this._isAdvisorItemDismissed(item));
    }

    return this._sortAdvisorItems(visibleItems).slice(0, itemLimit);
  }

  _advisorStatus(snapshot = this._advisorSnapshot(), items = this._advisorItems(snapshot)) {
    const hasDiagnosticWarning = items.some((item) => item.diagnostic === true && ["critical", "warning"].includes(item.type));
    const hasCritical = items.some((item) => item.type === "critical");
    const hasInfo = items.some((item) => item.type === "info");
    const hasSetup = items.some((item) => item.type === "setup");
    const surplusThreshold = this._clampNumber(this.config.advisor_surplus_threshold, 250, 0, 1000000);
    const importThreshold = this._clampNumber(this.config.advisor_import_threshold, 250, 0, 1000000);
    if (hasCritical) return { type: "critical", label: this._t("advisor.headlineWarning", {}, "Energy setup needs attention") };
    if (hasDiagnosticWarning) return { type: "warning", label: this._t("advisor.headlineWarning", {}, "Energy setup needs attention") };
    if (Number.isFinite(snapshot.exportWatts) && snapshot.exportWatts > surplusThreshold) {
      return { type: "opportunity", label: this._t("advisor.headlineExport", {}, "PV surplus is available") };
    }
    if (Number.isFinite(snapshot.importWatts) && snapshot.importWatts > importThreshold) {
      return { type: "warning", label: this._t("advisor.headlineImport", {}, "Grid import is active") };
    }
    if (hasSetup) return { type: "setup", label: this._t("advisor.headlineSetup", {}, "More sensors unlock better advice") };
    if (hasInfo) return { type: "info", label: this._t("advisor.headlineInfo", {}, "Information available") };
    return { type: "success", label: this._t("advisor.headlineNeutral", {}, "Energy flow is balanced") };
  }

  _advisorMetricValue(value, formatter) {
    return Number.isFinite(value) ? formatter(value) : this._t("advisor.unknown", {}, "Unknown");
  }

  _advisorEntityReference(label, entityId) {
    if (!entityId) return undefined;
    return `${label}: ${entityId}`;
  }

  _advisorConfiguredEntities(keys) {
    return keys
      .map(([label, entityId]) => this._advisorEntityReference(label, entityId))
      .filter(Boolean);
  }

  _advisorParseDetailEntry(entry) {
    const text = String(entry ?? "").trim();
    const separator = text.indexOf(":");
    if (separator < 0) return { label: text, value: "" };
    return {
      label: text.slice(0, separator).trim(),
      value: text.slice(separator + 1).trim(),
    };
  }

  _advisorNormalizeLabel(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  _advisorDetailCategory(label, entityId = "") {
    const text = this._advisorNormalizeLabel(`${label} ${entityId}`);
    if (/(einspeis|export|surplus|feed)/.test(text)) return "surplus";
    if (/(netzbezug|bezug|import|grid import)/.test(text)) return "import";
    if (/(netz|grid)/.test(text)) return "grid";
    if (/(pv|solar|photovoltaik)/.test(text)) return "pv";
    if (/(batter|akku|speicher|soc)/.test(text)) return "battery";
    if (/(temperatur|temperature|temp)/.test(text)) return "temperature";
    if (/(eigenverbrauch|self use|self consumption)/.test(text)) return "selfConsumption";
    if (/(autark|autarky)/.test(text)) return "autarky";
    if (/(wallbox|charger|ladepunkt|auto|vehicle|ev)/.test(text)) return "wallbox";
    if (/(last|load|hausverbrauch|verbrauch)/.test(text)) return "load";
    if (/(sensor|unavailable|stale|offline)/.test(text)) return "sensor";
    if (/(strompreis|electricity price|price|tarif|tariff)/.test(text)) return "price";
    return "consumer";
  }

  _advisorImpactForLabel(label, item = {}) {
    const category = this._advisorDetailCategory(label);
    const text = this._advisorNormalizeLabel(`${item.title || ""} ${item.text || ""}`);
    if (category === "pv") return this._t("advisor.impactPv", {}, "That value describes the current PV production and helps estimate how much energy is available.");
    if (category === "surplus") return this._t("advisor.impactSurplus", {}, "That value shows how much power is currently available for flexible loads before it is exported.");
    if (category === "import" || category === "grid") return this._t("advisor.impactGrid", {}, "That value decides whether the situation is treated as grid import, neutral, or PV surplus.");
    if (category === "battery") return this._t("advisor.impactBattery", {}, "That value describes the current battery reserve and influences whether flexible loads are sensible right now.");
    if (category === "temperature") return this._t("advisor.impactTemperature", {}, "That value is used to detect possible battery stress or operating limits.");
    if (category === "wallbox") return this._t("advisor.impactWallbox", {}, "That value describes the charger state and determines whether charging should start, stop, or wait.");
    if (category === "load") return this._t("advisor.impactLoad", {}, "That value describes the current household load and helps classify whether consumption is unusually high.");
    if (category === "selfConsumption") return this._t("advisor.impactSelfConsumption", {}, "That shows how much PV energy is being used locally instead of being exported.");
    if (category === "autarky") return this._t("advisor.impactAutarky", {}, "That shows how independently the house is currently being supplied.");
    if (category === "sensor") return this._t("advisor.impactSensor", {}, "That value is used as a diagnostic signal for sensor freshness and plausibility.");
    if (text.includes("verbraucher") || text.includes("consumer") || category === "consumer") return this._t("advisor.impactConsumer", {}, "That value shows whether this consumer is active and how strongly it affects the energy balance.");
    return this._t("advisor.impactSensor", {}, "That value is used as a diagnostic signal for sensor freshness and plausibility.");
  }

  _advisorEntityForLabel(label, entities = []) {
    const normalizedLabel = this._advisorNormalizeLabel(label);
    const category = this._advisorDetailCategory(label);
    const parsed = entities
      .map((entry) => this._advisorParseDetailEntry(entry))
      .filter((entry) => entry.label && entry.value);
    const scoreEntity = (entry) => {
      const normalizedEntityLabel = this._advisorNormalizeLabel(entry.label);
      const normalizedEntityId = this._advisorNormalizeLabel(entry.value);
      if (!normalizedEntityLabel && !normalizedEntityId) return 0;
      if (normalizedEntityLabel === normalizedLabel) return 100;
      if (normalizedEntityLabel.includes(normalizedLabel) || normalizedLabel.includes(normalizedEntityLabel)) return 86;
      const entityCategory = this._advisorDetailCategory(entry.label, entry.value);
      if (category === "surplus" && /(export|einspeis|feed)/.test(`${normalizedEntityLabel} ${normalizedEntityId}`)) return 78;
      if (category === "import" && /(import|bezug)/.test(`${normalizedEntityLabel} ${normalizedEntityId}`)) return 78;
      if (category !== "consumer" && category === entityCategory) return 66;
      return 0;
    };
    return parsed
      .map((entry) => ({ entry, score: scoreEntity(entry) }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.entry?.value || "";
  }

  _advisorExplanationEntries(values = [], signals = []) {
    const ignoredValues = new Set(["", "—", "unknown", "unbekannt"]);
    const entries = [...values, ...signals]
      .map((entry) => this._advisorParseDetailEntry(entry))
      .filter((entry) => entry.label && entry.value && !ignoredValues.has(this._advisorNormalizeLabel(entry.value)));
    const seen = new Set();
    return entries.filter((entry) => {
      const key = `${this._advisorNormalizeLabel(entry.label)}:${this._advisorNormalizeLabel(entry.value)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  _advisorExplanationParagraphs(item, values = [], signals = [], entities = []) {
    const priority = this._advisorTypeLabel(item.type);
    const window = this._advisorWindowLabel(item.window);
    const reason = item.reason || item.text;
    const paragraphs = [
      this._t("advisor.detailIntro", { priority, window, reason }, `The Advisor shows this as ${priority} for ${window}, because ${reason}`),
    ];
    this._advisorExplanationEntries(values, signals).slice(0, 10).forEach((entry) => {
      const entityId = this._advisorEntityForLabel(entry.label, entities);
      const impact = this._advisorImpactForLabel(entry.label, item);
      paragraphs.push(entityId
        ? this._t("advisor.detailEntityValue", { entity: entityId, label: entry.label, value: entry.value, impact }, `${entityId} currently reports ${entry.value} for ${entry.label}. ${impact}`)
        : this._t("advisor.detailValueOnly", { label: entry.label, value: entry.value, impact }, `${entry.label} is currently ${entry.value}. ${impact}`));
    });
    return [...new Set(paragraphs)];
  }

  _advisorItemKey(item, index) {
    return [item.type, item.priority, item.title, item.text, item.value, index]
      .map((part) => String(part ?? "").replace(/[^\w-]+/g, "_"))
      .join("__")
      .slice(0, 180);
  }

  _advisorItemDetails(item, snapshot) {
    const powerFormatter = (value) => this._formatPowerValue(value, this.config.units?.power || "auto", "W");
    const percentFormatter = (value) => Number.isFinite(value) ? `${Math.round(value)}%` : "";
    const values = [];
    const entities = [];
    const addValue = (label, value) => {
      if (value === undefined || value === null || value === "") return;
      values.push(`${label}: ${value}`);
    };
    const addEntity = (label, entityId) => {
      const entry = this._advisorEntityReference(label, entityId);
      if (entry) entities.push(entry);
    };

    const title = String(item.title || "").toLowerCase();
    const text = String(item.text || "").toLowerCase();
    const isGrid = title.includes("netz") || title.includes("grid") || text.includes("netz") || text.includes("grid") || text.includes("import") || text.includes("export");
    const isBattery = title.includes("batter") || text.includes("batter");
    const isWallbox = title.includes("wallbox") || title.includes("ev") || text.includes("auto") || text.includes("wallbox") || text.includes("vehicle");
    const isLoad = title.includes("last") || title.includes("haushalt") || title.includes("load") || title.includes("appliance") || text.includes("verbraucher");
    const isLargeConsumer = title.includes("großverbraucher") || title.includes("große verbraucher") || title.includes("large consumer") || text.includes("großverbraucher") || text.includes("große verbraucher") || text.includes("large consumer");
    const isPv = title.includes("pv") || title.includes("überschuss") || title.includes("surplus") || text.includes("pv") || text.includes("überschuss") || text.includes("surplus");
    const isSensors = title.includes("sensor") || text.includes("sensor");

    addValue(this._t("advisor.pv", {}, "PV"), this._advisorMetricValue(snapshot.pvWatts, powerFormatter));
    if (isPv && Array.isArray(snapshot.pvRoofStrings) && snapshot.pvRoofStrings.length > 0) {
      snapshot.pvRoofStrings.forEach((string) => {
        addValue(string.label, [
          Number.isFinite(string.watts) ? powerFormatter(string.watts) : "",
          Number.isFinite(string.maxPowerWatts) ? `${this._t("tooltip.max", {}, "Maximum")} ${powerFormatter(string.maxPowerWatts)}` : "",
        ].filter(Boolean).join(" / "));
      });
    }
    if (isPv || isGrid || isLoad) {
      addValue(this._t("advisor.exporting", {}, "Exporting surplus"), this._advisorMetricValue(snapshot.exportWatts, powerFormatter));
      addValue(this._t("advisor.importing", {}, "Importing"), this._advisorMetricValue(snapshot.importWatts, powerFormatter));
    }
    if (isBattery || isPv || isGrid) {
      addValue(this._t("advisor.batteryStatus", {}, "Battery"), Number.isFinite(snapshot.batteryPercent)
        ? [
          percentFormatter(snapshot.batteryPercent),
          Number.isFinite(snapshot.batteryMinSocPercent) || Number.isFinite(snapshot.batteryMaxSocPercent)
            ? `(${Number.isFinite(snapshot.batteryMinSocPercent) ? Math.round(snapshot.batteryMinSocPercent) : "—"}-${Number.isFinite(snapshot.batteryMaxSocPercent) ? Math.round(snapshot.batteryMaxSocPercent) : "—"}%)`
            : "",
        ].filter(Boolean).join(" ")
        : "");
      if (snapshot.batteryFlow?.direction) addValue("Batteriefluss", `${this._batteryFlowDirectionLabel(snapshot.batteryFlow.direction)} ${this._formatBatteryFlowValue(snapshot.batteryFlow)}`);
      if (Number.isFinite(snapshot.batteryTemperatureCelsius)) addValue(this._t("tooltip.temperature", {}, "Temperature"), `${snapshot.batteryTemperatureCelsius.toFixed(Number.isInteger(snapshot.batteryTemperatureCelsius) ? 0 : 1)} °C`);
      if (Number.isFinite(snapshot.batteryCyclesToday)) addValue(this._t("editor.batteryCyclesTodayEntity", {}, "Battery cycles today entity"), snapshot.batteryCyclesToday.toFixed(snapshot.batteryCyclesToday % 1 === 0 ? 0 : 1));
    }
    if (isWallbox) {
      (snapshot.wallboxes || []).forEach((wallbox) => {
        addValue(wallbox.label, [
          Number.isFinite(wallbox.watts) ? powerFormatter(wallbox.watts) : "",
          Number.isFinite(wallbox.socPercent) ? `${Math.round(wallbox.socPercent)}%` : "",
          Number.isFinite(wallbox.maxSocPercent) ? `/ ${Math.round(wallbox.maxSocPercent)}%` : "",
          wallbox.connected === false ? "nicht verbunden" : "",
          wallbox.chargingEnabled === false ? "Laden deaktiviert" : "",
          wallbox.phaseAction?.label || "",
        ].filter(Boolean).join(" "));
      });
    }
    if (isLoad || isPv) addValue(this._t("advisor.consumption", {}, "Load"), this._advisorMetricValue(snapshot.loadWatts, powerFormatter));
    if (isLoad || isLargeConsumer || isPv) {
      (snapshot.largeConsumers || []).forEach((consumer) => {
        addValue(consumer.label, [
          powerFormatter(consumer.watts),
          Number.isFinite(consumer.maxPowerWatts) ? `${this._t("tooltip.max", {}, "Maximum")} ${powerFormatter(consumer.maxPowerWatts)}` : "",
        ].filter(Boolean).join(" / "));
      });
    }
    addValue(this._t("advisor.selfConsumption", {}, "Self-use"), this._advisorMetricValue(snapshot.selfConsumptionPercent, (value) => `${Math.round(value)}%`));
    addValue(this._t("advisor.autarky", {}, "Autarky"), this._advisorMetricValue(snapshot.autarkyPercent, (value) => `${Math.round(value)}%`));

    if (isPv) {
      addEntity(this._t("advisor.pv", {}, "PV"), this.config.entities?.pv_total_power || this.config.entities?.pv_roof_power || this.config.entities?.pv_shed_power);
      (snapshot.pvRoofStrings || []).forEach((string) => {
        addEntity(`${string.label} ${this._t("editor.pvRoofStringPowerEntity", {}, "String power entity")}`, string.powerEntityId);
        addEntity(`${string.label} ${this._t("editor.pvRoofStringEnergyEntity", {}, "String kWh counter entity")}`, string.energyEntityId);
      });
    }
    if (isGrid || isPv) {
      addEntity(this._t("advisor.grid", {}, "Grid"), this._gridPrimaryEntityId());
      addEntity(this._t("editor.importPowerEntity", {}, "Import entity"), this._gridImportEntityId());
      addEntity(this._t("editor.exportPowerEntity", {}, "Export entity"), this._gridExportEntityId());
    }
    if (isBattery || isPv || isGrid) {
      addEntity(this._t("advisor.batteryStatus", {}, "Battery"), this._batterySocEntityId());
      addEntity(this._t("editor.batteryMinSocEntity", {}, "Battery min SoC entity"), this._batteryMinSocEntityId());
      addEntity(this._t("editor.batteryMaxSocEntity", {}, "Battery max SoC entity"), this._batteryMaxSocEntityId());
      addEntity(this._t("editor.batteryFlowEntity", {}, "Battery flow entity (+/-)"), this.config.entities?.battery_flow_power || this.config.entities?.battery_charge_power || this.config.entities?.battery_discharge_power);
      addEntity(this._t("editor.batteryTemperatureEntity", {}, "Battery temperature entity"), this._batteryTemperatureEntityId());
      addEntity(this._t("editor.batteryCyclesTodayEntity", {}, "Battery cycles today entity"), this._batteryCyclesTodayEntityId());
    }
    if (isWallbox) {
      (snapshot.wallboxes || []).forEach((wallbox) => {
        addEntity(wallbox.label, wallbox.entityId);
        addEntity(`${wallbox.label} SoC`, wallbox.socEntityId);
        addEntity(`${wallbox.label} Max SoC`, wallbox.maxSocEntityId);
        addEntity(`${wallbox.label} ${this._t("editor.phaseActionEntity", {}, "Upcoming phase action entity")}`, wallbox.phaseAction?.actionEntityId);
        addEntity(`${wallbox.label} ${this._t("editor.phaseRemainingEntity", {}, "Phase action remaining seconds entity")}`, wallbox.phaseAction?.remainingEntityId);
      });
    }
    if (isLargeConsumer || isLoad || isPv) {
      (snapshot.largeConsumers || []).forEach((consumer) => {
        addEntity(`${consumer.label} ${this._t("editor.consumerPowerEntity", {}, "Power entity")}`, consumer.powerEntityId);
        addEntity(`${consumer.label} ${this._t("editor.consumerEnergyEntity", {}, "kWh counter entity")}`, consumer.energyEntityId);
      });
    }
    if (isLoad) addEntity(this._t("advisor.consumption", {}, "Load"), this.config.entities?.house_consumption_power);
    if (isSensors && Array.isArray(item.details)) item.details.forEach((detail) => addValue(this._t("advisor.sensors", {}, "Sensors"), detail));
    if (snapshot.electricityPriceEntityId) addEntity(this._t("advisor.electricityPrice", {}, "Electricity price"), snapshot.electricityPriceEntityId);
    const signalTopics = [
      isPv ? ["pv", "surplus", "weather"] : [],
      isGrid ? ["grid", "surplus"] : [],
      isBattery ? ["battery"] : [],
      isWallbox ? ["wallbox"] : [],
      isLoad || isLargeConsumer ? ["pv", "surplus"] : [],
      snapshot.electricityPriceEntityId ? ["price"] : [],
    ].flat();
    const signals = Array.isArray(item.signals) && item.signals.length > 0
      ? item.signals
      : this._advisorSignalDetails(snapshot, signalTopics);

    const dedupe = (list) => [...new Set(list)];
    const dedupedValues = dedupe(values);
    const dedupedSignals = dedupe(signals);
    const dedupedEntities = dedupe(entities);
    return {
      why: item.reason || item.text,
      paragraphs: this._advisorExplanationParagraphs(item, dedupedValues, dedupedSignals, dedupedEntities),
      signals: dedupedSignals,
      values: dedupedValues,
      entities: dedupedEntities,
    };
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
    const batteryStatus = Number.isFinite(snapshot.batteryPercent)
      ? [
        `${Math.round(snapshot.batteryPercent)}%`,
        Number.isFinite(snapshot.batteryMinSocPercent) || Number.isFinite(snapshot.batteryMaxSocPercent)
          ? `(${Number.isFinite(snapshot.batteryMinSocPercent) ? Math.round(snapshot.batteryMinSocPercent) : "—"}-${Number.isFinite(snapshot.batteryMaxSocPercent) ? Math.round(snapshot.batteryMaxSocPercent) : "—"}%)`
          : "",
      ].filter(Boolean).join(" ")
      : this._formatBatteryFlowValue(snapshot.batteryFlow) || this._t("advisor.unknown", {}, "Unknown");
    const metrics = [
      [this._t("advisor.pv", {}, "PV"), this._advisorMetricValue(snapshot.pvWatts, powerFormatter)],
      [this._t("advisor.grid", {}, "Grid"), gridStatus],
      [this._t("advisor.batteryStatus", {}, "Battery"), batteryStatus],
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
    const itemHtml = items.map((item, index) => {
      const itemKey = this._advisorItemKey(item, index);
      const dismissKey = this._advisorDismissKey(item);
      const open = this._openAdvisorDetails?.has(itemKey);
      const explanation = this._advisorItemDetails(item, snapshot);
      const details = Array.isArray(item.details) && item.details.length > 0
        ? `<div class="advisor-item-details">${item.details.map((detail) => `<span>${this._escape(detail)}</span>`).join("")}</div>`
        : "";
      const metaHtml = `
        <div class="advisor-item-meta">
          <span>${this._escape(this._advisorTypeLabel(item.type))}</span>
          <span>${this._escape(this._advisorWindowLabel(item.window))}</span>
          <button type="button" data-advisor-dismiss-key="${this._escape(dismissKey)}">${this._escape(this._t("advisor.dismissToday", {}, "Hide today"))}</button>
        </div>
      `;
      const explanationHtml = `
        <div class="advisor-explanation" ${open ? "" : "hidden"}>
          <div class="advisor-explanation-section">
            <strong>${this._escape(this._t("advisor.detailWhy", {}, "Why this appears"))}</strong>
            ${(explanation.paragraphs?.length ? explanation.paragraphs : [explanation.why]).map((paragraph) => `<p>${this._escape(paragraph)}</p>`).join("")}
          </div>
          ${explanation.entities.length > 0 ? `
            <details class="advisor-explanation-sources">
              <summary>${this._escape(this._t("advisor.detailSources", {}, "Data sources"))}</summary>
              <div>${explanation.entities.map((entity) => `<code>${this._escape(entity)}</code>`).join("")}</div>
            </details>
          ` : ""}
        </div>
      `;
      return `
        <div class="advisor-item advisor-${this._escape(item.type)}${open ? " is-open" : ""}" role="button" tabindex="0" aria-expanded="${open ? "true" : "false"}" aria-label="${this._escape(this._t("advisor.detailsToggle", {}, "Show details"))}" data-advisor-item-key="${this._escape(itemKey)}">
          <div class="advisor-item-head">
            <strong>${this._escape(item.title)}</strong>
            ${item.value ? `<span>${this._escape(item.value)}</span>` : ""}
          </div>
          <div class="advisor-item-text">${this._escape(item.text)}</div>
          ${metaHtml}
          ${details}
          ${explanationHtml}
        </div>
      `;
    }).join("");

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

    this._attachAdvisorControls();
  }

  _attachAdvisorControls() {
    this.shadowRoot.querySelectorAll("[data-advisor-dismiss-key]").forEach((button) => {
      if (button.dataset.advisorDismissBound === "true") return;
      button.dataset.advisorDismissBound = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._dismissAdvisorItem(button.dataset.advisorDismissKey);
      });
    });
    this.shadowRoot.querySelectorAll("[data-advisor-item-key]").forEach((element) => {
      if (element.dataset.advisorBound === "true") return;
      element.dataset.advisorBound = "true";
      const toggle = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const key = element.dataset.advisorItemKey;
        if (!key) return;
        if (!this._openAdvisorDetails) this._openAdvisorDetails = new Set();
        if (this._openAdvisorDetails.has(key)) this._openAdvisorDetails.delete(key);
        else this._openAdvisorDetails.add(key);
        const open = this._openAdvisorDetails.has(key);
        element.classList.toggle("is-open", open);
        element.setAttribute("aria-expanded", open ? "true" : "false");
        const explanation = element.querySelector(".advisor-explanation");
        if (explanation) explanation.hidden = !open;
      };
      element.addEventListener("click", toggle);
      element.addEventListener("keydown", (event) => {
        if (!["Enter", " "].includes(event.key)) return;
        toggle(event);
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

  _renderGridVoltageAlert() {
    const alert = this._gridVoltageAlert();
    if (!alert) return "";
    const value = alert.value ? ` ${alert.value}` : "";
    const sourceLabel = alert.metric ? this._metricLabel(alert.metric, this._currentVariant) : "";
    const source = sourceLabel && alert.entityId ? `${sourceLabel}: ${alert.entityId}` : alert.entityId || "";
    const text = `${alert.label}${value}`;
    return `
      <div class="voltage-alert voltage-alert-${this._escape(alert.type)}" data-grid-voltage-alert title="${this._escape(source)}" aria-label="${this._escape(text)}">
        <strong>${this._escape(alert.label)}</strong>
        <span>${this._escape(alert.value || "")}</span>
      </div>
    `;
  }

  _renderCardShell(state) {
    this._lastImageKey = this._imageStateKey();
    this._lastLanguage = this._language();
    this._currentVariant = state.variant;
    const activeView = this._currentViewMode();
    const visibleHudMetrics = this._visibleHudMetrics(state.variant);
    const visibleTileMetrics = this._visibleTileMetrics(state.variant);
    const largeConsumerMetrics = this._largeConsumerMetrics();
    const metricHtml = visibleHudMetrics.map((metric) => this._renderMetric(metric, state.variant)).join("");
    const imageOverlayHtml = this._renderImageOverlays(state.activeHouse);
    const flowHtml = this._renderEnergyFlows(state.variant);
    const advisorHtml = activeView === "advisor" ? this._renderEnergyAdvisor({ dashboard: true }) : "";
    const voltageAlertHtml = this._renderGridVoltageAlert();
    const statusLabel = this._statusLabel();
    const statusHtml = this.config.show_status_label !== false
      ? `<div class="scene-status" data-accent-key="${STATUS_METRIC.key}" data-status-label style="${this._escape(this._accentStyle(STATUS_METRIC))}">${this._escape(statusLabel)}</div>`
      : "";
    const headerHtml = [
      this.config.show_title !== false ? `<div class="title">${this._escape(this._displayTitle())}</div>` : "",
      activeView === "house" ? this._renderEnergyRangeSelector() : "",
      this._renderViewSelector(),
      activeView === "house" ? this._renderHouseSelector(state.activeHouse) : "",
    ].filter(Boolean).join("");
    const renderTile = (metric) => {
      const tooltip = this._metricTooltip(metric, state.variant);
      const warning = this._metricWarning(metric);
      const visibilityClass = metric.overlay ? this._labelVisibilityClass(metric.key, "footer") : "";
      const valueHtml = metric.key === "battery_level"
        ? `
          <div class="tile-value-row">
            <div class="num" data-value="${metric.key}">${this._renderMetricValueHtml(metric)}</div>
          </div>
          ${this._renderBatteryMetaRow(metric, { placement: "footer" })}
          ${this._renderVoltageMetaRow(metric, { placement: "footer" })}
        `
        : this._wallboxPhaseEntityKey(metric)
        ? `
          <div class="num" data-value="${metric.key}">${this._renderMetricValueHtml(metric)}</div>
          ${this._renderWallboxPhaseRow(metric, { placement: "footer" })}
          ${this._renderVoltageMetaRow(metric, { placement: "footer" })}
        `
        : this._isPvMetric(metric)
        ? `
          <div class="num" data-value="${metric.key}">${this._renderMetricValueHtml(metric)}</div>
          ${this._renderPvMetaRow(metric, { placement: "footer" })}
          ${this._renderVoltageMetaRow(metric, { placement: "footer" })}
        `
        : `
          <div class="num" data-value="${metric.key}">${this._renderMetricValueHtml(metric)}</div>
          ${this._renderVoltageMetaRow(metric, { placement: "footer" })}
        `;
      return `
        <div class="tile${this._metricStateClass(metric)}${visibilityClass}" data-accent-key="${metric.key}" data-tile="${metric.key}" data-tooltip-key="${metric.key}" data-chart-key="${this._escape(this._metricEntityId(metric) ? metric.key : "")}" data-warning="${this._escape(warning?.label || "")}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${this._escape(this._tileStyle(metric))}">
          <div class="name" data-label="${metric.key}">${this._escape(this._metricLabel(metric, state.variant))}</div>
          ${valueHtml}
          ${this._renderMetricMeter(metric)}
        </div>
      `;
    };
    const gridHtml = visibleTileMetrics.map(renderTile).join("");
    const largeConsumerHtml = largeConsumerMetrics.map(renderTile).join("");
    const largeConsumerSectionHtml = this.config.show_large_consumers !== false && largeConsumerMetrics.length > 0
      ? `
        <section class="tile-section large-consumer-section">
          <div class="tile-section-title">${this._escape(this._t("consumer.sectionTitle", {}, "Additional Large Consumers"))}</div>
          <div class="grid large-consumer-grid">${largeConsumerHtml}</div>
        </section>
      `
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; --text-main:#f3f6ff; --text-muted:#9ba3b8; --glass-soft:rgba(255,255,255,.08); --accent-yellow:#ffc233; --accent-blue:#1f8fff; --accent-green:#34d399; --hud-box-opacity:${this.config.hud_box_opacity}; --hud-box-scale:${this.config.hud_box_scale}; --hud-box-bg:rgba(8,16,38,var(--hud-box-opacity)); }
        ha-card { border-radius:18px; overflow:hidden; background:radial-gradient(110% 80% at 15% 0%, #232b44 0%, #111727 70%); color:var(--text-main); box-shadow:0 18px 45px rgba(0,0,0,.55); padding:16px; font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
        .header { display:grid; grid-template-columns:minmax(0,1fr) auto auto auto; align-items:center; gap:10px; margin-bottom:12px; }
        .title { min-width:0; overflow-wrap:anywhere; font-size:1.28rem; font-weight:700; line-height:1.2; }
        .house-select,.energy-range-select,.view-mode-toggle { background:var(--glass-soft); border:1px solid rgba(255,255,255,.2); border-radius:8px; color:var(--text-main); font:inherit; font-size:.88rem; min-height:34px; }
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
        .value-combo { display:flex; align-items:baseline; flex-wrap:wrap; gap:2px 4px; min-width:0; max-width:100%; line-height:1.15; }
        .value-combo .value-part { min-width:0; overflow-wrap:anywhere; }
        .value-combo .value-secondary { font-size:.72em; opacity:.74; font-weight:700; }
        .value-combo .value-separator { color:rgba(243,246,255,.55); font-size:.72em; }
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
        .phase-action-badge { display:block; flex:1 1 100%; min-width:0; width:fit-content; max-width:100%; border-radius:8px; padding:3px 7px; background:rgba(168,85,247,.14); color:#d8b4fe; font-size:.62rem; line-height:1.16; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(216,180,254,.2); white-space:normal; overflow-wrap:anywhere; text-overflow:clip; }
        .phase-action-badge:empty { display:none; }
        .pv-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:100%; border-radius:999px; padding:2px 5px; background:rgba(255,194,51,.14); color:#fde68a; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(253,230,138,.22); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .pv-badge:empty { display:none; }
        .voltage-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:86px; border-radius:999px; padding:2px 5px; background:rgba(250,204,21,.14); color:#fde047; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(250,204,21,.22); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .voltage-badge:empty { display:none; }
        .metric.is-warning,.tile.is-warning { border-color:color-mix(in srgb,#f87171 74%,rgba(255,255,255,.18)); box-shadow:0 8px 24px rgba(0,0,0,.35),0 0 18px rgba(248,113,113,.32),0 0 22px var(--tile-glow); }
        .metric[data-warning]:not([data-warning=""])::after,.tile[data-warning]:not([data-warning=""])::after { content:"!"; position:absolute; top:5px; right:6px; width:16px; height:16px; display:grid; place-items:center; border-radius:999px; background:#f87171; color:#1b1020; font-size:.66rem; font-weight:900; line-height:1; box-shadow:0 0 14px rgba(248,113,113,.42); }
        .voltage-alert { display:flex; align-items:center; justify-content:space-between; gap:10px; min-width:0; margin:0 0 12px; padding:9px 11px; border-radius:8px; border:1px solid color-mix(in srgb,var(--voltage-alert-color) 54%,rgba(255,255,255,.14)); background:color-mix(in srgb,var(--voltage-alert-color) 16%,rgba(8,16,38,.82)); color:var(--voltage-alert-color); box-shadow:inset 3px 0 0 var(--voltage-alert-color),0 8px 20px rgba(0,0,0,.2); }
        .voltage-alert-warning { --voltage-alert-color:#facc15; }
        .voltage-alert-critical { --voltage-alert-color:#f87171; }
        .voltage-alert strong { min-width:0; font-size:.86rem; line-height:1.2; overflow-wrap:anywhere; }
        .voltage-alert span { flex:0 0 auto; font-size:.82rem; line-height:1.1; font-weight:900; border-radius:999px; padding:4px 7px; background:rgba(255,255,255,.1); }
        .scene-status { --tile-accent:rgba(243,246,255,.86); --tile-glow:transparent; position:absolute; z-index:3; right:10px; bottom:10px; max-width:calc(100% - 20px); background:rgba(8,16,38,.62); border:1px solid color-mix(in srgb,var(--tile-accent) 34%,rgba(255,255,255,.14)); border-radius:8px; color:rgba(243,246,255,.86); font-size:.72rem; line-height:1.25; padding:5px 8px; backdrop-filter:blur(4px); box-shadow:0 8px 18px rgba(0,0,0,.28),0 0 18px var(--tile-glow); pointer-events:none; overflow-wrap:anywhere; }
        .scene-status:empty { display:none; }
        .grid { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:8px; }
        .tile { --tile-accent:var(--text-main); --tile-glow:transparent; --tile-columns:1; --tile-mobile-columns:1; position:relative; grid-column:span var(--tile-columns); background:linear-gradient(135deg,rgba(12,20,38,.78),rgba(12,20,38,.62)); border:1px solid color-mix(in srgb,var(--tile-accent) 34%,rgba(255,255,255,.08)); border-radius:8px; padding:10px; min-width:0; cursor:pointer; box-shadow:inset 3px 0 0 var(--tile-accent),0 8px 20px rgba(0,0,0,.18),0 0 20px var(--tile-glow); }
        .tile-section { display:grid; gap:8px; margin-top:12px; min-width:0; }
        .tile-section-title { color:var(--text-muted); font-size:.76rem; line-height:1.2; font-weight:800; text-transform:uppercase; letter-spacing:0; }
        .advisor { --advisor-accent:#93c5fd; display:grid; gap:10px; margin-top:12px; padding:12px; border-radius:8px; border:1px solid color-mix(in srgb,var(--advisor-accent) 36%,rgba(255,255,255,.1)); background:linear-gradient(135deg,rgba(15,23,42,.76),rgba(8,13,28,.68)); box-shadow:inset 3px 0 0 var(--advisor-accent),0 10px 24px rgba(0,0,0,.18); }
        .advisor-dashboard { margin-top:0; min-height:320px; align-content:start; }
        .advisor-critical { --advisor-accent:#f87171; }
        .advisor-warning { --advisor-accent:#fb923c; }
        .advisor-info { --advisor-accent:#60a5fa; }
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
        .advisor-item { --item-accent:#93c5fd; display:grid; gap:4px; min-width:0; padding:9px; border-radius:8px; background:rgba(255,255,255,.055); border:1px solid color-mix(in srgb,var(--item-accent) 28%,rgba(255,255,255,.08)); box-shadow:inset 2px 0 0 var(--item-accent); cursor:pointer; }
        .advisor-item:focus-visible { outline:2px solid color-mix(in srgb,var(--item-accent) 84%,#fff); outline-offset:2px; }
        .advisor-item.advisor-critical { --item-accent:#f87171; }
        .advisor-item.advisor-warning { --item-accent:#fb923c; }
        .advisor-item.advisor-opportunity { --item-accent:#34d399; }
        .advisor-item.advisor-success { --item-accent:#34d399; }
        .advisor-item.advisor-setup { --item-accent:#93c5fd; }
        .advisor-item.advisor-info { --item-accent:#60a5fa; }
        .advisor-item-head { display:flex; align-items:center; justify-content:space-between; gap:8px; min-width:0; }
        .advisor-item-head strong { min-width:0; color:var(--item-accent); font-size:.82rem; line-height:1.2; overflow-wrap:anywhere; }
        .advisor-item-head span { flex:0 0 auto; max-width:42%; color:var(--text-main); font-size:.74rem; font-weight:800; line-height:1.1; border-radius:999px; padding:3px 6px; background:rgba(255,255,255,.08); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .advisor-item-text { color:rgba(243,246,255,.86); font-size:.78rem; line-height:1.35; overflow-wrap:anywhere; }
        .advisor-item-meta { display:flex; flex-wrap:wrap; align-items:center; gap:5px; min-width:0; }
        .advisor-item-meta span,.advisor-item-meta button { min-width:0; border:0; border-radius:999px; padding:3px 7px; background:color-mix(in srgb,var(--item-accent) 14%,rgba(255,255,255,.08)); color:var(--item-accent); font:inherit; font-size:.68rem; line-height:1.15; font-weight:800; overflow-wrap:anywhere; }
        .advisor-item-meta button { cursor:pointer; color:rgba(243,246,255,.8); background:rgba(255,255,255,.08); }
        .advisor-item-meta button:focus-visible { outline:2px solid color-mix(in srgb,var(--item-accent) 84%,#fff); outline-offset:2px; }
        .advisor-item-details { display:grid; gap:3px; min-width:0; margin-top:2px; }
        .advisor-item-details span { min-width:0; color:rgba(243,246,255,.76); font-size:.72rem; line-height:1.25; overflow-wrap:anywhere; }
        .advisor-explanation { display:grid; gap:7px; min-width:0; margin-top:7px; padding-top:8px; border-top:1px solid color-mix(in srgb,var(--item-accent) 24%,rgba(255,255,255,.12)); }
        .advisor-explanation[hidden] { display:none; }
        .advisor-explanation-section { display:grid; gap:3px; min-width:0; }
        .advisor-explanation-section strong { color:var(--text-muted); font-size:.68rem; line-height:1.2; text-transform:uppercase; letter-spacing:0; }
        .advisor-explanation-section p { margin:0; min-width:0; color:rgba(243,246,255,.8); font-size:.76rem; line-height:1.35; overflow-wrap:anywhere; }
        .advisor-explanation-section span,.advisor-explanation-section code { min-width:0; color:rgba(243,246,255,.78); font-size:.72rem; line-height:1.28; overflow-wrap:anywhere; }
        .advisor-explanation-section code { font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; border-radius:6px; padding:2px 5px; background:rgba(255,255,255,.06); }
        .advisor-explanation-sources { display:grid; gap:5px; min-width:0; margin-top:2px; }
        .advisor-explanation-sources summary { color:var(--text-muted); font-size:.68rem; line-height:1.2; font-weight:800; text-transform:uppercase; letter-spacing:0; cursor:pointer; }
        .advisor-explanation-sources div { display:grid; gap:3px; min-width:0; }
        .advisor-explanation-sources code { min-width:0; color:rgba(243,246,255,.78); font-size:.72rem; line-height:1.28; overflow-wrap:anywhere; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; border-radius:6px; padding:2px 5px; background:rgba(255,255,255,.06); }
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
        @media (max-width:700px){ .hide-mobile{display:none!important;} .header{grid-template-columns:minmax(0,1fr);align-items:stretch;} .house-select,.energy-range-select,.view-mode-toggle{width:100%;max-width:none;} .metric{width:clamp(68px,18%,96px);padding:5px 7px;} .metric .label{font-size:.62rem;} .metric .value{font-size:.76rem;} .grid{grid-template-columns:repeat(2,minmax(0,1fr));} .tile{grid-column:span var(--tile-mobile-columns);} .advisor-head{display:grid;} .advisor-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}.advisor-items{grid-template-columns:minmax(0,1fr);} .chart-head{display:grid;} .chart-actions{justify-content:end;} }
        @media (min-width:701px){ .hide-desktop{display:none!important;} }
      </style>
      <ha-card>
        ${headerHtml ? `<div class="header">${headerHtml}</div>` : ""}
        ${voltageAlertHtml}
        ${activeView === "advisor"
          ? advisorHtml
          : `
            <div class="scene"><img class="scene-image" src="${this._escape(state.imageSrc)}" data-fallbacks="${this._escape((state.imageFallbacks || []).join("|"))}" alt="${this._escape(this._houseLabel(state.activeHouse, state.variant))}" />${imageOverlayHtml}${flowHtml}${metricHtml}${statusHtml}</div>
            ${this.config.show_metric_tiles !== false ? `<div class="grid">${gridHtml}</div>${largeConsumerSectionHtml}` : ""}
          `}
      </ha-card>
      ${this._renderChartOverlay()}
    `;

    this._attachControls();
    this._syncAdvisorRefreshTimer(activeView === "advisor");
  }

  _updateReadings() {
    const variant = this._currentVariant || this._layoutState().variant;
    const liveMetrics = [
      ...TILE_METRICS,
      ...this._visibleOverlayMetrics(),
      ...(this._showGridStatusTile() ? [GRID_STATUS_METRIC] : []),
      ...this._customKpiMetrics(),
      ...this._largeConsumerMetrics(),
    ];

    liveMetrics.forEach((metric) => {
      const readingHtml = this._renderMetricValueHtml(metric);
      const label = this._metricLabel(metric, variant);
      this.shadowRoot.querySelectorAll(`[data-label="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== label) element.textContent = label;
      });
      this.shadowRoot.querySelectorAll(`[data-value="${metric.key}"]`).forEach((element) => {
        if (element.innerHTML !== readingHtml) element.innerHTML = readingHtml;
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
      const phaseAction = this._wallboxPhaseActionInfo(metric);
      const phaseActionLabel = phaseAction?.label || "";
      const phaseActionTitle = phaseActionLabel ? `${this._t("tooltip.phaseChange", {}, "Upcoming phase change")}: ${phaseActionLabel}` : "";
      this.shadowRoot.querySelectorAll(`[data-phase-action="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== phaseActionLabel) element.textContent = phaseActionLabel;
        element.style.display = phaseActionLabel ? "inline-flex" : "none";
        element.setAttribute("title", phaseActionTitle);
        element.setAttribute("aria-label", phaseActionTitle);
      });
      const voltageEntries = new Map(this._metricVoltageEntries(metric, variant).map((entry) => [entry.key, entry]));
      this.shadowRoot.querySelectorAll(`[data-voltage="${metric.key}"]`).forEach((element) => {
        const entry = voltageEntries.get(element.dataset.voltageKey || this._metricVoltageEntityKey(metric));
        const voltageLabel = entry?.displayValue || "";
        const voltageTitle = entry ? `${this._t("tooltip.voltage", {}, "Voltage")}: ${entry.label} ${entry.value}` : "";
        if (element.textContent !== voltageLabel) element.textContent = voltageLabel;
        element.style.display = voltageLabel ? "inline-flex" : "none";
        element.setAttribute("title", voltageTitle);
        element.setAttribute("aria-label", voltageTitle);
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
        const batteryVoltageLabel = this._batteryVoltageLabel();
        const batteryVoltageTitle = batteryVoltageLabel ? `${this._t("tooltip.voltage", {}, "Voltage")}: ${batteryVoltageLabel}` : "";
        this.shadowRoot.querySelectorAll("[data-battery-voltage]").forEach((element) => {
          if (element.textContent !== batteryVoltageLabel) element.textContent = batteryVoltageLabel;
          element.style.display = batteryVoltageLabel ? "inline-flex" : "none";
          element.setAttribute("title", batteryVoltageTitle);
          element.setAttribute("aria-label", batteryVoltageTitle);
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
    const nextVoltageAlertHtml = this._renderGridVoltageAlert();
    const voltageAlertElement = this.shadowRoot.querySelector("[data-grid-voltage-alert]");
    if (voltageAlertElement && nextVoltageAlertHtml) {
      const trimmed = nextVoltageAlertHtml.trim();
      if (voltageAlertElement.outerHTML !== trimmed) voltageAlertElement.outerHTML = trimmed;
    } else if (voltageAlertElement && !nextVoltageAlertHtml) {
      voltageAlertElement.remove();
    } else if (!voltageAlertElement && nextVoltageAlertHtml) {
      const anchor = this.shadowRoot.querySelector(".scene,[data-energy-advisor]");
      if (anchor) anchor.insertAdjacentHTML("beforebegin", nextVoltageAlertHtml);
      else this.shadowRoot.querySelector("ha-card")?.insertAdjacentHTML("beforeend", nextVoltageAlertHtml);
    }
    const activeView = this._currentViewMode();
    const nextAdvisorHtml = activeView === "advisor" ? this._renderEnergyAdvisor({ dashboard: true }) : "";
    const advisorElement = this.shadowRoot.querySelector("[data-energy-advisor]");
    let advisorChanged = false;
    if (advisorElement && nextAdvisorHtml) {
      advisorElement.outerHTML = nextAdvisorHtml.trim();
      advisorChanged = true;
    } else if (advisorElement && !nextAdvisorHtml) {
      advisorElement.remove();
    } else if (!advisorElement && nextAdvisorHtml) {
      this.shadowRoot.querySelector("ha-card")?.insertAdjacentHTML("beforeend", nextAdvisorHtml);
      advisorChanged = true;
    }
    if (advisorChanged) this._attachAdvisorControls();
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
      large_consumers: [],
      pv_roof_strings: [],
      pv_roof_string_display: "sum",
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
      large_consumers: normalizeLargeConsumers((config || {}).large_consumers || (config || {}).large_consumers_config || []),
      pv_roof_strings: normalizePvRoofStrings((config || {}).pv_roof_strings || (config || {}).pv_roof_string_config || []),
      pv_roof_string_display: normalizePvRoofStringDisplay((config || {}).pv_roof_string_display || (config || {}).pv_roof_display || "sum"),
    };
    delete this._config.show_energy_advisor;
    this._render();
    this._ensureTranslationsForRender();
  }

  set hass(hass) {
    const previousLanguage = this._language();
    const hadEntityOptions = this._entityOptions().length > 0;
    this._hass = hass;
    const nextLanguage = this._language();
    const hasEntityOptions = this._entityOptions().length > 0;
    if (!this._rendered || (!hadEntityOptions && hasEntityOptions) || previousLanguage !== nextLanguage) {
      this._render();
      this._ensureTranslationsForRender();
    }
  }

  _language() {
    return languageFromHass(this._hass);
  }

  _t(key, replacements = {}, fallback = "") {
    return translate(this._language(), key, replacements, fallback);
  }

  _ensureTranslationsForRender() {
    const language = this._language();
    ensureTranslations(language, () => {
      if (!this._config || this._language() !== language) return;
      this._render();
    });
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
    const numericFields = new Set(["hud_box_opacity", "hud_box_scale", "power_decimals", "advisor_max_suggestions", "advisor_ev_surplus_threshold", "grid_voltage_warning_threshold", "grid_voltage_critical_threshold"]);
    const numericProps = new Set(["left", "top", "width", "position", "columns"]);
    const shouldBeNumeric = numericFields.has(path) || numericProps.has(lastPart) || parts[0] === "max_power_kw" || lastPart === "max_power_kw";
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

  _addPvRoofString() {
    const next = this._cloneConfig(this._config || {});
    next.pv_roof_strings = normalizePvRoofStrings(next.pv_roof_strings || []);
    const index = next.pv_roof_strings.length;
    next.pv_roof_strings.push({
      id: `string_${Date.now()}`,
      label: `String ${index + 2}`,
      power_entity: "",
      energy_entity: "",
      max_power_kw: "",
      visible: true,
    });
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _removePvRoofString(index) {
    const next = this._cloneConfig(this._config || {});
    next.pv_roof_strings = normalizePvRoofStrings(next.pv_roof_strings || []);
    next.pv_roof_strings.splice(index, 1);
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _addLargeConsumer() {
    const next = this._cloneConfig(this._config || {});
    next.large_consumers = normalizeLargeConsumers(next.large_consumers || []);
    const index = next.large_consumers.length;
    next.large_consumers.push({
      id: `custom_${Date.now()}`,
      type: "custom",
      labelKey: "consumer.customLarge",
      defaultLabel: "Custom large consumer",
      label: "",
      power_entity: "",
      voltage_entity: "",
      energy_entity: "",
      max_power_kw: "",
      position: 200 + index,
      columns: 1,
      color: "#a78bfa",
      custom: true,
      visible: true,
    });
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _removeLargeConsumer(index) {
    const next = this._cloneConfig(this._config || {});
    next.large_consumers = normalizeLargeConsumers(next.large_consumers || []);
    const consumer = next.large_consumers[index];
    if (!consumer?.custom) return;
    next.large_consumers.splice(index, 1);
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
    const voltageMetricKey = key?.replace(/_voltage$/, "");
    const voltageMetric = TILE_METRICS.find((item) => item.key === voltageMetricKey);
    if (voltageMetric) return `${this._metricLabel(voltageMetric)} ${this._t("tooltip.voltage", {}, "Voltage")}`;
    const labels = {
      weather_entity: this._t("editor.weatherEntity", {}, "Weather Entity"),
      electricity_price: this._t("editor.electricityPriceEntity", {}, "Electricity price entity"),
      battery_flow_power: this._t("editor.batteryFlowEntity", {}, "Battery flow entity (+/-)"),
      battery_flow_power_voltage: `${this._t("advisor.batteryStatus", {}, "Battery")} ${this._t("tooltip.voltage", {}, "Voltage")}`,
      inverter_power_voltage_l1: `${this._t("metrics.inverter_power", {}, "Inverter")} ${this._t("tooltip.voltage", {}, "Voltage")} L1`,
      inverter_power_voltage_l2: `${this._t("metrics.inverter_power", {}, "Inverter")} ${this._t("tooltip.voltage", {}, "Voltage")} L2`,
      inverter_power_voltage_l3: `${this._t("metrics.inverter_power", {}, "Inverter")} ${this._t("tooltip.voltage", {}, "Voltage")} L3`,
      battery_charge_power: this._t("editor.batteryChargeEntity", {}, "Battery charge entity"),
      battery_discharge_power: this._t("editor.batteryDischargeEntity", {}, "Battery discharge entity"),
      battery_min_soc: this._t("editor.batteryMinSocEntity", {}, "Battery min SoC entity"),
      battery_max_soc: this._t("editor.batteryMaxSocEntity", {}, "Battery max SoC entity"),
      battery_temperature: this._t("editor.batteryTemperatureEntity", {}, "Battery temperature entity"),
      battery_cycles_today: this._t("editor.batteryCyclesTodayEntity", {}, "Battery cycles today entity"),
      import_power: this._t("editor.importPowerEntity", {}, "Import entity"),
      export_power: this._t("editor.exportPowerEntity", {}, "Export entity"),
      wallbox_phase: this._t("editor.phaseEntity", {}, "Phase entity"),
      wallbox_phase_action: this._t("editor.phaseActionEntity", {}, "Upcoming phase action entity"),
      wallbox_phase_remaining: this._t("editor.phaseRemainingEntity", {}, "Phase action remaining seconds entity"),
      wallbox_soc: this._t("editor.vehicleSocEntity", {}, "Vehicle SoC entity"),
      wallbox_max_soc: this._t("editor.vehicleMaxSocEntity", {}, "Vehicle max/target SoC entity"),
      wallbox_connected: this._t("editor.vehicleConnectedEntity", {}, "Vehicle connected entity"),
      wallbox_charging_enabled: this._t("editor.vehicleChargingEnabledEntity", {}, "Charging enabled entity"),
      wallbox_remaining_time: this._t("editor.remainingChargeTimeEntity", {}, "Remaining charge time entity"),
      wallbox2_phase: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.phaseEntity", {}, "Phase entity")}`,
      wallbox2_phase_action: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.phaseActionEntity", {}, "Upcoming phase action entity")}`,
      wallbox2_phase_remaining: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.phaseRemainingEntity", {}, "Phase action remaining seconds entity")}`,
      wallbox2_soc: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.vehicleSocEntity", {}, "Vehicle SoC entity")}`,
      wallbox2_max_soc: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.vehicleMaxSocEntity", {}, "Vehicle max/target SoC entity")}`,
      wallbox2_connected: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.vehicleConnectedEntity", {}, "Vehicle connected entity")}`,
      wallbox2_charging_enabled: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.vehicleChargingEnabledEntity", {}, "Charging enabled entity")}`,
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
    const voltageTarget = {
      domains: ["sensor"],
      deviceClasses: ["voltage"],
      units: ["v"],
      include: [{ terms: ["voltage", "volt", "spannung"], weight: 28 }],
      exclude: ["power", "leistung", "energy", "kwh", "soc", "temperature", "temperatur"],
    };
    const pvTerms = { terms: ["pv", "solar", "photovoltaic", "photovoltaik"], weight: 36 };
    const gridTerms = { terms: ["grid", "netz", "meter", "utility", "power meter", "smart meter"], weight: 28 };
    const wallboxTerms = { terms: ["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], weight: 34 };
    const batteryTerms = { terms: ["battery", "batterie", "speicher", "akku"], weight: 34 };

    return [
      { path: "weather_entity", domains: ["weather"], include: [{ terms: ["weather", "wetter", "home", "haus"], weight: 14 }], threshold: 35 },
      { path: "entities.electricity_price", domains: ["sensor"], include: [{ terms: ["electricity price", "strompreis", "price", "tariff", "tarif", "tibber", "awattar"], weight: 34 }], exclude: ["power", "leistung", "energy", "kwh total"], threshold: 42 },
      { path: "entities.pv_roof_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["roof", "dach", "rooftop"]], include: [pvTerms, { terms: ["roof", "dach", "rooftop"], weight: 24 }, ...powerTarget.include], exclude: ["shed", "garage", "carport", "schuppen", "total", "gesamt", "forecast", "prognose"], threshold: 60 },
      { path: "entities.pv_roof_power_voltage", ...voltageTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["roof", "dach", "rooftop"]], include: [pvTerms, { terms: ["roof", "dach", "rooftop"], weight: 24 }, ...voltageTarget.include], exclude: ["shed", "garage", "carport", "schuppen", "total", "gesamt", ...voltageTarget.exclude], threshold: 62 },
      { path: "entities.pv_shed_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["shed", "garage", "carport", "schuppen", "balkon", "balcony"]], include: [pvTerms, { terms: ["shed", "garage", "carport", "schuppen", "balkon", "balcony"], weight: 28 }, ...powerTarget.include], exclude: ["roof", "dach", "total", "gesamt", "forecast", "prognose"], threshold: 62 },
      { path: "entities.pv_shed_power_voltage", ...voltageTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["shed", "garage", "carport", "schuppen", "balkon", "balcony"]], include: [pvTerms, { terms: ["shed", "garage", "carport", "schuppen", "balkon", "balcony"], weight: 28 }, ...voltageTarget.include], exclude: ["roof", "dach", "total", "gesamt", ...voltageTarget.exclude], threshold: 64 },
      { path: "entities.pv_total_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["total", "gesamt", "sum", "summe", "all", "anlage"]], block: ["forecast", "prognose", "today", "heute", "daily"], include: [pvTerms, { terms: ["total", "gesamt", "sum", "summe", "all", "anlage"], weight: 28 }, ...powerTarget.include], exclude: ["forecast", "prognose", "today", "heute", "daily"], threshold: 60 },
      { path: "entities.pv_total_power_voltage", ...voltageTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["total", "gesamt", "sum", "summe", "all", "anlage"]], include: [pvTerms, { terms: ["total", "gesamt", "sum", "summe", "all", "anlage"], weight: 28 }, ...voltageTarget.include], exclude: ["forecast", "prognose", "today", "heute", "daily", ...voltageTarget.exclude], threshold: 62 },
      { path: "entities.pv_roof_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"]], include: [pvTerms, ...powerTarget.include], exclude: ["shed", "garage", "carport", "schuppen", "total", "gesamt", "forecast", "prognose", "today", "heute", "daily"], threshold: 70 },
      { path: "entities.pv_total_power_today_energy", ...energyTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["today", "heute", "daily", "day", "tag"]], include: [pvTerms, { terms: ["today", "heute", "daily", "day", "tag"], weight: 30 }, ...energyTarget.include], exclude: ["forecast", "prognose"], threshold: 62 },
      { path: "energy_entities.pv_total_power.entity", ...energyTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"]], block: ["power", "leistung", "today", "heute", "daily", "day", "tag", "forecast", "prognose"], include: [pvTerms, { terms: ["total", "gesamt", "lifetime", "counter", "zaehler"], weight: 22 }, ...energyTarget.include], exclude: ["today", "heute", "daily", "forecast", "prognose"], threshold: 58 },
      { path: "entities.battery_level", domains: ["sensor"], deviceClasses: ["battery"], units: ["%"], required: [["battery", "batterie", "speicher", "akku"], ["soc", "level", "stand", "charge", "ladestand"]], include: [batteryTerms, { terms: ["soc", "level", "stand", "charge", "ladestand"], weight: 34 }], exclude: ["power", "leistung", "temp", "temperature", "temperatur", "flow", "fluss", "min", "minimum", "max", "maximum", "target", "ziel", "limit", "reserve"], threshold: 58 },
      { path: "entities.battery_min_soc", domains: ["sensor", "number", "input_number"], units: ["%"], required: [["battery", "batterie", "speicher", "akku"], ["min", "minimum", "reserve", "backup", "untergrenze", "reserve"]], include: [batteryTerms, { terms: ["min", "minimum", "reserve", "backup", "untergrenze", "soc"], weight: 34 }], exclude: ["power", "leistung", "temp", "temperature", "fluss", "flow", "max", "maximum", "target", "ziel"], threshold: 58 },
      { path: "entities.battery_max_soc", domains: ["sensor", "number", "input_number"], units: ["%"], required: [["battery", "batterie", "speicher", "akku"], ["max", "maximum", "target", "ziel", "limit", "obergrenze"]], include: [batteryTerms, { terms: ["max", "maximum", "target", "ziel", "limit", "obergrenze", "soc"], weight: 34 }], exclude: ["power", "leistung", "temp", "temperature", "fluss", "flow", "min", "minimum", "reserve", "backup"], threshold: 58 },
      { path: "entities.battery_flow_power", ...powerTarget, required: [["battery", "batterie", "speicher", "akku"]], include: [batteryTerms, { terms: ["power", "leistung", "flow", "fluss", "charge discharge", "laden entladen"], weight: 26 }], exclude: ["soc", "level", "stand", "temperature", "temperatur", "temp"], threshold: 58 },
      { path: "entities.battery_flow_power_voltage", ...voltageTarget, required: [["battery", "batterie", "speicher", "akku"]], include: [batteryTerms, ...voltageTarget.include], threshold: 58 },
      { path: "entities.battery_charge_power", ...powerTarget, required: [["battery", "batterie", "speicher", "akku"], ["charge", "charging", "laden", "ladeleistung"]], include: [batteryTerms, { terms: ["charge", "charging", "laden", "ladeleistung"], weight: 30 }], exclude: ["discharge", "entladen", "entlade", "soc", "temperature", "temperatur"], threshold: 62 },
      { path: "entities.battery_discharge_power", ...powerTarget, required: [["battery", "batterie", "speicher", "akku"], ["discharge", "discharging", "entladen", "entladeleistung"]], include: [batteryTerms, { terms: ["discharge", "discharging", "entladen", "entladeleistung"], weight: 30 }], exclude: ["charge", "charging", "laden", "ladeleistung", "soc", "temperature", "temperatur"], threshold: 62 },
      { path: "entities.battery_temperature", domains: ["sensor"], deviceClasses: ["temperature"], units: ["°c", "c"], required: [["battery", "batterie", "speicher", "akku"], ["temperature", "temperatur", "temp"]], include: [batteryTerms, { terms: ["temperature", "temperatur", "temp"], weight: 30 }], exclude: ["power", "leistung", "soc"], threshold: 58 },
      { path: "entities.battery_cycles_today", domains: ["sensor"], required: [["battery", "batterie", "speicher", "akku"], ["cycle", "cycles", "zyklen", "vollzyklen"], ["today", "heute", "daily", "tag"]], include: [batteryTerms, { terms: ["cycle", "cycles", "zyklen", "vollzyklen", "today", "heute", "daily", "tag"], weight: 34 }], exclude: ["power", "leistung", "soc", "temperature", "temperatur"], threshold: 58 },
      { path: "entities.inverter_power", ...powerTarget, required: [["inverter", "wechselrichter", "wr"]], include: [{ terms: ["inverter", "wechselrichter", "wr"], weight: 38 }, ...powerTarget.include], exclude: ["battery", "batterie", "soc", "temperature"], threshold: 56 },
      { path: "entities.inverter_power_voltage_l1", ...voltageTarget, required: [["inverter", "wechselrichter", "wr"], ["l1", "phase 1", "phase l1", "spannung l1", "u1"]], include: [{ terms: ["inverter", "wechselrichter", "wr"], weight: 38 }, { terms: ["l1", "phase 1", "phase l1", "spannung l1", "u1"], weight: 34 }, ...voltageTarget.include], exclude: ["battery", "batterie", "l2", "l3", ...voltageTarget.exclude], threshold: 62 },
      { path: "entities.inverter_power_voltage_l2", ...voltageTarget, required: [["inverter", "wechselrichter", "wr"], ["l2", "phase 2", "phase l2", "spannung l2", "u2"]], include: [{ terms: ["inverter", "wechselrichter", "wr"], weight: 38 }, { terms: ["l2", "phase 2", "phase l2", "spannung l2", "u2"], weight: 34 }, ...voltageTarget.include], exclude: ["battery", "batterie", "l1", "l3", ...voltageTarget.exclude], threshold: 62 },
      { path: "entities.inverter_power_voltage_l3", ...voltageTarget, required: [["inverter", "wechselrichter", "wr"], ["l3", "phase 3", "phase l3", "spannung l3", "u3"]], include: [{ terms: ["inverter", "wechselrichter", "wr"], weight: 38 }, { terms: ["l3", "phase 3", "phase l3", "spannung l3", "u3"], weight: 34 }, ...voltageTarget.include], exclude: ["battery", "batterie", "l1", "l2", ...voltageTarget.exclude], threshold: 62 },
      { path: "entities.inverter_power_voltage", ...voltageTarget, required: [["inverter", "wechselrichter", "wr"]], include: [{ terms: ["inverter", "wechselrichter", "wr"], weight: 38 }, ...voltageTarget.include], exclude: ["battery", "batterie", ...voltageTarget.exclude], threshold: 58 },
      { path: "entities.wallbox_power", ...powerTarget, required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"]], include: [wallboxTerms, ...powerTarget.include], exclude: ["2", "second", "zweite", "two", "phase", "phasen", "soc", "remaining", "time", "zeit", "energy", "kwh"], threshold: 56 },
      { path: "entities.wallbox_power_voltage", ...voltageTarget, required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"]], include: [wallboxTerms, ...voltageTarget.include], exclude: ["2", "second", "zweite", "two", "phase", "phasen", "soc", "remaining", "time", "zeit", ...voltageTarget.exclude], threshold: 58 },
      { path: "entities.wallbox_phase", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["phase", "phases", "phasen"]], include: [wallboxTerms, { terms: ["phase", "phases", "phasen"], weight: 34 }], exclude: ["power", "leistung", "energy", "kwh"], threshold: 58 },
      { path: "entities.wallbox_phase_action", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["phase", "phases", "phasen"], ["action", "activity", "aktivität", "aktion"]], include: [wallboxTerms, { terms: ["phase action", "phase activity", "phasen aktivität", "phasen aktion", "action value"], weight: 40 }], exclude: ["remaining", "verbleibend", "seconds", "sekunden", "time", "zeit", "power", "leistung", "energy", "kwh"], threshold: 58 },
      { path: "entities.wallbox_phase_remaining", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["phase", "phases", "phasen"], ["remaining", "verbleibend", "seconds", "sekunden", "time", "zeit"]], include: [wallboxTerms, { terms: ["phase remaining", "phasen verbleibend", "remaining", "verbleibend", "seconds", "sekunden"], weight: 40 }], exclude: ["action", "activity", "aktivität", "aktion", "power", "leistung", "energy", "kwh"], threshold: 58 },
      { path: "entities.wallbox_soc", domains: ["sensor"], units: ["%"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"]], include: [wallboxTerms, { terms: ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"], weight: 30 }], exclude: ["power", "leistung", "phase", "phasen", "max", "target", "ziel", "limit"], threshold: 58 },
      { path: "entities.wallbox_max_soc", domains: ["sensor", "number", "input_number"], units: ["%"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["max", "target", "ziel", "limit", "charge limit", "ladelimit"]], include: [wallboxTerms, { terms: ["max", "target", "ziel", "limit", "charge limit", "ladelimit", "soc"], weight: 34 }], exclude: ["power", "leistung", "phase", "phasen", "remaining", "time"], threshold: 58 },
      { path: "entities.wallbox_connected", domains: ["binary_sensor", "sensor", "switch"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["connected", "plugged", "plug", "cable", "vehicle", "car", "auto", "verbunden", "eingesteckt", "kabel"]], include: [wallboxTerms, { terms: ["connected", "plugged", "plug", "cable", "vehicle", "car", "auto", "verbunden", "eingesteckt", "kabel"], weight: 32 }], exclude: ["power", "leistung", "phase", "phasen", "soc", "remaining"], threshold: 58 },
      { path: "entities.wallbox_charging_enabled", domains: ["switch", "binary_sensor", "sensor", "input_boolean"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["enabled", "allowed", "enable", "freigabe", "aktiviert", "start", "stop"]], include: [wallboxTerms, { terms: ["enabled", "allowed", "enable", "freigabe", "aktiviert", "start", "stop", "charging"], weight: 30 }], exclude: ["power", "leistung", "phase", "phasen", "soc", "remaining"], threshold: 58 },
      { path: "entities.wallbox_remaining_time", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"]], include: [wallboxTerms, { terms: ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"], weight: 30 }], exclude: ["power", "leistung", "phase", "soc"], threshold: 58 },
      { path: "entities.wallbox2_power", ...powerTarget, required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 22 }, ...powerTarget.include], exclude: ["phase", "phasen", "soc", "remaining", "time", "zeit", "energy", "kwh"], threshold: 62 },
      { path: "entities.wallbox2_power_voltage", ...voltageTarget, required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 22 }, ...voltageTarget.include], exclude: ["phase", "phasen", "soc", "remaining", "time", "zeit", ...voltageTarget.exclude], threshold: 64 },
      { path: "entities.wallbox2_phase", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["phase", "phases", "phasen"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["phase", "phases", "phasen"], weight: 34 }], exclude: ["power", "leistung", "energy", "kwh"], threshold: 64 },
      { path: "entities.wallbox2_phase_action", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["phase", "phases", "phasen"], ["action", "activity", "aktivität", "aktion"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["phase action", "phase activity", "phasen aktivität", "phasen aktion", "action value"], weight: 40 }], exclude: ["remaining", "verbleibend", "seconds", "sekunden", "time", "zeit", "power", "leistung", "energy", "kwh"], threshold: 64 },
      { path: "entities.wallbox2_phase_remaining", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["phase", "phases", "phasen"], ["remaining", "verbleibend", "seconds", "sekunden", "time", "zeit"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["phase remaining", "phasen verbleibend", "remaining", "verbleibend", "seconds", "sekunden"], weight: 40 }], exclude: ["action", "activity", "aktivität", "aktion", "power", "leistung", "energy", "kwh"], threshold: 64 },
      { path: "entities.wallbox2_soc", domains: ["sensor"], units: ["%"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"], weight: 30 }], exclude: ["power", "leistung", "phase", "phasen", "max", "target", "ziel", "limit"], threshold: 64 },
      { path: "entities.wallbox2_max_soc", domains: ["sensor", "number", "input_number"], units: ["%"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["max", "target", "ziel", "limit", "charge limit", "ladelimit"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["max", "target", "ziel", "limit", "charge limit", "ladelimit", "soc"], weight: 34 }], exclude: ["power", "leistung", "phase", "phasen", "remaining", "time"], threshold: 64 },
      { path: "entities.wallbox2_connected", domains: ["binary_sensor", "sensor", "switch"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["connected", "plugged", "plug", "cable", "vehicle", "car", "auto", "verbunden", "eingesteckt", "kabel"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["connected", "plugged", "plug", "cable", "vehicle", "car", "auto", "verbunden", "eingesteckt", "kabel"], weight: 32 }], exclude: ["power", "leistung", "phase", "phasen", "soc", "remaining"], threshold: 64 },
      { path: "entities.wallbox2_charging_enabled", domains: ["switch", "binary_sensor", "sensor", "input_boolean"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["enabled", "allowed", "enable", "freigabe", "aktiviert", "start", "stop"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["enabled", "allowed", "enable", "freigabe", "aktiviert", "start", "stop", "charging"], weight: 30 }], exclude: ["power", "leistung", "phase", "phasen", "soc", "remaining"], threshold: 64 },
      { path: "entities.wallbox2_remaining_time", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"], weight: 30 }], exclude: ["power", "leistung", "phase", "soc"], threshold: 64 },
      { path: "entities.import_export_power", ...powerTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"], ["import export", "bezug einspeisung", "net", "saldo", "balance", "signed"]], include: [gridTerms, { terms: ["import export", "bezug einspeisung", "net", "saldo", "balance", "signed"], weight: 28 }, ...powerTarget.include], exclude: ["energy", "kwh", "total"], threshold: 58 },
      { path: "entities.import_export_power_voltage", ...voltageTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"]], include: [gridTerms, ...voltageTarget.include], threshold: 58 },
      { path: "entities.import_power", ...powerTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"], ["import", "bezug", "purchase", "verbrauch netz", "from grid"]], include: [gridTerms, { terms: ["import", "bezug", "purchase", "verbrauch netz", "from grid"], weight: 32 }], exclude: ["export", "einspeis", "feed", "energy", "kwh"], threshold: 62 },
      { path: "entities.export_power", ...powerTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"], ["export", "einspeis", "feed", "feedin", "to grid"]], include: [gridTerms, { terms: ["export", "einspeis", "feed", "feedin", "to grid"], weight: 32 }], exclude: ["import", "bezug", "purchase", "energy", "kwh"], threshold: 62 },
      { path: "entities.house_consumption_power", ...powerTarget, required: [["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"]], include: [{ terms: ["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"], weight: 34 }, ...powerTarget.include], exclude: ["grid", "netz", "battery", "batterie", "pv", "solar", "wallbox"], threshold: 56 },
      { path: "entities.house_consumption_power_voltage", ...voltageTarget, required: [["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"]], include: [{ terms: ["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"], weight: 34 }, ...voltageTarget.include], exclude: ["grid", "netz", "battery", "batterie", "pv", "solar", "wallbox", ...voltageTarget.exclude], threshold: 58 },
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
      if (suggestion.path.startsWith("entities.wallbox2_")) this._setPath(next, ["visible_boxes", "wallbox2_power"], true);
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
    if (metric.key === "pv_roof_power") return "";
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
    if (metric.key === "pv_roof_power") return "";
    const config = this._energyEntityConfig(metric);
    const counterValue = config.entity || config.counter || config.kwh_entity || config.kwh || config.meter || "";

    return `
      <label>${this._escape(this._t("editor.energyCounterEntity"))}
        <input data-path="energy_entities.${metric.key}.entity" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(metric.key)}_energy_total" value="${this._escape(counterValue)}" autocomplete="off" />
      </label>
    `;
  }

  _metricVoltageEntityKey(metric) {
    if (!metric || metric.unit !== "power") return "";
    return `${metric.sourceKey || metric.key}_voltage`;
  }

  _metricVoltagePhaseFields(metric) {
    if ((metric?.sourceKey || metric?.key) !== "inverter_power") return [];
    return [
      ["inverter_power_voltage_l1", "editor.voltageEntityL1", "Voltage L1 entity"],
      ["inverter_power_voltage_l2", "editor.voltageEntityL2", "Voltage L2 entity"],
      ["inverter_power_voltage_l3", "editor.voltageEntityL3", "Voltage L3 entity"],
    ];
  }

  _renderVoltageEntityInput(metric) {
    const key = this._metricVoltageEntityKey(metric);
    if (!key) return "";
    const selected = this._config?.entities?.[key] || "";
    const phaseFields = this._metricVoltagePhaseFields(metric).map(([phaseKey, labelKey, fallback]) => `
      <label>${this._escape(this._t(labelKey, {}, fallback))}
        <input data-path="entities.${phaseKey}" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(phaseKey)}" value="${this._escape(this._config?.entities?.[phaseKey] || "")}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions(phaseKey)}
    `).join("");
    return `
      <label>${this._escape(this._t("editor.voltageEntity", {}, "Voltage entity"))}
        <input data-path="entities.${key}" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(key)}" value="${this._escape(selected)}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions(key)}
      ${phaseFields}
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

  _renderPvRoofStringInputs(metric) {
    if (metric?.key !== "pv_roof_power") return "";
    const strings = normalizePvRoofStrings(this._config.pv_roof_strings || []);
    this._config.pv_roof_strings = strings;
    const baseEnergyConfig = this._energyEntityConfig(metric);
    const baseEnergyEntity = baseEnergyConfig.entity || baseEnergyConfig.counter || baseEnergyConfig.kwh_entity || baseEnergyConfig.kwh || baseEnergyConfig.meter || "";
    const baseMaxPowerKw = this._maxPowerKwValue(metric);
    const basePowerEntity = this._config?.entities?.pv_roof_power || "";
    const selectedDisplay = normalizePvRoofStringDisplay(this._config.pv_roof_string_display);
    const displayOptions = [
      ["sum", this._t("editor.pvRoofStringDisplaySum", {}, "Sum strings")],
      ["values", this._t("editor.pvRoofStringDisplayValues", {}, "Show string values")],
      ["dominant", this._t("editor.pvRoofStringDisplayDominant", {}, "Highest string large, others small")],
    ].map(([value, label]) => (
      `<option value="${this._escape(value)}"${value === selectedDisplay ? " selected" : ""}>${this._escape(label)}</option>`
    )).join("");
    const baseStringField = `
      <div class="box-field pv-string-field">
        <div class="kpi-head">
          <strong>String 1</strong>
        </div>
        <label>${this._escape(this._t("editor.pvRoofStringPowerEntity", {}, "String power entity"))}
          <input data-path="entities.pv_roof_power" list="ha-solar-dashboard-entities" placeholder="sensor.pv_roof_power" value="${this._escape(basePowerEntity)}" autocomplete="off" />
        </label>
        <label>${this._escape(this._t("editor.pvRoofStringEnergyEntity", {}, "String kWh counter entity"))}
          <input data-path="energy_entities.pv_roof_power.entity" list="ha-solar-dashboard-entities" placeholder="sensor.pv_roof_power_energy_total" value="${this._escape(baseEnergyEntity)}" autocomplete="off" />
        </label>
        <label>${this._escape(this._t("editor.maxPowerKw"))}
          <input type="number" min="0" step="0.1" data-path="max_power_kw.pv_roof_power" placeholder="5.0" value="${this._escape(baseMaxPowerKw)}" />
        </label>
      </div>
    `;
    const stringFields = strings.map((string, index) => {
      const label = string.label || `String ${index + 2}`;
      const powerEntity = string.power_entity || "";
      const energyEntity = string.energy_entity || "";
      const maxPowerKw = string.max_power_kw ?? "";
      return `
        <div class="box-field pv-string-field">
          <div class="kpi-head">
            <strong>${this._escape(label)}</strong>
            <button type="button" data-action="remove-pv-roof-string" data-index="${this._escape(index)}">${this._escape(this._t("editor.kpiRemove"))}</button>
          </div>
          <label>${this._escape(this._t("editor.pvRoofStringLabel", {}, "String name"))}
            <input data-path="pv_roof_strings.${index}.label" placeholder="String ${this._escape(index + 2)}" value="${this._escape(label)}" />
          </label>
          <label>${this._escape(this._t("editor.pvRoofStringPowerEntity", {}, "String power entity"))}
            <input data-path="pv_roof_strings.${index}.power_entity" list="ha-solar-dashboard-entities" placeholder="sensor.pv_roof_string_${this._escape(index + 2)}_power" value="${this._escape(powerEntity)}" autocomplete="off" />
          </label>
          <label>${this._escape(this._t("editor.pvRoofStringEnergyEntity", {}, "String kWh counter entity"))}
            <input data-path="pv_roof_strings.${index}.energy_entity" list="ha-solar-dashboard-entities" placeholder="sensor.pv_roof_string_${this._escape(index + 2)}_energy_total" value="${this._escape(energyEntity)}" autocomplete="off" />
          </label>
          <label>${this._escape(this._t("editor.maxPowerKw"))}
            <input type="number" min="0" step="0.1" data-path="pv_roof_strings.${index}.max_power_kw" placeholder="5.0" value="${this._escape(maxPowerKw)}" />
          </label>
        </div>
      `;
    }).join("");

    return `
      <details class="pv-labels" open>
        <summary>${this._escape(this._t("editor.pvRoofStrings", {}, "Roof PV strings"))}</summary>
        <div class="details-grid">
          <label>${this._escape(this._t("editor.pvRoofStringDisplay", {}, "Roof PV string display"))}
            <select data-path="pv_roof_string_display">${displayOptions}</select>
          </label>
          ${baseStringField}
          ${stringFields}
          <button type="button" data-action="add-pv-roof-string">${this._escape(this._t("editor.pvRoofStringAdd", {}, "Add string"))}</button>
        </div>
      </details>
    `;
  }

  _wallboxPhaseEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_phase";
    if (metric?.key === "wallbox2_power") return "wallbox2_phase";
    return "";
  }

  _wallboxPhaseActionEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_phase_action";
    if (metric?.key === "wallbox2_power") return "wallbox2_phase_action";
    return "";
  }

  _wallboxPhaseRemainingEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_phase_remaining";
    if (metric?.key === "wallbox2_power") return "wallbox2_phase_remaining";
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

  _renderWallboxPhaseActionInput(metric) {
    const actionKey = this._wallboxPhaseActionEntityKey(metric);
    const remainingKey = this._wallboxPhaseRemainingEntityKey(metric);
    if (!actionKey || !remainingKey) return "";
    const actionValue = this._config.entities?.[actionKey] || "";
    const remainingValue = this._config.entities?.[remainingKey] || "";
    const base = metric.key === "wallbox2_power" ? "wallbox_2" : "wallbox";
    return `
      <label>${this._escape(this._t("editor.phaseActionEntity", {}, "Upcoming phase action entity"))}
        <input data-path="entities.${actionKey}" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(base)}_phase_action_value" value="${this._escape(actionValue)}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.phaseRemainingEntity", {}, "Phase action remaining seconds entity"))}
        <input data-path="entities.${remainingKey}" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(base)}_phase_remaining" value="${this._escape(remainingValue)}" autocomplete="off" />
      </label>
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

  _wallboxMaxSocEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_max_soc";
    if (metric?.key === "wallbox2_power") return "wallbox2_max_soc";
    return "";
  }

  _renderWallboxMaxSocInput(metric) {
    const entityKey = this._wallboxMaxSocEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "number.wallbox_2_target_soc"
      : "number.wallbox_target_soc";
    return `
      <label>${this._escape(this._t("editor.vehicleMaxSocEntity", {}, "Vehicle max/target SoC entity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
    `;
  }

  _wallboxConnectedEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_connected";
    if (metric?.key === "wallbox2_power") return "wallbox2_connected";
    return "";
  }

  _renderWallboxConnectedInput(metric) {
    const entityKey = this._wallboxConnectedEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "binary_sensor.wallbox_2_vehicle_connected"
      : "binary_sensor.wallbox_vehicle_connected";
    return `
      <label>${this._escape(this._t("editor.vehicleConnectedEntity", {}, "Vehicle connected entity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
    `;
  }

  _wallboxChargingEnabledEntityKey(metric) {
    if (metric?.key === "wallbox_power") return "wallbox_charging_enabled";
    if (metric?.key === "wallbox2_power") return "wallbox2_charging_enabled";
    return "";
  }

  _renderWallboxChargingEnabledInput(metric) {
    const entityKey = this._wallboxChargingEnabledEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "switch.wallbox_2_charging_enabled"
      : "switch.wallbox_charging_enabled";
    return `
      <label>${this._escape(this._t("editor.vehicleChargingEnabledEntity", {}, "Charging enabled entity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
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
    if (metric.key === "pv_roof_power") return "";
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
      <label>${this._escape(this._t("editor.voltageEntity", {}, "Voltage entity"))}
        <input data-path="entities.battery_flow_power_voltage" list="ha-solar-dashboard-entities" placeholder="sensor.battery_voltage" value="${this._escape(this._config.entities?.battery_flow_power_voltage || "")}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions("battery_flow_power_voltage")}
      <label>${this._escape(this._t("editor.batteryChargeEntity"))}
        <input data-path="entities.battery_charge_power" list="ha-solar-dashboard-entities" placeholder="sensor.battery_charge_power" value="${this._escape(this._config.entities?.battery_charge_power || "")}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.batteryDischargeEntity"))}
        <input data-path="entities.battery_discharge_power" list="ha-solar-dashboard-entities" placeholder="sensor.battery_discharge_power" value="${this._escape(this._config.entities?.battery_discharge_power || "")}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.batteryMinSocEntity", {}, "Battery min SoC entity"))}
        <input data-path="entities.battery_min_soc" list="ha-solar-dashboard-entities" placeholder="number.battery_min_soc" value="${this._escape(this._config.entities?.battery_min_soc || "")}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.batteryMaxSocEntity", {}, "Battery max SoC entity"))}
        <input data-path="entities.battery_max_soc" list="ha-solar-dashboard-entities" placeholder="number.battery_max_soc" value="${this._escape(this._config.entities?.battery_max_soc || "")}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.batteryTemperatureEntity"))}
        <input data-path="entities.battery_temperature" list="ha-solar-dashboard-entities" placeholder="sensor.battery_temperature" value="${this._escape(this._config.entities?.battery_temperature || "")}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions("battery_temperature")}
      <label>${this._escape(this._t("editor.batteryCyclesTodayEntity", {}, "Battery cycles today entity"))}
        <input data-path="entities.battery_cycles_today" list="ha-solar-dashboard-entities" placeholder="sensor.battery_cycles_today" value="${this._escape(this._config.entities?.battery_cycles_today || "")}" autocomplete="off" />
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
        ${this._renderVoltageEntityInput(metric)}
        ${this._renderPvLabelInputs(metric)}
        ${this._renderPvRoofStringInputs(metric)}
        ${this._renderEnergyEntityInputs(metric)}
        ${this._renderWallboxPhaseInput(metric)}
        ${this._renderWallboxPhaseActionInput(metric)}
        ${this._renderWallboxSocInput(metric)}
        ${this._renderWallboxMaxSocInput(metric)}
        ${this._renderWallboxConnectedInput(metric)}
        ${this._renderWallboxChargingEnabledInput(metric)}
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

  _largeConsumerLabel(consumer, index = 0) {
    const configured = String(consumer?.label || "").trim();
    if (configured) return configured;
    if (consumer?.labelKey) return this._t(consumer.labelKey, {}, consumer.defaultLabel || `Consumer ${index + 1}`);
    return this._t(`consumer.${consumer?.type || consumer?.id}`, {}, consumer?.defaultLabel || `Consumer ${index + 1}`);
  }

  _renderLargeConsumerField(consumer, index) {
    const label = this._largeConsumerLabel(consumer, index);
    const labelValue = consumer?.label || "";
    const powerEntity = consumer?.power_entity || "";
    const voltageEntity = consumer?.voltage_entity || "";
    const energyEntity = consumer?.energy_entity || "";
    const maxPowerKw = consumer?.max_power_kw ?? "";
    const position = Number.isFinite(Number(consumer?.position)) ? Number(consumer.position) : 200 + index;
    const columns = Number.isFinite(Number(consumer?.columns)) ? Number(consumer.columns) : 1;
    const color = consumer?.color || "#1f8fff";
    const visible = consumer?.visible !== false;
    const placeholderBase = String(consumer?.id || `consumer_${index + 1}`).replace(/[^\w-]+/g, "_");

    return `
      <div class="box-field consumer-field">
        <div class="kpi-head">
          <strong>${this._escape(label)}</strong>
          ${consumer?.custom ? `<button type="button" data-action="remove-large-consumer" data-index="${this._escape(index)}">${this._escape(this._t("editor.kpiRemove"))}</button>` : ""}
        </div>
        <label class="inline"><input type="checkbox" data-path="large_consumers.${index}.visible" ${visible ? "checked" : ""}/> ${this._escape(this._t("editor.consumerShow", { label }, `Show ${label} tile`))}</label>
        <label>${this._escape(this._t("editor.consumerLabel", {}, "Device name"))}
          <input data-path="large_consumers.${index}.label" placeholder="${this._escape(label)}" value="${this._escape(labelValue)}" />
        </label>
        <label>${this._escape(this._t("editor.consumerPowerEntity", {}, "Power entity"))}
          <input data-path="large_consumers.${index}.power_entity" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(placeholderBase)}_power" value="${this._escape(powerEntity)}" autocomplete="off" />
        </label>
        <label>${this._escape(this._t("editor.voltageEntity", {}, "Voltage entity"))}
          <input data-path="large_consumers.${index}.voltage_entity" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(placeholderBase)}_voltage" value="${this._escape(voltageEntity)}" autocomplete="off" />
        </label>
        <label>${this._escape(this._t("editor.consumerEnergyEntity", {}, "kWh counter entity"))}
          <input data-path="large_consumers.${index}.energy_entity" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(placeholderBase)}_energy" value="${this._escape(energyEntity)}" autocomplete="off" />
        </label>
        <label>${this._escape(this._t("editor.maxPowerKw"))}
          <input type="number" min="0" step="0.1" data-path="large_consumers.${index}.max_power_kw" placeholder="2.0" value="${this._escape(maxPowerKw)}" />
        </label>
        <label>${this._escape(this._t("editor.kpiPosition"))} (${this._escape(position)})
          <input type="number" min="0" max="999" step="1" data-path="large_consumers.${index}.position" value="${this._escape(position)}" />
        </label>
        <label>${this._escape(this._t("editor.kpiColumns"))} (${this._escape(columns)})
          <input type="range" min="1" max="6" step="1" data-path="large_consumers.${index}.columns" value="${this._escape(columns)}" />
        </label>
        <label>${this._escape(this._t("editor.kpiColor"))}
          <input data-path="large_consumers.${index}.color" placeholder="#1f8fff" value="${this._escape(color)}" />
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
    this._config.pv_roof_string_display = normalizePvRoofStringDisplay(this._config.pv_roof_string_display);
    this._config.pv_roof_strings = normalizePvRoofStrings(this._config.pv_roof_strings || []);
    const largeConsumers = normalizeLargeConsumers(this._config.large_consumers || []);
    this._config.large_consumers = largeConsumers;
    const largeConsumerFields = largeConsumers.map((consumer, index) => this._renderLargeConsumerField(consumer, index)).join("");
    const overlayFields = IMAGE_OVERLAY_KEYS.map((key) => this._renderOverlayField(key)).join("");
    const sectionState = this._editorSectionState || new Map();
    const sectionOpen = (key, defaultOpen = false) => sectionState.has(key) ? sectionState.get(key) : defaultOpen;
    const renderEditorSection = (key, title, content, defaultOpen = false) => `
      <details class="editor-section" data-editor-section="${this._escape(key)}"${sectionOpen(key, defaultOpen) ? " open" : ""}>
        <summary><span>${this._escape(title)}</span></summary>
        <div class="section-body">${content}</div>
      </details>
    `;
    const generalSettingsHtml = `
      <section class="editor-panel editor-general">
        <div class="editor-panel-title">${this._escape(this._t("editor.sectionGeneral", {}, "General settings"))}</div>
        <div class="settings-grid">
          <label>${this._escape(this._t("editor.title"))} <input data-path="title" value="${this._escape(this._config.title || "")}" /></label>
          <label>${this._escape(this._t("editor.viewMode", {}, "Default view"))} <select data-path="view_mode">${viewModeOptions}</select></label>
          <label>${this._escape(this._t("editor.houseType"))} <select data-path="house">${houseOptions}</select></label>
          <label>${this._escape(this._t("editor.customImage"))} <input data-path="image" placeholder="/local/solar/single_family_home/single_family_home.png or https://..." value="${this._escape(this._config.image || "")}" /></label>
          <label>${this._escape(this._t("editor.customDayImage"))} <input data-path="day_image" placeholder="${this._escape(this._t("editor.optionalDayImage"))}" value="${this._escape(this._config.day_image || "")}" /></label>
          <label>${this._escape(this._t("editor.weatherEntity"))}
            <input data-path="weather_entity" list="ha-solar-dashboard-entities" placeholder="weather.home" value="${this._escape(this._config.weather_entity || "")}" autocomplete="off" />
          </label>
        </div>
        <div class="checkbox-grid">
          <label class="inline"><input type="checkbox" data-path="show_title" ${this._config.show_title !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showTitle"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_view_selector" ${this._config.show_view_selector !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showViewSelector", {}, "Show House/Advisor view selector"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_house_selector" ${this._config.show_house_selector !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showHouseSelector"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_energy_range_selector" ${this._config.show_energy_range_selector === true ? "checked" : ""}/> ${this._escape(this._t("editor.showEnergyRangeSelector"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_metric_tiles" ${this._config.show_metric_tiles !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showMetricTiles"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_large_consumers" ${this._config.show_large_consumers !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showLargeConsumers", {}, "Show large consumers in house view"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_power_flows" ${this._config.show_power_flows === true ? "checked" : ""}/> ${this._escape(this._t("editor.showPowerFlows"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_grid_status_tile" ${this._config.show_grid_status_tile !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showGridStatusTile"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_status_label" ${this._config.show_status_label !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showStatusLabel"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_weather_status" ${this._config.show_weather_status === true ? "checked" : ""}/> ${this._escape(this._t("editor.showWeatherStatus"))}</label>
        </div>
      </section>
    `;
    const advisorSettingsHtml = `
      <div class="details-grid">
        <label>${this._escape(this._t("editor.advisorMaxSuggestions", {}, "Advisor suggestions"))} (${this._escape(Number(this._config.advisor_max_suggestions ?? 8).toFixed(0))})
          <input type="range" min="1" max="12" step="1" data-path="advisor_max_suggestions" value="${this._escape(this._config.advisor_max_suggestions ?? 8)}" />
        </label>
        <label>${this._escape(this._t("editor.advisorEvSurplusThreshold", {}, "EV surplus threshold (W)"))}
          <input type="number" min="0" max="1000000" step="50" data-path="advisor_ev_surplus_threshold" value="${this._escape(this._config.advisor_ev_surplus_threshold ?? 1500)}" />
        </label>
        <label>${this._escape(this._t("editor.electricityPriceEntity", {}, "Electricity price entity"))}
          <input data-path="entities.electricity_price" list="ha-solar-dashboard-entities" placeholder="sensor.electricity_price" value="${this._escape(this._config.entities?.electricity_price || "")}" autocomplete="off" />
        </label>
      </div>
    `;
    const appearanceSettingsHtml = `
      <div class="details-grid">
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
        <label>${this._escape(this._t("editor.gridVoltageWarningThreshold", {}, "High grid voltage (V)"))}
          <input type="number" min="0" max="1000" step="1" data-path="grid_voltage_warning_threshold" value="${this._escape(this._config.grid_voltage_warning_threshold ?? 245)}" />
        </label>
        <label>${this._escape(this._t("editor.gridVoltageCriticalThreshold", {}, "Critical grid voltage (V)"))}
          <input type="number" min="0" max="1000" step="1" data-path="grid_voltage_critical_threshold" value="${this._escape(this._config.grid_voltage_critical_threshold ?? 253)}" />
        </label>
      </div>
    `;
    const boxSettingsHtml = `<div class="grid">${TILE_METRICS.map((metric) => this._renderBoxField(metric)).join("")}</div>`;
    const overlaySettingsHtml = `<div class="grid">${overlayFields}</div>`;
    const kpiSettingsHtml = `
      <div class="grid">${customKpiFields}</div>
      <div class="action-row"><button type="button" data-action="add-kpi">${this._escape(this._t("editor.kpiAdd"))}</button></div>
    `;
    const largeConsumerSettingsHtml = `
      <div class="grid">${largeConsumerFields}</div>
      <div class="action-row"><button type="button" data-action="add-large-consumer">${this._escape(this._t("editor.consumerAddCustom", {}, "Add custom large consumer"))}</button></div>
    `;

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
        .editor-panel,.editor-section{padding:10px;border:1px solid var(--divider-color,#4b5563);border-radius:8px;background:var(--card-background-color,rgba(17,24,39,.72));min-width:0}
        .editor-panel{display:grid;gap:10px}
        .editor-panel-title{font-size:14px;font-weight:800;color:var(--primary-text-color,#f3f4f6)}
        .editor-section summary{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:14px;font-weight:800;list-style:none}
        .editor-section summary::-webkit-details-marker{display:none}
        .editor-section summary::after{content:"▾";font-size:12px;color:var(--secondary-text-color,#9ca3af);transition:transform .18s ease}
        .editor-section:not([open]) summary::after{transform:rotate(-90deg)}
        .editor-section[open] summary{margin-bottom:8px}
        .section-body{display:grid;gap:8px;min-width:0}
        .settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;min-width:0}
        .action-row{display:flex;justify-content:flex-start;min-width:0}
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
        @media (max-width:700px){.checkbox-grid,.settings-grid{grid-template-columns:minmax(0,1fr)}}
        @media (max-width:700px){.wizard-suggestion{grid-template-columns:minmax(0,1fr)}.wizard-suggestion-side{justify-items:start;white-space:normal}}
      </style>
      <div class="editor">
        <datalist id="ha-solar-dashboard-entities">${entityOptions}</datalist>
        ${this._renderSetupWizard()}
        ${generalSettingsHtml}
        ${renderEditorSection("advisor", this._t("editor.sectionAdvisor", {}, "Advisor and prices"), advisorSettingsHtml)}
        ${renderEditorSection("appearance", this._t("editor.sectionAppearance", {}, "Display and limits"), appearanceSettingsHtml)}
        ${renderEditorSection("boxes", this._t("editor.sectionBoxes", {}, "Boxes, live/kWh entities, unit, and position"), boxSettingsHtml)}
        ${renderEditorSection("overlays", this._t("editor.sectionOverlays", {}, "Image overlays"), overlaySettingsHtml)}
        ${renderEditorSection("kpis", this._t("editor.sectionKpis", {}, "Custom KPI tiles"), kpiSettingsHtml)}
        ${renderEditorSection("large-consumers", this._t("editor.sectionLargeConsumers", {}, "Additional large consumers"), largeConsumerSettingsHtml)}
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
        if (target.dataset.action === "add-pv-roof-string") this._addPvRoofString();
        if (target.dataset.action === "remove-pv-roof-string") this._removePvRoofString(Number(target.dataset.index));
        if (target.dataset.action === "add-large-consumer") this._addLargeConsumer();
        if (target.dataset.action === "remove-large-consumer") this._removeLargeConsumer(Number(target.dataset.index));
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
    this.shadowRoot.querySelectorAll("details[data-editor-section]").forEach((details) => {
      details.addEventListener("toggle", (event) => {
        const key = event.currentTarget.dataset.editorSection;
        if (!key) return;
        this._editorSectionState = this._editorSectionState || new Map();
        this._editorSectionState.set(key, event.currentTarget.open);
      });
    });
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
