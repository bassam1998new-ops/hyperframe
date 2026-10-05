import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  compareVersions,
  checkForUpdate,
  backupWorkspaceState,
  planWorkspaceMigration
} from "../src/update.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-update-"));
}

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return data; }
  };
}

test("semantic version comparison handles simple releases", () => {
  assert.equal(compareVersions("0.3.0", "0.2.9"), 1);
  assert.equal(compareVersions("0.2.0", "0.2.0"), 0);
  assert.equal(compareVersions("0.1.9", "0.2.0"), -1);
});

test("update check never invents install command before package is public", async () => {
  const result = await checkForUpdate({
    url: "https://example.test/release.json",
    fetchImpl: async () => response({
      product: "AurorA Studio",
      channel: "dev",
      latest_version: "0.3.0",
      public_install_ready: false,
      package_name: null,
      notes: { new: ["x"], fixed: [] }
    })
  });

  assert.equal(result.update_available, true);
  assert.equal(result.install_command, null);
});

test("workspace backup copies source-of-truth state before migration", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora", "library"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({ schema_version: 1 }));
  fs.writeFileSync(path.join(cwd, ".aurora", "project.json"), JSON.stringify({ project_id: "x" }));
  fs.writeFileSync(path.join(cwd, ".aurora", "library", "index.jsonl"), "");

  const result = backupWorkspaceState(cwd);
  assert.ok(fs.existsSync(path.join(result.backup_dir, "workspace.json")));
  assert.ok(fs.existsSync(path.join(result.backup_dir, "project.json")));
  assert.ok(fs.existsSync(path.join(result.backup_dir, "library", "index.jsonl")));
});

test("migration planner reports current schema as no-op", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({ schema_version: 1 }));

  const plan = planWorkspaceMigration({ cwd, targetVersion: 1 });
  assert.equal(plan.needed, false);
  assert.equal(plan.blocked, false);
});
