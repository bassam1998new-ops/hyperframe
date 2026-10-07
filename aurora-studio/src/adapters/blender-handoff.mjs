import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { configuredToolPath } from "../workspace-settings.mjs";

function findOnPath(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [command], { encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map(x => x.trim()).find(Boolean) || null;
}

export function findFfmpeg(cwd = process.cwd()) {
  const configured =
    process.env.AURORA_FFMPEG_PATH ||
    configuredToolPath("ffmpeg", cwd);
  if (configured && fs.existsSync(configured)) {
    const resolved = path.resolve(configured);
    if (fs.statSync(resolved).isFile()) return resolved;
    const candidate = path.join(
      resolved,
      process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
    );
    if (fs.existsSync(candidate)) return candidate;
  }
  return findOnPath(process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg") || findOnPath("ffmpeg");
}

function crfFor(quality) {
  switch (quality) {
    case "hero": return 14;
    case "premium": return 18;
    case "normal": return 24;
    case "draft": return 32;
    default: return 24;
  }
}

export function buildTransparentWebmArgs({
  inputPattern,
  output,
  fps = 30,
  quality = "normal"
}, cwd = process.cwd()) {
  if (!inputPattern) throw new Error("Input frame pattern is required.");
  if (!output) throw new Error("Output WebM path is required.");

  const rate = Number(fps);
  if (!(rate > 0 && rate <= 240)) throw new Error("FPS must be between 1 and 240.");

  const out = path.resolve(cwd, output);
  if (path.extname(out).toLowerCase() !== ".webm") {
    throw new Error("Transparent Blender handoff output must be .webm");
  }

  return [
    "-y",
    "-loglevel", "error",
    "-framerate", String(rate),
    "-i", path.resolve(cwd, inputPattern),
    "-c:v", "libvpx-vp9",
    "-pix_fmt", "yuva420p",
    "-auto-alt-ref", "0",
    "-b:v", "0",
    "-crf", String(crfFor(quality)),
    "-metadata:s:v:0", "alpha_mode=1",
    out
  ];
}

export function packTransparentWebm(options, {
  cwd = process.cwd(),
  dryRun = false
} = {}) {
  const args = buildTransparentWebmArgs(options, cwd);
  const executable = findFfmpeg(cwd);

  if (dryRun) {
    return {
      dry_run: true,
      executable: executable || "ffmpeg",
      args
    };
  }

  if (!executable) throw new Error("ffmpeg is not installed or configured.");

  fs.mkdirSync(path.dirname(path.resolve(cwd, options.output)), { recursive: true });

  const started = Date.now();
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024
  });

  return {
    ok: result.status === 0,
    exit_code: result.status,
    duration_ms: Date.now() - started,
    output: path.resolve(cwd, options.output),
    stderr_tail: (result.stderr || "").slice(-4000)
  };
}
