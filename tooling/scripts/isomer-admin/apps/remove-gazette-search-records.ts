import { confirm } from "@inquirer/prompts"
/**
 * Remove gazette Search Records from Algolia.
 *
 * Incident-response tool. When a gazette must be pulled from the shared
 * egazette Algolia index outside of Studio's own delete flow (e.g. a gazette
 * was deleted from the database directly, or its records should never have
 * been indexed), an operator uses this to remove its Search Records.
 *
 * Unlike "Repair gazette search records", this script only removes records —
 * it does not touch the gazette's S3 asset or its database resource, and it
 * does not re-submit anything. Removal is by Object Group, so it deletes
 * every chunk record for each gazette regardless of chunk count.
 *
 * Terminology (see CONTEXT.md): a gazette produces one **Search Record** per
 * PDF text chunk; every record of one gazette shares the same **Object Group**
 * (its S3 object key), which is how we address a gazette's records as a unit.
 *
 * How to use:
 *   1. Set ALGOLIA_APP_ID, ALGOLIA_API_KEY, ALGOLIA_INDEX_NAME and
 *      DATABASE_URL in isomer-admin/.env (see .env.example).
 *   2. Put the gazette resource IDs to remove in ./input/resource-ids.csv
 *      (one ID per line; commas also accepted, header lines are ignored).
 *   3. Run the admin CLI from tooling/scripts:
 *        pnpm run isomer-admin
 *   4. Select "Remove gazette search records" and confirm the prompt.
 */
import fs from "fs"

import {
  buildGazetteObjectGroupFilter,
  createAlgoliaClient,
  objectGroupFromRef,
} from "@isomer/algolia"

import { withDbClient } from "../utils/db"
import { isGazettePageContent, parseResourceIdsCsv } from "../utils/gazette"

// Row returned by the resource lookup. content is the coalesced published /
// draft blob content (published preferred) — only the page ref is needed to
// derive the gazette's Object Group.
interface GazetteResourceRow {
  id: string
  title: string
  content: unknown
}

// A resource we resolved and validated as a gazette whose Search Records can
// be removed.
interface ResolvedGazette {
  id: string
  title: string
  ref: string
  objectGroup: string
}

const getEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const removeGazetteSearchRecords = async (): Promise<void> => {
  const appId = getEnv("ALGOLIA_APP_ID")
  const apiKey = getEnv("ALGOLIA_API_KEY")
  const indexName = getEnv("ALGOLIA_INDEX_NAME")

  // Read the resource IDs from the input CSV (same ./input convention as the
  // other file-driven admin scripts).
  const inputCsvPath = "./input/resource-ids.csv"
  if (!fs.existsSync(inputCsvPath)) {
    console.error(
      `Input file not found: ${inputCsvPath}. Create it with one gazette resource ID per line.`,
    )
    return
  }
  const resourceIds = parseResourceIdsCsv(
    fs.readFileSync(inputCsvPath, "utf-8"),
  )

  if (resourceIds.length === 0) {
    console.error(`No valid resource IDs found in ${inputCsvPath}.`)
    return
  }

  const { deleteObjectsFromSearchIndexByFilter } = createAlgoliaClient({
    appId,
    apiKey,
    indexName,
  })

  await withDbClient(async (client) => {
    const placeholders = resourceIds.map((_, i) => `$${i + 1}`).join(",")
    const { rows } = await client.query<GazetteResourceRow>(
      `SELECT "Resource".id,
              "Resource".title,
              COALESCE("PublishedBlob".content, "DraftBlob".content) AS content
       FROM "Resource"
       LEFT JOIN "Version" ON "Resource"."publishedVersionId" = "Version".id
       LEFT JOIN "Blob" AS "PublishedBlob" ON "Version"."blobId" = "PublishedBlob".id
       LEFT JOIN "Blob" AS "DraftBlob" ON "Resource"."draftBlobId" = "DraftBlob".id
       WHERE "Resource".id IN (${placeholders})`,
      resourceIds,
    )

    const foundById = new Map(rows.map((row) => [row.id, row]))

    // Resolve each requested ID into a gazette we can remove records for,
    // flagging any ID that cannot be resolved or does not parse as a gazette.
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
      const { ref } = row.content.page
      resolved.push({
        id: row.id,
        title: row.title,
        ref,
        objectGroup: objectGroupFromRef(ref),
      })
    }

    if (skipped.length > 0) {
      console.log(`\nSkipping ${skipped.length} resource ID(s):`)
      for (const { id, reason } of skipped) {
        console.log(`  [${id}] ${reason}`)
      }
    }

    if (resolved.length === 0) {
      console.log("\nNo removable gazettes found. Nothing to do.")
      return
    }

    console.log(`\n${resolved.length} gazette(s) to remove from Algolia:`)
    for (const gazette of resolved) {
      console.log(`  [${gazette.id}] ${gazette.title} — ${gazette.ref}`)
    }

    const confirmed = await confirm({
      message: `Remove all Search Records for ${resolved.length} gazette(s)? This cannot be undone.`,
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
    // records not being fully removed.
    for (const gazette of resolved) {
      try {
        await deleteObjectsFromSearchIndexByFilter(
          buildGazetteObjectGroupFilter(gazette.objectGroup),
        )
        succeeded++
        console.log(`  [${gazette.id}] removed`)
      } catch (error) {
        failed++
        console.error(`  [${gazette.id}] failed:`, error)
      }
    }

    console.log(
      `\nDone. ${succeeded} gazette(s) removed, ${failed} failed, out of ${resolved.length} attempted.`,
    )
  })
}
