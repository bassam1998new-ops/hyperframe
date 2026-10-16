"""The five ادمان الAI rigs (specs for rig_engine): Host, the friend, Claude, ChatGPT, DeepSeek.

Each spec_*() returns a rig_engine.Spec with its own short test acting. For an episode, keep the bones,
parts and springs and replace poses / timeline / swaps / talk with the shot's acting.
Faces: every rig carries the 16 expressions of faces.py as swap groups. sp.face(t, "laugh") switches eyes, brows,
mouth and effects together; sp.blink(t) shuts the eyes for 0.1 s; talk ranges flap the mouth on top.
"""
import math
import shapes as S
import faces as FK
from rig_engine import Spec, ang, rot_about

SWAP_PREFIX = ("mouth", "teeth", "tongue", "eye.", "eyew.", "glint.", "lid.", "brow.", "fx.", "hand.", "thumb.")


def is_swap(n):
    return any(n == k or n.startswith(k) for k in SWAP_PREFIX)


def grouped(groups):
    """Swap parts get unique names 'group:state/part' and remember their group."""
    out = []
    for g, ps in groups.items():
        for p in ps:
            p = dict(p); p["name"] = g + "/" + p["name"]; p["group"] = g; out.append(p)
    return out


def pick(parts, *prefixes):
    return [p for p in parts if p["name"].startswith(prefixes) or p["name"] in prefixes]


def face_groups(who):
    """The face kit (faces.py) as swap groups: eyes:<expression|closed>, brows:<expression>, fx:<expression>,
    mouth:<mouth state>. Drive them with Spec.face(t, expression) and Spec.blink(t)."""
    G = {}
    for e in FK.EXPRESSIONS:
        ps = FK.face_parts(who, e[0])
        G["eyes:" + e[0]] = pick(ps, "eye.", "eyew.", "glint.", "lid.")
        G["brows:" + e[0]] = pick(ps, "brow.")
        G["fx:" + e[0]] = pick(ps, "fx.")
    G["eyes:closed"] = FK.eyes_only(who, "closed")
    for m in FK.MOUTHS: G["mouth:" + m] = FK.mouth_only(who, m)
    out = {}
    for g, ps in G.items():
        if not ps: continue
        out[g] = [dict(p, layer=g + "@" + p["bone"]) for p in ps]  # one shared layer per state (per bone)
    return out


FACE_JAW = {"talk": 1.06, "o": 1.09, "laugh": 1.08, "shout": 1.1, "gasp": 1.1}  # how far a human chin drops per mouth


def hand_parts(side, kind, el, wr, design, skin, scale, koff, z=14, line=4, extras=True):
    """A hand variant bound to the hand bone, drawn at the rest wrist. A mitten is drawn upright for the forearm
    direction it is used in (design[kind], deg, R side); it is turned back by (rest - design) so it reads right
    when the arm gets there."""
    s = -1 if side == "L" else 1
    a_r = math.atan2(wr[1] - el[1], wr[0] - el[0])
    if kind in design:
        a_d = math.radians(design[kind]) if s > 0 else math.pi - math.radians(design[kind])
    else:
        a_d = a_r
    th = a_r - a_d
    k = koff.get(kind, koff["*"])
    c = (wr[0] + (wr[0] - el[0]) * k, wr[1] + (wr[1] - el[1]) * k)
    sc = scale.get(kind, scale["*"])
    P = [S.part("hand." + side, rot_about(S.mitten(c[0], c[1], sc, s, kind), c, th), skin, z=z, line=line, bone="hand." + side)]
    if kind == "point" and extras:
        for e in S.point_extras(c[0], c[1], sc, s, skin, "hand." + side):
            e["pts"] = rot_about(e["pts"], c, th); e["z"] = z + 0.1; e["name"] += "." + side; P.append(e)
    return P


# ------------------------------------------------------------------ people
def leg_parts(hip_w, pants, waist=505, crotch=440):
    """Trouser leg cut at the knee: thigh (behind) + shin with a round knee cap on top, so a bend has no gap."""
    ox = lambda y: -hip_w + 2 + (y < 400) * ((400 - y) / 350) * 20  # outer edge x (matches shapes._legs)
    thigh = [(-hip_w, waist), (-hip_w + 2, 400), (ox(262), 262), (ox(236) + 6, 230), (-58, 222), (-28, 230), (-24, 262), (-14, 390), (-6, crotch)]
    shin = [(ox(262), 262), (-80, 282), (-58, 288), (-36, 282), (-24, 260), (-30, 70), (-34, 50), (-hip_w + 22, 50), (-hip_w + 22, 70), (ox(150), 150)]
    P = []
    for side, m in (("L", lambda pts: pts), ("R", S.mirror)):
        P.append(S.part("thigh." + side, m(thigh), pants, z=1, bone="thigh." + side))
        P.append(S.part("shin." + side, m(shin), pants, z=1.05, bone="shin." + side))
    return P


