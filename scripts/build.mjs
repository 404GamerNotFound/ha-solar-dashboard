import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const checkOnly = process.argv.includes("--check");

function readText(path) {
  return readFileSync(join(root, path), "utf8");
}

function writeText(path, content) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function stripModuleExports(source) {
  return source
    .replace(/\bexport\s+const\s+/g, "const ")
    .replace(/\bexport\s+function\s+/g, "function ");
}

function escapeTemplateLiteralContent(source) {
  return source.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function styleTagFromFile(path) {
  const css = escapeTemplateLiteralContent(readText(path).trim());
  const indented = css.split("\n").map((line) => `        ${line}`).join("\n");
  return `      <style>\n${indented}\n      </style>`;
}

function bundledI18nSource() {
  const dictionaries = {};
  for (const language of ["en", "de", "es", "fr", "pl"]) {
    dictionaries[language] = JSON.parse(readText(`i18n/${language}.json`));
  }
  return `const I18N = ${JSON.stringify(dictionaries, null, 2)};`;
}

function normalizeLocalModulePath(importPath) {
  const normalized = importPath.replace(/\\/g, "/");
  if (normalized.startsWith("../modules/")) return normalized.slice(3);
  if (normalized.startsWith("./modules/")) return normalized.slice(2);
  return "";
}

function inlineLocalModuleImports(source) {
  const inlinedModules = new Set();
  const importPattern = /^import\s+\{[\s\S]*?\}\s+from\s+"((?:\.\.\/|\.\/)modules\/[^"]+\.js)";\n*/gm;
  return source.replace(importPattern, (match, importPath) => {
    const modulePath = normalizeLocalModulePath(importPath);
    if (!modulePath) return match;
    if (inlinedModules.has(modulePath)) return "";
    inlinedModules.add(modulePath);
    return `${stripModuleExports(readText(modulePath)).trim()}\n\n`;
  });
}

function bootstrapPrelude() {
  return `const HA_SOLAR_DASHBOARD_BUILD = "2026-05-22-bootstrap";
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
      root.innerHTML = "<div style=\\"display:block;padding:16px;border-radius:12px;background:#1f2937;color:#e5e7eb;font:14px system-ui,sans-serif\\">HA Solar Dashboard wird geladen...</div>";
    }
  });
}());

`;
}

function buildEntry() {
  const cardSource = readText("src/ha-solar-dashboard.js");
  let bundled = inlineLocalModuleImports(cardSource);

  bundled = bundled
    .replace("const I18N = {};", bundledI18nSource())
    .replace(
      '      <link rel="stylesheet" href="${this._escape(assetUrl("styles/card.css"))}" />',
      styleTagFromFile("styles/card.css"),
    )
    .replace(
      '      <link rel="stylesheet" href="${this._escape(assetUrl("styles/editor.css"))}" />',
      styleTagFromFile("styles/editor.css"),
    );

  if (/^\s*import\s+/m.test(bundled)) {
    throw new Error("HACS entry still contains a static module import");
  }
  if (bundled.includes('assetUrl("styles/')) {
    throw new Error("HACS entry still depends on external CSS files");
  }
  return `${bootstrapPrelude()}${bundled}`;
}

function buildEditorEntry() {
  const editorSource = readText("src/ha-solar-dashboard-editor.js");
  let bundled = inlineLocalModuleImports(editorSource);

  bundled = bundled
    .replace("const I18N = {};", bundledI18nSource())
    .replace(
      '      <link rel="stylesheet" href="${this._escape(assetUrl("styles/editor.css"))}" />',
      styleTagFromFile("styles/editor.css"),
    );

  if (/^\s*import\s+/m.test(bundled)) {
    throw new Error("Editor entry still contains a static module import");
  }
  if (bundled.includes('assetUrl("styles/')) {
    throw new Error("Editor entry still depends on external CSS files");
  }
  return bundled;
}

const entries = [
  ["ha-solar-dashboard.js", buildEntry()],
  ["ha-solar-dashboard-editor.js", buildEditorEntry()],
];

if (checkOnly) {
  for (const [entryPath, entry] of entries) {
    if (!existsSync(join(root, entryPath))) {
      throw new Error(`${entryPath} is missing`);
    }
    const current = readText(entryPath);
    if (current !== entry) {
      throw new Error(`${entryPath} is not up to date; run npm run build`);
    }
  }
} else {
  for (const [entryPath, entry] of entries) {
    writeText(entryPath, entry);
  }
}
