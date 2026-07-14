import { checkbox, confirm, input, select } from "@inquirer/prompts"

import { withDbClient } from "../utils/db"

const ANTISCAM_BANNER_BLOCK = { type: "antiscambanner" }

interface RootPageRow {
  id: string
  title: string
  siteId: number
  siteName: string
  draftBlobId: string | null
  publishedVersionId: string | null
  draftContent: ({ content?: unknown[] } & Record<string, unknown>) | null
  publishedContent: ({ content?: unknown[] } & Record<string, unknown>) | null
}

type Bucket = "published-only" | "published-and-draft" | "draft-only" | "none"

const getBucket = (row: RootPageRow): Bucket => {
  const hasPublished = row.publishedVersionId !== null
  const hasDraft = row.draftBlobId !== null
  if (hasPublished && hasDraft) return "published-and-draft"
  if (hasPublished) return "published-only"
  if (hasDraft) return "draft-only"
  return "none"
}

const hasAntiscamBanner = (
  content: ({ content?: unknown[] } & Record<string, unknown>) | null,
): boolean => {
  if (!content || !Array.isArray(content.content)) return false
  return content.content.some(
    (block) => (block as { type?: string })?.type === "antiscambanner",
  )
}

const appendAntiscamBanner = (
  content: { content?: unknown[] } & Record<string, unknown>,
) => {
  const existingBlocks = Array.isArray(content.content) ? content.content : []
  return { ...content, content: [...existingBlocks, ANTISCAM_BANNER_BLOCK] }
}

export const insertAntiscamBanner = async () => {
  const publisherEmail = await input({
    message: "Enter your email address (e.g. adriangoh@open.gov.sg)",
  })

  await withDbClient(async (client) => {
    const userResult = await client.query<{ id: string }>(
      `SELECT id FROM "User" WHERE email = $1 AND "deletedAt" IS NULL`,
      [publisherEmail.toLowerCase()],
    )
    const user = userResult.rows[0]
    if (!user) {
      console.error(`User with email ${publisherEmail} not found`)
      return
    }
    const publisherUserId = user.id

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
       WHERE "Resource".type = 'RootPage'
       ORDER BY "Site".name, "Resource".title`,
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
        "No RootPage resources with a draft or published blob were found.",
      )
      return
    }

    console.log(
      `Found ${eligibleRows.length} RootPage resource(s) across ${new Set(eligibleRows.map(({ row }) => row.siteId)).size} site(s):`,
    )
    for (const { row, bucket } of eligibleRows) {
      console.log(`  [${row.id}] ${row.siteName} — ${row.title} (${bucket})`)
    }
    if (ineligibleRows.length > 0) {
      console.log(
        `\nSkipping ${ineligibleRows.length} RootPage resource(s) with neither a draft nor a published blob.`,
      )
    }

    const scope = await select({
      message: "Apply to which resources?",
      choices: [
        { name: `All ${eligibleRows.length} resources`, value: "all" as const },
        { name: "Select sites individually", value: "sites" as const },
        { name: "Select resources individually", value: "resources" as const },
      ],
    })

    let selectedRows = eligibleRows
    if (scope === "sites") {
      const siteChoices = [
        ...new Map(eligibleRows.map(({ row }) => [row.siteId, row.siteName])),
      ].map(([siteId, siteName]) => ({ name: siteName, value: siteId }))
      const selectedSiteIds = await checkbox({
        message: "Select sites",
        choices: siteChoices,
      })
      selectedRows = eligibleRows.filter(({ row }) =>
        selectedSiteIds.includes(row.siteId),
      )
    } else if (scope === "resources") {
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

    console.log(`\nWill process ${selectedRows.length} resource(s):`)
    for (const { row, bucket } of selectedRows) {
      console.log(`  [${row.id}] ${row.siteName} — ${row.title} (${bucket})`)
    }

    const confirmed = await confirm({
      message: `Insert the anti-scam banner into ${selectedRows.length} resource(s)?`,
      default: false,
    })
    if (!confirmed) {
      console.log("Aborted.")
      return
    }

    const results: { id: string; title: string; status: string }[] = []

    await client.query("BEGIN")
    try {
      for (const { row, bucket } of selectedRows) {
        if (bucket === "published-only" || bucket === "published-and-draft") {
          if (hasAntiscamBanner(row.publishedContent)) {
            results.push({
              id: row.id,
              title: row.title,
              status: "published: already has banner, skipped",
            })
          } else {
            const newContent = appendAntiscamBanner(row.publishedContent!)

            const currentVersion = await client.query<{ versionNum: number }>(
              `SELECT "versionNum" FROM "Version" WHERE id = $1`,
              [row.publishedVersionId],
            )
            const latestVersionNumber = currentVersion.rows[0]?.versionNum ?? 0

            const newBlob = await client.query<{ id: string }>(
              `INSERT INTO "Blob" (content) VALUES ($1) RETURNING id`,
              [JSON.stringify(newContent)],
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
        }

        if (bucket === "published-and-draft" || bucket === "draft-only") {
          if (hasAntiscamBanner(row.draftContent)) {
            results.push({
              id: row.id,
              title: row.title,
              status: "draft: already has banner, skipped",
            })
          } else {
            const newDraftContent = appendAntiscamBanner(row.draftContent!)
            await client.query(
              `UPDATE "Blob" SET content = $1, "updatedAt" = NOW() WHERE id = $2`,
              [JSON.stringify(newDraftContent), row.draftBlobId],
            )
            results.push({
              id: row.id,
              title: row.title,
              status: "draft: updated in place",
            })
          }
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
