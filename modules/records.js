export const RECORDS_DEFAULT_DAYS = 7;
export const RECORDS_DAY_OPTIONS = Object.freeze([7, 14, 30]);

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

export function recordsHistoryCacheKey(entityId, days, bucket) {
  return `${entityId}|records|${days}|${bucket}`;
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
  RECORDS_DAY_OPTIONS: dayOptions = RECORDS_DAY_OPTIONS,
  RECORDS_DEFAULT_DAYS: defaultDays = RECORDS_DEFAULT_DAYS,
  chartHistoryApiPath,
  dailyEnergyRecords: dailyEnergyRecordsFn = dailyEnergyRecords,
  activeDurationRecords: activeDurationRecordsFn = activeDurationRecords,
  peakPowerRecord: peakPowerRecordFn = peakPowerRecord,
  recordsHistoryCacheKey: recordsHistoryCacheKeyFn = recordsHistoryCacheKey,
  numericState,
} = {}) {
  return {
    _recordsDashboardDays() {
      const days = Number(this._recordsDays || this.config.records_days || defaultDays);
      return dayOptions.includes(days) ? days : defaultDays;
    },

    _recordsHistoryCacheKey(entityId, days) {
      return recordsHistoryCacheKeyFn(entityId, days, this._cacheBucket(RECORD_CACHE_BUCKET_MS));
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

    _recordPowerPoint(metric, entry) {
      return this._historyPoint(metric, entry);
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
        .map((metric) => {
          const entityId = this._chartEntityId(metric);
          if (!entityId || metric.gridStatus) return undefined;
          const key = metric.chartKey || metric.key;
          const group = String(metric.key || "").includes("wallbox")
            ? "wallbox"
            : metric.largeConsumer
              ? "consumer"
              : "system";
          return {
            key,
            label: this._metricLabel(metric, variant),
            entityId,
            type: "power",
            group,
            metric,
          };
        })
        .filter(Boolean);
      const seen = new Set();
      return [...pvEnergySources, ...pvPowerSources, ...metricSources].filter((source) => {
        const key = `${source.type}:${source.entityId}`;
        if (!source.entityId || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },

    _recordHistoryState(source) {
      const days = this._recordsDashboardDays();
      const cacheKey = this._recordsHistoryCacheKey(source.entityId, days);
      const cached = this._recordsCache?.get(cacheKey);
      if (cached?.error) return { loading: false, error: this._t("records.error", {}, "Records could not be loaded."), points: [] };
      if (cached) return { loading: false, error: "", points: cached };
      this._requestRecordHistory(source, days, cacheKey);
      return { loading: true, error: "", points: [] };
    },

    _requestRecordHistory(source, days, cacheKey) {
      if (!this._hass?.callApi || this._recordsLoading?.has(cacheKey)) return;
      const requestToken = this._asyncRequestToken || 0;
      this._recordsLoading.add(cacheKey);
      this._hass.callApi("GET", chartHistoryApiPath(source.entityId, days * 24))
        .then((history) => {
          if (!this._isActiveRequest(requestToken)) return;
          const states = Array.isArray(history?.[0]) ? history[0] : [];
          const points = states
            .map((entry) => source.type === "energy"
              ? this._recordEnergyPoint(entry, source.entityId)
              : this._recordPowerPoint(source.metric, entry))
            .filter(Boolean)
            .sort((a, b) => a.time - b.time);
          this._setCacheEntry(this._recordsCache, cacheKey, points, 96);
        })
        .catch(() => {
          if (!this._isActiveRequest(requestToken)) return;
          this._setCacheEntry(this._recordsCache, cacheKey, { error: true, points: [] }, 96);
        })
        .finally(() => {
          if (!this._isActiveRequest(requestToken)) return;
          this._recordsLoading?.delete(cacheKey);
          this._updateReadingsIfReady();
        });
    },

    _recordsSections(variant = this._currentVariant || this._layoutState().variant) {
      const sources = this._recordSources(variant);
      const states = sources.map((source) => ({ source, state: this._recordHistoryState(source) }));
      const loading = states.some((entry) => entry.state.loading);
      const hasError = states.some((entry) => entry.state.error);
      const cards = {
        pvEnergy: [],
        solarHours: [],
        peaks: [],
        wallbox: [],
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
              title: source.label,
              value: this._formatEnergyValue(bestDay.amount, "kWh", "kWh"),
              sortValue: bestDay.amount,
              meta: this._recordDateLabel(bestDay.day),
              entityId: source.entityId,
            });
          }
        }
        if (source.type === "power") {
          const peak = peakPowerRecordFn(state.points);
          if (peak) {
            pushCard("peaks", {
              title: source.label,
              value: this._formatPowerValue(peak.value, "auto", "W"),
              sortValue: peak.value,
              meta: this._formatLocalDateTime(new Date(peak.time).toISOString()),
              entityId: source.entityId,
            });
          }
          if (source.group === "pv") {
            const bestSolarDay = activeDurationRecordsFn(state.points, { threshold: this.config.records_solar_threshold_watts || RECORD_SOLAR_THRESHOLD_WATTS })[0];
            if (bestSolarDay) {
              pushCard("solarHours", {
                title: source.label,
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
                title: source.label,
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
        sections: [
          { key: "pvEnergy", label: this._t("records.sectionPvEnergy", {}, "Best PV yield per string"), items: sortByValue(cards.pvEnergy) },
          { key: "solarHours", label: this._t("records.sectionSolarHours", {}, "Longest solar hours"), items: sortByValue(cards.solarHours) },
          { key: "wallbox", label: this._t("records.sectionWallbox", {}, "Wallbox records"), items: sortByValue(cards.wallbox) },
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

    _renderRecordsDashboard(variant = this._currentVariant || this._layoutState().variant) {
      const days = this._recordsDashboardDays();
      const records = this._recordsSections(variant);
      const rangeButton = (value) => `
        <button type="button" class="chart-range${days === value ? " active" : ""}" data-record-days="${value}">${this._escape(this._t("records.days", { days: value }, `${value} days`))}</button>
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
              <p>${this._escape(this._t("records.subtitle", { days }, `Best values from the last ${days} days of Home Assistant history.`))}</p>
            </div>
            <div class="chart-actions">
              ${dayOptions.map((value) => rangeButton(value)).join("")}
            </div>
          </div>
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
      this.shadowRoot.querySelectorAll("[data-record-days]").forEach((button) => {
        if (button.dataset.recordDaysBound === "true") return;
        button.dataset.recordDaysBound = "true";
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const days = Number(event.currentTarget.dataset.recordDays);
          this._recordsDays = dayOptions.includes(days) ? days : defaultDays;
          this._renderCardShell(this._layoutState());
        });
      });
    },
  };
}
