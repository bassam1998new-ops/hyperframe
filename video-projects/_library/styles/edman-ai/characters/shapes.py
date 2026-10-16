"""Edman AI characters: 2D part shapes (pure Python, no bpy).

Units: px-like, feet at y=0, a standing adult is ~1000 tall. x right, y up.
Every part is its own piece so it can hang on its own bone later.
A part = dict(name, pts, closed, fill, line, z, shade, gloss, bone).
Shapes are drawn with smooth Catmull-Rom curves through the control points.
"""
import math

# ---- palette (series roles; the brand fills the hex) ----
INK = "#1a1030"
C = {
    "skin": "#c98b62", "hair": "#241a18", "hood": "#8f88d6", "pants": "#2a2140",
    "shoe": "#e4e4db", "mouth": "#5a1630", "tongue": "#d4566e", "teeth": "#fbf7ef",
    "white": "#fbf7ef",
    "f_skin": "#e0aa82", "f_hair": "#5a3a2a", "f_shirt": "#2dc08a", "f_cap": "#e5336a",
    "f_pants": "#3b3466",
}


def catmull(pts, closed=True, n=10):
    """Sample a centripetal Catmull-Rom spline through pts."""
    P = list(pts)
    if len(P) < 3:
        return P
    if closed:
        P = [P[-1]] + P + [P[0], P[1]]
    else:
        P = [P[0]] + P + [P[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        def tj(ti, a, b):
            return ti + max(math.dist(a, b), 1e-6) ** 0.5
        t0 = 0.0; t1 = tj(t0, p0, p1); t2 = tj(t1, p1, p2); t3 = tj(t2, p2, p3)
        for k in range(n):
            t = t1 + (t2 - t1) * k / n
            def lerp(a, b, ta, tb):
                w = (t - ta) / (tb - ta)
                return (a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w)
            A1 = lerp(p0, p1, t0, t1); A2 = lerp(p1, p2, t1, t2); A3 = lerp(p2, p3, t2, t3)
            B1 = lerp(A1, A2, t0, t2); B2 = lerp(A2, A3, t1, t3)
            out.append(lerp(B1, B2, t1, t2))
    if not closed:
        out.append(pts[-1])
    return out


def ellipse(cx, cy, rx, ry, n=10, a0=0.0):
    return [(cx + rx * math.cos(a0 + 2 * math.pi * i / n), cy + ry * math.sin(a0 + 2 * math.pi * i / n)) for i in range(n)]


def arc(cx, cy, rx, ry, a0, a1, n=8):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / (n - 1))), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / (n - 1)))) for i in range(n)]


def capsule(p, q, r1, r2=None, n=6):
    """A limb: rounded tube from p to q (radius r1 at p, r2 at q)."""
    r2 = r1 if r2 is None else r2
    ang = math.atan2(q[1] - p[1], q[0] - p[0])
    pts = []
    for i in range(n + 1):  # cap around q
        a = ang - math.pi / 2 + math.pi * i / n
        pts.append((q[0] + r2 * math.cos(a), q[1] + r2 * math.sin(a)))
    for i in range(n + 1):  # cap around p
        a = ang + math.pi / 2 + math.pi * i / n
        pts.append((p[0] + r1 * math.cos(a), p[1] + r1 * math.sin(a)))
    return pts


def mirror(pts):
    return [(-x, y) for x, y in reversed(pts)]


def part(name, pts, fill=None, z=0, closed=True, line=5.0, shade=True, gloss=False, bone="root", smooth=True, gdir=(0.75, 0.66), alpha=1.0):
    return dict(name=name, pts=pts, fill=fill, z=z, closed=closed, line=line, shade=shade, gloss=gloss, bone=bone, smooth=smooth, gdir=gdir, alpha=alpha)


