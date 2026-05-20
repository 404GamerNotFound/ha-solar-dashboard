export const ADVISOR_DEFAULTS = Object.freeze({
  surplusThreshold: 250,
  importThreshold: 250,
  highLoadThreshold: 3000,
  evSurplusThreshold: 1500,
  maxSuggestions: 8,
  staleSensorWarningMinutes: 30,
  staleSensorCriticalMinutes: 1440,
});

export const ADVISOR_TYPE_RANKS = Object.freeze({
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

export function normalizeAdvisorConfig(config = {}) {
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

export function advisorThresholds(config = {}) {
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

export function advisorSuggestionLimit(config = {}) {
  return normalizeAdvisorConfig(config).advisor_max_suggestions;
}

export function advisorTypeRank(type) {
  return ADVISOR_TYPE_RANKS[type] ?? ADVISOR_TYPE_RANKS.info;
}

export function sortAdvisorItems(items = []) {
  return [...items].sort((a, b) => (
    advisorTypeRank(b.type) - advisorTypeRank(a.type)
  ) || ((b.priority ?? 0) - (a.priority ?? 0)));
}
