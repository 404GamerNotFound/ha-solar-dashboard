(function loadHaSolarDashboardEntry() {
  const currentScriptUrl = document.currentScript?.src || "";
  const entryUrl = currentScriptUrl
    ? new URL("../ha-solar-dashboard.js", currentScriptUrl).href
    : "/hacsfiles/ha-solar-dashboard/ha-solar-dashboard.js";

  if ([...document.querySelectorAll("script[src]")].some((script) => script.src === entryUrl)) return;

  const script = document.createElement("script");
  script.type = "module";
  script.src = entryUrl;
  document.head.appendChild(script);
}());
