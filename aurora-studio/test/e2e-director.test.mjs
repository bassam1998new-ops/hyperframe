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
import { validateMoodFile } from "../src/mood.mjs";
import { validateAssetPlanFile } from "../src/asset-plan.mjs";
import { validateBuildPlanFile } from "../src/build-plan.mjs";
import { loadRun } from "../src/governance.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-director-e2e-"));
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
  return { ffmpeg };
}

test("fresh Director workspace enforces concept and mood before routing", async () => {
  const cwd = temp();
  const { ffmpeg } = fakeRuntime(cwd);
  const previousFfmpeg = process.env.AURORA_FFMPEG_PATH;
  process.env.AURORA_FFMPEG_PATH = ffmpeg;

  try {
    writeConfiguredWorkspace({
      product: "Demo Product",
      purpose: "premium launch videos",
      mode: "director",
      agents: "none",
      install_hyperframes: false
    }, { cwd });

    const run = await planProduction(
      "Create a premium product launch film with kinetic type",
      {},
      cwd
    );

    assert.ok(run);

    await writeRunCheckpoint(run.id, "understand", "completed", {}, cwd);

    await writeRunCheckpoint(
      run.id,
      "concept",
      "completed",
      { humanApproved: true, note: "Owner picked concept A" },
      cwd
    );

    const moodFile = path.join(run.dir, "mood.json");
    const mood = JSON.parse(fs.readFileSync(moodFile, "utf8"));
    mood.intent.one_sentence = "Quiet confidence builds into a precise product reveal.";
    mood.intent.audience_should_feel = ["curious", "confident"];
    mood.intent.product_truth_to_protect = ["clarity", "premium simplicity"];
    mood.arc = [
      {
        phase: "open",
        range: [0, 0.4],
        feeling: "curious",
        energy: 3,
        tension: 2
      },
      {
        phase: "reveal",
        range: [0.4, 1],
        feeling: "confident",
        energy: 7,
        tension: 4
      }
    ];
    mood.continuity_anchors = [
      "single restrained camera language",
      "consistent type hierarchy"
    ];
    mood.must_not_happen = ["no random 3D", "no noisy transitions"];
    fs.writeFileSync(moodFile, JSON.stringify(mood, null, 2) + "\n");

    assert.equal(validateMoodFile(run.id, cwd).ok, true);

    await writeRunCheckpoint(
      run.id,
      "mood",
      "completed",
      { artifact: moodFile },
      cwd
    );

    const assetPlanFile = path.join(run.dir, "asset-plan.json");
    const assetPlan = JSON.parse(fs.readFileSync(assetPlanFile, "utf8"));
    assetPlan.status = "completed";
    assetPlan.summary = "No external visual assets required for this typography-led concept.";
    assetPlan.needs = [];
    fs.writeFileSync(assetPlanFile, JSON.stringify(assetPlan, null, 2) + "\n");

    assert.equal(validateAssetPlanFile(run.id, cwd).ok, true);

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
    buildPlan.summary = "HyperFrames owns the typography-led launch composition.";
    buildPlan.route = ["hyperframe"];
    buildPlan.shots = [{
      id: "launch",
      purpose: "Build the approved premium launch concept",
      engine: "hyperframe",
      inputs: [],
      asset_ids: [],
      output: "renders/launch.mp4",
      quality: "premium",
      success_criteria: [
        "mood contract preserved",
        "type hierarchy clear",
        "product truth protected"
      ],
      notes: []
    }];
    fs.writeFileSync(buildPlanFile, JSON.stringify(buildPlan, null, 2) + "\n");

    assert.equal(validateBuildPlanFile(run.id, cwd).ok, true);

    await writeRunCheckpoint(
      run.id,
      "build_plan",
      "completed",
      { artifact: buildPlanFile },
      cwd
    );

    const saved = loadRun(cwd, run.id);
    assert.equal(saved.state.checkpoints.concept.human_approved, true);
    assert.equal(saved.state.checkpoints.mood.status, "completed");
    assert.equal(saved.state.checkpoints.build_plan.status, "completed");
  } finally {
    if (previousFfmpeg === undefined) delete process.env.AURORA_FFMPEG_PATH;
    else process.env.AURORA_FFMPEG_PATH = previousFfmpeg;
  }
});
