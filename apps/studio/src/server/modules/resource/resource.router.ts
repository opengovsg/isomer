import { TRPCError } from "@trpc/server"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import { get } from "lodash-es"
import { USER_LINKABLE_RESOURCE_TYPES } from "~/constants/resources"
import { SEARCH_PAGE_PERMALINK } from "~/constants/sitemap"
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
  getRolesForSchema,
  listResourceSchema,
  moveSchema,
  searchOutputSchema,
  searchSchema,
  searchWithResourceIdsOutputSchema,
  searchWithResourceIdsSchema,
} from "~/schemas/resource"
import { protectedProcedure, router } from "~/server/trpc"
import { isResourceMoveValid } from "~/utils/resources"
import { hasNonEmptyString, isDefinedNumber } from "~/utils/truthiness"
import { AuditLogEvent } from "~prisma/generated/generatedEnums"

import type { PermissionsProps } from "../permissions/permissions.type"
import { logResourceEvent } from "../audit/audit.service"
import { PG_ERROR_CODES } from "../database/constants"
import { db } from "../database/database"
import { ResourceType } from "../database/types"
import {
  bulkValidateUserPermissionsForResources,
  definePermissionsForResource,
  getResourcePermission,
} from "../permissions/permissions.service"
import {
  applyFolderPermalinkChangeRedirects,
  applyPermalinkChangeRedirects,
  softDeleteRedirectsPointingToResource,
} from "../redirect/redirect.service"
import { validateUserPermissionsForSite } from "../site/site.service"
import {
  applyResourceOrderBy,
  defaultResourceSelect,
  getBatchAncestryWithSelfQuery,
  getResourceFullPermalink,
  getSearchRecentlyEdited,
  getSearchResults,
  getSearchWithResourceIds,
  getWithFullPermalink,
  hasPublishedDescendant,
  publishResource,
} from "./resource.service"

const fetchResource = async (resourceId: string | null) => {
  if (resourceId === null) {
    return { parentId: null }
  }

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
  // Deferred: this is using site wide permissions for now
  // we should fetch the oldest `parent` of this resource eventually.
  // Putting this in here first because eventually we'll have to lookup both
  // even though for now they are the same thing
  const [permsFrom, permsTo, resourceFrom] = await Promise.all([
    definePermissionsForResource({
      ...rest,
      resourceId: null,
    }),
    definePermissionsForResource({
      ...rest,
      resourceId: null,
    }),
    fetchResource(from),
  ])

  return (
    // NOTE: This is because we want to check whether we can move to within `to`
    // and hence, the parent id is `to`
    permsFrom.can("move", resourceFrom) && permsTo.can("move", { parentId: to })
  )
}

