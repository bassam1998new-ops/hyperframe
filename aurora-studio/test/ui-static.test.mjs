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
    "ui/app/dialog.js",
    "ui/app/tooltip.js",
    "ui/app/components/media-player.js",
    "ui/app/workflows/reference.js",
    "ui/app/workflows/create-intent.js",
    "ui/app/workflows/concepts.js",
    "ui/app/workflows/storyboard.js",
    "ui/app/workflows/assets.js",
    "ui/app/workflows/library.js",
    "ui/app/workflows/review.js",
    "ui/app/views/create.js",
    "ui/app/views/library.js",
    "ui/app/views/project.js",
    "ui/app/views/settings.js",
    "ui/app/views/updates.js"
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
  const shell = read("ui/styles/shell.css");
  const create = read("ui/styles/create.css");
  const views = read("ui/styles/views.css");
  const responsive = read("ui/styles/responsive.css");
  const review = read("ui/styles/review.css");

  assert.match(css, /tokens\.css/);
  assert.match(css, /base\.css/);
  for (const file of [
    "tokens.css",
    "base.css",
    "components.css",
    "shell.css",
    "create.css",
    "views.css",
    "responsive.css",
    "review.css"
  ]) {
    assert.match(css, new RegExp(file.replace(".", "\\.")));
  }

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
  assert.match(shell, /\.studio-shell/);
  assert.match(create, /\.preview-stage/);
  assert.match(views, /\.project-grid/);
  assert.match(responsive, /@media/);
  assert.match(review, /\.review-workspace/);
  assert.match(review, /\.review-evidence/);
  assert.match(review, /\.revision-kind-row/);
  assert.ok(css.length < 1000, "styles.css should remain an import-only aggregator");
});

test("approved Aurora visual primitives remain present", () => {
  const shell = read("ui/styles/shell.css");
  const create = read("ui/styles/create.css");

  assert.match(shell, /\.brand-orb/);
  assert.match(create, /\.preview-stage/);
  assert.match(create, /\.activity-panel/);
  assert.match(create, /\.library-card/);
});

test("selected Lucide icons and license notice ship locally", () => {
  const html = read("ui/index.html");
  const notice = read("ui/vendor/LUCIDE-LICENSE.txt");
  const floatingNotice = read("ui/vendor/FLOATING-UI-LICENSE.txt");

  assert.match(html, /M11\.017 2\.814/);
  assert.match(html, /m16 6 4 14/);
  assert.match(html, /M3 12a9 9/);

  assert.match(notice, /Lucide/);
  assert.match(notice, /ISC License/);
  assert.match(notice, /2026 Lucide Icons and Contributors/);
  assert.match(floatingNotice, /Floating UI/);
  assert.match(floatingNotice, /MIT License/);
});

