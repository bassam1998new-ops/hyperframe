import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  HYPERFRAMES_RANGE,
  ensureToolsPackage,
  hyperframesInstallPlan,
  installHyperframesCore,
  hyperframesBin,
  resolveHyperframesBinary,
  resolveHyperframesCommand,
  runWorkspaceHyperframes
} from "../src/tool-install.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-tools-"));
}

test("workspace tools package is isolated under .aurora", () => {
  const cwd = temp();
  const result = ensureToolsPackage(cwd);

  assert.ok(result.prefix.includes(path.join(".aurora", "tools")));
  assert.ok(fs.existsSync(result.package_file));

  const pkg = JSON.parse(fs.readFileSync(result.package_file, "utf8"));
  assert.equal(pkg.private, true);
});

test("HyperFrames install plan does not modify project package.json", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ name: "user-project" }));

  const plan = hyperframesInstallPlan(cwd);

  assert.ok(plan.npm_args.includes("--prefix"));
  assert.ok(plan.npm_args.includes(`hyperframes@${HYPERFRAMES_RANGE}`));
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8")).name,
    "user-project"
  );
});

test("HyperFrames installer supports dry run without network", () => {
  const cwd = temp();
  const result = installHyperframesCore({ cwd, dryRun: true });

  assert.equal(result.dry_run, true);
  assert.ok(result.binary.includes("hyperframes"));
});


test("isolated HyperFrames binary is preferred when present", () => {
  const cwd = temp();
  const binary = hyperframesBin(cwd);
  fs.mkdirSync(path.dirname(binary), { recursive: true });
  fs.writeFileSync(binary, "");

  const resolved = resolveHyperframesBinary(cwd);
  assert.equal(resolved.available, true);
  assert.equal(resolved.source, "aurora_workspace");
  assert.equal(resolved.binary, binary);
});

test("workspace HyperFrames wrapper can dry-run the isolated binary", () => {
  const cwd = temp();
  const binary = hyperframesBin(cwd);
  fs.mkdirSync(path.dirname(binary), { recursive: true });
  fs.writeFileSync(binary, "");

  const result = runWorkspaceHyperframes(
    ["upgrade", "--check", "--json"],
    { cwd, dryRun: true }
  );

  assert.equal(result.dry_run, true);
  assert.equal(result.source, "aurora_workspace");
  assert.deepEqual(result.args, ["upgrade", "--check", "--json"]);
});


test("configured FFmpeg directory is forwarded to HyperFrames child PATH", () => {
  const cwd = temp();
  const binary = hyperframesBin(cwd);
  fs.mkdirSync(path.dirname(binary), { recursive: true });
  fs.writeFileSync(binary, "");

  const ffmpeg = path.join(cwd, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  fs.writeFileSync(ffmpeg, "");

  const previous = process.env.AURORA_FFMPEG_PATH;
  process.env.AURORA_FFMPEG_PATH = ffmpeg;

  let captured = null;
  try {
    const result = runWorkspaceHyperframes(["doctor"], {
      cwd,
      spawnImpl: (_exe, _args, options) => {
        captured = options;
        return { status: 0, stdout: "ok", stderr: "" };
      }
    });
    assert.equal(result.ok, true);
  } finally {
    if (previous === undefined) delete process.env.AURORA_FFMPEG_PATH;
    else process.env.AURORA_FFMPEG_PATH = previous;
  }

  assert.ok(captured);
  assert.ok(String(captured.env.PATH).startsWith(path.dirname(ffmpeg)));
});


test("local npm HyperFrames package executes its JS bin through Node", () => {
  const cwd = temp();
  const binary = hyperframesBin(cwd);
  const packageRoot = path.join(
    cwd,
    ".aurora",
    "tools",
    "node_modules",
    "hyperframes"
  );
  const cli = path.join(packageRoot, "cli.mjs");

  fs.mkdirSync(path.dirname(binary), { recursive: true });
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.writeFileSync(binary, "");
  fs.writeFileSync(
    path.join(packageRoot, "package.json"),
    JSON.stringify({
      name: "hyperframes",
      version: "0.8.999-test",
      type: "module",
      bin: {
        hyperframes: "./cli.mjs"
      }
    })
  );
  fs.writeFileSync(
    cli,
    'console.log("FAKE-HYPERFRAMES", process.argv.slice(2).join(" "));'
  );

  const command = resolveHyperframesCommand(cwd);
  assert.equal(command.executable, process.execPath);
  assert.equal(command.node_cli, cli);

  const result = runWorkspaceHyperframes(
    ["doctor", "--json"],
    { cwd }
  );

  assert.equal(result.ok, true);
  assert.match(result.stdout, /FAKE-HYPERFRAMES doctor --json/);
  assert.equal(result.node_cli, cli);
});
