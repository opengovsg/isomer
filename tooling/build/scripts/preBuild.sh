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

# Use the release branch unless one was provided in the env var
if [ -z "$ISOMER_BUILD_REPO_BRANCH" ]; then
  ISOMER_BUILD_REPO_BRANCH="release"
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
