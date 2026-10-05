import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRun } from "../src/governance.mjs";
import {
  createReviewReport,
  validateReviewReport
} from "../src/review-report.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-review-"));
}

function passingReport() {
  return {
    schema_version: 1,
    run_id: "r",
    video: "final.mp4",
    video_sha256: "a".repeat(64),
    visual_evidence: {
      video: "final.mp4",
      video_sha256: "a".repeat(64),
      generated_at: new Date().toISOString(),
      count: 3,
      error: null,
      frames: [
        { index: 1, time_seconds: 1, path: ".aurora/runs/r/review-frames/frame-01.jpg", sha256: "b".repeat(64) },
        { index: 2, time_seconds: 2, path: ".aurora/runs/r/review-frames/frame-02.jpg", sha256: "c".repeat(64) },
        { index: 3, time_seconds: 3, path: ".aurora/runs/r/review-frames/frame-03.jpg", sha256: "d".repeat(64) }
      ]
    },
    status: "completed",
    technical: { ok: true, errors: [], warnings: [], metadata: {} },
    creative: {
      reference_fit: true,
      project_fit: true,
      story_clarity: true,
      motion_intentional: true,
      typography: true,
      captions: null,
      arabic: null,
      camera_crop_safe_zones: true,
      audio: true,
      three_d_vfx_quality: null,
      ai_slop_free: true,
      notes: []
    },
    assets: {
      licenses_ok: true,
      watermark_free: true,
      issues: []
    },
    issues: [],
    decision: "PASS",
    summary: "Approved creative and technical review."
  };
}

test("creates review report with a technical probe result", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  const result = createReviewReport(run.id, "missing.mp4", cwd);

  assert.equal(result.report.decision, "PENDING");
  assert.equal(result.report.technical.ok, false);
  assert.ok(fs.existsSync(result.file));
});

test("PASS report can complete post-render review", () => {
  const validation = validateReviewReport(passingReport());
  assert.equal(validation.ok, true);
  assert.equal(validation.can_complete_post_review, true);
});

test("FIX review cannot complete post-render review", () => {
  const report = passingReport();
  report.decision = "FIX";
  report.issues = ["Caption timing needs correction"];

  const validation = validateReviewReport(report);
  assert.equal(validation.ok, true);
  assert.equal(validation.can_complete_post_review, false);
});

test("completed review requires license and watermark checks", () => {
  const report = passingReport();
  report.assets.licenses_ok = null;
  report.assets.watermark_free = null;

  const validation = validateReviewReport(report);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some(error => error.includes("licenses_ok")));
  assert.ok(validation.errors.some(error => error.includes("watermark_free")));
});


test("PASS rejects a false required creative check", () => {
  const report = passingReport();
  report.creative.project_fit = false;

  const validation = validateReviewReport(report);
  assert.equal(validation.ok, false);
  assert.equal(validation.can_complete_post_review, false);
  assert.ok(validation.errors.some(error => error.includes("project_fit")));
});

test("PASS rejects unresolved issues", () => {
  const report = passingReport();
  report.issues = ["Minor caption timing issue"];

  const validation = validateReviewReport(report);
  assert.equal(validation.ok, false);
  assert.equal(validation.can_complete_post_review, false);
  assert.ok(validation.errors.some(error => error.includes("unresolved issues")));
});


test("completed review rejects missing visual evidence", () => {
  const report = passingReport();
  report.visual_evidence = null;

  const validation = validateReviewReport(report);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some(error => error.includes("visual_evidence")));
});

test("completed review rejects visual evidence from another render", () => {
  const report = passingReport();
  report.visual_evidence.video_sha256 = "f".repeat(64);

  const validation = validateReviewReport(report);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some(error => error.includes("does not belong")));
});
