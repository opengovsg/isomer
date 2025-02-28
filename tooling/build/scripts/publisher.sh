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
echo "Cloning central repository..."
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

# Perform a clean of npm cache
npm cache clean --force

# Try to fetch cached node_modules from S3
echo "Fetching cached node_modules..."
NODE_MODULES_CACHE_PATH="s3://$S3_CACHE_BUCKET_NAME/$ISOMER_BUILD_REPO_BRANCH/isomer/node_modules.tar.gz"
aws s3 cp $NODE_MODULES_CACHE_PATH node_modules.tar.gz || true
if [ -f "node_modules.tar.gz" ]; then
  echo "node_modules.tar.gz found in cache"

  echo "Using cached node_modules"
  start_time=$(date +%s)
  tar -xzf node_modules.tar.gz
  rm node_modules.tar.gz
  calculate_duration $start_time
else
  echo "node_modules.tar.gz not found in cache"

  echo "Installing dependencies..."
  start_time=$(date +%s)
  npm ci
  calculate_duration $start_time

  echo "Caching node_modules..."
  start_time=$(date +%s)
  tar -czf node_modules.tar.gz node_modules/
  aws s3 cp node_modules.tar.gz $NODE_MODULES_CACHE_PATH
  rm node_modules.tar.gz
  echo "Cached node_modules"
  calculate_duration $start_time
fi

# Fetch from database
echo "Fetching from database..."
start_time=$(date +%s)
cd tooling/build/scripts/publishing
echo $(pwd)
npm ci
npm run start
calculate_duration $start_time

# Prebuilding...
echo "Prebuilding site..."
rm -rf ../../../template/schema
rm -rf ../../../template/data
mv schema/ ../../../template/
mv data/ ../../../template/
cp sitemap.json ../../../template/public/
mv sitemap.json ../../../template/
cd ../../../template
# Create not-found.json by copying _index.json if it doesn't exist
# Refer to tooling/template/app/not-found.tsx for more context
if [ ! -f "schema/not-found.json" ]; then
  echo "Creating not-found.json..."
  cp schema/_index.json schema/not-found.json
fi
echo $(pwd)
echo "Fetching cached tooling-template node_modules..."
TOOLING_TEMPLATE_NODE_MODULES_CACHE_PATH="s3://$S3_CACHE_BUCKET_NAME/$ISOMER_BUILD_REPO_BRANCH/isomer-tooling-template/node_modules.tar.gz"
aws s3 cp $TOOLING_TEMPLATE_NODE_MODULES_CACHE_PATH node_modules.tar.gz || true
if [ -f "node_modules.tar.gz" ]; then
  echo "node_modules.tar.gz found in cache"

  echo "Using cached node_modules"
  start_time=$(date +%s)
  tar -xzf node_modules.tar.gz
  rm node_modules.tar.gz
  calculate_duration $start_time
else
  echo "node_modules.tar.gz not found in cache"

  # Build components
  echo "Building components..."
  start_time=$(date +%s)
  cd ../../packages/components # from tooling/template
  npm run build
  mv opengovsg-isomer-components-0.0.13.tgz ../../tooling/template/
  echo $(pwd)
  cd ../.. # back to root
  calculate_duration $start_time

  echo "Installing dependencies..."
  cd tooling/template
  start_time=$(date +%s)
  npm ci
  calculate_duration $start_time

  echo "Prebuilding..."
  start_time=$(date +%s)
  rm -rf node_modules && rm -rf .next
  npm i opengovsg-isomer-components-0.0.13.tgz
  calculate_duration $start_time

  echo "Caching node_modules..."
  start_time=$(date +%s)
  tar -czf node_modules.tar.gz node_modules/
  aws s3 cp node_modules.tar.gz $TOOLING_TEMPLATE_NODE_MODULES_CACHE_PATH
  rm node_modules.tar.gz
  echo "Cached node_modules"
  calculate_duration $start_time
fi

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

NUMBER_OF_CORES=$(nproc)
echo "Number of cores: $NUMBER_OF_CORES"

# Set the number of concurrent S3 sync operations
S3_SYNC_CONCURRENCY=$((4 * NUMBER_OF_CORES))                                   # 4x is an arbitrary number that should work well for most cases
S3_SYNC_CONCURRENCY=$((S3_SYNC_CONCURRENCY < 20 ? 10 : S3_SYNC_CONCURRENCY))   # Minimum of 20
S3_SYNC_CONCURRENCY=$((S3_SYNC_CONCURRENCY > 100 ? 100 : S3_SYNC_CONCURRENCY)) # Maximum of 100 (to prevent AWS from throttling us)
echo "S3 sync concurrency: $S3_SYNC_CONCURRENCY"
aws configure set default.s3.max_concurrent_requests $S3_SYNC_CONCURRENCY

# Set all files to have 10 minutes of cache, except for those in the _next folder
aws s3 sync . s3://$S3_BUCKET_NAME/$SITE_NAME/$CODEBUILD_BUILD_NUMBER/latest --delete --no-progress --cache-control "max-age=600" --exclude "_next/*"

# Set all files in the _next folder to be cached indefinitely (1 year) on users' browsers
# Next.js uses unique content hashes in filenames, allowing updated content to have different filenames and invalidate the cache on new builds.
aws s3 sync _next s3://$S3_BUCKET_NAME/$SITE_NAME/$CODEBUILD_BUILD_NUMBER/latest/_next --delete --no-progress --cache-control "max-age=31536000, public"

calculate_duration $start_time

# Update CloudFront origin path
echo "Updating CloudFront origin path..."
echo "CloudFront distribution ID: $CLOUDFRONT_DISTRIBUTION_ID"
aws cloudfront get-distribution --id $CLOUDFRONT_DISTRIBUTION_ID >distribution.json

ETag=$(cat distribution.json | jq -r '.ETag')
echo "ETag: $ETag"

jq '.Distribution.DistributionConfig' distribution.json >distribution-new.json
jq ".Origins.Items[0].OriginPath = \"/$SITE_NAME/$CODEBUILD_BUILD_NUMBER/latest\"" distribution-new.json >distribution-config.json
aws cloudfront update-distribution --id $CLOUDFRONT_DISTRIBUTION_ID --distribution-config file://distribution-config.json --if-match $ETag
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
