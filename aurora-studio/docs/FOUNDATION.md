# AurorA Studio Foundation Decisions

## Build, do not duplicate
AurorA Studio wraps strong engines instead of reimplementing them.

HyperFrames already provides a large programmable video foundation. AurorA adds:
- persistent product/project context
- reusable style and asset knowledge
- cross-engine asset memory
- Blender / optional After Effects routing
- Direct and Director modes
- resumable production state
- approved-work learning

## Creative order
Do not choose the production tool at the start.

Order:
1. understand project/reference
2. concept when needed
3. tool-agnostic mood
4. asset/style search
5. reuse / modify / build decision
6. route
7. build / review / finalize

Direct mode may explicitly skip concept/mood for simple work.
Director mode may not.

## Optional means optional
Blender and After Effects improve the ceiling but cannot be required for setup success.

After Effects is proprietary and stays an optional adapter.

Obsidian is an optional knowledge UI. Markdown/JSON remain the source of truth.

## Router V1
Do not train a small decision model yet.

Use:
1. hard requirements
2. availability
3. project/reference context
4. asset/style search
5. previous approved experience
6. deterministic scoring
7. large Director model fallback for unusual/low-confidence cases

Only after enough real decision data exists should we benchmark a learned small router.

## Hooks
Keep hooks lean:
- agent SessionStart context refresh
- internal preflight
- post-approval finalize/learning
- post-update validation once the updater exists

Do not hook every tool call.

## Public installation
Keep the package private until:
- command names are stable
- schemas have migration rules
- final npm name/scope is confirmed
- updater safety exists
- Linux/Windows CI is green

Target UX:
`npx <package>@latest setup`

## Update UX
Keep updates simple:
- visible current version
- concise New / Fixed summary
- Update now
- Maybe later
- no forced Adobe/Blender/Obsidian installs
- migrations validated before applying
