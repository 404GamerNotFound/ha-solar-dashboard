import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const repoName = basename(root);
const failures = [];

function fail(message) {
  failures.push(message);
}

function readText(path) {
  return readFileSync(join(root, path), "utf8");
}

function assertExists(path) {
  if (!existsSync(join(root, path))) fail(`${path} is missing`);
}

function listFiles(path) {
  const base = join(root, path);
  if (!existsSync(base)) return [];
  return readdirSync(base).filter((entry) => statSync(join(base, entry)).isFile());
}

function listFilesRecursive(path) {
  const base = join(root, path);
  if (!existsSync(base)) return [];
  const files = [];
  for (const entry of readdirSync(base)) {
    const fullPath = join(base, entry);
    const relativePath = join(path, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...listFilesRecursive(relativePath));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

function hasImageFile(basePath, imageFile) {
  if (existsSync(join(root, basePath, imageFile))) return true;
  return listFilesRecursive(basePath).some((file) => basename(file) === imageFile);
}

function validateJson() {
  let hacs;
  try {
    hacs = JSON.parse(readText("hacs.json"));
  } catch (error) {
    fail(`hacs.json is not valid JSON: ${error.message}`);
    return;
  }

  if (hacs.name !== "HA Solar Dashboard Card") fail("hacs.json name must be HA Solar Dashboard Card");
  if (hacs.filename !== `${repoName}.js`) fail(`hacs.json filename must be ${repoName}.js`);
  if (hacs.render_readme !== true) fail("hacs.json render_readme must be true");
  if (typeof hacs.homeassistant !== "string" || /[<>=]/.test(hacs.homeassistant)) {
    fail("hacs.json homeassistant must be a plain minimum version string, for example 2023.8.0");
  }
}

function validateReadme() {
  const readme = readText("README.md");
  const imageMatches = [
    ...[...readme.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)].map((match) => match[1]),
    ...[...readme.matchAll(/<img\s+[^>]*src="([^"]+)"/g)].map((match) => match[1]),
  ];
  if (imageMatches.length === 0) fail("README.md must include at least one image for HACS to render");

  for (const imagePath of imageMatches) {
    if (/^https?:\/\//.test(imagePath)) continue;
    const cleanPath = normalize(imagePath.replace(/^\.?\//, ""));
    if (cleanPath.startsWith("..")) {
      fail(`README image path escapes repository: ${imagePath}`);
      continue;
    }
    if (!existsSync(join(root, cleanPath))) fail(`README image path does not exist: ${imagePath}`);
  }
}

function validatePackage() {
  assertExists("src/ha-solar-dashboard.js");
  assertExists("ha-solar-dashboard.js");

  const distFiles = listFilesRecursive("dist");
  const allowedDistFiles = ["dist/ha-solar-dashboard.js"];
  const unexpectedDistFiles = distFiles.filter((file) => !allowedDistFiles.includes(file));
  if (unexpectedDistFiles.length > 0) {
    fail(`dist must not contain duplicated package files; found: ${unexpectedDistFiles.join(", ")}`);
  }
  if (distFiles.includes("dist/ha-solar-dashboard.js")) {
    const distShim = readText("dist/ha-solar-dashboard.js");
    if (distShim.length > 1000) fail("dist/ha-solar-dashboard.js must stay a small compatibility loader, not a duplicated bundle");
    if (!distShim.includes("../ha-solar-dashboard.js")) fail("dist compatibility loader must point to the root HACS entry");
    if (distShim.includes("customElements.define")) fail("dist compatibility loader must not duplicate the card implementation");
  }

  try {
    execFileSync("node", [join(root, "scripts/build.mjs"), "--check"], { stdio: "pipe" });
  } catch (error) {
    fail(`ha-solar-dashboard.js must be generated from source:\n${error.stderr?.toString() || error.message}`);
  }

  const sourceI18nFiles = listFiles("i18n").filter((file) => file.endsWith(".json")).sort();
  if (sourceI18nFiles.length === 0) fail("i18n must contain at least one translation JSON file");
  const translations = new Map();
  for (const file of sourceI18nFiles) {
    try {
      const sourceTranslation = JSON.parse(readText(`i18n/${file}`));
      translations.set(file, sourceTranslation);
    } catch (error) {
      fail(`i18n/${file} is not valid JSON: ${error.message}`);
      continue;
    }
  }
  const defaultTranslation = translations.get("en.json");
  const defaultKeys = Object.keys(defaultTranslation || {}).sort();
  if (defaultKeys.length === 0) fail("i18n/en.json must contain translation keys");
  const placeholders = (value) => [...String(value).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",");
  for (const [file, translation] of translations) {
    const keys = Object.keys(translation).sort();
    const missing = defaultKeys.filter((key) => !Object.prototype.hasOwnProperty.call(translation, key));
    const extra = keys.filter((key) => !Object.prototype.hasOwnProperty.call(defaultTranslation || {}, key));
    const empty = keys.filter((key) => String(translation[key]).trim() === "");
    if (missing.length > 0) fail(`${file} is missing translation keys: ${missing.join(", ")}`);
    if (extra.length > 0) fail(`${file} has unknown translation keys: ${extra.join(", ")}`);
    if (empty.length > 0) fail(`${file} has empty translation values: ${empty.join(", ")}`);
    for (const key of defaultKeys) {
      if (placeholders(defaultTranslation[key]) !== placeholders(translation[key])) {
        fail(`${file} translation placeholders differ for ${key}`);
      }
    }
  }

  const sourceStyleFiles = listFiles("styles").filter((file) => file.endsWith(".css")).sort();
  if (sourceStyleFiles.length === 0) fail("styles must contain at least one CSS file");

  const sourceModuleFiles = listFiles("modules").filter((file) => file.endsWith(".js")).sort();
  if (sourceModuleFiles.length === 0) fail("modules must contain at least one JavaScript module");

  const source = readText("src/ha-solar-dashboard.js");
  const rootSource = readText("ha-solar-dashboard.js");
  const packageSource = [
    source,
    ...sourceModuleFiles.map((file) => readText(`modules/${file}`)),
  ].join("\n");
  const literalTranslationKeys = [...source.matchAll(/_t\(\s*["']([^"'`]+)["']/g)]
    .map((match) => match[1])
    .filter((key) => !key.includes("${"));
  const missingLiteralTranslationKeys = [...new Set(literalTranslationKeys.filter((key) => !Object.prototype.hasOwnProperty.call(defaultTranslation || {}, key)))].sort();
  if (missingLiteralTranslationKeys.length > 0) {
    fail(`i18n/en.json is missing literal translation keys used by the card: ${missingLiteralTranslationKeys.join(", ")}`);
  }
  if (!source.includes(`const CARD_TYPE = "${repoName}-card"`)) fail(`CARD_TYPE must be ${repoName}-card`);
  if (!source.includes(`type: CARD_TYPE`)) fail("customCards metadata must register the card type");
  if (rootSource.includes('from "./modules/') || rootSource.includes("import {")) fail("ha-solar-dashboard.js must be a bundled entry without static module imports");
  if (rootSource.includes("import.meta")) fail("ha-solar-dashboard.js must not rely on import.meta so it can survive legacy resource loading");
  if (rootSource.includes('assetUrl("styles/')) fail("ha-solar-dashboard.js must inline critical CSS for direct HACS loads");
  if (!rootSource.includes('"de": {')) fail("ha-solar-dashboard.js must inline translation dictionaries for direct HACS loads");

  const configuredImages = [...packageSource.matchAll(/\b(?:file|dayFile):\s*"([^"]+)"/g)].map((match) => match[1]);
  const fallbackImages = [...packageSource.matchAll(/fallbackFiles:\s*\[([^\]]*)\]/g)]
    .flatMap((match) => [...match[1].matchAll(/"([^"]+)"/g)].map((fileMatch) => fileMatch[1]));
  const imageFiles = [...new Set([...configuredImages, ...fallbackImages])];
  for (const imageFile of imageFiles) {
    if (!hasImageFile("images", imageFile)) fail(`source image is missing: images/**/${imageFile}`);
  }

  const sourceImageFiles = listFilesRecursive("images").sort();
  const invalidImageNames = sourceImageFiles.filter((file) => /\s/.test(basename(file)));
  if (invalidImageNames.length > 0) {
    fail(`image filenames must not contain whitespace: ${invalidImageNames.join(", ")}`);
  }

  const sourcePngFiles = sourceImageFiles.filter((file) => file.endsWith(".png"));
  const sourceImageBasenames = sourcePngFiles.map((file) => basename(file));
  const duplicateSourceNames = sourceImageBasenames.filter((file, index) => sourceImageBasenames.indexOf(file) !== index);
  if (duplicateSourceNames.length > 0) {
    fail(`source image filenames must be unique for release asset compatibility: ${[...new Set(duplicateSourceNames)].join(", ")}`);
  }

  const missingWebpFiles = [];
  const oversizedWebpFiles = [];
  const ineffectiveWebpFiles = [];
  for (const pngFile of sourcePngFiles) {
    const webpFile = pngFile.replace(/\.png$/i, ".webp");
    const pngSize = statSync(join(root, pngFile)).size;
    if (!existsSync(join(root, webpFile))) {
      missingWebpFiles.push(webpFile);
      continue;
    }
    const webpSize = statSync(join(root, webpFile)).size;
    if (webpSize >= pngSize) ineffectiveWebpFiles.push(`${webpFile} (${webpSize} >= ${pngSize})`);
    if (pngSize > 1500 * 1024 && webpSize > 512 * 1024) {
      oversizedWebpFiles.push(`${webpFile} (${Math.round(webpSize / 1024)} KiB)`);
    }
  }
  if (missingWebpFiles.length > 0) fail(`PNG images must have matching WebP companions: ${missingWebpFiles.join(", ")}`);
  if (ineffectiveWebpFiles.length > 0) fail(`WebP companions must be smaller than their PNG source: ${ineffectiveWebpFiles.join(", ")}`);
  if (oversizedWebpFiles.length > 0) fail(`large PNG images must have WebP companions <= 512 KiB: ${oversizedWebpFiles.join(", ")}`);
}

function validateJavaScript() {
  const moduleFiles = [
    ...listFiles("modules").filter((file) => file.endsWith(".js")).map((file) => `modules/${file}`),
  ];
  const distShimFiles = existsSync(join(root, "dist/ha-solar-dashboard.js")) ? ["dist/ha-solar-dashboard.js"] : [];
  for (const file of ["src/ha-solar-dashboard.js", "ha-solar-dashboard.js", ...moduleFiles, ...distShimFiles]) {
    try {
      execFileSync("node", ["--check", join(root, file)], { stdio: "pipe" });
    } catch (error) {
      fail(`${file} has invalid JavaScript syntax:\n${error.stderr?.toString() || error.message}`);
    }
  }
}

validateJson();
validateReadme();
validatePackage();
validateJavaScript();

if (failures.length > 0) {
  console.error(`HACS package validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("HACS package validation passed.");
