import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStudioUiServer } from "../src/ui-server.mjs";
import {
  ensureProjectProfile,
  readProject
} from "../src/brain.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, "../bin/aurora-studio.mjs");

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-ui-project-"));
}

function writeWorkspace(cwd) {
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });

  fs.writeFileSync(
    path.join(cwd, ".aurora", "workspace.json"),
    JSON.stringify({
      schema_version: 1,
      studio: "AurorA Studio",
      default_mode: "direct",
      project: {
        product: "Old Product",
        purpose: "old purpose",
        website: ""
      },
      tools: [],
      integrations: [],
      resources: {},
      learning: {
        decision_log: ".aurora/decisions.jsonl",
        lesson_log: ".aurora/lessons.jsonl",
        approved_only: true
      }
    })
  );

  ensureProjectProfile({
    product: "Old Product",
    purpose: "old purpose"
  }, cwd);
}

async function post(ui, pathname, body) {
  const response = await fetch(
    `http://127.0.0.1:${ui.port}${pathname}`,
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

test("Project Brain UI persists the complete stable context and honest provenance", async () => {
  const cwd = temp();
  writeWorkspace(cwd);

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const saved = await post(ui, "/api/project", {
      changes: {
        product: "New Product",
        website: "https://example.com/product",
        purpose: "premium product films",
        audience: ["Founders", "Operators"],
        "audience_context.knowledge_level": "Informed",
        "audience_context.priorities": ["Trust", "Speed"],
        offer: "Agent-driven production",
        positioning: "Premium but practical",
        claims_to_protect: [
          "No fake provider pricing",
          "After Effects remains optional"
        ],
        "brand.personality": ["premium", "intelligent"],
        "brand.colors": ["#090A16", "#8B5CFF"],
        "brand.fonts": ["Inter"],
        "brand.logo_paths": ["brand/logo.svg"],
        "brand.avoid": ["stock dashboard look"],
        "content.languages": ["English", "Arabic"],
        "content.channels": ["Instagram", "YouTube"],
        "content.default_formats": ["9:16 reels", "16:9 explainers"],
        "content.recurring_series": ["Product demos"],
        "creative.preferred_moods": ["cinematic", "restrained"],
        "creative.avoid_moods": ["noisy"],
        "creative.recurring_constraints": ["keep editable type"],
        notes: ["Owner prefers simple UI."]
      }
    });

    assert.equal(saved.response.status, 200);

    const project = readProject(cwd);
    assert.equal(project.product, "New Product");
    assert.equal(project.audience_context.knowledge_level, "Informed");
    assert.deepEqual(project.audience_context.priorities, ["Trust", "Speed"]);
    assert.deepEqual(project.claims_to_protect, [
      "No fake provider pricing",
      "After Effects remains optional"
    ]);
    assert.deepEqual(project.content.default_formats, [
      "9:16 reels",
      "16:9 explainers"
    ]);
    assert.deepEqual(project.content.recurring_series, ["Product demos"]);
    assert.deepEqual(project.notes, ["Owner prefers simple UI."]);

    const ownerSource = project.sources.find(
      source => source.type === "owner" && source.value === "studio-ui"
    );
    assert.ok(ownerSource);
    assert.match(ownerSource.note, /updated by owner/i);
    assert.ok(ownerSource.checked_at);

    const websiteSource = project.sources.find(
      source => source.type === "website"
    );
    assert.ok(websiteSource);
    assert.equal(websiteSource.value, "https://example.com/product");
    assert.equal(websiteSource.checked_at, null);
    assert.match(websiteSource.note, /has not automatically re-read/i);

    assert.equal(saved.payload.state.project.sources.length, 2);
    assert.equal(saved.payload.state.project.claims_to_protect.length, 2);
  } finally {
    await ui.close();
  }
});

test("invalid website text stays editable context but is not promoted to provenance link", async () => {
  const cwd = temp();
  writeWorkspace(cwd);

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const saved = await post(ui, "/api/project", {
      changes: {
        website: "not-a-url",
        positioning: "Keep this edit"
      }
    });

    assert.equal(saved.response.status, 200);

    const project = readProject(cwd);
    assert.equal(project.website, "not-a-url");
    assert.equal(
      project.sources.some(source => source.type === "website"),
      false
    );
    assert.equal(
      project.sources.some(
        source => source.type === "owner" && source.value === "studio-ui"
      ),
      true
    );
  } finally {
    await ui.close();
  }
});
