/**
 * Migrate each Collection's legacy `category` string values into a
 * "Category" tagCategories group on its Index, and tag every Collection
 * Item with the corresponding option UUID via `tagged`. The legacy
 * `category` field on each item is left untouched — it is still required
 * at the schema level until a later slice removes it.
 *
 * Appends the "Category" group to the END of the existing `tagCategories`
 * array so the current filter display order is preserved.
 *
 * Idempotent: a Collection whose Index already has a "Category" group is
 * skipped.
 *
 * Usage:
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/migrateCategoryToTagCategories.ts --site-id 123 [--dry-run]
 */
import type { UnwrapTagged } from "type-fest"
import { randomUUID } from "crypto"
import { fileURLToPath } from "url"
import { parseArgs } from "util"
import { db, jsonb, ResourceType, sql } from "~/server/modules/database"

const CATEGORY_GROUP_LABEL = "Category"

export interface TagCategoryOption {
  id: string
  label: string
}

export interface TagCategoryGroup {
  id: string
  label: string
  isRequired?: boolean
  options: TagCategoryOption[]
}

// Narrow local shapes for the blob fields this script reads/writes — see
// convert-folder-to-collection/helpers.ts for the precedent of not importing
// the full `IsomerSchema` union at runtime (tsx breaks on its unresolved
// `~` paths).
interface CollectionIndexContent {
  page: { tagCategories?: TagCategoryGroup[] }
}
interface CollectionItemContent {
  page: { category?: string; tagged?: string[] }
}

export const hasCategoryGroup = (tagCategories?: TagCategoryGroup[]): boolean =>
  (tagCategories ?? []).some((group) => group.label === CATEGORY_GROUP_LABEL)

export const deriveDistinctCategories = (
  categories: (string | undefined)[],
): string[] => {
  const distinct = new Set(
    categories.map((c) => c?.trim()).filter((c): c is string => !!c),
  )
  return Array.from(distinct).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  )
}

export const buildCategoryTagGroup = ({
  categories,
  generateId = randomUUID,
}: {
  categories: string[]
  generateId?: () => string
}): TagCategoryGroup => ({
  id: generateId(),
  label: CATEGORY_GROUP_LABEL,
  isRequired: true,
  options: categories.map((label) => ({ id: generateId(), label })),
})

export const appendTagged = (
  tagged: string[] | undefined,
  optionId: string | undefined,
): string[] => {
  const current = tagged ?? []
  if (!optionId || current.includes(optionId)) return current
  return [...current, optionId]
}

export interface MigrationPlanItem {
  resourceId: string
  category?: string
}

export interface MigrationPlan {
  status: "migrated" | "already-migrated" | "no-categories"
  newTagCategories?: TagCategoryGroup[]
  itemUpdates: { resourceId: string; tagged: string[] }[]
}

export const buildMigrationPlan = ({
  tagCategories,
  items,
  existingTagged,
  generateId = randomUUID,
}: {
  tagCategories?: TagCategoryGroup[]
  items: MigrationPlanItem[]
  existingTagged: Map<string, string[] | undefined>
  generateId?: () => string
}): MigrationPlan => {
  if (hasCategoryGroup(tagCategories)) {
    return { status: "already-migrated", itemUpdates: [] }
  }

  const categories = deriveDistinctCategories(items.map((i) => i.category))
  if (categories.length === 0) {
    return { status: "no-categories", itemUpdates: [] }
  }

  const group = buildCategoryTagGroup({ categories, generateId })
  const optionIdByLabel = new Map(group.options.map((o) => [o.label, o.id]))

  const itemUpdates = items.flatMap(({ resourceId, category }) => {
    const optionId = category ? optionIdByLabel.get(category.trim()) : undefined
    if (!optionId) return []
    return [
      {
        resourceId,
        tagged: appendTagged(existingTagged.get(resourceId), optionId),
      },
    ]
  })

  return {
    status: "migrated",
    newTagCategories: [...(tagCategories ?? []), group],
    itemUpdates,
  }
}

// ---------------------------------------------------------------------------
// DB access
// ---------------------------------------------------------------------------

interface BlobRow<T> {
  resourceId: string
  draftBlobId: string | null
  publishedBlobId: string | null
  draftContent: T | null
  publishedContent: T | null
}

const resolveEffectiveContent = <T>(
  row: BlobRow<T>,
): { blobId: string; content: T } | null => {
  if (row.publishedBlobId && row.publishedContent) {
    return { blobId: row.publishedBlobId, content: row.publishedContent }
  }
  if (row.draftBlobId && row.draftContent) {
    return { blobId: row.draftBlobId, content: row.draftContent }
  }
  return null
}

const getIndexPageRow = (collectionId: string, siteId: number) =>
  db
    .selectFrom("Resource as r")
    .leftJoin("Blob as draftBlob", "r.draftBlobId", "draftBlob.id")
    .leftJoin("Version as v", "r.publishedVersionId", "v.id")
    .leftJoin("Blob as publishedBlob", "v.blobId", "publishedBlob.id")
    .where("r.type", "=", ResourceType.IndexPage)
    .where("r.parentId", "=", collectionId)
    .where("r.siteId", "=", siteId)
    .select([
      "r.id as resourceId",
      "r.draftBlobId",
      "v.blobId as publishedBlobId",
      sql<CollectionIndexContent | null>`"draftBlob"."content"`.as(
        "draftContent",
      ),
      sql<CollectionIndexContent | null>`"publishedBlob"."content"`.as(
        "publishedContent",
      ),
    ])
    .executeTakeFirst()

