# AurorA Studio — UI/UX Master Plan

Status: **canonical plan — freeze before further UI implementation**

Visual target: the owner's approved dark cinematic Studio reference, matched at reference-level quality and improved only where usability benefits.

This plan is the source of truth for all V2 UI/UX work. Do not invent new screens, top-level navigation, workflows, or permanent controls during implementation unless this document is updated first.

---

# 1. Product promise

A normal user should understand only:

1. choose **Direct** or **Director**
2. give AurorA a request and optional reference
3. review concepts when Director mode asks
4. watch/adjust the production
5. review the final
6. approve or revise
7. AurorA keeps only useful reusable knowledge

AurorA may internally use HyperFrames, Blender, optional After Effects, browser providers, local assets, open assets, checkpoints, routing, budgets and reviews.

The normal UI must hide that complexity until it becomes useful to the user.

---

# 2. Visual quality bar

The implementation is not accepted because it merely works.

It must match the approved reference in:

- shell proportions
- information density
- panel hierarchy
- preview dominance
- navigation weight
- dark depth
- border strength
- blur/glass depth
- typography hierarchy
- spacing rhythm
- icon consistency
- status light treatment
- active-state glow
- hover/focus/pressed states
- progress states
- loading/skeleton states
- empty states
- visual balance at 16:9 desktop sizes
- responsive behavior

## Canonical visual DNA

- near-black / deep indigo base
- restrained violet / electric-blue / cyan Aurora accent
- very thin low-opacity glass borders
- subtle panel blur
- soft active-state glow, never glow everywhere
- compact neutral UI type
- white/very-light foreground
- restrained grey secondary text
- green = successful/available
- amber = waiting/approval/cost warning
- red = failure/blocker
- violet = active production / AurorA action
- rounded panels, not playful bubbles
- Aurora gradient orb as the identity/status motif
- no stock dashboard aesthetic
- no generic component-library look

## Responsive priority

1. desktop: 1440–1920 wide — canonical layout
2. laptop: 1100–1439 — collapse secondary rail / tighter grid
3. tablet: 768–1099 — stacked work panels
4. mobile: 390–767 — monitor/approve/revise experience, not a full editing workstation

Mobile does **not** need every desktop editing control.

---

# 3. Navigation

Permanent top-level navigation:

1. **Create**
2. **Library**
3. **Project**
4. **Settings**
5. **Updates**

Do not add top-level pages for individual engines/providers.

Secondary contextual surfaces use:

- right drawer
- modal
- popover
- bottom sheet on mobile
- full-screen focus mode when necessary

## Hidden developer mode

Developer mode may expose:

- raw run ID
- checkpoint details
- tool paths
- logs
- JSON artifacts
- CLI commands
- release diagnostics

It is never shown by default.

---

# 4. Global shell

Visible across configured Studio views:

## Left rail

- Aurora orb
- Create
- Library
- Project
- Settings
- Updates

Rules:
- icon + tiny label desktop
- compact icons only on narrower widths
- active destination has restrained violet glass highlight
- no fake disabled destinations after V2

## Top bar

Left:
- breadcrumb: AurorA › current view
- Studio identity
- reachable-engine status summary

Center:
- active-run pill
- current visible stage/status
- render progress when available
- owner-action-needed state when blocked

Right:
- global production request input on Create
- otherwise view-specific primary action/search

## Global notification pattern

Use compact toasts for:
- saved
- run created
- retry started
- asset imported
- update check complete

Use persistent blocker banner/card for:
- FFmpeg missing
- required HyperFrames unavailable
- cost approval required
- owner concept choice required
- failed render
- failed update/migration

Never hide blockers in toast-only feedback.

---

# 5. First-run Setup

Purpose: one short onboarding, not a technical wizard.

## Screen

Hero:
- Aurora orb
- “Set up AurorA Studio”
- one-sentence explanation

Fields:
- product/service
- website optional
- main video purpose
- default mode: Direct / Director

Detected section:
- HyperFrames
- Blender
- After Effects
- FFmpeg / ffprobe
- Obsidian optional

Optional resource toggles:
- browser control
- ChatGPT
- Google Flow
- Meta AI
- ElevenLabs

Optional:
- approved extra local asset folders

Agent integration:
- install Claude/Codex project-local AurorA integration
- explain this is project-local, not global

