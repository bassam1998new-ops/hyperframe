import fs from "node:fs";
import path from "node:path";

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function readInput() {
  try {
    const raw = fs.readFileSync(0, "utf8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function activeRun(cwd) {
  const dir = path.join(cwd, ".aurora", "runs");
  if (!fs.existsSync(dir)) return null;

  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
    .reverse();

  for (const id of entries.slice(0, 50)) {
    const state = readJson(path.join(dir, id, "state.json"));
    if (state && state.status !== "completed") {
      return {
        run_id: id,
        task: state.task || null,
        stage: state.current_stage || null,
        status: state.status || null
      };
    }
  }
  return null;
}

function trueKeys(object = {}) {
  return Object.entries(object)
    .filter(([, value]) => value === true)
    .map(([key]) => key);
}

const input = readInput();
const cwd = path.resolve(input.cwd || process.cwd());
const workspace = readJson(path.join(cwd, ".aurora", "workspace.json"));

if (!workspace || workspace.studio !== "AurorA Studio") process.exit(0);

const project = readJson(path.join(cwd, ".aurora", "project.json")) || {};
const discovery = readJson(path.join(cwd, ".aurora", "discovery.json")) || {};
const tools = (workspace.tools || []).filter(tool => tool.available).map(tool => tool.name);
const resources = trueKeys(workspace.resources);
const run = activeRun(cwd);

const counts = discovery.counts || Object.fromEntries(
  Object.entries(discovery.by_kind || {}).map(([key, files]) => [key, Array.isArray(files) ? files.length : 0])
);
const usefulCounts = Object.entries(counts)
  .filter(([, count]) => Number(count) > 0)
  .sort((a, b) => Number(b[1]) - Number(a[1]))
  .slice(0, 8)
  .map(([key, count]) => `${key}=${count}`);

const lines = [
  "AurorA Studio is active for this workspace.",
  `Mode: ${workspace.default_mode || "direct"}.`,
  `Project: ${project.product || workspace.project?.product || "(not set)"}.`,
  `Purpose: ${project.purpose || workspace.project?.purpose || "(not set)"}.`,
  project.website ? `Website: ${project.website}.` : null,
  tools.length ? `Available production tools: ${tools.join(", ")}.` : null,
  resources.length ? `Configured optional resources: ${resources.join(", ")}.` : null,
  usefulCounts.length ? `Local discovery: ${usefulCounts.join(", ")}.` : null,
  run ? `Active AurorA run: ${run.run_id} | stage=${run.stage} | status=${run.status}.` : null,
  "For video, motion, 3D, reference-driven, or creative-asset work: read .aurora/AGENT.md, use AurorA context before planning, search reusable assets/styles before generating, and never route to unavailable optional tools."
].filter(Boolean);

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: lines.join("\n")
  }
}));
