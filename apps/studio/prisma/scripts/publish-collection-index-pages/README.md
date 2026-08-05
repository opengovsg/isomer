# Publish never-published Collection index pages

One-off data script. Idempotent and dry-runnable, per `apps/studio/prisma/CLAUDE.md`.

## Why

A prior migration converted `page.category` into `page.tagCategories` (on a Collection's
`IndexPage` blob) plus `page.tagged` (UUID arrays on each collection item). It wrote
`tagCategories` into both published and draft index-page blobs.

But `collection.router.ts` never publishes the index page it creates — the
`// TODO: Create the index page for the collection and publish it` is still there. So for every
Collection created that way, the migration's `tagCategories` landed **only in the draft blob**, and
the site build never reads drafts.

The failure chain on rebuild:

1. `tooling/build/scripts/publishing/queries.ts` joins `Version` on `publishedVersionId` then `Blob`
   on `Version.blobId`. `draftBlobId` appears **nowhere** in `tooling/build/` — there is no draft
   fallback.
2. `publishedVersionId IS NULL` ⇒ `content` is `NULL` ⇒ `index.ts` skips the index page: no
   `schema/<collection>/_index.json`, no sitemap entry, so no
   `collectionPagePageProps.tagCategories`.
3. The build then **fabricates a stub** via `getCollectionIndexPageContents` — no `tagCategories`,
   no `sortOrder`, no `subtitle`.
4. `getCollectionItems.ts` gates on `tagCategories && item.tagged`, so every item gets
   `tags: undefined`. `getTagFilters.ts` builds its map from `items[].tags`, so it returns `[]`, and
   `CollectionClient.tsx` hides the whole filter rail.
5. Articles inside the collection lose their header tags too (`Article.tsx` reads
   `parent.collectionPagePageProps?.tagCategories` from the sitemap), as do homepage
   `CollectionBlock`s.
6. Search ingestion is worse: `schedulePushDocumentJob.ts` INNER JOINs on `publishedVersionId` with
   `executeTakeFirstOrThrow()` and **throws**. The throw is swallowed per-row and the job row is
   deleted regardless of outcome, so it never retries.

Studio hides all of this, because the editor preview paths (`getPublishedIndexBlobByParentId`) _do_
fall back to the draft.

**So a draft-only fix would achieve nothing.** This script gives each affected index page a published
Version whose blob carries the `tagCategories`.

## What it does

For each `IndexPage` with `publishedVersionId IS NULL` whose parent is a `Collection`
**and** that collection has at least one published `CollectionPage` or
`CollectionLink` child:

1. Reads the draft blob.
2. Builds a canonical blob: `createCollectionIndexJson(title)` plus `page.tagCategories` carried over
   verbatim from the draft. `title` is resolved like the site build's dangling-directory stub:
   Collection `Resource.title` → IndexPage `Resource.title` → permalink slug (draft `page.title` is
   not read).
3. Inserts that as a **new** `Blob` and a **new** `Version`, sets `Resource.publishedVersionId` and
   `state = Published`.

`page.tagCategories` is carried
over wholesale, with no shape validation — the app's own save path is what enforces the schema, so a
draft blob that made it into the DB is trusted as-is.

`draftBlobId` is **never touched** — the existing draft survives, so in-progress editor work is
preserved and the dashboard keeps showing the page as having unpublished changes (that badge is
driven by `draftBlobId`, not `state`).

`state` becomes `Published` because Studio's "is this index page live on the end site?" queries
(`folder.router.ts`, the `resource.service.ts` nested-resources CTE) gate on `state = Published`.
Leaving it `Draft` while `publishedVersionId` is set would be a combination that exists nowhere else
and would keep those queries excluding a page the build now does publish.

### Carried over from the draft

`page.tagCategories` only.

### Resolved at publish time (not from draft)

`page.title` — Collection `Resource.title`, then IndexPage `Resource.title`, then permalink slug.

### Deliberately discarded

`subtitle`, `variant`, `sortOrder`, `showDate`, `showThumbnail`, `image`, `defaultSortBy`,
`defaultSortDirection`, legacy `tags`, `category`, `content`, and the sibling `meta` key. All of them
survive in the untouched draft blob.

## Accepted live-site changes

Publishing a real index page **replaces the build's fabricated stub**, so two things change on live:

| Field      | Live today (stub)                                                                                 | After this script                                                     |
| ---------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `subtitle` | blank — the stub writes `page.contentPageHeader.summary`, which the Collection layout never reads | `"Read up-to-date news articles, speeches, and press releases here."` |
| `variant`  | from `CollectionMeta.content.variant`                                                             | absent ⇒ schema default `"collection"` = 1-column                     |

Both are accepted decisions. The dry-run reports `variantFlipCount` so the blast radius of the second
one is visible first — **review it before applying.** Reversing either decision is a one-line change
to `buildPublishedIndexBlob`.

