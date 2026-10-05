# AurorA Studio Setup Skill

Use this when a workspace is new or its resources changed.

## Goal
Configure the workspace once without making paid services mandatory.

## Steps
1. Run `aurora-studio doctor`.
2. If `.aurora/workspace.json` does not exist, run `aurora-studio setup`.
3. Ask the owner once about:
   - product/service
   - main video purpose
   - default mode: direct or director
   - optional browser/resources they already have access to
4. Never ask for passwords, cookies, tokens, or account secrets inside workspace files.
5. Re-detect local tools and integrations.
6. Save capability status. The router must not select unavailable tools.

## Production tools
- HyperFrames: core programmable motion/video engine.
- Blender: optional 3D engine.
- After Effects: optional finishing/VFX engine.

Missing Blender or After Effects must not break setup.

## Optional resources
Browser resources such as ChatGPT, Google Flow and Meta AI, and services such as ElevenLabs, can improve quality/cost when the owner already has access. They are never required.

## Obsidian
If Obsidian is installed, detect it and use it as an optional UI over AurorA's Markdown/JSON knowledge.
Do not make the Studio depend on Obsidian or its plugins.
