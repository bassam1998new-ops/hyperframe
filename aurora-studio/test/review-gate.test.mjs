import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createRun,
  checkpoint,
  setRunRoute
} from "../src/governance.mjs";
import { writeRunCheckpoint } from "../src/studio.mjs";
import { sha256File } from "../src/final-artifact.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-review-gate-"));
}

const routeDecision = {
  selected: { route: ["hyperframe"], score: 8 },
  confidence: 0.8,
  candidates: [{ route: ["hyperframe"], score: 8 }]
};

function advanceToPostReview(cwd) {
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  checkpoint({ cwd, runId: run.id, stage: "understand", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "concept", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "mood", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "assets", status: "completed" });
  setRunRoute({ cwd, runId: run.id, routeDecision });
  checkpoint({ cwd, runId: run.id, stage: "build_plan", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "build", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "pre_render_review", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "render", status: "completed" });
  return run;
}

function writeReport(cwd, run, decision) {
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

  const videoSha = "b".repeat(64);
  const report = {
    schema_version: 1,
    run_id: run.id,
    video: "renders/final.mp4",
    video_sha256: videoSha,
    visual_evidence: {
      video: "renders/final.mp4",
      video_sha256: videoSha,
      generated_at: new Date().toISOString(),
      count: frames.length,
      frames,
      error: null
    },
    status: "completed",
    technical: { ok: true, errors: [], warnings: [], metadata: {} },
    creative: {
      reference_fit: null,
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
    issues: decision === "PASS" ? [] : ["Needs another pass"],
    decision,
    summary: decision === "PASS" ? "Review passed." : "Review found issues."
  };

  fs.writeFileSync(
    path.join(run.dir, "review.json"),
    JSON.stringify(report, null, 2)
  );
}

test("post-render review cannot complete without review.json", async () => {
  const cwd = temp();
  const run = advanceToPostReview(cwd);

  const state = await writeRunCheckpoint(
    run.id,
    "post_render_review",
    "completed",
    {},
    cwd
  );

  assert.equal(state, null);
  assert.equal(process.exitCode, 2);
  process.exitCode = 0;
});

test("FIX review cannot complete post-render checkpoint", async () => {
  const cwd = temp();
  const run = advanceToPostReview(cwd);
  writeReport(cwd, run, "FIX");

  const state = await writeRunCheckpoint(
    run.id,
    "post_render_review",
    "completed",
    {},
    cwd
  );

  assert.equal(state, null);
  assert.equal(process.exitCode, 2);
  process.exitCode = 0;
});

test("PASS review completes post-render checkpoint and saves artifact path", async () => {
  const cwd = temp();
  const run = advanceToPostReview(cwd);
  writeReport(cwd, run, "PASS");

  const state = await writeRunCheckpoint(
    run.id,
    "post_render_review",
    "completed",
    {},
    cwd
  );

  assert.ok(state);
  assert.equal(state.checkpoints.post_render_review.status, "completed");
  assert.match(state.checkpoints.post_render_review.artifact, /review\.json$/);
});
