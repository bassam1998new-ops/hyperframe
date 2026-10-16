"""Build the Edman AI character sheet in Blender (Grease Pencil v3) and render it.

Run:  blender -b --factory-startup -P build_sheet.py -- <out.png> [<out.blend>]
"""
import bpy, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shapes as S
from gp_draw import scene_setup, knot_loops, draw_character, label, camera

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.join(os.path.dirname(__file__), "sheet.png")
BLEND = argv[1] if len(argv) > 1 else None
sc = scene_setup()
KNOT = knot_loops()
STEP = 600
for i, (lbl, fn, kw) in enumerate(S.SHEET):
    x = i * STEP
    if fn is S.gpt_mascot: kw = dict(kw, knot=KNOT)
    draw_character("char%d" % i, fn(**kw), x, lines=fn not in S.HUMANS)
    label(lbl, x, -80)
camera((len(S.SHEET) - 1) * STEP / 2, 430, len(S.SHEET) * STEP + 120)
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
if BLEND:
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("WROTE", OUT)
