# AurorA Studio — Hooks

Keep hooks small and useful.

## Active hooks

### preflight
Before routing/building:
- verify `.aurora/workspace.json`
- refresh tool/integration availability
- reject routes that need unavailable required capabilities

### post_approval
Only after the owner approves the final result:
- run safe cleanup rules
- keep reproducible source/final output
- capture compact decision and lesson records
- update a style only when it is genuinely reusable

### post_update
After an AurorA Studio update:
- validate schemas
- validate knowledge/tool cards
- report incompatible workspace data before changing it

## Rule
Do not add hooks unless they remove a repeated manual step or prevent a real failure.

Project-local agent hooks are executable configuration. Install/activate agent-specific hooks only after the user trusts the project.
