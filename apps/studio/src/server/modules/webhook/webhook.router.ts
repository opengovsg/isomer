import { codeBuildWebhookSchema } from "~/schemas/webhook"
import { router, webhookProcedure } from "~/server/trpc"
import { updateCodebuildStatusAndSendEmails } from "./webhook.utils"

export const webhookRouter = router({
  updateCodebuildWebhook: webhookProcedure
    .input(codeBuildWebhookSchema)
    .mutation(
      async ({ ctx: { logger, gb }, input: { buildId, buildStatus } }) => {
        await updateCodebuildStatusAndSendEmails(
          logger,
          gb,
          buildId,
          buildStatus,
        )
      },
    ),
})
