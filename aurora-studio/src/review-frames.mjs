import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { detectMediaRuntime } from "./runtime.mjs";
import { sha256File } from "./final-artifact.mjs";

export function reviewFrameTimes(durationSeconds, count = 5) {
  const duration = Number(durationSeconds);
  const n = Math.max(3, Math.min(9, Number.parseInt(String(count), 10) || 5));

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Review frame sampling needs a positive video duration.");
  }

  return Array.from({ length: n }, (_, index) => {
    const fraction = (index + 1) / (n + 1);
    return Number((duration * fraction).toFixed(3));
  });
}

export function extractReviewFrames(video, {
  cwd = process.cwd(),
  outputDir,
  durationSeconds,
  count = 5,
  ffmpegPath = null,
  spawnImpl = spawnSync
} = {}) {
  const input = path.resolve(cwd, video);
  if (!fs.existsSync(input) || !fs.statSync(input).isFile()) {
    throw new Error(`Review video not found: ${video}`);
  }

  const ffmpeg = ffmpegPath || detectMediaRuntime().ffmpeg;
  if (!ffmpeg) {
    throw new Error("FFmpeg is required to extract visual review frames.");
  }

  const dir = path.resolve(
    cwd,
    outputDir || path.join(".aurora", "runs", "review-frames")
  );
  const safeRoot = path.resolve(cwd, ".aurora", "runs");
  const relativeToSafeRoot = path.relative(safeRoot, dir);

  if (
    relativeToSafeRoot.startsWith("..") ||
    path.isAbsolute(relativeToSafeRoot) ||
    relativeToSafeRoot === ""
  ) {
    throw new Error(
      "Review frame output must stay inside .aurora/runs/."
    );
  }

  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const times = reviewFrameTimes(durationSeconds, count);
  const frames = [];

  for (const [index, time] of times.entries()) {
    const filename = `frame-${String(index + 1).padStart(2, "0")}.jpg`;
    const output = path.join(dir, filename);

    const args = [
      "-hide_banner",
      "-loglevel", "error",
      "-ss", String(time),
      "-i", input,
      "-map", "0:v:0",
      "-frames:v", "1",
      "-q:v", "2",
      "-y",
      output
    ];

    const result = spawnImpl(ffmpeg, args, {
      cwd,
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 8 * 1024 * 1024
    });

    if (result.status !== 0 || !fs.existsSync(output)) {
      fs.rmSync(dir, { recursive: true, force: true });
      throw new Error(
        `Failed to extract review frame at ${time}s: ${(result.stderr || result.stdout || "ffmpeg failed").trim().slice(-1000)}`
      );
    }

    frames.push({
      index: index + 1,
      time_seconds: time,
      path: path.relative(cwd, output),
      sha256: sha256File(output)
    });
  }

  return {
    schema_version: 1,
    video: path.relative(cwd, input),
    video_sha256: sha256File(input),
    generated_at: new Date().toISOString(),
    count: frames.length,
    frames
  };
}
