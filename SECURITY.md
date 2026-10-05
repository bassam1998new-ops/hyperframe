# Security Policy

AurorA Studio works with local files, agent hooks, browser resources, external providers, and creative tools. Treat those boundaries carefully.

## Never report secrets publicly

Do not put these in a public issue, discussion, PR, log, screenshot, or test fixture:

- API keys
- passwords
- browser cookies
- session tokens
- private keys
- OAuth tokens
- client/private media
- private file paths when they reveal sensitive information

AurorA workspace files must not be used as a secrets vault.

`.aurora/` is Git-ignored by default because it may contain project context, local paths, provider availability, review evidence and learning history. Review anything deliberately promoted out of that folder before committing it.

## Reporting a vulnerability

Use GitHub's private **Security / Report a vulnerability** flow when it is available for this repository.

If private vulnerability reporting is unavailable, contact the repository owner through an existing private channel and share only the minimum information needed to establish a secure reporting path.

Do not publish exploit details before the issue is fixed.

## Security-sensitive areas

Please flag issues involving:

- agent hooks or command execution
- npm/update/publishing workflow
- path traversal or unsafe deletion
- external/local folder discovery
- browser/session handling
- package secret leakage
- asset license bypass
- final approval/review bypass
- arbitrary remote code execution

## Design principles

AurorA should:

- require trust for project-local hooks
- avoid storing credentials
- avoid privileged OS changes
- keep cleanup scoped to AurorA-owned temp files
- keep user memory separate from replaceable system files
- fail closed on release/publish gates
- verify the exact reviewed final artifact before finalization
- use short-lived OIDC publishing credentials instead of long-lived npm tokens

## Supported version

Until the first public npm release, security fixes target the latest `main` and the active AurorA Studio development branch.