HyperFrames:
- if missing: “Install AurorA’s tested HyperFrames core in this workspace?”
- default yes

## States

- detecting tools
- ready
- HyperFrames missing
- FFmpeg missing
- install in progress
- setup failed
- setup complete

## Logic

Uses existing configured setup contract.

Never request:
- password
- browser cookie
- auth token
- API secret

---

# 6. Create — Idle

This is the home screen.

## Hero strip

- time-aware greeting
- product name
- short real status summary

Metrics:
- approved final renders
- current-run known spend
- approved reusable library count

Mode:
- Direct
- Director

## Prompt composer

Inputs:
- task/request
- optional reference attachment/link
- quality intent:
  - Draft
  - Normal
  - Premium
  - Hero
- aspect:
  - Project/default
  - 9:16
  - 16:9
  - 1:1
  - Custom only under advanced

Primary action:
- Start

Secondary:
- add reference
- choose existing library/reference

## Important V1/V2 agent rule

Typing into Studio creates the real AurorA run.

Studio must not pretend that this alone automatically invokes Claude/Codex unless an agent bridge is actually connected.

If no active agent bridge exists, show:

> Run created — continue in Claude/Codex.

Actions:
- Copy agent task
- Open instructions
- Hide once a connected bridge exists in the future

---

# 7. Reference Import / Brief Drawer

Opened from Create.

Tabs:

1. Upload
2. Link
3. Library
4. Recent

Accepted:
- video
- image
- PDF/document when useful to the brief

For each reference:
- preview
- source/name
- remove
- “Use as visual reference”
- “Use as product/source material”

Do not blur the difference between:
- visual style reference
- product/source content

## Analysis result

After analysis, show a compact human summary:

- visual direction
- motion/camera
- typography
- 3D/VFX need
- key continuity rules

Optional “Details” expands technical analysis.

Never expose raw hidden reasoning.

---

# 8. Create — Direct Mode Workflow

Direct mode visible user stages:

1. Understanding
2. Assets
3. Building
4. Reviewing
5. Ready

Internal concept/mood stages may be skipped without UI noise.

## During work

Main preview:
- current draft/render when available
- otherwise elegant progress visual

Production board:
- simplified visible phases before build plan exists
- shot/build units after build plan exists

Activity:
- completed actions
- blockers
- owner actions needed
- retries
- tool changes
- cost warnings

## Direct owner interruptions

Only interrupt for:
- required approval threshold
- missing required capability
- meaningful ambiguity
- failed route/build
- final approval

---

# 9. Create — Director Mode Workflow

Director visible user stages:

1. Understanding
2. Concepts
3. Direction selected
4. Building
5. Reviewing
6. Ready

## Concepts screen/state

Show 2–3 concept cards.

Each card:
- concept name
- one-line idea
- why it fits project
- mood/energy
- likely production complexity
- estimated cost class when known
- biggest risk
- optional reference frame/mood image if available

Actions:
- Select
- Refine
- Reject

Owner selection writes the existing concept approval checkpoint.

Do not expose internal routing yet.

## After concept choice

Show:
- selected direction
- short mood contract
- “Change direction” until expensive build begins

Then proceed to asset search/routing/build.

---

# 10. Storyboard / Build Board

The board becomes detailed after build-plan exists.

## Shot card

- number
- thumbnail
- short shot purpose/name
- duration
- engine badge
- quality tier
- output state
- cost/credit when known
- progress
- review status

## Actions

- select shot
- edit brief
- reorder
- duplicate
- remove
- retry
- regenerate/rebuild
- change quality
- open output
- open source/build details
- change engine only through an explicit reroute action

Changing engine must not silently bypass hard routing requirements.

## Drag/reorder

Use **SortableJS**.

After reorder:
- persist explicit shot order in build plan
- mark build plan changed
- downstream render must acknowledge the new order

## Add shot

Only when build plan exists.

New shot requires:
- purpose
- duration optional
- input/reference optional
- quality
- engine defaults to recommended route, not arbitrary user guess

---

# 11. Shot Inspector / Drawer

Opens from a shot.

Sections:

## Brief
- purpose
- duration
- source/reference
- expected output

## Engine
- HyperFrames / Blender / AE
- why this engine was chosen in one sentence
- change/reroute action

## Assets
- selected tracked assets
- source/license
- replace/use another

