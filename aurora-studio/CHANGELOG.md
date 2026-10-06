# Changelog

AurorA Studio follows a simple **New / Fixed** release summary so community users can understand updates quickly without reading internal implementation history.

## Unreleased

### New
- Local V1 Create dashboard with the approved dark Aurora Studio visual direction.
- `aurora-studio ui` localhost-only token-protected Studio launcher.
- Real workspace preview, stage/build board, tool health, activity, usage and library shelf.
- Library, Project, Settings and Updates V1 views.
- First-run Studio setup directly from the local UI.
- Project Brain edits and resource toggles write through existing AurorA commands/contracts.
- UI functional handoff is now visually locked for the V1 Create screen.
- Structured post-render review now uses PASS / FIX / REBUILD.
- Claude and Codex can use project-local AurorA native skills.
- Standard Windows Blender and After Effects installs can be detected outside PATH.
- npm trusted-publishing workflow is prepared but remains fail-closed until public release is explicitly enabled.

### Fixed
- PASS review is bound to the exact reviewed video before finalization.
- Windows agent-hook commands avoid embedded-quote failures.
- Windows HyperFrames execution avoids unsafe global npm shell shims.
- FFmpeg/ffprobe setup guidance is actionable by platform.
- Human-facing CLI help stays simple while advanced commands remain available behind `help --all`.

## 0.2.0 — Foundation Preview

### New
- Direct and Director modes.
- Persistent project/product brain.
- Structured reference analysis and tool-agnostic mood.
- License-aware asset/style library.
- Asset-plan workflow: REUSE / MODIFY / BUILD_NEW / NOT_NEEDED.
- Production routing after context, mood and asset evidence.
- Per-shot build plan across HyperFrames, Blender and optional After Effects.
- Approved-only learning review and bounded experience prior.
- Isolated HyperFrames workspace core.
- Blender headless jobs and transparent WebM handoff.
- Optional After Effects scripting/aerender adapter.
- Optional Obsidian knowledge UI.
- Provider playbooks for Google Flow, ChatGPT Images, Meta AI and ElevenLabs.
- Live Poly Haven CC0 search.
- Provider usage/budget ledger.
- Portable `.aurora/system/` runtime and knowledge snapshot.
- Interactive and config-driven setup.
- Windows + Ubuntu CI.
- Public package audit and real installed-tarball smoke.
- OIDC-ready npm publishing workflow.

### Fixed
- Routing waits for context, mood and asset search instead of choosing tools too early.
- Setup reruns preserve existing resource choices.
- HyperFrames is pinned to the exact tested compatibility version: **0.8.134**.
- Managed AurorA system knowledge is separated from project/user memory.
- Final approved artifacts are preserved with SHA-256 receipts.
- Release publishing is blocked until the final npm package identity is explicitly chosen.
