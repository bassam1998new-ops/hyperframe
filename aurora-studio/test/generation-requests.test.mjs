import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRun } from "../src/governance.mjs";
import {
  createGenerationRequest,
  generationCapabilityForNeed,
  readGenerationRequests
} from "../src/generation-requests.mjs";
import { summarizeUsage } from "../src/usage.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-generation-"));
}

function workspace(cwd, resources) {
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, ".aurora", "workspace.json"),
    JSON.stringify({ resources }, null, 2)
  );
}

test("generation capability follows asset kind", () => {
  assert.equal(
    generationCapabilityForNeed({ kind: "video" }),
    "video_generation"
  );
  assert.equal(
    generationCapabilityForNeed({ kind: "audio" }),
    "audio_generation"
  );
  assert.equal(
    generationCapabilityForNeed({ kind: "model" }),
    "3d_asset_generation"
  );
  assert.equal(
    generationCapabilityForNeed({ kind: "image" }),
    "image_generation"
  );
});

test("provider request above approval threshold waits for owner and records nothing", () => {
  const cwd = temp();
  workspace(cwd, {
    browser_control: true,
    google_flow: true
  });

  const run = createRun({
    cwd,
    task: "cost approval",
    mode: "direct",
    routeDecision: null,
    budget: {
      mode: "observe",
      cap_usd: null,
      approval_threshold_usd: 0.5
    }
  });

  const result = createGenerationRequest({
    run_id: run.id,
    provider: "google_flow",
    capability: "video_generation",
    prompt: "Create a premium product reveal",
    quantity: 6,
    unit: "credits",
    estimated_usd: 0.75
  }, { cwd });

  assert.equal(result.created, false);
  assert.equal(result.approval_required, true);
  assert.equal(result.budget.action, "ask_owner");
  assert.equal(readGenerationRequests(run.id, cwd).length, 0);

  const usage = summarizeUsage(run.id, cwd);
  assert.equal(usage.entries, 0);
  assert.equal(usage.estimated_usd, 0);
});

test("owner-approved provider request becomes pending_agent and records estimate", () => {
  const cwd = temp();
  workspace(cwd, {
    browser_control: true,
    google_flow: true
  });

  const run = createRun({
    cwd,
    task: "approved generation",
    mode: "direct",
    routeDecision: null,
    budget: {
      mode: "observe",
      cap_usd: null,
      approval_threshold_usd: 0.5
    }
  });

  const result = createGenerationRequest({
    run_id: run.id,
    need_id: "hero-video",
    provider: "google_flow",
    capability: "video_generation",
    prompt: "Create a premium product reveal",
    model: "live-provider-model",
    resolution: "360p",
    quantity: 6,
    unit: "credits",
    estimated_usd: 0.75
  }, {
    cwd,
    ownerApproved: true
  });

  assert.equal(result.created, true);
  assert.equal(result.approval_required, false);
  assert.equal(result.request.status, "pending_agent");
  assert.equal(result.request.owner_approved_cost, true);
  assert.equal(result.request.provider, "google_flow");

  const requests = readGenerationRequests(run.id, cwd);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].id, result.request.id);

  const usage = summarizeUsage(run.id, cwd);
  assert.equal(usage.estimated_usd, 0.75);
  assert.equal(usage.estimated_units.google_flow.credits, 6);
});

test("browser provider is rejected when browser control is unavailable", () => {
  const cwd = temp();
  workspace(cwd, {
    browser_control: false,
    google_flow: true
  });

  const run = createRun({
    cwd,
    task: "blocked browser",
    mode: "direct",
    routeDecision: null
  });

  assert.throws(
    () => createGenerationRequest({
      run_id: run.id,
      provider: "google_flow",
      prompt: "Generate a clip"
    }, { cwd }),
    /browser control is unavailable/
  );
});

test("hard budget cap blocks request even with owner approval", () => {
  const cwd = temp();
  workspace(cwd, {
    browser_control: true,
    google_flow: true
  });

  const run = createRun({
    cwd,
    task: "hard cap",
    mode: "direct",
    routeDecision: null,
    budget: {
      mode: "cap",
      cap_usd: 0.5,
      approval_threshold_usd: 10
    }
  });

  assert.throws(
    () => createGenerationRequest({
      run_id: run.id,
      provider: "google_flow",
      prompt: "Generate a clip",
      estimated_usd: 0.75
    }, {
      cwd,
      ownerApproved: true
    }),
    /budget cap/
  );
});
