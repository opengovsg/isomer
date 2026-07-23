/**
 * Repair gazette Search Records in Algolia.
 *
 * Incident-response tool. When a batch of gazettes ends up with missing or
 * stale Search Records in the shared egazette Algolia index (e.g. an ingestion
 * cron misfired, or a redeploy dropped records), an operator uses this to
 * re-submit the affected gazettes.
 *
 * The operator supplies resource IDs only. For each gazette the script
 * rebuilds its Search Records from the live PDF and re-submits them, deleting
 * the gazette's existing records first so the operation is idempotent and
 * self-healing even when the chunk count shrinks (a smaller PDF would
 * otherwise leave orphaned trailing records behind).
 *
 * Terminology (see CONTEXT.md): a gazette produces one **Search Record** per
 * PDF text chunk; every record of one gazette shares the same **Object Group**
 * (its S3 object key), which is how we address a gazette's records as a unit.
 *
 * How to use:
 *   1. Authenticate with AWS (the PDFs live in the gazette S3 bucket), e.g.:
 *        aws sso login --profile <your-profile>
 *   2. Set ALGOLIA_APP_ID, ALGOLIA_API_KEY, ALGOLIA_INDEX_NAME,
 *      S3_GAZETTE_BUCKET_NAME, S3_GAZETTE_DOMAIN_NAME and DATABASE_URL in
 *      isomer-admin/.env (see .env.example).
 *   3. Run the admin CLI from tooling/scripts:
 *        pnpm run isomer-admin
 *   4. Select "Repair gazette search records" and answer the prompts.
 */
import {
  GetObjectCommand,
  GetObjectTaggingCommand,
  PutObjectTaggingCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { confirm, input } from "@inquirer/prompts"

import {
  buildGazetteSearchRecords,
  createAlgoliaClient,
  parseFullTextFromPDF,
} from "@isomer/algolia"

import { withDbClient } from "../utils/db"

// Row returned by the resource lookup. content is the coalesced published /
// draft blob content (published preferred). scheduledAt is the gazette's
// publish timestamp, coalesced from Resource.scheduledAt to the published
// Version's publishedAt.
interface GazetteResourceRow {
  id: string
  title: string
  parentId: string | null
  content: unknown
  scheduledAt: string | null
}

// Minimal shape of the gazette blob content the script reads.
interface GazettePageContent {
  page: {
    ref: string
    category: string
    tagged: string[]
    description?: string
  }
}

// Minimal shape of the parent IndexPage published blob, used to map a tag id
// to its human-readable subcategory label.
interface IndexPageContent {
  page: {
    tagCategories: { options: { id: string; label: string }[] }[]
  }
}

const isGazettePageContent = (
  content: unknown,
): content is GazettePageContent => {
  if (typeof content !== "object" || content === null) return false
  const page = (content as { page?: unknown }).page
  if (typeof page !== "object" || page === null) return false
  const p = page as Record<string, unknown>
  return (
    typeof p.ref === "string" &&
    typeof p.category === "string" &&
    Array.isArray(p.tagged)
  )
}

const isIndexPageContent = (content: unknown): content is IndexPageContent => {
  if (typeof content !== "object" || content === null) return false
  const page = (content as { page?: unknown }).page
  if (typeof page !== "object" || page === null) return false
  return Array.isArray((page as { tagCategories?: unknown }).tagCategories)
}

// A resource we resolved and validated as a repairable gazette.
interface ResolvedGazette {
  id: string
  title: string
  ref: string
  objectGroup: string
  category: string
  tagged: string[]
  description?: string
  parentId: string | null
  scheduledAt: Date
}

const getEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

// Fetch the PDF bytes for a gazette's S3 key.
const getPdfBytes = async (
  client: S3Client,
  bucket: string,
  key: string,
): Promise<Uint8Array> => {
  const data = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  )
  const byteArr = await data.Body?.transformToByteArray()
  if (!byteArr) {
    throw new Error(`Empty S3 object body for key ${key}`)
  }
  return byteArr
}

