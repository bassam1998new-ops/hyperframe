---
id: amber-grid-newsroom
name: Amber Grid Newsroom
status: approved
version: 1
modes: [calm, punchy]
use_when: [ai-news, build-show-off]
avoid_when: [lecture-clip, direct-offer]
brand: any
blocks: []
skill: style-amber-grid-newsroom
approved_by: the owner (chat)
approved_on: 2026-10-02
approved_words: approve all styls there
---
# Amber Grid Newsroom

<!-- A STYLE CARD. One folder per style: style.md (this), frames/ (3–6 approved 9:16 style frames WE OWN —
     the real contract, sent to every AI tool as the style reference), refs/ (web inspiration: links +
     small thumbnails + credit, look only, never sent to AI tools), grade.cube (optional LUT), tests/.
     Describe TECHNIQUE, never "in the style of <living artist>". Fill every line; write "none — why" if a
     line does not apply. `vid style check <slug>` tells you what is missing. Guide: brain/Jobs/Pick a style.md -->

**Tone (one sentence):** A hot, fast news-ticker feel — black grid desk, the screen in a framed window, English headline over an amber Arabic line, and amber karaoke words.
**Inspired by (technique, not a copy):** broadcast "breaking news" desks: a faint blueprint grid, a single hot warning colour, and a framed monitor with instant reframes on the part being discussed.

## Look
- **Palette:** bg #0B0A10 · primary #FFFFFF (captions, Latin titles) · accent #FFC94D (Arabic title line, the word being spoken, outro emphasis) · window #16141D · text Latin title gradient #FFFFFF → #D8D4E4 — amber only on the Arabic title line and the active word; nothing else is coloured.
- **Type:** Arabic IBM Plex Sans Arabic 700 / 500 (as "Plex Arabic") · Latin Inter 700 / 500 · Latin title 70 px/700, letter-spacing −1 px, gradient-clipped · Arabic title 52 px/700 amber · captions 62 px/700 at line-height 1.4, Latin words 56 px Inter · outro 72 px · English line above, Arabic line below, never mixed.
- **Texture:** a faint 72 px square grid (white lines at 3.5%) + an amber radial haze at 7% behind the centre + a heavy vignette (to 75% black at the corners); no grain.
- **Grade:** none on the footage — the screen recording is shown as captured inside a window with 28 px corners, a 1 px white border at 14% and a 0 30 px 80 px shadow.

## Camera, light, performance
- **Camera:** no camera — a 2160 × 1214 screen recording inside a 1032 × 800 window at y = 450; 24 instant reframes (`tl.set`) jump between a wide 0.79× view and 1.05–1.075× crops on the area being discussed, plus a +3% linear push that restarts each section.
- **Lighting:** none — screen capture; a soft amber haze behind the window is the only light.
- **Performance:** voice only, no face — Egyptian Arabic, spoken to camera-less screen; how the source voice was cut is unknown — decide at the first job.

## Edit
- **Rhythm:** title sections average about 9.8 s (9 sections over 89.8 s, 4.7–19.9 s) · longest 19.9 s · caption groups 0.3–3.4 s · reframes land on sentence starts (they share caption group start times).
- **Grammar:** instant reframes (crop jumps) inside one continuous screen take instead of cuts; the push-in restarts at each section; the title pair changes per topic; ends on a black outro card.
- **Transitions:** hard reframe cuts; outro = black card fades in over 0.4 s (power2.out) for the last 3.8 s, text rises 30 px.

## Motion (HTML / GSAP)
```json
{ "ease": { "enter": "power3.out", "exit": "none (cut at clip end)", "emphasis": "instant colour set", "caption": "power2.out", "push": "none" },
  "duration_ms": { "micro": 180, "standard": 350, "hero": 500 },
  "stagger_ms": 100,
  "rise_px": { "title": 24, "caption": 18, "outro": 30 },
  "push_scale": 1.03 }
```
- **Text animations:** title pair rises y 24 → 0 and fades in (0.35 s, the Latin line first, the Arabic line 0.1 s later); each caption group rises y 18 → 0 in 0.18 s; karaoke = the spoken word turns amber instantly and turns back to white when the next word starts; outro fades up.
- **Rules:** no exit animations — titles and caption groups simply end at their clip edge; Latin numbers inside Arabic lines sit in `bdi dir=ltr`; one amber word at a time.

## Sound
- **Music:** none — voice only in the source reel.
- **SFX:** none.
- **Mix:** voice only at volume 1; loudness not recorded in the project — unknown, decide at the first job.

## Modes
- **calm:** as shipped in an earlier project: instant reframes, slow 3% push, no music, no SFX.
- **punchy:** not used yet — untested proposal: more reframes per section, a tick SFX on each reframe, a tighter bed under the voice.

## Prompt parts
<!-- Copied word for word into every image/video prompt. Content goes ONLY in {SUBJECT}. -->
- **Style block:** Near-black background with a faint thin white square grid, a warm amber haze glowing softly behind the centre, heavy dark vignette at the corners, one framed rounded monitor window floating in the middle with a deep shadow, crisp broadcast-desk look, vertical 9:16 frame: {SUBJECT}
- **Keep:** near-black field, faint square grid, one warm amber glow, heavy vignette, framed window with rounded corners.
- **Avoid:** any letters or words in the image, fake app screens or charts, logos, watermarks, second accent colours (no blue, no violet), grain.

## Per tool
<!-- Model + version + date for each. Frames go to every tool as the style reference. -->
- **images-gpt:** not checked yet — no frames made
- **flow-veo:** not checked yet — no frames made
- **higgsfield:** not checked yet — no frames made
- **hyperframes:** motion tokens above + palette as CSS variables (`--bg`, `--hot`, `--ink` in the source project)

## Frames
<!-- 3–6 approved 9:16 frames in frames/. One line each: "- frames/01.png — what it shows". -->
- frames/01-title-pair-window.png (not in the public repo) — Latin title over amber Arabic title line, screen in the framed window (wide), karaoke caption with one amber word (an earlier project @ 11.6 s)
- frames/02-reframe-table-karaoke.png (not in the public repo) — instant reframe crop on a pricing table inside the window, amber Arabic title, amber spoken word (@ 45.6 s)
- frames/03-whiteboard-crop.png (not in the public repo) — 1.07× crop on the whiteboard, English/Arabic title pair, amber word in the caption (@ 70.5 s)

## Do / Don't
- **Do:** keep amber for the one hot thing on screen; reframe on the sentence that talks about that area; keep English above and Arabic below in the title.
- **Don't:** add a second accent colour; use AI images as product proof; animate width/height on the video (move the wrapper).

## Tests
- (test notes are kept in the private workspace)
<!-- One line per tested prompt: "- tests/<date>-<tool>.md — result, the owner's answer". -->
