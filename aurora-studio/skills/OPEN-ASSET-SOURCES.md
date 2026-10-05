# AurorA Studio — Open Asset Sources

Use this after searching the current project, workspace library and shared AurorA library.

## Goal
Find reusable assets before building from zero or spending generation credits.

## Preferred order
1. Poly Haven — strongest automated source for CC0 HDRIs, materials/textures and 3D models.
2. ambientCG — strong CC0 materials/models/HDRIs; cache locally because its API is best-effort.
3. Kenney — CC0 packs; useful for clean 2D/3D/UI assets.
4. Quaternius — excellent 3D, rigs and animation; verify the exact asset license every time.
5. Openverse — discovery for images/audio only; verify license at the original source before importing.

## License gate
Using an asset in a finished video and redistributing the raw asset are two different permissions.

- An asset may be allowed in a commercial video but forbidden from being bundled in the AurorA repo/package.
- QAL assets from Quaternius must stay external to the community package unless the exact asset license allows raw redistribution.
- Openverse metadata is not final proof of license.
- Unknown license = do not use until verified.

## Poly Haven live API
AurorA has a live Poly Haven adapter.

Search:
```bash
aurora-studio assets search "studio sunset" --type hdris
aurora-studio assets search "office chair" --type models
aurora-studio assets search "brushed metal" --type textures
```

Inspect available files for a chosen result:
```bash
aurora-studio assets files ASSET_ID
```

The adapter:
- identifies AurorA Studio with its User-Agent
- caches catalog data for 6 hours
- falls back to stale cache if the live API is unavailable
- returns CC0 metadata
- marks that Poly Haven must be visibly credited as the source when AurorA uses the live API

API-service attribution is separate from the CC0 asset license.

## Import record
Store source URL, source name, exact license, commercial-use permission, redistribution permission, attribution requirement, local path and approval state.

Do not auto-download thousands of assets. Fetch only what a real project needs, then cache useful approved items.
