import fs from "node:fs";
import path from "node:path";

function runDir(cwd, runId) {
  return path.join(cwd, ".aurora", "runs", runId);
}

function moodPath(cwd, runId) {
  return path.join(runDir(cwd, runId), "mood.json");
}

export function createMood(runId, cwd = process.cwd()) {
  const dir = runDir(cwd, runId);
  if (!fs.existsSync(path.join(dir, "state.json"))) {
    throw new Error(`Run not found: ${runId}`);
  }

  const file = moodPath(cwd, runId);
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
    arc: [
      { phase: "open", range: [0, 0.2], feeling: "", energy: 0, tension: 0 },
      { phase: "build", range: [0.2, 0.65], feeling: "", energy: 0, tension: 0 },
      { phase: "payoff", range: [0.65, 0.9], feeling: "", energy: 0, tension: 0 },
      { phase: "resolve", range: [0.9, 1], feeling: "", energy: 0, tension: 0 }
    ],
    visual: {
      composition: [],
      camera_behavior: [],
      lens_feel: [],
      lighting: [],
      palette_roles: [],
      typography: [],
      materials_textures: [],
      depth: []
    },
    motion: {
      density: "",
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
  return { mood, file, created: true };
}

export function readMood(runId, cwd = process.cwd()) {
  const file = moodPath(cwd, runId);
  if (!fs.existsSync(file)) throw new Error(`Mood not found for run: ${runId}`);
  return { mood: JSON.parse(fs.readFileSync(file, "utf8")), file };
}
