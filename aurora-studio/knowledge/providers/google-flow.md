# Google Flow

Last reviewed: 2026-10-05

Use when the workspace has Google Flow available and generated video materially improves the result.

## Strong use cases
- text-to-video
- image/frames-to-video
- first + last frame transitions
- ingredient/reference-driven clips
- editing generated/uploaded video
- fast variations
- project-level scene exploration

## Draft-first rule
Prefer a low-cost draft path first.

Current Flow supports Gemini Omni Flash in 360p and 720p. The 360p mode is cheaper than the equivalent 720p generation.

Do not hard-code a credit number into AurorA behavior. Before each paid generation, inspect the active Flow model, duration, resolution, output count and current credit cost.

## Reference quality
For ingredients:
- use clean product/subject references
- prefer plain or segmented backgrounds
- avoid conflicting style/location/subject guidance
- keep ingredient styles visually consistent when possible

## When to upscale
Only upscale/regenerate after:
- composition works
- subject consistency works
- motion direction works
- the asset has actually been selected for the final edit

## Avoid
- generating text that HyperFrames can typeset better
- spending final-quality credits on unapproved concepts
- relying on a Flow-only workflow when a reusable local asset already exists

## Sources
- https://support.google.com/flow/answer/16353334
- https://support.google.com/flow/answer/16352836
- https://support.google.com/flow/answer/16526234
