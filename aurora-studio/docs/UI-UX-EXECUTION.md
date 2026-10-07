# AurorA Studio — UI/UX Execution Tracker

Source of truth for scope: `docs/UI-UX-MASTER-PLAN.md`

Do not start a later wave before the current wave passes its package/Windows/Ubuntu gates, unless the later work is read-only research.

| Wave | Scope | Status |
| --- | --- | --- |
| UI-10 | Design system + component foundation | **Complete ✅** |
| UI-11 | Create core + Media Chrome | **Complete ✅** |
| UI-12 | Director concepts | **Complete ✅** |
| UI-13 | Storyboard / build board | Complete ✅ |
| UI-14 | Asset workflow | **Complete ✅** |
| UI-15 | Render + review | **Complete ✅** |
| UI-16 | Library full | **Complete ✅** |
| UI-17 | Project Brain | **Implemented — CI pending** |
| UI-18 | Settings | Planned |
| UI-19 | Updates | Planned |
| UI-20 | Mobile + accessibility + visual regression | Planned |

## UI-10 delivered

- canonical design tokens
- base accessibility / focus / reduced-motion rules
- split CSS layers
- split view-rendering modules
- token-aware API module
- router
- toast primitive
- dialog/drawer primitive
- skeleton/empty-state primitives
- selected self-hosted Lucide icon geometry + ISC notice
- pinned Floating UI DOM 1.8.0
- localhost-served Floating UI dependencies
- enhanced tooltips with graceful native fallback
- package/audit/smoke gates updated for the modular UI

## Gate before UI-11

- full tests green on Windows
- full tests green on Ubuntu
- package audit 0 findings
- installed-package smoke green
- Floating UI installed version exactly 1.8.0
- local Floating UI vendor routes work from the installed package


## UI-11 delivered

- real quality intent: Draft / Normal / Premium / Hero
- real aspect intent: project / 9:16 / 16:9 / 1:1
- intent persisted in `plan.json`
- selected reference bound to `plan.json`
- quality/aspect included as soft routing evidence
- secure reference upload under `.aurora/references/files/`
- URL references without automatic remote fetching
- visual-reference vs source-material role
- recent reference picker with analysis summary
- 512 MB hard upload cap
- allowlisted reference file types
- honest agent handoff when no live bridge exists
- pinned Media Chrome 4.19.3
- custom AurorA media player with native fallback
- player controls: play, seek, time, mute/volume, speed, fullscreen
- no browser-only production intent state

## Gate before UI-12

- reference unit/security tests green
- UI upload/link tests green
- quality/aspect/reference persistence test green
- Media Chrome installed version exactly 4.19.3
- local Media Chrome vendor route works from installed package
- Windows + Ubuntu full suite green
- package audit 0 findings


## UI-12 delivered

- structured `concepts.json` per Director run
- 2–3 concept validation contract
- concept name / core idea / project fit / emotional arc / visual-motion grammar
- complexity / cost class / biggest risk
- explicit owner concept selection
- concept checkpoint cannot complete without a valid selected concept
- explicit owner approval remains mandatory
- concept refinement requests are durable
- changing direction before build safely resets derived mood/assets/routing/build-plan
- direction locks once actual build work starts
- Director concept cards replace the production board when owner choice is needed
- selected direction stays visible in preview
- selected direction can be reopened before/after choice
- refinement modal writes real concept requests
- no chat-text scraping for concepts

## Gate before UI-13

- concept lifecycle/reset/lock tests green
- Director E2E uses structured concept selection
- Studio snapshot concept state test green
- UI select/refine endpoint tests green
- Windows + Ubuntu full suite green
- package audit 0 findings
- installed-package smoke green


## UI-13 delivered

- safe structured storyboard mutations around `build-plan.json`
- add / edit / duplicate / remove shot
- exact shot reorder contract
- drag reorder with pinned SortableJS 1.15.7
- Move up / Move down non-drag accessibility fallback
- shot inspector drawer
- per-shot engine restricted to selected production route
- per-shot Draft / Normal / Premium / Hero quality
- optional duration / planned output
- real output thumbnail only when the file exists
- real planned / complete status only; no fake percentage
- prior build plan archived before every edit
- stale review archived when storyboard changes
- downstream build/render/review/approval/finalize state invalidated after edits
- finalized runs are read-only
- browser endpoints are allowlisted storyboard operations only
- local/offline SortableJS vendor route + MIT notice

