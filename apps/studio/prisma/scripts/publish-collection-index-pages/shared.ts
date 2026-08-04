import { mkdirSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import {
  db,
  jsonb,
  ResourceState,
  type DB,
  type Transaction,
} from "~/server/modules/database"

import type { PublishedIndexBlob, SkipReason } from "./helpers"
import { chunk, classifyRow } from "./helpers"
import { findNeverPublishedCollectionIndexPages } from "./query"

export type Mode = "dry-run" | "apply"

/** Rows per write transaction. See the comment on `chunk`. */
const BATCH_SIZE = 100

// ---------------------------------------------------------------------------
// DB verification
// ---------------------------------------------------------------------------

export const verifySite = async (siteId: number) => {
  const site = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select(["id", "name"])
    .executeTakeFirst()
  if (!site) throw new Error(`Site ${siteId} not found`)
  return site
}

export const verifyUser = async (userId: string) => {
  const user = await db
    .selectFrom("User")
    .where("id", "=", userId)
    .select(["id", "email", "deletedAt"])
    .executeTakeFirst()
  if (!user) throw new Error(`User ${userId} not found`)
  if (user.deletedAt) throw new Error(`User ${userId} is deleted`)
  return user
}

// ---------------------------------------------------------------------------
// The write
// ---------------------------------------------------------------------------

export interface PublishedRow {
  resourceId: string
  siteId: number
  newBlobId: string
  newVersionId: string
  previousState: ResourceState | null
}

/**
 * Publishes `content` as a NEW blob + Version, leaving the existing draft blob
 * completely alone.
 *
 * Deliberately NOT `incrementVersion` from convert-folder-to-collection: that
 * points the new Version at the *draft* blob and nulls `draftBlobId`, consuming
 * the draft. Here the draft must survive.
 *
 * `state` becomes Published even though `draftBlobId` stays set — the ordinary
 * "published, with unpublished changes" shape. Studio's "is this live on the end
 * site?" queries gate on `state = Published`, while the dashboard's Draft badge is
 * driven by `draftBlobId`, so both keep telling the truth.
 */
export const publishNewBlobVersion = async (
  tx: Transaction<DB>,
  {
    resourceId,
    siteId,
    content,
    publisherId,
  }: {
    resourceId: string
    siteId: number
    content: PublishedIndexBlob
    publisherId: string
  },
): Promise<Omit<PublishedRow, "resourceId" | "siteId"> | { skipped: true }> => {
  // Re-assert the target predicate inside the transaction: refuse if the row got
  // published between planning and writing.
  const fresh = await tx
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .where("siteId", "=", siteId)
    .select(["publishedVersionId", "state"])
    .executeTakeFirst()

  if (!fresh)
    throw new Error(`Resource ${resourceId} not found on site ${siteId}`)
  if (fresh.publishedVersionId !== null) return { skipped: true }

  const blob = await tx
    .insertInto("Blob")
    .values({ content: jsonb(content) })
    .returning("id")
    .executeTakeFirstOrThrow()

  const version = await tx
    .insertInto("Version")
    .values({
      versionNum: 1,
      resourceId,
      blobId: blob.id,
      publishedAt: new Date(),
      publishedBy: publisherId,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  await tx
    .updateTable("Resource")
    .set({
      publishedVersionId: version.id,
      state: ResourceState.Published,
      // draftBlobId deliberately UNTOUCHED — the draft survives.
    })
    .where("id", "=", resourceId)
    .where("siteId", "=", siteId)
    .execute()

  return {
    newBlobId: blob.id,
    newVersionId: version.id,
    previousState: fresh.state,
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export interface SkippedRow {
  resourceId: string
  siteId: number
  siteName: string
  parentPermalink: string
  reason: SkipReason
}

export interface BackfillReport {
  generatedAt: string
  mode: Mode
  scope: string
  totals: {
    eligible: number
    toPublish: number
    skipped: number
    published: number
    alreadyPublished: number
  }
  /**
   * Blog-variant collections that will render 1-column after the next rebuild.
   * Review this before applying — it is the one accepted live regression.
   */
  variantFlipCount: number
  skippedRows: SkippedRow[]
  /** Rollback data: undo by reversing these. See README. */
  publishedRows: PublishedRow[]
}

const defaultOutDir = () =>
  join(dirname(fileURLToPath(import.meta.url)), ".out")

export const scopeLabel = (siteId?: number) =>
  siteId === undefined ? "all-sites" : `site-${siteId}`

export const reportPath = ({
  at,
  siteId,
  outDir = defaultOutDir(),
}: {
  at: Date
  siteId?: number
  outDir?: string
}) =>
  join(
    outDir,
    `${at.toISOString().replace(/[:.]/g, "-")}-${scopeLabel(siteId)}.report.json`,
  )

export const printSummary = (report: BackfillReport) => {
  const { totals } = report
  console.log(`\n=== Collection index page publish (${report.mode}) ===`)
  console.log(`Scope          : ${report.scope}`)
  console.log(`Eligible rows  : ${totals.eligible}`)
  console.log(`  to publish   : ${totals.toPublish}`)
  console.log(`  skipped      : ${totals.skipped}`)
  if (report.mode === "apply") {
    console.log(`  published    : ${totals.published}`)
    console.log(`  already published (raced) : ${totals.alreadyPublished}`)
  }
  console.log(
    `\nREVIEW: ${report.variantFlipCount} blog-variant collection(s) will render` +
      ` 1-column after the next rebuild.`,
  )
  for (const row of report.skippedRows) {
    console.log(
      `  skipped ${row.resourceId} (/${row.parentPermalink}): ${row.reason}`,
    )
  }
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export const runBackfill = async ({
  mode,
  siteId,
  publisherId,
  outDir = defaultOutDir(),
  at = new Date(),
}: {
  mode: Mode
  siteId?: number
  /** Required for `apply` — recorded as Version.publishedBy. */
  publisherId?: string
  outDir?: string
  /** Injected so callers (and tests) control the run timestamp. */
  at?: Date
}): Promise<{ report: BackfillReport; path: string }> => {
  if (mode === "apply" && !publisherId) {
    throw new Error("apply mode requires a publisherId")
  }

  const rows = await findNeverPublishedCollectionIndexPages({ siteId })

  const skippedRows: SkippedRow[] = []
  const toPublish: { row: (typeof rows)[number]; next: PublishedIndexBlob }[] =
    []
  let variantFlipCount = 0

  for (const row of rows) {
    const outcome = classifyRow(row)
    if (outcome.kind === "skip") {
      skippedRows.push({
        resourceId: row.resourceId,
        siteId: row.siteId,
        siteName: row.siteName,
        parentPermalink: row.parentPermalink,
        reason: outcome.reason,
      })
      continue
    }
    if (outcome.variantFlip) variantFlipCount += 1
    toPublish.push({ row, next: outcome.next })
  }

  const publishedRows: PublishedRow[] = []
  let alreadyPublished = 0

  // `publisherId &&` narrows it to string. The guard at the top already threw for
  // apply-without-publisherId, so this can never silently skip the write.
  if (mode === "apply" && publisherId) {
    const batches = chunk(toPublish, BATCH_SIZE)
    for (const [index, batch] of batches.entries()) {
      await db.transaction().execute(async (tx) => {
        for (const { row, next } of batch) {
          const result = await publishNewBlobVersion(tx, {
            resourceId: row.resourceId,
            siteId: row.siteId,
            content: next,
            publisherId,
          })
          if ("skipped" in result) {
            alreadyPublished += 1
            continue
          }
          publishedRows.push({
            resourceId: row.resourceId,
            siteId: row.siteId,
            ...result,
          })
        }
      })
      console.log(
        `[batch ${index + 1}/${batches.length}] published ${publishedRows.length}/${toPublish.length}`,
      )
    }
  }

  const report: BackfillReport = {
    generatedAt: at.toISOString(),
    mode,
    scope: scopeLabel(siteId),
    totals: {
      eligible: rows.length,
      toPublish: toPublish.length,
      skipped: skippedRows.length,
      published: publishedRows.length,
      alreadyPublished,
    },
    variantFlipCount,
    skippedRows,
    publishedRows,
  }

  const path = reportPath({ at, siteId, outDir })
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`)

  return { report, path }
}

/** Blank is valid and means "all sites". */
export const validateOptionalNumericId = (label: string) => (value: string) =>
  value.trim().length === 0 ||
  /^\d+$/.test(value.trim()) ||
  `${label} must be a numeric string, or blank for all sites`
