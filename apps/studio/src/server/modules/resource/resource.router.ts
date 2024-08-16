import { TRPCError } from "@trpc/server"

import type { ResourceType } from "../database"
import {
  countResourceSchema,
  deleteResourceSchema,
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
  getFolderChildrenOf: protectedProcedure
    .input(getChildrenSchema)
    .query(async ({ input: { resourceId, cursor: offset, limit } }) => {
      let query = db
        .selectFrom("Resource")
        .select(["title", "permalink", "type", "id"])
        .where("Resource.type", "in", ["RootPage", "Folder"])
        .$narrowType<{
          type: "Folder" | "RootPage"
        }>()
        .orderBy("type", "asc")
        .orderBy("title", "asc")
        .offset(offset)
        .limit(limit + 1)
      if (resourceId === null) {
        query = query.where("parentId", "is", null)
      } else {
        query = query.where("Resource.parentId", "=", String(resourceId))
      }

      const result = await query.execute()
      if (result.length > limit) {
        // Dont' return the last element, it's just for checking if there are more
        result.pop()
        return {
          items: result,
          nextOffset: offset + limit,
        }
      }
      return {
        items: result,
        nextOffset: null,
      }
    }),
  getChildrenOf: protectedProcedure
    .input(getChildrenSchema)
    .query(async ({ input: { resourceId, siteId, cursor: offset, limit } }) => {
      let query = db
        .selectFrom("Resource")
        .select(["title", "permalink", "type", "id"])
        .where("Resource.type", "!=", "RootPage")
        .where("Resource.siteId", "=", Number(siteId))
        .$narrowType<{
          type: Extract<
            "Folder" | "Page" | "Collection" | "CollectionPage",
            ResourceType
          >
        }>()
        .orderBy("type", "asc")
        .orderBy("title", "asc")
        .offset(offset)
        .limit(limit + 1)

      if (resourceId === null) {
        query = query.where("parentId", "is", null)
      } else {
        query = query.where("Resource.parentId", "=", String(resourceId))
      }

      const result = await query.execute()
      if (result.length > limit) {
        // Dont' return the last element, it's just for checking if there are more
        result.pop()
        return {
          items: result,
          nextOffset: offset + limit,
        }
      }
      return {
        items: result,
        nextOffset: null,
      }
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
  countWithoutRoot: protectedProcedure
    .input(countResourceSchema)
    .query(async ({ input: { siteId, resourceId } }) => {
      // TODO(perf): If too slow, consider caching this count, but 4-5 million rows should be fine
      let query = db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "!=", "RootPage")

      if (resourceId) {
        query = query.where("Resource.parentId", "=", String(resourceId))
      } else {
        query = query.where("Resource.parentId", "is", null)
      }

      const result = await query
        .select((eb) => [eb.fn.countAll().as("totalCount")])
        .executeTakeFirst()
      return Number(result?.totalCount ?? 0)
    }),
  listWithoutRoot: protectedProcedure
    .input(listResourceSchema)
    .query(async ({ input: { siteId, resourceId, offset, limit } }) => {
      let query = db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "!=", "RootPage")
        .offset(offset)
        .limit(limit)

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
  delete: protectedProcedure
    .input(deleteResourceSchema)
    .mutation(async ({ input: { siteId, resourceId } }) => {
      const result = await db
        .deleteFrom("Resource")
        .where("Resource.id", "=", String(resourceId))
        .where("Resource.siteId", "=", siteId)
        .executeTakeFirst()
      // NOTE: We need to do this `toString` as the property is a `bigint`
      // and trpc cannot serialise it, which leads to errors
      return result.numDeletedRows.toString()
    }),
})