## Gate before UI-14

- storyboard mutation tests green
- downstream invalidation/history tests green
- browser storyboard endpoint test green
- SortableJS exact version 1.15.7 installed
- local SortableJS vendor route works in installed package
- Windows + Ubuntu full suite green
- package audit 0 findings
- installed-package smoke green


## UI-14 delivered

- structured asset-plan editing from Studio
- safe downstream invalidation when asset evidence changes
- tracked Library picker with REUSE / MODIFY
- unapproved Library items cannot be reused from the drawer
- fail-closed UI approval for unknown commercial rights
- Poly Haven search
- server-controlled CC0 tracking metadata
- open assets are tracked before reuse
- BUILD_NEW / NOT_NEEDED decisions
- durable provider generation requests
- configured provider availability only
- live-cost / owner-approval budget gate
- hard budget-cap block
- generation status is `pending_agent`, never fake “generating”
- finalized runs remain read-only
- Library registry removal never deletes source files

## Gate before UI-15

- full tests green on Windows
- full tests green on Ubuntu
- package audit 0 findings
- installed-package smoke green
- Asset workflow modules included in portable package
- provider cost approval tests green
- asset-change invalidation tests green


## UI-15 delivered

- honest render-ready state; no fake universal renderer
- no fake render percentage
- no fake Cancel action
- existing real video outputs can be registered for review
- render registration requires workspace-contained video + ffprobe pass
- focused final Review workspace
- Media Chrome result playback
- Result / Reference / Side-by-side compare
- sampled visual evidence strip
- human-readable technical/creative/license/watermark review
- strict Approve gate from real `review.json`
- exact reviewed-file SHA is revalidated at approval/finalization
- changed reviewed files invalidate stale approval
- owner approval is explicit
- auto-finalize only when learning review is already complete
- otherwise honest Claude/Codex learning/finalization handoff
- durable revision requests
- Fix reopens Build
- Rebuild reopens Build Plan
- Director Change direction reopens Concepts
- stale review/evidence/learning archived on revision
- finalized runs stay read-only
- final artifact can be opened from Studio after finalization

## Gate before UI-16

- revision lifecycle tests green
- stale reviewed-video hash tests green
- browser render/review/approve/revision flow green
- Windows + Ubuntu full suite green
- package audit 0 findings
- installed-package smoke green
- Review workflow + revision contracts included in portable package


## UI-16 delivered

- full tracked Library grid
- search by name/type/license/tool/tag
- filters for Assets / Styles / 3D / Audio / Fonts / Templates
- Approved / Pending review filters
- clickable keyboard-safe Library cards
- approval state visible on cards
- real use-count visible on cards
- detail drawer with real preview
- editable name / description / tags / quality tier
- license-aware approve/unapprove control
- source/license/commercial/redistribution/attribution metadata
- local file availability
- safe tracked-item Reveal action
- source URL action
- tracked use history derived from real run asset/shot references
- Use in current run routes through existing asset-plan workflow
- removal confirmation
- removing from Library never deletes original source file

## Gate before UI-17

- Library metadata/update/remove tests green
- safe reveal tests green
- factual use-history snapshot test green
- browser Library workflow test green
- Library workflow/styles included in portable package
- Windows + Ubuntu full suite green
- package audit 0 findings
- installed-package smoke green


## UI-17 delivered

- complete stable Product context
- audience groups
- audience knowledge level
- audience priorities
- offer / positioning
- protected product claims
- brand personality / colors / fonts / logo paths / avoid rules
- languages / channels / default formats / recurring series
- preferred / avoid moods
- recurring creative constraints
- stable owner notes
- provenance overview
- owner provenance from Studio edits
- website provenance only for valid http(s) URLs
- first-run setup provenance
- no false claim that Studio re-read the website
- provenance source cards
- protected-claims visual treatment
- per-field Reset controls that stay local until Save
- dirty-state Save feedback
- backward-compatible optional audience_context schema

## Gate before UI-18

- Project Brain default/schema tests green
- provenance upsert tests green
- complete browser Project save test green
- invalid website provenance test green
- first-run setup provenance test green
- Project styles included in portable package
- Windows + Ubuntu full suite green
- package audit 0 findings
- installed-package smoke green
