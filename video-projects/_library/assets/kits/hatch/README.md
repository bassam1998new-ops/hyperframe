# hatch kit (v1)

The parts and moves for the **hatch-cosmos** style (`_library/styles/hatch-cosmos/`): a hand-drawn
"pencil cosmos" on ONE `<canvas>` — flat fills with short diagonal pencil hatching, ink outlines,
translucent nebula blobs, tilted orbit rings, ringed planets, needle sparkles, and a block mascot whose
eye becomes a window you dive through into the next scene.

**The style is the quality and the motion, not the colours.** Every colour is a role the BRAND fills.
The default theme `cosmos` is the reference look — use it for tests, not for a brand job unless the
brand says so.

Files: `hatch.js` (global `HATCH`). No CSS, no fonts, no images — everything is drawn.
Demo blocks:
- `compositions/hatch-cosmos-16x9.html` — 1920x1080, 6 s: two mascots walk → dive into the hero's eye → deep galaxy.
- `compositions/portrait/hatch-cosmos-9x16.html` — 1080x1920, 6 s, same story laid out for the reel safe zone.
Both take the variables `theme` (`cosmos` | `midnight`) and `look` (`space` | `paper`).
The demos use Claude (hero) + Codex (buddy, our design with the OpenAI knot) as an **example config only**;
the kit has generic names and no logos.

## Use it in a project
```bash
node tools/vid.mjs use hatch-cosmos-9x16 <project-slug>      # or hatch-cosmos-16x9
```
That copies the block to `compositions/` plus `hatch.js`, GSAP and the whoosh into the project's
`assets/`. Wire the printed `<div … data-composition-src=…>` into `index.html`, set
`data-variable-values='{"theme":"midnight","look":"paper"}'` if needed, then `npx hyperframes lint`.
Note: `vid use` keeps files that already exist — after a kit update copy `hatch.js` again by hand.

Your own composition with the kit:
```html
<canvas id="my-cv" class="clip" data-layout-allow-overflow width="1080" height="1920" data-start="0" data-duration="6" data-track-index="0"></canvas>
<script src="../../assets/kits/hatch/hatch.js"></script>   <!-- in BODY, before your script -->
<script>
  var K = HATCH.kit({ w: 1080, h: 1920, seed: 7, theme: "cosmos" });   // build EVERYTHING once, here (seeded)
  var hero = K.mascot({ role: "hero" }), galaxy = K.galaxy(), travel = K.travel({ ys: 1.6, xs: 0.6 });
  var state = { t: 0 }, tl = gsap.timeline({ paused: true });
  tl.to(state, { t: 6, duration: 6, ease: "none", onUpdate: function () { draw(state.t); } }, 0);
  window.__timelines["my-id"] = tl;          // inline, so lint sees it
</script>
```
Rules: build all shapes ONCE after `HATCH.kit()` (the rng is consumed in build order — same order = same
picture), draw only from `t`, look the canvas up lazily inside `draw` (the bundler may hoist scripts),
never `Math.random` / `Date.now`.

## Colours: the brand fills the roles
| Token | Role |
|---|---|
| `canvas` | space / stage |
| `halo` | galaxy halo + soft vignette |
| `ink` | outlines, eyes, dark pencil lines |
| `paper` | the paper sheet in `look: "paper"` |
| `light` | pale pencil lines, highlights |
| `star` · `core` | star specks · galaxy core glow |
| `hero` · `buddy` | the two mascot bodies (hatch / light / glow derive from them) |
| `a1`..`a6` | rings, dots, planets, rays (reference: yellow, red, orange, cyan, lavender, green) |
| `clouds` | nebula fills — leave out and they are DERIVED from `a1..a6` + `canvas` + `paper` |

`HATCH.theme(nameOrTokens, extra)` resolves a theme; `HATCH.kit({ theme })` takes a name or a token
object. Built-in: `cosmos` (reference, measured — blob fills solved for alpha 0.85 against the
reference medians) and `midnight` (brand/<name>.md: violet hero, lavender rings, pink only on one ring and a
few planets, mint scarce). The big masses come from `a2` — give `a2` a calm brand colour, never the
"punctuation" one. Proof: `styles/hatch-cosmos/tests/2026-10-02-themes-and-looks.jpg`.

