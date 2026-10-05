import fs from "node:fs";
import path from "node:path";

const IGNORE_DIRS = new Set([
  ".git",
  ".aurora",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".cache",
  "coverage",
  "renders"
]);

const EXTENSIONS = {
  image: new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif", ".exr", ".hdr"]),
  video: new Set([".mp4", ".mov", ".mkv", ".webm", ".avi"]),
  audio: new Set([".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg"]),
  font: new Set([".ttf", ".otf", ".woff", ".woff2"]),
  three_d: new Set([".blend", ".glb", ".gltf", ".fbx", ".obj", ".usd", ".usdz"]),
  after_effects: new Set([".aep", ".aet", ".jsx", ".jsxbin"]),
  document: new Set([".md", ".txt", ".pdf", ".doc", ".docx"]),
  web_motion: new Set([".html", ".css", ".js", ".mjs", ".ts", ".tsx"])
};

function classify(file) {
  const ext = path.extname(file).toLowerCase();
  const result = [];
  for (const [kind, extensions] of Object.entries(EXTENSIONS)) {
    if (extensions.has(ext)) result.push(kind);
  }
  const lower = path.basename(file).toLowerCase();
  if (/(logo|brand|guideline|identity|style)/.test(lower)) result.push("brand");
  if (/(readme|about|product|brief|positioning)/.test(lower)) result.push("context");
  return [...new Set(result)];
}

export function discoverWorkspace(cwd = process.cwd(), {
  maxFiles = 5000,
  maxDepth = 6
} = {}) {
  const root = path.resolve(cwd);
  const files = [];
  let scanned = 0;
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
      if (entry.isDirectory() && IGNORE_DIRS.has(entry.name)) continue;

      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;

      scanned++;
      if (scanned > maxFiles) {
        truncated = true;
        break;
      }

      const kinds = classify(full);
      if (!kinds.length) continue;

      let size = null;
      try { size = fs.statSync(full).size; } catch {}

      files.push({
        path: path.relative(root, full),
        kinds,
        extension: path.extname(full).toLowerCase(),
        size_bytes: size
      });
    }
  }

  walk(root, 0);

  const byKind = {};
  for (const file of files) {
    for (const kind of file.kinds) {
      byKind[kind] ||= [];
      byKind[kind].push(file.path);
    }
  }

  return {
    schema_version: 1,
    root,
    generated_at: new Date().toISOString(),
    scanned_files: Math.min(scanned, maxFiles),
    matched_files: files.length,
    truncated,
    by_kind: byKind,
    files
  };
}

export function saveDiscovery(cwd = process.cwd(), options = {}) {
  const result = discoverWorkspace(cwd, options);
  const aurora = path.join(cwd, ".aurora");
  fs.mkdirSync(aurora, { recursive: true });
  const file = path.join(aurora, "discovery.json");
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + "\n");
  return { result, file };
}
