import type { BuildStatusType } from "@prisma/client"
import type pino from "pino"

import {
  sendFailedSchedulePublishEmail,
  sendSuccessfulScheduledPublishEmail,
} from "~/features/mail/service"
import { db } from "../database"

export const updateCurrentAndSupersededBuilds = async (
  buildId: string,
  buildStatus: BuildStatusType,
) => {
  // Update the build status of all builds that have the given buildId or have been superseded by it
  return await db.transaction().execute(async (tx) => {
    // Get the build and any builds it has superseded, along with their associated resource and user details
    const buildsToUpdate = await tx
      .selectFrom("CodeBuildJobs")
      .innerJoin("User", "User.id", "CodeBuildJobs.userId")
      .innerJoin("Resource", "Resource.id", "CodeBuildJobs.resourceId")
      .where((eb) => {
        return eb.and([
          eb.or([
            eb("CodeBuildJobs.buildId", "=", buildId),
            // To be added later on after finishing the implementation of superseded builds
            eb("CodeBuildJobs.supersededByBuildId", "=", buildId),
          ]),
          eb("CodeBuildJobs.status", "<>", buildStatus),
        ])
      })
      .selectAll()
      .execute()

    if (buildsToUpdate.length)
      await tx
        .updateTable("CodeBuildJobs")
        .set({
          status: buildStatus,
        })
        .where(
          "buildId",
          "in",
          buildsToUpdate.map((build) => build.buildId),
        )
        .execute()

    return buildsToUpdate
  })
}

export const updateCodebuildStatusAndSendEmails = async (
  logger: pino.Logger<string>,
  buildId: string,
  buildStatus: BuildStatusType,
): Promise<{ sentEmails: number }> => {
  const buildsToUpdate = await updateCurrentAndSupersededBuilds(
    buildId,
    buildStatus,
  )

  if (buildsToUpdate.length === 0) {
    logger.info(
      { buildId, buildStatus },
      `No builds to update for buildId ${String(buildId)}, skipping emails.`,
    )
    return { sentEmails: 0 }
  }

  const buildsWithEmails = buildsToUpdate
    // only send email if the user has an email and emailSent is false
    .filter((build) => build.email && !build.emailSent)

  try {
    // Map and send the emails in parallel
    const emailPromisesSettled = await Promise.allSettled(
      buildsWithEmails.flatMap((info) => {
        switch (buildStatus) {
          case "SUCCEEDED":
            return [
              sendSuccessfulScheduledPublishEmail({
                recipientEmail: info.email,
                publishTime: new Date(), // use current time as publish time, no need to use exact time from codebuild
              }),
            ]
          case "FAILED":
            return [
              sendFailedSchedulePublishEmail({
                recipientEmail: info.email,
              }),
            ]
          default:
            return [] // no emails for other statuses
        }
      }),
    )
    // update the emailSent status for all builds that were sent an email,
    // ie for which the promises were fulfilled
    const buildIdsForSentEmails = buildsWithEmails
      .map((info) => info.buildId)
      .filter((_, idx) => {
        const emailPromise = emailPromisesSettled[idx]
        return emailPromise?.status === "fulfilled"
      })

    const uniqueBuildIds = [...new Set(buildIdsForSentEmails)]

    if (uniqueBuildIds.length > 0) {
      await db
        .updateTable("CodeBuildJobs")
        .set({
          emailSent: true,
        })
        .where("buildId", "in", uniqueBuildIds)
        .execute()
    }
    logger.info(
      {
        buildId,
        buildStatus,
        updated: buildsToUpdate.length,
        sentEmails: uniqueBuildIds.length,
      },
      `Webhook executed for buildId ${String(buildId)}`,
    )
    return {
      sentEmails: uniqueBuildIds.length,
    }
  } catch (error) {
    // emails are sent on a best-effort basis, so we log the error but do not fail the entire process
    logger.error(
      {
        buildId,
        buildStatus,
        error,
      },
      `Failed to send notification emails for build status ${String(buildStatus)} for buildId ${String(buildId)}.`,
    )
    return {
      sentEmails: 0,
    }
  }
}
