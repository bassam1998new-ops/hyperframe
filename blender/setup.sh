#!/usr/bin/env bash
# Installs Blender (headless) in a fresh cloud container. Safe to run more than once.
set -euo pipefail
if ! command -v blender >/dev/null; then
  apt-get update -q
  DEBIAN_FRONTEND=noninteractive apt-get install -y -q --no-install-recommends blender
fi
blender --version | head -1
