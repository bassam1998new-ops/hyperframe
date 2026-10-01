---
id: mint-lecture-room
name: Mint Lecture Room
status: approved
version: 1
modes: [calm, punchy]
use_when: [lecture-clip, quick-tutorial]
avoid_when: [ai-news, direct-offer]
brand: any
blocks: [lecture-lower-third-9x16, lecture-question-card-9x16]
skill: style-mint-lecture-room
approved_by: the owner (chat)
approved_on: 2026-10-02
approved_words: approve all styls there
---
# Mint Lecture Room

<!-- A STYLE CARD. One folder per style: style.md (this), frames/ (3–6 approved 9:16 style frames WE OWN —
     the real contract, sent to every AI tool as the style reference), refs/ (web inspiration: links +
     small thumbnails + credit, look only, never sent to AI tools), grade.cube (optional LUT), tests/.
     Describe TECHNIQUE, never "in the style of <living artist>". Fill every line; write "none — why" if a
     line does not apply. `vid style check <slug>` tells you what is missing. Guide: brain/Jobs/Pick a style.md -->

**Tone (one sentence):** A calm classroom cut — the lesson plays on, slow zooms follow the point, and a quiz card asks, waits, then answers.
**Inspired by (technique, not a copy):** lecture-capture recuts with a question → think-time → answer beat, a progress rail as a countdown, and karaoke captions that light the current word.

## Look
- **Palette:** bg #1F1428 (behind footage and cards) · primary #E5DAED (body ink) / #FFFFFF (past caption words, answer) · accent #A05FEF (rules, glows, chip tint) · live #6FDCDA (active caption word, progress rail, number chip) · punctuation #F36D78 (question mark, payoff dot) · text dim #CCB1DF / #C18AF6 — pink only as punctuation, mint only for "now" (active word, progress). _(example colours — not a real brand)_
- **Type:** Arabic Tajawal 500 / 700 · Latin JetBrains Mono 700 (number chip, kicker) and Tajawal Latin · question 66–72 px, answer 46 px, lower-third name 44 px, captions 42 px/700, kicker 17–25 px.
- **Texture:** none on footage; cards are midnight glass panels (rgba(21,15,35) at 0.44–0.86) with a soft violet glow (rgba(124,92,252,0.18–0.25)); the question card field has a centre-light radial vignette.
- **Grade:** none — footage as recorded (re-encoded only).

## Camera, light, performance
- **Camera:** one continuous 38 s lesson clip (a screen recording of course slides with the course's own header, yellow title and progress bar already burned in) filling the 9:16 frame; a slow drift 1 → 1.06, a 3 s punch-in to 1.25, a 15.6 s ease back out, and a 1.4 s punch-in to 1.2 on the closing line (transform origin 50% 35%).
- **Lighting:** none — screen capture; the cards carry their own violet glow.
- **Performance:** the instructor's live lecture voice (Egyptian Arabic), unscripted, not re-cut.

## Edit
- **Rhythm:** no cuts — one 38 s take · longest shot 38 s · zoom beats 1.4–15.6 s · cards placed in natural pauses: lower third 0–6 s, question card 13–21 s (8 s).
- **Grammar:** no cuts on silence; punch-in zooms replace cuts; question → 3 s think-time rail → answer reveal inside the card.
- **Transitions:** none between shots (single take); cards fade in and out over their own layer (exit 0.4–0.5 s power2.in).

## Motion (HTML / GSAP)
```json
{ "ease": { "enter": "power3.out", "exit": "power2.in", "emphasis": "back.out(1.5)", "zoom": "power2.inOut", "drift": "power1.inOut", "rail": "none" },
  "duration_ms": { "micro": 180, "standard": 450, "hero": 550 },
  "stagger_ms": 220,
  "think_time_ms": 3000,
  "zoom_scale": { "drift": 1.06, "punch": 1.25, "closing": 1.2 } }
```
- **Text animations:** question lines rise from behind a mask (y 110% → 0, 0.55 s, stagger 0.22 s from the right); kicker and number chip drop in (y −12, 0.45 s); a rule draws scaleX 0 → 1 (0.55 s); progress rail fills over 3 s linear; answer card scale-pops 0.92 → 1 with back.out(1.5) and a pink payoff dot slides in; karaoke captions: all words at 35% white, the current word mint with a soft mint glow, spoken words white (instant class switch).
- **Rules:** give the viewer think-time before the answer; one pink mark per card; the zoom never moves while a card is up; wrap Arabic in RTL on the root element, never on the html tag.

## Sound
- **Music:** none — the lecture's own audio only.
- **SFX:** none.
- **Mix:** source audio at volume 1; loudness not recorded — unknown, decide at the first job.

## Modes
- **calm:** as shipped in an earlier project: one take, slow zooms, no music, no SFX.
- **punchy:** not used yet — untested proposal: jump-cut the silences, snap zooms on key words, a soft tick when the answer lands.

## Prompt parts
<!-- Copied word for word into every image/video prompt. Content goes ONLY in {SUBJECT}. -->
- **Style block:** Deep midnight-violet classroom mood, soft centre light fading to a dark vignette, one frosted dark glass card with a faint violet glow, a thin mint line as the only bright colour, calm and uncluttered, soft even light, vertical 9:16 frame: {SUBJECT}
- **Keep:** midnight-violet field, frosted dark glass, faint violet glow, one thin mint highlight, calm negative space.
- **Avoid:** any letters or words in the image, fake slides or app screens, logos, watermarks, busy backgrounds, bright pink areas (pink is punctuation only), grain.

## Per tool
<!-- Model + version + date for each. Frames go to every tool as the style reference. -->
- **images-gpt:** not checked yet — no frames made
- **flow-veo:** not checked yet — no frames made
- **higgsfield:** not checked yet — no frames made
- **hyperframes:** motion tokens above + palette as CSS variables (the lecture-* blocks hold the colours inline — lift them to variables when applying)

## Frames
<!-- 3–6 approved 9:16 frames in frames/. One line each: "- frames/01.png — what it shows". -->
- frames/01-lesson-lower-third-karaoke.png (not in the public repo) — lesson footage with the midnight-glass lower third and one karaoke line, current word mint (test build @ 2.5 s)
- frames/02-question-think-rail.png (not in the public repo) — quiz card: question with pink ?, mint think-time rail half full (@ 15.6 s)
- frames/03-answer-reveal.png (not in the public repo) — answer card revealed under the question, mint border, pink payoff dot (@ 19 s)

## Do / Don't
- **Do:** place cards in the teacher's natural pauses; let the rail count down before the answer; check the caption words against the audio (the source transcript looks misheard).
- **Don't:** cut on silence inside the lecture; stack a card on top of an active zoom; use pink for anything bigger than a mark.

## Tests
- (test notes are kept in the private workspace)
<!-- One line per tested prompt: "- tests/<date>-<tool>.md — result, the owner's answer". -->
