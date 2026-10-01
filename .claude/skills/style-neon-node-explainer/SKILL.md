---
name: style-neon-node-explainer
description: Build a video in the Neon Node Explainer look (style card neon-node-explainer) — a plain stage, one headline per spoken sentence, and one small glowing diagram (tiles, lines, packets, checks, terminal, tool list) that builds itself part by part. Use when the director picked this card, or the owner says "make it in the neon node style", "node explainer", "API vs MCP style", "اعمله زي فيديو الـ MCP", or the video is an AI explainer, concept explainer, quick tutorial or AI news with a voice-over and no face. Arabic headlines + English mono labels; 9:16 and 16:9 both built. Not for talking heads, warm stories, real screen-recording demos or music-only hype reels.
---

# Style: Neon Node Explainer

A calm tech explainer: one headline per sentence, under it ONE small diagram that lights up part by part (dim ghost → lit → line draws → packet runs → check pops), hard cut to the next sentence.
Card: `video-projects/_library/styles/neon-node-explainer/style.md` — **approved** 2026-10-02.

**Look first** (in the style folder): `frames/01-chain-ai-mcp-apis.png` · `frames/02-hub-fanout-tools.png` · `frames/03-terminal-steps.png`. Proof that colours follow the brand: `tests/2026-10-01-three-themes.jpg (not in the public repo)`.

## 0. Apply the card first
```bash
node tools/vid.mjs style apply neon-node-explainer <project> [--mode calm|punchy]
node tools/vid.mjs style show neon-node-explainer
```
Then read the kit README: `video-projects/_library/assets/kits/node-explainer/README.md` (parts, helpers, timing). Don't hand-build what the kit has.

## 1. Colours = roles (the brand fills the hex)
Style = quality, structure and motion. **Never ship the reference purple / neon unless the brand says so.**
Fill the roles with `NX.theme(root, …)` — the README's "brandToNx" block maps `brand/<name>.md` fields:
| Token | Role | From the brand |
|---|---|---|
| `--nx-bg` | stage (light flips the kit to light mode) | canvas |
| `--nx-surface` / `--nx-border` | cards, hairlines | surface / line |
| `--nx-text` / `--nx-dim` | text | text-strong / muted |
| `--nx-accent` → `--nx-accent-2` | 1–3 headline key words ONLY | primary → secondary (same = flat) |
| `--nx-role-1` | the model / "brain" | primary |
| `--nx-role-2` | server / connector — lines, packets, arcs | info or secondary |
| `--nx-role-3` | systems / APIs | tertiary or a tint of primary |
| `--nx-role-4` | the app / client | surface or white |
| `--nx-ok` / `--nx-warn` / `--nx-danger` | status (`warn` = highlighted path too) | success / warning / danger |
Saved themes: `neon` (reference — tests only), `midnight`, `light` (made-up example palettes, not real brands). Everything else is derived — never set derived colours per brand. One colour = one role for the whole video; fewer brand colours → reuse a tint of primary, don't invent a hue.

## 2. Build it
- **Start from a demo block** (copies `nx.css`, `nx.js`, GSAP, DrawSVG, fonts, 2 UI sounds):
  ```bash
  node tools/vid.mjs use node-explainer-9x16 <project>     # _library/compositions/portrait/node-explainer-9x16.html (20 s, 5 scenes)
  node tools/vid.mjs use node-explainer-16x9 <project>     # _library/compositions/node-explainer-16x9.html (20.5 s, 6 scenes)
  ```
  Wire the printed `<div … data-composition-src=…>` into `index.html` with `data-variable-values='{"theme":"<brand>"}'`. Demo renders to compare against: `_library/styles/neon-node-explainer/tests/demo-9x16-20261001.mp4 (not in the public repo)`, `demo-16x9-20261001.mp4`.
- **Layout 9:16 (1080×1920):** headline top (78 px, max 2 lines, `text-wrap: balance`), one diagram centred under it; everything inside x 60–960, y 220–1500.
- **Layout 16:9 (1920×1080):** headline 66 px top, diagram centred; docs + cursor, trail and split scenes are in the 16:9 block.
- **Scenes:** `NX.scene(tl, el, in, out)` = hard cut · `NX.headline` = whole on the cut frame · then `NX.ignite` / `NX.draw` / `NX.packet` / `NX.check` / `NX.chip` / `NX.pill` + `NX.type` / `NX.term` / `NX.steps` / `NX.fanout` / `NX.cursor`. Every helper adds at the time you pass and returns its end time.
- **Motion tokens (card JSON):** ghost 0.1 s · ignite 0.22 s · line 0.35 s · packet 0.32 s (10% of the line) · pop 0.3 s back.out(1.7) · build steps 0.4–1.2 s apart on the voice · hold the finished diagram 0.5–1.5 s · type 25 chars/s (Latin only).
- **Text:** headline instant on the cut (no fade, no letter split) · mono caps labels type on · terminal lines type, output slides 10 px.
- **Transitions:** hard cut only; empty canvas 0.1–0.3 s, then the build.
- **Modes:** calm = headline every ~4 s, no SFX, glow 0.35 · punchy = every ~2.5–3 s, tick on each lit part, glow 0.5, packet runs twice.
- **Sound:** voice-over leads (−14 LUFS). Optional SFX `_library/assets/sfx/gen/ui-tick.wav (not in the public repo)` (lit part) and `ui-pop.wav` (check / click) at 0.22 / 0.28 as static `<audio>` tags. Bed only if needed: a quiet pad from `_library` music at about −24 LUFS. Never generate music.

## 3. Checks before the owner sees it
1. `npx hyperframes lint` inside the project — 0 errors.
2. `npx hyperframes snapshot --at <end of each build>` — Read every frame: one diagram per headline, nothing off-role.
3. `npx hyperframes render --quality draft` → `node tools/vid.mjs judge <draft.mp4>` → Read `sheet.jpg` and `safe-sheet.jpg`.
4. Safe zone x 60–960, y 220–1500 (9:16). Arabic headline joined and right-to-left, English words in `.nx-ltr` spans, never typed, never split per letter, no `dir="rtl"` on `<html>`.
5. Style checks: the cover frame (t=0) already shows a lit part (an all-black cover fails judge); accent only on 1–3 key words; glow only on the active part.

## Do / Don't
- **Do:** one headline per spoken sentence and build only what it says; English mono caps labels, Arabic headlines; start each scene with a visible part or ghost; let glow mean "active".
- **Don't:** ship the reference purple on a brand that doesn't use it; two diagrams under one headline; background glow, dots or grain; type Arabic; pretend the terminal / tool list is a real product UI.

After the job: `node tools/vid.mjs style comment neon-node-explainer "<what worked or not>"`.
