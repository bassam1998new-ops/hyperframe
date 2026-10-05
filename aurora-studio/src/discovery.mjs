import fs from "node:fs";
import path from "node:path";

const IGNORE_DIRS = new Set([
  ".git", ".aurora", "node_modules", ".next", "dist", "build", "coverage",
  ".cache", ".turbo", ".vercel", "__pycache__", ".venv", "venv"
]);

const CATEGORIES = {
  video: new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"]),
  image: new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif", ".exr", ".hdr"]),
  audio: new Set([".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg"]),
  model3d: new Set([".blend", ".glb", ".gltf", ".fbx", ".obj", ".usd", ".usdz", ".abc"]),
  design: new Set([".aep", ".mogrt", ".ai", ".psd"]),
  font: new Set([".ttf", ".otf", ".woff", ".woff2"]),
  document: new Set([".md", ".txt", ".pdf", ".docx", ".json", ".yaml", ".yml"])
};

function categoryFor(file) {
  const ext = path.extname(file).toLowerCase();
  for (const [category, extensions] of Object.entries(CATEGORIES)) {
    if (extensions.has(ext)) return category;
  }
  return null;
}

function relative(cwd, file) {
  const value = path.relative(cwd, file);
  return value || ".";
}

export function scanWorkspace(cwd = process.cwd(), options = {}) {
  const maxDepth = Math.max(1, Math.min(8, Number(options.maxDepth ?? 3)));
  const maxFiles = Math.max(100, Math.min(50000, Number(options.maxFiles ?? 5000)));
  const samplesPerCategory = Math.max(1, Math.min(100, Number(options.samplesPerCategory ?? 30)));

  const counts = Object.fromEntries(Object.keys(CATEGORIES).map(key => [key, 0]));
  const samples = Object.fromEntries(Object.keys(CATEGORIES).map(key => [key, []]));
  const interestingDirs = new Map();
  let scannedFiles = 0;
  let truncated = false;

  function walk(dir, depth) {
    if (truncated || depth > maxDepth) return;

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (truncated) break;
      if (entry.name.startsWith(".") && entry.isDirectory() && entry.name !== ".claude" && entry.name !== ".codex") continue;

      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        walk(full, depth + 1);
        continue;
      }

      if (!entry.isFile()) continue;
      scannedFiles++;
      if (scannedFiles > maxFiles) {
        truncated = true;
        break;
      }

      const category = categoryFor(entry.name);
      if (!category) continue;

      counts[category]++;
      const rel = relative(cwd, full);
      if (samples[category].length < samplesPerCategory) samples[category].push(rel);

      const parent = relative(cwd, path.dirname(full));
      const record = interestingDirs.get(parent) || { total: 0, categories: {} };
      record.total++;
      record.categories[category] = (record.categories[category] || 0) + 1;
      interestingDirs.set(parent, record);
    }
  }

  walk(cwd, 0);

  const directories = [...interestingDirs.entries()]
    .map(([directory, value]) => ({ directory, ...value }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 30);

  return {
    schema_version: 1,
    scanned_at: new Date().toISOString(),
    root: ".",
    limits: { max_depth: maxDepth, max_files: maxFiles },
    scanned_files: Math.min(scannedFiles, maxFiles),
    truncated,
    counts,
    directories,
    samples
  };
}

export function writeDiscovery(cwd = process.cwd(), options = {}) {
  const aurora = path.join(cwd, ".aurora");
  fs.mkdirSync(aurora, { recursive: true });
  const discovery = scanWorkspace(cwd, options);
  const file = path.join(aurora, "discovery.json");
  fs.writeFileSync(file, JSON.stringify(discovery, null, 2) + "\n");
  return { discovery, file };
}

export function readDiscovery(cwd = process.cwd()) {
  const file = path.join(cwd, ".aurora", "discovery.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
