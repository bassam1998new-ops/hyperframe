import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRuntime } from "../src/runtime.mjs";

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
