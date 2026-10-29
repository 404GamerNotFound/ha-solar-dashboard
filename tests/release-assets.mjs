import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  RELEASE_SIZE_LIMIT,
  checkReleaseSize,
  collectReleaseAssets,
  planReleaseAssets,
  prepareReleaseAssets,
  publishReleaseAssets,
} from "../scripts/release-assets.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const actual = collectReleaseAssets(root);
assert.ok(actual.some((asset) => asset.name === "ha-solar-dashboard.js"));
assert.ok(actual.some((asset) => asset.name === "single_family_home.webp"));
assert.ok(actual.every((asset) => asset.name.endsWith(".webp") || asset.name === "ha-solar-dashboard.js"));
assert.ok(checkReleaseSize(actual) <= RELEASE_SIZE_LIMIT);
assert.equal(checkReleaseSize([{ size: RELEASE_SIZE_LIMIT }]), RELEASE_SIZE_LIMIT);
assert.throws(() => checkReleaseSize([{ size: RELEASE_SIZE_LIMIT }, { size: 1 }]), /byte limit/);

const temporary = mkdtempSync(join(tmpdir(), "solar-release-test-"));
try {
  const images = join(temporary, "images", "house");
  mkdirSync(images, { recursive: true });
  writeFileSync(join(temporary, "ha-solar-dashboard.js"), "// bundle");
  writeFileSync(join(images, "house.png"), "original PNG");
  assert.throws(() => collectReleaseAssets(temporary), /Missing WebP companion/);
  writeFileSync(join(images, "house.webp"), "webp");
  writeFileSync(join(temporary, "images", "house.webp"), "duplicate");
  assert.throws(() => collectReleaseAssets(temporary), /Duplicate release asset name/);
  rmSync(join(temporary, "images", "house.webp"));

  const output = join(temporary, "release-assets");
  const assets = prepareReleaseAssets(temporary, output);
  assert.deepEqual(readdirSync(output).sort(), ["ha-solar-dashboard.js", "house.webp"]);
  assert.throws(() => prepareReleaseAssets(temporary, output), /EEXIST/);

  // Workflows copy the tool outside the checkout. Resolve symlinked temp paths,
  // too (e.g. /tmp -> /private/tmp on macOS), before detecting CLI execution.
  const copiedTool = join(temporary, "release-tool.mjs");
  const linkedTool = join(temporary, "release-tool-link.mjs");
  copyFileSync(join(root, "scripts", "release-assets.mjs"), copiedTool);
  symlinkSync(copiedTool, linkedTool);
  execFileSync(process.execPath, [linkedTool, "prepare", "cli-assets"], { cwd: temporary });
  assert.deepEqual(readdirSync(join(temporary, "cli-assets")).sort(), ["ha-solar-dashboard.js", "house.webp"]);

  const existing = [
    { id: 1, name: "ha-solar-dashboard.js", size: 100 },
    { id: 2, name: "house.png", size: RELEASE_SIZE_LIMIT + 1 },
    { id: 3, name: "manual.pdf", size: 10 },
    { id: 4, name: "unrelated.png", size: 20 },
  ];
  const plan = planReleaseAssets(existing, assets);
  assert.deepEqual(plan.obsolete.map((asset) => asset.id), [2]);
  assert.equal(plan.bytes, checkReleaseSize(assets) + 30);
  assert.throws(() => planReleaseAssets([{ name: "manual.pdf", size: RELEASE_SIZE_LIMIT }], assets), /byte limit/);

  function mockGitHub({ failUpload = false, missingUpload = false, oversizedAttachment = false } = {}) {
    let remote = existing.map((asset) => ({ ...asset, state: "uploaded" }));
    if (oversizedAttachment) remote.push({ id: 5, name: "large.zip", size: RELEASE_SIZE_LIMIT });
    const calls = [];
    return {
      calls,
      assets: () => remote,
      gh(args) {
        calls.push(args);
        if (args[0] === "release") {
          if (failUpload) throw new Error("Upload failed");
          remote = remote.filter((item) => !assets.some((asset) => item.name === asset.name));
          remote.push(...assets.filter((asset) => !missingUpload || !asset.name.endsWith(".webp"))
            .map((asset, i) => ({ ...asset, id: 10 + i, state: "uploaded" })));
          return "";
        }
        if (args.includes("DELETE")) {
          const id = Number(args.at(-1).split("/").at(-1));
          remote = remote.filter((asset) => asset.id !== id);
          return "";
        }
        if (args.includes("--paginate")) {
          assert.ok(args.includes("--slurp"));
          // Multiple pages: planning and verification must include all assets.
          return JSON.stringify([remote.slice(0, 2), remote.slice(2)]);
        }
        assert.ok(args.at(-1).endsWith("/releases/tags/v2.3.10"));
        return JSON.stringify({ id: 39 });
      },
    };
  }

  const successful = mockGitHub();
  publishReleaseAssets(output, "v2.3.10", "owner/repo", successful.gh);
  assert.deepEqual(successful.assets().map((asset) => asset.name).sort(),
    ["ha-solar-dashboard.js", "house.webp", "manual.pdf", "unrelated.png"]);
  assert.equal(successful.calls.filter((args) => args.includes("DELETE")).length, 1);
  // Repeating a repair is safe and preserves unrelated attachments.
  publishReleaseAssets(output, "v2.3.10", "owner/repo", successful.gh);
  assert.equal(successful.calls.filter((args) => args.includes("DELETE")).length, 1);

  for (const options of [{ failUpload: true }, { missingUpload: true }, { oversizedAttachment: true }]) {
    const failed = mockGitHub(options);
    assert.throws(() => publishReleaseAssets(output, "v2.3.10", "owner/repo", failed.gh));
    assert.ok(failed.assets().some((asset) => asset.name === "house.png"));
    assert.ok(!failed.calls.some((args) => args.includes("DELETE")));
    if (options.oversizedAttachment) assert.ok(!failed.calls.some((args) => args[0] === "release"));
  }
  writeFileSync(join(output, "stale.png"), "stale");
  assert.throws(() => publishReleaseAssets(output, "v2.3.10", "owner/repo", () => {
    assert.fail("Invalid staging directory must fail before any remote operation");
  }), /only the card bundle and WebP/);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

console.log(`Release asset tests passed; current package: ${actual.length} files, ${checkReleaseSize(actual)} bytes.`);