test("app imports shared API formatting router and toast modules", () => {
  const app = read("ui/app.js");

  assert.match(app, /\.\/app\/api\.js/);
  assert.match(app, /\.\/app\/format\.js/);
  assert.match(app, /\.\/app\/router\.js/);
  assert.match(app, /\.\/app\/toast\.js/);
  assert.match(app, /\.\/app\/views\/create\.js/);
  assert.match(app, /\.\/app\/views\/library\.js/);
  assert.match(app, /\.\/app\/views\/project\.js/);
  assert.match(app, /\.\/app\/views\/settings\.js/);
  assert.match(app, /\.\/app\/views\/updates\.js/);

  assert.doesNotMatch(app, /function escapeHtml\(/);
  assert.doesNotMatch(app, /async function api\(/);
  assert.doesNotMatch(app, /function switchView\(/);
});


test("Floating UI is pinned and tooltip behavior has a graceful fallback", () => {
  const pkg = JSON.parse(read("package.json"));
  const tooltip = read("ui/app/tooltip.js");
  const server = read("src/ui-server.mjs");

  assert.equal(pkg.dependencies?.["@floating-ui/dom"], "1.8.0");
  assert.match(tooltip, /window\.FloatingUIDOM/);
  assert.match(tooltip, /return \{ enhanced: false/);
  assert.match(server, /floating-ui\.dom\.umd\.js/);
  assert.match(server, /floating-ui\.core\.umd\.js/);
  assert.match(server, /floating-ui\.utils\.umd\.js/);
});


test("Media Chrome is pinned, locally served, and used by Create preview", () => {
  const pkg = JSON.parse(read("package.json"));
  const server = read("src/ui-server.mjs");
  const player = read("ui/app/components/media-player.js");
  const create = read("ui/app/views/create.js");
  const notice = read("ui/vendor/MEDIA-CHROME-LICENSE.txt");

  assert.equal(pkg.dependencies?.["media-chrome"], "4.19.3");
  assert.match(server, /media-chrome\.js/);
  assert.match(server, /dist.*iife.*index\.js/s);
  assert.match(player, /media-controller/);
  assert.match(player, /media-time-range/);
  assert.match(player, /media-fullscreen-button/);
  assert.match(player, /aurora-native-preview/);
  assert.match(create, /mountMediaPlayer/);
  assert.match(notice, /Mux, Inc/);
  assert.match(notice, /MIT|Permission is hereby granted/);
});

test("Create UI exposes reference quality aspect and honest agent handoff surfaces", () => {
  const html = read("ui/index.html");
  const app = read("ui/app.js");
  const reference = read("ui/app/workflows/reference.js");
  const intent = read("ui/app/workflows/create-intent.js");

  assert.match(html, /id="reference-dialog"/);
  assert.match(html, /data-quality="hero"/);
  assert.match(html, /data-aspect="9:16"/);
  assert.match(html, /id="agent-handoff"/);
  assert.match(reference, /\/api\/reference-upload/);
  assert.match(reference, /\/api\/reference-link/);
  assert.match(intent, /bridge_connected/);
  assert.match(app, /referenceId: referenceWorkflow\.selectedReferenceId/);
  assert.match(app, /quality: intentWorkflow\.quality/);
  assert.match(app, /aspect: intentWorkflow\.aspect/);
});


test("Director concept UI is structured, selectable, refinable, and lock-aware", () => {
  const html = read("ui/index.html");
  const app = read("ui/app.js");
  const workflow = read("ui/app/workflows/concepts.js");
  const css = read("ui/styles/create.css");

  assert.match(html, /id="concepts-panel"/);
  assert.match(html, /id="concept-refine-dialog"/);
  assert.match(html, /id="direction-open"/);
  assert.match(app, /createConceptWorkflow/);
  assert.match(workflow, /\/api\/concept-select/);
  assert.match(workflow, /\/api\/concept-refine/);
  assert.match(workflow, /direction_locked/);
  assert.match(workflow, /Select direction/);
  assert.match(css, /\.concept-card/);
  assert.match(css, /\.concept-status\.locked/);
});


test("Storyboard UI is SortableJS-backed with keyboard-safe fallback controls", () => {
  const pkg = JSON.parse(read("package.json"));
  const html = read("ui/index.html");
  const app = read("ui/app.js");
  const create = read("ui/app/views/create.js");
  const workflow = read("ui/app/workflows/storyboard.js");
  const server = read("src/ui-server.mjs");
  const notice = read("ui/vendor/SORTABLEJS-LICENSE.txt");

  assert.equal(pkg.dependencies?.sortablejs, "1.15.7");

  assert.match(html, /id="storyboard-add"/);
  assert.match(html, /id="shot-inspector"/);
  assert.match(html, /id="shot-move-up"/);
  assert.match(html, /id="shot-move-down"/);
  assert.match(html, /id="shot-duplicate"/);
  assert.match(html, /id="shot-remove"/);

  assert.match(app, /createStoryboardWorkflow/);
  assert.match(app, /storyboardWorkflow\.sync/);

  assert.match(create, /data-shot-id/);
  assert.match(create, /shot-drag-handle/);
  assert.match(create, /output_preview/);

  assert.match(workflow, /\/vendor\/sortable\.js/);
  assert.match(workflow, /\/api\/storyboard-reorder/);
  assert.match(workflow, /\/api\/storyboard-add/);
  assert.match(workflow, /\/api\/storyboard-update/);
  assert.match(workflow, /\/api\/storyboard-duplicate/);
  assert.match(workflow, /\/api\/storyboard-remove/);
  assert.match(workflow, /\/api\/storyboard-move/);
  assert.match(workflow, /direction === "up"/);
  assert.match(workflow, /move\("up"\)/);
  assert.match(workflow, /move\("down"\)/);

  assert.match(server, /SORTABLE_VENDOR/);
  assert.match(notice, /SortableJS 1\.15\.7/);
  assert.match(notice, /MIT License/);
});


test("Asset workflow exposes real Library Open and provider handoff actions", () => {
  const html = read("ui/index.html");
  const app = read("ui/app.js");
  const workflow = read("ui/app/workflows/assets.js");
  const css = read("ui/styles/assets.css");
  const server = read("src/ui-server.mjs");

  assert.match(html, /id="asset-drawer"/);
  assert.match(html, /data-asset-tab="needs"/);
  assert.match(html, /data-asset-tab="library"/);
  assert.match(html, /data-asset-tab="open"/);
  assert.match(html, /data-asset-tab="generate"/);
  assert.match(html, /id="cost-approval-dialog"/);

  assert.match(app, /createAssetWorkflow/);
  assert.match(app, /assetWorkflow\.sync/);

  assert.match(workflow, /\/api\/asset-plan-update/);
  assert.match(workflow, /\/api\/asset-plan-complete/);
  assert.match(workflow, /\/api\/open-assets\/search/);
  assert.match(workflow, /\/api\/open-assets\/track/);
  assert.match(workflow, /\/api\/generation-request/);
  assert.match(workflow, /Generation request queued for your agent/);

  assert.match(server, /\/api\/asset-plan-update/);
  assert.match(server, /\/api\/library-remove/);
  assert.match(server, /CC0-1\.0/);
  assert.match(server, /ownerApproved/);

  assert.match(css, /\.asset-drawer/);
  assert.match(css, /\.provider-card/);
  assert.match(css, /\.cost-approval-metrics/);
});


test("Render and Review UI uses real backend gates without fake progress or cancel", () => {
  const html = read("ui/index.html");
  const app = read("ui/app.js");
  const workflow = read("ui/app/workflows/review.js");
  const server = read("src/ui-server.mjs");
  const revisions = read("src/revisions.mjs");

  assert.match(html, /id="render-ready"/);
  assert.match(html, /id="review-workspace"/);
  assert.match(html, /id="review-evidence"/);
  assert.match(html, /id="review-approve"/);
  assert.match(html, /id="revision-dialog"/);
  assert.match(html, /data-revision-kind="fix"/);
  assert.match(html, /data-revision-kind="rebuild"/);
  assert.match(html, /data-revision-kind="change_direction"/);

  assert.match(app, /createReviewWorkflow/);
  assert.match(app, /reviewWorkflow\.sync/);

  assert.match(workflow, /\/api\/render-register/);
  assert.match(workflow, /\/api\/review-refresh/);
  assert.match(workflow, /\/api\/approve/);
  assert.match(workflow, /\/api\/revision/);
  assert.match(workflow, /can_approve/);
  assert.match(workflow, /mountMediaPlayer/);
  assert.match(workflow, /Side by side|data-review-view/);

  assert.match(server, /probeRender/);
  assert.match(server, /validateReviewReportFile/);
  assert.match(server, /confirm !== true/);
  assert.match(revisions, /Finalized runs are read-only/);
  assert.match(revisions, /owner_revision_requested/);

  assert.doesNotMatch(html, /Render 42%|Cancel render/i);
  assert.doesNotMatch(workflow, /fake.*percent|Math\.random/);
});


test("Full Library UI exposes tracked detail approval history and safe actions", () => {
  const html = read("ui/index.html");
  const app = read("ui/app.js");
  const view = read("ui/app/views/library.js");
  const workflow = read("ui/app/workflows/library.js");
  const assets = read("ui/app/workflows/assets.js");
  const css = read("ui/styles/library.css");
  const server = read("src/ui-server.mjs");

  assert.match(html, /id="library-detail-drawer"/);
  assert.match(html, /id="library-remove-dialog"/);
  assert.match(html, /data-filter="approved"/);
  assert.match(html, /data-filter="pending"/);
  assert.match(html, /data-filter="template"/);
  assert.match(html, /id="library-use-history"/);
  assert.match(html, /id="library-use-current"/);

  assert.match(app, /createLibraryWorkflow/);
  assert.match(app, /libraryWorkflow\.sync/);
  assert.match(view, /data-library-id/);
  assert.match(view, /library-card-status/);
  assert.match(view, /use_count/);

  assert.match(workflow, /\/api\/library-update/);
  assert.match(workflow, /\/api\/library-remove/);
  assert.match(workflow, /\/api\/library-reveal/);
  assert.match(workflow, /assetWorkflow\?\.openLibraryItem/);

  assert.match(assets, /openLibraryItem/);
  assert.match(server, /\/api\/library-reveal/);
  assert.match(css, /\.library-detail-drawer/);
  assert.match(css, /\.library-use-history/);
});


test("Complete Project Brain UI exposes stable context provenance and safe reset controls", () => {
  const html = read("ui/index.html");
  const app = read("ui/app.js");
  const view = read("ui/app/views/project.js");
  const css = read("ui/styles/project.css");
  const server = read("src/ui-server.mjs");
  const brain = read("src/brain.mjs");

  assert.match(html, /id="project-source-list"/);
  assert.match(html, /id="project-claim-count"/);
  assert.match(html, /name="claims_to_protect"/);
  assert.match(html, /name="audience_context\.knowledge_level"/);
  assert.match(html, /name="audience_context\.priorities"/);
  assert.match(html, /name="content\.default_formats"/);
  assert.match(html, /name="content\.recurring_series"/);
  assert.match(html, /name="notes"/);
  assert.match(html, /data-project-reset="claims_to_protect"/);

  assert.match(app, /renderProjectMeta/);
  assert.match(app, /resetProjectField/);
  assert.match(app, /dataset\.projectDirty/);

  assert.match(view, /project\.sources/);
  assert.match(view, /safeHttp/);
  assert.match(view, /Project source/);
  assert.match(view, /resetProjectField/);

  assert.match(server, /audience_context\.knowledge_level/);
  assert.match(server, /claims_to_protect/);
  assert.match(server, /content\.default_formats/);
  assert.match(server, /upsertProjectSource/);
  assert.match(server, /has not automatically re-read/);

  assert.match(brain, /audience_context/);
  assert.match(brain, /upsertProjectSource/);

  assert.match(css, /\.project-overview-grid/);
  assert.match(css, /\.project-source-item/);
  assert.match(css, /\.claims-field/);
});
