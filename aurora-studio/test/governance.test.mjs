import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildPlan,
  evaluateSpend,
  createRun,
  checkpoint,
  finalizeRun,
  makeRunId
} from "../src/governance.mjs";

const routeDecision = {
  selected: { route: ["hyperframe"], score: 8 },
  confidence: 0.8,
  candidates: []
};

test("director mode gates concept and final approval", () => {
  const plan = buildPlan({ task: "test", mode: "director", routeDecision });
  const gated = plan.stages.filter(s => s.human_approval_required).map(s => s.id);
  assert.deepEqual(gated, ["concept", "approval"]);
});

test("direct mode only requires final approval", () => {
  const plan = buildPlan({ task: "test", mode: "direct", routeDecision });
  const gated = plan.stages.filter(s => s.human_approval_required).map(s => s.id);
  assert.deepEqual(gated, ["approval"]);
});

test("budget cap blocks projected overspend", () => {
  const result = evaluateSpend(
    { mode: "cap", cap_usd: 5, approval_threshold_usd: 10 },
    { estimated_usd: 2, spent_usd: 4 }
  );
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "budget_cap");
});

test("run ids keep millisecond precision", () => {
  const a = makeRunId("same", new Date("2026-10-05T12:00:00.001Z"));
  const b = makeRunId("same", new Date("2026-10-05T12:00:00.002Z"));
  assert.notEqual(a, b);
});

test("agent cannot jump ahead and complete a later stage", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "aurora-stage-"));
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision });
  assert.throws(
    () => checkpoint({ cwd, runId: run.id, stage: "render", status: "completed" }),
    /earlier stages not complete/
  );
});

test("finalize requires review and owner approval", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "aurora-final-"));
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision });
  assert.throws(
    () => finalizeRun({ cwd, runId: run.id }),
    /owner approval is not recorded/
  );
});
