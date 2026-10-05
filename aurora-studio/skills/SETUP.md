# AurorA Studio Setup Skill

Use this when a workspace is new or its resources changed.

## Goal
Configure the workspace once without making paid services mandatory.

## Steps
1. Run `aurora-studio doctor`.
2. Read `PROJECT-CONTEXT.md` and enrich the project profile from local/site evidence before asking extra onboarding questions.
3. If `.aurora/workspace.json` does not exist, run `aurora-studio setup`.
4. Ask the owner once about:
   - product/service
   - main video purpose
   - default mode: direct or director
   - optional browser/resources they already have access to
5. Never ask for passwords, cookies, tokens, or account secrets inside workspace files.
6. Re-detect local tools and integrations.
7. Save capability status. The router must not select unavailable tools.

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


## HyperFrames core

HyperFrames is required for AurorA's core programmable video path.

If no compatible HyperFrames binary is already available, setup may install it privately into:

`.aurora/tools/`

This isolated install:
- does not require a global npm install
- does not modify the user's project package.json
- stays available to the persistent workspace CLI
- can be checked with `aurora-studio hyperframe doctor`

Do not silently upgrade HyperFrames during an active production run.
