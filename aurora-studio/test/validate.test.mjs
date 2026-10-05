import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ensureProjectProfile } from "../src/brain.mjs";
import { validateKnowledge } from "../src/validate.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-validate-"));
}

test("valid brain passes validation", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora", "library"), { recursive: true });
  fs.mkdirSync(path.join(cwd, ".aurora", "references"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    studio: "AurorA Studio",
    default_mode: "direct"
  }));
  ensureProjectProfile({ product: "Demo", purpose: "video" }, cwd);
  fs.writeFileSync(path.join(cwd, ".aurora", "library", "index.jsonl"), "");
  fs.writeFileSync(path.join(cwd, ".aurora", "lessons.jsonl"), "");
  fs.writeFileSync(path.join(cwd, ".aurora", "decisions.jsonl"), "");

  const result = validateKnowledge(cwd);
  assert.equal(result.ok, true);
});

test("corrupt library jsonl blocks validation", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora", "library"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    studio: "AurorA Studio",
    default_mode: "direct"
  }));
  ensureProjectProfile({ product: "Demo", purpose: "video" }, cwd);
  fs.writeFileSync(path.join(cwd, ".aurora", "library", "index.jsonl"), "{bad json}\n");

  const result = validateKnowledge(cwd);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(x => x.includes("Invalid library JSONL")));
});
