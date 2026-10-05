import fs from "node:fs";
import path from "node:path";
import { loadRun } from "./governance.mjs";

export function moodPath(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  return path.join(run.dir, "mood.json");
}

export function createMood(runId, cwd = process.cwd()) {
  const run = loadRun(cwd, runId);
  const file = path.join(run.dir, "mood.json");
  if (fs.existsSync(file)) {
    return { mood: JSON.parse(fs.readFileSync(file, "utf8")), file, created: false };
  }

  const mood = {
    schema_version: 1,
    run_id: runId,
    tool_agnostic: true,
    intent: {
      one_sentence: "",
      audience_should_feel: [],
      product_truth_to_protect: []
    },
    arc: [],
    visual: {
      composition: [],
      depth: [],
      camera_behavior: [],
      lens_feel: [],
      lighting: [],
      palette_roles: [],
      typography: [],
      materials_texture: []
    },
    motion: {
      subject_motion: [],
      camera_motion: [],
      graphic_motion: [],
      transition_grammar: [],
      edit_rhythm: []
    },
    audio: {
      voice: [],
      music: [],
      sfx: [],
      silence: []
    },
    continuity_anchors: [],
    must_not_happen: [],
    assumptions: [],
    confidence: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  fs.writeFileSync(file, JSON.stringify(mood, null, 2) + "\n");
  return { mood, file, created: true, run };
}

export function readMood(runId, cwd = process.cwd()) {
  const file = moodPath(runId, cwd);
  if (!fs.existsSync(file)) return null;
  return { mood: JSON.parse(fs.readFileSync(file, "utf8")), file };
}

export function validateMood(mood) {
  const errors = [];
  const warnings = [];

  if (!mood || mood.schema_version !== 1) errors.push("Unsupported or missing mood schema.");
  if (mood?.tool_agnostic !== true) errors.push("Mood must remain tool-agnostic.");
  if (!mood?.intent?.one_sentence?.trim()) errors.push("Mood intent.one_sentence is empty.");
  if (!Array.isArray(mood?.arc) || mood.arc.length === 0) warnings.push("Mood arc is empty.");

  for (const [index, phase] of (mood?.arc || []).entries()) {
    if (!Array.isArray(phase.range) || phase.range.length !== 2) {
      errors.push(`Mood arc phase ${index + 1} needs a [start,end] range.`);
      continue;
    }
    const [start, end] = phase.range;
    if (!(start >= 0 && end <= 1 && start < end)) {
      errors.push(`Mood arc phase ${index + 1} has invalid normalized range.`);
    }
  }

  if (!Array.isArray(mood?.continuity_anchors) || mood.continuity_anchors.length === 0) {
    warnings.push("No continuity anchors defined.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateMoodFile(runId, cwd = process.cwd()) {
  const result = readMood(runId, cwd);
  if (!result) return { ok: false, errors: ["Mood file not found."], warnings: [] };
  return validateMood(result.mood);
}
