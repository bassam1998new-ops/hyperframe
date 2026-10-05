import fs from "node:fs";
import path from "node:path";
import { syncSystemKnowledge } from "./system-install.mjs";
import { ensureProjectProfile, writeProject } from "./brain.mjs";
import { readLibrary } from "./library.mjs";
import { saveDiscovery } from "./discovery.mjs";
import { importHyperframeLibrary } from "./importers/hyperframe.mjs";
import { installAgentInstructions } from "./agent-install.mjs";
import { installAgentHooks } from "./hook-install.mjs";
import { ensureWorkspacePrivacyFiles } from "./workspace-privacy.mjs";
import {
  installHyperframesCore,
  resolveHyperframesBinary
} from "./tool-install.mjs";

const AGENT_TARGETS = new Set(["none", "all", "claude", "codex"]);
const MODES = new Set(["direct", "director"]);
const RESOURCE_KEYS = [
  "browser_control",
  "chatgpt_browser",
  "google_flow",
  "meta_ai",
  "elevenlabs"
];

function readExistingWorkspace(cwd) {
  const file = path.join(cwd, ".aurora", "workspace.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalizeConfig(config = {}) {
  const mode = config.mode == null ? null : String(config.mode).toLowerCase();
  const agents = String(config.agents || "all").toLowerCase();

  if (mode !== null && !MODES.has(mode)) {
    throw new Error("Configured setup mode must be direct or director.");
  }
  if (!AGENT_TARGETS.has(agents)) {
    throw new Error("Configured setup agents must be none, all, claude, or codex.");
  }

  const resources = {};
  for (const key of RESOURCE_KEYS) {
    resources[key] = Object.prototype.hasOwnProperty.call(config.resources || {}, key)
      ? Boolean(config.resources[key])
      : null;
  }

  const local_paths = Array.isArray(config.local_paths)
    ? [...new Set(config.local_paths.map(value => String(value || "").trim()).filter(Boolean))]
    : null;

  return {
    product: String(config.product || "").trim(),
    purpose: String(config.purpose || "").trim(),
    website: String(config.website || "").trim(),
    mode,
    resources,
    local_paths,
    agents,
    install_hyperframes: config.install_hyperframes !== false
  };
}

export function readSetupConfig(file, cwd = process.cwd()) {
  const resolved = path.resolve(cwd, file);
  if (!fs.existsSync(resolved)) throw new Error(`Setup config not found: ${file}`);

  let value;
  try {
    value = JSON.parse(fs.readFileSync(resolved, "utf8"));
  } catch (error) {
    throw new Error(`Setup config is invalid JSON: ${error.message}`);
  }

  return { config: normalizeConfig(value), file: resolved };
}

export function writeConfiguredWorkspace(configInput, {
  cwd = process.cwd(),
  installHyperframesImpl = installHyperframesCore
} = {}) {
  const config = normalizeConfig(configInput);
  const aurora = path.join(cwd, ".aurora");
  fs.mkdirSync(path.join(aurora, "styles"), { recursive: true });
  fs.mkdirSync(path.join(aurora, "library"), { recursive: true });
  fs.mkdirSync(path.join(aurora, "temp"), { recursive: true });
  fs.mkdirSync(path.join(aurora, "references"), { recursive: true });
  ensureWorkspacePrivacyFiles(cwd);

  const existing = readExistingWorkspace(cwd);
  const now = new Date().toISOString();

  const workspace = {
    schema_version: 1,
    studio: "AurorA Studio",
    created_at: existing?.created_at || now,
    updated_at: now,
    default_mode: config.mode || existing?.default_mode || "direct",
    project: {
      product: config.product || existing?.project?.product || "",
      purpose: config.purpose || existing?.project?.purpose || "",
      website: config.website || existing?.project?.website || ""
    },
    tools: existing?.tools || [],
    integrations: existing?.integrations || [],
    resources: {
      ...RESOURCE_KEYS.reduce((acc, key) => {
        acc[key] = config.resources[key] ?? existing?.resources?.[key] ?? false;
        return acc;
      }, {}),
      local_paths: config.local_paths ?? existing?.resources?.local_paths ?? []
    },
    learning: {
      decision_log: ".aurora/decisions.jsonl",
      lesson_log: ".aurora/lessons.jsonl",
      approved_only: true
    }
  };

  fs.writeFileSync(
    path.join(aurora, "workspace.json"),
    JSON.stringify(workspace, null, 2) + "\n"
  );

  const system = syncSystemKnowledge(cwd);

  const project = ensureProjectProfile({
    product: workspace.project.product,
    purpose: workspace.project.purpose,
    website: workspace.project.website
  }, cwd);
  project.product = workspace.project.product;
  project.purpose = workspace.project.purpose;
  project.website = workspace.project.website;
  project.claims_to_protect ||= [];
  project.sources ||= [];
  writeProject(project, cwd);

  readLibrary(cwd);
  const discovery = saveDiscovery(cwd, {
    extraRoots: workspace.resources.local_paths
  });

  for (const log of ["decisions.jsonl", "lessons.jsonl", "learning-proposals.jsonl"]) {
    const file = path.join(aurora, log);
    if (!fs.existsSync(file)) fs.writeFileSync(file, "");
  }

  const styleReadme = path.join(aurora, "styles", "README.md");
  if (!fs.existsSync(styleReadme)) {
    fs.writeFileSync(
      styleReadme,
      "# Workspace styles\n\nOnly save styles that were useful, approved, or intentionally kept for reuse.\n"
    );
  }

  try {
    importHyperframeLibrary({ cwd });
  } catch {
    // Fine in workspaces that do not contain the HyperFrames source library.
  }

  let hyperframes_install = null;
  if (config.install_hyperframes && !resolveHyperframesBinary(cwd).available) {
    hyperframes_install = installHyperframesImpl({ cwd });
  }

  let agent_setup = null;
  if (config.agents !== "none") {
    agent_setup = {
      instructions: installAgentInstructions(config.agents, cwd),
      hooks: installAgentHooks(config.agents, cwd)
    };
  }

  return {
    workspace_file: path.join(aurora, "workspace.json"),
    project_file: path.join(aurora, "project.json"),
    system,
    discovery: {
      file: discovery.file,
      matched_files: discovery.result.matched_files,
      truncated: discovery.result.truncated
    },
    hyperframes_install,
    agent_setup
  };
}
