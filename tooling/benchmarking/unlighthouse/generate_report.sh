#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
OUTPUT_PATH="$SCRIPT_DIR/report.csv"

# Function to calculate average of numbers
calculate_average() {
	local sum=0
	local count=0
	
	for num in "$@"; do
		sum=$(echo "$sum + $num" | bc -l)
		count=$((count + 1))
	done
	
	if [ $count -eq 0 ]; then
		echo "0"
	else
		echo "$sum / $count" | bc -l
	fi
}

# Function to convert decimal to 100 scale and round
convert_to_100_scale() {
	echo "scale=0; ($1 * 100) / 1" | bc -l
}

# Create CSV header
echo "site,score,performance,accessibility,best-practices,seo,site-quality" > "$OUTPUT_PATH"

# Check if results directory exists
if [ ! -d "$RESULTS_DIR" ]; then
	echo "Results directory not found: $RESULTS_DIR"
	exit 1
fi

# Process each site directory
for site in "$RESULTS_DIR"/*; do
	if [ ! -d "$site" ]; then
		continue
	fi
	
	site_name=$(basename "$site")
	ci_result_path="$site/ci-result.json"
	
	if [ ! -f "$ci_result_path" ]; then
		echo "Warning: No ci-result.json found for site: $site_name"
		continue
	fi
	
	# Check if the file has content
	if [ ! -s "$ci_result_path" ]; then
		echo "Warning: Empty results for site: $site_name"
		continue
	fi
	
	# Extract scores using jq
	scores=$(jq -r '.[] | .score' "$ci_result_path")
	performances=$(jq -r '.[] | .performance' "$ci_result_path")
	accessibilities=$(jq -r '.[] | .accessibility' "$ci_result_path")
	best_practices=$(jq -r '.[] | ."best-practices"' "$ci_result_path")
	seos=$(jq -r '.[] | .seo' "$ci_result_path")
	
	# Calculate averages
	score=$(calculate_average $scores)
	performance=$(calculate_average $performances)
	accessibility=$(calculate_average $accessibilities)
	best_practice=$(calculate_average $best_practices)
	seo=$(calculate_average $seos)
	
	# Calculate site quality
	site_quality=$(calculate_average $accessibility $best_practice $seo)
	
	# Convert to 100 scale
	score_100=$(convert_to_100_scale $score)
	performance_100=$(convert_to_100_scale $performance)
	accessibility_100=$(convert_to_100_scale $accessibility)
	best_practice_100=$(convert_to_100_scale $best_practice)
	seo_100=$(convert_to_100_scale $seo)
	site_quality_100=$(convert_to_100_scale $site_quality)
	
	# Add to CSV
	echo "$site_name,$score_100,$performance_100,$accessibility_100,$best_practice_100,$seo_100,$site_quality_100" >> "$OUTPUT_PATH"
done

echo "Overview report generated at: $OUTPUT_PATH"
cat "$OUTPUT_PATH"
