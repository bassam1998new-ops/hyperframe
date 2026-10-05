# AurorA Studio — Direct Mode

Direct mode is fast production with minimum interruption.

## Contract
1. Run plan/context.
2. Understand the request/reference and current product.
3. Search approved styles/assets before generating.
4. Decide REUSE / MODIFY / BUILD_NEW.
5. Route only after that evidence exists.
6. Draft fast.
7. Review.
8. Render final.
9. Ask for approval, then finalize/learn.

## Simple job
After understanding:
```bash
aurora-studio checkpoint RUN_ID understand completed
aurora-studio checkpoint RUN_ID concept skipped
aurora-studio checkpoint RUN_ID mood skipped
```

Fill/validate `asset-plan.json`, then complete the assets checkpoint.

For a pure procedural/typography job, the asset plan may contain no needs; write a short completed summary instead of inventing assets.

Then:
`aurora-studio routing RUN_ID`

## Build plan
After routing, fill the generated `build-plan.json`.

For a simple job this may be one HyperFrames build unit.
For mixed jobs, assign each unit to the engine that owns it and make handoffs explicit.

Validate and complete `build_plan` before execution.

## Premium / reference-heavy / multi-tool job
Do not skip mood.

Create/fill:
`aurora-studio mood create RUN_ID`

Then validate and complete mood before assets/routing.

## Tool bias
- HyperFrames: programmable 2D, captions, UI, social motion and variants.
- Blender: true 3D, avatars, models, rigs, materials, lighting, cameras, physics.
- After Effects: optional finishing/compositing/VFX only when it materially improves the result.
- Browser AI: only if configured/useful; cheap preview first, then final selected asset.

## End of job
After owner approval:
1. Save final + reproducible source.
2. Keep reusable approved assets/styles.
3. Clean only safe run-scoped temporary files.
4. Save compact useful decision/lesson.
5. Do not auto-train or silently rewrite routing.
