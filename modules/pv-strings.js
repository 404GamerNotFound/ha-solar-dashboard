function normalizePvConfigId(value, fallback) {
  const id = String(value || fallback || "").trim().replace(/[^\w-]+/g, "_");
  return id || String(fallback || "item").replace(/[^\w-]+/g, "_");
}

function clampPvConfigNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function parsePowerLimitWatts(rawValue, defaultUnit = "kw") {
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

export function normalizePvRoofStringDisplay(value) {
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

function normalizePowerSourceConfig(raw, index, {
  fallbackIdPrefix = "item",
  fallbackLabel = "Item",
} = {}) {
  const source = raw && typeof raw === "object" ? raw : { power_entity: raw };
  const sequence = index + 2;
  const id = normalizePvConfigId(source.id || source.key || source.name || source.label, `${fallbackIdPrefix}_${sequence}`);
  const maxPowerSource = source.max_power_kw ?? source.maxPowerKw ?? source.max_power ?? source.maxPower ?? "";
  const maxPowerKw = maxPowerSource === "" || maxPowerSource === undefined || maxPowerSource === null
    ? ""
    : clampPvConfigNumber(maxPowerSource, "", 0, 1000);
  return {
    id,
    label: String(source.label || source.name || `${fallbackLabel} ${sequence}`).trim(),
    power_entity: String(source.power_entity || source.powerEntity || source.entity || source.entity_id || source.power || "").trim(),
    energy_entity: String(source.energy_entity || source.energyEntity || source.kwh_entity || source.kwh || source.energy || source.counter || source.meter || "").trim(),
    voltage_entity: String(source.voltage_entity || source.voltageEntity || source.voltage || source.voltage_meter || "").trim(),
    voltage_entity_l1: String(source.voltage_entity_l1 || source.voltageEntityL1 || source.voltage_l1 || source.voltageL1 || "").trim(),
    voltage_entity_l2: String(source.voltage_entity_l2 || source.voltageEntityL2 || source.voltage_l2 || source.voltageL2 || "").trim(),
    voltage_entity_l3: String(source.voltage_entity_l3 || source.voltageEntityL3 || source.voltage_l3 || source.voltageL3 || "").trim(),
    max_power_kw: maxPowerKw,
    visible: source.enabled === false ? false : source.visible !== false,
  };
}

function normalizePowerSourceConfigs(configs, normalizeItem) {
  const rawList = Array.isArray(configs)
    ? configs
    : configs && typeof configs === "object"
      ? Object.entries(configs).map(([id, value]) => (
        value && typeof value === "object" ? { id, ...value } : { id, power_entity: value }
      ))
      : [];
  return rawList
    .map((item, index) => normalizeItem(item, index))
    .filter((item) => item.visible !== false || item.power_entity || item.energy_entity || item.voltage_entity || item.voltage_entity_l1 || item.voltage_entity_l2 || item.voltage_entity_l3 || item.label);
}

function normalizePvRoofStringConfig(raw, index) {
  return normalizePowerSourceConfig(raw, index, {
    fallbackIdPrefix: "string",
    fallbackLabel: "String",
  });
}

function normalizeInverterConfig(raw, index) {
  return normalizePowerSourceConfig(raw, index, {
    fallbackIdPrefix: "inverter",
    fallbackLabel: "Inverter",
  });
}

export function normalizePvRoofStrings(strings) {
  return normalizePowerSourceConfigs(strings, normalizePvRoofStringConfig);
}

export function normalizeInverterDisplay(value) {
  return normalizePvRoofStringDisplay(value);
}

export function normalizeInverters(inverters) {
  return normalizePowerSourceConfigs(inverters, normalizeInverterConfig);
}

export function pvRoofBaseEnergyEntityId(config = {}) {
  return String(config.entity || config.counter || config.kwh_entity || config.kwh || config.meter || "").trim();
}

function buildPowerSourceEntries({
  configs = [],
  powerEntityId = "",
  energyEntityId = "",
  maxPowerKw,
  maxPowerW,
  maxPower,
  voltageEntityId = "",
  voltageEntityIdL1 = "",
  voltageEntityIdL2 = "",
  voltageEntityIdL3 = "",
  baseId = "item_1",
  baseLabel = "Item 1",
  normalizeConfigs = (items) => items,
  fallbackIdPrefix = "item",
  fallbackLabel = "Item",
} = {}) {
  const baseMaxPower = parsePowerLimitWatts(maxPowerKw, "kw")
    || parsePowerLimitWatts(maxPowerW, "w")
    || parsePowerLimitWatts(maxPower, "kw");
  const baseEntry = {
    id: baseId,
    label: baseLabel,
    powerEntityId: powerEntityId || "",
    energyEntityId: energyEntityId || "",
    voltageEntityId: voltageEntityId || "",
    voltageEntityIdL1: voltageEntityIdL1 || "",
    voltageEntityIdL2: voltageEntityIdL2 || "",
    voltageEntityIdL3: voltageEntityIdL3 || "",
    maxPowerWatts: baseMaxPower,
    base: true,
    visible: true,
  };
  const extraEntries = normalizeConfigs(configs)
    .filter((config) => config.visible !== false)
    .map((config, index) => ({
      id: config.id || `${fallbackIdPrefix}_${index + 2}`,
      label: config.label || `${fallbackLabel} ${index + 2}`,
      powerEntityId: config.power_entity || "",
      energyEntityId: config.energy_entity || "",
      voltageEntityId: config.voltage_entity || "",
      voltageEntityIdL1: config.voltage_entity_l1 || "",
      voltageEntityIdL2: config.voltage_entity_l2 || "",
      voltageEntityIdL3: config.voltage_entity_l3 || "",
      maxPowerWatts: parsePowerLimitWatts(config.max_power_kw, "kw"),
      base: false,
      visible: true,
    }))
    .filter((entry) => entry.powerEntityId || entry.energyEntityId || entry.voltageEntityId || entry.voltageEntityIdL1 || entry.voltageEntityIdL2 || entry.voltageEntityIdL3 || entry.maxPowerWatts);
  return [baseEntry, ...extraEntries];
}

export function buildPvRoofStringEntries({
  strings = [],
  powerEntityId = "",
  energyEntityId = "",
  maxPowerKw,
  maxPowerW,
  maxPower,
} = {}) {
  return buildPowerSourceEntries({
    configs: strings,
    powerEntityId,
    energyEntityId,
    maxPowerKw,
    maxPowerW,
    maxPower,
    baseId: "string_1",
    baseLabel: "String 1",
    normalizeConfigs: normalizePvRoofStrings,
    fallbackIdPrefix: "string",
    fallbackLabel: "String",
  });
}

export function buildInverterEntries({
  inverters = [],
  powerEntityId = "",
  energyEntityId = "",
  maxPowerKw,
  maxPowerW,
  maxPower,
  voltageEntityId = "",
  voltageEntityIdL1 = "",
  voltageEntityIdL2 = "",
  voltageEntityIdL3 = "",
} = {}) {
  return buildPowerSourceEntries({
    configs: inverters,
    powerEntityId,
    energyEntityId,
    maxPowerKw,
    maxPowerW,
    maxPower,
    voltageEntityId,
    voltageEntityIdL1,
    voltageEntityIdL2,
    voltageEntityIdL3,
    baseId: "inverter_1",
    baseLabel: "Inverter 1",
    normalizeConfigs: normalizeInverters,
    fallbackIdPrefix: "inverter",
    fallbackLabel: "Inverter",
  });
}

export function hasAdditionalPvRoofStrings(entries = []) {
  return entries.some((entry) => !entry.base && (entry.powerEntityId || entry.energyEntityId));
}

export function hasAdditionalInverters(entries = []) {
  return hasAdditionalPvRoofStrings(entries);
}

export function pvRoofStringPowerParts(entries = [], { unit = "auto", readPowerWatts, formatPowerValue } = {}) {
  return entries
    .filter((entry) => entry.powerEntityId || !entry.base)
    .map((entry) => {
      const watts = typeof readPowerWatts === "function" ? readPowerWatts(entry) : undefined;
      return {
        ...entry,
        amount: watts,
        formatted: Number.isFinite(watts) && typeof formatPowerValue === "function" ? formatPowerValue(watts, unit, "W") : "—",
      };
    })
    .filter((part) => part.powerEntityId || !part.base);
}

export function pvRoofStringTotalPowerWatts(parts = []) {
  const values = parts.map((part) => part.amount).filter(Number.isFinite);
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

export function inverterPowerParts(entries = [], options = {}) {
  return pvRoofStringPowerParts(entries, options);
}

export function inverterTotalPowerWatts(parts = []) {
  return pvRoofStringTotalPowerWatts(parts);
}

export function pvRoofStringMaxPowerWatts(entries = []) {
  const maxValues = entries
    .map((entry) => entry.maxPowerWatts)
    .filter((value) => Number.isFinite(value) && value > 0);
  if (maxValues.length === 0) return undefined;
  return maxValues.reduce((sum, value) => sum + value, 0);
}

export function inverterMaxPowerWatts(entries = []) {
  return pvRoofStringMaxPowerWatts(entries);
}

export function pvRoofStringEnergyParts(entries = [], { range = "live", readEnergyInfo, formatEnergyValue } = {}) {
  if (range === "live") return [];
  return entries
    .filter((entry) => entry.energyEntityId || !entry.base)
    .map((entry) => {
      const info = entry.energyEntityId && typeof readEnergyInfo === "function"
        ? readEnergyInfo(entry, range)
        : undefined;
      return {
        ...entry,
        amount: info?.amount,
        loading: info?.loading,
        error: info?.error,
        formatted: info?.loading
          ? "…"
          : Number.isFinite(info?.amount) && typeof formatEnergyValue === "function"
            ? formatEnergyValue(info.amount, "kWh", "kWh")
            : "—",
      };
    })
    .filter((part) => part.energyEntityId || !part.base);
}

export function inverterEnergyParts(entries = [], options = {}) {
  return pvRoofStringEnergyParts(entries, options);
}

export function formatPvRoofStringReading({
  parts = [],
  mode = "sum",
  range = "live",
  unit = "auto",
  formatPowerValue,
  formatEnergyValue,
} = {}) {
  if (parts.length === 0) return "";
  if (parts.some((part) => part.loading)) return "…";
  const values = parts.map((part) => part.amount).filter(Number.isFinite);
  if (normalizePvRoofStringDisplay(mode) !== "sum") return parts.map((part) => part.formatted).join(" / ");
  if (values.length === 0) return "—";
  const total = values.reduce((sum, value) => sum + value, 0);
  return range === "live"
    ? formatPowerValue(total, unit, "W")
    : formatEnergyValue(total, "kWh", "kWh");
}

export function formatInverterReading(options = {}) {
  return formatPvRoofStringReading({
    ...options,
    mode: normalizeInverterDisplay(options.mode),
  });
}

export function pvRoofStringAdvisorDetails(entries = [], { readPowerWatts } = {}) {
  return entries
    .map((entry, index) => {
      const watts = typeof readPowerWatts === "function" ? readPowerWatts(entry) : undefined;
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

export function inverterAdvisorDetails(entries = [], { readPowerWatts } = {}) {
  return entries
    .map((entry, index) => {
      const watts = typeof readPowerWatts === "function" ? readPowerWatts(entry) : undefined;
      return {
        id: entry.id || `inverter_${index + 1}`,
        label: entry.label || `Inverter ${index + 1}`,
        powerEntityId: entry.powerEntityId || "",
        energyEntityId: entry.energyEntityId || "",
        watts: Number.isFinite(watts) ? watts : undefined,
        maxPowerWatts: entry.maxPowerWatts,
        configured: Boolean(entry.powerEntityId || entry.energyEntityId),
      };
    })
    .filter((entry) => entry.configured);
}
