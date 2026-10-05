import fs from "node:fs";
import path from "node:path";
import { upsertLibraryItem } from "../library.mjs";

function parseArray(value) {
  const v = String(value || "").trim();
  if (!v.startsWith("[") || !v.endsWith("]")) return [];
  return v.slice(1, -1)
    .split(",")
    .map(x => x.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end < 0) return {};
  const lines = text.slice(3, end).split("\n");
  const result = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const split = line.indexOf(":");
    if (split < 0) continue;
    const key = line.slice(0, split).trim();
    const rawValue = line.slice(split + 1).trim();
    result[key] = rawValue.startsWith("[")
      ? parseArray(rawValue)
      : rawValue.replace(/^["']|["']$/g, "");
  }
  return result;
}

function firstTone(text) {
  const tone = text.match(/\*\*Tone[^:]*:\*\*\s*([^\n]+)/i);
  if (tone) return tone[1].trim();
  const heading = text.split("\n").find(line => line.trim() && !line.startsWith("---") && !line.startsWith("#"));
  return heading?.trim() || "";
}

function candidateRoots(start) {
  const roots = [];
  let current = path.resolve(start);
  for (let i = 0; i < 5; i++) {
    roots.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return roots;
}

export function findHyperframeLibraryRoot(start = process.cwd()) {
  for (const root of candidateRoots(start)) {
    const styles = path.join(root, "video-projects", "_library", "styles");
    if (fs.existsSync(styles)) return root;
  }
  return null;
}

export function importHyperframeLibrary({ root = null, cwd = process.cwd() } = {}) {
  const sourceRoot = root ? path.resolve(root) : findHyperframeLibraryRoot(cwd);
  if (!sourceRoot) throw new Error("HyperFrames library not found. Pass --root PATH.");

  const styleRoot = path.join(sourceRoot, "video-projects", "_library", "styles");
  const kitsRoot = path.join(sourceRoot, "video-projects", "_library", "assets", "kits");
  const imported = { styles: 0, kits: 0, created: 0, updated: 0 };

  if (fs.existsSync(styleRoot)) {
    for (const entry of fs.readdirSync(styleRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
      const styleFile = path.join(styleRoot, entry.name, "style.md");
      if (!fs.existsSync(styleFile)) continue;

      const text = fs.readFileSync(styleFile, "utf8");
      const fm = parseFrontmatter(text);
      const styleId = fm.id || entry.name;
      const tags = [
        styleId,
        ...(Array.isArray(fm.use_when) ? fm.use_when : []),
        ...(Array.isArray(fm.modes) ? fm.modes : [])
      ];

      const result = upsertLibraryItem({
        id: `hyperframe-style-${styleId}`,
        kind: "style",
        name: fm.name || styleId,
        description: firstTone(text),
        type: "hyperframe-style",
        path: path.relative(cwd, styleFile),
        source_name: "HyperFrames local style library",
        license_id: "project-managed",
        tags,
        tools: ["hyperframe"],
        approved: String(fm.status || "").toLowerCase() === "approved",
        quality_tier: "reusable"
      }, cwd);

      imported.styles++;
      imported[result.created ? "created" : "updated"]++;
    }
  }

  if (fs.existsSync(kitsRoot)) {
    for (const entry of fs.readdirSync(kitsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
      const kitPath = path.join(kitsRoot, entry.name);
      const result = upsertLibraryItem({
        id: `hyperframe-kit-${entry.name}`,
        kind: "template",
        name: `${entry.name} kit`,
        description: "Reusable HyperFrames local asset kit",
        type: "hyperframe-kit",
        path: path.relative(cwd, kitPath),
        source_name: "HyperFrames local kit library",
        license_id: "project-managed",
        tags: [entry.name, "kit", "hyperframe"],
        tools: ["hyperframe"],
        approved: true,
        quality_tier: "reusable"
      }, cwd);

      imported.kits++;
      imported[result.created ? "created" : "updated"]++;
    }
  }

  return {
    source_root: sourceRoot,
    ...imported
  };
}
