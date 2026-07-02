/**
 * One-shot off-hours migration script
 *
 * Populates `categoryOptions` on each Collection Index blob and backfills
 * `categoryId` on each Collection Item (CollectionPage + CollectionLink)
 * from the existing legacy free-text `category` string field.
 *
 * Strategy: auto-migrate as-is.
 *   - Create `categoryOptions` from the distinct raw `category` strings found
 *     in child items (case-sensitive dedup after trim).
 *   - Assign the matching UUID as `categoryId` on each child item.
 *   - Legacy `category` strings are preserved (not removed).
 *
 * Idempotency: A collection is skipped when its Collection Index draft blob
 * already contains a non-empty `categoryOptions` array.
 *
 * Run from the repo root:
 *   # all sites
 *   pnpm tsx apps/studio/prisma/scripts/migrate-category-to-categoryid.ts
 *   # single site
 *   pnpm tsx apps/studio/prisma/scripts/migrate-category-to-categoryid.ts --site-id <id>
 *   # dry run (reads only — logs what would change, writes nothing)
 *   pnpm tsx apps/studio/prisma/scripts/migrate-category-to-categoryid.ts [--site-id <id>] --dry-run
 *
 * Requires DATABASE_URL in the environment (or a .env file at
 * apps/studio/.env loaded by tsx via --env-file or dotenv).
 */

import type { RawBuilder } from "kysely"
import { config } from "dotenv"
import { resolve } from "path"
import { fileURLToPath } from "url"
import { parseArgs } from "util"

import type { DB, Transaction } from "@isomer/db"
import { createDb } from "@isomer/db"
import { ResourceState, ResourceType, sql } from "@isomer/db"

// ---------------------------------------------------------------------------
// Bootstrap environment
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL(".", import.meta.url))
// Runs at import time (outside the process.argv guard), so any test that
// imports this module will load apps/studio/.env into process.env. The unit
// tests are unaffected because they never call main(), but be aware that
// DATABASE_URL and other local secrets will be present in the test process
// if a .env file exists on the machine.
config({ path: resolve(__dirname, "../../.env") })

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

// Fill this in before running. Must be the ID of an existing User row.
const PUBLISHER_USER_ID = ""

// Cast a plain value to JSONB — same helper pattern as database/utils.ts
function jsonb(
  value: Record<string, unknown>,
): RawBuilder<PrismaJson.BlobJsonContent> {
  return sql`CAST(${JSON.stringify(value)} AS JSONB)` as RawBuilder<PrismaJson.BlobJsonContent>
}

// Returns versionNum + 1 for the given published version, or 1 if none exists.
async function getNextVersionNum(
  tx: Transaction<DB>,
  publishedVersionId: string | null,
): Promise<number> {
  if (!publishedVersionId) return 1
  const existing = await tx
    .selectFrom("Version")
    .where("id", "=", publishedVersionId)
    .select("versionNum")
    .executeTakeFirst()
  return (existing?.versionNum ?? 0) + 1
}

// ---------------------------------------------------------------------------
// Pure data-transformation helpers (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Returns true when the Collection Index draft blob already has a non-empty
 * `categoryOptions` array — used for the idempotency check.
 */
export function hasCategoryOptions(
  indexDraftContent: Record<string, unknown> | null,
): boolean {
  const page = indexDraftContent?.["page"] as
    | Record<string, unknown>
    | undefined
  const opts = page?.["categoryOptions"]
  return Array.isArray(opts) && opts.length > 0
}

interface ChildItemBlob {
  resourceId: string
  draftContent: Record<string, unknown> | null
  publishedContent: Record<string, unknown> | null
}

/**
 * Scans child item blobs and returns a Map from trimmed category label →
 * list of resource IDs that carry that label.
 *
 * Rules:
 *   - Prefers draftContent over publishedContent.
 *   - Skips items with no content, no `page`, or a non-string `category`.
 *   - Trims whitespace; skips empty strings after trimming.
 *   - Deduplication is case-sensitive (e.g. "Health" and "health" are distinct).
 */
