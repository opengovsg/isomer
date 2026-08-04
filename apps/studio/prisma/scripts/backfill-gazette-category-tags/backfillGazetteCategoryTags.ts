/**
 * Backfill the Category option uuid into `page.tagged` for pre-cutover gazettes.
 *
 * Rows written before the tagCategories cutover look like
 * `tagged: [subcategoryUuid]`. Since commit 4140a3b58, `page.tagged` is the only
 * source of truth for a gazette's category, so those rows render as "Unknown",
 * cannot be edited without re-picking the category, are invisible to duplicate
 * detection, and are skipped by ingestion without retry. This rewrites them to
 * `[categoryId, subcategoryId]`.
 *
 * The category is recovered from the subcategory uuid the row already has — see
 * ./deriveCategoryId.ts. `page.category` is deliberately left untouched.
 *
 * Idempotent: rows that already carry a Category option uuid are skipped, so
 * re-running is a no-op.
 *
 * This module is side-effect free so it can be exercised by
 * ./backfillGazetteCategoryTags.test.ts. Run it via ./runBackfill.ts, which
 * prompts for the arguments.
 */

import type { UnwrapTagged } from "type-fest"
import { GAZETTE_CATEGORY_LABEL } from "~/features/gazettes/constants"
import { db, jsonb, ResourceType } from "~/server/modules/database"

import type { GazetteTaxonomy, TagCategory } from "./deriveCategoryId"
import { buildGazetteTaxonomy, deriveCategoryId } from "./deriveCategoryId"

interface GazetteBlobContent {
  page?: {
    ref?: string
    tagged?: unknown
    [key: string]: unknown
  }
  [key: string]: unknown
}

type BlobSide = "draft" | "published"

interface PendingUpdate {
  resourceId: string
  title: string
  side: BlobSide
  blobId: string
  content: GazetteBlobContent
  before: string[]
  after: string[]
}

interface UnresolvableRow {
  resourceId: string
  title: string
  side: BlobSide
  ref: string
  tagged: string[]
  reason: string
}

const readTagged = (content: GazetteBlobContent | null): string[] => {
  const tagged = content?.page?.tagged
  if (!Array.isArray(tagged)) return []
  return tagged.filter((value): value is string => typeof value === "string")
}

/**
 * Reads the collection's Category / Sub-category options off its IndexPage.
 * The IndexPage is assumed to have no draft, only a published version.
 */
const loadTaxonomy = async ({
  siteId,
  collectionId,
}: {
  siteId: number
  collectionId: number
}): Promise<GazetteTaxonomy> => {
  const indexPage = await db
    .selectFrom("Resource")
    .innerJoin("Version", "Version.id", "Resource.publishedVersionId")
    .innerJoin("Blob", "Blob.id", "Version.blobId")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.parentId", "=", String(collectionId))
    .where("Resource.type", "=", ResourceType.IndexPage)
    .select("Blob.content")
    .executeTakeFirst()

  if (!indexPage) {
    throw new Error(
      `No published IndexPage found under collection ${collectionId} on site ${siteId}`,
    )
  }

  const tagCategories =
    (
      indexPage.content as unknown as {
        page?: { tagCategories?: TagCategory[] }
      } | null
    )?.page?.tagCategories ?? []

  const taxonomy = buildGazetteTaxonomy(tagCategories)

  // Without this the run would "succeed" having changed nothing. Note the app
  // matches the group label exactly, so a case variant lands here too — and in
  // that case writing uuids would not help, because the app could not resolve
  // them either.
  if (taxonomy.categoryIds.size === 0) {
    throw new Error(
      `Collection ${collectionId} has no "${GAZETTE_CATEGORY_LABEL}" tagCategory options. ` +
        `Found groups: ${tagCategories.map(({ label }) => `"${label}"`).join(", ") || "none"}`,
    )
  }

  return taxonomy
}

/**
 * Returns the number of rows left unresolved, so the caller can exit non-zero
 * when the backfill was only partial.
 */
