#!/usr/bin/env bash
# Run after editing fonts.css, style.css or script.js; requires Node.js + npm.
set -euo pipefail
cd "$(dirname "$0")/.."
cat fonts.css style.css | npx --yes esbuild@0.28.2 --loader=css --minify > style.min.css
npx --yes esbuild@0.28.2 script.js --minify --outfile=script.min.js
