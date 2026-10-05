# Existing systems vs AurorA Studio

This file prevents us from rebuilding good existing work.

## HyperFrames already gives us
- programmable HTML video compositions
- timeline / Studio workflows
- transcription
- TTS
- captions/media workflows
- beat analysis
- background removal
- audio normalization
- lint/check/snapshot/compare/grade-compare
- agent skills and updateable skill installation

AurorA should consume these capabilities, not recreate them.

## OpenMontage already gives the ecosystem
- reference-driven creation
- pipeline manifests
- provider/tool selection
- optional local/cloud providers
- quality gates
- checkpoints
- cost awareness
- decision trails
- large agent skill libraries
- compatibility with several coding agents

OpenMontage is AGPLv3. For now, AurorA learns from the architecture and may integrate it externally. Do not copy its implementation into a differently licensed core without making the license implications explicit.

## What AurorA Studio should add

### 1. Very simple two-mode UX
Direct:
- request/reference in
- minimal checkpoints
- agent builds

Director:
- deconstruct
- project context
- concepts
- owner selects
- staged production

### 2. Persistent product/workspace brain
The workspace remembers what product/service the videos are for and adapts references to that product instead of blindly imitating them.

### 3. Cross-engine routing
One workspace knows how and when to use:
- HyperFrames
- Blender
- optional After Effects
- optional external systems/providers

### 4. Cross-engine asset memory
Especially 3D models, rigs, animations, materials, HDRIs, Blender setups, reusable motion/styles and licensed assets from previous jobs.

### 5. Tool-agnostic creative direction
Mood describes the result. Routing chooses the software.

### 6. Approved-work learning
After approval:
- clean safe temporary mess
- keep reproducible source
- save useful style/asset improvements
- log compact decisions and lessons

No automatic self-training.

### 7. Community updater
A simple updater inspired by Hermes:
- current version
- concise New / Fixed
- Update now / Later
- safe migrations
- separate core, skills and knowledge updates where useful

## Browser account resources
ChatGPT, Google Flow, Meta AI and other browser resources can be configured as optional resources when the user's agent environment can access them. They are not core dependencies and AurorA must still work without them.
