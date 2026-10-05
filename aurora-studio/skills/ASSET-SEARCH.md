# AurorA Studio — Asset Search

Search before building or generating.

## Search order
1. Current project assets
2. Workspace approved library
3. AurorA shared library
4. HyperFrames media-use / catalog when the asset fits its media system
5. Approved open-source / open-license catalogs, including 3D sources
   - start with `aurora-studio assets search "<need>"` when Poly Haven fits the need
   - otherwise use `aurora-studio asset-sources "<need>"` to pick the next source
6. Procedural build with HyperFrames or Blender
7. External generation services when configured and useful
8. Manual/specialist build

HyperFrames already has a media OS for resolving, generating, operating on and remembering media. Use it instead of recreating equivalent image/audio/icon/BGM/SFX/voice workflows.

AurorA's extra asset layer should focus on cross-engine reuse:
- 3D models
- rigs
- animation clips
- materials
- HDRIs
- AE templates when licensed
- Blender scenes/nodes
- approved styles
- assets created in previous AurorA jobs

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

Provider prices/credits change. Store them as updateable provider data; never hard-code marketing promises such as a fixed credit cost into the Director skill.
