import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStudioUiServer } from "../src/ui-server.mjs";
import {
  checkpoint,
  createRun,
  loadRun
} from "../src/governance.mjs";
import {
  createAssetPlan,
  readAssetPlan
} from "../src/asset-plan.mjs";
import {
  addLibraryItem,
  readLibrary
} from "../src/library.mjs";
import {
  readGenerationRequests
} from "../src/generation-requests.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, "../bin/aurora-studio.mjs");

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-ui-assets-"));
}

function writeWorkspace(cwd, resources = {}) {
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, ".aurora", "workspace.json"),
    JSON.stringify({
      schema_version: 1,
      studio: "AurorA Studio",
      default_mode: "direct",
      project: {
        product: "Asset Product",
        purpose: "launch videos",
        website: ""
      },
      tools: [],
      integrations: [],
      resources: {
        browser_control: false,
        chatgpt_browser: false,
        google_flow: false,
        meta_ai: false,
        elevenlabs: false,
        local_paths: [],
        ...resources
      },
      learning: {
        decision_log: ".aurora/decisions.jsonl",
        lesson_log: ".aurora/lessons.jsonl",
        approved_only: true
      }
    }, null, 2)
  );
}

function advanceToAssets(cwd, runId) {
  checkpoint({ cwd, runId, stage: "understand", status: "completed" });
  checkpoint({ cwd, runId, stage: "concept", status: "skipped" });
  checkpoint({ cwd, runId, stage: "mood", status: "skipped" });
}

async function post(ui, pathName, body) {
  const response = await fetch(
    `http://127.0.0.1:${ui.port}${pathName}`,
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
}

test("asset UI tracks Poly Haven with server-controlled license and reuses only tracked item", async () => {
  const cwd = temp();
  writeWorkspace(cwd);

  const run = createRun({
    cwd,
    task: "asset UI",
    mode: "direct",
    routeDecision: null
  });
  advanceToAssets(cwd, run.id);
  createAssetPlan(run.id, cwd);

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const added = await post(ui, "/api/asset-plan-add", {
      runId: run.id,
      description: "Premium studio HDRI",
      kind: "hdri",
      decision: "build_new",
      required_capabilities: ["lighting"]
    });

    assert.equal(added.response.status, 200);
    const needId = added.payload.need_id;

    const tracked = await post(ui, "/api/open-assets/track", {
      asset: {
        id: "studio-small-09",
        name: "Studio Small 09",
        description: "Soft studio environment",
        asset_type: "hdri",
        tags: ["studio", "soft"],
        source: { asset_url: "https://evil.test/not-used" },
        license: {
          id: "FAKE",
          commercial_allowed: false
        }
      }
    });

    assert.equal(tracked.response.status, 200);
    assert.equal(tracked.payload.item.id, "poly-haven-studio-small-09");
    assert.equal(tracked.payload.item.source_name, "Poly Haven");
    assert.equal(
      tracked.payload.item.source_url,
      "https://polyhaven.com/a/studio-small-09"
    );
    assert.equal(tracked.payload.item.license.id, "CC0-1.0");
    assert.equal(tracked.payload.item.license.commercial_allowed, true);

    const selected = await post(ui, "/api/asset-plan-update", {
      runId: run.id,
      needId,
      changes: {
        decision: "reuse",
        selected_library_ids: [tracked.payload.item.id]
      }
    });

    assert.equal(selected.response.status, 200);
    const need = selected.payload.state.active_run.asset_plan.needs
      .find(item => item.id === needId);
    assert.equal(need.decision, "reuse");
    assert.equal(need.selected_assets[0].id, tracked.payload.item.id);

    const completed = await post(ui, "/api/asset-plan-complete", {
      runId: run.id,
      summary: "Reuse the tracked CC0 studio HDRI."
    });

    assert.equal(completed.response.status, 200);
    assert.equal(
      completed.payload.state.active_run.asset_plan.status,
      "completed"
    );

    const saved = readAssetPlan(run.id, cwd).plan;
    assert.equal(saved.status, "completed");
    assert.deepEqual(
      saved.needs[0].selected_library_ids,
      [tracked.payload.item.id]
    );
  } finally {
    await ui.close();
  }
});

