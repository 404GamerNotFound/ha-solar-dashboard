const CARD_TYPE = "ha-solar-dashboard-card";
const CARD_EDITOR_TYPE = "ha-solar-dashboard-card-editor";
const REPOSITORY_IMAGE_BASE =
  "https://raw.githubusercontent.com/404GamerNotFound/ha-solar-dashboard/main/images";

const HOUSE_VARIANTS = {
  home: {
    label: "Home",
    file: "home.png",
    positions: {
      pv_roof_power: { left: 38, top: 25 },
      pv_shed_power: { left: 82, top: 67 },
      battery_level: { left: 52, top: 58 },
      inverter_power: { left: 61, top: 61 },
      wallbox_power: { left: 31, top: 59 },
    },
  },
  doppelhaus: {
    label: "Doppelhaus",
    file: "doppelhaus.png",
    positions: {
      pv_roof_power: { left: 45, top: 26 },
      pv_shed_power: { left: 15, top: 78 },
      battery_level: { left: 45, top: 67 },
      inverter_power: { left: 37, top: 66 },
      wallbox_power: { left: 30, top: 62 },
    },
  },
  stadtvilla: {
    label: "Stadtvilla",
    file: "stadtvilla.png",
    positions: {
      pv_roof_power: { left: 53, top: 17 },
      pv_shed_power: { left: 15, top: 78 },
      battery_level: { left: 38, top: 63 },
      inverter_power: { left: 43, top: 58 },
      wallbox_power: { left: 24, top: 55 },
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
      show_house_selector: true,
      entities: {
        pv_roof_power: "sensor.pv_roof_power",
        pv_shed_power: "sensor.pv_shed_power",
        battery_level: "sensor.battery_level",
        inverter_power: "sensor.wechselrichter_power",
        wallbox_power: "sensor.wallbox_power",
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
      show_house_selector: true,
      units: { power: "W", battery: "%" },
      entities: {},
      positions: {},
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
    };

    this._selectedHouse = house;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.renderCard();
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
      villa: "stadtvilla",
      "stadt-villa": "stadtvilla",
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
    const value = this._formatValue(this._getEntityValue(entityId, "0"));
    if (value === "—") return value;
    return `${value} ${this.config.units[metric.unit]}`;
  }

  _variantImage(variant) {
    const localUrl = this._localImageUrl(variant.file);
    const remoteUrl = `${REPOSITORY_IMAGE_BASE}/${variant.file}`;
    return { src: localUrl || remoteUrl, fallback: localUrl ? remoteUrl : "" };
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
    const position = this._metricPosition(variant, metric.key);
    const left = Number.isFinite(position.left) ? position.left : 50;
    const top = Number.isFinite(position.top) ? position.top : 50;

    return `
      <div class="metric" style="left: ${left}%; top: ${top}%;">
        <div class="label">${this._escape(metric.label)}</div>
        <div class="value ${metric.color}">${this._escape(this._formatReading(metric))}</div>
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
        this.renderCard();
      });
    }

    const image = this.shadowRoot.querySelector(".scene-image");
    if (image) {
      image.addEventListener("error", () => {
        const fallback = image.dataset.fallback;
        if (!fallback || image.src === fallback) return;
        image.src = fallback;
        image.dataset.fallback = "";
      });
    }
  }

  renderCard() {
    if (!this.config || !this.shadowRoot) return;

    const activeHouse = this._normalizeHouse(this._selectedHouse) || this.config.house;
    const variant = HOUSE_VARIANTS[activeHouse] || HOUSE_VARIANTS.home;
    const variantImage = this._variantImage(variant);
    const imageSrc = this.config.image || variantImage.src;
    const imageFallback = this.config.image ? variantImage.src : variantImage.fallback;
    const metricHtml = METRICS.map((metric) => this._renderMetric(metric, variant)).join("");
    const gridHtml = METRICS.map(
      (metric) => `
        <div class="tile">
          <div class="name">${this._escape(metric.label)}</div>
          <div class="num">${this._escape(this._formatReading(metric))}</div>
        </div>
      `,
    ).join("");

    this.shadowRoot.innerHTML = `...`;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; --text-main:#f3f6ff; --text-muted:#9ba3b8; --glass:rgba(8,16,38,.65); --glass-soft:rgba(255,255,255,.08); --accent-yellow:#ffc233; --accent-blue:#1f8fff; --accent-green:#34d399; }
        ha-card { border-radius:18px; overflow:hidden; background:radial-gradient(110% 80% at 15% 0%, #232b44 0%, #111727 70%); color:var(--text-main); box-shadow:0 18px 45px rgba(0,0,0,.55); padding:16px; font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
        .header { display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:center; gap:10px; margin-bottom:12px; }
        .title { min-width:0; overflow-wrap:anywhere; font-size:1.28rem; font-weight:700; line-height:1.2; }
        .badge,.house-select { background:var(--glass-soft); border:1px solid rgba(255,255,255,.2); border-radius:8px; color:var(--text-main); font:inherit; font-size:.88rem; min-height:34px; }
        .badge { display:inline-flex; align-items:center; padding:0 10px; white-space:nowrap; }
        .house-select { max-width:140px; padding:0 30px 0 10px; }
        .scene { position:relative; aspect-ratio:91/64; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,.1); margin-bottom:12px; background:#101626; }
        .scene-image { display:block; width:100%; height:100%; object-fit:cover; filter:saturate(1.03) contrast(1.03); }
        .metric { position:absolute; width:clamp(92px,18%,132px); transform:translate(-50%,-50%); background:var(--glass); border:1px solid rgba(255,255,255,.18); backdrop-filter:blur(4px); border-radius:10px; padding:8px 10px; box-shadow:0 8px 24px rgba(0,0,0,.35); pointer-events:none; }
        .metric .label,.tile .name { color:var(--text-muted); font-size:.74rem; line-height:1.2; }
        .metric .value,.tile .num { font-size:.98rem; font-weight:700; line-height:1.25; overflow-wrap:anywhere; }
        .value.yellow{color:var(--accent-yellow)} .value.blue{color:var(--accent-blue)} .value.green{color:var(--accent-green)}
        .grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:8px; }
        .tile { background:rgba(12,20,38,.72); border:1px solid rgba(255,255,255,.08); border-radius:8px; padding:10px; min-width:0; }
        @media (max-width:700px){ .header{grid-template-columns:minmax(0,1fr);align-items:stretch;} .badge,.house-select{width:100%;} .metric{width:clamp(76px,22%,108px);padding:6px 8px;} .metric .label{font-size:.66rem;} .metric .value{font-size:.82rem;} .grid{grid-template-columns:repeat(2,minmax(0,1fr));} }
      </style>
      <ha-card>
        <div class="header"><div class="title">${this._escape(this.config.title)}</div>${this._renderHouseSelector(activeHouse)}<div class="badge">${this._escape(this.config.time_label)}</div></div>
        <div class="scene"><img class="scene-image" src="${this._escape(imageSrc)}" data-fallback="${this._escape(imageFallback || "")}" alt="${this._escape(variant.label)}" />${metricHtml}</div>
        <div class="grid">${gridHtml}</div>
      </ha-card>
    `;

    this._attachControls();
  }
}

class HaSolarDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { entities: {}, ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _onInput(path, value, isCheckbox = false) {
    const next = structuredClone(this._config || {});
    if (path.includes(".")) {
      const [section, key] = path.split(".");
      next[section] = next[section] || {};
      next[section][key] = isCheckbox ? Boolean(value) : value;
    } else {
      next[path] = isCheckbox ? Boolean(value) : value;
    }
    this._config = next;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: next } }));
  }

  _entityOptions() {
    return Object.keys(this._hass?.states || {}).sort();
  }

  _renderEntityField(metric) {
    const selected = this._config?.entities?.[metric.key] || "";
    const options = this._entityOptions()
      .map((entityId) => `<option value="${entityId}"${entityId === selected ? " selected" : ""}>${entityId}</option>`)
      .join("");
    return `
      <label>
        ${metric.label}
        <select data-path="entities.${metric.key}">
          <option value="">-- select entity --</option>
          ${options}
        </select>
      </label>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const house = this._config.house || "home";
    const houseOptions = Object.entries(HOUSE_VARIANTS)
      .map(([key, value]) => `<option value="${key}"${key === house ? " selected" : ""}>${value.label}</option>`)
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        .editor{display:grid;gap:12px;font-family:system-ui,sans-serif}
        label{display:grid;gap:4px;font-size:13px}
        input,select{padding:8px;border:1px solid #bbb;border-radius:8px}
        .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      </style>
      <div class="editor">
        <label>Title <input data-path="title" value="${this._config.title || ""}" /></label>
        <label>Time Label <input data-path="time_label" value="${this._config.time_label || ""}" /></label>
        <label>House Type <select data-path="house">${houseOptions}</select></label>
        <label><input type="checkbox" data-path="show_house_selector" ${this._config.show_house_selector !== false ? "checked" : ""}/> Show house selector</label>
        <div class="grid">${METRICS.map((metric) => this._renderEntityField(metric)).join("")}</div>
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
