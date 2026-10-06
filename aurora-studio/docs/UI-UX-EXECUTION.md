# AurorA Studio — UI/UX Execution Tracker

Source of truth for scope: `docs/UI-UX-MASTER-PLAN.md`

Do not start a later wave before the current wave passes its package/Windows/Ubuntu gates, unless the later work is read-only research.

| Wave | Scope | Status |
| --- | --- | --- |
| UI-10 | Design system + component foundation | **Complete ✅** |
| UI-11 | Create core + Media Chrome | **Implemented — CI pending** |
| UI-12 | Director concepts | Planned |
| UI-13 | Storyboard / build board | Planned |
| UI-14 | Asset workflow | Planned |
| UI-15 | Render + review | Planned |
| UI-16 | Library full | Planned |
| UI-17 | Project Brain | Planned |
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
