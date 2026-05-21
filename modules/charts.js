export function chartHistoryCacheKey(entityId, hours, bucket) {
  return `${entityId}|${hours}|${bucket}`;
}

export function chartHistoryApiPath(entityId, hours, end = new Date()) {
  const endDate = end instanceof Date ? end : new Date(end);
  const start = new Date(endDate.getTime() - hours * 60 * 60 * 1000);
  const query = [
    `filter_entity_id=${encodeURIComponent(entityId)}`,
    `end_time=${encodeURIComponent(endDate.toISOString())}`,
    "significant_changes_only=0",
  ].join("&");
  return `history/period/${start.toISOString()}?${query}`;
}

export function chartHistoryPoint(metric, entry, {
  metricEntityId,
  getEntityUnit,
  formatValue,
  isMetricEnergyMode,
  valueAsKwh,
  valueAsWatts,
  numericState,
  isPowerUnit,
} = {}) {
  if (!entry || typeof entry !== "object") return undefined;
  const rawValue = entry.state ?? entry.s;
  if (formatValue?.(rawValue) === "—") return undefined;
  const entityId = metricEntityId?.(metric) || metric?.chartEntityId || "";
  const entityUnit = entry.attributes?.unit_of_measurement || getEntityUnit?.(entityId) || "";
  const numericValue = isMetricEnergyMode?.(metric)
    ? valueAsKwh?.(rawValue, entityUnit)
    : metric?.unit === "power" || (metric?.overlay === "heatpump" && isPowerUnit?.(entityUnit))
      ? valueAsWatts?.(rawValue, entityUnit)
      : numericState?.(rawValue);
  if (!Number.isFinite(numericValue)) return undefined;
  const rawTime = entry.last_changed || entry.last_updated || entry.lu;
  const time = Date.parse(rawTime || "");
  if (!Number.isFinite(time)) return undefined;
  return { time, value: numericValue };
}

export function chartBounds(points = []) {
  const values = points.map((point) => point.value).filter(Number.isFinite);
  if (values.length === 0) return { min: 0, max: 1 };
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = Math.max((rawMax - rawMin) * 0.12, rawMax === rawMin ? Math.abs(rawMax || 1) * 0.1 : 0);
  return {
    min: rawMin - pad,
    max: rawMax + pad,
  };
}

export function chartPath(points, min, max, start, end, width, height, padding) {
  const range = max - min || 1;
  return points.map((point) => {
    const x = padding.left + ((point.time - start) / Math.max(1, end - start)) * (width - padding.left - padding.right);
    const y = padding.top + (1 - ((point.value - min) / range)) * (height - padding.top - padding.bottom);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export function chartLastPointCoordinates(path, padding = { left: 0, top: 0 }) {
  const [x, y] = String(path || "").split(" ").at(-1)?.split(",") || [];
  return {
    x: x || padding.left,
    y: y || padding.top,
  };
}

function dedupeChartItems(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.entityId || item?.key;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function flattenChartSections(sections = []) {
  return sections.flatMap((section) => section.items || []);
}

export function chartDashboardSections({
  pvRoofStringEntries = [],
  metrics = [],
  metricEntityId,
  metricLabel,
  translate,
} = {}) {
  const toItem = (metric) => {
    const entityId = metric?.chartEntityId || metricEntityId?.(metric) || "";
    if (!entityId) return undefined;
    const key = metric?.chartKey || metric?.key || entityId;
    return {
      ...metric,
      key,
      chartKey: key,
      chartEntityId: entityId,
      chartLabel: metric?.chartLabel || metricLabel?.(metric) || metric?.label || key,
    };
  };
  const pvItems = pvRoofStringEntries
    .filter((entry) => entry?.powerEntityId)
    .map((entry, index) => toItem({
      key: `pv_roof_string_${entry.id || index}`,
      chartKey: `pv_roof_string_${entry.id || index}`,
      chartEntityId: entry.powerEntityId,
      chartLabel: entry.label || `String ${index + 1}`,
      unit: "power",
      color: "yellow",
    }))
    .filter(Boolean);

  const sectionDefinitions = [
    {
      key: "pv",
      label: translate?.("charts.sectionPvStrings", {}, "PV strings") || "PV strings",
      items: pvItems,
    },
    {
      key: "wallbox",
      label: translate?.("charts.sectionWallbox", {}, "Wallbox") || "Wallbox",
      items: metrics.filter((metric) => String(metric?.key || "").includes("wallbox")).map(toItem).filter(Boolean),
    },
    {
      key: "system",
      label: translate?.("charts.sectionSystem", {}, "Inverter and system") || "Inverter and system",
      items: metrics.filter((metric) => !String(metric?.key || "").includes("wallbox")).map(toItem).filter(Boolean),
    },
  ];

  const seenAcrossSections = new Set();
  return sectionDefinitions
    .map((section) => ({
      ...section,
      items: dedupeChartItems(section.items).filter((item) => {
        const key = item.entityId || item.key;
        if (seenAcrossSections.has(key)) return false;
        seenAcrossSections.add(key);
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}