export function buildLabelMap(
  childItems: ChildItemBlob[],
): Map<string, string[]> {
  const labelToResourceIds = new Map<string, string[]>()

  for (const child of childItems) {
    const content = child.draftContent ?? child.publishedContent
    if (!content) continue

    const page = content["page"] as Record<string, unknown> | undefined
    if (!page) continue

    const rawCategory = page["category"]
    if (typeof rawCategory !== "string") continue

    const trimmed = rawCategory.trim()
    if (trimmed.length === 0) continue

    const existing = labelToResourceIds.get(trimmed)
    if (existing) {
      existing.push(child.resourceId)
    } else {
      labelToResourceIds.set(trimmed, [child.resourceId])
    }
  }

  return labelToResourceIds
}

/**
 * Given a label → resource-IDs map, assigns a fresh UUID to each distinct
 * label and returns:
 *   - `categoryOptions`: the array to write onto the Collection Index blob.
 *   - `labelToId`: lookup used to stamp `categoryId` on each child item.
 */
export function buildCategoryOptions(labelMap: Map<string, string[]>): {
  categoryOptions: { id: string; label: string }[]
  labelToId: Map<string, string>
} {
  const categoryOptions: { id: string; label: string }[] = []
  const labelToId = new Map<string, string>()

  for (const label of labelMap.keys()) {
    const id = crypto.randomUUID()
    categoryOptions.push({ id, label })
    labelToId.set(label, id)
  }

  return { categoryOptions, labelToId }
}

// ---------------------------------------------------------------------------
// Main migration
// ---------------------------------------------------------------------------

