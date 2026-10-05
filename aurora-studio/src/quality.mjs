import fs from "node:fs";
import { spawnSync } from "node:child_process";

function commandExists(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  return spawnSync(finder, [command], { stdio: "ignore" }).status === 0;
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

  if (!commandExists("ffprobe")) {
    return {
      ok: true,
      warnings: ["ffprobe_unavailable"],
      metadata: { file_exists: true }
    };
  }

  const result = spawnSync("ffprobe", [
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
