---
id: midnight-kinetic-type
name: Midnight Kinetic Type
status: approved
version: 1
modes: [calm, punchy]
use_when: [direct-offer, proof-results, ai-news]
avoid_when: [lecture-clip, quick-tutorial]
brand: any
blocks: [mk-hook-title-portrait, mk-hook-title-ar-portrait, mk-bar-compare-portrait, mk-x-post-portrait, mk-icon-stat-row, mk-lower-third-portrait, mk-cta-endcard-portrait, mk-cta-endcard-ar-portrait]
skill: style-midnight-kinetic-type
approved_by: the owner (chat)
approved_on: 2026-10-02
approved_words: approve all styls there
---
# Midnight Kinetic Type

<!-- A STYLE CARD. One folder per style: style.md (this), frames/ (3–6 approved 9:16 style frames WE OWN —
     the real contract, sent to every AI tool as the style reference), refs/ (web inspiration: links +
     small thumbnails + credit, look only, never sent to AI tools), grade.cube (optional LUT), tests/.
     Describe TECHNIQUE, never "in the style of <living artist>". Fill every line; write "none — why" if a
     line does not apply. `vid style check <slug>` tells you what is missing. Guide: brain/Jobs/Pick a style.md -->

**Tone (one sentence):** Clean, confident motion type on a flat midnight field — one idea per beat, every scene cut hard on the music.
**Inspired by (technique, not a copy):** word-by-word mask reveals, a single accent-colour word, and beat-grid hard cutting as used in product social promos; no footage, graphics only.

## Look
- **Palette:** bg #1F1428 · primary #F5F5F7 (Latin ink) / #F2E9FD (Arabic ink) · accent #A15FF2 (Latin blocks) / #A05FF2 (Arabic blocks) · text dim #A1A1A6 / #BDABD1 · post-card panels #38274E / #4C3866 with #B682F5 links — accent only on the ONE word that is the point, plus icons and bars; no gradients on the field. _(example colours — not a real brand)_
- **Type:** Arabic Cairo 700 (headlines) / 400 (sub lines) · Latin Inter 400/500/700 · hook 110 px Latin (letter-spacing −0.03em, line-height 1.12), 132 px Arabic (letter-spacing 0), CTA headline 92 px, handle 46 px, sub 40 px · Arabic and English never on the same line (brand rule).
- **Texture:** none — flat solid midnight field, no grain, no glow, no vignette.
- **Grade:** none — no footage in this look; pure HTML graphics.

## Camera, light, performance
- **Camera:** none — no footage. Virtual camera only: the CTA card slowly pushes and rises during its hold (scale to 1.062, rise −74 px) so a held frame visibly breathes; cut-to cards open already composed with a 1.035 → 1 settle.
- **Lighting:** none — flat graphic field, no light effects.
- **Performance:** none — no person on screen and no voice-over in the source reels; music and SFX carry it.

## Edit
- **Rhythm:** average shot 5.4 s (reel-01: 2.9 / 5.767 / 5.766 / 5.767 / 6.72; reel-02: 2.233 / 6.5) · longest 6.72 s · cut on the beat grid from `beat-grid.mjs` (125 BPM → 0.48 s beat; 136.4 BPM → 0.44 s beat): hook 5–6 beats, middle scenes 12 beats (3 bars), CTA holds to the end.
- **Grammar:** hard cuts only; each scene's slot ends ~0.5 s before that scene's own exit starts, so every cut lands on a full, readable frame (checked by `_factory/verify-cuts.mjs`); lower third rides its own track, enters 2 beats after the cut and ends exactly on the next cut.
- **Transitions:** hard cut on the beat — crossfades are banned in this look (the v1 0.4 s dissolves read as double-exposed murk). SFX, not visual effects, mark the seam.

