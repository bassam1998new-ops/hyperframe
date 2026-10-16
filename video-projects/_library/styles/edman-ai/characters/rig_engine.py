"""Cut-out rig engine for the ادمان الAI characters (Blender 5.2 Grease Pencil).

A character is a Spec: bones, parts (each bound 100% to one bone = a paper cut-out joint), swap groups
(mouth, eyes, brows, hands: only one state visible), poses and a test timeline.
- simulate(): timeline -> per-frame bone values. Each bone chases its target with a damped spring in world
  space (children lag and overshoot = follow-through), legs use 2-bone IK so the feet stay planted, danglers
  (hood strings) are pendulums driven by the chest's movement, hops add squash and stretch.
- build(): draws the character (gp_draw), builds the armature, binds, keys everything on twos with constant
  interpolation (12 drawings/s like the reference).
The simulation is pure Python; only build() needs Blender.
"""
import math

FPS = 24
K = 0.001  # sheet units -> metres


def ang(a, b):
    return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


def wrap(a):
    return (a + 180) % 360 - 180


def ease(x):
    x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)


def rot_about(pts, c, th):
    cs, sn = math.cos(th), math.sin(th)
    return [(c[0] + (x - c[0]) * cs - (y - c[1]) * sn, c[1] + (x - c[0]) * sn + (y - c[1]) * cs) for x, y in pts]


class Spec:
    DEFAULTS = dict(spring={}, poses=None, timeline=None, move=0.42, swaps=(), talk=(), flaps=(), jaw={}, legs=None,
                    danglers=(), hops=(), squash=False, tilt_k=0.0, upright=0.7, dip=0.0, idle={}, lines=False,
                    no_inherit_scale=(), seconds=7.0, quant={})

    def __init__(self, name, bones, parts, **kw):
        self.name, self.bones, self.parts = name, bones, parts
        self.parent = {b[0]: b[3] for b in bones}
        self.rest = {b[0]: ang(b[1], b[2]) for b in bones}
        self.joint = {b[0]: b[1] for b in bones}
        for k, v in self.DEFAULTS.items(): setattr(self, k, kw.pop(k, v))
        if kw: raise TypeError("unknown spec keys: %s" % sorted(kw))
        self.poses = self.poses or {"rest": {}}
        self.timeline = self.timeline or [(0.0, "rest")]

    def face(self, t, expr, mouth=None):
        """From time t the whole face shows one expression of faces.py (eyes, brows, mouth, effects).
        mouth overrides the expression's mouth; talk ranges still flap the mouth on top."""
        import faces as FK
        m = mouth or FK.EXPR[expr][3]
        self.swaps = list(self.swaps) + [(t, "eyes", expr), (t, "brows", expr), (t, "mouth", m), (t, "fx", expr), (t, "expr", expr)]
        return self

    def blink(self, t, dur=0.1):
        """Eyes shut for dur seconds, then back to the expression showing at t."""
        cur = "neutral"
        for tk, g, v in sorted(self.swaps, key=lambda e: e[0]):
            if g == "expr" and tk <= t + 1e-6: cur = v
        self.swaps = list(self.swaps) + [(t, "eyes", "closed"), (t + dur, "eyes", cur)]
        return self

    def arm(self, side, up=None, fore=None, upper="upper_arm", lower="forearm"):
        """Pose angles from world directions (deg, CCW from +x) given for the R side; the L side is mirrored."""
        m = (lambda a: a) if side == "R" else (lambda a: 180 - a)
        return self._arm(side, None if up is None else m(up), None if fore is None else m(fore), upper, lower)

    def arm_pts(self, side, el, wr):
        """Pose angles so the elbow / wrist land on these points (actual coordinates for that side)."""
        sh = self.joint["upper_arm." + side]
        return self._arm(side, ang(sh, el), ang(el, wr), "upper_arm", "forearm")

    def _arm(self, side, up, fore, upper, lower):
        out = {}; du = 0.0
        if up is not None:
            du = wrap(up - self.rest[upper + "." + side]); out[upper + "." + side] = du
        if fore is not None:
            out[lower + "." + side] = wrap(wrap(fore - self.rest[lower + "." + side]) - du)
        return out