One related caveat worth knowing: a row whose draft had **no** `tagCategories` still gets published
(it replaces the stub and fixes the build-side divergence) but that does **not** fix search
ingestion, which requires a present `tagCategories` array
(`schedulePushDocumentJob.ts`'s `collectionIndexPageContentSchema`) and throws otherwise. Those rows
need the earlier category migration re-run.

## Running

Per `apps/studio/prisma/scripts/README.md`: `pnpm run jump` (or `jump:<env>`), point `DATABASE_URL`
at port 5433, and prefix the required vars in `.env` with `export`. Pair with another engineer for
production.

```bash
cd apps/studio
source .env && pnpm exec tsx prisma/scripts/publish-collection-index-pages/publishCollectionIndexPages.ts
```

The script prompts for mode (`dry-run` / `apply`), an optional site ID (blank = all sites), and — in
apply mode — an **IsomerAdmin** email for `Version.publishedBy` (looked up and checked for an active
`IsomerAdmin` row). Apply mode always plans and prints the summary first, then asks for confirmation.

Recommended sequence per environment:

1. `dry-run` with one site ID → read the report → `apply` → rebuild that site → verify the live page.
2. `dry-run` with a blank site ID → read the report → `apply`.
3. Re-run `apply` → confirm 0 eligible rows.

**A site rebuild is required** for anything to reach the live site. The script only writes DB rows.

### Cross-checking the target set

```sql
-- Should match the dry-run "Eligible rows" total.
select count(*) from "Resource" r
join "Resource" p on p.id = r."parentId"
where r."type" = 'IndexPage'
  and r."publishedVersionId" is null
  and p."type" = 'Collection'
  and exists (
    select 1 from "Resource" child
    where child."parentId" = r."parentId"
      and child."siteId" = r."siteId"
      and child."type" in ('CollectionPage', 'CollectionLink')
      and child."publishedVersionId" is not null
  );

-- Premise check: no PUBLISHED collection index blob should be missing tagCategories.
-- A non-zero count means the target set above is too narrow for the problem.
select count(*) from "Resource" r
join "Resource" p on p.id = r."parentId"
join "Version" v on v.id = r."publishedVersionId"
join "Blob" b on b.id = v."blobId"
where r."type" = 'IndexPage'
  and p."type" = 'Collection'
  and b.content -> 'page' -> 'tagCategories' is null;
```

## Output

One file per run, in `.out/` (gitignored), named `<timestamp>-<scope>.report.json`. It holds the
totals, `variantFlipCount`, every skipped row with its reason, and `publishedRows` — the rollback
data. In apply mode the report is rewritten after every committed batch, so a mid-run failure still
leaves rollback IDs on disk for rows already published.

## Rollback

Rollback is clean because nothing is overwritten. For each entry in the report's `publishedRows`:

```sql
UPDATE "Resource"
   SET "publishedVersionId" = NULL, state = '<previousState>'
 WHERE id = <resourceId>;
DELETE FROM "Version" WHERE id = <newVersionId>;
DELETE FROM "Blob"    WHERE id = <newBlobId>;
```

The original draft blob was never modified, so there is nothing to restore.

## Notes

- **No audit logging.** `logResourceEvent` needs a `by: User` and a delta keyed on the `Resource`
  row, which is not what changes here. Neither `convert-folder-to-collection` nor `moh-tosp` logs
  either. The report's `publishedRows` plus the PR record is the trail.
- **No redirects.** `publishResource` special-cases IndexPage for redirect backfill, but no permalink
  changes here — the collection URL already resolves via the stub.
- **Chunked writes.** One transaction per 100 rows rather than one for the whole run: a global run
  would otherwise hold `Blob`/`Version` row locks for its whole duration. Safe to interrupt — a
  partial run is resumable because published rows drop out of the target predicate, and the report
  is flushed after each batch so rollback IDs for committed rows are already on disk.
- **Idempotency is structural.** Setting `publishedVersionId` removes the row from the target query,
  so a second run selects zero rows. `publishNewBlobVersion` also re-asserts
  `publishedVersionId IS NULL` inside its transaction to cover the concurrent case.
- **This will be needed again** until the root cause at `collection.router.ts`'s
  `// TODO: ... publish it` is fixed. Every Collection created before that fix re-enters the target
  set.
- Unlike the older scripts in this tree, this one imports `createCollectionIndexJson` from
  `collection.service.ts` directly rather than keeping a local copy. Those scripts' comments claim
  value imports from `@opengovsg/isomer-components` break under `tsx`; that is no longer true — the
  one `dist` file with an unresolved `~/...` specifier
  (`templates/next/layouts/Collection/utils/getTagGroupsFromTagged.js`) is orphaned dead code that
  nothing imports, so the package loads fine. Importing the real function means there is no copy to
  drift.
