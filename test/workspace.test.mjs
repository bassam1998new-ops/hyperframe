import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { defaultConfig, findWorkspace, initWorkspace, setMode } from '../lib/workspace.mjs';

test('default config uses direct mode and keeps small router off', () => {
  const c = defaultConfig({ name: 'Demo Brand', version: '0.1.0' });
  assert.equal(c.mode, 'direct');
  assert.equal(c.routing.small_router_enabled, false);
  assert.equal(c.tools.hyperframes.enabled, true);
  assert.equal(c.tools.openmontage.enabled, false);
});

test('init creates reusable workspace state', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aurora-test-'));
  initWorkspace(root, { name: 'Demo', version: '0.1.0' });
  assert.equal(fs.existsSync(path.join(root, '.aurora', 'studio.json')), true);
  assert.equal(fs.existsSync(path.join(root, 'PROJECT.md')), true);
  assert.equal(fs.existsSync(path.join(root, 'tmp')), true);
  assert.equal(findWorkspace(path.join(root, 'tmp')).root, root);
  setMode(root, 'director');
  assert.equal(findWorkspace(root).config.mode, 'director');
  fs.rmSync(root, { recursive: true, force: true });
});

test('config check and migrate preserve user choices', async () => {
  const { checkConfig, migrateConfig, readJson, writeJson } = await import('../lib/workspace.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aurora-migrate-'));
  initWorkspace(root, { name: 'Demo', version: '0.1.0' });
  const file = path.join(root, '.aurora', 'studio.json');
  const config = readJson(file);
  delete config.updates;
  config.mode = 'director';
  writeJson(file, config);
  assert.equal(checkConfig(config, { name: 'Demo', version: '0.1.0' }).ok, false);
  const migrated = migrateConfig(root, { name: 'Demo', version: '0.1.1' });
  assert.equal(migrated.mode, 'director');
  assert.equal(migrated.updates.channel, 'stable');
  assert.equal(migrated.studio_version, '0.1.1');
  fs.rmSync(root, { recursive: true, force: true });
});
