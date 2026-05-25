export function createAdvisorEngineMethods({
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
