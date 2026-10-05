import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRun } from "../src/governance.mjs";
import { createMood, readMood } from "../src/mood.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-mood-"));
}

const routeDecision = {
  selected: { route: ["hyperframe"], score: 8 },
  confidence: 0.8,
  candidates: []
};

test("creates one tool-agnostic mood artifact per run", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "launch", mode: "director", routeDecision });
  const result = createMood(run.id, cwd);

  assert.equal(result.created, true);
  assert.equal(result.mood.tool_agnostic, true);
  assert.equal(result.mood.arc.length, 4);

  const second = createMood(run.id, cwd);
  assert.equal(second.created, false);
  assert.equal(readMood(run.id, cwd).mood.run_id, run.id);
});
