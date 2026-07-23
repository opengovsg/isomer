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
  generateDocumentId,
  pushDocumentsForIngestion,
} from "~/server/modules/gazette/gazette.service"

import {
  buildGazetteSearchRecords,
  parseFullTextFromPDF,
} from "@isomer/algolia"
import { registerPgbossJob } from "@isomer/pgboss"

const JOB_NAME = "schedule-push-document"
const CRON_SCHEDULE = "* * * * *" // every minute
const SEARCHSG_CONTENT_LENGTH = 50000

const logger = createBaseLogger({ path: "cron:schedulePushDocumentJob" })

const pushDocumentContentSchema = z.object({
  page: z.object({
    ref: z.string(),
    category: z.string(),
    tagged: z.array(z.string()),
    description: z.string().optional(),
  }),
})

const collectionIndexPageContentSchema = z.object({
  layout: z.literal("collection"),
  page: z.object({
    tagCategories: z.array(
      z.object({
        options: z.array(z.object({ id: z.string(), label: z.string() })),
      }),
    ),
  }),
})

/**
 * Shared per-resource extraction pipeline used by both the SearchSG and Algolia
 * branches. Performs all I/O (S3 fetch, S3 tag update, PDF parse) and the two
 * schema validations:
 *
 *   - pushDocumentContentSchema failure  → logs + returns null  (caller skips row)
 *   - collectionIndexPageContentSchema failure → logs + throws   (caller's try/catch skips row)
 *
 * `setAssetAsPublished` is called exactly once per resource, inside this helper,
 * preserving the existing semantics regardless of which ingestion branch runs.
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
  subcategoryLabel: string | undefined
  pdfTextContent: string
  parsedPage: {
    ref: string
    category: string
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

  // NOTE: select the index page published blob also
  // as we need to derive the subcategory
  const { content: indexPageContent } = await db
    .selectFrom("Resource")
    .innerJoin("Version", "Version.id", "Resource.publishedVersionId")
    .innerJoin("Blob", "Blob.id", "Version.blobId")
    .where("type", "=", "IndexPage")
    .where("parentId", "=", parentId)
    .select(["Blob.content"])
    .executeTakeFirstOrThrow()

  const blob = await getBlob(env.S3_GAZETTE_BUCKET_NAME, ref.slice(1))

  // NOTE: Remove `scheduledAt` tags from our s3 object
  // so that the pdf is viewable to MOPs
  await setAssetAsPublished({
    Key: ref.slice(1),
    Bucket: env.S3_GAZETTE_BUCKET_NAME,
  })

  // NOTE: Derive the subcategory from the tagged mapping
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
  const { tagCategories } = indexParsed.data.page
  // reduce the tag category options into a single array then we find
  const options =
    tagCategories?.map((category) => category.options).flat() ?? []
  const subcategory = options.find(
    (option) => option.id === parsed.data.page.tagged[0],
  )

  const pdfTextContent = await parseFullTextFromPDF(blob)

  return {
    ref,
    objectGroup,
    fileUrl,
    subcategoryLabel: subcategory?.label,
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

    // Pick the content to index: prefer the published Version's blob, fall
    // back to the draft blob. The schedule-publishing cron fires on the same
    // scheduledAt as this job and publishing clears draftBlobId (the draft
    // becomes the Version — see version.service.ts), so joining only on the
    // draft blob silently drops any gazette whose publish won the race. The
    // draft fallback covers the opposite ordering, where this job runs first
    // and the identical content is published moments later. A row where both
    // blobs are somehow missing yields null content, which fails the Zod
    // parse below and is logged + skipped rather than silently dropped.
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

            const { ref, pdfTextContent, subcategoryLabel, parsedPage } =
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
              contentType: parsedPage.category,
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
            subcategoryLabel,
            pdfTextContent,
            parsedPage,
          } = extracted

          const records = buildGazetteSearchRecords({
            parsedText: pdfTextContent,
            objectGroup,
            title,
            category: parsedPage.category,
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
