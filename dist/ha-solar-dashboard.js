const CARD_TYPE = "ha-solar-dashboard-card";
const CARD_EDITOR_TYPE = "ha-solar-dashboard-card-editor";
const REPOSITORY_IMAGE_BASE =
  "https://raw.githubusercontent.com/404GamerNotFound/ha-solar-dashboard/main/images";

const HOUSE_VARIANTS = {
  home: {
    label: "Home",
    file: "home_neu.png",
    dayFile: "home_neu_tag.png",
    fallbackFiles: ["home.png"],
    positions: {
      pv_roof_power: { left: 64, top: 28 },
      pv_shed_power: { left: 14, top: 80 },
      battery_level: { left: 49, top: 66 },
      inverter_power: { left: 53, top: 72 },
      wallbox_power: { left: 23, top: 57 },
    },
  },
  doppelhaus: {
    label: "Doppelhaus",
    file: "doppelhaus.png",
    dayFile: "doppelhaus_tag.png",
    positions: {
      pv_roof_power: { left: 46, top: 23 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 49, top: 73 },
      inverter_power: { left: 37, top: 56 },
      wallbox_power: { left: 27, top: 66 },
    },
  },
  mehrfamilienhaus: {
    label: "Mehrfamilienhaus",
    file: "mehrfamilienhaus.png",
    dayFile: "mehrfamilienhaus_tag.png",
    positions: {
      pv_roof_power: { left: 53, top: 17 },
      pv_shed_power: { left: 16, top: 81 },
      battery_level: { left: 35, top: 65 },
      inverter_power: { left: 35, top: 72 },
      wallbox_power: { left: 21, top: 59 },
    },
  },
  stadtvilla: {
    label: "Stadtvilla",
    file: "stadtvilla.png",
    dayFile: "stadtvilla_tag.png",
    positions: {
      pv_roof_power: { left: 55, top: 16 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 43, top: 71 },
      inverter_power: { left: 58, top: 58 },
      wallbox_power: { left: 25, top: 57 },
    },
  },
  stadtvilla2: {
    label: "Stadtvilla ohne Flachdach",
    file: "stadtvilla_dach.png",
    dayFile: "stadtvilla_dach_tag.png",
    positions: {
      pv_roof_power: { left: 58, top: 18 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 41, top: 66 },
      inverter_power: { left: 55, top: 56 },
      wallbox_power: { left: 25, top: 60 },
    },
  },
};

const METRICS = [
  { key: "pv_roof_power", label: "PV Dach", unit: "power", color: "yellow" },
  { key: "pv_shed_power", label: "PV Schuppen", unit: "power", color: "yellow" },
  { key: "battery_level", label: "Batterie", unit: "battery", color: "green" },
  { key: "inverter_power", label: "Wechselrichter", unit: "power", color: "blue" },
  { key: "wallbox_power", label: "Wallbox", unit: "power", color: "blue" },
];

const TILE_METRICS = [
  ...METRICS,
  { key: "pv_total_power", label: "PV Gesamt", unit: "power", color: "yellow" },
];

class HaSolarDashboardCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement(CARD_EDITOR_TYPE);
  }

  static getStubConfig() {
    return {
      type: `custom:${CARD_TYPE}`,
      title: "Solar Dashboard",
      time_label: "Live",
      house: "home",
      show_title: true,
      show_time_label: true,
      show_house_selector: true,
      show_metric_tiles: true,
      hud_box_opacity: 0.65,
      hud_box_scale: 1,
      daylight_entity: "sun.sun",
      visible_boxes: {
        pv_roof_power: true,
        pv_shed_power: true,
        battery_level: true,
        inverter_power: true,
        wallbox_power: true,
      },
      entities: {
        pv_roof_power: "sensor.pv_roof_power",
        pv_shed_power: "sensor.pv_shed_power",
        battery_level: "sensor.battery_level",
        inverter_power: "sensor.wechselrichter_power",
        wallbox_power: "sensor.wallbox_power",
        pv_total_power: "sensor.pv_total_power",
      },
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");

    const house = this._normalizeHouse(config.house || config.variant || config.image_variant) || "home";

    this.config = {
      title: "Energy Flow",
      time_label: "Live",
      house,
      show_title: true,
      show_time_label: true,
      show_house_selector: true,
      show_metric_tiles: true,
      hud_box_opacity: 0.65,
      hud_box_scale: 1,
      daylight_entity: "sun.sun",
      power_display_mode: "raw",
      power_decimals: 0,
      units: { power: "W", battery: "%" },
      entities: {},
      positions: {},
      visible_boxes: {},
      ...config,
      house,
      units: {
        power: "W",
        battery: "%",
        ...(config.units || {}),
      },
      entities: {
        ...(config.entities || {}),
      },
      positions: {
        ...(config.positions || {}),
      },
      visible_boxes: {
        ...(config.visible_boxes || config.boxes || {}),
      },
    };

    this.config.hud_box_opacity = this._clampNumber(this.config.hud_box_opacity, 0.65, 0, 1);
    this.config.hud_box_scale = this._clampNumber(this.config.hud_box_scale, 1, 0.6, 1.8);
    this.config.power_decimals = this._clampNumber(this.config.power_decimals, 0, 0, 3);

    this._selectedHouse = house;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this._renderCardShell(this._layoutState());
  }

  set hass(hass) {
    const wasDaylight = this._isDaylight();
    this._hass = hass;
    const isDaylight = this._isDaylight();
    if (this.shadowRoot && wasDaylight !== isDaylight) {
      this._renderCardShell(this._layoutState());
      return;
    }
    this._updateReadings();
  }

  getCardSize() {
    return 6;
  }

  _normalizeHouse(value) {
    if (!value) return undefined;
    const normalized = String(value).toLowerCase().trim().replace(/[\s_]+/g, "-");
    const aliases = {
      modern: "home",
      einfamilienhaus: "home",
      "doppel-haus": "doppelhaus",
      mfh: "mehrfamilienhaus",
      mehrfamilienhaus: "mehrfamilienhaus",
      "mehr-familienhaus": "mehrfamilienhaus",
      "mehrfamilien-haus": "mehrfamilienhaus",
      villa: "stadtvilla",
      "stadt-villa": "stadtvilla",
      stadtvilla_2: "stadtvilla2",
      "stadtvilla-2": "stadtvilla2",
      "stadtvilla-ohne-flachdach": "stadtvilla2",
      stadtvilla_dach: "stadtvilla2",
      "stadtvilla-dach": "stadtvilla2",
    };
    const key = aliases[normalized] || normalized;
    return HOUSE_VARIANTS[key] ? key : undefined;
  }

  _getEntityValue(entityId, fallback = "0") {
    if (!entityId || !this._hass?.states?.[entityId]) return fallback;
    return this._hass.states[entityId].state;
  }

  _formatValue(value) {
    if (value === undefined || value === null || value === "unknown" || value === "unavailable") return "—";
    return value;
  }

  _formatReading(metric) {
    const entityId = this.config.entities[metric.key];
    const value = this._getEntityValue(entityId, "0");
    if (metric.unit === "power") return this._formatPowerValue(value);
    return this._formatWithUnit(value, this.config.units[metric.unit]);
  }

  _formatWithUnit(rawValue, unit) {
    const value = this._formatValue(rawValue);
    if (value === "—") return value;
    return `${value} ${unit}`;
  }

  _formatPowerValue(rawValue) {
    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) return this._formatWithUnit(rawValue, this.config.units.power);

    const mode = this.config.power_display_mode || "raw";
    if (mode === "auto_kw" && Math.abs(numericValue) >= 1000) {
      const kwValue = numericValue / 1000;
      return `${kwValue.toFixed(this.config.power_decimals)} kW`;
    }

    if (mode === "auto_kw") return `${numericValue.toFixed(this.config.power_decimals)} W`;
    return `${numericValue} ${this.config.units.power}`;
  }

  _visibleMetrics() {
    return METRICS.filter((metric) => this.config.visible_boxes?.[metric.key] !== false);
  }

  _variantImage(variant) {
    const file = this._isDaylight() && variant.dayFile ? variant.dayFile : variant.file;
    const files = [
      file,
      ...(file === variant.file ? [] : [variant.file]),
      ...(variant.fallbackFiles || []),
    ];
    const [primaryFile, ...fallbackFiles] = files.filter(Boolean);
    return {
      src: this._remoteImageUrl(primaryFile),
      fallbacks: [
        this._localImageUrl(primaryFile),
        ...fallbackFiles.flatMap((fallbackFile) => [
          this._remoteImageUrl(fallbackFile),
          this._localImageUrl(fallbackFile),
        ]),
      ],
    };
  }

  _remoteImageUrl(file) {
    return `${REPOSITORY_IMAGE_BASE}/${file}`;
  }

  _localImageUrl(file) {
    try {
      return new URL(`images/${file}`, import.meta.url).href;
    } catch (_err) {
      return "";
    }
  }

  _metricPosition(variant, key) {
    return {
      ...(variant.positions[key] || {}),
      ...(this.config.positions[key] || {}),
    };
  }

  _toPercent(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(96, Math.max(4, number)) : fallback;
  }

  _clampNumber(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  _isDaylight() {
    const entityId = this.config?.daylight_entity || "sun.sun";
    const entity = this._hass?.states?.[entityId];
    const state = String(entity?.state || "").toLowerCase();
    if (["above_horizon", "above horizon", "on"].includes(state) || state.includes("über dem horizont")) return true;
    if (["below_horizon", "below horizon", "off"].includes(state) || state.includes("unter dem horizont")) return false;

    const elevation = Number(entity?.attributes?.elevation);
    if (Number.isFinite(elevation)) return elevation > -0.833;

    const nextRising = Date.parse(entity?.attributes?.next_rising || "");
    const nextSetting = Date.parse(entity?.attributes?.next_setting || "");
    if (Number.isFinite(nextRising) && Number.isFinite(nextSetting)) return nextSetting < nextRising;

    return false;
  }

  _layoutState() {
    const activeHouse = this._normalizeHouse(this._selectedHouse) || this.config.house;
    const variant = HOUSE_VARIANTS[activeHouse] || HOUSE_VARIANTS.home;
    const variantImage = this._variantImage(variant);
    const customImage = this._isDaylight() && this.config.day_image ? this.config.day_image : this.config.image;
    const imageSrc = customImage || variantImage.src;
    const imageFallbacks = customImage ? [variantImage.src, ...(variantImage.fallbacks || [])] : variantImage.fallbacks;

    return { activeHouse, variant, imageSrc, imageFallbacks };
  }

  _escape(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  _renderHouseSelector(activeHouse) {
    if (!this.config.show_house_selector) return "";

    const options = Object.entries(HOUSE_VARIANTS)
      .map(([key, variant]) => {
        const selected = key === activeHouse ? " selected" : "";
        return `<option value="${key}"${selected}>${this._escape(variant.label)}</option>`;
      })
      .join("");

    return `<select class="house-select" aria-label="Haus auswählen">${options}</select>`;
  }

  _renderMetric(metric, variant) {
    if (this.config.visible_boxes?.[metric.key] === false) return "";

    const position = this._metricPosition(variant, metric.key);
    const left = this._toPercent(position.left, 50);
    const top = this._toPercent(position.top, 50);

    return `
      <div class="metric" data-metric="${metric.key}" style="left: ${left}%; top: ${top}%;">
        <div class="label">${this._escape(metric.label)}</div>
        <div class="value ${metric.color}" data-value="${metric.key}">${this._escape(this._formatReading(metric))}</div>
      </div>
    `;
  }

  _attachControls() {
    const select = this.shadowRoot.querySelector(".house-select");
    if (select) {
      select.addEventListener("change", (event) => {
        const nextHouse = this._normalizeHouse(event.target.value);
        if (!nextHouse || nextHouse === this._selectedHouse) return;
        this._selectedHouse = nextHouse;
        this._renderCardShell(this._layoutState());
      });
    }

    const image = this.shadowRoot.querySelector(".scene-image");
    if (image) {
      image.addEventListener("error", () => {
        const fallbacks = (image.dataset.fallbacks || "").split("|").filter(Boolean);
        const fallback = fallbacks.shift();
        if (!fallback || image.src === fallback) return;
        image.src = fallback;
        image.dataset.fallbacks = fallbacks.join("|");
      });
    }
  }

  _renderCardShell(state) {
    const visibleMetrics = this._visibleMetrics();
    const metricHtml = visibleMetrics.map((metric) => this._renderMetric(metric, state.variant)).join("");
    const headerHtml = [
      this.config.show_title !== false ? `<div class="title">${this._escape(this.config.title)}</div>` : "",
      this._renderHouseSelector(state.activeHouse),
      this.config.show_time_label !== false ? `<div class="badge">${this._escape(this.config.time_label)}</div>` : "",
    ].filter(Boolean).join("");
    const gridHtml = [
      ...visibleMetrics,
      TILE_METRICS.find((metric) => metric.key === "pv_total_power"),
    ].filter(Boolean).map(
      (metric) => `
        <div class="tile" data-tile="${metric.key}">
          <div class="name">${this._escape(metric.label)}</div>
          <div class="num" data-value="${metric.key}">${this._escape(this._formatReading(metric))}</div>
        </div>
      `,
    ).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; --text-main:#f3f6ff; --text-muted:#9ba3b8; --glass-soft:rgba(255,255,255,.08); --accent-yellow:#ffc233; --accent-blue:#1f8fff; --accent-green:#34d399; --hud-box-opacity:${this.config.hud_box_opacity}; --hud-box-scale:${this.config.hud_box_scale}; --hud-box-bg:rgba(8,16,38,var(--hud-box-opacity)); }
        ha-card { border-radius:18px; overflow:hidden; background:radial-gradient(110% 80% at 15% 0%, #232b44 0%, #111727 70%); color:var(--text-main); box-shadow:0 18px 45px rgba(0,0,0,.55); padding:16px; font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
        .header { display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:center; gap:10px; margin-bottom:12px; }
        .title { min-width:0; overflow-wrap:anywhere; font-size:1.28rem; font-weight:700; line-height:1.2; }
        .badge,.house-select { background:var(--glass-soft); border:1px solid rgba(255,255,255,.2); border-radius:8px; color:var(--text-main); font:inherit; font-size:.88rem; min-height:34px; }
        .badge { display:inline-flex; align-items:center; padding:0 10px; white-space:nowrap; }
        .house-select { max-width:140px; padding:0 30px 0 10px; }
        .scene { position:relative; aspect-ratio:91/64; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,.1); margin-bottom:12px; background:#101626; }
        .scene-image { display:block; width:100%; height:100%; object-fit:cover; filter:saturate(1.03) contrast(1.03); }
        .metric { position:absolute; width:clamp(82px,15%,118px); transform:translate(-50%,-50%) scale(var(--hud-box-scale)); transform-origin:center center; background:var(--hud-box-bg); border:1px solid rgba(255,255,255,.18); backdrop-filter:blur(4px); border-radius:10px; padding:7px 9px; box-shadow:0 8px 24px rgba(0,0,0,.35); pointer-events:none; box-sizing:border-box; }
        .metric .label,.tile .name { color:var(--text-muted); font-size:.74rem; line-height:1.2; }
        .metric .value,.tile .num { font-size:.92rem; font-weight:700; line-height:1.25; overflow-wrap:anywhere; }
        .value.yellow{color:var(--accent-yellow)} .value.blue{color:var(--accent-blue)} .value.green{color:var(--accent-green)}
        .grid { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:8px; }
        .tile { background:rgba(12,20,38,.72); border:1px solid rgba(255,255,255,.08); border-radius:8px; padding:10px; min-width:0; }
        @media (max-width:700px){ .header{grid-template-columns:minmax(0,1fr);align-items:stretch;} .badge,.house-select{width:100%;} .metric{width:clamp(68px,18%,96px);padding:5px 7px;} .metric .label{font-size:.62rem;} .metric .value{font-size:.76rem;} .grid{grid-template-columns:repeat(2,minmax(0,1fr));} }
      </style>
      <ha-card>
        ${headerHtml ? `<div class="header">${headerHtml}</div>` : ""}
        <div class="scene"><img class="scene-image" src="${this._escape(state.imageSrc)}" data-fallbacks="${this._escape((state.imageFallbacks || []).join("|"))}" alt="${this._escape(state.variant.label)}" />${metricHtml}</div>
        ${this.config.show_metric_tiles !== false ? `<div class="grid">${gridHtml}</div>` : ""}
      </ha-card>
    `;

    this._attachControls();
  }

  _updateReadings() {
    TILE_METRICS.forEach((metric) => {
      const reading = this._formatReading(metric);
      this.shadowRoot.querySelectorAll(`[data-value="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== reading) element.textContent = reading;
      });
    });
  }

  renderCard() {
    if (!this.config || !this.shadowRoot) return;
    this._renderCardShell(this._layoutState());
  }
}

class HaSolarDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = {
      entities: {},
      positions: {},
      ...config,
      visible_boxes: { ...((config || {}).boxes || {}), ...((config || {}).visible_boxes || {}) },
    };
    this._render();
  }

  set hass(hass) {
    const hadEntityOptions = this._entityOptions().length > 0;
    this._hass = hass;
    const hasEntityOptions = this._entityOptions().length > 0;
    if (!this._rendered || (!hadEntityOptions && hasEntityOptions)) {
      this._render();
    }
  }

  _onInput(path, value, isCheckbox = false) {
    const next = this._cloneConfig(this._config || {});
    const numericFields = new Set(["hud_box_opacity", "hud_box_scale"]);
    const nextValue = numericFields.has(path) ? Number(value) : value;
    if (path.includes(".")) {
      const [section, key, prop] = path.split(".");
      next[section] = next[section] || {};
      if (prop) {
        next[section][key] = next[section][key] || {};
        next[section][key][prop] = Number(value);
      } else {
        next[section][key] = isCheckbox ? Boolean(nextValue) : nextValue;
      }
    } else {
      next[path] = isCheckbox ? Boolean(nextValue) : nextValue;
    }
    this._config = next;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config: next },
      }),
    );
  }

  _cloneConfig(config) {
    return JSON.parse(JSON.stringify(config));
  }

  _entityOptions() {
    return Object.keys(this._hass?.states || {}).sort();
  }

  _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  _renderEntityField(metric) {
    const selected = this._config?.entities?.[metric.key] || "";
    const options = this._entityOptions()
      .map((entityId) => `<option value="${this._escape(entityId)}"${entityId === selected ? " selected" : ""}>${this._escape(entityId)}</option>`)
      .join("");
    return `
      <label>
        ${this._escape(metric.label)}
        <select data-path="entities.${metric.key}">
          <option value="">-- select entity --</option>
          ${options}
        </select>
      </label>
    `;
  }

  _metricPosition(metric) {
    const house = this._config.house || "home";
    const variant = HOUSE_VARIANTS[house] || HOUSE_VARIANTS.home;
    return {
      ...(variant.positions[metric.key] || {}),
      ...(this._config.positions?.[metric.key] || {}),
    };
  }

  _renderBoxField(metric) {
    const position = this._metricPosition(metric);
    const left = Number.isFinite(Number(position.left)) ? Number(position.left) : 50;
    const top = Number.isFinite(Number(position.top)) ? Number(position.top) : 50;
    const visible = this._config.visible_boxes?.[metric.key] !== false;

    return `
      <div class="box-field">
        <label class="inline"><input type="checkbox" data-path="visible_boxes.${metric.key}" ${visible ? "checked" : ""}/> ${this._escape(metric.label)} anzeigen</label>
        <label>X Position (${this._escape(left)})
          <input type="range" min="4" max="96" step="1" data-path="positions.${metric.key}.left" value="${this._escape(left)}" />
        </label>
        <label>Y Position (${this._escape(top)})
          <input type="range" min="4" max="96" step="1" data-path="positions.${metric.key}.top" value="${this._escape(top)}" />
        </label>
      </div>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const house = this._config.house || "home";
    const houseOptions = Object.entries(HOUSE_VARIANTS)
      .map(([key, value]) => `<option value="${this._escape(key)}"${key === house ? " selected" : ""}>${this._escape(value.label)}</option>`)
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        .editor{display:grid;gap:12px;font-family:system-ui,sans-serif}
        label{display:grid;gap:4px;font-size:13px}
        input,select{padding:8px;border:1px solid #bbb;border-radius:8px}
        .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        .section-title{font-size:13px;font-weight:700;margin-top:4px}
        .box-field{display:grid;gap:8px;padding:10px;border:1px solid #ddd;border-radius:8px}
        .inline{display:flex;align-items:center;gap:8px}
        .inline input{padding:0}
        @media (max-width:700px){.grid{grid-template-columns:minmax(0,1fr)}}
      </style>
      <div class="editor">
        <label>Title <input data-path="title" value="${this._escape(this._config.title || "")}" /></label>
        <label>Time Label <input data-path="time_label" value="${this._escape(this._config.time_label || "")}" /></label>
        <label>House Type <select data-path="house">${houseOptions}</select></label>
        <label>Eigenes Bild <input data-path="image" placeholder="/local/solar/haus.png oder https://..." value="${this._escape(this._config.image || "")}" /></label>
        <label>Eigenes Tagbild <input data-path="day_image" placeholder="Optional, wird tagsüber verwendet" value="${this._escape(this._config.day_image || "")}" /></label>
        <label><input type="checkbox" data-path="show_title" ${this._config.show_title !== false ? "checked" : ""}/> Show title</label>
        <label><input type="checkbox" data-path="show_time_label" ${this._config.show_time_label !== false ? "checked" : ""}/> Show live label</label>
        <label><input type="checkbox" data-path="show_house_selector" ${this._config.show_house_selector !== false ? "checked" : ""}/> Show house selector</label>
        <label><input type="checkbox" data-path="show_metric_tiles" ${this._config.show_metric_tiles !== false ? "checked" : ""}/> Show metric boxes below chart</label>
        <label>HUD box opacity (${this._escape((Number(this._config.hud_box_opacity ?? 0.65)).toFixed(2))})
          <input type="range" min="0" max="1" step="0.05" data-path="hud_box_opacity" value="${this._escape(this._config.hud_box_opacity ?? 0.65)}" />
        </label>
        <label>HUD box scale (${this._escape((Number(this._config.hud_box_scale ?? 1)).toFixed(2))})
          <input type="range" min="0.6" max="1.8" step="0.05" data-path="hud_box_scale" value="${this._escape(this._config.hud_box_scale ?? 1)}" />
        </label>
        <label>Power display mode
          <select data-path="power_display_mode">
            <option value="raw"${(this._config.power_display_mode || "raw") === "raw" ? " selected" : ""}>Raw value + configured unit</option>
            <option value="auto_kw"${this._config.power_display_mode === "auto_kw" ? " selected" : ""}>Auto W/kW</option>
          </select>
        </label>
        <label>Power decimals (${this._escape(Number(this._config.power_decimals ?? 0).toFixed(0))})
          <input type="range" min="0" max="3" step="1" data-path="power_decimals" value="${this._escape(this._config.power_decimals ?? 0)}" />
        </label>
        <div class="section-title">Boxen anzeigen und positionieren</div>
        <div class="grid">${METRICS.map((metric) => this._renderBoxField(metric)).join("")}</div>
        <div class="section-title">Entitäten</div>
        <div class="grid">${TILE_METRICS.map((metric) => this._renderEntityField(metric)).join("")}</div>
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

    this._rendered = true;
  }
}

if (!customElements.get(CARD_TYPE)) customElements.define(CARD_TYPE, HaSolarDashboardCard);
if (!customElements.get(CARD_EDITOR_TYPE)) customElements.define(CARD_EDITOR_TYPE, HaSolarDashboardCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: "HA Solar Dashboard Card",
    description: "PV energy overview dashboard card",
  });
}
