class HaSolarDashboardCard extends HTMLElement {
  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this.config = {
      title: "Energy Flow",
      time_label: "Live",
      units: { power: "W", battery: "%" },
      image: "/local/images/home.png",
      entities: {},
      ...config,
      units: {
        power: "W",
        battery: "%",
        ...(config.units || {}),
      },
      entities: {
        ...(config.entities || {}),
      },
    };

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

  static getStubConfig() {
    return {
      type: "custom:ha-solar-dashboard-card",
      title: "Energy Flow",
      time_label: "Live",
      image: "/local/images/home.png",
      entities: {
        pv_roof_power: "sensor.pv_roof_power",
        pv_shed_power: "sensor.pv_shed_power",
        battery_level: "sensor.battery_level",
        inverter_power: "sensor.inverter_power",
        wallbox_power: "sensor.wallbox_power",
      },
    };
  }

  _getEntityValue(entityId, fallback = "0") {
    if (!entityId || !this._hass?.states?.[entityId]) return fallback;
    return this._hass.states[entityId].state;
  }

  _formatValue(value) {
    if (value === undefined || value === null || value === "unknown" || value === "unavailable") return "—";
    return value;
  }

  renderCard() {
    if (!this.config || !this.shadowRoot) return;

    const { title, time_label, entities, units, image } = this.config;

    const pvRoofPower = this._formatValue(this._getEntityValue(entities.pv_roof_power, "0"));
    const pvShedPower = this._formatValue(this._getEntityValue(entities.pv_shed_power, "0"));
    const batteryLevel = this._formatValue(this._getEntityValue(entities.battery_level, "0"));
    const inverterPower = this._formatValue(this._getEntityValue(entities.inverter_power, "0"));
    const wallboxPower = this._formatValue(this._getEntityValue(entities.wallbox_power, "0"));

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --text-main: #f3f6ff;
          --text-muted: #9ba3b8;
          --glass: rgba(8, 16, 38, 0.65);
          --glass-soft: rgba(255, 255, 255, 0.08);
          --accent-yellow: #ffc233;
          --accent-blue: #1f8fff;
          --accent-green: #34d399;
          display: block;
        }

        ha-card {
          border-radius: 24px;
          overflow: hidden;
          background: radial-gradient(110% 80% at 15% 0%, #232b44 0%, #111727 70%);
          color: var(--text-main);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
          padding: 16px;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .title { font-size: 1.4rem; font-weight: 700; }

        .badge {
          background: var(--glass-soft);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          padding: 6px 10px;
          font-size: 0.9rem;
          color: var(--text-main);
        }

        .scene {
          position: relative;
          aspect-ratio: 16 / 10;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 12px;
        }

        .scene img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.03) contrast(1.03);
        }

        .metric {
          position: absolute;
          min-width: 120px;
          background: var(--glass);
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(4px);
          border-radius: 12px;
          padding: 8px 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }

        .metric .label { font-size: 0.76rem; color: var(--text-muted); }
        .metric .value { font-size: 1rem; font-weight: 700; }

        .pv-roof { left: 26%; top: 17%; }
        .pv-shed { right: 8%; bottom: 16%; }
        .battery { left: 47%; top: 48%; }
        .inverter { left: 58%; top: 54%; }
        .wallbox { left: 19%; top: 57%; }

        .value.yellow { color: var(--accent-yellow); }
        .value.blue { color: var(--accent-blue); }
        .value.green { color: var(--accent-green); }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .tile {
          background: rgba(12, 20, 38, 0.72);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 10px;
        }

        .tile .name { font-size: 0.8rem; color: var(--text-muted); }
        .tile .num { font-size: 1.02rem; font-weight: 700; }
      </style>

      <ha-card>
        <div class="header">
          <div class="title">${title}</div>
          <div class="badge">${time_label}</div>
        </div>

        <div class="scene">
          <img src="${image}" alt="Solar house overview" />

          <div class="metric pv-roof">
            <div class="label">PV Roof</div>
            <div class="value yellow">${pvRoofPower} ${units.power}</div>
          </div>

          <div class="metric pv-shed">
            <div class="label">PV Shed</div>
            <div class="value yellow">${pvShedPower} ${units.power}</div>
          </div>

          <div class="metric battery">
            <div class="label">Battery</div>
            <div class="value green">${batteryLevel} ${units.battery}</div>
          </div>

          <div class="metric inverter">
            <div class="label">Inverter</div>
            <div class="value blue">${inverterPower} ${units.power}</div>
          </div>

          <div class="metric wallbox">
            <div class="label">Wallbox</div>
            <div class="value blue">${wallboxPower} ${units.power}</div>
          </div>
        </div>

        <div class="grid">
          <div class="tile"><div class="name">PV Roof</div><div class="num">${pvRoofPower} ${units.power}</div></div>
          <div class="tile"><div class="name">PV Shed</div><div class="num">${pvShedPower} ${units.power}</div></div>
          <div class="tile"><div class="name">Inverter Power</div><div class="num">${inverterPower} ${units.power}</div></div>
          <div class="tile"><div class="name">Wallbox Power</div><div class="num">${wallboxPower} ${units.power}</div></div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("ha-solar-dashboard-card", HaSolarDashboardCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-solar-dashboard-card",
  name: "HA Solar Dashboard Card",
  description: "PV energy overview dashboard card",
});