## Generation provider
Only when used:
- provider
- model
- resolution
- credits/cost known
- regenerate action

## Output
- preview
- file
- status
- technical metadata
- open/reveal

## Logs
Developer-only.

---

# 12. Media Preview / Player

Use **Media Chrome** for the real player controls.

Required:
- play/pause
- seek
- volume/mute
- duration/current time
- fullscreen
- playback speed under menu
- frame-step when technically possible
- resolution/aspect badge
- current shot marker

AurorA skin remains custom.

No browser-default controls in final V2.

## Reference compare

Modes:
- Result
- Reference
- Side-by-side
- Wipe/slider when both visual assets are compatible

Use this mainly in Review, not always in Create.

---

# 13. Audio / Waveform

Only show when the run contains meaningful audio/voice/music.

Use **WaveSurfer.js**.

Features:
- waveform
- playhead
- shot markers
- transcript/caption regions when available
- voice/music/SFX labels
- volume context

Do not build a full DAW.

---

# 14. Asset Decision / Generator Drawer

Triggered when:
- user opens Assets
- AurorA asks for owner choice
- shot requires a generated/reused asset

Sections:

1. Current project
2. AurorA Library
3. Open assets
4. Generate
5. Build new

## Search result card

- preview
- source
- license
- tools
- quality
- reuse/modify status

Actions:
- Use
- Inspect
- Track/import
- Open source

## Open sources

Poly Haven live search first where relevant.

Other curated sources:
- ambientCG
- Kenney
- Quaternius
- Openverse

Do not display external search result as owned/local until tracked.

## Generate

Only configured providers appear.

Provider cards:
- ChatGPT
- Google Flow
- Meta AI
- ElevenLabs

Before paid generation:
- show current live credit/cost when known
- show budget approval if threshold crossed

---

# 15. Styles / Looks

Do not create another top-level screen.

Library filter:
- Styles / Looks

Each style:
- preview frames
- name
- tone
- recommended use
- tools
- approval
- source
- last used

Actions:
- Use
- Preview
- Edit metadata
- Mark approved
- Archive/remove

A newly learned style always enters **Pending review**, never auto-approved.

---

# 16. Render Control

Render controls appear when build plan is ready.

## Draft render

Primary during iteration.

Show:
- Draft / Normal / Premium / Hero
- aspect
- engine-specific summary hidden under details
- estimated provider usage if known

## Final render

Requires:
- build plan valid
- pre-render review passed
- no unresolved blocker
- budget approval if needed

Actions:
- Render
- Cancel when underlying engine supports real cancellation
- Retry
- Re-render changed shots only when backend supports it

Do not show Cancel if the adapter cannot actually cancel.

## Progress

Per shot:
- queued
- building
- rendering
- complete
- failed

Overall:
- percent only if backed by real measurable progress
- otherwise step/status language, no fake percentage

---

# 17. Review / Approval

This is a major Create state, not a hidden technical screen.

## Layout

Left:
- large result player

Right:
- compact review summary
- detected issues
- reference compare toggle
- final usage
- engines used

Primary actions:
- **Approve**
- **Revise**

Secondary:
- Rebuild
- Download/open final
- Why this approach?

## Internal review

AurorA creates structured review.json.

Required PASS fields stay internal.

The user sees normal-language issues such as:

> Caption is too close to the lower safe area.

Not:

> camera_crop_safe_zones=false

## Approve

- owner checkpoint
- finalize exact reviewed SHA
- preserve final receipt
- learning review
- cleanup run temp

## Revise

User can:
- type revision
- select shot
- choose issue
- choose “keep direction, fix this”
- choose “change direction”

Revision creates new work and invalidates previous PASS/final review when output changes.

---

# 18. Library

Full tracked reusable memory.

## Search/filter

- All
- Assets
- Styles
- 3D
- Audio
- Fonts
- Templates
- Approved
- Pending review

Search:
- name
- tags
- source
- tool

## Card

- preview
- name
- type
- source
- license
- compatible tools
- quality tier
- approved state

## Item detail drawer

- larger preview
- metadata
- source URL
- license
- path
- tools
- tags
- use history
- related project/run

Actions:
- Use in current run
- Mark approved/not approved
- Edit tags
- Reveal/open
- Remove from AurorA Library

Removal from Library does **not** delete original user file unless explicitly requested and safe.

---

# 19. Project Brain

