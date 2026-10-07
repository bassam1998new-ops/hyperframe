# Changelog

AurorA Studio follows a simple **New / Fixed** release summary so community users can understand updates quickly without reading internal implementation history.

## Unreleased

### New
- Compact semantic Agent Canvas for live Claude Code / Codex work: multi-agent presence, video-task status, run progress and Needs-you state.
- A connected agent is distinguished from a claimed production run, so Studio keeps the handoff visible until Claude/Codex actually touches the run.
- Claude TaskCreated / TaskCompleted observation without persisting task descriptions.
- Honest Complete / Partial / Deferred product-status documentation.
- Near-real-time Claude/Codex activity appears inside the Studio Activity rail.
- Project-local async agent hooks record sanitized lifecycle/tool metadata only during active AurorA production work.
- Studio shows agent Working / Waiting for you / Idle / bridge-ready states with graceful fallback when hooks are unavailable.
- Live-agent visual QA is permanently covered by a canonical desktop screenshot.
- Safety-first Updates workspace with real release checks, migration/active-run blockers, workspace backup and separate HyperFrames status.
- Update backup history and managed-system downgrade protection.
- Full Settings workspace with factual tools, runtime, agents, resources, budget and advanced diagnostics.
- Persistent Blender / After Effects / FFmpeg overrides that control real production execution.
- Project-local Claude/Codex install, repair and removal controls with pointer/skill/hook health.
- Budget observe / warn / hard-cap behavior with explicit USD approval threshold.
- Complete Project Brain UI with audience context, protected claims, recurring content/creative context and provenance.
- Honest owner/website provenance with no fake website-refresh claims.
- Full Library detail workflow with approval, tags, quality, source/license metadata and use history.
- Approved/Pending/Templates filters and safe tracked-item Reveal / Use in run actions.
- Focused final Review workspace with Result / Reference / Side-by-side comparison.
- Real sampled visual evidence, technical metadata, quality checks, issues and exact reviewed-file approval.
- Durable Fix / Rebuild / Director Change direction revision requests with safe downstream invalidation.
- Honest render-ready handoff: Studio never invents render progress or cancellation when the route has no universal direct executor.
- Asset decision drawer with tracked Library reuse/modify, Poly Haven CC0 search, BUILD_NEW/NOT_NEEDED decisions, and provider-generation handoffs.
- Provider generation requests use real budget approval/cap rules and remain `pending_agent` until an agent fulfills them.
- Editable Storyboard/build board with drag reorder, shot inspector, add/edit/duplicate/remove, and keyboard-safe move controls.
- SortableJS 1.15.7 is pinned and self-hosted for storyboard reordering.
- Director concepts now use a structured 2–3 direction workflow with owner selection and refinement.
- Direction changes safely invalidate derived planning before build; direction locks once build starts.
- Create now supports durable reference selection, quality tier and aspect intent.
- Secure local reference uploads and external reference links.
- Media Chrome 4.19.3 player with AurorA-styled controls and native fallback.
- Honest Claude/Codex handoff when a run exists but no live agent bridge is connected.
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
- Older AurorA packages can no longer overwrite a newer managed `.aurora/system` snapshot.
- Update backups now preserve run evidence/styles while excluding run-scoped temp.
- Setup reruns now preserve budget policy and explicit production-tool paths.
- Saved FFmpeg paths now also drive ffprobe review and HyperFrames media execution.
- Settings path validation fails before persisting budget changes.
- Changed reviewed files now invalidate stale approval and fail SHA validation before approval/finalization.
- Review approval cannot apply to a different file than the exact render AurorA reviewed.
- Asset changes now invalidate stale routing, build plans, reviews, approvals and finalization state before production continues.
- Library approval from the UI now fails closed when commercial rights are not verified.
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
