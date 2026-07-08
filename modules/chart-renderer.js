export function createChartRendererMethods({
  chartBounds,
  chartLastPointCoordinates,
  chartPath,
  flattenChartSections,
} = {}) {
  return {
    _formatChartValue(value, metric) {
      if (this._isMetricEnergyMode(metric)) return this._formatEnergyValue(value, "kWh", "kWh");
      if (metric.unit === "energy") return this._formatEnergyValue(value, "kWh", "kWh");
      if (metric.unit === "boolean") return value >= 0.5 ? this._t("ev.yes", {}, "Yes") : this._t("ev.no", {}, "No");
      if (metric.overlay === "heatpump") {
        const entityUnit = this._getEntityUnit(this._metricEntityId(metric));
        if (this._isPowerUnit(entityUnit)) return this._formatPowerValue(value, "auto", "W");
        if (this._isEnergyUnit(entityUnit)) return this._formatEnergyValue(value, entityUnit, "kWh");
      }
      if (metric.overlay === "smoke") {
        const unit = this._getEntityUnit(this._metricEntityId(metric)) || "m\u00b3";
        return `${Number(value).toFixed(2)} ${unit}`;
      }
      if (metric.unit === "volume") return this._formatVolumeValue(value, "m\u00b3", this._volumeTargetUnit(metric));
      if (metric.unit === "power") return this._formatPowerValue(value, this._unitForMetric(metric), "W");
      if (metric.key === "battery_level") return this._formatWithUnit(Math.round(value), this._unitForMetric(metric));
      const unit = this._unitForMetric(metric);
      return this._formatWithUnit(Number(value.toFixed(2)), unit === "auto" ? this._getEntityUnit(this._metricEntityId(metric)) : unit);
    },

    _formatChartTime(timestamp) {
      try {
        return new Intl.DateTimeFormat(this._language(), { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
      } catch (_err) {
        return new Date(timestamp).toLocaleTimeString();
      }
    },

    _chartPath(points, min, max, start, end, width, height, padding) {
      return chartPath(points, min, max, start, end, width, height, padding);
    },

    _renderChartSvg(metric, chart) {
      const points = chart.points || [];
      if (chart.loading) return `<div class="chart-message">${this._escape(this._t("chart.loading"))}</div>`;
      if (chart.error) return `<div class="chart-message is-error">${this._escape(chart.error)}</div>`;
      if (points.length < 2) return `<div class="chart-message">${this._escape(this._t("chart.empty"))}</div>`;

      const width = 720;
      const height = 260;
      const padding = { top: 22, right: 22, bottom: 36, left: 58 };
      const { min, max } = chartBounds(points);
      const start = Date.now() - chart.hours * 60 * 60 * 1000;
      const end = Date.now();
      const line = this._chartPath(points, min, max, start, end, width, height, padding);
      const latest = points[points.length - 1];
      const latestCoordinates = chartLastPointCoordinates(line, padding);
      const zeroY = min < 0 && max > 0
        ? padding.top + (1 - ((0 - min) / (max - min))) * (height - padding.top - padding.bottom)
        : undefined;

      return `
        <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${this._escape(this._metricLabel(metric, this._currentVariant))}">
          <line class="chart-gridline" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"></line>
          <line class="chart-gridline" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"></line>
          <line class="chart-gridline soft" x1="${padding.left}" y1="${padding.top + (height - padding.top - padding.bottom) / 2}" x2="${width - padding.right}" y2="${padding.top + (height - padding.top - padding.bottom) / 2}"></line>
          ${zeroY ? `<line class="chart-zero" x1="${padding.left}" y1="${zeroY.toFixed(1)}" x2="${width - padding.right}" y2="${zeroY.toFixed(1)}"></line>` : ""}
          <polyline class="chart-line" points="${this._escape(line)}"></polyline>
          <circle class="chart-dot" cx="${this._escape(latestCoordinates.x)}" cy="${this._escape(latestCoordinates.y)}" r="4"></circle>
          <text class="chart-label" x="${padding.left}" y="16">${this._escape(this._formatChartValue(max, metric))}</text>
          <text class="chart-label" x="${padding.left}" y="${height - 8}">${this._escape(this._formatChartTime(start))}</text>
          <text class="chart-label end" x="${width - padding.right}" y="${height - 8}">${this._escape(this._formatChartTime(end))}</text>
          <text class="chart-current" x="${width - padding.right}" y="16">${this._escape(this._formatChartValue(latest.value, metric))}</text>
        </svg>
      `;
    },

    _renderChartOverlay() {
      if (!this._activeChart) return "";
      const metric = this._chartMetric(this._activeChart.metricKey);
      if (!metric) return "";
      const entityId = this._metricEntityId(metric);
      const title = this._metricLabel(metric, this._currentVariant);
      const hours = this._activeChart.hours;
      const rangeButton = (value) => `
        <button type="button" class="chart-range${hours === value ? " active" : ""}" data-chart-hours="${value}">${this._escape(this._t(`chart.range${value}`))}</button>
      `;

      return `
        <div class="chart-backdrop" data-chart-close></div>
        <div class="chart-dialog" role="dialog" aria-modal="true" aria-label="${this._escape(title)}" style="${this._escape(this._accentStyle(metric))}">
          <div class="chart-head">
            <div class="chart-title">
              <strong>${this._escape(title)}</strong>
              <span>${this._escape(this._t("chart.subtitle", { hours }))}${entityId ? ` / ${this._escape(entityId)}` : ""}</span>
            </div>
            <div class="chart-actions">
              ${rangeButton(24)}
              ${rangeButton(48)}
              <button type="button" class="chart-close" data-chart-close aria-label="${this._escape(this._t("chart.close"))}">&times;</button>
            </div>
          </div>
          <div class="chart-body">
            ${this._renderChartSvg(metric, this._activeChart)}
          </div>
        </div>
      `;
    },

    _chartDashboardHours() {
      return [24, 48].includes(Number(this._chartHours)) ? Number(this._chartHours) : this.config.chart_hours || 24;
    },

    _renderChartDashboardCard(metric) {
      const entityId = this._chartEntityId(metric);
      const chart = this._dashboardChartState(metric);
      const normalizedChart = chart?.error === true
        ? { hours: this._chartDashboardHours(), loading: false, error: this._t("chart.error"), points: [] }
        : chart;
      return `
        <article class="chart-card" data-chart-dashboard-card="${this._escape(metric.chartKey || metric.key)}" style="${this._escape(this._accentStyle(metric))}">
          <div class="chart-card-head">
            <div>
              <strong>${this._escape(this._metricLabel(metric, this._currentVariant))}</strong>
              <span>${this._escape(entityId)}</span>
            </div>
            <button type="button" class="chart-open-button" data-chart-key="${this._escape(metric.key)}" aria-label="${this._escape(this._t("charts.openLarge", {}, "Open large chart"))}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5"></path><path d="M4 19h16"></path><path d="m7 15 3-4 3 2 4-6"></path><path d="M17 7h3v3"></path></svg>
            </button>
          </div>
          <div class="chart-card-body">
            ${this._renderChartSvg(metric, normalizedChart)}
          </div>
        </article>
      `;
    },

    _renderChartDashboard(variant = this._currentVariant || this._layoutState().variant) {
      const sections = this._chartDashboardSections(variant);
      this._chartDashboardRenderIndex = 0;
      const totalCharts = flattenChartSections(sections).length;
      const hours = this._chartDashboardHours();
      const rangeButton = (value) => `
        <button type="button" class="chart-range${hours === value ? " active" : ""}" data-chart-dashboard-hours="${value}">${this._escape(this._t(`chart.range${value}`, {}, `${value}h`))}</button>
      `;
      const sectionHtml = sections.map((section) => `
        <section class="chart-section">
          <div class="chart-section-head">
            <h3>${this._escape(section.label)}</h3>
            <span>${this._escape(section.items.length === 1
              ? this._t("charts.countOne", { count: section.items.length }, "1 chart")
              : this._t("charts.count", { count: section.items.length }, `${section.items.length} charts`))}</span>
          </div>
          <div class="chart-grid">
            ${section.items.map((metric) => this._renderChartDashboardCard(metric)).join("")}
          </div>
        </section>
      `).join("");

      return `
        <section class="chart-dashboard" data-chart-dashboard>
          <div class="chart-dashboard-head">
            <div>
              <div class="chart-dashboard-label">${this._escape(this._t("charts.label", {}, "Charts"))}</div>
              <h2>${this._escape(this._t("charts.title", {}, "Entity history"))}</h2>
            </div>
            <div class="chart-actions">
              ${rangeButton(24)}
              ${rangeButton(48)}
            </div>
          </div>
          ${totalCharts > 0
            ? sectionHtml
            : `<div class="chart-message">${this._escape(this._t("charts.empty", {}, "No chartable entities configured yet."))}</div>`}
        </section>
      `;
    },
  };
}
