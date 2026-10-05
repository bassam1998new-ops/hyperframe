import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function findOnPath(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [command], { encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map(x => x.trim()).find(Boolean) || null;
}

function candidatesInDirectory(dir, platform = process.platform) {
  if (!dir || !fs.existsSync(dir)) return {};

  const afterfxNames = platform === "win32"
    ? ["AfterFX.exe", "afterfx.exe"]
    : ["After Effects"];
  const aerenderNames = platform === "win32"
    ? ["aerender.exe"]
    : ["aerender"];

  const firstExisting = names => names
    .map(name => path.join(dir, name))
    .find(candidate => fs.existsSync(candidate)) || null;

  return {
    afterfx: firstExisting(afterfxNames),
    aerender: firstExisting(aerenderNames)
  };
}

function configuredCandidates(env = process.env, platform = process.platform) {
  const configured = env.AURORA_AFTER_EFFECTS_PATH;
  if (!configured || !fs.existsSync(configured)) return {};

  const stat = fs.statSync(configured);
  if (stat.isDirectory()) return candidatesInDirectory(configured, platform);

  const dir = path.dirname(configured);
  const siblings = candidatesInDirectory(dir, platform);

  return {
    afterfx: /afterfx/i.test(path.basename(configured))
      ? configured
      : siblings.afterfx,
    aerender: /aerender/i.test(path.basename(configured))
      ? configured
      : siblings.aerender
  };
}

export function discoverAfterEffectsInstall({
  platform = process.platform,
  env = process.env,
  applicationsRoot = "/Applications"
} = {}) {
  if (platform === "win32") {
    const programFiles = env.ProgramFiles || env.PROGRAMFILES;
    if (!programFiles) return {};

    const adobeRoot = path.join(programFiles, "Adobe");
    if (!fs.existsSync(adobeRoot)) return {};

    let dirs = [];
    try {
      dirs = fs.readdirSync(adobeRoot, { withFileTypes: true })
        .filter(entry =>
          entry.isDirectory() &&
          /^Adobe After Effects/i.test(entry.name)
        )
        .map(entry => entry.name)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    } catch {
      return {};
    }

    for (const dirName of dirs) {
      const support = path.join(adobeRoot, dirName, "Support Files");
      const found = candidatesInDirectory(support, platform);
      if (found.afterfx || found.aerender) return found;
    }

    return {};
  }

  if (platform === "darwin" && fs.existsSync(applicationsRoot)) {
    let dirs = [];
    try {
      dirs = fs.readdirSync(applicationsRoot, { withFileTypes: true })
        .filter(entry =>
          entry.isDirectory() &&
          /^Adobe After Effects/i.test(entry.name)
        )
        .map(entry => entry.name)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    } catch {
      return {};
    }

    for (const dirName of dirs) {
      const root = path.join(applicationsRoot, dirName);
      const direct = candidatesInDirectory(root, platform);
      if (direct.afterfx || direct.aerender) return direct;

      let children = [];
      try {
        children = fs.readdirSync(root, { withFileTypes: true });
      } catch {
        continue;
      }

      const app = children.find(entry =>
        entry.isDirectory() &&
        /After Effects.*\.app$/i.test(entry.name)
      );
      if (!app) continue;

      const executable = path.join(
        root,
        app.name,
        "Contents",
        "MacOS",
        "After Effects"
      );

      return {
        afterfx: fs.existsSync(executable) ? executable : null,
        aerender: direct.aerender || null
      };
    }
  }

  return {};
}

export function findAfterEffects(options = {}) {
  const platform = options.platform || process.platform;
  const env = options.env || process.env;
  const configured = configuredCandidates(env, platform);
  const onPath = options.skipPathLookup
    ? {}
    : {
        afterfx: findOnPath(platform === "win32" ? "afterfx.exe" : "afterfx"),
        aerender: findOnPath(platform === "win32" ? "aerender.exe" : "aerender")
      };
  const common = discoverAfterEffectsInstall({
    platform,
    env,
    applicationsRoot: options.applicationsRoot
  });

  return {
    afterfx: configured.afterfx || onPath.afterfx || common.afterfx || null,
    aerender: configured.aerender || onPath.aerender || common.aerender || null
  };
}

export function afterEffectsInfo() {
  const executables = findAfterEffects();
  let version = null;

  if (executables.aerender) {
    const result = spawnSync(executables.aerender, ["-version"], { encoding: "utf8" });
    version = (result.stdout || result.stderr || "").split(/\r?\n/).find(Boolean)?.trim() || null;
  }

  return {
    available: Boolean(executables.afterfx || executables.aerender),
    scripting_available: Boolean(executables.afterfx),
    rendering_available: Boolean(executables.aerender),
    afterfx: executables.afterfx,
    aerender: executables.aerender,
    version
  };
}

function requireFile(file, cwd, label) {
  const resolved = path.resolve(cwd, file || "");
  if (!file || !fs.existsSync(resolved)) throw new Error(`${label} not found: ${file || "(missing)"}`);
  return resolved;
}

export function buildAfterEffectsCommand(job, cwd = process.cwd()) {
  if (!job || job.schema_version !== 1) throw new Error("Unsupported After Effects job schema.");
  const tools = findAfterEffects();

  if (job.operation === "script") {
    const script = requireFile(job.script, cwd, "After Effects script");
    return {
      executable: tools.afterfx || "afterfx",
      kind: "afterfx",
      args: ["-r", script]
    };
  }

  if (job.operation === "render") {
    const project = requireFile(job.project, cwd, "After Effects project");
    const args = ["-project", project];

    if (job.comp) args.push("-comp", String(job.comp));
    if (job.start_frame !== null && job.start_frame !== undefined) args.push("-s", String(job.start_frame));
    if (job.end_frame !== null && job.end_frame !== undefined) args.push("-e", String(job.end_frame));
    if (job.output) args.push("-output", path.resolve(cwd, job.output));
    if (job.reuse) args.push("-reuse");

    return {
      executable: tools.aerender || "aerender",
      kind: "aerender",
      args
    };
  }

  throw new Error("After Effects job operation must be script or render.");
}

export function createAfterEffectsJob(name, cwd = process.cwd()) {
  const dir = path.join(cwd, ".aurora", "after-effects");
  fs.mkdirSync(dir, { recursive: true });
  const id = String(name || "ae-job")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "ae-job";
  const file = path.join(dir, `${id}.json`);
  if (fs.existsSync(file)) throw new Error(`After Effects job already exists: ${id}`);

  const job = {
    schema_version: 1,
    id,
    operation: "render",
    project: null,
    comp: null,
    output: null,
    start_frame: null,
    end_frame: null,
    reuse: false,
    script: null,
    quality: "draft",
    notes: []
  };

  fs.writeFileSync(file, JSON.stringify(job, null, 2) + "\n");
  return { job, file };
}

export function runAfterEffectsJob(jobPath, { cwd = process.cwd(), dryRun = false } = {}) {
  const resolved = path.resolve(cwd, jobPath);
  if (!fs.existsSync(resolved)) throw new Error(`After Effects job not found: ${jobPath}`);
  const job = JSON.parse(fs.readFileSync(resolved, "utf8"));
  const command = buildAfterEffectsCommand(job, cwd);

  if (dryRun) return { dry_run: true, ...command, job };

  const tools = findAfterEffects();
  const realExecutable = command.kind === "aerender" ? tools.aerender : tools.afterfx;
  if (!realExecutable) {
    throw new Error(command.kind === "aerender"
      ? "aerender is not installed or configured."
      : "afterfx is not installed or configured.");
  }

  const started = Date.now();
  const result = spawnSync(realExecutable, command.args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });

  const logsDir = path.join(cwd, ".aurora", "after-effects", "logs");
  fs.mkdirSync(logsDir, { recursive: true });
  const logFile = path.join(logsDir, `${job.id}-${Date.now()}.log`);
  fs.writeFileSync(logFile, [
    `command: ${realExecutable} ${command.args.join(" ")}`,
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
