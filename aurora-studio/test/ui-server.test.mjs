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
