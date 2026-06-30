# Using these scripts

1. first, run `pnpm run jump` for production or `pnpm run jump:<env>`
   a. if you are running this against production, find another engineer to pair

2. then, update your `$DATABASE_URL` in your local `apps/studio/.env` to the one for the environment
   b. ensure that the port you have specified is 5433 as we are using a jump host to tunnel our connection

3. update the script you want to invoke to pass in the correct arguments
4. invoke the command via `source .env && pnpm exec tsx <path_to_script>`
5. note that tsx might export the env vars to be exported. Hence, minor change to the `.env` is required to add `export` before each required env var.

## Create site script

1. On the last line, update the site name to the name you require. This should be exactly as what should be shown on Studio (e.g. "Site ABC")
2. This already adds the Isomer admins and migrators with the Admin role.

## Add users to site

1. Edit the array of `User` objects to be added at the end of the script
2. Each entry contains 4 fields: email, name, phone and role. Note that name, phone and role are optional fields. If left empty, name will be empty string, phone will be empty string and role will default to Editor.

## Update all user permissions for site

1. This script updates all users of a site to have a specific `RoleType`
2. Edit the `siteId` and `role` at the end of the script

## Import redirects from CSV

1. This script imports rows from a `domainName,source,target` CSV (e.g. `redirects.production.csv` in isomer-next-infra) into the `Redirect` table
2. Domains are matched against `Site.config.url`; rows for unmatched domains are skipped and reported
3. Rows with wildcards (`*`) or query parameters (`?`) in the source or target are ignored — these are infra publishing features with no equivalent in the `Redirect` table
4. Rows are validated with a deliberately lenient subset of `createRedirectSchema` — this is a migration of legacy redirects, so it preserves as many existing rules as possible rather than enforcing Studio's stricter rules (reserved prefixes, source character whitelist, lowercasing, self-redirect rejection) on data that predates them. Only rows that would corrupt the published output (control chars, backslashes, `..`, non-path/`https` destinations) are skipped and reported; Studio's full validation still applies to anything created or edited through the UI afterwards
5. Internal destinations that resolve to a live page (or a folder/collection with a published index page) are converted to the `[resource:siteId:resourceId]` reference format, matching how Studio stores internal destinations so the redirect follows the page if its permalink later changes. External `https://` URLs are stored verbatim; an internal path with no matching live page is kept as a literal path and surfaced for review
6. Edit the `csvPath` at the end of the script. It runs as a dry run by default — review the reported summary, then set `dryRun` to `false` to write
7. The import is idempotent: re-running updates destinations in place via the `(siteId, source)` unique constraint
8. A real (non-dry-run) import also writes the rows it migrated to `output/migrated-redirects.csv` (a `domainName,source,target` CSV, with each target set to the Location the published redirect should emit). Feed this file to the verification script below to check exactly the migrated redirects

## Verify redirects against the live site

Run this **after** the imported redirects have been published, to confirm each legacy rule actually returns a 301 from CloudFront. Run it against staging first. This script needs no database — it reads the original CSV directly.

1. It reads the same `domainName,source,target` CSV used for the import, then for each row requests `https://<domain>/<source>` (with a browser `User-Agent` so the WAF doesn't block the probe) and checks the response is a `301`. The `Location` is also compared against the CSV target and a mismatch is reported as a softer finding. Wildcard / query-parameter rows are skipped, since they aren't imported
2. Edit the props at the end of the script:
   - `csvPath` — path to the CSV to verify; prefer `output/migrated-redirects.csv` written by the import (exactly the migrated rows, targets set to the expected Location). The original infra CSV also works but reports un-migrated domains as failures
   - `domainFilter` — verify a single domain (bare hostname), or leave empty for every domain in the CSV
   - `sampleSize` — per-domain cap for a quick check, or `0` to probe every redirect
   - `concurrency`, `timeoutMs`, `expectedStatus` — request tuning (defaults: 10, 10s, 301)
3. It runs as a dry run by default — this only counts how many redirects would be probed per domain. Set `dryRun` to `false` to make the requests
4. Results are summarised by outcome (OK / wrong status / wrong location / error); any failures are also written to `output/redirect-verification-failures.csv` for review

> Note: the CSV includes domains that may not be on Studio yet (not imported); without the database the script can't filter those out, so they will show up as failures. Use `domainFilter` to verify migrated sites one at a time.
