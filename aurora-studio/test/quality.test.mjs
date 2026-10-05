import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findFfprobe } from "../src/quality.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-quality-"));
}

test("configured FFmpeg path exposes sibling ffprobe", () => {
  const cwd = temp();
  const bin = path.join(cwd, "bin");
  fs.mkdirSync(bin, { recursive: true });

  const ffmpeg = path.join(bin, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  const ffprobe = path.join(bin, process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
  fs.writeFileSync(ffmpeg, "");
  fs.writeFileSync(ffprobe, "");

  const previous = process.env.AURORA_FFMPEG_PATH;
  process.env.AURORA_FFMPEG_PATH = ffmpeg;

  try {
    assert.equal(findFfprobe(), ffprobe);
  } finally {
    if (previous === undefined) delete process.env.AURORA_FFMPEG_PATH;
    else process.env.AURORA_FFMPEG_PATH = previous;
  }
});
