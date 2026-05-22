import type { PushDocument } from "~/server/modules/gazette/gazette.service"
import { z } from "zod"
import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"
import { getBlob, setAssetAsPublished } from "~/lib/s3"
import { db } from "~/server/modules/database"
import {
  parseFullTextFromPDF,
  pushDocumentsForIngestion,
} from "~/server/modules/gazette/gazette.service"
import { generateDocumentId } from "~/server/modules/searchsg/searchsg.service"

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

  // Pick the latest published Version per resource so we ingest the
  // version that was just (or is being) published — distinctOn(Resource.id)
  // + ordered by Version.id desc.
  const scheduledResources = await db
    .selectFrom("PushDocumentJob")
    .innerJoin("Resource", "Resource.id", "PushDocumentJob.resourceId")
    .innerJoin("Blob", "Blob.id", "Resource.draftBlobId")
    .where("PushDocumentJob.scheduledAt", "<=", scheduledAtCutoff)
    .distinctOn("Resource.id")
    .orderBy("Resource.id")
    .select([
      "Blob.content",
      "Resource.title",
      "Resource.id as resourceId",
      "Resource.parentId",
      "PushDocumentJob.scheduledAt",
    ])
    .execute()

  const documentPromises = scheduledResources.map(
    async ({ scheduledAt, resourceId, title, parentId, content }) => {
      try {
        const parsed = pushDocumentContentSchema.safeParse(content)
        if (!parsed.success) {
          logger.error(
            { content, resourceId },
            "Invalid content structure for push document",
          )
          return null
        }

        const url = parsed.data.page.ref

        // NOTE: select the index page published blob also
        // as we need to derive the subcategory
        const { content: indexPageContent } = await db
          .selectFrom("Resource")
          .innerJoin("Version", "Version.resourceId", "Resource.id")
          .innerJoin("Blob", "Blob.id", "Version.blobId")
          .where("type", "=", "IndexPage")
          .where("parentId", "=", parentId)
          .select(["Blob.content"])
          .executeTakeFirstOrThrow()

        const blob = await getBlob(env.S3_GAZETTE_BUCKET_NAME, url.slice(1))

        // NOTE: Remove `scheduledAt` tags from our s3 object
        // so that the pdf is viewable to MOPs
        await setAssetAsPublished({
          Key: url.slice(1),
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
          // SearchSG dedupes on documentId, so derive a stable id from the
          // S3 key + resourceId. Re-uploads of the same key produce the
          // same id, avoiding duplicate search hits.
          documentId: generateDocumentId(url, String(resourceId)),
          content: pdfTextContent.slice(0, SEARCHSG_CONTENT_LENGTH),
          title,
          url: encodeURI(`https://${env.S3_GAZETTE_DOMAIN_NAME}${url}`),
          date: scheduledAt.toISOString(),
          categories: subcategory?.label ? [subcategory.label] : [],
          contentType: parsed.data.page.category,
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
    "Completed schedule push document job",
  )
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
