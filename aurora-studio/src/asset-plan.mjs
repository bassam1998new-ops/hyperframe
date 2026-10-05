import fs from "node:fs";
import path from "node:path";
import { loadRun } from "./governance.mjs";

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
