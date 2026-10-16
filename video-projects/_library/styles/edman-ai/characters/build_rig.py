"""Build and render rig tests for the ادمان الAI characters (Blender 5.2 Grease Pencil cut-out rigs).

Run:  blender -b --factory-startup -P build_rig.py -- <out_dir> <who>
  who = host | friend | claude | gpt | deepseek   one character, 720x1280 portrait
        cast                                         friend + the three mascots side by side, 1920x1080
Writes <out_dir>/frames/####.png and <out_dir>/<who>-rig.blend.
     blender ... -P build_rig.py -- <out_dir> <who> faces    the rig standing still, all 16 expressions one by one
        (0.5 s each); writes <out_dir>/faces/<nn>-<expression>.png (720x720 of the face) and <who>-faces.blend.
The rigs live in rigs.py (bones, parts, springs, test acting); the machinery is rig_engine.py.
"""
import bpy, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gp_draw as G
import rig_engine as E
import rigs as R

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.join(os.path.dirname(os.path.abspath(__file__)), "rig-test")
WHO = argv[1] if len(argv) > 1 else "host"
MODE = argv[2] if len(argv) > 2 else "acting"
FACE_CAM = {"host": (15, 885, 420), "friend": (20, 890, 440), "claude": (30, 175, 700), "gpt": (0, 230, 560), "deepseek": (10, 190, 540)}

SINGLE = {"host": (R.spec_host, (0, 520, 1300)), "friend": (R.spec_friend, (0, 520, 1300)),
          "claude": (R.spec_claude, (0, 230, 760)), "gpt": (lambda: R.spec_gpt(G.knot_loops()), (0, 260, 760)),
          "deepseek": (R.spec_deepseek, (0, 230, 760))}
CAST = [("friend", -820), ("claude", -150), ("gpt", 430), ("deepseek", 1010)]  # name, x (sheet units)
LABELS = {"friend": "Friend", "claude": "Claude", "gpt": "ChatGPT", "deepseek": "DeepSeek"}


def faces_test():
    """Every expression on the real rig: proves each swap group is bound to its bone and switches cleanly."""
    import faces as FK
    sc = G.scene_setup(); sc.render.fps = E.FPS
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "CONSTANT"
    sp = SINGLE[WHO][0]()
    sp.timeline, sp.talk, sp.hops = [(0.0, "rest")], [], []
    sp.swaps = [e for e in sp.swaps if e[0] == 0.0 and e[1].startswith("hand")]
    for i, e in enumerate(FK.EXPRESSIONS): sp.face(i * 0.5, e[0])
    sp.seconds = len(FK.EXPRESSIONS) * 0.5
    E.build(sp, 0)
    sc.render.resolution_x = sc.render.resolution_y = 720
    G.camera(*FACE_CAM[WHO])
    os.makedirs(os.path.join(OUT, "faces"), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, WHO + "-faces.blend"))
    for i, e in enumerate(FK.EXPRESSIONS):
        sc.frame_set(int((i * 0.5 + 0.3) * E.FPS) + 1)
        sc.render.filepath = os.path.join(OUT, "faces", "%02d-%s.png" % (i, e[0]))
        bpy.ops.render.render(write_still=True)
    print("FACESDONE", WHO)


def main():
    sc = G.scene_setup()
    sc.render.fps = E.FPS
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "CONSTANT"
    if WHO == "cast":
        sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
        nf = 0
        for name, x in CAST:
            nf = max(nf, E.build(SINGLE[name][0](), x))
            G.label(LABELS[name], x, -110, size=40)
        G.camera(60, 520, 2650)
    else:
        sc.render.resolution_x, sc.render.resolution_y = 720, 1280
        make, cam = SINGLE[WHO]
        nf = E.build(make(), 0)
        G.camera(*cam)
    sc.frame_start, sc.frame_end = 1, nf
    os.makedirs(os.path.join(OUT, "frames"), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, WHO + "-rig.blend"))
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath = os.path.join(OUT, "frames", "")
    bpy.ops.render.render(animation=True)
    print("RIGDONE", WHO, nf)


faces_test() if MODE == "faces" else main()
