#!/usr/bin/env bash
# Categorize and gzip-measure the static JS/CSS the Template emits
# (tooling/template/out/_next/static after `next build --webpack` + output:export).
#
# We split by category because most of the bundle is fixed Next/React overhead
# that never moves with a components change; the "vendor + shared" chunks are
# where @opengovsg/isomer-components and its deps actually land.
#
# Usage:  measure-template-bundle.sh <out_dir>
# Output: `KEY=<gzipped-bytes>` lines (framework, vendor, page, css, total) on stdout,
#         suitable for appending to "$GITHUB_OUTPUT".

set -euo pipefail

out_dir="${1:?usage: measure-template-bundle.sh <out_dir>}"
static="$out_dir/_next/static"

if [ ! -d "$static" ]; then
  echo "error: $static not found (did the Template build emit a static export?)" >&2
  exit 1
fi

gz() { gzip -c "$1" | wc -c | tr -d ' '; }

framework=0
vendor=0
page=0
css=0

# JS, bucketed by chunk role. `case` globs are not path-aware (`*` spans `/`),
# so the framework patterns below also catch the builtin app/_* error pages.
while IFS= read -r f; do
  rel="${f#"$static"/}"
  size=$(gz "$f")
  case "$rel" in
    chunks/framework-* | chunks/main-* | chunks/polyfills-* | chunks/webpack-* | chunks/next/* | chunks/app/_* | */_buildManifest.js | */_ssgManifest.js)
      framework=$((framework + size)) ;;
    chunks/app/*)
      page=$((page + size)) ;;
    *)
      vendor=$((vendor + size)) ;;
  esac
done < <(find "$static" -name '*.js')

# CSS ships with the components' Tailwind output, so track it as its own category.
if [ -d "$static/css" ]; then
  while IFS= read -r f; do
    css=$((css + $(gz "$f")))
  done < <(find "$static/css" -name '*.css')
fi

total=$((framework + vendor + page + css))

echo "framework=$framework"
echo "vendor=$vendor"
echo "page=$page"
echo "css=$css"
echo "total=$total"
