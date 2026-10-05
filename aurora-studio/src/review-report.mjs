import fs from "node:fs";
import path from "node:path";
import { loadRun } from "./governance.mjs";
import { probeRender } from "./quality.mjs";
import { sha256File } from "./final-artifact.mjs";
import { extractReviewFrames } from "./review-frames.mjs";

const DECISIONS = new Set(["PENDING", "PASS", "FIX", "REBUILD"]);

export function reviewReportPath(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  return path.join(run.dir, "review.json");
}

export function createReviewReport(runId, video, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  const file = path.join(run.dir, "review.json");
  const resolvedVideo = video ? path.resolve(cwd, video) : null;
  const videoExists =
    Boolean(resolvedVideo) &&
    fs.existsSync(resolvedVideo) &&
    fs.statSync(resolvedVideo).isFile();
  const videoSha256 = videoExists ? sha256File(resolvedVideo) : null;

  const technical = resolvedVideo
    ? probeRender(resolvedVideo)
    : {
        ok: false,
        errors: ["video_not_set"],
        warnings: [],
        metadata: null
      };

  const existing = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : null;
  const sameVideo =
    Boolean(videoSha256) &&
    existing?.video_sha256 === videoSha256;

  let visualEvidence = {
    schema_version: 1,
    video: resolvedVideo ? path.relative(cwd, resolvedVideo) : null,
    video_sha256: videoSha256,
    generated_at: new Date().toISOString(),
    count: 0,
    frames: [],
    error: null
  };

  if (technical.ok && videoExists) {
    try {
      const duration = Number(technical.metadata?.format?.duration || 0);
      visualEvidence = {
        ...extractReviewFrames(resolvedVideo, {
          cwd,
          outputDir: path.join(run.dir, "review-frames"),
          durationSeconds: duration,
          count: 5
        }),
        error: null
      };
    } catch (error) {
      visualEvidence.error = error instanceof Error ? error.message : String(error);
    }
  }

  const now = new Date().toISOString();
  const defaultCreative = {
    reference_fit: null,
    project_fit: null,
    story_clarity: null,
    motion_intentional: null,
    typography: null,
    captions: null,
    arabic: null,
    camera_crop_safe_zones: null,
    audio: null,
    three_d_vfx_quality: null,
    ai_slop_free: null,
    notes: []
  };
  const defaultAssets = {
    licenses_ok: null,
    watermark_free: null,
    issues: []
  };

  const report = {
    schema_version: 1,
    run_id: runId,
    video: resolvedVideo ? path.relative(cwd, resolvedVideo) : null,
    video_sha256: videoSha256,
    visual_evidence: visualEvidence,
    status: sameVideo ? existing?.status || "pending" : "pending",
    technical,
    creative: sameVideo ? existing?.creative || defaultCreative : defaultCreative,
    assets: sameVideo ? existing?.assets || defaultAssets : defaultAssets,
    issues: sameVideo ? existing?.issues || [] : [],
    decision: sameVideo ? existing?.decision || "PENDING" : "PENDING",
    summary: sameVideo ? existing?.summary || "" : "",
    created_at: sameVideo ? existing?.created_at || now : now,
    updated_at: now
  };

  fs.writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
  return { report, file };
}

export function readReviewReport(runId, cwd = process.cwd()) {
  const file = reviewReportPath(runId, cwd);
  if (!fs.existsSync(file)) return null;
  return {
    report: JSON.parse(fs.readFileSync(file, "utf8")),
    file
  };
}

function completedCreativeChecks(creative = {}) {
  const required = [
    "project_fit",
    "story_clarity",
    "motion_intentional",
    "typography",
    "camera_crop_safe_zones",
    "audio",
    "ai_slop_free"
  ];

  return required.filter(key => creative[key] === null || creative[key] === undefined);
}

export function validateReviewReport(report) {
  const errors = [];
  const warnings = [];

  if (!report || report.schema_version !== 1) {
    return {
      ok: false,
      can_complete_post_review: false,
      errors: ["Unsupported or missing review schema."],
      warnings
    };
  }

  if (!DECISIONS.has(report.decision)) {
    errors.push("Review decision must be PENDING, PASS, FIX, or REBUILD.");
  }

  if (!report.video) errors.push("Review report is missing the video path.");
  if (!report.video_sha256) errors.push("Review report is missing the reviewed video SHA-256.");

  if (!report.technical?.ok) {
    errors.push("Technical video review did not pass.");
  }

  if (report.status === "completed") {
    if (!String(report.summary || "").trim()) {
      errors.push("Completed review needs a short summary.");
    }

    const missingCreative = completedCreativeChecks(report.creative);
    if (missingCreative.length) {
      errors.push(
        "Completed review is missing creative checks: " +
        missingCreative.join(", ")
      );
    }

    if (report.assets?.licenses_ok !== true) {
      errors.push("Completed review requires assets.licenses_ok=true.");
    }

    if (report.assets?.watermark_free !== true) {
      errors.push("Completed review requires assets.watermark_free=true.");
    }
  }

  if (report.decision === "PASS" && report.status !== "completed") {
    errors.push("PASS review must have status=completed.");
  }

  if (report.decision === "PASS") {
    const requiredPassChecks = [
      "project_fit",
      "story_clarity",
      "motion_intentional",
      "typography",
      "camera_crop_safe_zones",
      "audio",
      "ai_slop_free"
    ];

    const failedRequired = requiredPassChecks.filter(
      key => report.creative?.[key] !== true
    );

    if (failedRequired.length) {
      errors.push(
        "PASS review requires these creative checks to be true: " +
        failedRequired.join(", ")
      );
    }

    const optionalChecks = [
      "reference_fit",
      "captions",
      "arabic",
      "three_d_vfx_quality"
    ];

    const failedOptional = optionalChecks.filter(
      key => report.creative?.[key] === false
    );

    if (failedOptional.length) {
      errors.push(
        "PASS review has failing applicable checks: " +
        failedOptional.join(", ")
      );
    }

    if ((report.issues || []).length > 0) {
      errors.push("PASS review cannot contain unresolved issues; use creative.notes for informational notes.");
    }
  }

  return {
    ok: errors.length === 0,
    can_complete_post_review:
      errors.length === 0 &&
      report.status === "completed" &&
      report.decision === "PASS",
    errors,
    warnings
  };
}

export function validateReviewReportFile(runId, cwd = process.cwd()) {
  const value = readReviewReport(runId, cwd);
  if (!value) {
    return {
      ok: false,
      can_complete_post_review: false,
      errors: ["Review report file not found."],
      warnings: []
    };
  }
  return validateReviewReport(value.report);
}
