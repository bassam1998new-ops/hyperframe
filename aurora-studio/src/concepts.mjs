import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  checkpoint,
  loadRun
} from "./governance.mjs";
import { createMood } from "./mood.mjs";
import { createAssetPlan } from "./asset-plan.mjs";

const STATUS = new Set(["pending", "ready", "selected"]);
const COMPLEXITY = new Set(["low", "medium", "high", "hero"]);
const COST_CLASS = new Set(["free", "low", "medium", "high", "unknown"]);

const DERIVED_STAGES = [
  "mood",
  "assets",
  "routing",
  "build_plan"
];

const BUILD_LOCK_STAGES = [
  "build",
  "pre_render_review",
  "render",
  "post_render_review",
  "approval",
  "finalize"
];

function now() {
  return new Date().toISOString();
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

export function conceptsPath(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  return path.join(run.dir, "concepts.json");
}

export function createConceptSet(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);

  if (run.plan.mode !== "director") {
    throw new Error("Concept sets are only used in Director mode.");
  }

  const file = path.join(run.dir, "concepts.json");
  if (fs.existsSync(file)) {
    return {
      concept_set: JSON.parse(fs.readFileSync(file, "utf8")),
      file,
      created: false
    };
  }

  const timestamp = now();
  const conceptSet = {
    schema_version: 1,
    run_id: runId,
    status: "pending",
    selected_id: null,
    concepts: [],
    refinement_requests: [],
    created_at: timestamp,
    updated_at: timestamp
  };

  writeJson(file, conceptSet);

  return {
    concept_set: conceptSet,
    file,
    created: true
  };
}

export function readConceptSet(runId, cwd = process.cwd()) {
  const file = conceptsPath(runId, cwd);
  if (!fs.existsSync(file)) return null;

  return {
    concept_set: JSON.parse(fs.readFileSync(file, "utf8")),
    file
  };
}

