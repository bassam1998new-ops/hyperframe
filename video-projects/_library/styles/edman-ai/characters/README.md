# ادمان الAI characters (Blender 2D drawing, started 2026-10-15)

Stage 4 of [Cartoon episode](../../../../../brain/Jobs/Cartoon%20episode.md): model sheet → the owner approves → rig (stage 6).

- `shapes.py`: every character as separate parts (one per future bone): the host, the friend, Claude pixel guy, ChatGPT knot, DeepSeek whale. Pure Python; poses, eyes and mouths are arguments.
- `build_sheet.py`: draws the parts as Blender Grease Pencil (fill, cel shadow and gloss masked inside each part, thick-and-thin ink line on top) and renders the sheet.
  `blender -b --factory-startup -P build_sheet.py -- out.png [out.blend]` (env `SHEET_BG=#1d1636` = dark room test).
- `openai-knot.path`: the OpenAI logo path (from the ep01 storyboard), imported through Blender's SVG importer.
- `sheet-v1.*`, `characters-v1.blend`: first sheet (big heads). The owner: "the head and body parts needs to synced better", and sent a flat-vector standing man as the proportion reference.
- `sheet-v2-lines.jpg`, `sheet-v2-nolines.jpg`, `characters-v2.blend`: v2 on that reference. Head is ~1/5 of the height with a visible neck, shoulders are ~2 head widths, legs are long, fists hang at mid-thigh, cheeks have blush. `SHEET_LINE=0` renders without outlines.
- `sheet-v3.jpg`, `sheet-v3-dark.jpg`, `characters-v3.blend`: the owner's call: "lets stay without lines in humens and masocs keep them outlined" (`HUMANS` in shapes.py). v3 also has sloped shoulders, a narrower chest, natural legs (thigh → knee → ankle), and 3/4 sneakers with an upturned sole that tuck under the trouser hem. Approved 2026-10-15 ("approved start the rig").
- `gp_draw.py`: the drawing helpers shared by the sheet and the rig.
- Rig (stage 6), shared by all five characters:
  - `rig_engine.py`: the machinery. A character is a `Spec` (bones, parts, swap groups, springs, poses, test timeline). Every part is bound 100% to one bone (vertex group + Grease Pencil Armature modifier) = paper cut-out joints. Swaps (mouth, eyes, brows, hands) are layers keyed on `hide`. Bones chase their pose targets with damped springs (follow-through), legs use 2-bone IK with feet planted, hood strings are pendulums, mascots hop with squash and stretch, pixel parts can slide in whole-pixel steps (`bone@y` + `quant`). Keys on twos, constant interpolation, 24 fps.
  - `rigs.py`: `spec_host`, `spec_friend`, `spec_claude`, `spec_gpt`, `spec_deepseek`, each with its own test acting. For an episode keep bones, parts and springs; replace poses / timeline / swaps / talk.
  - `build_rig.py`: `blender -b --factory-startup -P build_rig.py -- <out_dir> <host|friend|claude|gpt|deepseek|cast>` → `<out_dir>/frames/*.png` + `<who>-rig.blend`. One character = 720x1280 (~70 s for 7 s); `cast` = friend + mascots at 1920x1080 (~3.5 min for 6 s).
- `rig-test-v1.mp4`, `host-rig-v1.blend`: first rig test (rest → point → think → open palm → rest), no voice. The owner: "the rig is fine but did u rig all the bones ?" (legs, hips and jaw were bound but never moved).
- `rig-test-v2.mp4`, `host-rig-v2.blend`: 21 bones, all animated. Added knees (shin bones; the trouser leg is cut at the knee under a round knee cap), hip weight shift and a dip into each move with 2-bone IK that keeps the feet planted (front view: only `KNEE_OUT` of a bend shows sideways, the rest is bone scale = foreshortening), a jaw that stretches down on open mouths, and hood strings as pendulums driven by the chest's movement. Approved 2026-10-15 ("approved rig the friend and mascots").
- `rig-test-cast-v1.mp4`, `cast-rig-v1.blend`: friend (wave, shrug, knees, talk), Claude (pixel hops, nubs step up by whole pixels), ChatGPT (wave, the knot spins 60° under its face, hop), DeepSeek (cheer with two hops, nods). Accepted 2026-10-15 ("yeah but no need for the test"; the voice and lip-sync test is skipped).
- The host's motion was checked after the move to `rig_engine`: identical to v2 to 1e-15.
- Face expressions (stage 7), `faces.py` + `build_faces.py`: 16 expressions for all five characters. An expression = eyes + brows + mouth + fx: neutral, happy, laugh, excited, angry, annoyed, sad, surprised, scared, thinking, skeptical, confused, smug, embarrassed, disgusted, dizzy. FX: anger mark, tears, sweat drop, blush, question mark. Exaggerated, like the reference. Mascots got mouths (the owner's pick). The kits are "ink" (dot eyes: the host, friend, ChatGPT), "whites" (eye whites with lids in the body colour: DeepSeek) and pixel (15-unit blocks: Claude). ChatGPT has a bigger face disc so the mouth fits; the host's line mouths are light (`mouth_line`) so they show on the beard.
  - `blender -b --factory-startup -P build_faces.py -- <out_dir> [who ...]` → `faces-<who>.png` + `.blend` (4x4 sheet, ~30 s for all five).
  - `faces-v1/`: the five sheets (`.png`) and their Blender files (`.blend`). The owner 2026-10-15: "okay save them".
  - In the rigs (the owner 2026-10-15: "add them to the rigs"): `rigs.face_groups(who)` turns the kit into swap groups
    `eyes:<expression|closed>`, `brows:<expression>`, `fx:<expression>`, `mouth:<mouth>`. In a spec: `sp.face(t, "laugh")`
    switches all four together (`mouth=` overrides the mouth), `sp.blink(t)` shuts the eyes for 0.1 s and returns to the
    expression showing at t, `sp.talk` ranges still flap the mouth on top. Human chins drop on open mouths (`FACE_JAW`).
    ChatGPT's rig now uses the bigger face disc. The old shapes.py mouths/eyes/brows are no longer used by the rigs.
  - `build_rig.py -- <out_dir> <who> faces`: the rig standing still, all 16 expressions in turn; one 720x720 still each.
  - `rig-test-faces-v1.mp4`, `host-rig-v3.blend`: the host's acting test with expressions (neutral, blink, excited while
    talking, happy, thinking, skeptical, smug). `rig-test-cast-faces-v1.mp4`, `cast-rig-v2.blend`: the cast with expressions.

Layer limits found while adding faces (keep for every rig):
- Blender ignores a layer mask on any layer past index 256 (the shading went flat brown squares). Each face swap state
  shares one fill layer and one line layer (`P["layer"]`), so rigs sit at 70-160 layers. `rig_engine.build` asserts that
  part names are unique, every bone exists, and a shared layer sits on one bone.
- Blender also drops a mask when the mask layer is fully off camera (a face close-up crops the trousers away). Shade
  covers now hug their part (`d + 6`), so a dropped mask paints nothing visible.

Blender 5.2 gotchas (cost an hour):
- A stroke only fills when it has a `fill_id` (≠ 0).
- New Grease Pencil materials get a Principled node tree, which makes them lit and dark. Clear `node_tree.nodes` to get flat colour.
- Fills triangulate in the drawing's local XY plane. Draw in XY and rotate the object 90° on X.
