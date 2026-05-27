import {
  ADVISOR_DEFAULTS,
  advisorSuggestionLimit,
  advisorThresholds,
  advisorTypeRank,
  normalizeAdvisorConfig,
  sortAdvisorItems,
} from "../modules/advisor.js";
import {
  createAdvisorEngineMethods,
} from "../modules/advisor-engine.js";
import {
  createAdvisorViewMethods,
} from "../modules/advisor-view.js";
import {
  formatDurationMinutes,
  formatDurationSeconds,
  formatEnergyValue,
  formatPowerValue,
  formatRemainingChargeTimeValue,
  formatValue,
  formatVolumeValue,
  formatVoltageValue,
  formatWithUnit,
  isEnergyUnit,
  isPowerUnit,
  isVolumeUnit,
  normalizeUnit,
  numericState,
  valueAsCubicMeters,
  valueAsKwh,
  valueAsVolts,
  valueAsWatts,
} from "../modules/formatters.js";
import {
  buildInverterEntries,
  buildPvRoofStringEntries,
  formatInverterReading,
  formatPvRoofStringReading,
  hasAdditionalInverters,
  hasAdditionalPvRoofStrings,
  inverterEnergyParts,
  inverterMaxPowerWatts,
  inverterPowerParts,
  inverterTotalPowerWatts,
  normalizeInverterDisplay,
  normalizeInverters,
  normalizePvRoofStringDisplay,
  normalizePvRoofStrings,
  parsePowerLimitWatts,
  pvRoofBaseEnergyEntityId,
  pvRoofStringAdvisorDetails,
  pvRoofStringEnergyParts,
  pvRoofStringMaxPowerWatts,
  pvRoofStringPowerParts,
  pvRoofStringTotalPowerWatts,
} from "../modules/pv-strings.js";
import {
  formatGridStatusReading,
  formatGridValueReading,
  formatImportExportStatus,
  gridExportEntityId,
  gridImportEntityId,
  gridPrimaryEntityId,
  gridSignedEntityId,
  gridSignedFlowInfo,
  gridSplitFlowInfo,
  gridSplitPowerDetails,
  gridStatusFromFlowInfo,
  hasGridPowerSource,
} from "../modules/grid-flow.js";
import {
  classNames,
  escapeHtml,
  htmlTag,
  rawHtml,
  styleMap,
} from "../modules/html.js";
import {
  chartBounds,
  chartDashboardSections,
  chartHistoryApiPath,
  chartHistoryCacheKey,
  chartHistoryPoint,
  chartLastPointCoordinates,
  chartPath,
  flattenChartSections,
} from "../modules/charts.js";
import {
  CHART_DASHBOARD_VIEW,
  FLOORPLAN_DASHBOARD_VIEW,
  RECORDS_DASHBOARD_VIEW,
  VIEW_MODE_OPTIONS,
  normalizeViewMode,
  viewModeIconSvg,
} from "../modules/views.js";
import {
  createWeatherImageMethods,
} from "../modules/weather-images.js";
import {
  RECORDS_DEFAULT_DAYS,
  RECORDS_RANGE_OPTIONS,
  activeDurationRecords,
  createRecordsDashboardMethods,
  dailyEnergyRecords,
  peakPowerRecord,
  recordsHistoryCacheKey,
} from "../modules/records.js";
import {
  DEFAULT_TILE_COLOR_RULES,
  GRID_STATUS_METRIC,
  OVERLAY_TILE_METRICS,
  STATIC_METRIC_COLORS,
  STATUS_METRIC,
  TILE_METRICS,
  findFlowMetric,
  findMetricByKey,
  inverterPhaseVoltageEntityKeys,
  isImportExportMetric,
  isPvMetric,
  isPvRoofMetric,
  metricSourceKey,
  metricVoltageEntityKey,
} from "../modules/metrics.js";
import {
  createDashboardEditorClass,
} from "../modules/editor.js";
import {
  largeConsumerAdvisorDetails,
  largeConsumerEnergyEntityId,
  largeConsumerEntityIds,
  largeConsumerHasEntity,
  largeConsumerLabel,
  largeConsumerMetrics,
  largeConsumerPowerEntityId,
  largeConsumerPowerWatts,
  largeConsumerVoltageEntityId,
  normalizeLargeConsumers,
} from "../modules/large-consumers.js";
import {
  WALLBOX_POWER_KEYS,
  adjacentWallboxPosition,
  numericPercentValue,
  wallboxAdvisorDetails,
  wallboxBooleanEntityState,
  wallboxChargingEnabledEntityId,
  wallboxChargingEnabledEntityKey,
  wallboxConnectedEntityId,
  wallboxConnectedEntityKey,
  wallboxIsCharging,
  wallboxMaxSocEntityId,
  wallboxMaxSocEntityKey,
  wallboxPhaseActionEntityId,
  wallboxPhaseActionEntityKey,
  wallboxPhaseActionInfo,
  wallboxPhaseActionText,
  wallboxPhaseEntityId,
  wallboxPhaseEntityKey,
  wallboxPhaseLabel,
  wallboxPhaseRemainingEntityId,
  wallboxPhaseRemainingEntityKey,
  wallboxPhaseRemainingSeconds,
  wallboxRemainingTimeEntityId,
  wallboxRemainingTimeEntityKey,
  wallboxRemainingTimeLabel,
  wallboxSocEntityId,
  wallboxSocEntityKey,
  wallboxSocLabel,
} from "../modules/wallbox.js";

const CARD_TYPE = "ha-solar-dashboard-card";
const CARD_EDITOR_TYPE = "ha-solar-dashboard-card-editor";
const REPOSITORY_IMAGE_BASE =
  "https://raw.githubusercontent.com/404GamerNotFound/ha-solar-dashboard/main/images";

const ENERGY_RANGE_OPTIONS = [
  { key: "live", labelKey: "range.live", label: "Live" },
  { key: "1h", labelKey: "range.1h", label: "1h" },
  { key: "24h", labelKey: "range.24h", label: "24h" },
  { key: "month", labelKey: "range.month", label: "1 month" },
  { key: "year", labelKey: "range.year", label: "1 year" },
  { key: "total", labelKey: "range.total", label: "Total" },
];

const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["en", "de", "es", "fr", "pl"];
const I18N = {};
const I18N_LOADS = new Map();

function scriptAssetBaseUrl() {
  const currentScriptUrl = globalThis.document?.currentScript?.src;
  if (currentScriptUrl) return currentScriptUrl;
  const scripts = Array.from(globalThis.document?.querySelectorAll?.("script[src]") || []);
  const script = scripts
    .map((element) => element.src || element.getAttribute?.("src") || "")
    .reverse()
    .find((src) => /ha-solar-dashboard(?:\.js|\/)/.test(src));
  return script || globalThis.location?.href || "http://localhost/";
}

function assetUrl(path) {
  return new URL(path, scriptAssetBaseUrl()).href;
}

function translationUrl(language) {
  return assetUrl(`i18n/${language}.json`);
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
  const candidates = [
    hass?.locale?.language,
    hass?.locale?.languageCode,
    hass?.language,
    hass?.selectedLanguage,
    globalThis.document?.documentElement?.lang,
    globalThis.localStorage?.getItem?.("selectedLanguage"),
    globalThis.localStorage?.getItem?.("language"),
    ...(Array.isArray(globalThis.navigator?.languages) ? globalThis.navigator.languages : []),
    globalThis.navigator?.language,
  ];
  for (const candidate of candidates) {
    const language = String(candidate || "").toLowerCase().split(/[-_]/)[0];
    if (SUPPORTED_LANGUAGES.includes(language)) return language;
  }
  return DEFAULT_LANGUAGE;
}

