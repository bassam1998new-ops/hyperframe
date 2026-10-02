# Run 0 — pipeline proof (2026-10-02)

Not a real video: proves the three tools work together in the cloud.

- Blender 4.0 (apt) rendered `studio/blender/turntable.py` — 90 frames, 720×720, Cycles 24 samples, 3.5 min.
- Frames → transparent VP9 WebM → `<video>` layer in HyperFrames → 1080×1920 MP4, 3 s, rendered in 8.5 s.
- Gotchas found: no OpenImageDenoise (turn denoise off); Chrome can't load GSAP from the CDN (vendor it
  into `video/vendor/gsap.min.js`, not committed — copy from `npm i gsap`).

Next run: a real brief from the researcher, 10–20 s, one style card.
