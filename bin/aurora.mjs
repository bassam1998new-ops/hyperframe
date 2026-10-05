#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import {
  appendJsonl,
  checkConfig,
  fileSha256,
  findWorkspace,
  initWorkspace,
  migrateConfig,
  readJson,
  setDotted,
  setMode,
  writeJson
} from '../lib/workspace.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = readJson(path.join(here, '..', 'package.json'));
const args = process.argv.slice(2);
const command = args[0] || 'help';

function out(message = '') { process.stdout.write(`${message}\n`); }
function fail(message, code = 1) { process.stderr.write(`AurorA: ${message}\n`); process.exit(code); }

function help() {
  out(`AurorA Studio ${pkg.version}

Commands:
  aurora init <folder>          Create a Studio workspace
  aurora setup                  Ask the one-time workspace questions
  aurora mode direct|director  Switch working mode
  aurora status                 Show workspace state
  aurora resources              Show enabled resources/providers
  aurora doctor                 Check local production tools
  aurora config check          Check missing config fields
  aurora config migrate        Add new config fields safely
  aurora config set <path> <v> Change one setting
  aurora skills sync           Install AurorA skills into .claude/skills
  aurora finalize <video> --approved [--clean]
                               Save approved final and optionally clean tmp
  aurora clean [--yes]          Preview or clean workspace tmp only
  aurora update --check         Check updater configuration
`);
}

function currentWorkspace() {
  const ws = findWorkspace();
  if (!ws) fail('No AurorA workspace found. Run `aurora init <folder>` first.');
  return ws;
}

async function setupWorkspace(ws) {
  if (!process.stdin.isTTY) fail('`setup` is interactive. Run it in a terminal, or edit PROJECT.md and .aurora/studio.json directly.');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const config = readJson(ws.configPath);
    const name = await rl.question(`Product/service name [${config.product.name || 'TBD'}]: `);
    const type = await rl.question(`What is it? [${config.product.type || 'TBD'}]: `);
    const audience = await rl.question(`Main audience [${config.product.audience || 'TBD'}]: `);
    const website = await rl.question(`Website (optional) [${config.product.website || ''}]: `);
    const local = await rl.question('Important local folders, comma separated (optional): ');
    const browser = await rl.question('Enable experimental browser providers (ChatGPT/Flow/Meta)? [y/N]: ');
    const eleven = await rl.question('Enable ElevenLabs provider? [y/N]: ');

    if (name.trim()) config.product.name = name.trim();
    if (type.trim()) config.product.type = type.trim();
    if (audience.trim()) config.product.audience = audience.trim();
    if (website.trim()) config.product.website = website.trim();
    if (local.trim()) config.resources.local_paths = local.split(',').map(x => x.trim()).filter(Boolean);
    const browserOn = /^y(es)?$/i.test(browser.trim());
    config.resources.providers.chatgpt_browser.enabled = browserOn;
    config.resources.providers.google_flow_browser.enabled = browserOn;
    config.resources.providers.meta_ai_browser.enabled = browserOn;
    config.resources.providers.elevenlabs.enabled = /^y(es)?$/i.test(eleven.trim());
    writeJson(ws.configPath, config);

    const project = `# Project\n\nProduct / service: ${config.product.name || 'TBD'}\nType: ${config.product.type || 'TBD'}\nAudience: ${config.product.audience || 'TBD'}\nWebsite: ${config.product.website || 'TBD'}\n\n## Goal\nMake videos that accurately represent this product/service.\n\n## Non-negotiables\n- Search this workspace before creating new assets.\n- Reuse approved brand facts, style rules and assets.\n- Ask before changing product-level setup.\n`;
    fs.writeFileSync(path.join(ws.root, 'PROJECT.md'), project, 'utf8');
    out('Workspace setup saved.');
  } finally {
    rl.close();
  }
}

function commandExists(cmd, versionArgs = ['--version']) {
  try {
    const stdout = execFileSync(cmd, versionArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 });
    return { found: true, detail: stdout.trim().split('\n')[0] || 'found' };
  } catch (error) {
    return { found: false, detail: error.code === 'ENOENT' ? 'not found' : 'not ready' };
  }
}

function doctor() {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const tools = {
    node: { found: nodeMajor >= 22, detail: process.version },
    hyperframes: commandExists(process.platform === 'win32' ? 'hyperframes.cmd' : 'hyperframes'),
    blender: commandExists(process.platform === 'win32' ? 'blender.exe' : 'blender'),
    afterfx: commandExists(process.platform === 'win32' ? 'afterfx.exe' : 'afterfx'),
    aerender: commandExists(process.platform === 'win32' ? 'aerender.exe' : 'aerender')
  };
  out('AurorA Studio doctor');
  for (const [name, state] of Object.entries(tools)) out(`${state.found ? '✓' : '·'} ${name}: ${state.detail}`);
  out('\nNote: After Effects is optional and proprietary. HyperFrames/Blender may also be installed outside PATH; adapters can be pointed to exact paths later.');
}

function status(ws) {
  const c = ws.config;
  out(`AurorA Studio workspace: ${ws.root}`);
  out(`mode: ${c.mode}`);
  out(`product: ${c.product.name || 'TBD'}`);
  out('tools:');
  for (const [name, value] of Object.entries(c.tools)) out(`  ${value.enabled ? 'on ' : 'off'} ${name}`);
  out('providers:');
  for (const [name, value] of Object.entries(c.resources.providers)) out(`  ${value.enabled ? 'on ' : 'off'} ${name}${value.experimental ? ' (experimental)' : ''}`);
}

