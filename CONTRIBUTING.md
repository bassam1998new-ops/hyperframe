# Contributing to AurorA Studio

AurorA Studio should stay simple for users even when the internals are powerful.

## Before adding something

Ask:

1. Does this improve video quality, reliability, cost, or setup?
2. Does HyperFrames, Blender, After Effects, or an existing AurorA capability already solve it?
3. Can it be optional instead of a required dependency?
4. Does it need a new subsystem, or can it be a skill/knowledge update?
5. Is there evidence from real production work that we need it?

If the answer is mostly "nice to have", do not add it yet.

## Architecture rules

Keep these boundaries:

- AurorA Studio owns project/reference knowledge, cross-tool decisions, workflow state, reusable memory, and learning.
- HyperFrames owns its native programmable video/media operations.
- Blender owns true 3D.
- After Effects is optional finishing/compositing.
- Mood/creative direction stays tool-agnostic.
- User/project knowledge stays outside `.aurora/system/`.
- Do not add automatic self-training.

## Dependencies

Prefer:
- standard library
- small focused dependencies
- optional adapters

Avoid:
- giant bundled add-on packs
- duplicate render engines
- mandatory paid services
- hidden global installs
- privileged OS changes

A new required dependency needs a clear reason.

## Assets and licenses

Every imported reusable asset must have enough metadata to understand:

- source
- license
- commercial-use status
- redistribution status
- attribution requirements

Do not submit:
- client/private assets
- copyrighted assets without permission
- watermarked assets
- credentials or session data

## Skills and knowledge

A new skill should solve a repeated workflow.

Do not create a new skill for every video.

Prefer updating an existing skill when the difference is small.

Provider/tool knowledge must state when it was reviewed. Do not hard-code pricing or credit costs that can change.

## Testing

Changes to AurorA runtime behavior should include tests.

Before a PR is ready:

```bash
cd aurora-studio
npm test
node ./scripts/package-audit.mjs
node ./scripts/package-smoke.mjs
npm run release:status
```

The GitHub workflow also tests Windows and Ubuntu.

For user-visible behavior or release-note changes, keep:
- `aurora-studio/release.json`
- `aurora-studio/CHANGELOG.md`

in sync. Keep release notes short and useful; do not dump internal commit history into the changelog.

Do not weaken a failing test just to make CI green; fix the underlying behavior.

## Pull requests

Keep PRs focused.

Explain:
- problem
- why the change is useful
- what was intentionally not added
- test evidence
- licensing implications when relevant

AurorA favors strong results over feature count.
