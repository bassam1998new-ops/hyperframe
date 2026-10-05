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
import { readMood, validateMoodFile } from "../src/mood.mjs";
import {
  readAssetPlan,
  validateAssetPlanFile
} from "../src/asset-plan.mjs";
import { readBuildPlan } from "../src/build-plan.mjs";
import { loadRun } from "../src/governance.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-director-e2e-"));
}

test("fresh configured Director workspace enforces concept and mood before routing", async () => {
  const cwd = temp();

  writeConfiguredWorkspace({
    product: "Demo Product",
    purpose: "premium launch videos",
    mode: "director",
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
      "premium launch video with strong kinetic typography and product UI",
      {},
      cwd
    );

    assert.ok(run?.id);

    const mood = readMood(run.id, cwd);
    assert.ok(mood, "Director mode should create mood.json at run start");

    await writeRunCheckpoint(run.id, "understand", "completed", {}, cwd);

    await writeRunCheckpoint(
      run.id,
      "concept",
      "completed",
      { note: "Owner selected concept A", humanApproved: true },
      cwd
    );

    mood.mood.intent.one_sentence =
      "Begin restrained and precise, then build into a confident product reveal.";
    mood.mood.intent.audience_should_feel = ["curious", "confident"];
    mood.mood.intent.product_truth_to_protect = ["clear product UI"];
    mood.mood.arc = [
      {
        phase: "setup",
        range: [0, 0.45],
        feeling: "controlled curiosity",
        energy: 3,
        tension: 2
      },
      {
        phase: "reveal",
        range: [0.45, 1],
        feeling: "clear confidence",
        energy: 7,
        tension: 4
      }
    ];
    mood.mood.visual.typography = ["large clean kinetic type"];
    mood.mood.motion.graphic_motion = ["precise type transitions"];
    mood.mood.continuity_anchors = ["single typography family"];
    mood.mood.must_not_happen = ["no random 3D decoration"];
    mood.mood.updated_at = new Date().toISOString();

    fs.writeFileSync(mood.file, JSON.stringify(mood.mood, null, 2) + "\n");

    const moodValidation = validateMoodFile(run.id, cwd);
    assert.equal(moodValidation.ok, true);

    await writeRunCheckpoint(
      run.id,
      "mood",
      "completed",
      { artifact: mood.file },
      cwd
    );

    const asset = readAssetPlan(run.id, cwd);
    asset.plan.status = "completed";
    asset.plan.summary =
      "Product UI and typography are procedural; no external assets are required.";
    asset.plan.needs = [];
    asset.plan.updated_at = new Date().toISOString();
    fs.writeFileSync(asset.file, JSON.stringify(asset.plan, null, 2) + "\n");

    assert.equal(validateAssetPlanFile(run.id, cwd).ok, true);

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
    assert.ok(build, "Routing should create build-plan.json");

    const saved = loadRun(cwd, run.id);
    assert.equal(saved.state.checkpoints.concept.human_approved, true);
    assert.equal(saved.state.checkpoints.mood.status, "completed");
    assert.equal(saved.state.checkpoints.routing.status, "completed");
  } finally {
    if (oldFfmpeg === undefined) delete process.env.AURORA_FFMPEG_PATH;
    else process.env.AURORA_FFMPEG_PATH = oldFfmpeg;
  }
});
