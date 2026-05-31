import {
  ADVISOR_DEFAULTS,
  normalizeAdvisorConfig,
} from "../modules/advisor.js";
import {
  clampConfigNumber,
} from "../modules/config-normalizers.js";
import {
  createDashboardEditorClass,
} from "../modules/editor.js";
import {
  DEFAULT_IMAGE_OVERLAYS,
  HOUSE_VARIANTS,
  IMAGE_OVERLAY_KEYS,
  normalizeHouse,
} from "../modules/house-variants.js";
import {
  normalizeLargeConsumers,
  largeConsumerLabel,
} from "../modules/large-consumers.js";
import {
  DEFAULT_TILE_COLOR_RULES,
  TILE_METRICS,
  findMetricByKey,
  inverterPhaseVoltageEntityKeys,
  isPvMetric,
  metricVoltageEntityKey,
} from "../modules/metrics.js";
import {
  normalizeInverterDisplay,
  normalizeInverters,
  normalizePvRoofStringDisplay,
  normalizePvRoofStrings,
  parsePowerLimitWatts,
} from "../modules/pv-strings.js";
import {
  VIEW_MODE_OPTIONS,
} from "../modules/views.js";
import {
  adjacentWallboxPosition,
  wallboxChargingEnabledEntityKey,
  wallboxConnectedEntityKey,
  wallboxMaxSocEntityKey,
  wallboxPhaseActionEntityKey,
  wallboxPhaseEntityKey,
  wallboxPhaseRemainingEntityKey,
  wallboxRemainingTimeEntityKey,
  wallboxSocEntityKey,
} from "../modules/wallbox.js";

const CARD_EDITOR_PANEL_TYPE = "ha-solar-dashboard-card-editor-panel";
const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["en", "de", "es", "fr", "pl"];
const I18N = {};
const I18N_LOADS = new Map();

const PV_LABELS = [
  { suffix: "today_energy", labelKey: "pvLabel.todayEnergy", editorKey: "editor.pvTodayEnergyEntity", source: "entity", unit: "energy" },
  { suffix: "forecast_today", labelKey: "pvLabel.forecastToday", editorKey: "editor.pvForecastTodayEntity", source: "entity", unit: "energy" },
  { suffix: "peak_today", labelKey: "pvLabel.peakToday", editorKey: "editor.pvPeakTodayEntity", source: "entity", unit: "power" },
];

function scriptAssetBaseUrl() {
  const currentScriptUrl = globalThis.document?.currentScript?.src;
  if (currentScriptUrl) return currentScriptUrl;
  const scripts = Array.from(globalThis.document?.querySelectorAll?.("script[src]") || []);
  const script = scripts
    .map((element) => element.src || element.getAttribute?.("src") || "")
    .reverse()
    .find((src) => /ha-solar-dashboard(?:-editor)?(?:\.js|\/)/.test(src));
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
      I18N[normalizedLanguage] = dictionary || {};
      return I18N[normalizedLanguage];
    })
    .catch((error) => {
      console.warn(`HA Solar Dashboard: could not load i18n/${normalizedLanguage}.json`, error);
      I18N[normalizedLanguage] = {};
      return I18N[normalizedLanguage];
    })
    .finally(() => I18N_LOADS.delete(normalizedLanguage));
  I18N_LOADS.set(normalizedLanguage, request);
  return request;
}

function ensureTranslations(language, callback) {
  const normalizedLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
  if (I18N[normalizedLanguage]) return;
  loadTranslation(normalizedLanguage).then(callback);
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

const HaSolarDashboardCardEditorPanel = createDashboardEditorClass({
  ADVISOR_DEFAULTS,
  DEFAULT_IMAGE_OVERLAYS,
  DEFAULT_TILE_COLOR_RULES,
  HOUSE_VARIANTS,
  IMAGE_OVERLAY_KEYS,
  PV_LABELS,
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

function registerEditorElement(type, elementClass) {
  const existingClass = customElements.get(type);
  if (!existingClass) {
    customElements.define(type, elementClass);
    return;
  }

  Object.getOwnPropertyNames(elementClass.prototype).forEach((name) => {
    if (name === "constructor") return;
    Object.defineProperty(existingClass.prototype, name, Object.getOwnPropertyDescriptor(elementClass.prototype, name));
  });
}

registerEditorElement(CARD_EDITOR_PANEL_TYPE, HaSolarDashboardCardEditorPanel);
