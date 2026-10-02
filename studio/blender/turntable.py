import bpy, math, sys
argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
out = argv[0] if argv else "/tmp/studio/frames/f_"
frames = int(argv[1]) if len(argv)>1 else 90
size = int(argv[2]) if len(argv)>2 else 720
bpy.ops.wm.read_factory_settings(use_empty=True)
s=bpy.context.scene
s.render.engine='CYCLES'; s.cycles.device='CPU'; s.cycles.samples=24; s.cycles.use_denoising=False
s.render.resolution_x=size; s.render.resolution_y=size
s.render.film_transparent=True
s.render.image_settings.color_mode='RGBA'
s.frame_start=1; s.frame_end=frames; s.render.fps=30
bpy.ops.mesh.primitive_torus_add(major_radius=1.2, minor_radius=0.4); t=bpy.context.object
bpy.ops.object.shade_smooth()
m=bpy.data.materials.new("M"); m.use_nodes=True
b=m.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value=(0.05,0.9,0.45,1); b.inputs["Metallic"].default_value=0.6; b.inputs["Roughness"].default_value=0.25
t.data.materials.append(m)
t.rotation_euler=(math.radians(60),0,0); t.keyframe_insert("rotation_euler",frame=1)
t.rotation_euler=(math.radians(60),0,math.radians(360)); t.keyframe_insert("rotation_euler",frame=frames+1)
for fc in t.animation_data.action.fcurves:
    for k in fc.keyframe_points: k.interpolation='LINEAR'
bpy.ops.object.light_add(type='AREA',location=(3,-3,4)); bpy.context.object.data.energy=800; bpy.context.object.rotation_euler=(0.7,0,0.8)
bpy.ops.object.light_add(type='AREA',location=(-3,2,1)); bpy.context.object.data.energy=300; bpy.context.object.data.color=(0.3,1,0.6)
bpy.ops.object.camera_add(location=(0,-6,0),rotation=(math.radians(90),0,0)); s.camera=bpy.context.object
s.world=bpy.data.worlds.new("W"); s.world.color=(0.02,0.02,0.03)
s.render.filepath=out
bpy.ops.render.render(animation=True)
