const ADVISOR_DEFAULTS = Object.freeze({
  surplusThreshold: 250,
  importThreshold: 250,
  highLoadThreshold: 3000,
  evSurplusThreshold: 1500,
  maxSuggestions: 8,
  staleSensorWarningMinutes: 30,
  staleSensorCriticalMinutes: 1440,
});

const ADVISOR_TYPE_RANKS = Object.freeze({
  critical: 4,
  warning: 3,
  info: 2,
  setup: 2,
  opportunity: 1,
  success: 0,
});

function clampNumber(value, fallback, min = -Infinity, max = Infinity) {
  const numericValue = Number(value);
  const baseValue = Number.isFinite(numericValue) ? numericValue : fallback;
  return Math.min(max, Math.max(min, baseValue));
}

function normalizeAdvisorConfig(config = {}) {
  const staleSensorWarningMinutes = clampNumber(
    config.advisor_stale_sensor_warning_minutes,
    ADVISOR_DEFAULTS.staleSensorWarningMinutes,
    1,
    10080,
  );
  return {
    advisor_surplus_threshold: clampNumber(config.advisor_surplus_threshold, ADVISOR_DEFAULTS.surplusThreshold, 0, 1000000),
    advisor_import_threshold: clampNumber(config.advisor_import_threshold, ADVISOR_DEFAULTS.importThreshold, 0, 1000000),
    advisor_high_load_threshold: clampNumber(config.advisor_high_load_threshold, ADVISOR_DEFAULTS.highLoadThreshold, 0, 1000000),
    advisor_ev_surplus_threshold: clampNumber(config.advisor_ev_surplus_threshold, ADVISOR_DEFAULTS.evSurplusThreshold, 0, 1000000),
    advisor_max_suggestions: Math.round(clampNumber(config.advisor_max_suggestions, ADVISOR_DEFAULTS.maxSuggestions, 1, 12)),
    advisor_stale_sensor_warning_minutes: staleSensorWarningMinutes,
    advisor_stale_sensor_critical_minutes: clampNumber(
      config.advisor_stale_sensor_critical_minutes,
      ADVISOR_DEFAULTS.staleSensorCriticalMinutes,
      Math.max(ADVISOR_DEFAULTS.staleSensorCriticalMinutes, staleSensorWarningMinutes),
      20160,
    ),
  };
}

function advisorThresholds(config = {}) {
  const normalized = normalizeAdvisorConfig(config);
  return {
    surplusThreshold: normalized.advisor_surplus_threshold,
    importThreshold: normalized.advisor_import_threshold,
    highLoadThreshold: normalized.advisor_high_load_threshold,
    evSurplusThreshold: normalized.advisor_ev_surplus_threshold,
    maxSuggestions: normalized.advisor_max_suggestions,
    staleSensorWarningMinutes: normalized.advisor_stale_sensor_warning_minutes,
    staleSensorCriticalMinutes: normalized.advisor_stale_sensor_critical_minutes,
  };
}

function advisorSuggestionLimit(config = {}) {
  return normalizeAdvisorConfig(config).advisor_max_suggestions;
}

function advisorTypeRank(type) {
  return ADVISOR_TYPE_RANKS[type] ?? ADVISOR_TYPE_RANKS.info;
}

function sortAdvisorItems(items = []) {
  return [...items].sort((a, b) => (
    advisorTypeRank(b.type) - advisorTypeRank(a.type)
  ) || ((b.priority ?? 0) - (a.priority ?? 0)));
}

const ENERGY_RANGE_KEYS = new Set(["live", "1h", "24h", "month", "year", "total"]);

function normalizeConfigId(value, fallback) {
  const id = String(value || fallback || "").trim().replace(/[^\w-]+/g, "_");
  return id || String(fallback || "item").replace(/[^\w-]+/g, "_");
}

function clampConfigNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeEnergyRange(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "hour" || normalized === "hourly" || normalized === "1hr" || normalized === "60m") return "1h";
  if (normalized === "day" || normalized === "today" || normalized === "daily" || normalized === "24hr") return "24h";
  if (normalized === "monthly") return "month";
  if (normalized === "yearly") return "year";
  if (normalized === "all" || normalized === "overall" || normalized === "lifetime") return "total";
  return ENERGY_RANGE_KEYS.has(normalized) ? normalized : undefined;
}

function createConfigNormalizerMethods({
  normalizeViewMode,
} = {}) {
  return {
    _normalizeEnergyRange(value) {
      return normalizeEnergyRange(value);
    },

    _normalizeViewMode(value) {
      return normalizeViewMode(value);
    },

    _normalizeCustomKpis(kpis) {
      if (!Array.isArray(kpis)) return [];
      return kpis
        .map((kpi, index) => {
          if (!kpi || typeof kpi !== "object") return undefined;
          const id = String(kpi.id || kpi.key || `kpi_${index + 1}`).trim().replace(/[^\w-]/g, "_");
          const label = String(kpi.label || kpi.name || `KPI ${index + 1}`).trim();
          const position = this._clampNumber(kpi.position ?? kpi.order ?? 100 + index, 100 + index, 0, 999);
          const columns = Math.round(this._clampNumber(kpi.columns ?? kpi.span ?? 1, 1, 1, 6));
          return {
            id,
            label,
            entity: String(kpi.entity || kpi.entity_id || "").trim(),
            value: kpi.value ?? "",
            unit: kpi.unit ?? "auto",
            position,
            columns,
            color: this._safeCssColor(kpi.color, "#1f8fff"),
            glow: kpi.glow,
            visible: kpi.visible !== false,
          };
        })
        .filter(Boolean);
    },

    _normalizeEnvironmentSensors(sensors) {
      const source = Array.isArray(sensors)
        ? sensors
        : sensors && typeof sensors === "object"
          ? Object.entries(sensors).map(([id, sensor]) => (
            typeof sensor === "string"
              ? { id, entity: sensor }
              : { id, ...(sensor || {}) }
          ))
          : [];
      return source
        .map((sensor, index) => {
          if (!sensor || typeof sensor !== "object") return undefined;
          const id = String(sensor.id || sensor.key || sensor.entity || `environment_${index + 1}`).trim().replace(/[^\w-]/g, "_");
          const position = this._clampNumber(sensor.position ?? sensor.order ?? 300 + index, 300 + index, 0, 999);
          const columns = Math.round(this._clampNumber(sensor.columns ?? sensor.span ?? 1, 1, 1, 6));
          const left = this._clampNumber(sensor.left ?? sensor.x, 50, 0, 100);
          const top = this._clampNumber(sensor.top ?? sensor.y, 50, 0, 100);
          return {
            id,
            label: String(sensor.label || sensor.name || "").trim(),
            entity: String(sensor.entity || sensor.entity_id || sensor.sensor || "").trim(),
            type: String(sensor.type || sensor.sensor_type || sensor.kind || "custom").trim() || "custom",
            unit: sensor.unit ?? "auto",
            position,
            columns,
            left,
            top,
            color: this._safeCssColor(sensor.color, "#34d399"),
            glow: sensor.glow,
            visible: sensor.visible !== false,
            show_footer: sensor.show_footer ?? sensor.footer ?? true,
            show_image: sensor.show_image ?? sensor.image ?? false,
          };
        })
        .filter(Boolean);
    },

    _floorplanSensorType(type = "indoor") {
      const types = {
        indoor: { label: this._t("environment.templateIndoor", {}, "Indoor temperature"), color: "#34d399" },
        outdoor: { label: this._t("environment.templateOutdoor", {}, "Outdoor temperature"), color: "#60a5fa" },
        hot_water: { label: this._t("environment.templateHotWater", {}, "Hot water"), color: "#fb923c" },
        humidity: { label: this._t("environment.templateHumidity", {}, "Humidity"), color: "#22c55e" },
        pressure: { label: this._t("environment.templatePressure", {}, "Pressure"), color: "#a78bfa" },
        air_quality: { label: this._t("environment.templateAirQuality", {}, "Air quality"), color: "#f87171" },
        custom: { label: this._t("environment.templateCustom", {}, "Custom"), color: "#34d399" },
      };
      return types[type] || types.indoor;
    },

    _normalizeFloorplanMode(value = "editor") {
      const mode = String(value || "").trim().toLowerCase();
      return ["image", "picture", "bild"].includes(mode) ? "image" : "editor";
    },

    _floorplanFloorLabel(index = 0) {
      return this._t("floorplan.level", { index: index + 1 }, `Level ${index + 1}`);
    },

    _normalizeFloorplanRoom(room, index = 0) {
      if (!room || typeof room !== "object") return undefined;
      return {
        id: normalizeConfigId(room.id || room.key, `room_${index + 1}`),
        label: String(room.label || room.name || this._t("floorplan.room", { index: index + 1 }, `Room ${index + 1}`)).trim(),
        x: this._clampNumber(room.x, 10 + index * 4, 0, 100),
        y: this._clampNumber(room.y, 10 + index * 4, 0, 70),
        width: this._clampNumber(room.width ?? room.w, 24, 3, 100),
        height: this._clampNumber(room.height ?? room.h, 18, 3, 70),
        color: this._safeCssColor(room.color, "#1f8fff"),
      };
    },

    _normalizeFloorplanWall(wall, index = 0) {
      if (!wall || typeof wall !== "object") return undefined;
      return {
        id: normalizeConfigId(wall.id || wall.key, `wall_${index + 1}`),
        x1: this._clampNumber(wall.x1 ?? wall.from_x, 12, 0, 100),
        y1: this._clampNumber(wall.y1 ?? wall.from_y, 12, 0, 70),
        x2: this._clampNumber(wall.x2 ?? wall.to_x, 36, 0, 100),
        y2: this._clampNumber(wall.y2 ?? wall.to_y, 12, 0, 70),
        width: this._clampNumber(wall.width ?? wall.stroke_width, 1.2, 0.2, 5),
        color: this._safeCssColor(wall.color, "#dbeafe"),
      };
    },

    _normalizeFloorplanSensor(sensor, index = 0) {
      if (!sensor || typeof sensor !== "object") return undefined;
      const type = String(sensor.type || sensor.sensor_type || sensor.kind || "indoor").trim() || "indoor";
      return {
        id: normalizeConfigId(sensor.id || sensor.key || sensor.entity || sensor.environment_sensor, `sensor_${index + 1}`),
        label: String(sensor.label || sensor.name || "").trim(),
        entity: String(sensor.entity || sensor.entity_id || "").trim(),
        environment_sensor: String(sensor.environment_sensor || sensor.environmentSensor || "").trim(),
        type,
        unit: sensor.unit ?? "auto",
        x: this._clampNumber(sensor.x ?? sensor.left, 50, 0, 100),
        y: this._clampNumber(sensor.y ?? sensor.top, 35, 0, 70),
        color: this._safeCssColor(sensor.color, this._floorplanSensorType(type).color),
        visible: sensor.visible !== false,
        show_label: sensor.show_label !== false && sensor.label_visible !== false && sensor.showLabel !== false,
        font_size: this._clampNumber(sensor.font_size ?? sensor.fontSize ?? sensor.text_size ?? sensor.textSize, 3.05, 1.4, 8),
      };
    },

    _normalizeFloorplanFloor(floor = {}, index = 0) {
      const source = floor && typeof floor === "object" ? floor : {};
      return {
        id: normalizeConfigId(source.id || source.key, `level_${index + 1}`),
        label: String(source.label || source.name || this._floorplanFloorLabel(index)).trim(),
        image: String(source.image || source.image_path || source.background_image || "").trim(),
        rooms: (Array.isArray(source.rooms) ? source.rooms : []).map((room, roomIndex) => this._normalizeFloorplanRoom(room, roomIndex)).filter(Boolean),
        walls: (Array.isArray(source.walls) ? source.walls : []).map((wall, wallIndex) => this._normalizeFloorplanWall(wall, wallIndex)).filter(Boolean),
        sensors: (Array.isArray(source.sensors) ? source.sensors : []).map((sensor, sensorIndex) => this._normalizeFloorplanSensor(sensor, sensorIndex)).filter(Boolean),
      };
    },

    _normalizeFloorplan(floorplan = {}) {
      const source = floorplan && typeof floorplan === "object" ? floorplan : {};
      const mode = this._normalizeFloorplanMode(source.mode || source.type || source.source || source.layout_type || "editor");
      const fallbackFloor = {
        id: source.active_floor || source.activeFloor || source.floor_id || "level_1",
        label: source.floor_label || source.label || this._floorplanFloorLabel(0),
        image: source.image || source.image_path || source.background_image || "",
        rooms: Array.isArray(source.rooms) ? source.rooms : [],
        walls: Array.isArray(source.walls) ? source.walls : [],
        sensors: Array.isArray(source.sensors) ? source.sensors : [],
      };
      const floors = (Array.isArray(source.floors) && source.floors.length > 0 ? source.floors : [fallbackFloor])
        .map((floor, index) => this._normalizeFloorplanFloor(floor, index))
        .filter(Boolean);
      const normalizedFloors = floors.length ? floors : [this._normalizeFloorplanFloor(fallbackFloor, 0)];
      const requestedActiveFloor = String(this._activeFloorplanFloorId || source.active_floor || source.activeFloor || source.selected_floor || normalizedFloors[0].id || "level_1");
      const activeFloor = normalizedFloors.find((floor) => floor.id === requestedActiveFloor) || normalizedFloors[0];
      return {
        mode,
        show_grid: source.show_grid !== false,
        active_floor: activeFloor.id,
        floors: normalizedFloors,
        image: normalizedFloors[0].image,
        rooms: normalizedFloors[0].rooms,
        walls: normalizedFloors[0].walls,
        sensors: normalizedFloors[0].sensors,
      };
    },
  };
}

const DEFAULT_CURRENCY = "€";
const DEFAULT_EV_IMAGE_PATH = "images/car_image.png";
const DEFAULT_GARDEN_IMAGE_PATH = "images/single_family_home_top_view_garden.png";

const DEFAULT_GRID_FINANCE_CONFIG = Object.freeze({
  grid_import_price: "",
  grid_export_price: "",
  currency: DEFAULT_CURRENCY,
  show_grid_daily_finance: true,
});

function createDefaultFloorplan(label = "Level 1") {
  return {
    mode: "editor",
    show_grid: true,
    active_floor: "level_1",
    floors: [{ id: "level_1", label, image: "", rooms: [], walls: [], sensors: [] }],
  };
}

function createDefaultImageOverlays() {
  return {
    smoke: { enabled: false, entity: "", period: "1h" },
    heatpump: { enabled: false, entity: "" },
  };
}

function createDefaultUnits() {
  return {
    power: "auto",
    battery: "%",
    volume: "m³",
  };
}

function createDefaultElectricVehicleConfig() {
  return {
    title: "",
    image: DEFAULT_EV_IMAGE_PATH,
    wallbox: "wallbox_power",
    entities: {},
  };
}

function createDefaultGardenConfig() {
  return {
    title: "",
    image: DEFAULT_GARDEN_IMAGE_PATH,
    entities: {},
  };
}

function createStubUnits() {
  return {
    ...createDefaultUnits(),
    water_meter: "m³",
  };
}

function createDefaultMaxPowerKw() {
  return {
    pv_roof_power: 10,
    pv_shed_power: 3,
    pv_total_power: 13,
    inverter_power: 10,
    wallbox_power: 11,
    wallbox2_power: 11,
    import_export_power: 10,
  };
}

function createDefaultVisibleBoxes() {
  return {
    pv_roof_power: true,
    pv_shed_power: true,
    battery_level: true,
    inverter_power: true,
    wallbox_power: true,
    wallbox2_power: false,
    water_meter: false,
    import_export_power: true,
  };
}

function createStubEntities() {
  return {
    pv_roof_power: "sensor.pv_roof_power",
    pv_roof_power_today_energy: "",
    pv_roof_power_forecast_today: "",
    pv_roof_power_peak_today: "",
    pv_shed_power: "sensor.pv_shed_power",
    pv_shed_power_today_energy: "",
    pv_shed_power_forecast_today: "",
    pv_shed_power_peak_today: "",
    battery_level: "sensor.battery_level",
    battery_min_soc: "",
    battery_max_soc: "",
    battery_flow_power: "",
    battery_flow_power_voltage: "",
    battery_charge_power: "",
    battery_discharge_power: "",
    battery_temperature: "",
    battery_cycles_today: "",
    inverter_power: "sensor.wechselrichter_power",
    inverter_power_voltage: "",
    inverter_power_voltage_l1: "",
    inverter_power_voltage_l2: "",
    inverter_power_voltage_l3: "",
    wallbox_power: "sensor.wallbox_power",
    wallbox_power_voltage: "",
    wallbox_phase: "",
    wallbox_phase_action: "",
    wallbox_phase_remaining: "",
    wallbox_soc: "",
    wallbox_max_soc: "",
    wallbox_connected: "",
    wallbox_charging_enabled: "",
    wallbox_remaining_time: "",
    wallbox2_power: "",
    wallbox2_power_voltage: "",
    wallbox2_phase: "",
    wallbox2_phase_action: "",
    wallbox2_phase_remaining: "",
    wallbox2_soc: "",
    wallbox2_max_soc: "",
    wallbox2_connected: "",
    wallbox2_charging_enabled: "",
    wallbox2_remaining_time: "",
    water_meter: "",
    electricity_price: "",
    pv_total_power: "sensor.pv_total_power",
    pv_total_power_voltage: "",
    pv_total_power_today_energy: "",
    pv_total_power_forecast_today: "",
    pv_total_power_peak_today: "",
    import_export_power: "sensor.grid_power",
    import_export_power_voltage: "",
    import_power: "",
    export_power: "",
    pv_roof_power_voltage: "",
    pv_shed_power_voltage: "",
    house_consumption_power_voltage: "",
  };
}

function createBaseCardConfig({
  advisorDefaults,
  defaultHistoryRequestConcurrency,
  recordsDefaultDays,
} = {}) {
  return {
    title: "Energy Flow",
    house: "single_family_home",
    view_mode: "house",
    show_title: true,
    show_view_selector: true,
    show_house_selector: true,
    show_energy_range_selector: false,
    show_metric_tiles: true,
    show_environment_sensors: true,
    show_large_consumers: true,
    show_electric_vehicle: true,
    show_garden: true,
    show_floorplan: true,
    show_advisor: true,
    show_charts: true,
    show_records: true,
    show_power_flows: false,
    show_status_label: true,
    show_weather_status: false,
    show_grid_status_tile: true,
    hud_box_opacity: 0.65,
    hud_box_scale: 1,
    battery_low_threshold: 20,
    grid_neutral_threshold: 25,
    grid_voltage_warning_threshold: 245,
    grid_voltage_critical_threshold: 253,
    ...DEFAULT_GRID_FINANCE_CONFIG,
    advisor_surplus_threshold: advisorDefaults?.surplusThreshold ?? 250,
    advisor_import_threshold: advisorDefaults?.importThreshold ?? 250,
    advisor_high_load_threshold: advisorDefaults?.highLoadThreshold ?? 3000,
    advisor_ev_surplus_threshold: advisorDefaults?.evSurplusThreshold ?? 1500,
    advisor_max_suggestions: advisorDefaults?.maxSuggestions ?? 8,
    advisor_stale_sensor_warning_minutes: advisorDefaults?.staleSensorWarningMinutes ?? 30,
    advisor_stale_sensor_critical_minutes: advisorDefaults?.staleSensorCriticalMinutes ?? 1440,
    chart_hours: 24,
    records_range: `${recordsDefaultDays ?? 7}d`,
    history_request_concurrency: defaultHistoryRequestConcurrency ?? 2,
    daylight_entity: "sun.sun",
    weather_entity: "",
    dynamic_tile_colors: true,
    pv_roof_string_display: "sum",
    inverter_display: "sum",
    power_display_mode: "auto_kw",
    power_decimals: 2,
    energy_range: "live",
    units: createDefaultUnits(),
    entities: {},
    positions: {},
    visible_boxes: {},
    max_power_kw: {},
    labels: {},
    label_visibility: {},
    energy_entities: {},
    image_overlays: {},
    tile_color_rules: {},
    custom_kpis: [],
    environment_sensors: [],
    floorplan: createDefaultFloorplan(),
    electric_vehicle: createDefaultElectricVehicleConfig(),
    garden: createDefaultGardenConfig(),
    large_consumers: [],
    pv_roof_strings: [],
    inverters: [],
  };
}

function createStubCardConfig({
  cardType,
  advisorDefaults,
  defaultTileColorRules,
  normalizeLargeConsumers,
} = {}) {
  return {
    type: `custom:${cardType}`,
    ...createBaseCardConfig({ advisorDefaults }),
    title: "Solar Dashboard",
    max_power_kw: createDefaultMaxPowerKw(),
    units: createStubUnits(),
    tile_color_rules: defaultTileColorRules || {},
    large_consumers: typeof normalizeLargeConsumers === "function" ? normalizeLargeConsumers([]) : [],
    image_overlays: createDefaultImageOverlays(),
    visible_boxes: createDefaultVisibleBoxes(),
    entities: createStubEntities(),
  };
}

function createEditorBaseConfig({ floorplanLabel = "Level 1" } = {}) {
  return {
    entities: {},
    units: {},
    positions: {},
    max_power_kw: {},
    labels: {},
    label_visibility: {},
    energy_entities: {},
    image_overlays: {},
    custom_kpis: [],
    environment_sensors: [],
    show_floorplan: true,
    floorplan: createDefaultFloorplan(floorplanLabel),
    show_electric_vehicle: true,
    electric_vehicle: createDefaultElectricVehicleConfig(),
    show_garden: true,
    garden: createDefaultGardenConfig(),
    show_advisor: true,
    show_charts: true,
    show_records: true,
    large_consumers: [],
    pv_roof_strings: [],
    pv_roof_string_display: "sum",
    inverters: [],
    inverter_display: "sum",
    ...DEFAULT_GRID_FINANCE_CONFIG,
  };
}

const DEFAULT_ELECTRIC_VEHICLE_IMAGE = "images/car_image.png";

const ELECTRIC_VEHICLE_HERO_BADGE_POSITION_KEYS = Object.freeze({
  status: "electric_vehicle_status",
  charge_power: "electric_vehicle_charge_power",
  vehicle_soc: "electric_vehicle_vehicle_soc",
  charge_remaining_duration: "electric_vehicle_charge_remaining_duration",
  session_solar_percentage: "electric_vehicle_session_solar_percentage",
});

const ELECTRIC_VEHICLE_HERO_BADGE_POSITIONS = Object.freeze({
  status: Object.freeze({ left: 13, top: 11 }),
  charge_power: Object.freeze({ left: 84, top: 11 }),
  vehicle_soc: Object.freeze({ left: 13, top: 23 }),
  charge_remaining_duration: Object.freeze({ left: 84, top: 23 }),
  session_solar_percentage: Object.freeze({ left: 50, top: 86 }),
});

const ELECTRIC_VEHICLE_ENTITY_DEFINITIONS = Object.freeze([
  Object.freeze({ key: "status", labelKey: "ev.status", label: "Status", group: "state", kind: "status", aliases: ["ev_status", "loadpoint_status", "wallbox_status"] }),
  Object.freeze({ key: "mode", labelKey: "ev.mode", label: "Mode", group: "state", kind: "text", aliases: ["ev_mode", "loadpoint_mode", "wallbox_mode"] }),
  Object.freeze({ key: "mode_control", labelKey: "ev.modeControl", label: "Lademodus", group: "controls", kind: "text", control: true, aliases: ["ev_mode_control", "evcc_mode", "evcc_mode_select", "charge_mode", "charge_mode_select", "loadpoint_mode_select", "wallbox_mode_select"] }),
  Object.freeze({ key: "connected", labelKey: "ev.connected", label: "Connected", group: "state", kind: "boolean", wallboxFallback: "connected", aliases: ["ev_connected", "vehicle_connected", "wallbox_connected"] }),
  Object.freeze({ key: "charging", labelKey: "ev.charging", label: "Charging", group: "state", kind: "boolean", aliases: ["ev_charging", "vehicle_charging", "wallbox_charging"] }),
  Object.freeze({ key: "enabled", labelKey: "ev.enabled", label: "Enabled", group: "state", kind: "boolean", wallboxFallback: "chargingEnabled", aliases: ["ev_enabled", "loadpoint_enabled", "wallbox_enabled", "wallbox_charging_enabled"] }),
  Object.freeze({ key: "vehicle_title", labelKey: "ev.vehicleTitle", label: "Vehicle", group: "vehicle", kind: "text", aliases: ["ev_vehicle_title", "vehicle_title", "wallbox_vehicle_title"] }),
  Object.freeze({ key: "vehicle_name", labelKey: "ev.vehicleName", label: "Vehicle name", group: "vehicle", kind: "text", aliases: ["ev_vehicle_name", "vehicle_name", "wallbox_vehicle_name"] }),
  Object.freeze({ key: "vehicle_soc", labelKey: "ev.vehicleSoc", label: "Vehicle SoC", group: "vehicle", kind: "percent", wallboxFallback: "soc", aliases: ["ev_vehicle_soc", "vehicle_soc", "wallbox_soc"] }),
  Object.freeze({ key: "limit_soc", labelKey: "ev.limitSoc", label: "Target SoC", group: "vehicle", kind: "percent", wallboxFallback: "maxSoc", aliases: ["ev_limit_soc", "vehicle_limit_soc", "target_soc", "wallbox_max_soc", "wallbox_target_soc"] }),
  Object.freeze({ key: "min_soc", labelKey: "ev.minSoc", label: "Minimum SoC", group: "vehicle", kind: "percent", aliases: ["ev_min_soc", "vehicle_min_soc", "wallbox_min_soc"] }),
  Object.freeze({ key: "vehicle_range", labelKey: "ev.vehicleRange", label: "Range", group: "vehicle", kind: "distance", aliases: ["ev_vehicle_range", "vehicle_range", "wallbox_vehicle_range"] }),
  Object.freeze({ key: "charge_power", labelKey: "ev.chargePower", label: "Charging power", group: "charging", kind: "power", wallboxFallback: "power", aliases: ["ev_charge_power", "charge_power", "loadpoint_charge_power", "wallbox_power"] }),
  Object.freeze({ key: "charge_current", labelKey: "ev.chargeCurrent", label: "Charging current", group: "charging", kind: "current", aliases: ["ev_charge_current", "charge_current", "loadpoint_charge_current", "wallbox_current"] }),
  Object.freeze({ key: "charged_energy", labelKey: "ev.chargedEnergy", label: "Charged energy", group: "charging", kind: "energy", aliases: ["ev_charged_energy", "charged_energy", "loadpoint_charged_energy"] }),
  Object.freeze({ key: "session_energy", labelKey: "ev.sessionEnergy", label: "Session energy", group: "charging", kind: "energy", aliases: ["ev_session_energy", "session_energy", "wallbox_session_energy"] }),
  Object.freeze({ key: "session_solar_percentage", labelKey: "ev.sessionSolarPercentage", label: "Session solar", group: "charging", kind: "percent", aliases: ["ev_session_solar_percentage", "session_solar_percentage", "session_solar_share"] }),
  Object.freeze({ key: "charge_total_import", labelKey: "ev.chargeTotalImport", label: "Charge meter", group: "charging", kind: "energy", aliases: ["ev_charge_total_import", "charge_total_import", "wallbox_energy_total"] }),
  Object.freeze({ key: "charge_duration", labelKey: "ev.chargeDuration", label: "Charge duration", group: "charging", kind: "duration", aliases: ["ev_charge_duration", "charge_duration", "wallbox_charge_duration"] }),
  Object.freeze({ key: "charge_remaining_duration", labelKey: "ev.chargeRemainingDuration", label: "Remaining time", group: "charging", kind: "duration", wallboxFallback: "remainingTime", aliases: ["ev_charge_remaining_duration", "remaining_time", "wallbox_remaining_time"] }),
  Object.freeze({ key: "charge_remaining_energy", labelKey: "ev.chargeRemainingEnergy", label: "Remaining energy", group: "charging", kind: "energy", aliases: ["ev_charge_remaining_energy", "charge_remaining_energy"] }),
  Object.freeze({ key: "phases_active", labelKey: "ev.phasesActive", label: "Active phases", group: "limits", kind: "phases", wallboxFallback: "phase", aliases: ["ev_phases_active", "phases_active", "wallbox_phase"] }),
  Object.freeze({ key: "phases_configured", labelKey: "ev.phasesConfigured", label: "Configured phases", group: "limits", kind: "phases", aliases: ["ev_phases_configured", "phases_configured", "wallbox_phases_configured"] }),
  Object.freeze({ key: "phase_action", labelKey: "ev.phaseAction", label: "Upcoming phase action", group: "limits", kind: "text", wallboxFallback: "phaseAction", aliases: ["ev_phase_action", "phase_action", "wallbox_phase_action"] }),
  Object.freeze({ key: "phase_remaining", labelKey: "ev.phaseRemaining", label: "Phase action remaining", group: "limits", kind: "duration", wallboxFallback: "phaseRemaining", aliases: ["ev_phase_remaining", "phase_remaining", "wallbox_phase_remaining"] }),
  Object.freeze({ key: "min_current", labelKey: "ev.minCurrent", label: "Minimum current", group: "limits", kind: "current", aliases: ["ev_min_current", "min_current", "wallbox_min_current"] }),
  Object.freeze({ key: "max_current", labelKey: "ev.maxCurrent", label: "Maximum current", group: "limits", kind: "current", aliases: ["ev_max_current", "max_current", "wallbox_max_current"] }),
  Object.freeze({ key: "limit_energy", labelKey: "ev.limitEnergy", label: "Energy limit", group: "limits", kind: "energy", aliases: ["ev_limit_energy", "limit_energy", "wallbox_limit_energy"] }),
  Object.freeze({ key: "enable_threshold", labelKey: "ev.enableThreshold", label: "Enable threshold", group: "limits", kind: "power", aliases: ["ev_enable_threshold", "enable_threshold", "wallbox_enable_threshold"] }),
  Object.freeze({ key: "enable_delay", labelKey: "ev.enableDelay", label: "Enable delay", group: "limits", kind: "duration", aliases: ["ev_enable_delay", "enable_delay", "wallbox_enable_delay"] }),
  Object.freeze({ key: "disable_threshold", labelKey: "ev.disableThreshold", label: "Disable threshold", group: "limits", kind: "power", aliases: ["ev_disable_threshold", "disable_threshold", "wallbox_disable_threshold"] }),
  Object.freeze({ key: "disable_delay", labelKey: "ev.disableDelay", label: "Disable delay", group: "limits", kind: "duration", aliases: ["ev_disable_delay", "disable_delay", "wallbox_disable_delay"] }),
  Object.freeze({ key: "plan_active", labelKey: "ev.planActive", label: "Plan active", group: "planning", kind: "boolean", aliases: ["ev_plan_active", "plan_active", "wallbox_plan_active"] }),
  Object.freeze({ key: "smart_cost_active", labelKey: "ev.smartCostActive", label: "Smart cost active", group: "planning", kind: "boolean", aliases: ["ev_smart_cost_active", "smart_cost_active", "wallbox_smart_cost_active"] }),
  Object.freeze({ key: "effective_priority", labelKey: "ev.effectivePriority", label: "Effective priority", group: "planning", kind: "text", aliases: ["ev_effective_priority", "effective_priority", "wallbox_effective_priority"] }),
  Object.freeze({ key: "priority", labelKey: "ev.priority", label: "Priority", group: "planning", kind: "text", aliases: ["ev_priority", "wallbox_priority"] }),
  Object.freeze({ key: "battery_boost", labelKey: "ev.batteryBoost", label: "Battery boost", group: "planning", kind: "boolean", aliases: ["ev_battery_boost", "batteryboost", "battery_boost", "wallbox_battery_boost"] }),
  Object.freeze({ key: "battery_boost_limit", labelKey: "ev.batteryBoostLimit", label: "Battery boost limit", group: "planning", kind: "percent", aliases: ["ev_battery_boost_limit", "battery_boost_limit", "wallbox_battery_boost_limit"] }),
  Object.freeze({ key: "smart_cost_limit", labelKey: "ev.smartCostLimit", label: "Smart cost limit", group: "planning", kind: "text", aliases: ["ev_smart_cost_limit", "smart_cost_limit", "wallbox_smart_cost_limit"] }),
  Object.freeze({ key: "smart_feed_in_priority_limit", labelKey: "ev.smartFeedInPriorityLimit", label: "Feed-in priority limit", group: "planning", kind: "text", aliases: ["ev_smart_feed_in_priority_limit", "smart_feed_in_priority_limit", "wallbox_smart_feed_in_priority_limit"] }),
]);

const ELECTRIC_VEHICLE_GROUPS = Object.freeze([
  Object.freeze({ key: "controls", labelKey: "ev.groupControls", label: "Controls" }),
  Object.freeze({ key: "state", labelKey: "ev.groupState", label: "State" }),
  Object.freeze({ key: "vehicle", labelKey: "ev.groupVehicle", label: "Vehicle" }),
  Object.freeze({ key: "charging", labelKey: "ev.groupCharging", label: "Charging" }),
  Object.freeze({ key: "limits", labelKey: "ev.groupLimits", label: "Limits" }),
  Object.freeze({ key: "planning", labelKey: "ev.groupPlanning", label: "Planning" }),
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

function normalizeElectricVehicleEntities(entities = {}) {
  const source = entities && typeof entities === "object" ? entities : {};
  return Object.fromEntries(
    ELECTRIC_VEHICLE_ENTITY_DEFINITIONS.map((definition) => [
      definition.key,
      String(source[definition.key] || definition.aliases?.map((alias) => source[alias]).find(Boolean) || "").trim(),
    ]),
  );
}

function normalizeElectricVehicleConfig(config = {}) {
  const source = typeof config === "string"
    ? { image: config }
    : config && typeof config === "object"
      ? config
      : {};
  return {
    title: String(source.title || source.label || "").trim(),
    image: String(source.image || source.image_path || source.car_image || DEFAULT_ELECTRIC_VEHICLE_IMAGE).trim() || DEFAULT_ELECTRIC_VEHICLE_IMAGE,
    wallbox: normalizeElectricVehicleWallbox(source.wallbox || source.wallbox_key || source.loadpoint || source.loadpoint_id),
    entities: normalizeElectricVehicleEntities(source.entities || source.evcc_entities || {}),
  };
}

function createElectricVehicleDashboardMethods({
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

    _electricVehicleEntityId(key) {
      const definition = this._electricVehicleDefinition(key);
      const evConfig = this._electricVehicleConfig();
      const evEntities = evConfig.entities || {};
      const direct = evEntities[key] || definition?.aliases?.map((alias) => evEntities[alias]).find(Boolean);
      if (direct) return direct;

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

    _electricVehicleFormatValue(definition) {
      const key = definition?.key || "";
      if (key === "status") return this._electricVehicleStatusLabel();
      const entityId = this._electricVehicleEntityId(key);
      const rawValue = entityId ? this._getEntityValue(entityId, undefined) : undefined;
      const unit = entityId ? this._getEntityUnit(entityId) || "" : "";
      if (!entityId || isUnavailableElectricVehicleValue(rawValue)) return ELECTRIC_VEHICLE_EMPTY_VALUE;

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

    _electricVehicleImageUrls(path = this._electricVehicleConfig().image) {
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

    _electricVehicleImageUrl(path = this._electricVehicleConfig().image) {
      const [src] = this._electricVehicleImageUrls(path);
      if (src) return src;
      const value = String(path || DEFAULT_ELECTRIC_VEHICLE_IMAGE).trim() || DEFAULT_ELECTRIC_VEHICLE_IMAGE;
      try {
        return assetUrl(value);
      } catch (_err) {
        return value;
      }
    },

    _renderElectricVehicleHeroBadge(definitionKey) {
      const definition = this._electricVehicleDefinition(definitionKey);
      if (!definition) return "";
      const state = this._electricVehicleFieldState(definition);
      if (!state.configured || state.value === ELECTRIC_VEHICLE_EMPTY_VALUE) return "";
      const position = this._electricVehicleHeroBadgePosition(definitionKey);
      return `
        <div class="electric-vehicle-badge" style="left:${this._escape(position.left)}%;top:${this._escape(position.top)}%;--tile-accent:${this._escape(this._electricVehicleAccent(definition))}">
          <span>${this._escape(state.label)}</span>
          <strong data-electric-vehicle-value="${this._escape(state.key)}">${this._escape(state.value)}</strong>
        </div>
      `;
    },

    _renderElectricVehicleField(item) {
      const { definition, state } = item;
      const entityTitle = state.entityId ? `${state.label}: ${state.entityId}` : state.label;
      return `
        <div class="electric-vehicle-tile" title="${this._escape(entityTitle)}" style="--tile-accent:${this._escape(this._electricVehicleAccent(definition))}">
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
      return "#1f8fff";
    },

    _renderElectricVehicleDashboard() {
      const evConfig = this._electricVehicleConfig();
      const configuredFields = this._electricVehicleConfiguredFields();
      const [imageSrc, ...imageFallbacks] = this._electricVehicleImageUrls(evConfig.image);
      const title = evConfig.title || this._t("ev.title", {}, "E-Auto");
      const vehicleTitle = this._electricVehicleFieldState(this._electricVehicleDefinition("vehicle_title")).value;
      const subtitle = vehicleTitle && vehicleTitle !== ELECTRIC_VEHICLE_EMPTY_VALUE
        ? vehicleTitle
        : this._t("ev.subtitle", {}, "EVCC loadpoint");
      const heroBadges = ["status", "charge_power", "vehicle_soc", "charge_remaining_duration", "session_solar_percentage"]
        .map((key) => this._renderElectricVehicleHeroBadge(key))
        .join("");
      const modeControl = this._renderElectricVehicleModeControl();
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
          </div>
          ${empty || groups}
        </section>
      `;
    },
  };
}

const DEFAULT_GARDEN_IMAGE = "images/single_family_home_top_view_garden.png";

const GARDEN_HERO_BADGE_POSITION_KEYS = Object.freeze({
  mower_status: "garden_mower_status",
  garden_water: "garden_water",
  rain_24h: "garden_rain_24h",
  soil_moisture: "garden_soil_moisture",
});

const GARDEN_HERO_BADGE_POSITIONS = Object.freeze({
  mower_status: Object.freeze({ left: 13, top: 10 }),
  garden_water: Object.freeze({ left: 84, top: 11 }),
  rain_24h: Object.freeze({ left: 28, top: 86 }),
  soil_moisture: Object.freeze({ left: 43, top: 86 }),
});

const GARDEN_ENTITY_DEFINITIONS = Object.freeze([
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

function normalizeGardenBadgeCoordinate(value, fallback = 50) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, number));
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

function normalizeGardenConfig(config = {}) {
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

function createGardenDashboardMethods({
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
      return `
        <div class="garden-badge ${this._escape(className)}" style="left:${this._escape(position.left)}%;top:${this._escape(position.top)}%;--tile-accent:${this._escape(this._gardenAccent(definition.group))}">
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

function createDashboardEditorClass({
  ADVISOR_DEFAULTS,
  DEFAULT_ELECTRIC_VEHICLE_IMAGE,
  DEFAULT_GARDEN_IMAGE,
  DEFAULT_IMAGE_OVERLAYS,
  DEFAULT_TILE_COLOR_RULES,
  ELECTRIC_VEHICLE_ENTITY_DEFINITIONS,
  ELECTRIC_VEHICLE_HERO_BADGE_POSITIONS,
  ELECTRIC_VEHICLE_HERO_BADGE_POSITION_KEYS,
  GARDEN_ENTITY_DEFINITIONS,
  GARDEN_HERO_BADGE_POSITIONS,
  GARDEN_HERO_BADGE_POSITION_KEYS,
  HOUSE_VARIANTS,
  IMAGE_OVERLAY_KEYS,
  PV_LABELS,
  TILE_METRICS,
  VIEW_MODE_OPTIONS,
  adjacentWallboxPosition,
  assetUrl,
  clampConfigNumber,
  createEditorBaseConfig,
  ensureTranslations,
  findMetricByKey,
  htmlTag,
  inverterPhaseVoltageEntityKeys,
  isPvMetric,
  languageFromHass,
  largeConsumerLabel,
  metricVoltageEntityKey,
  normalizeAdvisorConfig,
  normalizeElectricVehicleConfig,
  normalizeGardenConfig,
  normalizeHouse,
  normalizeInverterDisplay,
  normalizeInverters,
  normalizeLargeConsumers,
  normalizePvRoofStringDisplay,
  normalizePvRoofStrings,
  parsePowerLimitWatts,
  rawHtml,
  translate,
  wallboxChargingEnabledEntityKey,
  wallboxConnectedEntityKey,
  wallboxMaxSocEntityKey,
  wallboxPhaseActionEntityKey,
  wallboxPhaseEntityKey,
  wallboxPhaseRemainingEntityKey,
  wallboxRemainingTimeEntityKey,
  wallboxSocEntityKey,
} = {}) {
  return class HaSolarDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    const baseConfig = createEditorBaseConfig?.({ floorplanLabel: this._floorplanFloorLabel(0) }) || {};
    const electricVehicleSource = (config || {}).electric_vehicle || (config || {}).e_auto || (config || {}).ev || {};
    const showElectricVehicle = (config || {}).show_electric_vehicle
      ?? (config || {}).show_ev_dashboard
      ?? (config || {}).show_e_auto
      ?? electricVehicleSource.enabled
      ?? electricVehicleSource.show;
    const gardenSource = (config || {}).garden || (config || {}).garten || (config || {}).irrigation || {};
    const showGarden = (config || {}).show_garden
      ?? (config || {}).show_garden_dashboard
      ?? (config || {}).show_irrigation
      ?? gardenSource.enabled
      ?? gardenSource.show;
    const showAdvisor = (config || {}).show_advisor
      ?? (config || {}).show_advisor_dashboard
      ?? (config || {}).show_energy_advisor
      ?? (config || {}).advisor?.enabled
      ?? (config || {}).advisor?.show;
    const showCharts = (config || {}).show_charts
      ?? (config || {}).show_chart_dashboard
      ?? (config || {}).show_chart
      ?? (config || {}).charts?.enabled
      ?? (config || {}).charts?.show;
    const showRecords = (config || {}).show_records
      ?? (config || {}).show_records_dashboard
      ?? (config || {}).show_record_dashboard
      ?? (config || {}).records?.enabled
      ?? (config || {}).records?.show;
    this._config = {
      ...baseConfig,
      ...config,
      show_electric_vehicle: showElectricVehicle === undefined ? baseConfig.show_electric_vehicle !== false : showElectricVehicle !== false,
      show_garden: showGarden === undefined ? baseConfig.show_garden !== false : showGarden !== false,
      show_advisor: showAdvisor === undefined ? baseConfig.show_advisor !== false : showAdvisor !== false,
      show_charts: showCharts === undefined ? baseConfig.show_charts !== false : showCharts !== false,
      show_records: showRecords === undefined ? baseConfig.show_records !== false : showRecords !== false,
      image_overlays: {
        smoke: {
          ...(((config || {}).overlays || {}).smoke || {}),
          ...(((config || {}).image_overlays || {}).smoke || {}),
        },
        heatpump: {
          ...(((config || {}).overlays || {}).heatpump || {}),
          ...(((config || {}).image_overlays || {}).heatpump || {}),
        },
      },
      labels: { ...((config || {}).metric_labels || {}), ...((config || {}).labels || {}) },
      label_visibility: { ...((config || {}).label_display || {}), ...((config || {}).label_visibility || {}) },
      energy_entities: { ...((config || {}).energy_counters || {}), ...((config || {}).energy_entities || {}) },
      visible_boxes: { ...((config || {}).boxes || {}), ...((config || {}).visible_boxes || {}) },
      custom_kpis: Array.isArray((config || {}).custom_kpis || (config || {}).kpis)
        ? [...(((config || {}).custom_kpis || (config || {}).kpis))]
        : [],
      environment_sensors: this._normalizeEnvironmentSensors((config || {}).environment_sensors || (config || {}).environment_sensor_tiles || []),
      floorplan: this._normalizeFloorplan((config || {}).floorplan || {}),
      electric_vehicle: normalizeElectricVehicleConfig?.(electricVehicleSource) || electricVehicleSource,
      garden: normalizeGardenConfig?.(gardenSource) || gardenSource,
      large_consumers: normalizeLargeConsumers((config || {}).large_consumers || (config || {}).large_consumers_config || []),
      pv_roof_strings: normalizePvRoofStrings((config || {}).pv_roof_strings || (config || {}).pv_roof_string_config || []),
      pv_roof_string_display: normalizePvRoofStringDisplay((config || {}).pv_roof_string_display || (config || {}).pv_roof_display || "sum"),
      inverters: normalizeInverters((config || {}).inverters || (config || {}).inverter_strings || (config || {}).inverter_config || []),
      inverter_display: normalizeInverterDisplay((config || {}).inverter_display || (config || {}).inverter_string_display || "sum"),
    };
    delete this._config.show_energy_advisor;
    this._render();
    this._ensureTranslationsForRender();
  }

  set hass(hass) {
    const previousLanguage = this._language();
    const hadEntityOptions = this._entityOptions().length > 0;
    this._hass = hass;
    const nextLanguage = this._language();
    const hasEntityOptions = this._entityOptions().length > 0;
    if (!this._rendered || (!hadEntityOptions && hasEntityOptions) || previousLanguage !== nextLanguage) {
      this._render();
      this._ensureTranslationsForRender();
    }
  }

  _language() {
    return languageFromHass(this._hass);
  }

  _t(key, replacements = {}, fallback = "") {
    return translate(this._language(), key, replacements, fallback);
  }

  _ensureTranslationsForRender() {
    const language = this._language();
    ensureTranslations(language, () => {
      if (!this._config || this._language() !== language) return;
      this._render();
    });
  }

  _houseLabel(key, variant = HOUSE_VARIANTS[key]) {
    return this._t(`house.${key}`, {}, variant?.label || key);
  }

  _normalizeHouse(value) {
    return normalizeHouse(value);
  }

  _normalizeViewMode(value) {
    return normalizeViewMode(value);
  }

  _activeTab() {
    const allowed = new Set(["setup", "energy", "devices", "electric_vehicle", "garden", "environment", "floorplan", "layout", "appearance", "advisor", "advanced"]);
    return allowed.has(this._activeEditorTab) ? this._activeEditorTab : "setup";
  }

  _setActiveTab(tab) {
    this._activeEditorTab = tab || "setup";
    this._render();
  }

  _help(text) {
    const content = String(text || "").trim();
    if (!content) return "";
    return `<span class="field-help" title="${this._escape(content)}" aria-label="${this._escape(content)}">?</span>`;
  }

  _labelText(label, help = "") {
    return `<span class="field-label-text">${this._escape(label)}${this._help(help)}</span>`;
  }

  _countConfigured(values = []) {
    return values.filter((value) => value !== undefined && value !== null && String(value).trim() !== "").length;
  }

  _entityExists(entityId) {
    if (!entityId || !this._hass?.states) return true;
    return Boolean(this._hass.states[entityId]);
  }

  _missingEntityCount(entityIds = []) {
    return entityIds.filter((entityId) => entityId && !this._entityExists(entityId)).length;
  }

  _safeCssColor(color, fallback = "") {
    const value = String(color || "").trim();
    if (!value) return fallback;
    if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
    if (/^(rgb|rgba|hsl|hsla)\([\d\s.,%/-]+\)$/i.test(value)) return value;
    if (/^[a-z]+$/i.test(value)) return value;
    return fallback;
  }

  _statusText({ configured = 0, total = 0, hidden = 0, missing = 0, advanced = false } = {}) {
    const parts = [];
    if (total > 0) {
      parts.push(this._t("editor.statusConfigured", { configured, total }, `${configured}/${total} configured`));
    } else if (configured > 0) {
      parts.push(this._t("editor.statusConfiguredCount", { count: configured }, `${configured} configured`));
    }
    if (hidden > 0) parts.push(this._t("editor.statusHidden", { count: hidden }, `${hidden} hidden`));
    if (missing > 0) parts.push(this._t("editor.statusMissing", { count: missing }, `${missing} missing`));
    if (advanced) parts.push(this._t("editor.statusAdvanced", {}, "Advanced active"));
    return parts.join(" · ") || this._t("editor.statusReady", {}, "Ready");
  }

  _detailsOpen(key, fallback = false) {
    if (!key) return fallback;
    if (this._editorSectionState?.has?.(key)) return this._editorSectionState.get(key);
    return fallback;
  }

  _configValue(value) {
    if (value && typeof value === "object") {
      return value.entity || value.counter || value.kwh_entity || value.kwh || value.meter || "";
    }
    return value;
  }

  _metricConfigValues(metric) {
    const key = metric?.key;
    if (!key) return [];
    const values = [];
    const add = (value) => values.push(this._configValue(value));
    const addEntity = (entityKey) => add(this._config.entities?.[entityKey]);
    const addEnergy = (metricKey) => add(this._config.energy_entities?.[metricKey]);

    addEntity(key);
    if (metric.unit === "power") addEnergy(key);

    const voltageKey = this._metricVoltageEntityKey(metric);
    if (voltageKey) addEntity(voltageKey);
    this._metricVoltagePhaseFields(metric).forEach(([phaseKey]) => addEntity(phaseKey));

    if (this._isPvMetric(metric)) {
      PV_LABELS.forEach((label) => {
        if (label.source === "entity") addEntity(this._pvLabelKey(metric, label));
      });
    }

    if (key === "pv_roof_power") {
      normalizePvRoofStrings(this._config.pv_roof_strings || []).forEach((string) => {
        add(string.power_entity);
        add(string.energy_entity);
      });
    }

    if (key === "inverter_power") {
      normalizeInverters(this._config.inverters || []).forEach((inverter) => {
        add(inverter.power_entity);
        add(inverter.energy_entity);
        add(inverter.voltage_entity);
        add(inverter.voltage_entity_l1);
        add(inverter.voltage_entity_l2);
        add(inverter.voltage_entity_l3);
      });
    }

    if (key === "battery_level") {
      [
        "battery_flow_power",
        "battery_flow_power_voltage",
        "battery_charge_power",
        "battery_discharge_power",
        "battery_min_soc",
        "battery_max_soc",
        "battery_temperature",
        "battery_cycles_today",
      ].forEach(addEntity);
    }

    if (key === "import_export_power") {
      [
        "import_power",
        "export_power",
        "import_export_power_voltage",
      ].forEach(addEntity);
      add(this._config.energy_entities?.import_power);
      add(this._config.energy_entities?.export_power);
    }

    if (key === "wallbox_power" || key === "wallbox2_power") {
      [
        this._wallboxPhaseEntityKey(metric),
        this._wallboxPhaseActionEntityKey(metric),
        this._wallboxPhaseRemainingEntityKey(metric),
        this._wallboxSocEntityKey(metric),
        this._wallboxMaxSocEntityKey(metric),
        this._wallboxConnectedEntityKey(metric),
        this._wallboxChargingEnabledEntityKey(metric),
        this._wallboxRemainingTimeEntityKey(metric),
      ].filter(Boolean).forEach(addEntity);
    }

    return values;
  }

  _metricGroupDefinitions() {
    const metricByKey = new Map(TILE_METRICS.map((metric) => [metric.key, metric]));
    const used = new Set();
    const group = (key, title, fallback, keys) => {
      const metrics = keys.map((metricKey) => metricByKey.get(metricKey)).filter(Boolean);
      metrics.forEach((metric) => used.add(metric.key));
      return {
        key,
        title: this._t(title, {}, fallback),
        metrics,
      };
    };
    const groups = [
      group("solar", "editor.groupSolar", "Solar & inverter", ["pv_total_power", "pv_roof_power", "pv_shed_power", "inverter_power"]),
      group("storage", "editor.groupStorage", "Storage & charging", ["battery_level", "wallbox_power", "wallbox2_power"]),
      group("grid", "editor.groupGrid", "Grid & consumption", ["import_export_power", "house_consumption_power", "water_meter"]),
    ].filter((item) => item.metrics.length > 0);
    const remaining = TILE_METRICS.filter((metric) => !used.has(metric.key));
    if (remaining.length > 0) {
      groups.push({
        key: "other",
        title: this._t("editor.groupOther", {}, "Other"),
        metrics: remaining,
      });
    }
    return groups;
  }

  _shouldRenderAfterInput(path = "", parts = []) {
    const root = parts[0] || path;
    const lastPart = parts[parts.length - 1] || "";
    if (path === "house" || path === "image" || path === "day_image") return true;
    if (root === "positions" || root === "visible_boxes") return true;
    if (root === "image_overlays") return true;
    if (root === "show_electric_vehicle") return true;
    if (root === "electric_vehicle" && ["image", "wallbox", "title"].includes(lastPart)) return true;
    if (root === "show_garden") return true;
    if (root === "garden") return true;
    if (root === "show_floorplan") return true;
    if (root === "show_advisor") return true;
    if (root === "show_charts") return true;
    if (root === "show_records") return true;
    if (root === "floorplan") return true;
    if (root === "environment_sensors") {
      return ["visible", "show_image", "left", "top", "label", "color"].includes(lastPart);
    }
    return false;
  }

  _onInput(path, value, isCheckbox = false) {
    const next = this._cloneConfig(this._config || {});
    delete next.show_energy_advisor;
    const parts = path.split(".");
    const lastPart = parts[parts.length - 1];
    const numericFields = new Set([
      "hud_box_opacity",
      "hud_box_scale",
      "power_decimals",
      "advisor_max_suggestions",
      "advisor_surplus_threshold",
      "advisor_import_threshold",
      "advisor_high_load_threshold",
      "advisor_ev_surplus_threshold",
      "advisor_stale_sensor_warning_minutes",
      "advisor_stale_sensor_critical_minutes",
      "grid_voltage_warning_threshold",
      "grid_voltage_critical_threshold",
      "grid_import_price",
      "grid_export_price",
    ]);
    const numericProps = new Set(["left", "top", "width", "height", "position", "columns", "x", "y", "x1", "y1", "x2", "y2", "font_size"]);
    const shouldBeNumeric = numericFields.has(path) || numericProps.has(lastPart) || parts[0] === "max_power_kw" || lastPart === "max_power_kw";
    const nextValue = isCheckbox ? Boolean(value) : shouldBeNumeric ? Number(value) : value;
    this._setPath(next, parts, nextValue);
    if (parts[0] === "floorplan") {
      const sensor = parts[1] === "sensors"
        ? next.floorplan?.sensors?.[Number(parts[2])]
        : parts[1] === "floors" && parts[3] === "sensors"
          ? next.floorplan?.floors?.[Number(parts[2])]?.sensors?.[Number(parts[4])]
          : undefined;
      if (sensor && lastPart === "environment_sensor") {
        const linked = this._normalizeEnvironmentSensors(next.environment_sensors || []).find((item) => item.id === nextValue);
        if (linked) {
          sensor.type = this._environmentSensorDisplayType(linked);
          if (!sensor.color || sensor.color === "#34d399") sensor.color = linked.color || this._floorplanSensorTypeColor(sensor.type) || "#34d399";
        }
      }
      if (sensor && lastPart === "type" && (!sensor.color || sensor.color === "#34d399")) {
        sensor.color = this._floorplanSensorTypeColor(nextValue) || "#34d399";
      }
    }
    this._config = next;
    this._dispatchConfig(next);
    if (this._shouldRenderAfterInput(path, parts)) this._render();
  }

  _setPath(target, parts, value) {
    let cursor = target;
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const nextPart = parts[index + 1];
      const key = Array.isArray(cursor) ? Number(part) : part;
      if (isLast) {
        cursor[key] = value;
        return;
      }
      if (cursor[key] === undefined || cursor[key] === null || typeof cursor[key] !== "object") {
        cursor[key] = Number.isInteger(Number(nextPart)) ? [] : {};
      }
      cursor = cursor[key];
    });
  }

  _dispatchConfig(config = this._config) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config },
      }),
    );
  }

  _addCustomKpi() {
    const next = this._cloneConfig(this._config || {});
    next.custom_kpis = Array.isArray(next.custom_kpis) ? next.custom_kpis : [];
    next.custom_kpis.push({
      id: `kpi_${Date.now()}`,
      label: "New KPI",
      entity: "",
      value: "",
      unit: "auto",
      position: 100 + next.custom_kpis.length,
      columns: 1,
      color: "#1f8fff",
    });
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _removeCustomKpi(index) {
    const next = this._cloneConfig(this._config || {});
    next.custom_kpis = Array.isArray(next.custom_kpis) ? next.custom_kpis : [];
    next.custom_kpis.splice(index, 1);
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _normalizeEnvironmentSensors(sensors) {
    const source = Array.isArray(sensors)
      ? sensors
      : sensors && typeof sensors === "object"
        ? Object.entries(sensors).map(([id, sensor]) => (
          typeof sensor === "string"
            ? { id, entity: sensor }
            : { id, ...(sensor || {}) }
        ))
        : [];
    return source
      .map((sensor, index) => {
        if (!sensor || typeof sensor !== "object") return undefined;
        return {
          id: String(sensor.id || sensor.key || sensor.entity || `environment_${index + 1}`).trim().replace(/[^\w-]/g, "_"),
          label: String(sensor.label || sensor.name || "").trim(),
          entity: String(sensor.entity || sensor.entity_id || sensor.sensor || "").trim(),
          type: String(sensor.type || sensor.sensor_type || sensor.kind || "custom").trim() || "custom",
          unit: sensor.unit ?? "auto",
          position: Number.isFinite(Number(sensor.position ?? sensor.order)) ? Number(sensor.position ?? sensor.order) : 300 + index,
          columns: Number.isFinite(Number(sensor.columns ?? sensor.span)) ? Number(sensor.columns ?? sensor.span) : 1,
          left: Number.isFinite(Number(sensor.left ?? sensor.x)) ? Number(sensor.left ?? sensor.x) : 50,
          top: Number.isFinite(Number(sensor.top ?? sensor.y)) ? Number(sensor.top ?? sensor.y) : 50,
          color: sensor.color || "#34d399",
          visible: sensor.visible !== false,
          show_footer: sensor.show_footer ?? sensor.footer ?? true,
          show_image: sensor.show_image ?? sensor.image ?? false,
        };
      })
      .filter(Boolean);
  }

  _normalizeFloorplanMode(value = "editor") {
    const mode = String(value || "").trim().toLowerCase();
    return ["image", "picture", "bild"].includes(mode) ? "image" : "editor";
  }

  _floorplanFloorLabel(index = 0) {
    return this._t("floorplan.level", { index: index + 1 }, `Level ${index + 1}`);
  }

  _normalizeFloorplanRoom(room, index = 0) {
    if (!room || typeof room !== "object") return undefined;
    return {
      id: String(room.id || room.key || `room_${index + 1}`).trim().replace(/[^\w-]/g, "_"),
      label: String(room.label || room.name || this._t("floorplan.room", { index: index + 1 }, `Room ${index + 1}`)).trim(),
      x: Number.isFinite(Number(room.x)) ? Number(room.x) : 10 + index * 4,
      y: Number.isFinite(Number(room.y)) ? Number(room.y) : 10 + index * 4,
      width: Number.isFinite(Number(room.width ?? room.w)) ? Number(room.width ?? room.w) : 24,
      height: Number.isFinite(Number(room.height ?? room.h)) ? Number(room.height ?? room.h) : 18,
      color: this._safeCssColor(room.color, "#1f8fff"),
    };
  }

  _normalizeFloorplanWall(wall, index = 0) {
    if (!wall || typeof wall !== "object") return undefined;
    return {
      id: String(wall.id || wall.key || `wall_${index + 1}`).trim().replace(/[^\w-]/g, "_"),
      x1: Number.isFinite(Number(wall.x1 ?? wall.from_x)) ? Number(wall.x1 ?? wall.from_x) : 12,
      y1: Number.isFinite(Number(wall.y1 ?? wall.from_y)) ? Number(wall.y1 ?? wall.from_y) : 12,
      x2: Number.isFinite(Number(wall.x2 ?? wall.to_x)) ? Number(wall.x2 ?? wall.to_x) : 36,
      y2: Number.isFinite(Number(wall.y2 ?? wall.to_y)) ? Number(wall.y2 ?? wall.to_y) : 12,
      width: Number.isFinite(Number(wall.width ?? wall.stroke_width)) ? Number(wall.width ?? wall.stroke_width) : 1.2,
      color: this._safeCssColor(wall.color, "#dbeafe"),
    };
  }

  _normalizeFloorplanSensor(sensor, index = 0) {
    if (!sensor || typeof sensor !== "object") return undefined;
    const type = String(sensor.type || sensor.sensor_type || sensor.kind || "indoor").trim() || "indoor";
    return {
      id: String(sensor.id || sensor.key || sensor.entity || sensor.environment_sensor || `sensor_${index + 1}`).trim().replace(/[^\w-]/g, "_"),
      label: String(sensor.label || sensor.name || "").trim(),
      entity: String(sensor.entity || sensor.entity_id || "").trim(),
      environment_sensor: String(sensor.environment_sensor || sensor.environmentSensor || "").trim(),
      type,
      unit: sensor.unit ?? "auto",
      x: Number.isFinite(Number(sensor.x ?? sensor.left)) ? Number(sensor.x ?? sensor.left) : 50,
      y: Number.isFinite(Number(sensor.y ?? sensor.top)) ? Number(sensor.y ?? sensor.top) : 35,
      color: this._safeCssColor(sensor.color, this._floorplanSensorTypeColor(type) || "#34d399"),
      visible: sensor.visible !== false,
      show_label: sensor.show_label !== false && sensor.label_visible !== false && sensor.showLabel !== false,
      font_size: clampConfigNumber(sensor.font_size ?? sensor.fontSize ?? sensor.text_size ?? sensor.textSize, 3.05, 1.4, 8),
    };
  }

  _normalizeFloorplanFloor(floor = {}, index = 0) {
    const source = floor && typeof floor === "object" ? floor : {};
    return {
      id: String(source.id || source.key || `level_${index + 1}`).trim().replace(/[^\w-]/g, "_"),
      label: String(source.label || source.name || this._floorplanFloorLabel(index)).trim(),
      image: String(source.image || source.image_path || source.background_image || "").trim(),
      rooms: (Array.isArray(source.rooms) ? source.rooms : []).map((room, roomIndex) => this._normalizeFloorplanRoom(room, roomIndex)).filter(Boolean),
      walls: (Array.isArray(source.walls) ? source.walls : []).map((wall, wallIndex) => this._normalizeFloorplanWall(wall, wallIndex)).filter(Boolean),
      sensors: (Array.isArray(source.sensors) ? source.sensors : []).map((sensor, sensorIndex) => this._normalizeFloorplanSensor(sensor, sensorIndex)).filter(Boolean),
    };
  }

  _normalizeFloorplan(floorplan = {}) {
    const source = floorplan && typeof floorplan === "object" ? floorplan : {};
    const mode = this._normalizeFloorplanMode(source.mode || source.type || source.source || source.layout_type || "editor");
    const fallbackFloor = {
      id: source.active_floor || source.activeFloor || source.floor_id || "level_1",
      label: source.floor_label || source.label || this._floorplanFloorLabel(0),
      image: source.image || source.image_path || source.background_image || "",
      rooms: Array.isArray(source.rooms) ? source.rooms : [],
      walls: Array.isArray(source.walls) ? source.walls : [],
      sensors: Array.isArray(source.sensors) ? source.sensors : [],
    };
    const floors = (Array.isArray(source.floors) && source.floors.length > 0 ? source.floors : [fallbackFloor])
      .map((floor, index) => this._normalizeFloorplanFloor(floor, index))
      .filter(Boolean);
    const normalizedFloors = floors.length ? floors : [this._normalizeFloorplanFloor(fallbackFloor, 0)];
    const requestedActiveFloor = String(source.active_floor || source.activeFloor || source.selected_floor || normalizedFloors[0].id || "level_1");
    const activeFloor = normalizedFloors.find((floor) => floor.id === requestedActiveFloor) || normalizedFloors[0];
    return {
      mode,
      show_grid: source.show_grid !== false,
      active_floor: activeFloor.id,
      floors: normalizedFloors,
      image: normalizedFloors[0].image,
      rooms: normalizedFloors[0].rooms,
      walls: normalizedFloors[0].walls,
      sensors: normalizedFloors[0].sensors,
    };
  }

  _activeFloorplanFloor(floorplan = this._normalizeFloorplan(this._config.floorplan || {})) {
    const floors = Array.isArray(floorplan.floors) && floorplan.floors.length > 0 ? floorplan.floors : [floorplan];
    const index = Math.max(0, floors.findIndex((floor) => floor.id === floorplan.active_floor));
    return { floor: floors[index] || floors[0], index: index >= 0 ? index : 0 };
  }

  _floorplanTool() {
    const allowed = new Set(["room", "wall", "sensor"]);
    return allowed.has(this._floorplanToolMode) ? this._floorplanToolMode : "room";
  }

  _setFloorplanTool(tool) {
    this._floorplanToolMode = tool || "room";
    this._render();
  }

  _floorplanItems(floorplan = this._normalizeFloorplan(this._config.floorplan || {})) {
    return [
      ...floorplan.rooms.map((room, index) => ({ key: `room:${index}`, type: "room", index, item: room, label: room.label || this._t("floorplan.room", { index: index + 1 }, `Room ${index + 1}`) })),
      ...floorplan.walls.map((wall, index) => ({ key: `wall:${index}`, type: "wall", index, item: wall, label: this._t("floorplan.wall", { index: index + 1 }, `Wall ${index + 1}`) })),
      ...floorplan.sensors.map((sensor, index) => ({ key: `sensor:${index}`, type: "sensor", index, item: sensor, label: sensor.label || this._t("floorplan.sensor", { index: index + 1 }, `Sensor ${index + 1}`) })),
    ];
  }

  _selectedFloorplanItem(floorplan = this._normalizeFloorplan(this._config.floorplan || {})) {
    const items = this._floorplanItems(floorplan);
    if (!items.length) return undefined;
    const selected = items.find((item) => item.key === this._selectedFloorplanItemKey) || items[0];
    this._selectedFloorplanItemKey = selected.key;
    return selected;
  }

  _addFloorplanItem(type = this._floorplanTool(), x = 50, y = 35) {
    const next = this._cloneConfig(this._config || {});
    next.floorplan = this._normalizeFloorplan(next.floorplan || {});
    const { floor } = this._activeFloorplanFloor(next.floorplan);
    const itemType = next.floorplan.mode === "image" ? "sensor" : type;
    const clampedX = this._roundFloorplanNumber(Math.max(0, Math.min(100, Number(x) || 50)));
    const clampedY = this._roundFloorplanNumber(Math.max(0, Math.min(70, Number(y) || 35)));
    if (itemType === "wall") {
      const index = floor.walls.length;
      floor.walls.push({
        id: `wall_${Date.now()}`,
        x1: Math.max(0, clampedX - 10),
        y1: clampedY,
        x2: Math.min(100, clampedX + 10),
        y2: clampedY,
        width: 1.2,
        color: "#dbeafe",
      });
      this._selectedFloorplanItemKey = `wall:${index}`;
    } else if (itemType === "sensor") {
      const index = floor.sensors.length;
      floor.sensors.push({
        id: `sensor_${Date.now()}`,
        label: "",
        entity: "",
        environment_sensor: "",
        type: "indoor",
        unit: "auto",
        x: clampedX,
        y: clampedY,
        color: "#34d399",
        visible: true,
        show_label: true,
        font_size: 3.05,
      });
      this._selectedFloorplanItemKey = `sensor:${index}`;
    } else {
      const index = floor.rooms.length;
      floor.rooms.push({
        id: `room_${Date.now()}`,
        label: this._t("floorplan.room", { index: index + 1 }, `Room ${index + 1}`),
        x: Math.max(0, clampedX - 12),
        y: Math.max(0, clampedY - 9),
        width: 24,
        height: 18,
        color: "#1f8fff",
      });
      this._selectedFloorplanItemKey = `room:${index}`;
    }
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _removeSelectedFloorplanItem() {
    const floorplan = this._normalizeFloorplan(this._config.floorplan || {});
    const { floor } = this._activeFloorplanFloor(floorplan);
    const selected = this._selectedFloorplanItem(floor);
    if (!selected) return;
    const next = this._cloneConfig(this._config || {});
    next.floorplan = this._normalizeFloorplan(next.floorplan || {});
    const { floor: nextFloor } = this._activeFloorplanFloor(next.floorplan);
    const collection = selected.type === "room" ? "rooms" : selected.type === "wall" ? "walls" : "sensors";
    nextFloor[collection].splice(selected.index, 1);
    this._selectedFloorplanItemKey = "";
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _setFloorplanFloor(floorId) {
    const next = this._cloneConfig(this._config || {});
    next.floorplan = this._normalizeFloorplan(next.floorplan || {});
    const target = next.floorplan.floors.find((floor) => floor.id === floorId);
    if (!target) return;
    next.floorplan.active_floor = target.id;
    const legacyFloor = next.floorplan.floors[0] || target;
    next.floorplan.image = legacyFloor.image;
    next.floorplan.rooms = legacyFloor.rooms;
    next.floorplan.walls = legacyFloor.walls;
    next.floorplan.sensors = legacyFloor.sensors;
    this._selectedFloorplanItemKey = "";
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _addFloorplanFloor() {
    const next = this._cloneConfig(this._config || {});
    next.floorplan = this._normalizeFloorplan(next.floorplan || {});
    const index = next.floorplan.floors.length;
    const floor = this._normalizeFloorplanFloor({
      id: `level_${Date.now()}`,
      label: this._floorplanFloorLabel(index),
      image: "",
      rooms: [],
      walls: [],
      sensors: [],
    }, index);
    next.floorplan.floors.push(floor);
    next.floorplan.active_floor = floor.id;
    const legacyFloor = next.floorplan.floors[0] || floor;
    next.floorplan.image = legacyFloor.image;
    next.floorplan.rooms = legacyFloor.rooms;
    next.floorplan.walls = legacyFloor.walls;
    next.floorplan.sensors = legacyFloor.sensors;
    this._selectedFloorplanItemKey = "";
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _floorplanImageUrl(path = "") {
    const value = String(path || "").trim();
    if (!value) return "";
    if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
    if (/^local\//i.test(value)) return `/${value}`;
    return assetUrl(value);
  }

  _floorplanPointFromEvent(svg, event) {
    const rect = svg?.getBoundingClientRect?.();
    if (!rect?.width || !rect.height) return { x: 50, y: 35 };
    return {
      x: this._roundFloorplanNumber(Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))),
      y: this._roundFloorplanNumber(Math.max(0, Math.min(70, ((event.clientY - rect.top) / rect.height) * 70))),
    };
  }

  _roundFloorplanNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * 10) / 10 : 0;
  }

  _formatFloorplanNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value ?? "");
    return Number.isInteger(number) ? String(number) : number.toFixed(1);
  }

  _floorplanItemByKey(floorplan, key) {
    const [type, rawIndex] = String(key || "").split(":");
    const index = Number(rawIndex);
    if (!Number.isInteger(index)) return undefined;
    const collection = type === "room" ? "rooms" : type === "wall" ? "walls" : type === "sensor" ? "sensors" : "";
    const item = collection ? floorplan?.[collection]?.[index] : undefined;
    return item ? { type, collection, index, item } : undefined;
  }

  _floorplanDragCoordinates(drag, point) {
    if (!drag) return undefined;
    if (drag.type === "room") {
      const width = Number(drag.item.width) || 24;
      const height = Number(drag.item.height) || 18;
      return {
        x: this._roundFloorplanNumber(Math.max(0, Math.min(100 - width, point.x - drag.offsetX))),
        y: this._roundFloorplanNumber(Math.max(0, Math.min(70 - height, point.y - drag.offsetY))),
      };
    }
    if (drag.type === "wall") {
      const dx = Number(drag.item.x2) - Number(drag.item.x1);
      const dy = Number(drag.item.y2) - Number(drag.item.y1);
      let x1 = point.x - drag.offsetX;
      let y1 = point.y - drag.offsetY;
      let x2 = x1 + dx;
      let y2 = y1 + dy;
      const shiftX = Math.min(0, x1, x2) || Math.max(0, x1 - 100, x2 - 100);
      const shiftY = Math.min(0, y1, y2) || Math.max(0, y1 - 70, y2 - 70);
      x1 -= shiftX;
      x2 -= shiftX;
      y1 -= shiftY;
      y2 -= shiftY;
      return {
        x1: this._roundFloorplanNumber(x1),
        y1: this._roundFloorplanNumber(y1),
        x2: this._roundFloorplanNumber(x2),
        y2: this._roundFloorplanNumber(y2),
      };
    }
    return {
      x: this._roundFloorplanNumber(Math.max(0, Math.min(100, point.x - drag.offsetX))),
      y: this._roundFloorplanNumber(Math.max(0, Math.min(70, point.y - drag.offsetY))),
    };
  }

  _applyFloorplanDragPreview(drag, coordinates) {
    if (!drag?.element || !coordinates) return;
    if (drag.type === "room") {
      const rect = drag.element.querySelector("rect");
      const text = drag.element.querySelector("text");
      rect?.setAttribute("x", coordinates.x);
      rect?.setAttribute("y", coordinates.y);
      text?.setAttribute("x", coordinates.x + 1.5);
      text?.setAttribute("y", coordinates.y + 4);
      return;
    }
    if (drag.type === "wall") {
      drag.element.setAttribute("x1", coordinates.x1);
      drag.element.setAttribute("y1", coordinates.y1);
      drag.element.setAttribute("x2", coordinates.x2);
      drag.element.setAttribute("y2", coordinates.y2);
      return;
    }
    drag.element.setAttribute("transform", `translate(${coordinates.x} ${coordinates.y})`);
  }

  _commitFloorplanDrag(drag, coordinates) {
    if (!drag || !coordinates) return;
    const next = this._cloneConfig(this._config || {});
    next.floorplan = this._normalizeFloorplan(next.floorplan || {});
    const { floor } = this._activeFloorplanFloor(next.floorplan);
    const target = this._floorplanItemByKey(floor, drag.key);
    if (!target) return;
    Object.assign(target.item, coordinates);
    this._selectedFloorplanItemKey = drag.key;
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _environmentSensorTemplates() {
    return [
      { key: "indoor", label: this._t("environment.templateIndoor", {}, "Indoor temperature"), color: "#34d399" },
      { key: "outdoor", label: this._t("environment.templateOutdoor", {}, "Outdoor temperature"), color: "#60a5fa" },
      { key: "hot_water", label: this._t("environment.templateHotWater", {}, "Hot water"), color: "#fb923c" },
      { key: "humidity", label: this._t("environment.templateHumidity", {}, "Humidity"), color: "#22c55e" },
      { key: "pressure", label: this._t("environment.templatePressure", {}, "Pressure"), color: "#a78bfa" },
      { key: "air_quality", label: this._t("environment.templateAirQuality", {}, "Air quality"), color: "#f87171" },
      { key: "custom", label: this._t("environment.templateCustom", {}, "Custom"), color: "#34d399" },
    ];
  }

  _environmentSensorTemplate(key = "custom") {
    return this._environmentSensorTemplates().find((template) => template.key === key) || this._environmentSensorTemplates().find((template) => template.key === "custom");
  }

  _environmentSensorDisplayType(sensor = {}) {
    const explicitType = String(sensor.type || sensor.sensor_type || sensor.kind || "").trim();
    const stateObj = this._hass?.states?.[sensor.entity];
    const haystack = [
      sensor.id,
      sensor.label,
      sensor.entity,
      stateObj?.attributes?.friendly_name,
      stateObj?.attributes?.device_class,
      stateObj?.attributes?.unit_of_measurement,
    ].filter(Boolean).join(" ").toLowerCase();
    if (/(wasser|water|warmwasser|hot water|boiler)/.test(haystack)) return "hot_water";
    if (/(humidity|feuchte|luftfeuchte|humedad|humidité|wilgot)/.test(haystack)) return "humidity";
    if (/(pressure|druck|luftdruck|presión|pression|ciśn)/.test(haystack)) return "pressure";
    if (/(air quality|luftqualität|co2|co₂|aqi|pm2|pm10)/.test(haystack)) return "air_quality";
    if (/(temperature|temperatur|temp|°c|\bc\b)/.test(haystack)) {
      if (/(outside|outdoor|außen|aussen|extérieur|zewn|exterior)/.test(haystack)) return "outdoor";
      return "indoor";
    }
    return explicitType || "custom";
  }

  _floorplanSensorTypeLabel(type = "indoor") {
    return this._environmentSensorTemplate(type)?.label || "";
  }

  _floorplanSensorTypeColor(type = "indoor") {
    return this._environmentSensorTemplate(type)?.color || "";
  }

  _floorplanSensorTypeOptions(selectedType = "indoor") {
    return this._environmentSensorTemplates().map((template) => `
      <option value="${this._escape(template.key)}"${template.key === selectedType ? " selected" : ""}>${this._escape(template.label)}</option>
    `).join("");
  }

  _addEnvironmentSensor(templateKey = "custom") {
    const next = this._cloneConfig(this._config || {});
    next.environment_sensors = this._normalizeEnvironmentSensors(next.environment_sensors || []);
    const index = next.environment_sensors.length;
    const template = this._environmentSensorTemplate(templateKey);
    next.environment_sensors.push({
      id: `environment_${Date.now()}`,
      label: template?.key === "custom" ? "" : template?.label || "",
      entity: "",
      type: template?.key || "custom",
      unit: "auto",
      position: 300 + index,
      columns: 1,
      left: 50,
      top: 50,
      color: template?.color || "#34d399",
      visible: true,
      show_footer: true,
      show_image: false,
    });
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _removeEnvironmentSensor(index) {
    const next = this._cloneConfig(this._config || {});
    next.environment_sensors = this._normalizeEnvironmentSensors(next.environment_sensors || []);
    next.environment_sensors.splice(index, 1);
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _addPvRoofString() {
    const next = this._cloneConfig(this._config || {});
    next.pv_roof_strings = normalizePvRoofStrings(next.pv_roof_strings || []);
    const index = next.pv_roof_strings.length;
    next.pv_roof_strings.push({
      id: `string_${Date.now()}`,
      label: `String ${index + 2}`,
      power_entity: "",
      energy_entity: "",
      max_power_kw: "",
      visible: true,
    });
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _removePvRoofString(index) {
    const next = this._cloneConfig(this._config || {});
    next.pv_roof_strings = normalizePvRoofStrings(next.pv_roof_strings || []);
    next.pv_roof_strings.splice(index, 1);
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _addInverter() {
    const next = this._cloneConfig(this._config || {});
    next.inverters = normalizeInverters(next.inverters || []);
    const index = next.inverters.length;
    const label = `${this._t("metrics.inverter_power", {}, "Inverter")} ${index + 2}`;
    next.inverters.push({
      id: `inverter_${Date.now()}`,
      label,
      power_entity: "",
      energy_entity: "",
      voltage_entity: "",
      voltage_entity_l1: "",
      voltage_entity_l2: "",
      voltage_entity_l3: "",
      max_power_kw: "",
      visible: true,
    });
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _removeInverter(index) {
    const next = this._cloneConfig(this._config || {});
    next.inverters = normalizeInverters(next.inverters || []);
    next.inverters.splice(index, 1);
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _addLargeConsumer() {
    const next = this._cloneConfig(this._config || {});
    next.large_consumers = normalizeLargeConsumers(next.large_consumers || []);
    const index = next.large_consumers.length;
    next.large_consumers.push({
      id: `custom_${Date.now()}`,
      type: "custom",
      labelKey: "consumer.customLarge",
      defaultLabel: "Custom large consumer",
      label: "",
      power_entity: "",
      voltage_entity: "",
      energy_entity: "",
      max_power_kw: "",
      position: 200 + index,
      columns: 1,
      color: "#a78bfa",
      custom: true,
      visible: true,
    });
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _removeLargeConsumer(index) {
    const next = this._cloneConfig(this._config || {});
    next.large_consumers = normalizeLargeConsumers(next.large_consumers || []);
    const consumer = next.large_consumers[index];
    if (!consumer?.custom) return;
    next.large_consumers.splice(index, 1);
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _cloneConfig(config) {
    return JSON.parse(JSON.stringify(config));
  }

  _entityOptions() {
    return Object.keys(this._hass?.states || {}).sort();
  }

  _entityCatalog() {
    return Object.entries(this._hass?.states || {}).map(([entityId, stateObj]) => {
      const attributes = stateObj?.attributes || {};
      const domain = entityId.split(".")[0] || "";
      const name = attributes.friendly_name || attributes.name || entityId;
      const unit = attributes.unit_of_measurement || "";
      const deviceClass = attributes.device_class || "";
      const stateClass = attributes.state_class || "";
      const haystack = this._normalizeSearchText([
        entityId,
        name,
        unit,
        deviceClass,
        stateClass,
        attributes.integration,
        attributes.manufacturer,
        attributes.model,
      ].filter(Boolean).join(" "));
      return { entityId, stateObj, attributes, domain, name, unit, deviceClass, stateClass, haystack };
    });
  }

  _normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9%°]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  _searchMatches(haystack, term) {
    const normalized = this._normalizeSearchText(term);
    if (!normalized) return false;
    return haystack.includes(normalized);
  }

  _pathValue(target, path) {
    return path.split(".").reduce((cursor, part) => {
      if (cursor === undefined || cursor === null) return undefined;
      return cursor[part];
    }, target);
  }

  _isPlaceholderEntity(path, value) {
    const placeholders = {
      "entities.pv_roof_power": "sensor.pv_roof_power",
      "entities.pv_shed_power": "sensor.pv_shed_power",
      "entities.battery_level": "sensor.battery_level",
      "entities.inverter_power": "sensor.wechselrichter_power",
      "entities.wallbox_power": "sensor.wallbox_power",
      "entities.water_meter": "sensor.water_meter",
      "entities.pv_total_power": "sensor.pv_total_power",
      "entities.import_export_power": "sensor.grid_power",
    };
    return placeholders[path] && String(value || "").trim() === placeholders[path];
  }

  _entityLabelForPath(path) {
    const key = path.split(".").pop();
    const metric = findMetricByKey(key);
    if (metric) return this._metricLabel(metric);
    const evMatch = path.match(/^electric_vehicle\.entities\.([^.]+)$/);
    if (evMatch) {
      const definition = (ELECTRIC_VEHICLE_ENTITY_DEFINITIONS || []).find((item) => item.key === evMatch[1]);
      if (definition) return this._t(definition.labelKey, {}, definition.label);
    }
    const gardenMatch = path.match(/^garden\.entities\.([^.]+)$/);
    if (gardenMatch) {
      const definition = (GARDEN_ENTITY_DEFINITIONS || []).find((item) => item.key === gardenMatch[1]);
      if (definition) return this._t(definition.labelKey, {}, definition.label);
    }
    const voltageMetricKey = key?.replace(/_voltage$/, "");
    const voltageMetric = findMetricByKey(voltageMetricKey);
    if (voltageMetric) return `${this._metricLabel(voltageMetric)} ${this._t("tooltip.voltage", {}, "Voltage")}`;
    const labels = {
      weather_entity: this._t("editor.weatherEntity", {}, "Weather Entity"),
      electricity_price: this._t("editor.electricityPriceEntity", {}, "Electricity price entity"),
      battery_flow_power: this._t("editor.batteryFlowEntity", {}, "Battery flow entity (+/-)"),
      battery_flow_power_voltage: `${this._t("advisor.batteryStatus", {}, "Battery")} ${this._t("tooltip.voltage", {}, "Voltage")}`,
      inverter_power_voltage_l1: `${this._t("metrics.inverter_power", {}, "Inverter")} ${this._t("tooltip.voltage", {}, "Voltage")} L1`,
      inverter_power_voltage_l2: `${this._t("metrics.inverter_power", {}, "Inverter")} ${this._t("tooltip.voltage", {}, "Voltage")} L2`,
      inverter_power_voltage_l3: `${this._t("metrics.inverter_power", {}, "Inverter")} ${this._t("tooltip.voltage", {}, "Voltage")} L3`,
      battery_charge_power: this._t("editor.batteryChargeEntity", {}, "Battery charge entity"),
      battery_discharge_power: this._t("editor.batteryDischargeEntity", {}, "Battery discharge entity"),
      battery_min_soc: this._t("editor.batteryMinSocEntity", {}, "Battery min SoC entity"),
      battery_max_soc: this._t("editor.batteryMaxSocEntity", {}, "Battery max SoC entity"),
      battery_temperature: this._t("editor.batteryTemperatureEntity", {}, "Battery temperature entity"),
      battery_cycles_today: this._t("editor.batteryCyclesTodayEntity", {}, "Battery cycles today entity"),
      import_power: this._t("editor.importPowerEntity", {}, "Import entity"),
      export_power: this._t("editor.exportPowerEntity", {}, "Export entity"),
      wallbox_phase: this._t("editor.phaseEntity", {}, "Phase entity"),
      wallbox_phase_action: this._t("editor.phaseActionEntity", {}, "Upcoming phase action entity"),
      wallbox_phase_remaining: this._t("editor.phaseRemainingEntity", {}, "Phase action remaining seconds entity"),
      wallbox_soc: this._t("editor.vehicleSocEntity", {}, "Vehicle SoC entity"),
      wallbox_max_soc: this._t("editor.vehicleMaxSocEntity", {}, "Vehicle max/target SoC entity"),
      wallbox_connected: this._t("editor.vehicleConnectedEntity", {}, "Vehicle connected entity"),
      wallbox_charging_enabled: this._t("editor.vehicleChargingEnabledEntity", {}, "Charging enabled entity"),
      wallbox_remaining_time: this._t("editor.remainingChargeTimeEntity", {}, "Remaining charge time entity"),
      wallbox2_phase: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.phaseEntity", {}, "Phase entity")}`,
      wallbox2_phase_action: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.phaseActionEntity", {}, "Upcoming phase action entity")}`,
      wallbox2_phase_remaining: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.phaseRemainingEntity", {}, "Phase action remaining seconds entity")}`,
      wallbox2_soc: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.vehicleSocEntity", {}, "Vehicle SoC entity")}`,
      wallbox2_max_soc: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.vehicleMaxSocEntity", {}, "Vehicle max/target SoC entity")}`,
      wallbox2_connected: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.vehicleConnectedEntity", {}, "Vehicle connected entity")}`,
      wallbox2_charging_enabled: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.vehicleChargingEnabledEntity", {}, "Charging enabled entity")}`,
      wallbox2_remaining_time: `${this._t("metrics.wallbox2_power", {}, "EV Charger 2")} ${this._t("editor.remainingChargeTimeEntity", {}, "Remaining charge time entity")}`,
    };
    if (labels[key]) return labels[key];
    const energyMatch = path.match(/^energy_entities\.([^.]+)\.entity$/);
    if (energyMatch) {
      const energyMetric = findMetricByKey(energyMatch[1]);
      return `${this._metricLabel(energyMetric || { key: energyMatch[1], label: energyMatch[1] })} ${this._t("editor.energyCounterEntity", {}, "kWh counter entity")}`;
    }
    return key || path;
  }

  _autoDetectTargets() {
    const powerTarget = {
      domains: ["sensor"],
      deviceClasses: ["power"],
      units: ["w", "kw"],
      include: [{ terms: ["power", "leistung"], weight: 14 }],
    };
    const energyTarget = {
      domains: ["sensor"],
      deviceClasses: ["energy"],
      units: ["wh", "kwh", "mwh"],
      include: [{ terms: ["energy", "energie", "kwh", "yield", "ertrag", "total", "gesamt"], weight: 16 }],
    };
    const voltageTarget = {
      domains: ["sensor"],
      deviceClasses: ["voltage"],
      units: ["v"],
      include: [{ terms: ["voltage", "volt", "spannung"], weight: 28 }],
      exclude: ["power", "leistung", "energy", "kwh", "soc", "temperature", "temperatur"],
    };
    const volumeTarget = {
      domains: ["sensor"],
      deviceClasses: ["water"],
      units: ["m³", "m3", "l"],
      include: [{ terms: ["water", "wasser", "meter", "counter", "zaehler", "zahler"], weight: 24 }],
      exclude: ["power", "leistung", "energy", "kwh", "gas", "strom", "grid", "netz"],
    };
    const pvTerms = { terms: ["pv", "solar", "photovoltaic", "photovoltaik"], weight: 36 };
    const gridTerms = { terms: ["grid", "netz", "meter", "utility", "power meter", "smart meter"], weight: 28 };
    const wallboxTerms = { terms: ["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], weight: 34 };
    const evccTerms = { terms: ["evcc", "loadpoint", "ladepunkt", "wallbox", "vehicle", "fahrzeug", "auto", "ev"], weight: 34 };
    const batteryTerms = { terms: ["battery", "batterie", "speicher", "akku"], weight: 34 };
    const waterTerms = { terms: ["water", "wasser", "water meter", "wasserzaehler", "wasserzahler"], weight: 38 };
    const gardenTerms = { terms: ["garden", "garten", "irrigation", "watering", "bewasserung", "bewaesserung", "rasen", "lawn"], weight: 34 };
    const mowerTerms = { terms: ["mower", "maeher", "maher", "mähroboter", "maehroboter", "automower", "landroid", "sileno"], weight: 38 };
    const irrigationTerms = { terms: ["garden water", "gartenwasser", "irrigation", "watering", "bewasserung", "bewaesserung", "sprinkler", "ventil", "valve"], weight: 36 };
    const gardenEquipmentTerms = { terms: ["garden", "garten", "outdoor", "aussen", "außen", "patio", "terrasse"], weight: 26 };
    const evccTextTarget = {
      domains: ["sensor", "select"],
      include: [evccTerms],
    };
    const evccBooleanTarget = {
      domains: ["binary_sensor", "sensor", "switch", "input_boolean"],
      include: [evccTerms],
    };
    const evccTargets = [
      { path: "electric_vehicle.entities.status", ...evccTextTarget, required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["status", "state", "zustand"]], include: [evccTerms, { terms: ["status", "state", "zustand"], weight: 30 }], threshold: 58 },
      { path: "electric_vehicle.entities.mode_control", domains: ["select", "input_select"], required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["mode", "modus", "charge mode", "lademodus"]], include: [evccTerms, { terms: ["mode", "modus", "charge mode", "lademodus", "minpv", "min+pv", "pv", "schnell", "fast"], weight: 38 }], threshold: 58 },
      { path: "electric_vehicle.entities.mode", ...evccTextTarget, required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["mode", "modus"]], include: [evccTerms, { terms: ["mode", "modus"], weight: 30 }], exclude: ["control", "steuerung"], threshold: 58 },
      { path: "electric_vehicle.entities.vehicle_title", ...evccTextTarget, required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["vehicle", "fahrzeug", "auto", "title", "name"]], include: [evccTerms, { terms: ["vehicle title", "vehicle name", "fahrzeug", "auto"], weight: 30 }], threshold: 58 },
      { path: "electric_vehicle.entities.charging", ...evccBooleanTarget, required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["charging", "laedt", "laden"]], include: [evccTerms, { terms: ["charging", "laedt", "laden"], weight: 30 }], exclude: ["enabled", "freigabe"], threshold: 58 },
      { path: "electric_vehicle.entities.charge_current", domains: ["sensor"], units: ["a"], required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["current", "strom", "ampere"]], include: [evccTerms, { terms: ["current", "strom", "ampere"], weight: 32 }], exclude: ["min", "max"], threshold: 58 },
      { path: "electric_vehicle.entities.charged_energy", ...energyTarget, required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["charged", "geladen", "session", "sitzung"]], include: [evccTerms, { terms: ["charged energy", "geladene energie", "session", "sitzung"], weight: 32 }, ...energyTarget.include], threshold: 58 },
      { path: "electric_vehicle.entities.session_solar_percentage", domains: ["sensor"], units: ["%"], required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["solar", "pv", "green", "eigenerzeugung"], ["session", "sitzung"]], include: [evccTerms, { terms: ["solar percentage", "solar share", "pv anteil", "eigenerzeugung"], weight: 34 }], threshold: 58 },
      { path: "electric_vehicle.entities.charge_remaining_duration", domains: ["sensor"], required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["remaining", "rest", "verbleibend", "duration", "dauer"]], include: [evccTerms, { terms: ["remaining duration", "remaining time", "restzeit", "verbleibend"], weight: 34 }], threshold: 58 },
      { path: "electric_vehicle.entities.charge_remaining_energy", ...energyTarget, required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["remaining", "rest", "verbleibend"], ["energy", "energie", "kwh", "wh"]], include: [evccTerms, { terms: ["remaining energy", "restenergie", "verbleibend"], weight: 34 }, ...energyTarget.include], threshold: 58 },
      { path: "electric_vehicle.entities.charge_total_import", ...energyTarget, required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["total", "gesamt", "meter", "zaehler"]], include: [evccTerms, { terms: ["charge total import", "meter", "zaehler", "gesamt"], weight: 34 }, ...energyTarget.include], threshold: 58 },
      { path: "electric_vehicle.entities.vehicle_range", domains: ["sensor"], units: ["km"], required: [["evcc", "vehicle", "fahrzeug", "auto"], ["range", "reichweite"]], include: [evccTerms, { terms: ["range", "reichweite", "km"], weight: 36 }], threshold: 58 },
      { path: "electric_vehicle.entities.phases_active", domains: ["sensor"], required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["phase", "phases", "phasen"], ["active", "aktiv"]], include: [evccTerms, { terms: ["phases active", "aktive phasen"], weight: 36 }], threshold: 58 },
      { path: "electric_vehicle.entities.plan_active", ...evccBooleanTarget, required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["plan", "schedule", "planung"], ["active", "aktiv"]], include: [evccTerms, { terms: ["plan active", "planung aktiv"], weight: 34 }], threshold: 58 },
      { path: "electric_vehicle.entities.smart_cost_active", ...evccBooleanTarget, required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["smart cost", "smartcost", "kosten"], ["active", "aktiv"]], include: [evccTerms, { terms: ["smart cost active", "smartcost", "kosten aktiv"], weight: 36 }], threshold: 58 },
      { path: "electric_vehicle.entities.min_current", domains: ["sensor", "number", "input_number"], units: ["a"], required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["min", "minimum"], ["current", "strom", "ampere"]], include: [evccTerms, { terms: ["min current", "minimum current", "minimaler strom"], weight: 36 }], threshold: 58 },
      { path: "electric_vehicle.entities.max_current", domains: ["sensor", "number", "input_number"], units: ["a"], required: [["evcc", "loadpoint", "ladepunkt", "wallbox"], ["max", "maximum"], ["current", "strom", "ampere"]], include: [evccTerms, { terms: ["max current", "maximum current", "maximaler strom"], weight: 36 }], threshold: 58 },
    ];

    return [
      { path: "weather_entity", domains: ["weather"], include: [{ terms: ["weather", "wetter", "home", "haus"], weight: 14 }], threshold: 35 },
      { path: "entities.electricity_price", domains: ["sensor"], include: [{ terms: ["electricity price", "strompreis", "price", "tariff", "tarif", "tibber", "awattar"], weight: 34 }], exclude: ["power", "leistung", "energy", "kwh total"], threshold: 42 },
      { path: "entities.pv_roof_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["roof", "dach", "rooftop"]], include: [pvTerms, { terms: ["roof", "dach", "rooftop"], weight: 24 }, ...powerTarget.include], exclude: ["shed", "garage", "carport", "schuppen", "total", "gesamt", "forecast", "prognose"], threshold: 60 },
      { path: "entities.pv_roof_power_voltage", ...voltageTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["roof", "dach", "rooftop"]], include: [pvTerms, { terms: ["roof", "dach", "rooftop"], weight: 24 }, ...voltageTarget.include], exclude: ["shed", "garage", "carport", "schuppen", "total", "gesamt", ...voltageTarget.exclude], threshold: 62 },
      { path: "entities.pv_shed_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["shed", "garage", "carport", "schuppen", "balkon", "balcony"]], include: [pvTerms, { terms: ["shed", "garage", "carport", "schuppen", "balkon", "balcony"], weight: 28 }, ...powerTarget.include], exclude: ["roof", "dach", "total", "gesamt", "forecast", "prognose"], threshold: 62 },
      { path: "entities.pv_shed_power_voltage", ...voltageTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["shed", "garage", "carport", "schuppen", "balkon", "balcony"]], include: [pvTerms, { terms: ["shed", "garage", "carport", "schuppen", "balkon", "balcony"], weight: 28 }, ...voltageTarget.include], exclude: ["roof", "dach", "total", "gesamt", ...voltageTarget.exclude], threshold: 64 },
      { path: "entities.pv_total_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["total", "gesamt", "sum", "summe", "all", "anlage"]], block: ["forecast", "prognose", "today", "heute", "daily"], include: [pvTerms, { terms: ["total", "gesamt", "sum", "summe", "all", "anlage"], weight: 28 }, ...powerTarget.include], exclude: ["forecast", "prognose", "today", "heute", "daily"], threshold: 60 },
      { path: "entities.pv_total_power_voltage", ...voltageTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["total", "gesamt", "sum", "summe", "all", "anlage"]], include: [pvTerms, { terms: ["total", "gesamt", "sum", "summe", "all", "anlage"], weight: 28 }, ...voltageTarget.include], exclude: ["forecast", "prognose", "today", "heute", "daily", ...voltageTarget.exclude], threshold: 62 },
      { path: "entities.pv_roof_power", ...powerTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"]], include: [pvTerms, ...powerTarget.include], exclude: ["shed", "garage", "carport", "schuppen", "total", "gesamt", "forecast", "prognose", "today", "heute", "daily"], threshold: 70 },
      { path: "entities.pv_total_power_today_energy", ...energyTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"], ["today", "heute", "daily", "day", "tag"]], include: [pvTerms, { terms: ["today", "heute", "daily", "day", "tag"], weight: 30 }, ...energyTarget.include], exclude: ["forecast", "prognose"], threshold: 62 },
      { path: "energy_entities.pv_total_power.entity", ...energyTarget, required: [["pv", "solar", "photovoltaic", "photovoltaik"]], block: ["power", "leistung", "today", "heute", "daily", "day", "tag", "forecast", "prognose"], include: [pvTerms, { terms: ["total", "gesamt", "lifetime", "counter", "zaehler"], weight: 22 }, ...energyTarget.include], exclude: ["today", "heute", "daily", "forecast", "prognose"], threshold: 58 },
      { path: "entities.battery_level", domains: ["sensor"], deviceClasses: ["battery"], units: ["%"], required: [["battery", "batterie", "speicher", "akku"], ["soc", "level", "stand", "charge", "ladestand"]], include: [batteryTerms, { terms: ["soc", "level", "stand", "charge", "ladestand"], weight: 34 }], exclude: ["power", "leistung", "temp", "temperature", "temperatur", "flow", "fluss", "min", "minimum", "max", "maximum", "target", "ziel", "limit", "reserve"], threshold: 58 },
      { path: "entities.battery_min_soc", domains: ["sensor", "number", "input_number"], units: ["%"], required: [["battery", "batterie", "speicher", "akku"], ["min", "minimum", "reserve", "backup", "untergrenze", "reserve"]], include: [batteryTerms, { terms: ["min", "minimum", "reserve", "backup", "untergrenze", "soc"], weight: 34 }], exclude: ["power", "leistung", "temp", "temperature", "fluss", "flow", "max", "maximum", "target", "ziel"], threshold: 58 },
      { path: "entities.battery_max_soc", domains: ["sensor", "number", "input_number"], units: ["%"], required: [["battery", "batterie", "speicher", "akku"], ["max", "maximum", "target", "ziel", "limit", "obergrenze"]], include: [batteryTerms, { terms: ["max", "maximum", "target", "ziel", "limit", "obergrenze", "soc"], weight: 34 }], exclude: ["power", "leistung", "temp", "temperature", "fluss", "flow", "min", "minimum", "reserve", "backup"], threshold: 58 },
      { path: "entities.battery_flow_power", ...powerTarget, required: [["battery", "batterie", "speicher", "akku"]], include: [batteryTerms, { terms: ["power", "leistung", "flow", "fluss", "charge discharge", "laden entladen"], weight: 26 }], exclude: ["soc", "level", "stand", "temperature", "temperatur", "temp"], threshold: 58 },
      { path: "entities.battery_flow_power_voltage", ...voltageTarget, required: [["battery", "batterie", "speicher", "akku"]], include: [batteryTerms, ...voltageTarget.include], threshold: 58 },
      { path: "entities.battery_charge_power", ...powerTarget, required: [["battery", "batterie", "speicher", "akku"], ["charge", "charging", "laden", "ladeleistung"]], include: [batteryTerms, { terms: ["charge", "charging", "laden", "ladeleistung"], weight: 30 }], exclude: ["discharge", "entladen", "entlade", "soc", "temperature", "temperatur"], threshold: 62 },
      { path: "entities.battery_discharge_power", ...powerTarget, required: [["battery", "batterie", "speicher", "akku"], ["discharge", "discharging", "entladen", "entladeleistung"]], include: [batteryTerms, { terms: ["discharge", "discharging", "entladen", "entladeleistung"], weight: 30 }], exclude: ["charge", "charging", "laden", "ladeleistung", "soc", "temperature", "temperatur"], threshold: 62 },
      { path: "entities.battery_temperature", domains: ["sensor"], deviceClasses: ["temperature"], units: ["°c", "c"], required: [["battery", "batterie", "speicher", "akku"], ["temperature", "temperatur", "temp"]], include: [batteryTerms, { terms: ["temperature", "temperatur", "temp"], weight: 30 }], exclude: ["power", "leistung", "soc"], threshold: 58 },
      { path: "entities.battery_cycles_today", domains: ["sensor"], required: [["battery", "batterie", "speicher", "akku"], ["cycle", "cycles", "zyklen", "vollzyklen"], ["today", "heute", "daily", "tag"]], include: [batteryTerms, { terms: ["cycle", "cycles", "zyklen", "vollzyklen", "today", "heute", "daily", "tag"], weight: 34 }], exclude: ["power", "leistung", "soc", "temperature", "temperatur"], threshold: 58 },
      { path: "entities.inverter_power", ...powerTarget, required: [["inverter", "wechselrichter", "wr"]], include: [{ terms: ["inverter", "wechselrichter", "wr"], weight: 38 }, ...powerTarget.include], exclude: ["battery", "batterie", "soc", "temperature"], threshold: 56 },
      { path: "entities.inverter_power_voltage_l1", ...voltageTarget, required: [["inverter", "wechselrichter", "wr"], ["l1", "phase 1", "phase l1", "spannung l1", "u1"]], include: [{ terms: ["inverter", "wechselrichter", "wr"], weight: 38 }, { terms: ["l1", "phase 1", "phase l1", "spannung l1", "u1"], weight: 34 }, ...voltageTarget.include], exclude: ["battery", "batterie", "l2", "l3", ...voltageTarget.exclude], threshold: 62 },
      { path: "entities.inverter_power_voltage_l2", ...voltageTarget, required: [["inverter", "wechselrichter", "wr"], ["l2", "phase 2", "phase l2", "spannung l2", "u2"]], include: [{ terms: ["inverter", "wechselrichter", "wr"], weight: 38 }, { terms: ["l2", "phase 2", "phase l2", "spannung l2", "u2"], weight: 34 }, ...voltageTarget.include], exclude: ["battery", "batterie", "l1", "l3", ...voltageTarget.exclude], threshold: 62 },
      { path: "entities.inverter_power_voltage_l3", ...voltageTarget, required: [["inverter", "wechselrichter", "wr"], ["l3", "phase 3", "phase l3", "spannung l3", "u3"]], include: [{ terms: ["inverter", "wechselrichter", "wr"], weight: 38 }, { terms: ["l3", "phase 3", "phase l3", "spannung l3", "u3"], weight: 34 }, ...voltageTarget.include], exclude: ["battery", "batterie", "l1", "l2", ...voltageTarget.exclude], threshold: 62 },
      { path: "entities.inverter_power_voltage", ...voltageTarget, required: [["inverter", "wechselrichter", "wr"]], include: [{ terms: ["inverter", "wechselrichter", "wr"], weight: 38 }, ...voltageTarget.include], exclude: ["battery", "batterie", ...voltageTarget.exclude], threshold: 58 },
      { path: "entities.wallbox_power", ...powerTarget, required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"]], include: [wallboxTerms, ...powerTarget.include], exclude: ["2", "second", "zweite", "two", "phase", "phasen", "soc", "remaining", "time", "zeit", "energy", "kwh"], threshold: 56 },
      { path: "entities.wallbox_power_voltage", ...voltageTarget, required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"]], include: [wallboxTerms, ...voltageTarget.include], exclude: ["2", "second", "zweite", "two", "phase", "phasen", "soc", "remaining", "time", "zeit", ...voltageTarget.exclude], threshold: 58 },
      { path: "entities.wallbox_phase", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["phase", "phases", "phasen"]], include: [wallboxTerms, { terms: ["phase", "phases", "phasen"], weight: 34 }], exclude: ["power", "leistung", "energy", "kwh"], threshold: 58 },
      { path: "entities.wallbox_phase_action", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["phase", "phases", "phasen"], ["action", "activity", "aktivität", "aktion"]], include: [wallboxTerms, { terms: ["phase action", "phase activity", "phasen aktivität", "phasen aktion", "action value"], weight: 40 }], exclude: ["remaining", "verbleibend", "seconds", "sekunden", "time", "zeit", "power", "leistung", "energy", "kwh"], threshold: 58 },
      { path: "entities.wallbox_phase_remaining", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["phase", "phases", "phasen"], ["remaining", "verbleibend", "seconds", "sekunden", "time", "zeit"]], include: [wallboxTerms, { terms: ["phase remaining", "phasen verbleibend", "remaining", "verbleibend", "seconds", "sekunden"], weight: 40 }], exclude: ["action", "activity", "aktivität", "aktion", "power", "leistung", "energy", "kwh"], threshold: 58 },
      { path: "entities.wallbox_soc", domains: ["sensor"], units: ["%"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"]], include: [wallboxTerms, { terms: ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"], weight: 30 }], exclude: ["power", "leistung", "phase", "phasen", "max", "target", "ziel", "limit"], threshold: 58 },
      { path: "entities.wallbox_max_soc", domains: ["sensor", "number", "input_number"], units: ["%"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["max", "target", "ziel", "limit", "charge limit", "ladelimit"]], include: [wallboxTerms, { terms: ["max", "target", "ziel", "limit", "charge limit", "ladelimit", "soc"], weight: 34 }], exclude: ["power", "leistung", "phase", "phasen", "remaining", "time"], threshold: 58 },
      { path: "entities.wallbox_connected", domains: ["binary_sensor", "sensor", "switch"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["connected", "plugged", "plug", "cable", "vehicle", "car", "auto", "verbunden", "eingesteckt", "kabel"]], include: [wallboxTerms, { terms: ["connected", "plugged", "plug", "cable", "vehicle", "car", "auto", "verbunden", "eingesteckt", "kabel"], weight: 32 }], exclude: ["power", "leistung", "phase", "phasen", "soc", "remaining"], threshold: 58 },
      { path: "entities.wallbox_charging_enabled", domains: ["switch", "binary_sensor", "sensor", "input_boolean"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["enabled", "allowed", "enable", "freigabe", "aktiviert", "start", "stop"]], include: [wallboxTerms, { terms: ["enabled", "allowed", "enable", "freigabe", "aktiviert", "start", "stop", "charging"], weight: 30 }], exclude: ["power", "leistung", "phase", "phasen", "soc", "remaining"], threshold: 58 },
      { path: "entities.wallbox_remaining_time", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"]], include: [wallboxTerms, { terms: ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"], weight: 30 }], exclude: ["power", "leistung", "phase", "soc"], threshold: 58 },
      { path: "entities.wallbox2_power", ...powerTarget, required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 22 }, ...powerTarget.include], exclude: ["phase", "phasen", "soc", "remaining", "time", "zeit", "energy", "kwh"], threshold: 62 },
      { path: "entities.wallbox2_power_voltage", ...voltageTarget, required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 22 }, ...voltageTarget.include], exclude: ["phase", "phasen", "soc", "remaining", "time", "zeit", ...voltageTarget.exclude], threshold: 64 },
      { path: "entities.wallbox2_phase", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["phase", "phases", "phasen"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["phase", "phases", "phasen"], weight: 34 }], exclude: ["power", "leistung", "energy", "kwh"], threshold: 64 },
      { path: "entities.wallbox2_phase_action", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["phase", "phases", "phasen"], ["action", "activity", "aktivität", "aktion"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["phase action", "phase activity", "phasen aktivität", "phasen aktion", "action value"], weight: 40 }], exclude: ["remaining", "verbleibend", "seconds", "sekunden", "time", "zeit", "power", "leistung", "energy", "kwh"], threshold: 64 },
      { path: "entities.wallbox2_phase_remaining", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["phase", "phases", "phasen"], ["remaining", "verbleibend", "seconds", "sekunden", "time", "zeit"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["phase remaining", "phasen verbleibend", "remaining", "verbleibend", "seconds", "sekunden"], weight: 40 }], exclude: ["action", "activity", "aktivität", "aktion", "power", "leistung", "energy", "kwh"], threshold: 64 },
      { path: "entities.wallbox2_soc", domains: ["sensor"], units: ["%"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["soc", "vehicle", "car", "auto", "ev", "fahrzeug"], weight: 30 }], exclude: ["power", "leistung", "phase", "phasen", "max", "target", "ziel", "limit"], threshold: 64 },
      { path: "entities.wallbox2_max_soc", domains: ["sensor", "number", "input_number"], units: ["%"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["max", "target", "ziel", "limit", "charge limit", "ladelimit"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["max", "target", "ziel", "limit", "charge limit", "ladelimit", "soc"], weight: 34 }], exclude: ["power", "leistung", "phase", "phasen", "remaining", "time"], threshold: 64 },
      { path: "entities.wallbox2_connected", domains: ["binary_sensor", "sensor", "switch"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["connected", "plugged", "plug", "cable", "vehicle", "car", "auto", "verbunden", "eingesteckt", "kabel"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["connected", "plugged", "plug", "cable", "vehicle", "car", "auto", "verbunden", "eingesteckt", "kabel"], weight: 32 }], exclude: ["power", "leistung", "phase", "phasen", "soc", "remaining"], threshold: 64 },
      { path: "entities.wallbox2_charging_enabled", domains: ["switch", "binary_sensor", "sensor", "input_boolean"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["enabled", "allowed", "enable", "freigabe", "aktiviert", "start", "stop"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["enabled", "allowed", "enable", "freigabe", "aktiviert", "start", "stop", "charging"], weight: 30 }], exclude: ["power", "leistung", "phase", "phasen", "soc", "remaining"], threshold: 64 },
      { path: "entities.wallbox2_remaining_time", domains: ["sensor"], required: [["wallbox", "charger", "charging", "evse", "ev charger", "ladepunkt", "lader", "laden", "easee", "go e", "goe", "zaptec"], ["2", "second", "zweite", "two"], ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"]], include: [wallboxTerms, { terms: ["2", "second", "zweite", "two"], weight: 20 }, { terms: ["remaining", "rest", "time", "duration", "verbleibend", "ladezeit"], weight: 30 }], exclude: ["power", "leistung", "phase", "soc"], threshold: 64 },
      ...evccTargets,
      { path: "garden.entities.mower_status", domains: ["sensor", "lawn_mower", "vacuum"], required: [["mower", "maeher", "maher", "mähroboter", "maehroboter", "automower", "landroid", "sileno"]], include: [mowerTerms, { terms: ["status", "state", "activity", "maeht", "mowing"], weight: 30 }], threshold: 54 },
      { path: "garden.entities.mower_battery", domains: ["sensor"], units: ["%"], required: [["mower", "maeher", "maher", "mähroboter", "maehroboter", "automower", "landroid", "sileno"], ["battery", "akku", "batterie"]], include: [mowerTerms, { terms: ["battery", "akku", "batterie"], weight: 34 }], threshold: 58 },
      { path: "garden.entities.mower_next_start", domains: ["sensor"], required: [["mower", "maeher", "maher", "mähroboter", "maehroboter", "automower", "landroid", "sileno"], ["next", "schedule", "start", "naechst", "nächst", "zeitplan"]], include: [mowerTerms, { terms: ["next start", "schedule", "zeitplan", "naechster start", "nächster start"], weight: 32 }], threshold: 58 },
      { path: "garden.entities.mower_error", domains: ["sensor", "binary_sensor"], required: [["mower", "maeher", "maher", "mähroboter", "maehroboter", "automower", "landroid", "sileno"], ["error", "fault", "problem", "fehler", "stoerung", "störung"]], include: [mowerTerms, { terms: ["error", "fault", "fehler", "stoerung", "störung"], weight: 34 }], threshold: 58 },
      { path: "garden.entities.garden_water", domains: ["switch", "binary_sensor", "sensor", "input_boolean"], required: [["garden", "garten", "garden water", "gartenwasser", "irrigation", "watering", "bewasserung", "bewaesserung", "sprinkler"]], include: [gardenTerms, irrigationTerms, { terms: ["garden water", "gartenwasser", "status", "state", "active", "watering", "ventil", "valve"], weight: 34 }], threshold: 54 },
      { path: "garden.entities.irrigation_enabled", domains: ["switch", "binary_sensor", "input_boolean", "sensor"], required: [["garden", "garten", "garden water", "gartenwasser", "irrigation", "watering", "bewasserung", "bewaesserung"], ["auto", "automatic", "automatik", "enabled", "aktiv"]], include: [gardenTerms, irrigationTerms, { terms: ["automatic", "automatik", "enabled", "aktiv"], weight: 32 }], threshold: 56 },
      { path: "garden.entities.irrigation_next_start", domains: ["sensor"], required: [["garden", "garten", "garden water", "gartenwasser", "irrigation", "watering", "bewasserung", "bewaesserung"], ["schedule", "zeitplan", "plan", "next", "naechst", "nächst"]], include: [gardenTerms, irrigationTerms, { terms: ["schedule", "zeitplan", "plan", "next", "naechste", "nächste"], weight: 32 }], threshold: 56 },
      { path: "garden.entities.irrigation_remaining", domains: ["sensor"], required: [["garden", "garten", "garden water", "gartenwasser", "irrigation", "watering", "bewasserung", "bewaesserung"], ["remaining", "rest", "restzeit", "duration", "dauer"]], include: [gardenTerms, irrigationTerms, { terms: ["remaining", "restzeit", "verbleibend", "dauer"], weight: 34 }], threshold: 56 },
      { path: "garden.entities.rain_24h", domains: ["sensor"], units: ["mm"], required: [["rain", "regen", "precipitation", "niederschlag"], ["24h", "24", "day", "tag"]], include: [gardenTerms, { terms: ["rain", "regen", "precipitation", "niederschlag"], weight: 36 }, { terms: ["24h", "24", "day", "tag"], weight: 18 }], threshold: 54 },
      { path: "garden.entities.rain_today", domains: ["sensor"], units: ["mm"], required: [["rain", "regen", "precipitation", "niederschlag"], ["today", "heute", "day", "tag"]], include: [gardenTerms, { terms: ["rain", "regen", "precipitation", "niederschlag"], weight: 36 }, { terms: ["today", "heute", "day", "tag"], weight: 20 }], threshold: 54 },
      { path: "garden.entities.outdoor_temperature", domains: ["sensor"], deviceClasses: ["temperature"], units: ["°c", "c"], required: [["outdoor", "outside", "aussen", "außen", "garden", "garten"], ["temperature", "temperatur"]], include: [gardenTerms, { terms: ["outdoor", "outside", "aussen", "außen"], weight: 28 }, { terms: ["temperature", "temperatur"], weight: 32 }], threshold: 54 },
      { path: "garden.entities.humidity", domains: ["sensor"], deviceClasses: ["humidity"], units: ["%"], required: [["outdoor", "outside", "aussen", "außen", "garden", "garten"], ["humidity", "luftfeuchte", "feuchte"]], include: [gardenTerms, { terms: ["humidity", "luftfeuchte"], weight: 36 }], threshold: 54 },
      { path: "garden.entities.soil_moisture", domains: ["sensor"], units: ["%"], required: [["soil", "boden", "moisture", "feuchte", "garten"]], include: [gardenTerms, { terms: ["soil moisture", "bodenfeuchte", "feuchte", "moisture"], weight: 38 }], threshold: 54 },
      { path: "garden.entities.soil_temperature", domains: ["sensor"], deviceClasses: ["temperature"], units: ["°c", "c"], required: [["soil", "boden", "garden", "garten"], ["temperature", "temperatur"]], include: [gardenTerms, { terms: ["soil temperature", "bodentemperatur"], weight: 38 }], threshold: 54 },
      { path: "garden.entities.water_flow", domains: ["sensor"], required: [["garden", "garten", "irrigation", "watering", "bewasserung", "bewaesserung"], ["flow", "durchfluss", "water flow"]], include: [gardenTerms, irrigationTerms, { terms: ["flow", "durchfluss", "l min"], weight: 34 }], threshold: 56 },
      { path: "garden.entities.water_consumption_today", ...volumeTarget, required: [["garden", "garten", "irrigation", "watering", "bewasserung", "bewaesserung"], ["today", "heute", "day", "tag"]], include: [gardenTerms, irrigationTerms, { terms: ["today", "heute", "water", "wasser"], weight: 28 }, ...volumeTarget.include], threshold: 56 },
      { path: "garden.entities.water_pressure", domains: ["sensor"], required: [["garden", "garten", "garden water", "gartenwasser", "irrigation", "watering", "bewasserung", "bewaesserung"], ["pressure", "druck", "bar", "wasserdruck"]], include: [gardenTerms, irrigationTerms, { terms: ["pressure", "wasserdruck", "druck", "bar"], weight: 36 }], threshold: 56 },
      { path: "garden.entities.cistern_level", domains: ["sensor"], units: ["%"], required: [["cistern", "zisterne", "rain barrel", "regenfass", "water tank", "wassertank"], ["level", "fill", "füllstand", "fuellstand", "stand"]], include: [gardenTerms, { terms: ["cistern", "zisterne", "rain barrel", "regenfass", "water tank", "wassertank"], weight: 38 }, { terms: ["level", "fill", "füllstand", "fuellstand"], weight: 30 }], threshold: 56 },
      { path: "garden.entities.garden_lights", domains: ["light", "switch", "binary_sensor", "sensor"], required: [["garden", "garten", "outdoor", "aussen", "außen", "patio", "terrasse"], ["light", "licht", "beleuchtung"]], include: [gardenEquipmentTerms, { terms: ["light", "licht", "beleuchtung"], weight: 38 }], threshold: 56 },
      { path: "garden.entities.garden_outlet", domains: ["switch", "binary_sensor", "sensor"], required: [["garden", "garten", "outdoor", "aussen", "außen"], ["outlet", "socket", "steckdose"]], include: [gardenEquipmentTerms, { terms: ["outlet", "socket", "steckdose"], weight: 38 }], threshold: 56 },
      { path: "garden.entities.pond_pump", domains: ["switch", "binary_sensor", "sensor"], required: [["pond", "teich"], ["pump", "pumpe", "filter"]], include: [gardenEquipmentTerms, { terms: ["pond", "teich"], weight: 34 }, { terms: ["pump", "pumpe", "filter"], weight: 34 }], threshold: 56 },
      { path: "garden.entities.pool_pump", domains: ["switch", "binary_sensor", "sensor"], required: [["pool", "schwimmbad"], ["pump", "pumpe", "filter"]], include: [gardenEquipmentTerms, { terms: ["pool", "schwimmbad"], weight: 34 }, { terms: ["pump", "pumpe", "filter"], weight: 34 }], threshold: 56 },
      { path: "entities.import_export_power", ...powerTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"], ["import export", "bezug einspeisung", "net", "saldo", "balance", "signed"]], include: [gridTerms, { terms: ["import export", "bezug einspeisung", "net", "saldo", "balance", "signed"], weight: 28 }, ...powerTarget.include], exclude: ["energy", "kwh", "total"], threshold: 58 },
      { path: "entities.import_export_power_voltage", ...voltageTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"]], include: [gridTerms, ...voltageTarget.include], threshold: 58 },
      { path: "entities.import_power", ...powerTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"], ["import", "bezug", "purchase", "verbrauch netz", "from grid"]], include: [gridTerms, { terms: ["import", "bezug", "purchase", "verbrauch netz", "from grid"], weight: 32 }], exclude: ["export", "einspeis", "feed", "energy", "kwh"], threshold: 62 },
      { path: "entities.export_power", ...powerTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"], ["export", "einspeis", "feed", "feedin", "to grid"]], include: [gridTerms, { terms: ["export", "einspeis", "feed", "feedin", "to grid"], weight: 32 }], exclude: ["import", "bezug", "purchase", "energy", "kwh"], threshold: 62 },
      { path: "energy_entities.import_power.entity", ...energyTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"], ["import", "bezug", "purchase", "from grid"]], block: ["power", "leistung"], include: [gridTerms, { terms: ["import", "bezug", "purchase", "from grid", "energy", "kwh", "total"], weight: 32 }], exclude: ["export", "einspeis", "feed"], threshold: 60 },
      { path: "energy_entities.export_power.entity", ...energyTarget, required: [["grid", "netz", "meter", "utility", "power meter", "smart meter"], ["export", "einspeis", "feed", "feedin", "to grid"]], block: ["power", "leistung"], include: [gridTerms, { terms: ["export", "einspeis", "feed", "feedin", "to grid", "energy", "kwh", "total"], weight: 32 }], exclude: ["import", "bezug", "purchase"], threshold: 60 },
      { path: "entities.house_consumption_power", ...powerTarget, required: [["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"]], include: [{ terms: ["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"], weight: 34 }, ...powerTarget.include], exclude: ["grid", "netz", "battery", "batterie", "pv", "solar", "wallbox"], threshold: 56 },
      { path: "entities.house_consumption_power_voltage", ...voltageTarget, required: [["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"]], include: [{ terms: ["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"], weight: 34 }, ...voltageTarget.include], exclude: ["grid", "netz", "battery", "batterie", "pv", "solar", "wallbox", ...voltageTarget.exclude], threshold: 58 },
      { path: "energy_entities.house_consumption_power.entity", ...energyTarget, required: [["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"]], block: ["power", "leistung"], include: [{ terms: ["house", "home", "load", "consumption", "verbrauch", "hausverbrauch"], weight: 32 }, ...energyTarget.include], exclude: ["grid", "netz", "battery", "batterie", "pv", "solar", "wallbox"], threshold: 58 },
      { path: "entities.water_meter", ...volumeTarget, required: [["water", "wasser", "water meter", "wasserzaehler", "wasserzahler"]], include: [waterTerms, { terms: ["meter", "counter", "zaehler", "zahler", "total", "gesamt"], weight: 22 }, ...volumeTarget.include], threshold: 54 },
    ];
  }

  _scoreEntityForTarget(entity, target) {
    if (target.required?.some((terms) => !(terms || []).some((term) => this._searchMatches(entity.haystack, term)))) {
      return 0;
    }
    if (target.block?.some((term) => this._searchMatches(entity.haystack, term))) return 0;
    let score = 0;
    if (target.domains?.includes(entity.domain)) score += 24;
    else if (target.domains?.length) score -= 18;

    const deviceClass = this._normalizeSearchText(entity.deviceClass);
    if (target.deviceClasses?.some((item) => this._normalizeSearchText(item) === deviceClass)) score += 28;
    else if (target.deviceClasses?.length && deviceClass) score -= 10;

    const unit = this._normalizeSearchText(entity.unit);
    if (target.units?.some((item) => unit === this._normalizeSearchText(item))) score += 22;
    else if (target.units?.length && unit) score -= 5;

    (target.include || []).forEach((group) => {
      const terms = Array.isArray(group) ? group : group.terms;
      const weight = Array.isArray(group) ? 16 : group.weight || 16;
      if ((terms || []).some((term) => this._searchMatches(entity.haystack, term))) score += weight;
    });
    (target.exclude || []).forEach((term) => {
      if (this._searchMatches(entity.haystack, term)) score -= 40;
    });

    if (entity.stateObj?.state && !["unknown", "unavailable", "none"].includes(String(entity.stateObj.state).toLowerCase())) score += 6;
    return Math.max(0, Math.min(100, score));
  }

  _autoDetectSuggestions() {
    const catalog = this._entityCatalog();
    if (catalog.length === 0) return [];
    const usedEntityIds = new Set();
    const usedPaths = new Set();
    return this._autoDetectTargets().map((target) => {
      if (usedPaths.has(target.path)) return null;
      const candidates = catalog
        .filter((entity) => !usedEntityIds.has(entity.entityId) || target.path.includes("energy_entities"))
        .map((entity) => ({ entity, score: this._scoreEntityForTarget(entity, target) }))
        .filter((candidate) => candidate.score >= (target.threshold || 50))
        .sort((a, b) => b.score - a.score || a.entity.entityId.localeCompare(b.entity.entityId));
      const best = candidates[0];
      if (!best) return null;
      if (!target.path.includes("energy_entities")) usedEntityIds.add(best.entity.entityId);
      const current = this._pathValue(this._config || {}, target.path) || "";
      usedPaths.add(target.path);
      return {
        path: target.path,
        label: this._entityLabelForPath(target.path),
        entityId: best.entity.entityId,
        score: best.score,
        current,
        name: best.entity.name,
      };
    }).filter(Boolean);
  }

  _applyAutoDetection(mode = "fill", onePath = "") {
    const suggestions = this._autoDetectSuggestions().filter((suggestion) => !onePath || suggestion.path === onePath);
    const next = this._cloneConfig(this._config || {});
    let changed = 0;
    suggestions.forEach((suggestion) => {
      const current = this._pathValue(next, suggestion.path);
      const hasCurrent = current !== undefined && current !== null && String(current).trim() !== "";
      if (mode === "fill" && hasCurrent && !this._isPlaceholderEntity(suggestion.path, current) && !onePath) return;
      if (onePath && hasCurrent && String(current) === suggestion.entityId) return;
      this._setPath(next, suggestion.path.split("."), suggestion.entityId);
      if (suggestion.path.startsWith("electric_vehicle.entities.")) next.show_electric_vehicle = true;
      if (suggestion.path.startsWith("garden.")) next.show_garden = true;
      if (suggestion.path.startsWith("entities.wallbox2_")) this._setPath(next, ["visible_boxes", "wallbox2_power"], true);
      if (suggestion.path === "entities.water_meter") this._setPath(next, ["visible_boxes", "water_meter"], true);
      if (suggestion.path === "entities.import_export_power" || suggestion.path === "entities.import_power" || suggestion.path === "entities.export_power") {
        this._setPath(next, ["visible_boxes", "import_export_power"], true);
        next.show_grid_status_tile = true;
      }
      changed += 1;
    });
    this._config = next;
    this._wizardMessage = changed > 0
      ? this._t("editor.setupApplied", { count: changed }, `Applied ${changed} suggestion(s).`)
      : this._t("editor.setupApplyNone", {}, "No empty fields were changed.");
    if (changed > 0) this._dispatchConfig(next);
    this._render();
  }

  _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  _editorTabIcon(key) {
    const icons = {
      setup: `<svg class="editor-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21v-5"></path><path d="M4 8V3"></path><path d="M12 21v-9"></path><path d="M12 4V3"></path><path d="M20 21v-3"></path><path d="M20 10V3"></path><path d="M2 16h4"></path><path d="M10 8h4"></path><path d="M18 14h4"></path></svg>`,
      energy: `<svg class="editor-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 10-13h-7Z"></path></svg>`,
      devices: `<svg class="editor-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v5"></path><path d="M16 2v5"></path><path d="M6 7h12v4a6 6 0 0 1-12 0Z"></path><path d="M12 17v5"></path></svg>`,
      electric_vehicle: `<svg class="editor-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17h14"></path><path d="M6 17l1.5-6.2A3 3 0 0 1 10.42 8h3.16a3 3 0 0 1 2.92 2.8L18 17"></path><path d="M7.5 13h9"></path><circle cx="8" cy="17" r="2"></circle><circle cx="16" cy="17" r="2"></circle><path d="M12 4l-1.4 2.6H13L11.4 10"></path></svg>`,
      garden: `<svg class="editor-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5C8.7 7.2 6 10.9 6 14a6 6 0 0 0 12 0c0-3.1-2.7-6.8-6-10.5Z"></path></svg>`,
      environment: `<svg class="editor-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 14.76V5a4 4 0 0 0-8 0v9.76A5 5 0 1 0 14 14.76Z"></path><path d="M10 9h4"></path></svg>`,
      floorplan: `<svg class="editor-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V4h16v16Z"></path><path d="M4 10h7"></path><path d="M14 4v7"></path><path d="M11 10v10"></path><path d="M11 15h9"></path></svg>`,
      layout: `<svg class="editor-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h7v6H4Z"></path><path d="M13 5h7v4h-7Z"></path><path d="M13 11h7v8h-7Z"></path><path d="M4 13h7v6H4Z"></path></svg>`,
      appearance: `<svg class="editor-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v2"></path><path d="M12 19v2"></path><path d="M4.22 4.22 5.64 5.64"></path><path d="M18.36 18.36 19.78 19.78"></path><path d="M3 12h2"></path><path d="M19 12h2"></path><circle cx="12" cy="12" r="4"></circle></svg>`,
      advisor: `<svg class="editor-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M8 14a6 6 0 1 1 8 0c-.8.7-1 1.4-1 2H9c0-.6-.2-1.3-1-2Z"></path><path d="M10.2 10.8 12 12.6l2.8-3.2"></path></svg>`,
      advanced: `<svg class="editor-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 9-4 3 4 3"></path><path d="m16 9 4 3-4 3"></path><path d="m14 5-4 14"></path></svg>`,
    };
    return icons[key] || icons.setup;
  }

  _renderEntityInput(metric) {
    if (metric.key === "pv_roof_power") return "";
    if (metric.key === "inverter_power") return "";
    if (metric.key === "import_export_power") {
      return `
        <label>${this._labelText(this._t("editor.importExportSignedEntity", {}, "Signed import/export sensor (+/-)"), this._t("editor.helpSignedGrid", {}, "Use one sensor where positive values mean grid import and negative values mean export. Leave it empty when using separate import and export sensors."))}
          <input data-path="entities.import_export_power" list="ha-solar-dashboard-entities" placeholder="sensor.grid_power" value="${this._escape(this._config?.entities?.import_export_power || "")}" autocomplete="off" />
        </label>
        <label>${this._labelText(this._t("editor.importPowerEntity", {}, "Import sensor"))}
          <input data-path="entities.import_power" list="ha-solar-dashboard-entities" placeholder="sensor.grid_import_power" value="${this._escape(this._config?.entities?.import_power || "")}" autocomplete="off" />
        </label>
        <label>${this._labelText(this._t("editor.exportPowerEntity", {}, "Export sensor"))}
          <input data-path="entities.export_power" list="ha-solar-dashboard-entities" placeholder="sensor.grid_export_power" value="${this._escape(this._config?.entities?.export_power || "")}" autocomplete="off" />
        </label>
      `;
    }
    const selected = this._config?.entities?.[metric.key] || "";
    const label = this._metricLabel(metric);
    const fieldLabel = metric.unit === "power" ? this._t("editor.liveEntity") : this._t("editor.entity");
    return `
      <label>${this._labelText(fieldLabel, this._t("editor.helpHomeAssistantSensor", {}, "Choose the Home Assistant entity that provides this value."))}
        <input data-path="entities.${metric.key}" list="ha-solar-dashboard-entities" placeholder="${this._escape(this._t("editor.entityPlaceholder", { label }))}" value="${this._escape(selected)}" autocomplete="off" />
      </label>
    `;
  }

  _defaultMetricLabel(metric) {
    const variant = this._houseVariant();
    if (variant.labelKeys?.[metric.key]) return this._t(variant.labelKeys[metric.key], {}, variant.labels?.[metric.key] || metric.label);
    if (variant.labels?.[metric.key]) return this._t(`metrics.${metric.key}`, {}, variant.labels[metric.key]);
    return this._t(`metrics.${metric.key}`, {}, metric.label);
  }

  _renderLabelInput(metric) {
    const value = this._config.labels?.[metric.key] || "";
    return `
      <label>${this._escape(this._t("editor.overlayLabel"))}
        <input data-path="labels.${metric.key}" placeholder="${this._escape(this._defaultMetricLabel(metric))}" value="${this._escape(value)}" />
      </label>
    `;
  }

  _renderImportExportLabelInputs(metric) {
    if (metric.key !== "import_export_power") return "";
    const labelFields = [
      ["import_export_import", "editor.importLabel", this._t("status.import", {}, "Import")],
      ["import_export_export", "editor.exportLabel", this._t("status.export", {}, "Export")],
      ["import_export_neutral", "editor.neutralLabel", this._t("status.selfSufficient", {}, "Self-sufficient")],
    ].map(([key, labelKey, placeholder]) => {
      const value = this._config.labels?.[key] || "";
      return `
        <label>${this._escape(this._t(labelKey, {}, placeholder))}
          <input data-path="labels.${key}" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" />
        </label>
      `;
    }).join("");
    return `
      <details class="pv-labels">
        <summary>${this._escape(this._t("editor.importExportLabels", {}, "Import/Export labels"))}</summary>
        <div class="details-grid">${labelFields}</div>
      </details>
    `;
  }

  _renderImportExportFinanceInputs(metric) {
    if (metric.key !== "import_export_power") return "";
    const importCounter = this._energyEntityConfig({ key: "import_power" });
    const exportCounter = this._energyEntityConfig({ key: "export_power" });
    const importCounterValue = importCounter.entity || importCounter.counter || importCounter.kwh_entity || importCounter.kwh || importCounter.meter || "";
    const exportCounterValue = exportCounter.entity || exportCounter.counter || exportCounter.kwh_entity || exportCounter.kwh || exportCounter.meter || "";
    return `
      <details class="pv-labels" open>
        <summary>${this._escape(this._t("editor.importExportFinance", {}, "Import/export costs"))}</summary>
        <div class="details-grid">
          <label>${this._labelText(this._t("editor.importEnergyCounterEntity", {}, "Import energy counter"), this._t("editor.helpImportExportFinance", {}, "Use cumulative kWh counters. The card calculates today's amount from local midnight."))}
            <input data-path="energy_entities.import_power.entity" list="ha-solar-dashboard-entities" placeholder="sensor.grid_import_energy_total" value="${this._escape(importCounterValue)}" autocomplete="off" />
          </label>
          <label>${this._labelText(this._t("editor.exportEnergyCounterEntity", {}, "Export energy counter"), this._t("editor.helpImportExportFinance", {}, "Use cumulative kWh counters. The card calculates today's amount from local midnight."))}
            <input data-path="energy_entities.export_power.entity" list="ha-solar-dashboard-entities" placeholder="sensor.grid_export_energy_total" value="${this._escape(exportCounterValue)}" autocomplete="off" />
          </label>
          <label>${this._escape(this._t("editor.gridImportPrice", {}, "Grid import price per kWh"))}
            <input type="number" min="0" step="0.0001" data-path="grid_import_price" value="${this._escape(this._config.grid_import_price ?? "")}" />
          </label>
          <label>${this._escape(this._t("editor.gridExportPrice", {}, "Feed-in tariff per kWh"))}
            <input type="number" min="0" step="0.0001" data-path="grid_export_price" value="${this._escape(this._config.grid_export_price ?? "")}" />
          </label>
          <label>${this._escape(this._t("editor.currency", {}, "Currency"))}
            <input data-path="currency" placeholder="€" value="${this._escape(this._config.currency || "€")}" />
          </label>
        </div>
        <div class="checkbox-grid">
          <label class="inline"><input type="checkbox" data-path="show_grid_daily_finance" ${this._config.show_grid_daily_finance !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showGridDailyFinance", {}, "Show today's costs and revenue labels"))}</label>
        </div>
      </details>
    `;
  }

  _labelVisibility(key) {
    const configured = this._config.label_visibility?.[key] || {};
    return {
      image: configured.image !== false,
      footer: configured.footer !== false && configured.kpi !== false,
      hideMobile: configured.hide_mobile === true || configured.mobile === false,
      hideDesktop: configured.hide_desktop === true || configured.desktop === false,
    };
  }

  _renderLabelVisibilityOptions(key) {
    const visibility = this._labelVisibility(key);
    const isOpen = this._openLabelOptions?.has(key);
    const checkbox = (path, checked, label) => htmlTag("label", { class: "inline" }, [
      rawHtml(htmlTag("input", { type: "checkbox", "data-path": path, checked })),
      ` ${label}`,
    ]);
    const checkboxGrid = htmlTag("div", { class: "checkbox-grid" }, rawHtml([
      checkbox(`label_visibility.${key}.image`, visibility.image, this._t("editor.labelShowImage", {}, "Show label in image")),
      checkbox(`label_visibility.${key}.footer`, visibility.footer, this._t("editor.labelShowFooter", {}, "Show label in footer KPIs")),
      checkbox(`label_visibility.${key}.hide_mobile`, visibility.hideMobile, this._t("editor.labelHideMobile", {}, "Hide on phones")),
      checkbox(`label_visibility.${key}.hide_desktop`, visibility.hideDesktop, this._t("editor.labelHideDesktop", {}, "Hide on desktop")),
    ].join("")));
    return htmlTag("details", {
      class: "label-options",
      "data-label-options": key,
      open: isOpen,
    }, [
      rawHtml(htmlTag("summary", {}, this._t("editor.labelOptions", {}, "Label display"))),
      rawHtml(checkboxGrid),
    ]);
  }

  _energyEntityConfig(metric) {
    const config = this._config.energy_entities?.[metric.key];
    if (!config) return {};
    if (typeof config === "string") return { entity: config };
    return typeof config === "object" ? config : {};
  }

  _renderEnergyEntityInputs(metric) {
    if (metric.unit !== "power") return "";
    if (metric.key === "pv_roof_power") return "";
    if (metric.key === "inverter_power") return "";
    if (metric.key === "import_export_power") return "";
    const config = this._energyEntityConfig(metric);
    const counterValue = config.entity || config.counter || config.kwh_entity || config.kwh || config.meter || "";

    return `
      <label>${this._labelText(this._t("editor.energyCounterEntity"), this._t("editor.helpEnergyCounter", {}, "Optional cumulative energy counter used for 1h, 24h, month, year, and total views."))}
        <input data-path="energy_entities.${metric.key}.entity" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(metric.key)}_energy_total" value="${this._escape(counterValue)}" autocomplete="off" />
      </label>
    `;
  }

  _metricVoltageEntityKey(metric) {
    if (!metric || metric.unit !== "power") return "";
    return metricVoltageEntityKey(metric);
  }

  _metricVoltagePhaseFields(metric) {
    return inverterPhaseVoltageEntityKeys(metric).map((key) => [
      key,
      `editor.voltageEntity${key.slice(-2).toUpperCase()}`,
      `Voltage ${key.slice(-2).toUpperCase()} entity`,
    ]);
  }

  _renderVoltageEntityInput(metric) {
    if (metric?.key === "inverter_power") return "";
    const key = this._metricVoltageEntityKey(metric);
    if (!key) return "";
    const selected = this._config?.entities?.[key] || "";
    const phaseFields = this._metricVoltagePhaseFields(metric).map(([phaseKey, labelKey, fallback]) => `
      <label>${this._escape(this._t(labelKey, {}, fallback))}
        <input data-path="entities.${phaseKey}" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(phaseKey)}" value="${this._escape(this._config?.entities?.[phaseKey] || "")}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions(phaseKey)}
    `).join("");
    return `
      <label>${this._escape(this._t("editor.voltageEntity", {}, "Voltage entity"))}
        <input data-path="entities.${key}" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(key)}" value="${this._escape(selected)}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions(key)}
      ${phaseFields}
    `;
  }

  _isPvMetric(metric) {
    return isPvMetric(metric);
  }

  _pvLabelKey(metric, label) {
    return `${metric.key}_${label.suffix}`;
  }

  _renderPvLabelInputs(metric) {
    if (!this._isPvMetric(metric)) return "";
    const fieldHtml = PV_LABELS.map((label) => {
      const key = this._pvLabelKey(metric, label);
      if (label.source === "metric") {
        return `
          <div class="label-entity-block">
            <div class="label-entity-title">${this._escape(this._t(label.editorKey, {}, "Power label"))}</div>
            ${this._renderLabelVisibilityOptions(key)}
          </div>
        `;
      }
      const value = this._config.entities?.[key] || "";
      return `
        <label>${this._escape(this._t(label.editorKey, {}, label.suffix))}
          <input data-path="entities.${key}" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(key)}" value="${this._escape(value)}" autocomplete="off" />
        </label>
        ${this._renderLabelVisibilityOptions(key)}
      `;
    }).join("");
    return `
      <details class="pv-labels" open>
        <summary>${this._escape(this._t("editor.pvLabels", {}, "PV labels"))}</summary>
        <div class="details-grid">${fieldHtml}</div>
      </details>
    `;
  }

  _renderPvRoofStringInputs(metric) {
    if (metric?.key !== "pv_roof_power") return "";
    const strings = normalizePvRoofStrings(this._config.pv_roof_strings || []);
    this._config.pv_roof_strings = strings;
    const baseEnergyConfig = this._energyEntityConfig(metric);
    const baseEnergyEntity = baseEnergyConfig.entity || baseEnergyConfig.counter || baseEnergyConfig.kwh_entity || baseEnergyConfig.kwh || baseEnergyConfig.meter || "";
    const baseMaxPowerKw = this._maxPowerKwValue(metric);
    const basePowerEntity = this._config?.entities?.pv_roof_power || "";
    const selectedDisplay = normalizePvRoofStringDisplay(this._config.pv_roof_string_display);
    const displayOptions = [
      ["sum", this._t("editor.pvRoofStringDisplaySum", {}, "Sum strings")],
      ["values", this._t("editor.pvRoofStringDisplayValues", {}, "Show string values")],
      ["dominant", this._t("editor.pvRoofStringDisplayDominant", {}, "Highest string large, others small")],
    ].map(([value, label]) => (
      `<option value="${this._escape(value)}"${value === selectedDisplay ? " selected" : ""}>${this._escape(label)}</option>`
    )).join("");
    const baseStringField = `
      <div class="box-field pv-string-field">
        <div class="kpi-head">
          <strong>String 1</strong>
        </div>
        <label>${this._escape(this._t("editor.pvRoofStringPowerEntity", {}, "String power entity"))}
          <input data-path="entities.pv_roof_power" list="ha-solar-dashboard-entities" placeholder="sensor.pv_roof_power" value="${this._escape(basePowerEntity)}" autocomplete="off" />
        </label>
        <label>${this._escape(this._t("editor.pvRoofStringEnergyEntity", {}, "String kWh counter entity"))}
          <input data-path="energy_entities.pv_roof_power.entity" list="ha-solar-dashboard-entities" placeholder="sensor.pv_roof_power_energy_total" value="${this._escape(baseEnergyEntity)}" autocomplete="off" />
        </label>
        <label>${this._escape(this._t("editor.maxPowerKw"))}
          <input type="number" min="0" step="0.1" data-path="max_power_kw.pv_roof_power" placeholder="5.0" value="${this._escape(baseMaxPowerKw)}" />
        </label>
      </div>
    `;
    const stringFields = strings.map((string, index) => {
      const label = string.label || `String ${index + 2}`;
      const powerEntity = string.power_entity || "";
      const energyEntity = string.energy_entity || "";
      const maxPowerKw = string.max_power_kw ?? "";
      return `
        <div class="box-field pv-string-field">
          <div class="kpi-head">
            <strong>${this._escape(label)}</strong>
            <button type="button" data-action="remove-pv-roof-string" data-index="${this._escape(index)}">${this._escape(this._t("editor.kpiRemove"))}</button>
          </div>
          <label>${this._escape(this._t("editor.pvRoofStringLabel", {}, "String name"))}
            <input data-path="pv_roof_strings.${index}.label" placeholder="String ${this._escape(index + 2)}" value="${this._escape(label)}" />
          </label>
          <label>${this._escape(this._t("editor.pvRoofStringPowerEntity", {}, "String power entity"))}
            <input data-path="pv_roof_strings.${index}.power_entity" list="ha-solar-dashboard-entities" placeholder="sensor.pv_roof_string_${this._escape(index + 2)}_power" value="${this._escape(powerEntity)}" autocomplete="off" />
          </label>
          <label>${this._escape(this._t("editor.pvRoofStringEnergyEntity", {}, "String kWh counter entity"))}
            <input data-path="pv_roof_strings.${index}.energy_entity" list="ha-solar-dashboard-entities" placeholder="sensor.pv_roof_string_${this._escape(index + 2)}_energy_total" value="${this._escape(energyEntity)}" autocomplete="off" />
          </label>
          <label>${this._escape(this._t("editor.maxPowerKw"))}
            <input type="number" min="0" step="0.1" data-path="pv_roof_strings.${index}.max_power_kw" placeholder="5.0" value="${this._escape(maxPowerKw)}" />
          </label>
        </div>
      `;
    }).join("");

    return `
      <details class="pv-labels" open>
        <summary>${this._escape(this._t("editor.pvRoofStrings", {}, "Roof PV strings"))}</summary>
        <div class="details-grid">
          <label>${this._escape(this._t("editor.pvRoofStringDisplay", {}, "Roof PV string display"))}
            <select data-path="pv_roof_string_display">${displayOptions}</select>
          </label>
          ${baseStringField}
          ${stringFields}
          <button type="button" data-action="add-pv-roof-string">${this._escape(this._t("editor.pvRoofStringAdd", {}, "Add string"))}</button>
        </div>
      </details>
    `;
  }

  _renderInverterInputs(metric) {
    if (metric?.key !== "inverter_power") return "";
    const inverters = normalizeInverters(this._config.inverters || []);
    this._config.inverters = inverters;
    const baseEnergyConfig = this._energyEntityConfig(metric);
    const baseEnergyEntity = baseEnergyConfig.entity || baseEnergyConfig.counter || baseEnergyConfig.kwh_entity || baseEnergyConfig.kwh || baseEnergyConfig.meter || "";
    const baseMaxPowerKw = this._maxPowerKwValue(metric);
    const basePowerEntity = this._config?.entities?.inverter_power || "";
    const baseVoltageEntity = this._config?.entities?.inverter_power_voltage || "";
    const baseVoltageEntityL1 = this._config?.entities?.inverter_power_voltage_l1 || "";
    const baseVoltageEntityL2 = this._config?.entities?.inverter_power_voltage_l2 || "";
    const baseVoltageEntityL3 = this._config?.entities?.inverter_power_voltage_l3 || "";
    const inverterLabel = this._t("metrics.inverter_power", {}, "Inverter");
    const selectedDisplay = normalizeInverterDisplay(this._config.inverter_display);
    const displayOptions = [
      ["sum", this._t("editor.inverterDisplaySum", {}, "Sum inverters")],
      ["values", this._t("editor.inverterDisplayValues", {}, "Show inverter values")],
      ["dominant", this._t("editor.inverterDisplayDominant", {}, "Highest inverter large, others small")],
    ].map(([value, label]) => (
      `<option value="${this._escape(value)}"${value === selectedDisplay ? " selected" : ""}>${this._escape(label)}</option>`
    )).join("");
    const baseInverterField = `
      <div class="box-field pv-string-field">
        <div class="kpi-head">
          <strong>${this._escape(inverterLabel)} 1</strong>
        </div>
        <label>${this._escape(this._t("editor.inverterPowerEntity", {}, "Inverter power entity"))}
          <input data-path="entities.inverter_power" list="ha-solar-dashboard-entities" placeholder="sensor.inverter_power" value="${this._escape(basePowerEntity)}" autocomplete="off" />
        </label>
        <label>${this._escape(this._t("editor.inverterEnergyEntity", {}, "Inverter kWh counter entity"))}
          <input data-path="energy_entities.inverter_power.entity" list="ha-solar-dashboard-entities" placeholder="sensor.inverter_energy_total" value="${this._escape(baseEnergyEntity)}" autocomplete="off" />
        </label>
        ${this._renderInverterVoltageInputs({
          pathPrefix: "entities",
          fieldPrefix: "inverter_power",
          voltageEntity: baseVoltageEntity,
          voltageEntityL1: baseVoltageEntityL1,
          voltageEntityL2: baseVoltageEntityL2,
          voltageEntityL3: baseVoltageEntityL3,
          visibilityBaseKey: "inverter_power_voltage",
        })}
        <label>${this._escape(this._t("editor.maxPowerKw"))}
          <input type="number" min="0" step="0.1" data-path="max_power_kw.inverter_power" placeholder="10.0" value="${this._escape(baseMaxPowerKw)}" />
        </label>
      </div>
    `;
    const inverterFields = inverters.map((inverter, index) => {
      const defaultEnglishLabel = `Inverter ${index + 2}`;
      const label = !inverter.label || inverter.label === defaultEnglishLabel
        ? `${inverterLabel} ${index + 2}`
        : inverter.label;
      const powerEntity = inverter.power_entity || "";
      const energyEntity = inverter.energy_entity || "";
      const voltageEntity = inverter.voltage_entity || "";
      const voltageEntityL1 = inverter.voltage_entity_l1 || "";
      const voltageEntityL2 = inverter.voltage_entity_l2 || "";
      const voltageEntityL3 = inverter.voltage_entity_l3 || "";
      const maxPowerKw = inverter.max_power_kw ?? "";
      const visibilityBaseKey = `inverter_${String(inverter.id || `inverter_${index + 2}`).replace(/[^\w-]+/g, "_")}_voltage`;
      return `
        <div class="box-field pv-string-field">
          <div class="kpi-head">
            <strong>${this._escape(label)}</strong>
            <button type="button" data-action="remove-inverter" data-index="${this._escape(index)}">${this._escape(this._t("editor.kpiRemove"))}</button>
          </div>
          <label>${this._escape(this._t("editor.inverterLabel", {}, "Inverter name"))}
            <input data-path="inverters.${index}.label" placeholder="${this._escape(inverterLabel)} ${this._escape(index + 2)}" value="${this._escape(label)}" />
          </label>
          <label>${this._escape(this._t("editor.inverterPowerEntity", {}, "Inverter power entity"))}
            <input data-path="inverters.${index}.power_entity" list="ha-solar-dashboard-entities" placeholder="sensor.inverter_${this._escape(index + 2)}_power" value="${this._escape(powerEntity)}" autocomplete="off" />
          </label>
          <label>${this._escape(this._t("editor.inverterEnergyEntity", {}, "Inverter kWh counter entity"))}
            <input data-path="inverters.${index}.energy_entity" list="ha-solar-dashboard-entities" placeholder="sensor.inverter_${this._escape(index + 2)}_energy_total" value="${this._escape(energyEntity)}" autocomplete="off" />
          </label>
          ${this._renderInverterVoltageInputs({
            pathPrefix: `inverters.${index}`,
            fieldPrefix: "",
            voltageEntity,
            voltageEntityL1,
            voltageEntityL2,
            voltageEntityL3,
            visibilityBaseKey,
          })}
          <label>${this._escape(this._t("editor.maxPowerKw"))}
            <input type="number" min="0" step="0.1" data-path="inverters.${index}.max_power_kw" placeholder="10.0" value="${this._escape(maxPowerKw)}" />
          </label>
        </div>
      `;
    }).join("");

    return `
      <details class="pv-labels" open>
        <summary>${this._escape(this._t("editor.inverters", {}, "Inverters"))}</summary>
        <div class="details-grid">
          <label>${this._escape(this._t("editor.inverterDisplay", {}, "Inverter display"))}
            <select data-path="inverter_display">${displayOptions}</select>
          </label>
          ${baseInverterField}
          ${inverterFields}
          <button type="button" data-action="add-inverter">${this._escape(this._t("editor.inverterAdd", {}, "Add inverter"))}</button>
        </div>
      </details>
    `;
  }

  _renderInverterVoltageInputs({
    pathPrefix,
    fieldPrefix,
    voltageEntity = "",
    voltageEntityL1 = "",
    voltageEntityL2 = "",
    voltageEntityL3 = "",
    visibilityBaseKey,
  } = {}) {
    const fieldPath = (field) => {
      if (fieldPrefix) return `${pathPrefix}.${fieldPrefix}_${field}`;
      return field === "voltage"
        ? `${pathPrefix}.voltage_entity`
        : `${pathPrefix}.voltage_entity_${field.slice(-2)}`;
    };
    const voltageFields = [
      ["voltage", this._t("editor.voltageEntity", {}, "Voltage entity"), "sensor.inverter_voltage", voltageEntity, visibilityBaseKey],
      ["voltage_l1", this._t("editor.voltageEntityL1", {}, "Voltage L1 entity"), "sensor.inverter_voltage_l1", voltageEntityL1, `${visibilityBaseKey}_l1`],
      ["voltage_l2", this._t("editor.voltageEntityL2", {}, "Voltage L2 entity"), "sensor.inverter_voltage_l2", voltageEntityL2, `${visibilityBaseKey}_l2`],
      ["voltage_l3", this._t("editor.voltageEntityL3", {}, "Voltage L3 entity"), "sensor.inverter_voltage_l3", voltageEntityL3, `${visibilityBaseKey}_l3`],
    ];
    return voltageFields.map(([field, label, placeholder, value, visibilityKey]) => `
      <label>${this._escape(label)}
        <input data-path="${this._escape(fieldPath(field))}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions(visibilityKey)}
    `).join("");
  }

  _wallboxPhaseEntityKey(metric) {
    return wallboxPhaseEntityKey(metric);
  }

  _wallboxPhaseActionEntityKey(metric) {
    return wallboxPhaseActionEntityKey(metric);
  }

  _wallboxPhaseRemainingEntityKey(metric) {
    return wallboxPhaseRemainingEntityKey(metric);
  }

  _renderWallboxPhaseInput(metric) {
    const entityKey = this._wallboxPhaseEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "sensor.wallbox_2_phases"
      : "sensor.wallbox_phases";
    return `
      <label>${this._escape(this._t("editor.phaseEntity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions(entityKey)}
    `;
  }

  _renderWallboxPhaseActionInput(metric) {
    const actionKey = this._wallboxPhaseActionEntityKey(metric);
    const remainingKey = this._wallboxPhaseRemainingEntityKey(metric);
    if (!actionKey || !remainingKey) return "";
    const actionValue = this._config.entities?.[actionKey] || "";
    const remainingValue = this._config.entities?.[remainingKey] || "";
    const base = metric.key === "wallbox2_power" ? "wallbox_2" : "wallbox";
    return `
      <label>${this._escape(this._t("editor.phaseActionEntity", {}, "Upcoming phase action entity"))}
        <input data-path="entities.${actionKey}" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(base)}_phase_action_value" value="${this._escape(actionValue)}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.phaseRemainingEntity", {}, "Phase action remaining seconds entity"))}
        <input data-path="entities.${remainingKey}" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(base)}_phase_remaining" value="${this._escape(remainingValue)}" autocomplete="off" />
      </label>
    `;
  }

  _wallboxSocEntityKey(metric) {
    return wallboxSocEntityKey(metric);
  }

  _renderWallboxSocInput(metric) {
    const entityKey = this._wallboxSocEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "sensor.wallbox_2_vehicle_soc"
      : "sensor.wallbox_vehicle_soc";
    return `
      <label>${this._escape(this._t("editor.vehicleSocEntity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions(entityKey)}
    `;
  }

  _wallboxMaxSocEntityKey(metric) {
    return wallboxMaxSocEntityKey(metric);
  }

  _renderWallboxMaxSocInput(metric) {
    const entityKey = this._wallboxMaxSocEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "number.wallbox_2_target_soc"
      : "number.wallbox_target_soc";
    return `
      <label>${this._escape(this._t("editor.vehicleMaxSocEntity", {}, "Vehicle max/target SoC entity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
    `;
  }

  _wallboxConnectedEntityKey(metric) {
    return wallboxConnectedEntityKey(metric);
  }

  _renderWallboxConnectedInput(metric) {
    const entityKey = this._wallboxConnectedEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "binary_sensor.wallbox_2_vehicle_connected"
      : "binary_sensor.wallbox_vehicle_connected";
    return `
      <label>${this._escape(this._t("editor.vehicleConnectedEntity", {}, "Vehicle connected entity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
    `;
  }

  _wallboxChargingEnabledEntityKey(metric) {
    return wallboxChargingEnabledEntityKey(metric);
  }

  _renderWallboxChargingEnabledInput(metric) {
    const entityKey = this._wallboxChargingEnabledEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "switch.wallbox_2_charging_enabled"
      : "switch.wallbox_charging_enabled";
    return `
      <label>${this._escape(this._t("editor.vehicleChargingEnabledEntity", {}, "Charging enabled entity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
    `;
  }

  _wallboxRemainingTimeEntityKey(metric) {
    return wallboxRemainingTimeEntityKey(metric);
  }

  _renderWallboxRemainingTimeInput(metric) {
    const entityKey = this._wallboxRemainingTimeEntityKey(metric);
    if (!entityKey) return "";
    const value = this._config.entities?.[entityKey] || "";
    const placeholder = metric.key === "wallbox2_power"
      ? "sensor.wallbox_2_remaining_time"
      : "sensor.wallbox_remaining_time";
    return `
      <label>${this._escape(this._t("editor.remainingChargeTimeEntity"))}
        <input data-path="entities.${entityKey}" list="ha-solar-dashboard-entities" placeholder="${this._escape(placeholder)}" value="${this._escape(value)}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions(entityKey)}
    `;
  }

  _unitValue(metric) {
    const metricUnit = this._config?.units?.[metric.key];
    if (metricUnit !== undefined && String(metricUnit).trim() !== "") return String(metricUnit);
    if (metric.unit === "power") return String(this._config?.units?.power || "auto");
    if (metric.unit === "volume") return String(this._config?.units?.volume || "m³");
    return String(this._config?.units?.[metric.unit] || "");
  }

  _renderUnitSelect(metric) {
    const selected = this._unitValue(metric);
    const baseOptions = metric.unit === "power"
      ? [
        ["auto", this._t("editor.auto")],
        ["W", "W"],
        ["kW", "kW"],
        ["kWh", "kWh"],
      ]
      : metric.unit === "volume"
        ? [
          ["m³", "m³"],
          ["auto", this._t("editor.auto")],
          ["L", "L"],
        ]
        : [["%", "%"]];
    const hasSelected = baseOptions.some(([value]) => value.toLowerCase() === selected.toLowerCase());
    const options = [
      ...(hasSelected || !selected ? [] : [[selected, selected]]),
      ...baseOptions,
    ].map(([value, label]) => {
      const isSelected = value.toLowerCase() === selected.toLowerCase();
      return `<option value="${this._escape(value)}"${isSelected ? " selected" : ""}>${this._escape(label)}</option>`;
    }).join("");

    return `
      <label>${this._labelText(this._t("editor.unit"), this._t("editor.helpUnitAuto", {}, "Use Auto to display the unit reported by the Home Assistant entity. Choose another value only when you want to override it."))}
        <select data-path="units.${metric.key}">
          ${options}
        </select>
      </label>
    `;
  }

  _maxPowerKwValue(metric) {
    const value = this._config?.max_power_kw?.[metric.key];
    if (value !== undefined && value !== null && value !== "") return value;
    return "";
  }

  _renderMaxPowerInput(metric) {
    if (metric.unit !== "power") return "";
    if (metric.key === "pv_roof_power") return "";
    if (metric.key === "inverter_power") return "";
    const value = this._maxPowerKwValue(metric);
    return `
      <label>${this._labelText(this._t("editor.maxPowerKw"), this._t("editor.helpMaxPower", {}, "Used only for the utilization bar and Advisor load checks."))}
        <input type="number" min="0" step="0.1" data-path="max_power_kw.${metric.key}" placeholder="11" value="${this._escape(value)}" />
      </label>
    `;
  }

  _renderBatteryFlowInputs(metric) {
    if (metric.key !== "battery_level") return "";
    return `
      <label>${this._labelText(this._t("editor.batteryFlowEntity"), this._t("editor.helpSignedBattery", {}, "Use one signed sensor when possible: positive means charging, negative means discharging."))}
        <input data-path="entities.battery_flow_power" list="ha-solar-dashboard-entities" placeholder="sensor.battery_power" value="${this._escape(this._config.entities?.battery_flow_power || "")}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions("battery_flow_power")}
      <label>${this._escape(this._t("editor.voltageEntity", {}, "Voltage entity"))}
        <input data-path="entities.battery_flow_power_voltage" list="ha-solar-dashboard-entities" placeholder="sensor.battery_voltage" value="${this._escape(this._config.entities?.battery_flow_power_voltage || "")}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions("battery_flow_power_voltage")}
      <label>${this._escape(this._t("editor.batteryChargeEntity"))}
        <input data-path="entities.battery_charge_power" list="ha-solar-dashboard-entities" placeholder="sensor.battery_charge_power" value="${this._escape(this._config.entities?.battery_charge_power || "")}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.batteryDischargeEntity"))}
        <input data-path="entities.battery_discharge_power" list="ha-solar-dashboard-entities" placeholder="sensor.battery_discharge_power" value="${this._escape(this._config.entities?.battery_discharge_power || "")}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.batteryMinSocEntity", {}, "Battery min SoC entity"))}
        <input data-path="entities.battery_min_soc" list="ha-solar-dashboard-entities" placeholder="number.battery_min_soc" value="${this._escape(this._config.entities?.battery_min_soc || "")}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.batteryMaxSocEntity", {}, "Battery max SoC entity"))}
        <input data-path="entities.battery_max_soc" list="ha-solar-dashboard-entities" placeholder="number.battery_max_soc" value="${this._escape(this._config.entities?.battery_max_soc || "")}" autocomplete="off" />
      </label>
      <label>${this._escape(this._t("editor.batteryTemperatureEntity"))}
        <input data-path="entities.battery_temperature" list="ha-solar-dashboard-entities" placeholder="sensor.battery_temperature" value="${this._escape(this._config.entities?.battery_temperature || "")}" autocomplete="off" />
      </label>
      ${this._renderLabelVisibilityOptions("battery_temperature")}
      <label>${this._escape(this._t("editor.batteryCyclesTodayEntity", {}, "Battery cycles today entity"))}
        <input data-path="entities.battery_cycles_today" list="ha-solar-dashboard-entities" placeholder="sensor.battery_cycles_today" value="${this._escape(this._config.entities?.battery_cycles_today || "")}" autocomplete="off" />
      </label>
    `;
  }

  _houseVariant() {
    const house = this._normalizeHouse(this._config.house) || "single_family_home";
    return HOUSE_VARIANTS[house] || HOUSE_VARIANTS.single_family_home;
  }

  _metricVisible(metric) {
    const configured = this._config.visible_boxes?.[metric.key];
    if (configured !== undefined) return configured !== false;
    if (metric.optional && !this._config.entities?.[metric.key]) return false;
    return this._houseVariant().visible_boxes?.[metric.key] !== false;
  }

  _metricLabel(metric) {
    if (metric.overlay) return this._overlayLabel(metric.overlay);
    const customLabel = this._config.labels?.[metric.key];
    if (customLabel !== undefined && String(customLabel).trim() !== "") return String(customLabel).trim();
    return this._defaultMetricLabel(metric);
  }

  _metricPosition(metric) {
    const variant = this._houseVariant();
    if (metric.key === "wallbox2_power") {
      const configured = this._config.positions?.wallbox2_power || {};
      const base = {
        ...(variant.positions.wallbox_power || {}),
        ...(this._config.positions?.wallbox_power || {}),
      };
      return configured.left !== undefined || configured.top !== undefined
        ? { ...adjacentWallboxPosition(base), ...configured }
        : adjacentWallboxPosition(base);
    }
    return {
      ...(variant.positions[metric.key] || {}),
      ...(this._config.positions?.[metric.key] || {}),
    };
  }

  _renderBoxField(metric) {
    const position = this._metricPosition(metric);
    const left = Number.isFinite(Number(position.left)) ? Number(position.left) : 50;
    const top = Number.isFinite(Number(position.top)) ? Number(position.top) : 50;
    const visible = this._metricVisible(metric);
    const configuredValues = this._metricConfigValues(metric);
    const configured = this._countConfigured(configuredValues);
    const missing = this._missingEntityCount(configuredValues);
    const detailsKey = `metric-${metric.key}`;
    const status = this._statusText({ configured, missing, hidden: visible ? 0 : 1 });

    return `
      <details class="box-field metric-field" data-editor-section="${this._escape(detailsKey)}"${this._detailsOpen(detailsKey) ? " open" : ""}>
        <summary class="box-summary">
          <span class="box-summary-main">
            <strong>${this._escape(this._metricLabel(metric))}</strong>
            <small>${this._escape(this._t(`metrics.${metric.key}`, {}, metric.label || metric.key))}</small>
          </span>
          <span class="box-summary-side">
            <span class="section-status">${this._escape(status)}</span>
          </span>
        </summary>
        <div class="box-body">
          <label class="inline"><input type="checkbox" data-path="visible_boxes.${metric.key}" ${visible ? "checked" : ""}/> ${this._escape(this._t("editor.showBox", { label: this._metricLabel(metric) }))}</label>
          ${this._renderLabelInput(metric)}
          ${this._renderImportExportLabelInputs(metric)}
          ${this._renderImportExportFinanceInputs(metric)}
          ${this._renderEntityInput(metric)}
          ${this._renderVoltageEntityInput(metric)}
          ${this._renderPvLabelInputs(metric)}
          ${this._renderPvRoofStringInputs(metric)}
          ${this._renderInverterInputs(metric)}
          ${this._renderEnergyEntityInputs(metric)}
          ${this._renderWallboxPhaseInput(metric)}
          ${this._renderWallboxPhaseActionInput(metric)}
          ${this._renderWallboxSocInput(metric)}
          ${this._renderWallboxMaxSocInput(metric)}
          ${this._renderWallboxConnectedInput(metric)}
          ${this._renderWallboxChargingEnabledInput(metric)}
          ${this._renderWallboxRemainingTimeInput(metric)}
          ${this._renderUnitSelect(metric)}
          ${this._renderBatteryFlowInputs(metric)}
          ${this._renderMaxPowerInput(metric)}
          <label>${this._labelText(`${this._t("editor.xPosition")} (${left})`, this._t("editor.helpImagePosition", {}, "Position of the box on the house image in percent."))}
            <input type="range" min="4" max="96" step="1" data-path="positions.${metric.key}.left" value="${this._escape(left)}" />
          </label>
          <label>${this._labelText(`${this._t("editor.yPosition")} (${top})`, this._t("editor.helpImagePosition", {}, "Position of the box on the house image in percent."))}
            <input type="range" min="4" max="96" step="1" data-path="positions.${metric.key}.top" value="${this._escape(top)}" />
          </label>
        </div>
      </details>
    `;
  }

  _overlayDefault(key) {
    const house = this._normalizeHouse(this._config.house) || "single_family_home";
    return DEFAULT_IMAGE_OVERLAYS[house]?.[key]
      || DEFAULT_IMAGE_OVERLAYS.single_family_home[key]
      || {};
  }

  _overlayConfig(key) {
    return {
      ...this._overlayDefault(key),
      ...(this._config.image_overlays?.[key] || {}),
    };
  }

  _overlayLabel(key) {
    const customLabel = this._config.image_overlays?.[key]?.label;
    if (customLabel !== undefined && String(customLabel).trim() !== "") return String(customLabel).trim();
    return this._t(`overlay.${key}`, {}, key);
  }

  _overlayPeriodValue(key = "smoke") {
    const config = this._overlayConfig(key);
    const raw = config.period_minutes ?? config.minutes ?? config.period ?? "1h";
    const normalized = String(raw).trim().toLowerCase();
    if (normalized === "30m" || normalized === "30min" || normalized === "30") return "30m";
    if (normalized === "24h" || normalized === "24") return "24h";
    return "1h";
  }

  _renderOverlayField(key) {
    const config = this._overlayConfig(key);
    const label = this._overlayLabel(key);
    const defaultLabel = this._t(`overlay.${key}`, {}, key);
    const enabled = config.enabled === true;
    const left = Number.isFinite(Number(config.left)) ? Number(config.left) : 50;
    const top = Number.isFinite(Number(config.top)) ? Number(config.top) : 50;
    const width = Number.isFinite(Number(config.width ?? config.size)) ? Number(config.width ?? config.size) : 12;
    const orientation = String(config.orientation || "right").toLowerCase() === "left" ? "left" : "right";
    const orientationHtml = key === "heatpump"
      ? `
        <label>${this._escape(this._t("editor.overlayOrientation"))}
          <select data-path="image_overlays.${key}.orientation">
            <option value="right"${orientation === "right" ? " selected" : ""}>${this._escape(this._t("editor.overlayOrientationRight"))}</option>
            <option value="left"${orientation === "left" ? " selected" : ""}>${this._escape(this._t("editor.overlayOrientationLeft"))}</option>
          </select>
        </label>
      `
      : "";
    const entity = this._config.image_overlays?.[key]?.entity || "";
    const entityHtml = `
      <label>${this._escape(this._t("editor.entity"))}
        <input data-path="image_overlays.${key}.entity" list="ha-solar-dashboard-entities" placeholder="${key === "smoke" ? "sensor.zaehlerstand_2" : "sensor.heatpump_power"}" value="${this._escape(entity)}" autocomplete="off" />
      </label>
    `;
    const period = this._overlayPeriodValue(key);
    const periodHtml = key === "smoke"
      ? `
        <label>${this._escape(this._t("editor.overlayPeriod"))}
          <select data-path="image_overlays.${key}.period">
            <option value="30m"${period === "30m" ? " selected" : ""}>${this._escape(this._t("editor.period30m"))}</option>
            <option value="1h"${period === "1h" ? " selected" : ""}>${this._escape(this._t("editor.period1h"))}</option>
            <option value="24h"${period === "24h" ? " selected" : ""}>${this._escape(this._t("editor.period24h"))}</option>
          </select>
        </label>
      `
      : "";

    const detailsKey = `overlay-${key}`;
    const configuredValues = [entity, this._config.image_overlays?.[key]?.label];
    const status = this._statusText({
      configured: this._countConfigured(configuredValues),
      missing: this._missingEntityCount([entity]),
      hidden: enabled ? 0 : 1,
    });

    return `
      <details class="box-field overlay-field" data-editor-section="${this._escape(detailsKey)}"${this._detailsOpen(detailsKey) ? " open" : ""}>
        <summary class="box-summary">
          <span class="box-summary-main">
            <strong>${this._escape(label)}</strong>
            <small>${this._escape(defaultLabel)}</small>
          </span>
          <span class="box-summary-side">
            <span class="section-status">${this._escape(status)}</span>
          </span>
        </summary>
        <div class="box-body">
          <label class="inline"><input type="checkbox" data-path="image_overlays.${key}.enabled" ${enabled ? "checked" : ""}/> ${this._escape(this._t("editor.overlayEnable", { label }))}</label>
          <label>${this._escape(this._t("editor.overlayLabel"))}
            <input data-path="image_overlays.${key}.label" placeholder="${this._escape(defaultLabel)}" value="${this._escape(this._config.image_overlays?.[key]?.label || "")}" />
          </label>
          ${entityHtml}
          ${this._renderLabelVisibilityOptions(`overlay_${key}`)}
          ${periodHtml}
          <label>${this._labelText(`${this._t("editor.xPosition")} (${left})`, this._t("editor.helpImagePosition", {}, "Position of the box on the house image in percent."))}
            <input type="range" min="0" max="100" step="1" data-path="image_overlays.${key}.left" value="${this._escape(left)}" />
          </label>
          <label>${this._labelText(`${this._t("editor.yPosition")} (${top})`, this._t("editor.helpImagePosition", {}, "Position of the box on the house image in percent."))}
            <input type="range" min="0" max="100" step="1" data-path="image_overlays.${key}.top" value="${this._escape(top)}" />
          </label>
          <label>${this._escape(this._t("editor.overlaySize"))} (${this._escape(width)})
            <input type="range" min="2" max="60" step="1" data-path="image_overlays.${key}.width" value="${this._escape(width)}" />
          </label>
          ${orientationHtml}
        </div>
      </details>
    `;
  }

  _renderCustomKpiField(kpi, index) {
    const label = kpi?.label || "";
    const entity = kpi?.entity || kpi?.entity_id || "";
    const value = kpi?.value ?? "";
    const unit = kpi?.unit ?? "auto";
    const position = Number.isFinite(Number(kpi?.position ?? kpi?.order)) ? Number(kpi.position ?? kpi.order) : 100 + index;
    const columns = Number.isFinite(Number(kpi?.columns ?? kpi?.span)) ? Number(kpi.columns ?? kpi.span) : 1;
    const color = kpi?.color || "#1f8fff";
    const detailsKey = `kpi-${index}-${String(kpi?.id || kpi?.key || "item").replace(/[^\w-]+/g, "_")}`;
    const status = this._statusText({
      configured: this._countConfigured([label, entity, value]),
      missing: this._missingEntityCount([entity]),
    });

    return `
      <details class="box-field kpi-field" data-editor-section="${this._escape(detailsKey)}"${this._detailsOpen(detailsKey) ? " open" : ""}>
        <summary class="box-summary">
          <span class="box-summary-main">
            <strong>${this._escape(label || `KPI ${index + 1}`)}</strong>
            <small>${this._escape(this._t("editor.sectionKpis", {}, "Custom KPI tiles"))}</small>
          </span>
          <span class="box-summary-side">
            <span class="section-status">${this._escape(status)}</span>
          </span>
        </summary>
        <div class="box-body">
          <div class="kpi-head">
            <strong>${this._escape(label || `KPI ${index + 1}`)}</strong>
            <button type="button" data-action="remove-kpi" data-index="${this._escape(index)}">${this._escape(this._t("editor.kpiRemove"))}</button>
          </div>
          <label>${this._escape(this._t("editor.kpiLabel"))}
            <input data-path="custom_kpis.${index}.label" value="${this._escape(label)}" />
          </label>
          <label>${this._escape(this._t("editor.kpiEntity"))}
            <input data-path="custom_kpis.${index}.entity" list="ha-solar-dashboard-entities" placeholder="sensor.autarky" value="${this._escape(entity)}" autocomplete="off" />
          </label>
          <label>${this._escape(this._t("editor.kpiStaticValue"))}
            <input data-path="custom_kpis.${index}.value" placeholder="42" value="${this._escape(value)}" />
          </label>
          <label>${this._escape(this._t("editor.unit"))}
            <input data-path="custom_kpis.${index}.unit" placeholder="auto, %, kg, kWh/kWp" value="${this._escape(unit)}" />
          </label>
          <label>${this._labelText(`${this._t("editor.kpiPosition")} (${position})`, this._t("editor.helpFooterOrder", {}, "Controls the order of tiles below the image. Lower numbers appear earlier."))}
            <input type="number" min="0" max="999" step="1" data-path="custom_kpis.${index}.position" value="${this._escape(position)}" />
          </label>
          <label>${this._labelText(`${this._t("editor.kpiColumns")} (${columns})`, this._t("editor.helpTileWidth", {}, "Controls how wide the footer tile is on desktop. Mobile width is capped automatically."))}
            <input type="range" min="1" max="6" step="1" data-path="custom_kpis.${index}.columns" value="${this._escape(columns)}" />
          </label>
          <label>${this._escape(this._t("editor.kpiColor"))}
            <input data-path="custom_kpis.${index}.color" placeholder="#1f8fff" value="${this._escape(color)}" />
          </label>
        </div>
      </details>
    `;
  }

  _renderEnvironmentSensorField(sensor, index) {
    const label = sensor?.label || "";
    const entity = sensor?.entity || sensor?.entity_id || "";
    const unit = sensor?.unit ?? "auto";
    const position = Number.isFinite(Number(sensor?.position ?? sensor?.order)) ? Number(sensor.position ?? sensor.order) : 300 + index;
    const columns = Number.isFinite(Number(sensor?.columns ?? sensor?.span)) ? Number(sensor.columns ?? sensor.span) : 1;
    const left = Number.isFinite(Number(sensor?.left ?? sensor?.x)) ? Number(sensor.left ?? sensor.x) : 50;
    const top = Number.isFinite(Number(sensor?.top ?? sensor?.y)) ? Number(sensor.top ?? sensor.y) : 50;
    const color = sensor?.color || "#34d399";
    const visible = sensor?.visible !== false;
    const showFooter = sensor?.show_footer !== false;
    const showImage = sensor?.show_image === true;
    const fallbackLabel = this._t("environment.sensor", { index: index + 1 }, `Environment ${index + 1}`);
    const imagePositionHtml = showImage
      ? `
        <label>${this._labelText(`${this._t("editor.xPosition")} (${left})`, this._t("editor.helpImagePosition", {}, "Position of the box on the house image in percent."))}
          <input type="range" min="0" max="100" step="1" data-path="environment_sensors.${index}.left" value="${this._escape(left)}" />
        </label>
        <label>${this._labelText(`${this._t("editor.yPosition")} (${top})`, this._t("editor.helpImagePosition", {}, "Position of the box on the house image in percent."))}
          <input type="range" min="0" max="100" step="1" data-path="environment_sensors.${index}.top" value="${this._escape(top)}" />
        </label>
      `
      : "";
    const detailsKey = `environment-${index}-${String(sensor?.id || "sensor").replace(/[^\w-]+/g, "_")}`;
    const status = this._statusText({
      configured: this._countConfigured([label, entity]),
      missing: this._missingEntityCount([entity]),
      hidden: visible ? 0 : 1,
    });

    return `
      <details class="box-field environment-field" data-editor-section="${this._escape(detailsKey)}"${this._detailsOpen(detailsKey) ? " open" : ""}>
        <summary class="box-summary">
          <span class="box-summary-main">
            <strong>${this._escape(label || fallbackLabel)}</strong>
            <small>${this._escape(this._floorplanSensorTypeLabel(this._environmentSensorDisplayType(sensor)) || this._t("editor.tabEnvironment", {}, "Environment"))}</small>
          </span>
          <span class="box-summary-side">
            <span class="section-status">${this._escape(status)}</span>
          </span>
        </summary>
        <div class="box-body">
          <div class="kpi-head">
            <strong>${this._escape(label || fallbackLabel)}</strong>
            <button type="button" data-action="remove-environment-sensor" data-index="${this._escape(index)}">${this._escape(this._t("editor.kpiRemove"))}</button>
          </div>
          <label class="inline"><input type="checkbox" data-path="environment_sensors.${index}.visible" ${visible ? "checked" : ""}/> ${this._escape(this._t("editor.environmentShow", { label: label || fallbackLabel }, `Show ${label || fallbackLabel} tile`))}</label>
          <label class="inline"><input type="checkbox" data-path="environment_sensors.${index}.show_footer" ${showFooter ? "checked" : ""}/> ${this._labelText(this._t("editor.environmentShowFooter", {}, "Show box in footer"), this._t("editor.helpEnvironmentFooter", {}, "Shows this sensor as a tile in the Environment section below the image."))}</label>
          <label class="inline"><input type="checkbox" data-path="environment_sensors.${index}.show_image" ${showImage ? "checked" : ""}/> ${this._labelText(this._t("editor.environmentShowImage", {}, "Show box in image"), this._t("editor.helpEnvironmentImage", {}, "Shows this sensor as a scalable HUD box on the house image."))}</label>
          <label>${this._escape(this._t("editor.environmentLabel", {}, "Sensor label"))}
            <input data-path="environment_sensors.${index}.label" placeholder="${this._escape(fallbackLabel)}" value="${this._escape(label)}" />
          </label>
          <label>${this._escape(this._t("editor.environmentEntity", {}, "Sensor entity"))}
            <input data-path="environment_sensors.${index}.entity" list="ha-solar-dashboard-entities" placeholder="sensor.indoor_temperature" value="${this._escape(entity)}" autocomplete="off" />
          </label>
          <label>${this._labelText(this._t("editor.environmentUnit", {}, "Display unit"), this._t("editor.helpUnitAuto", {}, "Use Auto to display the unit reported by the Home Assistant entity. Choose another value only when you want to override it."))}
            <input data-path="environment_sensors.${index}.unit" placeholder="auto" value="${this._escape(unit)}" />
          </label>
          <label>${this._labelText(`${this._t("editor.kpiPosition")} (${position})`, this._t("editor.helpFooterOrder", {}, "Controls the order of tiles below the image. Lower numbers appear earlier."))}
            <input type="number" min="0" max="999" step="1" data-path="environment_sensors.${index}.position" value="${this._escape(position)}" />
          </label>
          <label>${this._labelText(`${this._t("editor.kpiColumns")} (${columns})`, this._t("editor.helpTileWidth", {}, "Controls how wide the footer tile is on desktop. Mobile width is capped automatically."))}
            <input type="range" min="1" max="6" step="1" data-path="environment_sensors.${index}.columns" value="${this._escape(columns)}" />
          </label>
          <label>${this._escape(this._t("editor.kpiColor"))}
            <input data-path="environment_sensors.${index}.color" placeholder="#34d399" value="${this._escape(color)}" />
          </label>
          ${imagePositionHtml}
        </div>
      </details>
    `;
  }

  _largeConsumerLabel(consumer, index = 0) {
    return largeConsumerLabel(consumer, index, (key, params, fallback) => this._t(key, params, fallback));
  }

  _renderLargeConsumerField(consumer, index) {
    const label = this._largeConsumerLabel(consumer, index);
    const labelValue = consumer?.label || "";
    const powerEntity = consumer?.power_entity || "";
    const voltageEntity = consumer?.voltage_entity || "";
    const energyEntity = consumer?.energy_entity || "";
    const maxPowerKw = consumer?.max_power_kw ?? "";
    const position = Number.isFinite(Number(consumer?.position)) ? Number(consumer.position) : 200 + index;
    const columns = Number.isFinite(Number(consumer?.columns)) ? Number(consumer.columns) : 1;
    const color = consumer?.color || "#1f8fff";
    const visible = consumer?.visible !== false;
    const placeholderBase = String(consumer?.id || `consumer_${index + 1}`).replace(/[^\w-]+/g, "_");
    const detailsKey = `consumer-${index}-${placeholderBase}`;
    const status = this._statusText({
      configured: this._countConfigured([labelValue, powerEntity, voltageEntity, energyEntity]),
      missing: this._missingEntityCount([powerEntity, voltageEntity, energyEntity]),
      hidden: visible ? 0 : 1,
    });

    return `
      <details class="box-field consumer-field" data-editor-section="${this._escape(detailsKey)}"${this._detailsOpen(detailsKey) ? " open" : ""}>
        <summary class="box-summary">
          <span class="box-summary-main">
            <strong>${this._escape(label)}</strong>
            <small>${this._escape(this._t("editor.sectionLargeConsumers", {}, "Additional large consumers"))}</small>
          </span>
          <span class="box-summary-side">
            <span class="section-status">${this._escape(status)}</span>
          </span>
        </summary>
        <div class="box-body">
          <div class="kpi-head">
            <strong>${this._escape(label)}</strong>
            ${consumer?.custom ? `<button type="button" data-action="remove-large-consumer" data-index="${this._escape(index)}">${this._escape(this._t("editor.kpiRemove"))}</button>` : ""}
          </div>
          <label class="inline"><input type="checkbox" data-path="large_consumers.${index}.visible" ${visible ? "checked" : ""}/> ${this._escape(this._t("editor.consumerShow", { label }, `Show ${label} tile`))}</label>
          <label>${this._escape(this._t("editor.consumerLabel", {}, "Device name"))}
            <input data-path="large_consumers.${index}.label" placeholder="${this._escape(label)}" value="${this._escape(labelValue)}" />
          </label>
          <label>${this._escape(this._t("editor.consumerPowerEntity", {}, "Power entity"))}
            <input data-path="large_consumers.${index}.power_entity" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(placeholderBase)}_power" value="${this._escape(powerEntity)}" autocomplete="off" />
          </label>
          <label>${this._escape(this._t("editor.voltageEntity", {}, "Voltage entity"))}
            <input data-path="large_consumers.${index}.voltage_entity" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(placeholderBase)}_voltage" value="${this._escape(voltageEntity)}" autocomplete="off" />
          </label>
          <label>${this._escape(this._t("editor.consumerEnergyEntity", {}, "kWh counter entity"))}
            <input data-path="large_consumers.${index}.energy_entity" list="ha-solar-dashboard-entities" placeholder="sensor.${this._escape(placeholderBase)}_energy" value="${this._escape(energyEntity)}" autocomplete="off" />
          </label>
          <label>${this._escape(this._t("editor.maxPowerKw"))}
            <input type="number" min="0" step="0.1" data-path="large_consumers.${index}.max_power_kw" placeholder="2.0" value="${this._escape(maxPowerKw)}" />
          </label>
          <label>${this._escape(this._t("editor.kpiPosition"))} (${this._escape(position)})
            <input type="number" min="0" max="999" step="1" data-path="large_consumers.${index}.position" value="${this._escape(position)}" />
          </label>
          <label>${this._escape(this._t("editor.kpiColumns"))} (${this._escape(columns)})
            <input type="range" min="1" max="6" step="1" data-path="large_consumers.${index}.columns" value="${this._escape(columns)}" />
          </label>
          <label>${this._escape(this._t("editor.kpiColor"))}
            <input data-path="large_consumers.${index}.color" placeholder="#1f8fff" value="${this._escape(color)}" />
          </label>
        </div>
      </details>
    `;
  }

  _renderSetupWizard() {
    const entityCount = this._entityOptions().length;
    const suggestions = this._autoDetectSuggestions();
    const suggestionRows = suggestions.map((suggestion) => {
      const current = suggestion.current ? `
        <div class="wizard-current">
          <span>${this._escape(this._t("editor.setupCurrent", {}, "Current"))}</span>
          <code>${this._escape(suggestion.current)}</code>
        </div>
      ` : "";
      return `
        <div class="wizard-suggestion">
          <div class="wizard-suggestion-main">
            <strong>${this._escape(suggestion.label)}</strong>
            <code>${this._escape(suggestion.entityId)}</code>
            ${current}
          </div>
          <div class="wizard-suggestion-side">
            <span>${this._escape(this._t("editor.setupConfidence", { score: suggestion.score }, `${suggestion.score}% match`))}</span>
            <button type="button" data-action="apply-suggestion" data-path="${this._escape(suggestion.path)}">${this._escape(this._t("editor.setupApplyOne", {}, "Use"))}</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <details class="setup-wizard" data-setup-wizard${this._setupWizardOpen ? " open" : ""}>
        <summary>${this._escape(this._t("editor.setupWizard", {}, "Setup wizard"))}</summary>
        <div class="wizard-body">
          <p>${this._escape(this._t("editor.setupIntro", {}, "Detect likely Home Assistant entities and fill the card configuration."))}</p>
          <p>${this._escape(this._t("editor.setupHelp", {}, "Review the suggestions before applying them. Use Fill empty fields for a safe first pass or Replace detected fields when you want to overwrite existing detected assignments."))}</p>
          <div class="wizard-status">
            ${entityCount > 0
              ? this._escape(this._t("editor.setupEntityCount", { count: entityCount }, `${entityCount} entities available`))
              : this._escape(this._t("editor.setupNoEntities", {}, "Open this editor in Home Assistant so entities can be detected."))}
          </div>
          <div class="wizard-actions">
            <button type="button" data-action="auto-detect" data-mode="fill" ${entityCount === 0 || suggestions.length === 0 ? "disabled" : ""}>${this._escape(this._t("editor.setupFillEmpty", {}, "Fill empty fields"))}</button>
            <button type="button" data-action="auto-detect" data-mode="replace" ${entityCount === 0 || suggestions.length === 0 ? "disabled" : ""}>${this._escape(this._t("editor.setupReplaceAll", {}, "Replace detected fields"))}</button>
          </div>
          ${this._wizardMessage ? `<div class="wizard-message">${this._escape(this._wizardMessage)}</div>` : ""}
          <div class="wizard-suggestions-title">${this._escape(this._t("editor.setupSuggestions", {}, "Detected suggestions"))}</div>
          <div class="wizard-suggestions">
            ${suggestionRows || `<div class="wizard-empty">${this._escape(this._t("editor.setupNoSuggestions", {}, "No strong entity matches found yet."))}</div>`}
          </div>
        </div>
      </details>
    `;
  }

  _editorImageSrc() {
    const variant = this._houseVariant();
    if (this._config.image) return this._config.image;
    const file = this._config.day_image && variant.dayFile ? variant.dayFile : variant.file;
    try {
      return assetUrl(`images/${variant.folder ? `${variant.folder}/` : ""}${file}`);
    } catch (_err) {
      return "";
    }
  }

  _editorAssetImageSrc(path = "", fallback = "") {
    const value = String(path || fallback || "").trim();
    if (!value) return "";
    if (/^(?:https?:)?\/\//i.test(value) || value.startsWith("/") || value.startsWith("data:")) return value;
    try {
      return assetUrl(value);
    } catch (_err) {
      return value;
    }
  }

  _editorElectricVehicleImageSrc() {
    const normalized = normalizeElectricVehicleConfig?.(this._config.electric_vehicle || {}) || this._config.electric_vehicle || {};
    return this._editorAssetImageSrc(normalized.image, DEFAULT_ELECTRIC_VEHICLE_IMAGE || "images/car_image.png");
  }

  _editorGardenImageSrc() {
    const normalized = normalizeGardenConfig?.(this._config.garden || {}) || this._config.garden || {};
    return this._editorAssetImageSrc(normalized.image, DEFAULT_GARDEN_IMAGE || "images/single_family_home_top_view_garden.png");
  }

  _layoutPositionConfig(positionKey) {
    const position = this._config.positions?.[positionKey];
    return position && typeof position === "object" ? position : {};
  }

  _layoutPositionNumber(value, fallback = 50) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(0, Math.min(100, number));
  }

  _layoutPosition(positionKey, fallback = {}) {
    const position = this._layoutPositionConfig(positionKey);
    return {
      left: this._layoutPositionNumber(position.left, Number.isFinite(Number(fallback.left)) ? Number(fallback.left) : 50),
      top: this._layoutPositionNumber(position.top, Number.isFinite(Number(fallback.top)) ? Number(fallback.top) : 50),
    };
  }

  _layoutPositionConfigured(positionKey) {
    const position = this._layoutPositionConfig(positionKey);
    return Number.isFinite(Number(position.left)) || Number.isFinite(Number(position.top));
  }

  _electricVehicleHeroBadgePositionKey(key = "") {
    return ELECTRIC_VEHICLE_HERO_BADGE_POSITION_KEYS?.[key] || `electric_vehicle_${key}`;
  }

  _electricVehicleWallboxKey() {
    return this._config.electric_vehicle?.wallbox === "wallbox2_power" ? "wallbox2_power" : "wallbox_power";
  }

  _electricVehicleWallboxFallbackEntityKey(kind = "") {
    const wallboxKey = this._electricVehicleWallboxKey();
    if (kind === "power") return wallboxKey;
    if (kind === "soc") return this._wallboxSocEntityKey(wallboxKey);
    if (kind === "maxSoc") return this._wallboxMaxSocEntityKey(wallboxKey);
    if (kind === "connected") return this._wallboxConnectedEntityKey(wallboxKey);
    if (kind === "chargingEnabled") return this._wallboxChargingEnabledEntityKey(wallboxKey);
    if (kind === "remainingTime") return this._wallboxRemainingTimeEntityKey(wallboxKey);
    if (kind === "phase") return this._wallboxPhaseEntityKey(wallboxKey);
    if (kind === "phaseAction") return this._wallboxPhaseActionEntityKey(wallboxKey);
    if (kind === "phaseRemaining") return this._wallboxPhaseRemainingEntityKey(wallboxKey);
    return "";
  }

  _electricVehicleLayoutEntityId(definition) {
    const key = definition?.key || "";
    const entities = this._config.electric_vehicle?.entities || {};
    const direct = entities[key] || definition?.aliases?.map((alias) => entities[alias]).find(Boolean);
    if (direct) return direct;

    const fallbackKey = definition?.wallboxFallback ? this._electricVehicleWallboxFallbackEntityKey(definition.wallboxFallback) : "";
    if (fallbackKey && this._config.entities?.[fallbackKey]) return this._config.entities[fallbackKey];

    const aliases = [
      key,
      `ev_${key}`,
      `evcc_${key}`,
      `electric_vehicle_${key}`,
      ...(definition?.aliases || []),
    ];
    return aliases.map((alias) => this._config.entities?.[alias]).find(Boolean) || "";
  }

  _gardenHeroBadgePositionKey(key = "") {
    return GARDEN_HERO_BADGE_POSITION_KEYS?.[key] || (key.startsWith("garden_") ? key : `garden_${key}`);
  }

  _gardenLayoutEntityId(definition) {
    const key = definition?.key || "";
    const entities = this._config.garden?.entities || {};
    const direct = entities[key] || definition?.aliases?.map((alias) => entities[alias]).find(Boolean);
    if (direct) return direct;
    const aliases = [
      key,
      this._gardenHeroBadgePositionKey(key),
      `garten_${key}`,
      `irrigation_${key}`,
      `watering_${key}`,
      ...(definition?.aliases || []),
    ];
    return aliases.map((alias) => this._config.entities?.[alias]).find(Boolean) || "";
  }

  _layoutItems() {
    const metricItems = TILE_METRICS
      .filter((metric) => this._metricVisible(metric))
      .map((metric) => {
        const position = this._metricPosition(metric);
        return {
          key: `metric:${metric.key}`,
          label: this._metricLabel(metric),
          scope: "house",
          left: Number.isFinite(Number(position.left)) ? Number(position.left) : 50,
          top: Number.isFinite(Number(position.top)) ? Number(position.top) : 50,
          leftPath: `positions.${metric.key}.left`,
          topPath: `positions.${metric.key}.top`,
          color: "#1f8fff",
          type: this._t("editor.layoutTypeBox", {}, "Box"),
        };
      });
    const overlayItems = IMAGE_OVERLAY_KEYS
      .map((key) => {
        const config = this._overlayConfig(key);
        if (config.enabled !== true) return undefined;
        return {
          key: `overlay:${key}`,
          label: this._overlayLabel(key),
          scope: "house",
          left: Number.isFinite(Number(config.left)) ? Number(config.left) : 50,
          top: Number.isFinite(Number(config.top)) ? Number(config.top) : 50,
          leftPath: `image_overlays.${key}.left`,
          topPath: `image_overlays.${key}.top`,
          color: key === "smoke" ? "#ffc233" : "#1f8fff",
          type: this._t("editor.layoutTypeOverlay", {}, "Overlay"),
        };
      })
      .filter(Boolean);
    const environmentItems = this._normalizeEnvironmentSensors(this._config.environment_sensors || [])
      .map((sensor, index) => {
        if (sensor.visible === false || sensor.show_image !== true) return undefined;
        const label = sensor.label || this._t("environment.sensor", { index: index + 1 }, `Environment ${index + 1}`);
        return {
          key: `environment:${index}`,
          label,
          scope: "house",
          left: Number.isFinite(Number(sensor.left)) ? Number(sensor.left) : 50,
          top: Number.isFinite(Number(sensor.top)) ? Number(sensor.top) : 50,
          leftPath: `environment_sensors.${index}.left`,
          topPath: `environment_sensors.${index}.top`,
          color: sensor.color || "#34d399",
          type: this._t("editor.layoutTypeEnvironment", {}, "Environment"),
        };
      })
      .filter(Boolean);
    const electricVehicleItems = this._config.show_electric_vehicle === false
      ? []
      : Object.entries(ELECTRIC_VEHICLE_HERO_BADGE_POSITIONS || {})
        .map(([key, fallback]) => {
          const definition = this._electricVehicleDefinitions().find((item) => item.key === key);
          if (!definition) return undefined;
          const positionKey = this._electricVehicleHeroBadgePositionKey(key);
          const entityId = this._electricVehicleLayoutEntityId(definition);
          if (key !== "status" && !entityId && !this._layoutPositionConfigured(positionKey)) return undefined;
          const position = this._layoutPosition(positionKey, fallback);
          return {
            key: `electric_vehicle:${key}`,
            label: `${this._t("view.electricVehicle", {}, "E-Auto")}: ${this._t(definition.labelKey, {}, definition.label)}`,
            scope: "electric_vehicle",
            left: position.left,
            top: position.top,
            leftPath: `positions.${positionKey}.left`,
            topPath: `positions.${positionKey}.top`,
            color: definition.group === "charging" ? "#ffc233" : definition.group === "vehicle" ? "#34d399" : "#1f8fff",
            type: this._t("view.electricVehicle", {}, "E-Auto"),
          };
        })
        .filter(Boolean);
    const gardenItems = this._config.show_garden === false
      ? []
      : Object.entries(GARDEN_HERO_BADGE_POSITIONS || {})
        .map(([key, fallback]) => {
          const definition = this._gardenDefinitions().find((item) => item.key === key);
          if (!definition) return undefined;
          const positionKey = this._gardenHeroBadgePositionKey(key);
          const entityId = this._gardenLayoutEntityId(definition);
          if (!entityId && !this._layoutPositionConfigured(positionKey)) return undefined;
          const position = this._layoutPosition(positionKey, fallback);
          return {
            key: `garden:${key}`,
            label: `${this._t("view.garden", {}, "Garten")}: ${this._t(definition.labelKey, {}, definition.label)}`,
            scope: "garden",
            left: position.left,
            top: position.top,
            leftPath: `positions.${positionKey}.left`,
            topPath: `positions.${positionKey}.top`,
            color: definition.group === "weather" ? "#38bdf8" : definition.group === "water" ? "#1f8fff" : "#34d399",
            type: this._t("view.garden", {}, "Garten"),
          };
        })
        .filter(Boolean);
    return [...metricItems, ...overlayItems, ...environmentItems, ...electricVehicleItems, ...gardenItems];
  }

  _selectedLayoutItem(items) {
    if (!items.length) return undefined;
    return items.find((item) => item.key === this._selectedLayoutItemKey) || items[0];
  }

  _renderFloorplanEditor() {
    const floorplan = this._normalizeFloorplan(this._config.floorplan || {});
    this._config.floorplan = floorplan;
    const { floor: activeFloor, index: floorIndex } = this._activeFloorplanFloor(floorplan);
    const selectableFloor = floorplan.mode === "image" ? { ...activeFloor, rooms: [], walls: [] } : activeFloor;
    const selected = this._selectedFloorplanItem(selectableFloor);
    const activeTool = floorplan.mode === "image" ? "sensor" : this._floorplanTool();
    const imageSrc = this._floorplanImageUrl(activeFloor.image);
    const grid = floorplan.mode === "editor" && floorplan.show_grid !== false
      ? Array.from({ length: 11 }, (_item, index) => index * 10).map((x) => `<line class="floorplan-editor-gridline" x1="${x}" y1="0" x2="${x}" y2="70"></line>`).join("")
        + Array.from({ length: 8 }, (_item, index) => index * 10).map((y) => `<line class="floorplan-editor-gridline" x1="0" y1="${y}" x2="100" y2="${y}"></line>`).join("")
      : "";
    const background = `
      <rect class="floorplan-editor-bg" x="0" y="0" width="100" height="70" rx="1.5"></rect>
      ${floorplan.mode === "image" && imageSrc ? `<image class="floorplan-editor-image" href="${this._escape(imageSrc)}" x="0" y="0" width="100" height="70" preserveAspectRatio="xMidYMid slice"></image>` : ""}
    `;
    const rooms = floorplan.mode === "editor" ? activeFloor.rooms.map((room, index) => {
      const key = `room:${index}`;
      return `
        <g class="floorplan-editor-room${selected?.key === key ? " active" : ""}" data-floorplan-select="${this._escape(key)}" style="--room-color:${this._escape(room.color)}">
          <rect x="${this._escape(room.x)}" y="${this._escape(room.y)}" width="${this._escape(room.width)}" height="${this._escape(room.height)}" rx="1.2"></rect>
          <text x="${this._escape(room.x + 1.5)}" y="${this._escape(room.y + 4)}">${this._escape(room.label)}</text>
        </g>
      `;
    }).join("") : "";
    const walls = floorplan.mode === "editor" ? activeFloor.walls.map((wall, index) => {
      const key = `wall:${index}`;
      return `<line class="floorplan-editor-wall${selected?.key === key ? " active" : ""}" data-floorplan-select="${this._escape(key)}" x1="${this._escape(wall.x1)}" y1="${this._escape(wall.y1)}" x2="${this._escape(wall.x2)}" y2="${this._escape(wall.y2)}" style="--wall-color:${this._escape(wall.color)};--wall-width:${this._escape(wall.width)}"></line>`;
    }).join("") : "";
    const sensors = activeFloor.sensors.map((sensor, index) => {
      const key = `sensor:${index}`;
      const linked = this._normalizeEnvironmentSensors(this._config.environment_sensors || []).find((item) => item.id === sensor.environment_sensor);
      const label = sensor.label || linked?.label || this._floorplanSensorTypeLabel(sensor.type) || this._t("floorplan.sensor", { index: index + 1 }, `Sensor ${index + 1}`);
      const entityId = linked?.entity || sensor.entity || "";
      const stateObj = this._hass?.states?.[entityId];
      const configuredUnit = String(sensor.unit || linked?.unit || "auto");
      const unit = configuredUnit && configuredUnit !== "auto" ? configuredUnit : stateObj?.attributes?.unit_of_measurement || "";
      const value = stateObj ? `${stateObj.state}${unit ? ` ${unit}` : ""}` : "-";
      const color = sensor.color || linked?.color || this._floorplanSensorTypeColor(sensor.type) || "#34d399";
      const fontSize = clampConfigNumber(sensor.font_size, 3.05, 1.4, 8);
      const labelFontSize = clampConfigNumber(fontSize * 0.77, 2.35, 1.1, 6.2);
      const labelY = clampConfigNumber(fontSize * -0.62, -1.9, -5, -0.4);
      const valueY = sensor.show_label !== false
        ? clampConfigNumber(fontSize * 0.82, 2.5, 1.2, 7)
        : clampConfigNumber(fontSize * 0.35, 1.1, 0.7, 4);
      const labelText = sensor.show_label !== false
        ? `<text class="floorplan-sensor-label" x="4.2" y="${this._escape(labelY)}" style="font-size:${this._escape(labelFontSize)}px">${this._escape(label)}</text>`
        : "";
      return `
        <g class="floorplan-editor-sensor${selected?.key === key ? " active" : ""}" data-floorplan-select="${this._escape(key)}" transform="translate(${this._escape(sensor.x)} ${this._escape(sensor.y)})" style="--sensor-color:${this._escape(color)};--sensor-font-size:${this._escape(fontSize)}px">
          <circle r="1.7"></circle>
          ${labelText}
          <text class="floorplan-sensor-value" x="4.2" y="${this._escape(valueY)}" style="font-size:${this._escape(fontSize)}px">${this._escape(value)}</text>
        </g>
      `;
    }).join("");
    const toolButtons = (floorplan.mode === "image" ? [
      ["sensor", this._t("editor.floorplanToolSensor", {}, "Sensor")],
    ] : [
      ["room", this._t("editor.floorplanToolRoom", {}, "Room")],
      ["wall", this._t("editor.floorplanToolWall", {}, "Wall")],
      ["sensor", this._t("editor.floorplanToolSensor", {}, "Sensor")],
    ]).map(([tool, label]) => `
      <button type="button" class="${tool === activeTool ? "active" : ""}" data-floorplan-tool="${this._escape(tool)}" aria-pressed="${tool === activeTool ? "true" : "false"}">${this._escape(label)}</button>
    `).join("");
    const environmentOptions = [
      `<option value="">${this._escape(this._t("editor.floorplanCustomEntity", {}, "Use own entity"))}</option>`,
      ...this._normalizeEnvironmentSensors(this._config.environment_sensors || []).map((sensor, index) => {
        const label = sensor.label || this._t("environment.sensor", { index: index + 1 }, `Environment ${index + 1}`);
        const typeLabel = this._floorplanSensorTypeLabel(this._environmentSensorDisplayType(sensor));
        const suffix = typeLabel ? ` · ${typeLabel}` : "";
        return `<option value="${this._escape(sensor.id)}"${selected?.item?.environment_sensor === sensor.id ? " selected" : ""}>${this._escape(`${label}${suffix}`)}</option>`;
      }),
    ].join("");
    const floorTabs = floorplan.floors.map((floor) => `
      <button type="button" class="${floor.id === activeFloor.id ? "active" : ""}" data-floorplan-floor="${this._escape(floor.id)}" aria-pressed="${floor.id === activeFloor.id ? "true" : "false"}">${this._escape(floor.label)}</button>
    `).join("");
    const imageSettings = floorplan.mode === "image"
      ? `
        <div class="floorplan-image-settings">
          <label>${this._labelText(this._t("editor.floorplanImagePath", {}, "Image path"), this._t("editor.helpFloorplanImagePath", {}, "Store the image in Home Assistant under /config/www/ and enter it as /local/..., for example /local/floorplan/level-1.png. Full https:// URLs are also supported."))}
            <input data-path="floorplan.floors.${floorIndex}.image" placeholder="/local/floorplan/level-1.png" value="${this._escape(activeFloor.image)}" autocomplete="off" />
          </label>
          <p class="field-note">${this._escape(this._t("editor.floorplanImagePathHelp", {}, "Example: copy eg.png to /config/www/floorplan/eg.png, then enter /local/floorplan/eg.png here. You can also use a complete https:// image URL."))}</p>
        </div>
      `
      : "";
    const selectedControls = selected
      ? (() => {
        const collection = selected.type === "room" ? "rooms" : selected.type === "wall" ? "walls" : "sensors";
        const path = `floorplan.floors.${floorIndex}.${collection}.${selected.index}`;
        if (selected.type === "room") {
          const room = selected.item;
          return `
            <div class="layout-controls">
              <strong>${this._escape(this._t("editor.floorplanSelected", {}, "Selected element"))}: ${this._escape(this._t("editor.floorplanToolRoom", {}, "Room"))}</strong>
              <label>${this._labelText(this._t("editor.floorplanLabel", {}, "Label"))}<input data-path="${path}.label" value="${this._escape(room.label)}" /></label>
              <label>${this._labelText(`X (${this._formatFloorplanNumber(room.x)})`)}<input type="range" min="0" max="100" step="0.1" data-path="${path}.x" value="${this._escape(room.x)}" /></label>
              <label>${this._labelText(`Y (${this._formatFloorplanNumber(room.y)})`)}<input type="range" min="0" max="70" step="0.1" data-path="${path}.y" value="${this._escape(room.y)}" /></label>
              <label>${this._labelText(`${this._t("editor.floorplanWidth", {}, "Width")} (${this._formatFloorplanNumber(room.width)})`)}<input type="range" min="3" max="100" step="0.1" data-path="${path}.width" value="${this._escape(room.width)}" /></label>
              <label>${this._labelText(`${this._t("editor.floorplanHeight", {}, "Height")} (${this._formatFloorplanNumber(room.height)})`)}<input type="range" min="3" max="70" step="0.1" data-path="${path}.height" value="${this._escape(room.height)}" /></label>
              <label>${this._labelText(this._t("editor.kpiColor", {}, "Color"))}<input data-path="${path}.color" value="${this._escape(room.color)}" /></label>
              <button type="button" data-action="remove-floorplan-item">${this._escape(this._t("editor.floorplanDelete", {}, "Delete selected"))}</button>
            </div>
          `;
        }
        if (selected.type === "wall") {
          const wall = selected.item;
          return `
            <div class="layout-controls">
              <strong>${this._escape(this._t("editor.floorplanSelected", {}, "Selected element"))}: ${this._escape(this._t("editor.floorplanToolWall", {}, "Wall"))}</strong>
              <label>${this._labelText(`X1 (${this._formatFloorplanNumber(wall.x1)})`)}<input type="range" min="0" max="100" step="0.1" data-path="${path}.x1" value="${this._escape(wall.x1)}" /></label>
              <label>${this._labelText(`Y1 (${this._formatFloorplanNumber(wall.y1)})`)}<input type="range" min="0" max="70" step="0.1" data-path="${path}.y1" value="${this._escape(wall.y1)}" /></label>
              <label>${this._labelText(`X2 (${this._formatFloorplanNumber(wall.x2)})`)}<input type="range" min="0" max="100" step="0.1" data-path="${path}.x2" value="${this._escape(wall.x2)}" /></label>
              <label>${this._labelText(`Y2 (${this._formatFloorplanNumber(wall.y2)})`)}<input type="range" min="0" max="70" step="0.1" data-path="${path}.y2" value="${this._escape(wall.y2)}" /></label>
              <label>${this._labelText(`${this._t("editor.overlaySize", {}, "Size")} (${this._formatFloorplanNumber(wall.width)})`)}<input type="range" min="0.2" max="5" step="0.1" data-path="${path}.width" value="${this._escape(wall.width)}" /></label>
              <label>${this._labelText(this._t("editor.kpiColor", {}, "Color"))}<input data-path="${path}.color" value="${this._escape(wall.color)}" /></label>
              <button type="button" data-action="remove-floorplan-item">${this._escape(this._t("editor.floorplanDelete", {}, "Delete selected"))}</button>
            </div>
          `;
        }
        const sensor = selected.item;
        const linked = this._normalizeEnvironmentSensors(this._config.environment_sensors || []).find((item) => item.id === sensor.environment_sensor);
        const sensorType = sensor.type || (linked ? this._environmentSensorDisplayType(linked) : "") || "indoor";
        const sensorTypeOptions = this._floorplanSensorTypeOptions(sensorType);
        const entityValue = linked?.entity || sensor.entity || "";
        const entityDisabled = linked ? " disabled" : "";
        return `
          <div class="layout-controls">
            <strong>${this._escape(this._t("editor.floorplanSelected", {}, "Selected element"))}: ${this._escape(this._t("editor.floorplanToolSensor", {}, "Sensor"))}</strong>
            <label class="inline"><input type="checkbox" data-path="${path}.visible" ${sensor.visible !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showBox", { label: this._t("editor.floorplanToolSensor", {}, "Sensor") }, "Show sensor"))}</label>
            <label class="inline"><input type="checkbox" data-path="${path}.show_label" ${sensor.show_label !== false ? "checked" : ""}/> ${this._escape(this._t("editor.floorplanShowSensorLabel", {}, "Show label"))}</label>
            <label>${this._labelText(this._t("editor.floorplanSensorType", {}, "Sensor type"))}<select data-path="${path}.type">${sensorTypeOptions}</select></label>
            <label>${this._labelText(this._t("editor.floorplanSensorSource", {}, "Use environment sensor"), this._t("editor.helpFloorplanSensorSource", {}, "Optional: reuse a sensor from the Environment tab. Leave this on own entity to choose a Home Assistant entity directly below."))}<select data-path="${path}.environment_sensor">${environmentOptions}</select></label>
            <label>${this._labelText(this._t("editor.floorplanLabel", {}, "Label"))}<input data-path="${path}.label" value="${this._escape(sensor.label)}" /></label>
            <label>${this._labelText(this._t("editor.floorplanEntity", {}, "Entity"), this._t("editor.helpHomeAssistantSensor", {}, "Choose the Home Assistant entity that provides this value."))}<input data-path="${path}.entity" list="ha-solar-dashboard-entities" placeholder="sensor.living_room_temperature" value="${this._escape(entityValue)}" autocomplete="off"${entityDisabled} /></label>
            <label>${this._labelText(this._t("editor.environmentUnit", {}, "Display unit"), this._t("editor.helpUnitAuto", {}, "Use Auto to display the unit reported by the Home Assistant entity."))}<input data-path="${path}.unit" placeholder="auto" value="${this._escape(sensor.unit)}" /></label>
            <label>${this._labelText(`${this._t("editor.floorplanFontSize", {}, "Font size")} (${this._formatFloorplanNumber(sensor.font_size)})`)}<input type="range" min="1.4" max="8" step="0.1" data-path="${path}.font_size" value="${this._escape(sensor.font_size)}" /></label>
            <label>${this._labelText(`X (${this._formatFloorplanNumber(sensor.x)})`)}<input type="range" min="0" max="100" step="0.1" data-path="${path}.x" value="${this._escape(sensor.x)}" /></label>
            <label>${this._labelText(`Y (${this._formatFloorplanNumber(sensor.y)})`)}<input type="range" min="0" max="70" step="0.1" data-path="${path}.y" value="${this._escape(sensor.y)}" /></label>
            <label>${this._labelText(this._t("editor.kpiColor", {}, "Color"))}<input data-path="${path}.color" value="${this._escape(sensor.color)}" /></label>
            <button type="button" data-action="remove-floorplan-item">${this._escape(this._t("editor.floorplanDelete", {}, "Delete selected"))}</button>
          </div>
        `;
      })()
      : `<div class="layout-empty">${this._escape(this._t("editor.floorplanEmpty", {}, "Click the grid to create the selected element."))}</div>`;
    const activeFloorElementCount = activeFloor.rooms.length + activeFloor.walls.length + activeFloor.sensors.length;
    const imageEmpty = floorplan.mode === "image" && !imageSrc
      ? `<div class="floorplan-image-empty">${this._escape(this._t("floorplan.imageEmpty", {}, "Enter an image path for this level."))}</div>`
      : "";
    return `
      <section class="editor-card floorplan-editor-card">
        <div class="editor-card-head">
          <div>
            <strong>${this._escape(this._t("editor.sectionFloorplan", {}, "Floorplan editor"))}</strong>
            <span>${this._escape(this._t("editor.floorplanHelp", {}, "Choose a tool, click the grid to place it, then refine the selected element."))}</span>
          </div>
          <span class="section-status">${this._escape(this._statusText({ configured: activeFloorElementCount }))}</span>
        </div>
        <div class="checkbox-grid">
          <label class="inline"><input type="checkbox" data-path="show_floorplan" ${this._config.show_floorplan !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showFloorplan", {}, "Show floorplan"))}</label>
          ${floorplan.mode === "editor" ? `<label class="inline"><input type="checkbox" data-path="floorplan.show_grid" ${floorplan.show_grid !== false ? "checked" : ""}/> ${this._escape(this._t("editor.floorplanShowGrid", {}, "Show grid"))}</label>` : ""}
        </div>
        <div class="checkbox-grid" role="radiogroup" aria-label="${this._escape(this._t("editor.floorplanMode", {}, "Floorplan type"))}">
          <label class="inline"><input type="radio" name="floorplan-mode" data-path="floorplan.mode" value="editor" ${floorplan.mode === "editor" ? "checked" : ""}/> ${this._escape(this._t("editor.floorplanModeEditor", {}, "Floorplan editor"))}</label>
          <label class="inline"><input type="radio" name="floorplan-mode" data-path="floorplan.mode" value="image" ${floorplan.mode === "image" ? "checked" : ""}/> ${this._escape(this._t("editor.floorplanModeImage", {}, "Image"))}</label>
        </div>
        <div class="floorplan-floor-row">
          <div class="floorplan-floor-tabs" role="group" aria-label="${this._escape(this._t("editor.floorplanFloors", {}, "Levels"))}">
            ${floorTabs}
            <button type="button" data-action="add-floorplan-floor">${this._escape(this._t("editor.floorplanAddFloor", {}, "+ Add level"))}</button>
          </div>
          <label>${this._labelText(this._t("editor.floorplanFloorLabel", {}, "Level name"))}<input data-path="floorplan.floors.${floorIndex}.label" value="${this._escape(activeFloor.label)}" /></label>
        </div>
        ${imageSettings}
        <div class="floorplan-tool-row" role="group" aria-label="${this._escape(this._t("editor.floorplanTools", {}, "Floorplan tools"))}">
          ${toolButtons}
        </div>
        <div class="layout-editor floorplan-editor">
          <div class="floorplan-editor-preview">
            <svg data-floorplan-canvas viewBox="0 0 100 70" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${this._escape(this._t("editor.sectionFloorplan", {}, "Floorplan editor"))}">
              ${background}
              ${grid}
              ${rooms}
              ${walls}
              ${sensors}
            </svg>
            ${imageEmpty}
          </div>
          ${selectedControls}
        </div>
      </section>
    `;
  }

  _renderLayoutEditor() {
    const items = this._layoutItems();
    const selected = this._selectedLayoutItem(items);
    this._selectedLayoutItemKey = selected?.key;
    const selectedScope = selected?.scope || "house";
    const previewItems = items.filter((item) => (item.scope || "house") === selectedScope);
    const houseAlt = this._houseLabel(this._normalizeHouse(this._config.house), this._houseVariant());
    let imageSrc = this._editorImageSrc();
    let imageAlt = houseAlt;
    if (selectedScope === "electric_vehicle") {
      const electricVehicle = normalizeElectricVehicleConfig?.(this._config.electric_vehicle || {}) || this._config.electric_vehicle || {};
      imageSrc = this._editorElectricVehicleImageSrc();
      imageAlt = electricVehicle.title || this._t("ev.title", {}, "E-Auto");
    } else if (selectedScope === "garden") {
      const garden = normalizeGardenConfig?.(this._config.garden || {}) || this._config.garden || {};
      imageSrc = this._editorGardenImageSrc();
      imageAlt = garden.title || this._t("garden.title", {}, "Garten");
    }
    const markers = previewItems.map((item) => `
      <button type="button" class="layout-marker${selected?.key === item.key ? " active" : ""}" data-layout-key="${this._escape(item.key)}" style="left:${this._escape(item.left)}%;top:${this._escape(item.top)}%;--layout-color:${this._escape(item.color)}" title="${this._escape(item.label)}">
        <span>${this._escape(item.label)}</span>
      </button>
    `).join("");
    const itemOptions = items.map((item) => `<option value="${this._escape(item.key)}"${selected?.key === item.key ? " selected" : ""}>${this._escape(item.label)} · ${this._escape(item.type)}</option>`).join("");
    const controls = selected
      ? `
        <div class="layout-controls">
          <label>${this._labelText(this._t("editor.layoutSelected", {}, "Selected box"))}
            <select data-layout-select>${itemOptions}</select>
          </label>
          <label>${this._labelText(`${this._t("editor.xPosition")} (${selected.left})`, this._t("editor.helpImagePosition", {}, "Position of the box on the house image in percent."))}
            <input type="range" min="0" max="100" step="1" data-path="${this._escape(selected.leftPath)}" value="${this._escape(selected.left)}" />
          </label>
          <label>${this._labelText(`${this._t("editor.yPosition")} (${selected.top})`, this._t("editor.helpImagePosition", {}, "Position of the box on the house image in percent."))}
            <input type="range" min="0" max="100" step="1" data-path="${this._escape(selected.topPath)}" value="${this._escape(selected.top)}" />
          </label>
        </div>
      `
      : `<div class="layout-empty">${this._escape(this._t("editor.layoutEmpty", {}, "Enable image boxes or overlays to edit their positions here."))}</div>`;

    return `
      <section class="editor-card">
        <div class="editor-card-head">
          <div>
            <strong>${this._escape(this._t("editor.layoutMode", {}, "Layout mode"))}</strong>
            <span>${this._escape(this._t("editor.layoutHelp", {}, "Click a box in the preview, then adjust its X/Y position."))}</span>
          </div>
          <span class="section-status">${this._escape(this._statusText({ configured: items.length }))}</span>
        </div>
        <div class="layout-editor">
          <div class="layout-preview">
            ${imageSrc ? `<img src="${this._escape(imageSrc)}" alt="${this._escape(imageAlt)}" />` : ""}
            ${markers}
          </div>
          ${controls}
        </div>
      </section>
    `;
  }

  _electricVehicleDefinitions() {
    return Array.isArray(ELECTRIC_VEHICLE_ENTITY_DEFINITIONS) ? ELECTRIC_VEHICLE_ENTITY_DEFINITIONS : [];
  }

  _electricVehicleConfiguredValues(electricVehicle = this._config.electric_vehicle || {}) {
    const entities = electricVehicle.entities || {};
    return this._electricVehicleDefinitions()
      .map((definition) => entities[definition.key])
      .filter(Boolean);
  }

  _electricVehicleGroups() {
    return [
      ["controls", "ev.groupControls", "Controls"],
      ["state", "ev.groupState", "State"],
      ["vehicle", "ev.groupVehicle", "Vehicle"],
      ["charging", "ev.groupCharging", "Charging"],
      ["limits", "ev.groupLimits", "Limits"],
      ["planning", "ev.groupPlanning", "Planning"],
    ];
  }

  _renderElectricVehicleEntityField(definition, electricVehicle = this._config.electric_vehicle || {}) {
    const value = electricVehicle.entities?.[definition.key] || "";
    const aliases = definition.aliases?.slice(0, 3).join(", ") || `sensor.evcc_${definition.key}`;
    const detailsKey = `electric-vehicle-${definition.key}`;
    const status = this._statusText({
      configured: this._countConfigured([value]),
      missing: this._missingEntityCount([value]),
    });
    return `
      <details class="box-field electric-vehicle-field" data-editor-section="${this._escape(detailsKey)}"${this._detailsOpen(detailsKey) ? " open" : ""}>
        <summary class="box-summary">
          <span class="box-summary-main">
            <strong>${this._escape(this._t(definition.labelKey, {}, definition.label))}</strong>
            <small>${this._escape(aliases)}</small>
          </span>
          <span class="box-summary-side">
            <span class="section-status">${this._escape(status)}</span>
          </span>
        </summary>
        <div class="box-body">
          <label>${this._labelText(this._t("editor.electricVehicleEntity", {}, "EVCC entity"), this._t("editor.helpHomeAssistantSensor", {}, "Choose the Home Assistant entity that provides this value."))}
            <input data-path="electric_vehicle.entities.${this._escape(definition.key)}" list="ha-solar-dashboard-entities" placeholder="${this._escape(aliases.split(", ")[0] || `sensor.evcc_${definition.key}`)}" value="${this._escape(value)}" autocomplete="off" />
          </label>
        </div>
      </details>
    `;
  }

  _renderElectricVehicleEditor(electricVehicle = this._config.electric_vehicle || {}) {
    const normalized = normalizeElectricVehicleConfig?.(electricVehicle) || electricVehicle;
    const entityValues = this._electricVehicleConfiguredValues(normalized);
    const missing = this._missingEntityCount(entityValues);
    const wallbox = normalized.wallbox || "wallbox_power";
    const image = normalized.image || DEFAULT_ELECTRIC_VEHICLE_IMAGE || "images/car_image.png";
    const title = normalized.title || "";
    const groupHtml = this._electricVehicleGroups().map(([groupKey, labelKey, fallback]) => {
      const definitions = this._electricVehicleDefinitions().filter((definition) => definition.group === groupKey);
      if (!definitions.length) return "";
      const values = definitions.map((definition) => normalized.entities?.[definition.key]).filter(Boolean);
      return `
        <section class="editor-card metric-group-card">
          <div class="editor-card-head">
            <strong>${this._escape(this._t(labelKey, {}, fallback))}</strong>
            <span class="section-status">${this._escape(this._statusText({ configured: this._countConfigured(values), missing: this._missingEntityCount(values) }))}</span>
          </div>
          <div class="metric-grid">
            ${definitions.map((definition) => this._renderElectricVehicleEntityField(definition, normalized)).join("")}
          </div>
        </section>
      `;
    }).join("");

    return `
      <section class="editor-panel editor-general">
        <div class="editor-panel-title">${this._escape(this._t("editor.electricVehicleSettings", {}, "E-Auto settings"))}</div>
        <div class="settings-grid">
          <label>${this._escape(this._t("editor.electricVehicleTitle", {}, "Title"))}
            <input data-path="electric_vehicle.title" placeholder="${this._escape(this._t("ev.title", {}, "E-Auto"))}" value="${this._escape(title)}" />
          </label>
          <label>${this._labelText(this._t("editor.electricVehicleImage", {}, "Vehicle image"), this._t("editor.electricVehicleImageHelp", {}, "Relative bundled assets, /local/... paths and full URLs are supported."))}
            <input data-path="electric_vehicle.image" placeholder="${this._escape(DEFAULT_ELECTRIC_VEHICLE_IMAGE || "images/car_image.png")}" value="${this._escape(image)}" autocomplete="off" />
          </label>
          <label>${this._escape(this._t("editor.electricVehicleWallbox", {}, "Wallbox fallback"))}
            <select data-path="electric_vehicle.wallbox">
              <option value="wallbox_power"${wallbox !== "wallbox2_power" ? " selected" : ""}>${this._escape(this._t("metrics.wallbox_power", {}, "EV Charger"))}</option>
              <option value="wallbox2_power"${wallbox === "wallbox2_power" ? " selected" : ""}>${this._escape(this._t("metrics.wallbox2_power", {}, "EV Charger 2"))}</option>
            </select>
          </label>
        </div>
        <div class="checkbox-grid">
          <label class="inline"><input type="checkbox" data-path="show_electric_vehicle" ${this._config.show_electric_vehicle !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showElectricVehicle", {}, "Show E-Auto area"))}</label>
        </div>
      </section>
      ${groupHtml || `<div class="layout-empty">${this._escape(this._t("editor.sectionElectricVehicle", {}, "EVCC entities"))}: ${this._escape(this._statusText({ configured: this._countConfigured(entityValues), total: this._electricVehicleDefinitions().length, missing }))}</div>`}
    `;
  }

  _gardenDefinitions() {
    return Array.isArray(GARDEN_ENTITY_DEFINITIONS) ? GARDEN_ENTITY_DEFINITIONS : [];
  }

  _gardenConfiguredValues(garden = this._config.garden || {}) {
    const normalized = normalizeGardenConfig?.(garden) || garden || {};
    return this._gardenDefinitions()
      .map((definition) => normalized.entities?.[definition.key])
      .filter(Boolean);
  }

  _gardenGroups() {
    return [
      ["mower", "garden.groupMower", "Mäher"],
      ["water", "garden.groupWater", "Gartenwasser"],
      ["weather", "garden.groupWeather", "Wetter & Boden"],
      ["equipment", "garden.groupEquipment", "Gartengeräte"],
    ];
  }

  _renderGardenEntityField(definition, garden = this._config.garden || {}) {
    const value = garden.entities?.[definition.key] || "";
    const aliases = definition.aliases?.slice(0, 3).join(", ") || `sensor.garden_${definition.key}`;
    const detailsKey = `garden-${definition.key}`;
    const status = this._statusText({
      configured: this._countConfigured([value]),
      missing: this._missingEntityCount([value]),
    });
    return `
      <details class="box-field garden-field" data-editor-section="${this._escape(detailsKey)}"${this._detailsOpen(detailsKey) ? " open" : ""}>
        <summary class="box-summary">
          <span class="box-summary-main">
            <strong>${this._escape(this._t(definition.labelKey, {}, definition.label))}</strong>
            <small>${this._escape(aliases)}</small>
          </span>
          <span class="box-summary-side">
            <span class="section-status">${this._escape(status)}</span>
          </span>
        </summary>
        <div class="box-body">
          <label>${this._labelText(this._t("editor.gardenEntity", {}, "Garten entity"), this._t("editor.helpHomeAssistantSensor", {}, "Choose the Home Assistant entity that provides this value."))}
            <input data-path="garden.entities.${this._escape(definition.key)}" list="ha-solar-dashboard-entities" placeholder="${this._escape(aliases.split(", ")[0] || `sensor.garden_${definition.key}`)}" value="${this._escape(value)}" autocomplete="off" />
          </label>
        </div>
      </details>
    `;
  }

  _renderGardenEditor(garden = this._config.garden || {}) {
    const normalized = normalizeGardenConfig?.(garden) || garden;
    const entityValues = this._gardenConfiguredValues(normalized);
    const missing = this._missingEntityCount(entityValues);
    const image = normalized.image || DEFAULT_GARDEN_IMAGE || "images/single_family_home_top_view_garden.png";
    const title = normalized.title || "";
    const groupHtml = this._gardenGroups().map(([groupKey, labelKey, fallback]) => {
      const definitions = this._gardenDefinitions().filter((definition) => definition.group === groupKey);
      if (!definitions.length) return "";
      const values = definitions.map((definition) => normalized.entities?.[definition.key]).filter(Boolean);
      return `
        <section class="editor-card metric-group-card">
          <div class="editor-card-head">
            <strong>${this._escape(this._t(labelKey, {}, fallback))}</strong>
            <span class="section-status">${this._escape(this._statusText({ configured: this._countConfigured(values), total: definitions.length, missing: this._missingEntityCount(values) }))}</span>
          </div>
          <div class="metric-grid">
            ${definitions.map((definition) => this._renderGardenEntityField(definition, normalized)).join("")}
          </div>
        </section>
      `;
    }).join("");
    return `
      <section class="editor-panel editor-general">
        <div class="editor-panel-title">${this._escape(this._t("editor.gardenSettings", {}, "Garten settings"))}</div>
        <div class="settings-grid">
          <label>${this._escape(this._t("editor.gardenTitle", {}, "Title"))}
            <input data-path="garden.title" placeholder="${this._escape(this._t("garden.title", {}, "Garten"))}" value="${this._escape(title)}" />
          </label>
          <label>${this._labelText(this._t("editor.gardenImage", {}, "Garden image"), this._t("editor.electricVehicleImageHelp", {}, "Relative bundled assets, /local/... paths and full URLs are supported."))}
            <input data-path="garden.image" placeholder="${this._escape(DEFAULT_GARDEN_IMAGE || "images/single_family_home_top_view_garden.png")}" value="${this._escape(image)}" autocomplete="off" />
          </label>
        </div>
        <div class="checkbox-grid">
          <label class="inline"><input type="checkbox" data-path="show_garden" ${this._config.show_garden !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showGarden", {}, "Show Garten area"))}</label>
        </div>
      </section>
      ${groupHtml}
      ${groupHtml ? "" : `<div class="layout-empty">${this._escape(this._t("editor.tabGarden", {}, "Garten"))}: ${this._escape(this._statusText({ configured: this._countConfigured(entityValues), total: this._gardenDefinitions().length, missing }))}</div>`}
    `;
  }

  _renderMetricGroups() {
    return this._metricGroupDefinitions().map((group) => {
      const values = group.metrics.flatMap((metric) => this._metricConfigValues(metric));
      const hidden = group.metrics.filter((metric) => !this._metricVisible(metric)).length;
      const status = this._statusText({
        configured: this._countConfigured(values),
        missing: this._missingEntityCount(values),
        hidden,
      });
      return `
        <section class="editor-card metric-group-card">
          <div class="editor-card-head">
            <strong>${this._escape(group.title)}</strong>
            <span class="section-status">${this._escape(status)}</span>
          </div>
          <div class="metric-grid">
            ${group.metrics.map((metric) => this._renderBoxField(metric)).join("")}
          </div>
        </section>
      `;
    }).join("");
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const house = this._normalizeHouse(this._config.house) || "single_family_home";
    const houseOptions = Object.entries(HOUSE_VARIANTS)
      .map(([key, value]) => `<option value="${this._escape(key)}"${key === house ? " selected" : ""}>${this._escape(this._houseLabel(key, value))}</option>`)
      .join("");
    const normalizedConfiguredViewMode = this._normalizeViewMode(this._config.view_mode);
    const configuredViewMode = (
      (this._config.show_floorplan === false && normalizedConfiguredViewMode === "floorplan")
      || (this._config.show_electric_vehicle === false && normalizedConfiguredViewMode === "electric_vehicle")
      || (this._config.show_garden === false && normalizedConfiguredViewMode === "garden")
      || (this._config.show_advisor === false && normalizedConfiguredViewMode === "advisor")
      || (this._config.show_charts === false && normalizedConfiguredViewMode === "charts")
      || (this._config.show_records === false && normalizedConfiguredViewMode === "records")
    )
      ? "house"
      : normalizedConfiguredViewMode;
    const viewMode = this._normalizeViewMode(configuredViewMode) || "house";
    const viewModeOptions = VIEW_MODE_OPTIONS
      .filter((option) => {
        if (option.key === "floorplan") return this._config.show_floorplan !== false;
        if (option.key === "electric_vehicle") return this._config.show_electric_vehicle !== false;
        if (option.key === "garden") return this._config.show_garden !== false;
        if (option.key === "advisor") return this._config.show_advisor !== false;
        if (option.key === "charts") return this._config.show_charts !== false;
        if (option.key === "records") return this._config.show_records !== false;
        return true;
      })
      .map((option) => `<option value="${this._escape(option.key)}"${option.key === viewMode ? " selected" : ""}>${this._escape(this._t(option.labelKey, {}, option.label))}</option>`)
      .join("");
    const entityOptions = this._entityOptions()
      .map((entityId) => `<option value="${this._escape(entityId)}"></option>`)
      .join("");
    const customKpis = Array.isArray(this._config.custom_kpis) ? this._config.custom_kpis : [];
    const customKpiFields = customKpis.map((kpi, index) => this._renderCustomKpiField(kpi, index)).join("");
    const environmentSensors = this._normalizeEnvironmentSensors(this._config.environment_sensors || []);
    this._config.environment_sensors = environmentSensors;
    const environmentSensorFields = environmentSensors.map((sensor, index) => this._renderEnvironmentSensorField(sensor, index)).join("");
    const floorplan = this._normalizeFloorplan(this._config.floorplan || {});
    this._config.floorplan = floorplan;
    const electricVehicle = normalizeElectricVehicleConfig?.(this._config.electric_vehicle || this._config.ev || this._config.e_auto || {}) || {};
    this._config.electric_vehicle = electricVehicle;
    const garden = normalizeGardenConfig?.(this._config.garden || this._config.garten || this._config.irrigation || {}) || {};
    this._config.garden = garden;
    this._config.pv_roof_string_display = normalizePvRoofStringDisplay(this._config.pv_roof_string_display);
    this._config.pv_roof_strings = normalizePvRoofStrings(this._config.pv_roof_strings || []);
    this._config.inverter_display = normalizeInverterDisplay(this._config.inverter_display);
    this._config.inverters = normalizeInverters(this._config.inverters || []);
    const largeConsumers = normalizeLargeConsumers(this._config.large_consumers || []);
    this._config.large_consumers = largeConsumers;
    const largeConsumerFields = largeConsumers.map((consumer, index) => this._renderLargeConsumerField(consumer, index)).join("");
    const overlayFields = IMAGE_OVERLAY_KEYS.map((key) => this._renderOverlayField(key)).join("");
    const configuredTileEntities = TILE_METRICS.map((metric) => this._config.entities?.[metric.key]).filter(Boolean);
    const overlayCount = IMAGE_OVERLAY_KEYS.filter((key) => this._config.image_overlays?.[key]?.enabled === true).length;
    const environmentConfigured = environmentSensors.filter((sensor) => sensor.entity).length;
    const environmentMissing = this._missingEntityCount(environmentSensors.map((sensor) => sensor.entity));
    const floorplanElementCount = (floorplan.floors || []).reduce((total, floor) => total + floor.rooms.length + floor.walls.length + floor.sensors.length, 0);
    const floorplanMissing = this._missingEntityCount((floorplan.floors || []).flatMap((floor) => floor.sensors).map((sensor) => {
      if (sensor.entity) return sensor.entity;
      return environmentSensors.find((item) => item.id === sensor.environment_sensor)?.entity || "";
    }));
    const electricVehicleEntityValues = this._electricVehicleConfiguredValues(electricVehicle);
    const electricVehicleConfigured = this._countConfigured(electricVehicleEntityValues);
    const electricVehicleMissing = this._missingEntityCount(electricVehicleEntityValues);
    const gardenEntityValues = this._gardenConfiguredValues(garden);
    const gardenConfigured = this._countConfigured(gardenEntityValues);
    const gardenMissing = this._missingEntityCount(gardenEntityValues);
    const gardenTotal = this._gardenDefinitions().length;
    const largeConsumerConfigured = largeConsumers.filter((consumer) => consumer.power_entity || consumer.energy_entity).length;
    const customKpiConfigured = customKpis.filter((kpi) => kpi.entity || kpi.value).length;
    const renderEditorCard = (title, status, content) => `
      <section class="editor-card">
        <div class="editor-card-head">
          <strong>${this._escape(title)}</strong>
          <span class="section-status">${this._escape(status)}</span>
        </div>
        <div class="section-body">${content}</div>
      </section>
    `;
    const dashboardAreasHtml = `
      <section class="editor-panel editor-dashboard-areas">
        <div class="editor-panel-title">${this._escape(this._t("editor.sectionDashboardAreas", {}, "Dashboard areas"))}</div>
        <div class="checkbox-grid">
          <label class="inline"><input type="checkbox" data-path="show_view_selector" ${this._config.show_view_selector !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showViewSelector", {}, "Show view selector"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_electric_vehicle" ${this._config.show_electric_vehicle !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showElectricVehicle", {}, "Show E-Auto area"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_garden" ${this._config.show_garden !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showGarden", {}, "Show Garten area"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_floorplan" ${this._config.show_floorplan !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showFloorplan", {}, "Show floorplan"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_advisor" ${this._config.show_advisor !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showAdvisor", {}, "Show Advisor Dashboard"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_charts" ${this._config.show_charts !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showCharts", {}, "Show Charts Dashboard"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_records" ${this._config.show_records !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showRecords", {}, "Show Records Dashboard"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_metric_tiles" ${this._config.show_metric_tiles !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showMetricTiles"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_environment_sensors" ${this._config.show_environment_sensors !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showEnvironmentSensors", {}, "Show environment sensor tiles"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_large_consumers" ${this._config.show_large_consumers !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showLargeConsumers", {}, "Show large consumers in house view"))}</label>
        </div>
      </section>
    `;
    const generalSettingsHtml = `
      <section class="editor-panel editor-general">
        <div class="editor-panel-title">${this._escape(this._t("editor.sectionGeneral", {}, "General settings"))}</div>
        <div class="settings-grid">
          <label>${this._escape(this._t("editor.title"))} <input data-path="title" value="${this._escape(this._config.title || "")}" /></label>
          <label>${this._escape(this._t("editor.viewMode", {}, "Default view"))} <select data-path="view_mode">${viewModeOptions}</select></label>
          <label>${this._escape(this._t("editor.houseType"))} <select data-path="house">${houseOptions}</select></label>
          <label>${this._labelText(this._t("editor.customImage"), this._t("editor.helpCustomImages", {}, "Store custom images in Home Assistant under /config/www/ and enter them as /local/.... When weather_entity is set, matching suffixes are tried automatically, for example /local/solar/house_day_rainy.png before /local/solar/house_day.png."))} <input data-path="image" placeholder="/local/solar/single_family_home/single_family_home.png or https://..." value="${this._escape(this._config.image || "")}" /></label>
          <label>${this._labelText(this._t("editor.customDayImage"), this._t("editor.helpCustomImages", {}, "Store custom images in Home Assistant under /config/www/ and enter them as /local/.... When weather_entity is set, matching suffixes are tried automatically, for example /local/solar/house_day_rainy.png before /local/solar/house_day.png."))} <input data-path="day_image" placeholder="${this._escape(this._t("editor.optionalDayImage"))}" value="${this._escape(this._config.day_image || "")}" /></label>
          <label>${this._escape(this._t("editor.weatherEntity"))}
            <input data-path="weather_entity" list="ha-solar-dashboard-entities" placeholder="weather.home" value="${this._escape(this._config.weather_entity || "")}" autocomplete="off" />
          </label>
        </div>
        <div class="checkbox-grid">
          <label class="inline"><input type="checkbox" data-path="show_title" ${this._config.show_title !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showTitle"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_house_selector" ${this._config.show_house_selector !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showHouseSelector"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_energy_range_selector" ${this._config.show_energy_range_selector === true ? "checked" : ""}/> ${this._escape(this._t("editor.showEnergyRangeSelector"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_power_flows" ${this._config.show_power_flows === true ? "checked" : ""}/> ${this._escape(this._t("editor.showPowerFlows"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_grid_status_tile" ${this._config.show_grid_status_tile !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showGridStatusTile"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_status_label" ${this._config.show_status_label !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showStatusLabel"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_weather_status" ${this._config.show_weather_status === true ? "checked" : ""}/> ${this._escape(this._t("editor.showWeatherStatus"))}</label>
        </div>
      </section>
    `;
    const advisorSettingsHtml = `
      <div class="details-grid">
        <label>${this._escape(this._t("editor.advisorMaxSuggestions", {}, "Advisor suggestions"))} (${this._escape(Number(this._config.advisor_max_suggestions ?? ADVISOR_DEFAULTS.maxSuggestions).toFixed(0))})
          <input type="range" min="1" max="12" step="1" data-path="advisor_max_suggestions" value="${this._escape(this._config.advisor_max_suggestions ?? ADVISOR_DEFAULTS.maxSuggestions)}" />
        </label>
        <label>${this._escape(this._t("editor.advisorEvSurplusThreshold", {}, "EV surplus threshold (W)"))}
          <input type="number" min="0" max="1000000" step="50" data-path="advisor_ev_surplus_threshold" value="${this._escape(this._config.advisor_ev_surplus_threshold ?? ADVISOR_DEFAULTS.evSurplusThreshold)}" />
        </label>
        <label>${this._escape(this._t("editor.electricityPriceEntity", {}, "Electricity price entity"))}
          <input data-path="entities.electricity_price" list="ha-solar-dashboard-entities" placeholder="sensor.electricity_price" value="${this._escape(this._config.entities?.electricity_price || "")}" autocomplete="off" />
        </label>
      </div>
    `;
    const appearanceSettingsHtml = `
      <div class="details-grid">
        <label>${this._escape(this._t("editor.hudBoxOpacity"))} (${this._escape((Number(this._config.hud_box_opacity ?? 0.65)).toFixed(2))})
          <input type="range" min="0" max="1" step="0.05" data-path="hud_box_opacity" value="${this._escape(this._config.hud_box_opacity ?? 0.65)}" />
        </label>
        <label>${this._escape(this._t("editor.hudBoxScale"))} (${this._escape((Number(this._config.hud_box_scale ?? 1)).toFixed(2))})
          <input type="range" min="0.6" max="1.8" step="0.05" data-path="hud_box_scale" value="${this._escape(this._config.hud_box_scale ?? 1)}" />
        </label>
        <label>${this._escape(this._t("editor.powerDisplayMode"))}
          <select data-path="power_display_mode">
            <option value="raw"${this._config.power_display_mode === "raw" ? " selected" : ""}>${this._escape(this._t("editor.rawMode"))}</option>
            <option value="auto_kw"${(this._config.power_display_mode || "auto_kw") === "auto_kw" ? " selected" : ""}>${this._escape(this._t("editor.autoWKw"))}</option>
          </select>
        </label>
        <label>${this._escape(this._t("editor.powerDecimals"))} (${this._escape(Number(this._config.power_decimals ?? 2).toFixed(0))})
          <input type="range" min="0" max="3" step="1" data-path="power_decimals" value="${this._escape(this._config.power_decimals ?? 2)}" />
        </label>
        <label>${this._escape(this._t("editor.gridVoltageWarningThreshold", {}, "High grid voltage (V)"))}
          <input type="number" min="0" max="1000" step="1" data-path="grid_voltage_warning_threshold" value="${this._escape(this._config.grid_voltage_warning_threshold ?? 245)}" />
        </label>
        <label>${this._escape(this._t("editor.gridVoltageCriticalThreshold", {}, "Critical grid voltage (V)"))}
          <input type="number" min="0" max="1000" step="1" data-path="grid_voltage_critical_threshold" value="${this._escape(this._config.grid_voltage_critical_threshold ?? 253)}" />
        </label>
      </div>
    `;
    const boxSettingsHtml = this._renderMetricGroups();
    const overlaySettingsHtml = `<div class="grid">${overlayFields}</div>`;
    const kpiSettingsHtml = `
      <div class="grid">${customKpiFields}</div>
      <div class="action-row"><button type="button" data-action="add-kpi">${this._escape(this._t("editor.kpiAdd"))}</button></div>
    `;
    const environmentTemplateButtons = this._environmentSensorTemplates().map((template) => `
      <button type="button" data-action="add-environment-sensor" data-template="${this._escape(template.key)}" style="--template-color:${this._escape(template.color)}">${this._escape(template.label)}</button>
    `).join("");
    const environmentSettingsHtml = `
      <div class="template-row" aria-label="${this._escape(this._t("editor.environmentTemplates", {}, "Environment templates"))}">
        ${environmentTemplateButtons}
      </div>
      <div class="grid">${environmentSensorFields}</div>
    `;
    const largeConsumerSettingsHtml = `
      <div class="grid">${largeConsumerFields}</div>
      <div class="action-row"><button type="button" data-action="add-large-consumer">${this._escape(this._t("editor.consumerAddCustom", {}, "Add custom large consumer"))}</button></div>
    `;
    const tabPanels = [
      {
        key: "setup",
        label: this._t("editor.tabSetup", {}, "Setup"),
        status: this._statusText({ configured: this._countConfigured([this._config.house, this._config.title, this._config.weather_entity]) }),
        content: `${this._renderSetupWizard()}${dashboardAreasHtml}${generalSettingsHtml}`,
      },
      {
        key: "energy",
        label: this._t("editor.tabEnergy", {}, "Energy"),
        status: this._statusText({ configured: configuredTileEntities.length, total: TILE_METRICS.length, missing: this._missingEntityCount(configuredTileEntities) }),
        content: boxSettingsHtml,
      },
      {
        key: "devices",
        label: this._t("editor.tabDevices", {}, "Devices"),
        status: this._statusText({ configured: overlayCount + largeConsumerConfigured, total: IMAGE_OVERLAY_KEYS.length + largeConsumers.length }),
        content: [
          renderEditorCard(this._t("editor.sectionOverlays", {}, "Image overlays"), this._statusText({ configured: overlayCount, total: IMAGE_OVERLAY_KEYS.length }), `<div class="grid">${overlayFields}</div>`),
          renderEditorCard(this._t("editor.sectionLargeConsumers", {}, "Additional large consumers"), this._statusText({ configured: largeConsumerConfigured, total: largeConsumers.length, hidden: largeConsumers.filter((consumer) => consumer.visible === false).length }), largeConsumerSettingsHtml),
        ].join(""),
      },
      {
        key: "electric_vehicle",
        label: this._t("editor.tabElectricVehicle", {}, "E-Auto"),
        status: this._statusText({ configured: electricVehicleConfigured, total: this._electricVehicleDefinitions().length, hidden: this._config.show_electric_vehicle === false ? 1 : 0, missing: electricVehicleMissing }),
        content: this._renderElectricVehicleEditor(electricVehicle),
      },
      {
        key: "garden",
        label: this._t("editor.tabGarden", {}, "Garten"),
        status: this._statusText({ configured: gardenConfigured, total: gardenTotal, hidden: this._config.show_garden === false ? 1 : 0, missing: gardenMissing }),
        content: this._renderGardenEditor(garden),
      },
      {
        key: "environment",
        label: this._t("editor.tabEnvironment", {}, "Environment"),
        status: this._statusText({ configured: environmentConfigured, total: environmentSensors.length, hidden: environmentSensors.filter((sensor) => sensor.visible === false).length, missing: environmentMissing }),
        content: renderEditorCard(this._t("editor.sectionEnvironmentSensors", {}, "Environment sensors"), this._statusText({ configured: environmentConfigured, total: environmentSensors.length, missing: environmentMissing }), environmentSettingsHtml),
      },
      {
        key: "floorplan",
        label: this._t("editor.tabFloorplan", {}, "Floorplan"),
        status: this._statusText({ configured: floorplanElementCount, missing: floorplanMissing }),
        content: this._renderFloorplanEditor(),
      },
      {
        key: "layout",
        label: this._t("editor.tabLayout", {}, "Layout"),
        status: this._statusText({ configured: this._layoutItems().length }),
        content: this._renderLayoutEditor(),
      },
      {
        key: "appearance",
        label: this._t("editor.tabAppearance", {}, "Appearance"),
        status: this._statusText({ advanced: true }),
        content: renderEditorCard(this._t("editor.sectionAppearance", {}, "Display and limits"), this._statusText({ advanced: true }), appearanceSettingsHtml),
      },
      {
        key: "advisor",
        label: this._t("editor.tabAdvisor", {}, "Advisor"),
        status: this._statusText({ configured: this._countConfigured([this._config.entities?.electricity_price]) }),
        content: renderEditorCard(this._t("editor.sectionAdvisor", {}, "Advisor and prices"), this._statusText({ configured: this._countConfigured([this._config.entities?.electricity_price]), advanced: true }), advisorSettingsHtml),
      },
      {
        key: "advanced",
        label: this._t("editor.tabAdvanced", {}, "Advanced"),
        status: this._statusText({ configured: customKpiConfigured, total: customKpis.length, advanced: true }),
        content: renderEditorCard(this._t("editor.sectionKpis", {}, "Custom KPI tiles"), this._statusText({ configured: customKpiConfigured, total: customKpis.length }), kpiSettingsHtml),
      },
    ];
    const activeTab = this._activeTab();
    const activePanel = tabPanels.find((tab) => tab.key === activeTab) || tabPanels[0];
    const configuredOverviewValues = [
      ...configuredTileEntities,
      ...electricVehicleEntityValues,
      ...gardenEntityValues,
      ...environmentSensors.map((sensor) => sensor.entity),
      ...largeConsumers.flatMap((consumer) => [consumer.power_entity, consumer.energy_entity]),
      ...customKpis.flatMap((kpi) => [kpi.entity, kpi.value]),
    ];
    const overviewEntityValues = [
      ...configuredTileEntities,
      ...electricVehicleEntityValues,
      ...gardenEntityValues,
      ...environmentSensors.map((sensor) => sensor.entity),
      ...largeConsumers.flatMap((consumer) => [consumer.power_entity, consumer.energy_entity]),
      ...customKpis.map((kpi) => kpi.entity),
    ];
    const overviewHtml = `
      <header class="editor-overview">
        <div class="overview-item">
          <span>${this._escape(this._t("editor.overviewActive", {}, "Active"))}</span>
          <strong>${this._escape(activePanel.label)}</strong>
        </div>
        <div class="overview-item">
          <span>${this._escape(this._t("editor.overviewEntities", {}, "Entities"))}</span>
          <strong>${this._escape(this._countConfigured(configuredOverviewValues))}</strong>
        </div>
        <div class="overview-item">
          <span>${this._escape(this._t("editor.overviewItems", {}, "Items"))}</span>
          <strong>${this._escape(customKpis.length + environmentSensors.length + largeConsumers.length + floorplanElementCount + this._countConfigured(electricVehicleEntityValues) + this._countConfigured(gardenEntityValues))}</strong>
        </div>
        <div class="overview-item${this._missingEntityCount(overviewEntityValues) > 0 ? " warning" : ""}">
          <span>${this._escape(this._t("editor.overviewMissing", {}, "Missing"))}</span>
          <strong>${this._escape(this._missingEntityCount(overviewEntityValues))}</strong>
        </div>
      </header>
    `;
    const tabButtons = tabPanels.map((tab) => {
      const accessibleLabel = `${tab.label}: ${tab.status}`;
      return `
      <button type="button" class="editor-tab${tab.key === activeTab ? " active" : ""}" data-editor-tab="${this._escape(tab.key)}" aria-pressed="${tab.key === activeTab ? "true" : "false"}" aria-label="${this._escape(accessibleLabel)}" title="${this._escape(accessibleLabel)}">
        ${this._editorTabIcon(tab.key)}
        <span class="editor-tab-label">${this._escape(tab.label)}</span>
        <small class="editor-tab-status">${this._escape(tab.status)}</small>
      </button>
    `;
    }).join("");
    const tabContent = tabPanels.map((tab) => `
      <section class="editor-tab-panel${tab.key === activeTab ? " active" : ""}" data-editor-tab-panel="${this._escape(tab.key)}" ${tab.key === activeTab ? "" : "hidden"}>
        ${tab.content}
      </section>
    `).join("");

    this.shadowRoot.innerHTML = `
      <style>
        .editor{
          --editor-bg:var(--ha-card-background,var(--card-background-color,#151718));
          --editor-surface:var(--secondary-background-color,#202428);
          --editor-surface-soft:color-mix(in srgb,var(--editor-surface) 72%,transparent);
          --editor-border:var(--divider-color,#3b4148);
          --editor-text:var(--primary-text-color,#f2f4f5);
          --editor-muted:var(--secondary-text-color,#aab2ba);
          --editor-accent:var(--primary-color,#00a884);
          --editor-warning:#f59e0b;
          display:grid;
          gap:12px;
          min-width:0;
          max-width:100%;
          overflow:hidden;
          container-type:inline-size;
          color:var(--editor-text);
          font-family:system-ui,sans-serif;
        }
        label{display:grid;gap:5px;min-width:0;max-width:100%;color:var(--editor-text);font-size:12.5px;font-weight:650}
        input,select,button{box-sizing:border-box;min-width:0;max-width:100%;border:1px solid var(--editor-border);border-radius:6px;color:var(--editor-text);font:inherit}
        input,select{width:100%;padding:8px 9px;background:color-mix(in srgb,var(--editor-surface) 78%,transparent);text-overflow:ellipsis}
        input[type="range"]{padding:6px 0;background:transparent}
        button{width:auto;padding:8px 10px;background:var(--editor-surface);cursor:pointer;font-weight:750}
        button:hover:not(:disabled){border-color:var(--editor-accent)}
        button:disabled{opacity:.55;cursor:not-allowed}
        summary{cursor:pointer;color:var(--editor-text)}
        summary::-webkit-details-marker{display:none}
        .editor-overview{display:grid;grid-template-columns:repeat(4,minmax(112px,1fr));gap:8px;min-width:0;max-width:100%;overflow-x:auto;padding-bottom:2px;scrollbar-width:thin}
        .overview-item{display:grid;gap:3px;min-width:112px;padding:10px 12px;border:1px solid var(--editor-border);border-radius:8px;background:var(--editor-surface-soft);box-shadow:inset 3px 0 0 color-mix(in srgb,var(--editor-accent) 72%,var(--editor-border))}
        .overview-item span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--editor-muted);font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:0}
        .overview-item strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:18px;line-height:1.15}
        .overview-item.warning{box-shadow:inset 3px 0 0 var(--editor-warning)}
        .editor-shell{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;align-items:start;min-width:0}
        .editor-main{display:grid;gap:12px;min-width:0}
        .editor-tabs{position:sticky;top:0;z-index:2;display:flex;flex-wrap:nowrap;gap:6px;min-width:0;max-width:100%;align-self:stretch;overflow-x:auto;overflow-y:hidden;padding:2px 0 5px;scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--editor-accent) 40%,var(--editor-border)) transparent}
        .editor-tab{position:relative;flex:1 0 72px;display:grid;grid-template-rows:22px auto;place-items:center;gap:3px;min-height:54px;padding:7px 8px;border-color:var(--editor-border);border-radius:8px;background:var(--editor-surface-soft);text-align:center}
        .editor-tab-icon{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;color:var(--editor-muted)}
        .editor-tab-label{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;font-weight:850;line-height:1.15}
        .editor-tab-status{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
        .editor-tab.active{border-color:color-mix(in srgb,var(--editor-accent) 72%,var(--editor-border));background:color-mix(in srgb,var(--editor-accent) 12%,var(--editor-surface));box-shadow:inset 0 -3px 0 var(--editor-accent)}
        .editor-tab.active .editor-tab-icon{color:var(--editor-accent)}
        .editor-tab-panel{display:grid;gap:12px;min-width:0}
        .editor-tab-panel[hidden]{display:none}
        .editor-panel,.editor-card{display:grid;gap:10px;min-width:0;padding:12px;border:1px solid var(--editor-border);border-radius:8px;background:color-mix(in srgb,var(--editor-bg) 86%,var(--editor-surface))}
        .editor-panel-title{font-size:14px;font-weight:900;color:var(--editor-text)}
        .editor-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;min-width:0}
        .editor-card-head strong{min-width:0;overflow-wrap:anywhere;color:var(--editor-text);font-size:14px}
        .editor-card-head span:not(.section-status){display:block;margin-top:2px;color:var(--editor-muted);font-size:12px;line-height:1.35}
        .section-status{display:inline-flex;align-items:center;justify-content:center;min-width:0;max-width:100%;border-radius:999px;padding:4px 7px;background:color-mix(in srgb,var(--editor-accent) 12%,var(--editor-surface));color:var(--editor-muted);font-size:11px;font-weight:850;line-height:1.15;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .section-body,.box-body{display:grid;gap:9px;min-width:0}
        .box-body{padding:0 11px 11px}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;min-width:0}
        .metric-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:7px;min-width:0}
        .settings-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:8px;min-width:0}
        .checkbox-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:7px;min-width:0}
        .action-row{display:flex;justify-content:flex-start;min-width:0}
        .box-field{display:grid;gap:0;min-width:0;box-sizing:border-box;border:1px solid var(--editor-border);border-radius:8px;background:var(--editor-surface-soft);overflow:hidden}
        details.box-field{display:block}
        .box-summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 11px;list-style:none}
        .box-summary::after{content:"";display:none}
        .box-summary-main{display:grid;gap:2px;min-width:0}
        .box-summary-main strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:900}
        .box-summary-main small{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--editor-muted);font-size:11px;font-weight:650}
        .box-summary-side{display:flex;align-items:center;gap:7px;min-width:0}
        .box-summary-side::after{content:"";width:7px;height:7px;border-right:2px solid var(--editor-muted);border-bottom:2px solid var(--editor-muted);transform:rotate(45deg);transition:transform .16s ease}
        details[open]>.box-summary .box-summary-side::after{transform:rotate(225deg)}
        details[open]>.box-summary{border-bottom:1px solid var(--editor-border);background:color-mix(in srgb,var(--editor-accent) 7%,transparent)}
        .field-label-text{display:inline-flex;align-items:center;gap:5px;min-width:0}
        .field-help{display:inline-grid;place-items:center;width:16px;height:16px;flex:0 0 auto;border-radius:999px;background:color-mix(in srgb,var(--editor-accent) 18%,var(--editor-surface));color:var(--editor-accent);font-size:11px;font-weight:900;cursor:help}
        .field-note{margin:0;color:var(--editor-muted);font-size:12px;line-height:1.35}
        .inline{display:flex;align-items:center;gap:8px;min-width:0;font-weight:650}
        .inline input{width:auto;min-width:auto;padding:0}
        .template-row{display:flex;flex-wrap:wrap;gap:6px;min-width:0}
        .template-row button{border-color:color-mix(in srgb,var(--template-color,#00a884) 45%,var(--editor-border));box-shadow:inset 3px 0 0 var(--template-color,#00a884);font-weight:800}
        details{min-width:0}
        .pv-labels,.label-options{padding:8px;border:1px solid var(--editor-border);border-radius:8px;background:color-mix(in srgb,var(--editor-bg) 70%,transparent)}
        .pv-labels summary,.label-options summary{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12.5px;font-weight:850;list-style:none}
        .pv-labels summary::after,.label-options summary::after,.setup-wizard summary::after{content:"";width:7px;height:7px;border-right:2px solid var(--editor-muted);border-bottom:2px solid var(--editor-muted);transform:rotate(45deg);transition:transform .16s ease}
        .pv-labels[open]>summary::after,.label-options[open]>summary::after,.setup-wizard[open]>summary::after{transform:rotate(225deg)}
        .details-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-top:8px;min-width:0}
        .label-options .checkbox-grid{margin-top:8px}
        .label-entity-block{display:grid;gap:6px;min-width:0}
        .label-entity-title{font-size:12.5px;color:var(--editor-text)}
        .kpi-head{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;font-size:13px}
        .kpi-head strong{min-width:0;overflow-wrap:anywhere}
        .setup-wizard{padding:10px;border:1px solid color-mix(in srgb,var(--editor-accent) 45%,var(--editor-border));border-radius:8px;background:color-mix(in srgb,var(--editor-accent) 8%,var(--editor-bg));box-shadow:inset 4px 0 0 var(--editor-accent)}
        .setup-wizard summary{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:900;font-size:14px;list-style:none}
        .wizard-body{display:grid;gap:10px;margin-top:10px;min-width:0}
        .wizard-body p{margin:0;color:var(--editor-muted);font-size:12.5px;line-height:1.4}
        .wizard-status,.wizard-empty{color:var(--editor-muted);font-size:12px}
        .wizard-message{padding:8px;border-radius:6px;background:rgba(0,168,132,.14);color:#34d399;font-size:12px}
        .wizard-actions{display:flex;flex-wrap:wrap;gap:8px}
        .wizard-actions button,.wizard-suggestion button{border-color:color-mix(in srgb,var(--editor-accent) 45%,var(--editor-border));background:color-mix(in srgb,var(--editor-accent) 12%,var(--editor-surface))}
        .wizard-suggestions-title{color:var(--editor-text);font-size:13px;font-weight:850}
        .wizard-suggestions{display:grid;gap:8px;min-width:0}
        .wizard-suggestion{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;min-width:0;padding:9px;border:1px solid var(--editor-border);border-radius:8px;background:var(--editor-surface-soft)}
        .wizard-suggestion-main{display:grid;gap:4px;min-width:0}
        .wizard-suggestion-main strong{overflow-wrap:anywhere;color:var(--editor-text);font-size:13px}
        .wizard-suggestion code,.wizard-current code{overflow-wrap:anywhere;white-space:normal;color:var(--editor-muted);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px}
        .wizard-current{display:grid;gap:2px;min-width:0;color:var(--editor-muted);font-size:12px}
        .wizard-suggestion-side{display:grid;justify-items:end;gap:6px;color:var(--editor-muted);font-size:12px;white-space:nowrap}
        .layout-editor{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(220px,.65fr);gap:10px;align-items:start;min-width:0}
        .layout-preview{position:relative;min-width:0;aspect-ratio:91/64;overflow:hidden;border-radius:8px;border:1px solid var(--editor-border);background:#151718}
        .layout-preview img{display:block;width:100%;height:100%;object-fit:cover}
        .layout-marker{position:absolute;transform:translate(-50%,-50%);max-width:112px;padding:5px 7px;border-color:color-mix(in srgb,var(--layout-color,#00a884) 62%,rgba(255,255,255,.22));background:rgba(18,20,22,.76);box-shadow:inset 3px 0 0 var(--layout-color,#00a884),0 8px 18px rgba(0,0,0,.28);font-size:11px;font-weight:850;line-height:1.1}
        .layout-marker span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .layout-marker.active{outline:2px solid color-mix(in srgb,var(--layout-color,#00a884) 84%,#fff);outline-offset:2px}
        .layout-controls{display:grid;gap:8px;min-width:0}
        .layout-empty{padding:10px;border:1px dashed var(--editor-border);border-radius:8px;color:var(--editor-muted);font-size:13px}
        .floorplan-tool-row,.floorplan-floor-tabs{display:flex;flex-wrap:wrap;gap:6px;min-width:0}
        .floorplan-tool-row button,.floorplan-floor-tabs button{font-weight:850}
        .floorplan-tool-row button.active,.floorplan-floor-tabs button.active{border-color:var(--editor-accent);background:color-mix(in srgb,var(--editor-accent) 12%,var(--editor-surface));box-shadow:inset 3px 0 0 var(--editor-accent)}
        .floorplan-floor-row,.floorplan-image-settings{display:grid;gap:8px;min-width:0}
        .floorplan-editor{grid-template-columns:minmax(0,1fr)}
        .floorplan-editor-preview{position:relative;min-width:0;aspect-ratio:10/7;overflow:hidden;border-radius:8px;border:1px solid var(--editor-border);background:#151718}
        .floorplan-editor-preview svg{display:block;width:100%;height:100%;cursor:crosshair}
        .floorplan-editor .layout-controls{grid-template-columns:repeat(2,minmax(0,1fr));padding:10px;border:1px solid var(--editor-border);border-radius:8px;background:var(--editor-surface-soft)}
        .floorplan-editor .layout-controls strong,.floorplan-editor .layout-controls button{grid-column:1/-1}
        .floorplan-editor-bg{fill:rgba(18,20,22,.94)}
        .floorplan-editor-image{pointer-events:auto}
        .floorplan-image-empty{position:absolute;inset:0;display:grid;place-items:center;padding:18px;color:var(--editor-muted);text-align:center;font-size:13px;pointer-events:none}
        .floorplan-editor-gridline{stroke:rgba(255,255,255,.08);stroke-width:.18;vector-effect:non-scaling-stroke}
        .floorplan-editor-room,.floorplan-editor-wall,.floorplan-editor-sensor{cursor:move}
        .floorplan-editor-room rect{fill:color-mix(in srgb,var(--room-color,#00a884) 12%,rgba(255,255,255,.04));stroke:color-mix(in srgb,var(--room-color,#00a884) 48%,rgba(255,255,255,.2));stroke-width:.5;vector-effect:non-scaling-stroke}
        .floorplan-editor-room text{fill:rgba(243,246,255,.82);font-size:2.3px;font-weight:850;pointer-events:none}
        .floorplan-editor-wall{stroke:var(--wall-color,#dbeafe);stroke-width:var(--wall-width,1.2);stroke-linecap:round;vector-effect:non-scaling-stroke}
        .floorplan-editor-sensor circle{fill:var(--sensor-color,#34d399);stroke:rgba(255,255,255,.86);stroke-width:.45;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 5px var(--sensor-color,#34d399))}
        .floorplan-editor-sensor .floorplan-sensor-label{fill:var(--editor-muted);font-size:2.35px;font-weight:750;pointer-events:none;paint-order:stroke;stroke:rgba(8,13,28,.74);stroke-width:.45px;stroke-linejoin:round}
        .floorplan-editor-sensor .floorplan-sensor-value{fill:var(--sensor-color,#34d399);font-size:var(--sensor-font-size,3.05px);font-weight:900;pointer-events:none;paint-order:stroke;stroke:rgba(8,13,28,.78);stroke-width:.55px;stroke-linejoin:round}
        .floorplan-editor-room.active rect,.floorplan-editor-wall.active,.floorplan-editor-sensor.active circle{filter:drop-shadow(0 0 5px var(--editor-accent))}
        .floorplan-editor-room.active rect{stroke:#fff}
        .floorplan-editor-wall.active{stroke:#fff}
        .floorplan-editor-sensor.active circle{stroke:#fff}
        @container (max-width:840px){
          .editor-shell{grid-template-columns:minmax(0,1fr)}
          .editor-tabs{position:static;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))}
          .editor-tab{min-height:58px}
          .editor-tab.active{box-shadow:inset 0 -3px 0 var(--editor-accent)}
        }
        @container (max-width:520px){
          .editor-tabs,.layout-editor,.floorplan-editor .layout-controls{grid-template-columns:minmax(0,1fr)}
          .editor-card-head,.box-summary,.wizard-suggestion{display:grid;grid-template-columns:minmax(0,1fr)}
          .box-summary-side,.wizard-suggestion-side{justify-items:start;justify-content:start;white-space:normal}
          .section-status{text-align:left}
        }
        @media (max-width:840px){
          .editor-shell{grid-template-columns:minmax(0,1fr)}
          .editor-tabs{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}
        }
        @media (max-width:700px){
          .checkbox-grid,.settings-grid,.editor-tabs,.layout-editor,.floorplan-editor .layout-controls{grid-template-columns:minmax(0,1fr)}
          .editor-card-head,.box-summary,.wizard-suggestion{display:grid;grid-template-columns:minmax(0,1fr)}
          .box-summary-side,.wizard-suggestion-side{justify-items:start;justify-content:start;white-space:normal}
          .section-status{text-align:left}
        }
      </style>
      <div class="editor">
        <datalist id="ha-solar-dashboard-entities">${entityOptions}</datalist>
        ${overviewHtml}
        <div class="editor-shell">
          <nav class="editor-tabs" aria-label="${this._escape(this._t("editor.tabs", {}, "Configuration sections"))}">
            ${tabButtons}
          </nav>
          <main class="editor-main">
            ${tabContent}
          </main>
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll("input,select").forEach((element) => {
      element.addEventListener("change", (event) => {
        const target = event.target;
        const path = target.dataset.path;
        if (!path) return;
        const isCheckbox = target.type === "checkbox";
        const value = isCheckbox ? target.checked : target.value;
        this._onInput(path, value, isCheckbox);
      });
    });
    this.shadowRoot.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const target = event.currentTarget;
        if (target.dataset.action === "add-kpi") this._addCustomKpi();
        if (target.dataset.action === "remove-kpi") this._removeCustomKpi(Number(target.dataset.index));
        if (target.dataset.action === "add-environment-sensor") this._addEnvironmentSensor(target.dataset.template || "custom");
        if (target.dataset.action === "remove-environment-sensor") this._removeEnvironmentSensor(Number(target.dataset.index));
        if (target.dataset.action === "add-floorplan-floor") this._addFloorplanFloor();
        if (target.dataset.action === "remove-floorplan-item") this._removeSelectedFloorplanItem();
        if (target.dataset.action === "add-pv-roof-string") this._addPvRoofString();
        if (target.dataset.action === "remove-pv-roof-string") this._removePvRoofString(Number(target.dataset.index));
        if (target.dataset.action === "add-inverter") this._addInverter();
        if (target.dataset.action === "remove-inverter") this._removeInverter(Number(target.dataset.index));
        if (target.dataset.action === "add-large-consumer") this._addLargeConsumer();
        if (target.dataset.action === "remove-large-consumer") this._removeLargeConsumer(Number(target.dataset.index));
        if (target.dataset.action === "auto-detect") this._applyAutoDetection(target.dataset.mode || "fill");
        if (target.dataset.action === "apply-suggestion") this._applyAutoDetection("replace", target.dataset.path || "");
      });
    });
    this.shadowRoot.querySelectorAll("button[data-editor-tab]").forEach((button) => {
      button.addEventListener("click", (event) => this._setActiveTab(event.currentTarget.dataset.editorTab));
    });
    this.shadowRoot.querySelectorAll("button[data-floorplan-tool]").forEach((button) => {
      button.addEventListener("click", (event) => this._setFloorplanTool(event.currentTarget.dataset.floorplanTool));
    });
    this.shadowRoot.querySelectorAll("button[data-floorplan-floor]").forEach((button) => {
      button.addEventListener("click", (event) => this._setFloorplanFloor(event.currentTarget.dataset.floorplanFloor));
    });
    this.shadowRoot.querySelectorAll("[data-floorplan-select]").forEach((element) => {
      element.addEventListener("pointerdown", (event) => {
        const floorplanCanvas = this.shadowRoot.querySelector("[data-floorplan-canvas]");
        const floorplan = this._normalizeFloorplan(this._config.floorplan || {});
        const { floor } = this._activeFloorplanFloor(floorplan);
        const key = event.currentTarget.dataset.floorplanSelect;
        const selected = this._floorplanItemByKey(floor, key);
        if (!floorplanCanvas || !selected) return;
        event.preventDefault();
        event.stopPropagation();
        const point = this._floorplanPointFromEvent(floorplanCanvas, event);
        const item = selected.item;
        this._selectedFloorplanItemKey = key;
        this._floorplanDrag = {
          key,
          type: selected.type,
          item: { ...item },
          element: event.currentTarget,
          pointerId: event.pointerId,
          offsetX: selected.type === "wall" ? point.x - Number(item.x1) : point.x - Number(item.x || 0),
          offsetY: selected.type === "wall" ? point.y - Number(item.y1) : point.y - Number(item.y || 0),
          moved: false,
          lastCoordinates: undefined,
        };
        try {
          event.currentTarget.setPointerCapture?.(event.pointerId);
        } catch (_err) {
          // Pointer capture is optional; drag still works through the SVG listener.
        }
      });
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (this._floorplanSuppressElementClick) {
          this._floorplanSuppressElementClick = false;
          return;
        }
        this._selectedFloorplanItemKey = event.currentTarget.dataset.floorplanSelect;
        this._render();
      });
    });
    const floorplanCanvas = this.shadowRoot.querySelector("[data-floorplan-canvas]");
    if (floorplanCanvas) {
      floorplanCanvas.addEventListener("pointermove", (event) => {
        const drag = this._floorplanDrag;
        if (!drag) return;
        event.preventDefault();
        const point = this._floorplanPointFromEvent(floorplanCanvas, event);
        const coordinates = this._floorplanDragCoordinates(drag, point);
        if (!coordinates) return;
        drag.moved = true;
        drag.lastCoordinates = coordinates;
        this._applyFloorplanDragPreview(drag, coordinates);
      });
      const finishDrag = (event) => {
        const drag = this._floorplanDrag;
        if (!drag) return;
        event.preventDefault();
        event.stopPropagation();
        this._floorplanDrag = undefined;
        if (drag.moved && drag.lastCoordinates) {
          this._floorplanSuppressCanvasClick = true;
          this._floorplanSuppressElementClick = true;
          window.setTimeout(() => {
            this._floorplanSuppressCanvasClick = false;
            this._floorplanSuppressElementClick = false;
          }, 0);
          this._commitFloorplanDrag(drag, drag.lastCoordinates);
          return;
        }
        this._selectedFloorplanItemKey = drag.key;
      };
      floorplanCanvas.addEventListener("pointerup", finishDrag);
      floorplanCanvas.addEventListener("pointercancel", finishDrag);
      floorplanCanvas.addEventListener("click", (event) => {
        if (this._floorplanSuppressCanvasClick) {
          this._floorplanSuppressCanvasClick = false;
          return;
        }
        if (event.target.closest?.("[data-floorplan-select]")) return;
        if (event.target !== floorplanCanvas && !event.target.classList?.contains("floorplan-editor-bg") && !event.target.classList?.contains("floorplan-editor-gridline") && !event.target.classList?.contains("floorplan-editor-image")) return;
        const { x, y } = this._floorplanPointFromEvent(floorplanCanvas, event);
        this._addFloorplanItem(this._floorplanTool(), x, y);
      });
    }
    this.shadowRoot.querySelectorAll("[data-layout-key]").forEach((button) => {
      button.addEventListener("click", (event) => {
        this._selectedLayoutItemKey = event.currentTarget.dataset.layoutKey;
        this._render();
      });
    });
    const layoutSelect = this.shadowRoot.querySelector("[data-layout-select]");
    if (layoutSelect) {
      layoutSelect.addEventListener("change", (event) => {
        this._selectedLayoutItemKey = event.currentTarget.value;
        this._render();
      });
    }
    const setupWizard = this.shadowRoot.querySelector("details[data-setup-wizard]");
    if (setupWizard) {
      setupWizard.addEventListener("toggle", (event) => {
        this._setupWizardOpen = event.currentTarget.open;
      });
    }
    this.shadowRoot.querySelectorAll("details[data-editor-section]").forEach((details) => {
      details.addEventListener("toggle", (event) => {
        const key = event.currentTarget.dataset.editorSection;
        if (!key) return;
        this._editorSectionState = this._editorSectionState || new Map();
        this._editorSectionState.set(key, event.currentTarget.open);
      });
    });
    this.shadowRoot.querySelectorAll("details[data-label-options]").forEach((details) => {
      details.addEventListener("toggle", (event) => {
        const key = event.currentTarget.dataset.labelOptions;
        if (!key) return;
        this._openLabelOptions = this._openLabelOptions || new Set();
        if (event.currentTarget.open) this._openLabelOptions.add(key);
        else this._openLabelOptions.delete(key);
      });
    });

    this._rendered = true;
  }
};
}

const HOUSE_VARIANTS = {
  single_family_home: {
    label: "Single Family Home",
    folder: "single_family_home",
    file: "single_family_home.png",
    dayFile: "single_family_home_day.png",
    fallbackFiles: ["single_family_home_legacy.png"],
    positions: {
      pv_roof_power: { left: 64, top: 28 },
      pv_shed_power: { left: 14, top: 80 },
      battery_level: { left: 49, top: 66 },
      inverter_power: { left: 53, top: 72 },
      wallbox_power: { left: 23, top: 57 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 83 },
    },
  },
  duplex_house: {
    label: "Duplex House",
    folder: "duplex_house",
    file: "duplex_house.png",
    dayFile: "duplex_house_day.png",
    positions: {
      pv_roof_power: { left: 46, top: 23 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 49, top: 73 },
      inverter_power: { left: 37, top: 56 },
      wallbox_power: { left: 27, top: 66 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  terraced_middle_house: {
    label: "Terraced Middle House",
    folder: "terraced_middle_house",
    file: "terraced_middle_house.png",
    dayFile: "terraced_middle_house_day.png",
    positions: {
      pv_roof_power: { left: 48, top: 18 },
      pv_shed_power: { left: 80, top: 76 },
      battery_level: { left: 33, top: 61 },
      inverter_power: { left: 34, top: 51 },
      wallbox_power: { left: 44, top: 66 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  apartment_building: {
    label: "Apartment Building",
    folder: "apartment_building",
    file: "apartment_building.png",
    dayFile: "apartment_building_day.png",
    positions: {
      pv_roof_power: { left: 53, top: 17 },
      pv_shed_power: { left: 16, top: 81 },
      battery_level: { left: 35, top: 65 },
      inverter_power: { left: 35, top: 72 },
      wallbox_power: { left: 21, top: 59 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  apartment_building_balcony_solar: {
    label: "Apartment Building Balcony Solar",
    folder: "apartment_building_balcony_solar",
    file: "apartment_building_balcony_solar.png",
    dayFile: "apartment_building_balcony_solar_day.png",
    positions: {
      battery_level: { left: 42, top: 70 },
      inverter_power: { left: 52, top: 58 },
      pv_total_power: { left: 62, top: 58 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
    visible_boxes: {
      pv_roof_power: false,
      pv_shed_power: false,
      wallbox_power: false,
      wallbox2_power: false,
      import_export_power: true,
      battery_level: true,
      inverter_power: true,
      pv_total_power: true,
    },
    labels: {
      pv_total_power: "PV Power",
    },
    labelKeys: {
      pv_total_power: "metrics.pv_power",
    },
  },
  bungalow: {
    label: "Bungalow",
    folder: "bungalow",
    file: "bungalow.png",
    dayFile: "bungalow_day.png",
    positions: {
      pv_roof_power: { left: 51, top: 29 },
      pv_shed_power: { left: 16, top: 80 },
      battery_level: { left: 40, top: 66 },
      inverter_power: { left: 54, top: 69 },
      wallbox_power: { left: 25, top: 59 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  city_villa: {
    label: "City Villa",
    folder: "city_villa",
    file: "city_villa.png",
    dayFile: "city_villa_day.png",
    positions: {
      pv_roof_power: { left: 55, top: 16 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 43, top: 71 },
      inverter_power: { left: 58, top: 58 },
      wallbox_power: { left: 25, top: 57 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  city_villa_pitched_roof: {
    label: "City Villa with Pitched Roof",
    folder: "city_villa_pitched_roof",
    file: "city_villa_pitched_roof.png",
    dayFile: "city_villa_pitched_roof_day.png",
    positions: {
      pv_roof_power: { left: 58, top: 18 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 41, top: 66 },
      inverter_power: { left: 55, top: 56 },
      wallbox_power: { left: 25, top: 60 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
};

const DEFAULT_IMAGE_OVERLAYS = {
  single_family_home: {
    smoke: { left: 58, top: 18, width: 9 },
    heatpump: { left: 82, top: 63, width: 11, orientation: "right" },
  },
  duplex_house: {
    smoke: { left: 52, top: 18, width: 9 },
    heatpump: { left: 78, top: 66, width: 11, orientation: "right" },
  },
  terraced_middle_house: {
    smoke: { left: 51, top: 16, width: 8 },
    heatpump: { left: 66, top: 68, width: 10, orientation: "left" },
  },
  apartment_building: {
    smoke: { left: 52, top: 13, width: 8 },
    heatpump: { left: 79, top: 68, width: 10, orientation: "right" },
  },
  apartment_building_balcony_solar: {
    smoke: { left: 50, top: 13, width: 8 },
    heatpump: { left: 76, top: 70, width: 10, orientation: "right" },
  },
  bungalow: {
    smoke: { left: 50, top: 25, width: 8 },
    heatpump: { left: 79, top: 66, width: 11, orientation: "right" },
  },
  city_villa: {
    smoke: { left: 55, top: 15, width: 8 },
    heatpump: { left: 79, top: 65, width: 10, orientation: "right" },
  },
  city_villa_pitched_roof: {
    smoke: { left: 56, top: 18, width: 8 },
    heatpump: { left: 78, top: 65, width: 10, orientation: "right" },
  },
};

const IMAGE_OVERLAY_KEYS = ["smoke", "heatpump"];

function normalizeHouse(value) {
  if (!value) return undefined;
  const normalized = String(value).toLowerCase().trim().replace(/[\s_]+/g, "-");
  const aliases = {
    home: "single_family_home",
    modern: "single_family_home",
    einfamilienhaus: "single_family_home",
    "single-family-home": "single_family_home",
    doppelhaus: "duplex_house",
    "doppel-haus": "duplex_house",
    duplex: "duplex_house",
    "duplex-house": "duplex_house",
    reihenhaus: "terraced_middle_house",
    "reihen-haus": "terraced_middle_house",
    reihenmittelhaus: "terraced_middle_house",
    "reihen-mittelhaus": "terraced_middle_house",
    "reihen-mittel-haus": "terraced_middle_house",
    "terraced-house": "terraced_middle_house",
    "terraced-middle-house": "terraced_middle_house",
    mfh: "apartment_building",
    mehrfamilienhaus: "apartment_building",
    "mehr-familienhaus": "apartment_building",
    "mehrfamilien-haus": "apartment_building",
    "apartment-building": "apartment_building",
    "mehrfamilienhaus-balkonsolar": "apartment_building_balcony_solar",
    "mehr-familienhaus-balkonsolar": "apartment_building_balcony_solar",
    "mehrfamilienhaus-balkon-solar": "apartment_building_balcony_solar",
    "mehr-familienhaus-balkon-solar": "apartment_building_balcony_solar",
    balkonsolar: "apartment_building_balcony_solar",
    "balcony-solar": "apartment_building_balcony_solar",
    "apartment-building-balcony-solar": "apartment_building_balcony_solar",
    bungalow: "bungalow",
    "bungalow-house": "bungalow",
    villa: "city_villa",
    stadtvilla: "city_villa",
    "stadt-villa": "city_villa",
    "city-villa": "city_villa",
    stadtvilla_2: "city_villa_pitched_roof",
    "stadtvilla-2": "city_villa_pitched_roof",
    "stadtvilla-ohne-flachdach": "city_villa_pitched_roof",
    stadtvilla_dach: "city_villa_pitched_roof",
    "stadtvilla-dach": "city_villa_pitched_roof",
    "city-villa-pitched-roof": "city_villa_pitched_roof",
  };
  const key = aliases[normalized] || normalized;
  return HOUSE_VARIANTS[key] ? key : undefined;
}

const HTML_RAW = Symbol("htmlRaw");
const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function rawHtml(value) {
  return { [HTML_RAW]: true, value: String(value ?? "") };
}

function classNames(...values) {
  return values.flat(Infinity)
    .flatMap((value) => {
      if (!value) return [];
      if (typeof value === "string") return [value];
      if (Array.isArray(value)) return classNames(...value).split(" ").filter(Boolean);
      if (typeof value === "object") return Object.entries(value)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([name]) => name);
      return [String(value)];
    })
    .filter(Boolean)
    .join(" ");
}

function kebabCase(value) {
  return String(value).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function styleMap(styles = {}) {
  if (typeof styles === "string") return styles;
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== null && value !== false && value !== "")
    .map(([name, value]) => `${kebabCase(name)}:${value}`)
    .join(";");
}

function htmlAttributes(attrs = {}) {
  return Object.entries(attrs)
    .flatMap(([name, value]) => {
      if (value === undefined || value === null || value === false) return [];
      if (value === true) return [escapeHtml(name)];
      const attrValue = name === "class"
        ? classNames(value)
        : name === "style" && typeof value === "object"
          ? styleMap(value)
          : value;
      if (attrValue === "") return [];
      return [`${escapeHtml(name)}="${escapeHtml(attrValue)}"`];
    })
    .join(" ");
}

function childToHtml(child) {
  if (child === undefined || child === null || child === false) return "";
  if (Array.isArray(child)) return child.map(childToHtml).join("");
  if (child && typeof child === "object" && child[HTML_RAW]) return child.value;
  return escapeHtml(child);
}

function htmlTag(name, attrs = {}, children = []) {
  const attrText = htmlAttributes(attrs);
  const tagName = String(name).toLowerCase();
  const openTag = attrText ? `<${tagName} ${attrText}>` : `<${tagName}>`;
  if (VOID_ELEMENTS.has(tagName)) return openTag;
  return `${openTag}${childToHtml(children)}</${tagName}>`;
}

const LARGE_CONSUMER_DEFINITIONS = Object.freeze([
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

function normalizeLargeConsumers(consumers) {
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

function largeConsumerLabel(consumer, index = 0, translate) {
  const configured = String(consumer?.label || "").trim();
  if (configured) return configured;
  const fallback = consumer?.defaultLabel || `Consumer ${index + 1}`;
  if (consumer?.labelKey) return translate?.(consumer.labelKey, {}, fallback) || fallback;
  return translate?.(`consumer.${consumer?.type || consumer?.id}`, {}, fallback) || fallback;
}

function largeConsumerHasEntity(consumer) {
  return Boolean(consumer?.power_entity || consumer?.energy_entity);
}

function largeConsumerPowerEntityId(metricOrConsumer) {
  return metricOrConsumer?.largeConsumer?.power_entity || metricOrConsumer?.power_entity || "";
}

function largeConsumerEnergyEntityId(metricOrConsumer) {
  return metricOrConsumer?.largeConsumer?.energy_entity || metricOrConsumer?.energy_entity || "";
}

function largeConsumerVoltageEntityId(metricOrConsumer) {
  return metricOrConsumer?.largeConsumer?.voltage_entity || metricOrConsumer?.voltage_entity || "";
}

function largeConsumerMetrics(consumers = [], { labelForConsumer } = {}) {
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

function largeConsumerPowerWatts(metricOrConsumer, { getValue, getUnit, valueAsWatts } = {}) {
  const entityId = largeConsumerPowerEntityId(metricOrConsumer);
  if (!entityId) return undefined;
  const value = typeof getValue === "function" ? getValue(entityId) : undefined;
  const watts = typeof valueAsWatts === "function" ? valueAsWatts(value, getUnit?.(entityId)) : undefined;
  return Number.isFinite(watts) ? Math.max(0, watts) : undefined;
}

function largeConsumerEntityIds(consumers = []) {
  return consumers.flatMap((consumer) => [consumer.power_entity, consumer.voltage_entity, consumer.energy_entity]).filter(Boolean);
}

function largeConsumerAdvisorDetails(consumers = [], {
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

const OVERLAY_TILE_METRICS = Object.freeze([
  Object.freeze({ key: "overlay_smoke", label: "Gas", labelKey: "overlay.smoke", color: "yellow", unit: "overlay", overlay: "smoke", tileOrder: 7 }),
  Object.freeze({ key: "overlay_heatpump", label: "Heat pump", labelKey: "overlay.heatpump", color: "blue", unit: "overlay", overlay: "heatpump", tileOrder: 8 }),
]);

const METRICS = Object.freeze([
  Object.freeze({ key: "pv_roof_power", label: "Roof PV", unit: "power", color: "yellow" }),
  Object.freeze({ key: "pv_shed_power", label: "Shed PV", unit: "power", color: "yellow" }),
  Object.freeze({ key: "battery_level", label: "Battery", unit: "battery", color: "green" }),
  Object.freeze({ key: "inverter_power", label: "Inverter", unit: "power", color: "blue" }),
  Object.freeze({ key: "wallbox_power", label: "EV Charger", unit: "power", color: "blue" }),
  Object.freeze({ key: "wallbox2_power", label: "EV Charger 2", unit: "power", color: "blue", optional: true }),
  Object.freeze({ key: "water_meter", label: "Water", unit: "volume", color: "blue", optional: true, tileOrder: 9 }),
  Object.freeze({ key: "import_export_power", label: "Import/Export", unit: "power", color: "blue", optional: true, tile: false }),
]);

const TILE_METRICS = Object.freeze([
  ...METRICS,
  Object.freeze({ key: "pv_total_power", label: "PV Total", unit: "power", color: "yellow", hud: false }),
  Object.freeze({ key: "house_consumption_power", label: "Consumption", unit: "power", color: "blue", hud: false, optional: true, tileOrder: 6 }),
]);

const STATUS_METRIC = Object.freeze({ key: "import_export_power", label: "Import/Export", unit: "power", color: "blue" });

const GRID_STATUS_METRIC = Object.freeze({
  ...STATUS_METRIC,
  key: "grid_status",
  sourceKey: "import_export_power",
  label: "Grid",
  labelKey: "metrics.grid_status",
  gridStatus: true,
  hud: false,
  tileOrder: 90,
});

const DEFAULT_TILE_COLOR_RULES = Object.freeze({
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

const STATIC_METRIC_COLORS = Object.freeze({
  yellow: "#ffc233",
  blue: "#1f8fff",
  green: "#34d399",
});

function metricSourceKey(metric) {
  return metric?.sourceKey || metric?.key || "";
}

function findMetricByKey(key, metrics = TILE_METRICS) {
  return metrics.find((metric) => metric.key === key);
}

function findFlowMetric(key) {
  return findMetricByKey(key, TILE_METRICS)
    || findMetricByKey(key, METRICS)
    || (key === STATUS_METRIC.key ? STATUS_METRIC : undefined);
}

function isPvMetric(metric) {
  return ["pv_roof_power", "pv_shed_power", "pv_total_power"].includes(metric?.key);
}

function isPvRoofMetric(metric) {
  return metricSourceKey(metric) === "pv_roof_power";
}

function isImportExportMetric(metric) {
  return metricSourceKey(metric) === "import_export_power";
}

function metricVoltageEntityKey(metric) {
  if (!metric || metric.largeConsumer) return "";
  return `${metricSourceKey(metric)}_voltage`;
}

function inverterPhaseVoltageEntityKeys(metric) {
  if (metricSourceKey(metric) !== "inverter_power") return [];
  return ["inverter_power_voltage_l1", "inverter_power_voltage_l2", "inverter_power_voltage_l3"];
}

function normalizePvConfigId(value, fallback) {
  const id = String(value || fallback || "").trim().replace(/[^\w-]+/g, "_");
  return id || String(fallback || "item").replace(/[^\w-]+/g, "_");
}

function clampPvConfigNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function parsePowerLimitWatts(rawValue, defaultUnit = "kw") {
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

function normalizePvRoofStringDisplay(value) {
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

function normalizePvRoofStrings(strings) {
  return normalizePowerSourceConfigs(strings, normalizePvRoofStringConfig);
}

function normalizeInverterDisplay(value) {
  return normalizePvRoofStringDisplay(value);
}

function normalizeInverters(inverters) {
  return normalizePowerSourceConfigs(inverters, normalizeInverterConfig);
}

function pvRoofBaseEnergyEntityId(config = {}) {
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

function buildPvRoofStringEntries({
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

function buildInverterEntries({
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

function hasAdditionalPvRoofStrings(entries = []) {
  return entries.some((entry) => !entry.base && (entry.powerEntityId || entry.energyEntityId));
}

function hasAdditionalInverters(entries = []) {
  return hasAdditionalPvRoofStrings(entries);
}

function pvRoofStringPowerParts(entries = [], { unit = "auto", readPowerWatts, formatPowerValue } = {}) {
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

function pvRoofStringTotalPowerWatts(parts = []) {
  const values = parts.map((part) => part.amount).filter(Number.isFinite);
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

function inverterPowerParts(entries = [], options = {}) {
  return pvRoofStringPowerParts(entries, options);
}

function inverterTotalPowerWatts(parts = []) {
  return pvRoofStringTotalPowerWatts(parts);
}

function pvRoofStringMaxPowerWatts(entries = []) {
  const maxValues = entries
    .map((entry) => entry.maxPowerWatts)
    .filter((value) => Number.isFinite(value) && value > 0);
  if (maxValues.length === 0) return undefined;
  return maxValues.reduce((sum, value) => sum + value, 0);
}

function inverterMaxPowerWatts(entries = []) {
  return pvRoofStringMaxPowerWatts(entries);
}

function pvRoofStringEnergyParts(entries = [], { range = "live", readEnergyInfo, formatEnergyValue } = {}) {
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

function inverterEnergyParts(entries = [], options = {}) {
  return pvRoofStringEnergyParts(entries, options);
}

function formatPvRoofStringReading({
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

function formatInverterReading(options = {}) {
  return formatPvRoofStringReading({
    ...options,
    mode: normalizeInverterDisplay(options.mode),
  });
}

function pvRoofStringAdvisorDetails(entries = [], { readPowerWatts } = {}) {
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

function inverterAdvisorDetails(entries = [], { readPowerWatts } = {}) {
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

const CHART_DASHBOARD_VIEW = "charts";
const RECORDS_DASHBOARD_VIEW = "records";
const FLOORPLAN_DASHBOARD_VIEW = "floorplan";
const ELECTRIC_VEHICLE_DASHBOARD_VIEW = "electric_vehicle";
const GARDEN_DASHBOARD_VIEW = "garden";

const VIEW_MODE_OPTIONS = Object.freeze([
  Object.freeze({ key: "house", labelKey: "view.house", label: "House View", icon: "house" }),
  Object.freeze({ key: ELECTRIC_VEHICLE_DASHBOARD_VIEW, labelKey: "view.electricVehicle", label: "E-Auto", icon: "car" }),
  Object.freeze({ key: GARDEN_DASHBOARD_VIEW, labelKey: "view.garden", label: "Garten", icon: "droplet" }),
  Object.freeze({ key: FLOORPLAN_DASHBOARD_VIEW, labelKey: "view.floorplan", label: "Floorplan", icon: "floorplan" }),
  Object.freeze({ key: "advisor", labelKey: "view.advisor", label: "Advisor Dashboard", icon: "advisor" }),
  Object.freeze({ key: CHART_DASHBOARD_VIEW, labelKey: "view.charts", label: "Charts", icon: "chart" }),
  Object.freeze({ key: RECORDS_DASHBOARD_VIEW, labelKey: "view.records", label: "Records", icon: "records" }),
]);

const VIEW_MODE_ALIASES = Object.freeze({
  home: "house",
  haus: "house",
  house_view: "house",
  building: "house",
  e_auto: ELECTRIC_VEHICLE_DASHBOARD_VIEW,
  eauto: ELECTRIC_VEHICLE_DASHBOARD_VIEW,
  ev: ELECTRIC_VEHICLE_DASHBOARD_VIEW,
  evcc: ELECTRIC_VEHICLE_DASHBOARD_VIEW,
  car: ELECTRIC_VEHICLE_DASHBOARD_VIEW,
  auto: ELECTRIC_VEHICLE_DASHBOARD_VIEW,
  vehicle: ELECTRIC_VEHICLE_DASHBOARD_VIEW,
  electric_vehicle: ELECTRIC_VEHICLE_DASHBOARD_VIEW,
  elektroauto: ELECTRIC_VEHICLE_DASHBOARD_VIEW,
  garten: GARDEN_DASHBOARD_VIEW,
  garden: GARDEN_DASHBOARD_VIEW,
  irrigation: GARDEN_DASHBOARD_VIEW,
  watering: GARDEN_DASHBOARD_VIEW,
  bewaesserung: GARDEN_DASHBOARD_VIEW,
  bewasserung: GARDEN_DASHBOARD_VIEW,
  lawn: GARDEN_DASHBOARD_VIEW,
  grundriss: FLOORPLAN_DASHBOARD_VIEW,
  floor_plan: FLOORPLAN_DASHBOARD_VIEW,
  floorplan_view: FLOORPLAN_DASHBOARD_VIEW,
  plan: FLOORPLAN_DASHBOARD_VIEW,
  advisor_dashboard: "advisor",
  advisor_view: "advisor",
  adviser: "advisor",
  adviser_dashboard: "advisor",
  energy_advisor: "advisor",
  chart: CHART_DASHBOARD_VIEW,
  diagram: CHART_DASHBOARD_VIEW,
  verlauf: CHART_DASHBOARD_VIEW,
  charts_dashboard: CHART_DASHBOARD_VIEW,
  highscore: RECORDS_DASHBOARD_VIEW,
  high_score: RECORDS_DASHBOARD_VIEW,
  highscores: RECORDS_DASHBOARD_VIEW,
  records: RECORDS_DASHBOARD_VIEW,
  rekord: RECORDS_DASHBOARD_VIEW,
  rekorde: RECORDS_DASHBOARD_VIEW,
});

const VIEW_MODE_ICONS = Object.freeze({
  house: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 10.5 9-7 9 7"></path>
      <path d="M5 9.5V20h14V9.5"></path>
      <path d="M9 20v-6h6v6"></path>
    </svg>
  `,
  car: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 17h14"></path>
      <path d="M6 17l1.5-6.2A3 3 0 0 1 10.42 8h3.16a3 3 0 0 1 2.92 2.8L18 17"></path>
      <path d="M7.5 13h9"></path>
      <circle cx="8" cy="17" r="2"></circle>
      <circle cx="16" cy="17" r="2"></circle>
      <path d="M12 4l-1.4 2.6H13L11.4 10"></path>
    </svg>
  `,
  droplet: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5C8.7 7.2 6 10.9 6 14a6 6 0 0 0 12 0c0-3.1-2.7-6.8-6-10.5Z"></path>
    </svg>
  `,
  advisor: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v2"></path>
      <path d="M12 19v2"></path>
      <path d="M4.22 4.22 5.64 5.64"></path>
      <path d="M18.36 18.36 19.78 19.78"></path>
      <path d="M3 12h2"></path>
      <path d="M19 12h2"></path>
      <path d="M4.22 19.78 5.64 18.36"></path>
      <path d="M18.36 5.64 19.78 4.22"></path>
      <path d="M9 12.5 11 14.5 15.5 9.5"></path>
      <circle cx="12" cy="12" r="5"></circle>
    </svg>
  `,
  floorplan: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V4h16v16Z"></path>
      <path d="M4 10h7"></path>
      <path d="M14 4v7"></path>
      <path d="M11 10v10"></path>
      <path d="M11 15h9"></path>
      <path d="M7 20v-4"></path>
      <path d="M16 15v-4"></path>
    </svg>
  `,
  chart: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19V5"></path>
      <path d="M4 19h16"></path>
      <path d="m7 15 3-4 3 2 4-6"></path>
      <path d="M17 7h3v3"></path>
    </svg>
  `,
  records: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 21h8"></path>
      <path d="M12 17v4"></path>
      <path d="M7 4h10v4a5 5 0 0 1-10 0Z"></path>
      <path d="M17 5h3v2a3 3 0 0 1-3 3"></path>
      <path d="M7 5H4v2a3 3 0 0 0 3 3"></path>
      <path d="m10 9 1.2 1.2L14 7.5"></path>
    </svg>
  `,
});

function normalizeViewMode(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "_");
  const key = VIEW_MODE_ALIASES[normalized] || normalized;
  return VIEW_MODE_OPTIONS.some((option) => option.key === key) ? key : undefined;
}

function viewModeIconSvg(icon) {
  return VIEW_MODE_ICONS[icon] || "";
}

const WALLBOX_POWER_KEYS = Object.freeze(["wallbox_power", "wallbox2_power"]);

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

function adjacentWallboxPosition(basePosition = {}) {
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

function wallboxEntityKey(metric, kind) {
  return WALLBOX_ENTITY_KEYS[wallboxMetricKey(metric)]?.[kind] || "";
}

function wallboxEntityId(config = {}, metric, kind) {
  const key = wallboxMetricKey(metric);
  const aliases = WALLBOX_ENTITY_ALIASES[kind]?.[key] || [];
  return aliases.map((alias) => config.entities?.[alias]).find(Boolean) || "";
}

function wallboxPhaseEntityKey(metric) {
  return wallboxEntityKey(metric, "phase");
}

function wallboxPhaseEntityId(config, metric) {
  return wallboxEntityId(config, metric, "phase");
}

function wallboxPhaseActionEntityKey(metric) {
  return wallboxEntityKey(metric, "phaseAction");
}

function wallboxPhaseActionEntityId(config, metric) {
  return wallboxEntityId(config, metric, "phaseAction");
}

function wallboxPhaseRemainingEntityKey(metric) {
  return wallboxEntityKey(metric, "phaseRemaining");
}

function wallboxPhaseRemainingEntityId(config, metric) {
  return wallboxEntityId(config, metric, "phaseRemaining");
}

function wallboxSocEntityKey(metric) {
  return wallboxEntityKey(metric, "soc");
}

function wallboxSocEntityId(config, metric) {
  return wallboxEntityId(config, metric, "soc");
}

function wallboxMaxSocEntityKey(metric) {
  return wallboxEntityKey(metric, "maxSoc");
}

function wallboxMaxSocEntityId(config, metric) {
  return wallboxEntityId(config, metric, "maxSoc");
}

function wallboxConnectedEntityKey(metric) {
  return wallboxEntityKey(metric, "connected");
}

function wallboxConnectedEntityId(config, metric) {
  return wallboxEntityId(config, metric, "connected");
}

function wallboxChargingEnabledEntityKey(metric) {
  return wallboxEntityKey(metric, "chargingEnabled");
}

function wallboxChargingEnabledEntityId(config, metric) {
  return wallboxEntityId(config, metric, "chargingEnabled");
}

function wallboxRemainingTimeEntityKey(metric) {
  return wallboxEntityKey(metric, "remainingTime");
}

function wallboxRemainingTimeEntityId(config, metric) {
  return wallboxEntityId(config, metric, "remainingTime");
}

function numericPercentValue(rawValue) {
  if (isUnavailableWallboxValue(rawValue)) return undefined;
  const numericValue = Number(String(rawValue).replace(",", ".").replace("%", ""));
  if (!Number.isFinite(numericValue)) return undefined;
  return Math.max(0, Math.min(100, numericValue));
}

function wallboxPhaseLabel(rawValue, translate) {
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

function stateAsBoolean(rawValue) {
  const normalized = String(rawValue ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized || UNAVAILABLE_VALUES.includes(normalized)) return undefined;
  if (["on", "true", "1", "yes", "ja", "connected", "plugged", "plugged_in", "home", "enabled", "active", "ready", "verbunden", "eingesteckt", "angeschlossen", "freigegeben", "aktiviert"].includes(normalized)) return true;
  if (["off", "false", "0", "no", "nein", "disconnected", "unplugged", "not_connected", "away", "disabled", "inactive", "nicht_verbunden", "ausgesteckt", "getrennt", "gesperrt", "deaktiviert"].includes(normalized)) return false;
  return undefined;
}

function wallboxBooleanEntityState(entityId, { getValue, getState } = {}) {
  if (!entityId) return undefined;
  const direct = stateAsBoolean(getValue?.(entityId));
  if (direct !== undefined) return direct;
  return stateAsBoolean(getState?.(entityId)?.state);
}

function wallboxSocLabel(rawValue, entityUnit = "") {
  if (isUnavailableWallboxValue(rawValue)) return "";
  const numericValue = Number(String(rawValue).replace(",", "."));
  const value = Number.isFinite(numericValue)
    ? `${Math.round(Math.max(0, Math.min(100, numericValue)))}%`
    : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
  return `Auto ${value}`;
}

function wallboxPhaseActionText(rawValue) {
  const raw = String(rawValue ?? "").trim();
  const normalized = raw.toLowerCase();
  if (!normalized || [...UNAVAILABLE_VALUES, "-keine-", "keine", "no action"].includes(normalized)) return "";
  return raw;
}

function wallboxPhaseRemainingSeconds(rawValue, entityUnit = "", numericParser = Number) {
  const value = typeof numericParser === "function" ? numericParser(rawValue) : Number(rawValue);
  if (!Number.isFinite(value)) return undefined;
  const unit = String(entityUnit || "").trim().toLowerCase();
  if (unit.includes("h") || unit.includes("std") || unit.includes("hour") || unit.includes("stunde")) return value * 3600;
  if (unit.includes("min") || unit === "m") return value * 60;
  return value;
}

function wallboxPhaseActionInfo({
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

function wallboxIsCharging(metric, {
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

function wallboxRemainingTimeLabel({
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

function wallboxAdvisorDetails(keys = WALLBOX_POWER_KEYS, {
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

const CARD_EDITOR_PANEL_TYPE = "ha-solar-dashboard-card-editor-panel";
const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["en", "de", "es", "fr", "pl"];
const I18N = {
  "en": {
    "aria.energyRangeSelector": "Select value range",
    "aria.houseSelector": "Select house",
    "aria.viewSelector": "Select dashboard view",
    "card.defaultTitle": "Energy Flow",
    "advisor.action": "Action",
    "advisor.autarky": "Autarky",
    "advisor.actionHiddenToday": "Hidden for today",
    "advisor.batteryIdle": "Battery is not charging while surplus is exported. Check battery limits or charge mode.",
    "advisor.batteryHighSocLong": "House battery has been between 90 and 100% for more than 120 minutes. Batteries should not stay that full for too long.",
    "advisor.batteryCyclesHigh": "House battery has completed several full cycles today. Frequent cycling can age the battery faster.",
    "advisor.batteryDeepSoc": "House battery SoC is very low. Protect the reserve and avoid additional flexible loads.",
    "advisor.batteryLow": "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible.",
    "advisor.batteryMaxReached": "Battery is at the configured max SoC. Additional PV is likely to be exported.",
    "advisor.batteryNearlyFull": "Battery is nearly full, so additional PV is likely to be exported.",
    "advisor.batteryReserveDischarging": "Battery is at or below reserve SoC and still discharging. Check min SoC or backup reserve settings.",
    "advisor.batteryStatus": "Battery",
    "advisor.batteryTemperatureHigh": "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits.",
    "advisor.batteryTemperatureLow": "House battery temperature is low. Charging power may be limited and battery stress can increase.",
    "advisor.checkSensors": "Check unavailable or missing sensors so the energy balance stays reliable.",
    "advisor.configureConsumption": "Add a house consumption sensor to improve autarky and load analysis.",
    "advisor.configureGrid": "Add grid import/export sensors for better advice about surplus and grid draw.",
    "advisor.configurePvTotal": "Add PV total power or roof/shed PV sensors to improve production analysis.",
    "advisor.consumption": "Load",
    "advisor.detailEntities": "Entities",
    "advisor.detailEntityValue": "{entity} currently reports {value} for {label}. {impact}",
    "advisor.detailIntro": "The Advisor shows this as {priority} for {window}, because {reason}",
    "advisor.detailSignals": "Decision signals",
    "advisor.detailSources": "Data sources",
    "advisor.detailValues": "Values",
    "advisor.detailValueOnly": "{label} is currently {value}. {impact}",
    "advisor.detailWhy": "Why this appears",
    "advisor.detailsToggle": "Show details",
    "advisor.dismissToday": "Hide today",
    "advisor.evChargingGrid": "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended.",
    "advisor.evChargingPv": "EV charging is currently covered well by PV or stored energy.",
    "advisor.evEnableCharging": "Charging is currently disabled. Enable charging if you want to use the PV surplus.",
    "advisor.evPlugIn": "Plug in the vehicle to use PV surplus for charging.",
    "advisor.evPhaseChangeScheduled": "{action} in {duration} if the PV situation does not change.",
    "advisor.evSocAbove80Long": "Vehicle SoC is above 80% for more than 120 minutes. This can stress the battery if it stays there too long.",
    "advisor.evSocAbove90Long": "Vehicle SoC is above 90% for more than 60 minutes. Stop charging or lower the target SoC if the car will stay parked.",
    "advisor.evTargetReached": "Vehicle is already at the configured target SoC. Use surplus for another flexible load.",
    "advisor.evTargetReachedGrid": "Vehicle is at target SoC while the charger is still drawing power. Check the charge limit or stop charging.",
    "advisor.exporting": "Exporting surplus",
    "advisor.grid": "Grid",
    "advisor.gridImportExportSimultaneous": "Import and export sensors report power at the same time. Check whether the split grid sensors are mapped correctly.",
    "advisor.gridImportFullBattery": "Grid import is high although the house battery is full. Check discharge limits, backup reserve, or battery mode.",
    "advisor.headlineExport": "PV surplus is available",
    "advisor.headlineImport": "Grid import is active",
    "advisor.headlineInfo": "Information available",
    "advisor.headlineNeutral": "Energy flow is balanced",
    "advisor.headlineSetup": "More sensors unlock better advice",
    "advisor.headlineWarning": "Energy setup needs attention",
    "advisor.highLoad": "Current load is high compared with PV production. Check large consumers if this is unexpected.",
    "advisor.importing": "Importing",
    "advisor.priorityCritical": "Critical",
    "advisor.priorityInfo": "Info",
    "advisor.priorityOpportunity": "Chance",
    "advisor.prioritySetup": "Setup",
    "advisor.prioritySuccess": "OK",
    "advisor.priorityWarning": "Warning",
    "advisor.electricityPrice": "Electricity price",
    "advisor.lowPv": "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors.",
    "advisor.noAdvice": "No urgent action right now.",
    "advisor.appliances": "Appliances",
    "advisor.largeConsumerCovered": "Large consumers are running without relevant grid import.",
    "advisor.largeConsumerGrid": "{names} currently draw power while grid import is active. Shift them to PV surplus if possible.",
    "advisor.largeConsumerSurplus": "PV surplus can cover {names}. Start a ready large consumer while export is active.",
    "advisor.panelTitle": "Energy Advisor",
    "advisor.pv": "PV",
    "advisor.recommendations": "Recommendations",
    "advisor.runAppliance": "Run a flexible household appliance now if it is waiting.",
    "advisor.sensorStaleMany": "{count} sensors have not updated recently. Check entity availability and recorder/update intervals.",
    "advisor.sensorStaleOne": "{name} has not updated for {duration}. Check entity availability and update interval.",
    "advisor.sensors": "Sensors",
    "advisor.selfConsumption": "Self-use",
    "advisor.selfSufficient": "Self-sufficient",
    "advisor.startEvCharging": "Start or increase EV charging while surplus is available.",
    "advisor.status": "Status",
    "advisor.suggestionCountOne": "{count} suggestion",
    "advisor.suggestionCount": "{count} suggestions",
    "advisor.surplus": "Surplus",
    "advisor.surplusGeneral": "PV surplus is available. Prioritize flexible loads while export is active.",
    "advisor.unknown": "Unknown",
    "advisor.useHeatPump": "Use heat pump boost or preheat hot water while PV surplus is available.",
    "advisor.wallbox": "EV",
    "advisor.weather": "Weather",
    "advisor.windowAnytime": "Anytime",
    "advisor.windowNext2h": "Next 2h",
    "advisor.windowNow": "Now",
    "advisor.reasonBattery": "Battery SoC {soc} is part of this recommendation.",
    "advisor.reasonEvSurplus": "PV surplus is above the configured EV threshold of {threshold}.",
    "advisor.reasonGridImport": "Grid import is above the configured import threshold of {threshold}.",
    "advisor.reasonLargeConsumer": "The available PV surplus can cover the configured consumer limit.",
    "advisor.reasonPhaseChange": "EVCC reports a planned phase change inside the next window.",
    "advisor.reasonSensor": "A configured entity is stale, unavailable, or inconsistent.",
    "advisor.reasonSurplus": "PV surplus is above the configured surplus threshold of {threshold}.",
    "advisor.reasonWeather": "Weather is included to separate low PV from expected conditions.",
    "advisor.reasonPrice": "The configured electricity price sensor is included in the decision context.",
    "advisor.impactAutarky": "That shows how independently the house is currently being supplied.",
    "advisor.impactBattery": "That value describes the current battery reserve and influences whether flexible loads are sensible right now.",
    "advisor.impactConsumer": "That value shows whether this consumer is active and how strongly it affects the energy balance.",
    "advisor.impactGrid": "That value decides whether the situation is treated as grid import, neutral, or PV surplus.",
    "advisor.impactLoad": "That value describes the current household load and helps classify whether consumption is unusually high.",
    "advisor.impactPv": "That value describes the current PV production and helps estimate how much energy is available.",
    "advisor.impactSelfConsumption": "That shows how much PV energy is being used locally instead of being exported.",
    "advisor.impactSensor": "That value is used as a diagnostic signal for sensor freshness and plausibility.",
    "advisor.impactSurplus": "That value shows how much power is currently available for flexible loads before it is exported.",
    "advisor.impactTemperature": "That value is used to detect possible battery stress or operating limits.",
    "advisor.impactWallbox": "That value describes the charger state and determines whether charging should start, stop, or wait.",
    "editor.showViewSelector": "Show view selector",
    "chart.close": "Close",
    "chart.empty": "No history data found",
    "chart.error": "History could not be loaded",
    "chart.loading": "Loading history…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Last {hours} hours",
    "charts.count": "{count} charts",
    "charts.countOne": "{count} chart",
    "charts.empty": "No chartable entities configured yet.",
    "charts.label": "Charts",
    "charts.openLarge": "Open large chart",
    "charts.sectionPvStrings": "PV strings",
    "charts.sectionInverters": "Inverters",
    "charts.sectionSystem": "Inverter and system",
    "charts.sectionWallbox": "Wallbox",
    "charts.title": "Entity history",
    "editor.customDayImage": "Custom Day Image",
    "editor.customImage": "Custom Image",
    "editor.batteryChargeEntity": "Battery charge entity",
    "editor.batteryCyclesTodayEntity": "Battery cycles today entity",
    "editor.batteryDischargeEntity": "Battery discharge entity",
    "editor.batteryFlowEntity": "Battery flow entity (+/-)",
    "editor.batteryMaxSocEntity": "Battery max SoC entity",
    "editor.batteryMinSocEntity": "Battery min SoC entity",
    "editor.batteryTemperatureEntity": "Battery temperature entity",
    "editor.entity": "Entity",
    "editor.entityPlaceholder": "{label} entity",
    "editor.energy1hEntity": "1h kWh entity",
    "editor.energy24hEntity": "24h kWh entity",
    "editor.energyCounterEntity": "Energy history counter",
    "editor.energyMonthEntity": "1 month kWh entity",
    "editor.energyRangeOverride": "Optional direct period sensors",
    "editor.energyYearEntity": "1 year kWh entity",
    "editor.energyTotalEntity": "Total kWh entity",
    "editor.liveEntity": "Live sensor",
    "editor.houseType": "House Type",
    "editor.hudBoxOpacity": "HUD box opacity",
    "editor.hudBoxScale": "HUD box scale",
    "editor.advisorEvSurplusThreshold": "EV surplus threshold (W)",
    "editor.electricityPriceEntity": "Electricity price sensor",
    "editor.gridVoltageCriticalThreshold": "Critical grid voltage (V)",
    "editor.gridVoltageWarningThreshold": "High grid voltage (V)",
    "editor.importExportEntity": "Import/export sensor",
    "editor.importExportSignedEntity": "Signed import/export sensor (+/-)",
    "editor.importPowerEntity": "Import sensor",
    "editor.exportPowerEntity": "Export sensor",
    "editor.importExportLabels": "Import/Export labels",
    "editor.importExportFinance": "Import/export costs",
    "editor.importEnergyCounterEntity": "Import energy counter",
    "editor.exportEnergyCounterEntity": "Export energy counter",
    "editor.helpImportExportFinance": "Use cumulative kWh counters. The card calculates today's amount from local midnight.",
    "editor.gridImportPrice": "Grid import price per kWh",
    "editor.gridExportPrice": "Feed-in tariff per kWh",
    "editor.currency": "Currency",
    "editor.showGridDailyFinance": "Show today's costs and revenue labels",
    "editor.importLabel": "Import label",
    "editor.exportLabel": "Export label",
    "editor.neutralLabel": "Self-sufficient label",
    "editor.environmentAdd": "Add tile",
    "editor.environmentEntity": "Sensor entity",
    "editor.environmentLabel": "Sensor label",
    "editor.environmentShow": "Show {label} tile",
    "editor.environmentShowFooter": "Show box in footer",
    "editor.environmentShowImage": "Show box in image",
    "editor.environmentTemplates": "Environment templates",
    "editor.environmentUnit": "Display unit",
    "editor.kpiAdd": "Add tile",
    "editor.kpiColor": "Color",
    "editor.kpiColumns": "Tile width",
    "editor.kpiEntity": "KPI sensor",
    "editor.kpiLabel": "KPI label",
    "editor.kpiPosition": "Footer order",
    "editor.kpiRemove": "Remove",
    "editor.kpiStaticValue": "Static value",
    "editor.consumerEnergyEntity": "Energy history counter",
    "editor.consumerLabel": "Device name",
    "editor.consumerAddCustom": "Add custom large consumer",
    "editor.consumerPowerEntity": "Power sensor",
    "editor.consumerShow": "Show {label} tile",
    "editor.labelHideDesktop": "Hide on desktop",
    "editor.labelHideMobile": "Hide on phones",
    "editor.labelOptions": "Label display",
    "editor.labelShowFooter": "Show label in footer KPIs",
    "editor.labelShowImage": "Show label in image",
    "editor.maxPowerKw": "Expected max power (kW/kWp)",
    "editor.optionalDayImage": "Optional daylight image",
    "editor.helpCustomImages": "Store custom images in Home Assistant under /config/www/ and enter them as /local/.... When weather_entity is set, matching suffixes are tried automatically, for example /local/solar/house_day_rainy.png before /local/solar/house_day.png.",
    "editor.powerDecimals": "Power decimals",
    "editor.powerDisplayMode": "Power display mode",
    "editor.rawMode": "Raw value + configured unit",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.advisorMaxSuggestions": "Advisor suggestions",
    "editor.overlayEnable": "Show {label}",
    "editor.overlayLabel": "Label",
    "editor.overlayOrientation": "Orientation",
    "editor.overlayOrientationLeft": "Left side",
    "editor.overlayOrientationRight": "Right side",
    "editor.overlayPeriod": "Period",
    "editor.overlaySize": "Size",
    "editor.period1h": "1 hour",
    "editor.period24h": "24 hours",
    "editor.period30m": "30 minutes",
    "editor.phaseActionEntity": "Upcoming phase action entity",
    "editor.phaseEntity": "Phase entity",
    "editor.phaseRemainingEntity": "Phase action remaining seconds entity",
    "editor.pvForecastTodayEntity": "Forecast today entity",
    "editor.pvLabels": "PV labels",
    "editor.pvPeakTodayEntity": "Peak today entity",
    "editor.pvPowerLabel": "Power label",
    "editor.pvRoofStringAdd": "Add string",
    "editor.pvRoofStringDisplay": "Roof PV string display",
    "editor.pvRoofStringDisplayDominant": "Highest string large, others small",
    "editor.pvRoofStringDisplaySum": "Sum strings",
    "editor.pvRoofStringDisplayValues": "Show string values",
    "editor.pvRoofStringEnergyEntity": "String kWh counter entity",
    "editor.pvRoofStringLabel": "String name",
    "editor.pvRoofStringPowerEntity": "String power entity",
    "editor.pvRoofStrings": "Roof PV strings",
    "editor.inverterAdd": "Add inverter",
    "editor.inverterDisplay": "Inverter display",
    "editor.inverterDisplayDominant": "Highest inverter large, others small",
    "editor.inverterDisplaySum": "Sum inverters",
    "editor.inverterDisplayValues": "Show inverter values",
    "editor.inverterEnergyEntity": "Inverter kWh counter entity",
    "editor.inverterLabel": "Inverter name",
    "editor.inverterPowerEntity": "Inverter power entity",
    "editor.inverters": "Inverters",
    "editor.pvTodayEnergyEntity": "Generated today entity",
    "editor.remainingChargeTimeEntity": "Remaining charge time entity",
    "editor.vehicleChargingEnabledEntity": "Charging enabled entity",
    "editor.vehicleConnectedEntity": "Vehicle connected entity",
    "editor.vehicleMaxSocEntity": "Vehicle max/target SoC entity",
    "editor.vehicleSocEntity": "Vehicle SoC entity",
    "editor.sectionBoxes": "Energy boxes",
    "editor.sectionAdvisor": "Advisor and prices",
    "editor.sectionAppearance": "Display and limits",
    "editor.sectionGeneral": "General settings",
    "editor.sectionKpis": "Custom KPI tiles",
    "editor.sectionEnvironmentSensors": "Environment sensors",
    "editor.sectionLargeConsumers": "Additional large consumers",
    "editor.sectionOverlays": "Image overlays",
    "editor.sectionDashboardAreas": "Dashboard areas",
    "editor.showBox": "Show {label}",
    "editor.showAdvisor": "Show Advisor Dashboard",
    "editor.showCharts": "Show Charts Dashboard",
    "editor.showElectricVehicle": "Show E-Auto area",
    "editor.showEnergyRangeSelector": "Show Live/1h/24h/month/year/total selector",
    "editor.showHouseSelector": "Show house selector",
    "editor.showEnvironmentSensors": "Show environment sensor tiles",
    "editor.showLargeConsumers": "Show large consumers in house view",
    "editor.showRecords": "Show Records Dashboard",
    "editor.showGridStatusTile": "Show grid status tile",
    "editor.showMetricTiles": "Show metric boxes below image",
    "editor.showPowerFlows": "Show animated power flows",
    "editor.showStatusLabel": "Show image status label",
    "editor.showTitle": "Show title",
    "editor.showWeatherStatus": "Show current weather in status label",
    "editor.title": "Title",
    "editor.tabSetup": "Setup",
    "editor.tabEnergy": "Energy",
    "editor.tabDevices": "Devices",
    "editor.tabEnvironment": "Environment",
    "editor.tabFloorplan": "Floorplan",
    "editor.tabLayout": "Layout",
    "editor.tabAppearance": "Appearance",
    "editor.tabAdvisor": "Advisor",
    "editor.tabAdvanced": "Advanced",
    "editor.tabs": "Configuration sections",
    "editor.statusConfigured": "{configured}/{total} configured",
    "editor.statusConfiguredCount": "{count} configured",
    "editor.statusHidden": "{count} hidden",
    "editor.statusMissing": "{count} missing",
    "editor.statusAdvanced": "Advanced active",
    "editor.statusReady": "Ready",
    "editor.layoutMode": "Layout mode",
    "editor.layoutHelp": "Click a box in the preview, then adjust its X/Y position.",
    "editor.layoutSelected": "Selected box",
    "editor.layoutEmpty": "Enable image boxes or overlays to edit their positions here.",
    "editor.layoutTypeBox": "Box",
    "editor.layoutTypeOverlay": "Overlay",
    "editor.layoutTypeEnvironment": "Environment",
    "editor.sectionFloorplan": "Floorplan editor",
    "editor.floorplanHelp": "Choose a tool, click the grid to place it, then refine the selected element.",
    "editor.showFloorplan": "Show floorplan",
    "editor.floorplanShowGrid": "Show grid",
    "editor.floorplanTools": "Floorplan tools",
    "editor.floorplanToolRoom": "Room",
    "editor.floorplanToolWall": "Wall",
    "editor.floorplanToolSensor": "Sensor",
    "editor.floorplanSelected": "Selected element",
    "editor.floorplanLabel": "Label",
    "editor.floorplanWidth": "Width",
    "editor.floorplanHeight": "Height",
    "editor.floorplanDelete": "Delete selected",
    "editor.floorplanMode": "Floorplan type",
    "editor.floorplanModeEditor": "Floorplan editor",
    "editor.floorplanModeImage": "Image",
    "editor.floorplanFloors": "Levels",
    "editor.floorplanAddFloor": "+ Add level",
    "editor.floorplanFloorLabel": "Level name",
    "editor.floorplanImagePath": "Image path",
    "editor.floorplanCustomEntity": "Use own entity",
    "editor.floorplanSensorType": "Sensor type",
    "editor.floorplanSensorSource": "Use environment sensor",
    "editor.floorplanEntity": "Entity",
    "editor.floorplanShowSensorLabel": "Show label",
    "editor.floorplanFontSize": "Font size",
    "editor.floorplanEmpty": "Click the grid to create the selected element.",
    "editor.floorplanImagePathHelp": "Example: copy level-1.png to /config/www/floorplan/level-1.png and enter /local/floorplan/level-1.png here. You can also use a complete https:// image URL.",
    "editor.helpFloorplanImagePath": "Store the image in Home Assistant under /config/www/ and enter it as /local/..., for example /local/floorplan/level-1.png. Full https:// URLs are also supported.",
    "editor.helpFloorplanSensorSource": "Optional: reuse a sensor from the Environment tab. Leave this on own entity to choose a Home Assistant entity directly below.",
    "editor.helpHomeAssistantSensor": "Choose the Home Assistant entity that provides this value.",
    "editor.helpUnitAuto": "Use Auto to display the unit reported by the Home Assistant entity. Choose another value only when you want to override it.",
    "editor.helpEnergyCounter": "Optional cumulative energy counter used for 1h, 24h, month, year, and total views.",
    "editor.helpSignedGrid": "Use one sensor where positive values mean grid import and negative values mean export. Leave it empty when using separate import and export sensors.",
    "editor.helpSignedBattery": "Use one signed sensor when possible: positive means charging, negative means discharging.",
    "editor.helpFooterOrder": "Controls the order of tiles below the image. Lower numbers appear earlier.",
    "editor.helpTileWidth": "Controls how wide the footer tile is on desktop. Mobile width is capped automatically.",
    "editor.helpImagePosition": "Position of the box on the selected image in percent.",
    "editor.helpEnvironmentFooter": "Shows this sensor as a tile in the Environment section below the image.",
    "editor.helpEnvironmentImage": "Shows this sensor as a scalable HUD box on the house image.",
    "editor.helpMaxPower": "Used only for the utilization bar and Advisor load checks.",
    "editor.unit": "Display unit",
    "editor.voltageEntity": "Voltage sensor",
    "editor.voltageEntityL1": "Voltage L1 sensor",
    "editor.voltageEntityL2": "Voltage L2 sensor",
    "editor.voltageEntityL3": "Voltage L3 sensor",
    "editor.viewMode": "Default view",
    "editor.weatherEntity": "Weather Entity",
    "editor.setupWizard": "Setup wizard",
    "editor.setupIntro": "Helps with the first setup by suggesting sensors for PV, battery, inverter, EV charger, grid, consumption, weather, and kWh counters.",
    "editor.setupHelp": "Review the suggestions before applying them. Use \"Fill empty fields\" for a safe first pass or \"Replace detected fields\" when you want to overwrite existing detected assignments.",
    "editor.setupEntityCount": "{count} entities available",
    "editor.setupNoEntities": "Open this editor in Home Assistant so entities can be detected.",
    "editor.setupFillEmpty": "Fill empty fields",
    "editor.setupReplaceAll": "Replace detected fields",
    "editor.setupSuggestions": "Detected suggestions",
    "editor.setupNoSuggestions": "No strong entity matches found yet.",
    "editor.setupApplyOne": "Use",
    "editor.setupCurrent": "Current",
    "editor.setupSuggested": "Suggested",
    "editor.setupConfidence": "{score}% match",
    "editor.setupApplied": "Applied {count} suggestion(s).",
    "editor.setupApplyNone": "No empty fields were changed.",
    "editor.xPosition": "X Position",
    "editor.yPosition": "Y Position",
    "flow.charge": "Incoming",
    "flow.discharge": "Outgoing",
    "consumer.custom": "Custom",
    "consumer.customLarge": "Custom large consumer",
    "consumer.dhw_heatpump": "Domestic hot water heat pump",
    "consumer.dishwasher": "Dishwasher",
    "consumer.dryer": "Dryer",
    "consumer.sectionTitle": "Additional Large Consumers",
    "consumer.space_heater": "Fan heater",
    "consumer.washing_machine": "Washing machine",
    "environment.sectionTitle": "Environment",
    "environment.sensor": "Environment {index}",
    "environment.templateIndoor": "Indoor temperature",
    "environment.templateOutdoor": "Outdoor temperature",
    "environment.templateHotWater": "Hot water",
    "environment.templateHumidity": "Humidity",
    "environment.templatePressure": "Pressure",
    "environment.templateAirQuality": "Air quality",
    "environment.templateCustom": "Custom",
    "floorplan.counts": "{rooms} rooms · {sensors} sensors",
    "floorplan.empty": "Create rooms, walls, and sensors in the card editor.",
    "floorplan.imageEmpty": "Enter an image path for this level.",
    "floorplan.label": "Floorplan",
    "floorplan.level": "Level {index}",
    "floorplan.room": "Room {index}",
    "floorplan.sensor": "Sensor {index}",
    "floorplan.title": "Home floorplan",
    "floorplan.wall": "Wall {index}",
    "house.apartment_building": "Apartment Building",
    "house.apartment_building_balcony_solar": "Apartment Building Balcony Solar",
    "house.bungalow": "Bungalow",
    "house.city_villa": "City Villa",
    "house.city_villa_pitched_roof": "City Villa with Pitched Roof",
    "house.duplex_house": "Duplex House",
    "house.single_family_home": "Single Family Home",
    "house.terraced_middle_house": "Terraced Middle House",
    "metrics.battery_level": "Battery",
    "metrics.grid_status": "Grid",
    "metrics.house_consumption_power": "Consumption",
    "metrics.import_export_power": "Import/Export",
    "metrics.inverter_power": "Inverter",
    "metrics.pv_power": "PV Power",
    "metrics.pv_roof_power": "Roof PV",
    "metrics.pv_shed_power": "Shed PV",
    "metrics.pv_total_power": "PV Total",
    "metrics.water_meter": "Water",
    "metrics.wallbox_power": "EV Charger",
    "metrics.wallbox2_power": "EV Charger 2",
    "overlay.heatpump": "Heat pump",
    "overlay.smoke": "Gas",
    "phase.auto": "Auto",
    "phase.many": "{count} phases",
    "phase.one": "1 phase",
    "pvLabel.forecastToday": "Forecast today",
    "pvLabel.peakToday": "Peak today",
    "pvLabel.power": "Power",
    "pvLabel.todayEnergy": "Generated today",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Live",
    "range.month": "1 month",
    "range.total": "Total",
    "range.year": "1 year",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Last updated: {time}",
    "status.selfSufficient": "Self-sufficient",
    "status.weather": "Weather: {weather}",
    "tooltip.entity": "Entity",
    "tooltip.flow": "Flow",
    "tooltip.load": "Utilization",
    "tooltip.max": "Maximum",
    "tooltip.phases": "Phases",
    "tooltip.phaseChange": "Upcoming phase change",
    "tooltip.raw": "Raw value",
    "tooltip.remainingChargeTime": "Remaining charge time",
    "tooltip.status": "Status",
    "tooltip.temperature": "Temperature",
    "tooltip.updated": "Updated",
    "tooltip.value": "Value",
    "tooltip.vehicleSoc": "Vehicle SoC",
    "tooltip.voltage": "Voltage",
    "value.remainingChargeTime": "{value} left",
    "value.phaseChangeIn": "{action} in {duration}",
    "value.temperature": "Temp {value}",
    "value.soon": "soon",
    "view.advisor": "Advisor Dashboard",
    "view.house": "House View",
    "view.floorplan": "Floorplan",
    "view.charts": "Charts",
    "weather.clear": "Clear",
    "weather.clear-night": "Clear",
    "weather.cloudy": "Cloudy",
    "weather.fog": "Fog",
    "weather.hail": "Hail",
    "weather.lightning": "Thunderstorm",
    "weather.lightning-rainy": "Thunderstorm rain",
    "weather.partlycloudy": "Partly cloudy",
    "weather.pouring": "Pouring",
    "weather.rainy": "Rainy",
    "weather.snowy": "Snowy",
    "weather.snowy-rainy": "Sleet",
    "weather.sunny": "Sunny",
    "weather.windy": "Windy",
    "weather.windy-variant": "Windy/cloudy",
    "warning.batteryLow": "Battery low",
    "warning.gridVoltageCritical": "Grid voltage much too high",
    "warning.gridVoltageHigh": "High grid voltage",
    "warning.sensorMissing": "Entity not found",
    "warning.sensorOffline": "Sensor offline",
    "warning.sensorUnavailable": "Sensor unavailable",
    "gridFinance.importCost": "Today cost",
    "gridFinance.exportRevenue": "Today revenue",
    "view.records": "Records",
    "records.count": "{count} records",
    "records.countOne": "{count} record",
    "records.days": "{days} days",
    "records.empty": "No recordable history found yet.",
    "records.error": "Records could not be loaded.",
    "records.label": "High scores",
    "records.loadingCount": "{count} entities",
    "records.loadingCountOne": "{count} entity",
    "records.loadingPurposeConsumerPower": "Consumption peak",
    "records.loadingPurposeCounter": "Daily meter increase",
    "records.loadingPurposeGridFinance": "Grid costs and revenue",
    "records.loadingPurposePower": "Power peak",
    "records.loadingPurposePvEnergy": "Daily PV yield",
    "records.loadingPurposePvPower": "PV power and solar hours",
    "records.loadingPurposeWallboxChargingEnabled": "Wallbox charging enabled time",
    "records.loadingPurposeWallboxEnergy": "Wallbox charged energy",
    "records.loadingPurposeWallboxMaxSocLimit": "Wallbox charge limit",
    "records.loadingPurposeWallboxPhase": "Wallbox phase history",
    "records.loadingPurposeWallboxPluggedIn": "Wallbox plugged-in time",
    "records.loadingPurposeWallboxPower": "Wallbox charging power",
    "records.loadingPurposeWallboxSoc": "Wallbox vehicle SoC",
    "records.loadingTitle": "Querying history",
    "records.loading": "Loading records…",
    "records.sectionPeaks": "Power peaks",
    "records.sectionPvEnergy": "Best PV yield per string",
    "records.sectionSolarHours": "Longest solar hours",
    "records.sectionWallbox": "Wallbox records",
    "records.sectionFinance": "Costs and revenue",
    "records.subtitle": "Best values for {range} from Home Assistant history.",
    "records.title": "Energy records",
    "records.range7d": "7 days",
    "records.range14d": "14 days",
    "records.range30d": "30 days",
    "records.rangeMonth": "This month",
    "records.rangeYear": "This year",
    "records.range356d": "356 days",
    "records.consumerPeakPower": "{name}: highest consumption peak",
    "records.counterLargestIncrease": "{name}: largest daily meter increase",
    "records.gridImport": "Grid import",
    "records.gridExport": "Grid export",
    "records.gridHighestCost": "{name}: highest import cost",
    "records.gridBestRevenue": "{name}: highest feed-in revenue",
    "records.powerPeak": "{name}: highest power peak",
    "records.pvBestYield": "{name}: best daily PV yield",
    "records.pvPeakPower": "{name}: highest PV power",
    "records.solarLongestHours": "{name}: longest solar production time",
    "records.wallboxChargedEnergy": "{name}: most charged energy",
    "records.wallboxChargingEnabled": "{name}: longest charging enabled time",
    "records.wallboxLongestCharge": "{name}: longest charging day",
    "records.wallboxMaxSoc": "{name}: highest vehicle SoC",
    "records.wallboxMaxSocLimit": "{name}: highest charge limit",
    "records.wallboxOnePhase": "{name}: longest 1-phase time",
    "records.wallboxPeakPower": "{name}: highest charging power",
    "records.wallboxPluggedIn": "{name}: longest plugged-in time",
    "records.wallboxThreePhase": "{name}: longest 3-phase time",
    "records.sectionCounters": "Meter records",
    "ev.groupControls": "Controls",
    "ev.modeControl": "Charge mode",
    "ev.modeOff": "Off",
    "ev.modePv": "PV",
    "ev.modeMinPv": "Min+PV",
    "ev.modeFast": "Fast",
    "view.garden": "Garden",
    "editor.tabGarden": "Garden",
    "editor.showGarden": "Show garden area",
    "editor.gardenSettings": "Garden settings",
    "editor.gardenTitle": "Title",
    "editor.gardenImage": "Garden image",
    "editor.gardenEntity": "Garden entity",
    "garden.title": "Garden",
    "garden.subtitle": "Garden water, weather, mower and garden devices",
    "garden.ready": "Ready",
    "garden.empty": "No garden entities configured.",
    "garden.on": "On",
    "garden.off": "Off",
    "garden.groupMower": "Mower",
    "garden.groupWater": "Garden water",
    "garden.groupWeather": "Weather & soil",
    "garden.groupEquipment": "Garden devices",
    "garden.mowerStatus": "Mower",
    "garden.mowerBattery": "Mower battery",
    "garden.mowerNextStart": "Next mowing start",
    "garden.mowerError": "Mower error",
    "garden.gardenWater": "Garden water",
    "garden.irrigationEnabled": "Irrigation active",
    "garden.irrigationNextStart": "Next irrigation",
    "garden.irrigationRemaining": "Remaining runtime",
    "garden.waterFlow": "Water flow",
    "garden.waterConsumptionToday": "Water today",
    "garden.waterPressure": "Water pressure",
    "garden.cisternLevel": "Cistern",
    "garden.rain24h": "Rain 24h",
    "garden.rainToday": "Rain today",
    "garden.outdoorTemperature": "Outdoor",
    "garden.humidity": "Humidity",
    "garden.soilMoisture": "Soil moisture",
    "garden.soilTemperature": "Soil temperature",
    "garden.gardenLights": "Garden lights",
    "garden.gardenOutlet": "Garden outlet",
    "garden.pondPump": "Pond pump",
    "garden.poolPump": "Pool pump"
  },
  "de": {
    "aria.energyRangeSelector": "Wertebereich auswählen",
    "aria.houseSelector": "Haus auswählen",
    "aria.viewSelector": "Dashboard-Ansicht auswählen",
    "card.defaultTitle": "Energiefluss",
    "advisor.action": "Aktion",
    "advisor.autarky": "Autarkie",
    "advisor.actionHiddenToday": "Heute ausgeblendet",
    "advisor.batteryIdle": "Die Batterie lädt nicht, obwohl Überschuss eingespeist wird. Prüfe Batterielimits oder den Lademodus.",
    "advisor.batteryHighSocLong": "Die Hausbatterie ist seit über 120 Minuten zwischen 90 und 100%. Batterien sollten nicht zu lange so voll bleiben.",
    "advisor.batteryCyclesHigh": "Die Hausbatterie hat heute mehrere Vollzyklen abgeschlossen. Häufige Zyklen können die Batterie schneller altern lassen.",
    "advisor.batteryDeepSoc": "Der SoC der Hausbatterie ist sehr niedrig. Schütze die Reserve und vermeide zusätzliche flexible Verbraucher.",
    "advisor.batteryLow": "Der Batteriestand ist niedrig. Behalte die Reserve im Blick und vermeide flexible Verbraucher, wenn möglich.",
    "advisor.batteryMaxReached": "Die Batterie ist am konfigurierten Max-SoC. Zusätzlicher PV-Ertrag wird wahrscheinlich eingespeist.",
    "advisor.batteryNearlyFull": "Die Batterie ist fast voll, zusätzlicher PV-Ertrag wird wahrscheinlich eingespeist.",
    "advisor.batteryReserveDischarging": "Die Batterie ist auf oder unter Reserve-SoC und entlädt weiter. Prüfe Min-SoC oder Backup-Reserve.",
    "advisor.batteryStatus": "Batterie",
    "advisor.batteryTemperatureHigh": "Die Temperatur der Hausbatterie ist hoch. Prüfe Kühlung, Belüftung oder Wechselrichter-/Batterielimits.",
    "advisor.batteryTemperatureLow": "Die Temperatur der Hausbatterie ist niedrig. Die Ladeleistung kann begrenzt sein und die Batterie stärker belasten.",
    "advisor.checkSensors": "Prüfe nicht verfügbare oder fehlende Sensoren, damit die Energiebilanz zuverlässig bleibt.",
    "advisor.configureConsumption": "Füge einen Hausverbrauchs-Sensor hinzu, um Autarkie und Lastanalyse zu verbessern.",
    "advisor.configureGrid": "Füge Import-/Export-Sensoren hinzu, damit Überschuss und Netzbezug besser bewertet werden können.",
    "advisor.configurePvTotal": "Füge PV-Gesamtleistung oder Dach-/Schuppen-PV-Sensoren hinzu, um die Erzeugungsanalyse zu verbessern.",
    "advisor.consumption": "Last",
    "advisor.detailEntities": "Entitäten",
    "advisor.detailEntityValue": "{entity} meldet für {label} aktuell {value}. {impact}",
    "advisor.detailIntro": "Der Advisor zeigt diesen Hinweis mit Priorität {priority} im Zeitfenster {window}, weil {reason}",
    "advisor.detailSignals": "Entscheidungssignale",
    "advisor.detailSources": "Datenquellen",
    "advisor.detailValues": "Werte",
    "advisor.detailValueOnly": "{label} liegt aktuell bei {value}. {impact}",
    "advisor.detailWhy": "Warum dieser Hinweis erscheint",
    "advisor.detailsToggle": "Details anzeigen",
    "advisor.dismissToday": "Heute ausblenden",
    "advisor.evChargingGrid": "Die Wallbox lädt, während Netzbezug aktiv ist. Reduziere die Ladeleistung oder warte auf mehr PV, falls das nicht gewollt ist.",
    "advisor.evChargingPv": "Die Wallbox wird aktuell gut durch PV oder gespeicherte Energie gedeckt.",
    "advisor.evEnableCharging": "Das Laden ist aktuell deaktiviert. Aktiviere das Laden, wenn du den PV-Überschuss nutzen möchtest.",
    "advisor.evPlugIn": "Stecke das Auto ein, um den PV-Überschuss zum Laden zu nutzen.",
    "advisor.evPhaseChangeScheduled": "{action} in {duration}, wenn sich an der PV-Situation nichts ändert.",
    "advisor.evSocAbove80Long": "Das Auto ist seit über 120 Minuten über 80% SoC. Das kann der Batterie schaden, wenn es länger so bleibt.",
    "advisor.evSocAbove90Long": "Das Auto ist seit über 60 Minuten über 90% SoC. Stoppe das Laden oder senke das Ziel-SoC, wenn es länger steht.",
    "advisor.evTargetReached": "Das Auto ist bereits am konfigurierten Ziel-SoC. Nutze den Überschuss für einen anderen flexiblen Verbraucher.",
    "advisor.evTargetReachedGrid": "Das Auto ist am Ziel-SoC, während die Wallbox weiter Leistung zieht. Prüfe das Ladelimit oder stoppe das Laden.",
    "advisor.exporting": "Einspeisung",
    "advisor.grid": "Netz",
    "advisor.gridImportExportSimultaneous": "Import- und Export-Sensor melden gleichzeitig Leistung. Prüfe, ob die getrennten Netzsensoren korrekt zugeordnet sind.",
    "advisor.gridImportFullBattery": "Der Netzbezug ist hoch, obwohl die Hausbatterie voll ist. Prüfe Entladelimit, Backup-Reserve oder Batteriemodus.",
    "advisor.headlineExport": "PV-Überschuss ist verfügbar",
    "advisor.headlineImport": "Netzbezug ist aktiv",
    "advisor.headlineInfo": "Informationen verfügbar",
    "advisor.headlineNeutral": "Der Energiefluss ist ausgeglichen",
    "advisor.headlineSetup": "Mehr Sensoren schalten bessere Hinweise frei",
    "advisor.headlineWarning": "Die Energiekonfiguration braucht Aufmerksamkeit",
    "advisor.highLoad": "Die aktuelle Last ist im Vergleich zur PV-Erzeugung hoch. Prüfe große Verbraucher, falls das unerwartet ist.",
    "advisor.importing": "Netzbezug",
    "advisor.priorityCritical": "Kritisch",
    "advisor.priorityInfo": "Info",
    "advisor.priorityOpportunity": "Chance",
    "advisor.prioritySetup": "Setup",
    "advisor.prioritySuccess": "OK",
    "advisor.priorityWarning": "Warnung",
    "advisor.electricityPrice": "Strompreis",
    "advisor.lowPv": "Die PV-Produktion ist trotz Tageslicht niedrig. Wenn das Wetter klar ist, prüfe Wechselrichter oder PV-Sensoren.",
    "advisor.noAdvice": "Aktuell besteht kein dringender Handlungsbedarf.",
    "advisor.appliances": "Haushalt",
    "advisor.largeConsumerCovered": "Große Verbraucher laufen gerade ohne relevanten Netzbezug.",
    "advisor.largeConsumerGrid": "{names} ziehen gerade Leistung, während Netzbezug aktiv ist. Verschiebe sie nach Möglichkeit in PV-Überschusszeiten.",
    "advisor.largeConsumerSurplus": "Der PV-Überschuss kann {names} decken. Starte einen passenden großen Verbraucher, wenn er bereit ist.",
    "advisor.panelTitle": "Energy Advisor",
    "advisor.pv": "PV",
    "advisor.recommendations": "Empfehlungen",
    "advisor.runAppliance": "Starte jetzt einen wartenden flexiblen Haushaltsverbraucher.",
    "advisor.sensorStaleMany": "{count} Sensoren wurden länger nicht aktualisiert. Prüfe Verfügbarkeit und Aktualisierungsintervalle.",
    "advisor.sensorStaleOne": "{name} wurde seit {duration} nicht aktualisiert. Prüfe Verfügbarkeit und Aktualisierungsintervall.",
    "advisor.sensors": "Sensoren",
    "advisor.selfConsumption": "Eigenverbrauch",
    "advisor.selfSufficient": "Autark",
    "advisor.startEvCharging": "Starte oder erhöhe die Wallbox-Ladung, solange Überschuss verfügbar ist.",
    "advisor.status": "Status",
    "advisor.suggestionCountOne": "{count} Hinweis",
    "advisor.suggestionCount": "{count} Hinweise",
    "advisor.surplus": "Überschuss",
    "advisor.surplusGeneral": "PV-Überschuss ist verfügbar. Priorisiere flexible Verbraucher, solange eingespeist wird.",
    "advisor.unknown": "Unbekannt",
    "advisor.useHeatPump": "Nutze Wärmepumpen-Boost oder Warmwasser-Vorheizen, solange PV-Überschuss verfügbar ist.",
    "advisor.wallbox": "Wallbox",
    "advisor.weather": "Wetter",
    "advisor.windowAnytime": "Jederzeit",
    "advisor.windowNext2h": "Nächste 2h",
    "advisor.windowNow": "Jetzt",
    "advisor.reasonBattery": "Der Batterie-SoC {soc} fließt in diese Empfehlung ein.",
    "advisor.reasonEvSurplus": "Der PV-Überschuss liegt über der konfigurierten Wallbox-Schwelle von {threshold}.",
    "advisor.reasonGridImport": "Der Netzbezug liegt über der konfigurierten Bezugsschwelle von {threshold}.",
    "advisor.reasonLargeConsumer": "Der verfügbare PV-Überschuss deckt das konfigurierte Verbraucherlimit.",
    "advisor.reasonPhaseChange": "EVCC meldet eine geplante Phasenänderung im nächsten Zeitfenster.",
    "advisor.reasonSensor": "Eine konfigurierte Entität ist veraltet, nicht verfügbar oder widersprüchlich.",
    "advisor.reasonSurplus": "Der PV-Überschuss liegt über der konfigurierten Überschussschwelle von {threshold}.",
    "advisor.reasonWeather": "Das Wetter wird berücksichtigt, um niedrige PV-Leistung einzuordnen.",
    "advisor.reasonPrice": "Der konfigurierte Strompreis-Sensor fließt als Entscheidungskontext ein.",
    "advisor.impactAutarky": "Damit erkennt der Advisor, wie unabhängig das Haus gerade versorgt wird.",
    "advisor.impactBattery": "Dieser Wert beschreibt die aktuelle Batteriereserve und beeinflusst, ob flexible Verbraucher gerade sinnvoll sind.",
    "advisor.impactConsumer": "Dieser Wert zeigt, ob dieser Verbraucher aktiv ist und wie stark er die Energiebilanz beeinflusst.",
    "advisor.impactGrid": "Dieser Wert entscheidet, ob die Situation als Netzbezug, neutral oder PV-Überschuss bewertet wird.",
    "advisor.impactLoad": "Dieser Wert beschreibt die aktuelle Hauslast und hilft einzuschätzen, ob der Verbrauch auffällig hoch ist.",
    "advisor.impactPv": "Dieser Wert beschreibt die aktuelle PV-Erzeugung und hilft einzuschätzen, wie viel Energie verfügbar ist.",
    "advisor.impactSelfConsumption": "Damit erkennt der Advisor, wie viel PV-Energie direkt im Haus genutzt statt eingespeist wird.",
    "advisor.impactSensor": "Dieser Wert dient als Diagnosesignal für Aktualität und Plausibilität der Sensoren.",
    "advisor.impactSurplus": "Dieser Wert zeigt, wie viel Leistung gerade für flexible Verbraucher verfügbar ist, bevor sie eingespeist wird.",
    "advisor.impactTemperature": "Dieser Wert hilft, mögliche Batteriestress- oder Betriebsgrenzen zu erkennen.",
    "advisor.impactWallbox": "Dieser Wert beschreibt den Zustand der Wallbox und beeinflusst, ob Laden starten, stoppen oder warten sollte.",
    "editor.showViewSelector": "Ansichtsauswahl anzeigen",
    "chart.close": "Schließen",
    "chart.empty": "Keine Verlaufsdaten gefunden",
    "chart.error": "Verlauf konnte nicht geladen werden",
    "chart.loading": "Verlauf wird geladen…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Letzte {hours} Stunden",
    "charts.count": "{count} Charts",
    "charts.countOne": "{count} Chart",
    "charts.empty": "Noch keine Entitäten mit Verlauf konfiguriert.",
    "charts.label": "Charts",
    "charts.openLarge": "Großen Chart öffnen",
    "charts.sectionPvStrings": "PV-Strings",
    "charts.sectionInverters": "Wechselrichter",
    "charts.sectionSystem": "Wechselrichter und System",
    "charts.sectionWallbox": "Wallbox",
    "charts.title": "Entitätsverlauf",
    "editor.customDayImage": "Eigenes Tagbild",
    "editor.customImage": "Eigenes Bild",
    "editor.batteryChargeEntity": "Batterie-Lade-Entität",
    "editor.batteryCyclesTodayEntity": "Batterie-Zyklen-heute-Entität",
    "editor.batteryDischargeEntity": "Batterie-Entlade-Entität",
    "editor.batteryFlowEntity": "Batteriefluss-Entität (+/-)",
    "editor.batteryMaxSocEntity": "Batterie-Max-SoC-Entität",
    "editor.batteryMinSocEntity": "Batterie-Min-SoC-Entität",
    "editor.batteryTemperatureEntity": "Batterie-Temperatur-Entität",
    "editor.entity": "Entität",
    "editor.entityPlaceholder": "{label} Entität",
    "editor.energy1hEntity": "1h-kWh-Entität",
    "editor.energy24hEntity": "24h-kWh-Entität",
    "editor.energyCounterEntity": "kWh-Verlaufszähler",
    "editor.energyMonthEntity": "1 Monat-kWh-Entität",
    "editor.energyRangeOverride": "Optionale direkte Zeitraum-Sensoren",
    "editor.energyYearEntity": "1 Jahr-kWh-Entität",
    "editor.energyTotalEntity": "Gesamt-kWh-Entität",
    "editor.liveEntity": "Live-Sensor",
    "editor.houseType": "Haustyp",
    "editor.hudBoxOpacity": "HUD-Box-Deckkraft",
    "editor.hudBoxScale": "HUD-Box-Skalierung",
    "editor.advisorEvSurplusThreshold": "Wallbox-Überschussschwelle (W)",
    "editor.electricityPriceEntity": "Strompreis-Sensor",
    "editor.gridVoltageCriticalThreshold": "Kritische Netzspannung (V)",
    "editor.gridVoltageWarningThreshold": "Hohe Netzspannung (V)",
    "editor.importExportEntity": "Bezugs-/Einspeise-Sensor",
    "editor.importExportSignedEntity": "Vorzeichen-Sensor für Bezug/Einspeisung (+/-)",
    "editor.importPowerEntity": "Bezugs-Sensor",
    "editor.exportPowerEntity": "Einspeise-Sensor",
    "editor.importExportLabels": "Import-/Export-Labels",
    "editor.importExportFinance": "Bezugs-/Einspeisekosten",
    "editor.importEnergyCounterEntity": "Bezugs-Energiezähler",
    "editor.exportEnergyCounterEntity": "Einspeise-Energiezähler",
    "editor.helpImportExportFinance": "Kumulative kWh-Zähler verwenden. Die Karte berechnet den heutigen Wert ab lokalem Tagesbeginn.",
    "editor.gridImportPrice": "Bezugskosten pro kWh",
    "editor.gridExportPrice": "Einspeisevergütung pro kWh",
    "editor.currency": "Währung",
    "editor.showGridDailyFinance": "Heutige Kosten und Einnahmen als Labels anzeigen",
    "editor.importLabel": "Bezugs-Label",
    "editor.exportLabel": "Einspeise-Label",
    "editor.neutralLabel": "Autark-Label",
    "editor.environmentAdd": "Kachel hinzufügen",
    "editor.environmentEntity": "Sensor-Entität",
    "editor.environmentLabel": "Sensor-Label",
    "editor.environmentShow": "{label}-Kachel anzeigen",
    "editor.environmentShowFooter": "Box im Footer anzeigen",
    "editor.environmentShowImage": "Box im Bild anzeigen",
    "editor.environmentTemplates": "Umgebungs-Vorlagen",
    "editor.environmentUnit": "Anzeigeeinheit",
    "editor.kpiAdd": "Kachel hinzufügen",
    "editor.kpiColor": "Farbe",
    "editor.kpiColumns": "Kachelbreite",
    "editor.kpiEntity": "KPI-Sensor",
    "editor.kpiLabel": "KPI-Label",
    "editor.kpiPosition": "Reihenfolge im Footer",
    "editor.kpiRemove": "Entfernen",
    "editor.kpiStaticValue": "Fester Wert",
    "editor.consumerEnergyEntity": "kWh-Verlaufszähler",
    "editor.consumerLabel": "Gerätename",
    "editor.consumerAddCustom": "Eigenen großen Verbraucher hinzufügen",
    "editor.consumerPowerEntity": "Leistungs-Sensor",
    "editor.consumerShow": "{label}-Kachel anzeigen",
    "editor.labelHideDesktop": "Auf PC ausblenden",
    "editor.labelHideMobile": "Auf Handys ausblenden",
    "editor.labelOptions": "Label-Anzeige",
    "editor.labelShowFooter": "Label in den KPIs im Footer anzeigen",
    "editor.labelShowImage": "Label im Bild anzeigen",
    "editor.maxPowerKw": "Erwartete Maximalleistung (kW/kWp)",
    "editor.optionalDayImage": "Optionales Tagesbild",
    "editor.helpCustomImages": "Lege eigene Bilder in Home Assistant unter /config/www/ ab und trage sie als /local/... ein. Wenn weather_entity gesetzt ist, werden passende Suffixe automatisch versucht, zum Beispiel /local/solar/house_day_rainy.png vor /local/solar/house_day.png.",
    "editor.powerDecimals": "Leistungs-Nachkommastellen",
    "editor.powerDisplayMode": "Leistungsanzeige",
    "editor.rawMode": "Rohwert + konfigurierte Einheit",
    "editor.auto": "Auto",
    "editor.autoWKw": "Automatisch W/kW",
    "editor.advisorMaxSuggestions": "Advisor-Hinweise",
    "editor.overlayEnable": "{label} anzeigen",
    "editor.overlayLabel": "Label",
    "editor.overlayOrientation": "Ausrichtung",
    "editor.overlayOrientationLeft": "Links am Haus",
    "editor.overlayOrientationRight": "Rechts am Haus",
    "editor.overlayPeriod": "Zeitraum",
    "editor.overlaySize": "Größe",
    "editor.period1h": "1 Stunde",
    "editor.period24h": "24 Stunden",
    "editor.period30m": "30 Minuten",
    "editor.phaseActionEntity": "Entität für bevorstehende Phasen-Aktion",
    "editor.phaseEntity": "Phasen-Entität",
    "editor.phaseRemainingEntity": "Entität für verbleibende Sekunden bis Phasen-Aktion",
    "editor.pvForecastTodayEntity": "Prognose-heute-Entität",
    "editor.pvLabels": "PV-Labels",
    "editor.pvPeakTodayEntity": "Peak-heute-Entität",
    "editor.pvPowerLabel": "Leistungs-Label",
    "editor.pvRoofStringAdd": "String hinzufügen",
    "editor.pvRoofStringDisplay": "Anzeige PV-Dach-Strings",
    "editor.pvRoofStringDisplayDominant": "Stärksten String groß, andere klein",
    "editor.pvRoofStringDisplaySum": "Strings aufaddiert",
    "editor.pvRoofStringDisplayValues": "String-Werte anzeigen",
    "editor.pvRoofStringEnergyEntity": "String-kWh-Zähler-Entität",
    "editor.pvRoofStringLabel": "String-Name",
    "editor.pvRoofStringPowerEntity": "String-Leistungs-Entität",
    "editor.pvRoofStrings": "PV-Dach-Strings",
    "editor.inverterAdd": "Wechselrichter hinzufügen",
    "editor.inverterDisplay": "Anzeige Wechselrichter",
    "editor.inverterDisplayDominant": "Stärksten Wechselrichter groß, andere klein",
    "editor.inverterDisplaySum": "Wechselrichter aufaddiert",
    "editor.inverterDisplayValues": "Wechselrichter-Werte anzeigen",
    "editor.inverterEnergyEntity": "Wechselrichter-kWh-Zähler-Entität",
    "editor.inverterLabel": "Wechselrichter-Name",
    "editor.inverterPowerEntity": "Wechselrichter-Leistungs-Entität",
    "editor.inverters": "Wechselrichter",
    "editor.pvTodayEnergyEntity": "Heute-erzeugt-Entität",
    "editor.remainingChargeTimeEntity": "Verbleibende Ladezeit-Entität",
    "editor.vehicleChargingEnabledEntity": "Laden-aktiviert-Entität",
    "editor.vehicleConnectedEntity": "Auto-verbunden-Entität",
    "editor.vehicleMaxSocEntity": "Auto-Max-/Ziel-SoC-Entität",
    "editor.vehicleSocEntity": "Auto-SoC-Entität",
    "editor.sectionBoxes": "Energie-Boxen",
    "editor.sectionAdvisor": "Advisor und Preise",
    "editor.sectionAppearance": "Anzeige und Grenzwerte",
    "editor.sectionGeneral": "Allgemeine Einstellungen",
    "editor.sectionKpis": "Eigene KPI-Kacheln",
    "editor.sectionEnvironmentSensors": "Umweltsensoren",
    "editor.sectionLargeConsumers": "Weitere große Verbraucher",
    "editor.sectionOverlays": "Bild-Overlays",
    "editor.sectionDashboardAreas": "Dashboard-Bereiche",
    "editor.showBox": "{label} anzeigen",
    "editor.showAdvisor": "Advisor Dashboard anzeigen",
    "editor.showCharts": "Charts Dashboard anzeigen",
    "editor.showElectricVehicle": "E-Auto-Bereich anzeigen",
    "editor.showEnergyRangeSelector": "Live-/1h-/24h-/Monat-/Jahr-/Gesamt-Auswahl anzeigen",
    "editor.showHouseSelector": "Hausauswahl anzeigen",
    "editor.showEnvironmentSensors": "Umweltsensor-Kacheln anzeigen",
    "editor.showLargeConsumers": "Große Verbraucher in der Hausansicht anzeigen",
    "editor.showRecords": "Rekorde-Dashboard anzeigen",
    "editor.showGridStatusTile": "Netzstatus-Kachel anzeigen",
    "editor.showMetricTiles": "Messwertboxen unter dem Bild anzeigen",
    "editor.showPowerFlows": "Animierte Stromflüsse anzeigen",
    "editor.showStatusLabel": "Statuslabel im Bild anzeigen",
    "editor.showTitle": "Titel anzeigen",
    "editor.showWeatherStatus": "Aktuelles Wetter im Statuslabel anzeigen",
    "editor.title": "Titel",
    "editor.tabSetup": "Einrichtung",
    "editor.tabEnergy": "Energie",
    "editor.tabDevices": "Geräte",
    "editor.tabEnvironment": "Umgebung",
    "editor.tabFloorplan": "Grundriss",
    "editor.tabLayout": "Layout",
    "editor.tabAppearance": "Anzeige",
    "editor.tabAdvisor": "Advisor",
    "editor.tabAdvanced": "Erweitert",
    "editor.tabs": "Konfigurationsbereiche",
    "editor.statusConfigured": "{configured}/{total} konfiguriert",
    "editor.statusConfiguredCount": "{count} konfiguriert",
    "editor.statusHidden": "{count} ausgeblendet",
    "editor.statusMissing": "{count} fehlt",
    "editor.statusAdvanced": "Erweiterte Optionen aktiv",
    "editor.statusReady": "Bereit",
    "editor.layoutMode": "Layout-Modus",
    "editor.layoutHelp": "Klicke eine Box in der Vorschau an und passe dann X/Y an.",
    "editor.layoutSelected": "Ausgewählte Box",
    "editor.layoutEmpty": "Aktiviere Bild-Boxen oder Overlays, um ihre Position hier zu bearbeiten.",
    "editor.layoutTypeBox": "Box",
    "editor.layoutTypeOverlay": "Overlay",
    "editor.layoutTypeEnvironment": "Umgebung",
    "editor.sectionFloorplan": "Grundriss-Editor",
    "editor.floorplanHelp": "Wähle ein Werkzeug, klicke ins Raster und passe danach das ausgewählte Element an.",
    "editor.showFloorplan": "Grundriss anzeigen",
    "editor.floorplanShowGrid": "Raster anzeigen",
    "editor.floorplanTools": "Grundriss-Werkzeuge",
    "editor.floorplanToolRoom": "Raum",
    "editor.floorplanToolWall": "Wand",
    "editor.floorplanToolSensor": "Sensor",
    "editor.floorplanSelected": "Ausgewähltes Element",
    "editor.floorplanLabel": "Label",
    "editor.floorplanWidth": "Breite",
    "editor.floorplanHeight": "Höhe",
    "editor.floorplanDelete": "Auswahl löschen",
    "editor.floorplanMode": "Grundrissart",
    "editor.floorplanModeEditor": "Grundriss-Editor",
    "editor.floorplanModeImage": "Bild",
    "editor.floorplanFloors": "Etagen",
    "editor.floorplanAddFloor": "+ Ebene hinzufügen",
    "editor.floorplanFloorLabel": "Ebenenname",
    "editor.floorplanImagePath": "Bildpfad",
    "editor.floorplanCustomEntity": "Eigene Entität verwenden",
    "editor.floorplanSensorType": "Sensortyp",
    "editor.floorplanSensorSource": "Umgebungssensor übernehmen",
    "editor.floorplanEntity": "Entität",
    "editor.floorplanShowSensorLabel": "Label anzeigen",
    "editor.floorplanFontSize": "Schriftgröße",
    "editor.floorplanEmpty": "Klicke ins Raster, um das ausgewählte Element zu erstellen.",
    "editor.floorplanImagePathHelp": "Beispiel: Kopiere eg.png nach /config/www/grundriss/eg.png und trage hier /local/grundriss/eg.png ein. Alternativ kannst du eine vollständige https://-Bild-URL verwenden.",
    "editor.helpFloorplanImagePath": "Lege das Bild in Home Assistant unter /config/www/ ab und gib es als /local/... an, zum Beispiel /local/grundriss/ebene-1.png. Vollständige https://-URLs werden ebenfalls unterstützt.",
    "editor.helpFloorplanSensorSource": "Optional: Einen Sensor aus dem Tab Umgebung wiederverwenden. Bei Eigene Entität kannst du unten direkt eine Home-Assistant-Entität wählen.",
    "editor.helpHomeAssistantSensor": "Wähle die Home-Assistant-Entität, die diesen Wert liefert.",
    "editor.helpUnitAuto": "Mit Auto wird die Einheit der Home-Assistant-Entität verwendet. Wähle eine andere Einheit nur, wenn du sie überschreiben möchtest.",
    "editor.helpEnergyCounter": "Optionaler kumulativer Energiezähler für 1h, 24h, Monat, Jahr und Gesamtansicht.",
    "editor.helpSignedGrid": "Nutze einen Sensor, bei dem positive Werte Netzbezug und negative Werte Einspeisung bedeuten. Leer lassen, wenn getrennte Sensoren genutzt werden.",
    "editor.helpSignedBattery": "Wenn möglich einen Vorzeichen-Sensor nutzen: positiv lädt, negativ entlädt.",
    "editor.helpFooterOrder": "Legt die Reihenfolge der Kacheln unter dem Bild fest. Niedrigere Werte erscheinen früher.",
    "editor.helpTileWidth": "Legt fest, wie breit die Footer-Kachel auf dem Desktop ist. Mobil wird die Breite automatisch begrenzt.",
    "editor.helpImagePosition": "Position der Box auf dem ausgewählten Bild in Prozent.",
    "editor.helpEnvironmentFooter": "Zeigt diesen Sensor als Kachel im Umgebungsbereich unter dem Bild.",
    "editor.helpEnvironmentImage": "Zeigt diesen Sensor als skalierbare HUD-Box direkt auf dem Hausbild.",
    "editor.helpMaxPower": "Wird nur für die Auslastungsleiste und Lastprüfungen im Advisor verwendet.",
    "editor.unit": "Anzeigeeinheit",
    "editor.voltageEntity": "Spannungssensor",
    "editor.voltageEntityL1": "Spannungssensor L1",
    "editor.voltageEntityL2": "Spannungssensor L2",
    "editor.voltageEntityL3": "Spannungssensor L3",
    "editor.viewMode": "Standardansicht",
    "editor.weatherEntity": "Wetter-Entität",
    "editor.setupWizard": "Einrichtungs-Assistent",
    "editor.setupIntro": "Hilft bei der Ersteinrichtung, indem passende Sensoren für PV, Batterie, Wechselrichter, Wallbox, Netz, Verbrauch, Wetter und kWh-Zähler vorgeschlagen werden.",
    "editor.setupHelp": "Prüfe die Vorschläge vor dem Übernehmen. \"Leere Felder füllen\" ist der sichere erste Schritt, \"Erkannte Felder ersetzen\" überschreibt vorhandene erkannte Zuordnungen.",
    "editor.setupEntityCount": "{count} Entitäten verfügbar",
    "editor.setupNoEntities": "Öffne diesen Editor in Home Assistant, damit Entitäten erkannt werden können.",
    "editor.setupFillEmpty": "Leere Felder füllen",
    "editor.setupReplaceAll": "Erkannte Felder ersetzen",
    "editor.setupSuggestions": "Erkannte Vorschläge",
    "editor.setupNoSuggestions": "Noch keine sicheren Entitäts-Treffer gefunden.",
    "editor.setupApplyOne": "Übernehmen",
    "editor.setupCurrent": "Aktuell",
    "editor.setupSuggested": "Vorschlag",
    "editor.setupConfidence": "{score}% Treffer",
    "editor.setupApplied": "{count} Vorschlag/Vorschläge übernommen.",
    "editor.setupApplyNone": "Keine leeren Felder wurden geändert.",
    "editor.xPosition": "X-Position",
    "editor.yPosition": "Y-Position",
    "flow.charge": "Eingehend",
    "flow.discharge": "Ausgehend",
    "consumer.custom": "Eigene",
    "consumer.customLarge": "Eigener großer Verbraucher",
    "consumer.dhw_heatpump": "Brauchwasserwärmepumpe",
    "consumer.dishwasher": "Spülmaschine",
    "consumer.dryer": "Trockner",
    "consumer.sectionTitle": "Weitere große Verbraucher",
    "consumer.space_heater": "Heizlüfter",
    "consumer.washing_machine": "Waschmaschine",
    "environment.sectionTitle": "Umgebung",
    "environment.sensor": "Umgebung {index}",
    "environment.templateIndoor": "Innentemperatur",
    "environment.templateOutdoor": "Außentemperatur",
    "environment.templateHotWater": "Warmwasser",
    "environment.templateHumidity": "Luftfeuchtigkeit",
    "environment.templatePressure": "Druck",
    "environment.templateAirQuality": "Luftqualität",
    "environment.templateCustom": "Eigene",
    "floorplan.counts": "{rooms} Räume · {sensors} Sensoren",
    "floorplan.empty": "Erstelle Räume, Wände und Sensoren im Karteneditor.",
    "floorplan.imageEmpty": "Trage für diese Ebene einen Bildpfad ein.",
    "floorplan.label": "Grundriss",
    "floorplan.level": "Ebene {index}",
    "floorplan.room": "Raum {index}",
    "floorplan.sensor": "Sensor {index}",
    "floorplan.title": "Hausgrundriss",
    "floorplan.wall": "Wand {index}",
    "house.apartment_building": "Mehrfamilienhaus",
    "house.apartment_building_balcony_solar": "Mehrfamilienhaus Balkonsolar",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Stadtvilla",
    "house.city_villa_pitched_roof": "Stadtvilla mit Satteldach",
    "house.duplex_house": "Doppelhaus",
    "house.single_family_home": "Einfamilienhaus",
    "house.terraced_middle_house": "Reihenmittelhaus",
    "metrics.battery_level": "Batterie",
    "metrics.grid_status": "Netz",
    "metrics.house_consumption_power": "Verbrauch",
    "metrics.import_export_power": "Import/Export",
    "metrics.inverter_power": "Wechselrichter",
    "metrics.pv_power": "PV-Leistung",
    "metrics.pv_roof_power": "PV Dach",
    "metrics.pv_shed_power": "PV Schuppen",
    "metrics.pv_total_power": "PV Gesamt",
    "metrics.water_meter": "Wasser",
    "metrics.wallbox_power": "Wallbox",
    "metrics.wallbox2_power": "Wallbox 2",
    "overlay.heatpump": "Wärmepumpe",
    "overlay.smoke": "Gas",
    "phase.auto": "Auto",
    "phase.many": "{count} Phasen",
    "phase.one": "1 Phase",
    "pvLabel.forecastToday": "Prognose heute",
    "pvLabel.peakToday": "Peak heute",
    "pvLabel.power": "Leistung",
    "pvLabel.todayEnergy": "Heute erzeugt",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Live",
    "range.month": "1 Monat",
    "range.total": "Gesamt",
    "range.year": "1 Jahr",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Zuletzt aktualisiert: {time}",
    "status.selfSufficient": "Autark",
    "status.weather": "Wetter: {weather}",
    "tooltip.entity": "Entität",
    "tooltip.flow": "Fluss",
    "tooltip.load": "Auslastung",
    "tooltip.max": "Maximum",
    "tooltip.phases": "Phasen",
    "tooltip.phaseChange": "Bevorstehende Phasenänderung",
    "tooltip.raw": "Rohwert",
    "tooltip.remainingChargeTime": "Verbleibende Ladezeit",
    "tooltip.status": "Status",
    "tooltip.temperature": "Temperatur",
    "tooltip.updated": "Aktualisiert",
    "tooltip.value": "Wert",
    "tooltip.vehicleSoc": "Auto SoC",
    "tooltip.voltage": "Spannung",
    "value.remainingChargeTime": "Noch {value}",
    "value.phaseChangeIn": "{action} in {duration}",
    "value.temperature": "Temp {value}",
    "value.soon": "bald",
    "view.advisor": "Advisor Dashboard",
    "view.house": "Hausansicht",
    "view.floorplan": "Grundriss",
    "view.charts": "Charts",
    "weather.clear": "Klar",
    "weather.clear-night": "Klar",
    "weather.cloudy": "Bewölkt",
    "weather.fog": "Nebel",
    "weather.hail": "Hagel",
    "weather.lightning": "Gewitter",
    "weather.lightning-rainy": "Gewitterregen",
    "weather.partlycloudy": "Teilweise bewölkt",
    "weather.pouring": "Starkregen",
    "weather.rainy": "Regnerisch",
    "weather.snowy": "Schnee",
    "weather.snowy-rainy": "Schneeregen",
    "weather.sunny": "Sonnig",
    "weather.windy": "Windig",
    "weather.windy-variant": "Windig/bewölkt",
    "warning.batteryLow": "Batterie niedrig",
    "warning.gridVoltageCritical": "Viel zu hohe Spannung im Stromnetz",
    "warning.gridVoltageHigh": "Hohe Spannung im Stromnetz",
    "warning.sensorMissing": "Entität nicht gefunden",
    "warning.sensorOffline": "Sensor offline",
    "warning.sensorUnavailable": "Sensor nicht verfügbar",
    "gridFinance.importCost": "Kosten heute",
    "gridFinance.exportRevenue": "Einnahmen heute",
    "view.records": "Rekorde",
    "records.count": "{count} Rekorde",
    "records.countOne": "{count} Rekord",
    "records.days": "{days} Tage",
    "records.empty": "Noch keine auswertbare Historie gefunden.",
    "records.error": "Rekorde konnten nicht geladen werden.",
    "records.label": "Highscores",
    "records.loadingCount": "{count} Entitäten",
    "records.loadingCountOne": "{count} Entität",
    "records.loadingPurposeConsumerPower": "Verbrauchsspitze",
    "records.loadingPurposeCounter": "Tageszähler-Zuwachs",
    "records.loadingPurposeGridFinance": "Netzkosten und Einspeiseerlöse",
    "records.loadingPurposePower": "Leistungsspitze",
    "records.loadingPurposePvEnergy": "PV-Tagesertrag",
    "records.loadingPurposePvPower": "PV-Leistung und solare Stunden",
    "records.loadingPurposeWallboxChargingEnabled": "Wallbox-Ladefreigabe",
    "records.loadingPurposeWallboxEnergy": "Wallbox-Ladeenergie",
    "records.loadingPurposeWallboxMaxSocLimit": "Wallbox-Ladegrenze",
    "records.loadingPurposeWallboxPhase": "Wallbox-Phasenhistorie",
    "records.loadingPurposeWallboxPluggedIn": "Wallbox eingesteckt",
    "records.loadingPurposeWallboxPower": "Wallbox-Ladeleistung",
    "records.loadingPurposeWallboxSoc": "Wallbox-Fahrzeug-SoC",
    "records.loadingTitle": "Historie wird abgefragt",
    "records.loading": "Rekorde werden geladen…",
    "records.sectionPeaks": "Leistungsrekorde",
    "records.sectionPvEnergy": "Bester PV-Ertrag pro String",
    "records.sectionSolarHours": "Längste solare Stunden",
    "records.sectionWallbox": "Wallbox-Rekorde",
    "records.sectionFinance": "Kosten und Einnahmen",
    "records.subtitle": "Bestwerte für {range} aus der Home-Assistant-Historie.",
    "records.title": "Energie-Rekorde",
    "records.range7d": "7 Tage",
    "records.range14d": "14 Tage",
    "records.range30d": "30 Tage",
    "records.rangeMonth": "Diesen Monat",
    "records.rangeYear": "Dieses Jahr",
    "records.range356d": "356 Tage",
    "records.consumerPeakPower": "{name}: höchste Verbrauchsspitze",
    "records.counterLargestIncrease": "{name}: größter Tageszähler-Zuwachs",
    "records.gridImport": "Netzbezug",
    "records.gridExport": "Einspeisung",
    "records.gridHighestCost": "{name}: höchste Bezugskosten",
    "records.gridBestRevenue": "{name}: höchste Einspeiseerlöse",
    "records.powerPeak": "{name}: höchste Leistungsspitze",
    "records.pvBestYield": "{name}: bester PV-Tagesertrag",
    "records.pvPeakPower": "{name}: höchste PV-Leistung",
    "records.solarLongestHours": "{name}: längste solare Produktionszeit",
    "records.wallboxChargedEnergy": "{name}: meiste geladene Energie",
    "records.wallboxChargingEnabled": "{name}: längste Ladefreigabe",
    "records.wallboxLongestCharge": "{name}: längster Ladetag",
    "records.wallboxMaxSoc": "{name}: höchster Fahrzeug-SoC",
    "records.wallboxMaxSocLimit": "{name}: höchste Ladegrenze",
    "records.wallboxOnePhase": "{name}: längste 1-phasige Zeit",
    "records.wallboxPeakPower": "{name}: höchste Ladeleistung",
    "records.wallboxPluggedIn": "{name}: längste eingesteckte Zeit",
    "records.wallboxThreePhase": "{name}: längste 3-phasige Zeit",
    "records.sectionCounters": "Zähler-Rekorde",
    "ev.groupControls": "Steuerung",
    "ev.modeControl": "Lademodus",
    "ev.modeOff": "Aus",
    "ev.modePv": "PV",
    "ev.modeMinPv": "Min+PV",
    "ev.modeFast": "Schnell",
    "view.garden": "Garten",
    "editor.tabGarden": "Garten",
    "editor.showGarden": "Gartenbereich anzeigen",
    "editor.gardenSettings": "Garten-Einstellungen",
    "editor.gardenTitle": "Titel",
    "editor.gardenImage": "Gartenbild",
    "editor.gardenEntity": "Garten-Entität",
    "garden.title": "Garten",
    "garden.subtitle": "Gartenwasser, Wetter, Mäher und Gartengeräte",
    "garden.ready": "Bereit",
    "garden.empty": "Keine Garten-Entitäten konfiguriert.",
    "garden.on": "An",
    "garden.off": "Aus",
    "garden.groupMower": "Mäher",
    "garden.groupWater": "Gartenwasser",
    "garden.groupWeather": "Wetter & Boden",
    "garden.groupEquipment": "Gartengeräte",
    "garden.mowerStatus": "Mäher",
    "garden.mowerBattery": "Mäher Akku",
    "garden.mowerNextStart": "Nächster Mähstart",
    "garden.mowerError": "Mäher Fehler",
    "garden.gardenWater": "Gartenwasser",
    "garden.irrigationEnabled": "Bewässerung aktiv",
    "garden.irrigationNextStart": "Nächste Bewässerung",
    "garden.irrigationRemaining": "Restlaufzeit",
    "garden.waterFlow": "Wasserfluss",
    "garden.waterConsumptionToday": "Wasser heute",
    "garden.waterPressure": "Wasserdruck",
    "garden.cisternLevel": "Zisterne",
    "garden.rain24h": "Regen 24h",
    "garden.rainToday": "Regen heute",
    "garden.outdoorTemperature": "Außen",
    "garden.humidity": "Luftfeuchte",
    "garden.soilMoisture": "Bodenfeuchte",
    "garden.soilTemperature": "Bodentemperatur",
    "garden.gardenLights": "Gartenlicht",
    "garden.gardenOutlet": "Gartensteckdose",
    "garden.pondPump": "Teichpumpe",
    "garden.poolPump": "Poolpumpe"
  },
  "es": {
    "aria.energyRangeSelector": "Seleccionar rango de valores",
    "aria.houseSelector": "Seleccionar casa",
    "aria.viewSelector": "Seleccionar vista del panel",
    "card.defaultTitle": "Flujo de energía",
    "advisor.action": "Acción",
    "advisor.autarky": "Autarquía",
    "advisor.actionHiddenToday": "Oculto por hoy",
    "advisor.batteryIdle": "Battery is not charging while surplus is exported. Check battery limits or charge mode.",
    "advisor.batteryHighSocLong": "House battery has been between 90 and 100% for more than 120 minutes. Batteries should not stay that full for too long.",
    "advisor.batteryCyclesHigh": "House battery has completed several full cycles today. Frequent cycling can age the battery faster.",
    "advisor.batteryDeepSoc": "House battery SoC is very low. Protect the reserve and avoid additional flexible loads.",
    "advisor.batteryLow": "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible.",
    "advisor.batteryMaxReached": "Battery is at the configured max SoC. Additional PV is likely to be exported.",
    "advisor.batteryNearlyFull": "Battery is nearly full, so additional PV is likely to be exported.",
    "advisor.batteryReserveDischarging": "Battery is at or below reserve SoC and still discharging. Check min SoC or backup reserve settings.",
    "advisor.batteryStatus": "Batería",
    "advisor.batteryTemperatureHigh": "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits.",
    "advisor.batteryTemperatureLow": "House battery temperature is low. Charging power may be limited and battery stress can increase.",
    "advisor.checkSensors": "Check unavailable or missing sensors so the energy balance stays reliable.",
    "advisor.configureConsumption": "Add a house consumption sensor to improve autarky and load analysis.",
    "advisor.configureGrid": "Add grid import/export sensors for better advice about surplus and grid draw.",
    "advisor.configurePvTotal": "Add PV total power or roof/shed PV sensors to improve production analysis.",
    "advisor.consumption": "Carga",
    "advisor.detailEntities": "Entidades",
    "advisor.detailEntityValue": "{entity} currently reports {value} for {label}. {impact}",
    "advisor.detailIntro": "The Advisor shows this as {priority} for {window}, because {reason}",
    "advisor.detailSignals": "Señales de decisión",
    "advisor.detailSources": "Fuentes de datos",
    "advisor.detailValues": "Valores",
    "advisor.detailValueOnly": "{label} is currently {value}. {impact}",
    "advisor.detailWhy": "Por qué aparece este aviso",
    "advisor.detailsToggle": "Mostrar detalles",
    "advisor.dismissToday": "Ocultar hoy",
    "advisor.evChargingGrid": "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended.",
    "advisor.evChargingPv": "EV charging is currently covered well by PV or stored energy.",
    "advisor.evEnableCharging": "Charging is currently disabled. Enable charging if you want to use the PV surplus.",
    "advisor.evPlugIn": "Plug in the vehicle to use PV surplus for charging.",
    "advisor.evPhaseChangeScheduled": "{action} in {duration} if the PV situation does not change.",
    "advisor.evSocAbove80Long": "Vehicle SoC is above 80% for more than 120 minutes. This can stress the battery if it stays there too long.",
    "advisor.evSocAbove90Long": "Vehicle SoC is above 90% for more than 60 minutes. Stop charging or lower the target SoC if the car will stay parked.",
    "advisor.evTargetReached": "Vehicle is already at the configured target SoC. Use surplus for another flexible load.",
    "advisor.evTargetReachedGrid": "Vehicle is at target SoC while the charger is still drawing power. Check the charge limit or stop charging.",
    "advisor.exporting": "Inyección",
    "advisor.grid": "Red",
    "advisor.gridImportExportSimultaneous": "Import and export sensors report power at the same time. Check whether the split grid sensors are mapped correctly.",
    "advisor.gridImportFullBattery": "Grid import is high although the house battery is full. Check discharge limits, backup reserve, or battery mode.",
    "advisor.headlineExport": "Hay excedente FV disponible",
    "advisor.headlineImport": "La importación de red está activa",
    "advisor.headlineInfo": "Información disponible",
    "advisor.headlineNeutral": "El flujo de energía está equilibrado",
    "advisor.headlineSetup": "Más sensores habilitan mejores consejos",
    "advisor.headlineWarning": "La configuración energética requiere atención",
    "advisor.highLoad": "Current load is high compared with PV production. Check large consumers if this is unexpected.",
    "advisor.importing": "Importación",
    "advisor.priorityCritical": "Crítico",
    "advisor.priorityInfo": "Info",
    "advisor.priorityOpportunity": "Oportunidad",
    "advisor.prioritySetup": "Configuración",
    "advisor.prioritySuccess": "OK",
    "advisor.priorityWarning": "Advertencia",
    "advisor.electricityPrice": "Precio de electricidad",
    "advisor.lowPv": "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors.",
    "advisor.noAdvice": "No hay acciones urgentes ahora.",
    "advisor.appliances": "Electrodomésticos",
    "advisor.largeConsumerCovered": "Large consumers are running without relevant grid import.",
    "advisor.largeConsumerGrid": "{names} currently draw power while grid import is active. Shift them to PV surplus if possible.",
    "advisor.largeConsumerSurplus": "PV surplus can cover {names}. Start a ready large consumer while export is active.",
    "advisor.panelTitle": "Asesor energético",
    "advisor.pv": "FV",
    "advisor.recommendations": "Recomendaciones",
    "advisor.runAppliance": "Run a flexible household appliance now if it is waiting.",
    "advisor.sensorStaleMany": "{count} sensors have not updated recently. Check entity availability and recorder/update intervals.",
    "advisor.sensorStaleOne": "{name} has not updated for {duration}. Check entity availability and update interval.",
    "advisor.sensors": "Sensores",
    "advisor.selfConsumption": "Autoconsumo",
    "advisor.selfSufficient": "Autosuficiente",
    "advisor.startEvCharging": "Start or increase EV charging while surplus is available.",
    "advisor.status": "Estado",
    "advisor.suggestionCountOne": "{count} sugerencia",
    "advisor.suggestionCount": "{count} sugerencias",
    "advisor.surplus": "Excedente",
    "advisor.surplusGeneral": "PV surplus is available. Prioritize flexible loads while export is active.",
    "advisor.unknown": "Desconocido",
    "advisor.useHeatPump": "Use heat pump boost or preheat hot water while PV surplus is available.",
    "advisor.wallbox": "VE",
    "advisor.weather": "Tiempo",
    "advisor.windowAnytime": "En cualquier momento",
    "advisor.windowNext2h": "Próx. 2 h",
    "advisor.windowNow": "Ahora",
    "advisor.reasonBattery": "Battery SoC {soc} is part of this recommendation.",
    "advisor.reasonEvSurplus": "PV surplus is above the configured EV threshold of {threshold}.",
    "advisor.reasonGridImport": "Grid import is above the configured import threshold of {threshold}.",
    "advisor.reasonLargeConsumer": "The available PV surplus can cover the configured consumer limit.",
    "advisor.reasonPhaseChange": "EVCC reports a planned phase change inside the next window.",
    "advisor.reasonSensor": "A configured entity is stale, unavailable, or inconsistent.",
    "advisor.reasonSurplus": "PV surplus is above the configured surplus threshold of {threshold}.",
    "advisor.reasonWeather": "Weather is included to separate low PV from expected conditions.",
    "advisor.reasonPrice": "The configured electricity price sensor is included in the decision context.",
    "advisor.impactAutarky": "That shows how independently the house is currently being supplied.",
    "advisor.impactBattery": "That value describes the current battery reserve and influences whether flexible loads are sensible right now.",
    "advisor.impactConsumer": "That value shows whether this consumer is active and how strongly it affects the energy balance.",
    "advisor.impactGrid": "That value decides whether the situation is treated as grid import, neutral, or PV surplus.",
    "advisor.impactLoad": "That value describes the current household load and helps classify whether consumption is unusually high.",
    "advisor.impactPv": "That value describes the current PV production and helps estimate how much energy is available.",
    "advisor.impactSelfConsumption": "That shows how much PV energy is being used locally instead of being exported.",
    "advisor.impactSensor": "That value is used as a diagnostic signal for sensor freshness and plausibility.",
    "advisor.impactSurplus": "That value shows how much power is currently available for flexible loads before it is exported.",
    "advisor.impactTemperature": "That value is used to detect possible battery stress or operating limits.",
    "advisor.impactWallbox": "That value describes the charger state and determines whether charging should start, stop, or wait.",
    "editor.showViewSelector": "Mostrar selector de vista",
    "chart.close": "Cerrar",
    "chart.empty": "No se encontraron datos históricos",
    "chart.error": "No se pudo cargar el historial",
    "chart.loading": "Cargando historial…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Últimas {hours} horas",
    "charts.count": "{count} gráficos",
    "charts.countOne": "{count} gráfico",
    "charts.empty": "Aún no hay entidades con historial configuradas.",
    "charts.label": "Gráficos",
    "charts.openLarge": "Abrir gráfico grande",
    "charts.sectionPvStrings": "Strings FV",
    "charts.sectionInverters": "Inversores",
    "charts.sectionSystem": "Inversor y sistema",
    "charts.sectionWallbox": "Wallbox",
    "charts.title": "Historial de entidades",
    "editor.customDayImage": "Imagen diurna personalizada",
    "editor.customImage": "Imagen personalizada",
    "editor.batteryChargeEntity": "Entidad de carga de batería",
    "editor.batteryCyclesTodayEntity": "Entidad de ciclos de batería de hoy",
    "editor.batteryDischargeEntity": "Entidad de descarga de batería",
    "editor.batteryFlowEntity": "Entidad de flujo de batería (+/-)",
    "editor.batteryMaxSocEntity": "Entidad SoC máximo de batería",
    "editor.batteryMinSocEntity": "Entidad SoC mínimo de batería",
    "editor.batteryTemperatureEntity": "Entidad de temperatura de batería",
    "editor.entity": "Entidad",
    "editor.entityPlaceholder": "Entidad de {label}",
    "editor.energy1hEntity": "Entidad kWh 1h",
    "editor.energy24hEntity": "Entidad kWh 24h",
    "editor.energyCounterEntity": "Entidad contador kWh",
    "editor.energyMonthEntity": "Entidad kWh 1 mes",
    "editor.energyRangeOverride": "Sensores directos de periodo opcionales",
    "editor.energyYearEntity": "Entidad kWh 1 año",
    "editor.energyTotalEntity": "Entidad kWh total",
    "editor.liveEntity": "Entidad en vivo",
    "editor.houseType": "Tipo de casa",
    "editor.hudBoxOpacity": "Opacidad de cajas HUD",
    "editor.hudBoxScale": "Escala de cajas HUD",
    "editor.advisorEvSurplusThreshold": "Umbral de excedente FV para VE (W)",
    "editor.electricityPriceEntity": "Entidad de precio de electricidad",
    "editor.gridVoltageCriticalThreshold": "Tensión crítica de red (V)",
    "editor.gridVoltageWarningThreshold": "Tensión alta de red (V)",
    "editor.importExportEntity": "Entidad de importación/exportación",
    "editor.importExportSignedEntity": "Entidad importación/exportación con signo (+/-)",
    "editor.importPowerEntity": "Entidad de importación",
    "editor.exportPowerEntity": "Entidad de exportación",
    "editor.importExportLabels": "Etiquetas de importación/exportación",
    "editor.importExportFinance": "Costes de importación/exportación",
    "editor.importEnergyCounterEntity": "Contador de energía importada",
    "editor.exportEnergyCounterEntity": "Contador de energía exportada",
    "editor.helpImportExportFinance": "Usa contadores kWh acumulativos. La tarjeta calcula el valor de hoy desde la medianoche local.",
    "editor.gridImportPrice": "Precio de importación por kWh",
    "editor.gridExportPrice": "Tarifa de inyección por kWh",
    "editor.currency": "Moneda",
    "editor.showGridDailyFinance": "Mostrar etiquetas de costes e ingresos de hoy",
    "editor.importLabel": "Etiqueta de importación",
    "editor.exportLabel": "Etiqueta de exportación",
    "editor.neutralLabel": "Etiqueta de autosuficiencia",
    "editor.environmentAdd": "Añadir mosaico",
    "editor.environmentEntity": "Entidad del sensor",
    "editor.environmentLabel": "Etiqueta del sensor",
    "editor.environmentShow": "Mostrar mosaico de {label}",
    "editor.environmentShowFooter": "Mostrar caja en el pie",
    "editor.environmentShowImage": "Mostrar caja en la imagen",
    "editor.environmentTemplates": "Plantillas ambientales",
    "editor.environmentUnit": "Unidad mostrada",
    "editor.kpiAdd": "Añadir mosaico",
    "editor.kpiColor": "Color",
    "editor.kpiColumns": "Ancho del mosaico",
    "editor.kpiEntity": "Entidad KPI",
    "editor.kpiLabel": "Etiqueta KPI",
    "editor.kpiPosition": "Posición del mosaico",
    "editor.kpiRemove": "Eliminar",
    "editor.kpiStaticValue": "Valor fijo",
    "editor.consumerEnergyEntity": "Entidad contador kWh",
    "editor.consumerLabel": "Nombre del dispositivo",
    "editor.consumerAddCustom": "Añadir gran consumidor propio",
    "editor.consumerPowerEntity": "Entidad de potencia",
    "editor.consumerShow": "Mostrar mosaico de {label}",
    "editor.labelHideDesktop": "Ocultar en escritorio",
    "editor.labelHideMobile": "Ocultar en móviles",
    "editor.labelOptions": "Visualización de etiquetas",
    "editor.labelShowFooter": "Mostrar etiqueta en KPI inferiores",
    "editor.labelShowImage": "Mostrar etiqueta en la imagen",
    "editor.maxPowerKw": "Potencia máxima (kW/kWp)",
    "editor.optionalDayImage": "Imagen diurna opcional",
    "editor.helpCustomImages": "Guarda las imágenes personalizadas en Home Assistant bajo /config/www/ e introdúcelas como /local/.... Cuando weather_entity está configurada, se prueban automáticamente los sufijos correspondientes, por ejemplo /local/solar/house_day_rainy.png antes de /local/solar/house_day.png.",
    "editor.powerDecimals": "Decimales de potencia",
    "editor.powerDisplayMode": "Modo de potencia",
    "editor.rawMode": "Valor bruto + unidad configurada",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.advisorMaxSuggestions": "Sugerencias del asesor",
    "editor.overlayEnable": "Mostrar {label}",
    "editor.overlayLabel": "Etiqueta",
    "editor.overlayOrientation": "Orientación",
    "editor.overlayOrientationLeft": "Lado izquierdo",
    "editor.overlayOrientationRight": "Lado derecho",
    "editor.overlayPeriod": "Periodo",
    "editor.overlaySize": "Tamaño",
    "editor.period1h": "1 hora",
    "editor.period24h": "24 horas",
    "editor.period30m": "30 minutos",
    "editor.phaseActionEntity": "Entidad de próxima acción de fase",
    "editor.phaseEntity": "Entidad de fases",
    "editor.phaseRemainingEntity": "Entidad segundos restantes de fase",
    "editor.pvForecastTodayEntity": "Entidad previsión de hoy",
    "editor.pvLabels": "Etiquetas FV",
    "editor.pvPeakTodayEntity": "Entidad pico de hoy",
    "editor.pvPowerLabel": "Etiqueta de potencia",
    "editor.pvRoofStringAdd": "Añadir string",
    "editor.pvRoofStringDisplay": "Visualización de strings FV tejado",
    "editor.pvRoofStringDisplayDominant": "String mayor grande, otros pequeños",
    "editor.pvRoofStringDisplaySum": "Sumar strings",
    "editor.pvRoofStringDisplayValues": "Mostrar valores de strings",
    "editor.pvRoofStringEnergyEntity": "Entidad contador kWh del string",
    "editor.pvRoofStringLabel": "Nombre del string",
    "editor.pvRoofStringPowerEntity": "Entidad de potencia del string",
    "editor.pvRoofStrings": "Strings FV tejado",
    "editor.inverterAdd": "Añadir inversor",
    "editor.inverterDisplay": "Visualización de inversores",
    "editor.inverterDisplayDominant": "Inversor mayor grande, otros pequeños",
    "editor.inverterDisplaySum": "Sumar inversores",
    "editor.inverterDisplayValues": "Mostrar valores de inversores",
    "editor.inverterEnergyEntity": "Entidad contador kWh del inversor",
    "editor.inverterLabel": "Nombre del inversor",
    "editor.inverterPowerEntity": "Entidad de potencia del inversor",
    "editor.inverters": "Inversores",
    "editor.pvTodayEnergyEntity": "Entidad generado hoy",
    "editor.remainingChargeTimeEntity": "Entidad de tiempo de carga restante",
    "editor.vehicleChargingEnabledEntity": "Entidad carga habilitada",
    "editor.vehicleConnectedEntity": "Entidad vehículo conectado",
    "editor.vehicleMaxSocEntity": "Entidad SoC máx./objetivo del vehículo",
    "editor.vehicleSocEntity": "Entidad SoC del vehículo",
    "editor.sectionBoxes": "Cajas, entidades en vivo/kWh, unidad y posición",
    "editor.sectionAdvisor": "Asesor y precios",
    "editor.sectionAppearance": "Visualización y límites",
    "editor.sectionGeneral": "Ajustes generales",
    "editor.sectionKpis": "Mosaicos KPI personalizados",
    "editor.sectionEnvironmentSensors": "Sensores ambientales",
    "editor.sectionLargeConsumers": "Otros grandes consumidores",
    "editor.sectionOverlays": "Superposiciones de imagen",
    "editor.sectionDashboardAreas": "Áreas del panel",
    "editor.showBox": "Mostrar {label}",
    "editor.showAdvisor": "Mostrar panel del asesor",
    "editor.showCharts": "Mostrar panel de gráficos",
    "editor.showElectricVehicle": "Mostrar área de coche eléctrico",
    "editor.showEnergyRangeSelector": "Mostrar selector en vivo/1h/24h/mes/año/total",
    "editor.showHouseSelector": "Mostrar selector de casa",
    "editor.showEnvironmentSensors": "Mostrar mosaicos de sensores ambientales",
    "editor.showLargeConsumers": "Mostrar grandes consumidores en la vista de casa",
    "editor.showRecords": "Mostrar panel de récords",
    "editor.showGridStatusTile": "Mostrar mosaico de red",
    "editor.showMetricTiles": "Mostrar cajas de métricas bajo la imagen",
    "editor.showPowerFlows": "Mostrar flujos de energía animados",
    "editor.showStatusLabel": "Mostrar etiqueta de estado en la imagen",
    "editor.showTitle": "Mostrar título",
    "editor.showWeatherStatus": "Mostrar clima actual en la etiqueta de estado",
    "editor.title": "Título",
    "editor.tabSetup": "Configuración",
    "editor.tabEnergy": "Energía",
    "editor.tabDevices": "Dispositivos",
    "editor.tabEnvironment": "Ambiente",
    "editor.tabFloorplan": "Plano",
    "editor.tabLayout": "Diseño",
    "editor.tabAppearance": "Visualización",
    "editor.tabAdvisor": "Asesor",
    "editor.tabAdvanced": "Avanzado",
    "editor.tabs": "Secciones de configuración",
    "editor.statusConfigured": "{configured}/{total} configurados",
    "editor.statusConfiguredCount": "{count} configurados",
    "editor.statusHidden": "{count} ocultos",
    "editor.statusMissing": "faltan {count}",
    "editor.statusAdvanced": "Opciones avanzadas activas",
    "editor.statusReady": "Listo",
    "editor.layoutMode": "Modo de diseño",
    "editor.layoutHelp": "Haz clic en una caja en la vista previa y ajusta su posición X/Y.",
    "editor.layoutSelected": "Caja seleccionada",
    "editor.layoutEmpty": "Activa cajas de imagen o superposiciones para editar sus posiciones aquí.",
    "editor.layoutTypeBox": "Caja",
    "editor.layoutTypeOverlay": "Superposición",
    "editor.layoutTypeEnvironment": "Ambiente",
    "editor.sectionFloorplan": "Editor de plano",
    "editor.floorplanHelp": "Elige una herramienta, haz clic en la cuadrícula y luego ajusta el elemento seleccionado.",
    "editor.showFloorplan": "Mostrar plano",
    "editor.floorplanShowGrid": "Mostrar cuadrícula",
    "editor.floorplanTools": "Herramientas de plano",
    "editor.floorplanToolRoom": "Habitación",
    "editor.floorplanToolWall": "Pared",
    "editor.floorplanToolSensor": "Sensor",
    "editor.floorplanSelected": "Elemento seleccionado",
    "editor.floorplanLabel": "Etiqueta",
    "editor.floorplanWidth": "Ancho",
    "editor.floorplanHeight": "Alto",
    "editor.floorplanDelete": "Eliminar seleccionado",
    "editor.floorplanMode": "Tipo de plano",
    "editor.floorplanModeEditor": "Editor de plano",
    "editor.floorplanModeImage": "Imagen",
    "editor.floorplanFloors": "Niveles",
    "editor.floorplanAddFloor": "+ Añadir nivel",
    "editor.floorplanFloorLabel": "Nombre del nivel",
    "editor.floorplanImagePath": "Ruta de la imagen",
    "editor.floorplanCustomEntity": "Usar entidad propia",
    "editor.floorplanSensorType": "Tipo de sensor",
    "editor.floorplanSensorSource": "Usar sensor ambiental",
    "editor.floorplanEntity": "Entidad",
    "editor.floorplanShowSensorLabel": "Mostrar etiqueta",
    "editor.floorplanFontSize": "Tamaño de fuente",
    "editor.floorplanEmpty": "Haz clic en la cuadrícula para crear el elemento seleccionado.",
    "editor.floorplanImagePathHelp": "Ejemplo: copia planta-baja.png a /config/www/plano/planta-baja.png e introduce aquí /local/plano/planta-baja.png. También puedes usar una URL de imagen https:// completa.",
    "editor.helpFloorplanImagePath": "Guarda la imagen en Home Assistant bajo /config/www/ e introdúcela como /local/..., por ejemplo /local/plano/nivel-1.png. También se admiten URL https:// completas.",
    "editor.helpFloorplanSensorSource": "Opcional: reutiliza un sensor de la pestaña Ambiente. Déjalo en entidad propia para elegir una entidad de Home Assistant directamente abajo.",
    "editor.helpHomeAssistantSensor": "Elige la entidad de Home Assistant que proporciona este valor.",
    "editor.helpUnitAuto": "Usa Auto para mostrar la unidad reportada por Home Assistant. Elige otra unidad solo si quieres sobrescribirla.",
    "editor.helpEnergyCounter": "Contador acumulado opcional para las vistas 1h, 24h, mes, año y total.",
    "editor.helpSignedGrid": "Usa un sensor donde los valores positivos signifiquen importación y los negativos exportación. Déjalo vacío si usas sensores separados.",
    "editor.helpSignedBattery": "Usa un sensor con signo si es posible: positivo significa carga y negativo descarga.",
    "editor.helpFooterOrder": "Controla el orden de los mosaicos bajo la imagen. Los números más bajos aparecen antes.",
    "editor.helpTileWidth": "Controla el ancho del mosaico inferior en escritorio. En móvil se limita automáticamente.",
    "editor.helpImagePosition": "Posición de la caja en la imagen seleccionada en porcentaje.",
    "editor.helpEnvironmentFooter": "Muestra este sensor como mosaico en la sección Ambiente bajo la imagen.",
    "editor.helpEnvironmentImage": "Muestra este sensor como caja HUD escalable sobre la imagen de la casa.",
    "editor.helpMaxPower": "Solo se usa para la barra de utilización y las comprobaciones de carga del asesor.",
    "editor.unit": "Unidad",
    "editor.voltageEntity": "Entidad de tensión",
    "editor.voltageEntityL1": "Entidad tensión L1",
    "editor.voltageEntityL2": "Entidad tensión L2",
    "editor.voltageEntityL3": "Entidad tensión L3",
    "editor.viewMode": "Vista predeterminada",
    "editor.weatherEntity": "Entidad meteorológica",
    "editor.setupWizard": "Asistente de configuración",
    "editor.setupIntro": "Ayuda con la configuración inicial sugiriendo sensores para FV, batería, inversor, cargador VE, red, consumo, clima y contadores kWh.",
    "editor.setupHelp": "Revisa las sugerencias antes de aplicarlas. Usa \"Rellenar campos vacíos\" para una primera pasada segura o \"Reemplazar campos detectados\" para sobrescribir asignaciones existentes.",
    "editor.setupEntityCount": "{count} entidades disponibles",
    "editor.setupNoEntities": "Abre este editor en Home Assistant para detectar entidades.",
    "editor.setupFillEmpty": "Rellenar campos vacíos",
    "editor.setupReplaceAll": "Reemplazar campos detectados",
    "editor.setupSuggestions": "Sugerencias detectadas",
    "editor.setupNoSuggestions": "Aún no se encontraron coincidencias fuertes.",
    "editor.setupApplyOne": "Usar",
    "editor.setupCurrent": "Actual",
    "editor.setupSuggested": "Sugerido",
    "editor.setupConfidence": "{score}% coincidencia",
    "editor.setupApplied": "Se aplicaron {count} sugerencia(s).",
    "editor.setupApplyNone": "No se modificaron campos vacíos.",
    "editor.xPosition": "Posición X",
    "editor.yPosition": "Posición Y",
    "flow.charge": "Entrante",
    "flow.discharge": "Saliente",
    "consumer.custom": "Personalizado",
    "consumer.customLarge": "Gran consumidor personalizado",
    "consumer.dhw_heatpump": "Bomba de calor de agua caliente",
    "consumer.dishwasher": "Lavavajillas",
    "consumer.dryer": "Secadora",
    "consumer.sectionTitle": "Otros grandes consumidores",
    "consumer.space_heater": "Calefactor",
    "consumer.washing_machine": "Lavadora",
    "environment.sectionTitle": "Ambiente",
    "environment.sensor": "Ambiente {index}",
    "environment.templateIndoor": "Temperatura interior",
    "environment.templateOutdoor": "Temperatura exterior",
    "environment.templateHotWater": "Agua caliente",
    "environment.templateHumidity": "Humedad",
    "environment.templatePressure": "Presión",
    "environment.templateAirQuality": "Calidad del aire",
    "environment.templateCustom": "Personalizado",
    "floorplan.counts": "{rooms} habitaciones · {sensors} sensores",
    "floorplan.empty": "Crea habitaciones, paredes y sensores en el editor de la tarjeta.",
    "floorplan.imageEmpty": "Introduce una ruta de imagen para este nivel.",
    "floorplan.label": "Plano",
    "floorplan.level": "Nivel {index}",
    "floorplan.room": "Habitación {index}",
    "floorplan.sensor": "Sensor {index}",
    "floorplan.title": "Plano de la casa",
    "floorplan.wall": "Pared {index}",
    "house.apartment_building": "Edificio de apartamentos",
    "house.apartment_building_balcony_solar": "Edificio de apartamentos con solar de balcón",
    "house.bungalow": "Bungaló",
    "house.city_villa": "Villa urbana",
    "house.city_villa_pitched_roof": "Villa urbana con tejado inclinado",
    "house.duplex_house": "Casa dúplex",
    "house.single_family_home": "Casa unifamiliar",
    "house.terraced_middle_house": "Casa adosada central",
    "metrics.battery_level": "Batería",
    "metrics.grid_status": "Red",
    "metrics.house_consumption_power": "Consumo",
    "metrics.import_export_power": "Importación/exportación",
    "metrics.inverter_power": "Inversor",
    "metrics.pv_power": "Potencia FV",
    "metrics.pv_roof_power": "FV tejado",
    "metrics.pv_shed_power": "FV cobertizo",
    "metrics.pv_total_power": "FV total",
    "metrics.water_meter": "Agua",
    "metrics.wallbox_power": "Cargador VE",
    "metrics.wallbox2_power": "Cargador VE 2",
    "overlay.heatpump": "Bomba de calor",
    "overlay.smoke": "Gas",
    "phase.auto": "Auto",
    "phase.many": "{count} fases",
    "phase.one": "1 fase",
    "pvLabel.forecastToday": "Previsión hoy",
    "pvLabel.peakToday": "Pico hoy",
    "pvLabel.power": "Potencia",
    "pvLabel.todayEnergy": "Generado hoy",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "En vivo",
    "range.month": "1 mes",
    "range.total": "Total",
    "range.year": "1 año",
    "status.export": "Exportación",
    "status.import": "Importación",
    "status.lastUpdated": "Última actualización: {time}",
    "status.selfSufficient": "Autosuficiente",
    "status.weather": "Clima: {weather}",
    "tooltip.entity": "Entidad",
    "tooltip.flow": "Flujo",
    "tooltip.load": "Utilización",
    "tooltip.max": "Máximo",
    "tooltip.phases": "Fases",
    "tooltip.phaseChange": "Próximo cambio de fase",
    "tooltip.raw": "Valor bruto",
    "tooltip.remainingChargeTime": "Tiempo de carga restante",
    "tooltip.status": "Estado",
    "tooltip.temperature": "Temperatura",
    "tooltip.updated": "Actualizado",
    "tooltip.value": "Valor",
    "tooltip.vehicleSoc": "SoC del vehículo",
    "tooltip.voltage": "Tensión",
    "value.remainingChargeTime": "Quedan {value}",
    "value.phaseChangeIn": "{action} en {duration}",
    "value.temperature": "Temp {value}",
    "value.soon": "pronto",
    "view.advisor": "Panel del asesor",
    "view.house": "Vista de casa",
    "view.floorplan": "Plano",
    "view.charts": "Gráficos",
    "weather.clear": "Despejado",
    "weather.clear-night": "Despejado",
    "weather.cloudy": "Nublado",
    "weather.fog": "Niebla",
    "weather.hail": "Granizo",
    "weather.lightning": "Tormenta",
    "weather.lightning-rainy": "Tormenta con lluvia",
    "weather.partlycloudy": "Parcialmente nublado",
    "weather.pouring": "Lluvia intensa",
    "weather.rainy": "Lluvia",
    "weather.snowy": "Nieve",
    "weather.snowy-rainy": "Aguanieve",
    "weather.sunny": "Soleado",
    "weather.windy": "Ventoso",
    "weather.windy-variant": "Ventoso/nublado",
    "warning.batteryLow": "Batería baja",
    "warning.gridVoltageCritical": "Tensión de red demasiado alta",
    "warning.gridVoltageHigh": "Tensión de red alta",
    "warning.sensorMissing": "Entidad no encontrada",
    "warning.sensorOffline": "Sensor sin conexión",
    "warning.sensorUnavailable": "Sensor no disponible",
    "gridFinance.importCost": "Coste hoy",
    "gridFinance.exportRevenue": "Ingresos hoy",
    "view.records": "Récords",
    "records.count": "{count} récords",
    "records.countOne": "{count} récord",
    "records.days": "{days} días",
    "records.empty": "Aún no hay historial evaluable.",
    "records.error": "No se pudieron cargar los récords.",
    "records.label": "Puntuaciones",
    "records.loadingCount": "{count} entidades",
    "records.loadingCountOne": "{count} entidad",
    "records.loadingPurposeConsumerPower": "Pico de consumo",
    "records.loadingPurposeCounter": "Incremento diario del contador",
    "records.loadingPurposeGridFinance": "Costes e ingresos de red",
    "records.loadingPurposePower": "Pico de potencia",
    "records.loadingPurposePvEnergy": "Rendimiento FV diario",
    "records.loadingPurposePvPower": "Potencia FV y horas solares",
    "records.loadingPurposeWallboxChargingEnabled": "Tiempo con carga habilitada",
    "records.loadingPurposeWallboxEnergy": "Energía cargada de wallbox",
    "records.loadingPurposeWallboxMaxSocLimit": "Límite de carga de wallbox",
    "records.loadingPurposeWallboxPhase": "Historial de fases de wallbox",
    "records.loadingPurposeWallboxPluggedIn": "Tiempo enchufado de wallbox",
    "records.loadingPurposeWallboxPower": "Potencia de carga de wallbox",
    "records.loadingPurposeWallboxSoc": "SoC del vehículo en wallbox",
    "records.loadingTitle": "Consultando historial",
    "records.loading": "Cargando récords…",
    "records.sectionPeaks": "Picos de potencia",
    "records.sectionPvEnergy": "Mejor rendimiento FV por string",
    "records.sectionSolarHours": "Horas solares más largas",
    "records.sectionWallbox": "Récords de wallbox",
    "records.sectionFinance": "Costes e ingresos",
    "records.subtitle": "Mejores valores de {range} del historial de Home Assistant.",
    "records.title": "Récords de energía",
    "records.range7d": "7 días",
    "records.range14d": "14 días",
    "records.range30d": "30 días",
    "records.rangeMonth": "Este mes",
    "records.rangeYear": "Este año",
    "records.range356d": "356 días",
    "records.consumerPeakPower": "{name}: mayor pico de consumo",
    "records.counterLargestIncrease": "{name}: mayor incremento diario del contador",
    "records.gridImport": "Importación de red",
    "records.gridExport": "Exportación a red",
    "records.gridHighestCost": "{name}: mayor coste de importación",
    "records.gridBestRevenue": "{name}: mayores ingresos por inyección",
    "records.powerPeak": "{name}: mayor pico de potencia",
    "records.pvBestYield": "{name}: mejor rendimiento FV diario",
    "records.pvPeakPower": "{name}: mayor potencia FV",
    "records.solarLongestHours": "{name}: mayor tiempo de producción solar",
    "records.wallboxChargedEnergy": "{name}: mayor energía cargada",
    "records.wallboxChargingEnabled": "{name}: más tiempo con carga habilitada",
    "records.wallboxLongestCharge": "{name}: día de carga más largo",
    "records.wallboxMaxSoc": "{name}: SoC del vehículo más alto",
    "records.wallboxMaxSocLimit": "{name}: límite de carga más alto",
    "records.wallboxOnePhase": "{name}: más tiempo en 1 fase",
    "records.wallboxPeakPower": "{name}: mayor potencia de carga",
    "records.wallboxPluggedIn": "{name}: más tiempo enchufado",
    "records.wallboxThreePhase": "{name}: más tiempo en 3 fases",
    "records.sectionCounters": "Récords de contadores",
    "ev.groupControls": "Control",
    "ev.modeControl": "Modo de carga",
    "ev.modeOff": "Apagado",
    "ev.modePv": "PV",
    "ev.modeMinPv": "Min+PV",
    "ev.modeFast": "Rápido",
    "view.garden": "Jardín",
    "editor.tabGarden": "Jardín",
    "editor.showGarden": "Mostrar área de jardín",
    "editor.gardenSettings": "Ajustes del jardín",
    "editor.gardenTitle": "Título",
    "editor.gardenImage": "Imagen del jardín",
    "editor.gardenEntity": "Entidad del jardín",
    "garden.title": "Jardín",
    "garden.subtitle": "Agua de jardín, tiempo, cortacésped y dispositivos",
    "garden.ready": "Listo",
    "garden.empty": "No hay entidades de jardín configuradas.",
    "garden.on": "Encendido",
    "garden.off": "Apagado",
    "garden.groupMower": "Cortacésped",
    "garden.groupWater": "Agua de jardín",
    "garden.groupWeather": "Tiempo y suelo",
    "garden.groupEquipment": "Dispositivos de jardín",
    "garden.mowerStatus": "Cortacésped",
    "garden.mowerBattery": "Batería del cortacésped",
    "garden.mowerNextStart": "Próximo corte",
    "garden.mowerError": "Error del cortacésped",
    "garden.gardenWater": "Agua de jardín",
    "garden.irrigationEnabled": "Riego activo",
    "garden.irrigationNextStart": "Próximo riego",
    "garden.irrigationRemaining": "Tiempo restante",
    "garden.waterFlow": "Caudal de agua",
    "garden.waterConsumptionToday": "Agua hoy",
    "garden.waterPressure": "Presión de agua",
    "garden.cisternLevel": "Cisterna",
    "garden.rain24h": "Lluvia 24h",
    "garden.rainToday": "Lluvia hoy",
    "garden.outdoorTemperature": "Exterior",
    "garden.humidity": "Humedad",
    "garden.soilMoisture": "Humedad del suelo",
    "garden.soilTemperature": "Temperatura del suelo",
    "garden.gardenLights": "Luces del jardín",
    "garden.gardenOutlet": "Toma del jardín",
    "garden.pondPump": "Bomba del estanque",
    "garden.poolPump": "Bomba de piscina"
  },
  "fr": {
    "aria.energyRangeSelector": "Sélectionner la période de valeur",
    "aria.houseSelector": "Sélectionner une maison",
    "aria.viewSelector": "Sélectionner la vue du tableau de bord",
    "card.defaultTitle": "Flux d'énergie",
    "advisor.action": "Action",
    "advisor.autarky": "Autonomie",
    "advisor.actionHiddenToday": "Masqué aujourd’hui",
    "advisor.batteryIdle": "Battery is not charging while surplus is exported. Check battery limits or charge mode.",
    "advisor.batteryHighSocLong": "House battery has been between 90 and 100% for more than 120 minutes. Batteries should not stay that full for too long.",
    "advisor.batteryCyclesHigh": "House battery has completed several full cycles today. Frequent cycling can age the battery faster.",
    "advisor.batteryDeepSoc": "House battery SoC is very low. Protect the reserve and avoid additional flexible loads.",
    "advisor.batteryLow": "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible.",
    "advisor.batteryMaxReached": "Battery is at the configured max SoC. Additional PV is likely to be exported.",
    "advisor.batteryNearlyFull": "Battery is nearly full, so additional PV is likely to be exported.",
    "advisor.batteryReserveDischarging": "Battery is at or below reserve SoC and still discharging. Check min SoC or backup reserve settings.",
    "advisor.batteryStatus": "Batterie",
    "advisor.batteryTemperatureHigh": "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits.",
    "advisor.batteryTemperatureLow": "House battery temperature is low. Charging power may be limited and battery stress can increase.",
    "advisor.checkSensors": "Check unavailable or missing sensors so the energy balance stays reliable.",
    "advisor.configureConsumption": "Add a house consumption sensor to improve autarky and load analysis.",
    "advisor.configureGrid": "Add grid import/export sensors for better advice about surplus and grid draw.",
    "advisor.configurePvTotal": "Add PV total power or roof/shed PV sensors to improve production analysis.",
    "advisor.consumption": "Charge",
    "advisor.detailEntities": "Entités",
    "advisor.detailEntityValue": "{entity} currently reports {value} for {label}. {impact}",
    "advisor.detailIntro": "The Advisor shows this as {priority} for {window}, because {reason}",
    "advisor.detailSignals": "Signaux de décision",
    "advisor.detailSources": "Sources de données",
    "advisor.detailValues": "Valeurs",
    "advisor.detailValueOnly": "{label} is currently {value}. {impact}",
    "advisor.detailWhy": "Pourquoi cet avis apparaît",
    "advisor.detailsToggle": "Afficher les détails",
    "advisor.dismissToday": "Masquer aujourd’hui",
    "advisor.evChargingGrid": "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended.",
    "advisor.evChargingPv": "EV charging is currently covered well by PV or stored energy.",
    "advisor.evEnableCharging": "Charging is currently disabled. Enable charging if you want to use the PV surplus.",
    "advisor.evPlugIn": "Plug in the vehicle to use PV surplus for charging.",
    "advisor.evPhaseChangeScheduled": "{action} in {duration} if the PV situation does not change.",
    "advisor.evSocAbove80Long": "Vehicle SoC is above 80% for more than 120 minutes. This can stress the battery if it stays there too long.",
    "advisor.evSocAbove90Long": "Vehicle SoC is above 90% for more than 60 minutes. Stop charging or lower the target SoC if the car will stay parked.",
    "advisor.evTargetReached": "Vehicle is already at the configured target SoC. Use surplus for another flexible load.",
    "advisor.evTargetReachedGrid": "Vehicle is at target SoC while the charger is still drawing power. Check the charge limit or stop charging.",
    "advisor.exporting": "Injection",
    "advisor.grid": "Réseau",
    "advisor.gridImportExportSimultaneous": "Import and export sensors report power at the same time. Check whether the split grid sensors are mapped correctly.",
    "advisor.gridImportFullBattery": "Grid import is high although the house battery is full. Check discharge limits, backup reserve, or battery mode.",
    "advisor.headlineExport": "Un surplus PV est disponible",
    "advisor.headlineImport": "L’import réseau est actif",
    "advisor.headlineInfo": "Informations disponibles",
    "advisor.headlineNeutral": "Le flux d’énergie est équilibré",
    "advisor.headlineSetup": "Plus de capteurs permettent de meilleurs conseils",
    "advisor.headlineWarning": "La configuration énergétique nécessite votre attention",
    "advisor.highLoad": "Current load is high compared with PV production. Check large consumers if this is unexpected.",
    "advisor.importing": "Import",
    "advisor.priorityCritical": "Critique",
    "advisor.priorityInfo": "Info",
    "advisor.priorityOpportunity": "Opportunité",
    "advisor.prioritySetup": "Configuration",
    "advisor.prioritySuccess": "OK",
    "advisor.priorityWarning": "Avertissement",
    "advisor.electricityPrice": "Prix de l’électricité",
    "advisor.lowPv": "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors.",
    "advisor.noAdvice": "Aucune action urgente pour le moment.",
    "advisor.appliances": "Appareils",
    "advisor.largeConsumerCovered": "Large consumers are running without relevant grid import.",
    "advisor.largeConsumerGrid": "{names} currently draw power while grid import is active. Shift them to PV surplus if possible.",
    "advisor.largeConsumerSurplus": "PV surplus can cover {names}. Start a ready large consumer while export is active.",
    "advisor.panelTitle": "Conseiller énergie",
    "advisor.pv": "PV",
    "advisor.recommendations": "Recommandations",
    "advisor.runAppliance": "Run a flexible household appliance now if it is waiting.",
    "advisor.sensorStaleMany": "{count} sensors have not updated recently. Check entity availability and recorder/update intervals.",
    "advisor.sensorStaleOne": "{name} has not updated for {duration}. Check entity availability and update interval.",
    "advisor.sensors": "Capteurs",
    "advisor.selfConsumption": "Autoconsommation",
    "advisor.selfSufficient": "Autonome",
    "advisor.startEvCharging": "Start or increase EV charging while surplus is available.",
    "advisor.status": "État",
    "advisor.suggestionCountOne": "{count} suggestion",
    "advisor.suggestionCount": "{count} suggestions",
    "advisor.surplus": "Surplus",
    "advisor.surplusGeneral": "PV surplus is available. Prioritize flexible loads while export is active.",
    "advisor.unknown": "Inconnu",
    "advisor.useHeatPump": "Use heat pump boost or preheat hot water while PV surplus is available.",
    "advisor.wallbox": "VE",
    "advisor.weather": "Météo",
    "advisor.windowAnytime": "À tout moment",
    "advisor.windowNext2h": "Prochaines 2 h",
    "advisor.windowNow": "Maintenant",
    "advisor.reasonBattery": "Battery SoC {soc} is part of this recommendation.",
    "advisor.reasonEvSurplus": "PV surplus is above the configured EV threshold of {threshold}.",
    "advisor.reasonGridImport": "Grid import is above the configured import threshold of {threshold}.",
    "advisor.reasonLargeConsumer": "The available PV surplus can cover the configured consumer limit.",
    "advisor.reasonPhaseChange": "EVCC reports a planned phase change inside the next window.",
    "advisor.reasonSensor": "A configured entity is stale, unavailable, or inconsistent.",
    "advisor.reasonSurplus": "PV surplus is above the configured surplus threshold of {threshold}.",
    "advisor.reasonWeather": "Weather is included to separate low PV from expected conditions.",
    "advisor.reasonPrice": "The configured electricity price sensor is included in the decision context.",
    "advisor.impactAutarky": "That shows how independently the house is currently being supplied.",
    "advisor.impactBattery": "That value describes the current battery reserve and influences whether flexible loads are sensible right now.",
    "advisor.impactConsumer": "That value shows whether this consumer is active and how strongly it affects the energy balance.",
    "advisor.impactGrid": "That value decides whether the situation is treated as grid import, neutral, or PV surplus.",
    "advisor.impactLoad": "That value describes the current household load and helps classify whether consumption is unusually high.",
    "advisor.impactPv": "That value describes the current PV production and helps estimate how much energy is available.",
    "advisor.impactSelfConsumption": "That shows how much PV energy is being used locally instead of being exported.",
    "advisor.impactSensor": "That value is used as a diagnostic signal for sensor freshness and plausibility.",
    "advisor.impactSurplus": "That value shows how much power is currently available for flexible loads before it is exported.",
    "advisor.impactTemperature": "That value is used to detect possible battery stress or operating limits.",
    "advisor.impactWallbox": "That value describes the charger state and determines whether charging should start, stop, or wait.",
    "editor.showViewSelector": "Afficher le sélecteur de vue",
    "chart.close": "Fermer",
    "chart.empty": "Aucune donnée historique trouvée",
    "chart.error": "Impossible de charger l'historique",
    "chart.loading": "Chargement de l'historique…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Dernières {hours} heures",
    "charts.count": "{count} graphiques",
    "charts.countOne": "{count} graphique",
    "charts.empty": "Aucune entité avec historique n'est encore configurée.",
    "charts.label": "Graphiques",
    "charts.openLarge": "Ouvrir le grand graphique",
    "charts.sectionPvStrings": "Strings PV",
    "charts.sectionInverters": "Onduleurs",
    "charts.sectionSystem": "Onduleur et système",
    "charts.sectionWallbox": "Wallbox",
    "charts.title": "Historique des entités",
    "editor.customDayImage": "Image de jour personnalisée",
    "editor.customImage": "Image personnalisée",
    "editor.batteryChargeEntity": "Entité de charge batterie",
    "editor.batteryCyclesTodayEntity": "Entité cycles batterie aujourd’hui",
    "editor.batteryDischargeEntity": "Entité de décharge batterie",
    "editor.batteryFlowEntity": "Entité de flux batterie (+/-)",
    "editor.batteryMaxSocEntity": "Entité SoC max. batterie",
    "editor.batteryMinSocEntity": "Entité SoC min. batterie",
    "editor.batteryTemperatureEntity": "Entité température batterie",
    "editor.entity": "Entité",
    "editor.entityPlaceholder": "Entité {label}",
    "editor.energy1hEntity": "Entité kWh 1h",
    "editor.energy24hEntity": "Entité kWh 24h",
    "editor.energyCounterEntity": "Entité compteur kWh",
    "editor.energyMonthEntity": "Entité kWh 1 mois",
    "editor.energyRangeOverride": "Capteurs de période directs optionnels",
    "editor.energyYearEntity": "Entité kWh 1 an",
    "editor.energyTotalEntity": "Entité kWh total",
    "editor.liveEntity": "Entité directe",
    "editor.houseType": "Type de maison",
    "editor.hudBoxOpacity": "Opacité des boîtes HUD",
    "editor.hudBoxScale": "Échelle des boîtes HUD",
    "editor.advisorEvSurplusThreshold": "Seuil de surplus VE (W)",
    "editor.electricityPriceEntity": "Entité prix de l’électricité",
    "editor.gridVoltageCriticalThreshold": "Tension réseau critique (V)",
    "editor.gridVoltageWarningThreshold": "Tension réseau élevée (V)",
    "editor.importExportEntity": "Entité import/export",
    "editor.importExportSignedEntity": "Entité import/export signée (+/-)",
    "editor.importPowerEntity": "Entité import",
    "editor.exportPowerEntity": "Entité export",
    "editor.importExportLabels": "Libellés import/export",
    "editor.importExportFinance": "Coûts import/export",
    "editor.importEnergyCounterEntity": "Compteur d'énergie importée",
    "editor.exportEnergyCounterEntity": "Compteur d'énergie exportée",
    "editor.helpImportExportFinance": "Utilisez des compteurs kWh cumulatifs. La carte calcule la valeur du jour depuis minuit local.",
    "editor.gridImportPrice": "Prix d'import par kWh",
    "editor.gridExportPrice": "Tarif d'injection par kWh",
    "editor.currency": "Devise",
    "editor.showGridDailyFinance": "Afficher les libellés des coûts et revenus du jour",
    "editor.importLabel": "Libellé import",
    "editor.exportLabel": "Libellé export",
    "editor.neutralLabel": "Libellé autonomie",
    "editor.environmentAdd": "Ajouter une tuile",
    "editor.environmentEntity": "Entité du capteur",
    "editor.environmentLabel": "Libellé du capteur",
    "editor.environmentShow": "Afficher la tuile {label}",
    "editor.environmentShowFooter": "Afficher la boîte dans le pied",
    "editor.environmentShowImage": "Afficher la boîte dans l'image",
    "editor.environmentTemplates": "Modèles d'environnement",
    "editor.environmentUnit": "Unité affichée",
    "editor.kpiAdd": "Ajouter une tuile",
    "editor.kpiColor": "Couleur",
    "editor.kpiColumns": "Largeur de tuile",
    "editor.kpiEntity": "Entité KPI",
    "editor.kpiLabel": "Libellé KPI",
    "editor.kpiPosition": "Position de tuile",
    "editor.kpiRemove": "Supprimer",
    "editor.kpiStaticValue": "Valeur fixe",
    "editor.consumerEnergyEntity": "Entité compteur kWh",
    "editor.consumerLabel": "Nom de l’appareil",
    "editor.consumerAddCustom": "Ajouter un gros consommateur personnalisé",
    "editor.consumerPowerEntity": "Entité de puissance",
    "editor.consumerShow": "Afficher la tuile {label}",
    "editor.labelHideDesktop": "Masquer sur bureau",
    "editor.labelHideMobile": "Masquer sur mobile",
    "editor.labelOptions": "Affichage des libellés",
    "editor.labelShowFooter": "Afficher le libellé dans les KPI inférieurs",
    "editor.labelShowImage": "Afficher le libellé dans l’image",
    "editor.maxPowerKw": "Puissance max. (kW/kWp)",
    "editor.optionalDayImage": "Image de jour optionnelle",
    "editor.helpCustomImages": "Stockez les images personnalisées dans Home Assistant sous /config/www/ et saisissez-les sous la forme /local/.... Quand weather_entity est configurée, les suffixes correspondants sont essayés automatiquement, par exemple /local/solar/house_day_rainy.png avant /local/solar/house_day.png.",
    "editor.powerDecimals": "Décimales de puissance",
    "editor.powerDisplayMode": "Mode d'affichage de la puissance",
    "editor.rawMode": "Valeur brute + unité configurée",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.advisorMaxSuggestions": "Suggestions du conseiller",
    "editor.overlayEnable": "Afficher {label}",
    "editor.overlayLabel": "Libellé",
    "editor.overlayOrientation": "Orientation",
    "editor.overlayOrientationLeft": "Côté gauche",
    "editor.overlayOrientationRight": "Côté droit",
    "editor.overlayPeriod": "Période",
    "editor.overlaySize": "Taille",
    "editor.period1h": "1 heure",
    "editor.period24h": "24 heures",
    "editor.period30m": "30 minutes",
    "editor.phaseActionEntity": "Entité prochaine action de phase",
    "editor.phaseEntity": "Entité phases",
    "editor.phaseRemainingEntity": "Entité secondes restantes de phase",
    "editor.pvForecastTodayEntity": "Entité prévision du jour",
    "editor.pvLabels": "Libellés PV",
    "editor.pvPeakTodayEntity": "Entité pic du jour",
    "editor.pvPowerLabel": "Libellé puissance",
    "editor.pvRoofStringAdd": "Ajouter un string",
    "editor.pvRoofStringDisplay": "Affichage des strings PV toiture",
    "editor.pvRoofStringDisplayDominant": "String le plus fort grand, autres petits",
    "editor.pvRoofStringDisplaySum": "Additionner les strings",
    "editor.pvRoofStringDisplayValues": "Afficher les valeurs des strings",
    "editor.pvRoofStringEnergyEntity": "Entité compteur kWh du string",
    "editor.pvRoofStringLabel": "Nom du string",
    "editor.pvRoofStringPowerEntity": "Entité puissance du string",
    "editor.pvRoofStrings": "Strings PV toiture",
    "editor.inverterAdd": "Ajouter un onduleur",
    "editor.inverterDisplay": "Affichage des onduleurs",
    "editor.inverterDisplayDominant": "Onduleur le plus fort grand, autres petits",
    "editor.inverterDisplaySum": "Additionner les onduleurs",
    "editor.inverterDisplayValues": "Afficher les valeurs des onduleurs",
    "editor.inverterEnergyEntity": "Entité compteur kWh de l'onduleur",
    "editor.inverterLabel": "Nom de l'onduleur",
    "editor.inverterPowerEntity": "Entité puissance de l'onduleur",
    "editor.inverters": "Onduleurs",
    "editor.pvTodayEnergyEntity": "Entité production du jour",
    "editor.remainingChargeTimeEntity": "Entité temps de charge restant",
    "editor.vehicleChargingEnabledEntity": "Entité charge activée",
    "editor.vehicleConnectedEntity": "Entité véhicule connecté",
    "editor.vehicleMaxSocEntity": "Entité SoC max./cible du véhicule",
    "editor.vehicleSocEntity": "Entité SoC véhicule",
    "editor.sectionBoxes": "Boîtes, entités directes/kWh, unité et position",
    "editor.sectionAdvisor": "Conseiller et prix",
    "editor.sectionAppearance": "Affichage et limites",
    "editor.sectionGeneral": "Paramètres généraux",
    "editor.sectionKpis": "Tuiles KPI personnalisées",
    "editor.sectionEnvironmentSensors": "Capteurs d'environnement",
    "editor.sectionLargeConsumers": "Autres gros consommateurs",
    "editor.sectionOverlays": "Superpositions d'image",
    "editor.sectionDashboardAreas": "Zones du tableau de bord",
    "editor.showBox": "Afficher {label}",
    "editor.showAdvisor": "Afficher le tableau conseiller",
    "editor.showCharts": "Afficher le tableau des graphiques",
    "editor.showElectricVehicle": "Afficher la zone voiture électrique",
    "editor.showEnergyRangeSelector": "Afficher le sélecteur direct/1h/24h/mois/an/total",
    "editor.showHouseSelector": "Afficher le sélecteur de maison",
    "editor.showEnvironmentSensors": "Afficher les tuiles de capteurs d'environnement",
    "editor.showLargeConsumers": "Afficher les gros consommateurs dans la vue maison",
    "editor.showRecords": "Afficher le tableau des records",
    "editor.showGridStatusTile": "Afficher la tuile réseau",
    "editor.showMetricTiles": "Afficher les boîtes de mesure sous l'image",
    "editor.showPowerFlows": "Afficher les flux d'énergie animés",
    "editor.showStatusLabel": "Afficher le libellé d'état dans l'image",
    "editor.showTitle": "Afficher le titre",
    "editor.showWeatherStatus": "Afficher la météo actuelle dans le libellé d'état",
    "editor.title": "Titre",
    "editor.tabSetup": "Configuration",
    "editor.tabEnergy": "Énergie",
    "editor.tabDevices": "Appareils",
    "editor.tabEnvironment": "Environnement",
    "editor.tabFloorplan": "Plan",
    "editor.tabLayout": "Disposition",
    "editor.tabAppearance": "Affichage",
    "editor.tabAdvisor": "Conseiller",
    "editor.tabAdvanced": "Avancé",
    "editor.tabs": "Sections de configuration",
    "editor.statusConfigured": "{configured}/{total} configurés",
    "editor.statusConfiguredCount": "{count} configurés",
    "editor.statusHidden": "{count} masqués",
    "editor.statusMissing": "{count} manquants",
    "editor.statusAdvanced": "Options avancées actives",
    "editor.statusReady": "Prêt",
    "editor.layoutMode": "Mode disposition",
    "editor.layoutHelp": "Cliquez sur une boîte dans l'aperçu, puis ajustez sa position X/Y.",
    "editor.layoutSelected": "Boîte sélectionnée",
    "editor.layoutEmpty": "Activez des boîtes d'image ou des superpositions pour modifier leurs positions ici.",
    "editor.layoutTypeBox": "Boîte",
    "editor.layoutTypeOverlay": "Superposition",
    "editor.layoutTypeEnvironment": "Environnement",
    "editor.sectionFloorplan": "Éditeur de plan",
    "editor.floorplanHelp": "Choisissez un outil, cliquez dans la grille, puis ajustez l'élément sélectionné.",
    "editor.showFloorplan": "Afficher le plan",
    "editor.floorplanShowGrid": "Afficher la grille",
    "editor.floorplanTools": "Outils de plan",
    "editor.floorplanToolRoom": "Pièce",
    "editor.floorplanToolWall": "Mur",
    "editor.floorplanToolSensor": "Capteur",
    "editor.floorplanSelected": "Élément sélectionné",
    "editor.floorplanLabel": "Libellé",
    "editor.floorplanWidth": "Largeur",
    "editor.floorplanHeight": "Hauteur",
    "editor.floorplanDelete": "Supprimer la sélection",
    "editor.floorplanMode": "Type de plan",
    "editor.floorplanModeEditor": "Éditeur de plan",
    "editor.floorplanModeImage": "Image",
    "editor.floorplanFloors": "Niveaux",
    "editor.floorplanAddFloor": "+ Ajouter un niveau",
    "editor.floorplanFloorLabel": "Nom du niveau",
    "editor.floorplanImagePath": "Chemin de l'image",
    "editor.floorplanCustomEntity": "Utiliser une entité propre",
    "editor.floorplanSensorType": "Type de capteur",
    "editor.floorplanSensorSource": "Utiliser un capteur environnement",
    "editor.floorplanEntity": "Entité",
    "editor.floorplanShowSensorLabel": "Afficher le libellé",
    "editor.floorplanFontSize": "Taille du texte",
    "editor.floorplanEmpty": "Cliquez dans la grille pour créer l'élément sélectionné.",
    "editor.floorplanImagePathHelp": "Exemple : copiez rdc.png dans /config/www/plan/rdc.png puis saisissez /local/plan/rdc.png ici. Vous pouvez aussi utiliser une URL d'image https:// complète.",
    "editor.helpFloorplanImagePath": "Stockez l'image dans Home Assistant sous /config/www/ et saisissez-la sous la forme /local/..., par exemple /local/plan/niveau-1.png. Les URL https:// complètes sont aussi prises en charge.",
    "editor.helpFloorplanSensorSource": "Optionnel : réutilisez un capteur de l'onglet Environnement. Laissez sur entité propre pour choisir directement une entité Home Assistant ci-dessous.",
    "editor.helpHomeAssistantSensor": "Choisissez l'entité Home Assistant qui fournit cette valeur.",
    "editor.helpUnitAuto": "Utilisez Auto pour afficher l'unité fournie par Home Assistant. Choisissez une autre unité seulement si vous voulez la remplacer.",
    "editor.helpEnergyCounter": "Compteur d'énergie cumulée optionnel pour les vues 1h, 24h, mois, année et total.",
    "editor.helpSignedGrid": "Utilisez un capteur où les valeurs positives signifient import et les valeurs négatives export. Laissez vide si vous utilisez deux capteurs.",
    "editor.helpSignedBattery": "Utilisez un capteur signé si possible : positif signifie charge, négatif décharge.",
    "editor.helpFooterOrder": "Contrôle l'ordre des tuiles sous l'image. Les nombres plus bas apparaissent plus tôt.",
    "editor.helpTileWidth": "Contrôle la largeur de la tuile inférieure sur bureau. Sur mobile, elle est limitée automatiquement.",
    "editor.helpImagePosition": "Position de la boîte sur l'image sélectionnée en pourcentage.",
    "editor.helpEnvironmentFooter": "Affiche ce capteur comme tuile dans la section Environnement sous l'image.",
    "editor.helpEnvironmentImage": "Affiche ce capteur comme boîte HUD redimensionnable sur l'image de la maison.",
    "editor.helpMaxPower": "Utilisé seulement pour la barre d'utilisation et les contrôles de charge du conseiller.",
    "editor.unit": "Unité",
    "editor.voltageEntity": "Entité tension",
    "editor.voltageEntityL1": "Entité tension L1",
    "editor.voltageEntityL2": "Entité tension L2",
    "editor.voltageEntityL3": "Entité tension L3",
    "editor.viewMode": "Vue par défaut",
    "editor.weatherEntity": "Entité météo",
    "editor.setupWizard": "Assistant de configuration",
    "editor.setupIntro": "Aide à la première configuration en suggérant des capteurs pour PV, batterie, onduleur, borne VE, réseau, consommation, météo et compteurs kWh.",
    "editor.setupHelp": "Vérifiez les suggestions avant de les appliquer. Utilisez « Remplir les champs vides » pour un premier passage sûr ou « Remplacer les champs détectés » pour écraser les affectations existantes.",
    "editor.setupEntityCount": "{count} entités disponibles",
    "editor.setupNoEntities": "Ouvrez cet éditeur dans Home Assistant pour détecter les entités.",
    "editor.setupFillEmpty": "Remplir les champs vides",
    "editor.setupReplaceAll": "Remplacer les champs détectés",
    "editor.setupSuggestions": "Suggestions détectées",
    "editor.setupNoSuggestions": "Aucune correspondance forte trouvée pour le moment.",
    "editor.setupApplyOne": "Utiliser",
    "editor.setupCurrent": "Actuel",
    "editor.setupSuggested": "Suggéré",
    "editor.setupConfidence": "{score}% de correspondance",
    "editor.setupApplied": "{count} suggestion(s) appliquée(s).",
    "editor.setupApplyNone": "Aucun champ vide n’a été modifié.",
    "editor.xPosition": "Position X",
    "editor.yPosition": "Position Y",
    "flow.charge": "Entrant",
    "flow.discharge": "Sortant",
    "consumer.custom": "Personnalisé",
    "consumer.customLarge": "Grand consommateur personnalisé",
    "consumer.dhw_heatpump": "Pompe à chaleur eau chaude",
    "consumer.dishwasher": "Lave-vaisselle",
    "consumer.dryer": "Sèche-linge",
    "consumer.sectionTitle": "Autres gros consommateurs",
    "consumer.space_heater": "Chauffage soufflant",
    "consumer.washing_machine": "Lave-linge",
    "environment.sectionTitle": "Environnement",
    "environment.sensor": "Environnement {index}",
    "environment.templateIndoor": "Température intérieure",
    "environment.templateOutdoor": "Température extérieure",
    "environment.templateHotWater": "Eau chaude",
    "environment.templateHumidity": "Humidité",
    "environment.templatePressure": "Pression",
    "environment.templateAirQuality": "Qualité de l'air",
    "environment.templateCustom": "Personnalisé",
    "floorplan.counts": "{rooms} pièces · {sensors} capteurs",
    "floorplan.empty": "Créez des pièces, murs et capteurs dans l'éditeur de carte.",
    "floorplan.imageEmpty": "Saisissez un chemin d'image pour ce niveau.",
    "floorplan.label": "Plan",
    "floorplan.level": "Niveau {index}",
    "floorplan.room": "Pièce {index}",
    "floorplan.sensor": "Capteur {index}",
    "floorplan.title": "Plan de la maison",
    "floorplan.wall": "Mur {index}",
    "house.apartment_building": "Immeuble d'appartements",
    "house.apartment_building_balcony_solar": "Immeuble avec solaire de balcon",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Villa urbaine",
    "house.city_villa_pitched_roof": "Villa urbaine avec toit incliné",
    "house.duplex_house": "Maison duplex",
    "house.single_family_home": "Maison individuelle",
    "house.terraced_middle_house": "Maison mitoyenne centrale",
    "metrics.battery_level": "Batterie",
    "metrics.grid_status": "Réseau",
    "metrics.house_consumption_power": "Consommation",
    "metrics.import_export_power": "Import/export",
    "metrics.inverter_power": "Onduleur",
    "metrics.pv_power": "Puissance PV",
    "metrics.pv_roof_power": "PV toiture",
    "metrics.pv_shed_power": "PV abri",
    "metrics.pv_total_power": "PV total",
    "metrics.water_meter": "Eau",
    "metrics.wallbox_power": "Chargeur VE",
    "metrics.wallbox2_power": "Chargeur VE 2",
    "overlay.heatpump": "Pompe à chaleur",
    "overlay.smoke": "Gaz",
    "phase.auto": "Auto",
    "phase.many": "{count} phases",
    "phase.one": "1 phase",
    "pvLabel.forecastToday": "Prévision aujourd’hui",
    "pvLabel.peakToday": "Pic aujourd’hui",
    "pvLabel.power": "Puissance",
    "pvLabel.todayEnergy": "Produit aujourd’hui",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Direct",
    "range.month": "1 mois",
    "range.total": "Total",
    "range.year": "1 an",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Dernière mise à jour : {time}",
    "status.selfSufficient": "Autonome",
    "status.weather": "Météo : {weather}",
    "tooltip.entity": "Entité",
    "tooltip.flow": "Flux",
    "tooltip.load": "Utilisation",
    "tooltip.max": "Maximum",
    "tooltip.phases": "Phases",
    "tooltip.phaseChange": "Prochain changement de phase",
    "tooltip.raw": "Valeur brute",
    "tooltip.remainingChargeTime": "Temps de charge restant",
    "tooltip.status": "État",
    "tooltip.temperature": "Température",
    "tooltip.updated": "Mis à jour",
    "tooltip.value": "Valeur",
    "tooltip.vehicleSoc": "SoC véhicule",
    "tooltip.voltage": "Tension",
    "value.remainingChargeTime": "{value} restant",
    "value.phaseChangeIn": "{action} dans {duration}",
    "value.temperature": "Temp {value}",
    "value.soon": "bientôt",
    "view.advisor": "Tableau conseiller",
    "view.house": "Vue maison",
    "view.floorplan": "Plan",
    "view.charts": "Graphiques",
    "weather.clear": "Dégagé",
    "weather.clear-night": "Dégagé",
    "weather.cloudy": "Nuageux",
    "weather.fog": "Brouillard",
    "weather.hail": "Grêle",
    "weather.lightning": "Orage",
    "weather.lightning-rainy": "Orage avec pluie",
    "weather.partlycloudy": "Partiellement nuageux",
    "weather.pouring": "Forte pluie",
    "weather.rainy": "Pluvieux",
    "weather.snowy": "Neige",
    "weather.snowy-rainy": "Neige fondue",
    "weather.sunny": "Ensoleillé",
    "weather.windy": "Venteux",
    "weather.windy-variant": "Venteux/nuageux",
    "warning.batteryLow": "Batterie faible",
    "warning.gridVoltageCritical": "Tension réseau beaucoup trop élevée",
    "warning.gridVoltageHigh": "Tension réseau élevée",
    "warning.sensorMissing": "Entité introuvable",
    "warning.sensorOffline": "Capteur hors ligne",
    "warning.sensorUnavailable": "Capteur indisponible",
    "gridFinance.importCost": "Coût aujourd'hui",
    "gridFinance.exportRevenue": "Revenus aujourd'hui",
    "view.records": "Records",
    "records.count": "{count} records",
    "records.countOne": "{count} record",
    "records.days": "{days} jours",
    "records.empty": "Aucun historique exploitable pour le moment.",
    "records.error": "Les records n’ont pas pu être chargés.",
    "records.label": "High scores",
    "records.loadingCount": "{count} entités",
    "records.loadingCountOne": "{count} entité",
    "records.loadingPurposeConsumerPower": "Pic de consommation",
    "records.loadingPurposeCounter": "Hausse quotidienne du compteur",
    "records.loadingPurposeGridFinance": "Coûts et revenus réseau",
    "records.loadingPurposePower": "Pic de puissance",
    "records.loadingPurposePvEnergy": "Rendement PV journalier",
    "records.loadingPurposePvPower": "Puissance PV et heures solaires",
    "records.loadingPurposeWallboxChargingEnabled": "Temps de charge autorisée",
    "records.loadingPurposeWallboxEnergy": "Énergie chargée wallbox",
    "records.loadingPurposeWallboxMaxSocLimit": "Limite de charge wallbox",
    "records.loadingPurposeWallboxPhase": "Historique des phases wallbox",
    "records.loadingPurposeWallboxPluggedIn": "Temps branché wallbox",
    "records.loadingPurposeWallboxPower": "Puissance de charge wallbox",
    "records.loadingPurposeWallboxSoc": "SoC véhicule wallbox",
    "records.loadingTitle": "Consultation de l’historique",
    "records.loading": "Chargement des records…",
    "records.sectionPeaks": "Pics de puissance",
    "records.sectionPvEnergy": "Meilleur rendement PV par string",
    "records.sectionSolarHours": "Plus longues heures solaires",
    "records.sectionWallbox": "Records wallbox",
    "records.sectionFinance": "Coûts et revenus",
    "records.subtitle": "Meilleures valeurs pour {range} depuis l’historique Home Assistant.",
    "records.title": "Records d’énergie",
    "records.range7d": "7 jours",
    "records.range14d": "14 jours",
    "records.range30d": "30 jours",
    "records.rangeMonth": "Ce mois-ci",
    "records.rangeYear": "Cette année",
    "records.range356d": "356 jours",
    "records.consumerPeakPower": "{name}: plus grand pic de consommation",
    "records.counterLargestIncrease": "{name}: plus forte hausse quotidienne du compteur",
    "records.gridImport": "Import réseau",
    "records.gridExport": "Export réseau",
    "records.gridHighestCost": "{name}: coût d'import maximal",
    "records.gridBestRevenue": "{name}: revenus d'injection maximaux",
    "records.powerPeak": "{name}: plus grand pic de puissance",
    "records.pvBestYield": "{name}: meilleur rendement PV journalier",
    "records.pvPeakPower": "{name}: puissance PV maximale",
    "records.solarLongestHours": "{name}: plus longue durée de production solaire",
    "records.wallboxChargedEnergy": "{name}: énergie chargée maximale",
    "records.wallboxChargingEnabled": "{name}: plus longue durée de charge autorisée",
    "records.wallboxLongestCharge": "{name}: journée de charge la plus longue",
    "records.wallboxMaxSoc": "{name}: SoC véhicule maximal",
    "records.wallboxMaxSocLimit": "{name}: limite de charge maximale",
    "records.wallboxOnePhase": "{name}: plus longue durée en 1 phase",
    "records.wallboxPeakPower": "{name}: puissance de charge maximale",
    "records.wallboxPluggedIn": "{name}: plus longue durée branchée",
    "records.wallboxThreePhase": "{name}: plus longue durée en 3 phases",
    "records.sectionCounters": "Records de compteurs",
    "ev.groupControls": "Commande",
    "ev.modeControl": "Mode de charge",
    "ev.modeOff": "Arrêt",
    "ev.modePv": "PV",
    "ev.modeMinPv": "Min+PV",
    "ev.modeFast": "Rapide",
    "view.garden": "Jardin",
    "editor.tabGarden": "Jardin",
    "editor.showGarden": "Afficher la zone jardin",
    "editor.gardenSettings": "Réglages du jardin",
    "editor.gardenTitle": "Titre",
    "editor.gardenImage": "Image du jardin",
    "editor.gardenEntity": "Entité du jardin",
    "garden.title": "Jardin",
    "garden.subtitle": "Eau du jardin, météo, tondeuse et appareils",
    "garden.ready": "Prêt",
    "garden.empty": "Aucune entité de jardin configurée.",
    "garden.on": "Activé",
    "garden.off": "Désactivé",
    "garden.groupMower": "Tondeuse",
    "garden.groupWater": "Eau du jardin",
    "garden.groupWeather": "Météo et sol",
    "garden.groupEquipment": "Appareils du jardin",
    "garden.mowerStatus": "Tondeuse",
    "garden.mowerBattery": "Batterie tondeuse",
    "garden.mowerNextStart": "Prochaine tonte",
    "garden.mowerError": "Erreur tondeuse",
    "garden.gardenWater": "Eau du jardin",
    "garden.irrigationEnabled": "Arrosage actif",
    "garden.irrigationNextStart": "Prochain arrosage",
    "garden.irrigationRemaining": "Temps restant",
    "garden.waterFlow": "Débit d'eau",
    "garden.waterConsumptionToday": "Eau aujourd'hui",
    "garden.waterPressure": "Pression d'eau",
    "garden.cisternLevel": "Citerne",
    "garden.rain24h": "Pluie 24h",
    "garden.rainToday": "Pluie aujourd'hui",
    "garden.outdoorTemperature": "Extérieur",
    "garden.humidity": "Humidité",
    "garden.soilMoisture": "Humidité du sol",
    "garden.soilTemperature": "Température du sol",
    "garden.gardenLights": "Éclairage jardin",
    "garden.gardenOutlet": "Prise jardin",
    "garden.pondPump": "Pompe bassin",
    "garden.poolPump": "Pompe piscine"
  },
  "pl": {
    "aria.energyRangeSelector": "Wybierz zakres wartości",
    "aria.houseSelector": "Wybierz dom",
    "aria.viewSelector": "Wybierz widok panelu",
    "card.defaultTitle": "Przepływ energii",
    "advisor.action": "Akcja",
    "advisor.autarky": "Samowystarczalność",
    "advisor.actionHiddenToday": "Ukryte na dziś",
    "advisor.batteryIdle": "Battery is not charging while surplus is exported. Check battery limits or charge mode.",
    "advisor.batteryHighSocLong": "House battery has been between 90 and 100% for more than 120 minutes. Batteries should not stay that full for too long.",
    "advisor.batteryCyclesHigh": "House battery has completed several full cycles today. Frequent cycling can age the battery faster.",
    "advisor.batteryDeepSoc": "House battery SoC is very low. Protect the reserve and avoid additional flexible loads.",
    "advisor.batteryLow": "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible.",
    "advisor.batteryMaxReached": "Battery is at the configured max SoC. Additional PV is likely to be exported.",
    "advisor.batteryNearlyFull": "Battery is nearly full, so additional PV is likely to be exported.",
    "advisor.batteryReserveDischarging": "Battery is at or below reserve SoC and still discharging. Check min SoC or backup reserve settings.",
    "advisor.batteryStatus": "Bateria",
    "advisor.batteryTemperatureHigh": "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits.",
    "advisor.batteryTemperatureLow": "House battery temperature is low. Charging power may be limited and battery stress can increase.",
    "advisor.checkSensors": "Check unavailable or missing sensors so the energy balance stays reliable.",
    "advisor.configureConsumption": "Add a house consumption sensor to improve autarky and load analysis.",
    "advisor.configureGrid": "Add grid import/export sensors for better advice about surplus and grid draw.",
    "advisor.configurePvTotal": "Add PV total power or roof/shed PV sensors to improve production analysis.",
    "advisor.consumption": "Obciążenie",
    "advisor.detailEntities": "Encje",
    "advisor.detailEntityValue": "{entity} currently reports {value} for {label}. {impact}",
    "advisor.detailIntro": "The Advisor shows this as {priority} for {window}, because {reason}",
    "advisor.detailSignals": "Sygnały decyzyjne",
    "advisor.detailSources": "Źródła danych",
    "advisor.detailValues": "Wartości",
    "advisor.detailValueOnly": "{label} is currently {value}. {impact}",
    "advisor.detailWhy": "Dlaczego pojawia się ta wskazówka",
    "advisor.detailsToggle": "Pokaż szczegóły",
    "advisor.dismissToday": "Ukryj dziś",
    "advisor.evChargingGrid": "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended.",
    "advisor.evChargingPv": "EV charging is currently covered well by PV or stored energy.",
    "advisor.evEnableCharging": "Charging is currently disabled. Enable charging if you want to use the PV surplus.",
    "advisor.evPlugIn": "Plug in the vehicle to use PV surplus for charging.",
    "advisor.evPhaseChangeScheduled": "{action} in {duration} if the PV situation does not change.",
    "advisor.evSocAbove80Long": "Vehicle SoC is above 80% for more than 120 minutes. This can stress the battery if it stays there too long.",
    "advisor.evSocAbove90Long": "Vehicle SoC is above 90% for more than 60 minutes. Stop charging or lower the target SoC if the car will stay parked.",
    "advisor.evTargetReached": "Vehicle is already at the configured target SoC. Use surplus for another flexible load.",
    "advisor.evTargetReachedGrid": "Vehicle is at target SoC while the charger is still drawing power. Check the charge limit or stop charging.",
    "advisor.exporting": "Eksport",
    "advisor.grid": "Sieć",
    "advisor.gridImportExportSimultaneous": "Import and export sensors report power at the same time. Check whether the split grid sensors are mapped correctly.",
    "advisor.gridImportFullBattery": "Grid import is high although the house battery is full. Check discharge limits, backup reserve, or battery mode.",
    "advisor.headlineExport": "Dostępna jest nadwyżka PV",
    "advisor.headlineImport": "Aktywny jest pobór z sieci",
    "advisor.headlineInfo": "Dostępne informacje",
    "advisor.headlineNeutral": "Przepływ energii jest zrównoważony",
    "advisor.headlineSetup": "Więcej czujników daje lepsze wskazówki",
    "advisor.headlineWarning": "Konfiguracja energii wymaga uwagi",
    "advisor.highLoad": "Current load is high compared with PV production. Check large consumers if this is unexpected.",
    "advisor.importing": "Pobór",
    "advisor.priorityCritical": "Krytyczne",
    "advisor.priorityInfo": "Info",
    "advisor.priorityOpportunity": "Szansa",
    "advisor.prioritySetup": "Konfiguracja",
    "advisor.prioritySuccess": "OK",
    "advisor.priorityWarning": "Ostrzeżenie",
    "advisor.electricityPrice": "Cena energii",
    "advisor.lowPv": "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors.",
    "advisor.noAdvice": "Brak pilnych działań w tej chwili.",
    "advisor.appliances": "Urządzenia",
    "advisor.largeConsumerCovered": "Large consumers are running without relevant grid import.",
    "advisor.largeConsumerGrid": "{names} currently draw power while grid import is active. Shift them to PV surplus if possible.",
    "advisor.largeConsumerSurplus": "PV surplus can cover {names}. Start a ready large consumer while export is active.",
    "advisor.panelTitle": "Doradca energii",
    "advisor.pv": "PV",
    "advisor.recommendations": "Rekomendacje",
    "advisor.runAppliance": "Run a flexible household appliance now if it is waiting.",
    "advisor.sensorStaleMany": "{count} sensors have not updated recently. Check entity availability and recorder/update intervals.",
    "advisor.sensorStaleOne": "{name} has not updated for {duration}. Check entity availability and update interval.",
    "advisor.sensors": "Czujniki",
    "advisor.selfConsumption": "Zużycie własne",
    "advisor.selfSufficient": "Samowystarczalny",
    "advisor.startEvCharging": "Start or increase EV charging while surplus is available.",
    "advisor.status": "Status",
    "advisor.suggestionCountOne": "{count} sugestia",
    "advisor.suggestionCount": "{count} sugestii",
    "advisor.surplus": "Nadwyżka",
    "advisor.surplusGeneral": "PV surplus is available. Prioritize flexible loads while export is active.",
    "advisor.unknown": "Nieznane",
    "advisor.useHeatPump": "Use heat pump boost or preheat hot water while PV surplus is available.",
    "advisor.wallbox": "EV",
    "advisor.weather": "Pogoda",
    "advisor.windowAnytime": "Kiedykolwiek",
    "advisor.windowNext2h": "Następne 2 h",
    "advisor.windowNow": "Teraz",
    "advisor.reasonBattery": "Battery SoC {soc} is part of this recommendation.",
    "advisor.reasonEvSurplus": "PV surplus is above the configured EV threshold of {threshold}.",
    "advisor.reasonGridImport": "Grid import is above the configured import threshold of {threshold}.",
    "advisor.reasonLargeConsumer": "The available PV surplus can cover the configured consumer limit.",
    "advisor.reasonPhaseChange": "EVCC reports a planned phase change inside the next window.",
    "advisor.reasonSensor": "A configured entity is stale, unavailable, or inconsistent.",
    "advisor.reasonSurplus": "PV surplus is above the configured surplus threshold of {threshold}.",
    "advisor.reasonWeather": "Weather is included to separate low PV from expected conditions.",
    "advisor.reasonPrice": "The configured electricity price sensor is included in the decision context.",
    "advisor.impactAutarky": "That shows how independently the house is currently being supplied.",
    "advisor.impactBattery": "That value describes the current battery reserve and influences whether flexible loads are sensible right now.",
    "advisor.impactConsumer": "That value shows whether this consumer is active and how strongly it affects the energy balance.",
    "advisor.impactGrid": "That value decides whether the situation is treated as grid import, neutral, or PV surplus.",
    "advisor.impactLoad": "That value describes the current household load and helps classify whether consumption is unusually high.",
    "advisor.impactPv": "That value describes the current PV production and helps estimate how much energy is available.",
    "advisor.impactSelfConsumption": "That shows how much PV energy is being used locally instead of being exported.",
    "advisor.impactSensor": "That value is used as a diagnostic signal for sensor freshness and plausibility.",
    "advisor.impactSurplus": "That value shows how much power is currently available for flexible loads before it is exported.",
    "advisor.impactTemperature": "That value is used to detect possible battery stress or operating limits.",
    "advisor.impactWallbox": "That value describes the charger state and determines whether charging should start, stop, or wait.",
    "editor.showViewSelector": "Pokaż przełącznik widoku",
    "chart.close": "Zamknij",
    "chart.empty": "Nie znaleziono danych historii",
    "chart.error": "Nie udało się wczytać historii",
    "chart.loading": "Ładowanie historii…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Ostatnie {hours} godzin",
    "charts.count": "{count} wykresy",
    "charts.countOne": "{count} wykres",
    "charts.empty": "Nie skonfigurowano jeszcze encji z historią.",
    "charts.label": "Wykresy",
    "charts.openLarge": "Otwórz duży wykres",
    "charts.sectionPvStrings": "Stringi PV",
    "charts.sectionInverters": "Falowniki",
    "charts.sectionSystem": "Falownik i system",
    "charts.sectionWallbox": "Wallbox",
    "charts.title": "Historia encji",
    "editor.customDayImage": "Własny obraz dzienny",
    "editor.customImage": "Własny obraz",
    "editor.batteryChargeEntity": "Encja ładowania baterii",
    "editor.batteryCyclesTodayEntity": "Encja cykli baterii dziś",
    "editor.batteryDischargeEntity": "Encja rozładowania baterii",
    "editor.batteryFlowEntity": "Encja przepływu baterii (+/-)",
    "editor.batteryMaxSocEntity": "Encja maks. SoC baterii",
    "editor.batteryMinSocEntity": "Encja min. SoC baterii",
    "editor.batteryTemperatureEntity": "Encja temperatury baterii",
    "editor.entity": "Encja",
    "editor.entityPlaceholder": "Encja {label}",
    "editor.energy1hEntity": "Encja kWh 1h",
    "editor.energy24hEntity": "Encja kWh 24h",
    "editor.energyCounterEntity": "Encja licznika kWh",
    "editor.energyMonthEntity": "Encja kWh 1 miesiąc",
    "editor.energyRangeOverride": "Opcjonalne bezpośrednie sensory okresów",
    "editor.energyYearEntity": "Encja kWh 1 rok",
    "editor.energyTotalEntity": "Łączna encja kWh",
    "editor.liveEntity": "Encja na żywo",
    "editor.houseType": "Typ domu",
    "editor.hudBoxOpacity": "Przezroczystość pól HUD",
    "editor.hudBoxScale": "Skala pól HUD",
    "editor.advisorEvSurplusThreshold": "Próg nadwyżki PV dla EV (W)",
    "editor.electricityPriceEntity": "Encja ceny energii",
    "editor.gridVoltageCriticalThreshold": "Krytyczne napięcie sieci (V)",
    "editor.gridVoltageWarningThreshold": "Wysokie napięcie sieci (V)",
    "editor.importExportEntity": "Encja importu/eksportu",
    "editor.importExportSignedEntity": "Encja importu/eksportu ze znakiem (+/-)",
    "editor.importPowerEntity": "Encja importu",
    "editor.exportPowerEntity": "Encja eksportu",
    "editor.importExportLabels": "Etykiety importu/eksportu",
    "editor.importExportFinance": "Koszty importu/eksportu",
    "editor.importEnergyCounterEntity": "Licznik energii importowanej",
    "editor.exportEnergyCounterEntity": "Licznik energii eksportowanej",
    "editor.helpImportExportFinance": "Użyj skumulowanych liczników kWh. Karta liczy dzisiejszą wartość od lokalnej północy.",
    "editor.gridImportPrice": "Cena importu z sieci za kWh",
    "editor.gridExportPrice": "Taryfa oddawania do sieci za kWh",
    "editor.currency": "Waluta",
    "editor.showGridDailyFinance": "Pokaż dzisiejsze koszty i przychody jako etykiety",
    "editor.importLabel": "Etykieta importu",
    "editor.exportLabel": "Etykieta eksportu",
    "editor.neutralLabel": "Etykieta samowystarczalności",
    "editor.environmentAdd": "Dodaj kafelek",
    "editor.environmentEntity": "Encja czujnika",
    "editor.environmentLabel": "Etykieta czujnika",
    "editor.environmentShow": "Pokaż kafelek {label}",
    "editor.environmentShowFooter": "Pokaż pole w stopce",
    "editor.environmentShowImage": "Pokaż pole na obrazie",
    "editor.environmentTemplates": "Szablony środowiskowe",
    "editor.environmentUnit": "Wyświetlana jednostka",
    "editor.kpiAdd": "Dodaj kafelek",
    "editor.kpiColor": "Kolor",
    "editor.kpiColumns": "Szerokość kafelka",
    "editor.kpiEntity": "Encja KPI",
    "editor.kpiLabel": "Etykieta KPI",
    "editor.kpiPosition": "Pozycja kafelka",
    "editor.kpiRemove": "Usuń",
    "editor.kpiStaticValue": "Stała wartość",
    "editor.consumerEnergyEntity": "Encja licznika kWh",
    "editor.consumerLabel": "Nazwa urządzenia",
    "editor.consumerAddCustom": "Dodaj własny duży odbiornik",
    "editor.consumerPowerEntity": "Encja mocy",
    "editor.consumerShow": "Pokaż kafelek {label}",
    "editor.labelHideDesktop": "Ukryj na komputerze",
    "editor.labelHideMobile": "Ukryj na telefonie",
    "editor.labelOptions": "Wyświetlanie etykiet",
    "editor.labelShowFooter": "Pokaż etykietę w dolnych KPI",
    "editor.labelShowImage": "Pokaż etykietę na obrazie",
    "editor.maxPowerKw": "Maks. moc (kW/kWp)",
    "editor.optionalDayImage": "Opcjonalny obraz dzienny",
    "editor.helpCustomImages": "Zapisz własne obrazy w Home Assistant w /config/www/ i wpisz je jako /local/.... Gdy ustawiono weather_entity, pasujące sufiksy są sprawdzane automatycznie, na przykład /local/solar/house_day_rainy.png przed /local/solar/house_day.png.",
    "editor.powerDecimals": "Miejsca dziesiętne mocy",
    "editor.powerDisplayMode": "Tryb wyświetlania mocy",
    "editor.rawMode": "Wartość surowa + skonfigurowana jednostka",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.advisorMaxSuggestions": "Sugestie doradcy",
    "editor.overlayEnable": "Pokaż {label}",
    "editor.overlayLabel": "Etykieta",
    "editor.overlayOrientation": "Orientacja",
    "editor.overlayOrientationLeft": "Lewa strona",
    "editor.overlayOrientationRight": "Prawa strona",
    "editor.overlayPeriod": "Okres",
    "editor.overlaySize": "Rozmiar",
    "editor.period1h": "1 godzina",
    "editor.period24h": "24 godziny",
    "editor.period30m": "30 minut",
    "editor.phaseActionEntity": "Encja następnej akcji faz",
    "editor.phaseEntity": "Encja faz",
    "editor.phaseRemainingEntity": "Encja pozostałych sekund faz",
    "editor.pvForecastTodayEntity": "Encja prognozy na dziś",
    "editor.pvLabels": "Etykiety PV",
    "editor.pvPeakTodayEntity": "Encja szczytu dziś",
    "editor.pvPowerLabel": "Etykieta mocy",
    "editor.pvRoofStringAdd": "Dodaj string",
    "editor.pvRoofStringDisplay": "Wyświetlanie stringów PV dachu",
    "editor.pvRoofStringDisplayDominant": "Najmocniejszy string duży, inne małe",
    "editor.pvRoofStringDisplaySum": "Sumuj stringi",
    "editor.pvRoofStringDisplayValues": "Pokaż wartości stringów",
    "editor.pvRoofStringEnergyEntity": "Encja licznika kWh stringu",
    "editor.pvRoofStringLabel": "Nazwa stringu",
    "editor.pvRoofStringPowerEntity": "Encja mocy stringu",
    "editor.pvRoofStrings": "Stringi PV dachu",
    "editor.inverterAdd": "Dodaj falownik",
    "editor.inverterDisplay": "Wyświetlanie falowników",
    "editor.inverterDisplayDominant": "Najmocniejszy falownik duży, inne małe",
    "editor.inverterDisplaySum": "Sumuj falowniki",
    "editor.inverterDisplayValues": "Pokaż wartości falowników",
    "editor.inverterEnergyEntity": "Encja licznika kWh falownika",
    "editor.inverterLabel": "Nazwa falownika",
    "editor.inverterPowerEntity": "Encja mocy falownika",
    "editor.inverters": "Falowniki",
    "editor.pvTodayEnergyEntity": "Encja produkcji dziś",
    "editor.remainingChargeTimeEntity": "Encja pozostałego czasu ładowania",
    "editor.vehicleChargingEnabledEntity": "Encja ładowania włączonego",
    "editor.vehicleConnectedEntity": "Encja pojazdu podłączonego",
    "editor.vehicleMaxSocEntity": "Encja maks./docelowego SoC pojazdu",
    "editor.vehicleSocEntity": "Encja SoC pojazdu",
    "editor.sectionBoxes": "Pola, encje na żywo/kWh, jednostka i pozycja",
    "editor.sectionAdvisor": "Doradca i ceny",
    "editor.sectionAppearance": "Wyświetlanie i limity",
    "editor.sectionGeneral": "Ustawienia ogólne",
    "editor.sectionKpis": "Własne kafelki KPI",
    "editor.sectionEnvironmentSensors": "Czujniki środowiskowe",
    "editor.sectionLargeConsumers": "Dodatkowe duże odbiorniki",
    "editor.sectionOverlays": "Nakładki obrazu",
    "editor.sectionDashboardAreas": "Obszary panelu",
    "editor.showBox": "Pokaż {label}",
    "editor.showAdvisor": "Pokaż panel doradcy",
    "editor.showCharts": "Pokaż panel wykresów",
    "editor.showElectricVehicle": "Pokaż obszar auta elektrycznego",
    "editor.showEnergyRangeSelector": "Pokaż wybór na żywo/1h/24h/miesiąc/rok/łącznie",
    "editor.showHouseSelector": "Pokaż wybór domu",
    "editor.showEnvironmentSensors": "Pokaż kafelki czujników środowiskowych",
    "editor.showLargeConsumers": "Pokaż duże odbiorniki w widoku domu",
    "editor.showRecords": "Pokaż panel rekordów",
    "editor.showGridStatusTile": "Pokaż kafelek sieci",
    "editor.showMetricTiles": "Pokaż pola metryk pod obrazem",
    "editor.showPowerFlows": "Pokaż animowane przepływy energii",
    "editor.showStatusLabel": "Pokaż etykietę statusu na obrazie",
    "editor.showTitle": "Pokaż tytuł",
    "editor.showWeatherStatus": "Pokaż aktualną pogodę w etykiecie statusu",
    "editor.title": "Tytuł",
    "editor.tabSetup": "Konfiguracja",
    "editor.tabEnergy": "Energia",
    "editor.tabDevices": "Urządzenia",
    "editor.tabEnvironment": "Środowisko",
    "editor.tabFloorplan": "Plan",
    "editor.tabLayout": "Układ",
    "editor.tabAppearance": "Wygląd",
    "editor.tabAdvisor": "Doradca",
    "editor.tabAdvanced": "Zaawansowane",
    "editor.tabs": "Sekcje konfiguracji",
    "editor.statusConfigured": "{configured}/{total} skonfigurowane",
    "editor.statusConfiguredCount": "{count} skonfigurowane",
    "editor.statusHidden": "{count} ukryte",
    "editor.statusMissing": "brakuje {count}",
    "editor.statusAdvanced": "Opcje zaawansowane aktywne",
    "editor.statusReady": "Gotowe",
    "editor.layoutMode": "Tryb układu",
    "editor.layoutHelp": "Kliknij pole w podglądzie, a następnie dopasuj pozycję X/Y.",
    "editor.layoutSelected": "Wybrane pole",
    "editor.layoutEmpty": "Włącz pola obrazu lub nakładki, aby edytować tutaj ich pozycje.",
    "editor.layoutTypeBox": "Pole",
    "editor.layoutTypeOverlay": "Nakładka",
    "editor.layoutTypeEnvironment": "Środowisko",
    "editor.sectionFloorplan": "Edytor planu",
    "editor.floorplanHelp": "Wybierz narzędzie, kliknij siatkę, a następnie dopasuj wybrany element.",
    "editor.showFloorplan": "Pokaż plan",
    "editor.floorplanShowGrid": "Pokaż siatkę",
    "editor.floorplanTools": "Narzędzia planu",
    "editor.floorplanToolRoom": "Pomieszczenie",
    "editor.floorplanToolWall": "Ściana",
    "editor.floorplanToolSensor": "Czujnik",
    "editor.floorplanSelected": "Wybrany element",
    "editor.floorplanLabel": "Etykieta",
    "editor.floorplanWidth": "Szerokość",
    "editor.floorplanHeight": "Wysokość",
    "editor.floorplanDelete": "Usuń wybrane",
    "editor.floorplanMode": "Typ planu",
    "editor.floorplanModeEditor": "Edytor planu",
    "editor.floorplanModeImage": "Obraz",
    "editor.floorplanFloors": "Poziomy",
    "editor.floorplanAddFloor": "+ Dodaj poziom",
    "editor.floorplanFloorLabel": "Nazwa poziomu",
    "editor.floorplanImagePath": "Ścieżka obrazu",
    "editor.floorplanCustomEntity": "Użyj własnej encji",
    "editor.floorplanSensorType": "Typ czujnika",
    "editor.floorplanSensorSource": "Użyj czujnika środowiska",
    "editor.floorplanEntity": "Encja",
    "editor.floorplanShowSensorLabel": "Pokaż etykietę",
    "editor.floorplanFontSize": "Rozmiar tekstu",
    "editor.floorplanEmpty": "Kliknij siatkę, aby utworzyć wybrany element.",
    "editor.floorplanImagePathHelp": "Przykład: skopiuj parter.png do /config/www/plan/parter.png i wpisz tutaj /local/plan/parter.png. Możesz też użyć pełnego adresu URL obrazu https://.",
    "editor.helpFloorplanImagePath": "Zapisz obraz w Home Assistant w /config/www/ i wpisz go jako /local/..., na przykład /local/plan/poziom-1.png. Pełne adresy https:// też są obsługiwane.",
    "editor.helpFloorplanSensorSource": "Opcjonalnie: użyj ponownie czujnika z karty Środowisko. Pozostaw własną encję, aby wybrać poniżej bezpośrednio encję Home Assistant.",
    "editor.helpHomeAssistantSensor": "Wybierz encję Home Assistant, która dostarcza tę wartość.",
    "editor.helpUnitAuto": "Użyj Auto, aby wyświetlić jednostkę zgłaszaną przez Home Assistant. Wybierz inną tylko wtedy, gdy chcesz ją nadpisać.",
    "editor.helpEnergyCounter": "Opcjonalny licznik energii skumulowanej dla widoków 1h, 24h, miesiąc, rok i łącznie.",
    "editor.helpSignedGrid": "Użyj czujnika, w którym wartości dodatnie oznaczają import, a ujemne eksport. Pozostaw puste, jeśli używasz osobnych czujników.",
    "editor.helpSignedBattery": "Jeśli to możliwe, użyj czujnika ze znakiem: dodatni oznacza ładowanie, ujemny rozładowanie.",
    "editor.helpFooterOrder": "Steruje kolejnością kafelków pod obrazem. Niższe liczby pojawiają się wcześniej.",
    "editor.helpTileWidth": "Steruje szerokością kafelka dolnego na komputerze. Na telefonie szerokość jest ograniczana automatycznie.",
    "editor.helpImagePosition": "Pozycja pola na wybranym obrazie w procentach.",
    "editor.helpEnvironmentFooter": "Pokazuje ten czujnik jako kafelek w sekcji Środowisko pod obrazem.",
    "editor.helpEnvironmentImage": "Pokazuje ten czujnik jako skalowalne pole HUD na obrazie domu.",
    "editor.helpMaxPower": "Używane tylko dla paska wykorzystania i kontroli obciążenia doradcy.",
    "editor.unit": "Jednostka",
    "editor.voltageEntity": "Encja napięcia",
    "editor.voltageEntityL1": "Encja napięcia L1",
    "editor.voltageEntityL2": "Encja napięcia L2",
    "editor.voltageEntityL3": "Encja napięcia L3",
    "editor.viewMode": "Widok domyślny",
    "editor.weatherEntity": "Encja pogody",
    "editor.setupWizard": "Kreator konfiguracji",
    "editor.setupIntro": "Pomaga w pierwszej konfiguracji, sugerując czujniki PV, baterii, falownika, ładowarki EV, sieci, zużycia, pogody i liczników kWh.",
    "editor.setupHelp": "Sprawdź sugestie przed zastosowaniem. Użyj „Wypełnij puste pola” jako bezpiecznego pierwszego kroku albo „Zastąp wykryte pola”, jeśli chcesz nadpisać istniejące przypisania.",
    "editor.setupEntityCount": "{count} dostępnych encji",
    "editor.setupNoEntities": "Otwórz ten edytor w Home Assistant, aby wykryć encje.",
    "editor.setupFillEmpty": "Wypełnij puste pola",
    "editor.setupReplaceAll": "Zastąp wykryte pola",
    "editor.setupSuggestions": "Wykryte sugestie",
    "editor.setupNoSuggestions": "Nie znaleziono jeszcze mocnych dopasowań.",
    "editor.setupApplyOne": "Użyj",
    "editor.setupCurrent": "Obecnie",
    "editor.setupSuggested": "Sugerowane",
    "editor.setupConfidence": "{score}% dopasowania",
    "editor.setupApplied": "Zastosowano {count} sugestii.",
    "editor.setupApplyNone": "Nie zmieniono pustych pól.",
    "editor.xPosition": "Pozycja X",
    "editor.yPosition": "Pozycja Y",
    "flow.charge": "Przychodzące",
    "flow.discharge": "Wychodzące",
    "consumer.custom": "Własny",
    "consumer.customLarge": "Własny duży odbiornik",
    "consumer.dhw_heatpump": "Pompa ciepła CWU",
    "consumer.dishwasher": "Zmywarka",
    "consumer.dryer": "Suszarka",
    "consumer.sectionTitle": "Dodatkowe duże odbiorniki",
    "consumer.space_heater": "Termowentylator",
    "consumer.washing_machine": "Pralka",
    "environment.sectionTitle": "Środowisko",
    "environment.sensor": "Środowisko {index}",
    "environment.templateIndoor": "Temperatura wewnętrzna",
    "environment.templateOutdoor": "Temperatura zewnętrzna",
    "environment.templateHotWater": "Ciepła woda",
    "environment.templateHumidity": "Wilgotność",
    "environment.templatePressure": "Ciśnienie",
    "environment.templateAirQuality": "Jakość powietrza",
    "environment.templateCustom": "Własny",
    "floorplan.counts": "{rooms} pomieszczeń · {sensors} czujników",
    "floorplan.empty": "Utwórz pomieszczenia, ściany i czujniki w edytorze karty.",
    "floorplan.imageEmpty": "Wpisz ścieżkę obrazu dla tego poziomu.",
    "floorplan.label": "Plan",
    "floorplan.level": "Poziom {index}",
    "floorplan.room": "Pomieszczenie {index}",
    "floorplan.sensor": "Czujnik {index}",
    "floorplan.title": "Plan domu",
    "floorplan.wall": "Ściana {index}",
    "house.apartment_building": "Budynek wielorodzinny",
    "house.apartment_building_balcony_solar": "Budynek wielorodzinny z fotowoltaiką balkonową",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Willa miejska",
    "house.city_villa_pitched_roof": "Willa miejska z dachem spadzistym",
    "house.duplex_house": "Dom bliźniaczy",
    "house.single_family_home": "Dom jednorodzinny",
    "house.terraced_middle_house": "Środkowy dom szeregowy",
    "metrics.battery_level": "Bateria",
    "metrics.grid_status": "Sieć",
    "metrics.house_consumption_power": "Zużycie",
    "metrics.import_export_power": "Import/eksport",
    "metrics.inverter_power": "Falownik",
    "metrics.pv_power": "Moc PV",
    "metrics.pv_roof_power": "PV dach",
    "metrics.pv_shed_power": "PV szopa",
    "metrics.pv_total_power": "PV łącznie",
    "metrics.water_meter": "Woda",
    "metrics.wallbox_power": "Ładowarka EV",
    "metrics.wallbox2_power": "Ładowarka EV 2",
    "overlay.heatpump": "Pompa ciepła",
    "overlay.smoke": "Gaz",
    "phase.auto": "Auto",
    "phase.many": "{count} fazy",
    "phase.one": "1 faza",
    "pvLabel.forecastToday": "Prognoza dziś",
    "pvLabel.peakToday": "Szczyt dziś",
    "pvLabel.power": "Moc",
    "pvLabel.todayEnergy": "Wyprodukowano dziś",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Na żywo",
    "range.month": "1 miesiąc",
    "range.total": "Łącznie",
    "range.year": "1 rok",
    "status.export": "Eksport",
    "status.import": "Import",
    "status.lastUpdated": "Ostatnia aktualizacja: {time}",
    "status.selfSufficient": "Samowystarczalny",
    "status.weather": "Pogoda: {weather}",
    "tooltip.entity": "Encja",
    "tooltip.flow": "Przepływ",
    "tooltip.load": "Wykorzystanie",
    "tooltip.max": "Maksimum",
    "tooltip.phases": "Fazy",
    "tooltip.phaseChange": "Nadchodząca zmiana faz",
    "tooltip.raw": "Wartość surowa",
    "tooltip.remainingChargeTime": "Pozostały czas ładowania",
    "tooltip.status": "Status",
    "tooltip.temperature": "Temperatura",
    "tooltip.updated": "Zaktualizowano",
    "tooltip.value": "Wartość",
    "tooltip.vehicleSoc": "SoC pojazdu",
    "tooltip.voltage": "Napięcie",
    "value.remainingChargeTime": "Pozostało {value}",
    "value.phaseChangeIn": "{action} za {duration}",
    "value.temperature": "Temp {value}",
    "value.soon": "wkrótce",
    "view.advisor": "Panel doradcy",
    "view.house": "Widok domu",
    "view.floorplan": "Plan",
    "view.charts": "Wykresy",
    "weather.clear": "Bezchmurnie",
    "weather.clear-night": "Bezchmurnie",
    "weather.cloudy": "Pochmurno",
    "weather.fog": "Mgła",
    "weather.hail": "Grad",
    "weather.lightning": "Burza",
    "weather.lightning-rainy": "Burza z deszczem",
    "weather.partlycloudy": "Częściowe zachmurzenie",
    "weather.pouring": "Ulewa",
    "weather.rainy": "Deszczowo",
    "weather.snowy": "Śnieg",
    "weather.snowy-rainy": "Deszcz ze śniegiem",
    "weather.sunny": "Słonecznie",
    "weather.windy": "Wietrznie",
    "weather.windy-variant": "Wietrznie/pochmurno",
    "warning.batteryLow": "Niski poziom baterii",
    "warning.gridVoltageCritical": "Napięcie sieci zdecydowanie za wysokie",
    "warning.gridVoltageHigh": "Wysokie napięcie sieci",
    "warning.sensorMissing": "Nie znaleziono encji",
    "warning.sensorOffline": "Sensor offline",
    "warning.sensorUnavailable": "Sensor niedostępny",
    "gridFinance.importCost": "Koszt dzisiaj",
    "gridFinance.exportRevenue": "Przychód dzisiaj",
    "view.records": "Rekordy",
    "records.count": "{count} rekordów",
    "records.countOne": "{count} rekord",
    "records.days": "{days} dni",
    "records.empty": "Brak historii możliwej do oceny.",
    "records.error": "Nie udało się wczytać rekordów.",
    "records.label": "Najlepsze wyniki",
    "records.loadingCount": "{count} encji",
    "records.loadingCountOne": "{count} encja",
    "records.loadingPurposeConsumerPower": "Szczyt poboru",
    "records.loadingPurposeCounter": "Dzienny przyrost licznika",
    "records.loadingPurposeGridFinance": "Koszty i przychody sieciowe",
    "records.loadingPurposePower": "Szczyt mocy",
    "records.loadingPurposePvEnergy": "Dzienny uzysk PV",
    "records.loadingPurposePvPower": "Moc PV i godziny solarne",
    "records.loadingPurposeWallboxChargingEnabled": "Czas włączonego ładowania wallboxa",
    "records.loadingPurposeWallboxEnergy": "Energia ładowania wallboxa",
    "records.loadingPurposeWallboxMaxSocLimit": "Limit ładowania wallboxa",
    "records.loadingPurposeWallboxPhase": "Historia faz wallboxa",
    "records.loadingPurposeWallboxPluggedIn": "Czas podłączenia wallboxa",
    "records.loadingPurposeWallboxPower": "Moc ładowania wallboxa",
    "records.loadingPurposeWallboxSoc": "SoC pojazdu wallboxa",
    "records.loadingTitle": "Pobieranie historii",
    "records.loading": "Ładowanie rekordów…",
    "records.sectionPeaks": "Szczyty mocy",
    "records.sectionPvEnergy": "Najlepszy uzysk PV na string",
    "records.sectionSolarHours": "Najdłuższe godziny solarne",
    "records.sectionWallbox": "Rekordy wallboxa",
    "records.sectionFinance": "Koszty i przychody",
    "records.subtitle": "Najlepsze wartości dla {range} z historii Home Assistant.",
    "records.title": "Rekordy energii",
    "records.range7d": "7 dni",
    "records.range14d": "14 dni",
    "records.range30d": "30 dni",
    "records.rangeMonth": "Ten miesiąc",
    "records.rangeYear": "Ten rok",
    "records.range356d": "356 dni",
    "records.consumerPeakPower": "{name}: najwyższy szczyt poboru",
    "records.counterLargestIncrease": "{name}: największy dzienny przyrost licznika",
    "records.gridImport": "Import z sieci",
    "records.gridExport": "Eksport do sieci",
    "records.gridHighestCost": "{name}: najwyższy koszt importu",
    "records.gridBestRevenue": "{name}: najwyższy przychód z oddawania",
    "records.powerPeak": "{name}: najwyższy szczyt mocy",
    "records.pvBestYield": "{name}: najlepszy dzienny uzysk PV",
    "records.pvPeakPower": "{name}: najwyższa moc PV",
    "records.solarLongestHours": "{name}: najdłuższy czas produkcji solarnej",
    "records.wallboxChargedEnergy": "{name}: najwięcej naładowanej energii",
    "records.wallboxChargingEnabled": "{name}: najdłuższy czas włączonego ładowania",
    "records.wallboxLongestCharge": "{name}: najdłuższy dzień ładowania",
    "records.wallboxMaxSoc": "{name}: najwyższy SoC pojazdu",
    "records.wallboxMaxSocLimit": "{name}: najwyższy limit ładowania",
    "records.wallboxOnePhase": "{name}: najdłuższy czas 1-fazowy",
    "records.wallboxPeakPower": "{name}: najwyższa moc ładowania",
    "records.wallboxPluggedIn": "{name}: najdłuższy czas podłączenia",
    "records.wallboxThreePhase": "{name}: najdłuższy czas 3-fazowy",
    "records.sectionCounters": "Rekordy liczników",
    "ev.groupControls": "Sterowanie",
    "ev.modeControl": "Tryb ładowania",
    "ev.modeOff": "Wył.",
    "ev.modePv": "PV",
    "ev.modeMinPv": "Min+PV",
    "ev.modeFast": "Szybko",
    "view.garden": "Ogród",
    "editor.tabGarden": "Ogród",
    "editor.showGarden": "Pokaż obszar ogrodu",
    "editor.gardenSettings": "Ustawienia ogrodu",
    "editor.gardenTitle": "Tytuł",
    "editor.gardenImage": "Obraz ogrodu",
    "editor.gardenEntity": "Encja ogrodu",
    "garden.title": "Ogród",
    "garden.subtitle": "Woda ogrodowa, pogoda, kosiarka i urządzenia",
    "garden.ready": "Gotowe",
    "garden.empty": "Brak skonfigurowanych encji ogrodu.",
    "garden.on": "Wł.",
    "garden.off": "Wył.",
    "garden.groupMower": "Kosiarka",
    "garden.groupWater": "Woda ogrodowa",
    "garden.groupWeather": "Pogoda i gleba",
    "garden.groupEquipment": "Urządzenia ogrodu",
    "garden.mowerStatus": "Kosiarka",
    "garden.mowerBattery": "Akumulator kosiarki",
    "garden.mowerNextStart": "Następne koszenie",
    "garden.mowerError": "Błąd kosiarki",
    "garden.gardenWater": "Woda ogrodowa",
    "garden.irrigationEnabled": "Nawadnianie aktywne",
    "garden.irrigationNextStart": "Następne nawadnianie",
    "garden.irrigationRemaining": "Pozostały czas",
    "garden.waterFlow": "Przepływ wody",
    "garden.waterConsumptionToday": "Woda dzisiaj",
    "garden.waterPressure": "Ciśnienie wody",
    "garden.cisternLevel": "Cysterna",
    "garden.rain24h": "Deszcz 24h",
    "garden.rainToday": "Deszcz dzisiaj",
    "garden.outdoorTemperature": "Na zewnątrz",
    "garden.humidity": "Wilgotność",
    "garden.soilMoisture": "Wilgotność gleby",
    "garden.soilTemperature": "Temperatura gleby",
    "garden.gardenLights": "Oświetlenie ogrodu",
    "garden.gardenOutlet": "Gniazdo ogrodowe",
    "garden.pondPump": "Pompa stawu",
    "garden.poolPump": "Pompa basenu"
  }
};
const I18N_LOADS = new Map();

const PV_LABELS = [
  { suffix: "today_energy", labelKey: "pvLabel.todayEnergy", editorKey: "editor.pvTodayEnergyEntity", source: "entity", unit: "energy" },
  { suffix: "forecast_today", labelKey: "pvLabel.forecastToday", editorKey: "editor.pvForecastTodayEntity", source: "entity", unit: "energy" },
  { suffix: "peak_today", labelKey: "pvLabel.peakToday", editorKey: "editor.pvPeakTodayEntity", source: "entity", unit: "power" },
];

function scriptAssetBaseUrl() {
  const currentScriptUrl = globalThis.document?.currentScript?.src;
  if (currentScriptUrl) return currentScriptUrl;
  const scripts = Array.from(globalThis.document?.querySelectorAll?.("script[src]") || []);
  const script = scripts
    .map((element) => element.src || element.getAttribute?.("src") || "")
    .reverse()
    .find((src) => /ha-solar-dashboard(?:-editor)?(?:\.js|\/)/.test(src));
  return script || globalThis.location?.href || "http://localhost/";
}

function assetUrl(path) {
  return new URL(path, scriptAssetBaseUrl()).href;
}

function translationUrl(language) {
  return assetUrl(`i18n/${language}.json`);
}

function loadTranslation(language) {
  const normalizedLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
  if (I18N[normalizedLanguage]) return Promise.resolve(I18N[normalizedLanguage]);
  if (I18N_LOADS.has(normalizedLanguage)) return I18N_LOADS.get(normalizedLanguage);
  if (typeof fetch !== "function") {
    I18N[normalizedLanguage] = {};
    return Promise.resolve(I18N[normalizedLanguage]);
  }
  const request = fetch(translationUrl(normalizedLanguage))
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((dictionary) => {
      I18N[normalizedLanguage] = dictionary || {};
      return I18N[normalizedLanguage];
    })
    .catch((error) => {
      console.warn(`HA Solar Dashboard: could not load i18n/${normalizedLanguage}.json`, error);
      I18N[normalizedLanguage] = {};
      return I18N[normalizedLanguage];
    })
    .finally(() => I18N_LOADS.delete(normalizedLanguage));
  I18N_LOADS.set(normalizedLanguage, request);
  return request;
}

function ensureTranslations(language, callback) {
  const normalizedLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
  if (I18N[normalizedLanguage]) return;
  loadTranslation(normalizedLanguage).then(callback);
}

function languageFromHass(hass) {
  const candidates = [
    hass?.locale?.language,
    hass?.locale?.languageCode,
    hass?.language,
    hass?.selectedLanguage,
    globalThis.document?.documentElement?.lang,
    globalThis.localStorage?.getItem?.("selectedLanguage"),
    globalThis.localStorage?.getItem?.("language"),
    ...(Array.isArray(globalThis.navigator?.languages) ? globalThis.navigator.languages : []),
    globalThis.navigator?.language,
  ];
  for (const candidate of candidates) {
    const language = String(candidate || "").toLowerCase().split(/[-_]/)[0];
    if (SUPPORTED_LANGUAGES.includes(language)) return language;
  }
  return DEFAULT_LANGUAGE;
}

function translate(language, key, replacements = {}, fallback = "") {
  const dictionary = I18N[language] || {};
  const fallbackDictionary = I18N[DEFAULT_LANGUAGE] || {};
  const template = dictionary[key] ?? fallbackDictionary[key] ?? (fallback !== "" ? fallback : key);
  return String(template).replace(/\{(\w+)\}/g, (_match, name) => replacements[name] ?? "");
}

const HaSolarDashboardCardEditorPanel = createDashboardEditorClass({
  ADVISOR_DEFAULTS,
  DEFAULT_ELECTRIC_VEHICLE_IMAGE,
  DEFAULT_GARDEN_IMAGE,
  DEFAULT_IMAGE_OVERLAYS,
  DEFAULT_TILE_COLOR_RULES,
  ELECTRIC_VEHICLE_ENTITY_DEFINITIONS,
  GARDEN_ENTITY_DEFINITIONS,
  HOUSE_VARIANTS,
  IMAGE_OVERLAY_KEYS,
  PV_LABELS,
  TILE_METRICS,
  VIEW_MODE_OPTIONS,
  adjacentWallboxPosition,
  assetUrl,
  clampConfigNumber,
  createEditorBaseConfig,
  ensureTranslations,
  findMetricByKey,
  htmlTag,
  inverterPhaseVoltageEntityKeys,
  isPvMetric,
  languageFromHass,
  largeConsumerLabel,
  metricVoltageEntityKey,
  normalizeAdvisorConfig,
  normalizeElectricVehicleConfig,
  normalizeGardenConfig,
  normalizeHouse,
  normalizeInverterDisplay,
  normalizeInverters,
  normalizeLargeConsumers,
  normalizePvRoofStringDisplay,
  normalizePvRoofStrings,
  parsePowerLimitWatts,
  rawHtml,
  translate,
  wallboxChargingEnabledEntityKey,
  wallboxConnectedEntityKey,
  wallboxMaxSocEntityKey,
  wallboxPhaseActionEntityKey,
  wallboxPhaseEntityKey,
  wallboxPhaseRemainingEntityKey,
  wallboxRemainingTimeEntityKey,
  wallboxSocEntityKey,
});

function registerEditorElement(type, elementClass) {
  const existingClass = customElements.get(type);
  if (!existingClass) {
    customElements.define(type, elementClass);
    return;
  }

  Object.getOwnPropertyNames(elementClass.prototype).forEach((name) => {
    if (name === "constructor") return;
    Object.defineProperty(existingClass.prototype, name, Object.getOwnPropertyDescriptor(elementClass.prototype, name));
  });
}

registerEditorElement(CARD_EDITOR_PANEL_TYPE, HaSolarDashboardCardEditorPanel);
