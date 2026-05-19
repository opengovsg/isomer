#!/bin/bash
# Post-edit hook: runs lint and format on changed files
# This script receives JSON input on stdin from Claude Code

set -e

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path')

# Skip if no file path
if [ -z "$FILE_PATH" ] || [ "$FILE_PATH" = "null" ]; then
  exit 0
fi

# Only process files that exist and are relevant code files
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Check file extension - only lint/format relevant files
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.css|*.scss|*.md)
    ;;
  *)
    # Skip non-code files
    exit 0
    ;;
esac

# Change to project root (where pnpm commands should run)
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# Run format first (oxfmt), then lint (oxlint)
# Using --ignore-unknown to skip files that the tools don't understand
pnpm exec oxfmt --write "$FILE_PATH" 2>/dev/null || true
pnpm exec oxlint --fix "$FILE_PATH" 2>/dev/null || true

exit 0
