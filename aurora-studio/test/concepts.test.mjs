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
  conceptDirectionLocked,
  createConceptSet,
  readConceptSet,
  requestConceptRefinement,
  selectConcept,
  validateConceptSet
} from "../src/concepts.mjs";
import { createMood } from "../src/mood.mjs";
import { createAssetPlan } from "../src/asset-plan.mjs";
import { createBuildPlan } from "../src/build-plan.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-concepts-"));
}

const routeDecision = {
  selected: { route: ["hyperframe"], score: 8 },
  confidence: 0.8,
  candidates: [{ route: ["hyperframe"], score: 8 }]
};

function concept(id, name) {
  return {
    id,
    name,
    core_idea: `Core idea for ${name}`,
    project_fit: "Fits the product positioning.",
    emotional_arc: "Curiosity to confidence.",
    visual_motion_grammar: ["restrained typography", "controlled camera"],
    complexity: "medium",
    cost_class: "low",
    biggest_risk: "Could feel too restrained.",
    preview: null,
    notes: []
  };
}

function readyConcepts(runId, cwd) {
  const record = createConceptSet(runId, cwd);
  record.concept_set.status = "ready";
  record.concept_set.concepts = [
    concept("a", "Direction A"),
    concept("b", "Direction B"),
    concept("c", "Direction C")
  ];
  record.concept_set.updated_at = new Date().toISOString();
  fs.writeFileSync(
    record.file,
    JSON.stringify(record.concept_set, null, 2) + "\n"
  );
  return record;
}

function directorRun(cwd) {
  const run = createRun({
    cwd,
    task: "Director concept test",
    mode: "director",
    routeDecision: null
  });
  createMood(run.id, cwd);
  createAssetPlan(run.id, cwd);
  createConceptSet(run.id, cwd);
  checkpoint({
    cwd,
    runId: run.id,
    stage: "understand",
    status: "completed"
  });
  return run;
}

test("concept template exists only for Director mode", () => {
  const cwd = temp();
  const director = createRun({
    cwd,
    task: "director",
    mode: "director",
    routeDecision: null
  });

  const created = createConceptSet(director.id, cwd);
  assert.equal(created.concept_set.status, "pending");
  assert.deepEqual(created.concept_set.concepts, []);

  const direct = createRun({
    cwd,
    task: "direct",
    mode: "direct",
    routeDecision: null
  });

  assert.throws(
    () => createConceptSet(direct.id, cwd),
    /only used in Director mode/
  );
});

test("ready concept set requires 2-3 complete concepts", () => {
  const invalid = {
    schema_version: 1,
    run_id: "r",
    status: "ready",
    selected_id: null,
    concepts: [concept("a", "Only one")],
    refinement_requests: []
  };

  const result = validateConceptSet(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes("2–3")));

  invalid.concepts.push(concept("b", "Second"));
  const valid = validateConceptSet(invalid);
  assert.equal(valid.ok, true);
});

test("owner selection completes the Director concept checkpoint", () => {
  const cwd = temp();
  const run = directorRun(cwd);
  readyConcepts(run.id, cwd);

  const selected = selectConcept(run.id, "b", cwd);

  assert.equal(selected.concept_set.status, "selected");
  assert.equal(selected.concept_set.selected_id, "b");
  assert.equal(selected.selected.name, "Direction B");
  assert.equal(selected.state.checkpoints.concept.status, "completed");
  assert.equal(selected.state.checkpoints.concept.human_approved, true);
});

test("changing direction before build resets derived planning and route", () => {
  const cwd = temp();
  const run = directorRun(cwd);
  readyConcepts(run.id, cwd);
  selectConcept(run.id, "a", cwd);

  const moodFile = path.join(run.dir, "mood.json");
  const mood = JSON.parse(fs.readFileSync(moodFile, "utf8"));
  mood.intent.one_sentence = "Old direction mood";
  fs.writeFileSync(moodFile, JSON.stringify(mood, null, 2) + "\n");

  checkpoint({ cwd, runId: run.id, stage: "mood", status: "completed" });
  const assetFile = path.join(run.dir, "asset-plan.json");
  const asset = JSON.parse(fs.readFileSync(assetFile, "utf8"));
  asset.status = "completed";
  asset.summary = "Old direction assets";
  fs.writeFileSync(assetFile, JSON.stringify(asset, null, 2) + "\n");
  checkpoint({ cwd, runId: run.id, stage: "assets", status: "completed" });
  setRunRoute({ cwd, runId: run.id, routeDecision });
  createBuildPlan(run.id, cwd);

  const selected = selectConcept(run.id, "b", cwd);
  const saved = loadRun(cwd, run.id);
  const newMood = JSON.parse(fs.readFileSync(moodFile, "utf8"));
  const newAsset = JSON.parse(fs.readFileSync(assetFile, "utf8"));

  assert.equal(selected.concept_set.selected_id, "b");
  assert.deepEqual(saved.plan.route, []);
  assert.equal(saved.plan.route_score, null);
  assert.equal(saved.plan.route_confidence, 0);
  assert.equal(saved.state.checkpoints.routing, undefined);
  assert.equal(saved.state.checkpoints.mood, undefined);
  assert.equal(saved.state.checkpoints.assets, undefined);
  assert.equal(fs.existsSync(path.join(run.dir, "build-plan.json")), false);
  assert.equal(newMood.intent.one_sentence, "");
  assert.equal(newAsset.status, "pending");
});

test("direction is locked after actual build starts", () => {
  const cwd = temp();
  const run = directorRun(cwd);
  readyConcepts(run.id, cwd);
  selectConcept(run.id, "a", cwd);

  checkpoint({ cwd, runId: run.id, stage: "mood", status: "completed" });

  const assetFile = path.join(run.dir, "asset-plan.json");
  const asset = JSON.parse(fs.readFileSync(assetFile, "utf8"));
  asset.status = "completed";
  asset.summary = "Ready";
  fs.writeFileSync(assetFile, JSON.stringify(asset, null, 2) + "\n");
  checkpoint({ cwd, runId: run.id, stage: "assets", status: "completed" });

  setRunRoute({ cwd, runId: run.id, routeDecision });
  checkpoint({ cwd, runId: run.id, stage: "build_plan", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "build", status: "in_progress" });

  const lock = conceptDirectionLocked(run.id, cwd);
  assert.equal(lock.locked, true);
  assert.equal(lock.locked_by, "build");

  assert.throws(
    () => selectConcept(run.id, "b", cwd),
    /Direction is locked/
  );
});

test("refinement request resets selection and derived planning before build", () => {
  const cwd = temp();
  const run = directorRun(cwd);
  readyConcepts(run.id, cwd);
  selectConcept(run.id, "a", cwd);

  checkpoint({ cwd, runId: run.id, stage: "mood", status: "completed" });

  const result = requestConceptRefinement(
    run.id,
    {
      conceptId: "a",
      note: "Make it more human and less technical."
    },
    cwd
  );

  assert.equal(result.concept_set.status, "pending");
  assert.equal(result.concept_set.selected_id, null);
  assert.equal(result.concept_set.refinement_requests.length, 1);
  assert.equal(
    result.concept_set.refinement_requests[0].concept_id,
    "a"
  );
  assert.equal(
    result.state.checkpoints.concept.status,
    "in_progress"
  );

  const reread = readConceptSet(run.id, cwd);
  assert.equal(reread.concept_set.refinement_requests[0].status, "open");
});
