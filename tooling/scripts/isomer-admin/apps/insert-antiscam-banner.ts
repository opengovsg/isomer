import { checkbox, confirm, input, select } from "@inquirer/prompts"

import { withDbClient } from "../utils/db"

/**
 * Site IDs to run this script for. Edit this list before running —
 * only RootPages belonging to these sites will be considered.
 */
export const SITE_IDS: number[] = []

export const ANTISCAM_BANNER_BLOCK = { type: "antiscambanner" }

export type BlobContent = { content?: unknown[] } & Record<string, unknown>

export interface RootPageRow {
  id: string
  title: string
  siteId: number
  siteName: string
  draftBlobId: string | null
  publishedVersionId: string | null
  draftContent: BlobContent | null
  publishedContent: BlobContent | null
}

/** How a RootPage is currently stored: published, draft, both, or neither. */
export type Bucket =
  | "published-only"
  | "published-and-draft"
  | "draft-only"
  | "none"

export const getBucket = (row: RootPageRow): Bucket => {
  const hasPublished = row.publishedVersionId !== null
  const hasDraft = row.draftBlobId !== null
  if (hasPublished && hasDraft) return "published-and-draft"
  if (hasPublished) return "published-only"
  if (hasDraft) return "draft-only"
  return "none"
}

/** Plain object blob payload — rejects null, arrays, and double-encoded JSON strings. */
export const isUsableBlobContent = (content: unknown): content is BlobContent =>
  content !== null && typeof content === "object" && !Array.isArray(content)

export const hasAntiscamBanner = (content: BlobContent | null): boolean => {
  if (!isUsableBlobContent(content) || !Array.isArray(content.content)) {
    return false
  }
  return content.content.some(
    (block) => (block as { type?: string })?.type === "antiscambanner",
  )
}

export const appendAntiscamBanner = (content: BlobContent): BlobContent => {
  const existingBlocks = Array.isArray(content.content) ? content.content : []
  return { ...content, content: [...existingBlocks, ANTISCAM_BANNER_BLOCK] }
}

export type PublishedStep =
  | { action: "create-version"; newContent: BlobContent }
  | { action: "skip-already-has-banner" }
  | { action: "skip-missing-content" }
  | { action: "none" }

export type DraftStep =
  | { action: "update-draft"; newContent: BlobContent }
  | { action: "skip-already-has-banner" }
  | { action: "skip-missing-content" }
  | { action: "none" }

export interface ResourcePlan {
  bucket: Bucket
  publishedStep: PublishedStep
  draftStep: DraftStep
}

