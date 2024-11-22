import { TRPCError } from "@trpc/server"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import { get } from "lodash"
import { z } from "zod"

import type { PermissionsProps } from "../permissions/permissions.type"
import {
  countResourceSchema,
  deleteResourceSchema,
  getAncestrySchema,
  getChildrenSchema,
  getFullPermalinkSchema,
  getMetadataSchema,
  getParentSchema,
  listResourceSchema,
  moveSchema,
  searchOutputSchema,
  searchSchema,
} from "~/schemas/resource"
import { protectedProcedure, router } from "~/server/trpc"
import { publishSite } from "../aws/codebuild.service"
import { db, ResourceType } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import {
  definePermissionsForResource,
  validateUserPermissionsForResource,
} from "../permissions/permissions.service"
import { validateUserPermissionsForSite } from "../site/site.service"
import {
  getSearchRecentlyEdited,
  getSearchResults,
  getWithFullPermalink,
} from "./resource.service"

const fetchResource = async (resourceId: string | null) => {
  if (resourceId === null) return { parentId: null }

  const resource = await db
    .selectFrom("Resource")
    .where("Resource.id", "=", resourceId)
    .select("parentId")
    // NOTE: if we don't have a resource,
    // this means that they tried to fetch a resource that cannot be found
    .executeTakeFirst()

  if (!resource) {
    throw new TRPCError({ code: "BAD_REQUEST" })
  }

  return resource
}

