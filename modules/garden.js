export const DEFAULT_GARDEN_IMAGE = "images/single_family_home_top_view_garden.png";

export const GARDEN_HERO_BADGE_POSITION_KEYS = Object.freeze({
  mower_status: "garden_mower_status",
  mower_battery: "garden_mower_battery",
  mower_next_start: "garden_mower_next_start",
  mower_error: "garden_mower_error",
  garden_water: "garden_water",
  irrigation_status_text: "garden_irrigation_status_text",
  irrigation_enabled: "garden_irrigation_enabled",
  irrigation_next_start: "garden_irrigation_next_start",
  irrigation_remaining: "garden_irrigation_remaining",
  water_flow: "garden_water_flow",
  water_consumption_today: "garden_water_consumption_today",
  water_pressure: "garden_water_pressure",
  cistern_level: "garden_cistern_level",
  rain_24h: "garden_rain_24h",
  rain_today: "garden_rain_today",
  outdoor_temperature: "garden_outdoor_temperature",
  humidity: "garden_humidity",
  soil_moisture: "garden_soil_moisture",
  soil_temperature: "garden_soil_temperature",
  garden_lights: "garden_lights",
  garden_outlet: "garden_outlet",
  pond_pump: "garden_pond_pump",
  pool_pump: "garden_pool_pump",
});

export const GARDEN_HERO_BADGE_POSITIONS = Object.freeze({
  mower_status: Object.freeze({ left: 10, top: 9 }),
  mower_battery: Object.freeze({ left: 29, top: 9 }),
  mower_next_start: Object.freeze({ left: 50, top: 9 }),
  mower_error: Object.freeze({ left: 70, top: 9 }),
  garden_water: Object.freeze({ left: 84, top: 11 }),
  irrigation_status_text: Object.freeze({ left: 50, top: 12 }),
  irrigation_enabled: Object.freeze({ left: 84, top: 10 }),
  irrigation_next_start: Object.freeze({ left: 82, top: 27 }),
  irrigation_remaining: Object.freeze({ left: 82, top: 43 }),
  water_flow: Object.freeze({ left: 82, top: 59 }),
  water_consumption_today: Object.freeze({ left: 72, top: 75 }),
  water_pressure: Object.freeze({ left: 54, top: 75 }),
  cistern_level: Object.freeze({ left: 36, top: 75 }),
  rain_24h: Object.freeze({ left: 28, top: 86 }),
  rain_today: Object.freeze({ left: 12, top: 86 }),
  outdoor_temperature: Object.freeze({ left: 47, top: 86 }),
  humidity: Object.freeze({ left: 66, top: 86 }),
  soil_moisture: Object.freeze({ left: 43, top: 86 }),
  soil_temperature: Object.freeze({ left: 27, top: 66 }),
  garden_lights: Object.freeze({ left: 17, top: 45 }),
  garden_outlet: Object.freeze({ left: 82, top: 45 }),
  pond_pump: Object.freeze({ left: 26, top: 29 }),
  pool_pump: Object.freeze({ left: 74, top: 29 }),
});

const DEFAULT_GARDEN_IMAGE_BADGES = Object.freeze(new Set([
  "mower_status",
  "garden_water",
  "irrigation_enabled",
  "rain_24h",
  "outdoor_temperature",
  "soil_moisture",
  "irrigation_status_text",
]));

const DEFAULT_GARDEN_FOOTER_HIDDEN_FIELDS = Object.freeze(new Set([
  "irrigation_status_text",
]));

