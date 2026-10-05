# AurorA Studio

AurorA Studio is an agent-first creative workspace built around knowledge, reusable assets and smart tool routing.

Core idea:
- understand the reference
- understand the current product/project
- search what we already have
- decide reuse / modify / build
- choose the best available production path
- build and review
- save only useful learning after approval

## Modes

### Direct
Fast. The agent chooses the production path and works with minimum checkpoints.

### Director
Controlled. The agent deconstructs the reference, proposes concepts, gets a direction selected, then builds through clear stages.

## Production tools
- **HyperFrames** — primary programmable 2D/motion engine
- **Blender** — optional 3D engine
- **After Effects** — optional finishing/VFX engine

## Knowledge UI
- **Obsidian** — optional UI over the same Markdown/JSON brain. AurorA works without it.

Missing optional tools are not errors. Setup records what exists and routing ignores unavailable tools.

## Current foundation commands

```bash
node ./bin/aurora-studio.mjs setup
node ./bin/aurora-studio.mjs doctor
node ./bin/aurora-studio.mjs tools
node ./bin/aurora-studio.mjs mode direct
node ./bin/aurora-studio.mjs mode director
node ./bin/aurora-studio.mjs workspace
node ./bin/aurora-studio.mjs route "3d avatar with cinematic lighting"
node ./bin/aurora-studio.mjs plan "make this reference for my product"
node ./bin/aurora-studio.mjs mood create <run-id>
node ./bin/aurora-studio.mjs mood validate <run-id>
node ./bin/aurora-studio.mjs routing <run-id>
node ./bin/aurora-studio.mjs status <run-id>
node ./bin/aurora-studio.mjs review ./final.mp4
node ./bin/aurora-studio.mjs finalize <run-id> --lesson "short reusable lesson"
```

The package remains private during foundation work. Before public release we will choose the final npm name/scope and enable the one-line install.

## Workspace

`setup` creates:

```text
.aurora/
  system/          # managed AurorA skills/knowledge; safe to refresh
  workspace.json
  project.json
  discovery.json
  decisions.jsonl
  lessons.jsonl
  styles/
  library/
  temp/
```

Do not store passwords, cookies or API secrets there.

## Hooks
AurorA starts with only three:
- preflight
- post-approval
- post-update

More hooks are added only when they prove useful.

## Community install target

```bash
npx <final-package>@latest setup
```

Then paste the bundled agent bootstrap prompt into Claude Code, Codex or another compatible coding agent.

## UI
UI/UX comes later. The file contracts and agent behavior must be stable first.

The planned updater should stay simple:
- current version
- update available
- short New / Fixed list
- Update now
- Maybe later
- safe migration/rollback information when needed


## Reliability layer

AurorA keeps the user experience simple, but internally each production can have:
- a scored production path chosen after context/mood/assets
- resumable checkpoints
- owner gates where needed
- paid-action budget checks
- pre-render review
- post-render technical + creative review
- approved-only final learning

These are internal guardrails, not extra modes the user has to learn.


## Updates

AurorA separates **checking** from **applying** updates.

Current safe commands:

```bash
aurora-studio update check
aurora-studio update plan
aurora-studio update backup
```

- `check` reads release metadata only.
- `plan` checks whether the local workspace schema needs migration.
- `backup` copies AurorA source-of-truth state before any future migration.
- AurorA does **not** download or execute remote update code.
- `update apply` will be added only after the public npm package name and migration path are locked.

This keeps the future updater simple without making it a supply-chain risk.


### System vs user memory

`.aurora/system/` is generated from the installed AurorA Studio package and can be refreshed safely.

Do **not** store project-specific memory there.

Project/user-owned state lives outside it:
- `.aurora/project.json`
- `.aurora/library/`
- `.aurora/references/`
- `.aurora/runs/`
- lessons/decisions

Useful commands:

```bash
aurora-studio system status
aurora-studio system sync
```

Preflight automatically refreshes the managed system snapshot when the installed AurorA version changes.


### HyperFrames core

AurorA can use HyperFrames from:
1. `.aurora/tools/` — preferred isolated workspace install
2. the current project's `node_modules/.bin`
3. PATH / an existing user-managed install

If HyperFrames is missing, setup can install a compatible core privately without touching the user's app dependencies.

```bash
aurora-studio hyperframe doctor
aurora-studio hyperframe install
aurora-studio hyperframe upgrade-check
```

Upgrades are checked separately and are never applied silently mid-project.
