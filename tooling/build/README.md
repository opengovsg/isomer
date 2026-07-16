# Isomer Next Build Scripts

This repository contains the build scripts for Isomer Next.

For more information, please visit [the Isomer product website](https://www.isomer.gov.sg).

## Publishing `publisher.sh` to S3

`scripts/publisher.sh` is fetched from S3 by our CodeBuild static-site
publishers, which keeps the build pipeline from depending on GitHub being
reachable. The copy in S3 is kept in sync automatically by the
[`Deploy publisher script`](../../.github/workflows/deploy_publisher_script.yml)
workflow, which uploads the script on every release (and on manual dispatch)
whenever its contents differ from the object already in S3.

See the workflow file for the GitHub Environment variables it expects.
