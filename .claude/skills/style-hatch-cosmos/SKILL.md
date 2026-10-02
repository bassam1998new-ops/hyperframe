---
name: style-hatch-cosmos
description: Build a video in the Hatch Cosmos look (style card hatch-cosmos) — a hand-drawn pencil-hatched world on one canvas, a block mascot (or a pair) that walks, looks, blinks and does ^ ^ eyes, a dive through its eye into a hatched galaxy of nebula blobs, tilted rings and needle stars. Use when the director picked this card, or the owner says "hatched", "hatch cosmos", "pencil cosmos", "the galaxy video style", "the mascot dive", "زي فيديو المجرة", "الستايل المرسوم بالقلم", "الكائن اللي بيدخل في عينه", or the video is a music-led show-off/teaser, a concept intro with a mascot, a "journey inside" beat or a channel bumper. 9:16 and 16:9 both built. Not for talking heads, real screen-recording proof, data-heavy explainers or photographic looks.
---

# Style: Hatch Cosmos

A warm hand-drawn cosmos: flat fills under short diagonal pencil hatching, ink outlines, a block mascot that acts, and ONE signature move — the camera dives into the mascot's eye, the eye becomes a phone-shaped window, and the next scene rolls in.
Card: `video-projects/_library/styles/hatch-cosmos/style.md` (status **approved** by the owner on 2026-10-02).

**Look first** (in the style folder): `frames/01-pair-happy-eyes.png` · `frames/02-eye-window-dive.png` · `frames/03-deep-galaxy.png` · `frames/04-paper-walk.png`. Reference (look only): `refs/ref-contact-sheet.jpg (not in the public repo)`, `refs/ref-dive-30fps.jpg (not in the public repo)`. Colours follow the brand: `tests/2026-10-02-themes-and-looks.jpg (not in the public repo)`.

## 0. Apply the card first
```bash
node tools/vid.mjs style apply hatch-cosmos <project> [--mode calm|punchy]
node tools/vid.mjs style show hatch-cosmos
```
Then read the kit README: `video-projects/_library/assets/kits/hatch/README.md`. Don't hand-draw what the kit has.

## 1. Colours = roles (the brand fills the hex)
Style = quality and motion. **Never ship the reference orange / space unless the brand says so.**
`HATCH.kit({ theme: "<name>" | { …tokens } })`:
| Token | Role | From the brand |
|---|---|---|
| `canvas` / `halo` | space, galaxy halo | canvas / surface |
| `ink` | outlines, eyes, dark pencil | text-strong (darkest) |
| `paper` / `light` | paper sheet, pale pencil lines | light canvas / white-ish |
| `hero` / `buddy` | the two mascot bodies | primary / surface or secondary |
| `a1..a6` | rings, dots, planets, rays — `a2` makes the BIG masses | brand accents; `a2` = a calm one, never the "punctuation" colour |
| `clouds` | nebula fills | leave out → derived (never hand-set) |
Saved: `cosmos` (reference, tests only), `midnight`. Mascot hatch / light / glow derive from the body colour.

## 2. Build it
- **Start from a demo block** (copies `hatch.js`, GSAP, the whoosh):
  ```bash
  node tools/vid.mjs use hatch-cosmos-9x16 <project>    # _library/compositions/portrait/hatch-cosmos-9x16.html (6 s)
  node tools/vid.mjs use hatch-cosmos-16x9 <project>    # _library/compositions/hatch-cosmos-16x9.html (6 s)
  ```
  Wire the printed `<div … data-composition-src=…>` with `data-variable-values='{"theme":"<brand>","look":"space|paper"}'`. `vid use` keeps existing files — after a kit update copy `hatch.js` again. Demo renders: `styles/hatch-cosmos/tests/demo-9x16-20261002.mp4`, `demo-16x9-20261002.mp4`.
