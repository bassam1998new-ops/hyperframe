import fs from "node:fs";
import path from "node:path";
import { loadRun } from "./governance.mjs";

export function learningReviewPath(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  return path.join(run.dir, "learning-review.json");
}

export function createLearningReview(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  const file = path.join(run.dir, "learning-review.json");

  if (fs.existsSync(file)) {
    return {
      review: JSON.parse(fs.readFileSync(file, "utf8")),
      file,
      created: false
    };
  }

  const now = new Date().toISOString();
  const review = {
    schema_version: 1,
    run_id: runId,
    status: "pending",
    summary: "",
    outcome: {
      owner_approved: null,
      reviewer_result: null,
      revisions: null,
      quality_score: null
    },
    keep: [],
    cleanup_notes: [],
    lessons: [],
    proposals: {
      styles: [],
      skills: [],
      assets: []
    },
    created_at: now,
    updated_at: now
  };

  fs.writeFileSync(file, JSON.stringify(review, null, 2) + "\n");
  return { review, file, created: true, run };
}

export function readLearningReview(runId, cwd = process.cwd()) {
  const file = learningReviewPath(runId, cwd);
  if (!fs.existsSync(file)) return null;
  return {
    review: JSON.parse(fs.readFileSync(file, "utf8")),
    file
  };
}

export function validateLearningReview(review) {
  const errors = [];
  const warnings = [];

  if (!review || review.schema_version !== 1) {
    errors.push("Unsupported or missing learning review schema.");
    return { ok: false, errors, warnings };
  }

  if (!["pending", "completed"].includes(review.status)) {
    errors.push("Learning review status must be pending or completed.");
  }

  if (review.status === "completed" && !String(review.summary || "").trim()) {
    errors.push("Completed learning review needs a short summary.");
  }

  for (const key of ["styles", "skills", "assets"]) {
    if (!Array.isArray(review.proposals?.[key])) {
      errors.push(`Learning proposals.${key} must be an array.`);
    }
  }

  if (!Array.isArray(review.lessons)) errors.push("Learning lessons must be an array.");

  const totalProposals = ["styles", "skills", "assets"]
    .reduce((sum, key) => sum + (Array.isArray(review.proposals?.[key]) ? review.proposals[key].length : 0), 0);

  if (review.status === "completed" && totalProposals === 0 && review.lessons.length === 0) {
    warnings.push("Completed with no reusable lesson or proposal. This is valid when the session taught nothing new.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateLearningReviewFile(runId, cwd = process.cwd()) {
  const value = readLearningReview(runId, cwd);
  if (!value) {
    return { ok: false, errors: ["Learning review file not found."], warnings: [] };
  }
  return validateLearningReview(value.review);
}

export function completedLearningPayload(runId, cwd = process.cwd()) {
  const value = readLearningReview(runId, cwd);
  if (!value || value.review.status !== "completed") return null;

  const validation = validateLearningReview(value.review);
  if (!validation.ok) {
    throw new Error("Learning review is invalid: " + validation.errors.join("; "));
  }

  return {
    file: value.file,
    review: value.review,
    validation
  };
}
