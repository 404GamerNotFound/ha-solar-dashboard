import assert from "node:assert/strict";
import {
  normalizeAdvisorConfig,
  sortAdvisorItems,
} from "../modules/advisor.js";
import {
  clampConfigNumber,
  normalizeEnergyRange,
} from "../modules/config-normalizers.js";
import {
  createBaseCardConfig,
  createEditorBaseConfig,
  createStubCardConfig,
} from "../modules/config-schema.js";
import {
  formatEnergyValue,
  formatPowerValue,
  formatValue,
  isEnergyUnit,
  valueAsWatts,
} from "../modules/formatters.js";
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
assert.equal(baseConfig.records_range, "14d");
assert.equal(baseConfig.advisor_surplus_threshold, 111);
assert.equal(baseConfig.history_request_concurrency, 4);
assert.equal(baseConfig.show_electric_vehicle, true);
assert.equal(baseConfig.electric_vehicle.image, DEFAULT_ELECTRIC_VEHICLE_IMAGE);
assert.equal(baseConfig.show_garden, true);
assert.equal(baseConfig.garden.image, DEFAULT_GARDEN_IMAGE);
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

console.log("Domain logic tests passed");
