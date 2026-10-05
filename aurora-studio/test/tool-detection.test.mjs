import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { detectTools } from "../src/studio.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-tool-detect-"));
}

test("router detection sees configured Blender and After Effects installs", () => {
  const cwd = temp();
  const previousBlender = process.env.AURORA_BLENDER_PATH;
  const previousAe = process.env.AURORA_AFTER_EFFECTS_PATH;

  const blender = path.join(
    cwd,
    process.platform === "win32" ? "blender.exe" : "blender"
  );
  fs.writeFileSync(blender, "");

  const aeDir = path.join(cwd, "after-effects");
  fs.mkdirSync(aeDir, { recursive: true });
  const afterfx = path.join(
    aeDir,
    process.platform === "win32" ? "AfterFX.exe" : "After Effects"
  );
  const aerender = path.join(
    aeDir,
    process.platform === "win32" ? "aerender.exe" : "aerender"
  );
  fs.writeFileSync(afterfx, "");
  fs.writeFileSync(aerender, "");

  process.env.AURORA_BLENDER_PATH = blender;
  process.env.AURORA_AFTER_EFFECTS_PATH = aeDir;

  try {
    const tools = detectTools(cwd);
    const blenderTool = tools.find(tool => tool.id === "blender");
    const aeTool = tools.find(tool => tool.id === "after_effects");

    assert.equal(blenderTool.available, true);
    assert.match(blenderTool.detected_by, /blender:/);

    assert.equal(aeTool.available, true);
    assert.match(aeTool.detected_by, /after_effects:/);
  } finally {
    if (previousBlender === undefined) delete process.env.AURORA_BLENDER_PATH;
    else process.env.AURORA_BLENDER_PATH = previousBlender;

    if (previousAe === undefined) delete process.env.AURORA_AFTER_EFFECTS_PATH;
    else process.env.AURORA_AFTER_EFFECTS_PATH = previousAe;
  }
});
