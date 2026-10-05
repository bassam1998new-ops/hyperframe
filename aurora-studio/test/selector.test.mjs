import test from "node:test";
import assert from "node:assert/strict";
import { chooseRoute, applyExperiencePrior } from "../src/selector.mjs";

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


test("approved similar experience can break a close routing tie", () => {
  const base = chooseRoute(
    "premium product hero",
    { hyperframe: true, blender: true, after_effects: false }
  );

  const adjusted = applyExperiencePrior(base, [
    {
      run_id: "old-1",
      route: ["blender"],
      approved: true,
      retrieval_score: 4,
      quality_score: 9.5,
      revisions: 1
    },
    {
      run_id: "old-2",
      route: ["blender"],
      approved: true,
      retrieval_score: 3,
      quality_score: 9,
      revisions: 1
    }
  ]);

  const blender = adjusted.candidates.find(x => x.route_id === "blender");
  assert.ok(blender.experience_bonus > 0);
  assert.equal(adjusted.experience_adjusted, true);
});

test("unapproved experience never affects routing", () => {
  const base = chooseRoute(
    "social captions",
    { hyperframe: true, blender: true, after_effects: false }
  );
  const adjusted = applyExperiencePrior(base, [
    {
      route: ["blender"],
      approved: false,
      retrieval_score: 10,
      quality_score: 10
    }
  ]);

  assert.equal(adjusted.experience_used, 0);
  assert.equal(adjusted.experience_adjusted, false);
  assert.deepEqual(adjusted.selected.route, base.selected.route);
});

test("experience cannot create an unavailable route", () => {
  const base = chooseRoute(
    "3D rigged avatar",
    { hyperframe: true, blender: false, after_effects: false },
    { true3d: true }
  );

  const adjusted = applyExperiencePrior(base, [
    {
      route: ["blender"],
      approved: true,
      retrieval_score: 10,
      quality_score: 10
    }
  ]);

  assert.equal(adjusted.selected, null);
  assert.ok(!adjusted.candidates.some(x => x.route.includes("blender")));
});