function translate(language, key, replacements = {}, fallback = "") {
  const dictionary = I18N[language] || {};
  const fallbackDictionary = I18N[DEFAULT_LANGUAGE] || {};
  const template = dictionary[key] ?? fallbackDictionary[key] ?? (fallback !== "" ? fallback : key);
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
      water_meter: { left: 84, top: 72 },
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
      water_meter: { left: 84, top: 72 },
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
      water_meter: { left: 84, top: 72 },
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
      water_meter: { left: 84, top: 72 },
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
      water_meter: { left: 84, top: 72 },
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
      water_meter: { left: 84, top: 72 },
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
      water_meter: { left: 84, top: 72 },
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
      water_meter: { left: 84, top: 72 },
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

const PV_LABELS = [
  { suffix: "today_energy", labelKey: "pvLabel.todayEnergy", editorKey: "editor.pvTodayEnergyEntity", source: "entity", unit: "energy" },
  { suffix: "forecast_today", labelKey: "pvLabel.forecastToday", editorKey: "editor.pvForecastTodayEntity", source: "entity", unit: "energy" },
  { suffix: "peak_today", labelKey: "pvLabel.peakToday", editorKey: "editor.pvPeakTodayEntity", source: "entity", unit: "power" },
];

const MINUTE_MS = 60 * 1000;
const MAX_HISTORY_CACHE_ENTRIES = 48;
const MAX_COUNTER_CACHE_ENTRIES = 72;

function normalizeConfigId(value, fallback) {
  const id = String(value || fallback || "").trim().replace(/[^\w-]+/g, "_");
  return id || String(fallback || "item").replace(/[^\w-]+/g, "_");
}

function clampConfigNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
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
    this._chartDashboardLoading?.clear();
    this._recordsLoading?.clear();
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
      show_environment_sensors: true,
      show_large_consumers: true,
      show_power_flows: false,
      show_status_label: true,
      show_weather_status: false,
      show_grid_status_tile: true,
      pv_roof_string_display: "sum",
      inverter_display: "sum",
      hud_box_opacity: 0.65,
      hud_box_scale: 1,
      battery_low_threshold: 20,
      grid_neutral_threshold: 25,
      grid_voltage_warning_threshold: 245,
      grid_voltage_critical_threshold: 253,
      advisor_surplus_threshold: ADVISOR_DEFAULTS.surplusThreshold,
      advisor_import_threshold: ADVISOR_DEFAULTS.importThreshold,
      advisor_high_load_threshold: ADVISOR_DEFAULTS.highLoadThreshold,
      advisor_ev_surplus_threshold: ADVISOR_DEFAULTS.evSurplusThreshold,
      advisor_max_suggestions: ADVISOR_DEFAULTS.maxSuggestions,
      advisor_stale_sensor_warning_minutes: ADVISOR_DEFAULTS.staleSensorWarningMinutes,
      advisor_stale_sensor_critical_minutes: ADVISOR_DEFAULTS.staleSensorCriticalMinutes,
      chart_hours: 24,
      records_range: "7d",
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
      units: {
        power: "auto",
        battery: "%",
        volume: "m³",
        water_meter: "m³",
      },
      labels: {},
      label_visibility: {},
      energy_entities: {},
      tile_color_rules: DEFAULT_TILE_COLOR_RULES,
      custom_kpis: [],
      environment_sensors: [],
      floorplan: {
        show_grid: true,
        rooms: [],
        walls: [],
        sensors: [],
      },
      large_consumers: normalizeLargeConsumers([]),
      pv_roof_strings: [],
      inverters: [],
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
        water_meter: false,
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
        water_meter: "",
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
    this._chartDashboardLoading?.clear();
    this._recordsLoading?.clear();
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
      show_environment_sensors: true,
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
      advisor_surplus_threshold: ADVISOR_DEFAULTS.surplusThreshold,
      advisor_import_threshold: ADVISOR_DEFAULTS.importThreshold,
      advisor_high_load_threshold: ADVISOR_DEFAULTS.highLoadThreshold,
      advisor_ev_surplus_threshold: ADVISOR_DEFAULTS.evSurplusThreshold,
      advisor_max_suggestions: ADVISOR_DEFAULTS.maxSuggestions,
      advisor_stale_sensor_warning_minutes: ADVISOR_DEFAULTS.staleSensorWarningMinutes,
      advisor_stale_sensor_critical_minutes: ADVISOR_DEFAULTS.staleSensorCriticalMinutes,
      chart_hours: 24,
      records_range: "7d",
      daylight_entity: "sun.sun",
      weather_entity: "",
      dynamic_tile_colors: true,
      pv_roof_string_display: "sum",
      inverter_display: "sum",
      power_display_mode: "auto_kw",
      power_decimals: 2,
      energy_range: energyRange,
      units: { power: "auto", battery: "%", volume: "m³" },
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
      environment_sensors: [],
      floorplan: {
        show_grid: true,
        rooms: [],
        walls: [],
        sensors: [],
      },
      large_consumers: [],
      pv_roof_strings: [],
      inverters: [],
      ...config,
      house,
      view_mode: viewMode,
      energy_range: energyRange,
      units: {
        power: "auto",
        battery: "%",
        volume: "m³",
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
      environment_sensors: this._normalizeEnvironmentSensors(config.environment_sensors || config.environment_sensor_tiles || []),
      floorplan: this._normalizeFloorplan(config.floorplan || {}),
      large_consumers: normalizeLargeConsumers(config.large_consumers || config.large_consumers_config || []),
      pv_roof_strings: normalizePvRoofStrings(config.pv_roof_strings || config.pv_roof_string_config || []),
      pv_roof_string_display: normalizePvRoofStringDisplay(config.pv_roof_string_display || config.pv_roof_display || "sum"),
      inverters: normalizeInverters(config.inverters || config.inverter_strings || config.inverter_config || []),
      inverter_display: normalizeInverterDisplay(config.inverter_display || config.inverter_string_display || "sum"),
    };
    delete this.config.show_energy_advisor;

    this.config.hud_box_opacity = this._clampNumber(this.config.hud_box_opacity, 0.65, 0, 1);
    this.config.hud_box_scale = this._clampNumber(this.config.hud_box_scale, 1, 0.6, 1.8);
    this.config.power_decimals = this._clampNumber(this.config.power_decimals, 2, 0, 3);
    this.config.battery_low_threshold = this._clampNumber(this.config.battery_low_threshold, 20, 0, 100);
    this.config.grid_neutral_threshold = this._clampNumber(this.config.grid_neutral_threshold, 25, 0, 1000000);
    this.config.grid_voltage_warning_threshold = this._clampNumber(this.config.grid_voltage_warning_threshold, 245, 0, 1000);
    this.config.grid_voltage_critical_threshold = this._clampNumber(this.config.grid_voltage_critical_threshold, 253, this.config.grid_voltage_warning_threshold, 1000);
    Object.assign(this.config, normalizeAdvisorConfig(this.config));
    this.config.pv_roof_string_display = normalizePvRoofStringDisplay(this.config.pv_roof_string_display);
    this.config.pv_roof_strings = normalizePvRoofStrings(this.config.pv_roof_strings || []);
    this.config.inverter_display = normalizeInverterDisplay(this.config.inverter_display);
    this.config.inverters = normalizeInverters(this.config.inverters || []);
    this.config.chart_hours = [24, 48].includes(Number(this.config.chart_hours)) ? Number(this.config.chart_hours) : 24;
    this.config.records_range = String(this.config.records_range || this.config.records_days || `${RECORDS_DEFAULT_DAYS}d`);
    this._chartHours = this._chartHours || this.config.chart_hours;
    this._recordsRange = this._recordsRange || this.config.records_range;
    this._historyCache = this._historyCache || new Map();
    this._chartDashboardLoading = this._chartDashboardLoading || new Set();
    this._recordsCache = this._recordsCache || new Map();
    this._recordsRawHistoryCache = this._recordsRawHistoryCache || new Map();
    this._recordsLoading = this._recordsLoading || new Set();
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
    return normalizeViewMode(value);
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
    if (!metric || metric.overlay || metric.customKpi || metric.gridStatus) return "";
    const normalizedRange = this._normalizeEnergyRange(range);
    if (!normalizedRange || normalizedRange === "live") return "";
    if (metric.unit === "volume") {
      const entityId = this.config.entities?.[metricSourceKey(metric)] || "";
      return entityId ? {
        entityId,
        mode: normalizedRange === "total" ? "direct" : "counter",
        range: normalizedRange,
        kind: "volume",
        defaultUnit: this._volumeTargetUnit(metric),
      } : "";
    }
    if (metric.unit !== "power") return "";
    if (metric.largeConsumer) {
      const counterEntityId = this._largeConsumerEnergyEntityId(metric);
      return counterEntityId ? { entityId: counterEntityId, mode: normalizedRange === "total" ? "direct" : "counter", range: normalizedRange, kind: "energy", defaultUnit: "kWh" } : "";
    }
    const config = this._energyEntityConfig(metric.key);
    const counterEntityId = config.entity || config.counter || config.kwh_entity || config.kwh || config.meter || "";
    if (counterEntityId) return { entityId: counterEntityId, mode: normalizedRange === "total" ? "direct" : "counter", range: normalizedRange, kind: "energy", defaultUnit: "kWh" };
    return "";
  }

  _metricEnergyEntityId(metric, range = this._currentEnergyRange()) {
    return this._metricEnergySource(metric, range)?.entityId || "";
  }

  _isMetricEnergyMode(metric) {
    return metric?.unit === "power" && this._currentEnergyRange() !== "live" && Boolean(this._metricEnergyEntityId(metric));
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
    return gridSignedEntityId(this.config);
  }

  _gridImportEntityId() {
    return gridImportEntityId(this.config);
  }

  _gridExportEntityId() {
    return gridExportEntityId(this.config);
  }

  _hasGridPowerSource() {
    return hasGridPowerSource(this.config);
  }

  _gridPrimaryEntityId() {
    return gridPrimaryEntityId(this.config);
  }

  _metricEntityId(metric) {
    if (metric.chartEntityId) return metric.chartEntityId;
    if (metric.overlay) return this.config.image_overlays?.[metric.overlay]?.entity || "";
    if (metric.customKpi) return metric.customKpi.entity || "";
    if (metric.environmentSensor) return metric.environmentSensor.entity || "";
    if (metric.largeConsumer) {
      if (this._currentEnergyRange() !== "live" && metric.unit === "power") return this._metricEnergyEntityId(metric);
      return this._largeConsumerPowerEntityId(metric);
    }
    if (isImportExportMetric(metric)) return this._gridPrimaryEntityId();
    if (!metric.gridStatus && this._currentEnergyRange() !== "live" && ["power", "volume"].includes(metric.unit)) return this._metricEnergyEntityId(metric);
    return this.config.entities?.[metricSourceKey(metric)] || "";
  }

  _formatValue(value) {
    return formatValue(value);
  }

  _unitForMetric(metric) {
    if (metric.chartUnit) return metric.chartUnit;
    if (metric.overlay) return this.config.image_overlays?.[metric.overlay]?.unit || "auto";
    if (metric.customKpi) return metric.customKpi.unit;
    if (metric.environmentSensor) return metric.environmentSensor.unit || "auto";
    if (metric.largeConsumer) return metric.largeConsumer.unit || this.config.units?.power || "auto";
    const metricUnit = this.config.units?.[metric.key];
    if (metricUnit !== undefined && String(metricUnit).trim() !== "") return metricUnit;
    return this.config.units?.[metric.unit];
  }

  _isPvRoofMetric(metric) {
    return isPvRoofMetric(metric);
  }

  _pvRoofStringDisplayMode() {
    return normalizePvRoofStringDisplay(this.config.pv_roof_string_display);
  }

  _pvRoofBaseEnergyEntityId() {
    const config = this._energyEntityConfig("pv_roof_power");
    return pvRoofBaseEnergyEntityId(config);
  }

  _pvRoofStringEntries() {
    return buildPvRoofStringEntries({
      strings: this.config.pv_roof_strings || [],
      powerEntityId: this.config.entities?.pv_roof_power || "",
      energyEntityId: this._pvRoofBaseEnergyEntityId(),
      maxPowerKw: this.config.max_power_kw?.pv_roof_power,
      maxPowerW: this.config.max_power_w?.pv_roof_power,
      maxPower: this.config.max_power?.pv_roof_power,
    });
  }

  _hasAdditionalPvRoofStrings() {
    return hasAdditionalPvRoofStrings(this._pvRoofStringEntries());
  }

  _pvRoofStringEntryPowerWatts(entry) {
    if (!entry?.powerEntityId) return undefined;
    const watts = this._valueAsWatts(this._getEntityValue(entry.powerEntityId, undefined), this._getEntityUnit(entry.powerEntityId));
    return Number.isFinite(watts) ? Math.max(0, watts) : undefined;
  }

  _pvRoofPowerUnit(metric) {
    return this._unitForMetric(metric || { key: "pv_roof_power", unit: "power" }) || "auto";
  }

  _pvRoofStringPowerParts(metric) {
    const unit = this._pvRoofPowerUnit(metric);
    return pvRoofStringPowerParts(this._pvRoofStringEntries(), {
      unit,
      readPowerWatts: (entry) => this._pvRoofStringEntryPowerWatts(entry),
      formatPowerValue: (value, targetUnit, entityUnit) => this._formatPowerValue(value, targetUnit, entityUnit),
    });
  }

  _pvRoofStringPowerWatts() {
    if (!this._hasAdditionalPvRoofStrings()) return undefined;
    return pvRoofStringTotalPowerWatts(this._pvRoofStringPowerParts());
  }

  _pvRoofStringMaxPowerWatts() {
    if (!this._hasAdditionalPvRoofStrings()) return undefined;
    return pvRoofStringMaxPowerWatts(this._pvRoofStringEntries());
  }

  _pvRoofStringEnergyParts() {
    const range = this._currentEnergyRange();
    return pvRoofStringEnergyParts(this._pvRoofStringEntries(), {
      range,
      readEnergyInfo: (entry, selectedRange) => this._energyRangeConsumptionInfoForSource({
        entityId: entry.energyEntityId,
        mode: selectedRange === "total" ? "direct" : "counter",
        range: selectedRange,
      }),
      formatEnergyValue: (value, entityUnit, targetUnit) => this._formatEnergyValue(value, entityUnit, targetUnit),
    });
  }

  _pvRoofStringReadingParts(metric) {
    if (!this._isPvRoofMetric(metric) || !this._hasAdditionalPvRoofStrings()) return [];
    return this._currentEnergyRange() === "live"
      ? this._pvRoofStringPowerParts(metric)
      : this._pvRoofStringEnergyParts();
  }

  _formatPvRoofStringReading(metric) {
    const parts = this._pvRoofStringReadingParts(metric);
    return formatPvRoofStringReading({
      parts,
      mode: this._pvRoofStringDisplayMode(),
      range: this._currentEnergyRange(),
      unit: this._pvRoofPowerUnit(metric),
      formatPowerValue: (value, unit, entityUnit) => this._formatPowerValue(value, unit, entityUnit),
      formatEnergyValue: (value, entityUnit, targetUnit) => this._formatEnergyValue(value, entityUnit, targetUnit),
    });
  }

  _isInverterMetric(metric) {
    return metric?.key === "inverter_power";
  }

  _inverterDisplayMode() {
    return normalizeInverterDisplay(this.config.inverter_display);
  }

  _inverterBaseEnergyEntityId() {
    const config = this._energyEntityConfig("inverter_power");
    return pvRoofBaseEnergyEntityId(config);
  }

  _inverterBaseVoltageEntityId(phase = "") {
    const normalizedPhase = String(phase || "").toLowerCase();
    if (normalizedPhase) return this.config.entities?.[`inverter_power_voltage_${normalizedPhase}`] || "";
    return [
      "inverter_power_voltage",
      "inverter_power_volt",
      "inverter_power_volts",
    ].map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _inverterEntries() {
    const labelPrefix = this._t("metrics.inverter_power", {}, "Inverter");
    return buildInverterEntries({
      inverters: this.config.inverters || [],
      powerEntityId: this.config.entities?.inverter_power || "",
      energyEntityId: this._inverterBaseEnergyEntityId(),
      maxPowerKw: this.config.max_power_kw?.inverter_power,
      maxPowerW: this.config.max_power_w?.inverter_power,
      maxPower: this.config.max_power?.inverter_power,
      voltageEntityId: this._inverterBaseVoltageEntityId(),
      voltageEntityIdL1: this._inverterBaseVoltageEntityId("l1"),
      voltageEntityIdL2: this._inverterBaseVoltageEntityId("l2"),
      voltageEntityIdL3: this._inverterBaseVoltageEntityId("l3"),
    }).map((entry, index) => {
      const fallbackLabel = `${labelPrefix} ${index + 1}`;
      const defaultEnglishLabel = `Inverter ${index + 1}`;
      return {
        ...entry,
        label: !entry.label || entry.label === defaultEnglishLabel ? fallbackLabel : entry.label,
      };
    });
  }

  _inverterVoltageDefinitionKey(entry, index, phase = "") {
    if (entry?.base) return phase ? `inverter_power_voltage_${phase}` : "inverter_power_voltage";
    const id = String(entry?.id || `inverter_${index + 1}`).replace(/[^\w-]+/g, "_");
    return phase ? `inverter_${id}_voltage_${phase}` : `inverter_${id}_voltage`;
  }

  _hasAdditionalInverters() {
    return hasAdditionalInverters(this._inverterEntries());
  }

  _inverterEntryPowerWatts(entry) {
    if (!entry?.powerEntityId) return undefined;
    const watts = this._valueAsWatts(this._getEntityValue(entry.powerEntityId, undefined), this._getEntityUnit(entry.powerEntityId));
    return Number.isFinite(watts) ? Math.max(0, watts) : undefined;
  }

  _inverterPowerUnit(metric) {
    return this._unitForMetric(metric || { key: "inverter_power", unit: "power" }) || "auto";
  }

  _inverterPowerParts(metric) {
    const unit = this._inverterPowerUnit(metric);
    return inverterPowerParts(this._inverterEntries(), {
      unit,
      readPowerWatts: (entry) => this._inverterEntryPowerWatts(entry),
      formatPowerValue: (value, targetUnit, entityUnit) => this._formatPowerValue(value, targetUnit, entityUnit),
    });
  }

  _inverterPowerWatts() {
    if (!this._hasAdditionalInverters()) return undefined;
    return inverterTotalPowerWatts(this._inverterPowerParts());
  }

  _inverterMaxPowerWatts() {
    if (!this._hasAdditionalInverters()) return undefined;
    return inverterMaxPowerWatts(this._inverterEntries());
  }

  _inverterEnergyParts() {
    const range = this._currentEnergyRange();
    return inverterEnergyParts(this._inverterEntries(), {
      range,
      readEnergyInfo: (entry, selectedRange) => this._energyRangeConsumptionInfoForSource({
        entityId: entry.energyEntityId,
        mode: selectedRange === "total" ? "direct" : "counter",
        range: selectedRange,
      }),
      formatEnergyValue: (value, entityUnit, targetUnit) => this._formatEnergyValue(value, entityUnit, targetUnit),
    });
  }

  _inverterReadingParts(metric) {
    if (!this._isInverterMetric(metric) || !this._hasAdditionalInverters()) return [];
    return this._currentEnergyRange() === "live"
      ? this._inverterPowerParts(metric)
      : this._inverterEnergyParts();
  }

  _formatInverterReading(metric) {
    const parts = this._inverterReadingParts(metric);
    return formatInverterReading({
      parts,
      mode: this._inverterDisplayMode(),
      range: this._currentEnergyRange(),
      unit: this._inverterPowerUnit(metric),
      formatPowerValue: (value, unit, entityUnit) => this._formatPowerValue(value, unit, entityUnit),
      formatEnergyValue: (value, entityUnit, targetUnit) => this._formatEnergyValue(value, entityUnit, targetUnit),
    });
  }

  _multiSourceReadingParts(metric) {
    if (this._isPvRoofMetric(metric)) return this._pvRoofStringReadingParts(metric);
    if (this._isInverterMetric(metric)) return this._inverterReadingParts(metric);
    return [];
  }

  _multiSourceDisplayMode(metric) {
    if (this._isInverterMetric(metric)) return this._inverterDisplayMode();
    return this._pvRoofStringDisplayMode();
  }

  _renderMetricValueHtml(metric) {
    const parts = this._multiSourceReadingParts(metric);
    const mode = this._multiSourceDisplayMode(metric);
    if (parts.length === 0 || mode === "sum") return this._escape(this._formatReading(metric));
    const orderedParts = mode === "dominant"
      ? [...parts].sort((a, b) => (Number.isFinite(b.amount) ? b.amount : -Infinity) - (Number.isFinite(a.amount) ? a.amount : -Infinity))
      : parts;
    const valueHtml = orderedParts.map((part, index) => {
      const className = classNames("value-part", { "value-secondary": mode === "dominant" && index > 0 });
      return htmlTag("span", { class: className, title: part.label || "" }, part.formatted);
    }).join(htmlTag("span", { class: "value-separator" }, "/"));
    return htmlTag("span", { class: ["value-combo", `value-combo-${mode}`] }, rawHtml(valueHtml));
  }

  _formatReading(metric) {
    if (metric.gridStatus) return this._formatGridStatusReading();
    if (metric.overlay) return this._formatOverlayReading(metric.overlay);
    if (metric.customKpi) return this._formatCustomKpiValue(metric.customKpi);
    if (metric.environmentSensor) return this._formatEnvironmentSensorValue(metric.environmentSensor);
    if (metric.key === "import_export_power") return this._formatGridValueReading();
    if (this._isPvRoofMetric(metric)) {
      const stringReading = this._formatPvRoofStringReading(metric);
      if (stringReading) return stringReading;
    }
    if (this._isInverterMetric(metric)) {
      const inverterReading = this._formatInverterReading(metric);
      if (inverterReading) return inverterReading;
    }
    if (this._currentEnergyRange() !== "live" && metric.unit === "power") {
      return this._formatEnergyRangeReading(metric);
    }
    if (this._currentEnergyRange() !== "live" && metric.unit === "volume") {
      return this._formatEnergyRangeReading(metric);
    }
    const entityId = this._metricEntityId(metric);
    const fallbackValue = entityId ? undefined : metric.largeConsumer ? "" : "0";
    const value = this._getEntityValue(entityId, fallbackValue);
    const unit = this._unitForMetric(metric);
    const entityUnit = this._getEntityUnit(entityId);
    if (metric.unit === "power") return this._formatPowerValue(value, unit, entityUnit);
    if (metric.unit === "volume") return this._formatVolumeValue(value, entityUnit, this._volumeTargetUnit(metric));
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

  _normalizeEnvironmentSensors(sensors) {
    const source = Array.isArray(sensors)
      ? sensors
      : sensors && typeof sensors === "object"
        ? Object.entries(sensors).map(([id, sensor]) => (
          typeof sensor === "string"
            ? { id, entity: sensor }
            : { id, ...(sensor || {}) }
        ))
        : [];
    return source
      .map((sensor, index) => {
        if (!sensor || typeof sensor !== "object") return undefined;
        const id = String(sensor.id || sensor.key || sensor.entity || `environment_${index + 1}`).trim().replace(/[^\w-]/g, "_");
        const position = this._clampNumber(sensor.position ?? sensor.order ?? 300 + index, 300 + index, 0, 999);
        const columns = Math.round(this._clampNumber(sensor.columns ?? sensor.span ?? 1, 1, 1, 6));
        const left = this._clampNumber(sensor.left ?? sensor.x, 50, 0, 100);
        const top = this._clampNumber(sensor.top ?? sensor.y, 50, 0, 100);
        return {
          id,
          label: String(sensor.label || sensor.name || "").trim(),
          entity: String(sensor.entity || sensor.entity_id || sensor.sensor || "").trim(),
          unit: sensor.unit ?? "auto",
          position,
          columns,
          left,
          top,
          color: this._safeCssColor(sensor.color, "#34d399"),
          glow: sensor.glow,
          visible: sensor.visible !== false,
          show_footer: sensor.show_footer ?? sensor.footer ?? true,
          show_image: sensor.show_image ?? sensor.image ?? false,
        };
      })
      .filter(Boolean);
  }

  _environmentSensorLabel(sensor, index = 0) {
    if (sensor?.label) return sensor.label;
    const entity = this._getEntity(sensor?.entity);
    const friendlyName = entity?.attributes?.friendly_name || entity?.attributes?.name;
    if (friendlyName) return String(friendlyName);
    return this._t("environment.sensor", { index: index + 1 }, `Environment ${index + 1}`);
  }

  _environmentSensorMetrics({ placement = "" } = {}) {
    if (this.config.show_environment_sensors === false) return [];
    return (this.config.environment_sensors || [])
      .filter((sensor) => sensor.visible !== false && sensor.entity)
      .filter((sensor) => {
        if (placement === "footer") return sensor.show_footer !== false;
        if (placement === "image") return sensor.show_image === true;
        return sensor.show_footer !== false || sensor.show_image === true;
      })
      .map((sensor, index) => ({
        key: `environment_sensors.${sensor.id || index}`,
        label: this._environmentSensorLabel(sensor, index),
        unit: "environment",
        color: "green",
        accentColor: sensor.color,
        environmentSensor: sensor,
        tileOrder: sensor.position ?? 300 + index,
        tileColumns: sensor.columns ?? 1,
      }))
      .sort((a, b) => (a.tileOrder ?? 0) - (b.tileOrder ?? 0));
  }

  _normalizeFloorplan(floorplan = {}) {
    const source = floorplan && typeof floorplan === "object" ? floorplan : {};
    const rooms = Array.isArray(source.rooms) ? source.rooms : [];
    const walls = Array.isArray(source.walls) ? source.walls : [];
    const sensors = Array.isArray(source.sensors) ? source.sensors : [];
    return {
      show_grid: source.show_grid !== false,
      rooms: rooms
        .map((room, index) => {
          if (!room || typeof room !== "object") return undefined;
          return {
            id: normalizeConfigId(room.id || room.key, `room_${index + 1}`),
            label: String(room.label || room.name || this._t("floorplan.room", { index: index + 1 }, `Room ${index + 1}`)).trim(),
            x: this._clampNumber(room.x, 10 + index * 4, 0, 100),
            y: this._clampNumber(room.y, 10 + index * 4, 0, 70),
            width: this._clampNumber(room.width ?? room.w, 24, 3, 100),
            height: this._clampNumber(room.height ?? room.h, 18, 3, 70),
            color: this._safeCssColor(room.color, "#1f8fff"),
          };
        })
        .filter(Boolean),
      walls: walls
        .map((wall, index) => {
          if (!wall || typeof wall !== "object") return undefined;
          return {
            id: normalizeConfigId(wall.id || wall.key, `wall_${index + 1}`),
            x1: this._clampNumber(wall.x1 ?? wall.from_x, 12, 0, 100),
            y1: this._clampNumber(wall.y1 ?? wall.from_y, 12, 0, 70),
            x2: this._clampNumber(wall.x2 ?? wall.to_x, 36, 0, 100),
            y2: this._clampNumber(wall.y2 ?? wall.to_y, 12, 0, 70),
            width: this._clampNumber(wall.width ?? wall.stroke_width, 1.2, 0.2, 5),
            color: this._safeCssColor(wall.color, "#dbeafe"),
          };
        })
        .filter(Boolean),
      sensors: sensors
        .map((sensor, index) => {
          if (!sensor || typeof sensor !== "object") return undefined;
          return {
            id: normalizeConfigId(sensor.id || sensor.key || sensor.entity || sensor.environment_sensor, `sensor_${index + 1}`),
            label: String(sensor.label || sensor.name || "").trim(),
            entity: String(sensor.entity || sensor.entity_id || "").trim(),
            environment_sensor: String(sensor.environment_sensor || sensor.environmentSensor || "").trim(),
            unit: sensor.unit ?? "auto",
            x: this._clampNumber(sensor.x ?? sensor.left, 50, 0, 100),
            y: this._clampNumber(sensor.y ?? sensor.top, 35, 0, 70),
            color: this._safeCssColor(sensor.color, "#34d399"),
            visible: sensor.visible !== false,
          };
        })
        .filter(Boolean),
    };
  }

  _floorplanEnvironmentSensor(id) {
    if (!id) return undefined;
    return (this.config.environment_sensors || []).find((sensor) => sensor.id === id);
  }

  _floorplanSensorSource(sensor, index = 0) {
    const linkedSensor = this._floorplanEnvironmentSensor(sensor?.environment_sensor);
    const label = sensor?.label || (linkedSensor ? this._environmentSensorLabel(linkedSensor, index) : "");
    const entity = linkedSensor?.entity || sensor?.entity || "";
    const unit = sensor?.unit !== undefined && sensor?.unit !== "" ? sensor.unit : linkedSensor?.unit ?? "auto";
    const color = sensor?.color || linkedSensor?.color || "#34d399";
    return {
      label: label || this._t("floorplan.sensor", { index: index + 1 }, `Sensor ${index + 1}`),
      entity,
      unit,
      color,
    };
  }

  _floorplanSensorValue(sensor, index = 0) {
    const source = this._floorplanSensorSource(sensor, index);
    if (!source.entity) return "—";
    const value = this._getEntityValue(source.entity, undefined);
    const entityUnit = this._getEntityUnit(source.entity);
    const unit = this._normalizeUnit(source.unit) === "auto" ? entityUnit : source.unit;
    return this._formatWithUnit(value, unit);
  }

  _renderFloorplanDashboard() {
    const floorplan = this.config.floorplan || this._normalizeFloorplan();
    const grid = floorplan.show_grid !== false
      ? Array.from({ length: 11 }, (_item, index) => index * 10).map((x) => `<line class="floorplan-grid-line" x1="${x}" y1="0" x2="${x}" y2="70"></line>`).join("")
        + Array.from({ length: 8 }, (_item, index) => index * 10).map((y) => `<line class="floorplan-grid-line" x1="0" y1="${y}" x2="100" y2="${y}"></line>`).join("")
      : "";
    const rooms = floorplan.rooms.map((room) => `
      <g class="floorplan-room" style="--room-color:${this._escape(room.color)}">
        <rect x="${this._escape(room.x)}" y="${this._escape(room.y)}" width="${this._escape(room.width)}" height="${this._escape(room.height)}" rx="1.4"></rect>
        <text x="${this._escape(room.x + 1.6)}" y="${this._escape(room.y + 4.2)}">${this._escape(room.label)}</text>
      </g>
    `).join("");
    const walls = floorplan.walls.map((wall) => `
      <line class="floorplan-wall" x1="${this._escape(wall.x1)}" y1="${this._escape(wall.y1)}" x2="${this._escape(wall.x2)}" y2="${this._escape(wall.y2)}" style="--wall-color:${this._escape(wall.color)};--wall-width:${this._escape(wall.width)}"></line>
    `).join("");
    const sensors = floorplan.sensors
      .filter((sensor) => sensor.visible !== false)
      .map((sensor, index) => {
        const source = this._floorplanSensorSource(sensor, index);
        const value = this._floorplanSensorValue(sensor, index);
        const title = source.entity ? `${source.label}: ${value} (${source.entity})` : source.label;
        return `
          <g class="floorplan-sensor" data-floorplan-sensor="${this._escape(sensor.id)}" style="--sensor-color:${this._escape(source.color)}" transform="translate(${this._escape(sensor.x)} ${this._escape(sensor.y)})">
            <title>${this._escape(title)}</title>
            <circle r="1.7"></circle>
            <foreignObject x="2.6" y="-5.4" width="26" height="10">
              <div xmlns="http://www.w3.org/1999/xhtml" class="floorplan-sensor-card">
                <span data-floorplan-sensor-label="${this._escape(sensor.id)}">${this._escape(source.label)}</span>
                <strong data-floorplan-sensor-value="${this._escape(sensor.id)}">${this._escape(value)}</strong>
              </div>
            </foreignObject>
          </g>
        `;
      })
      .join("");
    const empty = floorplan.rooms.length === 0 && floorplan.walls.length === 0 && floorplan.sensors.length === 0
      ? `<div class="floorplan-empty">${this._escape(this._t("floorplan.empty", {}, "Create rooms, walls, and sensors in the card editor."))}</div>`
      : "";
    return `
      <section class="floorplan-dashboard" data-floorplan-dashboard>
        <div class="floorplan-head">
          <div>
            <div class="chart-dashboard-label">${this._escape(this._t("floorplan.label", {}, "Floorplan"))}</div>
            <h2>${this._escape(this._t("floorplan.title", {}, "Home floorplan"))}</h2>
          </div>
          <span>${this._escape(this._t("floorplan.counts", { rooms: floorplan.rooms.length, sensors: floorplan.sensors.length }, `${floorplan.rooms.length} rooms · ${floorplan.sensors.length} sensors`))}</span>
        </div>
        <div class="floorplan-canvas">
          <svg viewBox="0 0 100 70" role="img" aria-label="${this._escape(this._t("floorplan.title", {}, "Home floorplan"))}" preserveAspectRatio="xMidYMid meet">
            <rect class="floorplan-background" x="0" y="0" width="100" height="70" rx="1.5"></rect>
            ${grid}
            ${rooms}
            ${walls}
            ${sensors}
          </svg>
          ${empty}
        </div>
      </section>
    `;
  }

  _updateFloorplanReadings() {
    const floorplan = this.config?.floorplan;
    if (!floorplan || this._currentViewMode() !== FLOORPLAN_DASHBOARD_VIEW) return;
    (floorplan.sensors || []).forEach((sensor, index) => {
      const source = this._floorplanSensorSource(sensor, index);
      const value = this._floorplanSensorValue(sensor, index);
      this.shadowRoot.querySelectorAll(`[data-floorplan-sensor-label="${this._escape(sensor.id)}"]`).forEach((element) => {
        if (element.textContent !== source.label) element.textContent = source.label;
      });
      this.shadowRoot.querySelectorAll(`[data-floorplan-sensor-value="${this._escape(sensor.id)}"]`).forEach((element) => {
        if (element.textContent !== value) element.textContent = value;
      });
      this.shadowRoot.querySelectorAll(`[data-floorplan-sensor="${this._escape(sensor.id)}"]`).forEach((element) => {
        element.style.setProperty("--sensor-color", source.color);
      });
    });
  }

  _largeConsumerLabel(consumer, index = 0) {
    return largeConsumerLabel(consumer, index, (key, params, fallback) => this._t(key, params, fallback));
  }

  _largeConsumerHasEntity(consumer) {
    return largeConsumerHasEntity(consumer);
  }

  _largeConsumerMetrics() {
    return largeConsumerMetrics(this.config.large_consumers || [], {
      labelForConsumer: (consumer, index) => this._largeConsumerLabel(consumer, index),
    });
  }

  _largeConsumerPowerEntityId(metricOrConsumer) {
    return largeConsumerPowerEntityId(metricOrConsumer);
  }

  _largeConsumerEnergyEntityId(metricOrConsumer) {
    return largeConsumerEnergyEntityId(metricOrConsumer);
  }

  _largeConsumerVoltageEntityId(metricOrConsumer) {
    return largeConsumerVoltageEntityId(metricOrConsumer);
  }

  _metricVoltageEntityKey(metric) {
    if (!metric || metric.unit !== "power") return "";
    return metricVoltageEntityKey(metric);
  }

  _metricVoltagePhaseDefinitions(metric) {
    return inverterPhaseVoltageEntityKeys(metric).map((key) => ({ key, phase: key.slice(-2).toUpperCase() }));
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
    const key = metricSourceKey(metric);
    if (key === "inverter_power") {
      const inverterEntries = this._inverterEntries();
      const hasMultipleInverters = inverterEntries.some((entry) => !entry.base && (entry.powerEntityId || entry.energyEntityId || entry.voltageEntityId || entry.voltageEntityIdL1 || entry.voltageEntityIdL2 || entry.voltageEntityIdL3));
      return inverterEntries.flatMap((entry, index) => {
        const label = entry.label || `${this._t("metrics.inverter_power", {}, "Inverter")} ${index + 1}`;
        const displayPrefix = hasMultipleInverters ? label : "";
        return [
          {
            key: this._inverterVoltageDefinitionKey(entry, index),
            entityId: entry.voltageEntityId || "",
            phase: "",
            label,
            displayPrefix,
          },
          {
            key: this._inverterVoltageDefinitionKey(entry, index, "l1"),
            entityId: entry.voltageEntityIdL1 || "",
            phase: "L1",
            label: `${label} L1`,
            displayPrefix: hasMultipleInverters ? `${label} L1` : "L1",
          },
          {
            key: this._inverterVoltageDefinitionKey(entry, index, "l2"),
            entityId: entry.voltageEntityIdL2 || "",
            phase: "L2",
            label: `${label} L2`,
            displayPrefix: hasMultipleInverters ? `${label} L2` : "L2",
          },
          {
            key: this._inverterVoltageDefinitionKey(entry, index, "l3"),
            entityId: entry.voltageEntityIdL3 || "",
            phase: "L3",
            label: `${label} L3`,
            displayPrefix: hasMultipleInverters ? `${label} L3` : "L3",
          },
        ];
      });
    }
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
        label: definition.label || (definition.phase ? `${baseLabel} ${definition.phase}` : baseLabel),
        value,
        displayValue: definition.displayPrefix ? `${definition.displayPrefix} ${value}` : definition.phase ? `${definition.phase} ${value}` : value,
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
    const batteryMetric = findMetricByKey("battery_level") || { key: "battery_level", label: "Battery", unit: "battery" };
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
    return largeConsumerPowerWatts(metricOrConsumer, {
      getValue: (entityId) => this._getEntityValue(entityId, undefined),
      getUnit: (entityId) => this._getEntityUnit(entityId),
      valueAsWatts: (value, unit) => this._valueAsWatts(value, unit),
    });
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

  _formatEnvironmentSensorValue(sensor) {
    if (!sensor?.entity) return "—";
    const rawValue = this._getEntityValue(sensor.entity, undefined);
    const value = this._formatValue(rawValue);
    if (value === "—") return value;
    const roundedValue = this._formatRoundedCustomValue(value);
    const entityUnit = this._getEntityUnit(sensor.entity);
    const configuredUnit = String(sensor.unit ?? "auto").trim();
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
    const largeConsumerEntities = largeConsumerEntityIds(this.config.large_consumers || []);
    const pvRoofStringEntities = normalizePvRoofStrings(this.config.pv_roof_strings || [])
      .flatMap((string) => [string.power_entity, string.energy_entity])
      .filter(Boolean);
    const inverterEntities = normalizeInverters(this.config.inverters || [])
      .flatMap((inverter) => [
        inverter.power_entity,
        inverter.energy_entity,
        inverter.voltage_entity,
        inverter.voltage_entity_l1,
        inverter.voltage_entity_l2,
        inverter.voltage_entity_l3,
      ])
      .filter(Boolean);
    const timestamps = [
      ...Object.values(this.config.entities || {}),
      ...largeConsumerEntities,
      ...pvRoofStringEntities,
      ...inverterEntities,
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
    return gridSignedFlowInfo({
      entityId,
      rawValue: this._getEntityValue(entityId, undefined),
      entityUnit: this._getEntityUnit(entityId),
      unit: this.config.units?.import_export_power || "auto",
      unavailableLabel: this._metricWarning(GRID_STATUS_METRIC)?.label || this._t("warning.sensorUnavailable"),
      formatValue: (value) => this._formatValue(value),
      valueAsWatts: (value, unit) => this._valueAsWatts(value, unit),
      isEnergyUnit: (unit) => this._isEnergyUnit(unit),
      formatEnergyValue: (value, entityUnit, targetUnit) => this._formatEnergyValue(value, entityUnit, targetUnit),
      formatPowerValue: (value, unit, entityUnit) => this._formatPowerValue(value, unit, entityUnit),
    });
  }

  _gridSplitFlowInfo() {
    const importEntityId = this._gridImportEntityId();
    const exportEntityId = this._gridExportEntityId();
    return gridSplitFlowInfo({
      importEntityId,
      exportEntityId,
      importValue: this._entityFlowValue(importEntityId),
      exportValue: this._entityFlowValue(exportEntityId),
      unit: this.config.units?.import_export_power || this.config.units?.power || "auto",
      unavailableLabel: this._metricWarning(GRID_STATUS_METRIC)?.label || this._t("warning.sensorUnavailable"),
    });
  }

  _gridSplitPowerDetails() {
    const importEntityId = this._gridImportEntityId();
    const exportEntityId = this._gridExportEntityId();
    return gridSplitPowerDetails({
      importEntityId,
      exportEntityId,
      importValue: this._entityFlowValue(importEntityId),
      exportValue: this._entityFlowValue(exportEntityId),
    });
  }

  _gridFlowInfo() {
    return this._gridSignedFlowInfo() || this._gridSplitFlowInfo();
  }

  _gridStatusFromFlowInfo(info) {
    return gridStatusFromFlowInfo(info, {
      neutralThreshold: this._gridNeutralThreshold(),
      labelForKind: (kind) => this._gridStatusLabel(kind),
      formatPowerValue: (value, unit, entityUnit) => this._formatPowerValue(value, unit, entityUnit),
    });
  }

  _gridStatusInfo() {
    return this._gridStatusFromFlowInfo(this._gridFlowInfo());
  }

  _formatGridStatusReading() {
    return formatGridStatusReading(this._gridStatusInfo());
  }

  _formatGridValueReading() {
    return formatGridValueReading(this._gridStatusInfo());
  }

  _formatImportExportStatus() {
    return formatImportExportStatus(this._gridStatusInfo());
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
    return formatWithUnit(rawValue, unit);
  }

  _normalizeUnit(unit) {
    return normalizeUnit(unit);
  }

  _isEnergyUnit(unit) {
    return isEnergyUnit(unit);
  }

  _isPowerUnit(unit) {
    return isPowerUnit(unit);
  }

  _isVolumeUnit(unit) {
    return isVolumeUnit(unit);
  }

  _valueAsWatts(value, unit) {
    return valueAsWatts(value, unit);
  }

  _valueAsCubicMeters(value, unit) {
    return valueAsCubicMeters(value, unit);
  }

  _valueAsVolts(value, unit) {
    return valueAsVolts(value, unit);
  }

  _formatVoltageValue(rawValue, entityUnit = "V") {
    return formatVoltageValue(rawValue, entityUnit);
  }

  _valueAsKwh(value, unit) {
    return valueAsKwh(value, unit);
  }

  _formatEnergyValue(rawValue, entityUnit, targetUnit = "kWh") {
    return formatEnergyValue(rawValue, entityUnit, targetUnit);
  }

  _volumeTargetUnit(metric) {
    const unit = this._unitForMetric(metric);
    return unit || "m³";
  }

  _formatVolumeValue(rawValue, entityUnit, targetUnit = "m³") {
    return formatVolumeValue(rawValue, entityUnit, targetUnit);
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

  _energyRangeCacheKey(entityId, range, kind = "energy") {
    const bucket = this._cacheBucket(this._cacheBucketMsForMinutes(this._energyRangeMinutes(range)));
    return `${entityId}|${range}|${kind}|${bucket}`;
  }

  _energyRangeConsumptionInfoForSource(source) {
    const range = this._normalizeEnergyRange(source?.range) || this._currentEnergyRange();
    if (!source?.entityId) return undefined;
    const kind = source.kind || "energy";
    const defaultUnit = source.defaultUnit || (kind === "volume" ? "m³" : "kWh");
    if (source.mode === "direct" || range === "total") {
      const entityUnit = this._getEntityUnit(source.entityId) || defaultUnit;
      const value = this._getEntityValue(source.entityId, undefined);
      const amount = kind === "volume"
        ? numericState(value)
        : this._valueAsKwh(value, entityUnit);
      return {
        amount,
        unit: kind === "volume" ? entityUnit : "kWh",
        entityId: source.entityId,
        mode: "direct",
        kind,
      };
    }

    const minutes = this._energyRangeMinutes(range);
    if (!Number.isFinite(minutes)) return undefined;
    if (this._hass?.states && !this._getEntity(source.entityId)) {
      return { error: true, amount: undefined, unit: defaultUnit, entityId: source.entityId, mode: "counter", kind };
    }

    const key = this._energyRangeCacheKey(source.entityId, range, kind);
    const cached = this._energyRangeCache?.get(key);
    if (cached) return cached;
    this._requestEnergyRangeConsumption(source.entityId, minutes, key, source);
    return { loading: true, amount: undefined, unit: this._getEntityUnit(source.entityId) || defaultUnit, entityId: source.entityId, mode: "counter", kind };
  }

  _energyRangeConsumptionInfo(metric) {
    const range = this._currentEnergyRange();
    return this._energyRangeConsumptionInfoForSource(this._metricEnergySource(metric, range));
  }

  _requestEnergyRangeConsumption(entityId, minutes, key, source = {}) {
    if (!this._hass?.callApi || this._energyRangeLoading?.has(key)) return;
    const requestToken = this._asyncRequestToken || 0;
    const kind = source.kind || "energy";
    const defaultUnit = source.defaultUnit || (kind === "volume" ? "m³" : "kWh");
    this._energyRangeLoading.add(key);
    this._loadCounterConsumption(entityId, minutes, defaultUnit)
      .then((info) => {
        if (!this._isActiveRequest(requestToken)) return;
        const normalizedInfo = kind === "energy"
          ? { ...info, amount: this._valueAsKwh(info.amount, info.unit), unit: "kWh" }
          : info;
        this._setCacheEntry(this._energyRangeCache, key, { ...normalizedInfo, entityId, mode: "counter", kind }, MAX_COUNTER_CACHE_ENTRIES);
      })
      .catch(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._energyRangeCache, key, { error: true, amount: undefined, unit: this._getEntityUnit(entityId) || defaultUnit, entityId, mode: "counter", kind }, MAX_COUNTER_CACHE_ENTRIES);
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
    if (info.kind === "volume" || metric.unit === "volume") {
      return this._formatVolumeValue(info.amount, info.unit || "m³", this._volumeTargetUnit(metric));
    }
    return this._formatEnergyValue(info.amount, "kWh", "kWh");
  }

  _formatPowerValue(rawValue, unit, entityUnit) {
    return formatPowerValue(rawValue, unit, entityUnit, {
      powerDisplayMode: this.config.power_display_mode || "auto_kw",
    });
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
    if (metric.environmentSensor) {
      const rawValue = metric.environmentSensor.entity ? this._getEntityValue(metric.environmentSensor.entity, undefined) : undefined;
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
    if (isImportExportMetric(metric)) {
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
    if (this._isInverterMetric(metric)) {
      if (this._currentEnergyRange() !== "live") {
        const values = this._inverterEnergyParts()
          .map((part) => part.amount)
          .filter(Number.isFinite);
        if (values.length > 0) return values.reduce((sum, value) => sum + value, 0);
      } else {
        const watts = this._inverterPowerWatts();
        if (Number.isFinite(watts)) return watts;
      }
    }
    if (this._currentEnergyRange() !== "live" && metric.unit === "power") {
      const info = this._energyRangeConsumptionInfo(metric);
      return Number.isFinite(info?.amount) ? info.amount : undefined;
    }
    if (this._currentEnergyRange() !== "live" && metric.unit === "volume") {
      const info = this._energyRangeConsumptionInfo(metric);
      const cubicMeters = this._valueAsCubicMeters(info?.amount, info?.unit || "m³");
      return Number.isFinite(cubicMeters) ? cubicMeters : undefined;
    }
    const entityId = this._metricEntityId(metric);
    const value = this._getEntityValue(entityId, undefined);
    if (value === undefined || value === null || value === "unknown" || value === "unavailable") return undefined;
    const entityUnit = this._getEntityUnit(entityId);
    if (this._isMetricEnergyMode(metric)) return this._valueAsKwh(value, entityUnit);
    if (metric.unit === "power") return this._valueAsWatts(value, entityUnit);
    if (metric.unit === "volume") return this._valueAsCubicMeters(value, entityUnit);
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
    return parsePowerLimitWatts(rawValue, defaultUnit);
  }

  _maxPowerWatts(metric) {
    if (!metric || metric.unit !== "power") return undefined;
    if (metric.largeConsumer) return this._parsePowerLimitWatts(metric.largeConsumer.max_power_kw, "kw");
    if (this._isPvRoofMetric(metric)) {
      const stringMaxPower = this._pvRoofStringMaxPowerWatts();
      if (Number.isFinite(stringMaxPower)) return stringMaxPower;
    }
    if (this._isInverterMetric(metric)) {
      const inverterMaxPower = this._inverterMaxPowerWatts();
      if (Number.isFinite(inverterMaxPower)) return inverterMaxPower;
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
    return htmlTag("div", {
      class: "metric-meter",
      "data-meter": metric.key,
      title: this._meterTooltip(metric),
      "aria-hidden": "true",
    }, rawHtml(htmlTag("span", { style: { width: `${percent.toFixed(0)}%` } })));
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
    return isPvMetric(metric);
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
    return wallboxPhaseEntityKey(metric);
  }

  _wallboxPhaseEntityId(metric) {
    return wallboxPhaseEntityId(this.config, metric);
  }

  _wallboxPhaseLabel(metric) {
    const entityId = this._wallboxPhaseEntityId(metric);
    if (!entityId) return "";
    return wallboxPhaseLabel(this._getEntityValue(entityId, undefined), (key, values, fallback) => this._t(key, values, fallback));
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
    return wallboxSocEntityKey(metric);
  }

  _wallboxSocEntityId(metric) {
    return wallboxSocEntityId(this.config, metric);
  }

  _numericPercentFromEntity(entityId) {
    if (!entityId) return undefined;
    return numericPercentValue(this._getEntityValue(entityId, undefined));
  }

  _wallboxSocPercent(metric) {
    return this._numericPercentFromEntity(this._wallboxSocEntityId(metric));
  }

  _wallboxMaxSocEntityKey(metric) {
    return wallboxMaxSocEntityKey(metric);
  }

  _wallboxMaxSocEntityId(metric) {
    return wallboxMaxSocEntityId(this.config, metric);
  }

  _wallboxMaxSocPercent(metric) {
    return this._numericPercentFromEntity(this._wallboxMaxSocEntityId(metric));
  }

  _wallboxBooleanEntityState(entityId) {
    return wallboxBooleanEntityState(entityId, {
      getValue: (id) => this._getEntityValue(id, undefined),
      getState: (id) => this._hass?.states?.[id],
    });
  }

  _wallboxConnectedEntityKey(metric) {
    return wallboxConnectedEntityKey(metric);
  }

  _wallboxConnectedEntityId(metric) {
    return wallboxConnectedEntityId(this.config, metric);
  }

  _wallboxConnectedState(metric) {
    return this._wallboxBooleanEntityState(this._wallboxConnectedEntityId(metric));
  }

  _wallboxChargingEnabledEntityKey(metric) {
    return wallboxChargingEnabledEntityKey(metric);
  }

  _wallboxChargingEnabledEntityId(metric) {
    return wallboxChargingEnabledEntityId(this.config, metric);
  }

  _wallboxChargingEnabledState(metric) {
    return this._wallboxBooleanEntityState(this._wallboxChargingEnabledEntityId(metric));
  }

  _wallboxSocLabel(metric) {
    const entityId = this._wallboxSocEntityId(metric);
    if (!entityId) return "";
    return wallboxSocLabel(this._getEntityValue(entityId, undefined), this._getEntityUnit(entityId));
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
    return wallboxRemainingTimeEntityKey(metric);
  }

  _wallboxRemainingTimeEntityId(metric) {
    return wallboxRemainingTimeEntityId(this.config, metric);
  }

  _formatDurationMinutes(minutes) {
    return formatDurationMinutes(minutes);
  }

  _formatDurationSeconds(seconds) {
    return formatDurationSeconds(seconds);
  }

  _wallboxPhaseActionEntityKey(metric) {
    return wallboxPhaseActionEntityKey(metric);
  }

  _wallboxPhaseRemainingEntityKey(metric) {
    return wallboxPhaseRemainingEntityKey(metric);
  }

  _wallboxPhaseActionEntityId(metric) {
    return wallboxPhaseActionEntityId(this.config, metric);
  }

  _wallboxPhaseRemainingEntityId(metric) {
    return wallboxPhaseRemainingEntityId(this.config, metric);
  }

  _wallboxPhaseActionText(metric) {
    const entityId = this._wallboxPhaseActionEntityId(metric);
    if (!entityId) return "";
    return wallboxPhaseActionText(this._getEntityValue(entityId, ""));
  }

  _wallboxPhaseRemainingSeconds(metric) {
    const entityId = this._wallboxPhaseRemainingEntityId(metric);
    if (!entityId) return undefined;
    return wallboxPhaseRemainingSeconds(
      this._getEntityValue(entityId, undefined),
      this._getEntityUnit(entityId),
      numericState,
    );
  }

  _wallboxPhaseActionInfo(metric) {
    const action = this._wallboxPhaseActionText(metric);
    return wallboxPhaseActionInfo({
      action,
      seconds: this._wallboxPhaseRemainingSeconds(metric),
      actionEntityId: this._wallboxPhaseActionEntityId(metric),
      remainingEntityId: this._wallboxPhaseRemainingEntityId(metric),
      formatDurationSeconds: (seconds) => this._formatDurationSeconds(seconds),
      translate: (key, values, fallback) => this._t(key, values, fallback),
    });
  }

  _formatRemainingChargeTimeValue(rawValue, entityUnit = "") {
    return formatRemainingChargeTimeValue(rawValue, entityUnit);
  }

  _wallboxIsCharging(metric) {
    return wallboxIsCharging(metric, {
      config: this.config,
      getValue: (entityId) => this._getEntityValue(entityId, undefined),
      getUnit: (entityId) => this._getEntityUnit(entityId),
      valueAsWatts: (value, unit) => this._valueAsWatts(value, unit),
      clampNumber: (value, fallback, min, max) => this._clampNumber(value, fallback, min, max),
    });
  }

  _wallboxRemainingTimeLabel(metric) {
    const entityId = this._wallboxRemainingTimeEntityId(metric);
    if (!entityId) return "";
    return wallboxRemainingTimeLabel({
      isCharging: this._wallboxIsCharging(metric),
      rawValue: this._getEntityValue(entityId, undefined),
      entityUnit: this._getEntityUnit(entityId),
      formatRemainingChargeTimeValue: (value, unit) => this._formatRemainingChargeTimeValue(value, unit),
      translate: (key, values, fallback) => this._t(key, values, fallback),
    });
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
    if (isImportExportMetric(metric)) {
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
      ...this._environmentSensorMetrics(),
      ...this._largeConsumerMetrics(),
    ].filter((metric, index, metrics) => {
      if (!this._metricEntityId(metric)) return false;
      return metrics.findIndex((item) => item.key === metric.key) === index;
    });
  }

  _chartMetric(metricKey) {
    return this._allChartMetrics().find((metric) => metric.key === metricKey)
      || flattenChartSections(this._chartDashboardSections()).find((metric) => metric.key === metricKey || metric.chartKey === metricKey);
  }

  _historyCacheKey(entityId, hours) {
    const bucket = this._cacheBucket(MINUTE_MS);
    return chartHistoryCacheKey(entityId, hours, bucket);
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

    const history = await this._hass.callApi("GET", chartHistoryApiPath(entityId, hours));
    const states = Array.isArray(history?.[0]) ? history[0] : [];
    const points = states
      .map((entry) => this._historyPoint(metric, entry))
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    this._setCacheEntry(this._historyCache, cacheKey, points, MAX_HISTORY_CACHE_ENTRIES);
    return points;
  }

  _historyPoint(metric, entry) {
    return chartHistoryPoint(metric, entry, {
      metricEntityId: (item) => this._metricEntityId(item),
      getEntityUnit: (entityId) => this._getEntityUnit(entityId),
      formatValue: (value) => this._formatValue(value),
      isMetricEnergyMode: (item) => this._isMetricEnergyMode(item),
      valueAsKwh: (value, unit) => this._valueAsKwh(value, unit),
      valueAsCubicMeters: (value, unit) => this._valueAsCubicMeters(value, unit),
      valueAsWatts: (value, unit) => this._valueAsWatts(value, unit),
      numericState,
      isPowerUnit: (unit) => this._isPowerUnit(unit),
    });
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
    if (metric.unit === "volume") return this._formatVolumeValue(value, "m³", this._volumeTargetUnit(metric));
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
    return chartPath(points, min, max, start, end, width, height, padding);
  }

  _renderChartSvg(metric, chart) {
    const points = chart.points || [];
    if (chart.loading) return `<div class="chart-message">${this._escape(this._t("chart.loading"))}</div>`;
    if (chart.error) return `<div class="chart-message is-error">${this._escape(chart.error)}</div>`;
    if (points.length < 2) return `<div class="chart-message">${this._escape(this._t("chart.empty"))}</div>`;

    const width = 720;
    const height = 260;
    const padding = { top: 22, right: 22, bottom: 36, left: 58 };
    const { min, max } = chartBounds(points);
    const start = Date.now() - chart.hours * 60 * 60 * 1000;
    const end = Date.now();
    const line = this._chartPath(points, min, max, start, end, width, height, padding);
    const latest = points[points.length - 1];
    const latestCoordinates = chartLastPointCoordinates(line, padding);
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
        <circle class="chart-dot" cx="${this._escape(latestCoordinates.x)}" cy="${this._escape(latestCoordinates.y)}" r="4"></circle>
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

  _chartDashboardHours() {
    return [24, 48].includes(Number(this._chartHours)) ? Number(this._chartHours) : this.config.chart_hours || 24;
  }

  _chartEntityId(metric) {
    if (metric?.chartEntityId) return metric.chartEntityId;
    if (metric?.overlay) return this.config.image_overlays?.[metric.overlay]?.entity || "";
    if (metric?.customKpi) return metric.customKpi.entity || "";
    if (metric?.environmentSensor) return metric.environmentSensor.entity || "";
    if (metric?.largeConsumer) return this._largeConsumerPowerEntityId(metric);
    if (isImportExportMetric(metric)) return this._gridPrimaryEntityId();
    return this.config.entities?.[metricSourceKey(metric)] || "";
  }

  _chartDashboardMetricPool(variant = this._currentVariant || this._layoutState().variant) {
    return [
      ...TILE_METRICS,
      ...this._visibleOverlayMetrics(),
      ...this._customKpiMetrics(),
      ...this._environmentSensorMetrics(),
      ...this._largeConsumerMetrics(),
      ...(this._showGridStatusTile() ? [GRID_STATUS_METRIC] : []),
    ].filter((metric, index, metrics) => {
      if (!this._chartEntityId(metric)) return false;
      return metrics.findIndex((item) => item.key === metric.key) === index;
    });
  }

  _chartDashboardSections(variant = this._currentVariant || this._layoutState().variant) {
    return chartDashboardSections({
      pvRoofStringEntries: this._pvRoofStringEntries(),
      inverterEntries: this._inverterEntries(),
      metrics: this._chartDashboardMetricPool(variant),
      metricEntityId: (metric) => this._chartEntityId(metric),
      metricLabel: (metric) => this._metricLabel(metric, variant),
      translate: (key, values, fallback) => this._t(key, values, fallback),
    });
  }

  _dashboardChartState(metric) {
    const entityId = this._chartEntityId(metric);
    const hours = this._chartDashboardHours();
    if (!entityId) return { hours, loading: false, error: this._t("chart.empty"), points: [] };
    const cacheKey = this._historyCacheKey(entityId, hours);
    const cached = this._historyCache.get(cacheKey);
    if (cached?.error) return { hours, loading: false, error: this._t("chart.error"), points: [] };
    if (cached) return { hours, loading: false, error: "", points: cached };
    this._requestDashboardChart(metric, entityId, hours, cacheKey);
    return { hours, loading: true, error: "", points: [] };
  }

  _requestDashboardChart(metric, entityId, hours, cacheKey) {
    if (!this._hass?.callApi || this._chartDashboardLoading?.has(cacheKey)) return;
    const requestToken = this._asyncRequestToken || 0;
    this._chartDashboardLoading.add(cacheKey);
    this._loadHistoryPoints(metric, entityId, hours)
      .then((points) => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._historyCache, cacheKey, points, MAX_HISTORY_CACHE_ENTRIES);
      })
      .catch(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._historyCache, cacheKey, { error: true, points: [] }, MAX_HISTORY_CACHE_ENTRIES);
      })
      .finally(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._chartDashboardLoading?.delete(cacheKey);
        this._updateReadingsIfReady();
      });
  }

  _renderChartDashboardCard(metric) {
    const entityId = this._chartEntityId(metric);
    const chart = this._dashboardChartState(metric);
    const normalizedChart = chart?.error === true
      ? { hours: this._chartDashboardHours(), loading: false, error: this._t("chart.error"), points: [] }
      : chart;
    return `
      <article class="chart-card" data-chart-dashboard-card="${this._escape(metric.chartKey || metric.key)}" style="${this._escape(this._accentStyle(metric))}">
        <div class="chart-card-head">
          <div>
            <strong>${this._escape(this._metricLabel(metric, this._currentVariant))}</strong>
            <span>${this._escape(entityId)}</span>
          </div>
          <button type="button" class="chart-open-button" data-chart-key="${this._escape(metric.key)}" aria-label="${this._escape(this._t("charts.openLarge", {}, "Open large chart"))}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5"></path><path d="M4 19h16"></path><path d="m7 15 3-4 3 2 4-6"></path><path d="M17 7h3v3"></path></svg>
          </button>
        </div>
        <div class="chart-card-body">
          ${this._renderChartSvg(metric, normalizedChart)}
        </div>
      </article>
    `;
  }

  _renderChartDashboard(variant = this._currentVariant || this._layoutState().variant) {
    const sections = this._chartDashboardSections(variant);
    const totalCharts = flattenChartSections(sections).length;
    const hours = this._chartDashboardHours();
    const rangeButton = (value) => `
      <button type="button" class="chart-range${hours === value ? " active" : ""}" data-chart-dashboard-hours="${value}">${this._escape(this._t(`chart.range${value}`, {}, `${value}h`))}</button>
    `;
    const sectionHtml = sections.map((section) => `
      <section class="chart-section">
        <div class="chart-section-head">
          <h3>${this._escape(section.label)}</h3>
          <span>${this._escape(section.items.length === 1
            ? this._t("charts.countOne", { count: section.items.length }, "1 chart")
            : this._t("charts.count", { count: section.items.length }, `${section.items.length} charts`))}</span>
        </div>
        <div class="chart-grid">
          ${section.items.map((metric) => this._renderChartDashboardCard(metric)).join("")}
        </div>
      </section>
    `).join("");

    return `
      <section class="chart-dashboard" data-chart-dashboard>
        <div class="chart-dashboard-head">
          <div>
            <div class="chart-dashboard-label">${this._escape(this._t("charts.label", {}, "Charts"))}</div>
            <h2>${this._escape(this._t("charts.title", {}, "Entity history"))}</h2>
          </div>
          <div class="chart-actions">
            ${rangeButton(24)}
            ${rangeButton(48)}
          </div>
        </div>
        ${totalCharts > 0
          ? sectionHtml
          : `<div class="chart-message">${this._escape(this._t("charts.empty", {}, "No chartable entities configured yet."))}</div>`}
      </section>
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

    const rules = this.config.tile_color_rules?.[metricSourceKey(metric)];
    const normalizedRules = Array.isArray(rules) ? rules : [];
    const value = this._metricNumericValue(metric);
    const matchedRule = normalizedRules.find((rule) => this._ruleMatches(rule, value));
    const color = this._safeCssColor(matchedRule?.color, fallbackColor);
    const glowValue = matchedRule?.glow ?? metric.customKpi?.glow ?? metric.environmentSensor?.glow;
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
    if (metric.environmentSensor) return metric.environmentSensor.visible !== false && Boolean(metric.environmentSensor.entity);
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
    const baseMetrics = this._visibleMetrics(variant).filter((metric) => {
      if (metric.hud !== false) return true;
      return Boolean(variant?.positions?.[metric.key]) || this.config.visible_boxes?.[metric.key] === true;
    });
    return [
      ...baseMetrics,
      ...this._environmentSensorMetrics({ placement: "image" }),
    ];
  }

  _metricLabel(metric, variant) {
    if (metric.chartLabel) return metric.chartLabel;
    if (metric.overlay) return this._overlayLabel(metric.overlay);
    if (metric.customKpi) return metric.customKpi.label || metric.label;
    if (metric.environmentSensor) return metric.label || this._environmentSensorLabel(metric.environmentSensor);
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

  _metricPosition(variant, key) {
    if (String(key || "").startsWith("environment_sensors.")) {
      const metric = this._environmentSensorMetrics({ placement: "image" }).find((item) => item.key === key)
        || this._environmentSensorMetrics().find((item) => item.key === key);
      return {
        left: metric?.environmentSensor?.left ?? 50,
        top: metric?.environmentSensor?.top ?? 50,
      };
    }

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
    return escapeHtml(value);
  }

  _renderHouseSelector(activeHouse) {
    if (!this.config.show_house_selector) return "";

    const options = Object.entries(HOUSE_VARIANTS)
      .map(([key, variant]) => htmlTag("option", { value: key, selected: key === activeHouse }, this._houseLabel(key, variant)))
      .join("");

    return htmlTag("select", { class: "house-select", "aria-label": this._t("aria.houseSelector") }, rawHtml(options));
  }

  _renderViewSelector() {
    if (this.config.show_view_selector !== true) return "";
    const activeView = this._currentViewMode();
    const buttons = VIEW_MODE_OPTIONS
      .map((option) => {
        const active = option.key === activeView;
        const label = this._t(option.labelKey, {}, option.label);
        const icon = viewModeIconSvg(option.icon);
        const content = option.icon
          ? `${icon}<span class="view-mode-label">${this._escape(label)}</span>`
          : this._escape(label);
        return htmlTag("button", {
          class: classNames("view-mode-button", { active, "view-mode-icon-button": Boolean(option.icon), "view-mode-icon-only": Boolean(option.icon) }),
          type: "button",
          "data-view-mode": option.key,
          "aria-pressed": active ? "true" : "false",
          "aria-label": label,
          title: label,
        }, rawHtml(content));
      })
      .join("");

    return htmlTag("div", {
      class: "view-mode-toggle",
      role: "group",
      "aria-label": this._t("aria.viewSelector", {}, "Select dashboard view"),
    }, rawHtml(buttons));
  }

  _renderEnergyRangeSelector() {
    if (this.config.show_energy_range_selector !== true) return "";
    const activeRange = this._currentEnergyRange();
    const options = ENERGY_RANGE_OPTIONS
      .map((option) => htmlTag("option", { value: option.key, selected: option.key === activeRange }, this._t(option.labelKey, {}, option.label)))
      .join("");

    return htmlTag("select", { class: "energy-range-select", "aria-label": this._t("aria.energyRangeSelector") }, rawHtml(options));
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
      urls.push(assetUrl(file));
    } catch (_err) {
      // no local root fallback
    }
    try {
      urls.push(assetUrl(`images/${file}`));
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
    const labelHtml = htmlTag("div", { class: "label", "data-label": metric.key }, this._metricLabel(metric, variant));
    const valueHtml = htmlTag("div", { class: "value", "data-value": metric.key }, rawHtml(this._renderMetricValueHtml(metric)));
    const bodyHtml = [
      labelHtml,
      htmlTag("div", { class: "value-row" }, rawHtml(valueHtml)),
      this._renderPvMetaRow(metric, { placement: "image" }),
      this._renderBatteryMetaRow(metric, { showFlowLabel: false, placement: "image" }),
      this._renderWallboxPhaseRow(metric, { placement: "image" }),
      this._renderVoltageMetaRow(metric, { placement: "image" }),
      this._renderMetricMeter(metric),
    ].join("");

    return htmlTag("div", {
      class: `metric${this._metricStateClass(metric)}`,
      "data-accent-key": metric.key,
      "data-metric": metric.key,
      "data-tooltip-key": metric.key,
      "data-chart-key": this._metricEntityId(metric) ? metric.key : "",
      "data-warning": warning?.label || "",
      title: tooltip,
      "aria-label": tooltip,
      style: `${styleMap({ left: `${left}%`, top: `${top}%` })};${this._accentStyle(metric)}`,
    }, rawHtml(bodyHtml));
  }

  _flowMetric(key) {
    return findFlowMetric(key);
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
      if (element.closest("[data-chart-dashboard]")) return;
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

    this._attachChartDashboardControls();
    this._attachRecordsDashboardControls();

    this.shadowRoot.querySelectorAll("[data-chart-close]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._closeChart();
      });
    });

    this._attachAdvisorControls();
  }

  _attachChartDashboardControls() {
    this.shadowRoot.querySelectorAll("[data-chart-dashboard] [data-chart-key]").forEach((element) => {
      if (element.dataset.chartDashboardBound === "true") return;
      element.dataset.chartDashboardBound = "true";
      const metricKey = element.dataset.chartKey;
      if (!metricKey) return;
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._openChart(metricKey);
      });
    });

    this.shadowRoot.querySelectorAll("[data-chart-dashboard-hours]").forEach((button) => {
      if (button.dataset.chartDashboardBound === "true") return;
      button.dataset.chartDashboardBound = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const hours = Number(event.currentTarget.dataset.chartDashboardHours);
        this._chartHours = [24, 48].includes(hours) ? hours : 24;
        this._renderCardShell(this._layoutState());
      });
    });
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
    return htmlTag("div", {
      class: ["voltage-alert", `voltage-alert-${alert.type}`],
      "data-grid-voltage-alert": true,
      title: source,
      "aria-label": text,
    }, [
      rawHtml(htmlTag("strong", {}, alert.label)),
      rawHtml(htmlTag("span", {}, alert.value || "")),
    ]);
  }

  _renderCardShell(state) {
    this._lastImageKey = this._imageStateKey();
    this._lastLanguage = this._language();
    this._currentVariant = state.variant;
    const activeView = this._currentViewMode();
    const visibleHudMetrics = this._visibleHudMetrics(state.variant);
    const visibleTileMetrics = this._visibleTileMetrics(state.variant);
    const environmentMetrics = this._environmentSensorMetrics({ placement: "footer" });
    const largeConsumerMetrics = this._largeConsumerMetrics();
    const metricHtml = visibleHudMetrics.map((metric) => this._renderMetric(metric, state.variant)).join("");
    const imageOverlayHtml = this._renderImageOverlays(state.activeHouse);
    const flowHtml = this._renderEnergyFlows(state.variant);
    const advisorHtml = activeView === "advisor" ? this._renderEnergyAdvisor({ dashboard: true }) : "";
    const floorplanDashboardHtml = activeView === FLOORPLAN_DASHBOARD_VIEW ? this._renderFloorplanDashboard() : "";
    const chartDashboardHtml = activeView === CHART_DASHBOARD_VIEW ? this._renderChartDashboard(state.variant) : "";
    const recordsDashboardHtml = activeView === RECORDS_DASHBOARD_VIEW ? this._renderRecordsDashboard(state.variant) : "";
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
    const environmentHtml = environmentMetrics.map(renderTile).join("");
    const largeConsumerHtml = largeConsumerMetrics.map(renderTile).join("");
    const environmentSectionHtml = this.config.show_environment_sensors !== false && environmentMetrics.length > 0
      ? `
        <section class="tile-section environment-sensor-section">
          <div class="tile-section-title">${this._escape(this._t("environment.sectionTitle", {}, "Environment"))}</div>
          <div class="grid environment-sensor-grid">${environmentHtml}</div>
        </section>
      `
      : "";
    const largeConsumerSectionHtml = this.config.show_large_consumers !== false && largeConsumerMetrics.length > 0
      ? `
        <section class="tile-section large-consumer-section">
          <div class="tile-section-title">${this._escape(this._t("consumer.sectionTitle", {}, "Additional Large Consumers"))}</div>
          <div class="grid large-consumer-grid">${largeConsumerHtml}</div>
        </section>
      `
      : "";

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${this._escape(assetUrl("styles/card.css"))}" />
      <style>
        :host {
          --hud-box-opacity:${this._escape(this.config.hud_box_opacity)};
          --hud-box-scale:${this._escape(this.config.hud_box_scale)};
        }
      </style>
      <ha-card>
        ${headerHtml ? `<div class="header">${headerHtml}</div>` : ""}
        ${voltageAlertHtml}
        ${activeView === "advisor"
          ? advisorHtml
          : activeView === FLOORPLAN_DASHBOARD_VIEW
            ? floorplanDashboardHtml
            : activeView === CHART_DASHBOARD_VIEW
              ? chartDashboardHtml
              : activeView === RECORDS_DASHBOARD_VIEW
                ? recordsDashboardHtml
                : `
            <div class="scene"><img class="scene-image" src="${this._escape(state.imageSrc)}" data-fallbacks="${this._escape((state.imageFallbacks || []).join("|"))}" alt="${this._escape(this._houseLabel(state.activeHouse, state.variant))}" />${imageOverlayHtml}${flowHtml}${metricHtml}${statusHtml}</div>
            ${this.config.show_metric_tiles !== false ? `<div class="grid">${gridHtml}</div>${environmentSectionHtml}${largeConsumerSectionHtml}` : ""}
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
      ...this._environmentSensorMetrics(),
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
      const anchor = this.shadowRoot.querySelector(".scene,[data-energy-advisor],[data-floorplan-dashboard],[data-chart-dashboard],[data-record-dashboard]");
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
    const nextChartDashboardHtml = activeView === CHART_DASHBOARD_VIEW ? this._renderChartDashboard(variant) : "";
    const chartDashboardElement = this.shadowRoot.querySelector("[data-chart-dashboard]");
    let chartDashboardChanged = false;
    if (chartDashboardElement && nextChartDashboardHtml) {
      chartDashboardElement.outerHTML = nextChartDashboardHtml.trim();
      chartDashboardChanged = true;
    } else if (chartDashboardElement && !nextChartDashboardHtml) {
      chartDashboardElement.remove();
    } else if (!chartDashboardElement && nextChartDashboardHtml) {
      this.shadowRoot.querySelector("ha-card")?.insertAdjacentHTML("beforeend", nextChartDashboardHtml);
      chartDashboardChanged = true;
    }
    if (chartDashboardChanged) this._attachChartDashboardControls();
    const nextRecordsDashboardHtml = activeView === RECORDS_DASHBOARD_VIEW ? this._renderRecordsDashboard(variant) : "";
    const recordsDashboardElement = this.shadowRoot.querySelector("[data-record-dashboard]");
    let recordsDashboardChanged = false;
    if (recordsDashboardElement && nextRecordsDashboardHtml) {
      recordsDashboardElement.outerHTML = nextRecordsDashboardHtml.trim();
      recordsDashboardChanged = true;
    } else if (recordsDashboardElement && !nextRecordsDashboardHtml) {
      recordsDashboardElement.remove();
    } else if (!recordsDashboardElement && nextRecordsDashboardHtml) {
      this.shadowRoot.querySelector("ha-card")?.insertAdjacentHTML("beforeend", nextRecordsDashboardHtml);
      recordsDashboardChanged = true;
    }
    if (recordsDashboardChanged) this._attachRecordsDashboardControls();
    this._updateFloorplanReadings();
  }

  renderCard() {
    if (!this.config || !this.shadowRoot) return;
    this._renderCardShell(this._layoutState());
  }
}

Object.assign(
  HaSolarDashboardCard.prototype,
  createAdvisorEngineMethods({
    CARD_TYPE,
    GRID_STATUS_METRIC,
    WALLBOX_POWER_KEYS,
    advisorSuggestionLimit,
    advisorThresholds,
    advisorTypeRank,
    findMetricByKey,
    largeConsumerAdvisorDetails,
    numericState,
    pvRoofStringAdvisorDetails,
    sortAdvisorItems,
    wallboxAdvisorDetails,
  }),
  createAdvisorViewMethods(),
  createWeatherImageMethods({
    REPOSITORY_IMAGE_BASE,
    assetUrl,
  }),
  createRecordsDashboardMethods({
    RECORDS_DEFAULT_DAYS,
    RECORDS_RANGE_OPTIONS,
    activeDurationRecords,
    chartHistoryApiPath,
    dailyEnergyRecords,
    numericState,
    peakPowerRecord,
    recordsHistoryCacheKey,
  }),
);

const HaSolarDashboardCardEditor = createDashboardEditorClass({
  ADVISOR_DEFAULTS,
  DEFAULT_TILE_COLOR_RULES,
  HOUSE_VARIANTS,
  IMAGE_OVERLAY_KEYS,
  TILE_METRICS,
  VIEW_MODE_OPTIONS,
  adjacentWallboxPosition,
  assetUrl,
  clampConfigNumber,
  ensureTranslations,
  findMetricByKey,
  inverterPhaseVoltageEntityKeys,
  isPvMetric,
  languageFromHass,
  largeConsumerLabel,
  metricVoltageEntityKey,
  normalizeAdvisorConfig,
  normalizeHouse,
  normalizeInverterDisplay,
  normalizeInverters,
  normalizeLargeConsumers,
  normalizePvRoofStringDisplay,
  normalizePvRoofStrings,
  parsePowerLimitWatts,
  translate,
  wallboxChargingEnabledEntityKey,
  wallboxConnectedEntityKey,
  wallboxMaxSocEntityKey,
  wallboxPhaseActionEntityKey,
  wallboxPhaseEntityKey,
  wallboxPhaseRemainingEntityKey,
  wallboxRemainingTimeEntityKey,
  wallboxSocEntityKey,
});

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

  globalThis.document?.querySelectorAll?.(type).forEach((element) => {
    if (element.config && typeof element.setConfig === "function") element.setConfig(element.config);
    if (typeof element.connectedCallback === "function") element.connectedCallback();
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
