import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function findOnPath(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [command], { encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map(x => x.trim()).find(Boolean) || null;
}

export function findBlender() {
  const configured = process.env.AURORA_BLENDER_PATH;
  if (configured && fs.existsSync(configured)) return configured;
  return findOnPath("blender");
}

export function blenderInfo() {
  const executable = findBlender();
  if (!executable) return { available: false, executable: null, version: null };

  const result = spawnSync(executable, ["--version"], { encoding: "utf8" });
  const firstLine = (result.stdout || "").split(/\r?\n/)[0]?.trim() || null;
  return {
    available: result.status === 0,
    executable,
    version: firstLine
  };
}

function resolveExisting(file, cwd, label) {
  if (!file) return null;
  const resolved = path.resolve(cwd, file);
  if (!fs.existsSync(resolved)) throw new Error(`${label} not found: ${file}`);
  return resolved;
}

export function buildBlenderArgs(job, cwd = process.cwd()) {
  if (!job || job.schema_version !== 1) throw new Error("Unsupported Blender job schema.");
  if (!["script", "render"].includes(job.operation)) throw new Error("Blender job operation must be script or render.");

  const args = ["-b"];
  const blend = resolveExisting(job.source_blend, cwd, "Blend file");
  if (blend) args.push(blend);

  const script = resolveExisting(job.script, cwd, "Python script");
  if (script) args.push("--python", script);

  if (job.operation === "render") {
    if (job.output) args.push("-o", path.resolve(cwd, job.output));
    if (job.render?.format) args.push("-F", String(job.render.format));

    if (job.render?.animation) {
      args.push("-a");
    } else {
      const frame = Number(job.render?.frame ?? 1);
      if (!Number.isInteger(frame) || frame < 0) throw new Error("Render frame must be a non-negative integer.");
      args.push("-f", String(frame));
    }
  }

  if (!blend && !script) {
    throw new Error("Blender job needs source_blend or script.");
  }

  return args;
}

export function createBlenderJob(name, cwd = process.cwd()) {
  const dir = path.join(cwd, ".aurora", "blender");
  fs.mkdirSync(dir, { recursive: true });
  const id = String(name || "blender-job")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "blender-job";
  const file = path.join(dir, `${id}.json`);
  if (fs.existsSync(file)) throw new Error(`Blender job already exists: ${id}`);

  const job = {
    schema_version: 1,
    id,
    operation: "script",
    source_blend: null,
    script: null,
    output: null,
    render: {
      frame: 1,
      animation: false,
      format: null
    },
    quality: "draft",
    notes: []
  };

  fs.writeFileSync(file, JSON.stringify(job, null, 2) + "\n");
  return { job, file };
}

export function runBlenderJob(jobPath, { cwd = process.cwd(), dryRun = false } = {}) {
  const resolvedJob = path.resolve(cwd, jobPath);
  if (!fs.existsSync(resolvedJob)) throw new Error(`Blender job not found: ${jobPath}`);
  const job = JSON.parse(fs.readFileSync(resolvedJob, "utf8"));
  const args = buildBlenderArgs(job, cwd);

  const executable = findBlender();
  if (dryRun) {
    return {
      dry_run: true,
      executable: executable || "blender",
      args,
      job
    };
  }

  if (!executable) throw new Error("Blender is not installed or not configured.");

  const started = Date.now();
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });

  const logsDir = path.join(cwd, ".aurora", "blender", "logs");
  fs.mkdirSync(logsDir, { recursive: true });
  const logFile = path.join(logsDir, `${job.id}-${Date.now()}.log`);
  fs.writeFileSync(logFile, [
    `command: ${executable} ${args.join(" ")}`,
    "",
    result.stdout || "",
    "",
    result.stderr || ""
  ].join("\n"));

  return {
    ok: result.status === 0,
    exit_code: result.status,
    duration_ms: Date.now() - started,
    log_file: logFile,
    stdout_tail: (result.stdout || "").slice(-4000),
    stderr_tail: (result.stderr || "").slice(-4000)
  };
}
