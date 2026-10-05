# Releasing AurorA Studio to npm

AurorA Studio should use **npm trusted publishing with GitHub OIDC** for normal releases.

Do not store a long-lived npm publish token in GitHub.

## Current state

Public publishing is intentionally blocked until all of these are set:

- final npm package/scope name
- package `private: false`
- `release.json.package_name`
- `release.json.public_install_ready: true`

Check:

```bash
npm run release:status
```

Fail-closed CI gate:

```bash
npm run release:gate
```

`release:gate` exits non-zero while any public-release blocker exists.

## First package bootstrap

npm trusted publisher configuration requires the package to already exist.

For the first package creation only:

1. Confirm the final package name/scope.
2. Pass every test/package audit locally/CI.
3. Make the first publish deliberately using the owner's npm account and current npm security requirements.
4. Immediately configure the package's GitHub Actions trusted publisher.
5. Restrict normal token-based publishing after OIDC is confirmed working.

Do not automate step 3 inside AurorA.

## Trusted publisher

On npm package settings, configure:

- provider: GitHub Actions
- GitHub owner: `bassam1998new-ops`
- repository: `hyperframe`
- workflow file: `aurora-npm-publish.yml`
- allow direct `npm publish` only if that is the chosen release policy

For stronger control, npm also supports staged publishing with human approval.

## Normal release

1. Bump package + release metadata to the same version.
2. Update short New / Fixed notes.
3. Verify:

```bash
npm test
node ./scripts/package-audit.mjs
node ./scripts/package-smoke.mjs
npm run release:gate
```

4. Create a GitHub release with tag:

`aurora-v<package-version>`

Only AurorA-prefixed release tags are eligible for the npm publish job.

## Publish workflow security

The workflow:

- uses GitHub-hosted Ubuntu
- grants only `contents: read` + `id-token: write`
- stores no npm publish token
- verifies the GitHub release tag matches package version
- reruns tests
- reruns package audit
- reruns installed-package smoke
- reruns fail-closed release gate
- then calls `npm publish`

With npm trusted publishing, OIDC uses short-lived credentials and npm can generate provenance automatically for a public package from a public GitHub repository.

## Sources

- https://docs.npmjs.com/trusted-publishers/
- https://docs.npmjs.com/generating-provenance-statements/
