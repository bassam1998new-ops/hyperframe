import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { chooseRoute } from "./selector.mjs";
import { createRun, loadRun, checkpoint, evaluateSpend, finalizeRun } from "./governance.mjs";
import { probeRender } from "./quality.mjs";
import { addLibraryItem, readLibrary, searchLibrary, summarizeLibrary } from "./library.mjs";
import { importHyperframeLibrary } from "./importers/hyperframe.mjs";
import {
  blenderInfo,
  createBlenderJob,
  runBlenderJob
} from "./adapters/blender.mjs";
import {
  afterEffectsInfo,
  createAfterEffectsJob,
  runAfterEffectsJob
} from "./adapters/after-effects.mjs";
import { retrieveContext } from "./retrieval.mjs";
import { listAssetSources, recommendAssetSources, sourceImportDefaults, licenseGate } from "./asset-sources.mjs";
import { listProviders, providersFor } from "./providers.mjs";
import { validateKnowledge } from "./validate.mjs";
import { obsidianInfo, searchObsidian } from "./integrations/obsidian.mjs";
import { installAgentInstructions, removeAgentInstructions } from "./agent-install.mjs";
import { installAgentHooks, removeAgentHooks } from "./hook-install.mjs";
import { saveDiscovery } from "./discovery.mjs";
import {
  ensureProjectProfile,
  readProject,
  writeProject,
  createReference,
  readReference,
  listReferences
} from "./brain.mjs";

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

export function readWorkspace(cwd = process.cwd()) {
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
  const website = await rl.question(`Website/product URL (optional) [${existing?.project?.website || ""}]: `);
  const modeAnswer = await rl.question(`Default mode direct/director [${existing?.default_mode || "direct"}]: `);

  console.log("\nOptional browser/account resources. Answer y/n. Availability only.");
  const chatgpt = await rl.question("ChatGPT in browser available? [y/N]: ");
  const flow = await rl.question("Google Flow available? [y/N]: ");
  const meta = await rl.question("Meta AI available? [y/N]: ");
  const eleven = await rl.question("ElevenLabs available? [y/N]: ");
  const installPointers = await rl.question("Install small Claude/Codex AurorA pointers? [Y/n]: ");

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
      purpose: purpose.trim() || existing?.project?.purpose || "",
      website: website.trim() || existing?.project?.website || ""
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
  ensureProjectProfile({
    product: workspace.project.product,
    purpose: workspace.project.purpose,
    website: workspace.project.website
  }, cwd);
  readLibrary(cwd);
  saveDiscovery(cwd);
  fs.mkdirSync(path.join(dir, "references"), { recursive: true });

  try {
    importHyperframeLibrary({ cwd });
  } catch {
    // Fine for non-HyperFrames workspaces.
  }

  if (!/^(n|no|false|0)$/i.test(installPointers.trim())) {
    installAgentInstructions("all", cwd);
  }

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

  let agentSetup = null;
  try {
    agentSetup = {
      instructions: installAgentInstructions("all", cwd),
      hooks: installAgentHooks("all", cwd)
    };
  } catch (error) {
    console.warn(`Agent integration warning: ${error.message}`);
  }

  console.log(`\nWorkspace ready: ${dir}`);
  console.log(`Discovery: ${discovery.result.matched_files} useful files across ${Object.keys(discovery.result.by_kind).length} categories.`);
  if (agentSetup?.hooks?.trust_review_required) {
    console.log("Claude/Codex project hooks installed. Review/trust them in your agent before they run.");
  }
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
  const knowledge = validateKnowledge(cwd);

  ws.tools = tools;
  ws.integrations = integrations;
  writeWorkspace(ws, cwd);

  return {
    ok: missingRequired.length === 0 && knowledge.ok,
    errors: [
      ...missingRequired.map(t => `Missing required tool: ${t.name}`),
      ...knowledge.errors
    ],
    warnings: knowledge.warnings,
    tools,
    integrations
  };
}

export async function recommendRoute(taskText = "", cwd = process.cwd()) {
  const preflight = runPreflight(cwd);
  if (!preflight.ok) {
    for (const error of preflight.errors) console.error(error);
    process.exitCode = 2;
    return null;
  }

  const availability = Object.fromEntries(preflight.tools.map(t => [t.id, t.available]));
  const decision = chooseRoute(taskText, availability);

  if (!decision.selected) {
    console.log(JSON.stringify({
      task: taskText,
      route: null,
      confidence: 0,
      reason: "No available production path meets the minimum task-fit threshold.",
      next: "Use Director mode, install the missing capability, or change the production approach.",
      candidates: decision.candidates.slice(0, 3)
    }, null, 2));
    process.exitCode = 2;
    return null;
  }

  console.log(JSON.stringify({
    task: taskText,
    route: decision.selected.route,
    score: decision.selected.score,
    confidence: decision.confidence,
    requirements: decision.requirements,
    alternatives: decision.candidates.slice(1, 4).map(c => ({ route: c.route, score: c.score }))
  }, null, 2));
  return decision;
}

