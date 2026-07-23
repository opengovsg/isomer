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
 * Risk accepted: items with an empty legacy category (common for Collection
 * Links, which default to `category: ""`) are left with empty `tagged` even
 * though the new Category group is `isRequired: true`. Studio Save stays
 * disabled for those items until an editor picks a Category tag.
 *
 * Risk accepted: items with a non-empty legacy category and empty `tagged`
 * get `tagged: [categoryOptionId]` after migration. SearchSG / Algolia
 * ingestion (schedulePushDocumentJob) uses `tagged[0]` as subcategory — but
 * only for resources with a PushDocumentJob (gazettes). Audited 2026-07-23:
 * no such search-ingested rows existed (`findUntaggedWithLegacyCategory.sql`
 * with `has_push_document_job = true`). Ordinary collection items are not
 * on that path.
 *
 * Display: the new "Category" group is written with `display: "plaintext"`.
 * Every pre-existing group on the same Index is stamped with an explicit
 * `display: "pills"` — the rendering behaviour they already had by default —
 * since the `display` field postdates those groups and they don't have it set.
 *
 * Site selection (edit the constants below):
 *   - SITE_IDS_INCLUDE empty → all sites; non-empty → only those IDs
 *   - SITE_IDS_EXCLUDE → removed from the resolved set (either way)
 * The resolved list is printed and must be confirmed before any writes.
 *
 * Each site runs in a single transaction (all collections succeed or the
 * whole site rolls back). A local log file records per-collection and
 * per-site outcomes for manual retry via SITE_IDS_INCLUDE.
 *
 * Usage:
 *   cd apps/studio
 *   source .env && pnpm exec tsx prisma/scripts/migrateCategoryToTagCategories.ts [--dry-run]
 */
import type { UnwrapTagged } from "type-fest"
import { confirm, input } from "@inquirer/prompts"
import { randomUUID } from "crypto"
import path from "path"
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

import { FileLogger } from "./FileLogger"

// ---------------------------------------------------------------------------
// Site selection — edit these before running
// ---------------------------------------------------------------------------

/** Empty = all sites. Non-empty = only these site IDs. */
const SITE_IDS_INCLUDE: number[] = []

/** Removed from the resolved set (after include / all-sites expansion). */
const SITE_IDS_EXCLUDE: number[] = []

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
  title?: string
  status: MigrationPlan["status"] | "no-index" | "already-migrated"
  categories: string[]
  itemsUpdated: number
  versionsCreated: number
}

export type SiteMigrationResult = {
  siteId: number
  status: "succeeded" | "failed" | "dry-run"
  error?: string
  collections: CollectionMigrationResult[]
}

type CollectionWriteContext = {
  indexRow: NonNullable<Awaited<ReturnType<typeof getIndexPageRow>>>
  itemRows: Awaited<ReturnType<typeof getItemRows>>
  group: TagCategoryGroup
  itemUpdates: ItemTagUpdate[]
  publisherId: string | null
}

