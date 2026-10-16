"""Render the expression sheets (16 expressions per character) in Blender 5.2.

Run:  blender -b --factory-startup -P build_faces.py -- <out_dir> [who ...]
  who = host friend claude gpt deepseek (default: all). Writes <out_dir>/faces-<who>.png and faces-<who>.blend
"""
import bpy, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gp_draw as G
import faces as F

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.dirname(os.path.abspath(__file__))
WHO = argv[1:] or ["host", "friend", "claude", "gpt", "deepseek"]
HEADS = ("head", "jaw", "neck")
# who: (centre of the picture in sheet units, cell width, cell height, heads only?)
LAYOUT = {"host": ((15, 895), 330, 360, True), "friend": ((20, 895), 330, 380, True), "claude": ((30, 170), 680, 500, False),
          "gpt": ((0, 215), 520, 560, False), "deepseek": ((10, 175), 520, 460, False)}
COLS = 4


def shift(parts, dx, dy):
    out = []
    for p in parts:
        p = dict(p); p["pts"] = [(x + dx, y + dy) for x, y in p["pts"]]; out.append(p)
    return out


def sheet(who, knot):
    sc = G.scene_setup()
    (cx, cy), W, H, heads = LAYOUT[who]
    base = F.base_parts(who, knot)
    if heads: base = [p for p in base if p["bone"] in HEADS or p["name"] in ("hood.collar", "collar")]
    rows = (len(F.EXPRESSIONS) + COLS - 1) // COLS
    lab = min(y for p in base for x, y in p["pts"]) - cy - 34  # label under the picture
    for i, e in enumerate(F.EXPRESSIONS):
        col, row = i % COLS, i // COLS
        gx, gy = col * W, -row * H
        G.draw_character("%s_%s" % (who, e[0]), shift(base + F.face_parts(who, e[0]), gx - cx, gy - cy), 0, lines=who not in ("host", "friend"))
        G.label(e[0], gx, gy + lab, size=26 if heads else 34)
    w, h = COLS * W, rows * H
    sc.render.resolution_x = 1800; sc.render.resolution_y = int(1800 * h / w)
    G.camera((COLS - 1) * W / 2, -(rows - 1) * H / 2 + (H / 2 + lab - 20) / 2, max(w, h) * 1.06)
    sc.render.filepath = os.path.join(OUT, "faces-%s.png" % who)
    bpy.ops.render.render(write_still=True)
    print("WROTE", sc.render.filepath)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "faces-%s.blend" % who))


knot = G.knot_loops()
for who in WHO: sheet(who, knot)