# ------------------------------------------------------------------ hands
def mitten(cx, cy, s=1.0, side=1, pose="open"):
    """Reference-style mitten hand: round palm + thumb. side=+1 right hand (screen right)."""
    if pose == "fist":
        return [(cx + side * x * s, cy + y * s) for x, y in [(-30, 0), (-24, 26), (4, 36), (30, 22), (34, -4), (22, -30), (-8, -34), (-28, -20)]]
    if pose == "point":
        # fist, index finger up on the inner (thumb) edge; thumb + knuckles drawn by point_extras()
        return [(cx + side * x * s, cy + y * s) for x, y in [(-34, -2), (-34, 30), (-30, 92), (-20, 102), (-8, 94), (-8, 36), (26, 30), (36, 6), (30, -24), (6, -36), (-20, -32)]]
    # open palm with a thumb
    return [(cx + side * x * s, cy + y * s) for x, y in [(-34, -4), (-46, 26), (-38, 36), (-22, 22), (-14, 44), (14, 46), (34, 26), (36, -8), (22, -32), (-6, -38), (-26, -28)]]


def point_extras(cx, cy, s=1.0, side=1, skin="#c98b62", bone="hand"):
    """Thumb across the curled fingers + knuckle creases, for the pointing hand."""
    T = lambda pts: [(cx + side * x * s, cy + y * s) for x, y in pts]
    return [part("thumb", T([(-14, 6), (6, 20), (24, 14), (26, 2), (8, -4), (-12, -4)]), skin, z=1, line=3, shade=False, bone=bone),
            ]


# ------------------------------------------------------------------ people v2 (proportions from Host's 2026-10-15 reference:
# head ~1/5 of the height, visible neck, shoulders ~2 head widths, long legs, fists at mid-thigh)
def _arm(P, nm, sh, el, wr, col, z, hand, skin, s, r1=30, r2=26, hz=None, cuff=None, bone_sfx=""):
    P.append(part("upperarm." + nm, capsule(sh, el, r1, r2 + 2), col, z=z, smooth=False, bone="upper_arm." + nm))
    P.append(part("forearm." + nm, capsule(el, wr, r2 + 1, r2), cuff or col, z=z + 0.1, smooth=False, bone="forearm." + nm))
    k = 0.42 if hand != "point" else 0.5
    hx, hy = wr[0] + (wr[0] - el[0]) * k * 0.55, wr[1] + (wr[1] - el[1]) * k * 0.55
    hz = z + 0.2 if hz is None else hz
    P.append(part("hand." + nm, mitten(hx, hy, 0.72, s, hand), skin, z=hz, line=4, bone="hand." + nm))
    if hand == "point":
        for e in point_extras(hx, hy, 0.72, s, skin, "hand." + nm):
            e["z"] = hz + 0.05; e["name"] += "." + nm; P.append(e)


def _legs(P, pants, shoe, hip_w=106, waist=505, crotch=440, sole="#cfcadb"):
    """Natural legs: thigh -> knee -> ankle taper; feet turned slightly out; shoes with a sole."""
    legL = [(-hip_w, waist), (-hip_w + 2, 400), (-hip_w + 10, 250), (-hip_w + 22, 70), (-hip_w + 22, 50),
            (-34, 50), (-30, 70), (-24, 250), (-14, 390), (-6, crotch)]
    P.append(part("leg.L", legL, pants, z=1, bone="thigh.L"))
    P.append(part("leg.R", mirror(legL), pants, z=1, bone="thigh.R"))
    P.append(part("pelvis", [(-hip_w, waist), (hip_w, waist), (hip_w - 2, crotch + 30), (0, crotch - 8), (-hip_w + 2, crotch + 30)], pants, z=1.1, smooth=False, bone="hips"))
    ax = -hip_w / 2 - 14  # ankle centre of the left leg
    # sneaker seen 3/4: heel counter behind the ankle, vamp sloping to a rounded, slightly upturned toe
    foot = [(ax + 30, 10), (ax + 36, 40), (ax + 26, 66), (ax - 4, 70), (ax - 30, 58), (ax - 56, 46), (ax - 76, 38), (ax - 88, 26), (ax - 88, 14), (ax - 74, 8)]
    P.append(part("shoe.L", foot, shoe, z=0.8, bone="foot.L"))
    P.append(part("shoe.R", mirror(foot), shoe, z=0.8, bone="foot.R"))
    so = [(ax + 34, 0), (ax + 38, 16), (ax - 20, 14), (ax - 70, 14), (ax - 90, 20), (ax - 96, 12), (ax - 86, 2)]
    P.append(part("sole.L", so, sole, z=0.9, smooth=True, shade=False, bone="foot.L"))
    P.append(part("sole.R", mirror(so), sole, z=0.9, smooth=True, shade=False, bone="foot.R"))
    for s_, nm in ((1, "L"), (-1, "R")):  # laces + toe-cap seam
        P.append(part("lace." + nm, [(s_ * (ax - 10), 58), (s_ * (ax - 22), 52)], None, z=1.2, closed=False, line=2.2, shade=False, bone="foot." + nm))
        P.append(part("lace2." + nm, [(s_ * (ax - 22), 52), (s_ * (ax - 34), 46)], None, z=1.2, closed=False, line=2.2, shade=False, bone="foot." + nm))


