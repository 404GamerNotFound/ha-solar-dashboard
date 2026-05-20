export function numericState(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const normalized = String(value ?? "").trim().replace(/,/g, ".");
  if (!normalized || ["unknown", "unavailable", "offline", "none", "null"].includes(normalized.toLowerCase())) return undefined;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

export function formatValue(value, unavailable = "—") {
  const normalized = String(value ?? "").toLowerCase();
  if (
    value === undefined
    || value === null
    || normalized === "unknown"
    || normalized === "unavailable"
    || normalized === "offline"
  ) return unavailable;
  return value;
}

export function normalizeUnit(unit) {
  return String(unit || "").trim().toLowerCase();
}

export function isEnergyUnit(unit) {
  return ["wh", "kwh", "mwh"].includes(normalizeUnit(unit));
}

export function isPowerUnit(unit) {
  return ["w", "kw", "mw"].includes(normalizeUnit(unit));
}

export function valueAsWatts(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === "kw") return numericValue * 1000;
  if (normalizedUnit === "mw") return numericValue * 1000000;
  return numericValue;
}

export function valueAsVolts(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === "kv") return numericValue * 1000;
  if (normalizedUnit === "mv") return numericValue / 1000;
  return numericValue;
}

export function valueAsKwh(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === "wh") return numericValue / 1000;
  if (normalizedUnit === "mwh") return numericValue * 1000;
  return numericValue;
}

export function formatWithUnit(rawValue, unit, unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  if (unit === undefined || unit === null || String(unit).trim() === "") return value;
  return `${value} ${unit}`;
}

export function formatVoltageValue(rawValue, entityUnit = "V", unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  const volts = valueAsVolts(rawValue, entityUnit);
  if (!Number.isFinite(volts)) return entityUnit ? `${value} ${entityUnit}` : String(value);
  const decimals = Math.abs(volts) >= 100 || Number.isInteger(volts) ? 0 : 1;
  return `${volts.toFixed(decimals)} V`;
}

export function formatEnergyValue(rawValue, entityUnit, targetUnit = "kWh", unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  const normalizedTargetUnit = normalizeUnit(targetUnit);
  if (normalizedTargetUnit === "kwh") {
    const kwhValue = valueAsKwh(rawValue, entityUnit);
    if (kwhValue !== undefined) return `${kwhValue.toFixed(2)} kWh`;
  }
  return `${value} ${targetUnit || entityUnit || "kWh"}`;
}

export function formatPowerValue(rawValue, unit, entityUnit, { powerDisplayMode = "auto_kw", unavailable = "—" } = {}) {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;

  const normalizedUnit = normalizeUnit(unit);
  const normalizedEntityUnit = normalizeUnit(entityUnit);

  if (isEnergyUnit(normalizedEntityUnit)) {
    if (!unit || normalizedUnit === "auto" || isPowerUnit(normalizedUnit)) {
      return formatEnergyValue(rawValue, entityUnit, "kWh", unavailable);
    }
    if (isEnergyUnit(normalizedUnit)) return formatEnergyValue(rawValue, entityUnit, unit, unavailable);
  }

  if (normalizedUnit === "kwh") return formatEnergyValue(rawValue, entityUnit, "kWh", unavailable);
  if (normalizedUnit === "w") {
    const wattValue = valueAsWatts(rawValue, entityUnit);
    return `${wattValue === undefined ? value : wattValue.toFixed(0)} W`;
  }
  if (normalizedUnit === "kw") {
    const wattValue = valueAsWatts(rawValue, entityUnit);
    if (wattValue === undefined) return `${value} kW`;
    return `${(wattValue / 1000).toFixed(2)} kW`;
  }
  if (unit && normalizedUnit !== "auto") return `${value} ${unit}`;

  const numericValue = isPowerUnit(normalizedEntityUnit)
    ? valueAsWatts(rawValue, entityUnit)
    : Number(rawValue);
  if (!Number.isFinite(numericValue)) return `${value} W`;

  if (powerDisplayMode === "auto_kw" && Math.abs(numericValue) >= 1000) {
    return `${(numericValue / 1000).toFixed(2)} kW`;
  }

  return `${numericValue.toFixed(0)} W`;
}

export function formatDurationMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const rounded = Math.max(1, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const restMinutes = rounded % 60;
  if (hours <= 0) return `${restMinutes}min`;
  if (restMinutes <= 0) return `${hours}h`;
  return `${hours}h ${restMinutes}m`;
}

export function formatDurationSeconds(seconds) {
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

export function formatRemainingChargeTimeValue(rawValue, entityUnit = "") {
  const raw = String(rawValue ?? "").trim();
  const normalized = raw.toLowerCase();
  if (!normalized || ["unknown", "unavailable", "none", "null", "offline"].includes(normalized)) return "";

  const durationMatch = normalized.match(/^(\d{1,3}):([0-5]\d)(?::([0-5]\d))?$/);
  if (durationMatch) {
    const first = Number(durationMatch[1]);
    const second = Number(durationMatch[2]);
    const third = durationMatch[3] !== undefined ? Number(durationMatch[3]) : undefined;
    const minutes = third === undefined ? first * 60 + second : first * 60 + second + third / 60;
    return formatDurationMinutes(minutes);
  }

  if (/[a-z]{3,}:\/\//i.test(raw) || /\d{4}-\d{2}-\d{2}/.test(raw)) {
    const timestamp = Date.parse(raw);
    const minutes = (timestamp - Date.now()) / 60000;
    const formatted = formatDurationMinutes(minutes);
    if (formatted) return formatted;
  }

  const numericValue = Number(raw.replace(",", "."));
  if (Number.isFinite(numericValue)) {
    const unit = normalizeUnit(entityUnit);
    if (unit.includes("h") || unit.includes("std") || unit.includes("hour") || unit.includes("stunde")) return formatDurationMinutes(numericValue * 60);
    if (unit.includes("min") || unit === "m") return formatDurationMinutes(numericValue);
    if (unit.includes("s") && !unit.includes("stunden")) return formatDurationMinutes(numericValue / 60);
    return numericValue > 24 ? formatDurationMinutes(numericValue) : formatDurationMinutes(numericValue * 60);
  }

  return raw;
}
