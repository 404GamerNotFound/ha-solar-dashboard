class HaSolarDashboardCard extends HTMLElement {
  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this.config = {
      title: "Energy",
      time_label: "Today",
      units: { energy: "kWh", power: "W" },
      entities: {},
      ...config,
      units: {
        energy: "kWh",
        power: "W",
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
    return 5;
  }

  static getStubConfig() {
    return {
      type: "custom:ha-solar-dashboard-card",
      title: "Energy",
      time_label: "Today",
    };
  }

  _getEntityValue(entityId, fallback = "0") {
    if (!entityId || !this._hass?.states?.[entityId]) return fallback;
    return this._hass.states[entityId].state;
  }

  renderCard() {
    if (!this.config || !this.shadowRoot) return;

    const { title, time_label, entities, units } = this.config;

    const gridEnergy = this._getEntityValue(entities.grid_energy, "6.6");
    const solarEnergy = this._getEntityValue(entities.solar_energy, "6.4");
    const homeEnergy = this._getEntityValue(entities.home_energy, "13");

    const gridPower = this._getEntityValue(entities.grid_power, "467");
    const solarPower = this._getEntityValue(entities.solar_power, "564");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-bg: linear-gradient(180deg, #1e2230 0%, #171b28 100%);
          --text-main: #f3f6ff;
          --text-muted: #9ba3b8;
          --glass: rgba(255, 255, 255, 0.08);
          --chip: #2a2e3d;
          --blue: #1f8fff;
          --yellow: #ffc233;
          --line: rgba(255,255,255,0.14);
          display: block;
        }

        ha-card {
          border-radius: 24px;
          overflow: hidden;
          background: var(--card-bg);
          color: var(--text-main);
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.45);
          padding: 18px;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .title {
          font-size: 2rem;
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .badge {
          background: var(--glass);
          border: 1px solid rgba(255,255,255,0.15);
          color: var(--text-main);
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .kpis {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }

        .kpi-value { font-size: 1.9rem; font-weight: 700; }
        .kpi-unit { font-size: 1.1rem; opacity: 0.95; }
        .kpi-label { font-size: 1rem; color: var(--text-muted); margin-top: -2px; }

        .scene {
          position: relative;
          height: 240px;
          border-radius: 18px;
          background:
            radial-gradient(120% 80% at 35% 25%, rgba(120,130,180,0.30), transparent 55%),
            radial-gradient(100% 70% at 75% 35%, rgba(90,95,125,0.30), transparent 60%),
            linear-gradient(165deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
          border: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 14px;
          overflow: hidden;
        }

        .line {
          position: absolute;
          background: var(--line);
        }

        .line.h { height: 2px; }
        .line.v { width: 2px; }

        .line.l1 { left: 54%; top: 32%; width: 2px; height: 43%; background: linear-gradient(180deg, transparent, #ffc233 55%, transparent); animation: pulseY 2.8s ease-in-out infinite; }
        .line.l2 { left: 54%; top: 67%; width: 28%; height: 2px; background: linear-gradient(90deg, #1f8fff, rgba(31,143,255,0.25)); animation: pulseX 3s ease-in-out infinite; }
        .line.l3 { left: 24%; top: 70%; width: 30%; height: 2px; }

        .icon {
          position: absolute;
          width: 78px;
          height: 78px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 2rem;
          background: rgba(0, 0, 0, 0.24);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(2px);
        }

        .solar { left: 37%; top: 16%; }
        .home { right: 14%; top: 43%; }
        .grid { left: 16%; bottom: 16%; }

        .chips {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 6px;
        }

        .chip {
          border-radius: 14px;
          background: var(--chip);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .chip .emoji { font-size: 1.35rem; }
        .chip .label { font-weight: 700; font-size: 1rem; }
        .chip .sub { color: var(--text-muted); font-size: 0.95rem; }

        @keyframes pulseY {
          0%, 100% { opacity: 0.55; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(3px); }
        }

        @keyframes pulseX {
          0%, 100% { opacity: 0.55; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(4px); }
        }
      </style>

      <ha-card>
        <div class="header">
          <div class="title">${title}</div>
          <div class="badge">${time_label}</div>
        </div>

        <div class="kpis">
          <div>
            <div><span class="kpi-value">${gridEnergy}</span> <span class="kpi-unit">${units.energy}</span></div>
            <div class="kpi-label">Grid</div>
          </div>
          <div>
            <div><span class="kpi-value">${solarEnergy}</span> <span class="kpi-unit">${units.energy}</span></div>
            <div class="kpi-label">Solar Panels</div>
          </div>
          <div>
            <div><span class="kpi-value">${homeEnergy}</span> <span class="kpi-unit">${units.energy}</span></div>
            <div class="kpi-label">Home</div>
          </div>
        </div>

        <div class="scene">
          <div class="icon solar">☀️</div>
          <div class="icon home">🏠</div>
          <div class="icon grid">⚡</div>
          <div class="line l1"></div>
          <div class="line l2"></div>
          <div class="line l3"></div>
        </div>

        <div class="chips">
          <div class="chip">
            <div class="emoji">⚡</div>
            <div>
              <div class="label">Electricity</div>
              <div class="sub">${gridPower}${units.power} • Importing</div>
            </div>
          </div>
          <div class="chip">
            <div class="emoji">☀️</div>
            <div>
              <div class="label">Solar</div>
              <div class="sub">${solarPower}${units.power}</div>
            </div>
          </div>
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
