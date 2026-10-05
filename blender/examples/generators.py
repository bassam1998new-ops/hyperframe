# Generators test: a MakeHuman (MPFB) human and a procedural spaceship, lit by a CC0 HDRI.
# Run: source blender/env.sh && blender5 blender/examples/generators.py -- /tmp/generators.png
import bpy, addon_utils, math, os, sys
LIB = os.environ.get("BLENDER_LIB", "/opt/blender-lib")
out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/generators.png"
bpy.ops.wm.read_factory_settings(use_empty=True)
for n in ("bl_ext.user_default.mpfb", "spaceship_generator"):
    addon_utils.enable(n, default_set=True)

bpy.ops.mpfb.create_human()
human = list(bpy.data.objects)
for o in human: o.location.x -= 1.2

bpy.ops.mesh.generate_spaceship()
for o in bpy.data.objects:
    if o not in human: o.location = (1.6, 0, 1); o.scale = (0.25,) * 3

s = bpy.context.scene
s.render.engine = "CYCLES"; s.cycles.samples = 32; s.cycles.use_denoising = True
s.render.resolution_x = s.render.resolution_y = 1080
w = bpy.data.worlds.new("W"); s.world = w; w.use_nodes = True
e = w.node_tree.nodes.new("ShaderNodeTexEnvironment"); e.image = bpy.data.images.load(f"{LIB}/hdri/studio.exr")
w.node_tree.links.new(e.outputs[0], w.node_tree.nodes["Background"].inputs[0])
bpy.ops.object.camera_add(location=(0.2, -5.5, 1.1), rotation=(math.radians(88), 0, 0)); s.camera = bpy.context.object
s.render.filepath = out
bpy.ops.render.render(write_still=True)
print("SAVED", out)
