import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  reviewFrameTimes,
  extractReviewFrames
} from "../src/review-frames.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-review-frames-"));
}

test("review frame times sample inside the video, not exact endpoints", () => {
  const times = reviewFrameTimes(12, 5);
  assert.deepEqual(times, [2, 4, 6, 8, 10]);
  assert.ok(times.every(time => time > 0 && time < 12));
});

test("review frame count is bounded to a useful range", () => {
  assert.equal(reviewFrameTimes(9, 1).length, 3);
  assert.equal(reviewFrameTimes(9, 99).length, 9);
});

test("review frame extraction writes hashed evidence without real ffmpeg", () => {
  const cwd = temp();
  const video = path.join(cwd, "final.mp4");
  fs.writeFileSync(video, "fake-video");

  const fakeSpawn = (_exe, args) => {
    const output = args.at(-1);
    fs.writeFileSync(output, "fake-frame-" + output);
    return { status: 0, stdout: "", stderr: "" };
  };

  const result = extractReviewFrames("final.mp4", {
    cwd,
    outputDir: ".aurora/runs/test/review-frames",
    durationSeconds: 10,
    count: 5,
    ffmpegPath: "/fake/ffmpeg",
    spawnImpl: fakeSpawn
  });

  assert.equal(result.count, 5);
  assert.equal(result.frames.length, 5);
  assert.equal(result.video_sha256.length, 64);

  for (const frame of result.frames) {
    assert.ok(fs.existsSync(path.join(cwd, frame.path)));
    assert.equal(frame.sha256.length, 64);
  }
});


test("review frame extraction refuses unsafe output folders", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "final.mp4"), "fake-video");

  assert.throws(
    () => extractReviewFrames("final.mp4", {
      cwd,
      outputDir: ".",
      durationSeconds: 10,
      ffmpegPath: "/fake/ffmpeg",
      spawnImpl: () => ({ status: 0, stdout: "", stderr: "" })
    }),
    /must stay inside \.aurora\/runs/
  );
});