# ------------------------------------------------------------------ targets
def target_at(spec, t):
    """Local target per bone at time t: eased pose-to-pose with a small wind-up, idle motion, hops."""
    tl = spec.timeline
    prev = tl[0][1]; out = dict(spec.poses[prev])
    for e in tl[1:]:
        tk, pose = e[0], e[1]; mv = e[2] if len(e) > 2 else spec.move
        if t < tk - mv: break
        a, b = spec.poses[prev], spec.poses[pose]
        u = (t - (tk - mv)) / mv
        antic = -0.12 * math.sin(math.pi * min(1, max(0, u / 0.35))) if u < 0.35 else 0  # wind-up before the move
        w = ease(u) + antic
        out = {k: a.get(k, 0) + (b.get(k, 0) - a.get(k, 0)) * w for k in set(a) | set(b)}
        if t >= tk: out = dict(b)
        if u < 1 and spec.dip: out["_dip"] = -spec.dip * math.sin(math.pi * u)  # sink on the knees as the weight moves
        prev = pose
    for k, (amp, per, ph) in spec.idle.items():  # breathing, sway: always on
        out[k] = out.get(k, 0) + amp * math.sin(2 * math.pi * t / per + ph)
    for t0, h in spec.hops:  # crouch -> stretch up -> squash on landing (the spring makes it wobble)
        air = 0.3 + h / 1500
        if t0 - 0.14 <= t < t0:
            out["_sq"] = 0.84; out["_dip"] = out.get("_dip", 0) - 12
        elif t0 <= t < t0 + air:
            u = (t - t0) / air; out["_lift"] = 4 * h * u * (1 - u); out["_sq"] = 1.14 if u < 0.45 else 1.03
        elif t0 + air <= t < t0 + air + 0.1:
            out["_sq"] = 0.8
    return out


def state_at(spec, t):
    st = {}
    for tk, g, v in sorted(spec.swaps, key=lambda e: e[0]):
        if tk <= t + 1e-6: st[g] = v
    for a, b in spec.talk:
        if a <= t < b:
            st["mouth"] = spec.flaps[int((t - a) * 6) % len(spec.flaps)]  # a new mouth every ~4 frames
    return st


# ------------------------------------------------------------------ physics
def spring(st, key, tgt, k, z, dt):
    x, v = st.get(key, (tgt, 0.0))
    v += (k * (tgt - x) - 2 * z * math.sqrt(k) * v) * dt; x += v * dt
    st[key] = (x, v); return x


def leg_ik(spec, side, dx, dy, tilt):
    """2-bone IK in the picture plane: the ankle stays planted while the hips move.
    Front view: a bent knee goes mostly toward the camera, so only knee_out of the bend shows sideways and the
    rest shows as foreshortening (bone scale along its length). Returns world angle deltas + scales."""
    L = spec.legs
    sg = -1 if side == "L" else 1
    th = math.radians(tilt)
    px, py = L["pivot"]; hx, hy = sg * L["hip"][0] - px, L["hip"][1] - py
    H = (px + hx * math.cos(th) - hy * math.sin(th) + dx, py + hx * math.sin(th) + hy * math.cos(th) + dy)
    hip0, knee0 = (sg * L["hip"][0], L["hip"][1]), (sg * L["knee"][0], L["knee"][1])
    A = (sg * L["ankle"][0], L["ankle"][1])
    L1, L2 = math.dist(hip0, knee0), math.dist(knee0, A)
    dd = math.dist(H, A); d = min(dd, L1 + L2 - 1e-6)
    alpha = math.acos(max(-1, min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))))
    base = math.atan2(A[1] - H[1], A[0] - H[0])
    ta = base + (alpha if sg > 0 else -alpha)  # knees bow outward
    Kp = (H[0] + L1 * math.cos(ta), H[1] + L1 * math.sin(ta))
    u = ((A[0] - H[0]) / dd, (A[1] - H[1]) / dd)
    along = (Kp[0] - H[0]) * u[0] + (Kp[1] - H[1]) * u[1]
    if dd > L1 + L2: along = dd * L1 / (L1 + L2)  # over-reach: stretch a hair instead of sliding the foot
    F = (H[0] + u[0] * along, H[1] + u[1] * along)
    ko = L.get("knee_out", 0.25)
    Kq = (F[0] + ko * (Kp[0] - F[0]), F[1] + ko * (Kp[1] - F[1]))
    ta2 = math.atan2(Kq[1] - H[1], Kq[0] - H[0]); sa = math.atan2(A[1] - Kq[1], A[0] - Kq[0])
    return (math.degrees(ta2) - spec.rest["thigh." + side], math.degrees(sa) - spec.rest["shin." + side],
            math.dist(H, Kq) / L1, math.dist(Kq, A) / L2)


