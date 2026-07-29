# Egazette `category` → tagCategories migration (code references only)

Branch: new branch off `collection-tags-master`.

## Context

Egazette collection items store two classification fields:

- `category` — a fixed 3-value string (`Government Gazette` / `Legislative Supplements` / `Other Supplements`), stored at `content.page.category`. Driven by a hardcoded `GAZETTE_CATEGORIES` list in Studio.
- `subcategory` — already migrated onto the generic `tagCategories`/`tagged` system. The Studio "Sub-category" tagCategory is resolved by matching `label === GAZETTE_SUBCATEGORY_LABEL`, and the selected option's uuid is stored in `content.page.tagged`. Because there is currently only one tagCategory in play, several call sites read the selection via `tagged[0]` (positional), rather than an id-based lookup.

This spec migrates `category` onto the same tagCategories model, so egazette items carry two tagCategory selections (`"Category"` and `"Sub-category"`) inside one `tagged` array.

**Explicitly out of scope:** seeding the new `"Category"` tagCategory and backfilling existing resources' data. That is handled by the separate branch `feat/category-tagcategories-migration-script`. This branch changes only how code *reads and writes* the category field, and assumes it merges and deploys **after** that backfill has completed — i.e. a hard cutover, no dual-read fallback for the legacy `content.page.category` string.

## Decisions made during brainstorming

1. **Scope**: code references only (schema, write path, read/derived logic, UI). No data backfill, no migration script — that lives in `feat/category-tagcategories-migration-script`.
2. **Tag category label convention**: the new tagCategory is labeled `"Category"`, matched via a new `GAZETTE_CATEGORY_LABEL = "Category"` constant, mirroring the existing `GAZETTE_SUBCATEGORY_LABEL = "Sub-category"` pattern.
3. **Rollout safety**: hard cutover, no fallback to `content.page.category`. This branch will only be merged after the backfill branch's migration has run in the target environment, so no coexistence logic is needed.
4. **Uuid → label resolution**: a single shared resolver, `resolveGazetteTagLabels(tagged, tagCategories)`, used by every consumer instead of ad hoc `tagged[0]` positional access. It mirrors the membership-based matching already used generically in `packages/components/src/templates/next/layouts/Collection/utils/getPillAndPlaintextTags.ts` (for each tagCategory, find the option whose `id ∈ tagged`) rather than assuming array position.

## Design

### 1. Data model

`content.page.tagged: string[]` will hold **two** uuids for egazette items — one matching an option under the `"Category"` tagCategory, one matching an option under `"Sub-category"`. Order is not meaningful; membership is. `content.page.category` (the legacy string field) is dropped from the write path entirely.

### 2. Shared resolver

Introduce `resolveGazetteTagLabels(tagged, tagCategories)`:

```
{ categoryId, categoryLabel, subcategoryId, subcategoryLabel }
```

For each tagCategory, filter its `options` by `tagged.includes(option.id)`, and route the result to `categoryLabel`/`subcategoryLabel` based on which tagCategory's `label` it came from (`GAZETTE_CATEGORY_LABEL` / `GAZETTE_SUBCATEGORY_LABEL`). Needed in two runtime shapes:

- **Client**: resolves from the `trpc.collection.getCollectionTags` result already fetched by `GazetteSubcategoriesContext`.
- **Server**: resolves from a fetched blob/index-page's `tagCategories` (already fetched by `schedulePushDocumentJob.ts` for subcategory today).

The matching logic is identical in both; only the input shape differs. Implement as one small pure function reused by a thin client wrapper and a thin server wrapper, rather than two independent implementations.

### 3. Studio UI (client) changes

