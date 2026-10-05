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
  libraryStats
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
  case "tools":
    await printTools();
    break;
  case "mode":
    await setMode(args[0]);
    break;
  case "workspace":
    await showWorkspace();
    break;

  case "project":
    if (args[0] === "set") await setProjectValue(args[1], args.slice(2).join(" "));
    else await showProject();
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
        license_id: flag("--license") || "unknown",
        commercial_allowed: flagBool("--commercial") ? true : null,
        redistribution_allowed: flagBool("--redistributable") ? true : null,
        attribution_required: flagBool("--attribution") ? true : null,
        tags: csv(flag("--tags")),
        tools: csv(flag("--tools")),
        approved: flagBool("--approved"),
        quality_tier: flag("--quality") || "unknown"
      });
    } else if (args[0] === "search") {
      const query = args.slice(1).filter(x => !x.startsWith("--") && x !== flag("--kind") && x !== flag("--limit")).join(" ");
      await searchLibraryRecords(query, {
        kind: flag("--kind"),
        limit: flag("--limit") || 10,
        approved_only: flagBool("--approved-only")
      });
    } else if (args[0] === "list") await listLibraryRecords();
    else if (args[0] === "stats") await libraryStats();
    else console.error("library commands: add | search | list | stats");
    break;

  case "route":
    await recommendRoute(args.join(" "));
    break;
  case "plan":
    await planProduction(args.join(" "));
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
  aurora-studio tools
  aurora-studio mode direct|director
  aurora-studio workspace

Brain:
  aurora-studio project
  aurora-studio project set FIELD VALUE
  aurora-studio reference create NAME [--source VALUE]
  aurora-studio reference show ID
  aurora-studio reference list
  aurora-studio library add NAME --path PATH [--kind asset] [--type model] [--license CC0] [--tags a,b] [--tools blender] [--approved]
  aurora-studio library search QUERY [--kind KIND] [--approved-only] [--limit N]
  aurora-studio library list
  aurora-studio library stats

Production:
  aurora-studio route "TASK"
  aurora-studio plan "TASK"
  aurora-studio status RUN_ID
  aurora-studio checkpoint RUN_ID STAGE STATUS [--artifact PATH] [--note TEXT] [--approved]
  aurora-studio budget ESTIMATED_USD [SPENT_USD]
  aurora-studio review VIDEO_PATH
  aurora-studio finalize RUN_ID [--lesson TEXT]

UI comes later. .aurora/ is the workspace source of truth.
`);
}
