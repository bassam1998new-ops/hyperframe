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
import { createLearningReview } from "../src/learning.mjs";
import { sha256File } from "../src/final-artifact.mjs";
import { finalizeProduction } from "../src/studio.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-finalize-review-"));
}

const routeDecision = {
  selected: { route: ["hyperframe"], score: 8 },
  confidence: 0.8,
  candidates: [{ route: ["hyperframe"], score: 8 }]
};

function advanceToApproval(cwd) {
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

  // Simulate a stale/manual checkpoint bypassing the normal high-level review gate.
  checkpoint({ cwd, runId: run.id, stage: "post_render_review", status: "completed" });
  checkpoint({
    cwd,
    runId: run.id,
    stage: "approval",
    status: "completed",
    humanApproved: true
  });

  const learning = createLearningReview(run.id, cwd);
  learning.review.status = "completed";
  learning.review.summary = "Nothing new worth saving.";
  learning.review.outcome.owner_approved = true;
  learning.review.outcome.reviewer_result = "PASS";
  fs.writeFileSync(
    learning.file,
    JSON.stringify(learning.review, null, 2)
  );

  const video = path.join(cwd, "approved.mp4");
  fs.writeFileSync(video, "fake-video");

  return { run, video };
}

function writePassingReview(run, video) {
  const report = {
    schema_version: 1,
    run_id: run.id,
    video: "approved.mp4",
    video_sha256: sha256File(video),
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
    issues: [],
    decision: "PASS",
    summary: "Structured review passed."
  };

  fs.writeFileSync(
    path.join(run.dir, "review.json"),
    JSON.stringify(report, null, 2)
  );
}

test("finalization rejects a spoofed/stale post-review checkpoint without PASS review.json", async () => {
  const cwd = temp();
  const { run, video } = advanceToApproval(cwd);

  const result = await finalizeProduction(run.id, video, null, cwd);

  assert.equal(result, null);
  assert.equal(process.exitCode, 2);
  assert.equal(
    fs.existsSync(path.join(cwd, "renders", "final", "approved.mp4")),
    false
  );

  process.exitCode = 0;
});

test("finalization succeeds once the independent PASS review exists", async () => {
  const cwd = temp();
  const { run, video } = advanceToApproval(cwd);
  writePassingReview(run, video);

  const result = await finalizeProduction(run.id, video, null, cwd);

  assert.ok(result);
  assert.equal(result.response.status, "completed");
  assert.equal(result.response.review.decision, "PASS");
  assert.ok(fs.existsSync(result.finalArtifact.final_file));
});


test("finalization rejects a different file than the one that passed review", async () => {
  const cwd = temp();
  const { run, video } = advanceToApproval(cwd);
  writePassingReview(run, video);

  const differentVideo = path.join(cwd, "different.mp4");
  fs.writeFileSync(differentVideo, "different-video");

  const result = await finalizeProduction(run.id, differentVideo, null, cwd);

  assert.equal(result, null);
  assert.equal(process.exitCode, 2);
  assert.equal(
    fs.existsSync(path.join(cwd, "renders", "final", "different.mp4")),
    false
  );

  process.exitCode = 0;
});
