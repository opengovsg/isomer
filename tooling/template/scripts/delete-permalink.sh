#!/bin/bash

PERMALINK_DIR="$(dirname "$0")/../app/[[...permalink]]"

if [ -d "$PERMALINK_DIR" ]; then
  rm -rf "$PERMALINK_DIR"
  echo "Successfully deleted: $PERMALINK_DIR"
else
  echo "Directory does not exist: $PERMALINK_DIR"
fi

