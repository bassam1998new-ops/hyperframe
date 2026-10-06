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
    intent: {
      quality: "hero",
      aspect: "9:16"
    },
    reference_id: "hero-reference",
    created_at: "2026-10-06T02:00:00Z",
    stages: [
      { id: "understand", status: "pending" },
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
      build: { status: "in_progress", updated_at: "2026-10-06T02:10:00Z" }
    }
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

  fs.mkdirSync(path.join(root, "references"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "references", "hero-reference.json"),
    JSON.stringify({
      schema_version: 1,
      id: "hero-reference",
      name: "Hero Reference",
      source: {
        type: "url",
        value: "https://example.com/hero",
        role: "visual"
      },
      analysis: {
        medium: "video",
        subject: "product hero",
        quality_tier: "premium"
      },
      created_at: "2026-10-06T01:30:00Z",
      updated_at: "2026-10-06T01:30:00Z"
    })
  );

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
  assert.deepEqual(snapshot.active_run.intent, {
    quality: "hero",
    aspect: "9:16"
  });
  assert.equal(snapshot.active_run.reference_id, "hero-reference");
  assert.equal(snapshot.references.length, 1);
  assert.equal(snapshot.references[0].id, "hero-reference");
  assert.equal(snapshot.references[0].role, "visual");
  assert.equal(snapshot.agent.bridge_connected, false);
  assert.equal(snapshot.agent.handoff.run_id, runId);
  assert.match(snapshot.agent.handoff.message, new RegExp(runId));
  assert.equal(snapshot.active_run.shots[0].engine, "blender");
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
