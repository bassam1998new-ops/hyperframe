#!/usr/bin/env node
import {
  runSetup,
  runDoctor,
  printTools,
  recommendRoute,
  planProduction,
  showRunStatus,
  writeRunCheckpoint,
  checkBudget,
  reviewRender,
  finalizeProduction,
  setMode,
  showWorkspace,
  showProject,
  setProjectValue,
  createReferenceRecord,
  showReferenceRecord,
  listReferenceRecords,
  addLibraryRecord,
  searchLibraryRecords,
  listLibraryRecords,
  libraryStats,
  importHyperframeRecords,
  showBlenderInfo,
  createBlenderJobRecord,
  executeBlenderJob,
  executeBlenderHandoff,
  showAfterEffectsInfo,
  createAfterEffectsJobRecord,
  executeAfterEffectsJob,
  showRetrievedContext,
  validateStudio,
  showObsidianInfo,
  searchObsidianKnowledge,
  showResources,
  installAgentPointers,
  removeAgentPointers,
  discoverLocalWorkspace,
  showAssetSources,
  checkAssetLicense,
  searchOpenAssets,
  showOpenAssetFiles,
  createMoodRecord,
  showMoodRecord,
  validateMoodRecord,
  createAssetPlanRecord,
  showAssetPlanRecord,
  validateAssetPlanRecord,
  createBuildPlanRecord,
  showBuildPlanRecord,
  validateBuildPlanRecord,
  createLearningReviewRecord,
  showLearningReview,
  validateLearningReviewRecord,
  routeProductionRun,
  checkStudioUpdate,
  planStudioUpdate,
  backupStudioWorkspace,
  syncStudioSystem,
  showStudioSystemStatus,
  installHyperframesWorkspace,
  showHyperframesCoreInfo,
  executeHyperframesCore,
  checkHyperframesUpgrade
} from "../src/studio.mjs";

const [command = "help", ...args] = process.argv.slice(2);

function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}

function flagBool(name) {
  return args.includes(name);
}

function csv(value) {
  return value ? value.split(",").map(x => x.trim()).filter(Boolean) : [];
}

