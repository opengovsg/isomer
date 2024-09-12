import { TRPCError } from "@trpc/server"
import { jsonObjectFrom } from "kysely/helpers/postgres"

import type { ResourceType } from "../database"
import {
  countResourceSchema,
  deleteResourceSchema,
  getAncentrySchema,
  getChildrenSchema,
  getFullPermalinkSchema,
  getMetadataSchema,
  getParentSchema,
  listResourceSchema,
  moveSchema,
} from "~/schemas/resource"
import { protectedProcedure, router } from "~/server/trpc"
import { db, sql } from "../database"

export const resourceRouter = router({
  getMetadataById: protectedProcedure
    .input(getMetadataSchema)
    .query(async ({ input: { resourceId } }) => {
      const resource = await db
        .selectFrom("Resource")
        .where("Resource.id", "=", String(resourceId))
        .select([
          "Resource.id",
          "Resource.type",
          "Resource.title",
          "Resource.permalink",
          "Resource.parentId",
        ])
        .executeTakeFirst()

      if (!resource) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return resource
    }),
  getFolderChildrenOf: protectedProcedure
    .input(getChildrenSchema)
    .query(async ({ input: { siteId, resourceId, cursor: offset, limit } }) => {
      let query = db
        .selectFrom("Resource")
        .select(["title", "permalink", "type", "id"])
        .where("Resource.type", "in", ["Folder"])
        .where("Resource.siteId", "=", Number(siteId))
        .$narrowType<{
          type: "Folder"
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
          .where("Resource.type", "in", ["Page", "Folder"])
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
          "Resource.parentId",
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

  getParentOf: protectedProcedure
    .input(getParentSchema)
    .query(async ({ input: { siteId, resourceId } }) => {
      const resource = await db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.id", "=", resourceId)
        .select(["Resource.type", "Resource.id", "Resource.title"])
        .select((eb) =>
          jsonObjectFrom(
            eb
              .selectFrom("Resource")
              .innerJoin("Resource as parent", "parent.id", "Resource.parentId")
              .where("Resource.id", "=", resourceId)
              .where("parent.id", "is not", null)
              .select([
                "parent.type",
                "parent.id",
                "parent.parentId",
                "parent.title",
              ]),
          ).as("parent"),
        )
        .executeTakeFirstOrThrow()

      return {
        resource,
      }
    }),

  getWithFullPermalink: protectedProcedure
    .input(getFullPermalinkSchema)
    .query(async ({ input: { resourceId } }) => {
      return db
        .withRecursive("resourcePath", (eb) =>
          eb
            .selectFrom("Resource as r")
            .select([
              "r.id",
              "r.title",
              "r.permalink",
              "r.parentId",
              "r.permalink as fullPermalink",
            ])
            .where("r.parentId", "is", null)
            .unionAll(
              eb
                .selectFrom("Resource as s")
                .innerJoin("resourcePath as rp", "s.parentId", "rp.id")
                .select([
                  "s.id",
                  "s.title",
                  "s.permalink",
                  "s.parentId",
                  sql<string>`CONCAT(rp."fullPermalink", '/', s.permalink)`.as(
                    "fullPermalink",
                  ),
                ]),
            ),
        )
        .selectFrom("resourcePath as rp")
        .select(["rp.id", "rp.title", "rp.fullPermalink"])
        .where("rp.id", "=", resourceId)
        .executeTakeFirst()
    }),

  getAncestryOf: protectedProcedure
    .input(getAncentrySchema)
    .query(async ({ input: { siteId, resourceId } }) => {
      if (!resourceId) {
        return []
      }

      return db
        .withRecursive("Resources", (eb) =>
          eb
            .selectFrom("Resource")
            .select([
              "Resource.id",
              "Resource.title",
              "Resource.permalink",
              "Resource.parentId",
            ])
            .where("Resource.siteId", "=", Number(siteId))
            .where("Resource.id", "=", resourceId)
            .unionAll(
              eb
                .selectFrom("Resource")
                .innerJoin("Resources", "Resources.parentId", "Resource.id")
                .select([
                  "Resource.id",
                  "Resource.title",
                  "Resource.permalink",
                  "Resource.parentId",
                ]),
            ),
        )
        .selectFrom("Resources")
        .select([
          "Resources.id",
          "Resources.title",
          "Resources.permalink",
          "Resources.parentId",
        ])
        .execute()
    }),
})
