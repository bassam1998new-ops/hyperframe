---
name: style-midnight-screen-desk
description: Build a video in the Midnight Screen Desk look (style card midnight-screen-desk) — a calm, organised news desk in three fixed zones: an Arabic info card on top, the real screen recording in a glowing band with punch-ins in the middle, and word-by-word captions (dim → bright) below. Use when the director picked this card, or the owner says "make it in the screen desk style", "three zones", "like the AI releases reel", "كارت فوق والشاشة في النص", or the video is AI news, a build show-off or a quick tutorial cut from his screen recording with an Egyptian Arabic voice-over. 9:16 reels. Not for lecture clips or direct offers.
---

# Style: Midnight Screen Desk

A calm, organised news desk: the real screen in a glowing band, a clear Arabic info card above it and word-by-word captions below; jump cuts on the voice, each with a new punch-in.
Card: `video-projects/_library/styles/midnight-screen-desk/style.md` — **draft** (not approved yet — say so to the owner).

**Look first** (in the style folder): `frames/01-three-zones-chip.png (not in the public repo)` · `frames/02-mint-stat-punch-in.png (not in the public repo)` · `frames/03-setup-rows.png (not in the public repo)`. Source project (still builds; its old renders were cleaned away): an earlier project (not public).

## 0. Apply the card first
```bash
node tools/vid.mjs style apply midnight-screen-desk <project> [--mode calm|punchy]
node tools/vid.mjs style show midnight-screen-desk
```

## 1. Colours = roles (the brand fills the hex)
Style = quality, structure and motion. The violet + mint is the reference — a brand job fills the roles from `brand/<name>.md`.
| Role | CSS token (source project) | From the brand |
|---|---|---|
| field | `--bg` | canvas (dark) |
| titles, captions | `--text` | text-strong |
| subs, stat labels, unspoken caption words | `--dim` | muted |
| kicker, arrows, chip tint, top glow (never a fill) | `--accent` | primary |
| data: model names, numbers | `--mint` | the brand's scarce highlight (Midnight: mint) |
Mint only on names and numbers; the accent only as glow, kicker and chip tint.

## 2. Build it
- **Starter code:** an earlier project (not public) — `build_cut.py` (segments with in / out / punch-in scale / focus → `assets/cut.mp4`) and `build_comp.py` (writes `index.html`: video band + Arabic title cards + word captions from `assets/words.json` + `edit/edl.json`). Copy them, set `SRC` to the new recording and the segment list, run the cut, then the comp. Steps for the cut and EDL: `brain/Jobs/Build show-off.md`.
- **Layout 9:16 (1080×1920), three fixed zones:** info card on top (right-aligned, RTL: kicker 30 px → label 46 px → title 92 px → sub 48 px) · screen band 1080×600 at y 640 (22 px corners, deep shadow, 1 px white ring at 8%) · captions below (60 px/700, line-height 1.35). Keep text inside x 60–960, y 220–1500.
- **Layout 16:9:** not built yet.
- **Field:** soft accent radial glow at the top (ellipse 90% × 30%, about 16%) + a vignette to 45% black at the edges. No grain.
- **Camera (baked in the cut):** punch-ins per segment — 1.25× hero shots, 1.4–1.7× articles, 1.9–2.2× pricing tables, 1.5× whiteboard — plus a 4% linear push on every segment so nothing sits still.
- **Motion tokens:** enter power3.out · exit power2.in · emphasis back.out(1.6) · card lines 67–133 ms apart · card exit 280 ms · caption words 20 ms apart.
- **Text animations:** card lines rise and fade in the order kicker → label → title → sub (y 18 / 22 / 28 / 20 px, 0.4–0.5 s) · stats and setup rows slide in from x −30 on the word that says them · chips scale-pop 0.85 → 1 · captions: groups of 1–4 words appear at 45% (y 10 → 0, 0.14 s), each word fills to 100% and scales to 1.06 at its spoken time and stays bright.
- **Transitions:** hard jump cuts on word boundaries (30–80 ms pads); card swap = old card rises 14 px and fades 0.28 s, then hard-kill; new card enters on the same frame; the screen dims to 35% under the CTA card.
- **Modes:** calm = as shipped (no SFX, 4% push, cards change only on topic beats) · punchy (untested) = shorter segments, soft whoosh on card swaps, stronger punch-ins on numbers.
- **Sound:** voice −14 LUFS (cleaned: retakes, fillers and stutters cut at word boundaries) · bed `_library/assets/music/el/bed-focus-minimal.mp3 (not in the public repo)` looped at −23 LUFS, side-chain ducked by the voice · no SFX in calm. Never generate music.

## 3. Checks before the owner sees it
1. `npx hyperframes lint` inside the project — 0 errors.
2. `npx hyperframes snapshot --at <each card's hero moment>` — Read every frame: zones fixed, the punch-in shows what the voice names.
3. `npx hyperframes render --quality draft` → `node tools/vid.mjs judge <draft.mp4>` → Read `sheet.jpg` and `safe-sheet.jpg`.
4. Safe zone x 60–960, y 220–1500 · Arabic joined and right-to-left; Latin runs wrapped in `dir="ltr"` spans (or "Opus 5.5" flips to "5.5 Opus"); `dir` only on elements, never on `<html>`.
5. Style checks: every number appears on the word that says it; every card is hard-killed at its clip end (`tl.set` opacity 0); misheard model names corrected against the screen before building captions; no private data in any punch-in.

## Do / Don't
- **Do:** keep the three zones fixed; punch in on the exact part of the screen being discussed; re-order the story by beat (hook → what dropped → items → my pick → takeaway → CTA).
- **Don't:** generate images of product UI; mix Arabic and Latin in one flex run without `dir="ltr"` wrapping; leave a card on screen past its clip.

After the job: `node tools/vid.mjs style comment midnight-screen-desk "<what worked or not>"`.
