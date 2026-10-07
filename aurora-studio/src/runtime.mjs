import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { configuredToolPath } from "./workspace-settings.mjs";

function findOnPath(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [command], { encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map(x => x.trim()).find(Boolean) || null;
}

function configuredFfmpeg(cwd = process.cwd()) {
  const value =
    process.env.AURORA_FFMPEG_PATH ||
    configuredToolPath("ffmpeg", cwd);
  if (!value || !fs.existsSync(value)) return null;

  const resolved = path.resolve(value);
  if (fs.statSync(resolved).isFile()) return resolved;

  const candidate = path.join(
    resolved,
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  return fs.existsSync(candidate) ? candidate : null;
}

export function detectMediaRuntime(cwd = process.cwd()) {
  const ffmpeg = configuredFfmpeg(cwd)
    || findOnPath(process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg")
    || findOnPath("ffmpeg");

  let ffprobe = null;

  if (ffmpeg) {
    const sibling = path.join(
      path.dirname(ffmpeg),
      process.platform === "win32" ? "ffprobe.exe" : "ffprobe"
    );
    if (fs.existsSync(sibling)) ffprobe = sibling;
  }

  if (!ffprobe) {
    ffprobe =
      findOnPath(process.platform === "win32" ? "ffprobe.exe" : "ffprobe") ||
      findOnPath("ffprobe");
  }

  return {
    node_version: process.versions.node,
    ffmpeg,
    ffprobe
  };
}

export function ffmpegInstallHint(platform = process.platform) {
  if (platform === "win32") {
    return "Install a 64-bit FFmpeg build, add its bin folder to PATH, or set AURORA_FFMPEG_PATH to ffmpeg.exe.";
  }
  if (platform === "darwin") {
    return "Install FFmpeg with: brew install ffmpeg";
  }
  return "Install FFmpeg with your system package manager (for Debian/Ubuntu: sudo apt install ffmpeg).";
}

export function evaluateRuntime({
  nodeVersion = process.versions.node,
  ffmpeg = null,
  ffprobe = null,
  platform = process.platform
} = {}) {
  const errors = [];
  const warnings = [];
  const major = Number.parseInt(String(nodeVersion || "0").split(".")[0], 10) || 0;

  if (major < 22) {
    errors.push(`Node 22+ is required; found Node ${nodeVersion || "unknown"}.`);
  }

  const installHint = ffmpegInstallHint(platform);

  if (!ffmpeg) {
    errors.push(
      "FFmpeg is required for AurorA/HyperFrames rendering and media workflows. " +
      installHint
    );
  }

  if (!ffprobe) {
    warnings.push("ffprobe was not found; render validation will be less complete.");
  }

  return {
    ok: errors.length === 0,
    node: {
      version: nodeVersion,
      major,
      ok: major >= 22
    },
    ffmpeg: {
      available: Boolean(ffmpeg),
      path: ffmpeg,
      install_hint: ffmpeg ? null : installHint
    },
    ffprobe: {
      available: Boolean(ffprobe),
      path: ffprobe
    },
    errors,
    warnings
  };
}

export function runtimeStatus(cwd = process.cwd()) {
  return evaluateRuntime(detectMediaRuntime(cwd));
}
