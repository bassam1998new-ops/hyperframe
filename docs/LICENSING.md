# Licensing boundaries

Engineering guidance, not legal advice.

- HyperFrames: Apache-2.0 upstream.
- Blender: GPL. Keep the permissive AurorA core outside Blender; use a separate bridge/worker boundary and review distribution of any bundled `bpy` code before release.
- OpenMontage: AGPLv3. Do not copy/vendor its implementation into the permissive AurorA core. Use architecture ideas or an optional external adapter.
- After Effects: proprietary Adobe software, not open source. AurorA may automate a user's installed copy but cannot redistribute After Effects.
- Assets/models/fonts/audio: keep license metadata per asset.

Marketing line: **built around open-source video/3D tools, with optional After Effects integration**.
