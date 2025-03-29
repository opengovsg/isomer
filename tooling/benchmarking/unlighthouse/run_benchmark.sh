#!/bin/bash

# Define constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_PATH="$SCRIPT_DIR/results"
CSV_PATH="$SCRIPT_DIR/sites.csv"

echo "OUTPUT_PATH: $OUTPUT_PATH"
echo "CSV_PATH: $CSV_PATH"

# Check if the CSV file exists
if [ ! -f "$CSV_PATH" ]; then
	echo "Error: $CSV_PATH not found."
	exit 1
fi

# Function to run Unlighthouse CI for a given site
run_unlighthouse_ci() {
	local site_name="$1"
	local site_url="$2"
	
	echo -e "\n--- Running Unlighthouse CI for site \"$site_name\" with URL \"$site_url\" ---\n"
	
	# Execute the unlighthouse-ci command
	local command="unlighthouse-ci --no-cache --build-static --output-path \"$OUTPUT_PATH/$site_name\" --site $site_url"
	echo "Executing: $command"
	
	if eval "$command"; then
		echo -e "\n--- Unlighthouse CI completed successfully for $site_name! ---\n"
		return 0
	else
		echo -e "\n--- Error running Unlighthouse CI for $site_name ---\n"
		return 1
	fi
}

# Main function to run Unlighthouse CI for all sites
run_all() {
	echo "=== Starting Unlighthouse CI for all predefined sites ==="
	
	# Count the number of sites (excluding empty lines)
	local total_sites=$(grep -v "^$" "$CSV_PATH" | wc -l)
	echo "Total sites to process: $total_sites"
	
	local success_count=0
	local fail_count=0
	local counter=1
	
	# Process each line of the CSV file
	while IFS=, read -r site_name site_url || [ -n "$site_name" ]; do
		# Skip empty lines
		if [ -z "$site_name" ]; then
			continue
		fi
		
		echo -e "\nProcessing site $counter of $total_sites: $site_name"
		
		if run_unlighthouse_ci "$site_name" "$site_url"; then
			((success_count++))
		else
			((fail_count++))
		fi
		
		((counter++))
	done < "$CSV_PATH"
	
	# Print summary
	echo -e "\n=== Unlighthouse CI Run Summary ==="
	echo "Total sites: $total_sites"
	echo "Successful: $success_count"
	echo "Failed: $fail_count"
	echo "==============================="
}

# Make sure the output directory exists
mkdir -p "$OUTPUT_PATH"

# Run the script
run_all
