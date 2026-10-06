import fs from "node:fs";
import path from "node:path";
import { resolveHyperframesBinary } from "./tool-install.mjs";
import { findBlender } from "./adapters/blender.mjs";
import { findAfterEffects } from "./adapters/after-effects.mjs";
import { runtimeStatus } from "./runtime.mjs";
import { localRelease } from "./update.mjs";
import { systemStatus } from "./system-install.mjs";
import {
  validateReviewReportFile
} from "./review-report.mjs";
import {
  readLearningReview
} from "./learning.mjs";
import {
  readRevisions
} from "./revisions.mjs";
import { listReferences } from "./brain.mjs";
import {
  conceptDirectionLocked,
  readConceptSet
} from "./concepts.mjs";
import { assetPlanEditability } from "./asset-plan.mjs";
import { listProviders } from "./providers.mjs";
import { listAssetSources } from "./asset-sources.mjs";
import { readGenerationRequests } from "./generation-requests.mjs";

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
    path: path.relative(cwd, resolved).split(path.sep).join("/"),
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

      const assetPlan = readJson(path.join(dir, "asset-plan.json"));
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
        asset_plan: assetPlan,
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

function libraryCards(cwd, items, limit = 7) {
  return items
    .slice()
    .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")))
    .slice(0, limit)
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

function libraryItemSummary(cwd, item) {
  const preview = mediaDescriptor(cwd, item.path);
  return {
    id: item.id,
    name: item.name,
    description: item.description || "",
    kind: item.kind,
    type: item.type,
    path: item.path || null,
    source_url: item.source_url || null,
    source_name: item.source_name || null,
    approved: Boolean(item.approved),
    quality_tier: item.quality_tier || "unknown",
    tags: item.tags || [],
    tools: item.tools || [],
    license: {
      id: item.license?.id || "unknown",
      commercial_allowed: item.license?.commercial_allowed ?? null,
      redistribution_allowed: item.license?.redistribution_allowed ?? null,
      attribution_required: item.license?.attribution_required ?? null
    },
    preview:
      preview && ["image", "video"].includes(preview.type)
        ? preview
        : null
  };
}

function assetPlanRows(cwd, run, library) {
  if (!run?.asset_plan) return null;

  const byId = new Map(library.map(item => [item.id, item]));
  const editability = assetPlanEditability(run.id, cwd);

  return {
    status: run.asset_plan.status || "pending",
    summary: run.asset_plan.summary || "",
    editable: Boolean(editability.ok),
    locked_reason: editability.ok ? null : editability.reason,
    needs: (run.asset_plan.needs || []).map(need => ({
      id: need.id,
      description: need.description,
      kind: need.kind,
      decision: need.decision,
      selected_library_ids: need.selected_library_ids || [],
      selected_assets: (need.selected_library_ids || [])
        .map(id => byId.get(id))
        .filter(Boolean)
        .map(item => libraryItemSummary(cwd, item)),
      required_capabilities: need.required_capabilities || [],
      search_queries: need.search_queries || [],
      notes: need.notes || [],
      confidence: need.confidence ?? null
    }))
  };
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

function conceptRows(cwd, run) {
  if (!run || run.plan.mode !== "director") return null;

  const record = readConceptSet(run.id, cwd);
  if (!record) return null;

  const lock = conceptDirectionLocked(run.id, cwd);
  const set = record.concept_set;

  const items = (set.concepts || []).map(concept => {
    const previewPath = concept.preview?.path || null;
    const preview = previewPath
      ? mediaDescriptor(cwd, previewPath)
      : null;

    return {
      id: concept.id,
      name: concept.name,
      core_idea: concept.core_idea,
      project_fit: concept.project_fit,
      emotional_arc: concept.emotional_arc,
      visual_motion_grammar: concept.visual_motion_grammar || [],
      complexity: concept.complexity,
      cost_class: concept.cost_class,
      biggest_risk: concept.biggest_risk,
      preview:
        preview && ["image", "video"].includes(preview.type)
          ? preview
          : null,
      selected: concept.id === set.selected_id
    };
  });

  return {
    status: set.status,
    selected_id: set.selected_id,
    selected:
      items.find(item => item.id === set.selected_id) || null,
    items,
    refinement_requests: (set.refinement_requests || [])
      .filter(item => item.status === "open")
      .map(item => ({
        id: item.id,
        concept_id: item.concept_id,
        note: item.note,
        created_at: item.created_at
      })),
    direction_locked: lock.locked,
    locked_by: lock.locked_by
  };
}

function shotRows(cwd, run) {
  return (run?.build_plan?.shots || []).map((shot, index) => {
    const outputPreview = shot.output
      ? mediaDescriptor(cwd, shot.output)
      : null;

    return {
      id: shot.id,
      number: index + 1,
      purpose: shot.purpose,
      engine: shot.engine,
      quality: shot.quality,
      output: shot.output,
      output_preview:
        outputPreview &&
        ["image", "video"].includes(outputPreview.type)
          ? outputPreview
          : null,
      status: outputPreview ? "complete" : "planned",
      handoff: shot.handoff || null,
      duration_seconds: shot.duration_seconds ?? null,
      inputs: shot.inputs || [],
      asset_ids: shot.asset_ids || [],
      success_criteria: shot.success_criteria || [],
      notes: shot.notes || []
    };
  });
}

function reviewTechnicalSummary(report) {
  const streams = report?.technical?.metadata?.streams || [];
  const video = streams.find(stream => stream.codec_type === "video") || null;
  const audio = streams.find(stream => stream.codec_type === "audio") || null;
  const duration = Number(report?.technical?.metadata?.format?.duration || 0);

  return {
    ok: Boolean(report?.technical?.ok),
    duration_seconds: duration > 0 ? Number(duration.toFixed(2)) : null,
    width: video?.width || null,
    height: video?.height || null,
    video_codec: video?.codec_name || null,
    audio_codec: audio?.codec_name || null,
    audio_channels: audio?.channels || null,
    errors: report?.technical?.errors || [],
    warnings: report?.technical?.warnings || []
  };
}

function reviewCheckRows(report) {
  const checks = [
    ["reference_fit", "Reference fit", false],
    ["project_fit", "Project fit", true],
    ["story_clarity", "Story clarity", true],
    ["motion_intentional", "Motion feels intentional", true],
    ["typography", "Typography", true],
    ["captions", "Captions", false],
    ["arabic", "Arabic", false],
    ["camera_crop_safe_zones", "Crop & safe zones", true],
    ["audio", "Audio", true],
    ["three_d_vfx_quality", "3D / VFX quality", false],
    ["ai_slop_free", "No AI-slop artifacts", true]
  ];

  return checks.map(([id, label, required]) => ({
    id,
    label,
    required,
    value: report?.creative?.[id] ?? null
  }));
}

function reviewSummary(cwd, run) {
  if (!run?.review) return null;

  let validation;
  try {
    validation = validateReviewReportFile(run.id, cwd);
  } catch (error) {
    validation = {
      ok: false,
      can_complete_post_review: false,
      errors: [error.message],
      warnings: []
    };
  }

  const frames = Array.isArray(run.review.visual_evidence?.frames)
    ? run.review.visual_evidence.frames
    : [];

  const evidence = frames.flatMap(frame => {
    const media = mediaDescriptor(cwd, frame.path);
    if (!media || media.type !== "image") return [];
    return [{
      index: frame.index,
      time_seconds: frame.time_seconds,
      media
    }];
  });

  return {
    status: run.review.status,
    decision: run.review.decision,
    summary: run.review.summary,
    video: mediaDescriptor(cwd, run.review.video),
    video_sha256: run.review.video_sha256 || null,
    can_approve: Boolean(validation.can_complete_post_review),
    validation_errors: validation.errors || [],
    validation_warnings: validation.warnings || [],
    issues: [
      ...(run.review.issues || []),
      ...(run.review.assets?.issues || [])
    ],
    notes: run.review.creative?.notes || [],
    checks: reviewCheckRows(run.review),
    assets: {
      licenses_ok: run.review.assets?.licenses_ok ?? null,
      watermark_free: run.review.assets?.watermark_free ?? null
    },
    technical: reviewTechnicalSummary(run.review),
    evidence
  };
}

function renderSummary(cwd, run) {
  if (!run) return null;

  const checkpoints = run.state.checkpoints || {};
  const renderArtifact = checkpoints.render?.artifact
    ? mediaDescriptor(cwd, checkpoints.render.artifact)
    : null;

  const candidates = [];
  const seen = new Set();

  for (const shot of run.build_plan?.shots || []) {
    if (!shot.output) continue;
    const media = mediaDescriptor(cwd, shot.output);
    if (!media || media.type !== "video") continue;
    if (seen.has(media.path)) continue;
    seen.add(media.path);
    candidates.push({
      path: media.path,
      media,
      shot_id: shot.id,
      shot_purpose: shot.purpose,
      engine: shot.engine
    });
  }

  const preRenderReady =
    checkpoints.pre_render_review?.status === "completed";

  const renderComplete =
    checkpoints.render?.status === "completed";

  return {
    execution_mode: "agent_handoff",
    direct_execution_available: false,
    direct_execution_reason:
      "This route does not yet expose a universal direct render executor in Studio.",
    pre_render_ready: preRenderReady,
    render_complete: renderComplete,
    artifact: renderArtifact,
    candidates,
    can_register_output:
      preRenderReady &&
      !renderComplete &&
      candidates.length > 0,
    handoff_message:
      !renderComplete && run.state.status !== "completed"
        ? `Continue AurorA Studio run ${run.id} and render the approved build plan. Register the final render artifact when complete.`
        : null
  };
}

function finalReceipt(cwd, run) {
  const file = path.join(run.dir, "final.json");
  const receipt = readJson(file);
  if (!receipt) return null;

  return {
    run_id: receipt.run_id,
    approved_at: receipt.approved_at || null,
    final_path: receipt.final_path || null,
    sha256: receipt.sha256 || null,
    bytes: receipt.bytes ?? null,
    copied: Boolean(receipt.copied),
    media: receipt.final_path
      ? mediaDescriptor(cwd, receipt.final_path)
      : null
  };
}

function revisionRows(runId, cwd) {
  try {
    return readRevisions(runId, cwd)
      .slice()
      .reverse()
      .slice(0, 20)
      .map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        kind: item.kind,
        note: item.note,
        shot_id: item.shot_id || null,
        shot_purpose: item.shot_purpose || null,
        reopened_stage: item.reopened_stage
      }));
  } catch {
    return [];
  }
}

