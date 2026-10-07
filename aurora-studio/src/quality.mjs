import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { configuredToolPath } from "./workspace-settings.mjs";

function findOnPath(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [command], { encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map(value => value.trim()).find(Boolean) || null;
}

export function findFfprobe(cwd = process.cwd()) {
  const configured =
    process.env.AURORA_FFMPEG_PATH ||
    configuredToolPath("ffmpeg", cwd);
  if (configured && fs.existsSync(configured)) {
    const resolved = path.resolve(configured);
    const baseDir = fs.statSync(resolved).isDirectory()
      ? resolved
      : path.dirname(resolved);
    const sibling = path.join(
      baseDir,
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

export function probeRender(file, cwd = process.cwd()) {
  if (!file || !fs.existsSync(file)) {
    return { ok: false, errors: ["render_missing"], metadata: null };
  }

  const ffprobe = findFfprobe(cwd);
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