- **A new scene with the kit** (one `<canvas class="clip" data-layout-allow-overflow>` per composition):
  1. `var K = HATCH.kit({ w, h, seed, theme })` — then build EVERY shape once, in a fixed order (the rng is consumed in build order): `K.blob`, `K.planet`, `K.stars`, `K.galaxy()`, `K.travel({ ys, xs, look })`, `K.mascot(...)`, `K.speed()`.
  2. One GSAP proxy tween `{t:0→DUR}` with `onUpdate → draw(t)`; register `window.__timelines[id]` **inline** in the HTML (lint must see it).
  3. `draw(t)` looks the canvas up lazily (the bundler may hoist scripts), draws only from `t`, ends with `K.lift(ctx, 3)`.
  4. Montage scenes = new `draw` functions on the same kit parts (blobs, rings, planets, sparkles, `K.wobble` outlines); change them with hard cuts or a dive.
- **Mascot rig:** `var m = K.mascot({ role: "hero", radius: 7, mark(c, BW, BH) })`; `K.drawMascot(c, m, x, y, scale, state)` with `state = { walk: t, walkAmt, legWiggle, look -1..1, eyes: "open"|"happy"|"blink", wave, waveSide, zoom: camScale, glowAmt }`. Act in small windows (`HATCH.win`, `HATCH.sstep`): look at the buddy → ^ ^ (~0.6 s) → blink → wave. `glowAmt: 0` on paper. Logos on a mascot only when the brand says so.
- **The dive:** `var D = K.dive({ z0, z1, smax: 160, eyeScale, centre, target: t => K.eyePoint(x, y, scale, -1), inner: { start, end, zEnd, fitK, roll: -0.9 } })`, then per frame `D.frame(ctx, t, drawOuter, drawInner, K.speed(), grain)`. Defaults match the reference: settle the walk 0.45 s before `z0`, push ~0.85 s, window covers ~0.8 s in, inner scene settles by `end`. Whoosh `sfx/el/whoosh-tonal.mp3` at `z0 − 0.15`.
- **Layout 9:16 (1080×1920):** pair centred on the safe zone (510, 860), scale 1.2, 410 px apart; `centre: [510, 860]` so the eye and the galaxy core land inside x 60–960, y 220–1500; travel `ys 1.6, xs 0.6`. Bottom 20% background only.
- **Layout 16:9:** pair at (CX ∓ 270, CY + 10), scale 1.35; galaxy `zEnd 1.35`.
- **Rhythm:** calm intro 4–6 s, dive 1.2 s, montage every 1–2 s, one 3–5 s hold, zoom back out to the mascot to end (card JSON has the motion tokens).
- **Sound:** music-led — a light, playful bed from `_library` music / bgm catalogue (never generate music); whoosh on every dive; voice −14 LUFS if there is one.

## 3. The judge loop (the owner wants "same exact quality")
1. `npx hyperframes lint` + `npx hyperframes check` inside the project — 0 errors.
2. `npx hyperframes snapshot --at <walk, mid-dive, window, settled>` — Read every frame.
3. `npx hyperframes render --quality draft` → `node tools/vid.mjs judge <mp4>` → Read `sheet.jpg` and `safe-sheet.jpg`; scan for flat frames (a one-off capture gap happened once — re-render, don't touch the code if snapshots draw fine).
4. Against the reference: matched full-size pairs (walk, mid-dive, galaxy) + **100% crops** (hatch on a blob, ring + planet, sparkles, outlines, the mascot) + a 10 fps strip of the dive for both. Sample colours with ffmpeg (region medians), not by eye.
5. Write `tests/<date>-judge-round-N.md` — one line per item, verdict same / different / can't match (why). Fix every "different", re-render, re-judge (max 5 rounds). Honest match % for look and motion in the report.

## Do / Don't
- **Do:** brand roles; build once, draw from `t`; hatch fixed to shapes and thin while zooming; act before every dive; safe zone on 9:16; 100% crops in the judge.
- **Don't:** reference colours on a brand that doesn't use them; text drawn into the canvas (words go outside, whole, never split per letter); `Math.random` / `Date.now`; boiling or fat hatch; credits on this look; approve the card yourself.

After the job: `node tools/vid.mjs style comment hatch-cosmos "<what worked or not>"`.
