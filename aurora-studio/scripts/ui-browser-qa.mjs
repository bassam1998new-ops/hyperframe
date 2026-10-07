import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

import { writeConfiguredWorkspace } from "../src/configured-setup.mjs";
import { startStudioUiServer } from "../src/ui-server.mjs";
import { HYPERFRAMES_RANGE } from "../src/tool-install.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUTPUT = path.join(ROOT, "artifacts", "ui-qa");
const SCREENSHOTS = path.join(OUTPUT, "screenshots");
const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const STAGES = [
  "understand",
  "concept",
  "mood",
  "assets",
  "routing",
  "build_plan",
  "build",
  "pre_render_review",
  "render",
  "post_render_review",
  "approval",
  "finalize"
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        result.stdout || "",
        result.stderr || ""
      ].join("\n")
    );
  }

  return result.stdout;
}

function which(command) {
  const result = spawnSync("which", [command], { encoding: "utf8" });
  return result.status === 0
    ? result.stdout.split(/\r?\n/).map(value => value.trim()).find(Boolean) || null
    : null;
}

function chromePath() {
  const candidates = [
    process.env.AURORA_CHROME_PATH,
    which("google-chrome"),
    which("google-chrome-stable"),
    which("chromium"),
    which("chromium-browser"),
    "/usr/bin/google-chrome",
    "/usr/bin/chromium"
  ].filter(Boolean);

  const found = candidates.find(file => fs.existsSync(file));
  if (!found) {
    throw new Error(
      "Chrome/Chromium is required for UI visual QA. Set AURORA_CHROME_PATH if needed."
    );
  }
  return found;
}

function ffmpegPath() {
  const found = process.env.AURORA_FFMPEG_PATH || which("ffmpeg");
  if (!found || !fs.existsSync(found)) {
    throw new Error("FFmpeg is required for UI visual QA fixtures.");
  }
  return found;
}

function ffprobePath() {
  const found = which("ffprobe");
  if (!found || !fs.existsSync(found)) {
    throw new Error("ffprobe is required for UI visual QA fixtures.");
  }
  return found;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function writeJsonl(file, values) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    values.map(value => JSON.stringify(value)).join("\n") + (values.length ? "\n" : "")
  );
}

function hash(file) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(file));
  return h.digest("hex");
}

function timestamp(offsetSeconds = 0) {
  return new Date(Date.UTC(2026, 9, 7, 0, 0, offsetSeconds)).toISOString();
}

