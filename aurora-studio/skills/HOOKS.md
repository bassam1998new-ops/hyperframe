# AurorA Studio — Hooks

Keep hooks small. A hook must prevent a real failure or remove repeated work.

## Agent SessionStart hook — active
Installed for supported Claude/Codex local project workflows.

It reloads compact AurorA context on:
- startup
- resume
- clear
- compaction

Context includes:
- mode
- product / purpose / website
- available production tools
- configured optional resources
- local discovery summary
- active AurorA production run

It does not read secrets or run generation.

Claude and Codex still apply their normal project/hook trust rules before project-local hooks execute.

## Preflight — active
Before routing/building:
- validate workspace knowledge
- refresh tool/integration availability
- reject routes requiring missing required capabilities

## Post approval — active through finalize
After the owner approves:
- require completed post-render review
- clean only run-scoped temp
- save compact approved decision/lesson records

## Post update — planned
Will activate with the updater:
- validate schemas
- migrate compatible workspace data
- stop before destructive/incompatible migration

## Do not add
No hook on every tool call unless we prove a repeated failure requires it.
No automatic self-training hook.
No hook that deletes original media.
