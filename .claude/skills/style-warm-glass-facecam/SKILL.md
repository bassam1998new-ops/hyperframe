---
name: style-warm-glass-facecam
description: Build a video in the Warm Glass Face-cam look (style card warm-glass-facecam) — the presenter talks to camera while frosted-glass panels with one warm glow land exactly where he points; blur-punch text, a karaoke pill, small charts, and a shrink into a rounded picture-in-picture for the demo part. Use when the director picked this card, or the owner says "make it in the warm glass style", "glass panels over my face", "face-cam with glass cards", "PiP intro", "كروت زجاج وأنا بتكلم", or the video is a build show-off or quick tutorial with the owner on camera. Source is English 16:9; the 9:16 and Arabic versions still have to be built at the first job. Not for lecture clips or AI news.
---

# Style: Warm Glass Face-cam

A premium tech intro: a talking head, frosted-glass panels with one warm rim glow that land on his keywords and gestures, then the frame shrinks into a rounded picture-in-picture for the demo.
Card: `video-projects/_library/styles/warm-glass-facecam/style.md` — **draft** (not approved yet — say so to the owner).

**Look first:** the card has no frames yet (`frames/` is empty). Watch the source render an earlier project (not public), or snapshot it: `npx hyperframes snapshot an earlier project --at 2,8,15 -o video-projects/_library/styles/warm-glass-facecam/tests/snaps (not in the public repo)`. The source is 16:9 English — make 3–6 **9:16** frames for the card before asking the owner to approve.

## 0. Apply the card first
```bash
node tools/vid.mjs style apply warm-glass-facecam <project> [--mode calm|punchy]
node tools/vid.mjs style show warm-glass-facecam
```
For timing overlays to a talking head, the `talking-head-recut` skill has the transcript-sync pattern.

## 1. Colours = roles (the brand fills the hex)
Style = quality, structure and motion. **The terracotta (#D97757) is a third-party AI product's brand colour — never ship it for the owner's brand.** Fill the roles from `brand/<name>.md`:
| Role | Reference | From the brand |
|---|---|---|
| field behind the PiP | #05080F + faint grid + seeded stars | canvas (dark) |
| text | #FFFFFF / #F1F1F1 | text-strong |
| dim text | #B8B8B8 | muted |
| glow: panel rims, eyebrows, active caption word, chart bars | #D97757 | primary — mostly as glow, never a big fill |
| soft highlight | #F5B39A | a light tint of primary |
| glass | white at 2–10%, backdrop blur 14–18 px, saturate 1.2 | none — stays neutral |
One glow colour only. The source holds colours inline in `compositions/0*.html` — lift them to CSS variables (`--bg`, `--ink`, `--dim`, `--glow`, `--glow-soft`) when you copy them.

## 2. Build it
- **Starter code:** an earlier project (not public) — `compositions/01-hook.html`, `02-text-on-screen.html`, `03-karaoke-captions.html`, `04-mg-and-charts.html`, `05-pip.html`, plus `compositions/components/shimmer-sweep.html` and `grain-overlay.html`. **Vendor first:** the source loads GSAP (and Inter / JetBrains Mono) from a CDN — swap to `_library/assets/vendor/gsap.min.js (not in the public repo)` and `_library/assets/fonts/ (not in the public repo)` (`vid use` does this for library blocks; for copied files do it by hand).
- **Blocks:** run `node tools/vid.mjs find glass` + `director/library.md` first (liquid-glass blocks exist in `_library/compositions/`); bring any in with `node tools/vid.mjs use <block> <project>`.
- **Layout 16:9 (1920×1080, source):** full-frame face for ~12.8 s, panels in the empty half or the top band, then a 0.6 s shrink into a 540×960 PiP docked right (36 px corners, glow).
- **Layout 9:16 (1080×1920):** not built yet — at the first job: face in the lower 2/3, panels in the top band (y 220–700), karaoke pill above y 1500; PiP = a rounded card in the lower half while the demo fills the top. Keep the face uncovered and everything inside x 60–960, y 220–1500.
- **Arabic:** not built yet — use IBM Plex Sans Arabic or Cairo for panels and captions (not Inter), per word, never per letter.
- **Motion tokens:** enter expo.out · soft enter power3.out · exit power2.in · hard exit power3.in · emphasis back.out(2) · reframe power3.inOut · micro 120 / standard 350 / hero 650 ms · stagger 120 ms · chart bars 80 ms apart · blur-in 18 px.
- **Text animations:** blur-punch in (scale 1.4 + blur 12–18 px → sharp) · slide + fade from x −20 / −30 (0.32–0.35 s, expo.out) · word lines rise with 0.12 s stagger (0.55 s) · karaoke pill with a "CC" tag and the active word in the glow colour · shimmer sweep across the outro title (3 sweeps, 1.2 s each).
- **Transitions:** one continuous take; overlays change per sentence; the PiP shrink (starts 0.3 s before the keyword) replaces a cut. Animate the wrapper `<div>`, never the `<video>`.
- **Modes:** calm = as shipped (no music, no SFX) · punchy (untested) = a bed under the voice, a soft whoosh on each blur-punch (`_library/assets/sfx/el/swoosh-text.mp3 (not in the public repo)`), faster panel swaps.
- **Sound:** the face clip's own audio (`data-has-audio="true"` on the video, or a sibling `<audio>`), voice −14 LUFS. Any bed from `_library/assets/music (not in the public repo)` — never generate music.

## 3. Checks before the owner sees it
1. `npx hyperframes lint` inside the project — 0 errors, and no remote GSAP / font URLs left.
2. `npx hyperframes snapshot --at <each panel's keyword>` — Read every frame: face clear, panel lands where he points.
3. `npx hyperframes render --quality draft` → `node tools/vid.mjs judge <draft.mp4>` → Read `sheet.jpg` and `safe-sheet.jpg`.
4. Safe zone x 60–960, y 220–1500 (9:16) · face never cropped or covered · Arabic joined, right-to-left, never split per letter, no `dir="rtl"` on `<html>`.
5. Style checks: one glow colour; no third-party logo; render 30 fps unless the owner asks for 60.

## Do / Don't
- **Do:** time each panel to his gesture or keyword (word timings); keep the face uncovered; build the 9:16 and Arabic version before using it for the owner.
- **Don't:** reuse the source's third-party logo or its brand colour; load fonts or GSAP from a CDN at render time; put a panel over his face.

After the job: `node tools/vid.mjs style comment warm-glass-facecam "<what worked or not>"`.
