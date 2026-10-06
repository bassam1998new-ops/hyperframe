import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

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
    path.join(workspace, ".aurora", "system", "src", "reference-files.mjs"),
    path.join(workspace, ".aurora", "system", "skills", "DIRECTOR.md"),
    path.join(workspace, ".aurora", "system", "knowledge", "tools", "registry.json"),
    path.join(workspace, ".aurora", "system", "ui", "index.html"),
    path.join(workspace, ".aurora", "system", "ui", "styles.css"),
    path.join(workspace, ".aurora", "system", "ui", "app.js"),
    path.join(workspace, ".aurora", "system", "ui", "app", "router.js"),
    path.join(workspace, ".aurora", "system", "ui", "app", "views", "create.js"),
    path.join(workspace, ".aurora", "system", "ui", "styles", "tokens.css"),
    path.join(workspace, ".aurora", "system", "ui", "styles", "components.css"),
    path.join(workspace, ".aurora", "system", "ui", "vendor", "LUCIDE-LICENSE.txt"),
    path.join(workspace, ".aurora", "system", "ui", "vendor", "FLOATING-UI-LICENSE.txt"),
    path.join(workspace, ".aurora", "system", "ui", "vendor", "MEDIA-CHROME-LICENSE.txt"),
    path.join(workspace, ".aurora", "system", "ui", "styles", "media-player.css"),
    path.join(workspace, ".aurora", "system", "ui", "app", "components", "media-player.js"),
    path.join(workspace, ".aurora", "system", "ui", "app", "workflows", "reference.js"),
    path.join(workspace, ".aurora", "system", "ui", "app", "workflows", "create-intent.js"),
    path.join(workspace, ".aurora", "system", "ui", "app", "tooltip.js")
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

  const floatingPackage = path.join(
    workspace,
    "node_modules",
    "@floating-ui",
    "dom",
    "package.json"
  );
  if (!fs.existsSync(floatingPackage)) {
    throw new Error("Floating UI dependency was not installed with the package.");
  }

  const floatingMeta = JSON.parse(fs.readFileSync(floatingPackage, "utf8"));
  if (floatingMeta.version !== "1.8.0") {
    throw new Error(
      "Installed Floating UI version mismatch: " + floatingMeta.version
    );
  }

  const mediaChromePackage = path.join(
    workspace,
    "node_modules",
    "media-chrome",
    "package.json"
  );
  if (!fs.existsSync(mediaChromePackage)) {
    throw new Error("Media Chrome dependency was not installed with the package.");
  }

  const mediaChromeMeta = JSON.parse(
    fs.readFileSync(mediaChromePackage, "utf8")
  );
  if (mediaChromeMeta.version !== "4.19.3") {
    throw new Error(
      "Installed Media Chrome version mismatch: " + mediaChromeMeta.version
    );
  }

  const uiServerModule = await import(
    pathToFileURL(
      path.join(packageDir, "src", "ui-server.mjs")
    ).href
  );
  const ui = await uiServerModule.startStudioUiServer({
    cwd: workspace,
    port: 0,
    open: false,
    cliPath: cli
  });

  try {
    for (const vendorPath of [
      "/vendor/floating-ui-utils.js",
      "/vendor/floating-ui-utils-dom.js",
      "/vendor/floating-ui-core.js",
      "/vendor/floating-ui-dom.js",
      "/vendor/media-chrome.js"
    ]) {
      const response = await fetch(
        `http://127.0.0.1:${ui.port}${vendorPath}`
      );
      if (response.status !== 200) {
        throw new Error(
          `Floating UI vendor route failed: ${vendorPath} -> ${response.status}`
        );
      }
      const js = await response.text();
      const looksValid = vendorPath.includes("media-chrome")
        ? (js.includes("media-controller") || js.includes("MediaChrome"))
        : js.includes("FloatingUI");

      if (!looksValid) {
        throw new Error(
          `UI vendor response looks invalid: ${vendorPath}`
        );
      }
    }
  } finally {
    await ui.close();
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
