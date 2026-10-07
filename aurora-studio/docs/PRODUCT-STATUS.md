# AurorA Studio — Product Status

This file separates what AurorA Studio **really does today** from workflows that still depend on an external agent or are intentionally deferred.

The rule is simple: do not describe a capability as complete unless the current package can execute or enforce it.

## Complete today

### Studio workflow
- First-run setup
- Direct and Director modes
- Project Brain editing
- Reference file/link registration
- Director concept selection and refinement
- Storyboard add/edit/reorder/duplicate/remove/move
- Asset-plan add/edit/remove/complete
- Reusable library tracking and license metadata
- Open-asset search/tracking
- Provider generation-request planning
- Production routing
- Per-shot build plan
- Render artifact registration
- Structured PASS / FIX / REBUILD review
- Revision requests
- Final owner approval
- Approved final artifact receipt
- Usage and known-USD budget guardrails

### Production engines
- HyperFrames core detection / isolated workspace install / compatibility check
- Blender detection, headless jobs and transparent WebM handoff
- Optional After Effects detection, scripts and aerender jobs

### Agent integration
- Project-local Claude Code integration
- Project-local Codex integration
- Project-local native AurorA skills
- Session context injection
- Safe live hook metadata
- Multi-agent presence in Studio
- Semantic current-work status
- Run progress
- Needs-you state
- Claude TaskCreated / TaskCompleted observation
- Safe Activity history without prompt/tool-output persistence

### Studio application
- Localhost-only token-protected UI
- Create / Library / Project / Settings / Updates
- Desktop / laptop / mobile responsive layouts
- Media preview/player
- Canonical browser screenshot QA
- Axe accessibility QA
- Horizontal-overflow QA

### Release / maintenance
- Portable `.aurora/system/`
- Package audit
- Real installed-tarball smoke
- Safe update check / plan / backup
- Fail-closed npm release gate
- OIDC trusted-publishing workflow prepared

## Partial by design

These are real workflows, but one part is intentionally owned by another tool.

### Browser generation
Studio can:
- choose/configure a provider
- create a generation request
- record cost/credits
- track resulting assets

Claude/Codex + browser control still perform the actual browser interaction with ChatGPT, Google Flow, Meta AI or ElevenLabs.

AurorA does not embed or store browser sessions, passwords or cookies.

### Live preview
Studio shows:
- current registered render
- shot outputs
- review media

It does **not** stream every Blender/HyperFrames render frame live.

### Native engine progress
Studio knows AurorA run stage, shot status and produced artifacts.

It does not yet expose deep native render percentages from Blender or After Effects.

### Agent execution
Studio creates and tracks the AurorA production run and observes Claude/Codex work.

Studio does not start or own the agent conversation itself.

Agent permission prompts remain inside the agent that owns the permission model.

### Codex live bridge
Codex project hooks are supported.

For the current cwd-relative project hook, launch Codex from the project root for reliable live activity.

### Updates
Update check, compatibility plan and backup are real.

Automatic remote update execution is intentionally disabled until public package identity/migrations are locked.

## Intentionally deferred

These should only be built after real production evidence shows they improve outcomes.

- learned small router / Laya
- vector database
- automatic self-training
- giant Blender/add-on/asset bundles
- native desktop wrapper
- embedded browser/account sessions
- full ACP/unified-agent controller
- deep Blender / After Effects render telemetry
- automatic remote update execution

## Product principle

AurorA Studio should feel simpler as it becomes more capable.

Before adding a subsystem, ask:

1. Does it materially improve video quality, reliability or user control?
2. Can the existing file/CLI/agent contracts already solve it?
3. Will a normal user need to learn a new concept?
4. Can it stay optional?
5. Can we prove it with a real production job?

If the answer is mostly no, do not add it.
