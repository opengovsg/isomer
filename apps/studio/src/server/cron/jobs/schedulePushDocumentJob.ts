import { z } from "zod"

import { registerPgbossJob } from "@isomer/pgboss"

import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"
import { getBlob } from "~/lib/s3"
import { parseFullTextFromPDF } from "~/server/modules/asset/asset.service"
import { db } from "~/server/modules/database"

const JOB_NAME = "schedule-push-document"
const CRON_SCHEDULE = "* * * * *" // every minute
const EGAZETTE_DOCUMENT_INDEX = "0ea348e0-8276-4b93-95dd-3c6f62e017d6"

const logger = createBaseLogger({ path: "cron:schedulePushDocumentJob" })

const pushDocumentContentSchema = z.object({
  page: z.object({
    ref: z.string(),
    category: z.string(),
  }),
})

const CONTENT_TYPES = {
  Informational: "Informational",
}

/**
 * Registers the schedule push document job with the specified cron schedule.
 * @returns A promise that resolves when the job is registered.
 */
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

/**
 * Handler function for the schedule publishing job.
 * Publishes all resources scheduled for publishing up to the current time,
 * publishes their associated sites, and resets their scheduledAt fields.
 */
const schedulePushDocumentJobHandler = async () => {
  const scheduledAtCutoff = new Date()

  // NOTE: get all documents that are scheduled to publish
  // Use distinctOn to get only the latest version per resource
  const scheduledResources = await db
    .selectFrom("ScheduledJobs")
    .innerJoin("Resource", "Resource.id", "ScheduledJobs.resourceId")
    .innerJoin("Version", "Version.resourceId", "Resource.id")
    .innerJoin("Blob", "Blob.id", "Version.blobId")
    .where("scheduledAt", "<=", scheduledAtCutoff)
    .where("ScheduledJobs.type", "=", "PushDocument")
    .distinctOn("Resource.id")
    .orderBy("Resource.id")
    .orderBy("Version.id", "desc")
    .select([
      "Blob.content",
      "Resource.title",
      "Resource.id as resourceId",
      "Resource.parentId",
      "scheduledAt",
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

        const { parentTitle } = await db
          .selectFrom("Resource")
          .where("id", "=", parentId)
          .select(["title as parentTitle"])
          .executeTakeFirstOrThrow()

        const blob = await getBlob(
          env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
          url.substring(1),
        )

        return {
          // NOTE: the document id is what they (searchsg) uses to
          // uniquely identify a document
          // so this should be indicative of that same pdf
          // ie, if a user deletes and re-uploads a slightly different file,
          // we should NOT show 2 search results
          documentId: generateDocumentId(url, String(resourceId)),
          content: await parseFullTextFromPDF(blob),
          title,
          url: `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}${url}`,
          contentType: CONTENT_TYPES.Informational,
          date: scheduledAt,
          // NOTE: This is the `subcategory`
          customFilter1: [parsed.data.page.category],
          categories: [parentTitle],
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
  await resetScheduledAtForPublishedResources(scheduledAtCutoff)
}

/**
 * Reset the scheduledAt field for all resources that have been published as of the given cutoff date
 * Even IF there were errors publishing some resources, we still reset the scheduledAt for all resources
 * as the publishing job has already attempted to publish them, and the user should login to the portal to check the status again
 * @param scheduledAtCutoff Date as of which to reset the scheduledAt field
 */
const resetScheduledAtForPublishedResources = async (
  scheduledAtCutoff: Date,
) => {
  await db
    .deleteFrom("ScheduledJobs")
    .where("scheduledAt", "<=", scheduledAtCutoff)
    .where("type", "=", "PushDocument")
    .execute()
}

const generateDocumentId = (url: string, resourceId: string) => {
  return `${url}-${resourceId}`
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

const SEARCHSG_BASE_URL = "https://api.services.search.gov.sg/admin" as const
const ISOMER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer" as const

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
    logger.info("No documents to push for ingestion")
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
    console.log(errorText)
    console.error(
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