Purpose: stable context, not one-video decisions.

Sections:

## Product
- product/service
- website
- purpose
- offer
- positioning
- protected claims

## Audience
- audience groups
- sophistication/knowledge level
- needs/priorities

## Brand
- personality
- colors
- fonts
- logo files
- avoid rules

## Content
- channels
- languages
- recurring formats/series

## Creative
- preferred moods
- avoid moods
- recurring constraints

## Sources

Show provenance:
- Owner
- Website
- Local file

Actions:
- Save
- Reset one field
- inspect source
- refresh website-derived context when supported

Do not expose embeddings/retrieval scores.

---

# 20. Settings

## Production tools

HyperFrames:
- required
- detected version
- tested version
- compatible yes/no
- install tested core
- check update
- never silently upgrade active project

Blender:
- optional
- detected/path
- test connection
- advanced path override

After Effects:
- optional
- afterfx/aerender status
- clearly works without it

## Runtime

- Node
- FFmpeg
- ffprobe
- actionable install hint

## Agent integration

- Claude
- Codex
- pointers installed
- native skills installed
- hooks installed
- reinstall/remove

## Optional resources

- browser control
- ChatGPT
- Google Flow
- Meta AI
- ElevenLabs
- Obsidian
- approved local asset folders

## Budget

- observe / approval / cap
- USD threshold
- provider credits are never converted unless real provider pricing exists

## Advanced

Collapsed:
- paths
- logs
- developer mode
- system sync
- raw diagnostics

---

# 21. Updates

Hermes-style simplicity.

Hero:
- Aurora icon
- current version
- update available / up to date

Sections:
- New
- Fixed

Actions:
- Update now
- Maybe later

## Before applying

- release gate
- package identity valid
- backup
- migration plan
- no active production that would be unsafe to interrupt

## Failure

Must preserve:
- project brain
- library
- runs
- lessons
- user files

Show clear rollback/recovery state.

## HyperFrames

Separate:
- current exact tested version
- update available
- update intentionally separate from AurorA Studio update

---

# 22. Activity / Notifications

Right rail, not top-level page.

Shows:
- meaningful completed steps
- owner action requested
- failed/retried actions
- route/tool change
- provider use
- review issue
- learning proposal
- update available

Do not log every low-level tool call.

Notification severity:
- info
- success
- needs-you
- warning
- failure

---

# 23. Approval / Cost modal

Triggered only when needed.

Examples:
- provider cost crosses threshold
- final concept selection
- final video approval
- risky/destructive action

Show:
- what will happen
- why
- cost if known
- what data/provider is involved
- Continue / Cancel

No dark patterns.

---

# 24. Errors / recovery

Every major screen must define:

## Empty
Useful explanation + one obvious next action.

## Loading
Skeleton matching final geometry; no layout shift.

## Offline/provider unavailable
Keep local state usable.

## Tool missing
Actionable install/detection guidance.

## Render failed
- reason
- Retry
- Change approach when appropriate
- logs only under details

## Stale run
Explain what changed and refresh safely.

## File missing
Never silently delete library/run references; mark unavailable and let user repair/remove.

---

# 25. Keyboard / accessibility

Required:

- visible focus
- tab order
- Escape closes drawer/modal
- Enter confirms primary action only where safe
- Space controls focused media player
- arrow keys in storyboard selection
- command palette shortcut later, not required V2
- ARIA labels for icon-only buttons
- minimum contrast appropriate for dark UI
- reduced-motion support

Drag/drop must always have non-drag alternative:
- Move up
- Move down

---

# 26. Motion system

Use CSS/Web Animations API first.

Motion principles:
- 120–180 ms micro-interactions
- 180–260 ms panel/drawer transitions
- no springy consumer-app bounce
- active render pulse restrained
- Aurora orb breathing subtle
- no continuous decorative motion that competes with video

Use reduced-motion media query.

Do not add an animation library unless real implementation proves the native APIs insufficient.

---

# 27. Open-source UI libraries

## Adopt

### Lucide
Purpose:
- complete icon language

Usage:
- self-hosted/static icons
- custom stroke weight/size
- no branded logos from Lucide

License:
- ISC

### Media Chrome
Purpose:
- production-quality video controls
- fullscreen/seek/volume/menu behavior

Why:
- Web Components
- MIT
- framework-free

