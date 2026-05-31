export function createFloorplanRendererMethods({
  FLOORPLAN_DASHBOARD_VIEW,
  assetUrl,
} = {}) {
  return {
    _activeFloorplanFloor(floorplan = this._normalizeFloorplan(this.config?.floorplan || {})) {
      const floors = Array.isArray(floorplan.floors) && floorplan.floors.length > 0 ? floorplan.floors : [floorplan];
      const requestedFloor = this._activeFloorplanFloorId || floorplan.active_floor;
      const index = Math.max(0, floors.findIndex((floor) => floor.id === requestedFloor));
      return { floor: floors[index] || floors[0], index: index >= 0 ? index : 0 };
    },

    _floorplanImageUrl(path = "") {
      const value = String(path || "").trim();
      if (!value) return "";
      if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
      if (/^local\//i.test(value)) return `/${value}`;
      return assetUrl(value);
    },

    _floorplanEnvironmentSensor(id) {
      if (!id) return undefined;
      return (this.config.environment_sensors || []).find((sensor) => sensor.id === id);
    },

    _floorplanSensorSource(sensor, index = 0) {
      const linkedSensor = this._floorplanEnvironmentSensor(sensor?.environment_sensor);
      const label = sensor?.label || (linkedSensor ? this._environmentSensorLabel(linkedSensor, index) : this._floorplanSensorType(sensor?.type).label);
      const entity = linkedSensor?.entity || sensor?.entity || "";
      const unit = sensor?.unit !== undefined && sensor?.unit !== "" ? sensor.unit : linkedSensor?.unit ?? "auto";
      const color = sensor?.color || linkedSensor?.color || this._floorplanSensorType(sensor?.type).color;
      return {
        label: label || this._t("floorplan.sensor", { index: index + 1 }, `Sensor ${index + 1}`),
        entity,
        unit,
        color,
      };
    },

    _floorplanSensorValue(sensor, index = 0) {
      const source = this._floorplanSensorSource(sensor, index);
      if (!source.entity) return "\u2014";
      const value = this._getEntityValue(source.entity, undefined);
      const entityUnit = this._getEntityUnit(source.entity);
      const unit = this._normalizeUnit(source.unit) === "auto" ? entityUnit : source.unit;
      return this._formatWithUnit(value, unit);
    },

    _renderFloorplanDashboard() {
      const floorplan = this._normalizeFloorplan(this.config.floorplan || {});
      const { floor: activeFloor } = this._activeFloorplanFloor(floorplan);
      const imageSrc = this._floorplanImageUrl(activeFloor.image);
      const grid = floorplan.mode === "editor" && floorplan.show_grid !== false
        ? Array.from({ length: 11 }, (_item, index) => index * 10).map((x) => `<line class="floorplan-grid-line" x1="${x}" y1="0" x2="${x}" y2="70"></line>`).join("")
          + Array.from({ length: 8 }, (_item, index) => index * 10).map((y) => `<line class="floorplan-grid-line" x1="0" y1="${y}" x2="100" y2="${y}"></line>`).join("")
        : "";
      const backgroundImage = floorplan.mode === "image" && imageSrc
        ? `<image class="floorplan-image" href="${this._escape(imageSrc)}" x="0" y="0" width="100" height="70" preserveAspectRatio="xMidYMid slice"></image>`
        : "";
      const rooms = floorplan.mode === "editor" ? activeFloor.rooms.map((room) => `
        <g class="floorplan-room" style="--room-color:${this._escape(room.color)}">
          <rect x="${this._escape(room.x)}" y="${this._escape(room.y)}" width="${this._escape(room.width)}" height="${this._escape(room.height)}" rx="1.4"></rect>
          <text x="${this._escape(room.x + 1.6)}" y="${this._escape(room.y + 4.2)}">${this._escape(room.label)}</text>
        </g>
      `).join("") : "";
      const walls = floorplan.mode === "editor" ? activeFloor.walls.map((wall) => `
        <line class="floorplan-wall" x1="${this._escape(wall.x1)}" y1="${this._escape(wall.y1)}" x2="${this._escape(wall.x2)}" y2="${this._escape(wall.y2)}" style="--wall-color:${this._escape(wall.color)};--wall-width:${this._escape(wall.width)}"></line>
      `).join("") : "";
      const sensors = activeFloor.sensors
        .filter((sensor) => sensor.visible !== false)
        .map((sensor, index) => {
          const source = this._floorplanSensorSource(sensor, index);
          const value = this._floorplanSensorValue(sensor, index);
          const title = source.entity ? `${source.label}: ${value} (${source.entity})` : source.label;
          const fontSize = this._clampNumber(sensor.font_size, 3.05, 1.4, 8);
          const labelFontSize = this._clampNumber(fontSize * 0.77, 2.35, 1.1, 6.2);
          const labelY = this._clampNumber(fontSize * -0.62, -1.9, -5, -0.4);
          const valueY = sensor.show_label !== false
            ? this._clampNumber(fontSize * 0.82, 2.5, 1.2, 7)
            : this._clampNumber(fontSize * 0.35, 1.1, 0.7, 4);
          const labelText = sensor.show_label !== false
            ? `<text class="floorplan-sensor-label" x="4.2" y="${this._escape(labelY)}" style="font-size:${this._escape(labelFontSize)}px" data-floorplan-sensor-label="${this._escape(sensor.id)}">${this._escape(source.label)}</text>`
            : "";
          return `
            <g class="floorplan-sensor" data-floorplan-sensor="${this._escape(sensor.id)}" style="--sensor-color:${this._escape(source.color)};--sensor-font-size:${this._escape(fontSize)}px" transform="translate(${this._escape(sensor.x)} ${this._escape(sensor.y)})">
              <title>${this._escape(title)}</title>
              <circle r="1.7"></circle>
              ${labelText}
              <text class="floorplan-sensor-value" x="4.2" y="${this._escape(valueY)}" style="font-size:${this._escape(fontSize)}px" data-floorplan-sensor-value="${this._escape(sensor.id)}">${this._escape(value)}</text>
            </g>
          `;
        })
        .join("");
      const floorTabs = floorplan.floors.length > 1
        ? `
          <div class="floorplan-floor-tabs" role="group" aria-label="${this._escape(this._t("editor.floorplanFloors", {}, "Levels"))}">
            ${floorplan.floors.map((floor) => `
              <button type="button" class="${floor.id === activeFloor.id ? "active" : ""}" data-floorplan-view-floor="${this._escape(floor.id)}" aria-pressed="${floor.id === activeFloor.id ? "true" : "false"}">${this._escape(floor.label)}</button>
            `).join("")}
          </div>
        `
        : "";
      const empty = floorplan.mode === "image" && !imageSrc
        ? `<div class="floorplan-empty">${this._escape(this._t("floorplan.imageEmpty", {}, "Enter an image path for this level."))}</div>`
        : activeFloor.rooms.length === 0 && activeFloor.walls.length === 0 && activeFloor.sensors.length === 0
          ? `<div class="floorplan-empty">${this._escape(this._t("floorplan.empty", {}, "Create rooms, walls, and sensors in the card editor."))}</div>`
          : "";
      return `
        <section class="floorplan-dashboard" data-floorplan-dashboard>
          <div class="floorplan-head">
            <div>
              <div class="chart-dashboard-label">${this._escape(this._t("floorplan.label", {}, "Floorplan"))}</div>
              <h2>${this._escape(activeFloor.label || this._t("floorplan.title", {}, "Home floorplan"))}</h2>
            </div>
            <span>${this._escape(this._t("floorplan.counts", { rooms: activeFloor.rooms.length, sensors: activeFloor.sensors.length }, `${activeFloor.rooms.length} rooms \u00b7 ${activeFloor.sensors.length} sensors`))}</span>
          </div>
          ${floorTabs}
          <div class="floorplan-canvas">
            <svg viewBox="0 0 100 70" role="img" aria-label="${this._escape(this._t("floorplan.title", {}, "Home floorplan"))}" preserveAspectRatio="xMidYMid meet">
              <rect class="floorplan-background" x="0" y="0" width="100" height="70" rx="1.5"></rect>
              ${backgroundImage}
              ${grid}
              ${rooms}
              ${walls}
              ${sensors}
            </svg>
            ${empty}
          </div>
        </section>
      `;
    },

    _updateFloorplanReadings() {
      if (!this._domCache) this._refreshDomCache();
      const floorplan = this.config?.floorplan ? this._normalizeFloorplan(this.config.floorplan) : undefined;
      if (!floorplan || this._currentViewMode() !== FLOORPLAN_DASHBOARD_VIEW) return;
      const { floor } = this._activeFloorplanFloor(floorplan);
      (floor.sensors || []).forEach((sensor, index) => {
        const source = this._floorplanSensorSource(sensor, index);
        const value = this._floorplanSensorValue(sensor, index);
        this._cachedDomElements("floorplanSensorLabels", sensor.id).forEach((element) => {
          if (element.textContent !== source.label) element.textContent = source.label;
        });
        this._cachedDomElements("floorplanSensorValues", sensor.id).forEach((element) => {
          if (element.textContent !== value) element.textContent = value;
        });
        this._cachedDomElements("floorplanSensors", sensor.id).forEach((element) => {
          element.style.setProperty("--sensor-color", source.color);
          element.style.setProperty("--sensor-font-size", `${this._clampNumber(sensor.font_size, 3.05, 1.4, 8)}px`);
        });
      });
    },
  };
}
