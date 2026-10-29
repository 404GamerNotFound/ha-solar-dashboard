import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, realpathSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const RELEASE_SIZE_LIMIT = 100 * 1024 * 1024;

export function checkReleaseSize(assets) {
  const bytes = assets.reduce((total, asset) => total + asset.size, 0);
  if (bytes > RELEASE_SIZE_LIMIT) {
    throw new Error(`Release assets total ${bytes} bytes, exceeding the ${RELEASE_SIZE_LIMIT} byte limit.`);
  }
  return bytes;
}

export function collectReleaseAssets(root) {
  const files = [join(root, "ha-solar-dashboard.js")];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && /\.webp$/i.test(entry.name)) files.push(path);
      else if (entry.isFile() && /\.png$/i.test(entry.name) && !existsSync(path.replace(/\.png$/i, ".webp"))) {
        throw new Error(`Missing WebP companion for ${path}; run npm run optimize-images.`);
      }
    }
  }
  visit(join(root, "images"));
  const assets = files.map((path) => ({ path, name: basename(path), size: statSync(path).size }));
  const names = new Set();
  for (const asset of assets) {
    if (names.has(asset.name)) throw new Error(`Duplicate release asset name: ${asset.name}`);
    names.add(asset.name);
  }
  if (assets.length === 1) throw new Error("No WebP release images found.");
  checkReleaseSize(assets);
  return assets.sort((a, b) => a.name.localeCompare(b.name));
}

export function planReleaseAssets(existing, assets) {
  const names = new Set(assets.map((asset) => asset.name));
  // Only remove PNGs for which this exact release supplies a WebP replacement.
  const obsolete = existing.filter((asset) => /\.png$/i.test(asset.name)
    && names.has(asset.name.replace(/\.png$/i, ".webp")));
  const obsoleteNames = new Set(obsolete.map((asset) => asset.name));
  const retained = existing.filter((asset) => !names.has(asset.name) && !obsoleteNames.has(asset.name));
  const bytes = checkReleaseSize([...retained, ...assets]);
  return { obsolete, bytes };
}

export function prepareReleaseAssets(root, output) {
  const assets = collectReleaseAssets(root);
  // A fresh directory prevents stale PNGs from re-entering a release on a rerun.
  mkdirSync(output);
  for (const asset of assets) copyFileSync(asset.path, join(output, asset.name));
  console.log(`Prepared ${assets.length} release assets (${checkReleaseSize(assets)} bytes).`);
  return assets;
}

export function publishReleaseAssets(directory, tag, repository, gh = (args) => execFileSync("gh", args, { encoding: "utf8" })) {
  if (!tag || !/^[\w.-]+\/[\w.-]+$/.test(repository || "")) {
    throw new Error("A release tag and GITHUB_REPOSITORY (owner/repo) are required.");
  }
  const assets = readdirSync(directory).map((name) => ({ name, size: statSync(join(directory, name)).size }));
  if (!assets.some((asset) => asset.name === "ha-solar-dashboard.js")
    || !assets.some((asset) => asset.name.endsWith(".webp"))
    || assets.some((asset) => asset.name !== "ha-solar-dashboard.js" && !asset.name.endsWith(".webp"))) {
    throw new Error("Release directory must contain only the card bundle and WebP images.");
  }
  const api = `repos/${repository}`;
  const release = JSON.parse(gh(["api", `${api}/releases/tags/${encodeURIComponent(tag)}`]));
  const listAssets = () => JSON.parse(gh(["api", "--paginate", "--slurp", `${api}/releases/${release.id}/assets`])).flat();
  const { obsolete } = planReleaseAssets(listAssets(), assets);
  gh(["release", "upload", tag, ...assets.map((asset) => join(directory, asset.name)), "--clobber", "--repo", repository]);
  const uploaded = listAssets();
  for (const asset of assets) {
    if (!uploaded.some((remote) => remote.name === asset.name && remote.size === asset.size && remote.state === "uploaded")) {
      throw new Error(`Release upload verification failed for ${asset.name}; old PNGs were preserved.`);
    }
  }
  // Delete only after every replacement is present; unrelated attachments survive.
  for (const asset of obsolete) gh(["api", "--method", "DELETE", `${api}/releases/assets/${asset.id}`]);
  const bytes = checkReleaseSize(listAssets());
  console.log(`Published release assets: ${bytes} bytes; removed ${obsolete.length} replaced PNG asset(s).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const [command, output = "release-assets", tag] = process.argv.slice(2);
  if (command === "prepare") prepareReleaseAssets(process.cwd(), resolve(output));
  else if (command === "publish") publishReleaseAssets(resolve(output), tag, process.env.GITHUB_REPOSITORY);
  else throw new Error("Usage: node scripts/release-assets.mjs prepare [directory] | publish [directory] <tag>");
}
