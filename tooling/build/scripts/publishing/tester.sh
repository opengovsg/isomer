#!/bin/bash

# Extract components from DATABASE_URL2
DATABASE_URL2=${DATABASE_URL2:-""}

if [[ -z "$DATABASE_URL2" ]]; then
  echo "Error: DATABASE_URL2 environment variable is not set."
  exit 1
fi

# Use the URI to extract the username, password, host, port, and database name
regex="^postgres:\/\/([^:]+):([^@]+)@([^:]+):([^\/]+)\/(.+)$"
if [[ $DATABASE_URL2 =~ $regex ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASSWORD="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "Error: DATABASE_URL2 format is incorrect."
  exit 1
fi

# Try to connect to the database
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -c "\q" 2>/dev/null

if [[ $? -eq 0 ]]; then
  echo "Successfully connected to the PostgreSQL database!"
else
  echo "Error: Failed to connect to the PostgreSQL database."
fi
