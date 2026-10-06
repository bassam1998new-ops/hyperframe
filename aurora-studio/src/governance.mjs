import fs from "node:fs";
import path from "node:path";

const STAGES = [
  "understand",
  "concept",
  "mood",
  "assets",
  "routing",
  "build_plan",
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
  const stamp = now.toISOString().replace(/[-:.]/g, "");
  return `${stamp}-${sanitize(taskText)}`;
}

export function buildPlan({ task, mode, routeDecision, budget, intent = {} }) {
  const quality = ["draft", "normal", "premium", "hero"].includes(intent.quality)
    ? intent.quality
    : "normal";
  const aspect = ["project", "9:16", "16:9", "1:1"].includes(intent.aspect)
    ? intent.aspect
    : "project";
  const stages = STAGES.map(name => ({
    id: name,
    status: "pending",
    human_approval_required:
      name === "approval" ||
      (mode === "director" && name === "concept"),
    skippable:
      mode === "direct" && (name === "concept" || name === "mood"),
    success_criteria: criteriaFor(name)
  }));

  return {
    schema_version: 1,
    task,
    mode,
    intent: {
      quality,
      aspect
    },
    created_at: new Date().toISOString(),
    route: routeDecision?.selected?.route || [],
    route_score: routeDecision?.selected?.score ?? null,
    route_confidence: routeDecision?.confidence ?? 0,
    alternatives: (routeDecision?.candidates || []).slice(1, 4).map(c => ({
      route: c.route,
      score: c.score
    })),
    budget: budget || { mode: "observe", cap_usd: null, approval_threshold_usd: 1.00 },
    stages
  };
}

function criteriaFor(stage) {
  switch (stage) {
    case "understand":
      return ["project context read", "reference/brief requirements captured"];
    case "concept":
      return ["creative direction fits project", "selected concept is clear enough to execute"];
    case "mood":
      return ["tool-agnostic creative contract exists or is intentionally skipped"];
    case "assets":
      return ["library searched before generation", "licenses/source recorded for imported assets"];
    case "routing":
      return ["production route selected after context/mood/asset evidence", "unavailable tools excluded"];
    case "build_plan":
      return ["each build unit has an owning engine", "cross-engine handoffs are explicit", "outputs are planned"];
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

export function createRun({
  cwd = process.cwd(),
  task,
  mode,
  routeDecision,
  budget,
  intent = {}
}) {
  const id = makeRunId(task);
  const dir = path.join(runsDir(cwd), id);
  fs.mkdirSync(path.join(dir, "history"), { recursive: true });
  fs.mkdirSync(path.join(dir, "temp"), { recursive: true });

  const plan = buildPlan({ task, mode, routeDecision, budget, intent });
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

  if (status === "skipped" && !stagePlan?.skippable) {
    throw new Error(`Stage cannot be skipped in ${run.plan.mode} mode: ${stage}`);
  }

  if (status === "completed") {
    const stageIndex = run.plan.stages.findIndex(s => s.id === stage);
    const prior = run.plan.stages.slice(0, stageIndex);
    const incomplete = prior.filter(s => {
      const priorStatus = run.state.checkpoints?.[s.id]?.status;
      return priorStatus !== "completed" && priorStatus !== "skipped";
    });
    if (incomplete.length) {
      throw new Error(`Cannot complete ${stage}; earlier stages not complete: ${incomplete.map(s => s.id).join(", ")}`);
    }
  }

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

  const planStage = run.plan.stages.find(item => item.id === stage);
  if (planStage) planStage.status = status;

  fs.writeFileSync(path.join(run.dir, "state.json"), JSON.stringify(run.state, null, 2) + "\n");
  fs.writeFileSync(path.join(run.dir, "plan.json"), JSON.stringify(run.plan, null, 2) + "\n");
  return run.state;
}

export function evaluateSpend(policy, { estimated_usd = 0, spent_usd = 0 } = {}) {
  const mode = policy?.mode || "observe";
  const cap = policy?.cap_usd;
  const threshold = policy?.approval_threshold_usd ?? 1.00;
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


export function finalizationReadiness({ cwd = process.cwd(), runId }) {
  const run = loadRun(cwd, runId);
  const errors = [];
  const approval = run.state.checkpoints?.approval;
  const postReview = run.state.checkpoints?.post_render_review;

  if (!approval || approval.status !== "completed" || approval.human_approved !== true) {
    errors.push("owner approval is not recorded");
  }

  if (!postReview || postReview.status !== "completed") {
    errors.push("post-render review is not completed");
  }

  const finalizeIndex = run.plan.stages.findIndex(stage => stage.id === "finalize");
  const prior = finalizeIndex >= 0
    ? run.plan.stages.slice(0, finalizeIndex)
    : run.plan.stages;

  const incomplete = prior.filter(stage => {
    const status = run.state.checkpoints?.[stage.id]?.status;
    return status !== "completed" && status !== "skipped";
  });

  if (incomplete.length) {
    errors.push(
      "earlier stages not complete: " + incomplete.map(stage => stage.id).join(", ")
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    run
  };
}

export function finalizeRun({ cwd = process.cwd(), runId }) {
  const readiness = finalizationReadiness({ cwd, runId });
  const run = readiness.run;

  if (!readiness.ok) {
    throw new Error("Cannot finalize: " + readiness.errors.join("; "));
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


export function setRunRoute({ cwd = process.cwd(), runId, routeDecision }) {
  if (!routeDecision?.selected?.route?.length) {
    throw new Error("Cannot set run route without a selected production path.");
  }

  const run = loadRun(cwd, runId);

  const routingState = checkpoint({
    cwd,
    runId,
    stage: "routing",
    status: "completed",
    note: `Selected route: ${routeDecision.selected.route.join(" -> ")}`
  });

  const refreshed = loadRun(cwd, runId);
  run.plan = refreshed.plan;
  run.plan.route = routeDecision.selected.route;
  run.plan.route_score = routeDecision.selected.score ?? null;
  run.plan.route_confidence = routeDecision.confidence ?? 0;
  run.plan.alternatives = (routeDecision.candidates || []).slice(1, 4).map(candidate => ({
    route: candidate.route,
    score: candidate.score
  }));
  run.plan.routed_at = new Date().toISOString();

  fs.writeFileSync(path.join(run.dir, "plan.json"), JSON.stringify(run.plan, null, 2) + "\n");

  return {
    plan: run.plan,
    state: routingState
  };
}
