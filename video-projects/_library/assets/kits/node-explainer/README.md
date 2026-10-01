# node-explainer kit (v2)

The parts and moves for the **neon-node-explainer** style (`_library/styles/neon-node-explainer/`):
a plain stage, one headline per beat with 1–3 key words in the accent, and ONE small diagram under it
that builds part by part — dim ghost → lit → line draws → packet runs → check pops.

**The style is the quality and the motion, not the colours.** Every colour comes from a few role
tokens that the BRAND fills. The purple/neon of the reference is only the default theme — never ship
it unless the brand says so.

Files: `nx.css` (role tokens + parts), `nx.js` (global `NX`: themes, icons, connectors, tween helpers).
Demo blocks:
- `compositions/portrait/node-explainer-9x16.html` — 1080x1920, 20 s, 5 scenes (chain, user → goal, server → 3 APIs, split, terminal).
- `compositions/node-explainer-16x9.html` — 1920x1080, 20.5 s, 6 scenes (docs + cursor, mini-card trail, AI app → Gmail + arcs, myth, big "No", foundation layers).
Both take the variable `theme` (`neon` | `midnight` | `light`).

## Use it in a project
```bash
node tools/vid.mjs use node-explainer-9x16 <project-slug>      # or node-explainer-16x9
```
That copies the block to `compositions/` plus `nx.css`, `nx.js`, GSAP, DrawSVGPlugin, the fonts and
the 2 UI sounds into the project's `assets/`. Wire the printed `<div … data-composition-src=…>` into
`index.html`, pick the brand: `data-variable-values='{"theme":"light"}'`, then `npx hyperframes lint`.

Your own composition with the kit:
```html
<head>
  <script src="../../assets/vendor/gsap.min.js"></script>
  <script src="../../assets/vendor/gsap-plugins/DrawSVGPlugin.min.js"></script>
  <link rel="stylesheet" href="../../assets/kits/node-explainer/nx.css" />
  <style> /* @font-face for the brand fonts + JetBrains Mono — copy from a demo block */ </style>
</head>
<body>
  <div id="root" class="nx" data-composition-id="…" …> … </div>
  <script src="../../assets/kits/node-explainer/nx.js"></script>   <!-- in BODY, before your script -->
  <script> NX.theme(root, "light"); NX.icons(root); /* then build the timeline with NX.* */ </script>
</body>
```

## Colours: the brand fills the roles
| Token | Role |
|---|---|
| `--nx-bg` | stage (dark OR light — light flips the kit to light mode) |
| `--nx-surface`, `--nx-border` | cards / rows, hairlines |
| `--nx-text`, `--nx-dim` | main text, secondary text |
| `--nx-accent`, `--nx-accent-2` | headline key words (gradient; set both the same for a flat brand) |
| `--nx-role-1` | the model / "brain" (tile family 1) |
| `--nx-role-2` | the server / connector — **lines, packets and arcs use it** |
| `--nx-role-3` | systems / APIs |
| `--nx-role-4` | the app / client |
| `--nx-ok`, `--nx-warn`, `--nx-danger` | status; `warn` is also the highlighted path, "?" badge, user note |
| `--nx-depth` (0..1), `--nx-glow` (multiplier), `--nx-head-font` | gradient depth, glow strength, headline font |

Everything else is DERIVED with `color-mix()` — card tints, chip fills, line colours, ghost lines,
terminal colours, on-colour text. Never set derived values per brand.

`NX.theme(root, nameOrTokens, extra)` writes the tokens, sets `data-nx-mode="light"` when the stage is
light, and picks readable text for each filled role colour (ink vs white, by WCAG contrast).
**Light mode:** glow becomes a soft coloured shadow, ghosts are faded (not darkened), cards float on a
small shadow, status text goes darker for AA. Built-in themes: `neon` (reference look), `midnight` (dark) and `light` — both made-up example palettes, not real brands.

### brandToNx — how to fill the roles from `brand/<name>.md`
```js
NX.theme(root, {
  bg: brand.canvas,            surface: brand.surface,      border: brand.line,
  text: brand.textStrong,      dim: brand.textMuted,
  accent: brand.primary,       "accent-2": brand.secondary || brand.primary,   // flat brand = same
  "role-1": brand.primary,     "role-2": brand.info || brand.secondary,
  "role-3": brand.tertiary || <a tint of primary>,          "role-4": brand.surface or white,
  ok: brand.success, warn: brand.warning, danger: brand.danger,
  depth: brand.flat ? 0.35 : 1,  glow: brand.light ? 0.8 : 1,
  "head-font": '"<brand display font>", system-ui, sans-serif',
});
```
Rules: one colour = one role for the whole video; if the brand has fewer colours, reuse a tint of the
primary — don't invent a new hue (say so if you must). Load the brand's fonts with `@font-face` in the block.