export const backfillGazetteCategoryTags = async ({
  siteId,
  collectionId,
  dryRun,
}: {
  siteId: number
  collectionId: number
  dryRun: boolean
}): Promise<number> => {
  const taxonomy = await loadTaxonomy({ siteId, collectionId })
  console.log(
    `Taxonomy: ${taxonomy.categoryIds.size} Category options, ${taxonomy.subcategoryLabelById.size} Sub-category options`,
  )

  const resources = await db
    .selectFrom("Resource")
    .leftJoin("Blob as DraftBlob", "DraftBlob.id", "Resource.draftBlobId")
    .leftJoin("Version", "Version.id", "Resource.publishedVersionId")
    .leftJoin("Blob as PublishedBlob", "PublishedBlob.id", "Version.blobId")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.parentId", "=", String(collectionId))
    .where("Resource.type", "=", ResourceType.CollectionLink)
    .select([
      "Resource.id as resourceId",
      "Resource.title",
      "DraftBlob.id as draftBlobId",
      "DraftBlob.content as draftContent",
      "PublishedBlob.id as publishedBlobId",
      "PublishedBlob.content as publishedContent",
    ])
    .execute()

  const pending: PendingUpdate[] = []
  const unresolvable: UnresolvableRow[] = []
  let alreadyTagged = 0

  for (const row of resources) {
    const sides: { side: BlobSide; blobId: string | null; content: unknown }[] =
      [
        { side: "draft", blobId: row.draftBlobId, content: row.draftContent },
        {
          side: "published",
          blobId: row.publishedBlobId,
          content: row.publishedContent,
        },
      ]

    for (const { side, blobId, content } of sides) {
      if (!blobId) continue

      const blobContent = content as GazetteBlobContent | null
      const tagged = readTagged(blobContent)
      const result = deriveCategoryId({ tagged, taxonomy })

      if (result.status === "already-tagged") {
        alreadyTagged++
        continue
      }

      if (result.status === "unresolvable") {
        unresolvable.push({
          resourceId: row.resourceId,
          title: row.title,
          side,
          ref: blobContent?.page?.ref ?? "",
          tagged,
          reason: result.reason,
        })
        continue
      }

      pending.push({
        resourceId: row.resourceId,
        title: row.title,
        side,
        blobId,
        content: blobContent ?? {},
        before: tagged,
        after: [result.categoryId, result.subcategoryId],
      })
    }
  }

  console.log(
    `\nScanned ${resources.length} gazettes: ${pending.length} blob side(s) to fix, ` +
      `${alreadyTagged} already tagged, ${unresolvable.length} unresolvable`,
  )

  for (const update of pending) {
    console.log(
      `  fix  ${update.resourceId} [${update.side}] "${update.title}" ` +
        `${JSON.stringify(update.before)} -> ${JSON.stringify(update.after)}`,
    )
  }

  if (unresolvable.length > 0) {
    console.log(`\n${unresolvable.length} row(s) need manual triage:`)
    for (const row of unresolvable) {
      console.log(
        `  skip ${row.resourceId} [${row.side}] "${row.title}" ` +
          `tagged=${JSON.stringify(row.tagged)} ref=${row.ref} — ${row.reason}`,
      )
    }
  }

  if (dryRun) {
    console.log("\nDry run — nothing written. Re-run and answer 'no' to apply.")
    return unresolvable.length
  }

  if (pending.length === 0) {
    console.log("\nNothing to write.")
    return unresolvable.length
  }

  // One transaction for the whole run: all-or-nothing beats a half-applied
  // maintenance window. Only `page.tagged` is replaced — the rest of the page is
  // spread through untouched so keys this script does not know about survive,
  // including the legacy `page.category`.
  //
  // Updating the published side's Blob in place is safe because Version.blobId
  // is @unique: one Blob per Version, so this cannot disturb version history.
  await db.transaction().execute(async (tx) => {
    for (const update of pending) {
      await tx
        .updateTable("Blob")
        .set({
          content: jsonb({
            ...update.content,
            page: { ...update.content.page, tagged: update.after },
          } as UnwrapTagged<PrismaJson.BlobJsonContent>),
        })
        .where("id", "=", update.blobId)
        .execute()
    }
  })

  console.log(`\nWrote ${pending.length} blob side(s).`)
  return unresolvable.length
}
