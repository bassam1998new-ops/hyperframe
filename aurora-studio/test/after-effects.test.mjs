import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildAfterEffectsCommand,
  createAfterEffectsJob,
  discoverAfterEffectsInstall,
  findAfterEffects,
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


test("detects a standard Windows After Effects install outside PATH", () => {
  const root = temp();
  const programFiles = path.join(root, "Program Files");
  const support = path.join(
    programFiles,
    "Adobe",
    "Adobe After Effects 2026",
    "Support Files"
  );
  const afterfx = path.join(support, "AfterFX.exe");
  const aerender = path.join(support, "aerender.exe");
  fs.mkdirSync(support, { recursive: true });
  fs.writeFileSync(afterfx, "");
  fs.writeFileSync(aerender, "");

  const discovered = discoverAfterEffectsInstall({
    platform: "win32",
    env: { ProgramFiles: programFiles }
  });

  assert.equal(discovered.afterfx, afterfx);
  assert.equal(discovered.aerender, aerender);

  const resolved = findAfterEffects({
    platform: "win32",
    env: { ProgramFiles: programFiles },
    skipPathLookup: true
  });

  assert.equal(resolved.afterfx, afterfx);
  assert.equal(resolved.aerender, aerender);
});

test("configured After Effects directory resolves both executables", () => {
  const root = temp();
  const support = path.join(root, "Support Files");
  const afterfxName = process.platform === "win32" ? "AfterFX.exe" : "After Effects";
  const aerenderName = process.platform === "win32" ? "aerender.exe" : "aerender";
  const afterfx = path.join(support, afterfxName);
  const aerender = path.join(support, aerenderName);
  fs.mkdirSync(support, { recursive: true });
  fs.writeFileSync(afterfx, "");
  fs.writeFileSync(aerender, "");

  const resolved = findAfterEffects({
    platform: process.platform,
    env: { AURORA_AFTER_EFFECTS_PATH: support },
    skipPathLookup: true
  });

  assert.equal(resolved.afterfx, afterfx);
  assert.equal(resolved.aerender, aerender);
});
