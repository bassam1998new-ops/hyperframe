---
id: floating-desk-zoom
name: Floating Desk Zoom
status: approved
version: 1
modes: [calm, punchy]
use_when: [build-show-off, quick-tutorial, ai-news]
avoid_when: [lecture-clip, talking-head]
brand: any
blocks: [vid desk]
skill: style-floating-desk-zoom
approved_by: the owner (chat)
approved_on: 2026-10-02
approved_words: approve all styls there
---
# Floating Desk Zoom

<!-- A STYLE CARD. One folder per style: style.md (this), frames/ (3–6 approved 9:16 style frames WE OWN —
     the real contract, sent to every AI tool as the style reference), refs/ (web inspiration: links +
     small thumbnails + credit, look only, never sent to AI tools), grade.cube (optional LUT), tests/.
     Describe TECHNIQUE, never "in the style of <living artist>". Fill every line; write "none — why" if a
     line does not apply. `vid style check <slug>` tells you what is missing. Guide: brain/Jobs/Pick a style.md -->

**Tone (one sentence):** A calm, premium product demo — the real app windows float as cards on warm paper, and a quiet camera cuts in close on the action and glides back out.
**Inspired by (technique, not a copy):** a 2026 AI-app launch video (studied 2026-09-26, file in a local folder, not kept in the library): windows as floating cards, hard-cut punch-ins on typing, slow glide-outs, the unused window dimmed grey, a constant slow drift.

## Look
- **Palette:** bg #E9E4DB (warm paper) with a soft white radial highlight at the top-middle · card shadow warm brown rgba(40,30,20,.22) · dim overlay rgba(120,116,110,.9) at 55% on the window not in use · the app's own colours carry the rest — no extra accent.
- **Type:** none from the tool itself. Titles/captions added on top follow the brand; for Arabic use IBM Plex Sans Arabic (see brain/Rules/Arabic text done right.md). Keep text out of the band y 330–1470 when the card is wide.
- **Texture:** fine paper grain (SVG noise, 8%, multiply) over everything, including the cards.
- **Grade:** none on the screen — keep screen text sharp ([[One grade and grain match mixed sources]]). Cards: 22 px corners, two-layer soft shadow.

## Camera, light, performance
- **Camera:** one virtual camera over a flat desk. Wide = the card fills ~90% of the width, centred at y 900. Punch-in = hard cut to a tight crop of the part that changes (max 1.6 output px per source px so text stays sharp). While holding, the frame pushes in 2.5% (linear) and can pan to follow typing. Zoom-out = a 1.2–1.4 s glide (power3.inOut). Between windows the camera slides sideways; the old window greys out as it leaves.
- **Lighting:** flat, soft, from above — only the radial highlight and the card shadow.
- **Performance:** voice-over only (the owner, Egyptian Arabic); the recording is OBS 2160×3840 with the desktop in the middle band — `vid desk init` crops it.

## Edit
- **Rhythm:** a new camera move every 3–6 s; punch in on the action, hold while it happens, glide out 0.8 s after it ends; never two moves less than 1.5 s apart.
- **Grammar:** cut IN, glide OUT. Wide → punch-in (cut) → pan along the typing → glide back → slide to the next window.
- **Transitions:** only the camera moves above; no wipes, no flashes.

## Motion (HTML / GSAP)
```json
{ "ease": { "glide": "power3.inOut", "pan": "sine.inOut", "drift": "none", "dim": "power1.inOut" },
  "duration_ms": { "glide": 1200, "glide_out": 1400, "min_gap_between_moves": 1500 },
  "drift_scale": 1.025,
  "max_zoom_px_per_px": 1.6,
  "dim_opacity": 0.55 }
```
- **Text animations:** none built in. Titles and numbers go in a separate layer above the desk (a count-up on close shots works well).
- **Rules:** never animate the `<video>` — only `#fd-cam` (move/zoom) and `#fd-drift` (push). A card bigger than the frame always covers it; a smaller card stays whole and centred. Plan lives in `director/desk.json`; rebuild with `vid desk build`.

## Sound
- **Music:** a soft minimal bed under the voice (from `_library` music, ducked).
- **SFX:** optional very soft whoosh on glides, a tiny tick on punch-ins (punchy mode only).
- **Mix:** voice −14 LUFS, bed −23 LUFS before ducking.

## Modes
- **calm:** as built by `vid desk`: drift 2.5%, glides 1.2–1.4 s, no SFX.
- **punchy:** untested proposal — glides 0.7 s (expo.inOut), drift 4%, punch-in tick SFX, more punch-ins.

## Prompt parts
<!-- Copied word for word into every image/video prompt. Content goes ONLY in {SUBJECT}. -->
- **Style block:** none — this style is built from real screen recordings, never generated. If a background plate is ever needed: Warm beige paper desk surface seen from straight above, soft white light pooling in the middle, fine paper grain, calm and empty, vertical 9:16: {SUBJECT}
- **Keep:** warm beige paper, soft top highlight, fine grain, floating rounded cards with soft warm shadows.
- **Avoid:** fake app screens, letters or words in generated images, cold grey or dark backgrounds, hard shadows.

## Per tool
<!-- Model + version + date for each. Frames go to every tool as the style reference. -->
- **images-gpt:** none — not used (real screen footage only)
- **flow-veo:** none — not used
- **higgsfield:** none — not used
- **hyperframes:** `vid desk init <project> <recording> [--from --to]` → edit `director/desk.json` → `vid desk build <project>` → put the printed host `<div>` in index.html (tested 2026-09-26, HyperFrames 0.8.68)

## Frames
<!-- 3–6 approved 9:16 frames in frames/. One line each: "- frames/01.png — what it shows". -->
- frames/01-wide.png (not in the public repo) — one window as a floating card on warm paper (wide shot)
- frames/02-glide-dim.png (not in the public repo) — mid-glide between two windows, both greying as they pass
- frames/03-card.png (not in the public repo) — the second window in focus, not dimmed
- frames/04-punch-in.png (not in the public repo) — hard-cut punch-in: full card height, sides cropped, even paper above and below

## Do / Don't
- **Do:** record with big app fonts (125–150% zoom) so punch-ins stay sharp; pause 1–2 s between steps; punch in on what the voice talks about; keep the Windows taskbar out (init crops it).
- **Do (learned on an earlier project v2, 2026-09-27):** build a second full-res screen cut (same EDL, no downscale, privacy boxes baked) so punch-ins stay sharp; punch in on the exact word he names (model label, price toast, prompt), ring it in ink on light UI and paper on dark UI; keep the punched card full-width but inside y 420–1240 so kicker text and captions stay on paper; clamp the camera so the black strip under the browser never shows; opener tiles can stay full-frame and hand over to a card that is already punched in, then glide out.
- **Don't:** dim the windows nobody is talking about in a side-by-side compare (the owner: "drop the dim"); leave captions light-on-dark once the paper arrives (switch them to ink); keep chips that repeat what the screen already shows.
- **Don't:** zoom past 1.6× (text goes soft); stack moves closer than 1.5 s; show private data (keys, emails, client names) — check every punch-in.

## Tests
- (test notes are kept in the private workspace)
<!-- One line per tested prompt: "- tests/<date>-<tool>.md — result, the owner's answer". -->
