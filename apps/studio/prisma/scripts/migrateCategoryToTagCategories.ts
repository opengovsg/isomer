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
 * Draft-aware: a Collection Item or Index can have draft content that
 * diverges from its published content (or exists only on one side). Both
 * sides are read and updated independently, so a category value sitting
 * only in someone's unpublished draft still gets an option slot, and isn't
 * silently lost or reverted by a later, unrelated publish:
 *   - Published-side changes go through a proper new Version (new Blob +
 *     new Version row + bumped `publishedVersionId`) — never an in-place
 *     rewrite of a historical Blob row.
 *   - Draft-side changes mutate the draft Blob's content in place, and
 *     never trigger a publish — a draft may hold unrelated pending edits
 *     that aren't ready to ship.
 *
 * Idempotent via label: if the Index already has a tagCategories group
 * labeled "Category" (draft or published), the collection is skipped.
 * Risk accepted: a human-created group with that exact label is also
 * skipped (legacy `category` values would not be migrated). Audit with
 * `findCategoryTagGroups.sql` before running against an environment.
 *
 * Display: the new "Category" group is written with `display: "plaintext"`.
 * Every pre-existing group on the same Index is stamped with an explicit
 * `display: "pills"` — the rendering behaviour they already had by default —
 * since the `display` field postdates those groups and they don't have it set.
 *
 * Usage:
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/migrateCategoryToTagCategories.ts --site-id 123 [--dry-run]
 */
import type { UnwrapTagged } from "type-fest"
import { input } from "@inquirer/prompts"
import { randomUUID } from "crypto"
import { fileURLToPath } from "url"
import { parseArgs } from "util"
import {
  db,
  type DB,
  jsonb,
  ResourceType,
  sql,
  type Transaction,
} from "~/server/modules/database"

const CATEGORY_GROUP_LABEL = "Category"

// Mirrors TAG_CATEGORY_DISPLAY_OPTIONS in
// packages/components/src/types/constants.ts — kept local so tsx does not
// load the full @opengovsg/isomer-components bundle (its dist still has
// unresolved `~` paths).
const TAG_CATEGORY_DISPLAY_OPTIONS = {
  Pills: "pills",
  Plaintext: "plaintext",
} as const

type TagCategoryDisplay =
  (typeof TAG_CATEGORY_DISPLAY_OPTIONS)[keyof typeof TAG_CATEGORY_DISPLAY_OPTIONS]

export interface TagCategoryOption {
  id: string
  label: string
}

export interface TagCategoryGroup {
  id: string
  label: string
  isRequired?: boolean
  display?: TagCategoryDisplay
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
  display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
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
  draftCategory?: string
  draftTagged?: string[]
  publishedCategory?: string
  publishedTagged?: string[]
}

export interface ItemTagUpdate {
  resourceId: string
  state: "draft" | "published"
  tagged: string[]
}

export type MigrationPlan =
  | { status: "no-categories"; itemUpdates: [] }
  | {
      status: "migrated"
      group: TagCategoryGroup
      itemUpdates: ItemTagUpdate[]
    }

export const buildMigrationPlan = ({
  items,
  generateId = randomUUID,
}: {
  items: MigrationPlanItem[]
  generateId?: () => string
}): MigrationPlan => {
  const categories = deriveDistinctCategories(
    items.flatMap((item) => [item.draftCategory, item.publishedCategory]),
  )
  if (categories.length === 0) {
    return { status: "no-categories", itemUpdates: [] }
  }

  const group = buildCategoryTagGroup({ categories, generateId })
  const optionIdByLabel = new Map(group.options.map((o) => [o.label, o.id]))

  const itemUpdates = items.flatMap(
    ({
      resourceId,
      draftCategory,
      draftTagged,
      publishedCategory,
      publishedTagged,
    }): ItemTagUpdate[] => {
      const updates: ItemTagUpdate[] = []

      const draftOptionId = draftCategory
        ? optionIdByLabel.get(draftCategory.trim())
        : undefined
      if (draftOptionId) {
        updates.push({
          resourceId,
          state: "draft",
          tagged: appendTagged(draftTagged, draftOptionId),
        })
      }

      const publishedOptionId = publishedCategory
        ? optionIdByLabel.get(publishedCategory.trim())
        : undefined
      if (publishedOptionId) {
        updates.push({
          resourceId,
          state: "published",
          tagged: appendTagged(publishedTagged, publishedOptionId),
        })
      }

      return updates
    },
  )

  return { status: "migrated", group, itemUpdates }
}

