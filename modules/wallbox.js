export const WALLBOX_POWER_KEYS = Object.freeze(["wallbox_power", "wallbox2_power"]);

const UNAVAILABLE_VALUES = Object.freeze(["unknown", "unavailable", "none", "null", "offline"]);

const WALLBOX_ENTITY_KEYS = Object.freeze({
  wallbox_power: Object.freeze({
    phase: "wallbox_phase",
    phaseAction: "wallbox_phase_action",
    phaseRemaining: "wallbox_phase_remaining",
    soc: "wallbox_soc",
    maxSoc: "wallbox_max_soc",
    connected: "wallbox_connected",
    chargingEnabled: "wallbox_charging_enabled",
    remainingTime: "wallbox_remaining_time",
  }),
  wallbox2_power: Object.freeze({
    phase: "wallbox2_phase",
    phaseAction: "wallbox2_phase_action",
    phaseRemaining: "wallbox2_phase_remaining",
    soc: "wallbox2_soc",
    maxSoc: "wallbox2_max_soc",
    connected: "wallbox2_connected",
    chargingEnabled: "wallbox2_charging_enabled",
    remainingTime: "wallbox2_remaining_time",
  }),
});

const WALLBOX_ENTITY_ALIASES = Object.freeze({
  phase: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_phase", "wallbox_phases", "wallbox_power_phase"]),
    wallbox2_power: Object.freeze(["wallbox2_phase", "wallbox2_phases", "wallbox2_power_phase"]),
  }),
  phaseAction: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_phase_action", "wallbox_phase_action_value", "wallbox_power_phase_action"]),
    wallbox2_power: Object.freeze(["wallbox2_phase_action", "wallbox2_phase_action_value", "wallbox2_power_phase_action"]),
  }),
  phaseRemaining: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_phase_remaining", "wallbox_phase_remaining_seconds", "wallbox_power_phase_remaining"]),
    wallbox2_power: Object.freeze(["wallbox2_phase_remaining", "wallbox2_phase_remaining_seconds", "wallbox2_power_phase_remaining"]),
  }),
  soc: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_soc", "wallbox_vehicle_soc", "wallbox_car_soc", "wallbox_power_soc"]),
    wallbox2_power: Object.freeze(["wallbox2_soc", "wallbox2_vehicle_soc", "wallbox2_car_soc", "wallbox2_power_soc"]),
  }),
  maxSoc: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_max_soc", "wallbox_target_soc", "wallbox_soc_limit", "wallbox_charge_limit", "wallbox_vehicle_max_soc", "wallbox_car_max_soc"]),
    wallbox2_power: Object.freeze(["wallbox2_max_soc", "wallbox2_target_soc", "wallbox2_soc_limit", "wallbox2_charge_limit", "wallbox2_vehicle_max_soc", "wallbox2_car_max_soc"]),
  }),
  connected: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_connected", "wallbox_plugged_in", "wallbox_vehicle_connected", "wallbox_car_connected", "wallbox_cable_connected"]),
    wallbox2_power: Object.freeze(["wallbox2_connected", "wallbox2_plugged_in", "wallbox2_vehicle_connected", "wallbox2_car_connected", "wallbox2_cable_connected"]),
  }),
  chargingEnabled: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_charging_enabled", "wallbox_charge_enabled", "wallbox_charging_allowed", "wallbox_enable_charging", "wallbox_charger_enabled"]),
    wallbox2_power: Object.freeze(["wallbox2_charging_enabled", "wallbox2_charge_enabled", "wallbox2_charging_allowed", "wallbox2_enable_charging", "wallbox2_charger_enabled"]),
  }),
  remainingTime: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_remaining_time", "wallbox_charge_time", "wallbox_charging_time_left", "wallbox_power_remaining_time"]),
    wallbox2_power: Object.freeze(["wallbox2_remaining_time", "wallbox2_charge_time", "wallbox2_charging_time_left", "wallbox2_power_remaining_time"]),
  }),
});

function wallboxMetricKey(metric) {
  return typeof metric === "string" ? metric : metric?.key || "";
}

function normalizedWallboxText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isUnavailableWallboxValue(value) {
  const normalized = normalizedWallboxText(value);
  return !normalized || UNAVAILABLE_VALUES.includes(normalized);
}

export function adjacentWallboxPosition(basePosition = {}) {
  const baseLeft = Number(basePosition.left);
  const baseTop = Number(basePosition.top);
  const left = Number.isFinite(baseLeft) ? baseLeft : 50;
  const top = Number.isFinite(baseTop) ? baseTop : 50;
  const direction = left > 84 ? -1 : 1;
  return {
    left: Math.min(96, Math.max(4, left + direction * 9)),
    top: Math.min(96, Math.max(4, top)),
  };
}

