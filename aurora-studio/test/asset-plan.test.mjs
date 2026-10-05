import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRun } from "../src/governance.mjs";
import {
  createAssetPlan,
  validateAssetPlan,
  assetRoutingEvidence
} from "../src/asset-plan.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-asset-plan-"));
}

test("creates pending asset plan inside run", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "director", routeDecision: null });
  const result = createAssetPlan(run.id, cwd);
  assert.equal(result.plan.status, "pending");
  assert.ok(fs.existsSync(result.file));
});

test("reuse requires a selected library asset", () => {
  const result = validateAssetPlan({
    schema_version: 1,
    status: "completed",
    summary: "Reuse avatar",
    needs: [{
      id: "avatar",
      description: "business avatar",
      kind: "model",
      decision: "reuse",
      selected_library_ids: [],
      required_capabilities: []
    }]
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes("selected_library_ids")));
});

test("build-new 3D asset becomes routing evidence", () => {
  const evidence = assetRoutingEvidence({
    needs: [{
      id: "avatar",
      description: "premium rigged 3D avatar",
      kind: "model",
      decision: "build_new",
      selected_library_ids: [],
      required_capabilities: ["true_3d", "rigging"]
    }]
  });

  assert.equal(evidence.requirement_overrides.true3d, true);
  assert.match(evidence.text, /rigging/);
});

test("completed empty plan is valid for no-asset work", () => {
  const result = validateAssetPlan({
    schema_version: 1,
    status: "completed",
    summary: "No external assets needed; typography-only build.",
    needs: []
  });

  assert.equal(result.ok, true);
  assert.ok(result.warnings.length > 0);
});