// ---------------------------------------------------------------------------
// DB access
// ---------------------------------------------------------------------------

export const verifyUser = async (userId: string) => {
  const user = await db
    .selectFrom("User")
    .where("id", "=", userId)
    .select("id")
    .executeTakeFirst()
  if (!user) throw new Error(`User ${userId} not found`)
  return user
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
      "r.publishedVersionId",
      "v.blobId as publishedBlobId",
      "v.versionNum as publishedVersionNum",
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
      "r.publishedVersionId",
      "v.blobId as publishedBlobId",
      "v.versionNum as publishedVersionNum",
      sql<CollectionItemContent | null>`"draftBlob"."content"`.as(
        "draftContent",
      ),
      sql<CollectionItemContent | null>`"publishedBlob"."content"`.as(
        "publishedContent",
      ),
    ])
    .execute()

const updateBlobContent = <T>(
  tx: Transaction<DB>,
  blobId: string,
  content: T,
) =>
  tx
    .updateTable("Blob")
    .set({
      content: jsonb(
        content as unknown as UnwrapTagged<PrismaJson.BlobJsonContent>,
      ),
    })
    .where("id", "=", blobId)
    .execute()

/** Publishes new content as a brand-new Version — never rewrites a historical Blob. */
const publishNewContent = async <T>(
  tx: Transaction<DB>,
  {
    resourceId,
    previousVersionNum,
    publisherId,
    content,
  }: {
    resourceId: string
    previousVersionNum: number
    publisherId: string
    content: T
  },
) => {
  const newBlob = await tx
    .insertInto("Blob")
    .values({
      content: jsonb(
        content as unknown as UnwrapTagged<PrismaJson.BlobJsonContent>,
      ),
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  const newVersion = await tx
    .insertInto("Version")
    .values({
      versionNum: previousVersionNum + 1,
      resourceId,
      blobId: newBlob.id,
      publishedAt: new Date(),
      publishedBy: publisherId,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  await tx
    .updateTable("Resource")
    .set({ publishedVersionId: newVersion.id })
    .where("id", "=", resourceId)
    .execute()
}

const appendCategoryGroup = (
  tagCategories: TagCategoryGroup[] | undefined,
  group: TagCategoryGroup,
): TagCategoryGroup[] => [
  ...(tagCategories ?? []).map((existing) => ({
    ...existing,
    display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
  })),
  group,
]

/** True if any group is labeled "Category" — the migration's skip signal. */
export const hasCategoryGroup = (
  tagCategories: TagCategoryGroup[] | undefined,
): boolean =>
  (tagCategories ?? []).some((group) => group.label === CATEGORY_GROUP_LABEL)

export interface CollectionMigrationResult {
  collectionId: string
  status: MigrationPlan["status"] | "no-index" | "already-migrated"
  categories: string[]
  itemsUpdated: number
  versionsCreated: number
}

export const migrateCollection = async ({
  collectionId,
  siteId,
  dryRun,
  publisherId,
}: {
  collectionId: string
  siteId: number
  dryRun: boolean
  publisherId: string | null
}): Promise<CollectionMigrationResult> => {
  const indexRow = await getIndexPageRow(collectionId, siteId)
  if (!indexRow || (!indexRow.draftContent && !indexRow.publishedContent)) {
    return {
      collectionId,
      status: "no-index",
      categories: [],
      itemsUpdated: 0,
      versionsCreated: 0,
    }
  }

  // Risk accepted: skip when any "Category" group exists (draft or published).
  // That covers re-runs and Studio-migrated collections, but also skips a
  // human-created group with the same label. Confirmed empty via
  // findCategoryTagGroups.sql before first run on each environment.
  if (
    hasCategoryGroup(indexRow.draftContent?.page.tagCategories) ||
    hasCategoryGroup(indexRow.publishedContent?.page.tagCategories)
  ) {
    return {
      collectionId,
      status: "already-migrated",
      categories: [],
      itemsUpdated: 0,
      versionsCreated: 0,
    }
  }

  const itemRows = await getItemRows(collectionId, siteId)

  const plan = buildMigrationPlan({
    items: itemRows.map((row) => ({
      resourceId: row.resourceId,
      draftCategory: row.draftContent?.page.category,
      draftTagged: row.draftContent?.page.tagged,
      publishedCategory: row.publishedContent?.page.category,
      publishedTagged: row.publishedContent?.page.tagged,
    })),
  })

  const categories =
    plan.status === "migrated" ? plan.group.options.map((o) => o.label) : []
  const itemsUpdated = new Set(plan.itemUpdates.map((u) => u.resourceId)).size
  // New Versions this run will (or, in dry-run, would) create — the index's
  // published side plus one per item published-side update.
  const versionsCreated =
    plan.status === "migrated"
      ? (indexRow.publishedContent ? 1 : 0) +
        plan.itemUpdates.filter((u) => u.state === "published").length
      : 0

  if (plan.status !== "migrated" || dryRun) {
    return {
      collectionId,
      status: plan.status,
      categories,
      itemsUpdated,
      versionsCreated,
    }
  }

  const group = plan.group
  const requirePublisherId = (): string => {
    if (!publisherId) {
      throw new Error(
        "publisherId is required to migrate a collection with published content outside --dry-run",
      )
    }
    return publisherId
  }

  await db.transaction().execute(async (tx) => {
    if (indexRow.draftContent && indexRow.draftBlobId) {
      await updateBlobContent(tx, indexRow.draftBlobId, {
        ...indexRow.draftContent,
        page: {
          ...indexRow.draftContent.page,
          tagCategories: appendCategoryGroup(
            indexRow.draftContent.page.tagCategories,
            group,
          ),
        },
      })
    }

    if (indexRow.publishedContent && indexRow.publishedVersionNum != null) {
      await publishNewContent(tx, {
        resourceId: indexRow.resourceId,
        previousVersionNum: indexRow.publishedVersionNum,
        publisherId: requirePublisherId(),
        content: {
          ...indexRow.publishedContent,
          page: {
            ...indexRow.publishedContent.page,
            tagCategories: appendCategoryGroup(
              indexRow.publishedContent.page.tagCategories,
              group,
            ),
          },
        },
      })
    }

    const itemRowByResourceId = new Map(
      itemRows.map((row) => [row.resourceId, row]),
    )
    for (const update of plan.itemUpdates) {
      const row = itemRowByResourceId.get(update.resourceId)
      if (!row) continue

      if (update.state === "draft" && row.draftContent && row.draftBlobId) {
        await updateBlobContent(tx, row.draftBlobId, {
          ...row.draftContent,
          page: { ...row.draftContent.page, tagged: update.tagged },
        })
      } else if (
        update.state === "published" &&
        row.publishedContent &&
        row.publishedVersionNum != null
      ) {
        await publishNewContent(tx, {
          resourceId: row.resourceId,
          previousVersionNum: row.publishedVersionNum,
          publisherId: requirePublisherId(),
          content: {
            ...row.publishedContent,
            page: { ...row.publishedContent.page, tagged: update.tagged },
          },
        })
      }
    }
  })

  return {
    collectionId,
    status: "migrated",
    categories,
    itemsUpdated,
    versionsCreated,
  }
}

export const migrateSite = async ({
  siteId,
  dryRun,
  publisherId,
}: {
  siteId: number
  dryRun: boolean
  publisherId: string | null
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
      publisherId,
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
      return `${dryRun ? "[dry-run] would migrate" : "migrated"} ${prefix}: categories=[${result.categories.join(", ")}], items updated=${result.itemsUpdated}, new versions ${dryRun ? "to create" : "created"}=${result.versionsCreated}`
    case "no-categories":
      return `skipped ${prefix}: no legacy category values found on any item`
    case "no-index":
      return `skipped ${prefix}: no Index page (or content) found`
    case "already-migrated":
      return `skipped ${prefix}: Index already has a "Category" tagCategories group`
    default:
      return `${prefix}: unknown status ${String(result.status satisfies never)}`
  }
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

export const main = async (argv: string[] = process.argv.slice(2)) => {
  const { values } = parseArgs({
    args: argv,
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

  let publisherId: string | null = null
  if (!dryRun) {
    const rawUserId = await input({
      message:
        "User ID to record as publisher for the new Version rows this migration creates",
      validate: (v) => v.trim().length > 0 || "User ID is required",
    })
    publisherId = rawUserId.trim()
    await verifyUser(publisherId)
  }

  console.log(
    `${dryRun ? "[DRY RUN] " : ""}Migrating category → tagCategories for site ${siteId}…`,
  )
  const results = await migrateSite({ siteId, dryRun, publisherId })
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
