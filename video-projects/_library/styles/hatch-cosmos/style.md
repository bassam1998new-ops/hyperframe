---
id: hatch-cosmos
name: Hatch Cosmos
status: approved
version: 1
modes: [calm, punchy]
use_when: [music-led show-off or teaser, concept intro with a mascot, "journey inside" story beats, brand-mascot moments, AI explainer opener, channel bumper]
avoid_when: [talking head on screen the whole time, real screen-recording proof, data-heavy explainers that need text and numbers, product UI demos, anything that must look photographic]
brand: any
blocks: [hatch-cosmos-9x16, hatch-cosmos-16x9]
approved_by: the owner (chat)
approved_on: 2026-10-02
approved_words: yes save it as style and skill
skill: style-hatch-cosmos
---
# Hatch Cosmos

**Tone (one sentence):** A warm, curious hand-drawn world — a little block mascot (or a pair) walks along, the camera dives through its eye like a window, and we land in a pencil-hatched cosmos of soft nebula blobs, tilted orbit rings and needle-thin stars.
**Inspired by (technique, not a copy):** the 32 s illustrated video the owner shared on 2026-10-02 (Downloads, creator unknown; 16:9, music, no voice, no text). Techniques: flat fills with short diagonal pencil hatching fixed to each shape, dark ink outlines, translucent overlapping nebula blobs, colour orbit rings with a thin dark edge, 4-point needle sparkles, a cream paper sheet with a floor line for the "real world", a dive into the mascot's eye that turns into a phone-shaped window, then a montage of hand-drawn scenes.

