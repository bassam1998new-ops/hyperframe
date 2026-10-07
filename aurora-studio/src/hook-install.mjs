import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_CONTEXT_HOOK = path.resolve(
  HERE,
  "../hooks/runtime/session-start.mjs"
);
const SOURCE_EVENT_HOOK = path.resolve(
  HERE,
  "../hooks/runtime/agent-event.mjs"
);

const CONTEXT_MARKER = ".aurora/hooks/session-start.mjs";
const EVENT_MARKER = ".aurora/hooks/agent-event.mjs";

const CLAUDE_EVENT_HOOKS = [
  "SessionStart",
  "UserPromptSubmit",
  "PreToolUse",
  "PermissionRequest",
  "PostToolUse",
  "PostToolUseFailure",
  "PermissionDenied",
  "Notification",
  "SubagentStart",
  "SubagentStop",
  "TaskCreated",
  "TaskCompleted",
  "Stop",
  "StopFailure",
  "SessionEnd"
];

const CODEX_EVENT_HOOKS = [
  "SessionStart",
  "UserPromptSubmit",
  "PreToolUse",
  "PermissionRequest",
  "PostToolUse",
  "SubagentStart",
  "SubagentStop",
  "Stop",
  "Interrupt",
  "SessionEnd"
];

function readConfig(file) {
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Cannot update invalid JSON config: ${file} — ${error.message}`
    );
  }
}

function writeConfig(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function handlerCommandText(handler) {
  return [
    String(handler?.command || ""),
    String(handler?.commandWindows || "")
  ].join("\n");
}

function isAuroraHandler(handler) {
  if (handler?.type !== "command") return false;
  const command = handlerCommandText(handler);
  return (
    command.includes(CONTEXT_MARKER) ||
    command.includes(EVENT_MARKER) ||
    command.includes(CONTEXT_MARKER.replaceAll("/", "\\")) ||
    command.includes(EVENT_MARKER.replaceAll("/", "\\"))
  );
}

function removeAuroraHandlers(config) {
  if (!config.hooks || typeof config.hooks !== "object") return config;

  for (const [eventName, groups] of Object.entries(config.hooks)) {
    if (!Array.isArray(groups)) continue;

    const keptGroups = groups.flatMap(group => {
      const handlers = Array.isArray(group.hooks) ? group.hooks : [];
      const kept = handlers.filter(handler => !isAuroraHandler(handler));
      if (!kept.length) return [];
      return [{ ...group, hooks: kept }];
    });

    if (keptGroups.length) config.hooks[eventName] = keptGroups;
    else delete config.hooks[eventName];
  }

  if (!Object.keys(config.hooks).length) delete config.hooks;
  return config;
}

function addHook(config, eventName, handler, matcher = null) {
  config.hooks ||= {};
  config.hooks[eventName] ||= [];

  const group = {
    hooks: [handler]
  };

  if (matcher) group.matcher = matcher;
  config.hooks[eventName].push(group);
}

function copyRuntimeHooks(cwd) {
  const dir = path.join(cwd, ".aurora", "hooks");
  fs.mkdirSync(dir, { recursive: true });

  const context = path.join(dir, "session-start.mjs");
  const events = path.join(dir, "agent-event.mjs");

  fs.copyFileSync(SOURCE_CONTEXT_HOOK, context);
  fs.copyFileSync(SOURCE_EVENT_HOOK, events);

  return { context, events };
}

function claudeEventHandler() {
  return {
    type: "command",
    command:
      'node "${CLAUDE_PROJECT_DIR}/.aurora/hooks/agent-event.mjs" claude',
    timeout: 5,
    async: true
  };
}

function codexEventHandler() {
  return {
    type: "command",
    command: "node .aurora/hooks/agent-event.mjs codex",
    commandWindows: "node .aurora\\hooks\\agent-event.mjs codex",
    timeout: 5,
    async: true
  };
}

function installClaude(cwd) {
  const file = path.join(cwd, ".claude", "settings.json");
  const config = readConfig(file);
  removeAuroraHandlers(config);

  addHook(
    config,
    "SessionStart",
    {
      type: "command",
      command:
        'node "${CLAUDE_PROJECT_DIR}/.aurora/hooks/session-start.mjs"',
      timeout: 10
    },
    "startup|resume|clear|compact"
  );

  for (const eventName of CLAUDE_EVENT_HOOKS) {
    addHook(config, eventName, claudeEventHandler());
  }

  writeConfig(file, config);
  return file;
}

function installCodex(cwd) {
  const file = path.join(cwd, ".codex", "hooks.json");
  const config = readConfig(file);
  if (!config.description) {
    config.description =
      "Project hooks including AurorA Studio context and live activity.";
  }

  removeAuroraHandlers(config);

  addHook(
    config,
    "SessionStart",
    {
      type: "command",
      command: "node .aurora/hooks/session-start.mjs",
      commandWindows: "node .aurora\\hooks\\session-start.mjs",
      timeout: 10,
      statusMessage: "Loading AurorA Studio context",
      additionalContextLimit: 6000
    },
    "startup|resume|clear|compact"
  );

  for (const eventName of CODEX_EVENT_HOOKS) {
    addHook(config, eventName, codexEventHandler());
  }

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

function hasMarker(file, marker) {
  if (!fs.existsSync(file)) return false;

  try {
    const config = readConfig(file);
    const hooks = config.hooks || {};

    return Object.values(hooks).some(groups =>
      (Array.isArray(groups) ? groups : []).some(group =>
        (Array.isArray(group.hooks) ? group.hooks : []).some(handler => {
          const command = handlerCommandText(handler);
          return (
            command.includes(marker) ||
            command.includes(marker.replaceAll("/", "\\"))
          );
        })
      )
    );
  } catch {
    return false;
  }
}

export function installAgentHooks(
  target = "all",
  cwd = process.cwd()
) {
  if (!["all", "claude", "codex"].includes(target)) {
    throw new Error(
      "Hook target must be all, claude, or codex."
    );
  }

  const runtime = copyRuntimeHooks(cwd);
  const files = [];

  if (target === "all" || target === "claude") {
    files.push(installClaude(cwd));
  }

  if (target === "all" || target === "codex") {
    files.push(installCodex(cwd));
  }

  return {
    runtime: runtime.context,
    event_runtime: runtime.events,
    files,
    trust_review_required: true,
    note:
      "Project hooks are installed. Live activity hooks are observation-only, asynchronous, and store sanitized metadata without prompt/tool output."
  };
}

export function removeAgentHooks(
  target = "all",
  cwd = process.cwd()
) {
  if (!["all", "claude", "codex"].includes(target)) {
    throw new Error(
      "Hook target must be all, claude, or codex."
    );
  }

  const changed = [];

  if (
    (target === "all" || target === "claude") &&
    removeFrom(path.join(cwd, ".claude", "settings.json"))
  ) {
    changed.push(path.join(cwd, ".claude", "settings.json"));
  }

  if (
    (target === "all" || target === "codex") &&
    removeFrom(path.join(cwd, ".codex", "hooks.json"))
  ) {
    changed.push(path.join(cwd, ".codex", "hooks.json"));
  }

  return { changed };
}

export function agentHookStatus(cwd = process.cwd()) {
  const contextRuntime = path.join(
    cwd,
    ".aurora",
    "hooks",
    "session-start.mjs"
  );
  const eventRuntime = path.join(
    cwd,
    ".aurora",
    "hooks",
    "agent-event.mjs"
  );

  const claudeFile = path.join(cwd, ".claude", "settings.json");
  const codexFile = path.join(cwd, ".codex", "hooks.json");

  return {
    runtime: fs.existsSync(contextRuntime),
    event_runtime: fs.existsSync(eventRuntime),
    claude: hasMarker(claudeFile, CONTEXT_MARKER),
    codex: hasMarker(codexFile, CONTEXT_MARKER),
    claude_live: hasMarker(claudeFile, EVENT_MARKER),
    codex_live: hasMarker(codexFile, EVENT_MARKER)
  };
}
