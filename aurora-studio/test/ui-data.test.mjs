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
      output: "renders/hero.webm",
      asset_ids: ["style-1"]
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
  assert.equal(snapshot.library_all[0].use_count, 1);
  assert.equal(snapshot.library_all[0].use_history[0].type, "shot");
  assert.equal(snapshot.library_all[0].use_history[0].run_id, runId);
  assert.equal(snapshot.library[0].use_count, 1);
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


test("UI snapshot exposes multi-agent video work progress and attention", () => {
  const cwd = temp();
  const root = path.join(cwd, ".aurora");
  const runId = "run-live";
  const runDir = path.join(root, "runs", runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.mkdirSync(path.join(root, "library"), { recursive: true });

  fs.writeFileSync(path.join(root, "workspace.json"), JSON.stringify({
    schema_version: 1,
    studio: "AurorA Studio",
    default_mode: "director",
    project: { product: "Agent Canvas", purpose: "launch video" },
    tools: [],
    integrations: [],
    resources: {},
    learning: {
      decision_log: ".aurora/decisions.jsonl",
      lesson_log: ".aurora/lessons.jsonl",
      approved_only: true
    }
  }));

  fs.writeFileSync(path.join(root, "project.json"), JSON.stringify({
    schema_version: 1,
    project_id: "agent-canvas",
    product: "Agent Canvas",
    purpose: "launch video",
    website: "",
    audience: [],
    offer: "",
    positioning: "",
    brand: { personality: [], colors: [], fonts: [], logo_paths: [], avoid: [] },
    content: { channels: [], default_formats: [], languages: [], recurring_series: [] },
    creative: { preferred_moods: [], avoid_moods: [], recurring_constraints: [] },
    claims_to_protect: [],
    sources: [],
    notes: []
  }));

  fs.writeFileSync(path.join(runDir, "plan.json"), JSON.stringify({
    task: "Build the launch video",
    mode: "director",
    route: ["hyperframe"],
    route_confidence: 0.9,
    created_at: new Date().toISOString(),
    stages: [
      { id: "understand", status: "pending" },
      { id: "assets", status: "pending" },
      { id: "build", status: "pending" },
      { id: "approval", status: "pending", human_approval_required: true }
    ]
  }));

  fs.writeFileSync(path.join(runDir, "state.json"), JSON.stringify({
    status: "in_progress",
    current_stage: "build",
    updated_at: new Date().toISOString(),
    checkpoints: {
      understand: { status: "completed" },
      assets: { status: "completed" },
      build: { status: "in_progress" }
    }
  }));

  const now = new Date().toISOString();
  fs.writeFileSync(path.join(root, "agent-events.jsonl"), [
    JSON.stringify({
      schema_version: 1,
      timestamp: now,
      source: "claude",
      event: "PostToolUse",
      state: "working",
      session_id: "claude-session",
      tool_name: "Edit",
      workspace_path: ".aurora/runs/run-live/build-plan.json",
      run_id: runId,
      summary: "Claude updated storyboard and build plan"
    }),
    JSON.stringify({
      schema_version: 1,
      timestamp: now,
      source: "codex",
      event: "PermissionRequest",
      state: "waiting",
      session_id: "codex-session",
      tool_name: "Bash",
      workspace_path: null,
      run_id: runId,
      summary: "Codex is waiting for permission: terminal"
    })
  ].join("\n") + "\n");

  const snapshot = buildStudioSnapshot(cwd);

  assert.equal(snapshot.agent.bridge_connected, true);
  assert.equal(snapshot.agent.source, "codex");
  assert.equal(snapshot.agent.state, "waiting");
  assert.equal(snapshot.agent.work.title, "Building the video");
  assert.equal(snapshot.agent.progress.completed, 2);
  assert.equal(snapshot.agent.progress.total, 4);
  assert.equal(snapshot.agent.progress.percent, 50);
  assert.equal(snapshot.agent.attention.title, "Agent needs you");

  const workers = new Map(
    snapshot.agent.workers.map(worker => [worker.source, worker])
  );
  assert.equal(workers.get("claude").connected, true);
  assert.equal(workers.get("claude").state, "working");
  assert.equal(workers.get("codex").connected, true);
  assert.equal(workers.get("codex").state, "waiting");
});


test("connected agent does not claim a newly created run until a run event arrives", () => {
  const cwd = temp();
  const root = path.join(cwd, ".aurora");
  const runId = "claim-run";
  const runDir = path.join(root, "runs", runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.mkdirSync(path.join(root, "library"), { recursive: true });

  fs.writeFileSync(path.join(root, "workspace.json"), JSON.stringify({
    schema_version: 1,
    studio: "AurorA Studio",
    default_mode: "direct",
    project: { product: "Claim Test", purpose: "video" },
    tools: [],
    integrations: [],
    resources: {},
    learning: {
      decision_log: ".aurora/decisions.jsonl",
      lesson_log: ".aurora/lessons.jsonl",
      approved_only: true
    }
  }));

  fs.writeFileSync(path.join(root, "project.json"), JSON.stringify({
    schema_version: 1,
    project_id: "claim-test",
    product: "Claim Test",
    purpose: "video",
    website: "",
    audience: [],
    offer: "",
    positioning: "",
    brand: { personality: [], colors: [], fonts: [], logo_paths: [], avoid: [] },
    content: { channels: [], default_formats: [], languages: [], recurring_series: [] },
    creative: { preferred_moods: [], avoid_moods: [], recurring_constraints: [] },
    claims_to_protect: [],
    sources: [],
    notes: []
  }));

  const now = Date.now();
  const createdAt = new Date(now - 1_000).toISOString();

  fs.writeFileSync(path.join(runDir, "plan.json"), JSON.stringify({
    task: "Build the claim test video",
    mode: "direct",
    route: [],
    route_confidence: 0,
    created_at: createdAt,
    stages: [
      { id: "understand", status: "pending" },
      { id: "build", status: "pending" }
    ]
  }));

  fs.writeFileSync(path.join(runDir, "state.json"), JSON.stringify({
    status: "in_progress",
    current_stage: "understand",
    updated_at: createdAt,
    checkpoints: {}
  }));

  const eventsFile = path.join(root, "agent-events.jsonl");

  fs.writeFileSync(eventsFile, JSON.stringify({
    schema_version: 1,
    timestamp: new Date(now - 5_000).toISOString(),
    source: "claude",
    event: "SessionStart",
    state: "working",
    session_id: "before-run",
    run_id: null,
    summary: "Claude session started"
  }) + "\n");

  const unclaimed = buildStudioSnapshot(cwd);
  assert.equal(unclaimed.agent.bridge_connected, true);
  assert.equal(unclaimed.agent.run_claimed, false);
  assert.equal(
    unclaimed.agent.handoff.reason,
    "connected_not_claimed"
  );
  assert.match(
    unclaimed.agent.work.detail,
    /has not been handed off/
  );

  fs.appendFileSync(eventsFile, JSON.stringify({
    schema_version: 1,
    timestamp: new Date(now).toISOString(),
    source: "claude",
    event: "PostToolUse",
    state: "working",
    session_id: "before-run",
    run_id: runId,
    tool_name: "Read",
    workspace_path: ".aurora/runs/claim-run/plan.json",
    summary: "Claude finished file read"
  }) + "\n");

  const claimed = buildStudioSnapshot(cwd);
  assert.equal(claimed.agent.run_claimed, true);
  assert.equal(claimed.agent.handoff, null);
});
