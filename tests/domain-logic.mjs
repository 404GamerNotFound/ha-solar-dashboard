import assert from "node:assert/strict";
import {
  normalizeAdvisorConfig,
  sortAdvisorItems,
} from "../modules/advisor.js";
import { normalizeBatteries } from "../modules/batteries.js";
import {
  clampConfigNumber,
  normalizeEnergyRange,
} from "../modules/config-normalizers.js";
import {
  applyRegionalDefaults,
  createBaseCardConfig,
  createEditorBaseConfig,
  createStubCardConfig,
} from "../modules/config-schema.js";
import {
  formatDistanceValue,
  formatEnergyValue,
  formatFlowValue,
  formatPrecipitationValue,
  formatPressureValue,
  formatPowerValue,
  formatTemperatureValue,
  formatValue,
  formatVolumeValue,
  isEnergyUnit,
  isVolumeUnit,
  valueAsCubicMeters,
  valueAsKwh,
  valueAsVolumeUnit,
  valueAsWatts,
} from "../modules/formatters.js";
import {
  chartHistoryPoint,
} from "../modules/charts.js";
import {
  DEFAULT_ELECTRIC_VEHICLE_IMAGE,
  normalizeElectricVehicleConfig,
} from "../modules/electric-vehicle.js";
import {
  DEFAULT_GARDEN_IMAGE,
  normalizeGardenConfig,
} from "../modules/garden.js";
import {
  formatMoneyValue,
  gridExportPrice,
  gridFinanceItems,
  gridFinanceLabel,
  gridImportPrice,
  localDateKey,
  normalizeGridPrice,
  todayStartDate,
} from "../modules/grid-finance.js";
import {
  formatGridStatusReading,
  gridSignedFlowInfo,
  gridSplitFlowInfo,
  gridSplitPowerDetails,
  gridStatusFromFlowInfo,
} from "../modules/grid-flow.js";
import {
  createHistoryQueueMethods,
  normalizeHistoryRequestConcurrency,
} from "../modules/history-queue.js";
import {
  MINUTE_MS,
  cacheBucket,
  cacheBucketMsForMinutes,
  counterConsumptionFromStates,
  counterHistoryApiPath,
  counterHistoryStatesFromEntries,
  setCacheEntry,
} from "../modules/history-service.js";
import {
  customImage,
  customImageFiles,
  imageFormatFiles,
  imageWithSuffix,
  variantImage,
  weatherImageFiles,
} from "../modules/weather-images.js";

function gridLabel(kind) {
  return {
    export: "Export",
    import: "Import",
    neutral: "Neutral",
  }[kind] || kind;
}

assert.deepEqual(normalizeBatteries([{ entity: "sensor.battery_2_soc", battery_flow_power: "sensor.battery_2_power" }])[0], {
  id: "battery_2",
  label: "Battery 2",
  level_entity: "sensor.battery_2_soc",
  flow_power_entity: "sensor.battery_2_power",
  voltage_entity: "",
  charge_power_entity: "",
  discharge_power_entity: "",
  min_soc_entity: "",
  max_soc_entity: "",
  temperature_entity: "",
  cycles_today_entity: "",
  left: "",
  top: "",
  show_image: true,
  show_footer: true,
  visible: true,
});

assert.deepEqual(imageFormatFiles("house.png"), ["house.webp", "house.png"]);
assert.deepEqual(imageFormatFiles("house.jpg"), ["house.jpg"]);
assert.equal(imageWithSuffix("/local/solar/house_day.png", "rainy"), "/local/solar/house_day_rainy.png");
assert.equal(imageWithSuffix("https://example.com/solar/house.png?v=1", "rainy"), "https://example.com/solar/house_rainy.png?v=1");
assert.equal(imageWithSuffix("https://example.com/solar/house", "rainy"), "https://example.com/solar/house_rainy");

const weatherFiles = weatherImageFiles({
  variant: {
    file: "demo.png",
    dayFile: "demo_day.png",
    fallbackFiles: ["demo_fallback.png"],
  },
  isDaylight: true,
  weatherState: "snowy",
});
assert.deepEqual(weatherFiles.slice(0, 6), [
  "demo_day_snowy.png",
  "demo_snowy.png",
  "demo_day_snow.png",
  "demo_snow.png",
  "demo_day_winter.png",
  "demo_winter.png",
]);
assert.deepEqual(weatherFiles.slice(-3), ["demo_day.png", "demo.png", "demo_fallback.png"]);

