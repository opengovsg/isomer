# Design: draft-aware migration of legacy `category` into `tagCategories`

**Related**: [02-migration-script-and-rendering-cutover.md](../../../02-migration-script-and-rendering-cutover.md) (references "ADR 0003" as the source decision; no such file exists yet under `docs/adr/`)
**File**: `apps/studio/prisma/scripts/migrateCategoryToTagCategories.ts`

## Problem

The current implementation of `migrateCategoryToTagCategories.ts` picks a single "effective" content blob per resource — published if it exists, otherwise draft (`resolveEffectiveContent`). This collapses two independent states into one:

- If a Collection Item or its Index has both a published version and a newer unpublished draft, the script reads and writes **only the published blob**. The draft blob is left with its old, pre-migration shape (no `tagCategories` "Category" group, no `tagged` entry).
- If that draft is later published — even with no category-related edits — Studio's publish flow (`incrementVersion`) repoints the resource's `Version.blobId` at the literal, untouched draft Blob row and nulls `draftBlobId`. This silently reverts the migration: the published site loses the "Category" filter and its tagged items, with no error or warning.
- A category value that exists only in a draft (never published) is never collected into the option list at all, since `deriveDistinctCategories` only sees the "effective" (published-preferred) category per item.

This design makes both the Index page and every Collection Item's draft and published content independently draft-aware, so the migration can't be silently undone by a later, unrelated publish.

## Goals

- A category value in *either* a draft or published `category` field gets an option slot in the Index's new "Category" tagCategories group.
- Both the draft and published blob (whichever exist) for the Index and for every Item get updated, each self-consistent with its own `category` value.
- Published-side changes go through proper version history (new Blob + new Version + bumped `publishedVersionId`), not an in-place rewrite of a historical Blob row.
- Draft-side changes never trigger a publish — a draft may contain unrelated pending edits that aren't ready to ship.
- The whole thing runs once per site, correctly, without needing to be re-run.

## Non-goals

- Removing the legacy `category` field from items — untouched, still required at the schema level (a later slice removes it).
- Rendering cutover (`getAvailableFilters.ts` etc.) — covered separately in the same PR per the existing plan doc, not part of this script.

## Design

### 1. Category collection

For a given Collection, gather every Item's `category` value from **both** its draft and published content (wherever each exists), dedupe, trim, and sort — same as today's `deriveDistinctCategories`, just fed from a union of two sources per item instead of one "effective" source.

### 2. Building the new group

Since no collection has been migrated before, there is no existing "Category" group to reconcile against. Build exactly **one** fresh group via `buildCategoryTagGroup`:

```ts
{ id: <uuid>, label: "Category", isRequired: true, options: [{ id: <uuid>, label }, ...] }
```

This single object (with its generated ids) is reused verbatim for every blob it gets written into, so an option label always resolves to the same id everywhere — draft and published Index, and every Item's `tagged` reference.

### 3. Index page writes

Handled independently per side; both can happen in the same run:

