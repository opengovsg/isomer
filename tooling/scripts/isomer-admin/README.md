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

### Create Content From Local

Creates a new **Collection** or **Folder** from local permalink-named schema JSON. Mirrors the `seed-from-repo` studioify flow. Requires a **site ID** and **publisher user ID**; **parent folder ID** is optional (leave blank to create at site root). Set `CONTAINER_PERMALINK`, `CONTAINER_NAME`, and optionally `INPUT_DIR` / `INDEX_PAGE_PATH` at the top of `create-content-from-local.ts` before running.

1. **Prepare assets** — reads from `{script}/input/assets/images/` and `{script}/input/assets/files/` (v1 layout), or flat files in `{script}/input/assets/`. Copies to `./output/{siteId}/{uuid}/{filename}` and writes `{siteId}-file-mapping.csv` with paths like `/images/foo.png`.
2. **Create container** — inserts a published `Collection` or `Folder` and child pages with v1-style paths (`Version` + `publishedVersionId` set via publisher user ID).
3. **Studioify published pages** — rewrites asset paths and internal page links on the published blobs.

Expected input layout (`isomer-admin/apps/input/` next to `create-content-from-local.ts`):

```
isomer-admin/apps/input/
  /assets
    /images
      hero.png
    /files
      report.pdf
  /schemas
    page-one.json             # permalink = page-one
    page-two.json
  _index.json                 # optional — used when present (see INDEX_PAGE_PATH)
```

`INDEX_PAGE_PATH` controls the index page: set an explicit path (must exist), or leave `null` to use `input/_index.json` beside the script when present and otherwise auto-create a default `childrenpages` index.

**NOTE:** Upload `./output/{siteId}/` to the assets S3 bucket, then manually trigger a site rebuild in CodeBuild.

### Import Folder JSONs

Imports JSON files from `./input` to update existing resources in the database. Matches resources by ID extracted from the filename (`{id}.json`). Optionally publishes the updated resources. Looks up the publisher by email address.

**NOTE:** This requires you to place the files inside `./input` first before running.

### Publish Site Resources

Publishes all draft resources for a given site ID in the database. Lists matching resources for review before confirming. For each resource, creates a new Version record and transitions the resource state from Draft to Published.

**Use case:** Pre-launch assistance — when an agency needs all their content published live at once and requires admin help to do so.

### Rebuild All CodeBuild Projects

Lists all AWS CodeBuild projects in a selected region, sorts them alphabetically, and starts a build for each project. The script can be run as a dry run to show project indexes first, then resumed from a specific index if a previous run stops midway.
