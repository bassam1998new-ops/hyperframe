import test from "node:test";
import assert from "node:assert/strict";
import { chooseRoute } from "../src/selector.mjs";

test("3D avatar routes to Blender when available", () => {
  const r = chooseRoute("premium 3D avatar with cinematic lighting", {
    hyperframe: true,
    blender: true,
    after_effects: false
  });
  assert.ok(r.selected);
  assert.equal(r.selected.route[0], "blender");
});

test("2D captions route to HyperFrames", () => {
  const r = chooseRoute("social kinetic typography with captions", {
    hyperframe: true,
    blender: true,
    after_effects: false
  });
  assert.ok(r.selected);
  assert.deepEqual(r.selected.route, ["hyperframe"]);
});

test("true 3D refuses weak fallback if Blender is unavailable", () => {
  const r = chooseRoute("3D rigged avatar", {
    hyperframe: true,
    blender: false,
    after_effects: false
  });
  assert.equal(r.selected, null);
});

test("reference analysis can require true 3D even when prompt is vague", () => {
  const r = chooseRoute(
    "make this reference for my product",
    { hyperframe: true, blender: true, after_effects: false },
    { true3d: true }
  );
  assert.ok(r.selected);
  assert.equal(r.selected.route[0], "blender");
});
