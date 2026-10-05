import test from "node:test";
import assert from "node:assert/strict";
import { buildTransparentWebmArgs, packTransparentWebm } from "../src/adapters/blender-handoff.mjs";

test("transparent handoff uses VP9 alpha settings", () => {
  const args = buildTransparentWebmArgs({
    inputPattern: "./frames/f_%04d.png",
    output: "./renders/overlay.webm",
    fps: 30,
    quality: "premium"
  }, "/tmp/project");

  assert.ok(args.includes("libvpx-vp9"));
  assert.ok(args.includes("yuva420p"));
  assert.ok(args.includes("-auto-alt-ref"));
  assert.ok(args.includes("0"));
  assert.ok(args.includes("-crf"));
  assert.ok(args.includes("18"));
  assert.ok(args.at(-1).endsWith("overlay.webm"));
});

test("hero quality uses lower CRF than draft", () => {
  const hero = buildTransparentWebmArgs({
    inputPattern: "f_%04d.png",
    output: "hero.webm",
    quality: "hero"
  });
  const draft = buildTransparentWebmArgs({
    inputPattern: "f_%04d.png",
    output: "draft.webm",
    quality: "draft"
  });

  assert.equal(hero[hero.indexOf("-crf") + 1], "14");
  assert.equal(draft[draft.indexOf("-crf") + 1], "32");
});

test("dry run does not require ffmpeg", () => {
  const result = packTransparentWebm({
    inputPattern: "frames/f_%04d.png",
    output: "overlay.webm"
  }, { dryRun: true });

  assert.equal(result.dry_run, true);
  assert.ok(result.args.includes("yuva420p"));
});

test("handoff refuses non-WebM output", () => {
  assert.throws(
    () => buildTransparentWebmArgs({
      inputPattern: "f_%04d.png",
      output: "overlay.mp4"
    }),
    /must be .webm/
  );
});
