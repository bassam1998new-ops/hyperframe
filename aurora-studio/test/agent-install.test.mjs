import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  installAgentInstructions,
  removeAgentInstructions,
  agentInstructionStatus
} from "../src/agent-install.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-agent-"));
}

test("installer preserves existing agent instructions and is idempotent", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "AGENTS.md"), "# Existing\nKeep me.\n");
  fs.writeFileSync(path.join(cwd, "CLAUDE.md"), "# Existing Claude\n");

  installAgentInstructions("all", cwd);
  installAgentInstructions("all", cwd);

  const agents = fs.readFileSync(path.join(cwd, "AGENTS.md"), "utf8");
  const claude = fs.readFileSync(path.join(cwd, "CLAUDE.md"), "utf8");

  assert.ok(agents.includes("# Existing"));
  assert.equal((agents.match(/AURORA-STUDIO:START/g) || []).length, 1);
  assert.equal((claude.match(/AURORA-STUDIO:START/g) || []).length, 1);
  assert.ok(fs.existsSync(path.join(cwd, ".aurora", "AGENT.md")));
  assert.ok(fs.existsSync(path.join(cwd, ".claude", "skills", "aurora-direct", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(cwd, ".claude", "skills", "aurora-director", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(cwd, ".agents", "skills", "aurora-direct", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(cwd, ".agents", "skills", "aurora-director", "SKILL.md")));
});

test("remove only removes AurorA owned block", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "AGENTS.md"), "# Existing\n");
  installAgentInstructions("codex", cwd);
  removeAgentInstructions("codex", cwd);

  const agents = fs.readFileSync(path.join(cwd, "AGENTS.md"), "utf8");
  assert.ok(agents.includes("# Existing"));
  assert.ok(!agents.includes("AURORA-STUDIO:START"));
});


test("Claude removal deletes only AurorA-owned native skills", () => {
  const cwd = temp();
  const userSkill = path.join(cwd, ".claude", "skills", "user-skill");
  fs.mkdirSync(userSkill, { recursive: true });
  fs.writeFileSync(path.join(userSkill, "SKILL.md"), "# keep");

  installAgentInstructions("claude", cwd);
  const result = removeAgentInstructions("claude", cwd);

  assert.ok(result.native_skills_removed.length >= 1);
  assert.equal(
    fs.existsSync(path.join(cwd, ".claude", "skills", "aurora-direct", "SKILL.md")),
    false
  );
  assert.equal(fs.existsSync(path.join(userSkill, "SKILL.md")), true);
});


test("Codex removal deletes only AurorA-owned native skills", () => {
  const cwd = temp();
  const userSkill = path.join(cwd, ".agents", "skills", "user-skill");
  fs.mkdirSync(userSkill, { recursive: true });
  fs.writeFileSync(path.join(userSkill, "SKILL.md"), "# keep");

  installAgentInstructions("codex", cwd);
  const result = removeAgentInstructions("codex", cwd);

  assert.ok(result.native_skills_removed.length >= 1);
  assert.equal(
    fs.existsSync(path.join(cwd, ".agents", "skills", "aurora-direct", "SKILL.md")),
    false
  );
  assert.equal(fs.existsSync(path.join(userSkill, "SKILL.md")), true);
});


test("agent instruction status reports complete project-local installs", () => {
  const cwd = temp();

  const initial = agentInstructionStatus(cwd);
  assert.equal(initial.claude.complete, false);
  assert.equal(initial.codex.complete, false);
  assert.ok(initial.expected_skill_count >= 1);

  installAgentInstructions("all", cwd);

  const installed = agentInstructionStatus(cwd);
  assert.equal(installed.claude.pointer, true);
  assert.equal(installed.codex.pointer, true);
  assert.equal(installed.claude.complete, true);
  assert.equal(installed.codex.complete, true);
  assert.equal(
    installed.claude.skills.length,
    installed.expected_skill_count
  );
  assert.equal(
    installed.codex.skills.length,
    installed.expected_skill_count
  );

  removeAgentInstructions("claude", cwd);

  const afterRemove = agentInstructionStatus(cwd);
  assert.equal(afterRemove.claude.complete, false);
  assert.equal(afterRemove.codex.complete, true);
});
