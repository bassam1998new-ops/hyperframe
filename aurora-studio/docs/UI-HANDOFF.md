# AurorA Studio — UI Functional Handoff

Status: **visual direction locked for V1 Create screen**.

The owner approved a dark cinematic Studio reference on 2026-10-06.

This document defines both the functional contract and the canonical V1 visual DNA for the current build.

## Product rule

AurorA Studio should feel much simpler than its internals.

A normal user should understand only:

1. choose **Direct** or **Director**
2. give the agent a request/reference
3. review the result
4. approve/revise
5. AurorA keeps the useful knowledge

Do not expose routing JSON, checkpoints, schemas, hooks or internal CLI commands in the normal UI.

Advanced/debug information may exist behind a clearly secondary developer/details surface.

---

## Main navigation

V1 needs only:

- **Create**
- **Library**
- **Project**
- **Settings**
- **Updates**

Avoid adding separate pages for every engine/provider.

---

## 1. Create

This is the main screen.

### Required controls

- Direct / Director mode switch
- prompt/request input
- reference upload/link area
- current project/product indicator
- optional quality intent:
  - Draft
  - Normal
  - Premium
  - Hero
- Start

### Direct mode

The UI should communicate:

> Fast production. AurorA chooses the best available path and asks only when needed.

Do not show the internal stage machine by default.

During work show a compact status such as:

- Understanding reference
- Checking reusable assets
- Building
- Reviewing
- Ready for you

### Director mode

The UI should communicate:

> More control. AurorA gives you concepts first, then builds the direction you choose.

The important visible owner gates are:

1. concept selection
2. final approval

Mood, asset planning, routing and build planning happen behind those gates.

### Result area

Show:

- current preview/video
- Approve
- Revise
- short agent summary
- optional “Why this approach?” disclosure

Do not show raw model/tool reasoning.

---

## 2. Library

One simple searchable library across engines.

Tabs/filters may include:

- Assets
- Styles
- 3D
- Audio
- Fonts

Users should not need to understand separate internal registries.

Each reusable item may show:

- preview
- name
- type
- approved/reusable status
- source
- license
- compatible tools

Useful actions:

- Use
- View source
- Remove from AurorA library
- Mark approved / not approved

Do not make external open-source catalogs look like locally owned assets until the item has actually been imported/tracked.

---

## 3. Project

This is AurorA’s persistent product brain.

Show only useful editable context:

- product/service
- website
- audience
- offer / positioning
- languages
- brand personality
- colors
- fonts/logos
- creative preferences
- things to avoid

### Behavior

AurorA should learn this once from:

- owner answers
- project files
- approved website/public pages when allowed

The UI should make it easy to correct these settings.

Do not expose embeddings, retrieval scores or internal memory files.

A small source indicator is useful where important:

- Owner
- Website
- Local file

---

## 4. Settings

### Production tools

Show capability status, not technical configuration first.

#### HyperFrames
- Required core
- Installed / Missing
- Tested compatible version
- Check update

#### Blender
- Optional
- Detected / Not detected
- path/details only under Advanced

#### After Effects
- Optional
- Detected / Not detected
- clearly say AurorA works without it

### Media runtime

- FFmpeg
- ffprobe

If missing, show the actionable install guidance from AurorA doctor.

### Optional browser/resources

Availability toggles only:

- ChatGPT
- Google Flow
- Meta AI
- ElevenLabs

Never ask users to paste browser cookies, passwords or session tokens into AurorA.

### Knowledge UI

- Obsidian: optional detected/not detected

Do not imply Obsidian is required for AurorA memory.

---

## 5. Updates

Keep this intentionally close to the simple Hermes update experience.

Show:

- AurorA Studio logo
- current version
- update available state
- short **New**
- short **Fixed**
- primary **Update now**
- secondary **Maybe later**

Optional secondary detail:

- tested HyperFrames version
- migration/backup note if an update changes workspace schema

### Rules

