---
name: aurora-workspace
description: Set up a new AurorA Studio workspace once, capturing the product/service and available resources without repeatedly asking the same questions.
---

# AurorA workspace

Ask only for missing high-value facts:
1. What product/service/person are these videos for?
2. What is the main audience and goal?
3. Website or source folder to learn from?
4. Which local folders may the agent search?
5. Which optional providers may it use: authenticated browser sessions, ElevenLabs, paid APIs?

Save stable answers in `PROJECT.md`, `RESOURCES.md`, and `.aurora/studio.json`.

Do not ask these again on every video. Re-open setup only when the user asks to change it or the requested job conflicts with saved context.

Never write credentials, cookies, tokens or passwords into workspace files.
