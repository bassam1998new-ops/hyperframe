# AurorA Studio

AurorA Studio is a community-focused, agent-first video studio. Give Claude, Codex or another coding agent a workspace, a product/service and optionally a reference. The agent understands the project, searches what already exists, chooses the right production path, builds the video, reviews it, and keeps only useful knowledge after approval.

## Two modes
**Direct mode:** analyze -> search -> route -> build -> review with minimal interruption.

**Director mode:** concepts -> mood/visual grammar -> production plan -> controlled checkpoints -> build -> review.

## Engines
- HyperFrames — core programmable 2D/motion/timeline/render engine.
- Blender — true 3D engine.
- After Effects — optional paid compositing/VFX/finishing engine.
- OpenMontage — optional external integration and architecture inspiration; its AGPL implementation is not copied into the core.

## What AurorA adds
- persistent product/service workspace knowledge
- project-aware reference analysis
- reusable asset/style/skill memory
- explicit tool routing
- Direct and Director modes
- safe finalization/cleanup
- decision logs for a future small routing model
- community update contract inspired by simple tools such as Hermes

## Alpha commands
```bash
node bin/aurora.mjs init my-project
node bin/aurora.mjs doctor
```

Target after npm publishing:
```bash
npm install -g aurora-studio
aurora init my-project
aurora setup
aurora doctor
aurora update
```

UI/UX is intentionally deferred until the knowledge, commands and skills are stable.
