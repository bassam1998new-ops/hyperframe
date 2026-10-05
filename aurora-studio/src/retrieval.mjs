import fs from "node:fs";
import path from "node:path";
import { readProject, readReference } from "./brain.mjs";
import { searchLibrary } from "./library.mjs";
import { availableProviders } from "./providers.mjs";

function tokens(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return [];
  return raw.split("\n").filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

function scoreObject(queryTokens, item) {
  const haystack = new Set(tokens(JSON.stringify(item)));
  let score = 0;
  for (const token of queryTokens) {
    if (haystack.has(token)) score += 1;
  }
  return score;
}

function searchJsonl(file, query, limit = 5) {
  const qTokens = tokens(query);
  return readJsonl(file)
    .map(item => ({ item, score: scoreObject(qTokens, item) }))
    .filter(result => qTokens.length === 0 || result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => ({ ...result.item, retrieval_score: result.score }));
}

export function retrieveContext({
  query,
  referenceId = null,
  cwd = process.cwd(),
  libraryLimit = 8,
  memoryLimit = 5
} = {}) {
  const project = readProject(cwd);
  let reference = null;

  if (referenceId) {
    reference = readReference(referenceId, cwd).reference;
  }

  const assetTerms = reference?.analysis?.asset_search_terms || [];
  const searchQuery = [query, ...assetTerms].filter(Boolean).join(" ").trim();

  const library = searchLibrary(searchQuery, {
    limit: libraryLimit,
    approved_only: true
  }, cwd);

  const aurora = path.join(cwd, ".aurora");
  const lessons = searchJsonl(path.join(aurora, "lessons.jsonl"), searchQuery, memoryLimit);
  const decisions = searchJsonl(path.join(aurora, "decisions.jsonl"), searchQuery, memoryLimit);

  const styleMatches = library.filter(item => item.kind === "style");
  const assetMatches = library.filter(item => item.kind !== "style");

  return {
    schema_version: 1,
    query: query || "",
    search_query: searchQuery,
    project,
    reference,
    reusable: {
      styles: styleMatches,
      assets: assetMatches
    },
    experience: {
      lessons,
      decisions
    },
    resources: availableProviders(cwd),
    retrieval: {
      method: "structured_text_v1",
      embeddings_used: false
    }
  };
}
