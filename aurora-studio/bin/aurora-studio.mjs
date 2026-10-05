#!/usr/bin/env node
import { runSetup, runDoctor, printTools, recommendRoute } from "../src/studio.mjs";

const [command = "help", ...args] = process.argv.slice(2);

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
  case "help":
  default:
    console.log(`
AurorA Studio

Commands:
  aurora-studio setup       One-time workspace setup
  aurora-studio doctor      Detect installed/available tools
  aurora-studio tools       Show tool roles and current availability
  aurora-studio route TASK  Recommend a production path

Modes:
  direct    Agent chooses and builds with minimum checkpoints
  director  Agent proposes concepts and follows approval checkpoints

The UI will come later. The files in .aurora/ are the workspace source of truth.
`);
}
