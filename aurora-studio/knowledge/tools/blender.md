# Blender inside AurorA Studio

Last reviewed: 2026-10-05

Blender is AurorA's true-3D engine.

Use it when the result genuinely needs:
- 3D modeling
- rigging / character animation
- real materials and lighting
- 3D product shots
- 3D camera moves
- geometry / physics / simulation
- reusable 3D scenes

Do not use Blender just because a reference "looks 3D".

## Draft vs final

### Fast draft
Prefer the fastest renderer that can answer the creative question.

Use EEVEE when:
- framing / timing / materials / light direction are still changing
- the shot does not need physically exact light transport
- fast iteration matters more than final realism

EEVEE uses the same shader-node system as Cycles and is designed for fast PBR rendering, so it is a strong preview path.

### Final
Use Cycles when:
- realistic reflections/refractions matter
- glass / metal / complex light transport matters
- the quality bar clearly benefits from path tracing
- the owner approved the draft and final render time is justified

Do not automatically switch every shot to Cycles. If EEVEE already meets the visual target, keep the simpler/faster path.

## Headless / repeatable work
Prefer reproducible Python for repeatable scene changes.

AurorA V1 supports:
- Blender job JSON
- source .blend
- Python script execution
- headless render
- logs
- draft/final quality labels

Commands:
```bash
aurora-studio blender doctor
aurora-studio blender create NAME
aurora-studio blender run .aurora/blender/NAME.json --dry-run
aurora-studio blender run .aurora/blender/NAME.json
```

## HyperFrames handoff
When Blender owns only part of the video:

1. render transparent RGBA PNG frames
2. keep Blender Film transparent
3. pack to VP9 alpha WebM
4. hand the overlay to HyperFrames for editable typography/UI/final layout

```bash
aurora-studio blender handoff "frames/f_%04d.png" renders/overlay.webm --quality premium
```

Use an opaque video instead when alpha is not needed.

## Arabic 3D text
Blender does not reliably shape Arabic text by itself.

AurorA includes:
`blender/helpers/arabic_text.py`

Optional packages:
- arabic-reshaper
- python-bidi

Install/use them only when the job needs Arabic 3D text.

## Asset strategy
Before building:
1. project assets
2. AurorA approved library
3. Poly Haven / approved open sources
4. modify a close reusable 3D asset
5. build new

Do not install giant asset/add-on packs by default.

## Reproducibility
Keep when needed:
- .blend
- important Python scripts
- imported licensed assets
- final render settings
- renderer used
- handoff files needed by the final composition

## Review
Check:
- camera framing
- scale/proportions
- lighting consistency
- material realism/stylization
- animation arcs
- clipping/intersections
- alpha edges if used
- render time vs quality gain
- asset license

## Sources
- https://docs.blender.org/manual/en/dev/render/eevee/
- https://docs.blender.org/api/current/