def leg_geometry(hip_w, knee_x=None):
    ox250 = -hip_w + 2 + (150 / 350) * 20
    return dict(pivot=(0, 470), hip=(hip_w / 2, 470), knee=(knee_x or -(ox250 - 24) / 2, 250),
                ankle=(-(-hip_w + 22 - 34) / 2, 60), knee_out=0.25)


def human_bones(sh, el, wr, legs, extra=()):
    B = [("root", (0, 0), (0, 120), None), ("hips", (0, 470), (0, 540), "root"), ("spine", (0, 540), (0, 760), "hips"),
         ("neck", (0, 760), (0, 812), "spine"), ("head", (0, 812), (0, 990), "neck"), ("jaw", (0, 860), (0, 780), "head")]
    B += list(extra)
    for s, nm in ((-1, "L"), (1, "R")):
        B += [("thigh." + nm, (s * legs["hip"][0], legs["hip"][1]), (s * legs["knee"][0], legs["knee"][1]), "hips"),
              ("shin." + nm, (s * legs["knee"][0], legs["knee"][1]), (s * legs["ankle"][0], legs["ankle"][1]), "thigh." + nm),
              ("foot." + nm, (s * legs["ankle"][0], legs["ankle"][1]), (s * (legs["ankle"][0] + 64), 14), "shin." + nm)]
    for s, nm in ((-1, "L"), (1, "R")):
        a, e, w = (s * sh[0], sh[1]), (s * el[0], el[1]), (s * wr[0], wr[1])
        tip = (w[0] + (w[0] - e[0]) * 0.4, w[1] + (w[1] - e[1]) * 0.4)
        B += [("upper_arm." + nm, a, e, "spine"), ("forearm." + nm, e, w, "upper_arm." + nm), ("hand." + nm, w, tip, "forearm." + nm)]
    return B


HUMAN_SPRING = {  # bone: (stiffness, damping ratio) — lower = more lag / overshoot
    "upper_arm.L": (280, 0.7), "upper_arm.R": (280, 0.7), "forearm.L": (210, 0.58), "forearm.R": (210, 0.58),
    "hand.L": (160, 0.48), "hand.R": (160, 0.48), "head": (230, 0.5), "neck": (300, 0.6), "spine": (320, 0.7), "jaw": (400, 0.8),
}
HUMAN_IDLE = {"spine": (0.8, 3.1, 0), "head": (0.9, 2.3, 0.7), "_shift": (3, 4.4, 0)}


def spec_host():
    SH, EL, WR = (104, 730), (124, 604), (130, 478)
    legs = leg_geometry(104, knee_x=58)
    bones = human_bones(SH, EL, WR, legs, extra=[("string.L", (-16, 756), (-18, 682), "spine"), ("string.R", (16, 756), (18, 682), "spine")])
    base = [p for p in S.host("stand", "smile", "open", "normal") if not is_swap(p["name"]) and not p["name"].startswith("leg.")]
    base += leg_parts(104, S.C["pants"])
    for p in base:
        if p["name"].startswith(("string.", "aglet.")): p["bone"] = "string." + p["name"][-1]
        if p["name"].startswith(("upperarm.", "forearm.")): p["z"] = 5.5 if p["name"].startswith("upper") else 5.6  # arms in front
    groups = face_groups("host")
    design = {"point": ang((176, 636), (196, 766)), "open": ang((172, 620), (240, 680))}  # the arm poses the hands were drawn in
    for s, side in ((-1, "L"), (1, "R")):
        for k in ("fist", "open", "point"):
            groups["hand%s:%s" % (side, k)] = hand_parts(side, k, (s * EL[0], EL[1]), (s * WR[0], WR[1]), design, S.C["skin"],
                                                         {"open": 0.84, "*": 0.72}, {"point": 0.275, "*": 0.231})
    sp = Spec("host", bones, base + grouped(groups), spring=HUMAN_SPRING, legs=legs, jaw=FACE_JAW,
              danglers=[dict(bone="string.L", r=200, k=40, z=0.12, gain=1 / 28), dict(bone="string.R", r=200, k=40, z=0.12, gain=1 / 28)],
              tilt_k=0.3, dip=9, idle=HUMAN_IDLE, lines=False, seconds=7.0)
    sp.poses = {
        "rest": {"spine": 0, "head": 0, "_shift": 0},
        "point": dict(sp.arm_pts("R", (176, 636), (196, 766)), head=-3, spine=-1.5, _shift=-9),
        "chin": dict(sp.arm_pts("L", (-112, 606), (-40, 744)), head=5, neck=2, spine=1, _shift=7),
        "palm": dict(sp.arm_pts("R", (172, 620), (240, 680)), head=-2, spine=-1, _shift=-11),
    }
    sp.timeline = [(0.0, "rest"), (0.9, "point"), (2.7, "rest"), (3.3, "chin"), (4.9, "palm"), (6.4, "rest")]
    sp.swaps = [(0.0, "handL", "fist"), (0.0, "handR", "fist"), (0.75, "handR", "point"), (2.5, "handR", "fist"),
                (4.7, "handR", "open"), (4.8, "handL", "fist"), (6.2, "handR", "fist")]
    sp.face(0.0, "neutral").blink(0.45).face(0.8, "excited").face(2.6, "happy").face(3.2, "thinking").blink(4.1)
    sp.face(4.8, "skeptical").face(6.3, "smug").blink(6.8)
    sp.talk = [(1.1, 2.5), (5.0, 6.2)]
    sp.flaps = ["talk", "o", "talk", "smile", "talk", "flat", "o", "talk"]
    return sp


