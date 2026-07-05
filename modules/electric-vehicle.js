export const DEFAULT_ELECTRIC_VEHICLE_IMAGE = "images/car_image.png";

export const ELECTRIC_VEHICLE_HERO_BADGE_POSITION_KEYS = Object.freeze({
  mode: "electric_vehicle_mode",
  status: "electric_vehicle_status",
  charge_power: "electric_vehicle_charge_power",
  charge_current: "electric_vehicle_charge_current",
  session_energy: "electric_vehicle_session_energy",
  grid_power: "electric_vehicle_grid_power",
  home_battery_soc: "electric_vehicle_home_battery_soc",
  session_solar_percentage: "electric_vehicle_session_solar_percentage",
  vehicle_soc: "electric_vehicle_vehicle_soc",
  charge_remaining_duration: "electric_vehicle_charge_remaining_duration",
});

export const ELECTRIC_VEHICLE_HERO_BADGE_POSITIONS = Object.freeze({
  mode: Object.freeze({ left: 13, top: 11 }),
  status: Object.freeze({ left: 87, top: 12 }),
  charge_power: Object.freeze({ left: 87, top: 30 }),
  charge_current: Object.freeze({ left: 87, top: 48 }),
  session_energy: Object.freeze({ left: 87, top: 66 }),
  grid_power: Object.freeze({ left: 14, top: 84 }),
  home_battery_soc: Object.freeze({ left: 36, top: 84 }),
  session_solar_percentage: Object.freeze({ left: 57, top: 84 }),
  vehicle_soc: Object.freeze({ left: 13, top: 23 }),
  charge_remaining_duration: Object.freeze({ left: 84, top: 23 }),
});

