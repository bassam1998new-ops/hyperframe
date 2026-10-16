"""Grease Pencil drawing helpers shared by build_sheet.py and build_rig.py (Blender 5.2).

Each part = its own layer (fill), a shade layer masked by it (cel shadow + gloss), then its ink line on top.
"""
import bpy, os, math, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shapes as S

K = 0.001  # px -> metres
LIGHT = (-0.55, 0.83)  # light from top-left
SHADOW_TINT = "#2b1d55"


def lin(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def mixhex(a, b, t):
    a = a.lstrip("#"); b = b.lstrip("#")
    ca = [int(a[i:i + 2], 16) for i in (0, 2, 4)]; cb = [int(b[i:i + 2], 16) for i in (0, 2, 4)]
    return "#" + "".join("%02x" % round(x + (y - x) * t) for x, y in zip(ca, cb))


MATS = {}


def mat(key, stroke=None, fill=None, alpha=1.0):
    k = (key, stroke, fill, alpha)
    if k in MATS:
        return MATS[k]
    m = bpy.data.materials.new("m_%d" % len(MATS)); bpy.data.materials.create_gpencil_data(m)
    g = m.grease_pencil
    m.node_tree.nodes.clear()  # Blender 5.2: an empty node tree = classic flat Grease Pencil shading
    g.show_stroke = stroke is not None; g.show_fill = fill is not None
    if stroke: g.color = lin(stroke) + [alpha]
    if fill:
        g.fill_color = lin(fill) + [alpha]
        if not stroke: g.color = lin(fill) + [alpha]  # the fill's own edge = same colour
    MATS[k] = m
    return m


def scene_setup():
    sc = bpy.context.scene
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    sc.render.engine = "BLENDER_EEVEE"
    sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
    sc.render.film_transparent = False
    sc.world = sc.world or bpy.data.worlds.new("w")
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = lin(os.environ.get("SHEET_BG", "#ece6dc")) + [1]; bg.inputs[1].default_value = 1.0
    sc.render.resolution_x, sc.render.resolution_y = 3600, 1000
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    return sc


def add_gp(name, x0):
    gpd = bpy.data.grease_pencils.new(name)
    gpd.stroke_depth_order = "2D"
    ob = bpy.data.objects.new(name, gpd)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = (x0 * K, 0, 0); ob.rotation_euler = (math.pi / 2, 0, 0)
    return ob


def normals(pts, closed=True):
    n = len(pts); out = []
    area = sum(pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1] for i in range(n)) if closed else 1
    sgn = 1 if area > 0 else -1  # outward normal for CCW
    for i in range(n):
        a = pts[i - 1] if (closed or i > 0) else pts[i]
        b = pts[(i + 1) % n] if (closed or i < n - 1) else pts[i]
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1
        out.append((sgn * dy / L, -sgn * dx / L))
    return out


FILL_ID = 0


def stroke(layer, pts, m_index, radius, closed=True, radii=None, opacity=1.0, fill=False):
    fr = layer.frames[0] if len(layer.frames) else layer.frames.new(1)
    d = fr.drawing
    d.add_strokes([len(pts)])
    s = d.strokes[len(d.strokes) - 1]
    s.cyclic = closed; s.material_index = m_index
    s.start_cap = 0; s.end_cap = 0
    s.fill_opacity = 1.0
    global FILL_ID
    if fill: FILL_ID += 1; s.fill_id = FILL_ID  # 5.2 only fills strokes that carry a fill id
    for i, (p, q) in enumerate(zip(s.points, pts)):
        p.position = (q[0] * K, q[1] * K, 0)
        p.radius = (radii[i] if radii else radius) * K
        p.opacity = opacity
    d.tag_positions_changed()
    return s


def mat_index(ob, m):
    for i, slot in enumerate(ob.data.materials):
        if slot == m: return i
    ob.data.materials.append(m); return len(ob.data.materials) - 1


