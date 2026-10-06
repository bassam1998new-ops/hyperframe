import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStudioUiServer } from "../src/ui-server.mjs";
import {
  addLibraryItem,
  readLibrary
} from "../src/library.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, "../bin/aurora-studio.mjs");

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-ui-library-"));
}

function workspace(cwd) {
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });

  fs.writeFileSync(
    path.join(cwd, ".aurora", "workspace.json"),
    JSON.stringify({
      schema_version: 1,
      studio: "AurorA Studio",
      default_mode: "direct",
      project: {
        product: "Library Product",
        purpose: "videos",
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

  fs.writeFileSync(
    path.join(cwd, ".aurora", "project.json"),
    JSON.stringify({
      schema_version: 1,
      project_id: "library-product",
      product: "Library Product",
      purpose: "videos",
      website: "",
      audience: [],
      offer: "",
      positioning: "",
      brand: {
        personality: [],
        colors: [],
        fonts: [],
        logo_paths: [],
        avoid: []
      },
      content: {
        channels: [],
        default_formats: [],
        languages: [],
        recurring_series: []
      },
      creative: {
        preferred_moods: [],
        avoid_moods: [],
        recurring_constraints: []
      },
      claims_to_protect: [],
      sources: [],
      notes: []
    })
  );
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

test("Library detail actions update tracked metadata and preserve source file on removal", async () => {
  const cwd = temp();
  workspace(cwd);

  const source = path.join(cwd, "assets", "hero.png");
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.writeFileSync(source, "source");

  addLibraryItem({
    id: "hero",
    name: "Hero old",
    description: "Old description",
    kind: "image",
    type: "png",
    path: source,
    source_name: "Project",
    license_id: "CC0-1.0",
    commercial_allowed: true,
    redistribution_allowed: true,
    attribution_required: false,
    tags: ["old"],
    tools: ["hyperframe"],
    approved: false,
    quality_tier: "normal"
  }, cwd);

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const updated = await post(ui, "/api/library-update", {
      id: "hero",
      changes: {
        name: "Hero approved",
        description: "Approved reusable hero image",
        tags: ["hero", "product"],
        quality_tier: "premium",
        approved: true
      }
    });

    assert.equal(updated.response.status, 200);
    assert.equal(updated.payload.item.name, "Hero approved");
    assert.equal(updated.payload.item.approved, true);
    assert.deepEqual(updated.payload.item.tags, ["hero", "product"]);
    assert.equal(updated.payload.item.quality_tier, "premium");

    const snapshotItem = updated.payload.state.library_all
      .find(item => item.id === "hero");

    assert.equal(snapshotItem.description, "Approved reusable hero image");
    assert.equal(snapshotItem.local_available, true);
    assert.equal(snapshotItem.license.id, "CC0-1.0");
    assert.equal(snapshotItem.license.commercial_allowed, true);

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

test("Library reveal endpoint accepts only a tracked item id", async () => {
  const cwd = temp();
  workspace(cwd);

  addLibraryItem({
    id: "remote",
    name: "Remote asset",
    kind: "image",
    source_url: "https://example.test/asset",
    license_id: "CC0-1.0",
    commercial_allowed: true,
    approved: true
  }, cwd);

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const missing = await post(ui, "/api/library-reveal", {
      id: "remote",
      path: "/etc/passwd"
    });

    assert.equal(missing.response.status, 400);
    assert.match(
      missing.payload.error,
      /no available local file\/folder/
    );
  } finally {
    await ui.close();
  }
});
