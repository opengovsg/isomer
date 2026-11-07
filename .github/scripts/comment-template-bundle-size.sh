#!/usr/bin/env bash
# Posts a sticky PR comment comparing first-load JS on this PR against `main`.
#
# Each number is the unique gzipped JS one exported HTML references
# (script src, modulepreload, preload as=script). CSS is not included.
# Informational only: this script never exits non-zero because a page grew.
#
# Required env:
#   GH_TOKEN
#   PR_NUMBER
#   PR_SEARCHSG_ROOT, PR_SEARCHSG_ABOUT, PR_SEARCHSG_NEWS, PR_SEARCHSG_NEWS_POST_A,
#   PR_SEARCHSG_SEARCH, PR_SEARCHSG_DATA_REGISTRY, and the same six with BASE_
#   PR_EGAZETTE_* and BASE_EGAZETTE_* for the same six pages

set -euo pipefail

: "${PR_NUMBER:?PR_NUMBER is required}"

human() { awk -v b="$1" 'BEGIN { printf "%.1f KB", b / 1024 }'; }

delta_cell() {
  local base="$1" pr="$2"
  local d=$((pr - base)) sign pct abs
  if [ "$d" -gt 0 ]; then sign="+"; elif [ "$d" -lt 0 ]; then sign="-"; else sign="±"; fi
  abs=${d#-}
  if [ "$base" -gt 0 ]; then
    pct=$(awk -v d="$d" -v base="$base" 'BEGIN { printf "%+.1f", (d / base) * 100 }')
  else
    pct="n/a"
  fi
  printf "%s%s (%s%%)" "$sign" "$(human "$abs")" "$pct"
}

row() {
  printf "| %s | %s | %s | %s |" "$1" "$(human "$2")" "$(human "$3")" "$(delta_cell "$2" "$3")"
}

searchsg=$(
  printf '%s\n' \
    "$(row "/" "$BASE_SEARCHSG_ROOT" "$PR_SEARCHSG_ROOT")" \
    "$(row "/about" "$BASE_SEARCHSG_ABOUT" "$PR_SEARCHSG_ABOUT")" \
    "$(row "/news" "$BASE_SEARCHSG_NEWS" "$PR_SEARCHSG_NEWS")" \
    "$(row "/news/post-a" "$BASE_SEARCHSG_NEWS_POST_A" "$PR_SEARCHSG_NEWS_POST_A")" \
    "$(row "/search" "$BASE_SEARCHSG_SEARCH" "$PR_SEARCHSG_SEARCH")" \
    "$(row "/data/registry" "$BASE_SEARCHSG_DATA_REGISTRY" "$PR_SEARCHSG_DATA_REGISTRY")"
)

egazette=$(
  printf '%s\n' \
    "$(row "/" "$BASE_EGAZETTE_ROOT" "$PR_EGAZETTE_ROOT")" \
    "$(row "/about" "$BASE_EGAZETTE_ABOUT" "$PR_EGAZETTE_ABOUT")" \
    "$(row "/news" "$BASE_EGAZETTE_NEWS" "$PR_EGAZETTE_NEWS")" \
    "$(row "/news/post-a" "$BASE_EGAZETTE_NEWS_POST_A" "$PR_EGAZETTE_NEWS_POST_A")" \
    "$(row "/search" "$BASE_EGAZETTE_SEARCH" "$PR_EGAZETTE_SEARCH")" \
    "$(row "/data/registry" "$BASE_EGAZETTE_DATA_REGISTRY" "$PR_EGAZETTE_DATA_REGISTRY")"
)

# Headline only. The table rows are what to read.
sum_delta=0
for pair in \
  "$BASE_SEARCHSG_ROOT $PR_SEARCHSG_ROOT" \
  "$BASE_SEARCHSG_ABOUT $PR_SEARCHSG_ABOUT" \
  "$BASE_SEARCHSG_NEWS $PR_SEARCHSG_NEWS" \
  "$BASE_SEARCHSG_NEWS_POST_A $PR_SEARCHSG_NEWS_POST_A" \
  "$BASE_SEARCHSG_SEARCH $PR_SEARCHSG_SEARCH" \
  "$BASE_SEARCHSG_DATA_REGISTRY $PR_SEARCHSG_DATA_REGISTRY" \
  "$BASE_EGAZETTE_ROOT $PR_EGAZETTE_ROOT" \
  "$BASE_EGAZETTE_ABOUT $PR_EGAZETTE_ABOUT" \
  "$BASE_EGAZETTE_NEWS $PR_EGAZETTE_NEWS" \
  "$BASE_EGAZETTE_NEWS_POST_A $PR_EGAZETTE_NEWS_POST_A" \
  "$BASE_EGAZETTE_SEARCH $PR_EGAZETTE_SEARCH" \
  "$BASE_EGAZETTE_DATA_REGISTRY $PR_EGAZETTE_DATA_REGISTRY"
do
  set -- $pair
  sum_delta=$((sum_delta + $2 - $1))
done
if [ "$sum_delta" -gt 0 ]; then emoji="📈"; elif [ "$sum_delta" -lt 0 ]; then emoji="📉"; else emoji="📦"; fi

body=$(printf '<!-- first-load-js -->
### %s First-load JS (gzipped)

Unique JS referenced by each exported page (`script src`, modulepreload, preload as=script), compared with `main`. Same six-page fixture and scorer on both checkouts. Each checkout is built with its own `build:template`. CSS is not included.

#### searchSG

| Page | main | this PR | Δ |
| --- | ---: | ---: | ---: |
%s

#### egazette-algolia

| Page | main | this PR | Δ |
| --- | ---: | ---: | ---: |
%s

<sub>Read the rows. `/news` and Egazette `/search` can move differently from the other pages. Informational only. This does not fail the build.\n' \
  "$emoji" "$searchsg" "$egazette")

gh pr comment "$PR_NUMBER" --body "$body" --edit-last --create-if-none