def bbox(pts):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def draw_character(name, parts, x0, lines=True, layers_out=None):
    """Draw parts as layers; layers_out[part name] = [its layers] (for rigging and swaps).
    Parts with the same P["layer"] share one fill layer and one line layer (one swap state of a face feature):
    Blender ignores layer masks past layer 256, so a rig must stay well under that."""
    ob = add_gp(name, x0)
    gpd = ob.data
    shared = {}
    for P in sorted(parts, key=lambda p: p["z"]):
        pts = S.catmull(P["pts"], P["closed"], 8) if P["smooth"] else list(P["pts"])
        if not P["closed"] and not P["smooth"]:
            pts = S.catmull(P["pts"], False, 8) if len(P["pts"]) > 2 else pts
        key = P.get("layer")
        assert not (key and (P["shade"] or P["gloss"])), "shared layers carry no shading: " + P["name"]
        if key and key in shared: base = shared[key]["base"]
        else:
            base = gpd.layers.new(key or P["name"]); base.use_lights = False
            if key: shared[key] = {"base": base}
        mine = [base]
        if layers_out is not None: layers_out[P["name"]] = mine
        if P["fill"] and P["closed"]:
            stroke(base, pts, mat_index(ob, mat("f", None, P["fill"], P.get("alpha", 1.0))), 0.6, fill=True)
            x1, y1, x2, y2 = bbox(pts); size = min(x2 - x1, y2 - y1)
            if P["shade"] or P["gloss"]:
                sh = gpd.layers.new(P["name"] + ".shade"); sh.use_lights = False; mine.append(sh)
                sh.use_masks = True; sh.mask_layers.add(base)
                if P["shade"]:
                    d = max(8, 0.12 * size)
                    # the cover hugs the part: Blender drops a layer mask when the mask layer is off camera (a face
                    # close-up crops the trousers away), and a big cover would then paint over the frame
                    m = d + 6
                    cover = [(x1 - m, y1 - m), (x2 + m, y1 - m), (x2 + m, y2 + m), (x1 - m, y2 + m)]
                    stroke(sh, cover, mat_index(ob, mat("f", None, mixhex(P["fill"], SHADOW_TINT, 0.32))), 0.6, fill=True)
                    lit = [(x + LIGHT[0] * d, y + LIGHT[1] * d) for x, y in pts]
                    stroke(sh, lit, mat_index(ob, mat("f", None, P["fill"])), 0.6, fill=True)
                if P["gloss"]:
                    nr = normals(pts)
                    # highlight band on the upper-right edge, like the reference's glossy head
                    gd = P.get("gdir", (0.75, 0.66))
                    ok = [n[0] * gd[0] + n[1] * gd[1] > 0.55 for n in nr]
                    idx, best, cur = [], [], []
                    for i in list(range(len(ok))) * 2:  # wrap around once
                        if ok[i]: cur.append(i)
                        else:
                            if len(cur) > len(best): best = cur
                            cur = []
                    if len(cur) > len(best): best = cur
                    idx = list(dict.fromkeys(best))[:len(ok)]
                    if len(idx) > 3:
                        inset = max(10, 0.07 * size)
                        run = [(pts[i][0] - nr[i][0] * inset, pts[i][1] - nr[i][1] * inset) for i in idx]
                        rr = [max(2.5, 0.022 * size) * math.sin(math.pi * (k + 0.5) / len(run)) for k in range(len(run))]
                        stroke(sh, run, mat_index(ob, mat("s", "#ffffff", None, 0.9)), 1, closed=False, radii=rr)
        if P["line"] > 0 and (lines or not P["closed"]):
            nr = normals(pts, P["closed"])
            rad = [P["line"] * (0.7 + 0.75 * max(0.0, -(n[0] * LIGHT[0] + n[1] * LIGHT[1]))) for n in nr] if P["closed"] else None
            ln = shared[key].get("line") if key else None
            if ln is None:
                ln = gpd.layers.new((key or P["name"]) + ".line"); ln.use_lights = False
                if key: shared[key]["line"] = ln
            mine.append(ln)
            st = stroke(ln, pts, mat_index(ob, mat("s", P.get("line_col", S.INK), None)), P["line"], closed=P["closed"], radii=rad)
            if not P["closed"]:
                st.start_cap = 0; st.end_cap = 0
    return ob


def label(text, x, y, size=46):
    cu = bpy.data.curves.new("t", "FONT"); cu.body = text; cu.size = size * K; cu.align_x = "CENTER"
    f = "C:/Windows/Fonts/segoeuib.ttf"
    if os.path.exists(f): cu.font = bpy.data.fonts.load(f)
    ob = bpy.data.objects.new("lbl", cu); bpy.context.scene.collection.objects.link(ob)
    ob.location = (x * K, 0, y * K); ob.rotation_euler = (math.pi / 2, 0, 0)
    m = bpy.data.materials.new("lblm"); m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    em = m.node_tree.nodes.new("ShaderNodeEmission"); em.inputs[0].default_value = lin("#4a3f6e") + [1]
    m.node_tree.links.new(em.outputs[0], m.node_tree.nodes["Material Output"].inputs[0])
    cu.materials.append(m)


def camera(cx, cz, width):
    cd = bpy.data.cameras.new("cam"); cd.type = "ORTHO"; cd.ortho_scale = width * K
    cam = bpy.data.objects.new("cam", cd); bpy.context.scene.collection.objects.link(cam)
    cam.location = (cx * K, -10, cz * K); cam.rotation_euler = (math.pi / 2, 0, 0)
    bpy.context.scene.camera = cam


def knot_loops():
    """OpenAI logo -> loops (y up), centred at (0, 250), ~300 wide."""
    import tempfile
    d = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "openai-knot.path")).read().strip()
    svg = os.path.join(tempfile.gettempdir(), "edman-knot.svg")
    open(svg, "w").write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="%s"/></svg>' % d)
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=svg)
    new = [o for o in bpy.data.objects if o not in before]
    loops = []
    for o in new:
        if o.type != "CURVE": continue
        mw = o.matrix_world
        for sp in o.data.splines:
            bp = sp.bezier_points; n = len(bp); L = []
            for k in range(n):
                a, b = bp[k], bp[(k + 1) % n]
                if k == n - 1 and not sp.use_cyclic_u: break
                for t in [j / 8 for j in range(8)]:
                    u = 1 - t
                    p = (u ** 3) * a.co + 3 * u * u * t * a.handle_right + 3 * u * t * t * b.handle_left + (t ** 3) * b.co
                    w = mw @ p
                    L.append((w.x, w.y))
            if len(L) > 3: loops.append(L)
    for o in new: bpy.data.objects.remove(o)
    xs = [p[0] for L in loops for p in L]; ys = [p[1] for L in loops for p in L]
    cx, cy, sz = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(max(xs) - min(xs), max(ys) - min(ys))
    k = 300 / sz
    return [[((x - cx) * k, (y - cy) * k + 250) for x, y in L] for L in loops]

