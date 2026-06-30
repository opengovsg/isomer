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
  ##### This long command is used to get the latest release tag from the Isomer repository.
  # git ls-remote: Lists references in a remote repository along with their commit hashes.
  # --tags: Lists all tags in the repository.
  # --sort='v:refname': Sorts the tags by version number according to the semantic versioning scheme
  # tail -n1: Gets the last line of the output.
  # awk '{print $2}': Prints the second column of the last line, which is the tag name.
  # sed -E 's|refs/tags/||; s/\^.*$//': Removes the 'refs/tags/' prefix from the tag name.
  # - If tag is annotated (maybe due to signing), the tag name will have a caret (^) and optional text after it.
  ISOMER_BUILD_REPO_BRANCH=$(git ls-remote --tags --sort='v:refname' https://github.com/opengovsg/isomer.git | tail -n1 | awk '{print $2}' | sed -E 's|refs/tags/||; s/\^.*$//')
  IS_USING_RELEASE_TAG=true
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

corepack enable
corepack install -g pnpm@11.5.1

# Use a project-local store only in this CodeBuild job so the S3 tarball is self-contained.
# Do not set storeDir in pnpm-workspace.yaml: local dev keeps the default global store.
pnpm config set store-dir .pnpm-store --location project

### Create a cache key for the current build ###
# Assumption: All production related builds are using release tags e.g. v0.2.1
if [[ -z "$IS_USING_RELEASE_TAG" ]]; then
  # If it's not a release tag, then it's a feature branch so we need to use a unique cache key
  # We use a combination of branch name and commit hash E.g. feat-buildsupercoolfeature-1a2b3c4d
  # This ensures that each unique feature branch and commit will have its own cache,
  # reducing manual cache invalidation and human factor when testing on staging
  UNIQUE_CACHE_KEY="$ISOMER_BUILD_REPO_BRANCH-$(git rev-parse --short HEAD)"
  echo "Unique cache key: $UNIQUE_CACHE_KEY"
else
  UNIQUE_CACHE_KEY=$ISOMER_BUILD_REPO_BRANCH
fi

# Shared S3 dependency cache (same bucket/prefix pattern is used by multiple CodeBuild projects).
# pnpm keeps package bytes in a content-addressable store; `store-dir` is set above for this run only.
# We archive only `.pnpm-store`; `pnpm install` recreates node_modules from the store + lockfile.
TEMPLATE_DEPS_TGZ="isomer-template-deps.tar.zst"
TEMPLATE_DEPS_CACHE_PATH="s3://$S3_CACHE_BUCKET_NAME/$UNIQUE_CACHE_KEY/$TEMPLATE_DEPS_TGZ"
echo "Fetching cached pnpm store..."
aws s3 cp --only-show-errors $TEMPLATE_DEPS_CACHE_PATH $TEMPLATE_DEPS_TGZ || true
if [ -f "$TEMPLATE_DEPS_TGZ" ]; then
  echo "$TEMPLATE_DEPS_TGZ found in cache"
  start_time=$(date +%s)
  tar --use-compress-program=zstd -xf $TEMPLATE_DEPS_TGZ
  rm $TEMPLATE_DEPS_TGZ
  calculate_duration $start_time

  echo "Re-linking workspace from cached store..."
  start_time=$(date +%s)
  pnpm install --frozen-lockfile
  calculate_duration $start_time
else
  echo "$TEMPLATE_DEPS_TGZ not found in cache"
  echo "Installing workspace dependencies..."
  start_time=$(date +%s)
  pnpm install --frozen-lockfile
  calculate_duration $start_time

  echo "Caching pnpm store to S3..."
  start_time=$(date +%s)
  tar --use-compress-program="zstd -6" -cf $TEMPLATE_DEPS_TGZ .pnpm-store
  aws s3 cp --only-show-errors $TEMPLATE_DEPS_TGZ $TEMPLATE_DEPS_CACHE_PATH
  rm $TEMPLATE_DEPS_TGZ
  echo "Cached pnpm store"
  calculate_duration $start_time
fi

# packages/components/dist is gitignored; Next resolves @opengovsg/isomer-components via workspace.
# Cache dist separately from .pnpm-store: restoring plain files does not affect the content-addressable store or node_modules linking.
COMPONENTS_DIST_TGZ="isomer-components-dist.tar.zst"
COMPONENTS_DIST_CACHE_PATH="s3://$S3_CACHE_BUCKET_NAME/$UNIQUE_CACHE_KEY/$COMPONENTS_DIST_TGZ"
echo "Fetching cached isomer-components dist..."
aws s3 cp --only-show-errors $COMPONENTS_DIST_CACHE_PATH $COMPONENTS_DIST_TGZ || true
if [ -f "$COMPONENTS_DIST_TGZ" ]; then
  echo "$COMPONENTS_DIST_TGZ found in cache"
  start_time=$(date +%s)
  mkdir -p packages/components
  tar --use-compress-program=zstd -xf $COMPONENTS_DIST_TGZ -C packages/components
  rm $COMPONENTS_DIST_TGZ
  calculate_duration $start_time
else
  echo "$COMPONENTS_DIST_TGZ not found in cache"
  echo "Building @opengovsg/isomer-components..."
  start_time=$(date +%s)
  pnpm --filter @opengovsg/isomer-components run build
  calculate_duration $start_time

  echo "Caching isomer-components dist to S3..."
  start_time=$(date +%s)
  tar --use-compress-program="zstd -6" -cf $COMPONENTS_DIST_TGZ -C packages/components dist
  aws s3 cp --only-show-errors $COMPONENTS_DIST_TGZ $COMPONENTS_DIST_CACHE_PATH
  rm $COMPONENTS_DIST_TGZ
  echo "Cached isomer-components dist"
  calculate_duration $start_time
fi

# Fetch from database
echo "Fetching from database..."
start_time=$(date +%s)
cd tooling/build/scripts/publishing
echo $(pwd)
pnpm install --frozen-lockfile
pnpm run start
calculate_duration $start_time

# Prebuilding...
echo "Prebuilding site..."
rm -rf ../../../template/schema
rm -rf ../../../template/data
mv schema/ ../../../template/
mv data/ ../../../template/
cp sitemap.json ../../../template/public/
mv sitemap.json ../../../template/
mv redirects.json ../../../template/
# Capture absolute path now; the upload step runs from a different CWD later.
REDIRECTS_JSON="$(realpath ../../../template/redirects.json)"
cd ../../../template
# Create not-found.json by copying _index.json if it doesn't exist
# Refer to tooling/template/app/not-found.tsx for more context
if [ ! -f "schema/not-found.json" ]; then
  echo "Creating not-found.json..."
  cp schema/_index.json schema/not-found.json
fi
echo $(pwd)

# Build
echo "Building..."
start_time=$(date +%s)
pnpm run build:template
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
export S3_SYNC_CONCURRENCY
echo "S3 sync concurrency: $S3_SYNC_CONCURRENCY"
aws configure set default.s3.max_concurrent_requests $S3_SYNC_CONCURRENCY

# Set all files to have 10 minutes of cache, except for those in the _next folder
aws s3 sync --only-show-errors . s3://$S3_BUCKET_NAME/$SITE_NAME/$CODEBUILD_BUILD_NUMBER/latest --delete --no-progress --cache-control "max-age=600" --exclude "_next/*"

# Set all files in the _next folder to be cached indefinitely (1 year) on users' browsers
# Next.js uses unique content hashes in filenames, allowing updated content to have different filenames and invalidate the cache on new builds.
aws s3 sync --only-show-errors _next s3://$S3_BUCKET_NAME/$SITE_NAME/$CODEBUILD_BUILD_NUMBER/latest/_next --delete --no-progress --cache-control "max-age=31536000, public"

calculate_duration $start_time

# Upload redirect objects AFTER the --delete sync so they are not swept away.
# Each redirect becomes an empty index.html with x-amz-meta-redirect-destination metadata
# that the CloudFront Function reads to issue the HTTP redirect response.
start_time=$(date +%s)
echo "Uploading redirect files to S3..."
(
  cd ../../build/scripts/publishing
  pnpm exec tsx uploadRedirects.ts \
    --redirects-json "$REDIRECTS_JSON" \
    --s3-bucket-name "$S3_BUCKET_NAME" \
    --site-name "$SITE_NAME" \
    --build-number "$CODEBUILD_BUILD_NUMBER" \
    --concurrency "$S3_SYNC_CONCURRENCY"
) || echo "Warning: some redirects failed to upload, continuing..."

calculate_duration $start_time

# Update CloudFront origin path
echo "Updating CloudFront origin path..."
echo "CloudFront distribution ID: $CLOUDFRONT_DISTRIBUTION_ID"
aws cloudfront get-distribution --id $CLOUDFRONT_DISTRIBUTION_ID >distribution.json

ETag=$(cat distribution.json | jq -r '.ETag')
echo "ETag: $ETag"

jq '.Distribution.DistributionConfig' distribution.json >distribution-new.json
jq ".Origins.Items[0].OriginPath = \"/$SITE_NAME/$CODEBUILD_BUILD_NUMBER/latest\"" distribution-new.json >distribution-config.json

# Temporarily disable set -e so we can inspect the exit code and error message before deciding
# whether to fail or warn. Re-enabled immediately after the command.
set +e
UPDATE_DISTRIBUTION_OUTPUT=$(aws cloudfront update-distribution --id $CLOUDFRONT_DISTRIBUTION_ID --distribution-config file://distribution-config.json --if-match $ETag 2>&1)
UPDATE_DISTRIBUTION_EXIT_CODE=$?
set -e

if [ $UPDATE_DISTRIBUTION_EXIT_CODE -ne 0 ]; then
  # PreconditionFailed means the ETag we read no longer matches the distribution's current ETag,
  # i.e. someone updated the distribution between our get-distribution and update-distribution calls.
  # This can happen legitimately when two builds run concurrently for the same site and the other
  # build won the race. In that case it's safe to skip our update — but only if the distribution
  # already points to a build that is at least as new as ours. If the current origin path is older
  # or unrecognised (e.g. a manual or IaC change), we still want to fail loudly so the operator
  # knows our build's content is not being served.
  if echo "$UPDATE_DISTRIBUTION_OUTPUT" | grep -q "PreconditionFailed"; then
    # Re-fetch the distribution to see what origin path won the race.
    CURRENT_ORIGIN_PATH=$(aws cloudfront get-distribution --id $CLOUDFRONT_DISTRIBUTION_ID \
      | jq -r '.Distribution.DistributionConfig.Origins.Items[0].OriginPath')
    echo "PreconditionFailed: current origin path is $CURRENT_ORIGIN_PATH"

    # Extract the build number from the current origin path (format: /<site>/<build>/latest).
    # The anchored pattern returns an empty string for any path that does not strictly match
    # /<site>/<digits>/latest (e.g. a path missing /latest, or from a different site), which
    # causes the numeric check below to fail and the build to exit loudly as intended.
    CURRENT_BUILD_NUMBER=$(echo "$CURRENT_ORIGIN_PATH" | sed -n "s|^/$SITE_NAME/\([0-9]\+\)/latest$|\1|p")

    # Only skip if the winning update already points to a newer-or-equal build for this site.
    # A non-numeric result means the path is in an unexpected format (manual change, wrong site,
    # etc.) and we should not silently accept it.
    if [[ "$CURRENT_BUILD_NUMBER" =~ ^[0-9]+$ ]] && [ "$CURRENT_BUILD_NUMBER" -ge "$CODEBUILD_BUILD_NUMBER" ]; then
      echo "Warning: CloudFront already points to build $CURRENT_BUILD_NUMBER (>= ours: $CODEBUILD_BUILD_NUMBER). Concurrent build won the race — skipping update."
    else
      echo "Error: PreconditionFailed but current origin path ($CURRENT_ORIGIN_PATH) does not point to a newer build. A non-build update may have occurred. Manual inspection required."
      exit 1
    fi
  else
    # Any other AWS error should still fail the build.
    echo "$UPDATE_DISTRIBUTION_OUTPUT"
    exit $UPDATE_DISTRIBUTION_EXIT_CODE
  fi
fi