const image = variantImage({
  variant: {
    folder: "demo-house",
    file: "demo.png",
    dayFile: "demo_day.png",
  },
  isDaylight: true,
  weatherState: "sunny",
  remoteImageUrl: (file) => `remote/${file}`,
  localImageUrl: (file) => `local/${file}`,
});
assert.equal(image.src, "remote/demo-house/demo_day_sunny.webp");
assert.deepEqual(image.fallbacks.slice(0, 5), [
  "local/demo-house/demo_day_sunny.webp",
  "remote/demo-house/demo_day_sunny.png",
  "local/demo-house/demo_day_sunny.png",
  "remote/demo-house/demo_sunny.webp",
  "local/demo-house/demo_sunny.webp",
]);

const customWeatherFiles = customImageFiles({
  image: "/local/solar/house_night.png",
  dayImage: "/local/solar/house_day.png",
  isDaylight: true,
  weatherState: "rainy",
});
assert.deepEqual(customWeatherFiles, [
  "/local/solar/house_day_rainy.png",
  "/local/solar/house_night_rainy.png",
  "/local/solar/house_day.png",
  "/local/solar/house_night.png",
]);
const customWeatherImage = customImage({
  image: "/local/solar/house_night.png",
  dayImage: "/local/solar/house_day.png",
  isDaylight: true,
  weatherState: "rainy",
});
assert.equal(customWeatherImage.src, "/local/solar/house_day_rainy.png");
assert.deepEqual(customWeatherImage.fallbacks, [
  "/local/solar/house_night_rainy.png",
  "/local/solar/house_day.png",
  "/local/solar/house_night.png",
]);

assert.equal(normalizeEnergyRange("hourly"), "1h");
assert.equal(normalizeEnergyRange("60m"), "1h");
assert.equal(normalizeEnergyRange("today"), "24h");
assert.equal(normalizeEnergyRange("monthly"), "month");
assert.equal(normalizeEnergyRange("lifetime"), "total");
assert.equal(normalizeEnergyRange("unknown"), undefined);
assert.equal(clampConfigNumber("12", 3, 1, 8), 8);
assert.equal(clampConfigNumber("bad", 3, 1, 8), 3);

const baseConfig = createBaseCardConfig({
  advisorDefaults: {
    surplusThreshold: 111,
    importThreshold: 222,
    highLoadThreshold: 333,
    evSurplusThreshold: 444,
    maxSuggestions: 5,
    staleSensorWarningMinutes: 6,
    staleSensorCriticalMinutes: 1440,
  },
  defaultHistoryRequestConcurrency: 4,
  recordsDefaultDays: 14,
});
assert.equal(baseConfig.grid_import_price, "");
assert.equal(baseConfig.currency, "€");
assert.equal(baseConfig.currency_position, "auto");
assert.equal(baseConfig.region_profile, "auto");
assert.equal(baseConfig.unit_system, "auto");
assert.equal(baseConfig.records_range, "14d");
assert.equal(baseConfig.advisor_surplus_threshold, 111);
assert.equal(baseConfig.history_request_concurrency, 4);
assert.equal(baseConfig.show_electric_vehicle, true);
assert.equal(baseConfig.electric_vehicle.image, DEFAULT_ELECTRIC_VEHICLE_IMAGE);
assert.deepEqual(baseConfig.electric_vehicle.display, {});
assert.equal(baseConfig.show_garden, true);
assert.equal(baseConfig.garden.image, DEFAULT_GARDEN_IMAGE);

const usRegionalConfig = applyRegionalDefaults({
  ...baseConfig,
  region_profile: "us",
}, { region_profile: "us" });
assert.equal(usRegionalConfig.currency, "$");
assert.equal(usRegionalConfig.currency_position, "prefix");
assert.equal(usRegionalConfig.units.water_meter, "gal");
assert.equal(usRegionalConfig.units.temperature, "°F");
assert.equal(usRegionalConfig.units.precipitation, "in");
assert.equal(usRegionalConfig.units.pressure, "psi");
assert.equal(usRegionalConfig.units.flow, "gal/min");
assert.equal(usRegionalConfig.units.distance, "mi");

