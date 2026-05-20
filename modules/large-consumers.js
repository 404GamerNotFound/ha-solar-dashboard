export const LARGE_CONSUMER_DEFINITIONS = Object.freeze([
  { id: "washing_machine", labelKey: "consumer.washing_machine", label: "Washing machine", color: "#34d399", maxPowerKw: 2.2 },
  { id: "dishwasher", labelKey: "consumer.dishwasher", label: "Dishwasher", color: "#38bdf8", maxPowerKw: 2.0 },
  { id: "space_heater", labelKey: "consumer.space_heater", label: "Fan heater", color: "#fb923c", maxPowerKw: 2.0 },
  { id: "dryer", labelKey: "consumer.dryer", label: "Dryer", color: "#facc15", maxPowerKw: 2.8 },
  { id: "dhw_heatpump", labelKey: "consumer.dhw_heatpump", label: "Domestic hot water heat pump", color: "#60a5fa", maxPowerKw: 0.8 },
]);

const LEGACY_LARGE_CONSUMER_DEFINITIONS = new Map([
  ["custom_1", { id: "custom_1", labelKey: "consumer.custom", label: "Custom", color: "#a78bfa", maxPowerKw: "", custom: true }],
]);

function normalizeConsumerConfigId(value, fallback) {
  const id = String(value || fallback || "").trim().replace(/[^\w-]+/g, "_");
  return id || String(fallback || "item").replace(/[^\w-]+/g, "_");
}

function clampConsumerConfigNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function safeConsumerConfigColor(color, fallback = "#1f8fff") {
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
  const id = normalizeConsumerConfigId(source.id || source.key || source.type, definition?.id || `consumer_${index + 1}`);
  const maxPowerSource = source.max_power_kw ?? source.maxPowerKw ?? source.max_power ?? definition?.maxPowerKw ?? "";
  const maxPowerKw = maxPowerSource === "" || maxPowerSource === undefined || maxPowerSource === null
    ? ""
    : clampConsumerConfigNumber(maxPowerSource, "", 0, 1000);
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
    position: clampConsumerConfigNumber(source.position ?? source.order ?? 200 + index, 200 + index, 0, 999),
    columns: Math.round(clampConsumerConfigNumber(source.columns ?? source.span ?? 1, 1, 1, 6)),
    color: safeConsumerConfigColor(source.color, definition?.color || "#1f8fff"),
    custom: source.custom === true || definition?.custom === true || !definition,
    visible: source.enabled === false ? false : source.visible !== false,
  };
}

export function normalizeLargeConsumers(consumers) {
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
    rawById.set(normalizeConsumerConfigId(item.id || item.key || item.type, fallbackId), item);
  });
  const defaultConsumers = LARGE_CONSUMER_DEFINITIONS.map((definition, index) => (
    normalizeLargeConsumerConfig(rawById.get(definition.id) || {}, index, definition)
  ));
  const extraConsumers = rawList
    .map((item, index) => ({ item, id: normalizeConsumerConfigId(item?.id || item?.key || item?.type, `consumer_${index + 1}`) }))
    .filter(({ item, id }) => item && typeof item === "object" && !definitionIds.has(id))
    .map(({ item, id }, index) => normalizeLargeConsumerConfig(item, LARGE_CONSUMER_DEFINITIONS.length + index, LEGACY_LARGE_CONSUMER_DEFINITIONS.get(id)));
  return [...defaultConsumers, ...extraConsumers];
}

export function largeConsumerLabel(consumer, index = 0, translate) {
  const configured = String(consumer?.label || "").trim();
  if (configured) return configured;
  const fallback = consumer?.defaultLabel || `Consumer ${index + 1}`;
  if (consumer?.labelKey) return translate?.(consumer.labelKey, {}, fallback) || fallback;
  return translate?.(`consumer.${consumer?.type || consumer?.id}`, {}, fallback) || fallback;
}

export function largeConsumerHasEntity(consumer) {
  return Boolean(consumer?.power_entity || consumer?.energy_entity);
}

export function largeConsumerPowerEntityId(metricOrConsumer) {
  return metricOrConsumer?.largeConsumer?.power_entity || metricOrConsumer?.power_entity || "";
}

export function largeConsumerEnergyEntityId(metricOrConsumer) {
  return metricOrConsumer?.largeConsumer?.energy_entity || metricOrConsumer?.energy_entity || "";
}

export function largeConsumerVoltageEntityId(metricOrConsumer) {
  return metricOrConsumer?.largeConsumer?.voltage_entity || metricOrConsumer?.voltage_entity || "";
}

export function largeConsumerMetrics(consumers = [], { labelForConsumer } = {}) {
  return consumers
    .filter((consumer) => consumer?.visible !== false && largeConsumerHasEntity(consumer))
    .map((consumer, index) => ({
      key: `large_consumers.${consumer.id || index}`,
      label: typeof labelForConsumer === "function" ? labelForConsumer(consumer, index) : largeConsumerLabel(consumer, index),
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

export function largeConsumerPowerWatts(metricOrConsumer, { getValue, getUnit, valueAsWatts } = {}) {
  const entityId = largeConsumerPowerEntityId(metricOrConsumer);
  if (!entityId) return undefined;
  const value = typeof getValue === "function" ? getValue(entityId) : undefined;
  const watts = typeof valueAsWatts === "function" ? valueAsWatts(value, getUnit?.(entityId)) : undefined;
  return Number.isFinite(watts) ? Math.max(0, watts) : undefined;
}

export function largeConsumerEntityIds(consumers = []) {
  return consumers.flatMap((consumer) => [consumer.power_entity, consumer.voltage_entity, consumer.energy_entity]).filter(Boolean);
}

export function largeConsumerAdvisorDetails(consumers = [], {
  labelForConsumer,
  powerWattsForConsumer,
  parsePowerLimitWatts,
} = {}) {
  return consumers
    .map((consumer, index) => {
      const label = typeof labelForConsumer === "function" ? labelForConsumer(consumer, index) : largeConsumerLabel(consumer, index);
      const watts = typeof powerWattsForConsumer === "function" ? powerWattsForConsumer(consumer) : undefined;
      const maxPowerWatts = typeof parsePowerLimitWatts === "function" ? parsePowerLimitWatts(consumer.max_power_kw, "kw") : undefined;
      return {
        id: consumer.id || `consumer_${index + 1}`,
        label,
        powerEntityId: consumer.power_entity || "",
        energyEntityId: consumer.energy_entity || "",
        watts: Number.isFinite(watts) ? watts : 0,
        maxPowerWatts,
        configured: consumer.visible !== false && largeConsumerHasEntity(consumer),
        active: Number.isFinite(watts) && watts >= 100,
      };
    })
    .filter((consumer) => consumer.configured);
}