def simulate(spec):
    """Per frame (24 fps): local angle per bone (deg) + hips offset, hop lift, squash, leg scales."""
    names = [b[0] for b in spec.bones]
    legb = {p + s for p in ("thigh.", "shin.", "foot.") for s in "LR"} if spec.legs else set()
    dang = {d["bone"]: d for d in spec.danglers}
    st = {}; prev = {}; frames = []; dt = 1 / 480; t = 0.0; nxt = 0.0
    while t <= spec.seconds + 1e-9:
        loc = target_at(spec, t)
        dx = spring(st, "_dx", loc.get("_shift", 0), 90, 0.8, dt)
        dy = spring(st, "_dy", loc.get("_dip", 0), 160, 0.7, dt)
        sq = spring(st, "_sq", loc.get("_sq", 1.0), 520, 0.22, dt) if spec.squash else 1.0
        tilt = spec.tilt_k * dx  # the hip over the standing leg rises
        W = {}
        for n in names:
            if n in legb or n in dang: continue
            par = spec.parent[n]; base = W[par] if par else 0.0
            if n == "hips": W[n] = base + tilt; continue
            tgt = base + loc.get(n, 0) - (spec.upright * tilt if n == "spine" else 0)  # upper body stays upright
            W[n] = spring(st, n, tgt, *spec.spring[n], dt) if n in spec.spring else tgt
        scale = {}
        if spec.legs:
            for s in "LR":
                W["thigh." + s], W["shin." + s], scale["thigh." + s], scale["shin." + s] = leg_ik(spec, s, dx, dy, tilt)
                W["foot." + s] = 0.0  # feet stay flat on the floor
        for n, d in dang.items():  # pendulums: hang down, swing when the anchor accelerates sideways
            x = dx - d["r"] * math.sin(math.radians(W[d.get("anchor", "spine")]))
            px, pv = prev.get(n, (x, 0.0)); v = (x - px) / dt; acc = (v - pv) / dt; prev[n] = (x, v)
            th, om = st.get("pend:" + n, (0.0, 0.0))
            om += (-d["k"] * th - 2 * d["z"] * math.sqrt(d["k"]) * om - acc * d["gain"]) * dt; th += om * dt
            st["pend:" + n] = (th, om); W[n] = math.degrees(th)
        if t >= nxt - 1e-9:
            fr = {n: W[n] - (W[spec.parent[n]] if spec.parent[n] else 0) for n in names}
            fr.update(_dx=dx, _dy=dy, _sq=sq, _lift=loc.get("_lift", 0.0))
            for k, v in loc.items():  # "bone@x" / "bone@y": a bone slides instead of turning (pixel characters step)
                if "@" in k:
                    q = spec.quant.get(k.split("@")[0]); fr[k] = round(v / q) * q if q else v
            for k, v in scale.items(): fr["_sc." + k] = v
            frames.append(fr); nxt += 1 / FPS
        t += dt
    return frames


