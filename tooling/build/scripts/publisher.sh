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

# Use the latest release tag unless one was provided in the env var
if [ -z "$ISOMER_BUILD_REPO_BRANCH" ]; then
  ISOMER_BUILD_REPO_BRANCH=$(curl https://api.github.com/repos/opengovsg/isomer/releases/latest | jq -r '.tag_name')
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
npm run build:template
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

# Publish to S3
echo "Publishing to S3..."
start_time=$(date +%s)

# Set all files to have 10 minutes of cache, except for those in the _next folder
aws s3 sync . s3://$S3_BUCKET_NAME/$SITE_NAME/$CODEBUILD_BUILD_NUMBER/latest --delete --no-progress --cache-control "max-age=600" --exclude "_next/*"

# Set all files in the _next folder to have 1 day of cache
aws s3 sync _next s3://$S3_BUCKET_NAME/$SITE_NAME/$CODEBUILD_BUILD_NUMBER/latest/_next --delete --no-progress --cache-control "max-age=86400"

# Update CloudFront origin path
echo "Updating CloudFront origin path..."
echo "CloudFront distribution ID: $CLOUDFRONT_DISTRIBUTION_ID"
aws cloudfront get-distribution --id $CLOUDFRONT_DISTRIBUTION_ID > distribution.json

ETag=`cat distribution.json | jq -r '.ETag'`
echo "ETag: $ETag"

jq '.Distribution.DistributionConfig' distribution.json > distribution-new.json
jq ".Origins.Items[0].OriginPath = \"/$SITE_NAME/$CODEBUILD_BUILD_NUMBER/latest\"" distribution-new.json > distribution-config.json
aws cloudfront update-distribution --id $CLOUDFRONT_DISTRIBUTION_ID --distribution-config file://distribution-config.json --if-match $ETag
