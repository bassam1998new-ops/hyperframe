import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RELEASE_FILE = path.resolve(HERE, "../release.json");
export const HYPERFRAMES_DEV_RANGE = "0.8";

export function hyperframesInstallSpec() {
  try {
    const release = JSON.parse(fs.readFileSync(RELEASE_FILE, "utf8"));
    const pinned = String(release.hyperframes_version || "").trim();
    if (/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pinned)) {
      return pinned;
    }
  } catch {
    // Development fallback below.
  }

  return HYPERFRAMES_DEV_RANGE;
}

export const HYPERFRAMES_RANGE = hyperframesInstallSpec();

function findOnPath(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [command], { encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map(x => x.trim()).find(Boolean) || null;
}

export function toolsPrefix(cwd = process.cwd()) {
  return path.join(cwd, ".aurora", "tools");
}

export function hyperframesBin(cwd = process.cwd()) {
  const name = process.platform === "win32" ? "hyperframes.cmd" : "hyperframes";
  return path.join(toolsPrefix(cwd), "node_modules", ".bin", name);
}

export function isolatedHyperframesInstalled(cwd = process.cwd()) {
  return fs.existsSync(hyperframesBin(cwd));
}

function projectHyperframesBin(cwd = process.cwd()) {
  const name = process.platform === "win32" ? "hyperframes.cmd" : "hyperframes";
  return path.join(cwd, "node_modules", ".bin", name);
}


function hyperframesPackageRoot(cwd, source) {
  if (source === "aurora_workspace") {
    return path.join(toolsPrefix(cwd), "node_modules", "hyperframes");
  }
  if (source === "project_node_modules") {
    return path.join(cwd, "node_modules", "hyperframes");
  }
  return null;
}

function packageBinTarget(packageRoot) {
  if (!packageRoot) return null;
  const packageFile = path.join(packageRoot, "package.json");
  if (!fs.existsSync(packageFile)) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
    const bin = typeof pkg.bin === "string"
      ? pkg.bin
      : pkg.bin?.hyperframes || Object.values(pkg.bin || {})[0];

    if (!bin) return null;
    const target = path.resolve(packageRoot, String(bin));
    return fs.existsSync(target) ? target : null;
  } catch {
    return null;
  }
}

export function unsafeWindowsGlobalShim(resolved, platform = process.platform) {
  return Boolean(
    platform === "win32" &&
    resolved?.source === "path" &&
    /\.(cmd|bat)$/i.test(String(resolved?.binary || ""))
  );
}

export function resolveHyperframesCommand(cwd = process.cwd()) {
  const resolved = resolveHyperframesBinary(cwd);
  if (!resolved.available) {
    return {
      available: false,
      executable: null,
      prefix_args: [],
      source: null,
      shim: null,
      node_cli: null
    };
  }

  const nodeCli = packageBinTarget(
    hyperframesPackageRoot(cwd, resolved.source)
  );

  if (nodeCli) {
    return {
      available: true,
      executable: process.execPath,
      prefix_args: [nodeCli],
      source: resolved.source,
      shim: resolved.binary,
      node_cli: nodeCli
    };
  }

  if (unsafeWindowsGlobalShim(resolved)) {
    return {
      available: false,
      executable: null,
      prefix_args: [],
      source: resolved.source,
      shim: resolved.binary,
      node_cli: null,
      reason: "unsafe_windows_global_shim",
      install_hint: "Install the isolated workspace core with: aurora-studio hyperframe install"
    };
  }

  return {
    available: true,
    executable: resolved.binary,
    prefix_args: [],
    source: resolved.source,
    shim: resolved.binary,
    node_cli: null
  };
}

export function resolveHyperframesBinary(cwd = process.cwd()) {
  const isolated = hyperframesBin(cwd);
  if (fs.existsSync(isolated)) {
    return { available: true, binary: isolated, source: "aurora_workspace" };
  }

  const project = projectHyperframesBin(cwd);
  if (fs.existsSync(project)) {
    return { available: true, binary: project, source: "project_node_modules" };
  }

  const global = findOnPath(process.platform === "win32" ? "hyperframes.cmd" : "hyperframes")
    || findOnPath("hyperframes");

  if (global) {
    return { available: true, binary: global, source: "path" };
  }

  return { available: false, binary: null, source: null };
}

