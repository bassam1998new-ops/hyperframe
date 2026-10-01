---
name: style-floating-desk-zoom
description: Build a video in the Floating Desk Zoom look (style card floating-desk-zoom) — real app windows float as cards on warm paper, a virtual camera hard-cuts in on the action, follows the typing and glides back out. Use when the director picked this card, or the owner says "make it in the floating desk style", "paper desk", "zoom on the screen like the launch video", "اعمله على الورق", or the video is a build show-off, quick tutorial or AI news made from his OBS screen recording with a voice-over. Arabic or English; 9:16 reels. Not for lecture clips or talking heads.
---

# Style: Floating Desk Zoom

A calm, premium product demo: the real app windows float as cards on a soft desk, the camera cuts IN close on what changes and glides OUT slowly. Built from real screen recordings only — never generated.
Card: `video-projects/_library/styles/floating-desk-zoom/style.md` — **approved** 2026-10-02.

**Look first** (in the style folder): `frames/01-wide.png (not in the public repo)` · `frames/04-punch-in.png (not in the public repo)` · `frames/02-glide-dim.png (not in the public repo)` (also `frames/03-card.png (not in the public repo)`).

## 0. Apply the card first
```bash
node tools/vid.mjs style apply floating-desk-zoom <project> [--mode calm|punchy]
node tools/vid.mjs desk help
```

## 1. Colours = roles (the brand fills the hex)
Style = quality, structure and motion. The warm paper is the reference — swap it when the brand has its own canvas.
| Role | Where to set it | From `brand/<name>.md` |
|---|---|---|
| desk / paper | `look.bg` in `director/desk.json` (default `#E9E4DB`) | canvas (light brands); keep it soft and light |
| card shadow | `look.shadow` (warm brown, two layers) | a shadow tinted from the canvas, never hard black |
| dim on the unused window | `look.dim` (0.55, `0` = off) | none — grey, not a brand colour |
| titles / captions on top | your own layer above the desk | text-strong (ink on paper), accent = primary, one word only |
The app's own colours carry the rest — no extra accent on the desk.

## 2. Build it
- **The tool is `vid desk`** (`tools/vid/desk.mjs`):
  ```bash
  node tools/vid.mjs desk init <project> <recording.mp4> [--from s] [--to s]   # crop the desktop → assets/screen.mp4 + assets/voice.m4a, scan, write director/desk.json
  # edit director/desk.json: cards [{id, rect}], shots [{at, card, focus, move:"cut"|"glide", dur, pan}], look {…}
  node tools/vid.mjs desk build <project>                                      # → compositions/floating-desk.html; paste the printed host <div> into index.html
  ```
  `vid desk scan <video>` shows where the screen changes (typing, panels, scrolls) — put punch-ins there. The owner's OBS recordings are 2160×3840 with the desktop in the middle band; `init` crops it.
- **Own-camera variant** (paper look with more control): an earlier project (not public) + `build_cut_hd.py` (a full-res second cut so punch-ins stay sharp).
- **Layout 9:16 (1080×1920):** wide = card ~90% of the width, centred at y 900. A punched card stays full-width but inside y 420–1240 so kicker text and captions sit on paper. Keep text out of y 330–1470 when the card is wide.
- **Layout 16:9:** not built yet.
- **Camera (motion tokens):** cut IN (hard cut, max 1.6 output px per source px) → hold with a 2.5% linear push (`#fd-drift`) and optional pan along the typing (sine.inOut) → glide OUT 1.2–1.4 s power3.inOut → slide sideways to the next window. A move every 3–6 s, never two moves closer than 1.5 s.
- **Never animate the `<video>`** — only `#fd-cam` (move / zoom) and `#fd-drift` (push).
- **Text:** none built in. Titles, captions and count-ups go in a separate layer above the desk (Arabic: IBM Plex Sans Arabic, ink on paper).
- **Transitions:** only the camera moves; no wipes, no flashes.
- **Modes:** calm = as `vid desk` builds it (drift 2.5%, glides 1.2–1.4 s, no SFX) · punchy (untested) = glides 0.7 s expo.inOut, drift 4%, tick on punch-ins.
- **Sound:** voice −14 LUFS, a soft minimal bed from `_library/assets/music (not in the public repo)` at about −23 LUFS, ducked. Optional soft whoosh on glides (`_library/assets/sfx/el/whoosh-slow.mp3 (not in the public repo)`). Never generate music.

## 3. Checks before the owner sees it
1. `npx hyperframes lint` inside the project — 0 errors (a `duplicate_media_discovery_risk` warning with 2+ cards is harmless).
2. `npx hyperframes snapshot --at <each shot time>` — Read every frame: text sharp, no black strip under the browser.
3. `npx hyperframes render --quality draft` → `node tools/vid.mjs judge <draft.mp4>` → Read `sheet.jpg` and `safe-sheet.jpg`.
4. Safe zone x 60–960, y 220–1500 · Arabic captions joined, right-to-left, never split per letter, no `dir="rtl"` on `<html>`.
5. Style checks: `desk build` lists shots capped at max zoom — fix them; **check every punch-in for private data** (keys, emails, client names) and blur or cut it; captions switch to ink once the paper is on screen.

## Do / Don't
- **Do:** ask for recordings with big app fonts (125–150%) and 1–2 s pauses between steps; punch in on the exact word he names (model label, price toast, prompt); ring it in ink on light UI, paper on dark UI.
- **Don't:** dim the windows in a side-by-side compare (the owner: "drop the dim"); zoom past 1.6×; stack moves closer than 1.5 s; keep chips that repeat what the screen already shows; show private data.

After the job: `node tools/vid.mjs style comment floating-desk-zoom "<what worked or not>"`.