const applyCollectionWrites = async (
  tx: Transaction<DB>,
  {
    indexRow,
    itemRows,
    group,
    itemUpdates,
    publisherId,
  }: CollectionWriteContext,
) => {
  const requirePublisherId = (): string => {
    if (!publisherId) {
      throw new Error(
        "publisherId is required to migrate a collection with published content outside --dry-run",
      )
    }
    return publisherId
  }

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
  for (const update of itemUpdates) {
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
}

export const migrateCollection = async ({
  collectionId,
  siteId,
  dryRun,
  publisherId,
  tx,
}: {
  collectionId: string
  siteId: number
  dryRun: boolean
  publisherId: string | null
  /** When set, writes use this transaction (site-level). Otherwise opens its own. */
  tx?: Transaction<DB>
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

  const writeContext: CollectionWriteContext = {
    indexRow,
    itemRows,
    group: plan.group,
    itemUpdates: plan.itemUpdates,
    publisherId,
  }

  if (tx) {
    await applyCollectionWrites(tx, writeContext)
  } else {
    await db
      .transaction()
      .execute(async (innerTx) => applyCollectionWrites(innerTx, writeContext))
  }

  return {
    collectionId,
    status: "migrated",
    categories,
    itemsUpdated,
    versionsCreated,
  }
}

type MigrationLogger = Pick<FileLogger, "info" | "error">

const logLine = (
  logger: MigrationLogger | undefined,
  line: string,
  level: "info" | "error" = "info",
) => {
  console.log(line)
  if (level === "error") {
    logger?.error(line)
  } else {
    logger?.info(line)
  }
}

export const migrateSite = async ({
  siteId,
  dryRun,
  publisherId,
  logger,
}: {
  siteId: number
  dryRun: boolean
  publisherId: string | null
  logger?: MigrationLogger
}): Promise<SiteMigrationResult> => {
  const collections = await db
    .selectFrom("Resource")
    .where("type", "=", ResourceType.Collection)
    .where("siteId", "=", siteId)
    .select(["id", "title"])
    .execute()

  logLine(
    logger,
    `[site ${siteId}] starting (${collections.length} collection(s)${dryRun ? ", dry-run" : ""})`,
  )

  const results: CollectionMigrationResult[] = []

  if (dryRun) {
    for (const collection of collections) {
      const result = await migrateCollection({
        collectionId: collection.id,
        siteId,
        dryRun: true,
        publisherId,
      })
      results.push({ ...result, title: collection.title })
      logLine(logger, formatResult(result, collection.title, true))
    }
    logLine(logger, `[site ${siteId}] dry-run complete`)
    return { siteId, status: "dry-run", collections: results }
  }

  try {
    await db.transaction().execute(async (tx) => {
      for (const collection of collections) {
        const result = await migrateCollection({
          collectionId: collection.id,
          siteId,
          dryRun: false,
          publisherId,
          tx,
        })
        results.push({ ...result, title: collection.title })
        logLine(logger, formatResult(result, collection.title, false))
      }
    })
    logLine(logger, `[site ${siteId}] SUCCEEDED`)
    return { siteId, status: "succeeded", collections: results }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logLine(
      logger,
      `[site ${siteId}] FAILED (entire site rolled back): ${message}`,
      "error",
    )
    for (const result of results) {
      logLine(
        logger,
        `[site ${siteId}] rolled back prior collection work: ${formatResult(result, result.title ?? result.collectionId, false)}`,
        "error",
      )
    }
    return {
      siteId,
      status: "failed",
      error: message,
      collections: results,
    }
  }
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
    logger,
  }: {
    siteIdsInclude?: number[]
    siteIdsExclude?: number[]
    logger?: MigrationLogger
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
      : `Migrate category → tagCategories for ${resolvedSiteIds.length} site(s)?`,
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

  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const logPath = path.join(
    scriptDir,
    `migrateCategoryToTagCategories-${new Date().toISOString().replace(/[:.]/g, "-")}.log`,
  )
  const fileLogger = logger ?? new FileLogger(logPath)
  if (!logger) {
    console.log(`Logging to ${logPath}`)
  }
  fileLogger.info(selectionSummary)
  fileLogger.info(
    `${dryRun ? "[DRY RUN] " : ""}Starting migration for ${resolvedSiteIds.length} site(s)`,
  )

  const siteResults: SiteMigrationResult[] = []
  for (const siteId of resolvedSiteIds) {
    const result = await migrateSite({
      siteId,
      dryRun,
      publisherId,
      logger: fileLogger,
    })
    siteResults.push(result)
  }

  const succeeded = siteResults.filter((r) => r.status === "succeeded").length
  const failed = siteResults.filter((r) => r.status === "failed")
  const dryRunCount = siteResults.filter((r) => r.status === "dry-run").length

  const summary = dryRun
    ? `Done. Dry-run complete for ${dryRunCount} site(s).`
    : `Done. ${succeeded} site(s) succeeded, ${failed.length} site(s) failed.`
  logLine(fileLogger, `\n${summary}`)

  if (failed.length > 0) {
    const failedIds = failed.map((r) => r.siteId)
    logLine(
      fileLogger,
      `Failed site IDs (retry via SITE_IDS_INCLUDE): ${failedIds.join(", ")}`,
      "error",
    )
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