async function main() {
  if (!PUBLISHER_USER_ID) {
    console.error(
      "PUBLISHER_USER_ID is not set. Set the constant at the top of the script to an existing User id.",
    )
    process.exit(1)
  }

  // oxlint-disable-next-line node/no-process-env
  const DATABASE_URL = process.env["DATABASE_URL"]
  if (!DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. Copy apps/studio/.env.example to apps/studio/.env and fill in the values.",
    )
    process.exit(1)
  }

  const { values: flags } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "site-id": { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  })

  const dryRun = flags["dry-run"] ?? false

  const targetSiteId = flags["site-id"]
  if (targetSiteId !== undefined && !/^\d+$/.test(targetSiteId)) {
    console.error(
      `--site-id must be a positive integer, got: "${targetSiteId}"`,
    )
    process.exit(1)
  }

  const db = createDb({ connectionString: DATABASE_URL })

  console.log(
    dryRun
      ? "Starting category → categoryId migration… (DRY RUN — no writes)"
      : "Starting category → categoryId migration…",
  )

  // 1. Find target sites (all, or a single site when --site-id is given)
  let sitesQuery = db.selectFrom("Site").select("id")
  if (targetSiteId !== undefined) {
    sitesQuery = sitesQuery.where("id", "=", Number(targetSiteId))
  }
  const sites = await sitesQuery.execute()

  if (sites.length === 0) {
    console.error(
      targetSiteId !== undefined
        ? `No site found with id=${targetSiteId}.`
        : "No sites found in the database.",
    )
    process.exit(1)
  }

  console.log(
    targetSiteId !== undefined
      ? `Running for site id=${targetSiteId}.`
      : `Found ${sites.length} site(s). Running for all.`,
  )

  let totalCollectionsProcessed = 0
  let totalCollectionsSkipped = 0
  let totalOptionsCreated = 0
  let totalItemsUpdated = 0

  for (const site of sites) {
    const siteId = site.id

    // 2. Find all Collection resources that have an IndexPage child
    const collections = await db
      .selectFrom("Resource as col")
      .innerJoin("Resource as idx", (join) =>
        join
          .onRef("idx.parentId", "=", "col.id")
          .on("idx.type", "=", ResourceType.IndexPage)
          .on("idx.siteId", "=", siteId),
      )
      .where("col.siteId", "=", siteId)
      .where("col.type", "=", ResourceType.Collection)
      .select([
        "col.id as collectionId",
        "col.title as collectionTitle",
        "idx.id as indexPageId",
      ])
      .execute()

    for (const collection of collections) {
      const collectionId = collection.collectionId
      const indexPageId = collection.indexPageId
      const collectionTitle = collection.collectionTitle

      await db.transaction().execute(async (tx) => {
        // 3. Read the Collection Index resource (draft + published info)
        const indexResource = await tx
          .selectFrom("Resource")
          .where("id", "=", indexPageId)
          .where("siteId", "=", siteId)
          .select(["id", "draftBlobId", "publishedVersionId"])
          .executeTakeFirst()

        if (!indexResource) {
          console.log(
            `  [SKIP] Collection "${collectionTitle}" (id=${collectionId}): index page resource not found.`,
          )
          totalCollectionsSkipped++
          return
        }

        // 4. Resolve the draft blob content for the Collection Index
        let indexDraftContent: Record<string, unknown> | null = null
        const existingDraftBlobId: string | null = indexResource.draftBlobId

        if (existingDraftBlobId) {
          const draftBlob = await tx
            .selectFrom("Blob")
            .where("id", "=", existingDraftBlobId)
            .select("content")
            .executeTakeFirst()
          // Kysely returns the JSON column parsed — cast as any for introspection
          indexDraftContent = (draftBlob?.content ?? null) as Record<
            string,
            unknown
          > | null
        }

        // If no draft, read from published blob
        if (!indexDraftContent && indexResource.publishedVersionId) {
          const publishedBlob = await tx
            .selectFrom("Blob")
            .where(
              "Blob.id",
              "=",
              tx
                .selectFrom("Version")
                .where("id", "=", indexResource.publishedVersionId)
                .select("blobId"),
            )
            .select("content")
            .executeTakeFirst()
          indexDraftContent = (publishedBlob?.content ?? null) as Record<
            string,
            unknown
          > | null
        }

        // 5. Idempotency check — skip if categoryOptions already non-empty.
        //    This is safe because steps 10–11 run inside a single transaction:
        //    either both the index categoryOptions and all child categoryIds are
        //    committed together, or nothing is. A non-empty categoryOptions
        //    therefore guarantees the child items were also stamped.
        //
        //    ⚠️  Do NOT manually clear categoryOptions and re-run: the script
        //    generates fresh UUIDs each time, which would break any categoryId
        //    references already stored by the app from the original run.
        const existingPage = indexDraftContent?.["page"] as
          | Record<string, unknown>
          | undefined
        if (hasCategoryOptions(indexDraftContent)) {
          const existingCategoryOptions = existingPage?.[
            "categoryOptions"
          ] as unknown[]
          console.log(
            `  [SKIP] Collection "${collectionTitle}" (id=${collectionId}): categoryOptions already populated (${existingCategoryOptions.length} options).`,
          )
          totalCollectionsSkipped++
          return
        }

        // 6. Fetch all direct child items (CollectionPage + CollectionLink)
        const childItems = await tx
          .selectFrom("Resource as r")
          .leftJoin("Blob as draftBlob", "r.draftBlobId", "draftBlob.id")
          .leftJoin("Version as v", "r.publishedVersionId", "v.id")
          .leftJoin("Blob as publishedBlob", "v.blobId", "publishedBlob.id")
          .where("r.parentId", "=", collectionId)
          .where("r.siteId", "=", siteId)
          .where("r.type", "in", [
            ResourceType.CollectionPage,
            ResourceType.CollectionLink,
          ])
          .select([
            "r.id as resourceId",
            "r.draftBlobId",
            "r.publishedVersionId",
            sql<Record<string, unknown> | null>`"draftBlob"."content"`.as(
              "draftContent",
            ),
            sql<Record<string, unknown> | null>`"publishedBlob"."content"`.as(
              "publishedContent",
            ),
          ])
          .execute()

        // 7. Collect distinct category strings from child items
        // Prefer draft blob content; fall back to published blob content
        const labelToResourceIds = buildLabelMap(childItems)

        // 8. Skip if no distinct labels found
        if (labelToResourceIds.size === 0) {
          console.log(
            `  [SKIP] Collection "${collectionTitle}" (id=${collectionId}): no non-empty category strings found in child items.`,
          )
          totalCollectionsSkipped++
          return
        }

        // 9. Generate UUID for each distinct label → build categoryOptions
        const { categoryOptions, labelToId } =
          buildCategoryOptions(labelToResourceIds)

        // 10. Write categoryOptions to the Collection Index draft blob
        const newIndexContent: Record<string, unknown> = {
          ...(indexDraftContent ?? {}),
          page: {
            ...(existingPage ?? {}),
            categoryOptions,
          },
        }

        if (!dryRun) {
          if (existingDraftBlobId) {
            await tx
              .updateTable("Blob")
              .set({ content: jsonb(newIndexContent) })
              .where("id", "=", existingDraftBlobId)
              .execute()
          } else {
            const newBlob = await tx
              .insertInto("Blob")
              .values({ content: jsonb(newIndexContent) })
              .returning("id")
              .executeTakeFirstOrThrow()

            const newVersionNum = await getNextVersionNum(
              tx,
              indexResource.publishedVersionId,
            )
            const newVersion = await tx
              .insertInto("Version")
              .values({
                versionNum: newVersionNum,
                resourceId: indexPageId,
                blobId: newBlob.id,
                publishedAt: new Date(),
                publishedBy: PUBLISHER_USER_ID,
              })
              .returning("id")
              .executeTakeFirstOrThrow()

            await tx
              .updateTable("Resource")
              .where("id", "=", indexPageId)
              .set({
                publishedVersionId: newVersion.id,
                state: ResourceState.Published,
              })
              .execute()
          }
        }

        // 11. For each child item, write the matching categoryId to its draft blob
        let itemsUpdatedCount = 0

        for (const child of childItems) {
          const content = child.draftContent ?? child.publishedContent
          if (!content) continue

          const page = content["page"] as Record<string, unknown> | undefined
          if (!page) continue

          const rawCategory = page["category"]
          if (typeof rawCategory !== "string") continue

          const trimmed = rawCategory.trim()
          const categoryId = labelToId.get(trimmed)
          // If no matching label (empty string, etc.) skip
          if (!categoryId) continue

          const newChildContent: Record<string, unknown> = {
            ...content,
            page: {
              ...page,
              categoryId,
            },
          }

          if (!dryRun) {
            if (child.draftBlobId) {
              await tx
                .updateTable("Blob")
                .set({ content: jsonb(newChildContent) })
                .where("id", "=", child.draftBlobId)
                .execute()
            } else {
              const newBlob = await tx
                .insertInto("Blob")
                .values({ content: jsonb(newChildContent) })
                .returning("id")
                .executeTakeFirstOrThrow()

              const newVersionNum = await getNextVersionNum(
                tx,
                child.publishedVersionId,
              )
              const newVersion = await tx
                .insertInto("Version")
                .values({
                  versionNum: newVersionNum,
                  resourceId: child.resourceId,
                  blobId: newBlob.id,
                  publishedAt: new Date(),
                  publishedBy: PUBLISHER_USER_ID,
                })
                .returning("id")
                .executeTakeFirstOrThrow()

              await tx
                .updateTable("Resource")
                .where("id", "=", child.resourceId)
                .set({
                  publishedVersionId: newVersion.id,
                  state: ResourceState.Published,
                })
                .execute()
            }
          }

          itemsUpdatedCount++
        }

        console.log(
          dryRun
            ? `  [DRY RUN] Collection "${collectionTitle}" (id=${collectionId}): would create ${categoryOptions.length} option(s), stamp ${itemsUpdatedCount} item(s). Labels: ${categoryOptions.map((o) => o.label).join(", ")}`
            : `  [OK] Collection "${collectionTitle}" (id=${collectionId}): created ${categoryOptions.length} option(s), updated ${itemsUpdatedCount} item(s).`,
        )

        totalCollectionsProcessed++
        totalOptionsCreated += categoryOptions.length
        totalItemsUpdated += itemsUpdatedCount
      })
    }
  }

  console.log(
    dryRun
      ? "\n--- Dry-run summary (no writes) ---"
      : "\n--- Migration summary ---",
  )
  console.log(
    `Collections ${dryRun ? "would migrate" : "migrated"} : ${totalCollectionsProcessed}`,
  )
  console.log(`Collections skipped               : ${totalCollectionsSkipped}`)
  console.log(
    `Category options ${dryRun ? "would create" : "created"}   : ${totalOptionsCreated}`,
  )
  console.log(
    `Child items ${dryRun ? "would update" : "updated"}        : ${totalItemsUpdated}`,
  )
  console.log(
    dryRun ? "Dry run complete — no data was changed." : "Migration complete.",
  )

  await db.destroy()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .catch(console.error)
    .finally(() => process.exit())
}