def _face(P, cx, cy, skin, eyes, brows, ex=26, ey=8, blush="#e48a7e", blush_y=-22):
    for s, nm in ((-1, "L"), (1, "R")):
        x, y = cx + s * ex, cy + ey
        if eyes == "happy":
            P.append(part("eye." + nm, arc(x, y - 3, 8, 8, 20, 160, 7), None, z=12, closed=False, line=4, shade=False, bone="head"))
        elif eyes == "closed":  # blink
            P.append(part("eye." + nm, arc(x, y + 3, 9, 5, 200, 340, 7), None, z=12, closed=False, line=4, shade=False, bone="head"))
        elif eyes == "lids":
            P.append(part("eye." + nm, [(x - 8, y + 1), (x + 8, y + 1), (x + 6, y - 7), (x, y - 9), (x - 6, y - 7)], INK, z=12, line=0, shade=False, bone="head"))
            P.append(part("lid." + nm, [(x - 9, y + 1.5), (x + 9, y + 1.5)], None, z=13, closed=False, line=3.5, shade=False, bone="head"))
        else:
            P.append(part("eye." + nm, ellipse(x, y, 6.5, 8.5, 10), INK, z=12, line=0, shade=False, bone="head"))
            P.append(part("glint." + nm, ellipse(x - 2, y + 3, 2, 2.4, 8), C["white"], z=13, line=0, shade=False, bone="head"))
        by = cy + ey + 20
        if brows == "up": b = [(x - 12, by), (x, by + 6), (x + 12, by + 1)]
        elif brows == "angry": b = [(x - 12 * s, by + 4), (x + 12 * s, by - 4)]
        else: b = [(x - 12, by - 1), (x, by + 3), (x + 12, by)]
        P.append(part("brow." + nm, b, None, z=13, closed=False, line=4.5, shade=False, bone="head"))
        P.append(part("blush." + nm, ellipse(cx + s * (ex + 14), cy + blush_y, 13, 8, 10), blush, z=11.5, line=0, shade=False, bone="head", alpha=0.45))


