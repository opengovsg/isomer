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

# Downloads $2 from S3 path $1 and extracts it into $3 (default: cwd), removing the
# local tarball afterwards. Returns 1 - without tripping `set -e` - if the object
# isn't in S3; callers decide whether that's a fallback or a fatal error.
fetch_cached() {
  local cache_path=$1 tarball=$2 extract_dir=${3:-.} start_time
  echo "Fetching $tarball from cache..."
  aws s3 cp --only-show-errors "$cache_path" "$tarball" || true
  if [ ! -f "$tarball" ]; then
    echo "$tarball not found in cache ($cache_path)"
    return 1
  fi
  echo "$tarball found in cache ($cache_path)"
  start_time=$(date +%s)
  mkdir -p "$extract_dir"
  tar --use-compress-program=zstd -xf "$tarball" -C "$extract_dir"
  rm "$tarball"
  calculate_duration "$start_time"
}

# Archives $3+ (passed straight through to `tar -c`) into $2 and uploads it to S3 path $1.
cache_upload() {
  local cache_path=$1 tarball=$2 start_time
  shift 2
  echo "Caching $tarball to S3..."
  start_time=$(date +%s)
  tar --use-compress-program="zstd -6" -cf "$tarball" "$@"
  aws s3 cp --only-show-errors "$tarball" "$cache_path"
  rm "$tarball"
  calculate_duration "$start_time"
}

REPO_TGZ="isomer.tar.zst"
STORE_TGZ="isomer-pnpm-store.tar.zst"
TEMPLATE_DEPS_TGZ="isomer-template-deps.tar.zst"
COMPONENTS_DIST_TGZ="isomer-components-dist.tar.zst"

# Cloning the repository
echo "Cloning central repository..."
start_time=$(date +%s)

# NOTE: if no build repo branch was provided,
# we will assume this is production and just clone from the bucket
if [ -z "$ISOMER_BUILD_REPO_BRANCH" ]; then
  fetch_cached "s3://$S3_CACHE_BUCKET_NAME/isomer/latest/$REPO_TGZ" "$REPO_TGZ" ||
    { echo "Error: $REPO_TGZ not found in production cache"; exit 1; }
  cd isomer/

  # isomer.tar.zst is source-only (see build-components.yml); the pnpm store is archived
  # separately, keyed by the commit SHA recorded in .isomer-build-sha rather than
  # "latest" so it's shared across every ref that happens to point at the same
  # commit. It's relinked into node_modules below, once pnpm is configured.
  GIT_SHA=$(cat .isomer-build-sha)
  fetch_cached "s3://$S3_CACHE_BUCKET_NAME/isomer/$GIT_SHA/$STORE_TGZ" "$STORE_TGZ" ||
    { echo "Error: $STORE_TGZ not found for commit $GIT_SHA"; exit 1; }
else
  # A manual/test build-components.yml run for this branch may have already archived
  # and published the repository to this ref-scoped prefix; reuse it if present instead
  # of re-cloning and re-installing from scratch.
  REPO_CACHE_PATH="s3://$S3_CACHE_BUCKET_NAME/isomer/refs/$ISOMER_BUILD_REPO_BRANCH/$REPO_TGZ"
  if fetch_cached "$REPO_CACHE_PATH" "$REPO_TGZ"; then
    cd isomer/
  else
    git clone --depth 1 --branch "$ISOMER_BUILD_REPO_BRANCH" https://github.com/opengovsg/isomer.git
    cd isomer/
    # Checkout specific branch
    echo "Checking out branch..."
    git checkout "$ISOMER_BUILD_REPO_BRANCH"
  fi
fi

calculate_duration "$start_time"

pwd

corepack enable
corepack install -g pnpm@11.5.1

# Use a project-local store only in this CodeBuild job so the S3 tarball is self-contained.
# Do not set storeDir in pnpm-workspace.yaml: local dev keeps the default global store.
pnpm config set store-dir .pnpm-store --location project