export const ELECTRIC_VEHICLE_ENTITY_DEFINITIONS = Object.freeze([
  Object.freeze({ key: "status", labelKey: "ev.status", label: "Status", group: "state", kind: "status", aliases: ["ev_status", "loadpoint_status", "wallbox_status"] }),
  Object.freeze({ key: "pv_status_text", labelKey: "ev.pvStatusText", label: "PV status text", group: "state", kind: "text", evccDomain: "sensor", evccSuffix: "pv_action_value", aliases: ["ev_pv_status_text", "evcc_pv_status_text", "evcc_pv_action_value", "pv_action_value", "loadpoint_pv_action_value", "wallbox_pv_action_value"] }),
  Object.freeze({ key: "mode", labelKey: "ev.mode", label: "Mode", group: "state", kind: "mode", evccDomain: "select", evccSuffix: "mode", aliases: ["ev_mode", "loadpoint_mode", "wallbox_mode"] }),
  Object.freeze({ key: "mode_control", labelKey: "ev.modeControl", label: "Lademodus", group: "controls", kind: "mode", control: true, evccDomain: "select", evccSuffix: "mode", aliases: ["ev_mode_control", "evcc_mode", "evcc_mode_select", "charge_mode", "charge_mode_select", "loadpoint_mode_select", "wallbox_mode_select"] }),
  Object.freeze({ key: "connected", labelKey: "ev.connected", label: "Connected", group: "state", kind: "boolean", wallboxFallback: "connected", evccDomain: "binary_sensor", evccSuffix: "connected", aliases: ["ev_connected", "vehicle_connected", "wallbox_connected"] }),
  Object.freeze({ key: "charging", labelKey: "ev.charging", label: "Charging", group: "state", kind: "boolean", evccDomain: "binary_sensor", evccSuffix: "charging", aliases: ["ev_charging", "vehicle_charging", "wallbox_charging"] }),
  Object.freeze({ key: "enabled", labelKey: "ev.enabled", label: "Enabled", group: "state", kind: "boolean", wallboxFallback: "chargingEnabled", evccDomain: "binary_sensor", evccSuffix: "enabled", aliases: ["ev_enabled", "loadpoint_enabled", "wallbox_enabled", "wallbox_charging_enabled"] }),
  Object.freeze({ key: "vehicle_title", labelKey: "ev.vehicleTitle", label: "Vehicle", group: "vehicle", kind: "text", attr: "vehicle.name", attrFallbacks: ["vehicle.originObject.title", "vehicle.title"], aliases: ["ev_vehicle_title", "vehicle_title", "wallbox_vehicle_title"] }),
  Object.freeze({ key: "vehicle_name", labelKey: "ev.vehicleName", label: "Vehicle name", group: "vehicle", kind: "text", attr: "vehicle.name", attrFallbacks: ["vehicle.originObject.title", "vehicle.title"], evccDomain: "select", evccSuffix: "vehicle_name", aliases: ["ev_vehicle_name", "vehicle_name", "wallbox_vehicle_name"] }),
  Object.freeze({ key: "vehicle_soc", labelKey: "ev.vehicleSoc", label: "Vehicle SoC", group: "vehicle", kind: "percent", wallboxFallback: "soc", aliases: ["ev_vehicle_soc", "vehicle_soc", "wallbox_soc"] }),
  Object.freeze({ key: "limit_soc", labelKey: "ev.limitSoc", label: "Target SoC", group: "vehicle", kind: "percent", wallboxFallback: "maxSoc", evccDomain: "number", evccSuffix: "limit_soc", aliases: ["ev_limit_soc", "vehicle_limit_soc", "target_soc", "wallbox_max_soc", "wallbox_target_soc"] }),
  Object.freeze({ key: "min_soc", labelKey: "ev.minSoc", label: "Minimum SoC", group: "vehicle", kind: "percent", aliases: ["ev_min_soc", "vehicle_min_soc", "wallbox_min_soc"] }),
  Object.freeze({ key: "vehicle_range", labelKey: "ev.vehicleRange", label: "Range", group: "vehicle", kind: "distance", aliases: ["ev_vehicle_range", "vehicle_range", "wallbox_vehicle_range"] }),
  Object.freeze({ key: "charge_power", labelKey: "ev.chargePower", label: "Charging power", group: "charging", kind: "power", wallboxFallback: "power", evccDomain: "sensor", evccSuffix: "charge_power", aliases: ["ev_charge_power", "charge_power", "loadpoint_charge_power", "wallbox_power"] }),
  Object.freeze({ key: "charge_current", labelKey: "ev.chargeCurrent", label: "Charging current", group: "charging", kind: "current", evccDomain: "sensor", evccSuffix: "charge_current", aliases: ["ev_charge_current", "charge_current", "loadpoint_charge_current", "wallbox_current"] }),
  Object.freeze({ key: "charged_energy", labelKey: "ev.chargedEnergy", label: "Charged energy", group: "charging", kind: "energy", aliases: ["ev_charged_energy", "charged_energy", "loadpoint_charged_energy"] }),
  Object.freeze({ key: "session_energy", labelKey: "ev.sessionEnergy", label: "Session energy", group: "charging", kind: "energy", evccDomain: "sensor", evccSuffix: "session_energy", aliases: ["ev_session_energy", "session_energy", "wallbox_session_energy"] }),
  Object.freeze({ key: "session_solar_percentage", labelKey: "ev.sessionSolarPercentage", label: "Session solar", group: "charging", kind: "percent", evccDomain: "sensor", evccSuffix: "session_solar_percentage", aliases: ["ev_session_solar_percentage", "session_solar_percentage", "session_solar_share"] }),
  Object.freeze({ key: "charge_total_import", labelKey: "ev.chargeTotalImport", label: "Charge meter", group: "charging", kind: "energy", aliases: ["ev_charge_total_import", "charge_total_import", "wallbox_energy_total"] }),
  Object.freeze({ key: "charge_duration", labelKey: "ev.chargeDuration", label: "Charge duration", group: "charging", kind: "duration", evccDomain: "sensor", evccSuffix: "charge_duration", aliases: ["ev_charge_duration", "charge_duration", "wallbox_charge_duration"] }),
  Object.freeze({ key: "charge_remaining_duration", labelKey: "ev.chargeRemainingDuration", label: "Remaining time", group: "charging", kind: "duration", wallboxFallback: "remainingTime", evccDomain: "sensor", evccSuffix: "charge_remaining_duration", aliases: ["ev_charge_remaining_duration", "remaining_time", "wallbox_remaining_time"] }),
  Object.freeze({ key: "charge_remaining_energy", labelKey: "ev.chargeRemainingEnergy", label: "Remaining energy", group: "charging", kind: "energy", evccDomain: "sensor", evccSuffix: "charge_remaining_energy", aliases: ["ev_charge_remaining_energy", "charge_remaining_energy"] }),
  Object.freeze({ key: "phases_active", labelKey: "ev.phasesActive", label: "Active phases", group: "limits", kind: "phases", wallboxFallback: "phase", evccDomain: "sensor", evccSuffix: "phases_active", aliases: ["ev_phases_active", "phases_active", "wallbox_phase"] }),
  Object.freeze({ key: "phases_configured", labelKey: "ev.phasesConfigured", label: "Configured phases", group: "limits", kind: "phases", evccDomain: "select", evccSuffix: "phases_configured", aliases: ["ev_phases_configured", "phases_configured", "wallbox_phases_configured"] }),
  Object.freeze({ key: "phase_action", labelKey: "ev.phaseAction", label: "Upcoming phase action", group: "limits", kind: "text", wallboxFallback: "phaseAction", aliases: ["ev_phase_action", "phase_action", "wallbox_phase_action"] }),
  Object.freeze({ key: "phase_remaining", labelKey: "ev.phaseRemaining", label: "Phase action remaining", group: "limits", kind: "duration", wallboxFallback: "phaseRemaining", aliases: ["ev_phase_remaining", "phase_remaining", "wallbox_phase_remaining"] }),
  Object.freeze({ key: "min_current", labelKey: "ev.minCurrent", label: "Minimum current", group: "limits", kind: "current", evccDomain: "select", evccSuffix: "min_current", aliases: ["ev_min_current", "min_current", "wallbox_min_current"] }),
  Object.freeze({ key: "max_current", labelKey: "ev.maxCurrent", label: "Maximum current", group: "limits", kind: "current", evccDomain: "select", evccSuffix: "max_current", aliases: ["ev_max_current", "max_current", "wallbox_max_current"] }),
  Object.freeze({ key: "limit_energy", labelKey: "ev.limitEnergy", label: "Energy limit", group: "limits", kind: "energy", evccDomain: "number", evccSuffix: "limit_energy", aliases: ["ev_limit_energy", "limit_energy", "wallbox_limit_energy"] }),
  Object.freeze({ key: "enable_threshold", labelKey: "ev.enableThreshold", label: "Enable threshold", group: "limits", kind: "power", evccDomain: "number", evccSuffix: "enable_threshold", aliases: ["ev_enable_threshold", "enable_threshold", "wallbox_enable_threshold"] }),
  Object.freeze({ key: "enable_delay", labelKey: "ev.enableDelay", label: "Enable delay", group: "limits", kind: "duration", evccDomain: "number", evccSuffix: "enable_delay", aliases: ["ev_enable_delay", "enable_delay", "wallbox_enable_delay"] }),
  Object.freeze({ key: "disable_threshold", labelKey: "ev.disableThreshold", label: "Disable threshold", group: "limits", kind: "power", evccDomain: "number", evccSuffix: "disable_threshold", aliases: ["ev_disable_threshold", "disable_threshold", "wallbox_disable_threshold"] }),
  Object.freeze({ key: "disable_delay", labelKey: "ev.disableDelay", label: "Disable delay", group: "limits", kind: "duration", evccDomain: "number", evccSuffix: "disable_delay", aliases: ["ev_disable_delay", "disable_delay", "wallbox_disable_delay"] }),
  Object.freeze({ key: "plan_active", labelKey: "ev.planActive", label: "Plan active", group: "planning", kind: "boolean", aliases: ["ev_plan_active", "plan_active", "wallbox_plan_active"] }),
  Object.freeze({ key: "smart_cost_active", labelKey: "ev.smartCostActive", label: "Smart cost active", group: "planning", kind: "boolean", aliases: ["ev_smart_cost_active", "smart_cost_active", "wallbox_smart_cost_active"] }),
  Object.freeze({ key: "effective_priority", labelKey: "ev.effectivePriority", label: "Effective priority", group: "planning", kind: "text", aliases: ["ev_effective_priority", "effective_priority", "wallbox_effective_priority"] }),
  Object.freeze({ key: "priority", labelKey: "ev.priority", label: "Priority", group: "planning", kind: "text", aliases: ["ev_priority", "wallbox_priority"] }),
  Object.freeze({ key: "battery_boost", labelKey: "ev.batteryBoost", label: "Battery boost", group: "planning", kind: "boolean", evccDomain: "switch", evccSuffix: "battery_boost", aliases: ["ev_battery_boost", "batteryboost", "battery_boost", "wallbox_battery_boost"] }),
  Object.freeze({ key: "battery_boost_limit", labelKey: "ev.batteryBoostLimit", label: "Battery boost limit", group: "planning", kind: "percent", aliases: ["ev_battery_boost_limit", "battery_boost_limit", "wallbox_battery_boost_limit"] }),
  Object.freeze({ key: "smart_cost_limit", labelKey: "ev.smartCostLimit", label: "Smart cost limit", group: "planning", kind: "text", aliases: ["ev_smart_cost_limit", "smart_cost_limit", "wallbox_smart_cost_limit"] }),
  Object.freeze({ key: "smart_feed_in_priority_limit", labelKey: "ev.smartFeedInPriorityLimit", label: "Feed-in priority limit", group: "planning", kind: "text", aliases: ["ev_smart_feed_in_priority_limit", "smart_feed_in_priority_limit", "wallbox_smart_feed_in_priority_limit"] }),
  Object.freeze({ key: "grid_power", labelKey: "ev.gridPower", label: "Grid", group: "site", kind: "grid_power", evccDomain: "sensor", evccSuffix: "grid_power", evccSite: true, aliases: ["ev_grid_power", "evcc_grid_power", "site_grid_power"] }),
  Object.freeze({ key: "pv_power", labelKey: "ev.pvPower", label: "PV power", group: "site", kind: "power", evccDomain: "sensor", evccSuffix: "pv_power", evccSite: true, aliases: ["ev_pv_power", "evcc_pv_power", "site_pv_power"] }),
  Object.freeze({ key: "home_power", labelKey: "ev.homePower", label: "Home load", group: "site", kind: "power", evccDomain: "sensor", evccSuffix: "home_power", evccSite: true, aliases: ["ev_home_power", "evcc_home_power", "site_home_power"] }),
  Object.freeze({ key: "home_battery_power", labelKey: "ev.homeBatteryPower", label: "House battery power", group: "site", kind: "power", evccDomain: "sensor", evccSuffix: "battery_power", evccSite: true, aliases: ["ev_home_battery_power", "home_battery_power", "evcc_battery_power"] }),
  Object.freeze({ key: "home_battery_soc", labelKey: "ev.homeBatterySoc", label: "House battery", group: "site", kind: "percent", evccDomain: "sensor", evccSuffix: "battery_soc", evccSite: true, aliases: ["ev_home_battery_soc", "home_battery_soc", "evcc_battery_soc"] }),
  Object.freeze({ key: "solar_forecast", labelKey: "ev.solarForecast", label: "Solar forecast", group: "site", kind: "power", evccDomain: "sensor", evccSuffix: "tariff_solar", evccSite: true, aliases: ["ev_solar_forecast", "solar_forecast", "evcc_tariff_solar"] }),
  Object.freeze({ key: "residual_power", labelKey: "ev.residualPower", label: "Feed-in buffer", group: "site", kind: "power", evccDomain: "number", evccSuffix: "residual_power", evccSite: true, aliases: ["ev_residual_power", "evcc_residual_power", "residual_power"] }),
  Object.freeze({ key: "priority_soc", labelKey: "ev.prioritySoc", label: "House priority until", group: "site", kind: "percent", evccDomain: "select", evccSuffix: "priority_soc", evccSite: true, aliases: ["ev_priority_soc", "evcc_priority_soc", "priority_soc"] }),
  Object.freeze({ key: "buffer_soc", labelKey: "ev.bufferSoc", label: "EV may use battery from", group: "site", kind: "percent", evccDomain: "select", evccSuffix: "buffer_soc", evccSite: true, aliases: ["ev_buffer_soc", "evcc_buffer_soc", "buffer_soc"] }),
  Object.freeze({ key: "buffer_start_soc", labelKey: "ev.bufferStartSoc", label: "EV starts from battery", group: "site", kind: "percent", evccDomain: "select", evccSuffix: "buffer_start_soc", evccSite: true, aliases: ["ev_buffer_start_soc", "evcc_buffer_start_soc", "buffer_start_soc"] }),
  Object.freeze({ key: "battery_discharge_control", labelKey: "ev.batteryDischargeControl", label: "Battery discharge control", group: "site", kind: "boolean", evccDomain: "switch", evccSuffix: "battery_discharge_control", evccSite: true, aliases: ["ev_battery_discharge_control", "evcc_battery_discharge_control", "battery_discharge_control"] }),
]);

