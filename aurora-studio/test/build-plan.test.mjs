import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createRun,
  setRunRoute,
  checkpoint,
  loadRun
} from "../src/governance.mjs";
import {
  createBuildPlan,
  validateBuildPlan,
  addBuildPlanShot,
  updateBuildPlanShot,
  reorderBuildPlanShots,
  duplicateBuildPlanShot,
  removeBuildPlanShot,
  moveBuildPlanShot,
  readBuildPlan
} from "../src/build-plan.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-build-plan-"));
}

test("creates build plan after a run exists", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  const result = createBuildPlan(run.id, cwd);
  assert.equal(result.plan.status, "pending");
  assert.ok(fs.existsSync(result.file));
});

test("valid multi-engine plan allows Blender to HyperFrames handoff", () => {
  const result = validateBuildPlan({
    schema_version: 1,
    status: "completed",
    summary: "3D hero feeds programmable final composition.",
    route: ["blender", "hyperframe"],
    shots: [
      {
        id: "hero-3d",
        purpose: "Create dimensional avatar hero",
        engine: "blender",
        inputs: [],
        asset_ids: ["avatar-1"],
        output: "renders/avatar.webm",
        quality: "premium",
        handoff: {
          from: "blender",
          to: "hyperframe",
          format: "transparent_webm",
          notes: []
        }
      },
      {
        id: "final-layout",
        purpose: "Compose title and brand UI",
        engine: "hyperframe",
        inputs: ["renders/avatar.webm"],
        asset_ids: [],
        output: "renders/final.mp4",
        quality: "premium"
      }
    ]
  }, ["blender", "hyperframe"]);

  assert.equal(result.ok, true);
});

test("plan rejects engine outside selected route", () => {
  const result = validateBuildPlan({
    schema_version: 1,
    status: "completed",
    summary: "bad",
    route: ["hyperframe"],
    shots: [{
      id: "ae",
      purpose: "finish",
      engine: "after_effects",
      inputs: [],
      asset_ids: [],
      output: "x.mov",
      quality: "normal"
    }]
  }, ["hyperframe"]);

  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes("not in the selected route")));
});


function routedRun(cwd, route = ["hyperframe"]) {
  const run = createRun({
    cwd,
    task: "storyboard test",
    mode: "direct",
    routeDecision: null,
    intent: {
      quality: "premium",
      aspect: "16:9"
    }
  });

  checkpoint({ cwd, runId: run.id, stage: "understand", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "concept", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "mood", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "assets", status: "completed" });

  setRunRoute({
    cwd,
    runId: run.id,
    routeDecision: {
      selected: { route, score: 9 },
      confidence: 0.9,
      candidates: [{ route, score: 9 }]
    }
  });

  createBuildPlan(run.id, cwd);
  return run;
}

test("storyboard add uses selected route and run quality by default", () => {
  const cwd = temp();
  const run = routedRun(cwd, ["blender", "hyperframe"]);

  const result = addBuildPlanShot(run.id, {
    purpose: "3D product reveal",
    duration_seconds: 4
  }, cwd);

  assert.equal(result.plan.shots.length, 1);
  assert.equal(result.plan.shots[0].engine, "blender");
  assert.equal(result.plan.shots[0].quality, "premium");
  assert.equal(result.plan.shots[0].duration_seconds, 4);
  assert.equal(result.plan.status, "pending");

  const saved = loadRun(cwd, run.id);
  assert.equal(saved.state.current_stage, "build_plan");
  assert.equal(saved.state.checkpoints.build_plan.status, "in_progress");
});

test("storyboard edit cannot move a shot outside the selected route", () => {
  const cwd = temp();
  const run = routedRun(cwd, ["hyperframe"]);

  const added = addBuildPlanShot(run.id, {
    purpose: "Kinetic type"
  }, cwd);

  assert.throws(
    () => updateBuildPlanShot(
      run.id,
      added.shot_id,
      { engine: "after_effects" },
      cwd
    ),
    /selected production route/
  );
});

