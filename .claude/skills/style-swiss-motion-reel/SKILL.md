---
name: style-swiss-motion-reel
description: Build a video in the Swiss Motion Reel look (style card swiss-motion-reel) — a Swiss-grid "instrument panel" with a constant thin HUD, flat 2-colour blocks, word slams, shape match-cuts and hard cuts on a 128 BPM beat. Use when the director picked this card, or the owner says "make it in the Swiss style", "motion reel", "like the motion designer reel", "HUD reel", "ستايل سويسري", or the video is a brand sizzle, product intro, "what we do" reel, launch teaser or any no-person, graphics-only, music-led video. Latin display type with Arabic in a clean geometric sans; built and tested in 16:9, 9:16 still to build. Not for talking heads, screen-recording tutorials or long voice-led explainers.
---

# Style: Swiss Motion Reel

A precise, confident motion-design reel: Swiss grid, a thin HUD on every scene, 2 colours + ink, every scene a small demo of motion itself, cut hard on the beat.
Card: `video-projects/_library/styles/swiss-motion-reel/style.md` — **approved** 2026-10-02.

**Look first** (in the style folder, 16:9 from our copy test): `frames/01-chart-start.png (not in the public repo)` · `frames/02-race-blur.png (not in the public repo)` · `frames/03-settle-ticks.png (not in the public repo)`. Test notes: `tests/2026-09-27-hyperframes-copy.md (not in the public repo)`.

## 0. Apply the card first
```bash
node tools/vid.mjs style apply swiss-motion-reel <project> [--mode calm|punchy]
node tools/vid.mjs style show swiss-motion-reel
```

## 1. Colours = roles (the brand fills the hex)
Style = quality, structure and motion. The paper / blue / red is the reference — never ship it unless the brand says so.
| Role | CSS token (suggested) | From `brand/<name>.md` |
|---|---|---|
| paper / canvas | `--paper` | canvas |
| primary block | `--primary` | primary (brand) |
| accent block (max 10% in calm) | `--accent` | accent or danger, used sparingly |
| ink | `--ink` | text-strong |
| "good" numbers | `--ok` | success |
Only 2 colours + ink on screen at once.

## 2. Build it
- **Starter code:** an earlier project (not public) — the HUD (corner brackets, brand + "MOTION REEL — year", "NN — SCENE NAME", timecode + fps, BPM + 4 beat squares + BAR n/8, progress line) and the six-ease chart scene. Copy it into the project's `compositions/` and keep the HUD constant across every scene.
- **Blocks:** run `node tools/vid.mjs find <term>` + `director/library.md` first. Useful: `mk-scale-pop-portrait`, `mk-ramped-type-portrait`, `mk-line-mask-portrait` (text); a three.js block (e.g. `code-particle-assemble`) for the one point-cloud moment. Bring each in with `node tools/vid.mjs use <block> <project>` (swaps CDN GSAP/three for local copies).
- **Fonts:** Instrument Serif **italic** for display — only the regular (`_library/assets/fonts/instrument-serif-latin-400-normal.woff2 (not in the public repo)`) is vendored; vendor the real italic file first (fake browser slant looks worse). Mono caps labels: JetBrains Mono (vendored). Never name a font face "Serif" — it falls back to sans (use "InstSerif").
- **Layout 16:9 (1920×1080):** as the copy test (built at 1280×720). **9:16 (1080×1920):** not built yet — move the HUD to the corners of the 1080×1920 frame and keep scene content inside x 60–960, y 220–1500.
- **Rhythm:** 128 BPM = 0.469 s per beat, 1.875 s per bar; scenes 1.2–2 s (max 2.5 s); big changes on bar starts. Get the grid with `node video-projects/_library/beat-grid.mjs (not in the public repo) <music file>`.
- **Motion tokens:** enter expo.out · exit power3.in · emphasis back.out(2.6) · micro 120 ms · standard 300 ms · hero 940 ms · stagger 15 ms.
- **Text animations:** word slam (scale 1.4 → 1, 120 ms) · letters collapse into dots · italic serif sub-line fades up · mono labels type on.
- **Transitions:** hard cut on the beat · shape match-cut (a dot becomes the next scene's shape) · colour-block wipe · fly-out with fake motion blur (scaleX stretch by speed + blur, max 7 px) and ghost rings.
- **Modes:** calm = 100–110 BPM, fewer flashes, accent only as small dots (B2B brands like a light B2B brand) · punchy = 128 BPM, full-frame colour blocks, faster slams, more SFX.
- **Sound:** electronic / minimal tech, 120–128 BPM, from `_library/assets/music (not in the public repo)` (never generate music). SFX at most one per beat: tick on beat squares (`_library/assets/sfx/el/ui-click.mp3 (not in the public repo)`), whoosh on fly-outs (`whoosh-fast.mp3`), soft hit on the logo (`impact-soft.mp3`). Music-led at −14 LUFS; with a voice, music about −18 LUFS under it.

## 3. Checks before the owner sees it
1. `npx hyperframes lint` inside the project — 0 errors.
2. `npx hyperframes snapshot --at <mid-scene + exit of each scene>` — Read every frame: HUD present and the same, 2 colours + ink only.
3. `npx hyperframes render --quality draft` → `node tools/vid.mjs judge <draft.mp4>` → Read `sheet.jpg` and `safe-sheet.jpg`.
4. Safe zone (9:16) x 60–960, y 220–1500 · Arabic in a geometric sans, joined, right-to-left, never split per letter or slammed per letter, no `dir="rtl"` on `<html>`.
5. Style checks: cuts land on beats (compare times with the beat grid); deterministic only (seeded random); render 30 fps unless the owner asks for 60 (twice the render time).

## Do / Don't
- **Do:** keep the HUD constant — it ties the reel together; build each scene from the previous scene's last shape; time everything from the BPM.
- **Don't:** use the reference's loud red for a calm brand; fake 3D with CSS when a point cloud is the hero (use three.js); let the exit just fly off — fold and converge into the next shape.

After the job: `node tools/vid.mjs style comment swiss-motion-reel "<what worked or not>"`.
