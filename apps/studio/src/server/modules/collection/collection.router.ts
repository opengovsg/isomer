import type { UnwrapTagged } from "type-fest"
import { TRPCError } from "@trpc/server"
import { get, pick } from "lodash"

import {
  createCollectionSchema,
  editLinkSchema,
  readLinkSchema,
} from "~/schemas/collection"
import { readFolderSchema } from "~/schemas/folder"
import { createCollectionPageSchema } from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { logResourceEvent } from "../audit/audit.service"
import { db, jsonb, ResourceState, ResourceType } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import {
  defaultResourceSelect,
  getBlobOfResource,
  getSiteResourceById,
  publishResource,
  updateBlobById,
} from "../resource/resource.service"
import { defaultCollectionSelect } from "./collection.select"
import {
  createCollectionLinkJson,
  createCollectionPageJson,
} from "./collection.service"

export const collectionRouter = router({
  getMetadata: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      const resource = await getSiteResourceById({
        siteId,
        resourceId: String(resourceId),
        type: ResourceType.Collection,
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
      async ({
        ctx,
        input: { collectionTitle, permalink, siteId, parentFolderId },
      }) => {
        await bulkValidateUserPermissionsForResources({
          siteId,
          action: "create",
          userId: ctx.user.id,
          resourceIds: [!!parentFolderId ? String(parentFolderId) : null],
        })

        const user = await db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(() => new TRPCError({ code: "BAD_REQUEST" }))

        const result = await db.transaction().execute(async (tx) => {
          if (parentFolderId) {
            const parentFolder = await tx
              .selectFrom("Resource")
              .where("Resource.id", "=", String(parentFolderId))
              .where("Resource.siteId", "=", siteId)
              .select(["Resource.type", "Resource.id"])
              .executeTakeFirst()

            if (!parentFolder) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Parent folder does not exist",
              })
            }

            if (parentFolder.type !== ResourceType.Folder) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Collections can only be created inside other folders or at the root",
              })
            }
          }

          const collection = await tx
            .insertInto("Resource")
            .values({
              permalink,
              siteId,
              type: ResourceType.Collection,
              title: collectionTitle,
              parentId: parentFolderId ? String(parentFolderId) : null,
              state: ResourceState.Published,
            })
            .returningAll()
            .executeTakeFirstOrThrow()
            .catch((err) => {
              if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "A resource with the same permalink already exists",
                })
              }
              throw err
            })

          await logResourceEvent(tx, {
            siteId,
            eventType: "ResourceCreate",
            delta: { before: null, after: collection },
            by: user,
          })

          return collection
        })

        // TODO: Create the index page for the collection and publish it
        await publishResource(user.id, result, ctx.logger)

        return pick(result, defaultCollectionSelect)
      },
    ),
  createCollectionPage: protectedProcedure
    .input(createCollectionPageSchema)
    .mutation(async ({ ctx, input }) => {
      await bulkValidateUserPermissionsForResources({
        siteId: input.siteId,
        action: "create",
        userId: ctx.user.id,
        resourceIds: [!!input.collectionId ? String(input.collectionId) : null],
      })

      const user = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow(() => new TRPCError({ code: "BAD_REQUEST" }))

      let newPage: UnwrapTagged<PrismaJson.BlobJsonContent>
      const { title, type, permalink, siteId, collectionId } = input
      if (type === ResourceType.CollectionPage) {
        newPage = createCollectionPageJson({ type })
      } else {
        newPage = createCollectionLinkJson({ type })
      }

      const resource = await db.transaction().execute(async (tx) => {
        const parentCollection = await tx
          .selectFrom("Resource")
          .where("Resource.id", "=", String(collectionId))
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "=", ResourceType.Collection)
          .select(["Resource.type", "Resource.id"])
          .executeTakeFirst()

        if (!parentCollection) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent collection does not exist",
          })
        }

        const blob = await tx
          .insertInto("Blob")
          .values({
            content: jsonb(newPage),
          })
          .returningAll()
          .executeTakeFirstOrThrow()

        const addedResource = await tx
          .insertInto("Resource")
          .values({
            title,
            permalink,
            siteId,
            parentId: String(collectionId),
            draftBlobId: blob.id,
            type,
          })
          .returningAll()
          .executeTakeFirstOrThrow()
          .catch((err) => {
            if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
              })
            }
            throw err
          })

        await logResourceEvent(tx, {
          siteId,
          eventType: "ResourceCreate",
          by: user,
          delta: {
            before: null,
            after: { resource: addedResource, blob },
          },
        })

        return addedResource
      })
      return { pageId: resource.id }
    }),
  list: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input: { resourceId, siteId, limit, offset } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })
      // Things that aren't working yet:
      // 1. Last Edited user and time
      // 2. Page status(draft, published)

      return await ctx.db
        .selectFrom("Resource")
        .where("parentId", "=", String(resourceId))
        .where("Resource.siteId", "=", siteId)
        .where((eb) => {
          return eb.or([
            eb("Resource.type", "=", ResourceType.CollectionPage),
            eb("Resource.type", "=", ResourceType.CollectionLink),
            eb("Resource.type", "=", ResourceType.IndexPage),
          ])
        })
        .orderBy("Resource.type", "asc")
        .orderBy("Resource.title", "asc")
        .limit(limit)
        .offset(offset)
        .select(defaultResourceSelect)
        .execute()
    }),
  readCollectionLink: protectedProcedure
    .input(readLinkSchema)
    .query(async ({ ctx, input: { linkId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      const baseQuery = db
        .selectFrom("Resource")
        .where("Resource.id", "=", String(linkId))
        .where("Resource.siteId", "=", siteId)

      const draft = await baseQuery
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .select(["Blob.content", "Resource.title"])
        .executeTakeFirst()

      if (draft) return draft

      return baseQuery
        .innerJoin("Version", "Resource.publishedVersionId", "Version.id")
        .innerJoin("Blob", "Blob.id", "Version.blobId")
        .select(["Blob.content", "Resource.title"])
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "NOT_FOUND",
              message: "Unable to find the requested collection link",
            }),
        )
    }),

  updateCollectionLink: protectedProcedure
    .input(editLinkSchema)
    .mutation(
      async ({
        input: { date, category, linkId, siteId, description, ref },
        ctx,
      }) => {
        // Things that aren't working yet:
        // 1. Last Edited user and time
        // 2. Page status(draft, published)
        await bulkValidateUserPermissionsForResources({
          siteId,
          action: "update",
          userId: ctx.user.id,
        })

        const content = createCollectionLinkJson({
          type: ResourceType.CollectionLink,
        })

        const user = await db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(() => new TRPCError({ code: "BAD_REQUEST" }))

        return await db.transaction().execute(async (tx) => {
          const resource = await tx
            .selectFrom("Resource")
            .where("Resource.id", "=", String(linkId))
            .where("Resource.siteId", "=", siteId)
            .where("Resource.type", "=", ResourceType.CollectionLink)
            .selectAll()
            .executeTakeFirstOrThrow(
              () =>
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Unable to find the requested collection link",
                }),
            )

          const oldBlob = await getBlobOfResource({
            tx,
            resourceId: resource.id,
          })

          const blob = await updateBlobById(tx, {
            content: {
              ...content,
              page: { description, ref, date, category },
            },
            pageId: linkId,
            siteId,
          })

          await logResourceEvent(tx, {
            siteId,
            eventType: "ResourceUpdate",
            delta: {
              before: { blob: oldBlob, resource },
              after: { blob, resource },
            },
            by: user,
          })

          return blob
        })
      },
    ),
})
