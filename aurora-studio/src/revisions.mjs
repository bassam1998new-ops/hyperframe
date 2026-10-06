import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadRun } from "./governance.mjs";
import { readBuildPlan } from "./build-plan.mjs";
import { readConceptSet } from "./concepts.mjs";
import { createMood } from "./mood.mjs";
import { createAssetPlan } from "./asset-plan.mjs";

const KINDS = new Set(["fix", "rebuild", "change_direction"]);

const BUILD_RESET = [
  "build",
  "pre_render_review",
  "render",
  "post_render_review",
  "approval",
  "finalize"
];

const REBUILD_RESET = [
  "build_plan",
  ...BUILD_RESET
];

const DIRECTION_RESET = [
  "concept",
  "mood",
  "assets",
  "routing",
  "build_plan",
  ...BUILD_RESET
];

function now() {
  return new Date().toISOString();
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function historyDir(run) {
  const dir = path.join(run.dir, "history");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function historyName(run, label, extension = "json") {
  return path.join(
    historyDir(run),
    `${Date.now()}-${label}-${crypto.randomBytes(3).toString("hex")}.${extension}`
  );
}

function archiveFile(run, filename, label = filename.replace(/\.[^.]+$/, "")) {
  const source = path.join(run.dir, filename);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) return null;

  const target = historyName(run, label, path.extname(filename).slice(1) || "json");
  fs.copyFileSync(source, target);
  fs.rmSync(source, { force: true });
  return target;
}

function archiveDirectory(run, dirname, label = dirname) {
  const source = path.join(run.dir, dirname);
  if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) return null;

  const target = path.join(
    historyDir(run),
    `${Date.now()}-${label}-${crypto.randomBytes(3).toString("hex")}`
  );
  fs.renameSync(source, target);
  return target;
}

function archiveRevisionState(run) {
  const snapshot = historyName(run, "revision-state");
  writeJson(snapshot, {
    state: run.state,
    plan: run.plan,
    captured_at: now()
  });

  return {
    snapshot,
    review: archiveFile(run, "review.json", "review-revised"),
    review_frames: archiveDirectory(run, "review-frames", "review-frames-revised"),
    learning: archiveFile(run, "learning-review.json", "learning-revised"),
    final: archiveFile(run, "final.json", "final-revised")
  };
}

function resetStages(run, stages, currentStage, note) {
  run.state.checkpoints ||= {};

  for (const stage of stages) {
    delete run.state.checkpoints[stage];
    const planStage = (run.plan.stages || []).find(item => item.id === stage);
    if (planStage) planStage.status = "pending";
  }

  run.state.current_stage = currentStage;
  run.state.status = "in_progress";
  run.state.updated_at = now();

  run.state.checkpoints[currentStage] = {
    status: "in_progress",
    updated_at: now(),
    artifact: null,
    note,
    human_approved: false
  };

  const currentPlanStage = (run.plan.stages || []).find(
    item => item.id === currentStage
  );
  if (currentPlanStage) currentPlanStage.status = "in_progress";
}

function resetDirection(run, runId, cwd, note) {
  for (const file of ["mood.json", "asset-plan.json", "build-plan.json"]) {
    archiveFile(run, file, `${file.replace(".json", "")}-direction-revised`);
  }

  const concepts = readConceptSet(runId, cwd);
  if (concepts) {
    const conceptArchive = historyName(run, "concepts-direction-revised");
    writeJson(conceptArchive, concepts.concept_set);

    concepts.concept_set.status = "pending";
    concepts.concept_set.selected_id = null;
    concepts.concept_set.refinement_requests ||= [];
    concepts.concept_set.refinement_requests.push({
      id: `revision-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      concept_id: null,
      note,
      status: "open",
      created_at: now()
    });
    concepts.concept_set.updated_at = now();
    writeJson(concepts.file, concepts.concept_set);
  }

  run.plan.route = [];
  run.plan.route_score = null;
  run.plan.route_confidence = 0;
  run.plan.alternatives = [];
  delete run.plan.routed_at;

  resetStages(
    run,
    DIRECTION_RESET,
    "concept",
    "Owner requested a new creative direction after review."
  );

  createMood(runId, cwd);
  createAssetPlan(runId, cwd);
}

function validateShot(runId, shotId, cwd) {
  if (!shotId) return null;

  const record = readBuildPlan(runId, cwd);
  if (!record) throw new Error("Build plan file not found.");

  const shot = (record.plan.shots || []).find(item => item.id === shotId);
  if (!shot) throw new Error(`Shot not found: ${shotId}`);
  return shot;
}

export function revisionsPath(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  return path.join(run.dir, "revisions.jsonl");
}

export function readRevisions(runId, cwd = process.cwd()) {
  const file = revisionsPath(runId, cwd);
  if (!fs.existsSync(file)) return [];

  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return [];

  return raw.split("\n").filter(Boolean).flatMap(line => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}

export function requestRevision(runId, {
  kind = "fix",
  note,
  shotId = null
} = {}, cwd = process.cwd()) {
  if (!KINDS.has(kind)) {
    throw new Error("Revision kind must be fix, rebuild, or change_direction.");
  }

  const cleanNote = String(note || "").trim();
  if (!cleanNote) throw new Error("Revision note is required.");

  const run = loadRun(cwd, runId);

  if (
    run.state.status === "completed" ||
    run.state.checkpoints?.finalize?.status === "completed"
  ) {
    throw new Error("Finalized runs are read-only.");
  }

  if (kind === "change_direction" && run.plan.mode !== "director") {
    throw new Error("Change direction is only available in Director mode.");
  }

  const shot = validateShot(runId, shotId, cwd);
  const archived = archiveRevisionState(run);

  if (kind === "change_direction") {
    resetDirection(run, runId, cwd, cleanNote);
  } else if (kind === "rebuild") {
    resetStages(
      run,
      REBUILD_RESET,
      "build_plan",
      "Owner requested a rebuild after review."
    );
  } else {
    resetStages(
      run,
      BUILD_RESET,
      "build",
      "Owner requested a focused revision after review."
    );
  }

  writeJson(path.join(run.dir, "state.json"), run.state);
  writeJson(path.join(run.dir, "plan.json"), run.plan);

  const entry = {
    schema_version: 1,
    id: `revision-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    timestamp: now(),
    run_id: runId,
    kind,
    note: cleanNote,
    shot_id: shot?.id || null,
    shot_purpose: shot?.purpose || null,
    reopened_stage: run.state.current_stage,
    archived
  };

  fs.appendFileSync(
    revisionsPath(runId, cwd),
    JSON.stringify(entry) + "\n"
  );

  fs.appendFileSync(
    path.join(run.dir, "decisions.jsonl"),
    JSON.stringify({
      timestamp: entry.timestamp,
      type: "owner_revision_requested",
      revision_id: entry.id,
      kind,
      shot_id: entry.shot_id,
      reopened_stage: entry.reopened_stage
    }) + "\n"
  );

  return {
    revision: entry,
    state: run.state,
    plan: run.plan
  };
}
