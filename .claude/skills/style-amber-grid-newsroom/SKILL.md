---
name: style-amber-grid-newsroom
description: Build a video in the Amber Grid Newsroom look (style card amber-grid-newsroom) — a hot "breaking news" desk: near-black grid field, the real screen recording in a framed window with instant reframes, an English title over an Arabic title line, and karaoke captions where the spoken word turns hot. Use when the director picked this card, or the owner says "make it in the amber newsroom style", "news desk", "breaking news look", "زي ريل opus 5.5", "ستايل الأخبار", or the video is AI news or a build show-off cut from his OBS screen recording with an Egyptian Arabic voice-over. 9:16 reels. Not for lecture clips or direct offers.
---

# Style: Amber Grid Newsroom

A hot, fast news-ticker feel: a dark grid desk, the real screen inside a framed window that jumps to the part being discussed, one hot colour for the Arabic title and the spoken word.
Card: `video-projects/_library/styles/amber-grid-newsroom/style.md` — **draft** (not approved yet — say so to the owner).

**Look first** (in the style folder): `frames/01-title-pair-window.png (not in the public repo)` · `frames/02-reframe-table-karaoke.png (not in the public repo)` · `frames/03-whiteboard-crop.png (not in the public repo)`. Source project (still builds; its old renders were cleaned away): an earlier project (not public).

## 0. Apply the card first
```bash
node tools/vid.mjs style apply amber-grid-newsroom <project> [--mode calm|punchy]
node tools/vid.mjs style show amber-grid-newsroom
```

## 1. Colours = roles (the brand fills the hex)
Style = quality, structure and motion. The amber is the reference — a brand job fills the roles from `brand/<name>.md`.
| Role | CSS token (source template) | From the brand |
|---|---|---|
| field | `--bg` (#0B0A10 in the reference) | canvas — a dark one; this look needs a dark field |
| ink: captions, Latin title | `--ink` | text-strong (on dark) |
| hot: Arabic title line, the spoken word, outro emphasis | `--hot` | the brand's warm / attention colour (primary or warning) |
| window | `#win` background (#16141D) | panel / surface (dark) |
Only the hot colour is coloured, and only on the Arabic title line and the active word. No second accent.

## 2. Build it
- **Starter code (a reusable EDL builder):** an earlier project (not public) + `scripts/template.tpl`. Copy both into the project's `scripts/`, set `SRC` (the raw OBS recording), `BAND` (the screen inside the 2160×3840 recording, around y 1312) and the window rect, fill `work/edl.json` (word picks) + `work/transcript.json`, then:
  ```bash
  node scripts/build.mjs cut     # → assets/screen.mp4 + assets/voice.m4a
  node scripts/build.mjs html    # → index.html (captions, titles, screen framing)
  ```
  Steps for the cut: `brain/Jobs/Build show-off.md`. Fonts (IBM Plex Sans Arabic, Inter) and GSAP are local in that project's `assets/`.
- **Layout 9:16 (1080×1920):** title pair on top (English line above, Arabic line below — never mixed) · screen window 1032×800 at y 450 (28 px corners, 1 px white border at 14%, deep shadow) · captions below the window · everything inside x 60–960, y 220–1500.
- **Layout 16:9:** not built yet.
- **Field:** a faint 72 px square grid (white lines at 3.5%) + a hot radial haze at 7% behind the centre + a heavy vignette (to 75% black at the corners). No grain.
- **Camera (motion tokens):** instant reframes (`tl.set`) on the window wrapper between a wide 0.79× view and 1.05–1.075× crops on the area being discussed, landing on sentence starts; a +3% linear push that restarts each section. Animate the wrapper, never the `<video>`.
- **Text animations:** title pair rises y 24 → 0 and fades in 0.35 s power3.out (Latin first, Arabic 0.1 s later) · each caption group rises y 18 → 0 in 0.18 s · karaoke = the spoken word turns hot instantly, back to ink when the next word starts · outro fades up and rises 30 px.
- **Transitions:** hard reframe cuts inside one continuous screen take; no exit animations — titles and captions end at their clip edge; outro = black card fades in over 0.4 s for the last ~3.8 s.
- **Modes:** calm = as shipped (instant reframes, slow 3% push, no music, no SFX) · punchy (untested) = more reframes, a tick SFX on each reframe (`_library/assets/sfx/el/ui-click.mp3 (not in the public repo)`), a tight bed under the voice.
- **Sound:** voice only (Egyptian Arabic), normalise to −14 LUFS. Any bed comes from `_library/assets/music (not in the public repo)` — never generate music.

## 3. Checks before the owner sees it
1. `npx hyperframes lint` inside the project — 0 errors.
2. `npx hyperframes snapshot --at <each section start + 1 s>` — Read every frame: the reframe shows what the voice names.
3. `npx hyperframes render --quality draft` → `node tools/vid.mjs judge <draft.mp4>` → Read `sheet.jpg` and `safe-sheet.jpg`.
4. Safe zone x 60–960, y 220–1500 · Arabic joined, right-to-left, Latin numbers inside Arabic lines in `<bdi dir="ltr">`, never split per letter, no `dir="rtl"` on `<html>`.
5. Style checks: one hot word at a time; check model names in captions against the screen; no private data in any crop.

## Do / Don't
- **Do:** keep the hot colour for the one hot thing on screen; reframe on the sentence that talks about that area; keep English above and Arabic below in the title.
- **Don't:** add a second accent colour; use AI images as product proof; animate width/height on the video (move the wrapper).

After the job: `node tools/vid.mjs style comment amber-grid-newsroom "<what worked or not>"`.
