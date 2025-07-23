#!/usr/bin/env bash
# Sets up a tunnel to the RDS instance using AWS Session Manager
# Usage: bash ./scripts/connectRds.sh prod|staging|uat|vapt

if [ -z "$1" ]; then
    echo "Usage: $0 <environment>"
    exit 1
fi

# Validate environment
ENV="$1"
if ! echo "prod staging uat vapt" | grep -w -q "$ENV"; then
    echo "Invalid environment: $ENV. Valid options are: prod, staging, uat, vapt."
    exit 1
fi

# Load environment variables
ENV_FILE=".ssh/.env.$ENV"
if [ ! -f "$ENV_FILE" ]; then
    echo "Environment file $ENV_FILE does not exist."
    exit 1
fi

source "$ENV_FILE"

echo "Connecting to $ENV RDS instance: $DB_HOST"
echo "Once complete, you can connect to the RDS instance on localhost:$DB_PORT"

AUTH_RESULT=$(aws sts get-caller-identity --query 'UserId' --output text --profile $AWS_PROFILE)
EXIT_CODE="$?"  # $? is the exit code of the last statement
if [ $EXIT_CODE == 0 ]; then
    echo "Authenticated as $AUTH_RESULT"
else
    aws sso login --profile $AWS_PROFILE
fi

aws ssm start-session --target $SSM_INSTANCE_TARGET --profile $AWS_PROFILE --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters host=$DB_HOST,portNumber=5432,localPortNumber=$DB_PORT
