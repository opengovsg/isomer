import { getPresignedPutUrlSchema } from "~/schemas/asset"
import { protectedProcedure, router } from "~/server/trpc"
import { getFileKey, getPresignedPutUrl } from "./asset.service"

export const assetRouter = router({
  getPresignedPutUrl: protectedProcedure
    .input(getPresignedPutUrlSchema)
    .query(async ({ input: { siteId, fileName } }) => {
      const fileKey = getFileKey({
        siteId,
        fileName,
      })

      const presignedPutUrl = await getPresignedPutUrl({
        key: fileKey,
      })

      return {
        fileKey,
        presignedPutUrl,
      }
    }),
})
