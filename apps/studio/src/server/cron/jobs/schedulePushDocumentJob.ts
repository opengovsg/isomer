import type { PushDocument } from "~/server/modules/gazette/gazette.service"
import { z } from "zod"
import { env } from "~/env.mjs"
import { saveObjectsToSearchIndex } from "~/lib/algolia"
import { ENABLE_SEARCHSG_GAZETTE_INGESTION } from "~/lib/growthbook"
import { createBaseLogger } from "~/lib/logger"
import { getBlob, setAssetAsPublished } from "~/lib/s3"
import { createGrowthBookContext } from "~/server/context"
import { db } from "~/server/modules/database"
import {
  buildGazetteSearchRecords,
  generateDocumentId,
  parseFullTextFromPDF,
  pushDocumentsForIngestion,
  resolveGazetteTagLabels,
} from "~/server/modules/gazette/gazette.service"

import { registerPgbossJob } from "@isomer/pgboss"

const JOB_NAME = "schedule-push-document"
const CRON_SCHEDULE = "* * * * *" // every minute
const SEARCHSG_CONTENT_LENGTH = 50000

const logger = createBaseLogger({ path: "cron:schedulePushDocumentJob" })

const pushDocumentContentSchema = z.object({
  page: z.object({
    ref: z.string(),
    tagged: z.array(z.string()),
    description: z.string().optional(),
  }),
})

const collectionIndexPageContentSchema = z.object({
  layout: z.literal("collection"),
  page: z.object({
    tagCategories: z.array(
      z.object({
        label: z.string(),
        options: z.array(z.object({ id: z.string(), label: z.string() })),
      }),
    ),
  }),
})

/**
 * Shared extraction pipeline for one resource, used by both SearchSG and
 * Algolia.
 *
 * It does the I/O work here: S3 fetch, S3 tag update, PDF parse, and schema
 * validation. `pushDocumentContentSchema` failures are logged and return
 * `null`. `collectionIndexPageContentSchema` failures are logged and thrown so
 * the caller can skip that row.
 *
 * `setAssetAsPublished` still runs once per resource, no matter which
 * ingestion branch handles it.
 */
const extractResourceData = async ({
  resourceId,
  parentId,
  content,
}: {
  resourceId: string
  parentId: string | null
  content: unknown
}): Promise<{
  ref: string
  objectGroup: string
  fileUrl: string
  categoryLabel: string | undefined
  subcategoryLabel: string | undefined
  pdfTextContent: string
  parsedPage: {
    ref: string
    tagged: string[]
    description?: string
  }
} | null> => {
  const parsed = pushDocumentContentSchema.safeParse(content)
  if (!parsed.success) {
    logger.error(
      { content, resourceId },
      "Invalid content structure for push document",
    )
    return null
  }

  const ref = parsed.data.page.ref
  // objectGroup is the S3 key (no leading slash), matching egazette's
  // objectKey convention.
  const objectGroup = ref.slice(1)
  const fileUrl = encodeURI(`https://${env.S3_GAZETTE_DOMAIN_NAME}${ref}`)

  // Read the IndexPage's published blob. It carries the taxonomy labels we use
  // to resolve the subcategory.
  const { content: indexPageContent } = await db
    .selectFrom("Resource")
    .innerJoin("Version", "Version.id", "Resource.publishedVersionId")
    .innerJoin("Blob", "Blob.id", "Version.blobId")
    .where("type", "=", "IndexPage")
    .where("parentId", "=", parentId)
    .select(["Blob.content"])
    .executeTakeFirstOrThrow()

  const blob = await getBlob(env.S3_GAZETTE_BUCKET_NAME, ref.slice(1))

  // Remove the `scheduledAt` tag so the PDF is viewable to MOPs.
  await setAssetAsPublished({
    Key: ref.slice(1),
    Bucket: env.S3_GAZETTE_BUCKET_NAME,
  })

  // Derive category and subcategory labels from the tagged ids.
  const indexParsed =
    collectionIndexPageContentSchema.safeParse(indexPageContent)
  if (!indexParsed.success) {
    logger.error(
      { indexPageContent, resourceId },
      "Invalid index page content structure",
    )
    throw new Error(
      `Failed to parse index page content for resource ${resourceId}`,
    )
  }
  // The tagged ids are the only source of truth for category resolution. Do
  // not fall back to parsing labels from the S3 ref shape
  // (`{year}/{category}/{subcategory}/{file}.pdf`). Older rows that no longer
  // resolve need a backfill, not a guessed label from the object key.
  const { categoryLabel, subcategoryLabel } = resolveGazetteTagLabels({
    tagged: parsed.data.page.tagged,
    tagCategories: indexParsed.data.page.tagCategories,
  })

  // Once the ref fallback is gone, this is the main signal for an old row that
  // still needs backfilling. The job row is deleted either way, so this record
  // will not retry on its own.
  if (!categoryLabel) {
    logger.warn(
      { resourceId, ref, tagged: parsed.data.page.tagged },
      "Could not resolve gazette category from tagged ids. Skipping ingestion. This row predates the tagCategories cutover, so backfill it and re-ingest it manually.",
    )
    return null
  }

  const pdfTextContent = await parseFullTextFromPDF(blob)

  return {
    ref,
    objectGroup,
    fileUrl,
    categoryLabel,
    subcategoryLabel,
    pdfTextContent,
    parsedPage: parsed.data.page,
  }
}

