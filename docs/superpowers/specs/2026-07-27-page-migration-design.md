# Page Migration — Convert individual Classic pages

**Date:** 2026-07-27
**Status:** Approved (design)

## Problem

The existing Classic→Next migration (`apps/classic-migration`) runs at the granularity of a
whole site: it fetches the entire repo, converts every page, and studiofies every asset. This is
because Classic assets live in flat `images/` and `files/` folders that are not tied to individual
pages, so there is no easy way to know which assets a single page uses.

We need a way to convert **specific pages only** (e.g. a handful of pages a site owner wants moved),
producing:

1. The studiofied page JSON(s), ready to paste into Studio manually.
2. Exactly the assets those pages use, laid out in the S3 asset structure
   `/<site-id>/<uuid>/<filename>` for manual upload.

The script does **not** import into Studio itself — output goes to a conversion output folder.

## Placement

A new app in the streamline suite: **Script 7 — "Convert individual Classic pages"**
(`apps/page-migration.ts`), mirroring `apps/graft-folder.ts` (interactive `@inquirer/prompts` +
Studio DB connection). Living inside the suite means all conversion code and dependencies
(`@opengovsg/isomer-components` for real schema validation, tiptap, ai-sdk, pg, octokit) are already
available, and the Studio DB is reachable for resource-link resolution.

Wiring:
- Add `"convert-classic-pages"` to `StreamlineScriptType` in `streamline/types.ts`.
- Add the menu choice + switch case in `streamline/index.ts`.

## Reused code (no behavioural change)

- `apps/classic-migration/github.ts` → `getFileContents`
- `apps/classic-migration/page.ts` → `getIsomerSchemaFromJekyll` (unchanged; AI alt-text + AI page
  summary run as today, requiring `PAIR_FOUNDRY_API_KEY`)
- `apps/classic-migration/utils.ts` → `getCollectionFolderName`, `getLegalPermalink`
- `apps/classic-migration/studiofier/constants.ts` → `GET_ALL_RESOURCES_WITH_FULL_PERMALINKS`
- `apps/classic-migration/studiofier/types.ts` → `Resource`
- `apps/classic-migration/converters/google-slides.ts` → `EXTRACTED_ASSETS_DIR`
- `apps/classic-migration/studiofier/index.ts` → `studioifyContent` — the only edit to existing
  code: add `export` to this pure function so both flows share it. Non-breaking / additive.

## Inputs (interactive prompts)

| Prompt | Type | Notes |
| --- | --- | --- |
| Classic GitHub repo name | `input`, required | e.g. `moe-peircesec` (org is `isomerpages`) |
| Studio site ID | `number`, required, > 0 | Used for `/<siteId>/<uuid>/…` and the resource-map DB query |
| Branch | `select` master / staging | Maps to `useStagingBranch` |
| Target domain | `input`, required | e.g. `www.peircesec.moe.edu.sg`; used for link cleanup + asset URL fallback |
| Markdown paths | `input`, required | Repo-relative paths, comma / whitespace / newline separated; split and trimmed |

## Flow

1. **Convert** each page:
   - `getFileContents({ site, path, octokit, useStagingBranch })`.
   - `isResourceRoomPage = path` contains a `/_posts/` segment. For such pages, set
     `content.page.category = await getCollectionFolderName(...)` (mirrors `migrateCollectionPage`).
     All other pages convert as normal content pages.
   - `getIsomerSchemaFromJekyll({ content, path, isResourceRoomPage, site, domain, useStagingBranch })`.
   - Skip (with a logged warning + a report row) if content is empty or `status === "not_converted"`.
   - Output permalink = `getLegalPermalink(response.permalink ?? <filename without ext>)`, matching
     `migrateSite`'s non-resource-room permalink logic.
   - Hold the converted schema in memory keyed by output permalink (also written to disk in step 4).

2. **Resource map (DB)** — connect with `ISOMER_STUDIO_DATABASE_URL` (SSH tunnel must be up, same as
   studiofier/graft). Run `GET_ALL_RESOURCES_WITH_FULL_PERMALINKS` for the site ID and build
   `Record<"/full/permalink", Resource>` (same shape as the studiofier's `getResourceMapping`). This
   lets internal page links resolve to `[resource:siteId:resourceId]` for pages that already exist in
   the target Studio site. Links with no match are left as-is and listed in the report.

3. **Collect + download assets** — walk the converted JSONs (stringify + regex), extracting every
   distinct `/images/…` and `/files/…` reference (accounting for `%20`-encoded spaces). For each:
   - Mint `/<siteId>/<uuid>/<filename>` and record it in `assetsMap` (`original → new`).
   - Resolve bytes:
     - `/images/google-slides/…` → read from local `extracted-assets/<repo>/…` (downloaded during
       conversion).
     - otherwise → `GET https://raw.githubusercontent.com/isomerpages/<repo>/<branch>/<decoded-path>`.
   - Write to `…/assets/<siteId>/<uuid>/<filename>`. A failed fetch is logged and flagged as a broken
     asset in the report; the mapping is still emitted so the reference is rewritten consistently.

4. **Studiofy + write output** — for each page, `studioifyContent(JSON.stringify(content), siteId,
   assetsMap, resourceMap)`, parse back, and write the final JSON. Emit reports.

## Output

Under `apps/classic-migration/page-conversion-output/<repo>/`:

- `pages/<permalink>.json` — final studiofied pages, ready to paste into Studio.
- `assets/<site-id>/<uuid>/<filename>` — upload the **contents of `assets/`** to S3 so the
  `<site-id>/<uuid>/<filename>` structure is preserved.
- `asset-mappings-<repo>.csv` — `Original Path,Assets Path` (same format as the full-site script).
- `migrated-pages-<repo>.csv` — permalink, title, status, priority, review items, recommended
  actions (same columns as the full-site report), plus broken-asset and unresolved-internal-link
  notes.

The output folder for the given repo is cleared at the start of each run (like `migrateSite`).

## Non-goals / deliberate cuts

- No import into Studio (no DB writes). The DB is read-only here (resource map only).
- Resource-room/collection support is best-effort (category + article layout); the primary target is
  ordinary content pages.
- Internal links to pages that do **not** yet exist in the target Studio site are left unrewritten
  and reported, not created.

## Operational prerequisites

- Connected to the OGP VPN and `npm run jump:prod` tunnel running (for the DB resource-map query).
- `.env` populated as for the existing classic-migration flow (`GITHUB_TOKEN`,
  `ISOMER_STUDIO_DATABASE_URL`, `PAIR_FOUNDRY_API_KEY`).
