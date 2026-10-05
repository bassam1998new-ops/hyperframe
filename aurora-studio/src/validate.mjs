import fs from "node:fs";
import path from "node:path";

function parseJson(file, errors) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON: ${file} — ${error.message}`);
    return null;
  }
}

function validateLibrary(file, errors) {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return;
  raw.split("\n").forEach((line, i) => {
    try {
      const item = JSON.parse(line);
      if (!item.id || !item.name || !item.kind) {
        errors.push(`Library line ${i + 1} missing id/name/kind`);
      }
      if (!item.license || typeof item.license.id !== "string") {
        errors.push(`Library line ${i + 1} missing license metadata`);
      }
    } catch (error) {
      errors.push(`Invalid library JSONL line ${i + 1}: ${error.message}`);
    }
  });
}

function validateReferences(dir, errors) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    const data = parseJson(path.join(dir, name), errors);
    if (!data) continue;
    if (!data.id || !data.name || !data.analysis || !data.adaptation) {
      errors.push(`Reference ${name} is missing required fields`);
    }
  }
}

export function validateKnowledge(cwd = process.cwd()) {
  const root = path.join(cwd, ".aurora");
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(root)) {
    return { ok: false, errors: ["Workspace is not configured. Run: aurora-studio setup"], warnings };
  }

  const workspaceFile = path.join(root, "workspace.json");
  const projectFile = path.join(root, "project.json");

  const workspace = fs.existsSync(workspaceFile) ? parseJson(workspaceFile, errors) : null;
  const project = fs.existsSync(projectFile) ? parseJson(projectFile, errors) : null;

  if (!workspace) errors.push("workspace.json is missing or invalid");
  else {
    if (workspace.studio !== "AurorA Studio") errors.push("workspace.json has invalid studio id");
    if (!["direct", "director"].includes(workspace.default_mode)) errors.push("workspace.json has invalid default_mode");
  }

  if (!project) errors.push("project.json is missing or invalid");
  else {
    if (!project.project_id) errors.push("project.json missing project_id");
    if (!project.brand || !project.content || !project.creative) errors.push("project.json missing brain sections");
  }

  validateLibrary(path.join(root, "library", "index.jsonl"), errors);
  validateReferences(path.join(root, "references"), errors);

  const lessons = path.join(root, "lessons.jsonl");
  const decisions = path.join(root, "decisions.jsonl");
  if (!fs.existsSync(lessons)) warnings.push("lessons.jsonl missing");
  if (!fs.existsSync(decisions)) warnings.push("decisions.jsonl missing");

  return { ok: errors.length === 0, errors, warnings };
}
