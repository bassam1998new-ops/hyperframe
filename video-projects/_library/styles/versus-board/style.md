---
id: versus-board
name: Versus Board
status: draft
version: 1
modes: [calm, punchy]
use_when: [ai-model-comparison, "x vs y" test, product comparison, ai-news with two contenders]
avoid_when: [single-topic explainers (use neon-node-explainer), talking heads, warm stories, comparisons where one side must "win" for the brand]
brand: any
blocks: [versus-board-9x16]
skill: style-versus-board
approved_by:
approved_on:
approved_words:
---
# Versus Board

**Tone (one sentence):** A fair, fast "same test, two contenders" board: the screen splits in two, one prompt forks into both sides, the answers race, a scoreboard ticks with punch words, and the verdict always says it depends on the job.
**Inspired by (technique, not a copy):** high-view "I tested X vs Y vs Z" comparison videos and Fireship-style fast cuts (Researcher's references, `team/series-next/research.md`, 2026-10-02). Techniques: split screen with a tinted half per side, a VS bolt, one shared prompt that forks, side-by-side streaming answers with live counters, a per-round scoreboard, a verdict card. Built on the Neon Node Explainer kit.

## Look
- **Palette:** roles, not hex. Palette = roles; the brand fills the hex. (Demo default: `midnight` NX theme, side A #2fd3a0, side B #ff7a59.)
  - `--vb-a` / `--vb-b`: one colour per side, used for its tile header, its half-tint (13% over the stage), its answer lines and its score. A side keeps its colour for the whole video.
  - `--nx-role-2`: the fork lines and packets (shared, neutral). Everything else comes from `NX.theme` (stage, surface, border, text, dim).
  - Rule: the two side colours must be equally strong (similar lightness), so neither side looks like the "winner" by colour alone. No real company logos or brand colours on the tiles; plain names only.
- **Type:** Arabic punch words and verdict Cairo 900 · tile names and labels mono caps (JetBrains Mono, or a system mono fallback) · verdict card: small mono "VERDICT" over a big Arabic line.
- **Texture:** none, flat (same as the node kit).
- **Grade:** none, graphics only.

## Camera, light, performance
- **Camera:** a virtual camera (`#vb-cam`) does snap punch-ins of 6–12% that settle in 0.2 s on each beat. No drift, no slow zooms.
- **Lighting:** none. A white flash (1–2 frames) on the slam and on the verdict drop.
- **Performance:** none on the board. Aurora (or the brand mascot) pops in at the end and points at the verdict.

## Edit
- **Rhythm:** one round = about 6 s (slam, prompt, race, score, verdict). In a full episode each new round re-slams the board. A beat every 0.5–1.2 s, always on the voice.
- **Grammar:** slam in → prompt types once → forks to both tiles (packets) → answers stream at their real relative speed → score rows tick one by one, each with a punch word → tiles shrink to the sides → verdict drops → mascot points → hard cut.
- **Transitions:** hard cut and slam only. No fades.

## Motion (HTML / GSAP)
```json
{ "ease": { "enter": "power3.out", "slam": "back.out(1.6)", "punch": "power2.out", "settle": "power2.inOut" },
  "duration_ms": { "micro": 100, "standard": 220, "hero": 400 },
  "beats_s": { "slam": 0.0, "prompt": 0.8, "race": 1.6, "score": 2.8, "verdict": 4.1, "mascot": 5.2, "cut": 6.0 },
  "punch_in_pct": [6, 12], "punch_settle_ms": 200, "score_tick_gap_ms": 500,
  "type_cps": 25, "flash_frames": [1, 2] }
```
- **Text animations:** prompt types on (Latin mono only) · answer lines grow left to right with a side-tint blink as each lands · punch words (Arabic, whole word) slam with back.out and fade in 0.3 s · verdict drops whole.
- **Rules:** the same prompt goes to both sides; the verdict never names a winner; Arabic is never typed or split per letter.

## Sound
- **Music:** none required (voice-led). A very quiet pad from `_library` music if needed, about −24 LUFS.
- **SFX:** whoosh on the slam and the verdict, a pop on each score tick and on the mascot. The library demo ships without SFX; add your own as static `<audio>` tags.
- **Mix:** voice first at −14 LUFS; SFX well under the voice.

## Modes
- **calm:** one punch-in per beat at 6%, no flash, score ticks 0.7 s apart.
- **punchy:** punch-ins up to 12%, flash on slam and verdict, score ticks 0.5 s apart (the demo).

## Prompt parts
<!-- Pure HTML motion; AI image/video tools are not used for this look. -->
- **Style block:** flat 2D split-screen comparison board on a plain {BRAND CANVAS} background, two rounded tiles each in its own role colour, a small VS badge, mono caps labels, a scoreboard row {SUBJECT}
- **Keep:** two equal tiles, one colour per side, plain names, one shared prompt.
- **Avoid:** real logos, brand colours of real AI companies, a crown or trophy on one side, any written Arabic (all text goes in HyperFrames).

## Per tool
- **images-gpt:** none, built in HTML
- **flow-veo:** none, same reason
- **higgsfield:** none, same reason
- **hyperframes:** demo block `_library/compositions/portrait/versus-board-9x16.html` on the node-explainer kit (`nx.css`, `nx.js`) + `hatch.js` + `aurora.js` for the mascot.

## Frames
- frames/01-at-0.4s.png: the slam, MODEL A / MODEL B tiles on tinted halves, VS bolt
- frames/02-at-1.1s.png: the shared prompt typing
- frames/03-at-2.0s.png: the prompt forks into both tiles, answers start streaming, TOK/S counters
- frames/04-at-3.0s.png: the scoreboard with the punch word «أسرع» for side A
- frames/05-at-4.7s.png: tiles shrunk to the sides, verdict «حسب الشغلانة»
- frames/06-at-5.7s.png: Aurora points at the verdict, ^ ^ eyes

## Do / Don't
- **Do:** run the exact same prompt on both sides; show each side's real result; give each side its wins on the scoreboard; end every round on a "depends on the job" verdict; say company claims as claims in the voice.
- **Do:** keep the punch word clear of the score row it announces (in the demo «أسرع» covers side A's speed tick; move it up when you build an episode).
- **Don't:** crown a winner, use real logos or company colours, give one side a brighter colour, fake answers that a real test would not give.

## Tests
- 2026-10-02 demo render (team folder): 6 s, 1080×1920, motion avg 7.95, lowest second 4.49 (target ≥ 7). Built for series 2 "AI companies and models", eps 2–4.
