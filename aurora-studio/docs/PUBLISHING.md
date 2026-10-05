# AurorA Studio npm publishing

Do not publish until `aurora-studio release status` returns `ready: true`.

## Final identity first
Before public release:
1. choose the real npm package name/scope
2. update `package.json.name`
3. set `private: false`
4. make `release.json.package_name` match
5. set `release.json.public_install_ready: true`
6. keep package/release versions identical
7. run Windows + Linux CI and `npm pack --dry-run`

## Publishing security
Prefer npm **trusted publishing** with GitHub Actions OIDC after the package identity exists.

Why:
- no long-lived write token in GitHub secrets
- short-lived workflow-specific credentials
- automatic npm provenance for a public package published from a public GitHub repo

Current npm requirements change over time. Re-check npm's official trusted-publisher docs before enabling the release workflow.

Do not commit an npm token or `.npmrc` auth secret.

## First publish
npm trusted-publisher configuration requires the package to exist on npm.

For the first package creation, use the safest owner-controlled npm flow available at that time. After the package exists, configure the GitHub workflow as a trusted publisher and remove/restrict traditional publish tokens.

## Current state
Publishing intentionally remains disabled during foundation work.