- `apps/studio/src/features/gazettes/constants.ts`: remove `GazetteCategories`/`GAZETTE_CATEGORIES` as the source of dropdown values. Add `GAZETTE_CATEGORY_LABEL = "Category"`. Keep the three category name strings as the fixed keys `getSubcategoriesForCategory`'s hierarchy switch depends on (that parent→child mapping is inherent business logic, independent of storage format).
- `apps/studio/src/features/gazettes/contexts/GazetteSubcategoriesContext.tsx`: extend to also resolve the `"Category"` tagCategory (a `categories` list + `categoryMap`, same shape as the existing `subcategories`/`subcategoryMap`). `getSubcategoriesForCategory` continues to switch on the resolved category **label** (via `categoryMap`), not a raw uuid.
- `apps/studio/src/features/gazettes/components/GazetteModal/GazetteFormFields.tsx`: the Category `SingleSelect` switches from the static `GAZETTE_CATEGORIES` list to the context-provided tag-driven list (uuid values) — same pattern the Subcategory field already uses.
- `CreateGazetteModal.tsx` / `ModifyGazetteModal.tsx`: submit `tagged: [data.category, data.subcategory]` (both uuids, order irrelevant). Resolve `categoryMap[data.category]` for the presigned-upload S3 path call, same as `subcategoryMap[data.subcategory]` today.
- `GazetteTable.tsx` and `ViewGazetteModal`: replace `page?.category` and `page?.tagged?.[0]` reads with `resolveGazetteTagLabels` against the row's `tagged` + the collection's `tagCategories`.

### 4. Server write path

- `apps/studio/src/schemas/gazette.ts`: remove `category` from `gazetteMetadataSchema` (the server-side schema used by `createGazetteServerSchema`/`updateGazetteServerSchema`) — `tagged` (now length 2) becomes the only source of truth server-side. The client-facing `createGazetteSchema.category` field stays (it's the form field binding), still validated as a non-empty string (now a uuid rather than a label).
- `apps/studio/src/server/modules/gazette/gazette.router.ts` `create`/`update` mutations: drop the `category` param from `buildGazetteBlobContent`; write `tagged` only.

### 5. Server read / derived logic

- **List sort** (`gazette.router.ts:120-132`): fetch the collection's 3 category-option uuids once per request (via the collection's `tagCategories`), replace the `content->'page'->>'category'` string `CASE WHEN` with jsonb-containment checks (`content->'page'->'tagged' @> '["<uuid>"]'::jsonb`) against each of the 3 uuids, preserving the same priority ordering (Government Gazette=1, Legislative Supplements=2, Other Supplements=3, else=4).
- **Duplicate-notification check** (`gazette.service.ts:502-547`, `hasDuplicateNotificationNumber`): resolve the target category's uuid before querying (the caller already knows the category by label); replace the `content->'page'->>'category' = category` string-equality filter with the equivalent jsonb-containment check. `isGovernmentGazette` compares the resolved label, not a raw DB column.
- **Algolia/SearchSG ingestion** (`schedulePushDocumentJob.ts:56-141`): already fetches the parent IndexPage's `tagCategories` and resolves the subcategory label by id (lines 112-130). Generalize this to resolve **both** `categoryLabel` and `subcategoryLabel` via `resolveGazetteTagLabels`, instead of the current single hardcoded `tagged[0]` find. `pushDocumentContentSchema` (lines 25-32) drops its `category: z.string()` field since it's no longer present on `content.page`.

### 6. Tests

- `apps/studio/src/server/modules/gazette/__tests__/gazette.service.test.ts`
- `apps/studio/src/server/cron/jobs/__test__/schedulePushDocumentJob.test.ts`
- `apps/studio/tests/msw/handlers/gazette.ts`

All currently hardcode `category: "Government Gazettes"` as a plain string fixture. Update each to seed a `"Category"` tagCategory (uuid-keyed options) alongside the existing `"Sub-category"` one, and reference selections by uuid the way subcategory fixtures already do.

## Non-goals

- Data backfill / migration script (separate branch).
- Any change to the S3 key convention (`${year}/${category}/${subcategory}/${filename}`) — it continues to receive already-resolved label strings from the client, same as today.
- Any change to the fixed 3-category / per-category-subcategory hierarchy business rules in `constants.ts`.
