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

const CUBIC_METERS_PER_US_GALLON = 0.003785411784;
const MILLIMETERS_PER_INCH = 25.4;
const LITERS_PER_US_GALLON = 3.785411784;
const KILOMETERS_PER_MILE = 1.609344;
const PSI_PER_BAR = 14.503773773;

export function isEnergyUnit(unit) {
  return ["wh", "kwh", "mwh"].includes(normalizeUnit(unit));
}

export function isPowerUnit(unit) {
  return ["w", "kw", "mw"].includes(normalizeUnit(unit));
}

function normalizeVolumeUnit(unit) {
  return normalizeUnit(unit)
    .replace(/[\s._-]+/g, "")
    .replace(/³/g, "3");
}

export function isVolumeUnit(unit) {
  return ["m3", "cbm", "l", "liter", "litre", "liters", "litres", "ml", "gal", "gallon", "gallons", "usgal", "usgallon", "usgallons"].includes(normalizeVolumeUnit(unit));
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

export function valueAsCelsius(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeUnit(unit).replace(/\s+/g, "");
  if (["°f", "f", "fahrenheit"].includes(normalizedUnit)) return (numericValue - 32) * 5 / 9;
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

export function valueAsMillimeters(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeUnit(unit).replace(/[\s._-]+/g, "");
  if (["in", "inch", "inches"].includes(normalizedUnit)) return numericValue * MILLIMETERS_PER_INCH;
  if (["cm", "centimeter", "centimeters", "centimetre", "centimetres"].includes(normalizedUnit)) return numericValue * 10;
  if (["m", "meter", "meters", "metre", "metres"].includes(normalizedUnit)) return numericValue * 1000;
  return numericValue;
}

export function valueAsBar(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeUnit(unit).replace(/[\s._-]+/g, "");
  if (["psi", "lb/in2", "lbin2"].includes(normalizedUnit)) return numericValue / PSI_PER_BAR;
  if (["pa", "pascal", "pascals"].includes(normalizedUnit)) return numericValue / 100000;
  if (["kpa", "kilopascal", "kilopascals"].includes(normalizedUnit)) return numericValue / 100;
  if (["hpa", "mbar", "millibar", "millibars"].includes(normalizedUnit)) return numericValue / 1000;
  return numericValue;
}

export function valueAsLitersPerMinute(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeUnit(unit).replace(/[\s._-]+/g, "");
  if (["gal/min", "gallon/min", "gallons/min", "gpm", "galmin", "gallonmin", "gallonsmin", "galpermin", "gallonpermin", "gallonspermin", "gal/minute"].includes(normalizedUnit)) return numericValue * LITERS_PER_US_GALLON;
  if (["m3/h", "cbm/h", "m3perhour", "m3hour"].includes(normalizedUnit)) return numericValue * 1000 / 60;
  return numericValue;
}

export function valueAsKilometers(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeUnit(unit).replace(/[\s._-]+/g, "");
  if (["mi", "mile", "miles"].includes(normalizedUnit)) return numericValue * KILOMETERS_PER_MILE;
  if (["m", "meter", "meters", "metre", "metres"].includes(normalizedUnit)) return numericValue / 1000;
  return numericValue;
}

export function valueAsCubicMeters(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeVolumeUnit(unit);
  if (["l", "liter", "litre", "liters", "litres"].includes(normalizedUnit)) return numericValue / 1000;
  if (normalizedUnit === "ml") return numericValue / 1000000;
  if (["gal", "gallon", "gallons", "usgal", "usgallon", "usgallons"].includes(normalizedUnit)) return numericValue * CUBIC_METERS_PER_US_GALLON;
  return numericValue;
}

export function valueAsVolumeUnit(value, entityUnit, targetUnit = "m³") {
  const normalizedTargetUnit = normalizeVolumeUnit(targetUnit);
  if (!targetUnit || normalizedTargetUnit === "auto") return numericState(value);
  const cubicMeters = valueAsCubicMeters(value, entityUnit);
  if (!Number.isFinite(cubicMeters)) return undefined;
  if (["m3", "cbm"].includes(normalizedTargetUnit)) return cubicMeters;
  if (["l", "liter", "litre", "liters", "litres"].includes(normalizedTargetUnit)) return cubicMeters * 1000;
  if (normalizedTargetUnit === "ml") return cubicMeters * 1000000;
  if (["gal", "gallon", "gallons", "usgal", "usgallon", "usgallons"].includes(normalizedTargetUnit)) return cubicMeters / CUBIC_METERS_PER_US_GALLON;
  return numericState(value);
}

function formatTrimmedNumber(value, decimals) {
  if (!Number.isFinite(value)) return undefined;
  return value
    .toFixed(decimals)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
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

export function formatTemperatureValue(rawValue, entityUnit = "°C", targetUnit = "°C", unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  const celsius = valueAsCelsius(rawValue, entityUnit);
  if (!Number.isFinite(celsius)) return `${value} ${targetUnit || entityUnit || "°C"}`;
  const normalizedTargetUnit = normalizeUnit(targetUnit).replace(/\s+/g, "");
  if (["°f", "f", "fahrenheit"].includes(normalizedTargetUnit)) return `${(celsius * 9 / 5 + 32).toFixed(1)} °F`;
  return `${celsius.toFixed(1)} °C`;
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

export function formatPrecipitationValue(rawValue, entityUnit = "mm", targetUnit = "mm", unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  const millimeters = valueAsMillimeters(rawValue, entityUnit);
  if (!Number.isFinite(millimeters)) return `${value} ${targetUnit || entityUnit || "mm"}`;
  const normalizedTargetUnit = normalizeUnit(targetUnit).replace(/[\s._-]+/g, "");
  if (["in", "inch", "inches"].includes(normalizedTargetUnit)) {
    const inches = millimeters / MILLIMETERS_PER_INCH;
    return `${formatTrimmedNumber(inches, Math.abs(inches) >= 10 ? 1 : 2)} in`;
  }
  return `${formatTrimmedNumber(millimeters, Math.abs(millimeters) >= 10 ? 1 : 2)} mm`;
}

export function formatPressureValue(rawValue, entityUnit = "bar", targetUnit = "bar", unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  const bar = valueAsBar(rawValue, entityUnit);
  if (!Number.isFinite(bar)) return `${value} ${targetUnit || entityUnit || "bar"}`;
  const normalizedTargetUnit = normalizeUnit(targetUnit).replace(/[\s._-]+/g, "");
  if (normalizedTargetUnit === "psi") return `${formatTrimmedNumber(bar * PSI_PER_BAR, 1)} psi`;
  if (["hpa", "mbar", "millibar", "millibars"].includes(normalizedTargetUnit)) return `${formatTrimmedNumber(bar * 1000, 0)} hPa`;
  return `${formatTrimmedNumber(bar, Math.abs(bar) >= 10 ? 1 : 2)} bar`;
}

export function formatFlowValue(rawValue, entityUnit = "L/min", targetUnit = "L/min", unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  const litersPerMinute = valueAsLitersPerMinute(rawValue, entityUnit);
  if (!Number.isFinite(litersPerMinute)) return `${value} ${targetUnit || entityUnit || "L/min"}`;
  const normalizedTargetUnit = normalizeUnit(targetUnit).replace(/[\s._-]+/g, "");
  if (["gal/min", "gallon/min", "gallons/min", "gpm", "galmin", "gallonmin", "gallonsmin", "galpermin", "gallonpermin", "gallonspermin", "gal/minute"].includes(normalizedTargetUnit)) {
    const gallonsPerMinute = litersPerMinute / LITERS_PER_US_GALLON;
    return `${formatTrimmedNumber(gallonsPerMinute, Math.abs(gallonsPerMinute) >= 10 ? 1 : 2)} gal/min`;
  }
  return `${formatTrimmedNumber(litersPerMinute, Math.abs(litersPerMinute) >= 10 ? 1 : 2)} L/min`;
}

export function formatDistanceValue(rawValue, entityUnit = "km", targetUnit = "km", unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  const kilometers = valueAsKilometers(rawValue, entityUnit);
  if (!Number.isFinite(kilometers)) return `${value} ${targetUnit || entityUnit || "km"}`;
  const normalizedTargetUnit = normalizeUnit(targetUnit).replace(/[\s._-]+/g, "");
  if (["mi", "mile", "miles"].includes(normalizedTargetUnit)) {
    const miles = kilometers / KILOMETERS_PER_MILE;
    return `${formatTrimmedNumber(miles, Math.abs(miles) >= 100 ? 0 : 1)} mi`;
  }
  return `${formatTrimmedNumber(kilometers, Math.abs(kilometers) >= 100 ? 0 : 1)} km`;
}

export function formatVolumeValue(rawValue, entityUnit, targetUnit = "m³", unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  const normalizedTargetUnit = normalizeVolumeUnit(targetUnit);
  const cubicMeters = valueAsCubicMeters(rawValue, entityUnit);

  if (["l", "liter", "litre", "liters", "litres"].includes(normalizedTargetUnit)) {
    const liters = valueAsVolumeUnit(rawValue, entityUnit, "L");
    if (liters !== undefined) return `${formatTrimmedNumber(liters, Math.abs(liters) >= 1000 ? 0 : 1)} L`;
    return `${value} L`;
  }

  if (!targetUnit || normalizedTargetUnit === "auto") {
    const displayUnit = entityUnit || "m³";
    return `${value} ${displayUnit}`;
  }

  if (["m3", "cbm"].includes(normalizedTargetUnit)) {
    if (cubicMeters !== undefined) {
      const decimals = Math.abs(cubicMeters) >= 100 ? 1 : 3;
      return `${formatTrimmedNumber(cubicMeters, decimals)} m³`;
    }
    return `${value} m³`;
  }

  if (["gal", "gallon", "gallons", "usgal", "usgallon", "usgallons"].includes(normalizedTargetUnit)) {
    const gallons = valueAsVolumeUnit(rawValue, entityUnit, "gal");
    if (gallons !== undefined) {
      const absGallons = Math.abs(gallons);
      const decimals = absGallons >= 1000 ? 0 : absGallons >= 100 ? 1 : 2;
      return `${formatTrimmedNumber(gallons, decimals)} gal`;
    }
    return `${value} gal`;
  }

  return `${value} ${targetUnit || entityUnit || "m³"}`;
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