export const schedulePushDocumentJob = async () => {
  return await registerPgbossJob(
    logger,
    JOB_NAME,
    CRON_SCHEDULE,
    schedulePushDocumentJobHandler,
    { retryLimit: 3, singletonKey: JOB_NAME },
    env.SCHEDULE_PUSH_DOCUMENT_JOB_HEARTBEAT_URL
      ? { heartbeatURL: env.SCHEDULE_PUSH_DOCUMENT_JOB_HEARTBEAT_URL }
      : undefined,
  )
}

export const schedulePushDocumentJobHandler = async () => {
  const scheduledAtCutoff = new Date()
  const gb = await createGrowthBookContext()
  try {
    const useSearchSg = gb.isOn(ENABLE_SEARCHSG_GAZETTE_INGESTION)

    // Prefer the published blob, then fall back to the draft blob. Publish and
    // ingestion can run on the same `scheduledAt`, and publish clears
    // `draftBlobId` when the draft becomes the Version. Looking only at the
    // draft blob would miss rows where publish won that race. If both blobs are
    // missing, the Zod parse below fails and the row is logged and skipped.
    const scheduledResources = await db
      .selectFrom("PushDocumentJob")
      .innerJoin("Resource", "Resource.id", "PushDocumentJob.resourceId")
      .leftJoin("Version", "Version.id", "Resource.publishedVersionId")
      .leftJoin("Blob as PublishedBlob", "PublishedBlob.id", "Version.blobId")
      .leftJoin("Blob as DraftBlob", "DraftBlob.id", "Resource.draftBlobId")
      .where("PushDocumentJob.scheduledAt", "<=", scheduledAtCutoff)
      .distinctOn("Resource.id")
      .orderBy("Resource.id")
      .select([
        (eb) =>
          eb.fn
            .coalesce("PublishedBlob.content", "DraftBlob.content")
            .as("content"),
        "Resource.title",
        "Resource.id as resourceId",
        "Resource.parentId",
        "PushDocumentJob.scheduledAt",
      ])
      .execute()

    if (useSearchSg) {
      // --- SearchSG path (flag ON) ---
      const documentPromises = scheduledResources.map(
        async ({ scheduledAt, resourceId, title, parentId, content }) => {
          try {
            const extracted = await extractResourceData({
              resourceId,
              parentId,
              content,
            })
            if (extracted === null) return null

            const { ref, pdfTextContent, categoryLabel, subcategoryLabel } =
              extracted

            return {
              // SearchSG dedupes on documentId, so derive a stable id from the
              // S3 key + resourceId. Re-uploads of the same key produce the
              // same id, avoiding duplicate search hits.
              documentId: generateDocumentId(ref, String(resourceId)),
              content: pdfTextContent.slice(0, SEARCHSG_CONTENT_LENGTH),
              title,
              url: encodeURI(`https://${env.S3_GAZETTE_DOMAIN_NAME}${ref}`),
              date: scheduledAt.toISOString(),
              categories: subcategoryLabel ? [subcategoryLabel] : [],
              contentType: categoryLabel ?? "",
            }
          } catch (error) {
            logger.error({ error, resourceId }, "Failed to process document")
            return null
          }
        },
      )

      const resolvedDocuments = await Promise.all(documentPromises)
      const documents = resolvedDocuments.filter(
        (document): document is PushDocument => document !== null,
      )

      await pushDocumentsForIngestion(documents)
      await deleteProcessedJobs(scheduledAtCutoff)
      logger.info(
        { count: documents.length, documents },
        "Completed schedule push document job (SearchSG)",
      )
    } else {
      // --- Algolia path (flag OFF, default) ---
      let savedCount = 0
      // NOTE: This is deliberate done using a `for .. await` loop
      // to avoid running into rate-limits with Algolia. DO NOT
      // change this to a `map` as it might cause the publish to fail
      // due to the records not being ingested by Algolia
      for (const {
        scheduledAt,
        resourceId,
        title,
        parentId,
        content,
      } of scheduledResources) {
        try {
          const extracted = await extractResourceData({
            resourceId,
            parentId,
            content,
          })
          if (extracted === null) continue

          const {
            objectGroup,
            fileUrl,
            categoryLabel,
            subcategoryLabel,
            pdfTextContent,
            parsedPage,
          } = extracted

          const records = buildGazetteSearchRecords({
            parsedText: pdfTextContent,
            objectGroup,
            title,
            category: categoryLabel ?? "",
            subCategory: subcategoryLabel ?? "",
            notificationNum: parsedPage.description,
            fileUrl,
            scheduledAt,
          })

          if (records.length === 0) {
            logger.error(
              { resourceId },
              "No search records built; skipping save",
            )
            continue
          }

          await saveObjectsToSearchIndex(records)
          savedCount++
          logger.info({ resourceId, count: records.length }, "Saved to Algolia")
        } catch (error) {
          logger.error(
            { error, resourceId },
            "Failed to process document for Algolia",
          )
        }
      }

      await deleteProcessedJobs(scheduledAtCutoff)
      logger.info(
        { count: savedCount, attempted: scheduledResources.length },
        "Completed schedule push document job (Algolia)",
      )
    }
  } finally {
    gb.destroy()
  }
}

// Drop every job whose scheduledAt has passed, regardless of per-row push
// outcome — failed rows are logged above and not retried in-band, matching
// the existing schedule-publishing semantics.
const deleteProcessedJobs = async (scheduledAtCutoff: Date) => {
  await db
    .deleteFrom("PushDocumentJob")
    .where("scheduledAt", "<=", scheduledAtCutoff)
    .execute()
}
