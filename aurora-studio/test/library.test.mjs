import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  addLibraryItem,
  readLibrary,
  searchLibrary,
  summarizeLibrary,
  updateLibraryItem,
  removeLibraryItem,
  revealLibraryItem
} from "../src/library.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-library-"));
}

test("library stores license and approval metadata", () => {
  const cwd = temp();
  const item = addLibraryItem({
    name: "Studio Robot",
    kind: "model",
    type: "glb",
    path: "./assets/robot.glb",
    license_id: "CC0",
    commercial_allowed: true,
    redistribution_allowed: true,
    attribution_required: false,
    tags: ["robot", "3d", "avatar"],
    tools: ["blender"],
    approved: true,
    quality_tier: "hero"
  }, cwd);

  assert.equal(item.license.id, "CC0");
  assert.equal(item.approved, true);
  assert.equal(readLibrary(cwd).length, 1);
});

test("approved-only search ignores unapproved matches", () => {
  const cwd = temp();
  addLibraryItem({
    name: "Approved Glass Material",
    kind: "material",
    path: "./glass-approved.blend",
    tags: ["glass", "material"],
    approved: true
  }, cwd);
  addLibraryItem({
    name: "Unapproved Glass Material",
    kind: "material",
    path: "./glass-test.blend",
    tags: ["glass", "material"],
    approved: false
  }, cwd);

  const results = searchLibrary("glass material", { approved_only: true }, cwd);
  assert.equal(results.length, 1);
  assert.equal(results[0].name, "Approved Glass Material");
});

test("name and tags rank relevant asset above unrelated asset", () => {
  const cwd = temp();
  addLibraryItem({
    name: "Rigged Business Avatar",
    kind: "model",
    path: "./avatar.glb",
    tags: ["avatar", "rigged", "business"],
    approved: true
  }, cwd);
  addLibraryItem({
    name: "Wood Floor",
    kind: "material",
    path: "./wood.blend",
    tags: ["wood", "floor"],
    approved: true
  }, cwd);

  const results = searchLibrary("business avatar rigged", { approved_only: true }, cwd);
  assert.equal(results[0].name, "Rigged Business Avatar");
  assert.ok(results[0].search_score > 0);
});

test("library summary counts kinds", () => {
  const cwd = temp();
  addLibraryItem({ name: "A", kind: "model", path: "./a", approved: true }, cwd);
  addLibraryItem({ name: "B", kind: "material", path: "./b", approved: false }, cwd);
  const summary = summarizeLibrary(cwd);
  assert.equal(summary.total, 2);
  assert.equal(summary.approved, 1);
  assert.equal(summary.by_kind.model, 1);
  assert.equal(summary.by_kind.material, 1);
});


test("library metadata update preserves source and license", () => {
  const cwd = temp();
  addLibraryItem({
    id: "tracked",
    name: "Tracked asset",
    kind: "image",
    source_url: "https://example.test/asset",
    source_name: "Example",
    license_id: "CC0-1.0",
    commercial_allowed: true,
    redistribution_allowed: true,
    attribution_required: false,
    approved: false,
    tags: ["old"]
  }, cwd);

  const result = updateLibraryItem("tracked", {
    approved: true,
    tags: ["hero", "product"],
    quality_tier: "premium"
  }, cwd);

  assert.equal(result.item.approved, true);
  assert.deepEqual(result.item.tags, ["hero", "product"]);
  assert.equal(result.item.source_url, "https://example.test/asset");
  assert.equal(result.item.license.id, "CC0-1.0");
});

test("library removal never deletes the original source file", () => {
  const cwd = temp();
  const source = path.join(cwd, "asset.png");
  fs.writeFileSync(source, "source");

  addLibraryItem({
    id: "local",
    name: "Local asset",
    kind: "image",
    path: source,
    approved: true
  }, cwd);

  const result = removeLibraryItem("local", cwd);

  assert.equal(result.source_file_deleted, false);
  assert.equal(fs.existsSync(source), true);
  assert.equal(readLibrary(cwd).length, 0);
});


test("tracked Library reveal uses only the stored item path", () => {
  const cwd = temp();
  const source = path.join(cwd, "assets", "hero.png");
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.writeFileSync(source, "source");

  addLibraryItem({
    id: "reveal-me",
    name: "Reveal me",
    kind: "image",
    type: "png",
    path: source,
    approved: true
  }, cwd);

  let call = null;
  let unrefCalled = false;
  const result = revealLibraryItem(
    "reveal-me",
    cwd,
    {
      platform: "linux",
      spawnImpl(command, args, options) {
        call = { command, args, options };
        return {
          unref() {
            unrefCalled = true;
          }
        };
      }
    }
  );

  assert.equal(result.opened, true);
  assert.equal(result.path, source);
  assert.equal(result.source_file_deleted, false);
  assert.equal(call.command, "xdg-open");
  assert.deepEqual(call.args, [path.dirname(source)]);
  assert.equal(call.options.detached, true);
  assert.equal(unrefCalled, true);
  assert.equal(fs.existsSync(source), true);
});

test("tracked Library reveal fails when item has no available local path", () => {
  const cwd = temp();

  addLibraryItem({
    id: "remote-only",
    name: "Remote only",
    kind: "image",
    source_url: "https://example.test/asset",
    approved: true
  }, cwd);

  assert.throws(
    () => revealLibraryItem("remote-only", cwd, {
      platform: "linux",
      spawnImpl() {
        throw new Error("must not spawn");
      }
    }),
    /no available local file\/folder/
  );
});
