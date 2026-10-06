import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

test("browser UI JavaScript modules have valid syntax", () => {
  const files = [
    "ui/app.js",
    "ui/app/api.js",
    "ui/app/format.js",
    "ui/app/router.js",
    "ui/app/toast.js",
    "ui/app/dialog.js"
  ];

  for (const relative of files) {
    const result = spawnSync(
      process.execPath,
      ["--check", path.join(ROOT, relative)],
      {
        cwd: ROOT,
        encoding: "utf8"
      }
    );

    assert.equal(result.status, 0, `${relative}: ${result.stderr}`);
  }
});

test("V2 shell exposes only real AurorA navigation views", () => {
  const html = read("ui/index.html");

  for (const view of ["create", "library", "project", "settings", "updates", "setup"]) {
    assert.match(html, new RegExp(`data-view-panel=["']${view}["']`));
  }

  for (const fake of ["Seedance", "Landed", "Raise today", "40-clip", "OpenMontage"]) {
    assert.doesNotMatch(html, new RegExp(fake, "i"));
  }
});

test("canonical UI UX master plan is present before V2 implementation", () => {
  const plan = read("docs/UI-UX-MASTER-PLAN.md");

  assert.match(plan, /# AurorA Studio — UI\/UX Master Plan/);
  assert.match(plan, /# 34\. Execution waves/);
  assert.match(plan, /Wave UI-10/);
  assert.match(plan, /Definition of done/);
});

test("UI styling uses canonical tokens and accessibility foundation", () => {
  const css = read("ui/styles.css");
  const tokens = read("ui/styles/tokens.css");
  const base = read("ui/styles/base.css");
  const components = read("ui/styles/components.css");

  assert.match(css, /tokens\.css/);
  assert.match(css, /base\.css/);
  assert.match(css, /components\.css/);

  for (const token of [
    "--aurora-violet",
    "--aurora-cyan",
    "--aurora-border",
    "--motion-ui",
    "--radius-shell"
  ]) {
    assert.match(tokens, new RegExp(token));
  }

  assert.match(base, /focus-visible/);
  assert.match(base, /prefers-reduced-motion/);
  assert.match(base, /\.skip-link/);

  assert.match(components, /\.aurora-dialog/);
  assert.match(components, /\.aurora-drawer/);
  assert.match(components, /\.aurora-skeleton/);
});

test("approved Aurora visual primitives remain present", () => {
  const css = read("ui/styles.css");

  assert.match(css, /\.brand-orb/);
  assert.match(css, /\.preview-stage/);
  assert.match(css, /\.activity-panel/);
  assert.match(css, /\.library-card/);
});

test("selected Lucide icons and license notice ship locally", () => {
  const html = read("ui/index.html");
  const notice = read("ui/vendor/LUCIDE-LICENSE.txt");

  assert.match(html, /M11\.017 2\.814/);
  assert.match(html, /m16 6 4 14/);
  assert.match(html, /M3 12a9 9/);

  assert.match(notice, /Lucide/);
  assert.match(notice, /ISC License/);
  assert.match(notice, /2026 Lucide Icons and Contributors/);
});

test("app imports shared API formatting router and toast modules", () => {
  const app = read("ui/app.js");

  assert.match(app, /\.\/app\/api\.js/);
  assert.match(app, /\.\/app\/format\.js/);
  assert.match(app, /\.\/app\/router\.js/);
  assert.match(app, /\.\/app\/toast\.js/);

  assert.doesNotMatch(app, /function escapeHtml\(/);
  assert.doesNotMatch(app, /async function api\(/);
  assert.doesNotMatch(app, /function switchView\(/);
});
