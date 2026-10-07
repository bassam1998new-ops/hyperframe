import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ensureProjectProfile,
  readProject,
  upsertProjectSource
} from "../src/brain.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-project-brain-"));
}

test("new Project Brain includes backward-compatible audience context", () => {
  const cwd = temp();

  const project = ensureProjectProfile({
    product: "Demo",
    purpose: "launch videos",
    website: "https://example.test"
  }, cwd);

  assert.deepEqual(project.audience, []);
  assert.deepEqual(project.audience_context, {
    knowledge_level: "",
    priorities: []
  });
  assert.deepEqual(project.claims_to_protect, []);
  assert.deepEqual(project.content.default_formats, []);
  assert.deepEqual(project.content.recurring_series, []);
});

test("Project provenance source upsert is stable instead of duplicating entries", () => {
  const cwd = temp();
  ensureProjectProfile({ product: "Demo" }, cwd);

  upsertProjectSource({
    type: "owner",
    value: "studio-ui",
    checked_at: "2026-10-07T00:00:00.000Z",
    note: "First edit"
  }, cwd);

  upsertProjectSource({
    type: "owner",
    value: "studio-ui",
    checked_at: "2026-10-07T01:00:00.000Z",
    note: "Latest edit"
  }, cwd);

  const project = readProject(cwd);
  assert.equal(project.sources.length, 1);
  assert.equal(project.sources[0].type, "owner");
  assert.equal(project.sources[0].value, "studio-ui");
  assert.equal(project.sources[0].note, "Latest edit");
  assert.equal(project.sources[0].checked_at, "2026-10-07T01:00:00.000Z");
});
