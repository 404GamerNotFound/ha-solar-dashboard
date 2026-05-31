const ENERGY_RANGE_KEYS = new Set(["live", "1h", "24h", "month", "year", "total"]);

export function normalizeConfigId(value, fallback) {
  const id = String(value || fallback || "").trim().replace(/[^\w-]+/g, "_");
  return id || String(fallback || "item").replace(/[^\w-]+/g, "_");
}

export function clampConfigNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function normalizeEnergyRange(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "hour" || normalized === "hourly" || normalized === "1hr" || normalized === "60m") return "1h";
  if (normalized === "day" || normalized === "today" || normalized === "daily" || normalized === "24hr") return "24h";
  if (normalized === "monthly") return "month";
  if (normalized === "yearly") return "year";
  if (normalized === "all" || normalized === "overall" || normalized === "lifetime") return "total";
  return ENERGY_RANGE_KEYS.has(normalized) ? normalized : undefined;
}

export function createConfigNormalizerMethods({
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