function posterSvg(title, subtitle, colorA, colorB) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${colorA}"/>
        <stop offset="1" stop-color="${colorB}"/>
      </linearGradient>
      <radialGradient id="r">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".24"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="675" fill="#080914"/>
    <rect x="34" y="34" width="1132" height="607" rx="36" fill="url(#g)" opacity=".64"/>
    <circle cx="870" cy="265" r="220" fill="url(#r)"/>
    <circle cx="870" cy="265" r="112" fill="#0a0d1b" opacity=".48"/>
    <text x="92" y="470" fill="#ffffff" font-size="60" font-family="Arial, sans-serif" font-weight="700">${title}</text>
    <text x="96" y="520" fill="#d7d2ea" font-size="24" font-family="Arial, sans-serif">${subtitle}</text>
  </svg>`;
}

function createFakeHyperframes(cwd) {
  const packageRoot = path.join(cwd, ".aurora", "tools", "node_modules", "hyperframes");
  const binRoot = path.join(cwd, ".aurora", "tools", "node_modules", ".bin");
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.mkdirSync(binRoot, { recursive: true });

  writeJson(path.join(packageRoot, "package.json"), {
    name: "hyperframes",
    version: HYPERFRAMES_RANGE,
    type: "module",
    bin: { hyperframes: "./cli.mjs" }
  });
  fs.writeFileSync(
    path.join(packageRoot, "cli.mjs"),
    'console.log(JSON.stringify({ok:true,fixture:true}));\n'
  );

  const shim = path.join(binRoot, "hyperframes");
  fs.writeFileSync(shim, "#!/usr/bin/env sh\nexit 0\n");
  fs.chmodSync(shim, 0o755);
}

function enrichWorkspace(cwd, ffmpeg) {
  const toolRoot = path.join(cwd, "qa-tools");
  const blender = path.join(toolRoot, "blender");
  const afterEffects = path.join(toolRoot, "after-effects");
  fs.mkdirSync(afterEffects, { recursive: true });
  fs.writeFileSync(blender, "#!/usr/bin/env sh\necho 'Blender QA fixture'\n");
  fs.writeFileSync(
    path.join(afterEffects, "After Effects"),
    "#!/usr/bin/env sh\necho 'After Effects QA fixture'\n"
  );
  fs.writeFileSync(
    path.join(afterEffects, "aerender"),
    "#!/usr/bin/env sh\necho 'aerender QA fixture'\n"
  );
  fs.chmodSync(blender, 0o755);
  fs.chmodSync(path.join(afterEffects, "After Effects"), 0o755);
  fs.chmodSync(path.join(afterEffects, "aerender"), 0o755);

  const workspaceFile = path.join(cwd, ".aurora", "workspace.json");
  const workspace = JSON.parse(fs.readFileSync(workspaceFile, "utf8"));
  workspace.tool_paths ||= {};
  workspace.tool_paths.ffmpeg = ffmpeg;
  workspace.tool_paths.blender = blender;
  workspace.tool_paths.after_effects = afterEffects;
  workspace.budget = {
    mode: "warn",
    cap_usd: null,
    approval_threshold_usd: 1
  };
  workspace.resources = {
    ...(workspace.resources || {}),
    browser_control: true,
    chatgpt_browser: true,
    google_flow: true,
    meta_ai: true,
    elevenlabs: true,
    local_paths: []
  };
  workspace.integrations = [
    {
      id: "obsidian",
      name: "Obsidian",
      available: true,
      configured: true,
      note: "QA fixture"
    }
  ];
  writeJson(workspaceFile, workspace);

  const projectFile = path.join(cwd, ".aurora", "project.json");
  const project = JSON.parse(fs.readFileSync(projectFile, "utf8"));
  Object.assign(project, {
    product: "AurorA Studio",
    website: "https://example.com/aurora",
    purpose: "Premium product launch and educational videos",
    audience: ["Founders", "Marketing leaders", "Creative teams"],
    audience_context: {
      knowledge_level: "Informed",
      priorities: ["Quality", "Speed", "Control", "Reusability"]
    },
    offer: "Agent-driven video production with reusable project memory",
    positioning: "Premium open community studio that orchestrates the right creative engine.",
    claims_to_protect: [
      "Direct mode stays simple",
      "Director mode gives owner control before expensive production"
    ],
    brand: {
      personality: ["Premium", "Intelligent", "Cinematic"],
      colors: ["#8B5CFF", "#3885FF", "#4CE7EE", "#060711"],
      fonts: ["Inter"],
      logo_paths: [],
      avoid: ["Generic dashboards", "Noisy gradients", "Fake progress"]
    },
    content: {
      channels: ["YouTube", "Instagram", "LinkedIn"],
      default_formats: ["16:9", "9:16"],
      languages: ["English", "Arabic"],
      recurring_series: ["AurorA build notes", "AI workflow demos"]
    },
    creative: {
      preferred_moods: ["Cinematic", "Precise", "Futuristic"],
      avoid_moods: ["Toy-like", "Template-heavy"],
      recurring_constraints: ["Keep UI text readable", "Respect safe zones"]
    },
    sources: [
      {
        type: "owner",
        value: "Studio QA fixture",
        checked_at: timestamp(1),
        note: "Deterministic browser QA"
      }
    ],
    notes: ["Reference-level UI quality is mandatory."],
    updated_at: timestamp(2)
  });
  writeJson(projectFile, project);
}

function createCreativeAssets(cwd) {
  const assetRoot = path.join(cwd, "qa-assets");
  fs.mkdirSync(assetRoot, { recursive: true });

  const posters = [
    ["hero.svg", "AURORA", "Agent-first creative control", "#7442ff", "#205ce8"],
    ["flow.svg", "FLOW", "Generated motion reference", "#2d55f4", "#34d6e5"],
    ["glass.svg", "GLASS", "Premium material look", "#6a39d7", "#1aaab8"],
    ["type.svg", "TYPE", "Kinetic editorial system", "#8b4cf0", "#304bd2"],
    ["avatar.svg", "AVATAR", "Rigged 3D character", "#5534d8", "#2cbccb"],
    ["audio.svg", "AUDIO", "Approved voice treatment", "#2639b8", "#5d34ca"],
    ["brand.svg", "BRAND", "AurorA visual language", "#7c3ce8", "#2276db"],
    ["reference.svg", "REFERENCE", "Premium dark motion grammar", "#34206c", "#176f8c"]
  ];

  for (const [name, title, subtitle, a, b] of posters) {
    fs.writeFileSync(
      path.join(assetRoot, name),
      posterSvg(title, subtitle, a, b)
    );
  }

  const now = timestamp(3);
  const library = [
    {
      id: "hero-system",
      name: "AurorA Hero System",
      description: "Approved dark premium hero composition.",
      kind: "style",
      type: "hyperframe-style",
      path: "qa-assets/hero.svg",
      source_id: "project",
      source_name: "AurorA QA",
      source_url: null,
      license: {
        id: "project-managed",
        commercial_allowed: true,
        redistribution_allowed: false,
        attribution_required: false
      },
      approved: true,
      quality_tier: "hero",
      tools: ["hyperframe"],
      tags: ["premium", "dark", "hero"],
      created_at: now,
      updated_at: now
    },
    {
      id: "flow-motion",
      name: "Flow Motion Frame",
      description: "Selected generated motion frame.",
      kind: "asset",
      type: "image",
      path: "qa-assets/flow.svg",
      source_id: "google-flow",
      source_name: "Google Flow",
      source_url: "https://labs.google/fx/tools/flow",
      license: {
        id: "provider-output",
        commercial_allowed: true,
        redistribution_allowed: false,
        attribution_required: false
      },
      approved: true,
      quality_tier: "premium",
      tools: ["hyperframe"],
      tags: ["motion", "reference"],
      created_at: now,
      updated_at: now
    },
    {
      id: "glass-material",
      name: "Iridescent Glass",
      description: "CC0 glass material for 3D hero shots.",
      kind: "material",
      type: "material",
      path: "qa-assets/glass.svg",
      source_id: "poly-haven",
      source_name: "Poly Haven",
      source_url: "https://polyhaven.com/",
      license: {
        id: "CC0-1.0",
        commercial_allowed: true,
        redistribution_allowed: true,
        attribution_required: false
      },
      approved: true,
      quality_tier: "premium",
      tools: ["blender"],
      tags: ["glass", "material", "3d"],
      created_at: now,
      updated_at: now
    },
    {
      id: "kinetic-type",
      name: "Kinetic Editorial Type",
      description: "Reusable typography and motion grammar.",
      kind: "style",
      type: "hyperframe-style",
      path: "qa-assets/type.svg",
      source_id: "project",
      source_name: "AurorA QA",
      source_url: null,
      license: {
        id: "project-managed",
        commercial_allowed: true,
        redistribution_allowed: false,
        attribution_required: false
      },
      approved: true,
      quality_tier: "premium",
      tools: ["hyperframe"],
      tags: ["type", "editorial"],
      created_at: now,
      updated_at: now
    },
    {
      id: "rigged-avatar",
      name: "AurorA Guide Avatar",
      description: "Tracked rigged 3D character.",
      kind: "model",
      type: "blend",
      path: "qa-assets/avatar.svg",
      source_id: "project",
      source_name: "AurorA QA",
      source_url: null,
      license: {
        id: "project-managed",
        commercial_allowed: true,
        redistribution_allowed: false,
        attribution_required: false
      },
      approved: true,
      quality_tier: "hero",
      tools: ["blender"],
      tags: ["avatar", "rigged", "3d"],
      created_at: now,
      updated_at: now
    },
    {
      id: "voice-treatment",
      name: "Founder Voice Treatment",
      description: "Approved voice direction metadata.",
      kind: "audio",
      type: "audio",
      path: "qa-assets/audio.svg",
      source_id: "elevenlabs",
      source_name: "ElevenLabs",
      source_url: "https://elevenlabs.io/",
      license: {
        id: "provider-output",
        commercial_allowed: true,
        redistribution_allowed: false,
        attribution_required: false
      },
      approved: true,
      quality_tier: "premium",
      tools: ["hyperframe"],
      tags: ["voice", "audio"],
      created_at: now,
      updated_at: now
    },
    {
      id: "brand-system",
      name: "AurorA Brand System",
      description: "Current brand palette and composition language.",
      kind: "template",
      type: "brand-kit",
      path: "qa-assets/brand.svg",
      source_id: "project",
      source_name: "AurorA QA",
      source_url: null,
      license: {
        id: "project-managed",
        commercial_allowed: true,
        redistribution_allowed: false,
        attribution_required: false
      },
      approved: true,
      quality_tier: "premium",
      tools: ["hyperframe", "blender"],
      tags: ["brand", "template"],
      created_at: now,
      updated_at: now
    }
  ];

  writeJsonl(
    path.join(cwd, ".aurora", "library", "index.jsonl"),
    library
  );

  const refId = "premium-motion-reference";
  writeJson(
    path.join(cwd, ".aurora", "references", refId + ".json"),
    {
      schema_version: 1,
      id: refId,
      name: "Premium Motion Reference",
      source: {
        type: "file",
        value: "qa-assets/reference.svg",
        role: "visual",
        mime: "image/svg+xml",
        original_name: "reference.svg"
      },
      analysis: {
        medium: "motion design",
        subject: "premium AI product",
        quality_tier: "hero",
        camera: ["slow controlled push", "clean editorial framing"],
        lighting: ["deep indigo", "violet rim", "cyan accents"],
        typography: ["compact neutral UI", "large clean hierarchy"],
        skills_required: ["kinetic typography", "3d", "compositing"]
      },
      created_at: now,
      updated_at: now
    }
  );

  return { refId };
}

function generateReviewMedia(cwd, ffmpeg, ffprobe) {
  const renders = path.join(cwd, "renders");
  const runFrames = path.join(cwd, ".aurora", "runs", "qa-run", "review-frames");
  fs.mkdirSync(renders, { recursive: true });
  fs.mkdirSync(runFrames, { recursive: true });

  const video = path.join(renders, "aurora-review.mp4");
  const font = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
  const visualFilter = [
    "drawbox=x=0:y=0:w=iw:h=ih:color=0x070816:t=fill",
    "drawbox=x='120+70*sin(t*1.1)':y='80+24*cos(t*.8)':w=470:h=470:color=0x6d42ff@0.16:t=fill",
    "drawbox=x='840+55*cos(t*.7)':y='230+35*sin(t*.9)':w=300:h=300:color=0x24cfe8@0.11:t=fill",
    "drawgrid=width=80:height=80:thickness=1:color=white@0.025",
    `drawtext=fontfile=${font}:text='AURORA':fontcolor=0xe9e6ff:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2`,
    `drawtext=fontfile=${font}:text='STUDIO REVIEW':fontcolor=0x9d99b5:fontsize=18:x=(w-text_w)/2:y=(h/2)+72`
  ].join(",");

  run(ffmpeg, [
    "-y",
    "-f", "lavfi",
    "-i", "color=c=0x070816:size=1280x720:rate=30",
    "-f", "lavfi",
    "-i", "sine=frequency=220:sample_rate=48000",
    "-vf", visualFilter,
    "-t", "3",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-shortest",
    video
  ]);

  const metadata = JSON.parse(
    run(ffprobe, [
      "-v", "error",
      "-show_streams",
      "-show_format",
      "-of", "json",
      video
    ])
  );

  const frames = [];
  for (const [index, time] of [0.5, 1.5, 2.5].entries()) {
    const file = path.join(runFrames, `frame-${index + 1}.png`);
    run(ffmpeg, [
      "-y",
      "-ss", String(time),
      "-i", video,
      "-frames:v", "1",
      file
    ]);
    frames.push({
      index: index + 1,
      time_seconds: time,
      path: path.relative(cwd, file).split(path.sep).join("/"),
      sha256: hash(file)
    });
  }

  return {
    relativeVideo: path.relative(cwd, video).split(path.sep).join("/"),
    videoSha: hash(video),
    metadata,
    frames
  };
}

function stagePlan(mode, currentStage, route = []) {
  return {
    schema_version: 1,
    run_id: "qa-run",
    task: "Launch AurorA Studio with premium cinematic motion",
    mode,
    intent: {
      quality: "hero",
      aspect: "16:9"
    },
    reference_id: "premium-motion-reference",
    created_at: timestamp(10),
    route,
    route_score: route.length ? 9.4 : null,
    route_confidence: route.length ? 0.93 : 0,
    alternatives: [],
    budget: {
      mode: "warn",
      cap_usd: null,
      approval_threshold_usd: 1
    },
    stages: STAGES.map(id => ({
      id,
      status:
        STAGES.indexOf(id) < STAGES.indexOf(currentStage)
          ? "completed"
          : id === currentStage
            ? "in_progress"
            : "pending",
      skippable: mode === "direct" && ["concept", "mood"].includes(id),
      human_approval_required: id === "concept" || id === "approval"
    }))
  };
}

function stageState(mode, currentStage, checkpoints = {}) {
  return {
    schema_version: 1,
    run_id: "qa-run",
    status: "in_progress",
    current_stage: currentStage,
    mode,
    created_at: timestamp(10),
    updated_at: timestamp(20),
    checkpoints
  };
}

function clearRuns(cwd) {
  fs.rmSync(path.join(cwd, ".aurora", "runs"), {
    recursive: true,
    force: true
  });
}

function writeRun(cwd, {
  mode,
  currentStage,
  route = [],
  checkpoints = {},
  concepts = null,
  assetPlan = null,
  buildPlan = null,
  review = null,
  usage = []
}) {
  clearRuns(cwd);
  const runDir = path.join(cwd, ".aurora", "runs", "qa-run");
  fs.mkdirSync(runDir, { recursive: true });

  writeJson(
    path.join(runDir, "plan.json"),
    stagePlan(mode, currentStage, route)
  );
  writeJson(
    path.join(runDir, "state.json"),
    stageState(mode, currentStage, checkpoints)
  );
  writeJsonl(
    path.join(runDir, "usage.jsonl"),
    usage
  );
  writeJsonl(
    path.join(runDir, "decisions.jsonl"),
    [
      {
        timestamp: timestamp(11),
        type: "run_created",
        routing: "pending"
      },
      ...(route.length
        ? [{
            timestamp: timestamp(18),
            type: "route_selection",
            selected: { route }
          }]
        : [])
    ]
  );

  if (concepts) writeJson(path.join(runDir, "concepts.json"), concepts);
  if (assetPlan) writeJson(path.join(runDir, "asset-plan.json"), assetPlan);
  if (buildPlan) writeJson(path.join(runDir, "build-plan.json"), buildPlan);
  if (review) writeJson(path.join(runDir, "review.json"), review);

  return runDir;
}

function conceptFixture() {
  return {
    schema_version: 1,
    run_id: "qa-run",
    status: "ready",
    selected_id: null,
    concepts: [
      {
        id: "precision-orbit",
        name: "Precision Orbit",
        core_idea: "A controlled 3D orbit reveals the product as a calm command center.",
        project_fit: "Shows control and depth without making the workflow feel complex.",
        emotional_arc: "Curiosity → control → confidence",
        visual_motion_grammar: [
          "slow orbital camera",
          "violet edge light",
          "clean editorial labels"
        ],
        complexity: "hero",
        cost_class: "medium",
        biggest_risk: "Too much 3D can distract from the simple product promise."
      },
      {
        id: "system-awakens",
        name: "System Awakens",
        core_idea: "UI states activate one by one around the Aurora orb.",
        project_fit: "Turns the agent workflow into a clear visual story.",
        emotional_arc: "Quiet → active → resolved",
        visual_motion_grammar: [
          "panel illumination",
          "kinetic typography",
          "cyan/violet status motion"
        ],
        complexity: "medium",
        cost_class: "low",
        biggest_risk: "Too many UI beats can feel like a dashboard demo."
      },
      {
        id: "one-request",
        name: "One Request",
        core_idea: "Start from one simple prompt and reveal the hidden production depth only when useful.",
        project_fit: "Directly demonstrates AurorA's core value proposition.",
        emotional_arc: "Simple → surprising → premium",
        visual_motion_grammar: [
          "single-line prompt",
          "editorial cuts",
          "controlled build reveal"
        ],
        complexity: "medium",
        cost_class: "low",
        biggest_risk: "The transformation must feel earned, not magical."
      }
    ],
    refinement_requests: [],
    created_at: timestamp(10),
    updated_at: timestamp(20)
  };
}

function assetPlanFixture() {
  return {
    schema_version: 1,
    run_id: "qa-run",
    status: "completed",
    summary: "Reuse approved brand/style assets and build the hero 3D moment.",
    needs: [
      {
        id: "brand",
        description: "Approved AurorA brand system",
        kind: "template",
        decision: "reuse",
        selected_library_ids: ["brand-system"],
        required_capabilities: [],
        search_queries: [],
        notes: [],
        confidence: 1
      },
      {
        id: "hero-3d",
        description: "True 3D hero reveal",
        kind: "model",
        decision: "modify",
        selected_library_ids: ["rigged-avatar", "glass-material"],
        required_capabilities: ["true_3d", "lighting"],
        search_queries: [],
        notes: [],
        confidence: 0.94
      }
    ]
  };
}

function buildPlanFixture(cwd) {
  return {
    schema_version: 1,
    run_id: "qa-run",
    status: "pending",
    summary: "Blender hero elements feed the HyperFrames editorial composition.",
    route: ["blender", "hyperframe"],
    shots: [
      {
        id: "open-orb",
        purpose: "Open on the Aurora orb and simple prompt",
        engine: "hyperframe",
        duration_seconds: 2.4,
        inputs: [],
        asset_ids: ["brand-system"],
        output: "qa-assets/hero.svg",
        quality: "hero",
        success_criteria: ["Immediate visual confidence"],
        notes: [],
        handoff: null
      },
      {
        id: "avatar-orbit",
        purpose: "Reveal the dimensional AI guide with a controlled orbit",
        engine: "blender",
        duration_seconds: 3.2,
        inputs: [],
        asset_ids: ["rigged-avatar", "glass-material"],
        output: "qa-assets/avatar.svg",
        quality: "hero",
        success_criteria: ["Premium lighting", "No noisy camera motion"],
        notes: [],
        handoff: {
          from: "blender",
          to: "hyperframe",
          format: "transparent_webm",
          notes: []
        }
      },
      {
        id: "workflow-board",
        purpose: "Show the production board and engine handoff",
        engine: "hyperframe",
        duration_seconds: 3.6,
        inputs: [],
        asset_ids: ["kinetic-type"],
        output: "qa-assets/type.svg",
        quality: "premium",
        success_criteria: ["Readable hierarchy", "No fake progress"],
        notes: [],
        handoff: null
      },
      {
        id: "provider-frame",
        purpose: "Show generated motion as an optional resource",
        engine: "hyperframe",
        duration_seconds: 2.6,
        inputs: [],
        asset_ids: ["flow-motion"],
        output: "qa-assets/flow.svg",
        quality: "premium",
        success_criteria: ["Provider stays optional"],
        notes: [],
        handoff: null
      },
      {
        id: "final-lockup",
        purpose: "Resolve on the Studio shell and final approval",
        engine: "hyperframe",
        duration_seconds: 2.2,
        inputs: [],
        asset_ids: ["hero-system"],
        output: "qa-assets/brand.svg",
        quality: "hero",
        success_criteria: ["Clean final lockup"],
        notes: [],
        handoff: null
      }
    ],
    created_at: timestamp(15),
    updated_at: timestamp(20)
  };
}

function reviewFixture(media) {
  return {
    schema_version: 1,
    run_id: "qa-run",
    video: media.relativeVideo,
    video_sha256: media.videoSha,
    visual_evidence: {
      schema_version: 1,
      video: media.relativeVideo,
      video_sha256: media.videoSha,
      generated_at: timestamp(25),
      count: media.frames.length,
      frames: media.frames,
      error: null
    },
    status: "completed",
    technical: {
      ok: true,
      errors: [],
      warnings: [],
      metadata: media.metadata
    },
    creative: {
      reference_fit: true,
      project_fit: true,
      story_clarity: true,
      motion_intentional: true,
      typography: true,
      captions: true,
      arabic: null,
      camera_crop_safe_zones: true,
      audio: true,
      three_d_vfx_quality: true,
      ai_slop_free: true,
      notes: ["Reference match is strong and the hierarchy remains readable."]
    },
    assets: {
      licenses_ok: true,
      watermark_free: true,
      issues: []
    },
    issues: [],
    decision: "PASS",
    summary: "The exact reviewed render is ready for owner approval.",
    created_at: timestamp(25),
    updated_at: timestamp(26)
  };
}

function applyScenario(cwd, scenario, media) {
  if (scenario === "idle") {
    clearRuns(cwd);
    return;
  }

  if (scenario === "direct") {
    writeRun(cwd, {
      mode: "direct",
      currentStage: "build",
      route: ["hyperframe"],
      checkpoints: {
        understand: { status: "completed", updated_at: timestamp(12) },
        concept: { status: "skipped", updated_at: timestamp(13) },
        mood: { status: "skipped", updated_at: timestamp(13) },
        assets: { status: "completed", updated_at: timestamp(15) },
        routing: { status: "completed", updated_at: timestamp(16) },
        build_plan: { status: "completed", updated_at: timestamp(17) },
        build: { status: "in_progress", updated_at: timestamp(20) }
      },
      assetPlan: assetPlanFixture(),
      buildPlan: {
        ...buildPlanFixture(cwd),
        route: ["hyperframe"],
        shots: buildPlanFixture(cwd).shots.filter(shot => shot.engine === "hyperframe")
      },
      usage: [
        {
          schema_version: 1,
          id: "usage-flow",
          timestamp: timestamp(19),
          run_id: "qa-run",
          phase: "actual",
          provider: "google_flow",
          operation: "video_generation",
          model: "draft",
          quantity: 6,
          unit: "credits",
          usd: 0.18,
          output_count: 1,
          resolution: "360p",
          note: "QA fixture"
        }
      ]
    });
    return;
  }

  if (scenario === "concepts") {
    writeRun(cwd, {
      mode: "director",
      currentStage: "concept",
      checkpoints: {
        understand: { status: "completed", updated_at: timestamp(12) },
        concept: {
          status: "awaiting_human",
          updated_at: timestamp(20),
          human_approved: false
        }
      },
      concepts: conceptFixture()
    });
    return;
  }

  if (scenario === "storyboard") {
    const concepts = conceptFixture();
    concepts.status = "selected";
    concepts.selected_id = "precision-orbit";
    writeRun(cwd, {
      mode: "director",
      currentStage: "build_plan",
      route: ["blender", "hyperframe"],
      checkpoints: {
        understand: { status: "completed", updated_at: timestamp(12) },
        concept: {
          status: "completed",
          updated_at: timestamp(13),
          human_approved: true
        },
        mood: { status: "completed", updated_at: timestamp(14) },
        assets: { status: "completed", updated_at: timestamp(15) },
        routing: { status: "completed", updated_at: timestamp(16) },
        build_plan: { status: "in_progress", updated_at: timestamp(20) }
      },
      concepts,
      assetPlan: assetPlanFixture(),
      buildPlan: buildPlanFixture(cwd)
    });
    return;
  }

  if (scenario === "review") {
    const concepts = conceptFixture();
    concepts.status = "selected";
    concepts.selected_id = "precision-orbit";
    writeRun(cwd, {
      mode: "director",
      currentStage: "post_render_review",
      route: ["blender", "hyperframe"],
      checkpoints: {
        understand: { status: "completed", updated_at: timestamp(12) },
        concept: {
          status: "completed",
          updated_at: timestamp(13),
          human_approved: true
        },
        mood: { status: "completed", updated_at: timestamp(14) },
        assets: { status: "completed", updated_at: timestamp(15) },
        routing: { status: "completed", updated_at: timestamp(16) },
        build_plan: { status: "completed", updated_at: timestamp(17) },
        build: { status: "completed", updated_at: timestamp(18) },
        pre_render_review: { status: "completed", updated_at: timestamp(19) },
        render: {
          status: "completed",
          updated_at: timestamp(24),
          artifact: media.relativeVideo
        },
        post_render_review: {
          status: "in_progress",
          updated_at: timestamp(26)
        }
      },
      concepts,
      assetPlan: assetPlanFixture(),
      buildPlan: buildPlanFixture(cwd),
      review: reviewFixture(media),
      usage: [
        {
          schema_version: 1,
          id: "usage-flow",
          timestamp: timestamp(19),
          run_id: "qa-run",
          phase: "actual",
          provider: "google_flow",
          operation: "video_generation",
          model: "draft",
          quantity: 6,
          unit: "credits",
          usd: 0.18,
          output_count: 1,
          resolution: "360p",
          note: "QA fixture"
        },
        {
          schema_version: 1,
          id: "usage-eleven",
          timestamp: timestamp(20),
          run_id: "qa-run",
          phase: "actual",
          provider: "elevenlabs",
          operation: "text_to_speech",
          model: "qa",
          quantity: 1250,
          unit: "credits",
          usd: null,
          output_count: 1,
          resolution: null,
          note: "QA fixture"
        }
      ]
    });
    return;
  }

  throw new Error("Unknown QA scenario: " + scenario);
}

function configureWorkspace(cwd, ffmpeg) {
  writeConfiguredWorkspace({
    product: "AurorA Studio",
    purpose: "Premium product launch and educational videos",
    website: "https://example.com/aurora",
    mode: "director",
    resources: {
      browser_control: true,
      chatgpt_browser: true,
      google_flow: true,
      meta_ai: true,
      elevenlabs: true
    },
    agents: "none",
    install_hyperframes: false
  }, { cwd });

  createFakeHyperframes(cwd);
  enrichWorkspace(cwd, ffmpeg);
  const { refId } = createCreativeAssets(cwd);
  return { refId };
}

async function waitForStudio(page, diagnostics, label) {
  try {
    await page.waitForFunction(() => {
      const status = document.documentElement.dataset.studioReady;
      return status === "true" || status === "error";
    }, {
      timeout: 20000
    });

    const status = await page.evaluate(() => ({
      ready: document.documentElement.dataset.studioReady,
      error:
        document.documentElement.dataset.studioError ||
        window.__AURORA_STUDIO_ERROR__ ||
        null,
      configured:
        document.body.classList.contains("setup-mode")
          ? false
          : null,
      hash: location.hash,
      title: document.title
    }));

    if (status.ready !== "true") {
      throw new Error(
        `AurorA Studio reported startup error for ${label}: ${status.error || "unknown error"}`
      );
    }

    await page.waitForTimeout(220);
    return status;
  } catch (error) {
    const failureFile = path.join(
      SCREENSHOTS,
      `${label}-startup-failure.png`
    );

    try {
      await page.screenshot({
        path: failureFile,
        fullPage: false,
        animations: "disabled"
      });
    } catch {}

    const browserState = await page.evaluate(() => ({
      url: location.href,
      hash: location.hash,
      title: document.title,
      ready: document.documentElement.dataset.studioReady || null,
      error:
        document.documentElement.dataset.studioError ||
        window.__AURORA_STUDIO_ERROR__ ||
        null,
      body_class: document.body?.className || null,
      tool_summary:
        document.querySelector("#tool-summary")?.textContent || null,
      active_view:
        document.querySelector("[data-view-panel].active")
          ?.getAttribute("data-view-panel") || null
    })).catch(() => null);

    const payload = {
      label,
      message: error.message,
      browser_state: browserState,
      diagnostics
    };

    writeJson(
      path.join(OUTPUT, `${label}-startup-failure.json`),
      payload
    );

    throw new Error(
      [
        error.message,
        "Startup diagnostics:",
        JSON.stringify(payload, null, 2)
      ].join("\n")
    );
  }
}

async function settleVisualMedia(page) {
  await page.evaluate(async () => {
    const videos = [...document.querySelectorAll("video")];
    await Promise.all(videos.map(video => new Promise(resolve => {
      const finish = () => resolve();

      const seekRepresentativeFrame = () => {
        const duration = Number(video.duration || 0);
        if (!(duration > 0)) return finish();

        const target = Math.min(
          Math.max(duration * 0.35, 0.35),
          Math.max(duration - 0.12, 0)
        );

        if (!(target > 0)) return finish();
        if (Math.abs(video.currentTime - target) < 0.05) return finish();

        const timeout = setTimeout(finish, 1200);
        video.addEventListener("seeked", () => {
          clearTimeout(timeout);
          finish();
        }, { once: true });

        try {
          video.currentTime = target;
        } catch {
          clearTimeout(timeout);
          finish();
        }
      };

      if (video.readyState >= 1) {
        seekRepresentativeFrame();
      } else {
        const timeout = setTimeout(finish, 1600);
        video.addEventListener("loadedmetadata", () => {
          clearTimeout(timeout);
          seekRepresentativeFrame();
        }, { once: true });
      }
    })));
  });

  await page.waitForTimeout(120);
}

async function axePage(page, label) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => {
    return await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: [
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
          "wcag22aa"
        ]
      }
    });
  });

  return {
    label,
    violations: result.violations.map(item => ({
      id: item.id,
      impact: item.impact,
      help: item.help,
      nodes: item.nodes.length,
      targets: item.nodes.slice(0, 8).map(node => node.target)
    }))
  };
}

async function layoutMetrics(page) {
  return await page.evaluate(() => ({
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    document_width: document.documentElement.scrollWidth,
    document_height: document.documentElement.scrollHeight,
    overflow_x:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
    focused_tag: document.activeElement?.tagName || null
  }));
}

async function capture({
  browser,
  url,
  workspace,
  scenario,
  name,
  hash,
  width,
  height,
  media,
  reports
}) {
  if (workspace && scenario) applyScenario(workspace, scenario, media);

  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    reducedMotion: "reduce",
    locale: "en-US"
  });

  const page = await context.newPage();
  const diagnostics = {
    console: [],
    page_errors: [],
    request_failures: [],
    bad_responses: []
  };

  page.on("console", message => {
    if (["error", "warning"].includes(message.type())) {
      diagnostics.console.push({
        type: message.type(),
        text: message.text()
      });
    }
  });

  page.on("pageerror", error => {
    diagnostics.page_errors.push(error.message);
  });

  page.on("requestfailed", request => {
    diagnostics.request_failures.push({
      url: request.url(),
      failure: request.failure()?.errorText || "unknown"
    });
  });

  page.on("response", response => {
    if (response.status() >= 400) {
      diagnostics.bad_responses.push({
        status: response.status(),
        url: response.url()
      });
    }
  });

  await page.goto(url + "#" + hash, {
    waitUntil: "domcontentloaded",
    timeout: 20000
  });
  await waitForStudio(page, diagnostics, name);
  await settleVisualMedia(page);

  const metrics = await layoutMetrics(page);
  const accessibility = await axePage(page, name);

  const file = path.join(SCREENSHOTS, name + ".png");
  await page.screenshot({
    path: file,
    fullPage: false,
    animations: "disabled"
  });

  reports.push({
    name,
    viewport: { width, height },
    scenario: scenario || "setup",
    view: hash,
    screenshot: path.relative(OUTPUT, file).split(path.sep).join("/"),
    metrics,
    accessibility
  });

  await context.close();
}

async function main() {
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  fs.mkdirSync(SCREENSHOTS, { recursive: true });

  const ffmpeg = ffmpegPath();
  const ffprobe = ffprobePath();
  process.env.AURORA_FFMPEG_PATH = ffmpeg;

  const setupWorkspace = fs.mkdtempSync(
    path.join(os.tmpdir(), "aurora-ui-qa-setup-")
  );
  const configuredWorkspace = fs.mkdtempSync(
    path.join(os.tmpdir(), "aurora-ui-qa-workspace-")
  );

  configureWorkspace(configuredWorkspace, ffmpeg);
  const media = generateReviewMedia(
    configuredWorkspace,
    ffmpeg,
    ffprobe
  );

  const cliPath = path.join(ROOT, "bin", "aurora-studio.mjs");
  const setupServer = await startStudioUiServer({
    cwd: setupWorkspace,
    port: 0,
    open: false,
    cliPath
  });
  const studioServer = await startStudioUiServer({
    cwd: configuredWorkspace,
    port: 0,
    open: false,
    cliPath
  });

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath(),
    args: [
      "--disable-dev-shm-usage",
      "--font-render-hinting=none"
    ]
  });

  const reports = [];

  try {
    await capture({
      browser,
      url: setupServer.url,
      workspace: null,
      scenario: null,
      name: "desktop-setup",
      hash: "setup",
      width: 1600,
      height: 1000,
      media,
      reports
    });

    for (const spec of [
      ["desktop-create-idle", "idle", "create", 1600, 1000],
      ["desktop-create-direct", "direct", "create", 1600, 1000],
      ["desktop-director-concepts", "concepts", "create", 1600, 1000],
      ["desktop-director-storyboard", "storyboard", "create", 1600, 1000],
      ["desktop-review", "review", "create", 1600, 1000],
      ["desktop-library", "idle", "library", 1600, 1000],
      ["desktop-project", "idle", "project", 1600, 1000],
      ["desktop-settings", "idle", "settings", 1600, 1000],
      ["desktop-updates", "idle", "updates", 1600, 1000],

      ["laptop-create-active", "direct", "create", 1280, 800],
      ["laptop-storyboard", "storyboard", "create", 1280, 800],
      ["laptop-review", "review", "create", 1280, 800],

      ["mobile-create", "direct", "create", 430, 932],
      ["mobile-concepts", "concepts", "create", 430, 932],
      ["mobile-review", "review", "create", 430, 932],
      ["mobile-library", "idle", "library", 430, 932],
      ["mobile-settings", "idle", "settings", 430, 932]
    ]) {
      const [name, scenario, hashName, width, height] = spec;
      await capture({
        browser,
        url: studioServer.url,
        workspace: configuredWorkspace,
        scenario,
        name,
        hash: hashName,
        width,
        height,
        media,
        reports
      });
    }

    const violations = reports.flatMap(report =>
      report.accessibility.violations.map(violation => ({
        screenshot: report.name,
        ...violation
      }))
    );
    const overflow = reports.filter(report => report.metrics.overflow_x);

    const result = {
      ok: violations.length === 0 && overflow.length === 0,
      generated_at: new Date().toISOString(),
      chrome: chromePath(),
      screenshots: reports.length,
      accessibility_violations: violations,
      horizontal_overflow: overflow.map(item => item.name),
      reports
    };

    writeJson(path.join(OUTPUT, "report.json"), result);
    console.log(JSON.stringify({
      ok: result.ok,
      screenshots: result.screenshots,
      accessibility_violations: violations.length,
      horizontal_overflow: result.horizontal_overflow
    }, null, 2));

    if (!result.ok) process.exitCode = 1;
  } finally {
    await browser.close();
    await setupServer.close();
    await studioServer.close();
    fs.rmSync(setupWorkspace, { recursive: true, force: true });
    fs.rmSync(configuredWorkspace, { recursive: true, force: true });
  }
}

await main();
