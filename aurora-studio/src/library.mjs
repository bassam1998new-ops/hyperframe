import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function auroraDir(cwd = process.cwd()) {
  return path.join(cwd, ".aurora");
}

function libraryDir(cwd = process.cwd()) {
  return path.join(auroraDir(cwd), "library");
}

function indexFile(cwd = process.cwd()) {
  return path.join(libraryDir(cwd), "index.jsonl");
}

function ensureIndex(cwd = process.cwd()) {
  fs.mkdirSync(libraryDir(cwd), { recursive: true });
  const file = indexFile(cwd);
  if (!fs.existsSync(file)) fs.writeFileSync(file, "");
  return file;
}

function tokens(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function safeId(prefix, value) {
  const base = String(value || prefix)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36) || prefix;
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
}

export function readLibrary(cwd = process.cwd()) {
  const file = ensureIndex(cwd);
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return [];
  return raw.split("\n").filter(Boolean).map((line, i) => {
    try {
      return JSON.parse(line);
    } catch {
      return { id: `invalid-${i + 1}`, invalid: true, raw: line };
    }
  }).filter(x => !x.invalid);
}

export function addLibraryItem(input, cwd = process.cwd()) {
  const file = ensureIndex(cwd);
  const now = new Date().toISOString();
  const item = {
    schema_version: 1,
    id: input.id || safeId(input.kind || "asset", input.name),
    kind: input.kind || "asset",
    name: String(input.name || "").trim(),
    description: String(input.description || "").trim(),
    type: String(input.type || "other").trim(),
    path: input.path ? path.normalize(String(input.path)) : null,
    source_url: input.source_url || null,
    source_name: input.source_name || null,
    license: {
      id: input.license_id || "unknown",
      commercial_allowed: input.commercial_allowed ?? null,
      redistribution_allowed: input.redistribution_allowed ?? null,
      attribution_required: input.attribution_required ?? null
    },
    tags: unique(Array.isArray(input.tags) ? input.tags : []),
    tools: unique(Array.isArray(input.tools) ? input.tools : []),
    approved: Boolean(input.approved),
    quality_tier: input.quality_tier || "unknown",
    created_at: now,
    updated_at: now
  };

  if (!item.name) throw new Error("Library item requires a name.");
  if (!item.path && !item.source_url) throw new Error("Library item requires a local path or source URL.");

  const existing = readLibrary(cwd);
  if (existing.some(x => x.id === item.id)) throw new Error(`Library item id already exists: ${item.id}`);

  fs.appendFileSync(file, JSON.stringify(item) + "\n");
  return item;
}

function textScore(queryTokens, text, weight) {
  const haystack = new Set(tokens(text));
  let score = 0;
  for (const token of queryTokens) {
    if (haystack.has(token)) score += weight;
  }
  return score;
}

export function searchLibrary(query, options = {}, cwd = process.cwd()) {
  const q = String(query || "").trim();
  const qTokens = tokens(q);
  const items = readLibrary(cwd);
  const limit = Math.max(1, Math.min(50, Number(options.limit || 10)));

  const scored = items
    .filter(item => !options.kind || item.kind === options.kind)
    .filter(item => !options.approved_only || item.approved)
    .map(item => {
      let score = 0;
      score += textScore(qTokens, item.name, 6);
      score += textScore(qTokens, item.tags.join(" "), 5);
      score += textScore(qTokens, item.type, 4);
      score += textScore(qTokens, item.description, 3);
      score += textScore(qTokens, item.tools.join(" "), 2);
      score += textScore(qTokens, item.source_name, 1);

      const normalizedQuery = q.toLowerCase();
      if (normalizedQuery && item.name.toLowerCase().includes(normalizedQuery)) score += 8;
      if (item.approved) score += 1;

      return { ...item, search_score: score };
    })
    .filter(item => qTokens.length === 0 || item.search_score > 0)
    .sort((a, b) => b.search_score - a.search_score || Number(b.approved) - Number(a.approved))
    .slice(0, limit);

  return scored;
}

export function summarizeLibrary(cwd = process.cwd()) {
  const items = readLibrary(cwd);
  const counts = {};
  for (const item of items) counts[item.kind] = (counts[item.kind] || 0) + 1;
  return {
    total: items.length,
    approved: items.filter(x => x.approved).length,
    by_kind: counts
  };
}


export function upsertLibraryItem(input, cwd = process.cwd()) {
  const file = ensureIndex(cwd);
  const items = readLibrary(cwd);
  const now = new Date().toISOString();

  if (!input.id) throw new Error("Upsert requires a stable item id.");

  const existingIndex = items.findIndex(x => x.id === input.id);
  const existing = existingIndex >= 0 ? items[existingIndex] : null;

  const merged = {
    schema_version: 1,
    id: input.id,
    kind: input.kind || existing?.kind || "asset",
    name: String(input.name ?? existing?.name ?? "").trim(),
    description: String(input.description ?? existing?.description ?? "").trim(),
    type: String(input.type ?? existing?.type ?? "other").trim(),
    path: input.path !== undefined ? (input.path ? path.normalize(String(input.path)) : null) : existing?.path ?? null,
    source_url: input.source_url !== undefined ? input.source_url : existing?.source_url ?? null,
    source_name: input.source_name !== undefined ? input.source_name : existing?.source_name ?? null,
    license: {
      id: input.license_id ?? existing?.license?.id ?? "unknown",
      commercial_allowed: input.commercial_allowed !== undefined ? input.commercial_allowed : existing?.license?.commercial_allowed ?? null,
      redistribution_allowed: input.redistribution_allowed !== undefined ? input.redistribution_allowed : existing?.license?.redistribution_allowed ?? null,
      attribution_required: input.attribution_required !== undefined ? input.attribution_required : existing?.license?.attribution_required ?? null
    },
    tags: unique(Array.isArray(input.tags) ? input.tags : existing?.tags || []),
    tools: unique(Array.isArray(input.tools) ? input.tools : existing?.tools || []),
    approved: input.approved !== undefined ? Boolean(input.approved) : Boolean(existing?.approved),
    quality_tier: input.quality_tier ?? existing?.quality_tier ?? "unknown",
    created_at: existing?.created_at || now,
    updated_at: now
  };

  if (!merged.name) throw new Error("Library item requires a name.");
  if (!merged.path && !merged.source_url) throw new Error("Library item requires a local path or source URL.");

  if (existingIndex >= 0) items[existingIndex] = merged;
  else items.push(merged);

  fs.writeFileSync(file, items.map(item => JSON.stringify(item)).join("\n") + (items.length ? "\n" : ""));
  return { item: merged, created: existingIndex < 0 };
}


export function removeLibraryItem(id, cwd = process.cwd()) {
  const file = ensureIndex(cwd);
  const items = readLibrary(cwd);
  const index = items.findIndex(item => item.id === id);

  if (index < 0) throw new Error(`Library item not found: ${id}`);

  const [removed] = items.splice(index, 1);
  fs.writeFileSync(
    file,
    items.map(item => JSON.stringify(item)).join("\n") +
      (items.length ? "\n" : "")
  );

  return {
    removed,
    source_file_deleted: false
  };
}

export function updateLibraryItem(
  id,
  changes = {},
  cwd = process.cwd()
) {
  const existing = readLibrary(cwd).find(item => item.id === id);
  if (!existing) throw new Error(`Library item not found: ${id}`);

  const safe = {};
  for (const key of [
    "name",
    "description",
    "tags",
    "tools",
    "approved",
    "quality_tier"
  ]) {
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      safe[key] = changes[key];
    }
  }

  return upsertLibraryItem({
    id,
    ...safe
  }, cwd);
}