def host(pose="stand", mouth="smile", eyes="open", brows="normal"):
    P = []
    HC = (0, 885)  # head centre
    _legs(P, C["pants"], C["shoe"], hip_w=104)
    # neck (hidden mostly by the beard) and hood collar behind it
    P.append(part("neck", [(-26, 812), (26, 812), (28, 752), (-28, 752)], C["skin"], z=1.8, smooth=False, bone="neck"))
    # sloped shoulders (trapezius -> rounded shoulder cap), chest narrower than the hips of the hoodie hem
    torso = [(-26, 788), (-66, 772), (-96, 756), (-114, 736), (-120, 704), (-116, 640), (-108, 560), (-110, 472),
             (110, 472), (108, 560), (116, 640), (120, 704), (114, 736), (96, 756), (66, 772), (26, 788)]
    P.append(part("torso", torso, C["hood"], z=2, bone="spine"))
    P.append(part("hem", [(-112, 504), (112, 504), (110, 468), (-110, 468)], "#7c74c4", z=2.2, smooth=False, shade=False, bone="spine"))
    P.append(part("pocket", [(-54, 516), (-44, 586), (44, 586), (54, 516)], "#857dcf", z=2.3, smooth=False, shade=False, line=3, bone="spine"))
    P.append(part("hood.collar", [(-66, 802), (-58, 766), (-28, 750), (0, 748), (28, 750), (58, 766), (66, 802), (38, 790), (0, 778), (-38, 790)], "#7c74c4", z=3.2, bone="spine"))
    for s in (-1, 1):
        n = "L" if s < 0 else "R"
        P.append(part("string." + n, [(s * 16, 756), (s * 20, 714), (s * 18, 688)], None, z=3.3, closed=False, line=2.5, shade=False, bone="spine"))
        P.append(part("aglet." + n, ellipse(s * 18, 682, 3.5, 6, 8), C["white"], z=3.4, shade=False, line=2, bone="spine"))
    # arms: rest = hanging, fists at mid-thigh
    for s, nm in ((-1, "L"), (1, "R")):
        sh = (s * 104, 730); el = (s * 124, 604); wr = (s * 130, 478); hand = "fist"; z = 1.5; hz = None
        if pose == "point" and s == 1: el = (176, 636); wr = (196, 766); hand = "point"; z = 4
        if pose == "chin" and s == -1: el = (-112, 606); wr = (-40, 744); hand = "fist"; z = 6; hz = 14
        if pose == "palm" and s == 1: el = (174, 618); wr = (240, 648); hand = "open"; z = 4
        _arm(P, nm, sh, el, wr, C["hood"], z, hand, C["skin"], s, r1=27, r2=23, hz=hz)
    # head
    for s, nm in ((-1, "L"), (1, "R")):
        P.append(part("ear." + nm, ellipse(HC[0] + s * 72, HC[1] - 4, 11, 17, 10), C["skin"], z=6, bone="head"))
    P.append(part("head", ellipse(HC[0], HC[1], 72, 88, 16), C["skin"], z=7, bone="head"))
    hair = arc(HC[0], HC[1] + 2, 76, 96, 22, 158, 12) + [(-70, 922), (-60, 944), (-30, 950), (0, 958), (30, 950), (60, 944), (70, 922)]
    P.append(part("hair", hair, C["hair"], z=8, gloss=True, bone="head"))
    beard = [(-74, 886), (-72, 840), (-58, 800), (-30, 778), (0, 772), (30, 778), (58, 800), (72, 840), (74, 886),
             (60, 862), (42, 852), (24, 854), (0, 850), (-24, 854), (-42, 852), (-60, 862)]
    P.append(part("beard", beard, C["hair"], z=9, gloss=True, bone="jaw", gdir=(0.9, -0.45)))
    P.append(part("nose", [(-7, 880), (-10, 868), (0, 862), (10, 866), (8, 878)], "#b77852", z=10, line=2.5, shade=False, bone="head"))
    my = 828
    if mouth == "smile": mp = [(-22, my + 10), (22, my + 10), (16, my - 2), (0, my - 8), (-16, my - 2)]
    elif mouth == "talk": mp = [(-17, my + 10), (17, my + 10), (14, my - 6), (0, my - 14), (-14, my - 6)]
    elif mouth == "o": mp = ellipse(0, my, 9, 12, 10)
    else: mp = [(-16, my + 3), (16, my + 3), (16, my), (-16, my)]
    P.append(part("mouth", mp, C["mouth"], z=10, line=2.5, shade=False, bone="jaw"))
    if mouth in ("smile", "talk"):
        P.append(part("teeth", [(-19, my + 9), (19, my + 9), (16, my + 4), (-16, my + 4)], C["teeth"], z=11, line=0, shade=False, smooth=False, bone="jaw"))
        P.append(part("tongue", ellipse(2, my - 4 if mouth == "smile" else my - 7, 9, 4, 10), C["tongue"], z=11, line=0, shade=False, bone="jaw"))
    P.append(part("mustache", [(-30, 848), (-18, 858), (-5, 858), (0, 854), (5, 858), (18, 858), (30, 848), (18, 851), (0, 849), (-18, 851)], C["hair"], z=12, line=2.5, shade=False, bone="head"))
    _face(P, HC[0], HC[1], C["skin"], eyes, brows, ex=27, ey=10, blush_y=-12)
    return P


