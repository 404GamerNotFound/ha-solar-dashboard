export function createAdvisorViewMethods() {
  return {
  _renderEnergyAdvisor({ dashboard = false } = {}) {
    if (!dashboard) return "";
    const snapshot = this._advisorSnapshot();
    const items = this._advisorItems(snapshot, { maxItems: this._advisorSuggestionLimit() });
    const status = this._advisorStatus(snapshot, items);
    const powerFormatter = (value) => this._formatPowerValue(value, this.config.units?.power || "auto", "W");
    const percentFormatter = (value) => `${Math.round(value)}%`;
    const gridStatus = Number.isFinite(snapshot.gridWatts)
      ? snapshot.gridWatts > this._gridNeutralThreshold()
        ? `${this._t("advisor.importing", {}, "Importing")} ${powerFormatter(snapshot.importWatts)}`
        : snapshot.gridWatts < -this._gridNeutralThreshold()
          ? `${this._t("advisor.exporting", {}, "Exporting surplus")} ${powerFormatter(snapshot.exportWatts)}`
          : this._t("advisor.selfSufficient", {}, "Self-sufficient")
      : this._t("advisor.unknown", {}, "Unknown");
    const batteryStatus = Number.isFinite(snapshot.batteryPercent)
      ? [
        `${Math.round(snapshot.batteryPercent)}%`,
        Number.isFinite(snapshot.batteryMinSocPercent) || Number.isFinite(snapshot.batteryMaxSocPercent)
          ? `(${Number.isFinite(snapshot.batteryMinSocPercent) ? Math.round(snapshot.batteryMinSocPercent) : "—"}-${Number.isFinite(snapshot.batteryMaxSocPercent) ? Math.round(snapshot.batteryMaxSocPercent) : "—"}%)`
          : "",
      ].filter(Boolean).join(" ")
      : this._formatBatteryFlowValue(snapshot.batteryFlow) || this._t("advisor.unknown", {}, "Unknown");
    const metrics = [
      [this._t("advisor.pv", {}, "PV"), this._advisorMetricValue(snapshot.pvWatts, powerFormatter)],
      [this._t("advisor.grid", {}, "Grid"), gridStatus],
      [this._t("advisor.batteryStatus", {}, "Battery"), batteryStatus],
      [this._t("advisor.consumption", {}, "Load"), this._advisorMetricValue(snapshot.loadWatts, powerFormatter)],
      [this._t("advisor.selfConsumption", {}, "Self-use"), this._advisorMetricValue(snapshot.selfConsumptionPercent, percentFormatter)],
      [this._t("advisor.autarky", {}, "Autarky"), this._advisorMetricValue(snapshot.autarkyPercent, percentFormatter)],
      ...this._customKpiMetrics().map((metric) => [this._metricLabel(metric), this._formatReading(metric), this._accentStyle(metric)]),
      ...this._environmentSensorMetrics().map((metric) => [this._metricLabel(metric), this._formatReading(metric), this._accentStyle(metric)]),
    ];
    const metricHtml = metrics.map(([label, value, style = ""]) => `
      <div class="advisor-metric" style="${this._escape(style)}">
        <span>${this._escape(label)}</span>
        <strong>${this._escape(value)}</strong>
      </div>
    `).join("");
    const itemHtml = items.map((item, index) => {
      const itemKey = this._advisorItemKey(item, index);
      const dismissKey = this._advisorDismissKey(item);
      const open = this._openAdvisorDetails?.has(itemKey);
      const explanation = this._advisorItemDetails(item, snapshot);
      const details = Array.isArray(item.details) && item.details.length > 0
        ? `<div class="advisor-item-details">${item.details.map((detail) => `<span>${this._escape(detail)}</span>`).join("")}</div>`
        : "";
      const metaHtml = `
        <div class="advisor-item-meta">
          <span>${this._escape(this._advisorTypeLabel(item.type))}</span>
          <span>${this._escape(this._advisorWindowLabel(item.window))}</span>
          <button type="button" data-advisor-dismiss-key="${this._escape(dismissKey)}">${this._escape(this._t("advisor.dismissToday", {}, "Hide today"))}</button>
        </div>
      `;
      const explanationHtml = `
        <div class="advisor-explanation" ${open ? "" : "hidden"}>
          <div class="advisor-explanation-section">
            <strong>${this._escape(this._t("advisor.detailWhy", {}, "Why this appears"))}</strong>
            ${(explanation.paragraphs?.length ? explanation.paragraphs : [explanation.why]).map((paragraph) => `<p>${this._escape(paragraph)}</p>`).join("")}
          </div>
          ${explanation.entities.length > 0 ? `
            <details class="advisor-explanation-sources">
              <summary>${this._escape(this._t("advisor.detailSources", {}, "Data sources"))}</summary>
              <div>${explanation.entities.map((entity) => `<code>${this._escape(entity)}</code>`).join("")}</div>
            </details>
          ` : ""}
        </div>
      `;
      return `
        <div class="advisor-item advisor-${this._escape(item.type)}${open ? " is-open" : ""}" role="button" tabindex="0" aria-expanded="${open ? "true" : "false"}" aria-label="${this._escape(this._t("advisor.detailsToggle", {}, "Show details"))}" data-advisor-item-key="${this._escape(itemKey)}">
          <div class="advisor-item-head">
            <strong>${this._escape(item.title)}</strong>
            ${item.value ? `<span>${this._escape(item.value)}</span>` : ""}
          </div>
          <div class="advisor-item-text">${this._escape(item.text)}</div>
          ${metaHtml}
          ${details}
          ${explanationHtml}
        </div>
      `;
    }).join("");

    return `
      <section class="advisor advisor-${this._escape(status.type)}${dashboard ? " advisor-dashboard" : ""}" data-energy-advisor>
        <div class="advisor-head">
          <div>
            <div class="advisor-label">${this._escape(this._t("advisor.panelTitle", {}, "Energy Advisor"))}</div>
            <div class="advisor-title" data-advisor-title>${this._escape(status.label)}</div>
          </div>
          <div class="advisor-state">${this._escape(this._t("advisor.status", {}, "Status"))}</div>
        </div>
        <div class="advisor-items-head">
          <span>${this._escape(this._t("advisor.recommendations", {}, "Recommendations"))}</span>
          <strong>${this._escape(items.length === 1
            ? this._t("advisor.suggestionCountOne", { count: items.length }, `${items.length} suggestion`)
            : this._t("advisor.suggestionCount", { count: items.length }, `${items.length} suggestions`))}</strong>
        </div>
        <div class="advisor-items" data-advisor-items>${itemHtml}</div>
        <div class="advisor-metrics" data-advisor-metrics>${metricHtml}</div>
      </section>
    `;
  }
  };
}
