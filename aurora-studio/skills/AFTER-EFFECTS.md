# AurorA Studio — After Effects

After Effects is optional. Never make an AurorA project depend on it unless the workspace actually has it.

## Use it when
- compositing or VFX materially improves the result
- tracking or layered finishing is easier/stronger in AE
- an approved reusable AE template saves time
- Blender or HyperFrames output needs a dedicated finishing pass

## Avoid it when
- HyperFrames or Blender already reaches the target quality
- the only reason is that AE is installed
- the workflow would become harder to reproduce for community users

## V1 automation
- ExtendScript/JSX through afterfx -r for scripted operations
- aerender for automated renders
- keep project, scripts and render settings reproducible

## Workflow
1. Search existing templates/assets first.
2. Create an AE job.
3. Use a draft render before expensive finishing.
4. Run Reviewer checks after final output.

## CLI
    aurora-studio ae doctor
    aurora-studio ae create finish-pass
    aurora-studio ae run .aurora/after-effects/finish-pass.json --dry-run
    aurora-studio ae run .aurora/after-effects/finish-pass.json

## Future
Adobe UXP support can become a richer native bridge after its After Effects APIs are mature enough. Do not block V1 on it.
