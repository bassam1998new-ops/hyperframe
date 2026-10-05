# AurorA Studio — Session Review & Cleanup

Run after the final render is approved, before finalize.

## Goal
Keep what improves future work. Remove only safe run-scoped temporary mess. Do not invent learning just to fill memory.

## Learning review
Every production run has:
`.aurora/runs/<run>/learning-review.json`

Review the actual session and fill it.

### Outcome
Record:
- owner approved
- reviewer result
- revision count when known
- quality score when useful
- one short summary

### Lessons
Add only reusable lessons.

Good:
- this product family reads better with softer side light than front light
- transparent Blender overlays are faster than full compositing for this recurring format

Bad:
- we made a video today
- use Blender because Blender looked good once

### Proposals
You may propose:
- new style
- update existing style
- new skill
- update existing skill
- promote a reusable asset

Suggested proposal shape:
```json
{
  "action": "new|update|promote",
  "target": "name-or-id",
  "reason": "why this is reusable",
  "evidence": ["what in this run proved it"],
  "confidence": 0.8
}
```

A completed review with zero proposals/lessons is valid if the session taught nothing new.

Set:
`"status": "completed"`

Then run:
`aurora-studio learn validate RUN_ID`

## Keep
- final approved renders
- source needed to reproduce them
- approved/reusable styles
- useful reusable assets
- important decisions/lessons

## Cleanup
Finalize automatically deletes only:
`.aurora/runs/<run>/temp/`

Never delete original user media automatically.

## Finalize
After learning review + owner approval:
`aurora-studio finalize RUN_ID`

Learning proposals are logged as **pending review**. They are never auto-applied.
