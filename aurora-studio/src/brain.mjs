import fs from "node:fs";
import path from "node:path";

function auroraDir(cwd = process.cwd()) {
  return path.join(cwd, ".aurora");
}

function slug(value) {
  return String(value || "reference")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "reference";
}

export function projectPath(cwd = process.cwd()) {
  return path.join(auroraDir(cwd), "project.json");
}

export function readProject(cwd = process.cwd()) {
  const file = projectPath(cwd);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

export function ensureProjectProfile(seed = {}, cwd = process.cwd()) {
  fs.mkdirSync(auroraDir(cwd), { recursive: true });
  const file = projectPath(cwd);
  if (fs.existsSync(file)) return readProject(cwd);

  const now = new Date().toISOString();
  const profile = {
    schema_version: 1,
    project_id: slug(seed.product || path.basename(cwd)),
    product: seed.product || "",
    purpose: seed.purpose || "",
    audience: [],
    offer: "",
    positioning: "",
    brand: {
      personality: [],
      colors: [],
      fonts: [],
      logo_paths: [],
      avoid: []
    },
    content: {
      channels: [],
      default_formats: [],
      languages: [],
      recurring_series: []
    },
    creative: {
      preferred_moods: [],
      avoid_moods: [],
      recurring_constraints: []
    },
    notes: [],
    created_at: now,
    updated_at: now
  };
  fs.writeFileSync(file, JSON.stringify(profile, null, 2) + "\n");
  return profile;
}

export function writeProject(profile, cwd = process.cwd()) {
  profile.updated_at = new Date().toISOString();
  fs.mkdirSync(auroraDir(cwd), { recursive: true });
  fs.writeFileSync(projectPath(cwd), JSON.stringify(profile, null, 2) + "\n");
  return profile;
}

export function referencesDir(cwd = process.cwd()) {
  return path.join(auroraDir(cwd), "references");
}

export function createReference(name, source = null, cwd = process.cwd()) {
  const dir = referencesDir(cwd);
  fs.mkdirSync(dir, { recursive: true });
  const id = slug(name);
  const file = path.join(dir, `${id}.json`);
  if (fs.existsSync(file)) throw new Error(`Reference already exists: ${id}`);

  const now = new Date().toISOString();
  const reference = {
    schema_version: 1,
    id,
    name,
    source: source ? { type: "provided", value: source } : { type: "unknown", value: null },
    analysis: {
      medium: null,
      subject: null,
      quality_tier: null,
      story_structure: [],
      camera: [],
      lighting: [],
      palette_roles: [],
      typography: [],
      materials: [],
      motion_grammar: [],
      edit_rhythm: [],
      audio: [],
      requires_true_3d: null,
      requires_compositing: null,
      asset_search_terms: [],
      technical_constraints: [],
      must_keep: [],
      must_not_copy: [],
      uncertainty: []
    },
    adaptation: {
      project_fit: null,
      changes_needed: [],
      asset_strategy: null,
      recommended_route: [],
      confidence: null
    },
    created_at: now,
    updated_at: now
  };

  fs.writeFileSync(file, JSON.stringify(reference, null, 2) + "\n");
  return { reference, file };
}

export function readReference(idOrPath, cwd = process.cwd()) {
  const direct = path.resolve(cwd, idOrPath);
  const file = fs.existsSync(direct)
    ? direct
    : path.join(referencesDir(cwd), `${slug(idOrPath)}.json`);
  if (!fs.existsSync(file)) throw new Error(`Reference not found: ${idOrPath}`);
  return { reference: JSON.parse(fs.readFileSync(file, "utf8")), file };
}

export function listReferences(cwd = process.cwd()) {
  const dir = referencesDir(cwd);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => name.endsWith(".json"))
    .sort()
    .map(name => {
      const file = path.join(dir, name);
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      return { id: data.id, name: data.name, file };
    });
}
