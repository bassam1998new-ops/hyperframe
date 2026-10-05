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
  setMode,
  showWorkspace
} from "../src/studio.mjs";

const [command = "help", ...args] = process.argv.slice(2);

function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
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
      humanApproved: args.includes("--approved")
    });
    break;
  }
  case "budget":
    await checkBudget(args[0], args[1] || 0);
    break;
  case "review":
    await reviewRender(args[0]);
    break;
  case "mode":
    await setMode(args[0]);
    break;
  case "workspace":
    await showWorkspace();
    break;
  case "help":
  default:
    console.log(`
AurorA Studio

Commands:
  aurora-studio setup
  aurora-studio doctor
  aurora-studio tools
  aurora-studio mode direct|director
  aurora-studio workspace

Production:
  aurora-studio route "TASK"
  aurora-studio plan "TASK"
  aurora-studio status RUN_ID
  aurora-studio checkpoint RUN_ID STAGE STATUS [--artifact PATH] [--note TEXT] [--approved]
  aurora-studio budget ESTIMATED_USD [SPENT_USD]
  aurora-studio review VIDEO_PATH

Modes:
  direct    Minimum checkpoints.
  director  Concepts + owner gates before expensive work.

UI comes later. .aurora/ is the workspace source of truth.
`);
}