def spec_friend():
    SH, EL, WR = (94, 728), (112, 602), (118, 478)
    legs = leg_geometry(96)
    bones = human_bones(SH, EL, WR, legs)
    base = [p for p in S.friend("stand", "smirk", "open") if not is_swap(p["name"]) and not p["name"].startswith("leg.")]
    base += leg_parts(96, S.C["f_pants"])
    for p in base:  # arms in front of the body, sleeve over the arm
        n = p["name"]
        if n.startswith("upperarm."): p["z"] = 5.5
        if n.startswith("forearm."): p["z"] = 5.6
        if n.startswith("sleeve."): p["z"] = 5.8
    groups = face_groups("friend")
    design = {"point": 81.0, "open": 70.0}
    for s, side in ((-1, "L"), (1, "R")):
        for k in ("fist", "open", "point"):
            groups["hand%s:%s" % (side, k)] = hand_parts(side, k, (s * EL[0], EL[1]), (s * WR[0], WR[1]), design, S.C["f_skin"],
                                                         {"open": 0.8, "*": 0.68}, {"point": 0.275, "*": 0.231})
    sp = Spec("friend", bones, base + grouped(groups), spring=HUMAN_SPRING, legs=legs, jaw=FACE_JAW,
              tilt_k=0.3, dip=9, idle=HUMAN_IDLE, lines=False, seconds=6.0)
    sp.poses = {
        "rest": {"_shift": 0},
        "wave_a": dict(sp.arm("R", up=30, fore=100), head=-4, spine=-1.5, _shift=-8),
        "wave_b": dict(sp.arm("R", up=30, fore=68), head=-4, spine=-1.5, _shift=-8),
        "shrug": dict(sp.arm("R", up=-38, fore=28), **sp.arm("L", up=-38, fore=28), head=7, neck=2),
    }
    sp.timeline = [(0.0, "rest"), (0.8, "wave_a"), (1.15, "wave_b", 0.22), (1.5, "wave_a", 0.22), (1.85, "wave_b", 0.22),
                   (2.2, "wave_a", 0.22), (2.9, "rest"), (3.7, "shrug"), (5.0, "rest")]
    sp.swaps = [(0.0, "handL", "fist"), (0.0, "handR", "fist"), (0.6, "handR", "open"), (2.65, "handR", "fist"),
                (3.45, "handL", "open"), (3.45, "handR", "open"), (4.75, "handL", "fist"), (4.75, "handR", "fist")]
    sp.face(0.0, "neutral").blink(0.3).face(0.75, "happy").face(2.7, "neutral").face(3.5, "confused").face(4.9, "smug").blink(5.4)
    sp.talk = [(0.85, 2.4)]
    sp.flaps = ["talk", "o", "talk", "smile", "talk", "flat"]
    return sp


# ------------------------------------------------------------------ mascots
MASCOT_SPRING = {"upper_arm.L": (220, 0.5), "upper_arm.R": (220, 0.5), "forearm.L": (170, 0.42), "forearm.R": (170, 0.42),
                 "hand.L": (140, 0.4), "hand.R": (140, 0.4), "spine": (260, 0.45)}
