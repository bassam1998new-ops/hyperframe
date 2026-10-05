---
name: aurora-workspace
description: Set up or refresh an AurorA Studio workspace once, preserving product context and optional resources without repeatedly asking the same questions.
---

# AurorA workspace

Use AurorA's canonical workspace brain.

Read:
- `.aurora/system/skills/SETUP.md`
- `.aurora/system/skills/PROJECT-CONTEXT.md`

Prefer deterministic agent setup:
`aurora-studio setup --config <file>`

If the global command is unavailable:
`node .aurora/system/bin/aurora-studio.mjs ...`

Do not create a second config system.
Do not store credentials, cookies or tokens.
Ask only for missing high-impact facts.
