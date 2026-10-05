import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.resolve(HERE, "../knowledge/tools/registry.json");
const require = createRequire(import.meta.url);

function registry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
}

function existsOnPath(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [command], { stdio: "ignore" });
  return result.status === 0;
}

function localBinExists(command, cwd = process.cwd()) {
  const name = process.platform === "win32" ? `${command}.cmd` : command;
  return fs.existsSync(path.join(cwd, "node_modules", ".bin", name));
}

function packageExists(packageName, cwd = process.cwd()) {
  if (!packageName) return false;
  try {
    require.resolve(`${packageName}/package.json`, { paths: [cwd] });
    return true;
  } catch {
    return false;
  }
}

function envPathExists(name) {
  const value = process.env[name];
  return Boolean(value && fs.existsSync(value));
}

function detectTool(tool, cwd = process.cwd()) {
  const command = (tool.detect_commands || []).find(cmd => existsOnPath(cmd) || localBinExists(cmd, cwd));
  const pkgDetected = tool.npm_package ? packageExists(tool.npm_package, cwd) : false;
  const envDetected = tool.env_path ? envPathExists(tool.env_path) : false;
  return {
    id: tool.id,
    name: tool.name,
    required: Boolean(tool.required),
    available: Boolean(command || pkgDetected || envDetected),
    detected_by: command
      ? `command:${command}`
      : pkgDetected
        ? `package:${tool.npm_package}`
        : envDetected
          ? `env:${tool.env_path}`
          : null
  };
}

export function detectTools(cwd = process.cwd()) {
  return registry().tools.map(tool => detectTool(tool, cwd));
}

export function detectIntegrations(cwd = process.cwd()) {
  return (registry().integrations || []).map(tool => detectTool(tool, cwd));
}

function yes(value) {
  return /^(y|yes|true|1)$/i.test(String(value).trim());
}

function workspaceDir(cwd = process.cwd()) {
  return path.join(cwd, ".aurora");
}

function workspaceFile(cwd = process.cwd()) {
  return path.join(workspaceDir(cwd), "workspace.json");
}

