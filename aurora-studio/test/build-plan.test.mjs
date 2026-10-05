import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRun, setRunRoute } from "../src/governance.mjs";
import { createBuildPlan, validateBuildPlan } from "../src/build-plan.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-build-plan-"));
}

test("creates build plan after a run exists", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  const result = createBuildPlan(run.id, cwd);
  assert.equal(result.plan.status, "pending");
  assert.ok(fs.existsSync(result.file));
});

test("valid multi-engine plan allows Blender to HyperFrames handoff", () => {
  const result = validateBuildPlan({
    schema_version: 1,
    status: "completed",
    summary: "3D hero feeds programmable final composition.",
    route: ["blender", "hyperframe"],
    shots: [
      {
        id: "hero-3d",
        purpose: "Create dimensional avatar hero",
        engine: "blender",
        inputs: [],
        asset_ids: ["avatar-1"],
        output: "renders/avatar.webm",
        quality: "premium",
        handoff: {
          from: "blender",
          to: "hyperframe",
          format: "transparent_webm",
          notes: []
        }
      },
      {
        id: "final-layout",
        purpose: "Compose title and brand UI",
        engine: "hyperframe",
        inputs: ["renders/avatar.webm"],
        asset_ids: [],
        output: "renders/final.mp4",
        quality: "premium"
      }
    ]
  }, ["blender", "hyperframe"]);

  assert.equal(result.ok, true);
});

test("plan rejects engine outside selected route", () => {
  const result = validateBuildPlan({
    schema_version: 1,
    status: "completed",
    summary: "bad",
    route: ["hyperframe"],
    shots: [{
      id: "ae",
      purpose: "finish",
      engine: "after_effects",
      inputs: [],
      asset_ids: [],
      output: "x.mov",
      quality: "normal"
    }]
  }, ["hyperframe"]);

  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes("not in the selected route")));
});