def friend(pose="stand", mouth="smirk", eyes="open", brows="normal"):
    P = []
    HC = (0, 878)
    _legs(P, C["f_pants"], C["white"], hip_w=96)
    P.append(part("neck", [(-22, 808), (22, 808), (24, 752), (-24, 752)], C["f_skin"], z=1.8, smooth=False, bone="neck"))
    torso = [(-24, 784), (-60, 770), (-88, 754), (-104, 734), (-108, 702), (-102, 640), (-96, 560), (-98, 472),
             (98, 472), (96, 560), (102, 640), (108, 702), (104, 734), (88, 754), (60, 770), (24, 784)]
    P.append(part("torso", torso, C["f_shirt"], z=2, bone="spine"))
    P.append(part("collar", [(-30, 786), (-20, 772), (0, 766), (20, 772), (30, 786), (18, 780), (0, 776), (-18, 780)], "#25a877", z=3.2, shade=False, bone="spine"))
    for s, nm in ((-1, "L"), (1, "R")):
        sh = (s * 94, 728); el = (s * 112, 602); wr = (s * 118, 478); hand = "fist"; z = 1.5; hz = None
        if pose == "box": el = (s * 124, 600); wr = (s * 88, 560); hand = "open"; z = 4.5; hz = 9
        _arm(P, nm, sh, el, wr, C["f_skin"], z, hand, C["f_skin"], s, r1=20, r2=17, hz=hz)
        # short sleeve over the top of the arm
        mid = (sh[0] + (el[0] - sh[0]) * 0.42, sh[1] + (el[1] - sh[1]) * 0.42)
        P.append(part("sleeve." + nm, capsule(sh, mid, 27, 25), C["f_shirt"], z=z + 0.3, smooth=False, bone="upper_arm." + nm))
    if pose == "box":
        P.append(part("box", [(-100, 520), (100, 520), (100, 680), (-100, 680)], "#c9925a", z=8, smooth=False, bone="hand.R"))
        P.append(part("box.lid", [(-108, 666), (108, 666), (108, 694), (-108, 694)], "#b67f49", z=8.2, smooth=False, shade=False, bone="hand.R"))
        P.append(part("box.tape", [(-14, 520), (14, 520), (14, 694), (-14, 694)], "#e3c28f", z=8.4, smooth=False, shade=False, line=0, bone="hand.R"))
    for s, nm in ((-1, "L"), (1, "R")):
        P.append(part("ear." + nm, ellipse(HC[0] + s * 66, HC[1] - 4, 10, 16, 10), C["f_skin"], z=6, bone="head"))
    P.append(part("head", [(-66, 900), (-64, 846), (-50, 808), (-24, 790), (0, 787), (24, 790), (50, 808), (64, 846), (66, 900), (50, 948), (0, 962), (-50, 948)], C["f_skin"], z=7, bone="head"))
    P.append(part("sideburn.L", [(-66, 900), (-60, 872), (-52, 890), (-56, 924)], C["f_hair"], z=8, shade=False, bone="head"))
    P.append(part("sideburn.R", mirror([(-66, 900), (-60, 872), (-52, 890), (-56, 924)]), C["f_hair"], z=8, shade=False, bone="head"))
    P.append(part("cap", [(-72, 920), (-64, 966), (-30, 992), (0, 996), (30, 992), (64, 966), (72, 920), (0, 930)], C["f_cap"], z=9, gloss=True, bone="head"))
    P.append(part("cap.brim", [(20, 926), (30, 940), (104, 938), (122, 926), (110, 914), (40, 912)], "#c22457", z=9.2, bone="head"))
    P.append(part("cap.button", ellipse(0, 995, 6, 4, 8), "#c22457", z=9.3, shade=False, line=2, bone="head"))
    P.append(part("nose", [(-3, 872), (-8, 856), (0, 852), (7, 855)], None, z=10, closed=False, line=2.5, shade=False, bone="head"))
    my = 828
    if mouth == "smirk":
        P.append(part("mouth", [(-16, my + 2), (0, my - 1), (15, my + 5), (19, my + 10)], None, z=10, closed=False, line=3.5, shade=False, bone="jaw"))
    elif mouth == "smile":
        P.append(part("mouth", arc(0, my + 8, 17, 11, 205, 335, 7), None, z=10, closed=False, line=3.5, shade=False, bone="jaw"))
    elif mouth == "flat":
        P.append(part("mouth", [(-12, my), (12, my + 1)], None, z=10, closed=False, line=3.5, shade=False, bone="jaw"))
    elif mouth == "o":
        P.append(part("mouth", ellipse(0, my - 3, 7, 9, 10), C["mouth"], z=10, line=2.5, shade=False, bone="jaw"))
    else:
        P.append(part("mouth", [(-16, my + 4), (16, my + 4), (12, my - 8), (0, my - 13), (-12, my - 8)], C["mouth"], z=10, line=2.5, shade=False, bone="jaw"))
    _face(P, HC[0], HC[1], C["f_skin"], eyes, brows, ex=24, ey=6, blush_y=-24)
    return P


