import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { installAgentHooks } from "../src/hook-install.mjs";
import { buildStudioSnapshot } from "../src/ui-data.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-ui-agent-"));
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
        product: "Demo",
        purpose: "video",
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
}

test("Studio reports bridge ready when live hooks are installed", () => {
  const cwd = temp();
  writeWorkspace(cwd);
  installAgentHooks("claude", cwd);

  const snapshot = buildStudioSnapshot(cwd);

  assert.equal(snapshot.agent.bridge_ready, true);
  assert.equal(snapshot.agent.bridge_connected, false);
  assert.equal(snapshot.agent.claude_live, true);
  assert.equal(snapshot.settings.agents.claude.live_hook, true);
});

test("Studio shows recent live agent event in presence and activity", () => {
  const cwd = temp();
  writeWorkspace(cwd);
  installAgentHooks("claude", cwd);

  fs.writeFileSync(
    path.join(cwd, ".aurora", "agent-events.jsonl"),
    JSON.stringify({
      schema_version: 1,
      timestamp: new Date().toISOString(),
      source: "claude",
      event: "PreToolUse",
      state: "working",
      session_id: "session-live",
      tool_name: "Edit",
      workspace_path: "src/app.js",
      run_id: null,
      summary: "Claude using file edit · src/app.js"
    }) + "\n"
  );

  const snapshot = buildStudioSnapshot(cwd);

  assert.equal(snapshot.agent.bridge_connected, true);
  assert.equal(snapshot.agent.state, "working");
  assert.equal(snapshot.agent.source, "claude");
  assert.equal(snapshot.agent.tool_name, "Edit");
  assert.match(snapshot.agent.summary, /src\/app\.js/);

  const live = snapshot.activity.find(item => item.type === "agent_event");
  assert.ok(live);
  assert.equal(live.title, "Claude");
  assert.match(live.detail, /file edit/);
});
