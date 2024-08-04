#!/bin/bash

# Install the repository RPM:
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Disable the built-in PostgreSQL module:
sudo dnf -qy module disable postgresql

# Install PostgreSQL:
sudo dnf install -y postgresql16-server

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

# Try to connect to the database and capture error messages
connection_error=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -c "\q" 2>&1)

if [[ $? -eq 0 ]]; then
  echo "Successfully connected to the PostgreSQL database!"
else
  echo "Error: Failed to connect to the PostgreSQL database."
  echo "Details: $connection_error"
fi
