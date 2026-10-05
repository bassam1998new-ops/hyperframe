# AS-00 / AS-01 Foundation Decisions

## Build, do not duplicate

AurorA Studio wraps strong existing engines instead of reimplementing them.

HyperFrames already provides a large programmable video foundation. AurorA adds:
- persistent project context
- reusable style knowledge
- asset search and reuse rules
- optional Blender / After Effects routing
- Direct and Director operating modes
- cross-tool decision records
- learning from approved production outcomes

## Optional means optional

Blender and After Effects improve the ceiling but cannot be required for setup success.

After Effects is proprietary. It is an adapter, not part of the open-source core.

OpenMontage is AGPLv3. Until the project makes an explicit licensing decision, use it as:
- an optional external adapter
- a source of architecture ideas
- a benchmark

Do not copy its AGPL implementation into the core.

## Router V1

Do not train a small decision model yet.

Order:
1. hard requirements
2. availability
3. asset/library search
4. previous approved experience
5. deterministic scoring
6. large Director model fallback

Only after real decision data exists should we benchmark Laya or another small router.

## Public installation

Foundation package stays private until:
- command names are stable
- schemas are stable enough to migrate
- final npm name/scope is confirmed
- updater safety exists

Target UX:
`npx <package>@latest setup`

## Update UX

The later desktop UI should borrow the useful simplicity of Hermes updates:
- visible current version
- clear update available state
- short fixed/new summary
- one primary Update button
- one defer option
- no forced Adobe/Blender installs
- migrations tested before applying
