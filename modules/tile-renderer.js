export function createTileRendererMethods() {
  return {
    _tileStyle(metric) {
      const columns = Math.round(this._clampNumber(metric.tileColumns ?? 1, 1, 1, 6));
      const mobileColumns = Math.min(columns, 2);
      return `${this._accentStyle(metric)} order:${Number(metric.tileOrder ?? 0)}; --tile-columns:${columns}; --tile-mobile-columns:${mobileColumns};`;
    },

    _renderTile(metric, variant) {
      const tooltip = this._metricTooltip(metric, variant);
      const warning = this._metricWarning(metric);
      const visibilityClass = metric.overlay ? this._labelVisibilityClass(metric.key, "footer") : "";
      const valueHtml = metric.key === "battery_level"
        ? `
          <div class="tile-value-row">
            <div class="num" data-value="${metric.key}">${this._renderMetricValueHtml(metric)}</div>
          </div>
          ${this._renderBatteryMetaRow(metric, { placement: "footer" })}
          ${this._renderVoltageMetaRow(metric, { placement: "footer" })}
        `
        : this._wallboxPhaseEntityKey(metric)
        ? `
          <div class="num" data-value="${metric.key}">${this._renderMetricValueHtml(metric)}</div>
          ${this._renderWallboxPhaseRow(metric, { placement: "footer" })}
          ${this._renderVoltageMetaRow(metric, { placement: "footer" })}
        `
        : this._isPvMetric(metric)
        ? `
          <div class="num" data-value="${metric.key}">${this._renderMetricValueHtml(metric)}</div>
          ${this._renderPvMetaRow(metric, { placement: "footer" })}
          ${this._renderVoltageMetaRow(metric, { placement: "footer" })}
        `
        : `
          <div class="num" data-value="${metric.key}">${this._renderMetricValueHtml(metric)}</div>
          ${this._renderVoltageMetaRow(metric, { placement: "footer" })}
        `;
      return `
        <div class="tile${this._metricStateClass(metric)}${visibilityClass}" data-accent-key="${metric.key}" data-tile="${metric.key}" data-tooltip-key="${metric.key}" data-chart-key="${this._escape(this._metricEntityId(metric) ? metric.key : "")}" data-warning="${this._escape(warning?.label || "")}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${this._escape(this._tileStyle(metric))}">
          <div class="name" data-label="${metric.key}">${this._escape(this._metricLabel(metric, variant))}</div>
          ${valueHtml}
          ${this._renderMetricMeter(metric)}
        </div>
      `;
    },
  };
}
