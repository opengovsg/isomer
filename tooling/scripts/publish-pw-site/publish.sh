# NOTE: this is for mlaw-corp
# TODO: extend it to other sites
BUCKET_NAME="DO-NOT-PUBLISH-mlaw-corp"
CODEBUILD_NAME="DO-NOT-USE-mlaw-corp"
APP_ID="d1a5yc1znm4vf6"

# start the build and wait for it to complete
aws codebuild start-build --project-name "$CODEBUILD_NAME"
sleep 5m

# get the largest build number
LARGEST=$(aws s3 ls s3://isomer-next-infra-prod-sites-bucket-private-3d656b2/$BUCKET_NAME/ | grep 'PRE' | grep -oE '[0-9]+' | sort -n | tail -1)
echo "Largest: $LARGEST"

# download it to local folder
LOCAL_FOLDER="$BUCKET_NAME/$LARGEST" # eg: /DO-NOT-USE-mlaw-corp/12
echo "$LOCAL_FOLDER"
aws s3 sync s3://isomer-next-infra-prod-sites-bucket-private-3d656b2/"$BUCKET_NAME"/"$LARGEST"/latest/ "./sites/$LOCAL_FOLDER"

OUTPUT_FILE="$BUCKET_NAME"_"$LARGEST".zip
# zip and upload to amplify
cd "./sites/$LOCAL_FOLDER"
zip -r "$OUTPUT_FILE" "."

BRANCH="staging"

# Create deployment and get upload URL
DEPLOYMENT=$(aws amplify create-deployment \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --query '{jobId: jobId, uploadUrl: zipUploadUrl}' \
  --output json)
JOB_ID=$(echo "$DEPLOYMENT" | jq -r '.jobId')
UPLOAD_URL=$(echo "$DEPLOYMENT" | jq -r '.uploadUrl')

# Upload zip file to the URL
curl -X PUT "$UPLOAD_URL" \
  --upload-file "$OUTPUT_FILE" \
  -H "Content-Type: application/zip"

# Start the deployment
aws amplify start-deployment \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --job-id "$JOB_ID"
echo "Deployment started with job ID: $JOB_ID"

cd ../../..
