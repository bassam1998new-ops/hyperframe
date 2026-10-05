---
name: aurora-finalize
description: Finish an approved AurorA video safely, record real outcomes/usage, clean only run temp and propose only genuinely reusable learning.
---

# AurorA finalize

Read:
- `.aurora/system/skills/SESSION-REVIEW.md`
- `.aurora/system/skills/STYLE-LEARN.md`
- `.aurora/system/skills/REVIEWER.md`

Only after explicit owner approval:
- finish learning-review.json
- record actual provider usage when known
- validate learning review
- finalize the run

Use:
`aurora-studio finalize RUN_ID --video path/to/approved.mp4`

Never delete original source media.
Never auto-apply skill/style proposals.
"Nothing reusable learned" is a valid result.
