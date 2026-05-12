import { z } from "zod"
import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"
import { getBlob, setAssetAsPublished } from "~/lib/s3"
import { parseFullTextFromPDF } from "~/server/modules/asset/asset.service"
import { db } from "~/server/modules/database"
import {
  EGAZETTE_DOCUMENT_INDEX,
  generateDocumentId,
  ISOMER_UA,
  SEARCHSG_BASE_URL,
} from "~/server/modules/searchsg/searchsg.service"

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

const CONTENT_TYPES = {
  Informational: "Informational",
}

export const schedulePushDocumentJob = async () => {
  return await registerPgbossJob(
    logger,
    JOB_NAME,
    CRON_SCHEDULE,
    schedulePushDocumentJobHandler,
    { retryLimit: 3, singletonKey: JOB_NAME },
    env.SCHEDULED_PUBLISHING_HEARTBEAT_URL
      ? { heartbeatURL: env.SCHEDULED_PUBLISHING_HEARTBEAT_URL }
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

        const blob = await getBlob(
          env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
          url.slice(1),
        )

        // NOTE: Remove `scheduledAt` tags from our s3 object
        // so that the pdf is viewable to MOPs
        await setAssetAsPublished({
          Key: url.slice(1),
          Bucket: env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
        })

        // NOTE: Derive the subcategory from the tagged mapping
        const indexParsed =
          collectionIndexPageContentSchema.safeParse(indexPageContent)
        if (!indexParsed.success) {
          logger.error(
            { indexPageContent, resourceId },
            "Invalid index page content structure",
          )
          return null
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
          url: `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}${url}`,
          contentType: CONTENT_TYPES.Informational,
          // TODO: match this to the filter format expected by searchsg
          date: scheduledAt,
          customFilter1: subcategory ? [subcategory.label] : [],
          categories: [parsed.data.page.category],
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

interface PushDocument {
  documentId: string
  title: string
  url: string
  contentType: string
  content: string
  date: Date
  customFilter1: string[]
  categories: string[]
}

const getSearchSGAuthToken = async () => {
  const response = await fetch(`${SEARCHSG_BASE_URL}/v1/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${env.SEARCHSG_API_KEY}`,
      "User-Agent": ISOMER_UA,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get SearchSG auth token: ${response.statusText}`)
  }

  const { accessToken, tokenType } = (await response.json()) as {
    accessToken: string
    tokenType: string
  }

  return { accessToken, tokenType }
}

const pushDocumentsForIngestion = async (documents: PushDocument[]) => {
  if (documents.length === 0) {
    return
  }

  const { accessToken, tokenType } = await getSearchSGAuthToken()

  const response = await fetch(
    `${SEARCHSG_BASE_URL}/v2/indexes/${EGAZETTE_DOCUMENT_INDEX}/documents`,
    {
      method: "POST",
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": ISOMER_UA,
      },
      body: JSON.stringify({ documentsToAdd: documents }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    logger.error(
      { status: response.status, error: errorText },
      "Failed to push documents for ingestion",
    )
    throw new Error(
      `Failed to push documents for ingestion: ${response.statusText}`,
    )
  }

  logger.info(
    { count: documents.length },
    "Successfully pushed documents for ingestion",
  )
}
