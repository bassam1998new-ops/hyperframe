---
id: laptop-desk-zoom
name: Laptop Desk Zoom
status: draft
version: 1
modes: [calm, punchy]
use_when: [beginner-tutorial, quick-tutorial, app walkthrough with real screenshots]
avoid_when: [ai-news, model comparisons (use versus-board), talking heads, anything without real screens]
brand: any
blocks: [laptop-desk-zoom-9x16]
skill: style-laptop-desk-zoom
approved_by:
approved_on:
approved_words:
---
# Laptop Desk Zoom

**Tone (one sentence):** A friendly beginner lesson on a warm paper desk: a laptop shows the real app, the camera cuts in on the exact click, Aurora points at it, and small diagrams pop beside the laptop when an idea needs a picture.
**Inspired by (technique, not a copy):** high-view Claude Code beginner tutorials (Edmund Yong, Tech With Tim, Duncan Rogoff; Researcher, `team/series-ai-from-zero/plan.md`) for the punch-in-on-the-screen pace, plus our Floating Desk Zoom camera grammar and the Neon Node kit's mini diagrams.

## Look
- **Palette:** roles. Paper `--ld-paper` (warm beige) with a soft top highlight · laptop body `--ld-device` (from the 3D Artist's mockup) · one accent `--ld-accent` for the click ring, the step badge and Aurora's pointer trail · diagram roles from `NX.theme` (light mode). The screenshots keep their own colours.
- **Type:** Arabic step titles Cairo 800 (top band) · step badge «١ ٢ ٣» in the accent · English UI words in mono caps only when they are on screen labels.
- **Texture:** fine paper grain (8%, multiply) on the desk only, never on the screen.
- **Grade:** none on the screenshots (text must stay sharp).

## Camera, light, performance
- **Camera:** one virtual camera over the desk. Wide = laptop fills ~85% width, centred at y 880. Punch-in = HARD CUT to the part of the screen that matters (max 1.6 output px per source px). Hold with a 6–8% push (mostly-white real screens need it to reach motion 7). Glide out 0.6–0.9 s (power3.inOut). Cut in, glide out.
- **Lighting:** flat; soft top highlight and the laptop's soft shadow. A short soft white flash (2–3 frames, ≤ 35%) is allowed on hard cuts and slides.
- **Performance:** Aurora stands beside the laptop (bottom-left or right), points at the click target, ^ ^ on a success, think-face on a question. Voice-over only.

## Edit
- **Rhythm:** a camera move or a visual change every 1–2 s (motion bar ≥ 7, same as series 1). One step = wide → punch-in on the click → click ring → result → glide out.
- **Grammar:** each spoken step gets its step badge and title on the word. A concept beat (LLM vs agent) swaps the laptop half-off screen and builds a Node mini diagram beside it, then slides back.
- **Transitions:** hard cut in, glide out, slide sideways between laptop and diagram. No fades.

## Motion (HTML / GSAP)
```json
{ "ease": { "glide": "power3.inOut", "push": "none", "pop": "back.out(1.7)", "slide": "power2.inOut" },
  "duration_ms": { "glide_out": 750, "slide": 450, "ring": 350, "badge": 250 },
  "push_scale": 1.08, "max_zoom_px_per_px": 1.6, "min_gap_between_moves_ms": 900 }
```
- **Text animations:** step title lands whole on the word (Arabic never typed); typed requests inside the screen use the real screenshot plus a caret mask reveal, never fake text.
- **Rules:** screenshots are real (PC Helper, fake demo folder, no personal data). Never invent UI. One click ring per step.
- **Motion on white screens:** on mostly-white screens, motion comes from cursor travel, selection sweeps and files moving, never from extra zoom.

## Sound
- **Music:** very low bed, about −26 LUFS. **SFX:** soft click on the ring, tiny whoosh on glides. **Mix:** voice −14 LUFS first.

## Modes
- **calm:** a move every ~2 s, no SFX. **punchy:** a move every ~1 s, click + whoosh SFX, ray burst on results.

## Prompt parts
- **Style block:** none; real screenshots on an HTML desk. If a desk plate is ever generated: warm beige paper desk seen from above, soft top light, fine grain, empty, vertical 9:16 {SUBJECT}
- **Keep:** warm paper, the same laptop mockup, real screens. **Avoid:** fake app screens, logos not on the real screen, dark backgrounds.

## Per tool
- **hyperframes:** demo block `_library/compositions/portrait/laptop-desk-zoom-9x16.html` (6 s): laptop mockup PNGs (`kits/laptop/`) with a screen rect, real screenshots as `<img>` inside it, `#ld-cam` for camera moves, a cursor and click ring, Aurora on `hatch.js` + `aurora.js`, and the Node kit for the LLM vs agent diagram.
- **images-gpt / flow-veo / higgsfield:** none, not used.

## Frames
- frames/01-at-1.0s.jpg: wide laptop, step badge «١ افتح التطبيق», cursor on the chat screen
- frames/02-at-2.3s.jpg: punch-in on the Explorer, click ring, blue selection sweep over the invoices
- frames/03-at-3.0s.jpg: glide out to the laptop with the selection held
- frames/04-at-4.3s.jpg: laptop slides half off, LLM → tools → AGENT diagram beside it, Aurora small
- frames/05-at-5.15s.jpg: Aurora ^ ^ reaction cut-in on a sunburst
- frames/06-at-5.6s.jpg: «٢ شوف النتيجة», invoices fly into the «يوليو / أغسطس / سبتمبر» folders
- frames/07-at-5.95s.jpg: folder badges count up with a burst

## Do / Don't
- **Do:** land the step title on the spoken word; zoom where the click is; show the result every time; keep one idea per step.
- **Don't:** fake screens, show real names/emails/keys, zoom past sharp text, let two camera moves fire under 0.9 s apart.
- **Don't:** add zoom to fake motion on a white screen; move the cursor, sweep a selection or move files instead.

## Tests
- 2026-10-02 demo render (team folder): 6 s, 1080×1920, motion avg 7.96, lowest second 4.90 (target ≥ 7). Built for series 3 «الـ AI من الصفر». Screens are from a fake demo folder (Incognito chat, fake invoices), no personal data.
