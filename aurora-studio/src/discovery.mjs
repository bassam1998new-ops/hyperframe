import fs from "node:fs";
import path from "node:path";

const IGNORE_DIRS = new Set([
  ".git", ".aurora", "node_modules", ".next", "dist", "build", "coverage",
  ".cache", ".turbo", ".vercel", "__pycache__", ".venv", "venv", "renders"
]);

const EXTENSIONS = {
  video: new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"]),
  image: new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif", ".exr", ".hdr"]),
  audio: new Set([".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg"]),
  three_d: new Set([".blend", ".glb", ".gltf", ".fbx", ".obj", ".usd", ".usdz", ".abc"]),
  after_effects: new Set([".aep", ".aet", ".mogrt", ".jsx", ".jsxbin"]),
  design: new Set([".ai", ".psd"]),
  font: new Set([".ttf", ".otf", ".woff", ".woff2"]),
  document: new Set([".md", ".txt", ".pdf", ".doc", ".docx", ".json", ".yaml", ".yml"]),
  web_motion: new Set([".html", ".css", ".js", ".mjs", ".ts", ".tsx"])
};

const SENSITIVE_NAME = /(secret|credential|password|token|private[-_ ]?key|api[-_ ]?key)/i;

function classify(file) {
  const ext = path.extname(file).toLowerCase();
  const kinds = [];
  for (const [kind, extensions] of Object.entries(EXTENSIONS)) {
    if (extensions.has(ext)) kinds.push(kind);
  }

  const lower = path.basename(file).toLowerCase();
  if (/(logo|brand|guideline|identity|style|palette|font)/.test(lower)) kinds.push("brand");
  if (/(readme|about|product|brief|positioning|audience|offer|persona)/.test(lower)) kinds.push("context");

  return [...new Set(kinds)];
}

function relative(cwd, file) {
  const value = path.relative(cwd, file);
  return value || ".";
}

export function discoverWorkspace(cwd = process.cwd(), options = {}) {
  const root = path.resolve(cwd);
  const maxDepth = Math.max(1, Math.min(8, Number(options.maxDepth ?? 5)));
  const maxFiles = Math.max(100, Math.min(50000, Number(options.maxFiles ?? 5000)));
  const samplesPerKind = Math.max(1, Math.min(100, Number(options.samplesPerKind ?? 30)));

  const files = [];
  const byKind = {};
  const samples = {};
  const directories = new Map();
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

      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        if (entry.name.startsWith(".") && entry.name !== ".claude" && entry.name !== ".codex") continue;
        walk(full, depth + 1);
        continue;
      }

      if (!entry.isFile()) continue;
      scannedFiles++;
      if (scannedFiles > maxFiles) {
        truncated = true;
        break;
      }

      if (SENSITIVE_NAME.test(entry.name)) continue;

      const kinds = classify(full);
      if (!kinds.length) continue;

      let sizeBytes = null;
      try { sizeBytes = fs.statSync(full).size; } catch {}

      const rel = relative(root, full);
      const item = {
        path: rel,
        kinds,
        extension: path.extname(full).toLowerCase(),
        size_bytes: sizeBytes
      };
      files.push(item);

      const parent = relative(root, path.dirname(full));
      const dirRecord = directories.get(parent) || { total: 0, kinds: {} };
      dirRecord.total++;

      for (const kind of kinds) {
        byKind[kind] ||= [];
        byKind[kind].push(rel);

        samples[kind] ||= [];
        if (samples[kind].length < samplesPerKind) samples[kind].push(rel);

        dirRecord.kinds[kind] = (dirRecord.kinds[kind] || 0) + 1;
      }
      directories.set(parent, dirRecord);
    }
  }

  walk(root, 0);

  const directorySummary = [...directories.entries()]
    .map(([directory, value]) => ({ directory, ...value }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 30);

  const countKeys = [...Object.keys(EXTENSIONS), "brand", "context"];
  const counts = Object.fromEntries(
    countKeys.map(kind => [kind, Array.isArray(byKind[kind]) ? byKind[kind].length : 0])
  );

  return {
    schema_version: 1,
    root: ".",
    generated_at: new Date().toISOString(),
    scanned_at: new Date().toISOString(),
    limits: { max_depth: maxDepth, max_files: maxFiles },
    scanned_files: Math.min(scannedFiles, maxFiles),
    matched_files: files.length,
    truncated,
    counts,
    by_kind: byKind,
    directories: directorySummary,
    samples,
    files
  };
}

export const scanWorkspace = discoverWorkspace;

export function saveDiscovery(cwd = process.cwd(), options = {}) {
  const result = discoverWorkspace(cwd, options);
  const aurora = path.join(cwd, ".aurora");
  fs.mkdirSync(aurora, { recursive: true });
  const file = path.join(aurora, "discovery.json");
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + "\n");
  return { result, file };
}

export function writeDiscovery(cwd = process.cwd(), options = {}) {
  const saved = saveDiscovery(cwd, options);
  return { discovery: saved.result, file: saved.file };
}

export function readDiscovery(cwd = process.cwd()) {
  const file = path.join(cwd, ".aurora", "discovery.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
