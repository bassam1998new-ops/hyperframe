# Free Blender library (cloud)

Everything `blender/setup.sh` installs, all free to use in videos. Checked working in Blender 5.0.1 on 2026-10-02.
Paths are under `$BLENDER_LIB` (default `/opt/blender-lib`).

## Blender

| What | Source | Notes |
|---|---|---|
| Blender 5.0.1 (`bpy`) | PyPI | Run scenes with `blender5 scene.py -- args` after `source blender/env.sh`. Cycles with denoiser, EEVEE (software GL, slower) and Workbench all render. |
| Arabic 3D text | PyPI `arabic-reshaper` + `python-bidi` | Blender can't join Arabic letters by itself. Reshape first: `get_display(arabic_reshaper.reshape(text))`. See `examples/showcase.py`. |

## Assets

| Folder | What | Licence |
|---|---|---|
| `hdri/` | 8 HDRIs: city, courtyard, forest, interior, night, studio, sunrise, sunset | CC0 (Poly Haven, shipped with Blender) |
| `gfonts/ofl/` | Cairo, Tajawal, Almarai, Noto Kufi Arabic, Inter, Montserrat, Bebas Neue, Rubik | OFL |
| `gltf/Models/*/glTF-Binary/` | 12 Khronos sample models: Avocado, fish, boombox, corset, teacup, glass vase, Suzanne, lantern, skull, chair, toy car, water bottle | CC0 only (CC-BY ones left out) |
| `kenney/Starter-Kit-*/` | 53 `.glb` low-poly models: city builder, platformer, racing, FPS | CC0 (Kenney) |
| `byte/Materials/` | 103 materials in `.blend` files: wood, stone, 42 procedural metals, ceramic, textiles, patterns, imperfections | CC0 ([trashbyte/blender-assets](https://github.com/trashbyte/blender-assets)) |
| `byte/Models/` | 143 models: food and drink, tableware, plants, furniture, electronics, lighting, fixtures | CC0 (same) |
| Blender "Essentials" | Built-in geometry-node assets and brushes | GPL / CC0, ships with Blender |

Load a `.blend` asset: `with bpy.data.libraries.load(path) as (src, dst): dst.materials = ["Oak"]`.
Import a model: `bpy.ops.import_scene.gltf(filepath=...)`.

## Add-ons (enable with `addon_utils.enable(name, default_set=True)`)

| Name | What it makes | Source |
|---|---|---|
| `ant_landscape` | Terrain and planets (pass `refresh=True` in scripts) | Blender add-ons archive |
| `add_curve_sapling` | Trees | same |
| `add_curve_ivygen` | Ivy on any object | same |
| `add_mesh_extra_objects` | Gears, gems, twisted torus, pipes, and more | same |
| `add_curve_extra_objects` | Spirals, knots, curly curves | same |
| `add_mesh_geodesic_domes`, `add_mesh_BoltFactory` | Domes, bolts and nuts | same |
| `mesh_tissue` | Tessellate patterns onto surfaces | same |
| `object_fracture_cell` | Shatter objects into pieces | same |
| `real_snow`, `lighting_dynamic_sky`, `sun_position` | Snow cover, procedural sky, real sun angle | same |
| `object_boolean_tools`, `mesh_looptools` | Modelling helpers | same |
| `bl_ext.user_default.mpfb` | Human characters (MakeHuman): `bpy.ops.mpfb.create_human()` | [mpfb2](https://github.com/makehumancommunity/mpfb2), GPL code / CC0 assets |
| `spaceship_generator` | Random sci-fi spaceships | [SpaceshipGenerator](https://github.com/a1studmuffin/SpaceshipGenerator), MIT; ported to 5.0 by `patches/spaceship_blender5.py` |
| `sverchok` | Parametric node geometry | [sverchok](https://github.com/nortikin/sverchok), GPL |
| `commotion` | Motion-graphics offsets and effectors | [commotion](https://github.com/mrachinskiy/commotion), GPL |
| `leomoon_textcounter` | Animated number counters in 3D text | [leomoon-textcounter](https://github.com/leomoon-studios/leomoon-textcounter), GPL |
| `typewriter` | Typewriter text animation | [blender-typewriter-addon](https://github.com/doakey3/blender-typewriter-addon) |

## Blocked from the cloud (would unlock more)

Poly Haven, ambientCG, Sketchfab, BlenderKit, Quaternius, extensions.blender.org, 3dassets.dev and Git LFS files
(e.g. the 93 HDRIs in byte's library) are blocked by this environment's network policy.
