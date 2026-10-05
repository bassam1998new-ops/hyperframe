# AurorA Studio — Session Review & Cleanup

Run only after the final render is approved or the owner explicitly ends the job.

## Keep
- final approved renders
- source project needed to reproduce them
- approved or clearly reusable styles
- useful reusable assets
- project metadata
- important decisions
- lessons that can improve future work

## Remove when safe
- failed temporary renders
- duplicate proxies
- abandoned generated tests
- temporary downloads
- cache that is reproducible
- intermediate files that are not needed to reproduce the final

Never delete original user media automatically.

## Learning record
Append compact JSONL records to:
- `.aurora/decisions.jsonl`
- `.aurora/lessons.jsonl`

Record facts, not private chain-of-thought:
- task type
- chosen route
- available tools
- asset reused / modified / built
- quality result
- approval
- revisions
- time/cost when known
- failure reason
- reusable lesson

Do not automatically fine-tune a model from these logs. Training is a later, evaluated release process.
