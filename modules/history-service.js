export const MINUTE_MS = 60 * 1000;
export const MAX_HISTORY_CACHE_ENTRIES = 48;
export const MAX_COUNTER_CACHE_ENTRIES = 72;

export function cacheBucketMsForMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 60) return MINUTE_MS;
  if (minutes <= 24 * 60) return 5 * MINUTE_MS;
  if (minutes <= 31 * 24 * 60) return 30 * MINUTE_MS;
  return 6 * 60 * MINUTE_MS;
}

export function cacheBucket(bucketMs = MINUTE_MS, now = Date.now()) {
  return Math.floor(now / bucketMs);
}

export function setCacheEntry(cache, key, value, maxEntries) {
  if (!cache) return;
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
}

export function counterHistoryApiPath(entityId, start, end = new Date()) {
  const query = [
    `filter_entity_id=${encodeURIComponent(entityId)}`,
    `end_time=${encodeURIComponent(end.toISOString())}`,
    "significant_changes_only=0",
  ].join("&");
  return `history/period/${start.toISOString()}?${query}`;
}

export function counterHistoryStatesFromEntries(entries = [], {
  entityId = "",
  defaultUnit = "m³",
  getEntityUnit = () => "",
  numericState = Number,
} = {}) {
  return entries
    .map((entry) => ({
      value: numericState(entry?.state ?? entry?.s),
      unit: entry?.attributes?.unit_of_measurement || getEntityUnit(entityId) || defaultUnit,
      time: Date.parse(entry?.last_changed || entry?.last_updated || entry?.lu || ""),
    }))
    .filter((entry) => Number.isFinite(entry.value) && Number.isFinite(entry.time))
    .sort((a, b) => a.time - b.time);
}

export function counterConsumptionFromStates(states = [], {
  currentValue,
  currentUnit = "",
  defaultUnit = "m³",
} = {}) {
  const latestState = states.length > 0 ? states[states.length - 1] : undefined;
  const endValue = Number.isFinite(currentValue) ? currentValue : latestState?.value;
  const startValue = states[0]?.value;
  const amount = Number.isFinite(endValue) && Number.isFinite(startValue)
    ? Math.max(0, endValue - startValue)
    : undefined;
  return { amount, unit: latestState?.unit || currentUnit || defaultUnit };
}

export function createHistoryServiceMethods({
  numericState = Number,
} = {}) {
  return {
    _ensureHistoryServiceState() {
      this._historyCache = this._historyCache || new Map();
      this._chartDashboardLoading = this._chartDashboardLoading || new Set();
      this._recordsCache = this._recordsCache || new Map();
      this._recordsRawHistoryCache = this._recordsRawHistoryCache || new Map();
      this._recordsLoading = this._recordsLoading || new Set();
      this._overlayConsumptionCache = this._overlayConsumptionCache || new Map();
      this._overlayConsumptionLoading = this._overlayConsumptionLoading || new Set();
      this._energyRangeCache = this._energyRangeCache || new Map();
      this._energyRangeLoading = this._energyRangeLoading || new Set();
    },

    _clearHistoryLoadingState() {
      this._energyRangeLoading?.clear();
      this._overlayConsumptionLoading?.clear();
      this._chartDashboardLoading?.clear();
      this._recordsLoading?.clear();
    },

    _invalidateHistoryServiceState({ pendingPrefix = "" } = {}) {
      this._asyncRequestToken = (this._asyncRequestToken || 0) + 1;
      this._clearPendingHistoryRequests?.(pendingPrefix);
      this._clearHistoryLoadingState();
    },

    _clearRecordsHistoryRequests() {
      this._recordsLoading?.clear();
      this._clearPendingHistoryRequests?.("records:");
    },

    _cacheBucketMsForMinutes(minutes) {
      return cacheBucketMsForMinutes(minutes);
    },

    _cacheBucket(bucketMs = MINUTE_MS) {
      return cacheBucket(bucketMs);
    },

    _setCacheEntry(cache, key, value, maxEntries) {
      setCacheEntry(cache, key, value, maxEntries);
    },

    _isActiveRequest(token) {
      return token === (this._asyncRequestToken || 0);
    },

    _updateReadingsIfReady() {
      if (!this.config || !this.shadowRoot || !this._isCardConnected) return;
      this._updateReadings();
    },

    async _loadCounterConsumption(entityId, minutes, defaultUnit = "m³") {
      const end = new Date();
      const start = new Date(end.getTime() - minutes * MINUTE_MS);
      return this._loadCounterConsumptionSince(entityId, start, defaultUnit, end);
    },

    async _loadCounterConsumptionSince(entityId, start, defaultUnit = "m³", end = new Date()) {
      const history = await this._hass.callApi("GET", counterHistoryApiPath(entityId, start, end));
      const states = counterHistoryStatesFromEntries(Array.isArray(history?.[0]) ? history[0] : [], {
        entityId,
        defaultUnit,
        getEntityUnit: (id) => this._getEntityUnit(id),
        numericState,
      });
      const currentValue = numericState(this._getEntityValue(entityId, undefined));
      return counterConsumptionFromStates(states, {
        currentValue,
        currentUnit: this._getEntityUnit(entityId),
        defaultUnit,
      });
    },
  };
}
