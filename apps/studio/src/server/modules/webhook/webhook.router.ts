import { TRPCError } from "@trpc/server"

import {
  sendFailedSchedulePublishEmail,
  sendSuccessfulScheduledPublishEmail,
} from "~/features/mail/service"
import { codeBuildWebhookSchema } from "~/schemas/webhook"
import { router, webhookProcedure } from "~/server/trpc"
import { db } from "../database"

export const webhookRouter = router({
  updateCodebuildWebhook: webhookProcedure
    .input(codeBuildWebhookSchema)
    .mutation(
      async ({ ctx: { logger }, input: { siteId, buildId, buildStatus } }) => {
        // Update the build status of the site according to the webhook payload
        const codebuildJob = await db.transaction().execute(async (tx) => {
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
          // Update the build status of the job
          await tx
            .updateTable("CodeBuildJobs")
            .set({
              status: buildStatus,
            })
            .where("buildId", "=", codebuildJob.buildId)
            .executeTakeFirst()
          return codebuildJob
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
          .where("id", "=", codebuildJob.userId)
          .executeTakeFirst()

        if (!user?.email) {
          logger.warn(
            { userId: codebuildJob.userId },
            `User with ID ${String(codebuildJob.userId)} not found or email not available. Cannot send build notification.`,
          )
          return
        }
        // no status change, do nothing
        if (codebuildJob.status === buildStatus) {
          logger.info(
            { buildStatus, siteId, buildId },
            `No status change for build status ${String(buildStatus)} for siteId ${String(siteId)} and buildId ${String(buildId)}.`,
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
