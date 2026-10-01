---
name: style-midnight-kinetic-type
description: Build a video in the Midnight Kinetic Type look (style card midnight-kinetic-type) — clean motion type on a flat dark field, word-by-word mask rises, one accent word that lands alone, icon strokes that draw on, and hard cuts on the music's beat grid. Use when the director picked this card, or the owner says "make it in the kinetic type style", "midnight type", "like an earlier project", "تايبوجرافي متحركة", or the video is a direct offer, proof / results reel or AI news told with type, music and SFX (no face, no footage). Arabic (Cairo, per-word) and English (Inter) versions; 9:16 reels. Not for lecture clips or quick tutorials.
---

# Style: Midnight Kinetic Type

Confident motion type on a flat dark field: one idea per beat, words rise from masks, the one word that matters lands alone in the accent colour, every scene cut hard on the music.
Card: `video-projects/_library/styles/midnight-kinetic-type/style.md` — **draft** (not approved yet — say so to the owner). Card brand: any (the hex values are examples).

**Look first** (in the style folder): `frames/01-arabic-hook-accent.png (not in the public repo)` · `frames/02-icon-stat-rows.png (not in the public repo)` · `frames/03-arabic-cta-card.png (not in the public repo)`. Source projects (still build; their old renders were cleaned away): an earlier project (not public) (Latin), an earlier project (not public) (Arabic).

## 0. Apply the card first
```bash
node tools/vid.mjs style apply midnight-kinetic-type <project> [--mode calm|punchy]
node tools/vid.mjs style show midnight-kinetic-type
```

## 1. Colours = roles (the brand fills the hex)
Style = quality, structure and motion. The midnight violet is the Midnight reference — another brand fills the roles with its own colours.
| Role | Block token | From `brand/<name>.md` |
|---|---|---|
| field | `--mk-canvas` / `--mk-hta-canvas` / `--mk-cep-canvas` | canvas (flat, no gradient) |
| ink | `--mk-ink-dark` / `--mk-hta-ink` / `--mk-cep-ink` | text-strong |
| dim (sub lines) | `--mk-cep-dim` | muted |
| accent — the ONE word, icons, bars | `--mk-accent` / `--mk-hta-accent` / `--mk-cep-accent` | primary |
| font | `--mk-font` / `--mk-hta-font` / `--mk-cep-font` | brand display font (Arabic: Cairo for midnight) |
Accent only on the one word that is the point, plus icons and bars. No gradients, no glow.

## 2. Build it
- **Blocks** (all in `_library/compositions/`, bring each in with `node tools/vid.mjs use <block> <project>`):
  - Latin: `mk-hook-title-portrait`, `mk-bar-compare-portrait`, `mk-x-post-portrait`, `mk-icon-stat-row`, `mk-lower-third-portrait`, `mk-cta-endcard-portrait`
  - Arabic: `mk-hook-title-ar-portrait`, `mk-cta-endcard-ar-portrait` (never mix Latin blocks into an Arabic reel)
  - Starter projects: an earlier project (not public) (Latin) and an earlier project (not public) (Arabic).
- **Layout 9:16 (1080×1920):** one text block centred in the middle band; hook 110 px Latin / 132 px Arabic; CTA headline 92 px, handle 46 px, sub 40 px; inside x 60–960, y 220–1500. Arabic and English never on the same line.
- **Layout 16:9:** not built yet.
- **Beat grid:** `node video-projects/_library/beat-grid.mjs (not in the public repo) <music file>` → hook 5–6 beats, middle scenes 12 beats (3 bars), CTA holds to the end. Each scene's slot ends ~0.5 s before its own exit starts, so every cut lands on a full frame — check with `node video-projects/_library/_factory/verify-cuts.mjs (not in the public repo)`.
- **Motion tokens:** enter power4.out · panels power3.out · exit power2.in · draw power2.inOut · micro 260 / standard 420 / hero 620 ms · stagger 160 ms (Arabic hook words 140, Latin 180) · word rise 120 px · exit rise −40 px in 400 ms.
- **Text animations:** word-by-word mask rise (each word an `overflow:hidden` inline-block, 0.45–0.48 s); the accent word waits ~0.14 s and lands alone (scale 0.8 → 1 + colour, 0.62 s); icon strokes draw on (0.5 s, 0.07 s apart); handle + sub rise and fade 0.4 s; exit = block rises 40–48 px and fades 0.4 s, then a hard hide.
- **Camera:** none. The CTA card slowly pushes (scale 1.062, rise −74 px) so a held frame breathes; cut-in cards settle 1.035 → 1. A held shot must drift ≥ 6%.
- **Transitions:** hard cut on the beat only — **no crossfades** (they read as murk). SFX mark the seam, not visual effects.
- **Modes:** punchy = as shipped (5–6-beat hook, cut every 3 bars, sub-drop + whoosh/impact on every seam) · calm (untested) = 12-beat scenes, no sub-drop, chime only on the CTA, longer CTA hold.
- **Sound:** bed `_library/assets/music/el/bed-tech-neutral.mp3 (not in the public repo)` (125 BPM, Latin) or `bed-arabic-modern.mp3` (136.4 BPM, Arabic) at volume 0.55. SFX from `_library/assets/sfx/el/ (not in the public repo)`: `sub-drop` on frame 0, `whoosh-fast` / `impact-tight` starting half a beat (0.22–0.24 s) before a cut, `success-chime` on the CTA — never the same one twice in a row. With a voice-over the level is unknown — decide at the first job (voice −14 LUFS).

## 3. Checks before the owner sees it
1. `npx hyperframes lint` inside the project — 0 errors.
2. `npx hyperframes snapshot --at <each cut − 0.05 s and + 0.3 s>` — Read every frame: no half-built text on a cut.
3. `npx hyperframes render --quality draft` → `node tools/vid.mjs judge <draft.mp4>` → Read `sheet.jpg` and `safe-sheet.jpg`.
4. Safe zone x 60–960, y 220–1500 · Arabic split per word, never per letter, letter-spacing 0, `dir="rtl"` on the text element only (never `<html>`).
5. Style checks: register the timeline synchronously and re-centre after fonts load; cuts on the grid; one accent word per scene.

## Do / Don't
- **Do:** colour only the word that carries the point; cut on the beat grid; land every cut on a composed frame; keep Arabic and English on separate lines.
- **Don't:** crossfade between scenes; reuse the same whoosh on every cut; put the brand logo in organic reels (brand rule); fake product UI; mix Latin blocks into an Arabic reel.

After the job: `node tools/vid.mjs style comment midnight-kinetic-type "<what worked or not>"`.