export function validateConceptSet(conceptSet) {
  const errors = [];
  const warnings = [];

  if (!conceptSet || conceptSet.schema_version !== 1) {
    return {
      ok: false,
      errors: ["Unsupported or missing concept-set schema."],
      warnings
    };
  }

  if (!STATUS.has(conceptSet.status)) {
    errors.push("Concept-set status must be pending, ready, or selected.");
  }

  if (!Array.isArray(conceptSet.concepts)) {
    errors.push("Concepts must be an array.");
    return { ok: false, errors, warnings };
  }

  if (
    ["ready", "selected"].includes(conceptSet.status) &&
    (conceptSet.concepts.length < 2 || conceptSet.concepts.length > 3)
  ) {
    errors.push("Ready Director concepts must contain 2–3 concepts.");
  }

  const ids = new Set();

  for (const [index, concept] of conceptSet.concepts.entries()) {
    const label = `Concept ${index + 1}`;

    if (!String(concept?.id || "").trim()) {
      errors.push(`${label} needs an id.`);
    } else if (ids.has(concept.id)) {
      errors.push(`Duplicate concept id: ${concept.id}`);
    } else {
      ids.add(concept.id);
    }

    for (const [field, title] of [
      ["name", "name"],
      ["core_idea", "core idea"],
      ["project_fit", "project fit"],
      ["emotional_arc", "emotional arc"],
      ["biggest_risk", "biggest risk"]
    ]) {
      if (!String(concept?.[field] || "").trim()) {
        errors.push(`${label} needs a ${title}.`);
      }
    }

    if (
      !Array.isArray(concept?.visual_motion_grammar) ||
      concept.visual_motion_grammar.length === 0
    ) {
      errors.push(`${label} needs visual_motion_grammar.`);
    }

    if (!COMPLEXITY.has(concept?.complexity)) {
      errors.push(`${label} has invalid complexity.`);
    }

    if (!COST_CLASS.has(concept?.cost_class)) {
      errors.push(`${label} has invalid cost_class.`);
    }
  }

  if (conceptSet.status === "selected") {
    if (!conceptSet.selected_id) {
      errors.push("Selected concept set needs selected_id.");
    } else if (!ids.has(conceptSet.selected_id)) {
      errors.push("selected_id does not match a concept.");
    }
  }

  if (!Array.isArray(conceptSet.refinement_requests)) {
    errors.push("refinement_requests must be an array.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

export function validateConceptSetFile(runId, cwd = process.cwd()) {
  const record = readConceptSet(runId, cwd);
  if (!record) {
    return {
      ok: false,
      errors: ["Concept-set file not found."],
      warnings: []
    };
  }

  return validateConceptSet(record.concept_set);
}

export function conceptDirectionLocked(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  const checkpointMap = run.state.checkpoints || {};

  const lockedBy = BUILD_LOCK_STAGES.find(stage => {
    const status = checkpointMap[stage]?.status;
    return Boolean(status && status !== "pending" && status !== "skipped");
  });

  return {
    locked: Boolean(lockedBy),
    locked_by: lockedBy || null
  };
}

function derivedPlanningStarted(run) {
  const checkpointMap = run.state.checkpoints || {};
  return DERIVED_STAGES.some(stage => {
    const status = checkpointMap[stage]?.status;
    return Boolean(status && status !== "pending" && status !== "skipped");
  });
}

function resetDerivedPlanning(runId, cwd, reason) {
  const run = loadRun(cwd, runId);
  const timestamp = Date.now();

  fs.mkdirSync(path.join(run.dir, "history"), { recursive: true });
  writeJson(
    path.join(run.dir, "history", `${timestamp}-concept-reset-state.json`),
    run.state
  );
  writeJson(
    path.join(run.dir, "history", `${timestamp}-concept-reset-plan.json`),
    run.plan
  );

  for (const file of ["mood.json", "asset-plan.json", "build-plan.json"]) {
    fs.rmSync(path.join(run.dir, file), { force: true });
  }

  run.state.checkpoints ||= {};
  for (const stage of DERIVED_STAGES) {
    delete run.state.checkpoints[stage];
  }

  run.state.current_stage = "concept";
  run.state.status = "in_progress";
  run.state.updated_at = now();

  for (const stage of run.plan.stages || []) {
    if (DERIVED_STAGES.includes(stage.id)) stage.status = "pending";
  }

  run.plan.route = [];
  run.plan.route_score = null;
  run.plan.route_confidence = 0;
  run.plan.alternatives = [];
  delete run.plan.routed_at;

  writeJson(path.join(run.dir, "state.json"), run.state);
  writeJson(path.join(run.dir, "plan.json"), run.plan);

  createMood(runId, cwd);
  createAssetPlan(runId, cwd);

  fs.appendFileSync(
    path.join(run.dir, "decisions.jsonl"),
    JSON.stringify({
      timestamp: now(),
      type: "concept_direction_reset",
      reason
    }) + "\n"
  );
}

export function selectConcept(runId, conceptId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  if (run.plan.mode !== "director") {
    throw new Error("Concept selection is only available in Director mode.");
  }

  const lock = conceptDirectionLocked(runId, cwd);
  if (lock.locked) {
    throw new Error(
      `Direction is locked because production already started at ${lock.locked_by}.`
    );
  }

  const record = readConceptSet(runId, cwd);
  if (!record) throw new Error("Concept-set file not found.");

  const validation = validateConceptSet(record.concept_set);
  if (!validation.ok) {
    throw new Error(
      "Concept set is invalid: " + validation.errors.join("; ")
    );
  }

  if (!["ready", "selected"].includes(record.concept_set.status)) {
    throw new Error("Concepts are not ready for owner selection.");
  }

  const concept = record.concept_set.concepts.find(
    item => item.id === conceptId
  );
  if (!concept) throw new Error(`Concept not found: ${conceptId}`);

  const previous = record.concept_set.selected_id;

  if (
    previous &&
    previous !== conceptId &&
    derivedPlanningStarted(run)
  ) {
    resetDerivedPlanning(
      runId,
      cwd,
      `Owner changed direction from ${previous} to ${conceptId}`
    );
  }

  record.concept_set.status = "selected";
  record.concept_set.selected_id = conceptId;
  record.concept_set.updated_at = now();
  writeJson(record.file, record.concept_set);

  const state = checkpoint({
    cwd,
    runId,
    stage: "concept",
    status: "completed",
    artifact: record.file,
    note: `Selected concept: ${concept.name}`,
    humanApproved: true
  });

  return {
    concept_set: record.concept_set,
    selected: concept,
    file: record.file,
    state
  };
}

export function requestConceptRefinement(runId, {
  conceptId = null,
  note
} = {}, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  if (run.plan.mode !== "director") {
    throw new Error("Concept refinement is only available in Director mode.");
  }

  const lock = conceptDirectionLocked(runId, cwd);
  if (lock.locked) {
    throw new Error(
      `Direction is locked because production already started at ${lock.locked_by}.`
    );
  }

  const cleanNote = String(note || "").trim();
  if (!cleanNote) throw new Error("Refinement note is required.");

  const record = readConceptSet(runId, cwd);
  if (!record) throw new Error("Concept-set file not found.");

  if (
    conceptId &&
    !record.concept_set.concepts.some(item => item.id === conceptId)
  ) {
    throw new Error(`Concept not found: ${conceptId}`);
  }

  if (derivedPlanningStarted(run)) {
    resetDerivedPlanning(
      runId,
      cwd,
      `Owner requested concept refinement${conceptId ? ` for ${conceptId}` : ""}`
    );
  }

  record.concept_set.status = "pending";
  record.concept_set.selected_id = null;
  record.concept_set.refinement_requests ||= [];
  record.concept_set.refinement_requests.push({
    id: `refine-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    concept_id: conceptId || null,
    note: cleanNote,
    status: "open",
    created_at: now()
  });
  record.concept_set.updated_at = now();
  writeJson(record.file, record.concept_set);

  const state = checkpoint({
    cwd,
    runId,
    stage: "concept",
    status: "in_progress",
    artifact: record.file,
    note: "Owner requested concept refinement."
  });

  return {
    concept_set: record.concept_set,
    file: record.file,
    state
  };
}