### Floating UI
Purpose:
- tooltips
- popovers
- context menus
- dropdown positioning

Why:
- behavior only
- custom visual layer stays ours

License:
- MIT

### SortableJS
Purpose:
- storyboard shot drag/reorder

Why:
- framework-free
- touch support

License:
- MIT

### WaveSurfer.js
Purpose:
- audio waveform only when audio exists

License:
- BSD-3-Clause

## Do not adopt now

### Web Awesome
Reason:
- broad component system not needed
- harder to match the reference exactly
- our issue is not missing generic buttons/forms

### Shoelace
Reason:
- sunset

### React/Vite
Reason:
- not required yet
- would add build/runtime complexity to a currently portable zero-build UI

Re-evaluate only if the UI architecture becomes unmaintainable after real use.

---

# 28. Component architecture

Keep packaged ES modules.

Refactor UI into:

```text
ui/
  index.html
  styles/
    tokens.css
    shell.css
    components.css
    views.css
    responsive.css
  app/
    app.js
    api.js
    state.js
    router.js
    format.js
    components/
      aurora-icon.js
      toast.js
      tooltip.js
      modal.js
      drawer.js
      media-player.js
      status-chip.js
      asset-card.js
      shot-card.js
      activity-item.js
      cost-badge.js
    views/
      setup.js
      create.js
      library.js
      project.js
      settings.js
      updates.js
    workflows/
      reference.js
      concepts.js
      storyboard.js
      asset-picker.js
      render.js
      review.js
```

No giant single app.js.

---

# 29. Backend/API contract plan

The UI server remains a thin localhost control surface.

## Existing endpoints/actions

- GET state
- media serving
- mode
- plan
- project edit
- resources
- setup
- update check

## Required V2 additions

### References
- upload file
- add URL
- list references
- select reference for current run
- remove reference record

### Director
- get concept proposals
- select concept
- request concept refinement

Concept storage must be structured; do not scrape chat text.

### Storyboard
- list build-plan shots
- update shot metadata
- reorder shots
- add/remove/duplicate shot

### Assets
- library detail
- approve/unapprove
- edit tags
- remove from library
- import tracked asset
- open-asset search
- provider generation handoff

### Render
- start draft/final build where adapter supports it
- real progress when known
- retry
- cancel only when supported

### Review
- create/refresh review
- submit revision note
- approve final
- finalize

### Tool/settings
- install tested HyperFrames
- tool doctor
- agent install/remove
- system sync
- update plan/backup/apply when safe updater exists

Security rules:
- localhost only
- random token
- path containment
- no arbitrary shell command endpoint
- allowlisted fields/actions
- no secrets returned to browser

---

# 30. Data/state model for UI

UI state is derived, not another source of truth.

Sources:
- workspace.json
- project.json
- reference files
- library/index.jsonl
- run plan/state
- mood
- asset plan
- build plan
- usage
- review
- learning review
- receipts
- live tool detection

Client state:
- active view
- current selected shot
- open drawer/modal
- unsaved form changes
- UI filters/search
- temporary optimistic state

Never persist product truth in browser localStorage.

Allowed localStorage:
- non-sensitive UI preference only, e.g. collapsed panel state

---

# 31. Full workflow matrix

## Direct / no reference

Setup → Create request → Understand → Asset decision → Route → Build plan → Draft/build → Review → Approve/Revise → Finalize → Learn.

## Direct / with reference

Attach reference → Analyze → Understand project fit → Asset decision → Route → Build → Compare/review → Approve/Revise → Finalize.

## Director / no reference

Create request → Concepts → Owner select → Mood → Assets → Route → Storyboard/build plan → Build → Review → Approve → Finalize.

## Director / with reference

Reference analyze → Project adaptation → Concepts → Owner select → Mood → Assets → Route → Storyboard → Build → Reference compare → Review → Approve.

## Revision

Review → Revise → revision brief → affected shots/build units → rerender → new review/hash → Approve.

## Asset reuse

Need detected → library search → select tracked asset → asset plan REUSE/MODIFY → build.

## Asset generation

Need detected → search misses → Generate drawer → provider check → budget/cost approval if needed → generate draft → inspect → choose → track asset → build.

## 3D

Need true 3D → library/open asset search → REUSE/MODIFY/BUILD_NEW → Blender shot → transparent/opaque handoff → HyperFrames/AE if route requires.

