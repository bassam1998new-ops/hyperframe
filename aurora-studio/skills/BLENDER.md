# AurorA Studio — Blender

Use Blender when the result needs real 3D, not because 3D sounds impressive.

## Strong use cases
- avatars / characters
- modeling and rigging
- real materials and lighting
- product renders
- camera animation
- physics / simulation
- 3D environments

## Avoid Blender when
- HyperFrames can make the result faster with equal quality
- the task is mostly captions, UI, typography or simple social motion
- a reusable approved asset already solves the need without a new 3D build

## Before building
1. Read project + reference context.
2. Search AurorA library first for models, rigs, materials, HDRIs and animation clips.
3. Decide REUSE / MODIFY / BUILD_NEW.
4. Keep the Blender implementation reproducible: blend file, scripts and important imported assets.

## Workflow
- create a Blender job
- use a Python script for repeatable scene changes when practical
- render a fast draft/preview first
- inspect framing, lighting, materials and motion
- only spend final render time after the draft passes review
- keep the final blend file when it is needed to reproduce the approved result

## CLI
    aurora-studio blender doctor
    aurora-studio blender create hero-avatar
    aurora-studio blender run .aurora/blender/hero-avatar.json --dry-run
    aurora-studio blender run .aurora/blender/hero-avatar.json

## Rule
AurorA should use Blender's real Python API. Do not invent a second fake 3D scene language inside AurorA.
