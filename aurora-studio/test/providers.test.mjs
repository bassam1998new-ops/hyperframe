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
      browser_control: true,
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
      browser_control: true,
      chatgpt_browser: true,
      google_flow: true,
      meta_ai: false,
      elevenlabs: true
    }
  }));

  const providers = providersFor("voiceover", cwd);
  assert.equal(providers[0].id, "elevenlabs");
});


test("browser provider is unavailable when account exists but browser control does not", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    resources: {
      browser_control: false,
      google_flow: true,
      chatgpt_browser: true,
      meta_ai: true,
      elevenlabs: true
    }
  }));

  const providers = listProviders(cwd);
  const flow = providers.find(x => x.id === "google_flow");
  const eleven = providers.find(x => x.id === "elevenlabs");

  assert.equal(flow.account_available, true);
  assert.equal(flow.available, false);
  assert.equal(flow.blocked_reason, "browser_control_unavailable");

  assert.equal(eleven.available, true);
  assert.equal(eleven.blocked_reason, null);
});