## Parts (nx.css) — all under `.nx`
| Class | What it is |
|---|---|
| `.nx-head` (+ `dir="rtl"`) | headline, 78px on 9:16 (blocks set 66px on 16:9), balanced wrap |
| `.nx-accent` · `.nx-ltr` · `.nx-keep` | accent key word · English word in an Arabic line · keep a phrase on one line |
| `.nx-tile` + `--ai/--mcp/--api/--app` (or `.nx-r1..r4`) | role tile; `--row` icon left, `--big` one-word hero, `--logo` dark tile with a brand mark (`data-nx-logo`), `.nx-pip` corner dot |
| `.nx-pill` (+ `.nx-label` typed) | tool bar; `--dark` + `.nx-edge--1/warn/danger/ok` list row; `--hot` highlighted; `--new` |
| `.nx-node` + `.nx-dot` | system / API row with a status dot (`NX.okDot` turns it ok) |
| `.nx-chip` (+ `--warn/--danger/--role/--live/--solid/--tool/--big/--xl`) | status chips; `--xl --solid` = the big "No" (chips are inline: give them `position:absolute` in the block) |
| `.nx-check` · `.nx-badge` | check circle · square "?" badge |
| `.nx-card` + `.nx-card-bar` + `.nx-card-body`; `.nx-term` + `.nx-tl…` | UI card; terminal lines |
| `.nx-browser` > `.nx-browser-body` > `.nx-side` (`.nx-side-item` + `.nx-hl`) + `.nx-page` (`.nx-skel`, `--title`, `--box`); `.nx-cursor` | docs mock with sidebar, skeleton page, cursor |
| `.nx-mini` (`--lock`) + `.nx-mini-label`; `.nx-ptdot` | mini cards (search / format / auth / code) and the yellow path dots |
| `.nx-arcs` (svg of 3 arc paths) | signal arcs ")))" |
| `.nx-note` (`--ok`, `--role`, `dir="rtl"`) + `.nx-note-label` | user request / goal / operation note |
| `.nx-speech` + `.nx-speech-text` + `.nx-strike` | myth speech bubble, struck through |
| `.nx-split` > `.nx-panel` > `.nx-panel-fill` + `.nx-divider` | split comparison with a divider |
| `.nx-counter` (`.nx-num`, `.nx-unit`) · `.nx-scan` | "3 CALLS" counter · row scan bar |
| `.nx-steps` > `.nx-step` (`.nx-bubble`, `.nx-step-label`) + `.nx-track` > `.nx-fill` | steps row |
| `.nx-layer` + `.nx-slot` | wide stacked bars (foundation: APIs → MCP server) |
| `.nx-lines` (svg) / `.nx-line` (`--hot`, `--dim`) | connector layer and lines |

## Helpers (nx.js)
Every tween helper **adds to the timeline you pass, at the time you pass, and returns its end time.**
All are seek-safe (fromTo / proxy tweens, no `tl.call`).

```js
NX.theme(root, "light");  NX.icons(root);           // brand first, then icons
var line = NX.connect(svg, a, b, { from: "bottom", to: "top" });                  // straight
var c    = NX.connect(svg, hub, pill, { from: "right", to: "left", curve: 0.45 }); // S-curve
var drop = NX.connect(svg, svc, bar, { from: "bottom", to: "top", align: "from" }); // straight drop onto a wide bar
NX.scene(tl, sceneEl, 4.0, 8.5);            // hard cut in/out (visibility, keeps layout)
NX.headline(tl, headEl, 4.0);               // whole on the cut frame (reference); {rise:true} = 0.3 s rise
NX.lit(el);  NX.ghost(el);                  // state at t=0 (cover frame)
NX.ignite(tl, el, 1.2);                     // ghost 0.1 s, lit 0.22 s
NX.ignite(tl, el, 1.5, { fromGhost: true });// light a part that NX.ghost() showed
NX.draw(tl, line, 0.7);                     // 0.35 s
NX.packet(tl, line, 2.0);                   // ~10% of the line, 0.32 s; {hot:true} = yellow
NX.pill(tl, pillEl, 5.0);  NX.type(tl, labelEl, 5.1);   // 25 chars/s, Latin only
NX.check(tl, el, 2.9);  NX.chip(tl, el, 3.1);  NX.pop(tl, el, 3.3);  NX.rise(tl, el, 6.0);
var end = NX.term(tl, termCard, 8.6, { cps: 34 });  NX.steps(tl, stepsRow, end);
NX.fanout(tl, hub, [p1, p2], svg, 4.6, { pill: true, curve: 0.45 });   // → {end, paths}
NX.cursor(tl, cur, 0.25, [{ el: page, jump: true }, { el: item, click: true }]); // moves 0.45 s, clicks, lights .nx-hl
NX.skel(tl, page, 1.3, { keep: true });     // skeleton bars grow in; keep = old page shows before (cover-safe)
NX.trail(tl, [{card, dot}, …], svg, 3.75, { gap: 0.75 });  // card lights, dot pops, yellow line grows to the next dot
NX.arcs(tl, arcsSvg, 8.35);                 // ")))" 0.1 s apart
NX.split(tl, splitEl, 12.05, { left: 0.6, right: 1.3 });   // divider draws, fills wipe in from the outside
NX.count(tl, numEl, [t1, t2, t3]);          // 1, 2, 3 as each call arrives
NX.okDot(tl, dot, t);  NX.scan(tl, bar, t);  NX.strike(tl, el, t);
```
`NX.T` = timing tokens, `NX.ICONS` = inlined lucide glyphs, `NX.LOGOS` = gmail, github (simple-icons).
Add icons from `_library/assets/icons/lucide/ (not in the public repo)*.svg` (paste the inner elements).

