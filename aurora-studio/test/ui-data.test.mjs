import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildStudioSnapshot, resolveWorkspaceMedia } from "../src/ui-data.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-ui-data-"));
}

test("UI snapshot reflects real workspace run usage library and render", () => {
  const cwd = temp();
  const root = path.join(cwd, ".aurora");
  const runId = "run-1";
  const runDir = path.join(root, "runs", runId);
  fs.mkdirSync(path.join(root, "library"), { recursive: true });
  fs.mkdirSync(runDir, { recursive: true });
  fs.mkdirSync(path.join(cwd, "renders"), { recursive: true });

  fs.writeFileSync(path.join(root, "workspace.json"), JSON.stringify({
    default_mode: "director",
    tools: [
      { id: "hyperframe", name: "HyperFrames", required: true, available: true },
      { id: "blender", name: "Blender", required: false, available: true },
      { id: "after_effects", name: "Adobe After Effects", required: false, available: false }
    ],
    resources: {}
  }));

  fs.writeFileSync(path.join(root, "project.json"), JSON.stringify({
    product: "Demo Product",
    purpose: "launch videos"
  }));

  fs.writeFileSync(path.join(runDir, "plan.json"), JSON.stringify({
    task: "Make the launch film",
    mode: "director",
    route: ["blender", "hyperframe"],
    route_confidence: 0.9,
    created_at: "2026-10-06T02:00:00Z",
    stages: [
      { id: "understand", status: "completed" },
      { id: "concept", status: "completed" },
      { id: "build", status: "pending" },
      { id: "render", status: "pending" }
    ]
  }));

  fs.writeFileSync(path.join(runDir, "state.json"), JSON.stringify({
    status: "in_progress",
    current_stage: "build",
    updated_at: "2026-10-06T02:10:00Z",
    checkpoints: {
      understand: { status: "completed", updated_at: "2026-10-06T02:01:00Z" },
      concept: {
        status: "completed",
        human_approved: true,
        updated_at: "2026-10-06T02:03:00Z"
      },
      build: { status: "in_progress", updated_at: "2026-10-06T02:10:00Z" }
    }
  }));

  fs.writeFileSync(path.join(runDir, "concepts.json"), JSON.stringify({
    schema_version: 1,
    run_id: runId,
    status: "selected",
    selected_id: "premium-orbit",
    concepts: [{
      id: "premium-orbit",
      name: "Premium Orbit",
      core_idea: "A controlled orbit reveals the product.",
      project_fit: "Fits the premium launch.",
      emotional_arc: "Mystery to confidence.",
      visual_motion_grammar: ["slow orbit", "precise type"],
      complexity: "high",
      cost_class: "medium",
      biggest_risk: "Could feel too slow.",
      preview: null,
      notes: []
    }, {
      id: "signal",
      name: "Signal",
      core_idea: "A signal builds into the product reveal.",
      project_fit: "Fits a technology product.",
      emotional_arc: "Tension to clarity.",
      visual_motion_grammar: ["signal pulses", "fast cuts"],
      complexity: "medium",
      cost_class: "low",
      biggest_risk: "Could feel generic.",
      preview: null,
      notes: []
    }],
    refinement_requests: [],
    created_at: "2026-10-06T02:02:00Z",
    updated_at: "2026-10-06T02:03:00Z"
  }));

  fs.writeFileSync(path.join(runDir, "build-plan.json"), JSON.stringify({
    shots: [{
      id: "hero",
      purpose: "3D product hero",
      engine: "blender",
      quality: "premium",
      output: "renders/hero.webm"
    }]
  }));

  fs.writeFileSync(path.join(runDir, "usage.jsonl"),
    JSON.stringify({
      phase: "actual",
      provider: "google_flow",
      operation: "video_generation",
      quantity: 6,
      unit: "credits",
      usd: 0.2
    }) + "\n"
  );

  fs.writeFileSync(path.join(root, "library", "index.jsonl"),
    JSON.stringify({
      id: "style-1",
      name: "Premium Dark",
      kind: "style",
      type: "hyperframe-style",
      approved: true,
      license: { id: "project-managed" },
      tools: ["hyperframe"],
      created_at: "2026-10-06T01:00:00Z"
    }) + "\n"
  );

  const render = path.join(cwd, "renders", "hero.webm");
  fs.writeFileSync(render, "fake");
  fs.writeFileSync(path.join(runDir, "review.json"), JSON.stringify({
    video: "renders/hero.webm",
    decision: "PENDING",
    status: "pending",
    summary: ""
  }));

  const snapshot = buildStudioSnapshot(cwd);

  assert.equal(snapshot.configured, true);
  assert.equal(snapshot.workspace.mode, "director");
  assert.equal(snapshot.project.product, "Demo Product");
  assert.equal(snapshot.active_run.id, runId);
  assert.equal(snapshot.active_run.current_stage, "build");
  assert.deepEqual(snapshot.active_run.route, ["blender", "hyperframe"]);
  assert.equal(snapshot.active_run.shots[0].engine, "blender");
  assert.equal(snapshot.active_run.concepts.status, "selected");
  assert.equal(snapshot.active_run.concepts.selected_id, "premium-orbit");
  assert.equal(snapshot.active_run.concepts.selected.name, "Premium Orbit");
  assert.equal(snapshot.active_run.concepts.direction_locked, true);
  assert.equal(snapshot.active_run.usage.actual_usd, 0.2);
  assert.equal(snapshot.stats.library_approved, 1);
  assert.equal(snapshot.active_run.preview.path, "renders/hero.webm");
});

test("workspace media resolver refuses paths outside the project root", () => {
  const cwd = temp();
  const inside = path.join(cwd, "render.mp4");
  const outside = path.join(path.dirname(cwd), "outside.mp4");
  fs.writeFileSync(inside, "x");
  fs.writeFileSync(outside, "x");

  try {
    assert.equal(resolveWorkspaceMedia(cwd, "render.mp4"), inside);
    assert.equal(resolveWorkspaceMedia(cwd, outside), null);
    assert.equal(resolveWorkspaceMedia(cwd, "../outside.mp4"), null);
  } finally {
    fs.rmSync(outside, { force: true });
  }
});
