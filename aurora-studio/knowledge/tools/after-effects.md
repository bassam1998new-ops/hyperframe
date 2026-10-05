# After Effects inside AurorA Studio

Last reviewed: 2026-10-05

After Effects is an optional finishing/compositing engine.

AurorA must work without Adobe.

Use After Effects only when it materially improves:
- compositing
- tracking
- VFX finishing
- layered motion graphics
- screen replacement
- reusable AE templates
- a finish pass that is genuinely easier/stronger than HyperFrames or Blender

## Do not route to AE when
- HyperFrames already reaches the quality bar
- Blender can finish the shot cleanly
- the only reason is "AE is installed"
- using AE makes the community workflow unnecessarily hard to reproduce

## Expressions vs scripts

### Expressions
Use expressions for property-level behavior:
- linked animation
- procedural offsets
- reusable motion relationships
- reducing repetitive keyframes

After Effects expressions are JavaScript-based and evaluate a property value.

### Scripts
Use scripts when the application/project must do something:
- create/import project items
- create comps/layers
- apply repeated setup
- change project structure
- automate render preparation

AurorA V1 uses script execution through After Effects when appropriate.

## Automated rendering
Use `aerender` for non-interactive renders.

AurorA V1 supports:
- .aep project path
- target comp
- frame range
- output path
- optional reuse of a running AE instance
- logs

Commands:
```bash
aurora-studio ae doctor
aurora-studio ae create NAME
aurora-studio ae run .aurora/after-effects/NAME.json --dry-run
aurora-studio ae run .aurora/after-effects/NAME.json
```

Prefer a fresh render process unless reusing the running app is intentional.

## Where AE belongs in a mixed route
Good:
```text
Blender → AE → HyperFrames
```
when Blender creates the 3D element, AE performs VFX/compositing, and HyperFrames owns editable titles/captions/final programmable layout.

Also valid:
```text
HyperFrames → AE
```
when AE is truly the final delivery/finish environment.

Do not add AE as a mandatory middle step.

## UXP
Adobe is actively bringing UXP to After Effects and current developer documentation/API material exists.

Treat UXP as an evolving integration path.

For AurorA V1:
- keep ExtendScript/script + aerender compatibility
- do not make UXP required
- benchmark a native UXP bridge only when the After Effects API surface is stable enough for our real workflows

## Review
Check:
- missing footage
- missing fonts/plugins
- expression errors
- comp dimensions/FPS
- color/alpha interpretation
- tracking/roto edges
- render template/output settings
- whether the AE pass actually improved the result

## Sources
- https://helpx.adobe.com/after-effects/desktop/render-and-export/automate-rendering/automated-rendering-network-rendering.html
- https://helpx.adobe.com/after-effects/desktop/work-with-expressions/expression-basics/expression-basics.html
- https://developer.adobe.com/after-effects/uxp/
