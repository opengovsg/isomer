#!/usr/bin/env bash
# Posts a sticky PR comment comparing the built @opengovsg/isomer-components
# package tarball size on this PR against the same tarball built from `main`.
#
# This measures the `pnpm pack` artifact (opengovsg-isomer-components-<version>.tgz)
# produced by `pnpm --filter @opengovsg/isomer-components run build`, the exact
# build command the publisher runs (tooling/build/scripts/publisher.sh).
#
# Required env:
#   GH_TOKEN   - token with pull-requests:write
#   PR_NUMBER  - the pull request number
#   PR_BYTES   - tarball size (bytes) built from the PR branch
#   BASE_BYTES - tarball size (bytes) built from main

set -euo pipefail

: "${PR_NUMBER:?PR_NUMBER is required}"
: "${PR_BYTES:?PR_BYTES is required}"
: "${BASE_BYTES:?BASE_BYTES is required}"

# Human-readable KiB with two decimals.
human() {
  awk -v b="$1" 'BEGIN { printf "%.2f KB", b / 1024 }'
}

delta=$((PR_BYTES - BASE_BYTES))

if [ "$BASE_BYTES" -gt 0 ]; then
  pct=$(awk -v d="$delta" -v base="$BASE_BYTES" 'BEGIN { printf "%+.2f", (d / base) * 100 }')
else
  pct="n/a"
fi

if [ "$delta" -gt 0 ]; then
  emoji="📈"
  sign="+"
elif [ "$delta" -lt 0 ]; then
  emoji="📉"
  sign="-"
else
  emoji="➡️"
  sign="±"
fi

abs_delta=${delta#-}

body=$(cat <<EOF
<!-- components-package-size -->
### ${emoji} \`@opengovsg/isomer-components\` package size

Comparing the \`pnpm pack\` tarball built from this PR against \`main\`.

| | main | this PR | Δ |
| --- | ---: | ---: | ---: |
| Tarball (gzipped) | $(human "$BASE_BYTES") | $(human "$PR_BYTES") | ${sign}$(human "$abs_delta") (${pct}%) |

<sub>Measures \`packages/components/opengovsg-isomer-components-<version>.tgz\`, the artifact consumed by the publisher. Informational only — never fails the build.</sub>
EOF
)

# Sticky comment: edit the bot's previous size comment if present, otherwise create one.
gh pr comment "$PR_NUMBER" --body "$body" --edit-last --create-if-none