const explicitRegionalConfig = applyRegionalDefaults({
  ...baseConfig,
  region_profile: "us",
  currency: "CAD",
  units: { ...baseConfig.units, water_meter: "L" },
}, { region_profile: "us", currency: "CAD", units: { water_meter: "L" } });
assert.equal(explicitRegionalConfig.currency, "CAD");
assert.equal(explicitRegionalConfig.units.water_meter, "L");
assert.deepEqual(baseConfig.garden.zones, []);
assert.deepEqual(baseConfig.garden.manual_actions, []);
assert.equal(createEditorBaseConfig({ floorplanLabel: "Etage 1" }).floorplan.floors[0].label, "Etage 1");
assert.equal(createEditorBaseConfig().electric_vehicle.image, DEFAULT_ELECTRIC_VEHICLE_IMAGE);
assert.equal(createEditorBaseConfig().garden.image, DEFAULT_GARDEN_IMAGE);
const stubConfig = createStubCardConfig({ cardType: "demo-card" });
assert.equal(stubConfig.type, "custom:demo-card");
assert.equal(stubConfig.visible_boxes.import_export_power, true);
assert.equal(stubConfig.entities.import_export_power, "sensor.grid_power");
const electricVehicleConfig = normalizeElectricVehicleConfig({
  image_path: "/local/car.png",
  loadpoint: "2",
  evcc_entities: {
    charge_mode: "select.evcc_charge_mode",
    vehicle_soc: "sensor.evcc_vehicle_soc",
    wallbox_power: "sensor.evcc_charge_power",
  },
});
assert.equal(electricVehicleConfig.image, "/local/car.png");
assert.equal(electricVehicleConfig.wallbox, "wallbox2_power");
assert.equal(electricVehicleConfig.entities.mode_control, "select.evcc_charge_mode");
assert.equal(electricVehicleConfig.entities.vehicle_soc, "sensor.evcc_vehicle_soc");
assert.equal(electricVehicleConfig.entities.charge_power, "sensor.evcc_charge_power");
const evccLoadpointConfig = normalizeElectricVehicleConfig({
  evcc_loadpoint: "Garage - Delta AC MAX",
  evcc_prefix: "evcc",
  day_image: "/local/eauto/eauto_day.png",
  night_image: "/local/eauto/eauto_night.png",
});
assert.equal(evccLoadpointConfig.evcc_loadpoint, "garage_delta_ac_max");
assert.equal(evccLoadpointConfig.evcc_prefix, "evcc");
assert.equal(evccLoadpointConfig.day_image, "/local/eauto/eauto_day.png");
assert.equal(evccLoadpointConfig.night_image, "/local/eauto/eauto_night.png");
assert.equal(evccLoadpointConfig.display.status.image, "both");
assert.equal(evccLoadpointConfig.display.charge_power.image, "both");
assert.equal(evccLoadpointConfig.display.home_power.image, "hidden");
assert.equal(evccLoadpointConfig.display.mode_control.tile, "hidden");
const evccDisplayConfig = normalizeElectricVehicleConfig({
  display: {
    grid_power: { image: "desktop", tile: "mobile", tile_position: 7 },
    home_power: "mobile",
    charge_power: { image: false, tile: false },
  },
});
assert.equal(evccDisplayConfig.display.grid_power.image, "desktop");
assert.equal(evccDisplayConfig.display.grid_power.tile, "mobile");
assert.equal(evccDisplayConfig.display.grid_power.tile_position, 7);
assert.equal(evccDisplayConfig.display.home_power.image, "mobile");
assert.equal(evccDisplayConfig.display.home_power.tile, "mobile");
assert.equal(evccDisplayConfig.display.charge_power.image, "hidden");
assert.equal(evccDisplayConfig.display.charge_power.tile, "hidden");
const gardenConfig = normalizeGardenConfig({
  image_path: "/local/garden.png",
  garden_entities: {
    mower_status: "sensor.mower_status",
    regen_24h: "sensor.rain_24h",
    gartenwasser: "switch.garden_water",
    automation_enabled: "input_boolean.irrigation_auto",
  },
  zones: [{ id: "z1", label: "Rasen links", left: 12, top: 34 }],
  manual_actions: [{ label: "Rasen starten", script: "script.bewaesserung_rasen_lauf", confirm: "Start?" }],
});
assert.equal(gardenConfig.image, "/local/garden.png");
assert.equal(gardenConfig.entities.mower_status, "sensor.mower_status");
assert.equal(gardenConfig.entities.rain_24h, "sensor.rain_24h");
assert.equal(gardenConfig.entities.garden_water, "switch.garden_water");
assert.equal(gardenConfig.entities.irrigation_enabled, "input_boolean.irrigation_auto");
assert.equal(gardenConfig.zones.length, 1);
assert.equal(gardenConfig.zones[0].label, "Rasen links");
assert.equal(gardenConfig.zones[0].left, 12);
assert.equal(gardenConfig.manual_actions.length, 1);
assert.equal(gardenConfig.manual_actions[0].entity, "script.bewaesserung_rasen_lauf");

