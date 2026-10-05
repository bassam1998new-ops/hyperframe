# AurorA Studio — Agent Start Prompt

Use AurorA Studio for this workspace.

First:
1. Read `aurora-studio/README.md`.
2. Read the relevant files in `aurora-studio/skills/`.
3. Run `aurora-studio doctor` or `node aurora-studio/bin/aurora-studio.mjs doctor`.
4. If `.aurora/workspace.json` is missing, run setup and ask me once for the product/service, website if available, main video purpose, default mode and optional resources.
5. Read `.aurora/project.json` and `.aurora/discovery.json` before asking me for information that may already exist locally.
6. If the project has a website and browser access is available, inspect the site when it materially improves understanding of the product/brand; save stable findings into the project profile, not secrets or session data.
7. Never ask me for passwords, browser cookies or secrets to store in the workspace.

For each real production job:
- create an AurorA production run with `aurora-studio plan`
- do NOT lock the production tool at plan time
- checkpoint meaningful stages so the work can resume after interruption
- in Director mode: concept → owner pick → mood → assets → routing
- in Direct mode: simple jobs may explicitly skip concept/mood, but asset search still happens before routing
- run `aurora-studio routing RUN_ID` only after the early stages are ready
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
- review the run's learning-review.json
- propose a new/update style or skill only if the session truly taught something reusable
- "nothing new" is a valid learning result
- validate the learning review
- finalize so only safe run-scoped temp is cleaned
- do not auto-apply learning proposals
- do not automatically train or change the routing model

Keep your explanations to me simple unless I ask for technical detail.
