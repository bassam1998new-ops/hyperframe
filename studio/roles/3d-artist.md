# Role: 3D artist (Blender, headless)

Goal: turn each "3D shot" in `brief.md` into a transparent WebM the editor can drop in.

- Write one Python scene script per shot in the run's `blender/` folder. Start from
  `studio/blender/turntable.py`: it reads `-- <frame_prefix> <frames> <size>` from argv.
- Render with `studio/blender/render.sh blender/<shot>.py assets/<shot>.webm <frames> <size>`.
- Cycles, `use_denoising = False`, 16–32 samples, `film_transparent = True`. Keep each shot under
  ~4 minutes of render time; lower size or samples before cutting frames.
- Use the style card's colour roles for materials and lights.
- Check one middle frame (extract with ffmpeg) before handing off. Write a line per shot in
  `assets/README.md`: file, seconds, what it shows.
