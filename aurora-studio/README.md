# AurorA Studio

AurorA Studio is an agent-first creative workspace built around knowledge, reusable assets and tool routing.

It does **not** require every creative tool.

Core idea:
- understand the reference
- understand the current product/project
- search what we already have
- decide reuse / modify / build
- choose the best available tool path
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
- **After Effects** — optional proprietary finishing/VFX engine
- **OpenMontage** — optional external adapter / architecture reference; not copied into the permissive core

Missing optional tools are not errors. The setup process records what is available and routing ignores unavailable tools.

## Current foundation commands

From this folder:

```bash
node ./bin/aurora-studio.mjs setup
node ./bin/aurora-studio.mjs doctor
node ./bin/aurora-studio.mjs tools
node ./bin/aurora-studio.mjs mode direct
node ./bin/aurora-studio.mjs mode director
node ./bin/aurora-studio.mjs workspace
node ./bin/aurora-studio.mjs route "3d avatar with cinematic lighting"
```

The package is intentionally private during foundation work. Before the public release we will choose the final npm scope/name and enable the one-line install.

## Workspace

`setup` creates:

```text
.aurora/
  workspace.json
  decisions.jsonl
  lessons.jsonl
  styles/
  library/
  temp/
```

Do not store passwords, cookies or API secrets there.

## Community install target

The release goal is a simple flow like:

```bash
npx <final-package>@latest setup
```

Then the user can paste the agent bootstrap prompt into Claude Code, Codex or another coding agent.

## UI

UI/UX is intentionally later. The file contracts and agent behavior must be stable first.

The planned updater should be simple like Hermes:
- current version
- update available
- short New / Fixed list
- Update now
- Maybe later
- safe migration / rollback information when needed
