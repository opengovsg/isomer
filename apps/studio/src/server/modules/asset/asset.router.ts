import { getPresignedPutUrlSchema } from "~/schemas/asset"
import { protectedProcedure, router } from "~/server/trpc"
import { getFileKey, getPresignedPutUrl } from "./asset.service"

export const assetRouter = router({
  getPresignedPutUrl: protectedProcedure
    .input(getPresignedPutUrlSchema)
    .mutation(async ({ ctx, input: { siteId, fileName } }) => {
      const fileKey = getFileKey({
        siteId,
        fileName,
      })

      const presignedPutUrl = await getPresignedPutUrl({
        key: fileKey,
      })

      ctx.logger.info(
        `Generated presigned PUT URL for ${fileKey} for site ${siteId}`,
        {
          userId: ctx.session?.userId,
          siteId,
          fileName,
          fileKey,
        },
      )

      return {
        fileKey,
        presignedPutUrl,
      }
    }),
})