- **Published side** (if a published version exists): read the current published content and its `Version.versionNum`. Append the new group to the **end** of its existing `tagCategories` array. Insert a new `Blob` row with that content, insert a new `Version` row (`versionNum: previous + 1`, `publishedBy: <operator-supplied user id>`), and update `Resource.publishedVersionId` to point at it. `draftBlobId` and `state` are untouched.
- **Draft side** (if a draft blob exists): append the same group to the end of its own existing `tagCategories` array (which may differ from the published array's prior contents) and `UPDATE Blob.content` **in place** on that row. No new Version, no Resource changes — this must not publish anything.
- If the Index has no content on either side, the collection is skipped (`no-index`), same as today.

### 4. Item writes

Same per-side independence, applied to every Collection Item:

- For each side (draft / published) that has a `category` value, look up its option id from the group built in step 2, and append it into that side's own `tagged` array (preserving whatever's already there).
- Published-side tagging: new Blob + new Version + bumped `publishedVersionId`, mirroring the Index's published write.
- Draft-side tagging: in-place `Blob.content` update, mirroring the Index's draft write.
- An item's draft and published `category` can differ (or exist on only one side) — each side is tagged strictly from its own value, so no cross-contamination.
- An item with no `category` value on a given side produces no write for that side (mirrors today's "skip items with no matching category").

### 5. Publisher attribution

Every new `Version` row requires a valid `publishedBy` user id (NOT NULL FK to `User`). Following the convention in `convert-folder-to-collection/shared.ts`:

- At script start, interactively prompt for a user id.
- Verify it exists via a `verifyUser`-style check before proceeding; throw if not found.
- Skip the prompt entirely in `--dry-run` mode, since nothing is written.
- Reuse the same verified id as `publishedBy` for every Version created during the run.

### 6. Idempotency

Idempotent via label: before building a plan, `migrateCollection` checks `hasCategoryGroup` against both the draft and published `tagCategories` for the Index. If either side already has a group labeled "Category", the collection is skipped entirely (status `"already-migrated"`, no writes) — this covers both re-runs and collections a human has already migrated in Studio.

Risk accepted: a human-created group with that exact label is also skipped, so its legacy `category` values would not be migrated. Operators must audit for pre-existing "Category" groups with `findCategoryTagGroups.sql` before the first run against an environment.

`no-categories` remains a separate status (no item has any category value on either side, on a Collection that passed the label check) — that's a data condition, not an idempotency check.

### 7. Transaction scope

Everything for one Collection — the Index's draft write, the Index's published write (new Blob + Version + Resource update), and every Item's draft/published writes (new Blobs + Versions + Resource updates) — runs inside a **single DB transaction** per collection. A failure partway through leaves that collection entirely unmigrated rather than half-done. This is the same transaction boundary the script already has (`db.transaction().execute(...)` inside `migrateCollection`), just covering more operations.

### 8. Result reporting

- `itemsUpdated` counts distinct items touched (dedup across a single item's possible draft + published writes).
- `CollectionMigrationResult` also carries `versionsCreated` — the Index's published write (0 or 1) plus one per item published-side update — and `formatResult`'s log line reports it (`new versions created=N`, or `to create=N` in `--dry-run`), so an operator can see how many Versions a run touched without inspecting the DB.

### 9. Operational prerequisites

This script mutates live Resource/Blob/Version rows directly (a backfill, not a formal Prisma migration) and creates real Versions via `publishNewContent` — but unlike Studio's own publish flow (`publishPageResource` → `getFullPageById`), it does **not** take a row lock (`SELECT ... FOR UPDATE`) before reading `publishedVersionId`/`versionNum`, and its final `UPDATE Resource SET publishedVersionId = ...` is unconditional (no optimistic-concurrency check against the value it read). Concretely:

- If a human editor publishes a page in the same collection while the script is running, both the editor's publish and the script's write can read the same stale `versionNum`, and whichever `UPDATE Resource` commits last silently overwrites the other — a lost publish, and potentially two `Version` rows sharing the same `versionNum` (the `Version` table has no `@@unique([resourceId, versionNum])` constraint).
- The same stale-read-then-blind-overwrite pattern applies to draft content: a concurrent draft autosave to the same Index or Item during the run can be silently reverted.
- **Scheduled publishes count as concurrent activity too.** `apps/studio/src/server/cron/jobs/schedulePublishingJob.ts` calls the same `publishPageResource` path independently of the Studio UI, for any resource whose `scheduledAt` comes due — locking human editors out of Studio does not stop it.

Given this, the script is safe to run only under these operational conditions, which must hold for the entire duration of the run against a given site:

1. **No human editing** — agencies must not be actively editing content on the target site while the migration runs (Studio access effectively frozen for that site, e.g. via a maintenance-window comms to agencies).
2. **No scheduled publishes due during the window** — confirm no resource on the target site has a `scheduledAt` falling inside the run window before starting (agencies are told not to schedule publishes for that period; ideally cross-checked against the DB before running).
3. **One site at a time, run to completion** — since the script iterates collections sequentially and each collection's writes are transactional but independent, avoid overlapping two invocations against the same site.

These are process/runbook requirements, not something the script enforces in code — no preflight check for pending schedules or in-flight edits exists yet. If the migration needs to run against a site that cannot get a clean maintenance window, treat the concurrency issue above as a blocker to fix first (e.g. add `SELECT ... FOR UPDATE` locking and an optimistic-concurrency check on the final `Resource` update, mirroring `getFullPageById`/`publishPageResource`).

## Shape changes

- `MigrationPlanItem`: `{ resourceId, draftCategory?, draftTagged?, publishedCategory?, publishedTagged? }` (only the fields for states that exist) instead of `{ resourceId, category? }`.
- `MigrationPlan.itemUpdates`: `{ resourceId, state: "draft" | "published", tagged: string[] }[]` instead of `{ resourceId, tagged: string[] }[]`.
- `MigrationPlan`: gains `group` (the shared new group) and `indexUpdates: { state: "draft" | "published" }[]` (which side(s) need writing) instead of a single `newTagCategories` array.
- `MigrationPlan.status`: `"migrated" | "no-categories"`, built only after a collection has passed the `hasCategoryGroup` skip check. `CollectionMigrationResult.status` widens this with `"no-index"` and `"already-migrated"` for the two skip paths that short-circuit before a plan is built.
- DB read helpers (`getIndexPageRow`, `getItemRows`) need to additionally select `Version.versionNum` so the new-version insert can compute `versionNum: previous + 1`.

## Testing

New/changed coverage needed, replacing anything that tested idempotency or the old single-"effective"-content model:

- Pure function tests (`buildMigrationPlan` and friends): item with diverging draft vs. published category; item with a category only in draft and no published content; item with a category only in published and a draft that lacks one; group always appended as the last element of an existing `tagCategories` array.
- Integration tests: Index with both draft and published blobs, both get the group written (published via new Version, draft in place); Index published-only; Index draft-only (no publish should occur); an item's published-side write correctly bumps `versionNum` and `publishedVersionId` while leaving `draftBlobId` alone; an item's draft-side write mutates content in place without touching `publishedVersionId`; `versionsCreated` is asserted alongside `itemsUpdated` on the published and divergence fixtures.
- `main` is exported (accepting an optional `argv` override for testability) and covered directly: `input()` from `@inquirer/prompts` is asserted not called in `--dry-run`, called and its result passed through `verifyUser` outside `--dry-run`, and the promise rejects when the prompted user id doesn't exist. `verifyUser` itself has direct found/not-found coverage.
- Keep: a test asserting re-running against an already-migrated collection (one with an existing "Category" group, draft or published) makes no changes — idempotency via `hasCategoryGroup` label-skip is in scope.
- Not covered (accepted gap): the concurrency scenarios in [Operational prerequisites](#9-operational-prerequisites) — no test exercises a concurrent publish or draft save racing the migration, since there's no code-level mitigation to verify yet.
