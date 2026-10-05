---
name: aurora-finalize
description: Safely finish an approved video, preserve useful artifacts, clean disposable work and turn session evidence into reusable Studio knowledge.
---

# Finalize

Only after explicit owner approval:
1. Save/copy the approved render into `renders/final/`.
2. Record a receipt in `.aurora/decisions.jsonl`.
3. Preserve source assets required to reproduce the final.
4. Delete only disposable `tmp/` work unless the user explicitly approves broader cleanup.
5. Review the session:
   - new reusable style rule?
   - new asset worth indexing?
   - tool routing lesson?
   - failure pattern?
   - genuinely reusable skill improvement?
6. Promote only reusable knowledge. Do not turn every one-off choice into permanent memory.
7. Keep the workspace small enough that future agents can understand it quickly.
