# AurorA Studio agent contract

AurorA Studio is an agent-first creative workspace. The agent is the control plane; tools are production engines.

## Start every workspace
1. Read `.aurora/studio.json`, `PROJECT.md`, `RESOURCES.md`, and `STYLE.md`.
2. If product/service basics are still TBD, follow the workspace skill and ask the setup questions once.
3. Read the active mode: `direct` or `director`.
4. Use HyperFrames' own current skills/CLI for capabilities HyperFrames already provides. Do not rebuild them locally.
5. Search existing workspace assets/styles before generating or downloading new ones.
6. Route by requirements, not preference: hard rules -> asset search -> previous experience -> score -> Director fallback.
7. Never store passwords, browser cookies, API keys, session tokens, or signed URLs in committed workspace files.
8. Browser providers are optional/experimental. Use the user's already-authenticated session only when explicitly enabled.
9. After owner approval, finalize the render, clean only disposable temp work, then review the session for reusable style/skill/lesson updates.

## Tool roles
- HyperFrames: programmable 2D motion, HTML/GSAP, captions, UI, social variants, deterministic video assembly and its built-in media/QA commands.
- Blender: real 3D, rigs, materials, lighting, cameras, physics, characters/products/environments.
- After Effects: optional paid finishing/compositing/VFX layer. Do not assume it is installed.
- OpenMontage: optional external integration/reference architecture. Do not vendor its AGPL code into the AurorA core.

## Quality rule
A reference is evidence, not a command to copy. Deconstruct what makes it work, then simulate the visual grammar for the current product/service and brand.
