#!/usr/bin/env bash
# Posts a sticky PR comment comparing the Template's gzipped bundle size,
# by category, on this PR against the same build from `main`.
#
# The Template (`isomer-base-template`, built with `next build --webpack`) is the
# real consumer of @opengovsg/isomer-components, so its webpack-bundled, tree-shaken,
# minified, gzipped output reflects what actually ships to browsers — unlike the raw
# published tarball, which is everything in the package before tree-shaking.
#
# Required env:
#   GH_TOKEN                         token with pull-requests:write
#   PR_NUMBER                        the pull request number
#   PR_{FRAMEWORK,VENDOR,PAGE,CSS,TOTAL}    gzipped bytes per category (PR build)
#   BASE_{FRAMEWORK,VENDOR,PAGE,CSS,TOTAL}  gzipped bytes per category (main build)

set -euo pipefail

: "${PR_NUMBER:?PR_NUMBER is required}"

human() { awk -v b="$1" 'BEGIN { printf "%.2f KB", b / 1024 }'; }

# Renders "+1.23 KB (+0.45%)" / "-1.23 KB (-0.45%)" / "±0.00 KB (+0.00%)".
delta_cell() {
  local base="$1" pr="$2"
  local d=$((pr - base)) sign pct abs
  if [ "$d" -gt 0 ]; then sign="+"; elif [ "$d" -lt 0 ]; then sign="-"; else sign="±"; fi
  abs=${d#-}
  if [ "$base" -gt 0 ]; then
    pct=$(awk -v d="$d" -v base="$base" 'BEGIN { printf "%+.2f", (d / base) * 100 }')
  else
    pct="n/a"
  fi
  printf "%s%s (%s%%)" "$sign" "$(human "$abs")" "$pct"
}

# Headline reflects the category we actually care about: vendor + shared.
vdelta=$((PR_VENDOR - BASE_VENDOR))
if [ "$vdelta" -gt 0 ]; then emoji="📈"; elif [ "$vdelta" -lt 0 ]; then emoji="📉"; else emoji="📦"; fi

row() { # label base pr  ->  "| label | base | pr | delta |"
  printf "| %s | %s | %s | %s |" "$1" "$(human "$2")" "$(human "$3")" "$(delta_cell "$2" "$3")"
}

r_vendor=$(row "🧩 Vendor + shared — components & deps" "$BASE_VENDOR" "$PR_VENDOR")
r_css=$(row "🎨 CSS" "$BASE_CSS" "$PR_CSS")
r_page=$(row "📄 Page / route" "$BASE_PAGE" "$PR_PAGE")
r_framework=$(row "⚙️ Framework & runtime (fixed)" "$BASE_FRAMEWORK" "$PR_FRAMEWORK")
r_total=$(row "**Total**" "$BASE_TOTAL" "$PR_TOTAL")

# Single-quoted printf format keeps backticks/parens in the prose literal.
body=$(printf '<!-- template-bundle-size -->
### %s Template bundle size (gzipped)

Built `isomer-base-template` (`next build --webpack`) against the committed sample content, consuming this PR'"'"'s `@opengovsg/isomer-components`, compared to `main`. Sizes are gzipped.

| Category | main | this PR | Δ |
| --- | ---: | ---: | ---: |
%s
%s
%s
%s
%s

<sub>**Vendor + shared** is the signal — that is where the components package and its dependencies land after webpack tree-shaking. **Framework & runtime** (Next.js + React + polyfills) is fixed overhead that does not move with a components change. Components are pulled into shared chunks via a static render `switch`, so per-route chunks stay tiny. Informational only — never fails the build.\n' \
  "$emoji" "$r_vendor" "$r_css" "$r_page" "$r_framework" "$r_total")

# Sticky comment: edit the bot's previous bundle-size comment if present, else create one.
gh pr comment "$PR_NUMBER" --body "$body" --edit-last --create-if-none
