export const DEFAULT_CURRENCY = "€";
const DEFAULT_EV_IMAGE_PATH = "images/car_image.png";
const DEFAULT_GARDEN_IMAGE_PATH = "images/single_family_home_top_view_garden.png";
const REGION_PROFILE_VALUES = Object.freeze(["auto", "eu", "us"]);
const UNIT_SYSTEM_VALUES = Object.freeze(["auto", "metric", "us"]);

export const DEFAULT_GRID_FINANCE_CONFIG = Object.freeze({
  grid_import_price: "",
  grid_export_price: "",
  currency: DEFAULT_CURRENCY,
  currency_position: "auto",
  show_grid_daily_finance: true,
});

function hasOwnValue(source, key) {
  return Object.prototype.hasOwnProperty.call(source || {}, key)
    && source[key] !== undefined
    && source[key] !== null
    && String(source[key]).trim() !== "";
}

function hasOwnUnit(source, key) {
  return hasOwnValue(source?.units || {}, key);
}

export function normalizeRegionProfile(value) {
  const normalized = String(value || "auto").trim().toLowerCase().replace(/[\s_-]+/g, "_");
  if (["usa", "america", "american", "north_america", "united_states", "united_states_of_america"].includes(normalized)) return "us";
  if (["europe", "european", "de", "deutschland", "germany", "eu_metric"].includes(normalized)) return "eu";
  return REGION_PROFILE_VALUES.includes(normalized) ? normalized : "auto";
}

export function normalizeUnitSystem(value) {
  const normalized = String(value || "auto").trim().toLowerCase().replace(/[\s_-]+/g, "_");
  if (["imperial", "us_customary", "usa", "american"].includes(normalized)) return "us";
  if (["eu", "europe", "metric_system"].includes(normalized)) return "metric";
  return UNIT_SYSTEM_VALUES.includes(normalized) ? normalized : "auto";
}

function unitSystemForRegion(regionProfile, unitSystem) {
  if (unitSystem !== "auto") return unitSystem;
  if (regionProfile === "us") return "us";
  if (regionProfile === "eu") return "metric";
  return "auto";
}

export function applyRegionalDefaults(config = {}, explicitConfig = config) {
  const regionProfile = normalizeRegionProfile(explicitConfig.region_profile ?? explicitConfig.region ?? config.region_profile);
  const configuredUnitSystem = normalizeUnitSystem(explicitConfig.unit_system ?? explicitConfig.measurement_system ?? config.unit_system);
  const resolvedUnitSystem = unitSystemForRegion(regionProfile, configuredUnitSystem);
  const next = {
    ...config,
    region_profile: regionProfile,
    unit_system: configuredUnitSystem,
    units: { ...(config.units || {}) },
  };

  if (regionProfile === "us") {
    if (!hasOwnValue(explicitConfig, "currency") && !hasOwnValue(explicitConfig, "grid_currency")) next.currency = "$";
    if (!hasOwnValue(explicitConfig, "currency_position") && !hasOwnValue(explicitConfig, "grid_currency_position")) next.currency_position = "prefix";
  } else if (regionProfile === "eu") {
    if (!hasOwnValue(explicitConfig, "currency") && !hasOwnValue(explicitConfig, "grid_currency")) next.currency = "€";
    if (!hasOwnValue(explicitConfig, "currency_position") && !hasOwnValue(explicitConfig, "grid_currency_position")) next.currency_position = "suffix";
  }

  if (resolvedUnitSystem === "us") {
    if (!hasOwnUnit(explicitConfig, "volume")) next.units.volume = "gal";
    if (!hasOwnUnit(explicitConfig, "water_meter")) next.units.water_meter = "gal";
    if (!hasOwnUnit(explicitConfig, "temperature")) next.units.temperature = "°F";
    if (!hasOwnUnit(explicitConfig, "precipitation")) next.units.precipitation = "in";
    if (!hasOwnUnit(explicitConfig, "pressure")) next.units.pressure = "psi";
    if (!hasOwnUnit(explicitConfig, "flow")) next.units.flow = "gal/min";
    if (!hasOwnUnit(explicitConfig, "distance")) next.units.distance = "mi";
  } else if (resolvedUnitSystem === "metric") {
    if (!hasOwnUnit(explicitConfig, "volume")) next.units.volume = "m³";
    if (!hasOwnUnit(explicitConfig, "water_meter")) next.units.water_meter = "m³";
    if (!hasOwnUnit(explicitConfig, "temperature")) next.units.temperature = "°C";
    if (!hasOwnUnit(explicitConfig, "precipitation")) next.units.precipitation = "mm";
    if (!hasOwnUnit(explicitConfig, "pressure")) next.units.pressure = "bar";
    if (!hasOwnUnit(explicitConfig, "flow")) next.units.flow = "L/min";
    if (!hasOwnUnit(explicitConfig, "distance")) next.units.distance = "km";
  }

  return next;
}

export function createDefaultFloorplan(label = "Level 1") {
  return {
    mode: "editor",
    show_grid: true,
    active_floor: "level_1",
    floors: [{ id: "level_1", label, image: "", rooms: [], walls: [], sensors: [] }],
  };
}

export function createDefaultImageOverlays() {
  return {
    smoke: { enabled: false, entity: "", period: "1h" },
    heatpump: { enabled: false, entity: "" },
  };
}

export function createDefaultUnits() {
  return {
    power: "auto",
    battery: "%",
    volume: "m³",
    temperature: "°C",
    precipitation: "mm",
    pressure: "bar",
    flow: "L/min",
    distance: "km",
  };
}

export function createDefaultElectricVehicleConfig() {
  return {
    title: "",
    image: DEFAULT_EV_IMAGE_PATH,
    day_image: "",
    night_image: "",
    wallbox: "wallbox_power",
    evcc_loadpoint: "",
    evcc_prefix: "evcc",
    entities: {},
    display: {},
  };
}

export function createDefaultGardenConfig() {
  return {
    title: "",
    image: DEFAULT_GARDEN_IMAGE_PATH,
    day_image: "",
    night_image: "",
    entities: {},
    zones: [],
    manual_actions: [],
    activity_log: {},
  };
}

export function createStubUnits() {
  return {
    ...createDefaultUnits(),
    water_meter: "m³",
  };
}

export function createDefaultMaxPowerKw() {
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

export function createDefaultVisibleBoxes() {
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

export function createStubEntities() {
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

export function createBaseCardConfig({
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
    region_profile: "auto",
    unit_system: "auto",
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

export function createStubCardConfig({
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

export function createEditorBaseConfig({ floorplanLabel = "Level 1" } = {}) {
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
    region_profile: "auto",
    unit_system: "auto",
    large_consumers: [],
    pv_roof_strings: [],
    pv_roof_string_display: "sum",
    inverters: [],
    inverter_display: "sum",
    ...DEFAULT_GRID_FINANCE_CONFIG,
  };
}
