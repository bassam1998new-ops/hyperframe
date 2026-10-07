import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  installAgentHooks,
  removeAgentHooks,
  agentHookStatus
} from "../src/hook-install.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-hooks-"));
}

test("hook installer preserves existing Claude settings and is idempotent", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".claude"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".claude", "settings.json"), JSON.stringify({
    permissions: { allow: ["Read"] },
    hooks: {
      SessionStart: [{
        matcher: "startup",
        hooks: [{ type: "command", command: "echo existing" }]
      }]
    }
  }));

  installAgentHooks("claude", cwd);
  installAgentHooks("claude", cwd);

  const config = JSON.parse(fs.readFileSync(path.join(cwd, ".claude", "settings.json"), "utf8"));
  assert.deepEqual(config.permissions, { allow: ["Read"] });
  const handlers = config.hooks.SessionStart.flatMap(group => group.hooks);
  assert.equal(
    handlers.filter(h =>
      String(h.command).includes(".aurora/hooks/session-start.mjs")
    ).length,
    1
  );
  assert.equal(
    handlers.filter(h =>
      String(h.command).includes(".aurora/hooks/agent-event.mjs")
    ).length,
    1
  );
  assert.equal(
    handlers.filter(h => h.command === "echo existing").length,
    1
  );
  assert.ok(
    fs.existsSync(path.join(cwd, ".aurora", "hooks", "session-start.mjs"))
  );
  assert.ok(
    fs.existsSync(path.join(cwd, ".aurora", "hooks", "agent-event.mjs"))
  );
});

test("hook installer preserves existing Codex hooks", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".codex"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".codex", "hooks.json"), JSON.stringify({
    hooks: {
      Stop: [{ hooks: [{ type: "command", command: "echo stop" }] }]
    }
  }));

  installAgentHooks("codex", cwd);
  const config = JSON.parse(fs.readFileSync(path.join(cwd, ".codex", "hooks.json"), "utf8"));
  assert.equal(
    config.hooks.Stop
      .flatMap(group => group.hooks)
      .filter(handler => handler.command === "echo stop")
      .length,
    1
  );
  assert.equal(config.hooks.SessionStart.length, 2);
  assert.ok(config.hooks.SessionStart[0].hooks[0].commandWindows);
  assert.ok(
    config.hooks.PostToolUse
      .flatMap(group => group.hooks)
      .some(handler =>
        String(handler.command).includes(".aurora/hooks/agent-event.mjs")
      )
  );
});

test("remove hooks removes only AurorA handlers", () => {
  const cwd = temp();
  installAgentHooks("all", cwd);
  const result = removeAgentHooks("all", cwd);
  assert.equal(result.changed.length, 2);

  const claude = JSON.parse(fs.readFileSync(path.join(cwd, ".claude", "settings.json"), "utf8"));
  const codex = JSON.parse(fs.readFileSync(path.join(cwd, ".codex", "hooks.json"), "utf8"));
  assert.ok(!claude.hooks?.SessionStart);
  assert.ok(!codex.hooks?.SessionStart);
});


