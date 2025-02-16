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
  getIndexPageOutputSchema,
  getIndexPageSchema,
  getMetadataSchema,
  getParentSchema,
  listResourceSchema,
  moveSchema,
  searchOutputSchema,
  searchSchema,
  searchWithResourceIdsOutputSchema,
  searchWithResourceIdsSchema,
} from "~/schemas/resource"
import { protectedProcedure, router } from "~/server/trpc"
import { publishSite } from "../aws/codebuild.service"
import { db, ResourceState, ResourceType, sql } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import {
  definePermissionsForResource,
  validateUserPermissionsForResource,
} from "../permissions/permissions.service"
import { validateUserPermissionsForSite } from "../site/site.service"
import {
  defaultResourceSelect,
  getSearchRecentlyEdited,
  getSearchResults,
  getSearchWithResourceIds,
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
        // Step 1: Get all descendant resources
        // WHAT: Reduces number of resources we need to check in subsequent steps
        // WHY: Improves performance for large sites or folders with many (nested) descendants
        // Adds some complexity to the query, but improves performance for large sites
        .withRecursive("descendantResources", (eb) =>
          eb
            .selectFrom("Resource")
            .select(["id"])
            .where("siteId", "=", siteId)
            .$if(resourceId !== undefined, (qb) =>
              qb.where("parentId", "=", String(resourceId)),
            )
            .unionAll(
              eb
                .selectFrom("Resource as child")
                .innerJoin(
                  "descendantResources as parent",
                  "child.parentId",
                  "parent.id",
                )
                .select(["child.id"]),
            ),
        )
        // Step 2: Get publishedAt and versionId for each resource
        .withRecursive("resourcePublishedInfo", (eb) =>
          eb
            .selectFrom("Resource as r")
            .leftJoin("Version as v", "v.id", "r.publishedVersionId")
            .select([
              "r.id as id",
              "r.parentId",
              // We use "-infinity" because we do timestamp comparison later
              sql<Date>`COALESCE(
                CASE
                  -- For folders & collections, they don't have a corresponding published version so we use the updatedAt
                  -- They are also published when they are created, but we still check for the state as defensive programming
                  WHEN "r"."type" IN (${ResourceType.Folder}, ${ResourceType.Collection})
                  AND "r"."state" = ${ResourceState.Published} THEN "r"."updatedAt"
                  ELSE "v"."publishedAt"
                END,
                '-infinity'::timestamp
              )`.as("publishedAt"),
              "v.id as versionId",
            ])
            .$if(resourceId !== undefined, (fb) =>
              // If resourceId is not provided, we don't need to filter by descendantResources
              // because descendantResources will be everything in the site
              fb.where("r.id", "in", (gb) =>
                gb.selectFrom("descendantResources").select("id"),
              ),
            )
            .where("r.siteId", "=", siteId)
            .where("r.type", "not in", [
              // These resource types shouldn't be considered when computing the latest publishedAt
              ResourceType.RootPage,
              ResourceType.FolderMeta,
              ResourceType.CollectionMeta,
            ]),
        )
        // Step 3: Get the latest publishedAt and versionId for each resource from their descendants
        // - The corresponding version ID for that latest publish
        // - The ID of the resource that was published last (could be the resource itself or a descendant)
        .withRecursive("recursivePublished", (eb) =>
          eb
            .selectFrom("resourcePublishedInfo")
            .select([
              "id",
              "parentId",
              "publishedAt",
              "versionId",
              sql<string>`id`.as("latestChildId"),
            ])
            .unionAll((eb) =>
              eb
                .selectFrom("resourcePublishedInfo as p")
                .innerJoin("recursivePublished as c", "c.parentId", "p.id")
                .select([
                  "p.id",
                  "p.parentId",
                  sql<Date>`GREATEST(p."publishedAt", c."publishedAt")`.as(
                    "publishedAt",
                  ),
                  sql<string | null>`
                    CASE
                      WHEN p."publishedAt" >= c."publishedAt" THEN p."versionId"
                      ELSE c."versionId"
                    END
                  `.as("versionId"),
                  sql<string>`
                    CASE
                      WHEN p."publishedAt" >= c."publishedAt" THEN p.id
                      ELSE c."latestChildId"
                    END
                  `.as("latestChildId"),
                ]),
            ),
        )
        // Step 4: Get the latest entry for each resource
        // - Keeps only the latest published info for each resource
        // - Converts -infinity timestamps to NULL for better readability
        .withRecursive("latestEntryForEachResource", (eb) =>
          eb
            .selectFrom("recursivePublished")
            .select([
              "id",
              "versionId",
              sql<Date | null>`
                CASE
                  WHEN "publishedAt" = '-infinity'::timestamp THEN NULL
                  ELSE "publishedAt"::timestamp
                END
              `.as("publishedAt"),
            ])
            .distinctOn("id")
            .orderBy("id")
            .orderBy(sql`"publishedAt" DESC NULLS LAST`),
        )
        // Step 5: Add publisher information
        // - Get the email of the user who published each version
        // - Maintains the latest published info from previous steps
        .withRecursive("latestEntryForEachResourceWithPublisher", (eb) =>
          eb
            .selectFrom("latestEntryForEachResource as lefer")
            .leftJoin("Version", "lefer.versionId", "Version.id")
            .leftJoin("User", "Version.publishedBy", "User.id")
            .select([
              "lefer.id",
              "lefer.publishedAt",
              "User.email as publisherEmail",
            ]),
        )
        // Step 6: Final resource selection
        // - Joins the main Resource table with our computed publish info
        .selectFrom("Resource")
        .innerJoin(
          "latestEntryForEachResourceWithPublisher",
          "Resource.id",
          "latestEntryForEachResourceWithPublisher.id",
        )
        .where("Resource.siteId", "=", siteId)
        .orderBy("Resource.updatedAt", "desc")
        .orderBy("Resource.title", "asc")
        .offset(offset)
        .limit(limit)

      if (resourceId) {
        query = query.where("Resource.parentId", "=", String(resourceId))
      } else {
        query = query.where("Resource.parentId", "is", null)
      }

      return query
        .select([...defaultResourceSelect, "publishedAt", "publisherEmail"])
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
        .where("deletedAt", "is", null)

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
