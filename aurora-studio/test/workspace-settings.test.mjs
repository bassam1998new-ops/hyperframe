
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  defaultBudgetPolicy,
  normalizeBudgetPolicy,
  normalizeToolPaths,
  readWorkspaceSettings,
  updateStudioSettings,
  workspaceToolPaths
} from "../src/workspace-settings.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-settings-"));
}

function seedWorkspace(cwd) {
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, ".aurora", "workspace.json"),
    JSON.stringify({
      schema_version: 1,
      studio: "AurorA Studio",
      default_mode: "direct",
      project: { product: "Demo", purpose: "video", website: "" },
      resources: {},
      budget: defaultBudgetPolicy(),
      tool_paths: {
        blender: null,
        after_effects: null,
        ffmpeg: null
      },
      learning: { approved_only: true }
    }, null, 2)
  );
}

test("budget policy validates soft warning and hard cap modes", () => {
  assert.deepEqual(
    normalizeBudgetPolicy({
      mode: "warn",
      cap_usd: 12.5,
      approval_threshold_usd: 2
    }),
    {
      mode: "warn",
      cap_usd: 12.5,
      approval_threshold_usd: 2
    }
  );

  assert.throws(
    () => normalizeBudgetPolicy({
      mode: "cap",
      cap_usd: null,
      approval_threshold_usd: 1
    }),
    /requires a USD cap/
  );
});

test("tool path normalization keeps only real paths and supports clearing", () => {
  const cwd = temp();
  const blender = path.join(cwd, "Blender");
  fs.mkdirSync(blender);

  const result = normalizeToolPaths(
    {
      blender,
      after_effects: ""
    },
    cwd,
    {
      blender: null,
      after_effects: path.join(cwd, "Old AE"),
      ffmpeg: null
    }
  );

  assert.equal(result.blender, blender);
  assert.equal(result.after_effects, null);

  assert.throws(
    () => normalizeToolPaths({ ffmpeg: "missing/ffmpeg" }, cwd),
    /does not exist/
  );
});

test("Studio Settings persist budget and tool paths together", () => {
  const cwd = temp();
  seedWorkspace(cwd);

  const blender = path.join(cwd, "Blender");
  const ffmpeg = path.join(cwd, "ffmpeg");
  fs.mkdirSync(blender);
  fs.writeFileSync(ffmpeg, "");

  const result = updateStudioSettings({
    budget: {
      mode: "cap",
      cap_usd: 20,
      approval_threshold_usd: 3
    },
    tool_paths: {
      blender,
      ffmpeg
    }
  }, cwd);

  assert.deepEqual(result.budget, {
    mode: "cap",
    cap_usd: 20,
    approval_threshold_usd: 3
  });
  assert.equal(result.tool_paths.blender, blender);
  assert.equal(result.tool_paths.ffmpeg, ffmpeg);

  const saved = readWorkspaceSettings(cwd);
  assert.deepEqual(saved.budget, result.budget);
  assert.deepEqual(workspaceToolPaths(cwd), result.tool_paths);
});
