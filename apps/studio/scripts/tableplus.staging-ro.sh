#!/bin/bash
export PATH=/opt/homebrew/bin:$PATH
export AWS_PROFILE=isomer-staging

export DB_HOST=isomer-next-infra-stg-rds-cluster.cluster-cj8cu24qah7f.ap-southeast-1.rds.amazonaws.com
export DB_USER=jiachin_ro

CODE=$(
  aws rds generate-db-auth-token \
    --hostname $DB_HOST \
    --port 5432 \
    --username $DB_USER
)

printf '%s' "$CODE"
