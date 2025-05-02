#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITES_CSV="$SCRIPT_DIR/sites.csv"

# Check if the file exists
if [ ! -f "$SITES_CSV" ]; then
    echo "Error: $SITES_CSV not found."
    exit 1
fi

# Create results directory if it doesn't exist
RESULTS_DIR="$SCRIPT_DIR/results"
if [ ! -d "$RESULTS_DIR" ]; then
  echo "Creating results directory at: $RESULTS_DIR"
  mkdir -p "$RESULTS_DIR"
fi

echo "Installing dependencies..."
npm ci

echo "Starting Oobee benchmark..."

# Count the number of sites
echo "Reading sites from: $SITES_CSV"
echo "Found $(grep -v "^$" "$SITES_CSV" | wc -l) sites to process:"

# Display the list of sites
counter=1
while IFS=, read -r SITE_NAME SITE_URL || [ -n "$SITE_NAME" ]; do
# Skip empty lines
	if [ -z "$SITE_NAME" ]; then
		continue
	fi

	echo "$counter. $SITE_NAME ($SITE_URL)"
	((counter++))
done < "$SITES_CSV"

echo "----------------------------------------"

# Note: We should be importing the library instead of running the build script
# However, the documentation is lacking and it doesn't quite work
# Thus, we resort to this hacky way of running the script from the node_modules directory directly
echo "Navigating to Oobee directory..."
cd "$SCRIPT_DIR/node_modules/@govtechsg/oobee" || {
	echo "Error: Could not navigate to Oobee directory"
	exit 1
}
echo "Current directory: $(pwd)"

echo "Installing dependencies..."
npm install

echo "Building Oobee library..."
npm run build

echo "----------------------------------------"

# Process each line of the CSV file
while IFS=, read -r SITE_NAME SITE_URL || [ -n "$SITE_NAME" ]; do
	# Skip empty lines
	if [ -z "$SITE_NAME" ]; then
		continue
	fi
	
	echo -e "\n==== Processing site: $SITE_NAME ($SITE_URL) ===="
	
	# Run the npm command with the appropriate substitutions
	# Trim any whitespace from the values
	SITE_NAME=$(echo "$SITE_NAME" | xargs)
	SITE_URL=$(echo "$SITE_URL" | xargs)
	
	# Construct the full command with maxpages parameter
  	# Also set an arbitrarily large maxpages to ensure all pages are scanned (default is 100)
	# Using Mobile device as it can catch more issues
	# Using same-hostname strategy to remove other subdomains from the scan
	CMD="npm run cli -- --scanner intelligent --url ${SITE_URL} --zip ${SITE_NAME}.zip --nameEmail isomer:admin@isomer.gov.sg --generateJsonFiles yes --maxpages 100000 --customDevice Mobile --strategy same-hostname"
	
	echo "Executing: $CMD"
	echo "----------------------------------------"
	eval "$CMD"
	echo "----------------------------------------"
	echo "Successfully processed $SITE_NAME"
	echo "Moving ${SITE_NAME}.zip to $RESULTS_DIR/"
	mv "${SITE_NAME}.zip" "$RESULTS_DIR/"
	echo ""
    
done < "$SITES_CSV"

echo "Benchmark completed successfully!"

echo "Extracting zip files..."
cd "$RESULTS_DIR"

# For each zip file in the directory
for zipfile in *.zip; do
  # Check if the file exists (in case there are no zip files)
  if [ -f "$zipfile" ]; then    
    # Create a directory with the same name as the zip file (without the .zip extension)
    mkdir -p "${zipfile%.zip}"

    # Extract the zip file into the newly created directory
    unzip -o "$zipfile" -d "${zipfile%.zip}"

    echo "Extracted $zipfile to ${zipfile%.zip}/"

    # Move scanItems.json from the extracted folder to the results directory with the name of the zip file
    if [ -f "${zipfile%.zip}/scanItems.json" ]; then
      echo "Moving ${zipfile%.zip}/scanItems.json to $RESULTS_DIR/${zipfile%.zip}.json"
      cp "${zipfile%.zip}/scanItems.json" "$RESULTS_DIR/${zipfile%.zip}.json"
    else
      echo "Warning: scanItems.json not found in ${zipfile%.zip}/"
    fi
  fi
done

echo "All zip files have been extracted!"
