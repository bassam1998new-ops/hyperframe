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
import {
  createBuildPlan
} from "../src/build-plan.mjs";
import {
  createConceptSet,
  readConceptSet,
  selectConcept
} from "../src/concepts.mjs";
import {
  readRevisions,
  requestRevision
} from "../src/revisions.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-revision-"));
}

const routeDecision = {
  selected: { route: ["hyperframe"], score: 8 },
  confidence: 0.8,
  candidates: [{ route: ["hyperframe"], score: 8 }]
};

function writeBuildPlan(run, cwd) {
  const record = createBuildPlan(run.id, cwd);
  record.plan.status = "completed";
  record.plan.summary = "One-shot test plan.";
  record.plan.route = ["hyperframe"];
  record.plan.shots = [{
    id: "main-shot",
    purpose: "Build the hero shot",
    engine: "hyperframe",
    inputs: [],
    asset_ids: [],
    output: "renders/test.mp4",
    quality: "normal"
  }];
  fs.writeFileSync(record.file, JSON.stringify(record.plan, null, 2));
  return record;
}

function writeStaleReviewAndLearning(run) {
  fs.writeFileSync(
    path.join(run.dir, "review.json"),
    JSON.stringify({
      schema_version: 1,
      run_id: run.id,
      decision: "PASS"
    })
  );
  fs.mkdirSync(path.join(run.dir, "review-frames"), { recursive: true });
  fs.writeFileSync(
    path.join(run.dir, "review-frames", "frame-01.jpg"),
    "frame"
  );
  fs.writeFileSync(
    path.join(run.dir, "learning-review.json"),
    JSON.stringify({
      schema_version: 1,
      run_id: run.id,
      status: "completed"
    })
  );
}

