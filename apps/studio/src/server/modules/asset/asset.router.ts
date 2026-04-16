import { TRPCError } from "@trpc/server"

import { ADMIN_ROLE } from "~/lib/growthbook"
import { deleteAssetsSchema, getPresignedPutUrlSchema } from "~/schemas/asset"
import { protectedProcedure, router } from "~/server/trpc"

import { validateUserIsIsomerCoreAdmin } from "../permissions/permissions.service"
import {
  getFileKey,
  getPresignedPutUrl,
  invalidateAssetsBySiteIds,
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

  deleteAssets: protectedProcedure
    .input(deleteAssetsSchema)
    .mutation(async ({ ctx, input: { fileKeys } }) => {
      await validateUserIsIsomerCoreAdmin({
        userId: ctx.user.id,
        gb: ctx.gb,
        roles: [ADMIN_ROLE.CORE, ADMIN_ROLE.MIGRATORS],
      })

      // Validate fileKey format: <siteId>/<uuid>/<filename>
      const fileKeyPattern = /^\d+\/[a-f0-9-]{36}\/.+$/
      const invalidKeys = fileKeys.filter((key) => !fileKeyPattern.test(key))
      if (invalidKeys.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid file key format. Expected format: <siteId>/<uuid>/<filename>. Invalid keys: ${invalidKeys.slice(0, 3).join(", ")}${invalidKeys.length > 3 ? "..." : ""}`,
        })
      }

      const results = await Promise.allSettled(
        fileKeys.map(async (fileKey) => {
          await markFileAsDeleted({ key: fileKey })
          return fileKey
        }),
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
        }

        return results
      })

      const successfulDeletes = results
        .filter((res) => {
          return res.status === "fulfilled"
        })
        .map((res) => {
          // NOTE: The key is of format: `<siteId>/<uuid>/<filename>`
          return res.value.split("/").at(0) ?? ""
        })
        .filter(Boolean)

      const invalidatedSites =
        await invalidateAssetsBySiteIds(successfulDeletes)

      return {
        invalidatedSites,
      }
    }),
})
