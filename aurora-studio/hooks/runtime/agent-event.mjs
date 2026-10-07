import fs from "node:fs";
import path from "node:path";

const SOURCE = ["claude", "codex"].includes(process.argv[2])
  ? process.argv[2]
  : "agent";

const MAX_BYTES = 512 * 1024;
const KEEP_LINES = 500;

function readInput() {
  try {
    const raw = fs.readFileSync(0, "utf8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function activeRun(cwd) {
  const root = path.join(cwd, ".aurora", "runs");
  if (!fs.existsSync(root)) return null;

  const entries = fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
    .reverse();

  for (const id of entries.slice(0, 50)) {
    const state = readJson(path.join(root, id, "state.json"));
    if (state && state.status !== "completed") return id;
  }

  return null;
}

function bounded(value, max = 160) {
  if (value == null) return null;
  const clean = String(value)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return null;
  return clean.slice(0, max);
}

function safeWorkspacePath(cwd, input = {}) {
  const candidate =
    input.file_path ||
    input.path ||
    input.notebook_path ||
    input.file ||
    null;

  if (!candidate || typeof candidate !== "string") return null;

  const resolved = path.isAbsolute(candidate)
    ? path.resolve(candidate)
    : path.resolve(cwd, candidate);

  const relative = path.relative(cwd, resolved);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    return null;
  }

  return relative.split(path.sep).join("/").slice(0, 220);
}

function friendlyTool(tool) {
  const raw = bounded(tool, 120);
  if (!raw) return null;

  const aliases = {
    Bash: "terminal",
    Read: "file read",
    Write: "file write",
    Edit: "file edit",
    Glob: "file search",
    Grep: "text search",
    WebSearch: "web search",
    WebFetch: "web fetch"
  };

  return aliases[raw] || raw
    .replace(/^mcp__/, "")
    .replaceAll("__", " · ")
    .replaceAll("_", " ");
}

function eventState(event, input) {
  if (event === "PermissionRequest") return "waiting";
  if (
    event === "Notification" &&
    [
      "permission_prompt",
      "idle_prompt",
      "agent_needs_input",
      "elicitation_dialog",
      "elicitation_url_dialog"
    ].includes(String(input.notification_type || ""))
  ) {
    return "waiting";
  }

  if (
    ["PostToolUseFailure", "StopFailure", "PermissionDenied"].includes(event)
  ) {
    return "error";
  }

  if (["Stop", "Interrupt"].includes(event)) return "idle";
  if (event === "SessionEnd") return "offline";

  return "working";
}

function summaryFor(event, input, tool, workspacePath) {
  const agent = SOURCE === "claude" ? "Claude" : SOURCE === "codex" ? "Codex" : "Agent";
  const target = tool ? friendlyTool(tool) : null;
  const pathSuffix = workspacePath ? ` · ${workspacePath}` : "";

  switch (event) {
    case "SessionStart":
      return `${agent} session ${bounded(input.source, 40) || "started"}`;
    case "UserPromptSubmit":
      return `${agent} received a new instruction`;
    case "PreToolUse":
      return `${agent} using ${target || "a tool"}${pathSuffix}`;
    case "PostToolUse":
      return `${agent} finished ${target || "a tool"}${pathSuffix}`;
    case "PostToolUseFailure":
      return `${agent} tool failed: ${target || "unknown tool"}`;
    case "PermissionRequest":
      return `${agent} is waiting for permission${target ? `: ${target}` : ""}`;
    case "PermissionDenied":
      return `${agent} permission was denied${target ? `: ${target}` : ""}`;
    case "Notification":
      return `${agent} needs attention`;
    case "SubagentStart":
      return `${agent} started subagent ${bounded(input.agent_type, 80) || "worker"}`;
    case "SubagentStop":
      return `${agent} subagent finished ${bounded(input.agent_type, 80) || "worker"}`;
    case "Stop":
      return `${agent} finished the current turn`;
    case "StopFailure":
      return `${agent} turn failed`;
    case "Interrupt":
      return `${agent} was interrupted`;
    case "SessionEnd":
      return `${agent} session ended`;
    default:
      return `${agent}: ${event || "activity"}`;
  }
}

function rotate(file) {
  try {
    const stat = fs.statSync(file);
    if (stat.size <= MAX_BYTES) return;

    const lines = fs.readFileSync(file, "utf8")
      .split("\n")
      .filter(Boolean)
      .slice(-KEEP_LINES);

    fs.writeFileSync(
      file,
      (lines.length ? lines.join("\n") + "\n" : "")
    );
  } catch {}
}

const input = readInput();
const cwd = path.resolve(input.cwd || process.cwd());
const workspace = readJson(path.join(cwd, ".aurora", "workspace.json"));

if (!workspace || workspace.studio !== "AurorA Studio") process.exit(0);

const event = bounded(input.hook_event_name, 80) || "Unknown";
const tool = bounded(input.tool_name, 120);
const workspacePath = safeWorkspacePath(cwd, input.tool_input || {});

const record = {
  schema_version: 1,
  timestamp: new Date().toISOString(),
  source: SOURCE,
  event,
  state: eventState(event, input),
  session_id: bounded(input.session_id, 160),
  turn_id: bounded(input.turn_id, 160),
  agent_id: bounded(input.agent_id, 160),
  agent_type: bounded(input.agent_type, 120),
  tool_name: tool,
  workspace_path: workspacePath,
  notification_type: bounded(input.notification_type, 80),
  run_id: activeRun(cwd),
  summary: summaryFor(event, input, tool, workspacePath)
};

const file = path.join(cwd, ".aurora", "agent-events.jsonl");
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.appendFileSync(file, JSON.stringify(record) + "\n");
rotate(file);

// Event hooks are observation-only. Do not emit model context or decisions.
process.exit(0);
