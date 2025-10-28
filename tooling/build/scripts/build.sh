#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -ex

# Helper function to calculate duration
calculate_duration() {
  start_time=$1
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  echo "Time taken: $duration seconds"
}

# Store the current directory
ISOMER_REPO_DIRECTORY=$(pwd)

cd ../

cd isomer/packages/components
mv opengovsg-isomer-components-0.0.13.tgz ../../tooling/template/
cd ../.. # back to root
echo $(pwd)
calculate_duration $start_time

# Set up the schema folder
rm -rf tooling/template/schema
rm -rf tooling/template/data
rm -rf tooling/template/public
mv $ISOMER_REPO_DIRECTORY/schema/ tooling/template/
mv $ISOMER_REPO_DIRECTORY/data/ tooling/template/
mv $ISOMER_REPO_DIRECTORY/public/ tooling/template/

# Generate sitemap.json
cd tooling/template
find . schema
start_time=$(date +%s)
mkdir -p scripts/
cp ../build/scripts/generate-sitemap.js scripts/
node scripts/generate-sitemap.js
echo "Sitemap generated"
calculate_duration $start_time

# Copy sitemap.json to public folder
cp sitemap.json public/
echo "Copied sitemap to public folder"

# Cleanup
rm -rf scripts

# Bridging the difference betwen the two types of homepage JSONs
mv schema/index.json schema/_index.json

# Create not-found.json by copying _index.json if it doesn't exist
# Refer to tooling/template/app/not-found.tsx for more context
if [ ! -f "schema/not-found.json" ]; then
  echo "Creating not-found.json..."
  cp schema/_index.json schema/not-found.json
fi

# Build the site
echo "Building site..."
start_time=$(date +%s)
npm i opengovsg-isomer-components-0.0.13.tgz
npm run build:template
calculate_duration $start_time

# Bring the output folder to the original directory
mv out/ $ISOMER_REPO_DIRECTORY/out/
