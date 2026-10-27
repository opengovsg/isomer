# eGazette scripts

Utilities for eGazette, organised alongside `isomer-admin`. Add scripts under
`apps/` and register them in `index.ts`.

## Setup

1. Run `pnpm install` from the repository root.
2. From `tooling/scripts`, copy `egazette/.env.example` to `egazette/.env`.
   Set `S3_GAZETTE_DOMAIN_NAME` to the selected environment's public PDF hostname,
   without `https://` or a trailing slash.
3. Configure the database using the same environment variables as `export-import`:
   - For `STAGING`, `UAT`, or `PROD`, set `<ENV>_DB_HOST`, `<ENV>_DB_PORT`,
     `<ENV>_DB_USERNAME`, `<ENV>_DB_NAME`, `<ENV>_DB_REGION`, `<ENV>_AWS_PROFILE`,
     `<ENV>_DB_TUNNEL_HOST`, and `<ENV>_DB_TUNNEL_PORT`.
   - `DB_HOST` and `DB_PORT` identify the actual RDS endpoint used to sign the
     IAM token. `DB_TUNNEL_HOST` and `DB_TUNNEL_PORT` identify the local end of
     the already-open tunnel.
   - For `LOCAL`, set `LOCAL_DB_HOST`, `LOCAL_DB_PORT`, `LOCAL_DB_USERNAME`,
     `LOCAL_DB_NAME`, and optionally `LOCAL_DB_PASSWORD`. No AWS setup is needed.
4. For remote environments, an authorised operator signs in with
   `aws sso login --profile <configured-profile>` and opens the database tunnel
   through the approved environment access procedure. Obtain explicit permission
   before accessing remote environments or secrets. Agents must never open
   production database connections or tunnels; production execution is a human
   operation.

The script reuses [`getDbClientConfig`](../../export-import/db.ts) from
`export-import`. For remote environments it generates an RDS IAM token from the
configured AWS SSO profile immediately before connecting, using the same TLS
settings as `export-import`. The operator opens the tunnel before running the
script.

Run from `tooling/scripts`:

```sh
pnpm run egazette
```

Or from the repository root:

```sh
pnpm --filter @isomer/scripts egazette
```

## Create static page

### Context

Use during an emergency when Algolia is unavailable and recovery will take too
long. Select **Create static page**, choose the database environment, then enter
the eGazette site ID, gazette collection ID, and date range. The IDs are the site's
and designated eGazette collection's numeric IDs in Studio. The script checks
that the site exists and the collection belongs to it, then prints their names.

The default range is **the last 30 days**, in Singapore time, with both dates
included. Dates are entered as `YYYY-MM-DD`. For a different end date, the
default start date is 30 days before that date. You can also set `FROM_DATE`,
`TO_DATE`, or `DEFAULT_WINDOW_DAYS` in `apps/create-static-page.ts`.

The script reads the Isomer database:

- Reads `CollectionLink` resources in the chosen site and collection through
  their published `Version` and `Blob`. Draft-only and scheduled unpublished
  gazettes are excluded; live gazettes with draft edits use the published blob.
- Filters and displays the stored publication date (`page.date`), preserving
  backdated dates when a version was published later. Results are newest first.
- Reads the category and notification number from `page.category` and
  `page.description`. Resolves the first `page.tagged` ID using the collection's
  published IndexPage subcategory labels. Missing optional metadata shows `N/A`.
- Builds direct public PDF links from `S3_GAZETTE_DOMAIN_NAME` and `page.ref`.
  It requires no Algolia credentials or S3 API access. Remote database access uses
  AWS SSO and IAM authentication. The script does not change database records,
  search indexes, or S3 objects. The database session is read-only.

Studio writes the selected publication date as `DD/MM/YYYY` into
`Blob.content.page.date` when creating or editing a gazette. Publishing creates
a `Version` referencing that same blob. Metadata is committed to the database
before the separate search ingestion job runs, so an Algolia outage does not
prevent this export from reading it.

| Export field        | Database source                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Title               | `Resource.title`                                                                                 |
| Publication date    | Published `Blob.content.page.date`                                                               |
| Category            | Published `Blob.content.page.category`                                                           |
| Notification number | Published `Blob.content.page.description`                                                        |
| PDF path            | Published `Blob.content.page.ref`                                                                |
| Subcategory         | Published `page.tagged[0]`, matched to the published collection IndexPage's `page.tagCategories` |

### Incomplete data and empty output

The export continues when individual records have problems:

- Missing or invalid publication dates are skipped with a warning identifying
  the resource ID. Dates are validated in the script so a malformed date cannot
  fail the entire database query.
- Records within the requested date range with missing or invalid PDF references
  are skipped with a warning identifying the resource ID.
- Missing categories and missing or unrecognised subcategories are flagged and
  displayed as `N/A`. Missing notification numbers also display as `N/A`.
- Malformed subcategory configuration is treated as unavailable metadata, so it
  does not stop valid gazettes from being exported.

Only metadata is loaded, for all published gazettes in the selected collection;
the script validates dates and applies the requested range before rendering.
Unusable dates are reported even when their records cannot be placed in a date
range. Review the warnings and generated item count before publishing.

If no valid gazettes remain, the script asks before writing an empty page and
replacing any existing output. The default answer is **No**, which leaves the
previous file unchanged. An invalid site/collection selection stops the export.

The output is `tooling/scripts/egazette/output/gazettes.html`, regardless of the
working directory. Queries and HTML generation finish before replacing the
previous file. Record warnings allow a successful export; database and file-write
failures exit unsuccessfully. Environment files and generated output are ignored
by Git.

### Using the output

Open `gazettes.html` locally and check the date range, item count, metadata, and
PDF links before publishing it. PDF availability still depends on the existing
public asset host; this script does not repair inaccessible files. The HTML can
be hosted as a standalone page or its `<style>` and `<section>` embedded in the
incident browse page. Publication is a separate operator step.

### Post-incident

After search recovers, remove the temporary browse page and restore the normal
search entry points.

## Local checks

From the repository root:

```sh
pnpm --filter @isomer/scripts egazette:test
```

Checks date defaults and calendar validation, HTML escaping, PDF URL encoding,
inclusive filtering, sorting, best-effort export with record warnings, and empty
HTML. It does not load `.env` or connect to any database or service.