function referenceSourceDisplay(source) {
  if (source?.type !== "url") return source?.value || null;
  try {
    return new URL(source.value).hostname;
  } catch {
    return "External link";
  }
}

function referenceRows(cwd) {
  return listReferences(cwd)
    .slice()
    .sort((a, b) =>
      String(b.updated_at || "").localeCompare(String(a.updated_at || ""))
    )
    .map(item => {
      const source = item.source || {};
      const preview =
        source.type === "file"
          ? mediaDescriptor(cwd, source.value)
          : null;

      return {
        id: item.id,
        name: item.name,
        role: source.role || "visual",
        source_type: source.type || "unknown",
        source_value: referenceSourceDisplay(source),
        original_name: source.original_name || null,
        mime: source.mime || null,
        preview:
          preview && ["image", "video"].includes(preview.type)
            ? preview
            : null,
        analysis: item.analysis || {},
        updated_at: item.updated_at || null
      };
    });
}

function agentIntegrationStatus(cwd, run) {
  const claude = fs.existsSync(
    path.join(cwd, ".claude", "skills", "aurora-direct", "SKILL.md")
  );
  const codex = fs.existsSync(
    path.join(cwd, ".agents", "skills", "aurora-direct", "SKILL.md")
  );

  return {
    bridge_connected: false,
    claude_installed: claude,
    codex_installed: codex,
    handoff: run
      ? {
          run_id: run.id,
          message:
            `Continue AurorA Studio run ${run.id}. Read .aurora/AGENT.md and the run artifacts, then continue from stage ${run.state.current_stage}.`
        }
      : null
  };
}