if [[ -n "$ISOMER_BUILD_REPO_BRANCH" ]]; then
  ### Create a cache key for the current build ###
  # It's a feature branch, so use a combination of branch name and commit hash
  # E.g. feat-buildsupercoolfeature-1a2b3c4d. This ensures that each unique
  # feature branch and commit will have its own cache, reducing manual cache
  # invalidation and human factor when testing on staging.
  # A ref-scoped cache hit above extracts an archive with no .git (build-components.yml
  # excludes it), so `git rev-parse` would fail there; use the commit it recorded
  # instead. The git-clone fallback has no such file but does have .git.
  if [ -f ".isomer-build-sha" ]; then
    COMMIT_SHA=$(cat .isomer-build-sha)
  else
    COMMIT_SHA=$(git rev-parse HEAD)
  fi
  UNIQUE_CACHE_KEY="$ISOMER_BUILD_REPO_BRANCH-$COMMIT_SHA"
  echo "Unique cache key: $UNIQUE_CACHE_KEY"

  # Try the commit-scoped store build-components.yml may have already published for this
  # exact commit (shared across every ref pointing at it, produced on every run whether
  # production or ref-scoped), then fall back to this branch's own cache from a previous
  # run. `pnpm install` below recreates node_modules from whichever store was restored -
  # cheap when one was, a real registry install when neither was found.
  TEMPLATE_DEPS_CACHE_PATH="s3://$S3_CACHE_BUCKET_NAME/$UNIQUE_CACHE_KEY/$TEMPLATE_DEPS_TGZ"
  RESTORED_STORE=0
  fetch_cached "s3://$S3_CACHE_BUCKET_NAME/isomer/$COMMIT_SHA/$STORE_TGZ" "$STORE_TGZ" && RESTORED_STORE=1
  if [ "$RESTORED_STORE" -eq 0 ]; then
    fetch_cached "$TEMPLATE_DEPS_CACHE_PATH" "$TEMPLATE_DEPS_TGZ" && RESTORED_STORE=1
  fi

  echo "Installing workspace dependencies..."
  start_time=$(date +%s)
  pnpm install --frozen-lockfile
  calculate_duration "$start_time"

  if [ "$RESTORED_STORE" -eq 0 ]; then
    cache_upload "$TEMPLATE_DEPS_CACHE_PATH" "$TEMPLATE_DEPS_TGZ" .pnpm-store
  fi
else
  # Production path: build-components.yml already populated the pnpm store and
  # archived it alongside the repository (fetched above); relink node_modules
  # from it here - cheap since every package is already in the store, no
  # registry hits needed. Key the (still necessary) isomer-components dist
  # cache by the actual release ref that build-components.yml resolved and
  # recorded in the archive, not a fixed "latest" string - otherwise every
  # release after the first would silently reuse an older release's stale
  # dist build.
  echo "Re-linking workspace from cached store..."
  start_time=$(date +%s)
  pnpm install --frozen-lockfile
  calculate_duration "$start_time"

  UNIQUE_CACHE_KEY=$(cat .isomer-release-ref)
fi

# packages/components/dist is gitignored; Next resolves @opengovsg/isomer-components via workspace.
# Cache dist separately from .pnpm-store: restoring plain files does not affect the content-addressable store or node_modules linking.
COMPONENTS_DIST_CACHE_PATH="s3://$S3_CACHE_BUCKET_NAME/$UNIQUE_CACHE_KEY/$COMPONENTS_DIST_TGZ"
if ! fetch_cached "$COMPONENTS_DIST_CACHE_PATH" "$COMPONENTS_DIST_TGZ" packages/components; then
  echo "Building @opengovsg/isomer-components..."
  start_time=$(date +%s)
  pnpm --filter @opengovsg/isomer-components run build
  calculate_duration "$start_time"

  cache_upload "$COMPONENTS_DIST_CACHE_PATH" "$COMPONENTS_DIST_TGZ" -C packages/components dist
fi

# Fetch from database
echo "Fetching from database..."
start_time=$(date +%s)
cd tooling/build/scripts/publishing
pwd
pnpm install --frozen-lockfile
pnpm run start
calculate_duration "$start_time"

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
pwd

# Build
echo "Building..."
start_time=$(date +%s)
pnpm run build:template
calculate_duration "$start_time"

# Check if the 'out' folder exists
if [ ! -d "./out" ]; then
  echo "Error: 'out' folder not found. Build failed."
  exit 1
fi

ls -al
find ./out -type f | wc -l

cd out/
pwd
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
aws s3 sync --only-show-errors . s3://"$S3_BUCKET_NAME"/"$SITE_NAME"/"$CODEBUILD_BUILD_NUMBER"/latest --delete --no-progress --cache-control "max-age=600" --exclude "_next/*"

# Set all files in the _next folder to be cached indefinitely (1 year) on users' browsers
# Next.js uses unique content hashes in filenames, allowing updated content to have different filenames and invalidate the cache on new builds.
aws s3 sync --only-show-errors _next s3://"$S3_BUCKET_NAME"/"$SITE_NAME"/"$CODEBUILD_BUILD_NUMBER"/latest/_next --delete --no-progress --cache-control "max-age=31536000, public"

calculate_duration "$start_time"

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

calculate_duration "$start_time"

# Update CloudFront origin path
echo "Updating CloudFront origin path..."
echo "CloudFront distribution ID: $CLOUDFRONT_DISTRIBUTION_ID"
aws cloudfront get-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" >distribution.json

ETag=$(cat distribution.json | jq -r '.ETag')
echo "ETag: $ETag"

jq '.Distribution.DistributionConfig' distribution.json >distribution-new.json
jq ".Origins.Items[0].OriginPath = \"/$SITE_NAME/$CODEBUILD_BUILD_NUMBER/latest\"" distribution-new.json >distribution-config.json
aws cloudfront update-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --distribution-config file://distribution-config.json --if-match "$ETag"