## AE

Only when route requires finishing/VFX → render upstream input → AE job → output → downstream/final review.

## Update

Update check → New/Fixed → user chooses update → verify no unsafe active run → backup → migration plan → apply when updater exists → health check → rollback on failure.

---

# 32. Screen/state acceptance matrix

Every implemented screen must pass:

## Functional
- real backend action
- no dead/fake button
- success state
- failure state
- loading state
- empty state
- disabled state when action impossible

## Visual
- reference-level spacing/hierarchy
- desktop screenshot comparison
- laptop screenshot comparison
- mobile screenshot comparison
- no overflow
- no accidental browser-default controls
- no inconsistent icon styles
- no unstyled native select/dialog where visible

## Accessibility
- keyboard
- focus
- label
- contrast
- reduced motion

## Security
- token required for state/action endpoints
- allowlisted writes
- contained media/file paths
- no secret exposure

---

# 33. Screenshot / visual QA gates

For each major screen/state capture:

Desktop 1600×1000:
- Setup
- Create idle
- Create Direct active
- Director concepts
- Director storyboard
- Review
- Library
- Project
- Settings
- Updates

Laptop 1280×800:
- Create active
- Storyboard
- Review

Mobile 430×932:
- Create status
- Owner concept choice
- Review/Approve
- Library
- Settings blocker

Compare against canonical reference for:
- density
- hierarchy
- alignment
- border/glow
- typography
- whitespace
- clipping
- interaction discoverability

Do not approve UI from code review alone.

---

# 34. Execution waves

## Wave UI-10 — Design system + component foundation
- tokens
- typography
- Lucide
- Floating UI
- modal/drawer/tooltip
- responsive shell
- skeleton/error states
- split current giant CSS/app JS

## Wave UI-11 — Create core + Media Chrome
- reference input
- quality/aspect controls
- real media player
- Direct workflow
- active progress
- agent handoff state

## Wave UI-12 — Director concepts
- concept cards
- selection/refinement/rejection
- owner approval checkpoint
- selected-direction summary

## Wave UI-13 — Storyboard/build board
- SortableJS
- shot cards
- inspector
- reorder/add/duplicate/remove
- per-shot engine/quality/status

## Wave UI-14 — Asset workflow
- library picker
- open-source search
- provider generation drawer
- license/source details
- cost approval

## Wave UI-15 — Render + review
- render controls
- real progress
- compare reference/result
- PASS/FIX/REBUILD summary
- Approve/Revise
- exact reviewed-hash finalization

## Wave UI-16 — Library full
- filters/search/detail drawer
- approval/tags/remove/use
- styles/looks

## Wave UI-17 — Project
- structured source/provenance display
- stable-context edit UX
- protected claims

## Wave UI-18 — Settings
- tools
- runtime
- agents/hooks
- resources
- budget
- advanced diagnostics

## Wave UI-19 — Updates
- Hermes-style update modal/page
- backup/migration state
- HyperFrames update separation
- updater apply only when safe backend exists

## Wave UI-20 — Mobile + accessibility + visual regression
- mobile owner workflows
- keyboard
- reduced motion
- screenshot QA
- final density/polish

---

# 35. Definition of done

AurorA Studio UI is not done until:

- no normal workflow requires manual JSON editing
- no normal workflow requires remembering CLI commands
- every visible button has real backend behavior
- Direct can complete a normal video workflow
- Director can complete concept → storyboard → review workflow
- reference upload/analysis is usable
- storyboard is editable
- assets can be reused/imported/generated safely
- preview player is production-quality
- review/approval is first-class
- library/project/settings/updates are complete
- desktop matches the approved reference quality
- mobile supports monitoring/decision workflows
- screenshot regression checks exist
- Windows + Ubuntu package gates pass
- installed-package smoke passes
- package audit has 0 findings
- no fake spend/progress/provider claims
- no secret/cookie/password storage
- no OpenMontage branding/reference in the public product

---

# 36. Scope control

Do not add before real use proves value:

- full DAW
- node-graph editor
- full After Effects clone
- full Blender editor
- timeline NLE comparable to Premiere/Resolve
- vector DB just for UI
- trained routing model
- collaboration/multi-user cloud account system
- marketplace
- giant plugin/add-on bundles

AurorA Studio is the **agent-driven production control surface**, not a replacement for every creative application.