export const GARDEN_ENTITY_DEFINITIONS = Object.freeze([
  Object.freeze({ key: "mower_status", labelKey: "garden.mowerStatus", label: "Mäher", group: "mower", kind: "status", aliases: ["mower", "mower_status", "maeher_status", "mower_activity", "lawn_mower_status", "robot_mower_status"] }),
  Object.freeze({ key: "mower_battery", labelKey: "garden.mowerBattery", label: "Mäher Akku", group: "mower", kind: "percent", aliases: ["mower_battery", "maeher_battery", "maeher_akku", "robot_mower_battery"] }),
  Object.freeze({ key: "mower_next_start", labelKey: "garden.mowerNextStart", label: "Nächster Mähstart", group: "mower", kind: "text", aliases: ["mower_next_start", "maeher_next_start", "mower_schedule", "robot_mower_next_start"] }),
  Object.freeze({ key: "mower_error", labelKey: "garden.mowerError", label: "Mäher Fehler", group: "mower", kind: "text", aliases: ["mower_error", "maeher_error", "robot_mower_error"] }),
  Object.freeze({ key: "garden_water", labelKey: "garden.gardenWater", label: "Gartenwasser", group: "water", kind: "status", aliases: ["garden_water", "gartenwasser", "garden_water_status", "gartenwasser_status", "irrigation_status", "watering_status", "bewasserung_status", "bewaesserung_status", "sprinkler_status"] }),
  Object.freeze({ key: "irrigation_status_text", labelKey: "garden.irrigationStatusText", label: "Bewässerungsstatus", group: "water", kind: "text", aliases: ["irrigation_status_text", "watering_status_text", "bewasserung_status_text", "bewaesserung_status_text", "input_text_bewasserung_status"] }),
  Object.freeze({ key: "irrigation_enabled", labelKey: "garden.irrigationEnabled", label: "Bewässerung aktiv", group: "water", kind: "boolean", aliases: ["automation", "automatic", "automation_enabled", "irrigation_enabled", "watering_enabled", "garden_water_enabled", "bewasserung_automatik", "bewaesserung_automatik", "irrigation_automation"] }),
  Object.freeze({ key: "irrigation_next_start", labelKey: "garden.irrigationNextStart", label: "Nächste Bewässerung", group: "water", kind: "text", aliases: ["automation_schedule", "irrigation_schedule", "irrigation_next_start", "watering_schedule", "watering_next_start", "bewasserung_zeitplan", "bewaesserung_zeitplan", "naechste_bewasserung"] }),
  Object.freeze({ key: "irrigation_remaining", labelKey: "garden.irrigationRemaining", label: "Restlaufzeit", group: "water", kind: "duration", aliases: ["irrigation_remaining", "watering_remaining", "remaining", "remaining_time", "restzeit", "bewasserung_restzeit", "bewaesserung_restzeit"] }),
  Object.freeze({ key: "water_flow", labelKey: "garden.waterFlow", label: "Wasserfluss", group: "water", kind: "flow", aliases: ["water_flow", "irrigation_flow", "watering_flow", "durchfluss"] }),
  Object.freeze({ key: "water_consumption_today", labelKey: "garden.waterConsumptionToday", label: "Wasser heute", group: "water", kind: "volume", aliases: ["water_consumption_today", "water_today", "irrigation_water_today", "garden_water_today", "wasser_heute", "gartenwasser_heute"] }),
  Object.freeze({ key: "water_pressure", labelKey: "garden.waterPressure", label: "Wasserdruck", group: "water", kind: "pressure", aliases: ["water_pressure", "irrigation_pressure", "garden_water_pressure", "wasserdruck"] }),
  Object.freeze({ key: "cistern_level", labelKey: "garden.cisternLevel", label: "Zisterne", group: "water", kind: "percent", aliases: ["cistern_level", "rain_barrel_level", "water_tank_level", "zisterne", "zisterne_level", "regenfass_level", "wassertank_level"] }),
  Object.freeze({ key: "rain_24h", labelKey: "garden.rain24h", label: "Regen 24h", group: "weather", kind: "precipitation", aliases: ["rain_24h", "rain_last_24h", "regen_24h", "precipitation_24h"] }),
  Object.freeze({ key: "rain_today", labelKey: "garden.rainToday", label: "Regen heute", group: "weather", kind: "precipitation", aliases: ["rain_today", "regen_heute", "precipitation_today"] }),
  Object.freeze({ key: "outdoor_temperature", labelKey: "garden.outdoorTemperature", label: "Außen", group: "weather", kind: "temperature", aliases: ["outdoor_temperature", "outside_temperature", "aussen_temperature", "garden_temperature"] }),
  Object.freeze({ key: "humidity", labelKey: "garden.humidity", label: "Luftfeuchte", group: "weather", kind: "percent", aliases: ["humidity", "outdoor_humidity", "garden_humidity", "luftfeuchte"] }),
  Object.freeze({ key: "soil_moisture", labelKey: "garden.soilMoisture", label: "Bodenfeuchte", group: "weather", kind: "percent", aliases: ["soil_moisture", "garden_soil_moisture", "bodenfeuchte"] }),
  Object.freeze({ key: "soil_temperature", labelKey: "garden.soilTemperature", label: "Bodentemperatur", group: "weather", kind: "temperature", aliases: ["soil_temperature", "garden_soil_temperature", "bodentemperatur"] }),
  Object.freeze({ key: "garden_lights", labelKey: "garden.gardenLights", label: "Gartenlicht", group: "equipment", kind: "status", aliases: ["garden_lights", "garden_light", "gartenlicht", "aussenlicht_garten", "outdoor_lights", "patio_lights"] }),
  Object.freeze({ key: "garden_outlet", labelKey: "garden.gardenOutlet", label: "Gartensteckdose", group: "equipment", kind: "status", aliases: ["garden_outlet", "garden_socket", "gartensteckdose", "outdoor_socket", "outdoor_outlet"] }),
  Object.freeze({ key: "pond_pump", labelKey: "garden.pondPump", label: "Teichpumpe", group: "equipment", kind: "status", aliases: ["pond_pump", "teichpumpe", "pond_filter", "teichfilter"] }),
  Object.freeze({ key: "pool_pump", labelKey: "garden.poolPump", label: "Poolpumpe", group: "equipment", kind: "status", aliases: ["pool_pump", "pool_filter", "poolpumpe"] }),
]);

