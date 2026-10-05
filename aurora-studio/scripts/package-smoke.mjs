import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === "win32" && /\.(cmd|bat)$/i.test(command),
    ...options
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        result.error ? String(result.error) : "",
        result.stdout || "",
        result.stderr || ""
      ].join("\n")
    );
  }

  return result;
}

const pack = run(npm, ["pack", "--json"], { cwd: ROOT });
const payload = JSON.parse(pack.stdout);
const filename = payload?.[0]?.filename;

if (!filename) throw new Error("npm pack did not return a tarball filename.");

const tarball = path.join(ROOT, filename);
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "aurora-package-smoke-"));

try {
  run(npm, ["init", "-y"], { cwd: workspace });
  run(
    npm,
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball],
    { cwd: workspace }
  );

  const packageDir = path.join(workspace, "node_modules", "aurora-studio-local");
  const cli = path.join(packageDir, "bin", "aurora-studio.mjs");

  if (!fs.existsSync(cli)) {
    throw new Error(`Installed CLI not found: ${cli}`);
  }

  const help = run(process.execPath, [cli, "help"], { cwd: workspace });
  if (!/AurorA Studio/.test(help.stdout)) {
    throw new Error("Installed CLI help did not identify AurorA Studio.");
  }

  const configFile = path.join(workspace, "aurora-setup.json");
  fs.writeFileSync(
    configFile,
    JSON.stringify({
      product: "Package Smoke Product",
      purpose: "test videos",
      mode: "direct",
      agents: "none",
      install_hyperframes: false,
      resources: {
        google_flow: false,
        chatgpt_browser: false,
        meta_ai: false,
        elevenlabs: false
      }
    }, null, 2)
  );

  run(
    process.execPath,
    [cli, "setup", "--config", configFile],
    { cwd: workspace }
  );

  const expected = [
    path.join(workspace, ".aurora", "workspace.json"),
    path.join(workspace, ".aurora", "project.json"),
    path.join(workspace, ".aurora", "system", "bin", "aurora-studio.mjs"),
    path.join(workspace, ".aurora", "system", "skills", "DIRECTOR.md"),
    path.join(workspace, ".aurora", "system", "knowledge", "tools", "registry.json")
  ];

  for (const file of expected) {
    if (!fs.existsSync(file)) {
      throw new Error(`Packaged install smoke missing: ${file}`);
    }
  }

  const workspaceJson = JSON.parse(
    fs.readFileSync(path.join(workspace, ".aurora", "workspace.json"), "utf8")
  );

  if (workspaceJson.project?.product !== "Package Smoke Product") {
    throw new Error("Configured setup did not persist the product.");
  }

  console.log(JSON.stringify({
    ok: true,
    tarball: filename,
    installed_package: packageDir,
    portable_system: path.join(workspace, ".aurora", "system")
  }, null, 2));
} finally {
  fs.rmSync(workspace, { recursive: true, force: true });
  fs.rmSync(tarball, { force: true });
}
