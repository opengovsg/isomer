#!/bin/bash

# Define file paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_FILE="$SCRIPT_DIR/sites.production.csv"
OUTPUT_FILE="$SCRIPT_DIR/sites.csv"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
	echo "Error: Input file $INPUT_FILE not found."
	exit 1
fi

# Create a temporary file for processing
TMP_FILE="$(mktemp)"

# Process the CSV file and filter rows
echo "Processing $INPUT_FILE..."

# Skip header line and process the rest
tail -n +2 "$INPUT_FILE" | while IFS=, read -r siteName shortName siteId state instanceType domainAliases || [[ -n "$shortName" ]]; do
	# Skip if state is not "LAUNCHED" or if domainAliases starts with "test-"
	if [ "$state" = "LAUNCHED" ] && [[ ! "$domainAliases" =~ ^test- ]]; then
		# Append "-next" to shortName and "https://" to domainAliases
		echo "${shortName}-next,https://${domainAliases}" >> "$TMP_FILE"
	fi
done

# Sort the results alphabetically by shortName
sort "$TMP_FILE" > "$TMP_FILE.sorted"

# Move the sorted file to the final output location
mv "$TMP_FILE.sorted" "$OUTPUT_FILE"

# Clean up temporary file
rm -f "$TMP_FILE"

echo "Generated sites list at $OUTPUT_FILE"
echo "Total sites: $(wc -l < "$OUTPUT_FILE")"
