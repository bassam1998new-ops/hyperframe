import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  checkpoint,
  createRun,
  loadRun,
  setRunRoute
} from "../src/governance.mjs";
import { addLibraryItem } from "../src/library.mjs";
import { createBuildPlan } from "../src/build-plan.mjs";
import {
  createAssetPlan,
  validateAssetPlan,
  assetRoutingEvidence,
  addAssetPlanNeed,
  updateAssetPlanNeed,
  completeAssetPlan,
  assetPlanEditability
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


test("asset edit invalidates routing build plan and stale review", () => {
  const cwd = temp();
  const run = createRun({
    cwd,
    task: "3D product",
    mode: "direct",
    routeDecision: null
  });

  checkpoint({ cwd, runId: run.id, stage: "understand", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "concept", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "mood", status: "skipped" });

  createAssetPlan(run.id, cwd);
  const asset = addLibraryItem({
    id: "robot",
    name: "Robot",
    kind: "model",
    type: "glb",
    path: "assets/robot.glb",
    license_id: "CC0-1.0",
    commercial_allowed: true,
    redistribution_allowed: true,
    attribution_required: false,
    approved: true
  }, cwd);

  addAssetPlanNeed(run.id, {
    id: "hero-model",
    description: "Hero 3D model",
    kind: "model",
    decision: "reuse",
    selected_library_ids: [asset.id]
  }, cwd);

  completeAssetPlan(run.id, "Reuse the approved hero model.", cwd);

  setRunRoute({
    cwd,
    runId: run.id,
    routeDecision: {
      selected: { route: ["blender"], score: 9 },
      confidence: 0.9,
      candidates: [{ route: ["blender"], score: 9 }]
    }
  });

  createBuildPlan(run.id, cwd);
  const review = path.join(run.dir, "review.json");
  fs.writeFileSync(review, JSON.stringify({ decision: "PASS" }));

  const result = updateAssetPlanNeed(
    run.id,
    "hero-model",
    {
      decision: "modify",
      selected_library_ids: [asset.id]
    },
    cwd
  );

  assert.equal(result.plan.status, "pending");
  assert.equal(fs.existsSync(path.join(run.dir, "build-plan.json")), false);
  assert.equal(fs.existsSync(review), false);

  const saved = loadRun(cwd, run.id);
  assert.deepEqual(saved.plan.route, []);
  assert.equal(saved.state.current_stage, "assets");
  assert.equal(saved.state.checkpoints.assets.status, "in_progress");
  assert.equal(saved.state.checkpoints.routing, undefined);

  const historyDir = path.join(run.dir, "history");
  assert.ok(fs.readdirSync(historyDir).some(name => name.includes("asset-plan-edit")));
  assert.ok(fs.readdirSync(historyDir).some(name => name.includes("build-plan-invalidated")));
  assert.ok(fs.readdirSync(historyDir).some(name => name.includes("review-invalidated")));
});

test("asset plan rejects untracked selected library ids", () => {
  const cwd = temp();
  const run = createRun({
    cwd,
    task: "asset safety",
    mode: "direct",
    routeDecision: null
  });

  createAssetPlan(run.id, cwd);

  assert.throws(
    () => addAssetPlanNeed(run.id, {
      description: "Unknown thing",
      kind: "image",
      decision: "reuse",
      selected_library_ids: ["not-tracked"]
    }, cwd),
    /untracked library items/
  );
});

test("finalized runs cannot change asset decisions", () => {
  const cwd = temp();
  const run = createRun({
    cwd,
    task: "locked",
    mode: "direct",
    routeDecision: null
  });
  createAssetPlan(run.id, cwd);

  const stateFile = path.join(run.dir, "state.json");
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  state.checkpoints.finalize = { status: "completed" };
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

  const editable = assetPlanEditability(run.id, cwd);
  assert.equal(editable.ok, false);

  assert.throws(
    () => addAssetPlanNeed(run.id, {
      description: "Too late",
      kind: "image",
      decision: "build_new",
      required_capabilities: ["image_generation"]
    }, cwd),
    /Finalized runs/
  );
});
