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

function buildDistEntry() {
  const cardSource = readText("ha-solar-dashboard.js");
  const advisorModule = stripModuleExports(readText("modules/advisor.js")).trim();
  let bundled = cardSource.replace(
    /^import\s+\{[\s\S]*?\}\s+from\s+"\.\/modules\/advisor\.js";\n\n/,
    `${advisorModule}\n\n`,
  );
  if (bundled === cardSource) {
    throw new Error("Could not inline modules/advisor.js import into dist entry");
  }

  bundled = bundled
    .replace(
      '      <link rel="stylesheet" href="${this._escape(assetUrl("styles/card.css"))}" />',
      styleTagFromFile("styles/card.css"),
    )
    .replace(
      '      <link rel="stylesheet" href="${this._escape(assetUrl("styles/editor.css"))}" />',
      styleTagFromFile("styles/editor.css"),
    );

  if (bundled.includes('from "./modules/advisor.js"')) {
    throw new Error("Dist entry still contains a static advisor module import");
  }
  if (bundled.includes('assetUrl("styles/')) {
    throw new Error("Dist entry still depends on external CSS files");
  }
  return bundled;
}

const distEntry = buildDistEntry();
const distPath = "dist/ha-solar-dashboard.js";

if (checkOnly) {
  if (!existsSync(join(root, distPath))) {
    throw new Error(`${distPath} is missing`);
  }
  const current = readText(distPath);
  if (current !== distEntry) {
    throw new Error(`${distPath} is not up to date; run npm run build`);
  }
} else {
  writeText(distPath, distEntry);
}
