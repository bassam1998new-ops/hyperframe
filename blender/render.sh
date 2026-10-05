#!/usr/bin/env bash
# Renders a Blender Python scene headless and packs the frames into a transparent WebM for HyperFrames.
# Usage: blender/render.sh <scene.py> <out.webm> [frames=90] [size=720]
# The scene script gets: -- <frame_prefix> <frames> <size>   (see turntable.py for the pattern)
# Needs blender/setup.sh first.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$here/env.sh"
scene="$1"; out="$2"; frames="${3:-90}"; size="${4:-720}"
work="$(mktemp -d)"
blender5 "$scene" -- "$work/f_" "$frames" "$size" > "$work/blender.log" 2>&1 || { tail -20 "$work/blender.log"; exit 1; }
mkdir -p "$(dirname "$out")"
ffmpeg -y -loglevel error -framerate 30 -i "$work/f_%04d.png" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 2M "$out"
rm -rf "$work"
echo "wrote $out"
