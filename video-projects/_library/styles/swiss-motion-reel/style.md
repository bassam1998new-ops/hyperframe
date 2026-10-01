---
id: swiss-motion-reel
name: Swiss Motion Reel
status: approved
version: 1
modes: [calm, punchy]
use_when: [brand sizzle / product intro, "what we do" reel, motion showcase, launch teaser, no-person graphics-only video]
avoid_when: [talking-head or screen-recording tutorials, long explainers with voice-over carrying the story, warm/emotional stories]
brand: any
blocks: []
skill: style-swiss-motion-reel
approved_by: the owner (chat)
approved_on: 2026-10-02
approved_words: approve all styls there
---
# Swiss Motion Reel

**Tone (one sentence):** A precise, confident motion-design reel — a grid-and-HUD "instrument panel" where every scene is a small demo of motion itself, cut hard on a 128 BPM beat.
**Inspired by (technique, not a copy):** the "CLAUDE — motion designer" reel the owner shared on 2026-09-27 (Downloads, source unknown; 15.1 s, 16:9, 60 fps). Techniques: Swiss grid layout, a constant thin HUD over every scene, flat paper/black/red/blue colour blocks, hard beat cuts, shape morphs, pattern fields, a point-cloud 3D moment, a logo resolve at the end.

## Look
- **Palette:** bg #f1ece5 · primary #2d38fe · accent #fe5836 · text #0f0e13 (reference; some scenes use pure black) — full-frame colour blocks per scene; only 2 colours + ink on screen at once.
  - **For a brand, swap in its roles:** paper → brand canvas, blue → brand primary, red → brand accent (max 10% of the frame in calm mode).
- **Type:** Latin display = high-contrast italic serif (Instrument Serif Italic — **vendor the real italic file**, the browser's fake slant is visibly worse) + heavy grotesk for slams · labels = mono caps, 9–11 px equivalent, wide tracking (JetBrains Mono / Spline Sans Mono) · Arabic = a clean geometric sans (never letter-split; see `brain/Rules/Arabic text done right.md`).
- **Texture:** none — flat colour, crisp 1 px hairlines, no grain.
- **Grade:** none — graphics only.

## Camera, light, performance
- **Camera:** none — flat 2D frame; one 3D scene (three.js point cloud) with a slow orbit.
- **Lighting:** none — flat.
- **Performance:** none — no person.

## Edit
- **Rhythm:** average scene 1.2–2 s · longest 2.5 s · cut on the beat (128 BPM = 0.469 s per beat, 1.875 s per bar); big changes on bar starts.
- **Grammar:** hard cuts and match cuts (a dot becomes the next scene's shape); every scene ends by sending its elements toward the next scene's starting shape.
- **Transitions:** hard cut on beat, shape match-cut, colour-block wipe, elements fly out with motion blur.

## Motion (HTML / GSAP)
```json
{ "ease": { "enter": "expo.out", "exit": "power3.in", "emphasis": "back.out(2.6)" },
  "duration_ms": { "micro": 120, "standard": 300, "hero": 940 },
  "stagger_ms": 15 }
```
- **Text animations:** word slam (scale 1.4 → 1, 120 ms), letters collapse into dots, italic serif sub-line fades up, mono labels type on.
- **HUD (on every scene):** corner brackets · top-left brand + "MOTION REEL — year" · top-right "NN — SCENE NAME" · bottom-left timecode + fps · bottom-right BPM + 4 beat squares + BAR n/8 · thin progress line along the bottom. Built and working in an earlier project (not public).
- **Rules:** one hero move per beat; fake motion blur = scaleX stretch by speed + blur(), max 7 px; ghost rings trail fast objects; deterministic only (no random without a seed).

## Sound
- **Music:** electronic / minimal tech, 120–128 BPM, clear kick; the edit is built on its bars.
- **SFX:** tick on each beat square, whoosh on fly-outs, a soft hit on the logo — at most one SFX per beat.
- **Mix:** music-led (no voice) at −14 LUFS; with a voice-over, music at about −18 LUFS under it.

## Modes
- **calm:** 100–110 BPM, fewer flashes, brand accent colour only as small dots; good for B2B brands like a light B2B brand.
- **punchy:** 128 BPM, full-frame red/black colour blocks, more SFX, faster slams.

## Prompt parts
- **Style block:** flat 2D Swiss-grid motion graphic, thin 1 px hairlines, mono caps labels, high-contrast italic serif headline, flat solid colour background, no gradients, no texture {SUBJECT}
- **Keep:** the HUD corners and labels, 2 colours + ink, lots of empty space.
- **Avoid:** watermark, 3D glossy renders, gradients, stock-photo look, extra text, off-palette colours.

## Per tool
- **images-gpt:** refs frames/01-chart-start.png (not in the public repo), frames/02-race-blur.png (not in the public repo) — not checked yet
- **flow-veo:** none — this look is pure HTML motion; AI video is not needed
- **higgsfield:** none — same reason
- **hyperframes:** motion tokens above + palette as CSS variables; the HUD and the easing chart from `_test-copy-easing` are the starting code

## Frames
<!-- These are 16:9 frames from our own 2 s copy test; 9:16 frames still needed before approval. -->
- frames/01-chart-start.png (not in the public repo) — "Six ways to get from A to B" chart on paper, HUD on, balls at A
- frames/02-race-blur.png (not in the public repo) — mid-race: stretch + blur + ghost rings + speed ticks
- frames/03-settle-ticks.png (not in the public repo) — every ball settled at B, tick density shows each ease

## Do / Don't
- **Do:** keep the HUD constant across every scene — it is what ties the reel together; build each scene from the previous scene's last shape; time everything from the BPM.
- **Do:** vendor the real italic serif file before using this style.
- **Don't:** use the reference's loud red for a calm brand; don't fake 3D with CSS when a point cloud is the hero — use three.js; don't render 60 fps unless asked (twice the render time).

## Tests
- (test notes are kept in the private workspace)