# ------------------------------------------------------------------ Blender
def build(spec, x0=0.0):
    """Draw + rig + animate one character at x0 (sheet units). Returns the number of frames."""
    import bpy
    from mathutils import Vector, Quaternion
    import gp_draw as G
    sc = bpy.context.scene
    layers = {}
    names = [P["name"] for P in spec.parts]
    dup = {n for n in names if names.count(n) > 1}
    assert not dup, "part names must be unique (a duplicate would miss its bone and its swap): %s" % sorted(dup)[:5]
    bones = {b[0] for b in spec.bones}
    lost = {P["bone"] for P in spec.parts} - bones
    assert not lost, "parts bound to missing bones: %s" % sorted(lost)
    share = {}
    for P in spec.parts:
        if P.get("layer"): share.setdefault(P["layer"], set()).add(P["bone"])
    mixed = {k: v for k, v in share.items() if len(v) > 1}
    assert not mixed, "a shared layer must sit on one bone: %s" % list(mixed.items())[:3]
    ob = G.draw_character(spec.name, spec.parts, x0, lines=spec.lines, layers_out=layers)
    ad = bpy.data.armatures.new(spec.name + "-rig"); arm = bpy.data.objects.new(spec.name + "-rig", ad)
    sc.collection.objects.link(arm); arm.location = (x0 * K, 0, 0)
    for o in sc.objects: o.select_set(False)
    bpy.context.view_layer.objects.active = arm; arm.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    kids = ("shin.", "foot.") if spec.legs else ()
    for n, h, t, par in spec.bones:
        eb = ad.edit_bones.new(n); eb.head = (h[0] * K, 0, h[1] * K); eb.tail = (t[0] * K, 0, t[1] * K); eb.roll = 0
        if par: eb.parent = ad.edit_bones[par]
        if (kids and n.startswith(kids)) or n in spec.no_inherit_scale: eb.inherit_scale = "NONE"  # keeps its own shape
    bpy.ops.object.mode_set(mode="OBJECT")
    # bind: every layer of a part -> its bone, weight 1
    for b in spec.bones: ob.vertex_groups.new(name=b[0])
    for P in spec.parts:
        for L in layers.get(P["name"], []):
            for fr in L.frames:
                d = fr.drawing; n = sum(len(s.points) for s in d.strokes)
                d.set_vertex_weights(vertex_group_name=P["bone"], indices=list(range(n)), weights=[1.0] * n, assign_mode="REPLACE")
    mod = ob.modifiers.new("rig", "GREASE_PENCIL_ARMATURE"); mod.object = arm
    # motion, on twos
    frames = simulate(spec); nf = len(frames)
    PB = arm.pose.bones
    axis = {}
    for pb in PB:
        pb.rotation_mode = "QUATERNION"
        axis[pb.name] = (pb.bone.matrix_local.to_3x3().inverted() @ Vector((0, -1, 0))).normalized()  # screen CCW
    to_local = lambda name, v: PB[name].bone.matrix_local.to_3x3().inverted() @ v

    def key(pb, path, f):
        pb.keyframe_insert(path, frame=f)
    for f in range(0, nf, 2):
        fr = frames[f]; kf = f + 1
        for pb in PB:
            pb.rotation_quaternion = Quaternion(axis[pb.name], math.radians(fr[pb.name])); key(pb, "rotation_quaternion", kf)
        if "hips" in PB:
            PB["hips"].location = to_local("hips", Vector((fr["_dx"] * K, 0, fr["_dy"] * K))); key(PB["hips"], "location", kf)
        if spec.hops and "root" in PB:
            PB["root"].location = to_local("root", Vector((0, 0, fr["_lift"] * K))); key(PB["root"], "location", kf)
        if spec.squash:
            w = 1 / math.sqrt(fr["_sq"]); PB["spine"].scale = (w, fr["_sq"], w); key(PB["spine"], "scale", kf)
        if spec.jaw and "jaw" in PB:  # the jaw stretches down from its pivot under the nose: the chin drops
            PB["jaw"].scale = (1, spec.jaw.get(state_at(spec, f / FPS).get("mouth"), 1.0), 1); key(PB["jaw"], "scale", kf)
        for b in {k.split("@")[0] for k in fr if "@" in k}:
            PB[b].location = to_local(b, Vector((fr.get(b + "@x", 0) * K, 0, fr.get(b + "@y", 0) * K))); key(PB[b], "location", kf)
        for k in fr:
            if k.startswith("_sc."):
                pb = PB[k[4:]]; pb.scale = (1, fr[k], 1); key(pb, "scale", kf)
    # swaps: one visible state per group
    group_layers = {}
    for P in spec.parts:
        if "group" in P:
            Ls = group_layers.setdefault(P["group"], [])
            Ls += [L for L in layers.get(P["name"], []) if all(L is not M for M in Ls)]
    last = {}
    for f in range(nf):
        st = state_at(spec, f / FPS)
        for g, Ls in group_layers.items():
            gname, val = g.split(":")
            vis = st.get(gname) == val
            if last.get(g) != vis:
                for L in Ls:
                    L.hide = not vis; L.keyframe_insert("hide", frame=f + 1)
                last[g] = vis
    return nf
