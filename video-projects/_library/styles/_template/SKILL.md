---
name: style-<slug>
description: Build a video in the <Style name> look (style card <slug>). Use when the director picked this style card, when the owner says "make it in the <Style name> style", "<slug>", "استايل <Style name>", or the video type is <video types from use_when>. Works for Arabic (Egyptian) and English, 9:16 reels<, and 16:9 if supported>. Not for <avoid_when>.
---

# Style: <Style name>

<What the look is, in 2 lines.>
Card: `video-projects/_library/styles/<slug>/style.md` (status draft — say so to the owner until he approves it on the board).

**Look first:** `frames/01-….png` · `frames/02-….png` · `frames/03-….png` (in the style folder). No frames yet → make 3–6 before the first job (free routes: `npx hyperframes snapshot`, images-gpt).

## 0. Apply the card first
```bash
node tools/vid.mjs style apply <slug> <project> [--mode calm|punchy]
node tools/vid.mjs style show <slug>
```
`apply` fills the empty look layers of `director/decisions.md` and writes the `**Style card:**` line. L1, L2, L4, L14 come from the job.

## 1. Colours = roles (the brand fills the hex)
Style = quality, structure and motion. Never ship the reference colours unless the brand says so (the owner, 2026-10-01).
| Role | CSS token | From `brand/<name>.md` |
|---|---|---|
| stage | `--bg` | canvas |
| text | `--ink` | text-strong |
| accent (one thing only) | `--accent` | primary |

## 2. Build it
- **Blocks / starter code:** `node tools/vid.mjs use <block> <project>` … (run `vid find` + `director/library.md` first).
- **Layout 9:16 (1080×1920):** … keep text and faces inside x 60–960, y 220–1500.
- **Layout 16:9:** … or "not built yet".
- **Motion tokens:** the ```json block in the card. Short version: …
- **Text animations:** …
- **Transitions:** …
- **Sound:** music from `_library/assets/music` (never generate music) · SFX … · voice −14 LUFS.

## 3. Checks before the owner sees it
1. `npx hyperframes lint` (inside the project) — 0 errors.
2. `npx hyperframes snapshot --at <hero times>` — Read every frame.
3. `npx hyperframes render --quality draft` → `node tools/vid.mjs judge <draft.mp4>` → Read `sheet.jpg` and `safe-sheet.jpg`.
4. Safe zone x 60–960, y 220–1500 · Arabic joined, right-to-left, never split per letter, no `dir="rtl"` on `<html>`.
5. Style checks: …

## Do / Don't
- **Do:** …
- **Don't:** …

After the job: `node tools/vid.mjs style comment <slug> "<what worked or not>"`.
