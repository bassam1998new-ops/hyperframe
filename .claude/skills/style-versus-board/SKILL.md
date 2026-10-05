---
name: style-versus-board
description: Build a video in the Versus Board look (style card versus-board): a split screen where one prompt forks into two contenders, the answers race side by side, a scoreboard ticks with Arabic punch words and the verdict always says «حسب الشغلانة». Use when the director picked this card, or the owner says "versus board", "vs style", "قارن بينهم", "مين أحسن", or the video is an AI model comparison, an "X vs Y" test or AI news with two contenders. Arabic punch words + English mono labels; 9:16 built. Not for single-topic explainers, talking heads or videos that must crown a winner.
---

# Style: Versus Board

Same test, two contenders: the screen splits, one prompt forks to both tiles, the answers race, the score ticks, and the verdict says it depends on the job. Built on the Neon Node Explainer kit.
Card: `video-projects/_library/styles/versus-board/style.md` (status draft; say so to the owner until he approves it).

**Look first:** `frames/01-at-0.4s.png` (slam) · `frames/04-at-3.0s.png` (scoreboard) · `frames/05-at-4.7s.png` (verdict), in the style folder.

## 0. Apply the card first
```bash
node tools/vid.mjs style apply versus-board <project> [--mode calm|punchy]
node tools/vid.mjs style show versus-board
```
Then read the node kit README: `video-projects/_library/assets/kits/node-explainer/README.md`.

## 1. Colours = roles (the brand fills the hex)
| Token | Role | From the brand |
|---|---|---|
| `--vb-a` | side A: tile header, half-tint, answer lines, score | primary |
| `--vb-b` | side B: same parts | secondary (same lightness as A) |
| `--nx-role-2` | fork lines and packets | info or a neutral |
| `NX.theme(...)` | stage, surface, border, text, dim | canvas / surface / line / text |
Never use a real AI company's brand colour for its side, and never make one side brighter.

## 2. Build it
- **Start from the demo block:** `_library/compositions/portrait/versus-board-9x16.html` (6 s, one round). Copy `assets/kits/node-explainer/`, `assets/kits/hatch/` and `assets/kits/aurora/` next to it. GSAP and the Cairo fonts load from jsdelivr.
- **Layout 9:16 (1080×1920):** prompt bar y 300–420 · tiles y 560–1180 · scoreboard y 1230–1470 · everything inside x 60–960 · bottom band free for captions.
- **Layout 16:9:** not built yet.
- **Rounds:** one round per compared task. Re-slam the board for each round, change the prompt, keep the side colours.
- **Motion tokens:** the card JSON. Short version: slam back.out(1.6) · punch-ins 6–12% settle in 0.2 s · score ticks 0.5 s apart · flash 1–2 frames on slam and verdict.
- **Text:** the prompt types (Latin mono only) · Arabic punch words and the verdict land whole · tile names are plain (MODEL A, or the model's name in mono caps, no logo).
- **Sound:** voice −14 LUFS. Add whoosh/pop SFX as static `<audio>` tags (the library demo has none).

## 3. Checks before the owner sees it
1. `npx hyperframes lint` inside the project, 0 errors.
2. `npx hyperframes snapshot --at <each score tick and the verdict>`. Read every frame.
3. Render a draft, then the motion check (`team/tools/motion-check.sh`): average ≥ 7, lowest second ≥ 1.0.
4. Safe zone x 60–960, y 220–1500. Arabic joined and right-to-left, never typed, never split per letter.
5. Fairness checks: the same prompt on both sides; each side's wins shown; the verdict names no winner; no logos; company claims said as claims.

## Do / Don't
- **Do:** keep a punch word clear of the score row it announces; show real test results; end every round on «حسب الشغلانة».
- **Don't:** crown a winner, use real logos or brand colours, or let one side's colour dominate.

After the job: `node tools/vid.mjs style comment versus-board "<what worked or not>"`.
