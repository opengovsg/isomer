/**
 * Migrate each Collection Item's legacy `tags` values
 * (`{ category: string, selected: string[] }[]`) into `tagCategories` groups
 * on its Index, and tag every Collection Item with the corresponding option
 * UUIDs via `tagged`. The legacy `tags` field on each item is left untouched
 * — it remains schema-optional / hidden until a later cleanup removes it.
 *
 * Appends the newly derived groups to the END of the existing `tagCategories`
 * array so any groups already present (including a "Category" group from
 * `migrateCategoryToTagCategories.ts`) keep their display order. Existing
 * groups are not re-stamped, so a prior Category group's `display: "plaintext"`
 * is preserved.
 *
 * Draft-aware: a Collection Item or Index can have draft content that
 * diverges from its published content (or exists only on one side). Both
 * sides are read and updated independently:
 *   - Published-side changes go through a proper new Version (new Blob +
 *     new Version row + bumped `publishedVersionId`) — never an in-place
 *     rewrite of a historical Blob row.
 *   - Draft-side changes mutate the draft Blob's content in place, and
 *     never trigger a publish — a draft may hold unrelated pending edits
 *     that aren't ready to ship.
 *
 * Not idempotent: this is a one-time migration intended to run exactly
 * once per site, against sites whose legacy `tags` have not yet been
 * ported into `tagCategories`/`tagged`. Re-running it against an
 * already-migrated site will double-append groups and re-tag every item.
 *
 * Display: each newly created group is written with `display: "pills"`
 * (the historical default for tag filters).
 *
 * Usage:
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/migrateTagsToTagCategories.ts --site-id 123 [--dry-run]
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

/** Legacy item-level tags shape (`page.tags`). */
export interface LegacyTag {
  category: string
  selected: string[]
}

// Narrow local shapes for the blob fields this script reads/writes — see
// convert-folder-to-collection/helpers.ts for the precedent of not importing
// the full `IsomerSchema` union at runtime (tsx breaks on its unresolved
// `~` paths).
interface CollectionIndexContent {
  page: { tagCategories?: TagCategoryGroup[] }
}
interface CollectionItemContent {
  page: { tags?: LegacyTag[]; tagged?: string[] }
}

const sortLabels = (labels: string[]) =>
  [...labels].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

/** category label → set of option labels, derived from legacy tags. */
export const collateLegacyTags = (
  tagLists: (LegacyTag[] | undefined)[],
): Map<string, Set<string>> => {
  const mappings = new Map<string, Set<string>>()

  for (const tags of tagLists) {
    if (!tags) continue
    for (const { category, selected } of tags) {
      const categoryLabel = category.trim()
      if (!categoryLabel) continue

      let options = mappings.get(categoryLabel)
      if (!options) {
        options = new Set()
        mappings.set(categoryLabel, options)
      }

      for (const value of selected) {
        const optionLabel = value.trim()
        if (optionLabel) options.add(optionLabel)
      }
    }
  }

  // Drop categories that ended up with no options (e.g. empty `selected`).
  for (const [categoryLabel, options] of mappings) {
    if (options.size === 0) mappings.delete(categoryLabel)
  }

  return mappings
}

export const buildTagGroupsFromLegacyTags = ({
  mappings,
  generateId = randomUUID,
}: {
  mappings: Map<string, Set<string>>
  generateId?: () => string
}): {
  groups: TagCategoryGroup[]
  optionIdByCategoryAndLabel: Map<string, Map<string, string>>
} => {
  const optionIdByCategoryAndLabel = new Map<string, Map<string, string>>()

  const groups = sortLabels(Array.from(mappings.keys())).map(
    (categoryLabel) => {
      const groupId = generateId()
      const optionLabels = sortLabels(
        Array.from(mappings.get(categoryLabel) ?? []),
      )
      const byLabel = new Map<string, string>()
      const options = optionLabels.map((label) => {
        const id = generateId()
        byLabel.set(label, id)
        return { id, label }
      })
      optionIdByCategoryAndLabel.set(categoryLabel, byLabel)

      return {
        id: groupId,
        label: categoryLabel,
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options,
      }
    },
  )

  return { groups, optionIdByCategoryAndLabel }
}

export const appendTaggedMany = (
  tagged: string[] | undefined,
  optionIds: string[],
): string[] => {
  const current = tagged ?? []
  if (optionIds.length === 0) return current
  const next = [...current]
  for (const id of optionIds) {
    if (!next.includes(id)) next.push(id)
  }
  return next
}

