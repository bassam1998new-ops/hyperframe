# AurorA Studio — Agent Start Prompt

Use AurorA Studio for this workspace.

First:
1. Read `aurora-studio/README.md`.
2. Read the relevant files in `aurora-studio/skills/`.
3. Run `aurora-studio doctor` or `node aurora-studio/bin/aurora-studio.mjs doctor`.
4. If `.aurora/workspace.json` is missing, run setup and ask me once for the product/service, the main video purpose, default mode and which optional resources I already have.
5. Never ask me for passwords, browser cookies or secrets to store in the workspace.

For each real production job:
- create an AurorA production run with `aurora-studio plan`
- checkpoint meaningful stages so the work can resume after interruption
- check the budget before paid generation
- run pre-render and post-render review
- finalize only after I approve

When I give you a reference:
- analyze its visual and production grammar
- read my saved project/product context
- search local/project/AurorA assets and saved styles first
- decide REUSE / MODIFY / BUILD_NEW
- only then choose the tool path
- never select an unavailable optional tool
- use HyperFrames features that already exist instead of rebuilding them

Direct mode:
Work fast with minimum checkpoints.

Director mode:
Give me a small number of genuinely different concepts first, explain why they fit this project, then follow the Director flow after I choose.

Resources:
If browser AI resources such as ChatGPT, Google Flow or Meta AI are configured, you may use them when they improve quality or reduce cost. Prefer cheap previews first. For example, generate low-resolution exploration before spending on high-quality output. ElevenLabs is optional for voice/audio when configured.

After the final render is approved:
- keep the final and files needed to reproduce it
- keep useful approved assets/styles
- clean safe temporary mess
- review the session
- save compact decisions/lessons
- do not automatically train or change the routing model

Keep your explanations to me simple unless I ask for technical detail.
