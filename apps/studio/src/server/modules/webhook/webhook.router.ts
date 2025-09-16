import { TRPCError } from "@trpc/server"

import {
  sendFailedSchedulePublishEmail,
  sendSuccessfulScheduledPublishEmail,
} from "~/features/mail/service"
import { codeBuildWebhookSchema } from "~/schemas/webhook"
import { router, webhookProcedure } from "~/server/trpc"
import { db } from "../database"

export const resourceRouter = router({
  updateCodebuildWebhook: webhookProcedure
    .input(codeBuildWebhookSchema)
    .mutation(
      async ({ ctx: { logger }, input: { siteId, buildId, buildStatus } }) => {
        // Update the build status of the site according to the webhook payload
        const userIdToSendNotification = await db
          .transaction()
          .execute(async (tx) => {
            const codebuildJob = await tx
              .selectFrom("CodeBuildJobs")
              .selectAll()
              .where("siteId", "=", siteId)
              .where("buildId", "=", buildId)
              .executeTakeFirst()
            // If no job is found, throw an error
            // We might expect this to happen when we first release this feature if there are any builds in progress
            if (!codebuildJob) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: `CodeBuild job could not be found for siteId ${String(siteId)} with buildId ${String(buildId)}`,
              })
            }
            // Only update if the job is still in progress, in case we receive multiple webhooks for the same build
            if (codebuildJob.status !== "IN_PROGRESS") {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `CodeBuild job for siteId ${String(siteId)} with buildId ${String(buildId)} is not in progress`,
              })
            }
            // Update the build status of the job
            await tx
              .updateTable("CodeBuildJobs")
              .set({
                status: buildStatus,
              })
              .where("id", "=", codebuildJob.id)
              .executeTakeFirst()
            return codebuildJob.userId
          })
        // log the webhook receipt and send notification based on the build status
        logger.info(
          { siteId, buildId, buildStatus },
          `Webhook received with build status ${String(buildStatus)} for siteId ${String(siteId)} and buildId ${String(buildId)}`,
        )
        // get the userId associated with the site and send notification based on the build status
        const user = await db
          .selectFrom("User")
          .selectAll()
          .where("id", "=", userIdToSendNotification)
          .executeTakeFirst()

        if (!user?.email) {
          logger.error(
            { userIdToSendNotification },
            `User with ID ${String(userIdToSendNotification)} not found or email not available. Cannot send build notification.`,
          )
          return
        }
        switch (buildStatus) {
          case "SUCCEEDED":
            // Notify the user that the build has succeeded
            await sendSuccessfulScheduledPublishEmail({
              recipientEmail: user.email,
              publishTime: new Date(), // use current time as publish time, no need to use exact time from codebuild
            })
            break
          case "FAILED":
            // Notify the user that the build has failed
            await sendFailedSchedulePublishEmail({
              recipientEmail: user.email,
            })
            break
          default:
            logger.info(
              { buildStatus, siteId, buildId },
              `No notification sent for build status ${String(buildStatus)} for siteId ${String(siteId)} and buildId ${String(buildId)}.`,
            )
            return
        }
      },
    ),
})
