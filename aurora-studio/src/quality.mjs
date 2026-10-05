import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function findOnPath(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [command], { encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map(value => value.trim()).find(Boolean) || null;
}

export function findFfprobe() {
  const configured = process.env.AURORA_FFMPEG_PATH;
  if (configured && fs.existsSync(configured)) {
    const sibling = path.join(
      path.dirname(configured),
      process.platform === "win32" ? "ffprobe.exe" : "ffprobe"
    );
    if (fs.existsSync(sibling)) return sibling;
  }

  return findOnPath(process.platform === "win32" ? "ffprobe.exe" : "ffprobe")
    || findOnPath("ffprobe");
}

export function preRenderReview({ requiredFiles = [] } = {}) {
  const missing = requiredFiles.filter(file => !fs.existsSync(file));
  return {
    ok: missing.length === 0,
    checks: {
      required_files: {
        ok: missing.length === 0,
        missing
      }
    }
  };
}

export function probeRender(file) {
  if (!file || !fs.existsSync(file)) {
    return { ok: false, errors: ["render_missing"], metadata: null };
  }

  const ffprobe = findFfprobe();
  if (!ffprobe) {
    return {
      ok: false,
      errors: ["ffprobe_unavailable"],
      warnings: [],
      metadata: { file_exists: true }
    };
  }

  const result = spawnSync(ffprobe, [
    "-v", "error",
    "-show_entries", "format=duration,size,bit_rate",
    "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels",
    "-of", "json",
    file
  ], { encoding: "utf8" });

  if (result.status !== 0) {
    return { ok: false, errors: ["ffprobe_failed"], stderr: result.stderr, metadata: null };
  }

  const metadata = JSON.parse(result.stdout || "{}");
  const hasVideo = (metadata.streams || []).some(s => s.codec_type === "video");
  const duration = Number(metadata.format?.duration || 0);

  return {
    ok: hasVideo && duration > 0,
    errors: [
      ...(!hasVideo ? ["video_stream_missing"] : []),
      ...(!(duration > 0) ? ["duration_invalid"] : [])
    ],
    metadata
  };
}
