import { TRPCError } from "@trpc/server"
import {
  ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY,
  ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"
import { generateAltTextSchema } from "~/schemas/ai"
import { protectedProcedure, router } from "~/server/trpc"

import { doAllFileKeysBelongToSite } from "../asset/asset.service"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import {
  generateAltTextForUploadedImage,
  parseUploadedImageKey,
} from "./ai.service"

export const aiRouter = router({
  generateAltText: protectedProcedure
    .input(generateAltTextSchema)
    // Arbitrary: bounds cost/latency exposure to the vision model per user.
    // Editors upload images one at a time, so this comfortably covers normal
    // use while still limiting abuse.
    .meta({ rateLimitOptions: { max: 20, windowMs: 60_000 } })
    .mutation(
      async ({
        ctx,
        input: { siteId, pageId, src, mimeType, componentType },
      }) => {
        if (
          !ctx.gb.getFeatureValue(
            ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY,
            ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY_FALLBACK_VALUE,
          )
        ) {
          return { altText: undefined }
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
          mimeType,
          componentType,
          logger: ctx.logger,
        })

        return { altText }
      },
    ),
})