export async function planProduction(taskText = "", options = {}, cwd = process.cwd()) {
  if (!taskText.trim()) {
    console.error("Provide a task to plan.");
    process.exitCode = 2;
    return null;
  }

  const preflight = runPreflight(cwd);
  if (!preflight.ok) {
    for (const error of preflight.errors) console.error(error);
    process.exitCode = 2;
    return null;
  }

  const ws = readWorkspace(cwd);
  const project = readProject(cwd);
  let referenceRecord = null;

  if (options.referenceId) {
    try {
      referenceRecord = readReference(options.referenceId, cwd);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 2;
      return null;
    }
  }

  const referenceAnalysis = referenceRecord?.reference?.analysis || {};
  const requirementOverrides = {
    ...(typeof referenceAnalysis.requires_true_3d === "boolean"
      ? { true3d: referenceAnalysis.requires_true_3d }
      : {}),
    ...(typeof referenceAnalysis.requires_compositing === "boolean"
      ? { compositing: referenceAnalysis.requires_compositing }
      : {})
  };

  const availability = Object.fromEntries(preflight.tools.map(t => [t.id, t.available]));
  const decision = chooseRoute(taskText, availability, requirementOverrides);

  if (!decision.selected) {
    console.error("No safe automatic route. Use Director mode or add the missing capability.");
    process.exitCode = 2;
    return null;
  }

  const budget = ws?.budget || {
    mode: "observe",
    cap_usd: null,
    approval_threshold_usd: 1.00
  };

  const run = createRun({
    cwd,
    task: taskText,
    mode: ws.default_mode,
    routeDecision: decision,
    budget
  });

  const contextPacket = retrieveContext({
    query: taskText,
    referenceId: referenceRecord?.reference?.id || null,
    cwd,
    libraryLimit: 8,
    memoryLimit: 5
  });
  fs.writeFileSync(path.join(run.dir, "context.json"), JSON.stringify({
    ...contextPacket,
    captured_at: new Date().toISOString()
  }, null, 2) + "\n");
  const libraryMatches = [
    ...(contextPacket.reusable?.styles || []),
    ...(contextPacket.reusable?.assets || [])
  ];

  const decisionPath = path.join(run.dir, "decisions.jsonl");
  fs.appendFileSync(decisionPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    type: "route_selection",
    selected: decision.selected,
    alternatives: decision.candidates.slice(1, 4),
    confidence: decision.confidence
  }) + "\n");

  console.log(JSON.stringify({
    run_id: run.id,
    mode: ws.default_mode,
    route: decision.selected.route,
    score: decision.selected.score,
    confidence: decision.confidence,
    first_stage: "understand",
    plan: path.join(run.dir, "plan.json"),
    context: path.join(run.dir, "context.json"),
    reference: referenceRecord?.reference?.id || null,
    library_matches: libraryMatches.slice(0, 3).map(x => ({ id: x.id, name: x.name, score: x.search_score }))
  }, null, 2));
  return run;
}