# ------------------------------------------------------------------ path sampler (absolute M/L/C/Q/Z, y down -> flipped)
def sample_path(d, scale=1.0, ox=0.0, oy=0.0, n=10):
    import re
    tok = re.findall(r"[MLCQZ]|-?\d*\.?\d+", d)
    loops, cur, i, cmd, pos = [], [], 0, None, (0, 0)

    def PT(x, y):
        return (ox + float(x) * scale, oy - float(y) * scale)
    while i < len(tok):
        if tok[i] in "MLCQZ":
            cmd = tok[i]; i += 1
        if cmd == "M":
            if cur: loops.append(cur)
            pos = PT(tok[i], tok[i + 1]); cur = [pos]; i += 2; cmd = "L"
        elif cmd == "L":
            pos = PT(tok[i], tok[i + 1]); cur.append(pos); i += 2
        elif cmd == "C":
            a, b, c = PT(tok[i], tok[i + 1]), PT(tok[i + 2], tok[i + 3]), PT(tok[i + 4], tok[i + 5]); i += 6
            for k in range(1, n + 1):
                t = k / n; u = 1 - t
                cur.append((u ** 3 * pos[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t ** 3 * c[0],
                            u ** 3 * pos[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t ** 3 * c[1]))
            pos = c
        elif cmd == "Q":
            a, c = PT(tok[i], tok[i + 1]), PT(tok[i + 2], tok[i + 3]); i += 4
            for k in range(1, n + 1):
                t = k / n; u = 1 - t
                cur.append((u * u * pos[0] + 2 * u * t * a[0] + t * t * c[0], u * u * pos[1] + 2 * u * t * a[1] + t * t * c[1]))
            pos = c
        elif cmd == "Z":
            if cur: loops.append(cur); cur = []
    if cur: loops.append(cur)
    # drop a closing point that repeats the first one
    return [L[:-1] if len(L) > 2 and math.dist(L[0], L[-1]) < 1e-6 else L for L in loops]


def grid_outline(rows, U, V, ox, oy):
    """Outer and hole loops of the union of filled grid cells (row 0 = top)."""
    H = len(rows); W = len(rows[0])

    def on(x, y):
        return 0 <= y < H and 0 <= x < W and rows[y][x] == "1"
    edges = {}
    for y in range(H):
        for x in range(W):
            if not on(x, y): continue
            if not on(x, y - 1): edges[(x + 1, y)] = (x, y)
            if not on(x - 1, y): edges[(x, y)] = (x, y + 1)
            if not on(x, y + 1): edges[(x, y + 1)] = (x + 1, y + 1)
            if not on(x + 1, y): edges[(x + 1, y + 1)] = (x + 1, y)
    loops = []
    while edges:
        start, nxt = edges.popitem(); loop = [start]
        while nxt != start:
            loop.append(nxt); nxt = edges.pop(nxt)
        pts = [(ox + gx * U, oy - gy * V) for gx, gy in loop]
        n = len(pts)
        clean = [p for k, p in enumerate(pts)
                 if not ((pts[k - 1][0] == p[0] == pts[(k + 1) % n][0]) or (pts[k - 1][1] == p[1] == pts[(k + 1) % n][1]))]
        loops.append(clean)
    return loops


def area(pts):
    return sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts))) / 2


