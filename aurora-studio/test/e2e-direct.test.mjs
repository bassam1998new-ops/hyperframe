import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeConfiguredWorkspace } from "../src/configured-setup.mjs";
import { hyperframesBin } from "../src/tool-install.mjs";
import {
  planProduction,
  writeRunCheckpoint,
  routeProductionRun,
  finalizeProduction
} from "../src/studio.mjs";
import {
  readAssetPlan,
  validateAssetPlanFile
} from "../src/asset-plan.mjs";
import {
  readBuildPlan,
  validateBuildPlanFile
} from "../src/build-plan.mjs";
import { loadRun } from "../src/governance.mjs";
import {
  readLearningReview,
  validateLearningReviewFile
} from "../src/learning.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-e2e-"));
}

test("fresh configured Direct workspace reaches routed build plan", async () => {
  const cwd = temp();

  writeConfiguredWorkspace({
    product: "Demo SaaS",
    purpose: "social product videos",
    mode: "direct",
    agents: "none",
    install_hyperframes: false,
    resources: {}
  }, { cwd });

  const hf = hyperframesBin(cwd);
  fs.mkdirSync(path.dirname(hf), { recursive: true });
  fs.writeFileSync(
    hf,
    process.platform === "win32"
      ? "@echo off\r\nexit /b 0\r\n"
      : "#!/bin/sh\nexit 0\n"
  );

  const fakeFfmpeg = path.join(
    cwd,
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  fs.writeFileSync(fakeFfmpeg, "");

  const oldFfmpeg = process.env.AURORA_FFMPEG_PATH;
  process.env.AURORA_FFMPEG_PATH = fakeFfmpeg;

  try {
    const run = await planProduction(
      "make a social kinetic typography product video with captions",
      {},
      cwd
    );

    assert.ok(run?.id);
    assert.deepEqual(run.plan.route, []);

    await writeRunCheckpoint(run.id, "understand", "completed", {}, cwd);
    await writeRunCheckpoint(run.id, "concept", "skipped", {}, cwd);
    await writeRunCheckpoint(run.id, "mood", "skipped", {}, cwd);

    const asset = readAssetPlan(run.id, cwd);
    asset.plan.status = "completed";
    asset.plan.summary = "Typography-only build; no external assets needed.";
    asset.plan.needs = [];
    asset.plan.updated_at = new Date().toISOString();
    fs.writeFileSync(asset.file, JSON.stringify(asset.plan, null, 2) + "\n");

    const assetValidation = validateAssetPlanFile(run.id, cwd);
    assert.equal(assetValidation.ok, true);

    await writeRunCheckpoint(
      run.id,
      "assets",
      "completed",
      { artifact: asset.file },
      cwd
    );

    const routed = await routeProductionRun(run.id, cwd);
    assert.ok(routed);
    assert.deepEqual(routed.plan.route, ["hyperframe"]);

    const build = readBuildPlan(run.id, cwd);
    assert.ok(build);
    build.plan.status = "completed";
    build.plan.summary = "HyperFrames owns the full programmable 2D build.";
    build.plan.shots = [{
      id: "main",
      purpose: "Kinetic typography product video",
      engine: "hyperframe",
      duration_seconds: 15,
      inputs: [],
      asset_ids: [],
      output: "renders/final.mp4",
      quality: "normal",
      success_criteria: ["clean hierarchy", "readable captions"],
      notes: [],
      handoff: null
    }];
    build.plan.updated_at = new Date().toISOString();
    fs.writeFileSync(build.file, JSON.stringify(build.plan, null, 2) + "\n");

    const buildValidation = validateBuildPlanFile(run.id, cwd);
    assert.equal(buildValidation.ok, true);

    await writeRunCheckpoint(
      run.id,
      "build_plan",
      "completed",
      { artifact: build.file },
      cwd
    );
    await writeRunCheckpoint(run.id, "build", "completed", {}, cwd);
    await writeRunCheckpoint(run.id, "pre_render_review", "completed", {}, cwd);

    const drafts = path.join(cwd, "renders", "drafts");
    fs.mkdirSync(drafts, { recursive: true });
    const approvedVideo = path.join(drafts, "approved.mp4");
    fs.writeFileSync(approvedVideo, "approved-video-bytes");

    await writeRunCheckpoint(
      run.id,
      "render",
      "completed",
      { artifact: approvedVideo },
      cwd
    );
    await writeRunCheckpoint(
      run.id,
      "post_render_review",
      "completed",
      { artifact: approvedVideo, note: "Reviewer PASS" },
      cwd
    );
    await writeRunCheckpoint(
      run.id,
      "approval",
      "completed",
      { artifact: approvedVideo, humanApproved: true },
      cwd
    );

    const learning = readLearningReview(run.id, cwd);
    learning.review.status = "completed";
    learning.review.summary = "Approved clean typography workflow; nothing new to promote.";
    learning.review.outcome.owner_approved = true;
    learning.review.outcome.reviewer_result = "PASS";
    learning.review.outcome.revisions = 1;
    learning.review.outcome.quality_score = 9;
    learning.review.updated_at = new Date().toISOString();
    fs.writeFileSync(
      learning.file,
      JSON.stringify(learning.review, null, 2) + "\n"
    );

    assert.equal(validateLearningReviewFile(run.id, cwd).ok, true);

    fs.writeFileSync(path.join(run.dir, "temp", "throwaway.txt"), "delete me");

    const finalized = await finalizeProduction(
      run.id,
      approvedVideo,
      null,
      cwd
    );

    assert.ok(finalized);
    assert.ok(fs.existsSync(finalized.finalArtifact.final_file));
    assert.ok(
      finalized.finalArtifact.final_file.includes(path.join("renders", "final"))
    );
    assert.ok(fs.existsSync(path.join(run.dir, "final.json")));
    assert.equal(fs.existsSync(path.join(run.dir, "temp")), false);

    const decisionsFile = path.join(cwd, ".aurora", "decisions.jsonl");
    const decisionsBeforeRetry = fs.readFileSync(decisionsFile, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean).length;

    const retry = await finalizeProduction(
      run.id,
      approvedVideo,
      null,
      cwd
    );

    assert.equal(retry.already_finalized, true);

    const decisionsAfterRetry = fs.readFileSync(decisionsFile, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean).length;
    assert.equal(decisionsAfterRetry, decisionsBeforeRetry);

    const saved = loadRun(cwd, run.id);
    assert.equal(saved.state.status, "completed");
    assert.equal(saved.state.checkpoints.build.status, "completed");
    assert.equal(saved.state.checkpoints.finalize.status, "completed");
    assert.deepEqual(saved.plan.route, ["hyperframe"]);
  } finally {
    if (oldFfmpeg === undefined) delete process.env.AURORA_FFMPEG_PATH;
    else process.env.AURORA_FFMPEG_PATH = oldFfmpeg;
  }
});
