const GARAGE_SOLAR_PANEL_COUNT = 6;

export function garageSolarArraySvg({ activeHouse, hasCustomImage } = {}) {
  if (activeHouse !== "single_family_home" || hasCustomImage) return "";

  return `
    <svg class="garage-solar-array" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g class="garage-solar-array-panels">
        <polygon class="garage-solar-panel" points="6.8,43.9 10.8,43.15 12.05,45.05 8.05,45.9" />
        <polygon class="garage-solar-panel" points="11.1,43.1 15.15,42.35 16.4,44.25 12.35,45.0" />
        <polygon class="garage-solar-panel" points="15.45,42.3 19.65,41.52 20.95,43.42 16.75,44.2" />
        <polygon class="garage-solar-panel" points="8.35,46.15 12.4,45.38 13.72,47.42 9.65,48.2" />
        <polygon class="garage-solar-panel" points="12.72,45.32 16.85,44.53 18.18,46.58 14.03,47.37" />
        <polygon class="garage-solar-panel" points="17.17,44.47 21.45,43.65 22.8,45.7 18.5,46.53" />
        <path class="garage-solar-cell-lines" d="M8.1 43.66 9.35 45.4M9.45 43.42 10.7 45.16M11.28 43.06 12.53 44.8M12.66 42.81 13.92 44.55M14.05 42.55 15.32 44.29M15.65 42.24 16.92 43.98M17.08 41.98 18.35 43.72M18.52 41.71 19.79 43.45M9.68 45.9 10.98 47.65M11.06 45.63 12.38 47.39M13.83 45.33 15.14 47.1M15.23 45.06 16.55 46.82M16.64 44.78 17.97 46.55M18.66 44.44 20 46.21M20.12 44.16 21.46 45.93" />
      </g>
    </svg>`;
}

export { GARAGE_SOLAR_PANEL_COUNT };
