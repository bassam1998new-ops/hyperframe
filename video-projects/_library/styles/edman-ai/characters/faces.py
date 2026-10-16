"""Face expression kit for the ادمان الAI characters (pure Python, no bpy).

Host 2026-10-15: all five characters, core + thinking + comedy sets + extra effects, mascots get mouths,
exaggerated like the satire reference.

An expression = eyes + brows + mouth + effects. Eyes and brows can differ per side: a pair (left, right).
Every feature is made of parts named with the rig's swap prefixes (eye., eyew., glint., lid., brow., mouth,
teeth, tongue, fx.) so a rig can swap them per feature.
Smooth kit = Host, the friend, ChatGPT, DeepSeek. Pixel kit = Claude (everything in 10-unit blocks).
"""
import math
import shapes as S
from shapes import part, ellipse, arc, C, INK

FX = dict(sweat="#9fd8ff", tear="#7cc6ff", vein="#e5336a", blush="#ff7a8a", hatch="#d9485a")

EXPRESSIONS = [  # name, eyes, brows, mouth, effects       (a pair = (left, right))
    ("neutral", "open", "normal", "flat", ()),
    ("happy", "happy", "up", "smile", ()),
    ("laugh", "squeeze", "up", "laugh", ()),
    ("excited", "sparkle", "up", "laugh", ()),
    ("angry", "angry", "angry", "shout", ("vein",)),
    ("annoyed", "lids", "flat", "side", ()),
    ("sad", "sad", "sad", "frown", ("tears",)),
    ("surprised", "wide", "up", "gasp", ()),
    ("scared", "tiny", "sad", "wavy", ("sweat",)),
    ("thinking", "look", ("normal", "high"), "side", ()),
    ("skeptical", ("lids", "open"), ("flat", "high"), "smirk", ()),
    ("confused", "open", ("high", "angry"), "wavy", ("question",)),
    ("smug", "lids", "up", "smirk", ()),
    ("embarrassed", "happy", "sad", "wavy", ("blush", "sweat")),
    ("disgusted", ("lids", "squeeze"), "angry", "disgust", ()),
    ("dizzy", "swirl", "sad", "wavy", ()),
]
EXPR = {e[0]: e for e in EXPRESSIONS}
MOUTHS = ("flat", "smile", "talk", "o", "laugh", "shout", "gasp", "frown", "wavy", "smirk", "side", "disgust")
EYES = ("open", "happy", "closed", "lids", "squeeze", "angry", "sad", "wide", "tiny", "look", "sparkle", "swirl")
BROWS = ("normal", "up", "high", "angry", "sad", "flat")


class Face:
    """Where a character's face features sit (sheet units) and how they are drawn."""
    def __init__(self, eyes, mouth, brow_dy, ek=1.0, mk=1.0, bk=1.0, style="ink", lid_fill=None, white=(15, 19),
                 blush=(), sweat=None, vein=None, question=None, z=10, eye_bone="head", mouth_bone="jaw", outlined=False, mouth_line=INK):
        self.eyes, self.mouth, self.brow_dy = eyes, mouth, brow_dy
        self.ek, self.mk, self.bk, self.style, self.lid_fill, self.white = ek, mk, bk, style, lid_fill, white
        self.blush, self.sweat, self.vein, self.question = blush, sweat, vein, question
        self.z, self.eye_bone, self.mouth_bone, self.outlined, self.mouth_line = z, eye_bone, mouth_bone, outlined, mouth_line


FACES = {
    "host": Face([(-27, 895), (27, 895)], (0, 828), 20, blush=[(-41, 873), (41, 873)], sweat=(84, 930), vein=(70, 985), question=(112, 985),
                   mouth_line="#f0c7a6"),
    "friend": Face([(-24, 884), (24, 884)], (0, 828), 20, blush=[(-38, 854), (38, 854)], sweat=(96, 872), vein=(92, 1012), question=(124, 1010)),
    "gpt": Face([(-30, 262), (30, 262)], (0, 216), 20, ek=1.6, mk=1.2, bk=1.5, blush=[(-56, 232), (56, 232)], sweat=(150, 365),
                vein=(118, 410), question=(178, 415), z=5, eye_bone="head", mouth_bone="head", outlined=True),
    "deepseek": Face([(-107.5, 200), (-62.5, 207.5)], (-96, 150), 30, ek=1.0, mk=0.95, bk=1.35, style="whites", lid_fill="#4d6bfe",
                     blush=[(-126, 176), (-40, 184)], sweat=(-8, 300), vein=(-150, 300), question=(-180, 330), z=4, eye_bone="head",
                     mouth_bone="head", outlined=True),
}


