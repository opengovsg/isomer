import { deleteAssetSchema, getPresignedPutUrlSchema } from "~/schemas/asset"
import { protectedProcedure, router } from "~/server/trpc"
import {
  getFileKey,
  getPresignedPutUrl,
  markFileAsDeleted,
} from "./asset.service"

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

  deleteAsset: protectedProcedure
    .input(deleteAssetSchema)
    .mutation(async ({ ctx, input }) => {
      const { fileKey } = input

      try {
        ctx.logger.info({
          message: `Deleting asset file`,
          merged: {
            fileKey,
          },
        })

        await markFileAsDeleted({ key: fileKey })
      } catch (e) {
        ctx.logger.error({
          message: `Failed to delete asset file`,
          merged: {
            fileKey,
            error: JSON.stringify(e),
          },
        })

        throw e
      }
    }),
})