MASCOT_IDLE = {"spine": (1.5, 2.6, 0), "_dip": (3, 1.3, 0)}


def mascot_limb_bones(sh, legs, body_bottom):
    """Bones for shapes.mascot_limbs (stand pose). Legs hang from root so the body can bob and squash on them."""
    B = [("root", (0, 0), (0, 60), None), ("hips", (0, body_bottom), (0, body_bottom + 40), "root")]
    arms = []
    for s, nm in ((-1, "L"), (1, "R")):
        a = (sh[0] * s, sh[1]); e = (a[0] + s * 46, a[1] - 60); w = (a[0] + s * 56, a[1] - 140)
        arms += [("upper_arm." + nm, a, e, "spine"), ("forearm." + nm, e, w, "upper_arm." + nm),
                 ("hand." + nm, w, (w[0] + (w[0] - e[0]) * 0.6, w[1] + (w[1] - e[1]) * 0.6), "forearm." + nm)]
        hip = (legs[0] * s, legs[1]); fx = hip[0] + s * 8
        B += [("thigh." + nm, hip, (fx, 30), "root"), ("foot." + nm, (fx, 30), (fx + s * 40, 10), "thigh." + nm)]
    return B, arms


def mascot_hands(sh):
    groups = {}
    for s, side in ((-1, "L"), (1, "R")):
        a = (sh[0] * s, sh[1]); e = (a[0] + s * 46, a[1] - 60); w = (a[0] + s * 56, a[1] - 140)
        for k in ("fist", "open"):
            groups["hand%s:%s" % (side, k)] = hand_parts(side, k, e, w, {"open": 90.0}, S.C["white"], {"*": 0.62}, {"*": 0.32}, z=-1, extras=False)
    return groups


def spec_gpt(knot):
    sh, legs = (150, 240), (60, 120)
    lb, arms = mascot_limb_bones(sh, legs, 110)
    bones = lb + [("spine", (0, 110), (0, 400), "hips"), ("knot", (0, 250), (0, 330), "spine"), ("head", (0, 230), (0, 290), "spine")] + arms
    base = [p for p in FK.base_parts("gpt", knot) if not is_swap(p["name"])]  # with the bigger face disc
    for p in base:
        if p["name"] == "body" or p["name"].startswith("knot."): p["bone"] = "knot"  # the logo can spin under the face
    groups = face_groups("gpt")
    groups.update(mascot_hands(sh))
    sp = Spec("gpt", bones, base + grouped(groups), spring=dict(MASCOT_SPRING, head=(200, 0.35), knot=(150, 0.5)),
              idle=dict(MASCOT_IDLE, head=(2, 1.9, 0)), squash=True, lines=True, seconds=6.0,
              no_inherit_scale=("upper_arm.L", "upper_arm.R", "head"))
    sp.poses = {
        "rest": {},
        "wave_a": dict(sp.arm("R", up=55, fore=100), head=-6),
        "wave_b": dict(sp.arm("R", up=55, fore=68), head=-6),
        "spin": {"knot": -60, "head": 5},  # the knot repeats every 60 degrees
        "rest2": {"knot": -60},
    }
    sp.timeline = [(0.0, "rest"), (0.8, "wave_a"), (1.15, "wave_b", 0.22), (1.5, "wave_a", 0.22), (1.85, "wave_b", 0.22),
                   (2.2, "wave_a", 0.22), (2.8, "rest"), (3.7, "spin", 0.5), (4.4, "rest2")]
    sp.hops = [(4.6, 60)]
    sp.swaps = [(0.0, "handL", "fist"), (0.0, "handR", "fist"), (0.62, "handR", "open"), (2.55, "handR", "fist")]
    sp.face(0.0, "neutral").blink(0.5).face(0.9, "happy").face(2.6, "neutral").blink(3.3).face(3.6, "dizzy").face(4.5, "excited").face(5.6, "happy")
    return sp


