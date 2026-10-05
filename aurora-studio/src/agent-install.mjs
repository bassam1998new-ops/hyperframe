import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_GUIDE = path.resolve(HERE, "../prompts/AGENT-START.md");
const SOURCE_AGENT_SKILLS = path.resolve(HERE, "../agent-skills");
const START = "<!-- AURORA-STUDIO:START -->";
const END = "<!-- AURORA-STUDIO:END -->";

function replaceOwnedBlock(existing, block) {
  const start = existing.indexOf(START);
  const end = existing.indexOf(END);
  if (start >= 0 && end > start) {
    return existing.slice(0, start) + block + existing.slice(end + END.length);
  }
  const prefix = existing.trimEnd();
  return (prefix ? prefix + "\n\n" : "") + block + "\n";
}

function writeGuide(cwd) {
  const aurora = path.join(cwd, ".aurora");
  fs.mkdirSync(aurora, { recursive: true });
  const target = path.join(aurora, "AGENT.md");
  fs.copyFileSync(SOURCE_GUIDE, target);
  return target;
}

function installPointer(file, block) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const next = replaceOwnedBlock(existing, block);
  fs.writeFileSync(file, next);
  return file;
}

function ownedSkillNames() {
  if (!fs.existsSync(SOURCE_AGENT_SKILLS)) return [];
  return fs.readdirSync(SOURCE_AGENT_SKILLS, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.startsWith("aurora-"))
    .map(entry => entry.name)
    .sort();
}

function syncClaudeSkills(cwd) {
  const targetRoot = path.join(cwd, ".claude", "skills");
  fs.mkdirSync(targetRoot, { recursive: true });
  const installed = [];

  for (const name of ownedSkillNames()) {
    const source = path.join(SOURCE_AGENT_SKILLS, name);
    const target = path.join(targetRoot, name);
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(source, target, { recursive: true });
    installed.push(target);
  }

  return installed;
}

function removeClaudeSkills(cwd) {
  const removed = [];
  for (const name of ownedSkillNames()) {
    const target = path.join(cwd, ".claude", "skills", name);
    if (!fs.existsSync(target)) continue;
    fs.rmSync(target, { recursive: true, force: true });
    removed.push(target);
  }
  return removed;
}

export function installAgentInstructions(target = "all", cwd = process.cwd()) {
  if (!["all", "claude", "codex"].includes(target)) {
    throw new Error("Agent target must be all, claude, or codex.");
  }

  const guide = writeGuide(cwd);
  const files = [];
  const native_skills = [];

  if (target === "all" || target === "claude") {
    files.push(installPointer(path.join(cwd, "CLAUDE.md"), [
      START,
      "# AurorA Studio",
      "@.aurora/AGENT.md",
      END
    ].join("\n")));
    native_skills.push(...syncClaudeSkills(cwd));
  }

  if (target === "all" || target === "codex") {
    files.push(installPointer(path.join(cwd, "AGENTS.md"), [
      START,
      "## AurorA Studio",
      "For video, motion, 3D, creative-asset, or reference-driven video work, read .aurora/AGENT.md before acting. Keep normal coding tasks unaffected.",
      END
    ].join("\n")));
  }

  return { guide, files, native_skills };
}

export function removeAgentInstructions(target = "all", cwd = process.cwd()) {
  if (!["all", "claude", "codex"].includes(target)) {
    throw new Error("Agent target must be all, claude, or codex.");
  }

  const files = [];
  if (target === "all" || target === "claude") files.push(path.join(cwd, "CLAUDE.md"));
  if (target === "all" || target === "codex") files.push(path.join(cwd, "AGENTS.md"));

  const changed = [];
  const native_skills_removed =
    target === "all" || target === "claude"
      ? removeClaudeSkills(cwd)
      : [];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const existing = fs.readFileSync(file, "utf8");
    const start = existing.indexOf(START);
    const end = existing.indexOf(END);
    if (start < 0 || end <= start) continue;
    const next = (existing.slice(0, start) + existing.slice(end + END.length)).trim();
    fs.writeFileSync(file, next ? next + "\n" : "");
    changed.push(file);
  }
  return { changed, native_skills_removed };
}
