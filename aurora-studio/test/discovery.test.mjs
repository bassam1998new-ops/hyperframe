import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  scanWorkspace,
  writeDiscovery,
  isDangerouslyBroadExternalRoot
} from "../src/discovery.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-discovery-"));
}

test("discovery categorizes useful creative files", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, "assets", "models"), { recursive: true });
  fs.mkdirSync(path.join(cwd, "assets", "audio"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "assets", "models", "avatar.glb"), "");
  fs.writeFileSync(path.join(cwd, "assets", "audio", "voice.wav"), "");
  fs.writeFileSync(path.join(cwd, "hero.png"), "");

  const result = scanWorkspace(cwd);
  assert.equal(result.counts.three_d, 1);
  assert.equal(result.counts.audio, 1);
  assert.equal(result.counts.image, 1);
  assert.ok(result.directories.some(x => x.directory.includes("assets")));
});

test("discovery ignores node_modules and aurora state", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, "node_modules", "pkg"), { recursive: true });
  fs.mkdirSync(path.join(cwd, ".aurora", "temp"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "node_modules", "pkg", "noise.png"), "");
  fs.writeFileSync(path.join(cwd, ".aurora", "temp", "draft.mp4"), "");

  const result = scanWorkspace(cwd);
  assert.equal(result.counts.image, 0);
  assert.equal(result.counts.video, 0);
});

test("writeDiscovery persists a bounded report", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "brief.md"), "# brief");
  const result = writeDiscovery(cwd, { maxDepth: 2, maxFiles: 200 });
  assert.ok(fs.existsSync(result.file));
  assert.equal(result.discovery.counts.document, 1);
});


test("scans only explicitly supplied external roots", async () => {
  const cwd = temp();
  const approved = temp();
  const unapproved = temp();

  fs.writeFileSync(path.join(approved, "approved-logo.png"), "");
  fs.writeFileSync(path.join(unapproved, "secret-logo.png"), "");

  const { saveDiscovery } = await import("../src/discovery.mjs");
  const saved = saveDiscovery(cwd, { extraRoots: [approved] });

  assert.equal(saved.result.external_roots.length, 1);
  assert.equal(saved.result.external_roots[0].available, true);
  assert.ok(saved.result.external_roots[0].by_kind.image.includes("approved-logo.png"));
  assert.equal(JSON.stringify(saved.result).includes(unapproved), false);
});

test("missing approved external root is reported, not guessed", async () => {
  const cwd = temp();
  const missing = path.join(cwd, "does-not-exist");

  const { saveDiscovery } = await import("../src/discovery.mjs");
  const saved = saveDiscovery(cwd, { extraRoots: [missing] });

  assert.equal(saved.result.external_roots[0].available, false);
  assert.equal(saved.result.external_roots[0].error, "not_found");
});


test("discovery ignores Claude and Codex config folders", () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".claude"), { recursive: true });
  fs.mkdirSync(path.join(cwd, ".codex"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".claude", "settings.json"), "{}");
  fs.writeFileSync(path.join(cwd, ".codex", "hooks.json"), "{}");
  fs.writeFileSync(path.join(cwd, "brief.md"), "# brief");

  const result = scanWorkspace(cwd);

  assert.equal(result.counts.document, 1);
  assert.ok(result.files.every(item => !item.path.includes(".claude")));
  assert.ok(result.files.every(item => !item.path.includes(".codex")));
});

test("broad external roots are rejected", () => {
  const cwd = temp();

  assert.equal(
    isDangerouslyBroadExternalRoot(path.parse(cwd).root, {
      platform: process.platform,
      home: os.homedir()
    }),
    true
  );

  assert.equal(
    isDangerouslyBroadExternalRoot(os.homedir(), {
      platform: process.platform,
      home: os.homedir()
    }),
    true
  );

  assert.equal(
    isDangerouslyBroadExternalRoot(path.join(cwd, "assets"), {
      platform: process.platform,
      home: os.homedir()
    }),
    false
  );
});

test("specific external asset folder is scanned", () => {
  const cwd = temp();
  const external = path.join(cwd, "external-assets");
  fs.mkdirSync(external, { recursive: true });
  fs.writeFileSync(path.join(external, "avatar.glb"), "");

  const result = writeDiscovery(cwd, {
    extraRoots: [external]
  });

  assert.equal(result.discovery.external_roots.length, 1);
  assert.equal(result.discovery.external_roots[0].available, true);
  assert.equal(result.discovery.external_roots[0].counts.three_d, 1);
});