def spec_deepseek():
    sh, legs = (40, 175), (60, 125)
    lb, arms = mascot_limb_bones(sh, legs, 88)
    bones = lb + [("spine", (0, 88), (0, 327), "hips"), ("head", (-85, 200), (-85, 240), "spine")] + arms
    base = [p for p in FK.base_parts("deepseek") if not is_swap(p["name"])]
    groups = face_groups("deepseek")
    groups.update(mascot_hands(sh))
    sp = Spec("deepseek", bones, base + grouped(groups), spring=MASCOT_SPRING, idle=MASCOT_IDLE, squash=True, lines=True,
              seconds=6.0, no_inherit_scale=("upper_arm.L", "upper_arm.R", "head"))
    sp.poses = {"rest": {}, "cheer": dict(sp.arm("R", up=60, fore=85), **sp.arm("L", up=60, fore=85)), "nod": {"spine": 6}}
    sp.timeline = [(0.0, "rest"), (1.0, "cheer"), (2.8, "rest"), (3.8, "nod", 0.3), (4.3, "rest", 0.3), (4.8, "nod", 0.3), (5.3, "rest", 0.3)]
    sp.hops = [(1.3, 70), (2.1, 70)]
    sp.swaps = [(0.0, "handL", "fist"), (0.0, "handR", "fist"), (0.7, "handL", "open"), (0.7, "handR", "open"),
                (2.6, "handL", "fist"), (2.6, "handR", "fist")]
    sp.face(0.0, "neutral").face(0.8, "excited").face(2.9, "neutral").blink(3.5).face(3.8, "happy").blink(5.6)
    return sp


def spec_claude():
    """The Claude Code pixel guy: body block + two side nubs (arms) + four pixel legs, each on its own bone."""
    U, V, X0, Y0 = 30, 60, -270, 300
    rows = ["000111111111111000", "000110111111011000", "000111111111111000", "000111111111111000"]  # nubs + legs cut out
    loops = sorted(S.grid_outline(rows, U, V, X0, Y0), key=lambda L: -abs(S.area(L)))
    col = "#d97757"
    rect = lambda x1, y1, x2, y2: [(x1, y1), (x2, y1), (x2, y2), (x1, y2)]
    base = [S.part("body", loops[0], col, z=2, line=6, gloss=True, smooth=False, bone="spine")]
    for side, s in (("L", -1), ("R", 1)):  # nubs sit behind the body and reach into it, so they can turn at the seam
        x1, x2 = sorted((s * 240, s * 150))
        base.append(S.part("nub." + side, rect(x1, 120, x2, 180), col, z=1, line=6, smooth=False, bone="upper_arm." + side))
    leg_cols = [4, 6, 11, 13]
    bones = [("root", (0, 0), (0, 60), None), ("hips", (0, 60), (0, 100), "root"), ("spine", (0, 60), (0, 300), "hips"),
             ("head", (0, 210), (0, 260), "spine"), ("upper_arm.L", (-180, 150), (-240, 150), "spine"), ("upper_arm.R", (180, 150), (240, 150), "spine")]
    for i, c in enumerate(leg_cols, 1):
        x1 = X0 + c * U
        base.append(S.part("leg.%d" % i, rect(x1, 0, x1 + U, 80), col, z=1, line=6, smooth=False, bone="leg.%d" % i))
        bones.append(("leg.%d" % i, (x1 + U / 2, 60), (x1 + U / 2, 0), "root"))
    groups = face_groups("claude")  # eyes sit on the two cut-out cells of the logo (+-105, 210)
    sp = Spec("claude", bones, base + grouped(groups), spring={"upper_arm.L": (200, 0.45), "upper_arm.R": (200, 0.45), "spine": (260, 0.45)},
              idle=MASCOT_IDLE, squash=True, lines=True, seconds=6.0, no_inherit_scale=("head", "upper_arm.L", "upper_arm.R"))
    # the nubs step up and down by whole pixels (a cell is 60 tall) instead of turning
    sp.quant = {"upper_arm.L": 30, "upper_arm.R": 30}
    sp.poses = {"rest": {"upper_arm.R@y": 0, "upper_arm.L@y": 0}, "wave_a": {"upper_arm.R@y": 120}, "wave_b": {"upper_arm.R@y": 60},
                "both_up": {"upper_arm.R@y": 90, "upper_arm.L@y": 90}}
    sp.timeline = [(0.0, "rest"), (1.8, "wave_a", 0.3), (2.1, "wave_b", 0.2), (2.4, "wave_a", 0.2), (2.7, "wave_b", 0.2),
                   (3.0, "wave_a", 0.2), (3.5, "rest"), (4.3, "both_up", 0.3), (5.2, "rest")]
    sp.hops = [(0.9, 50), (4.4, 70)]
    sp.face(0.0, "neutral").blink(0.5).face(1.7, "happy").face(3.6, "neutral").face(4.2, "excited").face(5.3, "neutral").blink(5.6)
    return sp
