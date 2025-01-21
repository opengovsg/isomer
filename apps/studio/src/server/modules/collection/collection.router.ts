import type { UnwrapTagged } from "type-fest"
import { TRPCError } from "@trpc/server"
import { get } from "lodash"

import {
  createCollectionSchema,
  editLinkSchema,
  readLinkSchema,
} from "~/schemas/collection"
import { readFolderSchema } from "~/schemas/folder"
import { createCollectionPageSchema } from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { publishSite } from "../aws/codebuild.service"
import { db, jsonb, ResourceState, ResourceType } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { validateUserPermissionsForResource } from "../permissions/permissions.service"
import {
  defaultResourceSelect,
  getSiteResourceById,
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
      await validateUserPermissionsForResource({
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
      async ({ ctx, input: { collectionTitle, permalink, siteId } }) => {
        await validateUserPermissionsForResource({
          siteId,
          action: "create",
          userId: ctx.user.id,
        })

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
            if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
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
    .mutation(async ({ ctx, input }) => {
      await validateUserPermissionsForResource({
        siteId: input.siteId,
        action: "create",
        userId: ctx.user.id,
        resourceId: !!input.collectionId ? String(input.collectionId) : null,
      })

      let newPage: UnwrapTagged<PrismaJson.BlobJsonContent>
      const { title, type, permalink, siteId, collectionId } = input
      if (type === ResourceType.CollectionPage) {
        newPage = createCollectionPageJson({ type })
      } else {
        newPage = createCollectionLinkJson({ type })
      }

      // TODO: Validate whether folderId actually is a folder instead of a page
      // TODO: Validate whether siteId is a valid site
      // TODO: Validate user has write-access to the site
      const resource = await db.transaction().execute(async (tx) => {
        const blob = await tx
          .insertInto("Blob")
          .values({
            content: jsonb(newPage),
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
            type,
          })
          .returning("Resource.id")
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
        return addedResource
      })
      return { pageId: resource.id }
    }),
  // TODO: change this schema
  getSiblingsOf: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input: { resourceId, siteId, limit, offset } }) => {
      // Things that aren't working yet:
      // 0. Perm checking
      // 1. Last Edited user and time
      // 2. Page status(draft, published)
      return await ctx.db.transaction().execute(async (tx) => {
        const resource = await tx
          .selectFrom("Resource")
          .where("Resource.id", "=", String(resourceId))
          .where((eb) => {
            return eb.or([
              eb("Resource.type", "=", ResourceType.CollectionPage),
              eb("Resource.type", "=", ResourceType.CollectionLink),
            ])
          })
          .select("Resource.parentId")
          .executeTakeFirst()

        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Please ensure that you have requested for a collection",
          })
        }

        return tx
          .selectFrom("Resource")
          .where("Resource.parentId", "=", resource.parentId)
          .where("Resource.siteId", "=", siteId)
          .where((eb) => {
            return eb.or([
              eb("Resource.type", "=", ResourceType.CollectionPage),
              eb("Resource.type", "=", ResourceType.CollectionLink),
            ])
          })
          .orderBy("Resource.type", "asc")
          .orderBy("Resource.title", "asc")
          .limit(limit)
          .offset(offset)
          .select(defaultResourceSelect)
          .execute()
      })
    }),
  list: protectedProcedure
    .input(readFolderSchema)
    .query(async ({ ctx, input: { resourceId, siteId, limit, offset } }) => {
      await validateUserPermissionsForResource({
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
    .query(async ({ input: { linkId, siteId } }) => {
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
        .executeTakeFirstOrThrow()
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
        await validateUserPermissionsForResource({
          userId: ctx.user.id,
          siteId,
          action: "update",
        })

        const content = createCollectionLinkJson({
          type: ResourceType.CollectionLink,
        })

        await db.transaction().execute(async (tx) => {
          return updateBlobById(tx, {
            content: {
              ...content,
              page: { description, ref, date, category },
            },
            pageId: linkId,
            siteId,
          })
        })

        return await db.transaction().execute(async (tx) => {
          const { draftBlobId } = await tx
            .selectFrom("Resource")
            .where("Resource.id", "=", String(linkId))
            .where("Resource.siteId", "=", siteId)
            .select("Resource.draftBlobId")
            .executeTakeFirstOrThrow()

          const { content } = await tx
            .selectFrom("Blob")
            .where("Blob.id", "=", draftBlobId)
            .select("Blob.content")
            .executeTakeFirstOrThrow()

          await tx
            .updateTable("Blob")
            .where("Blob.id", "=", draftBlobId)
            .set({
              content: {
                ...content,
                page: { description, ref, date, category },
              },
            })
            .execute()
        })
      },
    ),
})
