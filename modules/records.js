export const RECORDS_DEFAULT_DAYS = 7;
export const RECORDS_RANGE_OPTIONS = Object.freeze([
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

export function recordsHistoryCacheKey(entityId, days, bucket) {
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

export function dailyEnergyRecords(points = []) {
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

export function activeDurationRecords(points = [], { threshold = RECORD_ACTIVE_THRESHOLD_WATTS, maxGapMs = RECORD_MAX_GAP_MS } = {}) {
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

export function peakPowerRecord(points = []) {
  return sortedPoints(points)
    .reduce((best, point) => (!best || point.value > best.value ? point : best), undefined);
}

export function createRecordsDashboardMethods({
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
        .map((entry) => (source.type === "energy" || source.type === "money")
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
      const gridFinanceSources = [
        {
          key: "grid_import_cost",
          label: this._t("records.gridImport", {}, "Grid import"),
          entityId: typeof this._gridEnergyEntityId === "function" ? this._gridEnergyEntityId("import") : "",
          type: "money",
          group: "grid",
          recordKind: "importCost",
          price: typeof this._gridImportPrice === "function" ? this._gridImportPrice() : "",
        },
        {
          key: "grid_export_revenue",
          label: this._t("records.gridExport", {}, "Grid export"),
          entityId: typeof this._gridEnergyEntityId === "function" ? this._gridEnergyEntityId("export") : "",
          type: "money",
          group: "grid",
          recordKind: "exportRevenue",
          price: typeof this._gridExportPrice === "function" ? this._gridExportPrice() : "",
        },
      ].filter((source) => source.entityId && source.price !== "");
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
      return [...gridFinanceSources, ...pvEnergySources, ...pvPowerSources, ...inverterPowerSources, ...metricSources].filter((source) => {
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
      const order = this._recordsDashboardRenderIndex || 0;
      this._recordsDashboardRenderIndex = order + 1;
      this._requestRecordHistory(source, rawCacheKey, { priority: Math.max(5, 60 - order) });
      return { loading: true, error: "", points: [] };
    },

    _requestRecordHistory(source, rawCacheKey, { priority = 0 } = {}) {
      if (!this._hass?.callApi || this._recordsLoading?.has(rawCacheKey)) return;
      const requestToken = this._asyncRequestToken || 0;
      const hours = this._recordsDashboardHours();
      this._recordsLoading.add(rawCacheKey);
      const request = typeof this._queueHistoryRequest === "function"
        ? this._queueHistoryRequest(
          `records:${rawCacheKey}`,
          () => this._hass.callApi("GET", chartHistoryApiPath(source.entityId, hours)),
          { priority },
        )
        : this._hass.callApi("GET", chartHistoryApiPath(source.entityId, hours));
      request
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
      this._recordsDashboardRenderIndex = 0;
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
        finance: [],
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
        if (source.type === "money") {
          const bestDay = dailyEnergyRecordsFn(state.points)[0];
          const price = Number(source.price);
          if (bestDay && Number.isFinite(price)) {
            const value = bestDay.amount * price;
            const titleKey = source.recordKind === "exportRevenue" ? "records.gridBestRevenue" : "records.gridHighestCost";
            const fallback = source.recordKind === "exportRevenue"
              ? `${source.label}: highest feed-in revenue`
              : `${source.label}: highest import cost`;
            pushCard("finance", {
              title: this._t(titleKey, { name: source.label }, fallback),
              value: typeof this._formatMoney === "function" ? this._formatMoney(value) : String(value.toFixed(2)),
              sortValue: value,
              meta: `${this._recordDateLabel(bestDay.day)} · ${this._formatEnergyValue(bestDay.amount, "kWh", "kWh")}`,
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
          { key: "finance", label: this._t("records.sectionFinance", {}, "Costs and revenue"), items: sortByValue(cards.finance) },
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
      if (source.type === "money") return this._t("records.loadingPurposeGridFinance", {}, "Grid costs and revenue");
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
          if (typeof this._clearRecordsHistoryRequests === "function") {
            this._clearRecordsHistoryRequests();
          } else {
            this._recordsLoading?.clear();
            this._clearPendingHistoryRequests?.("records:");
          }
          this._renderCardShell(this._layoutState());
        });
      });
    },
  };
}
