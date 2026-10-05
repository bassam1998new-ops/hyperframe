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
  assert.equal(findWorkspace(path.join(root, 'tmp')).root, root);
  setMode(root, 'director');
  assert.equal(findWorkspace(root).config.mode, 'director');
  fs.rmSync(root, { recursive: true, force: true });
});
