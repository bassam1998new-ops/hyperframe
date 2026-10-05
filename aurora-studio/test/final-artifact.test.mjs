import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRun } from "../src/governance.mjs";
import { preserveFinalArtifact } from "../src/final-artifact.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-final-artifact-"));
}

test("approved video is preserved under renders/final with hash receipt", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  const source = path.join(cwd, "draft.mp4");
  fs.writeFileSync(source, "video-one");

  const result = preserveFinalArtifact({
    runId: run.id,
    source: "draft.mp4",
    cwd
  });

  assert.ok(fs.existsSync(result.final_file));
  assert.ok(result.final_file.includes(path.join("renders", "final")));
  assert.equal(result.receipt.sha256.length, 64);
  assert.ok(fs.existsSync(result.receipt_file));
});

test("same final content is idempotent", () => {
  const cwd = temp();
  const run = createRun({ cwd, task: "test", mode: "direct", routeDecision: null });
  fs.writeFileSync(path.join(cwd, "approved.mp4"), "same-video");

  const first = preserveFinalArtifact({
    runId: run.id,
    source: "approved.mp4",
    cwd
  });
  const second = preserveFinalArtifact({
    runId: run.id,
    source: "approved.mp4",
    cwd
  });

  assert.equal(first.final_file, second.final_file);
  assert.equal(first.receipt.copied, true);
  assert.equal(second.receipt.copied, false);
});

test("different file with same name never silently overwrites prior final", () => {
  const cwd = temp();
  const runA = createRun({ cwd, task: "first", mode: "direct", routeDecision: null });
  fs.writeFileSync(path.join(cwd, "final.mp4"), "version-a");
  const first = preserveFinalArtifact({
    runId: runA.id,
    source: "final.mp4",
    cwd
  });

  fs.writeFileSync(path.join(cwd, "final.mp4"), "version-b");
  const runB = createRun({ cwd, task: "second", mode: "direct", routeDecision: null });
  const second = preserveFinalArtifact({
    runId: runB.id,
    source: "final.mp4",
    cwd
  });

  assert.notEqual(first.final_file, second.final_file);
  assert.equal(fs.readFileSync(first.final_file, "utf8"), "version-a");
  assert.equal(fs.readFileSync(second.final_file, "utf8"), "version-b");
});
