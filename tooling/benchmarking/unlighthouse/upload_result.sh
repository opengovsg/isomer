#!/bin/bash

# Constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
CLOUDFLARE_PAGES_BRANCH="production"

# Check if results directory exists
if [ ! -d "$RESULTS_DIR" ]; then
  echo "Error: Results directory '$RESULTS_DIR' does not exist"
  exit 1
fi

# Get all subdirectories in the results directory
subdirectories=()
for entry in "$RESULTS_DIR"/*; do
  if [ -d "$entry" ]; then
    subdirectories+=("$(basename "$entry")")
  fi
done

# Check if any subdirectories were found
if [ ${#subdirectories[@]} -eq 0 ]; then
  echo "Error: No subdirectories found in '$RESULTS_DIR'"
  exit 1
fi

# Display subdirectories to deploy
echo "Found ${#subdirectories[@]} directories to deploy:"
for dir in "${subdirectories[@]}"; do
  echo "- $dir"
done

# Deploy each subdirectory
success_count=0
failure_count=0

for dir in "${subdirectories[@]}"; do
  project_name="$dir" # Use directory name as project name
  directory_path="$RESULTS_DIR/$dir"

  echo -e "\n\n========================================"
  echo "Deploying '$dir' to Cloudflare Pages project: $project_name"
  echo "Directory path: $directory_path"
  echo "========================================"

  # Deploy the Pages project
  # NOTE: This assumes that the project name is the same as the directory name,
  # and that the project already exists in Cloudflare Pages.
  echo "=== Deploying Pages project ==="
  if npx wrangler pages deploy --branch "$CLOUDFLARE_PAGES_BRANCH" "$directory_path" --project-name "$project_name"; then
    echo -e "\n✅ Deployment of '$dir' successful!"
    ((success_count++))
  else
    echo -e "\n❌ Deployment of '$dir' failed"
    ((failure_count++))
  fi
done

# Print summary
echo -e "\n\n========================================"
echo "Deployment Summary:"
echo "- Total: ${#subdirectories[@]}"
echo "- Successful: $success_count"
echo "- Failed: $failure_count"
echo "========================================"

# Exit with error if any deployments failed
if [ $failure_count -gt 0 ]; then
  exit 1
fi
