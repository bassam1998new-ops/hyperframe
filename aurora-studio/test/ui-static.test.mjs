import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

test("browser UI JavaScript has valid syntax", () => {
  const app = path.join(ROOT, "ui", "app.js");
  const result = spawnSync(process.execPath, ["--check", app], {
    cwd: ROOT,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
});

test("V1 shell exposes only real AurorA navigation views", () => {
  const html = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");

  for (const view of ["create", "library", "project", "settings", "updates", "setup"]) {
    assert.match(html, new RegExp(`data-view-panel=["']${view}["']`));
  }

  for (const fake of ["Seedance", "Landed", "Raise today", "40-clip"]) {
    assert.doesNotMatch(html, new RegExp(fake, "i"));
  }
});

test("UI styling keeps the approved Aurora visual primitives", () => {
  const css = fs.readFileSync(path.join(ROOT, "ui", "styles.css"), "utf8");

  assert.match(css, /--violet:/);
  assert.match(css, /--cyan:/);
  assert.match(css, /\.brand-orb/);
  assert.match(css, /\.preview-stage/);
  assert.match(css, /\.activity-panel/);
  assert.match(css, /\.library-card/);
});
