import { z } from "zod"

import { registerPgbossJob } from "@isomer/pgboss"

import type { Resource } from "~/server/modules/database"
import { env } from "~/env.mjs"
import { sendFailedPublishEmail } from "~/features/mail/service"
import { createBaseLogger } from "~/lib/logger"
import { db } from "~/server/modules/database"
import {
  defaultResourceSelect,
  publishPageResource,
} from "~/server/modules/resource/resource.service"

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
    // do NOT retry failed jobs, since we send failure emails on a per-resource basis
    // use singletonKey to ensure only one instance of the job runs at a time
    { retryLimit: 0, singletonKey: JOB_NAME },
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
  const scheduledResources = await db
    .selectFrom("ScheduledJobs")
    .innerJoin("Resource", "Resource.id", "ScheduledJobs.resourceId")
    .innerJoin("Blob", "Blob.id", "Resource.draftBlobId")
    .where("scheduledAt", "<=", scheduledAtCutoff)
    .where("type", "=", "PushDocument")
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
      const parsed = pushDocumentContentSchema.safeParse(content)
      if (!parsed.success) {
        logger.error({ content }, "Invalid content structure for push document")
        return null
      }

      const url = parsed.data.page.ref

      const { parentTitle } = await db
        .selectFrom("Resource")
        .where("id", "=", parentId)
        .select(["title as parentTitle"])
        .executeTakeFirstOrThrow()

      return {
        // NOTE: the document id is what they (searchsg) uses to
        // uniquely identify a document
        // so this should be indicative of that same pdf
        // ie, if a user deletes and re-uploads a slightly different file,
        // we should NOT show 2 search results
        documentId: generateDocumentId(url, resourceId),
        content: await parsePdfContent(url),
        title,
        url,
        contentType: CONTENT_TYPES.Informational,
        date: scheduledAt,
        // NOTE: This is the `subcategory`
        customFilter1: [parsed.data.page.category],
        categories: [parentTitle],
      }
    },
  )

  const resolvedDocuments = await Promise.all(documentPromises)
  const documents = resolvedDocuments.filter(
    (document): document is PushDocument => document !== null,
  )

  await pushDocumentsForIngestion(documents)
}

// TODO: add this in using the egazette implementation
const parsePdfContent = async (url: string) => {
  return "test"
}

type ResourceWithUser = Omit<Resource, "scheduledBy"> & {
  scheduledBy: string
  email: string | null
  userDeletedAt: Date | null
}

export const publishScheduledResources = async (
  enableEmailsForScheduledPublishes: boolean,
  scheduledAtCutoff: Date,
) => {
  // A mapping from siteId to array of resourceIds, to determine which sites need to be published after their resources have been published
  const siteResourcesMap: Record<string, ResourceWithUser[]> = {}
  // Fetch all resources that are scheduled to be published at or before the current time, along with the user who scheduled them
  const jobsWithUser = await db
    .selectFrom("ScheduledJobs")
    .leftJoin("User as u", "scheduledBy", "u.id")
    .where("scheduledAt", "<=", scheduledAtCutoff)
    .where("type", "=", "PublishResource")
    .select([
      "u.email as email",
      "u.deletedAt as userDeletedAt",
      "resourceId",
      "ScheduledJobs.id",
      "scheduledBy",
    ])
    .execute()

  // Reset the scheduledAt and scheduledBy fields for all resources that are being published
  await resetScheduledAtForPublishedResources(scheduledAtCutoff)

  for (const job of jobsWithUser) {
    const { resourceId, scheduledBy } = job
    if (!scheduledBy) {
      logger.error(
        `Resource ${resourceId} is missing user information, skipping publish`,
      )
      continue
    }

    const resource = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select(defaultResourceSelect)
      .executeTakeFirst()

    if (!resource) {
      logger.error(`Unable to find resource with id: ${resourceId}`)
      continue
    }

    try {
      // publish the resources WITHOUT publishing the site yet
      await publishPageResource({
        logger,
        resourceId,
        siteId: resource.siteId,
        userId: scheduledBy,
      })

      logger.info(`Successfully published page for resource: ${resourceId}`)
      // Group resources by siteId for site publishing later
      const siteId = resource.siteId
      siteResourcesMap[siteId] = siteResourcesMap[siteId] ?? []
      siteResourcesMap[siteId].push({
        ...resource,
        ...job,
      })
    } catch (error) {
      logger.error(
        { error },
        `Failed to publish page for resource: ${resourceId}`,
      )
      if (job.userDeletedAt || !job.email) {
        logger.warn(
          `Resource ${resourceId} is missing user email information or deleted, cannot send failed publish email`,
        )
        continue
      }
      if (enableEmailsForScheduledPublishes) {
        try {
          await sendFailedPublishEmail({
            recipientEmail: job.email,
            isScheduled: true,
            resource,
          })
          logger.warn(
            `Sent failed publish email to ${job.email} for resource: ${resourceId}`,
          )
        } catch (emailError) {
          logger.error(
            { error: emailError },
            `Failed to send failed publish email to ${job.email} for resource: ${resourceId}`,
          )
        }
      }
    }
  }
  return siteResourcesMap
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
