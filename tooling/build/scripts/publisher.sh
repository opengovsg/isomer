#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Helper function to calculate duration
calculate_duration() {
  start_time=$1
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  echo "Time taken: $duration seconds"
}

# Use the main branch unless one was provided in the env var
if [ -z "$ISOMER_BUILD_REPO_BRANCH" ]; then
  ISOMER_BUILD_REPO_BRANCH="main"
fi

# Cloning the repository
echo "Cloning repository..."
start_time=$(date +%s)

git clone --depth 1 --branch "$ISOMER_BUILD_REPO_BRANCH" https://github.com/opengovsg/isomer.git
cd isomer/
calculate_duration $start_time

echo $(pwd)

# Checkout specific branch
echo "Checking out branch..."
start_time=$(date +%s)
git checkout $ISOMER_BUILD_REPO_BRANCH
calculate_duration $start_time

echo $(git branch)

# Perform a clean of npm cache
npm cache clean --force

# Install dependencies
echo "Installing dependencies..."
start_time=$(date +%s)
npm ci
calculate_duration $start_time

# Build components
echo "Building components..."
start_time=$(date +%s)
cd packages/components
npm run build
mv opengovsg-isomer-components-0.0.13.tgz ../../tooling/template/
cd ../.. # back to root
echo $(pwd)
calculate_duration $start_time

# Fetch from database
echo "Fetching from database..."
start_time=$(date +%s)
cd tooling/build/scripts/publishing
echo $(pwd)
npm ci
npm install ts-node -g
npm run start
calculate_duration $start_time

# Build site
echo "Building site..."
start_time=$(date +%s)
rm -rf ../../../template/schema
rm -rf ../../../template/data
mv schema/ ../../../template/
mv data/ ../../../template/
cp sitemap.json ../../../template/public/
mv sitemap.json ../../../template/
cd ../../../template
echo $(pwd)
npm ci
calculate_duration $start_time

# Prebuild
echo "Prebuilding..."
start_time=$(date +%s)
rm -rf node_modules && rm -rf .next
npm i opengovsg-isomer-components-0.0.13.tgz
calculate_duration $start_time

# Build
echo "Building..."
start_time=$(date +%s)
npm run build
calculate_duration $start_time

# Check if the 'out' folder exists
if [ ! -d "./out" ]; then
  echo "Error: 'out' folder not found. Build failed."
  exit 1
fi

ls -al
find ./out -type f | wc -l

cd out/
echo $(pwd)
ls -al

# Zip the build
echo "Zipping build..."
start_time=$(date +%s)
# we use compression level = 3 to zip faster
zip -rqX -3 ../build.zip .
cd ../
echo $(pwd)
calculate_duration $start_time

# Upload to AWS Amplify
echo "Uploading to AWS Amplify..."
start_time=$(date +%s)
DEPLOY_DATA=$(aws amplify create-deployment --app-id "$AMPLIFY_APP_ID" --branch-name "production")
JOB_ID=$(echo $DEPLOY_DATA | jq -r '.jobId')
echo "JOB_ID: $JOB_ID"
UPLOAD_URL=$(echo $DEPLOY_DATA | jq -r '.zipUploadUrl')
echo "UPLOAD_URL: $UPLOAD_URL"
echo "Uploading build artifacts..."
curl -T build.zip "$UPLOAD_URL"
calculate_duration $start_time

# Start AWS Amplify deployment
echo "Starting deployment..."
start_time=$(date +%s)
aws amplify start-deployment --app-id "$AMPLIFY_APP_ID" --branch-name "production" --job-id $JOB_ID
echo "Deployment created in Amplify successfully"
calculate_duration $start_time