const GARDEN_GROUPS = Object.freeze([
  Object.freeze({ key: "mower", labelKey: "garden.groupMower", label: "Mäher" }),
  Object.freeze({ key: "water", labelKey: "garden.groupWater", label: "Gartenwasser" }),
  Object.freeze({ key: "weather", labelKey: "garden.groupWeather", label: "Wetter & Boden" }),
  Object.freeze({ key: "equipment", labelKey: "garden.groupEquipment", label: "Gartengeräte" }),
]);

const UNAVAILABLE_GARDEN_VALUES = Object.freeze(["unknown", "unavailable", "none", "null", "offline"]);
const GARDEN_EMPTY_VALUE = "\u2014";

function normalizedGardenText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isUnavailableGardenValue(value) {
  const normalized = normalizedGardenText(value);
  return !normalized || UNAVAILABLE_GARDEN_VALUES.includes(normalized);
}

function firstGardenValue(values = []) {
  return values
    .map((value) => String(value || "").trim())
    .find(Boolean) || "";
}

function normalizeGardenBadgeCoordinate(value, fallback = 50) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, number));
}

function gardenEntityDomain(entityId = "") {
  return String(entityId || "").split(".")[0];
}

function normalizeGardenEntities(entities = {}) {
  const source = entities && typeof entities === "object" ? entities : {};
  return Object.fromEntries(
    GARDEN_ENTITY_DEFINITIONS.map((definition) => [
      definition.key,
      firstGardenValue([
        source[definition.key],
        ...(definition.aliases || []).map((alias) => source[alias]),
      ]),
    ]),
  );
}

function normalizeGardenDisplay(display = {}) {
  const source = display && typeof display === "object" ? display : {};
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => GARDEN_ENTITY_DEFINITIONS.some((definition) => definition.key === key))
      .map(([key, value]) => {
        if (typeof value === "boolean") return [key, { image: value }];
        if (!value || typeof value !== "object") return [key, {}];
        const normalized = {};
        if (Object.prototype.hasOwnProperty.call(value, "image")) normalized.image = value.image !== false;
        if (Object.prototype.hasOwnProperty.call(value, "footer")) normalized.footer = value.footer !== false;
        else if (Object.prototype.hasOwnProperty.call(value, "kpi")) normalized.footer = value.kpi !== false;
        return [key, normalized];
      }),
  );
}

function normalizeGardenZone(zone, index = 0) {
  if (!zone || typeof zone !== "object") return undefined;
  const entity = String(zone.entity || zone.switch || zone.valve || "").trim();
  const label = String(zone.label || zone.name || `Zone ${index + 1}`).trim();
  const short = String(zone.short || zone.short_label || zone.key || `Z${index + 1}`).trim();
  if (!entity && !label) return undefined;
  return {
    id: String(zone.id || zone.key || entity || `zone_${index + 1}`).trim().replace(/[^\w-]+/g, "_") || `zone_${index + 1}`,
    label,
    short,
    entity,
    plan_entity: String(zone.plan_entity || zone.planEntity || zone.plan || "").trim(),
    plan_text: String(zone.plan_text || zone.planText || zone.plan_static || zone.planStatic || "").trim(),
    left: normalizeGardenBadgeCoordinate(zone.left ?? zone.x, 12 + index * 12),
    top: normalizeGardenBadgeCoordinate(zone.top ?? zone.y, 44),
    color: String(zone.color || zone.accent || (index % 4 === 3 ? "#38bdf8" : "#34d399")).trim(),
    glow: String(zone.glow || "").trim(),
    toggle: zone.toggle === true || zone.direct_toggle === true,
    visible: zone.visible !== false,
  };
}

function normalizeGardenZones(zones = []) {
  const source = Array.isArray(zones)
    ? zones
    : zones && typeof zones === "object"
      ? Object.entries(zones).map(([id, zone]) => (
        typeof zone === "string"
          ? { id, entity: zone, label: id }
          : { id, ...(zone || {}) }
      ))
      : [];
  return source.map((zone, index) => normalizeGardenZone(zone, index)).filter(Boolean);
}

function normalizeGardenManualAction(action, index = 0) {
  if (!action || typeof action !== "object") return undefined;
  const entity = String(action.entity || action.script || action.service || "").trim();
  const label = String(action.label || action.name || `Action ${index + 1}`).trim();
  if (!entity && !label) return undefined;
  return {
    id: String(action.id || action.key || entity || `action_${index + 1}`).trim().replace(/[^\w-]+/g, "_") || `action_${index + 1}`,
    label,
    caption: String(action.caption || action.cap || "").trim(),
    entity,
    confirm_text: String(action.confirm_text || action.confirmText || action.confirm || "").trim(),
    color: String(action.color || action.accent || "#38bdf8").trim(),
    visible: action.visible !== false,
  };
}

function normalizeGardenManualActions(actions = []) {
  const source = Array.isArray(actions)
    ? actions
    : actions && typeof actions === "object"
      ? Object.entries(actions).map(([id, action]) => (
        typeof action === "string"
          ? { id, entity: action, label: id }
          : { id, ...(action || {}) }
      ))
      : [];
  return source.map((action, index) => normalizeGardenManualAction(action, index)).filter(Boolean);
}

