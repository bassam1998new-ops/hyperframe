import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  readSetupConfig,
  writeConfiguredWorkspace
} from "../src/configured-setup.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-configured-"));
}

test("configured setup creates a portable workspace without interaction", () => {
  const cwd = temp();

  const result = writeConfiguredWorkspace({
    product: "Demo Product",
    purpose: "social videos",
    website: "https://example.test",
    mode: "director",
    resources: {
      google_flow: true,
      chatgpt_browser: true,
      meta_ai: false,
      elevenlabs: true
    },
    local_paths: ["./approved-assets"],
    agents: "none",
    install_hyperframes: false
  }, { cwd });

  assert.ok(fs.existsSync(result.workspace_file));
  assert.ok(fs.existsSync(result.project_file));
  assert.ok(fs.existsSync(path.join(cwd, ".aurora", "system", "bin", "aurora-studio.mjs")));

  const workspace = JSON.parse(fs.readFileSync(result.workspace_file, "utf8"));
  assert.equal(workspace.default_mode, "director");
  assert.equal(workspace.project.product, "Demo Product");
  assert.equal(workspace.resources.google_flow, true);
  assert.deepEqual(workspace.resources.local_paths, ["./approved-assets"]);
});

test("setup config file is normalized", () => {
  const cwd = temp();
  const file = path.join(cwd, "aurora-setup.json");
  fs.writeFileSync(file, JSON.stringify({
    product: "X",
    mode: "direct",
    agents: "codex",
    install_hyperframes: false,
    resources: { google_flow: true }
  }));

  const result = readSetupConfig("aurora-setup.json", cwd);
  assert.equal(result.config.product, "X");
  assert.equal(result.config.agents, "codex");
  assert.equal(result.config.resources.google_flow, true);
  assert.equal(result.config.resources.elevenlabs, null);
});

test("configured setup never calls HyperFrames installer when disabled", () => {
  const cwd = temp();
  let installs = 0;

  writeConfiguredWorkspace({
    product: "X",
    mode: "direct",
    agents: "none",
    install_hyperframes: false
  }, {
    cwd,
    installHyperframesImpl: () => {
      installs++;
      throw new Error("should not run");
    }
  });

  assert.equal(installs, 0);
});


test("configured setup preserves omitted existing resources", () => {
  const cwd = temp();

  writeConfiguredWorkspace({
    product: "X",
    mode: "direct",
    agents: "none",
    install_hyperframes: false,
    resources: {
      google_flow: true,
      elevenlabs: true
    }
  }, { cwd });

  writeConfiguredWorkspace({
    product: "X",
    agents: "none",
    install_hyperframes: false,
    resources: {
      google_flow: false
    }
  }, { cwd });

  const workspace = JSON.parse(
    fs.readFileSync(path.join(cwd, ".aurora", "workspace.json"), "utf8")
  );

  assert.equal(workspace.resources.google_flow, false);
  assert.equal(workspace.resources.elevenlabs, true);
  assert.equal(workspace.default_mode, "direct");
});
