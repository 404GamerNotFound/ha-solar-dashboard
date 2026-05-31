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
  formatEnergyValue,
  formatPowerValue,
  formatValue,
  isEnergyUnit,
  valueAsWatts,
} from "../modules/formatters.js";
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
  imageFormatFiles,
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

assert.equal(normalizeEnergyRange("hourly"), "1h");
assert.equal(normalizeEnergyRange("60m"), "1h");
assert.equal(normalizeEnergyRange("today"), "24h");
assert.equal(normalizeEnergyRange("monthly"), "month");
assert.equal(normalizeEnergyRange("lifetime"), "total");
assert.equal(normalizeEnergyRange("unknown"), undefined);
assert.equal(clampConfigNumber("12", 3, 1, 8), 8);
assert.equal(clampConfigNumber("bad", 3, 1, 8), 3);

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
