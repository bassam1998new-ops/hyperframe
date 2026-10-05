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
   - optional resources they already have access to
4. Never ask for passwords, cookies, tokens, or account secrets inside workspace files.
5. Re-detect local tools. Optional tools may be absent without failing setup.
6. Save capability status. The router must not select unavailable tools.

## Optional resources
Browser resources such as ChatGPT, Google Flow and Meta AI, and services such as ElevenLabs, improve quality/cost when the owner already has access. They are never required.

## After Effects
After Effects is optional. If unavailable, remove it from routing. Do not downgrade the whole Studio.

## OpenMontage
Treat OpenMontage as an optional external adapter. Do not copy its AGPL implementation into the AurorA core without an explicit license decision.