export const resolveOptionIdsFromLegacyTags = (
  tags: LegacyTag[] | undefined,
  optionIdByCategoryAndLabel: Map<string, Map<string, string>>,
): string[] => {
  if (!tags?.length) return []

  const ids: string[] = []
  for (const { category, selected } of tags) {
    const categoryLabel = category.trim()
    if (!categoryLabel) continue
    const byLabel = optionIdByCategoryAndLabel.get(categoryLabel)
    if (!byLabel) continue

    for (const value of selected) {
      const optionLabel = value.trim()
      if (!optionLabel) continue
      const id = byLabel.get(optionLabel)
      if (id && !ids.includes(id)) ids.push(id)
    }
  }
  return ids
}

export interface MigrationPlanItem {
  resourceId: string
  draftTags?: LegacyTag[]
  draftTagged?: string[]
  publishedTags?: LegacyTag[]
  publishedTagged?: string[]
}

export interface ItemTagUpdate {
  resourceId: string
  state: "draft" | "published"
  tagged: string[]
}

export type MigrationPlan =
  | { status: "no-tags"; itemUpdates: []; groups: [] }
  | {
      status: "migrated"
      groups: TagCategoryGroup[]
      itemUpdates: ItemTagUpdate[]
    }

export const buildMigrationPlan = ({
  items,
  generateId = randomUUID,
}: {
  items: MigrationPlanItem[]
  generateId?: () => string
}): MigrationPlan => {
  const mappings = collateLegacyTags(
    items.flatMap((item) => [item.draftTags, item.publishedTags]),
  )
  if (mappings.size === 0) {
    return { status: "no-tags", itemUpdates: [], groups: [] }
  }

  const { groups, optionIdByCategoryAndLabel } = buildTagGroupsFromLegacyTags({
    mappings,
    generateId,
  })

  const itemUpdates = items.flatMap(
    ({
      resourceId,
      draftTags,
      draftTagged,
      publishedTags,
      publishedTagged,
    }): ItemTagUpdate[] => {
      const updates: ItemTagUpdate[] = []

      const draftOptionIds = resolveOptionIdsFromLegacyTags(
        draftTags,
        optionIdByCategoryAndLabel,
      )
      if (draftOptionIds.length > 0) {
        updates.push({
          resourceId,
          state: "draft",
          tagged: appendTaggedMany(draftTagged, draftOptionIds),
        })
      }

      const publishedOptionIds = resolveOptionIdsFromLegacyTags(
        publishedTags,
        optionIdByCategoryAndLabel,
      )
      if (publishedOptionIds.length > 0) {
        updates.push({
          resourceId,
          state: "published",
          tagged: appendTaggedMany(publishedTagged, publishedOptionIds),
        })
      }

      return updates
    },
  )

  return { status: "migrated", groups, itemUpdates }
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

const appendTagGroups = (
  tagCategories: TagCategoryGroup[] | undefined,
  groups: TagCategoryGroup[],
): TagCategoryGroup[] => [...(tagCategories ?? []), ...groups]

export interface CollectionMigrationResult {
  collectionId: string
  status: MigrationPlan["status"] | "no-index"
  groups: { label: string; options: string[] }[]
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
      groups: [],
      itemsUpdated: 0,
      versionsCreated: 0,
    }
  }

  const itemRows = await getItemRows(collectionId, siteId)

  const plan = buildMigrationPlan({
    items: itemRows.map((row) => ({
      resourceId: row.resourceId,
      draftTags: row.draftContent?.page.tags,
      draftTagged: row.draftContent?.page.tagged,
      publishedTags: row.publishedContent?.page.tags,
      publishedTagged: row.publishedContent?.page.tagged,
    })),
  })

  const groups =
    plan.status === "migrated"
      ? plan.groups.map((g) => ({
          label: g.label,
          options: g.options.map((o) => o.label),
        }))
      : []
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
      groups,
      itemsUpdated,
      versionsCreated,
    }
  }

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
          tagCategories: appendTagGroups(
            indexRow.draftContent.page.tagCategories,
            plan.groups,
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
            tagCategories: appendTagGroups(
              indexRow.publishedContent.page.tagCategories,
              plan.groups,
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
    groups,
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
  const groupsSummary = result.groups
    .map((g) => `${g.label}[${g.options.join(", ")}]`)
    .join("; ")
  switch (result.status) {
    case "migrated":
      return `${dryRun ? "[dry-run] would migrate" : "migrated"} ${prefix}: groups={${groupsSummary}}, items updated=${result.itemsUpdated}, new versions ${dryRun ? "to create" : "created"}=${result.versionsCreated}`
    case "no-tags":
      return `skipped ${prefix}: no legacy tags found on any item`
    case "no-index":
      return `skipped ${prefix}: no Index page (or content) found`
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
      "Usage: tsx migrateTagsToTagCategories.ts --site-id <numeric id> [--dry-run]",
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
    `${dryRun ? "[DRY RUN] " : ""}Migrating tags → tagCategories for site ${siteId}…`,
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