## Timing — MEASURED on the reference at 10 fps (2026-10-01)
| Move | Reference | Kit |
|---|---|---|
| headline on a cut | already whole on the cut frame | `NX.headline` = instant |
| old diagram on a cut | vanishes; canvas empty 0.1–0.3 s | `NX.scene` hard cut |
| part ghost → lit | 0.1–0.2 s, no overshoot | ghost 0.1 + ignite 0.22 |
| line draw | 0.2–0.4 s | 0.35 |
| packet | ~10% of the line, crosses in ~0.3 s | len 10%, 0.32 s |
| pops (check, badge, "No") | slight overshoot | back.out(1.7), 0.3 s |
| typing | ~25 chars/s | 25 cps (terminal 34) |
| cursor move | ~0.4 s per move, then click | 0.45 s + 0.19 s click |
| gaps between build beats | 0.4–1.2 s (waits for the voice) | blocks use 0.4–0.75 s |
| hold of a finished diagram | 0.5–1.5 s | 0.5–1 s |
Pace comes from the VOICE: put each build on the word that names it. The demos have no voice, so
their gaps are a fair average, not a rule.

## Sound (optional, subtle)
`_library/assets/sfx/gen/ui-tick.wav (not in the public repo)` (60 ms, no lead silence) on a part lighting,
`ui-pop.wav` (0.16 s) on a check / badge / click. Volumes 0.22 / 0.28 — well under a voice.
**Write every cue as a static `<audio>` tag with its own `id`** (no id = silent in the render; `data-start` local to the block +
`data-hf-media-start-basis="local"`, own `data-track-index`). The renderer mixes only audio that is in
the HTML: `<audio>` added by a script plays in preview but is NOT in the MP4 (tested 2026-10-01).
Static tags also make `vid use` copy the wav files. No sound = delete the tags.
Avoid `el/ui-type.mp3` (75 ms silent lead).

## Layout zones
**9:16 (1080x1920):** 0–260 platform chrome, empty · **300–520 headline** · **620–1420 diagram** ·
safe band **x 60–960, y 220–1500** (Reels/TikTok buttons cover the right 120 px; bottom 20% for captions).
**16:9 (1920x1080):** **90–250 headline** (x 120–1800, 66px) · **300–980 diagram** · keep ~6% title-safe margins.

## Gotchas
- **Measure with offsets, not rects.** `NX.connect` / `NX.cursor` walk `offsetLeft/offsetTop` up to the
  stage (the svg's / cursor's positioned parent). `getBoundingClientRect()` breaks in the scaled Studio preview.
- **Hide scenes with visibility, not display** (`NX.scene` uses autoAlpha) so lines measure correctly.
  Don't make scenes `class="clip"`.
- **`<head>` extras don't survive a sub-composition mount** — a `<link>` used as a file reference is gone at
  runtime (`getElementById` returns null and the whole build stops). Keep file references in the body.
- **A mounted root can lose its own background** — nx.css also paints `--nx-bg` from `.nx::before`, so a light
  brand never shows the host's black.
- **No black cover.** `vid judge` fails a first frame that is ~98% black. Start scene 1 with a lit part
  (`NX.lit`) and a ghost (`NX.ghost`). Short "black" CHECKs after later cuts are this style's empty canvas.
- **Typing is Latin only.** Never type Arabic, never split Arabic per character.
- **JetBrains Mono (vendored subset) has no `→`** — use `<i class="nx-arrow" data-nx-icon="arrow-right">`.
- **Updating the kit in a project:** `vid use` keeps asset files that already exist. After changing the kit,
  copy `nx.css` / `nx.js` into the project's `assets/kits/node-explainer/` by hand.
- Glow = "active". No glow on text or backgrounds (ANTI-SLOP §2).
