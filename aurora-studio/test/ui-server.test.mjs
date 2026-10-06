import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStudioUiServer } from "../src/ui-server.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, "../bin/aurora-studio.mjs");

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-ui-server-"));
}

test("Studio API requires its local session token and mode action uses real CLI", async () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    studio: "AurorA Studio",
    default_mode: "direct",
    project: { product: "Demo", purpose: "video" },
    tools: [],
    resources: {}
  }));

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const unauthorized = await fetch(`http://127.0.0.1:${ui.port}/api/state`);
    assert.equal(unauthorized.status, 401);

    const stateResponse = await fetch(`http://127.0.0.1:${ui.port}/api/state`, {
      headers: { "X-Aurora-Token": ui.token }
    });
    assert.equal(stateResponse.status, 200);
    const state = await stateResponse.json();
    assert.equal(state.workspace.mode, "direct");

    const modeResponse = await fetch(`http://127.0.0.1:${ui.port}/api/mode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aurora-Token": ui.token
      },
      body: JSON.stringify({ mode: "director" })
    });
    assert.equal(modeResponse.status, 200);

    const changed = JSON.parse(
      fs.readFileSync(path.join(cwd, ".aurora", "workspace.json"), "utf8")
    );
    assert.equal(changed.default_mode, "director");
  } finally {
    await ui.close();
  }
});

test("Studio static shell is available without exposing workspace API", async () => {
  const cwd = temp();
  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const page = await fetch(`http://127.0.0.1:${ui.port}/`);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /AurorA Studio/);
    assert.match(html, /LIVE PREVIEW/);
  } finally {
    await ui.close();
  }
});


test("first-run UI setup creates the real AurorA workspace", async () => {
  const cwd = temp();
  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const response = await fetch(`http://127.0.0.1:${ui.port}/api/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aurora-Token": ui.token
      },
      body: JSON.stringify({
        product: "UI Product",
        purpose: "launch videos",
        website: "https://example.test",
        mode: "director",
        install_hyperframes: false,
        install_agents: false,
        resources: {}
      })
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.state.configured, true);
    assert.equal(payload.state.workspace.mode, "director");
    assert.equal(payload.state.project.product, "UI Product");
    assert.ok(
      fs.existsSync(path.join(cwd, ".aurora", "system", "ui", "index.html"))
    );
  } finally {
    await ui.close();
  }
});

test("Project UI writes through the existing project set command", async () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    studio: "AurorA Studio",
    default_mode: "direct",
    project: { product: "Old", purpose: "video", website: "" },
    tools: [],
    resources: {}
  }));
  fs.writeFileSync(path.join(cwd, ".aurora", "project.json"), JSON.stringify({
    schema_version: 1,
    project_id: "old",
    product: "Old",
    purpose: "video",
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
    notes: []
  }));

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const response = await fetch(`http://127.0.0.1:${ui.port}/api/project`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aurora-Token": ui.token
      },
      body: JSON.stringify({
        changes: {
          product: "New Product",
          audience: ["Founders", "Marketers"],
          "brand.colors": ["#111111", "#8844ff"]
        }
      })
    });

    assert.equal(response.status, 200);
    const project = JSON.parse(
      fs.readFileSync(path.join(cwd, ".aurora", "project.json"), "utf8")
    );
    assert.equal(project.product, "New Product");
    assert.deepEqual(project.audience, ["Founders", "Marketers"]);
    assert.deepEqual(project.brand.colors, ["#111111", "#8844ff"]);
  } finally {
    await ui.close();
  }
});

test("Settings UI persists resource availability without installing tools", async () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    schema_version: 1,
    studio: "AurorA Studio",
    default_mode: "direct",
    project: { product: "Demo", purpose: "video", website: "" },
    tools: [],
    integrations: [],
    resources: {
      browser_control: false,
      chatgpt_browser: false,
      google_flow: false,
      meta_ai: false,
      elevenlabs: false,
      local_paths: []
    },
    learning: {
      decision_log: ".aurora/decisions.jsonl",
      lesson_log: ".aurora/lessons.jsonl",
      approved_only: true
    }
  }));
  fs.writeFileSync(path.join(cwd, ".aurora", "project.json"), JSON.stringify({
    schema_version: 1,
    project_id: "demo",
    product: "Demo",
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

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const response = await fetch(`http://127.0.0.1:${ui.port}/api/resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aurora-Token": ui.token
      },
      body: JSON.stringify({
        resources: {
          browser_control: true,
          google_flow: true,
          elevenlabs: true,
          local_paths: ["D:/Assets"]
        }
      })
    });

    assert.equal(response.status, 200);
    const workspace = JSON.parse(
      fs.readFileSync(path.join(cwd, ".aurora", "workspace.json"), "utf8")
    );
    assert.equal(workspace.resources.browser_control, true);
    assert.equal(workspace.resources.google_flow, true);
    assert.equal(workspace.resources.elevenlabs, true);
    assert.deepEqual(workspace.resources.local_paths, ["D:/Assets"]);
  } finally {
    await ui.close();
  }
});
