import { TRPCError } from "@trpc/server"
import {
  deleteAssetsByUrlSchema,
  getPresignedGetUrlSchema,
  getPresignedPutUrlSchema,
  uploadSvgSchema,
} from "~/schemas/asset"
import { protectedProcedure, router } from "~/server/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { invalidateAssetPaths } from "../aws/cloudfront.service"
import { validateUserIsIsomerAdmin } from "../permissions/permissions.service"
import {
  deleteAssetsByUrl,
  doAllFileKeysBelongToSite,
  getFileKey,
  getPresignedGetUrl,
  getPresignedPutUrl,
  putFileDirect,
  sanitizeSvg,
  validateUserPermissionsForAsset,
} from "./asset.service"

export const assetRouter = router({
  getPresignedPutUrl: protectedProcedure
    .input(getPresignedPutUrlSchema)
    .mutation(
      async ({
        ctx,
        input: { tags, siteId, fileName, fileSize, resourceId },
      }) => {
        await validateUserPermissionsForAsset({
          siteId,
          resourceId,
          action: "create",
          userId: ctx.user.id,
        })

        const fileKey = getFileKey({ siteId, fileName })

        const uploadConfig = await getPresignedPutUrl({
          key: fileKey,
          fileSize,
          tags,
        })

        ctx.logger.info(
          {
            userId: ctx.session?.userId,
            siteId,
            fileName,
            fileKey,
          },
          `Generated upload config for ${fileKey} for site ${siteId}`,
        )

        return { fileKey, uploadConfig }
      },
    ),

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

  // OGP-admin-only tool: soft-deletes arbitrary asset URLs across any site
  // (moderation/PDPA takedowns). Rate-limited since it drives S3 + CloudFront
  // calls per submitted URL.
  deleteAssetsByUrl: protectedProcedure
    .input(deleteAssetsByUrlSchema)
    .meta({ rateLimitOptions: { max: 10, windowMs: 60_000 } })
    .mutation(async ({ ctx, input: { urls } }) => {
      await validateUserIsIsomerAdmin({
        userId: ctx.user.id,
        roles: [IsomerAdminRole.Core],
      })

      const results = await deleteAssetsByUrl(urls)

      // Failed results are invalidated too: tagging may have stopped partway
      // through a folder, and evicting an untagged object is harmless
      const attemptedKeys = new Set(
        results.flatMap(({ key }) => (key ? [key] : [])),
      )
      const invalidation = await invalidateAssetPaths(ctx.logger, attemptedKeys)

      const failedCount = results.filter((result) => !result.success).length
      ctx.logger.info(
        {
          userId: ctx.user.id,
          urls,
          results,
          invalidation,
        },
        `Admin asset deletion: ${
          results.length - failedCount
        } succeeded, ${failedCount} failed`,
      )

      return { results, invalidation }
    }),

  uploadSvg: protectedProcedure
    .input(uploadSvgSchema)
    // Arbitrary: 10 SVG uploads per user per minute. SVG sanitization is
    // CPU-intensive relative to presigned URL issuance, so a tighter limit
    // applies here. Adjust freely based on observed usage patterns.
    .meta({ rateLimitOptions: { max: 10, windowMs: 60_000 } })
    .mutation(
      async ({
        ctx,
        input: { siteId, fileName, content, resourceId, tags },
      }) => {
        await validateUserPermissionsForAsset({
          siteId,
          resourceId,
          action: "create",
          userId: ctx.user.id,
        })

        const fileKey = getFileKey({ siteId, fileName })
        const sanitized = sanitizeSvg(content)

        await putFileDirect({
          key: fileKey,
          body: sanitized,
          tags,
        })

        ctx.logger.info(
          {
            userId: ctx.session?.userId,
            siteId,
            fileName,
            fileKey,
          },
          `Uploaded sanitized SVG ${fileKey} for site ${siteId}`,
        )

        return { fileKey }
      },
    ),
})
