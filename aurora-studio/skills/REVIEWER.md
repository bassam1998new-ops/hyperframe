# AurorA Studio — Reviewer

Do not approve a video just because it rendered.

Every final render gets a structured run review:

`.aurora/runs/<run>/review.json`

Create/refresh it with:

```bash
aurora-studio review create RUN_ID --video path/to/render.mp4
```

The command performs the technical probe first. Then the agent fills the creative/assets review.

## Technical
- output exists and has a valid video stream
- valid duration
- expected aspect/resolution
- no known broken render
- audio/video metadata available when ffprobe is installed

## Creative
For a PASS, these required checks must all be `true`:

- project_fit
- story_clarity
- motion_intentional
- typography
- camera_crop_safe_zones
- audio
- ai_slop_free

Optional when relevant:
- reference_fit
- captions
- arabic
- three_d_vfx_quality

Optional checks may stay `null` when genuinely not applicable, but if one is set to `false`, the review cannot PASS.

Add concise notes/issues.

A PASS report must have **zero unresolved issues**. Put non-blocking commentary in `creative.notes`.

## Assets
Before PASS:
- `licenses_ok: true`
- `watermark_free: true`

If either is uncertain, do not PASS.

## Decision
Use exactly one:

- **PASS** — ready for owner approval
- **FIX** — direction is right but needs correction
- **REBUILD** — current approach cannot reach the target
- **PENDING** — review not finished

Validate:

```bash
aurora-studio review validate RUN_ID
```

Only a completed **PASS** report can complete the `post_render_review` checkpoint.

For FIX/REBUILD:
- record the problem
- return to the relevant build stage
- render again
- refresh review.json

Do not hide problems to reach PASS.
