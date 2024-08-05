import { TRPCError } from "@trpc/server"

import { createCollectionPageSchema } from "~/schemas/page"
import { getResourceSchema } from "~/schemas/resource"
import { protectedProcedure, router } from "~/server/trpc"
import { db, ResourceType } from "../database"
import { getSiteResourceById } from "../resource/resource.service"
import {
  createCollectionPageJson,
  createCollectionPdfJson,
} from "./collection.service"

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
  createCollectionPage: protectedProcedure
    .input(createCollectionPageSchema)
    .mutation(async ({ input }) => {
      let newPage: PrismaJson.BlobJsonContent
      const { title, type, permalink, siteId, collectionId } = input
      if (type === "page") {
        newPage = createCollectionPageJson({ title, type })
      } else {
        newPage = createCollectionPdfJson({ title, type, url: input.url })
      }

      // TODO: Validate whether folderId actually is a folder instead of a page
      // TODO: Validate whether siteId is a valid site
      // TODO: Validate user has write-access to the site
      const resource = await db.transaction().execute(async (tx) => {
        const blob = await tx
          .insertInto("Blob")
          .values({
            content: newPage,
          })
          .returning("Blob.id")
          .executeTakeFirstOrThrow()

        const addedResource = await tx
          .insertInto("Resource")
          .values({
            title,
            permalink,
            siteId,
            parentId: String(collectionId),
            draftBlobId: blob.id,
            type: ResourceType.CollectionPage,
          })
          .returning("Resource.id")
          .executeTakeFirstOrThrow()
        return addedResource
      })
      return { pageId: resource.id }
    }),
})