function resources(ws) {
  const r = ws.config.resources;
  out('Local folders:');
  if (!r.local_paths.length) out('  none yet'); else r.local_paths.forEach(x => out(`  - ${x}`));
  out('Websites:');
  if (!r.websites.length) out('  none yet'); else r.websites.forEach(x => out(`  - ${x}`));
  out('Providers:');
  for (const [name, value] of Object.entries(r.providers)) out(`  - ${name}: ${value.enabled ? 'enabled' : 'disabled'}${value.experimental ? ' / experimental' : ''}`);
  out('\nCredentials are never stored in workspace Markdown or committed config.');
}

function clean(ws, yes) {
  const tmp = path.join(ws.root, 'tmp');
  const entries = fs.existsSync(tmp) ? fs.readdirSync(tmp) : [];
  if (!entries.length) return out('tmp is already clean.');
  out(`tmp contains ${entries.length} item(s):`);
  entries.forEach(x => out(`  - ${x}`));
  if (!yes) return out('\nDry run only. Re-run with `aurora clean --yes` to delete tmp contents.');
  for (const entry of entries) fs.rmSync(path.join(tmp, entry), { recursive: true, force: true });
  out('tmp cleaned. Source assets, styles, decisions and renders were not touched.');
}

function finalize(ws, source, approved, cleanTmp) {
  if (!approved) fail('Refusing to finalize without `--approved`. Approval is the cleanup gate.');
  if (!source) fail('Pass the approved render path.');
  const input = path.resolve(process.cwd(), source);
  if (!fs.existsSync(input) || !fs.statSync(input).isFile()) fail(`Render not found: ${input}`);
  const targetDir = path.join(ws.root, 'renders', 'final');
  fs.mkdirSync(targetDir, { recursive: true });
  const target = path.join(targetDir, path.basename(input));
  if (path.resolve(target) !== input) fs.copyFileSync(input, target);
  appendJsonl(path.join(ws.root, '.aurora', 'decisions.jsonl'), {
    type: 'finalize',
    at: new Date().toISOString(),
    approved: true,
    file: path.relative(ws.root, target),
    sha256: fileSha256(target),
    mode: ws.config.mode
  });
  out(`Final saved: ${target}`);
  out('Next: the agent should review the session and promote only reusable lessons/styles.');
  if (cleanTmp) clean(ws, true);
}

switch (command) {
  case 'help': case '--help': case '-h': help(); break;
  case '--version': case '-v': out(pkg.version); break;
  case 'init': {
    const folder = args[1] || '.';
    const root = path.resolve(process.cwd(), folder);
    const name = path.basename(root);
    const ws = initWorkspace(root, { name, version: pkg.version });
    out(`AurorA workspace ready: ${ws.root}`);
    out('Next: run `aurora setup`, then open this folder with Claude/Codex/your agent.');
    break;
  }
  case 'setup': await setupWorkspace(currentWorkspace()); break;
  case 'mode': {
    const ws = currentWorkspace();
    const config = setMode(ws.root, args[1]);
    out(`mode: ${config.mode}`);
    break;
  }
  case 'status': status(currentWorkspace()); break;
  case 'resources': resources(currentWorkspace()); break;
  case 'doctor': doctor(); break;
  case 'config': {
    const ws = currentWorkspace();
    if (args[1] === 'check') {
      const result = checkConfig(ws.config, { name: path.basename(ws.root), version: pkg.version });
      if (result.ok) out('Config is current.');
      else { out('Missing config fields:'); result.missing.forEach(x => out(`  - ${x}`)); }
      break;
    }
    if (args[1] === 'migrate') {
      migrateConfig(ws.root, { name: path.basename(ws.root), version: pkg.version });
      out('Config migrated. Existing values were preserved.');
      break;
    }
    if (args[1] !== 'set') fail('Use `aurora config check`, `aurora config migrate`, or `aurora config set <path> <value>`.');
    if (!args[2]) fail('Config path is required.');
    const config = setDotted(ws.root, args[2], args.slice(3).join(' '));
    out(JSON.stringify(config, null, 2));
    break;
  }
  case 'skills': {
    if (args[1] !== 'sync') fail('Current alpha supports: `aurora skills sync [--hyperframes]`.');
    const ws = currentWorkspace();
    const source = path.join(here, '..', 'skills');
    const target = path.join(ws.root, '.claude', 'skills');
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      fs.cpSync(path.join(source, entry.name), path.join(target, entry.name), { recursive: true, force: true });
    }
    out('AurorA skills synced to .claude/skills.');
    if (args.includes('--hyperframes')) {
      try {
        execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['hyperframes', 'skills', 'update'], { cwd: ws.root, stdio: 'inherit', timeout: 120000 });
        out('HyperFrames official skills refreshed.');
      } catch {
        fail('AurorA skills installed, but HyperFrames skill refresh failed. Run `npx hyperframes skills update` manually.');
      }
    }
    break;
  }
  case 'clean': clean(currentWorkspace(), args.includes('--yes')); break;
  case 'finalize': finalize(currentWorkspace(), args[1], args.includes('--approved'), args.includes('--clean')); break;
  case 'update': {
    if (!args.includes('--check')) fail('Updater install is not enabled in alpha yet. Use `aurora update --check`.');
    const ws = findWorkspace();
    const manifest = ws?.config?.updates?.manifest_url;
    if (!manifest) out('Update channel is not published yet. The updater contract is ready, but no release manifest is configured.');
    else out(`Update manifest: ${manifest}`);
    break;
  }
  default: fail(`Unknown command: ${command}. Run \`aurora help\`.`);
}
