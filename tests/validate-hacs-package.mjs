import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
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

function hash(path) {
  return createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
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

function validateDistPackage() {
  assertExists("ha-solar-dashboard.js");
  assertExists("dist/ha-solar-dashboard.js");

  const rootCard = hash("ha-solar-dashboard.js");
  const distCard = hash("dist/ha-solar-dashboard.js");
  if (rootCard !== distCard) fail("dist/ha-solar-dashboard.js must match ha-solar-dashboard.js");

  const distJsFiles = listFiles("dist").filter((file) => file.endsWith(".js"));
  if (!distJsFiles.includes(`${repoName}.js`)) fail(`dist must contain ${repoName}.js`);
  if (distJsFiles.length !== 1) fail(`dist must contain exactly one JavaScript entry file, found: ${distJsFiles.join(", ")}`);

  const sourceI18nFiles = listFiles("i18n").filter((file) => file.endsWith(".json")).sort();
  const distI18nFiles = listFiles("dist/i18n").filter((file) => file.endsWith(".json")).sort();
  if (sourceI18nFiles.length === 0) fail("i18n must contain at least one translation JSON file");
  if (sourceI18nFiles.join(",") !== distI18nFiles.join(",")) {
    fail(`dist/i18n must contain the same JSON files as i18n, found: ${distI18nFiles.join(", ")}`);
  }
  for (const file of sourceI18nFiles) {
    try {
      JSON.parse(readText(`i18n/${file}`));
      JSON.parse(readText(`dist/i18n/${file}`));
    } catch (error) {
      fail(`i18n/${file} or dist/i18n/${file} is not valid JSON: ${error.message}`);
      continue;
    }
    if (hash(`i18n/${file}`) !== hash(`dist/i18n/${file}`)) {
      fail(`dist/i18n/${file} must match i18n/${file}`);
    }
  }

  const sourceStyleFiles = listFiles("styles").filter((file) => file.endsWith(".css")).sort();
  const distStyleFiles = listFiles("dist/styles").filter((file) => file.endsWith(".css")).sort();
  if (sourceStyleFiles.length === 0) fail("styles must contain at least one CSS file");
  if (sourceStyleFiles.join(",") !== distStyleFiles.join(",")) {
    fail(`dist/styles must contain the same CSS files as styles, found: ${distStyleFiles.join(", ")}`);
  }
  for (const file of sourceStyleFiles) {
    if (hash(`styles/${file}`) !== hash(`dist/styles/${file}`)) {
      fail(`dist/styles/${file} must match styles/${file}`);
    }
  }

  const source = readText("ha-solar-dashboard.js");
  if (!source.includes(`const CARD_TYPE = "${repoName}-card"`)) fail(`CARD_TYPE must be ${repoName}-card`);
  if (!source.includes(`type: CARD_TYPE`)) fail("customCards metadata must register the card type");

  const configuredImages = [...source.matchAll(/\b(?:file|dayFile):\s*"([^"]+)"/g)].map((match) => match[1]);
  const fallbackImages = [...source.matchAll(/fallbackFiles:\s*\[([^\]]*)\]/g)]
    .flatMap((match) => [...match[1].matchAll(/"([^"]+)"/g)].map((fileMatch) => fileMatch[1]));
  const imageFiles = [...new Set([...configuredImages, ...fallbackImages])];
  for (const imageFile of imageFiles) {
    if (!hasImageFile("images", imageFile)) fail(`source image is missing: images/**/${imageFile}`);
    if (!hasImageFile("dist/images", imageFile)) fail(`HACS dist image is missing: dist/images/**/${imageFile}`);
  }

  const sourceImageBasenames = listFilesRecursive("images")
    .filter((file) => file.endsWith(".png"))
    .map((file) => basename(file));
  const duplicateSourceNames = sourceImageBasenames.filter((file, index) => sourceImageBasenames.indexOf(file) !== index);
  if (duplicateSourceNames.length > 0) {
    fail(`source image filenames must be unique for release asset compatibility: ${[...new Set(duplicateSourceNames)].join(", ")}`);
  }

  const distImageBasenames = listFilesRecursive("dist/images")
    .filter((file) => file.endsWith(".png"))
    .map((file) => basename(file));
  const duplicateReleaseNames = distImageBasenames.filter((file, index) => distImageBasenames.indexOf(file) !== index);
  if (duplicateReleaseNames.length > 0) {
    fail(`dist image filenames must be unique for flattened release assets: ${[...new Set(duplicateReleaseNames)].join(", ")}`);
  }
}

function validateJavaScript() {
  for (const file of ["ha-solar-dashboard.js", "dist/ha-solar-dashboard.js"]) {
    try {
      execFileSync("node", ["--check", join(root, file)], { stdio: "pipe" });
    } catch (error) {
      fail(`${file} has invalid JavaScript syntax:\n${error.stderr?.toString() || error.message}`);
    }
  }
}

validateJson();
validateReadme();
validateDistPackage();
validateJavaScript();

if (failures.length > 0) {
  console.error(`HACS package validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("HACS package validation passed.");
