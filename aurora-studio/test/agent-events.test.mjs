import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  agentEventActivity,
  readAgentEvents,
  summarizeAgentPresence
} from "../src/agent-events.mjs";
import { installAgentHooks } from "../src/hook-install.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-agent-events-"));
}

function setupWorkspace(cwd) {
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, ".aurora", "workspace.json"),
    JSON.stringify({
      studio: "AurorA Studio",
      default_mode: "direct",
      project: { product: "Demo", purpose: "video" },
      tools: [],
      resources: {}
    })
  );
}

function runHook(cwd, source, payload) {
  installAgentHooks(source === "claude" ? "claude" : "codex", cwd);
  const hook = path.join(cwd, ".aurora", "hooks", "agent-event.mjs");
  return spawnSync(
    process.execPath,
    [hook, source],
    {
      cwd,
      input: JSON.stringify(payload),
      encoding: "utf8"
    }
  );
}

test("agent event hook stores safe metadata without prompt command or output", () => {
  const cwd = temp();
  setupWorkspace(cwd);

  const result = runHook(cwd, "claude", {
    cwd,
    hook_event_name: "PreToolUse",
    session_id: "session-1",
    tool_name: "Bash",
    tool_input: {
      command: "echo SUPER_SECRET_TOKEN_123",
      file_path: "src/app.js"
    },
    prompt: "this prompt must never be persisted",
    tool_response: "this output must never be persisted"
  });

  assert.equal(result.status, 0, result.stderr);

  const raw = fs.readFileSync(
    path.join(cwd, ".aurora", "agent-events.jsonl"),
    "utf8"
  );

  assert.doesNotMatch(raw, /SUPER_SECRET_TOKEN_123/);
  assert.doesNotMatch(raw, /this prompt must never be persisted/);
  assert.doesNotMatch(raw, /this output must never be persisted/);

  const events = readAgentEvents(cwd);
  assert.equal(events.length, 1);
  assert.equal(events[0].source, "claude");
  assert.equal(events[0].event, "PreToolUse");
  assert.equal(events[0].tool_name, "Bash");
  assert.equal(events[0].workspace_path, "src/app.js");
  assert.match(events[0].summary, /Claude using terminal/);
});

test("agent event hook refuses to persist paths outside workspace", () => {
  const cwd = temp();
  setupWorkspace(cwd);

  const outside = path.join(path.dirname(cwd), "private.txt");
  fs.writeFileSync(outside, "secret");

  try {
    const result = runHook(cwd, "codex", {
      cwd,
      hook_event_name: "PreToolUse",
      session_id: "codex-1",
      tool_name: "Read",
      tool_input: {
        file_path: outside
      }
    });

    assert.equal(result.status, 0, result.stderr);
    const [event] = readAgentEvents(cwd);
    assert.equal(event.workspace_path, null);
    assert.doesNotMatch(JSON.stringify(event), /private\.txt/);
  } finally {
    fs.rmSync(outside, { force: true });
  }
});

test("presence summary distinguishes working waiting idle and offline", () => {
  const now = Date.parse("2026-10-07T08:30:00Z");

  const working = summarizeAgentPresence([
    {
      timestamp: "2026-10-07T08:29:50Z",
      source: "claude",
      state: "working",
      summary: "Claude using terminal",
      tool_name: "Bash",
      session_id: "s1"
    }
  ], { now });

  assert.equal(working.connected, true);
  assert.equal(working.state, "working");
  assert.equal(working.source, "claude");

  const waiting = summarizeAgentPresence([
    {
      timestamp: "2026-10-07T08:29:50Z",
      source: "codex",
      state: "waiting",
      summary: "Codex is waiting for permission"
    }
  ], { now });
  assert.equal(waiting.state, "waiting");

  const idle = summarizeAgentPresence([
    {
      timestamp: "2026-10-07T08:20:00Z",
      source: "claude",
      state: "working",
      summary: "Claude using terminal"
    }
  ], { now });
  assert.equal(idle.connected, true);
  assert.equal(idle.state, "idle");

  const offline = summarizeAgentPresence([
    {
      timestamp: "2026-10-07T08:29:50Z",
      source: "codex",
      state: "offline",
      summary: "Codex session ended"
    }
  ], { now });
  assert.equal(offline.connected, false);
  assert.equal(offline.state, "offline");
});

test("agent event activity is safe and run-aware", () => {
  const activity = agentEventActivity([
    {
      timestamp: "2026-10-07T08:00:00Z",
      source: "claude",
      state: "working",
      summary: "Claude using file read",
      event: "PreToolUse",
      run_id: "run-a"
    },
    {
      timestamp: "2026-10-07T08:01:00Z",
      source: "codex",
      state: "waiting",
      summary: "Codex is waiting for permission",
      event: "PermissionRequest",
      run_id: "run-b"
    }
  ], "run-a");

  assert.equal(activity.length, 1);
  assert.equal(activity[0].title, "Claude");
  assert.equal(activity[0].run_id, "run-a");
});


test("one agent ending does not hide another connected agent", () => {
  const now = Date.parse("2026-10-07T08:30:00Z");

  const presence = summarizeAgentPresence([
    {
      timestamp: "2026-10-07T08:29:55Z",
      source: "claude",
      state: "offline",
      summary: "Claude session ended"
    },
    {
      timestamp: "2026-10-07T08:29:50Z",
      source: "codex",
      state: "working",
      summary: "Codex using file edit",
      tool_name: "Edit"
    }
  ], { now });

  assert.equal(presence.connected, true);
  assert.equal(presence.source, "codex");
  assert.equal(presence.state, "working");
  assert.equal(presence.agents.claude.connected, false);
  assert.equal(presence.agents.codex.connected, true);
});
