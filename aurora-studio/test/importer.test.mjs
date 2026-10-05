import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { importHyperframeLibrary } from "../src/importers/hyperframe.mjs";
import { readLibrary } from "../src/library.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-import-"));
}

test("imports HyperFrames style cards and kits without duplication", () => {
  const root = temp();
  const cwd = path.join(root, "workspace");
  fs.mkdirSync(cwd, { recursive: true });

  const styleDir = path.join(root, "video-projects", "_library", "styles", "demo-style");
  fs.mkdirSync(styleDir, { recursive: true });
  fs.writeFileSync(path.join(styleDir, "style.md"), `---
id: demo-style
name: Demo Style
status: approved
modes: [calm, punchy]
use_when: [product intro, explainer]
---
# Demo
**Tone:** Precise and calm.
`);

  const kitDir = path.join(root, "video-projects", "_library", "assets", "kits", "demo");
  fs.mkdirSync(kitDir, { recursive: true });
  fs.writeFileSync(path.join(kitDir, "README.md"), "# demo");

  const first = importHyperframeLibrary({ root, cwd });
  assert.equal(first.styles, 1);
  assert.equal(first.kits, 1);
  assert.equal(first.created, 2);

  const second = importHyperframeLibrary({ root, cwd });
  assert.equal(second.created, 0);
  assert.equal(second.updated, 2);

  const items = readLibrary(cwd);
  assert.equal(items.length, 2);
  const style = items.find(x => x.kind === "style");
  assert.equal(style.approved, true);
  assert.ok(style.tags.includes("product intro"));
});
