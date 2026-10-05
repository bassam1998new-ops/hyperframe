# AurorA Studio — Asset Search

Search before building or generating.

## Search order
1. Current project assets
2. Workspace approved library
3. AurorA shared library
4. Approved open-source / open-license catalogs
5. Procedural build with HyperFrames or Blender
6. External generation services when configured and useful
7. Manual/specialist build

## Decision
Return one of:
- REUSE
- MODIFY
- BUILD_NEW

Include:
- closest matches
- similarity / fit
- license status
- quality
- modification cost
- reason

## License rule
Never treat "found online" as permission to use. Save source + license metadata for imported community assets.

## Cost rule
Do not spend paid generation credits when an approved asset can reach the same quality with reasonable modification.