export async function showRunStatus(runId, cwd = process.cwd()) {
  try {
    const run = loadRun(cwd, runId);
    console.log(JSON.stringify({
      run_id: runId,
      task: run.plan.task,
      mode: run.plan.mode,
      route: run.plan.route,
      current_stage: run.state.current_stage,
      status: run.state.status,
      checkpoints: run.state.checkpoints
    }, null, 2));
    return run;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}

export async function writeRunCheckpoint(runId, stage, status, options = {}, cwd = process.cwd()) {
  try {
    const state = checkpoint({
      cwd,
      runId,
      stage,
      status,
      artifact: options.artifact || null,
      note: options.note || null,
      humanApproved: Boolean(options.humanApproved)
    });
    console.log(JSON.stringify({
      run_id: runId,
      stage,
      status,
      run_status: state.status
    }, null, 2));
    return state;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}

export async function checkBudget(estimatedUsd, spentUsd = 0, cwd = process.cwd()) {
  const ws = readWorkspace(cwd);
  if (!ws) {
    console.error("Workspace is not configured. Run: aurora-studio setup");
    process.exitCode = 2;
    return null;
  }
  const policy = ws.budget || { mode: "observe", cap_usd: null, approval_threshold_usd: 1.00 };
  const result = evaluateSpend(policy, {
    estimated_usd: Number(estimatedUsd || 0),
    spent_usd: Number(spentUsd || 0)
  });
  console.log(JSON.stringify({ policy, ...result }, null, 2));
  return result;
}

export async function reviewRender(file, cwd = process.cwd()) {
  const result = probeRender(path.resolve(cwd, file));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 2;
  return result;
}


export async function finalizeProduction(runId, lesson = null, cwd = process.cwd()) {
  try {
    const result = finalizeRun({ cwd, runId });
    const globalDecisionLog = path.join(cwd, ".aurora", "decisions.jsonl");
    const globalLessonLog = path.join(cwd, ".aurora", "lessons.jsonl");

    fs.appendFileSync(globalDecisionLog, JSON.stringify({
      timestamp: new Date().toISOString(),
      run_id: runId,
      task_type: "video_production",
      route: result.run.plan.route,
      approved: true,
      mode: result.run.plan.mode
    }) + "\n");

    if (lesson && lesson.trim()) {
      fs.appendFileSync(globalLessonLog, JSON.stringify({
        timestamp: new Date().toISOString(),
        run_id: runId,
        lesson: lesson.trim(),
        approved: true
      }) + "\n");
    }

    console.log(JSON.stringify({
      run_id: runId,
      status: "completed",
      removed_run_temp: result.removed_run_temp,
      decision_saved: true,
      lesson_saved: Boolean(lesson && lesson.trim())
    }, null, 2));
    return result;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}


function parseValue(value) {
  if (value === undefined) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null" ||
    /^-?\d+(\.\d+)?$/.test(trimmed)
  ) {
    try { return JSON.parse(trimmed); } catch {}
  }
  return value;
}

function setDeep(target, dottedKey, value) {
  const parts = String(dottedKey || "").split(".").filter(Boolean);
  if (!parts.length) throw new Error("Project field is required.");
  let cursor = target;
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) cursor[part] = {};
    cursor = cursor[part];
  }
  cursor[parts.at(-1)] = value;
}

export async function showProject(cwd = process.cwd()) {
  const project = readProject(cwd);
  if (!project) {
    console.error("Project profile not found. Run: aurora-studio setup");
    process.exitCode = 2;
    return null;
  }
  console.log(JSON.stringify(project, null, 2));
  return project;
}

