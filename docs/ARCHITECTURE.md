# AurorA Studio architecture — foundation

## Control plane
The coding agent is the control plane. AurorA provides shared files, schemas, skills, tool cards and receipts so different agents make consistent decisions.

## Decision flow
1. Understand project/workspace.
2. Analyze request/reference.
3. Search approved local assets/styles.
4. Decide reuse / modify / build.
5. Apply hard tool rules.
6. Retrieve similar successful/failed decisions.
7. Score valid production paths.
8. If confidence is low, let the main Director LLM decide.
9. Build through one or more engines.
10. Review against reference + project + technical checks.
11. On approval: finalize, clean disposable temp, promote reusable learning.

## Do not add a trained router yet
Use deterministic routing + retrieval first. Log decisions/results now. Benchmark Laya or another small router only after we have enough real labeled Studio history.

## Data tiers
- JSON / JSONL: settings, capabilities, decisions, licenses and structured facts.
- Markdown/full-text: skills, project context and creative knowledge.
- Embeddings: reference/style/asset similarity where useful.
- RAG: retrieval layer over those stores, not the source of truth.

## Provider policy
Browser providers such as ChatGPT, Google Flow and Meta AI are optional/experimental. They can be useful with a user-authenticated account, but UI automation is fragile and provider terms/pricing can change. Do not make them required and do not hardcode credit prices into routing.