assert.equal(normalizeGridPrice("0,32"), 0.32);
assert.equal(normalizeGridPrice(""), "");
assert.equal(gridImportPrice({ grid_import_price: "", import_price: "0.31" }), 0.31);
assert.equal(gridExportPrice({ feed_in_tariff: "0.082" }), 0.082);
assert.equal(formatMoneyValue(3.5, { currency: "€", language: "de" }), "3,50 €");
assert.equal(formatMoneyValue(3.5, { currency: "$", language: "en" }), "$3.50");
assert.equal(formatMoneyValue(3.5, { currency: "$", currencyPosition: "suffix", language: "en" }), "3.50 $");
assert.equal(formatMoneyValue(3.5, { currency: "€", currencyPosition: "prefix", language: "de" }), "€3,50");
assert.equal(localDateKey(new Date(2026, 4, 31, 12)), "2026-05-31");
assert.equal(todayStartDate(new Date(2026, 4, 31, 12, 30)).getHours(), 0);
const financeItems = gridFinanceItems({
  config: {},
  importPrice: 0.32,
  exportPrice: "",
  importInfo: { amount: 4.25 },
  translate: (_key, _values, fallback) => fallback,
});
assert.equal(financeItems.length, 1);
assert.equal(gridFinanceLabel(financeItems[0], { formatMoney: (value) => `${value.toFixed(2)} EUR` }), "Today cost: 1.36 EUR");

assert.equal(isVolumeUnit("gal"), true);
assert.equal(valueAsCubicMeters(1, "gal")?.toFixed(6), "0.003785");
assert.equal(valueAsVolumeUnit(0.003785411784, "m³", "gal"), 1);
assert.equal(formatVolumeValue(1, "m³", "gal"), "264.2 gal");
assert.equal(formatVolumeValue(10, "gal", "m³"), "0.038 m³");
assert.equal(formatVolumeValue(2, "gal", "L"), "7.6 L");
assert.equal(formatTemperatureValue(20, "°C", "°F"), "68.0 °F");
assert.equal(formatTemperatureValue(68, "°F", "°C"), "20.0 °C");
assert.equal(formatPrecipitationValue(25.4, "mm", "in"), "1 in");
assert.equal(formatPressureValue(2, "bar", "psi"), "29 psi");
assert.equal(formatFlowValue(3.785411784, "L/min", "gal/min"), "1 gal/min");
assert.equal(formatDistanceValue(100, "km", "mi"), "62.1 mi");
assert.deepEqual(chartHistoryPoint(
  { key: "ev_session_energy", unit: "energy", chartEntityId: "sensor.ev_session_energy" },
  { state: "4120", attributes: { unit_of_measurement: "Wh" }, last_changed: "2026-05-31T12:00:00.000Z" },
  {
    metricEntityId: (metric) => metric.chartEntityId,
    formatValue,
    valueAsKwh,
    numericState: Number,
  },
), { time: Date.parse("2026-05-31T12:00:00.000Z"), value: 4.12 });
assert.deepEqual(chartHistoryPoint(
  { key: "ev_connected", unit: "boolean", chartEntityId: "binary_sensor.ev_connected" },
  { state: "on", last_changed: "2026-05-31T12:05:00.000Z" },
  {
    metricEntityId: (metric) => metric.chartEntityId,
    formatValue,
    numericState: Number,
  },
), { time: Date.parse("2026-05-31T12:05:00.000Z"), value: 1 });

