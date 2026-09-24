#!/usr/bin/env bash

SITES_FILE="${1:-sites.csv}"

# --- Validation ---

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required but not installed." >&2
  exit 1
fi

if [ -z "${TOKEN:-}" ]; then
  echo "Error: TOKEN environment variable is not set. See README.md for how to obtain one." >&2
  exit 1
fi

if [ ! -f "$SITES_FILE" ]; then
  echo "Error: $SITES_FILE not found." >&2
  exit 1
fi

TOTAL=$(awk 'NF{c++} END{print c+0}' "$SITES_FILE")
if [ "$TOTAL" -eq 0 ]; then
  echo "Error: $SITES_FILE has no site IDs." >&2
  exit 1
fi

# --- Processing ---

CURRENT=0
SUCCESS_COUNT=0
FAILED_SITES=()

while IFS= read -r SITE_ID || [ -n "$SITE_ID" ]; do
  SITE_ID=$(echo "$SITE_ID" | tr -d '\r' | xargs)
  [ -z "$SITE_ID" ] && continue

  CURRENT=$((CURRENT + 1))
  echo "[$CURRENT/$TOTAL] Processing site $SITE_ID..."

  GET_RESPONSE=$(
    curl --silent --write-out '\n%{http_code}' --request GET \
      --url https://api.services.search.gov.sg/admin/v2/sites/"$SITE_ID" \
      --header "Authorization: Bearer $TOKEN" \
      --header 'Content-Type: application/json' \
      --header 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer'
  )
  GET_STATUS=$(echo "$GET_RESPONSE" | tail -n1)
  SITE_JSON=$(echo "$GET_RESPONSE" | sed '$d')

  if [ "$GET_STATUS" -lt 200 ] || [ "$GET_STATUS" -ge 300 ]; then
    echo "  x Failed to fetch site (HTTP $GET_STATUS)"
    FAILED_SITES+=("$SITE_ID (GET failed: HTTP $GET_STATUS)")
    continue
  fi

  APP_ID=$(echo "$SITE_JSON" | jq -r '.data.siteDetail.applications[0].appId')

  if [ -z "$APP_ID" ] || [ "$APP_ID" = "null" ]; then
    echo "  x No application found for site $SITE_ID"
    FAILED_SITES+=("$SITE_ID (no appId in response)")
    continue
  fi

  PATCH_RESPONSE=$(
    curl --silent --write-out '\n%{http_code}' --request PATCH \
      --url https://api.services.search.gov.sg/admin/v2/sites/"$SITE_ID"/apps/"$APP_ID" \
      --header "Authorization: Bearer $TOKEN" \
      --header 'Content-Type: application/json' \
      --header 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer' \
      --data '{
      "config": {
        "scopePill": {
          "enabled": false,
          "default": "domain"
        }
      }
    }'
  )
  PATCH_STATUS=$(echo "$PATCH_RESPONSE" | tail -n1)

  if [ "$PATCH_STATUS" -lt 200 ] || [ "$PATCH_STATUS" -ge 300 ]; then
    echo "  x Failed to patch app $APP_ID (HTTP $PATCH_STATUS)"
    FAILED_SITES+=("$SITE_ID (PATCH failed: HTTP $PATCH_STATUS)")
    continue
  fi

  echo "  - Done"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
done <"$SITES_FILE"

# --- Summary ---

echo ""
echo "Summary: $SUCCESS_COUNT/$TOTAL succeeded."

if [ "${#FAILED_SITES[@]}" -gt 0 ]; then
  echo "Failed sites:"
  for f in "${FAILED_SITES[@]}"; do
    echo "  - $f"
  done
  exit 1
fi