## API (all seeded; draw calls take the canvas context `c` and the time `t`)
```js
var K = HATCH.kit({ w, h, seed, theme, themeExtra });
K.hatch(hw, hh, { angle, spacing, len, gapMin, gapMax, jit, keep(x,y) })  // Path2D of short pencil strokes
K.hatchFor(hex)                                   // stroke colour = fill × 0.85 (light warm) / × 0.6 (rest)
var b = K.blob(rx, ry, "pink" | "a3" | "#hex", alpha, { rot, n, spacing });  K.drawBlob(c, b, x, y, scale, rot)
var p = K.planet(r, role, ringRole);  K.drawPlanet(c, p, x, y, scale, rot, ringed)
K.dot(c, x, y, r, col, lw);  HATCH.sparkle(c, x, y, rv, rh, col, glow);  HATCH.ring(c, x, y, rx, ry, rot, col, lw, ink)
var st = K.stars(n, hw, hh);  K.drawStars(c, st, t, driftPxPerSec);  K.drawRain(c, K.rain(hw, hh))
K.paper("paper" | "grain")                        // offscreen texture canvas; draw with c.drawImage
K.drawFloor(c, K.floor(), y, x0, x1, t, speed)    // paper-mode ground line + sliding scribbles
var wb = K.wobble(K.ellipseShape(rx, ry), { amp, points, boilFps });  K.drawWobble(c, wb, t, fill, stroke, lw)
var sp = K.speed(420, 6);  K.drawSpeed(c, sp, t, x, y, amount, camScale, innerRadius)
var m = K.mascot({ role: "hero", radius: 7, mark(c, BW, BH) });  K.drawMascot(c, m, x, y, scale, state)
   // state: walk (s), walkAmt 0..1, legWiggle, look -1..1, eyes "open"|"happy"|"blink", wave 0..1, waveSide ±1, tilt, zoom, glowAmt
K.eyePoint(x, y, scale, -1)                       // the mascot's left eye on screen (dive target)
var g = K.galaxy({ stars: [hw, hh] });  K.drawGalaxy(c, g, t, { x, y, z, rot, entry })
var tr = K.travel({ ys, xs, look });  K.drawTravel(c, tr, t, cam)   // parallax layers at depths 0.25–0.9
K.trail(64, 2) + K.drawTrail(c, trail, t, feet, scale, amt, speed)  // footprint dots when walking on nothing
var D = K.dive({ z0, z1, smax, target(t), eyeScale, centre, inner: { start, end, zEnd, fitK, roll } });
D.frame(ctx, t, drawOuter(c, t, s, cam, cp), drawInner(ic, t, innerCam, at), speedLines, grain)
K.lift(ctx, 3)                                    // +3 levels: the MP4 encode lands ~3 darker than the canvas
HATCH.sstep / clamp / wrap / win / mix / rgba / geom
```

## The dive (eye → window → inner scene), measured on the reference
| Phase | Reference | Kit default |
|---|---|---|
| walk settles | stands still before the push | `freeze` 0.45 s before `z0` (demo) |
| push | slow ~0.4 s, then a fast dive | scale = exp(ln(smax) · u²), `smax` 160 |
| eye → window | eye turns into a rounded "phone" with a thick dark rim, highlight = white square | rim 5% of the eye, highlight grows with the zoom |
| surroundings | hatched body + radial pale and dark pencil lines + faint rings | `K.speed` 420 lines (55% pale), 6 rings |
| hand-off | window covers the frame ~0.8 s after the push starts | exact rounded-corner cover test → inner scene only |
| inner settle | galaxy rolls in (~0.9 rad) and settles in ~0.25 s, colour rays burst | `inner.roll` −0.9, `entry` rays |
Line weights stay pencil-thin while zooming (width × zoom^−0.7). The hatch is FIXED to its shape (no boil) like the reference; `K.wobble` has `boilFps` if a job wants boiling.