## Motion (HTML / GSAP)
```json
{ "ease": { "enter": "power4.out", "enter_panel": "power3.out", "exit": "power2.in", "emphasis": "power4.out", "draw": "power2.inOut", "hold": "sine.inOut" },
  "duration_ms": { "micro": 260, "standard": 420, "hero": 620 },
  "stagger_ms": 160,
  "stagger_range_ms": { "arabic_hook_words": 140, "latin_hook_words": 180, "cta_words": 160, "icon_strokes": 70, "bars": 500, "stat_rows": 620 },
  "word_rise_px": 120,
  "exit": { "rise_px": -40, "duration_ms": 400 } }
```
- **Text animations:** word-by-word mask rise (each word is an `overflow:hidden` inline-block, rises 120 px / 118% and fades in, power4.out, 0.45–0.48 s); the accent word is held back ~0.14 s and lands alone (scale 0.8 → 1, colour to accent, 0.62 s); icon strokes draw on (strokeDashoffset, 0.5 s, 0.07 s apart); handle and sub line rise + fade 0.4 s power3.out; exit = whole block rises 40–48 px and fades in 0.4 s power2.in, then a hard hide.
- **Rules:** one hero move per beat — the accent word gets ONE extra treatment only; Arabic split per word, never per letter, with `dir="rtl"` on the text element (never on the html tag); letter-spacing 0 on Arabic; register the timeline synchronously and re-centre after fonts load; a held shot must drift enough to see (≥ 6%).

## Sound
- **Music:** `bed-tech-neutral.mp3` (125 BPM) for Latin reels, `bed-arabic-modern.mp3` (136.4 BPM) for Arabic reels, bed volume 0.55 — tech/neutral electronic bed.
- **SFX:** one accent per cut, never the same one twice in a row: `sub-drop` on frame 0, `whoosh-fast` or `impact-tight` starting half a beat (0.22–0.24 s) before a cut so the transient peaks on it, `success-chime` on the CTA.
- **Mix:** no voice in the source reels; measured accented seams −4.5 / −5.1 dB against a −12.6 dB bed. With a voice-over the level is unknown — decide at the first job.

## Modes
- **calm:** not used in the source reels — untested proposal: 12-beat scenes only, no sub-drop, chime on the CTA only, longer CTA hold.
- **punchy:** as shipped in an earlier project / 02-ar: 5–6-beat hook, a hard cut every 3 bars, sub-drop + whoosh/impact on every seam.

## Prompt parts
<!-- Copied word for word into every image/video prompt. Content goes ONLY in {SUBJECT}. -->
- **Style block:** Flat vector graphic on a solid deep midnight-violet background (almost black purple), soft even light with no shadows, crisp bright-white simple shapes, one small electric-violet accent, no texture and no grain, lots of empty space, vertical 9:16 frame with the subject in the middle band: {SUBJECT}
- **Keep:** solid midnight-violet field, white ink, one electric-violet accent under 10% of the frame, flat and clean, no glow.
- **Avoid:** any letters or words in the image (type is added in HTML), logos, watermarks, neon glow, gradients, rainbow colours, pink except a tiny dot, stock-photo people, invented product screens.

## Per tool
<!-- Model + version + date for each. Frames go to every tool as the style reference. -->
- **images-gpt:** not checked yet — no frames made
- **flow-veo:** not checked yet — no frames made
- **higgsfield:** not checked yet — no frames made
- **hyperframes:** motion tokens above + palette as CSS variables (the mk-* blocks already expose `--mk-canvas`, `--mk-accent`, `--mk-ink-dark`)

## Frames
<!-- 3–6 approved 9:16 frames in frames/. One line each: "- frames/01.png — what it shows". -->
- frames/01-arabic-hook-accent.png (not in the public repo) — Arabic Cairo hook on the flat midnight field, the one accent word in violet (an earlier project @ 1.95 s)
- frames/02-icon-stat-rows.png (not in the public repo) — icon-stat rows: drawn line icons, violet numbers, dim labels, thin dividers (an earlier project @ 20.2 s)
- frames/03-arabic-cta-card.png (not in the public repo) — Arabic CTA end card: line, follow icon, handle, sub line (an earlier project @ 4.4 s)

## Do / Don't
- **Do:** colour only the word that carries the point; cut on the beat grid; land every cut on a composed frame; bring blocks in with `vid use`; keep Arabic and English on separate lines.
- **Don't:** crossfade between scenes; reuse the same whoosh on every cut; put the brand logo in organic reels (brand rule); fake product UI; mix Latin blocks into an Arabic reel.

## Tests
- (test notes are kept in the private workspace)
<!-- One line per tested prompt: "- tests/<date>-<tool>.md — result, the owner's answer". -->
