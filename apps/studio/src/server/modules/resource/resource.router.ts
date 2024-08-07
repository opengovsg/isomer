import { TRPCError } from "@trpc/server"

import {
  getChildrenSchema,
  getMetadataSchema,
  listResourceSchema,
  moveSchema,
} from "~/schemas/resource"
import { protectedProcedure, router } from "~/server/trpc"
import { db } from "../database"

export const resourceRouter = router({
  getMetadataById: protectedProcedure
    .input(getMetadataSchema)
    .query(async ({ input: { resourceId } }) => {
      const resource = await db
        .selectFrom("Resource")
        .where("Resource.id", "=", String(resourceId))
        .select(["permalink", "Resource.id", "Resource.title"])
        .executeTakeFirst()

      if (!resource) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return resource
    }),

  getChildrenOf: protectedProcedure
    .input(getChildrenSchema)
    .query(async ({ input: { resourceId } }) => {
      let query = db
        .selectFrom("Resource")
        .select(["title", "permalink", "type", "id"])
        .orderBy("type", "asc")
        .orderBy("title", "asc")

      if (resourceId === null) {
        query = query.where("parentId", "is", null)
      } else {
        query = query.where("Resource.parentId", "=", String(resourceId))
      }

      return query.execute()
    }),
  move: protectedProcedure
    .input(moveSchema)
    .mutation(async ({ input: { movedResourceId, destinationResourceId } }) => {
      return await db.transaction().execute(async (tx) => {
        const parent = await tx
          .selectFrom("Resource")
          .where("id", "=", destinationResourceId)
          .select(["id", "type"])
          .executeTakeFirst()

        if (!parent || parent.type !== "Folder") {
          throw new TRPCError({ code: "BAD_REQUEST" })
        }

        if (movedResourceId === destinationResourceId) {
          throw new TRPCError({ code: "BAD_REQUEST" })
        }

        await tx
          .updateTable("Resource")
          .where("id", "=", String(movedResourceId))
          .set({ parentId: String(destinationResourceId) })
          .execute()
        return tx
          .selectFrom("Resource")
          .where("id", "=", String(movedResourceId))
          .select([
            "parentId",
            "Resource.id",
            "Resource.type",
            "Resource.permalink",
            "Resource.title",
          ])
          .executeTakeFirst()
      })
    }),
  list: protectedProcedure
    .input(listResourceSchema)
    .query(async ({ input: { siteId, resourceId } }) => {
      let query = db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)

      if (resourceId) {
        query = query.where("Resource.parentId", "=", String(resourceId))
      } else {
        query = query.where("Resource.parentId", "is", null)
      }

      return query
        .select([
          "Resource.id",
          "Resource.permalink",
          "Resource.title",
          "Resource.publishedVersionId",
          "Resource.draftBlobId",
          "Resource.type",
        ])
        .execute()
    }),
})
