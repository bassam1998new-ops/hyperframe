import fs from "node:fs";
import path from "node:path";
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
