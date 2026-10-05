import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRun } from "../src/governance.mjs";
import { createMood, validateMood } from "../src/mood.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-mood-"));
}

test("creates tool-agnostic mood artifact inside run", () => {
  const cwd = temp();
  const run = createRun({
    cwd,
    task: "hero",
    mode: "director",
    routeDecision: null,
    budget: null
  });
  const result = createMood(run.id, cwd);
  assert.equal(result.mood.tool_agnostic, true);
  assert.ok(result.file.endsWith("mood.json"));
});

test("mood validator catches missing intent", () => {
  const result = validateMood({
    schema_version: 1,
    tool_agnostic: true,
    intent: { one_sentence: "" },
    arc: [],
    continuity_anchors: []
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(x => x.includes("one_sentence")));
});

test("mood validator accepts normalized arc", () => {
  const result = validateMood({
    schema_version: 1,
    tool_agnostic: true,
    intent: { one_sentence: "Quiet confidence builds into a clear reveal." },
    arc: [
      { phase: "open", range: [0, 0.4], feeling: "curious", energy: 3, tension: 2 },
      { phase: "payoff", range: [0.4, 1], feeling: "confident", energy: 7, tension: 4 }
    ],
    continuity_anchors: ["single soft key light"]
  });
  assert.equal(result.ok, true);
});
