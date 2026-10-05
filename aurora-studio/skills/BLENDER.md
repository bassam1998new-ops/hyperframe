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
- when Blender is producing an overlay for HyperFrames, render transparent RGBA PNG frames and pack them to VP9 alpha WebM

## CLI
    aurora-studio blender doctor
    aurora-studio blender create hero-avatar
    aurora-studio blender run .aurora/blender/hero-avatar.json
    aurora-studio blender handoff "frames/f_%04d.png" renders/avatar.webm --quality premium --dry-run
    aurora-studio blender run .aurora/blender/hero-avatar.json

## Rule
AurorA should use Blender's real Python API. Do not invent a second fake 3D scene language inside AurorA.


## HyperFrames handoff
For transparent 3D overlays:
- Blender: film transparent ON
- image format: PNG
- color mode: RGBA
- render frames
- AurorA packs them to VP9 WebM with alpha

Do not use transparent WebM when a normal opaque final render is simpler.

## Arabic 3D text
Blender does not reliably shape Arabic letters by itself.

AurorA includes:
`aurora-studio/blender/helpers/arabic_text.py`

It uses optional Python packages:
- `arabic-reshaper`
- `python-bidi`

Install those only when the job actually needs Arabic 3D text.
