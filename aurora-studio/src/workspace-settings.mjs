import fs from "node:fs";
import path from "node:path";

const TOOL_PATH_KEYS = new Set([
  "blender",
  "after_effects",
  "ffmpeg"
]);

const BUDGET_MODES = new Set([
  "observe",
  "warn",
  "cap"
]);

function workspaceFile(cwd = process.cwd()) {
  return path.join(cwd, ".aurora", "workspace.json");
}

export function readWorkspaceSettings(cwd = process.cwd()) {
  const file = workspaceFile(cwd);
  if (!fs.existsSync(file)) {
    throw new Error("Workspace is not configured.");
  }

  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeWorkspaceSettings(workspace, cwd = process.cwd()) {
  const file = workspaceFile(cwd);
  workspace.updated_at = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(workspace, null, 2) + "\n");
  return workspace;
}

export function defaultBudgetPolicy() {
  return {
    mode: "observe",
    cap_usd: null,
    approval_threshold_usd: 1
  };
}

export function normalizeBudgetPolicy(input = {}) {
  const mode = BUDGET_MODES.has(input.mode)
    ? input.mode
    : "observe";

  const threshold = Number(input.approval_threshold_usd ?? 1);
  if (!Number.isFinite(threshold) || threshold < 0) {
    throw new Error("Budget approval threshold must be a non-negative USD amount.");
  }

  let cap = input.cap_usd;
  if (cap === "" || cap === undefined || cap === null) {
    cap = null;
  } else {
    cap = Number(cap);
    if (!Number.isFinite(cap) || cap < 0) {
      throw new Error("Budget cap must be a non-negative USD amount.");
    }
  }

  if (mode === "cap" && cap === null) {
    throw new Error("Hard-cap budget mode requires a USD cap.");
  }

  return {
    mode,
    cap_usd: cap,
    approval_threshold_usd: Number(threshold.toFixed(4))
  };
}

export function updateBudgetPolicy(
  input,
  cwd = process.cwd()
) {
  const workspace = readWorkspaceSettings(cwd);
  workspace.budget = normalizeBudgetPolicy(input);
  writeWorkspaceSettings(workspace, cwd);
  return workspace.budget;
}

export function workspaceToolPaths(cwd = process.cwd()) {
  try {
    const workspace = readWorkspaceSettings(cwd);
    return {
      blender: workspace.tool_paths?.blender || null,
      after_effects: workspace.tool_paths?.after_effects || null,
      ffmpeg: workspace.tool_paths?.ffmpeg || null
    };
  } catch {
    return {
      blender: null,
      after_effects: null,
      ffmpeg: null
    };
  }
}

export function configuredToolPath(
  key,
  cwd = process.cwd()
) {
  if (!TOOL_PATH_KEYS.has(key)) return null;
  return workspaceToolPaths(cwd)[key] || null;
}

function normalizePathValue(value, cwd) {
  const text = String(value || "").trim();
  if (!text) return null;

  const resolved = path.isAbsolute(text)
    ? path.resolve(text)
    : path.resolve(cwd, text);

  if (!fs.existsSync(resolved)) {
    throw new Error("Configured tool path does not exist: " + text);
  }

  return resolved;
}

export function updateToolPaths(
  input,
  cwd = process.cwd()
) {
  const workspace = readWorkspaceSettings(cwd);
  const next = {
    ...(workspace.tool_paths || {})
  };

  for (const [key, value] of Object.entries(input || {})) {
    if (!TOOL_PATH_KEYS.has(key)) {
      throw new Error("Unsupported tool-path setting: " + key);
    }

    next[key] = normalizePathValue(value, cwd);
  }

  workspace.tool_paths = {
    blender: next.blender || null,
    after_effects: next.after_effects || null,
    ffmpeg: next.ffmpeg || null
  };

  writeWorkspaceSettings(workspace, cwd);
  return workspace.tool_paths;
}