def mascot_limbs(P, col_arm, sh, pose, legs):
    """Reference-style thin tube arms with white mitten hands, short legs with shoes."""
    for s, nm in ((-1, "L"), (1, "R")):
        a = (sh[0] * s, sh[1])
        if pose == "wave" and s == 1:
            e = (a[0] + 70, a[1] + 60); w = (a[0] + 100, a[1] + 150)
        elif pose == "cheer":
            e = (a[0] + s * 60, a[1] + 70); w = (a[0] + s * 70, a[1] + 160)
        else:
            e = (a[0] + s * 46, a[1] - 60); w = (a[0] + s * 56, a[1] - 140)
        P.append(part("arm." + nm, capsule(a, e, 14, 13), col_arm, z=-2, smooth=False, shade=False, bone="upper_arm." + nm))
        P.append(part("forearm." + nm, capsule(e, w, 13, 12), col_arm, z=-2, smooth=False, shade=False, bone="forearm." + nm))
        hx, hy = w[0] + (w[0] - e[0]) * 0.32, w[1] + (w[1] - e[1]) * 0.32
        P.append(part("hand." + nm, mitten(hx, hy, 0.62, s, "open" if pose != "stand" else "fist"), C["white"], z=-1, line=4, bone="hand." + nm))
    for s, nm in ((-1, "L"), (1, "R")):
        hip = (legs[0] * s, legs[1]); fx = hip[0] + s * 8
        P.append(part("leg." + nm, capsule(hip, (fx, 30), 15, 14), col_arm, z=-3, smooth=False, shade=False, bone="thigh." + nm))
        P.append(part("shoe." + nm, [(fx - 34, 0), (fx - 36, 26), (fx - 10, 40), (fx + 34, 34), (fx + 40, 4)], C["white"], z=-1, line=4, bone="foot." + nm))


def claude_mascot(pose="stand", eyes="open"):
    """The Claude Code pixel guy, cell for cell; a cell is 1 wide x 2 tall like the terminal."""
    R = ["000111111111111000", "000110111111011000", "011111111111111110", "000111111111111000", "000010100001010000"]
    U, V = 30, 60
    loops = grid_outline(R, U, V, -9 * U, 5 * V)
    loops.sort(key=lambda L: -abs(area(L)))
    P = [part("body", loops[0], "#d97757", z=2, line=6, gloss=True, smooth=False, bone="spine")]
    for k, h in enumerate(loops[1:]):  # holes = the two eye cells
        if eyes == "happy":
            x1 = min(p[0] for p in h); x2 = max(p[0] for p in h); y1 = min(p[1] for p in h)
            P.append(part("eye.%d" % k, [(x1, y1), (x2, y1), (x2, y1 + V * 0.45), (x1, y1 + V * 0.45)], INK, z=3, line=0, shade=False, smooth=False, bone="head"))
        else:
            P.append(part("eye.%d" % k, h, INK, z=3, line=0, shade=False, smooth=False, bone="head"))
    return P


WHALE = "M-130 0 C-130 -75 10 -90 70 -40 Q100 -60 110 -105 Q140 -100 160 -122 Q150 -80 125 -60 Q150 -50 166 -20 Q120 -30 96 -15 C90 50 -40 70 -100 45 Q-130 30 -130 0 Z"


