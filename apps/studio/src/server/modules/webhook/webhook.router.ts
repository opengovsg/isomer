import { codeBuildWebhookSchema } from "~/schemas/webhook"
import { router, webhookProcedure } from "~/server/trpc"

import { updateCodebuildStatusAndSendEmails } from "./webhook.utils"

export const webhookRouter = router({
  updateCodebuildWebhook: webhookProcedure
    .input(codeBuildWebhookSchema)
    .meta({ rateLimitOptions: { max: 60, windowMs: 60_000 } })
    .mutation(async ({ ctx: { logger, gb }, input: { buildId, status } }) => {
      await updateCodebuildStatusAndSendEmails(logger, gb, buildId, status)
    }),
})
