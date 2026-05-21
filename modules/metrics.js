export const OVERLAY_TILE_METRICS = Object.freeze([
  Object.freeze({ key: "overlay_smoke", label: "Gas", labelKey: "overlay.smoke", color: "yellow", unit: "overlay", overlay: "smoke", tileOrder: 7 }),
  Object.freeze({ key: "overlay_heatpump", label: "Heat pump", labelKey: "overlay.heatpump", color: "blue", unit: "overlay", overlay: "heatpump", tileOrder: 8 }),
]);

export const METRICS = Object.freeze([
  Object.freeze({ key: "pv_roof_power", label: "Roof PV", unit: "power", color: "yellow" }),
  Object.freeze({ key: "pv_shed_power", label: "Shed PV", unit: "power", color: "yellow" }),
  Object.freeze({ key: "battery_level", label: "Battery", unit: "battery", color: "green" }),
  Object.freeze({ key: "inverter_power", label: "Inverter", unit: "power", color: "blue" }),
  Object.freeze({ key: "wallbox_power", label: "EV Charger", unit: "power", color: "blue" }),
  Object.freeze({ key: "wallbox2_power", label: "EV Charger 2", unit: "power", color: "blue", optional: true }),
  Object.freeze({ key: "import_export_power", label: "Import/Export", unit: "power", color: "blue", optional: true, tile: false }),
]);

export const TILE_METRICS = Object.freeze([
  ...METRICS,
  Object.freeze({ key: "pv_total_power", label: "PV Total", unit: "power", color: "yellow", hud: false }),
  Object.freeze({ key: "house_consumption_power", label: "Consumption", unit: "power", color: "blue", hud: false, optional: true, tileOrder: 6 }),
]);

export const STATUS_METRIC = Object.freeze({ key: "import_export_power", label: "Import/Export", unit: "power", color: "blue" });

export const GRID_STATUS_METRIC = Object.freeze({
  ...STATUS_METRIC,
  key: "grid_status",
  sourceKey: "import_export_power",
  label: "Grid",
  labelKey: "metrics.grid_status",
  gridStatus: true,
  hud: false,
  tileOrder: 90,
});

export const DEFAULT_TILE_COLOR_RULES = Object.freeze({
  pv_roof_power: Object.freeze([
    Object.freeze({ above: 3000, color: "#34d399", glow: true }),
    Object.freeze({ above: 1000, color: "#ffc233" }),
    Object.freeze({ below: 100, color: "#9ba3b8" }),
  ]),
  pv_shed_power: Object.freeze([
    Object.freeze({ above: 3000, color: "#34d399", glow: true }),
    Object.freeze({ above: 1000, color: "#ffc233" }),
    Object.freeze({ below: 100, color: "#9ba3b8" }),
  ]),
  pv_total_power: Object.freeze([
    Object.freeze({ above: 3000, color: "#34d399", glow: true }),
    Object.freeze({ above: 1000, color: "#ffc233" }),
    Object.freeze({ below: 100, color: "#9ba3b8" }),
  ]),
  battery_level: Object.freeze([
    Object.freeze({ below: 20, color: "#f87171", glow: true }),
    Object.freeze({ below: 50, color: "#fb923c" }),
    Object.freeze({ above: 80, color: "#34d399" }),
  ]),
  import_export_power: Object.freeze([
    Object.freeze({ gt: 25, color: "#fb923c", glow: true }),
    Object.freeze({ lt: -25, color: "#34d399", glow: true }),
  ]),
});

export const STATIC_METRIC_COLORS = Object.freeze({
  yellow: "#ffc233",
  blue: "#1f8fff",
  green: "#34d399",
});

export function metricSourceKey(metric) {
  return metric?.sourceKey || metric?.key || "";
}

export function findMetricByKey(key, metrics = TILE_METRICS) {
  return metrics.find((metric) => metric.key === key);
}

export function findFlowMetric(key) {
  return findMetricByKey(key, TILE_METRICS)
    || findMetricByKey(key, METRICS)
    || (key === STATUS_METRIC.key ? STATUS_METRIC : undefined);
}

export function isPvMetric(metric) {
  return ["pv_roof_power", "pv_shed_power", "pv_total_power"].includes(metric?.key);
}

export function isPvRoofMetric(metric) {
  return metricSourceKey(metric) === "pv_roof_power";
}

export function isImportExportMetric(metric) {
  return metricSourceKey(metric) === "import_export_power";
}

export function metricVoltageEntityKey(metric) {
  if (!metric || metric.largeConsumer) return "";
  return `${metricSourceKey(metric)}_voltage`;
}

export function inverterPhaseVoltageEntityKeys(metric) {
  if (metricSourceKey(metric) !== "inverter_power") return [];
  return ["inverter_power_voltage_l1", "inverter_power_voltage_l2", "inverter_power_voltage_l3"];
}
