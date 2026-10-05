import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildBlenderArgs,
  createBlenderJob,
  runBlenderJob
} from "../src/adapters/blender.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-blender-"));
}

test("creates a minimal Blender job", () => {
  const cwd = temp();
  const result = createBlenderJob("Hero Avatar", cwd);
  assert.equal(result.job.id, "hero-avatar");
  assert.ok(fs.existsSync(result.file));
});

test("builds safe headless render arguments", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "scene.blend"), "");
  const args = buildBlenderArgs({
    schema_version: 1,
    id: "render",
    operation: "render",
    source_blend: "scene.blend",
    script: null,
    output: "./renders/frame_",
    render: { frame: 12, animation: false, format: "PNG" }
  }, cwd);

  assert.equal(args[0], "-b");
  assert.ok(args.includes("-f"));
  assert.ok(args.includes("12"));
  assert.ok(args.includes("-o"));
});

test("dry run does not require Blender installation", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "build.py"), "print('ok')");
  const jobFile = path.join(cwd, "job.json");
  fs.writeFileSync(jobFile, JSON.stringify({
    schema_version: 1,
    id: "script-test",
    operation: "script",
    source_blend: null,
    script: "build.py",
    output: null,
    render: { frame: 1, animation: false, format: null },
    quality: "draft"
  }));

  const result = runBlenderJob("job.json", { cwd, dryRun: true });
  assert.equal(result.dry_run, true);
  assert.ok(result.args.includes("--python"));
});
