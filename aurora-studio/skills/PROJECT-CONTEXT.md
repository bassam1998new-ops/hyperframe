# AurorA Studio — Project Context

This skill makes AurorA understand the product/service once and reuse that context across future videos.

## Source of truth
`.aurora/project.json`

Do not keep asking the owner for facts already stored there.

## First workspace pass
Use this order:

1. Read `.aurora/project.json`.
2. Read `.aurora/discovery.json`.
3. Inspect only the local files likely to contain product/brand context.
4. If a website is stored and browser access is available, inspect the important public pages.
5. Fill stable project facts.
6. Ask the owner only for high-impact information still missing.

## What to learn
Keep the profile useful, not huge.

### Product
- what it is
- main offer
- positioning
- important differentiators
- claims that must remain accurate

### Audience
- who the video is for
- their level of knowledge
- what they care about

### Brand
- personality
- colors
- fonts
- logos
- visual things to avoid

### Content
- channels
- common formats
- languages
- recurring series

### Creative preferences
- moods that repeatedly work
- moods/styles to avoid
- recurring production constraints

## Ask less
Do not run a long onboarding interview.

If local/site evidence is enough, continue without asking.

When important information is missing, ask only the smallest set of questions that materially changes the work. Usually 1–3 is enough.

## Stable facts vs one-video choices
Put stable facts/preferences in `project.json`.

Do not save one-off shot choices as permanent project truth.

Examples:

Save:
- target audience is HR leaders
- Arabic + English content
- brand uses navy and aqua
- avoid loud meme editing

Do not save:
- this one video needs a 35mm lens
- this one reference uses red
- this one shot has a horse

## Reference adaptation
When a reference is supplied:
- preserve useful grammar/structure
- replace its product truth, branding and messaging with this project
- never copy another brand's identity just because it is present in the reference

## Updating context
If the owner changes product/brand settings:
- update project.json
- keep useful stable history in notes when needed
- future runs use the new profile

## Sources
Record important context sources in the project profile when practical:
- local file
- website/page
- owner statement

Never store passwords, cookies, private keys, auth tokens or browser session data.