switch (command) {
  case "setup":
  case "init":
    await runSetup();
    break;
  case "doctor":
    await runDoctor();
    break;
  case "validate":
    await validateStudio();
    break;
  case "tools":
    await printTools();
    break;
  case "mode":
    await setMode(args[0]);
    break;
  case "workspace":
    await showWorkspace();
    break;
  case "resources":
    await showResources(args.join(" ") || null);
    break;
  case "asset-sources":
    await showAssetSources(args.join(" ") || null);
    break;
  case "assets":
    if (args[0] === "search") {
      const type = flag("--type") || "all";
      const limit = flag("--limit") || 10;
      const filtered = args.slice(1).filter((value, index, values) => {
        if (value === "--type" || value === "--limit") return false;
        if (index > 0 && (values[index - 1] === "--type" || values[index - 1] === "--limit")) return false;
        if (value === "--refresh") return false;
        return true;
      });
      await searchOpenAssets(filtered.join(" "), {
        type,
        limit,
        forceRefresh: flagBool("--refresh")
      });
    } else if (args[0] === "files") {
      await showOpenAssetFiles(args[1]);
    } else {
      console.error("assets commands: search QUERY [--type all|hdris|textures|models] [--limit N] [--refresh] | files POLY_HAVEN_ID");
    }
    break;
  case "discover":
    await discoverLocalWorkspace();
    break;
  case "system":
    if (args[0] === "sync") await syncStudioSystem();
    else if (args[0] === "status") await showStudioSystemStatus();
    else console.error("system commands: sync | status");
    break;

  case "update":
    if (args[0] === "check") await checkStudioUpdate({ url: flag("--url") });
    else if (args[0] === "plan") await planStudioUpdate();
    else if (args[0] === "backup") await backupStudioWorkspace();
    else console.error("update commands: check [--url URL] | plan | backup");
    break;

  case "agent":
    if (args[0] === "install") await installAgentPointers(args[1] || "all");
    else if (args[0] === "remove") await removeAgentPointers(args[1] || "all");
    else console.error("agent commands: install [all|claude|codex] | remove [all|claude|codex]");
    break;

  case "project":
    if (args[0] === "set") await setProjectValue(args[1], args.slice(2).join(" "));
    else await showProject();
    break;

  case "context": {
    const ref = flag("--reference");
    const filtered = args.filter((value, index) => {
      if (value === "--reference") return false;
      if (index > 0 && args[index - 1] === "--reference") return false;
      return true;
    });
    await showRetrievedContext(filtered.join(" "), ref);
    break;
  }

  case "mood":
    if (args[0] === "create") await createMoodRecord(args[1]);
    else if (args[0] === "show") await showMoodRecord(args[1]);
    else if (args[0] === "validate") await validateMoodRecord(args[1]);
    else console.error("mood commands: create RUN_ID | show RUN_ID | validate RUN_ID");
    break;

  case "asset-plan":
    if (args[0] === "create") await createAssetPlanRecord(args[1]);
    else if (args[0] === "show") await showAssetPlanRecord(args[1]);
    else if (args[0] === "validate") await validateAssetPlanRecord(args[1]);
    else console.error("asset-plan commands: create RUN_ID | show RUN_ID | validate RUN_ID");
    break;

  case "build-plan":
    if (args[0] === "create") await createBuildPlanRecord(args[1]);
    else if (args[0] === "show") await showBuildPlanRecord(args[1]);
    else if (args[0] === "validate") await validateBuildPlanRecord(args[1]);
    else console.error("build-plan commands: create RUN_ID | show RUN_ID | validate RUN_ID");
    break;

  case "learn":
    if (args[0] === "create") await createLearningReviewRecord(args[1]);
    else if (args[0] === "show") await showLearningReview(args[1]);
    else if (args[0] === "validate") await validateLearningReviewRecord(args[1]);
    else console.error("learn commands: create RUN_ID | show RUN_ID | validate RUN_ID");
    break;

  case "reference":
    if (args[0] === "create") await createReferenceRecord(args[1], flag("--source"));
    else if (args[0] === "show") await showReferenceRecord(args[1]);
    else if (args[0] === "list") await listReferenceRecords();
    else console.error("reference commands: create NAME [--source VALUE] | show ID | list");
    break;

  case "library":
    if (args[0] === "add") {
      await addLibraryRecord({
        kind: flag("--kind") || "asset",
        name: flag("--name") || args[1],
        description: flag("--description") || "",
        type: flag("--type") || "other",
        path: flag("--path"),
        source_url: flag("--source"),
        source_name: flag("--source-name"),
        source_id: flag("--source-id"),
        license_id: flag("--license") || "unknown",
        commercial_allowed: flagBool("--commercial") ? true : null,
        redistribution_allowed: flagBool("--redistributable") ? true : null,
        attribution_required: flagBool("--attribution") ? true : null,
        tags: csv(flag("--tags")),
        tools: csv(flag("--tools")),
        approved: flagBool("--approved"),
        quality_tier: flag("--quality") || "unknown"
      });
    } else if (args[0] === "license-check") {
      await checkAssetLicense(args[1], flagBool("--bundle"));
    } else if (args[0] === "search") {
      const query = args.slice(1).filter(x => !x.startsWith("--") && x !== flag("--kind") && x !== flag("--limit")).join(" ");
      await searchLibraryRecords(query, {
        kind: flag("--kind"),
        limit: flag("--limit") || 10,
        approved_only: flagBool("--approved-only")
      });
    } else if (args[0] === "import-hyperframe") {
      await importHyperframeRecords(flag("--root"));
    } else if (args[0] === "list") await listLibraryRecords();
    else if (args[0] === "stats") await libraryStats();
    else console.error("library commands: add | search | license-check | import-hyperframe | list | stats");
    break;

  case "obsidian":
    if (args[0] === "doctor") await showObsidianInfo();
    else if (args[0] === "search") await searchObsidianKnowledge(args.slice(1).filter(x => x !== "--vault" && x !== flag("--vault")).join(" "), flag("--vault"));
    else console.error("obsidian commands: doctor | search QUERY [--vault NAME]");
    break;

  case "hyperframe":
  case "hyperframes":
    if (args[0] === "doctor") await showHyperframesCoreInfo();
    else if (args[0] === "install") await installHyperframesWorkspace(flagBool("--dry-run"));
    else if (args[0] === "upgrade-check") await checkHyperframesUpgrade();
    else if (args[0] === "run") await executeHyperframesCore(args.slice(1), { dryRun: flagBool("--dry-run") });
    else console.error("hyperframe commands: doctor | install [--dry-run] | upgrade-check | run ARGS...");
    break;

  case "blender":
    if (args[0] === "doctor") await showBlenderInfo();
    else if (args[0] === "create") await createBlenderJobRecord(args[1]);
    else if (args[0] === "run") await executeBlenderJob(args[1], flagBool("--dry-run"));
    else if (args[0] === "handoff") {
      await executeBlenderHandoff(args[1], args[2], {
        fps: flag("--fps") || 30,
        quality: flag("--quality") || "normal",
        dryRun: flagBool("--dry-run")
      });
    } else console.error("blender commands: doctor | create NAME | run JOB [--dry-run] | handoff FRAMES OUTPUT.webm [--fps N] [--quality draft|normal|premium|hero] [--dry-run]");
    break;

  case "ae":
  case "after-effects":
    if (args[0] === "doctor") await showAfterEffectsInfo();
    else if (args[0] === "create") await createAfterEffectsJobRecord(args[1]);
    else if (args[0] === "run") await executeAfterEffectsJob(args[1], flagBool("--dry-run"));
    else console.error("ae commands: doctor | create NAME | run JOB [--dry-run]");
    break;

  case "route":
    await recommendRoute(args.join(" "));
    break;
  case "plan": {
    const ref = flag("--reference");
    const filtered = args.filter((value, index) => {
      if (value === "--reference") return false;
      if (index > 0 && args[index - 1] === "--reference") return false;
      return true;
    });
    await planProduction(filtered.join(" "), { referenceId: ref });
    break;
  }
  case "routing":
    await routeProductionRun(args[0]);
    break;
  case "status":
    await showRunStatus(args[0]);
    break;
  case "checkpoint": {
    const [runId, stage, status] = args;
    await writeRunCheckpoint(runId, stage, status, {
      artifact: flag("--artifact"),
      note: flag("--note"),
      humanApproved: flagBool("--approved")
    });
    break;
  }
  case "budget":
    await checkBudget(args[0], args[1] || 0);
    break;
  case "review":
    await reviewRender(args[0]);
    break;
  case "finalize":
    await finalizeProduction(args[0], flag("--lesson"));
    break;

  case "help":
  default:
    console.log(`
AurorA Studio

Setup:
  aurora-studio setup
  aurora-studio doctor
  aurora-studio validate
  aurora-studio tools
  aurora-studio mode direct|director
  aurora-studio workspace
  aurora-studio resources ["CAPABILITY"]
  aurora-studio asset-sources ["ASSET NEED"]
  aurora-studio assets search "studio hdri" [--type hdris] [--limit 10]
  aurora-studio assets files POLY_HAVEN_ID
  aurora-studio discover
  aurora-studio system status
  aurora-studio system sync
  aurora-studio update check
  aurora-studio update plan
  aurora-studio update backup
  aurora-studio agent install [all|claude|codex]
  aurora-studio agent remove [all|claude|codex]

Brain:
  aurora-studio context "TASK" [--reference ID]
  aurora-studio mood create RUN_ID
  aurora-studio mood show RUN_ID
  aurora-studio mood validate RUN_ID
  aurora-studio asset-plan create RUN_ID
  aurora-studio asset-plan show RUN_ID
  aurora-studio asset-plan validate RUN_ID
  aurora-studio build-plan create RUN_ID
  aurora-studio build-plan show RUN_ID
  aurora-studio build-plan validate RUN_ID
  aurora-studio learn create RUN_ID
  aurora-studio learn show RUN_ID
  aurora-studio learn validate RUN_ID
  aurora-studio project
  aurora-studio project set FIELD VALUE
  aurora-studio reference create NAME [--source VALUE]
  aurora-studio reference show ID
  aurora-studio reference list
  aurora-studio library add NAME --path PATH [--source-id poly-haven] [--kind asset] [--type model] [--license CC0-1.0] [--tags a,b] [--tools blender] [--approved]
  aurora-studio library license-check ID [--bundle]
  aurora-studio library search QUERY [--kind KIND] [--approved-only] [--limit N]
  aurora-studio library import-hyperframe [--root PATH]
  aurora-studio library list
  aurora-studio library stats

Obsidian (optional):
  aurora-studio obsidian doctor
  aurora-studio obsidian search "QUERY" [--vault NAME]

HyperFrames:
  aurora-studio hyperframe doctor
  aurora-studio hyperframe install [--dry-run]
  aurora-studio hyperframe upgrade-check
  aurora-studio hyperframe run ARGS...

Blender:
  aurora-studio blender doctor
  aurora-studio blender create NAME
  aurora-studio blender run JOB [--dry-run]
  aurora-studio blender handoff "frames/f_%04d.png" overlay.webm [--fps 30] [--quality premium] [--dry-run]

After Effects (optional):
  aurora-studio ae doctor
  aurora-studio ae create NAME
  aurora-studio ae run JOB [--dry-run]

Production:
  aurora-studio route "TASK"
  aurora-studio plan "TASK" [--reference ID]
  aurora-studio routing RUN_ID
  aurora-studio status RUN_ID
  aurora-studio checkpoint RUN_ID STAGE STATUS [--artifact PATH] [--note TEXT] [--approved]
  aurora-studio budget ESTIMATED_USD [SPENT_USD]
  aurora-studio review VIDEO_PATH
  aurora-studio finalize RUN_ID [--lesson TEXT]

UI comes later. .aurora/ is the workspace source of truth.
`);
}
