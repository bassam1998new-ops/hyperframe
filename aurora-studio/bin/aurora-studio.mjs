#!/usr/bin/env node
import {
  runSetup,
  runDoctor,
  printTools,
  recommendRoute,
  setMode,
  showWorkspace
} from "../src/studio.mjs";

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
  aurora-studio setup             One-time workspace setup
  aurora-studio doctor            Detect installed/available tools
  aurora-studio tools             Show tool roles and availability
  aurora-studio mode direct       Switch to Direct mode
  aurora-studio mode director     Switch to Director mode
  aurora-studio workspace         Show saved workspace context
  aurora-studio route TASK        Recommend a production path

Modes:
  direct    Agent chooses and builds with minimum checkpoints
  director  Agent proposes concepts and follows approval checkpoints

The UI comes later. .aurora/ is the workspace source of truth.
`);
}
