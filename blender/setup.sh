#!/usr/bin/env bash
# Sets up headless Blender 5.0 + a free (CC0 / open-source) add-on and asset library in a fresh
# cloud container. Safe to run more than once. Takes a few minutes the first time.
#
#   bash blender/setup.sh          # everything
#   source blender/env.sh          # then: blender5 my_scene.py -- args
#
# Only GitHub, PyPI, npm and Ubuntu apt are reachable from the cloud, so every source below
# comes from one of those. See blender/LIBRARY.md for what each piece is and its licence.
set -euo pipefail
LIB="${BLENDER_LIB:-/opt/blender-lib}"
PY="${BLENDER_PY:-/opt/blender5}"
mkdir -p "$LIB"
clone() {  # clone <github repo> <dir> [sparse paths...]
  local repo="$1" dir="$2"; shift 2
  [ -d "$dir/.git" ] && return 0
  if [ $# -gt 0 ]; then
    git clone -q --depth 1 --filter=blob:none --sparse "https://github.com/$repo" "$dir"
    git -C "$dir" sparse-checkout set --no-cone "$@"
  else
    git clone -q --depth 1 "https://github.com/$repo" "$dir"
  fi
}

echo "== Blender 5.0 (bpy from PyPI) + software OpenGL for EEVEE"
if ! "$PY/bin/python" -c "import bpy" 2>/dev/null; then
  if command -v uv >/dev/null; then uv venv -q "$PY" -p 3.11; else python3.11 -m venv "$PY"; fi
  pkgs=("bpy==5.0.*" arabic-reshaper python-bidi)
  if command -v uv >/dev/null; then uv pip install -q -p "$PY/bin/python" "${pkgs[@]}"; else "$PY/bin/python" -m pip install -q "${pkgs[@]}"; fi
fi
if ! ldconfig -p | grep -q libEGL.so.1; then
  apt-get update -q
  DEBIAN_FRONTEND=noninteractive apt-get install -y -q --no-install-recommends libegl1 libegl-mesa0 libgl1-mesa-dri libgles2
fi

echo "== HDRIs (CC0, shipped with Blender)"
mkdir -p "$LIB/hdri"
cp --update=none "$PY"/lib/python3.11/site-packages/bpy/5.0/datafiles/studiolights/world/* "$LIB/hdri/"

echo "== Fonts (OFL, Google Fonts)"
clone google/fonts "$LIB/gfonts" /ofl/cairo/ /ofl/tajawal/ /ofl/almarai/ /ofl/notokufiarabic/ \
  /ofl/inter/ /ofl/montserrat/ /ofl/bebasneue/ /ofl/rubik/

echo "== Models: Khronos glTF samples (CC0 only)"
clone KhronosGroup/glTF-Sample-Assets "$LIB/gltf" $(for m in Avocado BarramundiFish BoomBox Corset \
  DiffuseTransmissionTeacup GlassVaseFlowers IridescenceSuzanne Lantern ScatteringSkull SheenChair \
  ToyCar WaterBottle; do echo "/Models/$m/glTF-Binary/ /Models/$m/README.md"; done)

echo "== Models: Kenney starter kits (CC0)"
for k in City-Builder 3D-Platformer Racing FPS; do clone "KenneyNL/Starter-Kit-$k" "$LIB/kenney/Starter-Kit-$k"; done

echo "== Materials + models: byte's CC0 Blender asset library (HDRIs there need Git LFS, which is blocked)"
clone trashbyte/blender-assets "$LIB/byte" /Materials/ /Models/ /LICENSE.txt /blender_assets.cats.txt

echo "== Add-ons: Blender's own free add-ons (archived repo, work in 5.0)"
clone blender/blender-addons "$LIB/addons-src" /add_mesh_extra_objects/ /add_curve_extra_objects/ \
  /add_curve_sapling/ /ant_landscape/ /mesh_tissue/ /object_fracture_cell/ /add_mesh_geodesic_domes/ \
  /add_mesh_BoltFactory/ /sun_position/ /add_curve_ivygen.py /real_snow.py /lighting_dynamic_sky.py \
  /object_boolean_tools.py /mesh_looptools.py

echo "== Add-ons: community (GitHub)"
mkdir -p "$LIB/gh"
clone makehumancommunity/mpfb2 "$LIB/gh/mpfb2"            # MPFB: human generator
clone a1studmuffin/SpaceshipGenerator "$LIB/gh/SpaceshipGenerator"
clone nortikin/sverchok "$LIB/gh/sverchok"                # parametric node geometry
clone mrachinskiy/commotion "$LIB/gh/commotion"           # motion-graphics offsets/effectors
clone leomoon-studios/leomoon-textcounter "$LIB/gh/leomoon-textcounter"
clone doakey3/blender-typewriter-addon "$LIB/gh/blender-typewriter-addon"
python3 "$(dirname "$0")/patches/spaceship_blender5.py" "$LIB/gh/SpaceshipGenerator/spaceship_generator.py"

echo "== Wire add-ons into Blender's user script / extension folders"
A="$LIB/scripts/addons"; mkdir -p "$A" "$LIB/extensions/user_default"
for a in add_mesh_extra_objects add_curve_extra_objects add_curve_sapling ant_landscape mesh_tissue \
  object_fracture_cell add_mesh_geodesic_domes add_mesh_BoltFactory sun_position add_curve_ivygen.py \
  real_snow.py lighting_dynamic_sky.py object_boolean_tools.py mesh_looptools.py; do
  ln -sfn "$LIB/addons-src/$a" "$A/$a"
done
ln -sfn "$LIB/gh/SpaceshipGenerator" "$A/spaceship_generator"
ln -sfn "$LIB/gh/sverchok" "$A/sverchok"
ln -sfn "$LIB/gh/commotion" "$A/commotion"
ln -sfn "$LIB/gh/leomoon-textcounter/textcounter" "$A/leomoon_textcounter"
ln -sfn "$LIB/gh/blender-typewriter-addon" "$A/typewriter"
ln -sfn "$LIB/gh/mpfb2/src/mpfb" "$LIB/extensions/user_default/mpfb"

# shellcheck source=/dev/null
source "$(dirname "$0")/env.sh"
blender5 -c "import bpy; print('Blender', bpy.app.version_string, 'ready')" 2>/dev/null