test("storyboard reorder requires every shot exactly once", () => {
  const cwd = temp();
  const run = routedRun(cwd, ["hyperframe"]);

  const a = addBuildPlanShot(run.id, { purpose: "Open" }, cwd);
  const b = addBuildPlanShot(run.id, { purpose: "Close" }, cwd);

  const before = readBuildPlan(run.id, cwd).plan.shots.map(shot => shot.id);
  assert.deepEqual(before, [a.shot_id, b.shot_id]);

  assert.throws(
    () => reorderBuildPlanShots(
      run.id,
      [a.shot_id, a.shot_id],
      cwd
    ),
    /missing or duplicate/
  );

  const reordered = reorderBuildPlanShots(
    run.id,
    [b.shot_id, a.shot_id],
    cwd
  );

  assert.deepEqual(
    reordered.plan.shots.map(shot => shot.id),
    [b.shot_id, a.shot_id]
  );
});

test("storyboard duplicate remove and keyboard move preserve safe order", () => {
  const cwd = temp();
  const run = routedRun(cwd, ["hyperframe"]);

  const a = addBuildPlanShot(run.id, { purpose: "A" }, cwd);
  const b = addBuildPlanShot(run.id, { purpose: "B" }, cwd);

  const duplicated = duplicateBuildPlanShot(run.id, a.shot_id, cwd);
  let shots = duplicated.plan.shots;
  assert.equal(shots.length, 3);
  assert.equal(shots[1].id, duplicated.shot_id);
  assert.equal(shots[1].output, "");

  const moved = moveBuildPlanShot(
    run.id,
    duplicated.shot_id,
    "down",
    cwd
  );
  assert.deepEqual(
    moved.plan.shots.map(shot => shot.id),
    [a.shot_id, b.shot_id, duplicated.shot_id]
  );

  const removed = removeBuildPlanShot(
    run.id,
    duplicated.shot_id,
    cwd
  );
  assert.deepEqual(
    removed.plan.shots.map(shot => shot.id),
    [a.shot_id, b.shot_id]
  );
});

test("storyboard edit invalidates stale downstream build review and approval state", () => {
  const cwd = temp();
  const run = routedRun(cwd, ["hyperframe"]);

  const added = addBuildPlanShot(run.id, {
    purpose: "Main shot",
    output: "renders/main.mp4"
  }, cwd);

  const record = readBuildPlan(run.id, cwd);
  record.plan.status = "completed";
  record.plan.summary = "Ready.";
  fs.writeFileSync(
    record.file,
    JSON.stringify(record.plan, null, 2) + "\n"
  );

  checkpoint({
    cwd,
    runId: run.id,
    stage: "build_plan",
    status: "completed",
    artifact: record.file
  });
  checkpoint({ cwd, runId: run.id, stage: "build", status: "completed" });
  checkpoint({
    cwd,
    runId: run.id,
    stage: "pre_render_review",
    status: "completed"
  });
  checkpoint({ cwd, runId: run.id, stage: "render", status: "completed" });
  checkpoint({
    cwd,
    runId: run.id,
    stage: "post_render_review",
    status: "completed"
  });
  checkpoint({
    cwd,
    runId: run.id,
    stage: "approval",
    status: "completed",
    humanApproved: true
  });

  fs.writeFileSync(
    path.join(run.dir, "review.json"),
    JSON.stringify({
      schema_version: 1,
      run_id: run.id,
      decision: "PASS"
    })
  );

  const result = updateBuildPlanShot(
    run.id,
    added.shot_id,
    { purpose: "Main shot revised" },
    cwd
  );

  const saved = loadRun(cwd, run.id);
  assert.equal(saved.state.current_stage, "build_plan");
  assert.equal(saved.state.status, "in_progress");
  assert.equal(saved.state.checkpoints.build_plan.status, "in_progress");
  assert.equal(saved.state.checkpoints.build, undefined);
  assert.equal(saved.state.checkpoints.render, undefined);
  assert.equal(saved.state.checkpoints.post_render_review, undefined);
  assert.equal(saved.state.checkpoints.approval, undefined);
  assert.equal(fs.existsSync(path.join(run.dir, "review.json")), false);

  const archivedReview = result.invalidation.archived_review;
  assert.ok(archivedReview);
  assert.ok(fs.existsSync(archivedReview));

  const history = JSON.parse(
    fs.readFileSync(result.invalidation.history, "utf8")
  );
  assert.equal(history.build_plan.status, "completed");
  assert.equal(history.build_plan.shots[0].purpose, "Main shot");
});