function liveToolStatus(cwd, workspace) {
  const hf = resolveHyperframesBinary(cwd);
  const blender = findBlender();
  const ae = findAfterEffects();

  const fallback = new Map((workspace?.tools || []).map(tool => [tool.id, tool]));

  return [
    {
      id: "hyperframe",
      name: fallback.get("hyperframe")?.name || "HyperFrames",
      available: Boolean(hf.available),
      required: true,
      source: hf.source || null
    },
    {
      id: "blender",
      name: fallback.get("blender")?.name || "Blender",
      available: Boolean(blender),
      required: false,
      source: blender ? "detected" : null
    },
    {
      id: "after_effects",
      name: fallback.get("after_effects")?.name || "After Effects",
      available: Boolean(ae.afterfx || ae.aerender),
      required: false,
      source: ae.afterfx || ae.aerender ? "detected" : null
    }
  ];
}

export function buildStudioSnapshot(cwd = process.cwd()) {
  const root = auroraDir(cwd);
  const workspace = readJson(path.join(root, "workspace.json"));
  const project = readJson(path.join(root, "project.json"));
  const runs = readRuns(cwd);
  const run = activeRun(runs);
  const library = readLibrary(cwd);
  const references = referenceRows(cwd);
  const receipts = finalReceipts(cwd);
  const usage = summarizeUsage(run?.usage || []);
  const concepts = conceptRows(cwd, run);
  const review = reviewSummary(cwd, run);
  const render = renderSummary(cwd, run);
  const revisions = run ? revisionRows(run.id, cwd) : [];
  const learning = run ? readLearningReview(run.id, cwd) : null;

  const activity = [
    ...checkpointActivity(run),
    ...decisionActivity(run)
  ]
    .filter(item => item.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 8);

  const tools = liveToolStatus(cwd, workspace);
  const runtime = runtimeStatus();
  const release = localRelease();
  const system = systemStatus(cwd);
  const obsidian = (workspace?.integrations || []).find(item => item.id === "obsidian") || null;
  const agent = agentIntegrationStatus(cwd, run);
  const providers = listProviders(cwd).map(provider => ({
    id: provider.id,
    name: provider.name,
    kind: provider.kind,
    available: Boolean(provider.available),
    account_available: Boolean(provider.account_available),
    browser_control_required: Boolean(provider.browser_control_required),
    browser_control_available: Boolean(provider.browser_control_available),
    blocked_reason: provider.blocked_reason || null,
    best_for: provider.best_for || [],
    cost_dynamic: Boolean(provider.cost_dynamic)
  }));
  const assetSources = listAssetSources().map(source => ({
    id: source.id,
    name: source.name,
    url: source.url,
    categories: source.categories || [],
    automation: source.automation,
    license_policy: source.license_policy,
    default_license: source.default_license || null
  }));
  const assetPlan = assetPlanRows(cwd, run, library);
  const generationRequests = run
    ? readGenerationRequests(run.id, cwd).slice(-20).reverse()
    : [];

  return {
    schema_version: 1,
    configured: Boolean(workspace),
    generated_at: new Date().toISOString(),
    workspace: workspace ? {
      mode: workspace.default_mode || "direct",
      resources: workspace.resources || {}
    } : null,
    project: project || workspace?.project || null,
    references,
    agent,
    providers,
    asset_sources: assetSources,
    tools,
    runtime,
    system,
    integrations: {
      obsidian: {
        available: Boolean(obsidian?.available),
        note: obsidian?.available
          ? "Obsidian CLI detected."
          : "Optional knowledge UI."
      }
    },
    release: {
      version: release.latest_version,
      channel: release.channel,
      public_install_ready: Boolean(release.public_install_ready),
      notes: release.notes || { new: [], fixed: [] }
    },
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
      intent: run.plan.intent || { quality: "normal", aspect: "project" },
      reference_id: run.plan.reference_id || null,
      status: run.state.status,
      current_stage: run.state.current_stage,
      route: run.plan.route || [],
      route_confidence: run.plan.route_confidence || 0,
      stages: stageRows(run),
      build_plan_status: run.build_plan?.status || null,
      asset_plan: assetPlan,
      generation_requests: generationRequests,
      storyboard_editable: Boolean(
        run.build_plan &&
        run.plan.route?.length &&
        run.state.checkpoints?.finalize?.status !== "completed"
      ),
      shots: shotRows(cwd, run),
      concepts,
      review,
      render,
      approval: {
        status: run.state.checkpoints?.approval?.status || "pending",
        recorded:
          run.state.checkpoints?.approval?.human_approved === true,
        human_approved:
          run.state.checkpoints?.approval?.human_approved === true &&
          Boolean(review?.can_approve),
        stale:
          run.state.checkpoints?.approval?.human_approved === true &&
          !Boolean(review?.can_approve)
      },
      learning: learning ? {
        status: learning.review?.status || "pending",
        summary: learning.review?.summary || ""
      } : null,
      final: finalReceipt(cwd, run),
      revisions,
      selected_reference:
        references.find(item => item.id === run.plan.reference_id) || null,
      preview: previewForRun(cwd, run),
      usage
    } : null,
    library: libraryCards(cwd, library),
    library_all: library.map(item => libraryItemSummary(cwd, item)),
    activity
  };
}
