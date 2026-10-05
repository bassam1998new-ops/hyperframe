import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_HOOK = path.resolve(HERE, "../hooks/runtime/session-start.mjs");
const HOOK_MARKER = ".aurora/hooks/session-start.mjs";

function readConfig(file) {
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Cannot update invalid JSON config: ${file} — ${error.message}`);
  }
}

function writeConfig(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function removeAuroraHandlers(config) {
  if (!config.hooks || typeof config.hooks !== "object") return config;

  const groups = Array.isArray(config.hooks.SessionStart) ? config.hooks.SessionStart : [];
  config.hooks.SessionStart = groups.flatMap(group => {
    const handlers = Array.isArray(group.hooks) ? group.hooks : [];
    const kept = handlers.filter(handler =>
      !(handler?.type === "command" && String(handler.command || "").includes(HOOK_MARKER))
    );
    if (!kept.length) return [];
    return [{ ...group, hooks: kept }];
  });

  if (!config.hooks.SessionStart.length) delete config.hooks.SessionStart;
  if (!Object.keys(config.hooks).length) delete config.hooks;
  return config;
}

function addSessionStart(config, handler) {
  removeAuroraHandlers(config);
  config.hooks ||= {};
  config.hooks.SessionStart ||= [];
  config.hooks.SessionStart.push({
    matcher: "startup|resume|clear|compact",
    hooks: [handler]
  });
  return config;
}

function copyRuntimeHook(cwd) {
  const dir = path.join(cwd, ".aurora", "hooks");
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, "session-start.mjs");
  fs.copyFileSync(SOURCE_HOOK, target);
  return target;
}

function installClaude(cwd) {
  const file = path.join(cwd, ".claude", "settings.json");
  const config = readConfig(file);
  addSessionStart(config, {
    type: "command",
    command: 'node "${CLAUDE_PROJECT_DIR}/.aurora/hooks/session-start.mjs"',
    timeout: 10
  });
  writeConfig(file, config);
  return file;
}

function installCodex(cwd) {
  const file = path.join(cwd, ".codex", "hooks.json");
  const config = readConfig(file);
  if (!config.description) config.description = "Project hooks including AurorA Studio context.";
  addSessionStart(config, {
    type: "command",
    command: "node .aurora/hooks/session-start.mjs",
    commandWindows: "node .aurora\\hooks\\session-start.mjs",
    timeout: 10,
    statusMessage: "Loading AurorA Studio context",
    additionalContextLimit: 6000
  });
  writeConfig(file, config);
  return file;
}

function removeFrom(file) {
  if (!fs.existsSync(file)) return false;
  const config = readConfig(file);
  const before = JSON.stringify(config);
  removeAuroraHandlers(config);
  const after = JSON.stringify(config);
  if (before === after) return false;
  writeConfig(file, config);
  return true;
}

export function installAgentHooks(target = "all", cwd = process.cwd()) {
  if (!["all", "claude", "codex"].includes(target)) {
    throw new Error("Hook target must be all, claude, or codex.");
  }

  const runtime = copyRuntimeHook(cwd);
  const files = [];

  if (target === "all" || target === "claude") files.push(installClaude(cwd));
  if (target === "all" || target === "codex") files.push(installCodex(cwd));

  return {
    runtime,
    files,
    trust_review_required: true,
    note: "Project hooks are installed. Claude/Codex apply their normal workspace/hook trust rules before running them."
  };
}

export function removeAgentHooks(target = "all", cwd = process.cwd()) {
  if (!["all", "claude", "codex"].includes(target)) {
    throw new Error("Hook target must be all, claude, or codex.");
  }

  const changed = [];
  if ((target === "all" || target === "claude") && removeFrom(path.join(cwd, ".claude", "settings.json"))) {
    changed.push(path.join(cwd, ".claude", "settings.json"));
  }
  if ((target === "all" || target === "codex") && removeFrom(path.join(cwd, ".codex", "hooks.json"))) {
    changed.push(path.join(cwd, ".codex", "hooks.json"));
  }

  return { changed };
}
