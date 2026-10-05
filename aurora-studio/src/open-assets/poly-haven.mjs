import fs from "node:fs";
import path from "node:path";

const API = "https://api.polyhaven.com";
const USER_AGENT = "AurorA-Studio/0.2 (+https://github.com/bassam1998new-ops/hyperframe)";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const TYPE_NAME = {
  0: "hdri",
  1: "texture",
  2: "model"
};

const VALID_TYPES = new Set(["all", "hdris", "textures", "models"]);

function cacheFile(cwd, type) {
  return path.join(cwd, ".aurora", "cache", "poly-haven", `assets-${type}.json`);
}

function readCache(cwd, type) {
  const file = cacheFile(cwd, type);
  if (!fs.existsSync(file)) return null;
  try {
    const value = JSON.parse(fs.readFileSync(file, "utf8"));
    return { file, ...value };
  } catch {
    return null;
  }
}

function writeCache(cwd, type, data) {
  const file = cacheFile(cwd, type);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const payload = {
    fetched_at: new Date().toISOString(),
    data
  };
  fs.writeFileSync(file, JSON.stringify(payload) + "\n");
  return file;
}

function isFresh(cache, now = Date.now()) {
  if (!cache?.fetched_at) return false;
  const stamp = Date.parse(cache.fetched_at);
  return Number.isFinite(stamp) && now - stamp < CACHE_TTL_MS;
}

function tokens(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function assetText(asset) {
  return [
    asset.name,
    asset.description,
    asset.category,
    ...(asset.tags || []),
    ...Object.values(asset.attributes || {}).flatMap(value => Array.isArray(value) ? value : [value])
  ].filter(Boolean).join(" ").toLowerCase();
}

function score(queryTokens, id, asset) {
  const text = assetText(asset);
  const name = String(asset.name || "").toLowerCase();
  const tags = (asset.tags || []).map(tag => String(tag).toLowerCase());
  let result = 0;

  for (const token of queryTokens) {
    if (name.includes(token)) result += 8;
    if (tags.some(tag => tag.includes(token))) result += 6;
    if (String(asset.category || "").toLowerCase().includes(token)) result += 4;
    if (text.includes(token)) result += 2;
    if (String(id).toLowerCase().includes(token)) result += 3;
  }

  if (asset.donated) result += 0.25;
  if (asset.lods) result += 0.25;
  return result;
}

async function fetchAssets(type, {
  cwd = process.cwd(),
  fetchImpl = globalThis.fetch,
  forceRefresh = false
} = {}) {
  if (!VALID_TYPES.has(type)) throw new Error("Poly Haven type must be all, hdris, textures, or models.");
  if (typeof fetchImpl !== "function") throw new Error("This Node runtime does not provide fetch.");

  const cached = readCache(cwd, type);
  if (!forceRefresh && isFresh(cached)) {
    return { data: cached.data, cached: true, stale: false };
  }

  const url = new URL(API + "/assets");
  url.searchParams.set("type", type);

  try {
    const response = await fetchImpl(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json"
      }
    });

    if (!response.ok) throw new Error(`Poly Haven API returned HTTP ${response.status}`);
    const data = await response.json();
    writeCache(cwd, type, data);
    return { data, cached: false, stale: false };
  } catch (error) {
    if (cached?.data) {
      return {
        data: cached.data,
        cached: true,
        stale: true,
        warning: `Live Poly Haven API failed; using cached data: ${error.message}`
      };
    }
    throw error;
  }
}

export async function searchPolyHaven(query, options = {}) {
  const type = options.type || "all";
  const limit = Math.max(1, Math.min(50, Number(options.limit || 10)));
  const queryTokens = tokens(query);
  const result = await fetchAssets(type, options);

  const matches = Object.entries(result.data || {})
    .map(([id, asset]) => ({
      id,
      name: asset.name || id,
      description: asset.description || "",
      asset_type: TYPE_NAME[asset.type] || "unknown",
      category: asset.category || "",
      tags: asset.tags || [],
      thumbnail_url: asset.thumbnail_url || null,
      max_resolution: asset.max_resolution || null,
      polycount: asset.polycount || null,
      dimensions: asset.dimensions || null,
      lods: Boolean(asset.lods),
      search_score: queryTokens.length ? score(queryTokens, id, asset) : 0,
      source: {
        id: "poly-haven",
        name: "Poly Haven",
        asset_url: `https://polyhaven.com/a/${id}`,
        api_credit_required: true
      },
      license: {
        id: "CC0-1.0",
        commercial_allowed: true,
        redistribution_allowed: true,
        attribution_required: false
      }
    }))
    .filter(item => queryTokens.length === 0 || item.search_score > 0)
    .sort((a, b) => b.search_score - a.search_score)
    .slice(0, limit);

  return {
    provider: "Poly Haven",
    provider_credit_required_for_live_api: true,
    query,
    type,
    cached: result.cached,
    stale: result.stale,
    warning: result.warning || null,
    results: matches
  };
}

export async function getPolyHavenFiles(assetId, {
  fetchImpl = globalThis.fetch
} = {}) {
  if (!assetId) throw new Error("Poly Haven asset id is required.");
  if (typeof fetchImpl !== "function") throw new Error("This Node runtime does not provide fetch.");

  const response = await fetchImpl(`${API}/files/${encodeURIComponent(assetId)}`, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json"
    }
  });

  if (!response.ok) throw new Error(`Poly Haven API returned HTTP ${response.status}`);

  return {
    provider: "Poly Haven",
    asset_id: assetId,
    license: "CC0-1.0",
    api_credit_required: true,
    files: await response.json()
  };
}