const signedFlow = gridSignedFlowInfo({
  entityId: "sensor.grid_power",
  rawValue: "-420",
  entityUnit: "W",
  unit: "auto",
  formatValue,
  valueAsWatts,
  isEnergyUnit,
  formatEnergyValue,
  formatPowerValue,
});
assert.deepEqual(signedFlow, { kind: "flow", watts: -420, unit: "auto" });
const signedStatus = gridStatusFromFlowInfo(signedFlow, {
  neutralThreshold: 25,
  labelForKind: gridLabel,
  formatPowerValue,
});
assert.equal(signedStatus.kind, "export");
assert.equal(signedStatus.value, "420 W");
assert.equal(formatGridStatusReading(signedStatus), "Export 420 W");

const splitFlow = gridSplitFlowInfo({
  importEntityId: "sensor.grid_import",
  exportEntityId: "sensor.grid_export",
  importValue: { kind: "power", amount: 70 },
  exportValue: { kind: "energy", amount: 0.4 },
  unit: "auto",
});
assert.deepEqual(splitFlow, { kind: "flow", watts: -330, unit: "auto" });
const splitStatus = gridStatusFromFlowInfo(splitFlow, {
  neutralThreshold: 25,
  labelForKind: gridLabel,
  formatPowerValue,
});
assert.equal(formatGridStatusReading(splitStatus), "Export 330 W");
assert.deepEqual(gridSplitPowerDetails({
  importEntityId: "sensor.grid_import",
  exportEntityId: "sensor.grid_export",
  importValue: { kind: "power", amount: 70 },
  exportValue: { kind: "energy", amount: 0.4 },
}), {
  importEntityId: "sensor.grid_import",
  exportEntityId: "sensor.grid_export",
  importWatts: 70,
  exportWatts: 400,
});

const advisorConfig = normalizeAdvisorConfig({
  advisor_surplus_threshold: -100,
  advisor_max_suggestions: 99,
  advisor_stale_sensor_warning_minutes: 0,
  advisor_stale_sensor_critical_minutes: 2,
});
assert.equal(advisorConfig.advisor_surplus_threshold, 0);
assert.equal(advisorConfig.advisor_max_suggestions, 12);
assert.equal(advisorConfig.advisor_stale_sensor_warning_minutes, 1);
assert.equal(advisorConfig.advisor_stale_sensor_critical_minutes, 1440);

const sortedAdvisorItems = sortAdvisorItems([
  { id: "success", type: "success", priority: 999 },
  { id: "warning-low", type: "warning", priority: 1 },
  { id: "critical", type: "critical", priority: 0 },
  { id: "warning-high", type: "warning", priority: 20 },
  { id: "opportunity", type: "opportunity", priority: 500 },
]);
assert.deepEqual(sortedAdvisorItems.map((item) => item.id), [
  "critical",
  "warning-high",
  "warning-low",
  "opportunity",
  "success",
]);

assert.equal(normalizeHistoryRequestConcurrency(undefined), 2);
assert.equal(normalizeHistoryRequestConcurrency(0), 1);
assert.equal(normalizeHistoryRequestConcurrency(99), 6);
assert.equal(cacheBucketMsForMinutes(30), MINUTE_MS);
assert.equal(cacheBucketMsForMinutes(24 * 60), 5 * MINUTE_MS);
assert.equal(cacheBucketMsForMinutes(31 * 24 * 60), 30 * MINUTE_MS);
assert.equal(cacheBucketMsForMinutes(365 * 24 * 60), 6 * 60 * MINUTE_MS);
assert.equal(cacheBucket(60_000, 123_456), 2);
const cappedCache = new Map();
setCacheEntry(cappedCache, "a", 1, 2);
setCacheEntry(cappedCache, "b", 2, 2);
setCacheEntry(cappedCache, "c", 3, 2);
assert.deepEqual([...cappedCache.keys()], ["b", "c"]);
assert.equal(
  counterHistoryApiPath("sensor.grid import", new Date("2026-05-31T00:00:00.000Z"), new Date("2026-05-31T12:00:00.000Z")),
  "history/period/2026-05-31T00:00:00.000Z?filter_entity_id=sensor.grid%20import&end_time=2026-05-31T12%3A00%3A00.000Z&significant_changes_only=0",
);
const counterStates = counterHistoryStatesFromEntries([
  { state: "12.75", attributes: { unit_of_measurement: "kWh" }, last_changed: "2026-05-31T00:30:00.000Z" },
  { state: "12.5", attributes: { unit_of_measurement: "kWh" }, last_changed: "2026-05-31T00:00:00.000Z" },
  { state: "unknown", last_changed: "2026-05-31T01:00:00.000Z" },
], { numericState: Number, defaultUnit: "kWh" });
assert.deepEqual(counterStates.map((state) => state.value), [12.5, 12.75]);
assert.deepEqual(counterConsumptionFromStates(counterStates, { currentValue: 13, defaultUnit: "kWh" }), { amount: 0.5, unit: "kWh" });
assert.deepEqual(counterConsumptionFromStates(counterStates, { currentValue: 12, defaultUnit: "kWh" }), { amount: 0, unit: "kWh" });

