import { TRPCError } from "@trpc/server"

import { FILE_SCAN_RESULT, FILE_SCAN_STATUS } from "~/constants/asset"
import { env } from "~/env.mjs"
import {
  deleteAssetSchema,
  getPresignedPutUrlSchema,
  postFileScanResultSchema,
} from "~/schemas/asset"
import { eventBridgeProcedure, protectedProcedure, router } from "~/server/trpc"
import {
  getFileKey,
  getPresignedPutUrl,
  markFileAsDeleted,
  moveFileToPublicBucket,
} from "./asset.service"

const { S3_UNSAFE_ASSETS_BUCKET_NAME } = env

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

  postFileScanResult: eventBridgeProcedure
    .input(postFileScanResultSchema)
    .mutation(async ({ ctx, input }) => {
      const keyName = input.detail.s3ObjectDetails.objectKey
      const bucketName = input.detail.s3ObjectDetails.bucketName
      const scanStatus = input.detail.scanStatus
      const scanResult = input.detail.scanResultDetails.scanResultStatus
      const possibleThreats = input.detail.scanResultDetails.threats

      ctx.logger.info({
        message: "Received asset file scan result",
        merged: {
          keyName,
          bucketName,
          scanStatus,
          scanResult,
          possibleThreats,
        },
      })

      if (scanStatus !== FILE_SCAN_STATUS.completed) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Scan status is not completed for ${keyName}`,
        })
      }

      if (scanResult !== FILE_SCAN_RESULT.noThreatsFound) {
        ctx.logger.error({
          message: `Anti virus scanning failed for uploaded asset`,
          merged: {
            keyName,
            bucketName,
            scanStatus,
            scanResult,
            possibleThreats,
          },
        })

        return
      }

      if (bucketName !== S3_UNSAFE_ASSETS_BUCKET_NAME) {
        // The file was not originally in the unsafe bucket, so there is nothing
        // to move
        return
      }

      try {
        await moveFileToPublicBucket({ key: keyName })
        ctx.logger.info({
          message: `Successfully moved asset file to public bucket`,
          merged: {
            keyName,
          },
        })

        return
      } catch (e) {
        ctx.logger.error({
          message: `Failed to move asset file to public bucket`,
          merged: {
            keyName,
            error: JSON.stringify(e),
          },
        })

        throw e
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