function normalizeGardenActivityLog(config = {}) {
  const source = config && typeof config === "object" ? config : {};
  const entities = Array.isArray(source.entities)
    ? source.entities.map((entity) => String(entity || "").trim()).filter(Boolean)
    : [];
  return {
    entities,
    hours: Math.max(1, Math.min(168, Number(source.hours || 72) || 72)),
    max_rows: Math.max(1, Math.min(50, Number(source.max_rows || source.maxRows || 15) || 15)),
  };
}

export function normalizeGardenConfig(config = {}) {
  const source = typeof config === "string"
    ? { image: config }
    : config && typeof config === "object"
      ? config
      : {};
  const entities = source.entities || source.garden_entities || source.sensors || {};
  return {
    title: String(source.title || source.label || "").trim(),
    image: String(source.image || source.image_path || source.garden_image || DEFAULT_GARDEN_IMAGE).trim() || DEFAULT_GARDEN_IMAGE,
    day_image: String(source.day_image || source.image_day || source.garden_day_image || "").trim(),
    night_image: String(source.night_image || source.image_night || source.garden_night_image || "").trim(),
    entities: normalizeGardenEntities(entities),
    display: normalizeGardenDisplay(source.display || source.label_display || source.label_visibility || {}),
    zones: normalizeGardenZones(source.zones || source.irrigation_zones || source.valves || []),
    manual_actions: normalizeGardenManualActions(source.manual_actions || source.actions || []),
    activity_log: normalizeGardenActivityLog(source.activity_log || {}),
  };
}

