# Isomer Admin Scripts

Admin tooling scripts for managing Isomer sites, resources, and content.

## Prerequisites

1. Run `pnpm install` from the repository root.
2. Copy `.env.example` to `.env` and fill in the required values.
3. For scripts that access the database, run `pnpm run db:connect` before starting.

## Usage

From the `tooling/scripts` directory:

```sh
pnpm run isomer-admin
```

Select a script from the interactive menu.

## Scripts

### Add Isomer Collaborators

Adds Isomer admins and migrators as collaborators to sites. Accepts either a single site ID or `all:<minSiteId>` to add collaborators to all sites from that ID onwards. Creates users in the database if they don't already exist.

### Bulk Upload Assets

Prepares assets for S3 upload. Reads files from `./input`, assigns a random UUID to each, copies them to `./output/{siteId}/{uuid}/{filename}`, and generates a `{siteId}-file-mapping.csv` with the original-to-new path mapping.

**NOTE:** This requires you to place the files inside `./input` first before running.

### Export Individual JSONs

Exports JSON blobs for a set of resource IDs from the database. Fetches both draft and published versions, excludes Folder, Collection, and IndexPage types, and saves each as `{id}.json` in `./output`.

**NOTE:** Adjust the script directly if you need the output file name to be in a different format (e.g. permalink instead of IDs).

### Export Site JSONs

Exports all JSON blobs for a given site ID from the database. Fetches both draft and published versions, excludes Folder and Collection types, and saves each as `{id}.json` in `./output`.

**NOTE:** Adjust the script directly if you need the output file name to be in a different format (e.g. permalink instead of IDs).

### Extract Folder JSONs

Exports JSON blobs for all children of a given parent resource ID (a Folder or Collection). Excludes nested Folder, Collection, and IndexPage types. Saves each as `{id}.json` in `./output`.

**NOTE:** Adjust the script directly if you need the output file name to be in a different format (e.g. permalink instead of IDs).

### Find Invalid Schema

Validates JSON blobs against the Isomer Next page schema. Supports two modes: checking all resources in the database, or validating local JSON files in a directory. Results are written to `invalid-schema.txt`.

### Import Folder JSONs

Imports JSON files from `./input` to update existing resources in the database. Matches resources by ID extracted from the filename (`{id}.json`). Optionally publishes the updated resources. Looks up the publisher by email address.

**NOTE:** This requires you to place the files inside `./input` first before running.

### Publish Site Resources

Publishes all draft resources for a given site ID in the database. Lists matching resources for review before confirming. For each resource, creates a new Version record and transitions the resource state from Draft to Published.

**Use case:** Pre-launch assistance — when an agency needs all their content published live at once and requires admin help to do so.

### Rebuild All CodeBuild Projects

Lists all AWS CodeBuild projects in a selected region, sorts them alphabetically, and starts a build for each project. The script can be run as a dry run to show project indexes first, then resumed from a specific index if a previous run stops midway.

### Repair Gazette Search Records

Re-submits gazette **Search Records** to the shared egazette Algolia index. The operator supplies gazette resource IDs; the script resolves each one, lists the repairable gazettes for review, and (after a single confirmation) processes them serially. For each gazette it fetches the live PDF from S3, strips the `scheduledAt` object tag so the PDF stays publicly viewable, rebuilds the Search Records, then deletes the gazette's existing records by **Object Group** and saves the fresh ones. Deleting first makes the operation idempotent and self-healing even when the PDF now yields fewer chunks than before. Unresolvable or non-gazette IDs are flagged and skipped; per-gazette failures are logged and do not stop the run.

**Use case:** Incident response — when a batch of gazettes ends up with missing or stale Search Records in Algolia (e.g. the ingestion cron misfired), use this to re-submit the affected gazettes.

Requires `ALGOLIA_APP_ID`, `ALGOLIA_API_KEY`, `ALGOLIA_INDEX_NAME`, `S3_GAZETTE_BUCKET_NAME`, `S3_GAZETTE_DOMAIN_NAME` and `DATABASE_URL` in `.env`, plus AWS credentials for the gazette bucket (e.g. `aws sso login --profile <your-profile>`).
