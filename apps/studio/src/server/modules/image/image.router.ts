import { ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY } from "~/lib/growthbook"
import { generateAltTextSchema } from "~/schemas/image"
import { protectedProcedure, router } from "~/server/trpc"

import { db } from "../database"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import { getFullPageById } from "../resource/resource.service"
import { generateAltTextForUploadedImage } from "./image.service"

export const imageRouter = router({
  generateAltText: protectedProcedure
    .input(generateAltTextSchema)
    // Arbitrary: bounds cost/latency exposure to the vision model per user.
    // Editors upload images one at a time, so this comfortably covers normal
    // use while still limiting abuse.
    .meta({ rateLimitOptions: { max: 20, windowMs: 60_000 } })
    .mutation(
      async ({
        ctx,
        input: {
          siteId,
          pageId,
          src,
          mimeType,
          componentType,
          surroundingText,
        },
      }) => {
        if (!ctx.gb.isOn(ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY)) {
          return { altText: undefined }
        }

        await bulkValidateUserPermissionsForResources({
          siteId,
          action: "read",
          userId: ctx.user.id,
        })

        const page = await getFullPageById(db, { resourceId: pageId, siteId })

        const altText = await generateAltTextForUploadedImage({
          src,
          mimeType,
          componentType,
          surroundingText,
          pageTitle: page?.title,
          logger: ctx.logger,
        })

        return { altText }
      },
    ),
})