// Strip the `scheduledAt` object tag so the PDF is publicly viewable — the
// equivalent of Studio's setAssetAsPublished tag handling. We deliberately do
// NOT apply the COMPLIANCE object-lock retention here: published gazettes are
// already locked by the normal publish flow, and re-applying an irreversible
// ~27-year lock from a repair tool would be dangerous. This repair only needs
// the tag removed so the object stays reachable to members of the public.
const stripScheduledAtTag = async (
  client: S3Client,
  bucket: string,
  key: string,
): Promise<void> => {
  const { TagSet = [] } = await client.send(
    new GetObjectTaggingCommand({ Bucket: bucket, Key: key }),
  )
  const remaining = TagSet.filter(({ Key }) => Key !== "scheduledAt")
  if (remaining.length === TagSet.length) return // no scheduledAt tag present
  await client.send(
    new PutObjectTaggingCommand({
      Bucket: bucket,
      Key: key,
      Tagging: { TagSet: remaining },
    }),
  )
}

export const repairGazetteSearchRecords = async (): Promise<void> => {
  const appId = getEnv("ALGOLIA_APP_ID")
  const apiKey = getEnv("ALGOLIA_API_KEY")
  const indexName = getEnv("ALGOLIA_INDEX_NAME")
  const bucket = getEnv("S3_GAZETTE_BUCKET_NAME")
  const domainName = getEnv("S3_GAZETTE_DOMAIN_NAME")

  const awsProfile = await input({
    message:
      "AWS profile to use (leave blank to use your current default AWS credentials)",
    default: process.env.AWS_PROFILE,
  })
  if (awsProfile.trim()) {
    process.env.AWS_PROFILE = awsProfile.trim()
  }

  const region = await input({
    message: "AWS region of the gazette S3 bucket",
    default: "ap-southeast-1",
    validate: (value) => Boolean(value.trim()) || "AWS region is required.",
  })

  const resourceIdsInput = await input({
    message:
      "Enter the gazette resource IDs to repair (comma- or whitespace-separated)",
  })
  // Accept comma and/or whitespace as separators. Resource IDs are numeric
  // (BigInt primary keys), so keep only digit-only tokens.
  const resourceIds = [
    ...new Set(
      resourceIdsInput
        .split(/[\s,]+/)
        .map((id) => id.trim())
        .filter((id) => id !== "" && /^\d+$/.test(id)),
    ),
  ]

  if (resourceIds.length === 0) {
    console.error("No valid resource IDs provided.")
    return
  }

  const s3 = new S3Client({ region: region.trim() })
  const { saveObjectsToSearchIndex, deleteObjectsFromSearchIndexByFilter } =
    createAlgoliaClient({ appId, apiKey, indexName })

  await withDbClient(async (client) => {
    // Mirror the ingestion cron's coalesce join, keyed on the operator's
    // resource IDs instead of the PushDocumentJob queue. Prefer the published
    // Version's blob, fall back to the draft blob. scheduledAt is the publish
    // timestamp, coalesced from Resource.scheduledAt to the Version's
    // publishedAt.
    const placeholders = resourceIds.map((_, i) => `$${i + 1}`).join(",")
    const { rows } = await client.query<GazetteResourceRow>(
      `SELECT "Resource".id,
              "Resource".title,
              "Resource"."parentId",
              COALESCE("PublishedBlob".content, "DraftBlob".content) AS content,
              COALESCE("Resource"."scheduledAt", "Version"."publishedAt") AS "scheduledAt"
       FROM "Resource"
       LEFT JOIN "Version" ON "Resource"."publishedVersionId" = "Version".id
       LEFT JOIN "Blob" AS "PublishedBlob" ON "Version"."blobId" = "PublishedBlob".id
       LEFT JOIN "Blob" AS "DraftBlob" ON "Resource"."draftBlobId" = "DraftBlob".id
       WHERE "Resource".id IN (${placeholders})`,
      resourceIds,
    )

    const foundById = new Map(rows.map((row) => [row.id, row]))

    // Resolve each requested ID into a repairable gazette, flagging any ID
    // that cannot be resolved or does not parse as a gazette.
    const resolved: ResolvedGazette[] = []
    const skipped: { id: string; reason: string }[] = []

    for (const id of resourceIds) {
      const row = foundById.get(id)
      if (!row) {
        skipped.push({ id, reason: "resource not found" })
        continue
      }
      if (!isGazettePageContent(row.content)) {
        skipped.push({
          id,
          reason: "content is missing or not a gazette page",
        })
        continue
      }
      if (!row.scheduledAt) {
        skipped.push({ id, reason: "no publish timestamp (scheduledAt) found" })
        continue
      }
      const { ref, category, tagged, description } = row.content.page
      resolved.push({
        id: row.id,
        title: row.title,
        ref,
        // objectGroup is the S3 key (no leading slash), matching egazette's
        // objectKey convention.
        objectGroup: ref.slice(1),
        category,
        tagged,
        description,
        parentId: row.parentId,
        scheduledAt: new Date(row.scheduledAt),
      })
    }

    if (skipped.length > 0) {
      console.log(`\nSkipping ${skipped.length} resource ID(s):`)
      for (const { id, reason } of skipped) {
        console.log(`  [${id}] ${reason}`)
      }
    }

    if (resolved.length === 0) {
      console.log("\nNo repairable gazettes found. Nothing to do.")
      return
    }

    console.log(`\n${resolved.length} gazette(s) to repair:`)
    for (const gazette of resolved) {
      console.log(`  [${gazette.id}] ${gazette.title} — ${gazette.ref}`)
    }

    const confirmed = await confirm({
      message: `Re-submit Search Records for all ${resolved.length} gazette(s)?`,
      default: false,
    })
    if (!confirmed) {
      console.log("Aborted.")
      return
    }

    let succeeded = 0
    let failed = 0

    // Process serially. Algolia is rate-limited (same rationale as the
    // ingestion cron's for-await loop) — a parallel map risks 429s and
    // records not being ingested.
    for (const gazette of resolved) {
      try {
        // Derive the subcategory label from the parent IndexPage's published
        // blob, mirroring the cron. A gazette without a resolvable
        // subcategory still repairs with an empty subCategory.
        let subCategory = ""
        if (gazette.parentId !== null) {
          const { rows: indexRows } = await client.query<{ content: unknown }>(
            `SELECT "Blob".content
             FROM "Resource"
             INNER JOIN "Version" ON "Version".id = "Resource"."publishedVersionId"
             INNER JOIN "Blob" ON "Blob".id = "Version"."blobId"
             WHERE "Resource".type = 'IndexPage'
               AND "Resource"."parentId" = $1
             LIMIT 1`,
            [gazette.parentId],
          )
          const indexContent = indexRows[0]?.content
          if (isIndexPageContent(indexContent)) {
            const options = indexContent.page.tagCategories.flatMap(
              (c) => c.options,
            )
            const match = options.find((o) => o.id === gazette.tagged[0])
            subCategory = match?.label ?? ""
          }
        }

        const key = gazette.objectGroup
        const pdfBytes = await getPdfBytes(s3, bucket, key)

        // Strip the scheduledAt tag so the PDF is publicly viewable. Always
        // done, mirroring the cron's unconditional setAssetAsPublished call.
        await stripScheduledAtTag(s3, bucket, key)

        const parsedText = await parseFullTextFromPDF(pdfBytes)
        const fileUrl = encodeURI(`https://${domainName}${gazette.ref}`)

        const records = buildGazetteSearchRecords({
          parsedText,
          objectGroup: gazette.objectGroup,
          title: gazette.title,
          category: gazette.category,
          subCategory,
          notificationNum: gazette.description,
          fileUrl,
          scheduledAt: gazette.scheduledAt,
        })

        if (records.length === 0) {
          console.error(
            `  [${gazette.id}] no Search Records built (empty PDF text); skipping`,
          )
          failed++
          continue
        }

        // Delete-then-save. Removing the gazette's existing records by Object
        // Group first makes the repair idempotent and fixes the shrinking-
        // chunk-count case (fewer chunks now than before would otherwise leave
        // stale trailing records). Algolia processes tasks per index in
        // submission order, so the delete always completes before the save —
        // there is no race between the two.
        await deleteObjectsFromSearchIndexByFilter(
          `objectGroup:"${gazette.objectGroup}"`,
        )
        await saveObjectsToSearchIndex(records)

        succeeded++
        console.log(
          `  [${gazette.id}] repaired — ${records.length} Search Record(s)`,
        )
      } catch (error) {
        failed++
        console.error(`  [${gazette.id}] failed:`, error)
      }
    }

    console.log(
      `\nDone. ${succeeded} gazette(s) repaired, ${failed} failed, out of ${resolved.length} attempted.`,
    )
  })
}