export const resourceRouter = router({
  countWithoutRoot: protectedProcedure
    .input(countResourceSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        resourceIds: [isDefinedNumber(resourceId) ? String(resourceId) : null],
        siteId,
        userId: ctx.user.id,
      })

      // Throw not found if the provided resourceId does not exist
      if (isDefinedNumber(resourceId)) {
        await db
          .selectFrom("Resource")
          .where("id", "=", String(resourceId))
          .select("type")
          .executeTakeFirstOrThrow(
            () =>
              new TRPCError({
                code: "NOT_FOUND",
                message: "Resource not found",
              }),
          )
      }

      // Deferred(perf): If too slow, consider caching this count, but 4-5 million rows should be fine
      let query = db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "!=", ResourceType.RootPage)
        .where("Resource.type", "!=", ResourceType.FolderMeta)
        .where("Resource.type", "!=", ResourceType.CollectionMeta)
        .where("Resource.type", "!=", ResourceType.IndexPage)
        .select((eb) => [eb.fn.countAll().as("totalCount")])

      query = isDefinedNumber(resourceId)
        ? query.where("Resource.parentId", "=", String(resourceId))
        : query
            .where("Resource.parentId", "is", null)
            .where("Resource.permalink", "!=", SEARCH_PAGE_PERMALINK)

      const result = await query.executeTakeFirst()
      return Number(result?.totalCount ?? 0)
    }),

  delete: protectedProcedure
    .input(deleteResourceSchema)
    .mutation(async ({ ctx, input: { siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "delete",
        resourceIds: [resourceId],
        siteId,
        userId: ctx.user.id,
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
          .where("siteId", "=", siteId)
          .where("id", "=", resourceId)
          .select(defaultResourceSelect)
          .executeTakeFirst()

        if (!before) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The resource to be deleted could not be found",
          })
        }

        // Prevent users from deleting the search page (permalink /search, no parent)
        // This is a special page that is used to display the SearchSG results
        if (
          before.permalink === SEARCH_PAGE_PERMALINK &&
          before.parentId === null
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The search page cannot be deleted",
          })
        }

        await logResourceEvent(tx, {
          by: user,
          delta: {
            after: null,
            before,
          },
          eventType: AuditLogEvent.ResourceDelete,
          siteId,
        })

        // Soft-delete redirects pointing at this resource (or any descendant)
        // in the same transaction — once the page is gone they resolve to
        // nothing. Run before the delete while the subtree is still resolvable;
        // the delete's site publish covers the removal.
        await softDeleteRedirectsPointingToResource(tx, {
          byUserId: user.id,
          resourceId,
          siteId,
        })

        return await tx
          .deleteFrom("Resource")
          .where("Resource.id", "=", resourceId)
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

  getAncestryStack: protectedProcedure
    .input(getAncestryStackSchema)
    .output(getAncestryStackOutputSchema)
    .query(async ({ ctx, input: { siteId, resourceId, includeSelf } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        resourceIds: [resourceId ?? null],
        siteId,
        userId: ctx.user.id,
      })

      if (!hasNonEmptyString(resourceId)) {
        return []
      }
      const batchAncestry = await getBatchAncestryWithSelfQuery({
        resourceIds: [resourceId],
        siteId,
      })
      return includeSelf
        ? (batchAncestry[0] ?? [])
        : (batchAncestry[0]?.slice(0, -1) ?? [])
    }),

  getBatchAncestryWithSelf: protectedProcedure
    .input(getBatchAncestryWithSelfSchema)
    .output(getBatchAncestryWithSelfOutputSchema)
    .query(async ({ ctx, input: { siteId, resourceIds } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        resourceIds: resourceIds.map((id) => id ?? null),
        siteId,
        userId: ctx.user.id,
      })

      if (resourceIds.length === 0) {
        return []
      }
      return await getBatchAncestryWithSelfQuery({
        resourceIds,
        siteId,
      })
    }),

  getChildrenOf: protectedProcedure
    .input(getChildrenSchema)
    .output(getChildrenOutputSchema)
    .query(
      async ({
        ctx,
        input: { resourceId, siteId, cursor: offset, limit, includeSearchPage },
      }) => {
        await bulkValidateUserPermissionsForResources({
          action: "read",
          resourceIds: [resourceId],
          siteId,
          userId: ctx.user.id,
        })

        // Validate site and resourceId exists and is a folder
        if (resourceId !== null) {
          const resource = await db
            .selectFrom("Resource")
            .where("siteId", "=", siteId)
            .where("id", "=", resourceId)
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
          .where("Resource.type", "in", USER_LINKABLE_RESOURCE_TYPES)
          .where("Resource.siteId", "=", siteId)
          .$narrowType<{
            type: (typeof USER_LINKABLE_RESOURCE_TYPES)[number]
          }>()
          .orderBy("type", "asc")
          .orderBy("title", "asc")
          .offset(offset)
          .limit(limit + 1)

        if (resourceId === null) {
          query = query.where("parentId", "is", null)
          if (!includeSearchPage) {
            query = query.where(
              "Resource.permalink",
              "!=",
              SEARCH_PAGE_PERMALINK,
            )
          }
        } else {
          query = query.where("Resource.parentId", "=", resourceId)
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
      },
    ),

  getFolderChildrenOf: protectedProcedure
    .input(getChildrenSchema)
    .output(getChildrenOutputSchema)
    .query(
      async ({ ctx, input: { siteId, resourceId, cursor: offset, limit } }) => {
        await bulkValidateUserPermissionsForResources({
          action: "read",
          resourceIds: [resourceId],
          siteId,
          userId: ctx.user.id,
        })

        // Validate site and resourceId exists and is a Folder
        if (resourceId !== null) {
          const resource = await db
            .selectFrom("Resource")
            .where("siteId", "=", siteId)
            .where("id", "=", resourceId)
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
          .where("Resource.siteId", "=", siteId)
          .orderBy("type", "asc")
          .orderBy("title", "asc")
          .offset(offset)
          .limit(limit + 1)
        query =
          resourceId === null
            ? query.where("parentId", "is", null)
            : query.where("Resource.parentId", "=", resourceId)

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
      },
    ),

  getIndexPage: protectedProcedure
    .input(getIndexPageSchema)
    .output(getIndexPageOutputSchema)
    .query(async ({ ctx, input: { siteId, parentId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        resourceIds: [parentId],
        siteId,
        userId: ctx.user.id,
      })

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

  getMetadataById: protectedProcedure
    .input(getMetadataSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        resourceIds: [resourceId],
        siteId,
        userId: ctx.user.id,
      })

      const resource = await db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.id", "=", resourceId)
        .select([
          "Resource.id",
          "Resource.type",
          "Resource.title",
          "Resource.permalink",
          "Resource.parentId",
          "Resource.siteId",
          "Resource.publishedVersionId",
        ])
        .executeTakeFirst()

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        })
      }

      return resource
    }),

  getNestedFolderChildrenOf: protectedProcedure
    .input(getNestedFolderChildrenSchema)
    .output(getNestedFolderChildrenOutputSchema)
    .query(async ({ ctx, input: { resourceId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        resourceIds: [resourceId],
        siteId,
        userId: ctx.user.id,
      })

      const resource = await db
        .selectFrom("Resource")
        .where("siteId", "=", siteId)
        .where("id", "=", resourceId)
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
              .where("Resource.siteId", "=", siteId)
              .where("Resource.parentId", "=", resourceId)
              // Use UNION (distinct) so recursion terminates even when
              // legacy cyclic resource graphs exist in production data.
              .union((unionEb) =>
                unionEb
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
          .where("id", "!=", resourceId)
          .select(["title", "permalink", "type", "id", "parentId"])
          .execute(),
      }
    }),

  getParentOf: protectedProcedure
    .input(getParentSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        resourceIds: [resourceId],
        siteId,
        userId: ctx.user.id,
      })

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

  getRolesFor: protectedProcedure
    .input(getRolesForSchema)
    .query(async ({ ctx, input: { resourceId, siteId } }) => 
      await getResourcePermission({
        resourceId: resourceId ?? null,
        siteId,
        userId: ctx.user.id,
      })
    ),

  getWithFullPermalink: protectedProcedure
    .input(getFullPermalinkSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        resourceIds: [resourceId],
        siteId,
        userId: ctx.user.id,
      })

      const result = await getWithFullPermalink({
        resourceIds: [resourceId],
        siteId,
      })

      if (result.length === 0 || !result[0]) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return result[0]
    }),

  listWithoutRoot: protectedProcedure
    .input(listResourceSchema)
    .query(
      async ({
        ctx,
        input: { siteId, resourceId, offset, limit, orderBy },
      }) => {
        await bulkValidateUserPermissionsForResources({
          action: "read",
          resourceIds: [
            isDefinedNumber(resourceId) ? String(resourceId) : null,
          ],
          siteId,
          userId: ctx.user.id,
        })

        let query = db
          .selectFrom("Resource")
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "!=", ResourceType.RootPage)
          .where("Resource.type", "!=", ResourceType.IndexPage)
          .where("Resource.type", "!=", ResourceType.FolderMeta)
          .where("Resource.type", "!=", ResourceType.CollectionMeta)

        query = isDefinedNumber(resourceId)
          ? query.where("Resource.parentId", "=", String(resourceId))
          : query
              .where("Resource.parentId", "is", null)
              .where("Resource.permalink", "!=", SEARCH_PAGE_PERMALINK)

        query = applyResourceOrderBy(query, orderBy)

        // Deferred: Add pagination support
        return await query
          .offset(offset)
          .limit(limit)
          .select([
            "Resource.id",
            "Resource.permalink",
            "Resource.title",
            "Resource.publishedVersionId",
            "Resource.draftBlobId",
            "Resource.type",
            "Resource.parentId",
            "Resource.updatedAt",
            "Resource.scheduledAt",
          ])
          .execute()
      },
    ),

  move: protectedProcedure
    .input(moveSchema)
    .mutation(
      async ({
        ctx,
        input: {
          siteId,
          movedResourceId,
          destinationResourceId,
          shouldCreateRedirect,
        },
      }) => {
        const isValid = await validateUserPermissionsForMove({
          from: movedResourceId,
          siteId,
          to: destinationResourceId,
          userId: ctx.user.id,
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

        let result
        try {
          result = await db.transaction().execute(async (tx) => {
            const toMove = await tx
              .selectFrom("Resource")
              .where("id", "=", movedResourceId)
              .selectAll()
              .executeTakeFirst()

            if (!toMove) {
              throw new TRPCError({ code: "BAD_REQUEST" })
            }

            let query = tx.selectFrom("Resource")
            query = hasNonEmptyString(destinationResourceId)
              ? query.where("id", "=", destinationResourceId)
              : query
                  .where("type", "=", ResourceType.RootPage)
                  .where("siteId", "=", siteId)
            const parent = await query
              .select(["id", "type", "siteId", "permalink", "parentId"])
              .executeTakeFirst()

            if (!parent) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Please ensure that you are trying to move your resource into a valid destination",
              })
            }

            const moveValidity = isResourceMoveValid(toMove, parent)
            if (moveValidity instanceof Error) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: moveValidity.message,
              })
            }

            if (
              toMove.type === "Folder" ||
              toMove.type === "Collection" ||
              toMove.type === "RootPage"
            ) {
              const descendants = await tx
                .withRecursive("Descendants", (eb) =>
                  eb
                    .selectFrom("Resource")
                    .select(["id"])
                    .where("Resource.parentId", "=", movedResourceId)
                    // Use UNION (distinct) so recursive traversal terminates
                    // even if legacy cyclic resource graphs exist.
                    .union((unionEb) =>
                      unionEb
                        .selectFrom("Resource")
                        .innerJoin(
                          "Descendants",
                          "Resource.parentId",
                          "Descendants.id",
                        )
                        .select(["Resource.id"]),
                    ),
                )
                .selectFrom("Descendants")
                .select(["id"])
                .execute()

              const descendantIds = descendants.map((d) => d.id)
              if (
                hasNonEmptyString(destinationResourceId) &&
                descendantIds.includes(destinationResourceId)
              ) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Cannot move a folder into one of its descendants",
                })
              }
            }

            // Old URL = current location (pre-UPDATE); new URL from the
            // unchanged destination + slug, so neither read is stale.
            const oldFullPermalink = await getResourceFullPermalink(
              siteId,
              Number(movedResourceId),
            )
            const destinationFullPermalink = hasNonEmptyString(
              destinationResourceId,
            )
              ? await getResourceFullPermalink(
                  siteId,
                  Number(destinationResourceId),
                )
              : null
            const newFullPermalink = `${destinationFullPermalink ?? ""}/${toMove.permalink}`

            await tx
              .updateTable("Resource")
              .where("siteId", "=", siteId)
              .where("id", "=", movedResourceId)
              .where("Resource.type", "in", [
                ResourceType.Page,
                ResourceType.CollectionPage,
                ResourceType.Folder,
                ResourceType.Collection,
                ResourceType.CollectionLink,
              ])
              .set({
                parentId: hasNonEmptyString(destinationResourceId)
                  ? destinationResourceId
                  : null,
              })
              .execute()

            const moved = await tx
              .selectFrom("Resource")
              .where("siteId", "=", siteId)
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
              by: user,
              delta: { after: moved, before: toMove },
              eventType: AuditLogEvent.ResourceUpdate,
              siteId,
            })

            // Keep redirects consistent with the new URL. Page/CollectionPage
            // get a single exact redirect for their own URL.
            if (
              (toMove.type === ResourceType.Page ||
                toMove.type === ResourceType.CollectionPage) &&
              oldFullPermalink !== null
            ) {
              await applyPermalinkChangeRedirects(tx, {
                byUserId: user.id,
                isPublished: toMove.publishedVersionId !== null,
                newFullPermalink,
                oldFullPermalink,
                resourceId: movedResourceId,
                shouldCreateRedirect,
                siteId,
              })
            }

            // A Folder/Collection has no URL of its own, but the move changes
            // every descendant's URL — preserve them with one wildcard redirect
            // ("/old-folder/*"), and validate no descendant lands on a URL an
            // existing redirect already covers.
            if (
              (toMove.type === ResourceType.Folder ||
                toMove.type === ResourceType.Collection) &&
              oldFullPermalink !== null
            ) {
              const hasLiveContent = await hasPublishedDescendant(tx, {
                resourceId: movedResourceId,
                siteId,
              })
              await applyFolderPermalinkChangeRedirects(tx, {
                byUserId: user.id,
                hasLiveContent,
                newFullPermalink,
                oldFullPermalink,
                resourceId: movedResourceId,
                shouldCreateRedirect,
                siteId,
              })
            }

            return moved
          })
        } catch (error: unknown) {
          // oxlint-disable-next-line anti-slop/no-unknown-parameters, typescript/no-confusing-void-expression -- PG error code check at driver boundary
          if (get(error, "code") === PG_ERROR_CODES.uniqueViolation) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A resource with the same permalink already exists",
            })
          }

          throw error
        }

        await publishResource(user.id, result, ctx.logger)
        return result
      },
    ),

  search: protectedProcedure
    .input(searchSchema)
    .output(searchOutputSchema)
    .query(
      async ({
        ctx,
        input: { siteId, query, resourceTypes, cursor: offset, limit },
      }) => {
        await validateUserPermissionsForSite({
          action: "read",
          siteId,
          userId: ctx.user.id,
        })

        if (!hasNonEmptyString(query)) {
          return {
            nextOffset: null,
            recentlyEdited: await getSearchRecentlyEdited({
              siteId,
            }),
            resources: [],
            totalCount: null,
          }
        }

        const searchResults = await getSearchResults({
          limit,
          offset,
          query,
          resourceTypes,
          siteId,
        })

        const totalCount = Number(searchResults.totalCount)
        const nextOffset = totalCount > offset + limit ? offset + limit : null
        return {
          nextOffset,
          recentlyEdited: [],
          resources: searchResults.resources,
          totalCount: Number(searchResults.totalCount),
        }
      },
    ),

  searchWithResourceIds: protectedProcedure
    .input(searchWithResourceIdsSchema)
    .output(searchWithResourceIdsOutputSchema)
    .query(async ({ ctx, input: { siteId, resourceIds } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        resourceIds: resourceIds.map((id) => id ?? null),
        siteId,
        userId: ctx.user.id,
      })

      if (resourceIds.length === 0) {
        return []
      }
      const resources = await getSearchWithResourceIds({
        resourceIds,
        siteId,
      })
      return resources.toSorted(
        // Sort resources to match order of input resourceIds
        (a, b) => resourceIds.indexOf(a.id) - resourceIds.indexOf(b.id),
      )
    }),
})
