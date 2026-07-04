export const DEFAULT_GARDEN_IMAGE = "images/single_family_home_top_view_garden.png";

export const GARDEN_ENTITY_DEFINITIONS = Object.freeze([
  Object.freeze({ key: "mower_status", labelKey: "garden.mowerStatus", label: "Mäher", group: "mower", kind: "status", aliases: ["mower", "mower_status", "maeher_status", "mower_activity", "lawn_mower_status", "robot_mower_status"] }),
  Object.freeze({ key: "mower_battery", labelKey: "garden.mowerBattery", label: "Mäher Akku", group: "mower", kind: "percent", aliases: ["mower_battery", "maeher_battery", "maeher_akku", "robot_mower_battery"] }),
  Object.freeze({ key: "mower_next_start", labelKey: "garden.mowerNextStart", label: "Nächster Mähstart", group: "mower", kind: "text", aliases: ["mower_next_start", "maeher_next_start", "mower_schedule", "robot_mower_next_start"] }),
  Object.freeze({ key: "mower_error", labelKey: "garden.mowerError", label: "Mäher Fehler", group: "mower", kind: "text", aliases: ["mower_error", "maeher_error", "robot_mower_error"] }),
  Object.freeze({ key: "garden_water", labelKey: "garden.gardenWater", label: "Gartenwasser", group: "water", kind: "status", aliases: ["garden_water", "gartenwasser", "garden_water_status", "gartenwasser_status", "irrigation_status", "watering_status", "bewasserung_status", "bewaesserung_status", "sprinkler_status"] }),
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
    entities: normalizeGardenEntities(entities),
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
        docked: "Docked",
        parked: "Parkt",
        idle: "Aus",
        paused: "Pause",
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
        return Number.isFinite(number) ? `${number.toFixed(1)} ${entityUnit || "°C"}` : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
      }
      if (definition.kind === "precipitation") {
        const number = this._gardenNumericState(rawValue);
        return Number.isFinite(number) ? `${number.toFixed(number >= 10 ? 1 : 2)} ${entityUnit || "mm"}` : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
      }
      if (definition.kind === "volume") return this._formatVolumeValue(rawValue, entityUnit || "L", entityUnit || "L");
      if (definition.kind === "flow") {
        const number = this._gardenNumericState(rawValue);
        return Number.isFinite(number) ? `${number.toFixed(number >= 10 ? 1 : 2)} ${entityUnit || "L/min"}` : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
      }
      if (definition.kind === "pressure") {
        const number = this._gardenNumericState(rawValue);
        return Number.isFinite(number) ? `${number.toFixed(1)} ${entityUnit || "bar"}` : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
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

    _gardenConfiguredFields() {
      return GARDEN_ENTITY_DEFINITIONS
        .map((definition) => ({ definition, state: this._gardenFieldState(definition) }))
        .filter((item) => item.state.configured && item.state.value !== GARDEN_EMPTY_VALUE);
    },

    _gardenImageUrls(path = this._gardenConfig().image) {
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

    _gardenImageUrl(path = this._gardenConfig().image) {
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

    _renderGardenHeroBadge(definitionKey, className = "") {
      const definition = this._gardenDefinition(definitionKey);
      if (!definition) return "";
      const state = this._gardenFieldState(definition);
      if (!state.configured || state.value === GARDEN_EMPTY_VALUE) return "";
      return `
        <div class="garden-badge ${this._escape(className)}" style="--tile-accent:${this._escape(this._gardenAccent(definition.group))}">
          <span>${this._escape(state.label)}</span>
          <strong data-garden-value="${this._escape(state.key)}">${this._escape(state.value)}</strong>
        </div>
      `;
    },

    _renderGardenMetricTile(item) {
      const { definition, state } = item;
      const entityTitle = state.entityId ? `${state.label}: ${state.entityId}` : state.label;
      return `
        <div class="garden-tile" title="${this._escape(entityTitle)}" style="--tile-accent:${this._escape(this._gardenAccent(definition.group))}">
          <span>${this._escape(state.label)}</span>
          <strong>${this._escape(state.value)}</strong>
        </div>
      `;
    },

    _renderGardenDashboard() {
      const gardenConfig = this._gardenConfig();
      const configuredFields = this._gardenConfiguredFields();
      const [imageSrc, ...imageFallbacks] = this._gardenImageUrls(gardenConfig.image);
      const title = gardenConfig.title || this._t("garden.title", {}, "Garten");
      const mower = this._gardenFieldState(this._gardenDefinition("mower_status"));
      const gardenWater = this._gardenFieldState(this._gardenDefinition("garden_water"));
      const irrigationEnabled = this._gardenFieldState(this._gardenDefinition("irrigation_enabled"));
      const stateLabel = gardenWater.configured && gardenWater.value !== GARDEN_EMPTY_VALUE
        ? gardenWater.value
        : irrigationEnabled.configured && irrigationEnabled.value !== GARDEN_EMPTY_VALUE
          ? irrigationEnabled.value
        : mower.configured && mower.value !== GARDEN_EMPTY_VALUE
          ? mower.value
          : this._t("garden.ready", {}, "Bereit");
      const heroBadges = [
        this._renderGardenHeroBadge("mower_status", "garden-badge-mower"),
        this._renderGardenHeroBadge("garden_water", "garden-badge-water"),
        this._renderGardenHeroBadge("rain_24h", "garden-badge-rain"),
        this._renderGardenHeroBadge("soil_moisture", "garden-badge-soil"),
      ].join("");
      const groups = GARDEN_GROUPS.map((group) => {
        const items = configuredFields.filter((item) => item.definition.group === group.key);
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
      const empty = configuredFields.length === 0
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
          </div>
          ${empty || groups}
        </section>
      `;
    },
  };
}
