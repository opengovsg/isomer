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

### Insert Anti-Scam Banner

Inserts the `AntiScamDisclaimerBanner` block at the bottom of RootPage content across sites. Lists all RootPage resources (grouped by site) and lets you scope the run to all of them, specific sites, or specific resources. For each selected resource:

- If it has a published blob only, creates a new Blob (published content + banner) and a new Version, and updates `publishedVersionId`.
- If it also has a draft blob, does the above **and** updates the existing draft blob in place to append the banner.
- If it has a draft blob only (never published), updates the existing draft blob in place.

Skips a blob if it already contains an anti-scam banner block. All writes run in a single transaction — any failure rolls back the whole batch. Looks up the publisher by email address. Does not trigger a site rebuild.

### Publish Site Resources

Publishes all draft resources for a given site ID in the database. Lists matching resources for review before confirming. For each resource, creates a new Version record and transitions the resource state from Draft to Published.

**Use case:** Pre-launch assistance — when an agency needs all their content published live at once and requires admin help to do so.

### Rebuild All CodeBuild Projects

Lists all AWS CodeBuild projects in a selected region, sorts them alphabetically, and starts a build for each project. The script can be run as a dry run to show project indexes first, then resumed from a specific index if a previous run stops midway.