export function createGardenDashboardMethods({
  assetUrl,
  numericState,
} = {}) {
  return {
    _gardenConfig() {
      this.config.garden = normalizeGardenConfig(this.config.garden || this.config.garten || this.config.irrigation || {});
      return this.config.garden;
    },

    _gardenDefinition(key) {
      return GARDEN_ENTITY_DEFINITIONS.find((definition) => definition.key === key);
    },

    _gardenEntityId(key) {
      const definition = this._gardenDefinition(key);
      const gardenConfig = this._gardenConfig();
      const gardenEntities = gardenConfig.entities || {};
      const direct = gardenEntities[key] || definition?.aliases?.map((alias) => gardenEntities[alias]).find(Boolean);
      if (direct) return direct;

      const aliases = [
        key,
        `garden_${key}`,
        `garten_${key}`,
        `irrigation_${key}`,
        `watering_${key}`,
        ...(definition?.aliases || []),
      ];
      return aliases.map((alias) => this.config.entities?.[alias]).find(Boolean) || "";
    },

    _gardenRawValue(key) {
      const entityId = this._gardenEntityId(key);
      if (!entityId) return undefined;
      return this._getEntityValue(entityId, undefined);
    },

    _gardenNumericState(value) {
      if (typeof numericState === "function") return numericState(value);
      const number = Number(String(value ?? "").trim().replace(",", "."));
      return Number.isFinite(number) ? number : undefined;
    },

    _gardenBooleanValueFromRaw(rawValue) {
      const normalized = normalizedGardenText(rawValue).replace(/[\s-]+/g, "_");
      if (!normalized || UNAVAILABLE_GARDEN_VALUES.includes(normalized)) return undefined;
      if (["on", "true", "1", "yes", "ja", "open", "active", "enabled", "running", "watering", "mowing", "maeht", "mäht", "an", "aktiv", "laeuft", "läuft"].includes(normalized)) return true;
      if (["off", "false", "0", "no", "nein", "closed", "inactive", "disabled", "idle", "paused", "aus", "inaktiv", "fertig"].includes(normalized)) return false;
      return undefined;
    },

    _gardenFormatNextTime(rawValue) {
      if (isUnavailableGardenValue(rawValue)) return GARDEN_EMPTY_VALUE;
      const raw = String(rawValue ?? "").trim();
      const timestamp = Date.parse(raw);
      if (!Number.isFinite(timestamp)) return raw;
      const date = new Date(timestamp);
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const dayDiff = Math.round((dateDay - nowDay) / dayMs);
      const pad = (value) => String(value).padStart(2, "0");
      const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      if (dayDiff === 0) return `${this._t("garden.today", {}, "today")} ${time}`;
      if (dayDiff === 1) return `${this._t("garden.tomorrow", {}, "tomorrow")} ${time}`;
      const locale = typeof this._language === "function" ? this._language() : undefined;
      return `${date.toLocaleDateString(locale, { weekday: "short" })} ${time}`;
    },

    _gardenStatusLabel(rawValue, fallback = GARDEN_EMPTY_VALUE) {
      if (isUnavailableGardenValue(rawValue)) return fallback;
      const normalized = normalizedGardenText(rawValue).replace(/[\s-]+/g, "_");
      const labels = {
        mowing: "Mäht",
        maeht: "Mäht",
        "mäht": "Mäht",
        watering: "Bewässert",
        running: "Läuft",
        active: "An",
        on: "An",
        open: "An",
        true: "An",
        enabled: "An",
        charging: "Lädt",
        docked: "Angedockt",
        parked: "Parkt",
        idle: "Aus",
        paused: "Pause",
        returning: "Rückkehr",
        inactive: "Aus",
        off: "Aus",
        closed: "Aus",
        false: "Aus",
        disabled: "Aus",
        error: "Fehler",
      };
      return labels[normalized] || String(rawValue).trim();
    },

    _gardenFormatDuration(rawValue, entityUnit = "") {
      if (isUnavailableGardenValue(rawValue)) return GARDEN_EMPTY_VALUE;
      const numericValue = Number(String(rawValue).replace(",", "."));
      const unit = String(entityUnit || "").trim().toLowerCase();
      if (Number.isFinite(numericValue)) {
        if (unit === "ns" || unit.includes("nanosecond") || unit.includes("nanosekunde")) return this._formatDurationSeconds(numericValue / 1000000000) || GARDEN_EMPTY_VALUE;
        if (unit === "ms" || unit.includes("millisecond") || unit.includes("millisekunde")) return this._formatDurationSeconds(numericValue / 1000) || GARDEN_EMPTY_VALUE;
        if (unit.includes("s") && !unit.includes("stunden") && !unit.includes("hour")) return this._formatDurationSeconds(numericValue) || GARDEN_EMPTY_VALUE;
        if (unit.includes("min") || unit === "m") return this._formatDurationMinutes(numericValue) || GARDEN_EMPTY_VALUE;
        if (unit.includes("h") || unit.includes("std") || unit.includes("hour") || unit.includes("stunde")) return this._formatDurationMinutes(numericValue * 60) || GARDEN_EMPTY_VALUE;
        return numericValue > 24 ? this._formatDurationMinutes(numericValue) || GARDEN_EMPTY_VALUE : this._formatDurationMinutes(numericValue * 60) || GARDEN_EMPTY_VALUE;
      }
      return String(rawValue).trim();
    },

    _gardenFormatValue(definition, rawValue, entityUnit = "") {
      if (!definition || isUnavailableGardenValue(rawValue)) return GARDEN_EMPTY_VALUE;
      if (["mower_next_start", "irrigation_next_start"].includes(definition.key)) return this._gardenFormatNextTime(rawValue);
      if (definition.kind === "status") return this._gardenStatusLabel(rawValue);
      if (definition.kind === "boolean") {
        const bool = this._gardenBooleanValueFromRaw(rawValue);
        if (bool === true) return this._t("garden.on", {}, "An");
        if (bool === false) return this._t("garden.off", {}, "Aus");
        return String(rawValue).trim();
      }
      if (definition.kind === "duration") return this._gardenFormatDuration(rawValue, entityUnit);
      if (definition.kind === "percent") {
        const number = this._gardenNumericState(rawValue);
        return Number.isFinite(number) ? `${Math.round(Math.max(0, Math.min(100, number)))}%` : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
      }
      if (definition.kind === "temperature") {
        const number = this._gardenNumericState(rawValue);
        return Number.isFinite(number) && typeof this._formatTemperatureValue === "function"
          ? this._formatTemperatureValue(rawValue, entityUnit || "°C", this.config.units?.temperature || entityUnit || "°C")
          : Number.isFinite(number) ? `${number.toFixed(1)} ${entityUnit || "°C"}` : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
      }
      if (definition.kind === "precipitation") {
        const number = this._gardenNumericState(rawValue);
        return Number.isFinite(number) && typeof this._formatPrecipitationValue === "function"
          ? this._formatPrecipitationValue(rawValue, entityUnit || "mm", this.config.units?.precipitation || entityUnit || "mm")
          : Number.isFinite(number) ? `${number.toFixed(number >= 10 ? 1 : 2)} ${entityUnit || "mm"}` : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
      }
      if (definition.kind === "volume") return this._formatVolumeValue(rawValue, entityUnit || "L", this.config.units?.volume || entityUnit || "L");
      if (definition.kind === "flow") {
        const number = this._gardenNumericState(rawValue);
        return Number.isFinite(number) && typeof this._formatFlowValue === "function"
          ? this._formatFlowValue(rawValue, entityUnit || "L/min", this.config.units?.flow || entityUnit || "L/min")
          : Number.isFinite(number) ? `${number.toFixed(number >= 10 ? 1 : 2)} ${entityUnit || "L/min"}` : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
      }
      if (definition.kind === "pressure") {
        const number = this._gardenNumericState(rawValue);
        return Number.isFinite(number) && typeof this._formatPressureValue === "function"
          ? this._formatPressureValue(rawValue, entityUnit || "bar", this.config.units?.pressure || entityUnit || "bar")
          : Number.isFinite(number) ? `${number.toFixed(1)} ${entityUnit || "bar"}` : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
      }
      return `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
    },

    _gardenFieldState(definition) {
      const entityId = this._gardenEntityId(definition.key);
      const rawValue = entityId ? this._getEntityValue(entityId, undefined) : undefined;
      const unit = entityId ? this._getEntityUnit(entityId) || "" : "";
      return {
        key: definition.key,
        entityId,
        label: this._t(definition.labelKey, {}, definition.label),
        value: this._gardenFormatValue(definition, rawValue, unit),
        configured: Boolean(entityId),
      };
    },

    _gardenConfiguredFields({ placement } = {}) {
      return GARDEN_ENTITY_DEFINITIONS
        .map((definition) => ({ definition, state: this._gardenFieldState(definition) }))
        .filter((item) => item.state.configured && item.state.value !== GARDEN_EMPTY_VALUE)
        .filter((item) => !placement || this._gardenDisplayVisibility(item.definition.key)[placement] !== false);
    },

    _gardenDefaultImageVisibility(key) {
      if (key === "garden_water") {
        return !this._gardenFieldState(this._gardenDefinition("irrigation_enabled")).configured;
      }
      if (key === "irrigation_enabled") {
        return this._gardenFieldState(this._gardenDefinition("irrigation_enabled")).configured;
      }
      return DEFAULT_GARDEN_IMAGE_BADGES.has(key);
    },

    _gardenDisplayVisibility(key) {
      const configured = this._gardenConfig().display?.[key] || {};
      return {
        image: configured.image !== undefined ? configured.image !== false : this._gardenDefaultImageVisibility(key),
        footer: configured.footer !== undefined ? configured.footer !== false : !DEFAULT_GARDEN_FOOTER_HIDDEN_FIELDS.has(key),
      };
    },

    _gardenImagePath() {
      const gardenConfig = this._gardenConfig();
      if (typeof this._isDaylight === "function") {
        if (this._isDaylight() && gardenConfig.day_image) return gardenConfig.day_image;
        if (!this._isDaylight() && gardenConfig.night_image) return gardenConfig.night_image;
      }
      return gardenConfig.image;
    },

    _gardenImageUrls(path = this._gardenImagePath()) {
      const value = String(path || DEFAULT_GARDEN_IMAGE).trim() || DEFAULT_GARDEN_IMAGE;
      const defaultValue = DEFAULT_GARDEN_IMAGE;
      const values = [value, ...(value === defaultValue ? [] : [defaultValue])];
      const urls = values.flatMap((item) => {
        if (/^(?:https?:)?\/\//i.test(item) || item.startsWith("/") || item.startsWith("data:")) return [item];
        const withoutImagesPrefix = item.replace(/^images\//, "");
        const candidates = [item, withoutImagesPrefix]
          .flatMap((candidate) => (typeof this._imageFormatFiles === "function" ? this._imageFormatFiles(candidate) : [candidate]))
          .filter(Boolean);
        return candidates.flatMap((candidate) => {
          const normalized = candidate.replace(/^images\//, "");
          const localCandidates = [
            `images/${normalized}`,
            candidate,
          ];
          const resolved = [
            typeof this._remoteImageUrl === "function" ? this._remoteImageUrl(normalized) : "",
            `/hacsfiles/ha-solar-dashboard/images/${normalized}`,
            `/hacsfiles/ha-solar-dashboard/${normalized}`,
            `/local/community/ha-solar-dashboard/images/${normalized}`,
            `/local/community/ha-solar-dashboard/${normalized}`,
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

    _gardenImageUrl(path = this._gardenImagePath()) {
      const [src] = this._gardenImageUrls(path);
      if (src) return src;
      const value = String(path || DEFAULT_GARDEN_IMAGE).trim() || DEFAULT_GARDEN_IMAGE;
      try {
        return assetUrl(value);
      } catch (_err) {
        return value;
      }
    },

    _gardenAccent(groupOrKind = "") {
      if (groupOrKind === "mower") return "#34d399";
      if (groupOrKind === "weather") return "#38bdf8";
      if (groupOrKind === "water") return "#1f8fff";
      if (groupOrKind === "equipment") return "#f59e0b";
      return "#2dd4bf";
    },

    _gardenHeroBadgePosition(definitionKey) {
      const positionKey = GARDEN_HERO_BADGE_POSITION_KEYS[definitionKey] || (definitionKey.startsWith("garden_") ? definitionKey : `garden_${definitionKey}`);
      const fallback = GARDEN_HERO_BADGE_POSITIONS[definitionKey] || { left: 50, top: 50 };
      const configured = this.config.positions?.[positionKey] || {};
      return {
        left: normalizeGardenBadgeCoordinate(configured.left, fallback.left),
        top: normalizeGardenBadgeCoordinate(configured.top, fallback.top),
      };
    },

    _renderGardenHeroBadge(definitionKey, className = "") {
      const definition = this._gardenDefinition(definitionKey);
      if (!definition) return "";
      const state = this._gardenFieldState(definition);
      if (!state.configured || state.value === GARDEN_EMPTY_VALUE) return "";
      const position = this._gardenHeroBadgePosition(definitionKey);
      const bool = this._gardenBooleanValueFromRaw(this._gardenRawValue(definitionKey));
      const canToggle = ["switch", "input_boolean"].includes(gardenEntityDomain(state.entityId));
      const actionAttr = canToggle
        ? ` data-entity-toggle="${this._escape(state.entityId)}" tabindex="0" role="button"`
        : state.entityId ? ` data-more-info="${this._escape(state.entityId)}" tabindex="0" role="button"` : "";
      const glow = bool === true ? "rgba(52,211,153,.45)" : "transparent";
      const accent = bool === false ? "#9ba3b8" : this._gardenAccent(definition.group);
      return `
        <div class="garden-badge ${this._escape(className)}" style="left:${this._escape(position.left)}%;top:${this._escape(position.top)}%;--tile-accent:${this._escape(accent)};--tile-glow:${this._escape(glow)}"${actionAttr}>
          <span>${this._escape(state.label)}</span>
          <strong data-garden-value="${this._escape(state.key)}">${this._escape(state.value)}</strong>
        </div>
      `;
    },

    _renderGardenMetricTile(item) {
      const { definition, state } = item;
      const entityTitle = state.entityId ? `${state.label}: ${state.entityId}` : state.label;
      const toggleDomains = new Set(["switch", "input_boolean", "automation"]);
      const domain = gardenEntityDomain(state.entityId);
      const actionAttr = toggleDomains.has(domain)
        ? ` data-entity-toggle="${this._escape(state.entityId)}" tabindex="0" role="button"`
        : state.entityId ? ` data-more-info="${this._escape(state.entityId)}" tabindex="0" role="button"` : "";
      return `
        <div class="garden-tile" title="${this._escape(entityTitle)}" style="--tile-accent:${this._escape(this._gardenAccent(definition.group))}"${actionAttr}>
          <span>${this._escape(state.label)}</span>
          <strong>${this._escape(state.value)}</strong>
        </div>
      `;
    },

    _gardenZones() {
      return (this._gardenConfig().zones || []).filter((zone) => zone.visible !== false);
    },

    _gardenManualActions() {
      return (this._gardenConfig().manual_actions || []).filter((action) => action.visible !== false);
    },

    _gardenZoneIsOn(zone) {
      if (!zone?.entity) return false;
      return this._gardenBooleanValueFromRaw(this._getEntityValue(zone.entity, undefined)) === true;
    },

    _gardenZonePlanValue(zone) {
      if (!zone) return "";
      if (zone.plan_entity) {
        const value = this._getEntityValue(zone.plan_entity, undefined);
        return isUnavailableGardenValue(value) ? "" : this._gardenFormatNextTime(value);
      }
      return zone.plan_text || "";
    },

    _renderGardenZoneBadge(zone) {
      if (!zone?.entity) return "";
      const active = this._gardenZoneIsOn(zone);
      const value = active ? this._t("garden.zoneRunning", {}, "Running") : this._t("garden.off", {}, "Off");
      const glow = active ? zone.glow || "rgba(52,211,153,.55)" : "transparent";
      const actionAttr = zone.toggle
        ? ` data-entity-toggle="${this._escape(zone.entity)}" tabindex="0" role="button"`
        : ` data-more-info="${this._escape(zone.entity)}" tabindex="0" role="button"`;
      return `
        <div class="garden-badge garden-zone-badge" style="left:${this._escape(zone.left)}%;top:${this._escape(zone.top)}%;--tile-accent:${this._escape(active ? zone.color : "#9ba3b8")};--tile-glow:${this._escape(glow)}"${actionAttr}>
          <span>${this._escape(zone.short || zone.label)}</span>
          <strong>${this._escape(value)}</strong>
          <div class="metric-meter"><span style="width:${active ? 100 : 0}%"></span></div>
        </div>
      `;
    },

    _renderGardenZoneTile(zone) {
      if (!zone?.entity) return "";
      const active = this._gardenZoneIsOn(zone);
      const value = active ? this._t("garden.zoneRunning", {}, "Running") : this._t("garden.off", {}, "Off");
      const plan = this._gardenZonePlanValue(zone);
      const actionAttr = zone.toggle
        ? ` data-entity-toggle="${this._escape(zone.entity)}" tabindex="0" role="button"`
        : ` data-more-info="${this._escape(zone.entity)}" tabindex="0" role="button"`;
      return `
        <div class="garden-tile garden-zone-tile" title="${this._escape(`${zone.label}: ${zone.entity}`)}" style="--tile-accent:${this._escape(active ? zone.color : "#9ba3b8")};--tile-glow:${this._escape(active ? zone.glow || "rgba(52,211,153,.35)" : "transparent")}"${actionAttr}>
          <span>${this._escape(zone.label)}</span>
          <strong>${this._escape(value)}</strong>
          ${plan ? `<small class="garden-tile-note">${this._escape(plan)}</small>` : ""}
          <div class="metric-meter"><span style="width:${active ? 100 : 0}%"></span></div>
        </div>
      `;
    },

    _renderGardenManualAction(action) {
      if (!action?.entity) return "";
      const caption = action.caption || this._t("garden.manualAction", {}, "Manual action");
      return `
        <button type="button" class="garden-tile garden-action-tile" style="--tile-accent:${this._escape(action.color)}" data-call-service-entity="${this._escape(action.entity)}" data-confirm="${this._escape(action.confirm_text || "")}">
          <span>${this._escape(caption)}</span>
          <strong>${this._escape(action.label)}</strong>
        </button>
      `;
    },

    _gardenActiveZone() {
      return this._gardenZones().find((zone) => this._gardenZoneIsOn(zone));
    },

    _gardenStatusText({ imageOnly = false } = {}) {
      const activeZone = this._gardenActiveZone();
      if (activeZone) return this._t("garden.zoneWatering", { zone: activeZone.short || activeZone.label }, `${activeZone.short || activeZone.label} watering`);
      const statusText = this._gardenFieldState(this._gardenDefinition("irrigation_status_text"));
      if (
        statusText.configured
        && statusText.value !== GARDEN_EMPTY_VALUE
        && (!imageOnly || this._gardenDisplayVisibility("irrigation_status_text").image)
      ) return statusText.value;
      const gardenWater = this._gardenFieldState(this._gardenDefinition("garden_water"));
      if (
        gardenWater.configured
        && gardenWater.value !== GARDEN_EMPTY_VALUE
        && (!imageOnly || this._gardenDisplayVisibility("garden_water").image)
      ) return gardenWater.value;
      return "";
    },

    _renderGardenDashboard() {
      const gardenConfig = this._gardenConfig();
      const configuredFields = this._gardenConfiguredFields();
      const [imageSrc, ...imageFallbacks] = this._gardenImageUrls();
      const title = gardenConfig.title || this._t("garden.title", {}, "Garten");
      const mower = this._gardenFieldState(this._gardenDefinition("mower_status"));
      const gardenWater = this._gardenFieldState(this._gardenDefinition("garden_water"));
      const irrigationEnabled = this._gardenFieldState(this._gardenDefinition("irrigation_enabled"));
      const statusText = this._gardenStatusText();
      const imageStatusText = this._gardenStatusText({ imageOnly: true });
      const stateLabel = statusText
        || (irrigationEnabled.configured && irrigationEnabled.value !== GARDEN_EMPTY_VALUE
          ? irrigationEnabled.value
          : mower.configured && mower.value !== GARDEN_EMPTY_VALUE
            ? mower.value
            : this._t("garden.ready", {}, "Bereit"));
      const heroBadges = [
        ...this._gardenConfiguredFields({ placement: "image" })
          .filter((item) => item.definition.key !== "irrigation_status_text")
          .map((item) => this._renderGardenHeroBadge(item.definition.key, `garden-badge-${item.definition.key}`)),
        ...this._gardenZones().map((zone) => this._renderGardenZoneBadge(zone)),
      ].join("");
      const configuredFieldItems = this._gardenConfiguredFields({ placement: "footer" });
      const groups = GARDEN_GROUPS.map((group) => {
        const items = configuredFieldItems.filter((item) => item.definition.group === group.key);
        if (items.length === 0) return "";
        return `
          <section class="garden-section">
            <div class="garden-section-title">${this._escape(this._t(group.labelKey, {}, group.label))}</div>
            <div class="garden-grid">
              ${items.map((item) => this._renderGardenMetricTile(item)).join("")}
            </div>
          </section>
        `;
      }).join("");
      const zoneTiles = this._gardenZones().length > 0
        ? `
          <section class="garden-section">
            <div class="garden-section-title">${this._escape(this._t("garden.groupZones", {}, "Irrigation zones"))}</div>
            <div class="garden-grid garden-zone-grid">${this._gardenZones().map((zone) => this._renderGardenZoneTile(zone)).join("")}</div>
          </section>
        `
        : "";
      const actionTiles = this._gardenManualActions().length > 0
        ? `
          <section class="garden-section">
            <div class="garden-section-title">${this._escape(this._t("garden.groupActions", {}, "Manual actions"))}</div>
            <div class="garden-grid garden-action-grid">${this._gardenManualActions().map((action) => this._renderGardenManualAction(action)).join("")}</div>
          </section>
        `
        : "";
      const empty = configuredFields.length === 0 && !zoneTiles && !actionTiles
        ? `<div class="garden-empty">${this._escape(this._t("garden.empty", {}, "Keine Garten-Entitäten konfiguriert."))}</div>`
        : "";

      return `
        <section class="garden-dashboard" data-garden-dashboard>
          <div class="garden-head">
            <div>
              <div class="chart-dashboard-label">${this._escape(this._t("view.garden", {}, "Garten"))}</div>
              <h2>${this._escape(title)}</h2>
              <p>${this._escape(this._t("garden.subtitle", {}, "Gartenwasser, Wetter, Mäher und Gartengeräte"))}</p>
            </div>
            <span>${this._escape(stateLabel)}</span>
          </div>
          <div class="garden-hero">
            <img class="garden-image" src="${this._escape(imageSrc)}" data-fallbacks="${this._escape(imageFallbacks.join("|"))}" alt="${this._escape(title)}" />
            <div class="garden-overlay">
              ${heroBadges}
            </div>
            ${imageStatusText ? `<div class="scene-status garden-scene-status">${this._escape(imageStatusText)}</div>` : ""}
          </div>
          ${empty || `${zoneTiles}${actionTiles}${groups}`}
        </section>
      `;
    },
  };
}
