import { TRPCError } from "@trpc/server"

import { deleteAssetsSchema, getPresignedPutUrlSchema } from "~/schemas/asset"
import { protectedProcedure, router } from "~/server/trpc"
import {
  getFileKey,
  getPresignedPutUrl,
  markFileAsDeleted,
  validateUserPermissionsForAsset,
} from "./asset.service"

export const assetRouter = router({
  getPresignedPutUrl: protectedProcedure
    .input(getPresignedPutUrlSchema)
    .mutation(async ({ ctx, input: { siteId, fileName } }) => {
      await validateUserPermissionsForAsset({
        siteId,
        action: "create",
        userId: ctx.user.id,
      })

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

  deleteAssets: protectedProcedure
    .input(deleteAssetsSchema)
    .mutation(async ({ ctx, input: { siteId, resourceId, fileKeys } }) => {
      await validateUserPermissionsForAsset({
        siteId,
        resourceId,
        action: "read",
        userId: ctx.user.id,
      })

      await Promise.allSettled(
        fileKeys.map((fileKey) => markFileAsDeleted({ key: fileKey })),
      ).then((results) => {
        const deleteFailedCounts = results.filter(
          (result) => result.status === "rejected",
        ).length
        const totalDeleteCounts = fileKeys.length

        if (deleteFailedCounts > 0) {
          ctx.logger.error({
            message: `Failed to delete files/images`,
            merged: {
              fileKeys,
              deleteFailedCounts,
              totalDeleteCounts,
            },
          })

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete files/images",
          })
        }
      })
    }),
})
