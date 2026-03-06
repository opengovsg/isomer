#!/bin/bash

BUCKET="isomer-next-infra-prod-assets-private-a319984"
CSV_FILE="./items.csv"

# Dry run first
echo "=== DRY RUN ==="
while read -r key; do
  aws s3 rm --dryrun "s3://$BUCKET$key"
done <"$CSV_FILE"

# Ask for confirmation
echo ""
read -p "Proceed with actual deletion? (y/n): " confirm

if [[ "$confirm" != "y" ]]; then
  echo "Aborted."
  exit 0
fi

# Actual deletion
echo "=== DELETING ==="
while read -r key; do
  key=$(echo "$key" | tr -d '"')
  echo "Deleting: $key"
  aws s3 rm "s3://$BUCKET$key"
done <"$CSV_FILE"

echo "=== INVALIDATING ORIGIN ==="
# NOTE: create invalidation for the assets domain
# do note that because cloudfront charges per invalidation path
# at a base rate of 0.005 per path
# ensure that the invalidation created is not too much
# the pricing is available here:
# https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/
PATHS_JSON=$(jq -R -s -c 'split("\n") | map(select(length > 0))' "$CSV_FILE")
COUNT=$(echo "$PATHS_JSON" | jq 'length')

aws cloudfront create-invalidation \
  --distribution-id E3HKKQ90VH6MLT \
  --invalidation-batch "{
      \"Paths\": {
        \"Quantity\": $COUNT,
        \"Items\": $PATHS_JSON
      },
      \"CallerReference\": \"$(date +%s)\"
    }"

echo "Done."
