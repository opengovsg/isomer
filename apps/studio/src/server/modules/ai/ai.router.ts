import type { ServerResponse } from "http"
import { TRPCError } from "@trpc/server"
import { getIsAiAltTextGenerationEnabled } from "~/lib/growthbook"
import { generateAltTextSchema } from "~/schemas/ai"
import { protectedProcedure, router } from "~/server/trpc"

import { doAllFileKeysBelongToSite } from "../asset/asset.service"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import {
  generateAltTextForUploadedImage,
  parseUploadedImageKey,
} from "./ai.service"

// The response closes when the client disconnects or when we finish writing.
// Abort only the first case, so a replaced upload stops the model call.
const abortSignalFromResponse = (res: ServerResponse): AbortSignal => {
  const controller = new AbortController()
  res.on("close", () => {
    if (!res.writableEnded) controller.abort()
  })
  return controller.signal
}

export const aiRouter = router({
  generateAltText: protectedProcedure
    .input(generateAltTextSchema)
    // Arbitrary: bounds cost/latency exposure to the vision model per user.
    // Editors upload images one at a time, so this comfortably covers normal
    // use while still limiting abuse.
    .meta({ rateLimitOptions: { max: 20, windowMs: 60_000 } })
    .mutation(async ({ ctx, input: { siteId, pageId, src } }) => {
      if (!getIsAiAltTextGenerationEnabled({ gb: ctx.gb, siteId })) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Alt text suggestions are not available for this site",
        })
      }

      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "update",
        userId: ctx.user.id,
        resourceIds: [String(pageId)],
      })

      const fileKey = parseUploadedImageKey(src)
      if (
        !fileKey ||
        !doAllFileKeysBelongToSite({ fileKeys: [fileKey], siteId })
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "The file key does not belong to the specified site. You may only access assets for the site you are authorized for.",
        })
      }

      const altText = await generateAltTextForUploadedImage({
        fileKey,
        logger: ctx.logger,
        abortSignal: abortSignalFromResponse(ctx.res),
      })

      return { altText }
    }),
})