export const normalizePublisherEmail = (email: string): string | null => {
  const normalized = email.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

export const describePublishedStep = (step: PublishedStep): string => {
  switch (step.action) {
    case "create-version":
      return "published: create new version"
    case "skip-already-has-banner":
      return "published: already has banner, skip"
    case "skip-missing-content":
      return "published: missing/invalid content, skip"
    case "none":
      return "published: none"
  }
}

export const describeDraftStep = (step: DraftStep): string => {
  switch (step.action) {
    case "update-draft":
      return "draft: update in place"
    case "skip-already-has-banner":
      return "draft: already has banner, skip"
    case "skip-missing-content":
      return "draft: missing/invalid content, skip"
    case "none":
      return "draft: none"
  }
}

/** Decides published/draft actions for one RootPage. No I/O. */
export const planResource = (row: RootPageRow): ResourcePlan => {
  const bucket = getBucket(row)

  const publishedStep: PublishedStep =
    bucket === "published-only" || bucket === "published-and-draft"
      ? !isUsableBlobContent(row.publishedContent)
        ? { action: "skip-missing-content" }
        : hasAntiscamBanner(row.publishedContent)
          ? { action: "skip-already-has-banner" }
          : {
              action: "create-version",
              newContent: appendAntiscamBanner(row.publishedContent),
            }
      : { action: "none" }

  const draftStep: DraftStep =
    bucket === "published-and-draft" || bucket === "draft-only"
      ? !isUsableBlobContent(row.draftContent)
        ? { action: "skip-missing-content" }
        : hasAntiscamBanner(row.draftContent)
          ? { action: "skip-already-has-banner" }
          : {
              action: "update-draft",
              newContent: appendAntiscamBanner(row.draftContent),
            }
      : { action: "none" }

  return { bucket, publishedStep, draftStep }
}

/** Interactive admin script: append antiscambanner to selected RootPages. */
export const insertAntiscamBanner = async () => {
  const rawEmail = await input({
    message: "Enter your email address (e.g. adriangoh@open.gov.sg)",
  })
  const publisherEmail = normalizePublisherEmail(rawEmail)
  if (!publisherEmail) {
    console.error("Email address is required.")
    return
  }

  if (SITE_IDS.length === 0) {
    console.error(
      "SITE_IDS is empty. Edit SITE_IDS at the top of insert-antiscam-banner.ts with the site ID(s) to run this script for.",
    )
    return
  }

  await withDbClient(async (client) => {
    // Resolve publisher for Version.publishedBy
    const userResult = await client.query<{ id: string }>(
      `SELECT id FROM "User" WHERE email = $1 AND "deletedAt" IS NULL`,
      [publisherEmail],
    )
    const user = userResult.rows[0]
    if (!user) {
      console.error(`User with email ${publisherEmail} not found`)
      return
    }
    const publisherUserId = user.id

    // Load RootPages with draft/published blob content, scoped to SITE_IDS
    const rootPages = await client.query<RootPageRow>(
      `SELECT "Resource".id, "Resource".title, "Resource"."siteId", "Site".name AS "siteName",
              "Resource"."draftBlobId", "Resource"."publishedVersionId",
              "DraftBlob".content AS "draftContent",
              "PublishedBlob".content AS "publishedContent"
       FROM "Resource"
       JOIN "Site" ON "Resource"."siteId" = "Site".id
       LEFT JOIN "Blob" AS "DraftBlob" ON "Resource"."draftBlobId" = "DraftBlob".id
       LEFT JOIN "Version" ON "Resource"."publishedVersionId" = "Version".id
       LEFT JOIN "Blob" AS "PublishedBlob" ON "Version"."blobId" = "PublishedBlob".id
       WHERE "Resource".type = 'RootPage' AND "Site".id = ANY($1::int[])
       ORDER BY "Site".name, "Resource".title`,
      [SITE_IDS],
    )

    const rowsWithBucket = rootPages.rows.map((row) => ({
      row,
      bucket: getBucket(row),
    }))

    const eligibleRows = rowsWithBucket.filter(
      ({ bucket }) => bucket !== "none",
    )
    const ineligibleRows = rowsWithBucket.filter(
      ({ bucket }) => bucket === "none",
    )

    if (eligibleRows.length === 0) {
      console.log(
        `No RootPage resources with a draft or published blob were found for site(s) ${SITE_IDS.join(", ")}.`,
      )
      return
    }

    console.log(
      `Found ${eligibleRows.length} RootPage resource(s) across ${new Set(eligibleRows.map(({ row }) => row.siteId)).size} of the selected site(s) (${SITE_IDS.join(", ")}):`,
    )
    for (const { row, bucket } of eligibleRows) {
      console.log(`  [${row.id}] ${row.siteName} — ${row.title} (${bucket})`)
    }
    if (ineligibleRows.length > 0) {
      console.log(
        `\nSkipping ${ineligibleRows.length} RootPage resource(s) with neither a draft nor a published blob.`,
      )
    }

    // Scope: all / by resource (sites are already fixed via the SITE_IDS constant)
    const scope = await select({
      message: "Apply to which resources?",
      choices: [
        { name: `All ${eligibleRows.length} resources`, value: "all" as const },
        { name: "Select resources individually", value: "resources" as const },
      ],
    })

    let selectedRows = eligibleRows
    if (scope === "resources") {
      const resourceChoices = eligibleRows.map(({ row, bucket }) => ({
        name: `[${row.id}] ${row.siteName} — ${row.title} (${bucket})`,
        value: row.id,
      }))
      const selectedIds = await checkbox({
        message: "Select resources",
        choices: resourceChoices,
      })
      selectedRows = eligibleRows.filter(({ row }) =>
        selectedIds.includes(row.id),
      )
    }

    if (selectedRows.length === 0) {
      console.log("No resources selected. Aborting.")
      return
    }

    // Preview plan before applying
    const selectedPlans = selectedRows.map(({ row }) => ({
      row,
      plan: planResource(row),
    }))

    let publishedCreates = 0
    let draftUpdates = 0
    let skips = 0
    console.log(`\nPlan for ${selectedPlans.length} resource(s):`)
    for (const { row, plan } of selectedPlans) {
      const parts = [
        describePublishedStep(plan.publishedStep),
        describeDraftStep(plan.draftStep),
      ].filter((part) => !part.endsWith(": none"))
      console.log(
        `  [${row.id}] ${row.siteName} — ${row.title}: ${parts.join("; ")}`,
      )
      if (plan.publishedStep.action === "create-version") publishedCreates++
      if (plan.draftStep.action === "update-draft") draftUpdates++
      if (
        plan.publishedStep.action === "skip-already-has-banner" ||
        plan.publishedStep.action === "skip-missing-content"
      ) {
        skips++
      }
      if (
        plan.draftStep.action === "skip-already-has-banner" ||
        plan.draftStep.action === "skip-missing-content"
      ) {
        skips++
      }
    }
    console.log(
      `\nTotals: ${publishedCreates} published create(s), ${draftUpdates} draft update(s), ${skips} skip(s).`,
    )

    const confirmed = await confirm({
      message: `Apply this plan to ${selectedPlans.length} resource(s)?`,
      default: false,
    })
    if (!confirmed) {
      console.log("Aborted.")
      return
    }

    const results: { id: string; title: string; status: string }[] = []

    // Apply in one transaction
    await client.query("BEGIN")
    try {
      for (const { row, plan } of selectedPlans) {
        if (plan.publishedStep.action === "skip-already-has-banner") {
          results.push({
            id: row.id,
            title: row.title,
            status: "published: already has banner, skipped",
          })
        } else if (plan.publishedStep.action === "skip-missing-content") {
          results.push({
            id: row.id,
            title: row.title,
            status: "published: missing/invalid content, skipped",
          })
        } else if (plan.publishedStep.action === "create-version") {
          // New blob + Version, then point Resource at it
          const currentVersion = await client.query<{ versionNum: number }>(
            `SELECT "versionNum" FROM "Version" WHERE id = $1`,
            [row.publishedVersionId],
          )
          const latestVersionNumber = currentVersion.rows[0]?.versionNum ?? 0

          const newBlob = await client.query<{ id: string }>(
            `INSERT INTO "Blob" (content) VALUES ($1) RETURNING id`,
            [JSON.stringify(plan.publishedStep.newContent)],
          )
          const newBlobRow = newBlob.rows[0]
          if (!newBlobRow) {
            throw new Error(`Failed to create blob for resource ${row.id}`)
          }

          const newVersion = await client.query<{ id: string }>(
            `INSERT INTO "Version" ("blobId", "versionNum", "resourceId", "publishedBy")
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [newBlobRow.id, latestVersionNumber + 1, row.id, publisherUserId],
          )
          const newVersionRow = newVersion.rows[0]
          if (!newVersionRow) {
            throw new Error(`Failed to create version for resource ${row.id}`)
          }

          await client.query(
            `UPDATE "Resource" SET "publishedVersionId" = $1, "updatedAt" = NOW() WHERE id = $2`,
            [newVersionRow.id, row.id],
          )

          results.push({
            id: row.id,
            title: row.title,
            status: "published: new version created",
          })
        }

        if (plan.draftStep.action === "skip-already-has-banner") {
          results.push({
            id: row.id,
            title: row.title,
            status: "draft: already has banner, skipped",
          })
        } else if (plan.draftStep.action === "skip-missing-content") {
          results.push({
            id: row.id,
            title: row.title,
            status: "draft: missing/invalid content, skipped",
          })
        } else if (plan.draftStep.action === "update-draft") {
          // Draft is mutated in place (no new Version)
          await client.query(
            `UPDATE "Blob" SET content = $1, "updatedAt" = NOW() WHERE id = $2`,
            [JSON.stringify(plan.draftStep.newContent), row.draftBlobId],
          )
          results.push({
            id: row.id,
            title: row.title,
            status: "draft: updated in place",
          })
        }
      }

      await client.query("COMMIT")

      console.log("\nDone. Summary:")
      for (const r of results) {
        console.log(`  [${r.id}] ${r.title}: ${r.status}`)
      }
      console.log(
        "\nIMPORTANT: The static site has NOT been rebuilt. You must manually trigger a CodeBuild rebuild (see the 'Rebuild all CodeBuild projects' script) for published changes to go live.",
      )
    } catch (err) {
      await client.query("ROLLBACK")
      console.error("Transaction rolled back. No resources were changed.", err)
    }
  })
}