const dedupeQueueHost = { config: { history_request_concurrency: 2 } };
Object.assign(dedupeQueueHost, createHistoryQueueMethods());
let dedupedRuns = 0;
const dedupedFirst = dedupeQueueHost._queueHistoryRequest("same", async () => {
  dedupedRuns += 1;
  return "shared";
});
const dedupedSecond = dedupeQueueHost._queueHistoryRequest("same", async () => {
  dedupedRuns += 1;
  return "duplicate";
});
assert.equal(await dedupedFirst, "shared");
assert.equal(await dedupedSecond, "shared");
assert.equal(dedupedRuns, 1);

const priorityQueueHost = { config: { history_request_concurrency: 1 }, _historyRequestActiveCount: 1 };
Object.assign(priorityQueueHost, createHistoryQueueMethods());
const startedHistoryJobs = [];
const lowPriority = priorityQueueHost._queueHistoryRequest("low", async () => {
  startedHistoryJobs.push("low");
  return "low";
}, { priority: 1 });
const highPriority = priorityQueueHost._queueHistoryRequest("high", async () => {
  startedHistoryJobs.push("high");
  return "high";
}, { priority: 50 });
priorityQueueHost._historyRequestActiveCount = 0;
priorityQueueHost._drainHistoryRequestQueue();
assert.deepEqual(await Promise.all([highPriority, lowPriority]), ["high", "low"]);
assert.deepEqual(startedHistoryJobs, ["high", "low"]);

globalThis.HTMLElement = globalThis.HTMLElement || class {};
globalThis.window = globalThis.window || globalThis;
globalThis.document = globalThis.document || {
  currentScript: undefined,
  documentElement: {},
  querySelectorAll: () => [],
};
const definedCustomElements = new Map();
globalThis.customElements = globalThis.customElements || {
  get: (type) => definedCustomElements.get(type),
  define: (type, elementClass) => definedCustomElements.set(type, elementClass),
};
await import("../src/ha-solar-dashboard.js");
const DashboardCard = globalThis.customElements.get("ha-solar-dashboard-card");
const DashboardEditorPanel = globalThis.customElements.get("ha-solar-dashboard-card-editor-panel");
const editorPanel = new DashboardEditorPanel();
editorPanel._floorplanFloorLabel = () => "Level 1";
editorPanel._normalizeEnvironmentSensors = () => [];
editorPanel._normalizeFloorplan = () => ({ floors: [] });
editorPanel._render = () => {};
assert.doesNotThrow(() => editorPanel.setConfig({ entities: { battery_level: "sensor.battery_1_soc" }, batteries: [{ entity: "sensor.battery_2_soc" }] }));
assert.equal(editorPanel._config.batteries[0].level_entity, "sensor.battery_2_soc");
const voltageAlertCard = new DashboardCard();
voltageAlertCard.config = {
  house: "single_family_home",
  entities: {
    grid_voltage: "sensor.grid_voltage",
    pv_roof_power_voltage: "sensor.pv_dc_voltage",
  },
  visible_boxes: { pv_roof_power: true },
  labels: {},
  label_visibility: {},
  positions: {},
  units: {},
  inverters: [],
  large_consumers: [],
  grid_voltage_warning_threshold: 245,
  grid_voltage_critical_threshold: 253,
};
voltageAlertCard._currentVariant = { labels: {}, labelKeys: {}, visible_boxes: {} };
voltageAlertCard._hass = {
  states: {
    "sensor.grid_voltage": { state: "230", attributes: { unit_of_measurement: "V" } },
    "sensor.pv_dc_voltage": { state: "620", attributes: { unit_of_measurement: "V" } },
  },
};
assert.equal(voltageAlertCard._gridVoltageAlert(), undefined);
voltageAlertCard._hass.states["sensor.grid_voltage"].state = "246";
const gridVoltageWarning = voltageAlertCard._gridVoltageAlert();
assert.equal(gridVoltageWarning.type, "warning");
assert.equal(gridVoltageWarning.entityId, "sensor.grid_voltage");

