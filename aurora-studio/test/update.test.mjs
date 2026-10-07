import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  compareVersions,
  checkForUpdate,
  backupWorkspaceState,
  listWorkspaceBackups,
  activeProductionRuns,
  planWorkspaceMigration,
  updateSafetyPlan
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


test("update check exposes remote workspace schema", async () => {
  const result = await checkForUpdate({
    url: "https://example.test/release.json",
    fetchImpl: async () => response({
      product: "AurorA Studio",
      channel: "dev",
      latest_version: "0.3.0",
      workspace_schema_version: 2,
      public_install_ready: false,
      package_name: null,
      notes: { new: ["schema"], fixed: [] }
    })
  });

  assert.equal(result.workspace_schema_version, 2);
  assert.equal(result.update_available, true);
});

test("workspace backup preserves styles and run evidence but excludes run temp", () => {
  const cwd = temp();
  const root = path.join(cwd, ".aurora");
  const run = path.join(root, "runs", "run-1");

  fs.mkdirSync(path.join(root, "styles"), { recursive: true });
  fs.mkdirSync(path.join(run, "history"), { recursive: true });
  fs.mkdirSync(path.join(run, "temp"), { recursive: true });

  fs.writeFileSync(path.join(root, "workspace.json"), JSON.stringify({ schema_version: 1 }));
  fs.writeFileSync(path.join(root, "styles", "approved.md"), "style");
  fs.writeFileSync(path.join(run, "state.json"), JSON.stringify({ status: "completed" }));
  fs.writeFileSync(path.join(run, "history", "review.json"), "{}");
  fs.writeFileSync(path.join(run, "temp", "scratch.bin"), "temp");

  const result = backupWorkspaceState(cwd);

  assert.ok(fs.existsSync(path.join(result.backup_dir, "styles", "approved.md")));
  assert.ok(fs.existsSync(path.join(result.backup_dir, "runs", "run-1", "state.json")));
  assert.ok(fs.existsSync(path.join(result.backup_dir, "runs", "run-1", "history", "review.json")));
  assert.equal(
    fs.existsSync(path.join(result.backup_dir, "runs", "run-1", "temp", "scratch.bin")),
    false
  );

  const backups = listWorkspaceBackups(cwd);
  assert.equal(backups.length, 1);
  assert.equal(backups[0].backup_dir, result.backup_dir);
});

test("active production scan ignores completed runs and reports unfinished runs", () => {
  const cwd = temp();
  const runs = path.join(cwd, ".aurora", "runs");

  fs.mkdirSync(path.join(runs, "active"), { recursive: true });
  fs.mkdirSync(path.join(runs, "done"), { recursive: true });

  fs.writeFileSync(
    path.join(runs, "active", "state.json"),
    JSON.stringify({
      run_id: "active",
      task: "Launch film",
      status: "in_progress",
      current_stage: "build",
      updated_at: "2026-10-07T00:00:00Z"
    })
  );

  fs.writeFileSync(
    path.join(runs, "done", "state.json"),
    JSON.stringify({
      run_id: "done",
      task: "Old film",
      status: "completed",
      current_stage: "finalize",
      updated_at: "2026-10-06T00:00:00Z"
    })
  );

  const active = activeProductionRuns(cwd);
  assert.deepEqual(active.map(item => item.run_id), ["active"]);
  assert.equal(active[0].current_stage, "build");
});

test("update safety blocks active production and current development apply", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora", "runs", "active"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, ".aurora", "workspace.json"),
    JSON.stringify({ schema_version: 1 })
  );
  fs.writeFileSync(
    path.join(cwd, ".aurora", "runs", "active", "state.json"),
    JSON.stringify({
      run_id: "active",
      task: "Active film",
      status: "in_progress",
      current_stage: "render"
    })
  );

  const plan = updateSafetyPlan({
    cwd,
    targetWorkspaceSchemaVersion: 1
  });

  assert.equal(plan.safe_to_prepare, false);
  assert.equal(plan.apply_supported, false);
  assert.equal(plan.can_apply, false);
  assert.ok(plan.blockers.some(item => item.code === "active_production"));
  assert.ok(plan.blockers.some(item => item.code === "public_package_not_ready"));
  assert.ok(plan.blockers.some(item => item.code === "update_apply_not_implemented"));
});

test("update safety blocks workspace migration without a built-in path", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, ".aurora", "workspace.json"),
    JSON.stringify({ schema_version: 1 })
  );

  const plan = updateSafetyPlan({
    cwd,
    targetWorkspaceSchemaVersion: 2
  });

  assert.equal(plan.migration.needed, true);
  assert.equal(plan.migration.blocked, true);
  assert.equal(plan.safe_to_prepare, false);
  assert.ok(plan.blockers.some(item => item.code === "workspace_migration_blocked"));
});
