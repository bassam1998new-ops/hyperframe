import fs from "node:fs";
import path from "node:path";

const STAGES = [
  "understand",
  "concept",
  "assets",
  "build",
  "pre_render_review",
  "render",
  "post_render_review",
  "approval",
  "finalize"
];

const STATUS = new Set(["pending", "in_progress", "completed", "failed", "awaiting_human", "skipped"]);

function auroraDir(cwd) {
  return path.join(cwd, ".aurora");
}

function runsDir(cwd) {
  return path.join(auroraDir(cwd), "runs");
}

function sanitize(value) {
  return String(value || "video")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "video";
}

export function makeRunId(taskText = "video", now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `${stamp}-${sanitize(taskText)}`;
}

export function buildPlan({ task, mode, routeDecision, budget }) {
  const stages = STAGES.map(name => ({
    id: name,
    status: "pending",
    human_approval_required:
      name === "approval" ||
      (mode === "director" && name === "concept"),
    success_criteria: criteriaFor(name)
  }));

  return {
    schema_version: 1,
    task,
    mode,
    created_at: new Date().toISOString(),
    route: routeDecision?.selected?.route || [],
    route_score: routeDecision?.selected?.score ?? null,
    route_confidence: routeDecision?.confidence ?? 0,
    alternatives: (routeDecision?.candidates || []).slice(1, 4).map(c => ({
      route: c.route,
      score: c.score
    })),
    budget: budget || { mode: "observe", cap_usd: null, approval_threshold_usd: 0.50 },
    stages
  };
}

function criteriaFor(stage) {
  switch (stage) {
    case "understand":
      return ["project context read", "reference/brief requirements captured"];
    case "concept":
      return ["creative direction fits project", "tool-agnostic mood defined"];
    case "assets":
      return ["library searched before generation", "licenses/source recorded for imported assets"];
    case "build":
      return ["selected route used", "reproducible source kept"];
    case "pre_render_review":
      return ["required assets exist", "fonts/resources resolve", "no known blocking issue"];
    case "render":
      return ["render command completed", "output artifact produced"];
    case "post_render_review":
      return ["technical validation passed", "visual/audio review passed or issues recorded"];
    case "approval":
      return ["owner approval recorded"];
    case "finalize":
      return ["final saved", "safe cleanup reviewed", "useful lesson captured"];
    default:
      return [];
  }
}

export function createRun({ cwd = process.cwd(), task, mode, routeDecision, budget }) {
  const id = makeRunId(task);
  const dir = path.join(runsDir(cwd), id);
  fs.mkdirSync(path.join(dir, "history"), { recursive: true });
  fs.mkdirSync(path.join(dir, "temp"), { recursive: true });

  const plan = buildPlan({ task, mode, routeDecision, budget });
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "state.json"), JSON.stringify({
    schema_version: 1,
    run_id: id,
    task,
    current_stage: "understand",
    status: "in_progress",
    updated_at: new Date().toISOString(),
    checkpoints: {
      understand: {
        status: "in_progress",
        updated_at: new Date().toISOString(),
        artifact: null,
        note: null
      }
    }
  }, null, 2) + "\n");

  return { id, dir, plan };
}

export function loadRun(cwd, runId) {
  const dir = path.join(runsDir(cwd), runId);
  const planPath = path.join(dir, "plan.json");
  const statePath = path.join(dir, "state.json");
  if (!fs.existsSync(planPath) || !fs.existsSync(statePath)) {
    throw new Error(`Run not found: ${runId}`);
  }
  return {
    dir,
    plan: JSON.parse(fs.readFileSync(planPath, "utf8")),
    state: JSON.parse(fs.readFileSync(statePath, "utf8"))
  };
}

export function checkpoint({ cwd = process.cwd(), runId, stage, status, artifact = null, note = null, humanApproved = false }) {
  if (!STAGES.includes(stage)) throw new Error(`Unknown stage: ${stage}`);
  if (!STATUS.has(status)) throw new Error(`Unknown status: ${status}`);

  const run = loadRun(cwd, runId);
  const stagePlan = run.plan.stages.find(s => s.id === stage);

  if (status === "completed" && stagePlan?.human_approval_required && !humanApproved) {
    throw new Error(`Approval required before completing stage: ${stage}`);
  }

  const historyPath = path.join(run.dir, "history", `${Date.now()}-${stage}.json`);
  fs.writeFileSync(historyPath, JSON.stringify(run.state, null, 2) + "\n");

  run.state.checkpoints ||= {};
  run.state.checkpoints[stage] = {
    status,
    updated_at: new Date().toISOString(),
    artifact,
    note,
    human_approved: Boolean(humanApproved)
  };
  run.state.current_stage = stage;
  run.state.status = status === "failed" ? "failed" : status === "awaiting_human" ? "awaiting_human" : "in_progress";
  if (stage === "finalize" && status === "completed") run.state.status = "completed";
  run.state.updated_at = new Date().toISOString();

  fs.writeFileSync(path.join(run.dir, "state.json"), JSON.stringify(run.state, null, 2) + "\n");
  return run.state;
}

export function evaluateSpend(policy, { estimated_usd = 0, spent_usd = 0 } = {}) {
  const mode = policy?.mode || "observe";
  const cap = policy?.cap_usd;
  const threshold = policy?.approval_threshold_usd ?? 0.50;
  const projected = Number((spent_usd + estimated_usd).toFixed(4));

  if (mode === "cap" && cap != null && projected > cap) {
    return { allowed: false, action: "block", projected_usd: projected, reason: "budget_cap" };
  }
  if (estimated_usd > threshold) {
    return { allowed: false, action: "ask_owner", projected_usd: projected, reason: "approval_threshold" };
  }
  if (mode === "warn" && cap != null && projected > cap) {
    return { allowed: true, action: "warn", projected_usd: projected, reason: "budget_warning" };
  }
  return { allowed: true, action: "continue", projected_usd: projected, reason: null };
}


export function finalizeRun({ cwd = process.cwd(), runId }) {
  const run = loadRun(cwd, runId);
  const approval = run.state.checkpoints?.approval;
  const postReview = run.state.checkpoints?.post_render_review;

  if (!approval || approval.status !== "completed" || approval.human_approved !== true) {
    throw new Error("Cannot finalize: owner approval is not recorded.");
  }

  if (!postReview || postReview.status !== "completed") {
    throw new Error("Cannot finalize: post-render review is not completed.");
  }

  const tempDir = path.join(run.dir, "temp");
  let removedTemp = false;
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    removedTemp = true;
  }

  const state = checkpoint({
    cwd,
    runId,
    stage: "finalize",
    status: "completed",
    note: "Approved run finalized; run-scoped temp cleaned."
  });

  return {
    run,
    state,
    removed_run_temp: removedTemp
  };
}
