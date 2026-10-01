---
id: neon-node-explainer
name: Neon Node Explainer
status: approved
version: 1
modes: [calm, punchy]
use_when: [ai-explainer, quick-tutorial, ai-news, concept explainer]
avoid_when: [talking-head with face on screen the whole time, warm/emotional stories, product demos where a real screen recording is the proof, music-led hype reels with no voice-over]
brand: any
blocks: [node-explainer-9x16, node-explainer-16x9]
skill: style-neon-node-explainer
approved_by: the owner (chat)
approved_on: 2026-10-02
approved_words: approve all styls there
---
# Neon Node Explainer

**Tone (one sentence):** A calm, clear tech explainer — a plain stage (black in the reference, the brand's canvas otherwise) where each spoken idea gets one headline and one small glowing diagram that builds itself part by part, like the system is switching on while you listen.
**Inspired by (technique, not a copy):** the English "API vs MCP" explainer the owner shared on 2026-10-01 (Downloads, source channel unknown; 16:9, ~6.7 min, voice-over, no music bed). Techniques: black stage, headline swap on every beat, role-coloured glowing tiles, mono caps labels, lines that draw on, a packet that runs a line, ghost → lit builds, dark UI cards (terminal, tool list) with status chips, a steps row that fills.

## Look
- **Palette:** roles, not hex — colours come from the brand; never ship this purple unless the brand says so. Palette = roles; the brand fills the hex. (Test default `neon` = the reference: bg #000 · role-1 #26D892 · role-2 #45D9E3 · role-3 #4A8DF5 · role-4 #EEF1F5 · key words #9D4DFF → #D946EF · warn #FFC531.)
  - Roles (CSS tokens in `nx.css`): stage `--nx-bg` · cards `--nx-surface` / `--nx-border` · text `--nx-text` / `--nx-dim` · headline key words `--nx-accent` → `--nx-accent-2` · role-1 the model · role-2 the server / connector (lines and packets use it) · role-3 systems / APIs · role-4 the app · status `--nx-ok` / `--nx-warn` (also the highlighted path) / `--nx-danger`. Everything else (card tints, chip fills, glows, ghost lines) is derived.
  - Fill them with `NX.theme(root, …)` from `brand/<name>.md` (README "brandToNx"). Saved themes: `neon` = the reference look (black, mint / cyan / blue tiles, purple → magenta key words) — the DEFAULT for tests only; `midnight` (dark) and `light` — made-up example palettes, not real brands.
  - Light brands work: glow becomes a soft coloured shadow, ghosts fade instead of darken, text stays AA.
  - Rule: the accent is ONLY for 1–3 key words in the headline. Each role colour means one thing and never changes meaning inside a video.
  - Glow is a state, not decoration: a part glows when it is active (ANTI-SLOP §2 — tweened on the part itself, so it has a source and moves with it). Never a background glow, never glow on body text.
- **Type:** the brand's display font (default Alexandria 800; light = Cairo) for the headline (78px on 1080 wide, 66px on 1920 wide, max 2 lines, `text-wrap: balance`) · Latin same family 800 for English words inside the headline (LTR span) · labels JetBrains Mono 500/700, UPPERCASE, tracking 0.12–0.16em, 23–27px · terminal JetBrains Mono 27px.
- **Texture:** none — flat stage, no grain, no dots, no ambient glow (the reference has none).
- **Grade:** none — graphics only.

## Camera, light, performance
- **Camera:** none — flat 2D, no zooms or pans; the diagram builds in place.
- **Lighting:** none — the only "light" is a part's own glow when it is active.
- **Performance:** none — voice-over only; no person on screen.

## Edit
- **Rhythm (measured at 10 fps):** headline swap every 3–4 s on the voice (one sentence = one headline) · one diagram per headline · each build step is FAST (0.1–0.4 s) but the steps wait for the voice (0.4–1.2 s apart) · hold the finished diagram 0.5–1.5 s before the cut.
- **Grammar:** hard cut — the new headline is already whole on the cut frame, the old diagram is gone, the canvas is empty for 0.1–0.3 s, then the diagram builds element by element: dim ghost → lit with glow → line draws → packet runs → check / chip pops.
- **Transitions:** hard cut only. No wipes, no dissolves.

## Motion (HTML / GSAP)
```json
{ "ease": { "enter": "power2.out", "line": "power2.inOut", "emphasis": "back.out(1.7)", "packet": "power1.inOut" },
  "duration_ms": { "micro": 100, "standard": 220, "hero": 350 },
  "stagger_ms": 120,
  "ghost_ms": 100, "ignite_ms": 220, "line_ms": 350, "packet_ms": 320, "packet_len_pct": 10, "pop_ms": 300,
  "type_cps": 25, "cursor_move_ms": 450, "beat_gap_ms": [400, 1200], "hold_ms": [500, 1500],
  "headline": "instant on the cut",
  "ignite_from": { "scale": 0.92, "y": 12, "ghost": "dark: brightness(0.22) saturate(0.55) / light: opacity 0.42" } }
```
- **Text animations:** headline is already whole on the cut frame (no fade — measured; no letter split — Arabic-safe) · mono labels type on (seek-safe proxy tween, Latin only) · terminal commands type, output lines slide in 10px.
- **Rules:** one diagram per headline; every part enters dim first, then lights; lines draw before the part they lead to lights; never type Arabic; never split Arabic per character; the cover frame (t=0) must already show a lit part (an all-black cover fails `vid judge`).

## Sound
- **Music:** none in the reference — voice-over led. If a bed is needed, a very quiet minimal pad from `_library` music, about −24 LUFS under the voice.
- **SFX:** optional and subtle — `_library/assets/sfx/gen/ui-tick.wav (not in the public repo)` on a part lighting, `ui-pop.wav` on a check / badge / click, at 0.22 / 0.28 volume. The demo blocks have them as static audio tags (audio added by a script is not rendered); delete the tags for no sound.
- **Mix:** voice first at −14 LUFS; SFX well under the voice.

## Modes
- **calm:** the reference pace — headline every ~4 s, build steps 0.6–1.2 s apart on the voice, no SFX, glow 0.35.
- **punchy:** headline every ~2.5–3 s, build steps ~0.4 s apart, a tick SFX on each lit part, glow 0.5, the packet runs twice.

## Prompt parts
<!-- This look is pure HTML motion; AI image/video tools are not used for it. Kept for completeness. -->
- **Style block:** flat 2D technical diagram on a plain {BRAND CANVAS} background, rounded tiles in the brand's role colours, thin connector lines, uppercase monospace labels, dark UI cards with thin grey borders, no texture {SUBJECT}
- **Keep:** plain stage, one colour per role (model / server / APIs / app), mono caps labels, one small diagram centred.
- **Avoid:** watermark, any written Arabic (all text goes in HyperFrames), 3D renders, holograms, floating particles, background glow, stock-photo look, colours outside the brand.

## Per tool
- **images-gpt:** none — not needed; the look is built in HTML
- **flow-veo:** none — same reason
- **higgsfield:** none — same reason
- **hyperframes:** the node-explainer kit — `_library/assets/kits/node-explainer/` (`nx.css` role tokens + parts, `nx.js` = `NX`: theme, ignite, draw, packet, pill, type, check, chip, pop, term, steps, fanout, cursor, skel, trail, arcs, split, count, okDot, scan, strike, sfx, scene). Start from `node-explainer-9x16` or `node-explainer-16x9` (`vid use <block> <project>`), set `theme` to the brand. README in the kit folder.

## Frames
- frames/01-chain-ai-mcp-apis.png — scene 1 built: Arabic headline, AI model → MCP → APIs vertical chain with lines, check + 200 OK
- frames/02-hub-fanout-tools.png — scene 2 built: MCP server hub fans out to 3 tool pills; tool list with READY chips and a NEW "CANCEL ORDER" row
- frames/03-terminal-steps.png — scene 3 built: terminal (services → mcp expose → TOOL tags → "3 tools available"), steps row ✓ 1 2

## Do / Don't
- **Do:** fill the colours from the brand (`NX.theme`); write one headline per spoken sentence and build only what that sentence says; on 9:16 keep everything inside x 60–960, y 220–1500 (reel safe zone); keep labels English mono caps and headlines Arabic; let the glow mean "active".
- **Do:** start every scene with a part already visible (or the headline + a ghost) so no frame reads as black for long.
- **Don't:** ship the reference purple/neon on a brand that doesn't use it; put two diagrams under one headline, add background glows/dots/grain, use the purple gradient anywhere but key words, type Arabic, or fake a real product UI — the terminal and tool list are schematic, say so if asked.

## Tests
- (test notes are kept in the private workspace)
