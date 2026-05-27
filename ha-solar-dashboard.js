const HA_SOLAR_DASHBOARD_BUILD = "2026-05-22-bootstrap";
globalThis.__HA_SOLAR_DASHBOARD_BUILD__ = HA_SOLAR_DASHBOARD_BUILD;
(function registerHaSolarDashboardBootstrap() {
  const type = "ha-solar-dashboard-card";
  if (!globalThis.customElements || !globalThis.HTMLElement || customElements.get(type)) return;
  customElements.define(type, class HaSolarDashboardBootstrap extends HTMLElement {
    setConfig(config) {
      this.config = config;
    }

    connectedCallback() {
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = "<div style=\"display:block;padding:16px;border-radius:12px;background:#1f2937;color:#e5e7eb;font:14px system-ui,sans-serif\">HA Solar Dashboard wird geladen...</div>";
    }
  });
}());

const ADVISOR_DEFAULTS = Object.freeze({
  surplusThreshold: 250,
  importThreshold: 250,
  highLoadThreshold: 3000,
  evSurplusThreshold: 1500,
  maxSuggestions: 8,
  staleSensorWarningMinutes: 30,
  staleSensorCriticalMinutes: 1440,
});

const ADVISOR_TYPE_RANKS = Object.freeze({
  critical: 4,
  warning: 3,
  info: 2,
  setup: 2,
  opportunity: 1,
  success: 0,
});

function clampNumber(value, fallback, min = -Infinity, max = Infinity) {
  const numericValue = Number(value);
  const baseValue = Number.isFinite(numericValue) ? numericValue : fallback;
  return Math.min(max, Math.max(min, baseValue));
}

function normalizeAdvisorConfig(config = {}) {
  const staleSensorWarningMinutes = clampNumber(
    config.advisor_stale_sensor_warning_minutes,
    ADVISOR_DEFAULTS.staleSensorWarningMinutes,
    1,
    10080,
  );
  return {
    advisor_surplus_threshold: clampNumber(config.advisor_surplus_threshold, ADVISOR_DEFAULTS.surplusThreshold, 0, 1000000),
    advisor_import_threshold: clampNumber(config.advisor_import_threshold, ADVISOR_DEFAULTS.importThreshold, 0, 1000000),
    advisor_high_load_threshold: clampNumber(config.advisor_high_load_threshold, ADVISOR_DEFAULTS.highLoadThreshold, 0, 1000000),
    advisor_ev_surplus_threshold: clampNumber(config.advisor_ev_surplus_threshold, ADVISOR_DEFAULTS.evSurplusThreshold, 0, 1000000),
    advisor_max_suggestions: Math.round(clampNumber(config.advisor_max_suggestions, ADVISOR_DEFAULTS.maxSuggestions, 1, 12)),
    advisor_stale_sensor_warning_minutes: staleSensorWarningMinutes,
    advisor_stale_sensor_critical_minutes: clampNumber(
      config.advisor_stale_sensor_critical_minutes,
      ADVISOR_DEFAULTS.staleSensorCriticalMinutes,
      Math.max(ADVISOR_DEFAULTS.staleSensorCriticalMinutes, staleSensorWarningMinutes),
      20160,
    ),
  };
}

function advisorThresholds(config = {}) {
  const normalized = normalizeAdvisorConfig(config);
  return {
    surplusThreshold: normalized.advisor_surplus_threshold,
    importThreshold: normalized.advisor_import_threshold,
    highLoadThreshold: normalized.advisor_high_load_threshold,
    evSurplusThreshold: normalized.advisor_ev_surplus_threshold,
    maxSuggestions: normalized.advisor_max_suggestions,
    staleSensorWarningMinutes: normalized.advisor_stale_sensor_warning_minutes,
    staleSensorCriticalMinutes: normalized.advisor_stale_sensor_critical_minutes,
  };
}

function advisorSuggestionLimit(config = {}) {
  return normalizeAdvisorConfig(config).advisor_max_suggestions;
}

function advisorTypeRank(type) {
  return ADVISOR_TYPE_RANKS[type] ?? ADVISOR_TYPE_RANKS.info;
}

function sortAdvisorItems(items = []) {
  return [...items].sort((a, b) => (
    advisorTypeRank(b.type) - advisorTypeRank(a.type)
  ) || ((b.priority ?? 0) - (a.priority ?? 0)));
}

function createAdvisorEngineMethods({
  CARD_TYPE,
  GRID_STATUS_METRIC,
  WALLBOX_POWER_KEYS,
  advisorSuggestionLimit,
  advisorThresholds,
  advisorTypeRank,
  findMetricByKey,
  largeConsumerAdvisorDetails,
  numericState,
  pvRoofStringAdvisorDetails,
  sortAdvisorItems,
  wallboxAdvisorDetails,
} = {}) {
  return {
  _positiveWattsForKey(key) {
    const watts = this._flowWattsForKey(key);
    return Number.isFinite(watts) ? Math.max(0, watts) : undefined;
  },

  _wallboxAdvisorDetails() {
    return wallboxAdvisorDetails(WALLBOX_POWER_KEYS, {
      metricForKey: (key) => findMetricByKey(key) || { key, label: key, unit: "power" },
      entityForKey: (key) => this.config.entities?.[key] || "",
      positiveWattsForKey: (key) => this._positiveWattsForKey(key),
      socEntityIdForMetric: (metric) => this._wallboxSocEntityId(metric),
      maxSocEntityIdForMetric: (metric) => this._wallboxMaxSocEntityId(metric),
      percentFromEntity: (entityId) => this._numericPercentFromEntity(entityId),
      entityLastChangedMs: (entityId) => this._getEntityLastChangedMs(entityId),
      trackedConditionMinutes: (id, condition, lastChangedMs) => this._trackedConditionMinutes(id, condition, lastChangedMs),
      metricLabel: (metric) => this._metricLabel(metric, this._currentVariant),
      phaseActionInfoForMetric: (metric) => this._wallboxPhaseActionInfo(metric),
      connectedStateForMetric: (metric) => this._wallboxConnectedState(metric),
      chargingEnabledStateForMetric: (metric) => this._wallboxChargingEnabledState(metric),
    });
  },

  _largeConsumerAdvisorDetails() {
    return largeConsumerAdvisorDetails(this.config.large_consumers || [], {
      labelForConsumer: (consumer, index) => this._largeConsumerLabel(consumer, index),
      powerWattsForConsumer: (consumer) => this._largeConsumerPowerWatts(consumer),
      parsePowerLimitWatts: (value, unit) => this._parsePowerLimitWatts(value, unit),
    });
  },

  _pvRoofStringAdvisorDetails() {
    if (!this._hasAdditionalPvRoofStrings()) return [];
    return pvRoofStringAdvisorDetails(this._pvRoofStringEntries(), {
      readPowerWatts: (entry) => this._pvRoofStringEntryPowerWatts(entry),
    });
  },

  _advisorSnapshot() {
    const pvTotal = this._positiveWattsForKey("pv_total_power");
    const pvParts = ["pv_roof_power", "pv_shed_power"]
      .map((key) => this._positiveWattsForKey(key))
      .filter(Number.isFinite);
    const pvWatts = Number.isFinite(pvTotal)
      ? pvTotal
      : pvParts.length > 0
        ? pvParts.reduce((sum, value) => sum + value, 0)
        : undefined;
    const gridInfo = this._gridFlowInfo();
    const gridSplitPower = this._gridSplitPowerDetails();
    const gridWatts = Number.isFinite(gridInfo?.watts) ? gridInfo.watts : undefined;
    const importWatts = Number.isFinite(gridWatts) ? Math.max(0, gridWatts) : undefined;
    const exportWatts = Number.isFinite(gridWatts) ? Math.max(0, -gridWatts) : undefined;
    const houseWatts = this._positiveWattsForKey("house_consumption_power");
    const wallboxWatts = WALLBOX_POWER_KEYS
      .map((key) => this._positiveWattsForKey(key))
      .filter(Number.isFinite)
      .reduce((sum, value) => sum + value, 0);
    const wallboxes = this._wallboxAdvisorDetails();
    const hasWallbox = WALLBOX_POWER_KEYS.some((key) => Boolean(this.config.entities?.[key]));
    const largeConsumers = this._largeConsumerAdvisorDetails();
    const largeConsumerWatts = largeConsumers.reduce((sum, consumer) => sum + (Number.isFinite(consumer.watts) ? consumer.watts : 0), 0);
    const pvRoofStrings = this._pvRoofStringAdvisorDetails();
    const batteryMetric = findMetricByKey("battery_level") || { key: "battery_level", unit: "battery" };
    const batteryPercent = this._batteryPercent(batteryMetric);
    const batterySocEntityId = this._batterySocEntityId();
    const batteryMinSocPercent = this._batteryMinSocPercent();
    const batteryMaxSocPercent = this._batteryMaxSocPercent();
    const batteryReserveThreshold = this._batteryReserveThreshold();
    const batteryFullThreshold = this._batteryFullThreshold();
    const batteryTemperatureCelsius = this._batteryTemperatureCelsius();
    const batteryCyclesToday = this._batteryCyclesToday();
    const batteryHighSocMinutes = this._trackedConditionMinutes(
      "battery:soc-90-100",
      Number.isFinite(batteryPercent) && batteryPercent >= 90 && batteryPercent <= 100,
      this._getEntityLastChangedMs(batterySocEntityId),
    );
    const batteryFlow = this._batteryFlowInfo();
    const batteryFlowWatts = batteryFlow?.kind === "energy" ? batteryFlow.amount * 1000 : batteryFlow?.amount;
    const batteryChargeWatts = batteryFlow?.direction === "charge" && Number.isFinite(batteryFlowWatts) ? batteryFlowWatts : 0;
    const batteryDischargeWatts = batteryFlow?.direction === "discharge" && Number.isFinite(batteryFlowWatts) ? batteryFlowWatts : 0;
    const loadWatts = Number.isFinite(houseWatts)
      ? houseWatts
      : wallboxWatts + largeConsumerWatts > 0
        ? wallboxWatts + largeConsumerWatts
        : undefined;
    const selfConsumptionPercent = Number.isFinite(pvWatts) && pvWatts > 0 && Number.isFinite(exportWatts)
      ? this._clampNumber(((pvWatts - exportWatts) / pvWatts) * 100, 0, 0, 100)
      : undefined;
    const autarkyPercent = Number.isFinite(loadWatts) && loadWatts > 0 && Number.isFinite(importWatts)
      ? this._clampNumber(((loadWatts - importWatts) / loadWatts) * 100, 0, 0, 100)
      : undefined;
    const electricityPriceEntityId = this.config.entities?.electricity_price || "";
    const electricityPrice = electricityPriceEntityId ? numericState(this._getEntityValue(electricityPriceEntityId, undefined)) : undefined;
    const weatherState = this._weatherState();

    return {
      pvWatts,
      gridWatts,
      gridSplitPower,
      importWatts,
      exportWatts,
      houseWatts,
      wallboxWatts,
      wallboxes,
      hasWallbox,
      largeConsumers,
      largeConsumerWatts,
      pvRoofStrings,
      batteryPercent,
      batterySocEntityId,
      batteryMinSocPercent,
      batteryMaxSocPercent,
      batteryReserveThreshold,
      batteryFullThreshold,
      batteryTemperatureCelsius,
      batteryCyclesToday,
      batteryHighSocMinutes,
      batteryFlow,
      batteryChargeWatts,
      batteryDischargeWatts,
      loadWatts,
      selfConsumptionPercent,
      autarkyPercent,
      electricityPrice,
      electricityPriceUnit: electricityPriceEntityId ? this._getEntityUnit(electricityPriceEntityId) : "",
      electricityPriceEntityId,
      weatherState,
      hasPv: Number.isFinite(pvWatts),
      hasGrid: Number.isFinite(gridWatts),
      hasLoad: Number.isFinite(loadWatts),
    };
  },

  _advisorWarnings() {
    const variant = this._currentVariant || this._layoutState().variant;
    const metrics = [
      ...this._visibleMetrics(variant),
      ...this._visibleTileMetrics(variant).filter((metric) => metric.customKpi),
      ...this._environmentSensorMetrics(),
      ...this._largeConsumerMetrics(),
      ...(this._showGridStatusTile() ? [GRID_STATUS_METRIC] : []),
      ...this._visibleOverlayMetrics(),
    ];
    return metrics.filter((metric, index, list) => list.findIndex((item) => item.key === metric.key) === index)
      .map((metric) => {
        const warning = this._metricWarning(metric);
        if (!warning) return undefined;
        const sensorDiagnostic = ["missing", "unavailable", "offline"].includes(warning.type);
        return {
          type: "warning",
          priority: 100,
          title: this._metricLabel(metric, this._currentVariant),
          text: warning.label,
          diagnostic: true,
          diagnosticKind: sensorDiagnostic ? "sensor" : warning.type,
        };
      })
      .filter(Boolean);
  },

  _entityDisplayName(entityId, fallback = "") {
    const entity = this._getEntity(entityId);
    const friendlyName = entity?.attributes?.friendly_name;
    if (friendlyName) return String(friendlyName);
    return fallback || String(entityId || "").replace(/^sensor\./, "").replace(/_/g, " ");
  },

  _advisorSensorCandidates() {
    const candidates = [];
    const add = (entityId, label = "", dynamic = false, options = {}) => {
      if (!entityId || typeof entityId !== "string") return;
      if (!dynamic) return;
      candidates.push({ entityId, label: label || this._entityDisplayName(entityId), ...options });
    };

    const dynamicPowerEntityKeys = new Set([
      "pv_roof_power",
      "pv_shed_power",
      "pv_total_power",
      "house_consumption_power",
      "battery_flow_power",
      "battery_charge_power",
      "battery_discharge_power",
      "inverter_power",
      "wallbox_power",
      "wallbox2_power",
      "import_export_power",
      "import_power",
      "export_power",
    ]);
    const dynamicStateEntityKeys = new Set(["battery_level", "battery_temperature"]);

    Object.entries(this.config.entities || {}).forEach(([key, entityId]) => {
      const isDynamicPower = dynamicPowerEntityKeys.has(key);
      add(entityId, this._entityLabelForPath?.(`entities.${key}`) || key, isDynamicPower || dynamicStateEntityKeys.has(key), {
        key,
        minActiveWatts: isDynamicPower ? 100 : undefined,
        staleWarningMinutes: key === "battery_temperature" ? 300 : undefined,
        staleCriticalMinutes: key === "battery_temperature" ? 600 : undefined,
      });
    });
    Object.entries(this.config.image_overlays || {}).forEach(([key, config]) => {
      add(config?.entity, this._overlayLabel(key), key === "heatpump");
    });
    (this.config.large_consumers || []).forEach((consumer, index) => {
      if (consumer?.visible === false) return;
      add(consumer.power_entity, this._largeConsumerLabel(consumer, index), true, {
        key: `large_consumers.${consumer.id || index}`,
        minActiveWatts: 100,
      });
    });
    this._pvRoofStringEntries().forEach((entry, index) => {
      if (entry.base || !entry.powerEntityId) return;
      add(entry.powerEntityId, entry.label || `String ${index + 1}`, true, {
        key: `pv_roof_strings.${entry.id || index}`,
        minActiveWatts: 100,
      });
    });
    if (typeof this._inverterEntries === "function") {
      this._inverterEntries().forEach((entry, index) => {
        if (entry.base) return;
        const label = entry.label || `Inverter ${index + 1}`;
        add(entry.powerEntityId, label, true, {
          key: `inverters.${entry.id || index}`,
          minActiveWatts: 100,
        });
        [
          [entry.voltageEntityId, "voltage", "Voltage"],
          [entry.voltageEntityIdL1, "voltage_l1", "L1"],
          [entry.voltageEntityIdL2, "voltage_l2", "L2"],
          [entry.voltageEntityIdL3, "voltage_l3", "L3"],
        ].forEach(([entityId, suffix, suffixLabel]) => {
          add(entityId, `${label} ${suffixLabel}`, true, {
            key: `inverters.${entry.id || index}.${suffix}`,
          });
        });
      });
    }

    const seen = new Set();
    return candidates
      .filter((candidate) => {
        if (!candidate.entityId || seen.has(candidate.entityId)) return false;
        seen.add(candidate.entityId);
        return true;
      });
  },

  _advisorStaleSensorIsActive(candidate) {
    if (!Number.isFinite(candidate?.minActiveWatts)) return true;
    const value = this._getEntityValue(candidate.entityId, undefined);
    const watts = this._valueAsWatts(value, this._getEntityUnit(candidate.entityId));
    return Number.isFinite(watts) && Math.abs(watts) >= candidate.minActiveWatts;
  },

  _advisorStaleSensorIsExpectedStatic(candidate) {
    if (candidate?.key !== "battery_level") return false;
    const batteryMetric = findMetricByKey("battery_level") || { key: "battery_level", unit: "battery" };
    const percent = this._batteryPercent(batteryMetric);
    if (!Number.isFinite(percent)) return false;
    const minSoc = this._batteryMinSocPercent();
    const maxSoc = this._batteryMaxSocPercent();
    return (
      Number.isFinite(maxSoc) && percent >= maxSoc - 0.5
    ) || (
      Number.isFinite(minSoc) && percent <= minSoc + 0.5
    );
  },

  _advisorStaleSensorItem() {
    const { staleSensorWarningMinutes: warningMinutes, staleSensorCriticalMinutes: criticalMinutes } = advisorThresholds(this.config);
    const stale = this._advisorSensorCandidates()
      .map((candidate) => {
        const entity = this._getEntity(candidate.entityId);
        if (!entity) return undefined;
        const state = String(entity.state || "").toLowerCase().trim();
        if (["unknown", "unavailable", "offline"].includes(state)) return undefined;
        if (!this._advisorStaleSensorIsActive(candidate)) return undefined;
        if (this._advisorStaleSensorIsExpectedStatic(candidate)) return undefined;
        const ageMinutes = this._entityAgeMinutes(candidate.entityId);
        const candidateWarningMinutes = this._clampNumber(candidate.staleWarningMinutes, warningMinutes, warningMinutes, 10080);
        const candidateCriticalMinutes = Math.max(criticalMinutes, this._clampNumber(candidate.staleCriticalMinutes, criticalMinutes, candidateWarningMinutes, 20160));
        if (!Number.isFinite(ageMinutes) || ageMinutes < candidateWarningMinutes) return undefined;
        return {
          ...candidate,
          label: this._entityDisplayName(candidate.entityId, candidate.label),
          ageMinutes,
          critical: ageMinutes >= candidateCriticalMinutes,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.ageMinutes - a.ageMinutes);
    if (stale.length === 0) return undefined;

    const critical = stale.some((item) => item.critical);
    const top = stale[0];
    const duration = this._formatDurationMinutes(top.ageMinutes);
    const details = stale.slice(0, 4)
      .map((item) => `${item.label}: ${this._formatDurationMinutes(item.ageMinutes)}`);
    return stale.length === 1
      ? {
        id: `sensor-stale:${top.entityId}`,
        type: critical ? "critical" : "info",
        priority: critical ? 98 : 90,
        title: this._t("advisor.sensors", {}, "Sensors"),
        text: this._t("advisor.sensorStaleOne", { name: top.label, duration }, `${top.label} has not updated for ${duration}.`),
        value: duration,
        reason: this._t("advisor.reasonSensor", {}, "A configured entity is stale, unavailable, or inconsistent."),
        diagnostic: true,
        diagnosticKind: "sensor",
      }
      : {
        id: `sensor-stale:${stale.map((item) => item.entityId).join("|")}`,
        type: critical ? "critical" : "info",
        priority: critical ? 98 : 90,
        title: this._t("advisor.sensors", {}, "Sensors"),
        text: this._t("advisor.sensorStaleMany", { count: stale.length }, `${stale.length} sensors have not updated recently.`),
        value: duration,
        reason: this._t("advisor.reasonSensor", {}, "A configured entity is stale, unavailable, or inconsistent."),
        details,
        diagnostic: true,
        diagnosticKind: "sensor",
      };
  },

  _advisorTypeRank(type) {
    return advisorTypeRank(type);
  },

  _sortAdvisorItems(items) {
    return sortAdvisorItems(items);
  },

  _advisorTypeLabel(type) {
    const labels = {
      critical: this._t("advisor.priorityCritical", {}, "Critical"),
      warning: this._t("advisor.priorityWarning", {}, "Warning"),
      info: this._t("advisor.priorityInfo", {}, "Info"),
      setup: this._t("advisor.prioritySetup", {}, "Setup"),
      opportunity: this._t("advisor.priorityOpportunity", {}, "Chance"),
      success: this._t("advisor.prioritySuccess", {}, "OK"),
    };
    return labels[type] || labels.info;
  },

  _advisorWindowLabel(windowKey) {
    const labels = {
      now: this._t("advisor.windowNow", {}, "Now"),
      next_2h: this._t("advisor.windowNext2h", {}, "Next 2h"),
      anytime: this._t("advisor.windowAnytime", {}, "Anytime"),
    };
    return labels[windowKey] || labels.now;
  },

  _advisorDismissStorageKey() {
    const dashboardKey = String(this.config.title || this.config.house || CARD_TYPE).replace(/[^\w-]+/g, "_").slice(0, 80);
    return `${CARD_TYPE}:advisor-dismissed:${dashboardKey}`;
  },

  _advisorTodayKey() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  },

  _advisorDismissKey(item) {
    if (item.id) return String(item.id);
    return [item.type, item.title, item.text]
      .map((part) => String(part ?? "").replace(/[^\w-]+/g, "_"))
      .join("__")
      .slice(0, 180);
  },

  _advisorDismissedMap() {
    try {
      const parsed = JSON.parse(window.localStorage?.getItem(this._advisorDismissStorageKey()) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (_err) {
      return {};
    }
  },

  _isAdvisorItemDismissed(item) {
    const dismissed = this._advisorDismissedMap();
    return dismissed[this._advisorDismissKey(item)] === this._advisorTodayKey();
  },

  _dismissAdvisorItem(key) {
    if (!key) return;
    try {
      const today = this._advisorTodayKey();
      const dismissed = this._advisorDismissedMap();
      Object.keys(dismissed).forEach((entryKey) => {
        if (dismissed[entryKey] !== today) delete dismissed[entryKey];
      });
      dismissed[key] = today;
      window.localStorage?.setItem(this._advisorDismissStorageKey(), JSON.stringify(dismissed));
    } catch (_err) {
      // localStorage can be blocked in strict browser contexts; the Advisor still works without dismissals.
    }
    this._renderCardShell(this._layoutState());
  },

  _formatAdvisorPrice(snapshot) {
    if (!Number.isFinite(snapshot.electricityPrice)) return "";
    const unit = snapshot.electricityPriceUnit || "";
    return `${snapshot.electricityPrice.toLocaleString(this._language(), { maximumFractionDigits: 4 })}${unit ? ` ${unit}` : ""}`;
  },

  _advisorSignalDetails(snapshot, topics = []) {
    const powerFormatter = (value) => this._formatPowerValue(value, this.config.units?.power || "auto", "W");
    const topicSet = new Set(topics);
    const includeAll = topicSet.size === 0;
    const details = [];
    const add = (topic, label, value) => {
      if (!includeAll && !topicSet.has(topic)) return;
      if (value === undefined || value === null || value === "") return;
      details.push(`${label}: ${value}`);
    };
    add("pv", this._t("advisor.pv", {}, "PV"), Number.isFinite(snapshot.pvWatts) ? powerFormatter(snapshot.pvWatts) : "");
    add("surplus", this._t("advisor.exporting", {}, "Exporting surplus"), Number.isFinite(snapshot.exportWatts) ? powerFormatter(snapshot.exportWatts) : "");
    add("grid", this._t("advisor.importing", {}, "Importing"), Number.isFinite(snapshot.importWatts) ? powerFormatter(snapshot.importWatts) : "");
    add("battery", this._t("advisor.batteryStatus", {}, "Battery"), Number.isFinite(snapshot.batteryPercent) ? `${Math.round(snapshot.batteryPercent)}%` : "");
    add("weather", this._t("advisor.weather", {}, "Weather"), snapshot.weatherState ? this._t(`weather.${snapshot.weatherState}`, {}, snapshot.weatherState) : "");
    add("price", this._t("advisor.electricityPrice", {}, "Electricity price"), this._formatAdvisorPrice(snapshot));
    if (topicSet.has("wallbox")) {
      (snapshot.wallboxes || []).forEach((wallbox) => {
        const wallboxValue = [
          Number.isFinite(wallbox.watts) ? powerFormatter(wallbox.watts) : "",
          Number.isFinite(wallbox.socPercent) ? `${Math.round(wallbox.socPercent)}%` : "",
          wallbox.connected === false ? this._t("advisor.evPlugIn", {}, "Plug in the vehicle to use PV surplus for charging.") : "",
          wallbox.chargingEnabled === false ? this._t("advisor.evEnableCharging", {}, "Charging is currently disabled. Enable charging if you want to use the PV surplus.") : "",
        ].filter(Boolean).join(" / ");
        if (wallboxValue) details.push(`${wallbox.label}: ${wallboxValue}`);
      });
    }
    return [...new Set(details)];
  },

  _advisorSuggestionLimit() {
    return advisorSuggestionLimit(this.config);
  },

  _advisorItems(snapshot = this._advisorSnapshot(), { maxItems = this._advisorSuggestionLimit() } = {}) {
    const items = [...this._advisorWarnings()];
    const add = (type, priority, title, text, value = "", extra = {}) => {
      items.push({ type, priority, title, text, value, window: "now", signals: [], ...extra });
    };
    const itemLimit = Math.round(this._clampNumber(maxItems, this._advisorSuggestionLimit(), 1, 12));
    const { surplusThreshold, importThreshold, highLoadThreshold, evSurplusThreshold } = advisorThresholds(this.config);
    const lowBatteryThreshold = Number.isFinite(snapshot.batteryReserveThreshold)
      ? snapshot.batteryReserveThreshold
      : this._clampNumber(this.config.battery_low_threshold, 20, 0, 100);
    const fullBatteryThreshold = Number.isFinite(snapshot.batteryFullThreshold) ? snapshot.batteryFullThreshold : 92;
    const deepBatteryThreshold = Math.min(10, lowBatteryThreshold);
    const voltageAlert = this._gridVoltageAlert();
    if (voltageAlert) {
      add(voltageAlert.type, voltageAlert.type === "critical" ? 99 : 94, this._t("advisor.grid", {}, "Grid"), voltageAlert.label, voltageAlert.value, {
        id: `voltage:${voltageAlert.entityId}`,
        diagnostic: true,
        diagnosticKind: "grid-voltage",
        reason: this._t("advisor.reasonSensor", {}, "A configured entity is stale, unavailable, or inconsistent."),
        signals: this._advisorSignalDetails(snapshot, ["grid", "pv", "battery", "price"]),
        details: [`${voltageAlert.label}: ${voltageAlert.value}`, `${voltageAlert.metric ? this._metricLabel(voltageAlert.metric, this._currentVariant) : voltageAlert.entityId}: ${voltageAlert.entityId}`],
      });
    }
    const staleSensorItem = this._advisorStaleSensorItem();
    if (staleSensorItem) items.push(staleSensorItem);

    if (!snapshot.hasPv) {
      add("setup", 62, this._t("advisor.pv", {}, "PV"), this._t("advisor.configurePvTotal", {}, "Add PV total power or roof/shed PV sensors to improve production analysis."));
    }
    if (!snapshot.hasGrid) {
      add("setup", 61, this._t("advisor.grid", {}, "Grid"), this._t("advisor.configureGrid", {}, "Add grid import/export sensors for better advice about surplus and grid draw."));
    }
    if (!snapshot.hasLoad) {
      add("setup", 38, this._t("advisor.consumption", {}, "Load"), this._t("advisor.configureConsumption", {}, "Add a house consumption sensor to improve autarky and load analysis."));
    }

    if (items.some((item) => item.type === "warning" && item.diagnosticKind === "sensor")) {
      add("warning", 95, this._t("advisor.status", {}, "Status"), this._t("advisor.checkSensors", {}, "Check unavailable or missing sensors so the energy balance stays reliable."), "", {
        id: "advisor:sensor-check",
        diagnostic: true,
        diagnosticKind: "sensor",
        reason: this._t("advisor.reasonSensor", {}, "A configured entity is stale, unavailable, or inconsistent."),
        signals: this._advisorSignalDetails(snapshot, ["pv", "grid", "battery"]),
      });
    }

    if (
      Number.isFinite(snapshot.gridSplitPower?.importWatts)
      && Number.isFinite(snapshot.gridSplitPower?.exportWatts)
      && snapshot.gridSplitPower.importWatts > importThreshold
      && snapshot.gridSplitPower.exportWatts > surplusThreshold
    ) {
      const value = `${this._formatPowerValue(snapshot.gridSplitPower.importWatts, this.config.units?.power || "auto", "W")} / ${this._formatPowerValue(snapshot.gridSplitPower.exportWatts, this.config.units?.power || "auto", "W")}`;
      add("critical", 96, this._t("advisor.grid", {}, "Grid"), this._t("advisor.gridImportExportSimultaneous", {}, "Import and export sensors report power at the same time. Check whether the split grid sensors are mapped correctly."), value, {
        id: "grid:import-export-simultaneous",
        reason: this._t("advisor.reasonSensor", {}, "A configured entity is stale, unavailable, or inconsistent."),
        signals: this._advisorSignalDetails(snapshot, ["grid", "pv"]),
      });
    }

    if (Number.isFinite(snapshot.batteryTemperatureCelsius)) {
      const tempValue = `${snapshot.batteryTemperatureCelsius.toFixed(Math.abs(snapshot.batteryTemperatureCelsius) >= 100 || Number.isInteger(snapshot.batteryTemperatureCelsius) ? 0 : 1)} °C`;
      if (snapshot.batteryTemperatureCelsius <= 0 || snapshot.batteryTemperatureCelsius >= 55) {
        add("critical", 94, this._t("advisor.batteryStatus", {}, "Battery"), snapshot.batteryTemperatureCelsius <= 0
          ? this._t("advisor.batteryTemperatureLow", {}, "House battery temperature is low. Charging power may be limited and battery stress can increase.")
          : this._t("advisor.batteryTemperatureHigh", {}, "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits."), tempValue);
      } else if (snapshot.batteryTemperatureCelsius <= 5 || snapshot.batteryTemperatureCelsius >= 45) {
        add("info", 83, this._t("advisor.batteryStatus", {}, "Battery"), snapshot.batteryTemperatureCelsius <= 5
          ? this._t("advisor.batteryTemperatureLow", {}, "House battery temperature is low. Charging power may be limited and battery stress can increase.")
          : this._t("advisor.batteryTemperatureHigh", {}, "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits."), tempValue);
      }
    }

    if (Number.isFinite(snapshot.batteryCyclesToday) && snapshot.batteryCyclesToday >= 2) {
      add(snapshot.batteryCyclesToday >= 3 ? "critical" : "info", snapshot.batteryCyclesToday >= 3 ? 92 : 81, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryCyclesHigh", {}, "House battery has completed several full cycles today. Frequent cycling can age the battery faster."), snapshot.batteryCyclesToday.toFixed(snapshot.batteryCyclesToday % 1 === 0 ? 0 : 1));
    }

    if (Number.isFinite(snapshot.batteryPercent) && snapshot.batteryPercent <= deepBatteryThreshold) {
      add("critical", 93, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryDeepSoc", {}, "House battery SoC is very low. Protect the reserve and avoid additional flexible loads."), `${Math.round(snapshot.batteryPercent)}%`);
    }

    (snapshot.wallboxes || []).forEach((wallbox) => {
      if (!Number.isFinite(wallbox.socPercent)) return;
      const value90 = `${Math.round(wallbox.socPercent)}% - ${this._formatDurationMinutes(wallbox.socAbove90Minutes)}`;
      const value80 = `${Math.round(wallbox.socPercent)}% - ${this._formatDurationMinutes(wallbox.socAbove80Minutes)}`;
      if (Number.isFinite(wallbox.socAbove90Minutes) && wallbox.socAbove90Minutes >= 60) {
        add("critical", 97, wallbox.label, this._t("advisor.evSocAbove90Long", {}, "Vehicle SoC is above 90% for more than 60 minutes. Stop charging or lower the target SoC if the car will stay parked."), value90);
      } else if (Number.isFinite(wallbox.socAbove80Minutes) && wallbox.socAbove80Minutes >= 120) {
        add("info", 89, wallbox.label, this._t("advisor.evSocAbove80Long", {}, "Vehicle SoC is above 80% for more than 120 minutes. This can stress the battery if it stays there too long."), value80);
      }
    });

    (snapshot.wallboxes || []).forEach((wallbox) => {
      const phaseAction = wallbox.phaseAction;
      if (!phaseAction?.action) return;
      const value = phaseAction.duration ? `${phaseAction.action} / ${phaseAction.duration}` : phaseAction.action;
      const duration = phaseAction.duration || this._t("value.soon", {}, "soon");
      const nextWindowSeconds = 2 * 60 * 60;
      add("info", 83, wallbox.label, this._t("advisor.evPhaseChangeScheduled", { action: phaseAction.action, duration }, `${phaseAction.action} in ${duration} if the PV situation does not change.`), value, {
        id: `wallbox:phase:${wallbox.key}:${phaseAction.action}`,
        window: Number.isFinite(phaseAction.seconds) && phaseAction.seconds <= nextWindowSeconds ? "next_2h" : "now",
        reason: this._t("advisor.reasonPhaseChange", {}, "EVCC reports a planned phase change inside the next window."),
        signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "grid", "wallbox", "weather"]),
        details: [
          phaseAction.actionEntityId ? `${this._t("editor.phaseActionEntity", {}, "Upcoming phase action entity")}: ${phaseAction.actionEntityId}` : "",
          phaseAction.remainingEntityId ? `${this._t("editor.phaseRemainingEntity", {}, "Phase action remaining seconds entity")}: ${phaseAction.remainingEntityId}` : "",
        ].filter(Boolean),
      });
    });

    if (Number.isFinite(snapshot.batteryHighSocMinutes) && snapshot.batteryHighSocMinutes >= 120) {
      const value = `${Math.round(snapshot.batteryPercent)}% - ${this._formatDurationMinutes(snapshot.batteryHighSocMinutes)}`;
      add("info", 87, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryHighSocLong", {}, "House battery has been between 90 and 100% for more than 120 minutes. Batteries should not stay that full for too long."), value);
    }

    if (Number.isFinite(snapshot.exportWatts) && snapshot.exportWatts > surplusThreshold) {
      const value = this._formatPowerValue(snapshot.exportWatts, this.config.units?.power || "auto", "W");
      const idleWallboxes = (snapshot.wallboxes || []).filter((wallbox) => wallbox.watts <= surplusThreshold);
      const wallboxTitle = (wallboxes) => wallboxes.length === 1 ? wallboxes[0].label : this._t("advisor.wallbox", {}, "EV");
      add("opportunity", 88, this._t("advisor.surplus", {}, "Surplus"), this._t("advisor.surplusGeneral", {}, "PV surplus is available. Prioritize flexible loads while export is active."), value, {
        id: "surplus:general",
        reason: this._t("advisor.reasonSurplus", { threshold: this._formatPowerValue(surplusThreshold, this.config.units?.power || "auto", "W") }, "PV surplus is above the configured surplus threshold."),
        signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "battery", "weather", "price"]),
      });
      const largeConsumerCandidates = (snapshot.largeConsumers || [])
        .filter((consumer) => !consumer.active && consumer.powerEntityId)
        .filter((consumer) => Number.isFinite(consumer.maxPowerWatts)
          ? consumer.maxPowerWatts <= snapshot.exportWatts + surplusThreshold
          : snapshot.exportWatts >= highLoadThreshold);
      if (largeConsumerCandidates.length > 0) {
        const names = largeConsumerCandidates.slice(0, 3).map((consumer) => consumer.label).join(", ");
        add("opportunity", 78, this._t("consumer.sectionTitle", {}, "Additional Large Consumers"), this._t("advisor.largeConsumerSurplus", { names }, `PV surplus can cover ${names}. Start a ready large consumer while export is active.`), value, {
          id: `large-consumer:surplus:${names}`,
          reason: this._t("advisor.reasonLargeConsumer", {}, "The available PV surplus can cover the configured consumer limit."),
          signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "battery", "weather", "price"]),
          details: largeConsumerCandidates.slice(0, 4).map((consumer) => [
            consumer.label,
            Number.isFinite(consumer.maxPowerWatts) ? this._formatPowerValue(consumer.maxPowerWatts, this.config.units?.power || "auto", "W") : "",
          ].filter(Boolean).join(": ")),
        });
      }
      const chargeableWallboxes = idleWallboxes.filter((wallbox) => !wallbox.targetReached && wallbox.connected !== false && wallbox.chargingEnabled !== false && snapshot.exportWatts >= evSurplusThreshold);
      if (chargeableWallboxes.length > 0) {
        add("opportunity", 82, wallboxTitle(chargeableWallboxes), this._t("advisor.startEvCharging", {}, "Start or increase EV charging while surplus is available."), value, {
          id: `wallbox:start:${chargeableWallboxes.map((wallbox) => wallbox.key).join("-")}`,
          reason: this._t("advisor.reasonEvSurplus", { threshold: this._formatPowerValue(evSurplusThreshold, this.config.units?.power || "auto", "W") }, "PV surplus is above the configured EV threshold."),
          signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "battery", "wallbox", "weather", "price"]),
        });
      }
      const disconnectedWallboxes = idleWallboxes.filter((wallbox) => !wallbox.targetReached && wallbox.connected === false && snapshot.exportWatts >= evSurplusThreshold);
      if (disconnectedWallboxes.length > 0) {
        add("opportunity", 79, wallboxTitle(disconnectedWallboxes), this._t("advisor.evPlugIn", {}, "Plug in the vehicle to use PV surplus for charging."), value, {
          id: `wallbox:plugin:${disconnectedWallboxes.map((wallbox) => wallbox.key).join("-")}`,
          reason: this._t("advisor.reasonEvSurplus", { threshold: this._formatPowerValue(evSurplusThreshold, this.config.units?.power || "auto", "W") }, "PV surplus is above the configured EV threshold."),
          signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "battery", "wallbox", "weather", "price"]),
        });
      }
      const disabledWallboxes = idleWallboxes.filter((wallbox) => !wallbox.targetReached && wallbox.connected !== false && wallbox.chargingEnabled === false && snapshot.exportWatts >= evSurplusThreshold);
      if (disabledWallboxes.length > 0) {
        add("info", 76, wallboxTitle(disabledWallboxes), this._t("advisor.evEnableCharging", {}, "Charging is currently disabled. Enable charging if you want to use the PV surplus."), value, {
          id: `wallbox:enable:${disabledWallboxes.map((wallbox) => wallbox.key).join("-")}`,
          reason: this._t("advisor.reasonEvSurplus", { threshold: this._formatPowerValue(evSurplusThreshold, this.config.units?.power || "auto", "W") }, "PV surplus is above the configured EV threshold."),
          signals: this._advisorSignalDetails(snapshot, ["pv", "surplus", "battery", "wallbox", "weather", "price"]),
        });
      }
      const targetReachedWallboxes = idleWallboxes.filter((wallbox) => wallbox.targetReached);
      if (targetReachedWallboxes.length > 0) {
        const targetValue = targetReachedWallboxes.length === 1 && Number.isFinite(targetReachedWallboxes[0].maxSocPercent)
          ? `${Math.round(targetReachedWallboxes[0].socPercent)} / ${Math.round(targetReachedWallboxes[0].maxSocPercent)}%`
          : value;
        add("info", 72, wallboxTitle(targetReachedWallboxes), this._t("advisor.evTargetReached", {}, "Vehicle is already at the configured target SoC. Use surplus for another flexible load."), targetValue);
      }
      if (this.config.image_overlays?.heatpump?.enabled === true || this.config.image_overlays?.heatpump?.entity) {
        add("opportunity", 74, this._overlayLabel("heatpump"), this._t("advisor.useHeatPump", {}, "Use heat pump boost or preheat hot water while PV surplus is available."), value);
      }
      if (Number.isFinite(snapshot.batteryPercent) && snapshot.batteryPercent >= fullBatteryThreshold - 0.5) {
        const value = Number.isFinite(snapshot.batteryMaxSocPercent)
          ? `${Math.round(snapshot.batteryPercent)} / ${Math.round(snapshot.batteryMaxSocPercent)}%`
          : `${Math.round(snapshot.batteryPercent)}%`;
        add("info", 70, this._t("advisor.batteryStatus", {}, "Battery"), Number.isFinite(snapshot.batteryMaxSocPercent)
          ? this._t("advisor.batteryMaxReached", {}, "Battery is at the configured max SoC. Additional PV is likely to be exported.")
          : this._t("advisor.batteryNearlyFull", {}, "Battery is nearly full, so additional PV is likely to be exported."), value);
      } else if (snapshot.batteryFlow?.direction !== "charge" && (this.config.entities?.battery_flow_power || this.config.entities?.battery_charge_power)) {
        add("info", 64, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryIdle", {}, "Battery is not charging while surplus is exported. Check battery limits or charge mode."));
      }
      add("opportunity", 60, this._t("advisor.appliances", {}, "Appliances"), this._t("advisor.runAppliance", {}, "Run a flexible household appliance now if it is waiting."), value);
    }

    if (Number.isFinite(snapshot.importWatts) && snapshot.importWatts > importThreshold) {
      const value = this._formatPowerValue(snapshot.importWatts, this.config.units?.power || "auto", "W");
      add("warning", 86, this._t("advisor.grid", {}, "Grid"), this._t("advisor.headlineImport", {}, "Grid import is active"), value, {
        id: "grid:import-active",
        reason: this._t("advisor.reasonGridImport", { threshold: this._formatPowerValue(importThreshold, this.config.units?.power || "auto", "W") }, "Grid import is above the configured import threshold."),
        signals: this._advisorSignalDetails(snapshot, ["grid", "pv", "battery", "price"]),
      });
      if (Number.isFinite(snapshot.batteryPercent) && snapshot.batteryPercent >= fullBatteryThreshold - 0.5) {
        const batteryValue = `${value} / ${Math.round(snapshot.batteryPercent)}%`;
        add(snapshot.importWatts > highLoadThreshold ? "critical" : "warning", snapshot.importWatts > highLoadThreshold ? 91 : 85, this._t("advisor.grid", {}, "Grid"), this._t("advisor.gridImportFullBattery", {}, "Grid import is high although the house battery is full. Check discharge limits, backup reserve, or battery mode."), batteryValue);
      }
      const activeWallboxes = (snapshot.wallboxes || []).filter((wallbox) => wallbox.watts > importThreshold);
      const targetReachedCharging = activeWallboxes.filter((wallbox) => wallbox.targetReached);
      const gridChargingWallboxes = activeWallboxes.filter((wallbox) => !wallbox.targetReached);
      if (targetReachedCharging.length > 0) {
        const targetValue = targetReachedCharging.length === 1 && Number.isFinite(targetReachedCharging[0].maxSocPercent)
          ? `${Math.round(targetReachedCharging[0].socPercent)} / ${Math.round(targetReachedCharging[0].maxSocPercent)}%`
          : this._formatPowerValue(targetReachedCharging.reduce((sum, wallbox) => sum + wallbox.watts, 0), this.config.units?.power || "auto", "W");
        add("warning", 84, targetReachedCharging.length === 1 ? targetReachedCharging[0].label : this._t("advisor.wallbox", {}, "EV"), this._t("advisor.evTargetReachedGrid", {}, "Vehicle is at target SoC while the charger is still drawing power. Check the charge limit or stop charging."), targetValue);
      }
      if (gridChargingWallboxes.length > 0) {
        add("warning", 80, gridChargingWallboxes.length === 1 ? gridChargingWallboxes[0].label : this._t("advisor.wallbox", {}, "EV"), this._t("advisor.evChargingGrid", {}, "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended."), this._formatPowerValue(gridChargingWallboxes.reduce((sum, wallbox) => sum + wallbox.watts, 0), this.config.units?.power || "auto", "W"));
      }
      const activeLargeConsumers = (snapshot.largeConsumers || []).filter((consumer) => consumer.active);
      if (activeLargeConsumers.length > 0) {
        const largeConsumerWatts = activeLargeConsumers.reduce((sum, consumer) => sum + consumer.watts, 0);
        const names = activeLargeConsumers.slice(0, 3).map((consumer) => consumer.label).join(", ");
        add(snapshot.importWatts > highLoadThreshold || largeConsumerWatts > highLoadThreshold ? "critical" : "warning", snapshot.importWatts > highLoadThreshold ? 89 : 82, this._t("consumer.sectionTitle", {}, "Additional Large Consumers"), this._t("advisor.largeConsumerGrid", { names }, `${names} currently draw power while grid import is active.`), this._formatPowerValue(largeConsumerWatts, this.config.units?.power || "auto", "W"), {
          details: activeLargeConsumers.slice(0, 4).map((consumer) => `${consumer.label}: ${this._formatPowerValue(consumer.watts, this.config.units?.power || "auto", "W")}`),
        });
      }
      if (Number.isFinite(snapshot.loadWatts) && snapshot.loadWatts > highLoadThreshold) {
        add("info", 58, this._t("advisor.consumption", {}, "Load"), this._t("advisor.highLoad", {}, "Current load is high compared with PV production. Check large consumers if this is unexpected."), this._formatPowerValue(snapshot.loadWatts, this.config.units?.power || "auto", "W"));
      }
    }

    if (Number.isFinite(snapshot.batteryPercent) && snapshot.batteryPercent <= lowBatteryThreshold && snapshot.batteryPercent > deepBatteryThreshold) {
      const reserveValue = Number.isFinite(snapshot.batteryMinSocPercent)
        ? `${Math.round(snapshot.batteryPercent)} / ${Math.round(snapshot.batteryMinSocPercent)}%`
        : `${Math.round(snapshot.batteryPercent)}%`;
      if (snapshot.batteryFlow?.direction === "discharge") {
        add("warning", 84, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryReserveDischarging", {}, "Battery is at or below reserve SoC and still discharging. Check min SoC or backup reserve settings."), reserveValue);
      }
      add("warning", 78, this._t("advisor.batteryStatus", {}, "Battery"), this._t("advisor.batteryLow", {}, "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible."), reserveValue);
    }

    if (
      this._isDaylight()
      && Number.isFinite(snapshot.pvWatts)
      && snapshot.pvWatts <= Math.max(100, surplusThreshold * 0.5)
      && !["rainy", "pouring", "snowy", "snowy-rainy", "fog"].includes(this._weatherState())
    ) {
      add("info", 46, this._t("advisor.pv", {}, "PV"), this._t("advisor.lowPv", {}, "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors."), this._formatPowerValue(snapshot.pvWatts, this.config.units?.power || "auto", "W"));
    }

    const pvCoveredWallboxWatts = (snapshot.wallboxes || [])
      .filter((wallbox) => wallbox.watts > importThreshold && !wallbox.targetReached)
      .reduce((sum, wallbox) => sum + wallbox.watts, 0);
    if (
      pvCoveredWallboxWatts > importThreshold
      && (!Number.isFinite(snapshot.importWatts) || snapshot.importWatts <= importThreshold)
    ) {
      add("success", 42, this._t("advisor.wallbox", {}, "EV"), this._t("advisor.evChargingPv", {}, "EV charging is currently covered well by PV or stored energy."), this._formatPowerValue(pvCoveredWallboxWatts, this.config.units?.power || "auto", "W"));
    }

    const pvCoveredLargeConsumerWatts = (snapshot.largeConsumers || [])
      .filter((consumer) => consumer.active)
      .reduce((sum, consumer) => sum + consumer.watts, 0);
    if (
      pvCoveredLargeConsumerWatts > importThreshold
      && (!Number.isFinite(snapshot.importWatts) || snapshot.importWatts <= importThreshold)
    ) {
      add("success", 41, this._t("consumer.sectionTitle", {}, "Additional Large Consumers"), this._t("advisor.largeConsumerCovered", {}, "Large consumers are running without relevant grid import."), this._formatPowerValue(pvCoveredLargeConsumerWatts, this.config.units?.power || "auto", "W"));
    }

    let visibleItems = items.filter((item) => !this._isAdvisorItemDismissed(item));
    if (visibleItems.length === 0) {
      add("success", 10, this._t("advisor.status", {}, "Status"), this._t("advisor.noAdvice", {}, "No urgent action right now."));
      visibleItems = items.filter((item) => !this._isAdvisorItemDismissed(item));
    }

    return this._sortAdvisorItems(visibleItems).slice(0, itemLimit);
  },

  _advisorStatus(snapshot = this._advisorSnapshot(), items = this._advisorItems(snapshot)) {
    const hasDiagnosticWarning = items.some((item) => item.diagnostic === true && ["critical", "warning"].includes(item.type));
    const hasCritical = items.some((item) => item.type === "critical");
    const hasInfo = items.some((item) => item.type === "info");
    const hasSetup = items.some((item) => item.type === "setup");
    const { surplusThreshold, importThreshold } = advisorThresholds(this.config);
    if (hasCritical) return { type: "critical", label: this._t("advisor.headlineWarning", {}, "Energy setup needs attention") };
    if (hasDiagnosticWarning) return { type: "warning", label: this._t("advisor.headlineWarning", {}, "Energy setup needs attention") };
    if (Number.isFinite(snapshot.exportWatts) && snapshot.exportWatts > surplusThreshold) {
      return { type: "opportunity", label: this._t("advisor.headlineExport", {}, "PV surplus is available") };
    }
    if (Number.isFinite(snapshot.importWatts) && snapshot.importWatts > importThreshold) {
      return { type: "warning", label: this._t("advisor.headlineImport", {}, "Grid import is active") };
    }
    if (hasSetup) return { type: "setup", label: this._t("advisor.headlineSetup", {}, "More sensors unlock better advice") };
    if (hasInfo) return { type: "info", label: this._t("advisor.headlineInfo", {}, "Information available") };
    return { type: "success", label: this._t("advisor.headlineNeutral", {}, "Energy flow is balanced") };
  },

  _advisorMetricValue(value, formatter) {
    return Number.isFinite(value) ? formatter(value) : this._t("advisor.unknown", {}, "Unknown");
  },

  _advisorEntityReference(label, entityId) {
    if (!entityId) return undefined;
    return `${label}: ${entityId}`;
  },

  _advisorConfiguredEntities(keys) {
    return keys
      .map(([label, entityId]) => this._advisorEntityReference(label, entityId))
      .filter(Boolean);
  },

  _advisorParseDetailEntry(entry) {
    const text = String(entry ?? "").trim();
    const separator = text.indexOf(":");
    if (separator < 0) return { label: text, value: "" };
    return {
      label: text.slice(0, separator).trim(),
      value: text.slice(separator + 1).trim(),
    };
  },

  _advisorNormalizeLabel(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  _advisorDetailCategory(label, entityId = "") {
    const text = this._advisorNormalizeLabel(`${label} ${entityId}`);
    if (/(einspeis|export|surplus|feed)/.test(text)) return "surplus";
    if (/(netzbezug|bezug|import|grid import)/.test(text)) return "import";
    if (/(netz|grid)/.test(text)) return "grid";
    if (/(pv|solar|photovoltaik)/.test(text)) return "pv";
    if (/(batter|akku|speicher|soc)/.test(text)) return "battery";
    if (/(temperatur|temperature|temp)/.test(text)) return "temperature";
    if (/(eigenverbrauch|self use|self consumption)/.test(text)) return "selfConsumption";
    if (/(autark|autarky)/.test(text)) return "autarky";
    if (/(wallbox|charger|ladepunkt|auto|vehicle|ev)/.test(text)) return "wallbox";
    if (/(last|load|hausverbrauch|verbrauch)/.test(text)) return "load";
    if (/(sensor|unavailable|stale|offline)/.test(text)) return "sensor";
    if (/(strompreis|electricity price|price|tarif|tariff)/.test(text)) return "price";
    return "consumer";
  },

  _advisorImpactForLabel(label, item = {}) {
    const category = this._advisorDetailCategory(label);
    const text = this._advisorNormalizeLabel(`${item.title || ""} ${item.text || ""}`);
    if (category === "pv") return this._t("advisor.impactPv", {}, "That value describes the current PV production and helps estimate how much energy is available.");
    if (category === "surplus") return this._t("advisor.impactSurplus", {}, "That value shows how much power is currently available for flexible loads before it is exported.");
    if (category === "import" || category === "grid") return this._t("advisor.impactGrid", {}, "That value decides whether the situation is treated as grid import, neutral, or PV surplus.");
    if (category === "battery") return this._t("advisor.impactBattery", {}, "That value describes the current battery reserve and influences whether flexible loads are sensible right now.");
    if (category === "temperature") return this._t("advisor.impactTemperature", {}, "That value is used to detect possible battery stress or operating limits.");
    if (category === "wallbox") return this._t("advisor.impactWallbox", {}, "That value describes the charger state and determines whether charging should start, stop, or wait.");
    if (category === "load") return this._t("advisor.impactLoad", {}, "That value describes the current household load and helps classify whether consumption is unusually high.");
    if (category === "selfConsumption") return this._t("advisor.impactSelfConsumption", {}, "That shows how much PV energy is being used locally instead of being exported.");
    if (category === "autarky") return this._t("advisor.impactAutarky", {}, "That shows how independently the house is currently being supplied.");
    if (category === "sensor") return this._t("advisor.impactSensor", {}, "That value is used as a diagnostic signal for sensor freshness and plausibility.");
    if (text.includes("verbraucher") || text.includes("consumer") || category === "consumer") return this._t("advisor.impactConsumer", {}, "That value shows whether this consumer is active and how strongly it affects the energy balance.");
    return this._t("advisor.impactSensor", {}, "That value is used as a diagnostic signal for sensor freshness and plausibility.");
  },

  _advisorEntityForLabel(label, entities = []) {
    const normalizedLabel = this._advisorNormalizeLabel(label);
    const category = this._advisorDetailCategory(label);
    const parsed = entities
      .map((entry) => this._advisorParseDetailEntry(entry))
      .filter((entry) => entry.label && entry.value);
    const scoreEntity = (entry) => {
      const normalizedEntityLabel = this._advisorNormalizeLabel(entry.label);
      const normalizedEntityId = this._advisorNormalizeLabel(entry.value);
      if (!normalizedEntityLabel && !normalizedEntityId) return 0;
      if (normalizedEntityLabel === normalizedLabel) return 100;
      if (normalizedEntityLabel.includes(normalizedLabel) || normalizedLabel.includes(normalizedEntityLabel)) return 86;
      const entityCategory = this._advisorDetailCategory(entry.label, entry.value);
      if (category === "surplus" && /(export|einspeis|feed)/.test(`${normalizedEntityLabel} ${normalizedEntityId}`)) return 78;
      if (category === "import" && /(import|bezug)/.test(`${normalizedEntityLabel} ${normalizedEntityId}`)) return 78;
      if (category !== "consumer" && category === entityCategory) return 66;
      return 0;
    };
    return parsed
      .map((entry) => ({ entry, score: scoreEntity(entry) }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.entry?.value || "";
  },

  _advisorExplanationEntries(values = [], signals = []) {
    const ignoredValues = new Set(["", "—", "unknown", "unbekannt"]);
    const entries = [...values, ...signals]
      .map((entry) => this._advisorParseDetailEntry(entry))
      .filter((entry) => entry.label && entry.value && !ignoredValues.has(this._advisorNormalizeLabel(entry.value)));
    const seen = new Set();
    return entries.filter((entry) => {
      const key = `${this._advisorNormalizeLabel(entry.label)}:${this._advisorNormalizeLabel(entry.value)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  _advisorExplanationParagraphs(item, values = [], signals = [], entities = []) {
    const priority = this._advisorTypeLabel(item.type);
    const window = this._advisorWindowLabel(item.window);
    const reason = item.reason || item.text;
    const paragraphs = [
      this._t("advisor.detailIntro", { priority, window, reason }, `The Advisor shows this as ${priority} for ${window}, because ${reason}`),
    ];
    this._advisorExplanationEntries(values, signals).slice(0, 10).forEach((entry) => {
      const entityId = this._advisorEntityForLabel(entry.label, entities);
      const impact = this._advisorImpactForLabel(entry.label, item);
      paragraphs.push(entityId
        ? this._t("advisor.detailEntityValue", { entity: entityId, label: entry.label, value: entry.value, impact }, `${entityId} currently reports ${entry.value} for ${entry.label}. ${impact}`)
        : this._t("advisor.detailValueOnly", { label: entry.label, value: entry.value, impact }, `${entry.label} is currently ${entry.value}. ${impact}`));
    });
    return [...new Set(paragraphs)];
  },

  _advisorItemKey(item, index) {
    return [item.type, item.priority, item.title, item.text, item.value, index]
      .map((part) => String(part ?? "").replace(/[^\w-]+/g, "_"))
      .join("__")
      .slice(0, 180);
  },

  _advisorItemDetails(item, snapshot) {
    const powerFormatter = (value) => this._formatPowerValue(value, this.config.units?.power || "auto", "W");
    const percentFormatter = (value) => Number.isFinite(value) ? `${Math.round(value)}%` : "";
    const values = [];
    const entities = [];
    const addValue = (label, value) => {
      if (value === undefined || value === null || value === "") return;
      values.push(`${label}: ${value}`);
    };
    const addEntity = (label, entityId) => {
      const entry = this._advisorEntityReference(label, entityId);
      if (entry) entities.push(entry);
    };

    const title = String(item.title || "").toLowerCase();
    const text = String(item.text || "").toLowerCase();
    const isGrid = title.includes("netz") || title.includes("grid") || text.includes("netz") || text.includes("grid") || text.includes("import") || text.includes("export");
    const isBattery = title.includes("batter") || text.includes("batter");
    const isWallbox = title.includes("wallbox") || title.includes("ev") || text.includes("auto") || text.includes("wallbox") || text.includes("vehicle");
    const isLoad = title.includes("last") || title.includes("haushalt") || title.includes("load") || title.includes("appliance") || text.includes("verbraucher");
    const isLargeConsumer = title.includes("großverbraucher") || title.includes("große verbraucher") || title.includes("large consumer") || text.includes("großverbraucher") || text.includes("große verbraucher") || text.includes("large consumer");
    const isPv = title.includes("pv") || title.includes("überschuss") || title.includes("surplus") || text.includes("pv") || text.includes("überschuss") || text.includes("surplus");
    const isSensors = title.includes("sensor") || text.includes("sensor");

    addValue(this._t("advisor.pv", {}, "PV"), this._advisorMetricValue(snapshot.pvWatts, powerFormatter));
    if (isPv && Array.isArray(snapshot.pvRoofStrings) && snapshot.pvRoofStrings.length > 0) {
      snapshot.pvRoofStrings.forEach((string) => {
        addValue(string.label, [
          Number.isFinite(string.watts) ? powerFormatter(string.watts) : "",
          Number.isFinite(string.maxPowerWatts) ? `${this._t("tooltip.max", {}, "Maximum")} ${powerFormatter(string.maxPowerWatts)}` : "",
        ].filter(Boolean).join(" / "));
      });
    }
    if (isPv || isGrid || isLoad) {
      addValue(this._t("advisor.exporting", {}, "Exporting surplus"), this._advisorMetricValue(snapshot.exportWatts, powerFormatter));
      addValue(this._t("advisor.importing", {}, "Importing"), this._advisorMetricValue(snapshot.importWatts, powerFormatter));
    }
    if (isBattery || isPv || isGrid) {
      addValue(this._t("advisor.batteryStatus", {}, "Battery"), Number.isFinite(snapshot.batteryPercent)
        ? [
          percentFormatter(snapshot.batteryPercent),
          Number.isFinite(snapshot.batteryMinSocPercent) || Number.isFinite(snapshot.batteryMaxSocPercent)
            ? `(${Number.isFinite(snapshot.batteryMinSocPercent) ? Math.round(snapshot.batteryMinSocPercent) : "—"}-${Number.isFinite(snapshot.batteryMaxSocPercent) ? Math.round(snapshot.batteryMaxSocPercent) : "—"}%)`
            : "",
        ].filter(Boolean).join(" ")
        : "");
      if (snapshot.batteryFlow?.direction) addValue("Batteriefluss", `${this._batteryFlowDirectionLabel(snapshot.batteryFlow.direction)} ${this._formatBatteryFlowValue(snapshot.batteryFlow)}`);
      if (Number.isFinite(snapshot.batteryTemperatureCelsius)) addValue(this._t("tooltip.temperature", {}, "Temperature"), `${snapshot.batteryTemperatureCelsius.toFixed(Number.isInteger(snapshot.batteryTemperatureCelsius) ? 0 : 1)} °C`);
      if (Number.isFinite(snapshot.batteryCyclesToday)) addValue(this._t("editor.batteryCyclesTodayEntity", {}, "Battery cycles today entity"), snapshot.batteryCyclesToday.toFixed(snapshot.batteryCyclesToday % 1 === 0 ? 0 : 1));
    }
    if (isWallbox) {
      (snapshot.wallboxes || []).forEach((wallbox) => {
        addValue(wallbox.label, [
          Number.isFinite(wallbox.watts) ? powerFormatter(wallbox.watts) : "",
          Number.isFinite(wallbox.socPercent) ? `${Math.round(wallbox.socPercent)}%` : "",
          Number.isFinite(wallbox.maxSocPercent) ? `/ ${Math.round(wallbox.maxSocPercent)}%` : "",
          wallbox.connected === false ? "nicht verbunden" : "",
          wallbox.chargingEnabled === false ? "Laden deaktiviert" : "",
          wallbox.phaseAction?.label || "",
        ].filter(Boolean).join(" "));
      });
    }
    if (isLoad || isPv) addValue(this._t("advisor.consumption", {}, "Load"), this._advisorMetricValue(snapshot.loadWatts, powerFormatter));
    if (isLoad || isLargeConsumer || isPv) {
      (snapshot.largeConsumers || []).forEach((consumer) => {
        addValue(consumer.label, [
          powerFormatter(consumer.watts),
          Number.isFinite(consumer.maxPowerWatts) ? `${this._t("tooltip.max", {}, "Maximum")} ${powerFormatter(consumer.maxPowerWatts)}` : "",
        ].filter(Boolean).join(" / "));
      });
    }
    addValue(this._t("advisor.selfConsumption", {}, "Self-use"), this._advisorMetricValue(snapshot.selfConsumptionPercent, (value) => `${Math.round(value)}%`));
    addValue(this._t("advisor.autarky", {}, "Autarky"), this._advisorMetricValue(snapshot.autarkyPercent, (value) => `${Math.round(value)}%`));

    if (isPv) {
      addEntity(this._t("advisor.pv", {}, "PV"), this.config.entities?.pv_total_power || this.config.entities?.pv_roof_power || this.config.entities?.pv_shed_power);
      (snapshot.pvRoofStrings || []).forEach((string) => {
        addEntity(`${string.label} ${this._t("editor.pvRoofStringPowerEntity", {}, "String power entity")}`, string.powerEntityId);
        addEntity(`${string.label} ${this._t("editor.pvRoofStringEnergyEntity", {}, "String kWh counter entity")}`, string.energyEntityId);
      });
    }
    if (isGrid || isPv) {
      addEntity(this._t("advisor.grid", {}, "Grid"), this._gridPrimaryEntityId());
      addEntity(this._t("editor.importPowerEntity", {}, "Import entity"), this._gridImportEntityId());
      addEntity(this._t("editor.exportPowerEntity", {}, "Export entity"), this._gridExportEntityId());
    }
    if (isBattery || isPv || isGrid) {
      addEntity(this._t("advisor.batteryStatus", {}, "Battery"), this._batterySocEntityId());
      addEntity(this._t("editor.batteryMinSocEntity", {}, "Battery min SoC entity"), this._batteryMinSocEntityId());
      addEntity(this._t("editor.batteryMaxSocEntity", {}, "Battery max SoC entity"), this._batteryMaxSocEntityId());
      addEntity(this._t("editor.batteryFlowEntity", {}, "Battery flow entity (+/-)"), this.config.entities?.battery_flow_power || this.config.entities?.battery_charge_power || this.config.entities?.battery_discharge_power);
      addEntity(this._t("editor.batteryTemperatureEntity", {}, "Battery temperature entity"), this._batteryTemperatureEntityId());
      addEntity(this._t("editor.batteryCyclesTodayEntity", {}, "Battery cycles today entity"), this._batteryCyclesTodayEntityId());
    }
    if (isWallbox) {
      (snapshot.wallboxes || []).forEach((wallbox) => {
        addEntity(wallbox.label, wallbox.entityId);
        addEntity(`${wallbox.label} SoC`, wallbox.socEntityId);
        addEntity(`${wallbox.label} Max SoC`, wallbox.maxSocEntityId);
        addEntity(`${wallbox.label} ${this._t("editor.phaseActionEntity", {}, "Upcoming phase action entity")}`, wallbox.phaseAction?.actionEntityId);
        addEntity(`${wallbox.label} ${this._t("editor.phaseRemainingEntity", {}, "Phase action remaining seconds entity")}`, wallbox.phaseAction?.remainingEntityId);
      });
    }
    if (isLargeConsumer || isLoad || isPv) {
      (snapshot.largeConsumers || []).forEach((consumer) => {
        addEntity(`${consumer.label} ${this._t("editor.consumerPowerEntity", {}, "Power entity")}`, consumer.powerEntityId);
        addEntity(`${consumer.label} ${this._t("editor.consumerEnergyEntity", {}, "kWh counter entity")}`, consumer.energyEntityId);
      });
    }
    if (isLoad) addEntity(this._t("advisor.consumption", {}, "Load"), this.config.entities?.house_consumption_power);
    if (isSensors && Array.isArray(item.details)) item.details.forEach((detail) => addValue(this._t("advisor.sensors", {}, "Sensors"), detail));
    if (snapshot.electricityPriceEntityId) addEntity(this._t("advisor.electricityPrice", {}, "Electricity price"), snapshot.electricityPriceEntityId);
    const signalTopics = [
      isPv ? ["pv", "surplus", "weather"] : [],
      isGrid ? ["grid", "surplus"] : [],
      isBattery ? ["battery"] : [],
      isWallbox ? ["wallbox"] : [],
      isLoad || isLargeConsumer ? ["pv", "surplus"] : [],
      snapshot.electricityPriceEntityId ? ["price"] : [],
    ].flat();
    const signals = Array.isArray(item.signals) && item.signals.length > 0
      ? item.signals
      : this._advisorSignalDetails(snapshot, signalTopics);

    const dedupe = (list) => [...new Set(list)];
    const dedupedValues = dedupe(values);
    const dedupedSignals = dedupe(signals);
    const dedupedEntities = dedupe(entities);
    return {
      why: item.reason || item.text,
      paragraphs: this._advisorExplanationParagraphs(item, dedupedValues, dedupedSignals, dedupedEntities),
      signals: dedupedSignals,
      values: dedupedValues,
      entities: dedupedEntities,
    };
  }
  };
}

function createAdvisorViewMethods() {
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

function numericState(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const normalized = String(value ?? "").trim().replace(/,/g, ".");
  if (!normalized || ["unknown", "unavailable", "offline", "none", "null"].includes(normalized.toLowerCase())) return undefined;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

function formatValue(value, unavailable = "—") {
  const normalized = String(value ?? "").toLowerCase();
  if (
    value === undefined
    || value === null
    || normalized === "unknown"
    || normalized === "unavailable"
    || normalized === "offline"
  ) return unavailable;
  return value;
}

function normalizeUnit(unit) {
  return String(unit || "").trim().toLowerCase();
}

function isEnergyUnit(unit) {
  return ["wh", "kwh", "mwh"].includes(normalizeUnit(unit));
}

function isPowerUnit(unit) {
  return ["w", "kw", "mw"].includes(normalizeUnit(unit));
}

function normalizeVolumeUnit(unit) {
  return normalizeUnit(unit)
    .replace(/\s+/g, "")
    .replace(/³/g, "3");
}

function isVolumeUnit(unit) {
  return ["m3", "cbm", "l", "liter", "litre", "liters", "litres", "ml"].includes(normalizeVolumeUnit(unit));
}

function valueAsWatts(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === "kw") return numericValue * 1000;
  if (normalizedUnit === "mw") return numericValue * 1000000;
  return numericValue;
}

function valueAsVolts(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === "kv") return numericValue * 1000;
  if (normalizedUnit === "mv") return numericValue / 1000;
  return numericValue;
}

function valueAsKwh(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === "wh") return numericValue / 1000;
  if (normalizedUnit === "mwh") return numericValue * 1000;
  return numericValue;
}

function valueAsCubicMeters(value, unit) {
  const numericValue = numericState(value);
  if (!Number.isFinite(numericValue)) return undefined;
  const normalizedUnit = normalizeVolumeUnit(unit);
  if (["l", "liter", "litre", "liters", "litres"].includes(normalizedUnit)) return numericValue / 1000;
  if (normalizedUnit === "ml") return numericValue / 1000000;
  return numericValue;
}

function formatTrimmedNumber(value, decimals) {
  if (!Number.isFinite(value)) return undefined;
  return value
    .toFixed(decimals)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

function formatWithUnit(rawValue, unit, unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  if (unit === undefined || unit === null || String(unit).trim() === "") return value;
  return `${value} ${unit}`;
}

function formatVoltageValue(rawValue, entityUnit = "V", unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  const volts = valueAsVolts(rawValue, entityUnit);
  if (!Number.isFinite(volts)) return entityUnit ? `${value} ${entityUnit}` : String(value);
  const decimals = Math.abs(volts) >= 100 || Number.isInteger(volts) ? 0 : 1;
  return `${volts.toFixed(decimals)} V`;
}

function formatEnergyValue(rawValue, entityUnit, targetUnit = "kWh", unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  const normalizedTargetUnit = normalizeUnit(targetUnit);
  if (normalizedTargetUnit === "kwh") {
    const kwhValue = valueAsKwh(rawValue, entityUnit);
    if (kwhValue !== undefined) return `${kwhValue.toFixed(2)} kWh`;
  }
  return `${value} ${targetUnit || entityUnit || "kWh"}`;
}

function formatVolumeValue(rawValue, entityUnit, targetUnit = "m³", unavailable = "—") {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;
  const normalizedTargetUnit = normalizeVolumeUnit(targetUnit);
  const cubicMeters = valueAsCubicMeters(rawValue, entityUnit);

  if (normalizedTargetUnit === "l") {
    if (cubicMeters !== undefined) return `${formatTrimmedNumber(cubicMeters * 1000, cubicMeters >= 1 ? 0 : 1)} L`;
    return `${value} L`;
  }

  if (!targetUnit || normalizedTargetUnit === "auto") {
    const displayUnit = entityUnit || "m³";
    return `${value} ${displayUnit}`;
  }

  if (["m3", "cbm"].includes(normalizedTargetUnit)) {
    if (cubicMeters !== undefined) {
      const decimals = Math.abs(cubicMeters) >= 100 ? 1 : 3;
      return `${formatTrimmedNumber(cubicMeters, decimals)} m³`;
    }
    return `${value} m³`;
  }

  return `${value} ${targetUnit || entityUnit || "m³"}`;
}

function formatPowerValue(rawValue, unit, entityUnit, { powerDisplayMode = "auto_kw", unavailable = "—" } = {}) {
  const value = formatValue(rawValue, unavailable);
  if (value === unavailable) return value;

  const normalizedUnit = normalizeUnit(unit);
  const normalizedEntityUnit = normalizeUnit(entityUnit);

  if (isEnergyUnit(normalizedEntityUnit)) {
    if (!unit || normalizedUnit === "auto" || isPowerUnit(normalizedUnit)) {
      return formatEnergyValue(rawValue, entityUnit, "kWh", unavailable);
    }
    if (isEnergyUnit(normalizedUnit)) return formatEnergyValue(rawValue, entityUnit, unit, unavailable);
  }

  if (normalizedUnit === "kwh") return formatEnergyValue(rawValue, entityUnit, "kWh", unavailable);
  if (normalizedUnit === "w") {
    const wattValue = valueAsWatts(rawValue, entityUnit);
    return `${wattValue === undefined ? value : wattValue.toFixed(0)} W`;
  }
  if (normalizedUnit === "kw") {
    const wattValue = valueAsWatts(rawValue, entityUnit);
    if (wattValue === undefined) return `${value} kW`;
    return `${(wattValue / 1000).toFixed(2)} kW`;
  }
  if (unit && normalizedUnit !== "auto") return `${value} ${unit}`;

  const numericValue = isPowerUnit(normalizedEntityUnit)
    ? valueAsWatts(rawValue, entityUnit)
    : Number(rawValue);
  if (!Number.isFinite(numericValue)) return `${value} W`;

  if (powerDisplayMode === "auto_kw" && Math.abs(numericValue) >= 1000) {
    return `${(numericValue / 1000).toFixed(2)} kW`;
  }

  return `${numericValue.toFixed(0)} W`;
}

function formatDurationMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const rounded = Math.max(1, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const restMinutes = rounded % 60;
  if (hours <= 0) return `${restMinutes}min`;
  if (restMinutes <= 0) return `${hours}h`;
  return `${hours}h ${restMinutes}m`;
}

function formatDurationSeconds(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const rounded = Math.max(1, Math.round(seconds));
  if (rounded < 60) return `${rounded}s`;
  const minutes = Math.floor(rounded / 60);
  const restSeconds = rounded % 60;
  if (minutes < 60) return restSeconds > 0 ? `${minutes}min ${restSeconds}s` : `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (restMinutes <= 0) return `${hours}h`;
  return `${hours}h ${restMinutes}m`;
}

function formatRemainingChargeTimeValue(rawValue, entityUnit = "") {
  const raw = String(rawValue ?? "").trim();
  const normalized = raw.toLowerCase();
  if (!normalized || ["unknown", "unavailable", "none", "null", "offline"].includes(normalized)) return "";

  const durationMatch = normalized.match(/^(\d{1,3}):([0-5]\d)(?::([0-5]\d))?$/);
  if (durationMatch) {
    const first = Number(durationMatch[1]);
    const second = Number(durationMatch[2]);
    const third = durationMatch[3] !== undefined ? Number(durationMatch[3]) : undefined;
    const minutes = third === undefined ? first * 60 + second : first * 60 + second + third / 60;
    return formatDurationMinutes(minutes);
  }

  if (/[a-z]{3,}:\/\//i.test(raw) || /\d{4}-\d{2}-\d{2}/.test(raw)) {
    const timestamp = Date.parse(raw);
    const minutes = (timestamp - Date.now()) / 60000;
    const formatted = formatDurationMinutes(minutes);
    if (formatted) return formatted;
  }

  const numericValue = Number(raw.replace(",", "."));
  if (Number.isFinite(numericValue)) {
    const unit = normalizeUnit(entityUnit);
    if (unit.includes("h") || unit.includes("std") || unit.includes("hour") || unit.includes("stunde")) return formatDurationMinutes(numericValue * 60);
    if (unit.includes("min") || unit === "m") return formatDurationMinutes(numericValue);
    if (unit.includes("s") && !unit.includes("stunden")) return formatDurationMinutes(numericValue / 60);
    return numericValue > 24 ? formatDurationMinutes(numericValue) : formatDurationMinutes(numericValue * 60);
  }

  return raw;
}

function normalizePvConfigId(value, fallback) {
  const id = String(value || fallback || "").trim().replace(/[^\w-]+/g, "_");
  return id || String(fallback || "item").replace(/[^\w-]+/g, "_");
}

function clampPvConfigNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function parsePowerLimitWatts(rawValue, defaultUnit = "kw") {
  if (rawValue === undefined || rawValue === null || rawValue === "") return undefined;
  if (typeof rawValue === "number") {
    if (!Number.isFinite(rawValue) || rawValue <= 0) return undefined;
    return defaultUnit === "w" ? rawValue : rawValue * 1000;
  }

  const normalized = String(rawValue).trim().toLowerCase().replace(",", ".");
  const match = normalized.match(/^(-?\d+(?:\.\d+)?)\s*(kwp|kw|w)?$/);
  if (!match) return undefined;
  const number = Number(match[1]);
  if (!Number.isFinite(number) || number <= 0) return undefined;
  const unit = match[2] || defaultUnit;
  return unit === "w" ? number : number * 1000;
}

function normalizePvRoofStringDisplay(value) {
  const normalized = String(value || "sum").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    add: "sum",
    added: "sum",
    summed: "sum",
    total: "sum",
    zusammen: "sum",
    summe: "sum",
    liste: "values",
    list: "values",
    split: "values",
    separate: "values",
    values_inline: "values",
    highest: "dominant",
    max: "dominant",
    dominant_value: "dominant",
    high_low: "dominant",
    strongest: "dominant",
    staerkster: "dominant",
    stärkster: "dominant",
  };
  const key = aliases[normalized] || normalized;
  return ["sum", "values", "dominant"].includes(key) ? key : "sum";
}

function normalizePowerSourceConfig(raw, index, {
  fallbackIdPrefix = "item",
  fallbackLabel = "Item",
} = {}) {
  const source = raw && typeof raw === "object" ? raw : { power_entity: raw };
  const sequence = index + 2;
  const id = normalizePvConfigId(source.id || source.key || source.name || source.label, `${fallbackIdPrefix}_${sequence}`);
  const maxPowerSource = source.max_power_kw ?? source.maxPowerKw ?? source.max_power ?? source.maxPower ?? "";
  const maxPowerKw = maxPowerSource === "" || maxPowerSource === undefined || maxPowerSource === null
    ? ""
    : clampPvConfigNumber(maxPowerSource, "", 0, 1000);
  return {
    id,
    label: String(source.label || source.name || `${fallbackLabel} ${sequence}`).trim(),
    power_entity: String(source.power_entity || source.powerEntity || source.entity || source.entity_id || source.power || "").trim(),
    energy_entity: String(source.energy_entity || source.energyEntity || source.kwh_entity || source.kwh || source.energy || source.counter || source.meter || "").trim(),
    voltage_entity: String(source.voltage_entity || source.voltageEntity || source.voltage || source.voltage_meter || "").trim(),
    voltage_entity_l1: String(source.voltage_entity_l1 || source.voltageEntityL1 || source.voltage_l1 || source.voltageL1 || "").trim(),
    voltage_entity_l2: String(source.voltage_entity_l2 || source.voltageEntityL2 || source.voltage_l2 || source.voltageL2 || "").trim(),
    voltage_entity_l3: String(source.voltage_entity_l3 || source.voltageEntityL3 || source.voltage_l3 || source.voltageL3 || "").trim(),
    max_power_kw: maxPowerKw,
    visible: source.enabled === false ? false : source.visible !== false,
  };
}

function normalizePowerSourceConfigs(configs, normalizeItem) {
  const rawList = Array.isArray(configs)
    ? configs
    : configs && typeof configs === "object"
      ? Object.entries(configs).map(([id, value]) => (
        value && typeof value === "object" ? { id, ...value } : { id, power_entity: value }
      ))
      : [];
  return rawList
    .map((item, index) => normalizeItem(item, index))
    .filter((item) => item.visible !== false || item.power_entity || item.energy_entity || item.voltage_entity || item.voltage_entity_l1 || item.voltage_entity_l2 || item.voltage_entity_l3 || item.label);
}

function normalizePvRoofStringConfig(raw, index) {
  return normalizePowerSourceConfig(raw, index, {
    fallbackIdPrefix: "string",
    fallbackLabel: "String",
  });
}

function normalizeInverterConfig(raw, index) {
  return normalizePowerSourceConfig(raw, index, {
    fallbackIdPrefix: "inverter",
    fallbackLabel: "Inverter",
  });
}

function normalizePvRoofStrings(strings) {
  return normalizePowerSourceConfigs(strings, normalizePvRoofStringConfig);
}

function normalizeInverterDisplay(value) {
  return normalizePvRoofStringDisplay(value);
}

function normalizeInverters(inverters) {
  return normalizePowerSourceConfigs(inverters, normalizeInverterConfig);
}

function pvRoofBaseEnergyEntityId(config = {}) {
  return String(config.entity || config.counter || config.kwh_entity || config.kwh || config.meter || "").trim();
}

function buildPowerSourceEntries({
  configs = [],
  powerEntityId = "",
  energyEntityId = "",
  maxPowerKw,
  maxPowerW,
  maxPower,
  voltageEntityId = "",
  voltageEntityIdL1 = "",
  voltageEntityIdL2 = "",
  voltageEntityIdL3 = "",
  baseId = "item_1",
  baseLabel = "Item 1",
  normalizeConfigs = (items) => items,
  fallbackIdPrefix = "item",
  fallbackLabel = "Item",
} = {}) {
  const baseMaxPower = parsePowerLimitWatts(maxPowerKw, "kw")
    || parsePowerLimitWatts(maxPowerW, "w")
    || parsePowerLimitWatts(maxPower, "kw");
  const baseEntry = {
    id: baseId,
    label: baseLabel,
    powerEntityId: powerEntityId || "",
    energyEntityId: energyEntityId || "",
    voltageEntityId: voltageEntityId || "",
    voltageEntityIdL1: voltageEntityIdL1 || "",
    voltageEntityIdL2: voltageEntityIdL2 || "",
    voltageEntityIdL3: voltageEntityIdL3 || "",
    maxPowerWatts: baseMaxPower,
    base: true,
    visible: true,
  };
  const extraEntries = normalizeConfigs(configs)
    .filter((config) => config.visible !== false)
    .map((config, index) => ({
      id: config.id || `${fallbackIdPrefix}_${index + 2}`,
      label: config.label || `${fallbackLabel} ${index + 2}`,
      powerEntityId: config.power_entity || "",
      energyEntityId: config.energy_entity || "",
      voltageEntityId: config.voltage_entity || "",
      voltageEntityIdL1: config.voltage_entity_l1 || "",
      voltageEntityIdL2: config.voltage_entity_l2 || "",
      voltageEntityIdL3: config.voltage_entity_l3 || "",
      maxPowerWatts: parsePowerLimitWatts(config.max_power_kw, "kw"),
      base: false,
      visible: true,
    }))
    .filter((entry) => entry.powerEntityId || entry.energyEntityId || entry.voltageEntityId || entry.voltageEntityIdL1 || entry.voltageEntityIdL2 || entry.voltageEntityIdL3 || entry.maxPowerWatts);
  return [baseEntry, ...extraEntries];
}

function buildPvRoofStringEntries({
  strings = [],
  powerEntityId = "",
  energyEntityId = "",
  maxPowerKw,
  maxPowerW,
  maxPower,
} = {}) {
  return buildPowerSourceEntries({
    configs: strings,
    powerEntityId,
    energyEntityId,
    maxPowerKw,
    maxPowerW,
    maxPower,
    baseId: "string_1",
    baseLabel: "String 1",
    normalizeConfigs: normalizePvRoofStrings,
    fallbackIdPrefix: "string",
    fallbackLabel: "String",
  });
}

function buildInverterEntries({
  inverters = [],
  powerEntityId = "",
  energyEntityId = "",
  maxPowerKw,
  maxPowerW,
  maxPower,
  voltageEntityId = "",
  voltageEntityIdL1 = "",
  voltageEntityIdL2 = "",
  voltageEntityIdL3 = "",
} = {}) {
  return buildPowerSourceEntries({
    configs: inverters,
    powerEntityId,
    energyEntityId,
    maxPowerKw,
    maxPowerW,
    maxPower,
    voltageEntityId,
    voltageEntityIdL1,
    voltageEntityIdL2,
    voltageEntityIdL3,
    baseId: "inverter_1",
    baseLabel: "Inverter 1",
    normalizeConfigs: normalizeInverters,
    fallbackIdPrefix: "inverter",
    fallbackLabel: "Inverter",
  });
}

function hasAdditionalPvRoofStrings(entries = []) {
  return entries.some((entry) => !entry.base && (entry.powerEntityId || entry.energyEntityId));
}

function hasAdditionalInverters(entries = []) {
  return hasAdditionalPvRoofStrings(entries);
}

function pvRoofStringPowerParts(entries = [], { unit = "auto", readPowerWatts, formatPowerValue } = {}) {
  return entries
    .filter((entry) => entry.powerEntityId || !entry.base)
    .map((entry) => {
      const watts = typeof readPowerWatts === "function" ? readPowerWatts(entry) : undefined;
      return {
        ...entry,
        amount: watts,
        formatted: Number.isFinite(watts) && typeof formatPowerValue === "function" ? formatPowerValue(watts, unit, "W") : "—",
      };
    })
    .filter((part) => part.powerEntityId || !part.base);
}

function pvRoofStringTotalPowerWatts(parts = []) {
  const values = parts.map((part) => part.amount).filter(Number.isFinite);
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

function inverterPowerParts(entries = [], options = {}) {
  return pvRoofStringPowerParts(entries, options);
}

function inverterTotalPowerWatts(parts = []) {
  return pvRoofStringTotalPowerWatts(parts);
}

function pvRoofStringMaxPowerWatts(entries = []) {
  const maxValues = entries
    .map((entry) => entry.maxPowerWatts)
    .filter((value) => Number.isFinite(value) && value > 0);
  if (maxValues.length === 0) return undefined;
  return maxValues.reduce((sum, value) => sum + value, 0);
}

function inverterMaxPowerWatts(entries = []) {
  return pvRoofStringMaxPowerWatts(entries);
}

function pvRoofStringEnergyParts(entries = [], { range = "live", readEnergyInfo, formatEnergyValue } = {}) {
  if (range === "live") return [];
  return entries
    .filter((entry) => entry.energyEntityId || !entry.base)
    .map((entry) => {
      const info = entry.energyEntityId && typeof readEnergyInfo === "function"
        ? readEnergyInfo(entry, range)
        : undefined;
      return {
        ...entry,
        amount: info?.amount,
        loading: info?.loading,
        error: info?.error,
        formatted: info?.loading
          ? "…"
          : Number.isFinite(info?.amount) && typeof formatEnergyValue === "function"
            ? formatEnergyValue(info.amount, "kWh", "kWh")
            : "—",
      };
    })
    .filter((part) => part.energyEntityId || !part.base);
}

function inverterEnergyParts(entries = [], options = {}) {
  return pvRoofStringEnergyParts(entries, options);
}

function formatPvRoofStringReading({
  parts = [],
  mode = "sum",
  range = "live",
  unit = "auto",
  formatPowerValue,
  formatEnergyValue,
} = {}) {
  if (parts.length === 0) return "";
  if (parts.some((part) => part.loading)) return "…";
  const values = parts.map((part) => part.amount).filter(Number.isFinite);
  if (normalizePvRoofStringDisplay(mode) !== "sum") return parts.map((part) => part.formatted).join(" / ");
  if (values.length === 0) return "—";
  const total = values.reduce((sum, value) => sum + value, 0);
  return range === "live"
    ? formatPowerValue(total, unit, "W")
    : formatEnergyValue(total, "kWh", "kWh");
}

function formatInverterReading(options = {}) {
  return formatPvRoofStringReading({
    ...options,
    mode: normalizeInverterDisplay(options.mode),
  });
}

function pvRoofStringAdvisorDetails(entries = [], { readPowerWatts } = {}) {
  return entries
    .map((entry, index) => {
      const watts = typeof readPowerWatts === "function" ? readPowerWatts(entry) : undefined;
      return {
        id: entry.id || `string_${index + 1}`,
        label: entry.label || `String ${index + 1}`,
        powerEntityId: entry.powerEntityId || "",
        energyEntityId: entry.energyEntityId || "",
        watts: Number.isFinite(watts) ? watts : undefined,
        maxPowerWatts: entry.maxPowerWatts,
        configured: Boolean(entry.powerEntityId || entry.energyEntityId),
      };
    })
    .filter((entry) => entry.configured);
}

function inverterAdvisorDetails(entries = [], { readPowerWatts } = {}) {
  return entries
    .map((entry, index) => {
      const watts = typeof readPowerWatts === "function" ? readPowerWatts(entry) : undefined;
      return {
        id: entry.id || `inverter_${index + 1}`,
        label: entry.label || `Inverter ${index + 1}`,
        powerEntityId: entry.powerEntityId || "",
        energyEntityId: entry.energyEntityId || "",
        watts: Number.isFinite(watts) ? watts : undefined,
        maxPowerWatts: entry.maxPowerWatts,
        configured: Boolean(entry.powerEntityId || entry.energyEntityId),
      };
    })
    .filter((entry) => entry.configured);
}

const GRID_IMPORT_ENTITY_KEYS = ["import_power", "grid_import_power", "import_export_import_power"];
const GRID_EXPORT_ENTITY_KEYS = ["export_power", "grid_export_power", "import_export_export_power"];

function gridSignedEntityId(config = {}) {
  return config.entities?.import_export_power || "";
}

function gridImportEntityId(config = {}) {
  return GRID_IMPORT_ENTITY_KEYS.map((key) => config.entities?.[key]).find(Boolean) || "";
}

function gridExportEntityId(config = {}) {
  return GRID_EXPORT_ENTITY_KEYS.map((key) => config.entities?.[key]).find(Boolean) || "";
}

function hasGridPowerSource(config = {}) {
  return Boolean(gridSignedEntityId(config) || gridImportEntityId(config) || gridExportEntityId(config));
}

function gridPrimaryEntityId(config = {}) {
  return gridSignedEntityId(config) || gridImportEntityId(config) || gridExportEntityId(config);
}

function flowValueAsWatts(flowValue) {
  if (!flowValue) return 0;
  return Math.abs(flowValue.kind === "energy" ? flowValue.amount * 1000 : flowValue.amount || 0);
}

function gridSignedFlowInfo({
  entityId = "",
  rawValue,
  entityUnit = "",
  unit = "auto",
  unavailableLabel = "Unavailable",
  formatValue,
  valueAsWatts,
  isEnergyUnit,
  formatEnergyValue,
  formatPowerValue,
} = {}) {
  if (!entityId) return undefined;
  const value = typeof formatValue === "function" ? formatValue(rawValue) : rawValue;
  if (value === "—") return { kind: "unavailable", label: unavailableLabel, value: "—" };

  const watts = typeof valueAsWatts === "function" ? valueAsWatts(rawValue, entityUnit) : undefined;
  if (!Number.isFinite(watts)) {
    const formattedValue = typeof isEnergyUnit === "function" && isEnergyUnit(entityUnit)
      ? formatEnergyValue(rawValue, entityUnit, unit === "auto" ? "kWh" : unit)
      : formatPowerValue(rawValue, unit, entityUnit);
    return { kind: "unknown", label: String(value), value: formattedValue };
  }
  return { kind: "flow", watts, unit };
}

function gridSplitFlowInfo({
  importEntityId = "",
  exportEntityId = "",
  importValue,
  exportValue,
  unit = "auto",
  unavailableLabel = "Unavailable",
} = {}) {
  if (!importEntityId && !exportEntityId) return undefined;
  if (!importValue && !exportValue) return { kind: "unavailable", label: unavailableLabel, value: "—" };

  const importWatts = flowValueAsWatts(importValue);
  const exportWatts = flowValueAsWatts(exportValue);
  return {
    kind: "flow",
    watts: importWatts - exportWatts,
    unit,
  };
}

function gridSplitPowerDetails({
  importEntityId = "",
  exportEntityId = "",
  importValue,
  exportValue,
} = {}) {
  if (!importEntityId || !exportEntityId) return undefined;
  return {
    importEntityId,
    exportEntityId,
    importWatts: flowValueAsWatts(importValue),
    exportWatts: flowValueAsWatts(exportValue),
  };
}

function gridStatusFromFlowInfo(info, {
  neutralThreshold = 25,
  labelForKind,
  formatPowerValue,
} = {}) {
  if (!info) return { kind: "none", label: "", value: "" };
  if (info.kind !== "flow") return info;
  const watts = info.watts;
  const unit = info.unit || "auto";
  const magnitude = Math.abs(watts);
  if (magnitude <= neutralThreshold) {
    return {
      kind: "neutral",
      label: labelForKind?.("neutral") || "",
      value: formatPowerValue?.(0, unit, "W") || "0 W",
    };
  }

  const directionKind = watts < 0 ? "export" : "import";
  return {
    kind: directionKind,
    label: labelForKind?.(directionKind) || "",
    value: formatPowerValue?.(magnitude, unit, "W") || `${magnitude.toFixed(0)} W`,
  };
}

function formatGridStatusReading(status = {}, unavailable = "—") {
  if (!status.label) return unavailable;
  if (status.kind === "neutral") return status.label;
  if (status.value && status.value !== unavailable) return `${status.label} ${status.value}`;
  return status.label;
}

function formatGridValueReading(status = {}, unavailable = "—") {
  if (!status.label) return unavailable;
  return status.value || unavailable;
}

function formatImportExportStatus(status = {}) {
  if (!status.label || status.kind === "unavailable") return "";
  if (status.kind === "neutral") return status.label;
  return `${status.label}: ${status.value}`;
}

const HTML_RAW = Symbol("htmlRaw");
const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function rawHtml(value) {
  return { [HTML_RAW]: true, value: String(value ?? "") };
}

function classNames(...values) {
  return values.flat(Infinity)
    .flatMap((value) => {
      if (!value) return [];
      if (typeof value === "string") return [value];
      if (Array.isArray(value)) return classNames(...value).split(" ").filter(Boolean);
      if (typeof value === "object") return Object.entries(value)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([name]) => name);
      return [String(value)];
    })
    .filter(Boolean)
    .join(" ");
}

function kebabCase(value) {
  return String(value).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function styleMap(styles = {}) {
  if (typeof styles === "string") return styles;
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== null && value !== false && value !== "")
    .map(([name, value]) => `${kebabCase(name)}:${value}`)
    .join(";");
}

function htmlAttributes(attrs = {}) {
  return Object.entries(attrs)
    .flatMap(([name, value]) => {
      if (value === undefined || value === null || value === false) return [];
      if (value === true) return [escapeHtml(name)];
      const attrValue = name === "class"
        ? classNames(value)
        : name === "style" && typeof value === "object"
          ? styleMap(value)
          : value;
      if (attrValue === "") return [];
      return [`${escapeHtml(name)}="${escapeHtml(attrValue)}"`];
    })
    .join(" ");
}

function childToHtml(child) {
  if (child === undefined || child === null || child === false) return "";
  if (Array.isArray(child)) return child.map(childToHtml).join("");
  if (child && typeof child === "object" && child[HTML_RAW]) return child.value;
  return escapeHtml(child);
}

function htmlTag(name, attrs = {}, children = []) {
  const attrText = htmlAttributes(attrs);
  const tagName = String(name).toLowerCase();
  const openTag = attrText ? `<${tagName} ${attrText}>` : `<${tagName}>`;
  if (VOID_ELEMENTS.has(tagName)) return openTag;
  return `${openTag}${childToHtml(children)}</${tagName}>`;
}

function chartHistoryCacheKey(entityId, hours, bucket) {
  return `${entityId}|${hours}|${bucket}`;
}

function chartHistoryApiPath(entityId, hours, end = new Date()) {
  const endDate = end instanceof Date ? end : new Date(end);
  const start = new Date(endDate.getTime() - hours * 60 * 60 * 1000);
  const query = [
    `filter_entity_id=${encodeURIComponent(entityId)}`,
    `end_time=${encodeURIComponent(endDate.toISOString())}`,
    "significant_changes_only=0",
  ].join("&");
  return `history/period/${start.toISOString()}?${query}`;
}

function chartHistoryPoint(metric, entry, {
  metricEntityId,
  getEntityUnit,
  formatValue,
  isMetricEnergyMode,
  valueAsKwh,
  valueAsCubicMeters,
  valueAsWatts,
  numericState,
  isPowerUnit,
} = {}) {
  if (!entry || typeof entry !== "object") return undefined;
  const rawValue = entry.state ?? entry.s;
  if (formatValue?.(rawValue) === "—") return undefined;
  const entityId = metricEntityId?.(metric) || metric?.chartEntityId || "";
  const entityUnit = entry.attributes?.unit_of_measurement || getEntityUnit?.(entityId) || "";
  const numericValue = isMetricEnergyMode?.(metric)
    ? valueAsKwh?.(rawValue, entityUnit)
    : metric?.unit === "volume"
      ? valueAsCubicMeters?.(rawValue, entityUnit)
      : metric?.unit === "power" || (metric?.overlay === "heatpump" && isPowerUnit?.(entityUnit))
        ? valueAsWatts?.(rawValue, entityUnit)
        : numericState?.(rawValue);
  if (!Number.isFinite(numericValue)) return undefined;
  const rawTime = entry.last_changed || entry.last_updated || entry.lu;
  const time = Date.parse(rawTime || "");
  if (!Number.isFinite(time)) return undefined;
  return { time, value: numericValue };
}

function chartBounds(points = []) {
  const values = points.map((point) => point.value).filter(Number.isFinite);
  if (values.length === 0) return { min: 0, max: 1 };
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = Math.max((rawMax - rawMin) * 0.12, rawMax === rawMin ? Math.abs(rawMax || 1) * 0.1 : 0);
  return {
    min: rawMin - pad,
    max: rawMax + pad,
  };
}

function chartPath(points, min, max, start, end, width, height, padding) {
  const range = max - min || 1;
  return points.map((point) => {
    const x = padding.left + ((point.time - start) / Math.max(1, end - start)) * (width - padding.left - padding.right);
    const y = padding.top + (1 - ((point.value - min) / range)) * (height - padding.top - padding.bottom);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function chartLastPointCoordinates(path, padding = { left: 0, top: 0 }) {
  const [x, y] = String(path || "").split(" ").at(-1)?.split(",") || [];
  return {
    x: x || padding.left,
    y: y || padding.top,
  };
}

function dedupeChartItems(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.entityId || item?.key;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function flattenChartSections(sections = []) {
  return sections.flatMap((section) => section.items || []);
}

function chartDashboardSections({
  pvRoofStringEntries = [],
  inverterEntries = [],
  metrics = [],
  metricEntityId,
  metricLabel,
  translate,
} = {}) {
  const toItem = (metric) => {
    const entityId = metric?.chartEntityId || metricEntityId?.(metric) || "";
    if (!entityId) return undefined;
    const key = metric?.chartKey || metric?.key || entityId;
    return {
      ...metric,
      key,
      chartKey: key,
      chartEntityId: entityId,
      chartLabel: metric?.chartLabel || metricLabel?.(metric) || metric?.label || key,
    };
  };
  const pvItems = pvRoofStringEntries
    .filter((entry) => entry?.powerEntityId)
    .map((entry, index) => toItem({
      key: `pv_roof_string_${entry.id || index}`,
      chartKey: `pv_roof_string_${entry.id || index}`,
      chartEntityId: entry.powerEntityId,
      chartLabel: entry.label || `String ${index + 1}`,
      unit: "power",
      color: "yellow",
    }))
    .filter(Boolean);
  const inverterItems = inverterEntries
    .filter((entry) => entry?.powerEntityId)
    .map((entry, index) => toItem({
      key: `inverter_${entry.id || index}`,
      chartKey: `inverter_${entry.id || index}`,
      chartEntityId: entry.powerEntityId,
      chartLabel: entry.label || `Inverter ${index + 1}`,
      unit: "power",
      color: "blue",
    }))
    .filter(Boolean);

  const sectionDefinitions = [
    {
      key: "pv",
      label: translate?.("charts.sectionPvStrings", {}, "PV strings") || "PV strings",
      items: pvItems,
    },
    {
      key: "inverters",
      label: translate?.("charts.sectionInverters", {}, "Inverters") || "Inverters",
      items: inverterItems,
    },
    {
      key: "wallbox",
      label: translate?.("charts.sectionWallbox", {}, "Wallbox") || "Wallbox",
      items: metrics.filter((metric) => String(metric?.key || "").includes("wallbox")).map(toItem).filter(Boolean),
    },
    {
      key: "system",
      label: translate?.("charts.sectionSystem", {}, "Inverter and system") || "Inverter and system",
      items: metrics.filter((metric) => !String(metric?.key || "").includes("wallbox")).map(toItem).filter(Boolean),
    },
  ];

  const seenAcrossSections = new Set();
  return sectionDefinitions
    .map((section) => ({
      ...section,
      items: dedupeChartItems(section.items).filter((item) => {
        const key = item.entityId || item.key;
        if (seenAcrossSections.has(key)) return false;
        seenAcrossSections.add(key);
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}

const CHART_DASHBOARD_VIEW = "charts";
const RECORDS_DASHBOARD_VIEW = "records";
const FLOORPLAN_DASHBOARD_VIEW = "floorplan";

const VIEW_MODE_OPTIONS = Object.freeze([
  Object.freeze({ key: "house", labelKey: "view.house", label: "House View", icon: "house" }),
  Object.freeze({ key: FLOORPLAN_DASHBOARD_VIEW, labelKey: "view.floorplan", label: "Floorplan", icon: "floorplan" }),
  Object.freeze({ key: "advisor", labelKey: "view.advisor", label: "Advisor Dashboard", icon: "advisor" }),
  Object.freeze({ key: CHART_DASHBOARD_VIEW, labelKey: "view.charts", label: "Charts", icon: "chart" }),
  Object.freeze({ key: RECORDS_DASHBOARD_VIEW, labelKey: "view.records", label: "Records", icon: "records" }),
]);

const VIEW_MODE_ALIASES = Object.freeze({
  home: "house",
  haus: "house",
  house_view: "house",
  building: "house",
  grundriss: FLOORPLAN_DASHBOARD_VIEW,
  floor_plan: FLOORPLAN_DASHBOARD_VIEW,
  floorplan_view: FLOORPLAN_DASHBOARD_VIEW,
  plan: FLOORPLAN_DASHBOARD_VIEW,
  advisor_dashboard: "advisor",
  advisor_view: "advisor",
  adviser: "advisor",
  adviser_dashboard: "advisor",
  energy_advisor: "advisor",
  chart: CHART_DASHBOARD_VIEW,
  diagram: CHART_DASHBOARD_VIEW,
  verlauf: CHART_DASHBOARD_VIEW,
  charts_dashboard: CHART_DASHBOARD_VIEW,
  highscore: RECORDS_DASHBOARD_VIEW,
  high_score: RECORDS_DASHBOARD_VIEW,
  highscores: RECORDS_DASHBOARD_VIEW,
  records: RECORDS_DASHBOARD_VIEW,
  rekord: RECORDS_DASHBOARD_VIEW,
  rekorde: RECORDS_DASHBOARD_VIEW,
});

const VIEW_MODE_ICONS = Object.freeze({
  house: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 10.5 9-7 9 7"></path>
      <path d="M5 9.5V20h14V9.5"></path>
      <path d="M9 20v-6h6v6"></path>
    </svg>
  `,
  advisor: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v2"></path>
      <path d="M12 19v2"></path>
      <path d="M4.22 4.22 5.64 5.64"></path>
      <path d="M18.36 18.36 19.78 19.78"></path>
      <path d="M3 12h2"></path>
      <path d="M19 12h2"></path>
      <path d="M4.22 19.78 5.64 18.36"></path>
      <path d="M18.36 5.64 19.78 4.22"></path>
      <path d="M9 12.5 11 14.5 15.5 9.5"></path>
      <circle cx="12" cy="12" r="5"></circle>
    </svg>
  `,
  floorplan: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V4h16v16Z"></path>
      <path d="M4 10h7"></path>
      <path d="M14 4v7"></path>
      <path d="M11 10v10"></path>
      <path d="M11 15h9"></path>
      <path d="M7 20v-4"></path>
      <path d="M16 15v-4"></path>
    </svg>
  `,
  chart: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19V5"></path>
      <path d="M4 19h16"></path>
      <path d="m7 15 3-4 3 2 4-6"></path>
      <path d="M17 7h3v3"></path>
    </svg>
  `,
  records: `
    <svg class="view-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 21h8"></path>
      <path d="M12 17v4"></path>
      <path d="M7 4h10v4a5 5 0 0 1-10 0Z"></path>
      <path d="M17 5h3v2a3 3 0 0 1-3 3"></path>
      <path d="M7 5H4v2a3 3 0 0 0 3 3"></path>
      <path d="m10 9 1.2 1.2L14 7.5"></path>
    </svg>
  `,
});

function normalizeViewMode(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "_");
  const key = VIEW_MODE_ALIASES[normalized] || normalized;
  return VIEW_MODE_OPTIONS.some((option) => option.key === key) ? key : undefined;
}

function viewModeIconSvg(icon) {
  return VIEW_MODE_ICONS[icon] || "";
}

const WEATHER_IMAGE_SUFFIXES = Object.freeze({
  sunny: Object.freeze(["sunny"]),
  clear: Object.freeze(["sunny"]),
  "clear-night": Object.freeze(["clear"]),
  partlycloudy: Object.freeze(["cloudy"]),
  cloudy: Object.freeze(["cloudy"]),
  fog: Object.freeze(["cloudy", "fog"]),
  rainy: Object.freeze(["rainy"]),
  pouring: Object.freeze(["rainy"]),
  "lightning-rainy": Object.freeze(["rainy", "thunderstorm"]),
  snowy: Object.freeze(["snowy", "snow", "winter"]),
  snowy_rainy: Object.freeze(["snowy", "snow", "rainy"]),
  "snowy-rainy": Object.freeze(["snowy", "snow", "rainy"]),
  hail: Object.freeze(["hail"]),
  lightning: Object.freeze(["thunderstorm"]),
  windy: Object.freeze(["wind"]),
  windy_variant: Object.freeze(["wind", "cloudy"]),
  "windy-variant": Object.freeze(["wind", "cloudy"]),
});

function normalizeWeatherState(value) {
  return String(value || "").toLowerCase().trim().replace(/\s+/g, "-");
}

function weatherSuffixes(state, suffixMap = WEATHER_IMAGE_SUFFIXES) {
  return suffixMap[normalizeWeatherState(state)] || [];
}

function imageWithSuffix(file, suffix) {
  if (!file || !suffix) return "";
  const dotIndex = file.lastIndexOf(".");
  if (dotIndex < 0) return `${file}_${suffix}`;
  return `${file.slice(0, dotIndex)}_${suffix}${file.slice(dotIndex)}`;
}

function weatherImageFiles({
  variant = {},
  isDaylight = false,
  weatherState = "",
  suffixMap = WEATHER_IMAGE_SUFFIXES,
} = {}) {
  const primaryFile = isDaylight && variant.dayFile ? variant.dayFile : variant.file;
  const fallbackFile = isDaylight ? variant.file : variant.dayFile;
  const weatherFiles = weatherSuffixes(weatherState, suffixMap).flatMap((suffix) => [
    imageWithSuffix(primaryFile, suffix),
    imageWithSuffix(fallbackFile, suffix),
  ]);
  return [
    ...weatherFiles,
    primaryFile,
    ...(fallbackFile && fallbackFile !== primaryFile ? [fallbackFile] : []),
    ...(variant.fallbackFiles || []),
  ].filter(Boolean);
}

function imagePath(variant, file) {
  if (!file || file.includes("/")) return file;
  return variant?.folder ? `${variant.folder}/${file}` : file;
}

function variantImage({
  variant = {},
  isDaylight = false,
  weatherState = "",
  localImageUrl,
  remoteImageUrl,
} = {}) {
  const files = weatherImageFiles({ variant, isDaylight, weatherState })
    .map((file) => imagePath(variant, file));
  const urls = [...new Set(files.flatMap((file) => [
    remoteImageUrl?.(file),
    localImageUrl?.(file),
  ]).filter(Boolean))];
  const [primaryUrl, ...fallbackUrls] = urls;
  return {
    src: primaryUrl,
    fallbacks: fallbackUrls,
  };
}

function createWeatherImageMethods({
  REPOSITORY_IMAGE_BASE,
  assetUrl,
  WEATHER_IMAGE_SUFFIXES: suffixMap = WEATHER_IMAGE_SUFFIXES,
} = {}) {
  return {
    _weatherState() {
      const entityId = this.config?.weather_entity;
      if (!entityId) return "";
      return normalizeWeatherState(this._hass?.states?.[entityId]?.state);
    },

    _weatherSuffixes() {
      return weatherSuffixes(this._weatherState(), suffixMap);
    },

    _imageStateKey() {
      return `${this._isDaylight()}|${this._weatherState()}|${this.config?.image || ""}|${this.config?.day_image || ""}`;
    },

    _imageWithSuffix(file, suffix) {
      return imageWithSuffix(file, suffix);
    },

    _weatherImageFiles(variant, isDaylight) {
      return weatherImageFiles({
        variant,
        isDaylight,
        weatherState: this._weatherState(),
        suffixMap,
      });
    },

    _imagePath(variant, file) {
      return imagePath(variant, file);
    },

    _variantImage(variant) {
      return variantImage({
        variant,
        isDaylight: this._isDaylight(),
        weatherState: this._weatherState(),
        localImageUrl: (file) => this._localImageUrl(file),
        remoteImageUrl: (file) => this._remoteImageUrl(file),
      });
    },

    _remoteImageUrl(file) {
      return `${REPOSITORY_IMAGE_BASE}/${file}`;
    },

    _localImageUrl(file) {
      try {
        return assetUrl(`images/${file}`);
      } catch (_err) {
        return "";
      }
    },
  };
}

const RECORDS_DEFAULT_DAYS = 7;
const RECORDS_RANGE_OPTIONS = Object.freeze([
  Object.freeze({ key: "7d", days: 7, labelKey: "records.range7d", label: "7 days" }),
  Object.freeze({ key: "14d", days: 14, labelKey: "records.range14d", label: "14 days" }),
  Object.freeze({ key: "30d", days: 30, labelKey: "records.range30d", label: "30 days" }),
  Object.freeze({ key: "month", labelKey: "records.rangeMonth", label: "This month" }),
  Object.freeze({ key: "year", labelKey: "records.rangeYear", label: "This year" }),
  Object.freeze({ key: "356d", days: 356, labelKey: "records.range356d", label: "356 days" }),
]);

const RECORD_SOLAR_THRESHOLD_WATTS = 100;
const RECORD_ACTIVE_THRESHOLD_WATTS = 100;
const RECORD_MAX_GAP_MS = 20 * 60 * 1000;
const RECORD_CACHE_BUCKET_MS = 10 * 60 * 1000;

function recordDateKey(timestamp) {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function sortedPoints(points = []) {
  return points
    .filter((point) => Number.isFinite(point?.time) && Number.isFinite(point?.value))
    .sort((a, b) => a.time - b.time);
}

function booleanRecordValue(rawValue) {
  const normalized = String(rawValue ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["on", "true", "1", "yes", "ja", "connected", "plugged", "plugged_in", "home", "enabled", "active", "ready", "verbunden", "eingesteckt", "angeschlossen"].includes(normalized)) return 1;
  if (["off", "false", "0", "no", "nein", "disconnected", "unplugged", "not_connected", "away", "disabled", "inactive", "nicht_verbunden", "ausgesteckt", "getrennt"].includes(normalized)) return 0;
  return undefined;
}

function phaseRecordValue(rawValue) {
  const normalized = String(rawValue ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const numeric = Number.parseFloat(normalized.replace(",", "."));
  if (Number.isFinite(numeric) && numeric > 0) return Math.round(numeric);
  if (["1p", "1_phase", "one_phase", "single_phase", "single", "einphasig", "eine_phase"].includes(normalized)) return 1;
  if (["3p", "3_phase", "three_phase", "dreiphasig", "drei_phasen"].includes(normalized)) return 3;
  return undefined;
}

function recordsHistoryCacheKey(entityId, days, bucket) {
  return `${entityId}|records|${days}|${bucket}`;
}

function normalizeRecordsRange(value, options = RECORDS_RANGE_OPTIONS) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "_");
  const aliases = {
    "7": "7d",
    "7d": "7d",
    "7_days": "7d",
    "7_tage": "7d",
    "14": "14d",
    "14d": "14d",
    "14_days": "14d",
    "14_tage": "14d",
    "30": "30d",
    "30d": "30d",
    "30_days": "30d",
    "30_tage": "30d",
    "356": "356d",
    "356d": "356d",
    "356_days": "356d",
    "356_tage": "356d",
    month: "month",
    this_month: "month",
    current_month: "month",
    dieser_monat: "month",
    diesen_monat: "month",
    year: "year",
    this_year: "year",
    current_year: "year",
    dieses_jahr: "year",
  };
  const key = aliases[normalized] || normalized;
  return options.some((option) => option.key === key) ? key : undefined;
}

function recordsRangeDefinition(key, options = RECORDS_RANGE_OPTIONS) {
  return options.find((option) => option.key === key) || options[0];
}

function recordsRangeStart(range, now = new Date()) {
  const end = now instanceof Date ? now : new Date(now);
  if (range?.key === "month") return new Date(end.getFullYear(), end.getMonth(), 1);
  if (range?.key === "year") return new Date(end.getFullYear(), 0, 1);
  return new Date(end.getTime() - (range?.days || RECORDS_DEFAULT_DAYS) * 24 * 60 * 60 * 1000);
}

function dailyEnergyRecords(points = []) {
  const ordered = sortedPoints(points);
  const totals = new Map();
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    const day = recordDateKey(current.time);
    if (!day) continue;
    const diff = current.value - previous.value;
    const amount = diff >= 0 ? diff : current.value >= 0 ? current.value : 0;
    if (!Number.isFinite(amount) || amount <= 0) continue;
    totals.set(day, (totals.get(day) || 0) + amount);
  }
  return [...totals.entries()]
    .map(([day, amount]) => ({ day, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function activeDurationRecords(points = [], { threshold = RECORD_ACTIVE_THRESHOLD_WATTS, maxGapMs = RECORD_MAX_GAP_MS } = {}) {
  const ordered = sortedPoints(points);
  const totals = new Map();
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const current = ordered[index];
    const next = ordered[index + 1];
    if (!(current.value > threshold)) continue;
    const day = recordDateKey(current.time);
    if (!day) continue;
    const duration = Math.min(Math.max(0, next.time - current.time), maxGapMs);
    if (duration <= 0) continue;
    totals.set(day, (totals.get(day) || 0) + duration);
  }
  return [...totals.entries()]
    .map(([day, durationMs]) => ({ day, durationMs, hours: durationMs / 3600000 }))
    .sort((a, b) => b.durationMs - a.durationMs);
}

function peakPowerRecord(points = []) {
  return sortedPoints(points)
    .reduce((best, point) => (!best || point.value > best.value ? point : best), undefined);
}

function createRecordsDashboardMethods({
  RECORDS_RANGE_OPTIONS: rangeOptions = RECORDS_RANGE_OPTIONS,
  RECORDS_DEFAULT_DAYS: defaultDays = RECORDS_DEFAULT_DAYS,
  chartHistoryApiPath,
  dailyEnergyRecords: dailyEnergyRecordsFn = dailyEnergyRecords,
  activeDurationRecords: activeDurationRecordsFn = activeDurationRecords,
  peakPowerRecord: peakPowerRecordFn = peakPowerRecord,
  recordsHistoryCacheKey: recordsHistoryCacheKeyFn = recordsHistoryCacheKey,
  numericState,
} = {}) {
  return {
    _recordsDashboardRangeKey() {
      return normalizeRecordsRange(this._recordsRange || this.config.records_range || this.config.records_days, rangeOptions)
        || normalizeRecordsRange(defaultDays, rangeOptions)
        || rangeOptions[0].key;
    },

    _recordsDashboardRange() {
      return recordsRangeDefinition(this._recordsDashboardRangeKey(), rangeOptions);
    },

    _recordsDashboardHours() {
      const start = recordsRangeStart(this._recordsDashboardRange());
      return Math.max(1, Math.ceil((Date.now() - start.getTime()) / 3600000));
    },

    _recordsHistoryCacheKey(entityId, rangeKey) {
      return recordsHistoryCacheKeyFn(entityId, rangeKey, this._cacheBucket(RECORD_CACHE_BUCKET_MS));
    },

    _recordSourceHistoryCacheKey(source, rangeKey) {
      const baseKey = this._recordsHistoryCacheKey(source.entityId, rangeKey);
      return `${baseKey}|${source.type || "power"}|${source.recordKind || ""}`;
    },

    _recordDateLabel(day) {
      const [year, month, date] = String(day || "").split("-").map(Number);
      if (!year || !month || !date) return day || "";
      try {
        return new Intl.DateTimeFormat(this._language(), { weekday: "short", day: "2-digit", month: "2-digit" })
          .format(new Date(year, month - 1, date));
      } catch (_err) {
        return day || "";
      }
    },

    _recordEnergyPoint(entry, entityId) {
      const rawValue = entry?.state ?? entry?.s;
      if (this._formatValue(rawValue) === "—") return undefined;
      const entityUnit = entry?.attributes?.unit_of_measurement || this._getEntityUnit(entityId) || "kWh";
      const value = this._valueAsKwh(rawValue, entityUnit);
      const time = Date.parse(entry?.last_changed || entry?.last_updated || entry?.lu || "");
      if (!Number.isFinite(value) || !Number.isFinite(time)) return undefined;
      return { time, value };
    },

    _recordCounterPoint(entry, entityId, targetUnit = "m³") {
      const rawValue = entry?.state ?? entry?.s;
      if (this._formatValue(rawValue) === "—") return undefined;
      const entityUnit = entry?.attributes?.unit_of_measurement || this._getEntityUnit(entityId) || targetUnit;
      const value = targetUnit === "m³" && typeof this._valueAsCubicMeters === "function"
        ? this._valueAsCubicMeters(rawValue, entityUnit)
        : numericState?.(rawValue);
      const time = Date.parse(entry?.last_changed || entry?.last_updated || entry?.lu || "");
      if (!Number.isFinite(value) || !Number.isFinite(time)) return undefined;
      return { time, value };
    },

    _recordBooleanPoint(entry) {
      const value = booleanRecordValue(entry?.state ?? entry?.s);
      const time = Date.parse(entry?.last_changed || entry?.last_updated || entry?.lu || "");
      if (!Number.isFinite(value) || !Number.isFinite(time)) return undefined;
      return { time, value };
    },

    _recordPercentPoint(entry) {
      const rawValue = entry?.state ?? entry?.s;
      const value = numericState?.(String(rawValue ?? "").replace("%", ""));
      const time = Date.parse(entry?.last_changed || entry?.last_updated || entry?.lu || "");
      if (!Number.isFinite(value) || !Number.isFinite(time)) return undefined;
      return { time, value: Math.max(0, Math.min(100, value)) };
    },

    _recordPhasePoint(entry) {
      const value = phaseRecordValue(entry?.state ?? entry?.s);
      const time = Date.parse(entry?.last_changed || entry?.last_updated || entry?.lu || "");
      if (!Number.isFinite(value) || !Number.isFinite(time)) return undefined;
      return { time, value };
    },

    _durationRecordForValue(points, targetValue) {
      return activeDurationRecordsFn(
        points.map((point) => ({ ...point, value: point.value === targetValue ? 1 : 0 })),
        { threshold: 0.5 }
      )[0];
    },

    _formatRecordCounterValue(value, unit = "") {
      const normalizedUnit = String(unit || "").trim() || "m³";
      const number = Number(value);
      if (!Number.isFinite(number)) return `— ${normalizedUnit}`;
      const decimals = number >= 10 ? 1 : number < 1 ? 3 : 2;
      const formatted = number.toLocaleString(this._language(), {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return `${formatted} ${normalizedUnit}`;
    },

    _recordPowerPoint(metric, entry) {
      return this._historyPoint(metric, entry);
    },

    _recordPointsFromStates(source, states = []) {
      return states
        .map((entry) => source.type === "energy"
          ? this._recordEnergyPoint(entry, source.entityId)
          : source.type === "counter"
            ? this._recordCounterPoint(entry, source.entityId, source.unit)
            : source.type === "boolean"
              ? this._recordBooleanPoint(entry)
              : source.type === "percent"
                ? this._recordPercentPoint(entry)
                : source.type === "phase"
                  ? this._recordPhasePoint(entry)
                  : this._recordPowerPoint(source.metric, entry))
        .filter(Boolean)
        .sort((a, b) => a.time - b.time);
    },

    _recordSources(variant = this._currentVariant || this._layoutState().variant) {
      const pvStrings = this._pvRoofStringEntries()
        .filter((entry) => entry.powerEntityId || entry.energyEntityId)
        .map((entry, index) => ({
          key: `pv_string_${entry.id || index}`,
          label: entry.label || `String ${index + 1}`,
          powerEntityId: entry.powerEntityId || "",
          energyEntityId: entry.energyEntityId || "",
          color: "yellow",
        }));
      const pvPowerSources = pvStrings
        .filter((entry) => entry.powerEntityId)
        .map((entry) => ({
          key: `${entry.key}_power`,
          label: entry.label,
          entityId: entry.powerEntityId,
          type: "power",
          group: "pv",
          metric: { key: `${entry.key}_power`, chartEntityId: entry.powerEntityId, unit: "power", color: "yellow" },
        }));
      const inverterPowerSources = typeof this._hasAdditionalInverters === "function" && this._hasAdditionalInverters()
        ? this._inverterEntries()
          .filter((entry) => entry.powerEntityId)
          .map((entry, index) => ({
            key: `inverter_${entry.id || index}_power`,
            label: entry.label || `Inverter ${index + 1}`,
            entityId: entry.powerEntityId,
            type: "power",
            group: "system",
            metric: { key: `inverter_${entry.id || index}_power`, chartEntityId: entry.powerEntityId, unit: "power", color: "blue" },
          }))
        : [];
      const pvEnergySources = pvStrings
        .filter((entry) => entry.energyEntityId)
        .map((entry) => ({
          key: `${entry.key}_energy`,
          label: entry.label,
          entityId: entry.energyEntityId,
          type: "energy",
          group: "pv",
        }));
      const metricSources = this._chartDashboardMetricPool(variant)
        .flatMap((metric) => {
          const entityId = this._chartEntityId(metric);
          if (!entityId || metric.gridStatus) return [];
          const key = metric.chartKey || metric.key;
          const metricKey = String(metric.key || "");
          const isGasCounter = metric.overlay === "smoke";
          const isVolumeCounter = metric.unit === "volume";
          const isPvMetric = metricKey.startsWith("pv_") || metric.overlay === "solar";
          const group = metricKey.includes("wallbox")
            ? "wallbox"
            : metric.largeConsumer
              ? "consumer"
              : isGasCounter || isVolumeCounter
                ? "counter"
                : isPvMetric
                  ? "pv"
              : "system";
          const sources = [{
            key,
            label: this._metricLabel(metric, variant),
            entityId,
            type: isGasCounter || isVolumeCounter ? "counter" : "power",
            group,
            unit: isGasCounter || isVolumeCounter ? "m³" : "",
            metric,
          }];
          if (group === "wallbox") {
            const energyEntityId = this._metricEnergyEntityId(metric, "total");
            const connectedEntityId = this._wallboxConnectedEntityId(metric);
            const chargingEnabledEntityId = this._wallboxChargingEnabledEntityId(metric);
            const phaseEntityId = this._wallboxPhaseEntityId(metric);
            const socEntityId = this._wallboxSocEntityId(metric);
            const maxSocEntityId = this._wallboxMaxSocEntityId(metric);
            if (energyEntityId) {
              sources.push({
                key: `${key}_energy`,
                label: this._metricLabel(metric, variant),
                entityId: energyEntityId,
                type: "energy",
                group: "wallbox",
                recordKind: "chargedEnergy",
                metric,
              });
            }
            if (connectedEntityId) {
              sources.push({
                key: `${key}_connected`,
                label: this._metricLabel(metric, variant),
                entityId: connectedEntityId,
                type: "boolean",
                group: "wallbox",
                recordKind: "pluggedIn",
                metric,
              });
            }
            if (chargingEnabledEntityId) {
              sources.push({
                key: `${key}_charging_enabled`,
                label: this._metricLabel(metric, variant),
                entityId: chargingEnabledEntityId,
                type: "boolean",
                group: "wallbox",
                recordKind: "chargingEnabled",
                metric,
              });
            }
            if (phaseEntityId) {
              sources.push({
                key: `${key}_phase`,
                label: this._metricLabel(metric, variant),
                entityId: phaseEntityId,
                type: "phase",
                group: "wallbox",
                recordKind: "phase",
                metric,
              });
            }
            if (socEntityId) {
              sources.push({
                key: `${key}_soc`,
                label: this._metricLabel(metric, variant),
                entityId: socEntityId,
                type: "percent",
                group: "wallbox",
                recordKind: "maxSoc",
                metric,
              });
            }
            if (maxSocEntityId) {
              sources.push({
                key: `${key}_max_soc`,
                label: this._metricLabel(metric, variant),
                entityId: maxSocEntityId,
                type: "percent",
                group: "wallbox",
                recordKind: "maxSocLimit",
                metric,
              });
            }
          }
          return sources;
        })
        .filter(Boolean);
      const seen = new Set();
      return [...pvEnergySources, ...pvPowerSources, ...inverterPowerSources, ...metricSources].filter((source) => {
        const key = `${source.type}:${source.entityId}`;
        if (!source.entityId || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },

    _recordHistoryState(source) {
      const rangeKey = this._recordsDashboardRangeKey();
      const cacheKey = this._recordSourceHistoryCacheKey(source, rangeKey);
      const cached = this._recordsCache?.get(cacheKey);
      if (cached?.error) return { loading: false, error: this._t("records.error", {}, "Records could not be loaded."), points: [] };
      if (cached) return { loading: false, error: "", points: cached };
      const rawCacheKey = this._recordsHistoryCacheKey(source.entityId, rangeKey);
      const rawCached = this._recordsRawHistoryCache?.get(rawCacheKey);
      if (rawCached?.error) {
        this._setCacheEntry(this._recordsCache, cacheKey, { error: true, points: [] }, 192);
        return { loading: false, error: this._t("records.error", {}, "Records could not be loaded."), points: [] };
      }
      if (Array.isArray(rawCached)) {
        const points = this._recordPointsFromStates(source, rawCached);
        this._setCacheEntry(this._recordsCache, cacheKey, points, 192);
        return { loading: false, error: "", points };
      }
      this._requestRecordHistory(source, rawCacheKey);
      return { loading: true, error: "", points: [] };
    },

    _requestRecordHistory(source, rawCacheKey) {
      if (!this._hass?.callApi || this._recordsLoading?.has(rawCacheKey)) return;
      const requestToken = this._asyncRequestToken || 0;
      const hours = this._recordsDashboardHours();
      this._recordsLoading.add(rawCacheKey);
      this._hass.callApi("GET", chartHistoryApiPath(source.entityId, hours))
        .then((history) => {
          if (!this._isActiveRequest(requestToken)) return;
          const states = Array.isArray(history?.[0]) ? history[0] : [];
          this._setCacheEntry(this._recordsRawHistoryCache, rawCacheKey, states, 96);
        })
        .catch(() => {
          if (!this._isActiveRequest(requestToken)) return;
          this._setCacheEntry(this._recordsRawHistoryCache, rawCacheKey, { error: true, points: [] }, 96);
        })
        .finally(() => {
          if (!this._isActiveRequest(requestToken)) return;
          this._recordsLoading?.delete(rawCacheKey);
          this._updateReadingsIfReady();
        });
    },

    _recordsSections(variant = this._currentVariant || this._layoutState().variant) {
      const sources = this._recordSources(variant);
      const states = sources.map((source) => ({ source, state: this._recordHistoryState(source) }));
      const loading = states.some((entry) => entry.state.loading);
      const hasError = states.some((entry) => entry.state.error);
      const loadingSources = states
        .filter((entry) => entry.state.loading)
        .map(({ source }) => ({
          label: source.label,
          purpose: this._recordLoadingPurpose(source),
          entityId: source.entityId,
        }));
      const cards = {
        pvEnergy: [],
        solarHours: [],
        peaks: [],
        wallbox: [],
        counters: [],
      };
      const pushCard = (section, card) => {
        if (!card || !card.value) return;
        cards[section].push(card);
      };

      states.forEach(({ source, state }) => {
        if (state.loading || state.error || !Array.isArray(state.points) || state.points.length < 2) return;
        if (source.type === "energy" && source.group === "pv") {
          const bestDay = dailyEnergyRecordsFn(state.points)[0];
          if (bestDay) {
            pushCard("pvEnergy", {
              title: this._t("records.pvBestYield", { name: source.label }, `${source.label}: best PV yield`),
              value: this._formatEnergyValue(bestDay.amount, "kWh", "kWh"),
              sortValue: bestDay.amount,
              meta: this._recordDateLabel(bestDay.day),
              entityId: source.entityId,
            });
          }
        }
        if (source.type === "energy" && source.group === "wallbox") {
          const bestDay = dailyEnergyRecordsFn(state.points)[0];
          if (bestDay) {
            pushCard("wallbox", {
              title: this._t("records.wallboxChargedEnergy", { name: source.label }, `${source.label}: most charged energy`),
              value: this._formatEnergyValue(bestDay.amount, "kWh", "kWh"),
              sortValue: bestDay.amount,
              meta: this._recordDateLabel(bestDay.day),
              entityId: source.entityId,
            });
          }
        }
        if (source.type === "counter") {
          const bestDay = dailyEnergyRecordsFn(state.points)[0];
          if (bestDay) {
            pushCard("counters", {
              title: this._t("records.counterLargestIncrease", { name: source.label }, `${source.label}: largest daily meter increase`),
              value: this._formatRecordCounterValue(bestDay.amount, source.unit),
              sortValue: bestDay.amount,
              meta: this._recordDateLabel(bestDay.day),
              entityId: source.entityId,
            });
          }
        }
        if (source.type === "boolean" && source.group === "wallbox") {
          const bestBooleanDay = activeDurationRecordsFn(state.points, { threshold: 0.5 })[0];
          if (bestBooleanDay) {
            const titleKey = source.recordKind === "chargingEnabled" ? "records.wallboxChargingEnabled" : "records.wallboxPluggedIn";
            const fallback = source.recordKind === "chargingEnabled"
              ? `${source.label}: longest charging enabled time`
              : `${source.label}: longest plugged-in time`;
            pushCard("wallbox", {
              title: this._t(titleKey, { name: source.label }, fallback),
              value: this._formatDurationMinutes(bestBooleanDay.durationMs / 60000),
              sortValue: bestBooleanDay.durationMs,
              meta: this._recordDateLabel(bestBooleanDay.day),
              entityId: source.entityId,
            });
          }
        }
        if (source.type === "percent" && source.group === "wallbox") {
          const bestSoc = peakPowerRecordFn(state.points);
          if (bestSoc) {
            const titleKey = source.recordKind === "maxSocLimit" ? "records.wallboxMaxSocLimit" : "records.wallboxMaxSoc";
            const fallback = source.recordKind === "maxSocLimit"
              ? `${source.label}: highest charge limit`
              : `${source.label}: highest vehicle SoC`;
            pushCard("wallbox", {
              title: this._t(titleKey, { name: source.label }, fallback),
              value: `${Math.round(bestSoc.value)}%`,
              sortValue: bestSoc.value,
              meta: this._formatLocalDateTime(new Date(bestSoc.time).toISOString()),
              entityId: source.entityId,
            });
          }
        }
        if (source.type === "phase" && source.group === "wallbox") {
          const bestOnePhaseDay = this._durationRecordForValue(state.points, 1);
          if (bestOnePhaseDay) {
            pushCard("wallbox", {
              title: this._t("records.wallboxOnePhase", { name: source.label }, `${source.label}: longest 1-phase time`),
              value: this._formatDurationMinutes(bestOnePhaseDay.durationMs / 60000),
              sortValue: bestOnePhaseDay.durationMs,
              meta: this._recordDateLabel(bestOnePhaseDay.day),
              entityId: source.entityId,
            });
          }
          const bestThreePhaseDay = this._durationRecordForValue(state.points, 3);
          if (bestThreePhaseDay) {
            pushCard("wallbox", {
              title: this._t("records.wallboxThreePhase", { name: source.label }, `${source.label}: longest 3-phase time`),
              value: this._formatDurationMinutes(bestThreePhaseDay.durationMs / 60000),
              sortValue: bestThreePhaseDay.durationMs,
              meta: this._recordDateLabel(bestThreePhaseDay.day),
              entityId: source.entityId,
            });
          }
        }
        if (source.type === "power") {
          const peak = peakPowerRecordFn(state.points);
          if (peak) {
            const peakTitle = source.group === "wallbox"
              ? this._t("records.wallboxPeakPower", { name: source.label }, `${source.label}: highest charging power`)
              : source.group === "pv"
                ? this._t("records.pvPeakPower", { name: source.label }, `${source.label}: highest PV power`)
                : source.group === "consumer"
                  ? this._t("records.consumerPeakPower", { name: source.label }, `${source.label}: highest consumption peak`)
                  : this._t("records.powerPeak", { name: source.label }, `${source.label}: highest power peak`);
            const card = {
              title: peakTitle,
              value: this._formatPowerValue(peak.value, "auto", "W"),
              sortValue: peak.value,
              meta: this._formatLocalDateTime(new Date(peak.time).toISOString()),
              entityId: source.entityId,
            };
            if (source.group === "wallbox") pushCard("wallbox", card);
            else pushCard("peaks", card);
          }
          if (source.group === "pv") {
            const bestSolarDay = activeDurationRecordsFn(state.points, { threshold: this.config.records_solar_threshold_watts || RECORD_SOLAR_THRESHOLD_WATTS })[0];
            if (bestSolarDay) {
              pushCard("solarHours", {
                title: this._t("records.solarLongestHours", { name: source.label }, `${source.label}: longest solar production time`),
                value: this._formatDurationMinutes(bestSolarDay.durationMs / 60000),
                sortValue: bestSolarDay.durationMs,
                meta: this._recordDateLabel(bestSolarDay.day),
                entityId: source.entityId,
              });
            }
          }
          if (source.group === "wallbox") {
            const bestChargingDay = activeDurationRecordsFn(state.points, { threshold: RECORD_ACTIVE_THRESHOLD_WATTS })[0];
            if (bestChargingDay) {
              pushCard("wallbox", {
                title: this._t("records.wallboxLongestCharge", { name: source.label }, `${source.label}: longest charging day`),
                value: this._formatDurationMinutes(bestChargingDay.durationMs / 60000),
                sortValue: bestChargingDay.durationMs,
                meta: this._recordDateLabel(bestChargingDay.day),
                entityId: source.entityId,
              });
            }
          }
        }
      });

      const sortByValue = (items) => [...items].sort((a, b) => (
        (Number.isFinite(b.sortValue) ? b.sortValue : numericState?.(b.value) || 0)
        - (Number.isFinite(a.sortValue) ? a.sortValue : numericState?.(a.value) || 0)
      ));
      return {
        loading,
        hasError,
        loadingSources,
        sections: [
          { key: "pvEnergy", label: this._t("records.sectionPvEnergy", {}, "Best PV yield per string"), items: sortByValue(cards.pvEnergy) },
          { key: "solarHours", label: this._t("records.sectionSolarHours", {}, "Longest solar hours"), items: sortByValue(cards.solarHours) },
          { key: "wallbox", label: this._t("records.sectionWallbox", {}, "Wallbox records"), items: sortByValue(cards.wallbox) },
          { key: "counters", label: this._t("records.sectionCounters", {}, "Meter records"), items: sortByValue(cards.counters) },
          { key: "peaks", label: this._t("records.sectionPeaks", {}, "Power peaks"), items: sortByValue(cards.peaks).slice(0, 8) },
        ].filter((section) => section.items.length > 0),
      };
    },

    _renderRecordCard(card) {
      return `
        <article class="record-card" title="${this._escape(card.entityId || "")}">
          <div class="record-card-head">
            <strong>${this._escape(card.title)}</strong>
            <span>${this._escape(card.meta || "")}</span>
          </div>
          <div class="record-card-value">${this._escape(card.value)}</div>
          ${card.entityId ? `<code>${this._escape(card.entityId)}</code>` : ""}
        </article>
      `;
    },

    _recordLoadingPurpose(source) {
      if (source.type === "energy" && source.group === "pv") return this._t("records.loadingPurposePvEnergy", {}, "PV daily yield");
      if (source.type === "energy" && source.group === "wallbox") return this._t("records.loadingPurposeWallboxEnergy", {}, "Wallbox charged energy");
      if (source.type === "counter") return this._t("records.loadingPurposeCounter", {}, "Meter daily increase");
      if (source.type === "boolean" && source.recordKind === "chargingEnabled") return this._t("records.loadingPurposeWallboxChargingEnabled", {}, "Wallbox charging enabled time");
      if (source.type === "boolean" && source.group === "wallbox") return this._t("records.loadingPurposeWallboxPluggedIn", {}, "Wallbox plugged-in time");
      if (source.type === "percent" && source.recordKind === "maxSocLimit") return this._t("records.loadingPurposeWallboxMaxSocLimit", {}, "Wallbox charge limit");
      if (source.type === "percent" && source.group === "wallbox") return this._t("records.loadingPurposeWallboxSoc", {}, "Wallbox vehicle SoC");
      if (source.type === "phase") return this._t("records.loadingPurposeWallboxPhase", {}, "Wallbox phase history");
      if (source.type === "power" && source.group === "wallbox") return this._t("records.loadingPurposeWallboxPower", {}, "Wallbox charging power");
      if (source.type === "power" && source.group === "pv") return this._t("records.loadingPurposePvPower", {}, "PV power and solar hours");
      if (source.type === "power" && source.group === "consumer") return this._t("records.loadingPurposeConsumerPower", {}, "Consumption peak");
      return this._t("records.loadingPurposePower", {}, "Power peak");
    },

    _renderRecordsLoadingDetails(records) {
      const items = records.loadingSources || [];
      if (!items.length) return "";
      return `
        <div class="record-loading-details" aria-live="polite">
          <div class="record-loading-title">
            <span>${this._escape(this._t("records.loadingTitle", { count: items.length }, "Loading history"))}</span>
            <strong>${this._escape(items.length === 1
              ? this._t("records.loadingCountOne", { count: items.length }, "1 entity")
              : this._t("records.loadingCount", { count: items.length }, `${items.length} entities`))}</strong>
          </div>
          <div class="record-loading-list">
            ${items.map((item) => `
              <div class="record-loading-item">
                <span>${this._escape(item.label)}</span>
                <small>${this._escape(item.purpose)}</small>
                <code>${this._escape(item.entityId)}</code>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    },

    _renderRecordsDashboard(variant = this._currentVariant || this._layoutState().variant) {
      const range = this._recordsDashboardRange();
      const rangeLabel = this._t(range.labelKey, {}, range.label);
      const records = this._recordsSections(variant);
      const rangeButton = (option) => `
        <button type="button" class="chart-range${range.key === option.key ? " active" : ""}" data-record-range="${this._escape(option.key)}">${this._escape(this._t(option.labelKey, {}, option.label))}</button>
      `;
      const sectionHtml = records.sections.map((section) => `
        <section class="record-section">
          <div class="chart-section-head">
            <h3>${this._escape(section.label)}</h3>
            <span>${this._escape(section.items.length === 1
              ? this._t("records.countOne", { count: section.items.length }, "1 record")
              : this._t("records.count", { count: section.items.length }, `${section.items.length} records`))}</span>
          </div>
          <div class="record-grid">
            ${section.items.map((card) => this._renderRecordCard(card)).join("")}
          </div>
        </section>
      `).join("");

      return `
        <section class="record-dashboard" data-record-dashboard>
          <div class="chart-dashboard-head">
            <div>
              <div class="chart-dashboard-label">${this._escape(this._t("records.label", {}, "Records"))}</div>
              <h2>${this._escape(this._t("records.title", {}, "Energy records"))}</h2>
              <p>${this._escape(this._t("records.subtitle", { range: rangeLabel }, `Best values for ${rangeLabel} from Home Assistant history.`))}</p>
            </div>
            <div class="chart-actions">
              ${rangeOptions.map((option) => rangeButton(option)).join("")}
            </div>
          </div>
          ${this._renderRecordsLoadingDetails(records)}
          ${records.sections.length > 0
            ? sectionHtml
            : `<div class="chart-message">${this._escape(records.loading
              ? this._t("records.loading", {}, "Loading records…")
              : records.hasError
                ? this._t("records.error", {}, "Records could not be loaded.")
                : this._t("records.empty", {}, "No recordable history found yet."))}</div>`}
        </section>
      `;
    },

    _attachRecordsDashboardControls() {
      this.shadowRoot.querySelectorAll("[data-record-range]").forEach((button) => {
        if (button.dataset.recordRangeBound === "true") return;
        button.dataset.recordRangeBound = "true";
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const rangeKey = normalizeRecordsRange(event.currentTarget.dataset.recordRange, rangeOptions);
          this._recordsRange = rangeKey || normalizeRecordsRange(defaultDays, rangeOptions);
          this._renderCardShell(this._layoutState());
        });
      });
    },
  };
}

const OVERLAY_TILE_METRICS = Object.freeze([
  Object.freeze({ key: "overlay_smoke", label: "Gas", labelKey: "overlay.smoke", color: "yellow", unit: "overlay", overlay: "smoke", tileOrder: 7 }),
  Object.freeze({ key: "overlay_heatpump", label: "Heat pump", labelKey: "overlay.heatpump", color: "blue", unit: "overlay", overlay: "heatpump", tileOrder: 8 }),
]);

const METRICS = Object.freeze([
  Object.freeze({ key: "pv_roof_power", label: "Roof PV", unit: "power", color: "yellow" }),
  Object.freeze({ key: "pv_shed_power", label: "Shed PV", unit: "power", color: "yellow" }),
  Object.freeze({ key: "battery_level", label: "Battery", unit: "battery", color: "green" }),
  Object.freeze({ key: "inverter_power", label: "Inverter", unit: "power", color: "blue" }),
  Object.freeze({ key: "wallbox_power", label: "EV Charger", unit: "power", color: "blue" }),
  Object.freeze({ key: "wallbox2_power", label: "EV Charger 2", unit: "power", color: "blue", optional: true }),
  Object.freeze({ key: "water_meter", label: "Water", unit: "volume", color: "blue", optional: true, tileOrder: 9 }),
  Object.freeze({ key: "import_export_power", label: "Import/Export", unit: "power", color: "blue", optional: true, tile: false }),
]);

const TILE_METRICS = Object.freeze([
  ...METRICS,
  Object.freeze({ key: "pv_total_power", label: "PV Total", unit: "power", color: "yellow", hud: false }),
  Object.freeze({ key: "house_consumption_power", label: "Consumption", unit: "power", color: "blue", hud: false, optional: true, tileOrder: 6 }),
]);

const STATUS_METRIC = Object.freeze({ key: "import_export_power", label: "Import/Export", unit: "power", color: "blue" });

const GRID_STATUS_METRIC = Object.freeze({
  ...STATUS_METRIC,
  key: "grid_status",
  sourceKey: "import_export_power",
  label: "Grid",
  labelKey: "metrics.grid_status",
  gridStatus: true,
  hud: false,
  tileOrder: 90,
});

const DEFAULT_TILE_COLOR_RULES = Object.freeze({
  pv_roof_power: Object.freeze([
    Object.freeze({ above: 3000, color: "#34d399", glow: true }),
    Object.freeze({ above: 1000, color: "#ffc233" }),
    Object.freeze({ below: 100, color: "#9ba3b8" }),
  ]),
  pv_shed_power: Object.freeze([
    Object.freeze({ above: 3000, color: "#34d399", glow: true }),
    Object.freeze({ above: 1000, color: "#ffc233" }),
    Object.freeze({ below: 100, color: "#9ba3b8" }),
  ]),
  pv_total_power: Object.freeze([
    Object.freeze({ above: 3000, color: "#34d399", glow: true }),
    Object.freeze({ above: 1000, color: "#ffc233" }),
    Object.freeze({ below: 100, color: "#9ba3b8" }),
  ]),
  battery_level: Object.freeze([
    Object.freeze({ below: 20, color: "#f87171", glow: true }),
    Object.freeze({ below: 50, color: "#fb923c" }),
    Object.freeze({ above: 80, color: "#34d399" }),
  ]),
  import_export_power: Object.freeze([
    Object.freeze({ gt: 25, color: "#fb923c", glow: true }),
    Object.freeze({ lt: -25, color: "#34d399", glow: true }),
  ]),
});

const STATIC_METRIC_COLORS = Object.freeze({
  yellow: "#ffc233",
  blue: "#1f8fff",
  green: "#34d399",
});

function metricSourceKey(metric) {
  return metric?.sourceKey || metric?.key || "";
}

function findMetricByKey(key, metrics = TILE_METRICS) {
  return metrics.find((metric) => metric.key === key);
}

function findFlowMetric(key) {
  return findMetricByKey(key, TILE_METRICS)
    || findMetricByKey(key, METRICS)
    || (key === STATUS_METRIC.key ? STATUS_METRIC : undefined);
}

function isPvMetric(metric) {
  return ["pv_roof_power", "pv_shed_power", "pv_total_power"].includes(metric?.key);
}

function isPvRoofMetric(metric) {
  return metricSourceKey(metric) === "pv_roof_power";
}

function isImportExportMetric(metric) {
  return metricSourceKey(metric) === "import_export_power";
}

function metricVoltageEntityKey(metric) {
  if (!metric || metric.largeConsumer) return "";
  return `${metricSourceKey(metric)}_voltage`;
}

function inverterPhaseVoltageEntityKeys(metric) {
  if (metricSourceKey(metric) !== "inverter_power") return [];
  return ["inverter_power_voltage_l1", "inverter_power_voltage_l2", "inverter_power_voltage_l3"];
}

function createDashboardEditorClass({
  ADVISOR_DEFAULTS,
  DEFAULT_TILE_COLOR_RULES,
  HOUSE_VARIANTS,
  IMAGE_OVERLAY_KEYS,
  TILE_METRICS,
  VIEW_MODE_OPTIONS,
  adjacentWallboxPosition,
  assetUrl,
  clampConfigNumber,
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
    this._config = {
      entities: {},
      units: {},
      positions: {},
      max_power_kw: {},
      labels: {},
      label_visibility: {},
      energy_entities: {},
      image_overlays: {},
      custom_kpis: [],
      environment_sensors: [],
      floorplan: {
        show_grid: true,
        rooms: [],
        walls: [],
        sensors: [],
      },
      large_consumers: [],
      pv_roof_strings: [],
      pv_roof_string_display: "sum",
      inverters: [],
      inverter_display: "sum",
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
    ]);
    const numericProps = new Set(["left", "top", "width", "height", "position", "columns", "x", "y", "x1", "y1", "x2", "y2"]);
    const shouldBeNumeric = numericFields.has(path) || numericProps.has(lastPart) || parts[0] === "max_power_kw" || lastPart === "max_power_kw";
    const nextValue = isCheckbox ? Boolean(value) : shouldBeNumeric ? Number(value) : value;
    this._setPath(next, parts, nextValue);
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

  _normalizeFloorplan(floorplan = {}) {
    const source = floorplan && typeof floorplan === "object" ? floorplan : {};
    const rooms = Array.isArray(source.rooms) ? source.rooms : [];
    const walls = Array.isArray(source.walls) ? source.walls : [];
    const sensors = Array.isArray(source.sensors) ? source.sensors : [];
    return {
      show_grid: source.show_grid !== false,
      rooms: rooms
        .map((room, index) => {
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
        })
        .filter(Boolean),
      walls: walls
        .map((wall, index) => {
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
        })
        .filter(Boolean),
      sensors: sensors
        .map((sensor, index) => {
          if (!sensor || typeof sensor !== "object") return undefined;
          return {
            id: String(sensor.id || sensor.key || sensor.entity || sensor.environment_sensor || `sensor_${index + 1}`).trim().replace(/[^\w-]/g, "_"),
            label: String(sensor.label || sensor.name || "").trim(),
            entity: String(sensor.entity || sensor.entity_id || "").trim(),
            environment_sensor: String(sensor.environment_sensor || sensor.environmentSensor || "").trim(),
            unit: sensor.unit ?? "auto",
            x: Number.isFinite(Number(sensor.x ?? sensor.left)) ? Number(sensor.x ?? sensor.left) : 50,
            y: Number.isFinite(Number(sensor.y ?? sensor.top)) ? Number(sensor.y ?? sensor.top) : 35,
            color: this._safeCssColor(sensor.color, "#34d399"),
            visible: sensor.visible !== false,
          };
        })
        .filter(Boolean),
    };
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
    const clampedX = Math.max(0, Math.min(100, Number(x) || 50));
    const clampedY = Math.max(0, Math.min(70, Number(y) || 35));
    if (type === "wall") {
      const index = next.floorplan.walls.length;
      next.floorplan.walls.push({
        id: `wall_${Date.now()}`,
        x1: Math.max(0, clampedX - 10),
        y1: clampedY,
        x2: Math.min(100, clampedX + 10),
        y2: clampedY,
        width: 1.2,
        color: "#dbeafe",
      });
      this._selectedFloorplanItemKey = `wall:${index}`;
    } else if (type === "sensor") {
      const index = next.floorplan.sensors.length;
      const firstEnvironmentSensor = this._normalizeEnvironmentSensors(next.environment_sensors || [])[0];
      next.floorplan.sensors.push({
        id: `sensor_${Date.now()}`,
        label: "",
        entity: "",
        environment_sensor: firstEnvironmentSensor?.id || "",
        unit: "auto",
        x: clampedX,
        y: clampedY,
        color: firstEnvironmentSensor?.color || "#34d399",
        visible: true,
      });
      this._selectedFloorplanItemKey = `sensor:${index}`;
    } else {
      const index = next.floorplan.rooms.length;
      next.floorplan.rooms.push({
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
    const selected = this._selectedFloorplanItem();
    if (!selected) return;
    const next = this._cloneConfig(this._config || {});
    next.floorplan = this._normalizeFloorplan(next.floorplan || {});
    const collection = selected.type === "room" ? "rooms" : selected.type === "wall" ? "walls" : "sensors";
    next.floorplan[collection].splice(selected.index, 1);
    this._selectedFloorplanItemKey = "";
    this._config = next;
    this._dispatchConfig(next);
    this._render();
  }

  _environmentSensorTemplates() {
    return [
      { key: "indoor", label: this._t("environment.templateIndoor", {}, "Indoor temperature"), color: "#34d399" },
      { key: "outdoor", label: this._t("environment.templateOutdoor", {}, "Outdoor temperature"), color: "#60a5fa" },
      { key: "hot_water", label: this._t("environment.templateHotWater", {}, "Hot water"), color: "#fb923c" },
      { key: "pressure", label: this._t("environment.templatePressure", {}, "Pressure"), color: "#a78bfa" },
      { key: "air_quality", label: this._t("environment.templateAirQuality", {}, "Air quality"), color: "#f87171" },
      { key: "custom", label: this._t("environment.templateCustom", {}, "Custom"), color: "#34d399" },
    ];
  }

  _environmentSensorTemplate(key = "custom") {
    return this._environmentSensorTemplates().find((template) => template.key === key) || this._environmentSensorTemplates().find((template) => template.key === "custom");
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
    const selected = this._selectedFloorplanItem(floorplan);
    const activeTool = this._floorplanTool();
    const grid = floorplan.show_grid !== false
      ? Array.from({ length: 11 }, (_item, index) => index * 10).map((x) => `<line class="floorplan-editor-gridline" x1="${x}" y1="0" x2="${x}" y2="70"></line>`).join("")
        + Array.from({ length: 8 }, (_item, index) => index * 10).map((y) => `<line class="floorplan-editor-gridline" x1="0" y1="${y}" x2="100" y2="${y}"></line>`).join("")
      : "";
    const rooms = floorplan.rooms.map((room, index) => {
      const key = `room:${index}`;
      return `
        <g class="floorplan-editor-room${selected?.key === key ? " active" : ""}" data-floorplan-select="${this._escape(key)}" style="--room-color:${this._escape(room.color)}">
          <rect x="${this._escape(room.x)}" y="${this._escape(room.y)}" width="${this._escape(room.width)}" height="${this._escape(room.height)}" rx="1.2"></rect>
          <text x="${this._escape(room.x + 1.5)}" y="${this._escape(room.y + 4)}">${this._escape(room.label)}</text>
        </g>
      `;
    }).join("");
    const walls = floorplan.walls.map((wall, index) => {
      const key = `wall:${index}`;
      return `<line class="floorplan-editor-wall${selected?.key === key ? " active" : ""}" data-floorplan-select="${this._escape(key)}" x1="${this._escape(wall.x1)}" y1="${this._escape(wall.y1)}" x2="${this._escape(wall.x2)}" y2="${this._escape(wall.y2)}" style="--wall-color:${this._escape(wall.color)};--wall-width:${this._escape(wall.width)}"></line>`;
    }).join("");
    const sensors = floorplan.sensors.map((sensor, index) => {
      const key = `sensor:${index}`;
      const linked = this._normalizeEnvironmentSensors(this._config.environment_sensors || []).find((item) => item.id === sensor.environment_sensor);
      const label = sensor.label || linked?.label || this._t("floorplan.sensor", { index: index + 1 }, `Sensor ${index + 1}`);
      const color = sensor.color || linked?.color || "#34d399";
      return `
        <g class="floorplan-editor-sensor${selected?.key === key ? " active" : ""}" data-floorplan-select="${this._escape(key)}" transform="translate(${this._escape(sensor.x)} ${this._escape(sensor.y)})" style="--sensor-color:${this._escape(color)}">
          <circle r="1.9"></circle>
          <text x="2.8" y=".9">${this._escape(label)}</text>
        </g>
      `;
    }).join("");
    const toolButtons = [
      ["room", this._t("editor.floorplanToolRoom", {}, "Room")],
      ["wall", this._t("editor.floorplanToolWall", {}, "Wall")],
      ["sensor", this._t("editor.floorplanToolSensor", {}, "Sensor")],
    ].map(([tool, label]) => `
      <button type="button" class="${tool === activeTool ? "active" : ""}" data-floorplan-tool="${this._escape(tool)}" aria-pressed="${tool === activeTool ? "true" : "false"}">${this._escape(label)}</button>
    `).join("");
    const environmentOptions = [
      `<option value="">${this._escape(this._t("editor.floorplanCustomEntity", {}, "Custom entity"))}</option>`,
      ...this._normalizeEnvironmentSensors(this._config.environment_sensors || []).map((sensor, index) => {
        const label = sensor.label || this._t("environment.sensor", { index: index + 1 }, `Environment ${index + 1}`);
        return `<option value="${this._escape(sensor.id)}"${selected?.item?.environment_sensor === sensor.id ? " selected" : ""}>${this._escape(label)}</option>`;
      }),
    ].join("");
    const selectedControls = selected
      ? (() => {
        const collection = selected.type === "room" ? "rooms" : selected.type === "wall" ? "walls" : "sensors";
        const path = `floorplan.${collection}.${selected.index}`;
        if (selected.type === "room") {
          const room = selected.item;
          return `
            <div class="layout-controls">
              <strong>${this._escape(this._t("editor.floorplanSelected", {}, "Selected element"))}: ${this._escape(this._t("editor.floorplanToolRoom", {}, "Room"))}</strong>
              <label>${this._labelText(this._t("editor.floorplanLabel", {}, "Label"))}<input data-path="${path}.label" value="${this._escape(room.label)}" /></label>
              <label>${this._labelText(`X (${room.x})`)}<input type="range" min="0" max="100" step="1" data-path="${path}.x" value="${this._escape(room.x)}" /></label>
              <label>${this._labelText(`Y (${room.y})`)}<input type="range" min="0" max="70" step="1" data-path="${path}.y" value="${this._escape(room.y)}" /></label>
              <label>${this._labelText(`${this._t("editor.floorplanWidth", {}, "Width")} (${room.width})`)}<input type="range" min="3" max="100" step="1" data-path="${path}.width" value="${this._escape(room.width)}" /></label>
              <label>${this._labelText(`${this._t("editor.floorplanHeight", {}, "Height")} (${room.height})`)}<input type="range" min="3" max="70" step="1" data-path="${path}.height" value="${this._escape(room.height)}" /></label>
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
              <label>${this._labelText(`X1 (${wall.x1})`)}<input type="range" min="0" max="100" step="1" data-path="${path}.x1" value="${this._escape(wall.x1)}" /></label>
              <label>${this._labelText(`Y1 (${wall.y1})`)}<input type="range" min="0" max="70" step="1" data-path="${path}.y1" value="${this._escape(wall.y1)}" /></label>
              <label>${this._labelText(`X2 (${wall.x2})`)}<input type="range" min="0" max="100" step="1" data-path="${path}.x2" value="${this._escape(wall.x2)}" /></label>
              <label>${this._labelText(`Y2 (${wall.y2})`)}<input type="range" min="0" max="70" step="1" data-path="${path}.y2" value="${this._escape(wall.y2)}" /></label>
              <label>${this._labelText(`${this._t("editor.overlaySize", {}, "Size")} (${wall.width})`)}<input type="range" min="0.2" max="5" step="0.1" data-path="${path}.width" value="${this._escape(wall.width)}" /></label>
              <label>${this._labelText(this._t("editor.kpiColor", {}, "Color"))}<input data-path="${path}.color" value="${this._escape(wall.color)}" /></label>
              <button type="button" data-action="remove-floorplan-item">${this._escape(this._t("editor.floorplanDelete", {}, "Delete selected"))}</button>
            </div>
          `;
        }
        const sensor = selected.item;
        return `
          <div class="layout-controls">
            <strong>${this._escape(this._t("editor.floorplanSelected", {}, "Selected element"))}: ${this._escape(this._t("editor.floorplanToolSensor", {}, "Sensor"))}</strong>
            <label class="inline"><input type="checkbox" data-path="${path}.visible" ${sensor.visible !== false ? "checked" : ""}/> ${this._escape(this._t("editor.showBox", { label: this._t("editor.floorplanToolSensor", {}, "Sensor") }, "Show sensor"))}</label>
            <label>${this._labelText(this._t("editor.floorplanSensorSource", {}, "Sensor source"))}<select data-path="${path}.environment_sensor">${environmentOptions}</select></label>
            <label>${this._labelText(this._t("editor.floorplanLabel", {}, "Label"))}<input data-path="${path}.label" value="${this._escape(sensor.label)}" /></label>
            <label>${this._labelText(this._t("editor.floorplanEntity", {}, "Entity"), this._t("editor.helpHomeAssistantSensor", {}, "Choose the Home Assistant entity that provides this value."))}<input data-path="${path}.entity" list="ha-solar-dashboard-entities" placeholder="sensor.living_room_temperature" value="${this._escape(sensor.entity)}" autocomplete="off" /></label>
            <label>${this._labelText(this._t("editor.environmentUnit", {}, "Display unit"), this._t("editor.helpUnitAuto", {}, "Use Auto to display the unit reported by the Home Assistant entity."))}<input data-path="${path}.unit" placeholder="auto" value="${this._escape(sensor.unit)}" /></label>
            <label>${this._labelText(`X (${sensor.x})`)}<input type="range" min="0" max="100" step="1" data-path="${path}.x" value="${this._escape(sensor.x)}" /></label>
            <label>${this._labelText(`Y (${sensor.y})`)}<input type="range" min="0" max="70" step="1" data-path="${path}.y" value="${this._escape(sensor.y)}" /></label>
            <label>${this._labelText(this._t("editor.kpiColor", {}, "Color"))}<input data-path="${path}.color" value="${this._escape(sensor.color)}" /></label>
            <button type="button" data-action="remove-floorplan-item">${this._escape(this._t("editor.floorplanDelete", {}, "Delete selected"))}</button>
          </div>
        `;
      })()
      : `<div class="layout-empty">${this._escape(this._t("editor.floorplanEmpty", {}, "Click the grid to create the selected element."))}</div>`;
    return `
      <section class="editor-card floorplan-editor-card">
        <div class="editor-card-head">
          <div>
            <strong>${this._escape(this._t("editor.sectionFloorplan", {}, "Floorplan editor"))}</strong>
            <span>${this._escape(this._t("editor.floorplanHelp", {}, "Choose a tool, click the grid to place it, then refine the selected element."))}</span>
          </div>
          <span class="section-status">${this._escape(this._statusText({ configured: floorplan.rooms.length + floorplan.walls.length + floorplan.sensors.length }))}</span>
        </div>
        <div class="checkbox-grid">
          <label class="inline"><input type="checkbox" data-path="floorplan.show_grid" ${floorplan.show_grid !== false ? "checked" : ""}/> ${this._escape(this._t("editor.floorplanShowGrid", {}, "Show grid"))}</label>
        </div>
        <div class="floorplan-tool-row" role="group" aria-label="${this._escape(this._t("editor.floorplanTools", {}, "Floorplan tools"))}">
          ${toolButtons}
        </div>
        <div class="layout-editor floorplan-editor">
          <div class="floorplan-editor-preview">
            <svg data-floorplan-canvas viewBox="0 0 100 70" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${this._escape(this._t("editor.sectionFloorplan", {}, "Floorplan editor"))}">
              <rect class="floorplan-editor-bg" x="0" y="0" width="100" height="70" rx="1.5"></rect>
              ${grid}
              ${rooms}
              ${walls}
              ${sensors}
            </svg>
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
    const viewMode = this._normalizeViewMode(this._config.view_mode) || "house";
    const viewModeOptions = VIEW_MODE_OPTIONS
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
    const floorplanElementCount = floorplan.rooms.length + floorplan.walls.length + floorplan.sensors.length;
    const floorplanMissing = this._missingEntityCount(floorplan.sensors.map((sensor) => {
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
      <style>
        .editor{display:grid;gap:12px;font-family:system-ui,sans-serif;min-width:0;max-width:100%;overflow:hidden;color:var(--primary-text-color,#e5e7eb)}
        label{display:grid;gap:4px;font-size:13px;min-width:0;max-width:100%;color:var(--primary-text-color,#e5e7eb)}
        input,select,button{box-sizing:border-box;min-width:0;max-width:100%;padding:8px;border:1px solid var(--divider-color,#4b5563);border-radius:8px;text-overflow:ellipsis;color:var(--primary-text-color,#e5e7eb)}
        input,select{width:100%}
        input,select{background:var(--input-fill-color,rgba(255,255,255,.04))}
        button{width:auto;background:var(--secondary-background-color,rgba(255,255,255,.08));cursor:pointer}
        button:hover:not(:disabled){border-color:var(--primary-color,#1f8fff)}
        .grid{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;min-width:0}
        .section-title{font-size:13px;font-weight:700;margin-top:4px;color:var(--primary-text-color,#e5e7eb)}
        .editor-panel,.editor-section,.editor-card{padding:10px;border:1px solid var(--divider-color,#4b5563);border-radius:8px;background:var(--card-background-color,rgba(17,24,39,.72));min-width:0}
        .editor-panel{display:grid;gap:10px}
        .editor-panel-title{font-size:14px;font-weight:800;color:var(--primary-text-color,#f3f4f6)}
        .editor-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;min-width:0}
        .editor-tab{display:grid;gap:2px;justify-items:start;text-align:left;padding:9px 10px;border-color:var(--divider-color,#4b5563);background:var(--secondary-background-color,rgba(31,41,55,.72))}
        .editor-tab span{font-size:13px;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .editor-tab small{max-width:100%;font-size:11px;color:var(--secondary-text-color,#9ca3af);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .editor-tab.active{border-color:var(--primary-color,#1f8fff);background:color-mix(in srgb,var(--primary-color,#1f8fff) 18%,var(--card-background-color,#111827));box-shadow:inset 3px 0 0 var(--primary-color,#1f8fff)}
        .editor-tab-panel{display:grid;gap:10px;min-width:0}
        .editor-tab-panel[hidden]{display:none}
        .editor-card{display:grid;gap:10px}
        .editor-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;min-width:0}
        .editor-card-head strong{font-size:14px;color:var(--primary-text-color,#f3f4f6);overflow-wrap:anywhere}
        .editor-card-head span:not(.section-status){display:block;margin-top:2px;color:var(--secondary-text-color,#9ca3af);font-size:12px;line-height:1.3}
        .section-status{flex:0 0 auto;max-width:48%;border-radius:999px;padding:4px 7px;background:color-mix(in srgb,var(--primary-color,#1f8fff) 12%,var(--secondary-background-color,#1f2937));color:var(--secondary-text-color,#cbd5e1);font-size:11px;font-weight:800;line-height:1.1;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .field-label-text{display:inline-flex;align-items:center;gap:5px;min-width:0}
        .field-help{display:inline-grid;place-items:center;width:16px;height:16px;flex:0 0 auto;border-radius:999px;background:color-mix(in srgb,var(--primary-color,#1f8fff) 18%,var(--secondary-background-color,#1f2937));color:var(--primary-color,#60a5fa);font-size:11px;font-weight:900;cursor:help}
        .template-row{display:flex;flex-wrap:wrap;gap:6px;min-width:0}
        .template-row button{border-color:color-mix(in srgb,var(--template-color,#34d399) 44%,var(--divider-color,#4b5563));box-shadow:inset 3px 0 0 var(--template-color,#34d399);font-weight:700}
        .layout-editor{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(220px,.7fr);gap:10px;align-items:start;min-width:0}
        .layout-preview{position:relative;min-width:0;aspect-ratio:91/64;overflow:hidden;border-radius:10px;border:1px solid var(--divider-color,#4b5563);background:#111827}
        .layout-preview img{display:block;width:100%;height:100%;object-fit:cover}
        .layout-marker{position:absolute;transform:translate(-50%,-50%);max-width:110px;padding:5px 7px;border-color:color-mix(in srgb,var(--layout-color,#1f8fff) 62%,rgba(255,255,255,.22));background:rgba(8,16,38,.72);color:var(--primary-text-color,#f3f4f6);box-shadow:inset 3px 0 0 var(--layout-color,#1f8fff),0 8px 18px rgba(0,0,0,.32);font-size:11px;font-weight:800;line-height:1.1}
        .layout-marker span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .layout-marker.active{outline:2px solid color-mix(in srgb,var(--layout-color,#1f8fff) 84%,#fff);outline-offset:2px}
        .layout-controls{display:grid;gap:8px;min-width:0}
        .layout-empty{font-size:13px;color:var(--secondary-text-color,#9ca3af);padding:10px;border:1px dashed var(--divider-color,#4b5563);border-radius:8px}
        .floorplan-tool-row{display:flex;flex-wrap:wrap;gap:6px;min-width:0}
        .floorplan-tool-row button{font-weight:800}
        .floorplan-tool-row button.active{border-color:var(--primary-color,#1f8fff);background:color-mix(in srgb,var(--primary-color,#1f8fff) 18%,var(--card-background-color,#111827));box-shadow:inset 3px 0 0 var(--primary-color,#1f8fff)}
        .floorplan-editor-preview{position:relative;min-width:0;aspect-ratio:10/7;overflow:hidden;border-radius:10px;border:1px solid var(--divider-color,#4b5563);background:#0a1222}
        .floorplan-editor-preview svg{display:block;width:100%;height:100%;cursor:crosshair}
        .floorplan-editor-bg{fill:rgba(10,18,34,.94)}
        .floorplan-editor-gridline{stroke:rgba(255,255,255,.08);stroke-width:.18;vector-effect:non-scaling-stroke}
        .floorplan-editor-room,.floorplan-editor-wall,.floorplan-editor-sensor{cursor:pointer}
        .floorplan-editor-room rect{fill:color-mix(in srgb,var(--room-color,#1f8fff) 12%,rgba(255,255,255,.04));stroke:color-mix(in srgb,var(--room-color,#1f8fff) 48%,rgba(255,255,255,.2));stroke-width:.5;vector-effect:non-scaling-stroke}
        .floorplan-editor-room text,.floorplan-editor-sensor text{fill:rgba(243,246,255,.82);font-size:2.3px;font-weight:800;pointer-events:none}
        .floorplan-editor-wall{stroke:var(--wall-color,#dbeafe);stroke-width:var(--wall-width,1.2);stroke-linecap:round;vector-effect:non-scaling-stroke}
        .floorplan-editor-sensor circle{fill:var(--sensor-color,#34d399);stroke:rgba(255,255,255,.86);stroke-width:.45;vector-effect:non-scaling-stroke}
        .floorplan-editor-room.active rect,.floorplan-editor-wall.active,.floorplan-editor-sensor.active circle{filter:drop-shadow(0 0 5px var(--primary-color,#1f8fff))}
        .floorplan-editor-room.active rect{stroke:#fff}
        .floorplan-editor-wall.active{stroke:#fff}
        .floorplan-editor-sensor.active circle{stroke:#fff}
        .editor-section summary{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:14px;font-weight:800;list-style:none}
        .editor-section summary::-webkit-details-marker{display:none}
        .editor-section summary::after{content:"▾";font-size:12px;color:var(--secondary-text-color,#9ca3af);transition:transform .18s ease}
        .editor-section:not([open]) summary::after{transform:rotate(-90deg)}
        .editor-section[open] summary{margin-bottom:8px}
        .section-body{display:grid;gap:8px;min-width:0}
        .settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;min-width:0}
        .action-row{display:flex;justify-content:flex-start;min-width:0}
        .box-field{display:grid;gap:8px;min-width:0;box-sizing:border-box;padding:10px;border:1px solid var(--divider-color,#4b5563);border-radius:8px;background:var(--card-background-color,rgba(17,24,39,.72))}
        .checkbox-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
        details{display:grid;gap:8px;min-width:0}
        .pv-labels{padding:8px;border:1px solid var(--divider-color,#4b5563);border-radius:8px}
        .label-options{margin-top:-2px}
        .label-options .checkbox-grid{margin-top:8px}
        .label-entity-block{display:grid;gap:6px;min-width:0}
        .label-entity-title{font-size:13px;color:inherit}
        summary{cursor:pointer;font-size:13px;font-weight:600;color:var(--primary-text-color,#e5e7eb)}
        .details-grid{display:grid;gap:8px;margin-top:8px;min-width:0}
        .kpi-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;min-width:0}
        .kpi-head strong{min-width:0;overflow-wrap:anywhere}
        .inline{display:flex;align-items:center;gap:8px}
        .inline input{width:auto;min-width:auto;padding:0}
        .setup-wizard{padding:10px;border:1px solid color-mix(in srgb,var(--primary-color,#1f8fff) 42%,var(--divider-color,#4b5563));border-radius:8px;background:color-mix(in srgb,var(--primary-color,#1f8fff) 8%,var(--card-background-color,#111827));box-shadow:inset 3px 0 0 var(--primary-color,#1f8fff)}
        .setup-wizard summary{font-weight:700;font-size:14px}
        .wizard-body{display:grid;gap:10px;margin-top:10px;min-width:0}
        .wizard-body p{margin:0;font-size:13px;line-height:1.4;color:var(--secondary-text-color,#9ca3af)}
        .wizard-status,.wizard-empty{font-size:12px;color:var(--secondary-text-color,#9ca3af)}
        .wizard-message{font-size:12px;padding:8px;border-radius:8px;background:rgba(52,211,153,.14);color:#34d399}
        .wizard-actions{display:flex;flex-wrap:wrap;gap:8px}
        .wizard-actions button:disabled,.wizard-suggestion button:disabled{opacity:.55;cursor:not-allowed}
        .wizard-actions button,.wizard-suggestion button{border-color:color-mix(in srgb,var(--primary-color,#1f8fff) 45%,var(--divider-color,#4b5563));background:color-mix(in srgb,var(--primary-color,#1f8fff) 14%,var(--card-background-color,#111827));color:var(--primary-text-color,#e5e7eb);font-weight:600}
        .wizard-suggestions-title{font-size:13px;font-weight:700;color:var(--primary-text-color,#e5e7eb)}
        .wizard-suggestions{display:grid;gap:8px;min-width:0}
        .wizard-suggestion{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px;border:1px solid var(--divider-color,#4b5563);border-radius:8px;background:var(--secondary-background-color,rgba(31,41,55,.72));min-width:0}
        .wizard-suggestion-main{display:grid;gap:4px;min-width:0}
        .wizard-suggestion-main strong{font-size:13px;overflow-wrap:anywhere;color:var(--primary-text-color,#f3f4f6)}
        .wizard-suggestion code,.wizard-current code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;overflow-wrap:anywhere;white-space:normal;color:var(--secondary-text-color,#cbd5e1)}
        .wizard-current{display:grid;gap:2px;color:var(--secondary-text-color,#9ca3af);font-size:12px;min-width:0}
        .wizard-suggestion-side{display:grid;justify-items:end;gap:6px;font-size:12px;color:var(--secondary-text-color,#9ca3af);white-space:nowrap}
        @media (max-width:700px){.checkbox-grid,.settings-grid,.editor-tabs,.layout-editor{grid-template-columns:minmax(0,1fr)}.section-status{max-width:100%;text-align:left}.editor-card-head{display:grid}}
        @media (max-width:700px){.wizard-suggestion{grid-template-columns:minmax(0,1fr)}.wizard-suggestion-side{justify-items:start;white-space:normal}}
      </style>
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
    this.shadowRoot.querySelectorAll("[data-floorplan-select]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._selectedFloorplanItemKey = event.currentTarget.dataset.floorplanSelect;
        this._render();
      });
    });
    const floorplanCanvas = this.shadowRoot.querySelector("[data-floorplan-canvas]");
    if (floorplanCanvas) {
      floorplanCanvas.addEventListener("click", (event) => {
        if (event.target.closest?.("[data-floorplan-select]")) return;
        const rect = floorplanCanvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 70;
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

const LARGE_CONSUMER_DEFINITIONS = Object.freeze([
  { id: "washing_machine", labelKey: "consumer.washing_machine", label: "Washing machine", color: "#34d399", maxPowerKw: 2.2 },
  { id: "dishwasher", labelKey: "consumer.dishwasher", label: "Dishwasher", color: "#38bdf8", maxPowerKw: 2.0 },
  { id: "space_heater", labelKey: "consumer.space_heater", label: "Fan heater", color: "#fb923c", maxPowerKw: 2.0 },
  { id: "dryer", labelKey: "consumer.dryer", label: "Dryer", color: "#facc15", maxPowerKw: 2.8 },
  { id: "dhw_heatpump", labelKey: "consumer.dhw_heatpump", label: "Domestic hot water heat pump", color: "#60a5fa", maxPowerKw: 0.8 },
]);

const LEGACY_LARGE_CONSUMER_DEFINITIONS = new Map([
  ["custom_1", { id: "custom_1", labelKey: "consumer.custom", label: "Custom", color: "#a78bfa", maxPowerKw: "", custom: true }],
]);

function normalizeConsumerConfigId(value, fallback) {
  const id = String(value || fallback || "").trim().replace(/[^\w-]+/g, "_");
  return id || String(fallback || "item").replace(/[^\w-]+/g, "_");
}

function clampConsumerConfigNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function safeConsumerConfigColor(color, fallback = "#1f8fff") {
  const value = String(color || "").trim();
  if (!value) return fallback;
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
  if (/^(rgb|rgba|hsl|hsla)\([\d\s.,%/-]+\)$/i.test(value)) return value;
  if (/^var\(--[\w-]+\)$/i.test(value)) return value;
  if (/^[a-z]+$/i.test(value)) return value;
  return fallback;
}

function normalizeLargeConsumerConfig(raw, index, definition) {
  const source = raw && typeof raw === "object" ? raw : {};
  const id = normalizeConsumerConfigId(source.id || source.key || source.type, definition?.id || `consumer_${index + 1}`);
  const maxPowerSource = source.max_power_kw ?? source.maxPowerKw ?? source.max_power ?? definition?.maxPowerKw ?? "";
  const maxPowerKw = maxPowerSource === "" || maxPowerSource === undefined || maxPowerSource === null
    ? ""
    : clampConsumerConfigNumber(maxPowerSource, "", 0, 1000);
  return {
    id,
    type: String(source.type || definition?.id || id).trim(),
    labelKey: definition?.labelKey || "",
    defaultLabel: definition?.label || `Consumer ${index + 1}`,
    label: String(source.label || source.name || "").trim(),
    power_entity: String(source.power_entity || source.powerEntity || source.entity || source.entity_id || source.power || "").trim(),
    voltage_entity: String(source.voltage_entity || source.voltageEntity || source.voltage || "").trim(),
    energy_entity: String(source.energy_entity || source.energyEntity || source.kwh_entity || source.energy || source.counter || source.meter || "").trim(),
    max_power_kw: maxPowerKw,
    position: clampConsumerConfigNumber(source.position ?? source.order ?? 200 + index, 200 + index, 0, 999),
    columns: Math.round(clampConsumerConfigNumber(source.columns ?? source.span ?? 1, 1, 1, 6)),
    color: safeConsumerConfigColor(source.color, definition?.color || "#1f8fff"),
    custom: source.custom === true || definition?.custom === true || !definition,
    visible: source.enabled === false ? false : source.visible !== false,
  };
}

function normalizeLargeConsumers(consumers) {
  const rawList = Array.isArray(consumers)
    ? consumers
    : consumers && typeof consumers === "object"
      ? Object.entries(consumers).map(([id, value]) => (
        value && typeof value === "object" ? { id, ...value } : { id, power_entity: value }
      ))
      : [];
  const definitionIds = new Set(LARGE_CONSUMER_DEFINITIONS.map((definition) => definition.id));
  const rawById = new Map();
  rawList.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const fallbackId = item.type || `consumer_${index + 1}`;
    rawById.set(normalizeConsumerConfigId(item.id || item.key || item.type, fallbackId), item);
  });
  const defaultConsumers = LARGE_CONSUMER_DEFINITIONS.map((definition, index) => (
    normalizeLargeConsumerConfig(rawById.get(definition.id) || {}, index, definition)
  ));
  const extraConsumers = rawList
    .map((item, index) => ({ item, id: normalizeConsumerConfigId(item?.id || item?.key || item?.type, `consumer_${index + 1}`) }))
    .filter(({ item, id }) => item && typeof item === "object" && !definitionIds.has(id))
    .map(({ item, id }, index) => normalizeLargeConsumerConfig(item, LARGE_CONSUMER_DEFINITIONS.length + index, LEGACY_LARGE_CONSUMER_DEFINITIONS.get(id)));
  return [...defaultConsumers, ...extraConsumers];
}

function largeConsumerLabel(consumer, index = 0, translate) {
  const configured = String(consumer?.label || "").trim();
  if (configured) return configured;
  const fallback = consumer?.defaultLabel || `Consumer ${index + 1}`;
  if (consumer?.labelKey) return translate?.(consumer.labelKey, {}, fallback) || fallback;
  return translate?.(`consumer.${consumer?.type || consumer?.id}`, {}, fallback) || fallback;
}

function largeConsumerHasEntity(consumer) {
  return Boolean(consumer?.power_entity || consumer?.energy_entity);
}

function largeConsumerPowerEntityId(metricOrConsumer) {
  return metricOrConsumer?.largeConsumer?.power_entity || metricOrConsumer?.power_entity || "";
}

function largeConsumerEnergyEntityId(metricOrConsumer) {
  return metricOrConsumer?.largeConsumer?.energy_entity || metricOrConsumer?.energy_entity || "";
}

function largeConsumerVoltageEntityId(metricOrConsumer) {
  return metricOrConsumer?.largeConsumer?.voltage_entity || metricOrConsumer?.voltage_entity || "";
}

function largeConsumerMetrics(consumers = [], { labelForConsumer } = {}) {
  return consumers
    .filter((consumer) => consumer?.visible !== false && largeConsumerHasEntity(consumer))
    .map((consumer, index) => ({
      key: `large_consumers.${consumer.id || index}`,
      label: typeof labelForConsumer === "function" ? labelForConsumer(consumer, index) : largeConsumerLabel(consumer, index),
      unit: "power",
      color: "blue",
      accentColor: consumer.color,
      largeConsumer: consumer,
      hud: false,
      tileOrder: consumer.position ?? 200 + index,
      tileColumns: consumer.columns ?? 1,
    }))
    .sort((a, b) => (a.tileOrder ?? 0) - (b.tileOrder ?? 0));
}

function largeConsumerPowerWatts(metricOrConsumer, { getValue, getUnit, valueAsWatts } = {}) {
  const entityId = largeConsumerPowerEntityId(metricOrConsumer);
  if (!entityId) return undefined;
  const value = typeof getValue === "function" ? getValue(entityId) : undefined;
  const watts = typeof valueAsWatts === "function" ? valueAsWatts(value, getUnit?.(entityId)) : undefined;
  return Number.isFinite(watts) ? Math.max(0, watts) : undefined;
}

function largeConsumerEntityIds(consumers = []) {
  return consumers.flatMap((consumer) => [consumer.power_entity, consumer.voltage_entity, consumer.energy_entity]).filter(Boolean);
}

function largeConsumerAdvisorDetails(consumers = [], {
  labelForConsumer,
  powerWattsForConsumer,
  parsePowerLimitWatts,
} = {}) {
  return consumers
    .map((consumer, index) => {
      const label = typeof labelForConsumer === "function" ? labelForConsumer(consumer, index) : largeConsumerLabel(consumer, index);
      const watts = typeof powerWattsForConsumer === "function" ? powerWattsForConsumer(consumer) : undefined;
      const maxPowerWatts = typeof parsePowerLimitWatts === "function" ? parsePowerLimitWatts(consumer.max_power_kw, "kw") : undefined;
      return {
        id: consumer.id || `consumer_${index + 1}`,
        label,
        powerEntityId: consumer.power_entity || "",
        energyEntityId: consumer.energy_entity || "",
        watts: Number.isFinite(watts) ? watts : 0,
        maxPowerWatts,
        configured: consumer.visible !== false && largeConsumerHasEntity(consumer),
        active: Number.isFinite(watts) && watts >= 100,
      };
    })
    .filter((consumer) => consumer.configured);
}

const WALLBOX_POWER_KEYS = Object.freeze(["wallbox_power", "wallbox2_power"]);

const UNAVAILABLE_VALUES = Object.freeze(["unknown", "unavailable", "none", "null", "offline"]);

const WALLBOX_ENTITY_KEYS = Object.freeze({
  wallbox_power: Object.freeze({
    phase: "wallbox_phase",
    phaseAction: "wallbox_phase_action",
    phaseRemaining: "wallbox_phase_remaining",
    soc: "wallbox_soc",
    maxSoc: "wallbox_max_soc",
    connected: "wallbox_connected",
    chargingEnabled: "wallbox_charging_enabled",
    remainingTime: "wallbox_remaining_time",
  }),
  wallbox2_power: Object.freeze({
    phase: "wallbox2_phase",
    phaseAction: "wallbox2_phase_action",
    phaseRemaining: "wallbox2_phase_remaining",
    soc: "wallbox2_soc",
    maxSoc: "wallbox2_max_soc",
    connected: "wallbox2_connected",
    chargingEnabled: "wallbox2_charging_enabled",
    remainingTime: "wallbox2_remaining_time",
  }),
});

const WALLBOX_ENTITY_ALIASES = Object.freeze({
  phase: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_phase", "wallbox_phases", "wallbox_power_phase"]),
    wallbox2_power: Object.freeze(["wallbox2_phase", "wallbox2_phases", "wallbox2_power_phase"]),
  }),
  phaseAction: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_phase_action", "wallbox_phase_action_value", "wallbox_power_phase_action"]),
    wallbox2_power: Object.freeze(["wallbox2_phase_action", "wallbox2_phase_action_value", "wallbox2_power_phase_action"]),
  }),
  phaseRemaining: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_phase_remaining", "wallbox_phase_remaining_seconds", "wallbox_power_phase_remaining"]),
    wallbox2_power: Object.freeze(["wallbox2_phase_remaining", "wallbox2_phase_remaining_seconds", "wallbox2_power_phase_remaining"]),
  }),
  soc: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_soc", "wallbox_vehicle_soc", "wallbox_car_soc", "wallbox_power_soc"]),
    wallbox2_power: Object.freeze(["wallbox2_soc", "wallbox2_vehicle_soc", "wallbox2_car_soc", "wallbox2_power_soc"]),
  }),
  maxSoc: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_max_soc", "wallbox_target_soc", "wallbox_soc_limit", "wallbox_charge_limit", "wallbox_vehicle_max_soc", "wallbox_car_max_soc"]),
    wallbox2_power: Object.freeze(["wallbox2_max_soc", "wallbox2_target_soc", "wallbox2_soc_limit", "wallbox2_charge_limit", "wallbox2_vehicle_max_soc", "wallbox2_car_max_soc"]),
  }),
  connected: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_connected", "wallbox_plugged_in", "wallbox_vehicle_connected", "wallbox_car_connected", "wallbox_cable_connected"]),
    wallbox2_power: Object.freeze(["wallbox2_connected", "wallbox2_plugged_in", "wallbox2_vehicle_connected", "wallbox2_car_connected", "wallbox2_cable_connected"]),
  }),
  chargingEnabled: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_charging_enabled", "wallbox_charge_enabled", "wallbox_charging_allowed", "wallbox_enable_charging", "wallbox_charger_enabled"]),
    wallbox2_power: Object.freeze(["wallbox2_charging_enabled", "wallbox2_charge_enabled", "wallbox2_charging_allowed", "wallbox2_enable_charging", "wallbox2_charger_enabled"]),
  }),
  remainingTime: Object.freeze({
    wallbox_power: Object.freeze(["wallbox_remaining_time", "wallbox_charge_time", "wallbox_charging_time_left", "wallbox_power_remaining_time"]),
    wallbox2_power: Object.freeze(["wallbox2_remaining_time", "wallbox2_charge_time", "wallbox2_charging_time_left", "wallbox2_power_remaining_time"]),
  }),
});

function wallboxMetricKey(metric) {
  return typeof metric === "string" ? metric : metric?.key || "";
}

function normalizedWallboxText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isUnavailableWallboxValue(value) {
  const normalized = normalizedWallboxText(value);
  return !normalized || UNAVAILABLE_VALUES.includes(normalized);
}

function adjacentWallboxPosition(basePosition = {}) {
  const baseLeft = Number(basePosition.left);
  const baseTop = Number(basePosition.top);
  const left = Number.isFinite(baseLeft) ? baseLeft : 50;
  const top = Number.isFinite(baseTop) ? baseTop : 50;
  const direction = left > 84 ? -1 : 1;
  return {
    left: Math.min(96, Math.max(4, left + direction * 9)),
    top: Math.min(96, Math.max(4, top)),
  };
}

function wallboxEntityKey(metric, kind) {
  return WALLBOX_ENTITY_KEYS[wallboxMetricKey(metric)]?.[kind] || "";
}

function wallboxEntityId(config = {}, metric, kind) {
  const key = wallboxMetricKey(metric);
  const aliases = WALLBOX_ENTITY_ALIASES[kind]?.[key] || [];
  return aliases.map((alias) => config.entities?.[alias]).find(Boolean) || "";
}

function wallboxPhaseEntityKey(metric) {
  return wallboxEntityKey(metric, "phase");
}

function wallboxPhaseEntityId(config, metric) {
  return wallboxEntityId(config, metric, "phase");
}

function wallboxPhaseActionEntityKey(metric) {
  return wallboxEntityKey(metric, "phaseAction");
}

function wallboxPhaseActionEntityId(config, metric) {
  return wallboxEntityId(config, metric, "phaseAction");
}

function wallboxPhaseRemainingEntityKey(metric) {
  return wallboxEntityKey(metric, "phaseRemaining");
}

function wallboxPhaseRemainingEntityId(config, metric) {
  return wallboxEntityId(config, metric, "phaseRemaining");
}

function wallboxSocEntityKey(metric) {
  return wallboxEntityKey(metric, "soc");
}

function wallboxSocEntityId(config, metric) {
  return wallboxEntityId(config, metric, "soc");
}

function wallboxMaxSocEntityKey(metric) {
  return wallboxEntityKey(metric, "maxSoc");
}

function wallboxMaxSocEntityId(config, metric) {
  return wallboxEntityId(config, metric, "maxSoc");
}

function wallboxConnectedEntityKey(metric) {
  return wallboxEntityKey(metric, "connected");
}

function wallboxConnectedEntityId(config, metric) {
  return wallboxEntityId(config, metric, "connected");
}

function wallboxChargingEnabledEntityKey(metric) {
  return wallboxEntityKey(metric, "chargingEnabled");
}

function wallboxChargingEnabledEntityId(config, metric) {
  return wallboxEntityId(config, metric, "chargingEnabled");
}

function wallboxRemainingTimeEntityKey(metric) {
  return wallboxEntityKey(metric, "remainingTime");
}

function wallboxRemainingTimeEntityId(config, metric) {
  return wallboxEntityId(config, metric, "remainingTime");
}

function numericPercentValue(rawValue) {
  if (isUnavailableWallboxValue(rawValue)) return undefined;
  const numericValue = Number(String(rawValue).replace(",", ".").replace("%", ""));
  if (!Number.isFinite(numericValue)) return undefined;
  return Math.max(0, Math.min(100, numericValue));
}

function wallboxPhaseLabel(rawValue, translate) {
  const normalized = normalizedWallboxText(rawValue);
  if (isUnavailableWallboxValue(rawValue)) return "";
  if (["auto", "automatic", "automatisch"].includes(normalized)) {
    return translate?.("phase.auto", {}, "Auto") || "Auto";
  }
  const numberMatch = normalized.match(/\b([123])\b/) || normalized.match(/^([123])\s*(?:p|phase|phasen|fazy|fases)?$/);
  const phaseCount = numberMatch ? Number(numberMatch[1]) : Number(normalized);
  if (phaseCount === 1) return translate?.("phase.one", {}, "1 phase") || "1 phase";
  if (phaseCount === 2 || phaseCount === 3) {
    return translate?.("phase.many", { count: phaseCount }, `${phaseCount} phases`) || `${phaseCount} phases`;
  }
  return String(rawValue).trim();
}

function stateAsBoolean(rawValue) {
  const normalized = String(rawValue ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized || UNAVAILABLE_VALUES.includes(normalized)) return undefined;
  if (["on", "true", "1", "yes", "ja", "connected", "plugged", "plugged_in", "home", "enabled", "active", "ready", "verbunden", "eingesteckt", "angeschlossen", "freigegeben", "aktiviert"].includes(normalized)) return true;
  if (["off", "false", "0", "no", "nein", "disconnected", "unplugged", "not_connected", "away", "disabled", "inactive", "nicht_verbunden", "ausgesteckt", "getrennt", "gesperrt", "deaktiviert"].includes(normalized)) return false;
  return undefined;
}

function wallboxBooleanEntityState(entityId, { getValue, getState } = {}) {
  if (!entityId) return undefined;
  const direct = stateAsBoolean(getValue?.(entityId));
  if (direct !== undefined) return direct;
  return stateAsBoolean(getState?.(entityId)?.state);
}

function wallboxSocLabel(rawValue, entityUnit = "") {
  if (isUnavailableWallboxValue(rawValue)) return "";
  const numericValue = Number(String(rawValue).replace(",", "."));
  const value = Number.isFinite(numericValue)
    ? `${Math.round(Math.max(0, Math.min(100, numericValue)))}%`
    : `${String(rawValue).trim()}${entityUnit && !String(rawValue).includes(entityUnit) ? ` ${entityUnit}` : ""}`;
  return `Auto ${value}`;
}

function wallboxPhaseActionText(rawValue) {
  const raw = String(rawValue ?? "").trim();
  const normalized = raw.toLowerCase();
  if (!normalized || [...UNAVAILABLE_VALUES, "-keine-", "keine", "no action"].includes(normalized)) return "";
  return raw;
}

function wallboxPhaseRemainingSeconds(rawValue, entityUnit = "", numericParser = Number) {
  const value = typeof numericParser === "function" ? numericParser(rawValue) : Number(rawValue);
  if (!Number.isFinite(value)) return undefined;
  const unit = String(entityUnit || "").trim().toLowerCase();
  if (unit.includes("h") || unit.includes("std") || unit.includes("hour") || unit.includes("stunde")) return value * 3600;
  if (unit.includes("min") || unit === "m") return value * 60;
  return value;
}

function wallboxPhaseActionInfo({
  action,
  seconds,
  actionEntityId = "",
  remainingEntityId = "",
  formatDurationSeconds,
  translate,
} = {}) {
  if (!action) return undefined;
  const duration = Number.isFinite(seconds) && typeof formatDurationSeconds === "function"
    ? formatDurationSeconds(seconds)
    : "";
  return {
    action,
    seconds,
    duration,
    actionEntityId,
    remainingEntityId,
    label: duration
      ? translate?.("value.phaseChangeIn", { action, duration }, `${action} in ${duration}`) || `${action} in ${duration}`
      : action,
  };
}

function wallboxIsCharging(metric, {
  config = {},
  getValue,
  getUnit,
  valueAsWatts,
  clampNumber,
} = {}) {
  const entityId = config.entities?.[wallboxMetricKey(metric)];
  if (!entityId) return false;
  const watts = valueAsWatts?.(getValue?.(entityId), getUnit?.(entityId));
  const threshold = clampNumber?.(config.wallbox_charging_threshold, 25, 0, 1000000) ?? 25;
  return Number.isFinite(watts) && watts > threshold;
}

function wallboxRemainingTimeLabel({
  isCharging,
  rawValue,
  entityUnit = "",
  formatRemainingChargeTimeValue,
  translate,
} = {}) {
  if (!isCharging) return "";
  const value = formatRemainingChargeTimeValue?.(rawValue, entityUnit);
  return value ? translate?.("value.remainingChargeTime", { value }, `${value} left`) || `${value} left` : "";
}

function wallboxAdvisorDetails(keys = WALLBOX_POWER_KEYS, {
  metricForKey,
  entityForKey,
  positiveWattsForKey,
  socEntityIdForMetric,
  maxSocEntityIdForMetric,
  percentFromEntity,
  entityLastChangedMs,
  trackedConditionMinutes,
  metricLabel,
  phaseActionInfoForMetric,
  connectedStateForMetric,
  chargingEnabledStateForMetric,
} = {}) {
  return keys
    .map((key) => {
      const metric = metricForKey?.(key) || { key, label: key, unit: "power" };
      const entityId = entityForKey?.(key) || "";
      const watts = positiveWattsForKey?.(key);
      const socEntityId = socEntityIdForMetric?.(metric) || "";
      const maxSocEntityId = maxSocEntityIdForMetric?.(metric) || "";
      const socPercent = percentFromEntity?.(socEntityId);
      const maxSocPercent = percentFromEntity?.(maxSocEntityId);
      const socLastChangedMs = entityLastChangedMs?.(socEntityId);
      const socAbove80Minutes = trackedConditionMinutes?.(
        `${key}:soc-above-80`,
        Number.isFinite(socPercent) && socPercent > 80,
        socLastChangedMs,
      );
      const socAbove90Minutes = trackedConditionMinutes?.(
        `${key}:soc-above-90`,
        Number.isFinite(socPercent) && socPercent > 90,
        socLastChangedMs,
      );
      return {
        key,
        metric,
        entityId,
        socEntityId,
        maxSocEntityId,
        hasPowerEntity: Boolean(entityId),
        label: metricLabel?.(metric) || metric.label || key,
        watts: Number.isFinite(watts) ? watts : 0,
        phaseAction: phaseActionInfoForMetric?.(metric),
        socPercent,
        maxSocPercent,
        socAbove80Minutes,
        socAbove90Minutes,
        targetReached: Number.isFinite(socPercent) && Number.isFinite(maxSocPercent) && socPercent >= maxSocPercent - 0.5,
        connected: connectedStateForMetric?.(metric),
        chargingEnabled: chargingEnabledStateForMetric?.(metric),
      };
    })
    .filter((wallbox) => wallbox.hasPowerEntity);
}

const CARD_TYPE = "ha-solar-dashboard-card";
const CARD_EDITOR_TYPE = "ha-solar-dashboard-card-editor";
const REPOSITORY_IMAGE_BASE =
  "https://raw.githubusercontent.com/404GamerNotFound/ha-solar-dashboard/main/images";

const ENERGY_RANGE_OPTIONS = [
  { key: "live", labelKey: "range.live", label: "Live" },
  { key: "1h", labelKey: "range.1h", label: "1h" },
  { key: "24h", labelKey: "range.24h", label: "24h" },
  { key: "month", labelKey: "range.month", label: "1 month" },
  { key: "year", labelKey: "range.year", label: "1 year" },
  { key: "total", labelKey: "range.total", label: "Total" },
];

const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["en", "de", "es", "fr", "pl"];
const I18N = {
  "en": {
    "aria.energyRangeSelector": "Select value range",
    "aria.houseSelector": "Select house",
    "aria.viewSelector": "Select dashboard view",
    "card.defaultTitle": "Energy Flow",
    "advisor.action": "Action",
    "advisor.autarky": "Autarky",
    "advisor.actionHiddenToday": "Hidden for today",
    "advisor.batteryIdle": "Battery is not charging while surplus is exported. Check battery limits or charge mode.",
    "advisor.batteryHighSocLong": "House battery has been between 90 and 100% for more than 120 minutes. Batteries should not stay that full for too long.",
    "advisor.batteryCyclesHigh": "House battery has completed several full cycles today. Frequent cycling can age the battery faster.",
    "advisor.batteryDeepSoc": "House battery SoC is very low. Protect the reserve and avoid additional flexible loads.",
    "advisor.batteryLow": "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible.",
    "advisor.batteryMaxReached": "Battery is at the configured max SoC. Additional PV is likely to be exported.",
    "advisor.batteryNearlyFull": "Battery is nearly full, so additional PV is likely to be exported.",
    "advisor.batteryReserveDischarging": "Battery is at or below reserve SoC and still discharging. Check min SoC or backup reserve settings.",
    "advisor.batteryStatus": "Battery",
    "advisor.batteryTemperatureHigh": "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits.",
    "advisor.batteryTemperatureLow": "House battery temperature is low. Charging power may be limited and battery stress can increase.",
    "advisor.checkSensors": "Check unavailable or missing sensors so the energy balance stays reliable.",
    "advisor.configureConsumption": "Add a house consumption sensor to improve autarky and load analysis.",
    "advisor.configureGrid": "Add grid import/export sensors for better advice about surplus and grid draw.",
    "advisor.configurePvTotal": "Add PV total power or roof/shed PV sensors to improve production analysis.",
    "advisor.consumption": "Load",
    "advisor.detailEntities": "Entities",
    "advisor.detailEntityValue": "{entity} currently reports {value} for {label}. {impact}",
    "advisor.detailIntro": "The Advisor shows this as {priority} for {window}, because {reason}",
    "advisor.detailSignals": "Decision signals",
    "advisor.detailSources": "Data sources",
    "advisor.detailValues": "Values",
    "advisor.detailValueOnly": "{label} is currently {value}. {impact}",
    "advisor.detailWhy": "Why this appears",
    "advisor.detailsToggle": "Show details",
    "advisor.dismissToday": "Hide today",
    "advisor.evChargingGrid": "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended.",
    "advisor.evChargingPv": "EV charging is currently covered well by PV or stored energy.",
    "advisor.evEnableCharging": "Charging is currently disabled. Enable charging if you want to use the PV surplus.",
    "advisor.evPlugIn": "Plug in the vehicle to use PV surplus for charging.",
    "advisor.evPhaseChangeScheduled": "{action} in {duration} if the PV situation does not change.",
    "advisor.evSocAbove80Long": "Vehicle SoC is above 80% for more than 120 minutes. This can stress the battery if it stays there too long.",
    "advisor.evSocAbove90Long": "Vehicle SoC is above 90% for more than 60 minutes. Stop charging or lower the target SoC if the car will stay parked.",
    "advisor.evTargetReached": "Vehicle is already at the configured target SoC. Use surplus for another flexible load.",
    "advisor.evTargetReachedGrid": "Vehicle is at target SoC while the charger is still drawing power. Check the charge limit or stop charging.",
    "advisor.exporting": "Exporting surplus",
    "advisor.grid": "Grid",
    "advisor.gridImportExportSimultaneous": "Import and export sensors report power at the same time. Check whether the split grid sensors are mapped correctly.",
    "advisor.gridImportFullBattery": "Grid import is high although the house battery is full. Check discharge limits, backup reserve, or battery mode.",
    "advisor.headlineExport": "PV surplus is available",
    "advisor.headlineImport": "Grid import is active",
    "advisor.headlineInfo": "Information available",
    "advisor.headlineNeutral": "Energy flow is balanced",
    "advisor.headlineSetup": "More sensors unlock better advice",
    "advisor.headlineWarning": "Energy setup needs attention",
    "advisor.highLoad": "Current load is high compared with PV production. Check large consumers if this is unexpected.",
    "advisor.importing": "Importing",
    "advisor.priorityCritical": "Critical",
    "advisor.priorityInfo": "Info",
    "advisor.priorityOpportunity": "Chance",
    "advisor.prioritySetup": "Setup",
    "advisor.prioritySuccess": "OK",
    "advisor.priorityWarning": "Warning",
    "advisor.electricityPrice": "Electricity price",
    "advisor.lowPv": "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors.",
    "advisor.noAdvice": "No urgent action right now.",
    "advisor.appliances": "Appliances",
    "advisor.largeConsumerCovered": "Large consumers are running without relevant grid import.",
    "advisor.largeConsumerGrid": "{names} currently draw power while grid import is active. Shift them to PV surplus if possible.",
    "advisor.largeConsumerSurplus": "PV surplus can cover {names}. Start a ready large consumer while export is active.",
    "advisor.panelTitle": "Energy Advisor",
    "advisor.pv": "PV",
    "advisor.recommendations": "Recommendations",
    "advisor.runAppliance": "Run a flexible household appliance now if it is waiting.",
    "advisor.sensorStaleMany": "{count} sensors have not updated recently. Check entity availability and recorder/update intervals.",
    "advisor.sensorStaleOne": "{name} has not updated for {duration}. Check entity availability and update interval.",
    "advisor.sensors": "Sensors",
    "advisor.selfConsumption": "Self-use",
    "advisor.selfSufficient": "Self-sufficient",
    "advisor.startEvCharging": "Start or increase EV charging while surplus is available.",
    "advisor.status": "Status",
    "advisor.suggestionCountOne": "{count} suggestion",
    "advisor.suggestionCount": "{count} suggestions",
    "advisor.surplus": "Surplus",
    "advisor.surplusGeneral": "PV surplus is available. Prioritize flexible loads while export is active.",
    "advisor.unknown": "Unknown",
    "advisor.useHeatPump": "Use heat pump boost or preheat hot water while PV surplus is available.",
    "advisor.wallbox": "EV",
    "advisor.weather": "Weather",
    "advisor.windowAnytime": "Anytime",
    "advisor.windowNext2h": "Next 2h",
    "advisor.windowNow": "Now",
    "advisor.reasonBattery": "Battery SoC {soc} is part of this recommendation.",
    "advisor.reasonEvSurplus": "PV surplus is above the configured EV threshold of {threshold}.",
    "advisor.reasonGridImport": "Grid import is above the configured import threshold of {threshold}.",
    "advisor.reasonLargeConsumer": "The available PV surplus can cover the configured consumer limit.",
    "advisor.reasonPhaseChange": "EVCC reports a planned phase change inside the next window.",
    "advisor.reasonSensor": "A configured entity is stale, unavailable, or inconsistent.",
    "advisor.reasonSurplus": "PV surplus is above the configured surplus threshold of {threshold}.",
    "advisor.reasonWeather": "Weather is included to separate low PV from expected conditions.",
    "advisor.reasonPrice": "The configured electricity price sensor is included in the decision context.",
    "advisor.impactAutarky": "That shows how independently the house is currently being supplied.",
    "advisor.impactBattery": "That value describes the current battery reserve and influences whether flexible loads are sensible right now.",
    "advisor.impactConsumer": "That value shows whether this consumer is active and how strongly it affects the energy balance.",
    "advisor.impactGrid": "That value decides whether the situation is treated as grid import, neutral, or PV surplus.",
    "advisor.impactLoad": "That value describes the current household load and helps classify whether consumption is unusually high.",
    "advisor.impactPv": "That value describes the current PV production and helps estimate how much energy is available.",
    "advisor.impactSelfConsumption": "That shows how much PV energy is being used locally instead of being exported.",
    "advisor.impactSensor": "That value is used as a diagnostic signal for sensor freshness and plausibility.",
    "advisor.impactSurplus": "That value shows how much power is currently available for flexible loads before it is exported.",
    "advisor.impactTemperature": "That value is used to detect possible battery stress or operating limits.",
    "advisor.impactWallbox": "That value describes the charger state and determines whether charging should start, stop, or wait.",
    "editor.showViewSelector": "Show view selector",
    "chart.close": "Close",
    "chart.empty": "No history data found",
    "chart.error": "History could not be loaded",
    "chart.loading": "Loading history…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Last {hours} hours",
    "charts.count": "{count} charts",
    "charts.countOne": "{count} chart",
    "charts.empty": "No chartable entities configured yet.",
    "charts.label": "Charts",
    "charts.openLarge": "Open large chart",
    "charts.sectionPvStrings": "PV strings",
    "charts.sectionInverters": "Inverters",
    "charts.sectionSystem": "Inverter and system",
    "charts.sectionWallbox": "Wallbox",
    "charts.title": "Entity history",
    "editor.customDayImage": "Custom Day Image",
    "editor.customImage": "Custom Image",
    "editor.batteryChargeEntity": "Battery charge entity",
    "editor.batteryCyclesTodayEntity": "Battery cycles today entity",
    "editor.batteryDischargeEntity": "Battery discharge entity",
    "editor.batteryFlowEntity": "Battery flow entity (+/-)",
    "editor.batteryMaxSocEntity": "Battery max SoC entity",
    "editor.batteryMinSocEntity": "Battery min SoC entity",
    "editor.batteryTemperatureEntity": "Battery temperature entity",
    "editor.entity": "Entity",
    "editor.entityPlaceholder": "{label} entity",
    "editor.energy1hEntity": "1h kWh entity",
    "editor.energy24hEntity": "24h kWh entity",
    "editor.energyCounterEntity": "Energy history counter",
    "editor.energyMonthEntity": "1 month kWh entity",
    "editor.energyRangeOverride": "Optional direct period sensors",
    "editor.energyYearEntity": "1 year kWh entity",
    "editor.energyTotalEntity": "Total kWh entity",
    "editor.liveEntity": "Live sensor",
    "editor.houseType": "House Type",
    "editor.hudBoxOpacity": "HUD box opacity",
    "editor.hudBoxScale": "HUD box scale",
    "editor.advisorEvSurplusThreshold": "EV surplus threshold (W)",
    "editor.electricityPriceEntity": "Electricity price sensor",
    "editor.gridVoltageCriticalThreshold": "Critical grid voltage (V)",
    "editor.gridVoltageWarningThreshold": "High grid voltage (V)",
    "editor.importExportEntity": "Import/export sensor",
    "editor.importExportSignedEntity": "Signed import/export sensor (+/-)",
    "editor.importPowerEntity": "Import sensor",
    "editor.exportPowerEntity": "Export sensor",
    "editor.importExportLabels": "Import/Export labels",
    "editor.importLabel": "Import label",
    "editor.exportLabel": "Export label",
    "editor.neutralLabel": "Self-sufficient label",
    "editor.environmentAdd": "Add tile",
    "editor.environmentEntity": "Sensor entity",
    "editor.environmentLabel": "Sensor label",
    "editor.environmentShow": "Show {label} tile",
    "editor.environmentShowFooter": "Show box in footer",
    "editor.environmentShowImage": "Show box in image",
    "editor.environmentTemplates": "Environment templates",
    "editor.environmentUnit": "Display unit",
    "editor.kpiAdd": "Add tile",
    "editor.kpiColor": "Color",
    "editor.kpiColumns": "Tile width",
    "editor.kpiEntity": "KPI sensor",
    "editor.kpiLabel": "KPI label",
    "editor.kpiPosition": "Footer order",
    "editor.kpiRemove": "Remove",
    "editor.kpiStaticValue": "Static value",
    "editor.consumerEnergyEntity": "Energy history counter",
    "editor.consumerLabel": "Device name",
    "editor.consumerAddCustom": "Add custom large consumer",
    "editor.consumerPowerEntity": "Power sensor",
    "editor.consumerShow": "Show {label} tile",
    "editor.labelHideDesktop": "Hide on desktop",
    "editor.labelHideMobile": "Hide on phones",
    "editor.labelOptions": "Label display",
    "editor.labelShowFooter": "Show label in footer KPIs",
    "editor.labelShowImage": "Show label in image",
    "editor.maxPowerKw": "Expected max power (kW/kWp)",
    "editor.optionalDayImage": "Optional daylight image",
    "editor.powerDecimals": "Power decimals",
    "editor.powerDisplayMode": "Power display mode",
    "editor.rawMode": "Raw value + configured unit",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.advisorMaxSuggestions": "Advisor suggestions",
    "editor.overlayEnable": "Show {label}",
    "editor.overlayLabel": "Label",
    "editor.overlayOrientation": "Orientation",
    "editor.overlayOrientationLeft": "Left side",
    "editor.overlayOrientationRight": "Right side",
    "editor.overlayPeriod": "Period",
    "editor.overlaySize": "Size",
    "editor.period1h": "1 hour",
    "editor.period24h": "24 hours",
    "editor.period30m": "30 minutes",
    "editor.phaseActionEntity": "Upcoming phase action entity",
    "editor.phaseEntity": "Phase entity",
    "editor.phaseRemainingEntity": "Phase action remaining seconds entity",
    "editor.pvForecastTodayEntity": "Forecast today entity",
    "editor.pvLabels": "PV labels",
    "editor.pvPeakTodayEntity": "Peak today entity",
    "editor.pvPowerLabel": "Power label",
    "editor.pvRoofStringAdd": "Add string",
    "editor.pvRoofStringDisplay": "Roof PV string display",
    "editor.pvRoofStringDisplayDominant": "Highest string large, others small",
    "editor.pvRoofStringDisplaySum": "Sum strings",
    "editor.pvRoofStringDisplayValues": "Show string values",
    "editor.pvRoofStringEnergyEntity": "String kWh counter entity",
    "editor.pvRoofStringLabel": "String name",
    "editor.pvRoofStringPowerEntity": "String power entity",
    "editor.pvRoofStrings": "Roof PV strings",
    "editor.inverterAdd": "Add inverter",
    "editor.inverterDisplay": "Inverter display",
    "editor.inverterDisplayDominant": "Highest inverter large, others small",
    "editor.inverterDisplaySum": "Sum inverters",
    "editor.inverterDisplayValues": "Show inverter values",
    "editor.inverterEnergyEntity": "Inverter kWh counter entity",
    "editor.inverterLabel": "Inverter name",
    "editor.inverterPowerEntity": "Inverter power entity",
    "editor.inverters": "Inverters",
    "editor.pvTodayEnergyEntity": "Generated today entity",
    "editor.remainingChargeTimeEntity": "Remaining charge time entity",
    "editor.vehicleChargingEnabledEntity": "Charging enabled entity",
    "editor.vehicleConnectedEntity": "Vehicle connected entity",
    "editor.vehicleMaxSocEntity": "Vehicle max/target SoC entity",
    "editor.vehicleSocEntity": "Vehicle SoC entity",
    "editor.sectionBoxes": "Energy boxes",
    "editor.sectionAdvisor": "Advisor and prices",
    "editor.sectionAppearance": "Display and limits",
    "editor.sectionGeneral": "General settings",
    "editor.sectionKpis": "Custom KPI tiles",
    "editor.sectionEnvironmentSensors": "Environment sensors",
    "editor.sectionLargeConsumers": "Additional large consumers",
    "editor.sectionOverlays": "Image overlays",
    "editor.showBox": "Show {label}",
    "editor.showEnergyRangeSelector": "Show Live/1h/24h/month/year/total selector",
    "editor.showHouseSelector": "Show house selector",
    "editor.showEnvironmentSensors": "Show environment sensor tiles",
    "editor.showLargeConsumers": "Show large consumers in house view",
    "editor.showGridStatusTile": "Show grid status tile",
    "editor.showMetricTiles": "Show metric boxes below image",
    "editor.showPowerFlows": "Show animated power flows",
    "editor.showStatusLabel": "Show image status label",
    "editor.showTitle": "Show title",
    "editor.showWeatherStatus": "Show current weather in status label",
    "editor.title": "Title",
    "editor.tabSetup": "Setup",
    "editor.tabEnergy": "Energy",
    "editor.tabDevices": "Devices",
    "editor.tabEnvironment": "Environment",
    "editor.tabFloorplan": "Floorplan",
    "editor.tabLayout": "Layout",
    "editor.tabAppearance": "Appearance",
    "editor.tabAdvisor": "Advisor",
    "editor.tabAdvanced": "Advanced",
    "editor.tabs": "Configuration sections",
    "editor.statusConfigured": "{configured}/{total} configured",
    "editor.statusConfiguredCount": "{count} configured",
    "editor.statusHidden": "{count} hidden",
    "editor.statusMissing": "{count} missing",
    "editor.statusAdvanced": "Advanced active",
    "editor.statusReady": "Ready",
    "editor.layoutMode": "Layout mode",
    "editor.layoutHelp": "Click a box in the preview, then adjust its X/Y position.",
    "editor.layoutSelected": "Selected box",
    "editor.layoutEmpty": "Enable image boxes or overlays to edit their positions here.",
    "editor.layoutTypeBox": "Box",
    "editor.layoutTypeOverlay": "Overlay",
    "editor.layoutTypeEnvironment": "Environment",
    "editor.sectionFloorplan": "Floorplan editor",
    "editor.floorplanHelp": "Choose a tool, click the grid to place it, then refine the selected element.",
    "editor.floorplanShowGrid": "Show grid",
    "editor.floorplanTools": "Floorplan tools",
    "editor.floorplanToolRoom": "Room",
    "editor.floorplanToolWall": "Wall",
    "editor.floorplanToolSensor": "Sensor",
    "editor.floorplanSelected": "Selected element",
    "editor.floorplanLabel": "Label",
    "editor.floorplanWidth": "Width",
    "editor.floorplanHeight": "Height",
    "editor.floorplanDelete": "Delete selected",
    "editor.floorplanCustomEntity": "Custom entity",
    "editor.floorplanSensorSource": "Sensor source",
    "editor.floorplanEntity": "Entity",
    "editor.floorplanEmpty": "Click the grid to create the selected element.",
    "editor.helpHomeAssistantSensor": "Choose the Home Assistant entity that provides this value.",
    "editor.helpUnitAuto": "Use Auto to display the unit reported by the Home Assistant entity. Choose another value only when you want to override it.",
    "editor.helpEnergyCounter": "Optional cumulative energy counter used for 1h, 24h, month, year, and total views.",
    "editor.helpSignedGrid": "Use one sensor where positive values mean grid import and negative values mean export. Leave it empty when using separate import and export sensors.",
    "editor.helpSignedBattery": "Use one signed sensor when possible: positive means charging, negative means discharging.",
    "editor.helpFooterOrder": "Controls the order of tiles below the image. Lower numbers appear earlier.",
    "editor.helpTileWidth": "Controls how wide the footer tile is on desktop. Mobile width is capped automatically.",
    "editor.helpImagePosition": "Position of the box on the house image in percent.",
    "editor.helpEnvironmentFooter": "Shows this sensor as a tile in the Environment section below the image.",
    "editor.helpEnvironmentImage": "Shows this sensor as a scalable HUD box on the house image.",
    "editor.helpMaxPower": "Used only for the utilization bar and Advisor load checks.",
    "editor.unit": "Display unit",
    "editor.voltageEntity": "Voltage sensor",
    "editor.voltageEntityL1": "Voltage L1 sensor",
    "editor.voltageEntityL2": "Voltage L2 sensor",
    "editor.voltageEntityL3": "Voltage L3 sensor",
    "editor.viewMode": "Default view",
    "editor.weatherEntity": "Weather Entity",
    "editor.setupWizard": "Setup wizard",
    "editor.setupIntro": "Helps with the first setup by suggesting sensors for PV, battery, inverter, EV charger, grid, consumption, weather, and kWh counters.",
    "editor.setupHelp": "Review the suggestions before applying them. Use \"Fill empty fields\" for a safe first pass or \"Replace detected fields\" when you want to overwrite existing detected assignments.",
    "editor.setupEntityCount": "{count} entities available",
    "editor.setupNoEntities": "Open this editor in Home Assistant so entities can be detected.",
    "editor.setupFillEmpty": "Fill empty fields",
    "editor.setupReplaceAll": "Replace detected fields",
    "editor.setupSuggestions": "Detected suggestions",
    "editor.setupNoSuggestions": "No strong entity matches found yet.",
    "editor.setupApplyOne": "Use",
    "editor.setupCurrent": "Current",
    "editor.setupSuggested": "Suggested",
    "editor.setupConfidence": "{score}% match",
    "editor.setupApplied": "Applied {count} suggestion(s).",
    "editor.setupApplyNone": "No empty fields were changed.",
    "editor.xPosition": "X Position",
    "editor.yPosition": "Y Position",
    "flow.charge": "Incoming",
    "flow.discharge": "Outgoing",
    "consumer.custom": "Custom",
    "consumer.customLarge": "Custom large consumer",
    "consumer.dhw_heatpump": "Domestic hot water heat pump",
    "consumer.dishwasher": "Dishwasher",
    "consumer.dryer": "Dryer",
    "consumer.sectionTitle": "Additional Large Consumers",
    "consumer.space_heater": "Fan heater",
    "consumer.washing_machine": "Washing machine",
    "environment.sectionTitle": "Environment",
    "environment.sensor": "Environment {index}",
    "environment.templateIndoor": "Indoor temperature",
    "environment.templateOutdoor": "Outdoor temperature",
    "environment.templateHotWater": "Hot water",
    "environment.templatePressure": "Pressure",
    "environment.templateAirQuality": "Air quality",
    "environment.templateCustom": "Custom",
    "floorplan.counts": "{rooms} rooms · {sensors} sensors",
    "floorplan.empty": "Create rooms, walls, and sensors in the card editor.",
    "floorplan.label": "Floorplan",
    "floorplan.room": "Room {index}",
    "floorplan.sensor": "Sensor {index}",
    "floorplan.title": "Home floorplan",
    "floorplan.wall": "Wall {index}",
    "house.apartment_building": "Apartment Building",
    "house.apartment_building_balcony_solar": "Apartment Building Balcony Solar",
    "house.bungalow": "Bungalow",
    "house.city_villa": "City Villa",
    "house.city_villa_pitched_roof": "City Villa with Pitched Roof",
    "house.duplex_house": "Duplex House",
    "house.single_family_home": "Single Family Home",
    "house.terraced_middle_house": "Terraced Middle House",
    "metrics.battery_level": "Battery",
    "metrics.grid_status": "Grid",
    "metrics.house_consumption_power": "Consumption",
    "metrics.import_export_power": "Import/Export",
    "metrics.inverter_power": "Inverter",
    "metrics.pv_power": "PV Power",
    "metrics.pv_roof_power": "Roof PV",
    "metrics.pv_shed_power": "Shed PV",
    "metrics.pv_total_power": "PV Total",
    "metrics.water_meter": "Water",
    "metrics.wallbox_power": "EV Charger",
    "metrics.wallbox2_power": "EV Charger 2",
    "overlay.heatpump": "Heat pump",
    "overlay.smoke": "Gas",
    "phase.auto": "Auto",
    "phase.many": "{count} phases",
    "phase.one": "1 phase",
    "pvLabel.forecastToday": "Forecast today",
    "pvLabel.peakToday": "Peak today",
    "pvLabel.power": "Power",
    "pvLabel.todayEnergy": "Generated today",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Live",
    "range.month": "1 month",
    "range.total": "Total",
    "range.year": "1 year",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Last updated: {time}",
    "status.selfSufficient": "Self-sufficient",
    "status.weather": "Weather: {weather}",
    "tooltip.entity": "Entity",
    "tooltip.flow": "Flow",
    "tooltip.load": "Utilization",
    "tooltip.max": "Maximum",
    "tooltip.phases": "Phases",
    "tooltip.phaseChange": "Upcoming phase change",
    "tooltip.raw": "Raw value",
    "tooltip.remainingChargeTime": "Remaining charge time",
    "tooltip.status": "Status",
    "tooltip.temperature": "Temperature",
    "tooltip.updated": "Updated",
    "tooltip.value": "Value",
    "tooltip.vehicleSoc": "Vehicle SoC",
    "tooltip.voltage": "Voltage",
    "value.remainingChargeTime": "{value} left",
    "value.phaseChangeIn": "{action} in {duration}",
    "value.temperature": "Temp {value}",
    "value.soon": "soon",
    "view.advisor": "Advisor Dashboard",
    "view.house": "House View",
    "view.floorplan": "Floorplan",
    "view.charts": "Charts",
    "weather.clear": "Clear",
    "weather.clear-night": "Clear",
    "weather.cloudy": "Cloudy",
    "weather.fog": "Fog",
    "weather.hail": "Hail",
    "weather.lightning": "Thunderstorm",
    "weather.lightning-rainy": "Thunderstorm rain",
    "weather.partlycloudy": "Partly cloudy",
    "weather.pouring": "Pouring",
    "weather.rainy": "Rainy",
    "weather.snowy": "Snowy",
    "weather.snowy-rainy": "Sleet",
    "weather.sunny": "Sunny",
    "weather.windy": "Windy",
    "weather.windy-variant": "Windy/cloudy",
    "warning.batteryLow": "Battery low",
    "warning.gridVoltageCritical": "Grid voltage much too high",
    "warning.gridVoltageHigh": "High grid voltage",
    "warning.sensorMissing": "Entity not found",
    "warning.sensorOffline": "Sensor offline",
    "warning.sensorUnavailable": "Sensor unavailable",
    "view.records": "Records",
    "records.count": "{count} records",
    "records.countOne": "{count} record",
    "records.days": "{days} days",
    "records.empty": "No recordable history found yet.",
    "records.error": "Records could not be loaded.",
    "records.label": "High scores",
    "records.loadingCount": "{count} entities",
    "records.loadingCountOne": "{count} entity",
    "records.loadingPurposeConsumerPower": "Consumption peak",
    "records.loadingPurposeCounter": "Daily meter increase",
    "records.loadingPurposePower": "Power peak",
    "records.loadingPurposePvEnergy": "Daily PV yield",
    "records.loadingPurposePvPower": "PV power and solar hours",
    "records.loadingPurposeWallboxChargingEnabled": "Wallbox charging enabled time",
    "records.loadingPurposeWallboxEnergy": "Wallbox charged energy",
    "records.loadingPurposeWallboxMaxSocLimit": "Wallbox charge limit",
    "records.loadingPurposeWallboxPhase": "Wallbox phase history",
    "records.loadingPurposeWallboxPluggedIn": "Wallbox plugged-in time",
    "records.loadingPurposeWallboxPower": "Wallbox charging power",
    "records.loadingPurposeWallboxSoc": "Wallbox vehicle SoC",
    "records.loadingTitle": "Querying history",
    "records.loading": "Loading records…",
    "records.sectionPeaks": "Power peaks",
    "records.sectionPvEnergy": "Best PV yield per string",
    "records.sectionSolarHours": "Longest solar hours",
    "records.sectionWallbox": "Wallbox records",
    "records.subtitle": "Best values for {range} from Home Assistant history.",
    "records.title": "Energy records",
    "records.range7d": "7 days",
    "records.range14d": "14 days",
    "records.range30d": "30 days",
    "records.rangeMonth": "This month",
    "records.rangeYear": "This year",
    "records.range356d": "356 days",
    "records.consumerPeakPower": "{name}: highest consumption peak",
    "records.counterLargestIncrease": "{name}: largest daily meter increase",
    "records.powerPeak": "{name}: highest power peak",
    "records.pvBestYield": "{name}: best daily PV yield",
    "records.pvPeakPower": "{name}: highest PV power",
    "records.solarLongestHours": "{name}: longest solar production time",
    "records.wallboxChargedEnergy": "{name}: most charged energy",
    "records.wallboxChargingEnabled": "{name}: longest charging enabled time",
    "records.wallboxLongestCharge": "{name}: longest charging day",
    "records.wallboxMaxSoc": "{name}: highest vehicle SoC",
    "records.wallboxMaxSocLimit": "{name}: highest charge limit",
    "records.wallboxOnePhase": "{name}: longest 1-phase time",
    "records.wallboxPeakPower": "{name}: highest charging power",
    "records.wallboxPluggedIn": "{name}: longest plugged-in time",
    "records.wallboxThreePhase": "{name}: longest 3-phase time",
    "records.sectionCounters": "Meter records"
  },
  "de": {
    "aria.energyRangeSelector": "Wertebereich auswählen",
    "aria.houseSelector": "Haus auswählen",
    "aria.viewSelector": "Dashboard-Ansicht auswählen",
    "card.defaultTitle": "Energiefluss",
    "advisor.action": "Aktion",
    "advisor.autarky": "Autarkie",
    "advisor.actionHiddenToday": "Heute ausgeblendet",
    "advisor.batteryIdle": "Die Batterie lädt nicht, obwohl Überschuss eingespeist wird. Prüfe Batterielimits oder den Lademodus.",
    "advisor.batteryHighSocLong": "Die Hausbatterie ist seit über 120 Minuten zwischen 90 und 100%. Batterien sollten nicht zu lange so voll bleiben.",
    "advisor.batteryCyclesHigh": "Die Hausbatterie hat heute mehrere Vollzyklen abgeschlossen. Häufige Zyklen können die Batterie schneller altern lassen.",
    "advisor.batteryDeepSoc": "Der SoC der Hausbatterie ist sehr niedrig. Schütze die Reserve und vermeide zusätzliche flexible Verbraucher.",
    "advisor.batteryLow": "Der Batteriestand ist niedrig. Behalte die Reserve im Blick und vermeide flexible Verbraucher, wenn möglich.",
    "advisor.batteryMaxReached": "Die Batterie ist am konfigurierten Max-SoC. Zusätzlicher PV-Ertrag wird wahrscheinlich eingespeist.",
    "advisor.batteryNearlyFull": "Die Batterie ist fast voll, zusätzlicher PV-Ertrag wird wahrscheinlich eingespeist.",
    "advisor.batteryReserveDischarging": "Die Batterie ist auf oder unter Reserve-SoC und entlädt weiter. Prüfe Min-SoC oder Backup-Reserve.",
    "advisor.batteryStatus": "Batterie",
    "advisor.batteryTemperatureHigh": "Die Temperatur der Hausbatterie ist hoch. Prüfe Kühlung, Belüftung oder Wechselrichter-/Batterielimits.",
    "advisor.batteryTemperatureLow": "Die Temperatur der Hausbatterie ist niedrig. Die Ladeleistung kann begrenzt sein und die Batterie stärker belasten.",
    "advisor.checkSensors": "Prüfe nicht verfügbare oder fehlende Sensoren, damit die Energiebilanz zuverlässig bleibt.",
    "advisor.configureConsumption": "Füge einen Hausverbrauchs-Sensor hinzu, um Autarkie und Lastanalyse zu verbessern.",
    "advisor.configureGrid": "Füge Import-/Export-Sensoren hinzu, damit Überschuss und Netzbezug besser bewertet werden können.",
    "advisor.configurePvTotal": "Füge PV-Gesamtleistung oder Dach-/Schuppen-PV-Sensoren hinzu, um die Erzeugungsanalyse zu verbessern.",
    "advisor.consumption": "Last",
    "advisor.detailEntities": "Entitäten",
    "advisor.detailEntityValue": "{entity} meldet für {label} aktuell {value}. {impact}",
    "advisor.detailIntro": "Der Advisor zeigt diesen Hinweis mit Priorität {priority} im Zeitfenster {window}, weil {reason}",
    "advisor.detailSignals": "Entscheidungssignale",
    "advisor.detailSources": "Datenquellen",
    "advisor.detailValues": "Werte",
    "advisor.detailValueOnly": "{label} liegt aktuell bei {value}. {impact}",
    "advisor.detailWhy": "Warum dieser Hinweis erscheint",
    "advisor.detailsToggle": "Details anzeigen",
    "advisor.dismissToday": "Heute ausblenden",
    "advisor.evChargingGrid": "Die Wallbox lädt, während Netzbezug aktiv ist. Reduziere die Ladeleistung oder warte auf mehr PV, falls das nicht gewollt ist.",
    "advisor.evChargingPv": "Die Wallbox wird aktuell gut durch PV oder gespeicherte Energie gedeckt.",
    "advisor.evEnableCharging": "Das Laden ist aktuell deaktiviert. Aktiviere das Laden, wenn du den PV-Überschuss nutzen möchtest.",
    "advisor.evPlugIn": "Stecke das Auto ein, um den PV-Überschuss zum Laden zu nutzen.",
    "advisor.evPhaseChangeScheduled": "{action} in {duration}, wenn sich an der PV-Situation nichts ändert.",
    "advisor.evSocAbove80Long": "Das Auto ist seit über 120 Minuten über 80% SoC. Das kann der Batterie schaden, wenn es länger so bleibt.",
    "advisor.evSocAbove90Long": "Das Auto ist seit über 60 Minuten über 90% SoC. Stoppe das Laden oder senke das Ziel-SoC, wenn es länger steht.",
    "advisor.evTargetReached": "Das Auto ist bereits am konfigurierten Ziel-SoC. Nutze den Überschuss für einen anderen flexiblen Verbraucher.",
    "advisor.evTargetReachedGrid": "Das Auto ist am Ziel-SoC, während die Wallbox weiter Leistung zieht. Prüfe das Ladelimit oder stoppe das Laden.",
    "advisor.exporting": "Einspeisung",
    "advisor.grid": "Netz",
    "advisor.gridImportExportSimultaneous": "Import- und Export-Sensor melden gleichzeitig Leistung. Prüfe, ob die getrennten Netzsensoren korrekt zugeordnet sind.",
    "advisor.gridImportFullBattery": "Der Netzbezug ist hoch, obwohl die Hausbatterie voll ist. Prüfe Entladelimit, Backup-Reserve oder Batteriemodus.",
    "advisor.headlineExport": "PV-Überschuss ist verfügbar",
    "advisor.headlineImport": "Netzbezug ist aktiv",
    "advisor.headlineInfo": "Informationen verfügbar",
    "advisor.headlineNeutral": "Der Energiefluss ist ausgeglichen",
    "advisor.headlineSetup": "Mehr Sensoren schalten bessere Hinweise frei",
    "advisor.headlineWarning": "Die Energiekonfiguration braucht Aufmerksamkeit",
    "advisor.highLoad": "Die aktuelle Last ist im Vergleich zur PV-Erzeugung hoch. Prüfe große Verbraucher, falls das unerwartet ist.",
    "advisor.importing": "Netzbezug",
    "advisor.priorityCritical": "Kritisch",
    "advisor.priorityInfo": "Info",
    "advisor.priorityOpportunity": "Chance",
    "advisor.prioritySetup": "Setup",
    "advisor.prioritySuccess": "OK",
    "advisor.priorityWarning": "Warnung",
    "advisor.electricityPrice": "Strompreis",
    "advisor.lowPv": "Die PV-Produktion ist trotz Tageslicht niedrig. Wenn das Wetter klar ist, prüfe Wechselrichter oder PV-Sensoren.",
    "advisor.noAdvice": "Aktuell besteht kein dringender Handlungsbedarf.",
    "advisor.appliances": "Haushalt",
    "advisor.largeConsumerCovered": "Große Verbraucher laufen gerade ohne relevanten Netzbezug.",
    "advisor.largeConsumerGrid": "{names} ziehen gerade Leistung, während Netzbezug aktiv ist. Verschiebe sie nach Möglichkeit in PV-Überschusszeiten.",
    "advisor.largeConsumerSurplus": "Der PV-Überschuss kann {names} decken. Starte einen passenden großen Verbraucher, wenn er bereit ist.",
    "advisor.panelTitle": "Energy Advisor",
    "advisor.pv": "PV",
    "advisor.recommendations": "Empfehlungen",
    "advisor.runAppliance": "Starte jetzt einen wartenden flexiblen Haushaltsverbraucher.",
    "advisor.sensorStaleMany": "{count} Sensoren wurden länger nicht aktualisiert. Prüfe Verfügbarkeit und Aktualisierungsintervalle.",
    "advisor.sensorStaleOne": "{name} wurde seit {duration} nicht aktualisiert. Prüfe Verfügbarkeit und Aktualisierungsintervall.",
    "advisor.sensors": "Sensoren",
    "advisor.selfConsumption": "Eigenverbrauch",
    "advisor.selfSufficient": "Autark",
    "advisor.startEvCharging": "Starte oder erhöhe die Wallbox-Ladung, solange Überschuss verfügbar ist.",
    "advisor.status": "Status",
    "advisor.suggestionCountOne": "{count} Hinweis",
    "advisor.suggestionCount": "{count} Hinweise",
    "advisor.surplus": "Überschuss",
    "advisor.surplusGeneral": "PV-Überschuss ist verfügbar. Priorisiere flexible Verbraucher, solange eingespeist wird.",
    "advisor.unknown": "Unbekannt",
    "advisor.useHeatPump": "Nutze Wärmepumpen-Boost oder Warmwasser-Vorheizen, solange PV-Überschuss verfügbar ist.",
    "advisor.wallbox": "Wallbox",
    "advisor.weather": "Wetter",
    "advisor.windowAnytime": "Jederzeit",
    "advisor.windowNext2h": "Nächste 2h",
    "advisor.windowNow": "Jetzt",
    "advisor.reasonBattery": "Der Batterie-SoC {soc} fließt in diese Empfehlung ein.",
    "advisor.reasonEvSurplus": "Der PV-Überschuss liegt über der konfigurierten Wallbox-Schwelle von {threshold}.",
    "advisor.reasonGridImport": "Der Netzbezug liegt über der konfigurierten Bezugsschwelle von {threshold}.",
    "advisor.reasonLargeConsumer": "Der verfügbare PV-Überschuss deckt das konfigurierte Verbraucherlimit.",
    "advisor.reasonPhaseChange": "EVCC meldet eine geplante Phasenänderung im nächsten Zeitfenster.",
    "advisor.reasonSensor": "Eine konfigurierte Entität ist veraltet, nicht verfügbar oder widersprüchlich.",
    "advisor.reasonSurplus": "Der PV-Überschuss liegt über der konfigurierten Überschussschwelle von {threshold}.",
    "advisor.reasonWeather": "Das Wetter wird berücksichtigt, um niedrige PV-Leistung einzuordnen.",
    "advisor.reasonPrice": "Der konfigurierte Strompreis-Sensor fließt als Entscheidungskontext ein.",
    "advisor.impactAutarky": "Damit erkennt der Advisor, wie unabhängig das Haus gerade versorgt wird.",
    "advisor.impactBattery": "Dieser Wert beschreibt die aktuelle Batteriereserve und beeinflusst, ob flexible Verbraucher gerade sinnvoll sind.",
    "advisor.impactConsumer": "Dieser Wert zeigt, ob dieser Verbraucher aktiv ist und wie stark er die Energiebilanz beeinflusst.",
    "advisor.impactGrid": "Dieser Wert entscheidet, ob die Situation als Netzbezug, neutral oder PV-Überschuss bewertet wird.",
    "advisor.impactLoad": "Dieser Wert beschreibt die aktuelle Hauslast und hilft einzuschätzen, ob der Verbrauch auffällig hoch ist.",
    "advisor.impactPv": "Dieser Wert beschreibt die aktuelle PV-Erzeugung und hilft einzuschätzen, wie viel Energie verfügbar ist.",
    "advisor.impactSelfConsumption": "Damit erkennt der Advisor, wie viel PV-Energie direkt im Haus genutzt statt eingespeist wird.",
    "advisor.impactSensor": "Dieser Wert dient als Diagnosesignal für Aktualität und Plausibilität der Sensoren.",
    "advisor.impactSurplus": "Dieser Wert zeigt, wie viel Leistung gerade für flexible Verbraucher verfügbar ist, bevor sie eingespeist wird.",
    "advisor.impactTemperature": "Dieser Wert hilft, mögliche Batteriestress- oder Betriebsgrenzen zu erkennen.",
    "advisor.impactWallbox": "Dieser Wert beschreibt den Zustand der Wallbox und beeinflusst, ob Laden starten, stoppen oder warten sollte.",
    "editor.showViewSelector": "Ansichtsauswahl anzeigen",
    "chart.close": "Schließen",
    "chart.empty": "Keine Verlaufsdaten gefunden",
    "chart.error": "Verlauf konnte nicht geladen werden",
    "chart.loading": "Verlauf wird geladen…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Letzte {hours} Stunden",
    "charts.count": "{count} Charts",
    "charts.countOne": "{count} Chart",
    "charts.empty": "Noch keine Entitäten mit Verlauf konfiguriert.",
    "charts.label": "Charts",
    "charts.openLarge": "Großen Chart öffnen",
    "charts.sectionPvStrings": "PV-Strings",
    "charts.sectionInverters": "Wechselrichter",
    "charts.sectionSystem": "Wechselrichter und System",
    "charts.sectionWallbox": "Wallbox",
    "charts.title": "Entitätsverlauf",
    "editor.customDayImage": "Eigenes Tagbild",
    "editor.customImage": "Eigenes Bild",
    "editor.batteryChargeEntity": "Batterie-Lade-Entität",
    "editor.batteryCyclesTodayEntity": "Batterie-Zyklen-heute-Entität",
    "editor.batteryDischargeEntity": "Batterie-Entlade-Entität",
    "editor.batteryFlowEntity": "Batteriefluss-Entität (+/-)",
    "editor.batteryMaxSocEntity": "Batterie-Max-SoC-Entität",
    "editor.batteryMinSocEntity": "Batterie-Min-SoC-Entität",
    "editor.batteryTemperatureEntity": "Batterie-Temperatur-Entität",
    "editor.entity": "Entität",
    "editor.entityPlaceholder": "{label} Entität",
    "editor.energy1hEntity": "1h-kWh-Entität",
    "editor.energy24hEntity": "24h-kWh-Entität",
    "editor.energyCounterEntity": "kWh-Verlaufszähler",
    "editor.energyMonthEntity": "1 Monat-kWh-Entität",
    "editor.energyRangeOverride": "Optionale direkte Zeitraum-Sensoren",
    "editor.energyYearEntity": "1 Jahr-kWh-Entität",
    "editor.energyTotalEntity": "Gesamt-kWh-Entität",
    "editor.liveEntity": "Live-Sensor",
    "editor.houseType": "Haustyp",
    "editor.hudBoxOpacity": "HUD-Box-Deckkraft",
    "editor.hudBoxScale": "HUD-Box-Skalierung",
    "editor.advisorEvSurplusThreshold": "Wallbox-Überschussschwelle (W)",
    "editor.electricityPriceEntity": "Strompreis-Sensor",
    "editor.gridVoltageCriticalThreshold": "Kritische Netzspannung (V)",
    "editor.gridVoltageWarningThreshold": "Hohe Netzspannung (V)",
    "editor.importExportEntity": "Bezugs-/Einspeise-Sensor",
    "editor.importExportSignedEntity": "Vorzeichen-Sensor für Bezug/Einspeisung (+/-)",
    "editor.importPowerEntity": "Bezugs-Sensor",
    "editor.exportPowerEntity": "Einspeise-Sensor",
    "editor.importExportLabels": "Import-/Export-Labels",
    "editor.importLabel": "Bezugs-Label",
    "editor.exportLabel": "Einspeise-Label",
    "editor.neutralLabel": "Autark-Label",
    "editor.environmentAdd": "Kachel hinzufügen",
    "editor.environmentEntity": "Sensor-Entität",
    "editor.environmentLabel": "Sensor-Label",
    "editor.environmentShow": "{label}-Kachel anzeigen",
    "editor.environmentShowFooter": "Box im Footer anzeigen",
    "editor.environmentShowImage": "Box im Bild anzeigen",
    "editor.environmentTemplates": "Umgebungs-Vorlagen",
    "editor.environmentUnit": "Anzeigeeinheit",
    "editor.kpiAdd": "Kachel hinzufügen",
    "editor.kpiColor": "Farbe",
    "editor.kpiColumns": "Kachelbreite",
    "editor.kpiEntity": "KPI-Sensor",
    "editor.kpiLabel": "KPI-Label",
    "editor.kpiPosition": "Reihenfolge im Footer",
    "editor.kpiRemove": "Entfernen",
    "editor.kpiStaticValue": "Fester Wert",
    "editor.consumerEnergyEntity": "kWh-Verlaufszähler",
    "editor.consumerLabel": "Gerätename",
    "editor.consumerAddCustom": "Eigenen großen Verbraucher hinzufügen",
    "editor.consumerPowerEntity": "Leistungs-Sensor",
    "editor.consumerShow": "{label}-Kachel anzeigen",
    "editor.labelHideDesktop": "Auf PC ausblenden",
    "editor.labelHideMobile": "Auf Handys ausblenden",
    "editor.labelOptions": "Label-Anzeige",
    "editor.labelShowFooter": "Label in den KPIs im Footer anzeigen",
    "editor.labelShowImage": "Label im Bild anzeigen",
    "editor.maxPowerKw": "Erwartete Maximalleistung (kW/kWp)",
    "editor.optionalDayImage": "Optionales Tagesbild",
    "editor.powerDecimals": "Leistungs-Nachkommastellen",
    "editor.powerDisplayMode": "Leistungsanzeige",
    "editor.rawMode": "Rohwert + konfigurierte Einheit",
    "editor.auto": "Auto",
    "editor.autoWKw": "Automatisch W/kW",
    "editor.advisorMaxSuggestions": "Advisor-Hinweise",
    "editor.overlayEnable": "{label} anzeigen",
    "editor.overlayLabel": "Label",
    "editor.overlayOrientation": "Ausrichtung",
    "editor.overlayOrientationLeft": "Links am Haus",
    "editor.overlayOrientationRight": "Rechts am Haus",
    "editor.overlayPeriod": "Zeitraum",
    "editor.overlaySize": "Größe",
    "editor.period1h": "1 Stunde",
    "editor.period24h": "24 Stunden",
    "editor.period30m": "30 Minuten",
    "editor.phaseActionEntity": "Entität für bevorstehende Phasen-Aktion",
    "editor.phaseEntity": "Phasen-Entität",
    "editor.phaseRemainingEntity": "Entität für verbleibende Sekunden bis Phasen-Aktion",
    "editor.pvForecastTodayEntity": "Prognose-heute-Entität",
    "editor.pvLabels": "PV-Labels",
    "editor.pvPeakTodayEntity": "Peak-heute-Entität",
    "editor.pvPowerLabel": "Leistungs-Label",
    "editor.pvRoofStringAdd": "String hinzufügen",
    "editor.pvRoofStringDisplay": "Anzeige PV-Dach-Strings",
    "editor.pvRoofStringDisplayDominant": "Stärksten String groß, andere klein",
    "editor.pvRoofStringDisplaySum": "Strings aufaddiert",
    "editor.pvRoofStringDisplayValues": "String-Werte anzeigen",
    "editor.pvRoofStringEnergyEntity": "String-kWh-Zähler-Entität",
    "editor.pvRoofStringLabel": "String-Name",
    "editor.pvRoofStringPowerEntity": "String-Leistungs-Entität",
    "editor.pvRoofStrings": "PV-Dach-Strings",
    "editor.inverterAdd": "Wechselrichter hinzufügen",
    "editor.inverterDisplay": "Anzeige Wechselrichter",
    "editor.inverterDisplayDominant": "Stärksten Wechselrichter groß, andere klein",
    "editor.inverterDisplaySum": "Wechselrichter aufaddiert",
    "editor.inverterDisplayValues": "Wechselrichter-Werte anzeigen",
    "editor.inverterEnergyEntity": "Wechselrichter-kWh-Zähler-Entität",
    "editor.inverterLabel": "Wechselrichter-Name",
    "editor.inverterPowerEntity": "Wechselrichter-Leistungs-Entität",
    "editor.inverters": "Wechselrichter",
    "editor.pvTodayEnergyEntity": "Heute-erzeugt-Entität",
    "editor.remainingChargeTimeEntity": "Verbleibende Ladezeit-Entität",
    "editor.vehicleChargingEnabledEntity": "Laden-aktiviert-Entität",
    "editor.vehicleConnectedEntity": "Auto-verbunden-Entität",
    "editor.vehicleMaxSocEntity": "Auto-Max-/Ziel-SoC-Entität",
    "editor.vehicleSocEntity": "Auto-SoC-Entität",
    "editor.sectionBoxes": "Energie-Boxen",
    "editor.sectionAdvisor": "Advisor und Preise",
    "editor.sectionAppearance": "Anzeige und Grenzwerte",
    "editor.sectionGeneral": "Allgemeine Einstellungen",
    "editor.sectionKpis": "Eigene KPI-Kacheln",
    "editor.sectionEnvironmentSensors": "Umweltsensoren",
    "editor.sectionLargeConsumers": "Weitere große Verbraucher",
    "editor.sectionOverlays": "Bild-Overlays",
    "editor.showBox": "{label} anzeigen",
    "editor.showEnergyRangeSelector": "Live-/1h-/24h-/Monat-/Jahr-/Gesamt-Auswahl anzeigen",
    "editor.showHouseSelector": "Hausauswahl anzeigen",
    "editor.showEnvironmentSensors": "Umweltsensor-Kacheln anzeigen",
    "editor.showLargeConsumers": "Große Verbraucher in der Hausansicht anzeigen",
    "editor.showGridStatusTile": "Netzstatus-Kachel anzeigen",
    "editor.showMetricTiles": "Messwertboxen unter dem Bild anzeigen",
    "editor.showPowerFlows": "Animierte Stromflüsse anzeigen",
    "editor.showStatusLabel": "Statuslabel im Bild anzeigen",
    "editor.showTitle": "Titel anzeigen",
    "editor.showWeatherStatus": "Aktuelles Wetter im Statuslabel anzeigen",
    "editor.title": "Titel",
    "editor.tabSetup": "Einrichtung",
    "editor.tabEnergy": "Energie",
    "editor.tabDevices": "Geräte",
    "editor.tabEnvironment": "Umgebung",
    "editor.tabFloorplan": "Grundriss",
    "editor.tabLayout": "Layout",
    "editor.tabAppearance": "Anzeige",
    "editor.tabAdvisor": "Advisor",
    "editor.tabAdvanced": "Erweitert",
    "editor.tabs": "Konfigurationsbereiche",
    "editor.statusConfigured": "{configured}/{total} konfiguriert",
    "editor.statusConfiguredCount": "{count} konfiguriert",
    "editor.statusHidden": "{count} ausgeblendet",
    "editor.statusMissing": "{count} fehlt",
    "editor.statusAdvanced": "Erweiterte Optionen aktiv",
    "editor.statusReady": "Bereit",
    "editor.layoutMode": "Layout-Modus",
    "editor.layoutHelp": "Klicke eine Box in der Vorschau an und passe dann X/Y an.",
    "editor.layoutSelected": "Ausgewählte Box",
    "editor.layoutEmpty": "Aktiviere Bild-Boxen oder Overlays, um ihre Position hier zu bearbeiten.",
    "editor.layoutTypeBox": "Box",
    "editor.layoutTypeOverlay": "Overlay",
    "editor.layoutTypeEnvironment": "Umgebung",
    "editor.sectionFloorplan": "Grundriss-Editor",
    "editor.floorplanHelp": "Wähle ein Werkzeug, klicke ins Raster und passe danach das ausgewählte Element an.",
    "editor.floorplanShowGrid": "Raster anzeigen",
    "editor.floorplanTools": "Grundriss-Werkzeuge",
    "editor.floorplanToolRoom": "Raum",
    "editor.floorplanToolWall": "Wand",
    "editor.floorplanToolSensor": "Sensor",
    "editor.floorplanSelected": "Ausgewähltes Element",
    "editor.floorplanLabel": "Label",
    "editor.floorplanWidth": "Breite",
    "editor.floorplanHeight": "Höhe",
    "editor.floorplanDelete": "Auswahl löschen",
    "editor.floorplanCustomEntity": "Eigene Entität",
    "editor.floorplanSensorSource": "Sensorquelle",
    "editor.floorplanEntity": "Entität",
    "editor.floorplanEmpty": "Klicke ins Raster, um das ausgewählte Element zu erstellen.",
    "editor.helpHomeAssistantSensor": "Wähle die Home-Assistant-Entität, die diesen Wert liefert.",
    "editor.helpUnitAuto": "Mit Auto wird die Einheit der Home-Assistant-Entität verwendet. Wähle eine andere Einheit nur, wenn du sie überschreiben möchtest.",
    "editor.helpEnergyCounter": "Optionaler kumulativer Energiezähler für 1h, 24h, Monat, Jahr und Gesamtansicht.",
    "editor.helpSignedGrid": "Nutze einen Sensor, bei dem positive Werte Netzbezug und negative Werte Einspeisung bedeuten. Leer lassen, wenn getrennte Sensoren genutzt werden.",
    "editor.helpSignedBattery": "Wenn möglich einen Vorzeichen-Sensor nutzen: positiv lädt, negativ entlädt.",
    "editor.helpFooterOrder": "Legt die Reihenfolge der Kacheln unter dem Bild fest. Niedrigere Werte erscheinen früher.",
    "editor.helpTileWidth": "Legt fest, wie breit die Footer-Kachel auf dem Desktop ist. Mobil wird die Breite automatisch begrenzt.",
    "editor.helpImagePosition": "Position der Box auf dem Hausbild in Prozent.",
    "editor.helpEnvironmentFooter": "Zeigt diesen Sensor als Kachel im Umgebungsbereich unter dem Bild.",
    "editor.helpEnvironmentImage": "Zeigt diesen Sensor als skalierbare HUD-Box direkt auf dem Hausbild.",
    "editor.helpMaxPower": "Wird nur für die Auslastungsleiste und Lastprüfungen im Advisor verwendet.",
    "editor.unit": "Anzeigeeinheit",
    "editor.voltageEntity": "Spannungssensor",
    "editor.voltageEntityL1": "Spannungssensor L1",
    "editor.voltageEntityL2": "Spannungssensor L2",
    "editor.voltageEntityL3": "Spannungssensor L3",
    "editor.viewMode": "Standardansicht",
    "editor.weatherEntity": "Wetter-Entität",
    "editor.setupWizard": "Einrichtungs-Assistent",
    "editor.setupIntro": "Hilft bei der Ersteinrichtung, indem passende Sensoren für PV, Batterie, Wechselrichter, Wallbox, Netz, Verbrauch, Wetter und kWh-Zähler vorgeschlagen werden.",
    "editor.setupHelp": "Prüfe die Vorschläge vor dem Übernehmen. \"Leere Felder füllen\" ist der sichere erste Schritt, \"Erkannte Felder ersetzen\" überschreibt vorhandene erkannte Zuordnungen.",
    "editor.setupEntityCount": "{count} Entitäten verfügbar",
    "editor.setupNoEntities": "Öffne diesen Editor in Home Assistant, damit Entitäten erkannt werden können.",
    "editor.setupFillEmpty": "Leere Felder füllen",
    "editor.setupReplaceAll": "Erkannte Felder ersetzen",
    "editor.setupSuggestions": "Erkannte Vorschläge",
    "editor.setupNoSuggestions": "Noch keine sicheren Entitäts-Treffer gefunden.",
    "editor.setupApplyOne": "Übernehmen",
    "editor.setupCurrent": "Aktuell",
    "editor.setupSuggested": "Vorschlag",
    "editor.setupConfidence": "{score}% Treffer",
    "editor.setupApplied": "{count} Vorschlag/Vorschläge übernommen.",
    "editor.setupApplyNone": "Keine leeren Felder wurden geändert.",
    "editor.xPosition": "X-Position",
    "editor.yPosition": "Y-Position",
    "flow.charge": "Eingehend",
    "flow.discharge": "Ausgehend",
    "consumer.custom": "Eigene",
    "consumer.customLarge": "Eigener großer Verbraucher",
    "consumer.dhw_heatpump": "Brauchwasserwärmepumpe",
    "consumer.dishwasher": "Spülmaschine",
    "consumer.dryer": "Trockner",
    "consumer.sectionTitle": "Weitere große Verbraucher",
    "consumer.space_heater": "Heizlüfter",
    "consumer.washing_machine": "Waschmaschine",
    "environment.sectionTitle": "Umgebung",
    "environment.sensor": "Umgebung {index}",
    "environment.templateIndoor": "Innentemperatur",
    "environment.templateOutdoor": "Außentemperatur",
    "environment.templateHotWater": "Warmwasser",
    "environment.templatePressure": "Druck",
    "environment.templateAirQuality": "Luftqualität",
    "environment.templateCustom": "Eigene",
    "floorplan.counts": "{rooms} Räume · {sensors} Sensoren",
    "floorplan.empty": "Erstelle Räume, Wände und Sensoren im Karteneditor.",
    "floorplan.label": "Grundriss",
    "floorplan.room": "Raum {index}",
    "floorplan.sensor": "Sensor {index}",
    "floorplan.title": "Hausgrundriss",
    "floorplan.wall": "Wand {index}",
    "house.apartment_building": "Mehrfamilienhaus",
    "house.apartment_building_balcony_solar": "Mehrfamilienhaus Balkonsolar",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Stadtvilla",
    "house.city_villa_pitched_roof": "Stadtvilla mit Satteldach",
    "house.duplex_house": "Doppelhaus",
    "house.single_family_home": "Einfamilienhaus",
    "house.terraced_middle_house": "Reihenmittelhaus",
    "metrics.battery_level": "Batterie",
    "metrics.grid_status": "Netz",
    "metrics.house_consumption_power": "Verbrauch",
    "metrics.import_export_power": "Import/Export",
    "metrics.inverter_power": "Wechselrichter",
    "metrics.pv_power": "PV-Leistung",
    "metrics.pv_roof_power": "PV Dach",
    "metrics.pv_shed_power": "PV Schuppen",
    "metrics.pv_total_power": "PV Gesamt",
    "metrics.water_meter": "Wasser",
    "metrics.wallbox_power": "Wallbox",
    "metrics.wallbox2_power": "Wallbox 2",
    "overlay.heatpump": "Wärmepumpe",
    "overlay.smoke": "Gas",
    "phase.auto": "Auto",
    "phase.many": "{count} Phasen",
    "phase.one": "1 Phase",
    "pvLabel.forecastToday": "Prognose heute",
    "pvLabel.peakToday": "Peak heute",
    "pvLabel.power": "Leistung",
    "pvLabel.todayEnergy": "Heute erzeugt",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Live",
    "range.month": "1 Monat",
    "range.total": "Gesamt",
    "range.year": "1 Jahr",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Zuletzt aktualisiert: {time}",
    "status.selfSufficient": "Autark",
    "status.weather": "Wetter: {weather}",
    "tooltip.entity": "Entität",
    "tooltip.flow": "Fluss",
    "tooltip.load": "Auslastung",
    "tooltip.max": "Maximum",
    "tooltip.phases": "Phasen",
    "tooltip.phaseChange": "Bevorstehende Phasenänderung",
    "tooltip.raw": "Rohwert",
    "tooltip.remainingChargeTime": "Verbleibende Ladezeit",
    "tooltip.status": "Status",
    "tooltip.temperature": "Temperatur",
    "tooltip.updated": "Aktualisiert",
    "tooltip.value": "Wert",
    "tooltip.vehicleSoc": "Auto SoC",
    "tooltip.voltage": "Spannung",
    "value.remainingChargeTime": "Noch {value}",
    "value.phaseChangeIn": "{action} in {duration}",
    "value.temperature": "Temp {value}",
    "value.soon": "bald",
    "view.advisor": "Advisor Dashboard",
    "view.house": "Hausansicht",
    "view.floorplan": "Grundriss",
    "view.charts": "Charts",
    "weather.clear": "Klar",
    "weather.clear-night": "Klar",
    "weather.cloudy": "Bewölkt",
    "weather.fog": "Nebel",
    "weather.hail": "Hagel",
    "weather.lightning": "Gewitter",
    "weather.lightning-rainy": "Gewitterregen",
    "weather.partlycloudy": "Teilweise bewölkt",
    "weather.pouring": "Starkregen",
    "weather.rainy": "Regnerisch",
    "weather.snowy": "Schnee",
    "weather.snowy-rainy": "Schneeregen",
    "weather.sunny": "Sonnig",
    "weather.windy": "Windig",
    "weather.windy-variant": "Windig/bewölkt",
    "warning.batteryLow": "Batterie niedrig",
    "warning.gridVoltageCritical": "Viel zu hohe Spannung im Stromnetz",
    "warning.gridVoltageHigh": "Hohe Spannung im Stromnetz",
    "warning.sensorMissing": "Entität nicht gefunden",
    "warning.sensorOffline": "Sensor offline",
    "warning.sensorUnavailable": "Sensor nicht verfügbar",
    "view.records": "Rekorde",
    "records.count": "{count} Rekorde",
    "records.countOne": "{count} Rekord",
    "records.days": "{days} Tage",
    "records.empty": "Noch keine auswertbare Historie gefunden.",
    "records.error": "Rekorde konnten nicht geladen werden.",
    "records.label": "Highscores",
    "records.loadingCount": "{count} Entitäten",
    "records.loadingCountOne": "{count} Entität",
    "records.loadingPurposeConsumerPower": "Verbrauchsspitze",
    "records.loadingPurposeCounter": "Tageszähler-Zuwachs",
    "records.loadingPurposePower": "Leistungsspitze",
    "records.loadingPurposePvEnergy": "PV-Tagesertrag",
    "records.loadingPurposePvPower": "PV-Leistung und solare Stunden",
    "records.loadingPurposeWallboxChargingEnabled": "Wallbox-Ladefreigabe",
    "records.loadingPurposeWallboxEnergy": "Wallbox-Ladeenergie",
    "records.loadingPurposeWallboxMaxSocLimit": "Wallbox-Ladegrenze",
    "records.loadingPurposeWallboxPhase": "Wallbox-Phasenhistorie",
    "records.loadingPurposeWallboxPluggedIn": "Wallbox eingesteckt",
    "records.loadingPurposeWallboxPower": "Wallbox-Ladeleistung",
    "records.loadingPurposeWallboxSoc": "Wallbox-Fahrzeug-SoC",
    "records.loadingTitle": "Historie wird abgefragt",
    "records.loading": "Rekorde werden geladen…",
    "records.sectionPeaks": "Leistungsrekorde",
    "records.sectionPvEnergy": "Bester PV-Ertrag pro String",
    "records.sectionSolarHours": "Längste solare Stunden",
    "records.sectionWallbox": "Wallbox-Rekorde",
    "records.subtitle": "Bestwerte für {range} aus der Home-Assistant-Historie.",
    "records.title": "Energie-Rekorde",
    "records.range7d": "7 Tage",
    "records.range14d": "14 Tage",
    "records.range30d": "30 Tage",
    "records.rangeMonth": "Diesen Monat",
    "records.rangeYear": "Dieses Jahr",
    "records.range356d": "356 Tage",
    "records.consumerPeakPower": "{name}: höchste Verbrauchsspitze",
    "records.counterLargestIncrease": "{name}: größter Tageszähler-Zuwachs",
    "records.powerPeak": "{name}: höchste Leistungsspitze",
    "records.pvBestYield": "{name}: bester PV-Tagesertrag",
    "records.pvPeakPower": "{name}: höchste PV-Leistung",
    "records.solarLongestHours": "{name}: längste solare Produktionszeit",
    "records.wallboxChargedEnergy": "{name}: meiste geladene Energie",
    "records.wallboxChargingEnabled": "{name}: längste Ladefreigabe",
    "records.wallboxLongestCharge": "{name}: längster Ladetag",
    "records.wallboxMaxSoc": "{name}: höchster Fahrzeug-SoC",
    "records.wallboxMaxSocLimit": "{name}: höchste Ladegrenze",
    "records.wallboxOnePhase": "{name}: längste 1-phasige Zeit",
    "records.wallboxPeakPower": "{name}: höchste Ladeleistung",
    "records.wallboxPluggedIn": "{name}: längste eingesteckte Zeit",
    "records.wallboxThreePhase": "{name}: längste 3-phasige Zeit",
    "records.sectionCounters": "Zähler-Rekorde"
  },
  "es": {
    "aria.energyRangeSelector": "Seleccionar rango de valores",
    "aria.houseSelector": "Seleccionar casa",
    "aria.viewSelector": "Seleccionar vista del panel",
    "card.defaultTitle": "Flujo de energía",
    "advisor.action": "Acción",
    "advisor.autarky": "Autarquía",
    "advisor.actionHiddenToday": "Oculto por hoy",
    "advisor.batteryIdle": "Battery is not charging while surplus is exported. Check battery limits or charge mode.",
    "advisor.batteryHighSocLong": "House battery has been between 90 and 100% for more than 120 minutes. Batteries should not stay that full for too long.",
    "advisor.batteryCyclesHigh": "House battery has completed several full cycles today. Frequent cycling can age the battery faster.",
    "advisor.batteryDeepSoc": "House battery SoC is very low. Protect the reserve and avoid additional flexible loads.",
    "advisor.batteryLow": "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible.",
    "advisor.batteryMaxReached": "Battery is at the configured max SoC. Additional PV is likely to be exported.",
    "advisor.batteryNearlyFull": "Battery is nearly full, so additional PV is likely to be exported.",
    "advisor.batteryReserveDischarging": "Battery is at or below reserve SoC and still discharging. Check min SoC or backup reserve settings.",
    "advisor.batteryStatus": "Batería",
    "advisor.batteryTemperatureHigh": "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits.",
    "advisor.batteryTemperatureLow": "House battery temperature is low. Charging power may be limited and battery stress can increase.",
    "advisor.checkSensors": "Check unavailable or missing sensors so the energy balance stays reliable.",
    "advisor.configureConsumption": "Add a house consumption sensor to improve autarky and load analysis.",
    "advisor.configureGrid": "Add grid import/export sensors for better advice about surplus and grid draw.",
    "advisor.configurePvTotal": "Add PV total power or roof/shed PV sensors to improve production analysis.",
    "advisor.consumption": "Carga",
    "advisor.detailEntities": "Entidades",
    "advisor.detailEntityValue": "{entity} currently reports {value} for {label}. {impact}",
    "advisor.detailIntro": "The Advisor shows this as {priority} for {window}, because {reason}",
    "advisor.detailSignals": "Señales de decisión",
    "advisor.detailSources": "Fuentes de datos",
    "advisor.detailValues": "Valores",
    "advisor.detailValueOnly": "{label} is currently {value}. {impact}",
    "advisor.detailWhy": "Por qué aparece este aviso",
    "advisor.detailsToggle": "Mostrar detalles",
    "advisor.dismissToday": "Ocultar hoy",
    "advisor.evChargingGrid": "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended.",
    "advisor.evChargingPv": "EV charging is currently covered well by PV or stored energy.",
    "advisor.evEnableCharging": "Charging is currently disabled. Enable charging if you want to use the PV surplus.",
    "advisor.evPlugIn": "Plug in the vehicle to use PV surplus for charging.",
    "advisor.evPhaseChangeScheduled": "{action} in {duration} if the PV situation does not change.",
    "advisor.evSocAbove80Long": "Vehicle SoC is above 80% for more than 120 minutes. This can stress the battery if it stays there too long.",
    "advisor.evSocAbove90Long": "Vehicle SoC is above 90% for more than 60 minutes. Stop charging or lower the target SoC if the car will stay parked.",
    "advisor.evTargetReached": "Vehicle is already at the configured target SoC. Use surplus for another flexible load.",
    "advisor.evTargetReachedGrid": "Vehicle is at target SoC while the charger is still drawing power. Check the charge limit or stop charging.",
    "advisor.exporting": "Inyección",
    "advisor.grid": "Red",
    "advisor.gridImportExportSimultaneous": "Import and export sensors report power at the same time. Check whether the split grid sensors are mapped correctly.",
    "advisor.gridImportFullBattery": "Grid import is high although the house battery is full. Check discharge limits, backup reserve, or battery mode.",
    "advisor.headlineExport": "Hay excedente FV disponible",
    "advisor.headlineImport": "La importación de red está activa",
    "advisor.headlineInfo": "Información disponible",
    "advisor.headlineNeutral": "El flujo de energía está equilibrado",
    "advisor.headlineSetup": "Más sensores habilitan mejores consejos",
    "advisor.headlineWarning": "La configuración energética requiere atención",
    "advisor.highLoad": "Current load is high compared with PV production. Check large consumers if this is unexpected.",
    "advisor.importing": "Importación",
    "advisor.priorityCritical": "Crítico",
    "advisor.priorityInfo": "Info",
    "advisor.priorityOpportunity": "Oportunidad",
    "advisor.prioritySetup": "Configuración",
    "advisor.prioritySuccess": "OK",
    "advisor.priorityWarning": "Advertencia",
    "advisor.electricityPrice": "Precio de electricidad",
    "advisor.lowPv": "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors.",
    "advisor.noAdvice": "No hay acciones urgentes ahora.",
    "advisor.appliances": "Electrodomésticos",
    "advisor.largeConsumerCovered": "Large consumers are running without relevant grid import.",
    "advisor.largeConsumerGrid": "{names} currently draw power while grid import is active. Shift them to PV surplus if possible.",
    "advisor.largeConsumerSurplus": "PV surplus can cover {names}. Start a ready large consumer while export is active.",
    "advisor.panelTitle": "Asesor energético",
    "advisor.pv": "FV",
    "advisor.recommendations": "Recomendaciones",
    "advisor.runAppliance": "Run a flexible household appliance now if it is waiting.",
    "advisor.sensorStaleMany": "{count} sensors have not updated recently. Check entity availability and recorder/update intervals.",
    "advisor.sensorStaleOne": "{name} has not updated for {duration}. Check entity availability and update interval.",
    "advisor.sensors": "Sensores",
    "advisor.selfConsumption": "Autoconsumo",
    "advisor.selfSufficient": "Autosuficiente",
    "advisor.startEvCharging": "Start or increase EV charging while surplus is available.",
    "advisor.status": "Estado",
    "advisor.suggestionCountOne": "{count} sugerencia",
    "advisor.suggestionCount": "{count} sugerencias",
    "advisor.surplus": "Excedente",
    "advisor.surplusGeneral": "PV surplus is available. Prioritize flexible loads while export is active.",
    "advisor.unknown": "Desconocido",
    "advisor.useHeatPump": "Use heat pump boost or preheat hot water while PV surplus is available.",
    "advisor.wallbox": "VE",
    "advisor.weather": "Tiempo",
    "advisor.windowAnytime": "En cualquier momento",
    "advisor.windowNext2h": "Próx. 2 h",
    "advisor.windowNow": "Ahora",
    "advisor.reasonBattery": "Battery SoC {soc} is part of this recommendation.",
    "advisor.reasonEvSurplus": "PV surplus is above the configured EV threshold of {threshold}.",
    "advisor.reasonGridImport": "Grid import is above the configured import threshold of {threshold}.",
    "advisor.reasonLargeConsumer": "The available PV surplus can cover the configured consumer limit.",
    "advisor.reasonPhaseChange": "EVCC reports a planned phase change inside the next window.",
    "advisor.reasonSensor": "A configured entity is stale, unavailable, or inconsistent.",
    "advisor.reasonSurplus": "PV surplus is above the configured surplus threshold of {threshold}.",
    "advisor.reasonWeather": "Weather is included to separate low PV from expected conditions.",
    "advisor.reasonPrice": "The configured electricity price sensor is included in the decision context.",
    "advisor.impactAutarky": "That shows how independently the house is currently being supplied.",
    "advisor.impactBattery": "That value describes the current battery reserve and influences whether flexible loads are sensible right now.",
    "advisor.impactConsumer": "That value shows whether this consumer is active and how strongly it affects the energy balance.",
    "advisor.impactGrid": "That value decides whether the situation is treated as grid import, neutral, or PV surplus.",
    "advisor.impactLoad": "That value describes the current household load and helps classify whether consumption is unusually high.",
    "advisor.impactPv": "That value describes the current PV production and helps estimate how much energy is available.",
    "advisor.impactSelfConsumption": "That shows how much PV energy is being used locally instead of being exported.",
    "advisor.impactSensor": "That value is used as a diagnostic signal for sensor freshness and plausibility.",
    "advisor.impactSurplus": "That value shows how much power is currently available for flexible loads before it is exported.",
    "advisor.impactTemperature": "That value is used to detect possible battery stress or operating limits.",
    "advisor.impactWallbox": "That value describes the charger state and determines whether charging should start, stop, or wait.",
    "editor.showViewSelector": "Mostrar selector de vista",
    "chart.close": "Cerrar",
    "chart.empty": "No se encontraron datos históricos",
    "chart.error": "No se pudo cargar el historial",
    "chart.loading": "Cargando historial…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Últimas {hours} horas",
    "charts.count": "{count} gráficos",
    "charts.countOne": "{count} gráfico",
    "charts.empty": "Aún no hay entidades con historial configuradas.",
    "charts.label": "Gráficos",
    "charts.openLarge": "Abrir gráfico grande",
    "charts.sectionPvStrings": "Strings FV",
    "charts.sectionInverters": "Inversores",
    "charts.sectionSystem": "Inversor y sistema",
    "charts.sectionWallbox": "Wallbox",
    "charts.title": "Historial de entidades",
    "editor.customDayImage": "Imagen diurna personalizada",
    "editor.customImage": "Imagen personalizada",
    "editor.batteryChargeEntity": "Entidad de carga de batería",
    "editor.batteryCyclesTodayEntity": "Entidad de ciclos de batería de hoy",
    "editor.batteryDischargeEntity": "Entidad de descarga de batería",
    "editor.batteryFlowEntity": "Entidad de flujo de batería (+/-)",
    "editor.batteryMaxSocEntity": "Entidad SoC máximo de batería",
    "editor.batteryMinSocEntity": "Entidad SoC mínimo de batería",
    "editor.batteryTemperatureEntity": "Entidad de temperatura de batería",
    "editor.entity": "Entidad",
    "editor.entityPlaceholder": "Entidad de {label}",
    "editor.energy1hEntity": "Entidad kWh 1h",
    "editor.energy24hEntity": "Entidad kWh 24h",
    "editor.energyCounterEntity": "Entidad contador kWh",
    "editor.energyMonthEntity": "Entidad kWh 1 mes",
    "editor.energyRangeOverride": "Sensores directos de periodo opcionales",
    "editor.energyYearEntity": "Entidad kWh 1 año",
    "editor.energyTotalEntity": "Entidad kWh total",
    "editor.liveEntity": "Entidad en vivo",
    "editor.houseType": "Tipo de casa",
    "editor.hudBoxOpacity": "Opacidad de cajas HUD",
    "editor.hudBoxScale": "Escala de cajas HUD",
    "editor.advisorEvSurplusThreshold": "Umbral de excedente FV para VE (W)",
    "editor.electricityPriceEntity": "Entidad de precio de electricidad",
    "editor.gridVoltageCriticalThreshold": "Tensión crítica de red (V)",
    "editor.gridVoltageWarningThreshold": "Tensión alta de red (V)",
    "editor.importExportEntity": "Entidad de importación/exportación",
    "editor.importExportSignedEntity": "Entidad importación/exportación con signo (+/-)",
    "editor.importPowerEntity": "Entidad de importación",
    "editor.exportPowerEntity": "Entidad de exportación",
    "editor.importExportLabels": "Etiquetas de importación/exportación",
    "editor.importLabel": "Etiqueta de importación",
    "editor.exportLabel": "Etiqueta de exportación",
    "editor.neutralLabel": "Etiqueta de autosuficiencia",
    "editor.environmentAdd": "Añadir mosaico",
    "editor.environmentEntity": "Entidad del sensor",
    "editor.environmentLabel": "Etiqueta del sensor",
    "editor.environmentShow": "Mostrar mosaico de {label}",
    "editor.environmentShowFooter": "Mostrar caja en el pie",
    "editor.environmentShowImage": "Mostrar caja en la imagen",
    "editor.environmentTemplates": "Plantillas ambientales",
    "editor.environmentUnit": "Unidad mostrada",
    "editor.kpiAdd": "Añadir mosaico",
    "editor.kpiColor": "Color",
    "editor.kpiColumns": "Ancho del mosaico",
    "editor.kpiEntity": "Entidad KPI",
    "editor.kpiLabel": "Etiqueta KPI",
    "editor.kpiPosition": "Posición del mosaico",
    "editor.kpiRemove": "Eliminar",
    "editor.kpiStaticValue": "Valor fijo",
    "editor.consumerEnergyEntity": "Entidad contador kWh",
    "editor.consumerLabel": "Nombre del dispositivo",
    "editor.consumerAddCustom": "Añadir gran consumidor propio",
    "editor.consumerPowerEntity": "Entidad de potencia",
    "editor.consumerShow": "Mostrar mosaico de {label}",
    "editor.labelHideDesktop": "Ocultar en escritorio",
    "editor.labelHideMobile": "Ocultar en móviles",
    "editor.labelOptions": "Visualización de etiquetas",
    "editor.labelShowFooter": "Mostrar etiqueta en KPI inferiores",
    "editor.labelShowImage": "Mostrar etiqueta en la imagen",
    "editor.maxPowerKw": "Potencia máxima (kW/kWp)",
    "editor.optionalDayImage": "Imagen diurna opcional",
    "editor.powerDecimals": "Decimales de potencia",
    "editor.powerDisplayMode": "Modo de potencia",
    "editor.rawMode": "Valor bruto + unidad configurada",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.advisorMaxSuggestions": "Sugerencias del asesor",
    "editor.overlayEnable": "Mostrar {label}",
    "editor.overlayLabel": "Etiqueta",
    "editor.overlayOrientation": "Orientación",
    "editor.overlayOrientationLeft": "Lado izquierdo",
    "editor.overlayOrientationRight": "Lado derecho",
    "editor.overlayPeriod": "Periodo",
    "editor.overlaySize": "Tamaño",
    "editor.period1h": "1 hora",
    "editor.period24h": "24 horas",
    "editor.period30m": "30 minutos",
    "editor.phaseActionEntity": "Entidad de próxima acción de fase",
    "editor.phaseEntity": "Entidad de fases",
    "editor.phaseRemainingEntity": "Entidad segundos restantes de fase",
    "editor.pvForecastTodayEntity": "Entidad previsión de hoy",
    "editor.pvLabels": "Etiquetas FV",
    "editor.pvPeakTodayEntity": "Entidad pico de hoy",
    "editor.pvPowerLabel": "Etiqueta de potencia",
    "editor.pvRoofStringAdd": "Añadir string",
    "editor.pvRoofStringDisplay": "Visualización de strings FV tejado",
    "editor.pvRoofStringDisplayDominant": "String mayor grande, otros pequeños",
    "editor.pvRoofStringDisplaySum": "Sumar strings",
    "editor.pvRoofStringDisplayValues": "Mostrar valores de strings",
    "editor.pvRoofStringEnergyEntity": "Entidad contador kWh del string",
    "editor.pvRoofStringLabel": "Nombre del string",
    "editor.pvRoofStringPowerEntity": "Entidad de potencia del string",
    "editor.pvRoofStrings": "Strings FV tejado",
    "editor.inverterAdd": "Añadir inversor",
    "editor.inverterDisplay": "Visualización de inversores",
    "editor.inverterDisplayDominant": "Inversor mayor grande, otros pequeños",
    "editor.inverterDisplaySum": "Sumar inversores",
    "editor.inverterDisplayValues": "Mostrar valores de inversores",
    "editor.inverterEnergyEntity": "Entidad contador kWh del inversor",
    "editor.inverterLabel": "Nombre del inversor",
    "editor.inverterPowerEntity": "Entidad de potencia del inversor",
    "editor.inverters": "Inversores",
    "editor.pvTodayEnergyEntity": "Entidad generado hoy",
    "editor.remainingChargeTimeEntity": "Entidad de tiempo de carga restante",
    "editor.vehicleChargingEnabledEntity": "Entidad carga habilitada",
    "editor.vehicleConnectedEntity": "Entidad vehículo conectado",
    "editor.vehicleMaxSocEntity": "Entidad SoC máx./objetivo del vehículo",
    "editor.vehicleSocEntity": "Entidad SoC del vehículo",
    "editor.sectionBoxes": "Cajas, entidades en vivo/kWh, unidad y posición",
    "editor.sectionAdvisor": "Asesor y precios",
    "editor.sectionAppearance": "Visualización y límites",
    "editor.sectionGeneral": "Ajustes generales",
    "editor.sectionKpis": "Mosaicos KPI personalizados",
    "editor.sectionEnvironmentSensors": "Sensores ambientales",
    "editor.sectionLargeConsumers": "Otros grandes consumidores",
    "editor.sectionOverlays": "Superposiciones de imagen",
    "editor.showBox": "Mostrar {label}",
    "editor.showEnergyRangeSelector": "Mostrar selector en vivo/1h/24h/mes/año/total",
    "editor.showHouseSelector": "Mostrar selector de casa",
    "editor.showEnvironmentSensors": "Mostrar mosaicos de sensores ambientales",
    "editor.showLargeConsumers": "Mostrar grandes consumidores en la vista de casa",
    "editor.showGridStatusTile": "Mostrar mosaico de red",
    "editor.showMetricTiles": "Mostrar cajas de métricas bajo la imagen",
    "editor.showPowerFlows": "Mostrar flujos de energía animados",
    "editor.showStatusLabel": "Mostrar etiqueta de estado en la imagen",
    "editor.showTitle": "Mostrar título",
    "editor.showWeatherStatus": "Mostrar clima actual en la etiqueta de estado",
    "editor.title": "Título",
    "editor.tabSetup": "Configuración",
    "editor.tabEnergy": "Energía",
    "editor.tabDevices": "Dispositivos",
    "editor.tabEnvironment": "Ambiente",
    "editor.tabFloorplan": "Plano",
    "editor.tabLayout": "Diseño",
    "editor.tabAppearance": "Visualización",
    "editor.tabAdvisor": "Asesor",
    "editor.tabAdvanced": "Avanzado",
    "editor.tabs": "Secciones de configuración",
    "editor.statusConfigured": "{configured}/{total} configurados",
    "editor.statusConfiguredCount": "{count} configurados",
    "editor.statusHidden": "{count} ocultos",
    "editor.statusMissing": "faltan {count}",
    "editor.statusAdvanced": "Opciones avanzadas activas",
    "editor.statusReady": "Listo",
    "editor.layoutMode": "Modo de diseño",
    "editor.layoutHelp": "Haz clic en una caja en la vista previa y ajusta su posición X/Y.",
    "editor.layoutSelected": "Caja seleccionada",
    "editor.layoutEmpty": "Activa cajas de imagen o superposiciones para editar sus posiciones aquí.",
    "editor.layoutTypeBox": "Caja",
    "editor.layoutTypeOverlay": "Superposición",
    "editor.layoutTypeEnvironment": "Ambiente",
    "editor.sectionFloorplan": "Editor de plano",
    "editor.floorplanHelp": "Elige una herramienta, haz clic en la cuadrícula y luego ajusta el elemento seleccionado.",
    "editor.floorplanShowGrid": "Mostrar cuadrícula",
    "editor.floorplanTools": "Herramientas de plano",
    "editor.floorplanToolRoom": "Habitación",
    "editor.floorplanToolWall": "Pared",
    "editor.floorplanToolSensor": "Sensor",
    "editor.floorplanSelected": "Elemento seleccionado",
    "editor.floorplanLabel": "Etiqueta",
    "editor.floorplanWidth": "Ancho",
    "editor.floorplanHeight": "Alto",
    "editor.floorplanDelete": "Eliminar seleccionado",
    "editor.floorplanCustomEntity": "Entidad personalizada",
    "editor.floorplanSensorSource": "Fuente del sensor",
    "editor.floorplanEntity": "Entidad",
    "editor.floorplanEmpty": "Haz clic en la cuadrícula para crear el elemento seleccionado.",
    "editor.helpHomeAssistantSensor": "Elige la entidad de Home Assistant que proporciona este valor.",
    "editor.helpUnitAuto": "Usa Auto para mostrar la unidad reportada por Home Assistant. Elige otra unidad solo si quieres sobrescribirla.",
    "editor.helpEnergyCounter": "Contador acumulado opcional para las vistas 1h, 24h, mes, año y total.",
    "editor.helpSignedGrid": "Usa un sensor donde los valores positivos signifiquen importación y los negativos exportación. Déjalo vacío si usas sensores separados.",
    "editor.helpSignedBattery": "Usa un sensor con signo si es posible: positivo significa carga y negativo descarga.",
    "editor.helpFooterOrder": "Controla el orden de los mosaicos bajo la imagen. Los números más bajos aparecen antes.",
    "editor.helpTileWidth": "Controla el ancho del mosaico inferior en escritorio. En móvil se limita automáticamente.",
    "editor.helpImagePosition": "Posición de la caja sobre la imagen de la casa en porcentaje.",
    "editor.helpEnvironmentFooter": "Muestra este sensor como mosaico en la sección Ambiente bajo la imagen.",
    "editor.helpEnvironmentImage": "Muestra este sensor como caja HUD escalable sobre la imagen de la casa.",
    "editor.helpMaxPower": "Solo se usa para la barra de utilización y las comprobaciones de carga del asesor.",
    "editor.unit": "Unidad",
    "editor.voltageEntity": "Entidad de tensión",
    "editor.voltageEntityL1": "Entidad tensión L1",
    "editor.voltageEntityL2": "Entidad tensión L2",
    "editor.voltageEntityL3": "Entidad tensión L3",
    "editor.viewMode": "Vista predeterminada",
    "editor.weatherEntity": "Entidad meteorológica",
    "editor.setupWizard": "Asistente de configuración",
    "editor.setupIntro": "Ayuda con la configuración inicial sugiriendo sensores para FV, batería, inversor, cargador VE, red, consumo, clima y contadores kWh.",
    "editor.setupHelp": "Revisa las sugerencias antes de aplicarlas. Usa \"Rellenar campos vacíos\" para una primera pasada segura o \"Reemplazar campos detectados\" para sobrescribir asignaciones existentes.",
    "editor.setupEntityCount": "{count} entidades disponibles",
    "editor.setupNoEntities": "Abre este editor en Home Assistant para detectar entidades.",
    "editor.setupFillEmpty": "Rellenar campos vacíos",
    "editor.setupReplaceAll": "Reemplazar campos detectados",
    "editor.setupSuggestions": "Sugerencias detectadas",
    "editor.setupNoSuggestions": "Aún no se encontraron coincidencias fuertes.",
    "editor.setupApplyOne": "Usar",
    "editor.setupCurrent": "Actual",
    "editor.setupSuggested": "Sugerido",
    "editor.setupConfidence": "{score}% coincidencia",
    "editor.setupApplied": "Se aplicaron {count} sugerencia(s).",
    "editor.setupApplyNone": "No se modificaron campos vacíos.",
    "editor.xPosition": "Posición X",
    "editor.yPosition": "Posición Y",
    "flow.charge": "Entrante",
    "flow.discharge": "Saliente",
    "consumer.custom": "Personalizado",
    "consumer.customLarge": "Gran consumidor personalizado",
    "consumer.dhw_heatpump": "Bomba de calor de agua caliente",
    "consumer.dishwasher": "Lavavajillas",
    "consumer.dryer": "Secadora",
    "consumer.sectionTitle": "Otros grandes consumidores",
    "consumer.space_heater": "Calefactor",
    "consumer.washing_machine": "Lavadora",
    "environment.sectionTitle": "Ambiente",
    "environment.sensor": "Ambiente {index}",
    "environment.templateIndoor": "Temperatura interior",
    "environment.templateOutdoor": "Temperatura exterior",
    "environment.templateHotWater": "Agua caliente",
    "environment.templatePressure": "Presión",
    "environment.templateAirQuality": "Calidad del aire",
    "environment.templateCustom": "Personalizado",
    "floorplan.counts": "{rooms} habitaciones · {sensors} sensores",
    "floorplan.empty": "Crea habitaciones, paredes y sensores en el editor de la tarjeta.",
    "floorplan.label": "Plano",
    "floorplan.room": "Habitación {index}",
    "floorplan.sensor": "Sensor {index}",
    "floorplan.title": "Plano de la casa",
    "floorplan.wall": "Pared {index}",
    "house.apartment_building": "Edificio de apartamentos",
    "house.apartment_building_balcony_solar": "Edificio de apartamentos con solar de balcón",
    "house.bungalow": "Bungaló",
    "house.city_villa": "Villa urbana",
    "house.city_villa_pitched_roof": "Villa urbana con tejado inclinado",
    "house.duplex_house": "Casa dúplex",
    "house.single_family_home": "Casa unifamiliar",
    "house.terraced_middle_house": "Casa adosada central",
    "metrics.battery_level": "Batería",
    "metrics.grid_status": "Red",
    "metrics.house_consumption_power": "Consumo",
    "metrics.import_export_power": "Importación/exportación",
    "metrics.inverter_power": "Inversor",
    "metrics.pv_power": "Potencia FV",
    "metrics.pv_roof_power": "FV tejado",
    "metrics.pv_shed_power": "FV cobertizo",
    "metrics.pv_total_power": "FV total",
    "metrics.water_meter": "Agua",
    "metrics.wallbox_power": "Cargador VE",
    "metrics.wallbox2_power": "Cargador VE 2",
    "overlay.heatpump": "Bomba de calor",
    "overlay.smoke": "Gas",
    "phase.auto": "Auto",
    "phase.many": "{count} fases",
    "phase.one": "1 fase",
    "pvLabel.forecastToday": "Previsión hoy",
    "pvLabel.peakToday": "Pico hoy",
    "pvLabel.power": "Potencia",
    "pvLabel.todayEnergy": "Generado hoy",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "En vivo",
    "range.month": "1 mes",
    "range.total": "Total",
    "range.year": "1 año",
    "status.export": "Exportación",
    "status.import": "Importación",
    "status.lastUpdated": "Última actualización: {time}",
    "status.selfSufficient": "Autosuficiente",
    "status.weather": "Clima: {weather}",
    "tooltip.entity": "Entidad",
    "tooltip.flow": "Flujo",
    "tooltip.load": "Utilización",
    "tooltip.max": "Máximo",
    "tooltip.phases": "Fases",
    "tooltip.phaseChange": "Próximo cambio de fase",
    "tooltip.raw": "Valor bruto",
    "tooltip.remainingChargeTime": "Tiempo de carga restante",
    "tooltip.status": "Estado",
    "tooltip.temperature": "Temperatura",
    "tooltip.updated": "Actualizado",
    "tooltip.value": "Valor",
    "tooltip.vehicleSoc": "SoC del vehículo",
    "tooltip.voltage": "Tensión",
    "value.remainingChargeTime": "Quedan {value}",
    "value.phaseChangeIn": "{action} en {duration}",
    "value.temperature": "Temp {value}",
    "value.soon": "pronto",
    "view.advisor": "Panel del asesor",
    "view.house": "Vista de casa",
    "view.floorplan": "Plano",
    "view.charts": "Gráficos",
    "weather.clear": "Despejado",
    "weather.clear-night": "Despejado",
    "weather.cloudy": "Nublado",
    "weather.fog": "Niebla",
    "weather.hail": "Granizo",
    "weather.lightning": "Tormenta",
    "weather.lightning-rainy": "Tormenta con lluvia",
    "weather.partlycloudy": "Parcialmente nublado",
    "weather.pouring": "Lluvia intensa",
    "weather.rainy": "Lluvia",
    "weather.snowy": "Nieve",
    "weather.snowy-rainy": "Aguanieve",
    "weather.sunny": "Soleado",
    "weather.windy": "Ventoso",
    "weather.windy-variant": "Ventoso/nublado",
    "warning.batteryLow": "Batería baja",
    "warning.gridVoltageCritical": "Tensión de red demasiado alta",
    "warning.gridVoltageHigh": "Tensión de red alta",
    "warning.sensorMissing": "Entidad no encontrada",
    "warning.sensorOffline": "Sensor sin conexión",
    "warning.sensorUnavailable": "Sensor no disponible",
    "view.records": "Récords",
    "records.count": "{count} récords",
    "records.countOne": "{count} récord",
    "records.days": "{days} días",
    "records.empty": "Aún no hay historial evaluable.",
    "records.error": "No se pudieron cargar los récords.",
    "records.label": "Puntuaciones",
    "records.loadingCount": "{count} entidades",
    "records.loadingCountOne": "{count} entidad",
    "records.loadingPurposeConsumerPower": "Pico de consumo",
    "records.loadingPurposeCounter": "Incremento diario del contador",
    "records.loadingPurposePower": "Pico de potencia",
    "records.loadingPurposePvEnergy": "Rendimiento FV diario",
    "records.loadingPurposePvPower": "Potencia FV y horas solares",
    "records.loadingPurposeWallboxChargingEnabled": "Tiempo con carga habilitada",
    "records.loadingPurposeWallboxEnergy": "Energía cargada de wallbox",
    "records.loadingPurposeWallboxMaxSocLimit": "Límite de carga de wallbox",
    "records.loadingPurposeWallboxPhase": "Historial de fases de wallbox",
    "records.loadingPurposeWallboxPluggedIn": "Tiempo enchufado de wallbox",
    "records.loadingPurposeWallboxPower": "Potencia de carga de wallbox",
    "records.loadingPurposeWallboxSoc": "SoC del vehículo en wallbox",
    "records.loadingTitle": "Consultando historial",
    "records.loading": "Cargando récords…",
    "records.sectionPeaks": "Picos de potencia",
    "records.sectionPvEnergy": "Mejor rendimiento FV por string",
    "records.sectionSolarHours": "Horas solares más largas",
    "records.sectionWallbox": "Récords de wallbox",
    "records.subtitle": "Mejores valores de {range} del historial de Home Assistant.",
    "records.title": "Récords de energía",
    "records.range7d": "7 días",
    "records.range14d": "14 días",
    "records.range30d": "30 días",
    "records.rangeMonth": "Este mes",
    "records.rangeYear": "Este año",
    "records.range356d": "356 días",
    "records.consumerPeakPower": "{name}: mayor pico de consumo",
    "records.counterLargestIncrease": "{name}: mayor incremento diario del contador",
    "records.powerPeak": "{name}: mayor pico de potencia",
    "records.pvBestYield": "{name}: mejor rendimiento FV diario",
    "records.pvPeakPower": "{name}: mayor potencia FV",
    "records.solarLongestHours": "{name}: mayor tiempo de producción solar",
    "records.wallboxChargedEnergy": "{name}: mayor energía cargada",
    "records.wallboxChargingEnabled": "{name}: más tiempo con carga habilitada",
    "records.wallboxLongestCharge": "{name}: día de carga más largo",
    "records.wallboxMaxSoc": "{name}: SoC del vehículo más alto",
    "records.wallboxMaxSocLimit": "{name}: límite de carga más alto",
    "records.wallboxOnePhase": "{name}: más tiempo en 1 fase",
    "records.wallboxPeakPower": "{name}: mayor potencia de carga",
    "records.wallboxPluggedIn": "{name}: más tiempo enchufado",
    "records.wallboxThreePhase": "{name}: más tiempo en 3 fases",
    "records.sectionCounters": "Récords de contadores"
  },
  "fr": {
    "aria.energyRangeSelector": "Sélectionner la période de valeur",
    "aria.houseSelector": "Sélectionner une maison",
    "aria.viewSelector": "Sélectionner la vue du tableau de bord",
    "card.defaultTitle": "Flux d'énergie",
    "advisor.action": "Action",
    "advisor.autarky": "Autonomie",
    "advisor.actionHiddenToday": "Masqué aujourd’hui",
    "advisor.batteryIdle": "Battery is not charging while surplus is exported. Check battery limits or charge mode.",
    "advisor.batteryHighSocLong": "House battery has been between 90 and 100% for more than 120 minutes. Batteries should not stay that full for too long.",
    "advisor.batteryCyclesHigh": "House battery has completed several full cycles today. Frequent cycling can age the battery faster.",
    "advisor.batteryDeepSoc": "House battery SoC is very low. Protect the reserve and avoid additional flexible loads.",
    "advisor.batteryLow": "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible.",
    "advisor.batteryMaxReached": "Battery is at the configured max SoC. Additional PV is likely to be exported.",
    "advisor.batteryNearlyFull": "Battery is nearly full, so additional PV is likely to be exported.",
    "advisor.batteryReserveDischarging": "Battery is at or below reserve SoC and still discharging. Check min SoC or backup reserve settings.",
    "advisor.batteryStatus": "Batterie",
    "advisor.batteryTemperatureHigh": "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits.",
    "advisor.batteryTemperatureLow": "House battery temperature is low. Charging power may be limited and battery stress can increase.",
    "advisor.checkSensors": "Check unavailable or missing sensors so the energy balance stays reliable.",
    "advisor.configureConsumption": "Add a house consumption sensor to improve autarky and load analysis.",
    "advisor.configureGrid": "Add grid import/export sensors for better advice about surplus and grid draw.",
    "advisor.configurePvTotal": "Add PV total power or roof/shed PV sensors to improve production analysis.",
    "advisor.consumption": "Charge",
    "advisor.detailEntities": "Entités",
    "advisor.detailEntityValue": "{entity} currently reports {value} for {label}. {impact}",
    "advisor.detailIntro": "The Advisor shows this as {priority} for {window}, because {reason}",
    "advisor.detailSignals": "Signaux de décision",
    "advisor.detailSources": "Sources de données",
    "advisor.detailValues": "Valeurs",
    "advisor.detailValueOnly": "{label} is currently {value}. {impact}",
    "advisor.detailWhy": "Pourquoi cet avis apparaît",
    "advisor.detailsToggle": "Afficher les détails",
    "advisor.dismissToday": "Masquer aujourd’hui",
    "advisor.evChargingGrid": "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended.",
    "advisor.evChargingPv": "EV charging is currently covered well by PV or stored energy.",
    "advisor.evEnableCharging": "Charging is currently disabled. Enable charging if you want to use the PV surplus.",
    "advisor.evPlugIn": "Plug in the vehicle to use PV surplus for charging.",
    "advisor.evPhaseChangeScheduled": "{action} in {duration} if the PV situation does not change.",
    "advisor.evSocAbove80Long": "Vehicle SoC is above 80% for more than 120 minutes. This can stress the battery if it stays there too long.",
    "advisor.evSocAbove90Long": "Vehicle SoC is above 90% for more than 60 minutes. Stop charging or lower the target SoC if the car will stay parked.",
    "advisor.evTargetReached": "Vehicle is already at the configured target SoC. Use surplus for another flexible load.",
    "advisor.evTargetReachedGrid": "Vehicle is at target SoC while the charger is still drawing power. Check the charge limit or stop charging.",
    "advisor.exporting": "Injection",
    "advisor.grid": "Réseau",
    "advisor.gridImportExportSimultaneous": "Import and export sensors report power at the same time. Check whether the split grid sensors are mapped correctly.",
    "advisor.gridImportFullBattery": "Grid import is high although the house battery is full. Check discharge limits, backup reserve, or battery mode.",
    "advisor.headlineExport": "Un surplus PV est disponible",
    "advisor.headlineImport": "L’import réseau est actif",
    "advisor.headlineInfo": "Informations disponibles",
    "advisor.headlineNeutral": "Le flux d’énergie est équilibré",
    "advisor.headlineSetup": "Plus de capteurs permettent de meilleurs conseils",
    "advisor.headlineWarning": "La configuration énergétique nécessite votre attention",
    "advisor.highLoad": "Current load is high compared with PV production. Check large consumers if this is unexpected.",
    "advisor.importing": "Import",
    "advisor.priorityCritical": "Critique",
    "advisor.priorityInfo": "Info",
    "advisor.priorityOpportunity": "Opportunité",
    "advisor.prioritySetup": "Configuration",
    "advisor.prioritySuccess": "OK",
    "advisor.priorityWarning": "Avertissement",
    "advisor.electricityPrice": "Prix de l’électricité",
    "advisor.lowPv": "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors.",
    "advisor.noAdvice": "Aucune action urgente pour le moment.",
    "advisor.appliances": "Appareils",
    "advisor.largeConsumerCovered": "Large consumers are running without relevant grid import.",
    "advisor.largeConsumerGrid": "{names} currently draw power while grid import is active. Shift them to PV surplus if possible.",
    "advisor.largeConsumerSurplus": "PV surplus can cover {names}. Start a ready large consumer while export is active.",
    "advisor.panelTitle": "Conseiller énergie",
    "advisor.pv": "PV",
    "advisor.recommendations": "Recommandations",
    "advisor.runAppliance": "Run a flexible household appliance now if it is waiting.",
    "advisor.sensorStaleMany": "{count} sensors have not updated recently. Check entity availability and recorder/update intervals.",
    "advisor.sensorStaleOne": "{name} has not updated for {duration}. Check entity availability and update interval.",
    "advisor.sensors": "Capteurs",
    "advisor.selfConsumption": "Autoconsommation",
    "advisor.selfSufficient": "Autonome",
    "advisor.startEvCharging": "Start or increase EV charging while surplus is available.",
    "advisor.status": "État",
    "advisor.suggestionCountOne": "{count} suggestion",
    "advisor.suggestionCount": "{count} suggestions",
    "advisor.surplus": "Surplus",
    "advisor.surplusGeneral": "PV surplus is available. Prioritize flexible loads while export is active.",
    "advisor.unknown": "Inconnu",
    "advisor.useHeatPump": "Use heat pump boost or preheat hot water while PV surplus is available.",
    "advisor.wallbox": "VE",
    "advisor.weather": "Météo",
    "advisor.windowAnytime": "À tout moment",
    "advisor.windowNext2h": "Prochaines 2 h",
    "advisor.windowNow": "Maintenant",
    "advisor.reasonBattery": "Battery SoC {soc} is part of this recommendation.",
    "advisor.reasonEvSurplus": "PV surplus is above the configured EV threshold of {threshold}.",
    "advisor.reasonGridImport": "Grid import is above the configured import threshold of {threshold}.",
    "advisor.reasonLargeConsumer": "The available PV surplus can cover the configured consumer limit.",
    "advisor.reasonPhaseChange": "EVCC reports a planned phase change inside the next window.",
    "advisor.reasonSensor": "A configured entity is stale, unavailable, or inconsistent.",
    "advisor.reasonSurplus": "PV surplus is above the configured surplus threshold of {threshold}.",
    "advisor.reasonWeather": "Weather is included to separate low PV from expected conditions.",
    "advisor.reasonPrice": "The configured electricity price sensor is included in the decision context.",
    "advisor.impactAutarky": "That shows how independently the house is currently being supplied.",
    "advisor.impactBattery": "That value describes the current battery reserve and influences whether flexible loads are sensible right now.",
    "advisor.impactConsumer": "That value shows whether this consumer is active and how strongly it affects the energy balance.",
    "advisor.impactGrid": "That value decides whether the situation is treated as grid import, neutral, or PV surplus.",
    "advisor.impactLoad": "That value describes the current household load and helps classify whether consumption is unusually high.",
    "advisor.impactPv": "That value describes the current PV production and helps estimate how much energy is available.",
    "advisor.impactSelfConsumption": "That shows how much PV energy is being used locally instead of being exported.",
    "advisor.impactSensor": "That value is used as a diagnostic signal for sensor freshness and plausibility.",
    "advisor.impactSurplus": "That value shows how much power is currently available for flexible loads before it is exported.",
    "advisor.impactTemperature": "That value is used to detect possible battery stress or operating limits.",
    "advisor.impactWallbox": "That value describes the charger state and determines whether charging should start, stop, or wait.",
    "editor.showViewSelector": "Afficher le sélecteur de vue",
    "chart.close": "Fermer",
    "chart.empty": "Aucune donnée historique trouvée",
    "chart.error": "Impossible de charger l'historique",
    "chart.loading": "Chargement de l'historique…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Dernières {hours} heures",
    "charts.count": "{count} graphiques",
    "charts.countOne": "{count} graphique",
    "charts.empty": "Aucune entité avec historique n'est encore configurée.",
    "charts.label": "Graphiques",
    "charts.openLarge": "Ouvrir le grand graphique",
    "charts.sectionPvStrings": "Strings PV",
    "charts.sectionInverters": "Onduleurs",
    "charts.sectionSystem": "Onduleur et système",
    "charts.sectionWallbox": "Wallbox",
    "charts.title": "Historique des entités",
    "editor.customDayImage": "Image de jour personnalisée",
    "editor.customImage": "Image personnalisée",
    "editor.batteryChargeEntity": "Entité de charge batterie",
    "editor.batteryCyclesTodayEntity": "Entité cycles batterie aujourd’hui",
    "editor.batteryDischargeEntity": "Entité de décharge batterie",
    "editor.batteryFlowEntity": "Entité de flux batterie (+/-)",
    "editor.batteryMaxSocEntity": "Entité SoC max. batterie",
    "editor.batteryMinSocEntity": "Entité SoC min. batterie",
    "editor.batteryTemperatureEntity": "Entité température batterie",
    "editor.entity": "Entité",
    "editor.entityPlaceholder": "Entité {label}",
    "editor.energy1hEntity": "Entité kWh 1h",
    "editor.energy24hEntity": "Entité kWh 24h",
    "editor.energyCounterEntity": "Entité compteur kWh",
    "editor.energyMonthEntity": "Entité kWh 1 mois",
    "editor.energyRangeOverride": "Capteurs de période directs optionnels",
    "editor.energyYearEntity": "Entité kWh 1 an",
    "editor.energyTotalEntity": "Entité kWh total",
    "editor.liveEntity": "Entité directe",
    "editor.houseType": "Type de maison",
    "editor.hudBoxOpacity": "Opacité des boîtes HUD",
    "editor.hudBoxScale": "Échelle des boîtes HUD",
    "editor.advisorEvSurplusThreshold": "Seuil de surplus VE (W)",
    "editor.electricityPriceEntity": "Entité prix de l’électricité",
    "editor.gridVoltageCriticalThreshold": "Tension réseau critique (V)",
    "editor.gridVoltageWarningThreshold": "Tension réseau élevée (V)",
    "editor.importExportEntity": "Entité import/export",
    "editor.importExportSignedEntity": "Entité import/export signée (+/-)",
    "editor.importPowerEntity": "Entité import",
    "editor.exportPowerEntity": "Entité export",
    "editor.importExportLabels": "Libellés import/export",
    "editor.importLabel": "Libellé import",
    "editor.exportLabel": "Libellé export",
    "editor.neutralLabel": "Libellé autonomie",
    "editor.environmentAdd": "Ajouter une tuile",
    "editor.environmentEntity": "Entité du capteur",
    "editor.environmentLabel": "Libellé du capteur",
    "editor.environmentShow": "Afficher la tuile {label}",
    "editor.environmentShowFooter": "Afficher la boîte dans le pied",
    "editor.environmentShowImage": "Afficher la boîte dans l'image",
    "editor.environmentTemplates": "Modèles d'environnement",
    "editor.environmentUnit": "Unité affichée",
    "editor.kpiAdd": "Ajouter une tuile",
    "editor.kpiColor": "Couleur",
    "editor.kpiColumns": "Largeur de tuile",
    "editor.kpiEntity": "Entité KPI",
    "editor.kpiLabel": "Libellé KPI",
    "editor.kpiPosition": "Position de tuile",
    "editor.kpiRemove": "Supprimer",
    "editor.kpiStaticValue": "Valeur fixe",
    "editor.consumerEnergyEntity": "Entité compteur kWh",
    "editor.consumerLabel": "Nom de l’appareil",
    "editor.consumerAddCustom": "Ajouter un gros consommateur personnalisé",
    "editor.consumerPowerEntity": "Entité de puissance",
    "editor.consumerShow": "Afficher la tuile {label}",
    "editor.labelHideDesktop": "Masquer sur bureau",
    "editor.labelHideMobile": "Masquer sur mobile",
    "editor.labelOptions": "Affichage des libellés",
    "editor.labelShowFooter": "Afficher le libellé dans les KPI inférieurs",
    "editor.labelShowImage": "Afficher le libellé dans l’image",
    "editor.maxPowerKw": "Puissance max. (kW/kWp)",
    "editor.optionalDayImage": "Image de jour optionnelle",
    "editor.powerDecimals": "Décimales de puissance",
    "editor.powerDisplayMode": "Mode d'affichage de la puissance",
    "editor.rawMode": "Valeur brute + unité configurée",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.advisorMaxSuggestions": "Suggestions du conseiller",
    "editor.overlayEnable": "Afficher {label}",
    "editor.overlayLabel": "Libellé",
    "editor.overlayOrientation": "Orientation",
    "editor.overlayOrientationLeft": "Côté gauche",
    "editor.overlayOrientationRight": "Côté droit",
    "editor.overlayPeriod": "Période",
    "editor.overlaySize": "Taille",
    "editor.period1h": "1 heure",
    "editor.period24h": "24 heures",
    "editor.period30m": "30 minutes",
    "editor.phaseActionEntity": "Entité prochaine action de phase",
    "editor.phaseEntity": "Entité phases",
    "editor.phaseRemainingEntity": "Entité secondes restantes de phase",
    "editor.pvForecastTodayEntity": "Entité prévision du jour",
    "editor.pvLabels": "Libellés PV",
    "editor.pvPeakTodayEntity": "Entité pic du jour",
    "editor.pvPowerLabel": "Libellé puissance",
    "editor.pvRoofStringAdd": "Ajouter un string",
    "editor.pvRoofStringDisplay": "Affichage des strings PV toiture",
    "editor.pvRoofStringDisplayDominant": "String le plus fort grand, autres petits",
    "editor.pvRoofStringDisplaySum": "Additionner les strings",
    "editor.pvRoofStringDisplayValues": "Afficher les valeurs des strings",
    "editor.pvRoofStringEnergyEntity": "Entité compteur kWh du string",
    "editor.pvRoofStringLabel": "Nom du string",
    "editor.pvRoofStringPowerEntity": "Entité puissance du string",
    "editor.pvRoofStrings": "Strings PV toiture",
    "editor.inverterAdd": "Ajouter un onduleur",
    "editor.inverterDisplay": "Affichage des onduleurs",
    "editor.inverterDisplayDominant": "Onduleur le plus fort grand, autres petits",
    "editor.inverterDisplaySum": "Additionner les onduleurs",
    "editor.inverterDisplayValues": "Afficher les valeurs des onduleurs",
    "editor.inverterEnergyEntity": "Entité compteur kWh de l'onduleur",
    "editor.inverterLabel": "Nom de l'onduleur",
    "editor.inverterPowerEntity": "Entité puissance de l'onduleur",
    "editor.inverters": "Onduleurs",
    "editor.pvTodayEnergyEntity": "Entité production du jour",
    "editor.remainingChargeTimeEntity": "Entité temps de charge restant",
    "editor.vehicleChargingEnabledEntity": "Entité charge activée",
    "editor.vehicleConnectedEntity": "Entité véhicule connecté",
    "editor.vehicleMaxSocEntity": "Entité SoC max./cible du véhicule",
    "editor.vehicleSocEntity": "Entité SoC véhicule",
    "editor.sectionBoxes": "Boîtes, entités directes/kWh, unité et position",
    "editor.sectionAdvisor": "Conseiller et prix",
    "editor.sectionAppearance": "Affichage et limites",
    "editor.sectionGeneral": "Paramètres généraux",
    "editor.sectionKpis": "Tuiles KPI personnalisées",
    "editor.sectionEnvironmentSensors": "Capteurs d'environnement",
    "editor.sectionLargeConsumers": "Autres gros consommateurs",
    "editor.sectionOverlays": "Superpositions d'image",
    "editor.showBox": "Afficher {label}",
    "editor.showEnergyRangeSelector": "Afficher le sélecteur direct/1h/24h/mois/an/total",
    "editor.showHouseSelector": "Afficher le sélecteur de maison",
    "editor.showEnvironmentSensors": "Afficher les tuiles de capteurs d'environnement",
    "editor.showLargeConsumers": "Afficher les gros consommateurs dans la vue maison",
    "editor.showGridStatusTile": "Afficher la tuile réseau",
    "editor.showMetricTiles": "Afficher les boîtes de mesure sous l'image",
    "editor.showPowerFlows": "Afficher les flux d'énergie animés",
    "editor.showStatusLabel": "Afficher le libellé d'état dans l'image",
    "editor.showTitle": "Afficher le titre",
    "editor.showWeatherStatus": "Afficher la météo actuelle dans le libellé d'état",
    "editor.title": "Titre",
    "editor.tabSetup": "Configuration",
    "editor.tabEnergy": "Énergie",
    "editor.tabDevices": "Appareils",
    "editor.tabEnvironment": "Environnement",
    "editor.tabFloorplan": "Plan",
    "editor.tabLayout": "Disposition",
    "editor.tabAppearance": "Affichage",
    "editor.tabAdvisor": "Conseiller",
    "editor.tabAdvanced": "Avancé",
    "editor.tabs": "Sections de configuration",
    "editor.statusConfigured": "{configured}/{total} configurés",
    "editor.statusConfiguredCount": "{count} configurés",
    "editor.statusHidden": "{count} masqués",
    "editor.statusMissing": "{count} manquants",
    "editor.statusAdvanced": "Options avancées actives",
    "editor.statusReady": "Prêt",
    "editor.layoutMode": "Mode disposition",
    "editor.layoutHelp": "Cliquez sur une boîte dans l'aperçu, puis ajustez sa position X/Y.",
    "editor.layoutSelected": "Boîte sélectionnée",
    "editor.layoutEmpty": "Activez des boîtes d'image ou des superpositions pour modifier leurs positions ici.",
    "editor.layoutTypeBox": "Boîte",
    "editor.layoutTypeOverlay": "Superposition",
    "editor.layoutTypeEnvironment": "Environnement",
    "editor.sectionFloorplan": "Éditeur de plan",
    "editor.floorplanHelp": "Choisissez un outil, cliquez dans la grille, puis ajustez l'élément sélectionné.",
    "editor.floorplanShowGrid": "Afficher la grille",
    "editor.floorplanTools": "Outils de plan",
    "editor.floorplanToolRoom": "Pièce",
    "editor.floorplanToolWall": "Mur",
    "editor.floorplanToolSensor": "Capteur",
    "editor.floorplanSelected": "Élément sélectionné",
    "editor.floorplanLabel": "Libellé",
    "editor.floorplanWidth": "Largeur",
    "editor.floorplanHeight": "Hauteur",
    "editor.floorplanDelete": "Supprimer la sélection",
    "editor.floorplanCustomEntity": "Entité personnalisée",
    "editor.floorplanSensorSource": "Source du capteur",
    "editor.floorplanEntity": "Entité",
    "editor.floorplanEmpty": "Cliquez dans la grille pour créer l'élément sélectionné.",
    "editor.helpHomeAssistantSensor": "Choisissez l'entité Home Assistant qui fournit cette valeur.",
    "editor.helpUnitAuto": "Utilisez Auto pour afficher l'unité fournie par Home Assistant. Choisissez une autre unité seulement si vous voulez la remplacer.",
    "editor.helpEnergyCounter": "Compteur d'énergie cumulée optionnel pour les vues 1h, 24h, mois, année et total.",
    "editor.helpSignedGrid": "Utilisez un capteur où les valeurs positives signifient import et les valeurs négatives export. Laissez vide si vous utilisez deux capteurs.",
    "editor.helpSignedBattery": "Utilisez un capteur signé si possible : positif signifie charge, négatif décharge.",
    "editor.helpFooterOrder": "Contrôle l'ordre des tuiles sous l'image. Les nombres plus bas apparaissent plus tôt.",
    "editor.helpTileWidth": "Contrôle la largeur de la tuile inférieure sur bureau. Sur mobile, elle est limitée automatiquement.",
    "editor.helpImagePosition": "Position de la boîte sur l'image de la maison en pourcentage.",
    "editor.helpEnvironmentFooter": "Affiche ce capteur comme tuile dans la section Environnement sous l'image.",
    "editor.helpEnvironmentImage": "Affiche ce capteur comme boîte HUD redimensionnable sur l'image de la maison.",
    "editor.helpMaxPower": "Utilisé seulement pour la barre d'utilisation et les contrôles de charge du conseiller.",
    "editor.unit": "Unité",
    "editor.voltageEntity": "Entité tension",
    "editor.voltageEntityL1": "Entité tension L1",
    "editor.voltageEntityL2": "Entité tension L2",
    "editor.voltageEntityL3": "Entité tension L3",
    "editor.viewMode": "Vue par défaut",
    "editor.weatherEntity": "Entité météo",
    "editor.setupWizard": "Assistant de configuration",
    "editor.setupIntro": "Aide à la première configuration en suggérant des capteurs pour PV, batterie, onduleur, borne VE, réseau, consommation, météo et compteurs kWh.",
    "editor.setupHelp": "Vérifiez les suggestions avant de les appliquer. Utilisez « Remplir les champs vides » pour un premier passage sûr ou « Remplacer les champs détectés » pour écraser les affectations existantes.",
    "editor.setupEntityCount": "{count} entités disponibles",
    "editor.setupNoEntities": "Ouvrez cet éditeur dans Home Assistant pour détecter les entités.",
    "editor.setupFillEmpty": "Remplir les champs vides",
    "editor.setupReplaceAll": "Remplacer les champs détectés",
    "editor.setupSuggestions": "Suggestions détectées",
    "editor.setupNoSuggestions": "Aucune correspondance forte trouvée pour le moment.",
    "editor.setupApplyOne": "Utiliser",
    "editor.setupCurrent": "Actuel",
    "editor.setupSuggested": "Suggéré",
    "editor.setupConfidence": "{score}% de correspondance",
    "editor.setupApplied": "{count} suggestion(s) appliquée(s).",
    "editor.setupApplyNone": "Aucun champ vide n’a été modifié.",
    "editor.xPosition": "Position X",
    "editor.yPosition": "Position Y",
    "flow.charge": "Entrant",
    "flow.discharge": "Sortant",
    "consumer.custom": "Personnalisé",
    "consumer.customLarge": "Grand consommateur personnalisé",
    "consumer.dhw_heatpump": "Pompe à chaleur eau chaude",
    "consumer.dishwasher": "Lave-vaisselle",
    "consumer.dryer": "Sèche-linge",
    "consumer.sectionTitle": "Autres gros consommateurs",
    "consumer.space_heater": "Chauffage soufflant",
    "consumer.washing_machine": "Lave-linge",
    "environment.sectionTitle": "Environnement",
    "environment.sensor": "Environnement {index}",
    "environment.templateIndoor": "Température intérieure",
    "environment.templateOutdoor": "Température extérieure",
    "environment.templateHotWater": "Eau chaude",
    "environment.templatePressure": "Pression",
    "environment.templateAirQuality": "Qualité de l'air",
    "environment.templateCustom": "Personnalisé",
    "floorplan.counts": "{rooms} pièces · {sensors} capteurs",
    "floorplan.empty": "Créez des pièces, murs et capteurs dans l'éditeur de carte.",
    "floorplan.label": "Plan",
    "floorplan.room": "Pièce {index}",
    "floorplan.sensor": "Capteur {index}",
    "floorplan.title": "Plan de la maison",
    "floorplan.wall": "Mur {index}",
    "house.apartment_building": "Immeuble d'appartements",
    "house.apartment_building_balcony_solar": "Immeuble avec solaire de balcon",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Villa urbaine",
    "house.city_villa_pitched_roof": "Villa urbaine avec toit incliné",
    "house.duplex_house": "Maison duplex",
    "house.single_family_home": "Maison individuelle",
    "house.terraced_middle_house": "Maison mitoyenne centrale",
    "metrics.battery_level": "Batterie",
    "metrics.grid_status": "Réseau",
    "metrics.house_consumption_power": "Consommation",
    "metrics.import_export_power": "Import/export",
    "metrics.inverter_power": "Onduleur",
    "metrics.pv_power": "Puissance PV",
    "metrics.pv_roof_power": "PV toiture",
    "metrics.pv_shed_power": "PV abri",
    "metrics.pv_total_power": "PV total",
    "metrics.water_meter": "Eau",
    "metrics.wallbox_power": "Chargeur VE",
    "metrics.wallbox2_power": "Chargeur VE 2",
    "overlay.heatpump": "Pompe à chaleur",
    "overlay.smoke": "Gaz",
    "phase.auto": "Auto",
    "phase.many": "{count} phases",
    "phase.one": "1 phase",
    "pvLabel.forecastToday": "Prévision aujourd’hui",
    "pvLabel.peakToday": "Pic aujourd’hui",
    "pvLabel.power": "Puissance",
    "pvLabel.todayEnergy": "Produit aujourd’hui",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Direct",
    "range.month": "1 mois",
    "range.total": "Total",
    "range.year": "1 an",
    "status.export": "Export",
    "status.import": "Import",
    "status.lastUpdated": "Dernière mise à jour : {time}",
    "status.selfSufficient": "Autonome",
    "status.weather": "Météo : {weather}",
    "tooltip.entity": "Entité",
    "tooltip.flow": "Flux",
    "tooltip.load": "Utilisation",
    "tooltip.max": "Maximum",
    "tooltip.phases": "Phases",
    "tooltip.phaseChange": "Prochain changement de phase",
    "tooltip.raw": "Valeur brute",
    "tooltip.remainingChargeTime": "Temps de charge restant",
    "tooltip.status": "État",
    "tooltip.temperature": "Température",
    "tooltip.updated": "Mis à jour",
    "tooltip.value": "Valeur",
    "tooltip.vehicleSoc": "SoC véhicule",
    "tooltip.voltage": "Tension",
    "value.remainingChargeTime": "{value} restant",
    "value.phaseChangeIn": "{action} dans {duration}",
    "value.temperature": "Temp {value}",
    "value.soon": "bientôt",
    "view.advisor": "Tableau conseiller",
    "view.house": "Vue maison",
    "view.floorplan": "Plan",
    "view.charts": "Graphiques",
    "weather.clear": "Dégagé",
    "weather.clear-night": "Dégagé",
    "weather.cloudy": "Nuageux",
    "weather.fog": "Brouillard",
    "weather.hail": "Grêle",
    "weather.lightning": "Orage",
    "weather.lightning-rainy": "Orage avec pluie",
    "weather.partlycloudy": "Partiellement nuageux",
    "weather.pouring": "Forte pluie",
    "weather.rainy": "Pluvieux",
    "weather.snowy": "Neige",
    "weather.snowy-rainy": "Neige fondue",
    "weather.sunny": "Ensoleillé",
    "weather.windy": "Venteux",
    "weather.windy-variant": "Venteux/nuageux",
    "warning.batteryLow": "Batterie faible",
    "warning.gridVoltageCritical": "Tension réseau beaucoup trop élevée",
    "warning.gridVoltageHigh": "Tension réseau élevée",
    "warning.sensorMissing": "Entité introuvable",
    "warning.sensorOffline": "Capteur hors ligne",
    "warning.sensorUnavailable": "Capteur indisponible",
    "view.records": "Records",
    "records.count": "{count} records",
    "records.countOne": "{count} record",
    "records.days": "{days} jours",
    "records.empty": "Aucun historique exploitable pour le moment.",
    "records.error": "Les records n’ont pas pu être chargés.",
    "records.label": "High scores",
    "records.loadingCount": "{count} entités",
    "records.loadingCountOne": "{count} entité",
    "records.loadingPurposeConsumerPower": "Pic de consommation",
    "records.loadingPurposeCounter": "Hausse quotidienne du compteur",
    "records.loadingPurposePower": "Pic de puissance",
    "records.loadingPurposePvEnergy": "Rendement PV journalier",
    "records.loadingPurposePvPower": "Puissance PV et heures solaires",
    "records.loadingPurposeWallboxChargingEnabled": "Temps de charge autorisée",
    "records.loadingPurposeWallboxEnergy": "Énergie chargée wallbox",
    "records.loadingPurposeWallboxMaxSocLimit": "Limite de charge wallbox",
    "records.loadingPurposeWallboxPhase": "Historique des phases wallbox",
    "records.loadingPurposeWallboxPluggedIn": "Temps branché wallbox",
    "records.loadingPurposeWallboxPower": "Puissance de charge wallbox",
    "records.loadingPurposeWallboxSoc": "SoC véhicule wallbox",
    "records.loadingTitle": "Consultation de l’historique",
    "records.loading": "Chargement des records…",
    "records.sectionPeaks": "Pics de puissance",
    "records.sectionPvEnergy": "Meilleur rendement PV par string",
    "records.sectionSolarHours": "Plus longues heures solaires",
    "records.sectionWallbox": "Records wallbox",
    "records.subtitle": "Meilleures valeurs pour {range} depuis l’historique Home Assistant.",
    "records.title": "Records d’énergie",
    "records.range7d": "7 jours",
    "records.range14d": "14 jours",
    "records.range30d": "30 jours",
    "records.rangeMonth": "Ce mois-ci",
    "records.rangeYear": "Cette année",
    "records.range356d": "356 jours",
    "records.consumerPeakPower": "{name}: plus grand pic de consommation",
    "records.counterLargestIncrease": "{name}: plus forte hausse quotidienne du compteur",
    "records.powerPeak": "{name}: plus grand pic de puissance",
    "records.pvBestYield": "{name}: meilleur rendement PV journalier",
    "records.pvPeakPower": "{name}: puissance PV maximale",
    "records.solarLongestHours": "{name}: plus longue durée de production solaire",
    "records.wallboxChargedEnergy": "{name}: énergie chargée maximale",
    "records.wallboxChargingEnabled": "{name}: plus longue durée de charge autorisée",
    "records.wallboxLongestCharge": "{name}: journée de charge la plus longue",
    "records.wallboxMaxSoc": "{name}: SoC véhicule maximal",
    "records.wallboxMaxSocLimit": "{name}: limite de charge maximale",
    "records.wallboxOnePhase": "{name}: plus longue durée en 1 phase",
    "records.wallboxPeakPower": "{name}: puissance de charge maximale",
    "records.wallboxPluggedIn": "{name}: plus longue durée branchée",
    "records.wallboxThreePhase": "{name}: plus longue durée en 3 phases",
    "records.sectionCounters": "Records de compteurs"
  },
  "pl": {
    "aria.energyRangeSelector": "Wybierz zakres wartości",
    "aria.houseSelector": "Wybierz dom",
    "aria.viewSelector": "Wybierz widok panelu",
    "card.defaultTitle": "Przepływ energii",
    "advisor.action": "Akcja",
    "advisor.autarky": "Samowystarczalność",
    "advisor.actionHiddenToday": "Ukryte na dziś",
    "advisor.batteryIdle": "Battery is not charging while surplus is exported. Check battery limits or charge mode.",
    "advisor.batteryHighSocLong": "House battery has been between 90 and 100% for more than 120 minutes. Batteries should not stay that full for too long.",
    "advisor.batteryCyclesHigh": "House battery has completed several full cycles today. Frequent cycling can age the battery faster.",
    "advisor.batteryDeepSoc": "House battery SoC is very low. Protect the reserve and avoid additional flexible loads.",
    "advisor.batteryLow": "Battery is low. Keep an eye on backup reserve and avoid flexible loads if possible.",
    "advisor.batteryMaxReached": "Battery is at the configured max SoC. Additional PV is likely to be exported.",
    "advisor.batteryNearlyFull": "Battery is nearly full, so additional PV is likely to be exported.",
    "advisor.batteryReserveDischarging": "Battery is at or below reserve SoC and still discharging. Check min SoC or backup reserve settings.",
    "advisor.batteryStatus": "Bateria",
    "advisor.batteryTemperatureHigh": "House battery temperature is high. Check cooling, ventilation, or inverter/battery limits.",
    "advisor.batteryTemperatureLow": "House battery temperature is low. Charging power may be limited and battery stress can increase.",
    "advisor.checkSensors": "Check unavailable or missing sensors so the energy balance stays reliable.",
    "advisor.configureConsumption": "Add a house consumption sensor to improve autarky and load analysis.",
    "advisor.configureGrid": "Add grid import/export sensors for better advice about surplus and grid draw.",
    "advisor.configurePvTotal": "Add PV total power or roof/shed PV sensors to improve production analysis.",
    "advisor.consumption": "Obciążenie",
    "advisor.detailEntities": "Encje",
    "advisor.detailEntityValue": "{entity} currently reports {value} for {label}. {impact}",
    "advisor.detailIntro": "The Advisor shows this as {priority} for {window}, because {reason}",
    "advisor.detailSignals": "Sygnały decyzyjne",
    "advisor.detailSources": "Źródła danych",
    "advisor.detailValues": "Wartości",
    "advisor.detailValueOnly": "{label} is currently {value}. {impact}",
    "advisor.detailWhy": "Dlaczego pojawia się ta wskazówka",
    "advisor.detailsToggle": "Pokaż szczegóły",
    "advisor.dismissToday": "Ukryj dziś",
    "advisor.evChargingGrid": "EV charging is active while importing from the grid. Reduce charging power or wait for more PV if this is not intended.",
    "advisor.evChargingPv": "EV charging is currently covered well by PV or stored energy.",
    "advisor.evEnableCharging": "Charging is currently disabled. Enable charging if you want to use the PV surplus.",
    "advisor.evPlugIn": "Plug in the vehicle to use PV surplus for charging.",
    "advisor.evPhaseChangeScheduled": "{action} in {duration} if the PV situation does not change.",
    "advisor.evSocAbove80Long": "Vehicle SoC is above 80% for more than 120 minutes. This can stress the battery if it stays there too long.",
    "advisor.evSocAbove90Long": "Vehicle SoC is above 90% for more than 60 minutes. Stop charging or lower the target SoC if the car will stay parked.",
    "advisor.evTargetReached": "Vehicle is already at the configured target SoC. Use surplus for another flexible load.",
    "advisor.evTargetReachedGrid": "Vehicle is at target SoC while the charger is still drawing power. Check the charge limit or stop charging.",
    "advisor.exporting": "Eksport",
    "advisor.grid": "Sieć",
    "advisor.gridImportExportSimultaneous": "Import and export sensors report power at the same time. Check whether the split grid sensors are mapped correctly.",
    "advisor.gridImportFullBattery": "Grid import is high although the house battery is full. Check discharge limits, backup reserve, or battery mode.",
    "advisor.headlineExport": "Dostępna jest nadwyżka PV",
    "advisor.headlineImport": "Aktywny jest pobór z sieci",
    "advisor.headlineInfo": "Dostępne informacje",
    "advisor.headlineNeutral": "Przepływ energii jest zrównoważony",
    "advisor.headlineSetup": "Więcej czujników daje lepsze wskazówki",
    "advisor.headlineWarning": "Konfiguracja energii wymaga uwagi",
    "advisor.highLoad": "Current load is high compared with PV production. Check large consumers if this is unexpected.",
    "advisor.importing": "Pobór",
    "advisor.priorityCritical": "Krytyczne",
    "advisor.priorityInfo": "Info",
    "advisor.priorityOpportunity": "Szansa",
    "advisor.prioritySetup": "Konfiguracja",
    "advisor.prioritySuccess": "OK",
    "advisor.priorityWarning": "Ostrzeżenie",
    "advisor.electricityPrice": "Cena energii",
    "advisor.lowPv": "PV production is low despite daylight. If the weather is clear, check inverter or PV sensors.",
    "advisor.noAdvice": "Brak pilnych działań w tej chwili.",
    "advisor.appliances": "Urządzenia",
    "advisor.largeConsumerCovered": "Large consumers are running without relevant grid import.",
    "advisor.largeConsumerGrid": "{names} currently draw power while grid import is active. Shift them to PV surplus if possible.",
    "advisor.largeConsumerSurplus": "PV surplus can cover {names}. Start a ready large consumer while export is active.",
    "advisor.panelTitle": "Doradca energii",
    "advisor.pv": "PV",
    "advisor.recommendations": "Rekomendacje",
    "advisor.runAppliance": "Run a flexible household appliance now if it is waiting.",
    "advisor.sensorStaleMany": "{count} sensors have not updated recently. Check entity availability and recorder/update intervals.",
    "advisor.sensorStaleOne": "{name} has not updated for {duration}. Check entity availability and update interval.",
    "advisor.sensors": "Czujniki",
    "advisor.selfConsumption": "Zużycie własne",
    "advisor.selfSufficient": "Samowystarczalny",
    "advisor.startEvCharging": "Start or increase EV charging while surplus is available.",
    "advisor.status": "Status",
    "advisor.suggestionCountOne": "{count} sugestia",
    "advisor.suggestionCount": "{count} sugestii",
    "advisor.surplus": "Nadwyżka",
    "advisor.surplusGeneral": "PV surplus is available. Prioritize flexible loads while export is active.",
    "advisor.unknown": "Nieznane",
    "advisor.useHeatPump": "Use heat pump boost or preheat hot water while PV surplus is available.",
    "advisor.wallbox": "EV",
    "advisor.weather": "Pogoda",
    "advisor.windowAnytime": "Kiedykolwiek",
    "advisor.windowNext2h": "Następne 2 h",
    "advisor.windowNow": "Teraz",
    "advisor.reasonBattery": "Battery SoC {soc} is part of this recommendation.",
    "advisor.reasonEvSurplus": "PV surplus is above the configured EV threshold of {threshold}.",
    "advisor.reasonGridImport": "Grid import is above the configured import threshold of {threshold}.",
    "advisor.reasonLargeConsumer": "The available PV surplus can cover the configured consumer limit.",
    "advisor.reasonPhaseChange": "EVCC reports a planned phase change inside the next window.",
    "advisor.reasonSensor": "A configured entity is stale, unavailable, or inconsistent.",
    "advisor.reasonSurplus": "PV surplus is above the configured surplus threshold of {threshold}.",
    "advisor.reasonWeather": "Weather is included to separate low PV from expected conditions.",
    "advisor.reasonPrice": "The configured electricity price sensor is included in the decision context.",
    "advisor.impactAutarky": "That shows how independently the house is currently being supplied.",
    "advisor.impactBattery": "That value describes the current battery reserve and influences whether flexible loads are sensible right now.",
    "advisor.impactConsumer": "That value shows whether this consumer is active and how strongly it affects the energy balance.",
    "advisor.impactGrid": "That value decides whether the situation is treated as grid import, neutral, or PV surplus.",
    "advisor.impactLoad": "That value describes the current household load and helps classify whether consumption is unusually high.",
    "advisor.impactPv": "That value describes the current PV production and helps estimate how much energy is available.",
    "advisor.impactSelfConsumption": "That shows how much PV energy is being used locally instead of being exported.",
    "advisor.impactSensor": "That value is used as a diagnostic signal for sensor freshness and plausibility.",
    "advisor.impactSurplus": "That value shows how much power is currently available for flexible loads before it is exported.",
    "advisor.impactTemperature": "That value is used to detect possible battery stress or operating limits.",
    "advisor.impactWallbox": "That value describes the charger state and determines whether charging should start, stop, or wait.",
    "editor.showViewSelector": "Pokaż przełącznik widoku",
    "chart.close": "Zamknij",
    "chart.empty": "Nie znaleziono danych historii",
    "chart.error": "Nie udało się wczytać historii",
    "chart.loading": "Ładowanie historii…",
    "chart.range24": "24h",
    "chart.range48": "48h",
    "chart.subtitle": "Ostatnie {hours} godzin",
    "charts.count": "{count} wykresy",
    "charts.countOne": "{count} wykres",
    "charts.empty": "Nie skonfigurowano jeszcze encji z historią.",
    "charts.label": "Wykresy",
    "charts.openLarge": "Otwórz duży wykres",
    "charts.sectionPvStrings": "Stringi PV",
    "charts.sectionInverters": "Falowniki",
    "charts.sectionSystem": "Falownik i system",
    "charts.sectionWallbox": "Wallbox",
    "charts.title": "Historia encji",
    "editor.customDayImage": "Własny obraz dzienny",
    "editor.customImage": "Własny obraz",
    "editor.batteryChargeEntity": "Encja ładowania baterii",
    "editor.batteryCyclesTodayEntity": "Encja cykli baterii dziś",
    "editor.batteryDischargeEntity": "Encja rozładowania baterii",
    "editor.batteryFlowEntity": "Encja przepływu baterii (+/-)",
    "editor.batteryMaxSocEntity": "Encja maks. SoC baterii",
    "editor.batteryMinSocEntity": "Encja min. SoC baterii",
    "editor.batteryTemperatureEntity": "Encja temperatury baterii",
    "editor.entity": "Encja",
    "editor.entityPlaceholder": "Encja {label}",
    "editor.energy1hEntity": "Encja kWh 1h",
    "editor.energy24hEntity": "Encja kWh 24h",
    "editor.energyCounterEntity": "Encja licznika kWh",
    "editor.energyMonthEntity": "Encja kWh 1 miesiąc",
    "editor.energyRangeOverride": "Opcjonalne bezpośrednie sensory okresów",
    "editor.energyYearEntity": "Encja kWh 1 rok",
    "editor.energyTotalEntity": "Łączna encja kWh",
    "editor.liveEntity": "Encja na żywo",
    "editor.houseType": "Typ domu",
    "editor.hudBoxOpacity": "Przezroczystość pól HUD",
    "editor.hudBoxScale": "Skala pól HUD",
    "editor.advisorEvSurplusThreshold": "Próg nadwyżki PV dla EV (W)",
    "editor.electricityPriceEntity": "Encja ceny energii",
    "editor.gridVoltageCriticalThreshold": "Krytyczne napięcie sieci (V)",
    "editor.gridVoltageWarningThreshold": "Wysokie napięcie sieci (V)",
    "editor.importExportEntity": "Encja importu/eksportu",
    "editor.importExportSignedEntity": "Encja importu/eksportu ze znakiem (+/-)",
    "editor.importPowerEntity": "Encja importu",
    "editor.exportPowerEntity": "Encja eksportu",
    "editor.importExportLabels": "Etykiety importu/eksportu",
    "editor.importLabel": "Etykieta importu",
    "editor.exportLabel": "Etykieta eksportu",
    "editor.neutralLabel": "Etykieta samowystarczalności",
    "editor.environmentAdd": "Dodaj kafelek",
    "editor.environmentEntity": "Encja czujnika",
    "editor.environmentLabel": "Etykieta czujnika",
    "editor.environmentShow": "Pokaż kafelek {label}",
    "editor.environmentShowFooter": "Pokaż pole w stopce",
    "editor.environmentShowImage": "Pokaż pole na obrazie",
    "editor.environmentTemplates": "Szablony środowiskowe",
    "editor.environmentUnit": "Wyświetlana jednostka",
    "editor.kpiAdd": "Dodaj kafelek",
    "editor.kpiColor": "Kolor",
    "editor.kpiColumns": "Szerokość kafelka",
    "editor.kpiEntity": "Encja KPI",
    "editor.kpiLabel": "Etykieta KPI",
    "editor.kpiPosition": "Pozycja kafelka",
    "editor.kpiRemove": "Usuń",
    "editor.kpiStaticValue": "Stała wartość",
    "editor.consumerEnergyEntity": "Encja licznika kWh",
    "editor.consumerLabel": "Nazwa urządzenia",
    "editor.consumerAddCustom": "Dodaj własny duży odbiornik",
    "editor.consumerPowerEntity": "Encja mocy",
    "editor.consumerShow": "Pokaż kafelek {label}",
    "editor.labelHideDesktop": "Ukryj na komputerze",
    "editor.labelHideMobile": "Ukryj na telefonie",
    "editor.labelOptions": "Wyświetlanie etykiet",
    "editor.labelShowFooter": "Pokaż etykietę w dolnych KPI",
    "editor.labelShowImage": "Pokaż etykietę na obrazie",
    "editor.maxPowerKw": "Maks. moc (kW/kWp)",
    "editor.optionalDayImage": "Opcjonalny obraz dzienny",
    "editor.powerDecimals": "Miejsca dziesiętne mocy",
    "editor.powerDisplayMode": "Tryb wyświetlania mocy",
    "editor.rawMode": "Wartość surowa + skonfigurowana jednostka",
    "editor.auto": "Auto",
    "editor.autoWKw": "Auto W/kW",
    "editor.advisorMaxSuggestions": "Sugestie doradcy",
    "editor.overlayEnable": "Pokaż {label}",
    "editor.overlayLabel": "Etykieta",
    "editor.overlayOrientation": "Orientacja",
    "editor.overlayOrientationLeft": "Lewa strona",
    "editor.overlayOrientationRight": "Prawa strona",
    "editor.overlayPeriod": "Okres",
    "editor.overlaySize": "Rozmiar",
    "editor.period1h": "1 godzina",
    "editor.period24h": "24 godziny",
    "editor.period30m": "30 minut",
    "editor.phaseActionEntity": "Encja następnej akcji faz",
    "editor.phaseEntity": "Encja faz",
    "editor.phaseRemainingEntity": "Encja pozostałych sekund faz",
    "editor.pvForecastTodayEntity": "Encja prognozy na dziś",
    "editor.pvLabels": "Etykiety PV",
    "editor.pvPeakTodayEntity": "Encja szczytu dziś",
    "editor.pvPowerLabel": "Etykieta mocy",
    "editor.pvRoofStringAdd": "Dodaj string",
    "editor.pvRoofStringDisplay": "Wyświetlanie stringów PV dachu",
    "editor.pvRoofStringDisplayDominant": "Najmocniejszy string duży, inne małe",
    "editor.pvRoofStringDisplaySum": "Sumuj stringi",
    "editor.pvRoofStringDisplayValues": "Pokaż wartości stringów",
    "editor.pvRoofStringEnergyEntity": "Encja licznika kWh stringu",
    "editor.pvRoofStringLabel": "Nazwa stringu",
    "editor.pvRoofStringPowerEntity": "Encja mocy stringu",
    "editor.pvRoofStrings": "Stringi PV dachu",
    "editor.inverterAdd": "Dodaj falownik",
    "editor.inverterDisplay": "Wyświetlanie falowników",
    "editor.inverterDisplayDominant": "Najmocniejszy falownik duży, inne małe",
    "editor.inverterDisplaySum": "Sumuj falowniki",
    "editor.inverterDisplayValues": "Pokaż wartości falowników",
    "editor.inverterEnergyEntity": "Encja licznika kWh falownika",
    "editor.inverterLabel": "Nazwa falownika",
    "editor.inverterPowerEntity": "Encja mocy falownika",
    "editor.inverters": "Falowniki",
    "editor.pvTodayEnergyEntity": "Encja produkcji dziś",
    "editor.remainingChargeTimeEntity": "Encja pozostałego czasu ładowania",
    "editor.vehicleChargingEnabledEntity": "Encja ładowania włączonego",
    "editor.vehicleConnectedEntity": "Encja pojazdu podłączonego",
    "editor.vehicleMaxSocEntity": "Encja maks./docelowego SoC pojazdu",
    "editor.vehicleSocEntity": "Encja SoC pojazdu",
    "editor.sectionBoxes": "Pola, encje na żywo/kWh, jednostka i pozycja",
    "editor.sectionAdvisor": "Doradca i ceny",
    "editor.sectionAppearance": "Wyświetlanie i limity",
    "editor.sectionGeneral": "Ustawienia ogólne",
    "editor.sectionKpis": "Własne kafelki KPI",
    "editor.sectionEnvironmentSensors": "Czujniki środowiskowe",
    "editor.sectionLargeConsumers": "Dodatkowe duże odbiorniki",
    "editor.sectionOverlays": "Nakładki obrazu",
    "editor.showBox": "Pokaż {label}",
    "editor.showEnergyRangeSelector": "Pokaż wybór na żywo/1h/24h/miesiąc/rok/łącznie",
    "editor.showHouseSelector": "Pokaż wybór domu",
    "editor.showEnvironmentSensors": "Pokaż kafelki czujników środowiskowych",
    "editor.showLargeConsumers": "Pokaż duże odbiorniki w widoku domu",
    "editor.showGridStatusTile": "Pokaż kafelek sieci",
    "editor.showMetricTiles": "Pokaż pola metryk pod obrazem",
    "editor.showPowerFlows": "Pokaż animowane przepływy energii",
    "editor.showStatusLabel": "Pokaż etykietę statusu na obrazie",
    "editor.showTitle": "Pokaż tytuł",
    "editor.showWeatherStatus": "Pokaż aktualną pogodę w etykiecie statusu",
    "editor.title": "Tytuł",
    "editor.tabSetup": "Konfiguracja",
    "editor.tabEnergy": "Energia",
    "editor.tabDevices": "Urządzenia",
    "editor.tabEnvironment": "Środowisko",
    "editor.tabFloorplan": "Plan",
    "editor.tabLayout": "Układ",
    "editor.tabAppearance": "Wygląd",
    "editor.tabAdvisor": "Doradca",
    "editor.tabAdvanced": "Zaawansowane",
    "editor.tabs": "Sekcje konfiguracji",
    "editor.statusConfigured": "{configured}/{total} skonfigurowane",
    "editor.statusConfiguredCount": "{count} skonfigurowane",
    "editor.statusHidden": "{count} ukryte",
    "editor.statusMissing": "brakuje {count}",
    "editor.statusAdvanced": "Opcje zaawansowane aktywne",
    "editor.statusReady": "Gotowe",
    "editor.layoutMode": "Tryb układu",
    "editor.layoutHelp": "Kliknij pole w podglądzie, a następnie dopasuj pozycję X/Y.",
    "editor.layoutSelected": "Wybrane pole",
    "editor.layoutEmpty": "Włącz pola obrazu lub nakładki, aby edytować tutaj ich pozycje.",
    "editor.layoutTypeBox": "Pole",
    "editor.layoutTypeOverlay": "Nakładka",
    "editor.layoutTypeEnvironment": "Środowisko",
    "editor.sectionFloorplan": "Edytor planu",
    "editor.floorplanHelp": "Wybierz narzędzie, kliknij siatkę, a następnie dopasuj wybrany element.",
    "editor.floorplanShowGrid": "Pokaż siatkę",
    "editor.floorplanTools": "Narzędzia planu",
    "editor.floorplanToolRoom": "Pomieszczenie",
    "editor.floorplanToolWall": "Ściana",
    "editor.floorplanToolSensor": "Czujnik",
    "editor.floorplanSelected": "Wybrany element",
    "editor.floorplanLabel": "Etykieta",
    "editor.floorplanWidth": "Szerokość",
    "editor.floorplanHeight": "Wysokość",
    "editor.floorplanDelete": "Usuń wybrane",
    "editor.floorplanCustomEntity": "Własna encja",
    "editor.floorplanSensorSource": "Źródło czujnika",
    "editor.floorplanEntity": "Encja",
    "editor.floorplanEmpty": "Kliknij siatkę, aby utworzyć wybrany element.",
    "editor.helpHomeAssistantSensor": "Wybierz encję Home Assistant, która dostarcza tę wartość.",
    "editor.helpUnitAuto": "Użyj Auto, aby wyświetlić jednostkę zgłaszaną przez Home Assistant. Wybierz inną tylko wtedy, gdy chcesz ją nadpisać.",
    "editor.helpEnergyCounter": "Opcjonalny licznik energii skumulowanej dla widoków 1h, 24h, miesiąc, rok i łącznie.",
    "editor.helpSignedGrid": "Użyj czujnika, w którym wartości dodatnie oznaczają import, a ujemne eksport. Pozostaw puste, jeśli używasz osobnych czujników.",
    "editor.helpSignedBattery": "Jeśli to możliwe, użyj czujnika ze znakiem: dodatni oznacza ładowanie, ujemny rozładowanie.",
    "editor.helpFooterOrder": "Steruje kolejnością kafelków pod obrazem. Niższe liczby pojawiają się wcześniej.",
    "editor.helpTileWidth": "Steruje szerokością kafelka dolnego na komputerze. Na telefonie szerokość jest ograniczana automatycznie.",
    "editor.helpImagePosition": "Pozycja pola na obrazie domu w procentach.",
    "editor.helpEnvironmentFooter": "Pokazuje ten czujnik jako kafelek w sekcji Środowisko pod obrazem.",
    "editor.helpEnvironmentImage": "Pokazuje ten czujnik jako skalowalne pole HUD na obrazie domu.",
    "editor.helpMaxPower": "Używane tylko dla paska wykorzystania i kontroli obciążenia doradcy.",
    "editor.unit": "Jednostka",
    "editor.voltageEntity": "Encja napięcia",
    "editor.voltageEntityL1": "Encja napięcia L1",
    "editor.voltageEntityL2": "Encja napięcia L2",
    "editor.voltageEntityL3": "Encja napięcia L3",
    "editor.viewMode": "Widok domyślny",
    "editor.weatherEntity": "Encja pogody",
    "editor.setupWizard": "Kreator konfiguracji",
    "editor.setupIntro": "Pomaga w pierwszej konfiguracji, sugerując czujniki PV, baterii, falownika, ładowarki EV, sieci, zużycia, pogody i liczników kWh.",
    "editor.setupHelp": "Sprawdź sugestie przed zastosowaniem. Użyj „Wypełnij puste pola” jako bezpiecznego pierwszego kroku albo „Zastąp wykryte pola”, jeśli chcesz nadpisać istniejące przypisania.",
    "editor.setupEntityCount": "{count} dostępnych encji",
    "editor.setupNoEntities": "Otwórz ten edytor w Home Assistant, aby wykryć encje.",
    "editor.setupFillEmpty": "Wypełnij puste pola",
    "editor.setupReplaceAll": "Zastąp wykryte pola",
    "editor.setupSuggestions": "Wykryte sugestie",
    "editor.setupNoSuggestions": "Nie znaleziono jeszcze mocnych dopasowań.",
    "editor.setupApplyOne": "Użyj",
    "editor.setupCurrent": "Obecnie",
    "editor.setupSuggested": "Sugerowane",
    "editor.setupConfidence": "{score}% dopasowania",
    "editor.setupApplied": "Zastosowano {count} sugestii.",
    "editor.setupApplyNone": "Nie zmieniono pustych pól.",
    "editor.xPosition": "Pozycja X",
    "editor.yPosition": "Pozycja Y",
    "flow.charge": "Przychodzące",
    "flow.discharge": "Wychodzące",
    "consumer.custom": "Własny",
    "consumer.customLarge": "Własny duży odbiornik",
    "consumer.dhw_heatpump": "Pompa ciepła CWU",
    "consumer.dishwasher": "Zmywarka",
    "consumer.dryer": "Suszarka",
    "consumer.sectionTitle": "Dodatkowe duże odbiorniki",
    "consumer.space_heater": "Termowentylator",
    "consumer.washing_machine": "Pralka",
    "environment.sectionTitle": "Środowisko",
    "environment.sensor": "Środowisko {index}",
    "environment.templateIndoor": "Temperatura wewnętrzna",
    "environment.templateOutdoor": "Temperatura zewnętrzna",
    "environment.templateHotWater": "Ciepła woda",
    "environment.templatePressure": "Ciśnienie",
    "environment.templateAirQuality": "Jakość powietrza",
    "environment.templateCustom": "Własny",
    "floorplan.counts": "{rooms} pomieszczeń · {sensors} czujników",
    "floorplan.empty": "Utwórz pomieszczenia, ściany i czujniki w edytorze karty.",
    "floorplan.label": "Plan",
    "floorplan.room": "Pomieszczenie {index}",
    "floorplan.sensor": "Czujnik {index}",
    "floorplan.title": "Plan domu",
    "floorplan.wall": "Ściana {index}",
    "house.apartment_building": "Budynek wielorodzinny",
    "house.apartment_building_balcony_solar": "Budynek wielorodzinny z fotowoltaiką balkonową",
    "house.bungalow": "Bungalow",
    "house.city_villa": "Willa miejska",
    "house.city_villa_pitched_roof": "Willa miejska z dachem spadzistym",
    "house.duplex_house": "Dom bliźniaczy",
    "house.single_family_home": "Dom jednorodzinny",
    "house.terraced_middle_house": "Środkowy dom szeregowy",
    "metrics.battery_level": "Bateria",
    "metrics.grid_status": "Sieć",
    "metrics.house_consumption_power": "Zużycie",
    "metrics.import_export_power": "Import/eksport",
    "metrics.inverter_power": "Falownik",
    "metrics.pv_power": "Moc PV",
    "metrics.pv_roof_power": "PV dach",
    "metrics.pv_shed_power": "PV szopa",
    "metrics.pv_total_power": "PV łącznie",
    "metrics.water_meter": "Woda",
    "metrics.wallbox_power": "Ładowarka EV",
    "metrics.wallbox2_power": "Ładowarka EV 2",
    "overlay.heatpump": "Pompa ciepła",
    "overlay.smoke": "Gaz",
    "phase.auto": "Auto",
    "phase.many": "{count} fazy",
    "phase.one": "1 faza",
    "pvLabel.forecastToday": "Prognoza dziś",
    "pvLabel.peakToday": "Szczyt dziś",
    "pvLabel.power": "Moc",
    "pvLabel.todayEnergy": "Wyprodukowano dziś",
    "range.1h": "1h",
    "range.24h": "24h",
    "range.live": "Na żywo",
    "range.month": "1 miesiąc",
    "range.total": "Łącznie",
    "range.year": "1 rok",
    "status.export": "Eksport",
    "status.import": "Import",
    "status.lastUpdated": "Ostatnia aktualizacja: {time}",
    "status.selfSufficient": "Samowystarczalny",
    "status.weather": "Pogoda: {weather}",
    "tooltip.entity": "Encja",
    "tooltip.flow": "Przepływ",
    "tooltip.load": "Wykorzystanie",
    "tooltip.max": "Maksimum",
    "tooltip.phases": "Fazy",
    "tooltip.phaseChange": "Nadchodząca zmiana faz",
    "tooltip.raw": "Wartość surowa",
    "tooltip.remainingChargeTime": "Pozostały czas ładowania",
    "tooltip.status": "Status",
    "tooltip.temperature": "Temperatura",
    "tooltip.updated": "Zaktualizowano",
    "tooltip.value": "Wartość",
    "tooltip.vehicleSoc": "SoC pojazdu",
    "tooltip.voltage": "Napięcie",
    "value.remainingChargeTime": "Pozostało {value}",
    "value.phaseChangeIn": "{action} za {duration}",
    "value.temperature": "Temp {value}",
    "value.soon": "wkrótce",
    "view.advisor": "Panel doradcy",
    "view.house": "Widok domu",
    "view.floorplan": "Plan",
    "view.charts": "Wykresy",
    "weather.clear": "Bezchmurnie",
    "weather.clear-night": "Bezchmurnie",
    "weather.cloudy": "Pochmurno",
    "weather.fog": "Mgła",
    "weather.hail": "Grad",
    "weather.lightning": "Burza",
    "weather.lightning-rainy": "Burza z deszczem",
    "weather.partlycloudy": "Częściowe zachmurzenie",
    "weather.pouring": "Ulewa",
    "weather.rainy": "Deszczowo",
    "weather.snowy": "Śnieg",
    "weather.snowy-rainy": "Deszcz ze śniegiem",
    "weather.sunny": "Słonecznie",
    "weather.windy": "Wietrznie",
    "weather.windy-variant": "Wietrznie/pochmurno",
    "warning.batteryLow": "Niski poziom baterii",
    "warning.gridVoltageCritical": "Napięcie sieci zdecydowanie za wysokie",
    "warning.gridVoltageHigh": "Wysokie napięcie sieci",
    "warning.sensorMissing": "Nie znaleziono encji",
    "warning.sensorOffline": "Sensor offline",
    "warning.sensorUnavailable": "Sensor niedostępny",
    "view.records": "Rekordy",
    "records.count": "{count} rekordów",
    "records.countOne": "{count} rekord",
    "records.days": "{days} dni",
    "records.empty": "Brak historii możliwej do oceny.",
    "records.error": "Nie udało się wczytać rekordów.",
    "records.label": "Najlepsze wyniki",
    "records.loadingCount": "{count} encji",
    "records.loadingCountOne": "{count} encja",
    "records.loadingPurposeConsumerPower": "Szczyt poboru",
    "records.loadingPurposeCounter": "Dzienny przyrost licznika",
    "records.loadingPurposePower": "Szczyt mocy",
    "records.loadingPurposePvEnergy": "Dzienny uzysk PV",
    "records.loadingPurposePvPower": "Moc PV i godziny solarne",
    "records.loadingPurposeWallboxChargingEnabled": "Czas włączonego ładowania wallboxa",
    "records.loadingPurposeWallboxEnergy": "Energia ładowania wallboxa",
    "records.loadingPurposeWallboxMaxSocLimit": "Limit ładowania wallboxa",
    "records.loadingPurposeWallboxPhase": "Historia faz wallboxa",
    "records.loadingPurposeWallboxPluggedIn": "Czas podłączenia wallboxa",
    "records.loadingPurposeWallboxPower": "Moc ładowania wallboxa",
    "records.loadingPurposeWallboxSoc": "SoC pojazdu wallboxa",
    "records.loadingTitle": "Pobieranie historii",
    "records.loading": "Ładowanie rekordów…",
    "records.sectionPeaks": "Szczyty mocy",
    "records.sectionPvEnergy": "Najlepszy uzysk PV na string",
    "records.sectionSolarHours": "Najdłuższe godziny solarne",
    "records.sectionWallbox": "Rekordy wallboxa",
    "records.subtitle": "Najlepsze wartości dla {range} z historii Home Assistant.",
    "records.title": "Rekordy energii",
    "records.range7d": "7 dni",
    "records.range14d": "14 dni",
    "records.range30d": "30 dni",
    "records.rangeMonth": "Ten miesiąc",
    "records.rangeYear": "Ten rok",
    "records.range356d": "356 dni",
    "records.consumerPeakPower": "{name}: najwyższy szczyt poboru",
    "records.counterLargestIncrease": "{name}: największy dzienny przyrost licznika",
    "records.powerPeak": "{name}: najwyższy szczyt mocy",
    "records.pvBestYield": "{name}: najlepszy dzienny uzysk PV",
    "records.pvPeakPower": "{name}: najwyższa moc PV",
    "records.solarLongestHours": "{name}: najdłuższy czas produkcji solarnej",
    "records.wallboxChargedEnergy": "{name}: najwięcej naładowanej energii",
    "records.wallboxChargingEnabled": "{name}: najdłuższy czas włączonego ładowania",
    "records.wallboxLongestCharge": "{name}: najdłuższy dzień ładowania",
    "records.wallboxMaxSoc": "{name}: najwyższy SoC pojazdu",
    "records.wallboxMaxSocLimit": "{name}: najwyższy limit ładowania",
    "records.wallboxOnePhase": "{name}: najdłuższy czas 1-fazowy",
    "records.wallboxPeakPower": "{name}: najwyższa moc ładowania",
    "records.wallboxPluggedIn": "{name}: najdłuższy czas podłączenia",
    "records.wallboxThreePhase": "{name}: najdłuższy czas 3-fazowy",
    "records.sectionCounters": "Rekordy liczników"
  }
};
const I18N_LOADS = new Map();

function scriptAssetBaseUrl() {
  const currentScriptUrl = globalThis.document?.currentScript?.src;
  if (currentScriptUrl) return currentScriptUrl;
  const scripts = Array.from(globalThis.document?.querySelectorAll?.("script[src]") || []);
  const script = scripts
    .map((element) => element.src || element.getAttribute?.("src") || "")
    .reverse()
    .find((src) => /ha-solar-dashboard(?:\.js|\/)/.test(src));
  return script || globalThis.location?.href || "http://localhost/";
}

function assetUrl(path) {
  return new URL(path, scriptAssetBaseUrl()).href;
}

function translationUrl(language) {
  return assetUrl(`i18n/${language}.json`);
}

function loadTranslation(language) {
  const normalizedLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
  if (I18N[normalizedLanguage]) return Promise.resolve(I18N[normalizedLanguage]);
  if (I18N_LOADS.has(normalizedLanguage)) return I18N_LOADS.get(normalizedLanguage);
  if (typeof fetch !== "function") {
    I18N[normalizedLanguage] = {};
    return Promise.resolve(I18N[normalizedLanguage]);
  }
  const request = fetch(translationUrl(normalizedLanguage))
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((dictionary) => {
      I18N[normalizedLanguage] = dictionary && typeof dictionary === "object" ? dictionary : {};
      return I18N[normalizedLanguage];
    })
    .catch((error) => {
      console.warn(`HA Solar Dashboard: could not load i18n/${normalizedLanguage}.json`, error);
      I18N[normalizedLanguage] = {};
      return I18N[normalizedLanguage];
    });
  I18N_LOADS.set(normalizedLanguage, request);
  return request;
}

function ensureTranslations(language, callback) {
  const normalizedLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
  const languages = [...new Set([DEFAULT_LANGUAGE, normalizedLanguage])];
  return Promise.all(languages.map((item) => loadTranslation(item))).then(() => callback?.());
}

function languageFromHass(hass) {
  const candidates = [
    hass?.locale?.language,
    hass?.locale?.languageCode,
    hass?.language,
    hass?.selectedLanguage,
    globalThis.document?.documentElement?.lang,
    globalThis.localStorage?.getItem?.("selectedLanguage"),
    globalThis.localStorage?.getItem?.("language"),
    ...(Array.isArray(globalThis.navigator?.languages) ? globalThis.navigator.languages : []),
    globalThis.navigator?.language,
  ];
  for (const candidate of candidates) {
    const language = String(candidate || "").toLowerCase().split(/[-_]/)[0];
    if (SUPPORTED_LANGUAGES.includes(language)) return language;
  }
  return DEFAULT_LANGUAGE;
}

function translate(language, key, replacements = {}, fallback = "") {
  const dictionary = I18N[language] || {};
  const fallbackDictionary = I18N[DEFAULT_LANGUAGE] || {};
  const template = dictionary[key] ?? fallbackDictionary[key] ?? (fallback !== "" ? fallback : key);
  return String(template).replace(/\{(\w+)\}/g, (_match, name) => replacements[name] ?? "");
}

const HOUSE_VARIANTS = {
  single_family_home: {
    label: "Single Family Home",
    folder: "single_family_home",
    file: "single_family_home.png",
    dayFile: "single_family_home_day.png",
    fallbackFiles: ["single_family_home_legacy.png"],
    positions: {
      pv_roof_power: { left: 64, top: 28 },
      pv_shed_power: { left: 14, top: 80 },
      battery_level: { left: 49, top: 66 },
      inverter_power: { left: 53, top: 72 },
      wallbox_power: { left: 23, top: 57 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 83 },
    },
  },
  duplex_house: {
    label: "Duplex House",
    folder: "duplex_house",
    file: "duplex_house.png",
    dayFile: "duplex_house_day.png",
    positions: {
      pv_roof_power: { left: 46, top: 23 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 49, top: 73 },
      inverter_power: { left: 37, top: 56 },
      wallbox_power: { left: 27, top: 66 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  terraced_middle_house: {
    label: "Terraced Middle House",
    folder: "terraced_middle_house",
    file: "terraced_middle_house.png",
    dayFile: "terraced_middle_house_day.png",
    positions: {
      pv_roof_power: { left: 48, top: 18 },
      pv_shed_power: { left: 80, top: 76 },
      battery_level: { left: 33, top: 61 },
      inverter_power: { left: 34, top: 51 },
      wallbox_power: { left: 44, top: 66 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  apartment_building: {
    label: "Apartment Building",
    folder: "apartment_building",
    file: "apartment_building.png",
    dayFile: "apartment_building_day.png",
    positions: {
      pv_roof_power: { left: 53, top: 17 },
      pv_shed_power: { left: 16, top: 81 },
      battery_level: { left: 35, top: 65 },
      inverter_power: { left: 35, top: 72 },
      wallbox_power: { left: 21, top: 59 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  apartment_building_balcony_solar: {
    label: "Apartment Building Balcony Solar",
    folder: "apartment_building_balcony_solar",
    file: "apartment_building_balcony_solar.png",
    dayFile: "apartment_building_balcony_solar_day.png",
    positions: {
      battery_level: { left: 42, top: 70 },
      inverter_power: { left: 52, top: 58 },
      pv_total_power: { left: 62, top: 58 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
    visible_boxes: {
      pv_roof_power: false,
      pv_shed_power: false,
      wallbox_power: false,
      wallbox2_power: false,
      import_export_power: true,
      battery_level: true,
      inverter_power: true,
      pv_total_power: true,
    },
    labels: {
      pv_total_power: "PV Power",
    },
    labelKeys: {
      pv_total_power: "metrics.pv_power",
    },
  },
  bungalow: {
    label: "Bungalow",
    folder: "bungalow",
    file: "bungalow.png",
    dayFile: "bungalow_day.png",
    positions: {
      pv_roof_power: { left: 51, top: 29 },
      pv_shed_power: { left: 16, top: 80 },
      battery_level: { left: 40, top: 66 },
      inverter_power: { left: 54, top: 69 },
      wallbox_power: { left: 25, top: 59 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  city_villa: {
    label: "City Villa",
    folder: "city_villa",
    file: "city_villa.png",
    dayFile: "city_villa_day.png",
    positions: {
      pv_roof_power: { left: 55, top: 16 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 43, top: 71 },
      inverter_power: { left: 58, top: 58 },
      wallbox_power: { left: 25, top: 57 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
  city_villa_pitched_roof: {
    label: "City Villa with Pitched Roof",
    folder: "city_villa_pitched_roof",
    file: "city_villa_pitched_roof.png",
    dayFile: "city_villa_pitched_roof_day.png",
    positions: {
      pv_roof_power: { left: 58, top: 18 },
      pv_shed_power: { left: 15, top: 80 },
      battery_level: { left: 41, top: 66 },
      inverter_power: { left: 55, top: 56 },
      wallbox_power: { left: 25, top: 60 },
      water_meter: { left: 84, top: 72 },
      import_export_power: { left: 82, top: 82 },
    },
  },
};

const DEFAULT_IMAGE_OVERLAYS = {
  single_family_home: {
    smoke: { left: 58, top: 18, width: 9 },
    heatpump: { left: 82, top: 63, width: 11, orientation: "right" },
  },
  duplex_house: {
    smoke: { left: 52, top: 18, width: 9 },
    heatpump: { left: 78, top: 66, width: 11, orientation: "right" },
  },
  terraced_middle_house: {
    smoke: { left: 51, top: 16, width: 8 },
    heatpump: { left: 66, top: 68, width: 10, orientation: "left" },
  },
  apartment_building: {
    smoke: { left: 52, top: 13, width: 8 },
    heatpump: { left: 79, top: 68, width: 10, orientation: "right" },
  },
  apartment_building_balcony_solar: {
    smoke: { left: 50, top: 13, width: 8 },
    heatpump: { left: 76, top: 70, width: 10, orientation: "right" },
  },
  bungalow: {
    smoke: { left: 50, top: 25, width: 8 },
    heatpump: { left: 79, top: 66, width: 11, orientation: "right" },
  },
  city_villa: {
    smoke: { left: 55, top: 15, width: 8 },
    heatpump: { left: 79, top: 65, width: 10, orientation: "right" },
  },
  city_villa_pitched_roof: {
    smoke: { left: 56, top: 18, width: 8 },
    heatpump: { left: 78, top: 65, width: 10, orientation: "right" },
  },
};

const IMAGE_OVERLAY_KEYS = ["smoke", "heatpump"];

const PV_LABELS = [
  { suffix: "today_energy", labelKey: "pvLabel.todayEnergy", editorKey: "editor.pvTodayEnergyEntity", source: "entity", unit: "energy" },
  { suffix: "forecast_today", labelKey: "pvLabel.forecastToday", editorKey: "editor.pvForecastTodayEntity", source: "entity", unit: "energy" },
  { suffix: "peak_today", labelKey: "pvLabel.peakToday", editorKey: "editor.pvPeakTodayEntity", source: "entity", unit: "power" },
];

const MINUTE_MS = 60 * 1000;
const MAX_HISTORY_CACHE_ENTRIES = 48;
const MAX_COUNTER_CACHE_ENTRIES = 72;

function normalizeConfigId(value, fallback) {
  const id = String(value || fallback || "").trim().replace(/[^\w-]+/g, "_");
  return id || String(fallback || "item").replace(/[^\w-]+/g, "_");
}

function clampConfigNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeHouse(value) {
  if (!value) return undefined;
  const normalized = String(value).toLowerCase().trim().replace(/[\s_]+/g, "-");
  const aliases = {
    home: "single_family_home",
    modern: "single_family_home",
    einfamilienhaus: "single_family_home",
    "single-family-home": "single_family_home",
    doppelhaus: "duplex_house",
    "doppel-haus": "duplex_house",
    duplex: "duplex_house",
    "duplex-house": "duplex_house",
    reihenhaus: "terraced_middle_house",
    "reihen-haus": "terraced_middle_house",
    reihenmittelhaus: "terraced_middle_house",
    "reihen-mittelhaus": "terraced_middle_house",
    "reihen-mittel-haus": "terraced_middle_house",
    "terraced-house": "terraced_middle_house",
    "terraced-middle-house": "terraced_middle_house",
    mfh: "apartment_building",
    mehrfamilienhaus: "apartment_building",
    "mehr-familienhaus": "apartment_building",
    "mehrfamilien-haus": "apartment_building",
    "apartment-building": "apartment_building",
    "mehrfamilienhaus-balkonsolar": "apartment_building_balcony_solar",
    "mehr-familienhaus-balkonsolar": "apartment_building_balcony_solar",
    "mehrfamilienhaus-balkon-solar": "apartment_building_balcony_solar",
    "mehr-familienhaus-balkon-solar": "apartment_building_balcony_solar",
    balkonsolar: "apartment_building_balcony_solar",
    "balcony-solar": "apartment_building_balcony_solar",
    "apartment-building-balcony-solar": "apartment_building_balcony_solar",
    bungalow: "bungalow",
    "bungalow-house": "bungalow",
    villa: "city_villa",
    stadtvilla: "city_villa",
    "stadt-villa": "city_villa",
    "city-villa": "city_villa",
    stadtvilla_2: "city_villa_pitched_roof",
    "stadtvilla-2": "city_villa_pitched_roof",
    "stadtvilla-ohne-flachdach": "city_villa_pitched_roof",
    stadtvilla_dach: "city_villa_pitched_roof",
    "stadtvilla-dach": "city_villa_pitched_roof",
    "city-villa-pitched-roof": "city_villa_pitched_roof",
  };
  const key = aliases[normalized] || normalized;
  return HOUSE_VARIANTS[key] ? key : undefined;
}

class HaSolarDashboardCard extends HTMLElement {
  connectedCallback() {
    this._isCardConnected = true;
    if (this.config && this.shadowRoot) {
      this._ensureTranslationsForRender();
      this._updateReadings();
      this._syncAdvisorRefreshTimer(this._currentViewMode() === "advisor");
    }
  }

  disconnectedCallback() {
    this._isCardConnected = false;
    this._asyncRequestToken = (this._asyncRequestToken || 0) + 1;
    this._energyRangeLoading?.clear();
    this._overlayConsumptionLoading?.clear();
    this._chartDashboardLoading?.clear();
    this._recordsLoading?.clear();
    this._stopAdvisorRefreshTimer();
  }

  static getConfigElement() {
    return document.createElement(CARD_EDITOR_TYPE);
  }

  static getStubConfig() {
    return {
      type: `custom:${CARD_TYPE}`,
      title: "Solar Dashboard",
      house: "single_family_home",
      view_mode: "house",
      show_title: true,
      show_view_selector: true,
      show_house_selector: true,
      show_energy_range_selector: false,
      show_metric_tiles: true,
      show_environment_sensors: true,
      show_large_consumers: true,
      show_power_flows: false,
      show_status_label: true,
      show_weather_status: false,
      show_grid_status_tile: true,
      pv_roof_string_display: "sum",
      inverter_display: "sum",
      hud_box_opacity: 0.65,
      hud_box_scale: 1,
      battery_low_threshold: 20,
      grid_neutral_threshold: 25,
      grid_voltage_warning_threshold: 245,
      grid_voltage_critical_threshold: 253,
      advisor_surplus_threshold: ADVISOR_DEFAULTS.surplusThreshold,
      advisor_import_threshold: ADVISOR_DEFAULTS.importThreshold,
      advisor_high_load_threshold: ADVISOR_DEFAULTS.highLoadThreshold,
      advisor_ev_surplus_threshold: ADVISOR_DEFAULTS.evSurplusThreshold,
      advisor_max_suggestions: ADVISOR_DEFAULTS.maxSuggestions,
      advisor_stale_sensor_warning_minutes: ADVISOR_DEFAULTS.staleSensorWarningMinutes,
      advisor_stale_sensor_critical_minutes: ADVISOR_DEFAULTS.staleSensorCriticalMinutes,
      chart_hours: 24,
      records_range: "7d",
      max_power_kw: {
        pv_roof_power: 10,
        pv_shed_power: 3,
        pv_total_power: 13,
        inverter_power: 10,
        wallbox_power: 11,
        wallbox2_power: 11,
        import_export_power: 10,
      },
      dynamic_tile_colors: true,
      daylight_entity: "sun.sun",
      weather_entity: "",
      units: {
        power: "auto",
        battery: "%",
        volume: "m³",
        water_meter: "m³",
      },
      labels: {},
      label_visibility: {},
      energy_entities: {},
      tile_color_rules: DEFAULT_TILE_COLOR_RULES,
      custom_kpis: [],
      environment_sensors: [],
      floorplan: {
        show_grid: true,
        rooms: [],
        walls: [],
        sensors: [],
      },
      large_consumers: normalizeLargeConsumers([]),
      pv_roof_strings: [],
      inverters: [],
      image_overlays: {
        smoke: { enabled: false, entity: "", period: "1h" },
        heatpump: { enabled: false, entity: "" },
      },
      visible_boxes: {
        pv_roof_power: true,
        pv_shed_power: true,
        battery_level: true,
        inverter_power: true,
        wallbox_power: true,
        wallbox2_power: false,
        water_meter: false,
        import_export_power: true,
      },
      entities: {
        pv_roof_power: "sensor.pv_roof_power",
        pv_roof_power_today_energy: "",
        pv_roof_power_forecast_today: "",
        pv_roof_power_peak_today: "",
        pv_shed_power: "sensor.pv_shed_power",
        pv_shed_power_today_energy: "",
        pv_shed_power_forecast_today: "",
        pv_shed_power_peak_today: "",
        battery_level: "sensor.battery_level",
        battery_min_soc: "",
        battery_max_soc: "",
        battery_flow_power: "",
        battery_flow_power_voltage: "",
        battery_charge_power: "",
        battery_discharge_power: "",
        battery_temperature: "",
        battery_cycles_today: "",
        inverter_power: "sensor.wechselrichter_power",
        inverter_power_voltage: "",
        inverter_power_voltage_l1: "",
        inverter_power_voltage_l2: "",
        inverter_power_voltage_l3: "",
        wallbox_power: "sensor.wallbox_power",
        wallbox_power_voltage: "",
        wallbox_phase: "",
        wallbox_phase_action: "",
        wallbox_phase_remaining: "",
        wallbox_soc: "",
        wallbox_max_soc: "",
        wallbox_connected: "",
        wallbox_charging_enabled: "",
        wallbox_remaining_time: "",
        wallbox2_power: "",
        wallbox2_power_voltage: "",
        wallbox2_phase: "",
        wallbox2_phase_action: "",
        wallbox2_phase_remaining: "",
        wallbox2_soc: "",
        wallbox2_max_soc: "",
        wallbox2_connected: "",
        wallbox2_charging_enabled: "",
        wallbox2_remaining_time: "",
        water_meter: "",
        electricity_price: "",
        pv_total_power: "sensor.pv_total_power",
        pv_total_power_voltage: "",
        pv_total_power_today_energy: "",
        pv_total_power_forecast_today: "",
        pv_total_power_peak_today: "",
        import_export_power: "sensor.grid_power",
        import_export_power_voltage: "",
        import_power: "",
        export_power: "",
        pv_roof_power_voltage: "",
        pv_shed_power_voltage: "",
        house_consumption_power_voltage: "",
      },
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");

    this._asyncRequestToken = (this._asyncRequestToken || 0) + 1;
    this._energyRangeLoading?.clear();
    this._overlayConsumptionLoading?.clear();
    this._chartDashboardLoading?.clear();
    this._recordsLoading?.clear();
    this._advisorConditionSince = new Map();

    const house = this._normalizeHouse(config.house || config.variant || config.image_variant) || "single_family_home";
    const energyRange = this._normalizeEnergyRange(config.energy_range) || "live";
    const viewMode = this._normalizeViewMode(config.view_mode || config.mode || config.default_view) || "house";
    this._hasCustomTitle = Object.prototype.hasOwnProperty.call(config, "title");

    this.config = {
      title: "Energy Flow",
      house,
      view_mode: viewMode,
      show_title: true,
      show_view_selector: true,
      show_house_selector: true,
      show_energy_range_selector: false,
      show_metric_tiles: true,
      show_environment_sensors: true,
      show_large_consumers: true,
      show_power_flows: false,
      show_status_label: true,
      show_weather_status: false,
      show_grid_status_tile: true,
      hud_box_opacity: 0.65,
      hud_box_scale: 1,
      battery_low_threshold: 20,
      grid_neutral_threshold: 25,
      grid_voltage_warning_threshold: 245,
      grid_voltage_critical_threshold: 253,
      advisor_surplus_threshold: ADVISOR_DEFAULTS.surplusThreshold,
      advisor_import_threshold: ADVISOR_DEFAULTS.importThreshold,
      advisor_high_load_threshold: ADVISOR_DEFAULTS.highLoadThreshold,
      advisor_ev_surplus_threshold: ADVISOR_DEFAULTS.evSurplusThreshold,
      advisor_max_suggestions: ADVISOR_DEFAULTS.maxSuggestions,
      advisor_stale_sensor_warning_minutes: ADVISOR_DEFAULTS.staleSensorWarningMinutes,
      advisor_stale_sensor_critical_minutes: ADVISOR_DEFAULTS.staleSensorCriticalMinutes,
      chart_hours: 24,
      records_range: "7d",
      daylight_entity: "sun.sun",
      weather_entity: "",
      dynamic_tile_colors: true,
      pv_roof_string_display: "sum",
      inverter_display: "sum",
      power_display_mode: "auto_kw",
      power_decimals: 2,
      energy_range: energyRange,
      units: { power: "auto", battery: "%", volume: "m³" },
      entities: {},
      positions: {},
      visible_boxes: {},
      max_power_kw: {},
      labels: {},
      label_visibility: {},
      energy_entities: {},
      image_overlays: {},
      tile_color_rules: {},
      custom_kpis: [],
      environment_sensors: [],
      floorplan: {
        show_grid: true,
        rooms: [],
        walls: [],
        sensors: [],
      },
      large_consumers: [],
      pv_roof_strings: [],
      inverters: [],
      ...config,
      house,
      view_mode: viewMode,
      energy_range: energyRange,
      units: {
        power: "auto",
        battery: "%",
        volume: "m³",
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
      max_power_kw: {
        ...(config.max_power_kw || {}),
      },
      labels: {
        ...(config.metric_labels || {}),
        ...(config.labels || {}),
      },
      label_visibility: {
        ...(config.label_display || {}),
        ...(config.label_visibility || {}),
      },
      energy_entities: {
        ...(config.energy_counters || {}),
        ...(config.energy_entities || {}),
      },
      image_overlays: {
        smoke: {
          ...((config.overlays || {}).smoke || {}),
          ...((config.image_overlays || {}).smoke || {}),
        },
        heatpump: {
          ...((config.overlays || {}).heatpump || {}),
          ...((config.image_overlays || {}).heatpump || {}),
        },
      },
      tile_color_rules: {
        ...DEFAULT_TILE_COLOR_RULES,
        ...(config.tile_color_rules || config.color_rules || {}),
      },
      custom_kpis: this._normalizeCustomKpis(config.custom_kpis || config.kpis || []),
      environment_sensors: this._normalizeEnvironmentSensors(config.environment_sensors || config.environment_sensor_tiles || []),
      floorplan: this._normalizeFloorplan(config.floorplan || {}),
      large_consumers: normalizeLargeConsumers(config.large_consumers || config.large_consumers_config || []),
      pv_roof_strings: normalizePvRoofStrings(config.pv_roof_strings || config.pv_roof_string_config || []),
      pv_roof_string_display: normalizePvRoofStringDisplay(config.pv_roof_string_display || config.pv_roof_display || "sum"),
      inverters: normalizeInverters(config.inverters || config.inverter_strings || config.inverter_config || []),
      inverter_display: normalizeInverterDisplay(config.inverter_display || config.inverter_string_display || "sum"),
    };
    delete this.config.show_energy_advisor;

    this.config.hud_box_opacity = this._clampNumber(this.config.hud_box_opacity, 0.65, 0, 1);
    this.config.hud_box_scale = this._clampNumber(this.config.hud_box_scale, 1, 0.6, 1.8);
    this.config.power_decimals = this._clampNumber(this.config.power_decimals, 2, 0, 3);
    this.config.battery_low_threshold = this._clampNumber(this.config.battery_low_threshold, 20, 0, 100);
    this.config.grid_neutral_threshold = this._clampNumber(this.config.grid_neutral_threshold, 25, 0, 1000000);
    this.config.grid_voltage_warning_threshold = this._clampNumber(this.config.grid_voltage_warning_threshold, 245, 0, 1000);
    this.config.grid_voltage_critical_threshold = this._clampNumber(this.config.grid_voltage_critical_threshold, 253, this.config.grid_voltage_warning_threshold, 1000);
    Object.assign(this.config, normalizeAdvisorConfig(this.config));
    this.config.pv_roof_string_display = normalizePvRoofStringDisplay(this.config.pv_roof_string_display);
    this.config.pv_roof_strings = normalizePvRoofStrings(this.config.pv_roof_strings || []);
    this.config.inverter_display = normalizeInverterDisplay(this.config.inverter_display);
    this.config.inverters = normalizeInverters(this.config.inverters || []);
    this.config.chart_hours = [24, 48].includes(Number(this.config.chart_hours)) ? Number(this.config.chart_hours) : 24;
    this.config.records_range = String(this.config.records_range || this.config.records_days || `${RECORDS_DEFAULT_DAYS}d`);
    this._chartHours = this._chartHours || this.config.chart_hours;
    this._recordsRange = this._recordsRange || this.config.records_range;
    this._historyCache = this._historyCache || new Map();
    this._chartDashboardLoading = this._chartDashboardLoading || new Set();
    this._recordsCache = this._recordsCache || new Map();
    this._recordsRawHistoryCache = this._recordsRawHistoryCache || new Map();
    this._recordsLoading = this._recordsLoading || new Set();
    this._overlayConsumptionCache = this._overlayConsumptionCache || new Map();
    this._overlayConsumptionLoading = this._overlayConsumptionLoading || new Set();
    this._energyRangeCache = this._energyRangeCache || new Map();
    this._energyRangeLoading = this._energyRangeLoading || new Set();

    this._selectedHouse = house;
    this._selectedEnergyRange = this._normalizeEnergyRange(this._selectedEnergyRange || this.config.energy_range) || "live";
    this._selectedViewMode = this._normalizeViewMode(this._selectedViewMode || this.config.view_mode) || "house";

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this._renderCardShell(this._layoutState());
    this._ensureTranslationsForRender();
  }

  set hass(hass) {
    const previousLanguage = this._lastLanguage || this._language();
    const previousImageKey = this._lastImageKey || this._imageStateKey();
    this._hass = hass;
    if (!this.config || !this.shadowRoot) return;

    const nextLanguage = this._language();
    const nextImageKey = this._imageStateKey();
    if (this.shadowRoot && (previousImageKey !== nextImageKey || previousLanguage !== nextLanguage)) {
      this._renderCardShell(this._layoutState());
      this._ensureTranslationsForRender();
      return;
    }
    this._updateReadings();
  }

  getCardSize() {
    return 6;
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
      if (!this.config || !this.shadowRoot || this._language() !== language) return;
      this._renderCardShell(this._layoutState());
    });
  }

  _displayTitle() {
    return this._hasCustomTitle ? this.config.title : this._t("card.defaultTitle", {}, this.config.title);
  }

  _houseLabel(key, variant = HOUSE_VARIANTS[key]) {
    return this._t(`house.${key}`, {}, variant?.label || key);
  }

  _normalizeHouse(value) {
    return normalizeHouse(value);
  }

  _normalizeEnergyRange(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "hour" || normalized === "hourly" || normalized === "1hr" || normalized === "60m") return "1h";
    if (normalized === "day" || normalized === "today" || normalized === "daily" || normalized === "24hr") return "24h";
    if (normalized === "monthly") return "month";
    if (normalized === "yearly") return "year";
    if (normalized === "all" || normalized === "overall" || normalized === "lifetime") return "total";
    return ENERGY_RANGE_OPTIONS.some((option) => option.key === normalized) ? normalized : undefined;
  }

  _normalizeViewMode(value) {
    return normalizeViewMode(value);
  }

  _currentViewMode() {
    return this._normalizeViewMode(this._selectedViewMode || this.config?.view_mode) || "house";
  }

  _currentEnergyRange() {
    return this._normalizeEnergyRange(this._selectedEnergyRange || this.config?.energy_range) || "live";
  }

  _energyEntityConfig(key) {
    const config = this.config.energy_entities?.[key];
    if (!config) return {};
    if (typeof config === "string") return { entity: config };
    return typeof config === "object" ? config : {};
  }

  _metricEnergySource(metric, range = this._currentEnergyRange()) {
    if (!metric || metric.overlay || metric.customKpi || metric.gridStatus) return "";
    const normalizedRange = this._normalizeEnergyRange(range);
    if (!normalizedRange || normalizedRange === "live") return "";
    if (metric.unit === "volume") {
      const entityId = this.config.entities?.[metricSourceKey(metric)] || "";
      return entityId ? {
        entityId,
        mode: normalizedRange === "total" ? "direct" : "counter",
        range: normalizedRange,
        kind: "volume",
        defaultUnit: this._volumeTargetUnit(metric),
      } : "";
    }
    if (metric.unit !== "power") return "";
    if (metric.largeConsumer) {
      const counterEntityId = this._largeConsumerEnergyEntityId(metric);
      return counterEntityId ? { entityId: counterEntityId, mode: normalizedRange === "total" ? "direct" : "counter", range: normalizedRange, kind: "energy", defaultUnit: "kWh" } : "";
    }
    const config = this._energyEntityConfig(metric.key);
    const counterEntityId = config.entity || config.counter || config.kwh_entity || config.kwh || config.meter || "";
    if (counterEntityId) return { entityId: counterEntityId, mode: normalizedRange === "total" ? "direct" : "counter", range: normalizedRange, kind: "energy", defaultUnit: "kWh" };
    return "";
  }

  _metricEnergyEntityId(metric, range = this._currentEnergyRange()) {
    return this._metricEnergySource(metric, range)?.entityId || "";
  }

  _isMetricEnergyMode(metric) {
    return metric?.unit === "power" && this._currentEnergyRange() !== "live" && Boolean(this._metricEnergyEntityId(metric));
  }

  _getEntityValue(entityId, fallback = "0") {
    const entity = this._getEntity(entityId);
    if (!entity) return fallback;
    return entity.state;
  }

  _getEntity(entityId) {
    if (!entityId) return undefined;
    return this._hass?.states?.[entityId];
  }

  _getEntityUnit(entityId) {
    return this._getEntity(entityId)?.attributes?.unit_of_measurement;
  }

  _getEntityLastUpdated(entityId) {
    const entity = this._getEntity(entityId);
    return entity?.last_updated || entity?.last_changed;
  }

  _getEntityLastChangedMs(entityId) {
    const rawTimestamp = this._getEntity(entityId)?.last_changed;
    const timestamp = Date.parse(rawTimestamp || "");
    return Number.isFinite(timestamp) ? timestamp : undefined;
  }

  _entityAgeMinutes(entityId) {
    const timestamp = Date.parse(this._getEntityLastUpdated(entityId) || "");
    return Number.isFinite(timestamp) ? Math.max(0, (Date.now() - timestamp) / 60000) : undefined;
  }

  _trackedConditionMinutes(key, active, sinceHintMs) {
    if (!this._advisorConditionSince) this._advisorConditionSince = new Map();
    if (!key || !active) {
      if (key) this._advisorConditionSince.delete(key);
      return undefined;
    }

    const now = Date.now();
    const hintedSince = Number.isFinite(sinceHintMs) && sinceHintMs > 0 && sinceHintMs <= now
      ? sinceHintMs
      : undefined;
    const existingSince = this._advisorConditionSince.get(key);
    const since = Number.isFinite(existingSince)
      ? Math.min(existingSince, hintedSince ?? existingSince)
      : hintedSince ?? now;
    this._advisorConditionSince.set(key, since);
    return Math.max(0, (now - since) / 60000);
  }

  _stopAdvisorRefreshTimer() {
    if (!this._advisorRefreshTimer) return;
    window.clearInterval(this._advisorRefreshTimer);
    this._advisorRefreshTimer = undefined;
  }

  _syncAdvisorRefreshTimer(active) {
    if (!active || !this._isCardConnected) {
      this._stopAdvisorRefreshTimer();
      return;
    }
    if (this._advisorRefreshTimer) return;
    this._advisorRefreshTimer = window.setInterval(() => {
      if (!this._isCardConnected || this._currentViewMode() !== "advisor") {
        this._stopAdvisorRefreshTimer();
        return;
      }
      this._updateReadings();
    }, 60000);
  }

  _gridSignedEntityId() {
    return gridSignedEntityId(this.config);
  }

  _gridImportEntityId() {
    return gridImportEntityId(this.config);
  }

  _gridExportEntityId() {
    return gridExportEntityId(this.config);
  }

  _hasGridPowerSource() {
    return hasGridPowerSource(this.config);
  }

  _gridPrimaryEntityId() {
    return gridPrimaryEntityId(this.config);
  }

  _metricEntityId(metric) {
    if (metric.chartEntityId) return metric.chartEntityId;
    if (metric.overlay) return this.config.image_overlays?.[metric.overlay]?.entity || "";
    if (metric.customKpi) return metric.customKpi.entity || "";
    if (metric.environmentSensor) return metric.environmentSensor.entity || "";
    if (metric.largeConsumer) {
      if (this._currentEnergyRange() !== "live" && metric.unit === "power") return this._metricEnergyEntityId(metric);
      return this._largeConsumerPowerEntityId(metric);
    }
    if (isImportExportMetric(metric)) return this._gridPrimaryEntityId();
    if (!metric.gridStatus && this._currentEnergyRange() !== "live" && ["power", "volume"].includes(metric.unit)) return this._metricEnergyEntityId(metric);
    return this.config.entities?.[metricSourceKey(metric)] || "";
  }

  _formatValue(value) {
    return formatValue(value);
  }

  _unitForMetric(metric) {
    if (metric.chartUnit) return metric.chartUnit;
    if (metric.overlay) return this.config.image_overlays?.[metric.overlay]?.unit || "auto";
    if (metric.customKpi) return metric.customKpi.unit;
    if (metric.environmentSensor) return metric.environmentSensor.unit || "auto";
    if (metric.largeConsumer) return metric.largeConsumer.unit || this.config.units?.power || "auto";
    const metricUnit = this.config.units?.[metric.key];
    if (metricUnit !== undefined && String(metricUnit).trim() !== "") return metricUnit;
    return this.config.units?.[metric.unit];
  }

  _isPvRoofMetric(metric) {
    return isPvRoofMetric(metric);
  }

  _pvRoofStringDisplayMode() {
    return normalizePvRoofStringDisplay(this.config.pv_roof_string_display);
  }

  _pvRoofBaseEnergyEntityId() {
    const config = this._energyEntityConfig("pv_roof_power");
    return pvRoofBaseEnergyEntityId(config);
  }

  _pvRoofStringEntries() {
    return buildPvRoofStringEntries({
      strings: this.config.pv_roof_strings || [],
      powerEntityId: this.config.entities?.pv_roof_power || "",
      energyEntityId: this._pvRoofBaseEnergyEntityId(),
      maxPowerKw: this.config.max_power_kw?.pv_roof_power,
      maxPowerW: this.config.max_power_w?.pv_roof_power,
      maxPower: this.config.max_power?.pv_roof_power,
    });
  }

  _hasAdditionalPvRoofStrings() {
    return hasAdditionalPvRoofStrings(this._pvRoofStringEntries());
  }

  _pvRoofStringEntryPowerWatts(entry) {
    if (!entry?.powerEntityId) return undefined;
    const watts = this._valueAsWatts(this._getEntityValue(entry.powerEntityId, undefined), this._getEntityUnit(entry.powerEntityId));
    return Number.isFinite(watts) ? Math.max(0, watts) : undefined;
  }

  _pvRoofPowerUnit(metric) {
    return this._unitForMetric(metric || { key: "pv_roof_power", unit: "power" }) || "auto";
  }

  _pvRoofStringPowerParts(metric) {
    const unit = this._pvRoofPowerUnit(metric);
    return pvRoofStringPowerParts(this._pvRoofStringEntries(), {
      unit,
      readPowerWatts: (entry) => this._pvRoofStringEntryPowerWatts(entry),
      formatPowerValue: (value, targetUnit, entityUnit) => this._formatPowerValue(value, targetUnit, entityUnit),
    });
  }

  _pvRoofStringPowerWatts() {
    if (!this._hasAdditionalPvRoofStrings()) return undefined;
    return pvRoofStringTotalPowerWatts(this._pvRoofStringPowerParts());
  }

  _pvRoofStringMaxPowerWatts() {
    if (!this._hasAdditionalPvRoofStrings()) return undefined;
    return pvRoofStringMaxPowerWatts(this._pvRoofStringEntries());
  }

  _pvRoofStringEnergyParts() {
    const range = this._currentEnergyRange();
    return pvRoofStringEnergyParts(this._pvRoofStringEntries(), {
      range,
      readEnergyInfo: (entry, selectedRange) => this._energyRangeConsumptionInfoForSource({
        entityId: entry.energyEntityId,
        mode: selectedRange === "total" ? "direct" : "counter",
        range: selectedRange,
      }),
      formatEnergyValue: (value, entityUnit, targetUnit) => this._formatEnergyValue(value, entityUnit, targetUnit),
    });
  }

  _pvRoofStringReadingParts(metric) {
    if (!this._isPvRoofMetric(metric) || !this._hasAdditionalPvRoofStrings()) return [];
    return this._currentEnergyRange() === "live"
      ? this._pvRoofStringPowerParts(metric)
      : this._pvRoofStringEnergyParts();
  }

  _formatPvRoofStringReading(metric) {
    const parts = this._pvRoofStringReadingParts(metric);
    return formatPvRoofStringReading({
      parts,
      mode: this._pvRoofStringDisplayMode(),
      range: this._currentEnergyRange(),
      unit: this._pvRoofPowerUnit(metric),
      formatPowerValue: (value, unit, entityUnit) => this._formatPowerValue(value, unit, entityUnit),
      formatEnergyValue: (value, entityUnit, targetUnit) => this._formatEnergyValue(value, entityUnit, targetUnit),
    });
  }

  _isInverterMetric(metric) {
    return metric?.key === "inverter_power";
  }

  _inverterDisplayMode() {
    return normalizeInverterDisplay(this.config.inverter_display);
  }

  _inverterBaseEnergyEntityId() {
    const config = this._energyEntityConfig("inverter_power");
    return pvRoofBaseEnergyEntityId(config);
  }

  _inverterBaseVoltageEntityId(phase = "") {
    const normalizedPhase = String(phase || "").toLowerCase();
    if (normalizedPhase) return this.config.entities?.[`inverter_power_voltage_${normalizedPhase}`] || "";
    return [
      "inverter_power_voltage",
      "inverter_power_volt",
      "inverter_power_volts",
    ].map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _inverterEntries() {
    const labelPrefix = this._t("metrics.inverter_power", {}, "Inverter");
    return buildInverterEntries({
      inverters: this.config.inverters || [],
      powerEntityId: this.config.entities?.inverter_power || "",
      energyEntityId: this._inverterBaseEnergyEntityId(),
      maxPowerKw: this.config.max_power_kw?.inverter_power,
      maxPowerW: this.config.max_power_w?.inverter_power,
      maxPower: this.config.max_power?.inverter_power,
      voltageEntityId: this._inverterBaseVoltageEntityId(),
      voltageEntityIdL1: this._inverterBaseVoltageEntityId("l1"),
      voltageEntityIdL2: this._inverterBaseVoltageEntityId("l2"),
      voltageEntityIdL3: this._inverterBaseVoltageEntityId("l3"),
    }).map((entry, index) => {
      const fallbackLabel = `${labelPrefix} ${index + 1}`;
      const defaultEnglishLabel = `Inverter ${index + 1}`;
      return {
        ...entry,
        label: !entry.label || entry.label === defaultEnglishLabel ? fallbackLabel : entry.label,
      };
    });
  }

  _inverterVoltageDefinitionKey(entry, index, phase = "") {
    if (entry?.base) return phase ? `inverter_power_voltage_${phase}` : "inverter_power_voltage";
    const id = String(entry?.id || `inverter_${index + 1}`).replace(/[^\w-]+/g, "_");
    return phase ? `inverter_${id}_voltage_${phase}` : `inverter_${id}_voltage`;
  }

  _hasAdditionalInverters() {
    return hasAdditionalInverters(this._inverterEntries());
  }

  _inverterEntryPowerWatts(entry) {
    if (!entry?.powerEntityId) return undefined;
    const watts = this._valueAsWatts(this._getEntityValue(entry.powerEntityId, undefined), this._getEntityUnit(entry.powerEntityId));
    return Number.isFinite(watts) ? Math.max(0, watts) : undefined;
  }

  _inverterPowerUnit(metric) {
    return this._unitForMetric(metric || { key: "inverter_power", unit: "power" }) || "auto";
  }

  _inverterPowerParts(metric) {
    const unit = this._inverterPowerUnit(metric);
    return inverterPowerParts(this._inverterEntries(), {
      unit,
      readPowerWatts: (entry) => this._inverterEntryPowerWatts(entry),
      formatPowerValue: (value, targetUnit, entityUnit) => this._formatPowerValue(value, targetUnit, entityUnit),
    });
  }

  _inverterPowerWatts() {
    if (!this._hasAdditionalInverters()) return undefined;
    return inverterTotalPowerWatts(this._inverterPowerParts());
  }

  _inverterMaxPowerWatts() {
    if (!this._hasAdditionalInverters()) return undefined;
    return inverterMaxPowerWatts(this._inverterEntries());
  }

  _inverterEnergyParts() {
    const range = this._currentEnergyRange();
    return inverterEnergyParts(this._inverterEntries(), {
      range,
      readEnergyInfo: (entry, selectedRange) => this._energyRangeConsumptionInfoForSource({
        entityId: entry.energyEntityId,
        mode: selectedRange === "total" ? "direct" : "counter",
        range: selectedRange,
      }),
      formatEnergyValue: (value, entityUnit, targetUnit) => this._formatEnergyValue(value, entityUnit, targetUnit),
    });
  }

  _inverterReadingParts(metric) {
    if (!this._isInverterMetric(metric) || !this._hasAdditionalInverters()) return [];
    return this._currentEnergyRange() === "live"
      ? this._inverterPowerParts(metric)
      : this._inverterEnergyParts();
  }

  _formatInverterReading(metric) {
    const parts = this._inverterReadingParts(metric);
    return formatInverterReading({
      parts,
      mode: this._inverterDisplayMode(),
      range: this._currentEnergyRange(),
      unit: this._inverterPowerUnit(metric),
      formatPowerValue: (value, unit, entityUnit) => this._formatPowerValue(value, unit, entityUnit),
      formatEnergyValue: (value, entityUnit, targetUnit) => this._formatEnergyValue(value, entityUnit, targetUnit),
    });
  }

  _multiSourceReadingParts(metric) {
    if (this._isPvRoofMetric(metric)) return this._pvRoofStringReadingParts(metric);
    if (this._isInverterMetric(metric)) return this._inverterReadingParts(metric);
    return [];
  }

  _multiSourceDisplayMode(metric) {
    if (this._isInverterMetric(metric)) return this._inverterDisplayMode();
    return this._pvRoofStringDisplayMode();
  }

  _renderMetricValueHtml(metric) {
    const parts = this._multiSourceReadingParts(metric);
    const mode = this._multiSourceDisplayMode(metric);
    if (parts.length === 0 || mode === "sum") return this._escape(this._formatReading(metric));
    const orderedParts = mode === "dominant"
      ? [...parts].sort((a, b) => (Number.isFinite(b.amount) ? b.amount : -Infinity) - (Number.isFinite(a.amount) ? a.amount : -Infinity))
      : parts;
    const valueHtml = orderedParts.map((part, index) => {
      const className = classNames("value-part", { "value-secondary": mode === "dominant" && index > 0 });
      return htmlTag("span", { class: className, title: part.label || "" }, part.formatted);
    }).join(htmlTag("span", { class: "value-separator" }, "/"));
    return htmlTag("span", { class: ["value-combo", `value-combo-${mode}`] }, rawHtml(valueHtml));
  }

  _formatReading(metric) {
    if (metric.gridStatus) return this._formatGridStatusReading();
    if (metric.overlay) return this._formatOverlayReading(metric.overlay);
    if (metric.customKpi) return this._formatCustomKpiValue(metric.customKpi);
    if (metric.environmentSensor) return this._formatEnvironmentSensorValue(metric.environmentSensor);
    if (metric.key === "import_export_power") return this._formatGridValueReading();
    if (this._isPvRoofMetric(metric)) {
      const stringReading = this._formatPvRoofStringReading(metric);
      if (stringReading) return stringReading;
    }
    if (this._isInverterMetric(metric)) {
      const inverterReading = this._formatInverterReading(metric);
      if (inverterReading) return inverterReading;
    }
    if (this._currentEnergyRange() !== "live" && metric.unit === "power") {
      return this._formatEnergyRangeReading(metric);
    }
    if (this._currentEnergyRange() !== "live" && metric.unit === "volume") {
      return this._formatEnergyRangeReading(metric);
    }
    const entityId = this._metricEntityId(metric);
    const fallbackValue = entityId ? undefined : metric.largeConsumer ? "" : "0";
    const value = this._getEntityValue(entityId, fallbackValue);
    const unit = this._unitForMetric(metric);
    const entityUnit = this._getEntityUnit(entityId);
    if (metric.unit === "power") return this._formatPowerValue(value, unit, entityUnit);
    if (metric.unit === "volume") return this._formatVolumeValue(value, entityUnit, this._volumeTargetUnit(metric));
    return this._formatWithUnit(value, unit);
  }

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
  }

  _customKpiMetrics() {
    return (this.config.custom_kpis || [])
      .filter((kpi) => kpi.visible !== false)
      .map((kpi, index) => ({
        key: `custom_kpis.${kpi.id || index}`,
        label: kpi.label,
        unit: "custom",
        color: "blue",
        accentColor: kpi.color,
        customKpi: kpi,
        tileOrder: kpi.position ?? 100 + index,
        tileColumns: kpi.columns ?? 1,
      }));
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
        const id = String(sensor.id || sensor.key || sensor.entity || `environment_${index + 1}`).trim().replace(/[^\w-]/g, "_");
        const position = this._clampNumber(sensor.position ?? sensor.order ?? 300 + index, 300 + index, 0, 999);
        const columns = Math.round(this._clampNumber(sensor.columns ?? sensor.span ?? 1, 1, 1, 6));
        const left = this._clampNumber(sensor.left ?? sensor.x, 50, 0, 100);
        const top = this._clampNumber(sensor.top ?? sensor.y, 50, 0, 100);
        return {
          id,
          label: String(sensor.label || sensor.name || "").trim(),
          entity: String(sensor.entity || sensor.entity_id || sensor.sensor || "").trim(),
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
  }

  _environmentSensorLabel(sensor, index = 0) {
    if (sensor?.label) return sensor.label;
    const entity = this._getEntity(sensor?.entity);
    const friendlyName = entity?.attributes?.friendly_name || entity?.attributes?.name;
    if (friendlyName) return String(friendlyName);
    return this._t("environment.sensor", { index: index + 1 }, `Environment ${index + 1}`);
  }

  _environmentSensorMetrics({ placement = "" } = {}) {
    if (this.config.show_environment_sensors === false) return [];
    return (this.config.environment_sensors || [])
      .filter((sensor) => sensor.visible !== false && sensor.entity)
      .filter((sensor) => {
        if (placement === "footer") return sensor.show_footer !== false;
        if (placement === "image") return sensor.show_image === true;
        return sensor.show_footer !== false || sensor.show_image === true;
      })
      .map((sensor, index) => ({
        key: `environment_sensors.${sensor.id || index}`,
        label: this._environmentSensorLabel(sensor, index),
        unit: "environment",
        color: "green",
        accentColor: sensor.color,
        environmentSensor: sensor,
        tileOrder: sensor.position ?? 300 + index,
        tileColumns: sensor.columns ?? 1,
      }))
      .sort((a, b) => (a.tileOrder ?? 0) - (b.tileOrder ?? 0));
  }

  _normalizeFloorplan(floorplan = {}) {
    const source = floorplan && typeof floorplan === "object" ? floorplan : {};
    const rooms = Array.isArray(source.rooms) ? source.rooms : [];
    const walls = Array.isArray(source.walls) ? source.walls : [];
    const sensors = Array.isArray(source.sensors) ? source.sensors : [];
    return {
      show_grid: source.show_grid !== false,
      rooms: rooms
        .map((room, index) => {
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
        })
        .filter(Boolean),
      walls: walls
        .map((wall, index) => {
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
        })
        .filter(Boolean),
      sensors: sensors
        .map((sensor, index) => {
          if (!sensor || typeof sensor !== "object") return undefined;
          return {
            id: normalizeConfigId(sensor.id || sensor.key || sensor.entity || sensor.environment_sensor, `sensor_${index + 1}`),
            label: String(sensor.label || sensor.name || "").trim(),
            entity: String(sensor.entity || sensor.entity_id || "").trim(),
            environment_sensor: String(sensor.environment_sensor || sensor.environmentSensor || "").trim(),
            unit: sensor.unit ?? "auto",
            x: this._clampNumber(sensor.x ?? sensor.left, 50, 0, 100),
            y: this._clampNumber(sensor.y ?? sensor.top, 35, 0, 70),
            color: this._safeCssColor(sensor.color, "#34d399"),
            visible: sensor.visible !== false,
          };
        })
        .filter(Boolean),
    };
  }

  _floorplanEnvironmentSensor(id) {
    if (!id) return undefined;
    return (this.config.environment_sensors || []).find((sensor) => sensor.id === id);
  }

  _floorplanSensorSource(sensor, index = 0) {
    const linkedSensor = this._floorplanEnvironmentSensor(sensor?.environment_sensor);
    const label = sensor?.label || (linkedSensor ? this._environmentSensorLabel(linkedSensor, index) : "");
    const entity = linkedSensor?.entity || sensor?.entity || "";
    const unit = sensor?.unit !== undefined && sensor?.unit !== "" ? sensor.unit : linkedSensor?.unit ?? "auto";
    const color = sensor?.color || linkedSensor?.color || "#34d399";
    return {
      label: label || this._t("floorplan.sensor", { index: index + 1 }, `Sensor ${index + 1}`),
      entity,
      unit,
      color,
    };
  }

  _floorplanSensorValue(sensor, index = 0) {
    const source = this._floorplanSensorSource(sensor, index);
    if (!source.entity) return "—";
    const value = this._getEntityValue(source.entity, undefined);
    const entityUnit = this._getEntityUnit(source.entity);
    const unit = this._normalizeUnit(source.unit) === "auto" ? entityUnit : source.unit;
    return this._formatWithUnit(value, unit);
  }

  _renderFloorplanDashboard() {
    const floorplan = this.config.floorplan || this._normalizeFloorplan();
    const grid = floorplan.show_grid !== false
      ? Array.from({ length: 11 }, (_item, index) => index * 10).map((x) => `<line class="floorplan-grid-line" x1="${x}" y1="0" x2="${x}" y2="70"></line>`).join("")
        + Array.from({ length: 8 }, (_item, index) => index * 10).map((y) => `<line class="floorplan-grid-line" x1="0" y1="${y}" x2="100" y2="${y}"></line>`).join("")
      : "";
    const rooms = floorplan.rooms.map((room) => `
      <g class="floorplan-room" style="--room-color:${this._escape(room.color)}">
        <rect x="${this._escape(room.x)}" y="${this._escape(room.y)}" width="${this._escape(room.width)}" height="${this._escape(room.height)}" rx="1.4"></rect>
        <text x="${this._escape(room.x + 1.6)}" y="${this._escape(room.y + 4.2)}">${this._escape(room.label)}</text>
      </g>
    `).join("");
    const walls = floorplan.walls.map((wall) => `
      <line class="floorplan-wall" x1="${this._escape(wall.x1)}" y1="${this._escape(wall.y1)}" x2="${this._escape(wall.x2)}" y2="${this._escape(wall.y2)}" style="--wall-color:${this._escape(wall.color)};--wall-width:${this._escape(wall.width)}"></line>
    `).join("");
    const sensors = floorplan.sensors
      .filter((sensor) => sensor.visible !== false)
      .map((sensor, index) => {
        const source = this._floorplanSensorSource(sensor, index);
        const value = this._floorplanSensorValue(sensor, index);
        const title = source.entity ? `${source.label}: ${value} (${source.entity})` : source.label;
        return `
          <g class="floorplan-sensor" data-floorplan-sensor="${this._escape(sensor.id)}" style="--sensor-color:${this._escape(source.color)}" transform="translate(${this._escape(sensor.x)} ${this._escape(sensor.y)})">
            <title>${this._escape(title)}</title>
            <circle r="1.7"></circle>
            <foreignObject x="2.6" y="-5.4" width="26" height="10">
              <div xmlns="http://www.w3.org/1999/xhtml" class="floorplan-sensor-card">
                <span data-floorplan-sensor-label="${this._escape(sensor.id)}">${this._escape(source.label)}</span>
                <strong data-floorplan-sensor-value="${this._escape(sensor.id)}">${this._escape(value)}</strong>
              </div>
            </foreignObject>
          </g>
        `;
      })
      .join("");
    const empty = floorplan.rooms.length === 0 && floorplan.walls.length === 0 && floorplan.sensors.length === 0
      ? `<div class="floorplan-empty">${this._escape(this._t("floorplan.empty", {}, "Create rooms, walls, and sensors in the card editor."))}</div>`
      : "";
    return `
      <section class="floorplan-dashboard" data-floorplan-dashboard>
        <div class="floorplan-head">
          <div>
            <div class="chart-dashboard-label">${this._escape(this._t("floorplan.label", {}, "Floorplan"))}</div>
            <h2>${this._escape(this._t("floorplan.title", {}, "Home floorplan"))}</h2>
          </div>
          <span>${this._escape(this._t("floorplan.counts", { rooms: floorplan.rooms.length, sensors: floorplan.sensors.length }, `${floorplan.rooms.length} rooms · ${floorplan.sensors.length} sensors`))}</span>
        </div>
        <div class="floorplan-canvas">
          <svg viewBox="0 0 100 70" role="img" aria-label="${this._escape(this._t("floorplan.title", {}, "Home floorplan"))}" preserveAspectRatio="xMidYMid meet">
            <rect class="floorplan-background" x="0" y="0" width="100" height="70" rx="1.5"></rect>
            ${grid}
            ${rooms}
            ${walls}
            ${sensors}
          </svg>
          ${empty}
        </div>
      </section>
    `;
  }

  _updateFloorplanReadings() {
    const floorplan = this.config?.floorplan;
    if (!floorplan || this._currentViewMode() !== FLOORPLAN_DASHBOARD_VIEW) return;
    (floorplan.sensors || []).forEach((sensor, index) => {
      const source = this._floorplanSensorSource(sensor, index);
      const value = this._floorplanSensorValue(sensor, index);
      this.shadowRoot.querySelectorAll(`[data-floorplan-sensor-label="${this._escape(sensor.id)}"]`).forEach((element) => {
        if (element.textContent !== source.label) element.textContent = source.label;
      });
      this.shadowRoot.querySelectorAll(`[data-floorplan-sensor-value="${this._escape(sensor.id)}"]`).forEach((element) => {
        if (element.textContent !== value) element.textContent = value;
      });
      this.shadowRoot.querySelectorAll(`[data-floorplan-sensor="${this._escape(sensor.id)}"]`).forEach((element) => {
        element.style.setProperty("--sensor-color", source.color);
      });
    });
  }

  _largeConsumerLabel(consumer, index = 0) {
    return largeConsumerLabel(consumer, index, (key, params, fallback) => this._t(key, params, fallback));
  }

  _largeConsumerHasEntity(consumer) {
    return largeConsumerHasEntity(consumer);
  }

  _largeConsumerMetrics() {
    return largeConsumerMetrics(this.config.large_consumers || [], {
      labelForConsumer: (consumer, index) => this._largeConsumerLabel(consumer, index),
    });
  }

  _largeConsumerPowerEntityId(metricOrConsumer) {
    return largeConsumerPowerEntityId(metricOrConsumer);
  }

  _largeConsumerEnergyEntityId(metricOrConsumer) {
    return largeConsumerEnergyEntityId(metricOrConsumer);
  }

  _largeConsumerVoltageEntityId(metricOrConsumer) {
    return largeConsumerVoltageEntityId(metricOrConsumer);
  }

  _metricVoltageEntityKey(metric) {
    if (!metric || metric.unit !== "power") return "";
    return metricVoltageEntityKey(metric);
  }

  _metricVoltagePhaseDefinitions(metric) {
    return inverterPhaseVoltageEntityKeys(metric).map((key) => ({ key, phase: key.slice(-2).toUpperCase() }));
  }

  _metricVoltageEntityDefinitions(metric) {
    if (!metric || metric.unit !== "power") return [];
    if (metric.largeConsumer) {
      return [{
        key: `large_consumers.${metric.largeConsumer.id || metric.key}.voltage`,
        entityId: this._largeConsumerVoltageEntityId(metric),
        phase: "",
      }];
    }
    const key = metricSourceKey(metric);
    if (key === "inverter_power") {
      const inverterEntries = this._inverterEntries();
      const hasMultipleInverters = inverterEntries.some((entry) => !entry.base && (entry.powerEntityId || entry.energyEntityId || entry.voltageEntityId || entry.voltageEntityIdL1 || entry.voltageEntityIdL2 || entry.voltageEntityIdL3));
      return inverterEntries.flatMap((entry, index) => {
        const label = entry.label || `${this._t("metrics.inverter_power", {}, "Inverter")} ${index + 1}`;
        const displayPrefix = hasMultipleInverters ? label : "";
        return [
          {
            key: this._inverterVoltageDefinitionKey(entry, index),
            entityId: entry.voltageEntityId || "",
            phase: "",
            label,
            displayPrefix,
          },
          {
            key: this._inverterVoltageDefinitionKey(entry, index, "l1"),
            entityId: entry.voltageEntityIdL1 || "",
            phase: "L1",
            label: `${label} L1`,
            displayPrefix: hasMultipleInverters ? `${label} L1` : "L1",
          },
          {
            key: this._inverterVoltageDefinitionKey(entry, index, "l2"),
            entityId: entry.voltageEntityIdL2 || "",
            phase: "L2",
            label: `${label} L2`,
            displayPrefix: hasMultipleInverters ? `${label} L2` : "L2",
          },
          {
            key: this._inverterVoltageDefinitionKey(entry, index, "l3"),
            entityId: entry.voltageEntityIdL3 || "",
            phase: "L3",
            label: `${label} L3`,
            displayPrefix: hasMultipleInverters ? `${label} L3` : "L3",
          },
        ];
      });
    }
    const baseKey = this._metricVoltageEntityKey(metric);
    const aliases = [
      baseKey,
      `${key}_volt`,
      `${key}_volts`,
    ];
    if (key === "import_export_power") aliases.push("grid_voltage", "voltage", "netzspannung");
    if (key === "house_consumption_power") aliases.push("house_voltage", "home_voltage");
    return [
      {
        key: baseKey,
        entityId: aliases.map((alias) => this.config.entities?.[alias]).find(Boolean) || "",
        phase: "",
      },
      ...this._metricVoltagePhaseDefinitions(metric).map((definition) => ({
        ...definition,
        entityId: this.config.entities?.[definition.key] || "",
      })),
    ];
  }

  _metricVoltageEntityId(metric) {
    return this._metricVoltageEntityDefinitions(metric).map((definition) => definition.entityId).find(Boolean) || "";
  }

  _metricVoltageEntries(metric, variant = this._currentVariant || this._layoutState().variant) {
    if (!metric || metric.unit !== "power") return [];
    const baseLabel = this._metricLabel(metric, variant);
    const seen = new Set();
    const entries = [];
    this._metricVoltageEntityDefinitions(metric).forEach((definition) => {
      if (!definition.entityId || seen.has(definition.entityId)) return;
      seen.add(definition.entityId);
      const entity = this._getEntity(definition.entityId);
      const value = this._formatVoltageValue(entity?.state, entity?.attributes?.unit_of_measurement || "V");
      if (value === "—") return;
      const volts = this._valueAsVolts(entity?.state, entity?.attributes?.unit_of_measurement || "V");
      entries.push({
        ...definition,
        metric,
        entityId: definition.entityId,
        volts,
        label: definition.label || (definition.phase ? `${baseLabel} ${definition.phase}` : baseLabel),
        value,
        displayValue: definition.displayPrefix ? `${definition.displayPrefix} ${value}` : definition.phase ? `${definition.phase} ${value}` : value,
      });
    });
    return entries;
  }

  _metricVoltageLabel(metric) {
    return this._metricVoltageEntries(metric)
      .map((entry) => entry.displayValue)
      .filter(Boolean)
      .join(" / ");
  }

  _voltageSensorEntries() {
    const variant = this._currentVariant || this._layoutState().variant;
    const batteryVoltageEntityId = this._batteryVoltageEntityId();
    const batteryMetric = findMetricByKey("battery_level") || { key: "battery_level", label: "Battery", unit: "battery" };
    const metrics = [
      ...this._visibleMetrics(variant),
      ...this._largeConsumerMetrics(),
      ...(this._hasGridPowerSource() ? [STATUS_METRIC] : []),
    ];
    const seen = new Set();
    const entries = metrics
      .flatMap((metric) => this._metricVoltageEntries(metric, variant))
      .map((entry) => {
        if (!entry.entityId || seen.has(entry.entityId) || !Number.isFinite(entry.volts)) return undefined;
        seen.add(entry.entityId);
        return entry;
      })
      .filter(Boolean);
    if (batteryVoltageEntityId && !seen.has(batteryVoltageEntityId)) {
      const entity = this._getEntity(batteryVoltageEntityId);
      const volts = this._valueAsVolts(entity?.state, entity?.attributes?.unit_of_measurement || "V");
      if (Number.isFinite(volts)) {
        return [
          ...entries,
          {
            metric: batteryMetric,
            entityId: batteryVoltageEntityId,
            volts,
            label: this._metricLabel(batteryMetric, variant),
            value: this._formatVoltageValue(entity.state, entity.attributes?.unit_of_measurement || "V"),
          },
        ];
      }
    }
    return entries;
  }

  _gridVoltageAlert() {
    const entries = this._voltageSensorEntries();
    const highest = entries.sort((a, b) => b.volts - a.volts)[0];
    if (!highest) return undefined;
    const warningThreshold = this._clampNumber(this.config.grid_voltage_warning_threshold, 245, 0, 1000);
    const criticalThreshold = this._clampNumber(this.config.grid_voltage_critical_threshold, 253, warningThreshold, 1000);
    if (highest.volts >= criticalThreshold) {
      return {
        ...highest,
        type: "critical",
        label: this._t("warning.gridVoltageCritical", {}, "Grid voltage much too high"),
      };
    }
    if (highest.volts >= warningThreshold) {
      return {
        ...highest,
        type: "warning",
        label: this._t("warning.gridVoltageHigh", {}, "High grid voltage"),
      };
    }
    return undefined;
  }

  _renderVoltageMetaRow(metric, { placement = "footer" } = {}) {
    if (!metric || metric.unit !== "power") return "";
    const entries = this._metricVoltageEntries(metric)
      .filter((entry) => this._showLabelIn(entry.key, placement));
    if (entries.length === 0) return "";
    const badges = entries.map((entry) => {
      const tooltip = `${this._t("tooltip.voltage", {}, "Voltage")}: ${entry.label} ${entry.value}`;
      return `<span class="voltage-badge${this._labelVisibilityClass(entry.key, placement)}" data-voltage="${this._escape(metric.key)}" data-voltage-key="${this._escape(entry.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}">${this._escape(entry.displayValue)}</span>`;
    }).join("");
    return `
      <div class="meta-row voltage-meta-row">
        ${badges}
      </div>
    `;
  }

  _largeConsumerPowerWatts(metricOrConsumer) {
    return largeConsumerPowerWatts(metricOrConsumer, {
      getValue: (entityId) => this._getEntityValue(entityId, undefined),
      getUnit: (entityId) => this._getEntityUnit(entityId),
      valueAsWatts: (value, unit) => this._valueAsWatts(value, unit),
    });
  }

  _formatRoundedCustomValue(value) {
    const normalized = String(value ?? "").trim().replace(",", ".");
    if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) return String(value);
    const number = Number(normalized);
    if (!Number.isFinite(number)) return String(value);
    const decimals = Math.round(this._clampNumber(this.config.power_decimals, 2, 0, 3));
    return number
      .toFixed(decimals)
      .replace(/(\.\d*?)0+$/, "$1")
      .replace(/\.$/, "");
  }

  _formatCustomKpiValue(kpi) {
    const hasEntity = Boolean(kpi.entity);
    const rawValue = hasEntity ? this._getEntityValue(kpi.entity, undefined) : kpi.value;
    const value = this._formatValue(rawValue);
    if (value === "—") return value;
    const roundedValue = this._formatRoundedCustomValue(value);

    const entityUnit = hasEntity ? this._getEntityUnit(kpi.entity) : "";
    const configuredUnit = String(kpi.unit ?? "auto").trim();
    if (!configuredUnit || configuredUnit.toLowerCase() === "none") return String(roundedValue);
    if (configuredUnit.toLowerCase() === "auto") return entityUnit ? `${roundedValue} ${entityUnit}` : String(roundedValue);
    return `${roundedValue} ${configuredUnit}`;
  }

  _formatEnvironmentSensorValue(sensor) {
    if (!sensor?.entity) return "—";
    const rawValue = this._getEntityValue(sensor.entity, undefined);
    const value = this._formatValue(rawValue);
    if (value === "—") return value;
    const roundedValue = this._formatRoundedCustomValue(value);
    const entityUnit = this._getEntityUnit(sensor.entity);
    const configuredUnit = String(sensor.unit ?? "auto").trim();
    if (!configuredUnit || configuredUnit.toLowerCase() === "none") return String(roundedValue);
    if (configuredUnit.toLowerCase() === "auto") return entityUnit ? `${roundedValue} ${entityUnit}` : String(roundedValue);
    return `${roundedValue} ${configuredUnit}`;
  }

  _formatRelativeTime(dateString) {
    const timestamp = Date.parse(dateString || "");
    if (!Number.isFinite(timestamp)) return "";
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    const format = (value, unit) => {
      try {
        return new Intl.RelativeTimeFormat(this._language(), { numeric: "always" }).format(-value, unit);
      } catch (_err) {
        return new Intl.RelativeTimeFormat("en", { numeric: "always" }).format(-value, unit);
      }
    };
    if (seconds < 60) return format(seconds, "second");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return format(minutes, "minute");
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return format(hours, "hour");
    const days = Math.floor(hours / 24);
    return format(days, "day");
  }

  _latestEntityUpdate() {
    const largeConsumerEntities = largeConsumerEntityIds(this.config.large_consumers || []);
    const pvRoofStringEntities = normalizePvRoofStrings(this.config.pv_roof_strings || [])
      .flatMap((string) => [string.power_entity, string.energy_entity])
      .filter(Boolean);
    const inverterEntities = normalizeInverters(this.config.inverters || [])
      .flatMap((inverter) => [
        inverter.power_entity,
        inverter.energy_entity,
        inverter.voltage_entity,
        inverter.voltage_entity_l1,
        inverter.voltage_entity_l2,
        inverter.voltage_entity_l3,
      ])
      .filter(Boolean);
    const timestamps = [
      ...Object.values(this.config.entities || {}),
      ...largeConsumerEntities,
      ...pvRoofStringEntities,
      ...inverterEntities,
    ]
      .map((entityId) => Date.parse(this._getEntityLastUpdated(entityId) || ""))
      .filter(Number.isFinite);
    if (timestamps.length === 0) return "";
    return new Date(Math.max(...timestamps)).toISOString();
  }

  _gridNeutralThreshold() {
    return this._clampNumber(this.config.grid_neutral_threshold, 25, 0, 1000000);
  }

  _configuredLabel(key, fallback) {
    const customLabel = this.config.labels?.[key];
    if (customLabel !== undefined && String(customLabel).trim() !== "") return String(customLabel).trim();
    return fallback;
  }

  _gridStatusLabel(kind) {
    if (kind === "import") return this._configuredLabel("import_export_import", this._t("status.import"));
    if (kind === "export") return this._configuredLabel("import_export_export", this._t("status.export"));
    if (kind === "neutral") return this._configuredLabel("import_export_neutral", this._t("status.selfSufficient"));
    return "";
  }

  _gridSignedFlowInfo() {
    const entityId = this._gridSignedEntityId();
    return gridSignedFlowInfo({
      entityId,
      rawValue: this._getEntityValue(entityId, undefined),
      entityUnit: this._getEntityUnit(entityId),
      unit: this.config.units?.import_export_power || "auto",
      unavailableLabel: this._metricWarning(GRID_STATUS_METRIC)?.label || this._t("warning.sensorUnavailable"),
      formatValue: (value) => this._formatValue(value),
      valueAsWatts: (value, unit) => this._valueAsWatts(value, unit),
      isEnergyUnit: (unit) => this._isEnergyUnit(unit),
      formatEnergyValue: (value, entityUnit, targetUnit) => this._formatEnergyValue(value, entityUnit, targetUnit),
      formatPowerValue: (value, unit, entityUnit) => this._formatPowerValue(value, unit, entityUnit),
    });
  }

  _gridSplitFlowInfo() {
    const importEntityId = this._gridImportEntityId();
    const exportEntityId = this._gridExportEntityId();
    return gridSplitFlowInfo({
      importEntityId,
      exportEntityId,
      importValue: this._entityFlowValue(importEntityId),
      exportValue: this._entityFlowValue(exportEntityId),
      unit: this.config.units?.import_export_power || this.config.units?.power || "auto",
      unavailableLabel: this._metricWarning(GRID_STATUS_METRIC)?.label || this._t("warning.sensorUnavailable"),
    });
  }

  _gridSplitPowerDetails() {
    const importEntityId = this._gridImportEntityId();
    const exportEntityId = this._gridExportEntityId();
    return gridSplitPowerDetails({
      importEntityId,
      exportEntityId,
      importValue: this._entityFlowValue(importEntityId),
      exportValue: this._entityFlowValue(exportEntityId),
    });
  }

  _gridFlowInfo() {
    return this._gridSignedFlowInfo() || this._gridSplitFlowInfo();
  }

  _gridStatusFromFlowInfo(info) {
    return gridStatusFromFlowInfo(info, {
      neutralThreshold: this._gridNeutralThreshold(),
      labelForKind: (kind) => this._gridStatusLabel(kind),
      formatPowerValue: (value, unit, entityUnit) => this._formatPowerValue(value, unit, entityUnit),
    });
  }

  _gridStatusInfo() {
    return this._gridStatusFromFlowInfo(this._gridFlowInfo());
  }

  _formatGridStatusReading() {
    return formatGridStatusReading(this._gridStatusInfo());
  }

  _formatGridValueReading() {
    return formatGridValueReading(this._gridStatusInfo());
  }

  _formatImportExportStatus() {
    return formatImportExportStatus(this._gridStatusInfo());
  }

  _statusLabel() {
    const updatedAt = this._formatRelativeTime(this._latestEntityUpdate());
    const weather = this.config.show_weather_status ? this._formatWeatherStatus() : "";
    return [
      updatedAt ? this._t("status.lastUpdated", { time: updatedAt }) : "",
      weather,
    ].filter(Boolean).join(" / ");
  }

  _formatWeatherStatus() {
    const state = this._weatherState();
    if (!state) return "";
    const weather = this._t(`weather.${state}`, {}, state.replace(/-/g, " "));
    return this._t("status.weather", { weather });
  }

  _formatWithUnit(rawValue, unit) {
    return formatWithUnit(rawValue, unit);
  }

  _normalizeUnit(unit) {
    return normalizeUnit(unit);
  }

  _isEnergyUnit(unit) {
    return isEnergyUnit(unit);
  }

  _isPowerUnit(unit) {
    return isPowerUnit(unit);
  }

  _isVolumeUnit(unit) {
    return isVolumeUnit(unit);
  }

  _valueAsWatts(value, unit) {
    return valueAsWatts(value, unit);
  }

  _valueAsCubicMeters(value, unit) {
    return valueAsCubicMeters(value, unit);
  }

  _valueAsVolts(value, unit) {
    return valueAsVolts(value, unit);
  }

  _formatVoltageValue(rawValue, entityUnit = "V") {
    return formatVoltageValue(rawValue, entityUnit);
  }

  _valueAsKwh(value, unit) {
    return valueAsKwh(value, unit);
  }

  _formatEnergyValue(rawValue, entityUnit, targetUnit = "kWh") {
    return formatEnergyValue(rawValue, entityUnit, targetUnit);
  }

  _volumeTargetUnit(metric) {
    const unit = this._unitForMetric(metric);
    return unit || "m³";
  }

  _formatVolumeValue(rawValue, entityUnit, targetUnit = "m³") {
    return formatVolumeValue(rawValue, entityUnit, targetUnit);
  }

  _energyRangeMinutes(range) {
    const normalizedRange = this._normalizeEnergyRange(range);
    if (normalizedRange === "1h") return 60;
    if (normalizedRange === "24h") return 1440;
    if (normalizedRange === "month") return 30 * 24 * 60;
    if (normalizedRange === "year") return 365 * 24 * 60;
    return undefined;
  }

  _cacheBucketMsForMinutes(minutes) {
    if (!Number.isFinite(minutes) || minutes <= 60) return MINUTE_MS;
    if (minutes <= 24 * 60) return 5 * MINUTE_MS;
    if (minutes <= 31 * 24 * 60) return 30 * MINUTE_MS;
    return 6 * 60 * MINUTE_MS;
  }

  _cacheBucket(bucketMs = MINUTE_MS) {
    return Math.floor(Date.now() / bucketMs);
  }

  _setCacheEntry(cache, key, value, maxEntries) {
    if (!cache) return;
    if (cache.has(key)) cache.delete(key);
    cache.set(key, value);
    while (cache.size > maxEntries) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey === undefined) break;
      cache.delete(oldestKey);
    }
  }

  _isActiveRequest(token) {
    return token === (this._asyncRequestToken || 0);
  }

  _updateReadingsIfReady() {
    if (!this.config || !this.shadowRoot || !this._isCardConnected) return;
    this._updateReadings();
  }

  _energyRangeCacheKey(entityId, range, kind = "energy") {
    const bucket = this._cacheBucket(this._cacheBucketMsForMinutes(this._energyRangeMinutes(range)));
    return `${entityId}|${range}|${kind}|${bucket}`;
  }

  _energyRangeConsumptionInfoForSource(source) {
    const range = this._normalizeEnergyRange(source?.range) || this._currentEnergyRange();
    if (!source?.entityId) return undefined;
    const kind = source.kind || "energy";
    const defaultUnit = source.defaultUnit || (kind === "volume" ? "m³" : "kWh");
    if (source.mode === "direct" || range === "total") {
      const entityUnit = this._getEntityUnit(source.entityId) || defaultUnit;
      const value = this._getEntityValue(source.entityId, undefined);
      const amount = kind === "volume"
        ? numericState(value)
        : this._valueAsKwh(value, entityUnit);
      return {
        amount,
        unit: kind === "volume" ? entityUnit : "kWh",
        entityId: source.entityId,
        mode: "direct",
        kind,
      };
    }

    const minutes = this._energyRangeMinutes(range);
    if (!Number.isFinite(minutes)) return undefined;
    if (this._hass?.states && !this._getEntity(source.entityId)) {
      return { error: true, amount: undefined, unit: defaultUnit, entityId: source.entityId, mode: "counter", kind };
    }

    const key = this._energyRangeCacheKey(source.entityId, range, kind);
    const cached = this._energyRangeCache?.get(key);
    if (cached) return cached;
    this._requestEnergyRangeConsumption(source.entityId, minutes, key, source);
    return { loading: true, amount: undefined, unit: this._getEntityUnit(source.entityId) || defaultUnit, entityId: source.entityId, mode: "counter", kind };
  }

  _energyRangeConsumptionInfo(metric) {
    const range = this._currentEnergyRange();
    return this._energyRangeConsumptionInfoForSource(this._metricEnergySource(metric, range));
  }

  _requestEnergyRangeConsumption(entityId, minutes, key, source = {}) {
    if (!this._hass?.callApi || this._energyRangeLoading?.has(key)) return;
    const requestToken = this._asyncRequestToken || 0;
    const kind = source.kind || "energy";
    const defaultUnit = source.defaultUnit || (kind === "volume" ? "m³" : "kWh");
    this._energyRangeLoading.add(key);
    this._loadCounterConsumption(entityId, minutes, defaultUnit)
      .then((info) => {
        if (!this._isActiveRequest(requestToken)) return;
        const normalizedInfo = kind === "energy"
          ? { ...info, amount: this._valueAsKwh(info.amount, info.unit), unit: "kWh" }
          : info;
        this._setCacheEntry(this._energyRangeCache, key, { ...normalizedInfo, entityId, mode: "counter", kind }, MAX_COUNTER_CACHE_ENTRIES);
      })
      .catch(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._energyRangeCache, key, { error: true, amount: undefined, unit: this._getEntityUnit(entityId) || defaultUnit, entityId, mode: "counter", kind }, MAX_COUNTER_CACHE_ENTRIES);
      })
      .finally(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._energyRangeLoading?.delete(key);
        this._updateReadingsIfReady();
      });
  }

  _formatEnergyRangeReading(metric) {
    const info = this._energyRangeConsumptionInfo(metric);
    if (!info) return "—";
    if (info.loading) return "…";
    if (info.error || !Number.isFinite(info.amount)) return "—";
    if (info.kind === "volume" || metric.unit === "volume") {
      return this._formatVolumeValue(info.amount, info.unit || "m³", this._volumeTargetUnit(metric));
    }
    return this._formatEnergyValue(info.amount, "kWh", "kWh");
  }

  _formatPowerValue(rawValue, unit, entityUnit) {
    return formatPowerValue(rawValue, unit, entityUnit, {
      powerDisplayMode: this.config.power_display_mode || "auto_kw",
    });
  }

  _metricNumericValue(metric) {
    if (metric.overlay) {
      if (metric.overlay === "smoke") return this._overlayGasConsumptionInfo()?.amount;
      const entityId = this.config.image_overlays?.heatpump?.entity;
      const value = this._getEntityValue(entityId, undefined);
      const number = numericState(value);
      return Number.isFinite(number) ? number : undefined;
    }
    if (metric.customKpi) {
      const kpi = metric.customKpi;
      const rawValue = kpi.entity ? this._getEntityValue(kpi.entity, undefined) : kpi.value;
      const number = numericState(rawValue);
      return Number.isFinite(number) ? number : undefined;
    }
    if (metric.environmentSensor) {
      const rawValue = metric.environmentSensor.entity ? this._getEntityValue(metric.environmentSensor.entity, undefined) : undefined;
      const number = numericState(rawValue);
      return Number.isFinite(number) ? number : undefined;
    }
    if (metric.largeConsumer) {
      if (this._currentEnergyRange() !== "live") {
        const info = this._energyRangeConsumptionInfo(metric);
        return Number.isFinite(info?.amount) ? info.amount : undefined;
      }
      return this._largeConsumerPowerWatts(metric);
    }
    if (isImportExportMetric(metric)) {
      const flowInfo = this._gridFlowInfo();
      return Number.isFinite(flowInfo?.watts) ? flowInfo.watts : undefined;
    }
    if (this._isPvRoofMetric(metric)) {
      if (this._currentEnergyRange() !== "live") {
        const values = this._pvRoofStringEnergyParts()
          .map((part) => part.amount)
          .filter(Number.isFinite);
        if (values.length > 0) return values.reduce((sum, value) => sum + value, 0);
      } else {
        const watts = this._pvRoofStringPowerWatts();
        if (Number.isFinite(watts)) return watts;
      }
    }
    if (this._isInverterMetric(metric)) {
      if (this._currentEnergyRange() !== "live") {
        const values = this._inverterEnergyParts()
          .map((part) => part.amount)
          .filter(Number.isFinite);
        if (values.length > 0) return values.reduce((sum, value) => sum + value, 0);
      } else {
        const watts = this._inverterPowerWatts();
        if (Number.isFinite(watts)) return watts;
      }
    }
    if (this._currentEnergyRange() !== "live" && metric.unit === "power") {
      const info = this._energyRangeConsumptionInfo(metric);
      return Number.isFinite(info?.amount) ? info.amount : undefined;
    }
    if (this._currentEnergyRange() !== "live" && metric.unit === "volume") {
      const info = this._energyRangeConsumptionInfo(metric);
      const cubicMeters = this._valueAsCubicMeters(info?.amount, info?.unit || "m³");
      return Number.isFinite(cubicMeters) ? cubicMeters : undefined;
    }
    const entityId = this._metricEntityId(metric);
    const value = this._getEntityValue(entityId, undefined);
    if (value === undefined || value === null || value === "unknown" || value === "unavailable") return undefined;
    const entityUnit = this._getEntityUnit(entityId);
    if (this._isMetricEnergyMode(metric)) return this._valueAsKwh(value, entityUnit);
    if (metric.unit === "power") return this._valueAsWatts(value, entityUnit);
    if (metric.unit === "volume") return this._valueAsCubicMeters(value, entityUnit);
    const number = numericState(value);
    return Number.isFinite(number) ? number : undefined;
  }

  _batteryPercent(metric) {
    if (metric.key !== "battery_level") return undefined;
    const value = this._metricNumericValue(metric);
    if (!Number.isFinite(value)) return undefined;
    return Math.min(100, Math.max(0, value));
  }

  _batterySocEntityId() {
    return this.config.entities?.battery_level || "";
  }

  _batteryMinSocEntityId() {
    const aliases = ["battery_min_soc", "battery_minimum_soc", "battery_reserve_soc", "battery_backup_reserve", "battery_level_min_soc"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _batteryMaxSocEntityId() {
    const aliases = ["battery_max_soc", "battery_maximum_soc", "battery_target_soc", "battery_soc_limit", "battery_charge_limit", "battery_level_max_soc"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _batteryMinSocPercent() {
    return this._numericPercentFromEntity(this._batteryMinSocEntityId());
  }

  _batteryMaxSocPercent() {
    return this._numericPercentFromEntity(this._batteryMaxSocEntityId());
  }

  _batteryCyclesTodayEntityId() {
    const aliases = ["battery_cycles_today", "battery_full_cycles_today", "battery_daily_cycles", "battery_cycles_day"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _batteryCyclesToday() {
    const entityId = this._batteryCyclesTodayEntityId();
    if (!entityId) return undefined;
    const value = numericState(this._getEntityValue(entityId, undefined));
    return Number.isFinite(value) ? Math.max(0, value) : undefined;
  }

  _batteryReserveThreshold() {
    return this._batteryMinSocPercent() ?? this._clampNumber(this.config.battery_low_threshold, 20, 0, 100);
  }

  _batteryFullThreshold() {
    return this._batteryMaxSocPercent() ?? 92;
  }

  _parsePowerLimitWatts(rawValue, defaultUnit = "kw") {
    return parsePowerLimitWatts(rawValue, defaultUnit);
  }

  _maxPowerWatts(metric) {
    if (!metric || metric.unit !== "power") return undefined;
    if (metric.largeConsumer) return this._parsePowerLimitWatts(metric.largeConsumer.max_power_kw, "kw");
    if (this._isPvRoofMetric(metric)) {
      const stringMaxPower = this._pvRoofStringMaxPowerWatts();
      if (Number.isFinite(stringMaxPower)) return stringMaxPower;
    }
    if (this._isInverterMetric(metric)) {
      const inverterMaxPower = this._inverterMaxPowerWatts();
      if (Number.isFinite(inverterMaxPower)) return inverterMaxPower;
    }
    const key = metric.key;
    const fromKw = this.config.max_power_kw?.[key];
    if (fromKw !== undefined && fromKw !== "") return this._parsePowerLimitWatts(fromKw, "kw");
    const fromW = this.config.max_power_w?.[key];
    if (fromW !== undefined && fromW !== "") return this._parsePowerLimitWatts(fromW, "w");
    const legacy = this.config.max_power?.[key];
    return this._parsePowerLimitWatts(legacy, "kw");
  }

  _meterPercent(metric) {
    if (this._currentEnergyRange() !== "live" && metric.unit === "power") return undefined;
    const batteryPercent = this._batteryPercent(metric);
    if (batteryPercent !== undefined) return batteryPercent;

    const maxPowerWatts = this._maxPowerWatts(metric);
    if (!Number.isFinite(maxPowerWatts) || maxPowerWatts <= 0) return undefined;
    const value = Math.abs(this._metricNumericValue(metric) ?? 0);
    return Math.min(100, Math.max(0, (value / maxPowerWatts) * 100));
  }

  _meterTooltip(metric) {
    const percent = this._meterPercent(metric);
    if (percent === undefined) return "";
    const maxPowerWatts = this._maxPowerWatts(metric);
    if (Number.isFinite(maxPowerWatts)) {
      return `${this._t("tooltip.load")}: ${percent.toFixed(0)}%\n${this._t("tooltip.max")}: ${this._formatPowerValue(maxPowerWatts, "kW", "W")}`;
    }
    return `${this._t("tooltip.load")}: ${percent.toFixed(0)}%`;
  }

  _renderMetricMeter(metric) {
    const percent = this._meterPercent(metric);
    if (percent === undefined) return "";
    return htmlTag("div", {
      class: "metric-meter",
      "data-meter": metric.key,
      title: this._meterTooltip(metric),
      "aria-hidden": "true",
    }, rawHtml(htmlTag("span", { style: { width: `${percent.toFixed(0)}%` } })));
  }

  _entityFlowValue(entityId) {
    const value = this._getEntityValue(entityId, undefined);
    if (value === undefined || value === null || value === "unknown" || value === "unavailable") return undefined;
    const entityUnit = this._getEntityUnit(entityId);
    if (this._isEnergyUnit(entityUnit)) {
      const kwhValue = this._valueAsKwh(value, entityUnit);
      return Number.isFinite(kwhValue)
        ? { amount: kwhValue, kind: "energy", unit: "kWh" }
        : undefined;
    }
    const wattValue = this._valueAsWatts(value, entityUnit);
    return Number.isFinite(wattValue)
      ? { amount: wattValue, kind: "power", unit: "W" }
      : undefined;
  }

  _batteryFlowInfo() {
    const signedEntityId = this.config.entities?.battery_flow_power;
    const signedValue = this._entityFlowValue(signedEntityId);
    if (signedValue && signedValue.amount !== 0) {
      return {
        direction: signedValue.amount > 0 ? "charge" : "discharge",
        entityId: signedEntityId,
        amount: Math.abs(signedValue.amount),
        kind: signedValue.kind,
        unit: signedValue.unit,
      };
    }

    const chargeEntityId = this.config.entities?.battery_charge_power;
    const dischargeEntityId = this.config.entities?.battery_discharge_power;
    const chargeValue = this._entityFlowValue(chargeEntityId);
    const dischargeValue = this._entityFlowValue(dischargeEntityId);
    const chargeAmount = Math.max(0, chargeValue?.amount || 0);
    const dischargeAmount = Math.max(0, dischargeValue?.amount || 0);
    if (chargeAmount <= 0 && dischargeAmount <= 0) return undefined;

    return chargeAmount >= dischargeAmount
      ? { direction: "charge", entityId: chargeEntityId, amount: chargeAmount, kind: chargeValue?.kind || "power", unit: chargeValue?.unit || "W" }
      : { direction: "discharge", entityId: dischargeEntityId, amount: dischargeAmount, kind: dischargeValue?.kind || "power", unit: dischargeValue?.unit || "W" };
  }

  _formatBatteryFlowValue(info = this._batteryFlowInfo()) {
    if (!info || !Number.isFinite(info.amount) || info.amount <= 0) return "";
    if (info.kind === "energy") {
      const unit = this.config.units?.battery_flow_power;
      const targetUnit = unit && this._isEnergyUnit(unit) ? unit : "kWh";
      return this._formatEnergyValue(info.amount, "kWh", targetUnit);
    }
    const unit = this.config.units?.battery_flow_power || this.config.units?.power || "auto";
    return this._formatPowerValue(info.amount, unit, "W");
  }

  _overlayPeriodMinutes(key = "smoke") {
    const config = this.config.image_overlays?.[key] || {};
    const raw = config.period_minutes ?? config.minutes ?? config.period ?? "1h";
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(1, raw);
    const normalized = String(raw).trim().toLowerCase();
    if (normalized === "30m" || normalized === "30min" || normalized === "30") return 30;
    if (normalized === "24h" || normalized === "24") return 1440;
    return 60;
  }

  _overlayPeriodValue(key = "smoke") {
    const minutes = this._overlayPeriodMinutes(key);
    if (minutes <= 30) return "30m";
    if (minutes >= 1440) return "24h";
    return "1h";
  }

  _overlayConsumptionCacheKey(entityId, minutes) {
    const bucket = this._cacheBucket(this._cacheBucketMsForMinutes(minutes));
    return `${entityId}|${minutes}|${bucket}`;
  }

  _overlayGasConsumptionInfo() {
    const config = this.config.image_overlays?.smoke || {};
    const entityId = config.entity;
    if (!entityId) return undefined;
    if (this._hass?.states && !this._getEntity(entityId)) {
      return { error: true, amount: undefined, unit: "m³" };
    }

    const minutes = this._overlayPeriodMinutes("smoke");
    const key = this._overlayConsumptionCacheKey(entityId, minutes);
    const cached = this._overlayConsumptionCache?.get(key);
    if (cached) return cached;
    this._requestOverlayGasConsumption(entityId, minutes, key);
    return { loading: true, amount: undefined, unit: this._getEntityUnit(entityId) || "m³" };
  }

  _requestOverlayGasConsumption(entityId, minutes, key) {
    if (!this._hass?.callApi || this._overlayConsumptionLoading?.has(key)) return;
    const requestToken = this._asyncRequestToken || 0;
    this._overlayConsumptionLoading.add(key);
    this._loadCounterConsumption(entityId, minutes)
      .then((info) => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._overlayConsumptionCache, key, info, MAX_COUNTER_CACHE_ENTRIES);
      })
      .catch(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._overlayConsumptionCache, key, { error: true, amount: undefined, unit: this._getEntityUnit(entityId) || "m³" }, MAX_COUNTER_CACHE_ENTRIES);
      })
      .finally(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._overlayConsumptionLoading?.delete(key);
        this._updateReadingsIfReady();
      });
  }

  async _loadCounterConsumption(entityId, minutes, defaultUnit = "m³") {
    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60 * 1000);
    const query = [
      `filter_entity_id=${encodeURIComponent(entityId)}`,
      `end_time=${encodeURIComponent(end.toISOString())}`,
      "significant_changes_only=0",
    ].join("&");
    const history = await this._hass.callApi("GET", `history/period/${start.toISOString()}?${query}`);
    const states = (Array.isArray(history?.[0]) ? history[0] : [])
      .map((entry) => ({
        value: numericState(entry?.state ?? entry?.s),
        unit: entry?.attributes?.unit_of_measurement || this._getEntityUnit(entityId) || defaultUnit,
        time: Date.parse(entry?.last_changed || entry?.last_updated || entry?.lu || ""),
      }))
      .filter((entry) => Number.isFinite(entry.value) && Number.isFinite(entry.time))
      .sort((a, b) => a.time - b.time);
    const currentValue = numericState(this._getEntityValue(entityId, undefined));
    const latestState = states.length > 0 ? states[states.length - 1] : undefined;
    const endValue = Number.isFinite(currentValue) ? currentValue : latestState?.value;
    const startValue = states[0]?.value;
    const amount = Number.isFinite(endValue) && Number.isFinite(startValue)
      ? Math.max(0, endValue - startValue)
      : undefined;
    return { amount, unit: latestState?.unit || this._getEntityUnit(entityId) || defaultUnit };
  }

  _formatGasConsumptionValue() {
    const info = this._overlayGasConsumptionInfo();
    if (!info) return "";
    if (info.loading) return "…";
    if (!Number.isFinite(info.amount)) return "—";
    const value = info.amount >= 10 ? info.amount.toFixed(1) : info.amount.toFixed(2);
    return `${value} ${info.unit || "m³"}`;
  }

  _formatOverlayHeatpumpValue() {
    const entityId = this.config.image_overlays?.heatpump?.entity;
    if (!entityId) return "";
    const value = this._getEntityValue(entityId, undefined);
    const formatted = this._formatValue(value);
    if (formatted === "—") return formatted;
    const entityUnit = this._getEntityUnit(entityId);
    const unit = this.config.image_overlays?.heatpump?.unit || "auto";
    if (this._isEnergyUnit(entityUnit)) {
      const targetUnit = unit && this._isEnergyUnit(unit) ? unit : "kWh";
      return this._formatEnergyValue(value, entityUnit, targetUnit);
    }
    if (this._isPowerUnit(entityUnit)) return this._formatPowerValue(value, unit, entityUnit);
    return entityUnit ? `${formatted} ${entityUnit}` : String(formatted);
  }

  _formatOverlayReading(key) {
    if (key === "smoke") return this._formatGasConsumptionValue() || "—";
    if (key === "heatpump") return this._formatOverlayHeatpumpValue() || "—";
    return "—";
  }

  _overlayLabel(key) {
    const customLabel = this.config.image_overlays?.[key]?.label;
    if (customLabel !== undefined && String(customLabel).trim() !== "") return String(customLabel).trim();
    return this._t(`overlay.${key}`, {}, key);
  }

  _customMetricLabel(key) {
    const customLabel = this.config.labels?.[key];
    if (customLabel !== undefined && String(customLabel).trim() !== "") return String(customLabel).trim();
    return "";
  }

  _batteryFlowDirectionLabel(direction) {
    return direction === "charge"
      ? this._t("flow.charge", {}, "Incoming")
      : this._t("flow.discharge", {}, "Outgoing");
  }

  _renderBatteryFlow(metric, { showLabel = false, placement = showLabel ? "footer" : "image" } = {}) {
    if (metric.key !== "battery_level") return "";
    if (this._currentEnergyRange() !== "live") return "";
    if (!this._showLabelIn("battery_flow_power", placement)) return "";
    const info = this._batteryFlowInfo();
    const value = this._formatBatteryFlowValue(info);
    if (!info || !value) return "";
    const arrow = info.direction === "charge" ? "↓" : "↑";
    const directionLabel = this._batteryFlowDirectionLabel(info.direction);
    const label = `${directionLabel}: ${value}`;
    return `
      <div class="battery-flow ${info.direction}${showLabel ? " with-label" : ""}${this._labelVisibilityClass("battery_flow_power", placement)}" data-battery-flow title="${this._escape(label)}" aria-label="${this._escape(label)}">
        ${showLabel ? `<span class="battery-flow-label" data-battery-flow-label>${this._escape(directionLabel)}</span>` : ""}
        <span class="battery-flow-arrow">${this._escape(arrow)}</span>
        <span data-battery-flow-value>${this._escape(value)}</span>
      </div>
    `;
  }

  _batteryTemperatureEntityId() {
    const aliases = ["battery_temperature", "battery_temp", "battery_level_temperature"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _formatTemperatureLabel(rawValue, entityUnit = "°C") {
    const normalized = String(rawValue ?? "").trim().toLowerCase();
    if (!normalized || ["unknown", "unavailable", "none", "null", "offline"].includes(normalized)) return "";
    const numericValue = Number(String(rawValue).replace(",", "."));
    const unit = entityUnit || "°C";
    const value = Number.isFinite(numericValue)
      ? `${Math.abs(numericValue) >= 100 || Number.isInteger(numericValue) ? numericValue.toFixed(0) : numericValue.toFixed(1)} ${unit}`
      : `${String(rawValue).trim()}${unit && !String(rawValue).includes(unit) ? ` ${unit}` : ""}`;
    return this._t("value.temperature", { value }, `Temp ${value}`);
  }

  _batteryTemperatureLabel() {
    const entityId = this._batteryTemperatureEntityId();
    if (!entityId) return "";
    return this._formatTemperatureLabel(this._getEntityValue(entityId, undefined), this._getEntityUnit(entityId) || "°C");
  }

  _batteryVoltageEntityId() {
    const aliases = ["battery_flow_power_voltage", "battery_voltage", "battery_level_voltage"];
    return aliases.map((key) => this.config.entities?.[key]).find(Boolean) || "";
  }

  _batteryVoltageLabel() {
    const entityId = this._batteryVoltageEntityId();
    if (!entityId) return "";
    const label = this._formatVoltageValue(this._getEntityValue(entityId, undefined), this._getEntityUnit(entityId) || "V");
    return label === "—" ? "" : label;
  }

  _renderBatteryVoltage(metric, { placement = "footer" } = {}) {
    if (metric.key !== "battery_level" || !this._batteryVoltageEntityId()) return "";
    const key = "battery_flow_power_voltage";
    if (!this._showLabelIn(key, placement)) return "";
    const label = this._batteryVoltageLabel();
    const tooltip = `${this._t("tooltip.voltage", {}, "Voltage")}: ${label}`;
    return `
      <span class="voltage-badge${this._labelVisibilityClass(key, placement)}" data-battery-voltage title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _batteryTemperatureCelsius() {
    const entityId = this._batteryTemperatureEntityId();
    if (!entityId) return undefined;
    const value = numericState(this._getEntityValue(entityId, undefined));
    if (!Number.isFinite(value)) return undefined;
    const unit = String(this._getEntityUnit(entityId) || "°C").trim().toLowerCase();
    if (unit.includes("°f") || unit === "f" || unit.includes("fahrenheit")) return (value - 32) * (5 / 9);
    return value;
  }

  _renderBatteryTemperature(metric, { placement = "footer" } = {}) {
    if (metric.key !== "battery_level" || !this._batteryTemperatureEntityId()) return "";
    if (!this._showLabelIn("battery_temperature", placement)) return "";
    const label = this._batteryTemperatureLabel();
    const tooltip = `${this._t("tooltip.temperature", {}, "Temperature")}: ${label}`;
    return `
      <span class="temp-badge${this._labelVisibilityClass("battery_temperature", placement)}" data-battery-temperature title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _renderBatteryMetaRow(metric, { showFlowLabel = true, placement = showFlowLabel ? "footer" : "image" } = {}) {
    const metaHtml = [
      this._renderBatteryFlow(metric, { showLabel: showFlowLabel, placement }),
      this._renderBatteryTemperature(metric, { placement }),
      this._renderBatteryVoltage(metric, { placement }),
    ].filter(Boolean).join("");
    return metaHtml ? `<div class="meta-row">${metaHtml}</div>` : "";
  }

  _isPvMetric(metric) {
    return isPvMetric(metric);
  }

  _pvLabelKey(metric, label) {
    return `${metric.key}_${label.suffix}`;
  }

  _pvLabelEntityId(metric, label) {
    if (label.source !== "entity") return "";
    return this.config.entities?.[this._pvLabelKey(metric, label)] || "";
  }

  _formatPvLabelEntityValue(entityId, unit) {
    if (!entityId) return "";
    const rawValue = this._getEntityValue(entityId, undefined);
    const formatted = this._formatValue(rawValue);
    if (formatted === "—") return formatted;
    const entityUnit = this._getEntityUnit(entityId);
    if (unit === "energy") {
      const targetUnit = this._isEnergyUnit(entityUnit) ? "kWh" : entityUnit || "kWh";
      return this._formatEnergyValue(rawValue, entityUnit, targetUnit);
    }
    if (unit === "power") return this._formatPowerValue(rawValue, this.config.units?.power || "auto", entityUnit);
    return entityUnit ? `${formatted} ${entityUnit}` : String(formatted);
  }

  _pvLabelText(metric, label) {
    const title = this._t(label.labelKey, {}, label.suffix);
    const value = label.source === "metric"
      ? this._formatReading(metric)
      : this._formatPvLabelEntityValue(this._pvLabelEntityId(metric, label), label.unit);
    return value && value !== "—" ? `${title}: ${value}` : "";
  }

  _renderPvLabel(metric, label, { placement = "footer" } = {}) {
    if (!this._isPvMetric(metric)) return "";
    const key = this._pvLabelKey(metric, label);
    if (!this._showLabelIn(key, placement)) return "";
    if (label.source === "entity" && !this._pvLabelEntityId(metric, label)) return "";
    const text = this._pvLabelText(metric, label);
    const tooltip = text || this._t(label.labelKey, {}, label.suffix);
    return `
      <span class="pv-badge${this._labelVisibilityClass(key, placement)}" data-pv-label="${this._escape(key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${text ? "" : "display:none"}">${this._escape(text)}</span>
    `;
  }

  _renderPvMetaRow(metric, { placement = "footer" } = {}) {
    if (!this._isPvMetric(metric)) return "";
    const metaHtml = PV_LABELS
      .map((label) => this._renderPvLabel(metric, label, { placement }))
      .filter(Boolean)
      .join("");
    return metaHtml ? `<div class="meta-row">${metaHtml}</div>` : "";
  }

  _wallboxPhaseEntityKey(metric) {
    return wallboxPhaseEntityKey(metric);
  }

  _wallboxPhaseEntityId(metric) {
    return wallboxPhaseEntityId(this.config, metric);
  }

  _wallboxPhaseLabel(metric) {
    const entityId = this._wallboxPhaseEntityId(metric);
    if (!entityId) return "";
    return wallboxPhaseLabel(this._getEntityValue(entityId, undefined), (key, values, fallback) => this._t(key, values, fallback));
  }

  _renderWallboxPhase(metric, { placement = "footer" } = {}) {
    if (!this._wallboxPhaseEntityId(metric)) return "";
    const entityKey = this._wallboxPhaseEntityKey(metric);
    if (!this._showLabelIn(entityKey, placement)) return "";
    const label = this._wallboxPhaseLabel(metric);
    const tooltip = `${this._t("tooltip.phases", {}, "Phases")}: ${label}`;
    return `
      <span class="phase-badge${this._labelVisibilityClass(entityKey, placement)}" data-phase="${this._escape(metric.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _wallboxSocEntityKey(metric) {
    return wallboxSocEntityKey(metric);
  }

  _wallboxSocEntityId(metric) {
    return wallboxSocEntityId(this.config, metric);
  }

  _numericPercentFromEntity(entityId) {
    if (!entityId) return undefined;
    return numericPercentValue(this._getEntityValue(entityId, undefined));
  }

  _wallboxSocPercent(metric) {
    return this._numericPercentFromEntity(this._wallboxSocEntityId(metric));
  }

  _wallboxMaxSocEntityKey(metric) {
    return wallboxMaxSocEntityKey(metric);
  }

  _wallboxMaxSocEntityId(metric) {
    return wallboxMaxSocEntityId(this.config, metric);
  }

  _wallboxMaxSocPercent(metric) {
    return this._numericPercentFromEntity(this._wallboxMaxSocEntityId(metric));
  }

  _wallboxBooleanEntityState(entityId) {
    return wallboxBooleanEntityState(entityId, {
      getValue: (id) => this._getEntityValue(id, undefined),
      getState: (id) => this._hass?.states?.[id],
    });
  }

  _wallboxConnectedEntityKey(metric) {
    return wallboxConnectedEntityKey(metric);
  }

  _wallboxConnectedEntityId(metric) {
    return wallboxConnectedEntityId(this.config, metric);
  }

  _wallboxConnectedState(metric) {
    return this._wallboxBooleanEntityState(this._wallboxConnectedEntityId(metric));
  }

  _wallboxChargingEnabledEntityKey(metric) {
    return wallboxChargingEnabledEntityKey(metric);
  }

  _wallboxChargingEnabledEntityId(metric) {
    return wallboxChargingEnabledEntityId(this.config, metric);
  }

  _wallboxChargingEnabledState(metric) {
    return this._wallboxBooleanEntityState(this._wallboxChargingEnabledEntityId(metric));
  }

  _wallboxSocLabel(metric) {
    const entityId = this._wallboxSocEntityId(metric);
    if (!entityId) return "";
    return wallboxSocLabel(this._getEntityValue(entityId, undefined), this._getEntityUnit(entityId));
  }

  _renderWallboxSoc(metric, { placement = "footer" } = {}) {
    if (!this._wallboxSocEntityId(metric)) return "";
    const entityKey = this._wallboxSocEntityKey(metric);
    if (!this._showLabelIn(entityKey, placement)) return "";
    const label = this._wallboxSocLabel(metric);
    const tooltip = `${this._t("tooltip.vehicleSoc", {}, "Vehicle SoC")}: ${label}`;
    return `
      <span class="soc-badge${this._labelVisibilityClass(entityKey, placement)}" data-vehicle-soc="${this._escape(metric.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _wallboxRemainingTimeEntityKey(metric) {
    return wallboxRemainingTimeEntityKey(metric);
  }

  _wallboxRemainingTimeEntityId(metric) {
    return wallboxRemainingTimeEntityId(this.config, metric);
  }

  _formatDurationMinutes(minutes) {
    return formatDurationMinutes(minutes);
  }

  _formatDurationSeconds(seconds) {
    return formatDurationSeconds(seconds);
  }

  _wallboxPhaseActionEntityKey(metric) {
    return wallboxPhaseActionEntityKey(metric);
  }

  _wallboxPhaseRemainingEntityKey(metric) {
    return wallboxPhaseRemainingEntityKey(metric);
  }

  _wallboxPhaseActionEntityId(metric) {
    return wallboxPhaseActionEntityId(this.config, metric);
  }

  _wallboxPhaseRemainingEntityId(metric) {
    return wallboxPhaseRemainingEntityId(this.config, metric);
  }

  _wallboxPhaseActionText(metric) {
    const entityId = this._wallboxPhaseActionEntityId(metric);
    if (!entityId) return "";
    return wallboxPhaseActionText(this._getEntityValue(entityId, ""));
  }

  _wallboxPhaseRemainingSeconds(metric) {
    const entityId = this._wallboxPhaseRemainingEntityId(metric);
    if (!entityId) return undefined;
    return wallboxPhaseRemainingSeconds(
      this._getEntityValue(entityId, undefined),
      this._getEntityUnit(entityId),
      numericState,
    );
  }

  _wallboxPhaseActionInfo(metric) {
    const action = this._wallboxPhaseActionText(metric);
    return wallboxPhaseActionInfo({
      action,
      seconds: this._wallboxPhaseRemainingSeconds(metric),
      actionEntityId: this._wallboxPhaseActionEntityId(metric),
      remainingEntityId: this._wallboxPhaseRemainingEntityId(metric),
      formatDurationSeconds: (seconds) => this._formatDurationSeconds(seconds),
      translate: (key, values, fallback) => this._t(key, values, fallback),
    });
  }

  _formatRemainingChargeTimeValue(rawValue, entityUnit = "") {
    return formatRemainingChargeTimeValue(rawValue, entityUnit);
  }

  _wallboxIsCharging(metric) {
    return wallboxIsCharging(metric, {
      config: this.config,
      getValue: (entityId) => this._getEntityValue(entityId, undefined),
      getUnit: (entityId) => this._getEntityUnit(entityId),
      valueAsWatts: (value, unit) => this._valueAsWatts(value, unit),
      clampNumber: (value, fallback, min, max) => this._clampNumber(value, fallback, min, max),
    });
  }

  _wallboxRemainingTimeLabel(metric) {
    const entityId = this._wallboxRemainingTimeEntityId(metric);
    if (!entityId) return "";
    return wallboxRemainingTimeLabel({
      isCharging: this._wallboxIsCharging(metric),
      rawValue: this._getEntityValue(entityId, undefined),
      entityUnit: this._getEntityUnit(entityId),
      formatRemainingChargeTimeValue: (value, unit) => this._formatRemainingChargeTimeValue(value, unit),
      translate: (key, values, fallback) => this._t(key, values, fallback),
    });
  }

  _renderWallboxRemainingTime(metric, { placement = "footer" } = {}) {
    if (!this._wallboxRemainingTimeEntityId(metric)) return "";
    const entityKey = this._wallboxRemainingTimeEntityKey(metric);
    if (!this._showLabelIn(entityKey, placement)) return "";
    const label = this._wallboxRemainingTimeLabel(metric);
    const tooltip = `${this._t("tooltip.remainingChargeTime", {}, "Remaining charge time")}: ${label}`;
    return `
      <span class="time-badge${this._labelVisibilityClass(entityKey, placement)}" data-remaining-charge-time="${this._escape(metric.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${label ? "" : "display:none"}">${this._escape(label)}</span>
    `;
  }

  _renderWallboxPhaseAction(metric, { placement = "footer" } = {}) {
    if (placement !== "footer" || !this._wallboxPhaseActionEntityId(metric)) return "";
    const info = this._wallboxPhaseActionInfo(metric);
    const tooltip = info?.label ? `${this._t("tooltip.phaseChange", {}, "Upcoming phase change")}: ${info.label}` : "";
    return `
      <span class="phase-action-badge" data-phase-action="${this._escape(metric.key)}" title="${this._escape(tooltip)}" aria-label="${this._escape(tooltip)}" style="${info?.label ? "" : "display:none"}">${this._escape(info?.label || "")}</span>
    `;
  }

  _renderWallboxPhaseRow(metric, { placement = "footer" } = {}) {
    const metaHtml = [
      this._renderWallboxPhase(metric, { placement }),
      this._renderWallboxSoc(metric, { placement }),
      this._renderWallboxRemainingTime(metric, { placement }),
      this._renderWallboxPhaseAction(metric, { placement }),
    ].filter(Boolean).join("");
    return metaHtml ? `<div class="meta-row">${metaHtml}</div>` : "";
  }

  _formatLocalDateTime(dateString) {
    const timestamp = Date.parse(dateString || "");
    if (!Number.isFinite(timestamp)) return "";
    try {
      return new Intl.DateTimeFormat(this._language(), {
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date(timestamp));
    } catch (_err) {
      return new Date(timestamp).toLocaleString();
    }
  }

  _metricWarning(metric) {
    if (isImportExportMetric(metric)) {
      const signedEntityId = this._gridSignedEntityId();
      const entityIds = signedEntityId
        ? [signedEntityId]
        : [this._gridImportEntityId(), this._gridExportEntityId()].filter(Boolean);
      if (entityIds.length === 0) return undefined;
      const entities = entityIds.map((entityId) => this._getEntity(entityId)).filter(Boolean);
      if (this._hass?.states && entities.length === 0) return { type: "missing", label: this._t("warning.sensorMissing") };
      const states = entities.map((entity) => String(entity?.state || "").toLowerCase().trim());
      if (states.length > 0 && states.every((state) => state === "unavailable" || state === "unknown")) {
        return { type: "unavailable", label: this._t("warning.sensorUnavailable") };
      }
      if (states.length > 0 && states.every((state) => state === "offline")) {
        return { type: "offline", label: this._t("warning.sensorOffline") };
      }
      return undefined;
    }

    const entityId = this._metricEntityId(metric);
    const entity = this._getEntity(entityId);
    if (entityId && this._hass?.states && !entity) {
      return { type: "missing", label: this._t("warning.sensorMissing") };
    }

    const state = String(entity?.state || "").toLowerCase().trim();
    if (state === "unavailable" || state === "unknown") {
      return { type: "unavailable", label: this._t("warning.sensorUnavailable") };
    }
    if (state === "offline" || (metric.key === "inverter_power" && state === "off")) {
      return { type: "offline", label: this._t("warning.sensorOffline") };
    }

    if (metric.key === "battery_level") {
      const value = this._metricNumericValue(metric);
      if (Number.isFinite(value) && value <= this._batteryReserveThreshold()) {
        return { type: "battery-low", label: this._t("warning.batteryLow") };
      }
    }

    return undefined;
  }

  _metricStateClass(metric) {
    return this._metricWarning(metric) ? " is-warning" : "";
  }

  _metricTooltip(metric, variant) {
    const entityId = this._metricEntityId(metric);
    const entity = this._getEntity(entityId);
    const warning = this._metricWarning(metric);
    const rawValue = entity
      ? entity.state
      : metric.customKpi && !entityId
        ? metric.customKpi.value
        : undefined;
    const entityUnit = entityId ? this._getEntityUnit(entityId) : "";
    const updatedAt = entityId ? this._formatLocalDateTime(this._getEntityLastUpdated(entityId)) : "";
    const rawLabel = rawValue !== undefined && rawValue !== ""
      ? `${this._t("tooltip.raw")}: ${rawValue}${entityUnit ? ` ${entityUnit}` : ""}`
      : "";

    return [
      this._metricLabel(metric, variant),
      entityId ? `${this._t("tooltip.entity")}: ${entityId}` : "",
      `${this._t("tooltip.value")}: ${this._formatReading(metric)}`,
      rawLabel,
      this._meterTooltip(metric),
      metric.key === "battery_level" && this._formatBatteryFlowValue()
        ? `${this._t("tooltip.flow")}: ${this._formatBatteryFlowValue()}`
        : "",
      metric.key === "battery_level" && this._batteryTemperatureLabel()
        ? `${this._t("tooltip.temperature", {}, "Temperature")}: ${this._batteryTemperatureLabel()}`
        : "",
      metric.key === "battery_level" && this._batteryVoltageLabel()
        ? `${this._t("tooltip.voltage", {}, "Voltage")}: ${this._batteryVoltageLabel()}`
        : "",
      this._wallboxPhaseLabel(metric) ? `${this._t("tooltip.phases", {}, "Phases")}: ${this._wallboxPhaseLabel(metric)}` : "",
      this._wallboxSocLabel(metric) ? `${this._t("tooltip.vehicleSoc", {}, "Vehicle SoC")}: ${this._wallboxSocLabel(metric)}` : "",
      this._wallboxRemainingTimeLabel(metric) ? `${this._t("tooltip.remainingChargeTime", {}, "Remaining charge time")}: ${this._wallboxRemainingTimeLabel(metric)}` : "",
      this._wallboxPhaseActionInfo(metric)?.label ? `${this._t("tooltip.phaseChange", {}, "Upcoming phase change")}: ${this._wallboxPhaseActionInfo(metric).label}` : "",
      this._metricVoltageLabel(metric) ? `${this._t("tooltip.voltage", {}, "Voltage")}: ${this._metricVoltageLabel(metric)}` : "",
      updatedAt ? `${this._t("tooltip.updated")}: ${updatedAt}` : "",
      warning ? `${this._t("tooltip.status")}: ${warning.label}` : "",
    ].filter(Boolean).join("\n");
  }

  _allChartMetrics(variant = this._currentVariant || this._layoutState().variant) {
    return [
      ...this._visibleHudMetrics(variant),
      ...this._visibleTileMetrics(variant),
      ...this._environmentSensorMetrics(),
      ...this._largeConsumerMetrics(),
    ].filter((metric, index, metrics) => {
      if (!this._metricEntityId(metric)) return false;
      return metrics.findIndex((item) => item.key === metric.key) === index;
    });
  }

  _chartMetric(metricKey) {
    return this._allChartMetrics().find((metric) => metric.key === metricKey)
      || flattenChartSections(this._chartDashboardSections()).find((metric) => metric.key === metricKey || metric.chartKey === metricKey);
  }

  _historyCacheKey(entityId, hours) {
    const bucket = this._cacheBucket(MINUTE_MS);
    return chartHistoryCacheKey(entityId, hours, bucket);
  }

  async _openChart(metricKey, hours = this._chartHours || this.config.chart_hours || 24) {
    const metric = this._chartMetric(metricKey);
    if (!metric) return;
    const entityId = this._metricEntityId(metric);
    if (!entityId) return;
    const requestToken = this._asyncRequestToken || 0;

    this._chartHours = [24, 48].includes(Number(hours)) ? Number(hours) : 24;
    this._activeChart = {
      metricKey,
      hours: this._chartHours,
      loading: true,
      error: "",
      points: [],
    };
    this._renderCardShell(this._layoutState());

    try {
      const points = await this._loadHistoryPoints(metric, entityId, this._chartHours);
      if (!this._isActiveRequest(requestToken) || !this._activeChart || this._activeChart.metricKey !== metricKey || this._activeChart.hours !== this._chartHours) return;
      this._activeChart = {
        ...this._activeChart,
        loading: false,
        error: "",
        points,
      };
    } catch (_err) {
      if (!this._isActiveRequest(requestToken) || !this._activeChart || this._activeChart.metricKey !== metricKey) return;
      this._activeChart = {
        ...this._activeChart,
        loading: false,
        error: this._t("chart.error"),
        points: [],
      };
    }

    if (this._isActiveRequest(requestToken) && this.shadowRoot) this._renderCardShell(this._layoutState());
  }

  _closeChart() {
    this._activeChart = undefined;
    this._renderCardShell(this._layoutState());
  }

  async _loadHistoryPoints(metric, entityId, hours) {
    if (!this._hass?.callApi) throw new Error("Home Assistant history API is unavailable");
    const cacheKey = this._historyCacheKey(entityId, hours);
    const cached = this._historyCache.get(cacheKey);
    if (cached) return cached;

    const history = await this._hass.callApi("GET", chartHistoryApiPath(entityId, hours));
    const states = Array.isArray(history?.[0]) ? history[0] : [];
    const points = states
      .map((entry) => this._historyPoint(metric, entry))
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    this._setCacheEntry(this._historyCache, cacheKey, points, MAX_HISTORY_CACHE_ENTRIES);
    return points;
  }

  _historyPoint(metric, entry) {
    return chartHistoryPoint(metric, entry, {
      metricEntityId: (item) => this._metricEntityId(item),
      getEntityUnit: (entityId) => this._getEntityUnit(entityId),
      formatValue: (value) => this._formatValue(value),
      isMetricEnergyMode: (item) => this._isMetricEnergyMode(item),
      valueAsKwh: (value, unit) => this._valueAsKwh(value, unit),
      valueAsCubicMeters: (value, unit) => this._valueAsCubicMeters(value, unit),
      valueAsWatts: (value, unit) => this._valueAsWatts(value, unit),
      numericState,
      isPowerUnit: (unit) => this._isPowerUnit(unit),
    });
  }

  _formatChartValue(value, metric) {
    if (this._isMetricEnergyMode(metric)) return this._formatEnergyValue(value, "kWh", "kWh");
    if (metric.overlay === "heatpump") {
      const entityUnit = this._getEntityUnit(this._metricEntityId(metric));
      if (this._isPowerUnit(entityUnit)) return this._formatPowerValue(value, "auto", "W");
      if (this._isEnergyUnit(entityUnit)) return this._formatEnergyValue(value, entityUnit, "kWh");
    }
    if (metric.overlay === "smoke") {
      const unit = this._getEntityUnit(this._metricEntityId(metric)) || "m³";
      return `${Number(value).toFixed(2)} ${unit}`;
    }
    if (metric.unit === "volume") return this._formatVolumeValue(value, "m³", this._volumeTargetUnit(metric));
    if (metric.unit === "power") return this._formatPowerValue(value, this._unitForMetric(metric), "W");
    if (metric.key === "battery_level") return this._formatWithUnit(Math.round(value), this._unitForMetric(metric));
    const unit = this._unitForMetric(metric);
    return this._formatWithUnit(Number(value.toFixed(2)), unit === "auto" ? this._getEntityUnit(this._metricEntityId(metric)) : unit);
  }

  _formatChartTime(timestamp) {
    try {
      return new Intl.DateTimeFormat(this._language(), { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
    } catch (_err) {
      return new Date(timestamp).toLocaleTimeString();
    }
  }

  _chartPath(points, min, max, start, end, width, height, padding) {
    return chartPath(points, min, max, start, end, width, height, padding);
  }

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
  }

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
            <button type="button" class="chart-close" data-chart-close aria-label="${this._escape(this._t("chart.close"))}">×</button>
          </div>
        </div>
        <div class="chart-body">
          ${this._renderChartSvg(metric, this._activeChart)}
        </div>
      </div>
    `;
  }

  _chartDashboardHours() {
    return [24, 48].includes(Number(this._chartHours)) ? Number(this._chartHours) : this.config.chart_hours || 24;
  }

  _chartEntityId(metric) {
    if (metric?.chartEntityId) return metric.chartEntityId;
    if (metric?.overlay) return this.config.image_overlays?.[metric.overlay]?.entity || "";
    if (metric?.customKpi) return metric.customKpi.entity || "";
    if (metric?.environmentSensor) return metric.environmentSensor.entity || "";
    if (metric?.largeConsumer) return this._largeConsumerPowerEntityId(metric);
    if (isImportExportMetric(metric)) return this._gridPrimaryEntityId();
    return this.config.entities?.[metricSourceKey(metric)] || "";
  }

  _chartDashboardMetricPool(variant = this._currentVariant || this._layoutState().variant) {
    return [
      ...TILE_METRICS,
      ...this._visibleOverlayMetrics(),
      ...this._customKpiMetrics(),
      ...this._environmentSensorMetrics(),
      ...this._largeConsumerMetrics(),
      ...(this._showGridStatusTile() ? [GRID_STATUS_METRIC] : []),
    ].filter((metric, index, metrics) => {
      if (!this._chartEntityId(metric)) return false;
      return metrics.findIndex((item) => item.key === metric.key) === index;
    });
  }

  _chartDashboardSections(variant = this._currentVariant || this._layoutState().variant) {
    return chartDashboardSections({
      pvRoofStringEntries: this._pvRoofStringEntries(),
      inverterEntries: this._inverterEntries(),
      metrics: this._chartDashboardMetricPool(variant),
      metricEntityId: (metric) => this._chartEntityId(metric),
      metricLabel: (metric) => this._metricLabel(metric, variant),
      translate: (key, values, fallback) => this._t(key, values, fallback),
    });
  }

  _dashboardChartState(metric) {
    const entityId = this._chartEntityId(metric);
    const hours = this._chartDashboardHours();
    if (!entityId) return { hours, loading: false, error: this._t("chart.empty"), points: [] };
    const cacheKey = this._historyCacheKey(entityId, hours);
    const cached = this._historyCache.get(cacheKey);
    if (cached?.error) return { hours, loading: false, error: this._t("chart.error"), points: [] };
    if (cached) return { hours, loading: false, error: "", points: cached };
    this._requestDashboardChart(metric, entityId, hours, cacheKey);
    return { hours, loading: true, error: "", points: [] };
  }

  _requestDashboardChart(metric, entityId, hours, cacheKey) {
    if (!this._hass?.callApi || this._chartDashboardLoading?.has(cacheKey)) return;
    const requestToken = this._asyncRequestToken || 0;
    this._chartDashboardLoading.add(cacheKey);
    this._loadHistoryPoints(metric, entityId, hours)
      .then((points) => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._historyCache, cacheKey, points, MAX_HISTORY_CACHE_ENTRIES);
      })
      .catch(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._setCacheEntry(this._historyCache, cacheKey, { error: true, points: [] }, MAX_HISTORY_CACHE_ENTRIES);
      })
      .finally(() => {
        if (!this._isActiveRequest(requestToken)) return;
        this._chartDashboardLoading?.delete(cacheKey);
        this._updateReadingsIfReady();
      });
  }

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
  }

  _renderChartDashboard(variant = this._currentVariant || this._layoutState().variant) {
    const sections = this._chartDashboardSections(variant);
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
  }

  _ruleMatches(rule, value) {
    if (!rule || value === undefined) return false;
    const checks = [
      ["above", (actual, threshold) => actual >= threshold],
      ["min", (actual, threshold) => actual >= threshold],
      ["gte", (actual, threshold) => actual >= threshold],
      ["below", (actual, threshold) => actual <= threshold],
      ["max", (actual, threshold) => actual <= threshold],
      ["lte", (actual, threshold) => actual <= threshold],
      ["gt", (actual, threshold) => actual > threshold],
      ["lt", (actual, threshold) => actual < threshold],
      ["equals", (actual, threshold) => actual === threshold],
    ];
    const explicitChecks = checks.filter(([key]) => rule[key] !== undefined);
    if (explicitChecks.length > 0) {
      return explicitChecks.every(([key, compare]) => {
        const threshold = Number(rule[key]);
        return Number.isFinite(threshold) && compare(value, threshold);
      });
    }
    if (rule.threshold === undefined) return false;
    const threshold = Number(rule.threshold);
    if (!Number.isFinite(threshold)) return false;
    const operator = String(rule.operator || ">=").trim();
    if (operator === ">" || operator === "above") return value > threshold;
    if (operator === "<" || operator === "below") return value < threshold;
    if (operator === "<=" || operator === "lte" || operator === "max") return value <= threshold;
    if (operator === "=" || operator === "==" || operator === "===" || operator === "equals") return value === threshold;
    return value >= threshold;
  }

  _safeCssColor(color, fallback = "") {
    const value = String(color || "").trim();
    if (!value) return fallback;
    if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
    if (/^(rgb|rgba|hsl|hsla)\([\d\s.,%/-]+\)$/i.test(value)) return value;
    if (/^var\(--[\w-]+\)$/i.test(value)) return value;
    if (/^[a-z]+$/i.test(value)) return value;
    return fallback;
  }

  _hexToRgba(color, alpha = 0.36) {
    const hex = String(color || "").trim();
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
    if (!match) return color || "transparent";
    const raw = match[1].length === 3
      ? match[1].split("").map((char) => char + char).join("")
      : match[1];
    const red = parseInt(raw.slice(0, 2), 16);
    const green = parseInt(raw.slice(2, 4), 16);
    const blue = parseInt(raw.slice(4, 6), 16);
    return `rgba(${red},${green},${blue},${alpha})`;
  }

  _metricAccent(metric) {
    const fallbackColor = metric.accentColor || STATIC_METRIC_COLORS[metric.color] || "var(--text-main)";
    if (this._currentEnergyRange() !== "live" && metric.unit === "power") {
      return { color: fallbackColor, glow: "transparent" };
    }
    if (this.config.dynamic_tile_colors === false) {
      return { color: fallbackColor, glow: "transparent" };
    }

    const rules = this.config.tile_color_rules?.[metricSourceKey(metric)];
    const normalizedRules = Array.isArray(rules) ? rules : [];
    const value = this._metricNumericValue(metric);
    const matchedRule = normalizedRules.find((rule) => this._ruleMatches(rule, value));
    const color = this._safeCssColor(matchedRule?.color, fallbackColor);
    const glowValue = matchedRule?.glow ?? metric.customKpi?.glow ?? metric.environmentSensor?.glow;
    const glow = glowValue === true
      ? this._hexToRgba(color, 0.34)
      : this._safeCssColor(glowValue, "transparent");

    return { color, glow };
  }

  _accentStyle(metric) {
    const accent = this._metricAccent(metric);
    return `--tile-accent:${accent.color};--tile-glow:${accent.glow};`;
  }

  _labelVisibility(key) {
    const configured = this.config.label_visibility?.[key] || {};
    return {
      image: configured.image !== false,
      footer: configured.footer !== false && configured.kpi !== false,
      hideMobile: configured.hide_mobile === true || configured.mobile === false,
      hideDesktop: configured.hide_desktop === true || configured.desktop === false,
    };
  }

  _labelVisibilityClass(key, placement = "image") {
    const visibility = this._labelVisibility(key);
    return [
      placement === "footer" ? "" : visibility.hideMobile ? " hide-mobile" : "",
      visibility.hideDesktop ? " hide-desktop" : "",
    ].join("");
  }

  _showLabelIn(key, placement) {
    const visibility = this._labelVisibility(key);
    return placement === "footer" ? visibility.footer : visibility.image;
  }

  _metricEnabled(metric, variant) {
    if (metric.overlay) return this.config.image_overlays?.[metric.overlay]?.enabled === true;
    if (metric.customKpi) return metric.customKpi.visible !== false;
    if (metric.environmentSensor) return metric.environmentSensor.visible !== false && Boolean(metric.environmentSensor.entity);
    const configured = this.config.visible_boxes?.[metric.key];
    if (configured !== undefined) return configured !== false;
    if (metric.key === "import_export_power") return this._hasGridPowerSource();
    if (metric.optional && !this.config.entities?.[metric.key]) return false;
    return variant?.visible_boxes?.[metric.key] !== false;
  }

  _metricVisible(metric, variant) {
    return this._metricEnabled(metric, variant);
  }

  _visibleMetrics(variant, metrics = TILE_METRICS) {
    return metrics.filter((metric) => this._metricEnabled(metric, variant));
  }

  _showGridStatusTile() {
    return (
      this.config.show_grid_status_tile !== false
      && this._hasGridPowerSource()
      && this.config.visible_boxes?.import_export_power !== false
    );
  }

  _visibleTileMetrics(variant) {
    return [
      ...this._visibleMetrics(variant)
        .filter((metric) => metric.tile !== false)
        .map((metric, index) => ({
          ...metric,
          tileOrder: metric.tileOrder ?? index,
          tileColumns: metric.tileColumns ?? 1,
        })),
      ...this._visibleOverlayMetrics(),
      ...(this._showGridStatusTile() ? [GRID_STATUS_METRIC] : []),
      ...this._customKpiMetrics(),
    ].sort((a, b) => (a.tileOrder ?? 0) - (b.tileOrder ?? 0));
  }

  _visibleOverlayMetrics() {
    return OVERLAY_TILE_METRICS
      .filter((metric) => this.config.image_overlays?.[metric.overlay]?.enabled === true)
      .filter((metric) => this._labelVisibility(metric.key).footer)
      .map((metric) => ({ ...metric, tileColumns: 1 }));
  }

  _visibleHudMetrics(variant) {
    const baseMetrics = this._visibleMetrics(variant).filter((metric) => {
      if (metric.hud !== false) return true;
      return Boolean(variant?.positions?.[metric.key]) || this.config.visible_boxes?.[metric.key] === true;
    });
    return [
      ...baseMetrics,
      ...this._environmentSensorMetrics({ placement: "image" }),
    ];
  }

  _metricLabel(metric, variant) {
    if (metric.chartLabel) return metric.chartLabel;
    if (metric.overlay) return this._overlayLabel(metric.overlay);
    if (metric.customKpi) return metric.customKpi.label || metric.label;
    if (metric.environmentSensor) return metric.label || this._environmentSensorLabel(metric.environmentSensor);
    if (metric.largeConsumer) return metric.label || this._largeConsumerLabel(metric.largeConsumer);
    if (metric.key === "import_export_power") {
      const status = this._gridStatusInfo();
      if (["import", "export", "neutral"].includes(status.kind) && status.label) return status.label;
    }
    const customLabel = this._customMetricLabel(metric.key);
    if (customLabel) return customLabel;
    if (metric.labelKey) return this._t(metric.labelKey, {}, metric.label);
    if (variant?.labelKeys?.[metric.key]) return this._t(variant.labelKeys[metric.key], {}, variant?.labels?.[metric.key] || metric.label);
    if (variant?.labels?.[metric.key]) return this._t(`metrics.${metric.key}`, {}, variant.labels[metric.key]);
    return this._t(`metrics.${metric.key}`, {}, metric.label);
  }

  _metricPosition(variant, key) {
    if (String(key || "").startsWith("environment_sensors.")) {
      const metric = this._environmentSensorMetrics({ placement: "image" }).find((item) => item.key === key)
        || this._environmentSensorMetrics().find((item) => item.key === key);
      return {
        left: metric?.environmentSensor?.left ?? 50,
        top: metric?.environmentSensor?.top ?? 50,
      };
    }

    if (key === "wallbox2_power") {
      const configured = this.config.positions[key];
      if (configured?.left !== undefined || configured?.top !== undefined) {
        return {
          ...adjacentWallboxPosition({
            ...(variant.positions.wallbox_power || {}),
            ...(this.config.positions.wallbox_power || {}),
          }),
          ...configured,
        };
      }
      return adjacentWallboxPosition({
        ...(variant.positions.wallbox_power || {}),
        ...(this.config.positions.wallbox_power || {}),
      });
    }

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
    const variant = HOUSE_VARIANTS[activeHouse] || HOUSE_VARIANTS.single_family_home;
    const variantImage = this._variantImage(variant);
    const customImage = this._isDaylight() && this.config.day_image ? this.config.day_image : this.config.image;
    const imageSrc = customImage || variantImage.src;
    const imageFallbacks = customImage ? [variantImage.src, ...(variantImage.fallbacks || [])] : variantImage.fallbacks;

    return { activeHouse, variant, imageSrc, imageFallbacks };
  }

  _escape(value) {
    return escapeHtml(value);
  }

  _renderHouseSelector(activeHouse) {
    if (!this.config.show_house_selector) return "";

    const options = Object.entries(HOUSE_VARIANTS)
      .map(([key, variant]) => htmlTag("option", { value: key, selected: key === activeHouse }, this._houseLabel(key, variant)))
      .join("");

    return htmlTag("select", { class: "house-select", "aria-label": this._t("aria.houseSelector") }, rawHtml(options));
  }

  _renderViewSelector() {
    if (this.config.show_view_selector !== true) return "";
    const activeView = this._currentViewMode();
    const buttons = VIEW_MODE_OPTIONS
      .map((option) => {
        const active = option.key === activeView;
        const label = this._t(option.labelKey, {}, option.label);
        const icon = viewModeIconSvg(option.icon);
        const content = option.icon
          ? `${icon}<span class="view-mode-label">${this._escape(label)}</span>`
          : this._escape(label);
        return htmlTag("button", {
          class: classNames("view-mode-button", { active, "view-mode-icon-button": Boolean(option.icon), "view-mode-icon-only": Boolean(option.icon) }),
          type: "button",
          "data-view-mode": option.key,
          "aria-pressed": active ? "true" : "false",
          "aria-label": label,
          title: label,
        }, rawHtml(content));
      })
      .join("");

    return htmlTag("div", {
      class: "view-mode-toggle",
      role: "group",
      "aria-label": this._t("aria.viewSelector", {}, "Select dashboard view"),
    }, rawHtml(buttons));
  }

  _renderEnergyRangeSelector() {
    if (this.config.show_energy_range_selector !== true) return "";
    const activeRange = this._currentEnergyRange();
    const options = ENERGY_RANGE_OPTIONS
      .map((option) => htmlTag("option", { value: option.key, selected: option.key === activeRange }, this._t(option.labelKey, {}, option.label)))
      .join("");

    return htmlTag("select", { class: "energy-range-select", "aria-label": this._t("aria.energyRangeSelector") }, rawHtml(options));
  }

  _overlayDefault(activeHouse, key) {
    return DEFAULT_IMAGE_OVERLAYS[activeHouse]?.[key]
      || DEFAULT_IMAGE_OVERLAYS.single_family_home[key]
      || {};
  }

  _overlayConfig(activeHouse, key) {
    return {
      ...this._overlayDefault(activeHouse, key),
      ...(this.config.image_overlays?.[key] || {}),
    };
  }

  _overlayNumber(value, fallback, min, max) {
    return this._clampNumber(value, fallback, min, max);
  }

  _overlayAssetUrls(key) {
    const file = `${key}.png`;
    const urls = [this._remoteImageUrl(file)];
    try {
      urls.push(assetUrl(file));
    } catch (_err) {
      // no local root fallback
    }
    try {
      urls.push(assetUrl(`images/${file}`));
    } catch (_err) {
      // no local images fallback
    }
    return [...new Set(urls.filter(Boolean))];
  }

  _renderImageOverlays(activeHouse) {
    return IMAGE_OVERLAY_KEYS.map((key) => {
      const config = this._overlayConfig(activeHouse, key);
      if (config.enabled !== true) return "";
      const left = this._overlayNumber(config.left, this._overlayDefault(activeHouse, key).left ?? 50, 0, 100);
      const top = this._overlayNumber(config.top, this._overlayDefault(activeHouse, key).top ?? 50, 0, 100);
      const width = this._overlayNumber(config.width ?? config.size, this._overlayDefault(activeHouse, key).width ?? 12, 2, 60);
      const orientation = String(config.orientation || "right").toLowerCase() === "left" ? "left" : "right";
      const label = this._overlayLabel(key);
      const scaleX = key === "heatpump" && orientation === "left" ? -1 : 1;
      const translateY = key === "smoke" ? "-100%" : "-50%";
      const style = [
        `left:${left}%`,
        `top:${top}%`,
        `width:${width}%`,
        `--overlay-scale-x:${scaleX}`,
        `--overlay-translate-y:${translateY}`,
      ].join(";");
      const [src, ...fallbacks] = this._overlayAssetUrls(key);
      const reading = this._formatOverlayReading(key);
      const visibilityKey = `overlay_${key}`;
      const readingHtml = this.config.image_overlays?.[key]?.entity && this._labelVisibility(visibilityKey).image
        ? `<div class="overlay-reading${this._labelVisibilityClass(visibilityKey, "image")}"><span class="overlay-reading-label" data-overlay-label="${this._escape(key)}">${this._escape(label)}</span><span class="overlay-reading-value" data-overlay-value="${this._escape(key)}">${this._escape(reading)}</span></div>`
        : "";
      return `
        <div class="image-overlay-wrap image-overlay-wrap-${this._escape(key)}" style="${this._escape(style)}">
          <img class="image-overlay image-overlay-${this._escape(key)}" src="${this._escape(src)}" data-fallbacks="${this._escape(fallbacks.join("|"))}" alt="${this._escape(label)}" loading="lazy" />
          ${readingHtml}
        </div>
      `;
    }).join("");
  }

  _renderMetric(metric, variant) {
    if (!this._metricVisible(metric, variant)) return "";

    const position = this._metricPosition(variant, metric.key);
    const left = this._toPercent(position.left, 50);
    const top = this._toPercent(position.top, 50);
    const tooltip = this._metricTooltip(metric, variant);
    const warning = this._metricWarning(metric);
    const labelHtml = htmlTag("div", { class: "label", "data-label": metric.key }, this._metricLabel(metric, variant));
    const valueHtml = htmlTag("div", { class: "value", "data-value": metric.key }, rawHtml(this._renderMetricValueHtml(metric)));
    const bodyHtml = [
      labelHtml,
      htmlTag("div", { class: "value-row" }, rawHtml(valueHtml)),
      this._renderPvMetaRow(metric, { placement: "image" }),
      this._renderBatteryMetaRow(metric, { showFlowLabel: false, placement: "image" }),
      this._renderWallboxPhaseRow(metric, { placement: "image" }),
      this._renderVoltageMetaRow(metric, { placement: "image" }),
      this._renderMetricMeter(metric),
    ].join("");

    return htmlTag("div", {
      class: `metric${this._metricStateClass(metric)}`,
      "data-accent-key": metric.key,
      "data-metric": metric.key,
      "data-tooltip-key": metric.key,
      "data-chart-key": this._metricEntityId(metric) ? metric.key : "",
      "data-warning": warning?.label || "",
      title: tooltip,
      "aria-label": tooltip,
      style: `${styleMap({ left: `${left}%`, top: `${top}%` })};${this._accentStyle(metric)}`,
    }, rawHtml(bodyHtml));
  }

  _flowMetric(key) {
    return findFlowMetric(key);
  }

  _hasFlowPosition(variant, key) {
    if (key === "wallbox2_power") {
      return Boolean(
        variant?.positions?.wallbox2_power
        || this.config.positions?.wallbox2_power
        || variant?.positions?.wallbox_power
        || this.config.positions?.wallbox_power
      );
    }
    return Boolean(variant?.positions?.[key] || this.config.positions?.[key]);
  }

  _flowAnchor(variant, key, { allowHidden = false } = {}) {
    if (key === "grid") {
      const inverterAnchor = this._flowAnchor(variant, "inverter_power", { allowHidden: true });
      if (!inverterAnchor) return undefined;
      return {
        left: inverterAnchor.left < 50 ? 4 : 96,
        top: this._toPercent(inverterAnchor.top, 50),
      };
    }

    const metric = this._flowMetric(key);
    if (metric && !allowHidden && !this._metricVisible(metric, variant)) return undefined;
    if (!this._hasFlowPosition(variant, key)) return undefined;

    const position = this._metricPosition(variant, key);
    return {
      left: this._toPercent(position.left, 50),
      top: this._toPercent(position.top, 50),
    };
  }

  _flowWattsForKey(key) {
    if (key === "import_export_power") {
      const flowInfo = this._gridFlowInfo();
      return Number.isFinite(flowInfo?.watts) ? flowInfo.watts : undefined;
    }
    if (key === "pv_roof_power") {
      const stringWatts = this._pvRoofStringPowerWatts();
      if (Number.isFinite(stringWatts)) return stringWatts;
    }
    const entityId = this.config.entities?.[key];
    if (!entityId) return undefined;
    const value = this._getEntityValue(entityId, undefined);
    if (value === undefined || value === null || value === "unknown" || value === "unavailable") return undefined;
    const watts = this._valueAsWatts(value, this._getEntityUnit(entityId));
    return Number.isFinite(watts) ? watts : undefined;
  }

  _flowVisual(magnitude) {
    const strength = Math.min(1, Math.max(0.3, Math.log10(Math.abs(magnitude) + 10) / 4));
    const opacity = 0.28 + strength * 0.52;
    const width = 0.24 + strength * 0.5;
    return {
      baseWidth: `${(width * 2).toFixed(2)}px`,
      pulseWidth: `${(width * 3).toFixed(2)}px`,
      opacity: opacity.toFixed(2),
      baseOpacity: (opacity * 0.34).toFixed(2),
      reducedOpacity: (opacity * 0.5).toFixed(2),
      speed: (1.85 - strength * 0.55).toFixed(2),
    };
  }

  _flowPath(from, to, index) {
    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const distance = Math.hypot(dx, dy) || 1;
    const bendIndex = (index % 5) - 2;
    const bend = Math.min(8, Math.max(2.5, distance * 0.12)) * bendIndex * 0.36;
    const middleX = (from.left + to.left) / 2 + (-dy / distance) * bend;
    const middleY = (from.top + to.top) / 2 + (dx / distance) * bend;
    return `M ${from.left.toFixed(2)} ${from.top.toFixed(2)} Q ${middleX.toFixed(2)} ${middleY.toFixed(2)} ${to.left.toFixed(2)} ${to.top.toFixed(2)}`;
  }

  _renderEnergyFlows(variant) {
    if (this.config.show_power_flows !== true) return "";
    const threshold = this._gridNeutralThreshold();
    const flows = [];
    const addFlow = (fromKey, toKey, magnitude, color) => {
      const value = Math.abs(Number(magnitude));
      if (!Number.isFinite(value) || value <= threshold) return;
      const from = this._flowAnchor(variant, fromKey, { allowHidden: fromKey === "inverter_power" });
      const to = this._flowAnchor(variant, toKey, { allowHidden: toKey === "inverter_power" });
      if (!from || !to) return;
      if (Math.abs(from.left - to.left) < 0.5 && Math.abs(from.top - to.top) < 0.5) return;
      flows.push({ from, to, magnitude: value, color });
    };

    let pvFlows = 0;
    ["pv_roof_power", "pv_shed_power"].forEach((key) => {
      const before = flows.length;
      addFlow(key, "inverter_power", this._flowWattsForKey(key), "#ffc233");
      if (flows.length > before) pvFlows += 1;
    });
    if (pvFlows === 0) addFlow("pv_total_power", "inverter_power", this._flowWattsForKey("pv_total_power"), "#ffc233");

    const batteryFlow = this._batteryFlowInfo();
    if (batteryFlow?.direction === "charge") {
      addFlow("inverter_power", "battery_level", batteryFlow.kind === "energy" ? batteryFlow.amount * 1000 : batteryFlow.amount, "#34d399");
    } else if (batteryFlow?.direction === "discharge") {
      addFlow("battery_level", "inverter_power", batteryFlow.kind === "energy" ? batteryFlow.amount * 1000 : batteryFlow.amount, "#f87171");
    }

    addFlow("inverter_power", "wallbox_power", this._flowWattsForKey("wallbox_power"), "#1f8fff");
    addFlow("inverter_power", "wallbox2_power", this._flowWattsForKey("wallbox2_power"), "#60a5fa");
    addFlow("inverter_power", "house_consumption_power", this._flowWattsForKey("house_consumption_power"), "#93c5fd");

    const gridWatts = this._flowWattsForKey("import_export_power");
    if (Number.isFinite(gridWatts) && Math.abs(gridWatts) > threshold) {
      const gridAnchorKey = this._flowAnchor(variant, "import_export_power") ? "import_export_power" : "grid";
      if (gridWatts > 0) addFlow(gridAnchorKey, "inverter_power", gridWatts, "#fb923c");
      else addFlow("inverter_power", gridAnchorKey, gridWatts, "#34d399");
    }

    if (flows.length === 0) return "";
    const paths = flows.map((flow, index) => {
      const visual = this._flowVisual(flow.magnitude);
      const style = [
        `--flow-color:${flow.color}`,
        `--flow-base-width:${visual.baseWidth}`,
        `--flow-pulse-width:${visual.pulseWidth}`,
        `--flow-opacity:${visual.opacity}`,
        `--flow-base-opacity:${visual.baseOpacity}`,
        `--flow-reduced-opacity:${visual.reducedOpacity}`,
        `--flow-speed:${visual.speed}s`,
        `--flow-delay:${(-index * 0.22).toFixed(2)}s`,
      ].join(";");
      const path = this._flowPath(flow.from, flow.to, index);
      return `
        <g class="flow-group" style="${this._escape(style)}">
          <path class="flow-line-base" pathLength="100" d="${this._escape(path)}"></path>
          <path class="flow-line-pulse" pathLength="100" d="${this._escape(path)}"></path>
        </g>
      `;
    }).join("");

    return `
      <svg class="flow-overlay" data-flow-overlay viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="ha-solar-flow-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.15" result="blur"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="blur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
        </defs>
        ${paths}
      </svg>
    `;
  }

  _tileStyle(metric) {
    const columns = Math.round(this._clampNumber(metric.tileColumns ?? 1, 1, 1, 6));
    const mobileColumns = Math.min(columns, 2);
    return `${this._accentStyle(metric)} order:${Number(metric.tileOrder ?? 0)}; --tile-columns:${columns}; --tile-mobile-columns:${mobileColumns};`;
  }

  _attachControls() {
    const viewModeButtons = Array.from(this.shadowRoot.querySelectorAll("[data-view-mode]"));
    if (viewModeButtons.length > 0) {
      const switchViewMode = (nextViewMode, event) => {
        event?.preventDefault();
        event?.stopPropagation();
        if (!nextViewMode || nextViewMode === this._currentViewMode()) return;
        this._selectedViewMode = nextViewMode;
        this._renderCardShell(this._layoutState());
        const activeButton = this.shadowRoot.querySelector(`[data-view-mode="${this._escape(nextViewMode)}"]`);
        try {
          activeButton?.focus({ preventScroll: true });
        } catch (_err) {
          activeButton?.focus();
        }
      };

      viewModeButtons.forEach((button, index) => {
        ["pointerdown", "mousedown", "touchstart"].forEach((eventName) => {
          button.addEventListener(eventName, (event) => event.stopPropagation());
        });
        button.addEventListener("click", (event) => {
          switchViewMode(this._normalizeViewMode(event.currentTarget.dataset.viewMode), event);
        });
        button.addEventListener("keydown", (event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          const nextIndex = event.key === "Home"
            ? 0
            : event.key === "End"
              ? viewModeButtons.length - 1
              : event.key === "ArrowLeft"
                ? (index - 1 + viewModeButtons.length) % viewModeButtons.length
                : (index + 1) % viewModeButtons.length;
          switchViewMode(this._normalizeViewMode(viewModeButtons[nextIndex].dataset.viewMode), event);
        });
      });
    }

    const select = this.shadowRoot.querySelector(".house-select");
    if (select) {
      select.addEventListener("change", (event) => {
        const nextHouse = this._normalizeHouse(event.target.value);
        if (!nextHouse || nextHouse === this._selectedHouse) return;
        this._selectedHouse = nextHouse;
        this._renderCardShell(this._layoutState());
      });
    }

    const energyRangeSelect = this.shadowRoot.querySelector(".energy-range-select");
    if (energyRangeSelect) {
      energyRangeSelect.addEventListener("change", (event) => {
        const nextRange = this._normalizeEnergyRange(event.target.value);
        if (!nextRange || nextRange === this._currentEnergyRange()) return;
        this._selectedEnergyRange = nextRange;
        this._renderCardShell(this._layoutState());
      });
    }

    const image = this.shadowRoot.querySelector(".scene-image");
    if (image) {
      image.addEventListener("error", () => this._applyImageFallback(image));
      if (image.complete && image.naturalWidth === 0) this._applyImageFallback(image);
    }

    this.shadowRoot.querySelectorAll(".image-overlay").forEach((overlay) => {
      overlay.addEventListener("error", () => this._applyImageFallback(overlay));
      if (overlay.complete && overlay.naturalWidth === 0) this._applyImageFallback(overlay);
    });

    this.shadowRoot.querySelectorAll("[data-chart-key]").forEach((element) => {
      if (element.closest("[data-chart-dashboard]")) return;
      const metricKey = element.dataset.chartKey;
      if (!metricKey) return;
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._openChart(metricKey);
      });
    });

    this.shadowRoot.querySelectorAll("[data-chart-hours]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const metricKey = this._activeChart?.metricKey;
        if (!metricKey) return;
        this._openChart(metricKey, Number(event.currentTarget.dataset.chartHours));
      });
    });

    this._attachChartDashboardControls();
    this._attachRecordsDashboardControls();

    this.shadowRoot.querySelectorAll("[data-chart-close]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._closeChart();
      });
    });

    this._attachAdvisorControls();
  }

  _attachChartDashboardControls() {
    this.shadowRoot.querySelectorAll("[data-chart-dashboard] [data-chart-key]").forEach((element) => {
      if (element.dataset.chartDashboardBound === "true") return;
      element.dataset.chartDashboardBound = "true";
      const metricKey = element.dataset.chartKey;
      if (!metricKey) return;
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._openChart(metricKey);
      });
    });

    this.shadowRoot.querySelectorAll("[data-chart-dashboard-hours]").forEach((button) => {
      if (button.dataset.chartDashboardBound === "true") return;
      button.dataset.chartDashboardBound = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const hours = Number(event.currentTarget.dataset.chartDashboardHours);
        this._chartHours = [24, 48].includes(hours) ? hours : 24;
        this._renderCardShell(this._layoutState());
      });
    });
  }

  _attachAdvisorControls() {
    this.shadowRoot.querySelectorAll("[data-advisor-dismiss-key]").forEach((button) => {
      if (button.dataset.advisorDismissBound === "true") return;
      button.dataset.advisorDismissBound = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._dismissAdvisorItem(button.dataset.advisorDismissKey);
      });
    });
    this.shadowRoot.querySelectorAll("[data-advisor-item-key]").forEach((element) => {
      if (element.dataset.advisorBound === "true") return;
      element.dataset.advisorBound = "true";
      const toggle = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const key = element.dataset.advisorItemKey;
        if (!key) return;
        if (!this._openAdvisorDetails) this._openAdvisorDetails = new Set();
        if (this._openAdvisorDetails.has(key)) this._openAdvisorDetails.delete(key);
        else this._openAdvisorDetails.add(key);
        const open = this._openAdvisorDetails.has(key);
        element.classList.toggle("is-open", open);
        element.setAttribute("aria-expanded", open ? "true" : "false");
        const explanation = element.querySelector(".advisor-explanation");
        if (explanation) explanation.hidden = !open;
      };
      element.addEventListener("click", toggle);
      element.addEventListener("keydown", (event) => {
        if (!["Enter", " "].includes(event.key)) return;
        toggle(event);
      });
    });
  }

  _applyImageFallback(image) {
    const fallbacks = (image.dataset.fallbacks || "").split("|").filter(Boolean);
    while (fallbacks.length > 0) {
      const fallback = fallbacks.shift();
      if (!fallback || image.src === fallback) continue;
      image.dataset.fallbacks = fallbacks.join("|");
      window.setTimeout(() => {
        image.src = fallback;
      }, 0);
      return;
    }
    image.dataset.fallbacks = "";
    image.style.display = "none";
  }

  _renderGridVoltageAlert() {
    const alert = this._gridVoltageAlert();
    if (!alert) return "";
    const value = alert.value ? ` ${alert.value}` : "";
    const sourceLabel = alert.metric ? this._metricLabel(alert.metric, this._currentVariant) : "";
    const source = sourceLabel && alert.entityId ? `${sourceLabel}: ${alert.entityId}` : alert.entityId || "";
    const text = `${alert.label}${value}`;
    return htmlTag("div", {
      class: ["voltage-alert", `voltage-alert-${alert.type}`],
      "data-grid-voltage-alert": true,
      title: source,
      "aria-label": text,
    }, [
      rawHtml(htmlTag("strong", {}, alert.label)),
      rawHtml(htmlTag("span", {}, alert.value || "")),
    ]);
  }

  _renderCardShell(state) {
    this._lastImageKey = this._imageStateKey();
    this._lastLanguage = this._language();
    this._currentVariant = state.variant;
    const activeView = this._currentViewMode();
    const visibleHudMetrics = this._visibleHudMetrics(state.variant);
    const visibleTileMetrics = this._visibleTileMetrics(state.variant);
    const environmentMetrics = this._environmentSensorMetrics({ placement: "footer" });
    const largeConsumerMetrics = this._largeConsumerMetrics();
    const metricHtml = visibleHudMetrics.map((metric) => this._renderMetric(metric, state.variant)).join("");
    const imageOverlayHtml = this._renderImageOverlays(state.activeHouse);
    const flowHtml = this._renderEnergyFlows(state.variant);
    const advisorHtml = activeView === "advisor" ? this._renderEnergyAdvisor({ dashboard: true }) : "";
    const floorplanDashboardHtml = activeView === FLOORPLAN_DASHBOARD_VIEW ? this._renderFloorplanDashboard() : "";
    const chartDashboardHtml = activeView === CHART_DASHBOARD_VIEW ? this._renderChartDashboard(state.variant) : "";
    const recordsDashboardHtml = activeView === RECORDS_DASHBOARD_VIEW ? this._renderRecordsDashboard(state.variant) : "";
    const voltageAlertHtml = this._renderGridVoltageAlert();
    const statusLabel = this._statusLabel();
    const statusHtml = this.config.show_status_label !== false
      ? `<div class="scene-status" data-accent-key="${STATUS_METRIC.key}" data-status-label style="${this._escape(this._accentStyle(STATUS_METRIC))}">${this._escape(statusLabel)}</div>`
      : "";
    const headerHtml = [
      this.config.show_title !== false ? `<div class="title">${this._escape(this._displayTitle())}</div>` : "",
      activeView === "house" ? this._renderEnergyRangeSelector() : "",
      this._renderViewSelector(),
      activeView === "house" ? this._renderHouseSelector(state.activeHouse) : "",
    ].filter(Boolean).join("");
    const renderTile = (metric) => {
      const tooltip = this._metricTooltip(metric, state.variant);
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
          <div class="name" data-label="${metric.key}">${this._escape(this._metricLabel(metric, state.variant))}</div>
          ${valueHtml}
          ${this._renderMetricMeter(metric)}
        </div>
      `;
    };
    const gridHtml = visibleTileMetrics.map(renderTile).join("");
    const environmentHtml = environmentMetrics.map(renderTile).join("");
    const largeConsumerHtml = largeConsumerMetrics.map(renderTile).join("");
    const environmentSectionHtml = this.config.show_environment_sensors !== false && environmentMetrics.length > 0
      ? `
        <section class="tile-section environment-sensor-section">
          <div class="tile-section-title">${this._escape(this._t("environment.sectionTitle", {}, "Environment"))}</div>
          <div class="grid environment-sensor-grid">${environmentHtml}</div>
        </section>
      `
      : "";
    const largeConsumerSectionHtml = this.config.show_large_consumers !== false && largeConsumerMetrics.length > 0
      ? `
        <section class="tile-section large-consumer-section">
          <div class="tile-section-title">${this._escape(this._t("consumer.sectionTitle", {}, "Additional Large Consumers"))}</div>
          <div class="grid large-consumer-grid">${largeConsumerHtml}</div>
        </section>
      `
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; --text-main:#f3f6ff; --text-muted:#9ba3b8; --glass-soft:rgba(255,255,255,.08); --accent-yellow:#ffc233; --accent-blue:#1f8fff; --accent-green:#34d399; --hud-box-opacity:.65; --hud-box-scale:1; --hud-box-bg:rgba(8,16,38,var(--hud-box-opacity)); }
        ha-card { border-radius:18px; overflow:hidden; background:radial-gradient(110% 80% at 15% 0%, #232b44 0%, #111727 70%); color:var(--text-main); box-shadow:0 18px 45px rgba(0,0,0,.55); padding:16px; font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
        .header { display:grid; grid-template-columns:minmax(0,1fr) auto auto auto; align-items:center; gap:10px; margin-bottom:12px; }
        .title { min-width:0; overflow-wrap:anywhere; font-size:1.28rem; font-weight:700; line-height:1.2; }
        .house-select,.energy-range-select,.view-mode-toggle { background:var(--glass-soft); border:1px solid rgba(255,255,255,.2); border-radius:8px; color:var(--text-main); font:inherit; font-size:.88rem; min-height:34px; }
        .house-select,.energy-range-select { max-width:170px; padding:0 30px 0 10px; }
        .energy-range-select { max-width:110px; }
        .view-mode-toggle { display:grid; grid-template-columns:repeat(5,42px); width:max-content; max-width:100%; padding:2px; box-sizing:border-box; gap:2px; }
        .view-mode-button { min-width:0; min-height:28px; border:0; border-radius:6px; background:transparent; color:var(--text-muted); cursor:pointer; font:inherit; font-size:.82rem; font-weight:800; line-height:1.1; padding:0 10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; gap:6px; }
        .view-mode-icon { width:17px; height:17px; flex:0 0 auto; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
        .view-mode-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .view-mode-icon-only .view-mode-label { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
        .view-mode-button.active { background:linear-gradient(135deg,rgba(31,143,255,.5),rgba(52,211,153,.22)); color:#fff; box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),0 4px 12px rgba(31,143,255,.22); }
        .view-mode-button:focus-visible { outline:2px solid rgba(147,197,253,.95); outline-offset:1px; }
        .scene { position:relative; aspect-ratio:91/64; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,.1); margin-bottom:12px; background:#101626; }
        .scene-image { display:block; width:100%; height:100%; object-fit:cover; filter:saturate(1.03) contrast(1.03); }
        .image-overlay-wrap { position:absolute; z-index:1; width:10%; transform:translate(-50%,var(--overlay-translate-y,-50%)); transform-origin:center bottom; pointer-events:none; user-select:none; }
        .image-overlay { display:block; width:100%; height:auto; transform:scaleX(var(--overlay-scale-x,1)); transform-origin:center bottom; filter:drop-shadow(0 8px 12px rgba(0,0,0,.24)); }
        .image-overlay-smoke { opacity:.78; filter:blur(.15px); mix-blend-mode:screen; }
        .overlay-reading { position:absolute; left:calc(100% + 7px); top:50%; transform:translateY(-50%) scale(var(--hud-box-scale)); transform-origin:left center; display:grid; gap:1px; min-width:64px; max-width:118px; border-radius:9px; border:1px solid color-mix(in srgb,var(--tile-accent,#f3f6ff) 42%,rgba(255,255,255,.2)); background:rgba(8,16,38,.72); color:var(--tile-accent,#f3f6ff); font-size:.76rem; line-height:1.15; font-weight:800; padding:5px 7px; box-shadow:0 8px 20px rgba(0,0,0,.28); backdrop-filter:blur(4px); overflow-wrap:anywhere; }
        .overlay-reading-label { color:var(--text-muted); font-size:.64rem; font-weight:700; }
        .overlay-reading-value { color:var(--tile-accent,#f3f6ff); }
        .image-overlay-wrap-smoke .overlay-reading { --tile-accent:#ffc233; left:68%; top:88%; }
        .image-overlay-wrap-heatpump .overlay-reading { --tile-accent:#1f8fff; }
        .flow-overlay { position:absolute; inset:0; z-index:2; width:100%; height:100%; pointer-events:none; overflow:visible; mix-blend-mode:screen; }
        .flow-line-base,.flow-line-pulse { fill:none; stroke:var(--flow-color); vector-effect:non-scaling-stroke; }
        .flow-line-base { stroke-width:var(--flow-base-width); opacity:var(--flow-base-opacity); stroke-linecap:round; }
        .flow-line-pulse { stroke-width:var(--flow-pulse-width); opacity:var(--flow-opacity); stroke-linecap:round; stroke-dasharray:1 8; stroke-dashoffset:0; filter:url(#ha-solar-flow-glow); animation:flow-move var(--flow-speed) linear infinite; animation-delay:var(--flow-delay); }
        @keyframes flow-move { from { stroke-dashoffset:0; } to { stroke-dashoffset:-100; } }
        @media (prefers-reduced-motion:reduce){ .flow-line-pulse{animation:none;stroke-dashoffset:0;opacity:var(--flow-reduced-opacity);} }
        .metric { --tile-accent:var(--text-main); --tile-glow:transparent; position:absolute; z-index:3; width:clamp(82px,15%,118px); transform:translate(-50%,-50%) scale(var(--hud-box-scale)); transform-origin:center center; background:linear-gradient(135deg,var(--hud-box-bg),rgba(8,16,38,calc(var(--hud-box-opacity) * .82))); border:1px solid color-mix(in srgb,var(--tile-accent) 48%,rgba(255,255,255,.18)); backdrop-filter:blur(4px); border-radius:10px; padding:7px 9px; box-shadow:0 8px 24px rgba(0,0,0,.35),0 0 22px var(--tile-glow); pointer-events:auto; cursor:pointer; box-sizing:border-box; }
        .metric .label,.tile .name { color:var(--text-muted); font-size:.74rem; line-height:1.2; }
        .metric .value-row { display:flex; align-items:center; gap:5px; min-width:0; max-width:100%; }
        .tile .tile-value-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; min-width:0; max-width:100%; margin-top:2px; }
        .metric .value,.tile .num { color:var(--tile-accent); font-size:.92rem; font-weight:700; line-height:1.25; overflow-wrap:anywhere; }
        .value-combo { display:flex; align-items:baseline; flex-wrap:wrap; gap:2px 4px; min-width:0; max-width:100%; line-height:1.15; }
        .value-combo .value-part { min-width:0; overflow-wrap:anywhere; }
        .value-combo .value-secondary { font-size:.72em; opacity:.74; font-weight:700; }
        .value-combo .value-separator { color:rgba(243,246,255,.55); font-size:.72em; }
        .metric-meter { width:100%; height:5px; margin-top:6px; overflow:hidden; border-radius:999px; background:rgba(255,255,255,.16); box-shadow:inset 0 0 0 1px rgba(255,255,255,.08); }
        .metric-meter span { display:block; height:100%; width:0; border-radius:inherit; background:linear-gradient(90deg,color-mix(in srgb,var(--tile-accent) 64%,#fff),var(--tile-accent)); box-shadow:0 0 10px color-mix(in srgb,var(--tile-accent) 62%,transparent); transition:width .28s ease; }
        .battery-flow { display:inline-flex; align-items:center; gap:3px; flex:0 1 auto; min-width:0; max-width:62px; border-radius:999px; padding:2px 5px; background:rgba(255,255,255,.1); font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(255,255,255,.08); overflow:hidden; white-space:nowrap; }
        .battery-flow.charge { color:#34d399; }
        .battery-flow.discharge { color:#f87171; }
        .battery-flow.with-label { max-width:100%; flex-wrap:wrap; white-space:normal; padding:3px 6px; font-size:.64rem; }
        .battery-flow-arrow { flex:0 0 auto; font-size:.78rem; line-height:1; }
        .battery-flow-label { min-width:0; overflow:hidden; text-overflow:ellipsis; }
        [data-battery-flow-value] { min-width:0; overflow:hidden; text-overflow:ellipsis; }
        .meta-row { display:flex; align-items:center; gap:4px; flex-wrap:wrap; min-width:0; max-width:100%; margin-top:3px; }
        .phase-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:72px; border-radius:999px; padding:2px 5px; background:rgba(31,143,255,.14); color:#93c5fd; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(147,197,253,.2); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .phase-badge:empty { display:none; }
        .soc-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:82px; border-radius:999px; padding:2px 5px; background:rgba(52,211,153,.14); color:#86efac; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(134,239,172,.2); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .soc-badge:empty { display:none; }
        .temp-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:86px; border-radius:999px; padding:2px 5px; background:rgba(251,146,60,.14); color:#fdba74; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(253,186,116,.22); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .temp-badge:empty { display:none; }
        .time-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:96px; border-radius:999px; padding:2px 5px; background:rgba(255,255,255,.1); color:#dbeafe; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(219,234,254,.18); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .time-badge:empty { display:none; }
        .phase-action-badge { display:block; flex:1 1 100%; min-width:0; width:fit-content; max-width:100%; border-radius:8px; padding:3px 7px; background:rgba(168,85,247,.14); color:#d8b4fe; font-size:.62rem; line-height:1.16; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(216,180,254,.2); white-space:normal; overflow-wrap:anywhere; text-overflow:clip; }
        .phase-action-badge:empty { display:none; }
        .pv-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:100%; border-radius:999px; padding:2px 5px; background:rgba(255,194,51,.14); color:#fde68a; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(253,230,138,.22); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .pv-badge:empty { display:none; }
        .voltage-badge { display:inline-flex; align-items:center; flex:0 1 auto; min-width:0; max-width:86px; border-radius:999px; padding:2px 5px; background:rgba(250,204,21,.14); color:#fde047; font-size:.62rem; line-height:1.1; font-weight:800; letter-spacing:0; box-shadow:inset 0 0 0 1px rgba(250,204,21,.22); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .voltage-badge:empty { display:none; }
        .metric.is-warning,.tile.is-warning { border-color:color-mix(in srgb,#f87171 74%,rgba(255,255,255,.18)); box-shadow:0 8px 24px rgba(0,0,0,.35),0 0 18px rgba(248,113,113,.32),0 0 22px var(--tile-glow); }
        .metric[data-warning]:not([data-warning=""])::after,.tile[data-warning]:not([data-warning=""])::after { content:"!"; position:absolute; top:5px; right:6px; width:16px; height:16px; display:grid; place-items:center; border-radius:999px; background:#f87171; color:#1b1020; font-size:.66rem; font-weight:900; line-height:1; box-shadow:0 0 14px rgba(248,113,113,.42); }
        .voltage-alert { display:flex; align-items:center; justify-content:space-between; gap:10px; min-width:0; margin:0 0 12px; padding:9px 11px; border-radius:8px; border:1px solid color-mix(in srgb,var(--voltage-alert-color) 54%,rgba(255,255,255,.14)); background:color-mix(in srgb,var(--voltage-alert-color) 16%,rgba(8,16,38,.82)); color:var(--voltage-alert-color); box-shadow:inset 3px 0 0 var(--voltage-alert-color),0 8px 20px rgba(0,0,0,.2); }
        .voltage-alert-warning { --voltage-alert-color:#facc15; }
        .voltage-alert-critical { --voltage-alert-color:#f87171; }
        .voltage-alert strong { min-width:0; font-size:.86rem; line-height:1.2; overflow-wrap:anywhere; }
        .voltage-alert span { flex:0 0 auto; font-size:.82rem; line-height:1.1; font-weight:900; border-radius:999px; padding:4px 7px; background:rgba(255,255,255,.1); }
        .scene-status { --tile-accent:rgba(243,246,255,.86); --tile-glow:transparent; position:absolute; z-index:3; right:10px; bottom:10px; max-width:calc(100% - 20px); background:rgba(8,16,38,.62); border:1px solid color-mix(in srgb,var(--tile-accent) 34%,rgba(255,255,255,.14)); border-radius:8px; color:rgba(243,246,255,.86); font-size:.72rem; line-height:1.25; padding:5px 8px; backdrop-filter:blur(4px); box-shadow:0 8px 18px rgba(0,0,0,.28),0 0 18px var(--tile-glow); pointer-events:none; overflow-wrap:anywhere; }
        .scene-status:empty { display:none; }
        .grid { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:8px; }
        .tile { --tile-accent:var(--text-main); --tile-glow:transparent; --tile-columns:1; --tile-mobile-columns:1; position:relative; grid-column:span var(--tile-columns); background:linear-gradient(135deg,rgba(12,20,38,.78),rgba(12,20,38,.62)); border:1px solid color-mix(in srgb,var(--tile-accent) 34%,rgba(255,255,255,.08)); border-radius:8px; padding:10px; min-width:0; cursor:pointer; box-shadow:inset 3px 0 0 var(--tile-accent),0 8px 20px rgba(0,0,0,.18),0 0 20px var(--tile-glow); }
        .tile-section { display:grid; gap:8px; margin-top:12px; min-width:0; }
        .tile-section-title { color:var(--text-muted); font-size:.76rem; line-height:1.2; font-weight:800; text-transform:uppercase; letter-spacing:0; }
        .advisor { --advisor-accent:#93c5fd; display:grid; gap:10px; margin-top:12px; padding:12px; border-radius:8px; border:1px solid color-mix(in srgb,var(--advisor-accent) 36%,rgba(255,255,255,.1)); background:linear-gradient(135deg,rgba(15,23,42,.76),rgba(8,13,28,.68)); box-shadow:inset 3px 0 0 var(--advisor-accent),0 10px 24px rgba(0,0,0,.18); }
        .advisor-dashboard { margin-top:0; min-height:320px; align-content:start; }
        .advisor-critical { --advisor-accent:#f87171; }
        .advisor-warning { --advisor-accent:#fb923c; }
        .advisor-info { --advisor-accent:#60a5fa; }
        .advisor-opportunity { --advisor-accent:#34d399; }
        .advisor-success { --advisor-accent:#34d399; }
        .advisor-setup { --advisor-accent:#93c5fd; }
        .advisor-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; min-width:0; }
        .advisor-label,.advisor-state { color:var(--text-muted); font-size:.72rem; line-height:1.2; font-weight:700; text-transform:uppercase; letter-spacing:0; }
        .advisor-title { color:var(--advisor-accent); font-size:1rem; line-height:1.25; font-weight:800; overflow-wrap:anywhere; }
        .advisor-state { flex:0 0 auto; border-radius:999px; padding:4px 7px; background:color-mix(in srgb,var(--advisor-accent) 14%,rgba(255,255,255,.08)); color:var(--advisor-accent); text-transform:none; }
        .advisor-metrics { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:6px; min-width:0; }
        .advisor-metric { --tile-accent:var(--text-main); --tile-glow:transparent; display:grid; gap:2px; min-width:0; padding:7px 8px; border-radius:8px; background:rgba(255,255,255,.06); box-shadow:inset 0 0 0 1px rgba(255,255,255,.07),0 0 16px var(--tile-glow); }
        .advisor-metric span { color:var(--text-muted); font-size:.68rem; line-height:1.15; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .advisor-metric strong { color:var(--tile-accent,var(--text-main)); font-size:.82rem; line-height:1.2; overflow-wrap:anywhere; }
        .advisor-items-head { display:flex; align-items:center; justify-content:space-between; gap:10px; min-width:0; color:var(--text-muted); font-size:.72rem; line-height:1.2; font-weight:800; text-transform:uppercase; letter-spacing:0; }
        .advisor-items-head strong { flex:0 0 auto; border-radius:999px; padding:4px 7px; background:rgba(255,255,255,.08); color:var(--text-main); font-size:.7rem; line-height:1.1; text-transform:none; }
        .advisor-items { display:grid; grid-template-columns:minmax(0,1fr); gap:8px; min-width:0; }
        .advisor-item { --item-accent:#93c5fd; display:grid; gap:4px; min-width:0; padding:9px; border-radius:8px; background:rgba(255,255,255,.055); border:1px solid color-mix(in srgb,var(--item-accent) 28%,rgba(255,255,255,.08)); box-shadow:inset 2px 0 0 var(--item-accent); cursor:pointer; }
        .advisor-item:focus-visible { outline:2px solid color-mix(in srgb,var(--item-accent) 84%,#fff); outline-offset:2px; }
        .advisor-item.advisor-critical { --item-accent:#f87171; }
        .advisor-item.advisor-warning { --item-accent:#fb923c; }
        .advisor-item.advisor-opportunity { --item-accent:#34d399; }
        .advisor-item.advisor-success { --item-accent:#34d399; }
        .advisor-item.advisor-setup { --item-accent:#93c5fd; }
        .advisor-item.advisor-info { --item-accent:#60a5fa; }
        .advisor-item-head { display:flex; align-items:center; justify-content:space-between; gap:8px; min-width:0; }
        .advisor-item-head strong { min-width:0; color:var(--item-accent); font-size:.82rem; line-height:1.2; overflow-wrap:anywhere; }
        .advisor-item-head span { flex:0 0 auto; max-width:42%; color:var(--text-main); font-size:.74rem; font-weight:800; line-height:1.1; border-radius:999px; padding:3px 6px; background:rgba(255,255,255,.08); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .advisor-item-text { color:rgba(243,246,255,.86); font-size:.78rem; line-height:1.35; overflow-wrap:anywhere; }
        .advisor-item-meta { display:flex; flex-wrap:wrap; align-items:center; gap:5px; min-width:0; }
        .advisor-item-meta span,.advisor-item-meta button { min-width:0; border:0; border-radius:999px; padding:3px 7px; background:color-mix(in srgb,var(--item-accent) 14%,rgba(255,255,255,.08)); color:var(--item-accent); font:inherit; font-size:.68rem; line-height:1.15; font-weight:800; overflow-wrap:anywhere; }
        .advisor-item-meta button { cursor:pointer; color:rgba(243,246,255,.8); background:rgba(255,255,255,.08); }
        .advisor-item-meta button:focus-visible { outline:2px solid color-mix(in srgb,var(--item-accent) 84%,#fff); outline-offset:2px; }
        .advisor-item-details { display:grid; gap:3px; min-width:0; margin-top:2px; }
        .advisor-item-details span { min-width:0; color:rgba(243,246,255,.76); font-size:.72rem; line-height:1.25; overflow-wrap:anywhere; }
        .advisor-explanation { display:grid; gap:7px; min-width:0; margin-top:7px; padding-top:8px; border-top:1px solid color-mix(in srgb,var(--item-accent) 24%,rgba(255,255,255,.12)); }
        .advisor-explanation[hidden] { display:none; }
        .advisor-explanation-section { display:grid; gap:3px; min-width:0; }
        .advisor-explanation-section strong { color:var(--text-muted); font-size:.68rem; line-height:1.2; text-transform:uppercase; letter-spacing:0; }
        .advisor-explanation-section p { margin:0; min-width:0; color:rgba(243,246,255,.8); font-size:.76rem; line-height:1.35; overflow-wrap:anywhere; }
        .advisor-explanation-section span,.advisor-explanation-section code { min-width:0; color:rgba(243,246,255,.78); font-size:.72rem; line-height:1.28; overflow-wrap:anywhere; }
        .advisor-explanation-section code { font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; border-radius:6px; padding:2px 5px; background:rgba(255,255,255,.06); }
        .advisor-explanation-sources { display:grid; gap:5px; min-width:0; margin-top:2px; }
        .advisor-explanation-sources summary { color:var(--text-muted); font-size:.68rem; line-height:1.2; font-weight:800; text-transform:uppercase; letter-spacing:0; cursor:pointer; }
        .advisor-explanation-sources div { display:grid; gap:3px; min-width:0; }
        .advisor-explanation-sources code { min-width:0; color:rgba(243,246,255,.78); font-size:.72rem; line-height:1.28; overflow-wrap:anywhere; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; border-radius:6px; padding:2px 5px; background:rgba(255,255,255,.06); }
        .chart-dashboard { display:grid; gap:14px; min-width:0; }
        .chart-dashboard-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; min-width:0; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,.1); background:linear-gradient(135deg,rgba(15,23,42,.76),rgba(8,13,28,.68)); }
        .chart-dashboard-label { color:var(--text-muted); font-size:.72rem; line-height:1.2; font-weight:800; text-transform:uppercase; letter-spacing:0; }
        .chart-dashboard h2 { margin:2px 0 0; color:var(--text-main); font-size:1.02rem; line-height:1.25; overflow-wrap:anywhere; }
        .chart-dashboard-head p { margin:4px 0 0; color:rgba(243,246,255,.72); font-size:.76rem; line-height:1.35; overflow-wrap:anywhere; }
        .chart-section { display:grid; gap:8px; min-width:0; }
        .chart-section-head { display:flex; align-items:center; justify-content:space-between; gap:10px; min-width:0; }
        .chart-section-head h3 { margin:0; color:var(--text-muted); font-size:.78rem; line-height:1.2; font-weight:900; text-transform:uppercase; letter-spacing:0; overflow-wrap:anywhere; }
        .chart-section-head span { flex:0 0 auto; border-radius:999px; padding:4px 7px; background:rgba(255,255,255,.08); color:var(--text-main); font-size:.7rem; line-height:1.1; font-weight:800; }
        .chart-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr)); gap:10px; min-width:0; }
        .chart-card { --tile-accent:#1f8fff; --tile-glow:transparent; display:grid; grid-template-rows:auto minmax(0,1fr); min-width:0; border-radius:8px; border:1px solid color-mix(in srgb,var(--tile-accent) 30%,rgba(255,255,255,.1)); background:linear-gradient(135deg,rgba(12,20,38,.78),rgba(12,20,38,.62)); box-shadow:inset 3px 0 0 var(--tile-accent),0 8px 20px rgba(0,0,0,.18),0 0 18px var(--tile-glow); overflow:hidden; }
        .chart-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; min-width:0; padding:10px 10px 6px; }
        .chart-card-head div { display:grid; gap:2px; min-width:0; }
        .chart-card-head strong { min-width:0; color:var(--tile-accent); font-size:.86rem; line-height:1.2; overflow-wrap:anywhere; }
        .chart-card-head span { min-width:0; color:var(--text-muted); font-size:.66rem; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .chart-open-button { flex:0 0 auto; width:30px; height:30px; display:grid; place-items:center; border-radius:8px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.07); color:var(--tile-accent); cursor:pointer; }
        .chart-open-button svg { width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
        .chart-card-body { min-width:0; padding:0 10px 10px; }
        .chart-card .chart-svg { min-height:150px; }
        .chart-card .chart-message { min-height:150px; font-size:.8rem; }
        .chart-card .chart-line { stroke-width:2.5; }
        .chart-backdrop { position:fixed; inset:0; z-index:1000; background:rgba(2,6,18,.58); backdrop-filter:blur(3px); }
        .chart-dialog { --tile-accent:#1f8fff; --tile-glow:transparent; position:fixed; z-index:1001; left:50%; top:50%; width:min(760px,calc(100vw - 28px)); max-height:calc(100vh - 32px); transform:translate(-50%,-50%); overflow:hidden; border-radius:14px; border:1px solid color-mix(in srgb,var(--tile-accent) 34%,rgba(255,255,255,.18)); background:linear-gradient(135deg,rgba(15,24,45,.98),rgba(8,14,28,.98)); box-shadow:0 24px 70px rgba(0,0,0,.62),0 0 26px var(--tile-glow); color:var(--text-main); }
        .chart-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:14px 14px 10px; border-bottom:1px solid rgba(255,255,255,.1); }
        .chart-title { display:grid; gap:3px; min-width:0; }
        .chart-title strong { color:var(--tile-accent); font-size:1rem; line-height:1.2; overflow-wrap:anywhere; }
        .chart-title span { color:var(--text-muted); font-size:.78rem; line-height:1.25; overflow-wrap:anywhere; }
        .chart-actions { display:flex; align-items:center; gap:6px; flex:0 0 auto; }
        .chart-range,.chart-close { min-width:34px; height:32px; border-radius:8px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.08); color:var(--text-main); font:inherit; font-size:.78rem; cursor:pointer; }
        .chart-range.active { background:color-mix(in srgb,var(--tile-accent) 24%,rgba(255,255,255,.08)); border-color:color-mix(in srgb,var(--tile-accent) 56%,rgba(255,255,255,.16)); color:#fff; }
        .chart-close { font-size:1.2rem; line-height:1; }
        .chart-body { padding:12px 14px 14px; min-height:260px; display:grid; place-items:center; }
        .chart-message { min-height:220px; display:grid; place-items:center; color:var(--text-muted); text-align:center; font-size:.92rem; }
        .chart-message.is-error { color:#fca5a5; }
        .chart-svg { display:block; width:100%; height:auto; min-height:220px; overflow:visible; }
        .chart-gridline { stroke:rgba(255,255,255,.18); stroke-width:1; }
        .chart-gridline.soft { stroke:rgba(255,255,255,.08); }
        .chart-zero { stroke:rgba(255,255,255,.28); stroke-dasharray:4 5; stroke-width:1; }
        .chart-line { fill:none; stroke:var(--tile-accent); stroke-width:3; stroke-linecap:round; stroke-linejoin:round; filter:drop-shadow(0 0 8px var(--tile-glow)); }
        .chart-dot { fill:var(--tile-accent); stroke:#fff; stroke-width:2; }
        .chart-label,.chart-current { fill:var(--text-muted); font-size:12px; }
        .chart-current { fill:var(--tile-accent); text-anchor:end; font-weight:700; }
        .chart-label.end { text-anchor:end; }
        .record-dashboard { display:grid; gap:14px; min-width:0; }
        .record-section { display:grid; gap:8px; min-width:0; }
        .record-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr)); gap:10px; min-width:0; }
        .record-loading-details { display:grid; gap:8px; min-width:0; padding:10px; border:1px solid rgba(96,165,250,.28); border-radius:8px; background:rgba(59,130,246,.08); }
        .record-loading-title { display:flex; align-items:center; justify-content:space-between; gap:10px; min-width:0; color:var(--text-main); font-size:.74rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em; }
        .record-loading-title strong { flex:0 0 auto; color:#93c5fd; font-size:.68rem; }
        .record-loading-list { display:grid; gap:6px; max-height:190px; overflow:auto; min-width:0; }
        .record-loading-item { display:grid; grid-template-columns:minmax(0,.85fr) minmax(0,1fr) minmax(0,1.25fr); align-items:center; gap:8px; min-width:0; padding:6px 8px; border-radius:6px; background:rgba(255,255,255,.055); }
        .record-loading-item span { min-width:0; color:var(--text-main); font-size:.74rem; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .record-loading-item small { min-width:0; color:var(--text-muted); font-size:.68rem; line-height:1.25; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .record-loading-item code { min-width:0; color:rgba(243,246,255,.72); font-size:.66rem; line-height:1.25; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; }
        .record-card { display:grid; gap:7px; min-width:0; padding:11px; border-radius:8px; border:1px solid color-mix(in srgb,#facc15 30%,rgba(255,255,255,.1)); background:linear-gradient(135deg,rgba(12,20,38,.78),rgba(12,20,38,.62)); box-shadow:inset 3px 0 0 #facc15,0 8px 20px rgba(0,0,0,.18); }
        .record-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; min-width:0; }
        .record-card-head strong { min-width:0; color:var(--text-main); font-size:.82rem; line-height:1.2; overflow-wrap:anywhere; }
        .record-card-head span { flex:0 0 auto; max-width:45%; color:var(--text-muted); font-size:.68rem; line-height:1.2; text-align:right; overflow-wrap:anywhere; }
        .record-card-value { color:#facc15; font-size:1.22rem; line-height:1.1; font-weight:900; overflow-wrap:anywhere; }
        .record-card code { min-width:0; color:rgba(243,246,255,.68); font-size:.66rem; line-height:1.25; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; border-radius:6px; padding:3px 5px; background:rgba(255,255,255,.06); }
        .floorplan-dashboard { display:grid; gap:12px; min-width:0; }
        .floorplan-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; min-width:0; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,.1); background:linear-gradient(135deg,rgba(15,23,42,.76),rgba(8,13,28,.68)); }
        .floorplan-head h2 { margin:2px 0 0; color:var(--text-main); font-size:1.02rem; line-height:1.25; overflow-wrap:anywhere; }
        .floorplan-head span { flex:0 0 auto; border-radius:999px; padding:4px 7px; background:rgba(255,255,255,.08); color:var(--text-main); font-size:.7rem; line-height:1.1; font-weight:800; }
        .floorplan-canvas { position:relative; min-width:0; border-radius:12px; border:1px solid rgba(255,255,255,.1); background:rgba(8,13,28,.68); overflow:hidden; }
        .floorplan-canvas svg { display:block; width:100%; height:auto; min-height:320px; }
        .floorplan-background { fill:rgba(10,18,34,.94); }
        .floorplan-grid-line { stroke:rgba(255,255,255,.07); stroke-width:.18; vector-effect:non-scaling-stroke; }
        .floorplan-room rect { fill:color-mix(in srgb,var(--room-color,#1f8fff) 12%,rgba(255,255,255,.04)); stroke:color-mix(in srgb,var(--room-color,#1f8fff) 46%,rgba(255,255,255,.2)); stroke-width:.45; vector-effect:non-scaling-stroke; }
        .floorplan-room text { fill:rgba(243,246,255,.78); font-size:2.3px; font-weight:800; pointer-events:none; }
        .floorplan-wall { stroke:var(--wall-color,#dbeafe); stroke-width:var(--wall-width,1.2); stroke-linecap:round; vector-effect:non-scaling-stroke; filter:drop-shadow(0 0 4px rgba(255,255,255,.18)); }
        .floorplan-sensor circle { fill:var(--sensor-color,#34d399); stroke:rgba(255,255,255,.82); stroke-width:.45; vector-effect:non-scaling-stroke; filter:drop-shadow(0 0 5px var(--sensor-color,#34d399)); }
        .floorplan-sensor-card { display:grid; gap:1px; min-width:0; max-width:100%; padding:3px 5px; border-radius:6px; border:1px solid color-mix(in srgb,var(--sensor-color,#34d399) 44%,rgba(255,255,255,.16)); background:rgba(8,16,38,.76); color:var(--text-main); font:600 3px/1.15 system-ui,sans-serif; box-sizing:border-box; overflow:hidden; }
        .floorplan-sensor-card span { color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .floorplan-sensor-card strong { color:var(--sensor-color,#34d399); font-size:3.4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .floorplan-empty { position:absolute; inset:0; display:grid; place-items:center; padding:18px; color:var(--text-muted); text-align:center; font-size:.86rem; pointer-events:none; }
        @media (max-width:700px){ .hide-mobile{display:none!important;} .header{grid-template-columns:minmax(0,1fr);align-items:stretch;} .house-select,.energy-range-select,.view-mode-toggle{width:100%;max-width:none;} .metric{width:clamp(68px,18%,96px);padding:5px 7px;} .metric .label{font-size:.62rem;} .metric .value{font-size:.76rem;} .grid{grid-template-columns:repeat(2,minmax(0,1fr));} .tile{grid-column:span var(--tile-mobile-columns);} .advisor-head{display:grid;} .advisor-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}.advisor-items{grid-template-columns:minmax(0,1fr);} .chart-head,.chart-dashboard-head{display:grid;} .chart-actions{justify-content:end;} .chart-grid{grid-template-columns:minmax(0,1fr);} .record-loading-item{grid-template-columns:1fr;align-items:start;gap:2px;} }
        @media (min-width:701px){ .hide-desktop{display:none!important;} }
      </style>
      <style>
        :host {
          --hud-box-opacity:${this._escape(this.config.hud_box_opacity)};
          --hud-box-scale:${this._escape(this.config.hud_box_scale)};
        }
      </style>
      <ha-card>
        ${headerHtml ? `<div class="header">${headerHtml}</div>` : ""}
        ${voltageAlertHtml}
        ${activeView === "advisor"
          ? advisorHtml
          : activeView === FLOORPLAN_DASHBOARD_VIEW
            ? floorplanDashboardHtml
            : activeView === CHART_DASHBOARD_VIEW
              ? chartDashboardHtml
              : activeView === RECORDS_DASHBOARD_VIEW
                ? recordsDashboardHtml
                : `
            <div class="scene"><img class="scene-image" src="${this._escape(state.imageSrc)}" data-fallbacks="${this._escape((state.imageFallbacks || []).join("|"))}" alt="${this._escape(this._houseLabel(state.activeHouse, state.variant))}" />${imageOverlayHtml}${flowHtml}${metricHtml}${statusHtml}</div>
            ${this.config.show_metric_tiles !== false ? `<div class="grid">${gridHtml}</div>${environmentSectionHtml}${largeConsumerSectionHtml}` : ""}
          `}
      </ha-card>
      ${this._renderChartOverlay()}
    `;

    this._attachControls();
    this._syncAdvisorRefreshTimer(activeView === "advisor");
  }

  _updateReadings() {
    const variant = this._currentVariant || this._layoutState().variant;
    const liveMetrics = [
      ...TILE_METRICS,
      ...this._visibleOverlayMetrics(),
      ...(this._showGridStatusTile() ? [GRID_STATUS_METRIC] : []),
      ...this._customKpiMetrics(),
      ...this._environmentSensorMetrics(),
      ...this._largeConsumerMetrics(),
    ];

    liveMetrics.forEach((metric) => {
      const readingHtml = this._renderMetricValueHtml(metric);
      const label = this._metricLabel(metric, variant);
      this.shadowRoot.querySelectorAll(`[data-label="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== label) element.textContent = label;
      });
      this.shadowRoot.querySelectorAll(`[data-value="${metric.key}"]`).forEach((element) => {
        if (element.innerHTML !== readingHtml) element.innerHTML = readingHtml;
      });
      const accent = this._metricAccent(metric);
      this.shadowRoot.querySelectorAll(`[data-accent-key="${metric.key}"]`).forEach((element) => {
        element.style.setProperty("--tile-accent", accent.color);
        element.style.setProperty("--tile-glow", accent.glow);
      });
      const warning = this._metricWarning(metric);
      const tooltip = this._metricTooltip(metric, variant);
      this.shadowRoot.querySelectorAll(`[data-tooltip-key="${metric.key}"]`).forEach((element) => {
        element.classList.toggle("is-warning", Boolean(warning));
        element.dataset.warning = warning?.label || "";
        element.setAttribute("title", tooltip);
        element.setAttribute("aria-label", tooltip);
      });
      const meterPercent = this._meterPercent(metric);
      this.shadowRoot.querySelectorAll(`[data-meter="${metric.key}"]`).forEach((element) => {
        element.setAttribute("title", this._meterTooltip(metric));
      });
      this.shadowRoot.querySelectorAll(`[data-meter="${metric.key}"] span`).forEach((element) => {
        element.style.width = `${(meterPercent ?? 0).toFixed(0)}%`;
      });
      const phaseLabel = this._wallboxPhaseLabel(metric);
      const phaseTitle = phaseLabel ? `${this._t("tooltip.phases", {}, "Phases")}: ${phaseLabel}` : "";
      this.shadowRoot.querySelectorAll(`[data-phase="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== phaseLabel) element.textContent = phaseLabel;
        element.style.display = phaseLabel ? "inline-flex" : "none";
        element.setAttribute("title", phaseTitle);
        element.setAttribute("aria-label", phaseTitle);
      });
      const socLabel = this._wallboxSocLabel(metric);
      const socTitle = socLabel ? `${this._t("tooltip.vehicleSoc", {}, "Vehicle SoC")}: ${socLabel}` : "";
      this.shadowRoot.querySelectorAll(`[data-vehicle-soc="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== socLabel) element.textContent = socLabel;
        element.style.display = socLabel ? "inline-flex" : "none";
        element.setAttribute("title", socTitle);
        element.setAttribute("aria-label", socTitle);
      });
      const remainingTimeLabel = this._wallboxRemainingTimeLabel(metric);
      const remainingTimeTitle = remainingTimeLabel ? `${this._t("tooltip.remainingChargeTime", {}, "Remaining charge time")}: ${remainingTimeLabel}` : "";
      this.shadowRoot.querySelectorAll(`[data-remaining-charge-time="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== remainingTimeLabel) element.textContent = remainingTimeLabel;
        element.style.display = remainingTimeLabel ? "inline-flex" : "none";
        element.setAttribute("title", remainingTimeTitle);
        element.setAttribute("aria-label", remainingTimeTitle);
      });
      const phaseAction = this._wallboxPhaseActionInfo(metric);
      const phaseActionLabel = phaseAction?.label || "";
      const phaseActionTitle = phaseActionLabel ? `${this._t("tooltip.phaseChange", {}, "Upcoming phase change")}: ${phaseActionLabel}` : "";
      this.shadowRoot.querySelectorAll(`[data-phase-action="${metric.key}"]`).forEach((element) => {
        if (element.textContent !== phaseActionLabel) element.textContent = phaseActionLabel;
        element.style.display = phaseActionLabel ? "inline-flex" : "none";
        element.setAttribute("title", phaseActionTitle);
        element.setAttribute("aria-label", phaseActionTitle);
      });
      const voltageEntries = new Map(this._metricVoltageEntries(metric, variant).map((entry) => [entry.key, entry]));
      this.shadowRoot.querySelectorAll(`[data-voltage="${metric.key}"]`).forEach((element) => {
        const entry = voltageEntries.get(element.dataset.voltageKey || this._metricVoltageEntityKey(metric));
        const voltageLabel = entry?.displayValue || "";
        const voltageTitle = entry ? `${this._t("tooltip.voltage", {}, "Voltage")}: ${entry.label} ${entry.value}` : "";
        if (element.textContent !== voltageLabel) element.textContent = voltageLabel;
        element.style.display = voltageLabel ? "inline-flex" : "none";
        element.setAttribute("title", voltageTitle);
        element.setAttribute("aria-label", voltageTitle);
      });
      if (this._isPvMetric(metric)) {
        PV_LABELS.forEach((label) => {
          const key = this._pvLabelKey(metric, label);
          const text = this._pvLabelText(metric, label);
          this.shadowRoot.querySelectorAll(`[data-pv-label="${key}"]`).forEach((element) => {
            if (element.textContent !== text) element.textContent = text;
            element.style.display = text ? "inline-flex" : "none";
            element.setAttribute("title", text);
            element.setAttribute("aria-label", text);
          });
        });
      }
      if (metric.key === "battery_level") {
        const temperatureLabel = this._batteryTemperatureLabel();
        const temperatureTitle = temperatureLabel ? `${this._t("tooltip.temperature", {}, "Temperature")}: ${temperatureLabel}` : "";
        this.shadowRoot.querySelectorAll("[data-battery-temperature]").forEach((element) => {
          if (element.textContent !== temperatureLabel) element.textContent = temperatureLabel;
          element.style.display = temperatureLabel ? "inline-flex" : "none";
          element.setAttribute("title", temperatureTitle);
          element.setAttribute("aria-label", temperatureTitle);
        });
        const batteryVoltageLabel = this._batteryVoltageLabel();
        const batteryVoltageTitle = batteryVoltageLabel ? `${this._t("tooltip.voltage", {}, "Voltage")}: ${batteryVoltageLabel}` : "";
        this.shadowRoot.querySelectorAll("[data-battery-voltage]").forEach((element) => {
          if (element.textContent !== batteryVoltageLabel) element.textContent = batteryVoltageLabel;
          element.style.display = batteryVoltageLabel ? "inline-flex" : "none";
          element.setAttribute("title", batteryVoltageTitle);
          element.setAttribute("aria-label", batteryVoltageTitle);
        });
        const flowInfo = this._batteryFlowInfo();
        const flowValue = this._formatBatteryFlowValue(flowInfo);
        this.shadowRoot.querySelectorAll("[data-battery-flow]").forEach((element) => {
          element.classList.toggle("charge", flowInfo?.direction === "charge");
          element.classList.toggle("discharge", flowInfo?.direction === "discharge");
          element.style.display = flowValue ? "inline-flex" : "none";
          const directionLabel = flowInfo ? this._batteryFlowDirectionLabel(flowInfo.direction) : "";
          element.setAttribute("title", flowValue ? `${directionLabel}: ${flowValue}` : "");
          element.setAttribute("aria-label", flowValue ? `${directionLabel}: ${flowValue}` : "");
        });
        this.shadowRoot.querySelectorAll("[data-battery-flow-label]").forEach((element) => {
          element.textContent = flowInfo ? this._batteryFlowDirectionLabel(flowInfo.direction) : "";
        });
        this.shadowRoot.querySelectorAll(".battery-flow-arrow").forEach((element) => {
          element.textContent = flowInfo?.direction === "charge" ? "↓" : "↑";
        });
        this.shadowRoot.querySelectorAll("[data-battery-flow-value]").forEach((element) => {
          element.textContent = flowValue;
        });
      }
    });
    IMAGE_OVERLAY_KEYS.forEach((key) => {
      const reading = this._formatOverlayReading(key);
      const label = this._overlayLabel(key);
      this.shadowRoot.querySelectorAll(`[data-overlay-label="${key}"]`).forEach((element) => {
        if (element.textContent !== label) element.textContent = label;
      });
      this.shadowRoot.querySelectorAll(`[data-overlay-value="${key}"]`).forEach((element) => {
        if (element.textContent !== reading) element.textContent = reading;
      });
    });
    const nextFlowHtml = this._renderEnergyFlows(variant);
    const flowOverlay = this.shadowRoot.querySelector("[data-flow-overlay]");
    if (flowOverlay && nextFlowHtml && flowOverlay.outerHTML !== nextFlowHtml.trim()) {
      flowOverlay.outerHTML = nextFlowHtml;
    } else if (flowOverlay && !nextFlowHtml) {
      flowOverlay.remove();
    } else if (!flowOverlay && nextFlowHtml) {
      this.shadowRoot.querySelector(".scene-image")?.insertAdjacentHTML("afterend", nextFlowHtml);
    }
    const statusAccent = this._metricAccent(STATUS_METRIC);
    this.shadowRoot.querySelectorAll(`[data-accent-key="${STATUS_METRIC.key}"]`).forEach((element) => {
      element.style.setProperty("--tile-accent", statusAccent.color);
      element.style.setProperty("--tile-glow", statusAccent.glow);
    });
    const statusElement = this.shadowRoot.querySelector("[data-status-label]");
    if (statusElement) {
      const statusLabel = this._statusLabel();
      if (statusElement.textContent !== statusLabel) statusElement.textContent = statusLabel;
    }
    const nextVoltageAlertHtml = this._renderGridVoltageAlert();
    const voltageAlertElement = this.shadowRoot.querySelector("[data-grid-voltage-alert]");
    if (voltageAlertElement && nextVoltageAlertHtml) {
      const trimmed = nextVoltageAlertHtml.trim();
      if (voltageAlertElement.outerHTML !== trimmed) voltageAlertElement.outerHTML = trimmed;
    } else if (voltageAlertElement && !nextVoltageAlertHtml) {
      voltageAlertElement.remove();
    } else if (!voltageAlertElement && nextVoltageAlertHtml) {
      const anchor = this.shadowRoot.querySelector(".scene,[data-energy-advisor],[data-floorplan-dashboard],[data-chart-dashboard],[data-record-dashboard]");
      if (anchor) anchor.insertAdjacentHTML("beforebegin", nextVoltageAlertHtml);
      else this.shadowRoot.querySelector("ha-card")?.insertAdjacentHTML("beforeend", nextVoltageAlertHtml);
    }
    const activeView = this._currentViewMode();
    const nextAdvisorHtml = activeView === "advisor" ? this._renderEnergyAdvisor({ dashboard: true }) : "";
    const advisorElement = this.shadowRoot.querySelector("[data-energy-advisor]");
    let advisorChanged = false;
    if (advisorElement && nextAdvisorHtml) {
      advisorElement.outerHTML = nextAdvisorHtml.trim();
      advisorChanged = true;
    } else if (advisorElement && !nextAdvisorHtml) {
      advisorElement.remove();
    } else if (!advisorElement && nextAdvisorHtml) {
      this.shadowRoot.querySelector("ha-card")?.insertAdjacentHTML("beforeend", nextAdvisorHtml);
      advisorChanged = true;
    }
    if (advisorChanged) this._attachAdvisorControls();
    const nextChartDashboardHtml = activeView === CHART_DASHBOARD_VIEW ? this._renderChartDashboard(variant) : "";
    const chartDashboardElement = this.shadowRoot.querySelector("[data-chart-dashboard]");
    let chartDashboardChanged = false;
    if (chartDashboardElement && nextChartDashboardHtml) {
      chartDashboardElement.outerHTML = nextChartDashboardHtml.trim();
      chartDashboardChanged = true;
    } else if (chartDashboardElement && !nextChartDashboardHtml) {
      chartDashboardElement.remove();
    } else if (!chartDashboardElement && nextChartDashboardHtml) {
      this.shadowRoot.querySelector("ha-card")?.insertAdjacentHTML("beforeend", nextChartDashboardHtml);
      chartDashboardChanged = true;
    }
    if (chartDashboardChanged) this._attachChartDashboardControls();
    const nextRecordsDashboardHtml = activeView === RECORDS_DASHBOARD_VIEW ? this._renderRecordsDashboard(variant) : "";
    const recordsDashboardElement = this.shadowRoot.querySelector("[data-record-dashboard]");
    let recordsDashboardChanged = false;
    if (recordsDashboardElement && nextRecordsDashboardHtml) {
      recordsDashboardElement.outerHTML = nextRecordsDashboardHtml.trim();
      recordsDashboardChanged = true;
    } else if (recordsDashboardElement && !nextRecordsDashboardHtml) {
      recordsDashboardElement.remove();
    } else if (!recordsDashboardElement && nextRecordsDashboardHtml) {
      this.shadowRoot.querySelector("ha-card")?.insertAdjacentHTML("beforeend", nextRecordsDashboardHtml);
      recordsDashboardChanged = true;
    }
    if (recordsDashboardChanged) this._attachRecordsDashboardControls();
    this._updateFloorplanReadings();
  }

  renderCard() {
    if (!this.config || !this.shadowRoot) return;
    this._renderCardShell(this._layoutState());
  }
}

Object.assign(
  HaSolarDashboardCard.prototype,
  createAdvisorEngineMethods({
    CARD_TYPE,
    GRID_STATUS_METRIC,
    WALLBOX_POWER_KEYS,
    advisorSuggestionLimit,
    advisorThresholds,
    advisorTypeRank,
    findMetricByKey,
    largeConsumerAdvisorDetails,
    numericState,
    pvRoofStringAdvisorDetails,
    sortAdvisorItems,
    wallboxAdvisorDetails,
  }),
  createAdvisorViewMethods(),
  createWeatherImageMethods({
    REPOSITORY_IMAGE_BASE,
    assetUrl,
  }),
  createRecordsDashboardMethods({
    RECORDS_DEFAULT_DAYS,
    RECORDS_RANGE_OPTIONS,
    activeDurationRecords,
    chartHistoryApiPath,
    dailyEnergyRecords,
    numericState,
    peakPowerRecord,
    recordsHistoryCacheKey,
  }),
);

const HaSolarDashboardCardEditor = createDashboardEditorClass({
  ADVISOR_DEFAULTS,
  DEFAULT_TILE_COLOR_RULES,
  HOUSE_VARIANTS,
  IMAGE_OVERLAY_KEYS,
  TILE_METRICS,
  VIEW_MODE_OPTIONS,
  adjacentWallboxPosition,
  assetUrl,
  clampConfigNumber,
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
});

function upgradeCustomElement(type, elementClass) {
  const existingClass = customElements.get(type);
  if (!existingClass) {
    customElements.define(type, elementClass);
    return;
  }

  Object.getOwnPropertyNames(elementClass.prototype).forEach((name) => {
    if (name === "constructor") return;
    Object.defineProperty(existingClass.prototype, name, Object.getOwnPropertyDescriptor(elementClass.prototype, name));
  });

  Object.getOwnPropertyNames(elementClass).forEach((name) => {
    if (["length", "name", "prototype"].includes(name)) return;
    Object.defineProperty(existingClass, name, Object.getOwnPropertyDescriptor(elementClass, name));
  });

  globalThis.document?.querySelectorAll?.(type).forEach((element) => {
    if (element.config && typeof element.setConfig === "function") element.setConfig(element.config);
    if (typeof element.connectedCallback === "function") element.connectedCallback();
  });
}

upgradeCustomElement(CARD_TYPE, HaSolarDashboardCard);
upgradeCustomElement(CARD_EDITOR_TYPE, HaSolarDashboardCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: "HA Solar Dashboard Card",
    description: "PV energy overview dashboard card",
    preview: true,
    documentationURL: "https://github.com/404GamerNotFound/ha-solar-dashboard",
  });
}