function directRunAtReview(cwd) {
  const run = createRun({
    cwd,
    task: "revision test",
    mode: "direct",
    routeDecision: null
  });

  checkpoint({ cwd, runId: run.id, stage: "understand", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "concept", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "mood", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "assets", status: "completed" });
  setRunRoute({ cwd, runId: run.id, routeDecision });
  const buildPlan = writeBuildPlan(run, cwd);
  checkpoint({
    cwd,
    runId: run.id,
    stage: "build_plan",
    status: "completed",
    artifact: buildPlan.file
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

  writeStaleReviewAndLearning(run);
  return run;
}

function concept(id, name) {
  return {
    id,
    name,
    core_idea: name + " idea",
    project_fit: "Fits the product.",
    emotional_arc: "Quiet to confident.",
    visual_motion_grammar: ["restrained motion"],
    complexity: "medium",
    cost_class: "low",
    biggest_risk: "Overcomplication"
  };
}

function directorRunAtReview(cwd) {
  const run = createRun({
    cwd,
    task: "director revision test",
    mode: "director",
    routeDecision: null
  });

  checkpoint({ cwd, runId: run.id, stage: "understand", status: "completed" });

  const concepts = createConceptSet(run.id, cwd);
  concepts.concept_set.status = "ready";
  concepts.concept_set.concepts = [
    concept("quiet-reveal", "Quiet Reveal"),
    concept("bold-grid", "Bold Grid")
  ];
  fs.writeFileSync(
    concepts.file,
    JSON.stringify(concepts.concept_set, null, 2)
  );

  selectConcept(run.id, "quiet-reveal", cwd);
  checkpoint({ cwd, runId: run.id, stage: "mood", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "assets", status: "completed" });
  setRunRoute({ cwd, runId: run.id, routeDecision });

  const buildPlan = writeBuildPlan(run, cwd);
  checkpoint({
    cwd,
    runId: run.id,
    stage: "build_plan",
    status: "completed",
    artifact: buildPlan.file
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

  writeStaleReviewAndLearning(run);
  fs.writeFileSync(path.join(run.dir, "mood.json"), "{}");
  fs.writeFileSync(path.join(run.dir, "asset-plan.json"), "{}");

  return run;
}

test("focused revision reopens Build and archives stale review/learning", () => {
  const cwd = temp();
  const run = directRunAtReview(cwd);

  const result = requestRevision(run.id, {
    kind: "fix",
    note: "Tighten caption timing.",
    shotId: "main-shot"
  }, cwd);

  assert.equal(result.revision.kind, "fix");
  assert.equal(result.revision.shot_id, "main-shot");
  assert.equal(result.state.current_stage, "build");
  assert.equal(result.state.checkpoints.build.status, "in_progress");
  assert.equal(result.state.checkpoints.build_plan.status, "completed");
  assert.equal(result.state.checkpoints.render, undefined);
  assert.equal(fs.existsSync(path.join(run.dir, "review.json")), false);
  assert.equal(fs.existsSync(path.join(run.dir, "learning-review.json")), false);

  const history = fs.readdirSync(path.join(run.dir, "history"));
  assert.ok(history.some(name => name.includes("review-revised")));
  assert.ok(history.some(name => name.includes("learning-revised")));
  assert.equal(readRevisions(run.id, cwd).length, 1);
});

test("rebuild revision reopens Build Plan but preserves the plan file", () => {
  const cwd = temp();
  const run = directRunAtReview(cwd);

  const result = requestRevision(run.id, {
    kind: "rebuild",
    note: "The whole timing approach needs rebuilding."
  }, cwd);

  assert.equal(result.state.current_stage, "build_plan");
  assert.equal(result.state.checkpoints.build_plan.status, "in_progress");
  assert.ok(fs.existsSync(path.join(run.dir, "build-plan.json")));
  assert.equal(result.state.checkpoints.build, undefined);
});

test("change-direction revision reopens Director concepts and clears derived route/files", () => {
  const cwd = temp();
  const run = directorRunAtReview(cwd);

  const result = requestRevision(run.id, {
    kind: "change_direction",
    note: "Try a calmer premium direction."
  }, cwd);

  assert.equal(result.state.current_stage, "concept");
  assert.equal(result.plan.route.length, 0);
  assert.equal(result.state.checkpoints.concept.status, "in_progress");
  assert.equal(result.state.checkpoints.mood, undefined);
  assert.equal(result.state.checkpoints.assets, undefined);
  assert.equal(result.state.checkpoints.routing, undefined);
  assert.equal(fs.existsSync(path.join(run.dir, "mood.json")), true);
  assert.equal(fs.existsSync(path.join(run.dir, "asset-plan.json")), true);
  assert.equal(fs.existsSync(path.join(run.dir, "build-plan.json")), false);

  const freshMood = JSON.parse(
    fs.readFileSync(path.join(run.dir, "mood.json"), "utf8")
  );
  const freshAssets = JSON.parse(
    fs.readFileSync(path.join(run.dir, "asset-plan.json"), "utf8")
  );
  assert.equal(freshMood.tool_agnostic, true);
  assert.equal(freshMood.intent.one_sentence, "");
  assert.equal(freshAssets.status, "pending");

  const concepts = readConceptSet(run.id, cwd).concept_set;
  assert.equal(concepts.status, "pending");
  assert.equal(concepts.selected_id, null);
  assert.equal(concepts.refinement_requests.at(-1).note, "Try a calmer premium direction.");
});

test("finalized runs are read-only for revision requests", () => {
  const cwd = temp();
  const run = directRunAtReview(cwd);

  const loaded = loadRun(cwd, run.id);
  loaded.state.status = "completed";
  loaded.state.checkpoints.finalize = {
    status: "completed",
    updated_at: new Date().toISOString(),
    artifact: null,
    note: null,
    human_approved: false
  };
  fs.writeFileSync(
    path.join(run.dir, "state.json"),
    JSON.stringify(loaded.state, null, 2)
  );

  assert.throws(
    () => requestRevision(run.id, {
      kind: "fix",
      note: "Should fail."
    }, cwd),
    /Finalized runs are read-only/
  );
});
