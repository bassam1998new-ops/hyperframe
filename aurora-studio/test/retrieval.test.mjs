import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ensureProjectProfile, createReference } from "../src/brain.mjs";
import { addLibraryItem } from "../src/library.mjs";
import { retrieveContext } from "../src/retrieval.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-retrieval-"));
}

test("retrieval combines project reference reusable assets and lessons", () => {
  const cwd = temp();
  ensureProjectProfile({ product: "Demo SaaS", purpose: "launch videos" }, cwd);

  const ref = createReference("Hero", "hero.mp4", cwd);
  ref.reference.analysis.asset_search_terms = ["glass", "server"];
  ref.reference.analysis.requires_true_3d = true;
  fs.writeFileSync(ref.file, JSON.stringify(ref.reference, null, 2));

  addLibraryItem({
    name: "Glass Server Model",
    kind: "model",
    path: "./glass-server.glb",
    tags: ["glass", "server", "3d"],
    approved: true
  }, cwd);

  fs.appendFileSync(path.join(cwd, ".aurora", "lessons.jsonl"), JSON.stringify({
    lesson: "Glass server hero shots worked best with slow camera motion.",
    approved: true
  }) + "\n");

  fs.appendFileSync(path.join(cwd, ".aurora", "decisions.jsonl"), JSON.stringify({
    task_type: "server launch",
    route: ["blender"],
    approved: true
  }) + "\n");

  const packet = retrieveContext({
    query: "make a server launch hero",
    referenceId: "hero",
    cwd
  });

  assert.equal(packet.project.product, "Demo SaaS");
  assert.equal(packet.reference.id, "hero");
  assert.equal(packet.reusable.assets[0].name, "Glass Server Model");
  assert.equal(packet.experience.lessons.length, 1);
  assert.equal(packet.retrieval.embeddings_used, false);
});
