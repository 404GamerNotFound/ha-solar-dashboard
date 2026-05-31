export function createDashboardEditorClass({
  ADVISOR_DEFAULTS,
  DEFAULT_IMAGE_OVERLAYS,
  DEFAULT_TILE_COLOR_RULES,
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
  inverterPhaseVoltageEntityKeys,
  isPvMetric,
  languageFromHass,
  largeConsumerLabel,
  metricVoltageEntityKey,
  normalizeAdvisorConfig,
  normalizeHouse,
  normalizeInverterDisplay,
  normalizeInverters,
  normalizeLargeConsumers,
  normalizePvRoofStringDisplay,
  normalizePvRoofStrings,
  parsePowerLimitWatts,
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
    this._config = {
      ...baseConfig,
      ...config,
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
    const allowed = new Set(["setup", "energy", "devices", "environment", "floorplan", "layout", "appearance", "advisor", "advanced"]);
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

  _shouldRenderAfterInput(path = "", parts = []) {
    const root = parts[0] || path;
    const lastPart = parts[parts.length - 1] || "";
    if (path === "house" || path === "image" || path === "day_image") return true;
    if (root === "positions" || root === "visible_boxes") return true;
    if (root === "image_overlays") return true;
    if (root === "show_floorplan") return true;
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
    const batteryTerms = { terms: ["battery", "batterie", "speicher", "akku"], weight: 34 };
    const waterTerms = { terms: ["water", "wasser", "water meter", "wasserzaehler", "wasserzahler"], weight: 38 };

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

    return `
      <div class="box-field">
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

    return `
      <div class="box-field">
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

    return `
      <div class="box-field kpi-field">
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

    return `
      <div class="box-field environment-field">
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

    return `
      <div class="box-field consumer-field">
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

  _layoutItems() {
    const metricItems = TILE_METRICS
      .filter((metric) => this._metricVisible(metric))
      .map((metric) => {
        const position = this._metricPosition(metric);
        return {
          key: `metric:${metric.key}`,
          label: this._metricLabel(metric),
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
          left: Number.isFinite(Number(sensor.left)) ? Number(sensor.left) : 50,
          top: Number.isFinite(Number(sensor.top)) ? Number(sensor.top) : 50,
          leftPath: `environment_sensors.${index}.left`,
          topPath: `environment_sensors.${index}.top`,
          color: sensor.color || "#34d399",
          type: this._t("editor.layoutTypeEnvironment", {}, "Environment"),
        };
      })
      .filter(Boolean);
    return [...metricItems, ...overlayItems, ...environmentItems];
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
    const imageSrc = this._editorImageSrc();
    const markers = items.map((item) => `
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
            ${imageSrc ? `<img src="${this._escape(imageSrc)}" alt="${this._escape(this._houseLabel(this._normalizeHouse(this._config.house), this._houseVariant()))}" />` : ""}
            ${markers}
          </div>
          ${controls}
        </div>
      </section>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const house = this._normalizeHouse(this._config.house) || "single_family_home";
    const houseOptions = Object.entries(HOUSE_VARIANTS)
      .map(([key, value]) => `<option value="${this._escape(key)}"${key === house ? " selected" : ""}>${this._escape(this._houseLabel(key, value))}</option>`)
      .join("");
    const normalizedConfiguredViewMode = this._normalizeViewMode(this._config.view_mode);
    const configuredViewMode = this._config.show_floorplan === false && normalizedConfiguredViewMode === "floorplan"
      ? "house"
      : normalizedConfiguredViewMode;
    const viewMode = this._normalizeViewMode(configuredViewMode) || "house";
    const viewModeOptions = VIEW_MODE_OPTIONS
      .filter((option) => option.key !== "floorplan" || this._config.show_floorplan !== false)
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
    const generalSettingsHtml = `
      <section class="editor-panel editor-general">
        <div class="editor-panel-title">${this._escape(this._t("editor.sectionGeneral", {}, "General settings"))}</div>
        <div class="settings-grid">
          <label>${this._escape(this._t("editor.title"))} <input data-path="title" value="${this._escape(this._config.title || "")}" /></label>
          <label>${this._escape(this._t("editor.viewMode", {}, "Default view"))} <select data-path="view_mode">${viewModeOptions}</select></label>
          <label>${this._escape(this._t("editor.houseType"))} <select data-path="house">${houseOptions}</select></label>
          <label>${this._escape(this._t("editor.customImage"))} <input data-path="image" placeholder="/local/solar/single_family_home/single_family_home.png or https://..." value="${this._escape(this._config.image || "")}" /></label>
          <label>${this._escape(this._t("editor.customDayImage"))} <input data-path="day_image" placeholder="${this._escape(this._t("editor.optionalDayImage"))}" value="${this._escape(this._config.day_image || "")}" /></label>
          <label>${this._escape(this._t("editor.weatherEntity"))}
            <input data-path="weather_entity" list="ha-solar-dashboard-entities" placeholder="weather.home" value="${this._escape(this._config.weather_entity || "")}" autocomplete="off" />
          </label>
        </div>
        <div class="checkbox-grid">
          <label class="inline"><input type="checkbox" data-path="show_title" ${this._config.show_title !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showTitle"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_view_selector" ${this._config.show_view_selector !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showViewSelector", {}, "Show House/Advisor view selector"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_house_selector" ${this._config.show_house_selector !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showHouseSelector"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_energy_range_selector" ${this._config.show_energy_range_selector === true ? "checked" : ""}/> ${this._escape(this._t("editor.showEnergyRangeSelector"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_metric_tiles" ${this._config.show_metric_tiles !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showMetricTiles"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_environment_sensors" ${this._config.show_environment_sensors !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showEnvironmentSensors", {}, "Show environment sensor tiles"))}</label>
          <label class="inline"><input type="checkbox" data-path="show_large_consumers" ${this._config.show_large_consumers !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showLargeConsumers", {}, "Show large consumers in house view"))}</label>
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
    const boxSettingsHtml = `<div class="grid">${TILE_METRICS.map((metric) => this._renderBoxField(metric)).join("")}</div>`;
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
        content: `${this._renderSetupWizard()}${generalSettingsHtml}`,
      },
      {
        key: "energy",
        label: this._t("editor.tabEnergy", {}, "Energy"),
        status: this._statusText({ configured: configuredTileEntities.length, total: TILE_METRICS.length, missing: this._missingEntityCount(configuredTileEntities) }),
        content: renderEditorCard(this._t("editor.sectionBoxes", {}, "Energy boxes"), this._statusText({ configured: configuredTileEntities.length, total: TILE_METRICS.length }), boxSettingsHtml),
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
    const tabButtons = tabPanels.map((tab) => `
      <button type="button" class="editor-tab${tab.key === activeTab ? " active" : ""}" data-editor-tab="${this._escape(tab.key)}" aria-pressed="${tab.key === activeTab ? "true" : "false"}">
        <span>${this._escape(tab.label)}</span>
        <small>${this._escape(tab.status)}</small>
      </button>
    `).join("");
    const tabContent = tabPanels.map((tab) => `
      <section class="editor-tab-panel${tab.key === activeTab ? " active" : ""}" data-editor-tab-panel="${this._escape(tab.key)}" ${tab.key === activeTab ? "" : "hidden"}>
        ${tab.content}
      </section>
    `).join("");

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${this._escape(assetUrl("styles/editor.css"))}" />
      <div class="editor">
        <datalist id="ha-solar-dashboard-entities">${entityOptions}</datalist>
        <nav class="editor-tabs" aria-label="${this._escape(this._t("editor.tabs", {}, "Configuration sections"))}">
          ${tabButtons}
        </nav>
        ${tabContent}
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
