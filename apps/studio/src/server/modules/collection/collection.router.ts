import { TRPCError } from "@trpc/server"

import { getResourceSchema } from "~/schemas/resource"
import { protectedProcedure, router } from "~/server/trpc"
import { getSiteResourceById } from "../resource/resource.service"

export const collectionRouter = router({
  getMetadata: protectedProcedure
    .input(getResourceSchema)
    .query(async ({ input: { siteId, resourceId } }) => {
      const resource = await getSiteResourceById({
        siteId,
        resourceId: String(resourceId),
        type: "Collection",
      })
      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found",
        })
      }
      return resource
    }),
})
