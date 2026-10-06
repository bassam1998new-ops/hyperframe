import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRun } from "../src/governance.mjs";
import { sha256File } from "../src/final-artifact.mjs";
import {
  createReviewReport,
  validateReviewReport,
  validateReviewReportFile
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


test("new render resets an old PASS review to pending", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  const reviewFile = path.join(run.dir, "review.json");

  const old = passingReport();
  old.run_id = run.id;
  fs.writeFileSync(reviewFile, JSON.stringify(old, null, 2));

  const newVideo = path.join(cwd, "new-render.mp4");
  fs.writeFileSync(newVideo, "new-render-content");

  const result = createReviewReport(run.id, newVideo, cwd);

  assert.equal(result.report.status, "pending");
  assert.equal(result.report.decision, "PENDING");
  assert.equal(result.report.summary, "");
  assert.equal(result.report.creative.project_fit, null);
  assert.notEqual(result.report.video_sha256, old.video_sha256);
});


test("file validation rejects a video changed after PASS review", () => {
  const cwd = temp();
  const run = createRun({
    cwd,
    task: "hash integrity",
    mode: "direct",
    routeDecision: null
  });

  const video = path.join(cwd, "final.mp4");
  fs.writeFileSync(video, "original-video");
  const frameDir = path.join(run.dir, "review-frames");
  fs.mkdirSync(frameDir, { recursive: true });

  const frames = [1, 2, 3].map(index => {
    const file = path.join(frameDir, `frame-0${index}.jpg`);
    fs.writeFileSync(file, `frame-${index}`);
    return {
      index,
      time_seconds: index,
      path: path.relative(cwd, file),
      sha256: sha256File(file)
    };
  });

  const report = passingReport();
  report.run_id = run.id;
  report.video = "final.mp4";
  report.video_sha256 = sha256File(video);
  report.visual_evidence = {
    video: "final.mp4",
    video_sha256: report.video_sha256,
    generated_at: new Date().toISOString(),
    count: frames.length,
    frames,
    error: null
  };

  fs.writeFileSync(
    path.join(run.dir, "review.json"),
    JSON.stringify(report, null, 2)
  );

  fs.writeFileSync(video, "changed-after-review");

  const validation = validateReviewReportFile(run.id, cwd);
  assert.equal(validation.ok, false);
  assert.equal(validation.can_complete_post_review, false);
  assert.ok(
    validation.errors.some(error =>
      error.includes("SHA-256 changed after review")
    )
  );
});

test("new reviewed file invalidates stale post-review and approval checkpoints", () => {
  const cwd = temp();
  const run = createRun({
    cwd,
    task: "approval invalidation",
    mode: "direct",
    routeDecision: null
  });

  const oldVideo = path.join(cwd, "old.mp4");
  const newVideo = path.join(cwd, "new.mp4");
  fs.writeFileSync(oldVideo, "old-video");
  fs.writeFileSync(newVideo, "new-video");

  const oldReport = passingReport();
  oldReport.run_id = run.id;
  oldReport.video = "old.mp4";
  oldReport.video_sha256 = sha256File(oldVideo);
  fs.writeFileSync(
    path.join(run.dir, "review.json"),
    JSON.stringify(oldReport, null, 2)
  );

  const loaded = JSON.parse(
    fs.readFileSync(path.join(run.dir, "state.json"), "utf8")
  );
  loaded.checkpoints.post_render_review = {
    status: "completed",
    updated_at: new Date().toISOString(),
    artifact: path.join(run.dir, "review.json"),
    note: "old review",
    human_approved: false
  };
  loaded.checkpoints.approval = {
    status: "completed",
    updated_at: new Date().toISOString(),
    artifact: null,
    note: "old approval",
    human_approved: true
  };
  loaded.current_stage = "approval";
  fs.writeFileSync(
    path.join(run.dir, "state.json"),
    JSON.stringify(loaded, null, 2)
  );

  createReviewReport(run.id, newVideo, cwd);

  const refreshed = JSON.parse(
    fs.readFileSync(path.join(run.dir, "state.json"), "utf8")
  );

  assert.equal(
    refreshed.checkpoints.post_render_review.status,
    "in_progress"
  );
  assert.equal(refreshed.checkpoints.approval, undefined);
  assert.equal(refreshed.checkpoints.finalize, undefined);
  assert.equal(refreshed.current_stage, "post_render_review");
});
