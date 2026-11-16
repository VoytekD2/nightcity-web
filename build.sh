#!/usr/bin/env sh
# Builds the exact extension package uploaded to addons.mozilla.org.
# 1. Regenerates src/palette.css (the only generated file) from dev/gen_palette.py.
# 2. Packages the extension with web-ext 8.3.0 into web-ext-artifacts/.
set -eu
cd "$(dirname "$0")"
python3 dev/gen_palette.py
npm run build