const multiBatteryCard = new DashboardCard();
multiBatteryCard.config = {
  entities: { battery_level: "sensor.battery_1_soc" },
  batteries: normalizeBatteries([{ id: "garage", label: "Garage battery", entity: "sensor.battery_2_soc", battery_temperature: "sensor.battery_2_temperature" }]),
  positions: {}, visible_boxes: {}, labels: {}, label_visibility: {}, units: { battery: "%" },
};
multiBatteryCard._currentVariant = { positions: { battery_level: { left: 49, top: 66 } }, labels: {}, labelKeys: {}, visible_boxes: {} };
multiBatteryCard._hass = { states: {
  "sensor.battery_1_soc": { state: "80", attributes: { unit_of_measurement: "%" } },
  "sensor.battery_2_soc": { state: "45", attributes: { unit_of_measurement: "%" } },
  "sensor.battery_2_temperature": { state: "24", attributes: { unit_of_measurement: "°C" } },
} };
const additionalBatteryMetric = multiBatteryCard._additionalBatteryMetrics()[0];
assert.equal(additionalBatteryMetric.key, "batteries.garage");
assert.equal(multiBatteryCard._formatReading(additionalBatteryMetric), "45 %");
assert.equal(multiBatteryCard._visibleHudMetrics(multiBatteryCard._currentVariant).filter((metric) => metric.battery).length, 1);
assert.equal(multiBatteryCard._visibleTileMetrics(multiBatteryCard._currentVariant).filter((metric) => metric.battery).length, 1);
const orderedBatteryTiles = multiBatteryCard._visibleTileMetrics(multiBatteryCard._currentVariant);
const primaryBatteryTileIndex = orderedBatteryTiles.findIndex((metric) => metric.key === "battery_level");
assert.deepEqual(
  orderedBatteryTiles.slice(primaryBatteryTileIndex, primaryBatteryTileIndex + 2).map((metric) => metric.key),
  ["battery_level", "batteries.garage"],
);
assert.match(multiBatteryCard._renderMetric(additionalBatteryMetric, multiBatteryCard._currentVariant), /Garage battery/);
assert.match(multiBatteryCard._renderMetric(additionalBatteryMetric, multiBatteryCard._currentVariant), /Temp 24 °C/);

const lateBatteryStateCard = new DashboardCard();
lateBatteryStateCard.config = {
  entities: {},
  batteries: normalizeBatteries([{ id: "garage", entity: "sensor.battery_2_soc", temperature_entity: "sensor.battery_2_temperature" }]),
  units: { battery: "%" },
};
const lateBatteryMetric = lateBatteryStateCard._additionalBatteryMetrics()[0];
const initialBatteryMeta = lateBatteryStateCard._renderBatteryMetaRow(lateBatteryMetric);
assert.equal(lateBatteryStateCard._getEntityValue("sensor.missing", undefined), undefined);
assert.equal(lateBatteryStateCard._getEntityValue("sensor.missing"), "0");
assert.doesNotMatch(initialBatteryMeta, /Temp 0 °C/);
assert.match(initialBatteryMeta, /data-battery-temperature="batteries\.garage"/);
assert.match(initialBatteryMeta, /display:none/);

const temperatureAttributes = new Map();
const temperatureElement = {
  textContent: "",
  style: { display: "none" },
  setAttribute: (name, value) => temperatureAttributes.set(name, value),
};
lateBatteryStateCard._domCache = {
  batteryTemperatures: new Map([[lateBatteryMetric.key, [temperatureElement]]]),
};
lateBatteryStateCard._hass = { states: {
  "sensor.battery_2_temperature": { state: "27.6", attributes: { unit_of_measurement: "°C" } },
} };
lateBatteryStateCard._updateBatteryTemperature(lateBatteryMetric);
assert.equal(temperatureElement.textContent, "Temp 27.6 °C");
assert.equal(temperatureElement.style.display, "inline-flex");
assert.equal(temperatureAttributes.get("title"), "Temperature: Temp 27.6 °C");

console.log("Domain logic tests passed");
