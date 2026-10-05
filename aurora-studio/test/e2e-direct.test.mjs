import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { writeConfiguredWorkspace } from "../src/configured-setup.mjs";
import {
  planProduction,
  routeProductionRun,
  writeRunCheckpoint
} from "../src/studio.mjs";
import { hyperframesBin } from "../src/tool-install.mjs";
import { loadRun } from "../src/governance.mjs";
import { validateAssetPlanFile } from "../src/asset-plan.mjs";
import { validateBuildPlanFile } from "../src/build-plan.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-e2e-"));
}

function fakeRuntime(cwd) {
  const hf = hyperframesBin(cwd);
  fs.mkdirSync(path.dirname(hf), { recursive: true });
  fs.writeFileSync(hf, "");

  const ffmpeg = path.join(
    cwd,
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  fs.writeFileSync(ffmpeg, "");
  return { hf, ffmpeg };
}

test("fresh Direct workspace reaches a validated build plan", async () => {
  const cwd = temp();
  const { ffmpeg } = fakeRuntime(cwd);
  const previousFfmpeg = process.env.AURORA_FFMPEG_PATH;
  process.env.AURORA_FFMPEG_PATH = ffmpeg;

  try {
    const setup = writeConfiguredWorkspace({
      product: "Demo SaaS",
      purpose: "short social product videos",
      mode: "direct",
      agents: "none",
      install_hyperframes: false,
      resources: {
        google_flow: false,
        chatgpt_browser: false,
        meta_ai: false,
        elevenlabs: false
      }
    }, { cwd });

    assert.ok(fs.existsSync(setup.workspace_file));
    assert.ok(
      fs.existsSync(path.join(cwd, ".aurora", "system", "bin", "aurora-studio.mjs"))
    );

    const run = await planProduction(
      "Make a social kinetic typography explainer with captions",
      {},
      cwd
    );

    assert.ok(run);
    assert.deepEqual(run.plan.route, []);

    await writeRunCheckpoint(run.id, "understand", "completed", {}, cwd);
    await writeRunCheckpoint(run.id, "concept", "skipped", {}, cwd);
    await writeRunCheckpoint(run.id, "mood", "skipped", {}, cwd);

    const assetPlanFile = path.join(run.dir, "asset-plan.json");
    const assetPlan = JSON.parse(fs.readFileSync(assetPlanFile, "utf8"));
    assetPlan.status = "completed";
    assetPlan.summary = "Typography-only build; no external assets required.";
    assetPlan.needs = [];
    fs.writeFileSync(assetPlanFile, JSON.stringify(assetPlan, null, 2) + "\n");

    const assetValidation = validateAssetPlanFile(run.id, cwd);
    assert.equal(assetValidation.ok, true);

    await writeRunCheckpoint(
      run.id,
      "assets",
      "completed",
      { artifact: assetPlanFile },
      cwd
    );

    const routed = await routeProductionRun(run.id, cwd);
    assert.ok(routed);
    assert.deepEqual(routed.plan.route, ["hyperframe"]);

    const buildPlanFile = path.join(run.dir, "build-plan.json");
    const buildPlan = JSON.parse(fs.readFileSync(buildPlanFile, "utf8"));
    buildPlan.status = "completed";
    buildPlan.summary = "HyperFrames owns the complete programmable 2D build.";
    buildPlan.route = ["hyperframe"];
    buildPlan.shots = [{
      id: "main",
      purpose: "Create the full captioned kinetic typography video",
      engine: "hyperframe",
      inputs: [],
      asset_ids: [],
      output: "renders/final.mp4",
      quality: "normal",
      success_criteria: [
        "captions readable",
        "project context respected",
        "no external assets required"
      ],
      notes: []
    }];
    fs.writeFileSync(buildPlanFile, JSON.stringify(buildPlan, null, 2) + "\n");

    const buildValidation = validateBuildPlanFile(run.id, cwd);
    assert.equal(buildValidation.ok, true);

    await writeRunCheckpoint(
      run.id,
      "build_plan",
      "completed",
      { artifact: buildPlanFile },
      cwd
    );

    const saved = loadRun(cwd, run.id);
    assert.equal(saved.state.checkpoints.build_plan.status, "completed");
    assert.deepEqual(saved.plan.route, ["hyperframe"]);
    assert.equal(saved.plan.stages.find(stage => stage.id === "build_plan").status, "completed");
  } finally {
    if (previousFfmpeg === undefined) delete process.env.AURORA_FFMPEG_PATH;
    else process.env.AURORA_FFMPEG_PATH = previousFfmpeg;
  }
});
