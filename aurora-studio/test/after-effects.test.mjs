import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildAfterEffectsCommand,
  createAfterEffectsJob,
  runAfterEffectsJob
} from "../src/adapters/after-effects.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-ae-"));
}

test("creates an After Effects job", () => {
  const cwd = temp();
  const result = createAfterEffectsJob("Finish Pass", cwd);
  assert.equal(result.job.id, "finish-pass");
  assert.ok(fs.existsSync(result.file));
});

test("builds aerender arguments", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "project.aep"), "");
  const cmd = buildAfterEffectsCommand({
    schema_version: 1,
    id: "render",
    operation: "render",
    project: "project.aep",
    comp: "Main",
    output: "./render/final.mov",
    start_frame: 1,
    end_frame: 10,
    reuse: false,
    quality: "draft"
  }, cwd);

  assert.equal(cmd.kind, "aerender");
  assert.ok(cmd.args.includes("-project"));
  assert.ok(cmd.args.includes("-comp"));
  assert.ok(cmd.args.includes("Main"));
  assert.ok(cmd.args.includes("-output"));
});

test("dry-run JSX script does not require After Effects", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "setup.jsx"), "// test");
  fs.writeFileSync(path.join(cwd, "job.json"), JSON.stringify({
    schema_version: 1,
    id: "script",
    operation: "script",
    script: "setup.jsx",
    quality: "draft"
  }));

  const result = runAfterEffectsJob("job.json", { cwd, dryRun: true });
  assert.equal(result.dry_run, true);
  assert.equal(result.kind, "afterfx");
  assert.ok(result.args.includes("-r"));
});