- no giant changelog wall
- no forced Blender / AE / Obsidian install
- do not update HyperFrames silently in the middle of a production job
- backup/migration checks happen before destructive workspace changes
- failed update must leave user/project knowledge safe

---

## First-run setup

Keep onboarding short.

AurorA detects local capabilities first.

Ask only for:

- product/service
- website (optional)
- what videos are mainly for
- Direct or Director default
- which optional browser/resources are already available

If HyperFrames is missing:

> Install AurorA’s tested HyperFrames core for this workspace?

Default: Yes.

Blender / After Effects / Obsidian remain optional.

Do not turn setup into a technical wizard.

---

## Tool transparency

AurorA may use multiple engines in one video, but normal UI should summarize this simply.

Example:

> Built with Blender + HyperFrames

Optional details disclosure can show:

- Blender — 3D avatar
- HyperFrames — titles, captions and final composition

Do not show capability scores or routing internals unless developer mode is enabled.

---

## Cost / credits

Normal UI should show actual known provider usage when useful.

Examples:

- Google Flow: 6 credits
- ElevenLabs: 1,250 credits
- Known spend: $0.20

Rules:

- never convert unrelated provider credits into each other
- never invent USD cost when provider did not expose one
- warn before a paid action crosses the configured threshold

Keep cost information secondary unless it requires owner approval.

---

## Review

The user-facing review is simple:

- preview
- Approve
- Revise

Internally AurorA still performs:

- technical probe
- sampled visual review
- creative checks
- license/watermark checks
- exact reviewed-file SHA binding

Do not make users manually fill the internal review JSON.

When AurorA detects a problem, say what needs fixing in normal language.

---

## Learning

After approval, AurorA may say:

> Saved 1 reusable lesson.

or:

> New reusable style found — review before adding?

Never silently create permanent skills/styles from every session.

“Nothing new worth saving” is a valid outcome and should produce no UI noise.

---

## Developer / Advanced

Keep this hidden from normal users.

May expose:

- raw workspace health
- tool paths
- active run ID/stages
- logs
- JSON artifacts
- package/release diagnostics
- CLI copy buttons

This is for debugging/community contributors, not the core product.

---

## V1 screens to design later

When the owner supplies the final visual style, design these first:

1. First-run setup
2. Create — Direct
3. Create — Director concept selection
4. Create — final review
5. Library
6. Project brain
7. Settings / Tools
8. Updates

Do **not** add more top-level screens until real users prove they are needed.

---

## Visual direction — locked for V1

Use the approved reference's visual DNA, translated to real AurorA functionality:

- near-black / deep indigo workspace
- very thin violet glass borders
- subtle blur and low-opacity glass panels
- restrained violet / electric blue / cyan accent gradient
- AurorA gradient orb as the main identity/status motif
- dense professional editing workspace, but not noisy
- compact neutral UI typography
- large current preview as the visual anchor
- production/build board beside the preview
- activity/status rail on the right
- reusable asset shelf below
- small green/amber/violet status indicators
- soft glow only around active/important states
- rounded panels/buttons, never bubbly or toy-like

Do **not** copy fake/demo product labels from the visual reference.

Translate them to real AurorA state:
- rendering pill → active run/current stage
- storyboard → real Director/build-plan shots
- spend → known real provider usage only
- asset shelf → real AurorA library
- engine status → HyperFrames / Blender / optional AE availability
- activity → real checkpoints/decisions
- prompt field → creates a real AurorA run

### Navigation simplification

Do not copy both crowded side rails from the reference.

Permanent V1 destinations stay:
- Create
- Library
- Project
- Settings
- Updates

The current implementation enables Create and the in-page Library shelf first. Other visual pages come in later UI passes; do not fake them.

### V1 implementation

The first coded screen is:
- **Create dashboard**
  - Direct / Director switch
  - request input
  - real preview
  - real simplified stage/build board
  - tool health
  - activity
  - real usage
  - library shelf

Launch:
`aurora-studio ui`

The UI uses packaged plain HTML/CSS/JS and reads the existing AurorA workspace. It does not create a second backend or duplicate Studio state.
