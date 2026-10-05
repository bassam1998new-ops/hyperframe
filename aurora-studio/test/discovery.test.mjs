import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scanWorkspace, writeDiscovery } from "../src/discovery.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-discovery-"));
}

test("discovery categorizes useful creative files", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, "assets", "models"), { recursive: true });
  fs.mkdirSync(path.join(cwd, "assets", "audio"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "assets", "models", "avatar.glb"), "");
  fs.writeFileSync(path.join(cwd, "assets", "audio", "voice.wav"), "");
  fs.writeFileSync(path.join(cwd, "hero.png"), "");

  const result = scanWorkspace(cwd);
  assert.equal(result.counts.model3d, 1);
  assert.equal(result.counts.audio, 1);
  assert.equal(result.counts.image, 1);
  assert.ok(result.directories.some(x => x.directory.includes("assets")));
});

test("discovery ignores node_modules and aurora state", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, "node_modules", "pkg"), { recursive: true });
  fs.mkdirSync(path.join(cwd, ".aurora", "temp"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "node_modules", "pkg", "noise.png"), "");
  fs.writeFileSync(path.join(cwd, ".aurora", "temp", "draft.mp4"), "");

  const result = scanWorkspace(cwd);
  assert.equal(result.counts.image, 0);
  assert.equal(result.counts.video, 0);
});

test("writeDiscovery persists a bounded report", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "brief.md"), "# brief");
  const result = writeDiscovery(cwd, { maxDepth: 2, maxFiles: 200 });
  assert.ok(fs.existsSync(result.file));
  assert.equal(result.discovery.counts.document, 1);
});