export function ensureToolsPackage(cwd = process.cwd()) {
  const prefix = toolsPrefix(cwd);
  fs.mkdirSync(prefix, { recursive: true });
  const file = path.join(prefix, "package.json");

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({
      name: "aurora-studio-workspace-tools",
      private: true,
      version: "0.0.0"
    }, null, 2) + "\n");
  }

  return { prefix, package_file: file };
}

function resolveNpmCli(npmExecutable = null) {
  const candidates = [
    process.env.npm_execpath,
    npmExecutable
      ? path.join(path.dirname(npmExecutable), "node_modules", "npm", "bin", "npm-cli.js")
      : null,
    path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")
  ].filter(Boolean);

  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

export function hyperframesInstallPlan(cwd = process.cwd()) {
  const npm = findOnPath(process.platform === "win32" ? "npm.cmd" : "npm") || findOnPath("npm");
  const tools = ensureToolsPackage(cwd);
  const npmArgs = [
    "install",
    "--prefix", tools.prefix,
    "--save-exact",
    "--no-audit",
    "--no-fund",
    `hyperframes@${HYPERFRAMES_RANGE}`
  ];

  let executable = npm || (process.platform === "win32" ? "npm.cmd" : "npm");
  let args = npmArgs;
  let npmCli = null;

  if (process.platform === "win32") {
    npmCli = resolveNpmCli(npm);
    if (!npmCli) {
      throw new Error(
        "Could not locate npm-cli.js for a safe Windows install. " +
        "Use a standard Node.js/npm installation or install HyperFrames manually."
      );
    }

    executable = process.execPath;
    args = [npmCli, ...npmArgs];
  }

  return {
    executable,
    args,
    npm_executable: npm || null,
    npm_cli: npmCli,
    npm_args: npmArgs,
    prefix: tools.prefix,
    package_file: tools.package_file,
    binary: hyperframesBin(cwd)
  };
}

export function installHyperframesCore({
  cwd = process.cwd(),
  dryRun = false,
  spawnImpl = spawnSync
} = {}) {
  const plan = hyperframesInstallPlan(cwd);

  if (dryRun) {
    return {
      dry_run: true,
      ...plan
    };
  }

  const result = spawnImpl(plan.executable, plan.args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });

  if (result.status !== 0) {
    throw new Error(
      "HyperFrames install failed: " +
      (result.stderr || result.stdout || `exit ${result.status}`).trim().slice(-4000)
    );
  }

  if (!fs.existsSync(plan.binary)) {
    throw new Error("HyperFrames install completed but the workspace binary was not found.");
  }

  return {
    ok: true,
    binary: plan.binary,
    prefix: plan.prefix,
    stdout_tail: (result.stdout || "").slice(-4000)
  };
}

export function runWorkspaceHyperframes(args = [], {
  cwd = process.cwd(),
  dryRun = false,
  spawnImpl = spawnSync
} = {}) {
  const command = resolveHyperframesCommand(cwd);

  if (!command.available) {
    const detail = command.install_hint ? " " + command.install_hint : "";
    throw new Error("HyperFrames core is not safely executable." + detail);
  }

  const finalArgs = [...command.prefix_args, ...args];

  if (dryRun) {
    return {
      dry_run: true,
      executable: command.executable,
      source: command.source,
      node_cli: command.node_cli,
      args: finalArgs
    };
  }

  const env = { ...process.env };
  const configuredFfmpeg = process.env.AURORA_FFMPEG_PATH;
  if (configuredFfmpeg && fs.existsSync(configuredFfmpeg)) {
    env.PATH = [
      path.dirname(configuredFfmpeg),
      env.PATH || env.Path || ""
    ].filter(Boolean).join(path.delimiter);
  }

  const result = spawnImpl(command.executable, finalArgs, {
    cwd,
    env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });

  return {
    ok: result.status === 0,
    exit_code: result.status,
    executable: command.executable,
    source: command.source,
    node_cli: command.node_cli,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}
