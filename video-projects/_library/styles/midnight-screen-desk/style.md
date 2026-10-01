---
id: midnight-screen-desk
name: Midnight Screen Desk
status: approved
version: 1
modes: [calm, punchy]
use_when: [ai-news, build-show-off, quick-tutorial]
avoid_when: [lecture-clip, direct-offer]
brand: any
blocks: []
skill: style-midnight-screen-desk
approved_by: the owner (chat)
approved_on: 2026-10-02
approved_words: approve all styls there
---
# Midnight Screen Desk

<!-- A STYLE CARD. One folder per style: style.md (this), frames/ (3–6 approved 9:16 style frames WE OWN —
     the real contract, sent to every AI tool as the style reference), refs/ (web inspiration: links +
     small thumbnails + credit, look only, never sent to AI tools), grade.cube (optional LUT), tests/.
     Describe TECHNIQUE, never "in the style of <living artist>". Fill every line; write "none — why" if a
     line does not apply. `vid style check <slug>` tells you what is missing. Guide: brain/Jobs/Pick a style.md -->

**Tone (one sentence):** A calm, organised news desk — the real screen in a glowing band, a clear Arabic info card above it and word-by-word captions below.
**Inspired by (technique, not a copy):** three-zone vertical layout for screen-recorded explainers (title card / screen band / captions), jump cuts with punch-ins on the part of the screen being discussed, and dim-to-bright word captions.

## Look
- **Palette:** bg #160F1C · primary #F2EAF8 (titles, captions) · accent #AB6EF3 (kickers, arrows, chip tint, top glow) · data #5EEAD4 (model names, numbers) · text dim #9D90AC (subs, stat labels) — mint only on names and numbers; violet only as glow, kicker and chip tint. _(example colours — not a real brand)_
- **Type:** Arabic IBM Plex Sans Arabic 700 / 500 · Latin the same family's Latin subset, in `dir=ltr` spans · title 92 px/700, sub 48 px/500, label 46 px/700, kicker 30 px/500, stat numbers 64 px, captions 60 px/700 at line-height 1.35 · cards right-aligned (RTL).
- **Texture:** no grain; a soft violet radial glow at the top (ellipse 90% × 30%, rgba(139,108,255,0.16)) and a vignette to 45% black at the edges.
- **Grade:** none on the screen recording — only punch-in scale; the screen band has 22 px corners, a 0 30 px 80 px black shadow and a 1 px white ring at 8%.

## Camera, light, performance
- **Camera:** no camera — a landscape screen recording in a 1080 × 600 band at y = 640; baked punch-ins per segment (1.25× on hero shots, 1.4–1.7× on articles, 1.9–2.2× on pricing tables, 1.5× on the whiteboard) plus a 4% linear push on every segment so nothing sits still.
- **Lighting:** none — screen capture; the only light is the violet top glow and the vignette.
- **Performance:** voice only, no face — Egyptian Arabic, conversational, one take cleaned: retakes, repeats, fillers and stutters cut at word boundaries with 30–80 ms pads.

## Edit
- **Rhythm:** average shot 3.5 s (24 segments over 84.2 s) · longest 7.56 s · shortest 0.42 s · cut on word boundaries; info cards change per topic beat (5.9–21.8 s, average about 10.7 s).
- **Grammar:** jump cuts on the voice, each one with a new punch-in; the story is re-ordered by beat, not source order (hook → what dropped → item 1 → item 2 → my pick → takeaway → my setup → CTA); the screen dims to 35% under the CTA card.
- **Transitions:** hard cuts in the footage; card swap = old card rises 14 px and fades (0.28 s) then is hard-killed, new card enters on the same frame.

## Motion (HTML / GSAP)
```json
{ "ease": { "enter": "power3.out", "exit": "power2.in", "emphasis": "back.out(1.6)", "push": "none", "caption_word": "power2.out" },
  "duration_ms": { "micro": 100, "standard": 400, "hero": 500 },
  "stagger_ms": 20,
  "card_line_offset_ms": [67, 133],
  "card_exit_ms": 280,
  "push_scale": 1.04 }
```
- **Text animations:** card lines rise and fade in the order kicker → label → title → sub (y 18 / 22 / 28 / 20 px, 0.4–0.5 s); stats and setup rows slide in from x −30 on the word where they are spoken; chips scale-pop 0.85 → 1 with back.out(1.6); captions: groups of 1–4 words appear at 45% opacity (y 10 → 0, 0.14 s, 0.02 s apart), then each word fills to 100% and scales to 1.06 at its spoken time (0.1 s) and stays bright.
- **Rules:** reveal each number on the word that says it; hard-kill every card at its clip end (`tl.set` opacity 0); wrap Latin runs in `dir=ltr` spans or "Opus 5.5" flips to "5.5 Opus"; `dir` only on elements, never on the html tag.

## Sound
- **Music:** `bed-focus-minimal` looped — minimal focus bed, set at −23 LUFS then side-chain ducked by the voice (−31 LUFS integrated).
- **SFX:** none in the source reel.
- **Mix:** voice normalised to −14 LUFS; the final render measured −14.3 LUFS.

## Modes
- **calm:** as shipped in an earlier project: no SFX, 4% linear push, cards change only on topic beats.
- **punchy:** not used yet — untested proposal: shorter segments, a soft whoosh on card swaps, stronger punch-ins on numbers.

## Prompt parts
<!-- Copied word for word into every image/video prompt. Content goes ONLY in {SUBJECT}. -->
- **Style block:** Dark near-black violet studio backdrop with a soft violet glow falling from the top and a dark vignette at the edges, one floating rounded panel with a deep soft drop shadow in the middle of the frame, clean even light, crisp and minimal, vertical 9:16 frame with the top third left empty for a title: {SUBJECT}
- **Keep:** near-black violet field, soft violet top glow, dark vignette, mint only as a tiny highlight, rounded panel with deep shadow.
- **Avoid:** any letters or words in the image, fake app screens or charts (the real screen recording is the proof), logos, watermarks, bright backgrounds, off-palette colours.

## Per tool
<!-- Model + version + date for each. Frames go to every tool as the style reference. -->
- **images-gpt:** not checked yet — no frames made
- **flow-veo:** not checked yet — no frames made
- **higgsfield:** not checked yet — no frames made
- **hyperframes:** motion tokens above + palette as CSS variables (`--bg`, `--text`, `--dim`, `--accent`, `--mint` in the source project)

## Frames
<!-- 3–6 approved 9:16 frames in frames/. One line each: "- frames/01.png — what it shows". -->
- frames/01-three-zones-chip.png (not in the public repo) — the three zones: Arabic card with violet kicker + chip on top, screen band in the middle, dim→bright caption below (an earlier project @ 11.5 s)
- frames/02-mint-stat-punch-in.png (not in the public repo) — mint model name and −50% stat on the card, punch-in on the pricing table (@ 33 s)
- frames/03-setup-rows.png (not in the public repo) — "my setup" rows with chips and arrows over the whiteboard band (@ 76 s)

## Do / Don't
- **Do:** keep the three zones fixed (card on top, screen band in the middle, captions below); punch in on the exact part of the screen being discussed; correct misheard model names against the screen before building captions.
- **Don't:** generate images of product UI; mix Arabic and Latin in one flex run without `dir=ltr` wrapping; leave a card on screen past its clip.

## Tests
- (test notes are kept in the private workspace)
<!-- One line per tested prompt: "- tests/<date>-<tool>.md — result, the owner's answer". -->
