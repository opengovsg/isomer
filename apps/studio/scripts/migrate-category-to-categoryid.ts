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
 *   pnpm tsx apps/studio/scripts/migrate-category-to-categoryid.ts
 *
 * Requires DATABASE_URL in the environment (or a .env file at
 * apps/studio/.env loaded by tsx via --env-file or dotenv).
 */

import { createDb } from "@isomer/db"
import { ResourceType, sql } from "@isomer/db"
import { config } from "dotenv"
import { resolve } from "path"
import { fileURLToPath } from "url"

// ---------------------------------------------------------------------------
// Bootstrap environment
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL(".", import.meta.url))
config({ path: resolve(__dirname, "../.env") })

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

// Cast a plain value to JSONB — same helper pattern as database/utils.ts
function jsonb<T>(value: T) {
  return sql`CAST(${JSON.stringify(value)} AS JSONB)`
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
  const page = indexDraftContent?.["page"] as Record<string, unknown> | undefined
  const opts = page?.["categoryOptions"]
  return Array.isArray(opts) && opts.length > 0
}

type ChildItemBlob = {
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
    const content = (child.draftContent ?? child.publishedContent) as Record<string, unknown> | null
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
  const DATABASE_URL = process.env["DATABASE_URL"]
  if (!DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. Copy apps/studio/.env.example to apps/studio/.env and fill in the values.",
    )
    process.exit(1)
  }

  const db = createDb({ connectionString: DATABASE_URL })

  console.log("Starting category → categoryId migration…")

  // 1. Find all sites
  const sites = await db
    .selectFrom("Site")
    .select("id")
    .execute()

  console.log(`Found ${sites.length} site(s).`)

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
      .select(["col.id as collectionId", "col.title as collectionTitle", "idx.id as indexPageId"])
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
        let existingDraftBlobId: string | null = indexResource.draftBlobId

        if (existingDraftBlobId) {
          const draftBlob = await tx
            .selectFrom("Blob")
            .where("id", "=", existingDraftBlobId)
            .select("content")
            .executeTakeFirst()
          // Kysely returns the JSON column parsed — cast as any for introspection
          indexDraftContent = (draftBlob?.content ?? null) as Record<string, unknown> | null
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
          indexDraftContent = (publishedBlob?.content ?? null) as Record<string, unknown> | null
        }

        // 5. Idempotency check — skip if categoryOptions already non-empty
        const existingPage = indexDraftContent?.["page"] as Record<string, unknown> | undefined
        if (hasCategoryOptions(indexDraftContent)) {
          const existingCategoryOptions = existingPage?.["categoryOptions"] as unknown[]
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
            sql<Record<string, unknown> | null>`"draftBlob"."content"`.as("draftContent"),
            sql<Record<string, unknown> | null>`"publishedBlob"."content"`.as("publishedContent"),
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
        const { categoryOptions, labelToId } = buildCategoryOptions(labelToResourceIds)

        // 10. Write categoryOptions to the Collection Index draft blob
        const newIndexContent: Record<string, unknown> = {
          ...(indexDraftContent ?? {}),
          page: {
            ...(existingPage ?? {}),
            categoryOptions,
          },
        }

        if (existingDraftBlobId) {
          // Update existing draft blob
          await tx
            .updateTable("Blob")
            .set({ content: jsonb(newIndexContent) })
            .where("id", "=", existingDraftBlobId)
            .execute()
        } else {
          // Create a new draft blob and point the Resource at it
          const newBlob = await tx
            .insertInto("Blob")
            .values({ content: jsonb(newIndexContent) })
            .returning("id")
            .executeTakeFirstOrThrow()

          await tx
            .updateTable("Resource")
            .where("id", "=", indexPageId)
            .set({ draftBlobId: newBlob.id })
            .execute()

          existingDraftBlobId = newBlob.id
        }

        // 11. For each child item, write the matching categoryId to its draft blob
        let itemsUpdatedCount = 0

        for (const child of childItems) {
          const content = (child.draftContent ?? child.publishedContent) as Record<string, unknown> | null
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

          if (child.draftBlobId) {
            // Update existing draft blob
            await tx
              .updateTable("Blob")
              .set({ content: jsonb(newChildContent) })
              .where("id", "=", child.draftBlobId)
              .execute()
          } else {
            // Create a new draft blob and point the Resource at it
            const newBlob = await tx
              .insertInto("Blob")
              .values({ content: jsonb(newChildContent) })
              .returning("id")
              .executeTakeFirstOrThrow()

            await tx
              .updateTable("Resource")
              .where("id", "=", child.resourceId)
              .set({ draftBlobId: newBlob.id })
              .execute()
          }

          itemsUpdatedCount++
        }

        console.log(
          `  [OK] Collection "${collectionTitle}" (id=${collectionId}): created ${categoryOptions.length} option(s), updated ${itemsUpdatedCount} item(s).`,
        )

        totalCollectionsProcessed++
        totalOptionsCreated += categoryOptions.length
        totalItemsUpdated += itemsUpdatedCount
      })
    }
  }

  console.log("\n--- Migration summary ---")
  console.log(`Collections migrated : ${totalCollectionsProcessed}`)
  console.log(`Collections skipped  : ${totalCollectionsSkipped}`)
  console.log(`Category options created: ${totalOptionsCreated}`)
  console.log(`Child items updated  : ${totalItemsUpdated}`)
  console.log("Migration complete.")

  await db.destroy()
}

main().catch(console.error).finally(() => process.exit())
