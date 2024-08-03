#!/bin/bash
# run recursive.ts
git clone https://github.com/opengovsg/isomer.git
cd isomer/

echo $(pwd)

# TODO: remove later
git checkout 08-03-add_publishing_scripts

echo $(git branch)

npm install

cd packages/components
npm run build
cd ../.. # back to root
echo $(pwd)

# Fetch from database
cd tooling/build/scripts/publishing
echo $(pwd)
npm install
npm install ts-node -g
npm run start

# Build site
# TODO: Fix the schemas for data
# mv data/ isomer/tooling/template/data/
rm -rf ../../../template/schema/
mv schema/ ../../../template/
cd ../../../template
echo $(pwd)
npm install

# prebuild
rm -rf node_modules && rm -rf .next
curl https://raw.githubusercontent.com/opengovsg/isomer/main/tooling/build/scripts/preBuild.sh | bash

# build
rm -rf scripts/
curl https://raw.githubusercontent.com/opengovsg/isomer/main/tooling/build/scripts/build.sh | bash

ls -al
find ./out -type f | wc -l

cd out/
echo $(pwd)
ls -al

# zip
zip -r ../build.zip .
cd ../
echo $(pwd)

# upload to amplify
echo "Creating deployment in AWS Amplify..."
DEPLOY_DATA=$(aws amplify create-deployment --app-id "$AMPLIFY_APP_ID" --branch-name "staging")
JOB_ID=$(echo $DEPLOY_DATA | jq -r '.jobId')
echo "JOB_ID: $JOB_ID"
UPLOAD_URL=$(echo $DEPLOY_DATA | jq -r '.zipUploadUrl')
echo "UPLOAD_URL: $UPLOAD_URL"
echo "Uploading build artifacts..."
curl -T build.zip "$UPLOAD_URL"

# start amplify deployment
echo "Starting deployment..."
aws amplify start-deployment --app-id "$AMPLIFY_APP_ID" --branch-name "staging" --job-id $JOB_ID
echo "Deployment created in Amplify successfully"
