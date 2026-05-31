import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const imagesRoot = join(root, "images");
const force = process.argv.includes("--force");
const qualityArg = process.argv.find((arg) => arg.startsWith("--quality="));
const quality = qualityArg ? Number(qualityArg.split("=")[1]) : 82;

function listPngFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listPngFiles(fullPath));
    } else if (/\.png$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function webpPathFor(pngPath) {
  return pngPath.replace(/\.png$/i, ".webp");
}

if (!existsSync(imagesRoot)) {
  throw new Error("images directory is missing");
}

try {
  execFileSync("cwebp", ["-version"], { stdio: "ignore" });
} catch (_err) {
  throw new Error("cwebp is required to generate WebP assets. Install libwebp, then run npm run optimize-images.");
}

if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
  throw new Error("--quality must be a number between 1 and 100");
}

let generated = 0;
let skipped = 0;
let originalBytes = 0;
let webpBytes = 0;

for (const pngPath of listPngFiles(imagesRoot)) {
  const webpPath = webpPathFor(pngPath);
  const pngStats = statSync(pngPath);
  const webpIsFresh = existsSync(webpPath) && statSync(webpPath).mtimeMs >= pngStats.mtimeMs;
  if (!force && webpIsFresh) {
    skipped += 1;
    originalBytes += pngStats.size;
    webpBytes += statSync(webpPath).size;
    continue;
  }

  mkdirSync(dirname(webpPath), { recursive: true });
  execFileSync("cwebp", ["-quiet", "-q", String(quality), "-m", "6", pngPath, "-o", webpPath], {
    stdio: "pipe",
  });
  generated += 1;
  originalBytes += pngStats.size;
  webpBytes += statSync(webpPath).size;
}

const savedBytes = originalBytes - webpBytes;
const percent = originalBytes > 0 ? (savedBytes / originalBytes) * 100 : 0;
console.log(`Generated ${generated} WebP asset(s), skipped ${skipped}.`);
console.log(`PNG total: ${(originalBytes / 1024 / 1024).toFixed(1)} MiB`);
console.log(`WebP total: ${(webpBytes / 1024 / 1024).toFixed(1)} MiB`);
console.log(`Saved: ${(savedBytes / 1024 / 1024).toFixed(1)} MiB (${percent.toFixed(1)}%)`);
console.log(`Output: ${relative(root, imagesRoot)}/**/*.webp`);
