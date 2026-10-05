import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { installAgentHooks, removeAgentHooks } from "../src/hook-install.mjs";

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
  assert.equal(handlers.filter(h => String(h.command).includes(".aurora/hooks/session-start.mjs")).length, 1);
  assert.equal(handlers.filter(h => h.command === "echo existing").length, 1);
  assert.ok(fs.existsSync(path.join(cwd, ".aurora", "hooks", "session-start.mjs")));
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
  assert.equal(config.hooks.Stop[0].hooks[0].command, "echo stop");
  assert.equal(config.hooks.SessionStart.length, 1);
  assert.ok(config.hooks.SessionStart[0].hooks[0].commandWindows);
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
