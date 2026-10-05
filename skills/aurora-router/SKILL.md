---
name: aurora-router
description: Choose HyperFrames, Blender, After Effects or a multi-tool path using hard requirements, asset reuse and previous outcomes instead of habit.
---

# Tool routing

Order:
1. Hard rules remove impossible/bad paths.
2. Search existing approved assets/styles.
3. Retrieve similar prior decisions and outcomes.
4. Score valid paths for quality, time, cost, editability and reproducibility.
5. If confidence is low, ask the main Director model to decide from the evidence.

Examples:
- true 3D mesh/rig/material/light -> Blender likely required
- deterministic 2D type/UI/captions/variants -> HyperFrames usually preferred
- complex finishing/compositing/tracking and AE is enabled -> consider After Effects
- open-source-only requirement -> After Effects is removed

Do not train a small router yet. Log decisions/outcomes first. Small-model routing is a later optimization, not the foundation.
