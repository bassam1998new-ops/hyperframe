import fs from "node:fs";
import path from "node:path";

const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv"]);
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".svg"]);

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return [];
  return raw.split("\n").filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

function auroraDir(cwd) {
  return path.join(cwd, ".aurora");
}

function insideRoot(root, target) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

export function resolveWorkspaceMedia(cwd, requestedPath) {
  if (!requestedPath) return null;
  const resolved = path.isAbsolute(requestedPath)
    ? path.resolve(requestedPath)
    : path.resolve(cwd, requestedPath);

  if (!insideRoot(cwd, resolved)) return null;
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return null;

  return resolved;
}

function mediaDescriptor(cwd, value) {
  const resolved = resolveWorkspaceMedia(cwd, value);
  if (!resolved) return null;
  const ext = path.extname(resolved).toLowerCase();
  const type = VIDEO_EXT.has(ext) ? "video" : IMAGE_EXT.has(ext) ? "image" : "file";
  return {
    path: path.relative(cwd, resolved),
    type
  };
}

function readRuns(cwd) {
  const root = path.join(auroraDir(cwd), "runs");
  if (!fs.existsSync(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .flatMap(entry => {
      const dir = path.join(root, entry.name);
      const state = readJson(path.join(dir, "state.json"));
      const plan = readJson(path.join(dir, "plan.json"));
      if (!state || !plan) return [];

      const buildPlan = readJson(path.join(dir, "build-plan.json"));
      const review = readJson(path.join(dir, "review.json"));
      const context = readJson(path.join(dir, "context.json"));
      const usage = readJsonl(path.join(dir, "usage.jsonl"));
      const decisions = readJsonl(path.join(dir, "decisions.jsonl"));

      return [{
        id: entry.name,
        dir,
        state,
        plan,
        build_plan: buildPlan,
        review,
        context,
        usage,
        decisions,
        updated_at: state.updated_at || plan.created_at || null
      }];
    })
    .sort((a, b) =>
      String(b.updated_at || "").localeCompare(String(a.updated_at || ""))
    );
}

function activeRun(runs) {
  return runs.find(run => run.state.status !== "completed") || runs[0] || null;
}

function summarizeUsage(entries = []) {
  let actualUsd = 0;
  const units = {};

  for (const entry of entries) {
    if (entry.phase !== "actual") continue;
    if (entry.usd != null) actualUsd += Number(entry.usd || 0);
    const key = entry.provider || "unknown";
    units[key] ||= {};
    units[key][entry.unit || "units"] =
      Number(((units[key][entry.unit || "units"] || 0) + Number(entry.quantity || 0)).toFixed(4));
  }

  return {
    actual_usd: Number(actualUsd.toFixed(4)),
    units
  };
}

function readLibrary(cwd) {
  const file = path.join(auroraDir(cwd), "library", "index.jsonl");
  return readJsonl(file);
}

function finalReceipts(cwd) {
  const root = path.join(cwd, "renders", "final");
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .filter(name => name.endsWith(".receipt.json"))
    .flatMap(name => {
      const receipt = readJson(path.join(root, name));
      return receipt ? [receipt] : [];
    });
}

function checkpointActivity(run) {
  if (!run) return [];
  return Object.entries(run.state.checkpoints || {})
    .map(([stage, item]) => ({
      type: "checkpoint",
      title: stage.replaceAll("_", " "),
      status: item.status,
      detail: item.note || null,
      at: item.updated_at || run.updated_at,
      stage
    }));
}

function decisionActivity(run) {
  if (!run) return [];
  return (run.decisions || []).map(item => ({
    type: item.type || "decision",
    title: item.type === "route_selection"
      ? "Production route selected"
      : item.type === "run_created"
        ? "Run created"
        : String(item.type || "decision").replaceAll("_", " "),
    status: item.type === "route_selection" ? "done" : "info",
    detail: item.selected?.route?.join(" → ") || item.routing || null,
    at: item.timestamp || null
  }));
}

function previewForRun(cwd, run) {
  if (!run) return null;
  const candidates = [
    run.review?.video,
    run.state.checkpoints?.render?.artifact,
    run.state.checkpoints?.post_render_review?.artifact
  ].filter(Boolean);

  for (const item of candidates) {
    const media = mediaDescriptor(cwd, item);
    if (media && media.type !== "file") return media;
  }
  return null;
}

function libraryCards(cwd, items) {
  return items
    .slice()
    .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")))
    .slice(0, 7)
    .map(item => {
      const preview = mediaDescriptor(cwd, item.path);
      return {
        id: item.id,
        name: item.name,
        kind: item.kind,
        type: item.type,
        approved: Boolean(item.approved),
        quality_tier: item.quality_tier,
        tools: item.tools || [],
        license: item.license?.id || "unknown",
        preview: preview && ["image", "video"].includes(preview.type) ? preview : null
      };
    });
}

function stageRows(run) {
  if (!run) return [];
  const current = run.state.current_stage;

  return (run.plan.stages || []).map(stage => {
    const checkpoint = run.state.checkpoints?.[stage.id];
    const status = checkpoint?.status || stage.status || "pending";
    return {
      id: stage.id,
      label: stage.id.replaceAll("_", " "),
      status,
      current: stage.id === current,
      skippable: Boolean(stage.skippable),
      human_gate: Boolean(stage.human_approval_required)
    };
  });
}

function shotRows(run) {
  return (run?.build_plan?.shots || []).map((shot, index) => ({
    id: shot.id,
    number: index + 1,
    purpose: shot.purpose,
    engine: shot.engine,
    quality: shot.quality,
    output: shot.output,
    handoff: shot.handoff || null,
    duration_seconds: shot.duration_seconds ?? null
  }));
}

export function buildStudioSnapshot(cwd = process.cwd()) {
  const root = auroraDir(cwd);
  const workspace = readJson(path.join(root, "workspace.json"));
  const project = readJson(path.join(root, "project.json"));
  const runs = readRuns(cwd);
  const run = activeRun(runs);
  const library = readLibrary(cwd);
  const receipts = finalReceipts(cwd);
  const usage = summarizeUsage(run?.usage || []);

  const activity = [
    ...checkpointActivity(run),
    ...decisionActivity(run)
  ]
    .filter(item => item.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 8);

  const tools = (workspace?.tools || []).map(tool => ({
    id: tool.id,
    name: tool.name,
    available: Boolean(tool.available),
    required: Boolean(tool.required)
  }));

  return {
    schema_version: 1,
    configured: Boolean(workspace),
    generated_at: new Date().toISOString(),
    workspace: workspace ? {
      mode: workspace.default_mode || "direct",
      resources: workspace.resources || {}
    } : null,
    project: project || workspace?.project || null,
    tools,
    stats: {
      finals: receipts.length,
      library_total: library.length,
      library_approved: library.filter(item => item.approved).length,
      actual_usd: usage.actual_usd
    },
    active_run: run ? {
      id: run.id,
      task: run.plan.task,
      mode: run.plan.mode,
      status: run.state.status,
      current_stage: run.state.current_stage,
      route: run.plan.route || [],
      route_confidence: run.plan.route_confidence || 0,
      stages: stageRows(run),
      shots: shotRows(run),
      review: run.review ? {
        status: run.review.status,
        decision: run.review.decision,
        summary: run.review.summary
      } : null,
      preview: previewForRun(cwd, run),
      usage
    } : null,
    library: libraryCards(cwd, library),
    activity
  };
}