export function wallboxEntityKey(metric, kind) {
  return WALLBOX_ENTITY_KEYS[wallboxMetricKey(metric)]?.[kind] || "";
}

export function wallboxEntityId(config = {}, metric, kind) {
  const key = wallboxMetricKey(metric);
  const aliases = WALLBOX_ENTITY_ALIASES[kind]?.[key] || [];
  return aliases.map((alias) => config.entities?.[alias]).find(Boolean) || "";
}

export function wallboxPhaseEntityKey(metric) {
  return wallboxEntityKey(metric, "phase");
}

export function wallboxPhaseEntityId(config, metric) {
  return wallboxEntityId(config, metric, "phase");
}

export function wallboxPhaseActionEntityKey(metric) {
  return wallboxEntityKey(metric, "phaseAction");
}

export function wallboxPhaseActionEntityId(config, metric) {
  return wallboxEntityId(config, metric, "phaseAction");
}

export function wallboxPhaseRemainingEntityKey(metric) {
  return wallboxEntityKey(metric, "phaseRemaining");
}

export function wallboxPhaseRemainingEntityId(config, metric) {
  return wallboxEntityId(config, metric, "phaseRemaining");
}

export function wallboxSocEntityKey(metric) {
  return wallboxEntityKey(metric, "soc");
}

export function wallboxSocEntityId(config, metric) {
  return wallboxEntityId(config, metric, "soc");
}

export function wallboxMaxSocEntityKey(metric) {
  return wallboxEntityKey(metric, "maxSoc");
}

export function wallboxMaxSocEntityId(config, metric) {
  return wallboxEntityId(config, metric, "maxSoc");
}

export function wallboxConnectedEntityKey(metric) {
  return wallboxEntityKey(metric, "connected");
}

export function wallboxConnectedEntityId(config, metric) {
  return wallboxEntityId(config, metric, "connected");
}

export function wallboxChargingEnabledEntityKey(metric) {
  return wallboxEntityKey(metric, "chargingEnabled");
}

export function wallboxChargingEnabledEntityId(config, metric) {
  return wallboxEntityId(config, metric, "chargingEnabled");
}

export function wallboxRemainingTimeEntityKey(metric) {
  return wallboxEntityKey(metric, "remainingTime");
}

export function wallboxRemainingTimeEntityId(config, metric) {
  return wallboxEntityId(config, metric, "remainingTime");
}

export function numericPercentValue(rawValue) {
  if (isUnavailableWallboxValue(rawValue)) return undefined;
  const numericValue = Number(String(rawValue).replace(",", ".").replace("%", ""));
  if (!Number.isFinite(numericValue)) return undefined;
  return Math.max(0, Math.min(100, numericValue));
}

export function wallboxPhaseLabel(rawValue, translate) {
  const normalized = normalizedWallboxText(rawValue);
  if (isUnavailableWallboxValue(rawValue)) return "";
  if (["auto", "automatic", "automatisch"].includes(normalized)) {
    return translate?.("phase.auto", {}, "Auto") || "Auto";
  }
  const numberMatch = normalized.match(/\b([123])\b/) || normalized.match(/^([123])\s*(?:p|phase|phasen|fazy|fases)?$/);
  const phaseCount = numberMatch ? Number(numberMatch[1]) : Number(normalized);
  if (phaseCount === 1) return translate?.("phase.one", {}, "1 phase") || "1 phase";
  if (phaseCount === 2 || phaseCount === 3) {
    return translate?.("phase.many", { count: phaseCount }, `${phaseCount} phases`) || `${phaseCount} phases`;
  }
  return String(rawValue).trim();
}

export function stateAsBoolean(rawValue) {
  const normalized = String(rawValue ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized || UNAVAILABLE_VALUES.includes(normalized)) return undefined;
  if (["on", "true", "1", "yes", "ja", "connected", "plugged", "plugged_in", "home", "enabled", "active", "ready", "verbunden", "eingesteckt", "angeschlossen", "freigegeben", "aktiviert"].includes(normalized)) return true;
  if (["off", "false", "0", "no", "nein", "disconnected", "unplugged", "not_connected", "away", "disabled", "inactive", "nicht_verbunden", "ausgesteckt", "getrennt", "gesperrt", "deaktiviert"].includes(normalized)) return false;
  return undefined;
}

export function wallboxBooleanEntityState(entityId, { getValue, getState } = {}) {
  if (!entityId) return undefined;
  const direct = stateAsBoolean(getValue?.(entityId));
  if (direct !== undefined) return direct;
  return stateAsBoolean(getState?.(entityId)?.state);
}

export function wallboxSocLabel(rawValue, entityUnit = "") {
  if (isUnavailableWallboxValue(rawValue)) return "";
  const numericValue = Number(String(rawValue).replace(",", "."));
  const value = Number.isFinite(numericValue)
    ? `${Math.round(Math.max(0, Math.min(100, numericValue)))}%`
    : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
  return `Auto ${value}`;
}

