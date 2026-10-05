# HyperFrames inside AurorA Studio

Last reviewed: 2026-10-05

HyperFrames is AurorA's primary programmable video/motion engine.

AurorA owns:
- project/product brain
- reference adaptation
- cross-tool routing
- cross-engine asset memory
- Direct / Director flow
- approved learning

HyperFrames owns its native video/media operations.

## Before rebuilding something
Check HyperFrames first.

## Command path

Prefer the AurorA wrapper when available:

```bash
aurora-studio hyperframe run doctor
```

In a one-time npx workspace without a global AurorA command:

```bash
node .aurora/system/bin/aurora-studio.mjs hyperframe run doctor
```

AurorA may install HyperFrames privately under `.aurora/tools/`. It never needs to modify the user's project package.json.

Direct `hyperframes ...` remains valid when the user already manages HyperFrames themselves.

### Project / render loop
- `hyperframes doctor`
- `hyperframes lint <project>`
- `hyperframes check <project>`
- `hyperframes snapshot <project>`
- `hyperframes compare ...`
- `hyperframes preview ...`
- `hyperframes render ...`

### Media OS
Use the HyperFrames `media-use` workflow for:
- BGM
- SFX
- images
- icons
- logos
- TTS voice
- transcription
- captions
- color grade / LUT
- media cuts / reframes / transforms
- reusable media

Typical resolve:
```bash
npx hyperframes media-use resolve --type <type> --intent "<need>" --project <dir>
```

Before resolving fresh, inspect reusable candidates when the current HyperFrames skill recommends it.

### Human background removal
```bash
npx hyperframes remove-background subject.mp4 -o subject.webm
```

Use another masking/segmentation route when the subject is not a person or when VFX-grade edges are required.

### Beat grid
```bash
npx hyperframes beats <project> --json
```

### Keyframe diagnostics
```bash
npx hyperframes keyframes <project> --json
```

## Skills
HyperFrames maintains its own agent skills.

Before depending on a HyperFrames workflow that may have changed, use its current skill/update mechanism rather than relying on old AurorA memory.

For example:
```bash
npx hyperframes skills update general-video
```

Load only the HyperFrames skill relevant to the active task.

## Upgrade
HyperFrames ships its own upgrade check:
```bash
npx hyperframes upgrade --check --json
```

AurorA should not silently upgrade HyperFrames mid-project.

Use:
`aurora-studio hyperframe upgrade-check`

If an upgrade is available, treat it as a separate maintenance action, not part of an active production run.

## Important
Do not create AurorA duplicates of a stable HyperFrames capability unless:
1. the upstream feature cannot meet the quality/constraint,
2. we have evidence from real jobs,
3. the new capability is cross-engine rather than HyperFrames-specific.

## Sources
- https://github.com/heygen-com/hyperframes/blob/main/skills/hyperframes-cli/SKILL.md
- https://github.com/heygen-com/hyperframes/blob/main/skills/media-use/SKILL.md
- https://github.com/heygen-com/hyperframes/blob/main/docs/guides/remove-background.mdx


## Compatibility pin

AurorA Studio currently tests against **HyperFrames 0.8.134**.

The workspace installer uses that exact version.

Do not silently float to a newer HyperFrames release inside an active AurorA version. A newer upstream version should first pass AurorA CI and then be promoted in a normal AurorA release/update.
