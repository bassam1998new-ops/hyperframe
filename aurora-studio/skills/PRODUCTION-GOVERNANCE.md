# AurorA Studio — Production Governance

Keep this mostly invisible unless the owner asks. It exists to make agent work reliable.

## Start
Use:
`aurora-studio plan "<task>" [--reference ID]`

Plan does **not** select the production tool yet.

It creates:
- resumable run
- project/reference context packet
- reusable asset/style matches
- budget policy
- stage state
- Director mood template when needed

## Stages
1. understand
2. concept
3. mood
4. assets
5. routing
6. build
7. pre_render_review
8. render
9. post_render_review
10. approval
11. finalize

## Direct mode
Only owner approval at the end is mandatory.

For a simple job:
- finish understand
- explicitly skip concept
- explicitly skip mood
- complete asset search
- run routing

For premium, reference-heavy or multi-tool work, create/fill mood instead of skipping it.

## Director mode
- understand
- present 2–3 real concepts
- owner approves one concept
- create/fill/validate mood.json
- complete asset search
- route only now

Concept and mood cannot be skipped in Director mode.

## Mood
Commands:
```bash
aurora-studio mood create RUN_ID
aurora-studio mood show RUN_ID
aurora-studio mood validate RUN_ID
```

When mood is ready:
```bash
aurora-studio checkpoint RUN_ID mood completed --artifact .aurora/runs/<run>/mood.json
```

## Asset decision
Before completing the assets stage:
```bash
aurora-studio asset-plan show RUN_ID
aurora-studio asset-plan validate RUN_ID
```

The completed asset plan is the evidence for REUSE / MODIFY / BUILD_NEW.

## Routing
Only after context/mood/assets and a valid completed asset plan:
```bash
aurora-studio routing RUN_ID
```

Routing uses:
- current task
- structured reference requirements
- tool availability
- mood evidence
- current project context
- reusable assets/styles

The routing checkpoint is written automatically.

## Checkpoints
Use:
`aurora-studio checkpoint RUN STAGE STATUS`

Valid useful states:
- completed
- skipped (only where allowed)
- awaiting_human
- failed

Never mark a human-gated stage complete without `--approved`.

## Budget
Before paid generation:
`aurora-studio budget ESTIMATED_USD SPENT_USD`

Do not bypass a block or owner-approval result.

## Review
Before render:
- use HyperFrames native checks when applicable
- verify required assets/resources exist
- do not spend final render time on a known-broken plan

After render:
`aurora-studio review path/to/video.mp4`

Then perform the creative Reviewer skill. Technical validity alone is not creative approval.

## Finalize
Only after:
- post-render review completed
- owner approval recorded

Run:
`aurora-studio finalize RUN --lesson "short reusable lesson"`

Finalize may clean only run-scoped temporary files. Never original user media or unrelated files.