export function wallboxPhaseActionText(rawValue) {
  const raw = String(rawValue ?? "").trim();
  const normalized = raw.toLowerCase();
  if (!normalized || [...UNAVAILABLE_VALUES, "-keine-", "keine", "no action"].includes(normalized)) return "";
  return raw;
}

export function wallboxPhaseRemainingSeconds(rawValue, entityUnit = "", numericParser = Number) {
  const value = typeof numericParser === "function" ? numericParser(rawValue) : Number(rawValue);
  if (!Number.isFinite(value)) return undefined;
  const unit = String(entityUnit || "").trim().toLowerCase();
  if (unit.includes("h") || unit.includes("std") || unit.includes("hour") || unit.includes("stunde")) return value * 3600;
  if (unit.includes("min") || unit === "m") return value * 60;
  return value;
}

export function wallboxPhaseActionInfo({
  action,
  seconds,
  actionEntityId = "",
  remainingEntityId = "",
  formatDurationSeconds,
  translate,
} = {}) {
  if (!action) return undefined;
  const duration = Number.isFinite(seconds) && typeof formatDurationSeconds === "function"
    ? formatDurationSeconds(seconds)
    : "";
  return {
    action,
    seconds,
    duration,
    actionEntityId,
    remainingEntityId,
    label: duration
      ? translate?.("value.phaseChangeIn", { action, duration }, `${action} in ${duration}`) || `${action} in ${duration}`
      : action,
  };
}

export function wallboxIsCharging(metric, {
  config = {},
  getValue,
  getUnit,
  valueAsWatts,
  clampNumber,
} = {}) {
  const entityId = config.entities?.[wallboxMetricKey(metric)];
  if (!entityId) return false;
  const watts = valueAsWatts?.(getValue?.(entityId), getUnit?.(entityId));
  const threshold = clampNumber?.(config.wallbox_charging_threshold, 25, 0, 1000000) ?? 25;
  return Number.isFinite(watts) && watts > threshold;
}

export function wallboxRemainingTimeLabel({
  isCharging,
  rawValue,
  entityUnit = "",
  formatRemainingChargeTimeValue,
  translate,
} = {}) {
  if (!isCharging) return "";
  const value = formatRemainingChargeTimeValue?.(rawValue, entityUnit);
  return value ? translate?.("value.remainingChargeTime", { value }, `${value} left`) || `${value} left` : "";
}

export function wallboxAdvisorDetails(keys = WALLBOX_POWER_KEYS, {
  metricForKey,
  entityForKey,
  positiveWattsForKey,
  socEntityIdForMetric,
  maxSocEntityIdForMetric,
  percentFromEntity,
  entityLastChangedMs,
  trackedConditionMinutes,
  metricLabel,
  phaseActionInfoForMetric,
  connectedStateForMetric,
  chargingEnabledStateForMetric,
} = {}) {
  return keys
    .map((key) => {
      const metric = metricForKey?.(key) || { key, label: key, unit: "power" };
      const entityId = entityForKey?.(key) || "";
      const watts = positiveWattsForKey?.(key);
      const socEntityId = socEntityIdForMetric?.(metric) || "";
      const maxSocEntityId = maxSocEntityIdForMetric?.(metric) || "";
      const socPercent = percentFromEntity?.(socEntityId);
      const maxSocPercent = percentFromEntity?.(maxSocEntityId);
      const socLastChangedMs = entityLastChangedMs?.(socEntityId);
      const socAbove80Minutes = trackedConditionMinutes?.(
        `${key}:soc-above-80`,
        Number.isFinite(socPercent) && socPercent > 80,
        socLastChangedMs,
      );
      const socAbove90Minutes = trackedConditionMinutes?.(
        `${key}:soc-above-90`,
        Number.isFinite(socPercent) && socPercent > 90,
        socLastChangedMs,
      );
      return {
        key,
        metric,
        entityId,
        socEntityId,
        maxSocEntityId,
        hasPowerEntity: Boolean(entityId),
        label: metricLabel?.(metric) || metric.label || key,
        watts: Number.isFinite(watts) ? watts : 0,
        phaseAction: phaseActionInfoForMetric?.(metric),
        socPercent,
        maxSocPercent,
        socAbove80Minutes,
        socAbove90Minutes,
        targetReached: Number.isFinite(socPercent) && Number.isFinite(maxSocPercent) && socPercent >= maxSocPercent - 0.5,
        connected: connectedStateForMetric?.(metric),
        chargingEnabled: chargingEnabledStateForMetric?.(metric),
      };
    })
    .filter((wallbox) => wallbox.hasPowerEntity);
}
