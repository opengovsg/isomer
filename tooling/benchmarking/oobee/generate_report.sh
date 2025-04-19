#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
CSV_FILE="$SCRIPT_DIR/report.csv"

echo "Generating summary report..."

# Create report.csv with headers
echo "siteName,mustFix,goodToFix,needsReview" > "$CSV_FILE"

# Process each JSON file in the results directory
for jsonfile in "$RESULTS_DIR"/*.json; do
  # Extract the site name from the filename (remove path and extension)
  siteName=$(basename "$jsonfile" .json)
  
  # Use jq to extract the required values from the JSON file
  # If jq is not installed, this will need to be installed first
  if command -v jq &> /dev/null; then
    mustFix=$(jq -r '.mustFix.totalItems // 0' "$jsonfile")
    goodToFix=$(jq -r '.goodToFix.totalItems // 0' "$jsonfile")
    needsReview=$(jq -r '.needsReview.totalItems // 0' "$jsonfile")
    
    # Add the data to the report.csv file
    echo "$siteName,$mustFix,$goodToFix,$needsReview" >> "$CSV_FILE"
    echo "Added data for $siteName to report.csv"
  else
    echo "Warning: jq not found. Cannot process JSON files without jq. Please install jq to generate the report."
    break
  fi
done

echo "Report generated at $RESULTS_DIR/report.csv"