test("Library browser removal never deletes original source file", async () => {
  const cwd = temp();
  writeWorkspace(cwd);

  const source = path.join(cwd, "hero.png");
  fs.writeFileSync(source, "keep");

  addLibraryItem({
    id: "hero",
    name: "Hero",
    kind: "image",
    type: "png",
    path: source,
    approved: true
  }, cwd);

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const removed = await post(ui, "/api/library-remove", {
      id: "hero"
    });

    assert.equal(removed.response.status, 200);
    assert.equal(removed.payload.source_file_deleted, false);
    assert.equal(fs.existsSync(source), true);
    assert.equal(readLibrary(cwd).length, 0);
  } finally {
    await ui.close();
  }
});

test("generation endpoint requires owner cost approval then creates pending-agent handoff", async () => {
  const cwd = temp();
  writeWorkspace(cwd, {
    browser_control: true,
    google_flow: true
  });

  const run = createRun({
    cwd,
    task: "generated asset",
    mode: "direct",
    routeDecision: null,
    budget: {
      mode: "observe",
      cap_usd: null,
      approval_threshold_usd: 0.5
    }
  });
  advanceToAssets(cwd, run.id);
  createAssetPlan(run.id, cwd);

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const need = await post(ui, "/api/asset-plan-add", {
      runId: run.id,
      description: "Generated product motion clip",
      kind: "video",
      decision: "build_new",
      required_capabilities: ["video_generation"]
    });
    assert.equal(need.response.status, 200);

    const requestBody = {
      runId: run.id,
      needId: need.payload.need_id,
      provider: "google_flow",
      prompt: "Generate a clean premium product reveal",
      quantity: 6,
      unit: "credits",
      estimated_usd: 0.75,
      resolution: "360p"
    };

    const approval = await post(
      ui,
      "/api/generation-request",
      requestBody
    );

    assert.equal(approval.response.status, 200);
    assert.equal(approval.payload.ok, false);
    assert.equal(approval.payload.approval_required, true);
    assert.equal(approval.payload.budget.action, "ask_owner");
    assert.equal(readGenerationRequests(run.id, cwd).length, 0);

    const approved = await post(
      ui,
      "/api/generation-request",
      {
        ...requestBody,
        ownerApproved: true
      }
    );

    assert.equal(approved.response.status, 200);
    assert.equal(approved.payload.ok, true);
    assert.equal(approved.payload.request.status, "pending_agent");
    assert.equal(approved.payload.request.owner_approved_cost, true);

    const requests = readGenerationRequests(run.id, cwd);
    assert.equal(requests.length, 1);

    const saved = readAssetPlan(run.id, cwd).plan;
    const savedNeed = saved.needs.find(
      item => item.id === need.payload.need_id
    );
    assert.equal(savedNeed.decision, "build_new");
    assert.ok(
      savedNeed.required_capabilities.includes("video_generation")
    );
    assert.ok(
      savedNeed.notes.some(note =>
        note.includes(approved.payload.request.id)
      )
    );

    const state = loadRun(cwd, run.id);
    assert.equal(state.state.current_stage, "assets");
  } finally {
    await ui.close();
  }
});


test("Library approval endpoint rejects unknown commercial rights", async () => {
  const cwd = temp();
  writeWorkspace(cwd);

  addLibraryItem({
    id: "unknown-rights",
    name: "Unknown rights asset",
    kind: "image",
    source_url: "https://example.test/asset",
    source_name: "Example",
    license_id: "unknown",
    commercial_allowed: null,
    redistribution_allowed: null,
    attribution_required: null,
    approved: false
  }, cwd);

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const result = await post(ui, "/api/library-update", {
      id: "unknown-rights",
      changes: {
        approved: true
      }
    });

    assert.equal(result.response.status, 400);
    assert.match(result.payload.error, /license is verified/);

    const saved = readLibrary(cwd).find(
      item => item.id === "unknown-rights"
    );
    assert.equal(saved.approved, false);
  } finally {
    await ui.close();
  }
});
