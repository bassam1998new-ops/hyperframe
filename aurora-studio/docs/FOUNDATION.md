# AS-00 / AS-01 Foundation Decisions

## Build, do not duplicate
AurorA Studio wraps strong engines instead of reimplementing them.

HyperFrames already provides a large programmable video foundation. AurorA adds:
- persistent project context
- reusable style knowledge
- cross-engine asset memory
- optional Blender / After Effects routing
- Direct and Director operating modes
- decision records
- learning from approved outcomes

## Optional means optional
Blender and After Effects improve the ceiling but cannot be required for setup success.

After Effects is proprietary. It is an adapter, not part of the open-source core.

Obsidian is an optional knowledge UI. Markdown/JSON remain the source of truth.

## Router V1
Do not train a small decision model yet.

Order:
1. hard requirements
2. availability
3. asset/library search
4. previous approved experience
5. deterministic scoring
6. large Director model fallback

Only after real decision data exists should we benchmark a small learned router.

## Hooks
Start with only:
- preflight
- post-approval
- post-update

More hooks require evidence that they prevent failures or remove repeated work.

## Public installation
Foundation package stays private until:
- command names are stable
- schemas are stable enough to migrate
- final npm name/scope is confirmed
- updater safety exists

Target UX:
`npx <package>@latest setup`

## Update UX
Keep updates simple:
- visible current version
- clear update available state
- short fixed/new summary
- one primary Update button
- one defer option
- no forced Adobe/Blender/Obsidian installs
- migrations tested before applying
