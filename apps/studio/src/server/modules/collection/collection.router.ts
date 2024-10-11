import { TRPCError } from "@trpc/server"
import { get } from "lodash"

import { createCollectionSchema } from "~/schemas/collection"
import { readFolderSchema } from "~/schemas/folder"
import { createCollectionPageSchema } from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { publishSite } from "../aws/codebuild.service"
import { db, ResourceState, ResourceType } from "../database"
import {
  defaultResourceSelect,
  getSiteResourceById,
} from "../resource/resource.service"
import { defaultCollectionSelect } from "./collection.select"
import {
  createCollectionPageJson,
  createCollectionPdfJson,
} from "./collection.service"

export const collectionRouter = router({
  getMetadata: protectedProcedure
    .input(readFolderSchema)
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
  create: protectedProcedure
    .input(createCollectionSchema)
    .mutation(
      async ({ ctx, input: { collectionTitle, permalink, siteId } }) => {
        const result = await db
          .insertInto("Resource")
          .values({
            permalink,
            siteId,
            type: ResourceType.Collection,
            title: collectionTitle,
            state: ResourceState.Published,
          })
          .returning(defaultCollectionSelect)
          .executeTakeFirstOrThrow()
          .catch((err) => {
            if (get(err, "code") === "23505") {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
              })
            }
            throw err
          })

        // TODO: Create the index page for the collection and publish it
        await publishSite(ctx.logger, siteId)

        return result
      },
    ),
  createCollectionPage: protectedProcedure
    .input(createCollectionPageSchema)
    .mutation(async ({ input }) => {
      let newPage: PrismaJson.BlobJsonContent
      const { title, type, permalink, siteId, collectionId } = input
      if (type === "page") {
        newPage = createCollectionPageJson({ type })
      } else {
        newPage = createCollectionPdfJson({ type, url: input.url })
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
          .catch((err) => {
            if (get(err, "code") === "23505") {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
              })
            }
            throw err
          })
        return addedResource
      })
      return { pageId: resource.id }
    }),
  list: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input: { resourceId, siteId, limit, offset } }) => {
      // Things that aren't working yet:
      // 0. Perm checking
      // 1. Last Edited user and time
      // 2. Page status(draft, published)

      return await ctx.db
        .selectFrom("Resource")
        .where("parentId", "=", String(resourceId))
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "=", ResourceType.CollectionPage)
        .orderBy("Resource.type", "asc")
        .orderBy("Resource.title", "asc")
        .limit(limit)
        .offset(offset)
        .select(defaultResourceSelect)
        .execute()
    }),
})
