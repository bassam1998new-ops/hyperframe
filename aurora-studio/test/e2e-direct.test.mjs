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
  routeProductionRun
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

    const saved = loadRun(cwd, run.id);
    assert.equal(saved.state.checkpoints.build.status, "completed");
    assert.deepEqual(saved.plan.route, ["hyperframe"]);
  } finally {
    if (oldFfmpeg === undefined) delete process.env.AURORA_FFMPEG_PATH;
    else process.env.AURORA_FFMPEG_PATH = oldFfmpeg;
  }
});