def _rim(name, pts, z, bone, lw=3.0, col_part=None):
    """An ink outline as an open stroke (people draw without outlines, but white eyes and effects need one)."""
    return part(name, list(pts) + [pts[0]], None, z=z, closed=False, line=lw, shade=False, bone=bone)


def _clip_above(pts, a, b):
    """Part of the closed polygon pts that lies above the line a->b (Sutherland-Hodgman, one half-plane)."""
    side = lambda p: (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
    out = []
    for i in range(len(pts)):
        p, q = pts[i], pts[(i + 1) % len(pts)]
        sp, sq = side(p), side(q)
        if sp >= 0: out.append(p)
        if (sp >= 0) != (sq >= 0):
            t = sp / (sp - sq); out.append((p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t))
    return out


def _star(cx, cy, r, ri, n=4):
    return [(cx + (r if i % 2 == 0 else ri) * math.cos(math.pi / 2 + math.pi * i / n),
             cy + (r if i % 2 == 0 else ri) * math.sin(math.pi / 2 + math.pi * i / n)) for i in range(2 * n)]


def _spiral(cx, cy, r, turns=2.2, n=40):
    return [(cx + r * (1 - i / n) * math.cos(2 * math.pi * turns * i / n), cy + r * (1 - i / n) * math.sin(2 * math.pi * turns * i / n)) for i in range(n + 1)]


# ------------------------------------------------------------------ smooth kit
def eye_parts(F, side, state):
    """side 0 = left, 1 = right. Shapes are written for the right eye (inner side = -x) and mirrored for the left."""
    nm = "LR"[side]; s = -1 if side == 0 else 1
    x, y = F.eyes[side]; k = F.ek; z = F.z + 2; bone = F.eye_bone
    M = lambda pts, mir=True: [(x + (s if mir else 1) * dx * k, y + dy * k) for dx, dy in pts]
    E = lambda cx, cy, rx, ry, n=12, mir=True: M(ellipse(cx, cy, rx, ry, n), mir)
    ink = lambda nmx, pts, zz=z: part(nmx, pts, INK, z=zz, line=0, shade=False, bone=bone)
    white = lambda nmx, pts, zz=z: part(nmx, pts, C["white"], z=zz, line=0, shade=False, bone=bone)
    line = lambda nmx, pts, lw=4.0, zz=z: part(nmx, pts, None, z=zz, closed=False, line=lw * k, shade=False, bone=bone)
    P = []
    if F.style == "whites" and state not in ("happy", "closed", "squeeze", "swirl"):
        W, H = F.white
        sc = {"wide": 1.15, "tiny": 1.1}.get(state, 1.0)
        wpts = E(0, 0, W * sc, H * sc, 16)
        P.append(white("eyew." + nm, wpts))
        pup = {"wide": (3, -2, 5, 7), "tiny": (2, -1, 3, 3.5), "look": (5, 6, 7, 10), "sparkle": (2, -1, 9.5, 12.5)}.get(state, (3, -2, 7, 10))
        P.append(ink("eye." + nm, E(pup[0], pup[1], pup[2], pup[3], 12, False), z + 0.1))
        if state == "sparkle":
            P.append(white("glint." + nm, M(_star(-1, 3, 7, 1.8), False), z + 0.2))
        else:
            P.append(white("glint." + nm, E(pup[0] - 2, pup[1] + 3, 2.2, 2.6, 8, False), z + 0.2))
        if state in ("angry", "sad", "lids"):  # an eyelid in the body colour comes down over the eye
            yi, yo = {"angry": (0.05, 0.6), "sad": (0.6, 0.05), "lids": (0.1, 0.1)}[state]
            a = M([(-W * 1.3, H * yi)])[0]; b = M([(W * 1.3, H * yo)])[0]
            if s < 0: a, b = b, a
            lid = _clip_above(wpts, a, b)
            if len(lid) > 2:
                P.append(part("lid." + nm, lid, F.lid_fill, z=z + 0.3, line=0, shade=False, smooth=False, bone=bone))
                P.append(line("lid." + nm + ".edge", _clip_line(wpts, a, b), 3.5, z + 0.4))
        P.append(_rim("eyew." + nm + ".rim", wpts, z + 0.5, bone, 3.0))
        return P
    if F.style == "whites": k = k * 1.6; M = lambda pts, mir=True: [(x + (s if mir else 1) * dx * k, y + dy * k) for dx, dy in pts]
    if state == "open":
        P += [ink("eye." + nm, E(0, 0, 6.5, 8.5)), white("glint." + nm, E(-2, 3, 2, 2.4, 8, False), z + 0.1)]
    elif state == "happy":
        P.append(line("eye." + nm, M(arc(0, -3, 8, 8, 20, 160, 7)), 4.5))
    elif state == "closed":
        P.append(line("eye." + nm, M(arc(0, 3, 9, 5, 200, 340, 7)), 4.5))
    elif state == "lids":
        P.append(ink("eye." + nm, M([(-8, 1), (8, 1), (6, -7), (0, -9), (-6, -7)])))
        P.append(line("lid." + nm, M([(-10, 1.5), (10, 1.5)]), 3.5, z + 0.1))
    elif state == "squeeze":
        P.append(line("eye." + nm, M([(8, 8), (-7, 0), (8, -8)]), 4.5))
    elif state == "angry":
        P += [ink("eye." + nm, M([(-8, 1), (-2, 4), (8, 9), (8, -2), (5, -8), (-2, -9), (-7, -5)])), white("glint." + nm, E(-1, -1, 1.8, 2.1, 8, False), z + 0.1)]
    elif state == "sad":
        P += [ink("eye." + nm, M([(-8, 9), (-2, 7), (8, 2), (8, -3), (4, -8), (-3, -9), (-8, -4)])), white("glint." + nm, E(-2, 1, 1.8, 2.1, 8, False), z + 0.1)]
    elif state in ("wide", "tiny"):
        wpts = E(0, 0, 11, 13, 16)
        P += [white("eyew." + nm, wpts), _rim("eyew." + nm + ".rim", wpts, z + 0.3, bone, 3.0 * k)]
        P.append(ink("eye." + nm, E(0, -1, 5, 6, 12, False) if state == "wide" else E(0, -1, 2.6, 3, 10, False), z + 0.1))
        if state == "wide": P.append(white("glint." + nm, E(-2, 1.5, 1.6, 1.8, 8, False), z + 0.2))
    elif state == "look":
        P += [ink("eye." + nm, E(3, 4, 6, 8, 12, False)), white("glint." + nm, E(1, 7, 1.8, 2.1, 8, False), z + 0.1)]
    elif state == "sparkle":
        P += [ink("eye." + nm, E(0, 0, 9, 11)), white("glint." + nm, M(_star(-2, 3, 6.5, 1.7), False), z + 0.1),
              white("glint." + nm + ".2", E(3.5, -4.5, 1.6, 1.6, 8, False), z + 0.1)]
    elif state == "swirl":
        P.append(line("eye." + nm, M(_spiral(0, 0, 13, 1.75, 48), False), 2.4))
    return P


def _clip_line(pts, a, b):
    """The piece of line a->b inside the closed polygon pts (for the edge of an eyelid)."""
    hits = []
    for i in range(len(pts)):
        p, q = pts[i], pts[(i + 1) % len(pts)]
        d = (b[0] - a[0]) * (q[1] - p[1]) - (b[1] - a[1]) * (q[0] - p[0])
        if abs(d) < 1e-9: continue
        t = ((p[0] - a[0]) * (q[1] - p[1]) - (p[1] - a[1]) * (q[0] - p[0])) / d
        u = ((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / d
        if 0 <= u <= 1: hits.append(t)
    if len(hits) < 2: return [a, b]
    t0, t1 = min(hits), max(hits)
    return [(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0), (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1)]


BROW_SHAPES = {"normal": [(-12, -1), (0, 3), (12, 0)], "up": [(-12, 5), (0, 11), (12, 6)], "high": [(-12, 10), (0, 17), (12, 12)],
               "angry": [(-13, -6), (0, -1), (12, 6)], "sad": [(-12, 7), (0, 4), (12, -4)], "flat": [(-12, -4), (12, -4)]}


def brow_parts(F, side, state):
    nm = "LR"[side]; s = -1 if side == 0 else 1
    x, y = F.eyes[side]; k = F.bk; by = y + F.brow_dy * F.ek
    return [part("brow." + nm, [(x + s * dx * k, by + dy * k) for dx, dy in BROW_SHAPES[state]], None, z=F.z + 3, closed=False,
                 line=5.0 * k, shade=False, bone=F.eye_bone)]


def mouth_parts(F, state):
    mx, my = F.mouth; k = F.mk; z = F.z; bone = F.mouth_bone
    T = lambda pts: [(mx + dx * k, my + dy * k) for dx, dy in pts]
    fill = lambda nm, pts, col, zz=z: part(nm, T(pts), col, z=zz, line=0, shade=False, bone=bone)
    def line(nm, pts, lw=3.8):
        p = part(nm, T(pts), None, z=z + 0.5, closed=False, line=lw * max(k, 0.8), shade=False, bone=bone); p["line_col"] = F.mouth_line; return p
    teeth = lambda nm, pts: part(nm, T(pts), C["teeth"], z=z + 0.2, line=0, shade=False, smooth=False, bone=bone)
    rim = lambda pts: [_rim("mouth.rim", T(pts), z + 0.4, bone, 2.6 * max(k, 0.8))] if F.outlined else []
    P = []
    if state == "flat": P.append(line("mouth", [(-14, 0), (14, 1)]))
    elif state == "smile":
        m = [(-22, 10), (22, 10), (16, -2), (0, -8), (-16, -2)]
        P += [fill("mouth", m, C["mouth"]), teeth("teeth", [(-19, 9), (19, 9), (16, 4), (-16, 4)]),
              fill("tongue", ellipse(2, -4, 9, 4, 10), C["tongue"], z + 0.1)] + rim(S.catmull(m, True, 6))
    elif state == "talk":
        m = [(-17, 10), (17, 10), (14, -6), (0, -14), (-14, -6)]
        P += [fill("mouth", m, C["mouth"]), teeth("teeth", [(-15, 9), (15, 9), (13, 4), (-13, 4)]),
              fill("tongue", ellipse(2, -7, 8, 4, 10), C["tongue"], z + 0.1)] + rim(S.catmull(m, True, 6))
    elif state == "o":
        m = ellipse(0, 0, 9, 12, 12); P += [fill("mouth", m, C["mouth"])] + rim(m)
    elif state == "laugh":
        m = [(-30, 12), (30, 12), (24, -10), (0, -26), (-24, -10)]
        P += [fill("mouth", m, C["mouth"]), teeth("teeth", [(-27, 11), (27, 11), (24, 4), (-24, 4)]),
              fill("tongue", ellipse(3, -15, 13, 6, 12), C["tongue"], z + 0.1)] + rim(S.catmull(m, True, 6))
    elif state == "shout":
        m = [(-25, 8), (-10, 13), (10, 13), (25, 8), (20, -16), (0, -21), (-20, -16)]
        P += [fill("mouth", m, C["mouth"]), teeth("teeth", [(-20, 11), (20, 11), (18, 5), (-18, 5)]),
              teeth("teeth.b", [(-15, -14), (15, -14), (13, -9), (-13, -9)]), fill("tongue", ellipse(0, -8, 9, 3.5, 10), C["tongue"], z + 0.1)]
        P += rim(S.catmull(m, True, 6))
    elif state == "gasp":
        m = ellipse(0, -4, 11, 17, 14); P += [fill("mouth", m, C["mouth"]), fill("tongue", ellipse(0, -15, 7, 4, 10), C["tongue"], z + 0.1)] + rim(m)
    elif state == "frown": P.append(line("mouth", arc(0, -16, 17, 12, 30, 150, 8), 4.2))
    elif state == "wavy": P.append(line("mouth", [(-20, 0), (-13, 4), (-7, -3), (0, 4), (7, -3), (13, 4), (20, 0)], 3.6))
    elif state == "smirk": P.append(line("mouth", [(-16, 2), (0, -1), (15, 5), (19, 10)]))
    elif state == "side": P.append(line("mouth", [(-4, -1), (16, 3)]))
    elif state == "disgust":
        m = [(-20, 2), (-8, 5), (8, 3), (20, -6), (6, -6), (-8, -3)]
        P += [fill("mouth", m, C["mouth"]), fill("tongue", ellipse(9, -12, 7, 9, 12), C["tongue"], z + 0.3)] + rim(S.catmull(m, True, 6))
        if F.outlined: P.append(_rim("tongue.rim", T(ellipse(9, -12, 7, 9, 12)), z + 0.4, bone, 2.4))
    return P


def fx_parts(F, name):
    """Effects drawn over the face. People get an explicit ink rim; outlined mascots get it from the drawing."""
    z = F.z + 6; bone = F.eye_bone
    rim = (lambda nm, pts: [_rim(nm + ".rim", pts, z + 0.1, bone, 2.6)]) if not F.outlined else (lambda nm, pts: [])
    P = []
    if name == "sweat" and F.sweat:
        x, y = F.sweat; d = [(x + dx, y + dy) for dx, dy in [(0, 20), (9, 3), (10, -6), (5, -13), (-5, -13), (-10, -6), (-9, 3)]]
        P += [part("fx.sweat", d, FX["sweat"], z=z, line=2.6, shade=False, bone=bone),
              part("fx.sweat.glint", ellipse(x - 3, y - 4, 2.2, 3.4, 8), C["white"], z=z + 0.2, line=0, shade=False, bone=bone)] + rim("fx.sweat", S.catmull(d, True, 6))
    elif name == "vein" and F.vein:
        x, y = F.vein
        for sx, sy in ((1, 1), (-1, 1), (-1, -1), (1, -1)):
            th = math.degrees(math.atan2(-sy, -sx))
            P.append(part("fx.vein.%d%d" % (sx + 1, sy + 1), arc(x + sx * 24, y + sy * 24, 19, 19, th - 27, th + 27, 7), None, z=z, closed=False,
                          line=5.2, shade=False, bone=bone))
    elif name == "tears":
        for side in (0, 1):
            x, y = F.eyes[side]; k = F.ek * (1.6 if F.style == "whites" else 1)
            t = [(x + dx * k, y + dy * k) for dx, dy in [(-5, -8), (5, -8), (6, -38), (0, -48), (-6, -38)]]
            P += [part("fx.tear." + "LR"[side], t, FX["tear"], z=z, line=2.4, shade=False, bone=bone, alpha=0.92)] + rim("fx.tear." + "LR"[side], S.catmull(t, True, 6))
    elif name == "blush":
        for i, (x, y) in enumerate(F.blush):
            P.append(part("fx.blush.%d" % i, ellipse(x, y, 17, 10, 12), FX["blush"], z=z - 3, line=0, shade=False, bone=bone, alpha=0.6))
            for j in (-1, 0, 1):
                P.append(part("fx.hatch.%d%d" % (i, j + 1), [(x + j * 8 - 4, y - 5), (x + j * 8 + 4, y + 5)], None, z=z - 2.9, closed=False, line=2.2, shade=False, bone=bone))
    elif name == "question" and F.question:
        x, y = F.question
        q = [(x + dx, y + dy) for dx, dy in arc(0, 12, 11, 11, 160, -40, 9)] + [(x, y - 2), (x, y - 8)]
        P += [part("fx.question", q, None, z=z, closed=False, line=5.0, shade=False, bone=bone),
              part("fx.question.dot", ellipse(x, y - 17, 3.4, 3.4, 8), INK, z=z, line=0, shade=False, bone=bone)]
    for p in P:  # effect colours for line-only effects
        if p["name"].startswith("fx.vein"): p["line_col"] = FX["vein"]
        if p["name"].startswith("fx.hatch"): p["line_col"] = FX["hatch"]
    return P


# ------------------------------------------------------------------ pixel kit (Claude)
PX = 15  # one pixel block of the face; the logo's eye cell (30x60) = 2x4 blocks
PIX_EYES = {  # right eye; X ink, W white. Left eye = mirrored.
    "open": ["XX"] * 4, "happy": [".X.", "X.X"], "closed": ["XXX"], "lids": ["XX"] * 2,
    "squeeze": ["..X", ".X.", "X..", ".X.", "..X"], "angry": ["..X", ".XX", "XXX", "XXX"], "sad": ["X..", "XX.", "XXX", "XXX"],
    "wide": ["XXX", "XWX", "XXX", "XXX", "XXX"], "tiny": ["XXXXX", "XWWWX", "XWXWX", "XWWWX", "XXXXX"],
    "look": [".XX", ".XX", "...", "..."], "sparkle": [".X.", "XWX", ".X."], "swirl": ["XXXXX", "....X", "XXX.X", "X...X", "XXXXX"],
}
PIX_EYE_DY = {"closed": -15, "lids": -15}  # where the shape sits in the eye cell
PIX_BROWS = {"normal": (["XXX"], 0), "up": (["XXX"], 8), "high": (["XXX"], 15), "angry": (["..X", "XX."], 0), "sad": (["X..", ".XX"], 0),
             "flat": (["XXX"], -10)}
PIX_MOUTHS = {
    "flat": ["XXXX"], "smile": ["X..X", ".XX."], "talk": ["XXXX", "XMMX", "XXXX"], "o": ["XXX", "XMX", "XXX"],
    "laugh": ["XXXXX", "XWWWX", "XMPMX", ".XXX."], "shout": ["XXXXX", "XWWWX", "XMMMX", "XWWWX", "XXXXX"],
    "gasp": ["XXX", "XMX", "XMX", "XXX"], "frown": [".XX.", "X..X"], "wavy": ["X.X.X", ".X.X."],
    "smirk": ["...X", "XXX."], "side": ["..XX"], "disgust": ["XXXX", "XMMX", "XXPX", "..P."],
}
PIX_COL = {"X": INK, "W": C["white"], "M": C["mouth"], "P": C["tongue"], "B": FX["tear"], "S": FX["sweat"], "R": FX["vein"], "K": FX["blush"]}


def pixel_parts(name, rows, cx, cy, z, bone, mirror=False, block=PX, alpha=1.0):
    """A pixel picture centred at (cx, cy) as rectangles: one per run of same-colour pixels in a row, runs that
    repeat on the next rows merged into one tall block. Blocks overlap by a hair so no seam shows."""
    if mirror: rows = [r[::-1] for r in rows]
    h, w = len(rows), max(len(r) for r in rows); rows = [r.ljust(w, ".") for r in rows]
    ox, oy = cx - w * block / 2, cy + h * block / 2
    runs = {}  # (colour, x0, x1) -> list of row indices
    for r, row in enumerate(rows):
        c0 = 0
        while c0 < w:
            ch = row[c0]; c1 = c0
            while c1 + 1 < w and row[c1 + 1] == ch: c1 += 1
            if ch in PIX_COL: runs.setdefault((ch, c0, c1), []).append(r)
            c0 = c1 + 1
    P = []; e = 0.4
    for (ch, c0, c1), rs in sorted(runs.items(), key=lambda kv: "XWMPBSRK".index(kv[0][0])):
        groups = [[rs[0]]]
        for r in rs[1:]:
            if r == groups[-1][-1] + 1: groups[-1].append(r)
            else: groups.append([r])
        for g in groups:
            x1, x2 = ox + c0 * block - e, ox + (c1 + 1) * block + e
            y2, y1 = oy - g[0] * block + e, oy - (g[-1] + 1) * block - e
            P.append(part("%s.%s%d" % (name, ch, len(P)), [(x1, y1), (x2, y1), (x2, y2), (x1, y2)], PIX_COL[ch],
                          z=z + 0.01 * "XWMPBSRK".index(ch), line=0, shade=False, smooth=False, bone=bone, alpha=alpha))
    return P


def _bbox(L):
    return (min(p[0] for p in L), min(p[1] for p in L), max(p[0] for p in L), max(p[1] for p in L))


def _inside(a, b):
    return a[0] >= b[0] and a[1] >= b[1] and a[2] <= b[2] and a[3] <= b[3] and a != b


CLAUDE_EYES = [(-105, 210), (105, 210)]


def claude_face(eyes, brows, mouth, fx):
    P = []
    for side in (0, 1):
        e = eyes[side] if isinstance(eyes, tuple) else eyes
        b = brows[side] if isinstance(brows, tuple) else brows
        x, y = CLAUDE_EYES[side]
        P += pixel_parts("eye." + "LR"[side], PIX_EYES[e], x, y + PIX_EYE_DY.get(e, 0), 3, "head", mirror=side == 0)
        rows, dy = PIX_BROWS[b]
        P += pixel_parts("brow." + "LR"[side], rows, x, 268 + dy, 3, "head", mirror=side == 0)
    P += pixel_parts("mouth", PIX_MOUTHS[mouth], 0, 120, 3, "head")
    for f in fx:
        if f == "sweat": P += pixel_parts("fx.sweat", ["..S..", ".SSS.", "SSSSS", "SSSSS", ".SSS."], 300, 300, 6, "head", block=10)
        if f == "vein": P += pixel_parts("fx.vein", ["RR.RR", "R...R", ".....", "R...R", "RR.RR"], 250, 350, 6, "head", block=10)
        if f == "question": P += pixel_parts("fx.question", [".XXX.", "X...X", "....X", "..XX.", "..X..", ".....", "..X.."], 320, 360, 6, "head", block=10)
        if f == "blush":
            for x in (-165, 165): P += pixel_parts("fx.blush%d" % x, ["KKK"], x, 150, 2.5, "head", alpha=0.7)
        if f == "tears":
            for x, _ in CLAUDE_EYES: P += pixel_parts("fx.tear%d" % x, ["B"] * 5 + [".", "B"], x, 138, 6, "head", alpha=0.95, block=10)
    return P


# ------------------------------------------------------------------ one expression
def face_parts(who, expr):
    _, eyes, brows, mouth, fx = EXPR[expr]
    if who == "claude": return claude_face(eyes, brows, mouth, fx)
    F = FACES[who]; P = []
    for side in (0, 1):
        P += eye_parts(F, side, eyes[side] if isinstance(eyes, tuple) else eyes)
        P += brow_parts(F, side, brows[side] if isinstance(brows, tuple) else brows)
    P += mouth_parts(F, mouth)
    for f in fx: P += fx_parts(F, f)
    return P


def eyes_only(who, state):
    """Both eyes in one state (a blink = "closed")."""
    if who == "claude":
        P = []
        for side in (0, 1):
            x, y = CLAUDE_EYES[side]
            P += pixel_parts("eye." + "LR"[side], PIX_EYES[state], x, y + PIX_EYE_DY.get(state, 0), 3, "head", mirror=side == 0)
        return P
    F = FACES[who]
    return eye_parts(F, 0, state) + eye_parts(F, 1, state)


def mouth_only(who, state):
    if who == "claude": return pixel_parts("mouth", PIX_MOUTHS[state], 0, 120, 3, "head")
    return mouth_parts(FACES[who], state)


FACE_PREFIX = ("mouth", "teeth", "tongue", "eye.", "eyew.", "glint.", "lid.", "brow.", "face")


def base_parts(who, knot=None):
    """The character without its face features (the face kit adds them)."""
    keep = lambda p: not (p["name"] == "face" or p["name"].startswith(FACE_PREFIX))
    if who == "host": P = S.host("stand", "smile", "open", "normal")
    elif who == "friend": P = S.friend("stand", "smirk", "open")
    elif who == "claude": P = S.claude_mascot("stand", "open")
    elif who == "deepseek": P = S.deepseek_mascot("stand", "open")
    elif who == "gpt":
        P = S.gpt_mascot("stand", "open", knot)
        P = [p for p in P if keep(p)] + [part("face", ellipse(0, 244, 84, 70, 18), "#ececec", z=4, line=4.5, shade=False, bone="head")]  # bigger: room for a mouth
        return P
    return [p for p in P if keep(p)]
