import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { syncSystemKnowledge, systemStatus } from "../src/system-install.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-system-"));
}

test("sync installs agent-readable system knowledge into workspace", () => {
  const cwd = temp();
  const result = syncSystemKnowledge(cwd);

  assert.ok(fs.existsSync(path.join(result.system_dir, "README.md")));
  assert.ok(fs.existsSync(path.join(result.system_dir, "package.json")));
  assert.ok(fs.existsSync(path.join(result.system_dir, "bin", "aurora-studio.mjs")));
  assert.ok(fs.existsSync(path.join(result.system_dir, "src", "studio.mjs")));
  assert.ok(fs.existsSync(path.join(result.system_dir, "prompts", "AGENT-START.md")));
  assert.ok(fs.existsSync(path.join(result.system_dir, "skills", "DIRECTOR.md")));
  assert.ok(fs.existsSync(path.join(result.system_dir, "knowledge", "providers", "google-flow.md")));
  assert.ok(fs.existsSync(path.join(result.system_dir, "schemas", "reference.schema.json")));
  assert.ok(fs.existsSync(path.join(result.system_dir, "system.json")));

  const status = systemStatus(cwd);
  assert.equal(status.installed, true);
  assert.equal(status.needs_sync, false);
});

test("sync replaces managed system but preserves user project memory", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "project.json"), JSON.stringify({
    project_id: "keep-me",
    product: "User Product"
  }));

  syncSystemKnowledge(cwd);
  fs.writeFileSync(path.join(cwd, ".aurora", "system", "old-managed-file.txt"), "old");
  syncSystemKnowledge(cwd);

  const project = JSON.parse(fs.readFileSync(path.join(cwd, ".aurora", "project.json"), "utf8"));
  assert.equal(project.product, "User Product");
  assert.equal(fs.existsSync(path.join(cwd, ".aurora", "system", "old-managed-file.txt")), false);
});

test("system status detects missing snapshot", () => {
  const cwd = temp();
  const status = systemStatus(cwd);
  assert.equal(status.installed, false);
  assert.equal(status.needs_sync, true);
});


test("portable copied CLI launches from the workspace snapshot", () => {
  const cwd = temp();
  const result = syncSystemKnowledge(cwd);
  const cli = path.join(result.system_dir, "bin", "aurora-studio.mjs");
  const run = spawnSync(process.execPath, [cli, "help"], {
    cwd,
    encoding: "utf8"
  });

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /AurorA Studio/);
  assert.match(run.stdout, /Production:/);
});

test("sync from portable runtime source would be a no-op boundary", () => {
  const cwd = temp();
  const result = syncSystemKnowledge(cwd);
  const metadata = JSON.parse(fs.readFileSync(path.join(result.system_dir, "system.json"), "utf8"));
  assert.equal(metadata.managed, true);
});
