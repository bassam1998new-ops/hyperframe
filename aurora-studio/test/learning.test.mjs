import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRun } from "../src/governance.mjs";
import {
  createLearningReview,
  validateLearningReview,
  completedLearningPayload
} from "../src/learning.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-learning-"));
}

test("creates pending learning review inside a run", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  const result = createLearningReview(run.id, cwd);
  assert.equal(result.review.status, "pending");
  assert.ok(fs.existsSync(result.file));
});

test("completed learning review needs summary", () => {
  const result = validateLearningReview({
    schema_version: 1,
    status: "completed",
    summary: "",
    lessons: [],
    proposals: { styles: [], skills: [], assets: [] }
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(x => x.includes("summary")));
});

test("completed payload is returned only after a valid review", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  const created = createLearningReview(run.id, cwd);
  const review = created.review;
  review.status = "completed";
  review.summary = "No new style; reusable Blender lighting lesson.";
  review.lessons = [{
    lesson: "Reuse the approved softbox rig for this product family.",
    applies_when: ["studio product shot"],
    confidence: 0.9
  }];
  fs.writeFileSync(created.file, JSON.stringify(review, null, 2));

  const payload = completedLearningPayload(run.id, cwd);
  assert.ok(payload);
  assert.equal(payload.review.lessons.length, 1);
});
