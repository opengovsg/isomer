import type { Resource } from "~/server/modules/database"
import { env } from "~/env.mjs"
import {
  sendAlreadyUnpublishedEmail,
  sendFailedPublishEmail,
  sendFailedUnpublishEmail,
} from "~/features/mail/service"
import {
  ENABLE_CODEBUILD_JOBS,
  ENABLE_EMAILS_FOR_SCHEDULED_PUBLISHES_FEATURE_KEY,
} from "~/lib/growthbook"
import { createBaseLogger } from "~/lib/logger"
import { createGrowthBookContext } from "~/server/context"
import { publishSite } from "~/server/modules/aws/codebuild.service"
import { db, ScheduledAction } from "~/server/modules/database"
import { PageAlreadyUnpublishedError } from "~/server/modules/resource/resource.error"
import {
  defaultResourceSelect,
  publishPageResource,
  unpublishPageResource,
} from "~/server/modules/resource/resource.service"

import { registerPgbossJob } from "@isomer/pgboss"

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
const schedulePublishJobHandler = async () => {
  const scheduledAtCutoff = new Date()
  const gb = await createGrowthBookContext()
  try {
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
  } finally {
    gb.destroy()
  }
}

type ResourceWithUser = Omit<Resource, "scheduledBy"> & {
  scheduledBy: string
  email: string | null
  userDeletedAt: Date | null
}

// Dispatch table so publish/unpublish share one code path instead of
// parallel if/else branches — adding a third scheduled action only means
// adding a case here. Resolved lazily (not a module-scope constant) so it
// always calls through the current `publishPageResource`/`unpublishPageResource`
// bindings, which tests replace via `vi.spyOn`.
const getScheduledActionHandler = (
  action: ScheduledAction,
): {
  run: typeof publishPageResource
  verb: "publish" | "unpublish"
  sendFailedEmail: typeof sendFailedPublishEmail
} => {
  switch (action) {
    case ScheduledAction.Unpublish:
      return {
        run: unpublishPageResource,
        verb: "unpublish",
        sendFailedEmail: sendFailedUnpublishEmail,
      }
    case ScheduledAction.Publish:
      return {
        run: publishPageResource,
        verb: "publish",
        sendFailedEmail: sendFailedPublishEmail,
      }
  }
}

