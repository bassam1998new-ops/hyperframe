# AurorA Studio — Director Mode

Director mode gives the owner control over the idea before expensive production begins.

## Flow
1. PREFLIGHT
2. CONTEXT
3. REFERENCE DECONSTRUCTION
4. CONCEPTS
5. OWNER PICK
6. MOOD CONTRACT
7. ASSET / STYLE SEARCH
8. REUSE / MODIFY / BUILD
9. TOOL ROUTING
10. SHOT / BUILD PLAN
11. DRAFT
12. REVIEW
13. FINAL
14. APPROVAL + LEARN

## Start
- run `aurora-studio plan "<task>" [--reference ID]`
- read the saved run context
- read project.json and discovery.json
- if a reference exists, complete its structured analysis
- do not ask the owner for facts already available in the workspace/site

**Do not select Blender / HyperFrames / After Effects at plan time.**

## Concepts

Director runs have a structured:
`.aurora/runs/<run>/concepts.json`

Create/read it with:

```bash
aurora-studio concepts create RUN_ID
```

Fill **2–3 genuinely different ideas**, not color/layout variants.

For each concept write:
- `id`
- `name`
- `core_idea`
- `project_fit`
- `emotional_arc`
- `visual_motion_grammar[]`
- `complexity`: low / medium / high / hero
- `cost_class`: free / low / medium / high / unknown
- `biggest_risk`
- optional preview/notes

Do not lock the software unless a hard requirement makes a capability mandatory.

When concepts are ready:
- set `status=ready`
- validate:
  `aurora-studio concepts validate RUN_ID`

The owner selects through Studio or:

```bash
aurora-studio concepts select RUN_ID CONCEPT_ID
```

Do **not** manually complete the concept checkpoint. Selection records the owner gate.

If the owner wants changes:

```bash
aurora-studio concepts refine RUN_ID --concept CONCEPT_ID --note "..."
```

Refinement/change of direction is allowed before actual build begins. If mood/assets/routing/build-plan were already prepared, AurorA invalidates and rebuilds those derived plans.

Once actual build/render work has started, direction is locked. Use the later revision workflow instead of silently replacing the concept.

## Mood
Create/fill the run's `mood.json`.

Mood stays tool-agnostic.

It must define:
- intent
- emotional/energy arc
- composition/depth
- camera/lens feeling
- lighting
- palette/type/material language
- motion/edit grammar
- voice/music/SFX/silence
- continuity anchors
- must-not-happen rules

Validate it:
```bash
aurora-studio mood validate RUN_ID
aurora-studio checkpoint RUN_ID mood completed --artifact .aurora/runs/<run>/mood.json
```

## Assets
Search:
1. current project
2. approved AurorA library/styles
3. curated open asset sources
4. procedural build
5. configured browser generation
6. build new

Fill the run's `asset-plan.json`.

Return per need:
- REUSE
- MODIFY
- BUILD_NEW
- NOT_NEEDED

For REUSE/MODIFY, select actual AurorA library IDs.
For BUILD_NEW, state required capabilities.

Validate:
`aurora-studio asset-plan validate RUN_ID`

Then complete the assets checkpoint with the asset-plan artifact.

## Routing
Only now run:
`aurora-studio routing RUN_ID`

Unavailable optional tools get zero weight.
Prefer the simplest path that can honestly hit the requested quality.

## Shot / build plan
Routing creates `build-plan.json`.

Assign the best engine per shot/build unit. The whole video does not need one tool.

Examples:
- kinetic intro → HyperFrames
- true 3D avatar → Blender
- Blender overlay → transparent WebM → HyperFrames
- AE finishing → only if the routed path includes After Effects and the finish materially improves quality

Validate and complete the build_plan stage before building.

## Draft
Do not spend hero-quality render/generation cost before the direction works as a draft.

## Final review
Check project/reference fit, story clarity, hierarchy, captions/Arabic, crop/safe zones, audio, repetition, AI-slop, broken frames, missing assets/fonts, brand rules and license status.

## Explain to owner
Keep explanations simple. Show creative choices and major trade-offs, not internal orchestration noise.
