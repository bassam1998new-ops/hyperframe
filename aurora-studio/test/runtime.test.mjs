import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRuntime, ffmpegInstallHint } from "../src/runtime.mjs";

test("healthy runtime requires Node 22 and FFmpeg", () => {
  const result = evaluateRuntime({
    nodeVersion: "22.14.0",
    ffmpeg: "/tools/ffmpeg",
    ffprobe: "/tools/ffprobe"
  });

  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test("old Node blocks runtime", () => {
  const result = evaluateRuntime({
    nodeVersion: "20.19.0",
    ffmpeg: "/tools/ffmpeg",
    ffprobe: "/tools/ffprobe"
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes("Node 22+")));
});

test("missing FFmpeg blocks runtime but missing ffprobe is only a warning", () => {
  const missingFfmpeg = evaluateRuntime({
    nodeVersion: "22.14.0",
    ffmpeg: null,
    ffprobe: null
  });
  assert.equal(missingFfmpeg.ok, false);
  assert.ok(missingFfmpeg.errors.some(error => error.includes("FFmpeg")));

  const missingProbe = evaluateRuntime({
    nodeVersion: "22.14.0",
    ffmpeg: "/tools/ffmpeg",
    ffprobe: null
  });
  assert.equal(missingProbe.ok, true);
  assert.ok(missingProbe.warnings.some(warning => warning.includes("ffprobe")));
});


test("FFmpeg install hints are platform specific", () => {
  assert.match(ffmpegInstallHint("win32"), /AURORA_FFMPEG_PATH/);
  assert.match(ffmpegInstallHint("darwin"), /brew install ffmpeg/);
  assert.match(ffmpegInstallHint("linux"), /apt install ffmpeg/);
});

test("missing FFmpeg error includes actionable platform guidance", () => {
  const result = evaluateRuntime({
    nodeVersion: "22.14.0",
    ffmpeg: null,
    ffprobe: null,
    platform: "win32"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors[0], /AURORA_FFMPEG_PATH/);
  assert.match(result.ffmpeg.install_hint, /64-bit FFmpeg/);
});
