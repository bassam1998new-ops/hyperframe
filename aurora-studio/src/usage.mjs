import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadRun, evaluateSpend } from "./governance.mjs";

const PHASES = new Set(["estimate", "actual"]);

function usageFile(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  return path.join(run.dir, "usage.jsonl");
}

function ensureUsageFile(runId, cwd = process.cwd()) {
  const file = usageFile(runId, cwd);
  if (!fs.existsSync(file)) fs.writeFileSync(file, "");
  return file;
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return [];

  return raw.split("\n").filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid usage JSONL line ${index + 1}: ${error.message}`);
    }
  });
}

export function readUsage(runId, cwd = process.cwd()) {
  return readJsonl(ensureUsageFile(runId, cwd));
}

export function recordUsage(input, cwd = process.cwd()) {
  const file = ensureUsageFile(input.run_id, cwd);
  const phase = input.phase || "actual";

  if (!PHASES.has(phase)) throw new Error("Usage phase must be estimate or actual.");
  if (!String(input.provider || "").trim()) throw new Error("Usage provider is required.");
  if (!String(input.operation || "").trim()) throw new Error("Usage operation is required.");
  if (!String(input.unit || "").trim()) throw new Error("Usage unit is required.");

  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error("Usage quantity must be a non-negative number.");
  }

  const usd = input.usd === null || input.usd === undefined || input.usd === ""
    ? null
    : Number(input.usd);

  if (usd !== null && (!Number.isFinite(usd) || usd < 0)) {
    throw new Error("Usage USD value must be a non-negative number when supplied.");
  }

  const entry = {
    schema_version: 1,
    id: input.id || crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    run_id: input.run_id,
    phase,
    provider: String(input.provider).trim(),
    operation: String(input.operation).trim(),
    model: input.model ? String(input.model).trim() : null,
    quantity,
    unit: String(input.unit).trim(),
    usd,
    output_count: input.output_count == null ? null : Number(input.output_count),
    resolution: input.resolution ? String(input.resolution).trim() : null,
    note: input.note ? String(input.note).trim() : null
  };

  if (
    entry.output_count !== null &&
    (!Number.isInteger(entry.output_count) || entry.output_count < 0)
  ) {
    throw new Error("Usage output_count must be a non-negative integer.");
  }

  fs.appendFileSync(file, JSON.stringify(entry) + "\n");
  return entry;
}

function addUnit(target, provider, unit, quantity) {
  target[provider] ||= {};
  target[provider][unit] = Number(((target[provider][unit] || 0) + quantity).toFixed(6));
}

export function summarizeUsage(runId, cwd = process.cwd()) {
  const entries = readUsage(runId, cwd);
  const actual_units = {};
  const estimated_units = {};
  let actual_usd = 0;
  let estimated_usd = 0;
  let actual_usd_entries = 0;
  let estimated_usd_entries = 0;

  for (const entry of entries) {
    const target = entry.phase === "actual" ? actual_units : estimated_units;
    addUnit(target, entry.provider, entry.unit, Number(entry.quantity || 0));

    if (entry.usd !== null && entry.usd !== undefined) {
      if (entry.phase === "actual") {
        actual_usd += Number(entry.usd);
        actual_usd_entries++;
      } else {
        estimated_usd += Number(entry.usd);
        estimated_usd_entries++;
      }
    }
  }

  return {
    run_id: runId,
    entries: entries.length,
    actual_usd: Number(actual_usd.toFixed(4)),
    estimated_usd: Number(estimated_usd.toFixed(4)),
    actual_usd_entries,
    estimated_usd_entries,
    actual_units,
    estimated_units
  };
}

export function checkPaidAction({
  run_id,
  provider,
  operation,
  quantity = 0,
  unit = "credits",
  estimated_usd = null
}, cwd = process.cwd()) {
  const run = loadRun(cwd, run_id);
  const summary = summarizeUsage(run_id, cwd);
  const policy = run.plan.budget || {
    mode: "observe",
    cap_usd: null,
    approval_threshold_usd: 1
  };

  if (estimated_usd === null || estimated_usd === undefined || estimated_usd === "") {
    return {
      allowed: true,
      action: "verify_live_cost_and_record",
      reason: "usd_estimate_not_provided",
      provider,
      operation,
      quantity: Number(quantity || 0),
      unit,
      actual_usd_so_far: summary.actual_usd,
      note: "Provider units are tracked separately. AurorA will not invent a USD conversion."
    };
  }

  const result = evaluateSpend(policy, {
    estimated_usd: Number(estimated_usd),
    spent_usd: summary.actual_usd
  });

  return {
    ...result,
    provider,
    operation,
    quantity: Number(quantity || 0),
    unit,
    estimated_usd: Number(estimated_usd),
    actual_usd_so_far: summary.actual_usd
  };
}
