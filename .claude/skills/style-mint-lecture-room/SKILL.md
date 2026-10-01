---
name: style-mint-lecture-room
description: Build a video in the Mint Lecture Room look (style card mint-lecture-room) — a calm classroom cut of a real lesson: one long take with slow zooms that follow the point, a topic lower third, a quiz card that asks, counts down think-time and then answers, and karaoke captions that light the current word. Use when the director picked this card, or the owner says "make it in the lecture room style", "lecture clip", "course cut", "quiz card", "قص من المحاضرة", "سؤال وجواب", or the video is a lecture clip or quick tutorial cut from his AI course recordings (Egyptian Arabic). 9:16 reels. Not for AI news or direct offers.
---

# Style: Mint Lecture Room

A calm classroom cut: the lesson plays on, slow zooms follow the point, a quiz card asks, waits, then answers. No cuts on silence — zooms replace cuts.
Card: `video-projects/_library/styles/mint-lecture-room/style.md` — **draft** (not approved yet — say so to the owner). Card brand: any (the hex values are examples).

**Look first** (in the style folder): `frames/01-lesson-lower-third-karaoke.png (not in the public repo)` · `frames/02-question-think-rail.png (not in the public repo)` · `frames/03-answer-reveal.png (not in the public repo)`. Source project (still builds; its old render was cleaned away): an earlier project (not public).

## 0. Apply the card first
```bash
node tools/vid.mjs style apply mint-lecture-room <project> [--mode calm|punchy]
node tools/vid.mjs style show mint-lecture-room
```
Job steps (picking the clip, captions): `brain/Jobs/Lecture clip.md`.

## 1. Colours = roles (the brand fills the hex)
Style = quality, structure and motion. The midnight + mint + pink is the Midnight reference — another brand fills the roles from `brand/<name>.md`.
| Role | Example colour (not a real brand) | From the brand |
|---|---|---|
| field behind cards | #1F1428 | canvas (dark) |
| body ink / spoken words | #E5DAED / #FFFFFF | text / text-strong |
| rules, glows, chip tint | #A05FEF | primary |
| "now": active caption word, progress rail, number chip | #6FDCDA | the scarce highlight (Midnight: mint) |
| punctuation: question mark, payoff dot | #F36D78 | the brand's punctuation colour (Midnight: pink) — a mark only |
| dim text | #CCB1DF / #C18AF6 | muted |
The lecture-* blocks hold these colours **inline** — lift them to CSS variables (e.g. `--bg`, `--ink`, `--accent`, `--live`, `--mark`, `--dim`) when you bring them in, then fill from the brand.

## 2. Build it
- **Blocks** (`_library/compositions/portrait/`), bring each in with `node tools/vid.mjs use <block> <project>`:
  - `lecture-lower-third-9x16` — topic / name strap (0–6 s).
  - `lecture-question-card-9x16` — 8 s question → 3 s think-time rail → answer.
- **Starter project:** an earlier project (not public) — one lesson `<video>`, both blocks wired, karaoke captions, the zoom timeline.
- **Footage:** one continuous lesson clip, re-encoded first (`ffmpeg … -crf 20 … -movflags +faststart`, dense keyframes — `_library/COURSE-STUDIO.md (not in the public repo)`).
- **Layout 9:16 (1080×1920):** footage fills the frame; lower third and question card sit in the middle band; captions 42 px/700; everything inside x 60–960, y 220–1500. Fonts: Tajawal 500/700 (Arabic), JetBrains Mono 700 (number chip, kicker).
- **Layout 16:9:** not built yet.
- **Camera (motion tokens):** on a wrapper `<div>` around the video (never the `<video>`), origin 50% 35%: slow drift 1 → 1.06 (power1.inOut), a 3 s punch-in to 1.25 (power2.inOut), a long ease back out, a 1.4 s punch-in to 1.2 on the closing line. The zoom never moves while a card is up.
- **Text animations:** question lines rise from a mask (y 110% → 0, 0.55 s, 0.22 s stagger from the right) · kicker and number chip drop in (y −12, 0.45 s) · a rule draws scaleX 0 → 1 (0.55 s) · progress rail fills over 3 s linear · answer scale-pops 0.92 → 1 back.out(1.5) + the payoff dot slides in · karaoke: all words at 35%, current word in the "now" colour with a soft glow, spoken words full white (instant class switch).
- **Transitions:** none between shots (single take); cards fade in and out on their own layer (exit 0.4–0.5 s power2.in).
- **Modes:** calm = as shipped (one take, slow zooms, no music, no SFX) · punchy (untested) = jump-cut the silences, snap zooms on key words, soft tick when the answer lands (`_library/assets/sfx/el/ui-pop.mp3 (not in the public repo)`).
- **Sound:** the lecture's own audio only, normalise the voice to −14 LUFS. No music in calm; if ever needed, from `_library/assets/music (not in the public repo)` — never generate.

## 3. Checks before the owner sees it
1. `npx hyperframes lint` inside the project — 0 errors.
2. `npx hyperframes snapshot --at <lower third, question, rail half, answer>` — Read every frame.
3. `npx hyperframes render --quality draft` → `node tools/vid.mjs judge <draft.mp4>` → Read `sheet.jpg` and `safe-sheet.jpg`.
4. Safe zone x 60–960, y 220–1500 · the instructor's face (if visible) not covered · Arabic joined, right-to-left, never split per letter; RTL on the block's root element, never `dir="rtl"` on `<html>`.
5. Style checks: caption words checked against the audio (the source transcript looked misheard); cards sit in the teacher's natural pauses; one pink mark per card.

## Do / Don't
- **Do:** place cards in natural pauses; give think-time before the answer; check captions against the audio.
- **Don't:** cut on silence inside the lecture; stack a card on top of an active zoom; use the punctuation colour for anything bigger than a mark.

After the job: `node tools/vid.mjs style comment mint-lecture-room "<what worked or not>"`.
