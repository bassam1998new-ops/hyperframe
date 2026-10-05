# AurorA Studio — Browser Asset Generation

Use this skill when the workspace has browser-based AI resources such as Google Flow, ChatGPT, Meta AI or another configured site.

## When to use
Use browser generation only when:
- the local/project/AurorA library does not already have a good asset
- HyperFrames or Blender cannot make it more reliably/cheaply
- generated media materially improves the result

## Before generating
1. Read the reference analysis and project context.
2. Search local and shared assets first.
3. Run `aurora-studio resources` (or `aurora-studio resources "video generation"`) and use only resources marked available.
4. Open the provider and inspect its current model, supported features, resolution and current credit/cost information.
5. Do not assume old prices or credit costs are still correct.

## Cheap-first workflow
- use the cheapest useful preview/draft quality first
- generate a small number of meaningful variants
- inspect them against the reference/project
- upscale or regenerate only the selected asset
- save the final source/provider metadata with the asset

## Google Flow
Flow can create video from prompts, frames, ingredients/references and other media depending on the active model.
Use draft/low-resolution exploration when it is appropriate, but always read the current UI settings/cost first.

## Browser safety
- never store account passwords, cookies or session secrets in AurorA files
- never change account/security/billing settings unless the owner explicitly asks
- do not upload private client/source material to an external provider unless the workspace policy permits it
- respect provider terms and content rules

## Output
Save:
- provider
- model if visible
- prompt
- input reference(s)
- generation settings
- current cost/credits if known
- chosen output
- reason it was selected


## Provider playbook
Before using a configured provider, read its current AurorA playbook:

- ChatGPT → `knowledge/providers/chatgpt-images.md`
- Google Flow → `knowledge/providers/google-flow.md`
- Meta AI → `knowledge/providers/meta-ai.md`
- ElevenLabs → `knowledge/providers/elevenlabs.md`

Treat these files as routing/quality guidance, not permanent pricing truth.
If the provider UI disagrees with the playbook on price, model, resolution, availability, or rights, trust the live provider and record the mismatch for the next AurorA update.
