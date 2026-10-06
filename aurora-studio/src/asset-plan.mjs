import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { checkpoint, loadRun } from "./governance.mjs";
import { readLibrary } from "./library.mjs";

const DECISIONS = new Set(["reuse", "modify", "build_new", "not_needed"]);

export function assetPlanPath(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  return path.join(run.dir, "asset-plan.json");
}

export function createAssetPlan(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  const file = path.join(run.dir, "asset-plan.json");

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
    needs: [],
    created_at: now,
    updated_at: now
  };

  fs.writeFileSync(file, JSON.stringify(plan, null, 2) + "\n");
  return { plan, file, created: true, run };
}

export function readAssetPlan(runId, cwd = process.cwd()) {
  const file = assetPlanPath(runId, cwd);
  if (!fs.existsSync(file)) return null;
  return {
    plan: JSON.parse(fs.readFileSync(file, "utf8")),
    file
  };
}

export function validateAssetPlan(plan) {
  const errors = [];
  const warnings = [];

  if (!plan || plan.schema_version !== 1) {
    return {
      ok: false,
      errors: ["Unsupported or missing asset plan schema."],
      warnings
    };
  }

  if (!["pending", "completed"].includes(plan.status)) {
    errors.push("Asset plan status must be pending or completed.");
  }

  if (!Array.isArray(plan.needs)) {
    errors.push("Asset plan needs must be an array.");
    return { ok: false, errors, warnings };
  }

  if (plan.status === "completed" && !String(plan.summary || "").trim()) {
    errors.push("Completed asset plan needs a short summary.");
  }

  const ids = new Set();

  for (const [index, need] of plan.needs.entries()) {
    const label = `Asset need ${index + 1}`;

    if (!need?.id || !String(need.id).trim()) errors.push(`${label} needs an id.`);
    if (need?.id && ids.has(need.id)) errors.push(`Duplicate asset need id: ${need.id}`);
    if (need?.id) ids.add(need.id);

    if (!String(need?.description || "").trim()) {
      errors.push(`${label} needs a description.`);
    }

    if (!DECISIONS.has(need?.decision)) {
      errors.push(`${label} has invalid decision.`);
    }

    const selected = Array.isArray(need?.selected_library_ids)
      ? need.selected_library_ids.filter(Boolean)
      : [];

    if (["reuse", "modify"].includes(need?.decision) && selected.length === 0) {
      errors.push(`${label} decision ${need.decision} requires selected_library_ids.`);
    }

    if (
      need?.decision === "build_new" &&
      (!Array.isArray(need.required_capabilities) || need.required_capabilities.length === 0)
    ) {
      warnings.push(`${label} is BUILD_NEW but has no required_capabilities; routing may be less accurate.`);
    }
  }

  if (plan.status === "completed" && plan.needs.length === 0) {
    warnings.push("Asset plan has no needs. This is valid for work that needs no external/reusable assets.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateAssetPlanFile(runId, cwd = process.cwd()) {
  const value = readAssetPlan(runId, cwd);
  if (!value) {
    return { ok: false, errors: ["Asset plan file not found."], warnings: [] };
  }
  return validateAssetPlan(value.plan);
}

export function assetRoutingEvidence(plan) {
  if (!plan) {
    return {
      text: "",
      requirement_overrides: {}
    };
  }

  const terms = [];
  let true3d = false;
  let compositing = false;

  for (const need of plan.needs || []) {
    terms.push(
      need.description,
      need.kind,
      need.decision,
      ...(need.required_capabilities || [])
    );

    const capabilities = (need.required_capabilities || [])
      .map(value => String(value).toLowerCase());

    const kind = String(need.kind || "").toLowerCase();
    const activeBuild = ["modify", "build_new"].includes(need.decision);

    if (
      capabilities.some(value =>
        /(true[_ -]?3d|model|rig|rigging|3d animation|physics|geometry|blender)/.test(value)
      ) ||
      (activeBuild && ["model", "rig", "animation", "material", "hdri"].includes(kind))
    ) {
      true3d = true;
    }

    if (
      capabilities.some(value =>
        /(composit|roto|tracking|vfx|screen replacement|after effects)/.test(value)
      )
    ) {
      compositing = true;
    }
  }

  return {
    text: terms.filter(Boolean).join(" "),
    requirement_overrides: {
      ...(true3d ? { true3d: true } : {}),
      ...(compositing ? { compositing: true } : {})
    }
  };
}


const EDITABLE_NEED_FIELDS = new Set([
  "description",
  "kind",
  "decision",
  "selected_library_ids",
  "required_capabilities",
  "search_queries",
  "notes",
  "confidence"
]);

const INVALIDATE_AFTER_ASSETS = [
  "routing",
  "build_plan",
  "build",
  "pre_render_review",
  "render",
  "post_render_review",
  "approval",
  "finalize"
];

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function safeNeedId(plan, seed = "asset") {
  const base = String(seed || "asset")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "asset";

  const existing = new Set((plan.needs || []).map(item => item.id));
  if (!existing.has(base)) return base;

  let index = 2;
  while (existing.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function historyFile(run, label) {
  const dir = path.join(run.dir, "history");
  fs.mkdirSync(dir, { recursive: true });

  return path.join(
    dir,
    `${Date.now()}-${label}-${crypto.randomBytes(3).toString("hex")}.json`
  );
}

function archiveAndRemove(run, filename, label) {
  const source = path.join(run.dir, filename);
  if (!fs.existsSync(source)) return null;

  const target = historyFile(run, label);
  fs.copyFileSync(source, target);
  fs.rmSync(source, { force: true });
  return target;
}

export function assetPlanEditability(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);

  if (run.state.checkpoints?.finalize?.status === "completed") {
    return {
      ok: false,
      reason: "Finalized runs cannot change asset decisions."
    };
  }

  return { ok: true, reason: null };
}

function validateSelectedLibraryIds(plan, cwd) {
  const known = new Set(readLibrary(cwd).map(item => item.id));
  const missing = [];

  for (const need of plan.needs || []) {
    for (const id of need.selected_library_ids || []) {
      if (!known.has(id)) missing.push(id);
    }
  }

  if (missing.length) {
    throw new Error(
      "Asset plan references untracked library items: " +
      [...new Set(missing)].join(", ")
    );
  }
}

function reopenAfterAssetPlanEdit(
  run,
  assetPlanFile,
  previousAssetPlan
) {
  const history = historyFile(run, "asset-plan-edit");
  fs.writeFileSync(history, JSON.stringify({
    state: run.state,
    plan: run.plan,
    asset_plan: previousAssetPlan || null,
    captured_at: new Date().toISOString()
  }, null, 2) + "\n");

  const archivedBuildPlan = archiveAndRemove(
    run,
    "build-plan.json",
    "build-plan-invalidated"
  );
  const archivedReview = archiveAndRemove(
    run,
    "review.json",
    "review-invalidated"
  );

  run.state.checkpoints ||= {};

  for (const stage of INVALIDATE_AFTER_ASSETS) {
    delete run.state.checkpoints[stage];
    const planStage = run.plan.stages.find(item => item.id === stage);
    if (planStage) planStage.status = "pending";
  }

  run.plan.route = [];
  run.plan.route_score = null;
  run.plan.route_confidence = 0;
  run.plan.alternatives = [];
  delete run.plan.routed_at;

  run.state.checkpoints.assets = {
    status: "in_progress",
    updated_at: new Date().toISOString(),
    artifact: assetPlanFile,
    note: "Asset decisions changed; routing and downstream work invalidated.",
    human_approved: false
  };

  const assetsStage = run.plan.stages.find(item => item.id === "assets");
  if (assetsStage) assetsStage.status = "in_progress";

  run.state.current_stage = "assets";
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
    archived_build_plan: archivedBuildPlan,
    archived_review: archivedReview
  };
}

function editableAssetPlan(runId, cwd) {
  const editable = assetPlanEditability(runId, cwd);
  if (!editable.ok) throw new Error(editable.reason);

  const run = loadRun(cwd, runId);
  const record = readAssetPlan(runId, cwd);
  if (!record) throw new Error("Asset plan file not found.");

  return {
    run,
    plan: clone(record.plan),
    previous_plan: clone(record.plan),
    file: record.file
  };
}

function writeEditedAssetPlan(
  run,
  plan,
  cwd,
  previousAssetPlan
) {
  plan.status = "pending";
  plan.updated_at = new Date().toISOString();

  validateSelectedLibraryIds(plan, cwd);

  const validation = validateAssetPlan(plan);
  if (!validation.ok) {
    throw new Error(
      "Asset-plan change is invalid: " +
      validation.errors.join("; ")
    );
  }

  const file = assetPlanPath(run.plan.run_id || run.state.run_id, cwd);
  fs.writeFileSync(file, JSON.stringify(plan, null, 2) + "\n");

  const invalidation = reopenAfterAssetPlanEdit(
    run,
    file,
    previousAssetPlan
  );

  return {
    plan,
    file,
    validation,
    invalidation
  };
}

export function addAssetPlanNeed(
  runId,
  input = {},
  cwd = process.cwd()
) {
  const { run, plan, previous_plan } = editableAssetPlan(runId, cwd);
  const description = String(input.description || "").trim();
  if (!description) throw new Error("Asset need requires a description.");

  const kind = String(input.kind || "other");
  const decision = String(input.decision || "build_new");

  plan.needs ||= [];
  const id = safeNeedId(plan, input.id || description);

  plan.needs.push({
    id,
    description,
    kind,
    decision,
    selected_library_ids: Array.isArray(input.selected_library_ids)
      ? [...new Set(input.selected_library_ids.map(String).filter(Boolean))]
      : [],
    required_capabilities: Array.isArray(input.required_capabilities)
      ? [...new Set(input.required_capabilities.map(String).filter(Boolean))]
      : [],
    search_queries: Array.isArray(input.search_queries)
      ? [...new Set(input.search_queries.map(String).filter(Boolean))]
      : [],
    notes: Array.isArray(input.notes)
      ? input.notes.map(String).filter(Boolean)
      : [],
    confidence:
      input.confidence === null || input.confidence === undefined
        ? null
        : Number(input.confidence)
  });

  return {
    ...writeEditedAssetPlan(run, plan, cwd, previous_plan),
    need_id: id
  };
}

export function updateAssetPlanNeed(
  runId,
  needId,
  changes = {},
  cwd = process.cwd()
) {
  const { run, plan, previous_plan } = editableAssetPlan(runId, cwd);
  const need = (plan.needs || []).find(item => item.id === needId);

  if (!need) throw new Error(`Asset need not found: ${needId}`);

  const safe = {};
  for (const [key, value] of Object.entries(changes || {})) {
    if (EDITABLE_NEED_FIELDS.has(key)) safe[key] = value;
  }

  if ("description" in safe) {
    const description = String(safe.description || "").trim();
    if (!description) throw new Error("Asset need description cannot be empty.");
    need.description = description;
  }

  if ("kind" in safe) need.kind = String(safe.kind || "other");

  if ("decision" in safe) {
    const decision = String(safe.decision || "");
    if (!DECISIONS.has(decision)) {
      throw new Error("Asset need has invalid decision.");
    }
    need.decision = decision;

    if (!["reuse", "modify"].includes(decision)) {
      need.selected_library_ids = [];
    }
  }

  if ("selected_library_ids" in safe) {
    need.selected_library_ids = Array.isArray(safe.selected_library_ids)
      ? [...new Set(safe.selected_library_ids.map(String).filter(Boolean))]
      : [];
  }

  for (const field of [
    "required_capabilities",
    "search_queries",
    "notes"
  ]) {
    if (!(field in safe)) continue;
    need[field] = Array.isArray(safe[field])
      ? [...new Set(safe[field].map(String).filter(Boolean))]
      : [];
  }

  if ("confidence" in safe) {
    const confidence =
      safe.confidence === null || safe.confidence === ""
        ? null
        : Number(safe.confidence);

    if (
      confidence !== null &&
      (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)
    ) {
      throw new Error("Asset need confidence must be between 0 and 1.");
    }

    need.confidence = confidence;
  }

  return writeEditedAssetPlan(run, plan, cwd, previous_plan);
}

export function removeAssetPlanNeed(
  runId,
  needId,
  cwd = process.cwd()
) {
  const { run, plan, previous_plan } = editableAssetPlan(runId, cwd);
  const before = plan.needs?.length || 0;

  plan.needs = (plan.needs || []).filter(item => item.id !== needId);

  if (plan.needs.length === before) {
    throw new Error(`Asset need not found: ${needId}`);
  }

  return writeEditedAssetPlan(run, plan, cwd, previous_plan);
}

export function completeAssetPlan(
  runId,
  summary,
  cwd = process.cwd()
) {
  const editable = assetPlanEditability(runId, cwd);
  if (!editable.ok) throw new Error(editable.reason);

  const record = readAssetPlan(runId, cwd);
  if (!record) throw new Error("Asset plan file not found.");

  const plan = clone(record.plan);
  plan.status = "completed";
  plan.summary = String(summary || "").trim();
  plan.updated_at = new Date().toISOString();

  validateSelectedLibraryIds(plan, cwd);

  const validation = validateAssetPlan(plan);
  if (!validation.ok) {
    throw new Error(
      "Asset plan is not ready: " +
      validation.errors.join("; ")
    );
  }

  fs.writeFileSync(
    record.file,
    JSON.stringify(plan, null, 2) + "\n"
  );

  const state = checkpoint({
    cwd,
    runId,
    stage: "assets",
    status: "completed",
    artifact: record.file,
    note: "Asset decisions confirmed."
  });

  return {
    plan,
    file: record.file,
    validation,
    state
  };
}