def deepseek_mascot(pose="stand", eyes="open"):
    sc, oy = 1.25, 175
    P = []
    mascot_limbs(P, "#33449e", (40, 175), pose, legs=(60, 125))
    P.append(part("body", sample_path(WHALE, sc, 0, oy)[0], "#4d6bfe", z=2, line=6, gloss=True, smooth=False, bone="spine"))
    P.append(part("belly", sample_path("M-110 20 Q-40 58 60 22 Q-20 44 -110 20 Z", sc, 0, oy)[0], "#9fb2ff", z=3, line=0, shade=False, smooth=False, bone="spine"))
    for k, (ex, ey) in enumerate([(-86, -20), (-50, -26)]):
        x, y = ex * sc, oy - ey * sc
        if eyes == "happy":
            P.append(part("eye.%d" % k, arc(x, y - 6, 12, 12, 20, 160, 7), None, z=4, closed=False, line=5, shade=False, bone="head"))
        elif eyes == "closed":
            P.append(part("eye.%d" % k, arc(x, y + 4, 13, 7, 200, 340, 7), None, z=4, closed=False, line=5, shade=False, bone="head"))
        else:
            P.append(part("eyew.%d" % k, ellipse(x, y, 15, 19, 10), C["white"], z=4, line=3.5, shade=False, bone="head"))
            P.append(part("eye.%d" % k, ellipse(x + 3, y - 2, 7, 10, 8), INK, z=5, line=0, shade=False, bone="head"))
    return P


def gpt_mascot(pose="stand", eyes="open", knot=None):
    """knot = loops of the OpenAI logo (sampled, centred at (0, 250), y up) — passed in by the Blender side."""
    P = []
    mascot_limbs(P, "#5b5b66", (150, 240), pose, legs=(60, 120))
    loops = sorted(knot or [], key=lambda L: -abs(area(L)))
    if loops:
        P.append(part("body", loops[0], "#ececec", z=2, line=6, gloss=True, smooth=False, bone="spine"))
        for k, h in enumerate(loops[1:]):
            P.append(part("knot.%d" % k, h, "#2e2b3a", z=3, line=0, shade=False, smooth=False, bone="spine"))
    P.append(part("face", ellipse(0, 250, 62, 44, 14), "#ececec", z=4, line=4, shade=False, bone="head"))
    for k, x in enumerate((-24, 24)):
        if eyes == "happy":
            P.append(part("eye.%d" % k, arc(x, 244, 11, 11, 20, 160, 7), None, z=5, closed=False, line=5, shade=False, bone="head"))
        elif eyes == "closed":
            P.append(part("eye.%d" % k, arc(x, 256, 11, 6, 200, 340, 7), None, z=5, closed=False, line=5, shade=False, bone="head"))
        else:
            P.append(part("eye.%d" % k, ellipse(x, 252, 8, 12, 10), INK, z=5, line=0, shade=False, bone="head"))
            P.append(part("glint.%d" % k, ellipse(x - 2, 256, 2.6, 3.4, 8), C["white"], z=6, line=0, shade=False, bone="head"))
    return P


HUMANS = (host, friend)  # Host 2026-10-15: humans without outlines, mascots outlined

SHEET = [
    # (label, builder, kwargs)
    ("Host — rest", host, dict(pose="stand", mouth="smile")),
    ("point", host, dict(pose="point", mouth="talk", brows="up")),
    ("hand to chin", host, dict(pose="chin", mouth="flat", eyes="lids")),
    ("open palm", host, dict(pose="palm", mouth="talk", eyes="happy")),
    ("Friend — rest", friend, dict(pose="stand", mouth="smirk")),
    ("carrying", friend, dict(pose="box", mouth="talk", eyes="lids")),
    ("Claude", claude_mascot, dict(eyes="open")),
    ("ChatGPT", gpt_mascot, dict(pose="wave")),
    ("DeepSeek", deepseek_mascot, dict(pose="cheer", eyes="happy")),
]