function readWorkspace(cwd = process.cwd()) {
  const file = workspaceFile(cwd);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

function writeWorkspace(workspace, cwd = process.cwd()) {
  fs.mkdirSync(workspaceDir(cwd), { recursive: true });
  workspace.updated_at = new Date().toISOString();
  fs.writeFileSync(workspaceFile(cwd), JSON.stringify(workspace, null, 2) + "\n");
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

  console.log("\nOptional browser/account resources. Answer y/n. Availability only.");
  const chatgpt = await rl.question("ChatGPT in browser available? [y/N]: ");
  const flow = await rl.question("Google Flow available? [y/N]: ");
  const meta = await rl.question("Meta AI available? [y/N]: ");
  const eleven = await rl.question("ElevenLabs available? [y/N]: ");

  rl.close();

  const tools = detectTools(cwd);
  const integrations = detectIntegrations(cwd);
  const now = new Date().toISOString();
  const mode = ["direct", "director"].includes(modeAnswer.trim().toLowerCase())
    ? modeAnswer.trim().toLowerCase()
    : existing?.default_mode || "direct";

  const workspace = {
    schema_version: 1,
    studio: "AurorA Studio",
    created_at: existing?.created_at || now,
    updated_at: now,
    default_mode: mode,
    project: {
      product: product.trim() || existing?.project?.product || "",
      purpose: purpose.trim() || existing?.project?.purpose || ""
    },
    tools,
    integrations,
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

  writeWorkspace(workspace, cwd);

  for (const log of ["decisions.jsonl", "lessons.jsonl"]) {
    const file = path.join(dir, log);
    if (!fs.existsSync(file)) fs.writeFileSync(file, "");
  }

  const styleReadme = path.join(dir, "styles", "README.md");
  if (!fs.existsSync(styleReadme)) {
    fs.writeFileSync(
      styleReadme,
      "# Workspace styles\n\nOnly save styles that were useful, approved, or intentionally kept for reuse.\n"
    );
  }

  console.log(`\nWorkspace ready: ${dir}`);
  await runDoctor(cwd);
}

export async function runDoctor(cwd = process.cwd()) {
  const tools = detectTools(cwd);
  const integrations = detectIntegrations(cwd);
  const ws = readWorkspace(cwd);

  console.log("\nAurorA Studio doctor\n");
  for (const tool of tools) {
    const mark = tool.available ? "✓" : tool.required ? "✗ REQUIRED" : "○ optional";
    console.log(`${mark.padEnd(12)} ${tool.name}${tool.detected_by ? ` (${tool.detected_by})` : ""}`);
  }

  if (integrations.length) {
    console.log("\nIntegrations");
    for (const item of integrations) {
      console.log(`${item.available ? "✓" : "○ optional"} ${item.name}${item.detected_by ? ` (${item.detected_by})` : ""}`);
    }
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
  const live = Object.fromEntries(detectTools(cwd).map(t => [t.id, t]));
  for (const tool of registry().tools) {
    console.log(`\n${tool.name} — ${live[tool.id]?.available ? "AVAILABLE" : tool.required ? "MISSING REQUIRED" : "NOT INSTALLED / OPTIONAL"}`);
    console.log("Best for: " + tool.best_for.join(", "));
    console.log("Avoid for: " + tool.avoid_for.join(", "));
  }
}

export async function setMode(mode, cwd = process.cwd()) {
  if (!["direct", "director"].includes(mode)) {
    console.error("Mode must be: direct or director");
    process.exitCode = 2;
    return;
  }

  const ws = readWorkspace(cwd);
  if (!ws) {
    console.error("Workspace is not configured. Run: aurora-studio setup");
    process.exitCode = 2;
    return;
  }

  ws.default_mode = mode;
  writeWorkspace(ws, cwd);
  console.log(`AurorA Studio mode: ${mode}`);
}

export async function showWorkspace(cwd = process.cwd()) {
  const ws = readWorkspace(cwd);
  if (!ws) {
    console.log("Workspace is not configured. Run: aurora-studio setup");
    return;
  }
  console.log(JSON.stringify(ws, null, 2));
}

export function runPreflight(cwd = process.cwd()) {
  const ws = readWorkspace(cwd);
  if (!ws) {
    return { ok: false, errors: ["Workspace is not configured. Run: aurora-studio setup"], tools: [], integrations: [] };
  }

  const tools = detectTools(cwd);
  const integrations = detectIntegrations(cwd);
  const missingRequired = tools.filter(t => t.required && !t.available);

  ws.tools = tools;
  ws.integrations = integrations;
  writeWorkspace(ws, cwd);

  return {
    ok: missingRequired.length === 0,
    errors: missingRequired.map(t => `Missing required tool: ${t.name}`),
    tools,
    integrations
  };
}

export async function recommendRoute(taskText = "", cwd = process.cwd()) {
  const preflight = runPreflight(cwd);
  if (!preflight.ok) {
    for (const error of preflight.errors) console.error(error);
    process.exitCode = 2;
    return;
  }

  const q = taskText.toLowerCase();
  const available = Object.fromEntries(preflight.tools.map(t => [t.id, t.available]));
  const route = [];

  const true3d = /(3d|avatar|character|rig|model|product render|physics)/.test(q);
  const finishing = /(vfx|composit|tracking|after effects|ae finish)/.test(q);
  const motion2d = /(caption|typography|kinetic|ui|explainer|social|html|gsap)/.test(q);

  if (true3d) {
    if (!available.blender) {
      console.log("No safe automatic route: this task appears to need true 3D, but Blender is unavailable.");
      process.exitCode = 2;
      return;
    }
    route.push("blender");
  }

  if (finishing && available.after_effects) route.push("after_effects");

  if (motion2d || route.length === 0) {
    if (available.hyperframe) {
      route.push("hyperframe");
    } else if (motion2d) {
      console.log("No safe automatic route: this task appears to need HyperFrames, but HyperFrames is unavailable.");
      process.exitCode = 2;
      return;
    }
  } else if (available.hyperframe && !finishing) {
    route.push("hyperframe");
  }

  if (route.length === 0) {
    console.log("No confident automatic route yet. Use Director mode for this task.");
    process.exitCode = 2;
    return;
  }

  console.log(JSON.stringify({
    task: taskText,
    route,
    unavailable_optional_tools_are_not_errors: true,
    note: "Foundation router: hard rules only. Later: asset search + prior-job retrieval + evaluated learned scoring."
  }, null, 2));
}
