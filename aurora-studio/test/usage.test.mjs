import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRun } from "../src/governance.mjs";
import {
  recordUsage,
  summarizeUsage,
  checkPaidAction
} from "../src/usage.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-usage-"));
}

test("provider credits stay separate by provider", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });

  recordUsage({
    run_id: run.id,
    phase: "actual",
    provider: "google_flow",
    operation: "video_generation",
    quantity: 6,
    unit: "credits"
  }, cwd);

  recordUsage({
    run_id: run.id,
    phase: "actual",
    provider: "elevenlabs",
    operation: "text_to_speech",
    quantity: 1250,
    unit: "credits"
  }, cwd);

  const summary = summarizeUsage(run.id, cwd);
  assert.equal(summary.actual_units.google_flow.credits, 6);
  assert.equal(summary.actual_units.elevenlabs.credits, 1250);
});

test("known USD actual spend feeds the run budget check", () => {
  const cwd = temp();
  const run = createRun({
    cwd,
    task: "test",
    mode: "direct",
    routeDecision: null,
    budget: {
      mode: "cap",
      cap_usd: 1,
      approval_threshold_usd: 10
    }
  });

  recordUsage({
    run_id: run.id,
    phase: "actual",
    provider: "provider_a",
    operation: "generate",
    quantity: 1,
    unit: "request",
    usd: 0.8
  }, cwd);

  const check = checkPaidAction({
    run_id: run.id,
    provider: "provider_a",
    operation: "generate",
    quantity: 1,
    unit: "request",
    estimated_usd: 0.3
  }, cwd);

  assert.equal(check.allowed, false);
  assert.equal(check.reason, "budget_cap");
  assert.equal(check.actual_usd_so_far, 0.8);
});

test("missing USD estimate never invents a conversion", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });

  const check = checkPaidAction({
    run_id: run.id,
    provider: "google_flow",
    operation: "video_generation",
    quantity: 6,
    unit: "credits"
  }, cwd);

  assert.equal(check.allowed, true);
  assert.equal(check.action, "verify_live_cost_and_record");
  assert.equal(check.reason, "usd_estimate_not_provided");
});


test("summary keeps estimates separate from actuals", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });

  recordUsage({
    run_id: run.id,
    phase: "estimate",
    provider: "google_flow",
    operation: "video_generation",
    quantity: 6,
    unit: "credits",
    usd: 0.25
  }, cwd);

  recordUsage({
    run_id: run.id,
    phase: "actual",
    provider: "google_flow",
    operation: "video_generation",
    quantity: 5,
    unit: "credits",
    usd: 0.2
  }, cwd);

  const summary = summarizeUsage(run.id, cwd);
  assert.equal(summary.estimated_units.google_flow.credits, 6);
  assert.equal(summary.actual_units.google_flow.credits, 5);
  assert.equal(summary.estimated_usd, 0.25);
  assert.equal(summary.actual_usd, 0.2);
});