test("Codex hook command is quote-free on Windows", () => {
  const cwd = temp();
  installAgentHooks("codex", cwd);

  const config = JSON.parse(
    fs.readFileSync(path.join(cwd, ".codex", "hooks.json"), "utf8")
  );
  const handler = config.hooks.SessionStart[0].hooks[0];

  assert.equal(handler.command, "node .aurora/hooks/session-start.mjs");
  assert.equal(handler.commandWindows, "node .aurora\\hooks\\session-start.mjs");
  assert.doesNotMatch(handler.commandWindows, /["']/);
  assert.doesNotMatch(handler.commandWindows, /git rev-parse/);
});

test("Codex hook command runs from workspace cwd and returns context", () => {
  const cwd = temp();
  installAgentHooks("codex", cwd);

  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, ".aurora", "workspace.json"),
    JSON.stringify({
      studio: "AurorA Studio",
      default_mode: "direct",
      project: {
        product: "Hook Product",
        purpose: "video"
      },
      tools: [],
      resources: {}
    })
  );
  fs.writeFileSync(
    path.join(cwd, ".aurora", "project.json"),
    JSON.stringify({
      product: "Hook Product",
      purpose: "video"
    })
  );

  const config = JSON.parse(
    fs.readFileSync(path.join(cwd, ".codex", "hooks.json"), "utf8")
  );
  const handler = config.hooks.SessionStart[0].hooks[0];
  const command = process.platform === "win32"
    ? handler.commandWindows
    : handler.command;

  const input = JSON.stringify({
    cwd,
    hook_event_name: "SessionStart",
    model: "test",
    permission_mode: "default",
    session_id: "test",
    source: "startup",
    transcript_path: null
  });

  const result = spawnSync(command, {
    cwd,
    input,
    encoding: "utf8",
    shell: true
  });

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(output.hookSpecificOutput.additionalContext, /Hook Product/);
});


test("agent hook status reports Claude Codex and runtime independently", () => {
  const cwd = temp();

  assert.deepEqual(agentHookStatus(cwd), {
    runtime: false,
    event_runtime: false,
    claude: false,
    codex: false,
    claude_live: false,
    codex_live: false
  });

  installAgentHooks("claude", cwd);

  assert.deepEqual(agentHookStatus(cwd), {
    runtime: true,
    event_runtime: true,
    claude: true,
    codex: false,
    claude_live: true,
    codex_live: false
  });

  installAgentHooks("codex", cwd);

  assert.deepEqual(agentHookStatus(cwd), {
    runtime: true,
    event_runtime: true,
    claude: true,
    codex: true,
    claude_live: true,
    codex_live: true
  });

  removeAgentHooks("claude", cwd);

  assert.deepEqual(agentHookStatus(cwd), {
    runtime: true,
    event_runtime: true,
    claude: false,
    codex: true,
    claude_live: false,
    codex_live: true
  });
});


test("live hooks are asynchronous and observation-only", () => {
  const cwd = temp();
  installAgentHooks("all", cwd);

  for (const file of [
    path.join(cwd, ".claude", "settings.json"),
    path.join(cwd, ".codex", "hooks.json")
  ]) {
    const config = JSON.parse(fs.readFileSync(file, "utf8"));
    const handlers = Object.values(config.hooks || {})
      .flatMap(groups => Array.isArray(groups) ? groups : [])
      .flatMap(group => Array.isArray(group.hooks) ? group.hooks : [])
      .filter(handler =>
        String(handler.command || "").includes("agent-event.mjs")
      );

    assert.ok(handlers.length >= 5);
    assert.ok(handlers.every(handler => handler.async === true));
    assert.ok(handlers.every(handler => handler.type === "command"));
  }
});

test("removing AurorA hooks preserves unrelated user hooks across events", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".claude"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, ".claude", "settings.json"),
    JSON.stringify({
      hooks: {
        Stop: [{
          hooks: [{ type: "command", command: "echo user-stop" }]
        }],
        PostToolUse: [{
          hooks: [{ type: "command", command: "echo user-post" }]
        }]
      }
    })
  );

  installAgentHooks("claude", cwd);
  removeAgentHooks("claude", cwd);

  const config = JSON.parse(
    fs.readFileSync(path.join(cwd, ".claude", "settings.json"), "utf8")
  );

  const commands = Object.values(config.hooks || {})
    .flatMap(groups => Array.isArray(groups) ? groups : [])
    .flatMap(group => Array.isArray(group.hooks) ? group.hooks : [])
    .map(handler => handler.command);

  assert.ok(commands.includes("echo user-stop"));
  assert.ok(commands.includes("echo user-post"));
  assert.ok(!commands.some(command =>
    String(command).includes(".aurora/hooks/")
  ));
});
