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

## Migrate category to tag categories

1. Migrates each Collection's legacy `category` string values into a "Category" tagCategories group, and tags every Collection Item with the matching option UUID via `tagged`. The legacy `category` field is left untouched.
2. The new "Category" group is written with `display: "plaintext"`. Every pre-existing tagCategories group on the same Index is stamped with an explicit `display: "pills"`.
3. Idempotent — a Collection whose Index already has a "Category" group (draft or published) is skipped. This assumes `"Category"` is migration-owned; a human-created group with that label would also be skipped. Audit first with `findCategoryTagGroups.sql`.
4. Site selection: edit `SITE_IDS_INCLUDE` / `SITE_IDS_EXCLUDE` at the top of the script. Empty include = all sites; exclude is always subtracted. The resolved list is printed and must be confirmed before proceeding.
5. Each site runs in one transaction (all collections on that site succeed or the whole site rolls back). Outcomes are written to a timestamped `.log` next to the script — use failed site IDs from the log to retry via `SITE_IDS_INCLUDE`.
6. Pre-flight audits (optional but recommended):
   - `psql "$DATABASE_URL" -f prisma/scripts/findCategoryTagGroups.sql`
   - `psql "$DATABASE_URL" -f prisma/scripts/findUntaggedWithLegacyCategory.sql` (only `has_push_document_job = true` rows affect SearchSG/Algolia; risk accepted after audit found none)
7. Invoke with optional `--dry-run` to preview without writing:
   `source .env && pnpm exec tsx prisma/scripts/migrateCategoryToTagCategories.ts --dry-run`

## Migrate tags to tag categories

1. Migrates each Collection Item's legacy `tags` (`{ category, selected[] }`) into `tagCategories` groups on the Index, and appends the matching option UUIDs to each item's `tagged` array. The legacy `tags` field is left untouched.
2. Newly created groups are written with `display: "pills"` and appended after any existing groups (so a prior "Category" group's order/`plaintext` display is preserved).
3. Idempotent per group label — only missing tag category groups are appended on each Index side; missing options are added to an existing group when legacy tags reference labels not yet present. Item `tagged` UUIDs are still backfilled when a group already exists. A collection is skipped only when every side is fully up to date.
4. Site selection: edit `SITE_IDS_INCLUDE` / `SITE_IDS_EXCLUDE` at the top of the script. Empty include = all sites; exclude is always subtracted. The resolved list is printed and must be confirmed before proceeding.
5. Invoke with optional `--dry-run` to preview without writing:
   `source .env && pnpm exec tsx prisma/scripts/migrateTagsToTagCategories.ts --dry-run`
