import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const packageJson = JSON.parse(
  fs.readFileSync(path.join(ROOT, "package.json"), "utf8")
);

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

  const packageNameParts = String(packageJson.name || "")
    .split("/")
    .filter(Boolean);
  if (!packageNameParts.length) {
    throw new Error("package.json has no package name.");
  }

  const packageDir = path.join(
    workspace,
    "node_modules",
    ...packageNameParts
  );
  const cli = path.join(packageDir, "bin", "aurora-studio.mjs");

  if (!fs.existsSync(cli)) {
    throw new Error(`Installed CLI not found: ${cli}`);
  }

  const help = run(process.execPath, [cli, "help"], { cwd: workspace });
  if (!/AurorA Studio/.test(help.stdout) || !/Quick start:/.test(help.stdout)) {
    throw new Error("Installed CLI default help is missing the simple AurorA quick start.");
  }
  if (/asset-plan|build-plan|usage record/.test(help.stdout)) {
    throw new Error("Installed CLI default help exposes advanced internal commands.");
  }

  const advancedHelp = run(process.execPath, [cli, "help", "--all"], { cwd: workspace });
  if (!/advanced commands/.test(advancedHelp.stdout) || !/Production:/.test(advancedHelp.stdout)) {
    throw new Error("Installed CLI advanced help is incomplete.");
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
    path.join(workspace, ".aurora", ".gitignore"),
    path.join(workspace, ".aurora", "README.md"),
    path.join(workspace, ".aurora", "workspace.json"),
    path.join(workspace, ".aurora", "project.json"),
    path.join(workspace, ".aurora", "system", "bin", "aurora-studio.mjs"),
    path.join(workspace, ".aurora", "system", "skills", "DIRECTOR.md"),
    path.join(workspace, ".aurora", "system", "knowledge", "tools", "registry.json"),
    path.join(workspace, ".aurora", "system", "ui", "index.html"),
    path.join(workspace, ".aurora", "system", "ui", "styles.css"),
    path.join(workspace, ".aurora", "system", "ui", "app.js"),
    path.join(workspace, ".aurora", "system", "ui", "app", "router.js"),
    path.join(workspace, ".aurora", "system", "ui", "app", "views", "create.js"),
    path.join(workspace, ".aurora", "system", "ui", "styles", "tokens.css"),
    path.join(workspace, ".aurora", "system", "ui", "styles", "components.css"),
    path.join(workspace, ".aurora", "system", "ui", "vendor", "LUCIDE-LICENSE.txt")
  ];

  for (const file of expected) {
    if (!fs.existsSync(file)) {
      throw new Error(`Packaged install smoke missing: ${file}`);
    }
  }

  const ignore = fs.readFileSync(
    path.join(workspace, ".aurora", ".gitignore"),
    "utf8"
  );
  if (!/^\*/m.test(ignore)) {
    throw new Error("AurorA workspace memory is not private-by-default.");
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
