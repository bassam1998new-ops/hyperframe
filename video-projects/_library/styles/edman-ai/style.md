---
id: edman-ai
name: Edman AI (ادمان الـAI)
status: approved
version: 1
modes: [calm, punchy]
use_when: [Egyptian meme-comedy AI reels voiced over an OBS screen recording, series "ادمان الـAI", host-mascot commentary with cut-ins to the real screen]
avoid_when: [calm premium product demos, music-only teasers, anything that must look photographic, videos with the owner on camera]
brand: any
blocks: []
approved_by: the owner (chat)
approved_on: 2026-10-10
approved_words: Approved — dark cosmos room look (pencil hatch, 9 angles) as the series style (2026-10-10)
skill: style-edman-ai
parents: [hatch-cosmos, floating-desk-zoom]
hybrid_request: chat
layers_from:
  - palette: hatch-cosmos
  - type: new
  - texture: new
  - grade: floating-desk-zoom
  - camera: new
  - lighting: hatch-cosmos
  - performance: new
  - rhythm: new
  - grammar: new
  - transitions: hatch-cosmos
  - motion: new
  - sound: new
  - prompt: new
---
# Edman AI (ادمان الـAI)

<!-- A STYLE CARD. One folder per style: style.md (this), frames/ (3–6 approved 9:16 style frames WE OWN —
     the real contract, sent to every AI tool as the style reference), refs/ (web inspiration: links +
     small thumbnails + credit, look only, never sent to AI tools), grade.cube (optional LUT), tests/.
     Describe TECHNIQUE, never "in the style of <living artist>". Fill every line; write "none — why" if a
     line does not apply. `vid style check <slug>` tells you what is missing. Guide: brain/Jobs/Pick a style.md -->

**Tone (one sentence):** A dry, sarcastic Egyptian cartoon drawn in the hatch-cosmos world — a cartoon host (nameless, beard, hoodie) talks us through the story from his dark vibe-coder room where the cosmos leaks in, every phrase is drawn literally as a quick gag or meme, and we cut onto his real monitor whenever the screen matters.
**Inspired by (technique, not a copy):** the Arabic satire cartoon the owner shared on 2026-10-10 (Downloads, 16:9, 10:40, first 30 s studied): a glossy talking host on one flat warm background, literal phrase-by-phrase gags every 1–2 s, badge-headed side characters, speech bubbles that type in word by word, limited animation and hard cuts. Built as a hybrid of `hatch-cosmos` (palette, lighting, transitions) + `floating-desk-zoom` (grade) — see "Hybrid recipe".

