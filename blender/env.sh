# Source this to use the cloud Blender 5.0 set up by blender/setup.sh:
#   source blender/env.sh && blender5 my_scene.py -- <args>
export BLENDER_LIB="${BLENDER_LIB:-/opt/blender-lib}"
export BLENDER_PY="${BLENDER_PY:-/opt/blender5}"
export BLENDER_USER_SCRIPTS="$BLENDER_LIB/scripts"
export BLENDER_USER_EXTENSIONS="$BLENDER_LIB/extensions"
blender5() { "$BLENDER_PY/bin/python" "$@"; }
