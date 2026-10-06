import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === "win32" && /\.(cmd|bat)$/i.test(command)
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

  return result.stdout;
}

const pack = JSON.parse(run(npm, ["pack", "--dry-run", "--json"]));
const files = (pack?.[0]?.files || []).map(item => item.path);

const forbiddenPaths = [
  /^test\//i,
  /^scripts\//i,
  /^\.github\//i,
  /(^|\/)\.env(\.|$)/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)(id_rsa|id_ed25519)$/i,
  /\.(pem|p12|pfx)$/i
];

const pathFindings = files.filter(file =>
  forbiddenPaths.some(pattern => pattern.test(file))
);

const textExtensions = new Set([
  ".js", ".mjs", ".cjs", ".json", ".md", ".txt", ".py", ".yml", ".yaml"
]);

const secretPatterns = [
  ["private_key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["aws_access_key", /\bAKIA[0-9A-Z]{16}\b/],
  ["github_pat", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ["openai_key", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["slack_token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ["google_api_key", /\bAIza[0-9A-Za-z_-]{35}\b/]
];

const personalPathPatterns = [
  ["windows_user_path", /[A-Za-z]:\\Users\\[^\\\r\n]+\\/],
  ["mac_user_path", /\/Users\/[^/\r\n]+\//],
  ["linux_home_path", /\/home\/[^/\r\n]+\//]
];

const contentFindings = [];

for (const file of files) {
  if (!textExtensions.has(path.extname(file).toLowerCase())) continue;

  const absolute = path.join(ROOT, file);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;

  const text = fs.readFileSync(absolute, "utf8");

  for (const [kind, pattern] of [...secretPatterns, ...personalPathPatterns]) {
    if (pattern.test(text)) {
      contentFindings.push({ file, kind });
    }
  }
}

const required = [
  "LICENSE",
  "README.md",
  "CHANGELOG.md",
  "bin/aurora-studio.mjs",
  "src/reference-files.mjs",
  "src/concepts.mjs",
  "ui/index.html",
  "ui/styles.css",
  "ui/styles/tokens.css",
  "ui/styles/base.css",
  "ui/styles/components.css",
  "ui/styles/shell.css",
  "ui/styles/create.css",
  "ui/styles/media-player.css",
  "ui/styles/views.css",
  "ui/styles/responsive.css",
  "ui/app.js",
  "ui/app/api.js",
  "ui/app/format.js",
  "ui/app/router.js",
  "ui/app/toast.js",
  "ui/app/dialog.js",
  "ui/app/components/media-player.js",
  "ui/app/workflows/reference.js",
  "ui/app/workflows/create-intent.js",
  "ui/app/workflows/concepts.js",
  "ui/app/tooltip.js",
  "ui/app/views/create.js",
  "ui/app/views/library.js",
  "ui/app/views/project.js",
  "ui/app/views/settings.js",
  "ui/app/views/updates.js",
  "ui/vendor/LUCIDE-LICENSE.txt",
  "ui/vendor/FLOATING-UI-LICENSE.txt",
  "ui/vendor/MEDIA-CHROME-LICENSE.txt",
  "release.json",
  "studio.manifest.json",
  "knowledge/tools/registry.json",
  "schemas/concepts.schema.json",
  "skills/DIRECTOR.md",
  "skills/DIRECT.md"
];

const missingRequired = required.filter(file => !files.includes(file));

const result = {
  ok:
    pathFindings.length === 0 &&
    contentFindings.length === 0 &&
    missingRequired.length === 0,
  package_files: files.length,
  forbidden_paths: pathFindings,
  content_findings: contentFindings,
  missing_required: missingRequired
};

console.log(JSON.stringify(result, null, 2));

if (!result.ok) process.exitCode = 1;
