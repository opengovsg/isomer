import type pino from "pino"

import { registerPgbossJob } from "@isomer/pgboss"

import type { Resource } from "~/server/modules/database"
import { env } from "~/env.mjs"
import { sendFailedPublishEmail } from "~/features/mail/service"
import {
  ENABLE_CODEBUILD_JOBS,
  ENABLE_EMAILS_FOR_SCHEDULED_PUBLISHES_FEATURE_KEY,
} from "~/lib/growthbook"
import { createBaseLogger } from "~/lib/logger"
import { createGrowthBookContext } from "~/server/context"
import { publishSite } from "~/server/modules/aws/codebuild.service"
import { db } from "~/server/modules/database"
import { publishPageResource } from "~/server/modules/resource/resource.service"

const JOB_NAME = "schedule-publishing"
const CRON_SCHEDULE = "* * * * *" // every minute

const logger = createBaseLogger({ path: "cron:schedulePublishingJob" })

/**
 * Registers the schedule publishing job with the specified cron schedule.
 * @returns A promise that resolves when the job is registered.
 */
export const schedulePublishingJob = async () => {
  return await registerPgbossJob(
    logger,
    JOB_NAME,
    CRON_SCHEDULE,
    schedulePublishJobHandler,
    // do NOT retry failed jobs, since we send failure emails on a per-resource basis
    // use singletonKey to ensure only one instance of the job runs at a time
    { retryLimit: 0, singletonKey: JOB_NAME },
    env.SCHEDULED_PUBLISHING_HEARTBEAT
      ? { heartbeatURL: env.SCHEDULED_PUBLISHING_HEARTBEAT }
      : undefined,
  )
}

/**
 * Handler function for the schedule publishing job.
 * Publishes all resources scheduled for publishing up to the current time,
 * publishes their associated sites, and resets their scheduledAt fields.
 */
const schedulePublishJobHandler = async () => {
  const scheduledAtCutoff = new Date()
  const gb = await createGrowthBookContext()
  const enableCodebuildJobs = gb.isOn(ENABLE_CODEBUILD_JOBS)
  const enableEmailsForScheduledPublishes = gb.isOn(
    ENABLE_EMAILS_FOR_SCHEDULED_PUBLISHES_FEATURE_KEY,
  )
  // Publish all scheduled resources up to the cutoff time
  const siteResourcesMap = await publishScheduledResources(
    enableEmailsForScheduledPublishes,
    scheduledAtCutoff,
  )
  // Publish all sites that have resources published
  await publishScheduledSites(siteResourcesMap, enableCodebuildJobs)
  // Reset the scheduledAt field for all resources that were scheduled to be published
  await resetScheduledAtForPublishedResources(scheduledAtCutoff)
}

const publishScheduledResources = async (
  enableEmailsForScheduledPublishes: boolean,
  scheduledAtCutoff: Date,
) => {
  // A mapping from siteId to array of resourceIds, to determine which sites need to be published after their resources have been published
  const siteResourcesMap: Record<
    string,
    (Resource & { scheduledBy: string })[]
  > = {}
  // Fetch all resources that are scheduled to be published at or before the current time, along with the user who scheduled them
  const resourcesWithUser = await db
    .selectFrom("Resource")
    .where("scheduledAt", "<=", scheduledAtCutoff)
    .selectAll()
    .execute()

  for (const resource of resourcesWithUser) {
    const { id: resourceId, siteId, scheduledBy } = resource
    if (!scheduledBy) {
      logger.error(
        `Resource ${resourceId} is missing user information, skipping publish`,
      )
      continue
    }
    try {
      // publish the resources WITHOUT publishing the site yet
      await publishPageResource({
        logger,
        resourceId,
        siteId,
        userId: scheduledBy,
        sitePublishOptions: { enable: false },
      })
      logger.info(`Successfully published page for resource: ${resourceId}`)
      // Group resources by siteId for site publishing later
      siteResourcesMap[siteId] = [
        ...(siteResourcesMap[siteId] ?? []),
        { ...resource, scheduledBy },
      ]
    } catch (error) {
      logger.error(
        { error },
        `Failed to publish page for resource: ${resourceId}`,
      )
      if (enableEmailsForScheduledPublishes) {
        const recipientEmail = await getUserEmailFromId(logger, scheduledBy)
        if (recipientEmail)
          await sendFailedPublishEmail({
            recipientEmail,
            isScheduled: true,
            resource,
          })
        logger.info(
          `Sent failed publish email to ${recipientEmail} for resource: ${resourceId}`,
        )
      }
    }
  }
  return siteResourcesMap
}

const publishScheduledSites = async (
  siteResourcesMap: Record<string, (Resource & { scheduledBy: string })[]>,
  enableCodebuildJobs: boolean,
) => {
  for (const [siteId, resources] of Object.entries(siteResourcesMap)) {
    try {
      await publishSite(logger, {
        siteId: Number(siteId),
        codebuildJobArgs: {
          addCodebuildJobRow: enableCodebuildJobs,
          isScheduled: true,
          resourceWithUserIds: resources.map(
            ({ id: resourceId, scheduledBy }) => {
              return { resourceId, userId: scheduledBy }
            },
          ),
        },
      })
      logger.info(`Successfully published site for siteId: ${siteId}`)
    } catch (error) {
      logger.error({ error }, `Failed to publish site for siteId: ${siteId}`)
      for (const resource of resources) {
        const email = await getUserEmailFromId(logger, resource.scheduledBy)
        if (!email) continue
        await sendFailedPublishEmail({
          recipientEmail: email,
          isScheduled: true,
          resource,
        })
        logger.info(
          `Sent failed publish email to ${email} for resource: ${resource.id}, since site publish failed for site ${siteId}`,
        )
      }
    }
  }
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
    .updateTable("Resource")
    .set({ scheduledAt: null, scheduledBy: null })
    .where("scheduledAt", "<=", scheduledAtCutoff)
    .execute()
}

const getUserEmailFromId = async (
  logger: pino.Logger<string>,
  userId: string,
): Promise<string | null> => {
  const user = await db
    .selectFrom("User")
    .where("id", "=", userId)
    .selectAll()
    .executeTakeFirst()
  // if user no longer exists or has no email, log error and continue
  if (!user?.email) {
    logger.error(
      `User ${userId} not found or has no email, cannot send failed publish email`,
    )
    return null
  }
  return user.email
}
