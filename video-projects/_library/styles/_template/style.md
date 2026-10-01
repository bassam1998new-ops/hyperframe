---
id: <slug>
name: <Style name>
status: draft
version: 1
modes: [calm, punchy]
use_when: []
avoid_when: []
brand: any
blocks: []
approved_by:
approved_on:
approved_words:
---
# <Style name>

<!-- A STYLE CARD. One folder per style: style.md (this), frames/ (3–6 approved 9:16 style frames WE OWN —
     the real contract, sent to every AI tool as the style reference), refs/ (web inspiration: links +
     small thumbnails + credit, look only, never sent to AI tools), grade.cube (optional LUT), tests/.
     Describe TECHNIQUE, never "in the style of <living artist>". Fill every line; write "none — why" if a
     line does not apply. `vid style check <slug>` tells you what is missing. Guide: brain/Jobs/Pick a style.md -->

**Tone (one sentence):**
**Inspired by (technique, not a copy):**

## Look
- **Palette:** bg #000000 · primary #000000 · accent #000000 · text #000000 — <rule, e.g. accent max 10% of the frame>
  - Palette = roles; the brand fills the hex. (Name each colour by its ROLE; for a brand job the hex comes from `brand/<name>.md`.)
- **Type:** Arabic <font> · Latin <font> · weights <…> · <case / size rule>
- **Texture:** <grain %, bloom, paper, none>
- **Grade:** <grade.cube at 60% | none> — <contrast, blacks, shadow/highlight colour>

## Camera, light, performance
- **Camera:** <shot sizes, lens feel, movement>
- **Lighting:** <key, rim, colour, contrast>
- **Performance:** <how the person talks / moves; none for no-person styles>

## Edit
- **Rhythm:** average shot <s> · longest shot <s> · cut on <beat / word / action>
- **Grammar:** <jump cuts, punch-ins, J-cuts…>
- **Transitions:** <names from the transition catalogue>

## Motion (HTML / GSAP)
```json
{ "ease": { "enter": "power3.out", "exit": "power2.in", "emphasis": "back.out(1.7)" },
  "duration_ms": { "micro": 120, "standard": 300, "hero": 600 },
  "stagger_ms": 40 }
```
- **Text animations:** <names from STYLE-CATALOG / TEXT-CRAFT>
- **Rules:** <e.g. one hero move per beat; no bounce on Arabic body text>

## Sound
- **Music:** <genre, bpm range, energy>
- **SFX:** <which, how often>
- **Mix:** <voice first; music about −18 LUFS under voice>

## Modes
- **calm:** <what changes: slower rhythm, fewer SFX…>
- **punchy:** <what changes>

## Prompt parts
<!-- Copied word for word into every image/video prompt. Content goes ONLY in {SUBJECT}. -->
- **Style block:** <fixed wording: medium, light, colour, texture, lens — technique words only> {SUBJECT}
- **Keep:** <repeat on every call: palette roles, grain, rim light colour…>
- **Avoid:** <watermark, extra text, logos, off-palette colours…>

## Per tool
<!-- Model + version + date for each. Frames go to every tool as the style reference. -->
- **images-gpt:** refs frames/01.png, frames/02.png — checked <date>
- **flow-veo:** style ingredient frames/01.png — checked <date>
- **higgsfield:** <preset / refs> — checked <date>
- **hyperframes:** motion tokens above + palette as CSS variables

## Frames
<!-- 3–6 approved 9:16 frames in frames/. One line each: "- frames/01.png — what it shows". -->

## Do / Don't
- **Do:**
- **Don't:**

## Tests
<!-- One line per tested prompt: "- tests/<date>-<tool>.md — result, the owner's answer". -->
