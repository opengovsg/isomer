import type { GrowthBook } from "@growthbook/growthbook"
import type { BuildStatusType } from "@prisma/client"
import type pino from "pino"
import { ResourceType } from "@prisma/client"
import _ from "lodash"

import {
  sendFailedPublishEmail,
  sendSuccessfulPublishEmail,
} from "~/features/mail/service"
import {
  ENABLE_EMAILS_FOR_REGULAR_PUBLISHES_FEATURE_KEY,
  ENABLE_EMAILS_FOR_SCHEDULED_PUBLISHES_FEATURE_KEY,
} from "~/lib/growthbook"
import { db } from "../database"

/**
 * Updates the status of the current build and any builds that have been superseded by it.
 * @param buildId The ID of the build to update.
 * @param buildStatus The new status to set for the build.
 */
const updateCurrentAndSupersededBuilds = async (
  buildId: string,
  buildStatus: BuildStatusType,
) => {
  await db
    .updateTable("CodeBuildJobs")
    .set({
      status: buildStatus,
    })
    .where((eb) => {
      return eb.or([
        eb("CodeBuildJobs.buildId", "=", buildId),
        eb("CodeBuildJobs.supersededByBuildId", "=", buildId),
      ])
    })
    .execute()
}

/**
 * Updates the status of a CodeBuild job and sends notification emails.
 * @param logger The logger instance to use for logging.
 * @param buildId The ID of the build to update.
 * @param buildStatus The new status to set for the build.
 * @returns An object containing the IDs of the CodeBuild jobs for which emails were sent.
 */
export const updateCodebuildStatusAndSendEmails = async (
  logger: pino.Logger<string>,
  gb: GrowthBook,
  buildId: string,
  status: BuildStatusType,
): Promise<{ codebuildJobIdsForSentEmails: string[] }> => {
  // tracks the ids of builds for which emails were sent successfully
  let codebuildJobIdsForSentEmails: string[] = []
  await updateCurrentAndSupersededBuilds(buildId, status)
  // send notification emails on a best-effort basis, so we catch any errors and log them
  try {
    codebuildJobIdsForSentEmails = await sendEmails(gb, buildId, status)
    logger.info(
      {
        buildId,
        status,
        codebuildJobIdsForSentEmails,
      },
      `Emails sent for buildId ${String(buildId)}`,
    )
  } catch (error) {
    logger.error(
      {
        buildId,
        status,
        error,
      },
      `Failed to send notification emails for build status ${String(status)} for buildId ${String(buildId)}.`,
    )
  }
  // mark the builds for which emails were sent successfully as having had their email sent
  if (codebuildJobIdsForSentEmails.length > 0) {
    await db
      .updateTable("CodeBuildJobs")
      .set({
        emailSent: true,
      })
      .where("id", "in", codebuildJobIdsForSentEmails)
      .execute()
  }

  return {
    codebuildJobIdsForSentEmails,
  }
}

/**
 * Sends notification emails to users based on the updated build statuses.
 * NOTE: in order for emails to be sent, the email must NOT have been sent before (emailSent = false)
 * and the user must have an email associated with their account.
 * @param buildId The ID of the build that has been updated.
 * @param buildStatus The new status of the build.
 * @param buildsToUpdate Array of builds that have been updated, along with their associated resource and user details
 */
const sendEmails = async (
  gb: GrowthBook,
  buildId: string,
  buildStatus: BuildStatusType,
) => {
  const buildsToSendEmails = await db
    .selectFrom("CodeBuildJobs")
    .innerJoin("User", "User.id", "CodeBuildJobs.userId")
    .innerJoin("Resource", "Resource.id", "CodeBuildJobs.resourceId")
    .where((eb) => {
      return eb.and([
        eb.or([
          eb("CodeBuildJobs.buildId", "=", buildId),
          eb("CodeBuildJobs.supersededByBuildId", "=", buildId),
        ]),
        eb("CodeBuildJobs.emailSent", "=", false), // only consider builds that haven't had an email sent yet
        eb("Resource.type", "=", ResourceType.Page), // only consider page resources for sending emails
        eb("User.email", "is not", null), // only consider users with an email
      ])
    })
    .selectAll()
    .select(["CodeBuildJobs.id as codeBuildJobId"])
    .execute()

  const emailPromisesWithCodebuildJobId = _.compact(
    buildsToSendEmails
      .filter((build) => isEmailFunctionalityActive(gb, build.isScheduled))
      .map((info) => {
        switch (buildStatus) {
          case "SUCCEEDED":
            return {
              id: info.codeBuildJobId, // codebuild job id
              promise: sendSuccessfulPublishEmail({
                isScheduled: info.isScheduled,
                recipientEmail: info.email,
                resource: info,
              }),
            }
          case "FAILED":
            return {
              id: info.codeBuildJobId, // codebuild job id
              promise: sendFailedPublishEmail({
                isScheduled: info.isScheduled,
                recipientEmail: info.email,
                resource: info,
              }),
            }
          default:
            return // no emails for other statuses
        }
      }),
  )
  const emailPromisesSettled = await Promise.allSettled(
    emailPromisesWithCodebuildJobId.map((t) => t.promise),
  )
  // get the codebuildJobIds for which the email was successfully sent
  const codebuildJobIdsForSentEmails = emailPromisesWithCodebuildJobId
    .map((info) => info.id)
    .filter((_, idx) => {
      const emailPromise = emailPromisesSettled[idx]
      return emailPromise?.status === "fulfilled"
    })

  return codebuildJobIdsForSentEmails
}

/**
 * Check if email functionality is active for the given Growthbook instance and scheduling status.
 * @param gb Growthbook instance
 * @param isScheduled Whether the publish is scheduled
 * @returns Whether email functionality is active
 */
const isEmailFunctionalityActive = (gb: GrowthBook, isScheduled: boolean) => {
  if (isScheduled) {
    return gb.isOn(ENABLE_EMAILS_FOR_SCHEDULED_PUBLISHES_FEATURE_KEY)
  } else {
    return gb.isOn(ENABLE_EMAILS_FOR_REGULAR_PUBLISHES_FEATURE_KEY)
  }
}
