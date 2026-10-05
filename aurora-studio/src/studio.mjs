import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.resolve(HERE, "../knowledge/tools/registry.json");

function registry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
}

function existsOnPath(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [command], { stdio: "ignore" });
  return result.status === 0;
}

function envPathExists(name) {
  const value = process.env[name];
  return Boolean(value && fs.existsSync(value));
}

function detectTool(tool) {
  const command = (tool.detect_commands || []).find(existsOnPath);
  const envDetected = tool.env_path ? envPathExists(tool.env_path) : false;
  return {
    id: tool.id,
    name: tool.name,
    required: Boolean(tool.required),
    available: Boolean(command || envDetected),
    detected_by: command ? `command:${command}` : envDetected ? `env:${tool.env_path}` : null
  };
}

export function detectTools() {
  return registry().tools.map(detectTool);
}

function yes(value) {
  return /^(y|yes|true|1)$/i.test(String(value).trim());
}

function workspaceDir(cwd = process.cwd()) {
  return path.join(cwd, ".aurora");
}

function readWorkspace(cwd = process.cwd()) {
  const file = path.join(workspaceDir(cwd), "workspace.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

export async function runSetup(cwd = process.cwd()) {
  const dir = workspaceDir(cwd);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, "styles"), { recursive: true });
  fs.mkdirSync(path.join(dir, "library"), { recursive: true });
  fs.mkdirSync(path.join(dir, "temp"), { recursive: true });

  const rl = readline.createInterface({ input, output });
  const existing = readWorkspace(cwd);

  console.log("\nAurorA Studio setup");
  console.log("No passwords or API keys are requested here.\n");

  const product = await rl.question(`Product/service [${existing?.project?.product || ""}]: `);
  const purpose = await rl.question(`What do you mainly make videos for? [${existing?.project?.purpose || ""}]: `);
  const modeAnswer = await rl.question(`Default mode direct/director [${existing?.default_mode || "direct"}]: `);

  console.log("\nOptional browser/account resources. Answer y/n. These are availability flags only.");
  const chatgpt = await rl.question("ChatGPT in browser available? [y/N]: ");
  const flow = await rl.question("Google Flow available? [y/N]: ");
  const meta = await rl.question("Meta AI available? [y/N]: ");
  const eleven = await rl.question("ElevenLabs available? [y/N]: ");

  rl.close();

  const tools = detectTools();
  const now = new Date().toISOString();
  const workspace = {
    schema_version: 1,
    studio: "AurorA Studio",
    created_at: existing?.created_at || now,
    updated_at: now,
    default_mode: modeAnswer.trim() || existing?.default_mode || "direct",
    project: {
      product: product.trim() || existing?.project?.product || "",
      purpose: purpose.trim() || existing?.project?.purpose || ""
    },
    tools,
    resources: {
      chatgpt_browser: yes(chatgpt),
      google_flow: yes(flow),
      meta_ai: yes(meta),
      elevenlabs: yes(eleven)
    },
    learning: {
      decision_log: ".aurora/decisions.jsonl",
      lesson_log: ".aurora/lessons.jsonl",
      approved_only: true
    }
  };

  fs.writeFileSync(path.join(dir, "workspace.json"), JSON.stringify(workspace, null, 2) + "\n");
  for (const log of ["decisions.jsonl", "lessons.jsonl"]) {
    const file = path.join(dir, log);
    if (!fs.existsSync(file)) fs.writeFileSync(file, "");
  }
  const styleReadme = path.join(dir, "styles", "README.md");
  if (!fs.existsSync(styleReadme)) {
    fs.writeFileSync(styleReadme, "# Workspace styles\n\nOnly save styles that were useful, approved, or intentionally kept for reuse.\n");
  }

  console.log(`\nWorkspace ready: ${dir}`);
  await runDoctor(cwd);
}

export async function runDoctor(cwd = process.cwd()) {
  const tools = detectTools();
  const ws = readWorkspace(cwd);
  console.log("\nAurorA Studio doctor\n");
  for (const tool of tools) {
    const mark = tool.available ? "✓" : tool.required ? "✗ REQUIRED" : "○ optional";
    console.log(`${mark.padEnd(12)} ${tool.name}${tool.detected_by ? ` (${tool.detected_by})` : ""}`);
  }

  if (!ws) {
    console.log("\nWorkspace: not configured. Run: aurora-studio setup");
  } else {
    console.log(`\nWorkspace: configured | mode=${ws.default_mode}`);
    const r = ws.resources || {};
    console.log(`Resources: ChatGPT=${!!r.chatgpt_browser} Flow=${!!r.google_flow} MetaAI=${!!r.meta_ai} ElevenLabs=${!!r.elevenlabs}`);
  }
}

export async function printTools(cwd = process.cwd()) {
  const live = Object.fromEntries(detectTools().map(t => [t.id, t]));
  for (const tool of registry().tools) {
    console.log(`\n${tool.name} — ${live[tool.id]?.available ? "AVAILABLE" : tool.required ? "MISSING REQUIRED" : "NOT INSTALLED / OPTIONAL"}`);
    console.log("Best for: " + tool.best_for.join(", "));
    console.log("Avoid for: " + tool.avoid_for.join(", "));
  }
}

export async function recommendRoute(taskText = "", cwd = process.cwd()) {
  const q = taskText.toLowerCase();
  const available = Object.fromEntries(detectTools().map(t => [t.id, t.available]));
  const route = [];

  const true3d = /(3d|avatar|character|rig|model|product render|physics)/.test(q);
  const finishing = /(vfx|composit|tracking|after effects|ae finish)/.test(q);
  const motion2d = /(caption|typography|kinetic|ui|explainer|social|html|gsap)/.test(q);

  if (true3d) {
    if (!available.blender) {
      console.log("No safe route: this task appears to need true 3D, but Blender is not available.");
      process.exitCode = 2;
      return;
    }
    route.push("blender");
  }

  if (finishing && available.after_effects) route.push("after_effects");

  if (motion2d || route.length === 0) {
    if (available.hyperframe) route.push("hyperframe");
  } else if (available.hyperframe && !finishing) {
    route.push("hyperframe");
  }

  console.log(JSON.stringify({
    task: taskText,
    route,
    note: "Foundation router: hard rules only. Later versions add asset search, experience retrieval and learned scoring."
  }, null, 2));
}
