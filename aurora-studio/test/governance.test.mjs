import test from "node:test";
import assert from "node:assert/strict";
import { buildPlan, evaluateSpend } from "../src/governance.mjs";

test("director mode gates concept and final approval", () => {
  const plan = buildPlan({
    task: "test",
    mode: "director",
    routeDecision: {
      selected: { route: ["hyperframe"], score: 8 },
      confidence: 0.8,
      candidates: []
    }
  });
  const gated = plan.stages.filter(s => s.human_approval_required).map(s => s.id);
  assert.deepEqual(gated, ["concept", "approval"]);
});

test("direct mode only requires final approval", () => {
  const plan = buildPlan({
    task: "test",
    mode: "direct",
    routeDecision: {
      selected: { route: ["hyperframe"], score: 8 },
      confidence: 0.8,
      candidates: []
    }
  });
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
