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

function inlineModuleImport(source, modulePath) {
  const moduleName = modulePath.split("/").pop();
  const moduleSource = stripModuleExports(readText(modulePath)).trim();
  const pattern = new RegExp(
    `^import\\s+\\{[\\s\\S]*?\\}\\s+from\\s+"(?:\\.\\.\\/|\\.\\/)modules\\/${moduleName.replace(".", "\\.")}";\\n+`,
    "m",
  );
  const bundled = source.replace(pattern, `${moduleSource}\n\n`);
  if (bundled === source) {
    throw new Error(`Could not inline ${modulePath} import into HACS entry`);
  }
  return bundled;
}

function buildEntry() {
  const cardSource = readText("src/ha-solar-dashboard.js");
  let bundled = cardSource;
  bundled = inlineModuleImport(bundled, "modules/advisor.js");
  bundled = inlineModuleImport(bundled, "modules/formatters.js");
  bundled = inlineModuleImport(bundled, "modules/pv-strings.js");
  bundled = inlineModuleImport(bundled, "modules/grid-flow.js");
  bundled = inlineModuleImport(bundled, "modules/html.js");
  bundled = inlineModuleImport(bundled, "modules/charts.js");
  bundled = inlineModuleImport(bundled, "modules/large-consumers.js");
  bundled = inlineModuleImport(bundled, "modules/wallbox.js");

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
  return bundled;
}

const entry = buildEntry();
const entryPath = "ha-solar-dashboard.js";

if (checkOnly) {
  if (!existsSync(join(root, entryPath))) {
    throw new Error(`${entryPath} is missing`);
  }
  const current = readText(entryPath);
  if (current !== entry) {
    throw new Error(`${entryPath} is not up to date; run npm run build`);
  }
} else {
  writeText(entryPath, entry);
}
