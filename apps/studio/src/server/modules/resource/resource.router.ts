import { TRPCError } from "@trpc/server"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import get from "lodash/get"
import { z } from "zod"

import type { PermissionsProps } from "../permissions/permissions.type"
import {
  countResourceSchema,
  deleteResourceSchema,
  getAncestryStackOutputSchema,
  getAncestryStackSchema,
  getBatchAncestryWithSelfOutputSchema,
  getBatchAncestryWithSelfSchema,
  getChildrenOutputSchema,
  getChildrenSchema,
  getFullPermalinkSchema,
  getIndexPageOutputSchema,
  getIndexPageSchema,
  getMetadataSchema,
  getNestedFolderChildrenOutputSchema,
  getNestedFolderChildrenSchema,
  getParentSchema,
  listResourceSchema,
  moveSchema,
  searchOutputSchema,
  searchSchema,
  searchWithResourceIdsOutputSchema,
  searchWithResourceIdsSchema,
} from "~/schemas/resource"
import { protectedProcedure, router } from "~/server/trpc"
import { logResourceEvent } from "../audit/audit.service"
import { db, ResourceType } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import {
  definePermissionsForResource,
  validateUserPermissionsForResource,
} from "../permissions/permissions.service"
import { validateUserPermissionsForSite } from "../site/site.service"
import {
  defaultResourceSelect,
  getBatchAncestryWithSelfQuery,
  getSearchRecentlyEdited,
  getSearchResults,
  getSearchWithResourceIds,
  getWithFullPermalink,
  publishResource,
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
    .output(getChildrenOutputSchema)
    .query(async ({ input: { siteId, resourceId, cursor: offset, limit } }) => {
      // Validate site and resourceId exists and is a Folder
      if (resourceId !== null) {
        const resource = await db
          .selectFrom("Resource")
          .where("siteId", "=", Number(siteId))
          .where("id", "=", String(resourceId))
          .where("Resource.type", "in", [
            ResourceType.Folder,
            ResourceType.Collection,
          ])
          .executeTakeFirst()

        if (!resource) {
          throw new TRPCError({ code: "NOT_FOUND" })
        }
      }

      let query = db
        .selectFrom("Resource")
        .select(["title", "permalink", "type", "id", "parentId"])
        .where("Resource.type", "in", [
          ResourceType.Folder,
          ResourceType.Collection,
        ])
        .where("Resource.siteId", "=", Number(siteId))
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
    .output(getChildrenOutputSchema)
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
        .select(["title", "permalink", "type", "id", "parentId"])
        .where("Resource.type", "!=", ResourceType.RootPage)
        .where("Resource.type", "!=", ResourceType.FolderMeta)
        .where("Resource.type", "!=", ResourceType.CollectionMeta)
        .where("Resource.siteId", "=", Number(siteId))
        .$narrowType<{
          type: Exclude<
            ResourceType,
            | typeof ResourceType.RootPage
            | typeof ResourceType.FolderMeta
            | typeof ResourceType.CollectionMeta
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

  getNestedFolderChildrenOf: protectedProcedure
    .input(getNestedFolderChildrenSchema)
    .output(getNestedFolderChildrenOutputSchema)
    .query(async ({ ctx, input: { resourceId, siteId } }) => {
      await validateUserPermissionsForSite({
        siteId: Number(siteId),
        userId: ctx.user.id,
        action: "read",
      })

      const resource = await db
        .selectFrom("Resource")
        .where("siteId", "=", Number(siteId))
        .where("id", "=", String(resourceId))
        .where("Resource.type", "=", ResourceType.Folder)
        .executeTakeFirst()

      if (!resource) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return {
        items: await db
          .withRecursive("NestedResources", (eb) =>
            eb
              .selectFrom("Resource")
              .select(["title", "permalink", "type", "id", "parentId"])
              .where("Resource.type", "in", [ResourceType.Folder])
              .where("Resource.siteId", "=", Number(siteId))
              .where("Resource.parentId", "=", String(resourceId))
              .unionAll((eb) =>
                eb
                  .selectFrom("Resource")
                  .innerJoin(
                    "NestedResources",
                    "Resource.parentId",
                    "NestedResources.id",
                  )
                  .select([
                    "Resource.title",
                    "Resource.permalink",
                    "Resource.type",
                    "Resource.id",
                    "Resource.parentId",
                  ]),
              ),
          )
          .selectFrom("NestedResources")
          .select(["title", "permalink", "type", "id", "parentId"])
          .execute(),
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

        const user = await db
          .selectFrom("User")
          .selectAll()
          .where("id", "=", ctx.user.id)
          .executeTakeFirstOrThrow(
            () =>
              new TRPCError({
                code: "BAD_REQUEST",
                message: "Please ensure that you are logged in",
              }),
          )

        const result = await db
          .transaction()
          .execute(async (tx) => {
            const toMove = await tx
              .selectFrom("Resource")
              .where("id", "=", movedResourceId)
              .selectAll()
              .executeTakeFirst()

            if (!toMove) {
              throw new TRPCError({ code: "BAD_REQUEST" })
            }

            let query = tx.selectFrom("Resource")
            query = !!destinationResourceId
              ? query.where("id", "=", destinationResourceId)
              : query
                  .where("type", "=", ResourceType.RootPage)
                  .where("siteId", "=", siteId)
            const parent = await query
              .select(["id", "type", "siteId"])
              .executeTakeFirst()

            if (
              !parent ||
              // NOTE: we only allow moves to folders/root.
              // for moves to root, we only allow this for admin
              (parent.type !== ResourceType.RootPage &&
                parent.type !== ResourceType.Folder &&
                parent.type !== ResourceType.Collection)
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Please ensure that you are trying to move your resource into a valid destination",
              })
            }

            if (toMove.parentId === parent.id) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "You cannot move a resource to the same folder",
              })
            }

            // NOTE: If the users are trying to move into a collection,
            // check that the resource first belongs to a collection
            if (
              parent.type !== ResourceType.Collection &&
              (toMove.type === ResourceType.CollectionPage ||
                toMove.type === ResourceType.CollectionLink)
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Collection items can only be moved to another collection",
              })
            }

            if (
              parent.type === ResourceType.Collection &&
              toMove.type !== ResourceType.CollectionPage &&
              toMove.type !== ResourceType.CollectionLink
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Folder items can only be moved to another folder",
              })
            }

            if (movedResourceId === destinationResourceId) {
              throw new TRPCError({ code: "BAD_REQUEST" })
            }

            if (toMove.siteId !== parent.siteId) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "You cannot move a resource to a different site",
              })
            }

            await tx
              .updateTable("Resource")
              .where("id", "=", String(movedResourceId))
              .where("Resource.type", "in", [
                ResourceType.Page,
                ResourceType.CollectionPage,
                ResourceType.Folder,
                ResourceType.CollectionLink,
              ])
              .set({
                parentId: !!destinationResourceId
                  ? String(destinationResourceId)
                  : null,
              })
              .execute()

            const moved = await tx
              .selectFrom("Resource")
              .where("id", "=", movedResourceId)
              .select(defaultResourceSelect)
              .executeTakeFirst()

            // NOTE: this is technically impossible because we're executing
            // inside a tx and this is the same resource which was fetched earlier
            if (!moved) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message:
                  "Something went wrong while attempting to move your resource, please try again later",
              })
            }

            await logResourceEvent(tx, {
              siteId,
              eventType: "ResourceUpdate",
              delta: { before: toMove, after: moved },
              by: user,
            })

            return moved
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

        await publishResource(user.id, result, ctx.logger)
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
        .where("Resource.type", "!=", ResourceType.IndexPage)
        .where("Resource.type", "!=", ResourceType.FolderMeta)
        .where("Resource.type", "!=", ResourceType.CollectionMeta)
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
        .where("Resource.type", "!=", ResourceType.IndexPage)
        .where("Resource.type", "!=", ResourceType.FolderMeta)
        .where("Resource.type", "!=", ResourceType.CollectionMeta)
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

      const user = await db
        .selectFrom("User")
        .selectAll()
        .where("id", "=", ctx.user.id)
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "BAD_REQUEST",
              message: "Please ensure that you are logged in",
            }),
        )

      const result = await db.transaction().execute(async (tx) => {
        const before = await tx
          .selectFrom("Resource")
          .where("id", "=", resourceId)
          .select(defaultResourceSelect)
          .executeTakeFirst()

        if (!before) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The resource to be deleted could not be found",
          })
        }

        await logResourceEvent(tx, {
          siteId,
          delta: {
            after: null,
            before,
          },
          by: user,
          eventType: "ResourceDelete",
        })

        return tx
          .deleteFrom("Resource")
          .where("Resource.id", "=", String(resourceId))
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "!=", ResourceType.RootPage)
          .returningAll()
          .executeTakeFirst()
      })

      if (!result) {
        throw new TRPCError({ code: "BAD_REQUEST" })
      }

      await publishResource(user.id, result, ctx.logger)

      // NOTE: We need to do this cast as the property is a `bigint`
      // and trpc cannot serialise it, which leads to errors
      return result
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
        .where("deletedAt", "is", null)

      if (!resourceId) {
        query.where("resourceId", "is", null)
      } else query.where("resourceId", "=", resourceId)

      return query.select(["role"]).execute()
    }),

  getAncestryStack: protectedProcedure
    .input(getAncestryStackSchema)
    .output(getAncestryStackOutputSchema)
    .query(async ({ input: { siteId, resourceId, includeSelf } }) => {
      if (!resourceId) {
        return []
      }
      const batchAncestry = await getBatchAncestryWithSelfQuery({
        siteId: Number(siteId),
        resourceIds: [resourceId],
      })
      return includeSelf
        ? (batchAncestry[0] ?? [])
        : (batchAncestry[0]?.slice(0, -1) ?? [])
    }),

  getBatchAncestryWithSelf: protectedProcedure
    .input(getBatchAncestryWithSelfSchema)
    .output(getBatchAncestryWithSelfOutputSchema)
    .query(async ({ input: { siteId, resourceIds } }) => {
      if (resourceIds.length === 0) {
        return []
      }
      return await getBatchAncestryWithSelfQuery({
        siteId: Number(siteId),
        resourceIds,
      })
    }),

  search: protectedProcedure
    .input(searchSchema)
    .output(searchOutputSchema)
    .query(
      async ({
        ctx,
        input: { siteId, query, resourceTypes, cursor: offset, limit },
      }) => {
        await validateUserPermissionsForSite({
          siteId: Number(siteId),
          userId: ctx.user.id,
          action: "read",
        })

        if (!query) {
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
          resourceTypes,
        })
        return {
          totalCount: Number(searchResults.totalCount),
          resources: searchResults.resources,
          recentlyEdited: [],
        }
      },
    ),

  searchWithResourceIds: protectedProcedure
    .input(searchWithResourceIdsSchema)
    .output(searchWithResourceIdsOutputSchema)
    .query(async ({ input: { siteId, resourceIds } }) => {
      if (resourceIds.length === 0) {
        return []
      }
      return (
        await getSearchWithResourceIds({
          siteId: Number(siteId),
          resourceIds,
        })
      ).sort(
        // Sort resources to match order of input resourceIds
        (a, b) => resourceIds.indexOf(a.id) - resourceIds.indexOf(b.id),
      )
    }),

  getIndexPage: protectedProcedure
    .input(getIndexPageSchema)
    .output(getIndexPageOutputSchema)
    .query(async ({ input: { siteId, parentId } }) => {
      const parent = await db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.parentId", "=", parentId)
        .where("Resource.type", "=", ResourceType.IndexPage)
        .select(["Resource.id"])
        .executeTakeFirst()

      if (!parent) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return parent
    }),
})
