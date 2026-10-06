# AurorA Studio — UI/UX Execution Tracker

Source of truth for scope: `docs/UI-UX-MASTER-PLAN.md`

Do not start a later wave before the current wave passes its package/Windows/Ubuntu gates, unless the later work is read-only research.

| Wave | Scope | Status |
| --- | --- | --- |
| UI-10 | Design system + component foundation | **Implemented — CI pending** |
| UI-11 | Create core + Media Chrome | Planned |
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
