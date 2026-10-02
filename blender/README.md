# Blender in the cloud (3D artist tooling)

Headless Blender 5.0 plus a free add-on and asset library, for making 3D shots that drop into HyperFrames
videos as transparent WebM clips.

- `bash blender/setup.sh` — installs Blender 5.0 (`bpy` from PyPI) and the library in [LIBRARY.md](LIBRARY.md). ~1 minute.
- `source blender/env.sh` — gives you `blender5 scene.py -- args` with all add-ons available.
- `blender/render.sh <scene.py> <out.webm> [frames=90] [size=720]` — renders a scene and packs it as a
  transparent VP9 WebM. Scene scripts read `-- <frame_prefix> <frames> <size>` from argv.
- `examples/turntable.py` (spinning torus), `examples/showcase.py` (terrain, tree, gear, CC0 models, Arabic
  3D text, HDRI), `examples/generators.py` (human + spaceship).

## Cloud facts (checked 2026-10-02)

- Cycles on 4 CPU cores: ~8 s for a 720×720 frame at 32 samples with the denoiser.
- EEVEE runs on software OpenGL (~20 s a frame), so Cycles is usually faster here. Workbench is ~1 s.
- Media files never go in git.
