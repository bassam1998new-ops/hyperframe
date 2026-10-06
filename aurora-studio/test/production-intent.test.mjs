import test from "node:test";
import assert from "node:assert/strict";
import { buildPlan } from "../src/governance.mjs";

test("production plan persists quality aspect and reference intent", () => {
  const plan = buildPlan({
    task: "launch video",
    mode: "direct",
    routeDecision: null,
    budget: null,
    referenceId: "visual-ref",
    intent: {
      quality: "hero",
      aspect: "9:16"
    }
  });

  assert.deepEqual(plan.intent, {
    quality: "hero",
    aspect: "9:16"
  });
  assert.equal(plan.reference_id, "visual-ref");
});

test("production intent falls back to safe defaults", () => {
  const plan = buildPlan({
    task: "test",
    mode: "direct",
    routeDecision: null,
    budget: null,
    referenceId: null,
    intent: {
      quality: "ultra-mega",
      aspect: "cinema"
    }
  });

  assert.deepEqual(plan.intent, {
    quality: "normal",
    aspect: "project"
  });
  assert.equal(plan.reference_id, null);
});
