# Publish `@opengovsg/isomer-components` to the S3 build cache on release

The compiled `packages/components` `dist` is uploaded to the shared S3 build cache by a GitHub Actions workflow (`.github/workflows/publish_components.yml`) whenever a release is published. Site builds (`tooling/build/scripts/publisher.sh`, run in CodeBuild) then **restore** that artifact from the cache instead of compiling the package themselves. The build-and-cache branch already present in `publisher.sh` is kept only as a cold-cache fallback (e.g. feature-branch builds).

## Context

Previously, the first site build for a new release found a cold cache and had to build `@opengovsg/isomer-components` itself before caching the result for subsequent builds. That put the components compile on a site build's critical path and made site builds depend on cloning/compiling the package from GitHub source. This publishes the artifact once, up front, from a controlled pipeline.

The cache object contract that must be preserved:

- **Object key:** `s3://$S3_CACHE_BUCKET_NAME/<cache-key>/isomer-components-dist.tar.zst`
- **Cache key:** the release tag (e.g. `v0.2.1`). This matches `UNIQUE_CACHE_KEY` in `publisher.sh` for release builds.
- **Archive layout:** a zstd-compressed tar rooted at `dist/`, created from within `packages/components` (`tar --use-compress-program="zstd -6" -cf … -C packages/components dist`), so `publisher.sh` can extract it into `packages/components`.

## Considered Options

- **Keep building components in the first site build (status quo)** — rejected: puts the compile on the site build's critical path and relies on building from GitHub source per release.
- **Publish the package to the GitHub npm registry and consume it as a versioned dependency** — larger change to the Studio ↔ components workflow contract; does not remove the S3-cache round trip that site builds already use.
- **Pre-build on GitHub Actions and push the `dist` tarball into the existing S3 cache (chosen)** — smallest change that fits the existing `publisher.sh` cache-fetch path; the site build simply finds a warm cache.

## Consequences

- The publish is triggered on `release: [released]` (matching the production/UAT deploy triggers) plus a manual `workflow_dispatch` for backfilling a specific tag.
- `publisher.sh` is unchanged behaviourally: it still fetches from the cache first and only falls back to building when the object is absent. Prerelease tags and feature branches (not covered by the `released` trigger) therefore keep working via the fallback.
- The workflow builds with `pnpm --filter @opengovsg/isomer-components run build:module`, the same dist-producing build the CI bundle-size job uses.

## Required infrastructure setup

The workflow reads two **repository variables** (Settings → Secrets and variables → Actions → Variables) so account-specific identifiers are not hardcoded:

| Variable | Value |
| --- | --- |
| `S3_CACHE_BUCKET_NAME` | The same bucket CodeBuild reads via `S3_CACHE_BUCKET_NAME`. |
| `COMPONENTS_CACHE_PUBLISH_ROLE_ARN` | ARN of an IAM role the workflow assumes via GitHub OIDC. |

The IAM role must:

- Trust GitHub's OIDC provider, scoped to this repository (and ideally to the `release`/tag ref), mirroring the existing `isomer-next-infra-<env>-deploy-role` trust policy.
- Allow `s3:PutObject` on `arn:aws:s3:::<S3_CACHE_BUCKET_NAME>/*` (write to the cache prefix).

The workflow fails fast with a clear error if either variable is unset.

## Workflow reference

The pipeline lives at `.github/workflows/publish_components.yml`:

```yaml
name: Publish components to S3 cache

concurrency:
  group: publish-components-${{ github.event.release.tag_name || inputs.cache-key }}
  cancel-in-progress: false

on:
  release:
    types:
      - released
  workflow_dispatch:
    inputs:
      cache-key:
        description: "Git tag to build and S3 cache key to publish under (e.g. v0.2.1)"
        required: true
        type: string

permissions:
  id-token: write # required for AWS OIDC federation
  contents: read

jobs:
  publish-components:
    name: Build and publish components
    runs-on: ubuntu-latest
    env:
      AWS_REGION: "ap-southeast-1"
      CACHE_BUCKET: ${{ vars.S3_CACHE_BUCKET_NAME }}
      PUBLISH_ROLE_ARN: ${{ vars.COMPONENTS_CACHE_PUBLISH_ROLE_ARN }}
      CACHE_KEY: ${{ github.event.release.tag_name || inputs.cache-key }}
      COMPONENTS_DIST_TGZ: isomer-components-dist.tar.zst
    steps:
      - name: Validate configuration
        run: |
          if [ -z "$CACHE_BUCKET" ]; then
            echo "::error::Repository variable S3_CACHE_BUCKET_NAME is not set."
            exit 1
          fi
          if [ -z "$PUBLISH_ROLE_ARN" ]; then
            echo "::error::Repository variable COMPONENTS_CACHE_PUBLISH_ROLE_ARN is not set."
            exit 1
          fi

      - name: Checkout source code
        uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
        with:
          ref: ${{ env.CACHE_KEY }}

      - name: Setup
        uses: ./.github/actions/setup

      - name: Build @opengovsg/isomer-components
        run: pnpm --filter @opengovsg/isomer-components run build:module

      - name: Archive dist
        run: tar --use-compress-program="zstd -6" -cf "$COMPONENTS_DIST_TGZ" -C packages/components dist

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@254c19bd240aabef8777f48595e9d2d7b972184b # v6.2.1
        with:
          role-to-assume: ${{ env.PUBLISH_ROLE_ARN }}
          role-session-name: github-action-publish-components
          aws-region: ${{ env.AWS_REGION }}

      - name: Upload dist to S3 cache
        run: |
          aws s3 cp --only-show-errors "$COMPONENTS_DIST_TGZ" \
            "s3://$CACHE_BUCKET/$CACHE_KEY/$COMPONENTS_DIST_TGZ"
          echo "Published components dist to s3://$CACHE_BUCKET/$CACHE_KEY/$COMPONENTS_DIST_TGZ"
```
