#!/bin/bash

# Helper function to calculate duration
calculate_duration() {
  start_time=$1
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  echo "Time taken: $duration seconds"
}

# Cloning the repository
echo "Cloning repository..."
start_time=$(date +%s)

# TODO: also add single branch checkout with --branch main
git clone --depth 1 https://github.com/opengovsg/isomer.git
cd isomer/
calculate_duration $start_time

echo $(pwd)

# Checkout specific branch
echo "Checking out branch..."
start_time=$(date +%s)
git checkout 08-03-add_publishing_scripts
calculate_duration $start_time

echo $(git branch)

# Install dependencies
echo "Installing dependencies..."
start_time=$(date +%s)
npm install
calculate_duration $start_time

# Build components
echo "Building components..."
start_time=$(date +%s)
cd packages/components
npm run build
cd ../.. # back to root
echo $(pwd)
calculate_duration $start_time

# Fetch from database
echo "Fetching from database..."
start_time=$(date +%s)
cd tooling/build/scripts/publishing
echo $(pwd)
npm install
npm install ts-node -g
npm run start
calculate_duration $start_time

# Build site
echo "Building site..."
start_time=$(date +%s)
rm -rf ../../../template/schema
mv schema/ ../../../template/
cd ../../../template
echo $(pwd)
npm install

# Prebuild
echo "Prebuilding..."
rm -rf node_modules && rm -rf .next
curl https://raw.githubusercontent.com/opengovsg/isomer/main/tooling/build/scripts/preBuild.sh | bash

# Build
echo "Building..."
rm -rf scripts/
curl https://raw.githubusercontent.com/opengovsg/isomer/main/tooling/build/scripts/build.sh | bash

ls -al
find ./out -type f | wc -l
calculate_duration $start_time

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
DEPLOY_DATA=$(aws amplify create-deployment --app-id "$AMPLIFY_APP_ID" --branch-name "staging")
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
aws amplify start-deployment --app-id "$AMPLIFY_APP_ID" --branch-name "staging" --job-id $JOB_ID
echo "Deployment created in Amplify successfully"
calculate_duration $start_time
