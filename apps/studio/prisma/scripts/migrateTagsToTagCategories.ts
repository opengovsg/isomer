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
 * Idempotent per group label: before writing, each candidate group label (derived
 * from legacy tag categories) is checked against the Index's existing
 * `tagCategories` on each side independently. Only missing groups are appended;
 * item `tagged` UUIDs are still backfilled using existing option ids when a
 * group is already present. A collection is skipped (`"already-migrated"`) only
 * when every side is up to date and every item already carries the expected
 * option UUIDs.
 *
 * Draft writes use optimistic concurrency (`Blob.updatedAt` + `Resource.draftBlobId`
 * guards) so concurrent Studio saves/publishes abort rather than clobber edits.
 *
 * Display: each newly created group is written with `display: "pills"`
 * (the historical default for tag filters).
 *
 * Site selection (edit the constants below):
 *   - SITE_IDS_INCLUDE empty → all sites; non-empty → only those IDs
 *   - SITE_IDS_EXCLUDE → removed from the resolved set (either way)
 * The resolved list is printed and must be confirmed before any writes.
 *
 * Usage:
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/migrateTagsToTagCategories.ts [--dry-run]
 */
import type { UnwrapTagged } from "type-fest"
import { confirm, input } from "@inquirer/prompts"
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

// ---------------------------------------------------------------------------
// Site selection — edit these before running
// ---------------------------------------------------------------------------

/** Empty = all sites. Non-empty = only these site IDs. */
const SITE_IDS_INCLUDE: number[] = []

/** Removed from the resolved set (after include / all-sites expansion). */
const SITE_IDS_EXCLUDE: number[] = []

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
        byLabel.set(normalizedGroupLabel(label), id)
        return { id, label }
      })
      optionIdByCategoryAndLabel.set(
        normalizedGroupLabel(categoryLabel),
        byLabel,
      )

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
    const byLabel = optionIdByCategoryAndLabel.get(
      normalizedGroupLabel(categoryLabel),
    )
    if (!byLabel) continue

    for (const value of selected) {
      const optionLabel = value.trim()
      if (!optionLabel) continue
      const id = byLabel.get(normalizedGroupLabel(optionLabel))
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

  const itemUpdates = buildItemUpdates({
    items,
    draftOptionIdByCategoryAndLabel: optionIdByCategoryAndLabel,
    publishedOptionIdByCategoryAndLabel: optionIdByCategoryAndLabel,
  })

  return { status: "migrated", groups, itemUpdates }
}

export const buildOptionIdLookupFromTagCategories = (
  tagCategories: TagCategoryGroup[] | undefined,
): Map<string, Map<string, string>> => {
  const lookup = new Map<string, Map<string, string>>()

  for (const group of tagCategories ?? []) {
    const categoryKey = normalizedGroupLabel(group.label)
    let byLabel = lookup.get(categoryKey)
    if (!byLabel) {
      byLabel = new Map()
      lookup.set(categoryKey, byLabel)
    }
    for (const option of group.options) {
      byLabel.set(normalizedGroupLabel(option.label), option.id)
    }
  }

  return lookup
}

export const buildOptionIdLookupFromTagGroups = (
  groups: TagCategoryGroup[],
): Map<string, Map<string, string>> =>
  buildOptionIdLookupFromTagCategories(groups)

export const mergeOptionIdLookups = (
  existing: Map<string, Map<string, string>>,
  additions: Map<string, Map<string, string>>,
): Map<string, Map<string, string>> => {
  const merged = new Map(existing)

  for (const [categoryKey, additionByLabel] of additions) {
    let byLabel = merged.get(categoryKey)
    if (!byLabel) {
      byLabel = new Map()
      merged.set(categoryKey, byLabel)
    }
    for (const [labelKey, optionId] of additionByLabel) {
      if (!byLabel.has(labelKey)) {
        byLabel.set(labelKey, optionId)
      }
    }
  }

  return merged
}

