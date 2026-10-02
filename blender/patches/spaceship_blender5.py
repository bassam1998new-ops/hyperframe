"""Ports a1studmuffin/SpaceshipGenerator (written for Blender 2.8) to the Blender 4/5 Python API.
Idempotent: running it twice changes nothing."""
import re, sys
p = sys.argv[1]
s = open(p).read()
s = s.replace("segments=num_segments,", "segments=int(num_segments),")
s = re.sub(r"\bdiameter([12]?)=", r"radius\1=", s)                     # bmesh ops renamed
s = s.replace('inputs["Specular"]', 'inputs["Specular IOR Level"]')     # Principled BSDF v2
s = s.replace('shader_node.inputs["Emission"]', 'shader_node.inputs["Emission Color"]')
if '"Emission Strength"' not in s:                                       # strength defaults to 0 now
    s = re.sub(r'(\n(\s*)links\.new\(teximage_emit_node\.outputs\[0\], shader_node\.inputs\["Emission Color"\]\))',
               r'\1\n\2shader_node.inputs["Emission Strength"].default_value = 1.0', s)
    s = re.sub(r'(\n(\s*)shader_node\.inputs\["Emission Color"\]\.default_value = glow_color)',
               r'\1\n\2shader_node.inputs["Emission Strength"].default_value = 1.0', s)
s = s.replace("'Raw'", "'Non-Color'").replace('"Raw"', '"Non-Color"')  # colour space renamed
open(p, "w").write(s)
