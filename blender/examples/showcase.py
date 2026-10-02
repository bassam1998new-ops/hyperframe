# Showcase: tests the free add-ons and assets in one Blender 5.0 render.
import bpy, addon_utils, math, os, sys, glob
LIB = os.environ.get("BLENDER_LIB", "/opt/blender-lib")
out = sys.argv[sys.argv.index("--")+1] if "--" in sys.argv else "/tmp/showcase.png"
bpy.ops.wm.read_factory_settings(use_empty=True)
for a in ("ant_landscape", "add_curve_sapling", "add_mesh_extra_objects"):
    addon_utils.enable(a, default_set=True)
s = bpy.context.scene
s.render.engine = "CYCLES"; s.cycles.samples = 48; s.cycles.use_denoising = True
s.render.resolution_x, s.render.resolution_y = 1080, 1350

# HDRI (CC0, bundled with Blender)
w = bpy.data.worlds.new("W"); s.world = w; w.use_nodes = True
env = w.node_tree.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(f"{LIB}/hdri/sunset.exr")
w.node_tree.links.new(env.outputs[0], w.node_tree.nodes["Background"].inputs[0])

# ANT Landscape add-on: terrain
bpy.ops.mesh.landscape_add(refresh=True, subdivision_x=128, subdivision_y=128, mesh_size_x=20, mesh_size_y=20, height=1.2)
land = bpy.context.object; land.location = (0, 6, -1.2)
lm = bpy.data.materials.new("Land"); lm.use_nodes = True
lm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.08, 0.12, 0.07, 1)
land.data.materials.append(lm)

# Sapling add-on: a tree
bpy.ops.curve.tree_add(do_update=True, bevel=True, levels=3, showLeaves=True, leaves=40)
tree = bpy.data.objects["tree"]  # sapling does not set the active object
tree.location = (-3.5, 6, -0.9); tree.scale = (0.3,) * 3

# Extra Objects add-on: a gear
bpy.ops.mesh.primitive_gear(number_of_teeth=14, radius=0.9, width=0.3)
g = bpy.context.object; g.location = (3, 1.5, 1.6); g.rotation_euler = (math.radians(80), 0, 0.3)
gm = bpy.data.materials.new("Gold"); gm.use_nodes = True
b = gm.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (1, 0.7, 0.2, 1); b.inputs["Metallic"].default_value = 1; b.inputs["Roughness"].default_value = 0.2
g.data.materials.append(gm)

# CC0 glTF model (Khronos sample): Lantern
bpy.ops.import_scene.gltf(filepath=f"{LIB}/gltf/Models/Lantern/glTF-Binary/Lantern.glb")
for o in bpy.context.selected_objects:
    if o.parent is None: o.location = (0.4, 3, -0.8); o.scale = (0.12,)*3

# CC0 Kenney model
kn = sorted(glob.glob(f"{LIB}/kenney/Starter-Kit-City-Builder/**/*.glb", recursive=True))
kfile = next((k for k in kn if "building" in k.lower()), kn[0])
bpy.ops.import_scene.gltf(filepath=kfile)
for o in bpy.context.selected_objects:
    if o.parent is None: o.location = (2.4, 4.5, -0.7); o.scale = (1.4,)*3

# Arabic 3D text: Blender has no Arabic shaping, so reshape + bidi first
import arabic_reshaper
from bidi.algorithm import get_display
txt = get_display(arabic_reshaper.reshape("ماتريكس"))
bpy.ops.object.text_add(location=(0, 0, 2.8), rotation=(math.radians(90), 0, 0))
t = bpy.context.object; t.data.body = txt; t.data.align_x = "CENTER"
t.data.font = bpy.data.fonts.load(glob.glob(f"{LIB}/gfonts/ofl/cairo/*.ttf")[0])
t.data.extrude = 0.08; t.data.bevel_depth = 0.01; t.data.size = 1.2
tm = bpy.data.materials.new("Neon"); tm.use_nodes = True
tb = tm.node_tree.nodes["Principled BSDF"]; tb.inputs["Base Color"].default_value = (0.1, 1, 0.5, 1)
tb.inputs["Emission Color"].default_value = (0.1, 1, 0.5, 1); tb.inputs["Emission Strength"].default_value = 3
t.data.materials.append(tm)

bpy.ops.object.camera_add(location=(0, -9, 2.2), rotation=(math.radians(84), 0, 0)); s.camera = bpy.context.object
s.camera.data.lens = 32
s.render.filepath = out
bpy.ops.render.render(write_still=True)
print("SAVED", out)
