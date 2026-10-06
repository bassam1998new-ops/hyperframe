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
  finalizationReadiness,
  makeRunId,
  setRunRoute,
  loadRun
} from "../src/governance.mjs";

const routeDecision = {
  selected: { route: ["hyperframe"], score: 8 },
  confidence: 0.8,
  candidates: [
    { route: ["hyperframe"], score: 8 },
    { route: ["blender", "hyperframe"], score: 6 }
  ]
};

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-governance-"));
}

test("director mode gates concept and final approval", () => {
  const plan = buildPlan({ task: "test", mode: "director", routeDecision: null });
  const gated = plan.stages.filter(s => s.human_approval_required).map(s => s.id);
  assert.deepEqual(gated, ["concept", "approval"]);
  assert.equal(plan.stages.find(s => s.id === "concept").skippable, false);
  assert.equal(plan.stages.find(s => s.id === "mood").skippable, false);
});

test("direct mode may skip concept and mood only", () => {
  const plan = buildPlan({ task: "test", mode: "direct", routeDecision: null });
  const gated = plan.stages.filter(s => s.human_approval_required).map(s => s.id);
  assert.deepEqual(gated, ["approval"]);
  assert.equal(plan.stages.find(s => s.id === "concept").skippable, true);
  assert.equal(plan.stages.find(s => s.id === "mood").skippable, true);
  assert.equal(plan.stages.find(s => s.id === "assets").skippable, false);
});

test("new run can start without a preselected route", () => {
  const plan = buildPlan({ task: "test", mode: "director", routeDecision: null });
  assert.deepEqual(plan.route, []);
  assert.equal(plan.route_score, null);
  assert.equal(plan.route_confidence, 0);
  assert.ok(plan.stages.some(s => s.id === "routing"));
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
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  assert.throws(
    () => checkpoint({ cwd, runId: run.id, stage: "render", status: "completed" }),
    /earlier stages not complete/
  );
});

test("director cannot skip concept or mood", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "director", routeDecision: null });
  checkpoint({ cwd, runId: run.id, stage: "understand", status: "completed" });
  assert.throws(
    () => checkpoint({ cwd, runId: run.id, stage: "concept", status: "skipped" }),
    /cannot be skipped/
  );
});

test("direct can skip concept and mood then route after assets", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });

  checkpoint({ cwd, runId: run.id, stage: "understand", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "concept", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "mood", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "assets", status: "completed" });

  const routed = setRunRoute({ cwd, runId: run.id, routeDecision });
  assert.deepEqual(routed.plan.route, ["hyperframe"]);
  assert.equal(routed.state.checkpoints.routing.status, "completed");

  const saved = loadRun(cwd, run.id);
  assert.equal(saved.plan.stages.find(s => s.id === "routing").status, "completed");
});

test("finalize requires review and owner approval", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  assert.throws(
    () => finalizeRun({ cwd, runId: run.id }),
    /owner approval is not recorded/
  );
});


test("agent cannot complete build before build_plan stage", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });

  checkpoint({ cwd, runId: run.id, stage: "understand", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "concept", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "mood", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "assets", status: "completed" });
  setRunRoute({ cwd, runId: run.id, routeDecision });

  assert.throws(
    () => checkpoint({ cwd, runId: run.id, stage: "build", status: "completed" }),
    /earlier stages not complete/
  );
});


test("finalization readiness reports incomplete production stages before cleanup", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  const readiness = finalizationReadiness({ cwd, runId: run.id });

  assert.equal(readiness.ok, false);
  assert.ok(readiness.errors.some(error => error.includes("owner approval")));
  assert.ok(readiness.errors.some(error => error.includes("earlier stages")));
});


test("production plan persists quality aspect and reference intent", () => {
  const plan = buildPlan({
    task: "reference job",
    mode: "director",
    routeDecision: null,
    intent: {
      quality: "hero",
      aspect: "9:16"
    },
    referenceId: "campaign-reference"
  });

  assert.deepEqual(plan.intent, {
    quality: "hero",
    aspect: "9:16"
  });
  assert.equal(plan.reference_id, "campaign-reference");
});

test("production plan normalizes invalid quality/aspect intent", () => {
  const plan = buildPlan({
    task: "safe defaults",
    mode: "direct",
    routeDecision: null,
    intent: {
      quality: "ultra-max",
      aspect: "cinema"
    }
  });

  assert.deepEqual(plan.intent, {
    quality: "normal",
    aspect: "project"
  });
  assert.equal(plan.reference_id, null);
});
