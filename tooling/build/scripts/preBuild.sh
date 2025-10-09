#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -x

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
fi

# Store the current directory
ISOMER_REPO_DIRECTORY=$(pwd)

# Cloning the repository
echo "Cloning central repository..."
start_time=$(date +%s)

cd ../
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
npm i sherif

# Install dependencies
echo "Installing dependencies..."
start_time=$(date +%s)
npm i
echo "Dependencies installed"
calculate_duration $start_time

# Build components
echo "Building components..."
start_time=$(date +%s)
cd packages/components
npm run build
