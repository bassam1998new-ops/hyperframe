import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { startStudioUiServer } from "../src/ui-server.mjs";
import { writeConfiguredWorkspace } from "../src/configured-setup.mjs";
import {
  checkpoint,
  createRun,
  loadRun,
  setRunRoute
} from "../src/governance.mjs";
import { createBuildPlan } from "../src/build-plan.mjs";
import { detectMediaRuntime } from "../src/runtime.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, "../bin/aurora-studio.mjs");

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-ui-review-"));
}

function createVideo(t, cwd) {
  const runtime = detectMediaRuntime();
  if (!runtime.ffmpeg || !runtime.ffprobe) {
    t.skip("FFmpeg/ffprobe are required for UI review integration.");
    return null;
  }

  const output = path.join(cwd, "renders", "review-candidate.mp4");
  fs.mkdirSync(path.dirname(output), { recursive: true });

  const result = spawnSync(runtime.ffmpeg, [
    "-y",
    "-loglevel", "error",
    "-f", "lavfi",
    "-i", "color=c=black:s=320x180:d=2",
    "-t", "2",
    "-c:v", "mpeg4",
    "-q:v", "5",
    output
  ], {
    cwd,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(output));
  return {
    output,
    ffmpeg: runtime.ffmpeg
  };
}

function prepareRun(cwd, output) {
  writeConfiguredWorkspace({
    product: "Review UI Product",
    purpose: "review test",
    mode: "direct",
    agents: "none",
    install_hyperframes: false,
    resources: {}
  }, { cwd });

  const run = createRun({
    cwd,
    task: "Review the produced video",
    mode: "direct",
    routeDecision: null,
    intent: {
      quality: "premium",
      aspect: "16:9"
    }
  });

  checkpoint({ cwd, runId: run.id, stage: "understand", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "concept", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "mood", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "assets", status: "completed" });

  setRunRoute({
    cwd,
    runId: run.id,
    routeDecision: {
      selected: {
        route: ["hyperframe"],
        score: 9
      },
      confidence: 0.9,
      candidates: [{
        route: ["hyperframe"],
        score: 9
      }]
    }
  });

  const build = createBuildPlan(run.id, cwd);
  build.plan.status = "completed";
  build.plan.summary = "Single final composition.";
  build.plan.route = ["hyperframe"];
  build.plan.shots = [{
    id: "final-composition",
    purpose: "Final assembled video",
    engine: "hyperframe",
    inputs: [],
    asset_ids: [],
    output: path.relative(cwd, output).split(path.sep).join("/"),
    quality: "premium",
    success_criteria: ["review-ready output"],
    notes: []
  }];
  fs.writeFileSync(
    build.file,
    JSON.stringify(build.plan, null, 2) + "\n"
  );

  checkpoint({
    cwd,
    runId: run.id,
    stage: "build_plan",
    status: "completed",
    artifact: build.file
  });
  checkpoint({ cwd, runId: run.id, stage: "build", status: "completed" });
  checkpoint({
    cwd,
    runId: run.id,
    stage: "pre_render_review",
    status: "completed"
  });

  return run;
}

function fillPassingReview(cwd, runId) {
  const file = path.join(cwd, ".aurora", "runs", runId, "review.json");
  const report = JSON.parse(fs.readFileSync(file, "utf8"));

  report.status = "completed";
  report.decision = "PASS";
  report.summary = "Final video passed AurorA review.";

  for (const key of [
    "project_fit",
    "story_clarity",
    "motion_intentional",
    "typography",
    "camera_crop_safe_zones",
    "audio",
    "ai_slop_free"
  ]) {
    report.creative[key] = true;
  }

  report.assets.licenses_ok = true;
  report.assets.watermark_free = true;
  report.issues = [];
  report.assets.issues = [];

  fs.writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
  return report;
}

test("Studio Review flow registers a real render, approves PASS, then revision invalidates stale review", async t => {
  const cwd = temp();
  const video = createVideo(t, cwd);
  if (!video) return;

  const previousFfmpeg = process.env.AURORA_FFMPEG_PATH;
  process.env.AURORA_FFMPEG_PATH = video.ffmpeg;

  try {
    const run = prepareRun(cwd, video.output);
    const ui = await startStudioUiServer({
      cwd,
      port: 0,
      open: false,
      cliPath: CLI
    });

    const post = async (endpoint, body) => {
      const response = await fetch(
        `http://127.0.0.1:${ui.port}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Aurora-Token": ui.token
          },
          body: JSON.stringify(body)
        }
      );

      return {
        response,
        payload: await response.json()
      };
    };

    try {
      const stateResponse = await fetch(
        `http://127.0.0.1:${ui.port}/api/state`,
        {
          headers: {
            "X-Aurora-Token": ui.token
          }
        }
      );
      assert.equal(stateResponse.status, 200);
      const before = await stateResponse.json();
      assert.equal(before.active_run.render.pre_render_ready, true);
      assert.equal(before.active_run.render.render_complete, false);
      assert.equal(before.active_run.render.can_register_output, true);
      assert.equal(before.active_run.render.candidates.length, 1);

      const registered = await post("/api/render-register", {
        runId: run.id,
        path: path.relative(cwd, video.output).split(path.sep).join("/")
      });

      assert.equal(registered.response.status, 200);
      assert.equal(
        registered.payload.state.active_run.render.render_complete,
        true
      );
      assert.equal(
        registered.payload.state.active_run.review.technical.ok,
        true
      );
      assert.ok(
        registered.payload.state.active_run.review.evidence.length >= 3
      );
      assert.equal(
        registered.payload.state.active_run.review.can_approve,
        false
      );

      fillPassingReview(cwd, run.id);

      const refreshed = await post("/api/review-refresh", {
        runId: run.id
      });

      assert.equal(refreshed.response.status, 200);
      assert.equal(
        refreshed.payload.state.active_run.review.can_approve,
        true
      );
      assert.equal(
        refreshed.payload.state.active_run.review.decision,
        "PASS"
      );

      const approved = await post("/api/approve", {
        runId: run.id,
        confirm: true
      });

      assert.equal(approved.response.status, 200);
      assert.equal(approved.payload.approved, true);
      assert.equal(approved.payload.finalized, false);
      assert.equal(approved.payload.needs_learning, true);
      assert.equal(
        approved.payload.state.active_run.approval.human_approved,
        true
      );

      const revised = await post("/api/revision", {
        runId: run.id,
        kind: "fix",
        note: "Tighten the final caption timing.",
        shotId: "final-composition"
      });

      assert.equal(revised.response.status, 200);
      assert.equal(
        revised.payload.state.active_run.current_stage,
        "build"
      );
      assert.equal(revised.payload.state.active_run.review, null);
      assert.equal(
        revised.payload.state.active_run.approval.human_approved,
        false
      );

      const saved = loadRun(cwd, run.id);
      assert.equal(saved.state.current_stage, "build");
      assert.equal(saved.state.checkpoints.render, undefined);
      assert.equal(saved.state.checkpoints.approval, undefined);
    } finally {
      await ui.close();
    }
  } finally {
    if (previousFfmpeg === undefined) {
      delete process.env.AURORA_FFMPEG_PATH;
    } else {
      process.env.AURORA_FFMPEG_PATH = previousFfmpeg;
    }
  }
});
