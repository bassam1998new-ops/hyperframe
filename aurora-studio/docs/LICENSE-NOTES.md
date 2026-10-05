# AurorA Studio — License Notes

AurorA Studio must keep code licenses and asset licenses separate.

## Core tools

### HyperFrames
Apache-2.0 upstream.
AurorA may integrate and extend HyperFrames under the terms of that license.

### Blender
Blender is GPL software.
AurorA treats Blender as an external installed application and uses its command line / Python API.

### After Effects
Adobe After Effects is proprietary and optional.
AurorA does not redistribute After Effects.

### Obsidian
Obsidian is optional software used as a knowledge UI.
AurorA's Markdown/JSON brain must work without it.

## Third-party libraries
Do not assume every library bundled by a production tool has the same license as that tool.
For example, HyperFrames documents third-party components with their own terms.

## Assets
Every imported community asset should carry:
- source
- creator when known
- license id
- commercial-use status
- redistribution status
- attribution requirement

"Found online" is never a license.

## Public project claim
Prefer:
"AurorA Studio is an open-source agent video studio built around open-source tools, with optional proprietary integrations."

Do not claim every optional tool/provider is open source.