const ELECTRIC_VEHICLE_GROUPS = Object.freeze([
  Object.freeze({ key: "controls", labelKey: "ev.groupControls", label: "Controls" }),
  Object.freeze({ key: "state", labelKey: "ev.groupState", label: "State" }),
  Object.freeze({ key: "vehicle", labelKey: "ev.groupVehicle", label: "Vehicle" }),
  Object.freeze({ key: "charging", labelKey: "ev.groupCharging", label: "Charging" }),
  Object.freeze({ key: "limits", labelKey: "ev.groupLimits", label: "Limits" }),
  Object.freeze({ key: "planning", labelKey: "ev.groupPlanning", label: "Planning" }),
  Object.freeze({ key: "site", labelKey: "ev.groupSite", label: "Site & battery" }),
]);

const ELECTRIC_VEHICLE_MODE_OPTIONS = Object.freeze([
  Object.freeze({ key: "off", serviceValue: "off", labelKey: "ev.modeOff", label: "Aus", aliases: ["off", "aus", "disabled", "deactivated", "stop", "stopped"] }),
  Object.freeze({ key: "pv", serviceValue: "pv", labelKey: "ev.modePv", label: "PV", aliases: ["pv", "solar", "sun", "ueberschuss", "uberschuss", "surplus"] }),
  Object.freeze({ key: "minpv", serviceValue: "minpv", labelKey: "ev.modeMinPv", label: "Min+PV", aliases: ["minpv", "min_pv", "min+pv", "minimum_pv", "minimum+pv", "minundpv", "min_and_pv"] }),
  Object.freeze({ key: "now", serviceValue: "now", labelKey: "ev.modeFast", label: "Schnell", aliases: ["now", "fast", "schnell", "quick", "boost", "sofort", "rapid"] }),
]);

