export const CHART_DASHBOARD_VIEW = "charts";
export const RECORDS_DASHBOARD_VIEW = "records";

export const VIEW_MODE_OPTIONS = Object.freeze([
  Object.freeze({ key: "house", labelKey: "view.house", label: "House View", icon: "house" }),
  Object.freeze({ key: "advisor", labelKey: "view.advisor", label: "Advisor Dashboard", icon: "advisor" }),
  Object.freeze({ key: CHART_DASHBOARD_VIEW, labelKey: "view.charts", label: "Charts", icon: "chart" }),
  Object.freeze({ key: RECORDS_DASHBOARD_VIEW, labelKey: "view.records", label: "Records", icon: "records" }),
]);

const VIEW_MODE_ALIASES = Object.freeze({
  home: "house",
  haus: "house",
  house_view: "house",
  building: "house",
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

export function normalizeViewMode(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "_");
  const key = VIEW_MODE_ALIASES[normalized] || normalized;
  return VIEW_MODE_OPTIONS.some((option) => option.key === key) ? key : undefined;
}

export function viewModeIconSvg(icon) {
  return VIEW_MODE_ICONS[icon] || "";
}
