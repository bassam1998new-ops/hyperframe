---
name: style-laptop-desk-zoom
description: Build a video in the Laptop Desk Zoom look (style card laptop-desk-zoom): a laptop on a warm paper desk shows the real app, the camera hard-cuts in on the exact click, a cursor travels and clicks, Aurora reacts, and small diagrams pop beside the laptop. Use when the director picked this card, or the owner says "laptop style", "tutorial", "شرح خطوة بخطوة", "from zero", or the video is a beginner tutorial or app walkthrough with real screenshots. Arabic step titles; 9:16 built. Not for AI news, model comparisons (use versus-board), talking heads or anything without real screens.
---

# Style: Laptop Desk Zoom

A friendly beginner lesson: the laptop shows the real app, the camera cuts in on the click, the result shows every time. Built on the Neon Node Explainer kit plus the Aurora mascot.
Card: `video-projects/_library/styles/laptop-desk-zoom/style.md` (status draft; say so to the owner until he approves it).

**Look first:** `frames/02-at-2.3s.jpg` (punch-in + selection sweep) · `frames/04-at-4.3s.jpg` (diagram beside the laptop) · `frames/06-at-5.6s.jpg` (result), in the style folder.

## 0. Apply the card first
```bash
node tools/vid.mjs style apply laptop-desk-zoom <project> [--mode calm|punchy]
node tools/vid.mjs style show laptop-desk-zoom
```
Then read the node kit README: `video-projects/_library/assets/kits/node-explainer/README.md`.

## 1. Colours = roles (the brand fills the hex)
| Token | Role | From the brand |
|---|---|---|
| `--ld-paper` | the desk (warm beige, soft top highlight) | canvas |
| `--ld-accent` | click ring, step badge, Aurora's pointer trail | primary |
| `NX.theme(...)` light mode | diagram tiles, lines, labels | surface / line / text |
Screenshots keep their own colours; never grade them.

## 2. Build it
- **Start from the demo block:** `_library/compositions/portrait/laptop-desk-zoom-9x16.html` (6 s, two steps + one diagram beat). Copy `assets/kits/laptop/`, `assets/kits/node-explainer/`, `assets/kits/hatch/` and `assets/kits/aurora/` next to it. GSAP and the Cairo fonts load from jsdelivr.
- **Screens:** swap `kits/laptop/screens/*.png` for your own real 1920×1080 screenshots. Fake demo data only: no real names, emails, keys or account details.
- **Layout 9:16 (1080×1920):** step badge + title top band (y ~180) · laptop ~85% width centred at y 880 · Aurora bottom-left or right · bottom band free for captions.
- **Camera (`#ld-cam`):** hard cut IN to the click target (max 1.6 output px per source px) · hold with a 6–8% push · glide OUT 0.6–0.9 s power3.inOut · moves at least 0.9 s apart.
- **Motion on white screens:** move the cursor to the target and click, sweep a selection box, fly files into folders. Never add zoom just to raise motion.
- **Concept beats:** slide the laptop half off screen, build a Node mini diagram beside it, slide back.
- **Sound:** voice −14 LUFS, music bed ~−26 LUFS. Add click/whoosh SFX as static `<audio>` tags (the library demo has none).

## 3. Checks before the owner sees it
1. `npx hyperframes lint` inside the project, 0 errors.
2. `npx hyperframes snapshot --at <each click and result>`. Read every frame; screen text must stay sharp.
3. Render a draft, then the motion check (`team/tools/motion-check.sh`): average ≥ 7, lowest second ≥ 1.0.
4. One BIG subject per shot: the punch-in fills the frame, no empty middle.
5. Privacy: zoom into every screenshot and check for names, emails, tokens, file paths with a user name.

## Do / Don't
- **Do:** land the step title on the spoken word; zoom where the click is; show the result every time; one idea per step.
- **Don't:** fake or redraw app UI, show personal data, zoom past sharp text, fire two camera moves under 0.9 s apart.

After the job: `node tools/vid.mjs style comment laptop-desk-zoom "<what worked or not>"`.
