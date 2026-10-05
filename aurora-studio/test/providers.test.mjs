import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { listProviders, providersFor } from "../src/providers.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-providers-"));
}

test("provider availability follows workspace resources", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    resources: {
      chatgpt_browser: true,
      google_flow: true,
      meta_ai: false,
      elevenlabs: false
    }
  }));

  const providers = listProviders(cwd);
  assert.equal(providers.find(x => x.id === "google_flow").available, true);
  assert.equal(providers.find(x => x.id === "meta_ai").available, false);
});

test("provider capability search prefers matching available service", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    resources: {
      chatgpt_browser: true,
      google_flow: true,
      meta_ai: false,
      elevenlabs: true
    }
  }));

  const providers = providersFor("voiceover", cwd);
  assert.equal(providers[0].id, "elevenlabs");
});
