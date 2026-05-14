import { TRPCError } from "@trpc/server"
import {
  deleteAssetsSchema,
  getPresignedGetUrlSchema,
  getPresignedPutUrlSchema,
} from "~/schemas/asset"
import { protectedProcedure, router } from "~/server/trpc"

import {
  doAllFileKeysBelongToSite,
  getFileKey,
  getPresignedGetUrl,
  getPresignedPutUrl,
  markFileAsDeleted,
  validateUserPermissionsForAsset,
} from "./asset.service"

export const assetRouter = router({
  getPresignedPutUrl: protectedProcedure
    .input(getPresignedPutUrlSchema)
    .mutation(async ({ ctx, input: { siteId, fileName, resourceId } }) => {
      await validateUserPermissionsForAsset({
        siteId,
        resourceId,
        action: "create",
        userId: ctx.user.id,
      })

      const fileKey = getFileKey({ siteId, fileName })

      const { presignedPutUrl, contentType, contentDisposition } =
        await getPresignedPutUrl({
          key: fileKey,
        })

      ctx.logger.info(
        {
          userId: ctx.session?.userId,
          siteId,
          fileName,
          fileKey,
        },
        `Generated presigned PUT URL for ${fileKey} for site ${siteId}`,
      )

      return {
        fileKey,
        presignedPutUrl,
        contentType,
        contentDisposition,
      }
    }),

  // Modelled as a mutation rather than a query: it has user-visible side
  // effects (logs, expiring URL) and is invoked imperatively per click.
  getPresignedGetUrl: protectedProcedure
    .input(getPresignedGetUrlSchema)
    .mutation(async ({ ctx, input: { siteId, fileKey } }) => {
      await validateUserPermissionsForAsset({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      if (!doAllFileKeysBelongToSite({ fileKeys: [fileKey], siteId })) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "The file key does not belong to the specified site. You may only access assets for the site you are authorized for.",
        })
      }

      const presignedGetUrl = await getPresignedGetUrl({ key: fileKey })

      ctx.logger.info(
        {
          userId: ctx.session?.userId,
          siteId,
          fileKey,
        },
        `Generated presigned GET URL for ${fileKey} for site ${siteId}`,
      )

      return { presignedGetUrl }
    }),

  deleteAssets: protectedProcedure
    .input(deleteAssetsSchema)
    .mutation(async ({ ctx, input: { siteId, resourceId, fileKeys } }) => {
      await validateUserPermissionsForAsset({
        siteId,
        resourceId,
        action: "delete",
        userId: ctx.user.id,
      })

      if (!doAllFileKeysBelongToSite({ fileKeys, siteId })) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "One or more file keys do not belong to the specified site. You may only delete assets for the site you are authorized for.",
        })
      }

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
