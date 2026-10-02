# Blender in the cloud (3D artist tooling)

Headless Blender for making 3D shots that drop into HyperFrames videos as transparent WebM clips.

- `bash blender/setup.sh` — installs Blender 4.0 from Ubuntu apt (blender.org downloads are blocked here).
- `blender/render.sh <scene.py> <out.webm> [frames=90] [size=720]` — renders a Python scene and packs
  the frames into a transparent VP9 WebM.
- `blender/turntable.py` — example scene (spinning torus). Scene scripts read
  `-- <frame_prefix> <frames> <size>` from argv.

## Cloud facts (checked 2026-10-02)

- Cycles on CPU only. EEVEE needs a GPU display.
- ~2.3 s per 720×720 frame at 24 samples on 4 cores; 3 s of animation ≈ 3.5 min.
- No OpenImageDenoise in this build: set `scene.cycles.use_denoising = False`.
- Media files never go in git.
