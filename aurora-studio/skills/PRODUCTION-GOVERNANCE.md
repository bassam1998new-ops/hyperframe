# AurorA Studio — Production Governance

Keep this invisible unless the owner asks for details. It exists to make agent work reliable.

## Start
Use:
`aurora-studio plan "<task>"`

This creates one resumable run with:
- selected tool path
- scored alternatives
- mode
- stages
- budget policy
- checkpoints

## Stages
1. understand
2. concept
3. assets
4. build
5. pre_render_review
6. render
7. post_render_review
8. approval
9. finalize

Direct mode only requires the owner at final approval unless cost/risk needs a decision.
Director mode also requires approval of the concept.

## Checkpoint
After a meaningful stage:
`aurora-studio checkpoint RUN STAGE STATUS`

Use `awaiting_human` when owner input is required.
Never mark a human-gated stage complete without `--approved`.

## Budget
Before a paid generation:
`aurora-studio budget ESTIMATED_USD SPENT_USD`

Do not bypass a block or owner-approval result.

## Review
Before render:
- use HyperFrames native checks when the job is HyperFrames-based
- verify required assets/resources exist
- do not spend final render time on a known-broken plan

After render:
`aurora-studio review path/to/video.mp4`

Then perform the creative review from the Reviewer skill. Technical validity alone is not creative approval.

## Finalize
Only after:
- post-render review completed
- owner approval recorded

Run:
`aurora-studio finalize RUN --lesson "short reusable lesson"`

Finalize may clean only run-scoped temporary files. It must never delete original source media or unrelated project files.
