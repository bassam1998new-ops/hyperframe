---
id: warm-glass-facecam
name: Warm Glass Face-cam
status: approved
version: 1
modes: [calm, punchy]
use_when: [build-show-off, quick-tutorial]
avoid_when: [lecture-clip, ai-news]
brand: any
blocks: []
skill: style-warm-glass-facecam
approved_by: the owner (chat)
approved_on: 2026-10-02
approved_words: approve all styls there
---
# Warm Glass Face-cam

<!-- A STYLE CARD. One folder per style: style.md (this), frames/ (3–6 approved 9:16 style frames WE OWN —
     the real contract, sent to every AI tool as the style reference), refs/ (web inspiration: links +
     small thumbnails + credit, look only, never sent to AI tools), grade.cube (optional LUT), tests/.
     Describe TECHNIQUE, never "in the style of <living artist>". Fill every line; write "none — why" if a
     line does not apply. `vid style check <slug>` tells you what is missing. Guide: brain/Jobs/Pick a style.md -->

**Tone (one sentence):** A premium tech intro — the presenter talks to camera while frosted-glass panels with a warm terracotta glow land exactly where he points.
**Inspired by (technique, not a copy):** frosted-glass UI panels (backdrop blur, thin light border, deep shadow), blur-punch text entrances, and a talking head that shrinks into a rounded picture-in-picture for the demo part.

## Look
- **Palette:** bg #05080F · primary #FFFFFF / #F1F1F1 · accent #D97757 (terracotta: glows, eyebrows, active caption word, chart bars) · soft #F5B39A (peach highlight) · text dim #B8B8B8 — glass panels are white at 2–10%; the accent is mostly glow, never a big fill. (Warning: this accent is the brand colour of a third-party AI product — swap it per job.)
- **Type:** Arabic none — the source is English only; unknown, decide at the first job · Latin Inter 400–900 (headlines 800–900, letter-spacing −0.02em, 68–84 px on a 1920 px frame) · JetBrains Mono 600–700 for eyebrows, upper-case, letter-spacing 0.34–0.46em, 18–22 px.
- **Texture:** frosted glass (backdrop blur 14–18 px, saturate 1.2–1.25), terracotta outer glow on logo and panels, faint grid lines and a seeded starfield behind the PiP; a grain-overlay component (opacity 0.15) is in the project but not wired in.
- **Grade:** light lift on the face video only — contrast 1.05, saturation 1.08.

## Camera, light, performance
- **Camera:** talking head, landscape 16:9 full frame for the first ~12.8 s, then the frame shrinks (0.6 s) into a 540 × 960 portrait picture-in-picture docked right with 36 px corners and a terracotta glow.
- **Lighting:** unknown from the code (the source clip was not opened) — decide at the first job.
- **Performance:** presenter speaks to camera and gestures to where the graphics appear ("text up here", "subtitles down here"); graphics are timed to his keywords.

## Edit
- **Rhythm:** average beat 4.6 s (3.95 / 1.99 / 2.70 / 4.20 / 10.33) · longest 10.33 s · graphics land on keywords from word timings.
- **Grammar:** one continuous take, overlays change per sentence, and a reframe to PiP replaces a cut for the demo section.
- **Transitions:** PiP shrink (0.6 s power3.inOut, starts 0.3 s before the keyword); blur-punch in (scale 1.4 + blur 18 px → sharp); side hits slide in from x −20 with expo.out.

## Motion (HTML / GSAP)
```json
{ "ease": { "enter": "expo.out", "enter_soft": "power3.out", "exit": "power2.in", "exit_hard": "power3.in", "emphasis": "back.out(2)", "reframe": "power3.inOut", "shimmer": "power2.inOut" },
  "duration_ms": { "micro": 120, "standard": 350, "hero": 650 },
  "stagger_ms": 120,
  "chart_bar_stagger_ms": 80,
  "blur_in_px": 18 }
```
- **Text animations:** blur-in with scale (filter blur 12–18 px → 0); slide + fade from x −20 / −30 (0.32–0.35 s, expo.out); word lines rise with 0.12 s stagger (0.55 s, power3.out); karaoke pill with a "CC" tag and the active word in terracotta; shimmer sweep across the outro title (3 sweeps, 1.2 s each).
- **Rules:** keep the face clear — panels sit in the empty half or the top band; animate the wrapper, never the video; one glow colour.

## Sound
- **Music:** none in the render — `music-bed.mp3` is in the assets but not used.
- **SFX:** none.
- **Mix:** the face clip's own audio at volume 1; loudness unknown — decide at the first job.

## Modes
- **calm:** as shipped in an earlier project: continuous take, glass panels, no music, no SFX.
- **punchy:** not used yet — untested proposal: a bed under the voice, a soft whoosh on each blur-punch, faster panel swaps.

## Prompt parts
<!-- Copied word for word into every image/video prompt. Content goes ONLY in {SUBJECT}. -->
- **Style block:** Dark blue-black studio background with a faint grid and a few tiny stars, one frosted glass panel with a thin light edge and a deep soft shadow, warm terracotta rim glow, shallow depth of field, clean premium tech look, vertical 9:16 frame: {SUBJECT}
- **Keep:** blue-black field, frosted glass with a thin light edge, one warm terracotta glow, deep soft shadows.
- **Avoid:** any letters or words in the image, third-party logos, watermarks, fake app screens, cold neon blue, heavy grain.

## Per tool
<!-- Model + version + date for each. Frames go to every tool as the style reference. -->
- **images-gpt:** not checked yet — no frames made
- **flow-veo:** not checked yet — no frames made
- **higgsfield:** not checked yet — no frames made
- **hyperframes:** motion tokens above + palette as CSS variables; vendor Inter, JetBrains Mono and GSAP locally first (the source loads them from a CDN)

## Frames
<!-- 3–6 approved 9:16 frames in frames/. One line each: "- frames/01.png — what it shows". -->
- frames/01-glass-hero-card-facecam.png (not in the public repo) — face-cam slot (placeholder silhouette, no real person) with a frosted glass hero card in the top band and the CC karaoke pill (test build @ 2.6 s)
- frames/02-glass-chart-panel.png (not in the public repo) — glass chart panel with terracotta bars over the face-cam slot, karaoke pill (@ 5.6 s)
- frames/03-pip-outro.png (not in the public repo) — PiP reframe: blue-black grid + stars, rounded PiP with warm glow, "Let's get into it." outro (@ 8.6 s)

## Do / Don't
- **Do:** time each panel to the presenter's gesture or keyword; keep the face uncovered; build a 9:16 and Arabic version before using it for the owner (the source is 1920 × 1080, 60 fps, English).
- **Don't:** reuse the source's third-party logo or its exact brand colour for the owner's brand; load fonts or GSAP from a CDN at render time.

## Tests
- (test notes are kept in the private workspace)
<!-- One line per tested prompt: "- tests/<date>-<tool>.md — result, the owner's answer". -->