const getItemRows = (collectionId: string, siteId: number) =>
  db
    .selectFrom("Resource as r")
    .leftJoin("Blob as draftBlob", "r.draftBlobId", "draftBlob.id")
    .leftJoin("Version as v", "r.publishedVersionId", "v.id")
    .leftJoin("Blob as publishedBlob", "v.blobId", "publishedBlob.id")
    .where("r.type", "in", [
      ResourceType.CollectionPage,
      ResourceType.CollectionLink,
    ])
    .where("r.parentId", "=", collectionId)
    .where("r.siteId", "=", siteId)
    .select([
      "r.id as resourceId",
      "r.draftBlobId",
      "v.blobId as publishedBlobId",
      sql<CollectionItemContent | null>`"draftBlob"."content"`.as(
        "draftContent",
      ),
      sql<CollectionItemContent | null>`"publishedBlob"."content"`.as(
        "publishedContent",
      ),
    ])
    .execute()

export interface CollectionMigrationResult {
  collectionId: string
  status: MigrationPlan["status"] | "no-index"
  categories: string[]
  itemsUpdated: number
}

export const migrateCollection = async ({
  collectionId,
  siteId,
  dryRun,
}: {
  collectionId: string
  siteId: number
  dryRun: boolean
}): Promise<CollectionMigrationResult> => {
  const indexRow = await getIndexPageRow(collectionId, siteId)
  const effectiveIndex = indexRow ? resolveEffectiveContent(indexRow) : null
  if (!effectiveIndex) {
    return { collectionId, status: "no-index", categories: [], itemsUpdated: 0 }
  }

  const itemRows = await getItemRows(collectionId, siteId)
  const effectiveItems = itemRows
    .map((row) => {
      const effective = resolveEffectiveContent(row)
      return effective && { resourceId: row.resourceId, ...effective }
    })
    .filter(
      (
        x,
      ): x is {
        resourceId: string
        blobId: string
        content: CollectionItemContent
      } => !!x,
    )

  const existingTagged = new Map(
    effectiveItems.map((item) => [item.resourceId, item.content.page.tagged]),
  )

  const plan = buildMigrationPlan({
    tagCategories: effectiveIndex.content.page.tagCategories,
    items: effectiveItems.map(({ resourceId, content }) => ({
      resourceId,
      category: content.page.category,
    })),
    existingTagged,
  })

  const categories =
    plan.newTagCategories?.at(-1)?.options.map((o) => o.label) ?? []

  if (plan.status !== "migrated" || dryRun) {
    return {
      collectionId,
      status: plan.status,
      categories,
      itemsUpdated: plan.itemUpdates.length,
    }
  }

  await db.transaction().execute(async (tx) => {
    await tx
      .updateTable("Blob")
      .set({
        content: jsonb({
          ...effectiveIndex.content,
          page: {
            ...effectiveIndex.content.page,
            tagCategories: plan.newTagCategories,
          },
        } as unknown as UnwrapTagged<PrismaJson.BlobJsonContent>),
      })
      .where("id", "=", effectiveIndex.blobId)
      .execute()

    for (const update of plan.itemUpdates) {
      const item = effectiveItems.find(
        (i) => i.resourceId === update.resourceId,
      )
      if (!item) continue
      await tx
        .updateTable("Blob")
        .set({
          content: jsonb({
            ...item.content,
            page: { ...item.content.page, tagged: update.tagged },
          } as unknown as UnwrapTagged<PrismaJson.BlobJsonContent>),
        })
        .where("id", "=", item.blobId)
        .execute()
    }
  })

  return {
    collectionId,
    status: "migrated",
    categories,
    itemsUpdated: plan.itemUpdates.length,
  }
}

export const migrateSite = async ({
  siteId,
  dryRun,
}: {
  siteId: number
  dryRun: boolean
}): Promise<CollectionMigrationResult[]> => {
  const collections = await db
    .selectFrom("Resource")
    .where("type", "=", ResourceType.Collection)
    .where("siteId", "=", siteId)
    .select(["id", "title"])
    .execute()

  const results: CollectionMigrationResult[] = []
  for (const collection of collections) {
    const result = await migrateCollection({
      collectionId: collection.id,
      siteId,
      dryRun,
    })
    results.push(result)
    console.log(formatResult(result, collection.title, dryRun))
  }
  return results
}

const formatResult = (
  result: CollectionMigrationResult,
  title: string,
  dryRun: boolean,
): string => {
  const prefix = `"${title}" (${result.collectionId})`
  switch (result.status) {
    case "migrated":
      return `${dryRun ? "[dry-run] would migrate" : "migrated"} ${prefix}: categories=[${result.categories.join(", ")}], items updated=${result.itemsUpdated}`
    case "already-migrated":
      return `skipped ${prefix}: already has a "Category" tagCategories group`
    case "no-categories":
      return `skipped ${prefix}: no legacy category values found on any item`
    case "no-index":
      return `skipped ${prefix}: no Index page (or content) found`
    default:
      return `${prefix}: unknown status ${String(result.status satisfies never)}`
  }
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

const main = async () => {
  const { values } = parseArgs({
    options: {
      "site-id": { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  })

  const siteIdStr = values["site-id"]
  if (!siteIdStr || !/^\d+$/.test(siteIdStr)) {
    console.error(
      "Usage: tsx migrateCategoryToTagCategories.ts --site-id <numeric id> [--dry-run]",
    )
    process.exitCode = 1
    return
  }

  const siteId = Number(siteIdStr)
  const dryRun = values["dry-run"] === true

  console.log(
    `${dryRun ? "[DRY RUN] " : ""}Migrating category → tagCategories for site ${siteId}…`,
  )
  const results = await migrateSite({ siteId, dryRun })
  console.log(`\nDone. ${results.length} collection(s) processed.`)
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    await main()
  } catch (err) {
    console.error("\n✗ Migration failed:", err)
    process.exitCode = 1
  } finally {
    await db.destroy()
  }
}
