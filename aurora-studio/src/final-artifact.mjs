import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadRun } from "./governance.mjs";

export function sha256File(file) {
  const hash = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);

  try {
    while (true) {
      const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    fs.closeSync(fd);
  }

  return hash.digest("hex");
}

function fileHashIfExists(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  return sha256File(file);
}

function safeRunSuffix(runId) {
  return String(runId || "run")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "run";
}

function uniqueTarget(source, finalDir, runId) {
  const base = path.basename(source);
  const direct = path.join(finalDir, base);
  if (!fs.existsSync(direct)) return direct;

  const sourceHash = sha256File(source);
  if (fileHashIfExists(direct) === sourceHash) return direct;

  const ext = path.extname(base);
  const stem = path.basename(base, ext);
  let target = path.join(finalDir, `${stem}-${safeRunSuffix(runId)}${ext}`);
  let counter = 2;

  while (fs.existsSync(target) && fileHashIfExists(target) !== sourceHash) {
    target = path.join(
      finalDir,
      `${stem}-${safeRunSuffix(runId)}-${counter}${ext}`
    );
    counter++;
  }

  return target;
}

export function preserveFinalArtifact({
  runId,
  source,
  cwd = process.cwd()
}) {
  if (!source) throw new Error("Finalize requires an approved video path.");

  const run = loadRun(cwd, runId);
  const input = path.resolve(cwd, source);

  if (!fs.existsSync(input) || !fs.statSync(input).isFile()) {
    throw new Error(`Approved render not found: ${source}`);
  }

  const finalDir = path.join(cwd, "renders", "final");
  fs.mkdirSync(finalDir, { recursive: true });

  const target = uniqueTarget(input, finalDir, runId);
  const sameFile = path.resolve(input) === path.resolve(target);
  let copied = false;

  if (!sameFile && !fs.existsSync(target)) {
    fs.copyFileSync(input, target);
    copied = true;
  }

  const stat = fs.statSync(target);
  const receipt = {
    schema_version: 1,
    run_id: runId,
    approved_at: new Date().toISOString(),
    final_path: path.relative(cwd, target),
    sha256: sha256File(target),
    bytes: stat.size,
    copied,
    source_was_inside_workspace:
      !path.relative(cwd, input).startsWith("..") &&
      !path.isAbsolute(path.relative(cwd, input))
  };

  const receiptFile = path.join(run.dir, "final.json");
  fs.writeFileSync(receiptFile, JSON.stringify(receipt, null, 2) + "\n");

  return {
    receipt,
    receipt_file: receiptFile,
    final_file: target
  };
}
