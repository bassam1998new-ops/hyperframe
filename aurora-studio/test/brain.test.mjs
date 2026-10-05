import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ensureProjectProfile,
  readProject,
  createReference,
  readReference,
  listReferences
} from "../src/brain.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-brain-"));
}

test("project profile is created once and preserved", () => {
  const cwd = temp();
  const first = ensureProjectProfile({ product: "Demo SaaS", purpose: "product videos" }, cwd);
  assert.equal(first.product, "Demo SaaS");

  const second = ensureProjectProfile({ product: "Should not overwrite" }, cwd);
  assert.equal(second.product, "Demo SaaS");
  assert.equal(readProject(cwd).purpose, "product videos");
});

test("reference record creates structured analysis template", () => {
  const cwd = temp();
  const created = createReference("Purple 3D Intro", "reference.mp4", cwd);
  assert.equal(created.reference.id, "purple-3d-intro");
  assert.deepEqual(created.reference.analysis.asset_search_terms, []);
  assert.equal(created.reference.analysis.requires_true_3d, null);

  const loaded = readReference("purple-3d-intro", cwd);
  assert.equal(loaded.reference.source.value, "reference.mp4");
});

test("reference list returns saved references", () => {
  const cwd = temp();
  createReference("One", null, cwd);
  createReference("Two", null, cwd);
  const refs = listReferences(cwd);
  assert.equal(refs.length, 2);
  assert.deepEqual(refs.map(x => x.id), ["one", "two"]);
});
