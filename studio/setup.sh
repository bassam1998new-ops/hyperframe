#!/usr/bin/env bash
# Prepares a fresh cloud container for the studio loop: Blender (headless) + HyperFrames render browser.
# Safe to run more than once.
set -euo pipefail
if ! command -v blender >/dev/null; then
  apt-get update -q
  DEBIAN_FRONTEND=noninteractive apt-get install -y -q --no-install-recommends blender
fi
blender --version | head -1
HYPERFRAMES_SKIP_SKILLS=1 npx -y hyperframes browser ensure | tail -1