export const filterGroupsToAdd = (
  existingTagCategories: TagCategoryGroup[] | undefined,
  candidateGroups: TagCategoryGroup[],
): TagCategoryGroup[] =>
  candidateGroups.filter(
    (group) => !hasMatchingTagGroup(existingTagCategories, [group.label]),
  )

const taggedArraysEqual = (
  current: string[] | undefined,
  next: string[],
): boolean => {
  const a = current ?? []
  if (a.length !== next.length) return false
  return a.every((id, index) => id === next[index])
}

export const buildItemUpdates = ({
  items,
  draftOptionIdByCategoryAndLabel,
  publishedOptionIdByCategoryAndLabel,
}: {
  items: MigrationPlanItem[]
  draftOptionIdByCategoryAndLabel: Map<string, Map<string, string>>
  publishedOptionIdByCategoryAndLabel: Map<string, Map<string, string>>
}): ItemTagUpdate[] =>
  items.flatMap(
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
        draftOptionIdByCategoryAndLabel,
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
        publishedOptionIdByCategoryAndLabel,
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

export interface ReconciledMigrationWork {
  draftGroupsToAdd: TagCategoryGroup[]
  publishedGroupsToAdd: TagCategoryGroup[]
  itemUpdates: ItemTagUpdate[]
  isFullyMigrated: boolean
}

export const reconcileMigrationWork = ({
  plan,
  draftTagCategories,
  publishedTagCategories,
  items,
}: {
  plan: Extract<MigrationPlan, { status: "migrated" }>
  draftTagCategories?: TagCategoryGroup[]
  publishedTagCategories?: TagCategoryGroup[]
  items: MigrationPlanItem[]
}): ReconciledMigrationWork => {
  const draftGroupsToAdd = filterGroupsToAdd(draftTagCategories, plan.groups)
  const publishedGroupsToAdd = filterGroupsToAdd(
    publishedTagCategories,
    plan.groups,
  )

  const draftOptionIdByCategoryAndLabel = mergeOptionIdLookups(
    buildOptionIdLookupFromTagCategories(draftTagCategories),
    buildOptionIdLookupFromTagGroups(draftGroupsToAdd),
  )
  const publishedOptionIdByCategoryAndLabel = mergeOptionIdLookups(
    buildOptionIdLookupFromTagCategories(publishedTagCategories),
    buildOptionIdLookupFromTagGroups(publishedGroupsToAdd),
  )

  const itemUpdates = buildItemUpdates({
    items,
    draftOptionIdByCategoryAndLabel,
    publishedOptionIdByCategoryAndLabel,
  })

  const itemByResourceId = new Map(items.map((item) => [item.resourceId, item]))
  const isFullyMigrated =
    draftGroupsToAdd.length === 0 &&
    publishedGroupsToAdd.length === 0 &&
    itemUpdates.every((update) => {
      const item = itemByResourceId.get(update.resourceId)
      if (!item) return true
      const currentTagged =
        update.state === "draft" ? item.draftTagged : item.publishedTagged
      return taggedArraysEqual(currentTagged, update.tagged)
    })

  return {
    draftGroupsToAdd,
    publishedGroupsToAdd,
    itemUpdates,
    isFullyMigrated,
  }
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

export const resolveSiteIds = async ({
  include,
  exclude,
}: {
  include: number[]
  exclude: number[]
}): Promise<number[]> => {
  const excludeSet = new Set(exclude)
  const rows =
    include.length === 0
      ? await db.selectFrom("Site").select("id").execute()
      : await db
          .selectFrom("Site")
          .where("id", "in", include)
          .select("id")
          .execute()

  if (include.length > 0) {
    const found = new Set(rows.map((r) => r.id))
    const missing = include.filter((id) => !found.has(id))
    if (missing.length > 0) {
      throw new Error(`Site ID(s) not found: ${missing.join(", ")}`)
    }
  }

  return rows
    .map((r) => r.id)
    .filter((id) => !excludeSet.has(id))
    .sort((a, b) => a - b)
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
      sql<Date | null>`"draftBlob"."updatedAt"`.as("draftUpdatedAt"),
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
      sql<Date | null>`"draftBlob"."updatedAt"`.as("draftUpdatedAt"),
      sql<CollectionItemContent | null>`"draftBlob"."content"`.as(
        "draftContent",
      ),
      sql<CollectionItemContent | null>`"publishedBlob"."content"`.as(
        "publishedContent",
      ),
    ])
    .execute()

const updateDraftBlobInPlace = async <T>(
  tx: Transaction<DB>,
  {
    resourceId,
    expectedDraftBlobId,
    expectedUpdatedAt,
    mergeContent,
  }: {
    resourceId: string
    expectedDraftBlobId: string
    expectedUpdatedAt: Date
    mergeContent: (current: T) => T
  },
) => {
  const resource = await tx
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select("draftBlobId")
    .executeTakeFirst()

  if (resource?.draftBlobId !== expectedDraftBlobId) {
    throw new Error(
      `Concurrent publish detected on resource ${resourceId} — draftBlobId changed since it was read. Aborting.`,
    )
  }

  const currentBlob = await tx
    .selectFrom("Blob")
    .where("id", "=", expectedDraftBlobId)
    .select(["content", "updatedAt"])
    .executeTakeFirstOrThrow()

  const result = await tx
    .updateTable("Blob")
    .set({
      content: jsonb(
        mergeContent(
          currentBlob.content as unknown as T,
        ) as unknown as UnwrapTagged<PrismaJson.BlobJsonContent>,
      ),
    })
    .where("id", "=", expectedDraftBlobId)
    .where("updatedAt", "=", expectedUpdatedAt)
    .executeTakeFirst()

  if (result.numUpdatedRows === BigInt(0)) {
    throw new Error(
      `Concurrent draft edit detected on resource ${resourceId} — Blob.updatedAt changed since it was read. Aborting.`,
    )
  }
}

/** Publishes new content as a brand-new Version — never rewrites a historical Blob. */
const publishNewContent = async <T>(
  tx: Transaction<DB>,
  {
    resourceId,
    previousVersionNum,
    previousPublishedVersionId,
    publisherId,
    content,
  }: {
    resourceId: string
    previousVersionNum: number
    /** `Resource.publishedVersionId` as read earlier — guards against a concurrent publish. */
    previousPublishedVersionId: string | null
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

  // Optimistic-concurrency guard: only repoint publishedVersionId if it still
  // matches what we read before computing previousVersionNum. If a human
  // editor or scheduled publish committed a newer Version in the meantime,
  // this matches zero rows and we abort rather than silently clobber it.
  const result = await tx
    .updateTable("Resource")
    .set({ publishedVersionId: newVersion.id })
    .where("id", "=", resourceId)
    .where(
      "publishedVersionId",
      previousPublishedVersionId === null ? "is" : "=",
      previousPublishedVersionId,
    )
    .executeTakeFirst()

  if (result.numUpdatedRows === BigInt(0)) {
    throw new Error(
      `Concurrent publish detected on resource ${resourceId} — publishedVersionId changed since it was read. Aborting.`,
    )
  }
}

const appendTagGroups = (
  tagCategories: TagCategoryGroup[] | undefined,
  groups: TagCategoryGroup[],
): TagCategoryGroup[] => [...(tagCategories ?? []), ...groups]

/** Trim + lowercase — matches Studio tag-option duplicate rules. */
const normalizedGroupLabel = (label: string): string =>
  label.trim().toLowerCase()

/** True if any existing group's label matches one of the candidate labels — the migration's skip signal. */
export const hasMatchingTagGroup = (
  tagCategories: TagCategoryGroup[] | undefined,
  candidateLabels: string[],
): boolean => {
  const candidateSet = new Set(candidateLabels.map(normalizedGroupLabel))
  return (tagCategories ?? []).some((group) =>
    candidateSet.has(normalizedGroupLabel(group.label)),
  )
}

export interface CollectionMigrationResult {
  collectionId: string
  status: MigrationPlan["status"] | "no-index" | "already-migrated"
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

  const itemInputs: MigrationPlanItem[] = itemRows.map((row) => ({
    resourceId: row.resourceId,
    draftTags: row.draftContent?.page.tags,
    draftTagged: row.draftContent?.page.tagged,
    publishedTags: row.publishedContent?.page.tags,
    publishedTagged: row.publishedContent?.page.tagged,
  }))

  const plan = buildMigrationPlan({ items: itemInputs })

  let reconciled:
    | ReconciledMigrationWork
    | {
        draftGroupsToAdd: []
        publishedGroupsToAdd: []
        itemUpdates: []
        isFullyMigrated: true
      } = {
    draftGroupsToAdd: [],
    publishedGroupsToAdd: [],
    itemUpdates: [],
    isFullyMigrated: true,
  }

  if (plan.status === "migrated") {
    reconciled = reconcileMigrationWork({
      plan,
      draftTagCategories: indexRow.draftContent?.page.tagCategories,
      publishedTagCategories: indexRow.publishedContent?.page.tagCategories,
      items: itemInputs,
    })

    if (reconciled.isFullyMigrated) {
      return {
        collectionId,
        status: "already-migrated",
        groups: [],
        itemsUpdated: 0,
        versionsCreated: 0,
      }
    }
  }

  const groups =
    plan.status === "migrated"
      ? [...reconciled.draftGroupsToAdd, ...reconciled.publishedGroupsToAdd]
          .reduce<TagCategoryGroup[]>((acc, group) => {
            if (
              !acc.some(
                (existing) =>
                  normalizedGroupLabel(existing.label) ===
                  normalizedGroupLabel(group.label),
              )
            ) {
              acc.push(group)
            }
            return acc
          }, [])
          .map((g) => ({
            label: g.label,
            options: g.options.map((o) => o.label),
          }))
      : []
  const itemsUpdated = new Set(reconciled.itemUpdates.map((u) => u.resourceId))
    .size
  // New Versions this run will (or, in dry-run, would) create — the index's
  // published side plus one per item published-side update.
  const versionsCreated =
    plan.status === "migrated"
      ? (indexRow.publishedContent && reconciled.publishedGroupsToAdd.length > 0
          ? 1
          : 0) +
        reconciled.itemUpdates.filter((u) => u.state === "published").length
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
    if (
      indexRow.draftContent &&
      indexRow.draftBlobId &&
      indexRow.draftUpdatedAt &&
      reconciled.draftGroupsToAdd.length > 0
    ) {
      await updateDraftBlobInPlace(tx, {
        resourceId: indexRow.resourceId,
        expectedDraftBlobId: indexRow.draftBlobId,
        expectedUpdatedAt: indexRow.draftUpdatedAt,
        mergeContent: (current) => ({
          ...current,
          page: {
            ...current.page,
            tagCategories: appendTagGroups(
              current.page.tagCategories,
              reconciled.draftGroupsToAdd,
            ),
          },
        }),
      })
    }

    if (
      indexRow.publishedContent &&
      indexRow.publishedVersionNum != null &&
      reconciled.publishedGroupsToAdd.length > 0
    ) {
      await publishNewContent(tx, {
        resourceId: indexRow.resourceId,
        previousVersionNum: indexRow.publishedVersionNum,
        previousPublishedVersionId: indexRow.publishedVersionId,
        publisherId: requirePublisherId(),
        content: {
          ...indexRow.publishedContent,
          page: {
            ...indexRow.publishedContent.page,
            tagCategories: appendTagGroups(
              indexRow.publishedContent.page.tagCategories,
              reconciled.publishedGroupsToAdd,
            ),
          },
        },
      })
    }

    const itemRowByResourceId = new Map(
      itemRows.map((row) => [row.resourceId, row]),
    )
    for (const update of reconciled.itemUpdates) {
      const row = itemRowByResourceId.get(update.resourceId)
      if (!row) continue

      const currentTagged =
        update.state === "draft"
          ? row.draftContent?.page.tagged
          : row.publishedContent?.page.tagged
      if (taggedArraysEqual(currentTagged, update.tagged)) {
        continue
      }

      if (
        update.state === "draft" &&
        row.draftContent &&
        row.draftBlobId &&
        row.draftUpdatedAt
      ) {
        await updateDraftBlobInPlace(tx, {
          resourceId: row.resourceId,
          expectedDraftBlobId: row.draftBlobId,
          expectedUpdatedAt: row.draftUpdatedAt,
          mergeContent: (current) => ({
            ...current,
            page: { ...current.page, tagged: update.tagged },
          }),
        })
      } else if (
        update.state === "published" &&
        row.publishedContent &&
        row.publishedVersionNum != null
      ) {
        await publishNewContent(tx, {
          resourceId: row.resourceId,
          previousVersionNum: row.publishedVersionNum,
          previousPublishedVersionId: row.publishedVersionId,
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
    case "already-migrated":
      return `skipped ${prefix}: Index already has a matching tagCategories group`
    default:
      return `${prefix}: unknown status ${String(result.status satisfies never)}`
  }
}

const formatSiteSelection = ({
  include,
  exclude,
  resolved,
}: {
  include: number[]
  exclude: number[]
  resolved: number[]
}): string => {
  const includeLabel =
    include.length === 0 ? "(empty → all sites)" : include.join(", ")
  const excludeLabel = exclude.length === 0 ? "(empty)" : exclude.join(", ")
  return [
    `SITE_IDS_INCLUDE: ${includeLabel}`,
    `SITE_IDS_EXCLUDE: ${excludeLabel}`,
    `Resolved site IDs (${resolved.length}): ${resolved.length === 0 ? "(none)" : resolved.join(", ")}`,
  ].join("\n")
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

export const main = async (
  argv: string[] = process.argv.slice(2),
  {
    siteIdsInclude = SITE_IDS_INCLUDE,
    siteIdsExclude = SITE_IDS_EXCLUDE,
  }: {
    siteIdsInclude?: number[]
    siteIdsExclude?: number[]
  } = {},
) => {
  const { values } = parseArgs({
    args: argv,
    options: {
      "dry-run": { type: "boolean", default: false },
    },
  })

  const dryRun = values["dry-run"] === true
  const resolvedSiteIds = await resolveSiteIds({
    include: siteIdsInclude,
    exclude: siteIdsExclude,
  })

  const selectionSummary = formatSiteSelection({
    include: siteIdsInclude,
    exclude: siteIdsExclude,
    resolved: resolvedSiteIds,
  })
  console.log(`\n${selectionSummary}\n`)

  if (resolvedSiteIds.length === 0) {
    console.error("No sites to migrate after applying include/exclude.")
    process.exitCode = 1
    return
  }

  const proceed = await confirm({
    message: dryRun
      ? `Dry-run migration for ${resolvedSiteIds.length} site(s)?`
      : `Migrate tags → tagCategories for ${resolvedSiteIds.length} site(s)?`,
    default: false,
  })
  if (!proceed) {
    console.log("Aborted. No changes written.")
    return
  }

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
    `\n${dryRun ? "[DRY RUN] " : ""}Migrating tags → tagCategories for ${resolvedSiteIds.length} site(s)…`,
  )

  let succeeded = 0
  const failedSiteIds: number[] = []
  for (const siteId of resolvedSiteIds) {
    try {
      const results = await migrateSite({ siteId, dryRun, publisherId })
      console.log(`[site ${siteId}] ${results.length} collection(s) processed`)
      succeeded++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[site ${siteId}] FAILED: ${message}`)
      failedSiteIds.push(siteId)
    }
  }

  console.log(
    `\nDone. ${succeeded} site(s) succeeded, ${failedSiteIds.length} site(s) failed.`,
  )
  if (failedSiteIds.length > 0) {
    console.error(`Failed site IDs: ${failedSiteIds.join(", ")}`)
    process.exitCode = 1
  }
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