## Look
- **Palette:** roles, not hex — the brand fills them; never ship the reference orange/space unless the brand says so. Palette = roles; the brand fills the hex. (Test default `cosmos` = the reference: canvas #140f2c · halo #322451 · ink #1a1030 · paper #e4e4db · light #f1e6dc · hero #d57452 · buddy #e4f0ee · a1 #f2c335 · a2 #e5336a · a3 #f19a36 · a4 #2fc3d3 · a5 #8f88d6 · a6 #2dc08a.)
  - Roles (kit `HATCH.theme`): `canvas` space · `halo` galaxy halo + vignette · `ink` outlines and eyes · `paper` paper sheet · `light` pale pencil lines · `star` · `core` · `hero` / `buddy` mascot bodies · `a1..a6` rings, dots, planets, rays · `clouds` nebula fills DERIVED from a1..a6 + canvas + paper (never hand-set per brand).
  - Saved themes: `cosmos` (reference — tests only), `midnight` (brand/<name>.md: violet hero, lavender rings, pink only on one ring + a few planets, mint scarce). Proof: `tests/2026-10-02-themes-and-looks.jpg (not in the public repo)`.
  - Rule: `a2` makes the big masses — give it a calm brand colour, never the brand's "punctuation" colour. One mascot = one brand colour for the whole video.
- **Type:** none in the reference — the look is pure illustration. If a job needs words, put them OUTSIDE the canvas as plain brand type (the brand's display font, e.g. Cairo / Alexandria 800, ink on paper or white on space), short, never hatched, never drawn into the canvas, Arabic never split per letter.
- **Texture:** pencil hatching (short strokes at ~65°, rows 4–6.5 px apart, stroke = fill × 0.6, × 0.85 on light warm fills; fixed to the shape, no boil) + faint diagonal "rain" hatch on space + light speck grain on dark scenes + cream paper with specks and fibres for the paper look.
- **Grade:** none — graphics only. Renders get a +3 level lift (`K.lift`) so the MP4 matches the canvas colours.

## Camera, light, performance
- **Camera:** 2D only — slow parallax drift while walking (layers at depth 0.25–0.9), then ONE dive per story beat: push in on an eye, the eye becomes a rounded window, the inner scene rolls in (~0.9 rad) and settles; zoom-outs back to the mascot for the ending. No 3D, no handheld shake.
- **Lighting:** none — flat fills. The only "light" is a soft glow behind each mascot on dark space, the galaxy core glow and sparkle glints.
- **Performance:** the mascot acts — walk cycle (legs swing in pairs, 0.5 s per step, small bob), looks at its buddy, blinks, ^ ^ happy eyes, arm wave, stands still before a dive. No person on screen.

## Edit
- **Rhythm (measured on the reference):** calm intro 4–6 s (walk on paper) · dive 1.2 s · then a montage of hand-drawn scenes every 1–2 s (cuts at 8.4, 9.4, 10.3, 11.6, 13.8, 15.7 s) with one or two 3–5 s holds · zoom back out to the mascot to end.
- **Grammar:** the dive is the signature move — push into the eye, window covers the frame, hand-off; montage scenes change with hard cuts or quick zoom-throughs; the mascot frames the video (start and end).
- **Transitions:** eye-window dive (kit `K.dive`), hard cut, zoom-through with a short colour ray burst. No wipes, no dissolves, no glitch.

## Motion (HTML / GSAP)
```json
{ "ease": { "push": "exp(ln(smax)*u^2)", "innerSettle": "cubic out", "walk": "sine" },
  "duration_ms": { "micro": 80, "standard": 450, "hero": 850 },
  "stagger_ms": 210,
  "walk_step_ms": 500, "walk_bob_px": 5, "leg_swing_rad": 0.17, "settle_before_dive_ms": 450,
  "dive_ms": 850, "dive_smax": 160, "window_rim_pct": 5, "inner_settle_ms": 1200, "inner_roll_rad": -0.9,
  "speed_lines": 420, "speed_pale_pct": 55, "hatch_angle_deg": 65, "hatch_row_px": [4.2, 6.5],
  "line_weight_zoom_exp": -0.7, "parallax_depths": [0.25, 0.4, 0.6, 0.75, 0.8, 0.9, 1.0],
  "drift_px_per_s": { "stars": 40, "far_blobs": 110, "arcs": 200, "planets": 300, "streaks": 520 },
  "sparkle_twinkle_hz": [0.4, 0.9], "boil_fps": 0 }
```
- **Text animations:** none in the look. If words are needed, they sit outside the canvas and cut in whole on a beat (no per-letter split — Arabic-safe).
- **Rules:** everything drawn from the timeline time `t` with a seeded rng (seek-safe); hatch stays fixed to its shape; pencil lines stay thin while zooming (width × zoom^−0.7); one dive per beat; the walk settles before every dive; mascots never cover the reel safe zone edges.

## Sound
- **Music:** music-led, no voice in the reference — a light, curious, playful bed (soft plucks, mallets, warm synth, 90–120 bpm) from `_library` music / the bgm catalogue; never generate music.
- **SFX:** a tonal whoosh on every dive (`_library/assets/sfx/el/whoosh-tonal.mp3 (not in the public repo)`, starts ~0.15 s before the push, 0.45 volume); optional soft `ui-pop` on a ^ ^ moment; nothing else.
- **Mix:** music at −14 LUFS when there is no voice; with a voice-over, voice first at −14 and music about −20 under it; the whoosh sits just above the music.

## Modes
- **calm:** the reference pace — 4–6 s walk intro, one dive, inner scene holds 3+ s, soft music, whoosh only.
- **punchy:** 2 s intro, dive at 2.3 s, then a new inner scene every 1–1.5 s (each through a zoom-through or hard cut), ray burst on every hand-off, pop on the ^ ^ eyes.

## Prompt parts
<!-- The look is drawn in HTML canvas (hatch kit); AI image/video tools are only for extra montage scenes. -->
- **Style block:** flat 2D hand-drawn illustration, solid colour fills covered in short diagonal pencil hatching, thick dark ink outlines, translucent overlapping soft blobs, thin coloured orbit rings with a dark edge, small 4-point needle stars, {BRAND CANVAS} background, no gradients except a soft core glow, no 3D {SUBJECT}
- **Keep:** the pencil hatching on every filled shape, dark ink outlines, the brand role colours only, flat light, the block mascot's proportions (body 1.6:1, four short legs, side arms, tall rounded eyes with an inner highlight).
- **Avoid:** watermark, any written text or Arabic (words go in HyperFrames), photoreal, 3D renders, glossy plastic, gradients on shapes, lens flares, colours outside the brand, other characters' logos.

## Per tool
- **images-gpt:** only for an extra montage scene; send frames/01-pair-happy-eyes.png + frames/03-deep-galaxy.png as the style reference with the style block — not checked yet (2026-10-02)
- **flow-veo:** none — not needed; the look and the dive are drawn in HTML (seek-safe, free)
- **higgsfield:** none — same reason; never spend credits on this look unasked
- **hyperframes:** the hatch kit — `_library/assets/kits/hatch/` (`hatch.js` = `HATCH`: theme, hatch, blob, planet, sparkle, ring, stars, rain, paper, floor, wobble, speed, mascot, galaxy, travel, trail, dive, lift). Start from `hatch-cosmos-9x16` or `hatch-cosmos-16x9` (`vid use <block> <project>`), set `theme` to the brand and `look` to space or paper. README in the kit folder.

## Frames
- frames/01-pair-happy-eyes.png — 9:16, two block mascots walk through hatched space, both with ^ ^ happy eyes, buddy waves
- frames/02-eye-window-dive.png — 9:16, mid-dive: the hero's eye is a rounded window with a white square highlight, the galaxy inside, radial pencil lines on the hatched body
- frames/03-deep-galaxy.png — 9:16, the deep galaxy: hatched nebula blobs, tilted colour rings, ringed planets, needle core star, centred in the safe zone
- frames/04-paper-walk.png — 9:16, the paper look (reference intro): the pair on a cream sheet with a pencil floor line

## Do / Don't
- **Do:** fill the roles from the brand (`HATCH.kit({ theme })`); build every shape once from the seeded kit and draw only from `t`; let the mascot act (look, blink, ^ ^, wave) before a dive; settle the walk before every push; keep the pair and the galaxy core inside x 60–960, y 220–1500 on 9:16; judge with 100% crops against the reference.
- **Don't:** ship the reference orange/space on a brand that doesn't use it; let hatch "boil" or get fat when zoomed; draw text into the canvas; use `Math.random` / `Date.now`; put a real company logo on a mascot without the brand's say-so (the Codex knot in the demo is an example config); spend credits on this look.

## Tests
- (test notes are kept in the private workspace)
