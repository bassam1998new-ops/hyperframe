import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadRun } from "./governance.mjs";

const ENGINES = new Set(["hyperframe", "blender", "after_effects"]);
const QUALITIES = new Set(["draft", "normal", "premium", "hero"]);

export function buildPlanPath(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  return path.join(run.dir, "build-plan.json");
}

export function createBuildPlan(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  const file = path.join(run.dir, "build-plan.json");

  if (fs.existsSync(file)) {
    return {
      plan: JSON.parse(fs.readFileSync(file, "utf8")),
      file,
      created: false
    };
  }

  const now = new Date().toISOString();
  const plan = {
    schema_version: 1,
    run_id: runId,
    status: "pending",
    summary: "",
    route: run.plan.route || [],
    shots: [],
    created_at: now,
    updated_at: now
  };

  fs.writeFileSync(file, JSON.stringify(plan, null, 2) + "\n");
  return { plan, file, created: true, run };
}

export function readBuildPlan(runId, cwd = process.cwd()) {
  const file = buildPlanPath(runId, cwd);
  if (!fs.existsSync(file)) return null;
  return {
    plan: JSON.parse(fs.readFileSync(file, "utf8")),
    file
  };
}

export function validateBuildPlan(plan, allowedRoute = null) {
  const errors = [];
  const warnings = [];

  if (!plan || plan.schema_version !== 1) {
    return {
      ok: false,
      errors: ["Unsupported or missing build plan schema."],
      warnings
    };
  }

  if (!["pending", "completed"].includes(plan.status)) {
    errors.push("Build plan status must be pending or completed.");
  }

  if (!Array.isArray(plan.shots)) {
    errors.push("Build plan shots must be an array.");
    return { ok: false, errors, warnings };
  }

  if (plan.status === "completed" && !String(plan.summary || "").trim()) {
    errors.push("Completed build plan needs a short summary.");
  }

  if (plan.status === "completed" && plan.shots.length === 0) {
    errors.push("Completed build plan needs at least one shot/build unit.");
  }

  const allowed = new Set(
    Array.isArray(allowedRoute) && allowedRoute.length
      ? allowedRoute
      : Array.isArray(plan.route)
        ? plan.route
        : []
  );

  const ids = new Set();

  for (const [index, shot] of plan.shots.entries()) {
    const label = `Shot ${index + 1}`;

    if (!String(shot?.id || "").trim()) errors.push(`${label} needs an id.`);
    if (shot?.id && ids.has(shot.id)) errors.push(`Duplicate shot id: ${shot.id}`);
    if (shot?.id) ids.add(shot.id);

    if (!String(shot?.purpose || "").trim()) errors.push(`${label} needs a purpose.`);

    if (!ENGINES.has(shot?.engine)) {
      errors.push(`${label} has invalid engine: ${shot?.engine || "(missing)"}.`);
    } else if (allowed.size && !allowed.has(shot.engine)) {
      errors.push(`${label} uses ${shot.engine}, which is not in the selected route.`);
    }

    if (!QUALITIES.has(shot?.quality || "normal")) {
      errors.push(`${label} has invalid quality.`);
    }

    if (!String(shot?.output || "").trim()) {
      warnings.push(`${label} has no planned output path yet.`);
    }

    if (shot?.handoff) {
      const from = shot.handoff.from;
      const to = shot.handoff.to;
      if (from && !ENGINES.has(from)) errors.push(`${label} has invalid handoff.from.`);
      if (to && !ENGINES.has(to)) errors.push(`${label} has invalid handoff.to.`);
      if (from && from !== shot.engine) {
        errors.push(`${label} handoff.from must match the shot engine.`);
      }
      if (to && allowed.size && !allowed.has(to)) {
        errors.push(`${label} handoff target ${to} is not in the selected route.`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateBuildPlanFile(runId, cwd = process.cwd()) {
  const value = readBuildPlan(runId, cwd);
  if (!value) {
    return { ok: false, errors: ["Build plan file not found."], warnings: [] };
  }

  const run = loadRun(cwd, runId);
  return validateBuildPlan(value.plan, run.plan.route || []);
}


const EDITABLE_FIELDS = new Set([
  "purpose",
  "duration_seconds",
  "engine",
  "quality",
  "output"
]);

const INVALIDATE_STAGES = [
  "build_plan",
  "build",
  "pre_render_review",
  "render",
  "post_render_review",
  "approval",
  "finalize"
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildPlanEditability(run) {
  if (!run.plan.route?.length) {
    return {
      ok: false,
      reason: "Storyboard editing requires a selected production route."
    };
  }

  if (run.state.checkpoints?.finalize?.status === "completed") {
    return {
      ok: false,
      reason: "Finalized runs cannot be edited."
    };
  }

  return { ok: true, reason: null };
}

function uniqueShotId(plan, seed = "shot") {
  const base = String(seed || "shot")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "shot";

  const existing = new Set((plan.shots || []).map(shot => shot.id));
  if (!existing.has(base)) return base;

  let index = 2;
  while (existing.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function historyFile(run, label = "build-plan-edit") {
  const nonce = crypto.randomBytes(3).toString("hex");
  return path.join(
    run.dir,
    "history",
    `${Date.now()}-${label}-${nonce}.json`
  );
}

function archiveCurrentReview(run) {
  const reviewFile = path.join(run.dir, "review.json");
  if (!fs.existsSync(reviewFile)) return null;

  const target = historyFile(run, "review-invalidated");
  fs.copyFileSync(reviewFile, target);
  fs.rmSync(reviewFile, { force: true });
  return target;
}

function reopenAfterBuildPlanEdit(
  run,
  buildPlanFile,
  previousBuildPlan
) {
  const history = historyFile(run);
  fs.writeFileSync(history, JSON.stringify({
    state: run.state,
    plan: run.plan,
    build_plan: previousBuildPlan || null,
    captured_at: new Date().toISOString()
  }, null, 2) + "\n");

  const archivedReview = archiveCurrentReview(run);

  run.state.checkpoints ||= {};

  for (const stage of INVALIDATE_STAGES) {
    delete run.state.checkpoints[stage];
    const planStage = run.plan.stages.find(item => item.id === stage);
    if (planStage) planStage.status = "pending";
  }

  run.state.checkpoints.build_plan = {
    status: "in_progress",
    updated_at: new Date().toISOString(),
    artifact: buildPlanFile,
    note: "Storyboard changed; downstream build/review state invalidated.",
    human_approved: false
  };

  const buildPlanStage = run.plan.stages.find(
    item => item.id === "build_plan"
  );
  if (buildPlanStage) buildPlanStage.status = "in_progress";

  run.state.current_stage = "build_plan";
  run.state.status = "in_progress";
  run.state.updated_at = new Date().toISOString();

  fs.writeFileSync(
    path.join(run.dir, "state.json"),
    JSON.stringify(run.state, null, 2) + "\n"
  );
  fs.writeFileSync(
    path.join(run.dir, "plan.json"),
    JSON.stringify(run.plan, null, 2) + "\n"
  );

  return {
    history,
    archived_review: archivedReview
  };
}

function writeEditedBuildPlan(
  run,
  plan,
  cwd,
  previousBuildPlan = null
) {
  const file = buildPlanPath(run.plan.run_id || run.state.run_id, cwd);
  plan.status = "pending";
  plan.route = run.plan.route || [];
  plan.updated_at = new Date().toISOString();

  const validation = validateBuildPlan(plan, run.plan.route || []);
  if (!validation.ok) {
    throw new Error(
      "Storyboard change is invalid: " +
      validation.errors.join("; ")
    );
  }

  fs.writeFileSync(file, JSON.stringify(plan, null, 2) + "\n");
  const invalidation = reopenAfterBuildPlanEdit(
    run,
    file,
    previousBuildPlan
  );

  return {
    plan,
    file,
    validation,
    invalidation
  };
}

function editableRun(runId, cwd) {
  const run = loadRun(cwd, runId);
  const editable = buildPlanEditability(run);
  if (!editable.ok) throw new Error(editable.reason);

  const record = readBuildPlan(runId, cwd);
  if (!record) throw new Error("Build plan file not found.");

  return {
    run,
    plan: clone(record.plan),
    previous_plan: clone(record.plan),
    file: record.file
  };
}

export function addBuildPlanShot(runId, input = {}, cwd = process.cwd()) {
  const { run, plan, previous_plan } = editableRun(runId, cwd);
  const purpose = String(input.purpose || "").trim();

  if (!purpose) throw new Error("New shot needs a purpose.");

  const route = run.plan.route || [];
  const engine = input.engine || route[0];

  if (!route.includes(engine)) {
    throw new Error(
      `Shot engine must be in the selected route: ${route.join(", ")}`
    );
  }

  const quality = input.quality || run.plan.intent?.quality || "normal";
  if (!QUALITIES.has(quality)) {
    throw new Error("Shot has invalid quality.");
  }

  const duration =
    input.duration_seconds === null ||
    input.duration_seconds === undefined ||
    input.duration_seconds === ""
      ? null
      : Number(input.duration_seconds);

  if (duration !== null && (!Number.isFinite(duration) || duration < 0)) {
    throw new Error("Shot duration must be a non-negative number.");
  }

  const id = uniqueShotId(plan, input.id || purpose);

  plan.shots ||= [];
  plan.shots.push({
    id,
    purpose,
    engine,
    duration_seconds: duration,
    inputs: [],
    asset_ids: [],
    output: String(input.output || ""),
    quality,
    success_criteria: [],
    notes: [],
    handoff: null
  });

  return {
    ...writeEditedBuildPlan(run, plan, cwd, previous_plan),
    shot_id: id
  };
}

export function updateBuildPlanShot(
  runId,
  shotId,
  changes = {},
  cwd = process.cwd()
) {
  const { run, plan, previous_plan } = editableRun(runId, cwd);
  const shot = (plan.shots || []).find(item => item.id === shotId);

  if (!shot) throw new Error(`Shot not found: ${shotId}`);

  const safe = {};
  for (const [key, value] of Object.entries(changes || {})) {
    if (EDITABLE_FIELDS.has(key)) safe[key] = value;
  }

  if ("purpose" in safe) {
    const purpose = String(safe.purpose || "").trim();
    if (!purpose) throw new Error("Shot purpose cannot be empty.");
    shot.purpose = purpose;
  }

  if ("duration_seconds" in safe) {
    const duration =
      safe.duration_seconds === null ||
      safe.duration_seconds === ""
        ? null
        : Number(safe.duration_seconds);

    if (duration !== null && (!Number.isFinite(duration) || duration < 0)) {
      throw new Error("Shot duration must be a non-negative number.");
    }
    shot.duration_seconds = duration;
  }

  if ("engine" in safe) {
    const engine = String(safe.engine || "");
    if (!(run.plan.route || []).includes(engine)) {
      throw new Error(
        "Shot engine must stay inside the selected production route."
      );
    }
    shot.engine = engine;

    if (shot.handoff?.from && shot.handoff.from !== engine) {
      shot.handoff = null;
    }
  }

  if ("quality" in safe) {
    const quality = String(safe.quality || "");
    if (!QUALITIES.has(quality)) {
      throw new Error("Shot has invalid quality.");
    }
    shot.quality = quality;
  }

  if ("output" in safe) {
    shot.output = String(safe.output || "").trim();
  }

  return writeEditedBuildPlan(run, plan, cwd, previous_plan);
}

export function reorderBuildPlanShots(
  runId,
  order = [],
  cwd = process.cwd()
) {
  const { run, plan, previous_plan } = editableRun(runId, cwd);
  const current = plan.shots || [];

  if (!Array.isArray(order) || order.length !== current.length) {
    throw new Error("Storyboard order must contain every shot exactly once.");
  }

  const currentIds = new Set(current.map(shot => shot.id));
  const orderIds = new Set(order);

  if (
    orderIds.size !== order.length ||
    order.some(id => !currentIds.has(id))
  ) {
    throw new Error("Storyboard order contains missing or duplicate shot IDs.");
  }

  const byId = new Map(current.map(shot => [shot.id, shot]));
  plan.shots = order.map(id => byId.get(id));

  return writeEditedBuildPlan(run, plan, cwd, previous_plan);
}

export function duplicateBuildPlanShot(
  runId,
  shotId,
  cwd = process.cwd()
) {
  const { run, plan, previous_plan } = editableRun(runId, cwd);
  const index = (plan.shots || []).findIndex(item => item.id === shotId);

  if (index < 0) throw new Error(`Shot not found: ${shotId}`);

  const source = plan.shots[index];
  const duplicate = clone(source);

  duplicate.id = uniqueShotId(plan, `${source.id}-copy`);
  duplicate.purpose = `${source.purpose} — copy`;
  duplicate.output = "";
  duplicate.handoff = null;

  plan.shots.splice(index + 1, 0, duplicate);

  return {
    ...writeEditedBuildPlan(run, plan, cwd, previous_plan),
    shot_id: duplicate.id
  };
}

export function removeBuildPlanShot(
  runId,
  shotId,
  cwd = process.cwd()
) {
  const { run, plan, previous_plan } = editableRun(runId, cwd);
  const before = plan.shots?.length || 0;
  plan.shots = (plan.shots || []).filter(item => item.id !== shotId);

  if (plan.shots.length === before) {
    throw new Error(`Shot not found: ${shotId}`);
  }

  return writeEditedBuildPlan(run, plan, cwd, previous_plan);
}

export function moveBuildPlanShot(
  runId,
  shotId,
  direction,
  cwd = process.cwd()
) {
  const { run, plan, previous_plan } = editableRun(runId, cwd);
  const index = (plan.shots || []).findIndex(item => item.id === shotId);

  if (index < 0) throw new Error(`Shot not found: ${shotId}`);

  const target =
    direction === "up"
      ? index - 1
      : direction === "down"
        ? index + 1
        : NaN;

  if (!Number.isInteger(target)) {
    throw new Error("Shot move direction must be up or down.");
  }

  if (target < 0 || target >= plan.shots.length) {
    return {
      plan,
      file: buildPlanPath(runId, cwd),
      unchanged: true
    };
  }

  const [shot] = plan.shots.splice(index, 1);
  plan.shots.splice(target, 0, shot);

  return writeEditedBuildPlan(run, plan, cwd, previous_plan);
}