export async function setProjectValue(key, rawValue, cwd = process.cwd()) {
  const project = readProject(cwd);
  if (!project) {
    console.error("Project profile not found. Run: aurora-studio setup");
    process.exitCode = 2;
    return null;
  }
  try {
    setDeep(project, key, parseValue(rawValue));
    writeProject(project, cwd);
    console.log(JSON.stringify({ updated: key, value: parseValue(rawValue) }, null, 2));
    return project;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}

export async function createReferenceRecord(name, source = null, cwd = process.cwd()) {
  try {
    const result = createReference(name, source, cwd);
    console.log(JSON.stringify({
      id: result.reference.id,
      file: result.file,
      next: "Agent should fill analysis + adaptation using REFERENCE-ANALYSIS.md."
    }, null, 2));
    return result;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}

export async function showReferenceRecord(idOrPath, cwd = process.cwd()) {
  try {
    const result = readReference(idOrPath, cwd);
    console.log(JSON.stringify(result.reference, null, 2));
    return result;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}

export async function listReferenceRecords(cwd = process.cwd()) {
  const items = listReferences(cwd);
  console.log(JSON.stringify(items, null, 2));
  return items;
}

export async function addLibraryRecord(input, cwd = process.cwd()) {
  try {
    let finalInput = { ...input };
    if (input.source_id) {
      const verified = input.license_id && input.license_id !== "unknown" ? input.license_id : null;
      const defaults = sourceImportDefaults(input.source_id, verified);
      finalInput = {
        ...finalInput,
        source_name: finalInput.source_name || defaults.source.name,
        license_id: verified || defaults.license_id,
        commercial_allowed: input.commercial_allowed ?? defaults.commercial_allowed,
        redistribution_allowed: input.redistribution_allowed ?? defaults.redistribution_allowed,
        attribution_required: input.attribution_required ?? defaults.attribution_required
      };
      if (defaults.requires_verification && (
        !finalInput.license_id ||
        finalInput.license_id === "unknown" ||
        finalInput.commercial_allowed === null ||
        finalInput.commercial_allowed === undefined
      )) {
        throw new Error(defaults.source.name + " requires exact asset license verification before import.");
      }
    }
    const item = addLibraryItem(finalInput, cwd);
    console.log(JSON.stringify(item, null, 2));
    return item;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}

export async function searchLibraryRecords(query, options = {}, cwd = process.cwd()) {
  const items = searchLibrary(query, options, cwd);
  console.log(JSON.stringify(items, null, 2));
  return items;
}

export async function listLibraryRecords(cwd = process.cwd()) {
  const items = readLibrary(cwd);
  console.log(JSON.stringify(items, null, 2));
  return items;
}

export async function libraryStats(cwd = process.cwd()) {
  const stats = summarizeLibrary(cwd);
  console.log(JSON.stringify(stats, null, 2));
  return stats;
}


export async function importHyperframeRecords(root = null, cwd = process.cwd()) {
  try {
    const result = importHyperframeLibrary({ root, cwd });
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}


export async function showBlenderInfo() {
  const info = blenderInfo();
  console.log(JSON.stringify(info, null, 2));
  if (!info.available) process.exitCode = 2;
  return info;
}

export async function createBlenderJobRecord(name, cwd = process.cwd()) {
  try {
    const result = createBlenderJob(name, cwd);
    console.log(JSON.stringify({ id: result.job.id, file: result.file }, null, 2));
    return result;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}

export async function executeBlenderJob(jobPath, dryRun = false, cwd = process.cwd()) {
  try {
    const result = runBlenderJob(jobPath, { cwd, dryRun });
    console.log(JSON.stringify(result, null, 2));
    if (result.ok === false) process.exitCode = 2;
    return result;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}


export async function showAfterEffectsInfo() {
  const info = afterEffectsInfo();
  console.log(JSON.stringify(info, null, 2));
  if (!info.available) process.exitCode = 2;
  return info;
}

export async function createAfterEffectsJobRecord(name, cwd = process.cwd()) {
  try {
    const result = createAfterEffectsJob(name, cwd);
    console.log(JSON.stringify({ id: result.job.id, file: result.file }, null, 2));
    return result;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}

export async function executeAfterEffectsJob(jobPath, dryRun = false, cwd = process.cwd()) {
  try {
    const result = runAfterEffectsJob(jobPath, { cwd, dryRun });
    console.log(JSON.stringify(result, null, 2));
    if (result.ok === false) process.exitCode = 2;
    return result;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}


export async function showRetrievedContext(query, referenceId = null, cwd = process.cwd()) {
  try {
    const packet = retrieveContext({ query, referenceId, cwd });
    console.log(JSON.stringify(packet, null, 2));
    return packet;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}


export async function validateStudio(cwd = process.cwd()) {
  const result = validateKnowledge(cwd);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 2;
  return result;
}

export async function showObsidianInfo() {
  const info = obsidianInfo();
  console.log(JSON.stringify(info, null, 2));
  if (!info.available) process.exitCode = 2;
  return info;
}

export async function searchObsidianKnowledge(query, vault = null) {
  try {
    const result = searchObsidian(query, { vault });
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}


export async function showResources(capability = null, cwd = process.cwd()) {
  const resources = capability ? providersFor(capability, cwd) : listProviders(cwd);
  console.log(JSON.stringify(resources, null, 2));
  return resources;
}


export async function installAgentPointers(target = "all", cwd = process.cwd()) {
  try {
    const result = {
      instructions: installAgentInstructions(target, cwd),
      hooks: installAgentHooks(target, cwd)
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}

export async function removeAgentPointers(target = "all", cwd = process.cwd()) {
  try {
    const result = {
      instructions: removeAgentInstructions(target, cwd),
      hooks: removeAgentHooks(target, cwd)
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return null;
  }
}


export async function discoverLocalWorkspace(cwd = process.cwd()) {
  const saved = saveDiscovery(cwd);
  console.log(JSON.stringify({
    file: saved.file,
    scanned_files: saved.result.scanned_files,
    matched_files: saved.result.matched_files,
    truncated: saved.result.truncated,
    by_kind: Object.fromEntries(
      Object.entries(saved.result.by_kind).map(([key, files]) => [key, files.length])
    )
  }, null, 2));
  return saved;
}


export async function showAssetSources(query = null) {
  const result = query ? recommendAssetSources(query) : listAssetSources();
  console.log(JSON.stringify(result, null, 2));
  return result;
}

export async function checkAssetLicense(assetId, forBundling = false, cwd = process.cwd()) {
  const asset = readLibrary(cwd).find(item => item.id === assetId);
  if (!asset) {
    console.error("Library item not found: " + assetId);
    process.exitCode = 2;
    return null;
  }
  const result = licenseGate(asset, { forBundling });
  console.log(JSON.stringify({ asset_id: assetId, for_bundling: forBundling, ...result }, null, 2));
  if (!result.allowed) process.exitCode = 2;
  return result;
}
