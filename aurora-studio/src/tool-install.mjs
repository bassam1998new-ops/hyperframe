import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const HYPERFRAMES_RANGE = ">=0.8.0 <0.9.0";

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

export function hyperframesInstallPlan(cwd = process.cwd()) {
  const npm = findOnPath(process.platform === "win32" ? "npm.cmd" : "npm") || findOnPath("npm");
  const tools = ensureToolsPackage(cwd);

  return {
    executable: npm || (process.platform === "win32" ? "npm.cmd" : "npm"),
    args: [
      "install",
      "--prefix", tools.prefix,
      "--save-exact",
      "--no-audit",
      "--no-fund",
      `hyperframes@${HYPERFRAMES_RANGE}`
    ],
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
  const binary = hyperframesBin(cwd);

  if (!fs.existsSync(binary)) {
    throw new Error("Workspace HyperFrames core is not installed. Run: aurora-studio hyperframe install");
  }

  if (dryRun) {
    return {
      dry_run: true,
      executable: binary,
      args
    };
  }

  const result = spawnImpl(binary, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });

  return {
    ok: result.status === 0,
    exit_code: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}