const WALLBOX_ENTITY_FALLBACKS = Object.freeze({
  wallbox_power: Object.freeze({
    power: "wallbox_power",
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
    power: "wallbox2_power",
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

const UNAVAILABLE_ELECTRIC_VEHICLE_VALUES = Object.freeze(["unknown", "unavailable", "none", "null", "offline"]);
const ELECTRIC_VEHICLE_EMPTY_VALUE = "\u2014";

function normalizedElectricVehicleText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizedElectricVehicleModeToken(value) {
  return normalizedElectricVehicleText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "");
}

function isUnavailableElectricVehicleValue(value) {
  const normalized = normalizedElectricVehicleText(value);
  return !normalized || UNAVAILABLE_ELECTRIC_VEHICLE_VALUES.includes(normalized);
}

function electricVehicleEntityDomain(entityId = "") {
  return String(entityId || "").split(".")[0];
}

function normalizeElectricVehicleBadgeCoordinate(value, fallback = 50) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, number));
}

function normalizeElectricVehicleWallbox(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["2", "wallbox2", "wallbox_2", "wallbox2_power", "second", "zweite"].includes(normalized)) return "wallbox2_power";
  return "wallbox_power";
}

function normalizeElectricVehicleLoadpoint(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (["1", "2", "wallbox", "wallbox1", "wallbox2", "wallbox_2", "wallbox_power", "wallbox2_power"].includes(normalized.toLowerCase())) return "";
  return normalized
    .replace(/^evcc[_-]/i, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function normalizeElectricVehiclePrefix(value) {
  return String(value || "evcc")
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "evcc";
}

function normalizeElectricVehicleEntities(entities = {}) {
  const source = entities && typeof entities === "object" ? entities : {};
  return Object.fromEntries(
    ELECTRIC_VEHICLE_ENTITY_DEFINITIONS.map((definition) => [
      definition.key,
      String(source[definition.key] || definition.aliases?.map((alias) => source[alias]).find(Boolean) || "").trim(),
    ]),
  );
}

export function normalizeElectricVehicleConfig(config = {}) {
  const source = typeof config === "string"
    ? { image: config }
    : config && typeof config === "object"
      ? config
      : {};
  const loadpoint = normalizeElectricVehicleLoadpoint(source.evcc_loadpoint || source.loadpoint_slug || source.loadpoint_id || source.loadpoint);
  return {
    title: String(source.title || source.label || "").trim(),
    image: String(source.image || source.image_path || source.car_image || DEFAULT_ELECTRIC_VEHICLE_IMAGE).trim() || DEFAULT_ELECTRIC_VEHICLE_IMAGE,
    day_image: String(source.day_image || source.image_day || source.eauto_day_image || "").trim(),
    night_image: String(source.night_image || source.image_night || source.eauto_night_image || "").trim(),
    wallbox: normalizeElectricVehicleWallbox(source.wallbox || source.wallbox_key || source.loadpoint || source.loadpoint_id),
    evcc_loadpoint: loadpoint,
    evcc_prefix: normalizeElectricVehiclePrefix(source.evcc_prefix || source.integration_prefix || source.prefix),
    entities: normalizeElectricVehicleEntities(source.entities || source.evcc_entities || {}),
  };
}

export function createElectricVehicleDashboardMethods({
  assetUrl,
  findMetricByKey,
  numericState,
} = {}) {
  return {
    _electricVehicleConfig() {
      this.config.electric_vehicle = normalizeElectricVehicleConfig(this.config.electric_vehicle || this.config.ev || this.config.e_auto || {});
      return this.config.electric_vehicle;
    },

    _electricVehicleDefinition(key) {
      return ELECTRIC_VEHICLE_ENTITY_DEFINITIONS.find((definition) => definition.key === key);
    },

    _electricVehicleWallboxKey() {
      return normalizeElectricVehicleWallbox(this._electricVehicleConfig().wallbox);
    },

    _electricVehicleWallboxEntityKey(kind) {
      const wallboxKey = this._electricVehicleWallboxKey();
      return WALLBOX_ENTITY_FALLBACKS[wallboxKey]?.[kind] || "";
    },

    _electricVehicleWallboxMetric() {
      const wallboxKey = this._electricVehicleWallboxKey();
      return typeof findMetricByKey === "function"
        ? findMetricByKey(wallboxKey)
        : { key: wallboxKey, label: wallboxKey, unit: "power" };
    },

    _electricVehicleEvccEntityCandidates(definition = {}) {
      const evConfig = this._electricVehicleConfig();
      const prefix = normalizeElectricVehiclePrefix(evConfig.evcc_prefix);
      const suffix = String(definition.evccSuffix || "").trim();
      const domain = String(definition.evccDomain || "").trim();
      if (!prefix || !suffix || !domain) return [];
      const loadpoint = normalizeElectricVehicleLoadpoint(evConfig.evcc_loadpoint);
      const entityObjectId = definition.evccSite ? `${prefix}_${suffix}` : loadpoint ? `${prefix}_${loadpoint}_${suffix}` : "";
      return entityObjectId ? [`${domain}.${entityObjectId}`] : [];
    },

    _electricVehicleEvccEntityId(definition = {}) {
      const candidates = this._electricVehicleEvccEntityCandidates(definition);
      if (candidates.length === 0) return "";
      if (!this._hass?.states) return "";
      return candidates.find((entityId) => this._hass.states[entityId]) || "";
    },

    _electricVehicleEntityId(key) {
      const definition = this._electricVehicleDefinition(key);
      const evConfig = this._electricVehicleConfig();
      const evEntities = evConfig.entities || {};
      const direct = evEntities[key] || definition?.aliases?.map((alias) => evEntities[alias]).find(Boolean);
      if (direct) return direct;

      const evccEntityId = this._electricVehicleEvccEntityId(definition);
      if (evccEntityId) return evccEntityId;

      const fallbackKey = definition?.wallboxFallback ? this._electricVehicleWallboxEntityKey(definition.wallboxFallback) : "";
      if (fallbackKey && this.config.entities?.[fallbackKey]) return this.config.entities[fallbackKey];

      const topLevelAliases = [
        key,
        `ev_${key}`,
        `evcc_${key}`,
        `electric_vehicle_${key}`,
        ...(definition?.aliases || []),
      ];
      return topLevelAliases.map((alias) => this.config.entities?.[alias]).find(Boolean) || "";
    },

    _electricVehicleAttributeValue(entityId = "", paths = []) {
      const entity = this._getEntity?.(entityId);
      if (!entity?.attributes) return undefined;
      const pathList = Array.isArray(paths) ? paths : [paths];
      for (const path of pathList) {
        const value = String(path || "").split(".").reduce((cursor, part) => (cursor == null ? undefined : cursor[part]), entity.attributes);
        if (!isUnavailableElectricVehicleValue(value)) return value;
      }
      return undefined;
    },

    _electricVehicleRawValue(key) {
      const entityId = this._electricVehicleEntityId(key);
      if (!entityId) return undefined;
      return this._getEntityValue(entityId, undefined);
    },

    _electricVehicleNumericState(value) {
      if (typeof numericState === "function") return numericState(value);
      const number = Number(String(value ?? "").trim().replace(",", "."));
      return Number.isFinite(number) ? number : undefined;
    },

    _electricVehicleBooleanValue(key) {
      const entityId = this._electricVehicleEntityId(key);
      if (!entityId) return undefined;
      const normalized = normalizedElectricVehicleText(this._getEntityValue(entityId, undefined)).replace(/[\s-]+/g, "_");
      if (!normalized || UNAVAILABLE_ELECTRIC_VEHICLE_VALUES.includes(normalized)) return undefined;
      if (["on", "true", "1", "yes", "ja", "connected", "plugged", "plugged_in", "home", "enabled", "active", "ready", "charging", "verbunden", "eingesteckt", "angeschlossen", "freigegeben", "aktiviert", "laedt", "l\u00e4dt"].includes(normalized)) return true;
      if (["off", "false", "0", "no", "nein", "disconnected", "unplugged", "not_connected", "away", "disabled", "inactive", "idle", "nicht_verbunden", "ausgesteckt", "getrennt", "gesperrt", "deaktiviert"].includes(normalized)) return false;
      return undefined;
    },

    _electricVehicleCanSetModeEntity(entityId = "") {
      return ["select", "input_select"].includes(electricVehicleEntityDomain(entityId));
    },

    _electricVehicleModeControlEntityId() {
      const direct = this._electricVehicleEntityId("mode_control");
      if (this._electricVehicleCanSetModeEntity(direct)) return direct;
      const modeEntity = this._electricVehicleEntityId("mode");
      return this._electricVehicleCanSetModeEntity(modeEntity) ? modeEntity : "";
    },

    _electricVehicleModeOptionDefinition(modeKeyOrValue = "") {
      const token = normalizedElectricVehicleModeToken(modeKeyOrValue);
      return ELECTRIC_VEHICLE_MODE_OPTIONS.find((option) => (
        token === normalizedElectricVehicleModeToken(option.key)
        || token === normalizedElectricVehicleModeToken(option.serviceValue)
        || option.aliases.some((alias) => token === normalizedElectricVehicleModeToken(alias))
      ));
    },

    _electricVehicleModeKeyFromValue(value = "") {
      return this._electricVehicleModeOptionDefinition(value)?.key || "";
    },

    _electricVehicleModeLabel(modeKeyOrValue = "") {
      const definition = this._electricVehicleModeOptionDefinition(modeKeyOrValue);
      return definition
        ? this._t(definition.labelKey, {}, definition.label)
        : String(modeKeyOrValue || "").trim();
    },

    _electricVehicleModeEntityOptions(entityId = "") {
      const options = this._hass?.states?.[entityId]?.attributes?.options;
      return Array.isArray(options) ? options.map((option) => String(option || "").trim()).filter(Boolean) : [];
    },

    _electricVehicleModeServiceValue(entityId = "", modeKey = "") {
      const definition = this._electricVehicleModeOptionDefinition(modeKey);
      if (!definition) return String(modeKey || "").trim();
      const options = this._electricVehicleModeEntityOptions(entityId);
      const matchedOption = options.find((option) => this._electricVehicleModeOptionDefinition(option)?.key === definition.key);
      return matchedOption || definition.serviceValue;
    },

    async _electricVehicleSetMode(modeKey = "") {
      const definition = this._electricVehicleModeOptionDefinition(modeKey);
      const entityId = this._electricVehicleModeControlEntityId();
      if (!definition || !entityId || !this._hass?.callService) return;

      const domain = electricVehicleEntityDomain(entityId);
      const option = this._electricVehicleModeServiceValue(entityId, definition.key);
      try {
        await this._hass.callService(domain, "select_option", {
          entity_id: entityId,
          option,
        });
      } catch (err) {
        console.warn("Failed to set EVCC charge mode", err);
      }
    },

    _electricVehicleStatusLabel() {
      const explicit = this._electricVehicleRawValue("status");
      if (!isUnavailableElectricVehicleValue(explicit)) return String(explicit).trim();
      if (this._electricVehicleBooleanValue("charging") === true) return this._t("ev.statusCharging", {}, "Charging");
      if (this._electricVehicleBooleanValue("connected") === true) {
        return this._electricVehicleBooleanValue("enabled") === false
          ? this._t("ev.statusPaused", {}, "Paused")
          : this._t("ev.statusConnected", {}, "Connected");
      }
      if (this._electricVehicleBooleanValue("connected") === false) return this._t("ev.statusDisconnected", {}, "Disconnected");
      return this._t("ev.unknown", {}, "Unknown");
    },

    _electricVehicleHeroBadgePosition(definitionKey) {
      const positionKey = ELECTRIC_VEHICLE_HERO_BADGE_POSITION_KEYS[definitionKey] || `electric_vehicle_${definitionKey}`;
      const fallback = ELECTRIC_VEHICLE_HERO_BADGE_POSITIONS[definitionKey] || { left: 50, top: 50 };
      const configured = this.config.positions?.[positionKey] || {};
      return {
        left: normalizeElectricVehicleBadgeCoordinate(configured.left, fallback.left),
        top: normalizeElectricVehicleBadgeCoordinate(configured.top, fallback.top),
      };
    },

    _electricVehicleFormatDuration(rawValue, entityUnit = "") {
      if (isUnavailableElectricVehicleValue(rawValue)) return ELECTRIC_VEHICLE_EMPTY_VALUE;
      const numericValue = Number(String(rawValue).replace(",", "."));
      const unit = String(entityUnit || "").trim().toLowerCase();
      if (Number.isFinite(numericValue)) {
        if (unit === "ns" || unit.includes("nanosecond") || unit.includes("nanosekunde")) return this._formatDurationSeconds(numericValue / 1000000000) || ELECTRIC_VEHICLE_EMPTY_VALUE;
        if (unit === "ms" || unit.includes("millisecond") || unit.includes("millisekunde")) return this._formatDurationSeconds(numericValue / 1000) || ELECTRIC_VEHICLE_EMPTY_VALUE;
        if (unit.includes("s") && !unit.includes("stunden") && !unit.includes("hour")) return this._formatDurationSeconds(numericValue) || ELECTRIC_VEHICLE_EMPTY_VALUE;
        if (unit.includes("min") || unit === "m") return this._formatDurationMinutes(numericValue) || ELECTRIC_VEHICLE_EMPTY_VALUE;
        if (unit.includes("h") || unit.includes("std") || unit.includes("hour") || unit.includes("stunde")) return this._formatDurationMinutes(numericValue * 60) || ELECTRIC_VEHICLE_EMPTY_VALUE;
        if (numericValue > 100000000000) return this._formatDurationSeconds(numericValue / 1000000000) || ELECTRIC_VEHICLE_EMPTY_VALUE;
      }
      return this._formatRemainingChargeTimeValue(rawValue, entityUnit) || ELECTRIC_VEHICLE_EMPTY_VALUE;
    },

    _electricVehicleFormatGridPower(rawValue, entityUnit = "") {
      if (isUnavailableElectricVehicleValue(rawValue)) return ELECTRIC_VEHICLE_EMPTY_VALUE;
      const watts = this._valueAsWatts
        ? this._valueAsWatts(rawValue, entityUnit || "W")
        : this._electricVehicleNumericState(rawValue);
      if (!Number.isFinite(watts)) return `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
      const formatted = this._formatPowerValue(Math.abs(watts), this.config.units?.power || "auto", "W");
      const direction = watts >= 0
        ? this._t("ev.gridImport", {}, "Import")
        : this._t("ev.gridExport", {}, "Export");
      return `${formatted} ${direction}`;
    },

    _electricVehicleFormatValue(definition) {
      const key = definition?.key || "";
      if (key === "status") return this._electricVehicleStatusLabel();
      const entityId = this._electricVehicleEntityId(key);
      const attrValue = entityId && (definition.attr || definition.attrFallbacks)
        ? this._electricVehicleAttributeValue(entityId, [definition.attr, ...(definition.attrFallbacks || [])].filter(Boolean))
        : undefined;
      const rawValue = !isUnavailableElectricVehicleValue(attrValue)
        ? attrValue
        : entityId ? this._getEntityValue(entityId, undefined) : undefined;
      const unit = entityId ? this._getEntityUnit(entityId) || "" : "";
      if (!entityId || isUnavailableElectricVehicleValue(rawValue)) return ELECTRIC_VEHICLE_EMPTY_VALUE;

      if (definition.kind === "mode") return this._electricVehicleModeLabel(rawValue);
      if (definition.kind === "grid_power") return this._electricVehicleFormatGridPower(rawValue, unit);
      if (definition.kind === "boolean") {
        const bool = this._electricVehicleBooleanValue(key);
        if (bool === true) return this._t("ev.yes", {}, "Yes");
        if (bool === false) return this._t("ev.no", {}, "No");
        return String(rawValue).trim();
      }
      if (definition.kind === "power") return this._formatPowerValue(rawValue, this.config.units?.power || "auto", unit || "W");
      if (definition.kind === "energy") return this._formatEnergyValue(rawValue, unit || "Wh", "kWh");
      if (definition.kind === "duration") return this._electricVehicleFormatDuration(rawValue, unit);
      if (definition.kind === "percent") {
        const number = this._electricVehicleNumericState(rawValue);
        return Number.isFinite(number) ? `${Math.round(Math.max(0, Math.min(100, number)))}%` : `${String(rawValue).trim()}${unit && !String(rawValue).includes(unit) ? ` ${unit}` : ""}`;
      }
      if (definition.kind === "current") {
        const number = this._electricVehicleNumericState(rawValue);
        return Number.isFinite(number) ? `${Number.isInteger(number) ? number.toFixed(0) : number.toFixed(1)} A` : `${String(rawValue).trim()}${unit && !String(rawValue).includes(unit) ? ` ${unit}` : ""}`;
      }
      if (definition.kind === "distance") {
        const number = this._electricVehicleNumericState(rawValue);
        return Number.isFinite(number) ? `${Number.isInteger(number) ? number.toFixed(0) : number.toFixed(1)} ${unit || "km"}` : `${String(rawValue).trim()}${unit && !String(rawValue).includes(unit) ? ` ${unit}` : ""}`;
      }
      if (definition.kind === "phases") {
        const metric = this._electricVehicleWallboxMetric();
        if (key === "phases_active" && !this._electricVehicleConfig().entities?.phases_active && this._wallboxPhaseLabel(metric)) {
          return this._wallboxPhaseLabel(metric);
        }
        return `${String(rawValue).trim()}${unit && !String(rawValue).includes(unit) ? ` ${unit}` : ""}`;
      }
      return `${String(rawValue).trim()}${unit && !String(rawValue).includes(unit) ? ` ${unit}` : ""}`;
    },

    _electricVehicleFieldState(definition) {
      const key = definition?.key || "";
      const entityId = this._electricVehicleEntityId(key);
      const value = this._electricVehicleFormatValue(definition);
      return {
        key,
        entityId,
        label: this._t(definition.labelKey, {}, definition.label),
        value,
        configured: key === "status" || Boolean(entityId),
      };
    },

    _electricVehicleConfiguredFields() {
      return ELECTRIC_VEHICLE_ENTITY_DEFINITIONS
        .map((definition) => ({ definition, state: this._electricVehicleFieldState(definition) }))
        .filter((item) => item.state.configured && item.state.value !== ELECTRIC_VEHICLE_EMPTY_VALUE);
    },

    _electricVehicleImagePath() {
      const evConfig = this._electricVehicleConfig();
      if (typeof this._isDaylight === "function") {
        if (this._isDaylight() && evConfig.day_image) return evConfig.day_image;
        if (!this._isDaylight() && evConfig.night_image) return evConfig.night_image;
      }
      return evConfig.image;
    },

    _electricVehicleImageUrls(path = this._electricVehicleImagePath()) {
      const value = String(path || DEFAULT_ELECTRIC_VEHICLE_IMAGE).trim() || DEFAULT_ELECTRIC_VEHICLE_IMAGE;
      const defaultValue = DEFAULT_ELECTRIC_VEHICLE_IMAGE;
      const values = [value, ...(value === defaultValue ? [] : [defaultValue])];
      const urls = values.flatMap((item) => {
        if (/^(?:https?:)?\/\//i.test(item) || item.startsWith("/") || item.startsWith("data:")) return [item];
        const withoutImagesPrefix = item.replace(/^images\//, "");
        const candidates = [item, withoutImagesPrefix]
          .flatMap((candidate) => (typeof this._imageFormatFiles === "function" ? this._imageFormatFiles(candidate) : [candidate]))
          .filter(Boolean);
        return candidates.flatMap((candidate) => {
          const localCandidates = [
            `images/${candidate.replace(/^images\//, "")}`,
            candidate,
          ];
          const resolved = [
            typeof this._remoteImageUrl === "function" ? this._remoteImageUrl(candidate.replace(/^images\//, "")) : "",
            `/hacsfiles/ha-solar-dashboard/images/${candidate.replace(/^images\//, "")}`,
            `/hacsfiles/ha-solar-dashboard/${candidate.replace(/^images\//, "")}`,
            `/local/community/ha-solar-dashboard/images/${candidate.replace(/^images\//, "")}`,
            `/local/community/ha-solar-dashboard/${candidate.replace(/^images\//, "")}`,
          ];
          localCandidates.forEach((localCandidate) => {
            try {
              resolved.push(assetUrl(localCandidate));
            } catch (_err) {
              // Optional local assets can be unavailable in some install modes.
            }
          });
          return resolved;
        });
      });
      return [...new Set(urls.filter(Boolean))];
    },

    _electricVehicleImageUrl(path = this._electricVehicleImagePath()) {
      const [src] = this._electricVehicleImageUrls(path);
      if (src) return src;
      const value = String(path || DEFAULT_ELECTRIC_VEHICLE_IMAGE).trim() || DEFAULT_ELECTRIC_VEHICLE_IMAGE;
      try {
        return assetUrl(value);
      } catch (_err) {
        return value;
      }
    },

    _electricVehicleHeroBadgeVisible(definitionKey, state) {
      if (!state.configured || state.value === ELECTRIC_VEHICLE_EMPTY_VALUE) return false;
      if (definitionKey === "vehicle_soc") {
        const rawValue = this._electricVehicleRawValue("vehicle_soc");
        const soc = this._electricVehicleNumericState(rawValue);
        if (Number.isFinite(soc) && soc <= 0) return false;
      }
      return true;
    },

    _electricVehicleBadgeAccent(definition, key = definition?.key || "") {
      if (key === "status") {
        if (this._electricVehicleBooleanValue("charging") === true) return "#34d399";
        if (this._electricVehicleBooleanValue("connected") === true) return "#38bdf8";
        return "#9ba3b8";
      }
      if (key === "grid_power") {
        const rawValue = this._electricVehicleRawValue("grid_power");
        const watts = this._valueAsWatts
          ? this._valueAsWatts(rawValue, this._getEntityUnit(this._electricVehicleEntityId("grid_power")) || "W")
          : this._electricVehicleNumericState(rawValue);
        return Number.isFinite(watts) && watts < 0 ? "#34d399" : "#f59e0b";
      }
      return this._electricVehicleAccent(definition);
    },

    _electricVehicleBadgeGlow(key = "") {
      if (key === "status" && this._electricVehicleBooleanValue("charging") === true) return "rgba(52,211,153,.55)";
      if (key === "charge_power" && this._electricVehicleBooleanValue("charging") === true) return "rgba(31,143,255,.48)";
      return "transparent";
    },

    _renderElectricVehicleHeroBadge(definitionKey) {
      const definition = this._electricVehicleDefinition(definitionKey);
      if (!definition) return "";
      const state = this._electricVehicleFieldState(definition);
      if (!this._electricVehicleHeroBadgeVisible(definitionKey, state)) return "";
      const position = this._electricVehicleHeroBadgePosition(definitionKey);
      const entityAttr = state.entityId ? ` data-more-info="${this._escape(state.entityId)}"` : "";
      return `
        <div class="electric-vehicle-badge" style="left:${this._escape(position.left)}%;top:${this._escape(position.top)}%;--tile-accent:${this._escape(this._electricVehicleBadgeAccent(definition, definitionKey))};--tile-glow:${this._escape(this._electricVehicleBadgeGlow(definitionKey))}"${entityAttr}>
          <span>${this._escape(state.label)}</span>
          <strong data-electric-vehicle-value="${this._escape(state.key)}">${this._escape(state.value)}</strong>
        </div>
      `;
    },

    _renderElectricVehicleField(item) {
      const { definition, state } = item;
      const entityTitle = state.entityId ? `${state.label}: ${state.entityId}` : state.label;
      const toggleDomains = new Set(["switch", "input_boolean", "automation"]);
      const domain = electricVehicleEntityDomain(state.entityId);
      const actionAttr = toggleDomains.has(domain)
        ? ` data-entity-toggle="${this._escape(state.entityId)}" tabindex="0" role="button"`
        : state.entityId ? ` data-more-info="${this._escape(state.entityId)}" tabindex="0" role="button"` : "";
      return `
        <div class="electric-vehicle-tile" title="${this._escape(entityTitle)}" style="--tile-accent:${this._escape(this._electricVehicleAccent(definition))}"${actionAttr}>
          <span>${this._escape(state.label)}</span>
          <strong data-electric-vehicle-value="${this._escape(state.key)}">${this._escape(state.value)}</strong>
        </div>
      `;
    },

    _renderElectricVehicleModeControl() {
      const entityId = this._electricVehicleModeControlEntityId();
      if (!entityId) return "";
      const rawValue = this._getEntityValue(entityId, undefined);
      const activeMode = this._electricVehicleModeKeyFromValue(rawValue);
      const currentLabel = activeMode
        ? this._electricVehicleModeLabel(activeMode)
        : !isUnavailableElectricVehicleValue(rawValue)
          ? String(rawValue).trim()
          : ELECTRIC_VEHICLE_EMPTY_VALUE;
      const label = this._t("ev.modeControl", {}, "Lademodus");
      const buttons = ELECTRIC_VEHICLE_MODE_OPTIONS.map((option) => {
        const active = option.key === activeMode;
        const optionLabel = this._electricVehicleModeLabel(option.key);
        return `
          <button type="button" class="electric-vehicle-mode-button${active ? " active" : ""}" data-electric-vehicle-mode="${this._escape(option.key)}" aria-pressed="${active ? "true" : "false"}" title="${this._escape(`${optionLabel}: ${entityId}`)}">
            ${this._escape(optionLabel)}
          </button>
        `;
      }).join("");

      return `
        <section class="electric-vehicle-control-panel" title="${this._escape(`${label}: ${entityId}`)}">
          <div class="electric-vehicle-control-head">
            <span>${this._escape(label)}</span>
            <strong>${this._escape(currentLabel)}</strong>
          </div>
          <div class="electric-vehicle-mode-toggle" role="group" aria-label="${this._escape(label)}">
            ${buttons}
          </div>
        </section>
      `;
    },

    _electricVehicleAccent(definition) {
      if (definition.group === "controls") return "#2dd4bf";
      if (definition.group === "vehicle") return "#34d399";
      if (definition.group === "charging") return "#ffc233";
      if (definition.group === "limits") return "#60a5fa";
      if (definition.group === "planning") return "#a78bfa";
      if (definition.group === "site") return "#38bdf8";
      return "#1f8fff";
    },

    _electricVehiclePvStatusText() {
      const entityId = this._electricVehicleEntityId("pv_status_text") || this._electricVehicleEntityId("status");
      const value = entityId ? this._getEntityValue(entityId, undefined) : undefined;
      return isUnavailableElectricVehicleValue(value) ? "" : String(value).trim();
    },

    _renderElectricVehicleDashboard() {
      const evConfig = this._electricVehicleConfig();
      const configuredFields = this._electricVehicleConfiguredFields();
      const [imageSrc, ...imageFallbacks] = this._electricVehicleImageUrls();
      const title = evConfig.title || this._t("ev.title", {}, "E-Auto");
      const vehicleTitle = this._electricVehicleFieldState(this._electricVehicleDefinition("vehicle_title")).value;
      const vehicleName = this._electricVehicleFieldState(this._electricVehicleDefinition("vehicle_name")).value;
      const vehicleSubtitle = [vehicleTitle, vehicleName].find((value) => value && value !== ELECTRIC_VEHICLE_EMPTY_VALUE);
      const subtitle = vehicleSubtitle
        || (evConfig.evcc_loadpoint
          ? `${this._t("ev.subtitle", {}, "EVCC loadpoint")}: ${evConfig.evcc_loadpoint}`
          : this._t("ev.subtitle", {}, "EVCC loadpoint"));
      const heroBadges = ["mode", "status", "charge_power", "charge_current", "session_energy", "grid_power", "home_battery_soc", "session_solar_percentage", "vehicle_soc", "charge_remaining_duration"]
        .map((key) => this._renderElectricVehicleHeroBadge(key))
        .join("");
      const modeControl = this._renderElectricVehicleModeControl();
      const pvStatusText = this._electricVehiclePvStatusText();
      const pvStatusEntityId = this._electricVehicleEntityId("pv_status_text") || "";
      const groups = ELECTRIC_VEHICLE_GROUPS.map((group) => {
        const items = configuredFields.filter((item) => item.definition.group === group.key && item.definition.control !== true);
        if (items.length === 0) return "";
        return `
          <section class="electric-vehicle-section">
            <div class="electric-vehicle-section-title">${this._escape(this._t(group.labelKey, {}, group.label))}</div>
            <div class="electric-vehicle-grid">
              ${items.map((item) => this._renderElectricVehicleField(item)).join("")}
            </div>
          </section>
        `;
      }).join("");
      const empty = configuredFields.length === 0
        ? `<div class="electric-vehicle-empty">${this._escape(this._t("ev.empty", {}, "No EVCC entities configured."))}</div>`
        : "";

      return `
        <section class="electric-vehicle-dashboard" data-electric-vehicle-dashboard>
          <div class="electric-vehicle-head">
            <div>
              <div class="chart-dashboard-label">${this._escape(this._t("view.electricVehicle", {}, "E-Auto"))}</div>
              <h2>${this._escape(title)}</h2>
              <p>${this._escape(subtitle)}</p>
            </div>
            <span>${this._escape(this._electricVehicleStatusLabel())}</span>
          </div>
          ${modeControl}
          <div class="electric-vehicle-hero">
            <img class="electric-vehicle-image" src="${this._escape(imageSrc)}" data-fallbacks="${this._escape(imageFallbacks.join("|"))}" alt="${this._escape(title)}" />
            <div class="electric-vehicle-badges">${heroBadges}</div>
            ${pvStatusText ? `<div class="scene-status electric-vehicle-pv-status"${pvStatusEntityId ? ` data-more-info="${this._escape(pvStatusEntityId)}"` : ""}>${this._escape(pvStatusText)}</div>` : ""}
          </div>
          ${empty || groups}
        </section>
      `;
    },
  };
}
