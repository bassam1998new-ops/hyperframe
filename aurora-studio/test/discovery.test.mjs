import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { discoverWorkspace, saveDiscovery } from "../src/discovery.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-discovery-"));
}

test("discovers useful creative files and ignores node_modules", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, "brand"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "brand", "logo.svg"), "<svg/>");
  fs.writeFileSync(path.join(cwd, "hero.blend"), "");
  fs.mkdirSync(path.join(cwd, "node_modules", "x"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "node_modules", "x", "ignore.png"), "");

  const result = discoverWorkspace(cwd);
  assert.ok(result.by_kind.brand.includes(path.join("brand", "logo.svg")));
  assert.ok(result.by_kind.three_d.includes("hero.blend"));
  assert.ok(!result.files.some(x => x.path.includes("node_modules")));
});

test("saves discovery into .aurora", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "README.md"), "# Demo");
  const saved = saveDiscovery(cwd);
  assert.ok(fs.existsSync(saved.file));
  assert.ok(saved.result.by_kind.context.includes("README.md"));
});
