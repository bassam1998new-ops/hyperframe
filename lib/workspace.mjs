import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const CONFIG_DIR = '.aurora';
export const CONFIG_FILE = 'studio.json';

export function slugify(input) {
  return String(input || 'workspace')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'workspace';
}

export function workspaceConfigPath(root) {
  return path.join(root, CONFIG_DIR, CONFIG_FILE);
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function defaultConfig({ name, version }) {
  return {
    schema_version: 1,
    studio_version: version,
    workspace_id: slugify(name),
    mode: 'direct',
    product: { name: name || '', type: '', description: '', audience: '', website: '' },
    resources: {
      local_paths: [],
      websites: [],
      providers: {
        chatgpt_browser: { enabled: false, experimental: true },
        google_flow_browser: { enabled: false, experimental: true },
        meta_ai_browser: { enabled: false, experimental: true },
        elevenlabs: { enabled: false, experimental: false }
      }
    },
    tools: {
      hyperframes: { enabled: true, strategy: 'prefer-for-2d-motion' },
      blender: { enabled: true, strategy: 'prefer-for-true-3d' },
      after_effects: { enabled: true, strategy: 'prefer-for-compositing-and-finishing', optional_paid: true },
      openmontage: { enabled: false, strategy: 'external-optional-only', license: 'AGPL-3.0' }
    },
    routing: {
      order: ['hard_rules', 'asset_search', 'experience_search', 'score', 'director_fallback'],
      small_router_enabled: false,
      small_router_model: null
    },
    updates: { check: true, channel: 'stable', manifest_url: null }
  };
}

function writeIfMissing(file, content) {
  if (fs.existsSync(file)) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
  return true;
}

export function initWorkspace(root, { name, version }) {
  fs.mkdirSync(root, { recursive: true });
  for (const rel of ['assets', 'styles', 'renders/final', 'renders/drafts', 'tmp', '.aurora']) {
    fs.mkdirSync(path.join(root, rel), { recursive: true });
  }

  const cfgPath = workspaceConfigPath(root);
  if (!fs.existsSync(cfgPath)) writeJson(cfgPath, defaultConfig({ name, version }));

  writeIfMissing(path.join(root, 'PROJECT.md'), `# Project\n\nProduct / service: TBD\nAudience: TBD\nWhat we are making videos for: TBD\nWebsite: TBD\n\n## Goal\nTBD\n\n## Non-negotiables\n- Keep approved brand facts and assets.\n- Ask before changing the product-level setup.\n`);
  writeIfMissing(path.join(root, 'RESOURCES.md'), `# Resources\n\nAdd only resources the owner explicitly approves.\n\n## Local folders\n- TBD\n\n## Websites / accounts\n- TBD\n\n## Paid / optional providers\n- TBD\n\nNever store passwords, session cookies, API keys, or browser tokens in this file.\n`);
  writeIfMissing(path.join(root, 'STYLE.md'), `# Workspace Style\n\nNo workspace-specific style learned yet.\n\nWhen a render is approved, promote only reusable visual rules here. Do not copy one-off scene details.\n`);
  writeIfMissing(path.join(root, '.aurora', 'decisions.jsonl'), '');
  writeIfMissing(path.join(root, '.aurora', 'lessons.jsonl'), '');
  writeIfMissing(path.join(root, '.aurora', 'asset-index.jsonl'), '');

  return { root, config: readJson(cfgPath) };
}

export function findWorkspace(start = process.cwd()) {
  let current = path.resolve(start);
  while (true) {
    const cfg = workspaceConfigPath(current);
    if (fs.existsSync(cfg)) return { root: current, configPath: cfg, config: readJson(cfg) };
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export function deepMergeDefaults(current, defaults) {
  if (Array.isArray(defaults)) return Array.isArray(current) ? current : defaults;
  if (!defaults || typeof defaults !== 'object') return current === undefined ? defaults : current;
  const result = (current && typeof current === 'object' && !Array.isArray(current)) ? { ...current } : {};
  for (const [key, value] of Object.entries(defaults)) result[key] = deepMergeDefaults(result[key], value);
  return result;
}

export function checkConfig(config, { name = 'workspace', version = '0.0.0' } = {}) {
  const defaults = defaultConfig({ name, version });
  const missing = [];
  function walk(cur, def, prefix = '') {
    if (!def || typeof def !== 'object' || Array.isArray(def)) return;
    for (const [key, value] of Object.entries(def)) {
      const next = prefix ? `${prefix}.${key}` : key;
      if (!cur || !Object.prototype.hasOwnProperty.call(cur, key)) missing.push(next);
      else walk(cur[key], value, next);
    }
  }
  walk(config, defaults);
  return { ok: missing.length === 0, missing };
}

export function migrateConfig(root, { name, version }) {
  const file = workspaceConfigPath(root);
  const current = readJson(file);
  const merged = deepMergeDefaults(current, defaultConfig({ name, version }));
  merged.schema_version = 1;
  merged.studio_version = version;
  writeJson(file, merged);
  return merged;
}

export function setMode(root, mode) {
  if (!['direct', 'director'].includes(mode)) throw new Error('Mode must be direct or director.');
  const file = workspaceConfigPath(root);
  const config = readJson(file);
  config.mode = mode;
  writeJson(file, config);
  return config;
}

export function setDotted(root, dottedPath, rawValue) {
  const file = workspaceConfigPath(root);
  const config = readJson(file);
  const keys = dottedPath.split('.').filter(Boolean);
  if (!keys.length) throw new Error('Config path is required.');
  let cursor = config;
  for (const key of keys.slice(0, -1)) {
    if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
    cursor = cursor[key];
  }
  let value = rawValue;
  if (rawValue === 'true') value = true;
  else if (rawValue === 'false') value = false;
  else if (rawValue === 'null') value = null;
  else if (rawValue !== '' && Number.isFinite(Number(rawValue))) value = Number(rawValue);
  cursor[keys.at(-1)] = value;
  writeJson(file, config);
  return config;
}

export function appendJsonl(file, record) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(record)}\n`, 'utf8');
}

export function fileSha256(file) {
  const h = createHash('sha256');
  h.update(fs.readFileSync(file));
  return h.digest('hex');
}