export const publishScheduledResources = async (
  enableEmailsForScheduledPublishes: boolean,
  scheduledAtCutoff: Date,
) => {
  // A mapping from siteId to array of resourceIds, to determine which sites need to be published after their resources have been published
  const siteResourcesMap: Record<string, ResourceWithUser[]> = {}
  // Fetch all resources that are scheduled to be published at or before the current time, along with the user who scheduled them
  const resourcesWithUser = await db
    .selectFrom("Resource")
    .leftJoin("User as u", "Resource.scheduledBy", "u.id")
    .where("scheduledAt", "<=", scheduledAtCutoff)
    .select([
      ...defaultResourceSelect,
      "u.email as email",
      "u.deletedAt as userDeletedAt",
    ])
    .execute()

  // Reset the scheduledAt and scheduledBy fields for all resources that are being published
  await resetScheduledAtForPublishedResources(scheduledAtCutoff)

  for (const resource of resourcesWithUser) {
    const { id: resourceId, siteId, scheduledBy } = resource
    if (!scheduledBy) {
      logger.error(
        `Resource ${resourceId} is missing user information, skipping publish`,
      )
      continue
    }
    const scheduledAction = resource.scheduledAction ?? ScheduledAction.Publish
    const handler = getScheduledActionHandler(scheduledAction)
    try {
      // publish/unpublish the resource WITHOUT publishing the site yet
      await handler.run({ logger, resourceId, siteId, userId: scheduledBy })
      logger.info(
        `Successfully ${handler.verb}ed page for resource: ${resourceId}`,
      )
      // Group resources by siteId for site publishing later
      siteResourcesMap[siteId] = siteResourcesMap[siteId] ?? []
      siteResourcesMap[siteId].push({ ...resource, scheduledBy })
    } catch (error) {
      if (resource.userDeletedAt || !resource.email) {
        logger.error(
          { error },
          `Failed to ${handler.verb} page for resource: ${resourceId}`,
        )
        logger.warn(
          `Resource ${resourceId} is missing user email information or deleted, cannot send failed ${handler.verb} email`,
        )
        continue
      }
      // The unpublish precondition throws this when the page was already
      // unpublished by the time the cron ran (e.g. a manual unpublish beat
      // the schedule) — that's the desired end state, not a failure.
      if (
        scheduledAction === ScheduledAction.Unpublish &&
        error instanceof PageAlreadyUnpublishedError
      ) {
        logger.warn(
          `Resource ${resourceId} was already unpublished, skipping scheduled unpublish`,
        )
        if (!enableEmailsForScheduledPublishes) {
          continue
        }
        try {
          await sendAlreadyUnpublishedEmail({
            recipientEmail: resource.email,
            resource,
          })
          logger.warn(
            `Sent already-unpublished email to ${resource.email} for resource: ${resourceId}`,
          )
        } catch (emailError) {
          logger.error(
            { error: emailError },
            `Failed to send already-unpublished email to ${resource.email} for resource: ${resourceId}`,
          )
        }
        continue
      }
      logger.error(
        { error },
        `Failed to ${handler.verb} page for resource: ${resourceId}`,
      )
      if (!enableEmailsForScheduledPublishes) {
        continue
      }
      try {
        await handler.sendFailedEmail({
          recipientEmail: resource.email,
          isScheduled: true,
          resource,
        })
        logger.warn(
          `Sent failed ${handler.verb} email to ${resource.email} for resource: ${resourceId}`,
        )
      } catch (emailError) {
        logger.error(
          { error: emailError },
          `Failed to send failed ${handler.verb} email to ${resource.email} for resource: ${resourceId}`,
        )
      }
    }
  }
  return siteResourcesMap
}

export const publishScheduledSites = async (
  siteResourcesMap: Record<string, ResourceWithUser[]>,
  enableCodebuildJobs: boolean,
) => {
  for (const [siteId, resources] of Object.entries(siteResourcesMap)) {
    try {
      await publishSite(logger, {
        siteId: Number(siteId),
        codebuildJob: enableCodebuildJobs
          ? {
              isScheduled: true,
              resourceWithUserIds: resources.map(
                ({ id: resourceId, scheduledBy }) => {
                  return { resourceId, userId: scheduledBy }
                },
              ),
            }
          : undefined,
      })
      logger.info(`Successfully published site for siteId: ${siteId}`)
    } catch (error) {
      logger.error({ error }, `Failed to publish site for siteId: ${siteId}`)
      for (const resource of resources) {
        if (resource.userDeletedAt || !resource.email) {
          logger.warn(
            `Resource ${resource.id} is missing user email information or deleted, cannot send failed publish email`,
          )
          continue
        }
        const handler = getScheduledActionHandler(
          resource.scheduledAction ?? ScheduledAction.Publish,
        )
        try {
          await handler.sendFailedEmail({
            recipientEmail: resource.email,
            isScheduled: true,
            resource,
          })
          logger.warn(
            `Sent failed ${handler.verb} email to ${resource.email} for resource: ${resource.id}, since site publish failed for site ${siteId}`,
          )
        } catch (emailError) {
          logger.error(
            { error: emailError },
            `Failed to send failed ${handler.verb} email to ${resource.email} for resource: ${resource.id}, since site publish failed for site ${siteId}`,
          )
        }
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
    .set({ scheduledAt: null, scheduledBy: null, scheduledAction: null })
    .where("scheduledAt", "<=", scheduledAtCutoff)
    .execute()
}
