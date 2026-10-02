# Studio loop — researcher, 3D artist, editor

Three roles that make one short video per run, in the cloud, with no human in the middle.
Claude runs the loop on a weekly schedule; Bassam only gets the finished draft and any decision.

```
researcher ──brief.md──▶ 3d-artist ──assets/*.webm──▶ editor ──video.mp4──▶ review ──▶ PR + post
     ▲                                                                                   │
     └──────────────────────── notes.md (what worked, what to change) ◀──────────────────┘
```

## One run

1. `bash studio/setup.sh` — installs Blender 4.0 (headless) and the HyperFrames render browser.
2. Make `studio/runs/<YYYY-MM-DD>-<slug>/`.
3. **Researcher** ([roles/researcher.md](roles/researcher.md)) writes `brief.md`.
4. **3D artist** ([roles/3d-artist.md](roles/3d-artist.md)) writes `blender/*.py`, renders `assets/*.webm`.
5. **Editor** ([roles/editor.md](roles/editor.md)) builds the HyperFrames project in `video/`, renders the MP4.
6. **Review**: look at 4–6 frames from the MP4 against the brief and the style card. Send back to the
   right role at most twice. Write `notes.md`: what worked, what the next run should change.
7. Commit the run folder (no MP4 — `.gitignore` blocks media), open a PR, put the MP4 in the project
   files under `studio-renders/`, and post the draft in the project thread.

The next run's researcher reads the last three `notes.md` first, so the loop learns.

## Cloud facts (checked 2026-10-02)

- Blender comes from Ubuntu apt (4.0.2). blender.org downloads are blocked by the network policy.
- Cycles on 4 CPU cores: ~2.3 s per 720×720 frame at 24 samples. 3 s of animation ≈ 3.5 min.
  EEVEE needs a GPU display; use Cycles (or Workbench for flat looks).
- No OpenImageDenoise in this build: set `scene.cycles.use_denoising = False`.
- HyperFrames renders in the cloud (1080×1920, 3 s in ~9 s). Chrome cannot reach CDNs here:
  vendor GSAP and any library into the project (`npm i gsap` then copy `dist/gsap.min.js`).
- Media files never go in git. Renders live in the project files, scripts and HTML live in the repo.