## Hybrid recipe
<!-- Made by `vid style hybrid new` on 2026-10-10. One row per layer: which parent it came from. "new" = write it by hand.
     Change a layer later → change its row here too. Frames: this look needs its OWN 3–6 frames (never the parents'). -->
- **Parents:** `hatch-cosmos` (Hatch Cosmos) + `floating-desk-zoom` (Floating Desk Zoom)
- **Request:** chat

| Layer | From |
|---|---|
| Palette (roles) | `hatch-cosmos` |
| Type | new — write by hand |
| Texture | new — write by hand |
| Grade | `floating-desk-zoom` |
| Camera | new — write by hand |
| Lighting | `hatch-cosmos` |
| Performance | new — write by hand |
| Edit rhythm | new — write by hand |
| Edit grammar | new — write by hand |
| Transitions | `hatch-cosmos` |
| Motion (tokens, text animations, rules) | new — write by hand |
| Sound (music, SFX, mix) | new — write by hand |
| Prompt parts (AI style block) | new — write by hand |

## Look
- **Palette:** roles, not hex — the brand fills them; never ship the reference orange/space unless the brand says so. Palette = roles; the brand fills the hex. (Test default `cosmos` = the reference: canvas #140f2c · halo #322451 · ink #1a1030 · paper #e4e4db · light #f1e6dc · hero #d57452 · buddy #e4f0ee · a1 #f2c335 · a2 #e5336a · a3 #f19a36 · a4 #2fc3d3 · a5 #8f88d6 · a6 #2dc08a.)
  - Roles (kit `HATCH.theme`): `canvas` space · `halo` galaxy halo + vignette · `ink` outlines and eyes · `paper` paper sheet · `light` pale pencil lines · `star` · `core` · `hero` / `buddy` mascot bodies · `a1..a6` rings, dots, planets, rays · `clouds` nebula fills DERIVED from a1..a6 + canvas + paper (never hand-set per brand).
  - Saved themes: `cosmos` (reference — tests only), a brand theme of your own. Proof: `tests/2026-10-02-themes-and-looks.jpg`.
  - Rule: `a2` makes the big masses — give it a calm brand colour, never the brand's "punctuation" colour. One mascot = one brand colour for the whole video.
- **Type:** two voices. Speech bubbles = a hand-lettered-feel Arabic face (test: Aref Ruqaa / Lalezar vs. Alexandria 800 — pick in the frames test), ink on white bubble, thick ink outline + tail. Keyword labels (one word, e.g. المرأة in the reference) = Alexandria 800 in an accent colour. No subtitles. Latin tech names (Claude, MCP) in the same weight. Arabic never split per letter; bubbles type in per WORD.
- **Texture:** cosmos pencil hatching on every filled shape (hatch kit `K.hatch` / `hatchFor`), thin ink outlines (3–4 px at 1080 w), star specks + grain on the dark ground. Chosen by the owner 2026-10-10: "pencil hatch". Zoomed angles: hatch is drawn in screen space (same stroke size at any zoom), outlines thin as width × zoom^−0.7 (fixed 2026-10-10).
- **Grade:** none on the screen — keep screen text sharp ([[One grade and grain match mixed sources]]). Cards: 22 px corners, two-layer soft shadow.

## Camera, light, performance
- **Camera:** 2D, mostly locked-off. Host shots cut between wide (room), medium (desk) and close (head) on the beat, sometimes off-centre like the reference. Gag cards are flat full-frame scenes. Screen parts: push into the monitor in the room (cosmos dive, but the window is the monitor), then floating-desk-zoom punch-ins on the OBS desktop band; glide back out to the room.
- **Lighting:** none — flat fills. The only "light" is a soft glow behind each mascot on dark space, the galaxy core glow and sparkle glints.
- **Performance:** the host is a rigged SVG puppet — mouth flaps to the voice (6 shapes from the audio), eyes swap (dots / ^ ^ / >< / half-closed tired / spiral), 4–6 hand poses, a slump. Limited animation: poses hold, change on words. AI side characters (Claude, Codex, ChatGPT…) use their real names and logo heads, and act the same way. The owner never appears on camera.

## Edit
- **Rhythm:** a new picture every 1–2 s, cut ON the word it illustrates; host holds 2–4 s; screen segments 3–8 s (only what proves the point); memes 1–2 s.
- **Grammar:** host line → literal gag → host reaction → into the monitor for proof → back out to the host. Bubbles stack and pile up during a rant. Real meme clips are dropped in raw for 1–2 s, framed as "on the monitor" or full-frame hard cut.
- **Transitions:** eye-window dive (kit `K.dive`), hard cut, zoom-through with a short colour ray burst. No wipes, no dissolves, no glitch.

## Motion (HTML / GSAP)
```json
{ "ease": { "pose": "steps(1)", "bubble": "back.out(2)", "label": "power4.out", "camera": "power2.inOut" },
  "duration_ms": { "micro": 120, "bubble": 180, "standard": 300, "dive": 850, "glide_out": 700 },
  "pose_fps": 12, "mouth_fps": 12, "word_stagger": "on voice timing", "stagger_ms": 60 }
```
- **Text animations:** bubble pops in (scale 0.6→1, back.out, 180 ms), then words appear one by one on the voice; keyword label slams in (scale 1.3→1, 120 ms).
- **Rules:** poses on 2s/3s (12–8 fps feel, stepped ease) — never smooth tweening on the characters; screens and camera stay smooth. Everything seek-safe, seeded.

## Sound
- **Music:** none under the voice (like the reference); a meme clip brings its own sound.
- **SFX:** pop on every bubble, whoosh into/out of the monitor, comic hits (boing, record scratch, sad trombone) only on the jokes the owner names.
- **Mix:** voice −14 LUFS; SFX just under it; meme audio ducks the voice only when the voice is silent.

## Modes
- **calm:** 2–3 s per picture, fewer SFX, longer screen holds (tutorial-heavy episodes).
- **punchy:** 1 s per picture, pop/hit on every gag, bubbles pile up (rant episodes). Default.

## Prompt parts
<!-- Copied word for word into every image/video prompt. Content goes ONLY in {SUBJECT}. -->
- **Style block:** flat 2D cartoon illustration, solid colour fills covered in fine diagonal pencil hatching, thin dark ink outlines, simple rounded shapes, flat even light, dark night-purple room background with stars, pastel nebula blobs and thin orbit rings, limited-animation TV cartoon look, no 3D {SUBJECT}
- **Keep:** the palette roles only, outline weight, pencil hatch, the host (tan skin, black textured hair, full black beard, tall black oval eyes, big white grin, lavender hoodie; no glasses, no suit), the dark cosmos room.
- **Avoid:** any written text or Arabic (words go in HyperFrames), watermark, photoreal, 3D, shading gradients, extra characters.

## Per tool
- **Episode engine + pipeline:** `engine/` (README) — room, the cartoon host/friend, AI logo mascots (Clawd pixel guy), brand logos incl. Composio, couch / stage / door / exit scenes, Adobe→cut→verify→build steps. From ep01, approved 2026-10-10.
<!-- Model + version + date for each. Frames go to every tool as the style reference. -->
- **images-gpt:** gag scenes, props, room plates and redrawn memes; refs = this card's frames once made — not checked yet
- **flow-veo:** none — characters are puppets in HTML
- **higgsfield:** none — never spend credits on this look unasked
- **HyperFrames canvas (render speed, 2026-10-10):** never stroke the full-screen hatch path per shape — stroke it ONCE per colour into a 1080×1920 bitmap and `drawImage` it through the shape's clip (ep01 went from ~5 s/frame, a 4 h render, to ~10 min). Fast capture (drawElement) fails self-verify on this canvas look and falls back to screenshot after ~2 min — pass `--experimental-fast-capture=false` to skip the wasted attempt. Give every hold a slow push (~6 %/shot) or the judge flags frozen picture.
- **hyperframes:** host + AI characters as SVG puppets (rig: head, eyes set, mouth set, arms); room as layered SVG/PNG; OBS band via `vid desk init`; screen moves from floating-desk-zoom

## Frames
<!-- 3–6 approved 9:16 frames in frames/. One line each: "- frames/01.png — what it shows". -->
- frames/01-wide.png — wide: the cartoon host (beard, hoodie) at his desk in the dark cosmos room: floor + rug, lamp, shelf, window onto space, orbit ring, pencil hatch
- frames/02-medium.png — medium, talking, speech bubble from his own line
- frames/03-close.png — close-up reaction (grin)
- frames/05-monitor-pov.png — the screen looks back at him: cyan glow, glass reflections, webcam on
- frames/06-window.png — window close-up: the deep galaxy, curtains, tea + plant on the sill (way into a cosmos montage)
- More angles (top-down desk, side profile, doorway extreme wide): tests/2026-10-10-angle-6..9-*.png. The first yellow pass (rejected) is in tests/rejected-yellow-pass/.
Source: `video-projects/_test-edman-ai-frames` (HyperFrames snapshot, 2026-10-10).

## Do / Don't
- **Do:** illustrate the exact word being said; keep the host on screen at the start and end; show the real screen when the voice says "شوف" / explains a step; blur keys, emails, paths.
- **Don't:** smooth "corporate" tweening on characters; subtitles; music under the voice; a gag longer than 2 s; the owner's face.

## Tests
<!-- One line per tested prompt: "- tests/<date>-<tool>.md — result, the owner's answer". -->