const validateUserPermissionsForMove = async ({
  from,
  to,
  ...rest
}: Omit<PermissionsProps, "resourceId"> & {
  from: string
  to: string | null
}) => {
  // TODO: this is using site wide permissions for now
  // we should fetch the oldest `parent` of this resource eventually.
  // Putting this in here first because eventually we'll have to lookup both
  // even though for now they are the same thing
  const permsFrom = await definePermissionsForResource({
    ...rest,
    resourceId: null,
  })
  const permsTo = await definePermissionsForResource({
    ...rest,
    resourceId: null,
  })

  const resourceFrom = await fetchResource(from)

  return (
    // NOTE: This is because we want to check whether we can move to within `to`
    // and hence, the parent id is `to`
    permsFrom.can("move", resourceFrom) && permsTo.can("move", { parentId: to })
  )
}

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
      // Validate site and resourceId exists and is a Folder
      if (resourceId !== null) {
        const resource = await db
          .selectFrom("Resource")
          .where("siteId", "=", Number(siteId))
          .where("id", "=", String(resourceId))
          .where("Resource.type", "=", ResourceType.Folder)
          .executeTakeFirst()

        if (!resource) {
          throw new TRPCError({ code: "NOT_FOUND" })
        }
      }

      let query = db
        .selectFrom("Resource")
        .select(["title", "permalink", "type", "id"])
        .where("Resource.type", "in", [ResourceType.Folder])
        .where("Resource.siteId", "=", Number(siteId))
        .$narrowType<{
          type: typeof ResourceType.Folder
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
      // Validate site and resourceId exists and is a folder
      if (resourceId !== null) {
        const resource = await db
          .selectFrom("Resource")
          .where("siteId", "=", Number(siteId))
          .where("id", "=", String(resourceId))
          .where("Resource.type", "in", [
            ResourceType.RootPage,
            ResourceType.Collection,
            ResourceType.Folder,
          ])
          .executeTakeFirst()

        if (!resource) {
          throw new TRPCError({ code: "NOT_FOUND" })
        }
      }
      let query = db
        .selectFrom("Resource")
        .select(["title", "permalink", "type", "id"])
        .where("Resource.type", "!=", ResourceType.RootPage)
        .where("Resource.type", "!=", ResourceType.FolderMeta)
        .where("Resource.siteId", "=", Number(siteId))
        .$narrowType<{
          type: Extract<
            | typeof ResourceType.Folder
            | typeof ResourceType.Page
            | typeof ResourceType.Collection
            | typeof ResourceType.CollectionPage
            | typeof ResourceType.CollectionLink,
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
    .mutation(
      async ({
        ctx,
        input: { siteId, movedResourceId, destinationResourceId },
      }) => {
        const isValid = await validateUserPermissionsForMove({
          from: movedResourceId,
          to: destinationResourceId,
          userId: ctx.user.id,
          siteId,
        })

        if (!isValid) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Please ensure that you have the required permissions to perform a move!",
          })
        }

        const result = await db
          .transaction()
          .execute(async (tx) => {
            const toMove = await tx
              .selectFrom("Resource")
              .where("id", "=", movedResourceId)
              .select(["id", "siteId"])
              .executeTakeFirst()

            if (!toMove) {
              throw new TRPCError({ code: "BAD_REQUEST" })
            }

            let query = tx.selectFrom("Resource")
            query = !!destinationResourceId
              ? query.where("id", "=", destinationResourceId)
              : query.where("type", "=", ResourceType.RootPage)
            const parent = await query
              .select(["id", "type", "siteId"])
              .executeTakeFirst()

            if (
              !parent ||
              // NOTE: we only allow moves to folders/root.
              // for moves to root, we only allow this for admin
              (parent.type !== ResourceType.RootPage &&
                parent.type !== ResourceType.Folder)
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Please ensure that you are trying to move your resource into a valid destination",
              })
            }

            if (movedResourceId === destinationResourceId) {
              throw new TRPCError({ code: "BAD_REQUEST" })
            }

            if (toMove.siteId !== parent.siteId) {
              throw new TRPCError({ code: "FORBIDDEN" })
            }

            await tx
              .updateTable("Resource")
              .where("id", "=", String(movedResourceId))
              .where("Resource.type", "in", [
                ResourceType.Page,
                ResourceType.Folder,
              ])
              .set({
                parentId: !!destinationResourceId
                  ? String(destinationResourceId)
                  : null,
              })
              .execute()

            return tx
              .selectFrom("Resource")
              .where("id", "=", String(movedResourceId))
              .select([
                "Resource.siteId",
                "Resource.parentId",
                "Resource.id",
                "Resource.type",
                "Resource.permalink",
                "Resource.title",
              ])
              .executeTakeFirst()
          })
          .catch((err) => {
            if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
              })
            }
            throw err
          })

        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND" })
        }

        await publishSite(ctx.logger, result.siteId)
        return result
      },
    ),

  countWithoutRoot: protectedProcedure
    .input(countResourceSchema)
    .query(async ({ input: { siteId, resourceId } }) => {
      // TODO(perf): If too slow, consider caching this count, but 4-5 million rows should be fine
      let query = db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "!=", ResourceType.RootPage)
        .where("Resource.type", "!=", ResourceType.FolderMeta)
        .select((eb) => [eb.fn.countAll().as("totalCount")])

      if (resourceId) {
        query = query.where("Resource.parentId", "=", String(resourceId))
      } else {
        query = query.where("Resource.parentId", "is", null)
      }

      const result = await query.executeTakeFirst()
      return Number(result?.totalCount ?? 0)
    }),

  listWithoutRoot: protectedProcedure
    .input(listResourceSchema)
    .query(async ({ input: { siteId, resourceId, offset, limit } }) => {
      let query = db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "!=", ResourceType.RootPage)
        .where("Resource.type", "!=", ResourceType.FolderMeta)
        .orderBy("Resource.updatedAt", "desc")
        .orderBy("Resource.title", "asc")
        .offset(offset)
        .limit(limit)

      if (resourceId) {
        query = query.where("Resource.parentId", "=", String(resourceId))
      } else {
        query = query.where("Resource.parentId", "is", null)
      }

      // TODO: Add pagination support
      return query
        .select([
          "Resource.id",
          "Resource.permalink",
          "Resource.title",
          "Resource.publishedVersionId",
          "Resource.draftBlobId",
          "Resource.type",
          "Resource.parentId",
          "Resource.updatedAt",
        ])
        .execute()
    }),

  delete: protectedProcedure
    .input(deleteResourceSchema)
    .mutation(async ({ ctx, input: { siteId, resourceId } }) => {
      await validateUserPermissionsForResource({
        action: "delete",
        userId: ctx.user.id,
        siteId,
        resourceId,
      })

      const result = await db
        .deleteFrom("Resource")
        .where("Resource.id", "=", String(resourceId))
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "!=", ResourceType.RootPage)
        .executeTakeFirst()

      if (Number(result.numDeletedRows) === 0) {
        throw new TRPCError({ code: "BAD_REQUEST" })
      }

      await publishSite(ctx.logger, siteId)

      // NOTE: We need to do this cast as the property is a `bigint`
      // and trpc cannot serialise it, which leads to errors
      return Number(result.numDeletedRows)
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
        .executeTakeFirst()

      if (!resource) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return resource
    }),

  getWithFullPermalink: protectedProcedure
    .input(getFullPermalinkSchema)
    .query(async ({ input: { resourceId } }) => {
      const result = await getWithFullPermalink({ resourceId })

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return result
    }),

  getRolesFor: protectedProcedure
    .input(
      z.object({
        resourceId: z.string().nullable(),
        siteId: z.number(),
      }),
    )
    .query(({ ctx, input: { resourceId, siteId } }) => {
      const query = db
        .selectFrom("ResourcePermission")
        .where("userId", "=", ctx.user.id)
        .where("siteId", "=", siteId)

      if (!resourceId) {
        query.where("resourceId", "is", null)
      } else query.where("resourceId", "=", resourceId)

      return query.select(["role"]).execute()
    }),

  getAncestryOf: protectedProcedure
    .input(getAncestrySchema)
    .query(async ({ input: { siteId, resourceId } }) => {
      if (!resourceId) {
        return []
      }

      const ancestors = await db
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

      return ancestors.reverse().slice(0, -1)
    }),

  search: protectedProcedure
    .input(searchSchema)
    .output(searchOutputSchema)
    .query(
      async ({ ctx, input: { siteId, query = "", cursor: offset, limit } }) => {
        await validateUserPermissionsForSite({
          siteId: Number(siteId),
          userId: ctx.user.id,
          action: "read",
        })

        // check if the query is only whitespaces (including multiple spaces)
        if (query.trim() === "") {
          return {
            totalCount: null,
            resources: [],
            recentlyEdited: await getSearchRecentlyEdited({
              siteId: Number(siteId),
            }),
          }
        }

        const searchResults = await getSearchResults({
          siteId: Number(siteId),
          query,
          offset,
          limit,
        })
        return {
          totalCount: Number(searchResults.totalCount),
          resources: searchResults.resources,
          recentlyEdited: [],
        }
      },
    ),
})
