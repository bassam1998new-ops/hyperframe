# What exists already vs what AurorA should add

## Reuse, do not rebuild
### HyperFrames
Already owns a large part of the low-level video loop: HTML/GSAP rendering, Studio/timeline editing, transcription, TTS, beat analysis, background removal, audio normalization, snapshots, comparison, QA/checks, rendering and published agent skills.

AurorA should call those capabilities through the current official HyperFrames CLI/skills instead of creating old duplicate wrappers.

### OpenMontage
Strong ideas: agent as control plane, pipeline manifests, stage skills, tool registry, checkpoints and review gates.

AurorA should learn from these patterns, but not copy/vendor OpenMontage implementation into the permissive core because OpenMontage is AGPLv3.

### Blender
Mature true-3D engine. AurorA needs a clean bridge and routing rules, not another 3D renderer.

### After Effects
Useful optional finishing/compositing/VFX tool, but proprietary. It is not part of the open-source default path.

### Hermes
Good community-product pattern: simple update command, passive update notice, config check/migrate when new settings appear. AurorA should adapt this UX pattern to npm/GitHub releases.

## AurorA-specific value
- persistent product/service workspace knowledge
- one-time resource setup
- Direct mode vs Director mode
- reference analysis that adapts to the current product instead of copying
- cross-tool routing across HyperFrames, Blender and optional After Effects
- asset/style/skill memory
- provider/resource cards, including optional authenticated browser resources
- post-approval cleanup + learning
- decision receipts that later become a training set for a small router
- community updates for core, skills, tool cards and style packs
